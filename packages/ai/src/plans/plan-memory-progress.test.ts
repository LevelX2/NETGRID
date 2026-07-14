import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { createTacticalPlanMemorySnapshot } from "./plan-memory";
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
