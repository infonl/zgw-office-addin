/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { useMemo } from "react";
import { useMutationState } from "@tanstack/react-query";
import type {
  UploadDocumentMutationVariables,
  DocumentSchema,
  UseUploadStatusProps,
  UseUploadStatusReturn,
} from "../../../../hooks/types";

/**
 * Custom hook to manage upload state tracking and calculations.
 * Encapsulates mutation state tracking, document filtering, and status derivation.
 */
export const useUploadStatus = ({
  selectedDocuments,
}: UseUploadStatusProps): UseUploadStatusReturn => {
  const allMutationStates = useMutationState({
    filters: { mutationKey: ["upload_document"] },
  });

  return useMemo(() => {
    const selectedDocumentIds = selectedDocuments.map((doc: DocumentSchema) => doc.attachment.id);

    const failedIds = new Set<string>();
    const completedIds = new Set<string>();
    const activeMutations = new Set<string>();

    allMutationStates.forEach((state) => {
      if (state.variables) {
        const attachmentId = (state.variables as UploadDocumentMutationVariables)?.attachment?.id;
        if (attachmentId && selectedDocumentIds.includes(attachmentId)) {
          if (state.status === "pending") {
            activeMutations.add(attachmentId);
          }
          if (state.status === "success") {
            completedIds.add(attachmentId);
          }
          if (state.status === "error") {
            failedIds.add(attachmentId);
          }
        }
      }
    });

    const isUploading = activeMutations.size > 0;
    const hasCompletedMutations =
      selectedDocuments.length > 0 &&
      (completedIds.size > 0 || failedIds.size > 0) &&
      selectedDocumentIds.every((id) => completedIds.has(id) || failedIds.has(id));

    const uploadComplete = !isUploading && hasCompletedMutations;

    const uploadedEmail = uploadComplete
      ? selectedDocuments.some((doc: DocumentSchema) => doc.attachment.attachmentType === "item")
      : false;

    const uploadedAttachments = uploadComplete
      ? selectedDocuments.filter((doc: DocumentSchema) => doc.attachment.attachmentType !== "item")
          .length
      : 0;

    const uploadError = uploadComplete && failedIds.size > 0;
    const uploadSuccess = uploadComplete && failedIds.size === 0;
    const errorCount = failedIds.size;

    return {
      selectedDocumentIds,
      activeMutations,
      completedIds,
      failedIds,
      isUploading,
      uploadComplete,
      uploadedEmail,
      uploadedAttachments,
      errorCount,
      uploadError,
      uploadSuccess,
    };
  }, [allMutationStates, selectedDocuments]);
};
