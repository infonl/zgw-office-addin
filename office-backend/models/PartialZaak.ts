/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

export interface PartialZaak {
  count: number;
  results: Array<{
    identificatie: string;
    zaaktype: string;
    status: string;
    omschrijving: string;
    zaakinformatieobjecten: Array<Record<string, unknown>>;
  }>;
}
