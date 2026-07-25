import {
  ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS,
  CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND,
  CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION,
  type AiDecisionInput,
  type AiDifficulty,
  type CorpOptionalRezChoiceQuote,
  type CounterDisplay,
  type ChoiceRequirement,
  type Cost,
  type LegalAction,
  type PlayerView,
  type PublicAbilityFamily,
  type PublicGameEvent,
  type ResolvedGameEffect,
  type Side,
  type TargetRequirement,
  type TraceSuccessEffect,
  type VisibleCard,
  type VisibleChoiceRequest,
  type VisibleCorpRezCostQuote,
  type VisibleEffectiveIceRunQuote,
} from "@netgrid/shared";

export type BuildAiDecisionInputDtoParams = {
  matchId?: string;
  side: Side;
  playerView: PlayerView;
  eventTail: PublicGameEvent[];
  legalActions: LegalAction[];
  difficulty: AiDifficulty;
  seed: string;
  decisionId: string;
  actionNumber: number;
  profileId: string;
};

export const AI_DECISION_INPUT_TOP_LEVEL_FIELDS = [
  "matchId",
  "side",
  "playerView",
  "eventTail",
  "legalActions",
  "difficulty",
  "seed",
  "decisionId",
  "actionNumber",
  "profileId",
] as const;

// Nested AI-input payloads are positive allowlists. New engine/public payload
// shapes must be added here deliberately instead of being deep-copied.
const LEGAL_ACTION_PAYLOAD_KEYS = new Set<string>([
  "serverId",
  "breakerId",
  "iceId",
  "subroutineIndex",
  "subroutineIndexes",
  "placement",
  "iceInstallBaseCost",
  "iceInstallAdditionalCost",
  "iceInstallReduction",
  "iceInstallReductionSourceDefinitionIds",
  "iceInstallIncreaseSourceDefinitionIds",
  "iceInstallTotalCost",
  "postInstallRezQuoteCardId",
  "postInstallRezQuoteTargetServerId",
  "postInstallRezQuoteProjectedServerId",
  "postInstallRezQuoteExpiresAtStateVersion",
  "postInstallRezQuoteComplete",
  "postInstallRezQuoteBaseCredits",
  "postInstallRezQuoteFinalCredits",
  "postInstallRezQuoteMandatoryAgendaPointCost",
  "postInstallRezQuoteMandatoryAdditionalCostKind",
  "postInstallRezQuoteReductionSourceDefinitionIds",
  "postInstallRezQuoteIncreaseSourceDefinitionIds",
  "agendaPointCost",
  "selfRezAdditionalCostKind",
  "rootRezCreditOutcomeQuoteSchemaVersion",
  "rootRezCreditOutcomeQuoteComplete",
  "rootRezCreditOutcomeQuoteSourceCardInstanceId",
  "rootRezCreditOutcomeQuoteTargetServerId",
  "rootRezCreditOutcomeQuoteStateVersion",
  "rootRezCreditOutcomeQuoteTimingPoint",
  "rootRezCreditOutcomeQuoteActionId",
  "rootRezCreditOutcomeQuoteResolution",
  "rootRezCreditOutcomeQuoteGrossCreditGain",
  "rootRezCreditOutcomeQuoteRezCredits",
  "rootRezCreditOutcomeQuoteNetCreditGain",
  "regionReplacementWarning",
  "rootReplacement",
  "encounterContinue",
  "unbrokenSubroutineCount",
  "delayedInstallAbility",
  "encounterWillEndRun",
  "encounterSourceWillTrashAtEndOfTurn",
  "shellTradersAbility",
  "abilityFamily",
  "abilityId",
  "effectKind",
  "xValue",
  "xMinimum",
  "xMaximum",
  "xUpperBound",
  "xCreditsPerUnit",
  "variableCostKind",
  "hardwareTrashByCounterTrashCount",
  "eligibleHardwareCount",
  "damageCannotBePrevented",
  "damageType",
  "damageAmount",
  "sourceDefinitionId",
  "cardImplementationEconomyKind",
  "cardImplementationAmountPerAdvancementCounter",
  "cardImplementationTrashesSource",
  "cardImplementationAdvancementCounterCost",
  "cardImplementationAddsHostedCredits",
  "hostedCreditAddAmount",
  "cardImplementationTakesHostedCredits",
  "hostedCreditTakeAmount",
  "hostedCreditTakeMode",
  "cardImplementationScoresSourceAsAgenda",
  "cardImplementationEffectKind",
  "cardImplementationSearchFilter",
  "runActionKind",
  "runServerId",
  "runTargetChoiceRequired",
  "accessServerId",
  "successfulRunAccessReplacement",
  "successfulRunPrivateLookCount",
  "runAccessCount",
  "bypassFirstIce",
  "noNoisyBreakers",
  "runTraceLinkBonus",
  "runTemporaryCredits",
  "conditionalAccessBonusKind",
  "conditionalAccessBonusAmount",
  "runnerEventRun",
  "scoreConversionCapability",
  "scoreConversionAdvancementAmount",
  "scoreConversionAdvancementMode",
  "scoreConversionAdvancementMaximum",
  "scoreConversionSourceMode",
  "scoreConversionTargetMode",
  "scoreConversionTiming",
  "gainActionsAmount",
  "actionCapacityTiming",
  "actionCapacityRestriction",
  "actionCapacityAllowedActionType",
  "actionCapacityAllowedCardType",
  "actionCapacityTemporaryCredits",
  "actionCapacityReliability",
  "actionCapacityExpiresAt",
  "actionCapacitySelfFinancing",
  "actionCapacityGainAmountPerTurn",
  "actionCapacityDurationTurns",
  "restrictedActionGrantActionType",
  "restrictedActionGrantCostProfile",
  "restrictedActionGrantRemainingActions",
  "cardImplementationSourceCounterType",
  "cardImplementationSourceCounterCost",
  "cardDefinitionId",
  "targetCardDefinitionId",
  "targetCardId",
  "serverLabel",
  "selectedServerId",
  "selectedServerLabel",
  "targetServerId",
  "targetServerLabel",
  "cardId",
  "redactedKind",
  "hiddenResourceSlotId",
  "amount",
  "gainedCredits",
  "gainCreditsAmount",
  "drawCardsAmount",
  "addedCounterAmount",
  "addCounterAmount",
  "removedCounterAmount",
  "removeCounterAmount",
  "removePowerCounterAmount",
  "remainingCounters",
  "remainingCountersBefore",
  "shellCounterAmount",
  "counterType",
  "traceStrength",
  "runnerLink",
  "drawTaxSourceCount",
  "drawTaxDecision",
  "drawTaxProjectedCreditsPaid",
  "drawTaxProjectedTagsAdded",
  "citySurveillanceSourceCount",
  "citySurveillanceDrawDecision",
  "citySurveillanceProjectedCreditsPaid",
  "citySurveillanceProjectedTagsAdded",
  "ambushPaymentChoiceOpened",
  "ambushPaymentAmount",
  "payOrTrashProgramSubroutineIndexes",
  "payOrTrashProgramSubroutinePayment",
  "payOrEndRunSubroutineIndexes",
  "payOrEndRunSubroutinePayment",
  ...ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS,
]);

const PUBLIC_PAYLOAD_PRIMITIVE_KEYS = new Set<string>([
  "actor",
  "side",
  "actionType",
  "label",
  "publicLabel",
  "title",
  "cardTitle",
  "cardDefinitionId",
  "sourceDefinitionId",
  "sourceTitle",
  "targetCardDefinitionId",
  "targetIceDefinitionId",
  "trashedCardDefinitionId",
  "installedProgramDefinitionId",
  "returnedCardDefinitionId",
  "hostDefinitionId",
  "serverId",
  "attackedServerId",
  "targetServerId",
  "server",
  "serverLabel",
  "targetServerLabel",
  "installPlacement",
  "rootReplacement",
  "replacedRootCardType",
  "targetVisibility",
  "choiceVisibility",
  "redactedKind",
  "hiddenResourceSlotId",
  "hiddenRunnerResourceInstall",
  "hiddenRunnerResourceRevealed",
  "hiddenZoneAction",
  "privateLookZone",
  "privateLookCount",
  "knownHqCardCount",
  "knownRndCardCount",
  "knownRndTopDefinitionId",
  "accessedCardPositionKey",
  "accessedArea",
  "accessedIndex",
  "exposedCardDefinitionId",
  "exposedServerId",
  "exposedServerLabel",
  "exposedArea",
  "exposedIndex",
  "exposedPositionKey",
  "discardResolved",
  "revealKind",
  "abilityFamily",
  "abilityId",
  "effectKind",
  "hiddenZoneBarrier",
  "damageType",
  "damageResolved",
  "traceStarted",
  "traceStep",
  "corpBid",
  "baseTraceStrength",
  "traceStrength",
  "runnerLink",
  "successful",
  "setupStatus",
  "agendaPointsToWin",
  "runnerDeckId",
  "corpDeckId",
  "amount",
  "gainedActions",
  "gainedCredits",
  "cardImplementationAdvancementCounterCost",
  "gainCreditsAmount",
  "damageAmount",
  "baseDamageAmount",
  "preventedAmount",
  "finalAmount",
  "removedTags",
  "tagsAdded",
  "runnerTagsAfter",
  "drawTaxSourceCount",
  "drawTaxDecision",
  "drawTaxProjectedCreditsPaid",
  "drawTaxProjectedTagsAdded",
  "drawTaxCreditsPaid",
  "drawTaxTagsAdded",
  "citySurveillanceSourceCount",
  "citySurveillanceDrawDecision",
  "citySurveillanceProjectedCreditsPaid",
  "citySurveillanceProjectedTagsAdded",
  "citySurveillanceCreditsPaid",
  "citySurveillanceTagsAdded",
  "ambushPaymentChoiceOpened",
  "ambushPaymentAmount",
  "addedCounterAmount",
  "removedCounterAmount",
  "remainingCounters",
  "preservedCounterAmount",
  "remainingVirusCounters",
  "recurringCreditsLoaded",
  "paidCredits",
  "rezCostPaid",
  "trashCostPaid",
  "agendaPointCost",
  "agendaPointCostPaid",
  "accessTrashBaseCost",
  "accessTrashCostModifier",
  "accessTrashTotalCost",
  "scatterShotRecurringCreditsAvailable",
  "scatterShotRecurringCreditsSpent",
  "poltergeistRecurringCreditsAvailable",
  "poltergeistRecurringCreditsSpent",
  "runnerCreditsSpent",
  "temporaryCreditsProvided",
  "temporaryCreditsSpent",
  "temporaryCreditsRemaining",
  "corpCreditsAfter",
  "runnerCreditsAfter",
  "randomRoll",
  "dieRoll",
  "blinkDieRoll",
  "blinkBreakSuccess",
  "blinkDamageAmount",
  "randomCounterAfter",
  "returnedCount",
]);

const PUBLIC_PAYLOAD_STRING_ARRAY_KEYS = new Set([
  "cardDefinitionIds",
  "targetCardDefinitionIds",
  "returnedCardDefinitionIds",
  "revealedCardDefinitionIds",
  "exposedCardDefinitionIds",
  "knownHqDefinitionIds",
  "knownRndDefinitionIds",
]);

const PUBLIC_AMOUNT_KEYS = new Set([
  "amount",
  "gainedActions",
  "gainedCredits",
  "gainCreditsAmount",
  "damageAmount",
  "baseDamageAmount",
  "preventedAmount",
  "finalAmount",
  "removedTags",
  "tagsAdded",
  "runnerTagsAfter",
  "drawTaxSourceCount",
  "drawTaxProjectedCreditsPaid",
  "drawTaxProjectedTagsAdded",
  "drawTaxCreditsPaid",
  "drawTaxTagsAdded",
  "citySurveillanceSourceCount",
  "citySurveillanceProjectedCreditsPaid",
  "citySurveillanceProjectedTagsAdded",
  "citySurveillanceCreditsPaid",
  "citySurveillanceTagsAdded",
  "addedCounterAmount",
  "removedCounterAmount",
  "remainingCounters",
  "preservedCounterAmount",
  "remainingVirusCounters",
  "recurringCreditsLoaded",
  "paidCredits",
  "rezCostPaid",
  "trashCostPaid",
  "agendaPointCost",
  "agendaPointCostPaid",
  "temporaryCreditsProvided",
  "temporaryCreditsSpent",
  "temporaryCreditsRemaining",
  "corpCreditsAfter",
  "runnerCreditsAfter",
  "randomRoll",
  "dieRoll",
  "randomCounterAfter",
  "returnedCount",
]);

const PUBLIC_TARGET_KEYS = new Set([
  "sourceDefinitionId",
  "cardDefinitionId",
  "targetCardDefinitionId",
  "targetIceDefinitionId",
  "trashedCardDefinitionId",
  "installedProgramDefinitionId",
  "returnedCardDefinitionId",
  "hostDefinitionId",
  "scoredFromServerId",
  "serverLabel",
  "targetServerLabel",
  "targetVisibility",
  "choiceVisibility",
  "redactedKind",
]);

const PUBLIC_BASELINE_KEYS = new Set([
  "rulesVersion",
  "engineSchemaVersion",
  "playerViewSchemaVersion",
  "aiControllerSchemaVersion",
  "simulationSchemaVersion",
  "multiplayerSchemaVersion",
  "cardTextSnapshotId",
  "cardTextSource",
  "cardImplementationVersion",
  "deviationRegistryVersion",
]);

const PUBLIC_DECK_METADATA_KEYS = new Set([
  "deckName",
  "deckHash",
  "side",
  "identityCardId",
  "formatProfileId",
  "cardPoolSnapshotId",
]);

const ALLOWED_ABILITY_FAMILIES: ReadonlySet<PublicAbilityFamily> = new Set([
  "agenda-scoring",
  "damage-prevention",
  "hidden-zone",
  "hosting-counters",
  "payment-costs",
  "random-effects",
  "run-access",
  "trace-tags",
]);

export function buildAiDecisionInputDto(
  params: BuildAiDecisionInputDtoParams,
): AiDecisionInput {
  const sanitizedPublicEvents = params.playerView.publicEvents.map(
    sanitizePublicGameEvent,
  );
  return {
    ...(params.matchId !== undefined ? { matchId: params.matchId } : {}),
    side: params.side,
    playerView: sanitizePlayerView(params.playerView, sanitizedPublicEvents),
    eventTail: sanitizeEventTail(
      params.playerView.publicEvents,
      sanitizedPublicEvents,
      params.eventTail,
    ),
    legalActions: params.legalActions.map(sanitizeLegalAction),
    difficulty: params.difficulty,
    seed: params.seed,
    decisionId: params.decisionId,
    actionNumber: params.actionNumber,
    profileId: params.profileId,
  };
}

function sanitizeEventTail(
  publicEvents: readonly PublicGameEvent[],
  sanitizedPublicEvents: PublicGameEvent[],
  eventTail: readonly PublicGameEvent[],
): PublicGameEvent[] {
  if (eventTail === publicEvents) return sanitizedPublicEvents;
  if (eventTail.length === 0) return [];
  const suffixStart = publicEvents.length - eventTail.length;
  if (
    suffixStart >= 0 &&
    eventTail.every(
      (event, index) => publicEvents[suffixStart + index] === event,
    )
  ) {
    return sanitizedPublicEvents.slice(suffixStart);
  }
  return eventTail.map(sanitizePublicGameEvent);
}

function sanitizePlayerView(
  view: PlayerView,
  publicEvents: PublicGameEvent[],
): PlayerView {
  return {
    side: view.side,
    stateVersion: view.stateVersion,
    ...(view.turnSerial !== undefined ? { turnSerial: view.turnSerial } : {}),
    timingPoint: view.timingPoint,
    activeSide: view.activeSide,
    phase: view.phase,
    own: {
      identity: sanitizeVisibleCard(view.own.identity),
      credits: view.own.credits,
      clicks: view.own.clicks,
      agendaPoints: view.own.agendaPoints,
      gripOrHq: view.own.gripOrHq.map(sanitizeVisibleCard),
      stackOrRdCount: view.own.stackOrRdCount,
      heapOrArchives: view.own.heapOrArchives.map(sanitizeVisibleCard),
      scoreArea: view.own.scoreArea.map(sanitizeVisibleCard),
      ...(view.own.rig ? { rig: view.own.rig.map(sanitizeVisibleCard) } : {}),
      ...(view.own.memoryUsed !== undefined
        ? { memoryUsed: view.own.memoryUsed }
        : {}),
      ...(view.own.memoryLimit !== undefined
        ? { memoryLimit: view.own.memoryLimit }
        : {}),
      maxHandSize: view.own.maxHandSize,
      ...(view.own.coreDamage !== undefined
        ? { coreDamage: view.own.coreDamage }
        : {}),
      tags: view.own.tags,
    },
    opponent: {
      identity: sanitizeVisibleCard(view.opponent.identity),
      credits: view.opponent.credits,
      clicks: view.opponent.clicks,
      agendaPoints: view.opponent.agendaPoints,
      tags: view.opponent.tags,
      handCount: view.opponent.handCount,
      maxHandSize: view.opponent.maxHandSize,
      ...(view.opponent.coreDamage !== undefined
        ? { coreDamage: view.opponent.coreDamage }
        : {}),
      deckCount: view.opponent.deckCount,
      discardCount: view.opponent.discardCount,
      scoreArea: view.opponent.scoreArea.map(sanitizeVisibleCard),
      ...(view.opponent.rig
        ? { rig: view.opponent.rig.map(sanitizeVisibleCard) }
        : {}),
    },
    servers: view.servers.map((server) => ({
      id: server.id,
      label: server.label,
      ice: server.ice.map((card) =>
        sanitizeVisibleCardWithOptions(card, {
          allowCorpRezCostQuote:
            view.side === "corp" &&
            card.known &&
            card.owner === "corp" &&
            card.controller === "corp" &&
            card.type === "ice",
          expectedCorpRezServerId: server.id,
          expectedCorpRezStateVersion: view.stateVersion,
        }),
      ),
      root: server.root.map(sanitizeVisibleCard),
      ...(server.counterDisplays
        ? {
            counterDisplays: server.counterDisplays.map(sanitizeCounterDisplay),
          }
        : {}),
    })),
    ...(view.specialZones
      ? {
          specialZones: {
            setAside: view.specialZones.setAside.map(sanitizeVisibleCard),
            removedFromGame:
              view.specialZones.removedFromGame.map(sanitizeVisibleCard),
            setAsideCount: view.specialZones.setAsideCount,
            removedFromGameCount: view.specialZones.removedFromGameCount,
          },
        }
      : {}),
    ...(view.side === "corp" && view.corpCentralAccessQuotes
      ? {
          corpCentralAccessQuotes: view.corpCentralAccessQuotes.map(
            (quote) => ({
              serverId: quote.serverId,
              stateVersion: quote.stateVersion,
              complete: quote.complete,
              effectiveAccessCount: quote.effectiveAccessCount,
              isMultiaccess: quote.isMultiaccess,
              sourceDefinitionIds: quote.sourceDefinitionIds.slice(),
              serverBoundEffects: quote.serverBoundEffects.map((effect) => ({
                id: effect.id,
                kind: effect.kind,
                serverId: effect.serverId,
                counterKind: effect.counterKind,
                formula: effect.formula,
                sourceDefinitionId: effect.sourceDefinitionId,
                counterCount: effect.counterCount,
                additionalAccessCount: effect.additionalAccessCount,
              })),
            }),
          ),
        }
      : {}),
    ...(view.run
      ? {
          run: {
            attackedServerId: view.run.attackedServerId,
            phase: view.run.phase,
            ...(view.run.position
              ? { position: structuredClone(view.run.position) }
              : {}),
            ...(view.run.encounteredIce
              ? { encounteredIce: sanitizeVisibleCard(view.run.encounteredIce) }
              : {}),
            ...(view.run.accessedCard
              ? { accessedCard: sanitizeVisibleCard(view.run.accessedCard) }
              : {}),
            ...(view.run.breach
              ? {
                  breach: {
                    breachId: view.run.breach.breachId,
                    serverId: view.run.breach.serverId,
                    currentIndex: view.run.breach.currentIndex,
                    remainingCount: view.run.breach.remainingCount,
                    completed: view.run.breach.completed,
                  },
                }
              : {}),
            ...(view.run.badPublicityCredits !== undefined
              ? { badPublicityCredits: view.run.badPublicityCredits }
              : {}),
            successful: view.run.successful,
          },
        }
      : {}),
    ...(view.deckMetadata
      ? {
          deckMetadata: {
            own: { ...view.deckMetadata.own },
            opponent: { ...view.deckMetadata.opponent },
          },
        }
      : {}),
    ...(view.pendingChoice
      ? {
          pendingChoice: sanitizeVisibleChoiceRequest(
            view.pendingChoice,
            view.stateVersion,
            view.side,
            view.own.credits,
            view.own.agendaPoints,
            view.own.scoreArea,
            view.servers,
          ),
        }
      : {}),
    publicEvents,
    legalActions: view.legalActions.map(sanitizeLegalAction),
    winner: view.winner,
    agendaPointsToWin: view.agendaPointsToWin,
    ...(view.gameEndReason ? { gameEndReason: view.gameEndReason } : {}),
  };
}

function sanitizeVisibleCard(card: VisibleCard): VisibleCard {
  return sanitizeVisibleCardWithOptions(card);
}

function sanitizeVisibleCardWithOptions(
  card: VisibleCard,
  options: {
    allowCorpRezCostQuote?: boolean;
    expectedCorpRezServerId?: PlayerView["servers"][number]["id"];
    expectedCorpRezStateVersion?: number;
  } = {},
): VisibleCard {
  const effectiveRezCostQuote = card.effectiveRezCostQuote;
  const includeEffectiveRezCostQuote =
    options.allowCorpRezCostQuote === true &&
    effectiveRezCostQuote?.context === "installed" &&
    effectiveRezCostQuote.cardId === card.instanceId &&
    effectiveRezCostQuote.targetServerId === options.expectedCorpRezServerId &&
    effectiveRezCostQuote.projectedServerId ===
      options.expectedCorpRezServerId &&
    effectiveRezCostQuote.expiresAtStateVersion ===
      options.expectedCorpRezStateVersion;
  return {
    instanceId: card.instanceId,
    known: card.known,
    ...(card.title !== undefined ? { title: card.title } : {}),
    ...(card.definitionId !== undefined
      ? { definitionId: card.definitionId }
      : {}),
    ...(card.type !== undefined ? { type: card.type } : {}),
    ...(card.subtypes !== undefined ? { subtypes: card.subtypes.slice() } : {}),
    ...(card.rulesText !== undefined ? { rulesText: card.rulesText } : {}),
    ...(card.cost !== undefined ? { cost: card.cost } : {}),
    ...(card.known && card.playCost !== undefined
      ? {
          playCost:
            card.playCost.kind === "fixed"
              ? { ...card.playCost }
              : {
                  ...card.playCost,
                  maximumX: { ...card.playCost.maximumX },
                },
        }
      : {}),
    ...(card.installCost !== undefined
      ? { installCost: card.installCost }
      : {}),
    ...(card.memoryCost !== undefined ? { memoryCost: card.memoryCost } : {}),
    ...(card.memoryLimitBonus !== undefined
      ? { memoryLimitBonus: card.memoryLimitBonus }
      : {}),
    ...(card.maxHandSizeBonus !== undefined
      ? { maxHandSizeBonus: card.maxHandSizeBonus }
      : {}),
    ...(card.rezCost !== undefined ? { rezCost: card.rezCost } : {}),
    ...(card.baseLink !== undefined ? { baseLink: card.baseLink } : {}),
    ...(card.rezzed !== undefined ? { rezzed: card.rezzed } : {}),
    ...(card.advancementCounters !== undefined
      ? { advancementCounters: card.advancementCounters }
      : {}),
    ...(card.advancementRequirement !== undefined
      ? { advancementRequirement: card.advancementRequirement }
      : {}),
    ...(card.strength !== undefined ? { strength: card.strength } : {}),
    ...(card.agendaPoints !== undefined
      ? { agendaPoints: card.agendaPoints }
      : {}),
    ...(card.trashCost !== undefined ? { trashCost: card.trashCost } : {}),
    ...(card.counters !== undefined ? { counters: { ...card.counters } } : {}),
    ...(card.counterDisplays !== undefined
      ? { counterDisplays: card.counterDisplays.map(sanitizeCounterDisplay) }
      : {}),
    ...(card.hostedOn !== undefined ? { hostedOn: card.hostedOn } : {}),
    ...(card.owner !== undefined ? { owner: card.owner } : {}),
    ...(card.controller !== undefined ? { controller: card.controller } : {}),
    ...(card.effectiveRunQuote
      ? {
          effectiveRunQuote: sanitizeVisibleEffectiveIceRunQuote(
            card.effectiveRunQuote,
          ),
        }
      : {}),
    ...(includeEffectiveRezCostQuote && effectiveRezCostQuote
      ? {
          effectiveRezCostQuote: sanitizeInstalledCorpRezCostQuote(
            effectiveRezCostQuote,
          ),
        }
      : {}),
  };
}

function sanitizeInstalledCorpRezCostQuote(
  quote: Extract<VisibleCorpRezCostQuote, { context: "installed" }>,
): VisibleCorpRezCostQuote {
  const binding = {
    context: "installed" as const,
    cardId: quote.cardId,
    targetServerId: quote.targetServerId,
    projectedServerId: quote.projectedServerId,
    expiresAtStateVersion: quote.expiresAtStateVersion,
  };
  if (!quote.complete) return { ...binding, complete: false };
  const reductionSourceDefinitionIds = sanitizedStringArray(
    quote.reductionSourceDefinitionIds,
  );
  const increaseSourceDefinitionIds = sanitizedStringArray(
    quote.increaseSourceDefinitionIds,
  );
  const modifiersValid =
    (quote.reductionSourceDefinitionIds === undefined ||
      reductionSourceDefinitionIds !== undefined) &&
    (quote.increaseSourceDefinitionIds === undefined ||
      increaseSourceDefinitionIds !== undefined) &&
    modifierDefinitionIdListsAreDisjoint(
      reductionSourceDefinitionIds,
      increaseSourceDefinitionIds,
    );
  if (
    quote.projectedServerId !== quote.targetServerId ||
    !isNonNegativeSafeInteger(quote.expiresAtStateVersion) ||
    !isNonNegativeSafeInteger(quote.baseCredits) ||
    !isNonNegativeSafeInteger(quote.finalCredits) ||
    !isNonNegativeSafeInteger(
      quote.mandatoryAdditionalCosts?.agendaPoints,
    ) ||
    !modifiersValid ||
    (reductionSourceDefinitionIds === undefined &&
      increaseSourceDefinitionIds === undefined &&
      quote.finalCredits !== quote.baseCredits)
  ) {
    return { ...binding, complete: false };
  }
  return {
    ...binding,
    complete: true,
    baseCredits: quote.baseCredits,
    finalCredits: quote.finalCredits,
    mandatoryAdditionalCosts: {
      agendaPoints: quote.mandatoryAdditionalCosts.agendaPoints,
    },
    ...(reductionSourceDefinitionIds
      ? { reductionSourceDefinitionIds }
      : {}),
    ...(increaseSourceDefinitionIds
      ? { increaseSourceDefinitionIds }
      : {}),
  };
}

function sanitizeCounterDisplay(display: CounterDisplay): CounterDisplay {
  return {
    id: display.id,
    amount: display.amount,
    displayKind: display.displayKind,
    label: display.label,
    ariaLabel: display.ariaLabel,
    ...(display.counterType !== undefined
      ? { counterType: display.counterType }
      : {}),
    ...(display.usageHint !== undefined
      ? { usageHint: display.usageHint }
      : {}),
    ...(display.creditPool !== undefined
      ? { creditPool: sanitizeCounterCreditPool(display.creditPool) }
      : {}),
  };
}

function sanitizeCounterCreditPool(
  creditPool: NonNullable<CounterDisplay["creditPool"]>,
): NonNullable<CounterDisplay["creditPool"]> {
  return {
    kind: creditPool.kind,
    ...(creditPool.capacity !== undefined
      ? { capacity: creditPool.capacity }
      : {}),
    ...(creditPool.uses !== undefined ? { uses: creditPool.uses.slice() } : {}),
    ...(creditPool.requireHostedBreakerForIcebreakerUse
      ? { requireHostedBreakerForIcebreakerUse: true as const }
      : {}),
    ...(creditPool.refresh !== undefined
      ? {
          refresh: {
            timing: creditPool.refresh.timing,
            behavior: creditPool.refresh.behavior,
          },
        }
      : {}),
  };
}

function sanitizeVisibleEffectiveIceRunQuote(
  quote: VisibleEffectiveIceRunQuote,
): VisibleEffectiveIceRunQuote {
  return {
    iceInstanceId: quote.iceInstanceId,
    iceDefinitionId: quote.iceDefinitionId,
    effectiveStrength: quote.effectiveStrength,
    subroutines: quote.subroutines.map((subroutine) => ({
      id: subroutine.id,
      type: subroutine.type,
      ...(subroutine.amount !== undefined ? { amount: subroutine.amount } : {}),
      ...(subroutine.baseTraceStrength !== undefined
        ? { baseTraceStrength: subroutine.baseTraceStrength }
        : {}),
      ...(subroutine.traceSuccessEffect
        ? {
            traceSuccessEffect: sanitizeTraceSuccessEffect(
              subroutine.traceSuccessEffect,
            ),
          }
        : {}),
      ...(subroutine.deflectorTarget
        ? { deflectorTarget: subroutine.deflectorTarget }
        : {}),
      ...(subroutine.deflectorCost !== undefined
        ? { deflectorCost: subroutine.deflectorCost }
        : {}),
      ...(subroutine.deflectorAutoBreakIfNoTarget !== undefined
        ? {
            deflectorAutoBreakIfNoTarget:
              subroutine.deflectorAutoBreakIfNoTarget,
          }
        : {}),
      ...(subroutine.breakTags
        ? { breakTags: subroutine.breakTags.slice() }
        : {}),
      ...(subroutine.sourceDefinitionId
        ? { sourceDefinitionId: subroutine.sourceDefinitionId }
        : {}),
      ...(subroutine.sourceTitle
        ? { sourceTitle: subroutine.sourceTitle }
        : {}),
      ...(subroutine.dynamicSourceKind
        ? { dynamicSourceKind: subroutine.dynamicSourceKind }
        : {}),
      ...(subroutine.unbrokenRunEffect
        ? {
            unbrokenRunEffect: {
              ...(subroutine.unbrokenRunEffect
                .addsFutureEndTheRunSubroutines !== undefined
                ? {
                    addsFutureEndTheRunSubroutines:
                      subroutine.unbrokenRunEffect
                        .addsFutureEndTheRunSubroutines,
                  }
                : {}),
              ...(subroutine.unbrokenRunEffect
                .increasesFutureBreakCostPerSubroutine !== undefined
                ? {
                    increasesFutureBreakCostPerSubroutine:
                      subroutine.unbrokenRunEffect
                        .increasesFutureBreakCostPerSubroutine,
                  }
                : {}),
              ...(subroutine.unbrokenRunEffect.increasesFutureIceStrength !==
              undefined
                ? {
                    increasesFutureIceStrength:
                      subroutine.unbrokenRunEffect.increasesFutureIceStrength,
                  }
                : {}),
              ...(subroutine.unbrokenRunEffect.preventsFutureBreaking !==
              undefined
                ? {
                    preventsFutureBreaking:
                      subroutine.unbrokenRunEffect.preventsFutureBreaking,
                  }
                : {}),
              ...(subroutine.unbrokenRunEffect.addsFutureEncounterCost !==
              undefined
                ? {
                    addsFutureEncounterCost:
                      subroutine.unbrokenRunEffect.addsFutureEncounterCost,
                  }
                : {}),
              ...(subroutine.unbrokenRunEffect.preventsJackOut !== undefined
                ? {
                    preventsJackOut:
                      subroutine.unbrokenRunEffect.preventsJackOut,
                  }
                : {}),
              ...(subroutine.unbrokenRunEffect.causesDamageOrProgramTrash !==
              undefined
                ? {
                    causesDamageOrProgramTrash:
                      subroutine.unbrokenRunEffect.causesDamageOrProgramTrash,
                  }
                : {}),
              ...(subroutine.unbrokenRunEffect.createsRunLockOrActionTax !==
              undefined
                ? {
                    createsRunLockOrActionTax:
                      subroutine.unbrokenRunEffect.createsRunLockOrActionTax,
                  }
                : {}),
            },
          }
        : {}),
    })),
    ...(quote.breakSubroutineAdditionalCostPerSubroutine !== undefined
      ? {
          breakSubroutineAdditionalCostPerSubroutine:
            quote.breakSubroutineAdditionalCostPerSubroutine,
        }
      : {}),
    ...(quote.breakSubroutineCostSourceDefinitionIds
      ? {
          breakSubroutineCostSourceDefinitionIds:
            quote.breakSubroutineCostSourceDefinitionIds.slice(),
        }
      : {}),
    ...(quote.breakSubroutineCostSourceTitles
      ? {
          breakSubroutineCostSourceTitles:
            quote.breakSubroutineCostSourceTitles.slice(),
        }
      : {}),
  };
}

function sanitizeTraceSuccessEffect(
  effect: TraceSuccessEffect,
): TraceSuccessEffect {
  return { ...effect };
}

function sanitizeVisibleChoiceRequest(
  choice: VisibleChoiceRequest,
  playerViewStateVersion: number,
  playerViewSide: Side,
  ownCredits: number,
  ownAgendaPoints: number,
  ownScoreArea: readonly VisibleCard[],
  servers: readonly PlayerView["servers"][number][],
): VisibleChoiceRequest {
  const stackSearchResolution = sanitizeStackSearchResolution(
    choice.stackSearchResolution,
  );
  const cardSearchPresentation = sanitizeCardSearchPresentation(
    choice.cardSearchPresentation,
  );
  return {
    choiceId: choice.choiceId,
    side: choice.side,
    source: choice.source,
    prompt: choice.prompt,
    kind: choice.kind,
    options: choice.options.map((option) => {
      const value = sanitizePrimitive(option.value);
      const metadata = sanitizeChoiceOptionMetadata(option.metadata);
      const hqInstallRezOptionQuote = sanitizeCorpOptionalRezChoiceQuote(
        option.hqInstallRezOptionQuote,
        {
          choiceId: choice.choiceId,
          optionId: option.id,
          stateVersion: playerViewStateVersion,
          choiceStateVersion: choice.stateVersion,
          actorPrivateCorpChoice:
            playerViewSide === "corp" && choice.side === "corp",
          optionValue: option.value,
          optionCard: option.card,
          ownCredits,
          ownAgendaPoints,
          ownScoreArea,
          servers,
        },
      );
      return {
        id: option.id,
        label: option.label,
        ...(option.publicLabel !== undefined
          ? { publicLabel: option.publicLabel }
          : {}),
        ...(value !== undefined ? { value } : {}),
        ...(option.selectable !== undefined
          ? { selectable: option.selectable }
          : {}),
        ...(metadata ? { metadata } : {}),
        ...(option.card ? { card: sanitizeVisibleCard(option.card) } : {}),
        ...(hqInstallRezOptionQuote ? { hqInstallRezOptionQuote } : {}),
      };
    }),
    minSelections: choice.minSelections,
    maxSelections: choice.maxSelections,
    stateVersion: choice.stateVersion,
    visibility: choice.visibility,
    ...(stackSearchResolution ? { stackSearchResolution } : {}),
    ...(cardSearchPresentation ? { cardSearchPresentation } : {}),
  };
}

function sanitizeCorpOptionalRezChoiceQuote(
  value: unknown,
  expected: {
    choiceId: string;
    optionId: string;
    stateVersion: number;
    choiceStateVersion: number;
    actorPrivateCorpChoice: boolean;
    optionValue: unknown;
    optionCard: VisibleCard | undefined;
    ownCredits: number;
    ownAgendaPoints: number;
    ownScoreArea: readonly VisibleCard[];
    servers: readonly PlayerView["servers"][number][];
  },
): CorpOptionalRezChoiceQuote | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const quote = value as Record<string, unknown>;
  const boundServer =
    typeof quote.targetServerId === "string"
      ? expected.servers.find((server) => server.id === quote.targetServerId)
      : undefined;
  const boundServerCard =
    quote.installedZone === "serverIce"
      ? boundServer?.ice.find((card) => card.instanceId === quote.cardId)
      : quote.installedZone === "serverRoot"
        ? boundServer?.root.find((card) => card.instanceId === quote.cardId)
        : undefined;
  if (
    quote.schemaVersion !== CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION ||
    !expected.actorPrivateCorpChoice ||
    quote.kind !== CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND ||
    quote.context !== "hq_to_new_remote_optional_rez" ||
    quote.choiceId !== expected.choiceId ||
    quote.optionId !== expected.optionId ||
    quote.stateVersion !== expected.stateVersion ||
    quote.stateVersion !== expected.choiceStateVersion ||
    !isNonEmptyString(quote.sourceAgendaId) ||
    !isNonEmptyString(quote.cardId) ||
    !isNonEmptyString(quote.cardDefinitionId) ||
    expected.optionValue !== quote.cardId ||
    expected.optionCard?.known !== true ||
    expected.optionCard.instanceId !== quote.cardId ||
    expected.optionCard.definitionId !== quote.cardDefinitionId ||
    expected.optionCard.rezzed !== false ||
    !expected.ownScoreArea.some(
      (card) =>
        card.known === true &&
        card.type === "agenda" &&
        card.instanceId === quote.sourceAgendaId,
    ) ||
    !isNonEmptyString(quote.targetServerId) ||
    !isExistingCorpServerId(quote.targetServerId) ||
    !boundServer ||
    boundServerCard?.known !== true ||
    boundServerCard.definitionId !== quote.cardDefinitionId ||
    boundServerCard.rezzed !== false ||
    (quote.installedZone !== "serverIce" &&
      quote.installedZone !== "serverRoot") ||
    !isNonNegativeSafeInteger(quote.sequencePosition) ||
    quote.sequencePosition < 1 ||
    (quote.complete !== true && quote.complete !== false)
  )
    return undefined;

  const binding = {
    schemaVersion: CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION,
    kind: CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND,
    context: "hq_to_new_remote_optional_rez" as const,
    choiceId: quote.choiceId,
    optionId: quote.optionId,
    sourceAgendaId: quote.sourceAgendaId,
    cardId: quote.cardId,
    cardDefinitionId: quote.cardDefinitionId,
    targetServerId: quote.targetServerId,
    installedZone:
      quote.installedZone as CorpOptionalRezChoiceQuote["installedZone"],
    sequencePosition: quote.sequencePosition,
    stateVersion: quote.stateVersion,
  };
  if (quote.complete === false) {
    if (OPTIONAL_REZ_COMPLETE_QUOTE_FIELDS.some((field) => field in quote))
      return undefined;
    return { ...binding, complete: false };
  }

  const cardType = quote.cardType;
  const mandatoryAdditionalCosts = quote.mandatoryAdditionalCosts;
  const reductionSourceDefinitionIds = sanitizedStringArray(
    quote.reductionSourceDefinitionIds,
  );
  const increaseSourceDefinitionIds = sanitizedStringArray(
    quote.increaseSourceDefinitionIds,
  );
  const optionalModifierIdsValid =
    (quote.reductionSourceDefinitionIds === undefined ||
      reductionSourceDefinitionIds !== undefined) &&
    (quote.increaseSourceDefinitionIds === undefined ||
      increaseSourceDefinitionIds !== undefined) &&
    modifierDefinitionIdListsAreDisjoint(
      reductionSourceDefinitionIds,
      increaseSourceDefinitionIds,
    );
  if (
    (cardType !== "ice" &&
      cardType !== "asset" &&
      cardType !== "upgrade") ||
    (cardType === "ice") !== (quote.installedZone === "serverIce") ||
    !mandatoryAdditionalCosts ||
    typeof mandatoryAdditionalCosts !== "object" ||
    Array.isArray(mandatoryAdditionalCosts) ||
    !isNonNegativeSafeInteger(
      (mandatoryAdditionalCosts as Record<string, unknown>).agendaPoints,
    ) ||
    !isNonNegativeSafeInteger(quote.baseCredits) ||
    !isNonNegativeSafeInteger(quote.finalCredits) ||
    !isNonNegativeSafeInteger(quote.temporaryCreditsAvailable) ||
    !isNonNegativeSafeInteger(quote.temporaryCreditsApplied) ||
    !isNonNegativeSafeInteger(quote.regularCreditsAvailable) ||
    !isNonNegativeSafeInteger(quote.regularCreditsRequired) ||
    typeof quote.creditPayable !== "boolean" ||
    typeof quote.additionalCostsPayable !== "boolean" ||
    typeof quote.affordable !== "boolean" ||
    !optionalModifierIdsValid ||
    quote.temporaryCreditsApplied !==
      Math.min(quote.temporaryCreditsAvailable, quote.finalCredits) ||
    quote.regularCreditsRequired !==
      quote.finalCredits - quote.temporaryCreditsApplied ||
    quote.creditPayable !==
      (quote.regularCreditsAvailable >= quote.regularCreditsRequired) ||
    quote.regularCreditsAvailable !== expected.ownCredits ||
    quote.additionalCostsPayable !==
      (expected.ownAgendaPoints >=
        (mandatoryAdditionalCosts as { agendaPoints: number }).agendaPoints) ||
    quote.affordable !==
      (quote.creditPayable && quote.additionalCostsPayable)
  )
    return undefined;

  return {
    ...binding,
    complete: true,
    cardType,
    baseCredits: quote.baseCredits,
    finalCredits: quote.finalCredits,
    mandatoryAdditionalCosts: {
      agendaPoints: (mandatoryAdditionalCosts as { agendaPoints: number })
        .agendaPoints,
    },
    ...(reductionSourceDefinitionIds
      ? { reductionSourceDefinitionIds }
      : {}),
    ...(increaseSourceDefinitionIds ? { increaseSourceDefinitionIds } : {}),
    temporaryCreditsAvailable: quote.temporaryCreditsAvailable,
    temporaryCreditsApplied: quote.temporaryCreditsApplied,
    regularCreditsAvailable: quote.regularCreditsAvailable,
    regularCreditsRequired: quote.regularCreditsRequired,
    creditPayable: quote.creditPayable,
    additionalCostsPayable: quote.additionalCostsPayable,
    affordable: quote.affordable,
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function sanitizedStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.some((entry) => !isNonEmptyString(entry)))
    return undefined;
  const strings = value as string[];
  if (
    new Set(strings).size !== strings.length ||
    strings.some(
      (entry, index) => index > 0 && strings[index - 1]! >= entry,
    )
  )
    return undefined;
  return strings.slice();
}

function modifierDefinitionIdListsAreDisjoint(
  reductionIds: readonly string[] | undefined,
  increaseIds: readonly string[] | undefined,
): boolean {
  if (!reductionIds || !increaseIds) return true;
  const reductions = new Set(reductionIds);
  return increaseIds.every((id) => !reductions.has(id));
}

function isExistingCorpServerId(
  value: string,
): value is CorpOptionalRezChoiceQuote["targetServerId"] {
  return /^remote_[1-9][0-9]*$/.test(value);
}

const OPTIONAL_REZ_COMPLETE_QUOTE_FIELDS = [
  "cardType",
  "baseCredits",
  "finalCredits",
  "mandatoryAdditionalCosts",
  "reductionSourceDefinitionIds",
  "increaseSourceDefinitionIds",
  "temporaryCreditsAvailable",
  "temporaryCreditsApplied",
  "regularCreditsAvailable",
  "regularCreditsRequired",
  "creditPayable",
  "additionalCostsPayable",
  "affordable",
] as const;

function sanitizeLegalAction(action: LegalAction): LegalAction {
  const payload = action.payload
    ? sanitizeLegalActionPayload(action.payload as Record<string, unknown>)
    : undefined;
  return {
    actionId: action.actionId,
    side: action.side,
    type: action.type,
    label: action.label,
    source: action.source,
    timingPoint: action.timingPoint,
    costs: action.costs.map(sanitizeCost),
    targetRequirements: action.targetRequirements.map(
      sanitizeTargetRequirement,
    ),
    ...(action.choiceRequirements
      ? {
          choiceRequirements: action.choiceRequirements.map(
            sanitizeChoiceRequirement,
          ),
        }
      : {}),
    ...(action.abilityRef
      ? {
          abilityRef: {
            sourceCardInstanceId: action.abilityRef.sourceCardInstanceId,
            abilityId: action.abilityRef.abilityId,
          },
        }
      : {}),
    ...(action.effectRef ? { effectRef: action.effectRef } : {}),
    ...(action.resolvedEffects
      ? {
          resolvedEffects: action.resolvedEffects.map(
            sanitizeResolvedGameEffect,
          ),
        }
      : {}),
    visibility: action.visibility,
    expiresAtStateVersion: action.expiresAtStateVersion,
    ...(payload ? { payload } : {}),
  };
}

function sanitizeCost(cost: Cost): Cost {
  return {
    ...(cost.clicks !== undefined ? { clicks: cost.clicks } : {}),
    ...(cost.credits !== undefined ? { credits: cost.credits } : {}),
  };
}

function sanitizeTargetRequirement(
  requirement: TargetRequirement,
): TargetRequirement {
  return {
    id: requirement.id,
    kind: requirement.kind,
    ...(requirement.zoneScope
      ? { zoneScope: requirement.zoneScope.slice() }
      : {}),
    ...(requirement.side ? { side: requirement.side } : {}),
    ...(requirement.visibility ? { visibility: requirement.visibility } : {}),
    ...(requirement.allowedServers
      ? { allowedServers: requirement.allowedServers.slice() }
      : {}),
    ...(requirement.sourceIceRef
      ? { sourceIceRef: requirement.sourceIceRef }
      : {}),
    ...(requirement.allowedSides
      ? { allowedSides: requirement.allowedSides.slice() }
      : {}),
  };
}

function sanitizeChoiceRequirement(
  requirement: ChoiceRequirement,
): ChoiceRequirement {
  return {
    choiceId: requirement.choiceId,
    minSelections: requirement.minSelections,
    maxSelections: requirement.maxSelections,
    optionIds: requirement.optionIds.slice(),
  };
}

function sanitizeResolvedGameEffect(
  effect: ResolvedGameEffect,
): ResolvedGameEffect {
  return {
    effectId: effect.effectId,
    kind: effect.kind,
    visibility: effect.visibility,
    ...(effect.side ? { side: effect.side } : {}),
    ...(effect.amount !== undefined ? { amount: effect.amount } : {}),
    ...(effect.reason ? { reason: effect.reason } : {}),
    ...(effect.counterType ? { counterType: effect.counterType } : {}),
    ...(effect.removedCounterAmount !== undefined
      ? { removedCounterAmount: effect.removedCounterAmount }
      : {}),
    ...(effect.remainingCounters !== undefined
      ? { remainingCounters: effect.remainingCounters }
      : {}),
    ...(effect.addedCounterAmount !== undefined
      ? { addedCounterAmount: effect.addedCounterAmount }
      : {}),
    ...(effect.runnerTagsAfter !== undefined
      ? { runnerTagsAfter: effect.runnerTagsAfter }
      : {}),
    ...(effect.redactedKind ? { redactedKind: effect.redactedKind } : {}),
    ...(effect.sourceDefinitionId
      ? { sourceDefinitionId: effect.sourceDefinitionId }
      : {}),
    ...(effect.sourceTitle ? { sourceTitle: effect.sourceTitle } : {}),
    ...(effect.cardDefinitionId
      ? { cardDefinitionId: effect.cardDefinitionId }
      : {}),
    ...(effect.cardTitle ? { cardTitle: effect.cardTitle } : {}),
    ...(effect.serverId ? { serverId: effect.serverId } : {}),
    ...(effect.serverLabel ? { serverLabel: effect.serverLabel } : {}),
  };
}

function sanitizePublicGameEvent(event: PublicGameEvent): PublicGameEvent {
  return {
    eventId: event.eventId,
    type: event.type,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    ...(Number.isSafeInteger(event.turnSerial) && (event.turnSerial ?? -1) >= 0
      ? { turnSerial: event.turnSerial }
      : {}),
    stateHashAfter: event.stateHashAfter,
    ...(event.visibilityClass
      ? { visibilityClass: event.visibilityClass }
      : {}),
    publicPayload: sanitizePublicPayload(event.publicPayload),
  };
}

function sanitizePublicPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = sanitizeAllowedPrimitiveRecord(
    payload,
    PUBLIC_PAYLOAD_PRIMITIVE_KEYS,
  );
  for (const key of PUBLIC_PAYLOAD_STRING_ARRAY_KEYS) {
    const value = sanitizeStringArray(payload[key]);
    if (value) result[key] = value;
  }
  const amounts = sanitizeNumberRecord(payload.amounts, PUBLIC_AMOUNT_KEYS);
  if (amounts) result.amounts = amounts;
  const targets = sanitizeAllowedPrimitiveRecord(
    payload.targets,
    PUBLIC_TARGET_KEYS,
  );
  if (Object.keys(targets).length > 0) result.targets = targets;
  const visibility = sanitizePublicVisibility(payload.visibility);
  if (visibility) result.visibility = visibility;
  const baseline = sanitizeAllowedPrimitiveRecord(
    payload.baseline,
    PUBLIC_BASELINE_KEYS,
  );
  if (Object.keys(baseline).length > 0) result.baseline = baseline;
  const runnerDeck = sanitizeAllowedPrimitiveRecord(
    payload.runnerDeck,
    PUBLIC_DECK_METADATA_KEYS,
  );
  if (Object.keys(runnerDeck).length > 0) result.runnerDeck = runnerDeck;
  const corpDeck = sanitizeAllowedPrimitiveRecord(
    payload.corpDeck,
    PUBLIC_DECK_METADATA_KEYS,
  );
  if (Object.keys(corpDeck).length > 0) result.corpDeck = corpDeck;
  if (Array.isArray(payload.resolvedEffects)) {
    const resolvedEffects = payload.resolvedEffects
      .filter(
        (effect): effect is ResolvedGameEffect =>
          typeof effect === "object" &&
          effect !== null &&
          !Array.isArray(effect) &&
          (effect as Partial<ResolvedGameEffect>).visibility === "public",
      )
      .map(sanitizeResolvedGameEffect);
    if (resolvedEffects.length > 0) result.resolvedEffects = resolvedEffects;
  }
  return result;
}

function sanitizeLegalActionPayload(
  payload: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {
    ...sanitizeAllowedPrimitiveRecord(payload, LEGAL_ACTION_PAYLOAD_KEYS),
  };
  return result;
}

function sanitizeAllowedPrimitiveRecord(
  value: unknown,
  allowedKeys: ReadonlySet<string>,
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  if (!value || typeof value !== "object" || Array.isArray(value))
    return result;
  for (const key of allowedKeys) {
    const sanitized = sanitizePrimitive(
      (value as Record<string, unknown>)[key],
    );
    if (sanitized !== undefined) result[key] = sanitized;
  }
  if (
    typeof result.abilityFamily === "string" &&
    !ALLOWED_ABILITY_FAMILIES.has(result.abilityFamily as PublicAbilityFamily)
  )
    delete result.abilityFamily;
  return result;
}

function sanitizePrimitive(
  value: unknown,
): string | number | boolean | undefined {
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}

function sanitizeChoiceOptionMetadata(
  value: unknown,
):
  | NonNullable<VisibleChoiceRequest["options"][number]["metadata"]>
  | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const metadata = value as Record<string, unknown>;
  const result: NonNullable<
    VisibleChoiceRequest["options"][number]["metadata"]
  > = {};
  const creditCost = metadata.creditCost;
  if (
    typeof creditCost === "number" &&
    Number.isInteger(creditCost) &&
    creditCost >= 0
  )
    result.creditCost = creditCost;
  const postBidTraceLinkDelta = metadata.postBidTraceLinkDelta;
  if (
    typeof postBidTraceLinkDelta === "number" &&
    Number.isInteger(postBidTraceLinkDelta) &&
    postBidTraceLinkDelta > 0
  )
    result.postBidTraceLinkDelta = postBidTraceLinkDelta;
  const delayedInstallRemainingCounters =
    metadata.delayedInstallRemainingCounters;
  if (
    typeof delayedInstallRemainingCounters === "number" &&
    Number.isInteger(delayedInstallRemainingCounters) &&
    delayedInstallRemainingCounters >= 0
  )
    result.delayedInstallRemainingCounters = delayedInstallRemainingCounters;
  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const entries = value.filter(
    (entry): entry is string => typeof entry === "string",
  );
  return entries.length > 0 ? entries : undefined;
}

function sanitizeNumberRecord(
  value: unknown,
  allowedKeys: ReadonlySet<string>,
): Record<string, number> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const result: Record<string, number> = {};
  for (const key of allowedKeys) {
    const candidate = (value as Record<string, unknown>)[key];
    if (typeof candidate === "number" && Number.isFinite(candidate))
      result[key] = candidate;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizePublicVisibility(
  value: unknown,
): Record<string, string | boolean> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const raw = value as Record<string, unknown>;
  const result: Record<string, string | boolean> = {};
  if (typeof raw.class === "string") result.class = raw.class;
  if (typeof raw.hiddenZoneBarrier === "boolean")
    result.hiddenZoneBarrier = raw.hiddenZoneBarrier;
  if (typeof raw.redactedKind === "string")
    result.redactedKind = raw.redactedKind;
  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizeStackSearchResolution(
  value: VisibleChoiceRequest["stackSearchResolution"],
): VisibleChoiceRequest["stackSearchResolution"] | undefined {
  if (!value) return undefined;
  return {
    reveal: value.reveal,
    destination: value.destination,
    shuffleAfter: value.shuffleAfter,
    ...(value.publicRevealKind
      ? { publicRevealKind: value.publicRevealKind }
      : {}),
  };
}

function sanitizeCardSearchPresentation(
  value: VisibleChoiceRequest["cardSearchPresentation"],
): VisibleChoiceRequest["cardSearchPresentation"] | undefined {
  if (!value) return undefined;
  return {
    sourceZone: value.sourceZone,
    selectableFilter: value.selectableFilter,
    reveal: value.reveal,
    destination: value.destination,
    shuffleAfter: value.shuffleAfter,
    showNonMatchingCards: value.showNonMatchingCards,
    ...(value.publicRevealKind
      ? { publicRevealKind: value.publicRevealKind }
      : {}),
    ...(value.temporaryReturnAtEndOfTurn
      ? { temporaryReturnAtEndOfTurn: value.temporaryReturnAtEndOfTurn }
      : {}),
  };
}
