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

describe("useOutlookForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessAndUploadDocuments.mockReset();
    mockPrepareSelectedDocuments.mockReset();
    mockPrepareSelectedDocuments.mockResolvedValue([]);
    mockGetAccessToken.mockReset();
    mockGetAccessToken.mockResolvedValue("dummy-token");
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
        id: mockEmailDocument.attachment.id,
        name: mockEmailDocument.attachment.name,
        size: mockEmailDocument.attachment.size,
      },
    ]);
    const { useOutlookForm } = await import("./useOutlookForm");
    const { result } = renderHook(() => useOutlookForm());
    const submitResult = await result.current.handleSubmit({ documents: [mockEmailDocument] });
    expect(mockProcessAndUploadDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        processedDocuments: [
          {
            id: mockEmailDocument.attachment.id,
            name: mockEmailDocument.attachment.name,
            size: mockEmailDocument.attachment.size,
          },
        ],
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
        id: mockAttachmentDocument1.attachment.id,
        name: mockAttachmentDocument1.attachment.name,
        size: mockAttachmentDocument1.attachment.size,
      },
    ]);
    const { useOutlookForm } = await import("./useOutlookForm");
    const { result } = renderHook(() => useOutlookForm());
    const submitResult = await result.current.handleSubmit({
      documents: [mockAttachmentDocument1],
    });
    expect(mockProcessAndUploadDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        processedDocuments: [
          {
            id: mockAttachmentDocument1.attachment.id,
            name: mockAttachmentDocument1.attachment.name,
            size: mockAttachmentDocument1.attachment.size,
          },
        ],
      })
    );
    expect(submitResult).toEqual({ error: null });
  });

  it("uploads two documents successfully", async () => {
    mockProcessAndUploadDocuments.mockResolvedValueOnce([
      {
        success: true,
        filename: mockAttachmentDocument1.attachment.name,
        size: mockAttachmentDocument1.attachment.size,
        duration: 100,
      },
      {
        success: true,
        filename: mockAttachmentDocument2.attachment.name,
        size: mockAttachmentDocument2.attachment.size,
        duration: 120,
      },
    ]);
    mockPrepareSelectedDocuments.mockResolvedValueOnce([
      {
        id: mockAttachmentDocument1.attachment.id,
        name: mockAttachmentDocument1.attachment.name,
        size: mockAttachmentDocument1.attachment.size,
      },
      {
        id: mockAttachmentDocument2.attachment.id,
        name: mockAttachmentDocument2.attachment.name,
        size: mockAttachmentDocument2.attachment.size,
      },
    ]);
    const { useOutlookForm } = await import("./useOutlookForm");
    const { result } = renderHook(() => useOutlookForm());
    const submitResult = await result.current.handleSubmit({
      documents: [mockEmailDocument, mockAttachmentDocument1, mockAttachmentDocument2],
    });
    expect(mockProcessAndUploadDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        processedDocuments: [
          {
            id: mockAttachmentDocument1.attachment.id,
            name: mockAttachmentDocument1.attachment.name,
            size: mockAttachmentDocument1.attachment.size,
          },
          {
            id: mockAttachmentDocument2.attachment.id,
            name: mockAttachmentDocument2.attachment.name,
            size: mockAttachmentDocument2.attachment.size,
          },
        ],
      })
    );
    expect(submitResult).toEqual({ error: null });
  });

  it("handles partial upload success", async () => {
    mockProcessAndUploadDocuments.mockResolvedValueOnce([
      {
        success: true,
        filename: mockAttachmentDocument1.attachment.name,
        size: mockAttachmentDocument1.attachment.size,
        duration: 100,
      },
      {
        success: false,
        filename: mockAttachmentDocument2.attachment.name,
        size: mockAttachmentDocument2.attachment.size,
        duration: 200,
        error: "Upload error",
      },
    ]);
    mockPrepareSelectedDocuments.mockResolvedValueOnce([
      {
        id: mockAttachmentDocument1.attachment.id,
        name: mockAttachmentDocument1.attachment.name,
        size: mockAttachmentDocument1.attachment.size,
      },
      {
        id: mockAttachmentDocument2.attachment.id,
        name: mockAttachmentDocument2.attachment.name,
        size: mockAttachmentDocument2.attachment.size,
      },
    ]);
    const { useOutlookForm } = await import("./useOutlookForm");
    const { result } = renderHook(() => useOutlookForm());
    const submitResult = await result.current.handleSubmit({
      documents: [mockEmailDocument, mockAttachmentDocument1, mockAttachmentDocument2],
    });
    expect(mockProcessAndUploadDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        processedDocuments: [
          {
            id: mockAttachmentDocument1.attachment.id,
            name: mockAttachmentDocument1.attachment.name,
            size: mockAttachmentDocument1.attachment.size,
          },
          {
            id: mockAttachmentDocument2.attachment.id,
            name: mockAttachmentDocument2.attachment.name,
            size: mockAttachmentDocument2.attachment.size,
          },
        ],
      })
    );
    expect(submitResult).toEqual({ error: new Error("Failed to process 1 documents") });
  });
});
