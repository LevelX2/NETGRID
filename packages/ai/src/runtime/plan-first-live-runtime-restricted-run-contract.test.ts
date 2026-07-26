import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import {
  aiInput,
  legalAction,
  safeRuntimeRunTarget,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { createSemanticRuntimeDecisionContext } from "./semantic-runtime-decision-context";
import type { SemanticRuntimeDecisionContextDependencies } from "./semantic-runtime-decision-context";

describe("plan-first Engine-restricted run contract", () => {
  it("keeps Wilson's exact run-only actions owned by the restricted run window", () => {
    resetResidentPlanPortfolioMemory();
    const runHq = wilsonRun("hq");
    const runRemote = wilsonRun("remote_1");
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [runHq, runRemote, end]);
    input.playerView.own.clicks = 0;
    input.playerView.own.credits = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("grip-1", "runner", "event"),
      visibleCard("grip-2", "runner", "event"),
      visibleCard("grip-3", "runner", "event"),
    ];
    input.playerView.own.rig = [
      visibleCard(
        "runner_onr_v1_187_wilson-weeflerunner-apprentice_1",
        "runner",
        "resource",
        {
          definitionId: "onr_v1_187_wilson-weeflerunner-apprentice",
          title: "Wilson, Weeflerunner Apprentice",
        },
      ),
    ];
    input.playerView.opponent.deckCount = 10;
    const productiveHq = safeRuntimeRunTarget(runHq.actionId, "hq");
    const noPayoffRemote = {
      ...safeRuntimeRunTarget(runRemote.actionId, "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      knownAccessState: "known_no_current_payoff" as const,
      recommendation: "do_not_run_now" as const,
      score: -420,
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [productiveHq, noPayoffRemote],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: runHq.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
    });
    const window = residentPlanPortfolioSnapshot(input)?.instances.find(
      (instance) => instance.moduleId === "runner.convert_run_window",
    );
    expect(window).toMatchObject({
      parentInstanceId: "rules.restricted_action_sequence",
      moduleState: {
        signal: {
          purposeCode: "continue_engine_restricted_run_sequence",
          evidenceCode: "runner_engine_restricted_run_sequence_continuation",
          actionAssessments: {
            [runHq.actionId]: {
              admissible: true,
            },
            [runRemote.actionId]: {
              admissible: true,
            },
          },
        },
      },
    });
  });

  it("still rejects an ordinary Remote run with no current payoff", () => {
    resetResidentPlanPortfolioMemory();
    const runRemote = legalAction(
      "runner.start_run.remote_1",
      "runner",
      "start_run",
      "Run remote 1",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [runRemote, end]);
    input.playerView.own.clicks = 1;
    input.playerView.own.gripOrHq = [
      visibleCard("grip-1", "runner", "event"),
      visibleCard("grip-2", "runner", "event"),
      visibleCard("grip-3", "runner", "event"),
    ];
    input.playerView.opponent.deckCount = 10;
    const noPayoffRemote = {
      ...safeRuntimeRunTarget(runRemote.actionId, "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      knownAccessState: "known_no_current_payoff" as const,
      recommendation: "do_not_run_now" as const,
      score: -420,
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [noPayoffRemote],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: end.actionId,
      reasonCode: "plan_first.runner.complete_turn",
      fallbackUsed: false,
    });
    const runAlternative = decision.decisionDebug?.actionAlternatives?.find(
      (alternative) => alternative.actionId === runRemote.actionId,
    );
    expect(runAlternative?.selected).toBe(false);
    expect(runAlternative?.whyNot).toEqual(
      expect.arrayContaining([
        "not_selected_by_plan:plan:runner.complete_turn:standard-turn-completion",
      ]),
    );
    expect(decision.evidence).toContain(
      "plan_assessment_evidence:runner_remote_run_known_no_current_payoff:remote_1:do_not_run_now",
    );
  });
});

function wilsonRun(serverId: "hq" | "remote_1"): LegalAction {
  const sourceId = "runner_onr_v1_187_wilson-weeflerunner-apprentice_1";
  return legalAction(
    `runner.start_run.${sourceId}.${serverId}.${sourceId}.gain_run_only_action`,
    "runner",
    "start_run",
    `Wilson run on ${serverId}`,
    { credits: 0, clicks: 1 },
    {
      source: sourceId,
      payload: {
        serverId,
        abilityFamily: "run-access",
        abilityId: "gain_run_only_action",
        effectKind: "gain_credits",
        sourceDefinitionId: "onr_v1_187_wilson-weeflerunner-apprentice",
        gainActionsAmount: 1,
        actionCapacityTiming: "immediate",
        actionCapacityRestriction: "run_only",
        actionCapacityAllowedActionType: "start_run",
        actionCapacityReliability: "guaranteed",
        actionCapacityExpiresAt: "side_turn_end",
        actionCapacitySelfFinancing: true,
        restrictedActionGrantActionType: "start_run",
        restrictedActionGrantCostProfile: "extra_click",
        restrictedActionGrantRemainingActions: 1,
        cardId: sourceId,
        runnerAbility: "gain_run_only_action",
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
      desiredCreditReserve: 5,
      fundingNeed: true,
      evidence: ["test_visible_funding_need"],
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
