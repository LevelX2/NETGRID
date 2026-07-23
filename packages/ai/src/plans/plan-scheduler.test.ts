import type { AiDecisionInput, Side } from "@netgrid/shared";
import { describe, expect, it, vi } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  CORP_PLAN_PRIORITY_POLICY,
  RUNNER_PLAN_PRIORITY_POLICY,
  type PlanAssessment,
  type PriorityClass,
} from "./plan-assessment";
import type { PlanProposal } from "./plan-kernel-types";
import {
  createSidePlanRegistry,
  runPlanScheduler,
  type PlanModule,
  type PlanSchedulerContext,
} from "./plan-scheduler";

describe("shared plan scheduler", () => {
  it.each([
    ["runner", RUNNER_PLAN_PRIORITY_POLICY],
    ["corp", CORP_PLAN_PRIORITY_POLICY],
  ] as const)("runs the same kernel with the %s registry", (side, policy) => {
    const action = candidate(`${side}-credit`, side);
    const result = runPlanScheduler({
      context: context(side, [action]),
      registry: createSidePlanRegistry({
        side,
        priorityPolicy: policy,
        modules: [module(side, `${side}.economy`, "P5", action)],
      }),
      resolveEngineWindow: () => undefined,
    });

    expect(result.lane).toBe("plan");
    if (result.lane === "plan") {
      expect(result.route.head.actionId).toBe(`${side}-credit`);
      expect(result.portfolio.executorInstanceId).toBe(
        `plan:${side}.economy:general`,
      );
    }
  });

  it("selects by validated plan class, not by action step value", () => {
    const strategic = candidate("strategic");
    const development = candidate("development");
    const result = runPlanScheduler({
      context: context("runner", [strategic, development]),
      registry: createSidePlanRegistry({
        side: "runner",
        priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
        modules: [
          module("runner", "runner.pressure", "P4", strategic, -10_000),
          module("runner", "runner.development", "P5", development, 10_000),
        ],
      }),
      resolveEngineWindow: () => undefined,
    });

    expect(result.lane === "plan" && result.route.head.actionId).toBe(
      "strategic",
    );
  });

  it("replans deterministically after a route failure", () => {
    const bad = candidate("bad");
    const good = candidate("good");
    const result = runPlanScheduler({
      context: context("runner", [bad, good]),
      registry: createSidePlanRegistry({
        side: "runner",
        priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
        modules: [
          module("runner", "runner.first", "P4", bad, 20, "draw.card"),
          module("runner", "runner.second", "P4", good, 10),
        ],
      }),
      resolveEngineWindow: () => undefined,
      maxReplans: 1,
    });

    expect(result.lane === "plan" && result.route.head.actionId).toBe("good");
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        stage: "replan",
        instanceId: "plan:runner.first:general",
      }),
    );
  });

  it("fails after bounded replanning instead of choosing an arbitrary action", () => {
    const bad = candidate("bad");
    expect(() =>
      runPlanScheduler({
        context: context("runner", [bad]),
        registry: createSidePlanRegistry({
          side: "runner",
          priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
          modules: [
            module("runner", "runner.bad", "P4", bad, 20, "draw.card"),
          ],
        }),
        resolveEngineWindow: () => undefined,
        maxReplans: 0,
      }),
    ).toThrow(
      expect.objectContaining({ code: "scheduler_replan_exhausted" }),
    );
  });

  it("keeps mandatory engine windows ahead of voluntary discovery", () => {
    const action = candidate("mandatory-choice");
    const discover = vi.fn(() => [proposal("runner", "runner.economy")]);
    const planModule = module("runner", "runner.economy", "P5", action);
    planModule.discover = discover;
    const result = runPlanScheduler({
      context: context("runner", [action]),
      registry: createSidePlanRegistry({
        side: "runner",
        priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
        modules: [planModule],
      }),
      resolveEngineWindow: (schedulerContext) => ({
        actionId: "mandatory-choice",
        reasonCode: "mandatory_choice",
        origin: {
          rootPlanInstanceId: "rules",
          leafPlanInstanceId: "rules",
          side: "runner",
          windowKind: "mandatory_choice",
          windowId: "choice-1",
          stateVersion: schedulerContext.input.playerView.stateVersion,
          timingPoint: schedulerContext.input.playerView.timingPoint,
        },
      }),
    });

    expect(result.lane).toBe("engine_window");
    expect(discover).not.toHaveBeenCalled();
  });
});

function module(
  side: Side,
  moduleId: PlanModule["moduleId"],
  priorityClass: PriorityClass,
  routeCandidate: ActionSemanticCandidate,
  stepValue = 1,
  requiredSemanticType = "economy.gain_credit",
): PlanModule {
  return {
    side,
    moduleId,
    discover: () => [proposal(side, moduleId)],
    assess: (instance) => assessment(instance.instanceId, side, priorityClass),
    materialize: () => ({
      step: {
        stepId: "execute",
        capability: {
          capabilityId: "execute",
          semanticActionTypes: [requiredSemanticType],
        },
        purpose: "test",
      },
      candidates: [{ candidate: routeCandidate, stepValue }],
    }),
  };
}

function proposal(side: Side, moduleId: PlanProposal["moduleId"]): PlanProposal {
  return {
    moduleId,
    moduleVersion: "1",
    dedupeKey: "general",
    side,
    strategyLineIds: [],
    executionClass: "development_project",
    initialViability: "ready",
    persistencePolicy: "sticky_goal",
    retentionPolicy: {
      blockedStateVersionTtl: 2,
      dormantStateVersionTtl: 2,
      completedHistoryStateVersionTtl: 2,
      abandonWhenTargetMissing: false,
      protectedWhileNeedOpen: true,
      protectedWhileCommitted: true,
    },
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

function assessment(
  instanceId: string,
  side: Side,
  priorityClass: PriorityClass,
): PlanAssessment {
  const reason = {
    P1: "terminal_win",
    P2: "survival_threat",
    P3: "expiring_conversion",
    P4: "strategic_campaign",
    P5: "development_need",
    P6: "neutral_progress",
  } as const;
  return {
    instanceId,
    side,
    priorityClaim: {
      requestedClass: priorityClass,
      reasonCode: reason[priorityClass],
      horizon: priorityClass === "P3" ? "current_turn" : "multi_turn",
      ...((priorityClass === "P1" || priorityClass === "P2")
        ? {
            witness: {
              kind:
                priorityClass === "P1"
                  ? ("terminal_path" as const)
                  : ("survival_threat" as const),
              evidenceCode: "visible",
              guarantee: "visible_state_forced" as const,
            },
          }
        : {}),
    },
    intentFit:
      priorityClass === "P4" || priorityClass === "P5" ? "aligned" : "none",
    readiness: "executable_now",
    feasibility: {
      currentRouteHeadPossible: true,
      projectedActionCount: 1,
      opponentCanReact: false,
      confidence: "visible_state_forced",
    },
    resourceGaps: [],
    expectedOutcome: {
      outcomeKind: "progress",
      minimumValue: 1,
      expectedValue: 1,
      maximumValue: 1,
      terminal: false,
      guarantee: "visible_state_forced",
    },
    continuity: {
      isCurrentForeground: false,
      sameObjectiveAsForeground: false,
      switchingCost: 0,
      progressAtRisk: 0,
    },
    blockers: [],
    withinClassValue: 10,
    evidenceCodes: ["test"],
  };
}

function context(
  side: Side,
  actionCandidates: ActionSemanticCandidate[],
): PlanSchedulerContext {
  return {
    input: {
      side,
      decisionId: "test:1",
      seed: "seed",
      profileId: "test",
      legalActions: actionCandidates.map((candidate) => ({
        actionId: candidate.actionId,
        type: candidate.actionType,
      })),
      playerView: {
        stateVersion: 10,
        timingPoint: `${side}_action.main`,
      },
    } as unknown as AiDecisionInput,
    actionCandidates,
    turnKey: `${side}:1`,
  };
}

function candidate(
  actionId: string,
  side: Side = "runner",
): ActionSemanticCandidate {
  return {
    actionId,
    actionType: "gain_credit",
    actorSide: side,
    legalActionRef: {
      actionId,
      actionType: "gain_credit",
      originalPayloadKeys: [],
    },
    stateVersion: 10,
    sourceKind: "basic_action",
    abilityBindingMethod: "unresolved",
    semanticActionType: "economy.gain_credit",
    visibilityScope: "actor_private",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: { costKnownStatus: "known", additionalCosts: [] },
    timingProfile: {},
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      stateVersion: 10,
      notes: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
  };
}
