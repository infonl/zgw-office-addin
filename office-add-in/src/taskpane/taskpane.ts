/*
 * SPDX-FileCopyrightText: 2021 - 2022 Atos, 2024-2025 Lifely
 * SPDX-License-Identifier: EUPL-1.2+
 */

/* global document, Office, Word */
Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    document.getElementById("sideload-msg").style.display = "none";
    document.getElementById("app-body").style.display = "flex";
    document.getElementById("upload").onclick = run(document.getElementById("case-number").innerText);
  }
});

export async function run(caseNumber: string) {
  return Word.run(async (context) => {
    /**
     * Insert your Word code here
     */
    if (!caseNumber) {
        // If a case number is not provided, show an error message.
        console.warn("No case number provided.");
        return
    }
    if (!context.document.saved) {
        // If the document is unsaved, show a warning message.
        console.warn("Please save the document first.");
        return
    }

    await context.sync();
  });
}
