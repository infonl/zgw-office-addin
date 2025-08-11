/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import neostandard from 'neostandard';

export default neostandard({
  // Enable TypeScript support for .ts files
  ts: true,
  
  // Disable style rules since we use Prettier for formatting
  noStyle: true,
  
  // Ignore build outputs and config files
  ignores: [
    'dist/**',
    'node_modules/**',
    '*.config.js',
    '*.config.mjs'
  ]
});
