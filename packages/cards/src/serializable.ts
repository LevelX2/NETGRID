export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];
export type JsonObject = { readonly [key: string]: JsonValue };

export type DeepReadonly<T> = T extends JsonPrimitive
  ? T
  : T extends readonly (infer Element)[]
    ? readonly DeepReadonly<Element>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : never;

export type SerializableErrorCode =
  | "unsupported_type"
  | "undefined_value"
  | "non_finite_number"
  | "negative_zero"
  | "non_plain_object"
  | "symbol_key"
  | "accessor_property"
  | "non_enumerable_property"
  | "sparse_array"
  | "array_expando"
  | "cyclic_reference";

export class SerializableContractError extends Error {
  readonly name = "SerializableContractError";

  constructor(
    readonly code: SerializableErrorCode,
    readonly path: string,
    message: string,
  ) {
    super(`${code} at ${path}: ${message}`);
  }
}

/**
 * Proves only strict JSON serializability. It intentionally does not claim
 * that an unknown value satisfies CardSpec schema or planning boundaries.
 */
export function assertStrictlySerializable(
  value: unknown,
  path = "$",
): asserts value is JsonValue {
  inspectSerializable(value, path, new Set());
}

export function canonicalSerialize(value: unknown): string {
  assertStrictlySerializable(value);
  return canonicalString(value as JsonValue);
}

/** Validates the complete graph before mutating any node with Object.freeze. */
export function deepFreezeSerializable<T>(value: T): DeepReadonly<T> {
  assertStrictlySerializable(value);
  freezeValidated(value as JsonValue, new Set());
  return value as DeepReadonly<T>;
}

function inspectSerializable(
  value: unknown,
  path: string,
  ancestors: Set<object>,
): void {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return;
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      fail("non_finite_number", path, "number must be finite");
    if (Object.is(value, -0))
      fail(
        "negative_zero",
        path,
        "-0 is rejected to preserve JSON roundtrip identity",
      );
    return;
  }
  if (value === undefined)
    fail("undefined_value", path, "undefined is ambiguous in JSON");
  if (typeof value !== "object")
    fail("unsupported_type", path, `${typeof value} is not a JSON value`);

  if (ancestors.has(value))
    fail("cyclic_reference", path, "value points to one of its ancestors");
  const nestedAncestors = new Set(ancestors).add(value);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype)
      fail(
        "non_plain_object",
        path,
        "array does not have the plain Array prototype",
      );
    inspectArray(value, path, nestedAncestors);
    return;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype)
    fail(
      "non_plain_object",
      path,
      "value does not have the plain Object prototype",
    );
  inspectObject(value, path, nestedAncestors);
}

function inspectArray(
  value: readonly unknown[],
  path: string,
  ancestors: Set<object>,
): void {
  const keys = Reflect.ownKeys(value);
  for (const key of keys) {
    if (key === "length") continue;
    if (typeof key === "symbol")
      fail("symbol_key", path, "symbol-keyed array property");
    if (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length)
      fail(
        "array_expando",
        propertyPath(path, key),
        "array has a non-index property",
      );
  }
  for (let index = 0; index < value.length; index += 1) {
    const itemPath = `${path}[${index}]`;
    if (!Object.hasOwn(value, index))
      fail("sparse_array", itemPath, "array hole");
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor)
      fail("sparse_array", itemPath, "missing array element descriptor");
    inspectDataDescriptor(descriptor, itemPath, ancestors);
  }
}

function inspectObject(
  value: object,
  path: string,
  ancestors: Set<object>,
): void {
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === "symbol")
      fail("symbol_key", path, "symbol-keyed object property");
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor) continue;
    inspectDataDescriptor(descriptor, propertyPath(path, key), ancestors);
  }
}

function inspectDataDescriptor(
  descriptor: PropertyDescriptor,
  path: string,
  ancestors: Set<object>,
): void {
  if (descriptor.get || descriptor.set || !("value" in descriptor))
    fail(
      "accessor_property",
      path,
      "getters and setters are not serializable data",
    );
  if (!descriptor.enumerable)
    fail("non_enumerable_property", path, "hidden data would be lost by JSON");
  inspectSerializable(descriptor.value, path, ancestors);
}

function canonicalString(value: JsonValue): string {
  if (Array.isArray(value))
    return `[${value.map((entry) => canonicalString(entry)).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const objectValue = value as JsonObject;
    return `{${Object.keys(objectValue)
      .sort()
      .map(
        (key) => `${JSON.stringify(key)}:${canonicalString(objectValue[key]!)}`,
      )
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function freezeValidated(value: JsonValue, frozen: Set<object>): void {
  if (value === null || typeof value !== "object" || frozen.has(value)) return;
  frozen.add(value);
  if (Array.isArray(value))
    for (const item of value) freezeValidated(item, frozen);
  else for (const item of Object.values(value)) freezeValidated(item, frozen);
  Object.freeze(value);
}

function propertyPath(path: string, key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`;
}

function fail(
  code: SerializableErrorCode,
  path: string,
  message: string,
): never {
  throw new SerializableContractError(code, path, message);
}
