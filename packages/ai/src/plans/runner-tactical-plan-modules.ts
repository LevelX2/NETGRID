import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type {
  PlanAssessment,
  PriorityClass,
  PriorityClaim,
} from "./plan-assessment";
import type { PlanInstance, PlanProposal } from "./plan-kernel-types";
import type { PlanOutcomeReceipt } from "./resident-plan-portfolio";
import {
  runnerDevelopmentCardAdmission,
  type RunnerCorePlanDomain,
} from "./runner-core-plan-modules";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "./plan-scheduler";
import { PlanResolutionFailure } from "./plan-resolution-failure";

export type RunnerPressureSignal = {
  pressureId: string;
  serverId: "hq" | "rd" | "archives";
  purpose: "access" | "multiaccess" | "information";
  strategyLineIds: string[];
  priorityClass: "P4" | "P5";
  reachable: boolean;
  marginalValue: number;
  evidenceCode: string;
  sourceDefinitionIds?: string[];
};

export type RunnerRemoteContestSignal = {
  contestId: string;
  serverId: string;
  knownAgendaThreat: boolean;
  reachable: boolean;
  marginalValue: number;
  evidenceCode: string;
};

export type RunnerDevelopmentSignal = {
  developmentId: string;
  definitionId: string;
  purposeCode?: string;
  assignedDomainPlanIds: string[];
  duplicateAlreadyInstalled: boolean;
  affordableOrSupportable: boolean;
  semanticActionTypes: string[];
  value: number;
  evidenceCode: string;
};

export type RunnerRunWindowSignal = {
  windowId: string;
  serverId?: string;
  rootPlanInstanceId: string;
  leafPlanInstanceId: string;
  semanticActionTypes: string[];
  purposeCode: string;
  evidenceCode: string;
};

export type RunnerTerminalWinSignal = {
  terminalId: string;
  semanticActionTypes: string[];
  evidenceCode: string;
};

export type RunnerTacticalPlanDomain = {
  terminalWins: RunnerTerminalWinSignal[];
  centralPressure: RunnerPressureSignal[];
  remoteContests: RunnerRemoteContestSignal[];
  developments: RunnerDevelopmentSignal[];
  runWindows: RunnerRunWindowSignal[];
};

export type RunnerPlanDomain = RunnerCorePlanDomain & RunnerTacticalPlanDomain;

type PressureState = {
  kind: "central_pressure";
  signal: RunnerPressureSignal;
};
type RemoteState = {
  kind: "remote_contest";
  signal: RunnerRemoteContestSignal;
};
type DevelopmentState = {
  kind: "development";
  signal: RunnerDevelopmentSignal;
};
type RunWindowState = {
  kind: "run_window";
  signal: RunnerRunWindowSignal;
};
type TerminalWinState = {
  kind: "terminal_win";
  signal: RunnerTerminalWinSignal;
};

export function createRunnerTacticalPlanModules(): PlanModule[] {
  return [
    terminalWinModule(),
    centralPressureModule(),
    remoteContestModule(),
    developmentModule(),
    runWindowModule(),
  ];
}

function terminalWinModule(): PlanModule {
  return {
    moduleId: "runner.secure_terminal_win",
    side: "runner",
    discover: (context) =>
      domain(context).terminalWins.map((signal) => {
        const candidates = terminalWinCandidates(context, signal);
        return proposal(
          "runner.secure_terminal_win",
          signal.terminalId,
          { kind: "terminal_win", signal } satisfies TerminalWinState,
          "P1",
          [],
          { kind: "player", id: "corp" },
          candidates.length > 0,
          signal.evidenceCode,
        );
      }),
    assess: (instance, context, portfolio) => {
      const current = state<TerminalWinState>(instance);
      return assessment(
        instance,
        "P1",
        terminalWinCandidates(context, current.signal).length > 0,
        1,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<TerminalWinState>(instance);
      return {
        step: {
          stepId: `${instance.instanceId}:force_terminal`,
          capability: {
            capabilityId: "force_corp_mandatory_draw_deckout",
            semanticActionTypes: current.signal.semanticActionTypes,
          },
          purpose:
            "End the Runner turn to force the rules-proven empty-R&D mandatory draw.",
        },
        candidates: terminalWinCandidates(context, current.signal),
      };
    },
  };
}

export function runnerPressureProgressReceipt(params: {
  planInstanceId: string;
  stateVersionBefore: number;
  stateVersionAfter: number;
  previousCounter: number;
  currentCounter: number;
  accessConverted: boolean;
  corpPurged: boolean;
}): PlanOutcomeReceipt {
  if (params.corpPurged) {
    return {
      planInstanceId: params.planInstanceId,
      stateVersionBefore: params.stateVersionBefore,
      stateVersionAfter: params.stateVersionAfter,
      progress: "regression",
      progressValue: 0,
      milestoneAfter: "counter_reset_by_corp_purge",
      reasonCode: "corp_purge_observed",
    };
  }
  const realProgress =
    params.accessConverted && params.currentCounter > params.previousCounter;
  return {
    planInstanceId: params.planInstanceId,
    stateVersionBefore: params.stateVersionBefore,
    stateVersionAfter: params.stateVersionAfter,
    progress: realProgress ? "progress" : "no_progress",
    progressValue: realProgress
      ? params.currentCounter
      : params.previousCounter,
    milestoneAfter: realProgress
      ? "access_conversion_observed"
      : "no_real_conversion",
    reasonCode: realProgress
      ? "highlighter_counter_increased_after_access"
      : "counter_did_not_increase",
  };
}

export function runnerVoluntaryActionFamilyOwner(
  candidate: ActionSemanticCandidate,
  planDomain: RunnerPlanDomain,
): PlanModule["moduleId"] | undefined {
  if (candidate.semanticActionType === "turn_flow.end_turn") {
    return planDomain.terminalWins.length > 0
      ? "runner.secure_terminal_win"
      : undefined;
  }
  if (candidate.semanticActionType === "economy.gain_credit") {
    return candidate.sourceKind === "basic_action"
      ? "runner.basic_credit"
      : "runner.economy";
  }
  if (
    candidate.semanticActionType === "tag.remove" ||
    candidate.semanticActionType.startsWith("damage.prevent")
  )
    return "runner.defense_and_recovery";
  if (candidate.semanticActionType === "run.start") {
    const server = candidate.runProjectionSummary?.serverId;
    if (
      server &&
      planDomain.remoteContests.some((signal) => signal.serverId === server)
    )
      return "runner.contest_remote";
    if (
      server &&
      planDomain.centralPressure.some((signal) => signal.serverId === server)
    )
      return "runner.pressure_central";
    return undefined;
  }
  if (
    candidate.semanticActionType.startsWith("access.") ||
    candidate.semanticActionType === "run.continue" ||
    candidate.semanticActionType === "run.jack_out"
  ) {
    return planDomain.runWindows.length > 0
      ? "runner.convert_run_window"
      : undefined;
  }
  if (
    candidate.semanticActionType === "install.card" ||
    candidate.semanticActionType === "play.runner_event" ||
    candidate.semanticActionType === "card_ability.trigger"
  ) {
    if (
      candidate.sourceDefinitionId &&
      planDomain.developments.some(
        (signal) => signal.definitionId === candidate.sourceDefinitionId,
      )
    )
      return "runner.develop_board_and_hand";
  }
  if (candidate.semanticActionType === "draw.card") {
    const concreteDrawPurpose =
      planDomain.coverageGaps.some((gap) => gap.deckHasAnswer) ||
      planDomain.defense.handSize < planDomain.defense.minimumHandBuffer;
    return concreteDrawPurpose ? "runner.defense_and_recovery" : undefined;
  }
  return undefined;
}

function centralPressureModule(): PlanModule {
  return {
    moduleId: "runner.pressure_central",
    side: "runner",
    discover: (context) =>
      domain(context).centralPressure.map((signal) => {
        const candidates = pressureCandidates(context, signal);
        return proposal(
          "runner.pressure_central",
          signal.pressureId,
          { kind: "central_pressure", signal } satisfies PressureState,
          signal.priorityClass,
          signal.strategyLineIds,
          { kind: "server", id: signal.serverId },
          signal.reachable && signal.marginalValue > 0 && candidates.length > 0,
          signal.evidenceCode,
        );
      }),
    assess: (instance, context, portfolio) => {
      const current = state<PressureState>(instance);
      const candidates = pressureCandidates(context, current.signal);
      return assessment(
        instance,
        current.signal.priorityClass,
        current.signal.reachable &&
          current.signal.marginalValue > 0 &&
          candidates.length > 0,
        current.signal.marginalValue,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<PressureState>(instance);
      return {
        step: {
          stepId: `${instance.instanceId}:pressure:${current.signal.serverId}`,
          capability: {
            capabilityId: `pressure_${current.signal.serverId}_${current.signal.purpose}`,
            semanticActionTypes: ["run.start", "play.runner_event"],
            ...(current.signal.sourceDefinitionIds
              ? {
                  requiredSourceDefinitionIds:
                    current.signal.sourceDefinitionIds,
                }
              : {}),
          },
          target: { kind: "server", id: current.signal.serverId },
          purpose: `Execute ${current.signal.purpose} pressure on ${current.signal.serverId}.`,
        },
        candidates: pressureCandidates(context, current.signal),
      };
    },
  };
}

function remoteContestModule(): PlanModule {
  return {
    moduleId: "runner.contest_remote",
    side: "runner",
    discover: (context) =>
      domain(context).remoteContests.map((signal) => {
        const candidates = remoteCandidates(context, signal);
        return proposal(
          "runner.contest_remote",
          signal.contestId,
          { kind: "remote_contest", signal } satisfies RemoteState,
          signal.knownAgendaThreat ? "P2" : "P4",
          [],
          { kind: "server", id: signal.serverId },
          signal.reachable && signal.marginalValue > 0 && candidates.length > 0,
          signal.evidenceCode,
        );
      }),
    assess: (instance, context, portfolio) => {
      const current = state<RemoteState>(instance);
      return assessment(
        instance,
        current.signal.knownAgendaThreat ? "P2" : "P4",
        current.signal.reachable &&
          current.signal.marginalValue > 0 &&
          remoteCandidates(context, current.signal).length > 0,
        current.signal.marginalValue,
        portfolio.executorInstanceId,
        current.signal.knownAgendaThreat ? "score_threat" : undefined,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<RemoteState>(instance);
      return {
        step: {
          stepId: `${instance.instanceId}:contest`,
          capability: {
            capabilityId: "contest_remote",
            semanticActionTypes: ["run.start"],
          },
          target: { kind: "server", id: current.signal.serverId },
          purpose: `Contest visible remote ${current.signal.serverId}.`,
        },
        candidates: remoteCandidates(context, current.signal),
      };
    },
  };
}

function developmentModule(): PlanModule {
  return {
    moduleId: "runner.develop_board_and_hand",
    side: "runner",
    discover: (context) =>
      domain(context).developments.flatMap((signal) => {
        const admission = runnerDevelopmentCardAdmission({
          definitionId: signal.definitionId,
          assignedDomainPlanIds: signal.assignedDomainPlanIds,
          ...(signal.purposeCode
            ? { concretePurposeCode: signal.purposeCode }
            : {}),
          duplicateAlreadyInstalled: signal.duplicateAlreadyInstalled,
          affordableOrSupportable: signal.affordableOrSupportable,
        });
        if (!admission.admitted) return [];
        const candidates = developmentCandidates(context, signal);
        return [
          proposal(
            "runner.develop_board_and_hand",
            signal.developmentId,
            { kind: "development", signal } satisfies DevelopmentState,
            "P5",
            signal.assignedDomainPlanIds,
            { kind: "card", id: signal.definitionId },
            candidates.length > 0,
            `${signal.evidenceCode}:${admission.reasonCode}`,
          ),
        ];
      }),
    assess: (instance, context, portfolio) => {
      const current = state<DevelopmentState>(instance);
      return assessment(
        instance,
        "P5",
        developmentCandidates(context, current.signal).length > 0,
        current.signal.value,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<DevelopmentState>(instance);
      return {
        step: {
          stepId: `${instance.instanceId}:develop`,
          capability: {
            capabilityId: `develop_${current.signal.definitionId}`,
            semanticActionTypes: current.signal.semanticActionTypes,
            requiredSourceDefinitionIds: [current.signal.definitionId],
          },
          target: { kind: "card", id: current.signal.definitionId },
          purpose: `Develop ${current.signal.definitionId} for ${current.signal.purposeCode ?? "assigned domain plan"}.`,
        },
        candidates: developmentCandidates(context, current.signal),
      };
    },
  };
}

function runWindowModule(): PlanModule {
  return {
    moduleId: "runner.convert_run_window",
    side: "runner",
    discover: (context) =>
      domain(context).runWindows.map((signal) =>
        proposal(
          "runner.convert_run_window",
          signal.windowId,
          { kind: "run_window", signal } satisfies RunWindowState,
          "P3",
          [],
          { kind: "window", id: signal.windowId },
          runWindowCandidates(context, signal).length > 0,
          signal.evidenceCode,
          signal.rootPlanInstanceId,
        ),
      ),
    assess: (instance, context, portfolio) => {
      const current = state<RunWindowState>(instance);
      return assessment(
        instance,
        "P3",
        runWindowCandidates(context, current.signal).length > 0,
        100,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<RunWindowState>(instance);
      return {
        step: {
          stepId: `${instance.instanceId}:convert`,
          capability: {
            capabilityId: current.signal.purposeCode,
            semanticActionTypes: current.signal.semanticActionTypes,
          },
          ...(current.signal.serverId
            ? {
                target: {
                  kind: "server" as const,
                  id: current.signal.serverId,
                },
              }
            : {}),
          purpose: `Convert run window ${current.signal.windowId}.`,
        },
        candidates: runWindowCandidates(context, current.signal),
      };
    },
  };
}

function proposal(
  moduleId: PlanProposal["moduleId"],
  dedupeKey: string,
  moduleState: unknown,
  priorityClass: PriorityClass,
  strategyLineIds: string[],
  target: NonNullable<PlanProposal["target"]>,
  routeExists: boolean,
  evidenceCode: string,
  parentInstanceId?: string,
): PlanProposal {
  return {
    moduleId,
    moduleVersion: "1",
    dedupeKey,
    side: "runner",
    strategyLineIds,
    executionClass:
      priorityClass === "P1" || priorityClass === "P2"
        ? "urgent_response"
        : priorityClass === "P3"
          ? "bounded_sequence"
          : "strategic_campaign",
    initialViability: routeExists ? "ready" : "blocked",
    persistencePolicy:
      priorityClass === "P1" || priorityClass === "P3"
        ? "locked_sequence"
        : "sticky_goal",
    retentionPolicy: {
      blockedStateVersionTtl: 2,
      dormantStateVersionTtl: 2,
      completedHistoryStateVersionTtl: 4,
      abandonWhenTargetMissing: true,
      protectedWhileNeedOpen: true,
      protectedWhileCommitted: true,
    },
    target,
    ...(parentInstanceId ? { parentInstanceId } : {}),
    phase: "execute",
    milestone: "admitted",
    moduleState: structuredClone(moduleState),
    blockers: routeExists
      ? []
      : [
          {
            code: "no_current_tactical_route",
            owner: "plan_module",
            removable: true,
            resumeCondition: { code: "route_becomes_available" },
          },
        ],
    resumeConditions: [{ code: "route_becomes_available" }],
    completionConditions: [{ code: "purpose_converted" }],
    abandonmentConditions: [
      { code: "target_invalidated" },
      { code: "marginal_value_exhausted" },
    ],
    evidenceRefs: [{ code: evidenceCode, source: "visible_state" }],
  };
}

function assessment(
  instance: PlanInstance,
  priorityClass: "P1" | "P2" | "P3" | "P4" | "P5",
  routeExists: boolean,
  value: number,
  executorId: string | undefined,
  p2Reason: "score_threat" | undefined = undefined,
): PlanAssessment {
  const claim: PriorityClaim =
    priorityClass === "P1"
      ? {
          requestedClass: "P1",
          reasonCode: "terminal_win",
          horizon: "current_turn",
          witness: {
            kind: "terminal_path",
            evidenceCode:
              instance.evidenceRefs[0]?.code ?? "rules_proven_terminal_path",
            guarantee: "rules_proven",
            ...(instance.target ? { target: instance.target } : {}),
          },
        }
      : priorityClass === "P2"
        ? {
            requestedClass: "P2",
            reasonCode: p2Reason ?? "irreversible_threat",
            horizon: "current_turn",
            witness: {
              kind:
                p2Reason === "score_threat"
                  ? "score_threat"
                  : "irreversible_threat",
              evidenceCode: instance.evidenceRefs[0]?.code ?? "visible_threat",
              guarantee: "visible_state_forced",
              ...(instance.target ? { target: instance.target } : {}),
            },
          }
        : priorityClass === "P3"
          ? {
              requestedClass: "P3",
              reasonCode: "expiring_conversion",
              horizon: "current_window",
            }
          : priorityClass === "P4"
            ? {
                requestedClass: "P4",
                reasonCode: "strategic_campaign",
                horizon: "multi_turn",
              }
            : {
                requestedClass: "P5",
                reasonCode: "development_need",
                horizon: "multi_turn",
              };
  return {
    instanceId: instance.instanceId,
    side: "runner",
    priorityClaim: claim,
    intentFit:
      priorityClass === "P4" || priorityClass === "P5" ? "aligned" : "none",
    readiness: routeExists ? "executable_now" : "blocked",
    ...(routeExists
      ? {
          nextStepPreview: {
            stepId: `${instance.instanceId}:execute`,
            capability: instance.moduleId,
            purpose: "Execute admitted tactical purpose.",
          },
        }
      : {}),
    feasibility: {
      currentRouteHeadPossible: routeExists,
      projectedActionCount: routeExists ? 1 : 0,
      opponentCanReact: priorityClass !== "P3",
      confidence: "visible_state_forced",
    },
    resourceGaps: [],
    expectedOutcome: {
      outcomeKind: "tactical_progress",
      minimumValue: routeExists ? value : 0,
      expectedValue: routeExists ? value : 0,
      maximumValue: routeExists ? value : 0,
      terminal: false,
      guarantee: "visible_state_forced",
    },
    continuity: {
      isCurrentForeground: executorId === instance.instanceId,
      sameObjectiveAsForeground: executorId === instance.instanceId,
      switchingCost: executorId === instance.instanceId ? 2 : 0,
      progressAtRisk: executorId === instance.instanceId ? 2 : 0,
    },
    blockers: routeExists ? [] : structuredClone(instance.blockers),
    withinClassValue: value,
    evidenceCodes: instance.evidenceRefs.map((entry) => entry.code),
  };
}

function pressureCandidates(
  context: PlanSchedulerContext,
  signal: RunnerPressureSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        ((candidate.semanticActionType === "run.start" &&
          candidate.runProjectionSummary?.serverId === signal.serverId) ||
          (candidate.semanticActionType === "play.runner_event" &&
            candidate.sourceDefinitionId !== undefined &&
            candidate.runProjectionSummary?.serverId === signal.serverId &&
            (signal.sourceDefinitionIds ?? []).includes(
              candidate.sourceDefinitionId,
            ))) &&
        signal.reachable &&
        signal.marginalValue > 0,
    )
    .map((candidate) => ({
      candidate,
      stepValue:
        signal.marginalValue +
        (candidate.semanticActionType === "play.runner_event" ? 5 : 0),
    }));
}

function remoteCandidates(
  context: PlanSchedulerContext,
  signal: RunnerRemoteContestSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        candidate.semanticActionType === "run.start" &&
        candidate.runProjectionSummary?.serverId === signal.serverId &&
        signal.reachable &&
        signal.marginalValue > 0,
    )
    .map((candidate) => ({ candidate, stepValue: signal.marginalValue }));
}

function developmentCandidates(
  context: PlanSchedulerContext,
  signal: RunnerDevelopmentSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        candidate.sourceDefinitionId === signal.definitionId &&
        signal.semanticActionTypes.includes(candidate.semanticActionType),
    )
    .map((candidate) => ({ candidate, stepValue: signal.value }));
}

function runWindowCandidates(
  context: PlanSchedulerContext,
  signal: RunnerRunWindowSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        signal.semanticActionTypes.includes(candidate.semanticActionType) &&
        (!signal.serverId ||
          candidate.runProjectionSummary?.serverId === signal.serverId ||
          candidate.semanticActionType.startsWith("access.")),
    )
    .map((candidate) => ({ candidate, stepValue: 100 }));
}

function terminalWinCandidates(
  context: PlanSchedulerContext,
  signal: RunnerTerminalWinSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        signal.semanticActionTypes.includes(candidate.semanticActionType) &&
        candidate.actionType === "end_turn",
    )
    .map((candidate) => ({ candidate, stepValue: 1 }));
}

function domain(context: PlanSchedulerContext): RunnerPlanDomain {
  const value = context.domain as RunnerPlanDomain | undefined;
  if (
    value?.terminalWins &&
    value.centralPressure &&
    value.remoteContests &&
    value.developments &&
    value.runWindows
  )
    return value;
  throw new PlanResolutionFailure("missing_plan_module_coverage", {
    side: context.input.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    legalActionTypes: context.input.legalActions.map((action) => action.type),
    owner: "plan_module",
    removalCondition:
      "Build the Runner tactical domain before discovering tactical plans.",
  });
}

function state<T>(instance: PlanInstance): T {
  return instance.moduleState as T;
}
