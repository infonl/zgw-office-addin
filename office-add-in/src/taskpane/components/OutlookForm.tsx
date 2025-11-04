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
import { ZaakSearch } from "./ZaakSearch";

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
    if (!files.length) return;

    const documents = form.getValues("documents");

    // Only initialize if attachments array is empty or has different length
    if (documents.length !== files.length) {
      const defaultDocuments = files.map(
        (file) =>
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

  if (!zaak.data) return <ZaakSearch />;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {step === "selectItems" && (
          <>
            <ZaakSearch />
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
            ZAAKID {zaak.data?.identificatie}
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
  const { zaak } = useZaak();

  const documents = form.watch("documents");
  const defaultOpenItems = React.useMemo(() => {
    return documents
      .filter((document) => document.selected && !addDocumentSchema.safeParse(document).success)
      .map(({ attachment }) => attachment.id);
  }, [documents]);

  return (
    <Accordion collapsible defaultOpenItems={defaultOpenItems}>
      {documents.map(
        (document, index) =>
          // We only render the selected documents
          // We explicitly do not filter before mapping to preserve the index for react-hook-form
          document.selected && (
            <AccordionItem value={document.attachment.id} key={document.attachment.id}>
              <AccordionHeader>
                <section className={styles.accordionHeader}>
                  {document.attachment.name}
                  <DocumentIndicator index={index} />
                </section>
              </AccordionHeader>
              <AccordionPanel>
                <DocumentMetadataFields
                  namePrefix={`documents.${index}.`}
                  zaakinformatieobjecten={zaak.data?.zaakinformatieobjecten ?? []}
                  statuses={documentstatus}
                />
              </AccordionPanel>
            </AccordionItem>
          )
      )}
    </Accordion>
  );
}

function DocumentIndicator(props: { index: number }) {
  const form = useFormContext<Schema>();
  const document = form.watch(`documents.${props.index}`);

  const isValid = addDocumentSchema.safeParse(document).success;

  if (!isValid) return null;

  return <div>✅</div>;
}
