/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { tokens, Subtitle1, Body1 } from "@fluentui/react-components";
import { useFormContext } from "react-hook-form";
import { Schema } from "../hooks/useOutlookForm";
import { CheckBox } from "../../form/Checkbox";

export function SelectItems() {
  const form = useFormContext<Schema>();
  const documents = form.watch("documents");

  return (
    <>
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: tokens.spacingHorizontalS,
          marginTop: tokens.spacingHorizontalXXXL,
        }}
      >
        <Subtitle1>Bestanden selecteren</Subtitle1>
        <Body1>Selecteer welke bestanden je wil koppelen aan bovenstaande zaak.</Body1>
      </section>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          marginTop: tokens.spacingVerticalM,
        }}
      >
        {documents.map((document, index) => {
          const fieldName = `documents.${index}.selected`;
          const label = document.attachment.name;

          return (
            <CheckBox
              key={document.attachment.id}
              name={fieldName as `documents.${number}.selected`}
              label={label}
            />
          );
        })}
      </div>
    </>
  );
}
