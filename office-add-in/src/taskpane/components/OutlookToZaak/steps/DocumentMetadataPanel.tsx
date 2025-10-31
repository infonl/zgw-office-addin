/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { DocumentMetadataFields } from "../../DocumentMetadataFields";
import { useZaak } from "../../../../provider/ZaakProvider";
import { documentstatus } from "../../../../hooks/useAddDocumentToZaak";

export type DocumentMetadataValues = {
  auteur?: string;
  informatieobjecttype?: string;
  status?: string;
  creatiedatum?: string;
};

export type FormValues = {
  filesById: Record<string, DocumentMetadataValues>;
};

export function DocumentMetadataPanel({ fileId }: { fileId: string }) {
  const { zaak } = useZaak();
  const zaakInformatieObjecten = zaak?.data?.zaakinformatieobjecten || [];

  return (
    <DocumentMetadataFields
      zaakinformatieobjecten={zaakInformatieObjecten}
      statuses={documentstatus}
      namePrefix={`filesById.${fileId}`}
    />
  );
}
