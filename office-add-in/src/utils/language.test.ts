/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect } from "vitest";
import { pluralize, getVerbForm } from "./language";

describe("language utilities", () => {
  describe("pluralize", () => {
    it("returns singular when count is 1", () => {
      expect(pluralize(1, "bestand", "bestanden")).toBe("bestand");
    });

    it("returns plural when count is 0", () => {
      expect(pluralize(0, "bestand", "bestanden")).toBe("bestanden");
    });

    it("returns plural when count is greater than 1", () => {
      expect(pluralize(2, "bestand", "bestanden")).toBe("bestanden");
      expect(pluralize(5, "bijlage", "bijlagen")).toBe("bijlagen");
    });
  });

  describe("getVerbForm", () => {
    it("returns singular verb when count is 1", () => {
      expect(getVerbForm(1, "is", "zijn")).toBe("is");
      expect(getVerbForm(1, "kon", "konden")).toBe("kon");
    });

    it("returns plural verb when count is 0", () => {
      expect(getVerbForm(0, "is", "zijn")).toBe("zijn");
    });

    it("returns plural verb when count is greater than 1", () => {
      expect(getVerbForm(2, "is", "zijn")).toBe("zijn");
      expect(getVerbForm(3, "kon", "konden")).toBe("konden");
    });
  });
});
