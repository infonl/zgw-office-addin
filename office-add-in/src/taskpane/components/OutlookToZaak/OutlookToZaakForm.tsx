/*
 * SPDX-FileCopyrightText: 2025 INFO
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { tokens } from "@fluentui/react-components";

import { useZaak } from "../../../provider/ZaakProvider";
import { StepZaakSearchAndSelect } from "./steps/StepZaakSearchAndSelect";
import { StepMetadata } from "./steps/StepMetadata";
import { useAttachmentSelection } from "./hooks/useAttachmentSelection";

/**
 * - Step 1: Search Zaak and select email and/or attachments to attach
 * - Step 2: Metadata per selected file
 */

export function OutlookToZaakForm() {
  const [step, setStep] = React.useState<"searchAndSelect" | "meta">("searchAndSelect");

  const { zaak } = useZaak();
  const hasZaak = !!zaak?.data?.identificatie;

  const { files, selectedIds, toggle } = useAttachmentSelection();

  const nextStepAllowed = hasZaak && selectedIds.length > 0;

  const onNext = () => {
    if (nextStepAllowed) setStep("meta");
  };

  const onBack = () => setStep("searchAndSelect");

  const onSubmit = async () => {
    // TODO, retrieve data per file from Graph API, attach metadata forms and submit
    console.log("submit selected files", selectedIds);
  };

  return (
    <div
      style={{ paddingLeft: tokens.spacingHorizontalL, paddingRight: tokens.spacingHorizontalL }}
    >
      <div style={{ marginTop: tokens.spacingVerticalL }}>
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
            files={files.filter((f: { id: string }) => selectedIds.includes(f.id))}
            onBack={onBack}
            onSubmit={onSubmit}
          />
        )}
      </div>
    </div>
  );
}

export default OutlookToZaakForm;
