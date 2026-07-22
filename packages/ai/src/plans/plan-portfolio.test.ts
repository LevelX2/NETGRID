import type { AiDecisionInput, LegalAction, Side } from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  createCorpCreditDemand,
  createRunnerCreditDemand,
} from "./credit-demand";
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
  planPortfolioFundingStep,
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
  "corp.fund_strategy_reserve",
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
        ["corp.develop_finite_economy", "recurring_cycle"],
        ["corp.activate_persistent_economy", "recurring_cycle"],
      ]),
    );
    expect(ALL_TACTICAL_PLAN_TYPES).toHaveLength(20);
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

  it("treats a future rez-reserve step as foreground funding, not an interrupt", () => {
    const input = decisionInput("corp", 13);
    input.playerView.own.credits = 2;
    input.legalActions = [legalAction("corp", "gain-credit")];
    const rezFunding = plan(
      "corp.rez_defense",
      1_006,
      "capability",
      "hq-rez-reserve",
      13,
    );
    rezFunding.currentStep = createPlanStep({
      stepId: "step:hq-rez-reserve",
      kind: "build_rez_reserve",
      desiredActionSemantics: ["gain_credits"],
      actionCandidateIds: ["gain-credit"],
      rationale: ["fund a later central rez"],
    });
    const scoreConversion = plan(
      "corp.create_score_window",
      1_129,
      "server",
      "remote_1",
      13,
    );
    scoreConversion.status = "blocked";
    scoreConversion.creditDemands = [
      createCorpCreditDemand({
        demandId: "corp:score-window",
        sourcePlanId: scoreConversion.planId,
        purpose: "current_score_window",
        priority: "current_foreground_plan",
        hardness: "hard",
        deadline: "end_of_current_turn",
        currentCredits: 2,
        targetCredits: 4,
      }),
    ];

    const portfolio = buildPlanPortfolio({
      input,
      turnKey: "corp-turn-5",
      tacticalPlans: [rezFunding, scoreConversion],
      candidates: [economyCandidate("gain-credit")],
    });

    expect(portfolio.interrupt).toBeUndefined();
    expect(portfolio.foreground).toMatchObject({
      planType: "corp.create_score_window",
      lifecycle: "blocked",
      fundingCoverageResolvesHardBlocker: true,
    });
  });

  it("does not promote a hard blocker through a contingent funding route", () => {
    const input = decisionInput("corp", 14);
    input.playerView.own.credits = 2;
    input.legalActions = [legalAction("corp", "contingent-credit")];
    const activeRezFunding = plan(
      "corp.rez_defense",
      1_006,
      "capability",
      "hq-rez-reserve",
      14,
    );
    activeRezFunding.currentStep = createPlanStep({
      stepId: "step:hq-rez-reserve",
      kind: "build_rez_reserve",
      desiredActionSemantics: ["gain_credits"],
      actionCandidateIds: ["contingent-credit"],
      rationale: ["fund a later central rez"],
    });
    const blockedScore = plan(
      "corp.create_score_window",
      1_129,
      "server",
      "remote_1",
      14,
    );
    blockedScore.status = "blocked";
    blockedScore.creditDemands = [
      createCorpCreditDemand({
        demandId: "corp:contingent-score-window",
        sourcePlanId: blockedScore.planId,
        purpose: "current_score_window",
        priority: "current_foreground_plan",
        hardness: "hard",
        deadline: "end_of_current_turn",
        currentCredits: 2,
        targetCredits: 4,
      }),
    ];

    const portfolio = buildPlanPortfolio({
      input,
      turnKey: "corp-turn-6",
      tacticalPlans: [activeRezFunding, blockedScore],
      candidates: [
        economyCandidate("contingent-credit", {
          reliability: "conditional",
        }),
      ],
    });

    expect(portfolio.foreground?.planType).toBe("corp.rez_defense");
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

  it("records background cadence as a soft ranking limit", () => {
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
    expect(planPortfolioEntryCanAct(sameTurn.backgrounds[0]!)).toBe(true);
    const continuedContribution =
      buildPlanPortfolioActionContributions(sameTurn)[0];
    expect(continuedContribution?.value).toBeGreaterThan(0);
    expect(continuedContribution?.value).toBeLessThan(300);
    expect(continuedContribution?.evidence).toContain(
      "plan_contribution_background_cadence:soft_limit_reached",
    );
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

  it("reserves current credits by portfolio priority without double allocation", () => {
    const input = decisionInput("corp", 90);
    input.playerView.own.credits = 5;
    const interrupt = plan(
      "corp.rez_defense",
      990,
      "capability",
      "rez-now",
      90,
    );
    interrupt.creditDemands = [
      createCorpCreditDemand({
        demandId: "corp:rez-demand",
        sourcePlanId: interrupt.planId,
        purpose: "current_rez_window",
        priority: "acute_hard_plan_blocker",
        hardness: "hard",
        deadline: "before_current_plan_action",
        currentCredits: 5,
        targetCredits: 4,
      }),
    ];
    const foreground = plan(
      "corp.create_score_window",
      950,
      "server",
      "remote_1",
      90,
    );
    foreground.creditDemands = [
      createCorpCreditDemand({
        demandId: "corp:score-demand",
        sourcePlanId: foreground.planId,
        purpose: "current_score_window",
        priority: "current_foreground_plan",
        hardness: "hard",
        deadline: "end_of_current_turn",
        currentCredits: 5,
        targetCredits: 3,
      }),
    ];

    const portfolio = buildPlanPortfolio({
      input,
      tacticalPlans: [foreground, interrupt],
    });

    expect(portfolio.interrupt?.resourceReservation).toMatchObject({
      requestedCredits: 4,
      credits: 4,
      shortfallCredits: 0,
    });
    expect(portfolio.foreground?.resourceReservation).toMatchObject({
      requestedCredits: 3,
      credits: 1,
      shortfallCredits: 2,
    });
    expect(portfolio.unallocatedCredits).toBe(0);
  });

  it("gives a Broker setup step route contribution without pretending it pays immediately", () => {
    const input = decisionInput("runner", 91);
    input.playerView.own.credits = 0;
    input.playerView.own.clicks = 2;
    const brokerLoad = legalAction("runner", "broker-load");
    input.legalActions = [brokerLoad];
    const bankPlan = plan(
      "runner.build_credit_bank",
      800,
      "bank",
      "broker",
      91,
    );
    bankPlan.currentStep.actionCandidateIds = [];
    bankPlan.creditDemands = [
      createRunnerCreditDemand({
        demandId: "runner:broker-next-turn",
        sourcePlanId: bankPlan.planId,
        purpose: "next_turn_setup",
        priority: "next_own_turn",
        hardness: "soft",
        deadline: "start_of_next_own_turn",
        currentCredits: 0,
        targetCredits: 3,
      }),
    ];
    const candidate = economyCandidate("broker-load", {
      kind: "stored_credit_build",
      timing: "setup",
      storedCreditsAdded: 3,
      repeatable: false,
    });

    const portfolio = buildPlanPortfolio({
      input,
      tacticalPlans: [bankPlan],
      candidates: [candidate],
      futureFundingProjections: [
        {
          projectionId: "broker-cashout-next-turn",
          netLiquidCreditGain: 3,
          clickCost: 1,
          earliestOwnTurnOffset: 1,
          reliability: "contingent",
          requiredCurrentActionId: "broker-load",
        },
      ],
    });
    const entry = portfolio.backgrounds[0]!;
    const fundingStep = planPortfolioFundingStep(entry, [candidate]);
    const contribution = buildPlanPortfolioActionContributions(portfolio).find(
      (item) =>
        item.actionId === "broker-load" && item.contributionKind === "fund",
    );

    expect(entry.selectedFundingRoute?.status).toBe("covered_contingent");
    expect(entry.fundingCoverageResolvesHardBlocker).toBe(false);
    expect(fundingStep).toMatchObject({
      kind: "build_bank_counter",
      actionCandidateIds: ["broker-load"],
    });
    expect(contribution?.evidence).toContain(
      "plan_contribution_funding_not_immediate_economy_bonus:true",
    );
  });

  it("invalidates a remembered funding source and replans when the action disappears", () => {
    const firstInput = decisionInput("corp", 92);
    firstInput.playerView.own.credits = 0;
    firstInput.legalActions = [legalAction("corp", "bbs-credit")];
    const scorePlan = plan(
      "corp.create_score_window",
      950,
      "server",
      "remote_1",
      92,
    );
    scorePlan.creditDemands = [
      createCorpCreditDemand({
        demandId: "corp:bbs-demand",
        sourcePlanId: scorePlan.planId,
        purpose: "current_score_window",
        priority: "current_foreground_plan",
        hardness: "hard",
        deadline: "end_of_current_turn",
        currentCredits: 0,
        targetCredits: 2,
      }),
    ];
    const first = buildPlanPortfolio({
      input: firstInput,
      tacticalPlans: [scorePlan],
      candidates: [economyCandidate("bbs-credit")],
    });
    const nextInput = decisionInput("corp", 93);
    nextInput.playerView.own.credits = 0;
    const replanned = buildPlanPortfolio({
      input: nextInput,
      tacticalPlans: [scorePlan],
      previous: first,
      candidates: [],
    });

    expect(first.foreground?.selectedFundingRoute?.status).toBe(
      "covered_guaranteed",
    );
    expect(first.foreground?.fundingCoverageResolvesHardBlocker).toBe(true);
    expect(replanned.foreground?.selectedFundingRoute?.status).toBe(
      "uncovered",
    );
    expect(replanned.foreground?.evidence).toContain(
      "route_invalidated:bbs-credit",
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

function legalAction(side: Side, actionId: string): LegalAction {
  return {
    actionId,
    side,
    type: "activated_card_ability",
    label: actionId,
    source: actionId,
    timingPoint: side === "corp" ? "corp_action.main" : "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 100,
  };
}

function economyCandidate(
  actionId: string,
  overrides: Partial<
    NonNullable<ActionSemanticCandidate["economyProjection"]>
  > = {},
): ActionSemanticCandidate {
  return {
    actionId,
    actionType: "activated_card_ability",
    actorSide: actionId.startsWith("broker") ? "runner" : "corp",
    economyProjection: {
      schemaVersion: "action-economy-projection-v1",
      kind: "immediate_liquid",
      timing: "immediate",
      creditRestriction: "general",
      clickCost: 1,
      creditCost: 0,
      grossLiquidCreditGain: 2,
      netLiquidCreditGain: 2,
      cardsDrawn: 0,
      cardsConsumed: 0,
      netHandDelta: 0,
      repeatable: false,
      reliability: "guaranteed",
      source: "legal_action_payload",
      confidence: "high",
      evidence: [],
      ...overrides,
    },
  } as ActionSemanticCandidate;
}
