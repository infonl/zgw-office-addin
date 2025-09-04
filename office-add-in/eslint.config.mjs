/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import officeAddins from "eslint-plugin-office-addins";
import tsParser from "@typescript-eslint/parser";
import tsEslint from "@typescript-eslint/eslint-plugin";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

/**
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...officeAddins.configs.recommended,
  jsxA11y.flatConfigs.strict,
  {
    plugins: {
      "office-addins": officeAddins,
      "@typescript-eslint": tsEslint,
    },
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    languageOptions: {
      ...jsxA11y.flatConfigs.recommended.languageOptions,
      parser: tsParser,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
        // Office.js APIs
        Office: "readonly",
        OfficeRuntime: "readonly",
        Word: "readonly",
        Excel: "readonly",
        PowerPoint: "readonly",

        // Browser APIs
        console: "readonly",
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        btoa: "readonly",
        atob: "readonly",

        // Fetch API types
        RequestInit: "readonly",
        Response: "readonly",
        Headers: "readonly",
        HeadersInit: "readonly",
        BodyInit: "readonly",

        // Node.js globals when needed
        process: "readonly",
        Buffer: "readonly",
        global: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
      },
    },
    rules: {
      "no-async-promise-executor": "warn",
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];
