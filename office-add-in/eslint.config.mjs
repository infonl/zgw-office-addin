/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import officeAddins from "eslint-plugin-office-addins";
import tsParser from "@typescript-eslint/parser";

export default [
  ...officeAddins.configs.recommended,
  {
    plugins: {
      "office-addins": officeAddins,
    },
    languageOptions: {
      parser: tsParser,
      globals: {
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
        exports: "readonly"
      }
    },
    rules: {
      "no-async-promise-executor": "warn",
      "no-undef": "off" // Let TypeScript handle undefined variables
    }
  }
];
