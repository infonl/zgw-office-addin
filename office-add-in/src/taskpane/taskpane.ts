/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

export async function insertText(text: string) {
  const host = Office.context.host;
  try {
    if (host === Office.HostType.Word) {
      await Word.run(async (context) => {
        let body = context.document.body;
        body.insertParagraph(text, Word.InsertLocation.end);
        await context.sync();
      });
    } else if (host === Office.HostType.Excel) {
      await Excel.run(async (context) => {
        const range = context.workbook.getSelectedRange();
        range.values = [[text]];
        await context.sync();
      });
    }
  } catch (error) {
    console.error("Error: " + error);
  }
}
