import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, PlayerView } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";

import { createPlanStep, createTacticalPlan } from "./tactical-plan-builders";
import { coverageSearchActionFit } from "./tactical-plan-coverage-search-fit";

describe("coverageSearchActionFit", () => {
  it("uses structured recovery targets and ignores label-only recovery text", () => {
    const plan = createTacticalPlan({
      planId: "runner.obtain_breaker_coverage:remote_1",
      side: "runner",
      type: "runner.obtain_breaker_coverage",
      status: "active",
      priority: 900,
      horizonTurns: 1,
      currentStep: createPlanStep({
        stepId: "search_for_answer:remote_1",
        kind: "search_for_answer",
        desiredActionSemantics: ["search_for_answer"],
        requiredCapabilities: [
          {
            capabilityId: "coverage:breaker_wall",
            kind: "breaker_wall",
            side: "runner",
            evidence: ["test"],
          },
        ],
      }),
      stateVersion: 1,
    });
    const labelOnly = action({
      actionId: "label-only-recovery",
      label: "Junkyard BBS recovery from heap",
    });
    const structured = action({
      actionId: "structured-recovery",
      label: "Use ability",
      payload: { targetCardDefinitionId: "onr_v1_021_dwarf" },
    });

    expect(
      coverageSearchActionFit(
        plan,
        plan.currentStep,
        candidate(labelOnly),
        labelOnly,
        input([labelOnly]),
        false,
      ),
    ).toMatchObject({
      answerRole: "not_coverage_answer",
      supportsActiveCapabilityNeed: false,
      recoveredCardPlanFit: "none",
    });
    expect(
      coverageSearchActionFit(
        plan,
        plan.currentStep,
        candidate(structured),
        structured,
        input([structured]),
        false,
      ),
    ).toMatchObject({
      answerRole: "recovery_answer",
      recoveredCardId: "onr_v1_021_dwarf",
      recoveredCardPlanFit: "high",
    });
  });
});

function input(legalActions: LegalAction[]): AiDecisionInput {
  const playerView = {
    side: "runner",
    own: { rig: [], gripOrHq: [], heapOrArchives: [], scoreArea: [] },
    servers: [],
  } as unknown as PlayerView;
  return {
    side: "runner",
    legalActions,
    playerView,
  } as unknown as AiDecisionInput;
}

function action(overrides: Partial<LegalAction>): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type: "trigger_ability",
    label: "Use ability",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  };
}

function candidate(action: LegalAction): ActionSemanticCandidate {
  return {
    actionId: action.actionId,
    actionType: action.type,
    actorSide: "runner",
    visibilityScope: "public",
    legalActionRef: {
      actionId: action.actionId,
      actionType: action.type,
      originalPayloadKeys: Object.keys(action.payload ?? {}),
    },
    sourceKind: "card",
    abilityBindingMethod: "unbound",
    semanticActionType: "card_ability.unknown",
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
  } as unknown as ActionSemanticCandidate;
}
