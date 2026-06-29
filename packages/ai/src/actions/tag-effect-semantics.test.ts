import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";

import { applyTagEffectSemantics } from "./tag-effect-semantics";

describe("applyTagEffectSemantics", () => {
  it("applies descriptor tag effects only for exact action types", () => {
    const candidate = semanticCandidate(
      "onr_v1_102_open-ended-mileage-program",
    );

    expect(
      applyTagEffectSemantics(candidate, action("play_event")),
    ).toMatchObject({
      semanticActionType: "tag.remove",
      tagEffectProfile: {
        kind: "remove_tags",
        amount: 1,
        source: "card_implementation",
      },
    });
    expect(
      applyTagEffectSemantics(candidate, action("install_card")),
    ).not.toHaveProperty("tagEffectProfile");
  });
});

function semanticCandidate(
  sourceDefinitionId: string,
): ActionSemanticCandidate {
  return {
    sourceDefinitionId,
    semanticActionType: "unknown",
    confidence: "low",
    primaryProjectionStatus: "partial_projected",
    actionTacticSignals: [],
    strategySupport: [],
    projectionIssues: ["ability_unresolved"],
    evidence: [],
  } as unknown as ActionSemanticCandidate;
}

function action(type: LegalAction["type"]): LegalAction {
  return {
    actionId: `test.${type}`,
    side: "runner",
    type,
    label: type,
    source: "card",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}
