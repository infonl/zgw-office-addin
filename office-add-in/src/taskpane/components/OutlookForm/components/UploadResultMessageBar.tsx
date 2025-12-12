/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { MessageBar, MessageBarBody, MessageBarTitle } from "@fluentui/react-components";
import { pluralize, conjugate } from "../../../../utils/language";
import { useCommonStyles } from "../../styles/shared";

interface UploadResultMessageBarProps {
  uploadSuccess: boolean;
  uploadError: boolean;
  errorCount: number;
  uploadedEmail?: boolean;
  uploadedAttachments?: number;
  zaakIdentificatie?: string;
}

export function UploadResultMessageBar({
  uploadSuccess,
  uploadError,
  errorCount,
  uploadedEmail,
  uploadedAttachments,
  zaakIdentificatie,
}: UploadResultMessageBarProps) {
  const common = useCommonStyles();

  const intent = uploadError && !uploadSuccess ? "error" : uploadError ? "warning" : "success";

  const title =
    uploadError && !uploadSuccess
      ? "Koppeling mislukt"
      : uploadError
        ? "Deels gekoppeld"
        : "Gekoppeld";

  return (
    <MessageBar intent={intent} style={{ maxWidth: "100%", wordBreak: "break-word" }}>
      <MessageBarBody>
        <MessageBarTitle className={common.messageTitleNoWrap}>{title}</MessageBarTitle>
        <span
          className={common.messageInline}
          style={{ display: "block", whiteSpace: "normal", wordWrap: "break-word" }}
        >
          {uploadSuccess && (
            <>
              {uploadedEmail && uploadedAttachments && uploadedAttachments > 0
                ? `De e-mail en ${uploadedAttachments} ${pluralize(uploadedAttachments, "bijlage", "bijlagen")} ${conjugate(uploadedAttachments + 1, "is", "zijn")} succesvol gekoppeld.`
                : uploadedEmail
                  ? `De e-mail is succesvol gekoppeld aan ${zaakIdentificatie}.`
                  : uploadedAttachments && uploadedAttachments > 0
                    ? `${uploadedAttachments} ${pluralize(uploadedAttachments, "bijlage", "bijlagen")} ${conjugate(uploadedAttachments, "is", "zijn")} succesvol gekoppeld.`
                    : null}
            </>
          )}
          {uploadError && (
            <>
              {uploadSuccess && " "}
              {uploadSuccess
                ? `Er ${conjugate(errorCount, "is", "zijn")} echter ${errorCount === 1 ? "een fout opgetreden bij een bestand" : `fouten opgetreden bij ${errorCount} bestanden`}.`
                : `Er ${conjugate(errorCount, "is", "zijn")} ${errorCount === 1 ? "een fout opgetreden" : "fouten opgetreden"} bij het koppelen van bestanden.`}
            </>
          )}
        </span>
      </MessageBarBody>
    </MessageBar>
  );
}
