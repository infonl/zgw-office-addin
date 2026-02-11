/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useMemo } from "react";

export function useOutlook() {
  const files = useMemo(() => {
    const email = Office.context.mailbox?.item;

    const attachments = email?.attachments.filter((attachment) => !attachment.isInline) ?? [];

    if (!email) return attachments;

    const emailAsAttachment: Office.AttachmentDetails = {
      id: `EmailItself-${email.itemId}`,
      name: `E-mail: ${email.subject || "(geen onderwerp)"}.eml`,
      contentType: "message/rfc822",
      contentId: "",
      isInline: false,
      size: 0,
      attachmentType: Office.MailboxEnums.AttachmentType.Item,
    };

    return [emailAsAttachment, ...attachments];
  }, [Office.context.mailbox?.item?.itemId]);

  return { files };
}
