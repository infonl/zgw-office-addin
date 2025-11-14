/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

/**
 * Unified generic type for OpenAPI schemas
 *
 * Use ApiType to retrieve a schema type from any OpenAPI spec:
 *
 *   import { ApiType } from "./api-type";
 *   type MyType = ApiType<"SchemaName", import("./drc-types").components>;
 *
 * This works for all OpenAPI specs with a 'components.schemas' structure.
 */
export type ApiType<
  Key extends keyof Source["schemas"],
  Source extends { schemas: unknown },
> = NestedSchemaProperty<Source["schemas"], Key>;

export type NestedSchemaProperty<Type, Key> =
  Key extends `${infer P}.${infer R}`
    ? P extends keyof Type
      ? NestedSchemaProperty<Type[P], R>
      : never
    : Key extends keyof Type
      ? Type[Key]
      : never;
