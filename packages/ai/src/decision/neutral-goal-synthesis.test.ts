import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { DeckDoctrineV2Diagnostic } from "../deck-doctrine-strategy";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildSemanticDecisionFrame } from "./semantic-decision-frame";
import { buildSemanticShadowDecision } from "./semantic-shadow-decision";
import { synthesizeNeutralTacticalGoals } from "./neutral-goal-synthesis";

describe("neutral goal synthesis", () => {
  it("synthesizes economy and setup goals for runner basic actions", () => {
    const frame = frameFor("runner", [
      legalAction("gain-1", "gain_credit", "runner"),
      legalAction("draw-1", "draw_card", "runner"),
    ]);

    const goals = synthesizeNeutralTacticalGoals(frame);

    expect(goals.map((goal) => goal.goalId)).toEqual(
      expect.arrayContaining(["runner.neutral.economy", "runner.neutral.setup"]),
    );
    expect(JSON.stringify(goals)).not.toContain("actionId:");
  });

  it("synthesizes corp scoreline when score_agenda is available", () => {
    const frame = frameFor("corp", [
      legalAction("score-1", "score_agenda", "corp"),
      legalAction("gain-1", "gain_credit", "corp"),
    ]);

    expect(synthesizeNeutralTacticalGoals(frame)[0]).toMatchObject({
      goalId: "corp.tactical.score_closeout",
      family: "corp_scoreline",
    });
  });

  it("synthesizes remote contest for runner remote score threat", () => {
    const frame = frameFor("runner", [
      legalAction("run-remote", "start_run", "runner"),
      legalAction("gain-1", "gain_credit", "runner"),
    ], {
      runner: {
        runTargets: [
          {
            targetServerId: "remote_1",
            targetKind: "remote",
            scoreThreat: true,
            recommendation: "run_now",
            pathPassability: "reachable",
            accessPayoff: "score_threat",
            evidence: ["fixture:remote_score_threat"],
          } as any,
        ],
      },
    });

    expect(synthesizeNeutralTacticalGoals(frame)[0]).toMatchObject({
      goalId: "runner.neutral.remote_contest_if_score_threat",
      family: "remote_contest",
    });
  });

  it("lets no-goal frames rank legal actions instead of rejecting all candidates", () => {
    const frame = frameFor("runner", [
      legalAction("gain-1", "gain_credit", "runner"),
      legalAction("draw-1", "draw_card", "runner"),
    ]);

    const trace = buildSemanticShadowDecision(frame);

    expect(trace.rankedActions.map((action) => action.actionId)).toEqual(
      expect.arrayContaining(["gain-1", "draw-1"]),
    );
    expect(trace.rejectedActions).toEqual([]);
    expect(trace.rankedActions.every((action) =>
      frame.legalActionIds.includes(action.actionId),
    )).toBe(true);
  });

  it("does not turn report-only DeckDoctrine diagnostics into neutral goals", () => {
    const frame = frameFor(
      "runner",
      [
        legalAction("gain-1", "gain_credit", "runner"),
        legalAction("draw-1", "draw_card", "runner"),
      ],
      { doctrineDiagnostic: runnerRndDoctrine() },
    );

    const goalIds = synthesizeNeutralTacticalGoals(frame).map(
      (goal) => goal.goalId,
    );

    expect(goalIds).toEqual(expect.arrayContaining(["runner.neutral.economy"]));
    expect(goalIds.some((goalId) => goalId.includes(".doctrine."))).toBe(false);
  });
});

function frameFor(
  side: "runner" | "corp",
  legalActions: LegalAction[],
  options: {
    runner?: Parameters<typeof buildSemanticDecisionFrame>[0]["runner"];
    doctrineDiagnostic?: DeckDoctrineV2Diagnostic;
  } = {},
) {
  const input = inputFor(side, legalActions);
  return buildSemanticDecisionFrame({
    input,
    actionCandidates: buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: side,
      stateVersion: input.playerView.stateVersion,
    }),
    ...(options.runner ? { runner: options.runner } : {}),
    ...(options.doctrineDiagnostic
      ? { doctrineDiagnostic: options.doctrineDiagnostic }
      : {}),
  });
}

function runnerRndDoctrine(): DeckDoctrineV2Diagnostic {
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

function inputFor(
  side: "runner" | "corp",
  legalActions: LegalAction[],
): AiDecisionInput {
  return {
    side,
    playerView: {
      side,
      stateVersion: 7,
      timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
      activeSide: side,
      phase: side === "runner" ? "runner_action_phase" : "corp_action_phase",
      own: {
        identity: visibleCard(`${side}-identity`),
        credits: 2,
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
    },
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "seed",
    decisionId: `${side}:decision`,
    actionNumber: 7,
    profileId: `${side}:profile`,
  } as unknown as AiDecisionInput;
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
