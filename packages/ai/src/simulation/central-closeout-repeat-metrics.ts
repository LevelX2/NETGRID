import { centralServerId } from "../runtime/server-target";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { progressionEntriesWithRunTargets } from "./progression-action-sequence";

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function summarizeCentralCloseoutRepeatMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "trueCentralCloseoutOpportunities"
  | "centralCloseoutOpportunitiesRaw"
  | "centralCloseoutOpportunitiesDeduped"
  | "centralCloseoutOpportunities"
  | "centralCloseoutRunsTaken"
  | "centralCloseoutSuccesses"
  | "centralCloseoutFalsePositiveRate"
  | "centralCloseoutSkippedWithGoodReason"
  | "centralCloseoutSkippedWithoutReason"
  | "centralRunRepeatWindowsRaw"
  | "centralRunRepeatWindowsDeduped"
  | "repeatedCentralRunsWithFreshValue"
  | "repeatedCentralRunsWithoutFreshValue"
  | "centralRunInsteadUnjustified"
  | "centralRunJustifiedByMultiaccess"
  | "centralRunJustifiedByInterface"
  | "centralRunJustifiedByCloseout"
  | "centralRunJustifiedByRemoteUncontestable"
  | "centralRunJustifiedByHqPressure"
  | "centralRunJustifiedByRndFreshness"
  | "centralRunStalePenaltyApplied"
  | "centralPressureNoopDecisions"
  | "noFreshCentralWindows"
  | "noFreshCentralRunsTaken"
  | "noFreshCentralSubstitutions"
  | "noFreshCentralSubstitutionRate"
  | "noFreshCentralSubstitutionEconomy"
  | "noFreshCentralSubstitutionRigUnlock"
  | "noFreshCentralSubstitutionRemoteContest"
  | "noFreshCentralSubstitutionPressureInstall"
  | "noFreshCentralSubstitutionSetupSearch"
  | "noFreshCentralSubstitutionEndTurn"
  | "noFreshCentralWithBetterAlternative"
  | "noFreshCentralWithoutBetterAlternative"
  | "staleCentralChosenDespiteEconomy"
  | "staleCentralChosenDespiteRigUnlock"
  | "staleCentralChosenDespiteRemoteContest"
  | "staleCentralChosenDespitePressureInstall"
  | "staleCentralAllowedWithReason"
  | "staleCentralAllowedCloseout"
  | "staleCentralAllowedInterface"
  | "staleCentralAllowedMultiaccess"
  | "staleCentralAllowedRemoteUncontestable"
  | "staleCentralAllowedCentralOpen"
  | "staleCentralAllowedNoBetterAction"
  | "alternativeChosenAfterStaleCentralPenalty"
  | "substitutionLedToProgression"
> {
  const rawCloseoutKeys = new Set<string>();
  const trueCloseoutKeys = new Set<string>();
  const closeoutRunsTakenKeys = new Set<string>();
  const closeoutSuccessKeys = new Set<string>();
  const skippedGoodReasonKeys = new Set<string>();
  const skippedWithoutReasonKeys = new Set<string>();
  const repeatRawKeys = new Set<string>();
  const repeatDedupedKeys = new Set<string>();
  const repeatFreshKeys = new Set<string>();
  const repeatWithoutFreshKeys = new Set<string>();
  const stalePenaltyKeys = new Set<string>();
  const noopKeys = new Set<string>();
  const centralInsteadUnjustifiedKeys = new Set<string>();
  const noFreshKeys = new Set<string>();
  const noFreshRunKeys = new Set<string>();
  const noFreshSubstitutionKeys = new Set<string>();
  const noFreshWithBetterKeys = new Set<string>();
  const noFreshWithoutBetterKeys = new Set<string>();
  const staleDespite = {
    economy: new Set<string>(),
    rig_unlock: new Set<string>(),
    remote_contest: new Set<string>(),
    pressure_install: new Set<string>(),
  };
  const allowedStale = {
    any: new Set<string>(),
    closeout: new Set<string>(),
    interface: new Set<string>(),
    multiaccess: new Set<string>(),
    remote_uncontestable: new Set<string>(),
    central_open: new Set<string>(),
    no_better_action: new Set<string>(),
  };
  const substitutionByType = {
    economy: new Set<string>(),
    rig_unlock: new Set<string>(),
    remote_contest: new Set<string>(),
    pressure_install: new Set<string>(),
    setup_search: new Set<string>(),
    end_turn: new Set<string>(),
  };
  const substitutionProgressionKeys = new Set<string>();
  const reasonKeys = {
    multiaccess: new Set<string>(),
    interface: new Set<string>(),
    closeout: new Set<string>(),
    remote_uncontestable: new Set<string>(),
    hq_pressure: new Set<string>(),
    rnd_freshness: new Set<string>(),
  };

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    for (const entry of sequence) {
      const turn = entry.turnNumber ?? 0;
      const target = centralServerId(entry.targetServerId);
      const closeoutTarget = target ?? "central";
      const closeoutKey = `${summary.seed}|${turn}|${closeoutTarget}`;
      if (entry.runnerCentralCloseoutOpportunityRaw)
        rawCloseoutKeys.add(closeoutKey);
      if (entry.runnerTrueCentralCloseoutOpportunity)
        trueCloseoutKeys.add(closeoutKey);
      if (entry.runnerCentralCloseoutRunTaken)
        closeoutRunsTakenKeys.add(closeoutKey);
      if (entry.runnerCentralCloseoutSuccess)
        closeoutSuccessKeys.add(closeoutKey);
      if (entry.runnerCentralCloseoutSkippedWithGoodReason)
        skippedGoodReasonKeys.add(closeoutKey);
      if (entry.runnerCentralCloseoutSkippedWithoutReason)
        skippedWithoutReasonKeys.add(closeoutKey);
      if (entry.runnerCentralPressureNoopDecision) noopKeys.add(closeoutKey);

      if (target && entry.runnerCentralRunRepeatWindow) {
        const repeatRawKey = `${summary.seed}|${entry.stateVersionBefore}|${target}`;
        const repeatKey = `${summary.seed}|${turn}|${target}`;
        repeatRawKeys.add(repeatRawKey);
        repeatDedupedKeys.add(repeatKey);
        if (entry.runnerRepeatedCentralRunWithFreshValue)
          repeatFreshKeys.add(repeatKey);
        if (entry.runnerRepeatedCentralRunWithoutFreshValue)
          repeatWithoutFreshKeys.add(repeatKey);
        if (entry.runnerCentralRunStalePenaltyApplied)
          stalePenaltyKeys.add(repeatKey);
      }

      if (
        entry.runnerCentralRunInsteadOfContestableAdvancedRemote &&
        !entry.runnerCentralRunInsteadWasJustified
      ) {
        for (const serverId of entry.runnerContestableAdvancedRemoteThreatServerIds ??
          []) {
          centralInsteadUnjustifiedKeys.add(
            `${summary.seed}|${turn}|${serverId}`,
          );
        }
      }

      const reason = entry.runnerCentralRunJustificationReason;
      if (reason && target) {
        const reasonKey = `${summary.seed}|${turn}|${target}`;
        if (reason.includes("multiaccess"))
          reasonKeys.multiaccess.add(reasonKey);
        if (reason.includes("interface")) reasonKeys.interface.add(reasonKey);
        if (reason.includes("closeout")) reasonKeys.closeout.add(reasonKey);
        if (reason.includes("remote_uncontestable"))
          reasonKeys.remote_uncontestable.add(reasonKey);
        if (reason.includes("hq_pressure"))
          reasonKeys.hq_pressure.add(reasonKey);
        if (reason.includes("rnd_freshness"))
          reasonKeys.rnd_freshness.add(reasonKey);
      }

      const noFreshTargets = entry.runnerNoFreshCentralServerIds ?? [];
      for (const noFreshTarget of noFreshTargets) {
        const key = `${summary.seed}|${turn}|${noFreshTarget}`;
        noFreshKeys.add(key);
        const alternatives =
          entry.runnerNoFreshCentralBetterAlternativeTypes ?? [];
        if (alternatives.length > 0) noFreshWithBetterKeys.add(key);
        else noFreshWithoutBetterKeys.add(key);
        if (entry.runnerNoFreshCentralRunTaken) {
          noFreshRunKeys.add(key);
          if (alternatives.includes("economy")) staleDespite.economy.add(key);
          if (alternatives.includes("rig_unlock"))
            staleDespite.rig_unlock.add(key);
          if (alternatives.includes("remote_contest"))
            staleDespite.remote_contest.add(key);
          if (alternatives.includes("pressure_install"))
            staleDespite.pressure_install.add(key);
          const allowed = entry.runnerStaleCentralAllowedReason;
          if (allowed) {
            allowedStale.any.add(key);
            if (allowed in allowedStale)
              allowedStale[allowed as keyof typeof allowedStale].add(key);
          }
        }
        const substitutionType = entry.runnerNoFreshCentralSubstitutionType;
        if (substitutionType) {
          noFreshSubstitutionKeys.add(key);
          substitutionByType[substitutionType].add(key);
          if (
            sequence
              .filter((later) => (later.turnNumber ?? 0) >= turn)
              .some(
                (later) =>
                  later.actionType === "steal_agenda" ||
                  later.actionType === "trash_accessed_card" ||
                  later.runnerRemoteRunAgainstAdvancedRemote === true ||
                  later.runnerRigInstallAction === true ||
                  (typeof later.runnerCreditsAfter === "number" &&
                    typeof later.runnerReserveTarget === "number" &&
                    later.runnerCreditsAfter >= later.runnerReserveTarget),
              )
          ) {
            substitutionProgressionKeys.add(key);
          }
        }
      }
    }
  }

  return {
    trueCentralCloseoutOpportunities: trueCloseoutKeys.size,
    centralCloseoutOpportunitiesRaw: rawCloseoutKeys.size,
    centralCloseoutOpportunitiesDeduped: trueCloseoutKeys.size,
    centralCloseoutOpportunities: trueCloseoutKeys.size,
    centralCloseoutRunsTaken: closeoutRunsTakenKeys.size,
    centralCloseoutSuccesses: closeoutSuccessKeys.size,
    centralCloseoutFalsePositiveRate:
      rawCloseoutKeys.size > 0
        ? round(
            (rawCloseoutKeys.size - trueCloseoutKeys.size) /
              rawCloseoutKeys.size,
          )
        : 0,
    centralCloseoutSkippedWithGoodReason: skippedGoodReasonKeys.size,
    centralCloseoutSkippedWithoutReason: skippedWithoutReasonKeys.size,
    centralRunRepeatWindowsRaw: repeatRawKeys.size,
    centralRunRepeatWindowsDeduped: repeatDedupedKeys.size,
    repeatedCentralRunsWithFreshValue: repeatFreshKeys.size,
    repeatedCentralRunsWithoutFreshValue: repeatWithoutFreshKeys.size,
    centralRunInsteadUnjustified: centralInsteadUnjustifiedKeys.size,
    centralRunJustifiedByMultiaccess: reasonKeys.multiaccess.size,
    centralRunJustifiedByInterface: reasonKeys.interface.size,
    centralRunJustifiedByCloseout: reasonKeys.closeout.size,
    centralRunJustifiedByRemoteUncontestable:
      reasonKeys.remote_uncontestable.size,
    centralRunJustifiedByHqPressure: reasonKeys.hq_pressure.size,
    centralRunJustifiedByRndFreshness: reasonKeys.rnd_freshness.size,
    centralRunStalePenaltyApplied: stalePenaltyKeys.size,
    centralPressureNoopDecisions: noopKeys.size,
    noFreshCentralWindows: noFreshKeys.size,
    noFreshCentralRunsTaken: noFreshRunKeys.size,
    noFreshCentralSubstitutions: noFreshSubstitutionKeys.size,
    noFreshCentralSubstitutionRate:
      noFreshKeys.size > 0
        ? round(noFreshSubstitutionKeys.size / noFreshKeys.size)
        : 0,
    noFreshCentralSubstitutionEconomy: substitutionByType.economy.size,
    noFreshCentralSubstitutionRigUnlock: substitutionByType.rig_unlock.size,
    noFreshCentralSubstitutionRemoteContest:
      substitutionByType.remote_contest.size,
    noFreshCentralSubstitutionPressureInstall:
      substitutionByType.pressure_install.size,
    noFreshCentralSubstitutionSetupSearch: substitutionByType.setup_search.size,
    noFreshCentralSubstitutionEndTurn: substitutionByType.end_turn.size,
    noFreshCentralWithBetterAlternative: noFreshWithBetterKeys.size,
    noFreshCentralWithoutBetterAlternative: noFreshWithoutBetterKeys.size,
    staleCentralChosenDespiteEconomy: staleDespite.economy.size,
    staleCentralChosenDespiteRigUnlock: staleDespite.rig_unlock.size,
    staleCentralChosenDespiteRemoteContest: staleDespite.remote_contest.size,
    staleCentralChosenDespitePressureInstall:
      staleDespite.pressure_install.size,
    staleCentralAllowedWithReason: allowedStale.any.size,
    staleCentralAllowedCloseout: allowedStale.closeout.size,
    staleCentralAllowedInterface: allowedStale.interface.size,
    staleCentralAllowedMultiaccess: allowedStale.multiaccess.size,
    staleCentralAllowedRemoteUncontestable:
      allowedStale.remote_uncontestable.size,
    staleCentralAllowedCentralOpen: allowedStale.central_open.size,
    staleCentralAllowedNoBetterAction: allowedStale.no_better_action.size,
    alternativeChosenAfterStaleCentralPenalty: noFreshSubstitutionKeys.size,
    substitutionLedToProgression: substitutionProgressionKeys.size,
  };
}
