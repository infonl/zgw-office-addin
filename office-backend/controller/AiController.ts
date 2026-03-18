/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { AiService } from "../service/AiService";
import { ExceptionHandler } from "../exception/ExceptionHandler";

export class AiController {
  constructor(private readonly aiService: AiService) {}

  public async getMetadata(
    request: FastifyRequest<{ Body: { document: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { document } = request.body;
      const response = await this.aiService.getMetadata(document);
      reply.status(200).send(response);
    } catch (error) {
      ExceptionHandler.handleAndReply(error, reply);
    }
  }
}
