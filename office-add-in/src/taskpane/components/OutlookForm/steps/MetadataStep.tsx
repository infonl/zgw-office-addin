/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  makeStyles,
  tokens,
  Subtitle1,
  Body1,
  Body1Strong,
} from "@fluentui/react-components";
import { useFormContext } from "react-hook-form";
import { addDocumentSchema, documentstatus } from "../../../../hooks/types";
import { useZaak } from "../../../../provider/ZaakProvider";
import { DocumentMetadataFields } from "../../DocumentMetadataFields";
import { DocumentIndicator } from "./DocumentIndicator";
import { UploadStatusIcon } from "./UploadStatusIcon";
import { Schema } from "../hooks/useOutlookForm";
import { useCommonStyles } from "../../styles/shared";

const useStyles = makeStyles({
  accordion: {
    marginBlock: tokens.spacingVerticalL,
    marginInline: tokens.spacingHorizontalNone,
  },
  item: {
    marginBlockEnd: 0,
    borderRadius: tokens.borderRadiusNone,
    borderBottomWidth: tokens.strokeWidthThin,
    borderBottomStyle: "solid",
    borderBottomColor: tokens.colorNeutralStroke1,
  },
  header: {
    backgroundColor: tokens.colorNeutralBackground2,
    minHeight: tokens.spacingVerticalXXL,
    paddingBlock: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusNone,
  },
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    marginBlock: tokens.spacingVerticalM,
    marginInline: tokens.spacingHorizontalNone,
  },
  accordionHeader: {
    display: "flex",
    flexGrow: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  table: {
    width: "100%",
    marginTop: tokens.spacingVerticalS,
    background: tokens.colorNeutralForegroundInverted,
    borderBottom: `1px solid ${tokens.colorBrandForegroundLink}`,
  },
  statusIconContainer: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  metadataSection: {
    marginTop: tokens.spacingVerticalM,
  },
  fieldsetReset: {
    border: 0,
    margin: 0,
    padding: 0,
    "&[disabled] *": {
      color: tokens.colorNeutralForegroundDisabled,
    },
  },
});

type MetadataStepProps = {
  isUploading?: boolean;
};

export function MetadataStep({ isUploading = false }: MetadataStepProps) {
  const form = useFormContext<Schema>();
  const styles = useStyles();
  const common = useCommonStyles();
  const { zaak } = useZaak();

  const documents = form.watch("documents");

  // Check if any document is currently being uploaded (has pending mutations)
  const hasUploadActivity = isUploading;

  const defaultOpenItems = React.useMemo(() => {
    return documents
      .filter((document) => document.selected && !addDocumentSchema.safeParse(document).success)
      .map(({ attachment }) => attachment.id);
  }, [documents]);

  return (
    <>
      <section className={common.title}>
        <Subtitle1>Bestandsgegevens</Subtitle1>
      </section>
      <section className={styles.metadataSection}>
        <table className={styles.table}>
          <tbody>
            <tr>
              <td>
                <Body1Strong>Zaaknummer</Body1Strong>
              </td>
              <td>{zaak.data?.identificatie}</td>
            </tr>
          </tbody>
        </table>
      </section>
      {!hasUploadActivity && (
        <section className={common.title}>
          <Body1>Vul bij elk bestand de bijbehorende metadata in.</Body1>
        </section>
      )}
      <Accordion collapsible defaultOpenItems={defaultOpenItems} className={styles.accordion}>
        {documents.map(
          (document, index) =>
            // Only render the selected documents
            // No filtering before mapping to preserve the index for react-hook-form
            document.selected && (
              <AccordionItem
                value={document.attachment.id}
                key={document.attachment.id}
                className={styles.item}
              >
                <AccordionHeader className={styles.header} expandIconPosition="end">
                  <section className={styles.accordionHeader}>
                    <div className={styles.statusIconContainer}>
                      <UploadStatusIcon attachmentId={document.attachment.id} />
                      {document.attachment.name}
                    </div>

                    {!hasUploadActivity && <DocumentIndicator index={index} />}
                  </section>
                </AccordionHeader>
                <AccordionPanel className={styles.panel}>
                  <fieldset disabled={hasUploadActivity} className={styles.fieldsetReset}>
                    <DocumentMetadataFields
                      namePrefix={`documents.${index}.`}
                      zaakinformatieobjecten={zaak.data?.zaakinformatieobjecten ?? []}
                      statuses={documentstatus}
                    />
                  </fieldset>
                </AccordionPanel>
              </AccordionItem>
            )
        )}
      </Accordion>
    </>
  );
}
