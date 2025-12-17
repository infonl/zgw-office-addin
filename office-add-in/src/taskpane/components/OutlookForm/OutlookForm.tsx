/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { Button, makeStyles, tokens } from "@fluentui/react-components";
import { FormProvider } from "react-hook-form";
import { useMutationState, useQueryClient } from "@tanstack/react-query";
import { ZaakSearch } from "../ZaakSearch";
import { SelectItems } from "./steps/SelectItems";
import { MetadataStep } from "./steps/MetadataStep";
import { UploadResultMessageBar } from "./components/UploadResultMessageBar";
import { useOutlookForm } from "./hooks/useOutlookForm";
import { useZaak } from "../../../provider/ZaakProvider";
import { useOffice } from "../../../hooks/useOffice";

/**
 * - Step 1: Search Zaak and select email and/or attachments to attach
 * - Step 2: Metadata per selected file
 */

const useStyles = makeStyles({
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingHorizontalL,
  },
  resultSection: {
    marginTop: tokens.spacingHorizontalL,
    maxWidth: "100%",
    overflow: "hidden",
  },
});

export function OutlookForm() {
  const styles = useStyles();
  const [step, setStep] = React.useState<"selectItems" | "metaData">("selectItems");
  const {
    form,
    zaak,
    hasSelectedDocuments,
    handleSubmit,
    uploadedEmail,
    uploadedAttachments,
    resetUploadState,
  } = useOutlookForm();
  const { reset: resetZaak, setZaakToSearch } = useZaak();
  const queryClient = useQueryClient();

  const allMutationStates = useMutationState({
    filters: { mutationKey: ["upload_document"] },
  });

  // Calculate isUploading directly from mutation states (same source as uploadedIds/failedIds)
  // Disabled while mutations are: pending, success, or error (anything != idle)
  const isUploading = allMutationStates.some((state) => state.status !== "idle");

  const failedIds = allMutationStates
    .filter((state) => state.status === "error" && state.variables)
    .map(
      (state) => (state.variables as unknown as { attachment?: { id?: string } })?.attachment?.id
    )
    .filter(Boolean) as string[];

  const handleReset = React.useCallback(() => {
    form.reset();
    resetUploadState();
    resetZaak();
    setZaakToSearch("");
    queryClient.getMutationCache().clear();
    setStep("selectItems");
  }, [form, resetUploadState, resetZaak, setZaakToSearch, queryClient]);
  const { isInBrowser } = useOffice();

  // in desktop apps, closing the taskpane via a button is not supported.
  const canCloseTaskpane = React.useMemo(
    () => isInBrowser && !!window.Office?.context?.ui?.closeContainer,
    [isInBrowser]
  );

  const handleClose = React.useCallback(() => {
    window.Office?.context?.ui?.closeContainer?.();
  }, []);

  const uploadComplete = uploadedEmail !== undefined && uploadedAttachments !== undefined;
  const uploadError = failedIds.length > 0;
  const uploadSuccess = uploadComplete && failedIds.length === 0;
  const errorCount = failedIds.length;

  if (!zaak.data) return <ZaakSearch />;

  return (
    <>
      {step === "selectItems" && <ZaakSearch />}
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {step === "selectItems" && (
            <>
              <SelectItems />
              <section className={styles.actions}>
                <Button
                  appearance="primary"
                  disabled={!hasSelectedDocuments}
                  onClick={() => setStep("metaData")}
                >
                  Volgende stap: bestandsgegevens
                </Button>
              </section>
            </>
          )}
          {step === "metaData" && (
            <>
              <MetadataStep isUploading={isUploading} />
              {uploadComplete && (
                <section className={styles.resultSection}>
                  <UploadResultMessageBar
                    uploadSuccess={uploadSuccess}
                    uploadError={uploadError}
                    errorCount={errorCount}
                    uploadedEmail={uploadedEmail}
                    uploadedAttachments={uploadedAttachments}
                  />
                  <div className={styles.actions}>
                    <Button appearance="primary" onClick={handleReset}>
                      Volgende koppeling
                    </Button>
                    {canCloseTaskpane && (
                      <Button appearance="secondary" onClick={handleClose}>
                        Sluiten
                      </Button>
                    )}
                  </div>
                </section>
              )}

              {!uploadComplete && (
                <section className={styles.actions}>
                  <Button
                    appearance="secondary"
                    type="button"
                    onClick={() => setStep("selectItems")}
                    disabled={isUploading}
                  >
                    Vorige stap
                  </Button>
                  <Button
                    appearance="primary"
                    type="submit"
                    disabled={!form.formState.isValid || isUploading}
                  >
                    {isUploading ? "Bestanden koppelen..." : "Bestanden koppelen"}
                  </Button>
                </section>
              )}
            </>
          )}
        </form>
      </FormProvider>
    </>
  );
}

export default OutlookForm;
