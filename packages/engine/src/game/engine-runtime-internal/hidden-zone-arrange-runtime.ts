import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  ChoiceRequest,
  CounterType,
  CorpServer,
  CorpZoneChoiceHandlerHost,
  GameState,
  HiddenZoneArrangeChoiceHandlerHost,
  HiddenZoneNonSearchChoiceHandlerHost,
  HiddenZoneSearchActivationHandlerHost,
  HiddenZoneSearchChoiceHandlerHost,
  LegalAction,
  PendingChoiceResolutionHost,
  PlayerAction,
  RuntimeDeps,
  ServerId,
  Side,
} from "./runtime-shared";
import type { ChoiceHiddenZoneRuntimeLinks } from "./choice-hidden-zone-runtime-links";

export function createHiddenZoneArrangeRuntime(
  deps: RuntimeDeps,
  links: ChoiceHiddenZoneRuntimeLinks,
): import("./hidden-zone-arrange-runtime-port").HiddenZoneArrangeRuntimePort {
  const {
    RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_ACTION,
    RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE,
    addCounterToAllInstalledRunnerIcebreakers,
    canInstallRunnerProgramFromZone,
    canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity,
    chooseCorpAgendasForPointCost,
    continueRandomDiceLoop,
    corpAgendaPointTotal,
    corpZoneChoiceHandlerHost,
    creditTextForPrompt,
    diePromptText,
    discardChoice,
    exposeCorpCardInServer,
    exposeInstalledCorpCardForImplementation,
    exposeInstalledCorpCardLabel,
    exposeInstalledCorpCardTargets,
    exposeInstalledCorpCardsChoiceOptions,
    exposeOutermostIceOfEachDataFort,
    exposedCorpCardInServer,
    hiddenZoneNonSearchChoiceHandlerHost,
    hiddenZoneSearchActivationHandlerHost,
    hiddenZoneSearchActivationTargetHost,
    hiddenZoneSearchChoiceHandlerHost,
    hiddenZoneSearchHandlerHostBase,
    multiExposeInstalledCorpCardOptionLabel,
    multiExposeInstalledCorpCardTargets,
    iceChoiceLabelForSide,
    installRunnerProgramForFree,
    installRunnerProgramFromStackWithoutClick,
    installRunnerProgramFromZoneWithoutClick,
    installedCorpCardServerContext,
    installedRunnerConnectionIds,
    installedRunnerIcebreakerIds,
    outermostIceExposures,
    parseRandomDiceSplitChoiceSource,
    parseRandomDiceSplit,
    parseRunnerInstalledConnectionTrashBadPublicityChoiceSource,
    pendingChoiceResolutionHost,
    randomDiceSplitOptions,
    publicIcePositionLabelForCard,
    publicIceSelectionLabelForCard,
    resolveDerezRezzedBlackIceChoice,
    resolveCardImplementationAccessPaymentChoice,
    resolveChimeraDaemonTrashChoice,
    resolvePayRezCostToTrashRezzedIceChoice,
    resolveRunnerIcebreakerCounterEvent,
    resolveDiscardChoice,
    resolveExposeInstalledCorpCardsChoice,
    resolveCorpChoiceRezOrTrashIceDecisionChoice,
    resolveCorpChoiceRezOrTrashIceTargetChoice,
    resolveMultiExposeInstalledCorpCardsChoice,
    resolveIncubatorTransformChoice,
    resolvePaidSourceReturnToGripChoice,
    resolveRandomDiceLoopEvent,
    resolveRunnerProgramReturnChoice,
    resolveRunnerHostingChoice,
    resolveRunnerInstalledConnectionTrashBadPublicityChoice,
    resolveTrashUnrezzedIceChoice,
    resolveSetupMulliganChoice,
    resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent,
    resolveScoredAgendaCorpRdTopReveal,
    resolveV1911RunnerHiddenZoneAbility,
    resolveRandomDiceSplitChoice,
    revealCorpRdTop,
    revealRunnerStackTop,
    selectedChoiceCardIds,
    selectedChoiceCardIdsForChoice,
    setupMulliganChoice,
    shuffleCorpCardIntoRd,
    shuffleRunnerStack,
    startDerezRezzedBlackIceChoice,
    startPayRezCostToTrashRezzedIceChoice,
    startExposeInstalledCorpCardsChoice,
    startCorpChoiceRezOrTrashIceChoice,
    startMultiExposeInstalledCorpCardsChoice,
    startPaidSourceReturnToGripChoice,
    startRunnerHostingChoice,
    startTrashUnrezzedIceChoice,
    startRunnerProgramFreeMemoryChoice,
    startRandomDiceSplitChoice,
    takeSetupMulligan,
    trashCorpInstalledCardsInScoredSourceServer,
  } = links;

  function hiddenZoneArrangeChoiceHandlerHost(
    state: GameState,
    legalAction: LegalAction,
    playerAction?: PlayerAction,
  ): HiddenZoneArrangeChoiceHandlerHost {
    return {
      state,
      legalAction,
      ...(playerAction ? { playerAction } : {}),
      constants: {
        corpRdTop5ReorderOperationCardId: deps.RD_TOP5_REORDER_OPERATION_SOURCE,
        runnerStackArrangeSourceId: deps.RONIN_AROUND_ID,
        corpRdTopArrangeSourceId: deps.TOO_MANY_DOORS_ID,
      },
      cards: {
        definitionFor: (cardId) => deps.definitionFor(state, cardId),
        hiddenReplacementLongtailKind: (definitionId) =>
          deps.cardImplementationForDefinitionId(definitionId)
            ?.hiddenReplacementLongtail?.kind,
        isHiddenZoneReorderAssetDefinition: () => false,
        hasCorpUtilityKind: (cardId, kind) =>
          deps.hasCorpUtilityKind(
            state,
            cardId,
            kind as Parameters<typeof deps.hasCorpUtilityKind>[2],
          ),
        mustInstance: (cardId) =>
          deps.mustInstance(state.cardInstances, cardId),
      },
      zones: {
        removeFromAllZones: (cardId) => deps.removeFromAllZones(state, cardId),
        rezzedCorpRootCardIds: () => deps.rezzedCorpRootCardIds(state),
      },
      servers: {
        mustServer: (serverId) => deps.mustServer(state, serverId),
        publicServerLabel: (serverId) =>
          deps.publicServerLabel(state, serverId),
      },
      choices: {
        iceChoiceLabelForSide: (cardId, visibleTo, fallback) =>
          iceChoiceLabelForSide(state, cardId, visibleTo, fallback),
      },
      callbacks: {
        runnerTurnFlags: () => deps.ensureRunnerTurnFlags(state),
      },
    };
  }

  function resolveP358HiddenReplacementChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const source = state.pendingChoice?.source ?? "";
    const hiddenZoneArrangeChoice = deps.handleHiddenZoneArrangeChoice(
      hiddenZoneArrangeChoiceHandlerHost(state, legalAction, playerAction),
    );
    if (hiddenZoneArrangeChoice.handled) return;
    void legalAction;
    void playerAction;
    throw new Error("Unbekannte P3.58-Choice.");
  }

  return {
    hiddenZoneArrangeChoiceHandlerHost,
    resolveP358HiddenReplacementChoice,
  };
}
