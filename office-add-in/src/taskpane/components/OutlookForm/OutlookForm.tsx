/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { Button, makeStyles, tokens } from "@fluentui/react-components";
import { FormProvider } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { ZaakSearch } from "../ZaakSearch";
import { SelectItems } from "./steps/SelectItems";
import { MetadataStep } from "./steps/MetadataStep";
import { UploadResultMessageBar } from "./components/UploadResultMessageBar";
import { useOutlookForm } from "./hooks/useOutlookForm";
import { useUploadStatus } from "./hooks/useUploadStatus";
import { useZaak } from "../../../provider/ZaakProvider";
import { useOffice } from "../../../hooks/useOffice";
import { DocumentSchema } from "../../../hooks/types";
import { ShowTokenError } from "../TokenError";

const useStyles = makeStyles({
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalM,
  },
  resultSection: {
    marginTop: tokens.spacingHorizontalL,
    maxWidth: "100%",
    overflow: "hidden",
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
  const { form, zaak, hasSelectedDocuments, handleSubmit, tokenError } = useOutlookForm();
  const { reset: resetZaak, setZaakToSearch } = useZaak();
  const queryClient = useQueryClient();

  // Derive upload results directly from form data and upload status
  const selectedDocuments = form.watch("documents").filter((doc: DocumentSchema) => doc.selected);

  const {
    isUploading,
    uploadComplete,
    uploadedEmail,
    uploadedAttachments,
    errorCount,
    uploadError,
    uploadSuccess,
  } = useUploadStatus({ selectedDocuments });

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
                  disabled={!hasSelectedDocuments || !!tokenError}
                  onClick={() => setStep("metaData")}
                >
                  Volgende stap: bestandsgegevens
                </Button>
              </section>
              {tokenError && <ShowTokenError error={tokenError} />}
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
