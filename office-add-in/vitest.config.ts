/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../vitest.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "happy-dom",
      setupFiles: ["./src/test/env.setup.ts", "./src/test/setup.ts"],
      include: ["src/**/*.{test,spec}.{js,ts,tsx}"],
    },
  })
);
