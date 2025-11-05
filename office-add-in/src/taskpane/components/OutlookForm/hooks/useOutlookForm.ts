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
  const [step, setStep] = React.useState<"selectItems" | "metaData">("selectItems");

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

  const handleSubmit = (data: Schema) => {
    console.log("Form data", data);
    const selectedDocuments = data.documents.filter(({ selected }) => selected);
    // TODO https://dimpact.atlassian.net/browse/PZ-8370
    console.log("Submitting", selectedDocuments);
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
    step,
    setStep,
    documents,
    handleSubmit,
    zaak,
    hasSelectedDocuments: documents?.some(({ selected }) => selected),
  };
}
