import { rolesForDeckDoctrineCard } from "../deck-doctrine-card-roles";
import { rolesMatch } from "../runtime/role-match";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type {
  PlanAssessment,
  PriorityClass,
  PriorityClaim,
} from "./plan-assessment";
import type {
  PlanBlocker,
  PlanInstance,
  PlanProposal,
} from "./plan-kernel-types";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "./plan-scheduler";
import { PlanResolutionFailure } from "./plan-resolution-failure";

export type RunnerFundingNeedSignal = {
  needId: string;
  gap: number;
  priorityClass: "P2" | "P5";
  parentPlanInstanceId?: string;
  evidenceCode: string;
};

export type RunnerCoverageGapSignal = {
  gapId: string;
  requiredRole:
    | "breaker_wall"
    | "breaker_code_gate"
    | "breaker_sentry"
    | "breaker_universal";
  targetServerId?: string;
  priorityClass: "P2" | "P4" | "P5";
  evidenceCode: string;
  deckHasAnswer: boolean;
};

export type RunnerDefenseSignals = {
  activeTags: number;
  visibleTagPunish: boolean;
  pendingDamage: number;
  damagePreventionNeeded: boolean;
  handSize: number;
  minimumHandBuffer: number;
  drawAllowed: boolean;
  evidenceCodes: string[];
};

export type RunnerCorePlanDomain = {
  fundingNeeds: RunnerFundingNeedSignal[];
  coverageGaps: RunnerCoverageGapSignal[];
  defense: RunnerDefenseSignals;
};

export type RunnerCorePlanDependencies = {
  rolesForDefinitionId?: (definitionId: string) => readonly string[];
};

type EconomyState = { kind: "economy"; need: RunnerFundingNeedSignal };
type CoverageState = {
  kind: "coverage";
  gap: RunnerCoverageGapSignal;
  phase: "install_answer" | "find_answer";
};
type DefenseState = {
  kind: "defense";
  phase: "clear_tags" | "prevent_damage" | "build_hand_buffer";
  signals: RunnerDefenseSignals;
};
type BasicCreditState = { kind: "basic_credit" };

export function createRunnerCorePlanModules(
  dependencies: RunnerCorePlanDependencies = {},
): PlanModule[] {
  const rolesForDefinitionId =
    dependencies.rolesForDefinitionId ?? rolesForDeckDoctrineCard;
  return [
    economyModule(),
    coverageModule(rolesForDefinitionId),
    defenseModule(),
    basicCreditModule(),
  ];
}

export function runnerDevelopmentCardAdmission(params: {
  definitionId: string;
  assignedDomainPlanIds: readonly string[];
  concretePurposeCode?: string;
  duplicateAlreadyInstalled: boolean;
  affordableOrSupportable: boolean;
}):
  | { admitted: true; reasonCode: string }
  | { admitted: false; reasonCode: string } {
  if (params.assignedDomainPlanIds.length > 0) {
    return {
      admitted: true,
      reasonCode: `assigned_domain:${[...params.assignedDomainPlanIds].sort()[0]}`,
    };
  }
  if (!params.concretePurposeCode)
    return { admitted: false, reasonCode: "no_concrete_plan_purpose" };
  if (params.duplicateAlreadyInstalled)
    return { admitted: false, reasonCode: "redundant_board_copy" };
  if (!params.affordableOrSupportable)
    return { admitted: false, reasonCode: "no_feasible_install_route" };
  return {
    admitted: true,
    reasonCode: `card_specific_purpose:${params.concretePurposeCode}`,
  };
}

function economyModule(): PlanModule {
  return {
    moduleId: "runner.economy",
    side: "runner",
    discover: (context) =>
      domain(context)
        .fundingNeeds.filter((need) => need.gap > 0)
        .map((need) => {
          const routeExists = economyCandidates(context, false).length > 0;
          return proposal({
            moduleId: "runner.economy",
            dedupeKey: need.needId,
            moduleState: { kind: "economy", need } satisfies EconomyState,
            priorityClass: need.priorityClass,
            target: { kind: "capability", id: need.needId },
            routeExists,
            blockerCode: "no_compatible_credit_route",
            evidenceCode: need.evidenceCode,
          });
        }),
    assess: (instance, context, portfolio) =>
      assessment(
        instance,
        state<EconomyState>(instance).need.priorityClass,
        economyCandidates(context, false).length > 0,
        state<EconomyState>(instance).need.gap * 10,
        portfolio.executorInstanceId,
      ),
    materialize: (instance, _assessment, context) => {
      const need = state<EconomyState>(instance).need;
      return {
        step: {
          stepId: `${instance.instanceId}:fund:${need.needId}`,
          capability: {
            capabilityId: "gain_general_liquid_credits",
            semanticActionTypes: ["economy.gain_credit"],
          },
          purpose: `Close the bound credit gap ${need.needId}.`,
        },
        candidates: economyCandidates(context, false),
      };
    },
  };
}

function basicCreditModule(): PlanModule {
  return {
    moduleId: "runner.basic_credit",
    side: "runner",
    discover: (context) => {
      const routeExists = economyCandidates(context, true).length > 0;
      return routeExists
        ? [
            proposal({
              moduleId: "runner.basic_credit",
              dedupeKey: "neutral",
              moduleState: { kind: "basic_credit" } satisfies BasicCreditState,
              priorityClass: "P6",
              routeExists: true,
              blockerCode: "basic_credit_unavailable",
              evidenceCode: "neutral_basic_credit_legal",
            }),
          ]
        : [];
    },
    assess: (instance, context, portfolio) =>
      assessment(
        instance,
        "P6",
        economyCandidates(context, true).length > 0,
        1,
        portfolio.executorInstanceId,
      ),
    materialize: (instance, _assessment, context) => ({
      step: {
        stepId: `${instance.instanceId}:basic-credit`,
        capability: {
          capabilityId: "take_basic_credit",
          semanticActionTypes: ["economy.gain_credit"],
          legalActionTypes: ["gain_credit"],
        },
        purpose: "Make neutral progress when no higher-class plan can act.",
      },
      candidates: economyCandidates(context, true),
    }),
  };
}

function coverageModule(
  rolesForDefinitionId: (definitionId: string) => readonly string[],
): PlanModule {
  return {
    moduleId: "runner.rig_and_coverage",
    side: "runner",
    discover: (context) =>
      domain(context).coverageGaps.map((gap) => {
        const installs = coverageInstallCandidates(
          context,
          gap.requiredRole,
          rolesForDefinitionId,
        );
        const draws = coverageDrawCandidates(context, gap);
        const phase = installs.length > 0 ? "install_answer" : "find_answer";
        const routeExists =
          installs.length > 0 || (gap.deckHasAnswer && draws.length > 0);
        return proposal({
          moduleId: "runner.rig_and_coverage",
          dedupeKey: gap.gapId,
          moduleState: {
            kind: "coverage",
            gap,
            phase,
          } satisfies CoverageState,
          priorityClass: gap.priorityClass,
          target: { kind: "capability", id: gap.requiredRole },
          routeExists,
          blockerCode: "no_exact_coverage_route",
          evidenceCode: gap.evidenceCode,
        });
      }),
    assess: (instance, context, portfolio) => {
      const current = state<CoverageState>(instance);
      const candidates =
        current.phase === "install_answer"
          ? coverageInstallCandidates(
              context,
              current.gap.requiredRole,
              rolesForDefinitionId,
            )
          : coverageDrawCandidates(context, current.gap);
      return assessment(
        instance,
        current.gap.priorityClass,
        candidates.length > 0,
        current.phase === "install_answer"
          ? current.gap.targetServerId
            ? 120
            : 80
          : 30,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<CoverageState>(instance);
      if (current.phase === "install_answer") {
        return {
          step: {
            stepId: `${instance.instanceId}:install:${current.gap.requiredRole}`,
            capability: {
              capabilityId: `install_${current.gap.requiredRole}`,
              semanticActionTypes: ["install.card"],
              legalActionTypes: ["install_card"],
              requiredSourceRoles: [current.gap.requiredRole],
            },
            purpose: `Install an exact answer for ${current.gap.requiredRole}.`,
          },
          candidates: coverageInstallCandidates(
            context,
            current.gap.requiredRole,
            rolesForDefinitionId,
          ),
        };
      }
      return {
        step: {
          stepId: `${instance.instanceId}:find:${current.gap.requiredRole}`,
          capability: {
            capabilityId: `find_${current.gap.requiredRole}`,
            semanticActionTypes: ["draw.card", "card_ability.trigger"],
          },
          purpose: `Find an answer known to exist for ${current.gap.requiredRole}.`,
        },
        candidates: coverageDrawCandidates(context, current.gap),
      };
    },
  };
}

function defenseModule(): PlanModule {
  return {
    moduleId: "runner.defense_and_recovery",
    side: "runner",
    discover: (context) => {
      const signals = domain(context).defense;
      const phase = defensePhase(signals);
      if (!phase) return [];
      const candidates = defenseCandidates(context, phase, signals);
      return [
        proposal({
          moduleId: "runner.defense_and_recovery",
          dedupeKey: "runner",
          moduleState: {
            kind: "defense",
            phase,
            signals,
          } satisfies DefenseState,
          priorityClass:
            signals.pendingDamage > 0 ||
            (signals.activeTags > 0 && signals.visibleTagPunish)
              ? "P2"
              : "P5",
          target: { kind: "player", id: "runner" },
          routeExists: candidates.length > 0,
          blockerCode: `no_${phase}_route`,
          evidenceCode: signals.evidenceCodes[0] ?? phase,
        }),
      ];
    },
    assess: (instance, context, portfolio) => {
      const current = state<DefenseState>(instance);
      const candidates = defenseCandidates(
        context,
        current.phase,
        current.signals,
      );
      const priorityClass: "P2" | "P5" =
        current.signals.pendingDamage > 0 ||
        (current.signals.activeTags > 0 && current.signals.visibleTagPunish)
          ? "P2"
          : "P5";
      return assessment(
        instance,
        priorityClass,
        candidates.length > 0,
        defensePhaseValue(current.phase),
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<DefenseState>(instance);
      return {
        step: {
          stepId: `${instance.instanceId}:${current.phase}`,
          capability: defenseCapability(current.phase),
          purpose: `Resolve runner defense phase ${current.phase}.`,
        },
        candidates: defenseCandidates(context, current.phase, current.signals),
      };
    },
  };
}

function proposal(params: {
  moduleId: PlanProposal["moduleId"];
  dedupeKey: string;
  moduleState: unknown;
  priorityClass: PriorityClass;
  target?: PlanProposal["target"];
  routeExists: boolean;
  blockerCode: string;
  evidenceCode: string;
}): PlanProposal {
  const blockers: PlanBlocker[] = params.routeExists
    ? []
    : [
        {
          code: params.blockerCode,
          owner: "plan_module",
          removable: true,
          resumeCondition: { code: "compatible_route_available" },
        },
      ];
  return {
    moduleId: params.moduleId,
    moduleVersion: "1",
    dedupeKey: params.dedupeKey,
    side: "runner",
    strategyLineIds: [],
    executionClass:
      params.priorityClass === "P2" ? "urgent_response" : "development_project",
    initialViability: params.routeExists ? "ready" : "blocked",
    persistencePolicy:
      params.priorityClass === "P2" ? "locked_sequence" : "sticky_goal",
    retentionPolicy: {
      blockedStateVersionTtl: 2,
      dormantStateVersionTtl: 2,
      completedHistoryStateVersionTtl: 4,
      abandonWhenTargetMissing: params.target !== undefined,
      protectedWhileNeedOpen: true,
      protectedWhileCommitted: true,
    },
    ...(params.target ? { target: params.target } : {}),
    phase: moduleStatePhase(params.moduleState),
    milestone: "need_open",
    moduleState: structuredClone(params.moduleState),
    blockers,
    resumeConditions: [{ code: "compatible_route_available" }],
    completionConditions: [{ code: "need_satisfied" }],
    abandonmentConditions: [{ code: "need_disappeared" }],
    evidenceRefs: [{ code: params.evidenceCode, source: "visible_state" }],
  };
}

function assessment(
  instance: PlanInstance,
  priorityClass: "P2" | "P4" | "P5" | "P6",
  routeExists: boolean,
  withinClassValue: number,
  currentExecutorId: string | undefined,
): PlanAssessment {
  const priorityClaim: PriorityClaim =
    priorityClass === "P2"
      ? {
          requestedClass: "P2",
          reasonCode: "survival_threat",
          horizon: "current_turn",
          witness: {
            kind: "survival_threat",
            evidenceCode: instance.evidenceRefs[0]?.code ?? "visible_threat",
            guarantee: "visible_state_forced",
          },
        }
      : priorityClass === "P5"
        ? {
            requestedClass: "P5",
            reasonCode: "development_need",
            horizon: "multi_turn",
          }
        : priorityClass === "P4"
          ? {
              requestedClass: "P4",
              reasonCode: "strategic_campaign",
              horizon: "multi_turn",
            }
          : {
              requestedClass: "P6",
              reasonCode: "neutral_progress",
              horizon: "current_turn",
            };
  return {
    instanceId: instance.instanceId,
    side: "runner",
    priorityClaim,
    intentFit:
      priorityClass === "P4" || priorityClass === "P5" ? "aligned" : "none",
    readiness: routeExists ? "executable_now" : "blocked",
    ...(routeExists
      ? {
          nextStepPreview: {
            stepId: `${instance.instanceId}:${instance.phase}`,
            capability: instance.phase,
            purpose: "Execute the current module phase.",
          },
        }
      : {}),
    feasibility: {
      currentRouteHeadPossible: routeExists,
      projectedActionCount: routeExists ? 1 : 0,
      opponentCanReact: false,
      confidence: "visible_state_forced",
    },
    resourceGaps: [],
    expectedOutcome: {
      outcomeKind: "plan_progress",
      minimumValue: routeExists ? 1 : 0,
      expectedValue: routeExists ? 1 : 0,
      maximumValue: routeExists ? 1 : 0,
      terminal: false,
      guarantee: "visible_state_forced",
    },
    continuity: {
      isCurrentForeground: currentExecutorId === instance.instanceId,
      sameObjectiveAsForeground: currentExecutorId === instance.instanceId,
      switchingCost: currentExecutorId === instance.instanceId ? 1 : 0,
      progressAtRisk: currentExecutorId === instance.instanceId ? 1 : 0,
    },
    blockers: routeExists ? [] : structuredClone(instance.blockers),
    withinClassValue,
    evidenceCodes: instance.evidenceRefs.map((entry) => entry.code),
  };
}

function economyCandidates(
  context: PlanSchedulerContext,
  basicOnly: boolean,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        candidate.semanticActionType === "economy.gain_credit" &&
        (!basicOnly ||
          (candidate.sourceKind === "basic_action" &&
            candidate.actionType === "gain_credit")) &&
        (basicOnly ||
          candidate.economyProjection === undefined ||
          (candidate.economyProjection.kind === "immediate_liquid" &&
            candidate.economyProjection.timing === "immediate" &&
            candidate.economyProjection.creditRestriction === "general" &&
            (candidate.economyProjection.netLiquidCreditGain ?? 1) > 0)),
    )
    .map((candidate) => ({
      candidate,
      stepValue:
        candidate.economyProjection?.netLiquidCreditGain ??
        (candidate.sourceKind === "basic_action" ? 1 : 0),
    }));
}

function coverageInstallCandidates(
  context: PlanSchedulerContext,
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
  rolesForDefinitionId: (definitionId: string) => readonly string[],
): PlanMaterialization["candidates"] {
  return context.actionCandidates.flatMap((candidate) => {
    if (
      candidate.semanticActionType !== "install.card" ||
      !candidate.sourceDefinitionId
    )
      return [];
    const roles = rolesForDefinitionId(candidate.sourceDefinitionId);
    if (!rolesMatch(roles, coverageRoleNeedles(requiredRole))) return [];
    return [
      {
        candidate,
        sourceRoles: [...new Set([...roles, requiredRole])],
        stepValue: 100,
      },
    ];
  });
}

function coverageRoleNeedles(
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
): readonly string[] {
  switch (requiredRole) {
    case "breaker_wall":
      return ["breaker_wall", "breaker_fracter"];
    case "breaker_code_gate":
      return ["breaker_code_gate", "breaker_decoder"];
    case "breaker_sentry":
      return ["breaker_sentry", "breaker_killer"];
    case "breaker_universal":
      return ["breaker_universal"];
  }
  const exhaustiveRole: never = requiredRole;
  return exhaustiveRole;
}

function coverageDrawCandidates(
  context: PlanSchedulerContext,
  gap: RunnerCoverageGapSignal,
): PlanMaterialization["candidates"] {
  if (!gap.deckHasAnswer || !domain(context).defense.drawAllowed) return [];
  return context.actionCandidates
    .filter(
      (candidate) =>
        candidate.semanticActionType === "draw.card" ||
        (candidate.semanticActionType === "card_ability.trigger" &&
          candidate.actionTacticSignals.includes("search")),
    )
    .map((candidate) => ({
      candidate,
      stepValue:
        candidate.semanticActionType === "card_ability.trigger" ? 20 : 5,
    }));
}

function defensePhase(
  signals: RunnerDefenseSignals,
): DefenseState["phase"] | undefined {
  if (signals.pendingDamage > 0 && signals.damagePreventionNeeded)
    return "prevent_damage";
  if (signals.activeTags > 0) return "clear_tags";
  if (signals.drawAllowed && signals.handSize < signals.minimumHandBuffer)
    return "build_hand_buffer";
  return undefined;
}

function defenseCandidates(
  context: PlanSchedulerContext,
  phase: DefenseState["phase"],
  signals: RunnerDefenseSignals,
): PlanMaterialization["candidates"] {
  if (phase === "build_hand_buffer" && !signals.drawAllowed) return [];
  return context.actionCandidates
    .filter((candidate) => {
      if (phase === "clear_tags")
        return candidate.semanticActionType === "tag.remove";
      if (phase === "prevent_damage")
        return (
          candidate.semanticActionType.startsWith("damage.prevent") ||
          candidate.actionTacticSignals.includes("damage_prevention")
        );
      return candidate.semanticActionType === "draw.card";
    })
    .map((candidate) => ({
      candidate,
      stepValue:
        phase === "prevent_damage" ? 100 : phase === "clear_tags" ? 80 : 20,
    }));
}

function defenseCapability(
  phase: DefenseState["phase"],
): PlanRouteStepCapability {
  if (phase === "clear_tags")
    return {
      capabilityId: "remove_active_tags",
      semanticActionTypes: ["tag.remove"],
    };
  if (phase === "prevent_damage")
    return {
      capabilityId: "prevent_pending_damage",
      semanticActionTypes: [
        "damage.prevent",
        "damage.prevent_net",
        "damage.prevent_meat",
      ],
    };
  return {
    capabilityId: "draw_for_required_hand_buffer",
    semanticActionTypes: ["draw.card"],
  };
}

type PlanRouteStepCapability = PlanMaterialization["step"]["capability"];

function defensePhaseValue(phase: DefenseState["phase"]): number {
  if (phase === "prevent_damage") return 100;
  if (phase === "clear_tags") return 80;
  return 20;
}

function moduleStatePhase(moduleState: unknown): string {
  const value = moduleState as Partial<
    EconomyState | CoverageState | DefenseState | BasicCreditState
  >;
  if ("phase" in value && typeof value.phase === "string") return value.phase;
  return value.kind ?? "execute";
}

function state<T>(instance: PlanInstance): T {
  return instance.moduleState as T;
}

function domain(context: PlanSchedulerContext): RunnerCorePlanDomain {
  const value = context.domain as RunnerCorePlanDomain | undefined;
  if (!value) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "Build the Runner core domain signals before discovering Runner plans.",
    });
  }
  return value;
}
