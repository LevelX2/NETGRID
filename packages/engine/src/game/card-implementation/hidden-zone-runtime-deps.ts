import type { LegalAction } from "@netgrid/shared";
import {
  moveTopTrashToGripForCardImplementation,
  startCardImplementationLookTopStackTakeOneArrangeRestChoice,
} from "../hidden-zone/arrange-choice-handlers";
import { startShowHqAgendasForCreditsChoice as startShowHqAgendasForCreditsChoiceInHiddenZone } from "../hidden-zone/corp-zone-choice-handlers";
import {
  startCardImplementationTrashCardsFromGripForCreditsChoice,
  startCardImplementationTrashOwnInstalledCardsForCreditsChoice,
} from "../hidden-zone/nonsearch-choice-handlers";
import {
  lookTopStackShowToCorpThenInstallMatchingTargets,
  lookTopStackTakeMatchingTargets,
  searchStackInstallTargets,
  searchStackToGripTargets,
  searchTrashToGripTargets,
  stackOrTrashProgramInstallTargets,
  startLookTopStackShowToCorpThenInstallMatchingActivation,
  startLookTopStackTakeMatchingActivation,
  startSearchStackInstallActivation,
  startSearchStackToGripActivation,
  startSearchTrashToGripActivation,
  startStackOrTrashProgramInstallActivation,
} from "../hidden-zone/search-choice-activations";
import type {
  HiddenZoneCardImplementationRuntimeDeps,
  HiddenZoneRuntimeDepsHost,
} from "./hidden-zone-runtime-types";

export type {
  HiddenZoneCardImplementationRuntimeDeps,
  HiddenZoneRuntimeDepsHost,
  HiddenZoneRuntimeDepsKey,
} from "./hidden-zone-runtime-types";

export function createHiddenZoneCardImplementationRuntimeDeps(
  host: HiddenZoneRuntimeDepsHost,
): HiddenZoneCardImplementationRuntimeDeps {
  return {
    startPrivateLook: (
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      zone,
      count,
    ) => {
      host.callbacks.startRunnerPrivateLookChoice(
        state,
        legalAction,
        sourceCardId,
        sourceDefinitionId,
        zone,
        count,
      );
      return { publicPayload: legalAction.payload ?? {} };
    },
    exposeInstalledCorpCardTargets: (state, scope) =>
      host.callbacks.exposeInstalledCorpCardTargets(state, scope),
    exposeInstalledCorpCard: (
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      targetCardId,
      scope,
    ) =>
      host.callbacks.exposeInstalledCorpCard(
        state,
        legalAction,
        sourceCardId,
        sourceDefinitionId,
        targetCardId,
        scope,
      ),
    startExposeInstalledCorpCardsChoice: (
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      min,
      max,
      scope,
    ) =>
      host.callbacks.startExposeInstalledCorpCardsChoice(
        state,
        legalAction,
        sourceCardId,
        sourceDefinitionId,
        min,
        max,
        scope,
      ),
    exposeOutermostIceEachDataFort: (
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
    ) =>
      host.callbacks.exposeOutermostIceOfEachDataFort(
        state,
        legalAction,
        sourceCardId,
        sourceDefinitionId,
      ),
    outermostIceEachDataFortExposeCount: (state) =>
      host.callbacks.outermostIceExposures(state).length,
    startShowHqAgendasForCreditsChoice: (
      state,
      sourceCardId,
      sourceDefinitionId,
      creditPerAgenda,
    ) =>
      startShowHqAgendasForCreditsChoiceInHiddenZone(
        host.hiddenZone.corpZoneChoiceHandlerHost(state, {
          side: "corp",
          payload: {},
        } as LegalAction),
        { sourceCardId, sourceDefinitionId, creditPerAgenda },
      ),
    searchTrashToGripTargetCount: (state, filter) =>
      searchTrashToGripTargets(
        host.hiddenZone.searchActivationTargetHost(state),
        filter,
      ).length,
    searchStackToGripTargetCount: (state, filter) =>
      searchStackToGripTargets(
        host.hiddenZone.searchActivationTargetHost(state),
        filter,
      ).length,
    topTrashToGripTargetCount: (state) =>
      host.cards.topRunnerHeapCardId(state) ? 1 : 0,
    topTrashToGripTargetId: (state) => host.cards.topRunnerHeapCardId(state),
    searchStackInstallTargetCount: (state, filter, installCost) =>
      searchStackInstallTargets(
        host.hiddenZone.searchActivationTargetHost(state),
        filter,
        installCost,
      ).length,
    stackOrTrashProgramInstallTargetCount: (state, installCost) =>
      stackOrTrashProgramInstallTargets(
        host.hiddenZone.searchActivationTargetHost(state),
        installCost,
      ).length,
    lookTopStackShowToCorpThenInstallMatchingTargetCount: (
      state,
      count,
      allowedTypes,
      installCost,
    ) =>
      lookTopStackShowToCorpThenInstallMatchingTargets(
        host.hiddenZone.searchActivationTargetHost(state),
        count,
        allowedTypes,
        installCost,
      ).length,
    lookTopStackTakeMatchingTargetCount: (state, count, allowedTypes) =>
      lookTopStackTakeMatchingTargets(
        host.hiddenZone.searchActivationTargetHost(state),
        count,
        allowedTypes,
      ).length,
    startSearchTrashToGripChoice: (
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      filter,
    ) =>
      startSearchTrashToGripActivation(
        host.hiddenZone.searchActivationHandlerHost(state, legalAction),
        {
          sourceCardId,
          sourceDefinitionId,
          filter,
        },
      ),
    startSearchStackToGripChoice: (
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      filter,
      revealToCorp,
      shuffleAfterwards,
    ) =>
      startSearchStackToGripActivation(
        host.hiddenZone.searchActivationHandlerHost(state, legalAction),
        {
          sourceCardId,
          sourceDefinitionId,
          filter,
          revealToCorp,
          shuffleAfterwards,
        },
      ),
    moveTopTrashToGrip: (
      state,
      legalAction,
      _sourceCardId,
      sourceDefinitionId,
    ) =>
      moveTopTrashToGripForCardImplementation(
        host.hiddenZone.arrangeChoiceHandlerHost(state, legalAction),
        { sourceDefinitionId },
      ),
    startSearchStackInstallChoice: (
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      filter,
      installCost,
      shuffleAfterwards,
    ) =>
      startSearchStackInstallActivation(
        host.hiddenZone.searchActivationHandlerHost(state, legalAction),
        {
          sourceCardId,
          sourceDefinitionId,
          filter,
          installCost,
          shuffleAfterwards,
        },
      ),
    startStackOrTrashProgramInstallChoice: (
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      installCost,
      shuffleStackIfSearched,
      returnInstalledCardToGripAtEndOfTurn,
    ) =>
      startStackOrTrashProgramInstallActivation(
        host.hiddenZone.searchActivationHandlerHost(state, legalAction),
        {
          sourceCardId,
          sourceDefinitionId,
          installCost,
          shuffleStackIfSearched,
          returnInstalledCardToGripAtEndOfTurn,
        },
      ),
    startLookTopStackShowToCorpThenInstallMatchingChoice: (
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      count,
      allowedTypes,
      installCost,
      trashSourceIfInstalled,
      shuffleAfterwards,
    ) =>
      startLookTopStackShowToCorpThenInstallMatchingActivation(
        host.hiddenZone.searchActivationHandlerHost(state, legalAction),
        {
          sourceCardId,
          sourceDefinitionId,
          count,
          allowedTypes,
          installCost,
          trashSourceIfInstalled,
          shuffleAfterwards,
        },
      ),
    startLookTopStackTakeMatchingChoice: (
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      count,
      allowedTypes,
      costPerTaken,
      revealTakenToCorp,
      shuffleRemainder,
    ) =>
      startLookTopStackTakeMatchingActivation(
        host.hiddenZone.searchActivationHandlerHost(state, legalAction),
        {
          sourceCardId,
          sourceDefinitionId,
          count,
          allowedTypes,
          costPerTaken,
          revealTakenToCorp,
          shuffleRemainder,
        },
      ),
    startLookTopStackTakeOneArrangeRestChoice: (
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      count,
    ) =>
      startCardImplementationLookTopStackTakeOneArrangeRestChoice(
        host.hiddenZone.arrangeChoiceHandlerHost(state, legalAction),
        { sourceCardId, sourceDefinitionId, count },
      ),
    trashOwnInstalledCardTargetCount: (state) =>
      host.cards.runnerInstalledCardIds(state).length,
    trashGripCardTargetCount: (state) => state.runner.grip.length,
    startTrashOwnInstalledCardsForCreditsChoice: (
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      min,
      max,
      gainPerTrashed,
    ) =>
      startCardImplementationTrashOwnInstalledCardsForCreditsChoice(
        host.hiddenZone.nonSearchChoiceHandlerHost(state, legalAction),
        { sourceCardId, sourceDefinitionId, min, max, gainPerTrashed },
      ),
    startTrashCardsFromGripForCreditsChoice: (
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      max,
      gainPerTrashed,
    ) =>
      startCardImplementationTrashCardsFromGripForCreditsChoice(
        host.hiddenZone.nonSearchChoiceHandlerHost(state, legalAction),
        { sourceCardId, sourceDefinitionId, max, gainPerTrashed },
      ),
    shuffleGripTrashAndStackThenDraw: (
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      drawCount,
      removePlayedCardFromGame,
    ) =>
      host.callbacks.shuffleGripTrashAndStackThenDrawForCardImplementation(
        state,
        legalAction,
        sourceCardId,
        sourceDefinitionId,
        drawCount,
        removePlayedCardFromGame,
      ),
  };
}
