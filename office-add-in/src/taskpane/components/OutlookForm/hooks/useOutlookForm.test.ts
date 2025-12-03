/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
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

describe("useOutlookForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessAndUploadDocuments.mockReset();
    mockPrepareSelectedDocuments.mockReset();
    mockAddDocumentToZaak.mockReset();
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
    await result.current.handleSubmit({ documents: [] });
    expect(mockProcessAndUploadDocuments).not.toHaveBeenCalled();
  });

  it("handles authentication failure", async () => {
    const { useOutlookForm } = await import("./useOutlookForm");
    const { result } = renderHook(() => useOutlookForm());
    mockGetAccessToken.mockRejectedValueOnce(new Error("Auth error"));
    const submitResult = await result.current.handleSubmit({ documents: [mockEmailDocument] });
    expect(submitResult.error).toBeInstanceOf(Error);
    expect(submitResult.error?.message).toBe("Auth error");
  });

  it("handles document graph id retrieval failure", async () => {
    mockPrepareSelectedDocuments.mockRejectedValueOnce(new Error("Prepare error"));
    const { useOutlookForm } = await import("./useOutlookForm");
    const { result } = renderHook(() => useOutlookForm());
    const submitResult = await result.current.handleSubmit({ documents: [mockEmailDocument] });
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
    const submitResult = await result.current.handleSubmit({ documents: [mockEmailDocument] });
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
    const submitResult = await result.current.handleSubmit({ documents: [mockEmailDocument] });
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
    const submitResult = await result.current.handleSubmit({
      documents: [mockEmailDocument, mockAttachmentDocument1, mockAttachmentDocument2],
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
});
