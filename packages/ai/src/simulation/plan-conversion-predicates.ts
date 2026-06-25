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

export function nextEntries<T>(
  sequence: T[],
  index: number,
  windowActions = 3,
): T[] {
  return sequence.slice(index + 1, index + windowActions + 1);
}

export function hasMeaningfulProgressWithin<T>(
  sequence: T[],
  index: number,
  windowActions: number,
  isMeaningfulProgress: (entry: T) => boolean,
): boolean {
  return sequence
    .slice(index, index + windowActions + 1)
    .some(isMeaningfulProgress);
}

export function actionsUntil<T>(
  sequence: T[],
  index: number,
  predicate: (entry: T) => boolean,
): number | undefined {
  for (
    let candidateIndex = index;
    candidateIndex < sequence.length;
    candidateIndex += 1
  ) {
    if (predicate(sequence[candidateIndex]!)) return candidateIndex - index;
  }
  return undefined;
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

export function planKindForConversion(
  entry: PlanConversionDecisionEntry,
): string | undefined {
  const explicitPlan = entry.reasonCode?.match(
    /^(?:runner|corp)\.plan\.([a-z0-9_]+)/i,
  )?.[1];
  if (explicitPlan) return explicitPlan;
  if (isRunnerSetupAction(entry)) return "setup";
  if (isRunnerEconomyProgressAction(entry)) return "economy";
  if (isRunnerRigProgressAction(entry)) return "rig";
  if (isCorpRemoteBuildAction(entry)) return "remote_build";
  if (isCorpRemoteAdvancementProgressForPlan(entry)) return "advance";
  if (isRunnerRemoteContestRun(entry)) return "remote_contest";
  if (isRunnerCentralPressureAction(entry)) return "central_pressure";
  return undefined;
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

function isCorpRemoteAdvancementProgressForPlan(
  entry: PlanConversionDecisionEntry,
): boolean {
  if (entry.side !== "corp") return false;
  if (!isRemoteServerTarget(entry.targetServerId)) return false;
  if (entry.actionType === "advance_card") return true;
  return (entry.advancementCountersAdded ?? 0) > 0;
}

function hasPlanConversionEvidenceFlag(
  entry: PlanConversionDecisionEntry,
  flag: string,
): boolean {
  return (entry.evidence ?? []).includes(flag);
}
