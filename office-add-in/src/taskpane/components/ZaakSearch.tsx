/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import {
  Body1,
  Body1Strong,
  Button,
  makeStyles,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Title1,
  tokens,
} from "@fluentui/react-components";
import React from "react";
import zod from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./form/Input";
import { useZaak } from "../../provider/ZaakProvider";
import { Zaak } from "../../hooks/useGetZaak";

const useStyles = makeStyles({
  title: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingHorizontalXL,
  },
  form: {
    display: "flex",
    flexDirection: "row",
    gap: tokens.spacingHorizontalM,
    alignItems: "end",
    justifyContent: "center",
    marginTop: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingHorizontalXL,
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

  const {
    setZaakToSearch,
    zaak: { isLoading, data },
  } = useZaak();

  const handleSubmit = (data: ZaakSearchSchema) => {
    setZaakToSearch(data.zaaknummer);
  };

  return (
    <>
      <FormProvider {...form}>
        <section className={styles.title}>
          <Title1>Koppelen aan zaak</Title1>
          <Body1>Vul het zaaknummer in waar je dit document aan wil koppelen.</Body1>
        </section>
        <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.form}>
          <Input name="zaaknummer" />
          <Button
            disabled={!form.formState.isValid || isLoading}
            type="submit"
            appearance={isLoading ? "secondary" : "primary"}
          >
            Zaak zoeken
          </Button>
        </form>
      </FormProvider>
      <ZaakZoekNotifications />
      {data && <ZaakDetails zaak={data} />}
    </>
  );
}

function ZaakZoekNotifications() {
  const {
    zaak: { isLoading, isError },
  } = useZaak();

  if (isError) {
    return (
      <MessageBar intent="error">
        <MessageBarBody>
          <MessageBarTitle>Oeps</MessageBarTitle>
          De zaak kan niet worden gevonden
        </MessageBarBody>
      </MessageBar>
    );
  }

  if (isLoading) {
    return (
      <MessageBar intent="info">
        <MessageBarBody>
          <MessageBarTitle>Zaak zoeken</MessageBarTitle>
          Dit kan even duren...
        </MessageBarBody>
      </MessageBar>
    );
  }

  return null;
}

const zaakdetails = makeStyles({
  table: {
    width: "100%",
    marginTop: tokens.spacingHorizontalS,
    background: tokens.colorNeutralForegroundInverted,
    borderBottom: `1px solid ${tokens.colorBrandForegroundLink}`,
    padding: tokens.spacingVerticalM,
  },
});

function ZaakDetails(props: { zaak: Zaak }) {
  const styles = zaakdetails();

  return (
    <section>
      <Body1>Gevonden zaak</Body1>
      <table className={styles.table}>
        <tr>
          <td>
            <Body1Strong>Zaaknummer</Body1Strong>
          </td>
          <td>{props.zaak.identificatie}</td>
        </tr>
        <tr>
          <td>
            <Body1Strong>Zaaktype</Body1Strong>
          </td>
          <td>{props.zaak.zaaktype.omschrijving}</td>
        </tr>
        <tr>
          <td>
            <Body1Strong>Status</Body1Strong>
          </td>
          <td>{props.zaak.status.statustoelichting}</td>
        </tr>
        <tr>
          <td>
            <Body1Strong>Omschrijving</Body1Strong>
          </td>
          <td>{props.zaak.omschrijving}</td>
        </tr>
      </table>
    </section>
  );
}
