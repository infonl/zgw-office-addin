/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */
/*
 * Utility for building processed documents from selected documents and current email context
 */

import { ProcessedDocument, SelectedDocument } from "../hooks/types";
import { GraphService } from "../graph";

export async function prepareSelectedDocuments(
  selectedDocuments: SelectedDocument[],
  currentEmail: Office.MessageRead,
  graphService: GraphService
): Promise<ProcessedDocument[]> {
  // Collect all IDs to translate: email itself + attachments
  const itemsToTranslate: { type: "email" | "attachment"; id: string }[] = [];
  if (currentEmail && currentEmail.itemId) {
    itemsToTranslate.push({ type: "email", id: currentEmail.itemId });
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
  if (currentEmail && currentEmail.itemId) {
    const emailOfficeId = currentEmail.itemId;
    messageGraphId = officeIdToGraphId.get(emailOfficeId) ?? null;
  }

  return selectedDocuments.map((doc) => {
    const parentEmailGraphId = messageGraphId;
    if (doc.attachment.id.startsWith("EmailItself-")) {
      return {
        ...doc,
        graphId: messageGraphId,
        parentEmailGraphId: null, // always null for the email itself
      };
    }
    const graphId = officeIdToGraphId.get(doc.attachment.id) ?? null;
    return {
      ...doc,
      graphId,
      parentEmailGraphId,
    };
  });
}
