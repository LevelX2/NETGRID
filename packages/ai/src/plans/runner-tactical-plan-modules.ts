import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { createRunnerExposeInformationModule } from "../runner/expose-information/expose-information-plan-module";
import { developmentModule } from "../runner/hand-development/development-plan-module";
import { createRunnerTerminalWinModule } from "../runner/terminal-win/terminal-win-plan-module";
import { runnerRunExitAction } from "../runtime/runner-fort-pass-toll";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "./plan-scheduler";
import type { PlanOutcomeReceipt } from "./resident-plan-portfolio";
import { runnerCardRunHasVisibleDifferentialPayoff } from "./runner-run-payoff";
import {
  runnerTacticalAssessment as assessment,
  domain,
  exactRunnerParentSupportResourceGaps,
  runnerTacticalProposal as proposal,
  state,
} from "./runner-tactical-module-support";
import {
  RunnerPlanDomain,
  RunnerPressureSignal,
  RunnerRemoteContestSignal,
  RunnerRunAccessCommitmentSignal,
  RunnerRunWindowSignal,
} from "./runner-tactical-plan-contracts";

import type { RunnerRunTargetEvaluation } from "../run-analysis/runner-run-target-types";

type PressureState = {
  kind: "central_pressure";
  signal: RunnerPressureSignal;
};
type RemoteState = {
  kind: "remote_contest";
  signal: RunnerRemoteContestSignal;
};
type RunWindowState = {
  kind: "run_window";
  signal: RunnerRunWindowSignal;
};

export function createRunnerTacticalPlanModules(): PlanModule[] {
  return [
    createRunnerTerminalWinModule(),
    centralPressureModule(),
    remoteContestModule(),
    developmentModule(),
    createRunnerExposeInformationModule(),
    runWindowModule(),
  ];
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
  if (
    (planDomain.terminalWins ?? []).some((signal) =>
      signal.actionIds?.includes(candidate.actionId),
    )
  ) {
    return "runner.secure_terminal_win";
  }
  if (candidate.semanticActionType === "turn_flow.end_turn") {
    return planDomain.terminalWins.length > 0
      ? "runner.secure_terminal_win"
      : undefined;
  }
  if (candidate.semanticActionType === "economy.gain_credit") {
    if (
      planDomain.defense.reactionReserveNeed?.actionIds.includes(
        candidate.actionId,
      ) === true
    ) {
      return "runner.defense_and_recovery";
    }
    if (
      planDomain.coverageGaps.some(
        (gap) => gap.answerInHand && (gap.fundingGap ?? 0) > 0,
      )
    ) {
      return "runner.rig_and_coverage";
    }
    return planDomain.fundingNeeds.some((need) => need.gap > 0)
      ? "runner.economy"
      : undefined;
  }
  if (
    planDomain.coverageGaps.some((gap) =>
      [
        ...gap.directSearchActionIds,
        ...(gap.rejectedSearchActionIds ?? []),
        ...gap.searchEngineSetupActionIds,
        ...gap.drawForAnswerActionIds,
      ].includes(candidate.actionId),
    )
  ) {
    return "runner.rig_and_coverage";
  }
  if (
    candidate.semanticActionType === "tag.remove" ||
    candidate.semanticActionType === "counter.remove_trace_tag" ||
    candidate.semanticActionType === "counter.remove_runner_hazard" ||
    planDomain.defense.handBufferActionIds?.includes(candidate.actionId) ===
      true ||
    candidate.semanticActionType.startsWith("damage.prevent")
  )
    return "runner.defense_and_recovery";
  if (
    planDomain.exposeInformation.some(
      (signal) =>
        (signal.actionIds ?? [signal.selectedActionId]).includes(
          candidate.actionId,
        ) || signal.rejectedActionIds.includes(candidate.actionId),
    )
  ) {
    return "runner.expose_information";
  }
  if (
    planDomain.runWindows.some(
      (window) => window.actionAssessments?.[candidate.actionId] !== undefined,
    )
  ) {
    return "runner.convert_run_window";
  }
  if (
    candidate.semanticActionType === "run.start" ||
    candidate.runProjectionSummary?.serverId !== undefined
  ) {
    if (planDomain.defense.forgoUnsafeRunCapacity) {
      return "runner.defense_and_recovery";
    }
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
      planDomain.centralPressure.some((signal) =>
        signal.preparationActionIds?.includes(candidate.actionId),
      )
    ) {
      return "runner.pressure_central";
    }
    if (
      planDomain.developments.some((signal) =>
        signal.actionIds.includes(candidate.actionId),
      )
    )
      return "runner.develop_board_and_hand";
  }
  if (candidate.semanticActionType === "draw.card") {
    if (
      planDomain.developments.some((signal) =>
        signal.actionIds.includes(candidate.actionId),
      )
    ) {
      return "runner.develop_board_and_hand";
    }
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
          (signal.supportNeedId !== undefined ||
            (signal.reachable && candidates.length > 0)) &&
            signal.marginalValue > 0,
          signal.evidenceCode,
          undefined,
          signal.routePreparation === "develop_payoff" ||
            signal.routePreparation === "convert_accumulated_pressure" ||
            signal.routePreparation === "targeted_bypass" ||
            signal.routePreparation === "targeted_ice_trash"
            ? {
                phase: "develop_payoff",
                blockerCode: "central_pressure_payoff_route_unavailable",
                evidenceCodes: [
                  `central_pressure_preparation_actions:${signal.preparationActionIds?.length ?? 0}`,
                ],
              }
            : undefined,
        );
      }),
    assess: (instance, context, portfolio) => {
      const current = state<PressureState>(instance);
      const candidates = pressureCandidates(context, current.signal);
      const routeExists =
        current.signal.reachable &&
        current.signal.marginalValue > 0 &&
        candidates.length > 0;
      const resourceGaps = exactRunnerParentSupportResourceGaps(
        context,
        instance,
        current.signal.supportNeedId,
        routeExists,
      );
      const result = assessment(
        instance,
        current.signal.priorityClass,
        routeExists,
        current.signal.marginalValue,
        portfolio.executorInstanceId,
        undefined,
        current.signal.routePreparation === "targeted_bypass"
          ? "belief_supported"
          : "visible_state_forced",
        resourceGaps,
      );
      if (!routeExists && current.signal.supportNeedId) {
        result.blockers = [
          {
            code: "waiting_for_bound_funding_support",
            owner: "plan_module",
            removable: true,
            resumeCondition: { code: current.signal.supportNeedId },
          },
        ];
      }
      return result;
    },
    materialize: (instance, _assessment, context) => {
      const current = state<PressureState>(instance);
      const candidates = pressureCandidates(context, current.signal);
      return {
        step: {
          stepId: `${instance.instanceId}:pressure:${current.signal.serverId}`,
          capability: {
            capabilityId:
              (current.signal.routePreparation === "develop_payoff" ||
                current.signal.routePreparation ===
                  "convert_accumulated_pressure" ||
                current.signal.routePreparation === "targeted_bypass" ||
                current.signal.routePreparation === "targeted_ice_trash") &&
              current.signal.sourceDefinitionIds?.[0]
                ? current.signal.routePreparation ===
                  "convert_accumulated_pressure"
                  ? "central_pressure_convert_accumulated_pressure"
                  : `develop_${current.signal.sourceDefinitionIds[0]}`
                : `pressure_${current.signal.serverId}_${current.signal.purpose}`,
            semanticActionTypes: [
              ...new Set(
                candidates.map(
                  (candidate) => candidate.candidate.semanticActionType,
                ),
              ),
            ],
            ...(current.signal.routePreparation === "targeted_bypass"
              ? {
                  requiredFunctionalEffects: [
                    {
                      kind: "future_run_effect" as const,
                      timing: "action" as const,
                      scope: "server" as const,
                      target: "make_run",
                    },
                    {
                      kind: "future_encounter_effect" as const,
                      timing: "during_run" as const,
                      scope: "ice" as const,
                      target: "bypass_chosen_ice",
                    },
                  ],
                }
              : current.signal.routePreparation === "develop_payoff" &&
                  current.signal.sourceDefinitionIds
                ? {
                    requiredSourceDefinitionIds:
                      current.signal.sourceDefinitionIds,
                  }
                : current.signal.routePreparation === "targeted_ice_trash" &&
                    current.signal.sourceDefinitionIds
                  ? {
                      requiredSourceDefinitionIds:
                        current.signal.sourceDefinitionIds,
                    }
                  : {}),
          },
          ...(current.signal.routePreparation ||
          (current.signal.runActionIds?.length ?? 0) > 0
            ? {}
            : {
                target: {
                  kind: "server" as const,
                  id: current.signal.serverId,
                },
              }),
          purpose:
            current.signal.routePreparation === "targeted_bypass"
              ? `Execute the preflighted targeted bypass route on ${current.signal.serverId}.`
              : current.signal.routePreparation === "targeted_ice_trash"
                ? `Remove the preflighted rezzed ICE target from ${current.signal.serverId}.`
                : current.signal.routePreparation ===
                    "convert_accumulated_pressure"
                  ? "Convert the accumulated multi-central pressure into its current action-denial payoff."
                  : current.signal.routePreparation === "develop_payoff"
                    ? `Develop ${current.signal.purpose} payoff for ${current.signal.serverId}.`
                    : `Execute ${current.signal.purpose} pressure on ${current.signal.serverId}.`,
        },
        candidates,
        ...(current.signal.routePreparation === "develop_payoff"
          ? {
              continuation: {
                continuationId: `${instance.instanceId}:access-payoff:${current.signal.serverId}`,
                trigger: "action_applied" as const,
                nextCapability: {
                  capabilityId: `pressure_${current.signal.serverId}_access`,
                  semanticActionTypes: ["run.start"],
                },
                target: {
                  kind: "server" as const,
                  id: current.signal.serverId,
                },
                purpose: `Convert the installed access payoff into pressure on ${current.signal.serverId}.`,
              },
            }
          : {}),
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
          remotePriority(signal),
          [],
          { kind: "server", id: signal.serverId },
          (signal.supportNeedId !== undefined ||
            (signal.reachable && candidates.length > 0)) &&
            signal.marginalValue > 0,
          signal.evidenceCode,
        );
      }),
    assess: (instance, context, portfolio) => {
      const current = state<RemoteState>(instance);
      const priorityClass = remotePriority(current.signal);
      const routeExists =
        current.signal.reachable &&
        current.signal.marginalValue > 0 &&
        remoteCandidates(context, current.signal).length > 0;
      const resourceGaps = exactRunnerParentSupportResourceGaps(
        context,
        instance,
        current.signal.supportNeedId,
        routeExists,
      );
      const result = assessment(
        instance,
        priorityClass,
        routeExists,
        current.signal.marginalValue,
        portfolio.executorInstanceId,
        current.signal.knownAgendaThreat || current.signal.terminalPatternThreat
          ? "score_threat"
          : undefined,
        current.signal.routePreparation === "targeted_bypass"
          ? "belief_supported"
          : current.signal.terminalPatternThreat
            ? "robust_but_reactive"
            : "visible_state_forced",
        resourceGaps,
      );
      if (priorityClass === "P4") {
        result.intentFit = "tactical_override";
      }
      if (!routeExists && current.signal.supportNeedId) {
        result.blockers = [
          {
            code: "waiting_for_bound_funding_support",
            owner: "plan_module",
            removable: true,
            resumeCondition: { code: current.signal.supportNeedId },
          },
        ];
      }
      return result;
    },
    materialize: (instance, _assessment, context) => {
      const current = state<RemoteState>(instance);
      const candidates = remoteCandidates(context, current.signal);
      return {
        step: {
          stepId: `${instance.instanceId}:contest`,
          capability: {
            capabilityId: "contest_remote",
            semanticActionTypes: [
              ...new Set(
                candidates.map(
                  (candidate) => candidate.candidate.semanticActionType,
                ),
              ),
            ],
          },
          ...(current.signal.routePreparation
            ? {}
            : {
                target: {
                  kind: "server" as const,
                  id: current.signal.serverId,
                },
              }),
          purpose: `Contest visible remote ${current.signal.serverId}.`,
        },
        candidates,
      };
    },
  };
}

function remotePriority(signal: RunnerRemoteContestSignal): "P2" | "P4" | "P6" {
  if (
    (signal.knownAgendaThreat || signal.terminalPatternThreat) &&
    signal.routePreparation !== "targeted_bypass"
  )
    return "P2";
  return signal.constrainedActionCapacity ? "P6" : "P4";
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
          signal.serverId &&
            signal.purposeCode === "continue_engine_restricted_run_sequence"
            ? { kind: "server", id: signal.serverId }
            : { kind: "window", id: signal.windowId },
          runWindowCandidates(context, signal).length > 0,
          signal.evidenceCode,
          signal.rootPlanInstanceId,
        ),
      ),
    assess: (instance, context, portfolio) => {
      const current = state<RunWindowState>(instance);
      const candidates = runWindowCandidates(context, current.signal);
      const value =
        current.signal.purposeCode === "continue_engine_restricted_run_sequence"
          ? candidates.length > 0
            ? Math.max(...candidates.map((entry) => entry.stepValue))
            : 0
          : 100;
      return assessment(
        instance,
        "P3",
        candidates.length > 0,
        value,
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

function pressureCandidates(
  context: PlanSchedulerContext,
  signal: RunnerPressureSignal,
): PlanMaterialization["candidates"] {
  if (
    signal.routePreparation === "develop_payoff" ||
    signal.routePreparation === "convert_accumulated_pressure" ||
    signal.routePreparation === "targeted_bypass" ||
    signal.routePreparation === "targeted_ice_trash"
  ) {
    const preparationActionIds = new Set(signal.preparationActionIds ?? []);
    return context.actionCandidates
      .filter((candidate) => preparationActionIds.has(candidate.actionId))
      .map((candidate) => ({
        candidate,
        stepValue: signal.marginalValue,
      }));
  }
  const exactDifferentialPayoffActionIds = new Set(
    signal.runActionDifferentialPayoffIds ?? [],
  );
  const runCandidates = context.actionCandidates.filter(
    (candidate) =>
      (signal.runActionIds?.length
        ? signal.runActionIds.includes(candidate.actionId)
        : (candidate.semanticActionType === "run.start" &&
            candidate.runProjectionSummary?.serverId === signal.serverId) ||
          (candidate.semanticActionType === "play.runner_event" &&
            candidate.sourceDefinitionId !== undefined &&
            candidate.runProjectionSummary?.serverId === signal.serverId &&
            (signal.sourceDefinitionIds ?? []).includes(
              candidate.sourceDefinitionId,
            ))) &&
      (signal.runActionExclusions?.[candidate.actionId]?.length ?? 0) === 0 &&
      signal.reachable &&
      signal.marginalValue > 0,
  );
  const directRunAvailable = runCandidates.some(
    (candidate) => candidate.semanticActionType === "run.start",
  );
  return runCandidates
    .filter(
      (candidate) =>
        candidate.semanticActionType !== "play.runner_event" ||
        !directRunAvailable ||
        exactDifferentialPayoffActionIds.has(candidate.actionId) ||
        runnerCardRunHasVisibleDifferentialPayoff(
          context.input,
          candidate,
          signal.serverId,
          domain(context).runTargetEvaluations,
        ),
    )
    .map((candidate) => ({
      candidate,
      stepValue:
        signal.marginalValue +
        runnerCardRunRoutePreference(
          context,
          candidate,
          signal.serverId,
          directRunAvailable,
          domain(context).runTargetEvaluations,
        ) +
        (signal.runActionValues?.[candidate.actionId] ?? 0),
    }));
}

function runnerCardRunRoutePreference(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
  serverId: RunnerPressureSignal["serverId"],
  directRunAvailable: boolean,
  runTargetEvaluations?: readonly RunnerRunTargetEvaluation[],
): number {
  if (candidate.semanticActionType !== "play.runner_event") return 0;
  if (
    !directRunAvailable ||
    runnerCardRunHasVisibleDifferentialPayoff(
      context.input,
      candidate,
      serverId,
      runTargetEvaluations,
    )
  ) {
    return 5;
  }
  const knownCreditCost =
    candidate.costProfile.costKnownStatus === "known" &&
    Number.isSafeInteger(candidate.costProfile.creditCost) &&
    candidate.costProfile.creditCost! >= 0
      ? candidate.costProfile.creditCost!
      : 0;
  return -1 - knownCreditCost;
}

function remoteCandidates(
  context: PlanSchedulerContext,
  signal: RunnerRemoteContestSignal,
): PlanMaterialization["candidates"] {
  if (
    signal.routePreparation === "expose_remote" ||
    signal.routePreparation === "prepare_access_payoff" ||
    signal.routePreparation === "targeted_bypass" ||
    signal.routePreparation === "targeted_ice_trash"
  ) {
    const preparationActionIds = new Set(signal.preparationActionIds ?? []);
    return context.actionCandidates
      .filter((candidate) => preparationActionIds.has(candidate.actionId))
      .map((candidate) => ({
        candidate,
        stepValue: signal.marginalValue,
      }));
  }
  return context.actionCandidates.flatMap((candidate) => {
    const assessment = signal.runActionAssessments[candidate.actionId];
    if (
      assessment?.verdict !== "executable" ||
      !signal.reachable ||
      signal.marginalValue <= 0
    ) {
      return [];
    }
    return [{ candidate, stepValue: assessment.stepValue }];
  });
}

function runWindowCandidates(
  context: PlanSchedulerContext,
  signal: RunnerRunWindowSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        signal.semanticActionTypes.includes(candidate.semanticActionType) &&
        signal.actionAssessments?.[candidate.actionId]?.admissible === true &&
        (!signal.serverId ||
          candidate.runProjectionSummary?.serverId === signal.serverId ||
          signal.actionAssessments?.[
            candidate.actionId
          ]?.evidenceCodes.includes(
            "runner_engine_restricted_run_sequence_continuation",
          ) === true ||
          signal.actionAssessments?.[
            candidate.actionId
          ]?.evidenceCodes.includes(
            "runner_post_pass_derez_and_end_run_plan_admissible",
          ) === true ||
          signal.actionAssessments?.[
            candidate.actionId
          ]?.evidenceCodes.includes(
            "runner_encounter_action_plan_admissible",
          ) === true ||
          signal.actionAssessments?.[
            candidate.actionId
          ]?.evidenceCodes.includes(
            "runner_run_window_action_plan_admissible",
          ) === true ||
          signal.actionAssessments?.[
            candidate.actionId
          ]?.evidenceCodes.includes("runner_optional_bonus_run_decline") ===
            true ||
          candidate.semanticActionType.startsWith("access.")),
    )
    .map((candidate) => ({
      candidate,
      stepValue: runWindowCandidateValue(
        context,
        candidate,
        signal.accessCommitment,
        signal.safetyIntent,
        signal.encounterIntent,
        signal.actionAssessments?.[candidate.actionId]?.value,
      ),
    }));
}

function runWindowCandidateValue(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
  commitment: RunnerRunAccessCommitmentSignal | undefined,
  safetyIntent?: RunnerRunWindowSignal["safetyIntent"],
  encounterIntent?: RunnerRunWindowSignal["encounterIntent"],
  assessedValue?: number,
): number {
  if (safetyIntent === "jack_out") {
    const action = context.input.legalActions.find(
      (entry) => entry.actionId === candidate.actionId,
    );
    if (action && runnerRunExitAction(action))
      return (assessedValue ?? 0) + 5_000;
    if (candidate.actionType === "continue_run")
      return (assessedValue ?? 0) - 5_000;
  }
  if (encounterIntent === "mitigate_threat" && assessedValue === undefined) {
    if (candidate.semanticActionType === "breaker.break_subroutine") return 450;
    if (candidate.semanticActionType === "breaker.boost_strength") return 350;
    if (candidate.actionType === "continue_run") return 0;
  }
  if (candidate.actionType === "steal_agenda") return 400;
  if (candidate.actionType === "start_run" && assessedValue !== undefined)
    return assessedValue;
  if (!commitment) return assessedValue ?? 100;
  if (commitment.intendedAction === "decline") {
    if (candidate.actionType === "decline_trash")
      return (assessedValue ?? 0) + 200;
    return candidate.actionType === "trash_accessed_card"
      ? (assessedValue ?? 0) - 200
      : (assessedValue ?? 100);
  }
  if (commitment.intendedAction !== "trash") return 100;
  const committedTrashCandidates = context.actionCandidates.filter(
    (entry) =>
      entry.actionType === "trash_accessed_card" &&
      entry.sourceDefinitionId !== undefined &&
      commitment.knownTargetDefinitionIds.includes(entry.sourceDefinitionId) &&
      typeof commitment.trashBudget === "number" &&
      actionCreditCost(entry) <= commitment.trashBudget,
  );
  if (candidate.actionType === "decline_trash") {
    return committedTrashCandidates.length > 0
      ? (assessedValue ?? 0) - 200
      : (assessedValue ?? 100);
  }
  return committedTrashCandidates.some(
    (entry) => entry.actionId === candidate.actionId,
  )
    ? (assessedValue ?? 0) + 200
    : (assessedValue ?? 100);
}

function actionCreditCost(candidate: ActionSemanticCandidate): number {
  return Math.max(0, candidate.costProfile.creditCost ?? 0);
}
