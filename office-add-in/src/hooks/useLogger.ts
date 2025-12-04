/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useCallback } from "react";
import { FRONTEND_ENV } from "../provider/envFrontendSchema";

// Enable debug logging for local (and test environment for now)
const isDev = FRONTEND_ENV.APP_ENV === "local" || FRONTEND_ENV.APP_ENV === "test";

export function useLogger(context = "UNKNOWN") {
  const DEBUG = useCallback(
    (message: string, ...optionalParams: unknown[]) => {
      if (!isDev) return;
      console.debug(`[DEBUG] [${context}] ${message}`, ...optionalParams);
    },
    [context]
  );

  const LOG = useCallback(
    (message: string, ...optionalParams: unknown[]) => {
      console.log(`[LOG] [${context}] ${message}`, ...optionalParams);
    },
    [context]
  );

  const WARN = useCallback(
    (message: string, ...optionalParams: unknown[]) => {
      console.warn(`[WARN] [${context}] ${message}`, ...optionalParams);
    },
    [context]
  );

  const ERROR = useCallback(
    (message: string, ...optionalParams: unknown[]) => {
      console.error(`[ERROR] [${context}] ${message}`, ...optionalParams);
    },
    [context]
  );

  return { DEBUG, LOG, WARN, ERROR };
}
