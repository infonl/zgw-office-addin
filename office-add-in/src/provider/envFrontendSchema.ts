// src/config/index.ts
import { z } from "zod";
import { loadEnv } from "../config/loadEnv";

const schema = z.object({
  APP_ENV: z.enum(["local", "test", "production"]),
  MSAL_CLIENT_ID: z.string(),
  MSAL_AUTHORITY: z.string().url().or(z.literal("")),
  MSAL_REDIRECT_URI: z.string().url().or(z.literal("")),
  MSAL_SCOPES: z.string(),
});

export const getFrontendEnv = async () => {
  const rawEnv = await loadEnv();
  console.debug("Loaded frontend env:", rawEnv);
  return schema.parse(rawEnv);
};
