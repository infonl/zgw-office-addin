/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect } from "vitest";
import { getIntentAndTitle, getSuccessMessage, getErrorMessage } from "./UploadResultMessageBar";

describe("UploadResultMessageBar helpers", () => {
  describe("getIntentAndTitle", () => {
    it("returns error intent when only errors occurred", () => {
      const result = getIntentAndTitle(true, false);

      expect(result).toEqual({
        intent: "error",
        title: "Koppeling mislukt",
      });
    });

    it("returns warning intent when partial success occurred", () => {
      const result = getIntentAndTitle(true, true);

      expect(result).toEqual({
        intent: "warning",
        title: "Deels gekoppeld",
      });
    });

    it("returns success intent when all succeeded", () => {
      const result = getIntentAndTitle(false, true);

      expect(result).toEqual({
        intent: "success",
        title: "Gekoppeld",
      });
    });
  });

  describe("getSuccessMessage", () => {
    it("returns message for email and attachments", () => {
      const result = getSuccessMessage(true, 2);

      expect(result).toBe("De e-mail en 2 bijlagen zijn succesvol gekoppeld.");
    });

    it("returns message for email and single attachment", () => {
      const result = getSuccessMessage(true, 1);

      expect(result).toBe("De e-mail en 1 bijlage zijn succesvol gekoppeld.");
    });

    it("returns message for email only", () => {
      const result = getSuccessMessage(true, 0);

      expect(result).toBe("De e-mail is succesvol gekoppeld.");
    });

    it("returns message for email only when attachments undefined", () => {
      const result = getSuccessMessage(true, undefined);

      expect(result).toBe("De e-mail is succesvol gekoppeld.");
    });

    it("returns message for multiple attachments only", () => {
      const result = getSuccessMessage(false, 3);

      expect(result).toBe("3 bijlagen zijn succesvol gekoppeld.");
    });

    it("returns message for single attachment only", () => {
      const result = getSuccessMessage(false, 1);

      expect(result).toBe("1 bijlage is succesvol gekoppeld.");
    });

    it("returns null when nothing was uploaded", () => {
      const result = getSuccessMessage(false, 0);

      expect(result).toBeNull();
    });

    it("returns null when both are undefined", () => {
      const result = getSuccessMessage(undefined, undefined);

      expect(result).toBeNull();
    });
  });

  describe("getErrorMessage", () => {
    it("returns partial failure message for multiple files", () => {
      const result = getErrorMessage(2, true);

      expect(result).toBe("Er zijn echter fouten opgetreden bij 2 bestanden.");
    });

    it("returns partial failure message for single file", () => {
      const result = getErrorMessage(1, true);

      expect(result).toBe("Er is echter een fout opgetreden bij een bestand.");
    });

    it("returns full failure message for multiple files", () => {
      const result = getErrorMessage(3, false);

      expect(result).toBe("Er zijn fouten opgetreden bij het koppelen van bestanden.");
    });

    it("returns full failure message for single file", () => {
      const result = getErrorMessage(1, false);

      expect(result).toBe("Er is een fout opgetreden bij het koppelen van bestanden.");
    });
  });
});
