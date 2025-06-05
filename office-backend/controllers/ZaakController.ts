/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { FastifyReply, FastifyRequest } from 'fastify';
import { ZaakService} from '../service/ZaakService';
import type { ZaakDto } from '../dto/ZaakParam'

/**
 * ZaakController handles requests related to 'zaken' (cases).
 * It interacts with the ZaakService to fetch zaak data.
 */
export class ZaakController {
    zaakService: ZaakService;

    constructor() {
        this.zaakService = new ZaakService();
    }

    /**
     * Handles the request to get a zaak by its number.
     * Sends the zaak data as a response or an error if not found.
     * @param request The Fastify request object containing the zaak number in the parameters.
     * @param reply The Fastify reply object used to send the response.
     */
    public async getZaak(request: FastifyRequest<{ Params: ZaakDto }>, reply: FastifyReply) {
        const { zaakNummer } = request.params;
        try {
            const response = await this.zaakService.getZaak(zaakNummer);
            reply.status(200).send(response);
        } catch (error: any) {
            const status = error.statusCode || 500;
            reply.status(status).send({ error: error.message });
        }
    }
}