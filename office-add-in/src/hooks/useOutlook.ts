import { useMemo } from "react";

export function useOutlook() {
  const files = useMemo(() => {
    const email = Office.context.mailbox?.item;

    return (
      email?.attachments.filter((attachment) => !attachment.isInline) ??
      ([
        {
          id: "placeholder-id",
          isInline: false,
          name: "placeholder.eml",
          size: 0,
          contentType: "message/rfc822",
          attachmentType: "file",
        },
        {
          id: "placeholder-id-2",
          isInline: false,
          name: "placeholder-2.eml",
          size: 0,
          contentType: "message/rfc822",
          attachmentType: "file",
        },
      ] satisfies Office.AttachmentDetails[])
    );
  }, [Office.context.mailbox?.item]);

  return { files };
}
