/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import {
  Body1,
  Button,
  Caption1,
  Caption2,
  Input,
  Label,
  Link,
  makeStyles,
  Select,
  Spinner,
  Title1,
  Toast,
  ToastBody,
  Toaster,
  ToastFooter,
  ToastTitle,
  useToastController,
  tokens,
  Subtitle2,
} from "@fluentui/react-components";
import { useGetZaak } from "../../hooks/useGetZaak";
import { useEffect, useId } from "react";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AddDocumentSchema,
  addDocumentSchema,
  useAddDocumentToZaak,
} from "../../hooks/useAddDocumentToZaak";

const useStyles = makeStyles({
  root: {
    minHeight: "100vh",
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
  },
  input: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    paddingTop: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalL,
  },
  section: {
    paddingTop: tokens.spacingVerticalL,
    display: "flex",
    flexDirection: "column",
  },
  flex: {
    display: "flex",
    flexDirection: "column",
  },
  error: {
    color: tokens.colorStatusDangerForeground1,
  },
});

export function ZaakForm(props: { zaaknummer: string }) {
  const styles = useStyles();

  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);

  const { data, isLoading, error } = useGetZaak(props.zaaknummer);
  const { mutateAsync, isPending } = useAddDocumentToZaak({
    onError: (error) => {
      console.log(error);
      dispatchToast(
        <Toast>
          <ToastTitle>Oeps, er is iets mis gegaan</ToastTitle>
          <ToastBody subtitle="Subtitle">{String(error)}</ToastBody>
        </Toast>,
        { intent: "error" }
      );
    },
    onSuccess: () => {
      dispatchToast(
        <Toast>
          <ToastTitle>Document toegevoegd</ToastTitle>
          <ToastBody subtitle="Subtitle">
            Het document is succesvol toegevoegd aan de zaak.
          </ToastBody>
          <ToastFooter>
            <Link href={data?.url} target="_blank" rel="noopener noreferrer">
              Bekijk de zaak
            </Link>
          </ToastFooter>
        </Toast>,
        { intent: "success" }
      );
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid, errors },
  } = useForm({
    resolver: zodResolver(addDocumentSchema),
    defaultValues: {
      zaakidentificatie: props.zaaknummer,
      vertrouwelijkheidaanduiding: "openbaar",
      bestandsnaam: "PLACEHOLDER", // We get the actual file name during the `mutateAsync`
      zaakinformatieobjectUrl: "",
    },
  });

  console.log(errors, isValid);

  const zaakinformatieobjectUrl = watch("zaakinformatieobjectUrl");
  console.log(zaakinformatieobjectUrl);
  console.log(watch("zaakidentificatie"));

  const onSubmit = async (formData: AddDocumentSchema) => {
    await mutateAsync(formData);
  };

  useEffect(() => {
    if (!data?.vertrouwelijkheidaanduiding) return;
    setValue("vertrouwelijkheidaanduiding", data.vertrouwelijkheidaanduiding);
  }, [data?.vertrouwelijkheidaanduiding, setValue]);

  useEffect(() => {
    if (!zaakinformatieobjectUrl) return;
    if (!data?.zaakinformatieobjecten?.length) return;

    const zaakinformatieobject = data.zaakinformatieobjecten.find(
      ({ url }) => url === zaakinformatieobjectUrl
    );

    if (!zaakinformatieobject?.vertrouwelijkheidaanduiding) return;

    setValue("vertrouwelijkheidaanduiding", zaakinformatieobject.vertrouwelijkheidaanduiding);
  }, [zaakinformatieobjectUrl, data?.zaakinformatieobjecten, setValue]);

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
    <>
      <Toaster toasterId={toasterId} />
      <form onSubmit={handleSubmit(onSubmit)} className={styles.section}>
        <section className={styles.section}>
          <Title1>{data.identificatie}</Title1>
          <Caption2>{data.uuid}</Caption2>
        </section>
        <section className={styles.section}>
          <Subtitle2>{data.zaaktype.aanleiding}</Subtitle2>
        </section>
        <section className={styles.input}>
          <label htmlFor="document-type">Document type</label>
          <Select id="document-type" {...register("zaakinformatieobjectUrl")}>
            <option value="" disabled>
              -
            </option>
            {data.zaakinformatieobjecten.map((zaakinformatieobject) => (
              <option key={zaakinformatieobject.url} value={zaakinformatieobject.url}>
                {zaakinformatieobject.omschrijving}
              </option>
            ))}
          </Select>
          <Caption1 className={styles.error}>{errors.zaakinformatieobjectUrl?.message}</Caption1>
        </section>
        <section className={styles.input}>
          <Label htmlFor="vertrouwelijkheidsaanduiding">Vertrouwelijkheidsaanduiding</Label>
          <Input
            disabled
            id="vertrouwelijkheidsaanduiding"
            value={watch("vertrouwelijkheidaanduiding")}
            {...register("vertrouwelijkheidaanduiding")}
          />
          <Caption1 className={styles.error}>
            {errors.vertrouwelijkheidaanduiding?.message}
          </Caption1>
        </section>
        <section className={styles.input}>
          <label htmlFor="document-status">Status</label>
          <Select id="document-status" {...register("documentstatus")}>
            <option value="" disabled>
              -
            </option>
            {data.zaaktype.statustypen.map((statustype) => (
              <option key={statustype.url} value={statustype.url}>
                {statustype.omschrijving}
              </option>
            ))}
          </Select>
          <Caption1 className={styles.error}>{errors.documentstatus?.message}</Caption1>
        </section>
        <section className={styles.input}>
          <Label htmlFor="creatiedatum">Creatiedatum</Label>
          <Input id="creatiedatum" type="date" {...register("creatiedatum")} />
          <Caption1 className={styles.error}>{errors.creatiedatum?.message}</Caption1>
        </section>
        <Button disabled={!isValid || isPending} appearance="primary" type="submit">
          Document toevoegen
        </Button>
      </form>
    </>
  );
}
