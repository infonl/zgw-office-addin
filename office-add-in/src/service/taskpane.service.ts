/*  
 * SPDX-FileCopyrightText: 2025 INFO.nl  
 * SPDX-License-Identifier: EUPL-1.2+  
 */ 

export class TaskpaneService {
  constructor() {}

  public async getZaken(zaakNummer: string): Promise<any> {
    console.log("Button clicked! Case Number:", zaakNummer);

    const backendUrl = "https://localhost:3003";

    fetch(`${backendUrl}/zaken/${zaakNummer}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Data:", data);
        return data;
      })
      .catch((error) => {
        console.error("Error:", error);
        return [];
      });
  }
}
