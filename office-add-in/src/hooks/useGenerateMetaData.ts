/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useMutation } from "@tanstack/react-query";
import { useHttp } from "./useHttp";
import { useDocumentInfo } from "./useDocumentInfo";
import { DocumentInfo, GenerateMetaDataResponse } from "./types";

export function useGenerateMetaData() {
  const { POST } = useHttp();
  const { getEnrichedDocumentInfo } = useDocumentInfo();

  return useMutation({
    mutationKey: ["generate_metadata"],
    mutationFn: async (documentInfo: DocumentInfo) => {
      const enrichedInfo = await getEnrichedDocumentInfo(documentInfo);

      return POST<GenerateMetaDataResponse>("/ai/metadata", JSON.stringify(enrichedInfo));
    },
  });
}
