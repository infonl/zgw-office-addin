/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import dotenv from "dotenv";
import { z } from "zod";
import path from "path";

// Only load .env file when running locally (not in production/Kubernetes)
if (!process.env.APP_ENV || process.env.APP_ENV === "local") {
  try {
    dotenv.config({ path: path.resolve(__dirname, "../../.env") });
  } catch (error) {
    console.warn("Could not load .env file, using environment variables directly");
  }
}

export const envSchema = z.object({
  APP_ENV: z.enum(["local", "production", "test"]).default("production"),
  JWT_SECRET: z.string().min(1),
  API_BASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url().optional(),
  KEY_PATH: z.string().min(1).optional(),
  CERT_PATH: z.string().min(1).optional(),
  CA_CERT_PATH: z.string().min(1).optional(),
  PORT: z.string().min(1).optional(),
});

export const envServer = envSchema.safeParse({
  APP_ENV: process.env.APP_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  API_BASE_URL: process.env.API_BASE_URL,
  FRONTEND_URL: process.env.FRONTEND_URL,
  KEY_PATH: process.env.KEY_PATH,
  CERT_PATH: process.env.CERT_PATH,
  CA_CERT_PATH: process.env.CA_CERT_PATH,
  PORT: process.env.PORT,
});

if (!envServer.success) {
  console.error("Environment variable validation failed:", envServer.error.issues);
  throw new Error("There is an error with the server environment variables");
}

export const envServerSchema = envServer.data;

type EnvSchemaType = z.infer<typeof envSchema>;

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvSchemaType {}
  }
}
