/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";

import { useZaak } from "../../../provider/ZaakProvider";
import { StepZaakSearchAndSelect } from "./steps/StepZaakSearchAndSelect";
import { StepMetadata, type FormValues, type SubmitPayload } from "./steps/StepMetadata";
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
  const [metadataValues, setMetadataValues] = React.useState<FormValues | undefined>(undefined);
  const [step, setStep] = React.useState<"searchAndSelect" | "meta">("searchAndSelect");

  const onNext = () => {
    if (nextStepAllowed) setStep("meta");
  };

  const onBack = () => setStep("searchAndSelect");

  const onSubmit = async (payload: SubmitPayload) => {
    // TODO, retrieve data per file from Graph API (maybe convert id's to rest id's), attach metadata forms and submit
    console.log("submit selected files with metadata", payload);
  };

  return (
    <div>
      <div>
        {step === "searchAndSelect" ? (
          <StepZaakSearchAndSelect
            files={files}
            selectedIds={selectedIds}
            onToggle={toggle}
            onNext={onNext}
            hasZaak={hasZaak}
          />
        ) : (
          <StepMetadata
            files={selectedFiles}
            initialValues={metadataValues}
            onBack={onBack}
            onChange={setMetadataValues}
            onSubmit={onSubmit}
          />
        )}
      </div>
    </div>
  );
}

export default OutlookToZaakForm;
