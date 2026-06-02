/*
 * SPDX-FileCopyrightText: 2026 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

/**
 * Builds a test JWT accepted by the backend's TokenService.
 * TokenService uses jwt-decode (no signature verification), so any
 * well-formed JWT with preferred_username and name claims passes.
 *
 * No exp claim is included intentionally — the backend never checks it.
 * The frontend's getToken() will re-fetch on each call because its expiry
 * check sees undefined exp, but the mock resolves instantly so this is benign.
 */
export function makeTestJwt(preferredUsername = "e2e-user", name = "E2E User"): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ preferred_username: preferredUsername, name }));
  return `${header}.${payload}.`;
}
