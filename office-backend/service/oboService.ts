/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */
import { ConfidentialClientApplication } from "@azure/msal-node";
import { LoggerService } from "./LoggerService";

const msalConfig = {
  auth: {
    clientId: process.env.MSAL_CLIENT_ID!,
    authority: process.env.MSAL_AUTHORITY!,
    clientSecret: process.env.MSAL_SECRET!,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

export async function exchangeBootstrapTokenForGraphToken(bootstrapToken: string): Promise<string> {
  try {
    LoggerService.debug("config: ", msalConfig);
    const result = await cca.acquireTokenOnBehalfOf({
      oboAssertion: bootstrapToken,
      scopes: ["https://graph.microsoft.com/.default"], // REQUIRED for OBO
    });

    if (!result?.accessToken) {
      throw new Error("No accessToken returned by MSAL OBO");
    }

    return result.accessToken;
  } catch (err: any) {
    LoggerService.error("❌ MSAL OBO Error:", err);
    throw new Error("OBO exchange failed: " + err.message);
  }
}
