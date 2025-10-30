/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
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

type DocumentRow = {
  fileId: string;
  name?: string;
  auteur?: string;
  informatieobjecttype?: string;
  vertrouwelijkheidaanduiding?: string;
  creatiedatum?: string | Date;
  status?: string;
};

export type FormValues = {
  filesById: Record<string, DocumentRow>;
  selectedItems: string[];
  validById?: Record<string, boolean>;
};

export type SubmitPayload = {
  files: DocumentRow[];
};

type OpenValue = string | number;
type OpenItems = OpenValue | OpenValue[] | undefined;

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

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
    marginBlockEnd: tokens.spacingVerticalNone,
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
  initialValues,
  onBack,
  onChange,
  onSubmit,
}: {
  files: AttachmentFile[];
  initialValues?: FormValues;
  onBack: () => void;

  onChange?: (_values: FormValues) => void;
  onSubmit: (_values: SubmitPayload) => Promise<void> | void;
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

  const form = useForm<FormValues>({
    mode: "onChange",
    shouldUnregister: false,
    defaultValues: initialValues ?? {
      filesById: Object.fromEntries(
        files.map((file) => [file.id, { fileId: file.id, name: file.name }] as const)
      ),
      selectedItems: files.map((file) => file.id),
      validById: {},
    },
  });

  const selectedItems = useWatch({ control: form.control, name: "selectedItems" }) ?? [];
  const filesById =
    useWatch({ control: form.control, name: "filesById" }) ?? ({} as Record<string, DocumentRow>);
  const validById =
    useWatch({ control: form.control, name: "validById" }) ?? ({} as Record<string, boolean>);

  // Calculate open panel
  React.useEffect(() => {
    if (openItemPanel && selectedItems.includes(openItemPanel)) return;

    if (openItemPanel === null && userCollapsedActionRef.current) return;

    const next = computeInitialOpenPanel(selectedItems, validById);
    setOpenItemPanel(next);
  }, [selectedItems, validById, openItemPanel]);

  const fileIds = React.useMemo(() => files.map((file) => file.id), [files]);
  const fileById = React.useMemo(() => {
    return Object.fromEntries(files.map((file) => [file.id, file]));
  }, [files]);

  const getDisplayName = React.useCallback(
    (fileId: string): string => {
      const fromForm = filesById[fileId]?.name;
      return fromForm ?? fileById[fileId]?.name ?? fileId;
    },
    [filesById, fileById]
  );

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      onChange?.(values as FormValues);
    });
    return () => {
      subscription?.unsubscribe?.();
    };
  }, [form, onChange]);

  // Key-based sync: add new id's to filesById (not removing existing ones)
  React.useEffect(() => {
    const currentFormValues = form.getValues();
    const currentFilesById = currentFormValues.filesById ?? {};

    let addedMissingFile = false;
    const nextFilesById: Record<string, DocumentRow> = { ...currentFilesById };

    for (const fileId of fileIds) {
      if (!nextFilesById[fileId]) {
        nextFilesById[fileId] = { fileId, name: fileById[fileId]?.name };
        addedMissingFile = true;
      }
    }

    if (addedMissingFile) {
      form.setValue("filesById", nextFilesById, { shouldDirty: false, shouldValidate: false });
    }

    // Keep  same order
    const nextSelectedItems = fileIds;
    const currentSelectedItems = currentFormValues.selectedItems ?? [];

    if (!arraysEqual(nextSelectedItems, currentSelectedItems)) {
      form.setValue("selectedItems", nextSelectedItems, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [fileIds, fileById, form]);

  const handleValidityChange = React.useCallback(
    (id: string, isValid: boolean) => {
      const current = form.getValues("validById") || {};
      if (current[id] === isValid) return;
      form.setValue(`validById.${id}` as const, isValid, {
        shouldDirty: false,
        shouldValidate: false,
      });
    },
    [form]
  );

  const allValid = selectedItems.length > 0 && selectedItems.every((fileId) => !!validById[fileId]);

  const submit = form.handleSubmit((values) => {
    const files = (values.selectedItems || [])
      .map((fileId) => values.filesById[fileId])
      .filter((row): row is DocumentRow => Boolean(row));

    const payload: SubmitPayload = { files };
    onSubmit(payload);
  });

  return (
    <>
      <section className={common.title}>
        <Subtitle1>Bestandsgegevens</Subtitle1>
        <Body1>Vul bij elk bestand de bijbehorende metadata in.</Body1>
      </section>
      <FormProvider {...form}>
        <form onSubmit={submit}>
          <Accordion
            multiple={false}
            collapsible
            openItems={openItemPanel === null ? [] : [openItemPanel]}
            onToggle={(_, { openItems }) => onAccordionToggle(openItems as OpenItems)}
            className={accordionStyles.accordion}
          >
            {selectedItems.map((fileId) => {
              const displayName = getDisplayName(fileId);
              return (
                <AccordionItem key={fileId} value={fileId} className={accordionStyles.item}>
                  <AccordionHeader className={accordionStyles.header} expandIconPosition="end">
                    <span>{displayName}</span>
                    {validById[fileId] && (
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
                    <DocumentMetadataPanel
                      key={fileId}
                      fileId={fileId}
                      onValidityChange={handleValidityChange}
                    />
                  </AccordionPanel>
                </AccordionItem>
              );
            })}
          </Accordion>

          <div style={{ display: "flex", gap: tokens.spacingHorizontalM }}>
            <Button appearance="secondary" type="button" onClick={onBack}>
              Vorige stap
            </Button>
            <Button appearance="primary" type="submit" disabled={!allValid}>
              Bestanden koppelen
            </Button>
          </div>
        </form>
      </FormProvider>
    </>
  );
}
