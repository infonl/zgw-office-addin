/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

process.env.APP_ENV = "local";
process.env.MSAL_CLIENT_ID = "vitest-client-id";
process.env.MSAL_AUTHORITY = "http://vitest-authority";
process.env.MSAL_REDIRECT_URI = "http://localhost";
process.env.MSAL_SCOPES = "api://localhost:3000/vitest-client-id/access_as_user";
