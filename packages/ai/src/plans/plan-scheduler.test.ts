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
  isStandardEndTurnCandidate,
  runPlanScheduler,
  type PlanModule,
  type PlanSchedulerContext,
} from "./plan-scheduler";

describe("shared plan scheduler", () => {
  it("reserves the EndTurn exception for the game-rule action", () => {
    const cardEndTurn = {
      ...candidate("card-end"),
      actionType: "end_turn",
      semanticActionType: "turn_flow.end_turn",
      sourceKind: "card" as const,
    };
    const standardEndTurn = {
      ...cardEndTurn,
      actionId: "runner.end_turn",
      sourceKind: "game_rule" as const,
    };

    expect(isStandardEndTurnCandidate(cardEndTurn)).toBe(false);
    expect(isStandardEndTurnCandidate(standardEndTurn)).toBe(true);
  });

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

  it("does not let a ready maintenance plan hide an unowned voluntary action", () => {
    const maintenance = candidate("maintenance");
    const unexplained = candidate("unexplained");
    const schedulerContext = context("runner", [
      maintenance,
      unexplained,
    ]);

    expect(() =>
      runPlanScheduler({
        context: schedulerContext,
        registry: createSidePlanRegistry({
          side: "runner",
          priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
          modules: [
            module(
              "runner",
              "runner.economy",
              "P6",
              maintenance,
            ),
          ],
        }),
        resolveEngineWindow: () => undefined,
      }),
    ).toThrow(
      expect.objectContaining({
        code: "missing_plan_module_coverage",
        context: expect.objectContaining({
          unresolvedActionIds: ["unexplained"],
        }),
      }),
    );
  });

  it("rejects a legal later step that the resident plan does not materialize", () => {
    const prepare = candidate("prepare");
    const laterStep = candidate("later-step");
    const schedulerContext = context("runner", [prepare, laterStep]);

    expect(() =>
      runPlanScheduler({
        context: schedulerContext,
        registry: createSidePlanRegistry({
          side: "runner",
          priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
          modules: [
            module("runner", "runner.pressure", "P4", prepare),
          ],
        }),
        resolveEngineWindow: () => undefined,
      }),
    ).toThrow(
      expect.objectContaining({
        code: "missing_plan_module_coverage",
        context: expect.objectContaining({
          unresolvedActionIds: ["later-step"],
          removalCondition: expect.stringContaining(
            "Materialize each voluntary LegalAction",
          ),
        }),
      }),
    );
  });

  it("fails when an executable route is simultaneously declared nonproductive", () => {
    const action = candidate("contradiction");
    const schedulerContext = context("runner", [action]);
    schedulerContext.actionDispositions = [
      {
        actionId: action.actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.economy",
        evidenceCode: "should_not_be_executable",
      },
    ];

    expect(() =>
      runPlanScheduler({
        context: schedulerContext,
        registry: createSidePlanRegistry({
          side: "runner",
          priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
          modules: [
            module("runner", "runner.economy", "P5", action),
          ],
        }),
        resolveEngineWindow: () => undefined,
      }),
    ).toThrow(
      expect.objectContaining({
        code: "missing_plan_module_coverage",
        context: expect.objectContaining({
          unresolvedActionIds: ["contradiction"],
          removalCondition: expect.stringContaining(
            "both executable plan routes and explicitly nonproductive",
          ),
        }),
      }),
    );
  });

  it("fails immediately when the selected ready plan cannot bind its route", () => {
    const bad = candidate("bad");
    const good = candidate("good");
    expect(() =>
      runPlanScheduler({
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
      }),
    ).toThrow(
      expect.objectContaining({
        code: "step_capability_mismatch",
        context: expect.objectContaining({
          planInstanceId: "plan:runner.first:general",
        }),
      }),
    );
  });

  it("counts every individually bindable candidate of a plan as coverage", () => {
    const lower = candidate("lower");
    const higher = candidate("higher");
    const planModule = module(
      "runner",
      "runner.economy",
      "P5",
      lower,
    );
    planModule.materialize = () => ({
      step: {
        stepId: "execute",
        capability: {
          capabilityId: "execute",
          semanticActionTypes: ["economy.gain_credit"],
        },
        purpose: "test",
      },
      candidates: [
        { candidate: lower, stepValue: 1 },
        { candidate: higher, stepValue: 2 },
      ],
    });

    const result = runPlanScheduler({
      context: context("runner", [lower, higher]),
      registry: createSidePlanRegistry({
        side: "runner",
        priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
        modules: [planModule],
      }),
      resolveEngineWindow: () => undefined,
    });

    expect(result.lane).toBe("plan");
    if (result.lane === "plan") {
      expect(result.route.head.actionId).toBe("higher");
    }
  });

  it("fails coverage immediately when any advertised candidate cannot bind the concrete step", () => {
    const valid = candidate("valid");
    const invalid = {
      ...candidate("invalid"),
      actionType: "draw_card",
      legalActionRef: {
        actionId: "invalid",
        actionType: "draw_card",
        originalPayloadKeys: [],
      },
      semanticActionType: "draw.card",
    };
    const planModule = module(
      "runner",
      "runner.economy",
      "P5",
      valid,
    );
    planModule.materialize = () => ({
      step: {
        stepId: "execute",
        capability: {
          capabilityId: "execute",
          semanticActionTypes: ["economy.gain_credit"],
        },
        purpose: "test",
      },
      candidates: [
        { candidate: valid, stepValue: 2 },
        { candidate: invalid, stepValue: 1 },
      ],
    });

    expect(() =>
      runPlanScheduler({
        context: context("runner", [valid, invalid]),
        registry: createSidePlanRegistry({
          side: "runner",
          priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
          modules: [planModule],
        }),
        resolveEngineWindow: () => undefined,
      }),
    ).toThrow(
      expect.objectContaining({
        code: "step_capability_mismatch",
        context: expect.objectContaining({
          planInstanceId: "plan:runner.economy:general",
          legalActionTypes: ["draw_card"],
          candidateCount: 1,
        }),
      }),
    );
  });

  it("keeps a blocked higher-class plan resident without letting it execute", () => {
    const waiting = candidate("waiting");
    const progress = candidate("progress");
    const schedulerContext = context("runner", [waiting, progress]);
    schedulerContext.actionDispositions = [
      {
        actionId: waiting.actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.waiting",
        evidenceCode: "waiting_for_bound_support",
      },
    ];
    const waitingModule = module(
      "runner",
      "runner.waiting",
      "P2",
      waiting,
    );
    waitingModule.assess = (instance) => ({
      ...assessment(instance.instanceId, "runner", "P2"),
      readiness: "blocked",
      feasibility: {
        currentRouteHeadPossible: false,
        projectedActionCount: 0,
        opponentCanReact: false,
        confidence: "visible_state_forced",
      },
      blockers: [
        {
          code: "waiting_for_bound_support",
          owner: "plan_module",
          removable: true,
          resumeCondition: { code: "bound_support_ready" },
        },
      ],
    });

    const result = runPlanScheduler({
      context: schedulerContext,
      registry: createSidePlanRegistry({
        side: "runner",
        priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
        modules: [
          waitingModule,
          module("runner", "runner.progress", "P5", progress),
        ],
      }),
      resolveEngineWindow: () => undefined,
    });

    expect(result.lane).toBe("plan");
    if (result.lane === "plan") {
      expect(result.route.head.actionId).toBe("progress");
      expect(
        result.portfolio.instances.find(
          (instance) => instance.moduleId === "runner.waiting",
        ),
      ).toBeDefined();
    }
  });

  it("fails closed when every assessed resident plan is blocked", () => {
    const waiting = candidate("waiting");
    const schedulerContext = context("runner", [waiting]);
    schedulerContext.actionDispositions = [
      {
        actionId: waiting.actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.waiting",
        evidenceCode: "waiting_for_bound_support",
      },
    ];
    const waitingModule = module(
      "runner",
      "runner.waiting",
      "P2",
      waiting,
    );
    waitingModule.assess = (instance) => ({
      ...assessment(instance.instanceId, "runner", "P2"),
      readiness: "blocked",
      feasibility: {
        currentRouteHeadPossible: false,
        projectedActionCount: 0,
        opponentCanReact: false,
        confidence: "visible_state_forced",
      },
      blockers: [
        {
          code: "waiting_for_bound_support",
          owner: "plan_module",
          removable: true,
          resumeCondition: { code: "bound_support_ready" },
        },
      ],
    });

    expect(() =>
      runPlanScheduler({
        context: schedulerContext,
        registry: createSidePlanRegistry({
          side: "runner",
          priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
          modules: [waitingModule],
        }),
        resolveEngineWindow: () => undefined,
      }),
    ).toThrow(
      expect.objectContaining({
        code: "missing_plan_module_coverage",
      }),
    );
  });

  it("rejects early standard EndTurn without a typed structural justification", () => {
    const endTurn = standardEndTurnCandidate();
    const schedulerContext = context("runner", [endTurn]);
    schedulerContext.input.playerView.own.clicks = 1;

    expect(() =>
      runPlanScheduler({
        context: schedulerContext,
        registry: createSidePlanRegistry({
          side: "runner",
          priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
          modules: [
            module(
              "runner",
              "runner.complete_turn",
              "P5",
              endTurn,
              -10_000,
              "turn_flow.end_turn",
            ),
          ],
        }),
        resolveEngineWindow: () => undefined,
      }),
    ).toThrow(
      expect.objectContaining({ code: "end_turn_with_usable_capacity" }),
    );
  });

  it("accepts early EndTurn only for the structurally proven terminal-win plan", () => {
    const endTurn = standardEndTurnCandidate();
    const schedulerContext = context("runner", [endTurn]);
    schedulerContext.input.playerView.own.clicks = 1;
    schedulerContext.input.playerView.opponent.deckCount = 0;
    const terminal = module(
      "runner",
      "runner.secure_terminal_win",
      "P1",
      endTurn,
      1,
      "turn_flow.end_turn",
    );
    const baseMaterialize = terminal.materialize;
    terminal.materialize = (instance, planAssessment, schedulerContext) => ({
      ...baseMaterialize(instance, planAssessment, schedulerContext),
      earlyEndTurnJustification: {
        kind: "rules_proven_terminal_win",
        terminalCondition: "corp_empty_rd_mandatory_draw",
      },
    });

    const result = runPlanScheduler({
      context: schedulerContext,
      registry: createSidePlanRegistry({
        side: "runner",
        priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
        modules: [terminal],
      }),
      resolveEngineWindow: () => undefined,
    });

    expect(result.lane === "plan" && result.route.head.actionId).toBe(
      endTurn.actionId,
    );
  });

  it("rejects a typed terminal-win claim when the rule state does not prove it", () => {
    const endTurn = standardEndTurnCandidate();
    const schedulerContext = context("runner", [endTurn]);
    schedulerContext.input.playerView.own.clicks = 1;
    const terminal = module(
      "runner",
      "runner.secure_terminal_win",
      "P1",
      endTurn,
      1,
      "turn_flow.end_turn",
    );
    const baseMaterialize = terminal.materialize;
    terminal.materialize = (instance, planAssessment, schedulerContext) => ({
      ...baseMaterialize(instance, planAssessment, schedulerContext),
      earlyEndTurnJustification: {
        kind: "rules_proven_terminal_win",
        terminalCondition: "corp_empty_rd_mandatory_draw",
      },
    });

    expect(() =>
      runPlanScheduler({
        context: schedulerContext,
        registry: createSidePlanRegistry({
          side: "runner",
          priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
          modules: [terminal],
        }),
        resolveEngineWindow: () => undefined,
      }),
    ).toThrow(
      expect.objectContaining({ code: "end_turn_with_usable_capacity" }),
    );
  });

  it("accepts early EndTurn for an exact explicitly rejected restricted-run capacity", () => {
    const endTurn = standardEndTurnCandidate();
    const restrictedRun = {
      ...candidate("restricted-run"),
      actionType: "start_run",
      semanticActionType: "run.start",
      sourceKind: "card" as const,
    };
    const schedulerContext = context("runner", [restrictedRun, endTurn]);
    schedulerContext.input.playerView.own.clicks = 1;
    schedulerContext.actionDispositions = [
      {
        actionId: restrictedRun.actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.defense_and_recovery",
        evidenceCode: "restricted_run_is_below_required_hand_buffer",
      },
    ];
    const defense = module(
      "runner",
      "runner.defense_and_recovery",
      "P5",
      endTurn,
      1,
      "turn_flow.end_turn",
    );
    const baseMaterialize = defense.materialize;
    defense.materialize = (instance, planAssessment, schedulerContext) => ({
      ...baseMaterialize(instance, planAssessment, schedulerContext),
      earlyEndTurnJustification: {
        kind: "forgo_restricted_capacity",
        capacityKind: "zero_click_non_basic_run_only",
        explicitlyNonproductiveActionIds: [restrictedRun.actionId],
      },
    });

    const result = runPlanScheduler({
      context: schedulerContext,
      registry: createSidePlanRegistry({
        side: "runner",
        priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
        modules: [defense],
      }),
      resolveEngineWindow: () => undefined,
    });

    expect(result.lane === "plan" && result.route.head.actionId).toBe(
      endTurn.actionId,
    );
  });

  it("rejects incomplete or ambiguous nonproductive action dispositions", () => {
    const action = candidate("credit");
    const endTurn = {
      ...candidate("end"),
      actionType: "end_turn",
      semanticActionType: "turn_flow.end_turn",
      sourceKind: "game_rule" as const,
    };
    const registry = createSidePlanRegistry({
      side: "runner",
      priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
      modules: [
        module("runner", "runner.economy", "P5", action),
      ],
    });
    const valid = {
      actionId: action.actionId,
      disposition: "explicitly_nonproductive" as const,
      ownerModuleId: "runner.economy" as const,
      evidenceCode: "credit_need_closed",
    };
    const invalidCases: Array<{
      candidates: ActionSemanticCandidate[];
      dispositions: NonNullable<
        PlanSchedulerContext["actionDispositions"]
      >;
    }> = [
      {
        candidates: [action],
        dispositions: [{ ...valid, actionId: "missing-action" }],
      },
      {
        candidates: [action],
        dispositions: [valid, valid],
      },
      {
        candidates: [action],
        dispositions: [
          { ...valid, ownerModuleId: "runner.pressure" },
        ],
      },
      {
        candidates: [action],
        dispositions: [{ ...valid, evidenceCode: " " }],
      },
      {
        candidates: [endTurn],
        dispositions: [{ ...valid, actionId: endTurn.actionId }],
      },
    ];

    for (const invalidCase of invalidCases) {
      const schedulerContext = context(
        "runner",
        invalidCase.candidates,
      );
      schedulerContext.actionDispositions = invalidCase.dispositions;
      expect(() =>
        runPlanScheduler({
          context: schedulerContext,
          registry,
          resolveEngineWindow: () => undefined,
        }),
      ).toThrow(
        expect.objectContaining({
          code: "missing_plan_module_coverage",
        }),
      );
    }
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
        source:
          candidate.sourceKind === "basic_action"
            ? "basic_action"
            : candidate.sourceKind,
        costs: [],
      })),
      playerView: {
        stateVersion: 10,
        timingPoint: `${side}_action.main`,
        own: { clicks: 0 },
        opponent: { deckCount: 1 },
      },
    } as unknown as AiDecisionInput,
    actionCandidates,
    turnKey: `${side}:1`,
  };
}

function standardEndTurnCandidate(): ActionSemanticCandidate {
  return {
    ...candidate("runner.end_turn"),
    actionType: "end_turn",
    legalActionRef: {
      actionId: "runner.end_turn",
      actionType: "end_turn",
      originalPayloadKeys: [],
    },
    sourceKind: "game_rule",
    semanticActionType: "turn_flow.end_turn",
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
