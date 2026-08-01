import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";

import { applyTagEffectSemantics } from "./tag-effect-semantics";

describe("applyTagEffectSemantics", () => {
  it("projects acute tag removal only from the current LegalAction payload", () => {
    const candidate = semanticCandidate("different-card-id");

    expect(
      applyTagEffectSemantics(
        candidate,
        action("play_event", {
          cardImplementationEffectKind: "remove_tags",
          cardImplementationTagMode: "all",
          cardImplementationTagAmount: "all",
        }),
      ),
    ).toMatchObject({
      semanticActionType: "tag.remove",
      tagEffectProfile: {
        kind: "remove_tags",
        mode: "all",
        amount: "all",
        source: "legal_action_payload",
      },
    });
    expect(
      applyTagEffectSemantics(candidate, action("play_event")),
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

function action(
  type: LegalAction["type"],
  payload?: NonNullable<LegalAction["payload"]>,
): LegalAction {
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
    ...(payload ? { payload } : {}),
  };
}
