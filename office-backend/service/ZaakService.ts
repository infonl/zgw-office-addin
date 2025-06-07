/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { ZaakNotFound } from "../exception/ZaakNotFound";
import { ZaakNummerNotValid } from "../exception/ZaakNummerNotValid";
import { type HttpService } from "./HttpService";
import { LoggerService } from "./LoggerService";
import { type GeneratedType } from "../../generated/generated-types";

export class ZaakService {
  constructor(private readonly httpService: HttpService) {}

  public async getZaak(zaakIdentificatie: string) {
    if (!this.checkzaakIdentificatie(zaakIdentificatie)) {
      throw new ZaakNummerNotValid();
    }

    const zaak = await this.getZaakFromOpenZaak(zaakIdentificatie);

    const zaaktype = await this.httpService.GET<GeneratedType<"ZaakType">>(
      zaak.zaaktype,
    );

    const statustypen = await Promise.all(
      zaaktype.statustypen.map((url) =>
        this.httpService.GET<{ omschrijving: string }>(url),
      ),
    );

    const zaakinformatieobjecten = await Promise.all(
      zaaktype.informatieobjecttypen.map((url) =>
        this.httpService.GET<{ omschrijving: string }>(url),
      ),
    );

    return {
      ...zaak,
      zaakinformatieobjecten,
      zaaktype: {
        ...zaaktype,
        statustypen,
      },
    };
  }

  public async addDocumentToZaak(
    zaakIdentificatie: string,
    body: Record<string, unknown> = {},
  ) {
    const zaak = await this.getZaakFromOpenZaak(zaakIdentificatie);

    LoggerService.debug("adding document to zaak", zaakIdentificatie);
    return await this.httpService.POST<GeneratedType<"ZaakInformatieObject">>(
      "/documenten/api/v1/enkelvoudiginformatieobjecten",
      JSON.stringify({
        bronorganisatie: zaak.bronorganisatie,
        creatiedatum: new Date().toISOString().split("T").at(0),
        formaat: "application/msword",
        titel: "Document toegevoegd via Office Add-in",
        auteur: "pietje puk",
        taal: "dut",
        inhoud: "",
        informatieobjecttype:
          "http://localhost:8020/catalogi/api/v1/informatieobjecttypen/efc332f2-be3b-4bad-9e3c-49a6219c92ad",
        ...body,
      }),
    );
  }

  private checkzaakIdentificatie(zaakIdentificatie: string): boolean {
    return zaakIdentificatie !== null && zaakIdentificatie.startsWith("ZAAK-");
  }

  private async getZaakFromOpenZaak(zaakIdentificatie: string) {
    const zaken = await this.httpService.GET<
      GeneratedType<"PaginatedZaakList">
    >("/zaken/api/v1/zaken", { identificatie: zaakIdentificatie });

    const zaak = zaken.results.at(0);

    if (!zaak) {
      throw new ZaakNotFound(zaakIdentificatie);
    }

    return zaak;
  }
}
