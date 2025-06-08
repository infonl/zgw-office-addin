/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React, { useState } from "react";
import { Input, Label, makeStyles, tokens } from "@fluentui/react-components";
import { Button } from "@fluentui/react-components";
import { FluentProvider, webLightTheme, webDarkTheme } from "@fluentui/react-components";
import { useDarkMode } from "usehooks-ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZaakForm } from "./ZaakForm";

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
  flex: {
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
    <section className={styles.flex}>
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
        appearance={zaakToSearch ? "secondary" : "primary"}
        onClick={() => setZaakToSearch(zaaknummer)}
      >
        Zaak zoeken
      </Button>
      {zaakToSearch && <ZaakForm zaaknummer={zaakToSearch} />}
    </section>
  );
}
