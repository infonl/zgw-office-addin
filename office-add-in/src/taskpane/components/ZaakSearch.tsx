/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { Button, makeStyles } from "@fluentui/react-components";
import React, { useState } from "react";
import { ZaakForm } from "./ZaakForm";
import zod from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./form/Input";

const useStyles = makeStyles({
  flex: {
    display: "flex",
    flexDirection: "column",
  },
});

const zaakSearchSchema = zod.object({
  zaaknummer: zod.string().startsWith("ZAAK-"),
});

type ZaakSearchSchema = zod.infer<typeof zaakSearchSchema>;

export function ZaakSearch() {
  const styles = useStyles();

  const form = useForm({
    resolver: zodResolver(zaakSearchSchema),
    defaultValues: {
      zaaknummer: "",
    },
  });

  const [zaakToSearch, setZaakToSearch] = useState("");

  const handleSubmit = (data: ZaakSearchSchema) => {
    setZaakToSearch(data.zaaknummer);
  };

  return (
    <>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.flex}>
          <Input name="zaaknummer" />
          <Button
            disabled={!form.formState.isValid}
            type="submit"
            appearance={zaakToSearch ? "secondary" : "primary"}
          >
            Zaak zoeken
          </Button>
        </form>
      </FormProvider>
      {zaakToSearch && (
        <ZaakForm
          zaaknummer={zaakToSearch}
          onSuccess={() => {
            form.reset();
            setZaakToSearch("");
          }}
        />
      )}
    </>
  );
}
