import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  candidateMatchesStep,
  planStepCandidatePriority,
} from "./tactical-plan-step-candidate-matching";
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

  it("does not satisfy clear_tags with generic card triggers", () => {
    const step = planStep("clear_tags", ["tag.remove"]);
    const plan = tacticalPlan(step, "runner");
    const input = runnerInput({ tags: 2 });
    const dependencies = testDependencies();
    const genericTrigger = legalAction(
      "generic-trigger",
      "trigger_ability",
      {},
      "runner",
    );
    const removeTag = legalAction("remove-tag", "remove_tag", {}, "runner");

    expect(
      candidateMatchesStep(
        plan,
        step,
        candidateFor(genericTrigger, {
          actorSide: "runner",
          semanticActionType: "card_ability.trigger",
          actionTacticSignals: ["card_ability.trigger"],
        }),
        genericTrigger,
        input,
        dependencies,
      ),
    ).toBe(false);
    expect(
      candidateMatchesStep(
        plan,
        step,
        candidateFor(removeTag, {
          actorSide: "runner",
          semanticActionType: "tag.remove",
          actionTacticSignals: ["tag.remove"],
        }),
        removeTag,
        input,
        dependencies,
      ),
    ).toBe(true);
  });

  it("does not satisfy convert_success_window with generic choices", () => {
    const step = planStep("convert_success_window", ["run.success_followup"]);
    const plan = tacticalPlan(step, "runner");
    const input = runnerInput();
    const dependencies = testDependencies();
    const genericChoice = legalAction(
      "generic-choice",
      "resolve_choice",
      {},
      "runner",
    );
    const successFollowup = legalAction(
      "success-followup",
      "trigger_ability",
      {},
      "runner",
    );

    expect(
      candidateMatchesStep(
        plan,
        step,
        candidateFor(genericChoice, {
          actorSide: "runner",
          semanticActionType: "card_ability.trigger",
          actionTacticSignals: ["card_ability.trigger"],
        }),
        genericChoice,
        input,
        dependencies,
      ),
    ).toBe(false);
    expect(
      candidateMatchesStep(
        plan,
        step,
        candidateFor(successFollowup, {
          actorSide: "runner",
          semanticActionType: "card_ability.trigger",
          actionTacticSignals: ["run.success_followup"],
        }),
        successFollowup,
        input,
        dependencies,
      ),
    ).toBe(true);
  });

  it("prioritizes stronger tag clearing within a tag survival step", () => {
    const step = planStep("clear_tags", ["tag.remove"]);
    const plan = tacticalPlan(step, "runner");
    const input = runnerInput({ tags: 3 });
    const dependencies = testDependencies();
    const basicRemove = legalAction("remove-tag", "remove_tag", {}, "runner");
    const clearAll = legalAction("clear-all-tags", "play_event", {}, "runner");

    const basicPriority = planStepCandidatePriority(
      plan,
      step,
      candidateFor(basicRemove, {
        actorSide: "runner",
        semanticActionType: "tag.remove",
        tagEffectProfile: {
          kind: "remove_tags",
          recipient: "runner",
          mode: "amount",
          amount: 1,
          currentTagReduction: 1,
          acuteTagRemoval: true,
          source: "legal_action_type",
          evidence: ["legal_action:remove_tag"],
        },
      }),
      basicRemove,
      input,
      dependencies,
    );
    const clearAllPriority = planStepCandidatePriority(
      plan,
      step,
      candidateFor(clearAll, {
        actorSide: "runner",
        semanticActionType: "tag.remove",
        actionTacticSignals: ["tag.remove"],
        tagEffectProfile: {
          kind: "remove_tags",
          recipient: "runner",
          mode: "all",
          amount: "all",
          currentTagReduction: "all",
          acuteTagRemoval: true,
          source: "card_implementation",
          evidence: ["card_semantics:clear_all_tags"],
        },
      }),
      clearAll,
      input,
      dependencies,
    );

    expect(clearAllPriority).toBeGreaterThan(basicPriority);
  });

  it("prioritizes concrete success-window payoffs over generic followups", () => {
    const step = planStep("convert_success_window", ["run.success_followup"]);
    const plan = tacticalPlan(step, "runner");
    const input = runnerInput();
    const dependencies = testDependencies();
    const genericFollowup = legalAction(
      "generic-followup",
      "trigger_ability",
      {},
      "runner",
    );
    const trashIce = legalAction(
      "trash-rezzed-ice",
      "trigger_ability",
      {},
      "runner",
    );

    const genericPriority = planStepCandidatePriority(
      plan,
      step,
      candidateFor(genericFollowup, {
        actorSide: "runner",
        semanticActionType: "card_ability.trigger",
        actionTacticSignals: ["run.success_followup"],
      }),
      genericFollowup,
      input,
      dependencies,
    );
    const trashPriority = planStepCandidatePriority(
      plan,
      step,
      candidateFor(trashIce, {
        actorSide: "runner",
        semanticActionType: "card_ability.trigger",
        actionTacticSignals: ["run.success_followup", "ice.trash_rezzed"],
      }),
      trashIce,
      input,
      dependencies,
    );

    expect(trashPriority).toBeGreaterThan(genericPriority);
  });
});

function rezReserveStep(): PlanStep {
  return planStep("build_rez_reserve", [
    "economy.gain_credit",
    "card_ability.trigger",
  ]);
}

function planStep(
  kind: PlanStep["kind"],
  desiredActionSemantics: string[],
): PlanStep {
  return {
    stepId: `${kind}:test`,
    kind,
    desiredActionSemantics,
    requiredCapabilities: [],
    actionCandidateIds: [],
    rationale: [],
  };
}

function tacticalPlan(
  step: PlanStep,
  side: TacticalPlan["side"] = "corp",
): TacticalPlan {
  return {
    schemaVersion: TACTICAL_PLAN_SCHEMA_VERSION,
    planId: `${side}.test-plan`,
    side,
    type:
      side === "runner"
        ? "runner.clear_tags_or_survive"
        : "corp.create_score_window",
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
  side: LegalAction["side"] = "corp",
): LegalAction {
  return {
    actionId,
    side,
    type,
    label: actionId,
    source: type === "gain_credit" ? "basic_action" : "test-card",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...(Object.keys(payload).length > 0 ? { payload } : {}),
  };
}

function testDependencies() {
  return {
    aiHintsByCard: new Map(),
    visibleCardForAction: () => undefined,
  };
}

function runnerInput({ tags = 0 }: { tags?: number } = {}): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      stateVersion: 1,
      side: "runner",
      activeSide: "runner",
      phase: "runner_action_phase",
      timingPoint: "runner_action.main",
      own: {
        identity: {
          instanceId: "runner",
          definitionId: "runner",
          title: "Runner",
          owner: "runner",
          controller: "runner",
          type: "identity",
          known: true,
        },
        credits: 3,
        clicks: 4,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags,
      },
      opponent: {
        identity: {
          instanceId: "corp",
          definitionId: "corp",
          title: "Corp",
          owner: "corp",
          controller: "corp",
          type: "identity",
          known: true,
        },
        credits: 4,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "tactical-plan-step-candidate-matching-test",
    decisionId: "tactical-plan-step-candidate-matching-test",
    actionNumber: 1,
    profileId: "tactical-plan-step-candidate-matching-test",
  };
}
