import { describe, expect, it } from "vitest";

import {
  roundSemanticRuntimeScore,
  scrubEvidence,
  semanticRuntimeChoiceWithEvidence,
  semanticRuntimeConfidence,
  semanticRuntimeScoreFromComponents,
  semanticRuntimeTypeTieBreakerScore,
  semanticRuntimeTypePriority,
} from "./semantic-runtime-score-components";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";
import type { AiDecisionDebug, LegalAction } from "@netgrid/shared";

describe("semantic runtime score components", () => {
  it("rounds scores and derives confidence without selecting actions", () => {
    expect(roundSemanticRuntimeScore(12.345)).toBe(12.35);
    expect(semanticRuntimeConfidence("mandatory_draw", 10)).toBe(0.95);
    expect(semanticRuntimeConfidence("runner.semantic.basic_economy_draw", 9000))
      .toBe(0.86);
    expect(semanticRuntimeConfidence("runner.semantic.basic_economy_draw", 7000))
      .toBe(0.76);
    expect(semanticRuntimeConfidence("runner.semantic.basic_economy_draw", 5000))
      .toBe(0.66);
    expect(semanticRuntimeConfidence("runner.semantic.basic_economy_draw", 4999))
      .toBe(0.51);
  });

  it("adds side-safe evidence while preserving the LegalAction reference", () => {
    const action = legalAction("gain-credit", "gain_credit");
    const choice: SemanticRuntimeChoice = {
      action,
      scopeId: "runner.semantic.basic_economy_draw",
      score: 420.123,
      reasonCode: "runner.semantic.basic_economy_draw",
      explanation: "base",
      evidence: ["base_evidence"],
    };

    const adjusted = semanticRuntimeChoiceWithEvidence(choice, {
      minimumScore: 500.456,
      reasonCode: "runner.adjusted",
      explanation: "adjusted",
      evidence: ["privatePayload:redacted", "safe:evidence"],
    });

    expect(adjusted.action).toBe(action);
    expect(adjusted.score).toBe(500.46);
    expect(adjusted.reasonCode).toBe("runner.adjusted");
    expect(adjusted.explanation).toBe("adjusted");
    expect(adjusted.confidence).toBe(0.51);
    expect(adjusted.evidence).toEqual(["safe:evidence", "base_evidence"]);
  });

  it("scrubs forbidden evidence fields without dropping side-safe ids", () => {
    expect(
      scrubEvidence([
        "safe:entry",
        "remote_1:known_payoff",
        "server_1:central",
        "scenario_1:fixture",
        "cardInstances:hidden",
        "privatePayload:hidden",
        "deckOrder:hidden",
        "sessionToken:hidden",
      ]),
    ).toEqual([
      "safe:entry",
      "remote_1:known_payoff",
      "server_1:central",
      "scenario_1:fixture",
    ]);
  });

  it("uses central semantic redaction for runtime evidence", () => {
    expect(
      scrubEvidence([
        "privatePayload:hidden",
        "cardInstances:hidden",
        "deckOrder:hidden",
        "sessionToken:hidden",
      ]),
    ).toEqual([]);
  });

  it("sums semantic runtime score components without rounding", () => {
    const components: NonNullable<AiDecisionDebug["scoreBreakdown"]> = [
      { key: "base", label: "base", value: 100 },
      { key: "penalty", label: "penalty", value: -25.5 },
      { key: "bonus", label: "bonus", value: 0.25 },
    ];

    expect(semanticRuntimeScoreFromComponents(components)).toBe(74.75);
  });

  it("keeps semantic runtime action type priorities centralized", () => {
    expect(semanticRuntimeTypePriority("resolve_choice")).toBe(10000);
    expect(semanticRuntimeTypePriority("mandatory_draw")).toBe(9800);
    expect(semanticRuntimeTypePriority("steal_agenda")).toBe(9600);
    expect(semanticRuntimeTypePriority("score_agenda")).toBe(9400);
    expect(semanticRuntimeTypePriority("access_card")).toBe(9000);
    expect(semanticRuntimeTypePriority("play_event")).toBe(6200);
    expect(semanticRuntimeTypePriority("play_operation")).toBe(6200);
    expect(semanticRuntimeTypePriority("trigger_ability")).toBe(6200);
    expect(semanticRuntimeTypePriority("activated_card_ability")).toBe(6200);
    expect(semanticRuntimeTypePriority("purge_virus_counters")).toBe(5800);
    expect(semanticRuntimeTypePriority("purge_runner_virus_counters")).toBe(
      5800,
    );
    expect(semanticRuntimeTypePriority("decline_trash")).toBe(3000);
    expect(semanticRuntimeTypePriority("decline_rez")).toBe(3000);
    expect(semanticRuntimeTypePriority("end_turn")).toBe(1000);
    expect(
      semanticRuntimeTypePriority("unknown_action" as LegalAction["type"]),
    ).toBe(4000);
  });

  it("exposes action type priority only as a bounded score tie-breaker", () => {
    expect(semanticRuntimeTypeTieBreakerScore("resolve_choice")).toBe(100);
    expect(semanticRuntimeTypeTieBreakerScore("score_agenda")).toBe(94);
    expect(semanticRuntimeTypeTieBreakerScore("gain_credit")).toBe(54);
    expect(semanticRuntimeTypeTieBreakerScore("end_turn")).toBe(10);
    expect(
      semanticRuntimeTypeTieBreakerScore("unknown_action" as LegalAction["type"]),
    ).toBe(40);
  });
});

function legalAction(
  actionId: string,
  type: LegalAction["type"],
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
  };
}
