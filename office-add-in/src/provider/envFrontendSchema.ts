import { z } from "zod";

export const envFrontendSchema = z.object({
  APP_ENV: z.enum(["local", "production", "test"]),
  MSAL_CLIENT_ID: z.string().min(1),
  MSAL_AUTHORITY: z.string().url(),
  MSAL_REDIRECT_URI: z.string().url(),
  MSAL_SCOPES: z.string().min(1),
});

export const FRONTEND_ENV = envFrontendSchema.parse({
  APP_ENV: process.env.APP_ENV,
  MSAL_CLIENT_ID: process.env.MSAL_CLIENT_ID,
  MSAL_AUTHORITY: process.env.MSAL_AUTHORITY,
  MSAL_REDIRECT_URI: process.env.MSAL_REDIRECT_URI,
  MSAL_SCOPES: process.env.MSAL_SCOPES,
});
