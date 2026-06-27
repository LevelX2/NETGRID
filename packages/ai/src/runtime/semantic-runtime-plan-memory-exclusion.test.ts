import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { semanticRuntimePlanMemoryActionExclusion } from "./semantic-runtime-plan-memory-exclusion";

describe("semanticRuntimePlanMemoryActionExclusion", () => {
  it("uses generic bank cashout classification after a bank-build plan", () => {
    const action = runnerAction("trigger_ability", "collect stored credits");

    expect(
      semanticRuntimePlanMemoryActionExclusion(runnerInput(), action, {
        previousPlan: () => ({ type: "runner.build_credit_bank" }),
        isRunnerBankCashOutAction: (_input, candidate) =>
          candidate.actionId === action.actionId,
        runnerBankCashOutIsUsefulNow: () => false,
        runnerBankInvestmentCommitmentEvidence: () => [],
      }),
    ).toMatchObject({
      key: "bank_cashout_deferred_after_build",
    });
  });
});

function runnerInput(): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      side: "runner",
      stateVersion: 1,
      timingPoint: "runner_action.main",
      activeSide: "runner",
      phase: "runner_action_phase",
      own: {
        identity: {
          instanceId: "runner-identity",
          definitionId: "runner-identity",
          title: "Runner",
          type: "identity",
          known: true,
          owner: "runner",
          controller: "runner",
        },
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: {
          instanceId: "corp-identity",
          definitionId: "corp-identity",
          title: "Corp",
          type: "identity",
          known: true,
          owner: "corp",
          controller: "corp",
        },
        credits: 5,
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
    seed: "semantic-runtime-plan-memory-exclusion-test",
    decisionId: "semantic-runtime-plan-memory-exclusion-test",
    actionNumber: 1,
    profileId: "semantic-runtime-plan-memory-exclusion-test",
  } as AiDecisionInput;
}

function runnerAction(type: string, label: string): LegalAction {
  return {
    actionId: `${type}-${label}`,
    side: "runner",
    type,
    label,
    payload: {},
  } as LegalAction;
}
