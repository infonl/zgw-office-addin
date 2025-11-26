/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { ApiType } from "./api-type";
import type { components } from "./zrc-types";

export type ZrcType<Key extends keyof components["schemas"]> = ApiType<
  Key,
  components
>;
