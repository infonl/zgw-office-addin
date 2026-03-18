/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { Field, Textarea as FluentUiTextarea, TextareaProps } from "@fluentui/react-components";
import { useFormError } from "./hooks/useFormError";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";

export function Textarea(props: Props) {
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
        render={({ field }) => (
          <FluentUiTextarea
            {...field}
            value={field.value ?? ""}
            onChange={(_event, data) => field.onChange(data.value)}
            resize="vertical"
            rows={4}
          />
        )}
        control={control}
        disabled={props.readOnly}
        {...rest}
      />
    </Field>
  );
}

type Props = Omit<TextareaProps, "name"> & {
  name: string;
  label?: string;
};
