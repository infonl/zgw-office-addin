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
import { ToastProvider } from "../../provider/ToastProvider";
import { useZaak, ZaakProvider } from "../../provider/ZaakProvider";
import { AuthProvider } from "../../provider/AuthProvider";
import { MsalAuthProvider } from "../../provider/MsalAuthProvider";
import { OfficeForm } from "./OfficeForm";
import { OutlookForm } from "./OutlookForm/OutlookForm";
import { useCommonStyles } from "./styles/shared";

const useStyles = makeStyles({
  root: {
    minHeight: "100vh",
    paddingLeft: tokens.spacingHorizontalXL,
    paddingRight: tokens.spacingHorizontalXL,
  },
  actions: {
    marginTop: tokens.spacingVerticalXL,
    display: "flex",
    gap: tokens.spacingVerticalM,
  },
});

const queryClient = new QueryClient();

export function App() {
  const { isDarkMode } = useDarkMode();

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MsalAuthProvider>
            <AuthProvider>
              <ZaakProvider>
                <Main />
              </ZaakProvider>
            </AuthProvider>
          </MsalAuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </FluentProvider>
  );
}

export default App;

function Main() {
  const styles = useStyles();
  const common = useCommonStyles();
  const { isOutlook, isWord } = useOffice();
  const { documentAddedToZaak, reset } = useZaak();

  if (documentAddedToZaak) {
    return (
      <div className={styles.root}>
        <section className={common.messageBar}>
          <MessageBar intent="success">
            <MessageBarBody>
              <MessageBarTitle className={common.messageTitleNoWrap}>Gekoppeld</MessageBarTitle>
              <span className={common.messageInline}>
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

  return (
    <div className={styles.root}>
      {isWord && <OfficeForm />}
      {isOutlook && <OutlookForm />}
    </div>
  );
}
