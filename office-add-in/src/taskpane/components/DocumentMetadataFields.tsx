/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import type { FieldValues } from "react-hook-form";
import React from "react";
import { useWatch, useFormContext } from "react-hook-form";
import { Button, makeStyles, tokens } from "@fluentui/react-components";
import { Input } from "./form/Input";
import { Textarea } from "./form/Textarea";
import { Select } from "./form/Select";
import {
  addDocumentSchema,
  vertrouwelijkheidaanduiding,
  DocumentMetadataFieldsProps,
} from "../../hooks/types";
import { mq } from "./styles/layout";
import { useGenerateMetaData } from "../../hooks/useGenerateMetaData";

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
  documentInfo,
}: DocumentMetadataFieldsProps<T>) {
  const styles = useStyles();
  const { setValue } = useFormContext();
  const { generateMetaData, isLoading } = useGenerateMetaData();

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

  const handleGenerateMetaData = async () => {
    console.log("AI CALL!!");
    const response = await generateMetaData(documentInfo);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue(`${namePrefix}beschrijving` as any, response.data.beschrijving);
  };

  return (
    <section className={styles.grid}>
      <Button
        className={`${styles.gridColumnSpan2}`}
        appearance="primary"
        disabled={isLoading}
        onClick={handleGenerateMetaData}
      >
        {isLoading ? "Bezig met genereren..." : "Voorinvullen met AI"}
      </Button>{" "}
      <Input
        className={styles.gridColumnSpan2}
        name={`${namePrefix}auteur`}
        label="Auteur"
        required={!addDocumentSchema.shape.auteur.isOptional()}
      />
      <Textarea
        className={styles.gridColumnSpan2}
        name={`${namePrefix}beschrijving`}
        label="Beschrijving"
        required={!addDocumentSchema.shape.beschrijving.isOptional()}
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
