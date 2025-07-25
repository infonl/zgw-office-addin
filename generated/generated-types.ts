/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import { components } from "./types";

type NestedSchemaProperty<Type, Key> = Key extends `${infer P}.${infer R}`
  ? P extends keyof Type
    ? NestedSchemaProperty<Type[P], R>
    : never
  : Key extends keyof Type
    ? Type[Key]
    : never;

export type GeneratedType<Key extends keyof components["schemas"]> =
  NestedSchemaProperty<components["schemas"], Key>;
