import { useCallback } from "react";

declare const __DEV__: boolean;

const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : true;

export function useLogger() {
  const DEBUG = useCallback((message: string, ...optionalParams: any[]) => {
    if (!isDev) return;
    console.debug(`[DEBUG] ${message}`, ...optionalParams);
  }, []);

  const LOG = useCallback((message: string, ...optionalParams: any[]) => {
    console.log(`[LOG] ${message}`, ...optionalParams);
  }, []);

  const WARN = useCallback((message: string, ...optionalParams: any[]) => {
    console.warn(`[WARN] ${message}`, ...optionalParams);
  }, []);

  const ERROR = useCallback((message: string, ...optionalParams: any[]) => {
    console.error(`[ERROR] ${message}`, ...optionalParams);
  }, []);

  return { DEBUG, LOG, WARN, ERROR };
}
