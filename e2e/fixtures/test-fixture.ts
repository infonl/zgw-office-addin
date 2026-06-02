/*
 * SPDX-FileCopyrightText: 2026 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { test as base, FrameLocator, Page } from "@playwright/test";
import { makeTestJwt } from "./auth";
import { officeMockScript, OfficeMockOptions, outlookMockScript, OutlookMockOptions } from "./office-mock";

export type TaskpaneFixture = {
  /** FrameLocator scoped to the Word add-in taskpane iframe, ready for interaction. */
  taskpane: FrameLocator;
  /**
   * Re-opens the Word wrapper page with a custom Office mock.
   * Use this when a test needs different mock options (e.g. unsupported filename).
   */
  openWithMock: (options: OfficeMockOptions) => Promise<FrameLocator>;
  /** FrameLocator scoped to the Outlook add-in taskpane iframe, ready for interaction. */
  outlookTaskpane: FrameLocator;
  /**
   * Re-opens the Outlook wrapper page with a custom Office mock.
   * Use this when a test needs different mock options (e.g. different attachments).
   */
  openOutlookWithMock: (options: OutlookMockOptions) => Promise<FrameLocator>;
};

export const test = base.extend<TaskpaneFixture>({
  taskpane: async ({ page }, use) => {
    const taskpane = await loadTaskpane(page);
    await use(taskpane);
  },

  openWithMock: async ({ page }, use) => {
    await use(async (options: OfficeMockOptions) => {
      await page.unrouteAll();
      return loadTaskpane(page, options);
    });
  },

  outlookTaskpane: async ({ page }, use) => {
    const taskpane = await loadOutlookTaskpane(page);
    await use(taskpane);
  },

  openOutlookWithMock: async ({ page }, use) => {
    await use(async (options: OutlookMockOptions) => {
      await page.unrouteAll();
      return loadOutlookTaskpane(page, options);
    });
  },
});

async function loadTaskpane(
  page: Page,
  options: OfficeMockOptions = {},
): Promise<FrameLocator> {
  const jwt = makeTestJwt();

  // taskpane.html loads Office.js from the CDN via a synchronous <script> tag.
  // The real SDK overwrites window.Office and never calls onReady() outside an
  // Office host. Intercept the CDN request and return a no-op stub so our
  // addInitScript mock (set below) survives intact.
  await page.route("https://appsforoffice.microsoft.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "// Office.js CDN stub — window.Office provided by addInitScript",
    }),
  );

  await page.addInitScript(officeMockScript(jwt, options));
  await page.goto("/wrapper/index.html");
  const taskpane = page.frameLocator("#taskpane");
  // Wait for the search input to confirm the taskpane has initialised
  await taskpane.getByLabel("Zaaknummer").waitFor({ timeout: 30_000 });
  return taskpane;
}

async function loadOutlookTaskpane(
  page: Page,
  options: OutlookMockOptions = {},
): Promise<FrameLocator> {
  const jwt = makeTestJwt();

  await page.route("https://appsforoffice.microsoft.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "// Office.js CDN stub — window.Office provided by addInitScript",
    }),
  );

  await page.addInitScript(outlookMockScript(jwt, options));
  await page.goto("/wrapper/outlook.html");
  const taskpane = page.frameLocator("#taskpane");
  await taskpane.getByLabel("Zaaknummer").waitFor({ timeout: 30_000 });
  return taskpane;
}

export { expect } from "@playwright/test";
