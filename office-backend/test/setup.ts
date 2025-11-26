/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { vi } from "vitest";

// Mock fetch globally for all tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

export { mockFetch };
