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
  useAddDocumentToZaak,
} from "../../hooks/useAddDocumentToZaak";
import { useOffice } from "../../hooks/useOffice";
import { DocumentMetadataFields } from "./DocumentMetadataFields";
import { useToast } from "../../provider/ToastProvider";
import { useZaak } from "../../provider/ZaakProvider";
import { useCommonStyles } from "./styles/shared";
import { ZaakSearch } from "./ZaakSearch";
import { OfficeGraphAuthProvider } from "../../provider/OfficeGraphAuthProvider";

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

  // Graph API test functie
  const testGraphApi = async () => {
    try {
      const provider = new OfficeGraphAuthProvider();
      const token = await provider.getAccessToken();
      console.log("Graph access token:", token);
      // Simpele Graph API call: user profile ophalen
      const response = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const profile = await response.json();
      console.log("Graph user profile:", profile);
      dispatchToast(
        <Toast>
          <ToastTitle>Graph API Success!</ToastTitle>
          <ToastBody>{profile.displayName || JSON.stringify(profile)}</ToastBody>
        </Toast>,
        { intent: "success" }
      );
    } catch (err) {
      console.error("Graph API error:", err);
      dispatchToast(
        <Toast>
          <ToastTitle>Graph API Error</ToastTitle>
          <ToastBody>{String(err)}</ToastBody>
        </Toast>,
        { intent: "error" }
      );
    }
  };

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
            />
            <Button
              disabled={!form.formState.isValid || isPending}
              appearance="primary"
              type="submit"
            >
              Document koppelen
            </Button>
            <Button appearance="secondary" type="button" onClick={testGraphApi}>
              Test Graph API
            </Button>
          </form>
        )}
      </FormProvider>
    </>
  );
}
