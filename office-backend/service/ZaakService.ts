/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { ZaakNotFound } from "../exception/ZaakNotFound";
import { ZaakNummerNotValid } from "../exception/ZaakNummerNotValid";
import { PartialZaak } from "../models/PartialZaak";
import { type HttpService } from "./HttpService";

export class ZaakService {
  constructor(private readonly httpService: HttpService) {}

  public async getZaak(zaakIdentificatie: string) {
    if (!this.checkzaakIdentificatie(zaakIdentificatie)) {
      throw new ZaakNummerNotValid();
    }

    const response = await this.httpService.GET<PartialZaak>(
      "/zaken/api/v1/zaken",
      { identificatie: zaakIdentificatie },
    );

    if (response.count === 0) {
      throw new ZaakNotFound(zaakIdentificatie);
    }

    return response;
  }

  public async addDocumentToZaak(zaakIdentificatie: string): Promise<void> {
    console.log("adding document to zaak", zaakIdentificatie);
  }

  private checkzaakIdentificatie(zaakIdentificatie: string): boolean {
    return zaakIdentificatie !== null && zaakIdentificatie.startsWith("ZAAK-");
  }
}
