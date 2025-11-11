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
import { graphServiceManager } from "../../../../service/GraphServiceSingleton";

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
    console.log("🚀 Starting upload of selected documents:", selectedDocuments.length);

    // Test: vergelijk Office itemId met Graph message IDs
    const currentEmail = Office.context.mailbox?.item;
    if (currentEmail) {
      try {
        const graphService = await graphServiceManager.getGraphService();
        const graphId = await graphService.findGraphMessageIdByOfficeId(currentEmail.itemId, {
          subject: currentEmail.subject,
          sender: currentEmail.from?.emailAddress,
          receivedDateTime: currentEmail.dateTimeCreated?.toISOString(),
        });
        console.log("🔎 [Test] Graph ID match voor Office itemId:", {
          officeItemId: currentEmail.itemId,
          graphId,
        });
      } catch (e) {
        console.warn("[Test] Kan Graph ID niet vinden voor Office itemId:", e);
      }
    }

    // Log detailed information about each selected file
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

      try {
        graphService = await graphServiceManager.getGraphService();
        console.log("✅ GraphService ready for uploads");
      } catch (authError) {
        console.error("❌ Graph API authentication failed:", authError);

        // Check if this is a known authentication issue
        if (authError instanceof Error) {
          if (authError.message.includes("13006") || authError.message.includes("13008")) {
            console.log("💡 Falling back to Office.js attachment access (limited functionality)");
            console.warn("⚠️ Graph API uploads disabled due to authentication issues");
            console.info("ℹ️ This is expected in development/testing environments");
            console.info("ℹ️ Office.js can still access attachment metadata and basic file info");
            console.info(
              "ℹ️ For full Graph API functionality, ensure proper Office 365 SSO configuration"
            );
            return;
          }
        }

        throw authError;
      }

      // Get current email context
      const currentEmail = Office.context.mailbox?.item;
      if (!currentEmail) {
        throw new Error("No email context found");
      }

      // Log Office.js email context information
      console.log("📧 Office.js Email Context:", {
        subject: currentEmail.subject,
        itemId: currentEmail.itemId.substring(0, 30) + "...",
        attachmentsCount: currentEmail.attachments?.length || 0,
        attachments:
          currentEmail.attachments?.map((a) => ({
            id: a.id.substring(0, 20) + "...",
            name: a.name,
            size: `${Math.round(a.size / 1024)}KB`,
            type: a.attachmentType,
          })) || [],
      });

      // Process each selected document (now with authenticated Graph service)
      const uploadPromises = selectedDocuments.map(async (doc, index) => {
        const attachment = doc.attachment;
        console.log(`📥 [${index + 1}/${selectedDocuments.length}] Processing: ${attachment.name}`);
        console.log(`🔍 [${attachment.name}] Details:`, {
          type: attachment.attachmentType,
          size: `${Math.round(attachment.size / 1024)}KB`,
          contentType: attachment.contentType,
          isEmail: attachment.id.startsWith("EmailItself-"),
        });

        try {
          let base64Content: string;
          const startTime = Date.now();

          // Check if it's the email itself or a file attachment
          if (attachment.id.startsWith("EmailItself-")) {
            console.log(`📧 [${attachment.name}] Getting email as EML via Graph API...`);
            const emlContent = await graphService.getEmailAsEML(currentEmail.itemId);
            const emlSizeMB = Math.round((emlContent.length / 1024 / 1024) * 100) / 100;
            console.log(`📧 [${attachment.name}] EML retrieved: ${emlSizeMB}MB raw content`);

            console.log(`🔄 [${attachment.name}] Converting EML to base64...`);
            base64Content = graphService.emlToBase64(emlContent);
            const base64SizeMB = Math.round((base64Content.length / 1024 / 1024) * 100) / 100;
            console.log(`✅ [${attachment.name}] EML converted: ${base64SizeMB}MB base64`);
          } else {
            console.log(`📎 [${attachment.name}] Getting attachment content via Graph API...`);
            console.log(
              `📎 [${attachment.name}] Requesting: /me/messages/${currentEmail.itemId}/attachments/${attachment.id}/$value`
            );

            base64Content = await graphService.getAttachmentContent(
              currentEmail.itemId,
              attachment.id
            );
            const sizeMB = Math.round((base64Content.length / 1024 / 1024) * 100) / 100;
            console.log(`✅ [${attachment.name}] Attachment downloaded: ${sizeMB}MB base64`);
          }

          const duration = Date.now() - startTime;
          console.log(`⏱️ [${attachment.name}] Graph API fetch completed in ${duration}ms`);

          // TODO PZ-8370: Upload to OpenZaak API
          console.log(`📤 [${attachment.name}] [TODO] Upload to OpenZaak:`, {
            filename: attachment.name,
            contentType: attachment.contentType,
            size: `${Math.round(base64Content.length / 1024)}KB`,
            zaakId: zaak.data?.identificatie,
            metadata: {
              vertrouwelijkheidaanduiding: doc.vertrouwelijkheidaanduiding,
              informatieobjecttype: doc.informatieobjecttype,
              status: doc.status,
              creatiedatum: doc.creatiedatum,
              auteur: doc.auteur,
            },
            graphApiDetails: {
              fetchDuration: `${duration}ms`,
              base64Size: base64Content.length,
              originalSize: attachment.size,
              compressionRatio: Math.round((base64Content.length / attachment.size) * 100) + "%",
            },
          });

          return {
            success: true,
            filename: attachment.name,
            size: base64Content.length,
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
      });

      // Execute uploads (parallel for efficiency)
      console.log("🚀 Starting parallel uploads...");
      console.log("📊 Upload Summary:", {
        totalFiles: selectedDocuments.length,
        emailFiles: selectedDocuments.filter((d) => d.attachment.id.startsWith("EmailItself-"))
          .length,
        attachmentFiles: selectedDocuments.filter(
          (d) => !d.attachment.id.startsWith("EmailItself-")
        ).length,
        totalSizeKB: Math.round(
          selectedDocuments.reduce((sum, d) => sum + d.attachment.size, 0) / 1024
        ),
      });

      const results = await Promise.all(uploadPromises);

      // Report results with detailed analysis
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      // Calculate performance metrics
      const totalDuration = successful.reduce((sum, r) => sum + (r.duration || 0), 0);
      const avgDuration = successful.length > 0 ? Math.round(totalDuration / successful.length) : 0;
      const totalDataTransferred = successful.reduce((sum, r) => sum + (r.size || 0), 0);
      const throughput =
        totalDuration > 0 ? Math.round(totalDataTransferred / 1024 / (totalDuration / 1000)) : 0;

      console.log("📊 Upload Results:", {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        successfulFiles: successful.map((r) => r.filename),
        failedFiles: failed.map((r) => ({ filename: r.filename, error: r.error })),
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
