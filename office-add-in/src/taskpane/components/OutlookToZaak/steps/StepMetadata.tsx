/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { DocumentMetadataPanel } from "./DocumentMetadataPanel";
import {
  Button,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  tokens,
  makeStyles,
  Subtitle1,
  Body1,
} from "@fluentui/react-components";
import { useCommonStyles } from "../../styles/shared";
import { AttachmentFile } from "../../../types/attachment";
import { addDocumentSchema } from "../../../../hooks/useAddDocumentToZaak";
import * as z from "zod";

const documentRowSchema = addDocumentSchema;

export const formValuesSchema = z.object({
  filesById: z.record(z.string(), documentRowSchema.partial()),
  selectedItems: z.array(z.string()),
});

export type FormValues = z.infer<typeof formValuesSchema>;
type DocumentRow = z.infer<typeof documentRowSchema>;

export type SubmitPayload = {
  files: DocumentRow[];
};

type OpenValue = string | number;
type OpenItems = OpenValue | OpenValue[] | undefined;

function getFirstOpenValue(openItems: OpenItems): string | null {
  if (openItems == null) return null;
  const first = Array.isArray(openItems) ? openItems[0] : openItems;
  return first == null ? null : String(first);
}

function handleAccordionToggle(
  openItems: OpenItems,
  setOpenItemPanel: React.Dispatch<React.SetStateAction<string | null>>,
  userCollapsedActionRef: React.MutableRefObject<boolean>
) {
  const next = getFirstOpenValue(openItems);
  userCollapsedActionRef.current = next === null;
  setOpenItemPanel(next);
}

function computeInitialOpenPanel(
  selectedItemIds: string[],
  validityMap: Record<string, boolean>
): string | null {
  if (selectedItemIds.length === 0) return null;
  const firstInvalidPanel = selectedItemIds.find((fileId) => validityMap[fileId] !== true);
  return firstInvalidPanel ?? null;
}

const useAccordionStyles = makeStyles({
  item: {
    marginBlockEnd: 0,
    borderRadius: tokens.borderRadiusNone,
  },
  header: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottomWidth: tokens.strokeWidthThin,
    borderBottomStyle: "solid",
    borderBottomColor: tokens.colorNeutralStroke1,
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
  accordion: {
    marginBlock: tokens.spacingVerticalL,
    marginInline: tokens.spacingHorizontalNone,
  },
});

export function StepMetadata({
  files,
  onBack,
  onSubmit,
}: {
  files: AttachmentFile[];
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [openItemPanel, setOpenItemPanel] = React.useState<string | null>(null);
  const userCollapsedActionRef = React.useRef(false);
  const common = useCommonStyles();
  const accordionStyles = useAccordionStyles();

  const onAccordionToggle = React.useCallback(
    (openItems: OpenItems) =>
      handleAccordionToggle(openItems, setOpenItemPanel, userCollapsedActionRef),
    []
  );

  const { control } = useFormContext<FormValues>();

  const selectedItems = useWatch({ control, name: "selectedItems" });
  const filesById = useWatch({ control, name: "filesById" });

  const isFileValid = React.useCallback(
    (fileId: string) => {
      const fileData = filesById[fileId];
      if (!fileData) return false;

      return documentRowSchema.safeParse(fileData).success;
    },
    [filesById]
  );

  const validityMap = React.useMemo(() => {
    return Object.fromEntries(selectedItems.map((fileId) => [fileId, isFileValid(fileId)]));
  }, [selectedItems, isFileValid]);

  const computedOpenPanel = React.useMemo(
    () => computeInitialOpenPanel(selectedItems, validityMap),
    [selectedItems, validityMap]
  );

  React.useEffect(() => {
    if (openItemPanel && selectedItems.includes(openItemPanel)) return;

    if (openItemPanel === null && userCollapsedActionRef.current) return;

    setOpenItemPanel(computedOpenPanel);
  }, [selectedItems, validityMap, openItemPanel, computedOpenPanel]);

  const fileById = React.useMemo(() => {
    return Object.fromEntries(files.map((file) => [file.id, file]));
  }, [files]);

  const allValid = selectedItems.length > 0 && selectedItems.every((fileId) => isFileValid(fileId));

  return (
    <>
      <section className={common.title}>
        <Subtitle1>Bestandsgegevens</Subtitle1>
        <Body1>Vul bij elk bestand de bijbehorende metadata in.</Body1>
      </section>
      <div>
        <Accordion
          multiple={false}
          collapsible
          openItems={openItemPanel === null ? [] : [openItemPanel]}
          onToggle={(_, { openItems }) => onAccordionToggle(openItems as OpenItems)}
          className={accordionStyles.accordion}
        >
          {selectedItems.map((fileId: string) => {
            return (
              <AccordionItem key={fileId} value={fileId} className={accordionStyles.item}>
                <AccordionHeader className={accordionStyles.header} expandIconPosition="end">
                  <span>{fileById[fileId]?.name ?? fileId}</span>
                  {isFileValid(fileId) && (
                    <span
                      aria-label="volledig"
                      title="Formulier compleet"
                      style={{ marginLeft: 8, color: "green" }}
                    >
                      ✓
                    </span>
                  )}
                </AccordionHeader>
                <AccordionPanel className={accordionStyles.panel}>
                  <DocumentMetadataPanel key={fileId} fileId={fileId} />
                </AccordionPanel>
              </AccordionItem>
            );
          })}
        </Accordion>

        <div style={{ display: "flex", gap: tokens.spacingHorizontalM }}>
          <Button appearance="secondary" type="button" onClick={onBack}>
            Vorige stap
          </Button>
          <Button appearance="primary" type="button" disabled={!allValid} onClick={onSubmit}>
            Bestanden koppelen
          </Button>
        </div>
      </div>
    </>
  );
}
