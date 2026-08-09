import type { CardDefinitionId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { canonicalCapabilityId, capabilityKey } from "./capability-identity";
import type { CardSpec, SetSpec } from "./contracts";
import {
  assertCardRegistryPlanningContext,
  assertCardRegistryRulesContext,
  fingerprint,
  FingerprintContractError,
} from "./fingerprints";
import {
  cardSpecForDefinitionId,
  createCardRegistry,
  createRulesContextForRegistry,
  createPlanningContextForRegistry,
  editorCardViews,
  engineCapabilityViewForId,
  engineCardViewForDefinitionId,
  planningCardViewForDefinitionId,
  printingSpecForId,
  publicCardViewForDefinitionId,
  publicCardViews,
  publicPrintingViewForId,
  publicSetViewForId,
  registryEditorSummary,
  registryFingerprintsFor,
  CardRegistryError,
} from "./registry";
import { CARD_REGISTRY as ROOT_REGISTRY } from "./registry-runtime";
import * as ServerApi from "./server/index";
import { CARD_REGISTRY as EDITOR_REGISTRY } from "./editor/index";
import * as PlanningApi from "./planning/index";
import { minimalCardSpec } from "./test-fixtures";

const setSpec = (overrides: Partial<SetSpec> = {}): SetSpec => ({
  schemaVersion: "set-spec-v1",
  setId: "testset",
  name: "Test Set",
  sortOrder: 1,
  publication: { status: "experimental" },
  ...overrides,
});

function cloneSpec(id = "test_card", printingId = `${id}:first`): CardSpec {
  const spec = JSON.parse(JSON.stringify(minimalCardSpec())) as CardSpec;
  spec.identity.cardDefinitionId = id as CardDefinitionId;
  spec.identity.title = id;
  spec.printings = [{ ...spec.printings[0]!, printingId }];
  return spec;
}

function capabilitySpec(id = "test_card", key = "gain"): CardSpec {
  const spec = cloneSpec(id);
  spec.text.capabilityText = [
    { capabilityKey: capabilityKey(key), actionLabel: "Gain credits" },
  ];
  (spec.engine as Record<string, unknown>).abilities = [
    {
      kind: "on_play",
      costs: {},
      effects: [],
      capabilityKey: capabilityKey(key),
      addressability: ["action"],
    },
  ];
  return spec;
}

function registryFor(
  cards: readonly CardSpec[] = [cloneSpec()],
  sets: readonly SetSpec[] = [setSpec()],
) {
  return createCardRegistry({ cardSpecs: cards, setSpecs: sets });
}

describe("CardRegistry", () => {
  it("builds deterministic cached projections and all scoped lookups", () => {
    const registry = registryFor([capabilitySpec()]);
    const definitionId = "test_card" as CardDefinitionId;
    const capabilityId = canonicalCapabilityId(
      definitionId,
      capabilityKey("gain"),
    );
    expect(
      cardSpecForDefinitionId(registry, definitionId)?.identity.title,
    ).toBe("test_card");
    expect(publicCardViewForDefinitionId(registry, definitionId)).toMatchObject(
      {
        cardDefinitionId: definitionId,
        capabilityText: [{ capabilityKey: "gain" }],
      },
    );
    expect(engineCardViewForDefinitionId(registry, definitionId)).toMatchObject(
      {
        cardDefinitionId: definitionId,
      },
    );
    expect(
      planningCardViewForDefinitionId(registry, definitionId),
    ).toMatchObject({ cardDefinitionId: definitionId });
    expect(engineCapabilityViewForId(registry, capabilityId)).toMatchObject({
      canonicalCapabilityId: capabilityId,
      capabilityKey: "gain",
    });
    expect(
      publicPrintingViewForId(registry, "test_card:first")?.printingId,
    ).toBe("test_card:first");
    expect(publicSetViewForId(registry, "testset")?.name).toBe("Test Set");
    expect(publicCardViewForDefinitionId(registry, definitionId)).toBe(
      publicCardViewForDefinitionId(registry, definitionId),
    );
    expect(publicCardViews(registry)).toBe(publicCardViews(registry));
    expect(registryEditorSummary(registry)).toMatchObject({
      definitionCount: 1,
      printingCount: 1,
      setCount: 1,
      capabilityCount: 1,
    });
  });

  it("rejects every global duplicate and orphan set reference before freezing", () => {
    const first = cloneSpec("same", "one");
    const second = cloneSpec("same", "two");
    expect(() => registryFor([first, second])).toThrowError(
      /duplicate_card_definition_id/,
    );
    expect(Object.isFrozen(first)).toBe(false);

    const a = cloneSpec("a", "duplicate");
    const b = cloneSpec("b", "duplicate");
    expect(() => registryFor([a, b])).toThrowError(/duplicate_printing_id/);
    expect(Object.isFrozen(a)).toBe(false);

    expect(() => registryFor([], [setSpec(), setSpec()])).toThrowError(
      /duplicate_set_id/,
    );
    const orphan = cloneSpec();
    orphan.printings = [{ ...orphan.printings[0]!, setId: "missing" }];
    expect(() => registryFor([orphan])).toThrowError(/orphan_printing_set/);
  });

  it("allows the same local capabilityKey on different cards", () => {
    const registry = registryFor([
      capabilitySpec("first", "gain"),
      capabilitySpec("second", "gain"),
    ]);
    expect(registryEditorSummary(registry).capabilityCount).toBe(2);
  });

  it("rejects duplicate capability identities within one CardSpec", () => {
    const spec = capabilitySpec();
    (spec.engine as Record<string, unknown>).abilities = [
      ...((spec.engine as Record<string, unknown>).abilities as unknown[]),
      ...((spec.engine as Record<string, unknown>).abilities as unknown[]),
    ];
    expect(() => registryFor([spec])).toThrowError(/duplicate_capability_key/);
  });

  it("is invariant to input and authoring insertion order", () => {
    const first = registryFor([cloneSpec("a"), cloneSpec("b")]);
    const second = registryFor([cloneSpec("b"), cloneSpec("a")]);
    expect(registryFingerprintsFor(first)).toEqual(
      registryFingerprintsFor(second),
    );
    expect(
      publicCardViews(second).map((card) => card.cardDefinitionId),
    ).toEqual(["a", "b"]);
    expect(fingerprint("order-v1", { b: 2, a: 1 })).toBe(
      fingerprint("order-v1", { a: 1, b: 2 }),
    );
  });

  it("does not expose mutable maps and freezes specs, projections and summaries", () => {
    const sourceCards = [capabilitySpec()];
    sourceCards[0]!.planningAnnotations = {
      schemaVersion: "card-planning-annotations-v1",
      card: [{ kind: "strategy_anchor", strategyKey: "economy" }],
    };
    const registry = registryFor(sourceCards);
    sourceCards.push(cloneSpec("late"));
    const spec = cardSpecForDefinitionId(
      registry,
      "test_card" as CardDefinitionId,
    )!;
    const publicView = publicCardViewForDefinitionId(
      registry,
      "test_card" as CardDefinitionId,
    )!;
    expect(Object.isFrozen(registry)).toBe(true);
    expect(Object.isFrozen(spec.engine)).toBe(true);
    expect(Object.isFrozen(spec.engine.characteristics.numeric)).toBe(true);
    expect(Object.isFrozen(publicView.printings)).toBe(true);
    expect(Object.isFrozen(registryEditorSummary(registry).fingerprints)).toBe(
      true,
    );
    expect(
      Object.values(registry).some(
        (value) => (value as unknown) instanceof Map,
      ),
    ).toBe(false);
    expect(publicCardViews(registry)).toHaveLength(1);
    expect(() =>
      (publicView.printings as unknown as unknown[]).push({}),
    ).toThrow();
    expect(
      () =>
        ((
          spec.engine.characteristics.numeric as { installCost: number | null }
        ).installCost = 2),
    ).toThrow();
    const capability = engineCapabilityViewForId(
      registry,
      canonicalCapabilityId(
        "test_card" as CardDefinitionId,
        capabilityKey("gain"),
      ),
    )!;
    expect(
      () =>
        ((capability.capability as unknown as { kind: string }).kind =
          "changed"),
    ).toThrow();
    expect(
      () =>
        ((
          spec.planningAnnotations!.card![0] as { strategyKey: string }
        ).strategyKey = "changed"),
    ).toThrow();
    const editor = editorCardViews(registry)[0]!;
    expect(
      () => ((editor.spec.identity as { title: string }).title = "changed"),
    ).toThrow();
    expect(
      () =>
        ((
          registryEditorSummary(registry).fingerprints as {
            registryFingerprint: string;
          }
        ).registryFingerprint = "changed"),
    ).toThrow();
  });

  it("keeps publication internal and excludes disabled cards and sets publicly", () => {
    const disabled = cloneSpec();
    disabled.publication = {
      schemaVersion: "card-publication-v1",
      status: "disabled",
      blockReason: "editorial",
    };
    const disabledSet = setSpec({
      publication: { status: "disabled", blockReason: "editorial" },
    });
    const registry = registryFor([disabled], [disabledSet]);
    expect(publicCardViews(registry)).toEqual([]);
    expect(
      publicCardViewForDefinitionId(registry, "test_card" as CardDefinitionId),
    ).toBeUndefined();
    expect(publicSetViewForId(registry, "testset")).toBeUndefined();
    expect(
      engineCardViewForDefinitionId(registry, "test_card" as CardDefinitionId),
    ).toBeDefined();
    expect(editorCardViews(registry)).toHaveLength(1);
    expect(printingSpecForId(registry, "test_card:first")).toBeDefined();
  });

  it("keeps printings internal when their set is not public", () => {
    const registry = registryFor(
      [cloneSpec()],
      [
        setSpec({
          publication: { status: "disabled", blockReason: "historical" },
        }),
      ],
    );
    expect(publicCardViews(registry)).toEqual([]);
    expect(publicSetViewForId(registry, "testset")).toBeUndefined();
    expect(printingSpecForId(registry, "test_card:first")).toBeDefined();
  });

  it("builds a positive public allowlist without engine, planning or publication", () => {
    const view = publicCardViewForDefinitionId(
      registryFor([capabilitySpec()]),
      "test_card" as CardDefinitionId,
    )!;
    const forbidden = new Set([
      "engine",
      "planningAnnotations",
      "publication",
      "publicationStatus",
      "publicationBlockReason",
      "actionId",
      "stateVersion",
    ]);
    const keys = new Set<string>();
    const visit = (value: unknown): void => {
      if (Array.isArray(value)) return value.forEach(visit);
      if (value === null || typeof value !== "object") return;
      for (const [key, entry] of Object.entries(value)) {
        keys.add(key);
        visit(entry);
      }
    };
    visit(view);
    expect([...keys].filter((key) => forbidden.has(key))).toEqual([]);
    expect(Object.keys(view).sort()).toEqual(
      [
        "capabilityText",
        "cardDefinitionId",
        "cardType",
        "faction",
        "numeric",
        "playCost",
        "printingFingerprint",
        "printings",
        "rulesText",
        "schemaVersion",
        "side",
        "strength",
        "subtypes",
        "textFingerprint",
        "title",
      ].sort(),
    );
    expect(Object.keys(view.printings[0]!).sort()).toEqual([
      "printingId",
      "setId",
    ]);
  });

  it("changes only the intended section fingerprints", () => {
    const baseline = registryFingerprintsFor(registryFor());
    const mutation = (change: (spec: CardSpec) => void) => {
      const spec = cloneSpec();
      change(spec);
      return registryFingerprintsFor(registryFor([spec]));
    };
    const text = mutation((spec) => {
      spec.identity.title = "Renamed";
    });
    expect(text.textAggregateFingerprint).not.toBe(
      baseline.textAggregateFingerprint,
    );
    expect(text.cardRulesAggregateFingerprint).toBe(
      baseline.cardRulesAggregateFingerprint,
    );
    const engine = mutation((spec) => {
      spec.engine.characteristics.baseLink = 1;
    });
    expect(engine.cardRulesAggregateFingerprint).not.toBe(
      baseline.cardRulesAggregateFingerprint,
    );
    expect(engine.registryCardPoolFingerprint).toBe(
      baseline.registryCardPoolFingerprint,
    );
    const side = mutation((spec) => {
      spec.identity.side = "corp";
      spec.identity.cardType = "operation";
    });
    expect(side.cardRulesAggregateFingerprint).not.toBe(
      baseline.cardRulesAggregateFingerprint,
    );
    const provenance = mutation((spec) => {
      spec.rules.references = [
        ...spec.rules.references,
        { source: "project_ruling", reference: "ruling-1" },
      ];
      spec.text.reminderText = "Remember this.";
    });
    expect(provenance.textAggregateFingerprint).not.toBe(
      baseline.textAggregateFingerprint,
    );
    expect(provenance.cardRulesAggregateFingerprint).toBe(
      baseline.cardRulesAggregateFingerprint,
    );
    const face = mutation((spec) => {
      spec.printings = [{ ...spec.printings[0]!, faceTextOverride: "Other" }];
    });
    expect(face.textAggregateFingerprint).not.toBe(
      baseline.textAggregateFingerprint,
    );
    expect(face.printingAggregateFingerprint).toBe(
      baseline.printingAggregateFingerprint,
    );
    const printing = mutation((spec) => {
      spec.printings = [{ ...spec.printings[0]!, collectorNumber: "2" }];
    });
    expect(printing.printingAggregateFingerprint).not.toBe(
      baseline.printingAggregateFingerprint,
    );
    expect(printing.textAggregateFingerprint).toBe(
      baseline.textAggregateFingerprint,
    );
    const publication = mutation((spec) => {
      spec.publication = {
        schemaVersion: "card-publication-v1",
        status: "active",
      };
    });
    expect(publication.publicationAggregateFingerprint).not.toBe(
      baseline.publicationAggregateFingerprint,
    );
    expect(publication.cardRulesAggregateFingerprint).toBe(
      baseline.cardRulesAggregateFingerprint,
    );
    const planning = mutation((spec) => {
      spec.planningAnnotations = {
        schemaVersion: "card-planning-annotations-v1",
        card: [{ kind: "strategy_anchor", strategyKey: "economy" }],
      };
    });
    expect(planning.planningAnnotationsAggregateFingerprint).not.toBe(
      baseline.planningAnnotationsAggregateFingerprint,
    );
    expect(planning.cardRulesAggregateFingerprint).toBe(
      baseline.cardRulesAggregateFingerprint,
    );
    expect(planning.textAggregateFingerprint).toBe(
      baseline.textAggregateFingerprint,
    );
    const setPrinting = registryFingerprintsFor(
      registryFor([cloneSpec()], [setSpec({ name: "Renamed Set" })]),
    );
    expect(setPrinting.printingAggregateFingerprint).not.toBe(
      baseline.printingAggregateFingerprint,
    );
    expect(setPrinting.publicationAggregateFingerprint).toBe(
      baseline.publicationAggregateFingerprint,
    );
    const setPublication = registryFingerprintsFor(
      registryFor(
        [cloneSpec()],
        [setSpec({ publication: { status: "active" } })],
      ),
    );
    expect(setPublication.publicationAggregateFingerprint).not.toBe(
      baseline.publicationAggregateFingerprint,
    );
    expect(setPublication.printingAggregateFingerprint).toBe(
      baseline.printingAggregateFingerprint,
    );
  });

  it("binds rules and planning contexts to registry, pool and primitive versions", () => {
    const registry = registryFor([cloneSpec("a"), cloneSpec("b")]);
    const versions = {
      engineSchemaVersion: "engine-v1",
      cardImplementationVersion: "implementations-v1",
      primitiveContractVersion: "primitives-v1",
      cardPoolSnapshotId: "test-pool-v1",
      matchCardPoolDefinitionIds: ["a", "b"],
    } as const;
    const rules = createRulesContextForRegistry(registry, versions);
    expect(() => assertCardRegistryRulesContext(rules)).not.toThrow();
    const reordered = createRulesContextForRegistry(registry, {
      ...versions,
      matchCardPoolDefinitionIds: ["b", "a"],
    });
    expect(reordered.fingerprint).toBe(rules.fingerprint);
    const primitiveChange = createRulesContextForRegistry(registry, {
      ...versions,
      primitiveContractVersion: "primitives-v2",
    });
    expect(primitiveChange.fingerprint).not.toBe(rules.fingerprint);
    const snapshotChange = createRulesContextForRegistry(registry, {
      ...versions,
      cardPoolSnapshotId: "test-pool-v2",
    });
    expect(snapshotChange.fingerprint).not.toBe(rules.fingerprint);
    const subset = createRulesContextForRegistry(registry, {
      ...versions,
      matchCardPoolDefinitionIds: ["a"],
    });
    expect(subset.cardPoolFingerprint).not.toBe(rules.cardPoolFingerprint);
    expect(() =>
      createRulesContextForRegistry(registry, {
        ...versions,
        matchCardPoolDefinitionIds: ["ghost"],
      }),
    ).toThrowError(CardRegistryError);

    const planning = createPlanningContextForRegistry(registry, rules, {
      actionSemanticSchemaVersion: "actions-v1",
      plannerPolicyVersion: "planner-v1",
      planModuleSetFingerprint: "plans-v1",
    });
    expect(() => assertCardRegistryPlanningContext(planning)).not.toThrow();
    expect(planning.rulesContextFingerprint).toBe(rules.fingerprint);
    const annotatedA = cloneSpec("a");
    annotatedA.planningAnnotations = {
      schemaVersion: "card-planning-annotations-v1",
      card: [{ kind: "strategy_anchor", strategyKey: "economy" }],
    };
    const annotatedRegistry = registryFor([annotatedA, cloneSpec("b")]);
    const annotatedPlanning = createPlanningContextForRegistry(
      annotatedRegistry,
      rules,
      {
        actionSemanticSchemaVersion: "actions-v1",
        plannerPolicyVersion: "planner-v1",
        planModuleSetFingerprint: "plans-v1",
      },
    );
    expect(annotatedPlanning.rulesContextFingerprint).toBe(
      planning.rulesContextFingerprint,
    );
    expect(annotatedPlanning.fingerprint).not.toBe(planning.fingerprint);
    for (const changedVersions of [
      {
        actionSemanticSchemaVersion: "actions-v2",
        plannerPolicyVersion: "planner-v1",
        planModuleSetFingerprint: "plans-v1",
      },
      {
        actionSemanticSchemaVersion: "actions-v1",
        plannerPolicyVersion: "planner-v2",
        planModuleSetFingerprint: "plans-v1",
      },
      {
        actionSemanticSchemaVersion: "actions-v1",
        plannerPolicyVersion: "planner-v1",
        planModuleSetFingerprint: "plans-v2",
      },
    ])
      expect(
        createPlanningContextForRegistry(registry, rules, changedVersions)
          .fingerprint,
      ).not.toBe(planning.fingerprint);
    const textOnly = cloneSpec("a");
    textOnly.identity.title = "Renamed";
    const textRegistry = registryFor([textOnly, cloneSpec("b")]);
    expect(
      createRulesContextForRegistry(textRegistry, versions).fingerprint,
    ).toBe(rules.fingerprint);
    for (const mutate of [
      (spec: CardSpec) => {
        spec.printings = [
          { ...spec.printings[0]!, collectorNumber: "different" },
        ];
      },
      (spec: CardSpec) => {
        spec.planningAnnotations = {
          schemaVersion: "card-planning-annotations-v1",
          card: [{ kind: "strategy_anchor", strategyKey: "different" }],
        };
      },
      (spec: CardSpec) => {
        spec.publication = {
          schemaVersion: "card-publication-v1",
          status: "active",
        };
      },
    ]) {
      const a = cloneSpec("a");
      mutate(a);
      expect(
        createRulesContextForRegistry(
          registryFor([a, cloneSpec("b")]),
          versions,
        ).fingerprint,
      ).toBe(rules.fingerprint);
    }
    const otherSpec = cloneSpec("a");
    otherSpec.engine.characteristics.baseLink = 2;
    const otherRegistry = registryFor([otherSpec, cloneSpec("b")]);
    const otherRules = createRulesContextForRegistry(otherRegistry, versions);
    expect(() =>
      createPlanningContextForRegistry(registry, otherRules, {
        actionSemanticSchemaVersion: "actions-v1",
        plannerPolicyVersion: "planner-v1",
        planModuleSetFingerprint: "plans-v1",
      }),
    ).toThrowError(FingerprintContractError);
  });

  it("builds the production singleton once for internal and editor access", () => {
    expect(ROOT_REGISTRY).toBe(EDITOR_REGISTRY);
    expect(PlanningApi.assertCardRegistryPlanningContext).toBeTypeOf(
      "function",
    );
    expect(PlanningApi.assertCardRegistryRulesContext).toBeTypeOf("function");
    expect(PlanningApi.createPlanningRegistryContext).toBeTypeOf("function");
    expect(ServerApi.getPublicCardView).toBeTypeOf("function");
    expect(ServerApi.listPublicCardViews).toBeTypeOf("function");
  });
});
