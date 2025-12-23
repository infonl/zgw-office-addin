/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { ZaakNotFound } from "../exception/ZaakNotFound";
import { FileNotSupported } from "../exception/FileNotSupported";
import { type HttpService } from "./HttpService";
import { LoggerService } from "./LoggerService";
import { type DrcType } from "../../generated/drc-generated-types";
import { type ZrcType } from "../../generated/zrc-generated-types";
import { TokenService } from "./TokenService";
export class ZaakService {
  private userInfo: { preferedUsername: string; name: string } | null = null;
  constructor(private readonly httpService: HttpService, private readonly tokenService: TokenService) {}

  public async getZaak(zaakIdentificatie: string) {

    const userInfo = this.userInfo!;
    
    const zaak = await this.getZaakFromOpenZaak(zaakIdentificatie, userInfo);

    const zaaktype = await this.httpService.GET<ZrcType<"ZaakType">>(zaak.zaaktype, userInfo);

    const status = zaak.status
      ? await this.httpService.GET<ZrcType<"Status">>(zaak.status, userInfo)
      : ({ statustoelichting: "-" } satisfies Partial<ZrcType<"Status">>);

    const zaakinformatieobjecten = await Promise.all(
      zaaktype.informatieobjecttypen.map((url: string) =>
        this.httpService
          .GET<{ omschrijving: string; vertrouwelijkheidaanduiding: string }>(url, userInfo)
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

  public async addDocumentToZaak(zaakIdentificatie: string, body: Record<string, unknown> = {}) {
    const userInfo = this.userInfo!;
    
    const zaak = await this.getZaakFromOpenZaak(zaakIdentificatie, userInfo);

    LoggerService.debug("creating document", zaakIdentificatie);
    const informatieobject = await this.httpService.POST<DrcType<"EnkelvoudigInformatieObject">>(
      "/documenten/api/v1/enkelvoudiginformatieobjecten",
      JSON.stringify({
        ...body,
        bronorganisatie: zaak.bronorganisatie,
        formaat: this.getFileFormat(String(body.titel)),
        taal: "dut",
        bestandsnaam: body.titel,
        creatiedatum: new Date(String(body.creatiedatum)).toISOString().split("T").at(0),
      }),
      userInfo as { preferedUsername: string; name: string },
    );
    LoggerService.debug(`adding gebruiksrechten to document ${informatieobject.url}`);

    this.createGebruiksrechten(
      informatieobject.url!,
      new Date(String(body.creatiedatum)),
      userInfo as { preferedUsername: string; name: string },
    );

    LoggerService.debug(`adding document to zaak ${zaak.url}`, informatieobject);
    await this.httpService.POST(
      "/zaken/api/v1/zaakinformatieobjecten",
      JSON.stringify({
        informatieobject: informatieobject.url,
        zaak: zaak.url,
      }),
      userInfo as { preferedUsername: string; name: string },
    );

    return informatieobject;
  }

  private getFileFormat(file: string) {
    const extention = file.split(".").at(-1)!;

    switch (extention) {
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

  private async getZaakFromOpenZaak(zaakIdentificatie: string, userInfo: { preferedUsername: string; name: string }) {
    const zaken = await this.httpService.GET<ZrcType<"PaginatedZaakList">>("/zaken/api/v1/zaken", userInfo,{
      identificatie: zaakIdentificatie,
    },);

    const zaak = zaken.results.at(0);

    if (!zaak) {
      throw new ZaakNotFound(zaakIdentificatie);
    }

    return zaak;
  }

  private async createGebruiksrechten(
    url: string,
    startdatum: Date,
    userInfo: { preferedUsername: string; name: string },
  ) {
    await this.httpService.POST(
      "/documenten/api/v1/gebruiksrechten",
      JSON.stringify({
        informatieobject: url,
        startdatum,
        omschrijvingVoorwaarden: "geen",
      }),
      userInfo,
    );
  }

  public setUserInfo(jwt: string | undefined) {
    this.userInfo = this.tokenService.getUserInfo(jwt);
  }
}
