/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { ZaakNotFound } from "../exception/ZaakNotFound";
import { FileNotSupported } from "../exception/FileNotSupported";
import { type HttpService } from "./HttpService";
import { LoggerService } from "./LoggerService";
import { type GeneratedType } from "../../generated/generated-types";

export class ZaakService {
  constructor(private readonly httpService: HttpService) {}

  public async getZaak(zaakIdentificatie: string) {
    const zaak = await this.getZaakFromOpenZaak(zaakIdentificatie);

    const zaaktype = await this.httpService.GET<GeneratedType<"ZaakType">>(
      zaak.zaaktype,
    );

    const status = zaak.status
      ? await this.httpService.GET<GeneratedType<"Status">>(zaak.status)
      : ({ statustoelichting: "-" } satisfies Partial<GeneratedType<"Status">>);

    const zaakinformatieobjecten = await Promise.all(
      zaaktype.informatieobjecttypen.map((url) =>
        this.httpService.GET<{ omschrijving: string }>(url),
      ),
    );

    return {
      ...zaak,
      status,
      zaakinformatieobjecten,
      zaaktype,
    };
  }

  public async addDocumentToZaak(
    zaakIdentificatie: string,
    body: Record<string, unknown> = {},
  ) {
    const zaak = await this.getZaakFromOpenZaak(zaakIdentificatie);
    
    LoggerService.debug("creating document", zaakIdentificatie);
    const informatieobject = await this.httpService.POST<
      GeneratedType<"ZaakInformatieObject">
    >(
      "/documenten/api/v1/enkelvoudiginformatieobjecten",
      JSON.stringify({
        ...body,
        bronorganisatie: zaak.bronorganisatie,
        formaat: this.getFileFormat(String(body.titel)),
        taal: "dut",
        bestandsnaam: body.titel,
        creatiedatum: new Date(String(body.creatiedatum))
          .toISOString()
          .split("T")
          .at(0),
      }),
    );
    LoggerService.debug(
      `adding gebruiksrechten to document ${informatieobject.url}`
    );

    this.createGebruiksrechten(informatieobject.url!, new Date(String(body.creatiedatum)));

    LoggerService.debug(
      `adding document to zaak ${zaak.url}`,
      informatieobject,
    );
    await this.httpService.POST(
      "/zaken/api/v1/zaakinformatieobjecten",
      JSON.stringify({
        informatieobject: informatieobject.url,
        zaak: zaak.url,
      }),
    );

    return informatieobject;
  }

  private getFileFormat(file: string) {
    const extention = file.split(".").at(-1)!;

    switch (extention) {
      case "doc":
      case "docx":
        return "application/msword";
      default:
        throw new FileNotSupported(file);
    }
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

  private async createGebruiksrechten(url: string, startdatum: Date) {
    await this.httpService.POST(
      "documenten/api/v1/gebruiksrechten",
      JSON.stringify({
        informatieobject: url,
        startdatum: startdatum,
        omschrijvingVoorwaarden: "geen"
      })
    );
  }
}
