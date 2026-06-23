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

test.describe("document-upload", () => {
  test("upload PDF to zaak shows success confirmation", async ({ taskpane }) => {
    await findZaak(taskpane);

    // The upload form should be visible after finding a zaak
    await expect(taskpane.getByText("Documentgegevens", { exact: true })).toBeVisible();
    // The document upload button will be disabled to start with
    await taskpane.getByRole("button", { name: "Document koppelen" }).isDisabled();

    // Fill mandatory fields. Auteur is auto-populated from the JWT name claim.
    await taskpane.getByLabel("Informatieobjecttype").selectOption({ index: 1 });
    await taskpane.getByLabel("Status").selectOption("definitief");

    // creatiedatum has a default (today) but set it explicitly for determinism
    const today = new Date().toISOString().split("T")[0];
    await taskpane.getByLabel("Creatiedatum").fill(today);

    await taskpane.getByRole("button", { name: "Document koppelen" }).click();

    await expect(taskpane.getByText("Document gekoppeld", { exact: true })).toBeVisible({
      timeout: 20_000,
    });
  });

  test("unsupported file type shows FileNotSupported error", async ({ openWithMock }) => {
    const taskpane = await openWithMock({ fileName: "test-document.xyz" });

    await findZaak(taskpane);
    await expect(taskpane.getByText("Documentgegevens", { exact: true })).toBeVisible();
    await taskpane.getByRole("button", { name: "Document koppelen" }).isDisabled();

    await taskpane.getByLabel("Informatieobjecttype").selectOption({ index: 1 });
    await taskpane.getByLabel("Status").selectOption("definitief");

    const today = new Date().toISOString().split("T")[0];
    await taskpane.getByLabel("Creatiedatum").fill(today);

    await taskpane.getByRole("button", { name: "Document koppelen" }).click();

    // Backend returns 400 / FileNotSupported — the UI should show an error
    await expect(
      taskpane.getByText(/niet ondersteund|not supported|FileNotSupported/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("upload button is unavailable without first finding a zaak", async ({ taskpane }) => {
    // Without searching, the upload form should not be shown at all
    await expect(taskpane.getByText("Documentgegevens", { exact: true })).not.toBeVisible({
      timeout: 3_000,
    });
    await expect(taskpane.getByRole("button", { name: "Document koppelen" })).not.toBeVisible({
      timeout: 3_000,
    });
  });
});
