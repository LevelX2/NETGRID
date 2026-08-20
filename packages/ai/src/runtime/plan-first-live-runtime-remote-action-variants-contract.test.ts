import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import {
  aiInput,
  legalAction,
  safeRuntimeRunTarget,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { createSemanticRuntimeDecisionContext } from "./semantic-runtime-decision-context";
import type { SemanticRuntimeDecisionContextDependencies } from "./semantic-runtime-decision-context";

describe("plan-first Remote same-server action variants", () => {
  it("routes every productive variant through one Remote plan, disposes the unproductive variant, and selects the best exact route", () => {
    resetResidentPlanPortfolioMemory();
    const direct = legalAction(
      "run-remote-direct",
      "runner",
      "start_run",
      "Run Remote 1",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const insideJob = legalAction(
      "run-remote-inside-job",
      "runner",
      "play_event",
      "Inside Job on Remote 1",
      { credits: 2, clicks: 1 },
      {
        source: "inside-job-1",
        payload: {
          cardId: "inside-job-1",
          sourceDefinitionId: "onr_v1_094_inside-job",
          serverId: "remote_1",
          runnerEventRun: true,
        },
      },
    );
    const redundantInsideJob = legalAction(
      "run-remote-redundant-inside-job",
      "runner",
      "play_event",
      "Redundant Inside Job on Remote 1",
      { credits: 2, clicks: 1 },
      {
        source: "inside-job-2",
        payload: {
          cardId: "inside-job-2",
          sourceDefinitionId: "onr_v1_094_inside-job",
          serverId: "remote_1",
          runnerEventRun: true,
        },
      },
    );
    const input = aiInput("runner", [direct, insideJob, redundantInsideJob]);
    input.playerView.own.credits = 10;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("inside-job-1", "runner", "event", {
        definitionId: "onr_v1_094_inside-job",
      }),
      visibleCard("inside-job-2", "runner", "event", {
        definitionId: "onr_v1_094_inside-job",
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [visibleCard("remote-target", "corp", "agenda")]),
    ];

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [
        remoteTarget(insideJob.actionId, 340, "run_now"),
        remoteTarget(direct.actionId, 300, "run_now"),
        remoteTarget(redundantInsideJob.actionId, -120, "do_not_run_now"),
      ],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: insideJob.actionId,
      reasonCode: "plan_first.runner.contest_remote",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.contest_remote",
      },
    });
    const alternatives = decision.decisionDebug?.actionAlternatives ?? [];
    expect(
      alternatives.find((entry) => entry.actionId === direct.actionId)?.whyNot,
    ).toEqual(
      expect.arrayContaining([
        "not_selected_by_plan:plan:runner.contest_remote:remote%3Aremote_1",
      ]),
    );

    resetResidentPlanPortfolioMemory();
    const directPreferred = liveContext({
      evaluateRunnerRunTargets: () => [
        remoteTarget(direct.actionId, 400, "run_now"),
        remoteTarget(insideJob.actionId, 340, "run_now"),
        remoteTarget(redundantInsideJob.actionId, -120, "do_not_run_now"),
      ],
    }).chooseSemanticRuntimeAction(input, {});
    expect(directPreferred).toMatchObject({
      actionId: direct.actionId,
      reasonCode: "plan_first.runner.contest_remote",
      fallbackUsed: false,
    });
  });

  it("does not promote a low-value variant and completes the exhausted turn", () => {
    resetResidentPlanPortfolioMemory();
    const rejectedRun = legalAction(
      "run-empty-remote",
      "runner",
      "start_run",
      "Run empty Remote 1",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const endTurn = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [rejectedRun, endTurn]);
    input.playerView.own.clicks = 1;
    input.playerView.opponent.deckCount = 10;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1"),
    ];

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [
        remoteTarget(rejectedRun.actionId, -120, "do_not_run_now"),
      ],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: endTurn.actionId,
      reasonCode: "plan_first.runner.defense_and_recovery",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.defense_and_recovery",
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:runner.defense_and_recovery",
        "plan_step_capability:forgo_rejected_option_capacity",
      ]),
    );
  });
});

function remoteTarget(
  actionId: string,
  score: number,
  recommendation: "run_now" | "do_not_run_now",
) {
  const target = safeRuntimeRunTarget(actionId, "remote_1");
  return {
    ...target,
    targetKind: "remote" as const,
    accessTargetKind: "remote" as const,
    accessPayoff: "agenda" as const,
    knownAccessState: "known_payoff" as const,
    scoreThreat: true,
    runActionProjection: {
      ...target.runActionProjection,
      targetKind: "remote" as const,
    },
    recommendation,
    score,
  };
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
      desiredCreditReserve: 5,
      fundingNeed: false,
      evidence: ["test_remote_variant_contract"],
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
