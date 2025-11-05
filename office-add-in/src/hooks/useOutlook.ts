import { useMemo } from "react";

export function useOutlook() {
  const files = useMemo(() => {
    const email = Office.context.mailbox?.item;

    const attachments = email?.attachments.filter((attachment) => !attachment.isInline) ?? [];

    if (!email) return attachments;

    const emailAsAttachment: Office.AttachmentDetails = {
      id: `EmailItself-${email.itemId}`,
      name: `E-mail: ${email.subject || "(geen onderwerp)"}`,
      contentType: "message/rfc822",
      isInline: false,
      size: 0,
      attachmentType: "email",
    };

    return [emailAsAttachment, ...attachments];
  }, [Office.context.mailbox?.item]);

  return { files };
}
