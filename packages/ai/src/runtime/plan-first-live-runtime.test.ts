import { describe, expect, it, vi } from "vitest";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { createSemanticRuntimeDecisionContext } from "./semantic-runtime-decision-context";
import type { SemanticRuntimeDecisionContextDependencies } from "./semantic-runtime-decision-context";

describe("authoritative plan-first live runtime", () => {
  it("routes a voluntary Runner action through a resident executor", () => {
    resetResidentPlanPortfolioMemory();
    const action = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [action]);
    input.playerView.own.credits = 0;
    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "credit",
      fallbackUsed: false,
      reasonCode: "plan_first.runner.economy",
      decisionDebug: {
        planKind: "runner.economy",
        memoryVersion: "resident-plan-portfolio-v2",
      },
    });
    expect(decision.evidence).toContain("plan_first_lane:plan");
  });

  it("routes Corp economy through the Corp registry without a legacy winner", () => {
    resetResidentPlanPortfolioMemory();
    const action = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("corp", [action]);
    input.playerView.own.credits = 4;
    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision.reasonCode).toBe("plan_first.corp.economy");
    expect(decision.fallbackUsed).toBe(false);
  });

  it("uses the engine lane for a sole zero-click EndTurn", () => {
    resetResidentPlanPortfolioMemory();
    const action = legalAction("end", "runner", "end_turn", "End turn", {
      credits: 0,
      clicks: 0,
    });
    const input = aiInput("runner", [action]);
    input.playerView.own.clicks = 0;
    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "end",
      reasonCode: "plan_first.engine_window",
      fallbackUsed: false,
    });
  });

  it("does not rewrite older resident memory during an engine-only window", () => {
    resetResidentPlanPortfolioMemory();
    const context = liveContext();
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const first = aiInput("runner", [credit]);
    first.playerView.own.credits = 0;
    context.chooseSemanticRuntimeAction(first, {});

    const end = legalAction("end", "runner", "end_turn", "End turn", {
      credits: 1,
      clicks: 0,
    });
    const later = aiInput("runner", [end]);
    later.decisionId = first.decisionId;
    later.playerView.stateVersion = first.playerView.stateVersion + 10;
    later.playerView.own.clicks = 0;

    expect(context.chooseSemanticRuntimeAction(later, {})).toMatchObject({
      actionId: "end",
      reasonCode: "plan_first.engine_window",
      fallbackUsed: false,
    });
  });

  it("fails visibly instead of ending a turn with usable clicks", () => {
    resetResidentPlanPortfolioMemory();
    const action = legalAction("end", "runner", "end_turn", "End turn", {
      credits: 0,
      clicks: 0,
    });
    const input = aiInput("runner", [action]);
    input.playerView.own.clicks = 3;
    input.playerView.opponent.deckCount = 1;

    expect(() => liveContext().chooseSemanticRuntimeAction(input, {})).toThrow(
      PlanResolutionFailure,
    );
  });

  it("permits early EndTurn only through the rules-proven Corp deckout plan", () => {
    resetResidentPlanPortfolioMemory();
    const action = legalAction("end", "runner", "end_turn", "End turn", {
      credits: 0,
      clicks: 0,
    });
    const input = aiInput("runner", [action]);
    input.playerView.own.clicks = 3;
    input.playerView.opponent.deckCount = 0;

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "end",
      reasonCode: "plan_first.runner.secure_terminal_win",
      fallbackUsed: false,
      decisionDebug: { planKind: "runner.secure_terminal_win" },
    });
  });

  it("creates a run-window plan for legal access choices even without a stale run snapshot", () => {
    resetResidentPlanPortfolioMemory();
    const decline = legalAction(
      "decline",
      "runner",
      "decline_trash",
      "Decline trash",
      { credits: 0, clicks: 0 },
    );
    const steal = legalAction(
      "steal",
      "runner",
      "steal_agenda",
      "Steal agenda",
      { credits: 0, clicks: 0 },
    );
    const input = aiInput("runner", [decline, steal]);

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      fallbackUsed: false,
      reasonCode: "plan_first.runner.convert_run_window",
      decisionDebug: { planKind: "runner.convert_run_window" },
    });
  });

  it("admits a visibly known agenda remote directly as a witnessed contest plan", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const draw = legalAction("draw", "runner", "draw_card", "Draw", {
      credits: 0,
      clicks: 1,
    });
    const input = aiInput("runner", [run, draw]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [visibleCard("agenda", "corp", "agenda")]),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "run-remote",
      reasonCode: "plan_first.runner.contest_remote",
      fallbackUsed: false,
      decisionDebug: { planKind: "runner.contest_remote" },
    });
  });

  it("does not invoke legacy semantic choice or tactical override selection", () => {
    resetResidentPlanPortfolioMemory();
    const legacyChoices = vi.fn(() => {
      throw new Error("legacy_semantic_selection_invoked");
    });
    const legacyOverride = vi.fn(() => {
      throw new Error("legacy_override_invoked");
    });
    const action = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [action]);
    input.playerView.own.credits = 0;
    const context = liveContext({
      semanticRuntimeChoices: legacyChoices,
      bestSemanticRuntimeChoiceForTacticalPlanOverride: legacyOverride,
    });

    expect(context.chooseSemanticRuntimeAction(input, {}).actionId).toBe(
      "credit",
    );
    expect(legacyChoices).not.toHaveBeenCalled();
    expect(legacyOverride).not.toHaveBeenCalled();
  });
});

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
    selectedChoicesForDecision: () => undefined,
    practicalMicroRuntimeCandidates: () => [],
    ...overrides,
  } as unknown as SemanticRuntimeDecisionContextDependencies;
  return createSemanticRuntimeDecisionContext(dependencies);
}
