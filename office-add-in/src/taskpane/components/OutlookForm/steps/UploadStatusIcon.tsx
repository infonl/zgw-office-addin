/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { Spinner, tokens } from "@fluentui/react-components";
import { Warning16Filled, CheckmarkCircle16Filled } from "@fluentui/react-icons";
import { UploadStatus } from "../../../../hooks/types";

interface UploadStatusIconProps {
  status?: UploadStatus;
}

export function UploadStatusIcon({ status }: UploadStatusIconProps) {
  if (status === "loading") {
    return (
      <div
        style={{
          width: 20,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner size="extra-small" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <span title="Upload mislukt">
        <Warning16Filled
          style={{
            color: tokens.colorPaletteYellowForeground1,
            fontSize: 20,
          }}
        />
      </span>
    );
  }

  if (status === "success") {
    return (
      <span title="Upload geslaagd">
        <CheckmarkCircle16Filled
          style={{
            color: tokens.colorPaletteGreenForeground1,
            fontSize: 20,
          }}
        />
      </span>
    );
  }

  return null;
}
