/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

export type HasConstructorName = { constructor: { name: string } };

export class LoggerService {
  static withContext(instance: HasConstructorName) {
    const context = instance.constructor.name || "UnknownContext";

    return {
      DEBUG: (...params: unknown[]) => {
        if (["production", "prod"].includes(String(process.env.NODE_ENV))) return;
        console.debug(`[DEBUG] [${context}]`, ...params);
      },
      INFO: (...params: unknown[]) => {
        console.info(`[INFO] [${context}]`, ...params);
      },
      WARN: (...params: unknown[]) => {
        console.warn(`[WARN] [${context}]`, ...params);
      },
      ERROR: (...params: unknown[]) => {
        console.error(`[ERROR] [${context}]`, ...params);
      },
    };
  }
}
