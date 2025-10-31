/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useZaak } from "../../../provider/ZaakProvider";
import { StepZaakSearchAndSelect } from "./steps/StepZaakSearchAndSelect";
import {
  StepMetadata,
  type FormValues,
  type SubmitPayload,
  formValuesSchema,
} from "./steps/StepMetadata";
import { useAttachmentSelection } from "./hooks/useAttachmentSelection";

/**
 * - Step 1: Search Zaak and select email and/or attachments to attach
 * - Step 2: Metadata per selected file
 */

export function OutlookToZaakForm() {
  const { zaak } = useZaak();
  const hasZaak = !!zaak?.data?.identificatie;
  const { files } = useAttachmentSelection();
  const [step, setStep] = React.useState<"searchAndSelect" | "meta">("searchAndSelect");

  const form = useForm<FormValues>({
    resolver: zodResolver(formValuesSchema),
    mode: "onChange",
    shouldUnregister: false,
    defaultValues: {
      filesById: {},
      selectedItems: [],
    },
  });

  const selectedItems = form.watch("selectedItems");
  const selectedFiles = React.useMemo(
    () => files.filter((f) => selectedItems.includes(f.id)),
    [files, selectedItems]
  );
  const nextStepAllowed = hasZaak && selectedItems.length > 0;

  React.useEffect(() => {
    const currentFilesById = form.getValues("filesById");
    const newFiles = selectedItems.filter((fileId) => !currentFilesById[fileId]);

    if (newFiles.length > 0) {
      const newFilesById = Object.fromEntries(
        newFiles.map((fileId) => [
          fileId,
          {
            vertrouwelijkheidaanduiding: "openbaar",
            zaakidentificatie: zaak?.data?.identificatie!,
          },
        ])
      );

      form.setValue("filesById", { ...currentFilesById, ...newFilesById });
    }
  }, [selectedItems, form, zaak?.data?.identificatie]);

  const toggleFileSelection = React.useCallback(
    (fileId: string) => {
      const isSelected = selectedItems.includes(fileId);

      if (isSelected) {
        const updated = selectedItems.filter((id) => id !== fileId);
        form.setValue("selectedItems", updated);
      } else {
        const allFileIds = files.map((f) => f.id);
        const updated = allFileIds.filter((id) => selectedItems.includes(id) || id === fileId);
        form.setValue("selectedItems", updated);
      }
    },
    [selectedItems, form, files]
  );

  const onNext = () => {
    if (nextStepAllowed) setStep("meta");
  };

  const onBack = () => setStep("searchAndSelect");

  const onSubmit = form.handleSubmit((values) => {
    const files = values.selectedItems.map(
      (fileId) => values.filesById[fileId]
    ) as SubmitPayload["files"];

    const payload: SubmitPayload = { files };
    // https://dimpact.atlassian.net/browse/PZ-8370, retrieve data per file from Graph API (maybe convert id's to rest id's), attach metadata forms and submit
    console.log("submit selected files with metadata", payload);
  });

  return (
    <FormProvider {...form}>
      {step === "searchAndSelect" ? (
        <StepZaakSearchAndSelect
          files={files}
          selectedIds={selectedItems}
          onToggle={toggleFileSelection}
          onNext={onNext}
          hasZaak={hasZaak}
        />
      ) : (
        <StepMetadata files={selectedFiles} onBack={onBack} onSubmit={onSubmit} />
      )}
    </FormProvider>
  );
}

export default OutlookToZaakForm;
