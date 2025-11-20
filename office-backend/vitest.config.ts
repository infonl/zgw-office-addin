/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { defineConfig } from "vitest/config";
import baseConfig from "../vitest.config";

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ["src/**/*.{test,spec}.{js,ts}", "service/**/*.{test,spec}.{js,ts}"],
    setupFiles: ["./test/setup.ts"],
  },
});
