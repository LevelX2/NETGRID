import type { RuntimeDeps } from "./runtime-shared";
import type { ChoiceHiddenZoneRuntimeLinks } from "./choice-hidden-zone-runtime-links";
import { createPendingChoiceRuntimeHosts } from "./pending-choice-runtime-hosts";
import { createHiddenZoneSearchRuntime } from "./hidden-zone-search-runtime";
import { createHiddenZoneArrangeRuntime } from "./hidden-zone-arrange-runtime";
import { createHiddenZoneNonSearchRuntime } from "./hidden-zone-nonsearch-runtime";
import { createHiddenZoneNonSearchDiceLoopRuntime } from "./hidden-zone-nonsearch-dice-loop-runtime";
import { createCorpZoneRuntimeHosts } from "./corp-zone-runtime-hosts";

type ChoiceHiddenZoneRuntime = ChoiceHiddenZoneRuntimeLinks;

function requiredRuntimeMember<T>(name: string, member: T | undefined): T {
  if (!member) throw new Error(`Runtime dependency ${name} is not initialized.`);
  return member;
}

function createChoiceHiddenZoneRuntimeLinks(
  runtime: Partial<ChoiceHiddenZoneRuntime>,
): ChoiceHiddenZoneRuntimeLinks {
  type FunctionLinkKey = {
    [K in keyof ChoiceHiddenZoneRuntimeLinks]: ChoiceHiddenZoneRuntimeLinks[K] extends (
      ...args: infer _Args
    ) => infer _Result
      ? K
      : never;
  }[keyof ChoiceHiddenZoneRuntimeLinks];
  type LinkParameters<K extends FunctionLinkKey> =
    ChoiceHiddenZoneRuntimeLinks[K] extends (
      ...args: infer Args
    ) => infer _Result
      ? Args
      : never;
  type LinkReturn<K extends FunctionLinkKey> =
    ChoiceHiddenZoneRuntimeLinks[K] extends (
      ...args: infer _Args
    ) => infer Result
      ? Result
      : never;

  function link<K extends FunctionLinkKey>(
    name: K,
  ): ChoiceHiddenZoneRuntimeLinks[K] {
    const delegated = (...args: LinkParameters<K>): LinkReturn<K> => {
      const member = requiredRuntimeMember(name, runtime[name]) as (
        ...memberArgs: LinkParameters<K>
      ) => LinkReturn<K>;
      return member(...args);
    };
    return delegated as ChoiceHiddenZoneRuntimeLinks[K];
  }

  return {
    canInstallRunnerProgramFromZone: link("canInstallRunnerProgramFromZone"),
    hiddenZoneSearchActivationHandlerHost: link("hiddenZoneSearchActivationHandlerHost"),
    hiddenZoneSearchActivationTargetHost: link("hiddenZoneSearchActivationTargetHost"),
    hiddenZoneSearchChoiceHandlerHost: link("hiddenZoneSearchChoiceHandlerHost"),
    hiddenZoneSearchHandlerHostBase: link("hiddenZoneSearchHandlerHostBase"),
    installRunnerProgramForFree: link("installRunnerProgramForFree"),
    installRunnerProgramFromStackWithoutClick: link("installRunnerProgramFromStackWithoutClick"),
    installRunnerProgramFromZoneWithoutClick: link("installRunnerProgramFromZoneWithoutClick"),
    resolveV1911RunnerHiddenZoneAbility: link("resolveV1911RunnerHiddenZoneAbility"),
    revealCorpRdTop: link("revealCorpRdTop"),
    revealRunnerStackTop: link("revealRunnerStackTop"),
    shuffleRunnerStack: link("shuffleRunnerStack"),
    startRunnerProgramFreeMemoryChoice: link("startRunnerProgramFreeMemoryChoice"),
    hiddenZoneArrangeChoiceHandlerHost: link("hiddenZoneArrangeChoiceHandlerHost"),
    resolveP358HiddenReplacementChoice: link("resolveP358HiddenReplacementChoice"),
    RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_ACTION:
      "card_implementation_runner_installed_connection_trash_bad_publicity",
    RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE:
      "card_implementation.runner_installed_connection_trash_bad_publicity",
    canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity: link("canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity"),
    hiddenZoneNonSearchChoiceHandlerHost: link("hiddenZoneNonSearchChoiceHandlerHost"),
    iceChoiceLabelForSide: link("iceChoiceLabelForSide"),
    installedRunnerConnectionIds: link("installedRunnerConnectionIds"),
    parseRunnerInstalledConnectionTrashBadPublicityChoiceSource: link("parseRunnerInstalledConnectionTrashBadPublicityChoiceSource"),
    publicIcePositionLabelForCard: link("publicIcePositionLabelForCard"),
    publicIceSelectionLabelForCard: link("publicIceSelectionLabelForCard"),
    resolveDerezRezzedBlackIceChoice: link("resolveDerezRezzedBlackIceChoice"),
    resolveCardImplementationAccessPaymentChoice: link("resolveCardImplementationAccessPaymentChoice"),
    resolveChimeraDaemonTrashChoice: link("resolveChimeraDaemonTrashChoice"),
    resolvePayRezCostToTrashRezzedIceChoice: link("resolvePayRezCostToTrashRezzedIceChoice"),
    resolveCorpChoiceRezOrTrashIceDecisionChoice: link("resolveCorpChoiceRezOrTrashIceDecisionChoice"),
    resolveCorpChoiceRezOrTrashIceTargetChoice: link("resolveCorpChoiceRezOrTrashIceTargetChoice"),
    resolveGripInstallTemporaryCreditChoice: link("resolveGripInstallTemporaryCreditChoice"),
    resolveIncubatorTransformChoice: link("resolveIncubatorTransformChoice"),
    resolvePaidSourceReturnToGripChoice: link("resolvePaidSourceReturnToGripChoice"),
    resolveRunnerProgramReturnChoice: link("resolveRunnerProgramReturnChoice"),
    resolveRunnerHostingChoice: link("resolveRunnerHostingChoice"),
    resolveRunnerInstalledConnectionTrashBadPublicityChoice: link("resolveRunnerInstalledConnectionTrashBadPublicityChoice"),
    resolveTrashUnrezzedIceChoice: link("resolveTrashUnrezzedIceChoice"),
    resolveStackInstallRunCleanupChoice: link("resolveStackInstallRunCleanupChoice"),
    resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent: link("resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent"),
    selectedChoiceCardIds: link("selectedChoiceCardIds"),
    selectedChoiceCardIdsForChoice: link("selectedChoiceCardIdsForChoice"),
    startDerezRezzedBlackIceChoice: link("startDerezRezzedBlackIceChoice"),
    startPayRezCostToTrashRezzedIceChoice: link("startPayRezCostToTrashRezzedIceChoice"),
    startCorpChoiceRezOrTrashIceChoice: link("startCorpChoiceRezOrTrashIceChoice"),
    startPaidSourceReturnToGripChoice: link("startPaidSourceReturnToGripChoice"),
    startRunnerHostingChoice: link("startRunnerHostingChoice"),
    startTrashUnrezzedIceChoice: link("startTrashUnrezzedIceChoice"),
    continueRandomDiceLoop: link("continueRandomDiceLoop"),
    creditTextForPrompt: link("creditTextForPrompt"),
    diePromptText: link("diePromptText"),
    parseRandomDiceSplitChoiceSource: link("parseRandomDiceSplitChoiceSource"),
    parseRandomDiceSplit: link("parseRandomDiceSplit"),
    randomDiceSplitOptions: link("randomDiceSplitOptions"),
    resolveRandomDiceLoopEvent: link("resolveRandomDiceLoopEvent"),
    resolveRandomDiceSplitChoice: link("resolveRandomDiceSplitChoice"),
    startRandomDiceSplitChoice: link("startRandomDiceSplitChoice"),
    addCounterToAllInstalledRunnerIcebreakers: link("addCounterToAllInstalledRunnerIcebreakers"),
    chooseCorpAgendasForPointCost: link("chooseCorpAgendasForPointCost"),
    corpAgendaPointTotal: link("corpAgendaPointTotal"),
    corpZoneChoiceHandlerHost: link("corpZoneChoiceHandlerHost"),
    exposeCorpCardInServer: link("exposeCorpCardInServer"),
    exposeInstalledCorpCardForImplementation: link("exposeInstalledCorpCardForImplementation"),
    exposeInstalledCorpCardLabel: link("exposeInstalledCorpCardLabel"),
    exposeInstalledCorpCardTargets: link("exposeInstalledCorpCardTargets"),
    exposeInstalledCorpCardsChoiceOptions: link("exposeInstalledCorpCardsChoiceOptions"),
    exposeOutermostIceOfEachDataFort: link("exposeOutermostIceOfEachDataFort"),
    exposedCorpCardInServer: link("exposedCorpCardInServer"),
    multiExposeInstalledCorpCardOptionLabel: link("multiExposeInstalledCorpCardOptionLabel"),
    multiExposeInstalledCorpCardTargets: link("multiExposeInstalledCorpCardTargets"),
    installedCorpCardServerContext: link("installedCorpCardServerContext"),
    installedRunnerIcebreakerIds: link("installedRunnerIcebreakerIds"),
    outermostIceExposures: link("outermostIceExposures"),
    resolveRunnerIcebreakerCounterEvent: link("resolveRunnerIcebreakerCounterEvent"),
    resolveExposePreventionChoice: link("resolveExposePreventionChoice"),
    resolveExposeInstalledCorpCardsChoice: link("resolveExposeInstalledCorpCardsChoice"),
    resolveMultiExposeInstalledCorpCardsChoice: link("resolveMultiExposeInstalledCorpCardsChoice"),
    resolveScoredAgendaCorpRdTopReveal: link("resolveScoredAgendaCorpRdTopReveal"),
    shuffleCorpCardIntoRd: link("shuffleCorpCardIntoRd"),
    startExposeInstalledCorpCardsChoice: link("startExposeInstalledCorpCardsChoice"),
    startMultiExposeInstalledCorpCardsChoice: link("startMultiExposeInstalledCorpCardsChoice"),
    trashCorpInstalledCardsInScoredSourceServer: link("trashCorpInstalledCardsInScoredSourceServer"),
    discardChoice: link("discardChoice"),
    pendingChoiceResolutionHost: link("pendingChoiceResolutionHost"),
    resolveDiscardChoice: link("resolveDiscardChoice"),
    resolveSetupMulliganChoice: link("resolveSetupMulliganChoice"),
    setupMulliganChoice: link("setupMulliganChoice"),
    takeSetupMulligan: link("takeSetupMulligan"),
  };
}

export function createChoiceHiddenZoneRuntime(
  deps: RuntimeDeps,
): ChoiceHiddenZoneRuntime {
  const runtime: Partial<ChoiceHiddenZoneRuntime> = {};
  const links = createChoiceHiddenZoneRuntimeLinks(runtime);
  Object.assign(
    runtime,
    createHiddenZoneSearchRuntime(deps, links),
    createHiddenZoneArrangeRuntime(deps, links),
    createHiddenZoneNonSearchRuntime(deps, links),
    createHiddenZoneNonSearchDiceLoopRuntime(deps),
    createCorpZoneRuntimeHosts(deps, links),
    createPendingChoiceRuntimeHosts(deps, links),
  );
  return runtime as ChoiceHiddenZoneRuntime;
}
