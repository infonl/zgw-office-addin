/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OfficeForm } from "./OfficeForm";
import { useAddDocumentToZaak } from "../../hooks/useAddDocumentToZaak";
import { useOffice } from "../../hooks/useOffice";
import { ZaakProvider } from "../../provider/ZaakProvider";
import { ToastProvider } from "../../provider/ToastProvider";
import type { Zaak } from "../../hooks/useGetZaak";
import { fromPartial } from "@total-typescript/shoehorn";
import * as useGetZaakModule from "../../hooks/useGetZaak";

vi.mock("../../hooks/useAddDocumentToZaak");
vi.mock("../../hooks/useOffice");
vi.mock("../../hooks/useGetZaak");
vi.mock("./ZaakSearch", () => ({
  ZaakSearch: () => <div data-testid="zaak-search">Zaak Search</div>,
}));

describe("OfficeForm", () => {
  let queryClient: QueryClient;
  const mockMutateAsync = vi.fn();
  const mockGetSignedInUser = vi.fn();

  const mockZaak = fromPartial<Zaak>({
    identificatie: "ZAAK-2025-0001",
    url: "https://example.com/zaak/1",
    bronorganisatie: "123456789",
    vertrouwelijkheidaanduiding: "intern",
    zaakinformatieobjecten: [
      {
        url: "https://example.com/zio/1",
        informatieobject: "https://example.com/io/1",
        vertrouwelijkheidaanduiding: "vertrouwelijk",
        omschrijving: "Test document 1",
      },
      {
        url: "https://example.com/zio/2",
        informatieobject: "https://example.com/io/2",
        vertrouwelijkheidaanduiding: "openbaar",
        omschrijving: "Test document 2",
      },
    ],
  });

  const createWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ZaakProvider>
        <ToastProvider>{children}</ToastProvider>
      </ZaakProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.clearAllMocks();

    vi.mocked(useAddDocumentToZaak).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      mutate: vi.fn(),
      data: undefined,
      error: null,
      isError: false,
      isIdle: true,
      isSuccess: false,
      reset: vi.fn(),
      status: "idle",
      variables: undefined,
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      submittedAt: 0,
    });

    vi.mock("../../utils/getAccessToken", () => ({
      getToken: vi.fn().mockResolvedValue("mock-token"),
    }));

    vi.mocked(useOffice).mockReturnValue({
      getSignedInUser: mockGetSignedInUser,
      processAndUploadDocuments: vi.fn(),
      host: 0,
      isInBrowser: false,
      getDocumentData: vi.fn(),
      getFileName: vi.fn(),
      getDocumentFileName: vi.fn(),
      getOutlookSubject: vi.fn(),
      isOutlook: false,
      isWord: false,
      isExcel: false,
    });

    vi.mocked(useGetZaakModule.useGetZaak).mockReturnValue(
      fromPartial({ data: mockZaak, isLoading: false, error: null })
    );

    mockGetSignedInUser.mockResolvedValue("John Doe");
  });

  describe("vertrouwelijkheidaanduiding logic", () => {
    it("should set vertrouwelijkheidaanduiding from zaak data on mount", async () => {
      render(<OfficeForm />, { wrapper: createWrapper });

      await waitFor(() => {
        const select = screen.getByLabelText(/vertrouwelijkheid/i) as HTMLSelectElement;
        expect(select.value).toBe("intern");
      });
    });

    it("should update vertrouwelijkheidaanduiding when informatieobjecttype is selected", async () => {
      render(<OfficeForm />, { wrapper: createWrapper });

      await waitFor(() => {
        expect(screen.getByLabelText(/informatieobjecttype/i)).toBeTruthy();
      });

      // Select an informatieobjecttype
      const informatieobjecttypeSelect = screen.getByLabelText(
        /informatieobjecttype/i
      ) as HTMLSelectElement;
      fireEvent.change(informatieobjecttypeSelect, {
        target: { value: "https://example.com/zio/1" },
      });

      await waitFor(() => {
        const vertrouwelijkheidSelect = screen.getByLabelText(
          /vertrouwelijkheid/i
        ) as HTMLSelectElement;
        expect(vertrouwelijkheidSelect.value).toBe("vertrouwelijk");
      });
    });

    it("should update to different vertrouwelijkheidaanduiding when different informatieobjecttype is selected", async () => {
      render(<OfficeForm />, { wrapper: createWrapper });

      await waitFor(() => {
        expect(screen.getByLabelText(/informatieobjecttype/i)).toBeTruthy();
      });

      // Select second informatieobjecttype with different vertrouwelijkheidaanduiding
      const informatieobjecttypeSelect = screen.getByLabelText(
        /informatieobjecttype/i
      ) as HTMLSelectElement;
      fireEvent.change(informatieobjecttypeSelect, {
        target: { value: "https://example.com/zio/2" },
      });

      await waitFor(() => {
        const vertrouwelijkheidSelect = screen.getByLabelText(
          /vertrouwelijkheid/i
        ) as HTMLSelectElement;
        expect(vertrouwelijkheidSelect.value).toBe("openbaar");
      });
    });

    it("should not update vertrouwelijkheidaanduiding if zaakinformatieobject has no vertrouwelijkheidaanduiding", async () => {
      const zaakWithoutVertrouwelijkheid = fromPartial<Zaak>({
        ...mockZaak,
        vertrouwelijkheidaanduiding: "openbaar",
        zaakinformatieobjecten: [
          {
            url: "https://example.com/zio/1",
            informatieobject: "https://example.com/io/1",
            omschrijving: "Test",
          },
        ],
      });

      vi.mocked(useGetZaakModule.useGetZaak).mockReturnValue(
        fromPartial({ data: zaakWithoutVertrouwelijkheid, isLoading: false, error: null })
      );

      render(<OfficeForm />, { wrapper: createWrapper });

      await waitFor(() => {
        expect(screen.getByLabelText(/informatieobjecttype/i)).toBeTruthy();
      });

      const informatieobjecttypeSelect = screen.getByLabelText(
        /informatieobjecttype/i
      ) as HTMLSelectElement;
      fireEvent.change(informatieobjecttypeSelect, {
        target: { value: "https://example.com/zio/1" },
      });

      await waitFor(() => {
        const vertrouwelijkheidSelect = screen.getByLabelText(
          /vertrouwelijkheid/i
        ) as HTMLSelectElement;
        // Should remain the default from zaak
        expect(vertrouwelijkheidSelect.value).toBe("openbaar");
      });
    });

    it("should handle invalid vertrouwelijkheidaanduiding value gracefully", async () => {
      const zaakWithInvalidValue = fromPartial<Zaak>({
        ...mockZaak,
        vertrouwelijkheidaanduiding:
          "invalid_value" as unknown as typeof mockZaak.vertrouwelijkheidaanduiding,
      });

      vi.mocked(useGetZaakModule.useGetZaak).mockReturnValue(
        fromPartial({ data: zaakWithInvalidValue, isLoading: false, error: null })
      );

      render(<OfficeForm />, { wrapper: createWrapper });

      await waitFor(() => {
        const vertrouwelijkheidSelect = screen.getByLabelText(
          /vertrouwelijkheid/i
        ) as HTMLSelectElement;
        // Should remain default value since parsing failed
        expect(vertrouwelijkheidSelect.value).toBe("openbaar");
      });
    });

    it("should handle invalid vertrouwelijkheidaanduiding in zaakinformatieobject gracefully", async () => {
      const zaakWithInvalidZIO = fromPartial<Zaak>({
        ...mockZaak,
        vertrouwelijkheidaanduiding: "openbaar",
        zaakinformatieobjecten: [
          {
            url: "https://example.com/zio/1",
            informatieobject: "https://example.com/io/1",
            vertrouwelijkheidaanduiding: "invalid_value",
            omschrijving: "Test",
          },
        ],
      });

      vi.mocked(useGetZaakModule.useGetZaak).mockReturnValue(
        fromPartial({ data: zaakWithInvalidZIO, isLoading: false, error: null })
      );

      render(<OfficeForm />, { wrapper: createWrapper });

      await waitFor(() => {
        expect(screen.getByLabelText(/informatieobjecttype/i)).toBeTruthy();
      });

      const informatieobjecttypeSelect = screen.getByLabelText(
        /informatieobjecttype/i
      ) as HTMLSelectElement;
      fireEvent.change(informatieobjecttypeSelect, {
        target: { value: "https://example.com/zio/1" },
      });

      await waitFor(() => {
        const vertrouwelijkheidSelect = screen.getByLabelText(
          /vertrouwelijkheid/i
        ) as HTMLSelectElement;
        // Should remain the zaak's value since parsing failed
        expect(vertrouwelijkheidSelect.value).toBe("openbaar");
      });
    });

    it("should not update vertrouwelijkheidaanduiding if value is already the same", async () => {
      const zaakWithSameValue = fromPartial<Zaak>({
        ...mockZaak,
        vertrouwelijkheidaanduiding: "vertrouwelijk",
        zaakinformatieobjecten: [
          {
            url: "https://example.com/zio/1",
            informatieobject: "https://example.com/io/1",
            vertrouwelijkheidaanduiding: "vertrouwelijk",
            omschrijving: "Test",
          },
        ],
      });

      vi.mocked(useGetZaakModule.useGetZaak).mockReturnValue(
        fromPartial({ data: zaakWithSameValue, isLoading: false, error: null })
      );

      render(<OfficeForm />, { wrapper: createWrapper });

      // Wait for initial zaak vertrouwelijkheidaanduiding to be set
      await waitFor(() => {
        const vertrouwelijkheidSelect = screen.getByLabelText(
          /vertrouwelijkheid/i
        ) as HTMLSelectElement;
        expect(vertrouwelijkheidSelect.value).toBe("vertrouwelijk");
      });

      // Select informatieobjecttype with same vertrouwelijkheidaanduiding
      const informatieobjecttypeSelect = screen.getByLabelText(
        /informatieobjecttype/i
      ) as HTMLSelectElement;
      fireEvent.change(informatieobjecttypeSelect, {
        target: { value: "https://example.com/zio/1" },
      });

      // Value should still be vertrouwelijk (no unnecessary updates)
      const vertrouwelijkheidSelect = screen.getByLabelText(
        /vertrouwelijkheid/i
      ) as HTMLSelectElement;
      expect(vertrouwelijkheidSelect.value).toBe("vertrouwelijk");
    });

    it("should handle all valid vertrouwelijkheidaanduiding values", async () => {
      const validValues = [
        "openbaar",
        "beperkt_openbaar",
        "intern",
        "zaakvertrouwelijk",
        "vertrouwelijk",
        "confidentieel",
        "geheim",
        "zeer_geheim",
      ];

      for (const value of validValues) {
        const zaakWithValue = fromPartial<Zaak>({
          ...mockZaak,
          vertrouwelijkheidaanduiding:
            value as unknown as typeof mockZaak.vertrouwelijkheidaanduiding,
        });

        vi.mocked(useGetZaakModule.useGetZaak).mockReturnValue(
          fromPartial({ data: zaakWithValue, isLoading: false, error: null })
        );

        const { unmount } = render(<OfficeForm />, { wrapper: createWrapper });

        await waitFor(() => {
          const vertrouwelijkheidSelect = screen.getByLabelText(
            /vertrouwelijkheid/i
          ) as HTMLSelectElement;
          expect(vertrouwelijkheidSelect.value).toBe(value);
        });

        unmount();
      }
    });
  });

  describe("form initialization", () => {
    it("should set auteur from signed-in user", async () => {
      render(<OfficeForm />, { wrapper: createWrapper });

      await waitFor(() => {
        const input = screen.getByDisplayValue("John Doe");
        expect(input).toBeTruthy();
      });
    });

    it("should not set auteur if getSignedInUser returns null", async () => {
      mockGetSignedInUser.mockResolvedValue(null);

      render(<OfficeForm />, { wrapper: createWrapper });

      await waitFor(() => {
        const auteurInput = screen.getByLabelText(/auteur/i) as HTMLInputElement;
        expect(auteurInput.value).toBe("");
      });
    });

    it("should initialize with default values", async () => {
      render(<OfficeForm />, { wrapper: createWrapper });

      await waitFor(() => {
        const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement;
        const infoObjectSelect = screen.getByLabelText(
          /informatieobjecttype/i
        ) as HTMLSelectElement;
        expect(statusSelect.value).toBe("in_bewerking");
        expect(infoObjectSelect.value).toBe("");
      });
    });
  });

  describe("form submission", () => {
    it("should call mutateAsync with form data on submit", async () => {
      render(<OfficeForm />, { wrapper: createWrapper });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /document koppelen/i })).toBeTruthy();
      });

      // Fill in required fields
      const informatieobjecttypeSelect = screen.getByLabelText(
        /informatieobjecttype/i
      ) as HTMLSelectElement;
      fireEvent.change(informatieobjecttypeSelect, {
        target: { value: "https://example.com/zio/1" },
      });

      // Wait for form to be valid
      await waitFor(() => {
        const submitButton = screen.getByRole("button", {
          name: /document koppelen/i,
        }) as HTMLButtonElement;
        expect(submitButton.disabled).toBe(false);
      });

      // Submit form
      const submitButton = screen.getByRole("button", { name: /document koppelen/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            zaakidentificatie: "ZAAK-2025-0001",
            informatieobjecttype: "https://example.com/zio/1",
            auteur: "John Doe",
            vertrouwelijkheidaanduiding: expect.any(String),
            status: "in_bewerking",
          })
        );
      });
    });

    it("should disable submit button while pending", async () => {
      vi.mocked(useAddDocumentToZaak).mockReturnValue(
        fromPartial({
          mutateAsync: mockMutateAsync,
          isPending: true,
          status: "pending",
        })
      );

      render(<OfficeForm />, { wrapper: createWrapper });

      await waitFor(() => {
        const submitButton = screen.getByRole("button", {
          name: /document koppelen/i,
        }) as HTMLButtonElement;
        expect(submitButton.disabled).toBe(true);
      });
    });
  });

  describe("rendering", () => {
    it("should render ZaakSearch when no zaak data", () => {
      vi.mocked(useGetZaakModule.useGetZaak).mockReturnValue(
        fromPartial({ data: undefined, isLoading: false, error: null })
      );

      render(<OfficeForm />, { wrapper: createWrapper });

      expect(screen.getByTestId("zaak-search")).toBeTruthy();
      expect(screen.queryByText(/documentgegevens/i)).toBeNull();
    });

    it("should render form when zaak data is available", async () => {
      render(<OfficeForm />, { wrapper: createWrapper });

      await waitFor(() => {
        const headings = screen.getAllByText(/documentgegevens/i);
        expect(headings.length).toBeGreaterThan(0);
        expect(screen.getByRole("button", { name: /document koppelen/i })).toBeTruthy();
      });
    });

    it("should render DocumentMetadataFields with correct props", async () => {
      render(<OfficeForm />, { wrapper: createWrapper });

      await waitFor(() => {
        expect(screen.getByLabelText(/auteur/i)).toBeTruthy();
        expect(screen.getByLabelText(/informatieobjecttype/i)).toBeTruthy();
        expect(screen.getByLabelText(/vertrouwelijkheid/i)).toBeTruthy();
        expect(screen.getByLabelText(/status/i)).toBeTruthy();
        expect(screen.getByLabelText(/creatiedatum/i)).toBeTruthy();
      });
    });
  });
});
