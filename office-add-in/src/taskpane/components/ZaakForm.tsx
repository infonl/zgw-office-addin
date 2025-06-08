/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import {
  Body1,
  Button,
  Caption1,
  Caption2,
  makeStyles,
  Spinner,
  Title1,
  Toast,
  ToastBody,
  ToastTitle,
  tokens,
  Subtitle2,
} from "@fluentui/react-components";
import { useGetZaak } from "../../hooks/useGetZaak";
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
import { Input } from "./form/Input";
import { Select } from "./form/Select";
import { useToast } from "../../provider/ToastProvider";

const useStyles = makeStyles({
  section: {
    paddingTop: tokens.spacingVerticalL,
    display: "flex",
    flexDirection: "column",
  },
});

export function ZaakForm(props: { zaaknummer: string; onSuccess: () => void }) {
  const styles = useStyles();

  const { dispatchToast, dismissToast } = useToast();

  const { data, isLoading, error } = useGetZaak(props.zaaknummer);
  const { mutateAsync, isPending } = useAddDocumentToZaak({
    onMutate: () => {
      dispatchToast(
        <Toast>
          <ToastTitle media={<Spinner size="tiny" />}>Toevoegen document</ToastTitle>
          <ToastBody>Het document wordt aan {props.zaaknummer} toegevoegd.</ToastBody>
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
      props.onSuccess();
      dismissToast("adding-document");
      dispatchToast(
        <Toast>
          <ToastTitle>Document toegevoegd</ToastTitle>
          <ToastBody>Het document is succesvol toegevoegd aan {props.zaaknummer}.</ToastBody>
        </Toast>,
        { intent: "success" }
      );
    },
  });

  const form = useForm({
    resolver: zodResolver(addDocumentSchema),
    defaultValues: {
      zaakidentificatie: props.zaaknummer,
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

  const { getSignedInUser } = useOffice();

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

  if (isLoading) {
    return (
      <section className={styles.section}>
        <Spinner />
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.section}>
        <Body1>Error: {error.message}</Body1>
      </section>
    );
  }

  if (!data) {
    return (
      <section className={styles.section}>
        <Caption1 align="center">Zoekresultaat is leeg. Probeer een ander zaaknummer.</Caption1>
      </section>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={styles.section}>
        <section className={styles.section}>
          <Title1>{data.identificatie}</Title1>
          <Caption2>{data.uuid}</Caption2>
        </section>
        <section className={styles.section}>
          <Subtitle2>{data.zaaktype.aanleiding}</Subtitle2>
        </section>
        <Select
          name="informatieobjecttype"
          label="Document type"
          options={data.zaakinformatieobjecten.map((zaakinformatieobject) => ({
            label: zaakinformatieobject.omschrijving,
            value: zaakinformatieobject.url!,
          }))}
        />
        <Input readOnly name="vertrouwelijkheidaanduiding" />
        <Select
          name="status"
          label="Status"
          options={documentstatus.map((status) => ({
            label: status.replace(/_/g, " "),
            value: status,
          }))}
        />
        <Input type="date" name="creatiedatum" />
        <Input name="auteur" />
        <Button disabled={!form.formState.isValid || isPending} appearance="primary" type="submit">
          Document toevoegen
        </Button>
      </form>
    </FormProvider>
  );
}
