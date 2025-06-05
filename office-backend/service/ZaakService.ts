/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import jwt from "jsonwebtoken";
import { ZaakNotFound } from "../exception/ZaakNotFound";
import { ZaakNummerNotValid } from "../exception/ZaakNummerNotValid";
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

  public async getZaak(zaakIdentificatie: string): Promise<PartialZaak> {
    if (!this.checkzaakIdentificatie(zaakIdentificatie)) {
      throw new ZaakNummerNotValid();
    }
    const response = await this.fetchZaak(zaakIdentificatie);

    if (response.count === 0) {
      throw new ZaakNotFound(zaakIdentificatie);
    }
    return response;
  }

  private async fetchZaak(zaakIdentificatie: string): Promise<PartialZaak> {
    const url = new URL(this.zaakApiUrl + "/zaken/api/v1/zaken");
    url.search = new URLSearchParams({
      identificatie: zaakIdentificatie,
    }).toString();

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Crs": "EPSG:4326",
        "Content-Crs": "EPSG:4326",
        Authorization: `Bearer ${this.jwtToken}`,
      },
    });

    if (!res.ok) {
      const errorBody = await res.json();
      throw new Error(
        `OpenZaak error: ${errorBody.status} ${errorBody.title} - ${errorBody.detail}`
      );
    }
    return res.json();
  }

  private checkzaakIdentificatie(zaakIdentificatie: string): boolean {
    return zaakIdentificatie !== null && zaakIdentificatie.startsWith("ZAAK-");
  }
}
