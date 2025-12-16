/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { makeStyles, tokens, Text } from "@fluentui/react-components";
import { ErrorCircleRegular } from "@fluentui/react-icons";

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

export function ShowTokenError() {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <ErrorCircleRegular className={styles.icon} />
        <Text className={styles.text}>
          <strong>Login vereist</strong>
          <br />
          U moet zich uit- en inloggen bij Microsoft Office om deze add-in te kunnen gebruiken.
          Log uit bij Office, sluit alle Office-toepassingen en log opnieuw in.
        </Text>
      </div>
    </div>
  );
}