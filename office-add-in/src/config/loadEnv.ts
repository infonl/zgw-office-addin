/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { z } from "zod";

const runtimeEnvSchema = z.object({
  APP_ENV: z.enum(["local", "production", "test"]).default("production"),
  MSAL_CLIENT_ID: z.string().default(""),
  MSAL_AUTHORITY: z.string().url().or(z.literal("")).default(""),
  MSAL_REDIRECT_URI: z.string().url().or(z.literal("")).default(""),
  MSAL_SCOPES: z.string().default(""),
});

export type RuntimeEnv = z.infer<typeof runtimeEnvSchema>;

let cachedEnv: RuntimeEnv | null = null;

/**
 * Load runtime environment configuration
 * - Local: Uses process.env (build-time, no async needed)
 * - Test/Prod: Fetches /config/env.json (runtime)
 */
export async function loadEnv(): Promise<RuntimeEnv> {
  if (cachedEnv) {
    return cachedEnv;
  }

  if (process.env.APP_ENV && process.env.APP_ENV === "local") {
    cachedEnv = runtimeEnvSchema.parse({
      APP_ENV: "local",
      MSAL_CLIENT_ID: process.env.MSAL_CLIENT_ID || "",
      MSAL_AUTHORITY: process.env.MSAL_AUTHORITY || "",
      MSAL_REDIRECT_URI: process.env.MSAL_REDIRECT_URI || "",
      MSAL_SCOPES: process.env.MSAL_SCOPES || "",
    });
    console.debug("[loadEnv] ✅ Using build-time env (local)", cachedEnv);
    return cachedEnv;
  }

  try {
    const response = await fetch("/config/env.json");
    if (!response.ok) {
      throw new Error(`Failed to load env.json: ${response.status}`);
    }

    const data = await response.json();
    cachedEnv = runtimeEnvSchema.parse(data);
    console.debug("[loadEnv] ✅ Loaded from /config/env.json", cachedEnv);
    return cachedEnv;
  } catch (error) {
    console.error("[loadEnv] ❌ Failed to load runtime config:", error);
    throw error;
  }
}

/**
 * Get cached environment (synchronous)
 * Safe to use AFTER loadEnv() has been called
 */
export function getEnv(): RuntimeEnv {
  // Voor lokaal: maak meteen een cached versie aan als die er niet is
  if (!cachedEnv && process.env.APP_ENV && process.env.APP_ENV === "local") {
    cachedEnv = runtimeEnvSchema.parse({
      APP_ENV: "local",
      MSAL_CLIENT_ID: process.env.MSAL_CLIENT_ID || "",
      MSAL_AUTHORITY: process.env.MSAL_AUTHORITY || "",
      MSAL_REDIRECT_URI: process.env.MSAL_REDIRECT_URI || "",
      MSAL_SCOPES: process.env.MSAL_SCOPES || "",
    });
  }

  if (!cachedEnv) {
    throw new Error("Environment not loaded yet. Call loadEnv() first.");
  }

  return cachedEnv;
}
