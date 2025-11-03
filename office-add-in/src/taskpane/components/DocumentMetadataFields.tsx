/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import { Input } from "./form/Input";
import { Select } from "./form/Select";
import { addDocumentSchema, documentstatus } from "../../hooks/useAddDocumentToZaak";
import { mq, dims } from "./styles/layout";

const useStyles = makeStyles({
  fieldset: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalNone,
    border: tokens.spacingVerticalNone,
    [mq.md]: {
      flexDirection: "row",
    },
  },
  field: {
    width: "100%",
    [mq.md]: {
      minWidth: dims.fieldMinWidth,
      flex: 1,
    },
  },
});

export type DocumentMetadataFieldsProps = {
  zaakinformatieobjecten: { omschrijving: string; url?: string }[];
  statuses: typeof documentstatus;
  namePrefix?: string;
};

// To be used within a react-hook-form FormProvider
export function DocumentMetadataFields({
  zaakinformatieobjecten,
  statuses,
  namePrefix = "",
}: DocumentMetadataFieldsProps) {
  const styles = useStyles();

  return (
    <>
      <Input
        className={styles.field}
        name={`${namePrefix}auteur`}
        label="Auteur"
        required={!addDocumentSchema.shape.auteur.isOptional()}
      />
      <fieldset className={styles.fieldset}>
        <Select
          className={styles.field}
          name={`${namePrefix}informatieobjecttype`}
          label="Informatieobjecttype"
          options={zaakinformatieobjecten.map((zio) => ({
            label: zio.omschrijving,
            value: zio.url || "",
          }))}
          required={!addDocumentSchema.shape.informatieobjecttype.isOptional()}
        />
        <Input
          className={styles.field}
          readOnly // https://dimpact.atlassian.net/browse/PZ-9205 deals with the possible values
          name={`${namePrefix}vertrouwelijkheidaanduiding`}
          label="Vertrouwelijkheid"
          required={!addDocumentSchema.shape.vertrouwelijkheidaanduiding.isOptional()}
        />
      </fieldset>
      <fieldset className={styles.fieldset}>
        <Select
          className={styles.field}
          name={`${namePrefix}status`}
          label="Status"
          options={statuses.map((status) => ({
            label: status.replace(/_/g, " "),
            value: status,
          }))}
          required={!addDocumentSchema.shape.status.isOptional()}
        />
        <Input
          className={styles.field}
          type="date"
          name={`${namePrefix}creatiedatum`}
          label="Creatiedatum"
          required={!addDocumentSchema.shape.creatiedatum.isOptional()}
        />
      </fieldset>
    </>
  );
}
