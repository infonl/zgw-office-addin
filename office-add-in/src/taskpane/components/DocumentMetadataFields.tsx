/*
* SPDX-FileCopyrightText: 2025 INFO.nl
* SPDX-License-Identifier: EUPL-1.2+
*/

import type { FieldValues } from "react-hook-form";
import React from "react";
import { useWatch } from "react-hook-form";
import { makeStyles, tokens } from "@fluentui/react-components";
import { Input } from "./form/Input";
import { Select } from "./form/Select";
import { addDocumentSchema, vertrouwelijkheidaanduiding, DocumentMetadataFieldsProps } from "../../hooks/types";
import { mq } from "./styles/layout";

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


// To be used within a react-hook-form FormProvider
export function DocumentMetadataFields<T extends FieldValues>({
  zaakinformatieobjecten,
  statuses,
  namePrefix = "",
  control,
}: DocumentMetadataFieldsProps<T>) {
  const styles = useStyles();

  // Watch the ZIO field to determine if vertrouwelijkheidsaanduiding dropdown should be enabled
  const selectedInformatieobjecttype = useWatch({
    name: `${namePrefix}informatieobjecttype` as import("react-hook-form").Path<T>,
    control,
  });

  // Watch vertrouwelijkheidsaanduiding field to ensure re-render when form.setValue is called from parent
  useWatch({
    name: `${namePrefix}vertrouwelijkheidaanduiding` as import("react-hook-form").Path<T>,
    control,
  });

  const vertrouwelijkheidOptions = vertrouwelijkheidaanduiding.map((value) => ({
    label: value.replace(/_/g, " "),
    value,
  }));

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
      <Select
        className={styles.gridColumnSpan1}
        name={`${namePrefix}vertrouwelijkheidaanduiding`}
        label="Vertrouwelijkheid"
        options={vertrouwelijkheidOptions}
        required={!addDocumentSchema.shape.vertrouwelijkheidaanduiding.isOptional()}
        disabled={!selectedInformatieobjecttype}
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
