/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { z } from "zod";

const schema = z.object({
  APP_ENV: z.enum(["local", "production", "test"]).default("production"),
  MSAL_CLIENT_ID: z.string().optional(),
  MSAL_AUTHORITY: z.string().url().or(z.literal("")).optional(),
  MSAL_REDIRECT_URI: z.string().url().or(z.literal("")).optional(),
  MSAL_SCOPES: z.string().optional(),
});

const rawEnv = {
  APP_ENV: process.env.APP_ENV,
  MSAL_CLIENT_ID: process.env.MSAL_CLIENT_ID,
  MSAL_AUTHORITY: process.env.MSAL_AUTHORITY,
  MSAL_REDIRECT_URI: process.env.MSAL_REDIRECT_URI,
  MSAL_SCOPES: process.env.MSAL_SCOPES,
};

console.debug("Frontend env schema:", rawEnv);

export const FRONTEND_ENV = schema.parse(rawEnv);
