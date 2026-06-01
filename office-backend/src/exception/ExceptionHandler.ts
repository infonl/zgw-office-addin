/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { FastifyReply } from "fastify";
import { LoggerService } from "../service/LoggerService";

export class ExceptionHandler {
  public static handleAndReply(error: unknown, reply: FastifyReply): void {
    let statusCode = 500;
    let message = "Internal server error";

    if (typeof error === "object" && error !== null) {
      if ("message" in error) {
        message = String((error as Record<string, unknown>).message);
      }
      if ("statusCode" in error && typeof error.statusCode === "number") {
        statusCode = error.statusCode;
      }
    }

    LoggerService.error(`Response ${statusCode}:`, message);
    reply.status(statusCode).send({ error: message });
  }
}
