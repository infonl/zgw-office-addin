/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { PublicClientApplication, Configuration } from "@azure/msal-browser";

export class MsalAuthSingleton {
  private static msalSingletonInstance: MsalAuthSingleton | null = null;
  private readonly msalInstance: PublicClientApplication;
  private readonly initialized: Promise<void>;

  private constructor(config: Configuration) {
    console.log("MSAL Singleton config:", config);
    this.msalInstance = new PublicClientApplication(config);
    this.initialized = this.msalInstance.initialize();
  }

  static getInstance(config: Configuration): MsalAuthSingleton {
    if (!MsalAuthSingleton.msalSingletonInstance) {
      MsalAuthSingleton.msalSingletonInstance = new MsalAuthSingleton(config);
    }
    return MsalAuthSingleton.msalSingletonInstance;
  }

  async getAccessToken(scopes: string[]): Promise<string> {
    await this.initialized;
    try {
      const response = await this.msalInstance.loginPopup({ scopes });
      return response.accessToken;
    } catch (error) {
      console.error("MSAL Singleton error:", error);
      throw error;
    }
  }
}
