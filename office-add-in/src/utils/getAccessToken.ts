/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { jwtDecode } from "jwt-decode";

// Token cache
let tokenPromise: Promise<string> | null = null;
let cachedToken: string | null = null;

export async function getToken(): Promise<string> {
  // If we already have a cached token, return it
  if (cachedToken) {
    try {
      const decoded: { exp?: number } = jwtDecode(cachedToken);
      // exp is in seconds since epoch
      const now = Math.floor(Date.now() / 1000);
      const offset = 60; // seconds before expiry to consider token invalid
      if (decoded.exp && decoded.exp > now + offset) {
        return cachedToken;
      }
      // Token expired or about to expire, clear it
      cachedToken = null;
    } catch {
      // If decoding fails, clear the cached token
      cachedToken = null;
    }
  }

  // If there's already a request in progress, wait for it
  if (tokenPromise) {
    return tokenPromise;
  }

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
        const errorWithCode = error as { code: number };
        console.log("Error obtaining access token:", errorWithCode);
        if (errorWithCode.code === 13006) {
          cachedToken = null;
          tokenPromise = null;
          await new Promise((r) => setTimeout(r, 500));
          // Retry and cache the new token
          try {
            const token = await Office.auth.getAccessToken();
            cachedToken = token;
            tokenPromise = null;
            return token;
          } catch (retryError) {
            tokenPromise = null;
            throw retryError;
          }
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
