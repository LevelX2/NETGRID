import { runtimeDelegates } from "./runtime-delegate-store";
import type {
  ChoiceRuntimePortFunction,
  ChoiceRuntimePortGroups,
} from "./runtime-port-contracts";

const typedRuntimePorts =
  runtimeDelegates as unknown as ChoiceRuntimePortGroups;

export const startRunnerPrivateLookChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneResolvers",
  "startRunnerPrivateLookChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneResolvers.startRunnerPrivateLookChoice(
    ...args,
  );

export const resolveRunnerPrivateLookChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneResolvers",
  "resolveRunnerPrivateLookChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneResolvers.resolveRunnerPrivateLookChoice(
    ...args,
  );

export const startPostAccessInstalledProgramChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneResolvers",
  "startPostAccessInstalledProgramChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneResolvers.startPostAccessInstalledProgramChoice(
    ...args,
  );

export const v1915InstalledRevealHelperIds: ChoiceRuntimePortFunction<
  "choiceHiddenZoneResolvers",
  "v1915InstalledRevealHelperIds"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneResolvers.v1915InstalledRevealHelperIds(
    ...args,
  );

export const runnerHasInstalledDefinition: ChoiceRuntimePortFunction<
  "choiceHiddenZoneResolvers",
  "runnerHasInstalledDefinition"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneResolvers.runnerHasInstalledDefinition(
    ...args,
  );

export const trashOlderRegionUpgradesInServer: ChoiceRuntimePortFunction<
  "choiceHiddenZoneResolvers",
  "trashOlderRegionUpgradesInServer"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneResolvers.trashOlderRegionUpgradesInServer(
    ...args,
  );

export const appendRegionReplacementTrashEffect: ChoiceRuntimePortFunction<
  "choiceHiddenZoneResolvers",
  "appendRegionReplacementTrashEffect"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneResolvers.appendRegionReplacementTrashEffect(
    ...args,
  );

export const hiddenZoneSearchHandlerHostBase: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "hiddenZoneSearchHandlerHostBase"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.hiddenZoneSearchHandlerHostBase(
    ...args,
  );

export const hiddenZoneSearchActivationTargetHost: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "hiddenZoneSearchActivationTargetHost"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.hiddenZoneSearchActivationTargetHost(
    ...args,
  );

export const hiddenZoneSearchChoiceHandlerHost: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "hiddenZoneSearchChoiceHandlerHost"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.hiddenZoneSearchChoiceHandlerHost(
    ...args,
  );

export const hiddenZoneSearchActivationHandlerHost: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "hiddenZoneSearchActivationHandlerHost"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.hiddenZoneSearchActivationHandlerHost(
    ...args,
  );

export const hiddenZoneArrangeChoiceHandlerHost: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "hiddenZoneArrangeChoiceHandlerHost"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.hiddenZoneArrangeChoiceHandlerHost(
    ...args,
  );

export const hiddenZoneNonSearchChoiceHandlerHost: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "hiddenZoneNonSearchChoiceHandlerHost"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.hiddenZoneNonSearchChoiceHandlerHost(
    ...args,
  );

export const corpZoneChoiceHandlerHost: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "corpZoneChoiceHandlerHost"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.corpZoneChoiceHandlerHost(...args);

export const pendingChoiceResolutionHost: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "pendingChoiceResolutionHost"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.pendingChoiceResolutionHost(
    ...args,
  );

export const setupMulliganChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "setupMulliganChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.setupMulliganChoice(...args);

export const discardChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "discardChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.discardChoice(...args);

export const resolveDiscardChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveDiscardChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveDiscardChoice(...args);

export const resolveSetupMulliganChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveSetupMulliganChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveSetupMulliganChoice(...args);

export const takeSetupMulligan: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "takeSetupMulligan"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.takeSetupMulligan(...args);

export const installRunnerProgramFromStackWithoutClick: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "installRunnerProgramFromStackWithoutClick"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.installRunnerProgramFromStackWithoutClick(
    ...args,
  );

export const canInstallRunnerProgramFromZone: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "canInstallRunnerProgramFromZone"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.canInstallRunnerProgramFromZone(
    ...args,
  );

export const installRunnerProgramFromZoneWithoutClick: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "installRunnerProgramFromZoneWithoutClick"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.installRunnerProgramFromZoneWithoutClick(
    ...args,
  );

export const startRunnerProgramFreeMemoryChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "startRunnerProgramFreeMemoryChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.startRunnerProgramFreeMemoryChoice(
    ...args,
  );

export const installRunnerProgramForFree: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "installRunnerProgramForFree"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.installRunnerProgramForFree(
    ...args,
  );

export const startDerezRezzedBlackIceChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "startDerezRezzedBlackIceChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.startDerezRezzedBlackIceChoice(
    ...args,
  );

export const resolveDerezRezzedBlackIceChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveDerezRezzedBlackIceChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveDerezRezzedBlackIceChoice(
    ...args,
  );

export const startPayRezCostToTrashRezzedIceChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "startPayRezCostToTrashRezzedIceChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.startPayRezCostToTrashRezzedIceChoice(
    ...args,
  );

export const resolvePayRezCostToTrashRezzedIceChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolvePayRezCostToTrashRezzedIceChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolvePayRezCostToTrashRezzedIceChoice(
    ...args,
  );

export const publicIcePositionLabelForCard: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "publicIcePositionLabelForCard"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.publicIcePositionLabelForCard(
    ...args,
  );

export const publicIceSelectionLabelForCard: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "publicIceSelectionLabelForCard"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.publicIceSelectionLabelForCard(
    ...args,
  );

export const startCorpChoiceRezOrTrashIceChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "startCorpChoiceRezOrTrashIceChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.startCorpChoiceRezOrTrashIceChoice(
    ...args,
  );

export const resolveCorpChoiceRezOrTrashIceTargetChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveCorpChoiceRezOrTrashIceTargetChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveCorpChoiceRezOrTrashIceTargetChoice(
    ...args,
  );

export const resolveCorpChoiceRezOrTrashIceDecisionChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveCorpChoiceRezOrTrashIceDecisionChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveCorpChoiceRezOrTrashIceDecisionChoice(
    ...args,
  );

export const startTrashUnrezzedIceChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "startTrashUnrezzedIceChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.startTrashUnrezzedIceChoice(
    ...args,
  );

export const resolveTrashUnrezzedIceChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveTrashUnrezzedIceChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveTrashUnrezzedIceChoice(
    ...args,
  );

export const startPaidSourceReturnToGripChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "startPaidSourceReturnToGripChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.startPaidSourceReturnToGripChoice(
    ...args,
  );

export const resolvePaidSourceReturnToGripChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolvePaidSourceReturnToGripChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolvePaidSourceReturnToGripChoice(
    ...args,
  );

export const corpAgendaPointTotal: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "corpAgendaPointTotal"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.corpAgendaPointTotal(...args);

export const chooseCorpAgendasForPointCost: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "chooseCorpAgendasForPointCost"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.chooseCorpAgendasForPointCost(
    ...args,
  );

export const startRunnerHostingChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "startRunnerHostingChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.startRunnerHostingChoice(...args);

export const resolveRunnerHostingChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveRunnerHostingChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveRunnerHostingChoice(...args);

export const resolveIncubatorTransformChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveIncubatorTransformChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveIncubatorTransformChoice(
    ...args,
  );

export const resolveChimeraDaemonTrashChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveChimeraDaemonTrashChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveChimeraDaemonTrashChoice(
    ...args,
  );

export const resolveCardImplementationAccessPaymentChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveCardImplementationAccessPaymentChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveCardImplementationAccessPaymentChoice(
    ...args,
  );

export const resolveRunnerProgramReturnChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveRunnerProgramReturnChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveRunnerProgramReturnChoice(
    ...args,
  );

export const selectedChoiceCardIds: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "selectedChoiceCardIds"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.selectedChoiceCardIds(...args);

export const iceChoiceLabelForSide: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "iceChoiceLabelForSide"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.iceChoiceLabelForSide(...args);

export const resolveP358HiddenReplacementChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveP358HiddenReplacementChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveP358HiddenReplacementChoice(
    ...args,
  );

export const installedRunnerConnectionIds: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "installedRunnerConnectionIds"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.installedRunnerConnectionIds(
    ...args,
  );

export const canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity(
    ...args,
  );

export const resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent(
    ...args,
  );

export const parseRunnerInstalledConnectionTrashBadPublicityChoiceSource: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "parseRunnerInstalledConnectionTrashBadPublicityChoiceSource"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.parseRunnerInstalledConnectionTrashBadPublicityChoiceSource(
    ...args,
  );

export const selectedChoiceCardIdsForChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "selectedChoiceCardIdsForChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.selectedChoiceCardIdsForChoice(
    ...args,
  );

export const resolveRunnerInstalledConnectionTrashBadPublicityChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveRunnerInstalledConnectionTrashBadPublicityChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveRunnerInstalledConnectionTrashBadPublicityChoice(
    ...args,
  );

export const resolveRandomDiceLoopEvent: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveRandomDiceLoopEvent"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveRandomDiceLoopEvent(...args);

export const startRandomDiceSplitChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "startRandomDiceSplitChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.startRandomDiceSplitChoice(...args);

export const creditTextForPrompt: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "creditTextForPrompt"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.creditTextForPrompt(...args);

export const diePromptText: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "diePromptText"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.diePromptText(...args);

export const randomDiceSplitOptions: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "randomDiceSplitOptions"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.randomDiceSplitOptions(...args);

export const parseRandomDiceSplitChoiceSource: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "parseRandomDiceSplitChoiceSource"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.parseRandomDiceSplitChoiceSource(
    ...args,
  );

export const parseRandomDiceSplit: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "parseRandomDiceSplit"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.parseRandomDiceSplit(...args);

export const continueRandomDiceLoop: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "continueRandomDiceLoop"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.continueRandomDiceLoop(...args);

export const resolveRandomDiceSplitChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveRandomDiceSplitChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveRandomDiceSplitChoice(
    ...args,
  );

export const shuffleRunnerStack: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "shuffleRunnerStack"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.shuffleRunnerStack(...args);

export const revealRunnerStackTop: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "revealRunnerStackTop"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.revealRunnerStackTop(...args);

export const revealCorpRdTop: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "revealCorpRdTop"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.revealCorpRdTop(...args);

export const resolveV1911RunnerHiddenZoneAbility: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveV1911RunnerHiddenZoneAbility"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveV1911RunnerHiddenZoneAbility(
    ...args,
  );

export const resolveScoredAgendaCorpRdTopReveal: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveScoredAgendaCorpRdTopReveal"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveScoredAgendaCorpRdTopReveal(
    ...args,
  );

export const exposedCorpCardInServer: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "exposedCorpCardInServer"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.exposedCorpCardInServer(...args);

export const exposeCorpCardInServer: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "exposeCorpCardInServer"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.exposeCorpCardInServer(...args);

export const installedCorpCardServerContext: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "installedCorpCardServerContext"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.installedCorpCardServerContext(
    ...args,
  );

export const exposeInstalledCorpCardTargets: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "exposeInstalledCorpCardTargets"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.exposeInstalledCorpCardTargets(
    ...args,
  );

export const exposeInstalledCorpCardLabel: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "exposeInstalledCorpCardLabel"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.exposeInstalledCorpCardLabel(
    ...args,
  );

export const exposeInstalledCorpCardForImplementation: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "exposeInstalledCorpCardForImplementation"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.exposeInstalledCorpCardForImplementation(
    ...args,
  );

export const installedRunnerIcebreakerIds: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "installedRunnerIcebreakerIds"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.installedRunnerIcebreakerIds(
    ...args,
  );

export const addCounterToAllInstalledRunnerIcebreakers: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "addCounterToAllInstalledRunnerIcebreakers"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.addCounterToAllInstalledRunnerIcebreakers(
    ...args,
  );

export const shuffleCorpCardIntoRd: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "shuffleCorpCardIntoRd"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.shuffleCorpCardIntoRd(...args);

export const trashCorpInstalledCardsInScoredSourceServer: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "trashCorpInstalledCardsInScoredSourceServer"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.trashCorpInstalledCardsInScoredSourceServer(
    ...args,
  );

export const resolveRunnerIcebreakerCounterEvent: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveRunnerIcebreakerCounterEvent"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveRunnerIcebreakerCounterEvent(
    ...args,
  );

export const multiExposeInstalledCorpCardTargets: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "multiExposeInstalledCorpCardTargets"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.multiExposeInstalledCorpCardTargets(
    ...args,
  );

export const multiExposeInstalledCorpCardOptionLabel: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "multiExposeInstalledCorpCardOptionLabel"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.multiExposeInstalledCorpCardOptionLabel(
    ...args,
  );

export const exposeInstalledCorpCardsChoiceOptions: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "exposeInstalledCorpCardsChoiceOptions"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.exposeInstalledCorpCardsChoiceOptions(
    ...args,
  );

export const startMultiExposeInstalledCorpCardsChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "startMultiExposeInstalledCorpCardsChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.startMultiExposeInstalledCorpCardsChoice(
    ...args,
  );

export const startExposeInstalledCorpCardsChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "startExposeInstalledCorpCardsChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.startExposeInstalledCorpCardsChoice(
    ...args,
  );

export const resolveMultiExposeInstalledCorpCardsChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveMultiExposeInstalledCorpCardsChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveMultiExposeInstalledCorpCardsChoice(
    ...args,
  );

export const resolveExposeInstalledCorpCardsChoice: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "resolveExposeInstalledCorpCardsChoice"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.resolveExposeInstalledCorpCardsChoice(
    ...args,
  );

export const outermostIceExposures: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "outermostIceExposures"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.outermostIceExposures(...args);

export const exposeOutermostIceOfEachDataFort: ChoiceRuntimePortFunction<
  "choiceHiddenZoneRuntime",
  "exposeOutermostIceOfEachDataFort"
> = (...args) =>
  typedRuntimePorts.choiceHiddenZoneRuntime.exposeOutermostIceOfEachDataFort(
    ...args,
  );
