/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { Caption1, Input as FluentUiInput, InputProps } from "@fluentui/react-components";
import { useFormError } from "./hooks/useFormError";
import { formStyles } from "./styles";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Label } from "./Label";
import { format } from "date-fns";

export function Input(props: Props) {
  const styles = formStyles();
  const error = useFormError(props.name);
  const { control } = useFormContext();

  return (
    <section className={styles.input}>
      <Label required={props.required} name={props.name} label={props.label} />
      <Controller
        render={({ field }) => {
          const isDate = props.type === "date";
          const value =
            isDate && field.value instanceof Date
              ? format(field.value, "yyyy-MM-dd")
              : (field.value ?? "");

          return (
            <FluentUiInput
              {...field}
              value={value}
              onChange={(_event, data) => {
                if (isDate) {
                  const v = (data.value ?? "").trim();
                  field.onChange(v ? new Date(v) : null);
                } else {
                  field.onChange(data.value);
                }
              }}
              type={props.type}
              id={field.name}
            />
          );
        }}
        control={control}
        disabled={props.readOnly}
        {...props}
      />

      {error && <Caption1 className={styles.error}>{error}</Caption1>}
    </section>
  );
}

type Props = InputProps & {
  name: string;
  label?: string;
};
