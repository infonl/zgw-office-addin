/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React, { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
  document,
  DocumentSchema,
  SelectedDocument,
  vertrouwelijkheidaanduidingSchema,
} from "../../../../hooks/types";
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
import { getToken } from "../../../../utils/getAccessToken";

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
  const { mutateAsync } = useAddDocumentToZaak(); // Per-file tracking happens via UploadStatusIcon component using attachment.id
  const { showUploadingToast, showErrorToast, showSuccessToast, showGeneralErrorToast } =
    useUploadToasts();
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    getToken()
      .then(() => setTokenError(false))
      .catch((error) => {
        const errorCode = error?.code;
        setTokenError(error);
        console.log("Token error code:", errorCode);
      });
  }, []);

  const form = useForm({
    resolver: zodResolver(schema),
    reValidateMode: "onChange",
    mode: "onChange",
    defaultValues: {
      documents: [],
    },
  });

  const documents = form.watch("documents");

  const documentTypes = useMemo(
    () => documents?.map((doc) => doc.informatieobjecttype) || [],
    [documents]
  );

  const handleSubmit = async (data: Schema): Promise<SubmitResult> => {
    const selectedDocuments = data.documents.filter(
      ({ selected }) => selected
    ) as SelectedDocument[];
    DEBUG("🚀 Starting upload of selected documents to OpenZaak:", selectedDocuments.length);

    if (selectedDocuments.length === 0) {
      WARN("⚠️ No documents selected for upload");
      return { error: null };
    }

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

      DEBUG("🚀 Uploading documents to Zaak via per-file mutations...");

      // Upload each document in parallel
      // Each call has same mutationKey but different attachment data
      // useMutationState can filter on this to track per-file
      const mutationResults = await Promise.all(
        uploadPayload.map(async (doc) => {
          try {
            const result = await mutateAsync(doc);
            return { status: "fulfilled", value: result };
          } catch {
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
      const emailSelected = selectedDocuments.some(
        (doc) => doc.attachment.attachmentType === "item"
      );
      const attachmentsSelected = selectedDocuments.filter(
        (doc) => doc.attachment.attachmentType !== "item"
      ).length;

      showSuccessToast(emailSelected, attachmentsSelected);
      return { error: null };
    } catch (error) {
      ERROR("❌ Upload process failed:", error);
      // Note: Individual mutation errors are already tracked by TanStack Query
      // This is a catch-all for orchestration-level errors (not file-level errors)
      showGeneralErrorToast();
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
      // Note: TanStack Query mutation states are automatically reset when component unmounts
    }
  }, [files, form, zaak.data?.identificatie]);

  React.useEffect(() => {
    if (!zaak.data?.vertrouwelijkheidaanduiding) return;

    const parsed = vertrouwelijkheidaanduidingSchema.safeParse(
      zaak.data.vertrouwelijkheidaanduiding
    );
    if (!parsed.success) return;

    const currentDocuments = form.getValues("documents");

    currentDocuments.forEach((_, index) => {
      form.setValue(`documents.${index}.vertrouwelijkheidaanduiding`, parsed.data);
    });
  }, [zaak.data?.vertrouwelijkheidaanduiding, form.setValue]);

  React.useEffect(() => {
    if (!zaak.data?.zaakinformatieobjecten) return;

    const currentDocuments = form.getValues("documents");

    currentDocuments.forEach((doc, index) => {
      if (!doc.informatieobjecttype) return;

      // Find matching zaakinformatieobject
      const zio = zaak.data.zaakinformatieobjecten.find((z) => z.url === doc.informatieobjecttype);

      if (zio?.vertrouwelijkheidaanduiding) {
        const parsed = vertrouwelijkheidaanduidingSchema.safeParse(zio.vertrouwelijkheidaanduiding);
        if (parsed.success) {
          const currentValue = form.getValues(`documents.${index}.vertrouwelijkheidaanduiding`);
          if (currentValue !== parsed.data) {
            form.setValue(`documents.${index}.vertrouwelijkheidaanduiding`, parsed.data);
          }
        }
      }
    });
  }, [documentTypes, zaak.data?.zaakinformatieobjecten, form]);

  return {
    form,
    documents,
    handleSubmit,
    zaak,
    hasSelectedDocuments: documents?.some(({ selected }) => selected),
    tokenError,
  };
}
