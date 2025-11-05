/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import "@testing-library/dom";
import { fromPartial } from "@total-typescript/shoehorn";
import { vi } from "vitest";

// Mock window.matchMedia for happy-dom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Office.js for testing
global.Office = fromPartial({
  onReady: vi.fn().mockResolvedValue({}),
  context: fromPartial({
    document: fromPartial({}),
    mailbox: fromPartial({
      item: undefined,
    }),
  }),
});
