/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  mockAttachment1,
  mockEmailDocument,
  mockAttachmentDocument1,
  mockAttachmentDocument2,
} from "./mockDocuments";

const mockGetAccessToken = vi.fn();
const mockProcessAndUploadDocuments = vi.fn();
const mockPrepareSelectedDocuments = vi.fn().mockResolvedValue([]);
const mockAddDocumentToZaak = vi.fn();
const mockDispatchToast = vi.fn();
const mockDismissToast = vi.fn();
const mockShowUploadingToast = vi.fn();
const mockShowErrorToast = vi.fn();
const mockShowSuccessToast = vi.fn();
const mockShowGeneralErrorToast = vi.fn();

vi.mock("../../../../provider/AuthProvider", () => ({
  useAuth: () => ({ authService: { getAccessToken: mockGetAccessToken } }),
}));
vi.mock("../../../../provider/ZaakProvider", () => ({
  useZaak: () => ({ zaak: { data: { identificatie: "ZAAK-001" } } }),
}));
vi.mock("../../../../hooks/useOutlook", () => ({ useOutlook: () => ({ files: [] }) }));
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
    mutateAsync: mockAddDocumentToZaak,
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
  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessAndUploadDocuments.mockReset();
    mockPrepareSelectedDocuments.mockReset();
    mockAddDocumentToZaak.mockReset();
    mockDispatchToast.mockReset();
    mockDismissToast.mockReset();
    mockShowUploadingToast.mockReset();
    mockShowErrorToast.mockReset();
    mockShowSuccessToast.mockReset();
    mockShowGeneralErrorToast.mockReset();
    mockPrepareSelectedDocuments.mockResolvedValue([]);
    mockGetAccessToken.mockReset();
    mockGetAccessToken.mockResolvedValue("dummy-token");
    mockAddDocumentToZaak.mockResolvedValue([mockAttachmentDocument1]);
    // Office object has many props, not needed for mock
    (global as unknown as { Office: unknown }).Office = {
      context: {
        mailbox: {
          item: {} as unknown as Office.MessageRead,
        },
      },
    };
  });

  it("returns early if no documents are selected", async () => {
    const { useOutlookForm } = await import("./useOutlookForm");
    const { result } = renderHook(() => useOutlookForm());
    await waitFor(async () => {
      await result.current.handleSubmit({ documents: [] });
    });
    expect(mockProcessAndUploadDocuments).not.toHaveBeenCalled();
  });

  it("handles authentication failure", async () => {
    const { useOutlookForm } = await import("./useOutlookForm");
    const { result } = renderHook(() => useOutlookForm());
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
    const { result } = renderHook(() => useOutlookForm());
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
    const { result } = renderHook(() => useOutlookForm());
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
    const { result } = renderHook(() => useOutlookForm());
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
    const { result } = renderHook(() => useOutlookForm());
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
    mockAddDocumentToZaak.mockResolvedValueOnce([true, true, true]);
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
    const { result } = renderHook(() => useOutlookForm());
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
    mockAddDocumentToZaak
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
    const { result } = renderHook(() => useOutlookForm());
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
    expect(submitResult).toEqual({ error: new Error("Failed to upload 2 documents") });
  });

  describe("uploadStatus tracking", () => {
    it("sets uploadStatus to loading during upload", async () => {
      mockProcessAndUploadDocuments.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      mockPrepareSelectedDocuments.mockResolvedValueOnce([
        {
          ...mockEmailDocument,
          graphId: "graph-email-id",
          parentEmailGraphId: null,
        },
      ]);
      const { useOutlookForm } = await import("./useOutlookForm");
      const { result } = renderHook(() => useOutlookForm());

      const submitPromise = result.current.handleSubmit({ documents: [mockEmailDocument] });

      await waitFor(() => {
        expect(result.current.uploadStatus[mockEmailDocument.attachment.id]).toBe("loading");
        expect(result.current.isUploading).toBe(true);
      });

      await submitPromise;
    });

    it("sets uploadStatus to success after successful upload", async () => {
      mockProcessAndUploadDocuments.mockResolvedValueOnce([
        {
          success: true,
          filename: mockEmailDocument.attachment.name,
          size: mockEmailDocument.attachment.size,
          duration: 100,
          fileContent: new Uint8Array([1, 2, 3]),
        },
      ]);
      mockAddDocumentToZaak.mockResolvedValueOnce({ id: "info-object-1" });
      mockPrepareSelectedDocuments.mockResolvedValueOnce([
        {
          ...mockEmailDocument,
          graphId: "graph-email-id",
          parentEmailGraphId: null,
        },
      ]);
      const { useOutlookForm } = await import("./useOutlookForm");
      const { result } = renderHook(() => useOutlookForm());

      await waitFor(async () => {
        await result.current.handleSubmit({ documents: [mockEmailDocument] });
      });

      await waitFor(() => {
        expect(result.current.uploadStatus[mockEmailDocument.attachment.id]).toBe("success");
        expect(result.current.isUploading).toBe(false);
      });
    });

    it("sets uploadStatus to error after failed upload", async () => {
      mockProcessAndUploadDocuments.mockResolvedValueOnce([
        {
          success: true,
          filename: mockEmailDocument.attachment.name,
          size: mockEmailDocument.attachment.size,
          duration: 100,
          fileContent: new Uint8Array([1, 2, 3]),
        },
      ]);
      mockAddDocumentToZaak.mockRejectedValueOnce(new Error("Upload failed"));
      mockPrepareSelectedDocuments.mockResolvedValueOnce([
        {
          ...mockEmailDocument,
          graphId: "graph-email-id",
          parentEmailGraphId: null,
        },
      ]);
      const { useOutlookForm } = await import("./useOutlookForm");
      const { result } = renderHook(() => useOutlookForm());

      await waitFor(async () => {
        await result.current.handleSubmit({ documents: [mockEmailDocument] });
      });

      await waitFor(() => {
        expect(result.current.uploadStatus[mockEmailDocument.attachment.id]).toBe("error");
        expect(result.current.isUploading).toBe(false);
      });
    });

    it("tracks multiple file statuses independently", async () => {
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
      mockAddDocumentToZaak
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
      const { result } = renderHook(() => useOutlookForm());

      await waitFor(async () => {
        await result.current.handleSubmit({
          documents: [mockEmailDocument, mockAttachmentDocument1],
        });
      });

      await waitFor(() => {
        expect(result.current.uploadStatus[mockEmailDocument.attachment.id]).toBe("success");
        expect(result.current.uploadStatus[mockAttachmentDocument1.attachment.id]).toBe("error");
      });
    });
  });

  describe("uploaded email and attachments tracking", () => {
    it("sets uploadedEmail to true when email is uploaded", async () => {
      mockProcessAndUploadDocuments.mockResolvedValueOnce([
        {
          success: true,
          filename: mockEmailDocument.attachment.name,
          size: mockEmailDocument.attachment.size,
          duration: 100,
          fileContent: new Uint8Array([1, 2, 3]),
        },
      ]);
      mockAddDocumentToZaak.mockResolvedValueOnce({ id: "info-object-1" });
      mockPrepareSelectedDocuments.mockResolvedValueOnce([
        {
          ...mockEmailDocument,
          graphId: "graph-email-id",
          parentEmailGraphId: null,
        },
      ]);
      const { useOutlookForm } = await import("./useOutlookForm");
      const { result } = renderHook(() => useOutlookForm());

      await waitFor(async () => {
        await result.current.handleSubmit({ documents: [mockEmailDocument] });
      });

      await waitFor(() => {
        expect(result.current.uploadedEmail).toBe(true);
        expect(result.current.uploadedAttachments).toBe(0);
      });
    });

    it("sets uploadedAttachments count when attachments are uploaded", async () => {
      mockProcessAndUploadDocuments.mockResolvedValueOnce([
        {
          success: true,
          filename: mockAttachmentDocument1.attachment.name,
          size: mockAttachmentDocument1.attachment.size,
          duration: 100,
          fileContent: new Uint8Array([1, 2, 3]),
        },
        {
          success: true,
          filename: mockAttachmentDocument2.attachment.name,
          size: mockAttachmentDocument2.attachment.size,
          duration: 100,
          fileContent: new Uint8Array([4, 5, 6]),
        },
      ]);
      mockAddDocumentToZaak
        .mockResolvedValueOnce({ id: "info-object-1" })
        .mockResolvedValueOnce({ id: "info-object-2" });
      mockPrepareSelectedDocuments.mockResolvedValueOnce([
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
      const { result } = renderHook(() => useOutlookForm());

      await waitFor(async () => {
        await result.current.handleSubmit({
          documents: [mockAttachmentDocument1, mockAttachmentDocument2],
        });
      });

      await waitFor(() => {
        expect(result.current.uploadedEmail).toBe(false);
        expect(result.current.uploadedAttachments).toBe(2);
      });
    });

    it("tracks both email and attachments correctly", async () => {
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
      mockAddDocumentToZaak
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
      const { result } = renderHook(() => useOutlookForm());

      await waitFor(async () => {
        await result.current.handleSubmit({
          documents: [mockEmailDocument, mockAttachmentDocument1],
        });
      });

      await waitFor(() => {
        expect(result.current.uploadedEmail).toBe(true);
        expect(result.current.uploadedAttachments).toBe(1);
      });
    });
  });

  describe("resetUploadState", () => {
    it("clears uploadStatus, uploadedEmail, and uploadedAttachments", async () => {
      mockProcessAndUploadDocuments.mockResolvedValueOnce([
        {
          success: true,
          filename: mockEmailDocument.attachment.name,
          size: mockEmailDocument.attachment.size,
          duration: 100,
          fileContent: new Uint8Array([1, 2, 3]),
        },
      ]);
      mockAddDocumentToZaak.mockResolvedValueOnce({ id: "info-object-1" });
      mockPrepareSelectedDocuments.mockResolvedValueOnce([
        {
          ...mockEmailDocument,
          graphId: "graph-email-id",
          parentEmailGraphId: null,
        },
      ]);
      const { useOutlookForm } = await import("./useOutlookForm");
      const { result } = renderHook(() => useOutlookForm());

      await waitFor(async () => {
        await result.current.handleSubmit({ documents: [mockEmailDocument] });
      });

      await waitFor(() => {
        expect(result.current.uploadStatus[mockEmailDocument.attachment.id]).toBe("success");
        expect(result.current.uploadedEmail).toBe(true);
      });

      result.current.resetUploadState();

      await waitFor(() => {
        expect(result.current.uploadStatus).toEqual({});
        expect(result.current.uploadedEmail).toBeUndefined();
        expect(result.current.uploadedAttachments).toBeUndefined();
      });
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
      mockAddDocumentToZaak.mockResolvedValueOnce({ id: "info-object-1" });
      mockPrepareSelectedDocuments.mockResolvedValueOnce([
        {
          ...mockEmailDocument,
          graphId: "graph-email-id",
          parentEmailGraphId: null,
        },
      ]);
      const { useOutlookForm } = await import("./useOutlookForm");
      const { result } = renderHook(() => useOutlookForm());

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
      mockAddDocumentToZaak
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
      const { result } = renderHook(() => useOutlookForm());

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
      mockAddDocumentToZaak
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
      const { result } = renderHook(() => useOutlookForm());

      await waitFor(async () => {
        await result.current.handleSubmit({
          documents: [mockEmailDocument, mockAttachmentDocument1],
        });
      });

      expect(mockShowErrorToast).toHaveBeenCalledWith(1, 2);
    });

    it("calls showGeneralErrorToast when upload process fails", async () => {
      const authError = new Error("Auth error");
      mockGetAccessToken.mockRejectedValueOnce(authError);
      const { useOutlookForm } = await import("./useOutlookForm");
      const { result } = renderHook(() => useOutlookForm());

      await waitFor(async () => {
        await result.current.handleSubmit({ documents: [mockEmailDocument] });
      });

      expect(mockShowGeneralErrorToast).toHaveBeenCalledWith(authError);
    });
  });
});
