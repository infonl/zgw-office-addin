/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { useFormContext, useWatch, type FieldValues } from "react-hook-form";
import { DocumentMetadataFields } from "../../DocumentMetadataFields";
import { useZaak } from "../../../../provider/ZaakProvider";
import { documentstatus } from "../../../../hooks/useAddDocumentToZaak";

interface DocumentMetadataValues extends FieldValues {
  auteur?: string;
  informatieobjecttype?: string;
  status?: string;
  creatiedatum?: string;
}

export function DocumentMetadataPanel({
  fileId,
  onValidityChange,
}: {
  fileId: string;
  onValidityChange: (_id: string, _isValid: boolean) => void;
}) {
  const { zaak } = useZaak();
  const { control, getValues } = useFormContext();

  const zio = zaak?.data?.zaakinformatieobjecten || [];

  // Watch only this file's sub-form
  const values = useWatch<DocumentMetadataValues>({ control, name: `filesById.${fileId}` }) as
    | Partial<DocumentMetadataValues>
    | undefined;

  const computeValid = React.useCallback((vals?: Partial<DocumentMetadataValues>) => {
    return !!vals?.auteur && !!vals?.informatieobjecttype && !!vals?.status && !!vals?.creatiedatum;
  }, []);

  // On mount: initial validity for this file row
  React.useEffect(() => {
    const initVals = getValues(`filesById.${fileId}` as const) as
      | Partial<DocumentMetadataValues>
      | undefined;
    const initValid = computeValid(initVals);
    onValidityChange(fileId, initValid);
  }, [fileId]);

  // On change: validity updates for this file row
  React.useEffect(() => {
    onValidityChange(fileId, computeValid(values));
  }, [values, fileId, computeValid, onValidityChange]);

  return (
    <DocumentMetadataFields
      zaakinformatieobjecten={zio}
      statuses={documentstatus}
      namePrefix={`filesById.${fileId}`}
    />
  );
}
