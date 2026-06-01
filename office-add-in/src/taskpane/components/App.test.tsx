/* SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { App } from "./App";

// Silence noisy console output from providers / MSAL
vi.spyOn(console, "debug").mockImplementation(() => {});
vi.spyOn(console, "info").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

// ---------------------------------------------------------------------------
// Mutable hoisted variables – changed per test
// ---------------------------------------------------------------------------
const { mockIsOutlook, mockIsWord, mockIsExcel, mockIsInBrowser, mockDocumentAddedToZaak } =
  vi.hoisted(() => ({
    mockIsOutlook: { value: false },
    mockIsWord: { value: false },
    mockIsExcel: { value: false },
    mockIsInBrowser: { value: false },
    mockDocumentAddedToZaak: { value: null as string | null },
  }));

const mockReset = vi.fn();

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("usehooks-ts", () => ({
  useDarkMode: () => ({ isDarkMode: false }),
}));

vi.mock("../../provider/MsalAuthProvider", () => ({
  MsalAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="msal-provider">{children}</div>
  ),
}));

vi.mock("../../provider/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../../provider/ZaakProvider", () => ({
  ZaakProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useZaak: () => ({
    documentAddedToZaak: mockDocumentAddedToZaak.value,
    reset: mockReset,
  }),
}));

vi.mock("../../provider/ToastProvider", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../../hooks/useOffice", () => ({
  useOffice: () => ({
    isOutlook: mockIsOutlook.value,
    isWord: mockIsWord.value,
    isExcel: mockIsExcel.value,
    isInBrowser: mockIsInBrowser.value,
    host: 0,
    getDocumentData: vi.fn(),
    getFileName: vi.fn(),
    getDocumentFileName: vi.fn(),
    getOutlookSubject: vi.fn(),
    getSignedInUser: vi.fn(),
    processAndUploadDocuments: vi.fn(),
  }),
}));

vi.mock("@fluentui/react-components", () => ({
  FluentProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  MessageBar: ({ children }: { children: React.ReactNode }) => <div role="alert">{children}</div>,
  MessageBarBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  MessageBarTitle: ({ children }: { children: React.ReactNode }) => <strong>{children}</strong>,
  makeStyles: () => () => ({}),
  tokens: {},
  webLightTheme: {},
  webDarkTheme: {},
}));

vi.mock("@tanstack/react-query", () => ({
  QueryClient: class QueryClient {},
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("./OfficeForm", () => ({
  OfficeForm: () => <div data-testid="office-form" />,
}));

vi.mock("./OutlookForm/OutlookForm", () => ({
  OutlookForm: () => <div data-testid="outlook-form" />,
}));

vi.mock("./styles/shared", () => ({
  useCommonStyles: () => ({
    title: "title",
    messageBar: "messageBar",
    messageInline: "messageInline",
    messageTitleNoWrap: "messageTitleNoWrap",
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset all mutable flags to their defaults
    mockIsOutlook.value = false;
    mockIsWord.value = false;
    mockIsExcel.value = false;
    mockIsInBrowser.value = false;
    mockDocumentAddedToZaak.value = null;
  });

  it("renders the MsalAuthProvider wrapper when MSAL env vars are set", () => {
    render(<App />);
    expect(screen.getByTestId("msal-provider")).toBeTruthy();
  });

  it("renders OfficeForm when isOutlook is false", () => {
    mockIsOutlook.value = false;
    render(<App />);
    expect(screen.getByTestId("office-form")).toBeTruthy();
    expect(screen.queryByTestId("outlook-form")).toBeNull();
  });

  it("renders OutlookForm when isOutlook is true", () => {
    mockIsOutlook.value = true;
    render(<App />);
    expect(screen.getByTestId("outlook-form")).toBeTruthy();
    expect(screen.queryByTestId("office-form")).toBeNull();
  });

  it("shows success message when documentAddedToZaak is set", () => {
    mockDocumentAddedToZaak.value = "ZAAK-001";
    render(<App />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Gekoppeld")).toBeTruthy();
  });

  it("shows the zaak number in the success message", () => {
    mockDocumentAddedToZaak.value = "ZAAK-001";
    render(<App />);
    expect(screen.getByText(/Het document is succesvol gekoppeld aan ZAAK-001/)).toBeTruthy();
  });

  it("shows 'Volgende koppeling' button in success view", () => {
    mockDocumentAddedToZaak.value = "ZAAK-001";
    render(<App />);
    expect(screen.getByRole("button", { name: /Volgende koppeling/i })).toBeTruthy();
  });

  it("does NOT show 'Sluiten' button when canCloseTaskpane is false", () => {
    mockDocumentAddedToZaak.value = "ZAAK-001";
    mockIsWord.value = false;
    mockIsExcel.value = false;
    render(<App />);
    expect(screen.queryByRole("button", { name: /Sluiten/i })).toBeNull();
  });

  it("shows 'Sluiten' button when canCloseTaskpane is true", () => {
    mockDocumentAddedToZaak.value = "ZAAK-001";
    mockIsWord.value = true;
    mockIsInBrowser.value = true;

    // Provide window.Office.addin.hide so the condition is satisfied
    const hideFn = vi.fn();
    Object.defineProperty(window, "Office", {
      value: { addin: { hide: hideFn } },
      writable: true,
      configurable: true,
    });

    render(<App />);
    expect(screen.getByRole("button", { name: /Sluiten/i })).toBeTruthy();

    // Clean up
    Object.defineProperty(window, "Office", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it("calls reset() when 'Volgende koppeling' is clicked", () => {
    mockDocumentAddedToZaak.value = "ZAAK-001";
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Volgende koppeling/i }));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
