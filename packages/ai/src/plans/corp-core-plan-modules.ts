import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type {
  PlanAssessment,
  PriorityClass,
  PriorityClaim,
} from "./plan-assessment";
import type { PlanInstance, PlanProposal } from "./plan-kernel-types";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "./plan-scheduler";
import type { PlanStepCapability } from "./plan-route";
import { PlanResolutionFailure } from "./plan-resolution-failure";

export type CorpScorePhase =
  | "install_agenda"
  | "advance_agenda"
  | "score_agenda";

export type CorpScoreProjectSignal = {
  projectId: string;
  agendaDefinitionId: string;
  agendaInstanceId?: string;
  serverId?: string;
  phase: CorpScorePhase;
  sameTurnCloseout: boolean;
  terminalScore: boolean;
  feasible: boolean;
  evidenceCode: string;
};

export type CorpRemoteProjectSignal = {
  projectId: string;
  sourceDefinitionId: string;
  serverId: string;
  purpose: "scoring_remote" | "economy_remote";
  phase: "install_project" | "protect_project";
  feasible: boolean;
  value: number;
  evidenceCode: string;
};

export type CorpDefenseSignal = {
  defenseId: string;
  serverId: string;
  phase: "install_ice" | "rez_response";
  sourceDefinitionIds: string[];
  targetIceInstanceId?: string;
  urgent: boolean;
  value: number;
  evidenceCode: string;
};

export type CorpEconomyNeedSignal = {
  needId: string;
  gap: number;
  parentPlanInstanceId?: string;
  urgentForScore: boolean;
  evidenceCode: string;
};

export type CorpCorePlanDomain = {
  scoreProjects: CorpScoreProjectSignal[];
  remoteProjects: CorpRemoteProjectSignal[];
  defenseNeeds: CorpDefenseSignal[];
  economyNeeds: CorpEconomyNeedSignal[];
};

type ScoreState = { kind: "score"; signal: CorpScoreProjectSignal };
type RemoteState = { kind: "remote"; signal: CorpRemoteProjectSignal };
type DefenseState = { kind: "defense"; signal: CorpDefenseSignal };
type EconomyState = { kind: "economy"; signal: CorpEconomyNeedSignal };

export const CORP_CORE_ACTION_OWNERSHIP = {
  "install.agenda": "corp.score_agenda",
  "score.advance_card": "corp.score_agenda",
  "score.agenda": "corp.score_agenda",
  "install.remote_project": "corp.establish_scoring_remote",
  "install.ice": "corp.defend_servers",
  "corp_window.rez": "corp.defend_servers",
  "economy.gain_credit": "corp.economy",
} as const;

export function createCorpCorePlanModules(): PlanModule[] {
  return [
    scoreModule(),
    remoteModule(),
    defenseModule(),
    economyModule(),
  ];
}

export function corpCoreActionOwner(
  semanticFamily: keyof typeof CORP_CORE_ACTION_OWNERSHIP,
): (typeof CORP_CORE_ACTION_OWNERSHIP)[typeof semanticFamily] {
  return CORP_CORE_ACTION_OWNERSHIP[semanticFamily];
}

function scoreModule(): PlanModule {
  return {
    moduleId: "corp.score_agenda",
    side: "corp",
    discover: (context) =>
      domain(context).scoreProjects.map((signal) =>
        proposal({
          moduleId: "corp.score_agenda",
          dedupeKey: signal.projectId,
          moduleState: { kind: "score", signal } satisfies ScoreState,
          priorityClass: signal.terminalScore
            ? "P1"
            : signal.sameTurnCloseout
              ? "P3"
              : "P4",
          target: scoreTarget(signal),
          routeExists:
            signal.feasible && scoreCandidates(context, signal).length > 0,
          evidenceCode: signal.evidenceCode,
          persistencePolicy: signal.sameTurnCloseout
            ? "locked_sequence"
            : "sticky_goal",
        }),
      ),
    assess: (instance, context, portfolio) => {
      const current = state<ScoreState>(instance);
      return assessment(
        instance,
        current.signal.terminalScore
          ? "P1"
          : current.signal.sameTurnCloseout
            ? "P3"
            : "P4",
        current.signal.feasible &&
          scoreCandidates(context, current.signal).length > 0,
        current.signal.terminalScore ? 1_000 : current.signal.sameTurnCloseout ? 500 : 100,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<ScoreState>(instance);
      const nextCapability = nextScoreCapability(current.signal.phase);
      return {
        step: {
          stepId: `${instance.instanceId}:${current.signal.phase}`,
          capability: scoreCapability(current.signal),
          target: scoreTarget(current.signal),
          purpose: `Execute score phase ${current.signal.phase}.`,
        },
        candidates: scoreCandidates(context, current.signal),
        ...(current.signal.sameTurnCloseout && nextCapability
          ? {
              continuation: {
                continuationId: `${instance.instanceId}:same-turn-score`,
                trigger: "action_applied" as const,
                nextCapability,
                ...(current.signal.agendaInstanceId
                  ? {
                      target: {
                        kind: "card" as const,
                        id: current.signal.agendaInstanceId,
                      },
                    }
                  : {}),
                purpose: "Continue the protected same-turn score line after observing the new state.",
              },
            }
          : {}),
      };
    },
  };
}

function remoteModule(): PlanModule {
  return {
    moduleId: "corp.establish_scoring_remote",
    side: "corp",
    discover: (context) =>
      domain(context).remoteProjects
        .filter((signal) => signal.purpose === "scoring_remote")
        .map((signal) =>
          proposal({
            moduleId: "corp.establish_scoring_remote",
            dedupeKey: signal.projectId,
            moduleState: { kind: "remote", signal } satisfies RemoteState,
            priorityClass: "P4",
            target: { kind: "server", id: signal.serverId },
            routeExists:
              signal.feasible && remoteCandidates(context, signal).length > 0,
            evidenceCode: signal.evidenceCode,
          }),
        ),
    assess: (instance, context, portfolio) => {
      const current = state<RemoteState>(instance);
      return assessment(
        instance,
        "P4",
        current.signal.feasible &&
          remoteCandidates(context, current.signal).length > 0,
        current.signal.value,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<RemoteState>(instance);
      return {
        step: {
          stepId: `${instance.instanceId}:${current.signal.phase}`,
          capability: {
            capabilityId: current.signal.phase,
            semanticActionTypes:
              current.signal.phase === "install_project"
                ? ["install.card"]
                : ["install.card", "corp_window.rez"],
            requiredSourceDefinitionIds: [
              current.signal.sourceDefinitionId,
            ],
          },
          target: { kind: "server", id: current.signal.serverId },
          purpose: `Establish scoring remote ${current.signal.serverId}.`,
        },
        candidates: remoteCandidates(context, current.signal),
      };
    },
  };
}

function defenseModule(): PlanModule {
  return {
    moduleId: "corp.defend_servers",
    side: "corp",
    discover: (context) =>
      domain(context).defenseNeeds.map((signal) =>
        proposal({
          moduleId: "corp.defend_servers",
          dedupeKey: signal.defenseId,
          moduleState: { kind: "defense", signal } satisfies DefenseState,
          priorityClass: signal.urgent ? "P2" : "P5",
          target:
            signal.phase === "rez_response" && signal.targetIceInstanceId
              ? { kind: "ice", id: signal.targetIceInstanceId }
              : { kind: "server", id: signal.serverId },
          routeExists: defenseCandidates(context, signal).length > 0,
          evidenceCode: signal.evidenceCode,
          persistencePolicy:
            signal.phase === "rez_response"
              ? "locked_sequence"
              : "sticky_goal",
        }),
      ),
    assess: (instance, context, portfolio) => {
      const current = state<DefenseState>(instance);
      return assessment(
        instance,
        current.signal.urgent ? "P2" : "P5",
        defenseCandidates(context, current.signal).length > 0,
        current.signal.value,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<DefenseState>(instance);
      return {
        step: {
          stepId: `${instance.instanceId}:${current.signal.phase}`,
          capability: {
            capabilityId: current.signal.phase,
            semanticActionTypes:
              current.signal.phase === "rez_response"
                ? ["corp_window.rez"]
                : ["install.card"],
            requiredSourceDefinitionIds:
              current.signal.sourceDefinitionIds,
          },
          target:
            current.signal.phase === "rez_response" &&
            current.signal.targetIceInstanceId
              ? { kind: "ice", id: current.signal.targetIceInstanceId }
              : { kind: "server", id: current.signal.serverId },
          purpose: `${current.signal.phase} for ${current.signal.serverId}.`,
        },
        candidates: defenseCandidates(context, current.signal),
      };
    },
  };
}

function economyModule(): PlanModule {
  return {
    moduleId: "corp.economy",
    side: "corp",
    discover: (context) =>
      domain(context).economyNeeds
        .filter((signal) => signal.gap > 0)
        .map((signal) =>
          proposal({
            moduleId: "corp.economy",
            dedupeKey: signal.needId,
            moduleState: { kind: "economy", signal } satisfies EconomyState,
            priorityClass: signal.urgentForScore ? "P5" : "P6",
            target: { kind: "capability", id: signal.needId },
            routeExists: economyCandidates(context).length > 0,
            evidenceCode: signal.evidenceCode,
            ...(signal.parentPlanInstanceId
              ? { parentInstanceId: signal.parentPlanInstanceId }
              : {}),
          }),
        ),
    assess: (instance, context, portfolio) => {
      const current = state<EconomyState>(instance);
      return assessment(
        instance,
        current.signal.urgentForScore ? "P5" : "P6",
        economyCandidates(context).length > 0,
        current.signal.gap,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => ({
      step: {
        stepId: `${instance.instanceId}:fund`,
        capability: {
          capabilityId: "gain_corp_liquid_credits",
          semanticActionTypes: ["economy.gain_credit"],
        },
        purpose: "Fund the explicitly bound Corp need.",
      },
      candidates: economyCandidates(context),
    }),
  };
}

function proposal(params: {
  moduleId: PlanProposal["moduleId"];
  dedupeKey: string;
  moduleState: unknown;
  priorityClass: PriorityClass;
  target: NonNullable<PlanProposal["target"]>;
  routeExists: boolean;
  evidenceCode: string;
  persistencePolicy?: PlanProposal["persistencePolicy"];
  parentInstanceId?: string;
}): PlanProposal {
  return {
    moduleId: params.moduleId,
    moduleVersion: "1",
    dedupeKey: params.dedupeKey,
    side: "corp",
    strategyLineIds: [],
    executionClass:
      params.priorityClass === "P1" || params.priorityClass === "P2"
        ? "urgent_response"
        : params.priorityClass === "P3"
          ? "bounded_sequence"
          : "development_project",
    initialViability: params.routeExists ? "ready" : "blocked",
    persistencePolicy: params.persistencePolicy ?? "sticky_goal",
    retentionPolicy: {
      blockedStateVersionTtl: 2,
      dormantStateVersionTtl: 2,
      completedHistoryStateVersionTtl: 4,
      abandonWhenTargetMissing: true,
      protectedWhileNeedOpen: true,
      protectedWhileCommitted: true,
    },
    target: params.target,
    ...(params.parentInstanceId
      ? { parentInstanceId: params.parentInstanceId }
      : {}),
    phase: modulePhase(params.moduleState),
    milestone: "admitted",
    moduleState: structuredClone(params.moduleState),
    blockers: params.routeExists
      ? []
      : [
          {
            code: "no_current_corp_route",
            owner: "plan_module",
            removable: true,
            resumeCondition: { code: "route_becomes_available" },
          },
        ],
    resumeConditions: [{ code: "route_becomes_available" }],
    completionConditions: [{ code: "domain_goal_satisfied" }],
    abandonmentConditions: [{ code: "target_invalidated" }],
    evidenceRefs: [{ code: params.evidenceCode, source: "visible_state" }],
  };
}

function assessment(
  instance: PlanInstance,
  priorityClass: "P1" | "P2" | "P3" | "P4" | "P5" | "P6",
  routeExists: boolean,
  value: number,
  executorId: string | undefined,
): PlanAssessment {
  const claim: PriorityClaim =
    priorityClass === "P1"
      ? {
          requestedClass: "P1",
          reasonCode: "terminal_win",
          horizon: "current_turn",
          witness: {
            kind: "terminal_path",
            evidenceCode: instance.evidenceRefs[0]?.code ?? "terminal_score",
            guarantee: "visible_state_forced",
            ...(instance.target ? { target: instance.target } : {}),
          },
        }
      : priorityClass === "P2"
        ? {
            requestedClass: "P2",
            reasonCode: "irreversible_threat",
            horizon: "current_turn",
            witness: {
              kind: "irreversible_threat",
              evidenceCode:
                instance.evidenceRefs[0]?.code ?? "visible_server_threat",
              guarantee: "visible_state_forced",
              ...(instance.target ? { target: instance.target } : {}),
            },
          }
        : priorityClass === "P3"
          ? {
              requestedClass: "P3",
              reasonCode: "expiring_conversion",
              horizon: "current_turn",
            }
          : priorityClass === "P4"
            ? {
                requestedClass: "P4",
                reasonCode: "strategic_campaign",
                horizon: "multi_turn",
              }
            : priorityClass === "P5"
              ? {
                  requestedClass: "P5",
                  reasonCode: "required_parent_support",
                  horizon: "multi_turn",
                }
              : {
                  requestedClass: "P6",
                  reasonCode: "neutral_progress",
                  horizon: "current_turn",
                };
  return {
    instanceId: instance.instanceId,
    side: "corp",
    priorityClaim: claim,
    intentFit:
      priorityClass === "P4" || priorityClass === "P5"
        ? "aligned"
        : "none",
    readiness: routeExists ? "executable_now" : "blocked",
    ...(routeExists
      ? {
          nextStepPreview: {
            stepId: `${instance.instanceId}:${instance.phase}`,
            capability: instance.phase,
            purpose: "Execute current Corp domain phase.",
          },
        }
      : {}),
    feasibility: {
      currentRouteHeadPossible: routeExists,
      projectedActionCount: routeExists ? 1 : 0,
      opponentCanReact: true,
      confidence: "visible_state_forced",
    },
    resourceGaps: [],
    expectedOutcome: {
      outcomeKind: "corp_plan_progress",
      minimumValue: routeExists ? value : 0,
      expectedValue: routeExists ? value : 0,
      maximumValue: routeExists ? value : 0,
      terminal: priorityClass === "P1",
      guarantee: "visible_state_forced",
    },
    continuity: {
      isCurrentForeground: executorId === instance.instanceId,
      sameObjectiveAsForeground: executorId === instance.instanceId,
      switchingCost: executorId === instance.instanceId ? 3 : 0,
      progressAtRisk: executorId === instance.instanceId ? 3 : 0,
    },
    blockers: routeExists ? [] : structuredClone(instance.blockers),
    withinClassValue: value,
    evidenceCodes: instance.evidenceRefs.map((entry) => entry.code),
  };
}

function scoreCapability(signal: CorpScoreProjectSignal): PlanStepCapability {
  if (signal.phase === "install_agenda")
    return {
      capabilityId: "install_score_agenda",
      semanticActionTypes: ["install.card"],
      requiredSourceDefinitionIds: [signal.agendaDefinitionId],
    };
  if (signal.phase === "advance_agenda")
    return {
      capabilityId: "advance_score_agenda",
      semanticActionTypes: ["score.advance_card"],
    };
  return {
    capabilityId: "score_agenda",
    semanticActionTypes: ["score.agenda"],
  };
}

function nextScoreCapability(
  phase: CorpScorePhase,
): PlanStepCapability | undefined {
  if (phase === "install_agenda")
    return {
      capabilityId: "advance_installed_agenda",
      semanticActionTypes: ["score.advance_card"],
    };
  if (phase === "advance_agenda")
    return {
      capabilityId: "score_advanced_agenda",
      semanticActionTypes: ["score.agenda"],
    };
  return undefined;
}

function scoreTarget(signal: CorpScoreProjectSignal) {
  return signal.phase === "install_agenda"
    ? { kind: "card" as const, id: signal.agendaDefinitionId }
    : {
        kind: "card" as const,
        id: signal.agendaInstanceId ?? signal.agendaDefinitionId,
      };
}

function scoreCandidates(
  context: PlanSchedulerContext,
  signal: CorpScoreProjectSignal,
): PlanMaterialization["candidates"] {
  const semantic = scoreCapability(signal).semanticActionTypes;
  return context.actionCandidates
    .filter((candidate) => {
      if (!semantic.includes(candidate.semanticActionType)) return false;
      if (signal.phase === "install_agenda")
        return candidate.sourceDefinitionId === signal.agendaDefinitionId;
      return candidateTargetIds(candidate).includes(
        signal.agendaInstanceId ?? signal.agendaDefinitionId,
      );
    })
    .map((candidate) => ({ candidate, stepValue: 100 }));
}

function remoteCandidates(
  context: PlanSchedulerContext,
  signal: CorpRemoteProjectSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        candidate.sourceDefinitionId === signal.sourceDefinitionId &&
        candidate.semanticActionType === "install.card" &&
        candidateTargetIds(candidate).includes(signal.serverId),
    )
    .map((candidate) => ({ candidate, stepValue: signal.value }));
}

function defenseCandidates(
  context: PlanSchedulerContext,
  signal: CorpDefenseSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter((candidate) => {
      if (!signal.sourceDefinitionIds.includes(candidate.sourceDefinitionId ?? ""))
        return false;
      if (signal.phase === "install_ice")
        return (
          candidate.semanticActionType === "install.card" &&
          candidateTargetIds(candidate).includes(signal.serverId)
        );
      return (
        candidate.semanticActionType === "corp_window.rez" &&
        (!signal.targetIceInstanceId ||
          candidateTargetIds(candidate).includes(signal.targetIceInstanceId))
      );
    })
    .map((candidate) => ({ candidate, stepValue: signal.value }));
}

function economyCandidates(
  context: PlanSchedulerContext,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        candidate.semanticActionType === "economy.gain_credit" &&
        (candidate.economyProjection?.creditRestriction ?? "general") ===
          "general",
    )
    .map((candidate) => ({
      candidate,
      stepValue: candidate.economyProjection?.netLiquidCreditGain ?? 1,
    }));
}

function candidateTargetIds(candidate: ActionSemanticCandidate): string[] {
  return [
    ...(candidate.targetContext?.selectedTargets.map(
      (target) => target.targetId,
    ) ?? []),
    ...(candidate.targetContext?.availableTargets?.map(
      (target) => target.targetId,
    ) ?? []),
    ...(candidate.runProjectionSummary?.serverId
      ? [candidate.runProjectionSummary.serverId]
      : []),
  ];
}

function domain(context: PlanSchedulerContext): CorpCorePlanDomain {
  const value = context.domain as CorpCorePlanDomain | undefined;
  if (
    value?.scoreProjects &&
    value.remoteProjects &&
    value.defenseNeeds &&
    value.economyNeeds
  )
    return value;
  throw new PlanResolutionFailure("missing_plan_module_coverage", {
    side: context.input.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    legalActionTypes: context.input.legalActions.map((action) => action.type),
    owner: "plan_module",
    removalCondition:
      "Build the Corp core domain before discovering Corp plans.",
  });
}

function modulePhase(moduleState: unknown): string {
  const value = moduleState as Partial<
    ScoreState | RemoteState | DefenseState | EconomyState
  >;
  if ("signal" in value && value.signal && "phase" in value.signal)
    return String(value.signal.phase);
  return value.kind ?? "execute";
}

function state<T>(instance: PlanInstance): T {
  return instance.moduleState as T;
}
