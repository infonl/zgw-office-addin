/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { z } from "zod";

const isLocal = process.env.APP_ENV === "local";

export const envFrontendSchema = z.object({
  APP_ENV: z.enum(["local", "production", "test"]).default("production"),

  MSAL_CLIENT_ID: isLocal ? z.string().min(1) : z.string().min(1).optional(),
  MSAL_AUTHORITY: isLocal ? z.string().url() : z.string().url().optional(),
  MSAL_REDIRECT_URI: isLocal ? z.string().url() : z.string().url().optional(),
  MSAL_SCOPES: isLocal ? z.string().min(1) : z.string().min(1).optional(),
});

export const FRONTEND_ENV = envFrontendSchema.parse({
  APP_ENV: process.env.APP_ENV,
  MSAL_CLIENT_ID: process.env.MSAL_CLIENT_ID,
  MSAL_AUTHORITY: process.env.MSAL_AUTHORITY,
  MSAL_REDIRECT_URI: process.env.MSAL_REDIRECT_URI,
  MSAL_SCOPES: process.env.MSAL_SCOPES,
});
