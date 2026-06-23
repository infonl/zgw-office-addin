/*
 * SPDX-FileCopyrightText: 2026 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { defineConfig } from "@playwright/test";
import * as path from "path";

export default defineConfig({
  testDir: "./tests",

  use: {
    // Serves the wrapper page; tests navigate to /wrapper/index.html
    baseURL: "http://localhost:4000",
    // Frontend (https://localhost:3000) uses self-signed certificates in the local dev setup
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],

  // Serve the entire e2e/ directory so both /wrapper/index.html and
  // /fixtures/test-document.pdf are reachable from the browser
  webServer: {
    command: "npx serve . -l 4000 --no-clipboard",
    url: "http://localhost:4000",
    cwd: path.join(__dirname),
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },

  reporter: [["html", { open: "never" }]],
});
