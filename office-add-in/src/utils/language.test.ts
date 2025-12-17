/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect } from "vitest";
import { pluralize, getVerbForm } from "./language";

describe("language utilities", () => {
  describe("pluralize", () => {
    it.each([
      [1, "bestand", "bestanden", "bestand"],
      [0, "bestand", "bestanden", "bestanden"],
      [2, "bestand", "bestanden", "bestanden"],
      [5, "bijlage", "bijlagen", "bijlagen"],
    ])("returns correct form for count %s", (count, singular, plural, expected) => {
      expect(pluralize(count, singular, plural)).toBe(expected);
    });
  });

  describe("getVerbForm", () => {
    it.each([
      [1, "is", "zijn", "is"],
      [1, "kon", "konden", "kon"],
      [0, "is", "zijn", "zijn"],
      [2, "is", "zijn", "zijn"],
      [3, "kon", "konden", "konden"],
    ])("returns correct verb form for count %s", (count, singular, plural, expected) => {
      expect(getVerbForm(count, singular, plural)).toBe(expected);
    });
  });
});
