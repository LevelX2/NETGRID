import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { RunnerEconomyPosture } from "../runner-run-target-evaluation";
import {
  createTacticalPlanMemorySnapshot,
  getTacticalPlanMemorySnapshot,
  rememberTacticalPlanRuntime,
  resetTacticalPlanMemory,
  restoreTacticalPlanMemorySnapshot,
} from "./plan-memory";
import { createPlanStep, createTacticalPlan } from "./tactical-plan-builders";
import type { TacticalPlanMemorySnapshot } from "./tactical-plan-types";

describe("tactical plan observable progress", () => {
  it("expires a repeated punish step when the visible result never improves", () => {
    const decisionInput = input(102);
    const step = createPlanStep({
      stepId: "punish",
      kind: "apply_punish_pressure",
      desiredActionSemantics: ["trace.source"],
      actionCandidateIds: ["corp.netwatch"],
      rationale: ["test"],
    });
    const plan = createTacticalPlan({
      planId: "corp.apply_punish_pressure:test",
      side: "corp",
      type: "corp.apply_punish_pressure",
      status: "active",
      priority: 800,
      horizonTurns: 1,
      currentStep: step,
      stateVersion: 102,
    });
    const firstFailure = createTacticalPlanMemorySnapshot({
      input: decisionInput,
      plan,
      step,
      selectedAction: netwatchAction(),
      previousPlan: previousMemory(2, 101),
      planProgressionReason: "no_observable_progress",
    });
    const secondFailure = createTacticalPlanMemorySnapshot({
      input: input(103),
      plan,
      step,
      selectedAction: netwatchAction(),
      previousPlan: firstFailure,
      planProgressionReason: "no_observable_progress",
    });

    expect(firstFailure).toMatchObject({
      status: "active",
      ttlDecisionsRemaining: 1,
      planProgressionReason: "no_observable_progress",
    });
    expect(secondFailure).toMatchObject({
      status: "abandoned",
      ttlDecisionsRemaining: 0,
      planProgressionReason: "no_observable_progress",
    });
  });

  it("forgets a credit-base plan after its visible reserve target is satisfied", () => {
    resetTacticalPlanMemory();
    const decisionInput = runnerInput(202, 18);
    const previousPlan: TacticalPlanMemorySnapshot = {
      schemaVersion: "tactical-plan-v1",
      memoryId: "plan-progress:runner:current_candidate",
      side: "runner",
      planId: "runner.build_credit_base",
      type: "runner.build_credit_base",
      status: "progressing",
      target: { kind: "capability", id: "runner_credit_base" },
      selectedStepKind: "gain_credits",
      selectedActionId: "runner.newsgroup",
      blockedBy: [],
      ttlDecisionsRemaining: 2,
      planProgressionReason: "continued_previous_plan",
      progressBaseline: {
        ownCredits: 5,
        opponentCredits: 6,
        ownAgendaPoints: 0,
        opponentAgendaPoints: 2,
        opponentTags: 0,
        opponentCoreDamage: 0,
      },
      updatedAtStateVersion: 201,
    };
    restoreTacticalPlanMemorySnapshot(decisionInput, previousPlan);

    rememberTacticalPlanRuntime(
      decisionInput,
      { planAlternatives: [], blockedPlans: [] },
      runnerCreditAction(),
      {
        runnerEconomyPosture: {
          fundingNeed: false,
          desiredCreditReserve: 6,
        } as RunnerEconomyPosture,
      },
    );

    expect(getTacticalPlanMemorySnapshot(decisionInput)).toBeUndefined();
  });
});

function previousMemory(
  ttlDecisionsRemaining: number,
  stateVersion: number,
): TacticalPlanMemorySnapshot {
  return {
    schemaVersion: "tactical-plan-v1",
    memoryId: "plan-progress:corp:current_candidate",
    side: "corp",
    planId: "corp.apply_punish_pressure:test",
    type: "corp.apply_punish_pressure",
    status: "progressing",
    selectedStepKind: "apply_punish_pressure",
    selectedActionId: "corp.netwatch",
    blockedBy: [],
    ttlDecisionsRemaining,
    planProgressionReason: "continued_previous_plan",
    updatedAtStateVersion: stateVersion,
  };
}

function netwatchAction(): LegalAction {
  return {
    actionId: "corp.netwatch",
    side: "corp",
    type: "activated_card_ability",
    label: "Trace",
    source: "netwatch",
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 200,
  };
}

function runnerCreditAction(): LegalAction {
  return {
    ...netwatchAction(),
    actionId: "runner.newsgroup",
    side: "runner",
    label: "2 Credits nehmen",
    source: "newsgroup",
    timingPoint: "runner_action.main",
  };
}

function runnerInput(stateVersion: number, credits: number): AiDecisionInput {
  const decisionInput = input(stateVersion);
  return {
    ...decisionInput,
    side: "runner",
    decisionId: `plan-progress:${stateVersion}:runner`,
    playerView: {
      ...decisionInput.playerView,
      side: "runner",
      activeSide: "runner",
      timingPoint: "runner_action.main",
      phase: "runner_action_phase",
      own: {
        ...decisionInput.playerView.opponent,
        identity: { instanceId: "runner-id", known: true },
        credits,
        clicks: 4,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        agendaPoints: 0,
        tags: 0,
      },
      opponent: {
        ...decisionInput.playerView.own,
        identity: { instanceId: "corp-id", known: true },
        handCount: 5,
        deckCount: 20,
        discardCount: 0,
        agendaPoints: 2,
        tags: 0,
      },
    },
  } as AiDecisionInput;
}

function input(stateVersion: number): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      side: "corp",
      stateVersion,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: { instanceId: "corp-id", known: true },
        credits: 6,
        clicks: 3,
        agendaPoints: 5,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: { instanceId: "runner-id", known: true },
        credits: 109,
        clicks: 4,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
        rig: [],
      },
      servers: [],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: [],
    difficulty: "hard",
    seed: "seed",
    decisionId: "plan-progress:102:corp",
    actionNumber: stateVersion,
    profileId: "current_candidate",
  };
}
