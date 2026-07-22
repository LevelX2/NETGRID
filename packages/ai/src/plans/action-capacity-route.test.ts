import { describe, expect, it } from "vitest";

import type { ActionCapacityProjection } from "../action-semantic-candidate-types";
import {
  actionDemandHardBlockerIsResolved,
  revalidateActionCapacityRoute,
  searchActionCapacityRoutes,
  type ActionCapacityActionCandidate,
} from "./action-capacity-route";
import {
  createCorpActionDemand,
  createRunnerActionDemand,
  type ActionDemandRestriction,
} from "./action-demand";

describe("action capacity routes", () => {
  it("uses Overtime to close a one-action same-turn score gap", () => {
    const demand = scoreDemand(2, 3);
    const result = searchActionCapacityRoutes({
      demand,
      candidates: [candidate("overtime", 2, { listedActionCost: 1 })],
      remainingActions: 2,
    });

    expect(result.bestRoute).toMatchObject({
      status: "covered_guaranteed",
      reliability: "guaranteed",
      horizon: "same_turn",
      projectedCompatibleActions: 3,
      projectedGap: 0,
      totalPreExistingActionCost: 1,
      totalCardsConsumed: 1,
    });
    expect(result.bestRoute.steps.map((step) => step.actionId)).toEqual([
      "overtime",
    ]);
    expect(actionDemandHardBlockerIsResolved(demand, result.bestRoute)).toBe(
      true,
    );
  });

  it("does not spend an action source when Engine actions already suffice", () => {
    const result = searchActionCapacityRoutes({
      demand: scoreDemand(4, 3),
      candidates: [candidate("overtime", 2, { listedActionCost: 1 })],
      remainingActions: 4,
    });

    expect(result.bestRoute).toMatchObject({
      status: "already_sufficient",
      steps: [],
      projectedCompatibleActions: 4,
    });
  });

  it("lets Wilson's self-financed action satisfy exactly one run demand", () => {
    const demand = createRunnerActionDemand({
      demandId: "runner:run",
      purpose: "current_run",
      priority: "acute_hard_plan_blocker",
      hardness: "hard",
      deadline: "before_current_plan_action",
      currentActions: 0,
      targetActions: 1,
      acceptedRestrictions: ["unrestricted", "run_only"],
      requiredActionTypes: ["start_run"],
    });
    const result = searchActionCapacityRoutes({
      demand,
      candidates: [
        candidate("wilson", 1, {
          actionType: "start_run",
          listedActionCost: 1,
          preExistingActionCost: 0,
          restriction: "run_only",
          allowedActionTypes: ["start_run"],
          selfFinancing: true,
          generatedActionsConsumedByCurrentAction: 1,
          followupActionCapacity: 0,
          netCurrentTurnActionDelta: 0,
        }),
      ],
      remainingActions: 0,
    });

    expect(result.bestRoute).toMatchObject({
      status: "covered_guaranteed",
      projectedCompatibleActions: 1,
      projectedActionPool: 0,
    });
    expect(result.bestRoute.steps[0]).toMatchObject({
      demandActionContribution: 1,
      preExistingActionCost: 0,
    });
  });

  it("uses install-only capacity only for a compatible install demand", () => {
    const edgerunner = candidate("edgerunner", 3, {
      listedActionCost: 1,
      restriction: "install_only",
      allowedActionTypes: ["install_card"],
    });
    const installDemand = createCorpActionDemand({
      demandId: "corp:installs",
      purpose: "current_remote_protection",
      priority: "current_foreground_plan",
      hardness: "hard",
      deadline: "end_of_current_turn",
      currentActions: 1,
      targetActions: 3,
      acceptedRestrictions: ["unrestricted", "install_only"],
      requiredActionTypes: ["install_card"],
    });
    const score = scoreDemand(1, 3);

    expect(
      searchActionCapacityRoutes({
        demand: installDemand,
        candidates: [edgerunner],
        remainingActions: 1,
      }).bestRoute.status,
    ).toBe("covered_guaranteed");
    expect(
      searchActionCapacityRoutes({
        demand: score,
        candidates: [edgerunner],
        remainingActions: 1,
      }).bestRoute.status,
    ).toBe("uncovered");
  });

  it("does not double-spend one visible Pacifica counter", () => {
    const demand = scoreDemand(0, 2);
    const candidates = [
      candidate("pacifica-a", 1, {
        actionType: "activated_card_ability",
        sourceCardInstanceId: "pacifica",
        sourceCounterType: "advancement",
        sourceCounterCost: 1,
      }),
      candidate("pacifica-b", 1, {
        actionType: "activated_card_ability",
        sourceCardInstanceId: "pacifica",
        sourceCounterType: "advancement",
        sourceCounterCost: 1,
      }),
    ];

    const result = searchActionCapacityRoutes({
      demand,
      candidates,
      remainingActions: 0,
      visibleSourceCounterAmounts: { "pacifica:advancement": 1 },
    });

    expect(result.bestRoute.status).toBe("uncovered");
  });

  it("requires the activation action before an immediate burst can help", () => {
    const result = searchActionCapacityRoutes({
      demand: scoreDemand(0, 1),
      candidates: [candidate("overtime", 2, { listedActionCost: 1 })],
      remainingActions: 0,
    });

    expect(result.bestRoute.status).toBe("uncovered");
  });

  it("reserves visible credits across a multi-source route", () => {
    const result = searchActionCapacityRoutes({
      demand: scoreDemand(2, 4),
      candidates: [
        candidate("paid-one", 2, { listedActionCost: 1, creditCost: 2 }),
        candidate("paid-two", 2, { listedActionCost: 1, creditCost: 2 }),
      ],
      remainingActions: 2,
      availableCredits: 3,
    });

    expect(result.bestRoute.status).toBe("uncovered");
  });

  it("keeps future capacity contingent and does not resolve a hard blocker", () => {
    const demand = createCorpActionDemand({
      demandId: "corp:next-turn",
      purpose: "next_turn_setup",
      priority: "next_own_turn",
      hardness: "hard",
      deadline: "start_of_next_own_turn",
      currentActions: 0,
      targetActions: 1,
    });
    const future = candidate("corporate-guard", 0, {
      listedActionCost: 1,
      kind: "future_recurring_gain",
      timing: "future_turn_start",
      gainAmountPerTurn: 1,
      durationTurns: 3,
      netCurrentTurnActionDelta: 0,
    });
    const result = searchActionCapacityRoutes({
      demand,
      candidates: [future],
      remainingActions: 3,
      availableCredits: 6,
    });

    expect(result.bestRoute).toMatchObject({
      status: "covered_contingent",
      reliability: "contingent",
      horizon: "next_own_turn",
    });
    expect(actionDemandHardBlockerIsResolved(demand, result.bestRoute)).toBe(
      false,
    );
  });

  it("prefers a larger otherwise identical guaranteed source", () => {
    const result = searchActionCapacityRoutes({
      demand: scoreDemand(1, 2),
      candidates: [candidate("plus-one", 1), candidate("plus-two", 2)],
      remainingActions: 1,
    });

    expect(result.bestRoute.steps[0]?.actionId).toBe("plus-two");
    expect(result.bestRoute.projectedCompatibleActions).toBe(3);
  });

  it("does not prune routes with different restriction profiles as comparable", () => {
    const demand = createCorpActionDemand({
      demandId: "corp:install-choice",
      purpose: "current_remote_protection",
      priority: "current_foreground_plan",
      hardness: "soft",
      deadline: "end_of_current_turn",
      currentActions: 1,
      targetActions: 2,
      acceptedRestrictions: ["unrestricted", "install_only"],
      requiredActionTypes: ["install_card"],
    });
    const result = searchActionCapacityRoutes({
      demand,
      candidates: [
        candidate("unrestricted", 2),
        candidate("install-only", 3, {
          restriction: "install_only",
          allowedActionTypes: ["install_card"],
        }),
      ],
      remainingActions: 1,
    });

    expect(result.routes.map((route) => route.restrictionsUsed)).toEqual(
      expect.arrayContaining([["unrestricted"], ["install_only"]]),
    );
  });

  it("marks self-damage capacity contingent and invalidates stale actions", () => {
    const demand = scoreDemand(1, 2);
    const result = searchActionCapacityRoutes({
      demand,
      candidates: [
        candidate("risky", 1, {
          selfDamage: true,
        }),
      ],
      remainingActions: 1,
    });

    expect(result.bestRoute.status).toBe("covered_contingent");
    expect(actionDemandHardBlockerIsResolved(demand, result.bestRoute)).toBe(
      false,
    );
    expect(
      revalidateActionCapacityRoute(result.bestRoute, new Set()).status,
    ).toBe("invalidated");
  });
});

function scoreDemand(currentActions: number, targetActions: number) {
  return createCorpActionDemand({
    demandId: `corp:score:${currentActions}:${targetActions}`,
    purpose: "current_score_closeout",
    priority: "acute_hard_plan_blocker",
    hardness: "hard",
    deadline: "before_current_plan_action",
    currentActions,
    targetActions,
    acceptedRestrictions: ["unrestricted"],
    requiredActionTypes: ["advance_card", "score_agenda"],
  });
}

function candidate(
  actionId: string,
  gain: number,
  overrides: {
    actionType?: string;
    listedActionCost?: number;
    preExistingActionCost?: number;
    restriction?: ActionDemandRestriction;
    allowedActionTypes?: string[];
    selfFinancing?: boolean;
    generatedActionsConsumedByCurrentAction?: number;
    followupActionCapacity?: number;
    netCurrentTurnActionDelta?: number;
    kind?: ActionCapacityProjection["kind"];
    timing?: ActionCapacityProjection["timing"];
    gainAmountPerTurn?: number;
    durationTurns?: number;
    sourceCardInstanceId?: string;
    sourceCounterType?: string;
    sourceCounterCost?: number;
    selfDamage?: boolean;
    creditCost?: number;
  } = {},
): ActionCapacityActionCandidate {
  const listedActionCost = overrides.listedActionCost ?? 0;
  const generatedConsumed =
    overrides.generatedActionsConsumedByCurrentAction ?? 0;
  const followup =
    overrides.followupActionCapacity ?? Math.max(0, gain - generatedConsumed);
  const projection: ActionCapacityProjection = {
    schemaVersion: "action-capacity-projection-v1",
    kind:
      overrides.kind ??
      (overrides.restriction && overrides.restriction !== "unrestricted"
        ? "immediate_restricted_gain"
        : "immediate_unrestricted_gain"),
    timing: overrides.timing ?? "immediate",
    restriction: overrides.restriction ?? "unrestricted",
    allowedActionTypes: overrides.allowedActionTypes ?? [],
    listedActionCost,
    preExistingActionCost: overrides.preExistingActionCost ?? listedActionCost,
    grossActionsGained: gain,
    generatedActionsConsumedByCurrentAction: generatedConsumed,
    followupActionCapacity: followup,
    netCurrentTurnActionDelta:
      overrides.netCurrentTurnActionDelta ?? gain - listedActionCost,
    actionDebt: 0,
    ...(overrides.gainAmountPerTurn !== undefined
      ? { gainAmountPerTurn: overrides.gainAmountPerTurn }
      : {}),
    ...(overrides.durationTurns !== undefined
      ? { durationTurns: overrides.durationTurns }
      : {}),
    selfFinancing: overrides.selfFinancing ?? false,
    repeatable: "unknown",
    reliability: "guaranteed",
    ...(overrides.sourceCounterType
      ? { sourceCounterType: overrides.sourceCounterType }
      : {}),
    ...(overrides.sourceCounterCost !== undefined
      ? { sourceCounterCost: overrides.sourceCounterCost }
      : {}),
    source: "legal_action_payload",
    confidence: "high",
    evidence: [`test:${actionId}`],
  };
  return {
    actionId,
    actionType: overrides.actionType ?? "play_operation",
    ...(overrides.sourceCardInstanceId
      ? { sourceCardInstanceId: overrides.sourceCardInstanceId }
      : {}),
    sourceDefinitionId: actionId,
    costProfile: {
      clickCost: listedActionCost,
      creditCost: overrides.creditCost ?? 0,
      ...(overrides.selfDamage
        ? { selfDamage: [{ type: "core", amount: 1 }] }
        : {}),
      paidBy: "corp",
      beneficiary: "corp",
      costKnownStatus: "known",
      additionalCosts: [],
    },
    actionCapacityProjection: projection,
  };
}
