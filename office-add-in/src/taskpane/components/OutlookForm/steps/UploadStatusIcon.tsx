/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { Spinner, tokens, makeStyles } from "@fluentui/react-components";
import { Warning16Filled, CheckmarkCircle16Filled } from "@fluentui/react-icons";
import { useMutationState } from "@tanstack/react-query";
import type { UploadDocumentMutationVariables } from "../../../../hooks/types";

type UploadStatusIconProps = {
  attachmentId: string;
};

const ICON_SIZE = "20px";

const useStyles = makeStyles({
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  withMargin: {
    marginRight: tokens.spacingHorizontalXS,
  },
  errorIcon: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: ICON_SIZE,
  },
  successIcon: {
    color: tokens.colorPaletteGreenForeground1,
    fontSize: ICON_SIZE,
  },
});

export function UploadStatusIcon({ attachmentId }: UploadStatusIconProps) {
  const styles = useStyles();

  const allMutationStates = useMutationState({
    filters: { mutationKey: ["upload_document"] },
  });

  const mutationState = allMutationStates.find(
    (state) => (state.variables as UploadDocumentMutationVariables)?.attachment?.id === attachmentId
  );

  const status = mutationState?.status;

  if (status === "pending") {
    return (
      <div className={styles.container}>
        <Spinner size="tiny" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={`${styles.container} ${styles.withMargin}`} title="Upload mislukt">
        <Warning16Filled className={styles.errorIcon} />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className={`${styles.container} ${styles.withMargin}`} title="Upload geslaagd">
        <CheckmarkCircle16Filled className={styles.successIcon} />
      </div>
    );
  }

  return null;
}
