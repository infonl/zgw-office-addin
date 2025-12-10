/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import type { GraphAuthService } from "./GraphTypes";
import { useLogger } from "../hooks/useLogger";

import { MsalAuthContextType } from "../provider/MsalAuthProvider";
import { FRONTEND_ENV } from "../provider/envFrontendSchema";
import { addMinutes } from "date-fns";
import { MicrosoftJwtPayload } from "./GraphTypes";
import { TOKEN_EXPIRY_OFFSET_MINUTES } from "../constants";
import { jwtDecode } from "jwt-decode";

interface ExtendedOfficeContext extends Office.Context {
  auth?: {
    getAccessTokenAsync: (
      _options: {
        forMSGraphAccess?: boolean;
        allowSignInPrompt?: boolean;
        allowConsentPrompt?: boolean;
      },
      _callback: (_result: {
        status: Office.AsyncResultStatus;
        value?: string;
        error?: Office.Error;
      }) => void
    ) => void;
  };
}

/**
 * Microsoft Graph authentication service for Office Add-ins
 * Uses Office.js authentication context to obtain Graph API tokens
 */
export class OfficeGraphAuthService implements GraphAuthService {
  private logger;
  private tokenCache: { token: string; expires: number } | null = null;
  private tokenRequest: Promise<string> | null = null;
  private readonly requiredScopes = ["Mail.Read", "User.Read"] as const;
  private readonly env = FRONTEND_ENV;
  private msalAuth: MsalAuthContextType | null = null;

  constructor(logger: ReturnType<typeof useLogger>) {
    this.logger = logger;
  }

  setMsalAuth(msalAuth: MsalAuthContextType | null) {
    this.msalAuth = msalAuth;
  }

  // Check if access token is for Microsoft Graph by validating audience.
  // For value of id: https://web.archive.org/web/20241114222012/https://learn.microsoft.com/en-us/troubleshoot/entra/entra-id/governance/verify-first-party-apps-sign-in#application-ids-of-commonly-used-microsoft-applications
  private isGraphAudience(payload: MicrosoftJwtPayload): boolean {
    const graphAppId = "00000003-0000-0000-c000-000000000000";
    return payload?.aud === "https://graph.microsoft.com" || payload?.aud === graphAppId;
  }

  private decodeJwtPayload(token: string): MicrosoftJwtPayload | null {
    try {
      return jwtDecode<MicrosoftJwtPayload>(token);
    } catch {
      return null;
    }
  }

  private tokenHasScopes(payload: MicrosoftJwtPayload, scopes: readonly string[]): boolean {
    // "scp" is a space-delimited string of delegated scopes
    const grantedScopesSet = new Set(
      payload.scp
        ?.split(" ")
        .map((scopeName: string) => scopeName.trim())
        .filter(Boolean)
    );
    return scopes.every((requiredScope) => grantedScopesSet.has(requiredScope));
  }

  async getAccessToken(): Promise<string> {
    await Office.onReady();

    if (
      this.tokenCache &&
      this.tokenCache.expires > addMinutes(new Date(), TOKEN_EXPIRY_OFFSET_MINUTES).getTime()
    ) {
      this.logger.DEBUG("🔄 Using cached Graph API token");
      return Promise.resolve(this.tokenCache.token);
    }

    if (this.tokenRequest) {
      this.logger.DEBUG("⏳ Waiting for existing token request to complete...");
      return this.tokenRequest;
    }

    this.logger.DEBUG("🔑 Requesting new Graph API access token...");

    // Use Office SSO (Single Sign-On) to get Graph API access token
    this.tokenRequest = new Promise<string>((resolve, reject) => {
      const officeContext = Office.context as ExtendedOfficeContext;
      if (officeContext.auth?.getAccessTokenAsync) {
        this.logger.DEBUG("office context");
        officeContext.auth.getAccessTokenAsync(
          {
            forMSGraphAccess: true,
            allowSignInPrompt: true,
            allowConsentPrompt: true,
          },
          (result) => {
            if (result.status === Office.AsyncResultStatus.Succeeded) {
              resolve(result.value!);
            } else {
              reject(result.error);
            }
          }
        );
      } else {
        // Fallback to Office.auth.getAccessToken if context.auth is not available
        this.logger.DEBUG("office without context");
        Office.auth
          .getAccessToken({
            forMSGraphAccess: true,
            allowSignInPrompt: true,
            allowConsentPrompt: true,
          })
          .then(resolve)
          .catch(reject);
      }
    })
      .then(async (token) => {
        let jwtPayload = this.decodeJwtPayload(token);

        this.logger.DEBUG("🔎 TOKEN.SCP (scopes):", jwtPayload?.scp);
        this.logger.DEBUG("🔎 TOKEN.AUD:", jwtPayload?.aud);
        this.logger.DEBUG(
          "🔎 TOKEN.APPID / ROLES:",
          jwtPayload?.appid ?? jwtPayload?.azp,
          jwtPayload?.roles
        );
        this.logger.DEBUG("🔎 TOKEN.EXP:", jwtPayload?.exp, "iat:", jwtPayload?.iat);

        // Validate that Office SSO actually returned a Graph API token
        if (!jwtPayload) {
          this.logger.ERROR("❌ Failed to decode Office SSO token");
          throw new Error("Failed to decode Office SSO token");
        }

        const isGraphToken = this.isGraphAudience(jwtPayload);
        this.logger.DEBUG("🔍 Token validation:", {
          audience: jwtPayload.aud,
          isGraphAudience: isGraphToken,
          expectedGraphAudiences: [
            "https://graph.microsoft.com",
            "00000003-0000-0000-c000-000000000000",
          ],
        });

        if (!isGraphToken) {
          this.logger.ERROR("❌ Office SSO returned app token instead of Graph token", {
            received: jwtPayload.aud,
            expected: "https://graph.microsoft.com or 00000003-0000-0000-c000-000000000000",
            forMSGraphAccess: true,
          });
          throw new Error(
            `Office SSO failed to return Graph token. Got audience: ${jwtPayload.aud}`
          );
        }

        const hasRequiredScopes = this.tokenHasScopes(jwtPayload, this.requiredScopes);
        const grantedScopes = jwtPayload.scp?.split(" ") || [];
        this.logger.DEBUG("🔒 Scope validation:", {
          required: this.requiredScopes,
          granted: grantedScopes,
          hasAllRequired: hasRequiredScopes,
        });

        if (!hasRequiredScopes) {
          this.logger.ERROR("❌ Graph token missing required scopes", {
            required: this.requiredScopes,
            granted: grantedScopes,
          });
          throw new Error(
            `Graph token missing required scopes. Required: ${this.requiredScopes.join(", ")}. Granted: ${grantedScopes.join(", ")}`
          );
        }

        this.logger.DEBUG("✅ Valid Graph API token received from Office SSO");

        // Cache token using JWT exp if present; fallback to 50 minutes
        let tokenExpiryTimestamp = addMinutes(new Date(), 50).getTime();
        try {
          if (jwtPayload && typeof jwtPayload.exp === "number") {
            tokenExpiryTimestamp = jwtPayload.exp * 1000;
          }
        } catch {
          this.logger.DEBUG("Could not decode token exp, using default lifetime");
        }

        this.tokenCache = {
          token,
          expires: addMinutes(
            new Date(tokenExpiryTimestamp),
            -TOKEN_EXPIRY_OFFSET_MINUTES
          ).getTime(),
        };
        return token;
      })
      .catch(async (error) => {
        this.logger.ERROR("❌ Office SSO Graph authentication failed:", {
          code: error?.code,
          name: error?.name,
          message: error?.message,
          environment: this.env.APP_ENV,
        });

        if (this.env.APP_ENV === "local") {
          this.logger.DEBUG("🛟 Falling back to MSAL (local only)...");
          try {
            if (this.msalAuth) {
              const msalToken = await this.msalAuth.getAccessToken([...this.requiredScopes]);
              let msalTokenExpiryTimestamp = addMinutes(new Date(), 50).getTime();
              const msalJwtPayload = this.decodeJwtPayload(msalToken);
              if (msalJwtPayload && typeof msalJwtPayload.exp === "number") {
                msalTokenExpiryTimestamp = msalJwtPayload.exp * 1000;
              }
              this.tokenCache = {
                token: msalToken,
                expires: addMinutes(
                  new Date(msalTokenExpiryTimestamp),
                  -TOKEN_EXPIRY_OFFSET_MINUTES
                ).getTime(),
              };
              return msalToken;
            } else {
              this.logger.ERROR(
                "MSAL fallback requested but msalAuth is not available. Cannot acquire token in local environment."
              );
            }
          } catch (msalError) {
            this.logger.ERROR("⚠️ MSAL fallback also failed:", msalError);
          }
        } else {
          this.logger.ERROR("❌ Office SSO must work on test/prod. MSAL fallback not available.", {
            suggestion: "Check Azure AD app registration and Graph API permissions",
          });
        }

        this.tokenCache = null;

        const errorCode = error?.code || "unknown";
        const errorMessage = error?.message || "Authentication error from Office SSO.";

        throw new Error(`Graph authentication failed: ${errorMessage} (Code: ${errorCode})`);
      })
      .finally(() => {
        this.tokenRequest = null;
      });

    return this.tokenRequest;
  }

  /**
   * Check if the user is authenticated and has proper Graph permissions
   */
  async validateGraphAccess(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }
}
