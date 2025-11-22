/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React, { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { OfficeGraphAuthService } from "../service/OfficeGraphAuthService";
import { useMsalAuth } from "./MsalAuthProvider";
import { useLogger } from "../hooks/useLogger";

export type AuthContextType = {
  authService: OfficeGraphAuthService;
};
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: PropsWithChildren) {
  const msalAuth = useMsalAuth();
  const logger = useLogger(OfficeGraphAuthService.name);

  const authService = useMemo(() => {
    const service = new OfficeGraphAuthService(logger);
    service.setMsalAuth(msalAuth);
    return service;
  }, [logger, msalAuth]);

  return <AuthContext.Provider value={{ authService }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
