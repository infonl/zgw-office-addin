/*
 * SPDX-FileCopyrightText: 2025 INFO.nl  
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { TaskpaneService } from "../service/taskpane.service";

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    document.getElementById("sideload-msg").style.display = "none";
    document.getElementById("app-body").style.display = "flex";
    document.getElementById("upload").onclick = () => {
      const zaakNummer = (document.getElementById("case-number") as HTMLInputElement).value;
      run(zaakNummer);
    };
  }
});


export async function run(zaakNummer: string) {
  return Word.run(async (context) => {
    if (!zaakNummer) {
        console.warn("No case number provided.");
        return
    }

    await context.sync();
    const taskService = new TaskpaneService();
    const zaken = await taskService.getZaken(zaakNummer);
  });
}
