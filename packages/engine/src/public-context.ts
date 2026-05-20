/**
 * Builds public action context payloads from already-created engine actions.
 *
 * This module is intentionally read-only: it may inspect GameState and injected
 * host helpers, but it must not mutate state, decide action legality, or import
 * from index.ts. Hidden-info redaction and legacy payload forwarding are kept
 * here because PublicEvent and chronicle consumers depend on stable field names.
 */
import type {
  CardDefinition,
  CardInstanceId,
  CounterType,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";

export type PublicContextForActionDependencies = {
  agendaPointsForScoredCard: (
    state: GameState,
    cardId: CardInstanceId,
  ) => number;
  cardCounter: (
    state: GameState,
    cardId: CardInstanceId,
    counterType: CounterType,
  ) => number;
  cardStrengthModifier: (state: GameState, cardId: CardInstanceId) => number;
  creditCostForAction: (legalAction: LegalAction) => number;
  definitionFor: (state: GameState, id: CardInstanceId) => CardDefinition;
  pumpAmountForLegalAction: (
    state: GameState,
    legalAction: LegalAction,
  ) => number;
  runnerHqAccessBonus: (state: GameState) => number;
  v1915InstalledAccessBonus: (
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ) => number;
};

/**
 * Produces the public context attached to a GameEvent for one LegalAction.
 *
 * The LegalAction has already been generated or validated elsewhere; this
 * function only mirrors public-safe payload data into a chronicle/UI-friendly
 * shape. Sections that copy legacy payload fields are compatibility bridges,
 * not new gameplay authority.
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
    if (breakerId && state.cardInstances[breakerId]) {
      const definition = deps.definitionFor(state, breakerId);
      if (typeof definition.strength === "number") {
        context.breakerStrengthAfter =
          definition.strength +
          deps.cardStrengthModifier(state, breakerId);
      }
    }
  }
  const serverLabel =
    publicServerLabelForCard(state, cardId) ??
    publicServerLabel(state, legalAction.payload?.serverId);
  const agendaId = cardId ?? sourceCardId;
  const resolvedEffects = legalAction.resolvedEffects;

  // CardImplementation runtime paths attach redacted ResolvedEffects here. Keep
  // instance-level private data out unless execution already exposed public
  // source titles or definition ids.
  if (Array.isArray(resolvedEffects)) context.resolvedEffects = resolvedEffects;
  if (serverLabel) context.serverLabel = serverLabel;
  if (legalAction.type === "start_run" && state.run) {
    const runAccessCount = Math.max(1, Math.floor(state.run.accessCount ?? 1));
    const runInstalledAccessBonus =
      deps.v1915InstalledAccessBonus(state, state.run.attackedServerId) +
      (state.run.attackedServerId === "hq" ? deps.runnerHqAccessBonus(state) : 0);
    context.baseAccessCount = Math.max(
      1,
      runAccessCount - runInstalledAccessBonus,
    );
    context.installedAccessBonus = runInstalledAccessBonus;
    context.effectiveAccessCount = runAccessCount;
  }
  for (const key of [
    "baseAccessCount",
    "installedAccessBonus",
    "effectiveAccessCount",
    "vacuumLinkDieRoll",
    "vacuumLinkRewindApplied",
    "vacuumLinkRewindRezzedIceBack",
    "vacuumLinkTargetIceIndex",
    "oliviaSalazarRunEndDerez",
    "derezzedCount",
  ]) {
    const value = legalAction.payload?.[key];
    if (typeof value === "number" || typeof value === "boolean")
      context[key] = value;
  }
  if (typeof legalAction.payload?.installedAccessBonusSourceDefinitionIds === "string")
    context.installedAccessBonusSourceDefinitionIds =
      legalAction.payload.installedAccessBonusSourceDefinitionIds;
  if (legalAction.type === "install_card") {
    const definition = cardId ? deps.definitionFor(state, cardId) : undefined;
    context.zoneLabel =
      legalAction.side === "runner"
        ? definition?.type === "resource"
          ? "Resource"
          : "Rig"
        : legalAction.payload?.placement === "ice"
          ? "ICE"
        : "Remote";
    if (legalAction.payload?.hiddenRunnerResourceInstall === true) {
      // Hidden Runner resources expose only a stable slot identity at install
      // time; the actual card identity remains private until a reveal path runs.
      context.redactedKind = "hidden_runner_resource";
      context.hiddenRunnerResourceInstall = true;
      if (typeof legalAction.payload.hiddenResourceSlotId === "string")
        context.hiddenResourceSlotId = legalAction.payload.hiddenResourceSlotId;
    }
    if (legalAction.payload?.zetatechOverlayInstall === true) {
      context.v1922RunnerProgramAbility = "zetatech_overlay_install";
      context.zetatechOverlayInstall = true;
      if (typeof legalAction.payload.hostDefinitionId === "string")
        context.hostDefinitionId = legalAction.payload.hostDefinitionId;
      if (typeof legalAction.payload.zetatechRecurringCreditsSpent === "number")
        context.zetatechRecurringCreditsSpent =
          legalAction.payload.zetatechRecurringCreditsSpent;
      if (typeof legalAction.payload.runnerCreditsAfter === "number")
        context.runnerCreditsAfter = legalAction.payload.runnerCreditsAfter;
    }
    for (const key of [
      "agendaPointCostPaid",
      "deckUniqueReplacement",
      "forfeitedAgendaCardId",
      "iceInstallBaseCost",
      "iceInstallAdditionalCost",
      "iceInstallReduction",
      "iceInstallReductionSourceDefinitionIds",
      "iceInstallTotalCost",
      "recurringCreditsLoaded",
      "rootReplacement",
      "replacedRootCardType",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (typeof legalAction.payload?.v181RunnerProgramAbility === "string") {
    context.v181RunnerProgramAbility =
      legalAction.payload.v181RunnerProgramAbility;
    for (const key of [
      "pattelsVirusCandidateCount",
      "pattelsVirusCounterAdded",
      "poxCounterAdded",
      "poxCountersAfter",
      "remainingCounters",
    ]) {
      const value = legalAction.payload?.[key];
      if (typeof value === "number") context[key] = value;
    }
    if (typeof legalAction.payload.pattelsVirusChoiceOpened === "boolean")
      context.pattelsVirusChoiceOpened =
        legalAction.payload.pattelsVirusChoiceOpened;
    if (typeof legalAction.payload.targetCardDefinitionId === "string")
      context.targetCardDefinitionId =
        legalAction.payload.targetCardDefinitionId;
    if (typeof legalAction.payload.targetServerLabel === "string")
      context.targetServerLabel = legalAction.payload.targetServerLabel;
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
  if (legalAction.type === "rez_ice")
    context.zoneLabel =
      legalAction.payload?.rootRez === true ||
      legalAction.payload?.assetRez === true
        ? "Remote"
        : "ICE";
  if (legalAction.type === "rez_ice") {
    if (legalAction.payload?.encounterTaxForFutureIce !== undefined)
      context.result = state.run ? "continued" : "ended";
    for (const key of [
      "rezCostPaid",
      "rezCostReductionAmount",
      "rezCostReductionSourceDefinitionIds",
      "baseRezCost",
      "proteusVariableRez",
      "variableRezAdditionalCost",
      "variableRezValue",
      "variableRezCap",
      "effectiveStrengthAfterRez",
      "effectiveSubroutineCountAfterRez",
      "oliviaSalazarRezSourceCardId",
      "oliviaSalazarRezSourceDefinitionId",
      "oliviaSalazarRezCostBase",
      "oliviaSalazarTemporaryDerez",
      "oliviaSalazarRunEndDerez",
      "encounterTaxForFutureIce",
      "encounterTaxPaid",
      "encounterTaxSource",
      "v1922RunnerProgramAbility",
      "sourceDefinitionId",
      "counterType",
      "addedCounterAmount",
      "hostedCreditsAdded",
      "hostedCreditsAfter",
      "remainingCounters",
      "speedTrapSourceCardId",
      "rezzedCardDefinitionId",
      "serverLabel",
      "speedTrapChoiceOpened",
    ]) {
      const value = legalAction.payload?.[key];
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
  if (legalAction.type === "break_subroutine") {
    for (const key of [
      "subroutineIndex",
      "subroutineIndexes",
      "targetIceDefinitionId",
      "targetIceTitle",
      "breakSubroutineBaseCost",
      "breakSubroutineAdditionalCost",
      "breakSubroutineTotalCost",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (
    legalAction.type === "break_subroutine" &&
    legalAction.payload?.pileDriverMultiBreak === true
  ) {
    context.pileDriverMultiBreak = true;
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
      "armadilloRecurringCreditsSpent",
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
    if (typeof payload.sourceDefinitionId === "string")
      context.sourceDefinitionId = payload.sourceDefinitionId;
  } else if (legalAction.type === "gain_credit") {
    if (Number.isInteger(legalAction.payload?.gainCreditsAmount)) {
      context.amount = Number(legalAction.payload?.gainCreditsAmount);
    } else if (legalAction.payload?.traceStarted !== true) {
      context.amount = 1;
    }
    if (typeof legalAction.payload?.sourceDefinitionId === "string")
      context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    const agendaPointCostPaid = legalAction.payload?.agendaPointCostPaid;
    if (Number.isInteger(agendaPointCostPaid))
      context.agendaPointCostPaid = Number(agendaPointCostPaid);
  }
  if (legalAction.type === "resolve_choice") {
    context.choiceKind = legalAction.payload?.choiceKind;
    if (legalAction.payload?.discardResolved === true) {
      context.discardResolved = true;
      context.discardSide = legalAction.payload.discardSide;
      context.discardCount = legalAction.payload.discardCount;
      context.discardZone = legalAction.payload.discardZone;
      context.redactedKind = "discard";
      if (legalAction.payload.randomizedByCockroach === true)
        context.randomizedByCockroach = true;
      if (typeof legalAction.payload.cockroachCounterTotal === "number")
        context.cockroachCounterTotal = legalAction.payload.cockroachCounterTotal;
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
      "forfeitedAgendaDefinitionIds",
      "specialZone",
      "specialZoneVisibility",
      "specialZoneReason",
      "sourceDefinitionId",
      "originalAmount",
      "preventedAmount",
      "finalAmount",
      "fullBodyConversionCorpBypassPaid",
      "fullBodyConversionBypassCostPerDamage",
      "codeViralCachePreservedCounters",
      "preservedCounterAmount",
      "remainingVirusCounters",
      "preservedCardDefinitionIds",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
    for (const key of [
      "replacementWindowId",
      "replacementDecision",
      "replacementOutcome",
      "originalEventId",
      "originalEventType",
      "replacementEventId",
      "replacementEventType",
      "tagsAdded",
      "preventedAmount",
      "v1919RunnerEventAbility",
      "v1920RunnerProgramAbility",
      "coreDamageRemoved",
      "gripCardsLost",
      "drawnCards",
      "gainedCredits",
      "removedTags",
      "runnerMaxHandSizeAfter",
      "agendaPointCostPaid",
      "futureActionDebtAdded",
      "futureActionDebtPending",
      "futureAgendaPointForfeitAdded",
      "futureAgendaPointForfeitPending",
      "sourceDefinitionId",
      "cardDefinitionId",
      "speedTrapSourceCardId",
      "rezzedCardDefinitionId",
      "serverLabel",
      "speedTrapUsed",
      "successfulRunWithoutAccess",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
    for (const key of [
      "traceId",
      "traceStep",
      "baseTraceStrength",
      "corpBidMax",
      "rabbitTraceLimitReduction",
      "sourceDefinitionId",
      "corpBid",
      "traceStrength",
      "runnerLink",
      "runnerBid",
      "traceLinkCreditsSpent",
      "hellsRunTraceCreditsSpent",
      "runnerCreditsSpent",
      "traceLinkCreditSourceDefinitionIds",
      "runnerStrength",
      "postBidTraceLinkChoiceOpened",
      "postBidTraceLinkSourceDefinitionId",
      "postBidTraceLinkCostPaid",
      "postBidTraceLinkDelta",
      "postBidTraceLinkBonus",
      "traceSuccessful",
      "tagsAdded",
      "cryingCounterCount",
      "cryingLinkReduction",
      "corpCreditBid",
      "parisCityGridPoolSpent",
      "parisCityGridPoolRemaining",
      "parisCityGridPoolServerId",
      "krumzBitsSpent",
      "hackerTrackerCountersSpent",
      "hackerTrackerCountersAdded",
      "fangRunEnded",
      "fangRunLockCreditCost",
      "runnerRunEnded",
      "runnerRunLockCreditCost",
      "traceSuccessEffect",
      "trashedCardDefinitionId",
      "trashedCardType",
      "trashedCount",
      "damageCannotBePrevented",
      "smithsPawnshopTriggered",
      "smithsPawnshopCardId",
      "trashedCardTitle",
      "creditsGained",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (legalAction.type === "continue_run") {
    context.result = state.run ? "continued" : "ended";
    if (typeof legalAction.payload?.trashedCardDefinitionId === "string")
      context.trashedCardDefinitionId =
        legalAction.payload.trashedCardDefinitionId;
    if (typeof legalAction.payload?.trashedCardType === "string")
      context.trashedCardType = legalAction.payload.trashedCardType;
    if (typeof legalAction.payload?.trashedCount === "number")
      context.trashedCount = legalAction.payload.trashedCount;
    if (legalAction.payload?.encounterContinue === true) {
      context.encounterContinue = true;
      context.unbrokenSubroutineCount =
        legalAction.payload.unbrokenSubroutineCount;
      context.encounterWillEndRun = legalAction.payload.encounterWillEndRun;
    }
    for (const key of [
      "encounterTaxForFutureIce",
      "encounterTaxPaid",
      "encounterTaxSource",
      "tokyoChibaInfightingBonus",
      "corpCreditsGained",
      "corpCreditsAfter",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
    if (legalAction.payload?.bartmossPostEncounterChecked === true) {
      context.bartmossPostEncounterChecked = true;
      context.bartmossPostEncounterOutcomes =
        legalAction.payload.bartmossPostEncounterOutcomes;
    }
  }
  if (legalAction.payload?.traceStarted === true) {
    // Trace contexts are public bidding state. This layer only forwards the
    // fields emitted by trace execution and does not infer hidden choices.
    if (typeof legalAction.payload.agendaAbility === "string")
      context.agendaAbility = legalAction.payload.agendaAbility;
    context.traceStarted = true;
    context.traceId = legalAction.payload.traceId;
    context.sourceCardId = legalAction.payload.sourceCardId;
    context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    context.baseTraceStrength = legalAction.payload.baseTraceStrength;
    if (typeof legalAction.payload.corpBidMax === "number")
      context.corpBidMax = legalAction.payload.corpBidMax;
    if (typeof legalAction.payload.rabbitTraceLimitReduction === "number")
      context.rabbitTraceLimitReduction =
        legalAction.payload.rabbitTraceLimitReduction;
    if (legalAction.payload.oncePerRunConsumed === true)
      context.oncePerRunConsumed = true;
  }
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
      "runnerRunAttemptsLastTurn",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (legalAction.payload?.damageResolved === true) {
    // Damage summaries are public outcomes only. Hidden-zone card identities are
    // not reconstructed from the state while building public context.
    context.damageResolved = true;
    context.damageType = legalAction.payload.damageType;
    context.damageAmount = legalAction.payload.damageAmount;
    context.cardsTrashed = legalAction.payload.cardsTrashed;
    context.flatline = legalAction.payload.flatline;
    if (typeof legalAction.payload.baseDamageAmount === "number")
      context.baseDamageAmount = legalAction.payload.baseDamageAmount;
    if (typeof legalAction.payload.bioweaponsEngineeringModifier === "number")
      context.bioweaponsEngineeringModifier =
        legalAction.payload.bioweaponsEngineeringModifier;
    if (typeof legalAction.payload.coreDamageAfter === "number")
      context.coreDamageAfter = legalAction.payload.coreDamageAfter;
    if (typeof legalAction.payload.runnerMaxHandSizeAfter === "number")
      context.runnerMaxHandSizeAfter =
        legalAction.payload.runnerMaxHandSizeAfter;
    if (typeof legalAction.payload.cerberusCounterCount === "number")
      context.cerberusCounterCount = legalAction.payload.cerberusCounterCount;
  }
  if (legalAction.payload?.eventModificationWindowOpened === true) {
    context.eventModificationWindowOpened = true;
    context.eventModificationKind = legalAction.payload.eventModificationKind;
    context.eventModificationWindowId =
      legalAction.payload.eventModificationWindowId;
    context.imminentEventId = legalAction.payload.imminentEventId;
    context.imminentEventType = legalAction.payload.imminentEventType;
    context.affectedSide = legalAction.payload.affectedSide;
    context.candidateCount = legalAction.payload.candidateCount;
    context.redactedKind = "event_modification";
  }
  if (legalAction.payload?.replacementWindowOpened === true) {
    context.replacementWindowOpened = true;
    context.replacementWindowId = legalAction.payload.replacementWindowId;
    context.originalEventId = legalAction.payload.originalEventId;
    context.originalEventType = legalAction.payload.originalEventType;
    context.replacementCandidateCount =
      legalAction.payload.replacementCandidateCount;
    context.affectedSide = legalAction.payload.affectedSide;
    context.redactedKind = "replacement";
  }
  if (legalAction.type === "purge_virus_counters") {
    context.purgedCounterType = "virus";
    context.purgedVirusCounters = legalAction.payload?.purgedVirusCounters ?? 0;
  }
  if (legalAction.payload?.hiddenZoneBarrier === true) {
    context.hiddenZoneBarrier = true;
    context.hiddenZoneAction = legalAction.payload.hiddenZoneAction;
    if (typeof legalAction.payload.selectedCount === "number")
      context.selectedCount = legalAction.payload.selectedCount;
    if (typeof legalAction.payload.arrangedCount === "number")
      context.arrangedCount = legalAction.payload.arrangedCount;
    if (typeof legalAction.payload.trashedCount === "number")
      context.trashedCount = legalAction.payload.trashedCount;
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
    if (typeof legalAction.payload.temporaryCreditsProvided === "number")
      context.temporaryCreditsProvided =
        legalAction.payload.temporaryCreditsProvided;
    if (typeof legalAction.payload.temporaryCreditsSpent === "number")
      context.temporaryCreditsSpent = legalAction.payload.temporaryCreditsSpent;
    if (typeof legalAction.payload.corpCreditsSpent === "number")
      context.corpCreditsSpent = legalAction.payload.corpCreditsSpent;
    if (
      typeof legalAction.payload.dataFortReclamationRezChoiceOpened ===
      "boolean"
    )
      context.dataFortReclamationRezChoiceOpened =
        legalAction.payload.dataFortReclamationRezChoiceOpened;
    if (
      typeof legalAction.payload.dataFortReclamationRezCandidateCount ===
      "number"
    )
      context.dataFortReclamationRezCandidateCount =
        legalAction.payload.dataFortReclamationRezCandidateCount;
    if (typeof legalAction.payload.temporaryCreditsRemaining === "number")
      context.temporaryCreditsRemaining =
        legalAction.payload.temporaryCreditsRemaining;
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
    if (typeof legalAction.payload.creditLoss === "number")
      context.creditLoss = legalAction.payload.creditLoss;
    if (typeof legalAction.payload.ambushDefinitionId === "string")
      context.ambushDefinitionId = legalAction.payload.ambushDefinitionId;
    if (typeof legalAction.payload.advancementCounterCount === "number")
      context.advancementCounterCount =
        legalAction.payload.advancementCounterCount;
    if (typeof legalAction.payload.runnerTagsAfter === "number")
      context.runnerTagsAfter = legalAction.payload.runnerTagsAfter;
    if (typeof legalAction.payload.trashedCardDefinitionId === "string")
      context.trashedCardDefinitionId =
        legalAction.payload.trashedCardDefinitionId;
    if (typeof legalAction.payload.targetCardDefinitionId === "string")
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
    if (typeof legalAction.payload.installedProgramDefinitionId === "string")
      context.installedProgramDefinitionId =
        legalAction.payload.installedProgramDefinitionId;
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
    if (typeof legalAction.payload.exposedServerIds === "string")
      context.exposedServerIds = legalAction.payload.exposedServerIds;
    if (typeof legalAction.payload.exposedServerLabels === "string")
      context.exposedServerLabels = legalAction.payload.exposedServerLabels;
    if (typeof legalAction.payload.targetCardDefinitionIds === "string")
      context.targetCardDefinitionIds =
        legalAction.payload.targetCardDefinitionIds;
    context.redactedKind = "hidden_zone";
  }
  if (typeof legalAction.payload?.archivesAutoAccessedCount === "number")
    context.archivesAutoAccessedCount =
      legalAction.payload.archivesAutoAccessedCount;
  for (const key of [
    "accessTrashBaseCost",
    "accessTrashCostModifier",
    "accessTrashTotalCost",
    "scatterShotRecurringCreditsAvailable",
    "scatterShotRecurringCreditsSpent",
    "poltergeistRecurringCreditsAvailable",
    "poltergeistRecurringCreditsSpent",
    "runnerCreditsSpent",
  ]) {
    const value = legalAction.payload?.[key];
    if (typeof value === "number") context[key] = value;
  }
  if (typeof legalAction.payload?.accessTrashCostSourceDefinitionIds === "string")
    context.accessTrashCostSourceDefinitionIds =
      legalAction.payload.accessTrashCostSourceDefinitionIds;
  if (typeof legalAction.payload?.accessTrashCostSourceTitles === "string")
    context.accessTrashCostSourceTitles =
      legalAction.payload.accessTrashCostSourceTitles;
  if (typeof legalAction.payload?.v1922RunnerProgramAbility === "string")
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
  if (typeof legalAction.payload?.publicRevealDefinitionId === "string")
    context.publicRevealDefinitionId =
      legalAction.payload.publicRevealDefinitionId;
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
    context.targetCardDefinitionIds = legalAction.payload.targetCardDefinitionIds;
  if (typeof legalAction.payload?.removedTags === "number")
    context.removedTags = legalAction.payload.removedTags;
  if (typeof legalAction.payload?.discardedCardsCount === "number")
    context.discardedCardsCount = legalAction.payload.discardedCardsCount;
  if (typeof legalAction.payload?.runnerTagsAfter === "number")
    context.runnerTagsAfter = legalAction.payload.runnerTagsAfter;
  if (legalAction.payload?.socialEngineeringRun === true)
    context.socialEngineeringRun = true;
  // Hosted-credit and counter values copied below are public summaries already
  // produced by execution. Keep this list as presentation wiring, not as a
  // general counter-engine policy layer.
  for (const key of [
    "gainedCredits",
    "runnerCreditsAfter",
    "corpCreditsAfter",
    "resourceAbility",
    "counterType",
    "addedCounterAmount",
    "removedCounterAmount",
    "remainingCounters",
    "hostedCreditsAdded",
    "hostedCreditsTaken",
    "hostedCreditsAfter",
    "shortTermContractTrashed",
    "gainCreditsAmount",
    "removePowerCounterAmount",
    "drawnCount",
    "runnerGripAfter",
    "citySurveillanceSourceCount",
    "citySurveillanceCreditsPaid",
    "citySurveillanceTagsAdded",
    "creditsLost",
    "tagsAdded",
    "runnerTagsAfter",
    "sourceDefinitionId",
    "sourceZone",
    "destinationZone",
    "returnedCardDefinitionId",
    "returnedCount",
    "returnedToGrip",
    "subroutineIndex",
    "targetCardDefinitionId",
    "targetIceDefinitionId",
    "breakSubroutineBaseCost",
    "checkedIceCount",
    "rezzedIceCount",
    "rezCostPaid",
    "priorityRequisitionChoiceOpened",
    "priorityRequisitionCandidateCount",
    "priorityRequisitionFreeRez",
    "priorityRequisitionDeclined",
    "priorityRequisitionTargetDefinitionId",
    "iceCount",
    "serverIceOrderReversed",
    "serverLabel",
    "accessCount",
    "gainedAgendaPoints",
  ]) {
    const value = legalAction.payload?.[key];
    if (value !== undefined) context[key] = value;
  }
  if (legalAction.payload?.allNighterBonusRunOnFinish === true)
    context.allNighterBonusRunOnFinish = true;
  if (legalAction.payload?.bypassFirstIce === true)
    context.bypassFirstIce = true;
  if (legalAction.payload?.scoredAsAgenda === true)
    context.scoredAsAgenda = true;
  if (typeof legalAction.payload?.sourceTrashed === "boolean")
    context.sourceTrashed = legalAction.payload.sourceTrashed;
  if (typeof legalAction.payload?.ambushDefinitionId === "string")
    context.ambushDefinitionId = legalAction.payload.ambushDefinitionId;
  if (typeof legalAction.payload?.tagConditionMet === "boolean")
    context.tagConditionMet = legalAction.payload.tagConditionMet;
  if (typeof legalAction.payload?.damageSkippedReason === "string")
    context.damageSkippedReason = legalAction.payload.damageSkippedReason;
  if (typeof legalAction.payload?.ambushSkippedReason === "string")
    context.ambushSkippedReason = legalAction.payload.ambushSkippedReason;
  if (typeof legalAction.payload?.onScoreGainCredits === "number")
    context.onScoreGainCredits = legalAction.payload.onScoreGainCredits;
  if (typeof legalAction.payload?.securityNetOptimizationServerId === "string")
    context.securityNetOptimizationServerId =
      legalAction.payload.securityNetOptimizationServerId;
  if (typeof legalAction.payload?.selectedServerId === "string")
    context.selectedServerId = legalAction.payload.selectedServerId;
  if (typeof legalAction.payload?.selectedServerLabel === "string")
    context.selectedServerLabel = legalAction.payload.selectedServerLabel;
  else if (typeof legalAction.payload?.selectedServerId === "string")
    context.selectedServerLabel = serverChoiceDisplayLabel(
      state,
      legalAction.payload.selectedServerId as Exclude<ServerId, "new_remote">,
    );
  if (typeof legalAction.payload?.agendaAbility === "string")
    context.agendaAbility = legalAction.payload.agendaAbility;
  if (typeof legalAction.payload?.cardDefinitionId === "string")
    context.cardDefinitionId = legalAction.payload.cardDefinitionId;
  if (typeof legalAction.payload?.spentPowerCounters === "number")
    context.spentPowerCounters = legalAction.payload.spentPowerCounters;
  if (typeof legalAction.payload?.gainedCredits === "number")
    context.gainedCredits = legalAction.payload.gainedCredits;
  for (const key of [
    "targetIceDefinitionId",
    "strengthBonus",
    "duplicatedSubroutineCount",
  ]) {
    const value = legalAction.payload?.[key];
    if (value !== undefined) context[key] = value;
  }
  if (typeof legalAction.payload?.corpCreditsBeforeCorporateWar === "number")
    context.corpCreditsBeforeCorporateWar =
      legalAction.payload.corpCreditsBeforeCorporateWar;
  if (typeof legalAction.payload?.v1922CorporateWarThreshold === "number")
    context.v1922CorporateWarThreshold =
      legalAction.payload.v1922CorporateWarThreshold;
  if (typeof legalAction.payload?.corporateWarThresholdMet === "boolean")
    context.corporateWarThresholdMet =
      legalAction.payload.corporateWarThresholdMet;
  if (legalAction.payload?.onScoreLostAllCredits === true)
    context.onScoreLostAllCredits = true;
  if (typeof legalAction.payload?.corpCreditsAfter === "number")
    context.corpCreditsAfter = legalAction.payload.corpCreditsAfter;
  if (legalAction.payload?.agendaAbility === "v1922_corporate_retreat") {
    context.agendaAbility = legalAction.payload.agendaAbility;
    if (typeof legalAction.payload.gainedCredits === "number")
      context.gainedCredits = legalAction.payload.gainedCredits;
  }
  if (legalAction.payload?.agendaAbility === "v1922_security_purge") {
    context.agendaAbility = "v1922_security_purge";
    context.hiddenZoneBarrier = true;
    context.hiddenZoneAction = legalAction.payload.hiddenZoneAction;
    context.revealedCount = legalAction.payload.revealedCount;
    context.installedIceCount = legalAction.payload.installedIceCount;
    context.trashedCount = legalAction.payload.trashedCount;
    context.securityPurgeInstallContract =
      legalAction.payload.securityPurgeInstallContract;
    context.securityPurgeWaivesPrintedRezCosts =
      legalAction.payload.securityPurgeWaivesPrintedRezCosts;
    context.publicRevealDefinitionIds =
      legalAction.payload.publicRevealDefinitionIds;
    context.installedIceDefinitionIds =
      legalAction.payload.installedIceDefinitionIds;
    context.trashedDefinitionIds = legalAction.payload.trashedDefinitionIds;
    context.redactedKind = "hidden_zone";
  }
  if (typeof legalAction.payload?.gainedActions === "number")
    context.gainedActions = legalAction.payload.gainedActions;
  if (typeof legalAction.payload?.cardImplementationAbility === "string") {
    context.cardImplementationAbility =
      legalAction.payload.cardImplementationAbility;
    for (const key of [
      "cardImplementationAbilityIndex",
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
      "hostedCreditsAdded",
      "hostedCreditsTaken",
      "hostedCreditsAfter",
      "sourceTrashed",
      "trashedCardDefinitionId",
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
  if (legalAction.payload?.chimeraDaemonTrashed === true) {
    context.chimeraDaemonTrashed = true;
    if (typeof legalAction.payload.chimeraDaemonDefinitionId === "string")
      context.chimeraDaemonDefinitionId =
        legalAction.payload.chimeraDaemonDefinitionId;
  }
  if (typeof legalAction.payload?.acmeSavingsAndLoanAbility === "string") {
    context.acmeSavingsAndLoanAbility =
      legalAction.payload.acmeSavingsAndLoanAbility;
    for (const key of [
      "agendaPointCost",
      "agendaPointCostPaid",
      "corpBonusAgendaPointsSpent",
      "forfeitedAgendaDefinitionIds",
      "gainedCredits",
      "selfTrashed",
      "acmeSavingsAndLoanObligations",
      "acmeSavingsAndLoanObligationsBefore",
      "acmeSavingsAndLoanObligationsAfter",
      "acmeSavingsAndLoanCreditCost",
      "acmeSavingsAndLoanPaymentDue",
      "acmeSavingsAndLoanPaymentPaid",
      "acmeSavingsAndLoanPaymentFailed",
      "acmeSavingsAndLoanScoreAgendaPoints",
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
  if (typeof legalAction.payload?.v1919AssetAbility === "string") {
    context.v1919AssetAbility = legalAction.payload.v1919AssetAbility;
    if (typeof legalAction.payload.addedCounterAmount === "number")
      context.addedCounterAmount = legalAction.payload.addedCounterAmount;
    if (typeof legalAction.payload.remainingCounters === "number")
      context.remainingCounters = legalAction.payload.remainingCounters;
    if (typeof legalAction.payload.advancementCounterCount === "number")
      context.advancementCounterCount =
        legalAction.payload.advancementCounterCount;
    if (typeof legalAction.payload.gainedCredits === "number")
      context.gainedCredits = legalAction.payload.gainedCredits;
    if (typeof legalAction.payload.corpCreditsAfter === "number")
      context.corpCreditsAfter = legalAction.payload.corpCreditsAfter;
    if (legalAction.payload.selfTrashed === true) context.selfTrashed = true;
  }
  if (typeof legalAction.payload?.v1919OperationAbility === "string") {
    context.v1919OperationAbility = legalAction.payload.v1919OperationAbility;
    if (typeof legalAction.payload.targetCardId === "string")
      context.targetCardId = legalAction.payload.targetCardId;
    if (typeof legalAction.payload.targetCardDefinitionId === "string")
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
    if (typeof legalAction.payload.agendaPointCostPaid === "number")
      context.agendaPointCostPaid = legalAction.payload.agendaPointCostPaid;
    if (typeof legalAction.payload.forfeitedAgendaDefinitionId === "string")
      context.forfeitedAgendaDefinitionId =
        legalAction.payload.forfeitedAgendaDefinitionId;
    if (typeof legalAction.payload.specialZone === "string")
      context.specialZone = legalAction.payload.specialZone;
    if (typeof legalAction.payload.specialZoneVisibility === "string")
      context.specialZoneVisibility = legalAction.payload.specialZoneVisibility;
    if (typeof legalAction.payload.specialZoneReason === "string")
      context.specialZoneReason = legalAction.payload.specialZoneReason;
  }
  if (typeof legalAction.payload?.v1915RunnerProgramAbility === "string") {
    context.v1915RunnerProgramAbility =
      legalAction.payload.v1915RunnerProgramAbility;
    if (typeof legalAction.payload.revealCount === "number")
      context.revealCount = legalAction.payload.revealCount;
    if (typeof legalAction.payload.revealedCardDefinitionIds === "string")
      context.revealedCardDefinitionIds =
        legalAction.payload.revealedCardDefinitionIds;
    if (typeof legalAction.payload.revealedProgramCount === "number")
      context.revealedProgramCount = legalAction.payload.revealedProgramCount;
    if (typeof legalAction.payload.installedProgramDefinitionId === "string")
      context.installedProgramDefinitionId =
        legalAction.payload.installedProgramDefinitionId;
    if (typeof legalAction.payload.installedProgramCount === "number")
      context.installedProgramCount = legalAction.payload.installedProgramCount;
    if (typeof legalAction.payload.selfTrashed === "boolean")
      context.selfTrashed = legalAction.payload.selfTrashed;
    if (legalAction.payload.programFound === false)
      context.programFound = false;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
  }
  if (typeof legalAction.payload?.v1922RunnerProgramAbility === "string") {
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
    if (typeof legalAction.payload.trashedCardDefinitionId === "string")
      context.trashedCardDefinitionId =
        legalAction.payload.trashedCardDefinitionId;
    if (typeof legalAction.payload.targetIceDefinitionId === "string")
      context.targetIceDefinitionId = legalAction.payload.targetIceDefinitionId;
    if (legalAction.payload.startupImmolatorExhausted === true)
      context.startupImmolatorExhausted = true;
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
    if (typeof legalAction.payload.returnedCardDefinitionId === "string")
      context.returnedCardDefinitionId =
        legalAction.payload.returnedCardDefinitionId;
    if (legalAction.payload.returnedToGrip === true)
      context.returnedToGrip = true;
  }
  if (typeof legalAction.payload?.v1919UpgradeAbility === "string") {
    context.v1919UpgradeAbility = legalAction.payload.v1919UpgradeAbility;
    if (typeof legalAction.payload.agendaPointCost === "number")
      context.agendaPointCost = legalAction.payload.agendaPointCost;
    if (typeof legalAction.payload.agendaPointCostPaid === "number")
      context.agendaPointCostPaid = legalAction.payload.agendaPointCostPaid;
    if (legalAction.payload.stealBlockedByAgendaPointCost === true)
      context.stealBlockedByAgendaPointCost = true;
    if (legalAction.payload.specialZone)
      context.specialZone = legalAction.payload.specialZone;
    if (legalAction.payload.specialZoneVisibility)
      context.specialZoneVisibility = legalAction.payload.specialZoneVisibility;
    if (legalAction.payload.specialZoneReason)
      context.specialZoneReason = legalAction.payload.specialZoneReason;
  }
  if (typeof legalAction.payload?.v1919RunnerProgramAbility === "string") {
    context.v1919RunnerProgramAbility =
      legalAction.payload.v1919RunnerProgramAbility;
    if (typeof legalAction.payload.sourceDefinitionId === "string")
      context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    if (typeof legalAction.payload.serverLabel === "string")
      context.serverLabel = legalAction.payload.serverLabel;
    if (typeof legalAction.payload.addedCounterAmount === "number")
      context.addedCounterAmount = legalAction.payload.addedCounterAmount;
    if (typeof legalAction.payload.remainingCounters === "number")
      context.remainingCounters = legalAction.payload.remainingCounters;
    if (typeof legalAction.payload.faitAccompliServerCounters === "number")
      context.faitAccompliServerCounters =
        legalAction.payload.faitAccompliServerCounters;
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
    if (
      typeof legalAction.payload.futureAgendaPointForfeitPending === "number"
    )
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
    if (
      typeof legalAction.payload.newsgroupTauntingRunStartTaxCredits ===
      "number"
    )
      context.newsgroupTauntingRunStartTaxCredits =
        legalAction.payload.newsgroupTauntingRunStartTaxCredits;
    if (
      typeof legalAction.payload.newsgroupTauntingSourceDefinitionIds ===
      "string"
    )
      context.newsgroupTauntingSourceDefinitionIds =
        legalAction.payload.newsgroupTauntingSourceDefinitionIds;
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
  }
  if (typeof legalAction.payload?.v1920RunnerRunLockAbility === "string") {
    context.v1920RunnerRunLockAbility =
      legalAction.payload.v1920RunnerRunLockAbility;
    if (typeof legalAction.payload.fangRunLockCreditCost === "number")
      context.fangRunLockCreditCost = legalAction.payload.fangRunLockCreditCost;
    if (typeof legalAction.payload.runnerRunLockCreditCost === "number")
      context.runnerRunLockCreditCost =
        legalAction.payload.runnerRunLockCreditCost;
    if (legalAction.payload.fangRunLockCleared === true)
      context.fangRunLockCleared = true;
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
    if (typeof legalAction.payload.randomPurpose === "string")
      context.randomPurpose = legalAction.payload.randomPurpose;
  }
  if (typeof legalAction.payload?.v1921UpgradeAbility === "string") {
    context.v1921UpgradeAbility = legalAction.payload.v1921UpgradeAbility;
    if (typeof legalAction.payload.v1921DieRoll === "number")
      context.v1921DieRoll = legalAction.payload.v1921DieRoll;
    if (typeof legalAction.payload.sourceDefinitionId === "string")
      context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    if (typeof legalAction.payload.passedIceDefinitionId === "string")
      context.passedIceDefinitionId = legalAction.payload.passedIceDefinitionId;
    if (typeof legalAction.payload.serverLabel === "string")
      context.serverLabel = legalAction.payload.serverLabel;
    if (typeof legalAction.payload.rioRunEnded === "boolean")
      context.rioRunEnded = legalAction.payload.rioRunEnded;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (typeof legalAction.payload.randomPurpose === "string")
      context.randomPurpose = legalAction.payload.randomPurpose;
  }
  if (typeof legalAction.payload?.v1921RunnerProgramAbility === "string") {
    context.v1921RunnerProgramAbility =
      legalAction.payload.v1921RunnerProgramAbility;
    if (typeof legalAction.payload.v1921DieRoll === "number")
      context.v1921DieRoll = legalAction.payload.v1921DieRoll;
    if (typeof legalAction.payload.aiBoonRunStrength === "number")
      context.aiBoonRunStrength = legalAction.payload.aiBoonRunStrength;
    if (typeof legalAction.payload.sourceDefinitionId === "string")
      context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (typeof legalAction.payload.randomPurpose === "string")
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
    if (typeof legalAction.payload.derezzedCount === "number")
      context.derezzedCount = legalAction.payload.derezzedCount;
    if (typeof legalAction.payload.targetCardDefinitionId === "string")
      context.targetCardDefinitionId =
        legalAction.payload.targetCardDefinitionId;
    if (typeof legalAction.payload.targetServerLabel === "string")
      context.targetServerLabel = legalAction.payload.targetServerLabel;
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
    if (typeof legalAction.payload.sourceDefinitionId === "string")
      context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    if (typeof legalAction.payload.runLockActionsAdded === "number")
      context.runLockActionsAdded = legalAction.payload.runLockActionsAdded;
    if (typeof legalAction.payload.runLockActionsPending === "number")
      context.runLockActionsPending =
        legalAction.payload.runLockActionsPending;
    if (typeof legalAction.payload.jackOutAdditionalCost === "number")
      context.jackOutAdditionalCost =
        legalAction.payload.jackOutAdditionalCost;
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
      Array.isArray(legalAction.payload.playfulAiDieRolls) ||
      typeof legalAction.payload.playfulAiDieRolls === "string"
    )
      context.playfulAiDieRolls = legalAction.payload.playfulAiDieRolls;
    for (const key of [
      "playfulAiGainedCredits",
      "playfulAiSetAsideDice",
      "playfulAiRolledDice",
      "playfulAiDiceQueuedBeforeRolls",
      "playfulAiDiceQueuedAfterRolls",
      "playfulAiRemainingDice",
      "runnerCreditsAfter",
    ]) {
      const value = legalAction.payload[key];
      if (typeof value === "number") context[key] = value;
    }
    if (typeof legalAction.payload.playfulAiChoiceOpened === "boolean")
      context.playfulAiChoiceOpened = legalAction.payload.playfulAiChoiceOpened;
    if (typeof legalAction.payload.playfulAiComplete === "boolean")
      context.playfulAiComplete = legalAction.payload.playfulAiComplete;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (typeof legalAction.payload.randomPurpose === "string")
      context.randomPurpose = legalAction.payload.randomPurpose;
  }
  if (typeof legalAction.payload?.v1921RunnerResourceAbility === "string") {
    context.v1921RunnerResourceAbility =
      legalAction.payload.v1921RunnerResourceAbility;
    if (typeof legalAction.payload.v1921DieRoll === "number")
      context.v1921DieRoll = legalAction.payload.v1921DieRoll;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (typeof legalAction.payload.randomPurpose === "string")
      context.randomPurpose = legalAction.payload.randomPurpose;
  }
  if (typeof legalAction.payload?.v1919AgendaDifficulty === "number")
    context.v1919AgendaDifficulty = legalAction.payload.v1919AgendaDifficulty;
  if (typeof legalAction.payload?.v1919Overadvance === "number")
    context.v1919Overadvance = legalAction.payload.v1919Overadvance;
  if (typeof legalAction.payload?.v1919BonusAgendaPoints === "number")
    context.v1919BonusAgendaPoints = legalAction.payload.v1919BonusAgendaPoints;
  if (typeof legalAction.payload?.projectBabylonOveradvance === "number")
    context.projectBabylonOveradvance =
      legalAction.payload.projectBabylonOveradvance;
  if (typeof legalAction.payload?.projectBabylonBonusAgendaPoints === "number")
    context.projectBabylonBonusAgendaPoints =
      legalAction.payload.projectBabylonBonusAgendaPoints;
  if (state.winner && state.gameEndReason)
    context.gameEndReason = state.gameEndReason;
  if (state.run?.phase) context.runPhase = state.run.phase;
  if (
    (legalAction.type === "score_agenda" ||
      legalAction.type === "steal_agenda") &&
    agendaId
  ) {
    const definition = deps.definitionFor(state, agendaId);
    if (definition.type === "agenda") {
      context.agendaPoints = definition.agendaPoints ?? 0;
      const bonusAgendaPoints = deps.cardCounter(state, agendaId, "agenda");
      if (bonusAgendaPoints > 0) context.agendaPointBonus = bonusAgendaPoints;
      context.totalAgendaPoints = deps.agendaPointsForScoredCard(state, agendaId);
    }
  }
  if (
    legalAction.side === "corp" &&
    (legalAction.type === "install_card" || legalAction.type === "advance_card")
  )
    context.redactedKind = "installed_card";

  return context;
}

export function publicServerLabel(
  state: GameState,
  serverId: unknown,
): string | undefined {
  if (typeof serverId !== "string") return undefined;
  if (serverId === "new_remote") return "neuem Remote";
  return state.corp.servers.find((server) => server.id === serverId)?.label;
}

export function serverChoiceDisplayLabel(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): string {
  const label = publicServerLabel(state, serverId) ?? serverId;
  const remote = /^Remote\s+(\d+)$/i.exec(label.trim());
  return remote?.[1] ? `Remote Server ${remote[1]}` : label;
}

export function publicServerLabelForCard(
  state: GameState,
  cardId: string | undefined,
): string | undefined {
  if (!cardId) return undefined;
  const zone = state.cardInstances[cardId]?.zone;
  const serverId = zone && "serverId" in zone ? zone.serverId : undefined;
  return publicServerLabel(state, serverId);
}
