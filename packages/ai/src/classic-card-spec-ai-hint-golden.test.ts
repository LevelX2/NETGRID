import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import generatedArtifact from "../../../data/ai/card-spec-ai-hints-generated.json";
import reviewedGolden from "./test-fixtures/classic-card-spec-ai-hints-reviewed-v1.json";
import proteusReviewedGolden from "./test-fixtures/proteus-card-spec-ai-hints-reviewed-v1.json";
import originalsetReviewedGolden from "./test-fixtures/originalset-v1-card-spec-ai-hints-reviewed-v1.json";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

const reviewedIds = new Set(
  reviewedGolden.cards.map((record) => record.cardId),
);

describe("Classic CardSpec AI hint reviewed semantic golden", () => {
  it("binds the reviewed dispositions to the exact pinned migration report", () => {
    expect(reviewedGolden.schemaVersion).toBe(
      "classic-card-spec-ai-hint-reviewed-golden-v1",
    );
    expect(reviewedGolden.dispositions).toEqual({
      mechanicalFacts:
        "derived_only_from_closed_typed_classic_card_spec_engine_nodes",
      planningClassifications:
        "derived_only_from_closed_typed_card_and_capability_annotations",
      scenarioAndQuality:
        "regenerated_from_current_ai_supported_scenario_evidence",
      legacyMechanicalHintConflicts:
        "discarded_stale_london_noisy_two_false_paid_tap_trapdoor_subsidiary_target_and_self_destruct_fixed_damage_claims",
      breakerStrength:
        "canonical_card_spec_strength_replaces_five_uniform_legacy_base_strength_assumptions",
      capabilityStrategyEvidence:
        "bound_to_exact_capability_key_with_non_tautological_role_detail_and_split_library_search_interfaces",
      fixedMechanicalTargets: "dumpster_archives_redirect_has_no_target_choice",
      legacyEditorialNotes: "discarded_nonruntime_manual_notes",
    });
  });

  it("pins all 54 complete compiler outputs including explicit absences", () => {
    const compiled = cardSpecPlanningCards()
      .filter((entry) => reviewedIds.has(entry.definition.id))
      .map((entry) => ({
        cardId: entry.definition.id,
        hint: deriveCardSpecAiHint(entry),
      }))
      .sort((left, right) => left.cardId.localeCompare(right.cardId));

    expect(reviewedGolden.cards).toHaveLength(54);
    expect(reviewedIds.size).toBe(54);
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

  it("keeps all 46 pre-Classic artifact records pinned byte-semantic stable", () => {
    const entriesById = new Map(
      cardSpecPlanningCards().map((entry) => [entry.definition.id, entry]),
    );
    const priorGeneratedCards = generatedArtifact.cards.filter(
      (record) =>
        !reviewedIds.has(record.cardId) &&
        !proteusReviewedGolden.cards.some(
          (proteusRecord) => proteusRecord.cardId === record.cardId,
        ) &&
        !originalsetReviewedGolden.cards.some(
          (originalsetRecord) => originalsetRecord.cardId === record.cardId,
        ),
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

    expect(priorGeneratedCards).toHaveLength(46);
    expect(compiled).toEqual(priorGeneratedCards);
    expect(
      `sha256:${createHash("sha256")
        .update(JSON.stringify(priorGeneratedCards))
        .digest("hex")}`,
    ).toBe(
      "sha256:211d2ab880a3d1fca477ea8e61e34c012fa438badb9ae9a81c87444cc61ddc02",
    );
  });

  it("pins the reviewed canonical breaker and action-capacity reconciliations", () => {
    const hints = new Map(
      reviewedGolden.cards.map((record) => [record.cardId, record.hint]),
    );
    expect(hints.get("onr_classic_029_ms-todon")?.breakerProfile).toMatchObject(
      {
        baseStrength: 2,
        restrictions: ["first_sentry_break_each_run_gives_runner_tag"],
        sideEffects: ["stealth_loss"],
      },
    );
    expect(
      hints.get("onr_classic_030_psychic-friend")?.breakerProfile,
    ).toMatchObject({
      baseStrength: 1,
      sideEffects: ["temporary_strength"],
    });
    expect(
      hints.get("onr_classic_051_vintage-camaro")?.actionCapacityProfiles,
    ).toEqual([
      {
        class: "action_debt",
        timing: "prevention_window",
        recipient: "runner",
        restriction: "unrestricted",
        reliability: "guaranteed",
        sourceResource: "replacement_effect",
        expiresAt: "debt_paid",
        amount: 1,
        amountKind: "fixed",
        bankable: false,
        repeatable: true,
      },
    ]);
  });

  it("binds all five action-pair cards to capabilities and keeps Library Search evidence split", () => {
    const actionPairs = reviewedGolden.cards.flatMap((record) =>
      (record.hint.actionStrategySupportPairs ?? []).map((pair) => ({
        cardId: record.cardId,
        pair,
      })),
    );
    expect(new Set(actionPairs.map(({ cardId }) => cardId)).size).toBe(5);
    expect(
      actionPairs.every(
        ({ pair }) =>
          pair.roleDetail !== undefined && pair.roleDetail !== pair.role,
      ),
    ).toBe(true);
    expect(
      actionPairs
        .filter(
          ({ cardId, pair }) =>
            cardId === "onr_classic_039_library-search" &&
            pair.strategyId === "runner.interface_closeout",
        )
        .map(({ pair }) => pair.evidence),
    ).toEqual([
      ["tactic_signal_anchor:access.hq_multiaccess"],
      ["tactic_signal_anchor:access.rnd_multiaccess"],
    ]);
  });

  it("rejects unknown families, unsupported target owners and malformed action debt", () => {
    const entries = cardSpecPlanningCards();
    const vintage = entries.find(
      (entry) => entry.definition.id === "onr_classic_051_vintage-camaro",
    )!;
    expect(() =>
      deriveCardSpecAiHint({
        ...vintage,
        planning: {
          ...vintage.planning,
          engine: { ...vintage.planning.engine, unknownClassicFamily: true },
        },
      } as never),
    ).toThrow("card_spec_hint_unsupported_family: unknownClassicFamily");

    expect(() =>
      deriveCardSpecAiHint({
        ...vintage,
        planning: {
          ...vintage.planning,
          engine: {
            ...vintage.planning.engine,
            tagPreventionSources:
              vintage.planning.engine.tagPreventionSources?.map((source) => ({
                ...source,
                amount: 2,
              })),
          },
        },
      } as never),
    ).toThrow("card_spec_unknown_action_debt_tag_prevention_shape");

    const targetOwner = entries.find(
      (entry) => entry.definition.id === "onr_classic_046_executive-file-clerk",
    )!;
    expect(() =>
      deriveCardSpecAiHint({
        ...targetOwner,
        planning: {
          ...targetOwner.planning,
          engine: {
            ...targetOwner.planning.engine,
            abilities: undefined,
            hardwareDeck: true,
          },
        },
      } as never),
    ).not.toThrow();
  });

  it("rejects invented strategy bindings and forged capability evidence", () => {
    const entries = cardSpecPlanningCards();
    const baskerville = structuredClone(
      entries.find(
        (entry) => entry.definition.id === "onr_classic_005_baskerville",
      )!,
    );
    const baskervillePair =
      baskerville.planning.planningAnnotations?.capabilities?.[0]?.annotations.find(
        (annotation) => annotation.kind === "strategy_support",
      );
    expect(baskervillePair?.kind).toBe("strategy_support");
    Object.assign(baskervillePair!, { strategyKey: "invented.strategy" });
    expect(() => deriveCardSpecAiHint(baskerville)).toThrow(
      "card_spec_action_strategy_binding_mismatch",
    );

    const library = structuredClone(
      entries.find(
        (entry) => entry.definition.id === "onr_classic_039_library-search",
      )!,
    );
    const libraryPair =
      library.planning.planningAnnotations?.capabilities?.[0]?.annotations.find(
        (annotation) =>
          annotation.kind === "strategy_support" &&
          annotation.strategyKey === "runner.interface_closeout" &&
          annotation.evidenceAnchor === "access.hq_multiaccess",
      );
    expect(libraryPair?.kind).toBe("strategy_support");
    Object.assign(libraryPair!, {
      roleDetail: "payoff_anchor_forged_access_hq_multiaccess",
    });
    expect(() => deriveCardSpecAiHint(library)).toThrow(
      "card_spec_action_strategy_binding_mismatch",
    );

    const forgedAnchor = structuredClone(
      entries.find(
        (entry) => entry.definition.id === "onr_classic_039_library-search",
      )!,
    );
    const forgedPair =
      forgedAnchor.planning.planningAnnotations?.capabilities?.[0]?.annotations.find(
        (annotation) =>
          annotation.kind === "strategy_support" &&
          annotation.strategyKey === "runner.interface_closeout" &&
          annotation.evidenceAnchor === "access.hq_multiaccess",
      );
    Object.assign(forgedPair!, { evidenceAnchor: "trace.source" });
    expect(() => deriveCardSpecAiHint(forgedAnchor)).toThrow(
      "card_spec_action_strategy_binding_mismatch",
    );
  });

  it("rejects missing scenario evidence and compatibility-container mechanics", () => {
    const entry = cardSpecPlanningCards().find(
      (candidate) => candidate.definition.id === "onr_classic_041_networking",
    )!;
    expect(() =>
      deriveCardSpecAiHint({
        ...entry,
        definition: {
          ...entry.definition,
          id: "onr_classic_missing_scenario_evidence",
        },
      } as never),
    ).toThrow("card_spec_ai_support_scenario_evidence_missing");

    const forbidden = new Set([
      "abilities",
      "corpUtility",
      "icebreakerAbilities",
      "on_play",
      "printedSubroutines",
      "runnerEventLongtail",
    ]);
    for (const { cardId, hint } of reviewedGolden.cards)
      expect(
        (hint.requiredMechanics ?? []).filter((token) => forbidden.has(token)),
        cardId,
      ).toEqual([]);
  });
});
