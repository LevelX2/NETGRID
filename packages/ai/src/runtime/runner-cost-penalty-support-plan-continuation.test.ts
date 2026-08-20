import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { PlanSchedulerResult } from "../plans/plan-scheduler";
import type { ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import {
  reconcileSelectedRunnerCostPenaltySupportOrigin,
  resolvePlanBoundRunnerCostPenaltyContinuation,
} from "./plan-first-live-runtime";

describe("Runner cost/penalty support plan continuation", () => {
  it("preserves the original plan origin across a payment-support action", () => {
    const originalAction = paymentAction(90);
    const originalResult = planResult(90, originalAction.actionId, "rig-root");
    reconcileSelectedRunnerCostPenaltySupportOrigin(
      input(90, [originalAction], true),
      originalResult,
      undefined,
    );
    const originalPortfolio = originalResult.portfolio;
    expect(originalPortfolio.pendingRunnerCostPenaltySupportOrigin).toEqual({
      rootPlanInstanceId: "plan:runner.rig_and_coverage:rig-root",
      executorInstanceId: "plan:runner.rig_and_coverage:rig-root",
      sourceStepId: "plan:runner.rig_and_coverage:rig-root:find",
      originalActionId: originalAction.actionId,
      selectedAtStateVersion: 90,
    });

    const continuation = continuedPaymentAction(91, originalAction.actionId);
    const support = supportAction(91, originalAction.actionId);
    const supportResult = planResult(91, support.actionId, "economy-root");
    reconcileSelectedRunnerCostPenaltySupportOrigin(
      input(91, [continuation, support]),
      supportResult,
      originalPortfolio,
    );
    expect(supportResult.portfolio.pendingRunnerCostPenaltySupportOrigin).toEqual({
      ...originalPortfolio.pendingRunnerCostPenaltySupportOrigin,
      windowId: "runner_cost_penalty_support.91",
    });

    const finalContinuation = continuedPaymentAction(
      92,
      originalAction.actionId,
    );
    const resolution = resolvePlanBoundRunnerCostPenaltyContinuation(
      {
        input: input(92, [finalContinuation]),
        actionCandidates: [],
        turnKey: "runner:turn:14",
      },
      supportResult.portfolio,
    );
    expect(resolution).toEqual({
      actionId: originalAction.actionId,
      reasonCode: "plan_bound_runner_cost_penalty_support_continuation",
      origin: {
        rootPlanInstanceId: "plan:runner.rig_and_coverage:rig-root",
        leafPlanInstanceId: "plan:runner.rig_and_coverage:rig-root",
        side: "runner",
        windowKind: "optional_ability",
        windowId: "runner_cost_penalty_support.91",
        stateVersion: 92,
        timingPoint: "runner_action.main",
      },
    });
  });

  it("fails closed when the Engine continuation does not match the bound action", () => {
    const continuation = continuedPaymentAction(92, "runner.play.other");
    const previous = portfolio(91, "economy-root");
    previous.pendingRunnerCostPenaltySupportOrigin = {
      rootPlanInstanceId: "plan:runner.rig_and_coverage:rig-root",
      executorInstanceId: "plan:runner.rig_and_coverage:rig-root",
      sourceStepId: "plan:runner.rig_and_coverage:rig-root:find",
      originalActionId: "runner.play.original",
      selectedAtStateVersion: 90,
      windowId: "runner_cost_penalty_support.91",
    };

    expect(() =>
      resolvePlanBoundRunnerCostPenaltyContinuation(
        {
          input: input(92, [continuation]),
          actionCandidates: [],
          turnKey: "runner:turn:14",
        },
        previous,
      ),
    ).toThrow(expect.objectContaining({ code: "window_origin_missing" }));
  });
});

function input(
  stateVersion: number,
  legalActions: LegalAction[],
  withPaymentSupport = false,
): AiDecisionInput {
  return {
    side: "runner",
    difficulty: "hard",
    seed: "payment-support-plan-continuation",
    decisionId: `payment-support:${stateVersion}`,
    actionNumber: stateVersion,
    profileId: "payment-support-test",
    legalActions,
    eventTail: [],
    playerView: {
      stateVersion,
      activeSide: "runner",
      timingPoint: "runner_action.main",
      winner: null,
      own: {
        credits: 11,
        clicks: 2,
        agendaPoints: 2,
        gripOrHq: [],
        heapOrArchives: [],
        scoreArea: [],
        stackOrRdCount: 29,
        rig: withPaymentSupport
          ? [
              {
                instanceId: "swiss-bank",
                known: true,
                type: "resource",
                runnerPaymentSupportAbilities: [
                  {
                    sourceAbilityId: "swiss:gain",
                    capabilityKey: "gain",
                    timing: "runner_cost_penalty_support",
                    label: "Credits nehmen",
                    creditCost: 3,
                    gainCredits: 6,
                    trashesSource: true,
                  },
                ],
              },
            ]
          : [],
      },
      opponent: {
        credits: 9,
        clicks: 0,
        agendaPoints: 0,
        handCount: 4,
        deckCount: 33,
        discardCount: 2,
        scoreArea: [],
      },
      servers: [],
    },
  } as unknown as AiDecisionInput;
}

function paymentAction(stateVersion: number): LegalAction {
  return {
    actionId: "runner.play.original",
    type: "play_event",
    side: "runner",
    source: "event-card",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1, credits: 1 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: stateVersion,
    payload: { cardId: "event-card" },
  } as unknown as LegalAction;
}

function continuedPaymentAction(
  stateVersion: number,
  actionId: string,
): LegalAction {
  return {
    ...paymentAction(stateVersion),
    actionId,
    payload: {
      cardId: "event-card",
      runnerCostPenaltySupportContinuation: true,
      runnerCostPenaltySupportWindowId: "runner_cost_penalty_support.91",
    },
  } as unknown as LegalAction;
}

function supportAction(
  stateVersion: number,
  originalActionId: string,
): LegalAction {
  return {
    actionId: "runner.ability.swiss-bank",
    type: "activated_card_ability",
    side: "runner",
    source: "swiss-bank",
    timingPoint: "runner_action.main",
    costs: [{ credits: 3 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: stateVersion,
    payload: {
      costPenaltySupportWindowId: "runner_cost_penalty_support.91",
      costPenaltySupportOriginalActionId: originalActionId,
    },
  } as unknown as LegalAction;
}

function planResult(
  stateVersion: number,
  actionId: string,
  root: string,
): Extract<PlanSchedulerResult, { lane: "plan" }> {
  const instanceId = `plan:runner.${root.startsWith("rig") ? "rig_and_coverage" : "economy"}:${root}`;
  return {
    lane: "plan",
    route: {
      planInstanceId: instanceId,
      step: {
        stepId: `${instanceId}:${root.startsWith("rig") ? "find" : "fund"}`,
        capability: { capabilityId: "test", semanticActionTypes: [] },
        purpose: "test",
      },
      head: {
        actionId,
        actionType: root.startsWith("rig") ? "play_event" : "activated_card_ability",
      },
    } as never,
    selectedAssessment: {} as never,
    portfolio: portfolio(stateVersion, root),
    diagnostics: [],
  };
}

function portfolio(
  stateVersion: number,
  root: string,
): ResidentPlanPortfolio {
  const moduleId = root.startsWith("rig")
    ? "runner.rig_and_coverage"
    : "runner.economy";
  const instanceId = `plan:${moduleId}:${root}`;
  return {
    schemaVersion: "resident-plan-portfolio-v2",
    side: "runner",
    stateVersion,
    rootForegroundInstanceId: instanceId,
    executorInstanceId: instanceId,
    instances: [],
    completionHistory: [],
    transitions: [],
  };
}
