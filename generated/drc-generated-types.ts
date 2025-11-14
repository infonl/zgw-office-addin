/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { ApiType } from "./api-type";
// Gebruik type import voor components
export type DRCType<
  Key extends keyof import("./drc-types").components["schemas"],
> = ApiType<Key, import("./drc-types").components>;
