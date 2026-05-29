/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHttp } from "./useHttp";
import { useLogger } from "./useLogger";

vi.mock("./useLogger", () => ({
  useLogger: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

function setupLoggerMock() {
  vi.mocked(useLogger).mockReturnValue({
    DEBUG: vi.fn() as (_message: string, ..._optionalParams: unknown[]) => void,
    LOG: vi.fn() as (_message: string, ..._optionalParams: unknown[]) => void,
    WARN: vi.fn() as (_message: string, ..._optionalParams: unknown[]) => void,
    ERROR: vi.fn() as (_message: string, ..._optionalParams: unknown[]) => void,
  });
}

function okResponse(data: unknown = {}) {
  return { ok: true, status: 200, json: vi.fn().mockResolvedValue(data) };
}

describe("useHttp", () => {
  let mockDebug: ReturnType<typeof vi.fn>;
  let mockError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDebug = vi.fn();
    mockError = vi.fn();

    vi.mocked(useLogger).mockReturnValue({
      DEBUG: mockDebug as (_message: string, ..._optionalParams: unknown[]) => void,
      LOG: vi.fn() as (_message: string, ..._optionalParams: unknown[]) => void,
      WARN: vi.fn() as (_message: string, ..._optionalParams: unknown[]) => void,
      ERROR: mockError as (_message: string, ..._optionalParams: unknown[]) => void,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET method", () => {
    it("should make a successful GET request", async () => {
      const mockData = { id: 1, name: "Test" };
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn().mockResolvedValue(mockData) });

      const { result } = renderHook(() => useHttp());
      const response = await result.current.GET("/test");

      expect(response).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        new URL("https://localhost:3003/test"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
        }),
      );
      expect(mockDebug).toHaveBeenCalledTimes(3);
    });

    it("should handle GET request with custom headers", async () => {
      mockFetch.mockResolvedValueOnce(okResponse({ data: "test" }));

      const { result } = renderHook(() => useHttp());
      await result.current.GET("/test", { Authorization: "Bearer token" });

      expect(mockFetch).toHaveBeenCalledWith(
        new URL("https://localhost:3003/test"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer token",
          }),
        }),
      );
    });

    it("should handle GET request with query parameters", async () => {
      mockFetch.mockResolvedValueOnce(okResponse({ results: [] }));

      const { result } = renderHook(() => useHttp());
      await result.current.GET("/search", {}, { q: "test", limit: "10" });

      expect(mockFetch).toHaveBeenCalledWith(
        new URL("https://localhost:3003/search?q=test&limit=10"),
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("should throw error for failed GET request", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404, json: vi.fn() });

      const { result } = renderHook(() => useHttp());

      await expect(result.current.GET("/nonexistent")).rejects.toThrow("HTTP error! status: 404");
      expect(mockError).toHaveBeenCalledWith(
        "[GET] [ERROR] https://localhost:3003/nonexistent",
        expect.any(Error),
      );
    });

    it("should handle network errors in GET request", async () => {
      const networkError = new Error("Network error");
      mockFetch.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useHttp());

      await expect(result.current.GET("/test")).rejects.toThrow("Network error");
      expect(mockError).toHaveBeenCalledWith(
        "[GET] [ERROR] https://localhost:3003/test",
        networkError,
      );
    });
  });

  describe("POST method", () => {
    it("should make a successful POST request", async () => {
      const mockData = { id: 1, created: true };
      mockFetch.mockResolvedValueOnce({ ok: true, status: 201, json: vi.fn().mockResolvedValue(mockData) });

      const requestBody = JSON.stringify({ name: "Test" });
      const { result } = renderHook(() => useHttp());
      const response = await result.current.POST("/create", requestBody);

      expect(response).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        new URL("https://localhost:3003/create"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
          body: requestBody,
        }),
      );
    });

    it("should handle POST request with custom headers", async () => {
      mockFetch.mockResolvedValueOnce(okResponse({ success: true }));

      const requestBody = JSON.stringify({ data: "test" });
      const { result } = renderHook(() => useHttp());
      await result.current.POST("/submit", requestBody, { "X-API-Key": "secret" });

      expect(mockFetch).toHaveBeenCalledWith(
        new URL("https://localhost:3003/submit"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-API-Key": "secret",
          }),
        }),
      );
    });

    it("should handle POST request with FormData", async () => {
      mockFetch.mockResolvedValueOnce(okResponse({ uploaded: true }));

      const formData = new FormData();
      formData.append("file", "test-content");

      const { result } = renderHook(() => useHttp());
      await result.current.POST("/upload", formData);

      expect(mockFetch).toHaveBeenCalledWith(
        new URL("https://localhost:3003/upload"),
        expect.objectContaining({ method: "POST", body: formData }),
      );
    });

    it("should throw error for failed POST request", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 400, json: vi.fn() });

      const { result } = renderHook(() => useHttp());

      await expect(result.current.POST("/create", "{}")).rejects.toThrow("HTTP error! status: 400");
    });

    it("should handle network errors in POST request", async () => {
      const networkError = new Error("Connection refused");
      mockFetch.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useHttp());

      await expect(result.current.POST("/create", "{}")).rejects.toThrow("Connection refused");
    });
  });

  describe("logging behavior", () => {
    it("should log request details", async () => {
      mockFetch.mockResolvedValueOnce(okResponse());

      const { result } = renderHook(() => useHttp());
      await result.current.GET("/test", { param: "value" });

      expect(mockDebug).toHaveBeenNthCalledWith(1, "[GET] https://localhost:3003/test", {
        headers: { param: "value" },
        params: undefined,
      });
    });

    it("should log response status", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 201, json: vi.fn().mockResolvedValue({}) });

      const { result } = renderHook(() => useHttp());
      await result.current.POST("/create", "{}");

      expect(mockDebug).toHaveBeenNthCalledWith(2, "[POST] [STATUS] https://localhost:3003/create", {
        status: 201,
      });
    });

    it("should log response data", async () => {
      const mockData = { id: 123, name: "Test" };
      mockFetch.mockResolvedValueOnce(okResponse(mockData));

      const { result } = renderHook(() => useHttp());
      await result.current.GET("/test");

      expect(mockDebug).toHaveBeenNthCalledWith(3, "[GET] [RESULT] https://localhost:3003/test", mockData);
    });

    it("should use correct logger context", () => {
      renderHook(() => useHttp());
      expect(useLogger).toHaveBeenCalledWith("useHttp");
    });
  });

  describe("URL construction", () => {
    it("should construct relative URLs correctly", async () => {
      mockFetch.mockResolvedValueOnce(okResponse());

      const { result } = renderHook(() => useHttp());
      await result.current.GET("/api/test");

      expect(mockFetch).toHaveBeenCalledWith(
        new URL("https://localhost:3003/api/test"),
        expect.any(Object),
      );
    });

    it("should handle empty URL path", async () => {
      mockFetch.mockResolvedValueOnce(okResponse());

      const { result } = renderHook(() => useHttp());
      await result.current.GET("");

      expect(mockFetch).toHaveBeenCalledWith(new URL("https://localhost:3003/"), expect.any(Object));
    });
  });

  describe("session correlation ID", () => {
    it("sends X-Correlation-ID on every request", async () => {
      mockFetch.mockResolvedValueOnce(okResponse());

      const { result } = renderHook(() => useHttp());
      await result.current.GET("/test");

      const [, init] = mockFetch.mock.calls[0];
      expect((init.headers as Record<string, string>)["X-Correlation-ID"]).toBeDefined();
    });

    it("uses Office.context.diagnostics.correlationId when available", async () => {
      vi.resetModules();
      vi.stubGlobal("Office", { context: { diagnostics: { correlationId: "office-id-abc" } } });
      setupLoggerMock();
      mockFetch.mockResolvedValueOnce(okResponse());

      const { useHttp: freshUseHttp } = await import("./useHttp");
      const { result } = renderHook(() => freshUseHttp());
      await result.current.GET("/test");

      const [, init] = mockFetch.mock.calls[0];
      expect((init.headers as Record<string, string>)["X-Correlation-ID"]).toBe("office-id-abc");

      vi.unstubAllGlobals();
      vi.resetModules();
    });

    it("falls back to crypto.randomUUID when Office is not available", async () => {
      vi.resetModules();
      vi.stubGlobal("Office", undefined);
      vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
        "generated-uuid-xyz" as ReturnType<typeof crypto.randomUUID>,
      );
      setupLoggerMock();
      mockFetch.mockResolvedValueOnce(okResponse());

      const { useHttp: freshUseHttp } = await import("./useHttp");
      const { result } = renderHook(() => freshUseHttp());
      await result.current.GET("/test");

      const [, init] = mockFetch.mock.calls[0];
      expect((init.headers as Record<string, string>)["X-Correlation-ID"]).toBe("generated-uuid-xyz");

      vi.unstubAllGlobals();
      vi.resetModules();
    });

    it("reuses the same ID across multiple requests in a session", async () => {
      vi.resetModules();
      vi.stubGlobal("Office", undefined);
      let callCount = 0;
      vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(
        () => `uuid-${++callCount}` as ReturnType<typeof crypto.randomUUID>,
      );
      setupLoggerMock();
      mockFetch.mockResolvedValue(okResponse());

      const { useHttp: freshUseHttp } = await import("./useHttp");
      const { result } = renderHook(() => freshUseHttp());
      await result.current.GET("/first");
      await result.current.GET("/second");

      expect(callCount).toBe(1);
      const id1 = (mockFetch.mock.calls[0][1].headers as Record<string, string>)["X-Correlation-ID"];
      const id2 = (mockFetch.mock.calls[1][1].headers as Record<string, string>)["X-Correlation-ID"];
      expect(id1).toBe(id2);

      vi.unstubAllGlobals();
      vi.resetModules();
    });
  });
});
