/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { Button, makeStyles, tokens } from "@fluentui/react-components";
import { FormProvider } from "react-hook-form";
import { ZaakSearch } from "../ZaakSearch";
import { SelectItems } from "./steps/SelectItems";
import { MetadataStep } from "./steps/MetadataStep";
import { useOutlookForm } from "./hooks/useOutlookForm";
import { ShowTokenError } from "../tokenError";

const useStyles = makeStyles({
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalM,
  },
});

export function OutlookForm() {
  const styles = useStyles();
  const [step, setStep] = React.useState<"selectItems" | "metaData">("selectItems");
  const { form, zaak, hasSelectedDocuments, handleSubmit, tokenError } = useOutlookForm();

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
              <MetadataStep />
              <section className={styles.actions}>
                <Button appearance="secondary" type="button" onClick={() => setStep("selectItems")}>
                  Vorige stap
                </Button>
                <Button appearance="primary" type="submit" disabled={!form.formState.isValid}>
                  Bestanden koppelen
                </Button>
              </section>
            </>
          )}
        </form>
      </FormProvider>
    </>
  );
}

export default OutlookForm;
