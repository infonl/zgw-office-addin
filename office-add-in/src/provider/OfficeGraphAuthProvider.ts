/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { GraphAuthProvider } from "../service/GraphService";

// Fallback: if SSO token audience is not Graph, use MSAL
import { MsalAuthSingleton } from "./MsalAuthSingleton";
import { getValidatedFrontendEnv } from "./envFrontendSchema";

/**
 * Microsoft Graph authentication provider for Office Add-ins
 * Uses Office.js authentication context to obtain Graph API tokens
 */
export class OfficeGraphAuthProvider implements GraphAuthProvider {
  private tokenCache: { token: string; expires: number } | null = null;
  private tokenRequest: Promise<string> | null = null;
  private readonly requiredScopes = ["Mail.Read", "User.Read"] as const;
  private readonly env = getValidatedFrontendEnv();

  private isGraphAudience(payload: any): boolean {
    const graphAppId = "00000003-0000-0000-c000-000000000000";
    return payload?.aud === "https://graph.microsoft.com" || payload?.aud === graphAppId;
  }

  private decodeJwtPayload(token: string): any | null {
    try {
      const jwtParts = token.split(".");
      if (jwtParts.length !== 3) return null;
      return JSON.parse(atob(jwtParts[1]));
    } catch {
      return null;
    }
  }

  private tokenHasScopes(payload: any, scopes: readonly string[]): boolean {
    // "scp" is a space-delimited string of delegated scopes
    if (!payload || typeof payload.scp !== "string") return false;
    const grantedScopesSet = new Set(
      payload.scp
        .split(" ")
        .map((scopeName: string) => scopeName.trim())
        .filter(Boolean)
    );
    return scopes.every((requiredScope) => grantedScopesSet.has(requiredScope));
  }

  private getMsalSingletonInstance(): MsalAuthSingleton {
    if (this.env.APP_ENV !== "local") throw new Error("MSAL singleton only on local development");
    const config = {
      auth: {
        clientId: this.env.MSAL_CLIENT_ID,
        authority: this.env.MSAL_AUTHORITY,
        redirectUri: this.env.MSAL_REDIRECT_URI,
      },
      cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
      },
    };
    return MsalAuthSingleton.getInstance(config);
  }

  async getAccessToken(): Promise<string> {
    if (typeof Office !== "undefined" && typeof Office.onReady === "function") {
      await Office.onReady();
    }

    // Return cached token if still valid (with 5 min buffer)
    if (this.tokenCache && this.tokenCache.expires > Date.now() + 5 * 60 * 1000) {
      console.log("🔄 Using cached Graph API token");
      return this.tokenCache.token;
    }

    // If there's already a token request in progress, wait for it
    if (this.tokenRequest) {
      console.log("⏳ Waiting for existing token request to complete...");
      return this.tokenRequest;
    }

    // Start new token request
    this.tokenRequest = new Promise((resolve, reject) => {
      console.log("🔑 Requesting new Graph API access token...");

      // Use Office SSO (Single Sign-On) to get Graph API access token
      Office.auth
        .getAccessToken({
          allowSignInPrompt: true,
          allowConsentPrompt: true,
          forMSGraphAccess: true,
        })
        .then(async (token) => {
          let jwtPayload = this.decodeJwtPayload(token);

          // Log scopes
          console.log("🔎 TOKEN.SCP (scopes):", jwtPayload?.scp);
          console.log("🔎 TOKEN.AUD:", jwtPayload?.aud);
          console.log(
            "🔎 TOKEN.APPID / ROLES:",
            jwtPayload?.appid ?? jwtPayload?.azp,
            jwtPayload?.roles
          );
          console.log("🔎 TOKEN.EXP:", jwtPayload?.exp, "iat:", jwtPayload?.iat);

          // Ensure audience is Graph; otherwise fall back to MSAL
          const isGraphAudience = this.isGraphAudience(jwtPayload);

          // If we have a Graph token but it's missing required scopes (e.g. Mail.Read),
          // attempt an MSAL upgrade to those scopes (silent first, then popup).
          if (
            isGraphAudience &&
            !this.tokenHasScopes(jwtPayload, this.requiredScopes) &&
            this.env.MSAL_CLIENT_ID
          ) {
            const missingScopes = this.requiredScopes.filter(
              (requiredScope) => !(jwtPayload?.scp ?? "").includes(requiredScope)
            );
            console.warn(
              "⚠️ Graph token missing scopes %o — attempting MSAL scope upgrade...",
              missingScopes
            );
            try {
              // MSAL fallback
              const msalSingleton = this.getMsalSingletonInstance();
              const upgradedToken = await msalSingleton.getAccessToken([...this.requiredScopes]);
              token = upgradedToken;
              jwtPayload = this.decodeJwtPayload(upgradedToken);
              console.log("✅ Upgraded token scopes:", jwtPayload?.scp);
            } catch (msalUpgradeError) {
              console.warn(
                "⚠️ MSAL scope upgrade failed; continuing with existing token. Error:",
                msalUpgradeError
              );
            }
          }

          // Cache token using JWT exp if present; fallback to 50 minutes
          let tokenExpiryTimestamp = Date.now() + 50 * 60 * 1000;
          try {
            const jwtPayload = this.decodeJwtPayload(token);
            if (jwtPayload && typeof jwtPayload.exp === "number") {
              tokenExpiryTimestamp = jwtPayload.exp * 1000;
            }
          } catch {
            console.log("Could not decode token exp, using default lifetime");
          }

          this.tokenCache = { token, expires: tokenExpiryTimestamp - 5 * 60 * 1000 };
          this.tokenRequest = null;
          return resolve(token);
        })
        .catch(async (error) => {
          // Try MSAL fallback for client/UI errors if configured
          if (error?.code === 13006 || error?.code === 13008 || error?.code === 13009) {
            try {
              console.log("🛟 Falling back to MSAL (popup) ...");
              const msalSingleton = this.getMsalSingletonInstance();
              const msalToken = await msalSingleton.getAccessToken([...this.requiredScopes]);
              // set cache using JWT exp if present
              let msalTokenExpiryTimestamp = Date.now() + 50 * 60 * 1000;
              const msalJwtPayload = this.decodeJwtPayload(msalToken);
              if (msalJwtPayload && typeof msalJwtPayload.exp === "number") {
                msalTokenExpiryTimestamp = msalJwtPayload.exp * 1000;
              }
              this.tokenCache = {
                token: msalToken,
                expires: msalTokenExpiryTimestamp - 5 * 60 * 1000,
              };
              this.tokenRequest = null;
              return resolve(msalToken);
            } catch (msalErr) {
              console.warn("MSAL fallback failed:", msalErr);
            }
          }

          console.error("❌ Graph API authentication failed:", {
            code: error.code,
            name: error.name,
            message: error.message,
          });

          // Clear any cached token and request promise on failure
          this.tokenCache = null;
          this.tokenRequest = null;

          // Provide more specific error messages based on error codes
          let errorMessage;

          switch (error.code) {
            case 13001:
              errorMessage = "User is not signed in to Office. Please sign in first.";
              break;
            case 13002:
              errorMessage = "User consent required. Please allow Graph API access.";
              break;
            case 13003:
              errorMessage = "Add-in domain not trusted. Check manifest configuration.";
              break;
            case 13004:
              errorMessage = "Invalid resource specified for authentication.";
              break;
            case 13005:
              errorMessage = "Platform doesn't support this authentication method.";
              break;
            case 13006:
              errorMessage =
                "Authentication client error. This may be a temporary issue - please try again.";
              break;
            case 13007:
              errorMessage = "Authentication request was cancelled by user.";
              break;
            case 13008:
              errorMessage = "Authentication dialog cannot be displayed.";
              break;
            case 13009:
              errorMessage = "Authentication dialog was closed unexpectedly.";
              break;
            default:
              errorMessage = error.message || "Unexpected authentication error";
          }

          reject(new Error(`Graph authentication failed: ${errorMessage} (Code: ${error.code})`));
        });
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
