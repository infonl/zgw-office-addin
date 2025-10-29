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
  selected: string[]; // render- en submit-volgorde
  validById?: Record<string, boolean>; // persistent per-bestand valid-state
};

export type SubmitPayload = {
  files: DocumentRow[];
};

const useAccordionStyles = makeStyles({
  item: {
    marginBlockEnd: tokens.spacingVerticalNone,
    borderRadius: tokens.borderRadiusNone,
  },
  header: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottomWidth: tokens.strokeWidthThin,
    borderBottomStyle: 'solid',
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
  const initialOpenItem = React.useMemo<string | null>(
    () => (files.length ? files[0].id : null),
    [files]
  );
  const [openItem, setOpenItem] = React.useState<string | null>(initialOpenItem);
  const [initialized, setInitialized] = React.useState(false);
  const suppressNextAutoOpenRef = React.useRef(false);
  // Track previous all-valid state to detect transitions precisely
  const prevAllValidRef = React.useRef<boolean>(false);
  const common = useCommonStyles();
  const accordionStyles = useAccordionStyles();

  const form = useForm<FormValues>({
    mode: "onChange",
    shouldUnregister: false,
    defaultValues: initialValues ?? {
      filesById: Object.fromEntries(
        files.map((file) => [file.id, { fileId: file.id, name: file.name }] as const)
      ),
      selected: files.map((file) => file.id),
      validById: {},
    },
  });

  const selected = useWatch({ control: form.control, name: "selected" }) ?? [];
  const filesById =
    useWatch({ control: form.control, name: "filesById" }) ?? ({} as Record<string, DocumentRow>);
  const validById =
    useWatch({ control: form.control, name: "validById" }) ?? ({} as Record<string, boolean>);

  React.useEffect(() => {
    const idSet = new Set(selected);

    // if current selected item is no longer part of the selection, set another one
    if (openItem !== null && !idSet.has(String(openItem))) {
      setOpenItem(selected.length ? selected[0] : null);
    }

    const allValidNow = selected.length > 0 && selected.every((fileId) => validById[fileId] === true);

    // First entry
    if (!initialized) {
      if (allValidNow) {
        // All valid, all closed
        setOpenItem(null);
      } else if (selected.length > 0) {
        const firstInvalid = selected.find((fileId) => validById[fileId] !== true);
        setOpenItem(firstInvalid ?? selected[0]);
      } else {
        setOpenItem(null);
      }
      setInitialized(true);
      prevAllValidRef.current = allValidNow;
      return;
    }

    // collapse all when all valid
    if (prevAllValidRef.current === false && allValidNow === true) {
      setOpenItem(null);
    }

    // Not all-valid
    if (!allValidNow) {
      const firstInvalid = selected.find((fileId) => validById[fileId] !== true);

      if (openItem === null) {
        if (suppressNextAutoOpenRef.current) {
          suppressNextAutoOpenRef.current = false;
        } else if (firstInvalid) {
          setOpenItem(firstInvalid);
        }
      }
    }

    prevAllValidRef.current = allValidNow;
  }, [selected, validById, openItem, initialized]);

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
    const current = form.getValues();
    const nextFilesById: Record<string, DocumentRow> = { ...(current.filesById || {}) };
    // add missing one
    fileIds.forEach((fileId) => {
      if (!nextFilesById[fileId]) {
        nextFilesById[fileId] = { fileId: fileId, name: fileById[fileId]?.name };
      }
    });
    // limit rerenders by checking for actual changes
    const changedMap = JSON.stringify(nextFilesById) !== JSON.stringify(current.filesById || {});
    const nextSelected = fileIds.slice();
    const changedSel = JSON.stringify(nextSelected) !== JSON.stringify(current.selected || []);
    if (changedMap)
      form.setValue("filesById", nextFilesById, { shouldDirty: false, shouldValidate: false });
    if (changedSel)
      form.setValue("selected", nextSelected, { shouldDirty: false, shouldValidate: true });
  }, [fileIds.join("|"), fileById, form]);

  const handleValidityChange = React.useCallback(
    (id: string, isValid: boolean) => {
      const current = form.getValues("validById") || {};
      if (current[id] === isValid) return;

      // update validity in form state
      form.setValue(`validById.${id}` as const, isValid, {
        shouldDirty: false,
        shouldValidate: false,
      });

      // If the current open panel is valid, move to the next invalid (if any)
      if (isValid && id === openItem) {
        const selected = (form.getValues("selected") || []) as string[];
        const validityMap = (form.getValues("validById") || {}) as Record<string, boolean>;
        const nextInvalid = selected.find((fileId) => validityMap[fileId] !== true && fileId !== id);
        if (nextInvalid) setOpenItem(nextInvalid);
        else setOpenItem(null);
      }
    },
    [form, openItem]
  );

  const allValid = selected.length > 0 && selected.every((fileId) => !!validById[fileId]);

  const submit = form.handleSubmit((values) => {
    const files = (values.selected || [])
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
            // always provide an array: [] means nothing open
            openItems={openItem === null ? [] : [openItem]}
            onToggle={(_, data) => {
              const items = Array.isArray(data.openItems)
                ? (data.openItems as (string | number)[])
                : data.openItems == null
                  ? []
                  : [data.openItems as string | number];

              // if closing the last open item, suppress auto-open on next validity change
              if (items.length === 0) {
                suppressNextAutoOpenRef.current = true;
              }

              const next = items[0] ?? null;
              setOpenItem(next === null ? null : String(next));
            }}
            className={accordionStyles.accordion}
          >
            {selected.map((fileId) => {
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
