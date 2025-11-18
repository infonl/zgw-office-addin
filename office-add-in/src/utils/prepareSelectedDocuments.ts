/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */
/*
 * Utility for building processed documents from selected documents and current email context
 */

import { DocumentSchema } from "../taskpane/components/OutlookForm/hooks/useOutlookForm";
import { GraphService } from "../service/GraphService";

export async function prepareSelectedDocuments(
  selectedDocuments: DocumentSchema[],
  currentEmail: Office.MessageRead | Office.MessageCompose,
  graphService: GraphService
): Promise<Array<DocumentSchema & { graphId: string | null }>> {
  // Collect all IDs to translate: email itself + attachments
  const itemsToTranslate: { type: "email" | "attachment"; id: string }[] = [];
  if (currentEmail && "itemId" in currentEmail) {
    itemsToTranslate.push({ type: "email", id: (currentEmail as Office.MessageRead).itemId });
  }
  selectedDocuments.forEach((doc) => {
    if (!doc.attachment.id.startsWith("EmailItself-")) {
      itemsToTranslate.push({ type: "attachment", id: doc.attachment.id });
    }
  });

  let translatedIds: (string | null)[] = [];
  if (itemsToTranslate.length > 0) {
    const officeIds = itemsToTranslate.map((item) => item.id);
    translatedIds = await graphService.officeIdsToGraphIdsViaApi(officeIds);
  }

  const officeIdToGraphId = new Map<string, string | null>();
  itemsToTranslate.forEach((item, index) => {
    officeIdToGraphId.set(item.id, translatedIds[index] ?? null);
  });

  let messageGraphId: string | null = null;
  if (currentEmail && "itemId" in currentEmail) {
    const emailOfficeId = (currentEmail as Office.MessageRead).itemId;
    messageGraphId = officeIdToGraphId.get(emailOfficeId) ?? null;
  }

  return selectedDocuments.map((doc) => {
    if (doc.attachment.id.startsWith("EmailItself-")) {
      return {
        ...doc,
        graphId: messageGraphId,
      };
    }
    const graphId = officeIdToGraphId.get(doc.attachment.id) ?? null;
    return {
      ...doc,
      graphId,
    };
  });
}
