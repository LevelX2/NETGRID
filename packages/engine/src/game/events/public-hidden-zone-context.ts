import type { LegalAction } from "@netgrid/shared";

export function applyPublicHiddenZoneContext(
  legalAction: LegalAction,
  context: Record<string, unknown>,
): void {
  if (legalAction.payload?.hiddenZoneBarrier === true) {
    context.hiddenZoneBarrier = true;
    context.hiddenZoneAction = legalAction.payload.hiddenZoneAction;
    if (typeof legalAction.payload.sourceTitle === "string")
      context.sourceTitle = legalAction.payload.sourceTitle;
    if (
      (legalAction.payload.hiddenZoneAction ===
        "schematics_search_engine_expose_installed_cards_review" ||
        legalAction.payload.hiddenZoneAction ===
          "schematics_search_engine_expose_installed_cards_finish") &&
      legalAction.payload.effectSide === "runner"
    ) {
      context.effectSide = "runner";
    }
    if (
      (legalAction.payload.hiddenZoneAction ===
        "schematics_search_engine_expose_installed_cards_review" ||
        legalAction.payload.hiddenZoneAction ===
          "schematics_search_engine_expose_installed_cards_finish") &&
      typeof legalAction.payload.breachId === "string"
    ) {
      context.breachId = legalAction.payload.breachId;
    }
    if (typeof legalAction.payload.searchedZone === "string")
      context.searchedZone = legalAction.payload.searchedZone;
    if (typeof legalAction.payload.selectedCount === "number")
      context.selectedCount = legalAction.payload.selectedCount;
    if (typeof legalAction.payload.searchedCount === "number")
      context.searchedCount = legalAction.payload.searchedCount;
    if (typeof legalAction.payload.movedCardCount === "number")
      context.movedCardCount = legalAction.payload.movedCardCount;
    if (typeof legalAction.payload.movedToGripCount === "number")
      context.movedToGripCount = legalAction.payload.movedToGripCount;
    if (typeof legalAction.payload.arrangedCount === "number")
      context.arrangedCount = legalAction.payload.arrangedCount;
    if (legalAction.payload.reorderNoOp === true) context.reorderNoOp = true;
    if (typeof legalAction.payload.trashedCount === "number")
      context.trashedCount = legalAction.payload.trashedCount;
    for (const key of [
      "publicRevealKind",
      "publicRevealDefinitionIds",
      "publicRevealTitles",
      "revealedAgendaDefinitionIds",
    ]) {
      const value = legalAction.payload[key];
      if (typeof value === "string") context[key] = value;
    }
    if (typeof legalAction.payload.storedAgendaDefinitionId === "number")
      context.storedAgendaDefinitionId =
        legalAction.payload.storedAgendaDefinitionId;
    for (const key of ["revealedNonAgendaCount", "shuffledIntoRdCount"]) {
      const value = legalAction.payload[key];
      if (typeof value === "number") context[key] = value;
    }
    if (typeof legalAction.payload.agendaStoredInHq === "boolean")
      context.agendaStoredInHq = legalAction.payload.agendaStoredInHq;
    if (typeof legalAction.payload.stackShuffled === "boolean")
      context.stackShuffled = legalAction.payload.stackShuffled;
    if (typeof legalAction.payload.shufflePerformed === "boolean")
      context.shufflePerformed = legalAction.payload.shufflePerformed;
    if (typeof legalAction.payload.shuffled === "boolean")
      context.shuffled = legalAction.payload.shuffled;
    if (typeof legalAction.payload.requiredConnectionTrashCount === "number")
      context.requiredConnectionTrashCount =
        legalAction.payload.requiredConnectionTrashCount;
    if (typeof legalAction.payload.eligibleConnectionCount === "number")
      context.eligibleConnectionCount =
        legalAction.payload.eligibleConnectionCount;
    if (typeof legalAction.payload.ambushPaymentChoiceOpened === "boolean")
      context.ambushPaymentChoiceOpened =
        legalAction.payload.ambushPaymentChoiceOpened;
    if (typeof legalAction.payload.ambushPaymentAmount === "number")
      context.ambushPaymentAmount = legalAction.payload.ambushPaymentAmount;
    if (typeof legalAction.payload.installedConnectionTrashCount === "number")
      context.installedConnectionTrashCount =
        legalAction.payload.installedConnectionTrashCount;
    if (
      typeof legalAction.payload.installedConnectionTrashChoiceOpened ===
      "boolean"
    )
      context.installedConnectionTrashChoiceOpened =
        legalAction.payload.installedConnectionTrashChoiceOpened;
    if (
      typeof legalAction.payload.installedConnectionTrashChoiceResolved ===
      "boolean"
    )
      context.installedConnectionTrashChoiceResolved =
        legalAction.payload.installedConnectionTrashChoiceResolved;
    if (typeof legalAction.payload.trashedCardDefinitionIds === "string")
      context.trashedCardDefinitionIds =
        legalAction.payload.trashedCardDefinitionIds;
    if (typeof legalAction.payload.publicTrashedCardDefinitionIds === "string")
      context.publicTrashedCardDefinitionIds =
        legalAction.payload.publicTrashedCardDefinitionIds;
    if (typeof legalAction.payload.returnedProgramDefinitionIds === "string")
      context.returnedProgramDefinitionIds =
        legalAction.payload.returnedProgramDefinitionIds;
    if (typeof legalAction.payload.returnedProgramCount === "number")
      context.returnedProgramCount = legalAction.payload.returnedProgramCount;
    if (typeof legalAction.payload.maxReturnedProgramCount === "number")
      context.maxReturnedProgramCount =
        legalAction.payload.maxReturnedProgramCount;
    if (typeof legalAction.payload.eligibleProgramCount === "number")
      context.eligibleProgramCount = legalAction.payload.eligibleProgramCount;
    if (typeof legalAction.payload.daemonHostedTrashCount === "number")
      context.daemonHostedTrashCount =
        legalAction.payload.daemonHostedTrashCount;
    if (typeof legalAction.payload.trashedInstalledCount === "number")
      context.trashedInstalledCount = legalAction.payload.trashedInstalledCount;
    if (typeof legalAction.payload.trashedCorpInstalledCardCount === "number")
      context.trashedCorpInstalledCardCount =
        legalAction.payload.trashedCorpInstalledCardCount;
    if (
      typeof legalAction.payload.trashedInstalledRunnerHardwareCount ===
      "number"
    )
      context.trashedInstalledRunnerHardwareCount =
        legalAction.payload.trashedInstalledRunnerHardwareCount;
    if (
      typeof legalAction.payload.trashedInstalledRunnerProgramCount === "number"
    )
      context.trashedInstalledRunnerProgramCount =
        legalAction.payload.trashedInstalledRunnerProgramCount;
    if (typeof legalAction.payload.netDamageAmount === "number")
      context.netDamageAmount = legalAction.payload.netDamageAmount;
    if (typeof legalAction.payload.scoredFromServerId === "string")
      context.scoredFromServerId = legalAction.payload.scoredFromServerId;
    if (typeof legalAction.payload.installedCount === "number")
      context.installedCount = legalAction.payload.installedCount;
    if (typeof legalAction.payload.installedIceCount === "number")
      context.installedIceCount = legalAction.payload.installedIceCount;
    if (typeof legalAction.payload.installedRootCount === "number")
      context.installedRootCount = legalAction.payload.installedRootCount;
    if (typeof legalAction.payload.swappedIceCount === "number")
      context.swappedIceCount = legalAction.payload.swappedIceCount;
    if (typeof legalAction.payload.iceIndex === "number")
      context.iceIndex = legalAction.payload.iceIndex;
    if (typeof legalAction.payload.choiceVisibility === "string")
      context.choiceVisibility = legalAction.payload.choiceVisibility;
    if (typeof legalAction.payload.candidateCount === "number")
      context.candidateCount = legalAction.payload.candidateCount;
    if (typeof legalAction.payload.temporaryCreditsProvided === "number")
      context.temporaryCreditsProvided =
        legalAction.payload.temporaryCreditsProvided;
    if (typeof legalAction.payload.temporaryCreditsSpent === "number")
      context.temporaryCreditsSpent = legalAction.payload.temporaryCreditsSpent;
    if (typeof legalAction.payload.temporaryCreditsReturned === "number")
      context.temporaryCreditsReturned =
        legalAction.payload.temporaryCreditsReturned;
    if (typeof legalAction.payload.corpCreditsSpent === "number")
      context.corpCreditsSpent = legalAction.payload.corpCreditsSpent;
    if (
      typeof legalAction.payload.hqToNewRemoteInstallRezRezChoiceOpened ===
      "boolean"
    )
      context.hqToNewRemoteInstallRezRezChoiceOpened =
        legalAction.payload.hqToNewRemoteInstallRezRezChoiceOpened;
    if (
      typeof legalAction.payload.hqToNewRemoteInstallRezRezCandidateCount ===
      "number"
    )
      context.hqToNewRemoteInstallRezRezCandidateCount =
        legalAction.payload.hqToNewRemoteInstallRezRezCandidateCount;
    if (
      typeof legalAction.payload.scoredAgendaFreeRezChoiceOpened === "boolean"
    )
      context.scoredAgendaFreeRezChoiceOpened =
        legalAction.payload.scoredAgendaFreeRezChoiceOpened;
    if (
      typeof legalAction.payload.scoredAgendaFreeRezCandidateCount === "number"
    )
      context.scoredAgendaFreeRezCandidateCount =
        legalAction.payload.scoredAgendaFreeRezCandidateCount;
    if (typeof legalAction.payload.scoredAgendaFreeRezFreeRez === "boolean")
      context.scoredAgendaFreeRezFreeRez =
        legalAction.payload.scoredAgendaFreeRezFreeRez;
    if (typeof legalAction.payload.scoredAgendaFreeRezDeclined === "boolean")
      context.scoredAgendaFreeRezDeclined =
        legalAction.payload.scoredAgendaFreeRezDeclined;
    if (typeof legalAction.payload.scoredAgendaFreeRezTarget === "string")
      context.scoredAgendaFreeRezTarget =
        legalAction.payload.scoredAgendaFreeRezTarget;
    if (
      typeof legalAction.payload.scoredAgendaFreeRezTargetDefinitionId ===
      "number"
    )
      context.scoredAgendaFreeRezTargetDefinitionId =
        legalAction.payload.scoredAgendaFreeRezTargetDefinitionId;
    if (typeof legalAction.payload.temporaryCreditsRemaining === "number")
      context.temporaryCreditsRemaining =
        legalAction.payload.temporaryCreditsRemaining;
    if (typeof legalAction.payload.corpTemporaryRunCreditsReturned === "number")
      context.corpTemporaryRunCreditsReturned =
        legalAction.payload.corpTemporaryRunCreditsReturned;
    if (
      typeof legalAction.payload.corpTemporaryRunCreditsRemaining === "number"
    )
      context.corpTemporaryRunCreditsRemaining =
        legalAction.payload.corpTemporaryRunCreditsRemaining;
    if (typeof legalAction.payload.rezzedCount === "number")
      context.rezzedCount = legalAction.payload.rezzedCount;
    if (typeof legalAction.payload.rezzedIceCount === "number")
      context.rezzedIceCount = legalAction.payload.rezzedIceCount;
    if (typeof legalAction.payload.rezzedRootCount === "number")
      context.rezzedRootCount = legalAction.payload.rezzedRootCount;
    if (typeof legalAction.payload.corpCreditsAfter === "number")
      context.corpCreditsAfter = legalAction.payload.corpCreditsAfter;
    if (legalAction.payload.rezSequenceDeferred === true)
      context.rezSequenceDeferred = true;
    if (typeof legalAction.payload.gainedCredits === "number")
      context.gainedCredits = legalAction.payload.gainedCredits;
    if (typeof legalAction.payload.runnerCreditsAfter === "number")
      context.runnerCreditsAfter = legalAction.payload.runnerCreditsAfter;
    if (typeof legalAction.payload.accessReplacement === "string")
      context.accessReplacement = legalAction.payload.accessReplacement;
    if (typeof legalAction.payload.accessSkipped === "boolean")
      context.accessSkipped = legalAction.payload.accessSkipped;
    if (typeof legalAction.payload.creditLoss === "number")
      context.creditLoss = legalAction.payload.creditLoss;
    if (typeof legalAction.payload.runnerPaidAmount === "number")
      context.runnerPaidAmount = legalAction.payload.runnerPaidAmount;
    if (typeof legalAction.payload.corpLostCredits === "number")
      context.corpLostCredits = legalAction.payload.corpLostCredits;
    if (typeof legalAction.payload.privateLookZone === "string")
      context.privateLookZone = legalAction.payload.privateLookZone;
    if (typeof legalAction.payload.privateLookCount === "number")
      context.privateLookCount = legalAction.payload.privateLookCount;
    if (typeof legalAction.payload.movedCount === "number")
      context.movedCount = legalAction.payload.movedCount;
    if (typeof legalAction.payload.shuffledFaceUpArchivesCount === "number")
      context.shuffledFaceUpArchivesCount =
        legalAction.payload.shuffledFaceUpArchivesCount;
    if (typeof legalAction.payload.ambushDefinitionId === "number")
      context.ambushDefinitionId = legalAction.payload.ambushDefinitionId;
    if (typeof legalAction.payload.advancementCounterCount === "number")
      context.advancementCounterCount =
        legalAction.payload.advancementCounterCount;
    if (typeof legalAction.payload.runnerTagsAfter === "number")
      context.runnerTagsAfter = legalAction.payload.runnerTagsAfter;
    if (typeof legalAction.payload.trashedCardDefinitionId === "number")
      context.trashedCardDefinitionId =
        legalAction.payload.trashedCardDefinitionId;
    if (typeof legalAction.payload.targetCardDefinitionId === "number")
      context.targetCardDefinitionId =
        legalAction.payload.targetCardDefinitionId;
    if (typeof legalAction.payload.removedCounterAmount === "number")
      context.removedCounterAmount = legalAction.payload.removedCounterAmount;
    if (typeof legalAction.payload.remainingCounters === "number")
      context.remainingCounters = legalAction.payload.remainingCounters;
    if (typeof legalAction.payload.searchReveal === "string")
      context.searchReveal = legalAction.payload.searchReveal;
    if (typeof legalAction.payload.searchDestination === "string")
      context.searchDestination = legalAction.payload.searchDestination;
    if (typeof legalAction.payload.searchShuffleAfter === "boolean")
      context.searchShuffleAfter = legalAction.payload.searchShuffleAfter;
    if (typeof legalAction.payload.temporaryInstall === "boolean")
      context.temporaryInstall = legalAction.payload.temporaryInstall;
    if (typeof legalAction.payload.installedProgramDefinitionId === "number")
      context.installedProgramDefinitionId =
        legalAction.payload.installedProgramDefinitionId;
    if (typeof legalAction.payload.installedCardDefinitionId === "number")
      context.installedCardDefinitionId =
        legalAction.payload.installedCardDefinitionId;
    if (typeof legalAction.payload.publicRevealDefinitionId === "number")
      context.publicRevealDefinitionId =
        legalAction.payload.publicRevealDefinitionId;
    if (typeof legalAction.payload.returnedProgramDefinitionId === "number")
      context.returnedProgramDefinitionId =
        legalAction.payload.returnedProgramDefinitionId;
    if (typeof legalAction.payload.serverId === "string")
      context.serverId = legalAction.payload.serverId;
    if (typeof legalAction.payload.shufflePerformed === "boolean")
      context.shufflePerformed = legalAction.payload.shufflePerformed;
    if (typeof legalAction.payload.testSpinRunStarted === "boolean")
      context.testSpinRunStarted = legalAction.payload.testSpinRunStarted;
    if (typeof legalAction.payload.returnedToStack === "boolean")
      context.returnedToStack = legalAction.payload.returnedToStack;
    if (typeof legalAction.payload.penaltyAmount === "number")
      context.penaltyAmount = legalAction.payload.penaltyAmount;
    if (typeof legalAction.payload.penaltyCreditsPaid === "number")
      context.penaltyCreditsPaid = legalAction.payload.penaltyCreditsPaid;
    for (const key of [
      "sourceTrashed",
      "shuffled",
      "installed",
      "installDeferredForMemory",
      "muTrashChoiceOpened",
      "muTrashChoiceResolved",
    ]) {
      const value = legalAction.payload[key];
      if (typeof value === "boolean") context[key] = value;
    }
    if (typeof legalAction.payload.installBlockedReason === "string")
      context.installBlockedReason = legalAction.payload.installBlockedReason;
    for (const key of [
      "installCostPaid",
      "runnerInstallNormalCreditsPaid",
      "runnerInstallHostedCreditsPaid",
      "runnerInstallRecurringCreditsPaid",
      "runnerInstallTemporaryCreditsPaid",
      "runnerMemoryUsedAfter",
      "muShortfall",
      "trashedForMemoryCount",
    ]) {
      const value = legalAction.payload[key];
      if (typeof value === "number") context[key] = value;
    }
    if (typeof legalAction.payload.trashedForMemoryDefinitionIds === "string")
      context.trashedForMemoryDefinitionIds =
        legalAction.payload.trashedForMemoryDefinitionIds;
    if (
      typeof legalAction.payload.runnerInstallPaymentSourceDefinitionIds ===
      "string"
    )
      context.runnerInstallPaymentSourceDefinitionIds =
        legalAction.payload.runnerInstallPaymentSourceDefinitionIds;
    if (typeof legalAction.payload.trashedCardDefinitionIds === "string")
      context.trashedCardDefinitionIds =
        legalAction.payload.trashedCardDefinitionIds;
    if (typeof legalAction.payload.returnedCount === "number")
      context.returnedCount = legalAction.payload.returnedCount;
    if (typeof legalAction.payload.returnedCardDefinitionIds === "string")
      context.returnedCardDefinitionIds =
        legalAction.payload.returnedCardDefinitionIds;
    if (typeof legalAction.payload.archivesRevealCount === "number")
      context.archivesRevealCount = legalAction.payload.archivesRevealCount;
    if (typeof legalAction.payload.archivesRevealDefinitionIds === "string")
      context.archivesRevealDefinitionIds =
        legalAction.payload.archivesRevealDefinitionIds;
    if (typeof legalAction.payload.archivesRevealTitles === "string")
      context.archivesRevealTitles = legalAction.payload.archivesRevealTitles;
    if (
      typeof legalAction.payload.archivesRevealAgendaDefinitionIds === "string"
    )
      context.archivesRevealAgendaDefinitionIds =
        legalAction.payload.archivesRevealAgendaDefinitionIds;
    if (typeof legalAction.payload.revealedCount === "number")
      context.revealedCount = legalAction.payload.revealedCount;
    if (typeof legalAction.payload.revealedAgendaDefinitionIds === "string")
      context.revealedAgendaDefinitionIds =
        legalAction.payload.revealedAgendaDefinitionIds;
    if (typeof legalAction.payload.publicRevealTitles === "string")
      context.publicRevealTitles = legalAction.payload.publicRevealTitles;
    if (typeof legalAction.payload.sourceTitle === "string")
      context.sourceTitle = legalAction.payload.sourceTitle;
    if (typeof legalAction.payload.hqCardCount === "number")
      context.hqCardCount = legalAction.payload.hqCardCount;
    if (typeof legalAction.payload.drawnCount === "number")
      context.drawnCount = legalAction.payload.drawnCount;
    if (typeof legalAction.payload.shownCount === "number")
      context.shownCount = legalAction.payload.shownCount;
    if (typeof legalAction.payload.shuffledIntoRndCount === "number")
      context.shuffledIntoRndCount = legalAction.payload.shuffledIntoRndCount;
    if (typeof legalAction.payload.combinedAgendaPoints === "number")
      context.combinedAgendaPoints = legalAction.payload.combinedAgendaPoints;
    if (typeof legalAction.payload.corpDrawnCount === "number")
      context.corpDrawnCount = legalAction.payload.corpDrawnCount;
    if (typeof legalAction.payload.randomDrawRecordPurpose === "string")
      context.randomDrawRecordPurpose =
        legalAction.payload.randomDrawRecordPurpose;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (legalAction.payload.oncePerRunConsumed === true)
      context.oncePerRunConsumed = true;
    if (typeof legalAction.payload.publicRevealDefinitionIds === "string")
      context.publicRevealDefinitionIds =
        legalAction.payload.publicRevealDefinitionIds;
    if (typeof legalAction.payload.exposedCardInstanceIds === "string")
      context.exposedCardInstanceIds =
        legalAction.payload.exposedCardInstanceIds;
    if (typeof legalAction.payload.shownCardDefinitionIds === "string")
      context.shownCardDefinitionIds =
        legalAction.payload.shownCardDefinitionIds;
    if (typeof legalAction.payload.exposedServerIds === "string")
      context.exposedServerIds = legalAction.payload.exposedServerIds;
    if (typeof legalAction.payload.exposedPositionKeys === "string")
      context.exposedPositionKeys = legalAction.payload.exposedPositionKeys;
    if (typeof legalAction.payload.exposedServerLabels === "string")
      context.exposedServerLabels = legalAction.payload.exposedServerLabels;
    if (typeof legalAction.payload.exposedServerLabel === "string")
      context.exposedServerLabel = legalAction.payload.exposedServerLabel;
    if (
      legalAction.payload.exposedArea === "root" ||
      legalAction.payload.exposedArea === "ice"
    )
      context.exposedArea = legalAction.payload.exposedArea;
    if (
      typeof legalAction.payload.exposedIndex === "number" &&
      Number.isInteger(legalAction.payload.exposedIndex) &&
      legalAction.payload.exposedIndex >= 0
    )
      context.exposedIndex = legalAction.payload.exposedIndex;
    if (typeof legalAction.payload.targetCardDefinitionIds === "string")
      context.targetCardDefinitionIds =
        legalAction.payload.targetCardDefinitionIds;
    context.redactedKind = "hidden_zone";
  }
}
