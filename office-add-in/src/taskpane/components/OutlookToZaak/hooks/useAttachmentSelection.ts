/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { AttachmentFile } from "../../../types/attachment";

export function useAttachmentSelection() {
  const [files, setFiles] = React.useState<AttachmentFile[]>([]);

  React.useEffect(() => {
    try {
      const item = Office?.context?.mailbox?.item;
      if (!item) {
        setFiles([]);
        return;
      }

      const emailEntry: AttachmentFile = {
        id: `EmailItself-${item.itemId}`,
        name: `E-mail: ${item.subject || "(geen onderwerp)"}`,
        contentType: "text/html",
        isInline: false,
      };

      const mapped: AttachmentFile[] = item.attachments
        .filter((attachment) => !attachment.isInline) // only non-inline attachments
        .map((attachment) => ({
          id: attachment.id,
          name: attachment.name,
          size: attachment.size,
          contentType: attachment.contentType,
          isInline: false,
        }));

      setFiles([emailEntry, ...mapped]);
    } catch (error) {
      console.warn("Kon attachments niet laden uit Outlook context", error);
      setFiles([]);
    }
  }, []);

  return { files };
}
