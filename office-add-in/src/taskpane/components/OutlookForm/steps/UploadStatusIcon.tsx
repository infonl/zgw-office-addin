/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { Spinner, tokens, makeStyles } from "@fluentui/react-components";
import { Warning16Filled, CheckmarkCircle16Filled } from "@fluentui/react-icons";
import { UploadStatus } from "../../../../hooks/types";

interface UploadStatusIconProps {
  status?: UploadStatus;
}

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
});

export function UploadStatusIcon({ status }: UploadStatusIconProps) {
  const styles = useStyles();

  if (status === "loading") {
    return (
      <div className={styles.container}>
        <Spinner size="tiny" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={`${styles.container} ${styles.withMargin}`} title="Upload mislukt">
        <Warning16Filled
          style={{
            color: tokens.colorPaletteRedForeground1,
            fontSize: 20,
          }}
        />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className={`${styles.container} ${styles.withMargin}`} title="Upload geslaagd">
        <CheckmarkCircle16Filled
          style={{
            color: tokens.colorPaletteGreenForeground1,
            fontSize: 20,
          }}
        />
      </div>
    );
  }

  return null;
}
