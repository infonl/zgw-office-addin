/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMutationState } from "@tanstack/react-query";
import { useUploadStatus } from "./useUploadStatus";
import type { DocumentSchema } from "../../../../hooks/types";

vi.mock("@tanstack/react-query", () => ({
  useMutationState: vi.fn(),
}));

type MockMutationState = {
  status: "pending" | "success" | "error";
  variables?: { attachment?: { id?: string } };
};

const mockUseMutationState = (states: MockMutationState[] = []) => {
  (useMutationState as ReturnType<typeof vi.fn>).mockReturnValue(states);
};

const createMockDocument = (
  id: string,
  selected: boolean = true,
  attachmentType: "item" | "file" = "file"
): DocumentSchema => {
  const baseDoc = {
    selected,
    attachment: {
      id,
      name: `test-${id}`,
      type: "text/plain",
      size: 1024,
      attachmentType,
    } as unknown as Office.AttachmentDetails,
  };

  if (selected) {
    return {
      ...baseDoc,
      selected: true,
      auteur: "Test User",
      creatiedatum: new Date(),
      informatieobjecttype: "http://example.com/type",
      status: "definitief" as const,
      vertrouwelijkheidaanduiding: "openbaar",
      titel: `Document ${id}`,
      inhoud: "Test content",
      zaakidentificatie: "test-zaak-123",
    } as DocumentSchema;
  }

  return baseDoc as DocumentSchema;
};

describe("useUploadStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial state with no mutations", () => {
    mockUseMutationState([]);

    const selectedDocuments = [createMockDocument("1")];
    const { result } = renderHook(() => useUploadStatus({ selectedDocuments }));

    expect(result.current.selectedDocumentIds).toEqual(["1"]);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadComplete).toBe(false);
    expect(result.current.activeMutations.size).toBe(0);
    expect(result.current.completedIds.size).toBe(0);
    expect(result.current.failedIds.size).toBe(0);
  });

  it("should track pending mutations as uploading", () => {
    mockUseMutationState([
      {
        status: "pending",
        variables: { attachment: { id: "1" } },
      },
    ]);

    const selectedDocuments = [createMockDocument("1")];
    const { result } = renderHook(() => useUploadStatus({ selectedDocuments }));

    expect(result.current.isUploading).toBe(true);
    expect(result.current.uploadComplete).toBe(false);
    expect(result.current.activeMutations.has("1")).toBe(true);
  });

  it("should track successful mutations", () => {
    mockUseMutationState([
      {
        status: "success",
        variables: { attachment: { id: "1" } },
      },
    ]);

    const selectedDocuments = [createMockDocument("1")];
    const { result } = renderHook(() => useUploadStatus({ selectedDocuments }));

    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadComplete).toBe(true);
    expect(result.current.completedIds.has("1")).toBe(true);
    expect(result.current.uploadSuccess).toBe(true);
    expect(result.current.uploadError).toBe(false);
  });

  it("should track failed mutations", () => {
    mockUseMutationState([
      {
        status: "error",
        variables: { attachment: { id: "1" } },
      },
    ]);

    const selectedDocuments = [createMockDocument("1")];
    const { result } = renderHook(() => useUploadStatus({ selectedDocuments }));

    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadComplete).toBe(true);
    expect(result.current.failedIds.has("1")).toBe(true);
    expect(result.current.uploadError).toBe(true);
    expect(result.current.uploadSuccess).toBe(false);
    expect(result.current.errorCount).toBe(1);
  });

  it("should only count selected documents in mutation filtering", () => {
    mockUseMutationState([
      {
        status: "success",
        variables: { attachment: { id: "1" } },
      },
      {
        status: "success",
        variables: { attachment: { id: "2" } },
      },
    ]);

    const selectedDocuments = [createMockDocument("1")];
    const { result } = renderHook(() => useUploadStatus({ selectedDocuments }));

    expect(result.current.completedIds.size).toBe(1);
    expect(result.current.completedIds.has("1")).toBe(true);
    expect(result.current.completedIds.has("2")).toBe(false);
  });

  it("should require all selected documents to complete upload", () => {
    mockUseMutationState([
      {
        status: "success",
        variables: { attachment: { id: "1" } },
      },
    ]);

    const selectedDocuments = [createMockDocument("1"), createMockDocument("2")];
    const { result } = renderHook(() => useUploadStatus({ selectedDocuments }));

    expect(result.current.uploadComplete).toBe(false);
  });

  it("should mark upload as complete when all documents succeed", () => {
    mockUseMutationState([
      {
        status: "success",
        variables: { attachment: { id: "1" } },
      },
      {
        status: "success",
        variables: { attachment: { id: "2" } },
      },
    ]);

    const selectedDocuments = [createMockDocument("1"), createMockDocument("2")];
    const { result } = renderHook(() => useUploadStatus({ selectedDocuments }));

    expect(result.current.uploadComplete).toBe(true);
  });

  it("should mark upload as complete when all documents finish (success or error)", () => {
    mockUseMutationState([
      {
        status: "success",
        variables: { attachment: { id: "1" } },
      },
      {
        status: "error",
        variables: { attachment: { id: "2" } },
      },
    ]);

    const selectedDocuments = [createMockDocument("1"), createMockDocument("2")];
    const { result } = renderHook(() => useUploadStatus({ selectedDocuments }));

    expect(result.current.uploadComplete).toBe(true);
    expect(result.current.uploadSuccess).toBe(false);
    expect(result.current.uploadError).toBe(true);
  });

  it("should count uploaded emails separately", () => {
    mockUseMutationState([
      {
        status: "success",
        variables: { attachment: { id: "1" } },
      },
      {
        status: "success",
        variables: { attachment: { id: "2" } },
      },
    ]);

    const selectedDocuments = [
      createMockDocument("1", true, "item"),
      createMockDocument("2", true, "file"),
    ];
    const { result } = renderHook(() => useUploadStatus({ selectedDocuments }));

    expect(result.current.uploadedEmail).toBe(true);
    expect(result.current.uploadedAttachments).toBe(1);
  });

  it("should not count uploaded items when upload incomplete", () => {
    mockUseMutationState([
      {
        status: "pending",
        variables: { attachment: { id: "1" } },
      },
    ]);

    const selectedDocuments = [createMockDocument("1", true, "item")];
    const { result } = renderHook(() => useUploadStatus({ selectedDocuments }));

    expect(result.current.uploadedEmail).toBe(false);
    expect(result.current.uploadedAttachments).toBe(0);
  });

  it("should handle empty selected documents", () => {
    mockUseMutationState([]);

    const selectedDocuments: DocumentSchema[] = [];
    const { result } = renderHook(() => useUploadStatus({ selectedDocuments }));

    expect(result.current.uploadComplete).toBe(false);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.errorCount).toBe(0);
  });

  it("should handle mutations without attachment id", () => {
    mockUseMutationState([
      {
        status: "success",
        variables: { attachment: {} },
      },
    ]);

    const selectedDocuments = [createMockDocument("1")];
    const { result } = renderHook(() => useUploadStatus({ selectedDocuments }));

    expect(result.current.completedIds.size).toBe(0);
    expect(result.current.uploadComplete).toBe(false);
  });

  it("should handle multiple failures correctly", () => {
    mockUseMutationState([
      {
        status: "error",
        variables: { attachment: { id: "1" } },
      },
      {
        status: "error",
        variables: { attachment: { id: "2" } },
      },
    ]);

    const selectedDocuments = [createMockDocument("1"), createMockDocument("2")];
    const { result } = renderHook(() => useUploadStatus({ selectedDocuments }));

    expect(result.current.errorCount).toBe(2);
    expect(result.current.uploadError).toBe(true);
    expect(result.current.uploadSuccess).toBe(false);
  });

  it("should use Set for completedIds and failedIds (no duplicates)", () => {
    mockUseMutationState([
      {
        status: "success",
        variables: { attachment: { id: "1" } },
      },
      {
        status: "success",
        variables: { attachment: { id: "1" } },
      },
    ]);

    const selectedDocuments = [createMockDocument("1")];
    const { result } = renderHook(() => useUploadStatus({ selectedDocuments }));

    expect(result.current.completedIds.size).toBe(1);
    expect(result.current.errorCount).toBe(0);
  });
});
