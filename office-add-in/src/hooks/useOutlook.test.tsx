/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useOutlook } from "./useOutlook";
import { fromPartial } from "@total-typescript/shoehorn";

type Item = typeof Office.context.mailbox.item;
function mockOfficeItem(item?: Item) {
  Office.context.mailbox.item = item;
}

describe("useOutlook", () => {
  beforeEach(() => {
    mockOfficeItem();
  });

  afterEach(() => {
    mockOfficeItem();
  });

  // -------------
  it("includes the email itself as the first entry", () => {
    mockOfficeItem(
      fromPartial<Item>({
        itemId: "ABC123",
        subject: "Test mail",
        attachments: [],
      })
    );

    const { result } = renderHook(() => useOutlook());
    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0]).toMatchObject({
      id: "EmailItself-ABC123",
      name: "E-mail: Test mail",
      contentType: "message/rfc822",
      isInline: false,
      size: 0,
      attachmentType: Office.MailboxEnums.AttachmentType.Item,
    });
  });

  it("handles email without subject", () => {
    mockOfficeItem(
      fromPartial<Item>({
        itemId: "ABC123",
        subject: undefined,
        attachments: [],
      })
    );

    const { result } = renderHook(() => useOutlook());
    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0]).toMatchObject({
      id: "EmailItself-ABC123",
      name: "E-mail: (geen onderwerp)",
      contentType: "message/rfc822",
      isInline: false,
      size: 0,
      attachmentType: Office.MailboxEnums.AttachmentType.Item,
    });
  });

  it("maps only non-inline attachments", () => {
    mockOfficeItem(
      fromPartial<Item>({
        subject: "With attachments",
        attachments: [
          {
            id: "1",
            name: "file1.pdf",
            size: 123,
            contentType: "application/pdf",
            isInline: false,
            attachmentType: Office.MailboxEnums.AttachmentType.File,
          },
          {
            id: "2",
            name: "inline.png",
            size: 200,
            contentType: "image/png",
            isInline: true,
            attachmentType: Office.MailboxEnums.AttachmentType.File,
          },
          {
            id: "3",
            name: "file2.docx",
            size: 456,
            contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            isInline: false,
            attachmentType: Office.MailboxEnums.AttachmentType.File,
          },
        ],
      })
    );

    const { result } = renderHook(() => useOutlook());
    expect(result.current.files).toHaveLength(3); // email + 2 non-inline
    expect(result.current.files[1]).toMatchObject({ id: "1", name: "file1.pdf" });
    expect(result.current.files[2]).toMatchObject({ id: "3", name: "file2.docx" });
    expect(result.current.files.find((fileEntry) => fileEntry.id === "2")).toBeUndefined();
  });

  it("handles missing Office context gracefully", async () => {
    mockOfficeItem();
    const { result } = renderHook(() => useOutlook());

    await waitFor(() => {
      expect(result.current.files).toEqual([]);
    });
  });
});
