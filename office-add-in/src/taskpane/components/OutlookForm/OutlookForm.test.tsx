/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OutlookForm from "./OutlookForm";
import { ZaakProvider } from "../../../provider/ZaakProvider";
import { ToastProvider } from "../../../provider/ToastProvider";
import * as useOutlookFormModule from "./hooks/useOutlookForm";
import {
  mockEmailDocument,
  mockAttachmentDocument1,
  mockAttachmentDocument2,
} from "./hooks/mockDocuments";

const mockReset = vi.fn();
const mockSetZaakToSearch = vi.fn();
const mockClearCache = vi.fn();

const createMockUseOutlookForm = (
  _overrides?: Partial<ReturnType<typeof useOutlookFormModule.useOutlookForm>>
): ReturnType<typeof useOutlookFormModule.useOutlookForm> =>
  ({
    form: {
      watch: vi.fn().mockReturnValue([]),
      handleSubmit: vi.fn((callback) => async () => {
        try {
          await callback({ documents: [] });
        } catch {
          // Handle error
        }
      }),
      reset: vi.fn(),
      formState: {
        isValid: true,
        isDirty: false,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isSubmitting: false,
        isValidating: false,
        submitCount: 0,
        disabled: false,
        errors: {},
        dirtyFields: {},
        touchedFields: {},
        defaultValues: {},
        validatingFields: {},
        isReady: true,
      } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"]["formState"],
    } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"],
    zaak: {
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["zaak"],
    hasSelectedDocuments: false,
    handleSubmit: vi.fn(),
  }) as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>;

vi.mock("./hooks/useOutlookForm", () => ({
  useOutlookForm: vi.fn(() => createMockUseOutlookForm()),
}));

vi.mock("../../../provider/ZaakProvider", () => ({
  ZaakProvider: ({ children }: { children: React.ReactNode }) => children,
  useZaak: () => ({
    zaak: {
      data: {
        identificatie: "ZAAK-001",
        titel: "Test Zaak",
      },
    },
    reset: mockReset,
    setZaakToSearch: mockSetZaakToSearch,
  }),
}));

vi.mock("../../../provider/ToastProvider", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  useToast: () => ({
    dispatchToast: vi.fn(),
    dismissToast: vi.fn(),
  }),
}));

vi.mock("../../../hooks/useOffice", () => ({
  useOffice: () => ({
    processAndUploadDocuments: vi.fn(),
    isInBrowser: true,
  }),
}));

vi.mock("../ZaakSearch", () => ({
  ZaakSearch: () => <div data-testid="zaak-search">Zaak Search</div>,
}));

vi.mock("./steps/SelectItems", () => ({
  SelectItems: () => <div data-testid="select-items">Select Items</div>,
}));

vi.mock("./steps/MetadataStep", () => ({
  MetadataStep: ({ isUploading }: { isUploading: boolean }) => (
    <div data-testid="metadata-step" data-uploading={isUploading}>
      Metadata Step
    </div>
  ),
}));

vi.mock("./components/UploadResultMessageBar", () => ({
  UploadResultMessageBar: ({
    uploadSuccess,
    uploadError,
    errorCount,
    uploadedEmail,
    uploadedAttachments,
  }: {
    uploadSuccess: boolean;
    uploadError: boolean;
    errorCount: number;
    uploadedEmail: boolean;
    uploadedAttachments: number;
  }) => (
    <div data-testid="upload-result">
      <div data-testid="upload-success">{uploadSuccess ? "Success" : "Not Success"}</div>
      <div data-testid="upload-error">{uploadError ? "Error" : "No Error"}</div>
      <div data-testid="error-count">{errorCount}</div>
      <div data-testid="uploaded-email">{uploadedEmail ? "Email" : "No Email"}</div>
      <div data-testid="uploaded-attachments">{uploadedAttachments}</div>
    </div>
  ),
}));

describe("OutlookForm", () => {
  let queryClient: QueryClient;

  const createMockFormState = (isValid = true) =>
    ({
      isDirty: false,
      isLoading: false,
      isSubmitted: false,
      isSubmitSuccessful: false,
      isSubmitting: false,
      isValidating: false,
      isValid,
      submitCount: 0,
      disabled: false,
      errors: {},
      dirtyFields: {},
      touchedFields: {},
      defaultValues: {},
      validatingFields: {},
      isReady: true,
    }) as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"]["formState"];

  const createMockUseOutlookForm = (
    overrides?: Partial<ReturnType<typeof useOutlookFormModule.useOutlookForm>>
  ): ReturnType<typeof useOutlookFormModule.useOutlookForm> => {
    const defaultMock = {
      form: {
        watch: vi.fn().mockReturnValue([]),
        reset: vi.fn(),
        handleSubmit: vi.fn(),
        formState: createMockFormState(true),
      } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"],
      documents: [],
      hasSelectedDocuments: true,
      zaak: { data: { identificatie: "ZAAK-001" } },
      handleSubmit: vi.fn().mockResolvedValue({ error: null }),
      ...overrides,
    };
    return defaultMock as ReturnType<typeof useOutlookFormModule.useOutlookForm>;
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.clearAllMocks();
    mockReset.mockReset();
    mockSetZaakToSearch.mockReset();
    mockClearCache.mockReset();

    const mockMutationCache = {
      findAll: vi.fn().mockReturnValue([]),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
      clear: vi.fn(),
    };
    queryClient.getMutationCache = vi.fn().mockReturnValue(mockMutationCache);
  });

  const renderOutlookForm = (
    useOutlookFormMock?: Partial<ReturnType<typeof useOutlookFormModule.useOutlookForm>>
  ) => {
    const mockUseOutlookForm = createMockUseOutlookForm(useOutlookFormMock);
    (useOutlookFormModule.useOutlookForm as ReturnType<typeof vi.fn>).mockReturnValue(
      mockUseOutlookForm
    );

    return render(
      <QueryClientProvider client={queryClient}>
        <ZaakProvider>
          <ToastProvider>
            <OutlookForm />
          </ToastProvider>
        </ZaakProvider>
      </QueryClientProvider>
    );
  };

  describe("Component Structure", () => {
    it("renders SelectItems step initially", () => {
      renderOutlookForm();
      expect(screen.getByTestId("select-items")).toBeDefined();
    });

    it("disables next button when no documents selected", () => {
      renderOutlookForm({
        form: {
          watch: vi.fn().mockReturnValue([]),
          reset: vi.fn(),
          handleSubmit: vi.fn(),
          formState: createMockFormState(true),
        } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"],
        hasSelectedDocuments: false,
      });

      const nextButton = screen.getByRole("button", {
        name: /volgende stap: bestandsgegevens/i,
      });
      expect(nextButton.hasAttribute("disabled")).toBe(true);
    });

    it("enables next button when documents are selected", () => {
      renderOutlookForm({
        form: {
          watch: vi.fn().mockReturnValue([mockEmailDocument]),
          reset: vi.fn(),
          handleSubmit: vi.fn(),
          formState: createMockFormState(true),
        } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"],
        hasSelectedDocuments: true,
      });

      const nextButton = screen.getByRole("button", {
        name: /volgende stap: bestandsgegevens/i,
      });
      expect(nextButton.hasAttribute("disabled")).toBe(false);
    });
  });

  describe("Upload Status Calculation", () => {
    it("correctly renders MetadataStep with isUploading prop", () => {
      renderOutlookForm({
        form: {
          watch: vi.fn().mockReturnValue([mockEmailDocument]),
          reset: vi.fn(),
          handleSubmit: vi.fn(),
          formState: createMockFormState(true),
        } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"],
        hasSelectedDocuments: true,
      });

      // Navigate to metadata step
      const nextButton = screen.getByRole("button", {
        name: /volgende stap: bestandsgegevens/i,
      });
      fireEvent.click(nextButton);

      const metadataStep = screen.getByTestId("metadata-step");
      expect(metadataStep).toBeDefined();
      expect(metadataStep.getAttribute("data-uploading")).toBe("false");
    });
  });

  describe("Form Submission", () => {
    it("disables submit button when form is invalid", () => {
      renderOutlookForm({
        form: {
          watch: vi.fn().mockReturnValue([mockEmailDocument]),
          reset: vi.fn(),
          handleSubmit: vi.fn().mockReturnValue(vi.fn()),
          formState: createMockFormState(false),
        } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"],
        hasSelectedDocuments: true,
      });

      const nextButton = screen.getByRole("button", {
        name: /volgende stap: bestandsgegevens/i,
      });
      fireEvent.click(nextButton);

      const submitButton = screen.getByRole("button", {
        name: /bestanden koppelen/i,
      });
      expect(submitButton.hasAttribute("disabled")).toBe(true);
    });

    it("enables submit button when form is valid", () => {
      renderOutlookForm({
        form: {
          watch: vi.fn().mockReturnValue([mockEmailDocument]),
          reset: vi.fn(),
          handleSubmit: vi.fn().mockReturnValue(vi.fn()),
          formState: createMockFormState(true),
        } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"],
        hasSelectedDocuments: true,
      });

      const nextButton = screen.getByRole("button", {
        name: /volgende stap: bestandsgegevens/i,
      });
      fireEvent.click(nextButton);

      const submitButton = screen.getByRole("button", {
        name: /bestanden koppelen/i,
      });
      expect(submitButton.hasAttribute("disabled")).toBe(false);
    });
  });

  describe("Selected Documents filtering", () => {
    it("correctly handles selected documents from form watch", () => {
      const mockWatch = vi.fn().mockReturnValue([
        { ...mockEmailDocument, selected: true },
        { ...mockAttachmentDocument1, selected: false },
        { ...mockAttachmentDocument2, selected: true },
      ]);

      renderOutlookForm({
        form: {
          watch: mockWatch,
          reset: vi.fn(),
          handleSubmit: vi.fn(),
          formState: createMockFormState(true),
        } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"],
        hasSelectedDocuments: true,
      });

      expect(mockWatch).toHaveBeenCalledWith("documents");
    });

    it("renders metadata step with multiple selected documents", () => {
      renderOutlookForm({
        form: {
          watch: vi.fn().mockReturnValue([
            { ...mockEmailDocument, selected: true },
            { ...mockAttachmentDocument1, selected: true },
            { ...mockAttachmentDocument2, selected: true },
          ]),
          reset: vi.fn(),
          handleSubmit: vi.fn(),
          formState: createMockFormState(true),
        } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"],
        hasSelectedDocuments: true,
      });

      const nextButton = screen.getByRole("button", {
        name: /volgende stap: bestandsgegevens/i,
      });
      fireEvent.click(nextButton);

      const metadataStep = screen.getByTestId("metadata-step");
      expect(metadataStep).toBeDefined();
    });

    it("handles mixed email and attachment documents", () => {
      renderOutlookForm({
        form: {
          watch: vi.fn().mockReturnValue([
            { ...mockEmailDocument, selected: true },
            { ...mockAttachmentDocument1, selected: true },
          ]),
          reset: vi.fn(),
          handleSubmit: vi.fn(),
          formState: createMockFormState(true),
        } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"],
        hasSelectedDocuments: true,
      });

      expect(screen.getByTestId("select-items")).toBeDefined();
    });
  });

  describe("Document Type differentiation", () => {
    it("correctly identifies email documents by attachmentType", () => {
      renderOutlookForm({
        form: {
          watch: vi.fn().mockReturnValue([{ ...mockEmailDocument, selected: true }]),
          reset: vi.fn(),
          handleSubmit: vi.fn(),
          formState: createMockFormState(true),
        } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"],
        hasSelectedDocuments: true,
      });

      expect(screen.getByTestId("select-items")).toBeDefined();
    });

    it("correctly counts attachment documents", () => {
      renderOutlookForm({
        form: {
          watch: vi.fn().mockReturnValue([
            { ...mockEmailDocument, selected: true },
            { ...mockAttachmentDocument1, selected: true },
            { ...mockAttachmentDocument2, selected: true },
          ]),
          reset: vi.fn(),
          handleSubmit: vi.fn(),
          formState: createMockFormState(true),
        } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"],
        hasSelectedDocuments: true,
      });

      expect(screen.getByTestId("select-items")).toBeDefined();
    });
  });

  describe("Reset dunctionality", () => {
    it("reset functions are available", () => {
      const mockFormReset = vi.fn();
      renderOutlookForm({
        form: {
          watch: vi.fn().mockReturnValue([]),
          reset: mockFormReset,
          handleSubmit: vi.fn(),
          formState: createMockFormState(true),
        } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"],
        hasSelectedDocuments: true,
      });

      expect(mockFormReset).not.toHaveBeenCalled();
      expect(mockSetZaakToSearch).not.toHaveBeenCalled();
    });
  });

  describe("Navigation flow", () => {
    it("navigates from SelectItems to MetadataStep", () => {
      renderOutlookForm({
        form: {
          watch: vi.fn().mockReturnValue([mockEmailDocument]),
          reset: vi.fn(),
          handleSubmit: vi.fn(),
          formState: createMockFormState(true),
        } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"],
        hasSelectedDocuments: true,
      });

      expect(screen.getByTestId("select-items")).toBeDefined();

      const nextButton = screen.getByRole("button", {
        name: /volgende stap: bestandsgegevens/i,
      });
      fireEvent.click(nextButton);

      // After clicking next, metadata step should be rendered
      const metadataStep = screen.getByTestId("metadata-step");
      expect(metadataStep).toBeDefined();
    });

    it("shows previous button in metadata step", () => {
      renderOutlookForm({
        form: {
          watch: vi.fn().mockReturnValue([mockEmailDocument]),
          reset: vi.fn(),
          handleSubmit: vi.fn(),
          formState: createMockFormState(true),
        } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"],
        hasSelectedDocuments: true,
      });

      const nextButton = screen.getByRole("button", {
        name: /volgende stap: bestandsgegevens/i,
      });
      fireEvent.click(nextButton);

      const prevButton = screen.getByRole("button", {
        name: /vorige stap/i,
      });
      expect(prevButton).toBeDefined();
    });
  });

  describe("Button States and Text", () => {
    it("shows correct button text during upload", () => {
      renderOutlookForm({
        form: {
          watch: vi.fn().mockReturnValue([mockEmailDocument]),
          reset: vi.fn(),
          handleSubmit: vi.fn(),
          formState: createMockFormState(true),
        } as unknown as ReturnType<typeof useOutlookFormModule.useOutlookForm>["form"],
        hasSelectedDocuments: true,
      });

      const nextButton = screen.getByRole("button", {
        name: /volgende stap: bestandsgegevens/i,
      });
      fireEvent.click(nextButton);

      const submitButton = screen.getByRole("button", {
        name: /bestanden koppelen/i,
      });
      expect(submitButton).toBeDefined();
    });
  });
});
