/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { ZaakService } from "../service/ZaakService";
import type { ZaakParam } from "../dto/ZaakParam";
import { ExceptionHandler } from "../exception/ExceptionHandler";

export class ZaakController {
  constructor(private readonly zaakService: ZaakService) {}

  public async getZaak(request: FastifyRequest<{ Params: ZaakParam }>, reply: FastifyReply) {
    const zaakIdentificatie = request.params.zaakIdentificatie;
    try {
      const userInfo = this.zaakService.resolveUserInfo(request.headers["authorization"]);
      const correlationId = request.headers["x-correlation-id"] as string | undefined;
      const response = await this.zaakService.getZaak(zaakIdentificatie, userInfo, correlationId);
      reply.status(200).send(response);
    } catch (error) {
      ExceptionHandler.handleAndReply(error, reply);
    }
  }

  public async addDocumentToZaak(
    request: FastifyRequest<{
      Params: ZaakParam;
      Body: Record<string, unknown>;
    }>,
    reply: FastifyReply,
  ) {
    const zaakIdentificatie = request.params.zaakIdentificatie;
    try {
      const userInfo = this.zaakService.resolveUserInfo(request.headers["authorization"]);
      const correlationId = request.headers["x-correlation-id"] as string | undefined;
      const data = await this.zaakService.addDocumentToZaak(zaakIdentificatie, userInfo, correlationId, request.body);
      reply.status(200).send(data);
    } catch (error) {
      ExceptionHandler.handleAndReply(error, reply);
    }
  }
}
