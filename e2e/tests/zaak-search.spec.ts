/*
 * SPDX-FileCopyrightText: 2026 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { test, expect } from "../fixtures/test-fixture";

test.describe("zaak-search", () => {
  test("empty search, button is disabled", async ({ taskpane }) => {
    await taskpane.getByRole("button", { name: "Zaak zoeken" }).isVisible();

    // The button should be disabled
    await expect(taskpane.getByRole("button", { name: "Zaak zoeken" })).not.toBeEnabled({
      timeout: 3_000,
    });
  });

  test("search for unknown zaak shows not-found error", async ({ taskpane }) => {
    await taskpane.getByLabel("Zaaknummer").fill("ZAAK-2000-0000000000");
    await taskpane.getByRole("button", { name: "Zaak zoeken" }).click();

    await expect(taskpane.getByText("De zaak kan niet worden gevonden")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("search for existing zaak shows zaak details", async ({ taskpane }) => {
    await taskpane.getByLabel("Zaaknummer").fill("ZAAK-2026-0000000001");
    await taskpane.getByRole("button", { name: "Zaak zoeken" }).click();

    await expect(taskpane.getByText("Gevonden zaak")).toBeVisible({
      timeout: 15_000,
    });
    await expect(taskpane.getByText("ZAAK-2026-0000000001")).toBeVisible();
    await expect(taskpane.getByText("Test zaaktype 3")).toBeVisible();
  });
});
