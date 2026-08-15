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
  enumerateCurrentPlanSchedulerRoutes,
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

  it("enumerates every current compatible route deterministically without mutating scheduler authority", () => {
    const lower = candidate("corp-credit-lower", "corp");
    const higher = candidate("corp-credit-higher", "corp");
    const schedulerContext = context("corp", [higher, lower]);
    const economy = module("corp", "corp.economy", "P5", higher);
    economy.materialize = () => ({
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
    const registry = createSidePlanRegistry({
      side: "corp",
      priorityPolicy: CORP_PLAN_PRIORITY_POLICY,
      modules: [economy],
    });
    const result = runPlanScheduler({
      context: schedulerContext,
      registry,
      resolveEngineWindow: () => undefined,
    });
    expect(result.lane).toBe("plan");
    if (result.lane !== "plan") throw new Error("Expected plan lane.");
    const contextBefore = structuredClone(schedulerContext);
    const portfolioBefore = structuredClone(result.portfolio);

    const first = enumerateCurrentPlanSchedulerRoutes({
      context: schedulerContext,
      registry,
      portfolio: result.portfolio,
    });
    const repeated = enumerateCurrentPlanSchedulerRoutes({
      context: schedulerContext,
      registry,
      portfolio: result.portfolio,
    });

    expect(repeated).toEqual(first);
    expect(first.issues).toEqual([]);
    expect(first.candidates.map((entry) => entry.candidate.actionId)).toEqual([
      "corp-credit-higher",
      "corp-credit-lower",
    ]);
    expect(result.route.head.actionId).toBe("corp-credit-higher");
    expect(schedulerContext).toEqual(contextBefore);
    expect(result.portfolio).toEqual(portfolioBefore);
  });

  it("binds equivalent duplicate card actions to the same canonical instance regardless of input order", () => {
    const copyA = {
      ...candidate("action-z", "corp"),
      actionType: "play_operation",
      semanticActionType: "play.operation",
      sourceKind: "card" as const,
      sourceCardInstanceId: "copy-a",
      sourceDefinitionId: "same-operation",
    };
    const copyB = {
      ...copyA,
      actionId: "action-a",
      legalActionRef: { ...copyA.legalActionRef, actionId: "action-a" },
      sourceCardInstanceId: "copy-b",
    };
    const choose = (actions: ActionSemanticCandidate[]) => {
      const economy = module("corp", "corp.economy", "P5", actions[0]!);
      economy.materialize = () => ({
        step: {
          stepId: "play-equivalent-operation",
          capability: {
            capabilityId: "play-equivalent-operation",
            semanticActionTypes: ["play.operation"],
          },
          purpose: "test canonical duplicate binding",
        },
        candidates: actions.map((candidate) => ({ candidate, stepValue: 10 })),
      });
      const result = runPlanScheduler({
        context: context("corp", actions),
        registry: createSidePlanRegistry({
          side: "corp",
          priorityPolicy: CORP_PLAN_PRIORITY_POLICY,
          modules: [economy],
        }),
        resolveEngineWindow: () => undefined,
      });
      if (result.lane !== "plan") throw new Error("Expected plan lane.");
      return {
        actionId: result.route.head.actionId,
        executor: result.portfolio.executorInstanceId,
        capability: result.route.step.capability.capabilityId,
      };
    };

    expect(choose([copyB, copyA])).toEqual({
      actionId: "action-z",
      executor: "plan:corp.economy:general",
      capability: "play-equivalent-operation",
    });
    expect(choose([copyA, copyB])).toEqual(choose([copyB, copyA]));
  });

  it("makes a current exact goal signal available to discovery and uses it to authorize only its bound tactical assessment", () => {
    const action = candidate("run-remote");
    const schedulerContext = context("runner", [action]);
    schedulerContext.transientSignals = [
      {
        schemaVersion: "transient-plan-signal-v1",
        signalId: "runner-visible-remote-window",
        side: "runner",
        observedAtStateVersion: 10,
        planModuleId: "runner.contest_remote",
        planDedupeKey: "general",
        kind: "goal",
        scope: "tactical",
        evidenceCode: "runner_visible_remote_window",
        guarantee: "visible_state_forced",
        target: { kind: "server", id: "remote_1" },
      },
    ];
    const tactical = module("runner", "runner.contest_remote", "P4", action);
    const discover = vi.fn((context: PlanSchedulerContext) => {
      expect(
        context.transientSignals?.map((signal) => signal.signalId),
      ).toEqual(["runner-visible-remote-window"]);
      return [
        {
          ...proposal("runner", "runner.contest_remote"),
          target: { kind: "server" as const, id: "remote_1" },
        },
      ];
    });
    tactical.discover = discover;
    tactical.assess = (instance) => ({
      ...assessment(instance.instanceId, "runner", "P4"),
      intentFit: "tactical_override",
    });

    const result = runPlanScheduler({
      context: schedulerContext,
      registry: createSidePlanRegistry({
        side: "runner",
        priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
        modules: [tactical],
      }),
      resolveEngineWindow: () => undefined,
    });

    expect(discover).toHaveBeenCalledOnce();
    expect(result.lane).toBe("plan");
    if (result.lane === "plan") {
      expect(result.selectedAssessment.evidenceCodes).toEqual(
        expect.arrayContaining([
          "transient_plan_signal_plan:runner.contest_remote",
          "transient_plan_signal_evidence:runner_visible_remote_window",
        ]),
      );
    }
  });

  it.each([
    {
      label: "foreign plan",
      signal: {
        planModuleId: "runner.pressure_central" as const,
        target: { kind: "server" as const, id: "remote_1" },
      },
    },
    {
      label: "foreign target",
      signal: {
        planModuleId: "runner.contest_remote" as const,
        target: { kind: "server" as const, id: "remote_2" },
      },
    },
    {
      label: "foreign resident plan",
      signal: {
        planModuleId: "runner.contest_remote" as const,
        planDedupeKey: "other-remote",
        target: { kind: "server" as const, id: "remote_1" },
      },
    },
    {
      label: "targetless",
      signal: {
        planModuleId: "runner.contest_remote" as const,
      },
    },
  ])(
    "does not let a $label signal authorize a P4 tactical override",
    ({ signal }) => {
      const action = candidate("run-remote");
      const schedulerContext = context("runner", [action]);
      schedulerContext.transientSignals = [
        {
          schemaVersion: "transient-plan-signal-v1",
          signalId: "unbound-signal",
          side: "runner",
          observedAtStateVersion: 10,
          kind: "goal",
          scope: "tactical",
          evidenceCode: "unbound_tactical_signal",
          guarantee: "visible_state_forced",
          planDedupeKey: "general",
          ...signal,
        },
      ];
      const tactical = module("runner", "runner.contest_remote", "P4", action);
      tactical.discover = () => [
        {
          ...proposal("runner", "runner.contest_remote"),
          target: { kind: "server", id: "remote_1" },
        },
      ];
      tactical.assess = (instance) => ({
        ...assessment(instance.instanceId, "runner", "P4"),
        intentFit: "tactical_override",
      });

      expect(() =>
        runPlanScheduler({
          context: schedulerContext,
          registry: createSidePlanRegistry({
            side: "runner",
            priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
            modules: [tactical],
          }),
          resolveEngineWindow: () => undefined,
        }),
      ).toThrow(
        expect.objectContaining({
          code: "priority_claim_rejected",
          context: expect.objectContaining({
            removalCondition: expect.stringContaining(
              "missing_explicit_tactical_evidence",
            ),
          }),
        }),
      );
    },
  );

  it("rejects a stale goal signal before plan discovery", () => {
    const action = candidate("run-remote");
    const schedulerContext = context("runner", [action]);
    schedulerContext.transientSignals = [
      {
        schemaVersion: "transient-plan-signal-v1",
        signalId: "stale-remote",
        side: "runner",
        observedAtStateVersion: 9,
        planModuleId: "runner.contest_remote",
        planDedupeKey: "general",
        kind: "goal",
        scope: "tactical",
        evidenceCode: "stale_remote",
        guarantee: "visible_state_forced",
        target: { kind: "server", id: "remote_1" },
      },
    ];
    const discover = vi.fn();
    const tactical = module("runner", "runner.contest_remote", "P4", action);
    tactical.discover = discover;

    expect(() =>
      runPlanScheduler({
        context: schedulerContext,
        registry: createSidePlanRegistry({
          side: "runner",
          priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
          modules: [tactical],
        }),
        resolveEngineWindow: () => undefined,
      }),
    ).toThrow(
      expect.objectContaining({
        code: "invalid_plan_identity",
        context: expect.objectContaining({
          removalCondition: expect.stringContaining("stale_state_version"),
        }),
      }),
    );
    expect(discover).not.toHaveBeenCalled();
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

  it("allows a selected plan route while an unrelated voluntary action remains unowned", () => {
    const maintenance = candidate("maintenance");
    const unexplained = candidate("unexplained");
    const schedulerContext = context("runner", [maintenance, unexplained]);

    const result = runPlanScheduler({
      context: schedulerContext,
      registry: createSidePlanRegistry({
        side: "runner",
        priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
        modules: [module("runner", "runner.economy", "P6", maintenance)],
      }),
      resolveEngineWindow: () => undefined,
    });

    expect(result.lane).toBe("plan");
    if (result.lane !== "plan") throw new Error("Expected plan lane.");
    expect(result.route.head.actionId).toBe(maintenance.actionId);
  });

  it("does not require the selected resident plan to materialize an unrelated legal step", () => {
    const prepare = candidate("prepare");
    const laterStep = candidate("later-step");
    const schedulerContext = context("runner", [prepare, laterStep]);

    const result = runPlanScheduler({
      context: schedulerContext,
      registry: createSidePlanRegistry({
        side: "runner",
        priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
        modules: [module("runner", "runner.pressure", "P4", prepare)],
      }),
      resolveEngineWindow: () => undefined,
    });

    expect(result.lane).toBe("plan");
    if (result.lane !== "plan") throw new Error("Expected plan lane.");
    expect(result.route.head.actionId).toBe(prepare.actionId);
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
          modules: [module("runner", "runner.economy", "P5", action)],
        }),
        resolveEngineWindow: () => undefined,
      }),
    ).toThrow(
      expect.objectContaining({
        code: "missing_plan_module_coverage",
        context: expect.objectContaining({
          unresolvedActionIds: ["contradiction"],
          removalCondition: expect.stringContaining(
            "cannot also have a terminal action classification",
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
    const planModule = module("runner", "runner.economy", "P5", lower);
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

  it("allows an unselected advertised candidate that cannot bind the concrete step", () => {
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
    const planModule = module("runner", "runner.economy", "P5", valid);
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

    const result = runPlanScheduler({
      context: context("runner", [valid, invalid]),
      registry: createSidePlanRegistry({
        side: "runner",
        priorityPolicy: RUNNER_PLAN_PRIORITY_POLICY,
        modules: [planModule],
      }),
      resolveEngineWindow: () => undefined,
    });

    expect(result.lane).toBe("plan");
    if (result.lane !== "plan") throw new Error("Expected plan lane.");
    expect(result.route.head.actionId).toBe(valid.actionId);
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
    const waitingModule = module("runner", "runner.waiting", "P2", waiting);
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

  it("fails closed with unused clicks when every assessed resident plan is blocked", () => {
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
    schedulerContext.input.playerView.own.clicks = 2;
    const waitingModule = module("runner", "runner.waiting", "P2", waiting);
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
        context: expect.objectContaining({
          removalCondition: expect.stringContaining("Unused action capacity=2"),
        }),
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

  it("rejects Runner EndTurn when a remaining action is undispositioned", () => {
    const endTurn = standardEndTurnCandidate("runner");
    const alternative = candidate("runner.undispositioned", "runner");
    const schedulerContext = context("runner", [alternative, endTurn]);
    schedulerContext.input.playerView.own.clicks = 2;

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
      expect.objectContaining({
        code: "end_turn_with_usable_capacity",
        context: expect.objectContaining({
          unresolvedActionIds: [alternative.actionId],
        }),
      }),
    );
  });

  it.each([
    ["runner", "assessment_unknown", RUNNER_PLAN_PRIORITY_POLICY],
    ["corp", "assessment_unknown", CORP_PLAN_PRIORITY_POLICY],
  ] as const)(
    "rejects %s EndTurn with clicks remaining when every alternative is %s",
    (side, disposition, policy) => {
      const endTurn = standardEndTurnCandidate(side);
      const alternative = candidate(`${side}.alternative`, side);
      const schedulerContext = context(side, [alternative, endTurn]);
      schedulerContext.input.playerView.own.clicks = 2;
      schedulerContext.actionDispositions = [
        {
          actionId: alternative.actionId,
          disposition,
          ownerModuleId: `${side}.economy`,
          evidenceCode:
            disposition === "assessment_unknown"
              ? "test_alternative_assessment_is_unknown"
              : "test_alternative_is_nonproductive",
        },
      ];
      const dispositionOwner = module(
        side,
        `${side}.economy`,
        "P5",
        alternative,
      );
      dispositionOwner.discover = () => [];

      expect(() =>
        runPlanScheduler({
          context: schedulerContext,
          registry: createSidePlanRegistry({
            side,
            priorityPolicy: policy,
            modules: [
              dispositionOwner,
              module(
                side,
                `${side}.complete_turn`,
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
        expect.objectContaining({
          code: "end_turn_with_usable_capacity",
        }),
      );
    },
  );

  it.each(["corp.economy", "corp.hand_development"] as const)(
    "allows a known productive route while an assessment remains unknown under %s",
    (unknownOwnerModuleId) => {
      const known = candidate("corp.known", "corp");
      const unknown = candidate("corp.unknown", "corp");
      const schedulerContext = context("corp", [known, unknown]);
      schedulerContext.actionDispositions = [
        {
          actionId: unknown.actionId,
          disposition: "assessment_unknown",
          ownerModuleId: unknownOwnerModuleId,
          evidenceCode: "test_unknown_sibling",
        },
      ];
      const modules = [module("corp", "corp.economy", "P6", known)];
      if (unknownOwnerModuleId !== "corp.economy") {
        const unknownOwner = module(
          "corp",
          unknownOwnerModuleId,
          "P5",
          unknown,
        );
        unknownOwner.discover = () => [];
        modules.push(unknownOwner);
      }

      const result = runPlanScheduler({
        context: schedulerContext,
        registry: createSidePlanRegistry({
          side: "corp",
          priorityPolicy: CORP_PLAN_PRIORITY_POLICY,
          modules,
        }),
        resolveEngineWindow: () => undefined,
      });

      expect(result.lane).toBe("plan");
      if (result.lane !== "plan") throw new Error("Expected plan lane.");
      expect(result.route.head.actionId).toBe(known.actionId);
    },
  );

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

  it.each([
    ["runner", RUNNER_PLAN_PRIORITY_POLICY],
    ["corp", CORP_PLAN_PRIORITY_POLICY],
  ] as const)(
    "rejects early %s EndTurn even when every normal action is explicitly nonproductive",
    (side, policy) => {
      const credit = candidate("credit", side);
      const endTurn = standardEndTurnCandidate(side);
      const schedulerContext = context(side, [credit, endTurn]);
      schedulerContext.input.playerView.own.clicks = 1;
      schedulerContext.actionDispositions = [
        {
          actionId: credit.actionId,
          disposition: "explicitly_nonproductive",
          ownerModuleId: `${side}.economy`,
          evidenceCode: `${side}_basic_credit_rejected_visible_liquidity_demand_satisfied`,
        },
      ];
      const economy = module(side, `${side}.economy`, "P6", credit);
      economy.discover = () => [];
      const completion = module(
        side,
        `${side}.complete_turn`,
        "P6",
        endTurn,
        -10_000,
        "turn_flow.end_turn",
      );
      expect(() =>
        runPlanScheduler({
          context: schedulerContext,
          registry: createSidePlanRegistry({
            side,
            priorityPolicy: policy,
            modules: [economy, completion],
          }),
          resolveEngineWindow: () => undefined,
        }),
      ).toThrow(
        expect.objectContaining({ code: "end_turn_with_usable_capacity" }),
      );
    },
  );

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
      modules: [module("runner", "runner.economy", "P5", action)],
    });
    const valid = {
      actionId: action.actionId,
      disposition: "explicitly_nonproductive" as const,
      ownerModuleId: "runner.economy" as const,
      evidenceCode: "credit_need_closed",
    };
    const invalidCases: Array<{
      candidates: ActionSemanticCandidate[];
      dispositions: NonNullable<PlanSchedulerContext["actionDispositions"]>;
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
        dispositions: [{ ...valid, ownerModuleId: "runner.pressure" }],
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
      const schedulerContext = context("runner", invalidCase.candidates);
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

  it("selects an exact support leaf with the validated priority of its persistent parent", () => {
    const credit = candidate("corp-credit", "corp");
    const competingSetup = candidate("corp-competing-setup", "corp");
    const parentInstanceId = "plan:corp.score_agenda:general";

    const parent = module("corp", "corp.score_agenda", "P4", credit, 1);
    parent.assess = (instance) => ({
      ...assessment(instance.instanceId, "corp", "P4"),
      readiness: "executable_with_support",
      feasibility: {
        currentRouteHeadPossible: false,
        projectedActionCount: 2,
        opponentCanReact: true,
        confidence: "belief_supported",
      },
      resourceGaps: [
        {
          needId: "score-funding",
          capability: "credits",
          minimum: 1,
          available: 0,
          deadline: "multi_turn",
        },
      ],
    });

    const support = module("corp", "corp.economy", "P6", credit, 1);
    support.discover = () => [
      {
        ...proposal("corp", "corp.economy"),
        dedupeKey: "score-funding",
        parentInstanceId,
        parentNeedId: "score-funding",
      },
    ];
    const competitor = module(
      "corp",
      "corp.hand_and_agenda_management",
      "P5",
      competingSetup,
      1,
    );

    const result = runPlanScheduler({
      context: context("corp", [credit, competingSetup]),
      registry: createSidePlanRegistry({
        side: "corp",
        priorityPolicy: CORP_PLAN_PRIORITY_POLICY,
        modules: [parent, support, competitor],
      }),
      resolveEngineWindow: () => undefined,
    });

    expect(result.lane).toBe("plan");
    if (result.lane !== "plan") throw new Error("Expected plan lane.");
    expect(result.route.head.actionId).toBe(credit.actionId);
    expect(result.selectedAssessment.priorityValidation.effectiveClass).toBe(
      "P4",
    );
    expect(
      result.selectedAssessment.priorityValidation.delegatedFromPlanInstanceId,
    ).toBe(parentInstanceId);
    expect(result.selectedAssessment.priorityValidation.needId).toBe(
      "score-funding",
    );
    expect(result.portfolio.rootForegroundInstanceId).toBe(parentInstanceId);
    expect(result.portfolio.executorInstanceId).toBe(
      "plan:corp.economy:score-funding",
    );
    expect(
      result.portfolio.instances.find(
        (instance) => instance.instanceId === parentInstanceId,
      )?.openNeedIds,
    ).toEqual(["score-funding"]);
  });

  it("does not delegate parent priority to a provider for a different need", () => {
    const credit = candidate("corp-credit", "corp");
    const competingSetup = candidate("corp-competing-setup", "corp");
    const parentInstanceId = "plan:corp.score_agenda:general";
    const parent = module("corp", "corp.score_agenda", "P4", credit, 1);
    parent.assess = (instance) => ({
      ...assessment(instance.instanceId, "corp", "P4"),
      readiness: "executable_with_support",
      feasibility: {
        currentRouteHeadPossible: false,
        projectedActionCount: 2,
        opponentCanReact: true,
        confidence: "belief_supported",
      },
      resourceGaps: [
        {
          needId: "score-funding",
          capability: "credits",
          minimum: 1,
          available: 0,
          deadline: "multi_turn",
        },
      ],
    });
    const foreignSupport = module("corp", "corp.economy", "P4", credit, 1);
    foreignSupport.discover = () => [
      {
        ...proposal("corp", "corp.economy"),
        dedupeKey: "foreign-funding",
        parentInstanceId,
        parentNeedId: "foreign-funding",
      },
    ];
    const competitor = module(
      "corp",
      "corp.hand_and_agenda_management",
      "P5",
      competingSetup,
      1,
    );

    const result = runPlanScheduler({
      context: context("corp", [credit, competingSetup]),
      registry: createSidePlanRegistry({
        side: "corp",
        priorityPolicy: CORP_PLAN_PRIORITY_POLICY,
        modules: [parent, foreignSupport, competitor],
      }),
      resolveEngineWindow: () => undefined,
    });

    expect(result.lane).toBe("plan");
    if (result.lane !== "plan") throw new Error("Expected plan lane.");
    expect(result.route.head.actionId).toBe(competingSetup.actionId);
    expect(result.selectedAssessment.priorityValidation.effectiveClass).toBe(
      "P5",
    );
  });

  it("rejects two resident provider plans for the same exact parent need", () => {
    const credit = candidate("corp-credit", "corp");
    const parentInstanceId = "plan:corp.score_agenda:general";
    const parent = module("corp", "corp.score_agenda", "P4", credit, 1);
    parent.assess = (instance) => ({
      ...assessment(instance.instanceId, "corp", "P4"),
      readiness: "executable_with_support",
      feasibility: {
        currentRouteHeadPossible: false,
        projectedActionCount: 2,
        opponentCanReact: true,
        confidence: "belief_supported",
      },
      resourceGaps: [
        {
          needId: "score-funding",
          capability: "credits",
          minimum: 1,
          available: 0,
          deadline: "multi_turn",
        },
      ],
    });
    const economySupport = module("corp", "corp.economy", "P6", credit, 1);
    economySupport.discover = () => [
      {
        ...proposal("corp", "corp.economy"),
        dedupeKey: "score-funding-economy",
        parentInstanceId,
        parentNeedId: "score-funding",
      },
    ];
    const alternateSupport = module(
      "corp",
      "corp.parent_support",
      "P6",
      credit,
      1,
    );
    alternateSupport.discover = () => [
      {
        ...proposal("corp", "corp.parent_support"),
        dedupeKey: "score-funding-alternate",
        parentInstanceId,
        parentNeedId: "score-funding",
      },
    ];

    expect(() =>
      runPlanScheduler({
        context: context("corp", [credit]),
        registry: createSidePlanRegistry({
          side: "corp",
          priorityPolicy: CORP_PLAN_PRIORITY_POLICY,
          modules: [parent, economySupport, alternateSupport],
        }),
        resolveEngineWindow: () => undefined,
      }),
    ).toThrowError(
      expect.objectContaining({
        name: "PlanResolutionFailure",
        code: "invalid_support_graph",
      }),
    );
  });

  it("keeps an executable P1 parent ahead of a P4 parent's exact funding child", () => {
    const fundingCredit = candidate("corp-credit", "corp");
    const terminalAction = candidate("corp-terminal-score", "corp");
    const supportParentInstanceId = "plan:corp.score_agenda:development-score";
    const supportParent = module(
      "corp",
      "corp.score_agenda",
      "P4",
      fundingCredit,
      1,
    );
    supportParent.discover = () => [
      {
        ...proposal("corp", "corp.score_agenda"),
        dedupeKey: "development-score",
      },
    ];
    supportParent.assess = (instance) => ({
      ...assessment(instance.instanceId, "corp", "P4"),
      readiness: "executable_with_support",
      feasibility: {
        currentRouteHeadPossible: false,
        projectedActionCount: 2,
        opponentCanReact: true,
        confidence: "belief_supported",
      },
      resourceGaps: [
        {
          needId: "development-score-funding",
          capability: "credits",
          minimum: 1,
          available: 0,
          deadline: "multi_turn",
        },
      ],
    });
    const support = module("corp", "corp.economy", "P5", fundingCredit, 1);
    support.discover = () => [
      {
        ...proposal("corp", "corp.economy"),
        dedupeKey: "development-score-funding",
        parentInstanceId: supportParentInstanceId,
        parentNeedId: "development-score-funding",
      },
    ];
    const terminalParent = module(
      "corp",
      "corp.terminal_score",
      "P1",
      terminalAction,
      1,
    );

    const result = runPlanScheduler({
      context: context("corp", [fundingCredit, terminalAction]),
      registry: createSidePlanRegistry({
        side: "corp",
        priorityPolicy: CORP_PLAN_PRIORITY_POLICY,
        modules: [supportParent, support, terminalParent],
      }),
      resolveEngineWindow: () => undefined,
    });

    expect(result.lane).toBe("plan");
    if (result.lane !== "plan") throw new Error("Expected plan lane.");
    expect(result.route.head.actionId).toBe(terminalAction.actionId);
    expect(result.selectedAssessment.priorityValidation.effectiveClass).toBe(
      "P1",
    );
    expect(result.portfolio.rootForegroundInstanceId).toBe(
      "plan:corp.terminal_score:general",
    );
    expect(result.portfolio.executorInstanceId).toBe(
      "plan:corp.terminal_score:general",
    );
    expect(
      result.portfolio.instances.find(
        (instance) => instance.instanceId === supportParentInstanceId,
      )?.openNeedIds,
    ).toEqual(["development-score-funding"]);
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

function proposal(
  side: Side,
  moduleId: PlanProposal["moduleId"],
): PlanProposal {
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
      ...(priorityClass === "P1" || priorityClass === "P2"
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

function standardEndTurnCandidate(
  side: Side = "runner",
): ActionSemanticCandidate {
  return {
    ...candidate(`${side}.end_turn`, side),
    actionType: "end_turn",
    legalActionRef: {
      actionId: `${side}.end_turn`,
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
