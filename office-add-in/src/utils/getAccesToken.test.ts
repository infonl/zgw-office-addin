/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getToken, clearToken } from "./getAccesToken";

global.Office = {
  auth: {
    getAccessToken: vi.fn(),
  },
} as unknown as typeof Office;

describe("getAccesToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearToken(); // Clear cache before each test
  });

  afterEach(() => {
    clearToken();
  });

  describe("getToken", () => {
    it("should return a token on successful authentication", async () => {
      const mockToken = "mock-access-token-123";
      vi.mocked(Office.auth.getAccessToken).mockResolvedValue(mockToken);

      const token = await getToken();

      expect(token).toBe(mockToken);
      expect(Office.auth.getAccessToken).toHaveBeenCalledTimes(1);
    });

    it("should cache the token and not request again", async () => {
      const mockToken = "mock-cached-token";
      vi.mocked(Office.auth.getAccessToken).mockResolvedValue(mockToken);

      // First call
      const token1 = await getToken();
      // Second call
      const token2 = await getToken();

      expect(token1).toBe(mockToken);
      expect(token2).toBe(mockToken);
      expect(Office.auth.getAccessToken).toHaveBeenCalledTimes(1); // Only called once
    });

    it("should handle error code 13006 with retry", async () => {
      const mockToken = "mock-token-after-retry";
      const error13006 = { code: "13006", message: "User not signed in" };

      vi.mocked(Office.auth.getAccessToken)
        .mockRejectedValueOnce(error13006)
        .mockResolvedValueOnce(mockToken);

      const token = await getToken();

      expect(token).toBe(mockToken);
      expect(Office.auth.getAccessToken).toHaveBeenCalledTimes(2);
    });

    it("should throw error for non-13006 errors", async () => {
      const mockError = { code: "13005", message: "Other error" };
      vi.mocked(Office.auth.getAccessToken).mockRejectedValue(mockError);

      await expect(getToken()).rejects.toEqual(mockError);
      expect(Office.auth.getAccessToken).toHaveBeenCalledTimes(1);
    });

    it("should deduplicate concurrent requests", async () => {
      const mockToken = "mock-concurrent-token";
      let resolvePromise: (_value: string) => void;
      const delayedPromise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(Office.auth.getAccessToken).mockReturnValue(delayedPromise);

      const promise1 = getToken();
      const promise2 = getToken();
      const promise3 = getToken();

      resolvePromise!(mockToken);

      const [token1, token2, token3] = await Promise.all([promise1, promise2, promise3]);

      expect(token1).toBe(mockToken);
      expect(token2).toBe(mockToken);
      expect(token3).toBe(mockToken);
      expect(Office.auth.getAccessToken).toHaveBeenCalledTimes(1);
    });

    it("should clear cached token on error", async () => {
      const mockError = { code: "13005", message: "Auth failed" };
      vi.mocked(Office.auth.getAccessToken).mockRejectedValue(mockError);

      await expect(getToken()).rejects.toEqual(mockError);

      vi.mocked(Office.auth.getAccessToken).mockResolvedValue("new-token");
      const token = await getToken();

      expect(token).toBe("new-token");
      expect(Office.auth.getAccessToken).toHaveBeenCalledTimes(2);
    });

    it("should handle errors without code property", async () => {
      const mockError = new Error("Generic error");
      vi.mocked(Office.auth.getAccessToken).mockRejectedValue(mockError);

      await expect(getToken()).rejects.toThrow("Generic error");
    });
  });

  describe("clearToken", () => {
    it("should clear the cached token", async () => {
      const mockToken1 = "token-1";
      const mockToken2 = "token-2";

      vi.mocked(Office.auth.getAccessToken).mockResolvedValueOnce(mockToken1);

      await getToken();

      clearToken();

      vi.mocked(Office.auth.getAccessToken).mockResolvedValueOnce(mockToken2);
      const token = await getToken();

      expect(token).toBe(mockToken2);
      expect(Office.auth.getAccessToken).toHaveBeenCalledTimes(2);
    });
  });
});
