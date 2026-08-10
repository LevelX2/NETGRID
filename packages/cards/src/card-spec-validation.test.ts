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
  it("validates an exact relative-ICE derived-damage capability binding", () => {
    const spec = untypedSpec();
    const engine = engineOf(spec);
    engine.relativeIce = {
      capabilityKey: "relative_dynamic_damage_owner",
      addressability: ["quote", "debug"],
      kind: "rezzed_ice_outside_this_ice",
      dynamicDamageSubroutine: {
        subroutineCapabilityKey: "relative_dynamic_damage_subroutine",
        amountPerCount: 2,
        visibility: "public",
      },
    };
    engine.printedSubroutines = [
      {
        capabilityKey: "relative_dynamic_damage_subroutine",
        addressability: ["quote", "debug"],
        kind: "damage",
        damageType: "net",
        amount: {
          kind: "derived",
          source: "relative_ice_dynamic_damage",
          ownerCapabilityKey: "relative_dynamic_damage_owner",
        },
        preventable: true,
      },
    ];
    expect(() => validateUntyped(spec)).not.toThrow();

    const forged = JSON.parse(JSON.stringify(spec)) as Record<string, unknown>;
    const forgedEngine = engineOf(forged);
    const forgedRelative = forgedEngine.relativeIce as Record<string, unknown>;
    forgedRelative.dynamicDamageSubroutine = {
      subroutineCapabilityKey: "forged_missing_subroutine",
      amountPerCount: 2,
      visibility: "public",
    };
    expect(() => validateUntyped(forged)).toThrow(
      "must reference exactly one printed subroutine",
    );

    const mismatch = JSON.parse(JSON.stringify(spec)) as Record<
      string,
      unknown
    >;
    const mismatchPrinted = engineOf(mismatch).printedSubroutines as Record<
      string,
      unknown
    >[];
    (mismatchPrinted[0]!.amount as Record<string, unknown>).ownerCapabilityKey =
      "forged_owner";
    expect(() => validateUntyped(mismatch)).toThrow(
      "must reference the owning relative ICE capability",
    );

    const duplicate = JSON.parse(JSON.stringify(spec)) as Record<
      string,
      unknown
    >;
    const duplicatePrinted = engineOf(duplicate).printedSubroutines as Record<
      string,
      unknown
    >[];
    duplicatePrinted.push({ ...duplicatePrinted[0]! });
    expect(() => validateUntyped(duplicate)).toThrow(
      "must not reference duplicate printed subroutines",
    );
  });

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

  it("requires complete literal-only flatline replacement resolutions", () => {
    const flatlineTagReplacement = {
      capabilityKey: "flatline_tag_replacement",
      addressability: ["action"],
      kind: "flatline_replacement_from_grip",
      replacement: "flatline_tag_replacement",
      resolution: {
        trashSource: true,
        removeAllCoreDamage: true,
        refreshGripToMax: true,
        gainCredits: 10,
        removeAllTags: true,
        futureActionDebt: 4,
        futureAgendaPointForfeit: 3,
      },
      visibility: "public",
    };
    const installedFlatlinePrevention = {
      capabilityKey: "installed_flatline_prevention",
      addressability: ["action"],
      kind: "flatline_replacement_installed",
      replacement: "installed_flatline_prevention",
      resolution: {
        trashAllGrip: true,
        removeAllCoreDamage: true,
        maxHandSizeModifier: -1,
        runnerActionsPerTurnOverride: 3,
        permanentMeatDamagePrevention: true,
      },
      cost: { kind: "trash_source" },
      visibility: "public",
    };
    for (const replacement of [
      flatlineTagReplacement,
      installedFlatlinePrevention,
    ]) {
      const valid = untypedSpec();
      engineOf(valid).flatlineReplacementSources = [replacement];
      expect(() => validateUntyped(valid)).not.toThrow();
    }

    const missingResolution = untypedSpec();
    const { resolution: _missingResolution, ...withoutResolution } =
      flatlineTagReplacement;
    engineOf(missingResolution).flatlineReplacementSources = [
      withoutResolution,
    ];
    expect(() => validateUntyped(missingResolution)).toThrowError(
      /invalid_contract_shape/,
    );

    const wrongLiteral = untypedSpec();
    engineOf(wrongLiteral).flatlineReplacementSources = [
      {
        ...installedFlatlinePrevention,
        resolution: {
          ...installedFlatlinePrevention.resolution,
          runnerActionsPerTurnOverride: 4,
        },
      },
    ];
    expect(() => validateUntyped(wrongLiteral)).toThrowError(
      /runnerActionsPerTurnOverride.*must be 3/,
    );

    const wrongCost = untypedSpec();
    engineOf(wrongCost).flatlineReplacementSources = [
      { ...installedFlatlinePrevention, cost: { kind: "none" } },
    ];
    expect(() => validateUntyped(wrongCost)).toThrowError(
      /cost.kind.*must be trash_source/,
    );
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

    const wrongCost = paidX();
    (
      engineOf(wrongCost).variableRez as Record<string, unknown>
    ).additionalCostPerValue = 2;
    expect(() => validateUntyped(wrongCost)).toThrowError(
      /x-strength requires cost 1/,
    );

    const forgedTraceFlag = paidX();
    (
      engineOf(forgedTraceFlag).variableRez as Record<string, unknown>
    ).traceLimitFromValue = false;
    expect(() => validateUntyped(forgedTraceFlag)).toThrowError(
      /must be true when present/,
    );

    const missingVisibility = paidX();
    delete (engineOf(missingVisibility).variableRez as Record<string, unknown>)
      .visibility;
    expect(() => validateUntyped(missingVisibility)).toThrowError(
      /visibility.*must be public/,
    );
    const wrongVisibility = paidX();
    (
      engineOf(wrongVisibility).variableRez as Record<string, unknown>
    ).visibility = "hidden_info_barrier";
    expect(() => validateUntyped(wrongVisibility)).toThrowError(
      /visibility.*must be public/,
    );
  });

  it("validates both non-X variable-rez variants as closed required contracts", () => {
    const variableRezSpec = (
      variableRez: Record<string, unknown>,
    ): Record<string, unknown> => {
      const spec = untypedSpec();
      (spec.identity as Record<string, unknown>).cardType = "ice";
      const characteristics = engineOf(spec).characteristics as Record<
        string,
        unknown
      >;
      characteristics.playCost = null;
      (characteristics.numeric as Record<string, unknown>).rezCost = 2;
      characteristics.strength = { kind: "fixed", value: 1 };
      engineOf(spec).variableRez = {
        capabilityKey: "variable_rez_mode",
        addressability: ["choice", "plan", "quote", "debug"],
        visibility: "public",
        ...variableRez,
      };
      return spec;
    };

    const alternate = () =>
      variableRezSpec({
        kind: "alternate_subtype",
        additionalCost: 1,
        baseSubtypes: ["wall"],
        alternateSubtypes: ["code_gate"],
      });
    expect(() => validateUntyped(alternate())).not.toThrow();
    const missingCost = alternate();
    delete (engineOf(missingCost).variableRez as Record<string, unknown>)
      .additionalCost;
    expect(() => validateUntyped(missingCost)).toThrowError(
      /alternate subtype requires cost/,
    );
    const emptySubtypes = alternate();
    (
      engineOf(emptySubtypes).variableRez as Record<string, unknown>
    ).alternateSubtypes = [];
    expect(() => validateUntyped(emptySubtypes)).toThrowError(
      /both subtype sets/,
    );

    const paid = variableRezSpec({
      kind: "paid_end_the_run_subroutines",
      additionalCostPerSubroutine: 2,
      minSubroutines: 0,
    });
    expect(() => validateUntyped(paid)).not.toThrow();
    (
      engineOf(paid).variableRez as Record<string, unknown>
    ).additionalCostPerSubroutine = 1;
    expect(() => validateUntyped(paid)).toThrowError(
      /require cost 2 and minimum 0/,
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

  it("keeps card evidence profiles and capability evidence anchors disjoint", () => {
    const strategySupport = {
      kind: "strategy_support",
      strategyKey: "corp.tag_trace_punish",
      role: "anchor_evidence",
      roleDetail: "anchor_evidence_trace_source",
      confidence: "high",
    };
    const cardAnchor = untypedSpec();
    cardAnchor.planningAnnotations = {
      schemaVersion: "card-planning-annotations-v1",
      card: [{ ...strategySupport, evidenceAnchor: "trace.source" }],
    };
    expect(() => validateUntyped(cardAnchor)).toThrowError(
      /forbidden on card annotations/,
    );

    const capabilityProfile = untypedSpec();
    engineOf(capabilityProfile).abilities = [
      {
        kind: "on_play",
        costs: {},
        effects: [],
        capabilityKey: "trace-source",
        addressability: ["action"],
      },
    ];
    capabilityProfile.planningAnnotations = {
      schemaVersion: "card-planning-annotations-v1",
      capabilities: [
        {
          capabilityKey: "trace-source",
          annotations: [
            {
              ...strategySupport,
              evidenceProfile: "x_strength_trace_ice",
            },
          ],
        },
      ],
    };
    expect(() => validateUntyped(capabilityProfile)).toThrowError(
      /forbidden on capability annotations/,
    );

    const both = untypedSpec();
    both.planningAnnotations = {
      schemaVersion: "card-planning-annotations-v1",
      card: [
        {
          ...strategySupport,
          evidenceProfile: "x_strength_trace_ice",
          evidenceAnchor: "trace.source",
        },
      ],
    };
    expect(() => validateUntyped(both)).toThrowError(
      /forbidden on card annotations/,
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
