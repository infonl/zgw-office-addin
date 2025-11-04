import { useMemo } from "react";

export function useOutlook() {
  const files = useMemo(() => {
    const email = Office.context.mailbox?.item;

    const attachements = email?.attachments.filter((attachment) => !attachment.isInline) ?? [];

    if (!email) return attachements;

    const emailAsAttachment: Office.AttachmentDetails = {
      id: `EmailItself-${email.itemId}`,
      name: `E-mail: ${email.subject || "(geen onderwerp)"}`,
      contentType: "text/html",
      isInline: false,
      size: 0,
      attachmentType: "email",
    };

    return [emailAsAttachment, ...attachements];
  }, [Office.context.mailbox?.item]);

  return { files };
}
