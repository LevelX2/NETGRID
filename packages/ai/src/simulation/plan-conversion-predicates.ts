import { centralServerId, isRemoteServerTarget } from "../runtime/server-target";

export type PlanConversionDecisionEntry = {
  side?: string;
  actionType?: string;
  targetCardType?: string;
  installPlacement?: string;
  targetServerId?: string;
  advancementCountersAdded?: number;
  protectedFinalAdvance?: boolean;
  protectBeforeAdvance?: boolean;
  reasonCode?: string;
  runnerDrawAction?: boolean;
  runnerEconomyActionTaken?: boolean;
  runnerCreditsBefore?: number;
  runnerCreditsAfter?: number;
  runnerReserveTarget?: number;
  runnerReservePreservingEconomy?: boolean;
  runnerRelevantRemoteTrashTaken?: boolean;
  runnerRemoteTrashTaken?: boolean;
  runnerHandUseActionTaken?: boolean;
  runnerRigInstallAction?: boolean;
  runnerLowValueDuplicateInstallAction?: boolean;
  runnerCentralRunWithMultiaccess?: boolean;
  runnerCentralRunWithInterfaceInstalled?: boolean;
  runnerCentralRunEventWithGoodTarget?: boolean;
  runnerRepeatedCentralRunWithFreshValue?: boolean;
  runnerCentralCloseoutRunTaken?: boolean;
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

export function nextEntriesForSide<T extends { side?: string }>(
  sequence: T[],
  index: number,
  side: string,
  ownActionWindow: number,
): T[] {
  const entries: T[] = [];
  for (
    let candidateIndex = index + 1;
    candidateIndex < sequence.length;
    candidateIndex += 1
  ) {
    const candidate = sequence[candidateIndex]!;
    if (candidate.side !== side) continue;
    entries.push(candidate);
    if (entries.length >= ownActionWindow) break;
  }
  return entries;
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

export function scorePathFollowsCorpProtection<
  T extends PlanConversionDecisionEntry,
>(sequence: T[], index: number): boolean {
  const entry = sequence[index];
  if (!entry || entry.side !== "corp") return false;
  if (!isCorpProtectionScoreConversionAction(entry)) return false;
  return previousOwnStrategicWindow(sequence, index, 3).some(
    isCorpRemoteProtectionActionEntry,
  );
}

export function corpCompressionActionLeadsToScoreLine<
  T extends PlanConversionDecisionEntry,
>(sequence: T[], index: number, ownDecisions: number): boolean {
  const entry = sequence[index];
  if (!entry || entry.side !== "corp") return false;
  if (
    entry.actionType === "score_agenda" ||
    entry.actionType === "advance_card" ||
    (entry.actionType === "install_card" && entry.targetCardType === "agenda")
  )
    return true;
  return ownStrategicWindow(sequence, index, ownDecisions).some(
    isCorpProtectionScoreConversionAction,
  );
}

export function runnerStealsBeforeNextCorpScore<
  T extends PlanConversionDecisionEntry,
>(sequence: T[], index: number): boolean {
  for (let cursor = index + 1; cursor < sequence.length; cursor += 1) {
    const entry = sequence[cursor]!;
    if (entry.side === "corp" && entry.actionType === "score_agenda")
      return false;
    if (entry.side === "runner" && entry.actionType === "steal_agenda")
      return true;
  }
  return false;
}

export function corpRemoteCreatedConverts<
  T extends PlanConversionDecisionEntry,
>(sequence: T[], index: number, ownDecisions: number): boolean {
  return (
    corpRemoteCreatedConvertsTo(sequence, index, ownDecisions, "agenda") ||
    corpRemoteCreatedConvertsTo(sequence, index, ownDecisions, "asset") ||
    corpRemoteCreatedConvertsTo(sequence, index, ownDecisions, "bait")
  );
}

export function corpRemoteCreatedConvertsTo<
  T extends PlanConversionDecisionEntry,
>(
  sequence: T[],
  index: number,
  ownDecisions: number,
  target: "agenda" | "asset" | "bait",
): boolean {
  return ownStrategicWindow(sequence, index, ownDecisions)
    .filter((entry) => entry.side === "corp")
    .some((entry) => {
      if (target === "agenda") {
        return (
          entry.actionType === "score_agenda" ||
          entry.actionType === "advance_card" ||
          entry.targetCardType === "agenda" ||
          hasPlanConversionEvidenceFlag(
            entry,
            "corp_agenda_installed_in_protected_remote:true",
          )
        );
      }
      if (target === "bait") {
        return (
          entry.reasonCode?.includes("bait") === true ||
          hasPlanConversionEvidenceFlag(entry, "plan:bait_runner")
        );
      }
      return (
        entry.actionType === "install_card" &&
        (entry.reasonCode?.includes("asset") === true ||
          (entry.evidence ?? []).some(
            (item) =>
              item.includes("remote_support") ||
              item.includes("economy_asset") ||
              item.includes("asset_trash_target"),
          ))
      );
    });
}

export function planConversionEntryHasMeaningfulBoardProgress<
  T extends PlanConversionDecisionEntry,
>(
  entry: T,
  isCorpRemoteAdvancementProgress: (entry: T) => boolean,
): boolean {
  if (
    entry.actionType === "score_agenda" ||
    entry.actionType === "steal_agenda"
  )
    return true;
  if (
    entry.side === "runner" &&
    (entry.runnerRelevantRemoteTrashTaken === true ||
      (entry.actionType === "trash_accessed_card" &&
        isRemoteServerTarget(entry.targetServerId)))
  )
    return true;
  if (isRunnerRigProgressAction(entry)) return true;
  if (isRunnerEconomyProgressAction(entry)) return true;
  if (isCorpRemoteAdvancementProgress(entry)) return true;
  if (
    entry.side === "corp" &&
    isRemoteServerTarget(entry.targetServerId) &&
    (entry.protectBeforeAdvance === true ||
      entry.protectedFinalAdvance === true ||
      (entry.actionType === "install_card" && entry.installPlacement === "ice"))
  )
    return true;
  if (entry.side === "corp" && entry.actionType === "rez_ice")
    return isRemoteServerTarget(entry.targetServerId);
  if (isRunnerCentralPressureAction(entry)) {
    return (
      entry.runnerCentralRunWithMultiaccess === true ||
      entry.runnerCentralRunWithInterfaceInstalled === true ||
      entry.runnerCentralRunEventWithGoodTarget === true ||
      entry.runnerRepeatedCentralRunWithFreshValue === true ||
      entry.runnerCentralCloseoutRunTaken === true
    );
  }
  return false;
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

export function runnerRunHasFollowupValue<T extends PlanConversionDecisionEntry>(
  sequence: T[],
  runIndex: number,
  isMeaningfulProgress: (entry: T) => boolean,
): boolean {
  const run = sequence[runIndex]!;
  if (isMeaningfulProgress(run)) return true;
  return nextEntries(sequence, runIndex).some(
    (later) =>
      serverTargetsMatch(run, later) &&
      (later.actionType === "steal_agenda" ||
        later.runnerRelevantRemoteTrashTaken === true ||
        later.actionType === "trash_accessed_card" ||
        later.runnerRemoteTrashTaken === true ||
        (later.actionType === "access_card" &&
          (isRemoteServerTarget(later.targetServerId) ||
            centralServerId(later.targetServerId) !== undefined))),
  );
}

export function setupActionConvertsToRun<
  T extends PlanConversionDecisionEntry,
>(
  sequence: T[],
  index: number,
  isMeaningfulProgress: (entry: T) => boolean,
): boolean {
  if (!isRunnerSetupAction(sequence[index]!)) return false;
  return nextEntries(sequence, index).some(
    (entry, offset) =>
      entry.side === "runner" &&
      entry.actionType === "start_run" &&
      runnerRunHasFollowupValue(
        sequence,
        index + offset + 1,
        isMeaningfulProgress,
      ),
  );
}

export function economyActionConvertsToRun<
  T extends PlanConversionDecisionEntry,
>(
  sequence: T[],
  index: number,
  isMeaningfulProgress: (entry: T) => boolean,
): boolean {
  if (!isRunnerEconomyProgressAction(sequence[index]!)) return false;
  return nextEntries(sequence, index).some(
    (entry, offset) =>
      entry.side === "runner" &&
      entry.actionType === "start_run" &&
      runnerRunHasFollowupValue(
        sequence,
        index + offset + 1,
        isMeaningfulProgress,
      ),
  );
}

export function rigActionConvertsToRun<T extends PlanConversionDecisionEntry>(
  sequence: T[],
  index: number,
  isMeaningfulProgress: (entry: T) => boolean,
): boolean {
  if (!isRunnerRigProgressAction(sequence[index]!)) return false;
  return nextEntries(sequence, index).some(
    (entry, offset) =>
      entry.side === "runner" &&
      entry.actionType === "start_run" &&
      runnerRunHasFollowupValue(
        sequence,
        index + offset + 1,
        isMeaningfulProgress,
      ),
  );
}

export function remoteBuildConvertsToAdvanceOrScore<
  T extends PlanConversionDecisionEntry,
>(
  sequence: T[],
  index: number,
  isCorpRemoteAdvancementProgress: (entry: T) => boolean,
): boolean {
  const entry = sequence[index]!;
  if (!isCorpRemoteBuildAction(entry)) return false;
  return nextEntries(sequence, index).some(
    (later) =>
      later.side === "corp" &&
      remoteTargetsMatch(entry, later) &&
      (isCorpRemoteAdvancementProgress(later) ||
        later.actionType === "score_agenda"),
  );
}

export function advanceConvertsToScore<T extends PlanConversionDecisionEntry>(
  sequence: T[],
  index: number,
  isCorpRemoteAdvancementProgress: (entry: T) => boolean,
): boolean {
  const entry = sequence[index]!;
  if (!isCorpRemoteAdvancementProgress(entry)) return false;
  return nextEntries(sequence, index).some(
    (later) =>
      later.side === "corp" &&
      later.actionType === "score_agenda" &&
      remoteTargetsMatch(entry, later),
  );
}

export function remoteContestConvertsToStealOrTrash<
  T extends PlanConversionDecisionEntry,
>(sequence: T[], index: number): boolean {
  const entry = sequence[index]!;
  if (!isRunnerRemoteContestRun(entry)) return false;
  return nextEntries(sequence, index).some(
    (later) =>
      later.side === "runner" &&
      remoteTargetsMatch(entry, later) &&
      (later.actionType === "steal_agenda" ||
        later.runnerRelevantRemoteTrashTaken === true ||
        later.actionType === "trash_accessed_card"),
  );
}

export function centralPressureConvertsToSteal<
  T extends PlanConversionDecisionEntry,
>(sequence: T[], index: number): boolean {
  const entry = sequence[index]!;
  if (!isRunnerCentralPressureAction(entry)) return false;
  return nextEntries(sequence, index).some(
    (later) =>
      later.side === "runner" &&
      later.actionType === "steal_agenda" &&
      centralServerId(later.targetServerId) !== undefined &&
      serverTargetsMatch(entry, later),
  );
}

export function planIntentConvertedWithin<
  T extends PlanConversionDecisionEntry,
>(
  sequence: T[],
  index: number,
  planKind: string,
  isMeaningfulProgress: (entry: T) => boolean,
  isCorpRemoteAdvancementProgress: (entry: T) => boolean,
): boolean {
  if (planKind.includes("setup") || planKind.includes("draw"))
    return setupActionConvertsToRun(sequence, index, isMeaningfulProgress);
  if (planKind.includes("economy"))
    return economyActionConvertsToRun(sequence, index, isMeaningfulProgress);
  if (planKind.includes("rig") || planKind.includes("breaker"))
    return (
      rigActionConvertsToRun(sequence, index, isMeaningfulProgress) ||
      isMeaningfulProgress(sequence[index]!)
    );
  if (planKind.includes("remote_build") || planKind.includes("protect"))
    return remoteBuildConvertsToAdvanceOrScore(
      sequence,
      index,
      isCorpRemoteAdvancementProgress,
    );
  if (planKind.includes("advance"))
    return advanceConvertsToScore(
      sequence,
      index,
      isCorpRemoteAdvancementProgress,
    );
  if (planKind.includes("remote_contest"))
    return remoteContestConvertsToStealOrTrash(sequence, index);
  if (planKind.includes("central") || planKind.includes("pressure"))
    return centralPressureConvertsToSteal(sequence, index);
  return hasMeaningfulProgressWithin(
    sequence,
    index,
    3,
    isMeaningfulProgress,
  );
}

export function runnerEconomyConvertsToRunOrRig<
  T extends PlanConversionDecisionEntry,
>(
  sequence: T[],
  index: number,
  isMeaningfulProgress: (entry: T) => boolean,
): boolean {
  return ownStrategicWindow(sequence, index, 3).some(
    (entry) =>
      entry.side === "runner" &&
      ((entry.actionType === "start_run" &&
        runnerRunHasFollowupValue(
          sequence,
          sequence.indexOf(entry),
          isMeaningfulProgress,
        )) ||
        isRunnerRigProgressAction(entry)),
  );
}

export function runnerRigConvertsToRun<T extends PlanConversionDecisionEntry>(
  sequence: T[],
  index: number,
  isMeaningfulProgress: (entry: T) => boolean,
): boolean {
  return ownStrategicWindow(sequence, index, 3).some(
    (entry) =>
      entry.side === "runner" &&
      entry.actionType === "start_run" &&
      runnerRunHasFollowupValue(
        sequence,
        sequence.indexOf(entry),
        isMeaningfulProgress,
      ),
  );
}

export function runnerProbeConvertsToUsefulInfoOrPivot<
  T extends PlanConversionDecisionEntry,
>(
  sequence: T[],
  index: number,
  isMeaningfulProgress: (entry: T) => boolean,
): boolean {
  const entry = sequence[index]!;
  const target = entry.targetServerId;
  const window = ownStrategicWindow(sequence, index, 3);
  return window.some(
    (later) =>
      isMeaningfulProgress(later) ||
      later.targetServerId !== target ||
      ["recover_economy", "rig", "remote_contest"].some((needle) =>
        planKindForConversion(later)?.includes(needle),
      ),
  );
}

export function runnerCentralPressureConvertsToStealOrFreshValue<
  T extends PlanConversionDecisionEntry,
>(
  sequence: T[],
  index: number,
  isMeaningfulProgress: (entry: T) => boolean,
): boolean {
  const entry = sequence[index]!;
  if (isMeaningfulProgress(entry)) return true;
  return ownStrategicWindow(sequence, index, 3).some(
    (later) =>
      (later.actionType === "steal_agenda" &&
        centralServerId(later.targetServerId) !== undefined) ||
      later.runnerCentralRunWithMultiaccess === true ||
      later.runnerCentralRunWithInterfaceInstalled === true ||
      later.runnerRepeatedCentralRunWithFreshValue === true ||
      hasPlanConversionEvidenceFlag(later, "plan_abort_taken:true"),
  );
}

export function runnerRemoteContestConvertsToStealTrashOrAbort<
  T extends PlanConversionDecisionEntry,
>(
  sequence: T[],
  index: number,
  isMeaningfulProgress: (entry: T) => boolean,
): boolean {
  const entry = sequence[index]!;
  if (isMeaningfulProgress(entry)) return true;
  return ownStrategicWindow(sequence, index, 3).some(
    (later) =>
      (serverTargetsMatch(entry, later) &&
        (later.actionType === "steal_agenda" ||
          later.runnerRelevantRemoteTrashTaken === true ||
          later.actionType === "trash_accessed_card")) ||
      hasPlanConversionEvidenceFlag(later, "plan_abort_taken:true"),
  );
}

export function corpRemoteBuildConvertsToAdvanceProtectOrScore<
  T extends PlanConversionDecisionEntry,
>(
  sequence: T[],
  index: number,
  isMeaningfulProgress: (entry: T) => boolean,
  isCorpRemoteAdvancementProgress: (entry: T) => boolean,
): boolean {
  const entry = sequence[index]!;
  if (isMeaningfulProgress(entry)) return true;
  return ownStrategicWindow(sequence, index, 3).some(
    (later) =>
      later.side === "corp" &&
      (remoteTargetsMatch(entry, later) || !later.targetServerId) &&
      (isCorpRemoteAdvancementProgress(later) ||
        later.actionType === "score_agenda" ||
        later.protectBeforeAdvance === true ||
        later.protectedFinalAdvance === true),
  );
}

export function corpAdvanceConvertsToScoreOrProtectedWindow<
  T extends PlanConversionDecisionEntry,
>(sequence: T[], index: number): boolean {
  const entry = sequence[index]!;
  if (
    entry.protectedFinalAdvance === true ||
    entry.actionType === "score_agenda"
  )
    return true;
  return ownStrategicWindow(sequence, index, 3).some(
    (later) =>
      later.side === "corp" &&
      (later.actionType === "score_agenda" ||
        later.protectedFinalAdvance === true ||
        later.protectBeforeAdvance === true) &&
      (remoteTargetsMatch(entry, later) || !later.targetServerId),
  );
}

export function corpEconomyConvertsToRezInstallScore<
  T extends PlanConversionDecisionEntry,
>(sequence: T[], index: number): boolean {
  return ownStrategicWindow(sequence, index, 3).some(
    (later) =>
      later.side === "corp" &&
      ["rez_ice", "install_card", "advance_card", "score_agenda"].includes(
        later.actionType ?? "",
      ),
  );
}

export function corpProtectionConvertsToScoreSafety<
  T extends PlanConversionDecisionEntry,
>(sequence: T[], index: number): boolean {
  return ownStrategicWindow(sequence, index, 3).some(
    (later) =>
      later.side === "corp" &&
      (later.actionType === "score_agenda" ||
        later.actionType === "advance_card" ||
        later.protectedFinalAdvance === true ||
        later.protectBeforeAdvance === true ||
        planKindForConversion(later)?.includes("remote_build") === true),
  );
}

export function strategicPlanConvertsWithinOwnDecisions<
  T extends PlanConversionDecisionEntry,
>(
  sequence: T[],
  index: number,
  ownDecisions: number,
  isMeaningfulProgress: (entry: T) => boolean,
): boolean {
  const entry = sequence[index]!;
  if (isMeaningfulProgress(entry)) return true;
  return ownStrategicWindow(sequence, index, ownDecisions).some(
    isMeaningfulProgress,
  );
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
