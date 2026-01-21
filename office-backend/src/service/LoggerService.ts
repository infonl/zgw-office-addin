/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

export class LoggerService {
  public static debug(message: string, ...optionalParams: any[]) {
    if (["production", "prod"].includes(String(process.env.NODE_ENV))) return;
    console.debug(`[DEBUG] ${message}`, ...optionalParams);
  }
  public static log(message: string, ...optionalParams: any[]) {
    console.log(`[INFO] ${message}`, ...optionalParams);
  }

  public static warn(message: string, ...optionalParams: any[]) {
    console.warn(`[WARN] ${message}`, ...optionalParams);
  }

  public static error(message: string, ...optionalParams: any[]) {
    console.error(`[ERROR] ${message}`, ...optionalParams);
  }
}
