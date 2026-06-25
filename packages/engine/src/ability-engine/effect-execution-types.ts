import type {
  CardDefinitionId,
  CardInstanceId,
  CounterType,
  DamageType,
  MultiServerSuccessSequenceState,
  ResolvedGameEffect,
  ServerId,
  Side,
} from "@netgrid/shared";
import type { CardTraceSuccessEffectImplementation } from "./definition-types";

export type CardEffectExecutionContext = {
  sourceCardId: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  sourceTitle?: string;
  targetCardId?: CardInstanceId;
  xValue?: number;
  targetRezCost?: number;
  controller: Side;
  reason?: string;
  drawCards?: (side: Side, amount: number) => CardEffectDrawCardsResult;
  damageRunner?: (
    damageType: Extract<DamageType, "meat" | "net" | "core">,
    amount: number,
  ) => CardEffectDamageResult;
  unpreventableDamageRunner?: (
    damageType: Extract<DamageType, "meat" | "net" | "core">,
    amount: number,
  ) => CardEffectDamageResult;
  addHostedCredits?: (
    sourceCardId: CardInstanceId,
    amount: number,
  ) => CardEffectHostedCreditsResult;
  addCountersToSource?: (
    sourceCardId: CardInstanceId,
    counterType: Extract<CounterType, "ablative" | "trauma" | "boon">,
    amount: number,
  ) => CardEffectCounterResult;
  removeRunnerTags?: (
    mode: "amount" | "up_to_amount" | "all",
    amount?: number,
  ) => CardEffectRemoveTagsResult;
  avoidNextTag?: (amount: 1) => CardEffectAvoidTagResult;
  returnSourceToGripIfPaid?: (
    sourceCardId: CardInstanceId,
    amount: number,
  ) => CardEffectReturnSourceResult;
  takeHostedCredits?: (
    sourceCardId: CardInstanceId,
    recipient: Side,
    amount: number | "all",
  ) => CardEffectHostedCreditsResult;
  trashSourceWhenEmpty?: (
    sourceCardId: CardInstanceId,
  ) => CardEffectTrashSourceResult;
  trashSource?: (sourceCardId: CardInstanceId) => CardEffectTrashSourceResult;
  startTrace?: (
    sourceCardId: CardInstanceId,
    baseTraceStrength: number,
    successEffects: readonly CardTraceSuccessEffectImplementation[],
  ) => CardEffectTraceResult;
  startRun?: (
    serverId: Exclude<ServerId, "new_remote">,
    options: CardEffectMakeRunOptions,
  ) => CardEffectMakeRunResult;
  addCounterToAllInstalledRunnerIcebreakers?: (
    counterType: CounterType,
    amount: number,
  ) => CardEffectCounterResult;
  shuffleSourceIntoCorpRd?: (
    sourceCardId: CardInstanceId,
  ) => CardEffectHiddenInfoResult;
  trashCorpInstalledCardsInSourceServer?: (
    sourceCardId: CardInstanceId,
  ) => CardEffectHiddenInfoResult;
  gainRunnerEventAgendaPoint?: (amount: 1) => CardEffectHiddenInfoResult;
  runnerLiberatedAgendaSubtypeThisTurn?: (
    subtype: "research" | "gray_ops" | "black_ops",
  ) => boolean;
  corpRandomDiscardFromHq?: (count: number) => CardEffectHiddenInfoResult;
  startCorpDiscardHqWithRetainPayment?: (
    retainCostPerCard: number,
  ) => CardEffectHiddenInfoResult;
  startDerezRezzedBlackIceChoice?: () => CardEffectHiddenInfoResult;
  startRunnerProgramInstallActionBundle?: (
    actionCount: 5,
    temporaryCredit: 1,
  ) => CardEffectHiddenInfoResult;
  chosenRunServerId?: () => Exclude<ServerId, "new_remote">;
  startPrivateLook?: (
    zone: Extract<ServerId, "rd" | "hq">,
    count: number | "all",
  ) => CardEffectPrivateLookResult;
  exposeInstalledCard?: (
    scope: "inside_data_fort" | "any_installed",
  ) => CardEffectHiddenInfoResult;
  startExposeInstalledCards?: (
    min: number,
    max: number,
    scope?: "any_installed" | "single_data_fort",
  ) => CardEffectHiddenInfoResult;
  exposeOutermostIceEachFort?: () => CardEffectHiddenInfoResult;
  startShowHqAgendasForCredits?: (
    creditPerAgenda: number,
  ) => CardEffectHiddenInfoResult;
  startSearchTrashToGrip?: (
    filter: "program" | "any_card",
  ) => CardEffectHiddenInfoResult;
  startSearchStackToGrip?: (
    filter: "program" | "any_card",
    revealToCorp: boolean,
    shuffleAfterwards: true,
  ) => CardEffectHiddenInfoResult;
  moveTopTrashToGrip?: () => CardEffectHiddenInfoResult;
  startSearchStackInstall?: (
    filter: "program",
    installCost: "normal" | "free",
    shuffleAfterwards: true,
  ) => CardEffectHiddenInfoResult;
  startChooseStackOrTrashProgramInstall?: (
    installCost: "free",
    shuffleStackIfSearched: true,
    returnInstalledCardToGripAtEndOfTurn: true,
  ) => CardEffectHiddenInfoResult;
  startLookTopStackShowToCorpThenInstallMatching?: (
    count: 5,
    allowedTypes: readonly "program"[],
    installCost: "free",
    trashSourceIfInstalled: true,
    shuffleAfterwards: true,
  ) => CardEffectHiddenInfoResult;
  startLookTopStackTakeMatching?: (
    count: number,
    allowedTypes: readonly ("program" | "event" | "hardware" | "resource")[],
    costPerTaken: number,
    revealTakenToCorp: true,
    shuffleRemainder: true,
  ) => CardEffectHiddenInfoResult;
  startLookTopStackTakeOneArrangeRest?: (
    count: 5,
  ) => CardEffectHiddenInfoResult;
  startTrashOwnInstalledCardsForCredits?: (
    min: 0 | 1,
    max: "any",
    gainPerTrashed: number,
  ) => CardEffectHiddenInfoResult;
  startTrashCardsFromGripForCredits?: (
    max: number,
    gainPerTrashed: number,
  ) => CardEffectHiddenInfoResult;
  shuffleGripTrashAndStackThenDraw?: (
    drawCount: number,
    removePlayedCardFromGame: true,
  ) => CardEffectHiddenInfoResult;
  startPayRezCostToTrashRezzedIceChoice?: () => CardEffectHiddenInfoResult;
  startTrashUnrezzedIceChoice?: () => CardEffectHiddenInfoResult;
  startCorpChoiceRezOrTrashIceChoice?: () => CardEffectHiddenInfoResult;
  startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice?: () => CardEffectHiddenInfoResult;
  startDistributeAdvancementCounters?: (
    amount: number,
    distribution:
      | "single_target"
      | "any_combination"
      | "up_to_distinct_targets_one_each",
  ) => CardEffectAdvancementChoiceResult;
  startMoveAdvancementCounters?: (
    source: "chosen_card" | "source_card",
    maxAmount: number | "all",
  ) => CardEffectAdvancementChoiceResult;
  addCurrentEncounterAdditionalSubroutine?: (input: {
    subroutineKind: "end_the_run" | "end_the_run_unless_runner_pays";
    amount?: number;
  }) => CardEffectHiddenInfoResult;
  copySameFortIceSubroutineForRun?: () => CardEffectHiddenInfoResult;
  addCurrentRunAccessCount?: (
    server: Extract<ServerId, "hq" | "rd">,
    amount: number,
  ) => CardEffectHiddenInfoResult;
  passCurrentEncounteredIce?: (
    subtypeRequired?: "ap",
  ) => CardEffectHiddenInfoResult;
  rezInstalledIceWithLifecycleCounters?: (input: {
    counterType: Extract<CounterType, "kludge" | "term">;
    amount: number;
    lifecycle:
      | "remove_one_counter_start_corp_turn_trash_on_last"
      | "rent_to_own_start_corp_turn";
  }) => CardEffectHiddenInfoResult;
  replaceFortCardsFromHq?: () => CardEffectHiddenInfoResult;
};

export type CardEffectExecutionResult = {
  publicPayload: Record<string, string | number | boolean>;
  resolvedEffects: ResolvedGameEffect[];
};

export type CardEffectDrawCardsResult = {
  drawnCount: number;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectDamageResult = {
  resolved: boolean;
  damageType: DamageType;
  amount: number;
  cardsTrashed: number;
  flatline: boolean;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectHostedCreditsResult = {
  amount: number;
  hostedCreditsAfter: number;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectCounterResult = {
  amount: number;
  counterType: Extract<
    CounterType,
    "ablative" | "trauma" | "boon" | "militech" | "breaker_strength_penalty"
  >;
  countersAfter: number;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectRemoveTagsResult = {
  removedTags: number;
  runnerTagsAfter: number;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectAvoidTagResult = {
  amount: number;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectReturnSourceResult = {
  choiceOpened: boolean;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectTrashSourceResult = {
  sourceTrashed: boolean;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectTraceResult = {
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectMakeRunOptions = {
  accessCount?: number;
  freeTrashAccessZones?: readonly Extract<ServerId, "hq" | "rd">[];
  accessServerOverride?: Extract<ServerId, "hq" | "rd" | "archives">;
  successfulRunAccessReplacement?:
    | "corp_lose_credits"
    | "runner_spend_corp_lose_credits"
    | "private_look_top_rd"
    | "archives_faceup_to_rd"
    | "trash_rezzed_ice_on_fort_and_tag_runner"
    | "runner_gain_agenda_point";
  successfulRunCreditLoss?: number;
  successfulRunRunnerTagGain?: number;
  successfulRunRunnerCreditGain?: number;
  successfulRunRequiresCorpCredits?: boolean;
  successfulRunPrivateLookCount?: number;
  successfulRunArchivesMoveCount?: number;
  followupRunOnEnd?: "optional";
  bypassFirstIce?: boolean;
  runTraceLinkBonus?: number;
  runTemporaryCredits?: {
    side: "runner";
    amount: number;
    usableFor: "any_runner_cost_during_this_run";
    returnUnusedAtRunEnd: true;
  };
  afterRunCompletedUnpreventableCoreDamage?: number;
  prohibitNoisyIcebreakers?: boolean;
  eventApproachIceExposeBeforeRez?: boolean;
  runnerCreditGainOnCorpRez?: number;
  damagePreventionPool?: number;
  badPublicityRunAftermath?: "successful_run_draw_event" | "bad_publicity_run_replacement";
  activeSequence?: MultiServerSuccessSequenceState;
};

export type CardEffectMakeRunResult = {
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectPrivateLookResult = {
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectHiddenInfoResult = {
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectAdvancementChoiceResult = {
  publicPayload?: Record<string, string | number | boolean>;
};
