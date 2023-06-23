/**
 * A conditional type that transforms a tuple of strings into an intermediate
 * object type where each key is optional and its value is 'never'.
 *
 * This type helps in creating a base version of the final type, in which all
 * keys are optional. As a recursive type, it breaks down the tuple into a Head
 * (first element) and Rest (remaining elements) until it's exhausted.
 *
 * The 'never' value is a TypeScript type representing values that never occur.
 * It's used here as a placeholder because the actual value types will be
 * provided in OrderedKeys.
 *
 * @template T - A tuple of strings, representing the keys of an object in the
 * order they should appear.
 */
type OptionalKeys<T extends readonly any[]> = T extends [
  infer Head,
  ...infer Rest,
]
  ? Head extends string
    ? { [K in Head]?: never } & OptionalKeys<Rest>
    : never
  : {};

/**
 * OrderedKeys
 *
 * A conditional type that transforms a tuple of strings into an object type
 * where each key must be present if any key to its right is present. The object
 * type is an union of different versions of the object, each requiring one more
 * key to be present from left to right.
 *
 * This type recursively constructs the final object type by shifting the tuple,
 * taking its Head, and creating a union type with the current result and the
 * new key added to the result.
 *
 * @template T - A tuple of strings, representing the keys of an object in the
 * order they should appear.
 * @template V - The type of the values in the final object map.
 * @template R - A helper type that accumulates the object type being built.
 * It's an empty object by default.
 */
type OrderedKeys<
  T extends readonly any[],
  V,
  R extends Record<string, V> = {},
> = T extends [infer Head, ...infer Rest]
  ? Head extends string
    ? (R & OptionalKeys<T>) | OrderedKeys<Rest, V, R & { [K in Head]: V }>
    : never
  : R;
