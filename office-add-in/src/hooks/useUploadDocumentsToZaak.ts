/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useHttp } from "./useHttp";
import { useCallback } from "react";
import { ZaakResponse } from "./types";

export type UploadDocument = {
  inhoud: string | ArrayBuffer;
  titel: string;
  vertrouwelijkheidaanduiding: string;
  informatieobjecttype: string;
  status: string;
  creatiedatum: Date;
  auteur: string;
};

export function useUploadDocumentsToZaak() {
  const { POST } = useHttp();

  const uploadDocumentsToZaak = useCallback(
    async ({ zaak, documents }: { zaak: ZaakResponse; documents: UploadDocument[] }) => {
      return Promise.all(
        documents.map((doc) =>
          POST(`/zaken/${zaak.data?.identificatie}/documenten`, JSON.stringify(doc))
        )
      );
    },
    [POST]
  );

  return { uploadDocumentsToZaak };
}
