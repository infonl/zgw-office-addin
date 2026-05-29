/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { ZaakNotFound } from "../exception/ZaakNotFound";
import { FileNotSupported } from "../exception/FileNotSupported";
import { type HttpService } from "./HttpService";
import { LoggerService } from "./LoggerService";
import { type DrcType } from "../../../generated/drc-generated-types";
import { type ZrcType } from "../../../generated/zrc-generated-types";
import { TokenService } from "./TokenService";
import {randomUUID} from "node:crypto";

export class ZaakService {
  constructor(
    private readonly httpService: HttpService,
    private readonly tokenService: TokenService,
  ) {}

  public resolveUserInfo(jwt: string | undefined) {
    return this.tokenService.getUserInfo(jwt);
  }

  public async getZaak(zaakIdentificatie: string, userInfo: { preferredUsername: string; name: string; uti?: string }, correlationId?: string) {
    const nlxRecordId = correlationId ?? userInfo.uti ?? randomUUID();
    const headers = {
      "X-NLX-Logrecord-ID": nlxRecordId,
      "X-Audit-Toelichting": "Zoek een zaak vanuit ZGW Office Add-in"
    }
    LoggerService.log(`[${nlxRecordId}] user '${userInfo.preferredUsername}' requests zaak ${zaakIdentificatie}`)

    const zaak = await this.getZaakFromOpenZaak(zaakIdentificatie, userInfo, headers);

    const zaaktype = await this.httpService.GET<ZrcType<"ZaakType">>(zaak.zaaktype, userInfo, undefined, headers);

    const status = zaak.status
      ? await this.httpService.GET<ZrcType<"Status">>(zaak.status, userInfo, undefined, headers)
      : ({ statustoelichting: "-" } satisfies Partial<ZrcType<"Status">>);

    const zaakinformatieobjecten = await Promise.all(
      zaaktype.informatieobjecttypen.map((url: string) =>
        this.httpService
          .GET<{ omschrijving: string; vertrouwelijkheidaanduiding: string }>(url, userInfo, undefined, headers)
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

  public async addDocumentToZaak(zaakIdentificatie: string, userInfo: { preferredUsername: string; name: string; uti?: string }, correlationId?: string, body: Record<string, unknown> = {}) {
    const nlxRecordId = correlationId ?? userInfo.uti ?? randomUUID();
    const headers: HeadersInit = [
      ["X-NLX-Logrecord-ID", nlxRecordId],
      ["X-Audit-Toelichting", "Document toevoegen vanuit ZGW Office Add-in"]
    ]
    LoggerService.log(`[${nlxRecordId}] user '${userInfo.preferredUsername}' add document '${body.titel}' to zaak ${zaakIdentificatie}`)

    const zaak = await this.getZaakFromOpenZaak(zaakIdentificatie, userInfo, headers);

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
      userInfo,
      headers
    );

    LoggerService.debug(`adding gebruiksrechten to document ${informatieobject.url}`);
    await this.createGebruiksrechten(
      informatieobject.url,
      new Date(String(body.creatiedatum)),
      userInfo,
      headers
    );

    LoggerService.debug(`adding document to zaak ${zaak.url}`, informatieobject);
    await this.httpService.POST(
      "/zaken/api/v1/zaakinformatieobjecten",
      JSON.stringify({
        informatieobject: informatieobject.url,
        zaak: zaak.url,
      }),
      userInfo,
      headers
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
    userInfo: { preferredUsername: string; name: string },
    headers: HeadersInit,
  ) {
    const zaken = await this.httpService.GET<ZrcType<"PaginatedZaakList">>(
      "/zaken/api/v1/zaken",
      userInfo,
      {
        identificatie: zaakIdentificatie,
      },
      headers
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
    userInfo: { preferredUsername: string; name: string },
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
      headers
    );
  }

}
