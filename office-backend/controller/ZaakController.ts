/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { FastifyReply, FastifyRequest } from 'fastify';
import { ZaakService} from '../service/ZaakService';
import type { ZaakParam } from '../dto/ZaakParam'
import { ExceptionHandler } from '../exception/ExceptionHandler';

export class ZaakController {
    zaakService: ZaakService;

    constructor() {
        this.zaakService = new ZaakService();
    }

    public async getZaak(request: FastifyRequest<{ Params: ZaakParam }>, reply: FastifyReply) {
        const zaakIdentificatie = request.params.zaakIdentificatie;        
        try {
            const response = await this.zaakService.getZaak(zaakIdentificatie);
            reply.status(200).send(response);
        } catch (error: unknown) {
            ExceptionHandler.handleAndReply(error, reply);
        }
    }
}