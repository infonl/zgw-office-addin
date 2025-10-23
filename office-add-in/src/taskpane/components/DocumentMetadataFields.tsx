/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import { Input } from "./form/Input";
import { Select } from "./form/Select";
import { documentstatus } from "../../hooks/useAddDocumentToZaak";
import { mq, dims } from "./styles/layout";

const fieldLabels: Record<string, string> = {
  auteur: "Auteur",
  informatieobjecttype: "Informatieobjecttype",
  vertrouwelijkheidaanduiding: "Vertrouwelijkheid",
  creatiedatum: "Creatiedatum",
  status: "Status",
};

const useStyles = makeStyles({
  fieldset: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: 0,
    border: 0,
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

const requiredLabel = (key: keyof typeof fieldLabels) => `${fieldLabels[key]} *`;

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
  const pn = (n: string) => (namePrefix ? `${namePrefix}.${n}` : n);

  const getToday = React.useCallback(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  return (
    <>
      <Input
        className={styles.field}
        name={pn("auteur")}
        label={requiredLabel("auteur")}
        required
        defaultValue=""
      />
      <fieldset className={styles.fieldset}>
        <Select
          className={styles.field}
          name={pn("informatieobjecttype")}
          label={requiredLabel("informatieobjecttype")}
          required
          defaultValue=""
          options={zaakinformatieobjecten.map((zio) => ({
            label: zio.omschrijving,
            value: zio.url || "",
          }))}
        />
        <Input
          className={styles.field}
          readOnly // ToDo
          name={pn("vertrouwelijkheidaanduiding")}
          label={fieldLabels["vertrouwelijkheidaanduiding"]}
          defaultValue=""
        />
      </fieldset>
      <fieldset className={styles.fieldset}>
        <Select
          className={styles.field}
          name={pn("status")}
          label={requiredLabel("status")}
          required
          defaultValue=""
          options={statuses.map((status) => ({
            label: status.replace(/_/g, " "),
            value: status,
          }))}
        />
        <Input
          className={styles.field}
          type="date"
          name={pn("creatiedatum")}
          label={requiredLabel("creatiedatum")}
          required
          defaultValue={getToday()}
        />
      </fieldset>
    </>
  );
}
