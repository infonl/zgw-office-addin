/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import {
  Body1,
  Button,
  makeStyles,
  Spinner,
  Subtitle1,
  Toast,
  ToastBody,
  ToastTitle,
  tokens,
} from "@fluentui/react-components";
import { useEffect } from "react";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AddDocumentSchema,
  addDocumentSchema,
  documentstatus,
  vertrouwelijkheidaanduidingSchema,
} from "../../hooks/types";
import { useAddDocumentToZaak } from "../../hooks/useAddDocumentToZaak";
import { useOffice } from "../../hooks/useOffice";
import { DocumentMetadataFields } from "./DocumentMetadataFields";
import { useToast } from "../../provider/ToastProvider";
import { useZaak } from "../../provider/ZaakProvider";
import { useCommonStyles } from "./styles/shared";
import { ZaakSearch } from "./ZaakSearch";

const useStyles = makeStyles({
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

export function OfficeForm() {
  const styles = useStyles();
  const common = useCommonStyles();

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
      vertrouwelijkheidaanduiding: "openbaar" as const,
      informatieobjecttype: "",
      auteur: "",
      creatiedatum: new Date(),
      status: documentstatus.slice(0, 1)[0]!,
    },
  });

  const informatieobjecttype = form.watch("informatieobjecttype");

  const onSubmit = async (formData: AddDocumentSchema) => {
    await mutateAsync(formData);
  };

  const { getSignedInUser } = useOffice();

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

    const parsed = vertrouwelijkheidaanduidingSchema.safeParse(
      zaakinformatieobject.vertrouwelijkheidaanduiding
    );
    if (!parsed.success) return;

    if (form.getValues("vertrouwelijkheidaanduiding") !== parsed.data) {
      form.setValue("vertrouwelijkheidaanduiding", parsed.data);
    }
  }, [informatieobjecttype, data?.zaakinformatieobjecten, form.setValue]);

  useEffect(() => {
    if (!data?.vertrouwelijkheidaanduiding) return;

    const parsed = vertrouwelijkheidaanduidingSchema.safeParse(data.vertrouwelijkheidaanduiding);
    if (parsed.success) {
      form.setValue("vertrouwelijkheidaanduiding", parsed.data);
    }
  }, [data?.vertrouwelijkheidaanduiding, form.setValue]);

  useEffect(() => {
    getSignedInUser().then((user) => {
      if (!user) return;
      form.setValue("auteur", user);
    });
  }, [getSignedInUser, form.setValue]);

  if (!data) {
    return <ZaakSearch />;
  }

  return (
    <>
      <ZaakSearch />
      <FormProvider {...form}>
        <section className={common.title}>
          <Subtitle1>Documentgegevens</Subtitle1>
          <Body1>
            Vul de volgende documentgegevens in. Daarna kan je deze koppelen aan een zaak.
          </Body1>
        </section>
        {data && (
          <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
            <DocumentMetadataFields
              zaakinformatieobjecten={data.zaakinformatieobjecten}
              statuses={documentstatus}
              control={form.control}
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
    </>
  );
}
