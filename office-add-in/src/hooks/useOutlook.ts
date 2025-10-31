import { useMemo } from "react";

export function useOutlook() {
  const files = useMemo(() => {
    const email = Office.context.mailbox?.item;

    return email?.attachments.filter((attachment) => !attachment.isInline) ?? [];
  }, [Office.context.mailbox?.item]);

  return { files };
}
