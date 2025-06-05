/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import jwt from "jsonwebtoken";
import { NoZaakFound } from "../exception/NoZaakFound";
import { NoValidZaakNummer } from "../exception/NoValidZaakNummer";
import { PartialZaak } from "../models/PartialZaak";


export class ZaakService {
  constructor() {}

  // Create a JWT token for authentication with the OpenZaak API.
  private readonly jwtToken = jwt.sign(
    {
      iss: "office-add-in",
      iat: Math.floor(Date.now() / 1000),
      client_id: "office-add-in",
      user_id: "office-add-in",
      user_representation: "office-add-in",
    },
    process.env.JWT_SECRET!,
    {
      algorithm: "HS256",
    }
  );

  private readonly zaakApiUrl = process.env.API_BASE_URL!;
  /**
   * Retrieves a zaak by its number.
   * @param zaakIdentificatie The unique identifier of the zaak.
   * @returns A promise that resolves to the zaak data or throws an error if not found.
   */
  public async getZaak(zaakIdentificatie: string): Promise<PartialZaak> {
    if (!this.checkzaakIdentificatie(zaakIdentificatie)) {
      throw new NoValidZaakNummer();
    }

    const response = await this.fetchZaak(zaakIdentificatie);

    // If the response count is 0, it means no zaak was found with the given zaakIdentificatie.
    if (response.count === 0) {
      throw new NoZaakFound(zaakIdentificatie);
    }

    return response;
  }

  /**
   * Makes a request to the OpenZaak API to fetch a zaak by its number.
   * @param zaakIdentificatie The unique identifier of the zaak to fetch.
   * @returns The Json object of one singular zaak object or an empty object if not found.
   */
  private async fetchZaak(zaakIdentificatie: string): Promise<PartialZaak> {
    const url = new URL(this.zaakApiUrl + "/zaken/api/v1/zaken");

    url.search = new URLSearchParams({
      identificatie: zaakIdentificatie,
    }).toString();

    const fetchZaak = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Crs": "EPSG:4326",
        "Content-Crs": "EPSG:4326",
        Authorization: `Bearer ${this.jwtToken}`,
      },
    });
    return fetchZaak.json();
  }

  /**
   * Checks if the provided zaak number is valid.
   * @param zaakIdentificatie The zaak number to validate.
   * @returns true if valid, false otherwise.
   */
  private checkzaakIdentificatie(zaakIdentificatie: string): boolean {
    return zaakIdentificatie !== null && zaakIdentificatie.startsWith("ZAAK-");
  }
}
