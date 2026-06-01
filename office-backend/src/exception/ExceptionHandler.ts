/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { FastifyReply } from "fastify";
import { LoggerService } from "../service/LoggerService";

type ErrorDetails = {
  message: string;
  cause: string | undefined;
  statusCode: number;
};

export class ExceptionHandler {
  public static handleAndReply(error: unknown, reply: FastifyReply): void {
    const errorDetails = ExceptionHandler.extractDetails(error);
    ExceptionHandler.logErrorDetails(errorDetails);
    reply.status(errorDetails.statusCode).send(errorDetails.message);
  }

  private static logErrorDetails(errorDetails: ErrorDetails) {
    let logMessage = `Response ${errorDetails.statusCode}: ${errorDetails.message}`;
    if (errorDetails.cause) {
      logMessage = `${logMessage}. Cause: ${errorDetails.cause}`;
    }

    LoggerService.error(logMessage);
  }

  private static extractDetails(error: unknown): ErrorDetails {
    let message = "Internal server error";
    let statusCode = 500;
    let cause: string | undefined = undefined;

    if (typeof error === "object" && error !== null) {
      const err = error as Record<string, unknown>;
      if ("message" in error) {
        message = String(err.message);
      }
      if ("statusCode" in error && typeof err.statusCode === "number") {
        statusCode = err.statusCode;
      }
      if ("cause" in error) {
        cause = String(err.message);
      }
    }
    if (typeof error === "string") {
      message = error;
    }

    return {
      message,
      cause,
      statusCode,
    };
  }
}
