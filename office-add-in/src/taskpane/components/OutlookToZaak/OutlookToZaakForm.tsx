/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React, { useState } from "react";

import { useZaak } from "../../../provider/ZaakProvider";
import { StepZaakSearchAndSelect } from "./steps/StepZaakSearchAndSelect";
import { StepMetadata, type FormValues, type SubmitPayload } from "./steps/StepMetadata";
import { useAttachmentSelection } from "./hooks/useAttachmentSelection";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { addDocumentSchema, documentstatus } from "../../../hooks/useAddDocumentToZaak";
import { SelectTabData, SelectTabEvent, Tab, TabList, TabValue } from "@fluentui/react-components";
import { useOutlook } from "../../../hooks/useOutlook";
import { CheckBox } from "../form/Checkbox";
import { DocumentMetadataPanel } from "./steps/DocumentMetadataPanel";

/**
 * - Step 1: Search Zaak and select email and/or attachments to attach
 * - Step 2: Metadata per selected file
 */

const document = addDocumentSchema.extend({
  selected: z.boolean(),
  attachment: z.custom<Office.AttachmentDetails>(), // type of  Office.AttachmentDetails
});

const schema = z.object({
  documents: z.array(document),
});

type Schema = z.infer<typeof schema>;

export function OutlookToZaakForm() {
  const [selectedValue, setSelectedValue] = React.useState<TabValue>("tab1");
  const { zaak } = useZaak();
  const { files } = useOutlook();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      documents: [],
    },
  });

  const onTabSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    setSelectedValue(data.value);
  };

  // Initialize form with default values when files are available
  React.useEffect(() => {
    if (files.length === 0) return;

    const documents = form.getValues("documents");

    // Only initialize if attachments array is empty or has different length
    if (documents.length !== files.length) {
      const defaultDocuments = files.map((file) => ({
        selected: false,
        vertrouwelijkheidaanduiding: "openbaar",
        informatieobjecttype: "",
        status: documentstatus[0],
        creatiedatum: new Date(),
        zaakidentificatie: zaak.data?.identificatie || "",
        auteur: "",
        attachment: file,
      }));

      console.log("defaultDocuments", files, defaultDocuments, documents);

      form.reset({
        documents: defaultDocuments,
      });
    }
  }, [files, form, zaak.data?.identificatie]);

  if (!zaak.data) return null;

  return (
    <FormProvider {...form}>
      <TabList selectedValue={selectedValue} onTabSelect={onTabSelect}>
        <Tab value="tab1">Selecteer bestanden</Tab>
        <Tab value="tab2">Second Tab</Tab>
      </TabList>
      {selectedValue === "tab1" && <SelectItems />}
      {selectedValue === "tab2" && <Metadata />}
    </FormProvider>
  );
  // const hasZaak = !!zaak?.data?.identificatie;
  // const { files, selectedIds, toggle } = useAttachmentSelection();
  // const nextStepAllowed = hasZaak && selectedIds.length > 0;
  // const selectedFiles = React.useMemo(
  //   () => files.filter((f) => selectedIds.includes(f.id)),
  //   [files, selectedIds]
  // );
  // const [metadataValues, setMetadataValues] = React.useState<FormValues | undefined>(undefined);
  // const [step, setStep] = React.useState<"searchAndSelect" | "meta">("searchAndSelect");

  // const onNext = () => {
  //   if (nextStepAllowed) setStep("meta");
  // };

  // const form = useForm({
  // resolver: zodResolver(schema),
  // })

  // const onBack = () => setStep("searchAndSelect");

  // const onSubmit = async (payload: SubmitPayload) => {
  //   // TODO, retrieve data per file from Graph API (maybe convert id's to rest id's), attach metadata forms and submit
  //   console.log("submit selected files with metadata", payload);
  // };

  // return (
  //   <div>
  //     <div>
  //       {step === "searchAndSelect" ? (
  //         <StepZaakSearchAndSelect
  //           files={files}
  //           selectedIds={selectedIds}
  //           onToggle={toggle}
  //           onNext={onNext}
  //           hasZaak={hasZaak}
  //         />
  //       ) : (
  //         <StepMetadata
  //           files={selectedFiles}
  //           initialValues={metadataValues}
  //           onBack={onBack}
  //           onChange={setMetadataValues}
  //           onSubmit={onSubmit}
  //         />
  //       )}
  //     </div>
  //   </div>
  // );
}

export default OutlookToZaakForm;

function SelectItems() {
  const form = useFormContext<Schema>();

  const documents = form.watch("documents");

  return (
    <section>
      {documents.map((document, index) => (
        <div key={document.attachment.id}>
          <CheckBox name={`documents.${index}.selected`} label={document.attachment.name} />
        </div>
      ))}
    </section>
  );
}

function Metadata() {
  const form = useFormContext<Schema>();

  const documents = form.watch("documents");

  return (
    <section>
      {documents
        .filter((document) => document.selected)
        .map((document) => (
          <div key={document.attachment.id}>
            {document.attachment.name}
            <ol>
              <li>{document.auteur}</li>
              <li>{document.informatieobjecttype}</li>
              <li>{document.vertrouwelijkheidaanduiding}</li>
              <li>{document.zaakidentificatie}</li>
              <li>{document.status}</li>
            </ol>
          </div>
        ))}
    </section>
  );
}
