import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { candidateMatchesStep } from "./tactical-plan-step-candidate-matching";
import {
  TACTICAL_PLAN_SCHEMA_VERSION,
  type PlanStep,
  type TacticalPlan,
} from "./tactical-plan-types";

describe("candidateMatchesStep", () => {
  it("does not satisfy build_rez_reserve with non-credit gain wrappers", () => {
    const step = rezReserveStep();
    const plan = tacticalPlan(step);
    const input = { side: "corp", playerView: {} } as AiDecisionInput;
    const dependencies = {
      aiHintsByCard: new Map(),
      visibleCardForAction: () => undefined,
    };
    const hiddenReveal = legalAction("reveal-rd-top", "gain_credit", {
      abilityFamily: "hidden-zone",
      effectKind: "hidden_zone",
      agendaAbility: "v1919_scored_agenda_reveal_rd_top",
    });
    const basicCredit = legalAction("basic-credit", "gain_credit");
    const operationEconomy = legalAction("corp-economy-op", "play_operation");

    expect(
      candidateMatchesStep(
        plan,
        step,
        candidateFor(hiddenReveal, {
          semanticActionType: "card_ability.trigger",
          actionTacticSignals: ["card_ability.trigger", "zone.reveal"],
        }),
        hiddenReveal,
        input,
        dependencies,
      ),
    ).toBe(false);
    expect(
      candidateMatchesStep(
        plan,
        step,
        candidateFor(basicCredit, {
          semanticActionType: "economy.gain_credit",
          actionTacticSignals: ["economy.gain_credit"],
        }),
        basicCredit,
        input,
        dependencies,
      ),
    ).toBe(true);
    expect(
      candidateMatchesStep(
        plan,
        step,
        candidateFor(operationEconomy, {
          semanticActionType: "play.corp_operation",
          actionTacticSignals: ["operation_economy"],
        }),
        operationEconomy,
        input,
        dependencies,
      ),
    ).toBe(true);
  });
});

function rezReserveStep(): PlanStep {
  return {
    stepId: "build_rez_reserve:test",
    kind: "build_rez_reserve",
    desiredActionSemantics: ["economy.gain_credit", "card_ability.trigger"],
    requiredCapabilities: [],
    actionCandidateIds: [],
    rationale: [],
  };
}

function tacticalPlan(step: PlanStep): TacticalPlan {
  return {
    schemaVersion: TACTICAL_PLAN_SCHEMA_VERSION,
    planId: "corp.create_score_window:test",
    side: "corp",
    type: "corp.create_score_window",
    status: "blocked",
    priority: 900,
    horizonTurns: 1,
    currentStep: step,
    nextSteps: [],
    blockers: [],
    evidence: [],
    scoreBreakdown: [],
    requiredCapabilities: [],
    createdAtStateVersion: 1,
    updatedAtStateVersion: 1,
  };
}

function candidateFor(
  action: LegalAction,
  overrides: Partial<ActionSemanticCandidate>,
): ActionSemanticCandidate {
  return {
    actionId: action.actionId,
    actionType: action.type,
    actorSide: action.side,
    visibilityScope: "public",
    legalActionRef: {
      actionId: action.actionId,
      actionType: action.type,
      originalPayloadKeys: Object.keys(action.payload ?? {}),
    },
    sourceKind: "basic_action",
    abilityBindingMethod: "unresolved",
    semanticActionType: "card_ability.trigger",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: { costKnownStatus: "known", additionalCosts: [] },
    timingProfile: {},
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      notes: [],
    },
    confidence: "medium",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
    ...overrides,
  } as ActionSemanticCandidate;
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: actionId,
    source: type === "gain_credit" ? "basic_action" : "test-card",
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...(Object.keys(payload).length > 0 ? { payload } : {}),
  };
}
