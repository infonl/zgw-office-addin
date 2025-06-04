/*
 * SPDX-FileCopyrightText: 2025 INFO.nl  
 * SPDX-License-Identifier: EUPL-1.2+
 */

export class ZaakService {
    constructor() {}

    public async getZaken(zaakNummer: string): Promise<Response | string> {
        if (!this.checkzaakNummer(zaakNummer)) {
            return "Geen valide zaaknummer opgegeven";
        }
        const res = fetch(`http://localhost:8001/zaken/api/v1/zaken/${zaakNummer}`, {
            method: "GET",
            headers: {
            "Content-Type": "application/json",
            "Accept-Crs": "EPSG:4326",
            "Content-Crs": "EPSG:4326",
            Authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJvZmZpY2UtYWRkLWluIiwiaWF0IjoxNzQ4ODc2NjM1LCJjbGllbnRfaWQiOiJvZmZpY2UtYWRkLWluIiwidXNlcl9pZCI6Im9mZmljZS1hZGQtaW4iLCJ1c2VyX3JlcHJlc2VudGF0aW9uIjoib2ZmaWNlLWFkZC1pbiJ9.MsHB2TwI_OG4CFYe1p3hRtpEZFFoVYdrgGmxGZu0Y-0`,
        },
      })
      return res;
    }

    private checkzaakNummer(zaakNummer: string): boolean {
        return zaakNummer == "0" || zaakNummer == null ? false : true;
    }

}