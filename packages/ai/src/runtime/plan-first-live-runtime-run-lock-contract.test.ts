import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { createSemanticRuntimeDecisionContext } from "./semantic-runtime-decision-context";
import type { SemanticRuntimeDecisionContextDependencies } from "./semantic-runtime-decision-context";

describe("plan-first Runner run-lock parent-plan contract", () => {
  it("uses last productive liquidity when a run lock has no pressure route or bound funding need", () => {
    resetResidentPlanPortfolioMemory();
    const gainCredit = legalAction(
      "runner.gain_credit",
      "runner",
      "gain_credit",
      "Gain 1 credit",
      { credits: 0, clicks: 1 },
    );
    const endTurn = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
    );
    const input = runLockInput([gainCredit, endTurn], 4, 6);

    const decision = liveContext().chooseSemanticRuntimeAction(input, {
      runnerTurnPlannerMode: "legacy_compare",
    });

    expect(decision).toMatchObject({
      actionId: gainCredit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:gain_general_liquid_credits",
        "plan_assessment_evidence:runner_engine_certified_immediate_liquidity_development",
      ]),
    );
  });

  it("executes the exact release step once costs, path, and reserve are covered", () => {
    resetResidentPlanPortfolioMemory();
    const release = legalAction(
      "runner.release_run_lock",
      "runner",
      "trigger_ability",
      "Remove run lock",
      { credits: 2, clicks: 1 },
      {
        payload: {
          abilityId: "pay_to_remove_run_lock",
          v1920RunnerRunLockAbility: "pay_to_remove_run_lock",
          runnerRunLockCreditCost: 2,
        },
      },
    );
    const gainCredit = legalAction(
      "runner.gain_credit",
      "runner",
      "gain_credit",
      "Gain 1 credit",
      { credits: 0, clicks: 1 },
    );
    const input = runLockInput([release, gainCredit], 6, 2);

    const decision = liveContext().chooseSemanticRuntimeAction(input, {
      runnerTurnPlannerMode: "legacy_compare",
    });

    expect(decision).toMatchObject({
      actionId: release.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.pressure_central",
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["plan_step_capability:pressure_hq_access"]),
    );
  });
});

function runLockInput(
  actions: ReturnType<typeof legalAction>[],
  credits: number,
  creditCost: number,
) {
  const input = aiInput("runner", actions);
  input.playerView.stateVersion = credits;
  input.playerView.own.credits = credits;
  input.playerView.own.clicks = 4;
  input.playerView.own.rig = [
    visibleCard("installed-breaker", "runner", "program", {
      subtypes: ["Icebreaker"],
    }),
  ];
  input.playerView.opponent.agendaPoints = 4;
  input.playerView.opponent.handCount = 5;
  input.playerView.opponent.deckCount = 20;
  input.playerView.servers = [server("hq"), server("rd"), server("archives")];
  input.playerView.turnSerial = 7;
  input.eventTail = [
    {
      eventId: "visible-run-lock",
      type: "resolve_trace",
      stateVersionBefore: Math.max(0, credits - 1),
      stateVersionAfter: credits,
      turnSerial: 7,
      stateHashAfter: "fnv1a:test-run-lock",
      publicPayload: {
        runnerRunEnded: true,
        runnerRunLockCreditCost: creditCost,
      },
    },
  ] as typeof input.eventTail;
  return input;
}

function liveContext() {
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
      evidence: ["test_run_lock_parent_contract"],
    }),
    evaluateRunnerRunTargets: () => [],
    runnerEncounterActionExclusion: () => undefined,
    semanticRuntimeChoices: () => [],
    selectedChoicesForDecision: () => undefined,
    practicalMicroRuntimeCandidates: () => [],
  } as unknown as SemanticRuntimeDecisionContextDependencies;
  return createSemanticRuntimeDecisionContext(dependencies);
}
