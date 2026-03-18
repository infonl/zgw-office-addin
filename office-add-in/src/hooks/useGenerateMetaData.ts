/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useState } from "react";
import { useHttp } from "./useHttp";

type GenerateMetaDataResponse = {
  succes: boolean;
  data: {
    beschrijving: string;
  };
};

export function useGenerateMetaData() {
  const { POST } = useHttp();
  const [isLoading, setIsLoading] = useState(false);

  const generateMetaData = async (documentTitle: string): Promise<GenerateMetaDataResponse> => {
    setIsLoading(true);
    try {
      return await POST<GenerateMetaDataResponse>(
        "/ai/metadata",
        JSON.stringify({ document: documentTitle })
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { generateMetaData, isLoading };
}
