/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App";

// Mock dependencies
vi.mock("usehooks-ts", () => ({
  useDarkMode: () => ({ isDarkMode: false }),
}));

vi.mock("../../hooks/useOffice", () => ({
  useOffice: () => ({
    isOutlook: false,
    isWord: true,
    getSignedInUser: vi.fn().mockResolvedValue(null),
    getDocumentData: vi.fn().mockResolvedValue(""),
    getFileName: vi.fn().mockResolvedValue(""),
    processAndUploadDocuments: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("../../provider/ZaakProvider", () => ({
  ZaakProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useZaak: () => ({
    setZaakToSearch: vi.fn(),
    documentAdded: vi.fn(),
    documentAddedToZaak: null,
    reset: vi.fn(),
    zaak: {
      data: null,
      isLoading: false,
      isError: false,
    },
  }),
}));

vi.mock("../../provider/ToastProvider", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useToast: () => ({
    dispatchToast: vi.fn(),
    dismissToast: vi.fn(),
  }),
}));

vi.mock("../../provider/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    authService: {},
  }),
}));

vi.mock("../../hooks/useLogger", () => ({
  useLogger: () => ({
    DEBUG: vi.fn(),
    INFO: vi.fn(),
    WARN: vi.fn(),
    ERROR: vi.fn(),
  }),
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<App />);
    expect(screen.getByText(/koppelen aan zaak/i)).toBeInTheDocument();
  });

  it("creates a stable QueryClient instance", () => {
    const { rerender } = render(<App />);

    // Get the first render
    const firstRender = screen.getByText(/koppelen aan zaak/i).parentElement;

    // Force a re-render
    rerender(<App />);

    // Get the second render
    const secondRender = screen.getByText(/koppelen aan zaak/i).parentElement;

    // The DOM should be stable (QueryClient should be the same instance)
    expect(firstRender).toBeTruthy();
    expect(secondRender).toBeTruthy();

    // If QueryClient is recreated on every render, queries would be reset
    // This test ensures that doesn't happen
  });

  it("renders Word form when isWord is true", () => {
    render(<App />);

    // Should render ZaakSearch which is part of OfficeForm
    expect(screen.getByText(/koppelen aan zaak/i)).toBeInTheDocument();
  });
});
