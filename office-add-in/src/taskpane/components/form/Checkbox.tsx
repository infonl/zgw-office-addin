/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { InputProps, Checkbox as FluentUiCheckbox, Field } from "@fluentui/react-components";
import { useFormError } from "./hooks/useFormError";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";

export function CheckBox(props: Props) {
  const error = useFormError(props.name);
  const { control } = useFormContext();

  const { label, style, className, ...rest } = props;

  return (
    <Field
      required={props.required}
      validationState={error ? "error" : "none"}
      validationMessage={error}
      style={style}
      className={className}
    >
      <Controller
        render={({ field }) => (
          <FluentUiCheckbox
            label={label ?? props.name}
            checked={field.value ?? false}
            onChange={(_event, data) => field.onChange(data.checked)}
            onBlur={field.onBlur}
            name={field.name}
          />
        )}
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
