/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useFormContext } from "react-hook-form";

export function useFormError(name: string) {
  const {
    formState: { errors },
  } = useFormContext();

  return errors[name]?.message?.toString() ?? null;
}
