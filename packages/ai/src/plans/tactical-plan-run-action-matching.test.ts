import { describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";

import { runPlanStepMatchesAction } from "./tactical-plan-run-action-matching";
import type { PlanStep } from "./tactical-plan-types";

describe("runPlanStepMatchesAction", () => {
  it("uses structured run payloads and ignores label-only run text", () => {
    const step = { kind: "run_target" } as PlanStep;
    const actionTypeMatchesStep = () => true;
    const labelOnly = legalAction({
      actionId: "label-only-run",
      label: "Make a run on HQ",
      payload: { serverId: "hq" },
    });
    const structured = legalAction({
      actionId: "structured-run",
      label: "Use ability",
      payload: { serverId: "hq", runActionSignals: "make_run" },
    });

    expect(
      runPlanStepMatchesAction(
        step,
        candidate({ actionId: labelOnly.actionId }),
        labelOnly,
        actionTypeMatchesStep,
      ),
    ).toBe(false);
    expect(
      runPlanStepMatchesAction(
        step,
        candidate({ actionId: structured.actionId }),
        structured,
        actionTypeMatchesStep,
      ),
    ).toBe(true);
  });
});

function legalAction(overrides: Partial<LegalAction>): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type: "play_event",
    label: "Use ability",
    source: "event-card",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  };
}

function candidate(
  overrides: Partial<ActionSemanticCandidate> = {},
): ActionSemanticCandidate {
  return {
    actionId: "candidate",
    actionType: "play_event",
    actorSide: "runner",
    visibilityScope: "public",
    legalActionRef: {
      actionId: "candidate",
      actionType: "play_event",
      originalPayloadKeys: [],
    },
    sourceKind: "event",
    abilityBindingMethod: "unbound",
    semanticActionType: "event.unknown",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: { clickCost: 1, creditCost: 0, additionalCosts: [] },
    timingProfile: { timingPoint: "runner_action.main", window: "main_action" },
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      notes: [],
    },
    confidence: "medium",
    primaryProjectionStatus: "partial",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
    ...overrides,
  } as ActionSemanticCandidate;
}
