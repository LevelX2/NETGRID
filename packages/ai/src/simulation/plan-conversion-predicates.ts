import { centralServerId, isRemoteServerTarget } from "../runtime/server-target";

export type PlanConversionDecisionEntry = {
  side?: string;
  actionType?: string;
  targetCardType?: string;
  installPlacement?: string;
  targetServerId?: string;
  advancementCountersAdded?: number;
  reasonCode?: string;
  runnerDrawAction?: boolean;
  runnerEconomyActionTaken?: boolean;
  runnerCreditsBefore?: number;
  runnerCreditsAfter?: number;
  runnerReserveTarget?: number;
  runnerReservePreservingEconomy?: boolean;
  runnerRelevantRemoteTrashTaken?: boolean;
  runnerHandUseActionTaken?: boolean;
  runnerRigInstallAction?: boolean;
  runnerLowValueDuplicateInstallAction?: boolean;
  evidence?: readonly string[];
};

const NON_STRATEGIC_ACTION_TYPES = [
  "continue_run",
  "access_card",
  "mandatory_draw",
  "pump_breaker",
  "break_subroutine",
  "decline_rez",
  "approach_ice",
  "encounter_ice",
];

const RUNNER_STRATEGIC_ACTION_TYPES = [
  "install_card",
  "play_event",
  "start_run",
  "gain_credit",
  "draw_card",
  "trash_accessed_card",
  "jack_out",
  "activated_card_ability",
  "trigger_ability",
  "end_turn",
];

const CORP_STRATEGIC_ACTION_TYPES = [
  "score_agenda",
  "advance_card",
  "install_card",
  "play_operation",
  "gain_credit",
  "draw_card",
  "rez_ice",
  "activated_card_ability",
  "trigger_ability",
  "end_turn",
];

export function isStrategicPlanDecision(
  entry: PlanConversionDecisionEntry,
): boolean {
  if (NON_STRATEGIC_ACTION_TYPES.includes(entry.actionType ?? ""))
    return false;
  if (entry.actionType === "resolve_choice")
    return (
      entry.advancementCountersAdded !== undefined ||
      entry.runnerRelevantRemoteTrashTaken === true ||
      entry.runnerHandUseActionTaken === true
    );
  if (entry.side === "runner") {
    return RUNNER_STRATEGIC_ACTION_TYPES.includes(entry.actionType ?? "");
  }
  return CORP_STRATEGIC_ACTION_TYPES.includes(entry.actionType ?? "");
}

export function ownStrategicWindow<T extends PlanConversionDecisionEntry>(
  sequence: T[],
  index: number,
  ownDecisions: number,
): T[] {
  const side = sequence[index]?.side;
  if (!side) return [];
  const window: T[] = [];
  for (let cursor = index + 1; cursor < sequence.length; cursor += 1) {
    const entry = sequence[cursor]!;
    if (entry.side !== side) continue;
    if (!isStrategicPlanDecision(entry)) continue;
    window.push(entry);
    if (window.length >= ownDecisions) break;
  }
  return window;
}

export function previousOwnStrategicWindow<
  T extends PlanConversionDecisionEntry,
>(sequence: T[], index: number, ownDecisions: number): T[] {
  const side = sequence[index]?.side;
  if (!side) return [];
  const window: T[] = [];
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const entry = sequence[cursor]!;
    if (entry.side !== side) continue;
    if (!isStrategicPlanDecision(entry)) continue;
    window.push(entry);
    if (window.length >= ownDecisions) break;
  }
  return window;
}

export function isCorpProtectionScoreConversionAction(
  entry: PlanConversionDecisionEntry,
): boolean {
  return (
    entry.side === "corp" &&
    (entry.actionType === "score_agenda" ||
      entry.actionType === "advance_card" ||
      (entry.actionType === "install_card" &&
        entry.targetCardType === "agenda"))
  );
}

export function isCorpRemoteProtectionActionEntry(
  entry: PlanConversionDecisionEntry,
): boolean {
  return (
    entry.side === "corp" &&
    (hasPlanConversionEvidenceFlag(
      entry,
      "corp_unsafe_remote_converted_to_protection:true",
    ) ||
      hasPlanConversionEvidenceFlag(
        entry,
        "corp_protection_chosen_before_unsafe_agenda_install:true",
      ) ||
      (entry.actionType === "install_card" &&
        entry.installPlacement === "ice" &&
        Boolean(entry.targetServerId?.startsWith("remote_"))))
  );
}

export function isRunnerRigProgressAction(
  entry: PlanConversionDecisionEntry,
): boolean {
  return (
    entry.side === "runner" &&
    entry.runnerRigInstallAction === true &&
    entry.runnerLowValueDuplicateInstallAction !== true
  );
}

export function isRunnerSetupAction(
  entry: PlanConversionDecisionEntry,
): boolean {
  if (entry.side !== "runner") return false;
  return (
    entry.runnerDrawAction === true ||
    entry.actionType === "draw_card" ||
    entry.reasonCode?.includes("setup") === true ||
    entry.reasonCode?.includes("search") === true
  );
}

export function isRunnerEconomyProgressAction(
  entry: PlanConversionDecisionEntry,
): boolean {
  if (entry.side !== "runner" || entry.runnerEconomyActionTaken !== true)
    return false;
  const before = entry.runnerCreditsBefore;
  const after = entry.runnerCreditsAfter;
  if (typeof before !== "number" || typeof after !== "number") return false;
  if (after <= before) return false;
  const reserve = entry.runnerReserveTarget;
  if (entry.runnerReservePreservingEconomy === true) return true;
  if (typeof reserve === "number" && before < reserve && after >= reserve)
    return true;
  return after - before >= 3;
}

export function isCorpRemoteBuildAction(
  entry: PlanConversionDecisionEntry,
): boolean {
  return (
    entry.side === "corp" &&
    isRemoteServerTarget(entry.targetServerId) &&
    (entry.actionType === "install_card" || entry.actionType === "rez_ice")
  );
}

export function isRunnerRemoteContestRun(
  entry: PlanConversionDecisionEntry,
): boolean {
  return (
    entry.side === "runner" &&
    entry.actionType === "start_run" &&
    isRemoteServerTarget(entry.targetServerId)
  );
}

export function isRunnerCentralPressureAction(
  entry: PlanConversionDecisionEntry,
): boolean {
  return (
    entry.side === "runner" &&
    entry.actionType === "start_run" &&
    centralServerId(entry.targetServerId) !== undefined
  );
}

export function remoteTargetsMatch(
  first: PlanConversionDecisionEntry,
  second: PlanConversionDecisionEntry,
): boolean {
  if (!isRemoteServerTarget(first.targetServerId)) return false;
  return serverTargetsMatch(first, second);
}

export function serverTargetsMatch(
  first: PlanConversionDecisionEntry,
  second: PlanConversionDecisionEntry,
): boolean {
  if (!first.targetServerId || !second.targetServerId) return true;
  return first.targetServerId === second.targetServerId;
}

function hasPlanConversionEvidenceFlag(
  entry: PlanConversionDecisionEntry,
  flag: string,
): boolean {
  return (entry.evidence ?? []).includes(flag);
}
