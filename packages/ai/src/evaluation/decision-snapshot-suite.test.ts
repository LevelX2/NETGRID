import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildSemanticDecisionFrame } from "../decision/semantic-decision-frame";
import { buildSemanticShadowDecision } from "../decision/semantic-shadow-decision";
import type { SemanticDecisionTrace } from "../decision/semantic-decision-trace";
import type { DecisionSnapshot } from "./decision-snapshot";
import {
  buildDecisionSnapshotFrame,
  classifyDecisionTraceMistakes,
  evaluateDecisionSnapshot,
  evaluateDecisionSnapshotFromBuilder,
} from "./decision-snapshot-suite";

describe("DecisionSnapshotSuite", () => {
  it("passes a low-credit runner snapshot when economy is top goal", () => {
    const input = inputFor("runner", [
      legalAction("gain-1", "gain_credit", "runner"),
      legalAction("run-1", "start_run", "runner"),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
      tacticalGoals: [
        {
          goalId: "runner.build_economy_base",
          family: "economy",
          priority: 940,
          urgency: "high",
          source: "economy_posture",
          evidence: ["funding_need:true"],
        },
      ],
    });
    const snapshot = snapshotFor("runner-low-credits", "runner", [
      "economy_starvation",
      "unsafe_run",
      "illegal_action",
      "hidden_info_dependency",
    ], ["economy"]);

    const evaluation = evaluateDecisionSnapshot({
      snapshot,
      frame,
      trace: buildSemanticShadowDecision(frame),
    });

    expect(evaluation.passed).toBe(true);
    expect(evaluation.preferredGoalFamilyMatched).toBe(true);
  });

  it("evaluates the play-strength snapshot corpus without forbidden mistakes", () => {
    const evaluations = playStrengthSnapshotCorpus().map((snapshot) =>
      evaluateDecisionSnapshotFromBuilder(snapshot),
    );

    expect(evaluations.map((evaluation) => evaluation.snapshotId)).toEqual([
      "runner_low_credits_no_run",
      "runner_safe_hq_access",
      "runner_remote_score_threat",
      "runner_damage_buffer_needed",
      "corp_score_window_available",
      "corp_low_rez_reserve",
    ]);
    expect(evaluations.filter((evaluation) => !evaluation.passed)).toEqual([]);
  });

  it("keeps target profile missing as a negative corpus guard", () => {
    const snapshot = targetProfileMissingSnapshot();
    const frame = buildDecisionSnapshotFrame(snapshot);
    const evaluation = evaluateDecisionSnapshot({
      snapshot,
      frame,
      trace: buildSemanticShadowDecision(frame),
    });

    expect(evaluation.passed).toBe(false);
    expect(evaluation.observedMistakes.map((mistake) => mistake.mistakeClass))
      .toContain("target_choice_unavailable");
  });

  it("detects illegal ranked actions", () => {
    const input = inputFor("runner", [legalAction("gain-1", "gain_credit", "runner")]);
    const frame = buildSemanticDecisionFrame({ input });
    const trace: SemanticDecisionTrace = {
      schemaVersion: "semantic-decision-trace-v1",
      frameSummary: {
        side: "runner",
        stateVersion: 1,
        legalActionCount: 1,
        actionCandidateCount: 0,
        tacticalGoalCount: 0,
        hiddenInfoPolicy: "player_view_only",
      },
      rankedActions: [
        {
          actionId: "not-legal",
          rank: 1,
          score: 100,
          components: [],
          blockers: [],
          explanation: "bad_fixture",
        },
      ],
      rejectedActions: [],
      noRuntimeEffect: true,
    };

    expect(
      classifyDecisionTraceMistakes(frame, trace).map(
        (mistake) => mistake.mistakeClass,
      ),
    ).toContain("illegal_action");
  });

  it("detects target choice unavailability from rejected actions", () => {
    const input = inputFor("runner", [
      legalAction("choice-1", "resolve_choice", "runner"),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
      tacticalGoals: [
        {
          goalId: "runner.resolve_target",
          family: "target_resolution",
          priority: 80,
          urgency: "high",
        },
      ],
    });

    const mistakes = classifyDecisionTraceMistakes(
      frame,
      buildSemanticShadowDecision(frame),
    );

    expect(mistakes.map((mistake) => mistake.mistakeClass)).toContain(
      "target_choice_unavailable",
    );
  });
});

function playStrengthSnapshotCorpus(): DecisionSnapshot[] {
  return [
    snapshotScenario(
      "runner_low_credits_no_run",
      "runner",
      [
        legalAction("gain-1", "gain_credit", "runner"),
        legalAction("run-hq", "start_run", "runner", {
          payload: { serverId: "hq" },
        }),
      ],
      {
        forbiddenMistakes: ["unsafe_run", "economy_starvation"],
        preferredGoalFamilies: ["economy"],
        ownCredits: 0,
        tacticalGoals: [
          goal("runner.build_economy_base", "economy", "economy_posture"),
        ],
        runner: {
          economyPosture: {
            fundingNeed: true,
            recommendation: "build_economy",
            minimumCreditFloor: 2,
            desiredCreditReserve: 5,
            evidence: ["snapshot:economy_need"],
          } as any,
        },
      },
    ),
    snapshotScenario(
      "runner_safe_hq_access",
      "runner",
      [
        legalAction("run-hq", "start_run", "runner", {
          payload: { serverId: "hq" },
        }),
        legalAction("gain-1", "gain_credit", "runner"),
      ],
      {
        forbiddenMistakes: ["missed_safe_access"],
        preferredGoalFamilies: ["run_access"],
        tacticalGoals: [
          goal(
            "runner.pressure_good_central_target",
            "pressure",
            "run_target_evaluation",
          ),
        ],
        runner: {
          runTargets: [
            runTarget({
              targetServerId: "hq",
              targetKind: "hq",
              accessPayoff: "trash_affordable",
              recommendation: "run_now",
              pathPassability: "reachable",
            }),
          ],
        },
      },
    ),
    snapshotScenario(
      "runner_remote_score_threat",
      "runner",
      [
        legalAction("run-remote", "start_run", "runner", {
          payload: { serverId: "remote_1" },
        }),
        legalAction("draw-1", "draw_card", "runner"),
      ],
      {
        forbiddenMistakes: ["ignored_remote_threat"],
        preferredGoalFamilies: ["remote_contest"],
        tacticalGoals: [
          goal(
            "runner.contest_remote_if_score_threat",
            "remote_contest",
            "run_target_evaluation",
          ),
        ],
        runner: {
          runTargets: [
            runTarget({
              targetServerId: "remote_1",
              targetKind: "remote",
              accessPayoff: "agenda",
              recommendation: "run_now",
              pathPassability: "reachable",
              scoreThreat: true,
            }),
          ],
        },
      },
    ),
    snapshotScenario(
      "runner_damage_buffer_needed",
      "runner",
      [
        legalAction("draw-1", "draw_card", "runner"),
        legalAction("run-hq", "start_run", "runner", {
          payload: { serverId: "hq" },
        }),
      ],
      {
        forbiddenMistakes: ["unsafe_run", "ignored_damage_risk"],
        tacticalGoals: [
          goal("runner.survive_damage", "risk_control", "boardstate"),
        ],
        runner: {
          runTargets: [
            runTarget({
              targetServerId: "hq",
              targetKind: "hq",
              accessPayoff: "unknown",
              recommendation: "draw_for_damage_buffer",
              pathPassability: "reachable",
              blinkRiskAssessment: { riskSeverity: "high" },
            }),
          ],
        },
      },
    ),
    snapshotScenario(
      "corp_score_window_available",
      "corp",
      [
        legalAction("score-agenda", "score_agenda", "corp"),
        legalAction("gain-1", "gain_credit", "corp"),
      ],
      {
        forbiddenMistakes: ["missed_score_window"],
        preferredGoalFamilies: ["corp_scoreline"],
        tacticalGoals: [
          goal("corp.score_agenda_window", "score", "boardstate"),
        ],
        evidence: ["score_window:true"],
      },
    ),
    snapshotScenario(
      "corp_low_rez_reserve",
      "corp",
      [
        legalAction("gain-1", "gain_credit", "corp"),
        legalAction("rez-ice", "rez_ice", "corp", {
          credits: 4,
          payload: { serverId: "remote_1" },
        }),
      ],
      {
        forbiddenMistakes: ["bad_rez_spend"],
        preferredGoalFamilies: ["economy"],
        ownCredits: 2,
        tacticalGoals: [
          goal("corp.build_economy_base", "economy", "boardstate"),
        ],
        evidence: ["low_rez_reserve:true"],
      },
    ),
  ];
}

function targetProfileMissingSnapshot(): DecisionSnapshot {
  return snapshotScenario(
    "target_profile_missing",
    "runner",
    [legalAction("choice-1", "resolve_choice", "runner")],
    {
      forbiddenMistakes: ["target_choice_unavailable"],
      tacticalGoals: [
        goal("runner.resolve_target", "target_resolution", "boardstate"),
      ],
    },
  );
}

function snapshotScenario(
  snapshotId: string,
  side: "runner" | "corp",
  legalActions: LegalAction[],
  options: {
    forbiddenMistakes: DecisionSnapshot["expectedProperties"]["forbiddenMistakes"];
    preferredGoalFamilies?: DecisionSnapshot["expectedProperties"]["preferredGoalFamilies"];
    tacticalGoals: Array<{
      goalId: string;
      family: string;
      priority: number;
      urgency: string;
      source: string;
      evidence: string[];
    }>;
    runner?: Parameters<typeof buildSemanticDecisionFrame>[0]["runner"];
    evidence?: string[];
    ownCredits?: number;
  },
): DecisionSnapshot {
  return {
    snapshotId,
    side,
    description: snapshotId,
    inputBuilder: () => {
      const input = inputFor(side, legalActions);
      if (options.ownCredits !== undefined) {
        input.playerView.own.credits = options.ownCredits;
      }
      return input;
    },
    frameBuilder: (input) =>
      buildSemanticDecisionFrame({
        input,
        actionCandidates: buildActionSemanticCandidates({
          legalActions: input.legalActions,
          observerSide: input.side,
          stateVersion: input.playerView.stateVersion,
        }),
        tacticalGoals: options.tacticalGoals,
        ...(options.runner ? { runner: options.runner } : {}),
        ...(options.evidence ? { evidence: options.evidence } : {}),
      }),
    expectedProperties: {
      mustChooseFromLegalActions: true,
      forbiddenMistakes: options.forbiddenMistakes,
      ...(options.preferredGoalFamilies
        ? { preferredGoalFamilies: options.preferredGoalFamilies }
        : {}),
    },
  };
}

function goal(goalId: string, family: string, source: string) {
  return {
    goalId,
    family,
    priority: 940,
    urgency: "high",
    source,
    evidence: [`snapshot_goal:${goalId}`],
  };
}

function runTarget(overrides: Record<string, unknown>) {
  return {
    targetServerId: "hq",
    targetKind: "hq",
    accessServerId: "hq",
    accessTargetKind: "hq",
    actionId: "run-hq",
    accessPayoff: "unknown",
    knownAccessState: "unknown",
    multiaccessAvailable: false,
    pathPassability: "reachable",
    installedRunPayoff: "none",
    runActionPayoff: "none",
    runActionProjection: {
      actionId: "run-hq",
      serverId: "hq",
      serverKind: "hq",
      projectionStatus: "projected",
      evidence: ["snapshot_run_action"],
    },
    riskyUniversalCoverage: false,
    scoreThreat: false,
    recommendation: "run_now",
    score: 100,
    evidence: ["snapshot_run_target"],
    ...overrides,
  } as any;
}

function snapshotFor(
  snapshotId: string,
  side: "runner" | "corp",
  forbiddenMistakes: DecisionSnapshot["expectedProperties"]["forbiddenMistakes"],
  preferredGoalFamilies?: DecisionSnapshot["expectedProperties"]["preferredGoalFamilies"],
): DecisionSnapshot {
  return {
    snapshotId,
    side,
    description: snapshotId,
    inputBuilder: () => inputFor(side, []),
    expectedProperties: {
      mustChooseFromLegalActions: true,
      forbiddenMistakes,
      ...(preferredGoalFamilies ? { preferredGoalFamilies } : {}),
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
      stateVersion: 1,
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
    },
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "seed",
    decisionId: `${side}:decision`,
    actionNumber: 1,
    profileId: `${side}:profile`,
  } as unknown as AiDecisionInput;
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  side: "runner" | "corp",
  options: {
    credits?: number;
    payload?: LegalAction["payload"];
  } = {},
): LegalAction {
  const action: LegalAction = {
    actionId,
    side,
    type,
    label: type,
    source: "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: options.credits ? [{ credits: options.credits }] : [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
  };
  if (options.payload) action.payload = options.payload;
  return action;
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
