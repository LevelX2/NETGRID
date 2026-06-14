import { describe, expect, it } from "vitest";

import {
  roundSemanticRuntimeScore,
  scrubEvidence,
  semanticRuntimeChoiceWithEvidence,
  semanticRuntimeConfidence,
} from "./semantic-runtime-score-components";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";
import type { LegalAction } from "@netgrid/shared";

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
