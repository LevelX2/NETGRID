import type { AiDecisionInput, LegalAction, Side } from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";
import {
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
