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
      include: ["src/**/*.{test,spec}.{js,ts}", "service/**/*.{test,spec}.{js,ts}"],
      setupFiles: ["./test/env.setup.ts", "./test/setup.ts"],
    },
  }),
);
