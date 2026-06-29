import type {
  CorpPunishKind,
  CorpTagPunishSkipReason,
  CorpTagPunishUnknownChosenFamily,
  CorpTagPunishUnknownSkipPlausibility,
} from "../runtime/corp-tag-punish-types";
import {
  addStringsToCounter as addCardsToCounter,
  addStringsToCounter as addKindsToCounter,
  incrementStringCounter,
  incrementTypedCounter,
} from "../runtime/counter";
import {
  evidenceValue,
  hasEvidenceFlag,
} from "../runtime/evidence-value";
import { roundNumber as round } from "../runtime/number-rounding";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { progressionEntriesWithRunTargets } from "./progression-action-sequence";
import {
  isTerminalDamageOrEconomicPunish,
  previousEncounterTagBefore,
  previousFunnelSourceBefore,
  previousRunnerTurnTagBefore,
  tagSourceConvertsToPunishOpportunity,
  tagSourceConvertsToPunishTaken,
  tagSourceConvertsToRunnerTagged,
  tagSourceConvertsToTaggedCorpDecision,
  tagSourceConvertsToVisibleLegalPayoffWindow,
} from "./tag-punish-funnel-predicates";
export function summarizeTagPunishWindowMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "runnerTaggedAtCorpDecision"
  | "runnerTaggedAtCorpDecisionTurns"
  | "runnerTaggedAtCorpDecisionActions"
  | "runnerTagClearedBeforeCorpDecision"
  | "runnerTagClearedSameRunnerTurn"
  | "runnerTagWindowExpiredBeforeCorpTurn"
  | "runnerTaggedAfterTraceDuringRun"
  | "runnerTaggedAtEndOfRunnerTurn"
  | "runnerTaggedAtStartOfCorpTurn"
  | "corpTagCreatedDuringRunnerTurn"
  | "corpTagCreatedDuringCorpTurn"
  | "corpTagCreatedDuringEncounter"
  | "corpTagCreatedByTraceSuccess"
  | "corpTagCreatedByAccessOrSteal"
  | "corpTagCreatedByPersistentEffect"
  | "corpTagCreatedByScoredAgendaAction"
  | "corpTagCreatedByOperation"
  | "corpTagCreatedByAssetOrNode"
  | "corpTagCreatedByIce"
  | "runnerTaggedAtCorpDecisionWithFunnelPayoffKnown"
  | "runnerTaggedAtCorpDecisionWithoutPayoffKnown"
  | "runnerTagFromPreviousRunnerTurnStillVisibleAtCorpDecision"
  | "runnerTagFromEncounterStillVisibleAtCorpDecision"
  | "runnerTagClearedBeforeCorpDecisionAfterFunnelSource"
  | "runnerTagClearedSameRunnerTurnAfterSource"
  | "runnerTagWindowExpiredBeforeCorpDecision"
  | "corpVisibleTagPunishLegalActions"
  | "corpVisibleTagDamagePunishLegalActions"
  | "corpVisibleTagEconomicPunishLegalActions"
  | "corpVisibleTagTrashPunishLegalActions"
  | "corpVisibleTagRunLockPunishLegalActions"
  | "corpVisibleTagAmbushPunishLegalActions"
  | "corpVisibleTagPayoffLegalActionsByKind"
  | "corpVisibleTagPayoffLegalActionsByCard"
  | "corpVisibleTagPunishTaken"
  | "corpVisibleTagPunishSkipped"
  | "corpVisibleTagPunishSkippedForScore"
  | "corpVisibleTagPunishSkippedForAdvance"
  | "corpVisibleTagPunishSkippedForEconomy"
  | "corpVisibleTagPunishSkippedForRemoteProtection"
  | "corpVisibleTagPunishSkippedForCentralProtection"
  | "corpVisibleTagPunishSkippedForDraw"
  | "corpVisibleTagPunishSkippedForInstall"
  | "corpVisibleTagPunishSkippedForEndTurn"
  | "corpVisibleTagPunishSkippedForUnknownHigherPriority"
  | "corpVisibleTagPunishSkippedUnknownChosenScore"
  | "corpVisibleTagPunishSkippedUnknownChosenAdvance"
  | "corpVisibleTagPunishSkippedUnknownChosenInstallAgenda"
  | "corpVisibleTagPunishSkippedUnknownChosenInstallIce"
  | "corpVisibleTagPunishSkippedUnknownChosenInstallAssetOrUpgrade"
  | "corpVisibleTagPunishSkippedUnknownChosenRez"
  | "corpVisibleTagPunishSkippedUnknownChosenOperation"
  | "corpVisibleTagPunishSkippedUnknownChosenAbility"
  | "corpVisibleTagPunishSkippedUnknownChosenTraceTagSource"
  | "corpVisibleTagPunishSkippedUnknownChosenDraw"
  | "corpVisibleTagPunishSkippedUnknownChosenBasicCredit"
  | "corpVisibleTagPunishSkippedUnknownChosenEndTurn"
  | "corpVisibleTagPunishSkippedUnknownChosenUnknown"
  | "corpVisibleTagPunishSkippedUnknownByReasonCode"
  | "corpVisibleTagPunishSkippedUnknownByChosenActionType"
  | "corpVisibleTagPunishSkippedUnknownByChosenCard"
  | "corpVisibleTagPunishSkippedUnknownByPayoffCard"
  | "corpVisibleTagPunishSkippedUnknownByPayoffKind"
  | "corpVisibleTagPunishUnknownSkipPlausible"
  | "corpVisibleTagPunishUnknownSkipSuspicious"
  | "corpVisibleTagPunishUnknownSkipUnclassified"
  | "corpVisibleTagPunishUnknownSkipByPlausibility"
  | "corpVisibleTagPunishUnknownSkipPayoffDamage"
  | "corpVisibleTagPunishUnknownSkipPayoffEconomic"
  | "corpVisibleTagPunishUnknownSkipPayoffTrash"
  | "corpVisibleTagPunishUnknownSkipPayoffRunLock"
  | "corpVisibleTagPunishUnknownSkipPayoffAmbush"
  | "corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal"
  | "corpVisibleTagPunishUnknownSkipPayoffNonLethal"
  | "corpVisibleTagPunishFixGateEligibleWindow"
  | "corpVisibleTagPunishFixGateBlockedByScore"
  | "corpVisibleTagPunishFixGateBlockedByAdvanceScore"
  | "corpVisibleTagPunishFixGateBlockedBySafety"
  | "corpVisibleTagPunishFixGateBlockedByAffordability"
  | "corpVisibleTagPunishFixGateBlockedByLowImpact"
  | "corpVisibleTagPunishFixGateSuspiciousSkip"
  | "corpVisibleTagPunishDecisionWindows"
  | "corpVisibleTagPunishDecisionWindowsTaken"
  | "corpVisibleTagPunishDecisionWindowsSkipped"
  | "corpVisibleTagPunishDecisionWindowsWithMultiplePayoffs"
  | "corpVisibleTagPunishAlternativePayoffsNotChosen"
  | "corpVisibleTagPunishChosenPayoffAmongAlternatives"
  | "corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff"
  | "corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization"
  | "corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen"
  | "corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization"
  | "corpVisibleTagPunishOperationChoiceAmongPayoffs"
  | "corpVisibleTagPunishChosenDamageOverEconomic"
  | "corpVisibleTagPunishChosenEconomicOverDamage"
  | "corpVisibleTagPunishChosenTrashOverDamage"
  | "corpVisibleTagPunishChosenLethalOverNonLethal"
  | "corpVisibleTagPunishChosenNonLethalOverLethal"
  | "corpVisibleTagPunishChosenLowerImpactOverHigherImpact"
  | "corpVisibleTagPunishChosenUnknownImpactOrdering"
  | "corpVisibleTagPunishFixGateEligibleWindowNormalized"
  | "corpVisibleTagPunishFixGateSuspiciousSkipNormalized"
  | "corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken"
  | "corpVisibleTagPunishPotentialPayoffOrderingIssue"
  | "corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed"
  | "corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage"
  | "corpFunnelSourcePayoffPairSeenInDeck"
  | "corpFunnelSourceActionTakenWithPayoffInDeck"
  | "corpFunnelSourceActionTakenWithVisiblePayoff"
  | "corpFunnelSourceActionTakenWithoutVisiblePayoff"
  | "corpFunnelPairConvertedToTaggedDecisionWindow"
  | "corpFunnelPairConvertedToLegalPayoffWindow"
  | "corpFunnelPairConvertedToPayoffTaken"
  | "corpFunnelPairExpiredBeforePayoffWindow"
  | "runnerSurvivalCounterContextAvailable"
  | "runnerTraceDefenseVisibleAtTagSource"
  | "runnerDamagePreventionVisibleAtPayoffWindow"
  | "runnerFlatlinePreventionVisibleAtPayoffWindow"
  | "runnerLinkDefenseVisibleAtTrace"
  | "runnerSurvivalCounterContextSuppressedPunishValue"
  | "corpPunishOpportunities"
  | "corpPunishTaken"
  | "corpPunishSkipped"
  | "corpPunishTakeRate"
  | "corpPunishOpportunityScorchedEarthLike"
  | "corpPunishOpportunityUrbanRenewalLike"
  | "corpPunishOpportunityPunitiveCounterstrikeLike"
  | "corpPunishOpportunityClosedAccountsLike"
  | "corpPunishOpportunityPowerGridOverloadLike"
  | "corpPunishOpportunityDatapoolLike"
  | "corpPunishOpportunityResourceTrashLike"
  | "corpPunishOpportunityScoredAgendaDamageLike"
  | "corpPunishOpportunityScoredAgendaTraceTagLike"
  | "corpPunishOpportunityUnknown"
  | "corpPunishSkippedForEconomy"
  | "corpPunishSkippedForProtection"
  | "corpPunishSkippedForScore"
  | "corpPunishSkippedForRemoteSafety"
  | "corpPunishSkippedForDraw"
  | "corpPunishSkippedForEndTurn"
  | "corpPunishSkippedForUnknown"
  | "corpPunishWindowExpiredBeforeAction"
  | "corpPunishWindowExpiredBeforeCorpTurn"
  | "corpTagSourceOpportunities"
  | "corpTagSourceTaken"
  | "corpTagSourceSkipped"
  | "corpTraceTagOpportunities"
  | "corpTraceTagTaken"
  | "corpTraceTagSkipped"
  | "corpTraceTagExpectedSuccess"
  | "corpTraceTagSkippedForEconomy"
  | "corpTraceTagSkippedForProtection"
  | "corpTraceTagSkippedForScore"
  | "corpTraceTagSkippedForRemoteSafety"
  | "corpTagSourceConvertedToRunnerTagged"
  | "corpTagSourceConvertedToPunishOpportunity"
  | "corpTagSourceConvertedToPunishTaken"
  | "corpTagPunishFunnelTagSourceOpportunity"
  | "corpTagPunishFunnelTagSourceTaken"
  | "corpTagPunishFunnelRunnerTagged"
  | "corpTagPunishFunnelRunnerTaggedAtCorpDecision"
  | "corpTagPunishFunnelPunishOpportunity"
  | "corpTagPunishFunnelPunishTaken"
  | "corpTagPunishFunnelTerminalDamageOrEconomicHit"
  | "corpTagPunishFunnelFlatlineOrLock"
  | "corpTagPunishOntologyProfilesSeen"
  | "corpTagSourceOntologyProfilesSeen"
  | "corpTagPunishPayoffOntologyProfilesSeen"
  | "corpTagSourceOntologyUsed"
  | "corpTagPunishPayoffOntologyUsed"
  | "corpTagPunishOntologyFallbackUsed"
  | "corpTagPunishOntologyConflict"
  | "corpTagSourceLegalActionClassifiedByOntology"
  | "corpPunishLegalActionClassifiedByOntology"
  | "corpPunishOpportunityConfirmedByOntology"
  | "corpPunishSkippedDespiteOntologyOpportunity"
  | "corpTagSourceTakenWithOntologyPayoffAvailable"
  | "corpTagSourceTakenWithoutOntologyPayoff"
  | "corpTagSourceConvertedToOntologyPunishOpportunity"
  | "corpOntologyPunishOpportunityConverted"
  | "corpOntologyPunishOpportunityExpired"
  | "corpTagPunishOntologyByKind"
  | "corpTagPunishOntologyKindTagSource"
  | "corpTagPunishOntologyKindTagPunishPayoff"
  | "corpTagPunishOntologyKindTrace"
  | "corpTagPunishOntologyKindTag"
  | "corpTagPunishOntologyKindDamage"
  | "corpTagPunishOntologyKindResourceTrash"
  | "corpTagPunishOntologyKindHardwareTrash"
  | "corpTagPunishOntologyKindScoredAgendaDamageLike"
  | "corpTagPunishOntologyKindScoredAgendaTraceTagLike"
  | "corpTagPunishConditionByKind"
  | "corpTagPunishConditionRequiresRunnerTagged"
  | "corpTagPunishConditionRequiresTraceSuccess"
> {
  let runnerTaggedAtCorpDecisionActions = 0;
  const runnerTaggedAtCorpDecisionTurns = new Set<string>();
  let runnerTagClearedBeforeCorpDecision = 0;
  let runnerTagClearedSameRunnerTurn = 0;
  let runnerTagWindowExpiredBeforeCorpTurn = 0;
  let runnerTaggedAfterTraceDuringRun = 0;
  let runnerTaggedAtEndOfRunnerTurn = 0;
  let runnerTaggedAtStartOfCorpTurn = 0;
  let corpTagCreatedDuringRunnerTurn = 0;
  let corpTagCreatedDuringCorpTurn = 0;
  let corpTagCreatedDuringEncounter = 0;
  let corpTagCreatedByTraceSuccess = 0;
  let corpTagCreatedByAccessOrSteal = 0;
  let corpTagCreatedByPersistentEffect = 0;
  let corpTagCreatedByScoredAgendaAction = 0;
  let corpTagCreatedByOperation = 0;
  let corpTagCreatedByAssetOrNode = 0;
  let corpTagCreatedByIce = 0;
  let runnerTaggedAtCorpDecisionWithFunnelPayoffKnown = 0;
  let runnerTaggedAtCorpDecisionWithoutPayoffKnown = 0;
  let runnerTagFromPreviousRunnerTurnStillVisibleAtCorpDecision = 0;
  let runnerTagFromEncounterStillVisibleAtCorpDecision = 0;
  let runnerTagClearedBeforeCorpDecisionAfterFunnelSource = 0;
  let runnerTagClearedSameRunnerTurnAfterSource = 0;
  let runnerTagWindowExpiredBeforeCorpDecision = 0;
  let corpVisibleTagPunishLegalActions = 0;
  let corpVisibleTagDamagePunishLegalActions = 0;
  let corpVisibleTagEconomicPunishLegalActions = 0;
  let corpVisibleTagTrashPunishLegalActions = 0;
  let corpVisibleTagRunLockPunishLegalActions = 0;
  let corpVisibleTagAmbushPunishLegalActions = 0;
  const corpVisibleTagPayoffLegalActionsByKindCounts: Record<string, number> =
    {};
  const corpVisibleTagPayoffLegalActionsByCardCounts: Record<string, number> =
    {};
  let corpVisibleTagPunishTaken = 0;
  let corpVisibleTagPunishSkipped = 0;
  const unknownSkipChosenFamilyCounts: Record<
    CorpTagPunishUnknownChosenFamily,
    number
  > = {
    score: 0,
    advance: 0,
    install_agenda: 0,
    install_ice: 0,
    install_asset_or_upgrade: 0,
    rez: 0,
    operation: 0,
    ability: 0,
    trace_tag_source: 0,
    draw: 0,
    basic_credit: 0,
    end_turn: 0,
    unknown: 0,
  };
  const unknownSkipReasonCodeCounts: Record<string, number> = {};
  const unknownSkipChosenActionTypeCounts: Record<string, number> = {};
  const unknownSkipChosenCardCounts: Record<string, number> = {};
  const unknownSkipPayoffCardCounts: Record<string, number> = {};
  const unknownSkipPayoffKindCounts: Record<string, number> = {};
  const unknownSkipPlausibilityCounts: Record<
    CorpTagPunishUnknownSkipPlausibility,
    number
  > = {
    plausible: 0,
    suspicious: 0,
    unclassified: 0,
  };
  let corpVisibleTagPunishUnknownSkipPayoffDamage = 0;
  let corpVisibleTagPunishUnknownSkipPayoffEconomic = 0;
  let corpVisibleTagPunishUnknownSkipPayoffTrash = 0;
  let corpVisibleTagPunishUnknownSkipPayoffRunLock = 0;
  let corpVisibleTagPunishUnknownSkipPayoffAmbush = 0;
  let corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal = 0;
  let corpVisibleTagPunishUnknownSkipPayoffNonLethal = 0;
  let corpVisibleTagPunishFixGateEligibleWindow = 0;
  let corpVisibleTagPunishFixGateBlockedByScore = 0;
  let corpVisibleTagPunishFixGateBlockedByAdvanceScore = 0;
  let corpVisibleTagPunishFixGateBlockedBySafety = 0;
  let corpVisibleTagPunishFixGateBlockedByAffordability = 0;
  let corpVisibleTagPunishFixGateBlockedByLowImpact = 0;
  let corpVisibleTagPunishFixGateSuspiciousSkip = 0;
  let corpVisibleTagPunishDecisionWindows = 0;
  let corpVisibleTagPunishDecisionWindowsTaken = 0;
  let corpVisibleTagPunishDecisionWindowsSkipped = 0;
  let corpVisibleTagPunishDecisionWindowsWithMultiplePayoffs = 0;
  let corpVisibleTagPunishAlternativePayoffsNotChosen = 0;
  let corpVisibleTagPunishChosenPayoffAmongAlternatives = 0;
  let corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff = 0;
  let corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization = 0;
  let corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen = 0;
  let corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization = 0;
  let corpVisibleTagPunishOperationChoiceAmongPayoffs = 0;
  let corpVisibleTagPunishChosenDamageOverEconomic = 0;
  let corpVisibleTagPunishChosenEconomicOverDamage = 0;
  let corpVisibleTagPunishChosenTrashOverDamage = 0;
  let corpVisibleTagPunishChosenLethalOverNonLethal = 0;
  let corpVisibleTagPunishChosenNonLethalOverLethal = 0;
  let corpVisibleTagPunishChosenLowerImpactOverHigherImpact = 0;
  let corpVisibleTagPunishChosenUnknownImpactOrdering = 0;
  let corpVisibleTagPunishFixGateEligibleWindowNormalized = 0;
  let corpVisibleTagPunishFixGateSuspiciousSkipNormalized = 0;
  let corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken = 0;
  let corpVisibleTagPunishPotentialPayoffOrderingIssue = 0;
  let corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed = 0;
  let corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage = 0;
  const visiblePunishSkippedByReason: Record<CorpTagPunishSkipReason, number> =
    {
      economy: 0,
      protection: 0,
      score: 0,
      advance: 0,
      remote_safety: 0,
      remote_protection: 0,
      central_protection: 0,
      draw: 0,
      install: 0,
      end_turn: 0,
      unknown_higher_priority: 0,
      unknown: 0,
    };
  let corpFunnelSourcePayoffPairSeenInDeck = 0;
  let corpFunnelSourceActionTakenWithPayoffInDeck = 0;
  let corpFunnelSourceActionTakenWithVisiblePayoff = 0;
  let corpFunnelSourceActionTakenWithoutVisiblePayoff = 0;
  let corpFunnelPairConvertedToTaggedDecisionWindow = 0;
  let corpFunnelPairConvertedToLegalPayoffWindow = 0;
  let corpFunnelPairConvertedToPayoffTaken = 0;
  let corpFunnelPairExpiredBeforePayoffWindow = 0;
  let runnerSurvivalCounterContextAvailable = 0;
  let runnerTraceDefenseVisibleAtTagSource = 0;
  let runnerDamagePreventionVisibleAtPayoffWindow = 0;
  let runnerFlatlinePreventionVisibleAtPayoffWindow = 0;
  let runnerLinkDefenseVisibleAtTrace = 0;
  let runnerSurvivalCounterContextSuppressedPunishValue = 0;
  let corpPunishOpportunities = 0;
  let corpPunishTaken = 0;
  let corpPunishSkipped = 0;
  const punishByKind: Record<CorpPunishKind, number> = {
    scorched_earth_like: 0,
    urban_renewal_like: 0,
    punitive_counterstrike_like: 0,
    closed_accounts_like: 0,
    power_grid_overload_like: 0,
    datapool_like: 0,
    resource_trash_like: 0,
    scored_agenda_damage_like: 0,
    scored_agenda_trace_tag_like: 0,
    unknown: 0,
  };
  const punishSkippedByReason: Record<CorpTagPunishSkipReason, number> = {
    economy: 0,
    protection: 0,
    score: 0,
    advance: 0,
    remote_safety: 0,
    remote_protection: 0,
    central_protection: 0,
    draw: 0,
    install: 0,
    end_turn: 0,
    unknown_higher_priority: 0,
    unknown: 0,
  };
  let corpPunishWindowExpiredBeforeAction = 0;
  let corpPunishWindowExpiredBeforeCorpTurn = 0;
  let corpTagSourceOpportunities = 0;
  let corpTagSourceTaken = 0;
  let corpTagSourceSkipped = 0;
  let corpTraceTagOpportunities = 0;
  let corpTraceTagTaken = 0;
  let corpTraceTagSkipped = 0;
  let corpTraceTagExpectedSuccess = 0;
  const traceSkippedByReason: Record<CorpTagPunishSkipReason, number> = {
    economy: 0,
    protection: 0,
    score: 0,
    advance: 0,
    remote_safety: 0,
    remote_protection: 0,
    central_protection: 0,
    draw: 0,
    install: 0,
    end_turn: 0,
    unknown_higher_priority: 0,
    unknown: 0,
  };
  let corpTagSourceConvertedToRunnerTagged = 0;
  let corpTagSourceConvertedToPunishOpportunity = 0;
  let corpTagSourceConvertedToPunishTaken = 0;
  let corpTagPunishFunnelTerminalDamageOrEconomicHit = 0;
  let corpTagPunishFunnelFlatlineOrLock = 0;
  let corpTagPunishOntologyProfilesSeen = 0;
  let corpTagSourceOntologyProfilesSeen = 0;
  let corpTagPunishPayoffOntologyProfilesSeen = 0;
  let corpTagSourceOntologyUsed = 0;
  let corpTagPunishPayoffOntologyUsed = 0;
  let corpTagPunishOntologyFallbackUsed = 0;
  let corpTagPunishOntologyConflict = 0;
  let corpTagSourceLegalActionClassifiedByOntology = 0;
  let corpPunishLegalActionClassifiedByOntology = 0;
  let corpPunishOpportunityConfirmedByOntology = 0;
  let corpPunishSkippedDespiteOntologyOpportunity = 0;
  let corpTagSourceTakenWithOntologyPayoffAvailable = 0;
  let corpTagSourceTakenWithoutOntologyPayoff = 0;
  let corpTagSourceConvertedToOntologyPunishOpportunity = 0;
  let corpOntologyPunishOpportunityConverted = 0;
  let corpOntologyPunishOpportunityExpired = 0;
  const ontologyByKind: Record<string, number> = {
    tag_source: 0,
    tag_punish_payoff: 0,
    trace: 0,
    tag: 0,
    damage: 0,
    resource_trash: 0,
    hardware_trash: 0,
    scored_agenda_damage_like: 0,
    scored_agenda_trace_tag_like: 0,
  };
  const ontologyConditionByKind: Record<string, number> = {
    requires_runner_tagged: 0,
    requires_trace_success: 0,
  };

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    const expiredBeforeCorpTurnIndexes = new Set<number>();
    for (const [index, entry] of sequence.entries()) {
      if (entry.runnerTaggedAtCorpDecision === true) {
        runnerTaggedAtCorpDecisionActions += 1;
        runnerTaggedAtCorpDecisionTurns.add(
          `${summary.seed}:${entry.turnNumber ?? 0}`,
        );
        if (entry.runnerTaggedAtCorpDecisionWithFunnelPayoffKnown === true)
          runnerTaggedAtCorpDecisionWithFunnelPayoffKnown += 1;
        if (entry.runnerTaggedAtCorpDecisionWithoutPayoffKnown === true)
          runnerTaggedAtCorpDecisionWithoutPayoffKnown += 1;
        if (previousRunnerTurnTagBefore(sequence, index))
          runnerTagFromPreviousRunnerTurnStillVisibleAtCorpDecision += 1;
        if (previousEncounterTagBefore(sequence, index))
          runnerTagFromEncounterStillVisibleAtCorpDecision += 1;
      }
      if (entry.runnerTaggedAtStartOfCorpTurn === true)
        runnerTaggedAtStartOfCorpTurn += 1;
      if (entry.runnerTaggedAtEndOfRunnerTurn === true)
        runnerTaggedAtEndOfRunnerTurn += 1;
      if (entry.runnerTaggedAfterTraceDuringRun === true)
        runnerTaggedAfterTraceDuringRun += 1;
      if (entry.corpTagCreatedDuringRunnerTurn === true)
        corpTagCreatedDuringRunnerTurn += 1;
      if (entry.corpTagCreatedDuringCorpTurn === true)
        corpTagCreatedDuringCorpTurn += 1;
      if (entry.corpTagCreatedDuringEncounter === true)
        corpTagCreatedDuringEncounter += 1;
      if (entry.corpTagCreatedByTraceSuccess === true)
        corpTagCreatedByTraceSuccess += 1;
      if (entry.corpTagCreatedByAccessOrSteal === true)
        corpTagCreatedByAccessOrSteal += 1;
      if (entry.corpTagCreatedByPersistentEffect === true)
        corpTagCreatedByPersistentEffect += 1;
      if (entry.corpTagCreatedByScoredAgendaAction === true)
        corpTagCreatedByScoredAgendaAction += 1;
      if (entry.corpTagCreatedByOperation === true)
        corpTagCreatedByOperation += 1;
      if (entry.corpTagCreatedByAssetOrNode === true)
        corpTagCreatedByAssetOrNode += 1;
      if (entry.corpTagCreatedByIce === true) corpTagCreatedByIce += 1;
      if (entry.runnerTagClearedByAction === true) {
        runnerTagClearedSameRunnerTurn += 1;
        if (previousFunnelSourceBefore(sequence, index)) {
          runnerTagClearedSameRunnerTurnAfterSource += 1;
          runnerTagClearedBeforeCorpDecisionAfterFunnelSource += 1;
          corpFunnelPairExpiredBeforePayoffWindow += 1;
        }
        const nextCorpIndex = sequence.findIndex(
          (later, laterIndex) => laterIndex > index && later.side === "corp",
        );
        if (nextCorpIndex > index) {
          runnerTagClearedBeforeCorpDecision += 1;
          runnerTagWindowExpiredBeforeCorpTurn += 1;
          runnerTagWindowExpiredBeforeCorpDecision += 1;
          expiredBeforeCorpTurnIndexes.add(nextCorpIndex);
          if (
            sequence
              .slice(Math.max(0, index - 12), index)
              .some(
                (previous) =>
                  previous.corpTagSourceTakenWithOntologyPayoffAvailable ===
                  true,
              )
          )
            corpOntologyPunishOpportunityExpired += 1;
        }
      }
      if ((entry.corpVisibleTagPunishLegalActions ?? 0) > 0) {
        corpVisibleTagPunishLegalActions +=
          entry.corpVisibleTagPunishLegalActions ?? 0;
        addKindsToCounter(
          entry.corpVisibleTagPayoffLegalActionKinds ?? [],
          corpVisibleTagPayoffLegalActionsByKindCounts,
        );
        addCardsToCounter(
          entry.corpVisibleTagPayoffLegalActionCards ?? [],
          corpVisibleTagPayoffLegalActionsByCardCounts,
        );
      }
      if (entry.corpVisibleTagDamagePunishLegalActions === true)
        corpVisibleTagDamagePunishLegalActions += 1;
      if (entry.corpVisibleTagEconomicPunishLegalActions === true)
        corpVisibleTagEconomicPunishLegalActions += 1;
      if (entry.corpVisibleTagTrashPunishLegalActions === true)
        corpVisibleTagTrashPunishLegalActions += 1;
      if (entry.corpVisibleTagRunLockPunishLegalActions === true)
        corpVisibleTagRunLockPunishLegalActions += 1;
      if (entry.corpVisibleTagAmbushPunishLegalActions === true)
        corpVisibleTagAmbushPunishLegalActions += 1;
      if (entry.corpVisibleTagPunishTaken === true)
        corpVisibleTagPunishTaken += 1;
      if (entry.corpVisibleTagPunishSkipped === true) {
        corpVisibleTagPunishSkipped += 1;
        incrementTypedCounter(
          visiblePunishSkippedByReason,
          entry.corpVisibleTagPunishSkippedReason ?? "unknown",
        );
        if (
          entry.corpVisibleTagPunishSkippedReason ===
            "unknown_higher_priority" ||
          entry.corpVisibleTagPunishSkippedReason === "unknown"
        ) {
          unknownSkipChosenFamilyCounts[
            entry.corpVisibleTagPunishUnknownSkipChosenFamily ?? "unknown"
          ] += 1;
          incrementStringCounter(unknownSkipReasonCodeCounts, entry.reasonCode);
          incrementStringCounter(
            unknownSkipChosenActionTypeCounts,
            entry.corpVisibleTagPunishUnknownSkipChosenActionType ??
              entry.actionType,
          );
          if (entry.corpVisibleTagPunishUnknownSkipChosenCardId)
            incrementStringCounter(
              unknownSkipChosenCardCounts,
              entry.corpVisibleTagPunishUnknownSkipChosenCardId,
            );
          addCardsToCounter(
            entry.corpVisibleTagPayoffLegalActionCards ?? [],
            unknownSkipPayoffCardCounts,
          );
          addKindsToCounter(
            entry.corpVisibleTagPayoffLegalActionKinds ?? [],
            unknownSkipPayoffKindCounts,
          );
          const payoffKindSet = new Set(
            entry.corpVisibleTagPayoffLegalActionKinds ?? [],
          );
          unknownSkipPlausibilityCounts[
            entry.corpVisibleTagPunishUnknownSkipPlausibility ?? "unclassified"
          ] += 1;
          if (payoffKindSet.has("damage"))
            corpVisibleTagPunishUnknownSkipPayoffDamage += 1;
          if (payoffKindSet.has("economic"))
            corpVisibleTagPunishUnknownSkipPayoffEconomic += 1;
          if (payoffKindSet.has("trash"))
            corpVisibleTagPunishUnknownSkipPayoffTrash += 1;
          if (payoffKindSet.has("run_lock"))
            corpVisibleTagPunishUnknownSkipPayoffRunLock += 1;
          if (payoffKindSet.has("ambush"))
            corpVisibleTagPunishUnknownSkipPayoffAmbush += 1;
          if (
            entry.corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal ===
            true
          )
            corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal += 1;
          else corpVisibleTagPunishUnknownSkipPayoffNonLethal += 1;
          if (entry.corpVisibleTagPunishUnknownSkipFixGateEligible === true) {
            corpVisibleTagPunishFixGateEligibleWindow += 1;
            if (
              entry.corpVisibleTagPunishUnknownSkipPlausibility === "suspicious"
            )
              corpVisibleTagPunishFixGateSuspiciousSkip += 1;
          }
          switch (entry.corpVisibleTagPunishUnknownSkipFixGateBlockedBy) {
            case "score":
              corpVisibleTagPunishFixGateBlockedByScore += 1;
              break;
            case "advance_score":
              corpVisibleTagPunishFixGateBlockedByAdvanceScore += 1;
              break;
            case "safety":
              corpVisibleTagPunishFixGateBlockedBySafety += 1;
              break;
            case "affordability":
              corpVisibleTagPunishFixGateBlockedByAffordability += 1;
              break;
            case "low_impact":
              corpVisibleTagPunishFixGateBlockedByLowImpact += 1;
              break;
          }
        }
      }
      if (entry.corpVisibleTagPunishDecisionWindow === true)
        corpVisibleTagPunishDecisionWindows += 1;
      if (entry.corpVisibleTagPunishDecisionWindowTaken === true)
        corpVisibleTagPunishDecisionWindowsTaken += 1;
      if (entry.corpVisibleTagPunishDecisionWindowSkipped === true)
        corpVisibleTagPunishDecisionWindowsSkipped += 1;
      if (entry.corpVisibleTagPunishDecisionWindowWithMultiplePayoffs === true)
        corpVisibleTagPunishDecisionWindowsWithMultiplePayoffs += 1;
      corpVisibleTagPunishAlternativePayoffsNotChosen +=
        entry.corpVisibleTagPunishAlternativePayoffsNotChosen ?? 0;
      if (entry.corpVisibleTagPunishChosenPayoffAmongAlternatives === true)
        corpVisibleTagPunishChosenPayoffAmongAlternatives += 1;
      if (
        entry.corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff ===
        true
      )
        corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff += 1;
      if (
        entry.corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization ===
        true
      )
        corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization += 1;
      if (entry.corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen === true)
        corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen += 1;
      if (
        entry.corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization ===
        true
      )
        corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization += 1;
      if (entry.corpVisibleTagPunishOperationChoiceAmongPayoffs === true)
        corpVisibleTagPunishOperationChoiceAmongPayoffs += 1;
      if (entry.corpVisibleTagPunishChosenDamageOverEconomic === true)
        corpVisibleTagPunishChosenDamageOverEconomic += 1;
      if (entry.corpVisibleTagPunishChosenEconomicOverDamage === true)
        corpVisibleTagPunishChosenEconomicOverDamage += 1;
      if (entry.corpVisibleTagPunishChosenTrashOverDamage === true)
        corpVisibleTagPunishChosenTrashOverDamage += 1;
      if (entry.corpVisibleTagPunishChosenLethalOverNonLethal === true)
        corpVisibleTagPunishChosenLethalOverNonLethal += 1;
      if (entry.corpVisibleTagPunishChosenNonLethalOverLethal === true)
        corpVisibleTagPunishChosenNonLethalOverLethal += 1;
      if (entry.corpVisibleTagPunishChosenLowerImpactOverHigherImpact === true)
        corpVisibleTagPunishChosenLowerImpactOverHigherImpact += 1;
      if (entry.corpVisibleTagPunishChosenUnknownImpactOrdering === true)
        corpVisibleTagPunishChosenUnknownImpactOrdering += 1;
      if (entry.corpVisibleTagPunishFixGateEligibleWindowNormalized === true)
        corpVisibleTagPunishFixGateEligibleWindowNormalized += 1;
      if (entry.corpVisibleTagPunishFixGateSuspiciousSkipNormalized === true)
        corpVisibleTagPunishFixGateSuspiciousSkipNormalized += 1;
      if (
        entry.corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken ===
        true
      )
        corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken += 1;
      if (entry.corpVisibleTagPunishPotentialPayoffOrderingIssue === true)
        corpVisibleTagPunishPotentialPayoffOrderingIssue += 1;
      if (
        entry.corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed ===
        true
      )
        corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed += 1;
      if (
        entry.corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage ===
        true
      )
        corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage += 1;
      if (entry.corpFunnelSourcePayoffPairSeenInDeck === true)
        corpFunnelSourcePayoffPairSeenInDeck += 1;
      if (entry.corpFunnelSourceActionTakenWithPayoffInDeck === true) {
        corpFunnelSourceActionTakenWithPayoffInDeck += 1;
        if (tagSourceConvertsToTaggedCorpDecision(sequence, index))
          corpFunnelPairConvertedToTaggedDecisionWindow += 1;
        if (tagSourceConvertsToVisibleLegalPayoffWindow(sequence, index))
          corpFunnelPairConvertedToLegalPayoffWindow += 1;
        if (tagSourceConvertsToPunishTaken(sequence, index))
          corpFunnelPairConvertedToPayoffTaken += 1;
      }
      if (entry.corpFunnelSourceActionTakenWithVisiblePayoff === true)
        corpFunnelSourceActionTakenWithVisiblePayoff += 1;
      if (entry.corpFunnelSourceActionTakenWithoutVisiblePayoff === true)
        corpFunnelSourceActionTakenWithoutVisiblePayoff += 1;
      if (entry.runnerSurvivalCounterContextAvailable === true)
        runnerSurvivalCounterContextAvailable += 1;
      if (entry.runnerTraceDefenseVisibleAtTagSource === true)
        runnerTraceDefenseVisibleAtTagSource += 1;
      if (entry.runnerDamagePreventionVisibleAtPayoffWindow === true)
        runnerDamagePreventionVisibleAtPayoffWindow += 1;
      if (entry.runnerFlatlinePreventionVisibleAtPayoffWindow === true)
        runnerFlatlinePreventionVisibleAtPayoffWindow += 1;
      if (entry.runnerLinkDefenseVisibleAtTrace === true)
        runnerLinkDefenseVisibleAtTrace += 1;
      if (entry.runnerSurvivalCounterContextSuppressedPunishValue === true)
        runnerSurvivalCounterContextSuppressedPunishValue += 1;
      if (entry.corpPunishOpportunity === true) {
        corpPunishOpportunities += 1;
        punishByKind[entry.corpPunishKind ?? "unknown"] += 1;
        if (entry.corpPunishTaken === true) {
          corpPunishTaken += 1;
          if (isTerminalDamageOrEconomicPunish(entry.corpPunishKind))
            corpTagPunishFunnelTerminalDamageOrEconomicHit += 1;
        } else {
          corpPunishSkipped += 1;
          incrementTypedCounter(
            punishSkippedByReason,
            entry.corpPunishSkippedReason ?? "unknown",
          );
        }
      }
      if (expiredBeforeCorpTurnIndexes.has(index)) {
        corpPunishWindowExpiredBeforeAction += 1;
        corpPunishWindowExpiredBeforeCorpTurn += 1;
      }
      if (entry.corpTagSourceOpportunity === true) {
        corpTagSourceOpportunities += 1;
        if (entry.corpTagSourceTaken === true) {
          corpTagSourceTaken += 1;
          if (tagSourceConvertsToRunnerTagged(sequence, index))
            corpTagSourceConvertedToRunnerTagged += 1;
          if (tagSourceConvertsToPunishOpportunity(sequence, index))
            corpTagSourceConvertedToPunishOpportunity += 1;
          if (tagSourceConvertsToPunishTaken(sequence, index))
            corpTagSourceConvertedToPunishTaken += 1;
          if (
            entry.corpTagSourceTakenWithOntologyPayoffAvailable === true &&
            tagSourceConvertsToPunishOpportunity(sequence, index)
          )
            corpTagSourceConvertedToOntologyPunishOpportunity += 1;
        } else corpTagSourceSkipped += 1;
      }
      if (entry.corpTraceTagOpportunity === true) {
        corpTraceTagOpportunities += 1;
        corpTraceTagExpectedSuccess += entry.corpTraceTagExpectedSuccess ?? 0;
        if (entry.corpTraceTagTaken === true) corpTraceTagTaken += 1;
        else {
          corpTraceTagSkipped += 1;
          incrementTypedCounter(
            traceSkippedByReason,
            entry.corpTraceTagSkippedReason ?? "unknown",
          );
        }
      }
      if (entry.corpTagPunishOntologyProfilesSeen === true)
        corpTagPunishOntologyProfilesSeen += 1;
      if (entry.corpTagSourceOntologyProfilesSeen === true)
        corpTagSourceOntologyProfilesSeen += 1;
      if (entry.corpTagPunishPayoffOntologyProfilesSeen === true)
        corpTagPunishPayoffOntologyProfilesSeen += 1;
      if (entry.corpTagSourceOntologyUsed === true)
        corpTagSourceOntologyUsed += 1;
      if (entry.corpTagPunishPayoffOntologyUsed === true)
        corpTagPunishPayoffOntologyUsed += 1;
      if (
        entry.corpTagPunishOntologyProfilesSeen === true &&
        (entry.corpTagSourceOntologyUsed === true ||
          entry.corpTagPunishPayoffOntologyUsed === true)
      )
        corpTagPunishOntologyFallbackUsed += 1;
      if (entry.corpTagPunishOntologyConflict === true)
        corpTagPunishOntologyConflict += 1;
      if (entry.corpTagSourceLegalActionClassifiedByOntology === true)
        corpTagSourceLegalActionClassifiedByOntology += 1;
      if (entry.corpPunishLegalActionClassifiedByOntology === true)
        corpPunishLegalActionClassifiedByOntology += 1;
      if (entry.corpPunishOpportunityConfirmedByOntology === true)
        corpPunishOpportunityConfirmedByOntology += 1;
      if (entry.corpPunishSkippedDespiteOntologyOpportunity === true)
        corpPunishSkippedDespiteOntologyOpportunity += 1;
      if (entry.corpTagSourceTakenWithOntologyPayoffAvailable === true)
        corpTagSourceTakenWithOntologyPayoffAvailable += 1;
      if (entry.corpTagSourceTakenWithoutOntologyPayoff === true)
        corpTagSourceTakenWithoutOntologyPayoff += 1;
      if (entry.corpOntologyPunishOpportunityConverted === true)
        corpOntologyPunishOpportunityConverted += 1;
      for (const kind of entry.corpTagPunishOntologyKinds ?? []) {
        if (kind in ontologyByKind)
          ontologyByKind[kind] = (ontologyByKind[kind] ?? 0) + 1;
      }
      for (const kind of entry.corpTagPunishConditionKinds ?? []) {
        if (kind in ontologyConditionByKind)
          ontologyConditionByKind[kind] =
            (ontologyConditionByKind[kind] ?? 0) + 1;
      }
    }
    if (
      summary.winner === "corp" &&
      sequence.some(
        (entry) =>
          entry.corpPunishTaken === true &&
          isTerminalDamageOrEconomicPunish(entry.corpPunishKind),
      )
    )
      corpTagPunishFunnelFlatlineOrLock += 1;
  }

  return {
    runnerTaggedAtCorpDecision: runnerTaggedAtCorpDecisionActions,
    runnerTaggedAtCorpDecisionTurns: runnerTaggedAtCorpDecisionTurns.size,
    runnerTaggedAtCorpDecisionActions,
    runnerTagClearedBeforeCorpDecision,
    runnerTagClearedSameRunnerTurn,
    runnerTagWindowExpiredBeforeCorpTurn,
    runnerTaggedAfterTraceDuringRun,
    runnerTaggedAtEndOfRunnerTurn,
    runnerTaggedAtStartOfCorpTurn,
    corpTagCreatedDuringRunnerTurn,
    corpTagCreatedDuringCorpTurn,
    corpTagCreatedDuringEncounter,
    corpTagCreatedByTraceSuccess,
    corpTagCreatedByAccessOrSteal,
    corpTagCreatedByPersistentEffect,
    corpTagCreatedByScoredAgendaAction,
    corpTagCreatedByOperation,
    corpTagCreatedByAssetOrNode,
    corpTagCreatedByIce,
    runnerTaggedAtCorpDecisionWithFunnelPayoffKnown,
    runnerTaggedAtCorpDecisionWithoutPayoffKnown,
    runnerTagFromPreviousRunnerTurnStillVisibleAtCorpDecision,
    runnerTagFromEncounterStillVisibleAtCorpDecision,
    runnerTagClearedBeforeCorpDecisionAfterFunnelSource,
    runnerTagClearedSameRunnerTurnAfterSource,
    runnerTagWindowExpiredBeforeCorpDecision,
    corpVisibleTagPunishLegalActions,
    corpVisibleTagDamagePunishLegalActions,
    corpVisibleTagEconomicPunishLegalActions,
    corpVisibleTagTrashPunishLegalActions,
    corpVisibleTagRunLockPunishLegalActions,
    corpVisibleTagAmbushPunishLegalActions,
    corpVisibleTagPayoffLegalActionsByKind: Object.values(
      corpVisibleTagPayoffLegalActionsByKindCounts,
    ).reduce((sum, value) => sum + value, 0),
    corpVisibleTagPayoffLegalActionsByCard: Object.values(
      corpVisibleTagPayoffLegalActionsByCardCounts,
    ).reduce((sum, value) => sum + value, 0),
    corpVisibleTagPunishTaken,
    corpVisibleTagPunishSkipped,
    corpVisibleTagPunishSkippedForScore: visiblePunishSkippedByReason.score,
    corpVisibleTagPunishSkippedForAdvance: visiblePunishSkippedByReason.advance,
    corpVisibleTagPunishSkippedForEconomy: visiblePunishSkippedByReason.economy,
    corpVisibleTagPunishSkippedForRemoteProtection:
      visiblePunishSkippedByReason.remote_protection +
      visiblePunishSkippedByReason.remote_safety,
    corpVisibleTagPunishSkippedForCentralProtection:
      visiblePunishSkippedByReason.central_protection,
    corpVisibleTagPunishSkippedForDraw: visiblePunishSkippedByReason.draw,
    corpVisibleTagPunishSkippedForInstall: visiblePunishSkippedByReason.install,
    corpVisibleTagPunishSkippedForEndTurn:
      visiblePunishSkippedByReason.end_turn,
    corpVisibleTagPunishSkippedForUnknownHigherPriority:
      visiblePunishSkippedByReason.unknown_higher_priority +
      visiblePunishSkippedByReason.unknown,
    corpVisibleTagPunishSkippedUnknownChosenScore:
      unknownSkipChosenFamilyCounts.score,
    corpVisibleTagPunishSkippedUnknownChosenAdvance:
      unknownSkipChosenFamilyCounts.advance,
    corpVisibleTagPunishSkippedUnknownChosenInstallAgenda:
      unknownSkipChosenFamilyCounts.install_agenda,
    corpVisibleTagPunishSkippedUnknownChosenInstallIce:
      unknownSkipChosenFamilyCounts.install_ice,
    corpVisibleTagPunishSkippedUnknownChosenInstallAssetOrUpgrade:
      unknownSkipChosenFamilyCounts.install_asset_or_upgrade,
    corpVisibleTagPunishSkippedUnknownChosenRez:
      unknownSkipChosenFamilyCounts.rez,
    corpVisibleTagPunishSkippedUnknownChosenOperation:
      unknownSkipChosenFamilyCounts.operation,
    corpVisibleTagPunishSkippedUnknownChosenAbility:
      unknownSkipChosenFamilyCounts.ability,
    corpVisibleTagPunishSkippedUnknownChosenTraceTagSource:
      unknownSkipChosenFamilyCounts.trace_tag_source,
    corpVisibleTagPunishSkippedUnknownChosenDraw:
      unknownSkipChosenFamilyCounts.draw,
    corpVisibleTagPunishSkippedUnknownChosenBasicCredit:
      unknownSkipChosenFamilyCounts.basic_credit,
    corpVisibleTagPunishSkippedUnknownChosenEndTurn:
      unknownSkipChosenFamilyCounts.end_turn,
    corpVisibleTagPunishSkippedUnknownChosenUnknown:
      unknownSkipChosenFamilyCounts.unknown,
    corpVisibleTagPunishSkippedUnknownByReasonCode: Object.values(
      unknownSkipReasonCodeCounts,
    ).reduce((sum, value) => sum + value, 0),
    corpVisibleTagPunishSkippedUnknownByChosenActionType: Object.values(
      unknownSkipChosenActionTypeCounts,
    ).reduce((sum, value) => sum + value, 0),
    corpVisibleTagPunishSkippedUnknownByChosenCard: Object.values(
      unknownSkipChosenCardCounts,
    ).reduce((sum, value) => sum + value, 0),
    corpVisibleTagPunishSkippedUnknownByPayoffCard: Object.values(
      unknownSkipPayoffCardCounts,
    ).reduce((sum, value) => sum + value, 0),
    corpVisibleTagPunishSkippedUnknownByPayoffKind: Object.values(
      unknownSkipPayoffKindCounts,
    ).reduce((sum, value) => sum + value, 0),
    corpVisibleTagPunishUnknownSkipPlausible:
      unknownSkipPlausibilityCounts.plausible,
    corpVisibleTagPunishUnknownSkipSuspicious:
      unknownSkipPlausibilityCounts.suspicious,
    corpVisibleTagPunishUnknownSkipUnclassified:
      unknownSkipPlausibilityCounts.unclassified,
    corpVisibleTagPunishUnknownSkipByPlausibility:
      unknownSkipPlausibilityCounts.plausible +
      unknownSkipPlausibilityCounts.suspicious +
      unknownSkipPlausibilityCounts.unclassified,
    corpVisibleTagPunishUnknownSkipPayoffDamage,
    corpVisibleTagPunishUnknownSkipPayoffEconomic,
    corpVisibleTagPunishUnknownSkipPayoffTrash,
    corpVisibleTagPunishUnknownSkipPayoffRunLock,
    corpVisibleTagPunishUnknownSkipPayoffAmbush,
    corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal,
    corpVisibleTagPunishUnknownSkipPayoffNonLethal,
    corpVisibleTagPunishFixGateEligibleWindow,
    corpVisibleTagPunishFixGateBlockedByScore,
    corpVisibleTagPunishFixGateBlockedByAdvanceScore,
    corpVisibleTagPunishFixGateBlockedBySafety,
    corpVisibleTagPunishFixGateBlockedByAffordability,
    corpVisibleTagPunishFixGateBlockedByLowImpact,
    corpVisibleTagPunishFixGateSuspiciousSkip,
    corpVisibleTagPunishDecisionWindows,
    corpVisibleTagPunishDecisionWindowsTaken,
    corpVisibleTagPunishDecisionWindowsSkipped,
    corpVisibleTagPunishDecisionWindowsWithMultiplePayoffs,
    corpVisibleTagPunishAlternativePayoffsNotChosen,
    corpVisibleTagPunishChosenPayoffAmongAlternatives,
    corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff,
    corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization,
    corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen,
    corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization,
    corpVisibleTagPunishOperationChoiceAmongPayoffs,
    corpVisibleTagPunishChosenDamageOverEconomic,
    corpVisibleTagPunishChosenEconomicOverDamage,
    corpVisibleTagPunishChosenTrashOverDamage,
    corpVisibleTagPunishChosenLethalOverNonLethal,
    corpVisibleTagPunishChosenNonLethalOverLethal,
    corpVisibleTagPunishChosenLowerImpactOverHigherImpact,
    corpVisibleTagPunishChosenUnknownImpactOrdering,
    corpVisibleTagPunishFixGateEligibleWindowNormalized,
    corpVisibleTagPunishFixGateSuspiciousSkipNormalized,
    corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken,
    corpVisibleTagPunishPotentialPayoffOrderingIssue,
    corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed,
    corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage,
    corpFunnelSourcePayoffPairSeenInDeck,
    corpFunnelSourceActionTakenWithPayoffInDeck,
    corpFunnelSourceActionTakenWithVisiblePayoff,
    corpFunnelSourceActionTakenWithoutVisiblePayoff,
    corpFunnelPairConvertedToTaggedDecisionWindow,
    corpFunnelPairConvertedToLegalPayoffWindow,
    corpFunnelPairConvertedToPayoffTaken,
    corpFunnelPairExpiredBeforePayoffWindow,
    runnerSurvivalCounterContextAvailable,
    runnerTraceDefenseVisibleAtTagSource,
    runnerDamagePreventionVisibleAtPayoffWindow,
    runnerFlatlinePreventionVisibleAtPayoffWindow,
    runnerLinkDefenseVisibleAtTrace,
    runnerSurvivalCounterContextSuppressedPunishValue,
    corpPunishOpportunities,
    corpPunishTaken,
    corpPunishSkipped,
    corpPunishTakeRate:
      corpPunishOpportunities > 0
        ? round(corpPunishTaken / corpPunishOpportunities)
        : 0,
    corpPunishOpportunityScorchedEarthLike: punishByKind.scorched_earth_like,
    corpPunishOpportunityUrbanRenewalLike: punishByKind.urban_renewal_like,
    corpPunishOpportunityPunitiveCounterstrikeLike:
      punishByKind.punitive_counterstrike_like,
    corpPunishOpportunityClosedAccountsLike: punishByKind.closed_accounts_like,
    corpPunishOpportunityPowerGridOverloadLike:
      punishByKind.power_grid_overload_like,
    corpPunishOpportunityDatapoolLike: punishByKind.datapool_like,
    corpPunishOpportunityResourceTrashLike: punishByKind.resource_trash_like,
    corpPunishOpportunityScoredAgendaDamageLike:
      punishByKind.scored_agenda_damage_like,
    corpPunishOpportunityScoredAgendaTraceTagLike:
      punishByKind.scored_agenda_trace_tag_like,
    corpPunishOpportunityUnknown: punishByKind.unknown,
    corpPunishSkippedForEconomy: punishSkippedByReason.economy,
    corpPunishSkippedForProtection:
      punishSkippedByReason.protection +
      punishSkippedByReason.remote_protection +
      punishSkippedByReason.central_protection,
    corpPunishSkippedForScore:
      punishSkippedByReason.score + punishSkippedByReason.advance,
    corpPunishSkippedForRemoteSafety:
      punishSkippedByReason.remote_safety +
      punishSkippedByReason.remote_protection,
    corpPunishSkippedForDraw: punishSkippedByReason.draw,
    corpPunishSkippedForEndTurn: punishSkippedByReason.end_turn,
    corpPunishSkippedForUnknown:
      punishSkippedByReason.unknown +
      punishSkippedByReason.unknown_higher_priority,
    corpPunishWindowExpiredBeforeAction,
    corpPunishWindowExpiredBeforeCorpTurn,
    corpTagSourceOpportunities,
    corpTagSourceTaken,
    corpTagSourceSkipped,
    corpTraceTagOpportunities,
    corpTraceTagTaken,
    corpTraceTagSkipped,
    corpTraceTagExpectedSuccess: round(corpTraceTagExpectedSuccess),
    corpTraceTagSkippedForEconomy: traceSkippedByReason.economy,
    corpTraceTagSkippedForProtection:
      traceSkippedByReason.protection +
      traceSkippedByReason.remote_protection +
      traceSkippedByReason.central_protection,
    corpTraceTagSkippedForScore:
      traceSkippedByReason.score + traceSkippedByReason.advance,
    corpTraceTagSkippedForRemoteSafety:
      traceSkippedByReason.remote_safety +
      traceSkippedByReason.remote_protection,
    corpTagSourceConvertedToRunnerTagged,
    corpTagSourceConvertedToPunishOpportunity,
    corpTagSourceConvertedToPunishTaken,
    corpTagPunishFunnelTagSourceOpportunity: corpTagSourceOpportunities,
    corpTagPunishFunnelTagSourceTaken: corpTagSourceTaken,
    corpTagPunishFunnelRunnerTagged: corpTagSourceConvertedToRunnerTagged,
    corpTagPunishFunnelRunnerTaggedAtCorpDecision:
      runnerTaggedAtCorpDecisionActions,
    corpTagPunishFunnelPunishOpportunity: corpPunishOpportunities,
    corpTagPunishFunnelPunishTaken: corpPunishTaken,
    corpTagPunishFunnelTerminalDamageOrEconomicHit,
    corpTagPunishFunnelFlatlineOrLock,
    corpTagPunishOntologyProfilesSeen,
    corpTagSourceOntologyProfilesSeen,
    corpTagPunishPayoffOntologyProfilesSeen,
    corpTagSourceOntologyUsed,
    corpTagPunishPayoffOntologyUsed,
    corpTagPunishOntologyFallbackUsed,
    corpTagPunishOntologyConflict,
    corpTagSourceLegalActionClassifiedByOntology,
    corpPunishLegalActionClassifiedByOntology,
    corpPunishOpportunityConfirmedByOntology,
    corpPunishSkippedDespiteOntologyOpportunity,
    corpTagSourceTakenWithOntologyPayoffAvailable,
    corpTagSourceTakenWithoutOntologyPayoff,
    corpTagSourceConvertedToOntologyPunishOpportunity,
    corpOntologyPunishOpportunityConverted,
    corpOntologyPunishOpportunityExpired,
    corpTagPunishOntologyByKind: Object.values(ontologyByKind).reduce(
      (sum, value) => sum + value,
      0,
    ),
    corpTagPunishOntologyKindTagSource: ontologyByKind.tag_source ?? 0,
    corpTagPunishOntologyKindTagPunishPayoff:
      ontologyByKind.tag_punish_payoff ?? 0,
    corpTagPunishOntologyKindTrace: ontologyByKind.trace ?? 0,
    corpTagPunishOntologyKindTag: ontologyByKind.tag ?? 0,
    corpTagPunishOntologyKindDamage: ontologyByKind.damage ?? 0,
    corpTagPunishOntologyKindResourceTrash: ontologyByKind.resource_trash ?? 0,
    corpTagPunishOntologyKindHardwareTrash: ontologyByKind.hardware_trash ?? 0,
    corpTagPunishOntologyKindScoredAgendaDamageLike:
      ontologyByKind.scored_agenda_damage_like ?? 0,
    corpTagPunishOntologyKindScoredAgendaTraceTagLike:
      ontologyByKind.scored_agenda_trace_tag_like ?? 0,
    corpTagPunishConditionByKind: Object.values(ontologyConditionByKind).reduce(
      (sum, value) => sum + value,
      0,
    ),
    corpTagPunishConditionRequiresRunnerTagged:
      ontologyConditionByKind.requires_runner_tagged ?? 0,
    corpTagPunishConditionRequiresTraceSuccess:
      ontologyConditionByKind.requires_trace_success ?? 0,
  };
}
