import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, PlayerView, Side } from "@netgrid/shared";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { semanticRuntimeStrategicActionFitEvidence } from "./strategic-action-fit";
import { buildStrategicIntentState } from "../strategic-intent-state";
import type { AiDeckStrategyProfile, DeckStrategyScore } from "../deck-doctrine-strategy";

describe("semanticRuntimeStrategicActionFitEvidence", () => {
  it("requires exact central target fit when StrategicIntent names a server", () => {
    const rdRun = action("run-rd", "runner", "start_run", { serverId: "rd" });
    const hqRun = action("run-hq", "runner", "start_run", { serverId: "hq" });
    const input = aiInput("runner", [rdRun, hqRun], 6, {
      targetId: "rd",
      availableCredits: 6,
    });

    expect(
      semanticRuntimeStrategicActionFitEvidence(
        input,
        rdRun,
        "runner.semantic.simple_run_choice",
      ),
    ).toEqual(
      expect.arrayContaining([
        "semantic_strategic_action_fit:true",
        "strategic_action_fit_target_match:exact",
      ]),
    );
    expect(
      semanticRuntimeStrategicActionFitEvidence(
        input,
        hqRun,
        "runner.semantic.simple_run_choice",
      ),
    ).toEqual([]);
  });

  it("does not add pressure fit while the strategy is in fund phase", () => {
    const rdRun = action("run-rd", "runner", "start_run", { serverId: "rd" });
    const input = aiInput("runner", [rdRun], 1, {
      targetId: "rd",
      availableCredits: 1,
    });

    expect(input.ownStrategicIntentState?.phase).toBe("fund");
    expect(
      semanticRuntimeStrategicActionFitEvidence(
        input,
        rdRun,
        "runner.semantic.simple_run_choice",
      ),
    ).toEqual([]);
  });
});

function aiInput(
  side: Side,
  legalActions: LegalAction[],
  credits: number,
  params: {
    targetId: string;
    availableCredits: number;
  },
): AiDecisionInputWithDeckCapabilities {
  const input: AiDecisionInput = {
    side,
    playerView: playerView(side, credits),
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "strategic-action-fit-test",
    decisionId: "strategic-action-fit-test",
    actionNumber: 1,
    profileId: "strategic-action-fit-test",
  };
  return {
    ...input,
    ownStrategicIntentState: buildStrategicIntentState({
      side: "runner",
      stateVersion: input.playerView.stateVersion,
      strategyProfile: strategyProfile(),
      availableCredits: params.availableCredits,
      targetVector: {
        kind: "central",
        targetId: params.targetId,
        evidence: ["test:target"],
      },
    }),
  };
}

function strategyProfile(): AiDeckStrategyProfile {
  return {
    schemaVersion: "ai-deck-strategy-profile-v1",
    taskId: "AI006",
    deckId: "strategic-action-fit-test",
    side: "runner",
    cardCount: 6,
    strategyScores: {
      "runner.rnd_pressure": score("runner.rnd_pressure"),
    },
    primaryStrategies: ["runner.rnd_pressure"],
    secondaryStrategies: [],
    functionSignalCounts: {},
    legacySignalCounts: {},
    warnings: [],
    source: {
      mode: "ai_internal_strategy_profile",
      strategyGoals: "data/ai/strategy-goals-v1.json",
      compiledHints: "data/ai/ai-card-hints-compiled.json",
      inspectorIndex: "data/ai/ai-hint-inspector-index.json",
      plannerEffect: "strategic_intent_input",
    },
  };
}

function score(strategyId: string): DeckStrategyScore {
  return {
    anchorScore: 80,
    supportScore: 80,
    finalScore: 80,
    confidence: "high",
    runtimeStatus: "productive",
    runtimeBlockers: [],
    supportGaps: [],
    anchorEvidence: [
      {
        cardId: "fixture-anchor",
        quantity: 1,
        source: "derivedStrategyAnchor",
        strategyId,
        reason: "test",
      },
    ],
    supportEvidence: [],
  };
}

function action(
  actionId: string,
  side: Side,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
): LegalAction {
  return {
    actionId,
    side,
    type,
    label: actionId,
    source: "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload,
  };
}

function playerView(side: Side, credits: number): PlayerView {
  return {
    side,
    stateVersion: 1,
    activeSide: side,
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity(side),
      credits,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleIdentity("corp"),
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
  } as PlayerView;
}

function visibleIdentity(side: Side): PlayerView["own"]["identity"] {
  return {
    instanceId: `${side}-identity`,
    definitionId: `${side}-identity`,
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}
