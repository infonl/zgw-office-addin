/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useCallback } from "react";
import { useOffice } from "./useOffice";
import { useLogger } from "./useLogger";
import { DocumentInfo } from "./types";
import { OfficeGraphAuthService } from "../service/OfficeGraphAuthService";
import { GraphServiceClient } from "../service/GraphService.client";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const binaryString = Array.from(bytes)
    .map((byte) => String.fromCharCode(byte))
    .join("");
  return btoa(binaryString);
}

export function useDocumentInfo() {
  const logger = useLogger(useDocumentInfo.name);
  const { isWord, isExcel, isOutlook, getDocumentData } = useOffice();

  const getEnrichedDocumentInfo = useCallback(
    async (baseInfo: DocumentInfo): Promise<DocumentInfo> => {
      // Word or Excel: fetch binary content directly via Office.js
      if (isWord || isExcel) {
        const inhoud = await getDocumentData();
        return { ...baseInfo, inhoud };
      }

      // Outlook: fetch content via Graph API
      if (isOutlook && baseInfo.attachmentOfficeId) {
        const emailItemId = Office.context.mailbox?.item?.itemId;

        if (!emailItemId) {
          logger.WARN("No email item ID found for Outlook attachment fetch");
          return baseInfo;
        }

        const authService = new OfficeGraphAuthService(logger);
        const graphClient = new GraphServiceClient(authService, logger);
        const isEmailItself = baseInfo.attachmentOfficeId.startsWith("EmailItself-");

        if (isEmailItself) {
          // Email (item) attachment: fetch the full email as EML text
          const [emailGraphId] = await graphClient.officeIdsToGraphIdsViaApi([emailItemId]);

          if (!emailGraphId) {
            logger.WARN("Could not translate email Office ID to Graph ID");
            return baseInfo;
          }

          const emlContent = await graphClient.getEmailAsEML(emailGraphId);
          const inhoud = btoa(emlContent);

          return { ...baseInfo, inhoud };
        }

        // File attachment: fetch binary content via Graph attachment endpoint
        const [emailGraphId, attachmentGraphId] = await graphClient.officeIdsToGraphIdsViaApi([
          emailItemId,
          baseInfo.attachmentOfficeId,
        ]);

        if (!emailGraphId || !attachmentGraphId) {
          logger.WARN("Could not translate Office IDs to Graph IDs", {
            emailGraphId,
            attachmentGraphId,
          });
          return baseInfo;
        }

        const arrayBuffer = await graphClient.getAttachmentContent(emailGraphId, attachmentGraphId);
        const inhoud = arrayBufferToBase64(arrayBuffer);

        return { ...baseInfo, inhoud };
      }

      return baseInfo;
    },
    [isWord, isExcel, isOutlook, getDocumentData, logger]
  );

  return { getEnrichedDocumentInfo };
}
