import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import type {
  CardEffectHiddenInfoResult,
  CardEffectPrivateLookResult,
} from "./effect-execution-types";

export type CardImplementationRuntimeHiddenDependencies = {
  startPrivateLook: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    zone: Extract<ServerId, "rd" | "hq">,
    count: number | "all",
  ) => CardEffectPrivateLookResult;
  exposeInstalledCorpCardTargets: (
    state: GameState,
    scope: "inside_data_fort" | "any_installed",
  ) => CardInstanceId[];
  exposeInstalledCorpCard: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    targetCardId: CardInstanceId,
    scope: "inside_data_fort" | "any_installed",
  ) => CardEffectHiddenInfoResult;
  startExposeInstalledCorpCardsChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    min: number,
    max: number,
    scope?: "any_installed" | "inside_data_fort" | "single_data_fort",
  ) => CardEffectHiddenInfoResult;
  exposeOutermostIceEachDataFort: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
  ) => CardEffectHiddenInfoResult;
  outermostIceEachDataFortExposeCount: (state: GameState) => number;
  rezCostForCard: (state: GameState, cardId: CardInstanceId) => number;
  startShowHqAgendasForCreditsChoice: (
    state: GameState,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    creditPerAgenda: number,
  ) => CardEffectHiddenInfoResult;
  searchTrashToGripTargetCount: (
    state: GameState,
    filter: "program" | "any_card",
  ) => number;
  searchStackToGripTargetCount: (
    state: GameState,
    filter: "program" | "any_card",
  ) => number;
  topTrashToGripTargetCount: (state: GameState) => number;
  topTrashToGripTargetId: (state: GameState) => CardInstanceId | undefined;
  searchStackInstallTargetCount: (
    state: GameState,
    filter: "program",
    installCost: "normal" | "free",
  ) => number;
  stackOrTrashProgramInstallTargetCount: (
    state: GameState,
    installCost: "free",
  ) => number;
  lookTopStackShowToCorpThenInstallMatchingTargetCount: (
    state: GameState,
    count: 5,
    allowedTypes: readonly "program"[],
    installCost: "free",
  ) => number;
  lookTopStackTakeMatchingTargetCount: (
    state: GameState,
    count: number,
    allowedTypes: readonly ("program" | "event" | "hardware" | "resource")[],
  ) => number;
  startSearchTrashToGripChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    filter: "program" | "any_card",
  ) => CardEffectHiddenInfoResult;
  startSearchStackToGripChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    filter: "program" | "any_card",
    revealToCorp: boolean,
    shuffleAfterwards: true,
  ) => CardEffectHiddenInfoResult;
  moveTopTrashToGrip: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
  ) => CardEffectHiddenInfoResult;
  startSearchStackInstallChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    filter: "program",
    installCost: "normal" | "free",
    shuffleAfterwards: true,
  ) => CardEffectHiddenInfoResult;
  startStackOrTrashProgramInstallChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    installCost: "free",
    shuffleStackIfSearched: true,
    returnInstalledCardToGripAtEndOfTurn: true,
  ) => CardEffectHiddenInfoResult;
  startLookTopStackShowToCorpThenInstallMatchingChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    count: 5,
    allowedTypes: readonly "program"[],
    installCost: "free",
    trashSourceIfInstalled: true,
    shuffleAfterwards: true,
  ) => CardEffectHiddenInfoResult;
  startLookTopStackTakeMatchingChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    count: number,
    allowedTypes: readonly ("program" | "event" | "hardware" | "resource")[],
    costPerTaken: number,
    revealTakenToCorp: true,
    shuffleRemainder: true,
  ) => CardEffectHiddenInfoResult;
  startLookTopStackTakeOneArrangeRestChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    count: 5,
  ) => CardEffectHiddenInfoResult;
  trashOwnInstalledCardTargetCount: (state: GameState) => number;
  trashGripCardTargetCount: (state: GameState) => number;
  startTrashOwnInstalledCardsForCreditsChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    min: 0 | 1,
    max: "any",
    gainPerTrashed: number,
  ) => CardEffectHiddenInfoResult;
  startTrashCardsFromGripForCreditsChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    max: number,
    gainPerTrashed: number,
  ) => CardEffectHiddenInfoResult;
  shuffleGripTrashAndStackThenDraw: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    drawCount: number,
    removePlayedCardFromGame: true,
  ) => CardEffectHiddenInfoResult;
};
