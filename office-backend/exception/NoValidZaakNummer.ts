/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

export class NoValidZaakNummer extends Error {
  public statusCode = 400;
  constructor() {
    super(`Geen valide zaaknummer opgegeven`);
    this.name = "NoValidZaakNummer";
  }
}