/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { AiService } from "../service/AiService";
import { ExceptionHandler } from "../exception/ExceptionHandler";
import { DocumentInfo } from "../src/types";

export class AiController {
  constructor(private readonly aiService: AiService) {}

  public async getMetadata(
    request: FastifyRequest<{ Body: DocumentInfo }>,
    reply: FastifyReply,
  ) {
    try {
      const response = await this.aiService.getMetadata(request.body);
      reply.status(200).send(response);
    } catch (error) {
      ExceptionHandler.handleAndReply(error, reply);
    }
  }
}
