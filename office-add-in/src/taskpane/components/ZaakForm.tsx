/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import {
  Body1,
  Button,
  makeStyles,
  Spinner,
  Title1,
  Toast,
  ToastBody,
  ToastTitle,
  tokens,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from "@fluentui/react-components";
import { useEffect } from "react";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AddDocumentSchema,
  addDocumentSchema,
  documentstatus,
  useAddDocumentToZaak,
} from "../../hooks/useAddDocumentToZaak";
import { useOffice } from "../../hooks/useOffice";
import { CommonDocumentFields } from "./CommonDocumentFields";
import { useToast } from "../../provider/ToastProvider";
import { useZaak } from "../../provider/ZaakProvider";

const useStyles = makeStyles({
  title: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingHorizontalXXXL,
  },
  messageBar: {
    marginTop: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingHorizontalM,
  },
  messageTitleNoWrap: {
    whiteSpace: "normal",
  },
  messageInline: {
    fontWeight: tokens.fontWeightRegular,
  },
  form: {
    paddingTop: tokens.spacingVerticalL,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  fieldset: {
    display: "flex",
    gap: tokens.spacingVerticalM,
    padding: 0,
    border: 0,
  },
});

export function ZaakForm() {
  const styles = useStyles();

  const { dispatchToast, dismissToast } = useToast();
  const {
    zaak: { data },
    documentAdded,
  } = useZaak();

  const { mutateAsync, isPending } = useAddDocumentToZaak({
    onMutate: () => {
      dispatchToast(
        <Toast>
          <ToastTitle media={<Spinner size="tiny" />}>Koppelen document</ToastTitle>
          <ToastBody>Het document wordt aan {data?.identificatie} gekoppeld.</ToastBody>
        </Toast>,
        { intent: "info", toastId: "adding-document" }
      );
    },
    onError: (error) => {
      dismissToast("adding-document");
      dispatchToast(
        <Toast>
          <ToastTitle>Oeps, er is iets mis gegaan</ToastTitle>
          <ToastBody>{String(error)}</ToastBody>
        </Toast>,
        { intent: "error" }
      );
    },
    onSuccess: () => {
      documentAdded();
      dismissToast("adding-document");
      dispatchToast(
        <Toast>
          <ToastTitle>Document gekoppeld</ToastTitle>
          <ToastBody>Het document is succesvol gekoppeld aan {data?.identificatie}.</ToastBody>
        </Toast>,
        { intent: "success" }
      );
    },
  });

  const form = useForm({
    resolver: zodResolver(addDocumentSchema),
    defaultValues: {
      zaakidentificatie: data?.identificatie ?? "",
      vertrouwelijkheidaanduiding: "openbaar",
      informatieobjecttype: "",
      auteur: "",
      creatiedatum: new Date(),
      status: documentstatus.at(0)!,
    },
  });

  const informatieobjecttype = form.watch("informatieobjecttype");

  const onSubmit = async (formData: AddDocumentSchema) => {
    await mutateAsync(formData);
  };

  const { getSignedInUser, host } = useOffice();

  useEffect(() => {
    if (!data?.identificatie) return;
    form.setValue("zaakidentificatie", data.identificatie);
  }, [data?.identificatie, form.setValue]);

  useEffect(() => {
    if (!informatieobjecttype) return;
    if (!data?.zaakinformatieobjecten?.length) return;

    const zaakinformatieobject = data.zaakinformatieobjecten.find(
      ({ url }) => url === informatieobjecttype
    );

    if (!zaakinformatieobject?.vertrouwelijkheidaanduiding) return;

    form.setValue("vertrouwelijkheidaanduiding", zaakinformatieobject.vertrouwelijkheidaanduiding);
  }, [informatieobjecttype, data?.zaakinformatieobjecten, form.setValue]);

  useEffect(() => {
    if (!data?.vertrouwelijkheidaanduiding) return;

    form.setValue("vertrouwelijkheidaanduiding", data.vertrouwelijkheidaanduiding);
  }, [data?.vertrouwelijkheidaanduiding, form.setValue]);

  useEffect(() => {
    getSignedInUser().then((user) => {
      if (!user) return;
      form.setValue("auteur", user);
    });
  }, [getSignedInUser, form.setValue]);

  let titleText: string;
  switch (host) {
    case Office.HostType.Word:
      titleText = "Documentgegevens";
      break;
    case Office.HostType.Outlook:
      titleText = "Gegevens E-mail";
      break;
    default:
      titleText = "Documentgegevens";
  }

  let bodyText: string;
  switch (host) {
    case Office.HostType.Word:
      bodyText = "Vul de volgende documentgegevens in. Daarna kan je deze koppelen aan een zaak.";
      break;
    case Office.HostType.Outlook:
      bodyText = " Vul de gegevens van deze e-mail in. Daarna kan je deze koppelen aan een zaak.";
      break;
    default:
      bodyText = "Vul de volgende documentgegevens in. Daarna kan je deze koppelen aan een zaak.";
  }

  return (
    <FormProvider {...form}>
      <section className={styles.title}>
        <Title1>{titleText}</Title1>
        <Body1>{bodyText}</Body1>
      </section>
      <section className={styles.messageBar}>
        {!data && (
          <MessageBar intent="info">
            <MessageBarBody>
              <MessageBarTitle className={styles.messageTitleNoWrap}>
                Geen zaak gevonden
                <span className={styles.messageInline}>
                  {" "}
                  — Zoek eerst een zaak voordat je deze kunt koppelen
                </span>
              </MessageBarTitle>
            </MessageBarBody>
          </MessageBar>
        )}
      </section>
      {data && (
        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
          <CommonDocumentFields
            zaakinformatieobjecten={data.zaakinformatieobjecten}
            statuses={documentstatus}
          />
          <Button
            disabled={!form.formState.isValid || isPending}
            appearance="primary"
            type="submit"
          >
            Document koppelen
          </Button>
        </form>
      )}
    </FormProvider>
  );
}
