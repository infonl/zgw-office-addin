/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useOutlook } from "./useOutlook";

interface OfficeItem {
  itemId?: string;
  subject?: string;
  attachments?: Office.AttachmentDetails[];
}

type OfficeGlobal = { context: { mailbox: { item: OfficeItem } } };

function mockOfficeItem(item: OfficeItem | null) {
  const globalWithOffice = globalThis as { Office?: OfficeGlobal };
  if (item) {
    globalWithOffice.Office = { context: { mailbox: { item } } };
  } else {
    delete globalWithOffice.Office;
  }
}

describe("useOutlook", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockOfficeItem(null);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    mockOfficeItem(null);
  });

  // -------------
  it("includes the email itself as the first entry", () => {
    mockOfficeItem({
      itemId: "ABC123",
      subject: "Test mail",
      attachments: [],
    });

    const { result } = renderHook(() => useOutlook());
    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0]).toMatchObject({
      id: "EmailItself-ABC123",
      name: "E-mail: Test mail",
      contentType: "message/rfc822",
      isInline: false,
      size: 0,
      attachmentType: "email",
    });
  });

  it("handles email without subject", () => {
    mockOfficeItem({
      itemId: "ABC123",
      subject: undefined,
      attachments: [],
    });

    const { result } = renderHook(() => useOutlook());
    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0]).toMatchObject({
      id: "EmailItself-ABC123",
      name: "E-mail: (geen onderwerp)",
      contentType: "message/rfc822",
      isInline: false,
      size: 0,
      attachmentType: "email",
    });
  });

  it("maps only non-inline attachments", () => {
    mockOfficeItem({
      subject: "With attachments",
      attachments: [
        {
          id: "1",
          name: "file1.pdf",
          size: 123,
          contentType: "application/pdf",
          isInline: false,
          attachmentType: "file",
        },
        {
          id: "2",
          name: "inline.png",
          size: 200,
          contentType: "image/png",
          isInline: true,
          attachmentType: "file",
        },
        {
          id: "3",
          name: "file2.docx",
          size: 456,
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          isInline: false,
          attachmentType: "file",
        },
      ],
    });

    const { result } = renderHook(() => useOutlook());
    expect(result.current.files).toHaveLength(3); // email + 2 non-inline
    expect(result.current.files[1]).toMatchObject({ id: "1", name: "file1.pdf" });
    expect(result.current.files[2]).toMatchObject({ id: "3", name: "file2.docx" });
    expect(result.current.files.find((fileEntry) => fileEntry.id === "2")).toBeUndefined();
  });

  it("handles missing Office context gracefully", async () => {
    // Mock Office with empty context instead of deleting it
    const globalWithOffice = globalThis as { Office?: OfficeGlobal };
    globalWithOffice.Office = { context: { mailbox: { item: null as any } } };

    const { result } = renderHook(() => useOutlook());

    await waitFor(() => {
      expect(result.current.files).toEqual([]);
    });
  });
});
