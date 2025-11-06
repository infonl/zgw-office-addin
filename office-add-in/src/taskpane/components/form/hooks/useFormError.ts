/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { FieldError, useFormContext, type FieldErrors, type FieldValues } from "react-hook-form";

export function useFormError(name: string) {
  const {
    formState: { errors },
  } = useFormContext();

  const error = name.split(".").reduce(
    (acc, segment) => {
      if (!acc) return null;
      if (typeof acc === "string") return acc;
      if ("message" in acc) return acc.message?.toString() ?? null;
      return (acc as FieldErrors<FieldValues>)[segment] ?? null;
    },
    errors as FieldErrors<FieldValues> | FieldError | string | null
  );

  if (!error) return null;
  if (typeof error === "string") return error;

  return "message" in error ? error.message?.toString() : null;
}
