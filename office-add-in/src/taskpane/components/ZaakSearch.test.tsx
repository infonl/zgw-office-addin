/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ZaakSearch } from "./ZaakSearch";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { fromPartial } from "@total-typescript/shoehorn";
import type { Zaak } from "../../hooks/useGetZaak";

// Mock dependencies
vi.mock("../../hooks/useOffice", () => ({
  useOffice: () => ({
    isOutlook: false,
    isWord: true,
  }),
}));

vi.mock("../../provider/ZaakProvider", () => ({
  useZaak: vi.fn(),
}));

vi.mock("../../utils/getAccessToken", () => ({
  getToken: vi.fn().mockResolvedValue("mock-token"),
}));

import { useZaak } from "../../provider/ZaakProvider";

describe("ZaakSearch", () => {
  const mockSetZaakToSearch = vi.fn();

  const renderComponent = (zaakData?: Partial<Zaak>, isLoading = false, isError = false) => {
    vi.mocked(useZaak).mockReturnValue({
      setZaakToSearch: mockSetZaakToSearch,
      documentAdded: vi.fn(),
      documentAddedToZaak: null,
      reset: vi.fn(),
      zaak: {
        data: zaakData ? fromPartial<Zaak>(zaakData) : undefined,
        isLoading,
        isError,
        isSuccess: !!zaakData,
        error: null,
      },
    });

    return render(
      <FluentProvider theme={webLightTheme}>
        <ZaakSearch />
      </FluentProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Form Rendering", () => {
    it("renders the search form", () => {
      renderComponent();

      expect(screen.getByText("Koppelen aan zaak")).toBeInTheDocument();
      expect(screen.getByLabelText("Zaaknummer")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /zaak zoeken/i })).toBeInTheDocument();
    });

    it("displays correct helper text for Word", () => {
      renderComponent();

      expect(
        screen.getByText(/vul het zaaknummer in waar je dit document aan wil koppelen/i)
      ).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("disables submit button when form is invalid", () => {
      renderComponent();

      const button = screen.getByRole("button", { name: /zaak zoeken/i });
      expect(button).toBeDisabled();
    });

    it("enables submit button when valid zaaknummer is entered", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByLabelText("Zaaknummer");
      const button = screen.getByRole("button", { name: /zaak zoeken/i });

      // Initially disabled
      expect(button).toBeDisabled();

      await user.type(input, "ZAAK-123");
      await user.tab(); // Trigger blur to complete validation

      await waitFor(
        () => {
          expect(button).not.toBeDisabled();
        },
        { timeout: 3000 }
      );
    });

    it("shows validation error for invalid format", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByLabelText("Zaaknummer");

      // Type invalid format and blur
      await user.type(input, "INVALID");
      await user.tab();

      // Button should remain disabled
      const button = screen.getByRole("button", { name: /zaak zoeken/i });
      expect(button).toBeDisabled();
    });
  });

  describe("Form Submission", () => {
    it("calls setZaakToSearch when valid form is submitted", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByLabelText("Zaaknummer");

      await user.type(input, "ZAAK-123");
      await user.tab(); // Trigger validation

      await waitFor(async () => {
        const button = screen.getByRole("button", { name: /zaak zoeken/i });
        expect(button).not.toBeDisabled();
      });

      const button = screen.getByRole("button", { name: /zaak zoeken/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockSetZaakToSearch).toHaveBeenCalledWith("ZAAK-123");
      });
    });
  });

  describe("Loading State", () => {
    it("displays loading message when searching", () => {
      renderComponent(undefined, true, false);

      // Use getAllByText since there's both a button and message bar title with this text
      const elements = screen.getAllByText("Zaak zoeken");
      expect(elements.length).toBeGreaterThan(0);
      expect(screen.getByText(/dit kan even duren/i)).toBeInTheDocument();
    });

    it("disables submit button when loading", () => {
      renderComponent(undefined, true, false);

      const button = screen.getByRole("button", { name: /zaak zoeken/i });
      expect(button).toBeDisabled();
    });
  });

  describe("Error State", () => {
    it("displays error message when zaak is not found", () => {
      renderComponent(undefined, false, true);

      expect(screen.getByText("Oeps")).toBeInTheDocument();
      expect(screen.getByText(/de zaak kan niet worden gevonden/i)).toBeInTheDocument();
    });
  });

  describe("Success State", () => {
    const mockZaakData = {
      identificatie: "ZAAK-001",
      zaaktype: {
        omschrijving: "Test Zaaktype",
      },
      status: {
        statustoelichting: "In behandeling",
      },
      omschrijving: "Test zaak omschrijving",
    };

    it("displays zaak details when found", () => {
      renderComponent(mockZaakData);

      expect(screen.getByText("Gevonden zaak")).toBeInTheDocument();
      expect(screen.getByText("ZAAK-001")).toBeInTheDocument();
      expect(screen.getByText("Test Zaaktype")).toBeInTheDocument();
      expect(screen.getByText("In behandeling")).toBeInTheDocument();
      expect(screen.getByText("Test zaak omschrijving")).toBeInTheDocument();
    });

    it("displays all zaak fields in table", () => {
      renderComponent(mockZaakData);

      // Use getAllByText since labels appear both in input and table
      const zaaknummerElements = screen.getAllByText("Zaaknummer");
      expect(zaaknummerElements.length).toBeGreaterThan(0);
      expect(screen.getByText("Zaaktype")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Omschrijving")).toBeInTheDocument();
    });
  });
});
