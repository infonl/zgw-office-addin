/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import {
  Caption1,
  Label,
  Input as FluentUiInput,
  InputProps,
  Checkbox as FluentUiCheckbox,
} from "@fluentui/react-components";
import { useFormError } from "./hooks/useFormError";
import { formStyles } from "./styles";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";

export function CheckBox(props: Props) {
  const styles = formStyles();
  const error = useFormError(props.name);
  const { control } = useFormContext();

  return (
    <section className={styles.input}>
      <Label htmlFor={props.name}>{props.label ?? props.name}</Label>
      <Controller
        render={({ field }) => (
          <FluentUiCheckbox
            checked={field.value ?? false}
            onChange={(_event, data) => field.onChange(data.checked)}
            onBlur={field.onBlur}
            name={field.name}
            id={field.name}
          />
        )}
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
