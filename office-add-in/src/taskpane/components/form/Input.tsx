/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { Caption1, Label, Input as FluentUiInput, InputProps } from "@fluentui/react-components";
import { useFormError } from "./hooks/useFormError";
import { formStyles } from "./styles";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";

export function Input(props: Props) {
  const styles = formStyles();
  const error = useFormError(props.name);
  const { control, watch } = useFormContext();

  return (
    <section className={styles.input}>
      <Label htmlFor={props.name}>{props.label ?? props.name}</Label>
      <Controller
        render={({ field }) => <FluentUiInput {...field} type={props.type} id={field.name} />}
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
