import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import { runnerOpponentMatchpointContestSemanticChoice } from "./runner-opponent-matchpoint-contest-choice";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";

describe("runner opponent matchpoint contest choice", () => {
  it("contests an unknown reachable remote before ordinary setup", () => {
    const remoteRun = action("run-remote", "start_run", {
      serverId: "remote_1",
    });
    const draw = action("draw", "draw_card");
    const selected = runnerOpponentMatchpointContestSemanticChoice(
      input({ opponentAgendaPoints: 6, actions: [remoteRun, draw] }),
      [choice(draw, 1_500), choice(remoteRun, -400)],
      [runTarget(remoteRun.actionId)],
    );

    expect(selected?.action.actionId).toBe(remoteRun.actionId);
    expect(selected?.reasonCode).toBe(
      "runner.endgame.opponent_matchpoint_contest",
    );
    expect(selected?.score).toBeGreaterThanOrEqual(10_000);
    expect(selected?.evidence).toContain(
      "runner_opponent_matchpoint_contest:true",
    );
  });

  it("does not force the contest below opponent matchpoint", () => {
    const remoteRun = action("run-remote", "start_run", {
      serverId: "remote_1",
    });

    expect(
      runnerOpponentMatchpointContestSemanticChoice(
        input({ opponentAgendaPoints: 4, actions: [remoteRun] }),
        [choice(remoteRun, 200)],
        [runTarget(remoteRun.actionId)],
      ),
    ).toBeUndefined();
  });

  it("does not force an unpayable remote path", () => {
    const remoteRun = action("run-remote", "start_run", {
      serverId: "remote_1",
    });

    expect(
      runnerOpponentMatchpointContestSemanticChoice(
        input({ opponentAgendaPoints: 6, actions: [remoteRun] }),
        [choice(remoteRun, 200)],
        [
          runTarget(remoteRun.actionId, {
            pathPassability: "blocked_unpayable",
            creditsAfterRun: -1,
          }),
        ],
      ),
    ).toBeUndefined();
  });

  it("does not treat an empty remote as a matchpoint target", () => {
    const remoteRun = action("run-remote", "start_run", {
      serverId: "remote_1",
    });
    const view = input({ opponentAgendaPoints: 6, actions: [remoteRun] });
    view.playerView.servers[0]!.root = [];

    expect(
      runnerOpponentMatchpointContestSemanticChoice(
        view,
        [choice(remoteRun, 200)],
        [runTarget(remoteRun.actionId)],
      ),
    ).toBeUndefined();
  });

  it("contests the specifically advanced remote at a public two-point terminal window", () => {
    const remoteRun = action("run-remote", "start_run", {
      serverId: "remote_1",
    });
    const view = input({ opponentAgendaPoints: 5, actions: [remoteRun] });
    view.playerView.servers[0]!.root[0]!.advancementCounters = 2;

    const selected = runnerOpponentMatchpointContestSemanticChoice(
      view,
      [choice(remoteRun, 200)],
      [
        runTarget(remoteRun.actionId, {
          scoreThreat: true,
          recommendation: "run_now",
        }),
      ],
    );

    expect(selected?.action.actionId).toBe(remoteRun.actionId);
    expect(selected?.evidence).toContain(
      "terminal_contest_kind:visible_two_point_remote",
    );
  });

  it("does not force a two-point contest without public advancement", () => {
    const remoteRun = action("run-remote", "start_run", {
      serverId: "remote_1",
    });

    expect(
      runnerOpponentMatchpointContestSemanticChoice(
        input({ opponentAgendaPoints: 5, actions: [remoteRun] }),
        [choice(remoteRun, 200)],
        [runTarget(remoteRun.actionId)],
      ),
    ).toBeUndefined();
  });
});

function input(params: {
  opponentAgendaPoints: number;
  actions: LegalAction[];
}): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      stateVersion: 1,
      side: "runner",
      activeSide: "runner",
      phase: "runner_action_phase",
      timingPoint: "runner_action.main",
      own: {
        identity: { instanceId: "runner-id", known: true },
        credits: 9,
        clicks: 4,
        agendaPoints: 2,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: { instanceId: "corp-id", known: true },
        credits: 4,
        clicks: 0,
        agendaPoints: params.opponentAgendaPoints,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 4,
        discardCount: 18,
        scoreArea: [],
      },
      servers: [
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [],
          root: [{ instanceId: "unknown-root", known: false }],
        },
      ],
      publicEvents: [],
      legalActions: params.actions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: params.actions,
    difficulty: "hard",
    seed: "runner-matchpoint-contest-test",
    decisionId: "runner-matchpoint-contest-test:1:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  } as AiDecisionInput;
}

function runTarget(
  actionId: string,
  overrides: Partial<RunnerRunTargetEvaluation> = {},
): RunnerRunTargetEvaluation {
  return {
    targetServerId: "remote_1",
    targetKind: "remote",
    actionId,
    accessPayoff: "unknown",
    pathPassability: "reachable",
    creditsAfterRun: 5,
    scoreThreat: false,
    recommendation: "run_if_free",
    score: 160,
    ...overrides,
  } as RunnerRunTargetEvaluation;
}

function action(
  actionId: string,
  type: LegalAction["type"],
  payload: Record<string, string | number | boolean> = {},
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    payload,
  };
}

function choice(
  legalAction: LegalAction,
  score: number,
): SemanticRuntimeChoice {
  return {
    action: legalAction,
    scopeId: "test",
    score,
    scoreBreakdown: [],
    reasonCode: "test",
    explanation: "test",
    evidence: [],
  };
}
