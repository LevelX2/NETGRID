import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import {
  aiInput,
  legalAction,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { createSemanticRuntimeDecisionContext } from "./semantic-runtime-decision-context";
import type { SemanticRuntimeDecisionContextDependencies } from "./semantic-runtime-decision-context";

describe("plan-first Runner composite economy-card ownership", () => {
  it("keeps a useful Stakeout-like action on its exact card-development route without a funding need", () => {
    resetResidentPlanPortfolioMemory();
    const stakeout = stakeoutLikeAction();
    const input = aiInput("runner", [stakeout]);
    input.playerView.own.credits = 20;
    input.playerView.own.clicks = 2;
    input.playerView.own.gripOrHq = [
      visibleCard("stakeout-card", "runner", "event", {
        definitionId: "test_stakeout",
        title: "Stakeout",
      }),
    ];

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        {
          schemaVersion: "runner-hand-development-evaluation-v3",
          cardInstanceId: "stakeout-card",
          definitionId: "test_stakeout",
          title: "Stakeout",
          cardType: "event",
          availability: "legal_now",
          developmentRole: "economy_engine",
          strategicFit: "strong",
          currentNeed: "useful_now",
          liquidityTiming: "immediate",
          priority: 960,
          activationPrerequisites: [],
          deferReason: "none",
          legalActionId: stakeout.actionId,
          evidence: ["test_stakeout_useful_now"],
        },
      ],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: stakeout.actionId,
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.develop_board_and_hand",
      },
    });
  });

  it("does not turn an unowned immediate-credit action into a generic productive route", () => {
    resetResidentPlanPortfolioMemory();
    const unownedCredit = stakeoutLikeAction();
    unownedCredit.costs = [{ credits: 0, clicks: 0 }];
    const endTurn = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
    );
    const input = aiInput("runner", [unownedCredit, endTurn]);
    input.playerView.own.credits = 20;
    input.playerView.own.clicks = 0;
    input.playerView.own.gripOrHq = [
      visibleCard("stakeout-card", "runner", "event", {
        definitionId: "test_stakeout",
        title: "Stakeout",
      }),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: endTurn.actionId,
      reasonCode: "plan_first.runner.secure_terminal_win",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.secure_terminal_win",
      },
    });
  });
});

function stakeoutLikeAction() {
  return legalAction(
    "runner.play_stakeout",
    "runner",
    "play_event",
    "Play Stakeout",
    { credits: 0, clicks: 1 },
    {
      source: "stakeout-card",
      payload: {
        cardId: "stakeout-card",
        sourceDefinitionId: "test_stakeout",
        gainCreditsAmount: 2,
        drawCardsAmount: 1,
      },
    },
  );
}

function liveContext(overrides: Record<string, unknown> = {}) {
  const dependencies = {
    buildActionSemanticCandidates,
    deckCapabilitiesForInput: () => ({}),
    runnerStrategicIntentForInput: () => ({
      primaryWinIntent: "runner.access_agendas",
    }),
    evaluateRunnerHandDevelopment: () => [],
    buildRunnerEconomyPosture: () => ({
      minimumCreditFloor: 3,
      desiredCreditReserve: 0,
      fundingNeed: false,
      evidence: ["test_no_bound_funding_need"],
    }),
    evaluateRunnerRunTargets: () => [],
    runnerEncounterActionExclusion: () => undefined,
    semanticRuntimeChoices: () => [],
    selectedChoicesForDecision: () => undefined,
    practicalMicroRuntimeCandidates: () => [],
    ...overrides,
  } as unknown as SemanticRuntimeDecisionContextDependencies;
  return createSemanticRuntimeDecisionContext(dependencies);
}
