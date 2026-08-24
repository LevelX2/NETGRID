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

  it("preserves the origin when support is required before the continuation becomes legal", () => {
    const originalAction = paymentAction(90);
    const previous = portfolio(90, "rig-root");
    previous.pendingRunnerCostPenaltySupportOrigin = {
      rootPlanInstanceId: "plan:runner.rig_and_coverage:rig-root",
      executorInstanceId: "plan:runner.rig_and_coverage:rig-root",
      sourceStepId: "plan:runner.rig_and_coverage:rig-root:find",
      originalActionId: originalAction.actionId,
      selectedAtStateVersion: 90,
    };
    const support = supportAction(91, originalAction.actionId);
    const supportResult = planResult(91, support.actionId, "economy-root");

    expect(() =>
      reconcileSelectedRunnerCostPenaltySupportOrigin(
        input(91, [support]),
        supportResult,
        previous,
      ),
    ).not.toThrow();
    expect(supportResult.portfolio.pendingRunnerCostPenaltySupportOrigin).toEqual({
      ...previous.pendingRunnerCostPenaltySupportOrigin,
      windowId: "runner_cost_penalty_support.91",
    });
  });

  it("preserves the run-plan owner when a trace bid opens payment support", () => {
    const originalAction = traceBidAction(225);
    const previous = runPortfolio(223);
    const engineWindowResult: Extract<
      PlanSchedulerResult,
      { lane: "engine_window" }
    > = {
      lane: "engine_window",
      actionId: originalAction.actionId,
      origin: {
        rootPlanInstanceId: "run:run_211",
        leafPlanInstanceId: "rules.window_resolution",
        side: "runner",
        windowKind: "mandatory_choice",
        windowId: "run.encounter_ice:225",
        stateVersion: 225,
        timingPoint: "run.encounter_ice",
      },
      portfolio: structuredClone(previous),
      diagnostics: [],
    };

    reconcileSelectedRunnerCostPenaltySupportOrigin(
      traceBidInput(225, [originalAction]),
      engineWindowResult,
      previous,
    );
    expect(engineWindowResult.portfolio?.stateVersion).toBe(225);
    expect(
      engineWindowResult.portfolio?.pendingRunnerCostPenaltySupportOrigin,
    ).toEqual({
      rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
      executorInstanceId:
        "plan:runner.convert_run_window:run%3Arun_211",
      sourceStepId: "run.encounter_ice:225",
      originalActionId: originalAction.actionId,
      selectedAtStateVersion: 225,
    });

    const support = supportAction(226, originalAction.actionId);
    const supportResult = planResult(226, support.actionId, "economy-root");
    expect(() =>
      reconcileSelectedRunnerCostPenaltySupportOrigin(
        input(226, [support]),
        supportResult,
        engineWindowResult.portfolio,
      ),
    ).not.toThrow();
    expect(
      supportResult.portfolio.pendingRunnerCostPenaltySupportOrigin,
    ).toEqual({
      ...engineWindowResult.portfolio?.pendingRunnerCostPenaltySupportOrigin,
      windowId: "runner_cost_penalty_support.91",
    });
  });

  it("preserves a direct run-root owner when the mandatory trace starts before a run-window leaf exists", () => {
    const originalAction = traceBidAction(69);
    const choiceId = "run_66.asp.trace.runner.bid.69";
    originalAction.choiceRequirements![0]!.choiceId = choiceId;
    originalAction.payload = { choiceId, choiceKind: "bid_amount" };
    const previous = directRunRootPortfolio(67);
    const traceInput = traceBidInput(69, [originalAction]);
    traceInput.playerView.run = {
      ...traceInput.playerView.run!,
      runId: "run_66",
      attackedServerId: "remote_1",
      position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
    } as never;
    traceInput.playerView.pendingChoice = {
      ...traceInput.playerView.pendingChoice!,
      choiceId,
      source: "trace:run_66.asp.trace",
      stateVersion: 69,
    } as never;
    traceInput.eventTail = [
      {
        eventId: "evt_68",
        type: "continue_run",
        stateVersionBefore: 67,
        stateVersionAfter: 68,
        publicPayload: {
          actor: "runner",
          actionType: "continue_run",
          effectKind: "trace",
          traceStarted: true,
          serverId: "remote_1",
        },
      },
      {
        eventId: "evt_69",
        type: "resolve_choice",
        stateVersionBefore: 68,
        stateVersionAfter: 69,
        publicPayload: {
          actor: "corp",
          actionType: "resolve_choice",
          effectKind: "trace",
          traceStep: "corp_bid",
        },
      },
    ] as never;
    const engineWindowResult: Extract<
      PlanSchedulerResult,
      { lane: "engine_window" }
    > = {
      lane: "engine_window",
      actionId: originalAction.actionId,
      origin: {
        rootPlanInstanceId: "run:run_66",
        leafPlanInstanceId: "rules.window_resolution",
        side: "runner",
        windowKind: "mandatory_choice",
        windowId: "run.encounter_ice:69",
        stateVersion: 69,
        timingPoint: "run.encounter_ice",
      },
      portfolio: structuredClone(previous),
      diagnostics: [],
    };

    reconcileSelectedRunnerCostPenaltySupportOrigin(
      traceInput,
      engineWindowResult,
      previous,
    );

    expect(
      engineWindowResult.portfolio?.pendingRunnerCostPenaltySupportOrigin,
    ).toEqual({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      executorInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      sourceStepId: "run.encounter_ice:69",
      originalActionId: originalAction.actionId,
      selectedAtStateVersion: 69,
    });
    const support = supportAction(70, originalAction.actionId);
    support.timingPoint = "run.encounter_ice";
    expect(() =>
      reconcileSelectedRunnerCostPenaltySupportOrigin(
        input(70, [support]),
        planResult(70, support.actionId, "economy-root"),
        engineWindowResult.portfolio,
      ),
    ).not.toThrow();
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

  it("resumes the exact original action when every optional support action is explicitly rejected", () => {
    const continuation = continuedPaymentAction(91, "runner.play.original");
    const support = supportAction(91, "runner.play.original");
    const previous = portfolio(90, "rig-root");
    previous.pendingRunnerCostPenaltySupportOrigin = {
      rootPlanInstanceId: "plan:runner.rig_and_coverage:rig-root",
      executorInstanceId: "plan:runner.rig_and_coverage:rig-root",
      sourceStepId: "plan:runner.rig_and_coverage:rig-root:find",
      originalActionId: "runner.play.original",
      selectedAtStateVersion: 90,
    };

    const resolution = resolvePlanBoundRunnerCostPenaltyContinuation(
      {
        input: input(91, [continuation, support]),
        actionCandidates: [],
        actionDispositions: [
          {
            actionId: support.actionId,
            disposition: "explicitly_nonproductive",
            ownerModuleId: "runner.economy",
            evidenceCode: "runner_payment_support_not_needed",
          },
        ],
        turnKey: "runner:turn:14",
      },
      previous,
    );

    expect(resolution).toEqual({
      actionId: "runner.play.original",
      reasonCode: "plan_bound_runner_cost_penalty_support_continuation",
      origin: {
        rootPlanInstanceId: "plan:runner.rig_and_coverage:rig-root",
        leafPlanInstanceId: "plan:runner.rig_and_coverage:rig-root",
        side: "runner",
        windowKind: "optional_ability",
        windowId: "runner_cost_penalty_support.91",
        stateVersion: 91,
        timingPoint: "runner_action.main",
      },
    });
  });

  it("leaves a productive support action to its plan instead of forcing the continuation", () => {
    const continuation = continuedPaymentAction(91, "runner.play.original");
    const support = supportAction(91, "runner.play.original");
    const previous = portfolio(90, "rig-root");
    previous.pendingRunnerCostPenaltySupportOrigin = {
      rootPlanInstanceId: "plan:runner.rig_and_coverage:rig-root",
      executorInstanceId: "plan:runner.rig_and_coverage:rig-root",
      sourceStepId: "plan:runner.rig_and_coverage:rig-root:find",
      originalActionId: "runner.play.original",
      selectedAtStateVersion: 90,
    };

    expect(
      resolvePlanBoundRunnerCostPenaltyContinuation(
        {
          input: input(91, [continuation, support]),
          actionCandidates: [],
          actionDispositions: [],
          turnKey: "runner:turn:14",
        },
        previous,
      ),
    ).toBeUndefined();
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

function traceBidAction(stateVersion: number): LegalAction {
  return {
    actionId: "runner.resolve_choice",
    type: "resolve_choice",
    side: "runner",
    source: "game_rule",
    timingPoint: "run.encounter_ice",
    costs: [],
    targetRequirements: [],
    choiceRequirements: [
      {
        choiceId: "run_211.hunter.trace.runner.bid.225",
        minSelections: 1,
        maxSelections: 1,
        optionIds: ["bid_0", "bid_1", "bid_2", "bid_3", "bid_4", "bid_5"],
      },
    ],
    visibility: "private_to_actor",
    expiresAtStateVersion: stateVersion,
    payload: {
      choiceId: "run_211.hunter.trace.runner.bid.225",
      choiceKind: "bid_amount",
    },
  } as unknown as LegalAction;
}

function traceBidInput(
  stateVersion: number,
  legalActions: LegalAction[],
): AiDecisionInput {
  const value = input(stateVersion, legalActions, true);
  value.playerView.timingPoint = "run.encounter_ice";
  value.playerView.run = {
    runId: "run_211",
    attackedServerId: "hq",
    phase: "encounter_ice",
    position: { kind: "ice", serverId: "hq", iceIndex: 1 },
    badPublicityCredits: 0,
    successful: false,
  } as never;
  value.playerView.pendingChoice = {
    choiceId: "run_211.hunter.trace.runner.bid.225",
    side: "runner",
    source: "trace:run_211.hunter.trace",
    prompt: "Runner Link-Payment wählen",
    presentationKey: "generic_bid_amount",
    kind: "bid_amount",
    options: [
      { id: "bid_0", label: "0 Gesamtbid", value: 0 },
      { id: "bid_1", label: "1 Gesamtbid", value: 1 },
      { id: "bid_2", label: "2 Gesamtbid", value: 2 },
      { id: "bid_3", label: "3 Gesamtbid", value: 3 },
      { id: "bid_4", label: "4 Gesamtbid", value: 4 },
      { id: "bid_5", label: "5 Gesamtbid", value: 5 },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion,
    visibility: "public",
  } as never;
  value.eventTail = [
    {
      eventId: "evt_224",
      type: "continue_run",
      stateVersionBefore: 223,
      stateVersionAfter: 224,
      publicPayload: {
        actor: "runner",
        actionType: "continue_run",
        effectKind: "trace",
        traceStarted: true,
        serverId: "hq",
      },
    },
    {
      eventId: "evt_225",
      type: "resolve_choice",
      stateVersionBefore: 224,
      stateVersionAfter: 225,
      publicPayload: {
        actor: "corp",
        actionType: "resolve_choice",
        effectKind: "trace",
        traceStep: "corp_bid",
      },
    },
  ] as never;
  return value;
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

function runPortfolio(stateVersion: number): ResidentPlanPortfolio {
  const rootPlanInstanceId = "plan:runner.pressure_central:central%3Ahq";
  const executorInstanceId =
    "plan:runner.convert_run_window:run%3Arun_211";
  return {
    schemaVersion: "resident-plan-portfolio-v2",
    side: "runner",
    stateVersion,
    rootForegroundInstanceId: rootPlanInstanceId,
    executorInstanceId,
    instances: [
      {
        instanceId: rootPlanInstanceId,
        side: "runner",
        moduleId: "runner.pressure_central",
        executionState: "idle",
        viability: "blocked",
      },
      {
        instanceId: executorInstanceId,
        side: "runner",
        moduleId: "runner.convert_run_window",
        parentInstanceId: rootPlanInstanceId,
        executionState: "executor",
        viability: "ready",
        moduleState: {
          kind: "run_window",
          signal: {
            windowId: "run:run_211",
            serverId: "hq",
          },
        },
      },
    ] as never,
    completionHistory: [],
    transitions: [],
  };
}

function directRunRootPortfolio(stateVersion: number): ResidentPlanPortfolio {
  const instanceId = "plan:runner.contest_remote:remote%3Aremote_1";
  return {
    schemaVersion: "resident-plan-portfolio-v2",
    side: "runner",
    stateVersion,
    rootForegroundInstanceId: instanceId,
    executorInstanceId: instanceId,
    instances: [
      {
        instanceId,
        side: "runner",
        moduleId: "runner.contest_remote",
        executionState: "executor",
        viability: "ready",
      },
    ] as never,
    completionHistory: [],
    transitions: [],
  };
}
