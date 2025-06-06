/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { HttpService } from "../service/http.service";
import { OfficeService } from "../service/office.service";
import { TaskpaneService } from "../service/taskpane.service";

const httpService = new HttpService();
const officeService = new OfficeService(httpService);
const taskService = new TaskpaneService(httpService);

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    document.getElementById("sideload-msg").style.display = "none";
    document.getElementById("app-body").style.display = "flex";
    document.getElementById("upload").onclick = () => {
      const zaakIdentificatie = (document.getElementById("case-number") as HTMLInputElement).value;
      fetchZaak(zaakIdentificatie);
    };
    document.getElementById("upload-button").onclick = () => {
      const zaakIdentificatie = (document.getElementById("case-number") as HTMLInputElement).value;
      officeService.addDocumentToZaak(zaakIdentificatie);
    };
  }
});

function fetchZaak(zaakIdentificatie: string) {
  return Word.run(async (context) => {
    if (!zaakIdentificatie) {
      console.warn("No case number provided.");
      return;
    }

    await context.sync();
    const zaken = await taskService.getZaken(zaakIdentificatie);
  });
}
