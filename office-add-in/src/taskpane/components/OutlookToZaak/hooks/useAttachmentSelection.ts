/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { AttachmentFile } from "../../../types/attachment";

export function useAttachmentSelection() {
  const [files, setFiles] = React.useState<AttachmentFile[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const item: any = (window as any).Office?.context?.mailbox?.item;
      const emailAttachments = Array.isArray(item?.attachments) ? item.attachments : [];
      const subject: string = item?.subject || "";
      const emailEntry: AttachmentFile = {
        id: "EmailItself",
        name: `E-mail: ${subject || "(geen onderwerp)"}`,
        contentType: "text/html",
        isInline: false,
      };
      const mapped = emailAttachments
        .filter((a: any) => !a.isInline) // only non-inline attachments
        .map((a: any) => ({
          id: a.id,
          name: a.name,
          size: a.size,
          contentType: a.contentType,
          isInline: false,
        }));

      setFiles([emailEntry, ...mapped]);
    } catch (err) {
      console.warn("Kon attachments niet laden uit Outlook context", err);
      setFiles([]);
    }
  }, []);

  const toggle = React.useCallback(
    (id: string) =>
      setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
    []
  );

  const clearSelection = React.useCallback(() => setSelectedIds([]), []);

  return { files, selectedIds, toggle, clearSelection };
}
