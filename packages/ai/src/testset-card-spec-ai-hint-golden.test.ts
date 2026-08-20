import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";

import generatedArtifact from "../../../data/ai/card-spec-ai-hints-generated.json";
import reviewedGolden from "./test-fixtures/testset-card-spec-ai-hints-reviewed-v1.json";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

const reviewedIds = new Set(
  reviewedGolden.cards.map((record) => record.cardId),
);

describe("Testset CardSpec AI hint reviewed semantic golden", () => {
  it("binds the reviewed dispositions to the exact migration report", () => {
    expect(reviewedGolden.schemaVersion).toBe(
      "testset-card-spec-ai-hint-reviewed-golden-v1",
    );
    expect(reviewedGolden.dispositions).toEqual({
      mechanicalFacts:
        "derived_only_from_typed_card_spec_engine_characteristics_and_capabilities",
      planningClassifications:
        "derived_only_from_typed_card_planning_annotations",
      scenarioAndQuality:
        "regenerated_from_current_ai_supported_scenario_evidence",
      legacyMechanicalHintConflicts:
        "discarded_in_favor_of_card_spec_including_seven_stale_breaker_base_strength_values",
      legacyEditorialNotes: "discarded_nonruntime_review_metadata",
      legacyEvaluativeRoles:
        "retained_only_when_rederived_from_typed_mechanics_or_planning_annotations",
    });
  });

  it("pins all 36 full hint objects and their explicit absences", () => {
    const compiled = cardSpecPlanningCards()
      .filter((entry) => reviewedIds.has(entry.definition.id))
      .map((entry) => ({
        cardId: entry.definition.id,
        hint: deriveCardSpecAiHint(entry),
      }))
      .sort((left, right) => left.cardId.localeCompare(right.cardId));

    expect(reviewedGolden.cards).toHaveLength(36);
    expect(compiled).toEqual(reviewedGolden.cards);
    expect(
      generatedArtifact.cards
        .filter((record) => reviewedIds.has(record.cardId))
        .map(({ cardId, hint }) => ({ cardId, hint })),
    ).toEqual(reviewedGolden.cards);
    expect(generatedArtifact.cardIds).not.toContain(
      "catalog_preview_operation_001",
    );
    expect(generatedArtifact.cardIds).not.toContain(
      "catalog_preview_resource_001",
    );
  });

  it("does not leak compatibility-container names as reviewed mechanics", () => {
    const forbidden = new Set([
      "abilities",
      "chosen_server",
      "corpRootRezCreditOutcome",
      "icebreakerAbilities",
      "on_play",
      "printedSubroutines",
    ]);
    for (const { cardId, hint } of reviewedGolden.cards)
      expect(
        (hint.requiredMechanics ?? []).filter((token) => forbidden.has(token)),
        cardId,
      ).toEqual([]);
  });

  it("does not infer breaker or remote roles from card type alone", () => {
    const entries = cardSpecPlanningCards();
    const hardware = entries.find(
      (entry) => entry.definition.id === "simple_setup_hardware",
    )!;
    const programWithoutBreaker = {
      ...hardware,
      definition: { ...hardware.definition, type: "program" as const },
    };
    expect(
      deriveCardSpecAiHint(programWithoutBreaker as never).riskTags ?? [],
    ).not.toContain("encounter");

    const upgrade = entries.find(
      (entry) => entry.definition.id === "simple_upgrade",
    )!;
    const upgradeWithoutRemoteValue = {
      ...upgrade,
      planning: {
        ...upgrade.planning,
        planningAnnotations: {
          schemaVersion: "card-planning-annotations-v1" as const,
          card: [],
        },
      },
    };
    const hint = deriveCardSpecAiHint(upgradeWithoutRemoteValue as never);
    expect(hint.roles).not.toContain("remote_support");
    expect(hint.riskTags ?? []).not.toContain("hidden_root");
  });
});
