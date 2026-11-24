import {
  choiceOptionPresentationForEngineKey,
  choiceOptionServerForEngineKey,
  isMatchOfferId,
  isPositiveSafeInteger,
  type GameState,
  type LegalAction,
  type MatchActionSubmission,
  type OfferedChoiceOption,
  type OfferedChoiceRequest,
  type OfferedPlayerView,
  type PlayerAction,
  type PlayerView,
  type VisibleCard,
  type VisibleChoiceOption,
  type VisibleChoiceRequest,
} from "@netgrid/shared";
import { getLegalActions } from "./legal-actions";

const internalOfferPayloadKeys = [
  "cardImplementationFortRunRezSupportQuoteActionId",
  "corpTemporaryIceStrengthPulseQuoteJson",
  "corpZoneTransitionProjectionActionId",
  "costPenaltySupportOriginalActionId",
  "hostedCreditBankCycleQuoteJson",
  "operationFreeRezRunQuoteJson",
  "postInstallEffectiveRunQuoteJson",
  "rootRezCreditOutcomeQuoteActionId",
  "rootRezDelaysAgendaAccess",
  "rootRezDiscountedIceQuoteJson",
  "rootRezIceInstallCostQuoteJson",
  "runnerCostPenaltySupportOriginalActionId",
  "runnerPostBreakTrashQuoteJson",
] as const;

function offerCard(card: VisibleCard): VisibleCard {
  const {
    currentEncounterDefenseQuotes: _encounterQuotes,
    currentPassTaxRezQuote: _passTaxQuote,
    currentTraceIceRezQuotes: _traceIceQuotes,
    effectivePostRezActionRunQuotes: _postRezOffers,
    effectiveRezActionResourceExchangeQuotes: _rezResourceOffers,
    ...facts
  } = card;
  return facts;
}

function offerChoiceOption(
  option: VisibleChoiceOption,
  index: number,
): OfferedChoiceOption {
  const {
    id: engineKey,
    card,
    metadata,
    forcedIceRezQuote: _forcedIceRezQuote,
    hqInstallRezOptionQuote: _hqInstallRezOptionQuote,
    ...facts
  } = option;
  const presentation = choiceOptionPresentationForEngineKey(engineKey);
  const serverId = choiceOptionServerForEngineKey(engineKey);
  const displayMetadata = metadata && { ...metadata };
  if (displayMetadata) delete displayMetadata.temporaryEncounterBreakQuoteJson;
  return {
    ...facts,
    id: index + 1,
    ...(card ? { card: offerCard(card) } : {}),
    ...(displayMetadata ? { metadata: displayMetadata } : {}),
    ...(presentation ? { presentation } : {}),
    ...(serverId ? { serverId } : {}),
  };
}

function offerChoice(choice: VisibleChoiceRequest): OfferedChoiceRequest {
  const {
    options,
    continuation: _continuation,
    agendaPurgeArchivesProtectionQuote: _agendaProtection,
    ...facts
  } = choice;
  return {
    ...facts,
    choiceId: choice.stateVersion + 1,
    options: options.map(offerChoiceOption),
  };
}

export function buildMatchPlayerOffer(view: PlayerView): OfferedPlayerView {
  const {
    pendingChoice,
    legalActions,
    trace,
    run,
    servers,
    corpPunishRouteQuoteSet: _corpPunishRouteQuoteSet,
    ...facts
  } = view;
  const choice = pendingChoice && offerChoice(pendingChoice);
  const optionIds = new Map(
    pendingChoice?.options.map((option, index) => [option.id, index + 1]),
  );
  if (pendingChoice && optionIds.size !== pendingChoice.options.length)
    throw new Error("match_offer_duplicate_choice_option_key");

  const traceFacts = trace && { ...trace };
  if (traceFacts) delete traceFacts.currentRunLockBidQuote;
  const runFacts = run && { ...run };
  if (runFacts) {
    delete runFacts.successfulRunFortIceTrashQuote;
    if (runFacts.approachedIce)
      runFacts.approachedIce = offerCard(runFacts.approachedIce);
    if (runFacts.encounteredIce)
      runFacts.encounteredIce = offerCard(runFacts.encounteredIce);
    if (runFacts.accessedCard)
      runFacts.accessedCard = offerCard(runFacts.accessedCard);
  }
  return {
    ...facts,
    servers: servers.map((server) => ({
      ...server,
      ice: server.ice.map(offerCard),
      root: server.root.map(offerCard),
    })),
    ...(traceFacts ? { trace: traceFacts } : {}),
    ...(runFacts ? { run: runFacts } : {}),
    legalActions: legalActions.map((action, index) => {
      const {
        choiceRequirements,
        payload,
        corpScoreRecoveryQuote: _corpScoreRecoveryQuote,
        ...actionFacts
      } = action;
      const offeredPayload = payload && { ...payload };
      if (offeredPayload) {
        for (const key of internalOfferPayloadKeys) delete offeredPayload[key];
        if (choice && payload?.choiceId === pendingChoice?.choiceId)
          offeredPayload.choiceId = choice.choiceId;
      }
      return {
        ...actionFacts,
        actionId: index + 1,
        ...(offeredPayload ? { payload: offeredPayload } : {}),
        ...(choiceRequirements
          ? {
              choiceRequirements: choiceRequirements.map((requirement) => {
                if (!choice || requirement.choiceId !== pendingChoice?.choiceId)
                  throw new Error("match_offer_choice_requirement_unbound");
                return {
                  ...requirement,
                  choiceId: choice.choiceId,
                  optionIds: requirement.optionIds.map((key) => {
                    const id = optionIds.get(key);
                    if (id === undefined)
                      throw new Error("match_offer_choice_option_unbound");
                    return id;
                  }),
                };
              }),
            }
          : {}),
      };
    }),
    ...(choice ? { pendingChoice: choice } : {}),
  };
}

type MatchActionOfferBinding =
  | { action: PlayerAction; legalAction: LegalAction }
  | { errorCode: "ERR_UNKNOWN_ACTION" | "ERR_INVALID_CHOICE" };

export function bindMatchActionOffer(
  state: GameState,
  input: MatchActionSubmission,
): MatchActionOfferBinding {
  if (!isMatchOfferId(input.actionId))
    return { errorCode: "ERR_UNKNOWN_ACTION" };

  const legalAction = getLegalActions(state, input.side)[input.actionId - 1];
  if (!legalAction) return { errorCode: "ERR_UNKNOWN_ACTION" };

  const choice = state.pendingChoice;
  const selection = input.selectedChoices;
  let selectedChoices: PlayerAction["selectedChoices"];
  if (selection !== undefined || legalAction.choiceRequirements?.length) {
    if (
      !selection ||
      !choice ||
      choice.side !== input.side ||
      selection.choiceId !== choice.stateVersion + 1 ||
      !Array.isArray(selection.selectedOptionIds) ||
      !legalAction.choiceRequirements?.some(
        (requirement) => requirement.choiceId === choice.choiceId,
      )
    ) {
      return { errorCode: "ERR_INVALID_CHOICE" };
    }
    const selectedOptionIds = [];
    for (const optionId of selection.selectedOptionIds) {
      const option = isMatchOfferId(optionId)
        ? choice.options[optionId - 1]
        : undefined;
      if (!option || option.selectable === false)
        return { errorCode: "ERR_INVALID_CHOICE" };
      selectedOptionIds.push(option.id);
    }
    const amounts = selection.selectedOptionAmounts;
    if (
      choice.traceCorpPayment
        ? !Array.isArray(amounts) ||
          amounts.length !== selectedOptionIds.length ||
          !amounts.every(isPositiveSafeInteger)
        : amounts !== undefined
    )
      return { errorCode: "ERR_INVALID_CHOICE" };
    selectedChoices = {
      choiceId: choice.choiceId,
      selectedOptionIds,
      ...(amounts !== undefined ? { selectedOptionAmounts: [...amounts] } : {}),
    };
  }

  return {
    legalAction,
    action: {
      matchId: input.matchId,
      side: input.side,
      actionId: legalAction.actionId,
      clientKnownStateVersion: input.clientKnownStateVersion,
      idempotencyKey: input.idempotencyKey,
      ...(input.selectedTargets ? { selectedTargets: input.selectedTargets } : {}),
      ...(selectedChoices ? { selectedChoices } : {}),
    },
  };
}
