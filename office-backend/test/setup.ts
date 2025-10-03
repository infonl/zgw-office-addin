/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { vi } from "vitest";

// Set up common environment variables for all tests
process.env.API_BASE_URL = "https://api.test.com";
process.env.JWT_SECRET = "test-secret";

// Mock fetch globally for all tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

export { mockFetch };
