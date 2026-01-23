/*
 * SPDX-FileCopyrightText: 2024 Lifely
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { Configuration } from "@azure/msal-browser";
import {FRONTEND_ENV} from "./envFrontendSchema";

export function extractLocalMsalConfig() {
    // Only create MSAL config on localhost
    let msalConfig: Configuration | undefined;

    if (
        FRONTEND_ENV.APP_ENV === "local" &&
        FRONTEND_ENV.MSAL_CLIENT_ID &&
        FRONTEND_ENV.MSAL_AUTHORITY &&
        FRONTEND_ENV.MSAL_REDIRECT_URI
    ) {
        msalConfig = {
            auth: {
                clientId: FRONTEND_ENV.MSAL_CLIENT_ID,
                authority: FRONTEND_ENV.MSAL_AUTHORITY,
                redirectUri: FRONTEND_ENV.MSAL_REDIRECT_URI,
            },
            cache: {
                cacheLocation: "localStorage",
                storeAuthStateInCookie: false,
            },
        };
    }
    return msalConfig;
}
