import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";

import { assessCorpScoreTerminalWindow } from "../legacy/legacy-planner-entrypoints";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import type { CorpScoreTerminalChosenFamily } from "./corp-score-terminal-diagnostics";

export type CorpScoreTerminalChosenFamilyForAction = (
  input: AiDecisionInput,
  action: LegalAction,
) => CorpScoreTerminalChosenFamily;

export function createCorpEconomyBeforeScoreDiagnosticsForSimulationAction(
  corpScoreTerminalChosenFamily: CorpScoreTerminalChosenFamilyForAction,
) {
  return function corpEconomyBeforeScoreDiagnosticsForSimulationAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): Partial<AiSimulationSummary["actionSequence"][number]> {
    if (input.side !== "corp" || action.side !== "corp") return {};
    const terminal = assessCorpScoreTerminalWindow(input);
    if (!terminal.terminalWindow) return {};
    const family = corpScoreTerminalChosenFamily(input, action);
    const economyTaken = family === "economy";
    const hasInstalledAgenda =
      terminal.scoreActionIds.length > 0 ||
      terminal.advanceToScoreActionIds.length > 0;
    const hasAdvancedAgenda = hasInstalledAgenda;
    const scoreLegal = terminal.scoreActionIds.length > 0;
    const advanceToScoreLegal = terminal.advanceToScoreActionIds.length > 0;
    const agendaInstallReadyRemoteLegal =
      terminal.agendaInstallActionIds.length > 0 &&
      terminal.protectedRemoteIds.length > 0;
    const fixGateBlockedBySafety = terminal.blockedByHqThreat;
    const fixGateBlocked =
      terminal.blockedByCredits ||
      terminal.blockedByCheapContest ||
      terminal.blockedByRunnerContest ||
      fixGateBlockedBySafety;
    const creditsNeeded = economyTaken && terminal.blockedByCredits;
    const creditsAlreadyEnough = !terminal.blockedByCredits;
    const suspiciousCreditsAlreadyEnough =
      economyTaken && creditsAlreadyEnough && !fixGateBlocked;
    const suspiciousDelayedTerminalAction =
      economyTaken &&
      !fixGateBlocked &&
      (scoreLegal || advanceToScoreLegal || agendaInstallReadyRemoteLegal);
    const suspiciousRemoteStillSafe =
      economyTaken && !fixGateBlocked && terminal.protectedRemoteIds.length > 0;
    const unclassified =
      economyTaken &&
      !creditsNeeded &&
      !suspiciousCreditsAlreadyEnough &&
      !suspiciousDelayedTerminalAction &&
      !suspiciousRemoteStillSafe &&
      !fixGateBlocked;
    const evidence = [
      "corp_economy_before_score_diagnostic_window:true",
      `corp_economy_before_score_score_legal:${scoreLegal}`,
      `corp_economy_before_score_advance_to_score_legal:${advanceToScoreLegal}`,
      `corp_economy_before_score_agenda_install_ready_remote_legal:${agendaInstallReadyRemoteLegal}`,
      `corp_economy_before_score_credits_short:${terminal.blockedByCredits}`,
      `corp_economy_before_score_credits_already_enough:${creditsAlreadyEnough}`,
      `corp_economy_before_score_remote_safe:${terminal.protectedRemoteIds.length > 0}`,
      `corp_economy_before_score_runner_contest_high:${terminal.blockedByRunnerContest}`,
    ];

    return {
      corpEconomyBeforeScoreDiagnosticWindow: true,
      ...(hasInstalledAgenda
        ? { corpEconomyBeforeScoreWindowWithInstalledAgenda: true }
        : {}),
      ...(hasAdvancedAgenda
        ? { corpEconomyBeforeScoreWindowWithAdvancedAgenda: true }
        : {}),
      ...(scoreLegal
        ? { corpEconomyBeforeScoreWindowWithScoreLegalNext: true }
        : {}),
      ...(advanceToScoreLegal
        ? { corpEconomyBeforeScoreWindowWithAdvanceToScoreLegalNext: true }
        : {}),
      ...(terminal.protectedRemoteIds.length > 0
        ? {
            corpEconomyBeforeScoreWindowWithReadyRemote: true,
            corpEconomyBeforeScoreWindowRemoteSafe: true,
          }
        : {}),
      ...(agendaInstallReadyRemoteLegal
        ? { corpEconomyBeforeScoreWindowWithAgendaInHqAndReadyRemote: true }
        : {}),
      ...(terminal.blockedByCredits
        ? { corpEconomyBeforeScoreWindowCreditsShort: true }
        : { corpEconomyBeforeScoreWindowCreditsAlreadyEnough: true }),
      ...(terminal.blockedByRunnerContest
        ? { corpEconomyBeforeScoreWindowRemoteContestHigh: true }
        : {}),
      ...(economyTaken ? { corpEconomyBeforeScoreTaken: true } : {}),
      ...(creditsNeeded
        ? {
            corpEconomyBeforeScoreTakenAsNecessaryCredits: true,
            corpEconomyBeforeScorePlausibleCreditsNeeded: true,
            corpEconomyBeforeScorePlausibleRezOrAdvanceReserve: true,
          }
        : {}),
      ...(economyTaken && creditsAlreadyEnough
        ? { corpEconomyBeforeScoreTakenDespiteCreditsEnough: true }
        : {}),
      ...(economyTaken && scoreLegal
        ? { corpEconomyBeforeScoreTakenOverScoreLegal: true }
        : {}),
      ...(economyTaken && advanceToScoreLegal
        ? { corpEconomyBeforeScoreTakenOverAdvanceToScoreLegal: true }
        : {}),
      ...(economyTaken && agendaInstallReadyRemoteLegal
        ? { corpEconomyBeforeScoreTakenOverAgendaInstallReadyRemote: true }
        : {}),
      ...(economyTaken && agendaInstallReadyRemoteLegal
        ? { corpEconomyBeforeScoreTakenOverHqAgendaExit: true }
        : {}),
      ...(terminal.blockedByHqThreat
        ? { corpEconomyBeforeScorePlausibleHqOrRndSafety: true }
        : {}),
      ...(terminal.blockedByRunnerContest
        ? { corpEconomyBeforeScorePlausibleRunnerContestTooHigh: true }
        : {}),
      ...(economyTaken &&
      !scoreLegal &&
      !advanceToScoreLegal &&
      !agendaInstallReadyRemoteLegal
        ? { corpEconomyBeforeScorePlausibleNoAgendaExit: true }
        : {}),
      ...(suspiciousCreditsAlreadyEnough
        ? { corpEconomyBeforeScoreSuspiciousCreditsAlreadyEnough: true }
        : {}),
      ...(suspiciousDelayedTerminalAction
        ? { corpEconomyBeforeScoreSuspiciousDelayedTerminalAction: true }
        : {}),
      ...(suspiciousRemoteStillSafe
        ? { corpEconomyBeforeScoreSuspiciousRemoteStillSafe: true }
        : {}),
      ...(unclassified ? { corpEconomyBeforeScoreUnclassified: true } : {}),
      ...(terminal.blockedByCredits
        ? { corpEconomyBeforeScoreFixGateBlockedByCredits: true }
        : {}),
      ...(terminal.blockedByCheapContest
        ? { corpEconomyBeforeScoreFixGateBlockedByCheapContest: true }
        : {}),
      ...(terminal.blockedByRunnerContest
        ? { corpEconomyBeforeScoreFixGateBlockedByRunnerContest: true }
        : {}),
      ...(fixGateBlockedBySafety
        ? { corpEconomyBeforeScoreFixGateBlockedBySafety: true }
        : {}),
      ...(economyTaken && !fixGateBlocked
        ? {
            corpEconomyBeforeScoreFixGateEligible: true,
            corpEconomyBeforeScoreFixGateSuspicious:
              suspiciousCreditsAlreadyEnough ||
              suspiciousDelayedTerminalAction ||
              suspiciousRemoteStillSafe,
          }
        : {}),
      corpEconomyBeforeScoreEvidence: evidence,
    };
  };
}
