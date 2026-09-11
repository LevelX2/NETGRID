import { playerView } from "../../semantic-ai-runtime-cutover.test-support";
import { describe, expect, it } from "vitest";
import { instantiatePlanProposal } from "../../plans/plan-instance";
import type { PlanSchedulerContext } from "../../plans/plan-scheduler";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { runnerResourceLifecycleFundingNeeds } from "./resource-lifecycle-funding-needs";
import { createRunnerResourceLifecycleModule } from "./resource-lifecycle-plan-module";
import type { RunnerResourceLifecycleSignal } from "./resource-lifecycle-types";

function signal(source: string): RunnerResourceLifecycleSignal {
  return {
    lifecycleId: `loan:${source}`,
    sourceCardInstanceId: source,
    definitionId: "onr_v1_168_loan-from-chiba",
    phase: "retain",
    actionIds: [],
    supportNeedId: `resource-lifecycle-support:${source}`,
    marginalValue: 10,
    leavePlayPaymentAmount: 10,
    fundingGap: 1,
    fundingRouteActionIds: ["gain-credit"],
    fundingRouteAssessment: {
      stateVersion: 10,
      routeId: `route:${source}`,
      status: "covered_guaranteed",
      reliability: "guaranteed",
      horizon: "same_turn",
      projectedGap: 0,
      totalClickCost: 1,
      firstStepActionId: "gain-credit",
      evidenceCodes: ["exact_payment_route"],
    },
    priorityClass: "P5",
    value: 10,
    evidenceCodes: ["runner_resource_waiting_for_exact_funding_support"],
  };
}

function setup(signals: RunnerResourceLifecycleSignal[]) {
  const fundingNeeds = runnerResourceLifecycleFundingNeeds(signals, 9, 10);
  const context: PlanSchedulerContext = {
    input: {
      side: "runner",
      legalActions: [],
      playerView: { ...playerView("runner", []), stateVersion: 10 },
      eventTail: [],
      difficulty: "normal",
      seed: "resource-lifecycle-funding-test",
      decisionId: "resource-lifecycle-funding-test",
      actionNumber: 1,
      profileId: "resource-lifecycle-funding-test",
    },
    actionCandidates: [],
    turnKey: "runner:1",
    domain: { resourceLifecycle: signals, fundingNeeds },
  };
  const module = createRunnerResourceLifecycleModule();
  const instances = module
    .discover(context)
    .map((p) => instantiatePlanProposal(p, 10));
  const portfolio: ResidentPlanPortfolio = {
    schemaVersion: "resident-plan-portfolio-v2",
    side: "runner",
    stateVersion: 10,
    instances,
    completionHistory: [],
    transitions: [],
  };
  return {
    fundingNeeds,
    assess: () => instances.map((p) => module.assess(p, context, portfolio)),
  };
}

describe("resource lifecycle funding boundary", () => {
  it("keeps two resources independently bound through need projection and assessment", () => {
    const { fundingNeeds, assess } = setup([
      signal("loan-1"),
      signal("loan-2"),
    ]);
    expect(
      fundingNeeds.map(
        (need) =>
          need.kind === "parent_plan_support" && need.parentPlanInstanceId,
      ),
    ).toEqual([
      "plan:runner.resource_lifecycle:loan%3Aloan-1",
      "plan:runner.resource_lifecycle:loan%3Aloan-2",
    ]);
    expect(assess().map((a) => a.resourceGaps.map((g) => g.needId))).toEqual([
      ["resource-lifecycle-support:loan-1"],
      ["resource-lifecycle-support:loan-2"],
    ]);
  });

  it("rejects a funding need attached to another parent", () => {
    const { fundingNeeds, assess } = setup([signal("loan-1")]);
    const need = fundingNeeds[0]!;
    if (need.kind !== "parent_plan_support")
      throw new Error("expected parent support");
    need.parentPlanInstanceId = "plan:runner.resource_lifecycle:loan%3Aloan-2";
    expect(assess()[0]!.resourceGaps).toEqual([]);
  });

  it("rejects a route quoted for an older state", () => {
    const source = signal("loan-1");
    source.fundingRouteAssessment!.stateVersion = 9;
    expect(setup([source]).assess()[0]!.resourceGaps).toEqual([]);
  });

  it("does not create a financing child without an executable route head", () => {
    const source = signal("loan-1");
    source.fundingRouteActionIds = [];
    expect(runnerResourceLifecycleFundingNeeds([source], 9, 10)).toEqual([]);
  });
});
