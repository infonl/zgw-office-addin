/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import { HttpService } from "./HttpService";
import { LoggerService } from "./LoggerService";
import { mockFetch } from "../../test/setup";

// Mock dependencies
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mock-jwt-token"),
  },
}));
vi.mock("./LoggerService", () => ({
  LoggerService: {
    debug: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
  },
}));

const mockUserInfo = {
  preferredUsername: "test-user",
  name: "Test User",
};

describe("HttpService", () => {
  let httpService: HttpService;

  beforeEach(() => {
    // Reset JWT mock for each test
    vi.mocked(jwt.sign).mockReturnValue("mock-jwt-token" as unknown as void);

    httpService = new HttpService();
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

      const result = await httpService.GET("/test", mockUserInfo);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(new URL("https://api.test.com/test"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept-Crs": "EPSG:4326",
          "Content-Crs": "EPSG:4326",
          Authorization: "Bearer mock-jwt-token",
        },
      });
      expect(LoggerService.debug).toHaveBeenCalledTimes(3); // Request, status, result
    });

    it("should handle GET request with query parameters", async () => {
      const mockData = { results: [] };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await httpService.GET("/search", mockUserInfo, { q: "test", limit: "10" });

      const expectedUrl = new URL("https://api.test.com/search");
      expectedUrl.search = "q=test&limit=10";

      expect(mockFetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          method: "GET",
        }),
      );
    });

    it("should handle GET request with custom headers", async () => {
      const mockData = { data: "test" };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await httpService.GET("/test", mockUserInfo, undefined, { "X-Custom": "value" });

      expect(mockFetch).toHaveBeenCalledWith(new URL("https://api.test.com/test"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept-Crs": "EPSG:4326",
          "Content-Crs": "EPSG:4326",
          Authorization: "Bearer mock-jwt-token",
          "X-Custom": "value",
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

      await httpService.GET("/test", mockUserInfo, { id: "123" }, { "X-Custom": "value" });

      const expectedUrl = new URL("https://api.test.com/test");
      expectedUrl.search = "id=123";

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept-Crs": "EPSG:4326",
          "Content-Crs": "EPSG:4326",
          Authorization: "Bearer mock-jwt-token",
          "X-Custom": "value",
        },
      });
    });

    it("should handle absolute URLs in GET request", async () => {
      const mockData = { external: true };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await httpService.GET("https://external-api.com/data", mockUserInfo);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://external-api.com/data",
        expect.objectContaining({
          method: "GET",
        }),
      );
    });

    it("should throw error for failed GET request", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: vi.fn(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(httpService.GET("/nonexistent", mockUserInfo)).rejects.toThrow(
        "HTTP error! status: 404",
      );
      expect(LoggerService.error).toHaveBeenCalledWith(
        "[HTTP] [GET] [ERROR] https://api.test.com/nonexistent",
        expect.any(Error),
      );
    });

    it("should handle network errors in GET request", async () => {
      const networkError = new Error("Network error");
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(httpService.GET("/test", mockUserInfo)).rejects.toThrow("Network error");
      expect(LoggerService.error).toHaveBeenCalledWith(
        "[HTTP] [GET] [ERROR] https://api.test.com/test",
        networkError,
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
      const result = await httpService.POST("/create", requestBody, mockUserInfo);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(new URL("https://api.test.com/create"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Crs": "EPSG:4326",
          "Content-Crs": "EPSG:4326",
          Authorization: "Bearer mock-jwt-token",
        },
        body: requestBody,
      });
      expect(LoggerService.debug).toHaveBeenCalledTimes(3); // Request, status, result
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
      await httpService.POST("/submit", requestBody, mockUserInfo, { "X-API-Key": "secret" });

      expect(mockFetch).toHaveBeenCalledWith(new URL("https://api.test.com/submit"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Crs": "EPSG:4326",
          "Content-Crs": "EPSG:4326",
          Authorization: "Bearer mock-jwt-token",
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

      await httpService.POST("/upload", formData, mockUserInfo);

      expect(mockFetch).toHaveBeenCalledWith(new URL("https://api.test.com/upload"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Crs": "EPSG:4326",
          "Content-Crs": "EPSG:4326",
          Authorization: "Bearer mock-jwt-token",
        },
        body: formData,
      });
    });

    it("should handle absolute URLs in POST request", async () => {
      const mockData = { external: true };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await httpService.POST("https://external-api.com/submit", "{}", mockUserInfo);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://external-api.com/submit",
        expect.objectContaining({
          method: "POST",
          body: "{}",
        }),
      );
    });

    it("should throw error for failed POST request", async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: vi.fn(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(httpService.POST("/create", "{}", mockUserInfo)).rejects.toThrow(
        "HTTP error! status: 400",
      );
      expect(LoggerService.error).toHaveBeenCalledWith(
        "[HTTP] [POST] [ERROR] https://api.test.com/create",
        expect.any(Error),
      );
    });

    it("should handle network errors in POST request", async () => {
      const networkError = new Error("Connection refused");
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(httpService.POST("/create", "{}", mockUserInfo)).rejects.toThrow(
        "Connection refused",
      );
      expect(LoggerService.error).toHaveBeenCalledWith(
        "[HTTP] [POST] [ERROR] https://api.test.com/create",
        networkError,
      );
    });
  });

  describe("JWT token generation", () => {
    it("should generate JWT token with correct payload", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await httpService.GET("/test", mockUserInfo);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          iss: "office-add-in",
          iat: expect.any(Number),
          client_id: "office-add-in",
          user_id: mockUserInfo.preferredUsername,
          user_representation: mockUserInfo.name,
        },
        "test-secret",
        {
          algorithm: "HS256",
        },
      );
    });

    it("should include JWT token in Authorization header", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await httpService.GET("/test", mockUserInfo);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer mock-jwt-token",
          }),
        }),
      );
    });

    it("should generate fresh token for each request", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await httpService.GET("/test1", mockUserInfo);
      await httpService.GET("/test2", mockUserInfo);

      expect(jwt.sign).toHaveBeenCalledTimes(2);
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

      await httpService.GET("/test", mockUserInfo, { param: "value" });

      expect(LoggerService.debug).toHaveBeenNthCalledWith(
        1,
        "[HTTP] [GET] https://api.test.com/test?param=value",
        { headers: {}, params: { param: "value" } },
      );
    });

    it("should log response status", async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await httpService.POST("/create", "{}", mockUserInfo);

      expect(LoggerService.debug).toHaveBeenNthCalledWith(
        2,
        "[HTTP] [POST] [STATUS] https://api.test.com/create",
        { status: 201 },
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

      await httpService.GET("/test", mockUserInfo);

      expect(LoggerService.debug).toHaveBeenNthCalledWith(
        3,
        "[HTTP] [GET] [RESULT] https://api.test.com/test",
        mockData,
      );
    });

    it("should log errors", async () => {
      const error = new Error("Test error");
      mockFetch.mockRejectedValueOnce(error);

      await expect(httpService.GET("/test", mockUserInfo)).rejects.toThrow("Test error");

      expect(LoggerService.error).toHaveBeenCalledWith(
        "[HTTP] [GET] [ERROR] https://api.test.com/test",
        error,
      );
    });
  });

  describe("URL construction", () => {
    it("should construct relative URLs correctly", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await httpService.GET("/api/test", mockUserInfo);

      expect(mockFetch).toHaveBeenCalledWith(
        new URL("https://api.test.com/api/test"),
        expect.any(Object),
      );
    });

    it("should handle absolute HTTP URLs", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await httpService.GET("http://external.com/api", mockUserInfo);

      expect(mockFetch).toHaveBeenCalledWith("http://external.com/api", expect.any(Object));
    });

    it("should handle absolute HTTPS URLs", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await httpService.GET("https://external.com/api", mockUserInfo);

      expect(mockFetch).toHaveBeenCalledWith("https://external.com/api", expect.any(Object));
    });

    it("should handle URLs without leading slash", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await httpService.GET("api/test", mockUserInfo);

      expect(mockFetch).toHaveBeenCalledWith(
        new URL("https://api.test.com/api/test"),
        expect.any(Object),
      );
    });
  });

  describe("headers", () => {
    it("should include default headers", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await httpService.GET("/test", mockUserInfo);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "Accept-Crs": "EPSG:4326",
            "Content-Crs": "EPSG:4326",
            Authorization: expect.stringMatching(/^Bearer /),
          }),
        }),
      );
    });

    it("should merge custom headers with default headers", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await httpService.GET("/test", mockUserInfo, undefined, {
        "X-Custom": "value",
        "Content-Type": "application/xml", // Should override default
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/xml", // Overridden
            "Accept-Crs": "EPSG:4326",
            "Content-Crs": "EPSG:4326",
            Authorization: expect.stringMatching(/^Bearer /),
            "X-Custom": "value",
          }),
        }),
      );
    });
  });
});
