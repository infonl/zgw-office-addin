/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { document, DocumentSchema, SelectedDocument, UploadStatus } from "../../../../hooks/types";
import { useZaak } from "../../../../provider/ZaakProvider";
import { useOutlook } from "../../../../hooks/useOutlook";
import { useOffice } from "../../../../hooks/useOffice";
import { GraphService } from "../../../../graph";
import { useAuth } from "../../../../provider/AuthProvider";
import { prepareSelectedDocuments } from "../../../../utils/prepareSelectedDocuments";
import { useLogger } from "../../../../hooks/useLogger";
import { useAddDocumentToZaak } from "../../../../hooks/useAddDocumentToZaak";
import { arrayBufferToBase64 } from "../../../../utils/arrayBuffer";
import { useUploadToasts } from "./useUploadToasts";

export type TranslateItem = { type: "email" | "attachment"; id: string };

const schema = z.object({
  documents: z.array(document),
});

export type Schema = z.infer<typeof schema>;

export type SubmitResult = {
  error: Error | null;
};

export function useOutlookForm() {
  const { authService } = useAuth();
  const { zaak } = useZaak();
  const { files } = useOutlook();
  const { processAndUploadDocuments } = useOffice();
  const { DEBUG, WARN, ERROR } = useLogger(useOutlookForm.name);
  const { mutateAsync } = useAddDocumentToZaak();
  const { showUploadingToast, showErrorToast, showSuccessToast, showGeneralErrorToast } =
    useUploadToasts();
  const [uploadStatus, setUploadStatus] = React.useState<Record<string, UploadStatus>>({});
  const [uploadedEmail, setUploadedEmail] = React.useState<boolean | undefined>(undefined);
  const [uploadedAttachments, setUploadedAttachments] = React.useState<number | undefined>(
    undefined
  );

  const isUploading = Object.values(uploadStatus).some((status) => status === "loading");

  const form = useForm({
    resolver: zodResolver(schema),
    reValidateMode: "onChange",
    mode: "onChange",
    defaultValues: {
      documents: [],
    },
  });

  const documents = form.watch("documents");

  const handleSubmit = async (data: Schema): Promise<SubmitResult> => {
    const selectedDocuments = data.documents.filter(
      ({ selected }) => selected
    ) as SelectedDocument[];
    DEBUG("🚀 Starting upload of selected documents to OpenZaak:", selectedDocuments.length);

    const loadingStatus: Record<string, UploadStatus> = {};
    selectedDocuments.forEach((doc) => {
      loadingStatus[doc.attachment.id] = "loading";
    });
    setUploadStatus(loadingStatus);
    showUploadingToast(selectedDocuments.length, zaak.data?.identificatie || "");

    selectedDocuments.forEach((doc, index) => {
      DEBUG(`📋 File ${index + 1}:`, {
        name: doc.attachment.name,
        size: `${Math.round(doc.attachment.size / 1024)}KB`,
        contentType: doc.attachment.contentType,
        attachmentType: doc.attachment.attachmentType,
        isInline: doc.attachment.isInline,
        id: doc.attachment.id.substring(0, 20) + "...",
        metadata: {
          informatieobjecttype: doc.informatieobjecttype,
          vertrouwelijkheidaanduiding: doc.vertrouwelijkheidaanduiding,
          auteur: doc.auteur,
        },
      });
    });

    if (selectedDocuments.length === 0) {
      WARN("⚠️ No documents selected for upload");
      return { error: null };
    }

    try {
      DEBUG("🔧 Initializing GraphService...");
      const graphService = new GraphService(authService, { DEBUG, WARN, ERROR });
      // ToDo: (remove after test on server)
      try {
        await authService.getAccessToken();
        DEBUG("✅ GraphService ready for downloads");
      } catch (authError) {
        ERROR("❌ Graph API authentication failed:", authError);
        throw authError;
      }

      const currentEmail = Office.context.mailbox?.item;
      if (!currentEmail) {
        WARN("⚠️ No email context found");
        return { error: new Error("No email context found") };
      }

      const processedDocuments = await prepareSelectedDocuments(
        selectedDocuments,
        currentEmail,
        graphService
      );

      if (!processedDocuments.length) {
        DEBUG("ℹ️ No documents to upload after processing");
        return { error: null };
      }

      let results;

      try {
        DEBUG("🚀 Starting parallel uploads...", {
          processedCount: processedDocuments.length,
        });

        DEBUG("processedDocuments for results", processedDocuments);
        results = await processAndUploadDocuments({ processedDocuments, zaak, graphService });

        DEBUG("✅ processAndUploadDocuments completed", {
          total: results.length,
        });
      } catch (error) {
        ERROR("❌ processAndUploadDocuments threw an error:", error);
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }

      const uploadPayload = processedDocuments.map((doc, index) => {
        const result = results[index];
        DEBUG("result for document uploadPayload", result);
        DEBUG("doc for document uploadPayload", doc);
        const fileContent = result?.fileContent ?? "";
        let inhoud = "";
        if (fileContent instanceof ArrayBuffer) {
          inhoud = arrayBufferToBase64(fileContent);
        } else if (typeof fileContent === "string") {
          const encoder = new TextEncoder();
          const uint8Array = encoder.encode(fileContent);
          inhoud = arrayBufferToBase64(uint8Array.buffer);
        } else {
          inhoud = "";
        }

        return {
          ...doc,
          zaakidentificatie: zaak.data?.identificatie || "",
          inhoud,
          titel: doc.attachment.name,
        };
      });
      DEBUG("[TRACE] uploadPayload:", uploadPayload);

      DEBUG("🚀 Uploading documents to Zaak via mutation...");

      // Upload each document in parallel, update status as soon as each finishes
      const mutationResults = await Promise.all(
        uploadPayload.map(async (doc, idx) => {
          // ToDo: Remove Test with delay
          // if (doc.titel && doc.titel.endsWith(".eml")) {
          //   await new Promise((res) => setTimeout(res, 2000))
          // }
          const attachmentId = selectedDocuments[idx]?.attachment.id;
          try {
            const result = await mutateAsync(doc);
            setUploadStatus((prev) => ({ ...prev, [attachmentId]: "success" }));
            return { status: "fulfilled", value: result };
          } catch {
            setUploadStatus((prev) => ({ ...prev, [attachmentId]: "error" }));
            return { status: "rejected" };
          }
        })
      );

      const failed = mutationResults.filter((r) => r.status === "rejected").length;

      if (failed > 0) {
        ERROR(`❌ Failed to upload ${failed} documents`);
        showErrorToast(failed, selectedDocuments.length);
        return { error: new Error(`Failed to upload ${failed} documents`) };
      }

      DEBUG("✅ All documents uploaded successfully");
      // In deze app is de e-mail zelf attachmentType === 'item', bijlagen zijn de rest
      const emailSelected = selectedDocuments.some(
        (doc) => doc.attachment.attachmentType === "item" && doc.selected
      );
      const attachmentsSelected = selectedDocuments.filter(
        (doc) => doc.attachment.attachmentType !== "item" && doc.selected
      ).length;

      showSuccessToast(emailSelected, attachmentsSelected);
      // Store upload results locally instead of calling documentAdded (which triggers redirect)
      setUploadedEmail(emailSelected);
      setUploadedAttachments(attachmentsSelected);
      return { error: null };
    } catch (error) {
      ERROR("❌ Upload process failed:", error);
      // Set all selected documents to error status
      const errorStatus: Record<string, "idle" | "loading" | "success" | "error"> = {};
      const currentDocuments = form.getValues("documents");
      currentDocuments?.forEach((doc) => {
        if (doc.selected) {
          errorStatus[doc.attachment.id] = "error";
        }
      });
      setUploadStatus(errorStatus);
      showGeneralErrorToast(error);
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  React.useEffect(() => {
    if (!files.length) return;

    const documents = form.getValues("documents");

    // Only initialize if attachments array is empty or has different length
    if (documents.length !== files.length) {
      const defaultDocuments = files.map(
        (file: Office.AttachmentDetails) =>
          ({
            selected: false,
            vertrouwelijkheidaanduiding: "openbaar",
            informatieobjecttype: "",
            status: "",
            creatiedatum: new Date(),
            zaakidentificatie: zaak.data?.identificatie || "",
            auteur: "",
            attachment: file,
          }) satisfies DocumentSchema
      );

      form.reset({
        documents: defaultDocuments,
      });
      form.trigger();
      setUploadStatus({});
    }
  }, [files, form, zaak.data?.identificatie]);

  const resetUploadState = React.useCallback(() => {
    setUploadStatus({});
    setUploadedEmail(undefined);
    setUploadedAttachments(undefined);
  }, []);

  return {
    form,
    documents,
    handleSubmit,
    zaak,
    hasSelectedDocuments: documents?.some(({ selected }) => selected),
    isUploading,
    uploadStatus,
    uploadedEmail,
    uploadedAttachments,
    resetUploadState,
  };
}
