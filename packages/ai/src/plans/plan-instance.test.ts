import { describe, expect, it } from "vitest";
import { PlanResolutionFailure } from "./plan-resolution-failure";
import {
  assertValidPlanInstance,
  deduplicatePlanProposals,
  instantiatePlanProposal,
  planInstanceIdForProposal,
  planInstanceStateIssues,
} from "./plan-instance";
import type { PlanInstance, PlanProposal } from "./plan-kernel-types";

describe("plan instance identity and orthogonal states", () => {
  it("instantiates a proposal without persisted priority or active lifecycle", () => {
    const proposal = readyRunnerProposal();
    const instance = instantiatePlanProposal(proposal, 12);

    expect(instance).toMatchObject({
      instanceId: "p3y8akwutpkfukc2ikuk2ue9vw",
      dedupeKey: "neutral_credit",
      moduleId: "runner.economy",
      moduleVersion: "1",
      side: "runner",
      viability: "ready",
      portfolioRole: "unassigned",
      executionState: "idle",
      createdAtStateVersion: 12,
      updatedAtStateVersion: 12,
    });
    expect(instance).not.toHaveProperty("priority");
    expect(instance.evidenceRefs).toEqual([
      { code: "credits_below_floor", source: "visible_state" },
    ]);
  });

  it("rejects invalid Engine state versions and retention bounds", () => {
    const proposal = readyRunnerProposal();
    expect(() => instantiatePlanProposal(proposal, 12.9)).toThrowError(
      expect.objectContaining({
        code: "invalid_plan_identity",
        context: expect.objectContaining({
          removalCondition: expect.stringContaining(
            "invalid_state_version_order",
          ),
        }),
      }),
    );
    expect(() =>
      instantiatePlanProposal(
        {
          ...proposal,
          retentionPolicy: {
            ...proposal.retentionPolicy,
            blockedStateVersionTtl: Number.NaN,
          },
        },
        12,
      ),
    ).toThrowError(
      expect.objectContaining({
        code: "invalid_plan_identity",
        context: expect.objectContaining({
          removalCondition: expect.stringContaining("invalid_retention_policy"),
        }),
      }),
    );
  });

  it("rejects duplicate proposals instead of silently recreating a plan", () => {
    const proposal = readyRunnerProposal();

    expect(() =>
      deduplicatePlanProposals([proposal, { ...proposal }], 13),
    ).toThrowError(
      expect.objectContaining({
        name: "PlanResolutionFailure",
        code: "invalid_plan_identity",
      }),
    );
  });

  it("rejects a blocked executor and reports every state-axis issue", () => {
    const instance = instantiatePlanProposal(readyRunnerProposal(), 4);
    const invalid: PlanInstance = {
      ...instance,
      viability: "blocked",
      portfolioRole: "foreground",
      executionState: "executor",
      blockers: [],
    };

    expect(planInstanceStateIssues(invalid)).toEqual([
      "non_ready_executor",
      "blocked_plan_without_blocker",
    ]);
    expect(() => assertValidPlanInstance(invalid)).toThrow(
      PlanResolutionFailure,
    );
  });

  it("keeps technical identity stable for the same module and dedupe key", () => {
    const proposal = readyRunnerProposal();
    const changedPhase: PlanProposal = { ...proposal, phase: "other" };
    expect(planInstanceIdForProposal(proposal)).toBe(
      planInstanceIdForProposal(changedPhase),
    );
  });

  it("rejects a restored identity bound to another objective", () => {
    const first = instantiatePlanProposal(readyRunnerProposal(), 12);
    const second = instantiatePlanProposal(
      {
        ...readyRunnerProposal(),
        dedupeKey: "different-credit-objective",
      },
      12,
    );
    expect(() =>
      assertValidPlanInstance({ ...first, instanceId: second.instanceId }),
    ).toThrowError(expect.objectContaining({ code: "invalid_plan_identity" }));
    expect(() =>
      assertValidPlanInstance(JSON.parse(JSON.stringify(first))),
    ).not.toThrow();
  });

  it("reports a missing persisted dedupe key as a structured identity failure", () => {
    const malformed = { ...instantiatePlanProposal(readyRunnerProposal(), 12) };
    Reflect.deleteProperty(malformed, "dedupeKey");
    expect(() => assertValidPlanInstance(malformed)).toThrowError(
      expect.objectContaining({ code: "invalid_plan_identity" }),
    );
  });

  it("rejects a partial lifecycle instead of accepting a canonical reference alone", () => {
    const malformed = { ...instantiatePlanProposal(readyRunnerProposal(), 12) };
    Reflect.deleteProperty(malformed, "progress");
    expect(() => assertValidPlanInstance(malformed)).toThrowError(
      expect.objectContaining({ code: "invalid_plan_identity" }),
    );
  });

  it("persists an exact parent need edge and rejects an orphan need edge", () => {
    const parentInstanceId = "pa1d7j8c33k25iup8n8nyo9r2g";
    const proposal: PlanProposal = {
      ...readyRunnerProposal(),
      parentInstanceId,
      parentNeedId: "score-funding",
    };

    expect(instantiatePlanProposal(proposal, 7)).toMatchObject({
      parentInstanceId,
      parentNeedId: "score-funding",
    });

    expect(() =>
      instantiatePlanProposal(
        {
          ...readyRunnerProposal(),
          parentNeedId: "score-funding",
        },
        7,
      ),
    ).toThrowError(
      expect.objectContaining({
        name: "PlanResolutionFailure",
        code: "invalid_plan_identity",
      }),
    );
  });
});

function readyRunnerProposal(): PlanProposal {
  return {
    moduleId: "runner.economy",
    moduleVersion: "1",
    dedupeKey: " neutral credit ",
    side: "runner",
    strategyLineIds: [],
    executionClass: "bounded_sequence",
    initialViability: "ready",
    persistencePolicy: "flexible_support",
    retentionPolicy: {
      blockedStateVersionTtl: 8,
      dormantStateVersionTtl: 4,
      completedHistoryStateVersionTtl: 2,
      abandonWhenTargetMissing: true,
      protectedWhileNeedOpen: true,
      protectedWhileCommitted: true,
    },
    target: { kind: "capability", id: "credits" },
    phase: "restore_liquid_floor",
    milestone: "liquid_floor",
    moduleState: {},
    blockers: [],
    resumeConditions: [],
    completionConditions: [{ code: "credit_floor_reached" }],
    abandonmentConditions: [],
    evidenceRefs: [
      { code: "credits_below_floor", source: "visible_state" },
      { code: "credits_below_floor", source: "visible_state" },
    ],
  };
}
