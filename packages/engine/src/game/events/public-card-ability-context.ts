import { isRandomPurposeCode, type LegalAction } from "@netgrid/shared";

export function applyPublicCardAbilityContext(
  legalAction: LegalAction,
  context: Record<string, unknown>,
): void {
  if (legalAction.payload?.agendaAbility === "agenda_purge") {
    context.agendaAbility = "agenda_purge";
    context.hiddenZoneBarrier = true;
    for (const key of [
      "hiddenZoneAction",
      "sourceDefinitionId",
      "agendaPurgeInstallContract",
      "publicRevealDefinitionIds",
      "installedIceDefinitionIds",
      "installedIceServerLabels",
      "trashedDefinitionIds",
    ]) {
      const value = legalAction.payload[key];
      if (typeof value === "string") context[key] = value;
    }
    for (const key of [
      "revealedCount",
      "revealedIceCount",
      "pendingTrashCount",
      "installedIceCount",
      "trashedCount",
      "agendaPurgeTargetChoiceCount",
    ]) {
      const value = legalAction.payload[key];
      if (typeof value === "number") context[key] = value;
    }
    for (const key of [
      "agendaPurgeWaivesPrintedRezCosts",
      "agendaPurgeRunnerReviewOpened",
      "agendaPurgeRunnerReviewResolved",
      "agendaPurgeTargetChoiceOpened",
      "agendaPurgeTargetChoiceResolved",
    ]) {
      const value = legalAction.payload[key];
      if (typeof value === "boolean") context[key] = value;
    }
    context.redactedKind = "hidden_zone";
  }
  if (typeof legalAction.payload?.gainedActions === "number")
    context.gainedActions = legalAction.payload.gainedActions;
  if (typeof legalAction.payload?.cardImplementationAbility === "string") {
    context.cardImplementationAbility =
      legalAction.payload.cardImplementationAbility;
    for (const key of [
      "cardImplementationAbilityTiming",
      "sourceDefinitionId",
      "gainedCredits",
      "drawnCards",
      "drawnCount",
      "runnerCreditsAfter",
      "corpCreditsAfter",
      "runnerGripAfter",
      "counterType",
      "addedCounterAmount",
      "removedCounterAmount",
      "remainingCounters",
      "advancementCounterCount",
      "cardImplementationAdvancementCounterCost",
      "corpClicksAfter",
      "hostedCreditsAdded",
      "hostedCreditsTaken",
      "hostedCreditsAfter",
      "sourceTrashed",
      "trashedCardDefinitionId",
      "delayedEffectInstanceId",
      "nextAgendaAccessCreditGainAmount",
      "agendaPointBonus",
    ]) {
      const value = legalAction.payload[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (typeof legalAction.payload?.v1917AssetAbility === "string") {
    context.v1917AssetAbility = legalAction.payload.v1917AssetAbility;
    for (const key of [
      "spinnPublicRelationsPoolBefore",
      "spinnPublicRelationsPoolAfter",
      "counterType",
      "addedCounterAmount",
      "removedCounterAmount",
      "remainingCounters",
      "gainedCredits",
      "selfTrashed",
      "corpCreditsAfter",
    ]) {
      const value = legalAction.payload[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (typeof legalAction.payload?.runnerAbility === "string") {
    context.runnerAbility = legalAction.payload.runnerAbility;
    for (const key of [
      "removedCounterAmount",
      "remainingCounters",
      "runnerCreditsAfter",
    ]) {
      const value = legalAction.payload[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (typeof legalAction.payload?.obligationDebtAbility === "string") {
    context.obligationDebtAbility = legalAction.payload.obligationDebtAbility;
    for (const key of [
      "agendaPointCost",
      "agendaPointCostPaid",
      "corpBonusAgendaPointsSpent",
      "forfeitedAgendaDefinitionIds",
      "spentAgendaDefinitionIds",
      "gainedCredits",
      "selfTrashed",
      "activeObligationDebtCount",
      "obligationDebtCountBefore",
      "obligationDebtCountAfter",
      "obligationDebtCreditCost",
      "obligationDebtPaymentDue",
      "obligationDebtPaymentPaid",
      "obligationDebtPaymentFailed",
      "obligationDebtScoreAgendaPoints",
      "gainedAgendaPoints",
      "corpBonusAgendaPointsAfter",
      "corpCreditsBefore",
      "corpCreditsAfter",
      "specialZone",
      "specialZoneVisibility",
      "specialZoneReason",
    ]) {
      const value = legalAction.payload[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (typeof legalAction.payload?.runStartTaxCredits === "number")
    context.runStartTaxCredits = legalAction.payload.runStartTaxCredits;
  if (typeof legalAction.payload?.runStartTaxSourceDefinitionIds === "string")
    context.runStartTaxSourceDefinitionIds =
      legalAction.payload.runStartTaxSourceDefinitionIds;
  if (typeof legalAction.payload?.runStartLossCredits === "number")
    context.runStartLossCredits = legalAction.payload.runStartLossCredits;
  if (typeof legalAction.payload?.runStartLossApplied === "number")
    context.runStartLossApplied = legalAction.payload.runStartLossApplied;
  if (typeof legalAction.payload?.runStartLossSourceDefinitionIds === "string")
    context.runStartLossSourceDefinitionIds =
      legalAction.payload.runStartLossSourceDefinitionIds;
  if (typeof legalAction.payload?.v1918UpgradeAbility === "string") {
    context.v1918UpgradeAbility = legalAction.payload.v1918UpgradeAbility;
    if (typeof legalAction.payload.runStartTaxPaid === "number")
      context.runStartTaxPaid = legalAction.payload.runStartTaxPaid;
    if (typeof legalAction.payload.addedCounterAmount === "number")
      context.addedCounterAmount = legalAction.payload.addedCounterAmount;
    if (typeof legalAction.payload.remainingCounters === "number")
      context.remainingCounters = legalAction.payload.remainingCounters;
    if (typeof legalAction.payload.runnerTagsAfter === "number")
      context.runnerTagsAfter = legalAction.payload.runnerTagsAfter;
    if (typeof legalAction.payload.runStartTaxSourceDefinitionIds === "string")
      context.runStartTaxSourceDefinitionIds =
        legalAction.payload.runStartTaxSourceDefinitionIds;
  }
  if (legalAction.payload?.stealBlockedByCost === true)
    context.stealBlockedByCost = true;
  if (
    legalAction.payload?.agendaAbility === "v1919_scored_agenda_reveal_rd_top"
  ) {
    context.agendaAbility = "v1919_scored_agenda_reveal_rd_top";
  }
  if (typeof legalAction.payload?.v1919OperationAbility === "string") {
    context.v1919OperationAbility = legalAction.payload.v1919OperationAbility;
    if (typeof legalAction.payload.targetCardId === "string")
      context.targetCardId = legalAction.payload.targetCardId;
    if (typeof legalAction.payload.targetCardDefinitionId === "number")
      context.targetCardDefinitionId =
        legalAction.payload.targetCardDefinitionId;
    if (typeof legalAction.payload.addedCounterAmount === "number")
      context.addedCounterAmount = legalAction.payload.addedCounterAmount;
    if (typeof legalAction.payload.remainingCounters === "number")
      context.remainingCounters = legalAction.payload.remainingCounters;
    if (typeof legalAction.payload.addedAdvancementCounters === "number")
      context.addedAdvancementCounters =
        legalAction.payload.addedAdvancementCounters;
    if (typeof legalAction.payload.targetCount === "number")
      context.targetCount = legalAction.payload.targetCount;
    if (typeof legalAction.payload.advancementCountersAfter === "number")
      context.advancementCountersAfter =
        legalAction.payload.advancementCountersAfter;
    if (typeof legalAction.payload.advancementCountersMoved === "number")
      context.advancementCountersMoved =
        legalAction.payload.advancementCountersMoved;
    if (
      typeof legalAction.payload.advancementCounterSourceDefinitionId ===
      "number"
    )
      context.advancementCounterSourceDefinitionId =
        legalAction.payload.advancementCounterSourceDefinitionId;
    if (
      typeof legalAction.payload.advancementCounterTargetDefinitionId ===
      "number"
    )
      context.advancementCounterTargetDefinitionId =
        legalAction.payload.advancementCounterTargetDefinitionId;
    if (typeof legalAction.payload.advancementCounterSourceAfter === "number")
      context.advancementCounterSourceAfter =
        legalAction.payload.advancementCounterSourceAfter;
    if (typeof legalAction.payload.advancementCounterTargetAfter === "number")
      context.advancementCounterTargetAfter =
        legalAction.payload.advancementCounterTargetAfter;
    if (typeof legalAction.payload.agendaPointCostPaid === "number")
      context.agendaPointCostPaid = legalAction.payload.agendaPointCostPaid;
    if (typeof legalAction.payload.forfeitedAgendaDefinitionId === "number")
      context.forfeitedAgendaDefinitionId =
        legalAction.payload.forfeitedAgendaDefinitionId;
    if (typeof legalAction.payload.specialZone === "string")
      context.specialZone = legalAction.payload.specialZone;
    if (typeof legalAction.payload.specialZoneVisibility === "string")
      context.specialZoneVisibility = legalAction.payload.specialZoneVisibility;
    if (typeof legalAction.payload.specialZoneReason === "string")
      context.specialZoneReason = legalAction.payload.specialZoneReason;
  }
  if (
    typeof legalAction.payload?.v1915RunnerProgramAbility === "string" ||
    legalAction.payload?.hiddenZoneAction ===
      "p3_38_look_top_stack_show_to_corp_then_install_matching"
  ) {
    context.v1915RunnerProgramAbility =
      legalAction.payload.v1915RunnerProgramAbility ?? "card_implementation";
    if (typeof legalAction.payload.revealCount === "number")
      context.revealCount = legalAction.payload.revealCount;
    if (typeof legalAction.payload.revealedCardDefinitionIds === "string")
      context.revealedCardDefinitionIds =
        legalAction.payload.revealedCardDefinitionIds;
    if (typeof legalAction.payload.revealedProgramCount === "number")
      context.revealedProgramCount = legalAction.payload.revealedProgramCount;
    if (typeof legalAction.payload.installedProgramDefinitionId === "number")
      context.installedProgramDefinitionId =
        legalAction.payload.installedProgramDefinitionId;
    if (typeof legalAction.payload.installedProgramCount === "number")
      context.installedProgramCount = legalAction.payload.installedProgramCount;
    if (typeof legalAction.payload.movedCardCount === "number")
      context.movedCardCount = legalAction.payload.movedCardCount;
    if (typeof legalAction.payload.selfTrashed === "boolean")
      context.selfTrashed = legalAction.payload.selfTrashed;
    if (legalAction.payload.programFound === false)
      context.programFound = false;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
  }
  if (
    typeof legalAction.payload?.v1922RunnerProgramAbility === "string" ||
    legalAction.payload?.runnerUtilityAbility ===
      "trash_fully_broken_passed_ice"
  ) {
    if (typeof legalAction.payload?.runnerUtilityAbility === "string")
      context.runnerUtilityAbility = legalAction.payload.runnerUtilityAbility;
    if (typeof legalAction.payload?.abilityKind === "string")
      context.abilityKind = legalAction.payload.abilityKind;
    if (typeof legalAction.payload.v1922RunnerProgramAbility === "string")
      context.v1922RunnerProgramAbility =
        legalAction.payload.v1922RunnerProgramAbility;
    if (typeof legalAction.payload.gainedCredits === "number")
      context.gainedCredits = legalAction.payload.gainedCredits;
    if (typeof legalAction.payload.runnerCreditsAfter === "number")
      context.runnerCreditsAfter = legalAction.payload.runnerCreditsAfter;
    if (typeof legalAction.payload.rezCostPaid === "number")
      context.rezCostPaid = legalAction.payload.rezCostPaid;
    if (typeof legalAction.payload.trashedCount === "number")
      context.trashedCount = legalAction.payload.trashedCount;
    if (typeof legalAction.payload.trashedCardDefinitionId === "number")
      context.trashedCardDefinitionId =
        legalAction.payload.trashedCardDefinitionId;
    if (typeof legalAction.payload.targetIceDefinitionId === "number")
      context.targetIceDefinitionId = legalAction.payload.targetIceDefinitionId;
    if (legalAction.payload.sourceAbilityExhausted === true)
      context.sourceAbilityExhausted = true;
    if (typeof legalAction.payload.futureActionDebtAdded === "number")
      context.futureActionDebtAdded = legalAction.payload.futureActionDebtAdded;
    if (typeof legalAction.payload.futureActionDebtPending === "number")
      context.futureActionDebtPending =
        legalAction.payload.futureActionDebtPending;
    if (typeof legalAction.payload.breakerStrengthAfter === "number")
      context.breakerStrengthAfter = legalAction.payload.breakerStrengthAfter;
  }
  if (typeof legalAction.payload?.v1922RunnerHardwareAbility === "string") {
    context.v1922RunnerHardwareAbility =
      legalAction.payload.v1922RunnerHardwareAbility;
    if (typeof legalAction.payload.hostedProgramCount === "number")
      context.hostedProgramCount = legalAction.payload.hostedProgramCount;
    if (typeof legalAction.payload.hostedProgramCountAfter === "number")
      context.hostedProgramCountAfter =
        legalAction.payload.hostedProgramCountAfter;
    if (typeof legalAction.payload.returnedCardDefinitionId === "number")
      context.returnedCardDefinitionId =
        legalAction.payload.returnedCardDefinitionId;
    if (legalAction.payload.returnedToGrip === true)
      context.returnedToGrip = true;
  }
  if (typeof legalAction.payload?.v1919RunnerProgramAbility === "string") {
    context.v1919RunnerProgramAbility =
      legalAction.payload.v1919RunnerProgramAbility;
    if (typeof legalAction.payload.sourceDefinitionId === "number")
      context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    if (typeof legalAction.payload.serverLabel === "string")
      context.serverLabel = legalAction.payload.serverLabel;
    if (typeof legalAction.payload.addedCounterAmount === "number")
      context.addedCounterAmount = legalAction.payload.addedCounterAmount;
    if (typeof legalAction.payload.remainingCounters === "number")
      context.remainingCounters = legalAction.payload.remainingCounters;
    if (typeof legalAction.payload.serverAgendaCostCounters === "number")
      context.serverAgendaCostCounters =
        legalAction.payload.serverAgendaCostCounters;
  }
  if (typeof legalAction.payload?.v1919RunnerEventAbility === "string") {
    context.v1919RunnerEventAbility =
      legalAction.payload.v1919RunnerEventAbility;
    if (typeof legalAction.payload.agendaPointCostPaid === "number")
      context.agendaPointCostPaid = legalAction.payload.agendaPointCostPaid;
    if (typeof legalAction.payload.removedTags === "number")
      context.removedTags = legalAction.payload.removedTags;
    if (typeof legalAction.payload.runnerTagsAfter === "number")
      context.runnerTagsAfter = legalAction.payload.runnerTagsAfter;
    if (typeof legalAction.payload.futureAgendaPointForfeitPaid === "number")
      context.futureAgendaPointForfeitPaid =
        legalAction.payload.futureAgendaPointForfeitPaid;
    if (typeof legalAction.payload.futureAgendaPointForfeitPending === "number")
      context.futureAgendaPointForfeitPending =
        legalAction.payload.futureAgendaPointForfeitPending;
    if (typeof legalAction.payload.spentAgendaCardId === "string")
      context.spentAgendaCardId = legalAction.payload.spentAgendaCardId;
    if (legalAction.payload.specialZone)
      context.specialZone = legalAction.payload.specialZone;
    if (legalAction.payload.specialZoneVisibility)
      context.specialZoneVisibility = legalAction.payload.specialZoneVisibility;
    if (legalAction.payload.specialZoneReason)
      context.specialZoneReason = legalAction.payload.specialZoneReason;
  }
  if (typeof legalAction.payload?.flatlineReplacementAbility === "string") {
    context.flatlineReplacementAbility =
      legalAction.payload.flatlineReplacementAbility;
    if (typeof legalAction.payload.agendaPointCostPaid === "number")
      context.agendaPointCostPaid = legalAction.payload.agendaPointCostPaid;
    if (typeof legalAction.payload.removedTags === "number")
      context.removedTags = legalAction.payload.removedTags;
    if (typeof legalAction.payload.runnerTagsAfter === "number")
      context.runnerTagsAfter = legalAction.payload.runnerTagsAfter;
    if (typeof legalAction.payload.futureAgendaPointForfeitPaid === "number")
      context.futureAgendaPointForfeitPaid =
        legalAction.payload.futureAgendaPointForfeitPaid;
    if (typeof legalAction.payload.futureAgendaPointForfeitPending === "number")
      context.futureAgendaPointForfeitPending =
        legalAction.payload.futureAgendaPointForfeitPending;
    if (legalAction.payload.specialZone)
      context.specialZone = legalAction.payload.specialZone;
    if (legalAction.payload.specialZoneVisibility)
      context.specialZoneVisibility = legalAction.payload.specialZoneVisibility;
    if (legalAction.payload.specialZoneReason)
      context.specialZoneReason = legalAction.payload.specialZoneReason;
  }
  if (typeof legalAction.payload?.v1920AssetAbility === "string") {
    context.v1920AssetAbility = legalAction.payload.v1920AssetAbility;
    if (typeof legalAction.payload.gainedActions === "number")
      context.gainedActions = legalAction.payload.gainedActions;
    if (typeof legalAction.payload.gainedCredits === "number")
      context.gainedCredits = legalAction.payload.gainedCredits;
    if (typeof legalAction.payload.corpCreditsAfter === "number")
      context.corpCreditsAfter = legalAction.payload.corpCreditsAfter;
    if (legalAction.payload.selfTrashed === true) context.selfTrashed = true;
    if (typeof legalAction.payload.runStartTaxPaid === "number")
      context.runStartTaxPaid = legalAction.payload.runStartTaxPaid;
    if (typeof legalAction.payload.runnerCreditsAfter === "number")
      context.runnerCreditsAfter = legalAction.payload.runnerCreditsAfter;
    if (typeof legalAction.payload.corpClicksAfter === "number")
      context.corpClicksAfter = legalAction.payload.corpClicksAfter;
    if (typeof legalAction.payload.agendaPointCost === "number")
      context.agendaPointCost = legalAction.payload.agendaPointCost;
    if (typeof legalAction.payload.agendaPointCostPaid === "number")
      context.agendaPointCostPaid = legalAction.payload.agendaPointCostPaid;
    if (typeof legalAction.payload.corpBonusAgendaPointsSpent === "number")
      context.corpBonusAgendaPointsSpent =
        legalAction.payload.corpBonusAgendaPointsSpent;
    if (typeof legalAction.payload.spentAgendaDefinitionIds === "string")
      context.spentAgendaDefinitionIds =
        legalAction.payload.spentAgendaDefinitionIds;
  }
  if (typeof legalAction.payload?.v1920RunnerRunLockAbility === "string") {
    context.v1920RunnerRunLockAbility =
      legalAction.payload.v1920RunnerRunLockAbility;
    if (typeof legalAction.payload.runnerRunLockCreditCost === "number")
      context.runnerRunLockCreditCost =
        legalAction.payload.runnerRunLockCreditCost;
    if (legalAction.payload.runnerRunLockCleared === true)
      context.runnerRunLockCleared = true;
    if (typeof legalAction.payload.runnerCreditsAfter === "number")
      context.runnerCreditsAfter = legalAction.payload.runnerCreditsAfter;
  }
  if (typeof legalAction.payload?.v1921AssetAbility === "string") {
    context.v1921AssetAbility = legalAction.payload.v1921AssetAbility;
    if (typeof legalAction.payload.v1921DieRoll === "number")
      context.v1921DieRoll = legalAction.payload.v1921DieRoll;
    if (typeof legalAction.payload.runnerTags === "number")
      context.runnerTags = legalAction.payload.runnerTags;
    if (typeof legalAction.payload.tagThresholdMet === "boolean")
      context.tagThresholdMet = legalAction.payload.tagThresholdMet;
    if (legalAction.payload.selfTrashed === true) context.selfTrashed = true;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (isRandomPurposeCode(legalAction.payload.randomPurpose))
      context.randomPurpose = legalAction.payload.randomPurpose;
  }
  if (typeof legalAction.payload?.v1921UpgradeAbility === "string") {
    context.v1921UpgradeAbility = legalAction.payload.v1921UpgradeAbility;
    if (typeof legalAction.payload.v1921DieRoll === "number")
      context.v1921DieRoll = legalAction.payload.v1921DieRoll;
    if (typeof legalAction.payload.sourceDefinitionId === "number")
      context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    if (typeof legalAction.payload.passedIceDefinitionId === "number")
      context.passedIceDefinitionId = legalAction.payload.passedIceDefinitionId;
    if (typeof legalAction.payload.serverLabel === "string")
      context.serverLabel = legalAction.payload.serverLabel;
    if (typeof legalAction.payload.rioRunEnded === "boolean")
      context.rioRunEnded = legalAction.payload.rioRunEnded;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (isRandomPurposeCode(legalAction.payload.randomPurpose))
      context.randomPurpose = legalAction.payload.randomPurpose;
  }
  if (typeof legalAction.payload?.v1921RunnerProgramAbility === "string") {
    context.v1921RunnerProgramAbility =
      legalAction.payload.v1921RunnerProgramAbility;
    if (typeof legalAction.payload.v1921DieRoll === "number")
      context.v1921DieRoll = legalAction.payload.v1921DieRoll;
    if (typeof legalAction.payload.runStartRandomStrength === "number")
      context.runStartRandomStrength =
        legalAction.payload.runStartRandomStrength;
    if (typeof legalAction.payload.sourceDefinitionId === "number")
      context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (isRandomPurposeCode(legalAction.payload.randomPurpose))
      context.randomPurpose = legalAction.payload.randomPurpose;
  }
  if (typeof legalAction.payload?.v1922RunnerEventAbility === "string") {
    context.v1922RunnerEventAbility =
      legalAction.payload.v1922RunnerEventAbility;
    if (typeof legalAction.payload.removedTags === "number")
      context.removedTags = legalAction.payload.removedTags;
    if (typeof legalAction.payload.runnerTagsAfter === "number")
      context.runnerTagsAfter = legalAction.payload.runnerTagsAfter;
    if (typeof legalAction.payload.returnedToGrip === "boolean")
      context.returnedToGrip = legalAction.payload.returnedToGrip;
    if (typeof legalAction.payload.paidCredits === "number")
      context.paidCredits = legalAction.payload.paidCredits;
    if (typeof legalAction.payload.runnerCreditsAfter === "number")
      context.runnerCreditsAfter = legalAction.payload.runnerCreditsAfter;
    if (typeof legalAction.payload.runnerClicksAfter === "number")
      context.runnerClicksAfter = legalAction.payload.runnerClicksAfter;
    if (typeof legalAction.payload.temporaryProgramInstallCredits === "number")
      context.temporaryProgramInstallCredits =
        legalAction.payload.temporaryProgramInstallCredits;
    if (
      typeof legalAction.payload.valuPakProgramInstallActionsRemaining ===
      "number"
    ) {
      context.valuPakProgramInstallActionsRemaining =
        legalAction.payload.valuPakProgramInstallActionsRemaining;
    }
    if (
      typeof legalAction.payload.valuPakTemporaryProgramInstallCreditsAfter ===
      "number"
    ) {
      context.valuPakTemporaryProgramInstallCreditsAfter =
        legalAction.payload.valuPakTemporaryProgramInstallCreditsAfter;
    }
    if (legalAction.payload.valuPakInstallActionSpent === true)
      context.valuPakInstallActionSpent = true;
    if (legalAction.payload.valuPakSequenceStopped === true)
      context.valuPakSequenceStopped = true;
    if (
      typeof legalAction.payload.valuPakRestrictedActionsForgone === "number"
    ) {
      context.valuPakRestrictedActionsForgone =
        legalAction.payload.valuPakRestrictedActionsForgone;
    }
    if (
      typeof legalAction.payload.valuPakTemporaryCreditsReturned === "number"
    ) {
      context.valuPakTemporaryCreditsReturned =
        legalAction.payload.valuPakTemporaryCreditsReturned;
    }
    if (typeof legalAction.payload.derezzedCount === "number")
      context.derezzedCount = legalAction.payload.derezzedCount;
    if (typeof legalAction.payload.targetCardDefinitionId === "number")
      context.targetCardDefinitionId =
        legalAction.payload.targetCardDefinitionId;
    if (typeof legalAction.payload.targetServerLabel === "string")
      context.targetServerLabel = legalAction.payload.targetServerLabel;
    if (typeof legalAction.payload.targetIcePositionLabel === "string")
      context.targetIcePositionLabel =
        legalAction.payload.targetIcePositionLabel;
    if (typeof legalAction.payload.targetVisibility === "string")
      context.targetVisibility = legalAction.payload.targetVisibility;
    if (typeof legalAction.payload.corpDecision === "string")
      context.corpDecision = legalAction.payload.corpDecision;
    if (typeof legalAction.payload.rezCostPaid === "number")
      context.rezCostPaid = legalAction.payload.rezCostPaid;
    if (typeof legalAction.payload.trashedCount === "number")
      context.trashedCount = legalAction.payload.trashedCount;
    if (typeof legalAction.payload.retainedCount === "number")
      context.retainedCount = legalAction.payload.retainedCount;
    if (typeof legalAction.payload.discardedCount === "number")
      context.discardedCount = legalAction.payload.discardedCount;
    if (typeof legalAction.payload.corpCreditsAfter === "number")
      context.corpCreditsAfter = legalAction.payload.corpCreditsAfter;
  }
  if (typeof legalAction.payload?.v1922CorpOperationAbility === "string") {
    context.v1922CorpOperationAbility =
      legalAction.payload.v1922CorpOperationAbility;
    if (typeof legalAction.payload.gainedActions === "number")
      context.gainedActions = legalAction.payload.gainedActions;
    if (
      typeof legalAction.payload.edgerunnerTempsInstallActionsRemaining ===
      "number"
    ) {
      context.edgerunnerTempsInstallActionsRemaining =
        legalAction.payload.edgerunnerTempsInstallActionsRemaining;
    }
    if (typeof legalAction.payload.corpClicksAfter === "number")
      context.corpClicksAfter = legalAction.payload.corpClicksAfter;
  }
  if (typeof legalAction.payload?.v1922CorpIceAbility === "string") {
    context.v1922CorpIceAbility = legalAction.payload.v1922CorpIceAbility;
    if (typeof legalAction.payload.breakSubroutineBaseCost === "number")
      context.breakSubroutineBaseCost =
        legalAction.payload.breakSubroutineBaseCost;
    if (typeof legalAction.payload.breakSubroutineAdditionalCost === "number")
      context.breakSubroutineAdditionalCost =
        legalAction.payload.breakSubroutineAdditionalCost;
    if (typeof legalAction.payload.breakSubroutineTotalCost === "number")
      context.breakSubroutineTotalCost =
        legalAction.payload.breakSubroutineTotalCost;
    if (typeof legalAction.payload.sourceDefinitionId === "number")
      context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    if (typeof legalAction.payload.runLockActionsAdded === "number")
      context.runLockActionsAdded = legalAction.payload.runLockActionsAdded;
    if (typeof legalAction.payload.runLockActionsPending === "number")
      context.runLockActionsPending = legalAction.payload.runLockActionsPending;
    if (typeof legalAction.payload.jackOutAdditionalCost === "number")
      context.jackOutAdditionalCost = legalAction.payload.jackOutAdditionalCost;
    if (
      typeof legalAction.payload.viral15ProgramTrashChoiceOpened === "boolean"
    )
      context.viral15ProgramTrashChoiceOpened =
        legalAction.payload.viral15ProgramTrashChoiceOpened;
    if (
      typeof legalAction.payload.viral15ProgramTrashCandidateCount === "number"
    )
      context.viral15ProgramTrashCandidateCount =
        legalAction.payload.viral15ProgramTrashCandidateCount;
    if (typeof legalAction.payload.trashedCount === "number")
      context.trashedCount = legalAction.payload.trashedCount;
    if (typeof legalAction.payload.runnerCreditsAfter === "number")
      context.runnerCreditsAfter = legalAction.payload.runnerCreditsAfter;
  }
  if (legalAction.payload?.v1922EdgerunnerTempsInstallAction === true) {
    context.v1922CorpOperationAbility = "install_action_bundle";
    if (legalAction.payload.edgerunnerTempsInstallActionSpent === true)
      context.edgerunnerTempsInstallActionSpent = true;
    if (
      typeof legalAction.payload.edgerunnerTempsInstallActionsRemaining ===
      "number"
    ) {
      context.edgerunnerTempsInstallActionsRemaining =
        legalAction.payload.edgerunnerTempsInstallActionsRemaining;
    }
  }
  if (typeof legalAction.payload?.v1921RunnerEventAbility === "string") {
    context.v1921RunnerEventAbility =
      legalAction.payload.v1921RunnerEventAbility;
    if (typeof legalAction.payload.v1921DieRoll === "number")
      context.v1921DieRoll = legalAction.payload.v1921DieRoll;
    if (
      Array.isArray(legalAction.payload.randomDiceLoopRolls) ||
      typeof legalAction.payload.randomDiceLoopRolls === "string"
    )
      context.randomDiceLoopRolls = legalAction.payload.randomDiceLoopRolls;
    for (const key of [
      "randomDiceSplitGainedCredits",
      "randomDiceSplitSetAsideDice",
      "randomDiceLoopRolledDice",
      "randomDiceLoopQueuedBeforeRolls",
      "randomDiceLoopQueuedAfterRolls",
      "randomDiceLoopRemainingDice",
      "gainedCredits",
      "runnerCreditsAfter",
    ]) {
      const value = legalAction.payload[key];
      if (typeof value === "number") context[key] = value;
    }
    if (typeof legalAction.payload.randomDiceSplitChoiceOpened === "boolean")
      context.randomDiceSplitChoiceOpened =
        legalAction.payload.randomDiceSplitChoiceOpened;
    if (typeof legalAction.payload.randomDiceLoopComplete === "boolean")
      context.randomDiceLoopComplete =
        legalAction.payload.randomDiceLoopComplete;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (isRandomPurposeCode(legalAction.payload.randomPurpose))
      context.randomPurpose = legalAction.payload.randomPurpose;
  }
  if (typeof legalAction.payload?.v1921RunnerResourceAbility === "string") {
    context.v1921RunnerResourceAbility =
      legalAction.payload.v1921RunnerResourceAbility;
    if (typeof legalAction.payload.v1921DieRoll === "number")
      context.v1921DieRoll = legalAction.payload.v1921DieRoll;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (isRandomPurposeCode(legalAction.payload.randomPurpose))
      context.randomPurpose = legalAction.payload.randomPurpose;
  }
}
