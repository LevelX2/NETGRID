import { cardSpecPlanningCards, planningCards } from "@netgrid/cards/planning";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import generatedArtifact from "../../../data/ai/card-spec-ai-hints-generated.json";
import originalsetReviewedGolden from "./test-fixtures/originalset-v1-card-spec-ai-hints-reviewed-v1.json";
import reviewedGolden from "./test-fixtures/proteus-card-spec-ai-hints-reviewed-v1.json";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

const reviewedIds = new Set(
  reviewedGolden.cards.map((record) => record.cardId),
);

describe("Proteus CardSpec AI hint reviewed semantic golden", () => {
  it("binds the reviewed dispositions to the exact pinned migration report", () => {
    expect(reviewedGolden.schemaVersion).toBe(
      "proteus-card-spec-ai-hint-reviewed-golden-v1",
    );
    expect(reviewedGolden.dispositions).toEqual({
      mechanicalFacts:
        "derived_only_from_closed_typed_proteus_card_spec_engine_nodes",
      sharedSubroutineFacts:
        "exact13_previously_shared_runtime_subroutines_on_10_cards_are_canonical_typed_engine_nodes_including_homing_trace_run_lock",
      closedCardStrategyEvidence:
        "card_level_profiles_are_closed_and_mechanically_validated_capability_level_anchors_remain_disjoint",
      longtailMechanicalHints:
        "eight_reviewed_family_kind_translators_preserve_typed_mechanical_hint_surfaces_with_negative_mutation_gates",
      dynamicSharedSubroutineHints:
        "relative_ice_and_x_trace_placeholders_never_compile_as_fixed_zero_values_and_are_bound_to_their_typed_dynamic_owners",
      currentRunAdditionalAccess:
        "typed_access_start_abilities_derive_exact_hq_or_rd_multiaccess_routes_and_reject_malformed_cost_condition_effect_or_visibility_shapes",
      planOwnedMechanicalRoutes:
        "typed_next_agenda_access_free_rez_post_pass_derez_and_pay_or_end_run_nodes_restore_existing_pressure_development_and_defense_owners_with_negative_shape_gates",
      planningClassifications:
        "derived_only_from_closed_typed_card_and_capability_annotations",
      scenarioAndQuality:
        "regenerated_from_current_ai_supported_scenario_evidence",
      actionCapacity:
        "exact16_profiles_on_15_cards_derived_from_typed_mechanical_owners",
      tagPreventionCosts:
        "credit_and_forgo_next_action_is_action_debt_credit_and_trash_source_is_not_an_action_penalty",
      capabilityStrategyEvidence:
        "exact22_pairs_on_12_cards_after_removing_five_opponent_strategy_misclassifications",
      passiveHuntingPackPair:
        "discarded_non_action_addressable_relative_ice_trace_classification",
      disintegratorTargetProfile:
        "canonical_breaker_effect_owner_replaces_stale_legacy_timing_and_visibility_claim",
      canonicalDamageValues:
        "fixed_damage_values_derive_from_typed_mechanics_instead_of_legacy_empty_value_hints",
      streetwareEconomyValue:
        "typed_three_credit_recurring_mechanic_replaces_stale_legacy_economy_one_evaluation",
      legacyEditorialNotes: "discarded_all_nonruntime_manual_notes",
      timeToCollectLegacyCondition:
        "discard_stale_requires_program_trash_because_the_typed_owner_prevents_resource_trash_without_a_program_cost",
    });
  });

  it("pins all 151 complete compiler outputs including explicit absences", () => {
    const compiled = cardSpecPlanningCards()
      .filter((entry) => reviewedIds.has(entry.definition.id))
      .map((entry) => ({
        cardId: entry.definition.id,
        hint: deriveCardSpecAiHint(entry),
      }))
      .sort((left, right) => left.cardId.localeCompare(right.cardId));

    expect(reviewedGolden.cards).toHaveLength(151);
    expect(reviewedIds.size).toBe(151);
    expect(compiled).toEqual(reviewedGolden.cards);
    expect(
      generatedArtifact.cards
        .filter((record) => reviewedIds.has(record.cardId))
        .map(({ cardId, hint }) => ({ cardId, hint })),
    ).toEqual(reviewedGolden.cards);
    for (const { hint } of reviewedGolden.cards) {
      expect(hint).not.toHaveProperty("manualNotes");
      expect(hint.aiSupportStatus).toBe("ai_supported");
      expect(hint.scenarioRefs).toEqual([
        "data/scenarios/card-support-ai-supported-current.json#active_card_support_ai_supported",
      ]);
    }
  });

  it("uses the same canonical planning identities and fingerprints as production", () => {
    const productionById = new Map(
      planningCards().map((entry) => [entry.cardDefinitionId, entry]),
    );
    const compatibility = cardSpecPlanningCards().filter((entry) =>
      reviewedIds.has(entry.definition.id),
    );

    expect(compatibility).toHaveLength(151);
    for (const entry of compatibility) {
      const production = productionById.get(entry.definition.id);
      expect(production, entry.definition.id).toBeDefined();
      expect(entry.planning.cardDefinitionId).toBe(entry.definition.id);
      expect(entry.planning.cardRulesFingerprint).toBe(
        production!.cardRulesFingerprint,
      );
      expect(entry.planning.planningAnnotationsFingerprint).toBe(
        production!.planningAnnotationsFingerprint,
      );
      expect(entry.planning.engine).toEqual(production!.engine);
      expect(entry.planning.planningAnnotations).toEqual(
        production!.planningAnnotations,
      );
    }
  });

  it("keeps all 100 pre-Proteus artifact records pinned full-record stable", () => {
    const entriesById = new Map(
      cardSpecPlanningCards().map((entry) => [entry.definition.id, entry]),
    );
    const originalsetIds = new Set(
      originalsetReviewedGolden.cards.map((record) => record.cardId),
    );
    const priorGeneratedCards = generatedArtifact.cards.filter(
      (record) =>
        !reviewedIds.has(record.cardId) && !originalsetIds.has(record.cardId),
    );
    const compiled = priorGeneratedCards.map((record) => {
      const entry = entriesById.get(record.cardId);
      expect(entry, record.cardId).toBeDefined();
      return {
        cardId: record.cardId,
        cardRulesFingerprint: entry!.planning.cardRulesFingerprint,
        planningAnnotationsFingerprint:
          entry!.planning.planningAnnotationsFingerprint,
        hint: deriveCardSpecAiHint(entry!),
      };
    });

    expect(priorGeneratedCards).toHaveLength(100);
    expect(compiled).toEqual(priorGeneratedCards);
    expect(
      `sha256:${createHash("sha256")
        .update(JSON.stringify(priorGeneratedCards))
        .digest("hex")}`,
    ).toBe(
      "sha256:6a2c1ee19a8100cba0f4f351c07d324b72d75de2db8052236ff86bdae1e603aa",
    );
  });

  it("pins the exact action-capacity and capability-bound strategy partitions", () => {
    const actionCapacity = reviewedGolden.cards.flatMap((record) =>
      (record.hint.actionCapacityProfiles ?? []).map((profile) => ({
        cardId: record.cardId,
        profile,
      })),
    );
    const actionPairs = reviewedGolden.cards.flatMap((record) =>
      (record.hint.actionStrategySupportPairs ?? []).map((pair) => ({
        cardId: record.cardId,
        pair,
      })),
    );

    expect(actionCapacity).toHaveLength(16);
    expect(new Set(actionCapacity.map(({ cardId }) => cardId)).size).toBe(15);
    expect(actionPairs).toHaveLength(22);
    expect(new Set(actionPairs.map(({ cardId }) => cardId)).size).toBe(12);
    for (const cardId of [
      "onr_proteus_105_demolition-run",
      "onr_proteus_107_drone-for-a-day",
      "onr_proteus_113_live-news-feed",
      "onr_proteus_121_remote-detonator",
      "onr_proteus_129_back-door-to-netwatch",
    ]) {
      expect(
        actionPairs.filter((entry) => entry.cardId === cardId),
        cardId,
      ).toEqual([]);
    }
    expect(
      actionPairs.every(
        ({ pair }) =>
          pair.roleDetail !== undefined &&
          pair.roleDetail !== pair.role &&
          pair.evidence.length === 1,
      ),
    ).toBe(true);
    expect(
      reviewedGolden.cards.find(
        ({ cardId }) => cardId === "onr_proteus_026_hunting-pack",
      )?.hint,
    ).not.toHaveProperty("actionStrategySupportPairs");
    const expendable = reviewedGolden.cards.find(
      ({ cardId }) => cardId === "onr_proteus_140_expendable-family-member",
    )?.hint;
    expect(expendable?.actionCapacityProfiles).toBeUndefined();
    expect(expendable?.effects).not.toContainEqual(
      expect.objectContaining({ kind: "action_penalty" }),
    );
    expect(expendable?.requiredMechanics).toContain("trash_source");
    expect(expendable?.requiredMechanics).not.toContain("future_action_debt");

    const guardTemps = reviewedGolden.cards.find(
      ({ cardId }) => cardId === "onr_proteus_046_corporate-guard-r-temps",
    )?.hint;
    expect(guardTemps?.planRoles).toContain("action_tempo");
    expect(guardTemps?.planRoles).not.toContain("recover_economy");

    const fakedHit = reviewedGolden.cards.find(
      ({ cardId }) => cardId === "onr_proteus_108_faked-hit",
    )?.hint;
    expect(fakedHit?.strategicExchangeKinds).toContain("self_damage");
    expect(fakedHit?.actionTacticSignals).not.toContain("damage.payoff.runner");
  });

  it("pins the reviewed target and value reconciliations", () => {
    const hints = new Map(
      reviewedGolden.cards.map((record) => [record.cardId, record.hint]),
    );
    expect(
      hints.get("onr_proteus_085_disintegrator")?.targetProfiles,
    ).toBeUndefined();
    expect(hints.get("onr_proteus_004_fetal-ai")?.valueHints).toEqual({
      damage: 2,
    });
    expect(hints.get("onr_proteus_054_bel-digmo-antibody")?.valueHints).toEqual(
      { damage: 1 },
    );
    expect(
      hints.get("onr_proteus_075_stereogram-antibody")?.valueHints,
    ).toEqual({ damage: 1 });
    expect(
      hints.get("onr_proteus_150_streetware-distributor")?.valueHints,
    ).toEqual({ economy: 3 });
    expect(
      hints.get("onr_proteus_017_credit-blocks")?.requiredMechanics,
    ).toContain("alternate_subtype_wall");
  });

  it("derives plan-owned access, rez, and post-pass semantics only from exact typed nodes", () => {
    const entries = new Map(
      cardSpecPlanningCards().map((entry) => [entry.definition.id, entry]),
    );
    const hint = (cardId: string) => deriveCardSpecAiHint(entries.get(cardId)!);

    expect(hint("onr_proteus_118_prearranged-drop")).toMatchObject({
      effects: expect.arrayContaining([
        expect.objectContaining({
          kind: "economy",
          timing: "on_access",
          target: "next_agenda_credit",
          amount: 6,
        }),
      ]),
      functionSignals: expect.arrayContaining(["access.next_agenda_credit"]),
    });
    expect(hint("onr_proteus_119_promises-promises")).toMatchObject({
      effects: expect.arrayContaining([
        expect.objectContaining({
          kind: "scored_agenda_action",
          timing: "on_access",
          target: "bonus_agenda_point",
          amount: 1,
        }),
      ]),
      functionSignals: expect.arrayContaining(["access.next_agenda_bonus"]),
    });
    expect(hint("onr_proteus_051_rent-to-own-contract")).toMatchObject({
      effects: expect.arrayContaining([
        expect.objectContaining({ kind: "rez", timing: "action" }),
        expect.objectContaining({ kind: "rez", timing: "corp_turn" }),
      ]),
      functionSignals: expect.arrayContaining([
        "ice.corp_installment_rez",
        "risk.term_counter_payment_liability",
      ]),
    });
    expect(hint("onr_proteus_049_emergency-rig")).toMatchObject({
      functionSignals: expect.arrayContaining([
        "ice.corp_temporary_rez",
        "risk.temporary_rez_liability",
      ]),
      tacticSignals: expect.arrayContaining([
        "ice.corp_temporary_rez",
        "risk.temporary_rez_liability",
      ]),
    });
    expect(hint("onr_proteus_106_disgruntled-ice-technician")).toMatchObject({
      effects: expect.arrayContaining([
        expect.objectContaining({ kind: "rez", target: "derez" }),
        expect.objectContaining({
          kind: "future_run_effect",
          target: "ends_run_after_effect",
        }),
      ]),
      functionSignals: expect.arrayContaining([
        "ice.derez",
        "run.ends_run_after_effect",
      ]),
    });
    expect(hint("onr_proteus_032_misleading-access-menus")).toMatchObject({
      effects: expect.arrayContaining([
        expect.objectContaining({
          kind: "etr",
          target: "corp_ice.end_run_unless_runner_pays",
        }),
        expect.objectContaining({
          kind: "economy",
          timing: "on_rez",
          amount: 3,
        }),
      ]),
      tacticSignals: expect.arrayContaining([
        "corp_ice.encounter_tax",
        "corp_ice.rez_economy",
        "corp_ice.runner_pay_or_end_run",
      ]),
    });

    const mutations: Array<[string, (entry: any) => void]> = [
      [
        "onr_proteus_118_prearranged-drop",
        (entry) => (entry.planning.engine.abilities[0].effects[0].amount = 0),
      ],
      [
        "onr_proteus_119_promises-promises",
        (entry) =>
          (entry.planning.engine.abilities[0].effects[0].visibility =
            "hidden_info_barrier"),
      ],
      [
        "onr_proteus_051_rent-to-own-contract",
        (entry) =>
          (entry.planning.engine.abilities[0].effects[0].lifecycle =
            "remove_one_counter_start_corp_turn_trash_on_last"),
      ],
      [
        "onr_proteus_106_disgruntled-ice-technician",
        (entry) =>
          (entry.planning.engine.runnerUtilityLongtail.target = "other_ice"),
      ],
      [
        "onr_proteus_032_misleading-access-menus",
        (entry) => (entry.planning.engine.printedSubroutines[0].amount = 0),
      ],
      [
        "onr_proteus_032_misleading-access-menus",
        (entry) =>
          (entry.planning.engine.lifecycle.on_rez[0].recipient = "runner"),
      ],
    ];
    for (const [cardId, mutate] of mutations) {
      const mutated = structuredClone(entries.get(cardId)!);
      mutate(mutated);
      expect(() => deriveCardSpecAiHint(mutated), cardId).toThrow(
        /card_spec_(unknown_|invalid_card_strategy_evidence_profile)/,
      );
    }
  });

  it("rejects unknown families and missing current scenario evidence", () => {
    const entry = cardSpecPlanningCards().find(
      (candidate) =>
        candidate.definition.id === "onr_proteus_001_ai-board-member",
    )!;
    expect(() =>
      deriveCardSpecAiHint({
        ...entry,
        planning: {
          ...entry.planning,
          engine: { ...entry.planning.engine, unknownProteusFamily: true },
        },
      } as never),
    ).toThrow("card_spec_hint_unsupported_family: unknownProteusFamily");

    expect(() =>
      deriveCardSpecAiHint({
        ...entry,
        definition: {
          ...entry.definition,
          id: "onr_proteus_missing_scenario_evidence",
        },
      } as never),
    ).toThrow("card_spec_ai_support_scenario_evidence_missing");
  });

  it("rejects invented strategy bindings and forged capability evidence", () => {
    const entry = cardSpecPlanningCards().find(
      (candidate) =>
        candidate.definition.id === "onr_proteus_003_corporate-headhunters",
    )!;

    for (const mutation of [
      { strategyKey: "invented.strategy" },
      { roleDetail: "payoff_anchor_forged_damage_anchor" },
      { evidenceAnchor: "trace.source" },
    ]) {
      const mutated = structuredClone(entry);
      const pair =
        mutated.planning.planningAnnotations?.capabilities?.[0]?.annotations.find(
          (annotation) => annotation.kind === "strategy_support",
        );
      expect(pair?.kind).toBe("strategy_support");
      Object.assign(pair!, mutation);
      expect(() => deriveCardSpecAiHint(mutated)).toThrow(
        "card_spec_action_strategy_binding_mismatch",
      );
    }
  });

  it("derives the eight closed longtail hint surfaces from their typed owners", () => {
    const hints = new Map(
      cardSpecPlanningCards()
        .filter((entry) => reviewedIds.has(entry.definition.id))
        .map((entry) => [entry.definition.id, deriveCardSpecAiHint(entry)]),
    );
    expect(hints.get("onr_proteus_055_cybertech-think-tank")).toMatchObject({
      conditions: [{ kind: "requires_advancement_counter" }],
      effects: [{ kind: "global_modifier", scope: "damage", timing: "action" }],
      functionSignals: ["advance.corp_counter_bank"],
    });
    expect(
      hints.get("onr_proteus_056_department-of-misinformation"),
    ).toMatchObject({
      effects: [
        {
          kind: "prevention_replacement",
          scope: "installed_card",
          timing: "prevention_window",
        },
      ],
      functionSignals: ["expose.corp_prevention"],
    });
    expect(hints.get("onr_proteus_066_obfuscated-fortress")).toMatchObject({
      conditions: [{ kind: "requires_during_run" }],
      effects: [
        {
          kind: "run_tax",
          scope: "fort",
          target: "run.corp_spend_cap",
          timing: "during_run",
        },
      ],
      remoteRole: { kind: "run_tax", serverScope: "fort" },
    });
    expect(hints.get("onr_proteus_112_identity-donor")).toMatchObject({
      conditions: [
        { kind: "requires_meat_damage" },
        { kind: "requires_prevention_window" },
      ],
      functionSignals: [
        "corp.bad_publicity_pressure",
        "defense.damage_prevention",
        "defense.meat_damage_prevention",
      ],
    });
    expect(hints.get("onr_proteus_115_personal-touch-the")).toMatchObject({
      conditions: [{ kind: "requires_installed_program" }],
      effects: [
        {
          kind: "global_modifier",
          amount: 1,
          resource: "strength",
          target: "icebreaker",
        },
        { kind: "breaker", target: "strength_boost" },
      ],
    });
    expect(hints.get("onr_proteus_117_poisoned-water-supply")).toMatchObject({
      effects: [
        {
          kind: "run_tax",
          target: "bad_publicity_self_damage_cost",
        },
      ],
      functionSignals: ["corp.bad_publicity_self_damage_cost"],
    });
    expect(hints.get("onr_proteus_141_get-ready-to-rumble")).toMatchObject({
      effects: expect.arrayContaining([
        expect.objectContaining({
          kind: "persistent_counter_effect",
          amount: 2,
          target: "random_discard",
        }),
      ]),
      roles: expect.arrayContaining([
        "hidden_zone_tool",
        "random_discard_pressure",
      ]),
    });
    expect(hints.get("onr_proteus_153_time-to-collect")).toMatchObject({
      conditions: [{ kind: "requires_prevention_window" }],
      effects: expect.arrayContaining([
        expect.objectContaining({
          kind: "prevention_replacement",
          target: "defense.resource_trash_prevention",
        }),
      ]),
      roles: expect.arrayContaining(["trash_prevention"]),
    });
  });

  it("binds relative ICE and X-trace placeholder subroutines to their dynamic owners", () => {
    const hints = new Map(
      cardSpecPlanningCards()
        .filter((entry) => reviewedIds.has(entry.definition.id))
        .map((entry) => [entry.definition.id, deriveCardSpecAiHint(entry)]),
    );
    const expectedRelative = (
      damageResource: "net_damage" | "brain_damage",
      amount: number,
      strengthModifier: boolean,
    ) => [
      {
        kind: "damage",
        scope: "runner",
        timing: "encounter_resolution",
        resource: damageResource,
        target: "corp_ice.outer_ice_scaling",
        amount,
      },
      {
        kind: "etr",
        scope: "run_path",
        timing: "encounter_resolution",
        target: "corp_ice.end_run",
      },
      ...(strengthModifier
        ? [
            {
              kind: "global_modifier",
              scope: "ice",
              timing: "persistent",
              resource: "strength",
              target: "ice.strength_modifier",
            },
          ]
        : []),
    ];

    expect(hints.get("onr_proteus_012_bug-zapper")?.effects).toEqual(
      expectedRelative("net_damage", 2, false),
    );
    expect(hints.get("onr_proteus_021_dog-pile")?.effects).toEqual(
      expectedRelative("net_damage", 1, true),
    );
    expect(hints.get("onr_proteus_030_mastermind")?.effects).toEqual(
      expectedRelative("brain_damage", 1, true),
    );
    expect(hints.get("onr_proteus_025_homing-missile")?.effects).toEqual([
      {
        kind: "trace",
        scope: "trace",
        timing: "encounter_resolution",
        target: "corp_ice.trace_source",
      },
      {
        kind: "etr",
        scope: "run_path",
        timing: "trace_success",
        target: "corp_ice.conditional_end_run",
      },
      {
        kind: "run_lock",
        scope: "runner",
        timing: "trace_success",
        resource: "actions",
        target: "corp_ice.run_lock",
      },
      {
        kind: "global_modifier",
        scope: "ice",
        timing: "on_rez",
        resource: "strength",
        target: "corp_ice.rez_paid_scaling",
      },
      {
        kind: "trace",
        scope: "trace",
        timing: "encounter_resolution",
        target: "trace.source",
        finite: true,
      },
      {
        kind: "etr",
        scope: "run_path",
        timing: "trace_success",
        target: "corp_ice.conditional_end_run",
        finite: true,
      },
      {
        kind: "run_lock",
        scope: "runner",
        timing: "trace_success",
        resource: "actions",
        target: "corp_ice.run_lock",
        amount: 2,
        finite: true,
      },
    ]);
    for (const cardId of [
      "onr_proteus_012_bug-zapper",
      "onr_proteus_021_dog-pile",
      "onr_proteus_030_mastermind",
      "onr_proteus_025_homing-missile",
    ])
      expect(hints.get(cardId)?.effects).not.toContainEqual(
        expect.objectContaining({ amount: 0 }),
      );
  });

  it("rejects malformed dynamic subroutine bindings instead of compiling placeholders", () => {
    const mutations: Array<[string, (entry: any) => void]> = [
      [
        "onr_proteus_012_bug-zapper",
        (entry) =>
          (entry.planning.engine.relativeIce.dynamicDamageSubroutine.amountPerCount = 0),
      ],
      [
        "onr_proteus_021_dog-pile",
        (entry) =>
          (entry.planning.engine.relativeIce.strengthBonusPerCount = 0),
      ],
      [
        "onr_proteus_030_mastermind",
        (entry) =>
          (entry.planning.engine.relativeIce.dynamicDamageSubroutine.subroutineCapabilityKey =
            "unbound_dynamic_damage"),
      ],
      [
        "onr_proteus_025_homing-missile",
        (entry) => (entry.planning.engine.printedSubroutines[0].onSuccess = []),
      ],
    ];
    for (const [cardId, mutate] of mutations) {
      const entry = structuredClone(
        cardSpecPlanningCards().find(
          (candidate) => candidate.definition.id === cardId,
        )!,
      );
      mutate(entry);
      expect(() => deriveCardSpecAiHint(entry), cardId).toThrow(
        /card_spec_(unknown_relative_ice|invalid_card_strategy_evidence_profile|unknown_trace_run_lock_shape)/,
      );
    }
  });

  it("derives current-run additional access only from the exact typed access-start ability", () => {
    const expected = [
      [
        "onr_proteus_142_hq-mole",
        "hq",
        "access.hq_hidden_multiaccess",
        "access.hq_multiaccess",
        "multiaccess",
      ],
      [
        "onr_proteus_147_r-and-d-mole",
        "rnd",
        "access.rnd_hidden_multiaccess",
        "access.rnd_multiaccess",
        "rd_multiaccess",
      ],
    ] as const;
    for (const [cardId, scope, target, functionSignal, role] of expected) {
      const entry = cardSpecPlanningCards().find(
        (candidate) => candidate.definition.id === cardId,
      )!;
      const hint = deriveCardSpecAiHint(entry);
      expect(hint.effects).toContainEqual({
        kind: "multiaccess",
        scope,
        timing: "persistent",
        resource: "cards",
        target,
        amount: 2,
        finite: true,
      });
      expect(hint.functionSignals).toContain(functionSignal);
      expect(hint.roles).toContain(role);
    }

    const malformed = structuredClone(
      cardSpecPlanningCards().find(
        (candidate) =>
          candidate.definition.id === "onr_proteus_147_r-and-d-mole",
      )!,
    );
    Object.assign(malformed.planning.engine.abilities![0]!, {
      costs: [{ kind: "credit", amount: 4 }],
    });
    expect(() => deriveCardSpecAiHint(malformed)).toThrow(
      "card_spec_unknown_current_run_additional_access_shape",
    );
  });

  it("fails closed when a longtail mechanical witness is mutated", () => {
    const mutations: Array<[string, (entry: any) => void]> = [
      [
        "onr_proteus_055_cybertech-think-tank",
        (entry) => (entry.planning.engine.corpUtility.amount = 2),
      ],
      [
        "onr_proteus_056_department-of-misinformation",
        (entry) => (entry.planning.engine.corpUtility.timing = "start_of_run"),
      ],
      [
        "onr_proteus_066_obfuscated-fortress",
        (entry) => (entry.planning.engine.corpUtility.target = "hq"),
      ],
      [
        "onr_proteus_112_identity-donor",
        (entry) =>
          (entry.planning.engine.flatlineReplacementSources[0].badPublicity = 1),
      ],
      [
        "onr_proteus_115_personal-touch-the",
        (entry) => (entry.planning.engine.runnerEventTargetedEffect.amount = 2),
      ],
      [
        "onr_proteus_117_poisoned-water-supply",
        (entry) => (entry.planning.engine.runnerEventLongtail.count = 1),
      ],
      [
        "onr_proteus_141_get-ready-to-rumble",
        (entry) => (entry.planning.engine.runnerUtilityLongtail.amount = 1),
      ],
      [
        "onr_proteus_153_time-to-collect",
        (entry) =>
          (entry.planning.engine.trashPreventionSources[0].priority = 29),
      ],
    ];
    for (const [cardId, mutate] of mutations) {
      const entry = structuredClone(
        cardSpecPlanningCards().find(
          (candidate) => candidate.definition.id === cardId,
        )!,
      );
      mutate(entry);
      if (cardId === "onr_proteus_153_time-to-collect") {
        const canonical = reviewedGolden.cards.find(
          (record) => record.cardId === cardId,
        )!.hint;
        expect(deriveCardSpecAiHint(entry), cardId).not.toEqual(canonical);
        continue;
      }
      expect(() => deriveCardSpecAiHint(entry), cardId).toThrow(
        /card_spec_unknown_/,
      );
    }
  });

  it("binds card evidence profiles and trace-tag anchors to exact typed witnesses", () => {
    const profileMutations: Array<[string, (entry: any) => void]> = [
      [
        "onr_proteus_030_mastermind",
        (entry) =>
          (entry.planning.engine.printedSubroutines[0].damageType = "net"),
      ],
      [
        "onr_proteus_012_bug-zapper",
        (entry) =>
          (entry.planning.engine.printedSubroutines[0].damageType = "brain"),
      ],
      [
        "onr_proteus_025_homing-missile",
        (entry) => (entry.planning.engine.printedSubroutines = []),
      ],
      [
        "onr_proteus_053_underworld-mole",
        (entry) => delete entry.planning.engine.abilities[0].condition,
      ],
      [
        "onr_proteus_052_schlaghund-pointers",
        (entry) =>
          (entry.planning.engine.abilities[0].effects[0].additionalPlayCostPerTraceLimitPointAboveZero = 2),
      ],
      [
        "onr_proteus_027_iceberg",
        (entry) => (entry.planning.engine.abilities[0].costs[0].amount = 1),
      ],
    ];
    for (const [cardId, mutate] of profileMutations) {
      const entry = structuredClone(
        cardSpecPlanningCards().find(
          (candidate) => candidate.definition.id === cardId,
        )!,
      );
      mutate(entry);
      expect(() => deriveCardSpecAiHint(entry), cardId).toThrow(
        /card_spec_(invalid_card_strategy_evidence_profile|unknown_trace_run_lock_shape)/,
      );
    }

    const forgedProfile = structuredClone(
      cardSpecPlanningCards().find(
        (candidate) =>
          candidate.definition.id === "onr_proteus_066_obfuscated-fortress",
      )!,
    );
    const cardPair = forgedProfile.planning.planningAnnotations?.card?.find(
      (annotation) => annotation.kind === "strategy_support",
    );
    expect(cardPair?.kind).toBe("strategy_support");
    Object.assign(cardPair!, { evidenceProfile: "damage_amplifier" });
    expect(() => deriveCardSpecAiHint(forgedProfile)).toThrow(
      "card_spec_invalid_card_strategy_evidence_profile",
    );

    const tagAnchor = structuredClone(
      cardSpecPlanningCards().find(
        (candidate) =>
          candidate.definition.id === "onr_proteus_052_schlaghund-pointers",
      )!,
    );
    Object.assign(tagAnchor.planning.planningAnnotations!, {
      card: tagAnchor.planning.planningAnnotations!.card?.filter(
        (annotation) => annotation.kind !== "strategy_support",
      ),
    });
    const traceEffect = tagAnchor.planning.engine.abilities![0]!.effects!.find(
      (effect) => effect.kind === "trace",
    );
    expect(traceEffect?.kind).toBe("trace");
    Object.assign(traceEffect!, { onSuccess: [] });
    expect(() => deriveCardSpecAiHint(tagAnchor)).toThrow(
      "card_spec_action_strategy_binding_mismatch",
    );
  });
});
