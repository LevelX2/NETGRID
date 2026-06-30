import type {
  CardDefinition,
  CardInstanceId,
  CounterType,
  GameState,
  LegalAction,
  ServerId,
  Side,
} from "@netgrid/shared";
import type { CardImplementationAbilityLimitHost } from "./card-implementation-ability-limits";
import type {
  CardEffectAdvancementChoiceResult,
  CardEffectAvoidTagResult,
  CardEffectCounterResult,
  CardEffectHiddenInfoResult,
  CardEffectHostedCreditsResult,
  CardEffectRemoveTagsResult,
  CardEffectReturnSourceResult,
  CardEffectTrashSourceResult,
} from "./effect-execution-types";

export type CardImplementationRuntimeExtendedDependencies = {
  rezzedIceTargetCount: (state: GameState) => number;
  unrezzedIceTargetCount: (state: GameState) => number;
  installedIceTargetCount: (state: GameState) => number;
  rezzedBlackIceTargetCount: (state: GameState) => number;
  corpHqCardCount: (state: GameState) => number;
  runnerValuPakInstallableProgramCount: (state: GameState) => number;
  startPayRezCostToTrashRezzedIceChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
  ) => CardEffectHiddenInfoResult;
  startTrashUnrezzedIceChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
  ) => CardEffectHiddenInfoResult;
  startCorpChoiceRezOrTrashIceChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
  ) => CardEffectHiddenInfoResult;
  startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
  ) => CardEffectHiddenInfoResult;
  startDerezRezzedBlackIceChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
  ) => CardEffectHiddenInfoResult;
  startCorpDiscardHqWithRetainPayment: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    retainCostPerCard: number,
  ) => CardEffectHiddenInfoResult;
  startRunnerProgramInstallActionBundle: (
    state: GameState,
    legalAction: LegalAction,
    actionCount: 5,
    temporaryCredit: 1,
  ) => CardEffectHiddenInfoResult;
  addCounterToAllInstalledRunnerIcebreakers: (
    state: GameState,
    counterType: CounterType,
    amount: number,
  ) => CardEffectCounterResult;
  shuffleSourceIntoCorpRd: (
    state: GameState,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
  ) => CardEffectHiddenInfoResult;
  trashCorpInstalledCardsInSourceServer: (
    state: GameState,
    legalAction: LegalAction | undefined,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
  ) => CardEffectHiddenInfoResult;
  gainRunnerEventAgendaPoint: (
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinition["id"],
    amount: 1,
  ) => CardEffectHiddenInfoResult;
  scoreSourceAsAgenda: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
  ) => CardEffectHiddenInfoResult;
  corpRandomDiscardFromHq: (
    state: GameState,
    sourceDefinitionId: CardDefinition["id"],
    count: number,
  ) => CardEffectHiddenInfoResult;
  addHostedCredits: (
    state: GameState,
    sourceCardId: CardInstanceId,
    amount: number,
  ) => CardEffectHostedCreditsResult;
  addCountersToSource: (
    state: GameState,
    sourceCardId: CardInstanceId,
    counterType: Extract<CounterType, "ablative" | "trauma" | "boon">,
    amount: number,
  ) => CardEffectCounterResult;
  removeRunnerTags: (
    state: GameState,
    mode: "amount" | "up_to_amount" | "all",
    amount?: number,
  ) => CardEffectRemoveTagsResult;
  avoidNextTag: (state: GameState, amount: 1) => CardEffectAvoidTagResult;
  returnSourceToGripIfPaid: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    amount: number,
  ) => CardEffectReturnSourceResult;
  takeHostedCredits: (
    state: GameState,
    sourceCardId: CardInstanceId,
    side: Side,
    amount: number | "all",
  ) => CardEffectHostedCreditsResult;
  trashSourceWhenEmpty: (
    state: GameState,
    sourceCardId: CardInstanceId,
  ) => CardEffectTrashSourceResult;
  trashSource: (
    state: GameState,
    sourceCardId: CardInstanceId,
    legalAction?: LegalAction,
  ) => CardEffectTrashSourceResult;
  revealHiddenRunnerResource: (
    state: GameState,
    sourceCardId: CardInstanceId,
  ) => Record<string, string | number | boolean>;
  addCurrentRunAccessCount: (
    state: GameState,
    server: Extract<ServerId, "hq" | "rd">,
    amount: number,
  ) => CardEffectHiddenInfoResult;
  passCurrentEncounteredIce: (
    state: GameState,
    legalAction: LegalAction,
    subtypeRequired?: "ap",
  ) => CardEffectHiddenInfoResult;
  rezInstalledIceWithLifecycleCounters: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    input: {
      counterType: Extract<CounterType, "kludge" | "term">;
      amount: number;
      lifecycle:
        | "remove_one_counter_start_corp_turn_trash_on_last"
        | "rent_to_own_start_corp_turn";
    },
  ) => CardEffectHiddenInfoResult;
  replaceFortCardsFromHq: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
  ) => CardEffectHiddenInfoResult;
  trashTopCorpRdCards: (
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinition["id"],
    amount: 2,
  ) => CardEffectHiddenInfoResult;
  startDistributeAdvancementCounters: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    amount: number,
    distribution:
      | "single_target"
      | "any_combination"
      | "up_to_distinct_targets_one_each",
  ) => CardEffectAdvancementChoiceResult;
  startMoveAdvancementCounters: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    source: "chosen_card" | "source_card",
    maxAmount: number | "all",
  ) => CardEffectAdvancementChoiceResult;
  addCurrentEncounterAdditionalSubroutine: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    sourceTitle: string,
    input: {
      subroutineKind: "end_the_run" | "end_the_run_unless_runner_pays";
      amount?: number;
    },
  ) => CardEffectHiddenInfoResult;
  abilityLimits: CardImplementationAbilityLimitHost;
};
