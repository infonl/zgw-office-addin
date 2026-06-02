/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import type { TokenInfo } from "../dto/TokenInfo";
import { ZaakNotFound } from "../exception/ZaakNotFound";
import { FileNotSupported } from "../exception/FileNotSupported";
import { type HttpService } from "./HttpService";
import { LoggerService } from "./LoggerService";
import { type DrcType } from "../../../generated/drc-generated-types";
import { type ZrcType } from "../../../generated/zrc-generated-types";
import { randomUUID } from "node:crypto";

export class ZaakService {
  constructor(private readonly httpService: HttpService) {}

  public async getZaak(zaakIdentificatie: string, tokenInfo: TokenInfo, correlationId?: string) {
    const nlxRecordId = correlationId ?? tokenInfo.uti ?? randomUUID();
    const headers = {
      "X-NLX-Logrecord-ID": nlxRecordId,
      "X-Audit-Toelichting": "Zoek een zaak vanuit ZGW Office Add-in",
    };
    LoggerService.log(
      `[${nlxRecordId}] user '${tokenInfo.preferredUsername}' requests zaak ${zaakIdentificatie}`,
    );

    const zaak = await this.getZaakFromOpenZaak(zaakIdentificatie, tokenInfo, headers);

    const zaaktype = await this.httpService.GET<ZrcType<"ZaakType">>(
      zaak.zaaktype,
      tokenInfo,
      undefined,
      headers,
    );

    const status = zaak.status
      ? await this.httpService.GET<ZrcType<"Status">>(zaak.status, tokenInfo, undefined, headers)
      : ({ statustoelichting: "-" } satisfies Partial<ZrcType<"Status">>);

    const zaakinformatieobjecten = await Promise.all(
      zaaktype.informatieobjecttypen.map((url: string) =>
        this.httpService
          .GET<{
            omschrijving: string;
            vertrouwelijkheidaanduiding: string;
          }>(url, tokenInfo, undefined, headers)
          .then((result) => ({ ...result, url })),
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
    tokenInfo: TokenInfo,
    correlationId?: string,
    body: Record<string, unknown> = {},
  ) {
    const nlxRecordId = correlationId ?? tokenInfo.uti ?? randomUUID();
    const headers = {
      "X-NLX-Logrecord-ID": nlxRecordId,
      "X-Audit-Toelichting": "Document toevoegen vanuit ZGW Office Add-in",
    };
    LoggerService.log(
      `[${nlxRecordId}] user '${tokenInfo.preferredUsername}' add document '${String(body.titel)}' to zaak ${zaakIdentificatie}`,
    );

    const zaak = await this.getZaakFromOpenZaak(zaakIdentificatie, tokenInfo, headers);

    LoggerService.debug("creating document", zaakIdentificatie);
    const informatieobject = await this.httpService.POST<DrcType<"EnkelvoudigInformatieObject">>(
      "/documenten/api/v1/enkelvoudiginformatieobjecten",
      JSON.stringify({
        ...body,
        bronorganisatie: zaak.bronorganisatie,
        formaat: this.getFileFormat(String(body.titel)),
        taal: "dut",
        bestandsnaam: body.titel,
        creatiedatum: new Date(String(body.creatiedatum)).toISOString().split("T")[0],
      }),
      tokenInfo,
      headers,
    );

    LoggerService.debug(`adding gebruiksrechten to document ${informatieobject.url}`);
    await this.createGebruiksrechten(
      informatieobject.url,
      new Date(String(body.creatiedatum)),
      tokenInfo,
      headers,
    );

    LoggerService.debug(`adding document to zaak ${zaak.url}`, informatieobject);
    await this.httpService.POST(
      "/zaken/api/v1/zaakinformatieobjecten",
      JSON.stringify({
        informatieobject: informatieobject.url,
        zaak: zaak.url,
      }),
      tokenInfo,
      headers,
    );

    return informatieobject;
  }

  private getFileFormat(file: string) {
    const extension = file.split(".").slice(-1)[0];

    switch (extension) {
      case "doc":
      case "docx":
        return "application/msword";
      case "xls":
        return "application/vnd.ms-excel";
      case "xlsx":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "eml":
        return "message/rfc822";
      case "pdf":
        return "application/pdf";
      case "txt":
        return "text/plain";
      case "png":
        return "image/png";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      default:
        throw new FileNotSupported(file);
    }
  }

  private async getZaakFromOpenZaak(
    zaakIdentificatie: string,
    tokenInfo: TokenInfo,
    headers: HeadersInit,
  ) {
    const zaken = await this.httpService.GET<ZrcType<"PaginatedZaakList">>(
      "/zaken/api/v1/zaken",
      tokenInfo,
      {
        identificatie: zaakIdentificatie,
      },
      headers,
    );

    const zaak = zaken.results.slice(0, 1)[0];

    if (!zaak) {
      throw new ZaakNotFound(zaakIdentificatie);
    }

    return zaak;
  }

  private async createGebruiksrechten(
    url: string,
    startdatum: Date,
    userInfo: TokenInfo,
    headers: HeadersInit,
  ) {
    await this.httpService.POST(
      "/documenten/api/v1/gebruiksrechten",
      JSON.stringify({
        informatieobject: url,
        startdatum,
        omschrijvingVoorwaarden: "geen",
      }),
      userInfo,
      headers,
    );
  }
}
