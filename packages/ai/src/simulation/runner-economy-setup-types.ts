import type { LegalAction } from "@netgrid/shared";

export type RunnerEconomySetupActionClass = {
  economy: boolean;
  burstEconomy: boolean;
  actionEconomy: boolean;
  finitePoolEconomy: boolean;
  loanDebtEconomy: boolean;
  recurringEconomy: boolean;
  resourceEconomy: boolean;
  hardwareEconomy: boolean;
  memoryHardware: boolean;
  handSizeSupport: boolean;
  search: boolean;
  recovery: boolean;
  downsideEconomy: boolean;
  delayedPenaltyEconomy: boolean;
};

export type RunnerEconomySkipReason =
  | "pressure"
  | "remote_contest"
  | "setup"
  | "draw"
  | "run"
  | "install_breaker"
  | "trash"
  | "end_turn"
  | "unknown_higher_priority";

export function runnerEconomySkipReasonForDiagnostics(context: {
  action: LegalAction;
  draw: boolean;
  runAction: boolean;
  setupAction: boolean;
  installableBreaker: boolean;
  remoteTrashAvailable: boolean;
  advancedRemoteContestSkipped: boolean;
  freshPressureAvailable: boolean;
}): RunnerEconomySkipReason {
  if (context.advancedRemoteContestSkipped) return "remote_contest";
  if (
    context.action.type === "trash_accessed_card" ||
    context.remoteTrashAvailable
  )
    return "trash";
  if (context.installableBreaker && context.action.type === "install_card")
    return "install_breaker";
  if (context.setupAction) return "setup";
  if (context.draw) return "draw";
  if (context.runAction && context.freshPressureAvailable) return "pressure";
  if (context.runAction) return "run";
  if (context.action.type === "end_turn") return "end_turn";
  return "unknown_higher_priority";
}
