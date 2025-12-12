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
import { useLogger } from "../../../../hooks/useLogger";
import { useAddDocumentToZaak } from "../../../../hooks/useAddDocumentToZaak";
import { arrayBufferToBase64 } from "../../../../utils/arrayBuffer";

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

      const mutationResults = await Promise.all(
        uploadPayload.map(async (doc) => {
          try {
            const result = await mutateAsync(doc);
            return { status: "fulfilled", value: result };
          } catch (error) {
            return { status: "rejected", reason: error };
          }
        })
      );

      const failed = mutationResults.filter((r) => r.status === "rejected").length;

      if (failed > 0) {
        ERROR(`❌ Failed to upload ${failed} documents`);
        return { error: new Error(`Failed to upload ${failed} documents`) };
      }

      DEBUG("✅ All documents uploaded successfully");
      return { error: null };
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

  // Update zaakidentificatie in all documents when zaak changes
  // React.useEffect(() => {
  //   const currentDocuments = form.getValues("documents");
  //   if (!currentDocuments.length) return;

  //   const zaakId = zaak.data?.identificatie || "";

  //   // Only update if zaakidentificatie has changed
  //   const needsUpdate = currentDocuments.some((doc) => doc.zaakidentificatie !== zaakId);

  //   if (needsUpdate) {
  //     DEBUG("📝 Updating zaakidentificatie in all documents:", zaakId);
  //     const updatedDocuments = currentDocuments.map((doc) => ({
  //       ...doc,
  //       zaakidentificatie: zaakId,
  //     }));
  //     form.setValue("documents", updatedDocuments);
  //   }
  // }, [zaak.data?.identificatie, form, DEBUG]);

  return {
    form,
    documents,
    handleSubmit,
    zaak,
    hasSelectedDocuments: documents?.some(({ selected }) => selected),
  };
}
