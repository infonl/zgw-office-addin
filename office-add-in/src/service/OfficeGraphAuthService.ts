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
import { getToken } from "../utils/getAccesToken";

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

  private async exchangeTokenWithBackend(bootstrapToken: string): Promise<string> {
    const baseUrl = "https://localhost:3003";

    const response = await fetch(baseUrl + "/auth/obo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: bootstrapToken }),
    });

    if (!response.ok) {
      const message = await response.text();
      this.logger.ERROR("❌ OBO backend error:", message);
      throw new Error("Backend OBO failed: " + message);
    }

    const { access_token } = await response.json();
    return access_token;
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

    this.tokenRequest = new Promise<string>((resolve, reject) => {
      getToken().then(resolve).catch(reject);
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
        // We hebben *geen* Graph token, maar een Office bootstrap token.
        // Stuur naar backend OBO flow.
        this.logger.DEBUG("🔁 Performing OBO exchange on backend...");

        const graphToken = await this.exchangeTokenWithBackend(token);
        this.logger.DEBUG("✅ OBO exchange completed, received Graph token.", graphToken);

        // decode payload to determine caching
        const graphPayload = this.decodeJwtPayload(graphToken);
        let expiryTimestamp = addMinutes(new Date(), 50).getTime();
        this.logger.DEBUG("🔎 GRAPH PAYLOAD", graphPayload);
        if (!graphPayload) {
          this.logger.ERROR("❌ Unable to decode Graph token payload");
          throw new Error("Unable to decode Graph token payload");
        }

        // 1️⃣ Controleer audience
        if (!this.isGraphAudience(graphPayload)) {
          this.logger.ERROR("❌ Graph token audience invalid", { aud: graphPayload.aud });
          throw new Error(`Graph token has invalid audience: ${graphPayload.aud}`);
        }

        // 2️⃣ Controleer scopes
        const hasRequiredScopes = this.tokenHasScopes(graphPayload, this.requiredScopes);
        if (!hasRequiredScopes) {
          const grantedScopes = graphPayload.scp?.split(" ") || [];
          this.logger.ERROR("❌ Graph token missing required scopes", {
            required: this.requiredScopes,
            granted: grantedScopes,
          });
          throw new Error(
            `Graph token missing required scopes. Required: ${this.requiredScopes.join(
              ", "
            )}. Granted: ${grantedScopes.join(", ")}`
          );
        }

        if (graphPayload?.exp) {
          expiryTimestamp = graphPayload.exp * 1000;
        }

        this.tokenCache = {
          token: graphToken,
          expires: addMinutes(new Date(expiryTimestamp), -TOKEN_EXPIRY_OFFSET_MINUTES).getTime(),
        };

        this.logger.DEBUG("✅ Graph token acquired via OBO backend flow");
        return graphToken;
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
