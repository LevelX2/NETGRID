import { isTraceId, type GameState, type LegalAction } from "@netgrid/shared";
import { RUNNER_PROGRAM_TRASH_BEFORE_INSTALL_ABILITY_ID } from "../../mechanics/public-payload-schema";

export function applyPublicChoiceContext(
  state: GameState,
  legalAction: LegalAction,
  context: Record<string, unknown>,
): void {
  if (legalAction.type === "resolve_choice") {
    context.choiceKind = legalAction.payload?.choiceKind;
    if (legalAction.payload?.runnerProgramTrashBeforeInstall === true) {
      context.abilityId = RUNNER_PROGRAM_TRASH_BEFORE_INSTALL_ABILITY_ID;
      context.effectKind = "install_card";
      const installedProgramDefinitionId =
        typeof legalAction.payload.sourceDefinitionId === "number"
          ? legalAction.payload.sourceDefinitionId
          : undefined;
      if (installedProgramDefinitionId) {
        context.sourceDefinitionId = installedProgramDefinitionId;
        context.installedProgramDefinitionId = installedProgramDefinitionId;
      }
      for (const key of [
        "installed",
        "installCancelled",
        "installBlockedReason",
        "trashedCardDefinitionIds",
        "trashedCount",
        "memoryUsedAfter",
        "memoryLimitAfter",
      ]) {
        const value = legalAction.payload[key];
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        )
          context[key] = value;
      }
    }
    if (legalAction.payload?.discardResolved === true) {
      context.discardResolved = true;
      context.discardSide = legalAction.payload.discardSide;
      context.discardCount = legalAction.payload.discardCount;
      context.discardZone = legalAction.payload.discardZone;
      context.redactedKind = "discard";
      if (legalAction.payload.randomizedByCockroach === true)
        context.randomizedByCockroach = true;
      if (typeof legalAction.payload.cockroachCounterTotal === "number")
        context.cockroachCounterTotal =
          legalAction.payload.cockroachCounterTotal;
    }
    if (legalAction.payload?.setupStep === "mulligan") {
      context.setupStep = "mulligan";
      context.setupSide = legalAction.payload.setupSide;
      context.setupDecision = legalAction.payload.setupDecision;
      context.setupStatus = state.setup?.status ?? "complete";
    }
    if (legalAction.payload?.choiceVisibility === "public")
      context.choiceId = legalAction.payload?.choiceId;
    else context.redactedKind = "choice";
    const traceRulesProfile =
      state.trace?.traceRulesProfile ??
      state.traceRulesProfile ??
      "modern_open";
    const blindTrace = traceRulesProfile !== "modern_open";
    const traceBidsRevealed =
      state.trace?.bidsRevealed === true ||
      legalAction.payload?.traceBidsRevealed === true ||
      typeof legalAction.payload?.runnerStrength === "number" ||
      typeof legalAction.payload?.traceSuccessful === "boolean";
    const hiddenTraceCommit =
      blindTrace &&
      isTraceId(legalAction.payload?.traceId) &&
      legalAction.payload?.traceStarted !== true &&
      (legalAction.payload?.traceStep === "corp_bid" ||
        legalAction.payload?.traceStep === "runner_bid") &&
      legalAction.payload?.corpTracePaymentChoiceOpened !== true &&
      legalAction.payload?.traceLinkPaymentChoiceOpened !== true &&
      !traceBidsRevealed;
    if (isTraceId(legalAction.payload?.traceId)) {
      context.traceRulesProfile = traceRulesProfile;
      context.traceBidsRevealed = traceBidsRevealed;
      if (hiddenTraceCommit) {
        context.traceBidCommittedSide = legalAction.side;
      }
    }
    const hiddenTracePayloadFields = new Set([
      "corpBid",
      "traceValue",
      "runnerBid",
      "runnerStrength",
      "traceBaseLinkSourceDefinitionId",
      "traceBaseLinkCostPaid",
      "baseLinkValue",
      "traceLinkPaymentSourceDefinitionId",
      "traceLinkPaymentAmount",
      "traceLinkCreditsSpent",
      "bonusTraceLinkCreditsSpent",
      "runnerCreditsSpent",
      "traceLinkCreditSourceDefinitionIds",
      "corpCreditBid",
      "fortTraceBitPoolSpent",
      "fortTraceBitPoolRemaining",
      "fortTraceBitPoolServerId",
      "recurringTraceCreditPoolSpent",
      "hackerTrackerCountersSpent",
      "temporaryTraceCreditsSpent",
      "temporaryTraceCreditsRemaining",
      "temporaryTraceCreditsSourceDefinitionId",
      "traceLimitAndValueBoost",
      "effectiveTraceLimit",
      "corpBidMax",
    ]);
    for (const key of [
      "eventModificationWindowId",
      "eventModificationKind",
      "eventModificationDecision",
      "eventModificationOutcome",
      "imminentEventId",
      "imminentEventType",
      "affectedSide",
      "agendaPointCost",
      "agendaPointCostPaid",
      "corpBonusAgendaPointsSpent",
      "forfeitedAgendaDefinitionIds",
      "spentAgendaDefinitionIds",
      "specialZone",
      "specialZoneVisibility",
      "specialZoneReason",
      "sourceDefinitionId",
      "originalAmount",
      "preventedAmount",
      "preventedTags",
      "finalAmount",
      "damagePreventionBypassPaid",
      "damagePreventionBypassCostPerDamage",
      "preservedCounterAmount",
      "remainingVirusCounters",
      "preservedCardDefinitionIds",
      "secretSpendRevealed",
      "secretSpendCorp",
      "secretSpendRunner",
      "secretSpendEndRun",
      "corpCreditsAfter",
      "runnerCreditsAfter",
      "passIceTrashProgramPrompt",
      "programTrashCount",
      "ambushDefinitionId",
      "accessEffectSourceDefinitionId",
      "accessedFromZone",
      "ambushPaymentAmount",
      "ambushPaidCost",
      "ambushPaymentDeclined",
      "hiddenResourcePostMeatDamageDecision",
      "discardedHqCount",
      "corpHqAfter",
      "randomCounterAfter",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
    if (legalAction.payload?.hiddenRunnerResourceRevealed === true) {
      context.hiddenRunnerResourceRevealed = true;
      if (typeof legalAction.payload.hiddenResourceSlotId === "string")
        context.hiddenResourceSlotId = legalAction.payload.hiddenResourceSlotId;
    }
    for (const key of [
      "replacementWindowId",
      "replacementDecision",
      "replacementOutcome",
      "originalEventId",
      "originalEventType",
      "damageType",
      "replacementEventId",
      "replacementEventType",
      "tagsAdded",
      "preventedAmount",
      "v1919RunnerEventAbility",
      "flatlineReplacementAbility",
      "coreDamageRemoved",
      "gripCardsLost",
      "drawnCards",
      "gainedCredits",
      "removedTags",
      "runnerMaxHandSizeAfter",
      "runnerActionsPerTurnOverride",
      "permanentMeatDamagePrevention",
      "agendaPointCostPaid",
      "futureActionDebtAdded",
      "futureActionDebtPending",
      "futureAgendaPointForfeitAdded",
      "futureAgendaPointForfeitPaid",
      "futureAgendaPointForfeitPending",
      "spentAgendaCardId",
      "sourceDefinitionId",
      "cardDefinitionId",
      "scoredAgendaStartDrawDecision",
      "rezInterruptSourceCardId",
      "rezzedCardDefinitionId",
      "serverLabel",
      "rezInterruptUsed",
      "successfulRunWithoutAccess",
    ]) {
      const value = legalAction.payload?.[key];
      if (
        value !== undefined &&
        !(hiddenTraceCommit && hiddenTracePayloadFields.has(key))
      )
        context[key] = value;
    }
    for (const key of [
      "traceId",
      "traceSourceRunId",
      "traceSourceCardInstanceId",
      "traceSourceSubroutineIndex",
      "traceStep",
      "traceLimit",
      "effectiveTraceLimit",
      "corpBidMax",
      "rabbitTraceLimitReduction",
      "sourceDefinitionId",
      "corpBid",
      "traceValue",
      "runnerLink",
      "baseLinkUsed",
      "traceBaseLinkChoiceOpened",
      "traceBaseLinkSourceDefinitionId",
      "traceBaseLinkCostPaid",
      "baseLinkValue",
      "runnerBid",
      "traceLinkPaymentChoiceOpened",
      "traceLinkPaymentSourceDefinitionId",
      "traceLinkPaymentAmount",
      "traceLinkCreditsSpent",
      "bonusTraceLinkCreditsSpent",
      "runnerCreditsSpent",
      "traceLinkCreditSourceDefinitionIds",
      "runnerStrength",
      "postBidTraceLinkChoiceOpened",
      "postBidTraceLinkSourceDefinitionId",
      "postBidTraceLinkCostPaid",
      "postBidTraceLinkDelta",
      "postBidTraceLinkBonus",
      "traceEffectCanceled",
      "traceSuccessCancelCostPaid",
      "traceSuccessful",
      "tagsAdded",
      "cryingCounterCount",
      "cryingLinkReduction",
      "corpCreditBid",
      "fortTraceBitPoolSpent",
      "fortTraceBitPoolRemaining",
      "fortTraceBitPoolServerId",
      "recurringTraceCreditPoolSpent",
      "hackerTrackerCountersSpent",
      "traceLimitAndValueBoost",
      "hackerTrackerCountersAdded",
      "temporaryTraceCreditsSpent",
      "temporaryTraceCreditsRemaining",
      "temporaryTraceCreditsReturned",
      "temporaryTraceCreditsSourceDefinitionId",
      "fangRunEnded",
      "runnerRunLockCreditCost",
      "runnerRunEnded",
      "traceSuccessEffect",
      "trashedCardDefinitionId",
      "trashedCardType",
      "trashedCount",
      "damageCannotBePrevented",
      "installedResourceTrashForCreditsTriggered",
      "trashForCreditsSourceCardId",
      "trashedCardTitle",
      "creditsGained",
    ]) {
      const value = legalAction.payload?.[key];
      if (
        value !== undefined &&
        !(hiddenTraceCommit && hiddenTracePayloadFields.has(key))
      )
        context[key] = value;
    }
    if (legalAction.payload?.runnerMemoryCheckpointResolved === true) {
      context.runnerMemoryCheckpointResolved = true;
      for (const key of [
        "runnerMemoryDeficit",
        "memoryFreed",
        "trashedProgramCount",
        "runnerMemoryUsedAfter",
        "runnerMemoryLimitAfter",
      ]) {
        const value = legalAction.payload[key];
        if (typeof value === "number") context[key] = value;
      }
      if (typeof legalAction.payload.trashedCardDefinitionIds === "string") {
        context.trashedCardDefinitionIds =
          legalAction.payload.trashedCardDefinitionIds;
      }
    }
  }
}
