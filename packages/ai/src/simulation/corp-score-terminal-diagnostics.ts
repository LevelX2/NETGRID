import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";

import { assessCorpScoreTerminalWindow } from "../legacy/legacy-entrypoints";
import { rolesMatch } from "../runtime/role-match";
import type { AiSimulationSummary } from "./ai-simulation-summary";

export type CorpScoreTerminalChosenFamily =
  | "protection"
  | "economy"
  | "draw"
  | "install_ice"
  | "install_asset_or_upgrade"
  | "hq_protection"
  | "rnd_protection"
  | "remote_portfolio"
  | "unknown";

export type RolesForAction = (
  input: AiDecisionInput,
  action: LegalAction,
) => string[];

export function createCorpScoreTerminalChosenFamily(
  rolesForAction: RolesForAction,
) {
  return function corpScoreTerminalChosenFamily(
    input: AiDecisionInput,
    action: LegalAction,
  ): CorpScoreTerminalChosenFamily {
    if (action.type === "draw_card") return "draw";
    if (action.type === "gain_credit") return "economy";
    const roles = rolesForAction(input, action);
    if (rolesMatch(roles, ["economy"])) return "economy";
    if (
      action.type === "install_card" &&
      action.payload?.placement === "ice" &&
      action.payload?.serverId === "hq"
    )
      return "hq_protection";
    if (
      action.type === "install_card" &&
      action.payload?.placement === "ice" &&
      action.payload?.serverId === "rd"
    )
      return "rnd_protection";
    if (action.type === "install_card" && action.payload?.placement === "ice") {
      if (action.payload?.serverId === "new_remote") return "remote_portfolio";
      return "install_ice";
    }
    if (action.type === "install_card" && action.payload?.placement !== "ice") {
      if (action.payload?.serverId === "new_remote") return "remote_portfolio";
      if (
        roles.some(
          (role) =>
            role === "remote_support" ||
            role === "remote_protection" ||
            role === "upgrade" ||
            role === "run_tax" ||
            role === "steal_tax",
        )
      )
        return "protection";
      return "install_asset_or_upgrade";
    }
    if (
      action.type === "play_operation" ||
      action.type === "trigger_ability" ||
      action.type === "activated_card_ability"
    )
      return rolesMatch(roles, ["economy"]) ? "economy" : "unknown";
    return "unknown";
  };
}

export function createCorpScoreTerminalDiagnosticsForSimulationAction(
  corpScoreTerminalChosenFamily: ReturnType<
    typeof createCorpScoreTerminalChosenFamily
  >,
) {
  return function corpScoreTerminalDiagnosticsForSimulationAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): Partial<AiSimulationSummary["actionSequence"][number]> {
    if (input.side !== "corp" || action.side !== "corp") return {};
    const terminal = assessCorpScoreTerminalWindow(input);
    if (!terminal.terminalWindow) return {};
    const scoreActionIdSet = new Set(terminal.scoreActionIds);
    const advanceToScoreActionIdSet = new Set(terminal.advanceToScoreActionIds);
    const agendaInstallActionIdSet = new Set(terminal.agendaInstallActionIds);
    const scoreTaken = scoreActionIdSet.has(action.actionId);
    const advanceTaken = advanceToScoreActionIdSet.has(action.actionId);
    const agendaInstalled = agendaInstallActionIdSet.has(action.actionId);
    const taken = scoreTaken || advanceTaken || agendaInstalled;
    const skipped = !taken;
    const family = corpScoreTerminalChosenFamily(input, action);
    const fixGateBlocked =
      terminal.blockedByCheapContest ||
      terminal.blockedByCredits ||
      terminal.blockedByRunnerContest ||
      terminal.blockedByHqThreat;
    const suspiciousProtection =
      skipped && !fixGateBlocked && family === "protection";
    const suspiciousEconomy = skipped && !fixGateBlocked && family === "economy";
    const suspiciousDraw = skipped && !fixGateBlocked && family === "draw";
    const suspiciousRemotePortfolio =
      skipped && !fixGateBlocked && family === "remote_portfolio";
    const suspiciousUnknown =
      skipped &&
      !fixGateBlocked &&
      !suspiciousProtection &&
      !suspiciousEconomy &&
      !suspiciousDraw &&
      !suspiciousRemotePortfolio;
    return {
      corpScoreTerminalWindow: true,
      ...(terminal.scoreActionIds.length > 0
        ? { corpScoreTerminalWindowScoreLegal: true }
        : {}),
      ...(terminal.advanceToScoreActionIds.length > 0
        ? { corpScoreTerminalWindowAdvanceToScoreLegal: true }
        : {}),
      ...(terminal.agendaInstallActionIds.length > 0
        ? { corpScoreTerminalWindowAgendaInstallLegal: true }
        : {}),
      ...(terminal.protectedRemoteIds.length > 0
        ? { corpScoreTerminalWindowProtectedRemoteReady: true }
        : {}),
      ...(terminal.remoteContestLow
        ? { corpScoreTerminalWindowRemoteContestLow: true }
        : {}),
      ...(terminal.creditsSufficient
        ? { corpScoreTerminalWindowCreditsSufficient: true }
        : {}),
      ...(terminal.runnerAccessThreatHigh
        ? { corpScoreTerminalWindowRunnerAccessThreatHigh: true }
        : {}),
      ...(scoreTaken ? { corpScoreTerminalScoreTaken: true } : {}),
      ...(advanceTaken ? { corpScoreTerminalAdvanceTaken: true } : {}),
      ...(agendaInstalled ? { corpScoreTerminalAgendaInstalled: true } : {}),
      ...(skipped ? { corpScoreTerminalSkipped: true } : {}),
      ...(skipped && family === "protection"
        ? { corpScoreTerminalSkippedForProtection: true }
        : {}),
      ...(skipped && family === "economy"
        ? { corpScoreTerminalSkippedForEconomy: true }
        : {}),
      ...(skipped && family === "draw"
        ? { corpScoreTerminalSkippedForDraw: true }
        : {}),
      ...(skipped && family === "install_ice"
        ? { corpScoreTerminalSkippedForInstallIce: true }
        : {}),
      ...(skipped && family === "install_asset_or_upgrade"
        ? { corpScoreTerminalSkippedForInstallAssetOrUpgrade: true }
        : {}),
      ...(skipped && family === "hq_protection"
        ? { corpScoreTerminalSkippedForHqProtection: true }
        : {}),
      ...(skipped && family === "rnd_protection"
        ? { corpScoreTerminalSkippedForRndProtection: true }
        : {}),
      ...(skipped && family === "remote_portfolio"
        ? { corpScoreTerminalSkippedForRemotePortfolio: true }
        : {}),
      ...(skipped && family === "unknown"
        ? { corpScoreTerminalSkippedForUnknownHigherPriority: true }
        : {}),
      ...(terminal.blockedByCheapContest
        ? { corpScoreConversionFixGateBlockedByCheapContest: true }
        : {}),
      ...(terminal.blockedByCredits
        ? { corpScoreConversionFixGateBlockedByCredits: true }
        : {}),
      ...(terminal.blockedByRunnerContest
        ? { corpScoreConversionFixGateBlockedByRunnerContest: true }
        : {}),
      ...(terminal.blockedByHqThreat
        ? { corpScoreConversionFixGateBlockedByHqThreat: true }
        : {}),
      ...(suspiciousProtection
        ? {
            corpScoreConversionFixGateEligible: true,
            corpScoreConversionFixGateSuspiciousProtectionLoop: true,
          }
        : {}),
      ...(suspiciousEconomy
        ? {
            corpScoreConversionFixGateEligible: true,
            corpScoreConversionFixGateSuspiciousEconomyLoop: true,
          }
        : {}),
      ...(suspiciousDraw
        ? {
            corpScoreConversionFixGateEligible: true,
            corpScoreConversionFixGateSuspiciousDraw: true,
          }
        : {}),
      ...(suspiciousRemotePortfolio
        ? {
            corpScoreConversionFixGateEligible: true,
            corpScoreConversionFixGateSuspiciousRemotePortfolio: true,
          }
        : {}),
      ...(suspiciousUnknown
        ? {
            corpScoreConversionFixGateEligible: true,
            corpScoreConversionFixGateSuspiciousUnknown: true,
          }
        : {}),
      corpScoreTerminalEvidence: terminal.evidence,
    };
  };
}
