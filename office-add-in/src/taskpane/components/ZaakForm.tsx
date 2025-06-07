/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import {
  Body1,
  Body2,
  Button,
  Caption1,
  Caption2,
  Input,
  Label,
  makeStyles,
  Select,
  Spinner,
  Title1,
} from "@fluentui/react-components";
import { useGetZaak } from "../../hooks/useGetZaak";
import { useEffect } from "react";
import { OfficeService } from "../../service/office.service";
import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const useStyles = makeStyles({
  root: {
    minHeight: "100vh",
    paddingLeft: "20px",
    paddingRight: "20px",
  },
  input: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    paddingTop: "16px",
    marginBottom: "16px",
  },
  section: {
    paddingTop: "20px",
    display: "flex",
    flexDirection: "column",
  },
  flex: {
    display: "flex",
    flexDirection: "column",
  },
});

const schema = yup
  .object({
    vertrouwelijkheidaanduiding: yup.string().required(),
    zaakinformatieobjectUrl: yup.string().required(),
    documentStatus: yup.string().required(),
    creatiedatum: yup.date().required(),
    bestandsnaam: yup.string().required(),
  })
  .required();

type Schema = yup.InferType<typeof schema>;

export function ZaakForm(props: { zaaknummer: string }) {
  const styles = useStyles();

  const { data, isLoading, error } = useGetZaak(props.zaaknummer);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const zaakinformatieobjectUrl = watch("zaakinformatieobjectUrl");

  const onSubmit = (formData: Schema) => {
    console.log(formData);
  };

  useEffect(() => {
    setValue("vertrouwelijkheidaanduiding", data?.vertrouwelijkheidaanduiding ?? "");
  }, [data?.vertrouwelijkheidaanduiding, setValue]);

  useEffect(() => {
    if (!zaakinformatieobjectUrl) return;
    if (!data?.zaakinformatieobjecten?.length) return;

    const zaakinformatieobject = data.zaakinformatieobjecten.find(
      ({ url }) => url === zaakinformatieobjectUrl
    );

    if (!zaakinformatieobject) return;

    setValue("vertrouwelijkheidaanduiding", zaakinformatieobject.vertrouwelijkheidaanduiding);
  }, [zaakinformatieobjectUrl, data?.zaakinformatieobjecten, setValue]);

  useEffect(() => {
    OfficeService.getFileName().then((bestandsnaam) => {
      setValue("bestandsnaam", bestandsnaam);
    });
  }, [setValue]);

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
    <form onSubmit={handleSubmit(onSubmit)} className={styles.section}>
      <section className={styles.section}>
        <Title1>{data.identificatie}</Title1>
        <Caption2>{data.uuid}</Caption2>
      </section>
      <section className={styles.section}>
        <Body2>{data.zaaktype.aanleiding}</Body2>
      </section>
      <section className={styles.input}>
        <Label htmlFor="bestandsnaam">Bestandsnaam</Label>
        <Input id="bestandsnaam" {...register("bestandsnaam")} />
      </section>
      <section className={styles.input}>
        <label htmlFor="document-type">Document type</label>
        <Select id="document-type" defaultValue="" {...register("zaakinformatieobjectUrl")}>
          <option value="" disabled>
            -
          </option>
          {data.zaakinformatieobjecten.map((zaakinformatieobject) => (
            <option key={zaakinformatieobject.url} value={zaakinformatieobject.url}>
              {zaakinformatieobject.omschrijving}
            </option>
          ))}
        </Select>
      </section>
      <section className={styles.input}>
        <Label htmlFor="vertrouwelijkheidsaanduiding">Vertrouwelijkheidsaanduiding</Label>
        <Input
          id="vertrouwelijkheidsaanduiding"
          disabled
          {...register("vertrouwelijkheidaanduiding")}
        />
      </section>
      <section className={styles.input}>
        <label htmlFor="document-status">Status</label>
        <Select id="document-status" defaultValue="" {...register("documentStatus")}>
          <option value="" disabled>
            -
          </option>
          {data.zaaktype.statustypen.map((statustype) => (
            <option key={statustype.url} value={statustype.url}>
              {statustype.omschrijving}
            </option>
          ))}
        </Select>
      </section>
      <section className={styles.input}>
        <Label htmlFor="creatiedatum">Creatiedatum</Label>
        <Input id="creatiedatum" type="date" {...register("creatiedatum")} />
      </section>
      <Button disabled={!isValid} appearance="primary" type="submit">
        Document toevoegen
      </Button>
    </form>
  );
}
