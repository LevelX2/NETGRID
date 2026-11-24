import { describe, expect, it } from "vitest";
import { buildAiDeckOntologySummary } from "./hint-ontology-doctrine";

describe("AI hint ontology doctrine diagnostics", () => {
  it("aggregates scored-agenda, tag/punish and line-support fields read-only", () => {
    const summary = buildAiDeckOntologySummary({
      deckSnapshotId: "ontology-corp-pilot",
      side: "corp",
      cards: [
        { cardId: 422, quantity: 2 },
        { cardId: 404, quantity: 1 },
        { cardId: 461, quantity: 2 },
        { cardId: 514, quantity: 2 },
        { cardId: 578, quantity: 1 },
      ],
    });

    expect(summary.schemaVersion).toBe("ai-deck-ontology-summary-v1");
    expect(summary.validation.errorCount).toBe(0);
    expect(summary.effectCounts.byKind.scored_agenda_action).toBe(4);
    expect(summary.effectCounts.byKind.action_economy).toBe(2);
    expect(summary.effectCounts.byKind.tag_source).toBe(2);
    expect(summary.effectCounts.byKind.tag_punish_payoff).toBe(2);
    expect(summary.scoredAgendaActions.cardIds).toEqual([
      404,
      422,
    ]);
    expect(summary.tagPunish.hasTagSourceAndPayoff).toBe(true);
    expect(summary.lineSupportCounts.byKind["corp.tag_trace_punish"]).toBe(2);
    expect(summary.remoteRoles.roleCounts.agenda_steal_tax).toBe(1);
  });

  it("counts repeated deck rows once and ignores entries with no copies", () => {
    const summary = buildAiDeckOntologySummary({
      deckSnapshotId: "split-deck",
      side: "corp",
      cards: [
        { cardId: 514, quantity: 1 },
        { cardId: 514, quantity: 2 },
        { cardId: 461, quantity: 0 },
      ],
    });
    expect(summary).toMatchObject({
      totalCardQuantity: 3,
      uniqueCardCount: 1,
      structuredCardCount: 1,
      tagPunish: { hasTagSourceAndPayoff: false, tagSourceCardIds: [] },
    });
    expect(summary.effectCounts.byKind.tag_punish_payoff).toBe(3);
  });

  it("aggregates runner breaker coverage and search ontology fields", () => {
    const summary = buildAiDeckOntologySummary({
      deckSnapshotId: "ontology-runner-pilot",
      side: "runner",
      cards: [
        { cardId: 249, quantity: 2 },
        { cardId: 271, quantity: 1 },
        { cardId: 255, quantity: 1 },
        { cardId: 269, quantity: 2 },
        { cardId: 262, quantity: 1 },
      ],
    });

    expect(summary.validation.errorCount).toBe(0);
    expect(summary.breakerCoverage.coverageCounts.wall).toBe(2);
    expect(summary.breakerCoverage.breakerCards).toContainEqual(
      expect.objectContaining({
        cardId: 249,
        coverage: ["wall"],
        breakCost: 0,
      }),
    );
    expect(summary.effectCounts.byKind.search).toBe(2);
    expect(summary.effectCounts.byKind.recurring_economy).toBe(2);
    expect(summary.effectCounts.byKind.topdeck_info).toBe(2);
    expect(summary.lineSupportCounts.byKind["runner.search.breaker"]).toBe(2);
    expect(summary.lineSupportCounts.byKind["runner.rnd_pressure"]).toBe(1);
    expect(
      summary.lineSupportCounts.byKind["runner.interface_closeout"] ?? 0,
    ).toBe(0);
    expect(summary.lineSupportCounts.byKind["runner.remote_trash"] ?? 0).toBe(
      0,
    );
  });

  it("keeps reviewed fixture hints out of quality gaps without changing plan weights", () => {
    const summary = buildAiDeckOntologySummary({
      deckSnapshotId: "ontology-quality-pilot",
      side: "runner",
      cards: [
        { cardId: 587, quantity: 1 },
        { cardId: 249, quantity: 1 },
      ],
    });

    expect(summary.quality.needsHumanReviewCardIds).not.toContain(
      587,
    );
    expect(summary.quality.lowConfidenceCardIds).not.toContain(
      587,
    );
    expect(summary.structuredCardCount).toBe(1);
    expect(JSON.stringify(summary)).not.toContain("planWeights");
    expect(JSON.stringify(summary)).not.toContain("mulliganWeights");
  });

  it("fails closed for an invalid deck quantity", () => {
    expect(() =>
      buildAiDeckOntologySummary({
        deckSnapshotId: "ontology-invalid-quantity",
        side: "runner",
        cards: [{ cardId: 587, quantity: Number.NaN }],
      }),
    ).toThrow(/deck ontology quantity must be a non-negative safe integer/);
  });
});
