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
  const { files, selectedIds, toggle } = useAttachmentSelection();
  const nextStepAllowed = hasZaak && selectedIds.length > 0;
  const selectedFiles = React.useMemo(
    () => files.filter((f) => selectedIds.includes(f.id)),
    [files, selectedIds]
  );
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

  React.useEffect(() => {
    const currentFilesById = form.getValues("filesById");
    const currentSelectedItems = form.getValues("selectedItems");

    const newFiles = selectedFiles.filter((file) => !currentFilesById[file.id]);
    const newFilesById = Object.fromEntries(
      newFiles.map((file) => [
        file.id,
        {
          vertrouwelijkheidaanduiding: "openbaar",
          zaakidentificatie: zaak?.data?.identificatie!,
        },
      ])
    );

    const filesById = { ...currentFilesById, ...newFilesById };
    const selectedItems = selectedFiles.map((file) => file.id);

    const selectedItemsChanged =
      currentSelectedItems.length !== selectedItems.length ||
      currentSelectedItems.some((id, index) => id !== selectedItems[index]);

    if (selectedItemsChanged) {
      form.setValue("selectedItems", selectedItems, { shouldDirty: false });
    }

    const hasNewFiles = newFiles.length > 0;
    if (hasNewFiles) {
      form.setValue("filesById", filesById, { shouldDirty: false });
    }
  }, [selectedFiles, form]);

  const onNext = () => {
    if (nextStepAllowed) setStep("meta");
  };

  const onBack = () => setStep("searchAndSelect");

  const onSubmit = React.useCallback(() => {
    const values = form.getValues();
    const files = values.selectedItems
      .map((fileId) => values.filesById[fileId])
      .filter((row): row is SubmitPayload["files"][number] => Boolean(row));

    const payload: SubmitPayload = { files };
    // https://dimpact.atlassian.net/browse/PZ-8370, retrieve data per file from Graph API (maybe convert id's to rest id's), attach metadata forms and submit
    console.log("submit selected files with metadata", payload);
  }, [form]);

  return (
    <FormProvider {...form}>
      {step === "searchAndSelect" ? (
        <StepZaakSearchAndSelect
          files={files}
          selectedIds={selectedIds}
          onToggle={toggle}
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
