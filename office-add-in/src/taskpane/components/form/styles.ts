/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { makeStyles, tokens } from "@fluentui/react-components";

export const formStyles = makeStyles({
  input: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    paddingTop: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalL,
  },
  error: {
    color: tokens.colorStatusDangerForeground1,
  },
});
