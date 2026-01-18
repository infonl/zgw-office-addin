/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

const esbuild = require("esbuild");

const isProd = process.env.NODE_ENV === "production";

esbuild
  .build({
    entryPoints: ["src/app.ts"],
    bundle: true,
    platform: "node",
    target: "node22",
    format: "esm",
    outfile: "dist/app.js",
    external: [],
    sourcemap: !isProd,
    minify: isProd,
    treeShaking: true,
  })
  .catch(() => process.exit(1));
