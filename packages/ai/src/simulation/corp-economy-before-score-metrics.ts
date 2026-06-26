import { hasEvidenceFlag } from "../runtime/evidence-value";
import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { nextEntriesForSide } from "./plan-conversion-predicates";

export function summarizeCorpEconomyBeforeScoreMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "corpEconomyBeforeScoreWindow"
  | "corpEconomyBeforeScoreWindowNecessary"
  | "corpEconomyBeforeScoreWindowWithInstalledAgenda"
  | "corpEconomyBeforeScoreWindowWithAdvancedAgenda"
  | "corpEconomyBeforeScoreWindowWithScoreLegalNext"
  | "corpEconomyBeforeScoreWindowWithAdvanceToScoreLegalNext"
  | "corpEconomyBeforeScoreWindowWithReadyRemote"
  | "corpEconomyBeforeScoreWindowWithAgendaInHqAndReadyRemote"
  | "corpEconomyBeforeScoreWindowCreditsShort"
  | "corpEconomyBeforeScoreWindowCreditsAlreadyEnough"
  | "corpEconomyBeforeScoreWindowRemoteSafe"
  | "corpEconomyBeforeScoreWindowRemoteContestHigh"
  | "corpEconomyBeforeScoreTaken"
  | "corpEconomyBeforeScoreTakenAsNecessaryCredits"
  | "corpEconomyBeforeScoreTakenDespiteCreditsEnough"
  | "corpEconomyBeforeScoreTakenOverScoreLegal"
  | "corpEconomyBeforeScoreTakenOverAdvanceToScoreLegal"
  | "corpEconomyBeforeScoreTakenOverAgendaInstallReadyRemote"
  | "corpEconomyBeforeScoreTakenOverHqAgendaExit"
  | "corpEconomyBeforeScoreTakenOverScoreAreaAbility"
  | "corpEconomyBeforeScoreConvertedToScoreNextDecision"
  | "corpEconomyBeforeScoreConvertedToAdvanceNextDecision"
  | "corpEconomyBeforeScoreConvertedToAgendaInstallNextDecision"
  | "corpEconomyBeforeScoreConvertedWithin2CorpActions"
  | "corpEconomyBeforeScoreConvertedWithin3CorpActions"
  | "corpEconomyBeforeScoreNotConvertedWithin3CorpActions"
  | "corpEconomyBeforeScoreRepeatedEconomyNextDecision"
  | "corpEconomyBeforeScoreRepeatedEconomyWithin3"
  | "corpEconomyBeforeScoreThenDraw"
  | "corpEconomyBeforeScoreThenProtect"
  | "corpEconomyBeforeScoreThenNewRemote"
  | "corpEconomyBeforeScoreThenRunnerSteal"
  | "corpEconomyBeforeScoreThenActionLimit"
  | "corpEconomyBeforeScorePlausibleCreditsNeeded"
  | "corpEconomyBeforeScorePlausibleRezOrAdvanceReserve"
  | "corpEconomyBeforeScorePlausibleHqOrRndSafety"
  | "corpEconomyBeforeScorePlausibleRunnerContestTooHigh"
  | "corpEconomyBeforeScorePlausibleNoAgendaExit"
  | "corpEconomyBeforeScoreSuspiciousCreditsAlreadyEnough"
  | "corpEconomyBeforeScoreSuspiciousRepeatedEconomy"
  | "corpEconomyBeforeScoreSuspiciousDelayedTerminalAction"
  | "corpEconomyBeforeScoreSuspiciousRemoteStillSafe"
  | "corpEconomyBeforeScoreSuspiciousRunnerStealFollowup"
  | "corpEconomyBeforeScoreUnclassified"
  | "corpEconomyBeforeScoreFixGateEligible"
  | "corpEconomyBeforeScoreFixGateBlockedByCredits"
  | "corpEconomyBeforeScoreFixGateBlockedByCheapContest"
  | "corpEconomyBeforeScoreFixGateBlockedByRunnerContest"
  | "corpEconomyBeforeScoreFixGateBlockedBySafety"
  | "corpEconomyBeforeScoreFixGateSuspicious"
  | "corpEconomyBeforeScoreFixGateSuspiciousRepeatedEconomy"
  | "corpEconomyBeforeScoreFixGateSuspiciousNoConversion"
  | "corpEconomyBeforeScoreFixGateSuspiciousStealFollowup"
  | "corpRepeatedEconomyBeforeScoreWindows"
  | "corpRepeatedEconomyBeforeScoreCreditsStillShort"
  | "corpRepeatedEconomyBeforeScoreCreditsAlreadyEnough"
  | "corpRepeatedEconomyBeforeScoreScoreLegal"
  | "corpRepeatedEconomyBeforeScoreAdvanceLegal"
  | "corpRepeatedEconomyBeforeScoreAgendaInstallReadyRemoteLegal"
  | "corpRepeatedEconomyBeforeScoreRemoteSafe"
  | "corpRepeatedEconomyBeforeScoreRunnerContestHigh"
  | "corpRepeatedEconomyBeforeScoreThenScore"
  | "corpRepeatedEconomyBeforeScoreThenRunnerSteal"
  | "corpRepeatedEconomyBeforeScoreThenActionLimit"
  | "corpRepeatedEconomyBeforeScoreSuspicious"
  | "corpRepeatedEconomyBeforeScorePlausible"
  | "corpEconomyBeforeScoreNoConversionCreditsStillShort"
  | "corpEconomyBeforeScoreNoConversionNoAgendaExit"
  | "corpEconomyBeforeScoreNoConversionRemoteUnsafe"
  | "corpEconomyBeforeScoreNoConversionRunnerContestHigh"
  | "corpEconomyBeforeScoreNoConversionSafetyBlocked"
  | "corpEconomyBeforeScoreNoConversionPlanDrift"
  | "corpEconomyBeforeScoreNoConversionRepeatedEconomy"
  | "corpEconomyBeforeScoreNoConversionDrawLoop"
  | "corpEconomyBeforeScoreNoConversionProtectionLoop"
  | "corpEconomyBeforeScoreNoConversionRemotePortfolioLoop"
  | "corpEconomyBeforeScoreNoConversionRunnerSteal"
  | "corpEconomyBeforeScoreNoConversionActionLimit"
  | "corpEconomyBeforeScoreNoConversionSuspicious"
  | "corpEconomyBeforeScoreNoConversionPlausible"
  | "corpEconomyBeforeScoreCreditsEnoughWindows"
  | "corpEconomyBeforeScoreCreditsEnoughTaken"
  | "corpEconomyBeforeScoreCreditsEnoughScoreLegal"
  | "corpEconomyBeforeScoreCreditsEnoughAdvanceLegal"
  | "corpEconomyBeforeScoreCreditsEnoughAgendaInstallReadyRemoteLegal"
  | "corpEconomyBeforeScoreCreditsEnoughSafetyBlocked"
  | "corpEconomyBeforeScoreCreditsEnoughSuspicious"
  | "corpEconomyBeforeScoreCreditsEnoughPlausible"
> {
  const actionSequence = summaries.flatMap((summary) => summary.actionSequence);
  const entries = actionSequence.filter(
    (entry) =>
      entry.corpEconomyBeforeScoreDiagnosticWindow === true ||
      hasEvidenceFlag(entry, "corp_economy_before_score_window:true"),
  );
  const takenEntries = summaries.flatMap((summary) =>
    summary.actionSequence
      .map((entry, index) => ({
        entry,
        index,
        sequence: summary.actionSequence,
      }))
      .filter(({ entry }) => entry.corpEconomyBeforeScoreTaken === true),
  );
  let convertedToScoreNext = 0;
  let convertedToAdvanceNext = 0;
  let convertedToAgendaInstallNext = 0;
  let convertedWithin2 = 0;
  let convertedWithin3 = 0;
  let notConvertedWithin3 = 0;
  let repeatedEconomyNext = 0;
  let repeatedEconomyWithin3 = 0;
  let thenDraw = 0;
  let thenProtect = 0;
  let thenNewRemote = 0;
  let thenRunnerSteal = 0;
  let thenActionLimit = 0;
  let suspiciousRepeated = 0;
  let suspiciousNoConversion = 0;
  let suspiciousStealFollowup = 0;
  let repeatedCreditsStillShort = 0;
  let repeatedCreditsAlreadyEnough = 0;
  let repeatedScoreLegal = 0;
  let repeatedAdvanceLegal = 0;
  let repeatedAgendaInstallReadyRemoteLegal = 0;
  let repeatedRemoteSafe = 0;
  let repeatedRunnerContestHigh = 0;
  let repeatedThenScore = 0;
  let repeatedThenRunnerSteal = 0;
  let repeatedThenActionLimit = 0;
  let repeatedSuspicious = 0;
  let repeatedPlausible = 0;
  let noConversionCreditsStillShort = 0;
  let noConversionNoAgendaExit = 0;
  let noConversionRemoteUnsafe = 0;
  let noConversionRunnerContestHigh = 0;
  let noConversionSafetyBlocked = 0;
  let noConversionPlanDrift = 0;
  let noConversionRepeatedEconomy = 0;
  let noConversionDrawLoop = 0;
  let noConversionProtectionLoop = 0;
  let noConversionRemotePortfolioLoop = 0;
  let noConversionRunnerSteal = 0;
  let noConversionActionLimit = 0;
  let noConversionSuspicious = 0;
  let noConversionPlausible = 0;

  const converted = (entry: AiSimulationActionSequenceEntry) =>
    entry.corpScoreTerminalScoreTaken === true ||
    entry.corpScoreTerminalAdvanceTaken === true ||
    entry.corpScoreTerminalAgendaInstalled === true ||
    entry.actionType === "score_agenda" ||
    (entry.actionType === "advance_card" &&
      entry.corpEconomyBeforeScoreWindowWithAdvanceToScoreLegalNext === true) ||
    (entry.actionType === "install_card" &&
      entry.installPlacement !== "ice" &&
      entry.targetCardType === "agenda");
  const economy = (entry: AiSimulationActionSequenceEntry) =>
    entry.corpEconomyBeforeScoreTaken === true ||
    entry.corpScoreTerminalSkippedForEconomy === true ||
    entry.actionType === "gain_credit" ||
    hasEvidenceFlag(entry, "corp_economy_before_score_window:true");
  const scoreLegal = (entry: AiSimulationActionSequenceEntry) =>
    entry.corpEconomyBeforeScoreWindowWithScoreLegalNext === true ||
    entry.corpScoreTerminalWindowScoreLegal === true;
  const advanceLegal = (entry: AiSimulationActionSequenceEntry) =>
    entry.corpEconomyBeforeScoreWindowWithAdvanceToScoreLegalNext === true ||
    entry.corpScoreTerminalWindowAdvanceToScoreLegal === true;
  const agendaReadyLegal = (entry: AiSimulationActionSequenceEntry) =>
    entry.corpEconomyBeforeScoreWindowWithAgendaInHqAndReadyRemote === true ||
    entry.corpScoreTerminalWindowAgendaInstallLegal === true;
  const blockedForPlausibleReason = (entry: AiSimulationActionSequenceEntry) =>
    entry.corpEconomyBeforeScoreFixGateBlockedByCredits === true ||
    entry.corpEconomyBeforeScoreFixGateBlockedByCheapContest === true ||
    entry.corpEconomyBeforeScoreFixGateBlockedByRunnerContest === true ||
    entry.corpEconomyBeforeScoreFixGateBlockedBySafety === true ||
    entry.corpEconomyBeforeScorePlausibleNoAgendaExit === true ||
    entry.corpEconomyBeforeScoreWindowRemoteContestHigh === true;
  const fixGateSuspiciousEntry = (entry: AiSimulationActionSequenceEntry) =>
    entry.corpEconomyBeforeScoreFixGateEligible === true &&
    entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true &&
    !blockedForPlausibleReason(entry) &&
    (scoreLegal(entry) || advanceLegal(entry) || agendaReadyLegal(entry));

  for (const { entry, index, sequence } of takenEntries) {
    const future = sequence.slice(index + 1, index + 13);
    const futureCorp = future.filter((candidate) => candidate.side === "corp");
    const nextCorp = futureCorp[0];
    const next3 = futureCorp.slice(0, 3);
    if (nextCorp?.corpScoreTerminalScoreTaken === true)
      convertedToScoreNext += 1;
    if (nextCorp?.corpScoreTerminalAdvanceTaken === true)
      convertedToAdvanceNext += 1;
    if (nextCorp?.corpScoreTerminalAgendaInstalled === true)
      convertedToAgendaInstallNext += 1;
    if (futureCorp.slice(0, 2).some(converted)) convertedWithin2 += 1;
    const convertedInNext3 = next3.some(converted);
    const repeatedInNext3 = next3.some(economy);
    const runnerStealAfterEntry = future.some(
      (candidate) =>
        candidate.side === "runner" && candidate.actionType === "steal_agenda",
    );
    const actionLimitAfterEntry =
      index >= sequence.length - 6 && !futureCorp.some(converted);
    const next3HasDraw = next3.some(
      (candidate) => candidate.actionType === "draw_card",
    );
    const next3HasProtection = next3.some(
      (candidate) =>
        candidate.corpScoreTerminalSkippedForProtection === true ||
        candidate.corpScoreTerminalSkippedForHqProtection === true ||
        candidate.corpScoreTerminalSkippedForRndProtection === true,
    );
    const next3HasNewRemote = next3.some(
      (candidate) =>
        candidate.actionType === "install_card" &&
        candidate.targetServerId === "new_remote",
    );
    const entryPlausible = blockedForPlausibleReason(entry);
    const entrySuspicious = fixGateSuspiciousEntry(entry);

    if (convertedInNext3) convertedWithin3 += 1;
    else {
      notConvertedWithin3 += 1;
      if (entry.corpEconomyBeforeScoreFixGateEligible === true)
        suspiciousNoConversion += 1;
      if (entry.corpEconomyBeforeScoreWindowCreditsShort === true)
        noConversionCreditsStillShort += 1;
      if (entry.corpEconomyBeforeScorePlausibleNoAgendaExit === true)
        noConversionNoAgendaExit += 1;
      if (entry.corpEconomyBeforeScoreWindowWithReadyRemote !== true)
        noConversionRemoteUnsafe += 1;
      if (entry.corpEconomyBeforeScoreWindowRemoteContestHigh === true)
        noConversionRunnerContestHigh += 1;
      if (entry.corpEconomyBeforeScoreFixGateBlockedBySafety === true)
        noConversionSafetyBlocked += 1;
      if (next3HasDraw || next3HasProtection || next3HasNewRemote)
        noConversionPlanDrift += 1;
      if (repeatedInNext3) noConversionRepeatedEconomy += 1;
      if (next3HasDraw) noConversionDrawLoop += 1;
      if (next3HasProtection) noConversionProtectionLoop += 1;
      if (next3HasNewRemote) noConversionRemotePortfolioLoop += 1;
      if (runnerStealAfterEntry) noConversionRunnerSteal += 1;
      if (actionLimitAfterEntry) noConversionActionLimit += 1;
      if (entrySuspicious) noConversionSuspicious += 1;
      if (entryPlausible) noConversionPlausible += 1;
    }
    if (nextCorp && economy(nextCorp)) {
      repeatedEconomyNext += 1;
      if (entry.corpEconomyBeforeScoreFixGateEligible === true)
        suspiciousRepeated += 1;
    }
    if (repeatedInNext3) {
      repeatedEconomyWithin3 += 1;
      if (entry.corpEconomyBeforeScoreWindowCreditsShort === true)
        repeatedCreditsStillShort += 1;
      if (entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true)
        repeatedCreditsAlreadyEnough += 1;
      if (scoreLegal(entry)) repeatedScoreLegal += 1;
      if (advanceLegal(entry)) repeatedAdvanceLegal += 1;
      if (agendaReadyLegal(entry)) repeatedAgendaInstallReadyRemoteLegal += 1;
      if (entry.corpEconomyBeforeScoreWindowWithReadyRemote === true)
        repeatedRemoteSafe += 1;
      if (entry.corpEconomyBeforeScoreWindowRemoteContestHigh === true)
        repeatedRunnerContestHigh += 1;
      if (next3.some((candidate) => candidate.corpScoreTerminalScoreTaken))
        repeatedThenScore += 1;
      if (runnerStealAfterEntry) repeatedThenRunnerSteal += 1;
      if (actionLimitAfterEntry) repeatedThenActionLimit += 1;
      if (entrySuspicious) repeatedSuspicious += 1;
      if (entryPlausible) repeatedPlausible += 1;
    }
    if (nextCorp?.actionType === "draw_card") thenDraw += 1;
    if (
      nextCorp?.corpScoreTerminalSkippedForProtection === true ||
      nextCorp?.corpScoreTerminalSkippedForHqProtection === true ||
      nextCorp?.corpScoreTerminalSkippedForRndProtection === true
    )
      thenProtect += 1;
    if (
      nextCorp?.actionType === "install_card" &&
      nextCorp.targetServerId === "new_remote"
    )
      thenNewRemote += 1;
    if (runnerStealAfterEntry) {
      thenRunnerSteal += 1;
      if (entry.corpEconomyBeforeScoreFixGateEligible === true)
        suspiciousStealFollowup += 1;
    }
    if (actionLimitAfterEntry) thenActionLimit += 1;
  }

  const count = (flag: keyof AiSimulationSummary["actionSequence"][number]) =>
    entries.filter((entry) => entry[flag] === true).length;

  return {
    corpEconomyBeforeScoreWindow: entries.length,
    corpEconomyBeforeScoreWindowNecessary: entries.filter(
      (entry) =>
        entry.corpEconomyBeforeScoreTakenAsNecessaryCredits === true ||
        hasEvidenceFlag(
          entry,
          "corp_economy_before_score_window_necessary:true",
        ),
    ).length,
    corpEconomyBeforeScoreWindowWithInstalledAgenda: count(
      "corpEconomyBeforeScoreWindowWithInstalledAgenda",
    ),
    corpEconomyBeforeScoreWindowWithAdvancedAgenda: count(
      "corpEconomyBeforeScoreWindowWithAdvancedAgenda",
    ),
    corpEconomyBeforeScoreWindowWithScoreLegalNext: count(
      "corpEconomyBeforeScoreWindowWithScoreLegalNext",
    ),
    corpEconomyBeforeScoreWindowWithAdvanceToScoreLegalNext: count(
      "corpEconomyBeforeScoreWindowWithAdvanceToScoreLegalNext",
    ),
    corpEconomyBeforeScoreWindowWithReadyRemote: count(
      "corpEconomyBeforeScoreWindowWithReadyRemote",
    ),
    corpEconomyBeforeScoreWindowWithAgendaInHqAndReadyRemote: count(
      "corpEconomyBeforeScoreWindowWithAgendaInHqAndReadyRemote",
    ),
    corpEconomyBeforeScoreWindowCreditsShort: count(
      "corpEconomyBeforeScoreWindowCreditsShort",
    ),
    corpEconomyBeforeScoreWindowCreditsAlreadyEnough: count(
      "corpEconomyBeforeScoreWindowCreditsAlreadyEnough",
    ),
    corpEconomyBeforeScoreWindowRemoteSafe: count(
      "corpEconomyBeforeScoreWindowRemoteSafe",
    ),
    corpEconomyBeforeScoreWindowRemoteContestHigh: count(
      "corpEconomyBeforeScoreWindowRemoteContestHigh",
    ),
    corpEconomyBeforeScoreTaken: count("corpEconomyBeforeScoreTaken"),
    corpEconomyBeforeScoreTakenAsNecessaryCredits: count(
      "corpEconomyBeforeScoreTakenAsNecessaryCredits",
    ),
    corpEconomyBeforeScoreTakenDespiteCreditsEnough: count(
      "corpEconomyBeforeScoreTakenDespiteCreditsEnough",
    ),
    corpEconomyBeforeScoreTakenOverScoreLegal: count(
      "corpEconomyBeforeScoreTakenOverScoreLegal",
    ),
    corpEconomyBeforeScoreTakenOverAdvanceToScoreLegal: count(
      "corpEconomyBeforeScoreTakenOverAdvanceToScoreLegal",
    ),
    corpEconomyBeforeScoreTakenOverAgendaInstallReadyRemote: count(
      "corpEconomyBeforeScoreTakenOverAgendaInstallReadyRemote",
    ),
    corpEconomyBeforeScoreTakenOverHqAgendaExit: count(
      "corpEconomyBeforeScoreTakenOverHqAgendaExit",
    ),
    corpEconomyBeforeScoreTakenOverScoreAreaAbility: count(
      "corpEconomyBeforeScoreTakenOverScoreAreaAbility",
    ),
    corpEconomyBeforeScoreConvertedToScoreNextDecision: convertedToScoreNext,
    corpEconomyBeforeScoreConvertedToAdvanceNextDecision:
      convertedToAdvanceNext,
    corpEconomyBeforeScoreConvertedToAgendaInstallNextDecision:
      convertedToAgendaInstallNext,
    corpEconomyBeforeScoreConvertedWithin2CorpActions: convertedWithin2,
    corpEconomyBeforeScoreConvertedWithin3CorpActions: convertedWithin3,
    corpEconomyBeforeScoreNotConvertedWithin3CorpActions: notConvertedWithin3,
    corpEconomyBeforeScoreRepeatedEconomyNextDecision: repeatedEconomyNext,
    corpEconomyBeforeScoreRepeatedEconomyWithin3: repeatedEconomyWithin3,
    corpEconomyBeforeScoreThenDraw: thenDraw,
    corpEconomyBeforeScoreThenProtect: thenProtect,
    corpEconomyBeforeScoreThenNewRemote: thenNewRemote,
    corpEconomyBeforeScoreThenRunnerSteal: thenRunnerSteal,
    corpEconomyBeforeScoreThenActionLimit: thenActionLimit,
    corpEconomyBeforeScorePlausibleCreditsNeeded: count(
      "corpEconomyBeforeScorePlausibleCreditsNeeded",
    ),
    corpEconomyBeforeScorePlausibleRezOrAdvanceReserve: count(
      "corpEconomyBeforeScorePlausibleRezOrAdvanceReserve",
    ),
    corpEconomyBeforeScorePlausibleHqOrRndSafety: count(
      "corpEconomyBeforeScorePlausibleHqOrRndSafety",
    ),
    corpEconomyBeforeScorePlausibleRunnerContestTooHigh: count(
      "corpEconomyBeforeScorePlausibleRunnerContestTooHigh",
    ),
    corpEconomyBeforeScorePlausibleNoAgendaExit: count(
      "corpEconomyBeforeScorePlausibleNoAgendaExit",
    ),
    corpEconomyBeforeScoreSuspiciousCreditsAlreadyEnough: count(
      "corpEconomyBeforeScoreSuspiciousCreditsAlreadyEnough",
    ),
    corpEconomyBeforeScoreSuspiciousRepeatedEconomy: suspiciousRepeated,
    corpEconomyBeforeScoreSuspiciousDelayedTerminalAction: count(
      "corpEconomyBeforeScoreSuspiciousDelayedTerminalAction",
    ),
    corpEconomyBeforeScoreSuspiciousRemoteStillSafe: count(
      "corpEconomyBeforeScoreSuspiciousRemoteStillSafe",
    ),
    corpEconomyBeforeScoreSuspiciousRunnerStealFollowup:
      suspiciousStealFollowup,
    corpEconomyBeforeScoreUnclassified: count(
      "corpEconomyBeforeScoreUnclassified",
    ),
    corpEconomyBeforeScoreFixGateEligible: count(
      "corpEconomyBeforeScoreFixGateEligible",
    ),
    corpEconomyBeforeScoreFixGateBlockedByCredits: count(
      "corpEconomyBeforeScoreFixGateBlockedByCredits",
    ),
    corpEconomyBeforeScoreFixGateBlockedByCheapContest: count(
      "corpEconomyBeforeScoreFixGateBlockedByCheapContest",
    ),
    corpEconomyBeforeScoreFixGateBlockedByRunnerContest: count(
      "corpEconomyBeforeScoreFixGateBlockedByRunnerContest",
    ),
    corpEconomyBeforeScoreFixGateBlockedBySafety: count(
      "corpEconomyBeforeScoreFixGateBlockedBySafety",
    ),
    corpEconomyBeforeScoreFixGateSuspicious: count(
      "corpEconomyBeforeScoreFixGateSuspicious",
    ),
    corpEconomyBeforeScoreFixGateSuspiciousRepeatedEconomy: suspiciousRepeated,
    corpEconomyBeforeScoreFixGateSuspiciousNoConversion: suspiciousNoConversion,
    corpEconomyBeforeScoreFixGateSuspiciousStealFollowup:
      suspiciousStealFollowup,
    corpRepeatedEconomyBeforeScoreWindows: repeatedEconomyWithin3,
    corpRepeatedEconomyBeforeScoreCreditsStillShort: repeatedCreditsStillShort,
    corpRepeatedEconomyBeforeScoreCreditsAlreadyEnough:
      repeatedCreditsAlreadyEnough,
    corpRepeatedEconomyBeforeScoreScoreLegal: repeatedScoreLegal,
    corpRepeatedEconomyBeforeScoreAdvanceLegal: repeatedAdvanceLegal,
    corpRepeatedEconomyBeforeScoreAgendaInstallReadyRemoteLegal:
      repeatedAgendaInstallReadyRemoteLegal,
    corpRepeatedEconomyBeforeScoreRemoteSafe: repeatedRemoteSafe,
    corpRepeatedEconomyBeforeScoreRunnerContestHigh: repeatedRunnerContestHigh,
    corpRepeatedEconomyBeforeScoreThenScore: repeatedThenScore,
    corpRepeatedEconomyBeforeScoreThenRunnerSteal: repeatedThenRunnerSteal,
    corpRepeatedEconomyBeforeScoreThenActionLimit: repeatedThenActionLimit,
    corpRepeatedEconomyBeforeScoreSuspicious: repeatedSuspicious,
    corpRepeatedEconomyBeforeScorePlausible: repeatedPlausible,
    corpEconomyBeforeScoreNoConversionCreditsStillShort:
      noConversionCreditsStillShort,
    corpEconomyBeforeScoreNoConversionNoAgendaExit: noConversionNoAgendaExit,
    corpEconomyBeforeScoreNoConversionRemoteUnsafe: noConversionRemoteUnsafe,
    corpEconomyBeforeScoreNoConversionRunnerContestHigh:
      noConversionRunnerContestHigh,
    corpEconomyBeforeScoreNoConversionSafetyBlocked: noConversionSafetyBlocked,
    corpEconomyBeforeScoreNoConversionPlanDrift: noConversionPlanDrift,
    corpEconomyBeforeScoreNoConversionRepeatedEconomy:
      noConversionRepeatedEconomy,
    corpEconomyBeforeScoreNoConversionDrawLoop: noConversionDrawLoop,
    corpEconomyBeforeScoreNoConversionProtectionLoop:
      noConversionProtectionLoop,
    corpEconomyBeforeScoreNoConversionRemotePortfolioLoop:
      noConversionRemotePortfolioLoop,
    corpEconomyBeforeScoreNoConversionRunnerSteal: noConversionRunnerSteal,
    corpEconomyBeforeScoreNoConversionActionLimit: noConversionActionLimit,
    corpEconomyBeforeScoreNoConversionSuspicious: noConversionSuspicious,
    corpEconomyBeforeScoreNoConversionPlausible: noConversionPlausible,
    corpEconomyBeforeScoreCreditsEnoughWindows: entries.filter(
      (entry) =>
        entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true,
    ).length,
    corpEconomyBeforeScoreCreditsEnoughTaken: entries.filter(
      (entry) =>
        entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true &&
        entry.corpEconomyBeforeScoreTaken === true,
    ).length,
    corpEconomyBeforeScoreCreditsEnoughScoreLegal: entries.filter(
      (entry) =>
        entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true &&
        scoreLegal(entry),
    ).length,
    corpEconomyBeforeScoreCreditsEnoughAdvanceLegal: entries.filter(
      (entry) =>
        entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true &&
        advanceLegal(entry),
    ).length,
    corpEconomyBeforeScoreCreditsEnoughAgendaInstallReadyRemoteLegal:
      entries.filter(
        (entry) =>
          entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true &&
          agendaReadyLegal(entry),
      ).length,
    corpEconomyBeforeScoreCreditsEnoughSafetyBlocked: entries.filter(
      (entry) =>
        entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true &&
        entry.corpEconomyBeforeScoreFixGateBlockedBySafety === true,
    ).length,
    corpEconomyBeforeScoreCreditsEnoughSuspicious: entries.filter(
      (entry) =>
        entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true &&
        entry.corpEconomyBeforeScoreTaken === true &&
        fixGateSuspiciousEntry(entry),
    ).length,
    corpEconomyBeforeScoreCreditsEnoughPlausible: entries.filter(
      (entry) =>
        entry.corpEconomyBeforeScoreWindowCreditsAlreadyEnough === true &&
        blockedForPlausibleReason(entry),
    ).length,
  };
}
