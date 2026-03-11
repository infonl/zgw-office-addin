/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */
import {ConfidentialClientApplication} from "@azure/msal-node";
import { LoggerService } from "./LoggerService";

const msalConfig = {
  auth: {
    clientId: process.env.MSAL_CLIENT_ID!,
    authority: process.env.MSAL_AUTHORITY!,
    clientSecret: process.env.MSAL_SECRET!,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

async function acquireTokenOnBehalfOf(bootstrapToken: string): Promise<string | Error> {
  return await cca.acquireTokenOnBehalfOf({
    oboAssertion: bootstrapToken,
    scopes: ["https://graph.microsoft.com/.default"], // REQUIRED for OBO
  }).then(
    (response) => {
      if (!response?.accessToken) {
        return Error("No accessToken returned by MSAL OBO");
      }
      return response.accessToken
    },
    (error) => {
      return Error("MSAL OBO acquisition failed: " + (error instanceof Error ? error.message : String(error)));
    }
  )
}

export async function exchangeBootstrapTokenForGraphToken(bootstrapToken: string): Promise<string> {
  LoggerService.debug("config: ", msalConfig);
  const tokenOrError = await acquireTokenOnBehalfOf(bootstrapToken);
  if (tokenOrError instanceof Error) {
    LoggerService.error("❌ MSAL OBO Error:", err);
    throw tokenOrError;
  }
  return tokenOrError;
}
