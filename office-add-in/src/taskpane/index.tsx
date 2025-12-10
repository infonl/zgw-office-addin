/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import * as React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import { jwtDecode } from "jwt-decode";

const rootElement: HTMLElement | null = document.getElementById("container");
const root = rootElement ? createRoot(rootElement) : undefined;

Office.onReady(async (info) => {
  console.log(info);
  root?.render(<App />);
  try {
    const userTokenEncoded = await Office.auth.getAccessToken();
    const userToken = jwtDecode<{ preferred_username?: string; name?: string }>(userTokenEncoded);
    console.log("User token decoded:", userToken);
    return userToken;
  } catch (error) {
    console.warn("Unable to get user access token", error);
    return null;
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((module as any).hot) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (module as any).hot.accept("./components/App", () => {
    const NextApp = require("./components/App").default;
    root?.render(<NextApp />);
  });
}
