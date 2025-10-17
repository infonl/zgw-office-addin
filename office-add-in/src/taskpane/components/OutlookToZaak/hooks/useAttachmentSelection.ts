/*
 * SPDX-FileCopyrightText: 2025 INFO
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";

type AttachFile = {
  id: string;
  name: string;
  size?: number;
  contentType?: string;
  isInline?: boolean;
};

export function useAttachmentSelection() {
  const [files, setFiles] = React.useState<AttachFile[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const item: any = (window as any).Office?.context?.mailbox?.item;
      const atts = Array.isArray(item?.attachments) ? item.attachments : [];
      const subject: string = item?.subject || "";
      const emailEntry: AttachFile = {
        id: "__email_body__",
        name: `E-mail: ${subject || "(geen onderwerp)"}`,
        contentType: "text/html",
        isInline: false,
      };
      const mapped = atts.map((a: any) => ({
        id: a.id,
        name: a.name,
        size: a.size,
        contentType: a.contentType,
        isInline: !!a.isInline,
      }));
      setFiles([emailEntry, ...mapped]);
      return;
    } catch {
      // ignore
    }

    // Fallback voorbeelddata
    setFiles([{ id: "__email_body__", name: "E-mail: (voorbeeld)", contentType: "text/html" }]);
  }, []);

  const toggle = (id: string) =>
    setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const clearSelection = () => setSelectedIds([]);

  return { files, selectedIds, toggle, clearSelection };
}
