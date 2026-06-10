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
    return {
      message: this.formatMessage(error),
      cause: this.formatCause(error),
      statusCode: this.determineStatusCode(error),
    };
  }

  private static formatMessage(err: unknown): string {
    if (typeof err === "object" && err !== null) {
      const e = err as Record<string, unknown>;
      if ("message" in err) {
        return String(e.message);
      }
    } else if (typeof err === "string") {
      return err;
    }
    return "Internal server error";
  }

  private static determineStatusCode(err: unknown): number {
    if (typeof err === "object" && err !== null) {
      const e = err as Record<string, unknown>;
      if ("statusCode" in err && typeof e.statusCode === "number") {
        return e.statusCode;
      }
    }
    return 500;
  }

  private static formatCause(err: unknown): string {
    return this.buildCauseParts(err).join("\n");
  }

  private static buildCauseParts(err: unknown): string[] {
    if (typeof err !== "object" || err === null || !("cause" in err)) {
      return [];
    }
    const causeValue = (err as Record<string, unknown>).cause;
    if (typeof causeValue === "string") {
      return [causeValue];
    }
    if (typeof causeValue === "object" && causeValue !== null) {
      const parts: string[] = [];
      const msg = (causeValue as Record<string, unknown>).message;
      if (typeof msg === "string" && msg) {
        parts.push(msg);
      }
      parts.push(...this.buildCauseParts(causeValue));
      return parts;
    }
    return [];
  }
}
