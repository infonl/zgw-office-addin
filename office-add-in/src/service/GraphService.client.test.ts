/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GraphServiceClient } from "./GraphService.client";

const { mockGet, mockPost, mockResponseType, mockClientApi, mockClientInit } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const mockResponseType = vi.fn();
  const mockApiBuilder = { get: mockGet, post: mockPost, responseType: mockResponseType };
  mockResponseType.mockReturnValue(mockApiBuilder);
  const mockClientApi = vi.fn(() => mockApiBuilder);
  const mockClientInit = vi.fn(() => ({ api: mockClientApi }));
  return { mockGet, mockPost, mockResponseType, mockClientApi, mockClientInit };
});

vi.mock("@microsoft/microsoft-graph-client", () => ({
  Client: { init: mockClientInit },
  ResponseType: { ARRAYBUFFER: "arraybuffer", TEXT: "text" },
}));

const mockAuthService = { getAccessToken: vi.fn() };

const mockLogger = {
  DEBUG: vi.fn(),
  WARN: vi.fn(),
  ERROR: vi.fn(),
};

function createClient() {
  return new GraphServiceClient(mockAuthService, mockLogger);
}

function capturedAuthProvider() {
  const firstCall = mockClientInit.mock.calls[0] as unknown as [{ authProvider: unknown }];
  return firstCall[0].authProvider as (
    _done: (_err: unknown, _token: string | null) => void
  ) => Promise<void>;
}

describe("GraphServiceClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("initialises Client and logs DEBUG", () => {
      createClient();
      expect(mockClientInit).toHaveBeenCalledOnce();
      expect(mockLogger.DEBUG).toHaveBeenCalledWith("Initialized");
    });
  });

  describe("authProvider", () => {
    it("calls done with token on success", async () => {
      mockAuthService.getAccessToken.mockResolvedValueOnce("my-token");
      createClient();

      const done = vi.fn();
      await capturedAuthProvider()(done);

      expect(done).toHaveBeenCalledWith(null, "my-token");
      expect(mockLogger.DEBUG).toHaveBeenCalledWith(
        "Token retrieved:",
        expect.stringContaining("my-token".substring(0, 20))
      );
    });

    it("logs null when token is falsy", async () => {
      mockAuthService.getAccessToken.mockResolvedValueOnce("");
      createClient();

      const done = vi.fn();
      await capturedAuthProvider()(done);

      expect(done).toHaveBeenCalledWith(null, "");
      expect(mockLogger.DEBUG).toHaveBeenCalledWith("Token retrieved:", null);
    });

    it("calls done with error when getAccessToken rejects", async () => {
      const tokenError = new Error("token failed");
      mockAuthService.getAccessToken.mockRejectedValueOnce(tokenError);
      createClient();

      const done = vi.fn();
      await capturedAuthProvider()(done);

      expect(done).toHaveBeenCalledWith(tokenError, null);
      expect(mockLogger.ERROR).toHaveBeenCalledWith("Token retrieval failed:", tokenError);
    });
  });

  describe("getMessage", () => {
    it("calls the correct endpoint and returns the result", async () => {
      const message = { id: "msg-1", subject: "Hello" };
      mockGet.mockResolvedValueOnce(message);

      const client = createClient();
      const result = await client.getMessage("msg-1");

      expect(mockClientApi).toHaveBeenCalledWith("/me/messages/msg-1");
      expect(result).toEqual(message);
    });

    it("encodes the graphId in the endpoint", async () => {
      mockGet.mockResolvedValueOnce({});
      const client = createClient();
      await client.getMessage("id/with spaces");

      expect(mockClientApi).toHaveBeenCalledWith(
        `/me/messages/${encodeURIComponent("id/with spaces")}`
      );
    });

    it("logs error and re-throws on failure", async () => {
      const error = new Error("not found");
      mockGet.mockRejectedValueOnce(error);

      const client = createClient();
      await expect(client.getMessage("msg-1")).rejects.toThrow(error);
      expect(mockLogger.ERROR).toHaveBeenCalledWith("getMessage error:", error);
    });
  });

  describe("getUserInfo", () => {
    it("calls the correct endpoint and returns the result", async () => {
      const userInfo = { id: "user-oid", displayName: "Test User" };
      mockGet.mockResolvedValueOnce(userInfo);

      const client = createClient();
      const result = await client.getUserInfo("user-oid");

      expect(mockClientApi).toHaveBeenCalledWith("/users/user-oid");
      expect(result).toEqual(userInfo);
    });

    it("logs error and re-throws on failure", async () => {
      const error = new Error("forbidden");
      mockGet.mockRejectedValueOnce(error);

      const client = createClient();
      await expect(client.getUserInfo("user-oid")).rejects.toThrow(error);
      expect(mockLogger.ERROR).toHaveBeenCalledWith("getUserInfo error:", error);
    });
  });

  describe("getAttachmentContent", () => {
    it("calls the correct endpoint with ARRAYBUFFER response type", async () => {
      const buffer = new ArrayBuffer(8);
      mockGet.mockResolvedValueOnce(buffer);

      const client = createClient();
      const result = await client.getAttachmentContent("msg-1", "att-1");

      expect(mockClientApi).toHaveBeenCalledWith(`/me/messages/msg-1/attachments/att-1/$value`);
      expect(mockResponseType).toHaveBeenCalledWith("arraybuffer");
      expect(result).toBe(buffer);
    });

    it("logs error and re-throws on failure", async () => {
      const error = new Error("server error");
      mockGet.mockRejectedValueOnce(error);

      const client = createClient();
      await expect(client.getAttachmentContent("msg-1", "att-1")).rejects.toThrow(error);
      expect(mockLogger.ERROR).toHaveBeenCalledWith("getAttachmentContent error:", error);
    });
  });

  describe("getEmailAsEML", () => {
    it("calls the correct endpoint with TEXT response type", async () => {
      const emlContent = "From: test@example.com\r\nSubject: Hello";
      mockGet.mockResolvedValueOnce(emlContent);

      const client = createClient();
      const result = await client.getEmailAsEML("msg-1");

      expect(mockClientApi).toHaveBeenCalledWith("/me/messages/msg-1/$value");
      expect(mockResponseType).toHaveBeenCalledWith("text");
      expect(result).toBe(emlContent);
    });

    it("logs error and re-throws on failure", async () => {
      const error = new Error("server error");
      mockGet.mockRejectedValueOnce(error);

      const client = createClient();
      await expect(client.getEmailAsEML("msg-1")).rejects.toThrow(error);
      expect(mockLogger.ERROR).toHaveBeenCalledWith("getEmailAsEML error:", error);
    });
  });

  describe("officeIdsToGraphIdsViaApi", () => {
    it("maps targetId values from the result", async () => {
      mockPost.mockResolvedValueOnce({
        value: [{ targetId: "graph-1" }, { targetId: "graph-2" }],
      });

      const client = createClient();
      const result = await client.officeIdsToGraphIdsViaApi(["ews-1", "ews-2"]);

      expect(result).toEqual(["graph-1", "graph-2"]);
    });

    it("returns null for entries with missing targetId", async () => {
      mockPost.mockResolvedValueOnce({
        value: [{ targetId: "graph-1" }, { targetId: null }, {}],
      });

      const client = createClient();
      const result = await client.officeIdsToGraphIdsViaApi(["ews-1", "ews-2", "ews-3"]);

      expect(result).toEqual(["graph-1", null, null]);
    });

    it("uses ewsId as default sourceIdType", async () => {
      mockPost.mockResolvedValueOnce({ value: [] });

      const client = createClient();
      await client.officeIdsToGraphIdsViaApi(["ews-1"]);

      expect(mockPost).toHaveBeenCalledWith(expect.objectContaining({ sourceIdType: "ewsId" }));
    });

    it("passes custom sourceIdType to the POST body", async () => {
      mockPost.mockResolvedValueOnce({ value: [] });

      const client = createClient();
      await client.officeIdsToGraphIdsViaApi(["entry-1"], "entryId");

      expect(mockPost).toHaveBeenCalledWith(expect.objectContaining({ sourceIdType: "entryId" }));
    });

    it("logs WARN and returns null array when result has no value", async () => {
      mockPost.mockResolvedValueOnce({});

      const client = createClient();
      const result = await client.officeIdsToGraphIdsViaApi(["ews-1", "ews-2"]);

      expect(result).toEqual([null, null]);
      expect(mockLogger.WARN).toHaveBeenCalledWith("officeIdsToGraphIdsViaApi: no value in result");
    });

    it("catches errors and returns null array without re-throwing", async () => {
      const error = new Error("network error");
      mockPost.mockRejectedValueOnce(error);

      const client = createClient();
      const result = await client.officeIdsToGraphIdsViaApi(["ews-1", "ews-2"]);

      expect(result).toEqual([null, null]);
      expect(mockLogger.ERROR).toHaveBeenCalledWith("officeIdsToGraphIdsViaApi error:", error);
    });
  });
});
