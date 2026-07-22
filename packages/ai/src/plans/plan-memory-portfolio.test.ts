import type { AiDecisionInput, LegalAction, Side } from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createTacticalPlanMemorySnapshot,
  getPlanContinuityMemorySnapshot,
  rememberTacticalPlanRuntime,
  resetTacticalPlanMemory,
} from "./plan-memory";
import {
  buildPlanPortfolio,
  type PlanPortfolioSnapshot,
} from "./plan-portfolio";
import { getPlanPortfolioMemorySnapshot } from "./plan-portfolio-memory";
import { createPlanStep, createTacticalPlan } from "./tactical-plan-builders";
import { createRunnerCreditDemand } from "./credit-demand";
import type { FundingRoute } from "./funding-route";
import { createRunnerActionDemand } from "./action-demand";
import type { ActionCapacityRoute } from "./action-capacity-route";

describe("tactical plan memory with portfolio continuity", () => {
  beforeEach(() => resetTacticalPlanMemory());

  it("keeps Broker bank continuity across an intervening foreground run", () => {
    const initialInput = input(10);
    const bankPlan = tacticalPlan(
      "runner.build_credit_bank",
      "bank",
      "build_bank_counter",
      "broker-load",
      10,
    );
    const initialPortfolio = buildPlanPortfolio({
      input: initialInput,
      tacticalPlans: [bankPlan],
      turnKey: "runner:turn:3",
    });
    // The portfolio is assembled before the selected step is mapped. Cadence
    // must still advance from the mapped selected step remembered below.
    initialPortfolio.backgrounds[0]!.actionCandidateIds = [];
    rememberSelectedPlan(
      initialInput,
      bankPlan,
      initialPortfolio,
      legalAction("broker-load", "trigger_ability"),
    );

    const runInput = input(11);
    const rememberedBank = getPlanPortfolioMemorySnapshot(runInput);
    const runPlan = tacticalPlan(
      "runner.contest_remote",
      "remote_1",
      "run_target",
      "run-remote",
      11,
    );
    const runPortfolio = buildPlanPortfolio({
      input: runInput,
      ...(rememberedBank ? { previous: rememberedBank } : {}),
      tacticalPlans: [runPlan],
      turnKey: "runner:turn:3",
    });
    rememberSelectedPlan(
      runInput,
      runPlan,
      runPortfolio,
      legalAction("run-remote", "start_run"),
    );

    expect(getPlanContinuityMemorySnapshot(input(12))).toMatchObject({
      type: "runner.build_credit_bank",
      portfolioRole: "background",
      portfolioLifecycle: "dormant",
      actionsUsedThisTurn: 1,
      turnKey: "runner:turn:3",
    });

    const resumeInput = input(12);
    const rememberedAfterRun = getPlanPortfolioMemorySnapshot(resumeInput);
    const resumedPortfolio = buildPlanPortfolio({
      input: resumeInput,
      ...(rememberedAfterRun ? { previous: rememberedAfterRun } : {}),
      tacticalPlans: [
        tacticalPlan(
          "runner.build_credit_bank",
          "bank",
          "build_bank_counter",
          "broker-load-next-turn",
          12,
        ),
      ],
      turnKey: "runner:turn:4",
    });

    expect(resumedPortfolio.backgrounds[0]).toMatchObject({
      planType: "runner.build_credit_bank",
      lifecycle: "active",
      cadence: { actionsUsedThisTurn: 0, turnKey: "runner:turn:4" },
    });
  });

  it("stores the selected credit demand and funding-route status in plan memory", () => {
    const decisionInput = input(20);
    const selectedAction = legalAction("basic-credit", "trigger_ability");
    const demand = createRunnerCreditDemand({
      demandId: "runner:memory-demand",
      sourcePlanId: "runner.build_credit_base:credit-base",
      purpose: "foreground_plan",
      priority: "current_foreground_plan",
      hardness: "hard",
      deadline: "end_of_current_turn",
      currentCredits: 1,
      targetCredits: 2,
    });
    const plan = tacticalPlan(
      "runner.contest_remote",
      "credit-base",
      "run_target",
      "basic-credit",
      20,
    );
    plan.creditDemands = [demand];
    const route: FundingRoute = {
      schemaVersion: "funding-route-v1",
      routeId: "runner:memory-demand:basic-credit",
      demandId: demand.demandId,
      status: "covered_guaranteed",
      reliability: "guaranteed",
      horizon: "same_turn",
      startingCredits: 1,
      targetCredits: 2,
      projectedCredits: 2,
      projectedGeneralCredits: 2,
      projectedGap: 0,
      totalClickCost: 1,
      steps: [],
      invalidationReasons: [],
      evidence: ["memory-test"],
    };

    const snapshot = createTacticalPlanMemorySnapshot({
      input: decisionInput,
      plan,
      step: plan.currentStep,
      selectedAction,
      selectedFundingRoute: route,
    });

    expect(snapshot.creditDemands?.[0]).toMatchObject({
      demandId: "runner:memory-demand",
      priority: "current_foreground_plan",
    });
    expect(snapshot.selectedFundingRoute).toMatchObject({
      routeId: "runner:memory-demand:basic-credit",
      status: "covered_guaranteed",
    });
  });

  it("stores the selected action demand and action-capacity route in plan memory", () => {
    const decisionInput = input(21);
    const selectedAction = legalAction("overtime", "trigger_ability");
    const plan = tacticalPlan(
      "runner.contest_remote",
      "remote_1",
      "run_target",
      "overtime",
      21,
    );
    const demand = createRunnerActionDemand({
      demandId: "runner:memory-actions",
      sourcePlanId: plan.planId,
      purpose: "current_run",
      priority: "acute_hard_plan_blocker",
      hardness: "hard",
      deadline: "before_current_plan_action",
      currentActions: 1,
      targetActions: 2,
      acceptedRestrictions: ["unrestricted", "run_only"],
      requiredActionTypes: ["start_run"],
    });
    plan.actionDemands = [demand];
    const route: ActionCapacityRoute = {
      schemaVersion: "action-capacity-route-v1",
      routeId: "runner:memory-actions:overtime",
      demandId: demand.demandId,
      status: "covered_guaranteed",
      reliability: "guaranteed",
      horizon: "same_turn",
      startingActions: 1,
      targetActions: 2,
      projectedCompatibleActions: 2,
      projectedActionPool: 2,
      projectedGap: 0,
      restrictionsUsed: ["unrestricted"],
      totalPreExistingActionCost: 1,
      totalCreditCost: 0,
      totalCardsConsumed: 1,
      totalSourceCountersConsumed: 0,
      steps: [],
      invalidationReasons: [],
      evidence: ["memory-test"],
    };

    const snapshot = createTacticalPlanMemorySnapshot({
      input: decisionInput,
      plan,
      step: plan.currentStep,
      selectedAction,
      selectedActionCapacityRoute: route,
    });

    expect(snapshot.actionDemands?.[0]).toMatchObject({
      demandId: "runner:memory-actions",
      targetActions: 2,
    });
    expect(snapshot.selectedActionCapacityRoute).toMatchObject({
      routeId: "runner:memory-actions:overtime",
      status: "covered_guaranteed",
    });
  });
});

function rememberSelectedPlan(
  decisionInput: AiDecisionInput,
  plan: ReturnType<typeof tacticalPlan>,
  planPortfolio: PlanPortfolioSnapshot,
  selectedAction: LegalAction,
): void {
  rememberTacticalPlanRuntime(
    decisionInput,
    {
      planPortfolio,
      planPortfolioUsed: [],
      planAlternatives: [plan],
      blockedPlans: [],
      selectedPlan: plan,
      selectedStep: plan.currentStep,
    },
    selectedAction,
  );
}

function tacticalPlan(
  type: "runner.build_credit_bank" | "runner.contest_remote",
  targetId: string,
  stepKind: "build_bank_counter" | "run_target",
  actionId: string,
  stateVersion: number,
) {
  return createTacticalPlan({
    planId: `${type}:${targetId}`,
    side: "runner",
    type,
    status: "active",
    priority: type === "runner.contest_remote" ? 900 : 800,
    horizonTurns: 2,
    target: {
      kind: type === "runner.contest_remote" ? "server" : "bank",
      id: targetId,
    },
    currentStep: createPlanStep({
      stepId: `${stepKind}:${targetId}`,
      kind: stepKind,
      desiredActionSemantics: ["test"],
      actionCandidateIds: [actionId],
      rationale: ["test"],
    }),
    stateVersion,
  });
}

function legalAction(
  actionId: string,
  type: "trigger_ability" | "start_run",
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: type === "start_run" ? "basic_action" : "broker",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 100,
  };
}

function input(stateVersion: number): AiDecisionInput {
  const side: Side = "runner";
  return {
    side,
    playerView: {
      side,
      stateVersion,
      timingPoint: "runner_action.main",
      activeSide: side,
      phase: "runner_action_phase",
      own: {
        identity: { instanceId: "runner-id", known: true },
        credits: 8,
        clicks: 4,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 40,
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: { instanceId: "corp-id", known: true },
        credits: 5,
        clicks: 3,
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
    decisionId: "match-portfolio:decision",
    actionNumber: stateVersion,
    profileId: "current_candidate",
  };
}
