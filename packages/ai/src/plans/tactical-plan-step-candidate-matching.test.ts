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

  it("maps gain-credit steps from the common economy projection across action types", () => {
    const step = planStep("gain_credits", ["economy.gain_credit"]);
    const plan = tacticalPlan(step);
    const input = { side: "corp", playerView: {} } as AiDecisionInput;
    const dependencies = testDependencies();
    const basic = legalAction("basic-credit", "gain_credit");
    const coup = legalAction("corporate-coup", "activated_card_ability");
    const wrapper = legalAction("hidden-wrapper", "gain_credit");
    const basicCandidate = candidateFor(basic, {
      economyProjection: immediateEconomyProjection(1),
    });
    const coupCandidate = candidateFor(coup, {
      economyProjection: immediateEconomyProjection(3),
    });
    const wrapperCandidate = candidateFor(wrapper, {
      economyProjection: {
        ...immediateEconomyProjection(0),
        kind: "non_economy",
        timing: "unknown",
      },
    });

    expect(
      candidateMatchesStep(
        plan,
        step,
        basicCandidate,
        basic,
        input,
        dependencies,
      ),
    ).toBe(true);
    expect(
      candidateMatchesStep(
        plan,
        step,
        coupCandidate,
        coup,
        input,
        dependencies,
      ),
    ).toBe(true);
    expect(
      candidateMatchesStep(
        plan,
        step,
        wrapperCandidate,
        wrapper,
        input,
        dependencies,
      ),
    ).toBe(false);
    expect(
      planStepCandidatePriority(
        plan,
        step,
        coupCandidate,
        coup,
        input,
        dependencies,
      ),
    ).toBeGreaterThan(
      planStepCandidatePriority(
        plan,
        step,
        basicCandidate,
        basic,
        input,
        dependencies,
      ),
    );
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

  it("matches damage survival answers but not generic tag survival setup", () => {
    const step = planStep("find_survival_answer", [
      "draw.card",
      "survival.damage_prevention",
    ]);
    const plan = tacticalPlan(step, "runner");
    const input = runnerInput();
    const dependencies = testDependencies();
    const tagAvoid = legalAction(
      "install-tag-avoid",
      "install_card",
      {},
      "runner",
    );
    const damagePrevention = legalAction(
      "install-damage-prevention",
      "install_card",
      {},
      "runner",
    );

    expect(
      candidateMatchesStep(
        plan,
        step,
        candidateFor(tagAvoid, {
          actorSide: "runner",
          semanticActionType: "install.card",
          cardContextSignals: ["survival", "tag.avoid"],
        }),
        tagAvoid,
        input,
        dependencies,
      ),
    ).toBe(false);
    expect(
      candidateMatchesStep(
        plan,
        step,
        candidateFor(damagePrevention, {
          actorSide: "runner",
          semanticActionType: "install.card",
          cardContextSignals: ["survival.damage_prevention"],
        }),
        damagePrevention,
        input,
        dependencies,
      ),
    ).toBe(true);
  });

  it("maps basic credits only while a concrete survival reserve gap shrinks", () => {
    const step = planStep("find_survival_answer", ["draw.card"]);
    step.requiredCapabilities = [
      {
        capabilityId: "runner.survival_defense",
        kind: "survival",
        side: "runner",
        minimumCredits: 4,
        evidence: ["test_reaction_reserve"],
      },
    ];
    const plan = tacticalPlan(step, "runner");
    plan.type = "runner.survival_defense";
    plan.requiredCapabilities = [...step.requiredCapabilities];
    const basicCredit = legalAction(
      "basic-credit",
      "gain_credit",
      {},
      "runner",
    );
    const candidate = candidateFor(basicCredit, {
      actorSide: "runner",
      semanticActionType: "economy.gain_credit",
      actionTacticSignals: ["economy.gain_credit"],
    });
    const input = runnerInput();
    const dependencies = testDependencies();

    input.playerView.own.credits = 6;
    expect(
      candidateMatchesStep(
        plan,
        step,
        candidate,
        basicCredit,
        input,
        dependencies,
      ),
    ).toBe(false);
    expect(
      planStepCandidatePriority(
        plan,
        step,
        candidate,
        basicCredit,
        input,
        dependencies,
      ),
    ).toBe(0);

    input.playerView.own.credits = 3;
    expect(
      candidateMatchesStep(
        plan,
        step,
        candidate,
        basicCredit,
        input,
        dependencies,
      ),
    ).toBe(true);
    expect(
      planStepCandidatePriority(
        plan,
        step,
        candidate,
        basicCredit,
        input,
        dependencies,
      ),
    ).toBe(110);
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

  it("prefers a basic run over spending a run event on an open server", () => {
    const step = planStep("probe_central", ["run.start"]);
    const plan = tacticalPlan(step, "runner");
    const input = runnerInput();
    input.playerView.servers = [{ id: "rd", label: "R&D", ice: [], root: [] }];
    const dependencies = testDependencies();
    const basicRun = legalAction(
      "run-rd",
      "start_run",
      { serverId: "rd" },
      "runner",
    );
    const runEvent = legalAction(
      "event-run-rd",
      "play_event",
      { serverId: "rd", runnerEventRun: true },
      "runner",
    );

    const basicPriority = planStepCandidatePriority(
      plan,
      step,
      candidateFor(basicRun, { actorSide: "runner" }),
      basicRun,
      input,
      dependencies,
    );
    const eventPriority = planStepCandidatePriority(
      plan,
      step,
      candidateFor(runEvent, { actorSide: "runner" }),
      runEvent,
      input,
      dependencies,
    );

    expect(basicPriority).toBeGreaterThan(eventPriority);
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

function immediateEconomyProjection(amount: number) {
  return {
    schemaVersion: "action-economy-projection-v1" as const,
    kind: "immediate_liquid" as const,
    timing: "immediate" as const,
    creditRestriction: "general" as const,
    clickCost: 1,
    creditCost: 0,
    grossLiquidCreditGain: amount,
    netLiquidCreditGain: amount,
    cardsDrawn: 0,
    cardsConsumed: 0,
    netHandDelta: 0,
    repeatable: false as const,
    reliability: "guaranteed" as const,
    source: "legal_action_payload" as const,
    confidence: "high" as const,
    evidence: [],
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
