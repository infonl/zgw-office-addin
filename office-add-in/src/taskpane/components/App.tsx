/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import {
    Button,
    FluentProvider,
    makeStyles,
    MessageBar,
    MessageBarBody,
    MessageBarTitle,
    tokens,
    webDarkTheme,
    webLightTheme,
} from "@fluentui/react-components";
import {useOffice} from "../../hooks/useOffice";
import {useDarkMode} from "usehooks-ts";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ToastProvider} from "../../provider/ToastProvider";
import {useZaak, ZaakProvider} from "../../provider/ZaakProvider";
import {AuthProvider} from "../../provider/AuthProvider";
import {MsalAuthProvider} from "../../provider/MsalAuthProvider";
import {OfficeForm} from "./OfficeForm";
import {OutlookForm} from "./OutlookForm/OutlookForm";
import {useCommonStyles} from "./styles/shared";
import {extractLocalMsalConfig} from "../../provider/LocalMsalConfig";

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

const AppContent = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <AuthProvider>
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
      <QueryClientProvider client={queryClient}>
        <ZaakProvider>
          <ToastProvider>
            <Main />
          </ToastProvider>
        </ZaakProvider>
      </QueryClientProvider>
    </FluentProvider>
  </AuthProvider>
);

export function App() {
  const { isDarkMode } = useDarkMode();
  let msalConfig = extractLocalMsalConfig();

  // Wrap with MsalAuthProvider if available
  if (msalConfig) {
    return (
      <MsalAuthProvider config={msalConfig}>
        <AppContent isDarkMode={isDarkMode} />
      </MsalAuthProvider>
    );
  }

  return <AppContent isDarkMode={isDarkMode} />;
}

export default App;

function Main() {
  const styles = useStyles();
  const common = useCommonStyles();

  const { isOutlook, isWord, isExcel, isInBrowser } = useOffice();
  const { documentAddedToZaak, reset } = useZaak();

  // in desktop apps, closing the taskpane via a button is not supported.
  const canCloseTaskpane = (isWord || isExcel) && isInBrowser && !!window.Office?.addin?.hide;

  const handleClose = () => {
    window.Office?.addin?.hide?.();
  };

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
            Volgende koppeling
          </Button>
          {canCloseTaskpane && (
            <Button appearance="secondary" onClick={handleClose}>
              Sluiten
            </Button>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {isOutlook && <OutlookForm />}
      {!isOutlook && <OfficeForm />}
    </div>
  );
}
