/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { PublicClientApplication } from "@azure/msal-browser";

export class MsalAuthFallback {
  private msalInstance: PublicClientApplication | null = null;
  private readonly clientId: string;
  private readonly authority: string;
  private readonly redirectUri: string;

  constructor({
    clientId,
    authority,
    redirectUri,
  }: {
    clientId: string;
    authority: string;
    redirectUri: string;
  }) {
    this.clientId = clientId;
    this.authority = authority;
    this.redirectUri = redirectUri;
  }

  async getAccessToken(scopes: string[]): Promise<string> {
    if (!this.msalInstance) {
      this.msalInstance = new PublicClientApplication({
        auth: {
          clientId: this.clientId,
          authority: this.authority,
          redirectUri: this.redirectUri,
        },
      });
      await this.msalInstance.initialize();
    }
    const response = await this.msalInstance.loginPopup({ scopes });
    return response.accessToken;
  }
}
