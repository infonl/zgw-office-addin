/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { ExceptionHandler } from "./ExceptionHandler";
import { FileNotSupported } from "./FileNotSupported";
import { FastifyReply } from "fastify";

describe("ExceptionHandler", () => {
  const mockReply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleAndReply", () => {
    it("Any non-error will reply as internal server error 500", async () => {
      const message = "error";
      ExceptionHandler.handleAndReply(message, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith(message);
    });

    it("FileNotSupported will reply as bad request 400", async () => {
      const e = new FileNotSupported("not-supported.ext");
      ExceptionHandler.handleAndReply(e, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(e.statusCode);
      expect(mockReply.send).toHaveBeenCalledWith(e.message);
    });

    it("Error without statusCode will reply with 500", async () => {
      const e = new Error("any ol' error");
      ExceptionHandler.handleAndReply(e, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith(e.message);
    });

    it("Any object with a message will reply with 500", async () => {
      const e = {
        message: "any ol' error",
      };

      ExceptionHandler.handleAndReply(e, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith(e.message);
    });

    it("Any object with message and statusCode will reply with statusCode", async () => {
      const e = {
        message: "any ol' error",
        statusCode: 333,
      };

      ExceptionHandler.handleAndReply(e, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(e.statusCode);
      expect(mockReply.send).toHaveBeenCalledWith(e.message);
    });

    it("Null object will reply with 500", async () => {
      const e = null;
      ExceptionHandler.handleAndReply(e, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith("Internal server error");
    });
  });
});
