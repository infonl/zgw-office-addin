/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import { Input } from "./form/Input";
import { Select } from "./form/Select";
import { documentstatus } from "../../hooks/useAddDocumentToZaak";

const useStyles = makeStyles({
  fieldset: {
    display: "flex",
    gap: tokens.spacingVerticalM,
    padding: 0,
    border: 0,
  },
});

export type CommonDocumentFieldsProps = {
  zaakinformatieobjecten: { omschrijving: string; url?: string }[];
  statuses: typeof documentstatus;
};

// To be used within a react-hook-form FormProvider
export function CommonDocumentFields({
  zaakinformatieobjecten,
  statuses,
}: CommonDocumentFieldsProps) {
  const styles = useStyles();

  return (
    <>
      <Input name="auteur" />
      <fieldset className={styles.fieldset}>
        <Select
          name="informatieobjecttype"
          label="Document type"
          options={zaakinformatieobjecten.map((zio) => ({
            label: zio.omschrijving,
            value: zio.url || "",
          }))}
        />
        <Input readOnly name="vertrouwelijkheidaanduiding" />
      </fieldset>
      <fieldset className={styles.fieldset}>
        <Select
          name="status"
          label="Status"
          options={statuses.map((status) => ({
            label: status.replace(/_/g, " "),
            value: status,
          }))}
        />
        <Input type="date" name="creatiedatum" />
      </fieldset>
    </>
  );
}
