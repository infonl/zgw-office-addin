/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { GraphAuthService } from "./GraphService";
import { useLogger } from "../hooks/useLogger";

// Fallback: if SSO token audience is not Graph, use MSAL
import { MsalAuthContextType } from "../provider/MsalAuthProvider";
import { FRONTEND_ENV } from "../provider/envFrontendSchema";
import { addMinutes } from "date-fns";
import { MicrosoftJwtPayload } from "./GraphTypes";
import { jwtDecode } from "jwt-decode";

/**
 * Microsoft Graph authentication service for Office Add-ins
 * Uses Office.js authentication context to obtain Graph API tokens
 */
export class OfficeGraphAuthService implements GraphAuthService {
  private logger;
  private static readonly TOKEN_EXPIRY_OFFSET_MINUTES = 5;
  private tokenCache: { token: string; expires: number } | null = null;
  private tokenRequest: Promise<string> | null = null;
  private readonly requiredScopes = ["Mail.Read", "User.Read"] as const;
  private readonly env = FRONTEND_ENV;
  private msalAuth: MsalAuthContextType | null = null;

  constructor(logger: ReturnType<typeof useLogger>) {
    this.logger = logger;
  }

  setMsalAuth(msalAuth: MsalAuthContextType) {
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
      this.tokenCache.expires >
        addMinutes(new Date(), OfficeGraphAuthService.TOKEN_EXPIRY_OFFSET_MINUTES).getTime()
    ) {
      this.logger.DEBUG("🔄 Using cached Graph API token");
      return this.tokenCache.token;
    }

    if (this.tokenRequest) {
      this.logger.DEBUG("⏳ Waiting for existing token request to complete...");
      return this.tokenRequest;
    }

    this.logger.DEBUG("🔑 Requesting new Graph API access token...");

    // Use Office SSO (Single Sign-On) to get Graph API access token
    this.tokenRequest = Office.auth
      .getAccessToken({
        allowSignInPrompt: true,
        allowConsentPrompt: true,
        forMSGraphAccess: true,
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

        // Ensure audience is Graph; otherwise fall back to MSAL
        const isGraphAudience = jwtPayload ? this.isGraphAudience(jwtPayload) : false;

        // If Graph token is missing the required scopes attempt an MSAL upgrade to those scopes.
        if (
          isGraphAudience &&
          jwtPayload &&
          !this.tokenHasScopes(jwtPayload, this.requiredScopes) &&
          this.env.MSAL_CLIENT_ID
        ) {
          const missingScopes = this.requiredScopes.filter(
            (requiredScope) => !(jwtPayload?.scp ?? "").includes(requiredScope)
          );
          this.logger.WARN(
            "⚠️ Graph token missing scopes %o — attempting MSAL scope upgrade...",
            missingScopes
          );
          try {
            // MSAL fallback
            if (this.msalAuth) {
              const upgradedToken = await this.msalAuth.getAccessToken([...this.requiredScopes]);
              token = upgradedToken;
              jwtPayload = this.decodeJwtPayload(upgradedToken);
              this.logger.DEBUG("✅ Upgraded token scopes:", jwtPayload?.scp);
            }
          } catch (msalUpgradeError) {
            this.logger.WARN(
              "⚠️ MSAL scope upgrade failed; continuing with existing token. Error:",
              msalUpgradeError
            );
          }
        }

        // Cache token using JWT exp if present; fallback to 50 minutes
        let tokenExpiryTimestamp = addMinutes(new Date(), 50).getTime();
        try {
          const jwtPayload = this.decodeJwtPayload(token);
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
            -OfficeGraphAuthService.TOKEN_EXPIRY_OFFSET_MINUTES
          ).getTime(),
        };
        return token;
      })
      .catch(async (error) => {
        this.logger.ERROR("Graph API authentication failed (Office SSO):", {
          code: error?.code,
          name: error?.name,
          message: error?.message,
        });

        try {
          this.logger.DEBUG("🛟 Falling back to MSAL (local only)) ...");
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
                -OfficeGraphAuthService.TOKEN_EXPIRY_OFFSET_MINUTES
              ).getTime(),
            };
            return msalToken;
          }
        } catch (msalError) {
          this.logger.WARN("⚠️ MSAL fallback failed:", msalError);
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
