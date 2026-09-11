import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { remoteContestModule } from "../runner/remote-contest/remote-contest-plan-module";

import { centralPressureModule } from "../runner/central-pressure/central-pressure-plan-module";

import { createRunnerExposeInformationModule } from "../runner/expose-information/expose-information-plan-module";

import { developmentModule } from "../runner/hand-development/development-plan-module";

import { createRunnerTerminalWinModule } from "../runner/terminal-win/terminal-win-plan-module";

import { runnerRunExitAction } from "../runtime/runner-fort-pass-toll";

import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "./plan-scheduler";

import {
  runnerTacticalAssessment as assessment,
  domain,
  runnerTacticalProposal as proposal,
  state,
} from "./runner-tactical-module-support";

import {
  RunnerPlanDomain,
  RunnerRunAccessCommitmentSignal,
  RunnerRunWindowSignal,
} from "./runner-tactical-plan-contracts";

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
