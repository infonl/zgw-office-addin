/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { TaskpaneService } from "../service/taskpane.service";

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    document.getElementById("sideload-msg").style.display = "none";
    document.getElementById("app-body").style.display = "flex";

    // Fix: Assign a function reference
    document.getElementById("upload").onclick = () => {
      const zaakNummer = (document.getElementById("case-number") as HTMLInputElement).value;
      run(zaakNummer);
    };
  }
});


export async function run(zaakNummer: string) {
  return Word.run(async (context) => {
    if (!zaakNummer) {
        // If a case number is not provided, show an error message.
        console.warn("No case number provided.");
        return
    }

    await context.sync();
    const taskService = new TaskpaneService();
    const zaken = await taskService.getZaken(zaakNummer);
    console.log("Zaken:", zaken);
  });
}
