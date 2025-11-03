/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { Field, Select as FluentUiSelect, SelectProps } from "@fluentui/react-components";
import { useFormError } from "./hooks/useFormError";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";

export function Select(props: Props) {
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
          <FluentUiSelect {...field} id={props.name}>
            <option value="" disabled>
              -
            </option>
            {props.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FluentUiSelect>
        )}
        control={control}
        {...props}
      />
    </Field>
  );
}

type Option = {
  label: string;
  value: string;
};

type Props = SelectProps & {
  name: string;
  label?: string;
  options: Array<Option>;
};
