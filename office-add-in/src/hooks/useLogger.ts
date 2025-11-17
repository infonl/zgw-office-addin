/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useCallback } from "react";

declare const __DEV__: boolean;

const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : true;

export function useLogger(context = "UNKNOWN") {
  const DEBUG = useCallback((message: string, ...optionalParams: unknown[]) => {
    if (!isDev) return;
    console.debug(`[DEBUG] [${context}] ${message}`, ...optionalParams);
  }, []);

  const LOG = useCallback((message: string, ...optionalParams: unknown[]) => {
    console.log(`[LOG] [${context}] ${message}`, ...optionalParams);
  }, []);

  const WARN = useCallback((message: string, ...optionalParams: unknown[]) => {
    console.warn(`[WARN] [${context}] ${message}`, ...optionalParams);
  }, []);

  const ERROR = useCallback((message: string, ...optionalParams: unknown[]) => {
    console.error(`[ERROR] [${context}] ${message}`, ...optionalParams);
  }, []);

  return { DEBUG, LOG, WARN, ERROR };
}
