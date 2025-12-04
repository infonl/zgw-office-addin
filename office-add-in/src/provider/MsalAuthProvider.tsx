/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React, { createContext, useContext, useMemo } from "react";
import { PublicClientApplication, Configuration } from "@azure/msal-browser";
import { useLogger } from "../hooks/useLogger";

export type MsalAuthContextType = {
  getAccessToken: (_scopes: string[]) => Promise<string>;
};

const MsalAuthContext = createContext<MsalAuthContextType | null>(null);

export { MsalAuthContext };

export function MsalAuthProvider({
  config,
  children,
}: {
  config: Configuration;
  children: React.ReactNode;
}) {
  const logger = useLogger(MsalAuthProvider.name);
  const msalInstance = useMemo(() => new PublicClientApplication(config), [config]);
  const initialized = useMemo(() => msalInstance.initialize(), [msalInstance]);

  const getAccessToken = async (scopes: string[]): Promise<string> => {
    await initialized;
    try {
      const response = await msalInstance.loginPopup({ scopes });
      return response.accessToken;
    } catch (error) {
      logger.ERROR("MSAL error:", error);
      throw error;
    }
  };

  return <MsalAuthContext.Provider value={{ getAccessToken }}>{children}</MsalAuthContext.Provider>;
}

export function useMsalAuth() {
  const ctx = useContext(MsalAuthContext);
  if (!ctx) throw new Error("useMsalAuth must be used within a MsalAuthProvider");
  return ctx;
}
