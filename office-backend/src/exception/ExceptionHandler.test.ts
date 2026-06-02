/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExceptionHandler } from "./ExceptionHandler";
import { FileNotSupported } from "./FileNotSupported";
import { LoggerService } from "../service/LoggerService";
import { FastifyReply } from "fastify";

describe("ExceptionHandler", () => {
  const mockReply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(LoggerService, "error").mockImplementation(() => {});
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

  describe("cause formatting", () => {
    it("logs cause when error has a string cause", () => {
      const e = new Error("something failed", { cause: "upstream timed out" });
      ExceptionHandler.handleAndReply(e, mockReply);

      expect(logSpy).toHaveBeenCalledWith(
        "Response 500: something failed. Cause: upstream timed out",
      );
    });

    it("does not include cause in log when error has no cause", () => {
      const e = new Error("plain error");
      ExceptionHandler.handleAndReply(e, mockReply);

      expect(logSpy).toHaveBeenCalledWith("Response 500: plain error");
    });

    it("logs cause when error has a nested Error cause", () => {
      const cause = new Error("root cause");
      const e = new Error("outer error", { cause });
      ExceptionHandler.handleAndReply(e, mockReply);

      expect(logSpy).toHaveBeenCalledWith("Response 500: outer error. Cause: root cause");
    });

    it("logs cause as multiple lines for deeply nested Error causes", () => {
      const deep = new Error("inner cause", { cause: "root string" });
      const e = new Error("outer error", { cause: deep });
      ExceptionHandler.handleAndReply(e, mockReply);

      expect(logSpy).toHaveBeenCalledWith(
        "Response 500: outer error. Cause: inner cause\nroot string",
      );
    });

    it("cause does not affect the HTTP response body", () => {
      const e = new Error("visible message", { cause: "internal detail" });
      ExceptionHandler.handleAndReply(e, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith("visible message");
    });
  });
});
