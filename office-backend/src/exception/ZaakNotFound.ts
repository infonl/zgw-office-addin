/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

export class ZaakNotFound extends Error {
  public readonly statusCode = 404;
  constructor(zaakIdentificatie: string) {
    super(`Geen zaak gevonden voor zaaknummer: ${zaakIdentificatie}`);
    this.name = ZaakNotFound.name;
  }
}
