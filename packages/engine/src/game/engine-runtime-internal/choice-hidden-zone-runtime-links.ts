import type {
  GameState,
  LegalAction,
  PlayerAction,
  RuntimeDeps,
} from "./runtime-shared";

type ChoiceResolver = (
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
) => void;

export interface ChoiceHiddenZoneRuntimeLinks {
  RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_ACTION: string;
  RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE: string;
  canInstallRunnerProgramFromZone: RuntimeDeps["canInstallRunnerProgramFromZone"];
  hiddenZoneSearchActivationHandlerHost: RuntimeDeps["hiddenZoneSearchActivationHandlerHost"];
  hiddenZoneSearchActivationTargetHost: RuntimeDeps["hiddenZoneSearchActivationTargetHost"];
  hiddenZoneSearchChoiceHandlerHost: RuntimeDeps["hiddenZoneSearchChoiceHandlerHost"];
  hiddenZoneSearchHandlerHostBase: RuntimeDeps["hiddenZoneSearchHandlerHostBase"];
  installRunnerProgramForFree: RuntimeDeps["installRunnerProgramForFree"];
  installRunnerProgramFromStackWithoutClick: RuntimeDeps["installRunnerProgramFromStackWithoutClick"];
  installRunnerProgramFromZoneWithoutClick: RuntimeDeps["installRunnerProgramFromZoneWithoutClick"];
  resolveV1911RunnerHiddenZoneAbility: RuntimeDeps["resolveV1911RunnerHiddenZoneAbility"];
  revealCorpRdTop: RuntimeDeps["revealCorpRdTop"];
  revealRunnerStackTop: RuntimeDeps["revealRunnerStackTop"];
  shuffleRunnerStack: RuntimeDeps["shuffleRunnerStack"];
  startRunnerProgramFreeMemoryChoice: RuntimeDeps["startRunnerProgramFreeMemoryChoice"];
  hiddenZoneArrangeChoiceHandlerHost: RuntimeDeps["hiddenZoneArrangeChoiceHandlerHost"];
  resolveP358HiddenReplacementChoice: RuntimeDeps["resolveP358HiddenReplacementChoice"];
  canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity: RuntimeDeps["canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity"];
  hiddenZoneNonSearchChoiceHandlerHost: RuntimeDeps["hiddenZoneNonSearchChoiceHandlerHost"];
  iceChoiceLabelForSide: RuntimeDeps["iceChoiceLabelForSide"];
  installedRunnerConnectionIds: RuntimeDeps["installedRunnerConnectionIds"];
  parseRunnerInstalledConnectionTrashBadPublicityChoiceSource: RuntimeDeps["parseRunnerInstalledConnectionTrashBadPublicityChoiceSource"];
  publicIcePositionLabelForCard: RuntimeDeps["publicIcePositionLabelForCard"];
  publicIceSelectionLabelForCard: RuntimeDeps["publicIceSelectionLabelForCard"];
  resolveDerezRezzedBlackIceChoice: RuntimeDeps["resolveDerezRezzedBlackIceChoice"];
  resolveCardImplementationAccessPaymentChoice: RuntimeDeps["resolveCardImplementationAccessPaymentChoice"];
  resolveChimeraDaemonTrashChoice: RuntimeDeps["resolveChimeraDaemonTrashChoice"];
  resolvePayRezCostToTrashRezzedIceChoice: RuntimeDeps["resolvePayRezCostToTrashRezzedIceChoice"];
  resolveCorpChoiceRezOrTrashIceDecisionChoice: RuntimeDeps["resolveCorpChoiceRezOrTrashIceDecisionChoice"];
  resolveCorpChoiceRezOrTrashIceTargetChoice: RuntimeDeps["resolveCorpChoiceRezOrTrashIceTargetChoice"];
  resolveGripInstallTemporaryCreditChoice: ChoiceResolver;
  resolveIncubatorTransformChoice: RuntimeDeps["resolveIncubatorTransformChoice"];
  resolvePaidSourceReturnToGripChoice: RuntimeDeps["resolvePaidSourceReturnToGripChoice"];
  resolveRunnerProgramReturnChoice: RuntimeDeps["resolveRunnerProgramReturnChoice"];
  resolveRunnerHostingChoice: RuntimeDeps["resolveRunnerHostingChoice"];
  resolveRunnerInstalledConnectionTrashBadPublicityChoice: RuntimeDeps["resolveRunnerInstalledConnectionTrashBadPublicityChoice"];
  resolveTrashUnrezzedIceChoice: RuntimeDeps["resolveTrashUnrezzedIceChoice"];
  resolveStackInstallRunCleanupChoice: ChoiceResolver;
  resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent: RuntimeDeps["resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent"];
  selectedChoiceCardIds: RuntimeDeps["selectedChoiceCardIds"];
  selectedChoiceCardIdsForChoice: RuntimeDeps["selectedChoiceCardIdsForChoice"];
  startDerezRezzedBlackIceChoice: RuntimeDeps["startDerezRezzedBlackIceChoice"];
  startPayRezCostToTrashRezzedIceChoice: RuntimeDeps["startPayRezCostToTrashRezzedIceChoice"];
  startCorpChoiceRezOrTrashIceChoice: RuntimeDeps["startCorpChoiceRezOrTrashIceChoice"];
  startPaidSourceReturnToGripChoice: RuntimeDeps["startPaidSourceReturnToGripChoice"];
  startRunnerHostingChoice: RuntimeDeps["startRunnerHostingChoice"];
  startTrashUnrezzedIceChoice: RuntimeDeps["startTrashUnrezzedIceChoice"];
  continueRandomDiceLoop: RuntimeDeps["continueRandomDiceLoop"];
  creditTextForPrompt: RuntimeDeps["creditTextForPrompt"];
  diePromptText: RuntimeDeps["diePromptText"];
  parseRandomDiceSplitChoiceSource: RuntimeDeps["parseRandomDiceSplitChoiceSource"];
  parseRandomDiceSplit: RuntimeDeps["parseRandomDiceSplit"];
  randomDiceSplitOptions: RuntimeDeps["randomDiceSplitOptions"];
  resolveRandomDiceLoopEvent: RuntimeDeps["resolveRandomDiceLoopEvent"];
  resolveRandomDiceSplitChoice: RuntimeDeps["resolveRandomDiceSplitChoice"];
  startRandomDiceSplitChoice: RuntimeDeps["startRandomDiceSplitChoice"];
  addCounterToAllInstalledRunnerIcebreakers: RuntimeDeps["addCounterToAllInstalledRunnerIcebreakers"];
  chooseCorpAgendasForPointCost: RuntimeDeps["chooseCorpAgendasForPointCost"];
  corpAgendaPointTotal: RuntimeDeps["corpAgendaPointTotal"];
  corpZoneChoiceHandlerHost: RuntimeDeps["corpZoneChoiceHandlerHost"];
  exposeCorpCardInServer: RuntimeDeps["exposeCorpCardInServer"];
  exposeInstalledCorpCardForImplementation: RuntimeDeps["exposeInstalledCorpCardForImplementation"];
  exposeInstalledCorpCardLabel: RuntimeDeps["exposeInstalledCorpCardLabel"];
  exposeInstalledCorpCardTargets: RuntimeDeps["exposeInstalledCorpCardTargets"];
  exposeInstalledCorpCardsChoiceOptions: RuntimeDeps["exposeInstalledCorpCardsChoiceOptions"];
  exposeOutermostIceOfEachDataFort: RuntimeDeps["exposeOutermostIceOfEachDataFort"];
  exposedCorpCardInServer: RuntimeDeps["exposedCorpCardInServer"];
  multiExposeInstalledCorpCardOptionLabel: RuntimeDeps["multiExposeInstalledCorpCardOptionLabel"];
  multiExposeInstalledCorpCardTargets: RuntimeDeps["multiExposeInstalledCorpCardTargets"];
  installedCorpCardServerContext: RuntimeDeps["installedCorpCardServerContext"];
  installedRunnerIcebreakerIds: RuntimeDeps["installedRunnerIcebreakerIds"];
  outermostIceExposures: RuntimeDeps["outermostIceExposures"];
  resolveRunnerIcebreakerCounterEvent: RuntimeDeps["resolveRunnerIcebreakerCounterEvent"];
  resolveExposePreventionChoice: ChoiceResolver;
  resolveExposeInstalledCorpCardsChoice: RuntimeDeps["resolveExposeInstalledCorpCardsChoice"];
  resolveMultiExposeInstalledCorpCardsChoice: RuntimeDeps["resolveMultiExposeInstalledCorpCardsChoice"];
  resolveScoredAgendaCorpRdTopReveal: RuntimeDeps["resolveScoredAgendaCorpRdTopReveal"];
  shuffleCorpCardIntoRd: RuntimeDeps["shuffleCorpCardIntoRd"];
  startExposeInstalledCorpCardsChoice: RuntimeDeps["startExposeInstalledCorpCardsChoice"];
  startMultiExposeInstalledCorpCardsChoice: RuntimeDeps["startMultiExposeInstalledCorpCardsChoice"];
  trashCorpInstalledCardsInScoredSourceServer: RuntimeDeps["trashCorpInstalledCardsInScoredSourceServer"];
  discardChoice: RuntimeDeps["discardChoice"];
  pendingChoiceResolutionHost: RuntimeDeps["pendingChoiceResolutionHost"];
  resolveDiscardChoice: RuntimeDeps["resolveDiscardChoice"];
  resolveSetupMulliganChoice: RuntimeDeps["resolveSetupMulliganChoice"];
  setupMulliganChoice: RuntimeDeps["setupMulliganChoice"];
  takeSetupMulligan: RuntimeDeps["takeSetupMulligan"];
}
