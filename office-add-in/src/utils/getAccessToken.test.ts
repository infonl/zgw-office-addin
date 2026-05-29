/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OfficeMockObject } from "office-addin-mock";
import { getToken, clearToken } from "./getAccessToken";

function makePrimaryMock(getAccessTokenMock: ReturnType<typeof vi.fn>) {
  // No context.auth — prevents the fallback path from triggering in primary-path tests
  const officeMock = new OfficeMockObject({
    auth: { getAccessToken: getAccessTokenMock },
  });
  return officeMock;
}

function makeFallbackMock(
  getAccessTokenMock: ReturnType<typeof vi.fn>,
  getAccessTokenAsyncMock: ReturnType<typeof vi.fn>
) {
  const officeMock = new OfficeMockObject({
    auth: { getAccessToken: getAccessTokenMock },
    context: { auth: { getAccessTokenAsync: getAccessTokenAsyncMock } },
  });
  // Assign AsyncResultStatus as a plain object: OfficeMockObject wraps nested
  // objects as child mocks, which breaks simple string equality checks in the
  // source code (result.status === Office.AsyncResultStatus.Succeeded).
  Object.assign(officeMock, {
    AsyncResultStatus: { Succeeded: "succeeded", Failed: "failed" },
  });
  return officeMock;
}

describe("getAccessToken", () => {
  let getAccessTokenMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    clearToken();
    getAccessTokenMock = vi.fn();
    global.Office = makePrimaryMock(getAccessTokenMock) as unknown as typeof Office;
  });

  afterEach(() => {
    clearToken();
  });

  describe("getToken — primary path (Office.auth.getAccessToken)", () => {
    it("returns a token on successful authentication", async () => {
      getAccessTokenMock.mockResolvedValue("mock-access-token-123");

      const token = await getToken();

      expect(token).toBe("mock-access-token-123");
      expect(getAccessTokenMock).toHaveBeenCalledTimes(1);
    });

    it("caches the token and does not request again while still valid", async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const mockToken = `header.${btoa(JSON.stringify({ exp: futureExp }))}.signature`;
      getAccessTokenMock.mockResolvedValue(mockToken);

      const token1 = await getToken();
      const token2 = await getToken();

      expect(token1).toBe(mockToken);
      expect(token2).toBe(mockToken);
      expect(getAccessTokenMock).toHaveBeenCalledTimes(1);
    });

    it("retries once on error code 13006 then returns the token", async () => {
      getAccessTokenMock
        .mockRejectedValueOnce({ code: 13006, message: "Token expired" })
        .mockResolvedValueOnce("mock-token-after-retry");

      const token = await getToken();

      expect(token).toBe("mock-token-after-retry");
      expect(getAccessTokenMock).toHaveBeenCalledTimes(2);
    });

    it("deduplicates concurrent requests — only one Office.auth call is made", async () => {
      let resolve: (_value: string) => void;
      const delayed = new Promise<string>((r) => {
        resolve = r;
      });
      getAccessTokenMock.mockReturnValue(delayed);

      const promise1 = getToken();
      const promise2 = getToken();
      const promise3 = getToken();

      resolve!("concurrent-token");

      const [t1, t2, t3] = await Promise.all([promise1, promise2, promise3]);

      expect(t1).toBe("concurrent-token");
      expect(t2).toBe("concurrent-token");
      expect(t3).toBe("concurrent-token");
      expect(getAccessTokenMock).toHaveBeenCalledTimes(1);
    });

    it("clears the cache after an error so the next call retries", async () => {
      getAccessTokenMock
        .mockRejectedValueOnce({ code: 13005, message: "Auth failed" })
        .mockResolvedValueOnce("new-token");

      await expect(getToken()).rejects.toMatchObject({ code: 13005 });

      const token = await getToken();

      expect(token).toBe("new-token");
      expect(getAccessTokenMock).toHaveBeenCalledTimes(2);
    });

    it("propagates non-13006 errors without retrying", async () => {
      const mockError = { code: 13005, message: "Other error" };
      getAccessTokenMock.mockRejectedValue(mockError);

      await expect(getToken()).rejects.toEqual(mockError);
      expect(getAccessTokenMock).toHaveBeenCalledTimes(1);
    });

    it("propagates errors that have no code property", async () => {
      getAccessTokenMock.mockRejectedValue(new Error("Generic error"));

      await expect(getToken()).rejects.toThrow("Generic error");
    });
  });

  describe("getToken — fallback path (Office.context.auth.getAccessTokenAsync)", () => {
    let getAccessTokenAsyncMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      vi.clearAllMocks();
      clearToken();
      getAccessTokenMock = vi.fn();
      getAccessTokenAsyncMock = vi.fn();
      global.Office = makeFallbackMock(
        getAccessTokenMock,
        getAccessTokenAsyncMock
      ) as unknown as typeof Office;
    });

    it("falls back to getAccessTokenAsync when primary path fails with a non-13006 error", async () => {
      getAccessTokenMock.mockRejectedValue({ code: 13005, message: "Primary failed" });
      getAccessTokenAsyncMock.mockImplementation(
        (_options: unknown, callback: (_result: { status: string; value: string }) => void) => {
          callback({ status: "succeeded", value: "fallback-token" });
        }
      );

      const token = await getToken();

      expect(token).toBe("fallback-token");
      expect(getAccessTokenMock).toHaveBeenCalledTimes(1);
      expect(getAccessTokenAsyncMock).toHaveBeenCalledTimes(1);
    });

    it("passes the correct options to getAccessTokenAsync", async () => {
      getAccessTokenMock.mockRejectedValue({ code: 13005 });
      getAccessTokenAsyncMock.mockImplementation(
        (_options: unknown, callback: (_result: { status: string; value: string }) => void) => {
          callback({ status: "succeeded", value: "token" });
        }
      );

      await getToken();

      expect(getAccessTokenAsyncMock).toHaveBeenCalledWith(
        expect.objectContaining({ forMSGraphAccess: true, allowSignInPrompt: true }),
        expect.any(Function)
      );
    });

    it("rejects when getAccessTokenAsync callback reports failure", async () => {
      getAccessTokenMock.mockRejectedValue({ code: 13005 });
      const asyncError = new Error("Async auth failed");
      getAccessTokenAsyncMock.mockImplementation(
        (_options: unknown, callback: (_result: { status: string; error: Error }) => void) => {
          callback({ status: "failed", error: asyncError });
        }
      );

      await expect(getToken()).rejects.toThrow("Async auth failed");
    });

    it("throws the original error when context.auth.getAccessTokenAsync is unavailable", async () => {
      const originalError = { code: 13005, message: "No fallback available" };
      global.Office = makePrimaryMock(
        vi.fn().mockRejectedValue(originalError)
      ) as unknown as typeof Office;

      await expect(getToken()).rejects.toEqual(originalError);
    });
  });

  describe("clearToken", () => {
    it("clears the cached token so the next call fetches a fresh one", async () => {
      getAccessTokenMock.mockResolvedValueOnce("token-1").mockResolvedValueOnce("token-2");

      await getToken();
      clearToken();
      const token = await getToken();

      expect(token).toBe("token-2");
      expect(getAccessTokenMock).toHaveBeenCalledTimes(2);
    });
  });
});
