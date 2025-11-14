/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { ApiType } from "./api-type";

export type GeneratedType<
  Key extends keyof import("./types").components["schemas"],
> = ApiType<Key, import("./types").components>;
