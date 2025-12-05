/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { PublicClientApplication, Configuration } from "@azure/msal-browser";
import { useLogger } from "../hooks/useLogger";
import { loadEnv } from "../config/loadEnv";

export type MsalAuthContextType = {
  getAccessToken: (_scopes: string[]) => Promise<string>;
  isInitialized: boolean;
};

const MsalAuthContext = createContext<MsalAuthContextType | null>(null);

export { MsalAuthContext };

export function MsalAuthProvider({ children }: { children: React.ReactNode }) {
  const logger = useLogger(MsalAuthProvider.name);
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function initializeMsal() {
      try {
        logger.DEBUG("Loading runtime environment configuration...");
        const env = await loadEnv();

        logger.DEBUG("MSAL Config:", {
          clientId: env.MSAL_CLIENT_ID,
          authority: env.MSAL_AUTHORITY,
          redirectUri: env.MSAL_REDIRECT_URI,
        });

        logger.DEBUG("ENV: " + JSON.stringify(env));

        const config: Configuration = {
          auth: {
            clientId: env.MSAL_CLIENT_ID,
            authority: env.MSAL_AUTHORITY,
            redirectUri: env.MSAL_REDIRECT_URI,
          },
          cache: {
            cacheLocation: "localStorage",
            storeAuthStateInCookie: false,
          },
        };

        const instance = new PublicClientApplication(config);
        await instance.initialize();

        setMsalInstance(instance);
        setIsInitialized(true);

        logger.DEBUG("✅ MSAL initialized successfully");
      } catch (error) {
        logger.ERROR("❌ Failed to initialize MSAL:", error);
      }
    }

    initializeMsal();
  }, []);

  const getAccessToken = async (scopes: string[]): Promise<string> => {
    if (!msalInstance) {
      throw new Error("MSAL not initialized yet");
    }

    const account = msalInstance.getAllAccounts()[0];

    try {
      if (account) {
        const response = await msalInstance.acquireTokenSilent({ scopes, account });
        return response.accessToken;
      }

      const response = await msalInstance.loginPopup({ scopes });
      return response.accessToken;
    } catch (error) {
      logger.ERROR("MSAL error:", error);
      throw error;
    }
  };

  return (
    <MsalAuthContext.Provider value={{ getAccessToken, isInitialized }}>
      {children}
    </MsalAuthContext.Provider>
  );
}

export function useMsalAuth() {
  const ctx = useContext(MsalAuthContext);
  if (!ctx) throw new Error("useMsalAuth must be used within a MsalAuthProvider");
  return ctx;
}
