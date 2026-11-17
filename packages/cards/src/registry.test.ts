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

function cloneSpec(id = 901, printingId = `${id}:first`): CardSpec {
  const spec = JSON.parse(JSON.stringify(minimalCardSpec())) as CardSpec;
  spec.identity.cardDefinitionId = id as CardDefinitionId;
  spec.identity.title = `Card ${id}`;
  spec.printings = [{ ...spec.printings[0]!, printingId }];
  return spec;
}

function capabilitySpec(id = 901, key = "gain"): CardSpec {
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
  it("projects typed public hardware characteristics without duplicating runtime contracts", () => {
    expect(
      publicCardViewForDefinitionId(
        ROOT_REGISTRY,
        192 as CardDefinitionId,
      ),
    ).toMatchObject({
      memoryLimitBonus: 2,
      maxHandSizeBonus: 2,
      recurringCredits: 2,
    });
    expect(
      engineCardViewForDefinitionId(
        ROOT_REGISTRY,
        192 as CardDefinitionId,
      )?.engine.characteristics,
    ).toMatchObject({
      memoryLimitBonus: 2,
      maxHandSizeBonus: 2,
      recurringCredits: 2,
    });
    expect(
      publicCardViewForDefinitionId(
        ROOT_REGISTRY,
        56 as CardDefinitionId,
      ),
    ).toMatchObject({ recurringCredits: 1 });
    expect(
      publicCardViewForDefinitionId(
        ROOT_REGISTRY,
        51 as CardDefinitionId,
      ),
    ).toMatchObject({
      memoryLimitBonus: 1,
      maxHandSizeBonus: 1,
      recurringCredits: 1,
    });
    expect(
      publicCardViewForDefinitionId(
        ROOT_REGISTRY,
        209 as CardDefinitionId,
      ),
    ).toMatchObject({
      memoryLimitBonus: 1,
      maxHandSizeBonus: 1,
      recurringCredits: 1,
    });
    expect(
      publicCardViewForDefinitionId(
        ROOT_REGISTRY,
        52 as CardDefinitionId,
      ),
    ).toMatchObject({
      memoryLimitBonus: 1,
      recurringCredits: 2,
    });
  });

  it("projects card-defined Corp hand-size modifiers", () => {
    expect(
      publicCardViewForDefinitionId(
        ROOT_REGISTRY,
        550 as CardDefinitionId,
      ),
    ).toMatchObject({ maxHandSizeBonus: 2 });
    expect(
      publicCardViewForDefinitionId(
        ROOT_REGISTRY,
        417 as CardDefinitionId,
      ),
    ).toMatchObject({ maxHandSizeBonus: 2 });
  });

  it("builds deterministic cached projections and all scoped lookups", () => {
    const active = capabilitySpec();
    active.publication = {
      schemaVersion: "card-publication-v1",
      status: "active",
    };
    const registry = registryFor(
      [active],
      [setSpec({ publication: { status: "active" } })],
    );
    const definitionId = 901;
    const capabilityId = canonicalCapabilityId(
      definitionId,
      capabilityKey("gain"),
    );
    expect(
      cardSpecForDefinitionId(registry, definitionId)?.identity.title,
    ).toBe("Card 901");
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
    ).toMatchObject({
      cardDefinitionId: definitionId,
      prospectiveCapabilities: {
        schemaVersion: "prospective-capability-view-v1",
        cardDefinitionId: definitionId,
        currentLegality:
          "not_evaluated_requires_current_legal_action_or_engine_quote",
      },
    });
    expect(engineCapabilityViewForId(registry, capabilityId)).toMatchObject({
      canonicalCapabilityId: capabilityId,
      capabilityKey: "gain",
    });
    expect(
      publicPrintingViewForId(registry, "901:first")?.printingId,
    ).toBe("901:first");
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
    const first = cloneSpec(904, "one");
    const second = cloneSpec(904, "two");
    expect(() => registryFor([first, second])).toThrowError(
      /duplicate_card_definition_id/,
    );
    expect(Object.isFrozen(first)).toBe(false);

    const a = cloneSpec(902, "duplicate");
    const b = cloneSpec(903, "duplicate");
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
      capabilitySpec(905, "gain"),
      capabilitySpec(906, "gain"),
    ]);
    expect(registryEditorSummary(registry).capabilityCount).toBe(2);
  });

  it("preserves Original Set 041-060 ability identity, limits and costs", () => {
    const mysteryBox = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      255 as CardDefinitionId,
    )!;
    const reflector = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      267 as CardDefinitionId,
    )!;
    const selfModifyingCode = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      271 as CardDefinitionId,
    )!;

    expect(mysteryBox.text.rulesText).toMatch(/^\[0\]:/);
    expect(mysteryBox.engine.abilities).toMatchObject([
      {
        kind: "activated",
        limit: { kind: "once_per_run_per_source", scope: "source" },
      },
    ]);
    expect(reflector.text.rulesText).toMatch(/^\[0\]:/);
    expect(reflector.engine.icebreakerAbilities).toHaveLength(1);
    expect(reflector.engine.icebreakerAbilities).toMatchObject([
      {
        capabilityKey: "icebreaker_abilities_break_subroutine",
        kind: "break_subroutine",
        matches: {
          kind: "subroutine_tag_any_of",
          tags: ["stun", "hellbolt", "knockout"],
        },
      },
    ]);
    expect(selfModifyingCode.text.rulesText).toMatch(/^\[T\]:/);
    expect(selfModifyingCode.engine.abilities).toMatchObject([
      {
        kind: "activated",
        costs: [{ kind: "trash_source", amount: 1 }],
        effects: [{ kind: "search_stack_install" }],
      },
    ]);
  });

  it("preserves Original Set 061-080 prevention, run identity and costs", () => {
    const shield = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      273 as CardDefinitionId,
    )!;
    const shredder = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      274 as CardDefinitionId,
    )!;
    const startupImmolator = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      280 as CardDefinitionId,
    )!;

    expect(shield.engine.damagePreventionSources).toMatchObject([
      {
        amount: 2,
        amountMode: "up_to",
        limit: { kind: "per_turn", amount: 2 },
      },
    ]);
    expect(shredder.engine.abilities).toMatchObject([
      {
        effects: [
          {
            kind: "make_run",
            target: { kind: "central_server", server: "archives" },
            accessServerOverride: "hq",
            successfulRunServerOverride: "hq",
          },
        ],
      },
    ]);
    expect(startupImmolator.text.rulesText).toMatch(/^\[T\]:/);
    expect(startupImmolator.engine.runnerUtilityLongtail).toMatchObject({
      kind: "trash_fully_broken_passed_ice",
      costs: [
        { kind: "trash_source", amount: 1 },
        { kind: "target_rez_cost", target: "that_ice" },
      ],
    });
    expect(startupImmolator.engine.runnerUtilityLongtail).not.toHaveProperty(
      "limit",
    );
    expect(startupImmolator.engine.runnerUtilityLongtail).not.toHaveProperty(
      "trashSourceOnResolve",
    );
  });

  it("preserves Original Set 081-100 counter effects and AI semantics", () => {
    const dealWithMilitech = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      294 as CardDefinitionId,
    )!;
    const editedShippingManifests = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      296 as CardDefinitionId,
    )!;
    const forgottenBackupChip = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      299 as CardDefinitionId,
    )!;
    const lucidrine = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      310 as CardDefinitionId,
    )!;
    const mantis = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      311 as CardDefinitionId,
    )!;

    expect(dealWithMilitech.engine.abilities).toMatchObject([
      {
        effects: [
          {
            kind: "add_counter_to_all_installed_runner_icebreakers",
            counterType: "militech",
            counterEffect: {
              kind: "icebreaker_strength_modifier_per_counter",
              amountPerCounter: 1,
            },
          },
        ],
      },
    ]);
    expect(editedShippingManifests.planningAnnotations!.capabilities).toEqual(
      [],
    );
    expect(forgottenBackupChip.planningAnnotations!.card).not.toContainEqual(
      expect.objectContaining({
        kind: "strategy_anchor",
        strategyKey: "runner.search.breaker",
      }),
    );
    expect(lucidrine.planningAnnotations!.card).not.toContainEqual(
      expect.objectContaining({
        kind: "tactic_interpretation",
        use: "damage.payoff.runner",
      }),
    );
    expect(mantis.planningAnnotations!.capabilities).toContainEqual(
      expect.objectContaining({
        annotations: expect.arrayContaining([
          expect.objectContaining({
            kind: "target_preference",
            purpose: "generic_stack_search",
          }),
        ]),
      }),
    );
  });

  it("preserves Original Set 101-120 random, run and AI semantics", () => {
    const playfulAi = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      316 as CardDefinitionId,
    )!;
    const privateLdl = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      318 as CardDefinitionId,
    )!;
    const synchronizedAttack = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      325 as CardDefinitionId,
    )!;
    const temple = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      326 as CardDefinitionId,
    )!;
    const reprisal = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      327 as CardDefinitionId,
    )!;
    const totalRetrofit = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      328 as CardDefinitionId,
    )!;
    const weatherPipe = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      330 as CardDefinitionId,
    )!;

    expect(playfulAi.engine.runnerEventLongtail).toMatchObject({
      kind: "random_dice_loop",
      choiceOn: [1, 2, 3],
      choice: {
        kind: "split_roll_between_credits_and_set_aside_dice",
        mode: "any_nonnegative_integer_split",
        creditRecipient: "runner",
      },
      setAsideDiceResolution: { kind: "roll_each", recursive: true },
    });
    expect(privateLdl.engine.abilities).toMatchObject([
      {
        effects: [
          {
            kind: "make_run",
            target: { kind: "central_server", server: "hq" },
            accessServerOverride: "rd",
            successfulRunServerOverride: "rd",
          },
        ],
      },
    ]);
    expect(totalRetrofit.engine.abilities?.[0]).not.toHaveProperty("condition");
    expect(synchronizedAttack.planningAnnotations!.card).toEqual([
      { kind: "plan_role", role: "pressure_hq" },
      { kind: "plan_role", role: "hq_credit_denial" },
      { kind: "strategic_role", role: "support_tool" },
      {
        kind: "line_support",
        lineKey: "runner.hq_pressure",
        support: "supports",
      },
    ]);
    expect(temple.planningAnnotations!.card).not.toContainEqual(
      expect.objectContaining({ kind: "plan_role", role: "draw_for_answers" }),
    );
    expect(temple.planningAnnotations!.card).not.toContainEqual(
      expect.objectContaining({
        kind: "tactic_interpretation",
        use: "draw.card",
      }),
    );
    expect(reprisal.planningAnnotations!.card).toEqual([
      { kind: "plan_role", role: "pressure_hq" },
      { kind: "plan_role", role: "random_discard_pressure" },
    ]);
    expect(weatherPipe.planningAnnotations!.card).toEqual([
      { kind: "plan_role", role: "pressure_hq" },
      { kind: "plan_role", role: "hq_credit_denial" },
    ]);
  });

  it("keeps the final Originalset audit block canonical and planning-precise", () => {
    const namatoki = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      573 as CardDefinitionId,
    )!;
    const tokyoChiba = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      583 as CardDefinitionId,
    )!;
    const washington = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      586 as CardDefinitionId,
    )!;

    expect(namatoki.engine.leavePlayCleanup).toContainEqual(
      expect.objectContaining({
        kind: "trash_agenda_or_node_if_fort_over_capacity",
        selection: "corp_choice",
      }),
    );
    expect(tokyoChiba.text.rulesText).toContain(
      "Only one region may be installed in each fort. Trash older ones.",
    );
    expect(washington.planningAnnotations?.card).not.toContainEqual(
      expect.objectContaining({
        kind: "tactic_interpretation",
        signal: "corp.remote_protection",
      }),
    );
    expect(washington.planningAnnotations?.card).toContainEqual({
      kind: "remote_role",
      role: "score_acceleration",
      threatLevel: "medium",
    });
  });

  it("keeps the random production sample text and planning annotations precise", () => {
    const nightShift = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      507 as CardDefinitionId,
    )!;
    const aujourdOui = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      363 as CardDefinitionId,
    )!;
    const crashEverett = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      369 as CardDefinitionId,
    )!;
    const encryptionBreakthrough = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      412 as CardDefinitionId,
    )!;
    const chesterMix = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      564 as CardDefinitionId,
    )!;

    expect(nightShift.text.rulesText).toBe("Gain [2] and draw one card.");
    expect(aujourdOui.planningAnnotations?.card).not.toContainEqual(
      expect.objectContaining({
        kind: "target_preference",
        avoid: expect.arrayContaining(["hidden_info_dependent_choice"]),
      }),
    );
    expect(crashEverett.planningAnnotations?.card).not.toContainEqual(
      expect.objectContaining({
        kind: "target_preference",
        avoid: expect.arrayContaining(["hidden_info_dependent_choice"]),
      }),
    );
    expect(encryptionBreakthrough.text.rulesText).toContain("gain [1]");
    expect(chesterMix.text.rulesText).toBe(
      "The cost to install ice on this fort is reduced by [2].",
    );
  });

  it("preserves Batch 5 source symbols in canonical card text", () => {
    const text = (cardId: CardDefinitionId) =>
      cardSpecForDefinitionId(ROOT_REGISTRY, cardId as CardDefinitionId)!.text
        .rulesText;

    expect(text(275)).toMatch(/^\[1\]:/);
    expect(text(261)).toContain("pay [1]");
    expect(text(218)).toBe(
      "[2]: Break sentry subroutine.\n[2]: +1 strength.",
    );
    expect(text(355)).toContain(
      "Use these bits only",
    );
    expect(text(278)).toContain(
      "[1]: Break sentry subroutine.\n[1]: +1 strength.",
    );
    expect(text(567)).toContain("pay [1]");
    expect(text(284)).toBe(
      "[0]: Break sentry subroutine.\n[3]: +1 strength.",
    );
    expect(text(375)).toBe(
      "Gain [1] at the start of each of your turns.",
    );
    expect(text(290)).toContain("Gain [10]");
    expect(text(309)).toBe("Gain [3].");
    expect(text(420)).toMatch(/^A:/);
    expect(text(425)).toMatch(/^A:/);
  });

  it("preserves Batch 6 source symbols in canonical card text", () => {
    const text = (cardId: CardDefinitionId) =>
      cardSpecForDefinitionId(ROOT_REGISTRY, cardId as CardDefinitionId)!.text
        .rulesText;

    expect(text(270)).toMatch(/^A, \[1\]:/);
    expect(text(395)).toMatch(/^A:/);
    expect(text(415)).toBe(
      "Gain [5] when you score Hostile Takeover.",
    );
    expect(text(330)).toContain(
      "the Corp loses [4]",
    );
    expect(text(391)).toMatch(
      /^A: Gain \[1\]/,
    );
    expect(text(376)).toMatch(/^Put \[1\]/);
    expect(text(419)).toMatch(/^A:/);
    expect(text(529)).toContain("reduced by [2]");
    expect(text(526)).toContain(
      "gain [1]",
    );
  });

  it("preserves Batch 14 credit symbols in canonical card text", () => {
    const text = (cardId: CardDefinitionId) =>
      cardSpecForDefinitionId(ROOT_REGISTRY, cardId as CardDefinitionId)!.text
        .rulesText;

    expect(text(233)).toBe(
      "[1]: Break wall subroutine.\n[1]: +1 strength.",
    );
    expect(text(371)).toContain("Gain [10].");
    expect(text(227)).toBe(
      "[1]: Break sentry subroutine.",
    );
    expect(text(266)).toBe(
      "[2]: Break sentry subroutine.\n[1]: +1 strength.",
    );
    expect(text(399)).toContain(
      "cannot spend more than [3]",
    );
    expect(text(500)).toBe("Draw two cards and gain [1].");
  });

  it("preserves Mastiff's printed Trace 5 in canonical card text", () => {
    const mastiff = cardSpecForDefinitionId(
      ROOT_REGISTRY,
      467 as CardDefinitionId,
    );

    expect(mastiff?.text.rulesText).toContain(
      "*Trace 5-If trace is successful",
    );
    expect(
      mastiff?.engine.printedSubroutines?.find(
        (subroutine) => subroutine.kind === "trace",
      ),
    ).toMatchObject({ traceLimit: 5 });
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
    const first = registryFor([cloneSpec(902), cloneSpec(903)]);
    const second = registryFor([cloneSpec(903), cloneSpec(902)]);
    expect(registryFingerprintsFor(first)).toEqual(
      registryFingerprintsFor(second),
    );
    expect(
      publicCardViews(second).map((card) => card.cardDefinitionId),
    ).toEqual([902, 903]);
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
    sourceCards.push(cloneSpec(907));
    const spec = cardSpecForDefinitionId(
      registry,
      901,
    )!;
    const publicView = publicCardViewForDefinitionId(
      registry,
      901,
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
        901,
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
      publicCardViewForDefinitionId(registry, 901),
    ).toBeUndefined();
    expect(publicSetViewForId(registry, "testset")).toBeUndefined();
    expect(
      engineCardViewForDefinitionId(registry, 901),
    ).toBeUndefined();
    expect(
      planningCardViewForDefinitionId(
        registry,
        901,
      ),
    ).toBeUndefined();
    expect(editorCardViews(registry)).toHaveLength(1);
    expect(printingSpecForId(registry, "901:first")).toBeDefined();
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
    expect(printingSpecForId(registry, "901:first")).toBeDefined();
  });

  it("builds a positive public allowlist without engine, planning or publication", () => {
    const view = publicCardViewForDefinitionId(
      registryFor([capabilitySpec()]),
      901,
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
    const registry = registryFor([cloneSpec(902), cloneSpec(903)]);
    const versions = {
      engineSchemaVersion: "engine-v1",
      cardImplementationVersion: "implementations-v1",
      primitiveContractVersion: "primitives-v1",
      cardPoolSnapshotId: "test-pool-v1",
      matchCardPoolDefinitionIds: [902, 903],
    } as const;
    const rules = createRulesContextForRegistry(registry, versions);
    expect(() => assertCardRegistryRulesContext(rules)).not.toThrow();
    const reordered = createRulesContextForRegistry(registry, {
      ...versions,
      matchCardPoolDefinitionIds: [903, 902],
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
      matchCardPoolDefinitionIds: [902],
    });
    expect(subset.cardPoolFingerprint).not.toBe(rules.cardPoolFingerprint);
    expect(() =>
      createRulesContextForRegistry(registry, {
        ...versions,
        matchCardPoolDefinitionIds: [908],
      }),
    ).toThrowError(CardRegistryError);

    const planning = createPlanningContextForRegistry(registry, rules, {
      actionSemanticSchemaVersion: "actions-v1",
      plannerPolicyVersion: "planner-v1",
      planModuleSetFingerprint: "plans-v1",
    });
    expect(() => assertCardRegistryPlanningContext(planning)).not.toThrow();
    expect(planning.rulesContextFingerprint).toBe(rules.fingerprint);
    const annotatedA = cloneSpec(902);
    annotatedA.planningAnnotations = {
      schemaVersion: "card-planning-annotations-v1",
      card: [{ kind: "strategy_anchor", strategyKey: "economy" }],
    };
    const annotatedRegistry = registryFor([annotatedA, cloneSpec(903)]);
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
    const textOnly = cloneSpec(902);
    textOnly.identity.title = "Renamed";
    const textRegistry = registryFor([textOnly, cloneSpec(903)]);
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
      const a = cloneSpec(902);
      mutate(a);
      expect(
        createRulesContextForRegistry(
          registryFor([a, cloneSpec(903)]),
          versions,
        ).fingerprint,
      ).toBe(rules.fingerprint);
    }
    const otherSpec = cloneSpec(902);
    otherSpec.engine.characteristics.baseLink = 2;
    const otherRegistry = registryFor([otherSpec, cloneSpec(903)]);
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
