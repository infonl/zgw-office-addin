/*
 * SPDX-FileCopyrightText: 2026 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

// Adapted from @total-typescript/shoehorn (itself adapted from type-fest's PartialDeep),
// dropped here to remove a dependency that had gone unmaintained.
type NoInfer<T> = [T][T extends unknown ? 0 : never];

type PartialDeep<T> = T extends (..._args: never[]) => unknown
  ? PartialDeepObject<T> | undefined
  : T extends object
    ? T extends ReadonlyArray<infer ItemType>
      ? ItemType[] extends T
        ? readonly ItemType[] extends T
          ? ReadonlyArray<PartialDeep<ItemType | undefined>>
          : Array<PartialDeep<ItemType | undefined>>
        : PartialDeepObject<T>
      : PartialDeepObject<T>
    : T;

type PartialDeepObject<ObjectType extends object> = {
  [KeyType in keyof ObjectType]?: PartialDeep<ObjectType[KeyType]>;
};

/**
 * Lets a deeply-partial mock stand in for a full type in tests.
 * NoInfer forces T to come from the call-site context (e.g. mockReturnValue's
 * expected type) instead of being inferred from the mock object's own shape.
 */
export function fromPartial<T>(mock: PartialDeep<NoInfer<T>>): T {
  return mock as T;
}
