/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";

import { useZaak } from "../../provider/ZaakProvider";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { addDocumentSchema, documentstatus } from "../../hooks/useAddDocumentToZaak";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Button,
  List,
  ListItem,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useOutlook } from "../../hooks/useOutlook";
import { CheckBox } from "./form/Checkbox";
import { DocumentMetadataFields } from "./DocumentMetadataFields";

/**
 * - Step 1: Search Zaak and select email and/or attachments to attach
 * - Step 2: Metadata per selected file
 */

const useStyles = makeStyles({
  actions: {
    display: "flex",
    gap: tokens.spacingVerticalM,
    marginTop: tokens.spacingHorizontalL,
  },
  accordionHeader: {
    display: "flex",
    flexGrow: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
});

const withAttachmentSchema = addDocumentSchema.extend({
  attachment: z.custom<Office.AttachmentDetails>(),
});

const document = z.discriminatedUnion("selected", [
  withAttachmentSchema.extend({
    selected: z.literal(true),
  }),
  withAttachmentSchema
    .extend({
      selected: z.literal(false),
    })
    .passthrough(),
]);

type DocumentSchema = z.infer<typeof document>;

const schema = z.object({
  documents: z.array(document),
});

type Schema = z.infer<typeof schema>;

export function OutlookForm() {
  const [step, setStep] = React.useState<"selectItems" | "metaData">("selectItems");
  const styles = useStyles();

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
    if (files.length === 0) return;

    const documents = form.getValues("documents");

    // Only initialize if attachments array is empty or has different length
    if (documents.length !== files.length) {
      const defaultDocuments = files.map(
        (file) =>
          ({
            selected: false,
            vertrouwelijkheidaanduiding: "openbaar",
            informatieobjecttype: "",
            status: documentstatus[0],
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

  if (!zaak.data) return null;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {step === "selectItems" && (
          <>
            <SelectItems />
            <section className={styles.actions}>
              <Button
                disabled={!documents?.some(({ selected }) => selected)}
                onClick={() => setStep("metaData")}
              >
                Volgende stap
              </Button>
            </section>
          </>
        )}
        {step === "metaData" && (
          <>
            <Metadata />
            <section className={styles.actions}>
              <Button onClick={() => setStep("selectItems")}>Vorrige stap</Button>
              <Button type="submit" disabled={!form.formState.isValid}>
                Bestanden koppelen
              </Button>
            </section>
          </>
        )}
      </form>
    </FormProvider>
  );
}

export default OutlookForm;

function SelectItems() {
  const form = useFormContext<Schema>();

  const documents = form.watch("documents");

  return (
    <List>
      {documents.map((document, index) => (
        <ListItem key={document.attachment.id}>
          <CheckBox name={`documents.${index}.selected`} label={document.attachment.name} />
        </ListItem>
      ))}
    </List>
  );
}

function Metadata() {
  const form = useFormContext<Schema>();
  const styles = useStyles();

  const documents = form.watch("documents");

  const defaultOpenItems = React.useMemo(() => {
    return documents
      .filter((_document, index) => !!form.formState.errors.documents?.[index])
      .map(({ attachment }) => attachment.id);
  }, [documents, form.formState.errors]);

  return (
    <Accordion multiple={false} defaultOpenItems={defaultOpenItems}>
      {documents.map(
        (document, index) =>
          // We only render the selected documents
          // We explicitly do not filter before mapping to preserve the index for react-hook-form
          document.selected && (
            <AccordionItem value={document.attachment.id} key={document.attachment.id}>
              <AccordionHeader>
                <section className={styles.accordionHeader}>
                  {document.attachment.name}
                  <div>
                    {form.formState.errors.documents?.[index] && " ⚠️"}
                    {!form.formState.errors.documents?.[index] && " ✅"}
                  </div>
                </section>
              </AccordionHeader>
              <AccordionPanel>
                <DocumentMetadataFields
                  namePrefix={`documents.${index}.`}
                  zaakinformatieobjecten={[
                    {
                      url: "https://example.com/informatieobjecttype/1",
                      omschrijving: "Voorbeeld informatieobjecttype",
                    },
                  ]}
                  statuses={documentstatus}
                />
              </AccordionPanel>
            </AccordionItem>
          )
      )}
    </Accordion>
  );
}
