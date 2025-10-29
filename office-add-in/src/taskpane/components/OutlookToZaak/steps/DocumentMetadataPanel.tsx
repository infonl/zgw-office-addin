/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
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

export function DocumentMetadataPanel({
  fileId,
  onValidityChange,
}: {
  fileId: string;
  onValidityChange: (_id: string, _isValid: boolean) => void;
}) {
  const { zaak } = useZaak();
  const { control, getValues } = useFormContext<FormValues>();

  const zaakInformatieObjecten = zaak?.data?.zaakinformatieobjecten || [];

  // Watch only this file's sub-form
  const FILES_BY_ID = "filesById";
  const filesById = useWatch<FormValues, typeof FILES_BY_ID>({ control, name: FILES_BY_ID });
  const currentValuesForFile: DocumentMetadataValues | undefined = filesById?.[fileId];

  const computeValid = React.useCallback((values?: DocumentMetadataValues) => {
    return (
      !!values?.auteur &&
      !!values?.informatieobjecttype &&
      !!values?.status &&
      !!values?.creatiedatum
    );
  }, []);

  // On mount: initial validity for this file
  React.useEffect(() => {
    const initialValues = getValues(FILES_BY_ID)?.[fileId];
    onValidityChange(fileId, computeValid(initialValues));
  }, [fileId]);

  // On change: validity updates for this file row
  React.useEffect(() => {
    onValidityChange(fileId, computeValid(currentValuesForFile));
  }, [currentValuesForFile, fileId, computeValid, onValidityChange]);

  return (
    <DocumentMetadataFields
      zaakinformatieobjecten={zaakInformatieObjecten}
      statuses={documentstatus}
      namePrefix={`filesById.${fileId}`}
    />
  );
}
