/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { Field, Input as FluentUiInput, InputProps } from "@fluentui/react-components";
import { useFormError } from "./hooks/useFormError";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { format } from "date-fns";

export function Input(props: Props) {
  const error = useFormError(props.name);
  const { control } = useFormContext();

  const { style, className, ...rest } = props;

  return (
    <Field
      label={props.label ?? props.name}
      required={props.required}
      validationState={error ? "error" : "none"}
      validationMessage={error}
      style={style}
      className={className}
    >
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
            />
          );
        }}
        control={control}
        disabled={props.readOnly}
        {...rest}
      />
    </Field>
  );
}

type Props = InputProps & {
  name: string;
  label?: string;
};
