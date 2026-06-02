/*
 * SPDX-FileCopyrightText: 2026 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { FrameLocator } from "@playwright/test";
import { test, expect } from "../fixtures/test-fixture";

async function findZaak(taskpane: FrameLocator) {
  await taskpane.getByLabel("Zaaknummer").fill("ZAAK-2026-0000000001");
  await taskpane.getByRole("button", { name: "Zaak zoeken" }).click();
  await expect(taskpane.getByText("Gevonden zaak")).toBeVisible({
    timeout: 15_000,
  });
}

test.describe("outlook-upload", () => {
  test("shows email and attachment as selectable items", async ({
    outlookTaskpane,
  }) => {
    await findZaak(outlookTaskpane);

    await expect(
      outlookTaskpane.getByText("Bestanden selecteren", { exact: true }),
    ).toBeVisible();

    // Email itself appears as a selectable item
    await expect(
      outlookTaskpane.getByLabel("E-mail: Test e-mail onderwerp.eml"),
    ).toBeVisible();

    // File attachment appears as a selectable item
    await expect(outlookTaskpane.getByLabel("bijlage.pdf")).toBeVisible();
  });

  test("next-step button is disabled until a file is selected", async ({
    outlookTaskpane,
  }) => {
    await findZaak(outlookTaskpane);

    const nextButton = outlookTaskpane.getByRole("button", {
      name: "Volgende stap: bestandsgegevens",
    });

    await expect(nextButton).toBeVisible();
    await expect(nextButton).toBeDisabled();

    await outlookTaskpane.getByLabel("bijlage.pdf").check();

    await expect(nextButton).toBeEnabled();
  });

  test("navigates to metadata step after selecting a file and advancing", async ({
    outlookTaskpane,
  }) => {
    await findZaak(outlookTaskpane);

    await outlookTaskpane.getByLabel("bijlage.pdf").check();
    await outlookTaskpane
      .getByRole("button", { name: "Volgende stap: bestandsgegevens" })
      .click();

    await expect(
      outlookTaskpane.getByText("Bestandsgegevens", { exact: true }),
    ).toBeVisible();

    // Zaak number is shown in the metadata overview
    await expect(
      outlookTaskpane.getByText("ZAAK-2026-0000000001"),
    ).toBeVisible();

    // Selected file appears as an accordion item
    await expect(outlookTaskpane.getByText("bijlage.pdf")).toBeVisible();
  });

  test("back button returns to file selection", async ({ outlookTaskpane }) => {
    await findZaak(outlookTaskpane);

    await outlookTaskpane.getByLabel("bijlage.pdf").check();
    await outlookTaskpane
      .getByRole("button", { name: "Volgende stap: bestandsgegevens" })
      .click();

    await expect(
      outlookTaskpane.getByText("Bestandsgegevens", { exact: true }),
    ).toBeVisible();

    await outlookTaskpane
      .getByRole("button", { name: "Vorige stap" })
      .click();

    await expect(
      outlookTaskpane.getByText("Bestanden selecteren", { exact: true }),
    ).toBeVisible();
  });
});
