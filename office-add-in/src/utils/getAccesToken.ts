/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

// Token cache
let tokenPromise: Promise<string> | null = null;
let cachedToken: string | null = null;

export async function getToken(): Promise<string> {
  // If we already have a cached token, return it
  if (cachedToken) {
    return cachedToken;
  }

  // If there's already a request in progress, wait for it
  if (tokenPromise) {
    return tokenPromise;
  }

  // throw Error("No token available");

  // Start a new token request
  tokenPromise = Office.auth
    .getAccessToken()
    .then((token) => {
      cachedToken = token;
      tokenPromise = null;
      return token;
    })
    .catch(async (error) => {
      if (error && typeof error === "object" && "code" in error) {
        const errorWithCode = error as { code: string };
        if (errorWithCode.code === "13006") {
          await new Promise((r) => setTimeout(r, 500));
          return Office.auth.getAccessToken();
        }
      }
      tokenPromise = null;
      throw error;
    });

  return tokenPromise;
}

export function clearToken() {
  cachedToken = null;
  tokenPromise = null;
}
