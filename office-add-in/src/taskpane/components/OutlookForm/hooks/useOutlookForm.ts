/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { document, DocumentSchema } from "../../../../hooks/types";
import { useZaak } from "../../../../provider/ZaakProvider";
import { useOutlook } from "../../../../hooks/useOutlook";
import { useOffice } from "../../../../hooks/useOffice";
import { graphServiceManager } from "../../../../service/GraphServiceManager";
import { prepareSelectedDocuments } from "../../../../utils/prepareSelectedDocuments";

// Schema definitions
export type TranslateItem = { type: "email" | "attachment"; id: string };

const schema = z.object({
  documents: z.array(document),
});

export type Schema = z.infer<typeof schema>;

export function useOutlookForm() {
  const { zaak } = useZaak();
  const { files } = useOutlook();
  const { processAndUploadDocuments } = useOffice();

  const form = useForm({
    resolver: zodResolver(schema),
    reValidateMode: "onChange",
    mode: "onChange",
    defaultValues: {
      documents: [],
    },
  });

  const documents = form.watch("documents");

  const handleSubmit = async (data: Schema) => {
    const selectedDocuments = data.documents.filter(({ selected }) => selected);
    console.log("🚀 Starting upload of selected documents to OpenZaak:", selectedDocuments.length);

    // Log
    selectedDocuments.forEach((doc, index) => {
      console.log(`📋 File ${index + 1}:`, {
        name: doc.attachment.name,
        size: `${Math.round(doc.attachment.size / 1024)}KB`,
        contentType: doc.attachment.contentType,
        attachmentType: doc.attachment.attachmentType,
        isInline: doc.attachment.isInline,
        id: doc.attachment.id.substring(0, 20) + "...", // Truncate for readability
        metadata: {
          informatieobjecttype: doc.informatieobjecttype,
          vertrouwelijkheidaanduiding: doc.vertrouwelijkheidaanduiding,
          auteur: doc.auteur,
        },
      });
    });

    if (selectedDocuments.length === 0) {
      console.warn("⚠️ No documents selected for upload");
      return;
    }

    try {
      // Use singleton GraphService to avoid concurrent authentication
      console.log("🔧 Getting GraphService instance...");
      let graphService;

      // log if GraphService retrieval fails or succeeds
      // ToDo: (remove after test on server)
      try {
        graphService = await graphServiceManager.getGraphService();
        console.log("✅ GraphService ready for downloads");
      } catch (authError) {
        console.error("❌ Graph API authentication failed:", authError);
        throw authError;
      }

      // Get current email context
      const currentEmail = Office.context.mailbox?.item;
      if (!currentEmail) {
        throw new Error("No email context found");
      }

      // Prepare selected documents with translated Graph IDs
      const processedDocuments = await prepareSelectedDocuments(
        selectedDocuments,
        currentEmail,
        graphService
      );

      console.log("📊 Upload Summary:", {
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

      console.log("🚀 Starting parallel uploads...");
      const results = await processAndUploadDocuments({ processedDocuments, zaak, graphService });
      const successful = results.filter((result) => result.success);
      const failed = results.filter((result) => !result.success);
      const totalDuration = successful.reduce(
        (sum: number, result: { duration?: number }) => sum + (result.duration || 0),
        0
      );
      const avgDuration = successful.length > 0 ? Math.round(totalDuration / successful.length) : 0;
      const totalDataTransferred = successful.reduce(
        (sum: number, result: { size?: number }) => sum + (result.size || 0),
        0
      );
      const throughput =
        totalDuration > 0 ? Math.round(totalDataTransferred / 1024 / (totalDuration / 1000)) : 0;

      console.log("Retrieved Results:", {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        successfulFiles: successful.map((result: { filename: string }) => result.filename),
        failedFiles: failed.map((result: { filename: string; error?: string }) => ({
          filename: result.filename,
          error: result.error,
        })),
        performance: {
          totalDuration: `${totalDuration}ms`,
          averageDuration: `${avgDuration}ms`,
          totalDataTransferred: `${Math.round(totalDataTransferred / 1024)}KB`,
          throughput: `${throughput}KB/s`,
        },
      });

      if (successful.length > 0) {
        console.log(`🎉 Successfully processed ${successful.length} documents!`);
      }

      if (failed.length > 0) {
        console.error(`💥 Failed to process ${failed.length} documents`);
      }
    } catch (error) {
      console.error("❌ Upload process failed:", error);
    }
  };

  // Initialize form with default values when files are available
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
