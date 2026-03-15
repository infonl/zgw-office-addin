/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

// eslint.config.js
import js from "@eslint/js";
import typescript from "typescript-eslint";
import globals from "globals";

export default typescript.config(
    js.configs.recommended,
    ...typescript.configs.recommendedTypeChecked,
    {
      languageOptions: {
        globals: globals.node,
        parserOptions: {
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
        },
      },
    },
    {
      files: ["**/*.js", "**/*.mjs"],
      ...typescript.configs.disableTypeChecked,
    },
    {
      ignores: ["dist/**", "node_modules/**", "*.config.js", "*.config.[jt]s", "**/env.setup.ts", "**/*.test.ts"],
    }
);
