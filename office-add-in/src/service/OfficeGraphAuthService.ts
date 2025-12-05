/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import type { GraphAuthService } from "./GraphTypes";
import { useLogger } from "../hooks/useLogger";
import { MsalAuthContextType } from "../provider/MsalAuthProvider";
import { addMinutes } from "date-fns";
import { MicrosoftJwtPayload } from "./GraphTypes";
import { TOKEN_EXPIRY_OFFSET_MINUTES } from "../constants";
import { jwtDecode } from "jwt-decode";

export class OfficeGraphAuthService implements GraphAuthService {
  private logger;
  private tokenCache: { token: string; expires: number } | null = null;
  private tokenRequest: Promise<string> | null = null;
  private readonly requiredScopes = ["Mail.Read", "User.Read"] as const;
  private msalAuth: MsalAuthContextType | null = null;
  // ✅ Geen private env property meer!

  constructor(logger: ReturnType<typeof useLogger>) {
    this.logger = logger;
  }

  setMsalAuth(msalAuth: MsalAuthContextType | null) {
    this.msalAuth = msalAuth;
  }

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
    const grantedScopesSet = new Set(
      payload.scp
        ?.split(" ")
        .map((scopeName) => scopeName.trim())
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
      return this.tokenCache.token;
    }

    if (this.tokenRequest) {
      this.logger.DEBUG("⏳ Waiting for existing token request to complete...");
      return this.tokenRequest;
    }

    this.logger.DEBUG("🔑 Requesting new Graph API access token...");

    this.tokenRequest = (async () => {
      try {
        if (!this.msalAuth) throw new Error("MSAL auth is not available.");

        const msalToken = await this.msalAuth.getAccessToken([...this.requiredScopes]);
        const jwtPayload = this.decodeJwtPayload(msalToken);

        if (!jwtPayload) throw new Error("Failed to decode MSAL token");
        if (!this.isGraphAudience(jwtPayload))
          throw new Error("MSAL token audience " + jwtPayload.aud + " is not valid for Graph API");
        if (!this.tokenHasScopes(jwtPayload, this.requiredScopes)) {
          const grantedScopes = jwtPayload.scp?.split(" ") || [];
          throw new Error(
            `MSAL token missing required scopes. Required: ${this.requiredScopes.join(
              ", "
            )}. Granted: ${grantedScopes.join(", ")}`
          );
        }

        let tokenExpiryTimestamp = addMinutes(new Date(), 50).getTime();
        if (jwtPayload.exp) tokenExpiryTimestamp = jwtPayload.exp * 1000;

        this.tokenCache = {
          token: msalToken,
          expires: addMinutes(
            new Date(tokenExpiryTimestamp),
            -TOKEN_EXPIRY_OFFSET_MINUTES
          ).getTime(),
        };

        return msalToken;
      } catch (msalError) {
        this.logger.ERROR("⚠️ MSAL authentication failed:", msalError);
        this.tokenCache = null;
        const errorMessage =
          msalError instanceof Error ? msalError.message : "MSAL authentication error";
        throw new Error(`Graph authentication failed: ${errorMessage}`);
      } finally {
        this.tokenRequest = null;
      }
    })();

    return this.tokenRequest;
  }

  async validateGraphAccess(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }
}
