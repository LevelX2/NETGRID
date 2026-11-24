import type { GameState, LegalAction, ServerId } from "@netgrid/shared";
import {
  publicServerLabel,
  publicServerLabelForCard,
  serverChoiceDisplayLabel,
} from "./game/view/server-view";
import {
  applyPublicRunStartAndAccessContext,
  applyPublicSubroutineBreakContext,
  applyPublicRunContinuationContext,
} from "./game/events/public-run-context";
import { applyPublicInstallContext } from "./game/events/public-install-context";
import { applyPublicChoiceContext } from "./game/events/public-choice-context";
import { applyPublicTraceStartContext } from "./game/events/public-trace-context";
import { applyPublicDamageContext } from "./game/events/public-damage-context";
import { applyPublicHiddenZoneContext } from "./game/events/public-hidden-zone-context";
import { applyPublicCardAbilityContext } from "./game/events/public-card-ability-context";
import { applyPublicAdvancementCardProjection } from "./game/events/public-advancement-context";
import type { PublicContextForActionDependencies } from "./game/events/public-context-dependencies";
export type { PublicContextForActionDependencies } from "./game/events/public-context-dependencies";

/**
 * Projects the public context of an already-created Engine action.
 * Domain projections run in order because later fields can refine earlier ones.
 * Projections read game state and write only to this event's context.
 */
export function publicContextForAction(
  state: GameState,
  legalAction: LegalAction,
  deps: PublicContextForActionDependencies,
): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  const cardId =
    typeof legalAction.payload?.cardId === "string"
      ? legalAction.payload.cardId
      : typeof legalAction.payload?.accessedCardId === "string"
        ? legalAction.payload.accessedCardId
        : undefined;
  const sourceCardId =
    typeof legalAction.source === "string" &&
    state.cardInstances[legalAction.source]
      ? legalAction.source
      : undefined;
  if (legalAction.type === "pump_breaker") {
    const pumpStrengthAmount =
      typeof legalAction.payload?.pumpStrengthAmount === "number"
        ? legalAction.payload.pumpStrengthAmount
        : deps.pumpAmountForLegalAction(state, legalAction);
    const pumpBreakerCreditCost = deps.creditCostForAction(legalAction);
    context.pumpStrengthAmount = pumpStrengthAmount;
    if (pumpBreakerCreditCost > 0)
      context.pumpBreakerCreditCost = pumpBreakerCreditCost;
    const breakerId =
      typeof legalAction.payload?.breakerId === "string"
        ? legalAction.payload.breakerId
        : undefined;
    // A pump action already reveals its installed Icebreaker. Retain the
    // public instance reference solely so UI projections can distinguish
    // consecutive pumps of different copies without inferring game state.
    if (breakerId) context.pumpBreakerId = breakerId;
    if (breakerId && state.cardInstances[breakerId]) {
      const definition = deps.definitionFor(state, breakerId);
      if (typeof definition.strength === "number") {
        context.breakerStrengthAfter =
          definition.strength + deps.cardStrengthModifier(state, breakerId);
      }
    }
  }
  const serverLabel =
    publicServerLabelForCard(state, cardId) ??
    publicServerLabel(state, legalAction.payload?.serverId);
  const agendaId = cardId ?? sourceCardId;
  if (serverLabel) context.serverLabel = serverLabel;
  applyPublicRunStartAndAccessContext(
    state,
    legalAction,
    context,
    cardId,
    deps,
  );
  applyPublicInstallContext(state, legalAction, context, cardId, deps);
  if (
    legalAction.payload?.abilityId === "broken_ice_virus_counter" ||
    legalAction.payload?.abilityId === "broken_ice_virus_counter_choice" ||
    legalAction.payload?.abilityId === "pox_counter"
  ) {
    for (const key of [
      "brokenIceVirusCounterCandidateCount",
      "brokenIceVirusCounterAdded",
      "poxCounterAdded",
      "poxCountersAfter",
      "faitCounterAdded",
      "faitCountersAfter",
      "virusCounterAdded",
      "virusCountersAfter",
      "remainingCounters",
    ]) {
      const value = legalAction.payload?.[key];
      if (typeof value === "number") context[key] = value;
    }
    if (
      typeof legalAction.payload.brokenIceVirusCounterChoiceOpened === "boolean"
    )
      context.brokenIceVirusCounterChoiceOpened =
        legalAction.payload.brokenIceVirusCounterChoiceOpened;
    if (typeof legalAction.payload.targetCardDefinitionId === "number")
      context.targetCardDefinitionId =
        legalAction.payload.targetCardDefinitionId;
    if (typeof legalAction.payload.targetServerLabel === "string")
      context.targetServerLabel = legalAction.payload.targetServerLabel;
    if (typeof legalAction.payload.virusCounterType === "string")
      context.virusCounterType = legalAction.payload.virusCounterType;
    if (typeof legalAction.payload.virusCounterLocation === "string")
      context.virusCounterLocation = legalAction.payload.virusCounterLocation;
    if (typeof legalAction.payload.sourceDefinitionId === "number")
      context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    if (typeof legalAction.payload.choiceVisibility === "string")
      context.choiceVisibility = legalAction.payload.choiceVisibility;
  }
  if (legalAction.type === "trash_resource") {
    context.zoneLabel = "Resource";
    if (legalAction.payload?.hiddenRunnerResource === true) {
      // Trash events for hidden resources keep the same redacted slot contract
      // as install events unless execution explicitly marked the card revealed.
      context.redactedKind = "hidden_runner_resource";
      if (typeof legalAction.payload.hiddenResourceSlotId === "string")
        context.hiddenResourceSlotId = legalAction.payload.hiddenResourceSlotId;
      if (legalAction.payload.hiddenRunnerResourceRevealed === true)
        context.hiddenRunnerResourceRevealed = true;
    }
  }
  if (
    legalAction.type === "trigger_ability" &&
    legalAction.payload?.corpAbility ===
      "trash_new_data_fort_creation_lock_source"
  ) {
    context.zoneLabel = "Resource";
    for (const key of [
      "sourceDefinitionId",
      "trashedCardDefinitionId",
      "trashCostPaid",
      "newDataFortCreationLockRemoved",
      "corpCreditsAfter",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (legalAction.type === "rez_ice" || legalAction.type === "rez_card")
    context.zoneLabel =
      legalAction.payload?.rootRez === true ||
      legalAction.payload?.assetRez === true
        ? "Remote"
        : "ICE";
  if (legalAction.type === "rez_ice" || legalAction.type === "rez_card") {
    for (const key of [
      "rezCostPaid",
      "rezCostReductionAmount",
      "rezCostReductionSourceDefinitionIds",
      "baseRezCost",
      "variableRezKind",
      "variableRezAdditionalCost",
      "variableRezValue",
      "variableRezCap",
      "effectiveStrengthAfterRez",
      "effectiveTraceLimitAfterRez",
      "effectiveSubroutineCountAfterRez",
      "selectedSubtypesAfterRez",
      "discountedRezSourceCardId",
      "discountedRezSourceDefinitionId",
      "discountedRezCostBase",
      "temporaryDerezAfterRun",
      "temporaryDiscountedRunEndDerez",
      "v1922RunnerProgramAbility",
      "sourceDefinitionId",
      "counterType",
      "addedCounterAmount",
      "hostedCreditsAdded",
      "hostedCreditsAfter",
      "remainingCounters",
      "rezInterruptSourceCardId",
      "rezzedCardDefinitionId",
      "serverLabel",
      "rezInterruptChoiceOpened",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (legalAction.payload?.encounterTaxForFutureIce !== undefined) {
    context.result = state.run ? "continued" : "ended";
    for (const key of [
      "encounterTaxForFutureIce",
      "encounterTaxPaid",
      "encounterTaxSource",
      "targetIceDefinitionId",
    ]) {
      const value = legalAction.payload[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (
    legalAction.type === "break_subroutine" &&
    typeof legalAction.payload?.postBreakStealthLoss === "number"
  ) {
    context.postBreakStealthLoss = legalAction.payload.postBreakStealthLoss;
  }
  if (
    legalAction.type === "break_subroutine" &&
    typeof legalAction.payload?.breakSubroutineCount === "number"
  ) {
    context.breakSubroutineCount = legalAction.payload.breakSubroutineCount;
  }
  applyPublicSubroutineBreakContext(legalAction, context);
  if (
    legalAction.type === "break_subroutine" &&
    legalAction.payload?.multiBreakSubroutines === true
  ) {
    context.multiBreakSubroutines = true;
  }
  if (
    legalAction.type === "resolve_choice" &&
    typeof legalAction.payload?.postBreakStealthLoss === "number"
  ) {
    context.postBreakStealthLoss = legalAction.payload.postBreakStealthLoss;
  }
  if (typeof legalAction.payload?.postBreakStealthLossPending === "number") {
    context.postBreakStealthLossPending =
      legalAction.payload.postBreakStealthLossPending;
  }
  if (legalAction.type === "remove_tag") {
    context.amount = Number(legalAction.payload?.removeTagAmount ?? 1);
    for (const key of [
      "tagRemovalRecurringCreditsSpent",
      "runnerCreditsSpent",
      "tagRemovalCreditSourceDefinitionIds",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  } else if (legalAction.type === "draw_card") {
    context.amount = 1;
  } else if (legalAction.type === "activated_card_ability") {
    const payload = legalAction.payload ?? {};
    if (Number.isInteger(payload.gainedCredits)) {
      context.amount = Number(payload.gainedCredits);
    } else if (Number.isInteger(payload.drawnCards)) {
      context.amount = Number(payload.drawnCards);
    } else if (Number.isInteger(payload.drawnCount)) {
      context.amount = Number(payload.drawnCount);
    }
    if (typeof payload.sourceDefinitionId === "number")
      context.sourceDefinitionId = payload.sourceDefinitionId;
  } else if (legalAction.type === "gain_credit") {
    if (Number.isInteger(legalAction.payload?.gainCreditsAmount)) {
      context.amount = Number(legalAction.payload?.gainCreditsAmount);
    } else if (legalAction.payload?.traceStarted !== true) {
      context.amount = 1;
    }
    if (typeof legalAction.payload?.sourceDefinitionId === "number")
      context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    const agendaPointCostPaid = legalAction.payload?.agendaPointCostPaid;
    if (Number.isInteger(agendaPointCostPaid))
      context.agendaPointCostPaid = Number(agendaPointCostPaid);
  }
  applyPublicChoiceContext(state, legalAction, context);
  applyPublicRunContinuationContext(state, legalAction, context);
  applyPublicTraceStartContext(state, legalAction, context);
  if (legalAction.type === "play_operation") {
    for (const key of [
      "gainedCredits",
      "drawnCards",
      "corpCreditsAfter",
      "corpClicksAfter",
      "gainedActions",
      "tagsAdded",
      "runnerTagsAfter",
      "trashedResourceCount",
      "trashedResourceDefinitionIds",
      "hardwareTrashByCounterTrashCount",
      "hardwareTrashByCounterChoiceOpened",
      "eligibleHardwareCount",
      "eligibleResourceCount",
      "runnerInstalledMultiTrashChoiceOpened",
      "runnerInstalledMultiTrashMinimumTargets",
      "runnerInstalledMultiTrashMaximumTargets",
      "runnerInstalledMultiTrashOrdering",
      "runnerInstalledMultiTrashTargetCount",
      "trashedHardwareCount",
      "trashedHardwareDefinitionIds",
      "runnerRunAttemptsLastTurn",
      "classicCorpUtilityAbility",
      "temporaryRunnerMemoryLimitReduction",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (legalAction.type === "play_event") {
    for (const key of [
      "runnerEventAbility",
      "xValue",
      "damageCannotBePrevented",
      "damageType",
      "damageAmount",
      "cardsTrashed",
      "coreDamageAfter",
      "runnerMaxHandSizeAfter",
      "flatline",
      "gainedCredits",
      "runnerCreditsAfter",
      "hostedCreditsSpent",
      "hostedCreditSourceDefinitionIds",
      "normalCreditsSpent",
      "corruptedAgendaCount",
      "corruptedAgendaDefinitionIds",
      "agendaPointsLost",
      "corpBonusAgendaPointsAfter",
      "spentAgendaDefinitionIds",
      "tagsAdded",
      "runnerTagsAfter",
      "specialZone",
      "specialZoneVisibility",
      "sourceDefinitionId",
      "delayedEffectInstanceId",
      "nextAgendaAccessCreditGainAmount",
      "agendaPointBonus",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  }
  applyPublicDamageContext(legalAction, context);
  if (legalAction.type === "purge_virus_counters") {
    context.purgedCounterType = "virus";
    context.purgedVirusCounters = legalAction.payload?.purgedVirusCounters ?? 0;
  }
  if (legalAction.type === "purge_runner_virus_counters") {
    context.purgedCounterType = "runner_virus";
    context.purgeModel = legalAction.payload?.purgeModel;
    context.purgedRunnerVirusCounters =
      legalAction.payload?.purgedRunnerVirusCounters ?? 0;
    context.purgedCounterSummary = legalAction.payload?.purgedCounterSummary;
    context.actionDebtAdded = legalAction.payload?.actionDebtAdded;
    context.corpActionDebtTotalAfter =
      legalAction.payload?.corpActionDebtTotalAfter;
    context.timingWindowId = legalAction.payload?.timingWindowId;
    context.timingFamily = legalAction.payload?.timingFamily;
  }
  if (legalAction.type === "forgo_action") {
    context.actionDebtPaid = legalAction.payload?.actionDebtPaid;
    context.corpActionDebtTotalBefore =
      legalAction.payload?.corpActionDebtTotalBefore;
    context.corpActionDebtTotalAfter =
      legalAction.payload?.corpActionDebtTotalAfter;
    context.corpClicksAfter = legalAction.payload?.corpClicksAfter;
  }
  if (typeof legalAction.payload?.scoredAgendaFreeRezFreeRez === "boolean")
    context.scoredAgendaFreeRezFreeRez =
      legalAction.payload.scoredAgendaFreeRezFreeRez;
  if (typeof legalAction.payload?.scoredAgendaFreeRezChoiceOpened === "boolean")
    context.scoredAgendaFreeRezChoiceOpened =
      legalAction.payload.scoredAgendaFreeRezChoiceOpened;
  if (
    typeof legalAction.payload?.scoredAgendaFreeRezCandidateCount === "number"
  )
    context.scoredAgendaFreeRezCandidateCount =
      legalAction.payload.scoredAgendaFreeRezCandidateCount;
  if (typeof legalAction.payload?.scoredAgendaFreeRezDeclined === "boolean")
    context.scoredAgendaFreeRezDeclined =
      legalAction.payload.scoredAgendaFreeRezDeclined;
  if (typeof legalAction.payload?.scoredAgendaFreeRezTarget === "string")
    context.scoredAgendaFreeRezTarget =
      legalAction.payload.scoredAgendaFreeRezTarget;
  if (
    typeof legalAction.payload?.scoredAgendaFreeRezTargetDefinitionId ===
    "number"
  )
    context.scoredAgendaFreeRezTargetDefinitionId =
      legalAction.payload.scoredAgendaFreeRezTargetDefinitionId;
  applyPublicHiddenZoneContext(legalAction, context);
  if (typeof legalAction.payload?.archivesAutoAccessedCount === "number")
    context.archivesAutoAccessedCount =
      legalAction.payload.archivesAutoAccessedCount;
  for (const key of [
    "accessTrashBaseCost",
    "accessTrashCostModifier",
    "accessTrashTotalCost",
    "upgradeTrashRecurringCreditsAvailable",
    "upgradeTrashRecurringCreditsSpent",
    "poltergeistRecurringCreditsAvailable",
    "poltergeistRecurringCreditsSpent",
    "runnerCreditsSpent",
  ]) {
    const value = legalAction.payload?.[key];
    if (typeof value === "number") context[key] = value;
  }
  if (
    typeof legalAction.payload?.accessTrashCostSourceDefinitionIds === "string"
  )
    context.accessTrashCostSourceDefinitionIds =
      legalAction.payload.accessTrashCostSourceDefinitionIds;
  if (typeof legalAction.payload?.accessTrashCostSourceTitles === "string")
    context.accessTrashCostSourceTitles =
      legalAction.payload.accessTrashCostSourceTitles;
  if (typeof legalAction.payload?.v1922RunnerProgramAbility === "string")
    if (typeof legalAction.payload.v1922RunnerProgramAbility === "string")
      context.v1922RunnerProgramAbility =
        legalAction.payload.v1922RunnerProgramAbility;
  if (typeof legalAction.payload?.runnerHardwareAbility === "string")
    context.runnerHardwareAbility = legalAction.payload.runnerHardwareAbility;
  if (typeof legalAction.payload?.printedDamageAmount === "number")
    context.printedDamageAmount = legalAction.payload.printedDamageAmount;
  if (typeof legalAction.payload?.stealCost === "number")
    // Steal-cost fields may include current-access persistence; the cost layer
    // owns that rule and this module only reports the already-quoted result.
    context.stealCost = legalAction.payload.stealCost;
  if (typeof legalAction.payload?.stealAdditionalCost === "number")
    context.stealAdditionalCost = legalAction.payload.stealAdditionalCost;
  if (typeof legalAction.payload?.stealCostSourceDefinitionIds === "string")
    context.stealCostSourceDefinitionIds =
      legalAction.payload.stealCostSourceDefinitionIds;
  if (typeof legalAction.payload?.stealCostSourceTitles === "string")
    context.stealCostSourceTitles = legalAction.payload.stealCostSourceTitles;
  if (legalAction.payload?.stealCostPersistedForCurrentAccess === true)
    context.stealCostPersistedForCurrentAccess = true;
  if (legalAction.payload?.publicRevealKind)
    context.revealKind = legalAction.payload.publicRevealKind;
  if (typeof legalAction.payload?.publicRevealKind === "string")
    context.publicRevealKind = legalAction.payload.publicRevealKind;
  if (typeof legalAction.payload?.publicRevealDefinitionId === "number")
    context.publicRevealDefinitionId =
      legalAction.payload.publicRevealDefinitionId;
  if (legalAction.payload?.hiddenRunnerResourceRevealed === true) {
    context.hiddenRunnerResourceRevealed = true;
    if (typeof legalAction.payload.hiddenResourceSlotId === "string")
      context.hiddenResourceSlotId = legalAction.payload.hiddenResourceSlotId;
  }
  if (typeof legalAction.payload?.exposedServerId === "string")
    context.exposedServerId = legalAction.payload.exposedServerId;
  if (
    legalAction.type === "move_to_set_aside" ||
    legalAction.type === "move_to_removed_from_game" ||
    legalAction.type === "return_from_set_aside"
  ) {
    context.specialZone = legalAction.payload?.specialZone;
    context.specialZoneVisibility = legalAction.payload?.specialZoneVisibility;
    context.specialZoneReason = legalAction.payload?.specialZoneReason;
    context.redactedKind = "special_zone";
  }
  if (legalAction.type === "change_card_control") {
    context.oldController = legalAction.payload?.oldController;
    context.newController = legalAction.payload?.newController;
    context.ownershipChanged = false;
    context.controlChangeReason = legalAction.payload?.controlChangeReason;
    context.redactedKind = "control_change";
  }
  if (typeof legalAction.payload?.badPublicityAfter === "number")
    context.badPublicityAfter = legalAction.payload.badPublicityAfter;
  if (typeof legalAction.payload?.targetCount === "number")
    context.targetCount = legalAction.payload.targetCount;
  if (typeof legalAction.payload?.targetCardDefinitionIds === "string")
    context.targetCardDefinitionIds =
      legalAction.payload.targetCardDefinitionIds;
  if (typeof legalAction.payload?.removedTags === "number")
    context.removedTags = legalAction.payload.removedTags;
  if (typeof legalAction.payload?.discardedCardsCount === "number")
    context.discardedCardsCount = legalAction.payload.discardedCardsCount;
  if (typeof legalAction.payload?.runnerTagsAfter === "number")
    context.runnerTagsAfter = legalAction.payload.runnerTagsAfter;
  if (legalAction.payload?.secretSpendGuessRun === true)
    context.secretSpendGuessRun = true;
  // Hosted-credit and counter values copied below are public summaries already
  // produced by execution. Keep this list as presentation wiring, not as a
  // general counter-engine policy layer.
  for (const key of [
    "gainedCredits",
    "creditGainBaseAmount",
    "creditGainBonusAmount",
    "creditGainModifierSourceDefinitionIds",
    "creditGainRequestedAmount",
    "creditGainInterceptedAmount",
    "firstPrepCreditGainBonus",
    "firstPrepCreditGainBonusSourceDefinitionIds",
    "runnerCreditsAfter",
    "corpCreditsAfter",
    "paidCredits",
    "endedRun",
    "runnerUtilityAbility",
    "resourceAbility",
    "spentAgendaCardId",
    "counterType",
    "addedCounterAmount",
    "removedCounterAmount",
    "remainingCounters",
    "exposureThreshold",
    "exposureActive",
    "hostedCreditsAdded",
    "hostedCreditsTaken",
    "hostedCreditsAfter",
    "shortTermContractTrashed",
    "gainCreditsAmount",
    "removePowerCounterAmount",
    "drawCardsAmount",
    "drawnCount",
    "drawReplacementSourceTitle",
    "drawReplacementExtraDrawn",
    "strategicPlanningGroupChoiceResolved",
    "strategicPlanningGroupBaseDrawCount",
    "strategicPlanningGroupAdditionalDrawCount",
    "strategicPlanningGroupDrawnCardCount",
    "strategicPlanningGroupNetDrawCount",
    "bottomedCardCount",
    "corpMandatoryDraw",
    "corpMandatoryDrawCompleted",
    "corpMandatoryCardCount",
    "corpMandatoryAdditionalCardCount",
    "corpMandatoryTotalBaseDrawCount",
    "corpMandatoryAgendaCardCount",
    "corpMandatoryOptionalAgendaCardCount",
    "corpMandatorySkivvissCardCount",
    "corpMandatoryAdditionalSourceCount",
    "corpMandatoryAdditionalSourceDefinitionIds",
    "selectedAdditionalDrawCount",
    "crashEverettChoiceOpened",
    "crashEverettDisposition",
    "crashEverettDrawnCardCount",
    "returnedToStackTop",
    "runnerGripAfter",
    "drawTaxSourceCount",
    "drawTaxDecision",
    "drawTaxCreditsPaid",
    "drawTaxTagsAdded",
    "drawTaxTags",
    "drawTaxProjectedDrawCount",
    "obligationDebtActive",
    "creditGainDiverted",
    "traceHostedCreditsAdded",
    "cryingCountersAfter",
    "linkModifierAmount",
    "runSpendingCap",
    "runSpendingCapSpent",
    "runActionSpendingCapActive",
    "hardwareTrashByCounterTrashCount",
    "hardwareTrashByCounterChoiceOpened",
    "eligibleHardwareCount",
    "eligibleResourceCount",
    "runnerInstalledMultiTrashChoiceOpened",
    "runnerInstalledMultiTrashMinimumTargets",
    "runnerInstalledMultiTrashMaximumTargets",
    "runnerInstalledMultiTrashOrdering",
    "runnerInstalledMultiTrashTargetCount",
    "trashedHardwareCount",
    "trashedHardwareDefinitionIds",
    "trashedResourceCount",
    "trashedResourceDefinitionIds",
    "movedAdvancementCounters",
    "creditsLost",
    "tagsAdded",
    "runnerTagsAfter",
    "badPublicityAdded",
    "corpBadPublicityBefore",
    "corpBadPublicityAfter",
    "sourceVisibility",
    "sourceDefinitionId",
    "sourceZone",
    "destinationZone",
    "returnedCardDefinitionId",
    "returnedCount",
    "returnedToGrip",
    "subroutineIndex",
    "targetCardDefinitionId",
    "targetIceDefinitionId",
    "targetIcePositionLabel",
    "iceStrengthBefore",
    "iceStrengthAfter",
    "iceStrengthBonusApplied",
    "iceStrengthMaxCap",
    "breakSubroutineBaseCost",
    "checkedIceCount",
    "successfulRunForceRezCreditCost",
    "rezzedIceCount",
    "rezCostPaid",
    "rezBaseCreditCostWaived",
    "rezAdditionalCreditsPaid",
    "rezAgendaPointsPaid",
    "effectDrivenAdditionalInstallCreditsPaid",
    "effectDrivenAdditionalRezCreditsPaid",
    "effectDrivenRezAgendaPointsPaid",
    "priorityRequisitionChoiceOpened",
    "priorityRequisitionCandidateCount",
    "priorityRequisitionFreeRez",
    "priorityRequisitionDeclined",
    "priorityRequisitionTargetDefinitionId",
    "revealedCount",
    "rezzedMatchingIceCount",
    "countedMatchingIceCount",
    "iceCount",
    "passedIcePosition",
    "serverIceOrderReversed",
    "serverLabel",
    "accessCount",
    "gainedAgendaPoints",
    "targetTrashCount",
    "hardwareTrashCount",
    "programTrashCount",
    "selfDestructTrashedCount",
    "damageAmount",
    "trashedCorpInstalledCardCount",
    "trashedInstalledRunnerHardwareCount",
    "trashedInstalledRunnerProgramCount",
    "netDamageAmount",
    "classicIndiscriminateResponseTeam",
    "runnerGripShuffledIntoStackCount",
    "runnerCardsDrawnAfterGripShuffle",
    "runnerStackAfter",
    "classicIndiscriminateResponseTeamSourceDefinitionIds",
  ]) {
    const value = legalAction.payload?.[key];
    if (value !== undefined) context[key] = value;
  }
  if (legalAction.payload?.bonusRunOnFinish === true)
    context.bonusRunOnFinish = true;
  if (legalAction.payload?.sourceVisibility === "redacted") {
    delete context.sourceDefinitionId;
    delete context.sourceTitle;
    context.redactedKind =
      typeof legalAction.payload.redactedKind === "string"
        ? legalAction.payload.redactedKind
        : "hidden_resource_source";
  }
  if (legalAction.payload?.bypassFirstIce === true)
    context.bypassFirstIce = true;
  if (legalAction.payload?.runStartBypassAutoPassedIce === true) {
    context.runStartBypassAutoPassedIce = true;
    if (
      typeof legalAction.payload.runStartBypassPassedIceDefinitionId ===
      "number"
    )
      context.runStartBypassPassedIceDefinitionId =
        legalAction.payload.runStartBypassPassedIceDefinitionId;
  }
  if (legalAction.payload?.scoredAsAgenda === true)
    context.scoredAsAgenda = true;
  if (typeof legalAction.payload?.sourceTrashed === "boolean")
    context.sourceTrashed = legalAction.payload.sourceTrashed;
  if (typeof legalAction.payload?.ambushDefinitionId === "number")
    context.ambushDefinitionId = legalAction.payload.ambushDefinitionId;
  if (typeof legalAction.payload?.tagConditionMet === "boolean")
    context.tagConditionMet = legalAction.payload.tagConditionMet;
  if (typeof legalAction.payload?.damageSkippedReason === "string")
    context.damageSkippedReason = legalAction.payload.damageSkippedReason;
  if (typeof legalAction.payload?.ambushSkippedReason === "string")
    context.ambushSkippedReason = legalAction.payload.ambushSkippedReason;
  if (typeof legalAction.payload?.onScoreGainCredits === "number")
    context.onScoreGainCredits = legalAction.payload.onScoreGainCredits;
  if (
    typeof legalAction.payload?.scoredFortIceStrengthBonusServerId === "string"
  )
    context.scoredFortIceStrengthBonusServerId =
      legalAction.payload.scoredFortIceStrengthBonusServerId;
  if (typeof legalAction.payload?.selectedServerId === "string")
    context.selectedServerId = legalAction.payload.selectedServerId;
  if (typeof legalAction.payload?.selectedServerLabel === "string")
    context.selectedServerLabel = legalAction.payload.selectedServerLabel;
  else if (typeof legalAction.payload?.selectedServerId === "string")
    context.selectedServerLabel = serverChoiceDisplayLabel(
      state,
      legalAction.payload.selectedServerId as Exclude<ServerId, "new_remote">,
    );
  if (legalAction.payload?.classicDeflector === true) {
    context.classicDeflector = true;
    for (const key of [
      "deflectedRun",
      "deflectorChoiceOpened",
      "deflectorAutoBroken",
      "redirectedToRezzedIce",
    ]) {
      const value = legalAction.payload[key];
      if (typeof value === "boolean") context[key] = value;
    }
    if (typeof legalAction.payload.redirectedServerId === "string") {
      const redirectedServerId = legalAction.payload
        .redirectedServerId as Exclude<ServerId, "new_remote">;
      context.selectedServerId = redirectedServerId;
      context.selectedServerLabel = serverChoiceDisplayLabel(
        state,
        redirectedServerId,
      );
    }
  }
  if (typeof legalAction.payload?.agendaAbility === "string")
    context.agendaAbility = legalAction.payload.agendaAbility;
  if (typeof legalAction.payload?.cardDefinitionId === "number")
    context.cardDefinitionId = legalAction.payload.cardDefinitionId;
  if (typeof legalAction.payload?.spentPowerCounters === "number")
    context.spentPowerCounters = legalAction.payload.spentPowerCounters;
  if (typeof legalAction.payload?.gainedCredits === "number")
    context.gainedCredits = legalAction.payload.gainedCredits;
  if (typeof legalAction.payload?.corpRezzedIceThisTurnCount === "number")
    context.corpRezzedIceThisTurnCount =
      legalAction.payload.corpRezzedIceThisTurnCount;
  if (typeof legalAction.payload?.sourceCount === "number")
    context.sourceCount = legalAction.payload.sourceCount;
  for (const key of [
    "targetIceDefinitionId",
    "strengthBonus",
    "cardImplementationDuplicateEachSelfProvidedSubroutinePerCounter",
  ]) {
    const value = legalAction.payload?.[key];
    if (value !== undefined) context[key] = value;
  }
  if (typeof legalAction.payload?.scoreCreditSwingCreditsBefore === "number")
    context.scoreCreditSwingCreditsBefore =
      legalAction.payload.scoreCreditSwingCreditsBefore;
  if (typeof legalAction.payload?.scoreCreditSwingThreshold === "number")
    context.scoreCreditSwingThreshold =
      legalAction.payload.scoreCreditSwingThreshold;
  if (typeof legalAction.payload?.scoreCreditSwingThresholdMet === "boolean")
    context.scoreCreditSwingThresholdMet =
      legalAction.payload.scoreCreditSwingThresholdMet;
  if (legalAction.payload?.onScoreLostAllCredits === true)
    context.onScoreLostAllCredits = true;
  if (typeof legalAction.payload?.corpCreditsAfter === "number")
    context.corpCreditsAfter = legalAction.payload.corpCreditsAfter;
  if (
    legalAction.payload?.agendaAbility ===
    "scored_agenda_credit_until_install_or_rez"
  ) {
    context.agendaAbility = legalAction.payload.agendaAbility;
    if (typeof legalAction.payload.gainedCredits === "number")
      context.gainedCredits = legalAction.payload.gainedCredits;
  }
  applyPublicCardAbilityContext(legalAction, context);
  if (typeof legalAction.payload?.v1919AgendaDifficulty === "number")
    context.v1919AgendaDifficulty = legalAction.payload.v1919AgendaDifficulty;
  if (typeof legalAction.payload?.v1919Overadvance === "number")
    context.v1919Overadvance = legalAction.payload.v1919Overadvance;
  if (typeof legalAction.payload?.v1919BonusAgendaPoints === "number")
    context.v1919BonusAgendaPoints = legalAction.payload.v1919BonusAgendaPoints;
  if (
    typeof legalAction.payload?.overadvanceBonusAgendaPointOveradvance ===
    "number"
  )
    context.overadvanceBonusAgendaPointOveradvance =
      legalAction.payload.overadvanceBonusAgendaPointOveradvance;
  if (typeof legalAction.payload?.overadvanceBonusAgendaPoints === "number")
    context.overadvanceBonusAgendaPoints =
      legalAction.payload.overadvanceBonusAgendaPoints;
  if (typeof legalAction.payload?.overadvanceRecurringCredits === "number")
    context.overadvanceRecurringCredits =
      legalAction.payload.overadvanceRecurringCredits;
  if (typeof legalAction.payload?.projectZurichOveradvance === "number")
    context.projectZurichOveradvance =
      legalAction.payload.projectZurichOveradvance;
  if (typeof legalAction.payload?.runnerVirusCountersPurged === "number")
    context.runnerVirusCountersPurged =
      legalAction.payload.runnerVirusCountersPurged;
  if (typeof legalAction.payload?.runnerVirusCounterPurgeSummary === "string")
    context.runnerVirusCounterPurgeSummary =
      legalAction.payload.runnerVirusCounterPurgeSummary;
  if (
    typeof legalAction.payload?.runnerVirusCounterPreventionChargesAdded ===
    "number"
  )
    context.runnerVirusCounterPreventionChargesAdded =
      legalAction.payload.runnerVirusCounterPreventionChargesAdded;
  if (
    typeof legalAction.payload?.corpRunnerVirusCounterPreventionChargesAfter ===
    "number"
  )
    context.corpRunnerVirusCounterPreventionChargesAfter =
      legalAction.payload.corpRunnerVirusCounterPreventionChargesAfter;
  if (typeof legalAction.payload?.scoredSourceAsAgenda === "boolean")
    context.scoredSourceAsAgenda = legalAction.payload.scoredSourceAsAgenda;
  if (typeof legalAction.payload?.scoredAgendaPointValue === "number")
    context.scoredAgendaPointValue = legalAction.payload.scoredAgendaPointValue;
  if (typeof legalAction.payload?.runnerMemoryUsedAfter === "number")
    context.runnerMemoryUsedAfter = legalAction.payload.runnerMemoryUsedAfter;
  if (
    typeof legalAction.payload?.cardImplementationSourceCounterType === "string"
  )
    context.cardImplementationSourceCounterType =
      legalAction.payload.cardImplementationSourceCounterType;
  if (
    typeof legalAction.payload?.cardImplementationSourceCounterCost === "number"
  )
    context.cardImplementationSourceCounterCost =
      legalAction.payload.cardImplementationSourceCounterCost;
  if (typeof legalAction.payload?.runEnded === "boolean")
    context.runEnded = legalAction.payload.runEnded;
  if (typeof legalAction.payload?.runSuccessful === "boolean")
    context.runSuccessful = legalAction.payload.runSuccessful;
  for (const key of [
    "delayedEffectInstanceIds",
    "sourceDefinitionIds",
    "sourceTitles",
  ]) {
    const value = legalAction.payload?.[key];
    if (typeof value === "string") context[key] = value;
  }
  for (const key of [
    "agendaPointBonusPending",
    "nextAgendaAccessAgendaPointBonusAmount",
  ]) {
    const value = legalAction.payload?.[key];
    if (typeof value === "number") context[key] = value;
  }
  if (legalAction.payload?.nextAgendaAccessCreditGainResolved === true)
    context.nextAgendaAccessCreditGainResolved = true;
  if (legalAction.payload?.nextAgendaAccessAgendaPointConsumed === true)
    context.nextAgendaAccessAgendaPointConsumed = true;
  if (state.winner && state.gameEndReason)
    context.gameEndReason = state.gameEndReason;
  if (state.run?.phase) context.runPhase = state.run.phase;
  if (legalAction.type === "steal_agenda") {
    const agendaAccessReplacement =
      legalAction.payload?.agendaAccessReplacement;
    if (typeof agendaAccessReplacement === "string")
      context.agendaAccessReplacement = agendaAccessReplacement;
    if (legalAction.payload?.delayedAgendaAccessScoreScheduled === true)
      context.delayedAgendaAccessScoreScheduled = true;
    if (
      typeof legalAction.payload?.delayedAgendaAccessSourceDefinitionId ===
      "number"
    )
      context.delayedAgendaAccessSourceDefinitionId =
        legalAction.payload.delayedAgendaAccessSourceDefinitionId;
  }
  const scoredSide =
    legalAction.type === "score_agenda"
      ? "corp"
      : legalAction.type === "steal_agenda"
        ? "runner"
        : undefined;
  if (
    scoredSide &&
    agendaId &&
    state[scoredSide].scoreArea.includes(agendaId)
  ) {
    const definition = deps.definitionFor(state, agendaId);
    if (definition.type === "agenda") {
      context.agendaPoints = definition.agendaPoints ?? 0;
      const bonusAgendaPoints = deps.cardCounter(state, agendaId, "agenda");
      if (bonusAgendaPoints > 0) context.agendaPointBonus = bonusAgendaPoints;
      context.totalAgendaPoints = state[scoredSide].scoreArea.reduce(
        (sum, scoredAgendaId) =>
          sum + deps.agendaPointsForScoredCard(state, scoredAgendaId),
        0,
      );
    }
  }
  if (
    legalAction.side === "corp" &&
    (legalAction.type === "install_card" || legalAction.type === "advance_card")
  )
    context.redactedKind = "installed_card";

  applyPublicAdvancementCardProjection(state, legalAction, context, deps);

  return context;
}
