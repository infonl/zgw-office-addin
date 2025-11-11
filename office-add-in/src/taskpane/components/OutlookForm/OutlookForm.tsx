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
import { graphServiceManager } from "../../../service/GraphServiceSingleton";

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
});

export function OutlookForm() {
  const styles = useStyles();
  const [step, setStep] = React.useState<"selectItems" | "metaData">("selectItems");
  const { form, zaak, hasSelectedDocuments, handleSubmit } = useOutlookForm();

  React.useEffect(() => {
    async function testGraphUserInfo() {
      try {
        const graphService = await graphServiceManager.getGraphService();
        const userInfo = await graphService.getCurrentUser();
        console.log("🔎 [Graph API] Current user info:", userInfo);
      } catch (e) {
        console.error("❌ [Graph API] Failed to fetch user info:", e);
      }
    }
    testGraphUserInfo();
  }, []);

  if (!zaak.data) return <ZaakSearch />;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {step === "selectItems" && (
          <>
            <ZaakSearch />
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
  );
}

export default OutlookForm;
