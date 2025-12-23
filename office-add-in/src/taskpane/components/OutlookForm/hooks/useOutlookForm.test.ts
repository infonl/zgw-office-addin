/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  mockAttachment1,
  mockAttachment2,
  mockEmailDocument,
  mockAttachmentDocument1,
  mockAttachmentDocument2,
  mockZaakData as mockZaakDataImport,
} from "./mockDocuments";

const mockGetAccessToken = vi.fn();
const mockProcessAndUploadDocuments = vi.fn();
const mockPrepareSelectedDocuments = vi.fn().mockResolvedValue([]);
const mockMutateAsync = vi.fn();
const mockDispatchToast = vi.fn();
const mockDismissToast = vi.fn();
const mockShowUploadingToast = vi.fn();
const mockShowErrorToast = vi.fn();
const mockShowSuccessToast = vi.fn();
const mockShowGeneralErrorToast = vi.fn();

let mockZaakData = mockZaakDataImport;

const mockUseZaak = vi.fn(() => ({ zaak: { data: mockZaakData } }));
const mockUseOutlook = vi.fn(() => ({ files: [] as Office.AttachmentDetails[] }));

vi.mock("../../../../provider/AuthProvider", () => ({
  useAuth: () => ({ authService: { getAccessToken: mockGetAccessToken } }),
}));
vi.mock("../../../../provider/ZaakProvider", () => ({
  useZaak: mockUseZaak,
}));
vi.mock("../../../../hooks/useOutlook", () => ({ useOutlook: mockUseOutlook }));
vi.mock("../../../../hooks/useLogger", () => ({
  useLogger: () => ({ DEBUG: vi.fn(), WARN: vi.fn(), ERROR: vi.fn() }),
}));
vi.mock("../../../../utils/prepareSelectedDocuments", () => ({
  prepareSelectedDocuments: mockPrepareSelectedDocuments,
}));
vi.mock("../../../../hooks/useOffice", () => ({
  useOffice: () => ({ processAndUploadDocuments: mockProcessAndUploadDocuments }),
}));
vi.mock("../../../../hooks/useAddDocumentToZaak", () => ({
  useAddDocumentToZaak: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));
vi.mock("../../../../provider/ToastProvider", () => ({
  useToast: () => ({
    dispatchToast: mockDispatchToast,
    dismissToast: mockDismissToast,
  }),
}));
vi.mock("./useUploadToasts", () => ({
  useUploadToasts: () => ({
    showUploadingToast: mockShowUploadingToast,
    showErrorToast: mockShowErrorToast,
    showSuccessToast: mockShowSuccessToast,
    showGeneralErrorToast: mockShowGeneralErrorToast,
  }),
}));

describe("useOutlookForm", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.clearAllMocks();
    mockProcessAndUploadDocuments.mockReset();
    mockPrepareSelectedDocuments.mockReset();
    mockMutateAsync.mockReset();
    mockDispatchToast.mockReset();
    mockDismissToast.mockReset();
    mockShowUploadingToast.mockReset();
    mockShowErrorToast.mockReset();
    mockShowSuccessToast.mockReset();
    mockShowGeneralErrorToast.mockReset();
    mockPrepareSelectedDocuments.mockResolvedValue([]);
    mockGetAccessToken.mockReset();
    mockGetAccessToken.mockResolvedValue("dummy-token");
    mockMutateAsync.mockResolvedValue({ id: "info-object-1" });
    mockZaakData = mockZaakDataImport;
    mockUseZaak.mockReturnValue({ zaak: { data: mockZaakData } });
    mockUseOutlook.mockReturnValue({ files: [] });
    // Office object has many props, not needed for mock
    (global as unknown as { Office: unknown }).Office = {
      context: {
        mailbox: {
          item: {} as unknown as Office.MessageRead,
        },
      },
    };
  });

  const renderWithQueryClient = <T>(hook: () => T) => {
    return renderHook(hook, {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });
  };

  it("returns early if no documents are selected", async () => {
    const { useOutlookForm } = await import("./useOutlookForm");
    const { result } = renderWithQueryClient(() => useOutlookForm());
    await waitFor(async () => {
      await result.current.handleSubmit({ documents: [] });
    });
    expect(mockProcessAndUploadDocuments).not.toHaveBeenCalled();
  });

  it("handles authentication failure", async () => {
    const { useOutlookForm } = await import("./useOutlookForm");
    const { result } = renderWithQueryClient(() => useOutlookForm());
    mockGetAccessToken.mockRejectedValueOnce(new Error("Auth error"));
    const submitResult = await waitFor(async () => {
      return await result.current.handleSubmit({ documents: [mockEmailDocument] });
    });
    expect(submitResult.error).toBeInstanceOf(Error);
    expect(submitResult.error?.message).toBe("Auth error");
  });

  it("handles document graph id retrieval failure", async () => {
    mockPrepareSelectedDocuments.mockRejectedValueOnce(new Error("Prepare error"));
    const { useOutlookForm } = await import("./useOutlookForm");
    const { result } = renderWithQueryClient(() => useOutlookForm());
    const submitResult = await waitFor(async () => {
      return await result.current.handleSubmit({ documents: [mockEmailDocument] });
    });
    expect(submitResult.error).toBeInstanceOf(Error);
    expect(submitResult.error?.message).toBe("Prepare error");
  });

  it("handles upload failure", async () => {
    mockProcessAndUploadDocuments.mockRejectedValueOnce(new Error("Upload error"));
    mockPrepareSelectedDocuments.mockResolvedValueOnce([
      {
        id: mockAttachment1.id,
        name: mockAttachment1.name,
        size: mockAttachment1.size,
        fileContent: new Uint8Array(),
      },
    ]);
    const { useOutlookForm } = await import("./useOutlookForm");
    const { result } = renderWithQueryClient(() => useOutlookForm());
    const submitResult = await waitFor(async () => {
      return await result.current.handleSubmit({ documents: [mockEmailDocument] });
    });
    expect(submitResult.error).toBeInstanceOf(Error);
    expect(submitResult.error?.message).toBe("Upload error");
    expect(mockProcessAndUploadDocuments).toHaveBeenCalled();
  });

  it("uploads eml successfully", async () => {
    mockProcessAndUploadDocuments.mockResolvedValueOnce([
      {
        success: true,
        filename: mockEmailDocument.attachment.name,
        size: mockEmailDocument.attachment.size,
        duration: 100,
      },
    ]);
    mockPrepareSelectedDocuments.mockResolvedValueOnce([
      {
        ...mockEmailDocument,
        graphId: "graph-email-id",
        parentEmailGraphId: null,
      },
    ]);
    const { useOutlookForm } = await import("./useOutlookForm");
    const { result } = renderWithQueryClient(() => useOutlookForm());
    const submitResult = await waitFor(async () => {
      return await result.current.handleSubmit({ documents: [mockEmailDocument] });
    });
    expect(mockProcessAndUploadDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        processedDocuments: expect.arrayContaining([
          expect.objectContaining({
            attachment: expect.objectContaining({
              id: mockEmailDocument.attachment.id,
              name: mockEmailDocument.attachment.name,
              size: mockEmailDocument.attachment.size,
            }),
            graphId: "graph-email-id",
            parentEmailGraphId: null,
          }),
        ]),
        zaak: expect.objectContaining({
          data: expect.objectContaining({
            identificatie: "ZAAK-001",
          }),
        }),
        graphService: expect.any(Object),
      })
    );
    expect(submitResult).toEqual({ error: null });
  });

  it("uploads attachment document successfully", async () => {
    mockProcessAndUploadDocuments.mockResolvedValueOnce([
      {
        success: true,
        filename: mockAttachmentDocument1.attachment.name,
        size: mockAttachmentDocument1.attachment.size,
        duration: 100,
      },
    ]);
    mockPrepareSelectedDocuments.mockResolvedValueOnce([
      {
        ...mockAttachmentDocument1,
        graphId: "graph-attachment-id",
        parentEmailGraphId: "graph-email-id",
      },
    ]);
    const { useOutlookForm } = await import("./useOutlookForm");
    const { result } = renderWithQueryClient(() => useOutlookForm());
    const submitResult = await result.current.handleSubmit({
      documents: [mockAttachmentDocument1],
    });
    expect(mockProcessAndUploadDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        processedDocuments: expect.arrayContaining([
          expect.objectContaining({
            attachment: expect.objectContaining({
              id: mockAttachmentDocument1.attachment.id,
              name: mockAttachmentDocument1.attachment.name,
              size: mockAttachmentDocument1.attachment.size,
            }),
            graphId: "graph-attachment-id",
            parentEmailGraphId: "graph-email-id",
          }),
        ]),
        zaak: expect.objectContaining({
          data: expect.objectContaining({
            identificatie: "ZAAK-001",
          }),
        }),
        graphService: expect.any(Object),
      })
    );
    expect(submitResult).toEqual({ error: null });
  });

  it("uploads two documents successfully", async () => {
    mockProcessAndUploadDocuments.mockResolvedValueOnce([
      {
        success: true,
        filename: mockEmailDocument.attachment.name,
        size: mockEmailDocument.attachment.size,
        duration: 100,
        fileContent: new Uint8Array([1, 2, 3]),
      },
      {
        success: true,
        filename: mockAttachmentDocument1.attachment.name,
        size: mockAttachmentDocument1.attachment.size,
        duration: 100,
        fileContent: new Uint8Array([4, 5, 6]),
      },
      {
        success: true,
        filename: mockAttachmentDocument2.attachment.name,
        size: mockAttachmentDocument2.attachment.size,
        duration: 120,
        fileContent: new Uint8Array([7, 8, 9]),
      },
    ]);
    mockMutateAsync.mockResolvedValueOnce([true, true, true]);
    mockPrepareSelectedDocuments.mockResolvedValueOnce([
      {
        ...mockEmailDocument,
        graphId: "graph-email-id",
        parentEmailGraphId: null,
      },
      {
        ...mockAttachmentDocument1,
        graphId: "graph-attachment-1-id",
        parentEmailGraphId: "graph-email-id",
      },
      {
        ...mockAttachmentDocument2,
        graphId: "graph-attachment-2-id",
        parentEmailGraphId: "graph-email-id",
      },
    ]);
    const { useOutlookForm } = await import("./useOutlookForm");
    const { result } = renderWithQueryClient(() => useOutlookForm());
    const submitResult = await result.current.handleSubmit({
      documents: [mockEmailDocument, mockAttachmentDocument1, mockAttachmentDocument2],
    });
    expect(mockProcessAndUploadDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        processedDocuments: expect.arrayContaining([
          expect.objectContaining({
            attachment: expect.objectContaining({
              id: mockEmailDocument.attachment.id,
              name: mockEmailDocument.attachment.name,
              size: mockEmailDocument.attachment.size,
            }),
            graphId: "graph-email-id",
            parentEmailGraphId: null,
          }),
          expect.objectContaining({
            attachment: expect.objectContaining({
              id: mockAttachmentDocument1.attachment.id,
              name: mockAttachmentDocument1.attachment.name,
              size: mockAttachmentDocument1.attachment.size,
            }),
            graphId: "graph-attachment-1-id",
            parentEmailGraphId: "graph-email-id",
          }),
          expect.objectContaining({
            attachment: expect.objectContaining({
              id: mockAttachmentDocument2.attachment.id,
              name: mockAttachmentDocument2.attachment.name,
              size: mockAttachmentDocument2.attachment.size,
            }),
            graphId: "graph-attachment-2-id",
            parentEmailGraphId: "graph-email-id",
          }),
        ]),
        zaak: expect.objectContaining({
          data: expect.objectContaining({
            identificatie: "ZAAK-001",
          }),
        }),
        graphService: expect.any(Object),
      })
    );
    expect(submitResult).toEqual({ error: null });
  });

  it("handles partial upload success", async () => {
    mockProcessAndUploadDocuments.mockResolvedValueOnce([
      {
        success: true,
        filename: mockEmailDocument.attachment.name,
        size: mockEmailDocument.attachment.size,
        duration: 100,
        fileContent: new Uint8Array([1, 2, 3]),
      },
      {
        success: true,
        filename: mockAttachmentDocument1.attachment.name,
        size: mockAttachmentDocument1.attachment.size,
        duration: 100,
        fileContent: new Uint8Array([4, 5, 6]),
      },
      {
        success: true,
        filename: mockAttachmentDocument2.attachment.name,
        size: mockAttachmentDocument2.attachment.size,
        duration: 200,
        fileContent: new Uint8Array([7, 8, 9]),
      },
    ]);
    mockMutateAsync
      .mockResolvedValueOnce({
        id: "info-object-1",
        titel: mockEmailDocument.attachment.name,
        // add other required ZaakInformatieObject fields
      })
      .mockRejectedValueOnce(new Error("Upload failed"))
      .mockRejectedValueOnce(new Error("Upload failed"));

    mockPrepareSelectedDocuments.mockResolvedValueOnce([
      {
        id: mockEmailDocument.attachment.id,
        name: mockEmailDocument.attachment.name,
        size: mockEmailDocument.attachment.size,
        fileContent: new Uint8Array(),
        attachment: mockEmailDocument.attachment,
      },
      {
        id: mockAttachmentDocument1.attachment.id,
        name: mockAttachmentDocument1.attachment.name,
        size: mockAttachmentDocument1.attachment.size,
        fileContent: new Uint8Array(),
        attachment: mockAttachmentDocument1.attachment,
      },
      {
        id: mockAttachmentDocument2.attachment.id,
        name: mockAttachmentDocument2.attachment.name,
        size: mockAttachmentDocument2.attachment.size,
        fileContent: new Uint8Array(),
        attachment: mockAttachmentDocument2.attachment,
      },
    ]);
    const { useOutlookForm } = await import("./useOutlookForm");
    const { result } = renderWithQueryClient(() => useOutlookForm());
    const submitResult = await waitFor(async () => {
      return await result.current.handleSubmit({
        documents: [mockEmailDocument, mockAttachmentDocument1, mockAttachmentDocument2],
      });
    });
    expect(mockProcessAndUploadDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        processedDocuments: expect.arrayContaining([
          expect.objectContaining({
            id: mockAttachmentDocument1.attachment.id,
            name: mockAttachmentDocument1.attachment.name,
            size: mockAttachmentDocument1.attachment.size,
            fileContent: expect.any(Uint8Array),
            attachment: expect.any(Object),
          }),
          expect.objectContaining({
            id: mockAttachmentDocument2.attachment.id,
            name: mockAttachmentDocument2.attachment.name,
            size: mockAttachmentDocument2.attachment.size,
            fileContent: expect.any(Uint8Array),
            attachment: expect.any(Object),
          }),
        ]),
        zaak: expect.any(Object),
        graphService: expect.any(Object),
      })
    );
    expect(submitResult).toEqual({ error: expect.any(Error) });
    expect(mockShowErrorToast).toHaveBeenCalledWith(2, 3);
  });

  describe("mutation tracking via useMutationState", () => {
    it("calls mutateAsync with the document payload", async () => {
      mockProcessAndUploadDocuments.mockResolvedValueOnce([
        {
          success: true,
          filename: mockEmailDocument.attachment.name,
          size: mockEmailDocument.attachment.size,
          duration: 100,
          fileContent: new Uint8Array([1, 2, 3]),
        },
      ]);
      mockPrepareSelectedDocuments.mockResolvedValueOnce([
        {
          ...mockEmailDocument,
          graphId: "graph-email-id",
          parentEmailGraphId: null,
        },
      ]);
      mockMutateAsync.mockResolvedValueOnce({ id: "info-object-1" });

      const { useOutlookForm } = await import("./useOutlookForm");
      const { result } = renderWithQueryClient(() => useOutlookForm());

      await waitFor(async () => {
        await result.current.handleSubmit({ documents: [mockEmailDocument] });
      });

      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          attachment: expect.objectContaining({
            id: mockEmailDocument.attachment.id,
            name: mockEmailDocument.attachment.name,
          }),
        })
      );
    });

    it("tracks multiple file uploads independently", async () => {
      mockProcessAndUploadDocuments.mockResolvedValueOnce([
        {
          success: true,
          filename: mockEmailDocument.attachment.name,
          size: mockEmailDocument.attachment.size,
          duration: 100,
          fileContent: new Uint8Array([1, 2, 3]),
        },
        {
          success: true,
          filename: mockAttachmentDocument1.attachment.name,
          size: mockAttachmentDocument1.attachment.size,
          duration: 100,
          fileContent: new Uint8Array([4, 5, 6]),
        },
      ]);
      mockMutateAsync
        .mockResolvedValueOnce({ id: "info-object-1" })
        .mockRejectedValueOnce(new Error("Upload failed"));
      mockPrepareSelectedDocuments.mockResolvedValueOnce([
        {
          ...mockEmailDocument,
          graphId: "graph-email-id",
          parentEmailGraphId: null,
        },
        {
          ...mockAttachmentDocument1,
          graphId: "graph-attachment-id",
          parentEmailGraphId: "graph-email-id",
        },
      ]);
      const { useOutlookForm } = await import("./useOutlookForm");
      const { result } = renderWithQueryClient(() => useOutlookForm());

      await waitFor(async () => {
        await result.current.handleSubmit({
          documents: [mockEmailDocument, mockAttachmentDocument1],
        });
      });

      // Verify mutateAsync was called for both documents (independent tracking)
      expect(mockMutateAsync).toHaveBeenCalledTimes(2);
      expect(mockShowErrorToast).toHaveBeenCalledWith(1, 2);
    });
  });

  describe("toast integration", () => {
    it("calls showUploadingToast when upload starts", async () => {
      mockProcessAndUploadDocuments.mockResolvedValueOnce([
        {
          success: true,
          filename: mockEmailDocument.attachment.name,
          size: mockEmailDocument.attachment.size,
          duration: 100,
          fileContent: new Uint8Array([1, 2, 3]),
        },
      ]);
      mockMutateAsync.mockResolvedValueOnce({ id: "info-object-1" });
      mockPrepareSelectedDocuments.mockResolvedValueOnce([
        {
          ...mockEmailDocument,
          graphId: "graph-email-id",
          parentEmailGraphId: null,
        },
      ]);
      const { useOutlookForm } = await import("./useOutlookForm");
      const { result } = renderWithQueryClient(() => useOutlookForm());

      await waitFor(async () => {
        await result.current.handleSubmit({ documents: [mockEmailDocument] });
      });

      expect(mockShowUploadingToast).toHaveBeenCalledWith(1, "ZAAK-001");
    });

    it("calls showSuccessToast after successful upload", async () => {
      mockProcessAndUploadDocuments.mockResolvedValueOnce([
        {
          success: true,
          filename: mockEmailDocument.attachment.name,
          size: mockEmailDocument.attachment.size,
          duration: 100,
          fileContent: new Uint8Array([1, 2, 3]),
        },
        {
          success: true,
          filename: mockAttachmentDocument1.attachment.name,
          size: mockAttachmentDocument1.attachment.size,
          duration: 100,
          fileContent: new Uint8Array([4, 5, 6]),
        },
      ]);
      mockMutateAsync
        .mockResolvedValueOnce({ id: "info-object-1" })
        .mockResolvedValueOnce({ id: "info-object-2" });
      mockPrepareSelectedDocuments.mockResolvedValueOnce([
        {
          ...mockEmailDocument,
          graphId: "graph-email-id",
          parentEmailGraphId: null,
        },
        {
          ...mockAttachmentDocument1,
          graphId: "graph-attachment-id",
          parentEmailGraphId: "graph-email-id",
        },
      ]);
      const { useOutlookForm } = await import("./useOutlookForm");
      const { result } = renderWithQueryClient(() => useOutlookForm());

      await waitFor(async () => {
        await result.current.handleSubmit({
          documents: [mockEmailDocument, mockAttachmentDocument1],
        });
      });

      expect(mockShowSuccessToast).toHaveBeenCalledWith(true, 1);
    });

    it("calls showErrorToast when some uploads fail", async () => {
      mockProcessAndUploadDocuments.mockResolvedValueOnce([
        {
          success: true,
          filename: mockEmailDocument.attachment.name,
          size: mockEmailDocument.attachment.size,
          duration: 100,
          fileContent: new Uint8Array([1, 2, 3]),
        },
        {
          success: true,
          filename: mockAttachmentDocument1.attachment.name,
          size: mockAttachmentDocument1.attachment.size,
          duration: 100,
          fileContent: new Uint8Array([4, 5, 6]),
        },
      ]);
      mockMutateAsync
        .mockResolvedValueOnce({ id: "info-object-1" })
        .mockRejectedValueOnce(new Error("Upload failed"));
      mockPrepareSelectedDocuments.mockResolvedValueOnce([
        {
          ...mockEmailDocument,
          graphId: "graph-email-id",
          parentEmailGraphId: null,
        },
        {
          ...mockAttachmentDocument1,
          graphId: "graph-attachment-id",
          parentEmailGraphId: "graph-email-id",
        },
      ]);
      const { useOutlookForm } = await import("./useOutlookForm");
      const { result } = renderWithQueryClient(() => useOutlookForm());

      await waitFor(async () => {
        await result.current.handleSubmit({
          documents: [mockEmailDocument, mockAttachmentDocument1],
        });
      });

      expect(mockShowErrorToast).toHaveBeenCalledWith(1, 2);
    });

    it("calls showGeneralErrorToast when upload process fails", async () => {
      mockGetAccessToken.mockRejectedValueOnce(new Error("Auth error"));
      const { useOutlookForm } = await import("./useOutlookForm");
      const { result } = renderWithQueryClient(() => useOutlookForm());

      await waitFor(async () => {
        await result.current.handleSubmit({ documents: [mockEmailDocument] });
      });

      expect(mockShowGeneralErrorToast).toHaveBeenCalled();
    });
  });

  describe("vertrouwelijkheidaanduiding management", () => {
    it("applies zaak vertrouwelijkheidaanduiding to all documents on initialization", async () => {
      mockUseOutlook.mockReturnValue({
        files: [mockAttachment1, mockAttachment2] as Office.AttachmentDetails[],
      });

      const { useOutlookForm } = await import("./useOutlookForm");
      const { result } = renderWithQueryClient(() => useOutlookForm());

      await waitFor(() => {
        const documents = result.current.form.getValues("documents");
        expect(documents.length).toBeGreaterThan(0);
      });

      const documents = result.current.form.getValues("documents");
      documents.forEach((doc) => {
        expect(doc.vertrouwelijkheidaanduiding).toBe("intern");
      });
    });

    it("ignores invalid vertrouwelijkheidaanduiding values from zaak", async () => {
      mockUseOutlook.mockReturnValue({ files: [mockAttachment1] });

      mockZaakData = {
        ...mockZaakData,
        vertrouwelijkheidaanduiding: "invalid_value" as "intern",
      };
      mockUseZaak.mockReturnValue({ zaak: { data: mockZaakData } });

      const { useOutlookForm } = await import("./useOutlookForm");
      const { result } = renderWithQueryClient(() => useOutlookForm());

      await waitFor(() => {
        expect(result.current.form.getValues("documents")).toBeDefined();
      });

      const documents = result.current.form.getValues("documents");

      expect(documents[0].vertrouwelijkheidaanduiding).toBe("openbaar");
    });
  });
});
