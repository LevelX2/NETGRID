import type { AiDecisionInput, Side } from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { createPlanStep, createTacticalPlan } from "./tactical-plan-builders";
import type { TacticalPlanType } from "./tactical-plan-types";
import {
  advancePlanPortfolioForSelectedAction,
  aggregatePlanActionContributions,
  buildPlanPortfolioActionContributions,
  buildPlanPortfolio,
  planPortfolioEntryCanAct,
  planPortfolioTurnKey,
  redactedPlanPortfolioFacts,
  redactedPlanActionContributionFacts,
  tacticalPlanExecutionClass,
  type PlanActionContribution,
  type PlanPortfolioSnapshot,
} from "./plan-portfolio";
import {
  getPlanPortfolioMemorySnapshot,
  rememberPlanPortfolioSnapshot,
  resetPlanPortfolioMemory,
} from "./plan-portfolio-memory";

const ALL_TACTICAL_PLAN_TYPES: TacticalPlanType[] = [
  "runner.obtain_breaker_coverage",
  "runner.contest_remote",
  "runner.opportunistic_central_run",
  "runner.clear_tags_or_survive",
  "runner.convert_success_window",
  "runner.survival_defense",
  "runner.restore_hand_buffer",
  "runner.develop_hand_card",
  "runner.play_best_hand_card",
  "runner.build_credit_base",
  "runner.build_credit_bank",
  "runner.cash_out_credit_bank",
  "corp.create_score_window",
  "corp.develop_finite_economy",
  "corp.activate_persistent_economy",
  "corp.build_credit_bank",
  "corp.establish_scoring_remote",
  "corp.rez_defense",
  "corp.apply_punish_pressure",
];

describe("plan portfolio", () => {
  beforeEach(() => resetPlanPortfolioMemory());

  it("classifies every current tactical plan type", () => {
    expect(
      ALL_TACTICAL_PLAN_TYPES.map((type) => [
        type,
        tacticalPlanExecutionClass(type),
      ]),
    ).toEqual(
      expect.arrayContaining([
        ["runner.clear_tags_or_survive", "reactive_interrupt"],
        ["runner.build_credit_bank", "recurring_cycle"],
        ["corp.create_score_window", "bounded_sequence"],
        ["corp.activate_persistent_economy", "recurring_cycle"],
      ]),
    );
    expect(ALL_TACTICAL_PLAN_TYPES).toHaveLength(19);
  });

  it("keeps one foreground and at most two deterministic backgrounds", () => {
    const input = decisionInput("runner", 10);
    const portfolio = buildPlanPortfolio({
      input,
      turnKey: "runner-turn-3",
      tacticalPlans: [
        plan("runner.develop_hand_card", 700, "card", "hand-a"),
        plan("runner.contest_remote", 900, "server", "remote_1"),
        plan("runner.build_credit_bank", 800, "bank", "bank-a"),
        plan("runner.build_credit_bank", 790, "bank", "bank-b"),
        plan("runner.build_credit_bank", 780, "bank", "bank-c"),
      ],
    });

    expect(portfolio.foreground?.planType).toBe("runner.contest_remote");
    expect(portfolio.backgrounds.map((entry) => entry.target?.id)).toEqual([
      "bank-a",
      "bank-b",
    ]);
    expect(portfolio.rejectedEntryIds).toHaveLength(1);
  });

  it("suspends foreground and background work for a reactive interrupt", () => {
    const input = decisionInput("runner", 12);
    const portfolio = buildPlanPortfolio({
      input,
      turnKey: "runner-turn-4",
      tacticalPlans: [
        plan("runner.clear_tags_or_survive", 990, "capability", "tag-clear"),
        plan("runner.contest_remote", 900, "server", "remote_1"),
        plan("runner.build_credit_bank", 800, "bank", "bank-a"),
      ],
    });

    expect(portfolio.interrupt?.lifecycle).toBe("active");
    expect(portfolio.foreground?.lifecycle).toBe("suspended");
    expect(portfolio.backgrounds[0]?.lifecycle).toBe("suspended");
  });

  it("resumes a recurring background after an interrupt disappears", () => {
    const interruptInput = decisionInput("runner", 12);
    const interrupted = buildPlanPortfolio({
      input: interruptInput,
      turnKey: "runner-turn-4",
      tacticalPlans: [
        plan("runner.clear_tags_or_survive", 990, "capability", "tag-clear"),
        plan("runner.build_credit_bank", 800, "bank", "bank-a"),
      ],
    });
    const resumed = buildPlanPortfolio({
      input: decisionInput("runner", 13),
      previous: interrupted,
      turnKey: "runner-turn-4",
      tacticalPlans: [
        plan("runner.build_credit_bank", 800, "bank", "bank-a", 13),
      ],
    });

    expect(resumed.interrupt).toBeUndefined();
    expect(resumed.backgrounds[0]).toMatchObject({
      lifecycle: "active",
      target: { id: "bank-a" },
    });
    expect(resumed.backgrounds[0]?.evidence).toContain(
      "plan_portfolio_previous_entry:runner.build_credit_bank:bank:bank-a",
    );
  });

  it("carries a background project dormant when no current action maps", () => {
    const previous = buildPlanPortfolio({
      input: decisionInput("corp", 20),
      turnKey: "corp-turn-5",
      tacticalPlans: [
        plan("corp.activate_persistent_economy", 820, "card", "asset-a", 20),
      ],
    });
    const current = buildPlanPortfolio({
      input: decisionInput("corp", 21),
      previous,
      turnKey: "corp-turn-6",
      tacticalPlans: [],
    });

    expect(current.backgrounds[0]).toMatchObject({
      lifecycle: "dormant",
      target: { id: "asset-a" },
      cadence: { actionsUsedThisTurn: 0 },
    });
  });

  it("aggregates bounded contributions from multiple portfolio entries", () => {
    const portfolio = buildPlanPortfolio({
      input: decisionInput("corp", 30),
      turnKey: "corp-turn-8",
      tacticalPlans: [
        plan("corp.create_score_window", 950, "server", "remote_1", 30),
        plan("corp.build_credit_bank", 700, "bank", "corp-bank", 30),
      ],
    });
    const foregroundId = portfolio.foreground!.portfolioEntryId;
    const backgroundId = portfolio.backgrounds[0]!.portfolioEntryId;
    const contributions: PlanActionContribution[] = [
      {
        actionId: "gain-credit",
        portfolioEntryId: foregroundId,
        contributionKind: "fund",
        value: 300,
        evidence: ["fund_score_window"],
      },
      {
        actionId: "gain-credit",
        portfolioEntryId: backgroundId,
        contributionKind: "progress",
        value: 120,
        evidence: ["fund_bank"],
      },
    ];

    expect(
      aggregatePlanActionContributions({ portfolio, contributions })[0],
    ).toMatchObject({
      actionId: "gain-credit",
      foregroundValue: 300,
      backgroundValue: 120,
      multiPlanBonus: 80,
      totalValue: 500,
      contributionCount: 2,
    });
  });

  it("isolates memory by decision scope, side and profile", () => {
    const input = decisionInput("corp", 40, "match-a:decision-1", "candidate");
    const snapshot = buildPlanPortfolio({
      input,
      tacticalPlans: [plan("corp.build_credit_bank", 700, "bank", "bank")],
      turnKey: "corp-turn-10",
    });
    expect(rememberPlanPortfolioSnapshot(input, snapshot)).toEqual(snapshot);
    expect(getPlanPortfolioMemorySnapshot(input)).toEqual(snapshot);
    expect(
      getPlanPortfolioMemorySnapshot(
        decisionInput("corp", 40, "match-b:decision-1", "candidate"),
      ),
    ).toBeUndefined();
    expect(
      getPlanPortfolioMemorySnapshot(
        decisionInput("corp", 40, "match-a:decision-2", "other-profile"),
      ),
    ).toBeUndefined();
  });

  it("emits redacted bounded portfolio facts", () => {
    const portfolio = buildPlanPortfolio({
      input: decisionInput("corp", 50),
      tacticalPlans: [
        plan("corp.create_score_window", 950, "card", "hidden-own-card", 50),
        plan("corp.build_credit_bank", 700, "bank", "bank", 50),
      ],
    });
    const facts = redactedPlanPortfolioFacts(portfolio);

    expect(facts).toContain(
      "plan_portfolio_foreground:corp.create_score_window",
    );
    expect(JSON.stringify(facts)).not.toContain("hidden-own-card");
  });

  it("derives a stable runner turn key from public Corp end-turn events", () => {
    const input = decisionInput("runner", 60);
    const firstEnd = publicEvent("corp-end-1", 20, "corp", "end_turn");
    const secondEnd = publicEvent("corp-end-2", 50, "corp", "end_turn");
    input.playerView.publicEvents = [firstEnd, secondEnd];
    input.eventTail = [secondEnd];

    expect(planPortfolioTurnKey(input)).toBe("runner:turn:2");
  });

  it("records background cadence when its mapped action is selected", () => {
    const portfolio = buildPlanPortfolio({
      input: decisionInput("runner", 70),
      turnKey: "runner:turn:5",
      tacticalPlans: [
        plan("runner.build_credit_bank", 800, "bank", "bank-a", 70),
      ],
    });
    const advanced = advancePlanPortfolioForSelectedAction(
      portfolio,
      "action:bank-a",
    );

    expect(advanced.backgrounds[0]?.cadence).toMatchObject({
      turnKey: "runner:turn:5",
      actionsUsedThisTurn: 1,
      lastProgressTurnKey: "runner:turn:5",
    });
    const sameTurn = buildPlanPortfolio({
      input: decisionInput("runner", 71),
      previous: advanced,
      turnKey: "runner:turn:5",
      tacticalPlans: [
        plan("runner.build_credit_bank", 800, "bank", "bank-a", 71),
      ],
    });
    expect(planPortfolioEntryCanAct(sameTurn.backgrounds[0]!)).toBe(false);
  });

  it("marks one action that advances foreground and background as a multi-plan contribution", () => {
    const foreground = plan(
      "corp.create_score_window",
      950,
      "server",
      "remote_1",
      80,
    );
    const background = plan(
      "corp.establish_scoring_remote",
      690,
      "server",
      "remote_1",
      80,
    );
    foreground.currentStep.actionCandidateIds = ["install-shared-ice"];
    background.currentStep.actionCandidateIds = ["install-shared-ice"];
    const portfolio = buildPlanPortfolio({
      input: decisionInput("corp", 80),
      turnKey: "corp:turn:8",
      tacticalPlans: [foreground, background],
    });
    const scores = aggregatePlanActionContributions({
      portfolio,
      contributions: buildPlanPortfolioActionContributions(portfolio),
    });

    expect(scores[0]).toMatchObject({
      actionId: "install-shared-ice",
      contributionCount: 2,
      multiPlanBonus: 80,
    });
    expect(redactedPlanActionContributionFacts(scores)).toContain(
      "plan_action_contribution_multi_plan:install-shared-ice:true",
    );
  });
});

function plan(
  type: TacticalPlanType,
  priority: number,
  targetKind: "server" | "card" | "capability" | "bank",
  targetId: string,
  stateVersion = 10,
) {
  const side: Side = type.startsWith("corp.") ? "corp" : "runner";
  return createTacticalPlan({
    planId: `${type}:${targetId}`,
    side,
    type,
    status: "active",
    priority,
    horizonTurns: 2,
    target: { kind: targetKind, id: targetId },
    currentStep: createPlanStep({
      stepId: `step:${targetId}`,
      kind:
        side === "corp"
          ? type === "corp.rez_defense"
            ? "rez_outer_ice"
            : "gain_credits"
          : type === "runner.clear_tags_or_survive"
            ? "clear_tags"
            : "gain_credits",
      desiredActionSemantics: ["test"],
      actionCandidateIds: [`action:${targetId}`],
      rationale: ["test fixture"],
    }),
    stateVersion,
  });
}

function decisionInput(
  side: Side,
  stateVersion: number,
  decisionId = "match-a:decision",
  profileId = "current_candidate",
): AiDecisionInput {
  return {
    side,
    playerView: {
      side,
      stateVersion,
      timingPoint: side === "corp" ? "corp_action.main" : "runner_action.main",
      activeSide: side,
      phase: side === "corp" ? "corp_action_phase" : "runner_action_phase",
      own: {
        identity: { instanceId: `${side}-identity`, known: true },
        credits: 8,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 40,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: {
          instanceId: `${side === "corp" ? "runner" : "corp"}-identity`,
          known: true,
        },
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 40,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "seed",
    decisionId,
    actionNumber: stateVersion,
    profileId,
  };
}

function publicEvent(
  eventId: string,
  stateVersionAfter: number,
  actor: Side,
  actionType: string,
) {
  return {
    eventId,
    type: actionType,
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public" as const,
    publicPayload: { actor, actionType },
  };
}
