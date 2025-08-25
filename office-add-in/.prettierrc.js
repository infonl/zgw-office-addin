/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

const officeConfig = require('office-addin-prettier-config');

module.exports = {
  ...officeConfig,
  plugins: [
    ...(officeConfig.plugins || []),
    '@prettier/plugin-xml'
  ],
  overrides: [
    ...(officeConfig.overrides || []),
    {
      files: '*.xml',
      options: {
        parser: 'xml',
        xmlQuoteAttributes: 'double',
        xmlSelfClosingSpace: true,
        xmlSortAttributesByKey: false,
        xmlWhitespaceSensitivity: 'ignore'
      }
    }
  ]
};
