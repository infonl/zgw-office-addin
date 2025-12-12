/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

const host = Office.context.host;

export async function insertText(text: string) {
  try {
    if (host === Office.HostType.Word) {
      await Word.run(async (context) => {
        let body = context.document.body;
        body.insertParagraph(text, Word.InsertLocation.end);
        await context.sync();
      });
    } else if (host === Office.HostType.Excel) {
      await Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const range = sheet.getRange("A1");
        range.values = [[text]];
        await context.sync();
      });
    }
  } catch (error) {
    console.error("Error: " + error);
  }
  console.log(text);
}
