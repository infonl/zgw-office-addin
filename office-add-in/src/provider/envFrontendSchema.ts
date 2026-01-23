/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { z } from "zod";

const schema = z.object({
  APP_ENV: z.enum(["local", "production", "test"]).default("production"),
  BASE_URL: z.string().url().or(z.literal("")),
  MSAL_CLIENT_ID: z.string(),
  MSAL_AUTHORITY: z.string().url().or(z.literal("")),
  MSAL_REDIRECT_URI: z.string().url().or(z.literal("")),
  MSAL_SCOPES: z.string(),
});

const rawEnv = {
  APP_ENV: process.env.APP_ENV,
  BASE_URL: "https://localhost:3003",
  MSAL_CLIENT_ID: process.env.MSAL_CLIENT_ID,
  MSAL_AUTHORITY: process.env.MSAL_AUTHORITY,
  MSAL_REDIRECT_URI: process.env.MSAL_REDIRECT_URI,
  MSAL_SCOPES: process.env.MSAL_SCOPES,
};

export const FRONTEND_ENV = schema.parse(rawEnv);
