import type { CardInstanceId, LegalAction } from "@netgrid/shared";
import type { CardImplementationRuntimeDependencies } from "../../ability-engine/card-implementation-runtime";
import type { HiddenZoneArrangeChoiceHandlerHost } from "../hidden-zone/arrange-choice-handlers";
import type { CorpZoneChoiceHandlerHost } from "../hidden-zone/corp-zone-choice-handlers";
import type { HiddenZoneNonSearchChoiceHandlerHost } from "../hidden-zone/nonsearch-choice-handlers";
import type {
  HiddenZoneSearchActivationBaseHost,
  HiddenZoneSearchActivationHost,
} from "../hidden-zone/search-choice-activations";

export type HiddenZoneRuntimeDepsKey =
  | "startPrivateLook"
  | "exposeInstalledCorpCardTargets"
  | "exposeInstalledCorpCard"
  | "startExposeInstalledCorpCardsChoice"
  | "exposeOutermostIceEachDataFort"
  | "outermostIceEachDataFortExposeCount"
  | "startShowHqAgendasForCreditsChoice"
  | "searchTrashToGripTargetCount"
  | "searchStackToGripTargetCount"
  | "topTrashToGripTargetCount"
  | "topTrashToGripTargetId"
  | "searchStackInstallTargetCount"
  | "stackOrTrashProgramInstallTargetCount"
  | "lookTopStackShowToCorpThenInstallMatchingTargetCount"
  | "lookTopStackTakeMatchingTargetCount"
  | "startSearchTrashToGripChoice"
  | "startSearchStackToGripChoice"
  | "moveTopTrashToGrip"
  | "startSearchStackInstallChoice"
  | "startStackOrTrashProgramInstallChoice"
  | "startLookTopStackShowToCorpThenInstallMatchingChoice"
  | "startLookTopStackTakeMatchingChoice"
  | "startLookTopStackTakeOneArrangeRestChoice"
  | "trashOwnInstalledCardTargetCount"
  | "trashGripCardTargetCount"
  | "startTrashOwnInstalledCardsForCreditsChoice"
  | "startTrashCardsFromGripForCreditsChoice"
  | "shuffleGripTrashAndStackThenDraw";

export type HiddenZoneCardImplementationRuntimeDeps = Pick<
  CardImplementationRuntimeDependencies,
  HiddenZoneRuntimeDepsKey
>;

type RuntimeState = Parameters<
  HiddenZoneCardImplementationRuntimeDeps["topTrashToGripTargetCount"]
>[0];
type RuntimeLegalAction = Parameters<
  HiddenZoneCardImplementationRuntimeDeps["startSearchTrashToGripChoice"]
>[1];

export type HiddenZoneRuntimeDepsHost = {
  cards: {
    runnerInstalledCardIds: (state: RuntimeState) => CardInstanceId[];
    topRunnerHeapCardId: (state: RuntimeState) => CardInstanceId | undefined;
  };
  hiddenZone: {
    searchActivationTargetHost: (
      state: RuntimeState,
    ) => HiddenZoneSearchActivationBaseHost;
    searchActivationHandlerHost: (
      state: RuntimeState,
      legalAction: RuntimeLegalAction,
    ) => HiddenZoneSearchActivationHost;
    arrangeChoiceHandlerHost: (
      state: RuntimeState,
      legalAction: RuntimeLegalAction,
    ) => HiddenZoneArrangeChoiceHandlerHost;
    nonSearchChoiceHandlerHost: (
      state: RuntimeState,
      legalAction: RuntimeLegalAction,
    ) => HiddenZoneNonSearchChoiceHandlerHost;
    corpZoneChoiceHandlerHost: (
      state: RuntimeState,
      legalAction: LegalAction,
    ) => CorpZoneChoiceHandlerHost;
  };
  callbacks: {
    startRunnerPrivateLookChoice: (
      ...args: Parameters<
        HiddenZoneCardImplementationRuntimeDeps["startPrivateLook"]
      >
    ) => boolean;
    exposeInstalledCorpCardTargets: HiddenZoneCardImplementationRuntimeDeps["exposeInstalledCorpCardTargets"];
    exposeInstalledCorpCard: HiddenZoneCardImplementationRuntimeDeps["exposeInstalledCorpCard"];
    startExposeInstalledCorpCardsChoice: HiddenZoneCardImplementationRuntimeDeps["startExposeInstalledCorpCardsChoice"];
    exposeOutermostIceOfEachDataFort: HiddenZoneCardImplementationRuntimeDeps["exposeOutermostIceEachDataFort"];
    outermostIceExposures: (state: RuntimeState) => readonly unknown[];
    shuffleGripTrashAndStackThenDrawForCardImplementation: HiddenZoneCardImplementationRuntimeDeps["shuffleGripTrashAndStackThenDraw"];
  };
};
