/*
 * SPDX-FileCopyrightText: 2026 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZaakSearch } from "./ZaakSearch";
import { useOffice } from "../../hooks/useOffice";
import { ZaakProvider } from "../../provider/ZaakProvider";
import { fromPartial } from "@total-typescript/shoehorn";

vi.mock("../../hooks/useOffice");
vi.mock("../../utils/getAccessToken", () => ({
  getToken: vi.fn().mockResolvedValue("mock-token"),
  clearToken: vi.fn(),
}));

describe("ZaakSearch", () => {
  const createWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={new QueryClient()}>
      <ZaakProvider>{children}</ZaakProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    vi.mocked(useOffice).mockReturnValue(fromPartial({ isOutlook: false }));
  });

  describe("search button format validation", () => {
    it("is disabled when the input is empty", async () => {
      await act(async () => {
        render(<ZaakSearch />, { wrapper: createWrapper });
      });
      expect(
        (screen.getByRole("button", { name: "Zaak zoeken" }) as HTMLButtonElement).disabled
      ).toBe(true);
    });

    it("is disabled when the input does not start with ZAAK-", async () => {
      render(<ZaakSearch />, { wrapper: createWrapper });
      await act(async () => {
        fireEvent.change(screen.getByLabelText("Zaaknummer"), {
          target: { value: "2026-0000000001" },
        });
      });
      expect(
        (screen.getByRole("button", { name: "Zaak zoeken" }) as HTMLButtonElement).disabled
      ).toBe(true);
    });

    it("is disabled when the input is only the prefix ZAAK without a dash", async () => {
      render(<ZaakSearch />, { wrapper: createWrapper });
      await act(async () => {
        fireEvent.change(screen.getByLabelText("Zaaknummer"), { target: { value: "ZAAK" } });
      });
      expect(
        (screen.getByRole("button", { name: "Zaak zoeken" }) as HTMLButtonElement).disabled
      ).toBe(true);
    });

    it("is enabled when the input starts with ZAAK-", async () => {
      render(<ZaakSearch />, { wrapper: createWrapper });
      fireEvent.change(screen.getByLabelText("Zaaknummer"), {
        target: { value: "ZAAK-2026-0000000001" },
      });
      await waitFor(() => {
        expect(
          (screen.getByRole("button", { name: "Zaak zoeken" }) as HTMLButtonElement).disabled
        ).toBe(false);
      });
    });

    it("is enabled with the minimum valid format ZAAK-", async () => {
      render(<ZaakSearch />, { wrapper: createWrapper });
      fireEvent.change(screen.getByLabelText("Zaaknummer"), { target: { value: "ZAAK-" } });
      await waitFor(() => {
        expect(
          (screen.getByRole("button", { name: "Zaak zoeken" }) as HTMLButtonElement).disabled
        ).toBe(false);
      });
    });
  });
});
