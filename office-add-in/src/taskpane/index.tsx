/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import * as React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";

const rootElement: HTMLElement | null = document.getElementById("container");
const root = rootElement ? createRoot(rootElement) : undefined;

Office.onReady(async (info) => {
  console.log(info);
  root?.render(<App />);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((module as any).hot) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (module as any).hot.accept("./components/App", () => {
    const NextApp = require("./components/App").default;
    root?.render(<NextApp />);
  });
}
