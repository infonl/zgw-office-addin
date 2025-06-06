/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */
import { HttpService } from "./http.service";

export class TaskpaneService {
  constructor(private readonly httpService: HttpService) {}

  public async getZaken(zaakIdentificatie: string) {
    console.log("Button clicked! Case Number:", zaakIdentificatie);

    return this.httpService.GET(`/zaken/${zaakIdentificatie}`);
  }
}
