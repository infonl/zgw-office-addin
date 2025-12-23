/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

let cachedToken: string | null = null;
let tokenPromise: Promise<string> | null = null;

interface ExtendedOfficeContext extends Office.Context {
  auth?: {
    getAccessTokenAsync: (
      _options: Office.AuthOptions,
      _callback: (_result: Office.AsyncResult<string>) => void
    ) => void;
  };
}

export async function getToken(): Promise<string> {
  // If we already have a cached token, return it
  if (cachedToken) {
    try {
      const payload = JSON.parse(atob(cachedToken.split(".")[1]));
      const expiry = payload.exp * 1000;
      if (Date.now() < expiry - 60000) {
        console.debug("Using cached token");
        return cachedToken;
      } else {
        console.debug("Cached token expired, fetching new one");
        cachedToken = null;
      }
    } catch {
      console.debug("Error parsing cached token, fetching new one");
      cachedToken = null;
    }
  }

  // If there's already a request in progress, wait for it
  if (tokenPromise) {
    return tokenPromise;
  }

  // Start a new token request
  tokenPromise = getTokenThroughAuthModule()
    .catch(async (error) => {
      const officeContext = Office.context as ExtendedOfficeContext;
      if (officeContext?.auth?.getAccessTokenAsync) {
        console.debug("Auth module failed, trying context-based auth");
        return getTokenThroughContext();
      }
      throw error;
    })
    .then((token) => {
      cachedToken = token;
      tokenPromise = null;
      return token;
    })
    .catch((error) => {
      tokenPromise = null;
      if (error && typeof error === "object" && !("code" in error)) {
        (error as { code?: number }).code = undefined;
      }
      throw error;
    });

  return tokenPromise;
}

function getTokenThroughAuthModule(): Promise<string> {
  return Office.auth
    .getAccessToken({
      allowSignInPrompt: true,
      allowConsentPrompt: true,
      forceAddAccount: false,
    })
    .catch(async (error) => {
      if (error && typeof error === "object" && "code" in error) {
        const errorWithCode = error as { code: number; message?: string };
        console.debug("Error obtaining access token:", errorWithCode);
        if (errorWithCode.code === 13006) {
          console.debug("Error code 13006, retrying after 500ms");
          await new Promise((resolve) => setTimeout(resolve, 500));
          return Office.auth.getAccessToken({
            allowSignInPrompt: true,
            allowConsentPrompt: true,
            forceAddAccount: false,
          });
        }
      }
      throw error;
    });
}

function getTokenThroughContext(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const officeContext = Office.context as ExtendedOfficeContext;
    if (officeContext.auth?.getAccessTokenAsync) {
      console.debug("Using office context auth");
      officeContext.auth.getAccessTokenAsync(
        {
          forMSGraphAccess: true,
          allowSignInPrompt: true,
          allowConsentPrompt: true,
        },
        (result) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            resolve(result.value!);
          } else {
            reject(result.error);
          }
        }
      );
    } else {
      console.debug("Using Office.auth.getAccessToken fallback");
      Office.auth
        .getAccessToken({
          allowSignInPrompt: true,
          allowConsentPrompt: true,
          forceAddAccount: false,
        })
        .then(resolve)
        .catch(reject);
    }
  });
}

export function clearToken() {
  cachedToken = null;
  tokenPromise = null;
}
