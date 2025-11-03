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
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: tokens.spacingVerticalM,
    gridAutoFlow: "dense",
    [mq.md]: {
      gridTemplateColumns: "1fr 1fr",
    },
  },
  gridColumnSpan1: {
    gridColumn: "auto / span 1",
  },
  gridColumnSpan2: {
    gridColumn: "auto / span 1",
    [mq.md]: {
      gridColumn: "auto / span 2",
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
    <section className={styles.grid}>
      <Input
        className={styles.gridColumnSpan2}
        name={`${namePrefix}auteur`}
        label="Auteur"
        required={!addDocumentSchema.shape.auteur.isOptional()}
      />
      <Select
        className={styles.gridColumnSpan1}
        name={`${namePrefix}informatieobjecttype`}
        label="Informatieobjecttype"
        options={zaakinformatieobjecten.map((zio) => ({
          label: zio.omschrijving,
          value: zio.url || "",
        }))}
        required={!addDocumentSchema.shape.informatieobjecttype.isOptional()}
      />
      <Input
        className={styles.gridColumnSpan1}
        readOnly // https://dimpact.atlassian.net/browse/PZ-9205 deals with the possible values
        name={`${namePrefix}vertrouwelijkheidaanduiding`}
        label="Vertrouwelijkheid"
        required={!addDocumentSchema.shape.vertrouwelijkheidaanduiding.isOptional()}
      />
      <Select
        className={styles.gridColumnSpan1}
        name={`${namePrefix}status`}
        label="Status"
        options={statuses.map((status) => ({
          label: status.replace(/_/g, " "),
          value: status,
        }))}
        required={!addDocumentSchema.shape.status.isOptional()}
      />
      <Input
        className={styles.gridColumnSpan1}
        type="date"
        name={`${namePrefix}creatiedatum`}
        label="Creatiedatum"
        required={!addDocumentSchema.shape.creatiedatum.isOptional()}
      />
    </section>
  );
}
