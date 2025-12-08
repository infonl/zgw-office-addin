/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useCallback } from "react";
import { loadEnv } from "../config/loadEnv";

/**
 * Check if we're in development mode (local or test)
 */
async function isDev(): Promise<boolean> {
  try {
    const env = await loadEnv();
    return env.APP_ENV === "local" || env.APP_ENV === "test";
  } catch {
    // Fallback voor early initialization
    return process.env.APP_ENV === "local" || process.env.APP_ENV === "test";
  }
}

export function useLogger(context = "UNKNOWN") {
  const DEBUG = useCallback(
    (message: string, ...optionalParams: unknown[]) => {
      if (!isDev()) return;
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
