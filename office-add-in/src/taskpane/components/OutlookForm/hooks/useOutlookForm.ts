/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { document, DocumentSchema, SelectedDocument } from "../../../../hooks/types";
import { useZaak } from "../../../../provider/ZaakProvider";
import { useOutlook } from "../../../../hooks/useOutlook";
import { useOffice } from "../../../../hooks/useOffice";
import { GraphService } from "../../../../graph";
import { useAuth } from "../../../../provider/AuthProvider";
import { prepareSelectedDocuments } from "../../../../utils/prepareSelectedDocuments";
import { useUploadDocumentsToZaak } from "../../../../hooks/useUploadDocumentsToZaak";
import { useLogger } from "../../../../hooks/useLogger";

export type TranslateItem = { type: "email" | "attachment"; id: string };

const schema = z.object({
  documents: z.array(document),
});

export type Schema = z.infer<typeof schema>;

export type SubmitResult = {
  error: Error | null;
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

export function useOutlookForm() {
  const { authService } = useAuth();
  const { zaak } = useZaak();
  const { files } = useOutlook();
  const { processAndUploadDocuments } = useOffice();
  const { uploadDocumentsToZaak } = useUploadDocumentsToZaak();
  const { DEBUG, WARN, ERROR } = useLogger(useOutlookForm.name);

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

      DEBUG("📊 Upload Summary:", {
        totalFiles: selectedDocuments.length,
        emailFiles: selectedDocuments.filter((doc) => doc.attachment.id.startsWith("EmailItself-"))
          .length,
        attachmentFiles: selectedDocuments.filter(
          (doc) => !doc.attachment.id.startsWith("EmailItself-")
        ).length,
        totalSizeKB: Math.round(
          selectedDocuments.reduce((sum, doc) => sum + doc.attachment.size, 0) / 1024
        ),
      });

      let results;

      try {
        DEBUG("🚀 Starting parallel uploads...", {
          processedCount: processedDocuments.length,
        });

        results = await processAndUploadDocuments({ processedDocuments, zaak, graphService });

        DEBUG("✅ processAndUploadDocuments completed", {
          total: results.length,
        });
      } catch (error) {
        ERROR("❌ processAndUploadDocuments threw an error:", error);
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }

      const successfulFiles = results
        .map((result, index) => (result.success ? processedDocuments[index].attachment.name : null))
        .filter((name) => !!name);
      const failedFiles = results
        .map((result, index) =>
          !result.success
            ? { filename: processedDocuments[index].attachment.name, error: result.error }
            : null
        )
        .filter((item) => !!item);
      const totalDuration = results.reduce((sum, result) => sum + (result.duration || 0), 0);
      const avgDuration = results.length > 0 ? Math.round(totalDuration / results.length) : 0;
      const totalDataTransferred = results.reduce((sum, result) => sum + (result.size || 0), 0);
      const throughput =
        totalDuration > 0 ? Math.round(totalDataTransferred / 1024 / (totalDuration / 1000)) : 0;

      DEBUG("Client download results:", {
        total: results.length,
        successfulFiles,
        failedFiles,
        performance: {
          totalDuration: `${totalDuration}ms`,
          averageDuration: `${avgDuration}ms`,
          totalDataTransferred: `${Math.round(totalDataTransferred / 1024)}KB`,
          throughput: `${throughput}KB/s`,
        },
      });

      const uploadPayload = processedDocuments.map((doc, index) => {
        const result = results[index];
        const fileContent = result?.fileContent ?? "";
        let inhoud = "";
        if (fileContent instanceof ArrayBuffer) {
          inhoud = arrayBufferToBase64(fileContent);
        } else if (typeof fileContent === "string") {
          const encoder = new TextEncoder();
          const uint8Array = encoder.encode(fileContent);
          const binary = String.fromCharCode(...Array.from(uint8Array));
          inhoud = btoa(binary);
        } else {
          inhoud = "";
        }

        return {
          ...doc,
          inhoud,
          titel: doc.attachment.name,
        };
      });
      DEBUG("[TRACE] uploadPayload:", uploadPayload);

      let uploadResults = [];
      try {
        uploadResults = await uploadDocumentsToZaak({ zaak, documents: uploadPayload });
        DEBUG("[TRACE] uploadDocumentsToZaak results:", uploadResults);
      } catch (error) {
        DEBUG("[ERROR] uploadDocumentsToZaak failed:", error);
        uploadResults = uploadPayload.map(() => null);
      }

      // Genereer uploadFailedFiles direct na uploadResults
      const uploadSuccessfulFiles: string[] = [];
      const uploadFailedFiles: { document: (typeof uploadPayload)[0]; error: unknown }[] = [];
      uploadPayload.forEach((doc, index) => {
        if (uploadResults[index]) {
          uploadSuccessfulFiles.push(doc.titel);
        } else {
          uploadFailedFiles.push({ document: doc, error: uploadResults[index] });
        }
      });

      DEBUG("Backend upload results:", {
        total: uploadResults.length,
        successfulFiles: uploadSuccessfulFiles,
        failedFiles: uploadFailedFiles,
      });

      if (uploadSuccessfulFiles.length > 0) {
        DEBUG(`🎉 Successfully uploaded ${uploadSuccessfulFiles.length} documents!`);
      }

      if (uploadFailedFiles.length > 0) {
        const error = new Error(`Failed to upload ${uploadFailedFiles.length} documents`);
        ERROR("❌ Upload process completed with failed documents");
        return { error };
      }

      return { error: null }; // all successful
    } catch (error) {
      ERROR("❌ Upload process failed:", error);
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
    }
  }, [files, form, zaak.data?.identificatie]);

  return {
    form,
    documents,
    handleSubmit,
    zaak,
    hasSelectedDocuments: documents?.some(({ selected }) => selected),
  };
}
