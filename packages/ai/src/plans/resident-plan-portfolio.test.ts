import { describe, expect, it } from "vitest";
import type { PlanProposal } from "./plan-kernel-types";
import {
  applyPlanOutcomeReceipt,
  reconcileResidentPlanPortfolio,
  type ResidentPlanPortfolio,
} from "./resident-plan-portfolio";

describe("resident plan portfolio", () => {
  it("keeps all relevant backgrounds without a business cap", () => {
    const proposals = Array.from({ length: 7 }, (_, index) =>
      proposal(`runner.development_${index}`, `card-${index}`),
    );
    const portfolio = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 10,
      timingPoint: "runner_action.main",
      proposals,
      selectedExecutorInstanceId:
        "plan:runner.development_0:card-0",
    });

    expect(portfolio.instances).toHaveLength(7);
    expect(
      portfolio.instances.filter(
        (instance) => instance.portfolioRole === "background",
      ),
    ).toHaveLength(6);
    expect(
      portfolio.instances.filter(
        (instance) => instance.executionState === "executor",
      ),
    ).toHaveLength(1);
  });

  it("retains and resumes a preempted plan without recreating it", () => {
    const economy = proposal("runner.economy", "general");
    const defense = proposal("runner.defense", "damage", {
      executionClass: "urgent_response",
    });
    const first = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 20,
      timingPoint: "runner_action.main",
      proposals: [economy, defense],
      selectedExecutorInstanceId: "plan:runner.economy:general",
    });
    const preempted = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 21,
      timingPoint: "runner_action.main",
      proposals: [economy, defense],
      previous: first,
      selectedExecutorInstanceId: "plan:runner.defense:damage",
      selectionReason: "preempted_by_higher_class",
    });
    const resumed = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 22,
      timingPoint: "runner_action.main",
      proposals: [economy, defense],
      previous: preempted,
      selectedExecutorInstanceId: "plan:runner.economy:general",
    });

    expect(
      preempted.instances.find(
        (instance) => instance.instanceId === "plan:runner.economy:general",
      ),
    ).toMatchObject({
      createdAtStateVersion: 20,
      executionState: "preempted",
    });
    expect(
      resumed.instances.find(
        (instance) => instance.instanceId === "plan:runner.economy:general",
      ),
    ).toMatchObject({
      createdAtStateVersion: 20,
      executionState: "executor",
    });
    expect(resumed.transitions.map((event) => event.reason)).toContain(
      "resumed_after_preemption",
    );
  });

  it("does not ping-pong or recreate the executor in an unchanged plan set", () => {
    const plan = proposal("corp.economy", "general", { side: "corp" });
    const first = reconcileResidentPlanPortfolio({
      side: "corp",
      stateVersion: 30,
      timingPoint: "corp_action.main",
      proposals: [plan],
      selectedExecutorInstanceId: "plan:corp.economy:general",
    });
    const second = reconcileResidentPlanPortfolio({
      side: "corp",
      stateVersion: 30,
      timingPoint: "corp_action.main",
      proposals: [plan],
      previous: first,
      selectedExecutorInstanceId: "plan:corp.economy:general",
    });

    expect(second.executorInstanceId).toBe(first.executorInstanceId);
    expect(second.instances[0]?.createdAtStateVersion).toBe(30);
    expect(
      second.transitions.filter((event) =>
        event.reason.startsWith("preempted"),
      ),
    ).toHaveLength(0);
  });

  it("expires stale plans by their module retention contract", () => {
    const plan = proposal("runner.development", "card", {
      dormantStateVersionTtl: 2,
    });
    const initial = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 40,
      timingPoint: "runner_action.main",
      proposals: [plan],
    });
    const retained = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 42,
      timingPoint: "runner_action.main",
      proposals: [],
      previous: initial,
    });
    const expired = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 43,
      timingPoint: "runner_action.main",
      proposals: [],
      previous: retained,
    });

    expect(retained.instances).toHaveLength(1);
    expect(expired.instances).toHaveLength(0);
    expect(expired.transitions.at(-1)?.reason).toBe("stale_ttl_expired");
  });

  it("records progress only from a semantic outcome receipt", () => {
    const plan = proposal("runner.economy", "general");
    const initial = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 50,
      timingPoint: "runner_action.main",
      proposals: [plan],
      selectedExecutorInstanceId: "plan:runner.economy:general",
    });
    const progressed = applyPlanOutcomeReceipt(
      initial,
      {
        planInstanceId: "plan:runner.economy:general",
        stateVersionBefore: 50,
        stateVersionAfter: 51,
        progress: "progress",
        progressValue: 0.5,
        milestoneAfter: "reserve_half_funded",
        reasonCode: "liquid_credits_observed",
      },
      "runner_action.main",
    );

    expect(progressed.instances[0]).toMatchObject({
      lastProductiveAtStateVersion: 51,
      milestone: "reserve_half_funded",
      progress: {
        status: "progress",
        reasonCode: "liquid_credits_observed",
      },
    });
    expect(JSON.stringify(progressed.instances[0])).not.toContain("actionId");
  });

  it("moves completed instances into bounded completion history", () => {
    const plan = proposal("corp.score", "remote-1", {
      side: "corp",
      completedHistoryStateVersionTtl: 3,
    });
    const initial = reconcileResidentPlanPortfolio({
      side: "corp",
      stateVersion: 60,
      timingPoint: "corp_action.main",
      proposals: [plan],
      selectedExecutorInstanceId: "plan:corp.score:remote-1",
    });
    const completed = applyPlanOutcomeReceipt(
      initial,
      {
        planInstanceId: "plan:corp.score:remote-1",
        stateVersionBefore: 60,
        stateVersionAfter: 61,
        progress: "completed",
        progressValue: 1,
        milestoneAfter: "agenda_scored",
        reasonCode: "score_outcome_observed",
      },
      "corp_action.main",
    );

    expect(completed.instances).toHaveLength(0);
    expect(completed.completionHistory).toEqual([
      expect.objectContaining({
        instanceId: "plan:corp.score:remote-1",
        terminalViability: "completed",
        retainUntilStateVersion: 64,
      }),
    ]);
  });

  it("rejects a parent as executor while its support child is resident", () => {
    const parent = proposal("runner.pressure", "rd");
    const child = proposal("runner.economy", "fund-rd", {
      parentInstanceId: "plan:runner.pressure:rd",
    });

    expect(() =>
      reconcileResidentPlanPortfolio({
        side: "runner",
        stateVersion: 70,
        timingPoint: "runner_action.main",
        proposals: [parent, child],
        selectedExecutorInstanceId: "plan:runner.pressure:rd",
      }),
    ).toThrow(expect.objectContaining({ code: "executor_invariant_broken" }));
  });

  it("preserves an exact parent need across refresh and clears it when omitted", () => {
    const parent = proposal("runner.pressure", "rd");
    const supportWithNeed = proposal("runner.economy", "fund-rd", {
      parentInstanceId: "plan:runner.pressure:rd",
      parentNeedId: "need:credits:runner-pressure-rd",
    });
    const initial = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 75,
      timingPoint: "runner_action.main",
      proposals: [parent, supportWithNeed],
    });
    const initialSupport = initial.instances.find(
      (instance) => instance.instanceId === "plan:runner.economy:fund-rd",
    );

    expect(initialSupport).toMatchObject({
      parentInstanceId: "plan:runner.pressure:rd",
      parentNeedId: "need:credits:runner-pressure-rd",
    });

    const persisted = JSON.parse(
      JSON.stringify(initial),
    ) as ResidentPlanPortfolio;
    const refreshed = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 76,
      timingPoint: "runner_action.main",
      proposals: [parent, supportWithNeed],
      previous: persisted,
    });
    const refreshedSupport = refreshed.instances.find(
      (instance) => instance.instanceId === "plan:runner.economy:fund-rd",
    );

    expect(refreshedSupport).toMatchObject({
      parentInstanceId: "plan:runner.pressure:rd",
      parentNeedId: "need:credits:runner-pressure-rd",
      createdAtStateVersion: 75,
      updatedAtStateVersion: 76,
    });

    const cleared = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 77,
      timingPoint: "runner_action.main",
      proposals: [
        parent,
        proposal("runner.economy", "fund-rd", {
          parentInstanceId: "plan:runner.pressure:rd",
        }),
      ],
      previous: refreshed,
    });
    const clearedSupport = cleared.instances.find(
      (instance) => instance.instanceId === "plan:runner.economy:fund-rd",
    );

    expect(clearedSupport).toMatchObject({
      parentInstanceId: "plan:runner.pressure:rd",
      createdAtStateVersion: 75,
      updatedAtStateVersion: 77,
    });
    expect(clearedSupport).not.toHaveProperty("parentNeedId");
  });

  it("does not accept action-id-shaped outcome receipts", () => {
    const portfolio = reconcileResidentPlanPortfolio({
      side: "runner",
      stateVersion: 80,
      timingPoint: "runner_action.main",
      proposals: [proposal("runner.economy", "general")],
    });

    expect(() =>
      applyPlanOutcomeReceipt(
        portfolio,
        {
          planInstanceId: "plan:runner.economy:general",
          stateVersionBefore: 80,
          stateVersionAfter: 81,
          progress: "progress",
          progressValue: 1,
          milestoneAfter: "bad",
          reasonCode: "bad",
          actionId: "gain-credit",
        } as never,
        "runner_action.main",
      ),
    ).toThrow(expect.objectContaining({ code: "executor_invariant_broken" }));
  });

  it("rejects legacy portfolio snapshots and wrong-side proposals", () => {
    expect(() =>
      reconcileResidentPlanPortfolio({
        side: "runner",
        stateVersion: 90,
        timingPoint: "runner_action.main",
        proposals: [],
        previous: {
          schemaVersion: "plan-portfolio-v1",
          side: "runner",
          stateVersion: 89,
          instances: [],
          completionHistory: [],
          transitions: [],
        } as never,
      }),
    ).toThrow(expect.objectContaining({ code: "invalid_plan_identity" }));

    expect(() =>
      reconcileResidentPlanPortfolio({
        side: "runner",
        stateVersion: 90,
        timingPoint: "runner_action.main",
        proposals: [
          proposal("corp.economy", "wrong-side", { side: "corp" }),
        ],
      }),
    ).toThrow(expect.objectContaining({ code: "invalid_plan_identity" }));
  });
});

function proposal(
  moduleId: PlanProposal["moduleId"],
  dedupeKey: string,
  overrides: {
    side?: PlanProposal["side"];
    executionClass?: PlanProposal["executionClass"];
    parentInstanceId?: string;
    parentNeedId?: string;
    dormantStateVersionTtl?: number;
    completedHistoryStateVersionTtl?: number;
  } = {},
): PlanProposal {
  const side = overrides.side ?? "runner";
  return {
    moduleId,
    moduleVersion: "1",
    dedupeKey,
    side,
    strategyLineIds: [],
    executionClass: overrides.executionClass ?? "development_project",
    initialViability: "ready",
    persistencePolicy: "sticky_goal",
    retentionPolicy: {
      blockedStateVersionTtl: 4,
      dormantStateVersionTtl: overrides.dormantStateVersionTtl ?? 4,
      completedHistoryStateVersionTtl:
        overrides.completedHistoryStateVersionTtl ?? 4,
      abandonWhenTargetMissing: false,
      protectedWhileNeedOpen: true,
      protectedWhileCommitted: true,
    },
    ...(overrides.parentInstanceId
      ? { parentInstanceId: overrides.parentInstanceId }
      : {}),
    ...(overrides.parentNeedId !== undefined
      ? { parentNeedId: overrides.parentNeedId }
      : {}),
    phase: "execute",
    milestone: "start",
    moduleState: {},
    blockers: [],
    resumeConditions: [],
    completionConditions: [],
    abandonmentConditions: [],
    evidenceRefs: [{ code: "test", source: "visible_state" }],
  };
}
