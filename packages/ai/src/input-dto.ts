import {
  ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS,
  CORP_HARDWARE_TRASH_PUNISH_CAPABILITY_ID,
  CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
  CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND,
  CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION,
  CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
  type AiDecisionInput,
  type AiDifficulty,
  type CorpOptionalRezChoiceQuote,
  type CorpPunishRouteIncompleteReason,
  type CorpPunishRouteQuote,
  type CorpPunishRouteQuoteSet,
  type CounterType,
  type CounterDisplay,
  type ChoiceRequirement,
  type Cost,
  type LegalAction,
  type PlayerView,
  type PublicAbilityFamily,
  type PublicGameEvent,
  type ResolvedGameEffect,
  type Side,
  type SubroutineType,
  type TargetRequirement,
  type TraceSuccessEffect,
  type VisibleCard,
  type VisibleChoiceRequest,
  type VisibleConditionalEncounterEffect,
  type VisibleCorpIcePostRezRunQuote,
  type VisibleCorpCounterBankPreparationQuote,
  type VisibleCorpIceRezResourceExchangeQuote,
  type VisibleCorpRezCostQuote,
  type VisibleCorpScoreContinuationQuote,
  type VisibleEffectiveIceRunQuote,
  type VisibleEffectiveSubroutine,
  type VisibleVariableCorpRezCostParameter,
} from "@netgrid/shared";
import {
  assertAbilityRefIdentity,
  parseCanonicalCapabilityId,
} from "@netgrid/cards/planning";

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
  "agendaInstallScoreHorizonQuoteSchemaVersion",
  "agendaInstallScoreHorizonQuoteComplete",
  "agendaInstallScoreHorizonQuoteReason",
  "agendaInstallScoreHorizonQuoteCardId",
  "agendaInstallScoreHorizonQuoteTargetServerId",
  "agendaInstallScoreHorizonQuoteExpiresAtStateVersion",
  "agendaInstallScoreHorizonQuoteAdvancementRequirement",
  "agendaInstallScoreHorizonQuoteMaximumCurrentTurnAdvances",
  "agendaInstallScoreHorizonQuoteRemainingAdvancesAfterCurrentTurn",
  "agendaInstallScoreHorizonQuoteNextCorpTurnGuaranteedFlexibleClicks",
  "postInstallRezQuoteCardId",
  "postInstallRezQuoteTargetServerId",
  "postInstallRezQuoteProjectedServerId",
  "postInstallRezQuoteExpiresAtStateVersion",
  "postInstallRezQuoteComplete",
  "postInstallRezQuoteCostKind",
  "postInstallRezQuoteBaseCredits",
  "postInstallRezQuoteFinalCredits",
  "postInstallRezQuoteMandatoryAgendaPointCost",
  "postInstallRezQuoteMandatoryAdditionalCostKind",
  "postInstallRezQuoteReductionSourceDefinitionIds",
  "postInstallRezQuoteIncreaseSourceDefinitionIds",
  "postInstallRezQuoteVariableRezKind",
  "postInstallRezQuoteVariableAdditionalCreditsPerValue",
  "postInstallRezQuoteVariableMinValue",
  "postInstallRezQuoteVariableMaxValue",
  "postInstallRezQuoteVariableMinValueFinalCredits",
  "postInstallRezQuoteVariableMaxValueFinalCredits",
  "postInstallRezQuoteVariableEffectiveStrengthFromValue",
  "postInstallRezQuoteVariableTraceLimitFromValue",
  "postInstallRezQuoteVariableAdditionalCreditsPerSubroutine",
  "postInstallRezQuoteVariableMinSubroutines",
  "postInstallRezQuoteVariableMinSubroutinesFinalCredits",
  "postInstallRezQuoteVariableFirstEndTheRunSubroutineCount",
  "postInstallRezQuoteVariableFirstEndTheRunFinalCredits",
  "postInstallRezQuoteVariableBaseSubtypes",
  "postInstallRezQuoteVariableBaseSubtypesFinalCredits",
  "postInstallRezQuoteVariableAlternateSubtypes",
  "postInstallRezQuoteVariableAlternateSubtypesAdditionalCredits",
  "postInstallRezQuoteVariableAlternateSubtypesFinalCredits",
  "agendaPointCost",
  "selfRezAdditionalCostKind",
  "discountedRezSourceCardId",
  "discountedRezSourceDefinitionId",
  "discountedRezCostBase",
  "temporaryDerezAfterRun",
  "rezCostPaid",
  "rezCostReductionAmount",
  "rezCostReductionSourceDefinitionIds",
  "corpRezCostSurchargeAmount",
  "corpRezCostSurchargeSourceDefinitionId",
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
  "cardImplementationFortRunRezSupportQuoteSchemaVersion",
  "cardImplementationFortRunRezSupportQuoteKind",
  "cardImplementationFortRunRezSupportQuoteComplete",
  "cardImplementationFortRunRezSupportQuoteSourceCardInstanceId",
  "cardImplementationFortRunRezSupportQuoteTargetServerId",
  "cardImplementationFortRunRezSupportQuoteStateVersion",
  "cardImplementationFortRunRezSupportQuoteActionId",
  "cardImplementationFortRunRezSupportQuoteRezCredits",
  "cardImplementationFortRunRezSupportQuoteFollowupCredits",
  "cardImplementationFortRunRezSupportQuoteInstallCredits",
  "cardImplementationFortRunRezSupportQuoteTotalCredits",
  "cardImplementationFortRunRezSupportQuoteTotalCreditsPayable",
  "cardImplementationFortRunRezSupportQuoteHasOwnHqIce",
  "runnerEventInstallChoiceQuoteSchemaVersion",
  "runnerEventInstallChoiceQuoteComplete",
  "runnerEventInstallChoiceQuoteSourceCapabilityKey",
  "runnerEventInstallChoiceQuoteTemporaryCredits",
  "runnerEventInstallChoiceQuoteAllowedTypes",
  "runnerEventInstallChoiceQuoteSelectableTargetIds",
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
  "targetIceId",
  "targetIceDefinitionId",
  "corpPostPassIceAbility",
  "decision",
  "paymentAmount",
  "gainCredits",
  "cardImplementationEconomyKind",
  "cardImplementationAmountPerAdvancementCounter",
  "advancementCounterCount",
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
  "afterRunUnpreventableCoreDamage",
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
  "traceValue",
  "runnerLink",
  "drawTaxSourceCount",
  "drawTaxDecision",
  "drawTaxProjectedCreditsPaid",
  "drawTaxProjectedTagsAdded",
  "runnerDrawTaxSourceCount",
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
  "sourceCardInstanceId",
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
  "traceLimit",
  "effectiveTraceLimit",
  "traceValue",
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
  "runnerDrawTaxSourceCount",
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
  "randomBreakOutcomeKind",
  "randomBreakOutcomeRoll",
  "randomBreakOutcomeSuccess",
  "randomBreakOutcomeDamageAmount",
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
  "runnerDrawTaxSourceCount",
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
  const corpPunishRouteQuoteSet = sanitizeCorpPunishRouteQuoteSet(view);
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
      gripOrHq: view.own.gripOrHq.map((card) =>
        sanitizeVisibleCardWithOptions(card, {
          allowCorpCounterBankPreparationQuote:
            view.side === "corp" &&
            card.known &&
            card.owner === "corp" &&
            card.controller === "corp",
          expectedCorpCounterBankLocation: "corp_hq",
          expectedCorpCounterBankStateVersion: view.stateVersion,
        }),
      ),
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
      ...(view.own.freeNetOrCoreDamagePreventionRemaining !== undefined
        ? {
            freeNetOrCoreDamagePreventionRemaining:
              view.own.freeNetOrCoreDamagePreventionRemaining,
          }
        : {}),
      ...(view.own.runnerTraceSupportQuote
        ? {
            runnerTraceSupportQuote: {
              traceCreditPool: view.own.runnerTraceSupportQuote.traceCreditPool,
              traceCreditSources:
                view.own.runnerTraceSupportQuote.traceCreditSources.map(
                  (source) => ({ ...source }),
                ),
              baseLinkOptions:
                view.own.runnerTraceSupportQuote.baseLinkOptions.map(
                  (option) => ({ ...option }),
                ),
              postBidLinkOptions:
                view.own.runnerTraceSupportQuote.postBidLinkOptions.map(
                  (option) => ({ ...option }),
                ),
              traceSuccessCancelOptions:
                view.own.runnerTraceSupportQuote.traceSuccessCancelOptions.map(
                  (option) => ({ ...option }),
                ),
            },
          }
        : {}),
      ...(view.own.availableBadPublicityRunCredits !== undefined
        ? {
            availableBadPublicityRunCredits:
              view.own.availableBadPublicityRunCredits,
          }
        : {}),
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
      ...(view.opponent.memoryUsed !== undefined
        ? { memoryUsed: view.opponent.memoryUsed }
        : {}),
      ...(view.opponent.memoryLimit !== undefined
        ? { memoryLimit: view.opponent.memoryLimit }
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
          allowCorpPostRezRunQuote:
            view.side === "corp" &&
            card.known &&
            card.owner === "corp" &&
            card.controller === "corp" &&
            card.type === "ice" &&
            card.rezzed === false,
          expectedCorpRezServerId: server.id,
          expectedCorpRezStateVersion: view.stateVersion,
        }),
      ),
      root: server.root.map((card) =>
        sanitizeVisibleCardWithOptions(card, {
          allowCorpScoreContinuationQuote:
            view.side === "corp" &&
            card.known &&
            card.owner === "corp" &&
            card.controller === "corp" &&
            card.type === "agenda",
          expectedCorpScoreServerId: server.id,
          expectedCorpScoreStateVersion: view.stateVersion,
          allowCorpCounterBankPreparationQuote:
            view.side === "corp" &&
            card.known &&
            card.owner === "corp" &&
            card.controller === "corp",
          expectedCorpCounterBankLocation: "installed_root",
          expectedCorpCounterBankServerId: server.id,
          expectedCorpCounterBankStateVersion: view.stateVersion,
        }),
      ),
      ...(server.counterDisplays
        ? {
            counterDisplays: server.counterDisplays.map(sanitizeCounterDisplay),
          }
        : {}),
      ...(server.statuses
        ? { statuses: server.statuses.map((status) => ({ ...status })) }
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
    ...(corpPunishRouteQuoteSet ? { corpPunishRouteQuoteSet } : {}),
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
            ...(view.run.runnerRunTemporaryCredits
              ? {
                  runnerRunTemporaryCredits: {
                    ...view.run.runnerRunTemporaryCredits,
                  },
                }
              : {}),
            ...(view.run.unpreventableCoreDamageAtRunEnd
              ? {
                  unpreventableCoreDamageAtRunEnd: {
                    ...view.run.unpreventableCoreDamageAtRunEnd,
                  },
                }
              : {}),
            ...(view.run.runTraceLinkBonus !== undefined
              ? { runTraceLinkBonus: view.run.runTraceLinkBonus }
              : {}),
            ...(view.run.corpRezCostSurcharge
              ? {
                  corpRezCostSurcharge: {
                    ...view.run.corpRezCostSurcharge,
                  },
                }
              : {}),
            ...(view.run.eventApproachIceExposeBeforeRez
              ? { eventApproachIceExposeBeforeRez: true }
              : {}),
            ...(view.run.prohibitNoisyIcebreakers
              ? { prohibitNoisyIcebreakers: true }
              : {}),
            ...(view.run.runnerCreditGainOnCorpRez !== undefined
              ? {
                  runnerCreditGainOnCorpRez: view.run.runnerCreditGainOnCorpRez,
                }
              : {}),
            ...(view.run.damagePreventionPool
              ? { damagePreventionPool: { ...view.run.damagePreventionPool } }
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

export function sanitizeCorpPunishRouteQuoteSet(
  view: PlayerView,
): CorpPunishRouteQuoteSet | undefined {
  const quoteSet = view.corpPunishRouteQuoteSet;
  if (
    view.side !== "corp" ||
    !quoteSet ||
    quoteSet.schemaVersion !== CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION ||
    quoteSet.visibility !== "private_to_actor" ||
    quoteSet.side !== "corp" ||
    !nonNegativeInteger(quoteSet.stateVersion) ||
    quoteSet.stateVersion !== view.stateVersion ||
    quoteSet.timingPoint !== view.timingPoint ||
    !validCompleteState(
      quoteSet.complete,
      quoteSet.incompleteReasons,
      quoteSet.complete && quoteSet.routes.length === 0,
    ) ||
    !nonNegativeInteger(quoteSet.runnerHandCount) ||
    quoteSet.runnerHandCount !== view.opponent.handCount ||
    !nonNegativeInteger(quoteSet.runnerTags) ||
    quoteSet.runnerTags !== view.opponent.tags ||
    !nonNegativeInteger(quoteSet.runnerCreditsVisible) ||
    quoteSet.runnerCreditsVisible !== view.opponent.credits ||
    !uniqueNonblankStrings(quoteSet.routes.map((route) => route.routeId)) ||
    !uniqueNonblankStrings(
      quoteSet.routes.map((route) => route.requestFingerprint),
    ) ||
    quoteSet.routes.some(
      (route) => !validCorpPunishRouteQuote(route, quoteSet, view),
    )
  )
    return undefined;

  return {
    schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    visibility: "private_to_actor",
    side: "corp",
    stateVersion: quoteSet.stateVersion,
    timingPoint: quoteSet.timingPoint,
    complete: quoteSet.complete,
    incompleteReasons: quoteSet.incompleteReasons.slice(),
    runnerHandCount: quoteSet.runnerHandCount,
    runnerTags: quoteSet.runnerTags,
    runnerCreditsVisible: quoteSet.runnerCreditsVisible,
    routes: quoteSet.routes.map((route) => ({
      schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
      visibility: "private_to_actor",
      matchId: route.matchId,
      side: "corp",
      routeId: route.routeId,
      campaignId: route.campaignId,
      campaignIdOrigin: route.campaignIdOrigin,
      stateVersion: route.stateVersion,
      timingPoint: route.timingPoint,
      requestFingerprint: route.requestFingerprint,
      requestEcho: {
        schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
        matchId: route.requestEcho.matchId,
        side: "corp",
        stateVersion: route.requestEcho.stateVersion,
        timingPoint: route.requestEcho.timingPoint,
        campaignId: route.requestEcho.campaignId,
        routeId: route.requestEcho.routeId,
        steps: route.requestEcho.steps.map((step) => ({ ...step })),
      },
      complete: route.complete,
      incompleteReasons: route.incompleteReasons.slice(),
      steps: route.steps.map((step, index) => ({
        stepId: step.stepId,
        order: step.order,
        kind: step.kind,
        sourceCardInstanceId: step.sourceCardInstanceId,
        sourceCardDefinitionId: step.sourceCardDefinitionId,
        sourceCapabilityBindingKind: step.sourceCapabilityBindingKind,
        sourceCapabilityId: step.sourceCapabilityId,
        clicks: step.clicks,
        credits: step.credits,
        ...(step.hardwareTrashProjection
          ? {
              hardwareTrashProjection: {
                ...step.hardwareTrashProjection,
                eligibleTargetInstanceIds:
                  step.hardwareTrashProjection.eligibleTargetInstanceIds.slice(),
              },
            }
          : {}),
        ...(index === 0 && step.currentLegalAction
          ? { currentLegalAction: sanitizeLegalAction(step.currentLegalAction) }
          : {}),
      })),
      totalClicks: route.totalClicks,
      totalActionCredits: route.totalActionCredits,
      tagTrigger: { ...route.tagTrigger },
      responsePaymentEnvelope: {
        responseKind: route.responsePaymentEnvelope.responseKind,
        paymentKnowledge: route.responsePaymentEnvelope.paymentKnowledge,
        corpCreditsAvailable:
          route.responsePaymentEnvelope.corpCreditsAvailable,
        runnerCreditsVisible:
          route.responsePaymentEnvelope.runnerCreditsVisible,
        corpResponseCredits: {
          ...route.responsePaymentEnvelope.corpResponseCredits,
        },
        totalCorpCredits: {
          ...route.responsePaymentEnvelope.totalCorpCredits,
        },
        runnerResponseCredits: {
          ...route.responsePaymentEnvelope.runnerResponseCredits,
        },
      },
      damageEnvelope: {
        runnerHandCount: route.damageEnvelope.runnerHandCount,
        rawDamage: { ...route.damageEnvelope.rawDamage },
        effectiveDamage: { ...route.damageEnvelope.effectiveDamage },
        visiblePrevention: {
          knowledge: route.damageEnvelope.visiblePrevention.knowledge,
          maximumPreventableDamage:
            route.damageEnvelope.visiblePrevention.maximumPreventableDamage,
          creditCost: {
            ...route.damageEnvelope.visiblePrevention.creditCost,
          },
        },
        visiblePiercing: {
          knowledge: route.damageEnvelope.visiblePiercing.knowledge,
          maximumBypassedDamage:
            route.damageEnvelope.visiblePiercing.maximumBypassedDamage,
          creditCost: {
            ...route.damageEnvelope.visiblePiercing.creditCost,
          },
        },
      },
      guarantee: route.guarantee,
      responseKnowledge: route.responseKnowledge,
    })),
  };
}

function validCorpPunishRouteQuote(
  route: CorpPunishRouteQuote,
  quoteSet: CorpPunishRouteQuoteSet,
  view: PlayerView,
): boolean {
  if (
    route.schemaVersion !== CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION ||
    route.visibility !== "private_to_actor" ||
    !nonblank(route.matchId) ||
    route.side !== "corp" ||
    !nonblank(route.routeId) ||
    !nonblank(route.campaignId) ||
    route.campaignIdOrigin !== "request_binding" ||
    route.stateVersion !== quoteSet.stateVersion ||
    route.timingPoint !== quoteSet.timingPoint ||
    !validPunishRequestEcho(route) ||
    route.requestFingerprint !== punishRequestFingerprint(route.requestEcho) ||
    !validCompleteState(
      route.complete,
      route.incompleteReasons,
      route.complete && route.steps.length === 0,
    )
  )
    return false;

  if (!route.complete) return validCanonicalIncompletePunishRoute(route);

  if (
    !nonNegativeInteger(route.totalClicks) ||
    !nonNegativeInteger(route.totalActionCredits) ||
    !validOrderedPunishSteps(route, quoteSet, view) ||
    route.steps.reduce((sum, step) => sum + step.clicks, 0) !==
      route.totalClicks ||
    route.steps.reduce((sum, step) => sum + step.credits, 0) !==
      route.totalActionCredits ||
    !validTagTrigger(route, quoteSet) ||
    !validResponsePaymentEnvelope(route, quoteSet, view) ||
    !validDamageEnvelope(route, quoteSet) ||
    (route.responseKnowledge !== "public_exact" &&
      route.responseKnowledge !== "public_bounded" &&
      route.responseKnowledge !== "unknown")
  )
    return false;

  return (
    route.guarantee === "guaranteed" ||
    route.guarantee === "conditional_on_runner_response" ||
    route.guarantee === "not_guaranteed" ||
    route.guarantee === "unknown"
  );
}

function validPunishRequestEcho(route: CorpPunishRouteQuote): boolean {
  const request = route.requestEcho;
  return (
    request.schemaVersion === CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION &&
    request.matchId === route.matchId &&
    request.side === "corp" &&
    request.stateVersion === route.stateVersion &&
    request.timingPoint === route.timingPoint &&
    request.campaignId === route.campaignId &&
    request.routeId === route.routeId &&
    request.steps.length >= 1 &&
    request.steps.length <= 6 &&
    uniqueNonblankStrings(request.steps.map((step) => step.stepId)) &&
    uniqueNonblankStrings(
      request.steps.map(
        (step) =>
          `${step.sourceCardInstanceId}\u0000${step.sourceCapabilityId}`,
      ),
    ) &&
    uniqueNonblankStrings(
      request.steps.map((step) => step.sourceCardInstanceId),
    ) &&
    request.steps.every(
      (step, index) =>
        step.order === index &&
        validPunishStepKind(step.kind) &&
        nonblank(step.sourceCardInstanceId) &&
        (step.sourceCapabilityBindingKind ===
          "legacy_card_implementation_index" ||
          step.sourceCapabilityBindingKind === "card_spec_capability_key") &&
        nonblank(step.sourceCapabilityId) &&
        (step.currentLegalActionId === undefined ||
          (index === 0 && nonblank(step.currentLegalActionId))),
    ) &&
    (!route.complete ||
      request.steps.every((requested, index) => {
        const quoted = route.steps[index];
        return (
          quoted !== undefined &&
          requested.stepId === quoted.stepId &&
          requested.order === quoted.order &&
          requested.kind === quoted.kind &&
          requested.sourceCardInstanceId === quoted.sourceCardInstanceId &&
          requested.sourceCapabilityBindingKind ===
            quoted.sourceCapabilityBindingKind &&
          requested.sourceCapabilityId === quoted.sourceCapabilityId
        );
      }))
  );
}

function validCanonicalIncompletePunishRoute(
  route: CorpPunishRouteQuote,
): boolean {
  return (
    route.steps.length === 0 &&
    route.totalClicks === 0 &&
    route.totalActionCredits === 0 &&
    route.tagTrigger.kind === "unknown" &&
    route.tagTrigger.status === "unknown" &&
    route.tagTrigger.currentRunnerTags === 0 &&
    route.tagTrigger.requiredRunnerTags === 0 &&
    route.responsePaymentEnvelope.responseKind === "unknown" &&
    route.responsePaymentEnvelope.paymentKnowledge === "unknown" &&
    route.responsePaymentEnvelope.corpCreditsAvailable === 0 &&
    route.responsePaymentEnvelope.runnerCreditsVisible === 0 &&
    zeroRange(route.responsePaymentEnvelope.corpResponseCredits) &&
    zeroRange(route.responsePaymentEnvelope.totalCorpCredits) &&
    zeroRange(route.responsePaymentEnvelope.runnerResponseCredits) &&
    route.damageEnvelope.runnerHandCount === 0 &&
    route.damageEnvelope.rawDamage.meat === 0 &&
    route.damageEnvelope.rawDamage.net === 0 &&
    route.damageEnvelope.rawDamage.core === 0 &&
    route.damageEnvelope.rawDamage.total === 0 &&
    zeroRange(route.damageEnvelope.effectiveDamage) &&
    route.damageEnvelope.visiblePrevention.knowledge === "unknown" &&
    route.damageEnvelope.visiblePrevention.maximumPreventableDamage === 0 &&
    zeroRange(route.damageEnvelope.visiblePrevention.creditCost) &&
    route.damageEnvelope.visiblePiercing.knowledge === "unknown" &&
    route.damageEnvelope.visiblePiercing.maximumBypassedDamage === 0 &&
    zeroRange(route.damageEnvelope.visiblePiercing.creditCost) &&
    route.guarantee === "unknown" &&
    route.responseKnowledge === "unknown"
  );
}

function validCompleteState(
  complete: boolean,
  reasons: CorpPunishRouteIncompleteReason[],
  structurallyIncomplete: boolean,
): boolean {
  return (
    typeof complete === "boolean" &&
    reasons.every(isCorpPunishRouteIncompleteReason) &&
    (complete
      ? reasons.length === 0 && !structurallyIncomplete
      : reasons.length > 0)
  );
}

function validOrderedPunishSteps(
  route: CorpPunishRouteQuote,
  quoteSet: CorpPunishRouteQuoteSet,
  view: PlayerView,
): boolean {
  if (
    !uniqueNonblankStrings(route.steps.map((step) => step.stepId)) ||
    route.steps.some(
      (step, index) =>
        step.order !== index ||
        !nonblank(step.sourceCardInstanceId) ||
        !nonblank(step.sourceCardDefinitionId) ||
        !nonblank(step.sourceCapabilityId) ||
        !validPunishStepKind(step.kind) ||
        !nonNegativeInteger(step.clicks) ||
        !nonNegativeInteger(step.credits) ||
        !validHardwareTrashProjection(step, view) ||
        (index > 0 && step.currentLegalAction !== undefined),
    )
  )
    return false;

  const head = route.steps[0];
  const action = head?.currentLegalAction;
  const requestedHeadActionId =
    route.requestEcho.steps[0]?.currentLegalActionId;
  const visibleCurrentAction = action
    ? view.legalActions.find(
        (candidate) => candidate.actionId === action.actionId,
      )
    : undefined;
  return (
    (requestedHeadActionId === undefined ||
      (action !== undefined && action.actionId === requestedHeadActionId)) &&
    (!action ||
      (visibleCurrentAction !== undefined &&
        action.side === "corp" &&
        action.source === head.sourceCardInstanceId &&
        action.timingPoint === quoteSet.timingPoint &&
        action.expiresAtStateVersion === quoteSet.stateVersion &&
        action.source === visibleCurrentAction.source &&
        action.timingPoint === visibleCurrentAction.timingPoint &&
        action.expiresAtStateVersion ===
          visibleCurrentAction.expiresAtStateVersion &&
        action.costs.reduce((sum, cost) => sum + (cost.clicks ?? 0), 0) ===
          head.clicks &&
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0) ===
          head.credits &&
        validCurrentHardwareTrashAction(action, head)))
  );
}

function validHardwareTrashProjection(
  step: CorpPunishRouteQuote["steps"][number],
  view: PlayerView,
): boolean {
  const projection = step.hardwareTrashProjection;
  if (step.kind !== "hardware_trash") return projection === undefined;
  if (
    !projection ||
    step.sourceCapabilityId !== CORP_HARDWARE_TRASH_PUNISH_CAPABILITY_ID ||
    projection.kind !== "installed_runner_hardware" ||
    projection.targetKnowledge !== "public_exact" ||
    projection.excludedSubtype !== "cybernetics" ||
    projection.costKind !== "variable_x" ||
    projection.preventionKnowledge !== "none_visible" ||
    !uniqueNonblankStrings(projection.eligibleTargetInstanceIds) ||
    !nonNegativeInteger(projection.eligibleTargetCount) ||
    projection.eligibleTargetCount !==
      projection.eligibleTargetInstanceIds.length ||
    projection.eligibleTargetCount < 1 ||
    !nonNegativeInteger(projection.minimumX) ||
    projection.minimumX < 1 ||
    !nonNegativeInteger(projection.selectedX) ||
    projection.selectedX < projection.minimumX ||
    !nonNegativeInteger(projection.legalMaximumX) ||
    projection.legalMaximumX < projection.selectedX ||
    projection.legalMaximumX > projection.eligibleTargetCount ||
    !nonNegativeInteger(projection.creditsPerX) ||
    projection.creditsPerX < 1 ||
    step.credits !== projection.selectedX * projection.creditsPerX
  ) {
    return false;
  }
  const visibleEligibleIds = (view.opponent.rig ?? [])
    .filter(
      (card) =>
        card.known === true &&
        card.owner === "runner" &&
        card.controller === "runner" &&
        card.type === "hardware" &&
        card.subtypes?.some(
          (subtype) =>
            normalizePunishSubtype(subtype) ===
            normalizePunishSubtype(projection.excludedSubtype),
        ) !== true,
    )
    .map((card) => card.instanceId)
    .sort();
  const quotedIds = projection.eligibleTargetInstanceIds.slice().sort();
  return (
    visibleEligibleIds.length === quotedIds.length &&
    visibleEligibleIds.every((cardId, index) => cardId === quotedIds[index])
  );
}

function validCurrentHardwareTrashAction(
  action: LegalAction,
  step: CorpPunishRouteQuote["steps"][number],
): boolean {
  const projection = step.hardwareTrashProjection;
  if (!projection) return step.kind !== "hardware_trash";
  return (
    action.payload?.hardwareTrashByCounterTrashCount === projection.selectedX &&
    action.payload?.eligibleHardwareCount === projection.eligibleTargetCount &&
    action.payload?.xValue === projection.selectedX &&
    action.payload?.xMinimum === projection.minimumX &&
    action.payload?.xMaximum === projection.legalMaximumX &&
    action.payload?.xUpperBound === projection.legalMaximumX &&
    action.payload?.xCreditsPerUnit === projection.creditsPerX &&
    action.payload?.variableCostKind === "printed_play_cost"
  );
}

function normalizePunishSubtype(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function validTagTrigger(
  route: CorpPunishRouteQuote,
  quoteSet: CorpPunishRouteQuoteSet,
): boolean {
  const trigger = route.tagTrigger;
  if (
    !nonNegativeInteger(trigger.currentRunnerTags) ||
    trigger.currentRunnerTags !== quoteSet.runnerTags ||
    !nonNegativeInteger(trigger.requiredRunnerTags)
  )
    return false;
  switch (trigger.kind) {
    case "existing_tag":
      return trigger.status === "satisfied";
    case "direct_tag_step":
      return (
        trigger.status === "projected" &&
        nonblank(trigger.sourceStepId) &&
        route.steps.some((step) => step.stepId === trigger.sourceStepId)
      );
    case "trace_tag_step":
      return (
        trigger.status === "response_required" &&
        nonblank(trigger.sourceStepId) &&
        route.steps.some((step) => step.stepId === trigger.sourceStepId) &&
        nonNegativeInteger(trigger.traceLimit)
      );
    case "none":
      return (
        trigger.status === "not_required" && trigger.requiredRunnerTags === 0
      );
    case "unknown":
      return trigger.status === "unknown";
    default:
      return false;
  }
}

function validResponsePaymentEnvelope(
  route: CorpPunishRouteQuote,
  quoteSet: CorpPunishRouteQuoteSet,
  view: PlayerView,
): boolean {
  const envelope = route.responsePaymentEnvelope;
  return (
    (envelope.responseKind === "none" ||
      envelope.responseKind === "runner_optional" ||
      envelope.responseKind === "trace_bid" ||
      envelope.responseKind === "mixed" ||
      envelope.responseKind === "unknown") &&
    (envelope.paymentKnowledge === "exact_public" ||
      envelope.paymentKnowledge === "bounded_public" ||
      envelope.paymentKnowledge === "unknown") &&
    nonNegativeInteger(envelope.corpCreditsAvailable) &&
    envelope.corpCreditsAvailable === view.own.credits &&
    nonNegativeInteger(envelope.runnerCreditsVisible) &&
    envelope.runnerCreditsVisible === quoteSet.runnerCreditsVisible &&
    validRange(envelope.corpResponseCredits) &&
    validRange(envelope.totalCorpCredits) &&
    envelope.totalCorpCredits.minimum ===
      route.totalActionCredits + envelope.corpResponseCredits.minimum &&
    envelope.totalCorpCredits.maximum ===
      route.totalActionCredits + envelope.corpResponseCredits.maximum &&
    validRange(envelope.runnerResponseCredits) &&
    envelope.runnerResponseCredits.maximum <= quoteSet.runnerCreditsVisible
  );
}

function validDamageEnvelope(
  route: CorpPunishRouteQuote,
  quoteSet: CorpPunishRouteQuoteSet,
): boolean {
  const envelope = route.damageEnvelope;
  const raw = envelope.rawDamage;
  return (
    (envelope.visiblePrevention.knowledge === "none_visible" ||
      envelope.visiblePrevention.knowledge === "exact_public" ||
      envelope.visiblePrevention.knowledge === "bounded_public" ||
      envelope.visiblePrevention.knowledge === "unknown") &&
    (envelope.visiblePiercing.knowledge === "none_visible" ||
      envelope.visiblePiercing.knowledge === "exact_public" ||
      envelope.visiblePiercing.knowledge === "bounded_public" ||
      envelope.visiblePiercing.knowledge === "unknown") &&
    nonNegativeInteger(envelope.runnerHandCount) &&
    envelope.runnerHandCount === quoteSet.runnerHandCount &&
    nonNegativeInteger(raw.meat) &&
    nonNegativeInteger(raw.net) &&
    nonNegativeInteger(raw.core) &&
    nonNegativeInteger(raw.total) &&
    raw.total === raw.meat + raw.net + raw.core &&
    validRange(envelope.effectiveDamage) &&
    envelope.effectiveDamage.maximum <= raw.total &&
    nonNegativeInteger(envelope.visiblePrevention.maximumPreventableDamage) &&
    envelope.visiblePrevention.maximumPreventableDamage <= raw.total &&
    validRange(envelope.visiblePrevention.creditCost) &&
    nonNegativeInteger(envelope.visiblePiercing.maximumBypassedDamage) &&
    envelope.visiblePiercing.maximumBypassedDamage <= raw.total &&
    validRange(envelope.visiblePiercing.creditCost)
  );
}

function validPunishStepKind(
  value: CorpPunishRouteQuote["steps"][number]["kind"],
): boolean {
  return (
    value === "tag" ||
    value === "trace_tag" ||
    value === "meat_damage" ||
    value === "net_damage" ||
    value === "core_damage" ||
    value === "hardware_trash" ||
    value === "other_punish"
  );
}

function validRange(range: { minimum: number; maximum: number }): boolean {
  return (
    nonNegativeInteger(range.minimum) &&
    nonNegativeInteger(range.maximum) &&
    range.minimum <= range.maximum
  );
}

function zeroRange(range: { minimum: number; maximum: number }): boolean {
  return range.minimum === 0 && range.maximum === 0;
}

function punishRequestFingerprint(
  request: CorpPunishRouteQuote["requestEcho"],
): string {
  return encodePunishFingerprintParts([
    CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    request.matchId,
    request.side,
    String(request.stateVersion),
    request.timingPoint,
    request.campaignId,
    request.routeId,
    String(request.steps.length),
    ...request.steps.flatMap((step) => [
      step.stepId,
      String(step.order),
      step.kind,
      step.sourceCardInstanceId,
      step.sourceCapabilityBindingKind,
      step.sourceCapabilityId,
      ...(step.currentLegalActionId ? [step.currentLegalActionId] : []),
    ]),
  ]);
}

function encodePunishFingerprintParts(parts: readonly string[]): string {
  return `${parts.length};${parts
    .map((part) => `${part.length}:${part}`)
    .join("")}`;
}

function uniqueNonblankStrings(values: readonly string[]): boolean {
  return values.every(nonblank) && new Set(values).size === values.length;
}

function nonblank(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function nonNegativeInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

function isCorpPunishRouteIncompleteReason(
  value: CorpPunishRouteIncompleteReason,
): boolean {
  return (
    value === "malformed_route_request" ||
    value === "source_unavailable" ||
    value === "source_zone_unsupported" ||
    value === "source_identity_unknown" ||
    value === "source_capability_missing" ||
    value === "source_capability_unsupported" ||
    value === "source_effects_unsupported" ||
    value === "source_condition_unsatisfied" ||
    value === "head_legal_action_unavailable" ||
    value === "cost_quote_incomplete" ||
    value === "target_quote_incomplete" ||
    value === "response_window_unknown" ||
    value === "trash_prevention_quote_incomplete" ||
    value === "damage_prevention_quote_incomplete" ||
    value === "future_state_transition_unavailable"
  );
}

function sanitizeVisibleCard(card: VisibleCard): VisibleCard {
  return sanitizeVisibleCardWithOptions(card);
}

function sanitizeVisibleCardWithOptions(
  card: VisibleCard,
  options: {
    allowCorpRezCostQuote?: boolean;
    allowCorpPostRezRunQuote?: boolean;
    expectedCorpRezServerId?: PlayerView["servers"][number]["id"];
    expectedCorpRezStateVersion?: number;
    allowCorpScoreContinuationQuote?: boolean;
    expectedCorpScoreServerId?: PlayerView["servers"][number]["id"];
    expectedCorpScoreStateVersion?: number;
    allowCorpCounterBankPreparationQuote?: boolean;
    expectedCorpCounterBankLocation?: "corp_hq" | "installed_root";
    expectedCorpCounterBankServerId?: PlayerView["servers"][number]["id"];
    expectedCorpCounterBankStateVersion?: number;
  } = {},
): VisibleCard {
  const effectiveRunQuote = card.effectiveRunQuote;
  const effectivePostRezRunQuote = card.effectivePostRezRunQuote;
  const effectiveRezCostQuote = card.effectiveRezCostQuote;
  const effectiveRezResourceExchangeQuote =
    card.effectiveRezResourceExchangeQuote;
  const scoreContinuationQuote = card.scoreContinuationQuote;
  const counterBankPreparationQuote = card.counterBankPreparationQuote;
  const includeEffectiveRezCostQuote =
    options.allowCorpRezCostQuote === true &&
    effectiveRezCostQuote?.context === "installed" &&
    effectiveRezCostQuote.cardId === card.instanceId &&
    effectiveRezCostQuote.targetServerId === options.expectedCorpRezServerId &&
    effectiveRezCostQuote.projectedServerId ===
      options.expectedCorpRezServerId &&
    effectiveRezCostQuote.expiresAtStateVersion ===
      options.expectedCorpRezStateVersion;
  const includeEffectivePostRezRunQuote =
    options.allowCorpPostRezRunQuote === true &&
    effectivePostRezRunQuote?.context === "installed_post_rez" &&
    effectivePostRezRunQuote.cardId === card.instanceId &&
    effectivePostRezRunQuote.iceDefinitionId === card.definitionId &&
    effectivePostRezRunQuote.targetServerId ===
      options.expectedCorpRezServerId &&
    effectivePostRezRunQuote.projectedServerId ===
      options.expectedCorpRezServerId &&
    effectivePostRezRunQuote.expiresAtStateVersion ===
      options.expectedCorpRezStateVersion;
  const includeEffectiveRezResourceExchangeQuote =
    options.allowCorpRezCostQuote === true &&
    effectiveRezResourceExchangeQuote?.context === "installed" &&
    effectiveRezResourceExchangeQuote.cardId === card.instanceId &&
    effectiveRezResourceExchangeQuote.targetServerId ===
      options.expectedCorpRezServerId &&
    effectiveRezResourceExchangeQuote.projectedServerId ===
      options.expectedCorpRezServerId &&
    effectiveRezResourceExchangeQuote.expiresAtStateVersion ===
      options.expectedCorpRezStateVersion;
  const includeScoreContinuationQuote =
    options.allowCorpScoreContinuationQuote === true &&
    scoreContinuationQuote?.context === "installed_agenda" &&
    scoreContinuationQuote.agendaCardId === card.instanceId &&
    scoreContinuationQuote.serverId === options.expectedCorpScoreServerId &&
    scoreContinuationQuote.expiresAtStateVersion ===
      options.expectedCorpScoreStateVersion;
  const counterBankLocationMatches =
    counterBankPreparationQuote !== undefined &&
    counterBankPreparationQuote.location.kind ===
      options.expectedCorpCounterBankLocation &&
    (counterBankPreparationQuote.location.kind !== "installed_root" ||
      counterBankPreparationQuote.location.serverId ===
        options.expectedCorpCounterBankServerId);
  const includeCounterBankPreparationQuote =
    options.allowCorpCounterBankPreparationQuote === true &&
    counterBankPreparationQuote?.context === "corp_counter_bank_preparation" &&
    counterBankPreparationQuote.sourceCardId === card.instanceId &&
    counterBankPreparationQuote.expiresAtStateVersion ===
      options.expectedCorpCounterBankStateVersion &&
    counterBankLocationMatches;
  const sanitizedCounterBankPreparationQuote =
    includeCounterBankPreparationQuote && counterBankPreparationQuote
      ? sanitizeCorpCounterBankPreparationQuote(counterBankPreparationQuote)
      : undefined;
  const sanitizedEffectiveRunQuote =
    card.known === true &&
    card.type === "ice" &&
    card.rezzed === true &&
    effectiveRunQuote?.iceInstanceId === card.instanceId &&
    effectiveRunQuote.iceDefinitionId === card.definitionId
      ? sanitizeVisibleEffectiveIceRunQuote(effectiveRunQuote)
      : undefined;
  const sanitizedEffectivePostRezRunQuote =
    includeEffectivePostRezRunQuote && effectivePostRezRunQuote
      ? sanitizeVisibleCorpIcePostRezRunQuote(effectivePostRezRunQuote)
      : undefined;
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
    ...(card.concealed !== undefined ? { concealed: card.concealed } : {}),
    ...(card.hiddenRunnerResource !== undefined
      ? { hiddenRunnerResource: card.hiddenRunnerResource }
      : {}),
    ...(card.hostedOn !== undefined ? { hostedOn: card.hostedOn } : {}),
    ...(card.owner !== undefined ? { owner: card.owner } : {}),
    ...(card.controller !== undefined ? { controller: card.controller } : {}),
    ...(sanitizedEffectiveRunQuote
      ? {
          effectiveRunQuote: sanitizedEffectiveRunQuote,
        }
      : {}),
    ...(sanitizedEffectivePostRezRunQuote
      ? { effectivePostRezRunQuote: sanitizedEffectivePostRezRunQuote }
      : {}),
    ...(includeEffectiveRezCostQuote && effectiveRezCostQuote
      ? {
          effectiveRezCostQuote: sanitizeInstalledCorpRezCostQuote(
            effectiveRezCostQuote,
          ),
        }
      : {}),
    ...(includeEffectiveRezResourceExchangeQuote &&
    effectiveRezResourceExchangeQuote
      ? {
          effectiveRezResourceExchangeQuote:
            sanitizeInstalledCorpIceRezResourceExchangeQuote(
              effectiveRezResourceExchangeQuote,
            ),
        }
      : {}),
    ...(includeScoreContinuationQuote && scoreContinuationQuote
      ? {
          scoreContinuationQuote: sanitizeInstalledCorpScoreContinuationQuote(
            scoreContinuationQuote,
          ),
        }
      : {}),
    ...(sanitizedCounterBankPreparationQuote
      ? {
          counterBankPreparationQuote: sanitizedCounterBankPreparationQuote,
        }
      : {}),
  };
}

function sanitizeCorpCounterBankPreparationQuote(
  quote: VisibleCorpCounterBankPreparationQuote,
): VisibleCorpCounterBankPreparationQuote | undefined {
  const location = quote.location;
  if (
    quote.schemaVersion !==
      CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION ||
    quote.context !== "corp_counter_bank_preparation" ||
    !nonblank(quote.sourceCardId) ||
    !isNonNegativeSafeInteger(quote.expiresAtStateVersion) ||
    !isNonNegativeSafeInteger(quote.advancementCounters) ||
    quote.advanceableBeforeRez !== true ||
    quote.activatedAbilitiesRequireRez !== true ||
    quote.cashout.advancementCounterCost !== 1 ||
    quote.cashout.creditGain !== 1 ||
    quote.cashout.actionCost !== 0 ||
    quote.transfer.actionCost !== 1 ||
    quote.transfer.minimumSourceCounters !== 1 ||
    quote.transfer.source !== "source_card" ||
    quote.transfer.target !== "chosen_installed_advanceable_card" ||
    quote.transfer.maximum !== "all" ||
    (location.kind !== "corp_hq" &&
      (location.kind !== "installed_root" || !nonblank(location.serverId)))
  ) {
    return undefined;
  }
  return {
    schemaVersion: CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
    context: "corp_counter_bank_preparation",
    sourceCardId: quote.sourceCardId,
    expiresAtStateVersion: quote.expiresAtStateVersion,
    location:
      location.kind === "corp_hq"
        ? { kind: "corp_hq" }
        : { kind: "installed_root", serverId: location.serverId },
    advancementCounters: quote.advancementCounters,
    advanceableBeforeRez: true,
    activatedAbilitiesRequireRez: true,
    cashout: {
      advancementCounterCost: 1,
      creditGain: 1,
      actionCost: 0,
    },
    transfer: {
      actionCost: 1,
      minimumSourceCounters: 1,
      source: "source_card",
      target: "chosen_installed_advanceable_card",
      maximum: "all",
    },
  };
}

function sanitizeInstalledCorpScoreContinuationQuote(
  quote: Extract<
    VisibleCorpScoreContinuationQuote,
    {
      context: "installed_agenda";
    }
  >,
): VisibleCorpScoreContinuationQuote {
  const binding = {
    context: "installed_agenda" as const,
    agendaCardId: quote.agendaCardId,
    serverId: quote.serverId,
    expiresAtStateVersion: quote.expiresAtStateVersion,
  };
  if (!quote.complete) {
    return {
      ...binding,
      complete: false,
      reason: quote.reason,
    };
  }
  if (
    !isNonNegativeSafeInteger(quote.expiresAtStateVersion) ||
    !isNonNegativeSafeInteger(quote.remainingAdvancementCounters) ||
    quote.advancementCreditCostPerCounter !== 1 ||
    quote.advancementClickCostPerCounter !== 1 ||
    quote.scoreActionCreditCost !== 0 ||
    quote.scoreActionClickCost !== 0 ||
    !isNonNegativeSafeInteger(quote.nextCorpTurnGuaranteedFlexibleClicks) ||
    quote.nextCorpTurnGuaranteedFlexibleClicks <
      quote.remainingAdvancementCounters ||
    !isNonNegativeSafeInteger(quote.freeCreditClicksAfterAdvancement) ||
    quote.freeCreditClicksAfterAdvancement !==
      quote.nextCorpTurnGuaranteedFlexibleClicks -
        quote.remainingAdvancementCounters ||
    !isNonNegativeSafeInteger(quote.certifiedCreditGainFromFreeClicks) ||
    quote.certifiedCreditGainFromFreeClicks !==
      quote.freeCreditClicksAfterAdvancement ||
    !isNonNegativeSafeInteger(quote.creditsRequiredBeforeNextCorpTurn) ||
    typeof quote.terminalScore !== "boolean"
  ) {
    return {
      ...binding,
      complete: false,
      reason: "not_completable_next_corp_turn",
    };
  }
  return {
    ...binding,
    complete: true,
    remainingAdvancementCounters: quote.remainingAdvancementCounters,
    advancementCreditCostPerCounter: 1,
    advancementClickCostPerCounter: 1,
    scoreActionCreditCost: 0,
    scoreActionClickCost: 0,
    nextCorpTurnGuaranteedFlexibleClicks:
      quote.nextCorpTurnGuaranteedFlexibleClicks,
    freeCreditClicksAfterAdvancement: quote.freeCreditClicksAfterAdvancement,
    certifiedCreditGainFromFreeClicks: quote.certifiedCreditGainFromFreeClicks,
    creditsRequiredBeforeNextCorpTurn: quote.creditsRequiredBeforeNextCorpTurn,
    terminalScore: quote.terminalScore,
  };
}

function sanitizeInstalledCorpIceRezResourceExchangeQuote(
  quote: Extract<
    VisibleCorpIceRezResourceExchangeQuote,
    { context: "installed" }
  >,
): VisibleCorpIceRezResourceExchangeQuote {
  const binding = {
    context: "installed" as const,
    cardId: quote.cardId,
    targetServerId: quote.targetServerId,
    projectedServerId: quote.projectedServerId,
    expiresAtStateVersion: quote.expiresAtStateVersion,
  };
  if (
    !quote.complete ||
    quote.projectedServerId !== quote.targetServerId ||
    !isNonNegativeSafeInteger(quote.expiresAtStateVersion) ||
    !isNonNegativeSafeInteger(quote.runnerBreak.requiredCredits) ||
    !isNonNegativeSafeInteger(quote.runnerBreak.pumpCredits) ||
    !isNonNegativeSafeInteger(quote.runnerBreak.breakCredits) ||
    quote.runnerBreak.requiredCredits !==
      quote.runnerBreak.pumpCredits + quote.runnerBreak.breakCredits ||
    !isNonNegativeSafeInteger(quote.runnerBreak.breakUses) ||
    quote.runnerBreak.breakUses <= 0 ||
    !isNonNegativeSafeInteger(quote.runnerBreak.normalCreditsRequired) ||
    !isNonNegativeSafeInteger(quote.runnerBreak.nonNormalRunCreditsApplied) ||
    quote.runnerBreak.requiredCredits !==
      quote.runnerBreak.normalCreditsRequired +
        quote.runnerBreak.nonNormalRunCreditsApplied ||
    quote.runnerBreak.paymentEvidenceSource !== "engine_icebreaker_ability" ||
    quote.runnerBreak.consumedCards.some(
      (card) =>
        card.kind !== "trash_at_run_end_after_break" ||
        card.evidenceSource !== "engine_icebreaker_ability" ||
        card.cardId !== quote.runnerBreak.breakerCardId ||
        card.definitionId !== quote.runnerBreak.breakerDefinitionId,
    ) ||
    (quote.runnerBreak.randomConsequences ?? []).some(
      (consequence) =>
        consequence.kind !== "post_encounter_self_trash_check" ||
        consequence.evidenceSource !== "engine_icebreaker_ability" ||
        consequence.cardId !== quote.runnerBreak.breakerCardId ||
        consequence.definitionId !== quote.runnerBreak.breakerDefinitionId ||
        !isNonNegativeSafeInteger(consequence.numerator) ||
        consequence.numerator <= 0 ||
        !isNonNegativeSafeInteger(consequence.denominator) ||
        consequence.denominator <= 0 ||
        consequence.numerator > consequence.denominator,
    )
  ) {
    return { ...binding, complete: false };
  }
  return {
    ...binding,
    complete: true,
    runnerBreak: {
      breakerCardId: quote.runnerBreak.breakerCardId,
      breakerDefinitionId: quote.runnerBreak.breakerDefinitionId,
      requiredCredits: quote.runnerBreak.requiredCredits,
      pumpCredits: quote.runnerBreak.pumpCredits,
      breakCredits: quote.runnerBreak.breakCredits,
      breakUses: quote.runnerBreak.breakUses,
      normalCreditsRequired: quote.runnerBreak.normalCreditsRequired,
      nonNormalRunCreditsApplied: quote.runnerBreak.nonNormalRunCreditsApplied,
      canPayFromCurrentCredits: quote.runnerBreak.canPayFromCurrentCredits,
      paymentEvidenceSource: "engine_icebreaker_ability",
      consumedCards: quote.runnerBreak.consumedCards.map((card) => ({
        cardId: card.cardId,
        definitionId: card.definitionId,
        kind: "trash_at_run_end_after_break" as const,
        evidenceSource: "engine_icebreaker_ability" as const,
      })),
      ...((quote.runnerBreak.randomConsequences?.length ?? 0) > 0
        ? {
            randomConsequences: quote.runnerBreak.randomConsequences!.map(
              (consequence) => ({
                cardId: consequence.cardId,
                definitionId: consequence.definitionId,
                kind: "post_encounter_self_trash_check" as const,
                numerator: consequence.numerator,
                denominator: consequence.denominator,
                evidenceSource: "engine_icebreaker_ability" as const,
              }),
            ),
          }
        : {}),
    },
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
    !isNonNegativeSafeInteger(quote.mandatoryAdditionalCosts?.agendaPoints) ||
    !modifiersValid ||
    (reductionSourceDefinitionIds === undefined &&
      increaseSourceDefinitionIds === undefined &&
      quote.finalCredits !== quote.baseCredits)
  ) {
    return { ...binding, complete: false };
  }
  const common = {
    ...binding,
    complete: true as const,
    baseCredits: quote.baseCredits,
    finalCredits: quote.finalCredits,
    mandatoryAdditionalCosts: {
      agendaPoints: quote.mandatoryAdditionalCosts.agendaPoints,
    },
    ...(reductionSourceDefinitionIds ? { reductionSourceDefinitionIds } : {}),
    ...(increaseSourceDefinitionIds ? { increaseSourceDefinitionIds } : {}),
  };
  if (quote.costKind === "fixed") {
    return { ...common, costKind: "fixed" };
  }
  const variableParameter = sanitizeVisibleVariableCorpRezCostParameter(
    quote.variableParameter,
    quote.finalCredits,
  );
  return variableParameter
    ? {
        ...common,
        costKind: "variable",
        variableParameter,
      }
    : { ...binding, complete: false };
}

function sanitizeVisibleVariableCorpRezCostParameter(
  value: unknown,
  finalBaseCredits: number,
): VisibleVariableCorpRezCostParameter | undefined {
  if (
    !value ||
    typeof value !== "object" ||
    !isNonNegativeSafeInteger(finalBaseCredits)
  ) {
    return undefined;
  }
  const parameter = value as Record<string, unknown>;
  if (parameter.kind === "x_strength") {
    const additionalCreditsPerValue = parameter.additionalCreditsPerValue;
    const minValue = parameter.minValue;
    const maxValue = parameter.maxValue;
    const minValueFinalCredits = parameter.minValueFinalCredits;
    const maxValueFinalCredits = parameter.maxValueFinalCredits;
    if (
      !isPositiveSafeInteger(additionalCreditsPerValue) ||
      !isNonNegativeSafeInteger(minValue) ||
      !isNonNegativeSafeInteger(maxValue) ||
      maxValue < minValue ||
      !isNonNegativeSafeInteger(minValueFinalCredits) ||
      !isNonNegativeSafeInteger(maxValueFinalCredits) ||
      minValueFinalCredits !==
        safeCreditTotal(
          finalBaseCredits,
          minValue,
          additionalCreditsPerValue,
        ) ||
      maxValueFinalCredits !==
        safeCreditTotal(
          finalBaseCredits,
          maxValue,
          additionalCreditsPerValue,
        ) ||
      parameter.effectiveStrengthFromValue !== true ||
      !optionalTrue(parameter.traceLimitFromValue)
    ) {
      return undefined;
    }
    return {
      kind: "x_strength",
      additionalCreditsPerValue,
      minValue,
      maxValue,
      minValueFinalCredits,
      maxValueFinalCredits,
      effectiveStrengthFromValue: true,
      ...(parameter.traceLimitFromValue === true
        ? { traceLimitFromValue: true }
        : {}),
    };
  }
  if (parameter.kind === "paid_end_the_run_subroutines") {
    const additionalCreditsPerSubroutine =
      parameter.additionalCreditsPerSubroutine;
    const minSubroutines = parameter.minSubroutines;
    const minSubroutinesFinalCredits = parameter.minSubroutinesFinalCredits;
    const firstEndTheRunSubroutineCount =
      parameter.firstEndTheRunSubroutineCount;
    const firstEndTheRunFinalCredits = parameter.firstEndTheRunFinalCredits;
    if (
      !isPositiveSafeInteger(additionalCreditsPerSubroutine) ||
      !isNonNegativeSafeInteger(minSubroutines) ||
      !isNonNegativeSafeInteger(minSubroutinesFinalCredits) ||
      !isPositiveSafeInteger(firstEndTheRunSubroutineCount) ||
      firstEndTheRunSubroutineCount !== Math.max(1, minSubroutines) ||
      !isNonNegativeSafeInteger(firstEndTheRunFinalCredits) ||
      minSubroutinesFinalCredits !==
        safeCreditTotal(
          finalBaseCredits,
          minSubroutines,
          additionalCreditsPerSubroutine,
        ) ||
      firstEndTheRunFinalCredits !==
        safeCreditTotal(
          finalBaseCredits,
          firstEndTheRunSubroutineCount,
          additionalCreditsPerSubroutine,
        )
    ) {
      return undefined;
    }
    return {
      kind: "paid_end_the_run_subroutines",
      additionalCreditsPerSubroutine,
      minSubroutines,
      minSubroutinesFinalCredits,
      firstEndTheRunSubroutineCount,
      firstEndTheRunFinalCredits,
    };
  }
  if (parameter.kind !== "alternate_subtype") return undefined;
  const baseSubtypes = sanitizedCanonicalSubtypes(parameter.baseSubtypes);
  const alternateSubtypes = sanitizedCanonicalSubtypes(
    parameter.alternateSubtypes,
  );
  const baseSubtypesFinalCredits = parameter.baseSubtypesFinalCredits;
  const alternateSubtypesAdditionalCredits =
    parameter.alternateSubtypesAdditionalCredits;
  const alternateSubtypesFinalCredits = parameter.alternateSubtypesFinalCredits;
  if (
    !baseSubtypes ||
    !alternateSubtypes ||
    baseSubtypes.join(",") === alternateSubtypes.join(",") ||
    !isNonNegativeSafeInteger(baseSubtypesFinalCredits) ||
    baseSubtypesFinalCredits !== finalBaseCredits ||
    !isPositiveSafeInteger(alternateSubtypesAdditionalCredits) ||
    !isNonNegativeSafeInteger(alternateSubtypesFinalCredits) ||
    alternateSubtypesFinalCredits !==
      safeCreditTotal(finalBaseCredits, 1, alternateSubtypesAdditionalCredits)
  ) {
    return undefined;
  }
  return {
    kind: "alternate_subtype",
    baseSubtypes,
    baseSubtypesFinalCredits,
    alternateSubtypes,
    alternateSubtypesAdditionalCredits,
    alternateSubtypesFinalCredits,
  };
}

function isPositiveSafeInteger(value: unknown): value is number {
  return isNonNegativeSafeInteger(value) && value > 0;
}

function safeCreditTotal(
  base: number,
  quantity: number,
  creditsPerUnit: number,
): number | undefined {
  const additional = quantity * creditsPerUnit;
  const total = base + additional;
  return isNonNegativeSafeInteger(additional) && isNonNegativeSafeInteger(total)
    ? total
    : undefined;
}

function optionalTrue(value: unknown): boolean {
  return value === undefined || value === true;
}

function sanitizedCanonicalSubtypes(value: unknown): string[] | undefined {
  const subtypes = sanitizedStringArray(value);
  return subtypes &&
    subtypes.length > 0 &&
    subtypes.every((subtype) => /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(subtype))
    ? subtypes
    : undefined;
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

const VISIBLE_EFFECTIVE_SUBROUTINE_TYPES = {
  end_the_run: true,
  end_the_run_unless_runner_pays: true,
  corp_gain_credit: true,
  runner_lose_credits: true,
  give_runner_tag: true,
  do_damage: true,
  random_damage: true,
  initiate_trace: true,
  end_the_run_and_trash_source_at_end_of_turn: true,
  trash_installed_program: true,
  trash_installed_program_unless_runner_pays: true,
  set_run_encounter_tax: true,
  set_run_break_subroutine_cost_modifier: true,
  set_run_future_end_the_run_subroutine: true,
  set_run_active_ice_program_trash: true,
  set_run_future_strength_bonus: true,
  set_next_encounter_unless_fully_break_damage: true,
  set_next_encounter_lock: true,
  set_next_encounter_no_break_subroutines: true,
  set_run_jack_out_lock: true,
  set_runner_forgo_next_action: true,
  set_runner_run_lock_actions: true,
  set_run_jack_out_additional_cost: true,
  set_run_pass_rezzed_ice_program_trash: true,
  secret_spend_compare_end_run_unless_corp_spent_at_least_runner: true,
  reveal_corp_rd_top: true,
  reorder_corp_rd_top2: true,
  deflect_run: true,
  rewind_run_to_rezzed_ice_by_die: true,
} satisfies Record<SubroutineType, true>;

const TRACE_COUNTER_TYPES = {
  advancement: true,
  virus: true,
  cockroach: true,
  cascade: true,
  doom: true,
  crumble: true,
  garbage: true,
  highlighter: true,
  scaldan: true,
  tax: true,
  vienna: true,
  socket_archives: true,
  socket_hq: true,
  socket_rd: true,
  pipe: true,
  spy: true,
  link_reduction_counter: true,
  breaker_strength_penalty: true,
  baskerville: true,
  cerberus: true,
  trace_tag_counter: true,
  mastiff: true,
  militech: true,
  power: true,
  agenda: true,
  recurring_credit: true,
  bad_publicity: true,
  install_cost_modifier: true,
  charge: true,
  mark: true,
  dividend: true,
  core_damage: true,
  shell: true,
  bit: true,
  crying: true,
  ablative: true,
  trauma: true,
  boon: true,
  pdca: true,
  remap: true,
  kludge: true,
  term: true,
  drip: true,
} satisfies Record<CounterType, true>;

function sanitizeVisibleEffectiveIceRunQuote(
  value: unknown,
): VisibleEffectiveIceRunQuote | undefined {
  if (!isPlainObjectRecord(value)) return undefined;
  const subroutines = Array.isArray(value.subroutines)
    ? value.subroutines.map(sanitizeVisibleEffectiveSubroutine)
    : undefined;
  const breakSubroutineCostSourceDefinitionIds =
    value.breakSubroutineCostSourceDefinitionIds === undefined
      ? undefined
      : sanitizeNonEmptyStringArray(
          value.breakSubroutineCostSourceDefinitionIds,
        );
  const breakSubroutineCostSourceTitles =
    value.breakSubroutineCostSourceTitles === undefined
      ? undefined
      : sanitizeNonEmptyStringArray(value.breakSubroutineCostSourceTitles);
  const conditionalEncounterEffects =
    value.conditionalEncounterEffects === undefined
      ? undefined
      : sanitizeVisibleConditionalEncounterEffects(
          value.conditionalEncounterEffects,
        );
  if (
    !isNonEmptyString(value.iceInstanceId) ||
    !isNonEmptyString(value.iceDefinitionId) ||
    !isNonNegativeSafeInteger(value.effectiveStrength) ||
    !subroutines ||
    subroutines.some((subroutine) => subroutine === undefined) ||
    (value.breakSubroutineAdditionalCostPerSubroutine !== undefined &&
      !isNonNegativeSafeInteger(
        value.breakSubroutineAdditionalCostPerSubroutine,
      )) ||
    (value.breakSubroutineCostSourceDefinitionIds !== undefined &&
      breakSubroutineCostSourceDefinitionIds === undefined) ||
    (value.breakSubroutineCostSourceTitles !== undefined &&
      breakSubroutineCostSourceTitles === undefined) ||
    (value.encounterTemporaryTraceCredits !== undefined &&
      !isNonNegativeSafeInteger(value.encounterTemporaryTraceCredits)) ||
    (value.conditionalEncounterEffects !== undefined &&
      conditionalEncounterEffects === undefined)
  ) {
    return undefined;
  }
  return {
    iceInstanceId: value.iceInstanceId,
    iceDefinitionId: value.iceDefinitionId,
    effectiveStrength: value.effectiveStrength,
    subroutines: subroutines as VisibleEffectiveSubroutine[],
    ...(value.breakSubroutineAdditionalCostPerSubroutine !== undefined
      ? {
          breakSubroutineAdditionalCostPerSubroutine:
            value.breakSubroutineAdditionalCostPerSubroutine,
        }
      : {}),
    ...(breakSubroutineCostSourceDefinitionIds !== undefined
      ? { breakSubroutineCostSourceDefinitionIds }
      : {}),
    ...(breakSubroutineCostSourceTitles !== undefined
      ? { breakSubroutineCostSourceTitles }
      : {}),
    ...(value.encounterTemporaryTraceCredits !== undefined
      ? {
          encounterTemporaryTraceCredits: value.encounterTemporaryTraceCredits,
        }
      : {}),
    ...(conditionalEncounterEffects !== undefined
      ? { conditionalEncounterEffects }
      : {}),
  };
}

function sanitizeVisibleEffectiveSubroutine(
  value: unknown,
): VisibleEffectiveSubroutine | undefined {
  if (!isPlainObjectRecord(value)) return undefined;
  const traceSuccessEffect =
    value.traceSuccessEffect === undefined
      ? undefined
      : sanitizeTraceSuccessEffect(value.traceSuccessEffect);
  const breakTags =
    value.breakTags === undefined
      ? undefined
      : sanitizeNonEmptyStringArray(value.breakTags);
  const unbrokenRunEffect =
    value.unbrokenRunEffect === undefined
      ? undefined
      : sanitizeVisibleUnbrokenRunEffect(value.unbrokenRunEffect);
  if (
    !isNonEmptyString(value.id) ||
    !isVisibleEffectiveSubroutineType(value.type) ||
    (value.amount !== undefined && !isNonNegativeSafeInteger(value.amount)) ||
    (value.traceLimit !== undefined &&
      !isNonNegativeSafeInteger(value.traceLimit)) ||
    (value.runFutureStrengthCancelPaymentAmount !== undefined &&
      !isNonNegativeSafeInteger(value.runFutureStrengthCancelPaymentAmount)) ||
    (value.traceSuccessEffect !== undefined &&
      traceSuccessEffect === undefined) ||
    (value.deflectorTarget !== undefined &&
      value.deflectorTarget !== "archives" &&
      value.deflectorTarget !== "any_data_fort" &&
      value.deflectorTarget !== "subsidiary_data_fort") ||
    (value.deflectorCost !== undefined &&
      !isNonNegativeSafeInteger(value.deflectorCost)) ||
    (value.deflectorAutoBreakIfNoTarget !== undefined &&
      typeof value.deflectorAutoBreakIfNoTarget !== "boolean") ||
    (value.breakTags !== undefined && breakTags === undefined) ||
    (value.sourceDefinitionId !== undefined &&
      !isNonEmptyString(value.sourceDefinitionId)) ||
    (value.sourceTitle !== undefined && !isNonEmptyString(value.sourceTitle)) ||
    (value.dynamicSourceKind !== undefined &&
      value.dynamicSourceKind !== "additional_subroutine" &&
      value.dynamicSourceKind !== "run_duration_additional_subroutine") ||
    (value.unbrokenRunEffect !== undefined && unbrokenRunEffect === undefined)
  ) {
    return undefined;
  }
  return {
    id: value.id,
    type: value.type,
    ...(value.amount !== undefined ? { amount: value.amount } : {}),
    ...(value.traceLimit !== undefined ? { traceLimit: value.traceLimit } : {}),
    ...(value.runFutureStrengthCancelPaymentAmount !== undefined
      ? {
          runFutureStrengthCancelPaymentAmount:
            value.runFutureStrengthCancelPaymentAmount,
        }
      : {}),
    ...(traceSuccessEffect ? { traceSuccessEffect } : {}),
    ...(value.deflectorTarget !== undefined
      ? { deflectorTarget: value.deflectorTarget }
      : {}),
    ...(value.deflectorCost !== undefined
      ? { deflectorCost: value.deflectorCost }
      : {}),
    ...(value.deflectorAutoBreakIfNoTarget !== undefined
      ? {
          deflectorAutoBreakIfNoTarget: value.deflectorAutoBreakIfNoTarget,
        }
      : {}),
    ...(breakTags !== undefined ? { breakTags } : {}),
    ...(value.sourceDefinitionId !== undefined
      ? { sourceDefinitionId: value.sourceDefinitionId }
      : {}),
    ...(value.sourceTitle !== undefined
      ? { sourceTitle: value.sourceTitle }
      : {}),
    ...(value.dynamicSourceKind !== undefined
      ? { dynamicSourceKind: value.dynamicSourceKind }
      : {}),
    ...(unbrokenRunEffect !== undefined ? { unbrokenRunEffect } : {}),
  };
}

function sanitizeVisibleUnbrokenRunEffect(
  value: unknown,
): NonNullable<VisibleEffectiveSubroutine["unbrokenRunEffect"]> | undefined {
  if (!isPlainObjectRecord(value)) return undefined;
  if (
    (value.addsFutureEndTheRunSubroutines !== undefined &&
      !isNonNegativeSafeInteger(value.addsFutureEndTheRunSubroutines)) ||
    (value.increasesFutureBreakCostPerSubroutine !== undefined &&
      !isNonNegativeSafeInteger(value.increasesFutureBreakCostPerSubroutine)) ||
    (value.increasesFutureIceStrength !== undefined &&
      !isNonNegativeSafeInteger(value.increasesFutureIceStrength)) ||
    (value.preventsFutureBreaking !== undefined &&
      typeof value.preventsFutureBreaking !== "boolean") ||
    (value.addsFutureEncounterCost !== undefined &&
      !isNonNegativeSafeInteger(value.addsFutureEncounterCost)) ||
    (value.preventsJackOut !== undefined &&
      typeof value.preventsJackOut !== "boolean") ||
    (value.causesDamageOrProgramTrash !== undefined &&
      typeof value.causesDamageOrProgramTrash !== "boolean") ||
    (value.createsRunLockOrActionTax !== undefined &&
      !isNonNegativeSafeInteger(value.createsRunLockOrActionTax))
  ) {
    return undefined;
  }
  return {
    ...(value.addsFutureEndTheRunSubroutines !== undefined
      ? {
          addsFutureEndTheRunSubroutines: value.addsFutureEndTheRunSubroutines,
        }
      : {}),
    ...(value.increasesFutureBreakCostPerSubroutine !== undefined
      ? {
          increasesFutureBreakCostPerSubroutine:
            value.increasesFutureBreakCostPerSubroutine,
        }
      : {}),
    ...(value.increasesFutureIceStrength !== undefined
      ? { increasesFutureIceStrength: value.increasesFutureIceStrength }
      : {}),
    ...(value.preventsFutureBreaking !== undefined
      ? { preventsFutureBreaking: value.preventsFutureBreaking }
      : {}),
    ...(value.addsFutureEncounterCost !== undefined
      ? { addsFutureEncounterCost: value.addsFutureEncounterCost }
      : {}),
    ...(value.preventsJackOut !== undefined
      ? { preventsJackOut: value.preventsJackOut }
      : {}),
    ...(value.causesDamageOrProgramTrash !== undefined
      ? { causesDamageOrProgramTrash: value.causesDamageOrProgramTrash }
      : {}),
    ...(value.createsRunLockOrActionTax !== undefined
      ? { createsRunLockOrActionTax: value.createsRunLockOrActionTax }
      : {}),
  };
}

function sanitizeVisibleCorpIcePostRezRunQuote(
  value: unknown,
): VisibleCorpIcePostRezRunQuote | undefined {
  if (
    !isPlainObjectRecord(value) ||
    value.context !== "installed_post_rez" ||
    !isNonEmptyString(value.cardId) ||
    !isNonEmptyString(value.iceDefinitionId) ||
    !isExistingRunServerId(value.targetServerId) ||
    !isExistingRunServerId(value.projectedServerId) ||
    !isNonNegativeSafeInteger(value.expiresAtStateVersion)
  ) {
    return undefined;
  }
  const binding = {
    context: "installed_post_rez" as const,
    cardId: value.cardId,
    iceDefinitionId: value.iceDefinitionId,
    targetServerId: value.targetServerId,
    projectedServerId: value.projectedServerId,
    expiresAtStateVersion: value.expiresAtStateVersion,
  };
  if (value.complete === false) {
    if (
      value.reason !== "variable_rez_choice_required" &&
      value.reason !== "on_rez_lifecycle_projection_required" &&
      value.reason !== "active_run_context" &&
      value.reason !== "effective_run_projection_unavailable"
    ) {
      return undefined;
    }
    return { ...binding, complete: false, reason: value.reason };
  }
  if (value.complete !== true) return undefined;
  const effectiveRunQuote = sanitizeVisibleEffectiveIceRunQuote(
    value.effectiveRunQuote,
  );
  if (
    !effectiveRunQuote ||
    effectiveRunQuote.iceInstanceId !== value.cardId ||
    effectiveRunQuote.iceDefinitionId !== value.iceDefinitionId
  ) {
    return undefined;
  }
  return { ...binding, complete: true, effectiveRunQuote };
}

function sanitizeVisibleConditionalEncounterEffects(
  value: unknown,
): VisibleConditionalEncounterEffect[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const sanitized = value.map((effect) => {
    if (!isPlainObjectRecord(effect)) return undefined;
    if (effect.kind === "corp_paid_add_end_the_run_subroutine") {
      return isNonNegativeSafeInteger(effect.creditCost)
        ? {
            kind: "corp_paid_add_end_the_run_subroutine" as const,
            creditCost: effect.creditCost,
          }
        : undefined;
    }
    if (
      effect.kind === "random_strength_or_derez_auto_pass" &&
      effect.dieFaces === 6 &&
      effect.autoPassResult === 6 &&
      isNonNegativeSafeInteger(effect.maxStrengthBonus) &&
      effect.maxStrengthBonus <= 5
    ) {
      return {
        kind: "random_strength_or_derez_auto_pass" as const,
        dieFaces: 6 as const,
        autoPassResult: 6 as const,
        maxStrengthBonus: effect.maxStrengthBonus,
      };
    }
    return undefined;
  });
  return sanitized.every(
    (effect): effect is VisibleConditionalEncounterEffect =>
      effect !== undefined,
  )
    ? sanitized
    : undefined;
}

function sanitizeTraceSuccessEffect(
  value: unknown,
): TraceSuccessEffect | undefined {
  if (!isPlainObjectRecord(value)) return undefined;
  switch (value.type) {
    case "add_tag":
    case "net_damage":
    case "end_run_and_run_lock":
    case "end_run_trash_program_and_run_lock":
    case "end_run_trash_hardware_and_unpreventable_meat_damage":
      return isNonNegativeSafeInteger(value.amount)
        ? { type: value.type, amount: value.amount }
        : undefined;
    case "add_tags_by_trace_margin_over_runner_link":
    case "none":
      return { type: value.type };
    case "add_counter":
      return isCounterType(value.counterType) &&
        isNonNegativeSafeInteger(value.amount)
        ? {
            type: "add_counter",
            counterType: value.counterType,
            amount: value.amount,
          }
        : undefined;
    case "add_tag_and_counter":
      return isNonNegativeSafeInteger(value.tagAmount) &&
        isCounterType(value.counterType) &&
        isNonNegativeSafeInteger(value.amount)
        ? {
            type: "add_tag_and_counter",
            tagAmount: value.tagAmount,
            counterType: value.counterType,
            amount: value.amount,
          }
        : undefined;
    case "trash_runner_resource_and_add_tag":
      return isNonEmptyString(value.targetCardInstanceId)
        ? {
            type: "trash_runner_resource_and_add_tag",
            targetCardInstanceId: value.targetCardInstanceId,
          }
        : undefined;
    default:
      return undefined;
  }
}

function isVisibleEffectiveSubroutineType(
  value: unknown,
): value is SubroutineType {
  return (
    typeof value === "string" &&
    Object.hasOwn(VISIBLE_EFFECTIVE_SUBROUTINE_TYPES, value)
  );
}

function isCounterType(value: unknown): value is CounterType {
  return typeof value === "string" && Object.hasOwn(TRACE_COUNTER_TYPES, value);
}

function isExistingRunServerId(
  value: unknown,
): value is Extract<
  VisibleCorpIcePostRezRunQuote,
  { complete: true }
>["targetServerId"] {
  return (
    value === "hq" ||
    value === "rd" ||
    value === "archives" ||
    (typeof value === "string" && /^remote_[1-9][0-9]*$/.test(value))
  );
}

function sanitizeNonEmptyStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every(isNonEmptyString)
    ? value.slice()
    : undefined;
}

function isPlainObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
  const continuation = sanitizeChoiceContinuation(
    choice.continuation,
    playerViewStateVersion,
    playerViewSide,
    choice.side,
    choice.sourceCardInstanceId,
    choice.sourceCardDefinitionId,
  );
  return {
    choiceId: choice.choiceId,
    side: choice.side,
    source: choice.source,
    ...(playerViewSide === choice.side &&
    isNonEmptyString(choice.sourceCardInstanceId)
      ? { sourceCardInstanceId: choice.sourceCardInstanceId }
      : {}),
    ...(playerViewSide === choice.side &&
    isNonEmptyString(choice.sourceCardDefinitionId)
      ? { sourceCardDefinitionId: choice.sourceCardDefinitionId }
      : {}),
    ...(continuation ? { continuation } : {}),
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

function sanitizeChoiceContinuation(
  value: VisibleChoiceRequest["continuation"],
  stateVersion: number,
  playerViewSide: Side,
  choiceSide: Side,
  sourceCardInstanceId: string | undefined,
  sourceCardDefinitionId: string | undefined,
): VisibleChoiceRequest["continuation"] | undefined {
  if (playerViewSide !== choiceSide || !value) return undefined;
  if (
    typeof value.originActionId !== "string" ||
    value.originActionId.length === 0 ||
    value.createdAtStateVersion !== stateVersion
  ) {
    return undefined;
  }
  if (
    value.family === "corp_advancement_counter" &&
    playerViewSide === "corp" &&
    choiceSide === "corp"
  )
    return { ...value };
  if (
    value.family === "corp_scored_agenda_hq_shuffle" &&
    playerViewSide === "corp" &&
    choiceSide === "corp" &&
    typeof value.agendaInstanceId === "string" &&
    value.agendaInstanceId.length > 0 &&
    Number.isSafeInteger(value.creditPerAgendaPoint) &&
    value.creditPerAgendaPoint > 0
  ) {
    return { ...value };
  }
  if (
    value.family === "runner_hidden_draw_keep_or_top_replacement" &&
    playerViewSide === "runner" &&
    choiceSide === "runner" &&
    isNonEmptyString(value.sourceCardInstanceId) &&
    value.sourceCardInstanceId === sourceCardInstanceId &&
    isNonEmptyString(value.sourceCardDefinitionId) &&
    value.sourceCardDefinitionId === sourceCardDefinitionId &&
    value.drawnCardInstanceIds.length > 0 &&
    value.drawnCardInstanceIds.every(isNonEmptyString) &&
    new Set(value.drawnCardInstanceIds).size ===
      value.drawnCardInstanceIds.length
  ) {
    return {
      ...value,
      drawnCardInstanceIds: [...value.drawnCardInstanceIds],
    };
  }
  if (
    value.family === "runner_grip_install_with_temporary_credits" &&
    playerViewSide === "runner" &&
    choiceSide === "runner" &&
    typeof value.sourceCardInstanceId === "string" &&
    value.sourceCardInstanceId.length > 0 &&
    typeof value.sourceCardDefinitionId === "string" &&
    value.sourceCardDefinitionId.length > 0 &&
    typeof value.sourceCapabilityKey === "string" &&
    value.sourceCapabilityKey.length > 0 &&
    Number.isSafeInteger(value.temporaryCredits) &&
    value.temporaryCredits > 0 &&
    value.allowedTypes.length > 0 &&
    value.allowedTypes.length <= 2 &&
    new Set(value.allowedTypes).size === value.allowedTypes.length &&
    value.allowedTypes.every(
      (cardType) => cardType === "program" || cardType === "hardware",
    )
  ) {
    return { ...value, allowedTypes: [...value.allowedTypes] };
  }
  if (
    value.family === "runner_program_trash_before_install" &&
    playerViewSide === "runner" &&
    choiceSide === "runner" &&
    isNonEmptyString(value.sourceCardInstanceId) &&
    value.sourceCardInstanceId === sourceCardInstanceId &&
    isNonEmptyString(value.sourceCardDefinitionId) &&
    value.sourceCardDefinitionId === sourceCardDefinitionId &&
    (value.selectedCardId === undefined ||
      isNonEmptyString(value.selectedCardId)) &&
    (value.selectedSubtype === undefined ||
      isNonEmptyString(value.selectedSubtype))
  ) {
    return { ...value };
  }
  return undefined;
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
    (cardType !== "ice" && cardType !== "asset" && cardType !== "upgrade") ||
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
      quote.regularCreditsAvailable >= quote.regularCreditsRequired ||
    quote.regularCreditsAvailable !== expected.ownCredits ||
    quote.additionalCostsPayable !==
      expected.ownAgendaPoints >=
        (mandatoryAdditionalCosts as { agendaPoints: number }).agendaPoints ||
    quote.affordable !== (quote.creditPayable && quote.additionalCostsPayable)
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
    ...(reductionSourceDefinitionIds ? { reductionSourceDefinitionIds } : {}),
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
    strings.some((entry, index) => index > 0 && strings[index - 1]! >= entry)
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
  if (action.abilityRef) assertAbilityRefIdentity(action.abilityRef);
  const payload =
    action.payload ||
    (action.abilityRef && "sourceAbilityId" in action.abilityRef)
      ? sanitizeLegalActionPayload(action)
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
          abilityRef:
            "sourceAbilityId" in action.abilityRef
              ? {
                  sourceCardInstanceId: action.abilityRef.sourceCardInstanceId,
                  sourceAbilityId: action.abilityRef.sourceAbilityId,
                }
              : {
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
  action: LegalAction,
): NonNullable<LegalAction["payload"]> {
  const payload = action.payload as Record<string, unknown> | undefined;
  if (!payload && action.abilityRef && "sourceAbilityId" in action.abilityRef)
    throw new Error(
      "Canonical CardSpec capability Action requires an exact payload binding.",
    );
  if (!payload) return {};
  const result: NonNullable<LegalAction["payload"]> = {
    ...sanitizeAllowedPrimitiveRecord(payload, LEGAL_ACTION_PAYLOAD_KEYS),
  };
  if (action.abilityRef && "sourceAbilityId" in action.abilityRef) {
    const parsed = parseCanonicalCapabilityId(
      action.abilityRef.sourceAbilityId,
    );
    const bindingKind = payload.cardImplementationCapabilityBindingKind;
    const abilityId = payload.cardImplementationAbilityId;
    const abilityKey = payload.cardImplementationAbilityKey;
    if (
      bindingKind !== "card_spec_capability_key" ||
      abilityId !== action.abilityRef.sourceAbilityId ||
      abilityKey !== parsed.capabilityKey ||
      payload.cardImplementationAbilityIndex !== undefined ||
      payload.cardImplementationLifecycleAbilityIndex !== undefined
    )
      throw new Error(
        "Canonical CardSpec capability payload conflicts with its AbilityRef.",
      );
    result.cardImplementationCapabilityBindingKind = "card_spec_capability_key";
    result.cardImplementationAbilityId = action.abilityRef.sourceAbilityId;
    result.cardImplementationAbilityKey = parsed.capabilityKey;
  }
  const selectedCardId = payload.selectedCardId;
  if (
    action.type === "install_card" &&
    typeof selectedCardId === "string" &&
    action.targetRequirements.some(
      (requirement) =>
        requirement.kind === "card" && requirement.visibility === "public",
    )
  ) {
    result.selectedCardId = selectedCardId;
  }
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
