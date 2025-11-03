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
  Subtitle1,
  tokens,
} from "@fluentui/react-components";
import React from "react";
import zod from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./form/Input";
import { useZaak } from "../../provider/ZaakProvider";
import { Zaak } from "../../hooks/useGetZaak";
import { useOffice } from "../../hooks/useOffice";
import { mq } from "./styles/layout";
import { useCommonStyles } from "./styles/shared";
import { useQueryClient } from "@tanstack/react-query";

const useStyles = makeStyles({
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    alignItems: "stretch",
    justifyContent: "flex-start",
    marginTop: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalXL,
    [mq.md]: {
      flexDirection: "row",
      alignItems: "end",
      justifyContent: "center",
      gap: tokens.spacingHorizontalM,
    },
  },
  input: {
    flexGrow: 1,
  },
  button: {
    width: "100%",
    [mq.md]: {
      width: "auto",
    },
  },
});

const zaakSearchSchema = zod.object({
  zaaknummer: zod.string().startsWith("ZAAK-"),
});

type ZaakSearchSchema = zod.infer<typeof zaakSearchSchema>;

export function ZaakSearch() {
  const styles = useStyles();
  const common = useCommonStyles();
  const { isOutlook } = useOffice();
  const helperText = isOutlook
    ? "Vul het zaaknummer in waar je bestanden aan wil koppelen."
    : "Vul het zaaknummer in waar je dit document aan wil koppelen.";

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
      <section className={common.title}>
        <Subtitle1>Koppelen aan zaak</Subtitle1>
        <Body1>{helperText}</Body1>
      </section>
      {!data && (
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.form}>
            <Input className={styles.input} name="zaaknummer" label="Zaaknummer" />
            <Button
              className={styles.button}
              disabled={!form.formState.isValid || isLoading}
              type="submit"
              appearance={isLoading ? "secondary" : "primary"}
            >
              Zaak zoeken
            </Button>
          </form>
        </FormProvider>
      )}
      <ZaakZoekNotifications />
      {data && <ZaakDetails zaak={data} />}
    </>
  );
}

function ZaakZoekNotifications() {
  const {
    zaak: { isLoading, isError },
  } = useZaak();
  const common = useCommonStyles();

  if (isError) {
    return (
      <MessageBar intent="error">
        <MessageBarBody>
          <MessageBarTitle className={common.messageTitleNoWrap}>Oeps</MessageBarTitle>
          <span className={common.messageInline}> De zaak kan niet worden gevonden</span>
        </MessageBarBody>
      </MessageBar>
    );
  }

  if (isLoading) {
    return (
      <MessageBar intent="info">
        <MessageBarBody>
          <MessageBarTitle className={common.messageTitleNoWrap}>Zaak zoeken</MessageBarTitle>
          <span className={common.messageInline}> Dit kan even duren...</span>
        </MessageBarBody>
      </MessageBar>
    );
  }

  // ToDo : return message when zaak is found but user has no rights to attach documents to this zaak.

  return null;
}

const zaakdetails = makeStyles({
  table: {
    width: "100%",
    marginTop: tokens.spacingVerticalS,
    background: tokens.colorNeutralForegroundInverted,
    borderBottom: `1px solid ${tokens.colorBrandForegroundLink}`,
  },
});

function ZaakDetails(props: { zaak: Zaak }) {
  const styles = zaakdetails();

  const queryClient = useQueryClient();
  const { setZaakToSearch } = useZaak();

  return (
    <section style={{ marginTop: tokens.spacingVerticalL }}>
      <Body1 style={{ display: "flex", justifyContent: "space-between" }}>
        Gevonden zaak
        <Button
          appearance="secondary"
          onClick={() => {
            setZaakToSearch("");
            queryClient.invalidateQueries({
              queryKey: ["zaak"],
            });
          }}
        >
          Opnieuw zoeken
        </Button>
      </Body1>
      <table className={styles.table}>
        <tbody>
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
        </tbody>
      </table>
    </section>
  );
}
