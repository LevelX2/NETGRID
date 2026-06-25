import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, PlayerView } from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import type { CorpStrategicIntentProfile } from "../corp-strategic-intent";
import type { DeckDoctrineV2Diagnostic } from "../deck-doctrine-strategy";
import {
  buildStrategicIntentState,
  type StrategicIntentState,
} from "../strategic-intent-state";
import {
  buildSemanticDecisionFrame,
  type TacticalGoalLike,
} from "./semantic-decision-frame";
import { buildMergedTacticalGoals } from "./tactical-goal-merge";

describe("tactical goal merge", () => {
  it("keeps productive Runner tactical, StrategicIntent and Neutral goals together", () => {
    const input = inputFor("runner", [
      legalAction("gain-1", "gain_credit", "runner"),
      legalAction("draw-1", "draw_card", "runner"),
    ]);
    const strategicIntentState = strategicState("runner");
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: candidatesFor(input),
      tacticalGoals: [
        goal("runner.build_economy_base", "economy", 940, "economy_posture"),
        {
          ...goal("runner.doctrine.report_only", "pressure", 999, "deck"),
          evidence: ["doctrine_v2:runner.rnd_pressure"],
        },
      ],
      strategicIntentState,
      doctrineDiagnostic: reportOnlyDoctrineDiagnostic(),
    });

    const goals = buildMergedTacticalGoals({ frame });
    const goalIds = goals.map((candidate) => candidate.goalId);

    expect(goalIds).toEqual(
      expect.arrayContaining([
        "runner.build_economy_base",
        "runner.strategic.central_pressure",
        "runner.neutral.economy",
      ]),
    );
    expect(goalIds.some((goalId) => goalId.includes(".doctrine."))).toBe(false);
    expect(goals[0]).toMatchObject({
      goalId: "runner.build_economy_base",
      priority: 940,
    });
    expect(JSON.stringify(goals)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|fullGameState/i,
    );
  });

  it("adds Corp boardstate and Corp strategic intent goals", () => {
    const input = inputFor("corp", [
      legalAction("score-1", "score_agenda", "corp"),
      legalAction("gain-1", "gain_credit", "corp"),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: candidatesFor(input),
      strategicIntentState: strategicState("corp"),
      corpStrategicIntent: corpIntent(),
    });

    const goals = buildMergedTacticalGoals({ frame });

    expect(goals.map((goal) => goal.goalId)).toEqual(
      expect.arrayContaining([
        "corp.tactical.score_closeout",
        "corp.strategic.scoreline",
        "corp.intent.scoreline",
      ]),
    );
    expect(goals.find((goal) => goal.goalId === "corp.intent.scoreline"))
      .toMatchObject({
        family: "corp_scoreline",
        source: "strategic_intent",
      });
  });

  it("deduplicates goals by id and target while preserving source evidence", () => {
    const input = inputFor("runner", [
      legalAction("gain-1", "gain_credit", "runner"),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: candidatesFor(input),
      tacticalGoals: [
        goal("runner.neutral.economy", "economy", 500, "runner_tactical"),
      ],
    });

    const [merged] = buildMergedTacticalGoals({ frame }).filter(
      (candidate) => candidate.goalId === "runner.neutral.economy",
    );

    expect(merged).toMatchObject({
      goalId: "runner.neutral.economy",
      priority: 720,
      source: "merged",
    });
    expect(merged?.evidence).toEqual(
      expect.arrayContaining([
        "merge_source:runner_tactical_goal",
        "merge_source:neutral",
        "merged_duplicate_count:2",
      ]),
    );
  });
});

function strategicState(side: "runner" | "corp"): StrategicIntentState {
  return buildStrategicIntentState({
    side,
    stateVersion: 7,
    availableCredits: 8,
    targetVector:
      side === "runner"
        ? {
            kind: "central",
            targetId: "rd",
            evidence: ["target:test"],
          }
        : {
            kind: "scoreline",
            evidence: ["target:test"],
          },
    strategyProfile: {
      schemaVersion: "ai-deck-strategy-profile-v1",
      taskId: "AI006",
      deckId: `${side}-strategy`,
      side,
      cardCount: 8,
      primaryStrategies:
        side === "runner" ? ["runner.rnd_pressure"] : ["corp.remote_scoring"],
      secondaryStrategies: [],
      strategyScores: {
        [side === "runner" ? "runner.rnd_pressure" : "corp.remote_scoring"]: {
          anchorScore: 80,
          supportScore: 80,
          finalScore: 80,
          confidence: "high",
          supportGaps: [],
          runtimeStatus: "productive",
          runtimeBlockers: [],
          anchorEvidence: [
            {
              cardId: "fixture-anchor",
              quantity: 1,
              source: "derivedStrategyAnchor",
              strategyId: "fixture.strategy",
              reason: "test",
            },
          ],
          supportEvidence: [],
        },
      },
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
    },
  });
}

function corpIntent(): CorpStrategicIntentProfile {
  return {
    schemaVersion: "corp-strategic-intent-profile-v1",
    side: "corp",
    source: {
      deckStrategyProfile: "ai_internal_strategy_profile",
      deckCapabilities: "ai_internal",
      strategicIntentState: "strategic_intent_state_v1",
      plannerEffect: "runtime_projection",
    },
    primaryWinIntent: "corp.score_agendas",
    scorePlan: ["corp.remote_scoreline"],
    defensePlan: ["corp.remote_protect"],
    economyPlan: [],
    punishPlan: [],
    riskProfile: [],
    rejectedIntents: [],
    confidence: "high",
    evidence: ["test"],
  };
}

function reportOnlyDoctrineDiagnostic(): DeckDoctrineV2Diagnostic {
  return {
    schemaVersion: "deck-doctrine-v2-diagnostic-v1",
    scope: "diagnostic_only",
    productiveUseAllowed: false,
    deckSnapshotId: "runner-rnd-test",
    side: "runner",
    status: "complete",
    neutralDoctrine: false,
    strategyDiagnostics: [
      {
        strategyId: "runner.rnd_pressure",
        status: "complete",
        anchorScore: 80,
        supportScore: 80,
        finalScore: 80,
        confidence: "high",
        anchorEvidenceCount: 1,
        supportEvidenceCount: 1,
        supportGaps: [],
      },
    ],
    rolesStatus: {
      status: "complete",
      cardCount: 1,
      cardRows: 1,
      completeCards: 1,
      partialCards: 0,
      anchorlessCards: 0,
      cardsWithoutRoles: [],
      roleSignalCount: 1,
      functionSignalCount: 1,
      strategyAnchorCount: 1,
    },
    cardRoles: [],
    warnings: [],
    source: {
      strategyProfile: "buildDeckStrategyProfile",
      mode: "report_only",
      plannerEffect: "none",
    },
    noEffectFlags: {
      actionSelection: false,
      plannerWeights: false,
      scoring: false,
      legalActionGeneration: false,
      engineMutation: false,
      hiddenInfoProjection: false,
    },
  };
}

function goal(
  goalId: string,
  family: string,
  priority: number,
  source: string,
): TacticalGoalLike {
  return {
    goalId,
    family,
    priority,
    urgency: priority >= 800 ? "high" : "medium",
    source,
    evidence: [`test_goal:${goalId}`],
  };
}

function candidatesFor(input: AiDecisionInput) {
  return buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
  });
}

function inputFor(
  side: "runner" | "corp",
  legalActions: LegalAction[],
): AiDecisionInput {
  return {
    side,
    playerView: playerViewFor(side, legalActions),
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "seed",
    decisionId: `${side}:decision`,
    actionNumber: 7,
    profileId: `${side}:profile`,
  };
}

function playerViewFor(
  side: "runner" | "corp",
  legalActions: LegalAction[],
): PlayerView {
  return {
    side,
    stateVersion: 7,
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    activeSide: side,
    phase: side === "runner" ? "runner_action_phase" : "corp_action_phase",
    own: {
      identity: visibleCard(`${side}-identity`),
      credits: 5,
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
      identity: visibleCard(`${side}-opponent-identity`),
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
    legalActions,
    winner: null,
    agendaPointsToWin: 7,
  } as unknown as PlayerView;
}

function visibleCard(cardId: string) {
  return {
    instanceId: `${cardId}-instance`,
    definitionId: cardId,
    title: cardId,
    side: "runner",
    type: "identity",
    zone: "identity",
    visibility: "public",
    known: true,
  };
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  side: "runner" | "corp",
): LegalAction {
  return {
    actionId,
    side,
    type,
    label: type,
    source: "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 7,
  };
}
