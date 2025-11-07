/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { GraphAuthProvider } from "../service/GraphService";

/**
 * Microsoft Graph authentication provider for Office Add-ins
 * Uses Office.js authentication context to obtain Graph API tokens
 */
export class OfficeGraphAuthProvider implements GraphAuthProvider {
  private tokenCache: { token: string; expires: number } | null = null;
  private tokenRequest: Promise<string> | null = null;

  async getAccessToken(): Promise<string> {
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
        .then((token) => {
          console.log("✅ Graph API token obtained successfully");

          // Check if we have the right audience for Graph API
          let hasCorrectAudience = false;
          try {
            const tokenParts = token.split(".");
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));

              // Check if audience is correct for Graph API
              hasCorrectAudience =
                payload.aud === "https://graph.microsoft.com" ||
                payload.aud === "00000003-0000-0000-c000-000000000000"; // Graph resource ID
            }
          } catch {
            console.log("Could not decode token");
          }

          // If we don't have the right audience, this is expected in localhost
          if (!hasCorrectAudience) {
            console.log("⚠️  Graph API tokens not available in localhost development");
            console.log("💡 This will work in production deployment");

            // In localhost, we can't get proper Graph tokens, so we reject
            throw new Error(
              "Graph API tokens not available in localhost development. " +
                "This will work in production deployment."
            );
          }

          // Cache token for 50 minutes (typical token lifetime is 60 min)
          this.tokenCache = {
            token,
            expires: Date.now() + 50 * 60 * 1000,
          };

          // Clear the request promise
          this.tokenRequest = null;

          resolve(token);
        })
        .catch((error) => {
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
