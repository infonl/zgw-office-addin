/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React, { useState } from "react";
import { Input, Label, makeStyles, Select } from "@fluentui/react-components";
import { Button } from "@fluentui/react-components";
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  Spinner,
  Text,
  Caption1,
  Title1,
} from "@fluentui/react-components";
import { useDarkMode } from "usehooks-ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGetZaak } from "../../hooks/useGetZaak";

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
    paddingTop: "20px",
    marginBottom: "20px",
  },
  section: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
  },
});

const queryClient = new QueryClient();

export function App() {
  const styles = useStyles();
  const { isDarkMode } = useDarkMode();

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
      <QueryClientProvider client={queryClient}>
        <div className={styles.root}>
          <Zaak />
        </div>
      </QueryClientProvider>
    </FluentProvider>
  );
}

export default App;

function Zaak() {
  const styles = useStyles();

  const [zaaknummer, setZaaknummer] = useState("ZAAK-1234");
  const [zaakToSearch, setZaakToSearch] = useState("");

  return (
    <section>
      <section className={styles.input}>
        <Label htmlFor="zaaknummer">Zaaknummer</Label>
        <Input
          id="zaaknummer"
          value={zaaknummer}
          onChange={(_, data) => setZaaknummer(data.value)}
        />
      </section>
      <Button
        disabled={!zaaknummer.length}
        appearance="primary"
        onClick={() => setZaakToSearch(zaaknummer)}
      >
        Zaak zoeken
      </Button>
      <ZaakDetails zaaknummer={zaakToSearch} />
    </section>
  );
}

function ZaakDetails(props: { zaaknummer: string }) {
  const styles = useStyles();

  const { data, isLoading, error } = useGetZaak(props.zaaknummer);

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
        <Text>Error: {error.message}</Text>
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
    <section className={styles.section}>
      <Title1>{data.identificatie}</Title1>
      <Caption1>{data.uuid}</Caption1>
      <div>
        <label htmlFor="select">Informatie object type</label>
        <Select id="select">
          {data.zaakinformatieobjecten?.map((zaakinformatieobject) => (
            <option key={(zaakinformatieobject as unknown as { url: string }).url}>
              {(zaakinformatieobject as unknown as { omschrijving: string }).omschrijving}
            </option>
          ))}
        </Select>
      </div>
      <Button appearance="primary" onClick={() => console.log("Document toevoegen clicked")}>
        Document toevoegen
      </Button>
    </section>
  );
}
