/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../vitest.config";
import { fileURLToPath } from "node:url";

export default mergeConfig(
  baseConfig,
  defineConfig({
    root: fileURLToPath(new URL(".", import.meta.url)),
    test: {
      environment: "happy-dom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.{test,spec}.{js,ts,tsx}"],
      globals: true,
    },
  })
);
