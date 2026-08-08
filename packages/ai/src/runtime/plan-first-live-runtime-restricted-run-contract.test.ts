import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import {
  aiInput,
  legalAction,
  safeRuntimeRunTarget,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { createSemanticRuntimeDecisionContext } from "./semantic-runtime-decision-context";
import type { SemanticRuntimeDecisionContextDependencies } from "./semantic-runtime-decision-context";

describe("plan-first Engine-restricted run contract", () => {
  it("ranks cost-free restricted targets by the existing side-safe run evaluation", () => {
    resetResidentPlanPortfolioMemory();
    const archivesRun = restrictedRun("archives");
    const rdRun = restrictedRun("rd");
    const input = aiInput("runner", [archivesRun, rdRun]);
    input.playerView.own.clicks = 2;
    input.playerView.opponent.deckCount = 10;
    const archivesNoPayoff = {
      ...safeRuntimeRunTarget(archivesRun.actionId, "archives"),
      recommendation: "do_not_run_now" as const,
      knownAccessState: "known_no_current_payoff" as const,
      score: -420,
    };
    const freshRd = {
      ...safeRuntimeRunTarget(rdRun.actionId, "rd"),
      recommendation: "run_now" as const,
      knownAccessState: "fresh" as const,
      score: 300,
    };

    const rdDecision = liveContext({
      evaluateRunnerRunTargets: () => [archivesNoPayoff, freshRd],
    }).chooseSemanticRuntimeAction(input, {});

    expect(rdDecision).toMatchObject({
      actionId: rdRun.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
    });
    expect(rdDecision.evidence).toEqual(
      expect.arrayContaining([
        "plan_action_assessment_evidence:runner_restricted_run_sequence_target_score:300",
        "plan_action_assessment_evidence:runner_restricted_run_sequence_target_recommendation:run_now",
      ]),
    );

    resetResidentPlanPortfolioMemory();
    const valuableArchives = {
      ...archivesNoPayoff,
      recommendation: "run_now" as const,
      knownAccessState: "fresh" as const,
      score: 420,
    };
    const archivesDecision = liveContext({
      evaluateRunnerRunTargets: () => [valuableArchives, freshRd],
    }).chooseSemanticRuntimeAction(input, {});

    expect(archivesDecision).toMatchObject({
      actionId: archivesRun.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
    });
  });

  it("declines an optional restricted run when every target lacks current marginal value", () => {
    resetResidentPlanPortfolioMemory();
    const archivesRun = optionalRestrictedRun("archives");
    const remoteRun = optionalRestrictedRun("remote_1");
    const decline = legalAction(
      "runner.trigger_ability.decline_optional_bonus_run",
      "runner",
      "trigger_ability",
      "Decline optional bonus run",
      { credits: 0, clicks: 0 },
      {
        source: "game_rule",
        payload: { runnerAbility: "decline_optional_bonus_run" },
      },
    );
    const input = aiInput("runner", [archivesRun, remoteRun, decline]);
    input.playerView.own.clicks = 3;
    const unknownArchives = {
      ...safeRuntimeRunTarget(archivesRun.actionId, "archives"),
      recommendation: "run_if_free" as const,
      accessPayoff: "unknown" as const,
      score: 160,
    };
    const unaffordableRemote = {
      ...safeRuntimeRunTarget(remoteRun.actionId, "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      knownAccessState: "known_no_current_payoff" as const,
      recommendation: "declined_trash_memory_active" as const,
      accessPayoff: "trash_unaffordable" as const,
      score: -520,
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [unknownArchives, unaffordableRemote],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: decline.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_action_assessment_evidence:runner_optional_bonus_run_decline",
        "plan_step_capability:continue_engine_restricted_run_sequence",
      ]),
    );
  });

  it("prefers the cost-free restricted run over a click-costing run to the same server", () => {
    resetResidentPlanPortfolioMemory();
    const ordinaryRun = legalAction(
      "runner.start_run.archives",
      "runner",
      "start_run",
      "Run Archives",
      { credits: 0, clicks: 1 },
      {
        source: "basic_action",
        payload: { serverId: "archives", effectKind: "run" },
      },
    );
    const restrictedRun = legalAction(
      "runner.start_run.archives.restricted",
      "runner",
      "start_run",
      "Restricted run Archives",
      { credits: 0, clicks: 0 },
      {
        source: "engine_restricted_action",
        payload: {
          serverId: "archives",
          effectKind: "run",
          restrictedActionGrantActionType: "start_run",
          restrictedActionGrantCostProfile: "no_click",
          restrictedActionGrantRemainingActions: 1,
        },
      },
    );
    const input = aiInput("runner", [ordinaryRun, restrictedRun]);
    input.playerView.own.clicks = 2;
    input.playerView.opponent.deckCount = 10;

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [
        safeRuntimeRunTarget(ordinaryRun.actionId, "archives"),
        safeRuntimeRunTarget(restrictedRun.actionId, "archives"),
      ],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: restrictedRun.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_action_assessment_evidence:runner_engine_restricted_run_sequence_continuation",
        "plan_action_assessment_evidence:runner_restricted_run_sequence_cost_profile:no_click",
        "plan_step_capability:continue_engine_restricted_run_sequence",
      ]),
    );
  });

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

  it("preserves the hard EndTurn contract when the only ordinary Remote run has no current payoff", () => {
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

    let failure: unknown;
    try {
      liveContext({
        evaluateRunnerRunTargets: () => [noPayoffRemote],
      }).chooseSemanticRuntimeAction(input, {});
    } catch (error) {
      failure = error;
    }

    expect(failure).toBeInstanceOf(PlanResolutionFailure);
    expect(failure).toMatchObject({
      code: "end_turn_with_usable_capacity",
      context: {
        side: "runner",
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: ["end_turn", "start_run"],
        unresolvedActionIds: [runRemote.actionId],
        owner: "rules_contract",
      },
    });
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

function restrictedRun(serverId: "archives" | "rd"): LegalAction {
  return legalAction(
    `runner.start_run.${serverId}.restricted`,
    "runner",
    "start_run",
    `Restricted run ${serverId}`,
    { credits: 0, clicks: 0 },
    {
      source: "engine_restricted_action",
      payload: {
        serverId,
        effectKind: "run",
        restrictedActionGrantActionType: "start_run",
        restrictedActionGrantCostProfile: "no_click",
        restrictedActionGrantRemainingActions: 1,
      },
    },
  );
}

function optionalRestrictedRun(serverId: "archives" | "remote_1"): LegalAction {
  return legalAction(
    `runner.start_run.${serverId}.optional_restricted`,
    "runner",
    "start_run",
    `Optional restricted run ${serverId}`,
    { credits: 0, clicks: 0 },
    {
      source: "engine_restricted_action",
      payload: {
        serverId,
        effectKind: "run",
        bonusRunNoClick: true,
        optionalBonusRun: true,
        restrictedActionGrantActionType: "start_run",
        restrictedActionGrantCostProfile: "no_click",
        restrictedActionGrantRemainingActions: 1,
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
