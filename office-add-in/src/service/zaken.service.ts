/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */
import { HttpService } from "./http.service";
import { LoggerService } from "./logger.service";
import { type GeneratedType } from "../../../generated/generated-types";

export class ZaakService {
  constructor(private readonly httpService: HttpService) {}

  public async getZaak(zaakIdentificatie: string) {
    LoggerService.debug("Button clicked! Case Number:", zaakIdentificatie);

    return this.httpService
      .GET<GeneratedType<"Zaak">>(`/zaken/${zaakIdentificatie}`)
      .catch(LoggerService.warn);
  }
}
