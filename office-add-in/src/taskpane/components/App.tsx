/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import {
  Button,
  makeStyles,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  tokens,
} from "@fluentui/react-components";
import { useOffice } from "../../hooks/useOffice";
import { FluentProvider, webLightTheme, webDarkTheme } from "@fluentui/react-components";
import { useDarkMode } from "usehooks-ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZaakSearch } from "./ZaakSearch";
import { ToastProvider } from "../../provider/ToastProvider";
import { useZaak, ZaakProvider } from "../../provider/ZaakProvider";
import { ZaakForm } from "./ZaakForm";
import { OutlookToZaakForm } from "./OutlookToZaak/OutlookToZaakForm";

const useStyles = makeStyles({
  root: {
    minHeight: "100vh",
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
  },
  messageBar: {
    paddingTop: tokens.spacingHorizontalXL,
    marginTop: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingHorizontalM,
  },
  actions: {
    marginTop: tokens.spacingHorizontalXL,
    display: "flex",
    gap: tokens.spacingHorizontalM,
  },
  messageTitleNoWrap: {
    whiteSpace: "normal",
  },
  messageInline: {
    fontWeight: tokens.fontWeightRegular,
  },
});

const queryClient = new QueryClient();

export function App() {
  const { isDarkMode } = useDarkMode();

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
      <QueryClientProvider client={queryClient}>
        <ZaakProvider>
          <ToastProvider>
            <Main />
          </ToastProvider>
        </ZaakProvider>
      </QueryClientProvider>
    </FluentProvider>
  );
}

export default App;

function Main() {
  const styles = useStyles();

  const { isOutlook, isWord } = useOffice();

  const { documentAddedToZaak, reset } = useZaak();

  if (documentAddedToZaak) {
    return (
      <div className={styles.root}>
        <section className={styles.messageBar}>
          <MessageBar intent="success">
            <MessageBarBody>
              <MessageBarTitle className={styles.messageTitleNoWrap}>Gekoppeld</MessageBarTitle>
              <span className={styles.messageInline}>
                Het document is succesvol gekoppeld aan {documentAddedToZaak}
              </span>
            </MessageBarBody>
          </MessageBar>
        </section>
        <section className={styles.actions}>
          <Button appearance="primary" onClick={reset}>
            Volgend document
          </Button>
          <Button appearance="secondary" onClick={() => Office.addin.hide()}>
            Sluiten
          </Button>
        </section>
      </div>
    );
  }

  if (isOutlook) {
    return (
      <div className={styles.root}>
        <OutlookToZaakForm />
      </div>
    );
  }

  if (isWord) {
    return (
      <div className={styles.root}>
        <ZaakSearch />
        <ZaakForm />
      </div>
    );
  }

  // Fallback
  return (
    <div className={styles.root}>
      <ZaakSearch />
      <ZaakForm />
    </div>
  );
}
