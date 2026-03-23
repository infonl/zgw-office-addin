/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

export class FileNotSupported extends Error {
  public readonly statusCode = 500;
  constructor(file: string) {
    super(`Bestand wordt niet ondersteund: ${file}`);
    this.name = FileNotSupported.name;
  }
}
