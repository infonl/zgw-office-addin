import "@testing-library/jest-dom";
import { fromPartial } from "@total-typescript/shoehorn";
import React from "react";
import { vi } from "vitest";

// Make React available globally for JSX
global.React = React;

// Mock window.matchMedia for jsdom
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
  }),
});
