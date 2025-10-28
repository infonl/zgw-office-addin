/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import "@testing-library/dom";
import { fromPartial } from "@total-typescript/shoehorn";
import { vi } from "vitest";

// Only if window is defined (happy-dom)
if (typeof window !== "undefined") {
  // Mock window.matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
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
}

// Get global object - check environments directly
const globalObj = (() => {
  if (typeof window !== "undefined") return window; // happy-dom
  if (typeof global !== "undefined") return global; // Node.js
  throw new Error("Unable to locate global object");
})();

// Office mock via global object zodat het zowel in Node als happy-dom werkt
(globalObj as any).Office =
  (globalObj as any).Office ??
  fromPartial({
    onReady: vi.fn().mockResolvedValue({}),
    context: fromPartial({
      document: fromPartial({}),
      mailbox: fromPartial({ item: undefined }),
    }),
  });
