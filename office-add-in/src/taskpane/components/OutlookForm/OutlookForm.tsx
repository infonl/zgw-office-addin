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
import { DocumentSchema } from "../../../hooks/types";

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
  const { form, zaak, hasSelectedDocuments, handleSubmit } = useOutlookForm();
  const { reset: resetZaak, setZaakToSearch } = useZaak();
  const queryClient = useQueryClient();

  const allMutationStates = useMutationState({
    filters: { mutationKey: ["upload_document"] },
  });

  // Derive upload results directly from form data and upload status
  const selectedDocuments = form.watch("documents").filter((doc: DocumentSchema) => doc.selected);
  const selectedDocumentIds = selectedDocuments.map((doc: DocumentSchema) => doc.attachment.id);

  const failedIds: string[] = [];
  const completedIds: string[] = [];

  // Count mutations for selected documents
  const activeMutations = new Set<string>();

  allMutationStates.forEach((state) => {
    if (state.variables) {
      const attachmentId = (state.variables as unknown as { attachment?: { id?: string } })
        ?.attachment?.id;
      if (attachmentId && selectedDocumentIds.includes(attachmentId)) {
        if (state.status === "pending") {
          activeMutations.add(attachmentId);
        }
        if (state.status === "success") {
          completedIds.push(attachmentId);
        }
        if (state.status === "error") {
          failedIds.push(attachmentId);
        }
      }
    }
  });

  const isUploading = activeMutations.size > 0;
  const hasCompletedMutations =
    selectedDocuments.length > 0 &&
    selectedDocumentIds.every((id) => completedIds.includes(id) || failedIds.includes(id));
  const uploadComplete = !isUploading && hasCompletedMutations;

  // Derive upload results from status - derived from selectedDocuments
  const uploadedEmail = uploadComplete
    ? selectedDocuments.some((doc: DocumentSchema) => doc.attachment.attachmentType === "item")
    : false;
  const uploadedAttachments = uploadComplete
    ? selectedDocuments.filter((doc: DocumentSchema) => doc.attachment.attachmentType !== "item")
        .length
    : 0;

  const handleReset = React.useCallback(() => {
    form.reset();
    resetZaak();
    setZaakToSearch("");
    queryClient.getMutationCache().clear();
    setStep("selectItems");
  }, [form, resetZaak, setZaakToSearch, queryClient]);
  const { isInBrowser } = useOffice();

  // in desktop apps, closing the taskpane via a button is not supported.
  const canCloseTaskpane = React.useMemo(
    () => isInBrowser && !!window.Office?.context?.ui?.closeContainer,
    [isInBrowser]
  );

  const handleClose = React.useCallback(() => {
    window.Office?.context?.ui?.closeContainer?.();
  }, []);

  const uploadError = uploadComplete && failedIds.length > 0;
  const uploadSuccess = uploadComplete && failedIds.length === 0;
  const errorCount = failedIds.length;
  const formDisabled = isUploading || uploadComplete;

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
              <MetadataStep isUploading={isUploading} isDisabled={formDisabled} />
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
                    disabled={formDisabled}
                  >
                    Vorige stap
                  </Button>
                  <Button
                    appearance="primary"
                    type="submit"
                    disabled={!form.formState.isValid || formDisabled}
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
