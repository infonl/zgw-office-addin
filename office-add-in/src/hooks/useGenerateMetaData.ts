/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useState } from "react";
import { useHttp } from "./useHttp";
import { useDocumentInfo } from "./useDocumentInfo";
import { DocumentInfo, GenerateMetaDataResponse } from "./types";

export function useGenerateMetaData() {
  const { POST } = useHttp();
  const { getEnrichedDocumentInfo } = useDocumentInfo();
  const [isLoading, setIsLoading] = useState(false);

  const generateMetaData = async (
    documentInfo: DocumentInfo
  ): Promise<GenerateMetaDataResponse> => {
    setIsLoading(true);
    try {
      const enrichedInfo = await getEnrichedDocumentInfo(documentInfo);

      return await POST<GenerateMetaDataResponse>("/ai/metadata", JSON.stringify(enrichedInfo));
    } finally {
      setIsLoading(false);
    }
  };

  return { generateMetaData, isLoading };
}
