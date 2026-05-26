import { describe, expect, it } from "vitest";
import { buildAiDeckOntologySummary } from "./hint-ontology-doctrine";

describe("AI hint ontology doctrine diagnostics", () => {
  it("aggregates scored-agenda, tag/punish and line-support fields read-only", () => {
    const summary = buildAiDeckOntologySummary({
      deckSnapshotId: "ontology-corp-pilot",
      side: "corp",
      cards: [
        { cardId: "onr_v1_210_political-overthrow", quantity: 2 },
        { cardId: "onr_v1_192_corporate-boon", quantity: 1 },
        { cardId: "onr_v1_249_hunter", quantity: 2 },
        { cardId: "onr_v1_302_scorched-earth", quantity: 2 },
        { cardId: "onr_v1_366_red-herrings", quantity: 1 },
      ],
    });

    expect(summary.schemaVersion).toBe("ai-deck-ontology-summary-v1");
    expect(summary.validation.errorCount).toBe(0);
    expect(summary.effectCounts.byKind.scored_agenda_action).toBe(3);
    expect(summary.effectCounts.byKind.economy).toBe(2);
    expect(summary.effectCounts.byKind.tag_source).toBe(2);
    expect(summary.effectCounts.byKind.tag_punish_payoff).toBe(2);
    expect(summary.scoredAgendaActions.cardIds).toEqual([
      "onr_v1_192_corporate-boon",
      "onr_v1_210_political-overthrow",
    ]);
    expect(summary.tagPunish.hasTagSourceAndPayoff).toBe(true);
    expect(summary.lineSupportCounts.byKind.tag_trace_punish).toBe(4);
    expect(summary.remoteRoles.roleCounts.agenda_steal_tax).toBe(1);
  });

  it("aggregates runner breaker coverage and search ontology fields", () => {
    const summary = buildAiDeckOntologySummary({
      deckSnapshotId: "ontology-runner-pilot",
      side: "runner",
      cards: [
        { cardId: "onr_v1_037_japanese-water-torture", quantity: 2 },
        { cardId: "onr_v1_059_self-modifying-code", quantity: 1 },
        { cardId: "onr_v1_043_mystery-box", quantity: 1 },
        { cardId: "onr_v1_057_scatter-shot", quantity: 2 },
        { cardId: "onr_v1_050_r-and-d-protocol-files", quantity: 1 },
      ],
    });

    expect(summary.validation.errorCount).toBe(0);
    expect(summary.breakerCoverage.coverageCounts.wall).toBe(2);
    expect(summary.breakerCoverage.breakerCards).toContainEqual(
      expect.objectContaining({
        cardId: "onr_v1_037_japanese-water-torture",
        coverage: ["wall"],
        breakCost: 0,
      }),
    );
    expect(summary.effectCounts.byKind.search).toBe(2);
    expect(summary.effectCounts.byKind.trash_credit).toBe(2);
    expect(summary.effectCounts.byKind.topdeck_info).toBe(1);
    expect(summary.lineSupportCounts.byKind.breaker_search_first).toBe(2);
    expect(summary.lineSupportCounts.byKind.early_rnd_pressure).toBe(1);
  });

  it("reports quality review gaps without changing plan weights", () => {
    const summary = buildAiDeckOntologySummary({
      deckSnapshotId: "ontology-quality-pilot",
      side: "runner",
      cards: [
        { cardId: "runner_identity_001", quantity: 1 },
        { cardId: "onr_v1_037_japanese-water-torture", quantity: 1 },
      ],
    });

    expect(summary.quality.needsHumanReviewCardIds).toContain(
      "runner_identity_001",
    );
    expect(summary.quality.lowConfidenceCardIds).toContain(
      "runner_identity_001",
    );
    expect(summary.structuredCardCount).toBe(1);
    expect(JSON.stringify(summary)).not.toContain("planWeights");
    expect(JSON.stringify(summary)).not.toContain("mulliganWeights");
  });
});
