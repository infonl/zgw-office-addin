/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { addDocumentSchema } from "../../../../hooks/useAddDocumentToZaak";
import { useZaak } from "../../../../provider/ZaakProvider";
import { useOutlook } from "../../../../hooks/useOutlook";
import { graphServiceManager } from "../../../../service/GraphServiceManager";
import { prepareSelectedDocuments } from "../../../../utils/prepareSelectedDocuments";

// Schema definitions
const document = z.discriminatedUnion("selected", [
  addDocumentSchema.extend({
    selected: z.literal(true),
    attachment: z.custom<Office.AttachmentDetails>(),
  }),
  z
    .object({
      selected: z.literal(false),
      attachment: z.custom<Office.AttachmentDetails>(),
    })
    .passthrough(),
]);

export type DocumentSchema = z.infer<typeof document>;
export type TranslateItem = { type: "email" | "attachment"; id: string };

const schema = z.object({
  documents: z.array(document),
});

export type Schema = z.infer<typeof schema>;

export function useOutlookForm() {
  const { zaak } = useZaak();
  const { files } = useOutlook();

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

      // Process each selected document (now with authenticated Graph service)
      const uploadPromises = processedDocuments.map(
        async (doc: DocumentSchema & { graphId: string | null }, index: number) => {
          const attachment = doc.attachment;
          console.log(
            `[Upload to back-end] Processing: ${index + 1}/${processedDocuments.length} ${attachment.name}`
          );

          console.log("[Upload to back-end] Details:", {
            type: attachment.attachmentType,
            size: Math.round(attachment.size / 1024) + "KB",
            contentType: attachment.contentType,
            isEmail: attachment.id.startsWith("EmailItself-"),
          });

          try {
            let fileContent: ArrayBuffer | string;
            const startTime = Date.now();
            let graphId: string | null = doc.graphId;

            if (attachment.id.startsWith("EmailItself-")) {
              if (!graphId) throw new Error("Geen Graph ID voor email gevonden");
              console.log(
                "[EmailItself] Getting email as EML via Graph API for: " + attachment.name
              );
              const emlContent = await graphService.getEmailAsEML(graphId); // string (RFC822)
              fileContent = emlContent;
              const emlBytes = new TextEncoder().encode(emlContent).length;
              const emlSizeMB = Math.round((emlBytes / 1024 / 1024) * 100) / 100;
              console.log(
                "[EmailItself] EML retrieved (raw string): " +
                  attachment.name +
                  " ~" +
                  emlSizeMB +
                  "MB"
              );
            } else {
              // Attachments: download direct via attachmentId (ArrayBuffer), in context van huidig bericht
              if (!graphId) {
                throw new Error("Geen Graph ID voor attachment gevonden");
              }
              // Parent email GraphId ophalen uit geselecteerde documenten
              const parentEmailDoc = processedDocuments.find((d) =>
                d.attachment.id.startsWith("EmailItself-")
              );
              const parentGraphId = parentEmailDoc?.graphId;
              if (!parentGraphId) {
                throw new Error("Geen Graph ID voor parent email gevonden");
              }
              const graphAttachmentId = graphId;
              console.log(
                "[Attachment] Requesting: /me/messages/" +
                  parentGraphId +
                  "/attachments/" +
                  graphAttachmentId +
                  "$/value for " +
                  attachment.name
              );
              const arrayBuffer = await graphService.getAttachmentContent(
                parentGraphId,
                graphAttachmentId
              ); // ArrayBuffer
              fileContent = arrayBuffer;
              const sizeBytes = arrayBuffer.byteLength;
              const sizeMB = Math.round((sizeBytes / 1024 / 1024) * 100) / 100;
              console.log(
                "[Attachment] Attachment downloaded (raw bytes): " +
                  attachment.name +
                  " " +
                  sizeMB +
                  "MB"
              );
            }

            const duration = Date.now() - startTime;
            // Type guard voor metadata
            let metadata = {};
            if (doc.selected) {
              metadata = {
                vertrouwelijkheidaanduiding: doc.vertrouwelijkheidaanduiding,
                informatieobjecttype: doc.informatieobjecttype,
                status: doc.status,
                creatiedatum: doc.creatiedatum,
                auteur: doc.auteur,
              };
            }

            // TODO PZ-8370: Upload to OpenZaak API (backend doet base64)
            const contentSizeBytes =
              typeof fileContent === "string"
                ? new TextEncoder().encode(fileContent).length
                : fileContent.byteLength;

            console.log(`📤 [${attachment.name}] [TODO] Upload to OpenZaak:`, {
              filename: attachment.name,
              contentType:
                attachment.contentType ||
                (attachment.id.startsWith("EmailItself-") ? "message/rfc822" : undefined),
              sizeBytes: contentSizeBytes,
              sizeKB: Math.round(contentSizeBytes / 1024),
              zaakId: zaak.data?.identificatie,
              metadata,
              graphApiDetails: {
                fetchDuration: `${duration}ms`,
                originalSizeHeaderBytes: attachment.size,
                transportFormat: typeof fileContent === "string" ? "string" : "arraybuffer",
              },
            });

            return {
              success: true,
              filename: attachment.name,
              size: contentSizeBytes,
              duration,
            };
          } catch (error) {
            console.error(`❌ [${attachment.name}] Failed to process:`, error);
            console.error(`💥 [${attachment.name}] Error details:`, {
              message: error instanceof Error ? error.message : "Unknown error",
              stack: error instanceof Error ? error.stack?.substring(0, 200) + "..." : undefined,
            });
            return {
              success: false,
              filename: attachment.name,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        }
      );

      // Execute uploads (parallel for efficiency)
      console.log("🚀 Starting parallel uploads...");
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

      const results = await Promise.all(uploadPromises);
      const successful = results.filter((result: { success: boolean }) => result.success);
      const failed = results.filter((result: { success: boolean }) => !result.success);

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
