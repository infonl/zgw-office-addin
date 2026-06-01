/*
 * SPDX-FileCopyrightText: 2026 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import * as fs from "fs";
import * as path from "path";

/**
 * Returns a JS string injected via page.addInitScript() before the page loads.
 * Playwright runs addInitScript in every frame including iframes, so the mock
 * is in place in the taskpane iframe before its scripts execute.
 *
 * Simulates a Word host. The PDF fixture is embedded as a Uint8Array so that
 * Office.context.document.getFileAsync returns real PDF bytes — matching what
 * the Word path in useAddDocumentToZaak sends to the backend.
 */
export interface OfficeMockOptions {
  /** Override the filename returned by getFilePropertiesAsync. Defaults to "test-document.pdf". */
  fileName?: string;
}

export function officeMockScript(
  jwt: string,
  options: OfficeMockOptions = {},
): string {
  const pdfPath = path.join(__dirname, "test-document.pdf");
  const pdfBytes = Array.from(fs.readFileSync(pdfPath));
  const fileName = options.fileName ?? "test-document.pdf";

  return `
    (function () {
      const pdfBytes = new Uint8Array(${JSON.stringify(pdfBytes)});

      window.Office = {
        onReady: function (cb) {
          if (typeof cb === "function") cb({ host: "Word", platform: null });
          return Promise.resolve();
        },

        auth: {
          getAccessToken: function () {
            return Promise.resolve(${JSON.stringify(jwt)});
          },
        },

        context: {
          host: "Word",
          platform: null,
          diagnostics: { correlationId: "e2e-correlation-id" },
          document: {
            getFileAsync: function (_fileType, cb) {
              cb({
                status: "succeeded",
                value: {
                  sliceCount: 1,
                  getSliceAsync: function (index, sliceCb) {
                    sliceCb({
                      status: "succeeded",
                      value: { data: pdfBytes, index: index },
                    });
                  },
                  closeAsync: function (closeCb) {
                    if (closeCb) closeCb({ status: "succeeded" });
                  },
                },
              });
            },
            getFilePropertiesAsync: function (cb) {
              cb({
                status: "succeeded",
                value: { url: "https://localhost/" + ${JSON.stringify(fileName)} },
              });
            },
          },
        },

        HostType: { Word: "Word", Excel: "Excel", Outlook: "Outlook" },
        PlatformType: { OfficeOnline: "OfficeOnline" },
        FileType: { Compressed: "compressed" },
        AsyncResultStatus: { Succeeded: "succeeded", Failed: "failed" },
      };
    })();
  `;
}
