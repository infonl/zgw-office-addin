/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { makeStyles, tokens, Text } from "@fluentui/react-components";
import { ErrorCircleRegular } from "@fluentui/react-icons";
import { TokenErrorProps } from "../../hooks/types";
import { errorMessages, defaultError } from "../../tokenErrors";

const useStyles = makeStyles({
  container: {
    marginTop: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorPaletteRedBorder1}`,
  },
  content: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
  },
  icon: {
    fontSize: "20px",
    color: tokens.colorPaletteRedForeground1,
    flexShrink: 0,
    marginTop: "2px",
  },
  text: {
    flex: 1,
  },
});

export function ShowTokenError({ error }: TokenErrorProps) {
  const styles = useStyles();

  if (!error) return null;

  const errorCode = typeof error === "object" ? error.code : undefined;
  const errorInfo = errorCode ? errorMessages[errorCode] || defaultError : defaultError;

  return (
    <div className={styles.container} data-testid="token-error">
      <div className={styles.content}>
        <ErrorCircleRegular className={styles.icon} data-testid="token-error-icon" />
        <Text className={styles.text}>
          <strong data-testid="token-error-title">{errorInfo.title}</strong>
          <br />
          <span data-testid="token-error-message">{errorInfo.message}</span>
          {errorCode && (
            <>
              <br />
              <small data-testid="token-error-code">Foutcode: {errorCode}</small>
            </>
          )}
        </Text>
      </div>
    </div>
  );
}
