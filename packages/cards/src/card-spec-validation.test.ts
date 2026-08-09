import { describe, expect, it } from "vitest";
import {
  abilityKey,
  assertAbilityRefIdentity,
  capabilityKey,
  canonicalCapabilityId,
  CapabilityIdentityError,
} from "./capability-identity";
import {
  assertCardSpecContract,
  assertSetSpecContract,
  CardSpecValidationError,
  finalizeCardSpec,
} from "./card-spec-validation";
import { canonicalSerialize } from "./serializable";
import { minimalCardSpec } from "./test-fixtures";
import type { CardSpec } from "./contracts";

function untypedSpec(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(minimalCardSpec())) as Record<
    string,
    unknown
  >;
}

function engineOf(spec: Record<string, unknown>): Record<string, unknown> {
  return spec.engine as Record<string, unknown>;
}

function validateUntyped(spec: Record<string, unknown>): void {
  assertCardSpecContract(spec as unknown as CardSpec);
}

describe("CardSpec validation", () => {
  it("keeps AbilityRef legacy and canonical identities mutually exclusive", () => {
    expect(() =>
      assertAbilityRefIdentity({
        sourceCardInstanceId: "source",
        abilityId: "legacy",
      }),
    ).not.toThrow();
    expect(() =>
      assertAbilityRefIdentity({
        sourceCardInstanceId: "source",
        sourceAbilityId: "test_card:ability",
      }),
    ).not.toThrow();
    for (const invalid of [
      { sourceCardInstanceId: "source" },
      {
        sourceCardInstanceId: "source",
        abilityId: "legacy",
        sourceAbilityId: "test_card:ability",
      },
      { sourceCardInstanceId: "source", sourceAbilityId: "not-canonical" },
    ])
      expect(() => assertAbilityRefIdentity(invalid)).toThrow(
        CapabilityIdentityError,
      );
  });
  it("roundtrips, canonically serializes, and deeply freezes a complete contract", () => {
    const spec = minimalCardSpec();
    assertCardSpecContract(spec);
    expect(JSON.parse(canonicalSerialize(spec))).toEqual(spec);
    const frozen = finalizeCardSpec(spec);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.engine.characteristics.numeric)).toBe(true);
  });

  it.each([
    (spec: Record<string, unknown>) => delete spec.identity,
    (spec: Record<string, unknown>) =>
      ((spec.identity as Record<string, unknown>).side = "neutral"),
    (spec: Record<string, unknown>) =>
      ((spec.text as Record<string, unknown>).rulesText = 2),
    (spec: Record<string, unknown>) =>
      ((engineOf(spec).characteristics as Record<string, unknown>).cost = 1),
    (spec: Record<string, unknown>) =>
      ((spec.publication as Record<string, unknown>).engine_supported = true),
  ])("rejects malformed or authority-duplicating root input", (mutate) => {
    const spec = untypedSpec();
    mutate(spec);
    expect(() => validateUntyped(spec)).toThrow();
  });

  it("rejects duplicate printing IDs", () => {
    const spec = untypedSpec();
    spec.printings = [
      ...(spec.printings as unknown[]),
      {
        schemaVersion: "printing-spec-v1",
        printingId: "test_card:first",
        setId: "other",
      },
    ];
    expect(() => validateUntyped(spec)).toThrowError(CardSpecValidationError);
  });

  it("requires keys and addressability for always-addressable capabilities", () => {
    const spec = untypedSpec();
    engineOf(spec).abilities = [{ kind: "on_play", costs: {}, effects: [] }];
    expect(() => validateUntyped(spec)).toThrowError(/missing_capability_key/);
  });

  it("requires addressability only on the capability root, not nested mechanics", () => {
    const spec = untypedSpec();
    engineOf(spec).abilities = [
      {
        kind: "activated",
        timing: "runner_main",
        costs: [{ kind: "credit", amount: 1 }],
        effects: [
          {
            kind: "gain_credits",
            recipient: "runner",
            amount: 2,
            visibility: "public",
          },
        ],
        capabilityKey: "gain-credit",
        addressability: ["action", "plan"],
      },
    ];
    expect(() => validateUntyped(spec)).not.toThrow();
  });

  it("requires keys for conditionally addressable capability variants", () => {
    const spec = untypedSpec();
    engineOf(spec).fortRunWindows = [{ kind: "server_run_start_restriction" }];
    expect(() => validateUntyped(spec)).toThrowError(/missing_capability_key/);
  });

  it("rejects display copy in the mechanical graph", () => {
    const spec = untypedSpec();
    engineOf(spec).modifiers = [{ kind: "test", label: "display" }];
    expect(() => validateUntyped(spec)).toThrowError(/display copy/);
  });

  it("accepts only the exact unowned regionBaseline declaration shape", () => {
    const spec = untypedSpec();
    const exactRegion = {
      kind: "region_baseline",
      rezOnInstall: true,
      installOnlyIfRezAffordable: true,
      oneRegionPerFort: true,
      trashOlderRegions: true,
    };
    engineOf(spec).regionBaseline = exactRegion;
    expect(() => validateUntyped(spec)).not.toThrow();
    for (const malformed of [
      { ...exactRegion, kind: "region" },
      { ...exactRegion, rezOnInstall: false },
      { ...exactRegion, installOnlyIfRezAffordable: false },
      { ...exactRegion, oneRegionPerFort: false },
      { ...exactRegion, trashOlderRegions: false },
      { ...exactRegion, extra: true },
    ]) {
      const invalid = untypedSpec();
      engineOf(invalid).regionBaseline = malformed;
      expect(() => validateUntyped(invalid)).toThrowError(
        /invalid_contract_shape|unknown_contract_field/,
      );
    }
  });

  it.each([
    {
      name: "event play cost",
      mutate(spec: Record<string, unknown>) {
        (engineOf(spec).characteristics as Record<string, unknown>).playCost =
          null;
      },
    },
    {
      name: "resource rez cost",
      mutate(spec: Record<string, unknown>) {
        (spec.identity as Record<string, unknown>).cardType = "resource";
        const characteristics = engineOf(spec).characteristics as Record<
          string,
          unknown
        >;
        characteristics.playCost = null;
        (characteristics.numeric as Record<string, unknown>).installCost = 1;
        (characteristics.numeric as Record<string, unknown>).rezCost = 1;
      },
    },
    {
      name: "non-breaker program strength",
      mutate(spec: Record<string, unknown>) {
        (spec.identity as Record<string, unknown>).cardType = "program";
        const characteristics = engineOf(spec).characteristics as Record<
          string,
          unknown
        >;
        characteristics.playCost = null;
        const numeric = characteristics.numeric as Record<string, unknown>;
        numeric.installCost = 1;
        numeric.memoryCost = 1;
        characteristics.strength = { kind: "fixed", value: 1 };
      },
    },
    {
      name: "ICE without strength",
      mutate(spec: Record<string, unknown>) {
        (spec.identity as Record<string, unknown>).cardType = "ice";
        const characteristics = engineOf(spec).characteristics as Record<
          string,
          unknown
        >;
        characteristics.playCost = null;
        (characteristics.numeric as Record<string, unknown>).rezCost = 1;
      },
    },
  ])("rejects characteristic ownership drift: $name", ({ mutate }) => {
    const spec = untypedSpec();
    mutate(spec);
    expect(() => validateUntyped(spec)).toThrowError(CardSpecValidationError);
  });

  it("binds paid-X strength to ordered variable-rez bounds", () => {
    const paidX = (): Record<string, unknown> => {
      const spec = untypedSpec();
      (spec.identity as Record<string, unknown>).cardType = "ice";
      const characteristics = engineOf(spec).characteristics as Record<
        string,
        unknown
      >;
      characteristics.playCost = null;
      (characteristics.numeric as Record<string, unknown>).rezCost = 6;
      characteristics.strength = {
        kind: "paid_x",
        minimumStrength: 0,
        maximumStrength: 6,
      };
      engineOf(spec).variableRez = {
        capabilityKey: "variable_rez_x",
        addressability: ["choice", "plan", "quote", "debug"],
        kind: "x_strength",
        additionalCostPerValue: 1,
        minValue: 0,
        maxValue: 6,
        visibility: "public",
      };
      return spec;
    };
    expect(() => validateUntyped(paidX())).not.toThrow();

    const mismatched = paidX();
    (engineOf(mismatched).characteristics as Record<string, unknown>).strength =
      {
        kind: "paid_x",
        minimumStrength: 0,
        maximumStrength: 5,
      };
    expect(() => validateUntyped(mismatched)).toThrowError(
      /x_strength bounds must match paid_x strength bounds/,
    );

    const reversed = paidX();
    (engineOf(reversed).characteristics as Record<string, unknown>).strength = {
      kind: "paid_x",
      minimumStrength: 7,
      maximumStrength: 6,
    };
    (engineOf(reversed).variableRez as Record<string, unknown>).minValue = 7;
    expect(() => validateUntyped(reversed)).toThrowError(
      /maximumStrength must not be below minimumStrength/,
    );
  });

  it("rejects mismatched ability aliases and duplicate keys", () => {
    const spec = untypedSpec();
    engineOf(spec).abilities = [
      {
        kind: "on_play",
        costs: {},
        effects: [],
        capabilityKey: "first",
        abilityKey: "second",
        addressability: ["action"],
      },
    ];
    expect(() => validateUntyped(spec)).toThrowError(CapabilityIdentityError);

    const duplicate = untypedSpec();
    engineOf(duplicate).abilities = [
      {
        kind: "on_play",
        costs: {},
        effects: [],
        capabilityKey: "same",
        addressability: ["action"],
      },
      {
        kind: "on_play",
        costs: {},
        effects: [],
        capabilityKey: "same",
        addressability: ["action"],
      },
    ];
    expect(() => validateUntyped(duplicate)).toThrowError(
      /duplicate_capability_key/,
    );
  });

  it("rejects invalid definition IDs", () => {
    const spec = untypedSpec();
    (spec.identity as Record<string, unknown>).cardDefinitionId = "Bad/Id";
    expect(() => validateUntyped(spec)).toThrowError(CapabilityIdentityError);
  });

  it("rejects orphan planning capability annotations", () => {
    const spec = untypedSpec();
    spec.planningAnnotations = {
      schemaVersion: "card-planning-annotations-v1",
      capabilities: [{ capabilityKey: "ghost", annotations: [] }],
    };
    expect(() => validateUntyped(spec)).toThrowError(
      /orphan_planning_capability/,
    );
  });

  it("requires unique capability text bound to an engine capability", () => {
    const orphan = untypedSpec();
    (orphan.text as Record<string, unknown>).capabilityText = [
      { capabilityKey: "ghost", actionLabel: "Ghost" },
    ];
    expect(() => validateUntyped(orphan)).toThrowError(
      /orphan_capability_text/,
    );

    const duplicate = untypedSpec();
    (duplicate.text as Record<string, unknown>).capabilityText = [
      { capabilityKey: "same", actionLabel: "First" },
      { capabilityKey: "same", actionLabel: "Second" },
    ];
    expect(() => validateUntyped(duplicate)).toThrowError(
      /duplicate capability text key/,
    );
  });

  it("rejects non-string ability aliases and duplicate addressability", () => {
    for (const node of [
      { capabilityKey: "key", abilityKey: 42, addressability: ["action"] },
      { capabilityKey: "key", addressability: ["action", "action"] },
    ]) {
      const spec = untypedSpec();
      engineOf(spec).abilities = [
        { kind: "on_play", costs: "printed", effects: [], ...node },
      ];
      expect(() => validateUntyped(spec)).toThrow();
    }
  });
});

describe("identity and set contracts", () => {
  it("uses one capability key domain and canonical card-scoped IDs", () => {
    const key = capabilityKey("gain-credit");
    expect(abilityKey("gain-credit")).toBe(key);
    expect(canonicalCapabilityId("test_card", key)).toBe(
      "test_card:gain-credit",
    );
    expect(() => capabilityKey("Bad/Key")).toThrow(CapabilityIdentityError);
  });

  it("validates editorial SetSpec publication", () => {
    const set = {
      schemaVersion: "set-spec-v1",
      setId: "testset",
      name: "Test Set",
      sortOrder: 0,
      publication: { status: "disabled", blockReason: "fixture only" },
    };
    expect(() => assertSetSpecContract(set)).not.toThrow();
    expect(() =>
      assertSetSpecContract({ ...set, publication: { status: "disabled" } }),
    ).toThrow();
  });
});
