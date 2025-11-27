/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { z } from "zod";

const baseSchema = z.object({
  APP_ENV: z.enum(["local", "production", "test"]).default("production"),
  MSAL_CLIENT_ID: z.string().optional(),
  MSAL_AUTHORITY: z.string().url().or(z.literal("")).optional(),
  MSAL_REDIRECT_URI: z.string().url().or(z.literal("")).optional(),
  MSAL_SCOPES: z.string().optional(),
});

// localhost: strict validation
const localhostSchema = z.object({
  APP_ENV: z.enum(["local", "production", "test"]).default("production"),
  MSAL_CLIENT_ID: z.string().min(1),
  MSAL_AUTHORITY: z.string().url(),
  MSAL_REDIRECT_URI: z.string().url(),
  MSAL_SCOPES: z.string().min(1),
});

const rawEnv = {
  APP_ENV: process.env.APP_ENV,
  MSAL_CLIENT_ID: process.env.MSAL_CLIENT_ID,
  MSAL_AUTHORITY: process.env.MSAL_AUTHORITY,
  MSAL_REDIRECT_URI: process.env.MSAL_REDIRECT_URI,
  MSAL_SCOPES: process.env.MSAL_SCOPES,
};

let isLocalhost = false;
try {
  isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
} catch {
  isLocalhost = false;
}
const schema = isLocalhost ? localhostSchema : baseSchema;

export const FRONTEND_ENV = schema.parse(rawEnv);
