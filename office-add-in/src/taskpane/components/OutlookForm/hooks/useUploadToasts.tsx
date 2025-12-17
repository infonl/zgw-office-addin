/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { Toast, ToastTitle, ToastBody, Spinner } from "@fluentui/react-components";
import { useToast } from "../../../../provider/ToastProvider";
import { pluralize, getVerbForm } from "../../../../utils/language";

export function useUploadToasts() {
  const { dispatchToast, dismissToast } = useToast();

  const showUploadingToast = (count: number, zaakId: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle media={<Spinner size="tiny" />}>Bestanden koppelen</ToastTitle>
        <ToastBody>
          {count} bestand(en) worden gekoppeld aan {zaakId}.
        </ToastBody>
      </Toast>,
      { intent: "info", toastId: "uploading-documents" }
    );
  };

  const showErrorToast = (failed: number, total: number) => {
    dismissToast("uploading-documents");
    const message =
      total === 1
        ? "Het bestand kon niet worden gekoppeld."
        : `${failed} van ${total} bestanden ${getVerbForm(failed, "kon", "konden")} niet worden gekoppeld.`;

    dispatchToast(
      <Toast>
        <ToastTitle>Koppeling mislukt</ToastTitle>
        <ToastBody>{message}</ToastBody>
      </Toast>,
      { intent: "error" }
    );
  };

  const showSuccessToast = (emailSelected: boolean, attachmentsCount: number) => {
    dismissToast("uploading-documents");

    let message = "";
    if (emailSelected && attachmentsCount > 0) {
      message = `De e-mail en ${attachmentsCount} ${pluralize(attachmentsCount, "bijlage", "bijlagen")} ${getVerbForm(attachmentsCount + 1, "is", "zijn")} succesvol gekoppeld`;
    } else if (emailSelected) {
      message = "De e-mail is succesvol gekoppeld.";
    } else if (attachmentsCount > 0) {
      message = `${attachmentsCount} ${pluralize(attachmentsCount, "bijlage", "bijlagen")} ${getVerbForm(attachmentsCount, "is", "zijn")} succesvol gekoppeld.`;
    } else {
      message = "Er zijn geen bestanden gekoppeld.";
    }

    dispatchToast(
      <Toast>
        <ToastTitle>Bestanden gekoppeld</ToastTitle>
        <ToastBody>{message}</ToastBody>
      </Toast>,
      { intent: "success" }
    );
  };

  const showGeneralErrorToast = () => {
    dismissToast("uploading-documents");

    dispatchToast(
      <Toast>
        <ToastTitle>Koppeling mislukt</ToastTitle>
        <ToastBody>Er is een onverwachte fout opgetreden.</ToastBody>
      </Toast>,
      { intent: "error" }
    );
  };

  return {
    showUploadingToast,
    showErrorToast,
    showSuccessToast,
    showGeneralErrorToast,
  };
}
