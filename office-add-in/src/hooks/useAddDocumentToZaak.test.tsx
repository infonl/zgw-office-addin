/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAddDocumentToZaak } from "./useAddDocumentToZaak";
import type { AddDocumentSchema } from "./types";

vi.spyOn(console, "debug").mockImplementation(() => {});
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

const mockPost = vi.fn();
vi.mock("./useHttp", () => ({
  useHttp: () => ({ POST: mockPost, GET: vi.fn() }),
}));

const mockGetDocumentData = vi.fn();
const mockGetFileName = vi.fn();
let mockHost: Office.HostType = 0 as Office.HostType;
vi.mock("./useOffice", () => ({
  useOffice: () => ({
    getDocumentData: mockGetDocumentData,
    getFileName: mockGetFileName,
    host: mockHost,
  }),
}));

vi.mock("./useLogger", () => ({
  useLogger: () => ({ DEBUG: vi.fn(), LOG: vi.fn(), WARN: vi.fn(), ERROR: vi.fn() }),
}));

vi.mock("../utils/getAccessToken", () => ({
  getToken: vi.fn().mockResolvedValue("test-token"),
}));

global.Office = {
  HostType: { Outlook: 2, Word: 0, Excel: 1 },
} as unknown as typeof Office;

const baseData: AddDocumentSchema = {
  vertrouwelijkheidaanduiding: "openbaar",
  informatieobjecttype: "https://api.example.com/informatieobjecttypen/1",
  status: "definitief",
  creatiedatum: new Date("2025-01-15"),
  zaakidentificatie: "ZAAK-001",
  auteur: "Test Auteur",
};

describe("useAddDocumentToZaak", () => {
  let queryClient: QueryClient;

  const createWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    mockPost.mockReset();
    mockGetDocumentData.mockReset();
    mockGetFileName.mockReset();
    mockHost = 0 as Office.HostType; // default to Word
  });

  it("returns a mutation result with idle initial status", () => {
    const { result } = renderHook(() => useAddDocumentToZaak(), { wrapper: createWrapper });
    expect(result.current.status).toBe("idle");
    expect(result.current.mutate).toBeTypeOf("function");
    expect(result.current.mutateAsync).toBeTypeOf("function");
  });

  it("POSTs to the correct URL with Bearer token", async () => {
    mockPost.mockResolvedValueOnce({});
    mockGetDocumentData.mockResolvedValueOnce("base64");
    mockGetFileName.mockResolvedValueOnce("file.docx");

    const { result } = renderHook(() => useAddDocumentToZaak(), { wrapper: createWrapper });

    await act(async () => {
      await result.current.mutateAsync(baseData);
    });

    expect(mockPost).toHaveBeenCalledWith(
      `/zaken/${baseData.zaakidentificatie}/documenten`,
      expect.any(String),
      { Authorization: "Bearer test-token" }
    );
  });

  it("in Word mode: adds inhoud and titel from office document", async () => {
    mockGetDocumentData.mockResolvedValueOnce("base64content");
    mockGetFileName.mockResolvedValueOnce("document.docx");
    mockPost.mockResolvedValueOnce({});

    const { result } = renderHook(() => useAddDocumentToZaak(), { wrapper: createWrapper });

    await act(async () => {
      await result.current.mutateAsync(baseData);
    });

    const body = JSON.parse(mockPost.mock.calls[0][1] as string);
    expect(body.inhoud).toBe("base64content");
    expect(body.titel).toBe("document.docx");
    expect(body.zaakidentificatie).toBe("ZAAK-001");
  });

  it("in Outlook mode: does not call getDocumentData or getFileName", async () => {
    mockHost = 2 as Office.HostType; // Office.HostType.Outlook
    mockPost.mockResolvedValueOnce({});

    const { result } = renderHook(() => useAddDocumentToZaak(), { wrapper: createWrapper });

    await act(async () => {
      await result.current.mutateAsync(baseData);
    });

    expect(mockGetDocumentData).not.toHaveBeenCalled();
    expect(mockGetFileName).not.toHaveBeenCalled();

    const body = JSON.parse(mockPost.mock.calls[0][1] as string);
    expect(body.zaakidentificatie).toBe("ZAAK-001");
    expect(body.inhoud).toBeUndefined();
  });

  it("returns the POST response on success", async () => {
    const mockResponse = { url: "https://api.example.com/zaakinformatieobjecten/1" };
    mockPost.mockResolvedValueOnce(mockResponse);
    mockGetDocumentData.mockResolvedValueOnce("base64");
    mockGetFileName.mockResolvedValueOnce("file.docx");

    const { result } = renderHook(() => useAddDocumentToZaak(), { wrapper: createWrapper });

    await act(async () => {
      await result.current.mutateAsync(baseData);
    });

    expect(mockPost).toHaveReturnedWith(Promise.resolve(mockResponse));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
  });

  it("propagates POST errors", async () => {
    const apiError = new Error("HTTP error! status: 500");
    mockPost.mockRejectedValueOnce(apiError);
    mockGetDocumentData.mockResolvedValueOnce("base64");
    mockGetFileName.mockResolvedValueOnce("file.docx");

    const { result } = renderHook(() => useAddDocumentToZaak(), { wrapper: createWrapper });

    await act(async () => {
      await result.current.mutateAsync(baseData).catch(() => {});
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(apiError);
  });

  it("calls onSuccess option when mutation succeeds", async () => {
    const onSuccess = vi.fn();
    mockPost.mockResolvedValueOnce({ url: "https://api.example.com/result" });
    mockGetDocumentData.mockResolvedValueOnce("base64");
    mockGetFileName.mockResolvedValueOnce("file.docx");

    const { result } = renderHook(() => useAddDocumentToZaak({ onSuccess }), {
      wrapper: createWrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(baseData);
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("calls onError option when mutation fails", async () => {
    const onError = vi.fn();
    mockPost.mockRejectedValueOnce(new Error("fail"));
    mockGetDocumentData.mockResolvedValueOnce("base64");
    mockGetFileName.mockResolvedValueOnce("file.docx");

    const { result } = renderHook(() => useAddDocumentToZaak({ onError }), {
      wrapper: createWrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(baseData).catch(() => {});
    });

    expect(onError).toHaveBeenCalledTimes(1);
  });
});
