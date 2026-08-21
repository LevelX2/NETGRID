import { describe, expect, it } from "vitest";
import {
  assertStrictlySerializable,
  canonicalSerialize,
  deepFreezeSerializable,
  SerializableContractError,
} from "./serializable";

function expectCode(
  value: unknown,
  code: SerializableContractError["code"],
): void {
  try {
    assertStrictlySerializable(value);
    throw new Error("expected strict serialization to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(SerializableContractError);
    expect((error as SerializableContractError).code).toBe(code);
  }
}

describe("strict serializable contract", () => {
  it.each([
    [() => 1, "unsupported_type"],
    [{ value: undefined }, "undefined_value"],
    [[undefined], "undefined_value"],
    [Number.NaN, "non_finite_number"],
    [Number.POSITIVE_INFINITY, "non_finite_number"],
    [Number.NEGATIVE_INFINITY, "non_finite_number"],
    [-0, "negative_zero"],
    [1n, "unsupported_type"],
    [Symbol("value"), "unsupported_type"],
    [new Map(), "non_plain_object"],
    [new Set(), "non_plain_object"],
    [new Date(), "non_plain_object"],
    [/x/, "non_plain_object"],
    [Object.create(null), "non_plain_object"],
  ] as const)("rejects %s", (value, code) => expectCode(value, code));

  it("rejects sparse arrays and expandos", () => {
    expectCode(new Array(1), "sparse_array");
    const array: unknown[] & { extra?: boolean } = [];
    array.extra = true;
    expectCode(array, "array_expando");
  });

  it("rejects array subclasses and manipulated array prototypes", () => {
    class RuntimeArray extends Array<unknown> {}
    expectCode(new RuntimeArray(), "non_plain_object");

    const manipulated: unknown[] = [];
    Object.setPrototypeOf(manipulated, { custom: true });
    expectCode(manipulated, "non_plain_object");
    expect(() => canonicalSerialize(manipulated)).toThrowError(
      SerializableContractError,
    );
  });

  it("rejects symbol, hidden, and accessor properties without invoking getters", () => {
    const symbolObject = { visible: true } as Record<PropertyKey, unknown>;
    symbolObject[Symbol("hidden")] = true;
    expectCode(symbolObject, "symbol_key");

    const hidden = {};
    Object.defineProperty(hidden, "value", { value: 1, enumerable: false });
    expectCode(hidden, "non_enumerable_property");

    let calls = 0;
    const getter = {};
    Object.defineProperty(getter, "value", {
      enumerable: true,
      get() {
        calls += 1;
        return 1;
      },
    });
    expectCode(getter, "accessor_property");
    expect(calls).toBe(0);
  });

  it("rejects direct and indirect cycles but allows shared aliases", () => {
    const direct: Record<string, unknown> = {};
    direct.self = direct;
    expectCode(direct, "cyclic_reference");
    const left: Record<string, unknown> = {};
    const right: Record<string, unknown> = { left };
    left.right = right;
    expectCode(left, "cyclic_reference");
    const shared = { value: 1 };
    expect(() =>
      assertStrictlySerializable({ left: shared, right: shared }),
    ).not.toThrow();
  });
});

describe("canonical serialization", () => {
  it("sorts object keys, preserves array order, and is deterministic", () => {
    const left = { z: [2, 1], a: { d: 4, c: 3 } };
    const right = { a: { c: 3, d: 4 }, z: [2, 1] };
    expect(canonicalSerialize(left)).toBe(canonicalSerialize(right));
    expect(canonicalSerialize(left)).toBe('{"a":{"c":3,"d":4},"z":[2,1]}');
    expect(canonicalSerialize(left)).toBe(canonicalSerialize(left));
    expect(JSON.parse(canonicalSerialize(left))).toEqual(left);
  });

  it("preserves an own __proto__ data key", () => {
    const value = JSON.parse('{"__proto__":{"x":1},"a":2}') as unknown;
    const serialized = canonicalSerialize(value);
    expect(serialized).toBe('{"__proto__":{"x":1},"a":2}');
    expect(Object.hasOwn(JSON.parse(serialized), "__proto__")).toBe(true);
  });
});

describe("deep freeze", () => {
  it("freezes the complete graph in place and preserves aliases", () => {
    const shared = { value: 1 };
    const value = { left: shared, right: shared, list: [shared] };
    const frozen = deepFreezeSerializable(value);
    expect(frozen).toBe(value);
    expect(frozen.left).toBe(frozen.right);
    expect(frozen.left).toBe(frozen.list[0]);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.left)).toBe(true);
    expect(Object.isFrozen(frozen.list)).toBe(true);
    expect(deepFreezeSerializable(frozen)).toBe(frozen);
    expect(() => {
      (value.left as { value: number }).value = 2;
    }).toThrow();
  });

  it("does not partially freeze an invalid graph", () => {
    const valid = { value: 1 };
    const invalid = { valid, bad: undefined };
    expect(() => deepFreezeSerializable(invalid)).toThrow();
    expect(Object.isFrozen(valid)).toBe(false);
    expect(Object.isFrozen(invalid)).toBe(false);
  });
});
