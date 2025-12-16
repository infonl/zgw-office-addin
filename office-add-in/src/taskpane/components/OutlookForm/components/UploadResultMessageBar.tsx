/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import {
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
} from "@fluentui/react-components";
import { pluralize, getVerbForm } from "../../../../utils/language";
import { useCommonStyles } from "../../styles/shared";

export type UploadResultMessageBarProps = {
  uploadSuccess: boolean;
  uploadError: boolean;
  errorCount: number;
  uploadedEmail?: boolean;
  uploadedAttachments?: number;
};

const useStyles = makeStyles({
  messageBar: {
    maxWidth: "100%",
    wordBreak: "break-word",
  },
  messageContent: {
    display: "block",
    whiteSpace: "normal",
    wordWrap: "break-word",
  },
});

export const getIntentAndTitle = (uploadError: boolean, uploadSuccess: boolean) => {
  if (uploadError && !uploadSuccess) {
    return { intent: "error" as const, title: "Koppeling mislukt" };
  }
  if (uploadError && uploadSuccess) {
    return { intent: "warning" as const, title: "Deels gekoppeld" };
  }
  return { intent: "success" as const, title: "Gekoppeld" };
};

export const getSuccessMessage = (
  uploadedEmail: boolean | undefined,
  uploadedAttachments: number | undefined
): string | null => {
  if (uploadedEmail && uploadedAttachments && uploadedAttachments > 0) {
    return `De e-mail en ${uploadedAttachments} ${pluralize(uploadedAttachments, "bijlage", "bijlagen")} ${getVerbForm(uploadedAttachments + 1, "is", "zijn")} succesvol gekoppeld.`;
  }
  if (uploadedEmail) {
    return `De e-mail is succesvol gekoppeld.`;
  }
  if (uploadedAttachments && uploadedAttachments > 0) {
    return `${uploadedAttachments} ${pluralize(uploadedAttachments, "bijlage", "bijlagen")} ${getVerbForm(uploadedAttachments, "is", "zijn")} succesvol gekoppeld.`;
  }
  return null;
};

export const getErrorMessage = (errorCount: number, uploadSuccess: boolean): string => {
  if (uploadSuccess) {
    return `Er ${getVerbForm(errorCount, "is", "zijn")} echter ${errorCount === 1 ? "een fout opgetreden bij een bestand" : `fouten opgetreden bij ${errorCount} bestanden`}.`;
  }
  return `Er ${getVerbForm(errorCount, "is", "zijn")} ${errorCount === 1 ? "een fout opgetreden" : "fouten opgetreden"} bij het koppelen van bestanden.`;
};

export function UploadResultMessageBar({
  uploadSuccess,
  uploadError,
  errorCount,
  uploadedEmail,
  uploadedAttachments,
}: UploadResultMessageBarProps) {
  const styles = useStyles();
  const common = useCommonStyles();

  const { intent, title } = getIntentAndTitle(uploadError, uploadSuccess);

  return (
    <MessageBar intent={intent} className={styles.messageBar}>
      <MessageBarBody>
        <MessageBarTitle className={common.messageTitleNoWrap}>{title}</MessageBarTitle>
        <span className={`${common.messageInline} ${styles.messageContent}`}>
          {uploadSuccess && getSuccessMessage(uploadedEmail, uploadedAttachments)}
          {uploadError && getErrorMessage(errorCount, uploadSuccess)}
        </span>
      </MessageBarBody>
    </MessageBar>
  );
}
