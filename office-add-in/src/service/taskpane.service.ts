/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */
import { HttpService } from "./http.service";
import { LoggerService } from "./logger.service";

export class TaskpaneService {
  constructor(private readonly httpService: HttpService) {}

  public async getZaken(zaakIdentificatie: string) {
    LoggerService.debug("Button clicked! Case Number:", zaakIdentificatie);

    return this.httpService.GET(`/zaken/${zaakIdentificatie}`).catch(LoggerService.warn);
  }
}
