/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { GraphAuthProvider } from "../service/GraphService";

// Fallback: if SSO token audience is not Graph, use MSAL
import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: "696724da-f71f-40c4-9dce-53ab2bc8e0cb",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "https://localhost:3000",
  },
};
const msalInstance = new PublicClientApplication(msalConfig);

declare global {
  interface Window {
    ZGW_AAD_CLIENT_ID?: string;
    ZGW_REDIRECT_URI?: string;
    ZGW_AUTHORITY?: string;
  }
}

/**
 * Microsoft Graph authentication provider for Office Add-ins
 * Uses Office.js authentication context to obtain Graph API tokens
 */
export class OfficeGraphAuthProvider implements GraphAuthProvider {
  private tokenCache: { token: string; expires: number } | null = null;
  private tokenRequest: Promise<string> | null = null;

  // Scopes needed for our Outlook scenario (reading message bodies/EML + basic profile)
  private readonly requiredScopes = ["Mail.Read", "User.Read"] as const;

  private decodeJwtPayload(token: string): any | null {
    try {
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) return null;
      return JSON.parse(atob(tokenParts[1]));
    } catch {
      return null;
    }
  }

  private tokenHasScopes(payload: any, scopes: readonly string[]): boolean {
    // "scp" is a space-delimited string of delegated scopes
    if (!payload || typeof payload.scp !== "string") return false;
    const granted = new Set(
      payload.scp
        .split(" ")
        .map((s: string) => s.trim())
        .filter(Boolean)
    );
    return scopes.every((s) => granted.has(s));
  }

  async getAccessToken(): Promise<string> {
    // Ensure Office is ready before attempting auth
    // @ts-ignore
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
          // --- Inspect the token we received from Office SSO
          let payload = this.decodeJwtPayload(token);

          // Log scopes
          console.log("🔎 TOKEN.SCP (scopes):", payload?.scp);
          if (!payload?.scp || !payload.scp.includes("Mail.Read")) {
            console.warn("⚠️ JWT token mist Mail.Read scope! Scopes:", payload?.scp);
          }

          console.log("🔎 TOKEN.AUD:", payload?.aud);
          console.log("🔎 TOKEN.APPID / ROLES:", payload?.appid ?? payload?.azp, payload?.roles);
          console.log("🔎 TOKEN.EXP:", payload?.exp, "iat:", payload?.iat);

          // Ensure audience is Graph; otherwise fall back to MSAL
          const graphAppId = "00000003-0000-0000-c000-000000000000";
          const isGraphAudience =
            payload?.aud === "https://graph.microsoft.com" || payload?.aud === graphAppId;

          if (!isGraphAudience) {
            console.warn("⚠️ Token audience is not Graph (aud=%o).", payload?.aud);
            if (window.ZGW_AAD_CLIENT_ID) {
              console.log("🛟 Falling back to MSAL to request a Graph audience token...");
              const msalToken = await this.getMsalAccessToken();
              token = msalToken;
              payload = this.decodeJwtPayload(msalToken);
              console.log("✅ MSAL token audience:", payload?.aud, "scopes:", payload?.scp);
            } else {
              console.warn(
                "ℹ️ MSAL fallback is disabled because window.ZGW_AAD_CLIENT_ID is not set. " +
                  "Add a small config script in taskpane.html to set ZGW_AAD_CLIENT_ID, ZGW_AUTHORITY and ZGW_REDIRECT_URI."
              );
            }
          }

          // If we have a Graph token but it's missing required scopes (e.g. Mail.Read),
          // attempt an MSAL upgrade to those scopes (silent first, then popup).
          if (
            isGraphAudience &&
            !this.tokenHasScopes(payload, this.requiredScopes) &&
            window.ZGW_AAD_CLIENT_ID
          ) {
            const missing = this.requiredScopes.filter((s) => !(payload?.scp ?? "").includes(s));
            console.warn(
              "⚠️ Graph token missing scopes %o — attempting MSAL scope upgrade...",
              missing
            );
            try {
              const upgraded = await this.getMsalAccessToken(this.requiredScopes);
              token = upgraded;
              payload = this.decodeJwtPayload(upgraded);
              console.log("✅ Upgraded token scopes:", payload?.scp);
            } catch (e) {
              console.warn(
                "⚠️ MSAL scope upgrade failed; continuing with existing token. Error:",
                e
              );
            }
          }

          // Cache token using JWT exp if present; fallback to 50 minutes
          let expiresAt = Date.now() + 50 * 60 * 1000;
          try {
            const p = this.decodeJwtPayload(token);
            if (p && typeof p.exp === "number") expiresAt = p.exp * 1000;
          } catch {
            console.log("Could not decode token exp, using default lifetime");
          }

          this.tokenCache = { token, expires: expiresAt - 5 * 60 * 1000 };
          this.tokenRequest = null;
          return resolve(token);
        })
        .catch(async (error) => {
          // Try MSAL fallback for client/UI errors if configured
          if (
            (error?.code === 13006 || error?.code === 13008 || error?.code === 13009) &&
            window.ZGW_AAD_CLIENT_ID
          ) {
            try {
              console.log("🛟 Falling back to MSAL (popup) ...");
              const msalToken = await this.getMsalAccessToken(this.requiredScopes);

              // set cache using JWT exp if present
              let expiresAt = Date.now() + 50 * 60 * 1000;
              const payload = this.decodeJwtPayload(msalToken);
              if (payload && typeof payload.exp === "number") expiresAt = payload.exp * 1000;

              this.tokenCache = { token: msalToken, expires: expiresAt - 5 * 60 * 1000 };
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
          let errorMessage = "Unknown authentication error";

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

  private async getMsalAccessToken(scopesOverride?: readonly string[]): Promise<string> {
    const clientId = window.ZGW_AAD_CLIENT_ID;
    if (!clientId)
      throw new Error("MSAL fallback not configured: window.ZGW_AAD_CLIENT_ID missing");

    const scopes = { scopes: (scopesOverride ?? this.requiredScopes) as string[] };
    console.log("🧭 Requesting MSAL scopes:", scopes.scopes.join(" "));

    await msalInstance.initialize();
    const response = await msalInstance.loginPopup(scopes);
    return response.accessToken;
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
