import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { centralPressureModule } from "../runner/central-pressure/central-pressure-plan-module";
import { createRunnerExposeInformationModule } from "../runner/expose-information/expose-information-plan-module";
import { developmentModule } from "../runner/hand-development/development-plan-module";
import { remoteContestModule } from "../runner/remote-contest/remote-contest-plan-module";
import { runWindowModule } from "../runner/run-window/run-window-plan-module";
import { createRunnerTerminalWinModule } from "../runner/terminal-win/terminal-win-plan-module";
import type { PlanModule } from "./plan-scheduler";
import { RunnerPlanDomain } from "./runner-tactical-plan-contracts";

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
