/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

export class Unauthorized extends Error {
  public readonly statusCode = 401;
  constructor() {
    super("Je bent niet geautoriseerd om deze actie uit te voeren.");
    this.name = Unauthorized.name;
  }
}
