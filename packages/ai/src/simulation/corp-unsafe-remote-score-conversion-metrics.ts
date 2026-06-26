import {
  evidenceValue,
  hasEvidenceFlag,
} from "../runtime/evidence-value";
import { roundNumber as round } from "../runtime/number-rounding";
import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import {
  corpCompressionActionLeadsToScoreLine,
  corpRemoteCreatedConverts,
  corpRemoteCreatedConvertsTo,
  isCorpProtectionScoreConversionAction,
  nextEntries,
  ownStrategicWindow,
  remoteTargetsMatch,
  runnerStealsBeforeNextCorpScore,
  scorePathFollowsCorpProtection,
} from "./plan-conversion-predicates";
import { progressionEntriesWithRunTargets } from "./progression-action-sequence";
import { averageNumber } from "./simulation-metric-aggregation";
export function summarizeCorpUnsafeRemoteScoreConversionMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "corpUnsafeScoringRemoteDetected"
  | "corpUnsafeScoringRemoteAlternativeChosen"
  | "corpUnsafeScoringRemoteStalled"
  | "corpUnsafeRemoteConvertedToProtection"
  | "corpUnsafeRemoteConvertedToBetterRemote"
  | "corpUnsafeRemoteConvertedToFastAdvance"
  | "corpUnsafeRemoteConvertedToHqProtection"
  | "corpUnsafeRemoteConvertedToEconomy"
  | "corpUnsafeRemoteConvertedToNoScorePath"
  | "corpBetterRemoteAvailable"
  | "corpBestRemoteSelectedForAgenda"
  | "corpScoringRemoteSafetyDeltaAfterProtection"
  | "corpProtectionConvertedToScoreWithin3"
  | "corpProtectionRepeatedWithoutScoreConversion"
  | "corpProtectionImprovedRemoteSafety"
  | "corpProtectionNoSafetyDelta"
  | "corpProtectionOpenedScorePath"
  | "corpProtectionFollowedByAgendaInstall"
  | "corpProtectionFollowedByAdvance"
  | "corpProtectionFollowedByScore"
  | "corpProtectionFollowedByMoreProtection"
  | "corpProtectionFollowedByEconomy"
  | "corpProtectionFollowedByCentralProtection"
  | "corpProtectionLoopAfterRemoteSafe"
  | "corpRemoteSafeButNoScoreActionTaken"
  | "corpRemoteSafeButAgendaHeld"
  | "corpRemoteSafeButAdvancedTooLate"
  | "corpRemoteSafetyDelta"
  | "corpRemoteSafetyDeltaAfterProtection"
  | "corpRemoteSafetyReadyForAgenda"
  | "corpScorePathChosenAfterProtection"
  | "corpScorePathSkippedAfterProtection"
  | "corpAdvanceBurstOpportunity"
  | "corpAdvanceBurstTaken"
  | "corpScorePathAvailableButNotTaken"
  | "corpScorePathBlockedByEffectiveRemoteSafety"
  | "corpAgendaHeldDueToUnsafeRemote"
  | "corpAgendaHeldTooLongWithHqPressure"
  | "corpAgendaInstalledInProtectedRemote"
  | "corpAgendaAdvancedInProtectedRemote"
  | "corpAgendaNearScoreWindow"
  | "corpScoreWindowCompressionOpportunity"
  | "corpScoreWindowCompressionTaken"
  | "corpScoreWindowCompressionRate"
  | "corpScoreWindowCompressionSkipped"
  | "corpNonEssentialActionBeforeScoreWindow"
  | "corpEconomyBeforeScoreWindow"
  | "corpEconomyBeforeScoreWindowNecessary"
  | "corpProtectionBeforeScoreWindow"
  | "corpProtectionBeforeScoreWindowNoSafetyDelta"
  | "corpCentralProtectionBeforeScoreWindow"
  | "corpCentralProtectionBeforeScoreWindowNecessary"
  | "corpDrawBeforeScoreWindow"
  | "corpEndTurnBeforeScoreWindow"
  | "corpSameTurnScoreOpportunity"
  | "corpSameTurnScoreTaken"
  | "corpScoreWindowLostAfterNonEssentialAction"
  | "corpRunnerStealAfterDelayedScoreWindow"
  | "corpAdvanceToScoreLineCompressedWithin2"
  | "corpAdvanceToScoreLineCompressedWithin3"
  | "scoredAgendaActionOpportunities"
  | "scoredAgendaActionTaken"
  | "scoredAgendaActionTakeRate"
  | "scoredAgendaEconomyOpportunities"
  | "scoredAgendaEconomyTaken"
  | "scoredAgendaEconomySkippedForBasicCredit"
  | "politicalOverthrowOpportunities"
  | "politicalOverthrowTaken"
  | "politicalOverthrowSkippedForBasicCredit"
  | "scoredAgendaCounterEconomyOpportunities"
  | "scoredAgendaCounterEconomyTaken"
  | "scoredAgendaDrawOpportunities"
  | "scoredAgendaDrawTaken"
  | "scoredAgendaExtraActionOpportunities"
  | "scoredAgendaExtraActionTaken"
  | "scoredAgendaTraceTagOpportunities"
  | "scoredAgendaTraceTagTaken"
  | "scoredAgendaDamagePunishOpportunities"
  | "scoredAgendaDamagePunishTaken"
  | "scoredAgendaActionValueOverBasic"
  | "basicCreditTakenWhileBetterAgendaEconomyAvailable"
  | "basicDrawTakenWhileBetterAgendaDrawAvailable"
  | "corpNewRemoteCreated"
  | "corpNewRemoteCreatedWithPlan"
  | "corpNewRemoteCreatedWithoutPayloadPlan"
  | "corpEmptyRemoteWithIceCreated"
  | "corpEmptyRemoteStayedUnusedTurns"
  | "corpRemoteConvertedToAgendaAssetOrBait"
  | "corpRemoteConversionRate"
  | "corpIceInstalledOnNewRemoteInsteadOfExistingScoringRemote"
  | "corpExistingRemoteCouldBeStrengthened"
  | "corpRemotePortfolioOverExpanded"
  | "corpOneIceRemoteCheaplyContestable"
  | "corpRemoteIceConsolidationOpportunity"
  | "corpRemoteIceConsolidationTaken"
  | "corpRemoteCreatedThenNoScorePath"
  | "corpRemoteCreatedThenAgendaInstalledWithin3"
  | "corpRemoteCreatedThenAssetInstalledWithin3"
  | "corpRemoteCreatedThenBaitOrAmbushWithin3"
  | "corpHqCardCount"
  | "corpHqKnownAgendaCount"
  | "corpHqAgendaDensity"
  | "corpHqAgendaFloodRisk"
  | "runnerHqAccessThreat"
  | "runnerHqKnownAgendaThreat"
  | "runnerHqMultiaccessThreat"
  | "corpDrawWouldLikelyDiluteHq"
  | "corpDrawWouldRiskAgendaFlood"
  | "corpDrawChosenToDiluteAgendaFlood"
  | "corpDrawSkippedBecauseAgendaFloodRisk"
  | "corpAgendaRemovedFromHqToRemoteOrScore"
  | "corpHqProtectionChosenOverDilution"
  | "corpHqDilutionChosenBecauseNoSafeRemote"
  | "corpHqDilutionBackfiredAgendaDrawn"
  | "corpHqDensityReducedAfterDraw"
  | "corpHqDensityIncreasedAfterDraw"
> {
  let corpUnsafeScoringRemoteDetected = 0;
  let corpUnsafeScoringRemoteAlternativeChosen = 0;
  let corpUnsafeScoringRemoteStalled = 0;
  let corpUnsafeRemoteConvertedToProtection = 0;
  let corpUnsafeRemoteConvertedToBetterRemote = 0;
  let corpUnsafeRemoteConvertedToFastAdvance = 0;
  let corpUnsafeRemoteConvertedToHqProtection = 0;
  let corpUnsafeRemoteConvertedToEconomy = 0;
  let corpUnsafeRemoteConvertedToNoScorePath = 0;
  let corpBetterRemoteAvailable = 0;
  let corpBestRemoteSelectedForAgenda = 0;
  let corpProtectionConvertedToScoreWithin3 = 0;
  let corpProtectionRepeatedWithoutScoreConversion = 0;
  let corpProtectionImprovedRemoteSafety = 0;
  let corpProtectionNoSafetyDelta = 0;
  let corpProtectionOpenedScorePath = 0;
  let corpProtectionFollowedByAgendaInstall = 0;
  let corpProtectionFollowedByAdvance = 0;
  let corpProtectionFollowedByScore = 0;
  let corpProtectionFollowedByMoreProtection = 0;
  let corpProtectionFollowedByEconomy = 0;
  let corpProtectionFollowedByCentralProtection = 0;
  let corpProtectionLoopAfterRemoteSafe = 0;
  let corpRemoteSafeButNoScoreActionTaken = 0;
  let corpRemoteSafeButAgendaHeld = 0;
  let corpRemoteSafeButAdvancedTooLate = 0;
  let corpRemoteSafetyReadyForAgenda = 0;
  let corpScorePathChosenAfterProtection = 0;
  let corpScorePathSkippedAfterProtection = 0;
  let corpAdvanceBurstOpportunity = 0;
  let corpAdvanceBurstTaken = 0;
  let corpScorePathAvailableButNotTaken = 0;
  let corpScorePathBlockedByEffectiveRemoteSafety = 0;
  let corpAgendaHeldDueToUnsafeRemote = 0;
  let corpAgendaHeldTooLongWithHqPressure = 0;
  let corpAgendaInstalledInProtectedRemote = 0;
  let corpAgendaAdvancedInProtectedRemote = 0;
  let corpAgendaNearScoreWindow = 0;
  let corpScoreWindowCompressionOpportunity = 0;
  let corpScoreWindowCompressionTaken = 0;
  let corpScoreWindowCompressionSkipped = 0;
  let corpNonEssentialActionBeforeScoreWindow = 0;
  let corpEconomyBeforeScoreWindow = 0;
  let corpEconomyBeforeScoreWindowNecessary = 0;
  let corpProtectionBeforeScoreWindow = 0;
  let corpProtectionBeforeScoreWindowNoSafetyDelta = 0;
  let corpCentralProtectionBeforeScoreWindow = 0;
  let corpCentralProtectionBeforeScoreWindowNecessary = 0;
  let corpDrawBeforeScoreWindow = 0;
  let corpEndTurnBeforeScoreWindow = 0;
  let corpSameTurnScoreOpportunity = 0;
  let corpSameTurnScoreTaken = 0;
  let corpScoreWindowLostAfterNonEssentialAction = 0;
  let corpRunnerStealAfterDelayedScoreWindow = 0;
  let corpAdvanceToScoreLineCompressedWithin2 = 0;
  let corpAdvanceToScoreLineCompressedWithin3 = 0;
  let scoredAgendaActionOpportunities = 0;
  let scoredAgendaActionTaken = 0;
  let scoredAgendaEconomyOpportunities = 0;
  let scoredAgendaEconomyTaken = 0;
  let scoredAgendaEconomySkippedForBasicCredit = 0;
  let politicalOverthrowOpportunities = 0;
  let politicalOverthrowTaken = 0;
  let politicalOverthrowSkippedForBasicCredit = 0;
  let scoredAgendaCounterEconomyOpportunities = 0;
  let scoredAgendaCounterEconomyTaken = 0;
  let scoredAgendaDrawOpportunities = 0;
  let scoredAgendaDrawTaken = 0;
  let scoredAgendaExtraActionOpportunities = 0;
  let scoredAgendaExtraActionTaken = 0;
  let scoredAgendaTraceTagOpportunities = 0;
  let scoredAgendaTraceTagTaken = 0;
  let scoredAgendaDamagePunishOpportunities = 0;
  let scoredAgendaDamagePunishTaken = 0;
  let scoredAgendaActionValueOverBasic = 0;
  let basicCreditTakenWhileBetterAgendaEconomyAvailable = 0;
  let basicDrawTakenWhileBetterAgendaDrawAvailable = 0;
  let corpNewRemoteCreated = 0;
  let corpNewRemoteCreatedWithPlan = 0;
  let corpNewRemoteCreatedWithoutPayloadPlan = 0;
  let corpEmptyRemoteWithIceCreated = 0;
  let corpEmptyRemoteStayedUnusedTurns = 0;
  let corpRemoteConvertedToAgendaAssetOrBait = 0;
  let corpIceInstalledOnNewRemoteInsteadOfExistingScoringRemote = 0;
  let corpExistingRemoteCouldBeStrengthened = 0;
  let corpRemotePortfolioOverExpanded = 0;
  let corpOneIceRemoteCheaplyContestable = 0;
  let corpRemoteIceConsolidationOpportunity = 0;
  let corpRemoteIceConsolidationTaken = 0;
  let corpRemoteCreatedThenNoScorePath = 0;
  let corpRemoteCreatedThenAgendaInstalledWithin3 = 0;
  let corpRemoteCreatedThenAssetInstalledWithin3 = 0;
  let corpRemoteCreatedThenBaitOrAmbushWithin3 = 0;
  let corpHqAgendaFloodRisk = 0;
  let runnerHqAccessThreat = 0;
  let runnerHqKnownAgendaThreat = 0;
  let runnerHqMultiaccessThreat = 0;
  let corpDrawWouldLikelyDiluteHq = 0;
  let corpDrawWouldRiskAgendaFlood = 0;
  let corpDrawChosenToDiluteAgendaFlood = 0;
  let corpDrawSkippedBecauseAgendaFloodRisk = 0;
  let corpAgendaRemovedFromHqToRemoteOrScore = 0;
  let corpHqProtectionChosenOverDilution = 0;
  let corpHqDilutionChosenBecauseNoSafeRemote = 0;
  let corpHqDilutionBackfiredAgendaDrawn = 0;
  let corpHqDensityReducedAfterDraw = 0;
  let corpHqDensityIncreasedAfterDraw = 0;
  const protectionSafetyDeltas: number[] = [];
  const remoteSafetyDeltas: number[] = [];
  const remoteSafetyDeltasAfterProtection: number[] = [];
  const hqCardCounts: number[] = [];
  const hqKnownAgendaCounts: number[] = [];
  const hqAgendaDensities: number[] = [];

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    const repeatedProtectionIndexes = new Set<number>();
    for (let index = 0; index < sequence.length; index += 1) {
      const entry = sequence[index]!;
      if (entry.side !== "corp") continue;
      const detected = hasEvidenceFlag(
        entry,
        "corp_unsafe_scoring_remote_detected:true",
      );
      if (detected) corpUnsafeScoringRemoteDetected += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_unsafe_scoring_remote_alternative_chosen:true",
        )
      )
        corpUnsafeScoringRemoteAlternativeChosen += 1;
      if (hasEvidenceFlag(entry, "corp_unsafe_scoring_remote_stalled:true"))
        corpUnsafeScoringRemoteStalled += 1;
      const protection = hasEvidenceFlag(
        entry,
        "corp_unsafe_remote_converted_to_protection:true",
      );
      if (protection) corpUnsafeRemoteConvertedToProtection += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_unsafe_remote_converted_to_better_remote:true",
        )
      )
        corpUnsafeRemoteConvertedToBetterRemote += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_unsafe_remote_converted_to_fast_advance:true",
        )
      )
        corpUnsafeRemoteConvertedToFastAdvance += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_unsafe_remote_converted_to_hq_protection:true",
        )
      )
        corpUnsafeRemoteConvertedToHqProtection += 1;
      if (
        hasEvidenceFlag(entry, "corp_unsafe_remote_converted_to_economy:true")
      )
        corpUnsafeRemoteConvertedToEconomy += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_unsafe_remote_converted_to_no_score_path:true",
        )
      )
        corpUnsafeRemoteConvertedToNoScorePath += 1;
      if (hasEvidenceFlag(entry, "corp_better_remote_available:true"))
        corpBetterRemoteAvailable += 1;
      if (hasEvidenceFlag(entry, "corp_best_remote_selected_for_agenda:true"))
        corpBestRemoteSelectedForAgenda += 1;
      if (hasEvidenceFlag(entry, "corp_protection_no_safety_delta:true"))
        corpProtectionNoSafetyDelta += 1;
      const scorePathFollowsRecentProtection = scorePathFollowsCorpProtection(
        sequence,
        index,
      );
      if (
        hasEvidenceFlag(entry, "corp_protection_opened_score_path:true") &&
        scorePathFollowsRecentProtection
      )
        corpProtectionOpenedScorePath += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_protection_followed_by_agenda_install:true",
        )
      )
        corpProtectionFollowedByAgendaInstall += 1;
      if (hasEvidenceFlag(entry, "corp_protection_followed_by_advance:true"))
        corpProtectionFollowedByAdvance += 1;
      if (hasEvidenceFlag(entry, "corp_protection_followed_by_score:true"))
        corpProtectionFollowedByScore += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_protection_followed_by_more_protection:true",
        )
      )
        corpProtectionFollowedByMoreProtection += 1;
      if (hasEvidenceFlag(entry, "corp_protection_followed_by_economy:true"))
        corpProtectionFollowedByEconomy += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_protection_followed_by_central_protection:true",
        )
      )
        corpProtectionFollowedByCentralProtection += 1;
      if (hasEvidenceFlag(entry, "corp_protection_loop_after_remote_safe:true"))
        corpProtectionLoopAfterRemoteSafe += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_remote_safe_but_no_score_action_taken:true",
        )
      )
        corpRemoteSafeButNoScoreActionTaken += 1;
      if (hasEvidenceFlag(entry, "corp_remote_safe_but_agenda_held:true"))
        corpRemoteSafeButAgendaHeld += 1;
      if (hasEvidenceFlag(entry, "corp_remote_safe_but_advanced_too_late:true"))
        corpRemoteSafeButAdvancedTooLate += 1;
      if (hasEvidenceFlag(entry, "corp_remote_safety_ready_for_agenda:true"))
        corpRemoteSafetyReadyForAgenda += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_score_path_chosen_after_protection:true",
        ) &&
        scorePathFollowsRecentProtection
      )
        corpScorePathChosenAfterProtection += 1;
      if (
        hasEvidenceFlag(entry, "corp_score_path_skipped_after_protection:true")
      )
        corpScorePathSkippedAfterProtection += 1;
      if (hasEvidenceFlag(entry, "corp_advance_burst_opportunity:true"))
        corpAdvanceBurstOpportunity += 1;
      if (hasEvidenceFlag(entry, "corp_advance_burst_taken:true"))
        corpAdvanceBurstTaken += 1;
      if (
        hasEvidenceFlag(entry, "corp_score_path_available_but_not_taken:true")
      )
        corpScorePathAvailableButNotTaken += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_score_path_blocked_by_effective_remote_safety:true",
        )
      )
        corpScorePathBlockedByEffectiveRemoteSafety += 1;
      if (hasEvidenceFlag(entry, "corp_agenda_held_due_to_unsafe_remote:true"))
        corpAgendaHeldDueToUnsafeRemote += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_agenda_held_too_long_with_hq_pressure:true",
        )
      )
        corpAgendaHeldTooLongWithHqPressure += 1;
      if (
        hasEvidenceFlag(entry, "corp_agenda_installed_in_protected_remote:true")
      )
        corpAgendaInstalledInProtectedRemote += 1;
      if (
        hasEvidenceFlag(entry, "corp_agenda_advanced_in_protected_remote:true")
      )
        corpAgendaAdvancedInProtectedRemote += 1;
      if (hasEvidenceFlag(entry, "corp_agenda_near_score_window:true"))
        corpAgendaNearScoreWindow += 1;
      const compressionOpportunity = hasEvidenceFlag(
        entry,
        "corp_score_window_compression_opportunity:true",
      );
      if (compressionOpportunity) corpScoreWindowCompressionOpportunity += 1;
      if (hasEvidenceFlag(entry, "corp_score_window_compression_taken:true")) {
        corpScoreWindowCompressionTaken += 1;
        if (corpCompressionActionLeadsToScoreLine(sequence, index, 2))
          corpAdvanceToScoreLineCompressedWithin2 += 1;
        if (corpCompressionActionLeadsToScoreLine(sequence, index, 3))
          corpAdvanceToScoreLineCompressedWithin3 += 1;
      }
      if (hasEvidenceFlag(entry, "corp_score_window_compression_skipped:true"))
        corpScoreWindowCompressionSkipped += 1;
      const nonEssentialBeforeScoreWindow = hasEvidenceFlag(
        entry,
        "corp_non_essential_action_before_score_window:true",
      );
      if (nonEssentialBeforeScoreWindow) {
        corpNonEssentialActionBeforeScoreWindow += 1;
        if (runnerStealsBeforeNextCorpScore(sequence, index)) {
          corpScoreWindowLostAfterNonEssentialAction += 1;
          corpRunnerStealAfterDelayedScoreWindow += 1;
        }
      }
      if (hasEvidenceFlag(entry, "corp_economy_before_score_window:true"))
        corpEconomyBeforeScoreWindow += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_economy_before_score_window_necessary:true",
        )
      )
        corpEconomyBeforeScoreWindowNecessary += 1;
      if (hasEvidenceFlag(entry, "corp_protection_before_score_window:true"))
        corpProtectionBeforeScoreWindow += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_protection_before_score_window_no_safety_delta:true",
        )
      )
        corpProtectionBeforeScoreWindowNoSafetyDelta += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_central_protection_before_score_window:true",
        )
      )
        corpCentralProtectionBeforeScoreWindow += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_central_protection_before_score_window_necessary:true",
        )
      )
        corpCentralProtectionBeforeScoreWindowNecessary += 1;
      if (hasEvidenceFlag(entry, "corp_draw_before_score_window:true"))
        corpDrawBeforeScoreWindow += 1;
      if (hasEvidenceFlag(entry, "corp_end_turn_before_score_window:true"))
        corpEndTurnBeforeScoreWindow += 1;
      if (hasEvidenceFlag(entry, "corp_same_turn_score_opportunity:true"))
        corpSameTurnScoreOpportunity += 1;
      if (hasEvidenceFlag(entry, "corp_same_turn_score_taken:true"))
        corpSameTurnScoreTaken += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_action_opportunity:true"))
        scoredAgendaActionOpportunities += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_action_taken:true"))
        scoredAgendaActionTaken += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_economy_opportunity:true"))
        scoredAgendaEconomyOpportunities += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_economy_taken:true"))
        scoredAgendaEconomyTaken += 1;
      if (
        hasEvidenceFlag(
          entry,
          "scored_agenda_economy_skipped_for_basic_credit:true",
        )
      )
        scoredAgendaEconomySkippedForBasicCredit += 1;
      if (hasEvidenceFlag(entry, "political_overthrow_opportunity:true"))
        politicalOverthrowOpportunities += 1;
      if (hasEvidenceFlag(entry, "political_overthrow_taken:true"))
        politicalOverthrowTaken += 1;
      if (
        hasEvidenceFlag(
          entry,
          "political_overthrow_skipped_for_basic_credit:true",
        )
      )
        politicalOverthrowSkippedForBasicCredit += 1;
      if (
        hasEvidenceFlag(entry, "scored_agenda_counter_economy_opportunity:true")
      )
        scoredAgendaCounterEconomyOpportunities += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_counter_economy_taken:true"))
        scoredAgendaCounterEconomyTaken += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_draw_opportunity:true"))
        scoredAgendaDrawOpportunities += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_draw_taken:true"))
        scoredAgendaDrawTaken += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_extra_action_opportunity:true"))
        scoredAgendaExtraActionOpportunities += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_extra_action_taken:true"))
        scoredAgendaExtraActionTaken += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_trace_tag_opportunity:true"))
        scoredAgendaTraceTagOpportunities += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_trace_tag_taken:true"))
        scoredAgendaTraceTagTaken += 1;
      if (
        hasEvidenceFlag(entry, "scored_agenda_damage_punish_opportunity:true")
      )
        scoredAgendaDamagePunishOpportunities += 1;
      if (hasEvidenceFlag(entry, "scored_agenda_damage_punish_taken:true"))
        scoredAgendaDamagePunishTaken += 1;
      scoredAgendaActionValueOverBasic += Math.max(
        0,
        Number(
          evidenceValue(entry, "scored_agenda_action_value_over_basic:") ?? 0,
        ),
      );
      if (
        hasEvidenceFlag(
          entry,
          "basic_credit_taken_while_better_agenda_economy_available:true",
        )
      )
        basicCreditTakenWhileBetterAgendaEconomyAvailable += 1;
      if (
        hasEvidenceFlag(
          entry,
          "basic_draw_taken_while_better_agenda_draw_available:true",
        )
      )
        basicDrawTakenWhileBetterAgendaDrawAvailable += 1;
      if (hasEvidenceFlag(entry, "corp_new_remote_created:true"))
        corpNewRemoteCreated += 1;
      if (hasEvidenceFlag(entry, "corp_new_remote_created_with_plan:true"))
        corpNewRemoteCreatedWithPlan += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_new_remote_created_without_payload_plan:true",
        )
      )
        corpNewRemoteCreatedWithoutPayloadPlan += 1;
      if (hasEvidenceFlag(entry, "corp_empty_remote_with_ice_created:true"))
        corpEmptyRemoteWithIceCreated += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_ice_installed_on_new_remote_instead_of_existing_scoring_remote:true",
        )
      )
        corpIceInstalledOnNewRemoteInsteadOfExistingScoringRemote += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_existing_remote_could_be_strengthened:true",
        )
      )
        corpExistingRemoteCouldBeStrengthened += 1;
      if (hasEvidenceFlag(entry, "corp_remote_portfolio_overexpanded:true"))
        corpRemotePortfolioOverExpanded += 1;
      if (
        hasEvidenceFlag(entry, "corp_one_ice_remote_cheaply_contestable:true")
      )
        corpOneIceRemoteCheaplyContestable += 1;
      if (
        hasEvidenceFlag(entry, "corp_remote_ice_consolidation_opportunity:true")
      )
        corpRemoteIceConsolidationOpportunity += 1;
      if (hasEvidenceFlag(entry, "corp_remote_ice_consolidation_taken:true"))
        corpRemoteIceConsolidationTaken += 1;
      if (
        hasEvidenceFlag(entry, "corp_new_remote_created:true") &&
        !corpRemoteCreatedConverts(sequence, index, 3)
      ) {
        corpEmptyRemoteStayedUnusedTurns += 1;
        corpRemoteCreatedThenNoScorePath += 1;
      }
      if (
        hasEvidenceFlag(entry, "corp_new_remote_created:true") &&
        corpRemoteCreatedConvertsTo(sequence, index, 3, "agenda")
      )
        corpRemoteCreatedThenAgendaInstalledWithin3 += 1;
      if (
        hasEvidenceFlag(entry, "corp_new_remote_created:true") &&
        corpRemoteCreatedConvertsTo(sequence, index, 3, "asset")
      )
        corpRemoteCreatedThenAssetInstalledWithin3 += 1;
      if (
        hasEvidenceFlag(entry, "corp_new_remote_created:true") &&
        corpRemoteCreatedConvertsTo(sequence, index, 3, "bait")
      )
        corpRemoteCreatedThenBaitOrAmbushWithin3 += 1;
      if (hasEvidenceFlag(entry, "corp_hq_agenda_flood_risk:true"))
        corpHqAgendaFloodRisk += 1;
      if (hasEvidenceFlag(entry, "runner_hq_access_threat:true"))
        runnerHqAccessThreat += 1;
      if (hasEvidenceFlag(entry, "runner_hq_known_agenda_threat:true"))
        runnerHqKnownAgendaThreat += 1;
      if (hasEvidenceFlag(entry, "runner_hq_multiaccess_threat:true"))
        runnerHqMultiaccessThreat += 1;
      if (hasEvidenceFlag(entry, "corp_draw_would_likely_dilute_hq:true"))
        corpDrawWouldLikelyDiluteHq += 1;
      if (hasEvidenceFlag(entry, "corp_draw_would_risk_agenda_flood:true"))
        corpDrawWouldRiskAgendaFlood += 1;
      if (
        hasEvidenceFlag(entry, "corp_draw_chosen_to_dilute_agenda_flood:true")
      )
        corpDrawChosenToDiluteAgendaFlood += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_draw_skipped_because_agenda_flood_risk:true",
        )
      )
        corpDrawSkippedBecauseAgendaFloodRisk += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_agenda_removed_from_hq_to_remote_or_score:true",
        )
      )
        corpAgendaRemovedFromHqToRemoteOrScore += 1;
      if (
        hasEvidenceFlag(entry, "corp_hq_protection_chosen_over_dilution:true")
      )
        corpHqProtectionChosenOverDilution += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_hq_dilution_chosen_because_no_safe_remote:true",
        )
      )
        corpHqDilutionChosenBecauseNoSafeRemote += 1;
      const hqCardCount = Number(evidenceValue(entry, "corp_hq_card_count:"));
      if (Number.isFinite(hqCardCount)) hqCardCounts.push(hqCardCount);
      const hqAgendaCount = Number(
        evidenceValue(entry, "corp_hq_known_agenda_count:"),
      );
      if (Number.isFinite(hqAgendaCount))
        hqKnownAgendaCounts.push(hqAgendaCount);
      const hqDensity = Number(evidenceValue(entry, "corp_hq_agenda_density:"));
      if (Number.isFinite(hqDensity)) hqAgendaDensities.push(hqDensity);

      const delta = Number(
        evidenceValue(
          entry,
          "corp_scoring_remote_safety_delta_after_protection:",
        ),
      );
      if (Number.isFinite(delta)) protectionSafetyDeltas.push(delta);
      if (Number.isFinite(delta)) {
        remoteSafetyDeltas.push(delta);
        remoteSafetyDeltasAfterProtection.push(delta);
        if (delta > 0) corpProtectionImprovedRemoteSafety += 1;
      }

      if (protection) {
        if (
          ownStrategicWindow(sequence, index, 3).some(
            (candidate) =>
              candidate.side === "corp" &&
              isCorpProtectionScoreConversionAction(candidate),
          )
        )
          corpProtectionConvertedToScoreWithin3 += 1;
        else repeatedProtectionIndexes.add(index);
      }
      if (
        hasEvidenceFlag(
          entry,
          "corp_protection_repeated_without_score_conversion:true",
        )
      )
        repeatedProtectionIndexes.add(index);
    }
    corpProtectionRepeatedWithoutScoreConversion +=
      repeatedProtectionIndexes.size;
  }

  return {
    corpUnsafeScoringRemoteDetected,
    corpUnsafeScoringRemoteAlternativeChosen,
    corpUnsafeScoringRemoteStalled,
    corpUnsafeRemoteConvertedToProtection,
    corpUnsafeRemoteConvertedToBetterRemote,
    corpUnsafeRemoteConvertedToFastAdvance,
    corpUnsafeRemoteConvertedToHqProtection,
    corpUnsafeRemoteConvertedToEconomy,
    corpUnsafeRemoteConvertedToNoScorePath,
    corpBetterRemoteAvailable,
    corpBestRemoteSelectedForAgenda,
    corpScoringRemoteSafetyDeltaAfterProtection: averageNumber(
      protectionSafetyDeltas,
    ),
    corpProtectionConvertedToScoreWithin3,
    corpProtectionRepeatedWithoutScoreConversion,
    corpProtectionImprovedRemoteSafety,
    corpProtectionNoSafetyDelta,
    corpProtectionOpenedScorePath,
    corpProtectionFollowedByAgendaInstall,
    corpProtectionFollowedByAdvance,
    corpProtectionFollowedByScore,
    corpProtectionFollowedByMoreProtection,
    corpProtectionFollowedByEconomy,
    corpProtectionFollowedByCentralProtection,
    corpProtectionLoopAfterRemoteSafe,
    corpRemoteSafeButNoScoreActionTaken,
    corpRemoteSafeButAgendaHeld,
    corpRemoteSafeButAdvancedTooLate,
    corpRemoteSafetyDelta: averageNumber(remoteSafetyDeltas),
    corpRemoteSafetyDeltaAfterProtection: averageNumber(
      remoteSafetyDeltasAfterProtection,
    ),
    corpRemoteSafetyReadyForAgenda,
    corpScorePathChosenAfterProtection,
    corpScorePathSkippedAfterProtection,
    corpAdvanceBurstOpportunity,
    corpAdvanceBurstTaken,
    corpScorePathAvailableButNotTaken,
    corpScorePathBlockedByEffectiveRemoteSafety,
    corpAgendaHeldDueToUnsafeRemote,
    corpAgendaHeldTooLongWithHqPressure,
    corpAgendaInstalledInProtectedRemote,
    corpAgendaAdvancedInProtectedRemote,
    corpAgendaNearScoreWindow,
    corpScoreWindowCompressionOpportunity,
    corpScoreWindowCompressionTaken,
    corpScoreWindowCompressionRate:
      corpScoreWindowCompressionOpportunity > 0
        ? round(
            corpScoreWindowCompressionTaken /
              corpScoreWindowCompressionOpportunity,
          )
        : 0,
    corpScoreWindowCompressionSkipped,
    corpNonEssentialActionBeforeScoreWindow,
    corpEconomyBeforeScoreWindow,
    corpEconomyBeforeScoreWindowNecessary,
    corpProtectionBeforeScoreWindow,
    corpProtectionBeforeScoreWindowNoSafetyDelta,
    corpCentralProtectionBeforeScoreWindow,
    corpCentralProtectionBeforeScoreWindowNecessary,
    corpDrawBeforeScoreWindow,
    corpEndTurnBeforeScoreWindow,
    corpSameTurnScoreOpportunity,
    corpSameTurnScoreTaken,
    corpScoreWindowLostAfterNonEssentialAction,
    corpRunnerStealAfterDelayedScoreWindow,
    corpAdvanceToScoreLineCompressedWithin2,
    corpAdvanceToScoreLineCompressedWithin3,
    scoredAgendaActionOpportunities,
    scoredAgendaActionTaken,
    scoredAgendaActionTakeRate:
      scoredAgendaActionOpportunities > 0
        ? round(scoredAgendaActionTaken / scoredAgendaActionOpportunities)
        : 0,
    scoredAgendaEconomyOpportunities,
    scoredAgendaEconomyTaken,
    scoredAgendaEconomySkippedForBasicCredit,
    politicalOverthrowOpportunities,
    politicalOverthrowTaken,
    politicalOverthrowSkippedForBasicCredit,
    scoredAgendaCounterEconomyOpportunities,
    scoredAgendaCounterEconomyTaken,
    scoredAgendaDrawOpportunities,
    scoredAgendaDrawTaken,
    scoredAgendaExtraActionOpportunities,
    scoredAgendaExtraActionTaken,
    scoredAgendaTraceTagOpportunities,
    scoredAgendaTraceTagTaken,
    scoredAgendaDamagePunishOpportunities,
    scoredAgendaDamagePunishTaken,
    scoredAgendaActionValueOverBasic,
    basicCreditTakenWhileBetterAgendaEconomyAvailable,
    basicDrawTakenWhileBetterAgendaDrawAvailable,
    corpNewRemoteCreated,
    corpNewRemoteCreatedWithPlan,
    corpNewRemoteCreatedWithoutPayloadPlan,
    corpEmptyRemoteWithIceCreated,
    corpEmptyRemoteStayedUnusedTurns,
    corpRemoteConvertedToAgendaAssetOrBait:
      corpRemoteCreatedThenAgendaInstalledWithin3 +
      corpRemoteCreatedThenAssetInstalledWithin3 +
      corpRemoteCreatedThenBaitOrAmbushWithin3,
    corpRemoteConversionRate:
      corpNewRemoteCreated > 0
        ? round(
            (corpRemoteCreatedThenAgendaInstalledWithin3 +
              corpRemoteCreatedThenAssetInstalledWithin3 +
              corpRemoteCreatedThenBaitOrAmbushWithin3) /
              corpNewRemoteCreated,
          )
        : 0,
    corpIceInstalledOnNewRemoteInsteadOfExistingScoringRemote,
    corpExistingRemoteCouldBeStrengthened,
    corpRemotePortfolioOverExpanded,
    corpOneIceRemoteCheaplyContestable,
    corpRemoteIceConsolidationOpportunity,
    corpRemoteIceConsolidationTaken,
    corpRemoteCreatedThenNoScorePath,
    corpRemoteCreatedThenAgendaInstalledWithin3,
    corpRemoteCreatedThenAssetInstalledWithin3,
    corpRemoteCreatedThenBaitOrAmbushWithin3,
    corpHqCardCount: averageNumber(hqCardCounts),
    corpHqKnownAgendaCount: averageNumber(hqKnownAgendaCounts),
    corpHqAgendaDensity: averageNumber(hqAgendaDensities),
    corpHqAgendaFloodRisk,
    runnerHqAccessThreat,
    runnerHqKnownAgendaThreat,
    runnerHqMultiaccessThreat,
    corpDrawWouldLikelyDiluteHq,
    corpDrawWouldRiskAgendaFlood,
    corpDrawChosenToDiluteAgendaFlood,
    corpDrawSkippedBecauseAgendaFloodRisk,
    corpAgendaRemovedFromHqToRemoteOrScore,
    corpHqProtectionChosenOverDilution,
    corpHqDilutionChosenBecauseNoSafeRemote,
    corpHqDilutionBackfiredAgendaDrawn,
    corpHqDensityReducedAfterDraw,
    corpHqDensityIncreasedAfterDraw,
  };
}
