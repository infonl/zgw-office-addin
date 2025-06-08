/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import { FluentProvider, webLightTheme, webDarkTheme } from "@fluentui/react-components";
import { useDarkMode } from "usehooks-ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZaakSearch } from "./ZaakSearch";
import { ToastProvider } from "../../provider/ToastProvider";

const useStyles = makeStyles({
  root: {
    minHeight: "100vh",
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
  },
});

const queryClient = new QueryClient();

export function App() {
  const styles = useStyles();
  const { isDarkMode } = useDarkMode();

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <div className={styles.root}>
            <ZaakSearch />
          </div>
        </ToastProvider>
      </QueryClientProvider>
    </FluentProvider>
  );
}

export default App;
