import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";

import { applyCardActionSourceBinding } from "./action-source-binding";

describe("applyCardActionSourceBinding", () => {
  it("requires ability binding only for exact action types", () => {
    expect(
      applyCardActionSourceBinding(
        candidate(),
        action("break_subroutine"),
        [],
        undefined,
      ).projectionIssues,
    ).toContain("ability_unresolved");
    expect(
      applyCardActionSourceBinding(
        candidate(["ability_unresolved"]),
        action("break_subroutine_noise"),
        [],
        undefined,
      ).projectionIssues,
    ).not.toContain("ability_unresolved");
  });
});

function candidate(
  projectionIssues: ActionSemanticCandidate["projectionIssues"] = [],
): ActionSemanticCandidate {
  return {
    sourceKind: "basic_action",
    abilityBindingMethod: "unresolved",
    projectionIssues,
    hardGates: [],
    evidence: [],
  } as unknown as ActionSemanticCandidate;
}

function action(type: string): LegalAction {
  return {
    actionId: `test.${type}`,
    side: "runner",
    type: type as LegalAction["type"],
    label: type,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}
