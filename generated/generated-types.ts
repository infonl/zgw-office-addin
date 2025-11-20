/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import type { ApiType } from "./api-type";
import type { components } from "./types";

export type GeneratedType<Key extends keyof components["schemas"]> = ApiType<
  Key,
  components
>;
