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
    console.log("AUTHOR:", request.headers["authorization"]);

    const jwt = request.headers["authorization"];
    const zaakIdentificatie = request.params.zaakIdentificatie;
    try {
      this.zaakService.setUserInfo(jwt);
      const response = await this.zaakService.getZaak(zaakIdentificatie);
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
      const jwt = request.headers["authorization"];

      this.zaakService.setUserInfo(jwt);
      const data = await this.zaakService.addDocumentToZaak(
        zaakIdentificatie,
        request.body,
      );
      reply.status(200).send(data);
    } catch (error) {
      ExceptionHandler.handleAndReply(error, reply);
    }
  }
}
