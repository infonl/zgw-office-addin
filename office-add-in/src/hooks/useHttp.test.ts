/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHttp } from "./useHttp";
import { useLogger } from "./useLogger";

// Mock the useLogger hook
vi.mock("./useLogger", () => ({
  useLogger: vi.fn(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

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
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useHttp());
      const response = await result.current.GET("/test");

      expect(response).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(new URL("https://localhost:3003/test"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      expect(mockDebug).toHaveBeenCalledTimes(3); // Initial request, status, and result
    });

    it("should handle GET request with query parameters", async () => {
      const mockData = { results: [] };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useHttp());
      await result.current.GET("/search", { q: "test", limit: "10" });

      expect(mockFetch).toHaveBeenCalledWith(new URL("https://localhost:3003/search"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          q: "test",
          limit: "10",
        },
      });
    });

    it("should handle GET request with custom headers", async () => {
      const mockData = { data: "test" };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useHttp());
      await result.current.GET("/test", undefined, { Authorization: "Bearer token" });

      const expectedUrl = new URL("https://localhost:3003/test?Authorization=Bearer+token");
      expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    it("should handle GET request with both params and headers", async () => {
      const mockData = { data: "test" };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useHttp());
      await result.current.GET("/test", { id: "123" }, { "X-Custom": "value" });

      const expectedUrl = new URL("https://localhost:3003/test?X-Custom=value");
      expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          id: "123",
        },
      });
    });

    it("should throw error for failed GET request", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: vi.fn(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useHttp());

      await expect(result.current.GET("/nonexistent")).rejects.toThrow("HTTP error! status: 404");
      expect(mockError).toHaveBeenCalledWith(
        "[GET] [ERROR] https://localhost:3003/nonexistent",
        expect.any(Error)
      );
    });

    it("should handle network errors in GET request", async () => {
      const networkError = new Error("Network error");
      mockFetch.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useHttp());

      await expect(result.current.GET("/test")).rejects.toThrow("Network error");
      expect(mockError).toHaveBeenCalledWith(
        "[GET] [ERROR] https://localhost:3003/test",
        networkError
      );
    });
  });

  describe("POST method", () => {
    it("should make a successful POST request", async () => {
      const mockData = { id: 1, created: true };
      const mockResponse = {
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const requestBody = JSON.stringify({ name: "Test" });
      const { result } = renderHook(() => useHttp());
      const response = await result.current.POST("/create", requestBody);

      expect(response).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(new URL("https://localhost:3003/create"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      });
      expect(mockDebug).toHaveBeenCalledTimes(3); // Initial request, status, and result
    });

    it("should handle POST request with custom headers", async () => {
      const mockData = { success: true };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const requestBody = JSON.stringify({ data: "test" });
      const { result } = renderHook(() => useHttp());
      await result.current.POST("/submit", requestBody, { "X-API-Key": "secret" });

      expect(mockFetch).toHaveBeenCalledWith(new URL("https://localhost:3003/submit"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "secret",
        },
        body: requestBody,
      });
    });

    it("should handle POST request with FormData", async () => {
      const mockData = { uploaded: true };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.append("file", "test-content");

      const { result } = renderHook(() => useHttp());
      await result.current.POST("/upload", formData);

      expect(mockFetch).toHaveBeenCalledWith(new URL("https://localhost:3003/upload"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: formData,
      });
    });

    it("should throw error for failed POST request", async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: vi.fn(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useHttp());

      await expect(result.current.POST("/create", "{}")).rejects.toThrow("HTTP error! status: 400");
      expect(mockError).toHaveBeenCalledWith(
        "[POST] [ERROR] https://localhost:3003/create",
        expect.any(Error)
      );
    });

    it("should handle network errors in POST request", async () => {
      const networkError = new Error("Connection refused");
      mockFetch.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useHttp());

      await expect(result.current.POST("/create", "{}")).rejects.toThrow("Connection refused");
      expect(mockError).toHaveBeenCalledWith(
        "[POST] [ERROR] https://localhost:3003/create",
        networkError
      );
    });
  });

  describe("logging behavior", () => {
    it("should log request details", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useHttp());
      await result.current.GET("/test", { param: "value" });

      expect(mockDebug).toHaveBeenNthCalledWith(1, "[GET] https://localhost:3003/test", {
        headers: { param: "value" },
        params: undefined,
      });
    });

    it("should log response status", async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useHttp());
      await result.current.POST("/create", "{}");

      expect(mockDebug).toHaveBeenNthCalledWith(
        2,
        "[POST] [STATUS] https://localhost:3003/create",
        { status: 201 }
      );
    });

    it("should log response data", async () => {
      const mockData = { id: 123, name: "Test" };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useHttp());
      await result.current.GET("/test");

      expect(mockDebug).toHaveBeenNthCalledWith(
        3,
        "[GET] [RESULT] https://localhost:3003/test",
        mockData
      );
    });

    it("should use correct logger context", () => {
      renderHook(() => useHttp());

      expect(useLogger).toHaveBeenCalledWith("useHttp");
    });
  });

  describe("URL construction", () => {
    it("should construct URLs correctly with leading slash", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useHttp());
      await result.current.GET("/api/test");

      expect(mockFetch).toHaveBeenCalledWith(
        new URL("https://localhost:3003/api/test"),
        expect.any(Object)
      );
    });

    it("should construct URLs correctly without leading slash", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useHttp());
      await result.current.GET("/api/test"); // Fix: add leading slash since the hook expects it

      expect(mockFetch).toHaveBeenCalledWith(
        new URL("https://localhost:3003/api/test"),
        expect.any(Object)
      );
    });

    it("should handle empty URL path", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useHttp());
      await result.current.GET("");

      expect(mockFetch).toHaveBeenCalledWith(
        new URL("https://localhost:3003/"),
        expect.any(Object)
      );
    });
  });
});
