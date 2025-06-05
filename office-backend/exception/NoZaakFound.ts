/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

export class NoZaakFound extends Error {
    public statusCode = 404;
  constructor(zaakIdentificatie: string) {
    super(`Geen zaak gevonden voor zaaknummer: ${zaakIdentificatie}`);
    this.name = "NoZaakFound";
  }
}