/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { ZaakNotFound } from "../exception/ZaakNotFound";
import { ZaakNummerNotValid } from "../exception/ZaakNummerNotValid";
import { type HttpService } from "./HttpService";
import { type GeneratedType } from "../../generated/generated-types";

export class ZaakService {
  constructor(private readonly httpService: HttpService) {}

  public async getZaak(zaakIdentificatie: string) {
    if (!this.checkzaakIdentificatie(zaakIdentificatie)) {
      throw new ZaakNummerNotValid();
    }
    const response = await this.fetchZaak(zaakIdentificatie);

    const zaken = await this.httpService.GET<
      GeneratedType<"PaginatedZaakList">
    >("/zaken/api/v1/zaken", { identificatie: zaakIdentificatie });

    const zaak = zaken.results.at(0);

    if (!zaak) {
      throw new ZaakNotFound(zaakIdentificatie);
    }

    const zaaktype = await this.httpService.GET<GeneratedType<"ZaakType">>(
      zaak.zaaktype,
    );

    const zaakinformatieobjecten = await Promise.all(
      zaaktype.informatieobjecttypen.map((url) =>
        this.httpService.GET<{ omschrijving: string }>(url),
      ),
    );

    return {
      ...zaak,
      zaakinformatieobjecten,
      zaaktype,
    };
  }

  public async addDocumentToZaak(zaakIdentificatie: string): Promise<void> {
    console.log("adding document to zaak", zaakIdentificatie);
  }

  private checkzaakIdentificatie(zaakIdentificatie: string): boolean {
    return zaakIdentificatie !== null && zaakIdentificatie.startsWith("ZAAK-");
  }
}
