/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { useFormContext } from "react-hook-form";
import { Checkmark16Filled } from "@fluentui/react-icons";
import { tokens } from "@fluentui/react-components";
import { addDocumentSchema } from "../../../../hooks/types";
import { Schema } from "../hooks/useOutlookForm";

interface DocumentIndicatorProps {
  index: number;
}

export function DocumentIndicator({ index }: DocumentIndicatorProps) {
  const form = useFormContext<Schema>();
  const document = form.watch(`documents.${index}`);

  const isValid = addDocumentSchema.safeParse(document).success;

  if (!isValid) return null;

  return (
    <span
      aria-label="volledig"
      title="Formulier compleet"
      style={{ marginLeft: tokens.spacingHorizontalS, color: tokens.colorPaletteGreenForeground1 }}
    >
      <Checkmark16Filled />
    </span>
  );
}
