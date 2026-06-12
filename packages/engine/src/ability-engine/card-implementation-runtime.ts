/**
 * Orchestrates generic CardImplementation execution.
 *
 * The runtime turns declarative card abilities and lifecycle hooks into actions
 * or ordered effect execution. It owns CardImplementation revalidation and
 * payload merging, but delegates engine primitives through dependencies so it
 * does not import index.ts or contain card-specific branches.
 */
import type {
  ActionType,
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CounterType,
  DamageType,
  GameState,
  LegalAction,
  ResolvedGameEffect,
  ServerId,
  Side,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import { printedSubroutinesForCardImplementation } from "./printed-subroutine-implementations";
import {
  executeCardImplementationEffects,
  type CardEffectDamageResult,
  type CardEffectDrawCardsResult,
  type CardEffectHostedCreditsResult,
  type CardEffectCounterResult,
  type CardEffectAvoidTagResult,
  type CardEffectHiddenInfoResult,
  type CardEffectMakeRunOptions,
  type CardEffectMakeRunResult,
  type CardEffectPrivateLookResult,
  type CardEffectRemoveTagsResult,
  type CardEffectReturnSourceResult,
  type CardEffectTrashSourceResult,
  type CardEffectAdvancementChoiceResult,
} from "./effect-interpreter";
import {
  canUseCardImplementationAbilityLimit,
  cardImplementationAbilityLimitFailureMessage,
  markCardImplementationAbilityLimitUsed,
  type CardImplementationAbilityLimitHost,
} from "./card-implementation-ability-limits";
import type {
  ActivatedCardAbilityImplementation,
  CardAbilityCostImplementation,
  CardConditionImplementation,
  CardEffectImplementation,
  CardTraceSuccessEffectImplementation,
  CardLifecycleImplementation,
  CardLifecycleTriggeredAbilityImplementation,
  OnPlayCardAbilityImplementation,
} from "./definition-types";

type ImmediateLifecycle = Exclude<
  keyof CardLifecycleImplementation,
  | "start_of_corp_turn"
  | "start_of_runner_turn"
  | "end_of_runner_turn"
  | "on_runner_run_start"
>;

type RuntimeEffectCollector = ResolvedGameEffect[];

export type CardImplementationRuntimeDependencies = {
  // Host-owned primitives keep movement, payment, draw, damage, and trash
  // semantics centralized in the engine while this runtime stays card-generic.
  definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
  mustInstance: (
    source: Record<CardInstanceId, CardInstance>,
    cardId: CardInstanceId,
  ) => CardInstance;
  cardCounter: (
    state: GameState,
    cardId: CardInstanceId,
    counterType: CounterType,
  ) => number;
  rezzedCorpRootCardIds: (state: GameState) => CardInstanceId[];
  runnerInstalledCardIds: (state: GameState) => CardInstanceId[];
  runnerRunAttemptsLastTurn: (state: GameState) => number;
  runnerRunAttemptsThisGame: (state: GameState) => number;
  runnerTrashedNodeLastTurn: (state: GameState) => boolean;
  runnerTrashedAdvertisementThisTurn: (state: GameState) => boolean;
  runnerTrashedTransactionsThisTurn: (state: GameState) => boolean;
  runnerInstalledResourceLastTurn: (state: GameState) => boolean;
  runnerWasDamagedDuringLastThreeActions: (state: GameState) => boolean;
  runnerMadeSuccessfulRunOnServerThisTurn: (
    state: GameState,
    server: Extract<ServerId, "hq" | "rd"> | "any_data_fort",
  ) => boolean;
  runnerLiberatedAgendaSubtypeThisTurn: (
    state: GameState,
    subtype: "research" | "gray_ops" | "black_ops",
  ) => boolean;
  corpScoredAgendaSubtypeLastTurn: (
    state: GameState,
    subtype: "black_ops",
  ) => boolean;
  spendClick: (state: GameState, side: Side) => void;
  spendCredits: (state: GameState, side: Side, amount: number) => void;
  createAction: (
    state: GameState,
    side: Side,
    type: ActionType,
    label: string,
    source: LegalAction["source"],
    costs?: LegalAction["costs"],
    payload?: LegalAction["payload"],
  ) => LegalAction;
  appendResolvedEffectsToPayload: (
    legalAction: LegalAction | undefined,
    effects: RuntimeEffectCollector,
  ) => void;
  drawCards: (
    state: GameState,
    side: Side,
    amount: number,
  ) => CardEffectDrawCardsResult;
  damageRunner: (
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinition["id"],
    damageType: Extract<DamageType, "meat" | "net" | "core">,
    amount: number,
  ) => CardEffectDamageResult;
  unpreventableDamageRunner: (
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinition["id"],
    damageType: Extract<DamageType, "meat" | "net" | "core">,
    amount: number,
  ) => CardEffectDamageResult;
  startTrace: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    baseTraceStrength: number,
    successEffects: readonly CardTraceSuccessEffectImplementation[],
  ) => Record<string, string | number | boolean>;
  startRun: (
    state: GameState,
    legalAction: LegalAction,
    serverId: Exclude<ServerId, "new_remote">,
    options: CardEffectMakeRunOptions,
  ) => CardEffectMakeRunResult;
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

function printedCostOnPlayImplementation(
  definition: CardDefinition,
): OnPlayCardAbilityImplementation | undefined {
  return cardImplementationForDefinitionId(definition.id)?.abilities?.find(
    (ability): ability is OnPlayCardAbilityImplementation =>
      ability.kind === "on_play" && ability.costs === "printed",
  );
}

/**
 * Evaluates the small declarative condition vocabulary used by migrated cards.
 *
 * Conditions are checked during LegalAction generation and revalidation;
 * unsupported condition kinds fail closed instead of silently becoming legal.
 */
function cardImplementationConditionMet(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  condition: CardConditionImplementation,
  sourceCardId?: CardInstanceId,
): boolean {
  switch (condition.kind) {
    case "runner_is_tagged":
      return state.runner.tags > 0;
    case "source_has_hosted_credits":
      return Boolean(
        sourceCardId &&
          state.cardInstances[sourceCardId] &&
          deps.cardCounter(state, sourceCardId, "bit") > 0,
      );
    case "source_has_advancement_counters":
      return Boolean(
        sourceCardId &&
          state.cardInstances[sourceCardId] &&
          Math.floor(state.cardInstances[sourceCardId].advancementCounters) >=
            condition.minimum,
      );
    case "runner_attempted_run_last_turn":
      return (
        deps.runnerRunAttemptsLastTurn(state) >=
        Math.max(0, condition.minimumRuns)
      );
    case "runner_attempted_run_this_game":
      return (
        deps.runnerRunAttemptsThisGame(state) >=
        Math.max(0, condition.minimumRuns)
      );
    case "runner_trashed_node_last_turn":
      return deps.runnerTrashedNodeLastTurn(state);
    case "runner_trashed_advertisement_this_turn":
      return deps.runnerTrashedAdvertisementThisTurn(state);
    case "runner_trashed_transactions_this_turn":
      return deps.runnerTrashedTransactionsThisTurn(state);
    case "runner_installed_resource_last_turn":
      return deps.runnerInstalledResourceLastTurn(state);
    case "runner_damaged_during_last_three_actions":
      return deps.runnerWasDamagedDuringLastThreeActions(state);
    case "runner_liberated_agenda_subtype_this_turn":
      return deps.runnerLiberatedAgendaSubtypeThisTurn(
        state,
        condition.subtype,
      );
    case "corp_scored_agenda_subtype_last_turn":
      return deps.corpScoredAgendaSubtypeLastTurn(state, condition.subtype);
    case "runner_made_successful_run_on_server_this_turn":
      return deps.runnerMadeSuccessfulRunOnServerThisTurn(
        state,
        condition.server,
      );
    case "runner_made_successful_hq_and_rd_runs_this_turn":
      return (
        deps.runnerMadeSuccessfulRunOnServerThisTurn(state, "hq") &&
        deps.runnerMadeSuccessfulRunOnServerThisTurn(state, "rd")
      );
    case "corp_rezzed_black_ice_this_turn": {
      const target = state.runnerTurnFlags?.lastRezzedBlackIceThisTurn;
      const instance = target ? state.cardInstances[target.cardId] : undefined;
      if (
        !target ||
        !instance ||
        instance.zone.side !== "corp" ||
        instance.zone.zone !== "serverIce" ||
        instance.zone.serverId !== target.serverId ||
        instance.rezzed !== true
      )
        return false;
      const definition = deps.definitionFor(state, target.cardId);
      return (
        definition.id === target.definitionId &&
        definition.type === "ice" &&
        hasNormalizedSubtype(definition.subtypes, "black_ice")
      );
    }
    case "current_encounter_ice":
      return (
        state.timingPoint === "run.encounter_ice" &&
        state.run?.phase === "encounter_ice" &&
        Boolean(state.run.encounteredIceId)
      );
    case "current_encounter_ice_subtype": {
      if (
        state.timingPoint !== "run.encounter_ice" ||
        state.run?.phase !== "encounter_ice" ||
        !state.run.encounteredIceId
      )
        return false;
      return deps
        .definitionFor(state, state.run.encounteredIceId)
        .subtypes.includes(condition.subtype);
    }
    case "current_run_server":
      return (
        (state.run?.accessServerOverride ?? state.run?.attackedServerId) ===
        condition.server
      );
    default: {
      const unknownCondition = condition as { kind?: string };
      throw new Error(
        `Unsupported card implementation condition: ${
          unknownCondition.kind ?? "unknown"
        }`,
      );
    }
  }
}

function canResolveOnPlayCardImplementationAbility(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  ability: OnPlayCardAbilityImplementation,
): boolean {
  if (
    ability.condition &&
    !cardImplementationConditionMet(deps, state, ability.condition)
  )
    return false;
  return ability.effects.every((effect) => {
    if (effect.kind === "expose_installed_cards")
      return deps.exposeInstalledCorpCardTargets(state, "any_installed").length > 0;
    if (effect.kind === "expose_outermost_ice_each_fort")
      return deps.outermostIceEachDataFortExposeCount(state) > 0;
    if (effect.kind === "search_trash_to_grip")
      return deps.searchTrashToGripTargetCount(state, effect.filter) > 0;
    if (effect.kind === "search_stack_to_grip")
      return deps.searchStackToGripTargetCount(state, effect.filter) > 0;
    if (effect.kind === "move_top_trash_to_grip")
      return deps.topTrashToGripTargetCount(state) > 0;
    if (effect.kind === "search_stack_install")
      return (
        deps.searchStackInstallTargetCount(
          state,
          effect.filter,
          effect.installCost,
        ) > 0
      );
    if (effect.kind === "choose_stack_or_trash_program_install")
      return (
        deps.stackOrTrashProgramInstallTargetCount(
          state,
          effect.installCost,
        ) > 0
      );
    if (effect.kind === "look_top_stack_show_to_corp_then_install_matching")
      return state.runner.stack.length > 0;
    if (effect.kind === "look_top_stack_take_matching")
      return (
        state.runner.credits >= 0 &&
        state.runner.stack.length > 0 &&
        deps.lookTopStackTakeMatchingTargetCount(
          state,
          effect.count,
          effect.allowedTypes,
        ) >= 0
      );
    if (effect.kind === "look_top_stack_take_one_arrange_rest")
      return state.runner.stack.length > 0;
    if (effect.kind === "trash_own_installed_cards_for_credits")
      return deps.trashOwnInstalledCardTargetCount(state) >= effect.min;
    if (effect.kind === "trash_cards_from_grip_for_credits")
      return effect.max >= 0;
    if (effect.kind === "pay_rez_cost_to_trash_rezzed_ice")
      return deps.rezzedIceTargetCount(state) > 0;
    if (effect.kind === "trash_unrezzed_ice")
      return deps.unrezzedIceTargetCount(state) > 0;
    if (effect.kind === "corp_choice_rez_or_trash_ice")
      return deps.unrezzedIceTargetCount(state) > 0;
    if (effect.kind === "derez_rezzed_black_ice")
      return deps.rezzedBlackIceTargetCount(state) > 0;
    if (effect.kind === "start_runner_program_install_action_bundle")
      return deps.runnerValuPakInstallableProgramCount(state) > 0;
    return true;
  });
}

function canResolveActivatedCardImplementationAbility(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  ability: ActivatedCardAbilityImplementation,
  sourceCardId?: CardInstanceId,
): boolean {
  if (
    ability.condition &&
    !cardImplementationConditionMet(deps, state, ability.condition, sourceCardId)
  )
    return false;
  if (
    !canUseCardImplementationAbilityLimit(
      deps.abilityLimits,
      state,
      sourceCardId,
      ability.limit,
    )
  )
    return false;
  return ability.effects.every((effect) => {
    if (effect.kind === "search_trash_to_grip")
      return deps.searchTrashToGripTargetCount(state, effect.filter) > 0;
    if (effect.kind === "search_stack_to_grip")
      return deps.searchStackToGripTargetCount(state, effect.filter) > 0;
    if (effect.kind === "move_top_trash_to_grip")
      return deps.topTrashToGripTargetCount(state) > 0;
    if (effect.kind === "search_stack_install")
      return (
        deps.searchStackInstallTargetCount(
          state,
          effect.filter,
          effect.installCost,
        ) > 0
      );
    if (effect.kind === "choose_stack_or_trash_program_install")
      return (
        deps.stackOrTrashProgramInstallTargetCount(
          state,
          effect.installCost,
        ) > 0
      );
    if (effect.kind === "look_top_stack_show_to_corp_then_install_matching")
      return state.runner.stack.length > 0;
    if (effect.kind === "look_top_stack_take_matching")
      return state.runner.stack.length > 0;
    if (effect.kind === "look_top_stack_take_one_arrange_rest")
      return state.runner.stack.length > 0;
    if (effect.kind === "trash_own_installed_cards_for_credits")
      return deps.trashOwnInstalledCardTargetCount(state) >= effect.min;
    if (effect.kind === "trash_cards_from_grip_for_credits")
      return effect.max >= 0;
    if (effect.kind === "trash_own_rezzed_ice_for_credits")
      return ownRezzedIceTargetIds(state).length > 0;
    if (effect.kind === "gain_temporary_trace_credits")
      return Boolean(state.trace);
    if (effect.kind === "remove_same_fort_advancement_counters_for_run_credits")
      return Boolean(state.run);
    if (effect.kind === "gain_temporary_corp_run_credits")
      return Boolean(state.run);
    if (effect.kind === "copy_same_fort_ice_subroutine_for_run")
      return sameFortSubroutineTargets(deps, state, sourceCardId).length > 0;
    if (effect.kind === "gain_credits_for_runner_trash_history")
      return (
        state.runnerTurnFlags?.trashedAdvertisementThisTurn === true ||
        state.runnerTurnFlags?.trashedTransactionsThisTurn === true
      );
    return true;
  });
}

export function canPlayPrintedCostOnPlayImplementation(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  definition: CardDefinition,
): boolean {
  const ability = printedCostOnPlayImplementation(definition);
  return ability
    ? canResolveOnPlayCardImplementationAbility(deps, state, ability)
    : false;
}

function assertOnPlayCardImplementationAbilityCanResolve(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  ability: OnPlayCardAbilityImplementation,
): void {
  if (canResolveOnPlayCardImplementationAbility(deps, state, ability)) return;
  if (ability.condition?.kind === "runner_is_tagged")
    throw new Error("Der Runner muss getaggt sein.");
  if (ability.condition?.kind === "runner_attempted_run_last_turn")
    throw new Error("Der Runner hat im letzten Zug nicht genug Runs versucht.");
  if (ability.condition?.kind === "runner_attempted_run_this_game")
    throw new Error("Der Runner hat in diesem Spiel nicht genug Runs versucht.");
  if (ability.condition?.kind === "runner_trashed_node_last_turn")
    throw new Error("Der Runner hat im letzten Zug keine Node getrasht.");
  if (ability.condition?.kind === "runner_trashed_advertisement_this_turn")
    throw new Error("Der Runner hat in diesem Zug keine Advertisement-Karte getrasht.");
  if (ability.condition?.kind === "runner_trashed_transactions_this_turn")
    throw new Error("Der Runner hat in diesem Zug keine Transactions-Karte getrasht.");
  if (ability.condition?.kind === "runner_installed_resource_last_turn")
    throw new Error("Der Runner hat im letzten Zug keine Resource installiert.");
  if (ability.condition?.kind === "runner_damaged_during_last_three_actions")
    throw new Error("Der Runner wurde in den letzten drei Aktionen nicht verletzt.");
  if (ability.condition?.kind === "runner_made_successful_run_on_server_this_turn")
    throw new Error(
      "Der Runner hat in diesem Zug keinen passenden erfolgreichen Run gemacht.",
    );
  if (ability.condition?.kind === "runner_made_successful_hq_and_rd_runs_this_turn")
    throw new Error(
      "Der Runner hat in diesem Zug nicht erfolgreich HQ und R&D angegriffen.",
    );
  if (ability.condition?.kind === "corp_rezzed_black_ice_this_turn")
    throw new Error("Die Korp hat in diesem Zug kein Black ICE gerezzt.");
  if (ability.condition?.kind === "runner_liberated_agenda_subtype_this_turn")
    throw new Error(
      "Der Runner hat in diesem Zug keine passende Agenda befreit.",
    );
  if (ability.condition?.kind === "corp_scored_agenda_subtype_last_turn")
    throw new Error(
      "Die Korp hat im letzten Zug keine passende Agenda gescored.",
    );
  throw new Error("Die On-Play-Kartenbedingung ist nicht erfuellt.");
}

function assertActivatedCardImplementationAbilityCanResolve(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  ability: ActivatedCardAbilityImplementation,
  sourceCardId?: CardInstanceId,
): void {
  if (
    canResolveActivatedCardImplementationAbility(
      deps,
      state,
      ability,
      sourceCardId,
    )
  )
    return;
  if (ability.condition?.kind === "runner_is_tagged")
    throw new Error("Der Runner muss getaggt sein.");
  if (ability.condition?.kind === "source_has_hosted_credits")
    throw new Error("Auf der Quelle muessen Credits liegen.");
  if (ability.condition?.kind === "source_has_advancement_counters")
    throw new Error("Auf der Quelle muessen Advancement-Counter liegen.");
  if (ability.condition?.kind === "runner_attempted_run_last_turn")
    throw new Error("Der Runner hat im letzten Zug nicht genug Runs versucht.");
  if (ability.condition?.kind === "runner_attempted_run_this_game")
    throw new Error("Der Runner hat in diesem Spiel nicht genug Runs versucht.");
  if (ability.condition?.kind === "runner_trashed_node_last_turn")
    throw new Error("Der Runner hat im letzten Zug keine Node getrasht.");
  if (ability.condition?.kind === "runner_trashed_advertisement_this_turn")
    throw new Error("Der Runner hat in diesem Zug keine Advertisement-Karte getrasht.");
  if (ability.condition?.kind === "runner_trashed_transactions_this_turn")
    throw new Error("Der Runner hat in diesem Zug keine Transactions-Karte getrasht.");
  if (ability.condition?.kind === "runner_installed_resource_last_turn")
    throw new Error("Der Runner hat im letzten Zug keine Resource installiert.");
  if (ability.condition?.kind === "runner_damaged_during_last_three_actions")
    throw new Error("Der Runner wurde in den letzten drei Aktionen nicht verletzt.");
  const limitFailureMessage = cardImplementationAbilityLimitFailureMessage(
    ability.limit,
  );
  if (limitFailureMessage) throw new Error(limitFailureMessage);
  throw new Error("Die aktivierte Kartenbedingung ist nicht erfuellt.");
}

function cardImplementationLifecycleEffects(
  definition: CardDefinition,
  lifecycle: ImmediateLifecycle,
): readonly CardEffectImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.lifecycle?.[lifecycle] ??
    []
  );
}

function lifecycleReason(lifecycle: ImmediateLifecycle): string | undefined {
  return lifecycle === "on_leave_play" ? "source_left_play" : undefined;
}

/**
 * Dispatches immediate lifecycle effects such as on_rez, on_install, and
 * on_score for one source card.
 *
 * These hooks are intentionally narrow lifecycle entry points, not a general
 * trigger registry. Callers choose the timing and source; this helper only
 * executes the declared effects for the current source.
 */
export function executeCardImplementationLifecycleEffects(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction | undefined,
  definition: CardDefinition,
  cardId: CardInstanceId,
  lifecycle: ImmediateLifecycle,
): void {
  const effects = cardImplementationLifecycleEffects(definition, lifecycle);
  if (effects.length === 0) return;
  const reason = lifecycleReason(lifecycle);
  const result = executeCardImplementationEffects(
    state,
    {
      sourceCardId: cardId,
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
      ...(typeof legalAction?.payload?.targetCardId === "string"
        ? { targetCardId: legalAction.payload.targetCardId as CardInstanceId }
        : {}),
      xValue: Math.floor(Number(legalAction?.payload?.xValue ?? 0)),
      targetRezCost: Math.floor(Number(legalAction?.payload?.targetRezCost ?? 0)),
      controller: deps.mustInstance(state.cardInstances, cardId).controller,
      addHostedCredits: (sourceCardId, amount) =>
        deps.addHostedCredits(state, sourceCardId, amount),
      addCountersToSource: (sourceCardId, counterType, amount) =>
        deps.addCountersToSource(state, sourceCardId, counterType, amount),
      takeHostedCredits: (sourceCardId, side, amount) =>
        deps.takeHostedCredits(state, sourceCardId, side, amount),
      trashSourceWhenEmpty: (sourceCardId) =>
        deps.trashSourceWhenEmpty(state, sourceCardId),
      trashSource: (sourceCardId) =>
        deps.trashSource(state, sourceCardId, legalAction),
      shuffleSourceIntoCorpRd: (sourceCardId) =>
        deps.shuffleSourceIntoCorpRd(state, sourceCardId, definition.id),
      trashCorpInstalledCardsInSourceServer: (sourceCardId) =>
        deps.trashCorpInstalledCardsInSourceServer(
          state,
          legalAction,
          sourceCardId,
          definition.id,
        ),
      replaceFortCardsFromHq: () => {
        if (!legalAction)
          throw new Error("Source-fort replacement braucht eine LegalAction.");
        return deps.replaceFortCardsFromHq(
          state,
          legalAction,
          cardId,
          definition.id,
        );
      },
      ...(reason ? { reason } : {}),
    },
    effects,
  );
  if (!legalAction) return;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: definition.id,
    ...result.publicPayload,
  };
  deps.appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
}

function normalizeSubtypeLabel(subtype: string): string {
  return subtype
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function hasNormalizedSubtype(
  subtypes: readonly string[] | undefined,
  subtype: string,
): boolean {
  const target = normalizeSubtypeLabel(subtype);
  return subtypes?.some((candidate) => normalizeSubtypeLabel(candidate) === target) ??
    false;
}

function cardImplementationStartOfCorpTurnAbilities(
  definition: CardDefinition,
): readonly CardLifecycleTriggeredAbilityImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.lifecycle
      ?.start_of_corp_turn ?? []
  );
}

function cardImplementationStartOfRunnerTurnAbilities(
  definition: CardDefinition,
): readonly CardLifecycleTriggeredAbilityImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.lifecycle
      ?.start_of_runner_turn ?? []
  );
}

function cardImplementationRunnerRunStartAbilities(
  definition: CardDefinition,
): readonly CardLifecycleTriggeredAbilityImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.lifecycle
      ?.on_runner_run_start ?? []
  );
}

function cardImplementationEndOfRunnerTurnAbilities(
  definition: CardDefinition,
): readonly CardLifecycleTriggeredAbilityImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.lifecycle
      ?.end_of_runner_turn ?? []
  );
}

function cardImplementationStartOfCorpTurnSourceIds(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
): CardInstanceId[] {
  return [...deps.rezzedCorpRootCardIds(state), ...state.corp.scoreArea].sort();
}

function cardImplementationRunnerInstalledSourceIds(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
): CardInstanceId[] {
  return deps.runnerInstalledCardIds(state).slice().sort();
}

function isActiveCardImplementationStartOfCorpTurnSource(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  cardId: CardInstanceId,
  definition: CardDefinition,
): boolean {
  const instance = state.cardInstances[cardId];
  if (!instance || instance.controller !== "corp") return false;
  if (
    definition.type === "agenda" &&
    instance.zone.side === "corp" &&
    instance.zone.zone === "scoreArea" &&
    state.corp.scoreArea.includes(cardId)
  )
    return true;
  if (definition.type === "agenda") return false;
  return (
    instance.zone.side === "corp" &&
    instance.zone.zone === "serverRoot" &&
    instance.rezzed === true &&
    state.corp.servers.some((server) => server.root.includes(cardId))
  );
}

function isActiveCardImplementationStartOfRunnerTurnSource(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  const instance = state.cardInstances[cardId];
  return (
    instance?.controller === "runner" &&
    instance.zone.side === "runner" &&
    instance.zone.zone === "rig" &&
    deps.runnerInstalledCardIds(state).includes(cardId)
  );
}

/**
 * Runs deterministic start-of-Corp-turn lifecycle effects for active Corp
 * sources only. The caller owns turn transition ordering; this helper just
 * queries eligible CardImplementation sources and executes their effects.
 */
export function executeCardImplementationStartOfCorpTurnEffects(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  effects?: RuntimeEffectCollector,
): void {
  const sourceIds = cardImplementationStartOfCorpTurnSourceIds(deps, state);
  for (const cardId of sourceIds) {
    const instance = state.cardInstances[cardId];
    if (!instance) continue;
    const definition = deps.definitionFor(state, cardId);
    const startAbilities = cardImplementationStartOfCorpTurnAbilities(definition);
    if (startAbilities.length === 0) continue;
    if (
      !isActiveCardImplementationStartOfCorpTurnSource(
        deps,
        state,
        cardId,
        definition,
      )
    )
      continue;
    for (const ability of startAbilities) {
      if (
        ability.condition &&
        !cardImplementationConditionMet(deps, state, ability.condition, cardId)
      )
        continue;
      const result = executeCardImplementationEffects(
        state,
        {
          sourceCardId: cardId,
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
          controller: instance.controller,
          reason: "start_of_turn",
          drawCards: (side, amount) => deps.drawCards(state, side, amount),
          addHostedCredits: (sourceCardId, amount) =>
            deps.addHostedCredits(state, sourceCardId, amount),
          takeHostedCredits: (sourceCardId, side, amount) =>
            deps.takeHostedCredits(state, sourceCardId, side, amount),
          trashSourceWhenEmpty: (sourceCardId) =>
            deps.trashSourceWhenEmpty(state, sourceCardId),
          trashSource: (sourceCardId) => deps.trashSource(state, sourceCardId),
          startShowHqAgendasForCredits: (creditPerAgenda) =>
            deps.startShowHqAgendasForCreditsChoice(
              state,
              cardId,
              definition.id,
              creditPerAgenda,
            ),
        },
        ability.effects,
      );
      effects?.push(...result.resolvedEffects);
      if (
        !isActiveCardImplementationStartOfCorpTurnSource(
          deps,
          state,
          cardId,
          definition,
        )
      )
        break;
    }
  }
}

/**
 * Runs deterministic start-of-Runner-turn lifecycle effects for installed
 * Runner sources only. This is intentionally narrower than a general trigger
 * system and has no optional trigger or priority handling.
 */
export function executeCardImplementationStartOfRunnerTurnEffects(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  effects?: RuntimeEffectCollector,
): void {
  const sourceIds = cardImplementationRunnerInstalledSourceIds(deps, state);
  for (const cardId of sourceIds) {
    const instance = state.cardInstances[cardId];
    if (!instance) continue;
    const definition = deps.definitionFor(state, cardId);
    const startAbilities =
      cardImplementationStartOfRunnerTurnAbilities(definition);
    if (startAbilities.length === 0) continue;
    if (
      !isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId)
    )
      continue;
    for (const ability of startAbilities) {
      if (
        ability.condition &&
        !cardImplementationConditionMet(deps, state, ability.condition, cardId)
      )
        continue;
      const result = executeCardImplementationEffects(
        state,
        {
          sourceCardId: cardId,
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
          controller: instance.controller,
          reason: "start_of_turn",
          addHostedCredits: (sourceCardId, amount) =>
            deps.addHostedCredits(state, sourceCardId, amount),
          takeHostedCredits: (sourceCardId, side, amount) =>
            deps.takeHostedCredits(state, sourceCardId, side, amount),
          trashSourceWhenEmpty: (sourceCardId) =>
            deps.trashSourceWhenEmpty(state, sourceCardId),
          trashSource: (sourceCardId) => deps.trashSource(state, sourceCardId),
        },
        ability.effects,
      );
      effects?.push(...result.resolvedEffects);
      if (!isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId))
        break;
    }
  }
}

/**
 * Runs the narrow runner-run-start lifecycle path for installed Runner sources.
 *
 * It exists for source-scoped cleanup effects and must not grow into a general
 * run/access replacement engine.
 */
export function executeCardImplementationRunnerRunStartEffects(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction?: LegalAction,
): void {
  const sourceIds = cardImplementationRunnerInstalledSourceIds(deps, state);
  for (const cardId of sourceIds) {
    const instance = state.cardInstances[cardId];
    if (!instance) continue;
    const definition = deps.definitionFor(state, cardId);
    const runStartAbilities = cardImplementationRunnerRunStartAbilities(definition);
    if (runStartAbilities.length === 0) continue;
    if (
      !isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId)
    )
      continue;
    for (const ability of runStartAbilities) {
      if (
        ability.condition &&
        !cardImplementationConditionMet(deps, state, ability.condition, cardId)
      )
        continue;
      const result = executeCardImplementationEffects(
        state,
        {
          sourceCardId: cardId,
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
          controller: instance.controller,
          reason: "run_start",
          addHostedCredits: (sourceCardId, amount) =>
            deps.addHostedCredits(state, sourceCardId, amount),
          takeHostedCredits: (sourceCardId, side, amount) =>
            deps.takeHostedCredits(state, sourceCardId, side, amount),
          trashSourceWhenEmpty: (sourceCardId) =>
            deps.trashSourceWhenEmpty(state, sourceCardId),
          trashSource: (sourceCardId) =>
            deps.trashSource(state, sourceCardId, legalAction),
        },
        ability.effects,
      );
      deps.appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
      if (!isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId))
        break;
    }
  }
}

function endOfRunnerTurnPayload(
  cardId: CardInstanceId,
  abilityIndex: number,
): Record<string, string | number | boolean> {
  return {
    cardId,
    cardImplementationLifecycleAction: "end_of_runner_turn",
    cardImplementationLifecycleAbilityIndex: abilityIndex,
  };
}

export function pushCardImplementationEndOfRunnerTurnActions(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  actions: LegalAction[],
): void {
  for (const cardId of cardImplementationRunnerInstalledSourceIds(deps, state)) {
    const instance = state.cardInstances[cardId];
    if (!instance || instance.controller !== "runner") continue;
    const definition = deps.definitionFor(state, cardId);
    const abilities = cardImplementationEndOfRunnerTurnAbilities(definition);
    if (abilities.length === 0) continue;
    if (
      !isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId)
    )
      continue;
    abilities.forEach((ability, index) => {
      if (
        ability.condition &&
        !cardImplementationConditionMet(deps, state, ability.condition, cardId)
      )
        return;
      actions.push(
        deps.createAction(
          state,
          "runner",
          "end_turn",
          `${definition.title} trashen und Zug beenden`,
          cardId,
          [],
          endOfRunnerTurnPayload(cardId, index),
        ),
      );
    });
  }
}

export function resolveCardImplementationEndOfRunnerTurnAction(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
): boolean {
  if (
    legalAction.payload?.cardImplementationLifecycleAction !==
    "end_of_runner_turn"
  )
    return false;
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf diese End-of-turn-Faehigkeit nutzen.");
  if (state.phase !== "runner_action_phase" || state.activeSide !== "runner")
    throw new Error(
      "Diese End-of-turn-Faehigkeit ist nur am Ende des Runner-Zugs nutzbar.",
    );
  const cardId = legalAction.payload.cardId;
  if (typeof cardId !== "string" || !state.cardInstances[cardId])
    throw new Error("Die End-of-turn-Faehigkeit hat keine gueltige Quelle.");
  if (!isActiveCardImplementationStartOfRunnerTurnSource(deps, state, cardId))
    throw new Error("Die End-of-turn-Faehigkeit ist nicht installiert.");
  const definition = deps.definitionFor(state, cardId);
  const abilityIndex = Number(
    legalAction.payload.cardImplementationLifecycleAbilityIndex,
  );
  const ability = cardImplementationEndOfRunnerTurnAbilities(definition)[
    abilityIndex
  ];
  if (!ability || !Number.isInteger(abilityIndex) || abilityIndex < 0)
    throw new Error("Die End-of-turn-Faehigkeit passt nicht zur Karte.");
  if (
    ability.condition &&
    !cardImplementationConditionMet(deps, state, ability.condition, cardId)
  )
    throw new Error("Die End-of-turn-Kartenbedingung ist nicht erfuellt.");
  const result = executeCardImplementationEffects(
    state,
    {
      sourceCardId: cardId,
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
      ...(typeof legalAction.payload?.targetCardId === "string"
        ? { targetCardId: legalAction.payload.targetCardId as CardInstanceId }
        : {}),
      xValue: Math.floor(Number(legalAction.payload?.xValue ?? 0)),
      targetRezCost: Math.floor(Number(legalAction.payload?.targetRezCost ?? 0)),
      controller: deps.mustInstance(state.cardInstances, cardId).controller,
      reason: "end_of_turn",
      addHostedCredits: (sourceCardId, amount) =>
        deps.addHostedCredits(state, sourceCardId, amount),
      addCountersToSource: (sourceCardId, counterType, amount) =>
        deps.addCountersToSource(state, sourceCardId, counterType, amount),
      takeHostedCredits: (sourceCardId, side, amount) =>
        deps.takeHostedCredits(state, sourceCardId, side, amount),
      trashSourceWhenEmpty: (sourceCardId) =>
        deps.trashSourceWhenEmpty(state, sourceCardId),
      trashSource: (sourceCardId) =>
        deps.trashSource(state, sourceCardId, legalAction),
    },
    ability.effects,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: definition.id,
    ...result.publicPayload,
  };
  deps.appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
  return true;
}

function activatedCardImplementationAbilitiesForTiming(
  definition: CardDefinition,
  timing: ActivatedCardAbilityImplementation["timing"],
): Array<{ ability: ActivatedCardAbilityImplementation; index: number }> {
  const implementation = cardImplementationForDefinitionId(definition.id);
  return (
    implementation?.abilities
      ?.map((ability, index) => ({ ability, index }))
      .filter(
        (
          entry,
        ): entry is {
          ability: ActivatedCardAbilityImplementation;
          index: number;
        } => entry.ability.kind === "activated" && entry.ability.timing === timing,
      ) ?? []
  );
}

function assertActivatedCostAmount(
  cost: CardAbilityCostImplementation,
): number {
  if (!Number.isInteger(cost.amount) || cost.amount < 0)
    throw new Error("Activated CardImplementation cost amount must be non-negative.");
  return cost.amount;
}

function activatedAbilityLegalActionCosts(
  ability: ActivatedCardAbilityImplementation,
): LegalAction["costs"] {
  let clicks = 0;
  let credits = 0;
  for (const cost of ability.costs) {
    const amount = assertActivatedCostAmount(cost);
    if (cost.kind === "action") clicks += amount;
    else if (cost.kind === "credit") credits += amount;
    else if (cost.kind === "advancement_counter") {
      if (cost.source !== "source")
        throw new Error(
          "Activated CardImplementation advancement counter cost must use source.",
        );
    } else if (cost.kind === "source_counter") {
      if (cost.source !== "source")
        throw new Error(
          "Activated CardImplementation source counter cost must use source.",
        );
    } else if (cost.kind === "trash_source") {
      if (cost.amount !== 1)
        throw new Error(
          "Activated CardImplementation trash_source cost amount must be 1.",
        );
    } else if (cost.kind === "tap_source") {
      if (cost.amount !== 1)
        throw new Error(
          "Activated CardImplementation tap_source cost amount must be 1.",
        );
    } else if (cost.kind === "corp_random_discard_hq") {
      if (cost.amount <= 0)
        throw new Error(
          "Activated CardImplementation corp_random_discard_hq cost must be positive.",
        );
    } else if (cost.kind === "trash_corp_rd_top") {
      if (cost.amount !== 2)
        throw new Error(
          "Activated CardImplementation trash_corp_rd_top cost amount must be 2.",
        );
    } else {
      const unknownCost = cost as { kind?: string };
      throw new Error(
        `Unsupported activated CardImplementation cost: ${
          unknownCost.kind ?? "unknown"
        }`,
      );
    }
  }
  return clicks > 0 || credits > 0
    ? [{ ...(clicks > 0 ? { clicks } : {}), ...(credits > 0 ? { credits } : {}) }]
    : [];
}

function advancementCounterCostForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): number {
  return ability.costs
    .filter((cost) => cost.kind === "advancement_counter")
    .reduce((sum, cost) => sum + assertActivatedCostAmount(cost), 0);
}

function sourceCounterCostsForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): Array<{ counterType: Extract<CounterType, "boon">; amount: number }> {
  return ability.costs
    .filter((cost) => cost.kind === "source_counter")
    .map((cost) => ({
      counterType: cost.counterType,
      amount: assertActivatedCostAmount(cost),
    }));
}

function hasTrashSourceCostForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): boolean {
  return ability.costs.some((cost) => cost.kind === "trash_source");
}

function hasTapSourceCostForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): boolean {
  return ability.costs.some((cost) => cost.kind === "tap_source");
}

function randomCorpHqDiscardCostForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): number {
  return ability.costs
    .filter((cost) => cost.kind === "corp_random_discard_hq")
    .reduce((sum, cost) => sum + assertActivatedCostAmount(cost), 0);
}

function topCorpRdTrashCostForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): number {
  return ability.costs
    .filter((cost) => cost.kind === "trash_corp_rd_top")
    .reduce((sum, cost) => sum + assertActivatedCostAmount(cost), 0);
}

function validateActivatedAbilityCosts(
  ability: ActivatedCardAbilityImplementation,
  legalAction: LegalAction,
): void {
  const expectedCosts = activatedAbilityLegalActionCosts(ability);
  const expectedFirst = expectedCosts[0] ?? {};
  const actualFirst = legalAction.costs[0] ?? {};
  if (
    legalAction.costs.length !== expectedCosts.length ||
    (actualFirst.clicks ?? 0) !== (expectedFirst.clicks ?? 0) ||
    (actualFirst.credits ?? 0) !== (expectedFirst.credits ?? 0)
  )
    throw new Error("Die aktivierte Kartenfaehigkeit hat andere Kosten.");
}

function canPayActivatedCardImplementationCosts(
  state: GameState,
  side: Side,
  cardId: CardInstanceId,
  ability: ActivatedCardAbilityImplementation,
): boolean {
  const legalCosts = activatedAbilityLegalActionCosts(ability);
  const clicks = legalCosts[0]?.clicks ?? 0;
  const credits = legalCosts[0]?.credits ?? 0;
  if ((side === "corp" ? state.corp.clicks : state.runner.clicks) < clicks)
    return false;
  const corpReservedInstallRezCredits = Math.max(
    0,
    Math.floor(state.corpTemporaryInstallRezCredits?.remaining ?? 0),
  );
  const corpSpendableCredits = Math.max(
    0,
    state.corp.credits - corpReservedInstallRezCredits,
  );
  if ((side === "corp" ? corpSpendableCredits : state.runner.credits) < credits)
    return false;
  const advancementCounterCost = advancementCounterCostForActivatedAbility(ability);
  if (advancementCounterCost > 0) {
    const source = state.cardInstances[cardId];
    if (!source || source.advancementCounters < advancementCounterCost)
      return false;
  }
  for (const cost of sourceCounterCostsForActivatedAbility(ability)) {
    const source = state.cardInstances[cardId];
    const counters = source?.counters?.[cost.counterType] ?? 0;
    if (!source || counters < cost.amount) return false;
  }
  if (hasTrashSourceCostForActivatedAbility(ability)) {
    const source = state.cardInstances[cardId];
    if (
      !source ||
      source.controller !== "runner" ||
      source.zone.side !== "runner" ||
      source.zone.zone !== "rig"
    )
      return false;
  }
  if (hasTapSourceCostForActivatedAbility(ability)) {
    const source = state.cardInstances[cardId];
    if (
      !source ||
      source.controller !== side ||
      source.zone.side !== side ||
      source.tapped === true
    )
      return false;
  }
  const randomDiscardCost = randomCorpHqDiscardCostForActivatedAbility(ability);
  if (randomDiscardCost > 0) {
    if (side !== "corp" || state.corp.hq.length < randomDiscardCost) return false;
  }
  const topCorpRdTrashCost = topCorpRdTrashCostForActivatedAbility(ability);
  if (topCorpRdTrashCost > 0) {
    if (side !== "corp" || state.corp.rd.length < topCorpRdTrashCost)
      return false;
  }
  return true;
}

function payActivatedCardImplementationCosts(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
  side: Side,
  cardId: CardInstanceId,
  ability: ActivatedCardAbilityImplementation,
): Record<string, string | number | boolean> {
  const publicPayload: Record<string, string | number | boolean> = {};
  const legalCosts = activatedAbilityLegalActionCosts(ability);
  const clicks = legalCosts[0]?.clicks ?? 0;
  const creditCost = legalCosts[0]?.credits ?? 0;
  for (let spentClicks = 0; spentClicks < clicks; spentClicks += 1) {
    deps.spendClick(state, side);
  }
  if (creditCost > 0) deps.spendCredits(state, side, creditCost);
  const advancementCounterCost = advancementCounterCostForActivatedAbility(ability);
  if (advancementCounterCost > 0) {
    const source = state.cardInstances[cardId];
    if (!source || source.advancementCounters < advancementCounterCost)
      throw new Error("Die Quelle hat nicht genug Advancement-Counter.");
    source.advancementCounters -= advancementCounterCost;
  }
  for (const cost of sourceCounterCostsForActivatedAbility(ability)) {
    const source = state.cardInstances[cardId];
    const counters = source?.counters?.[cost.counterType] ?? 0;
    if (!source || counters < cost.amount)
      throw new Error("Die Quelle hat nicht genug Source-Counter.");
    source.counters = {
      ...(source.counters ?? {}),
      [cost.counterType]: counters - cost.amount,
    };
  }
  if (hasTrashSourceCostForActivatedAbility(ability)) {
    const trashResult = deps.trashSource(state, cardId);
    if (!trashResult.sourceTrashed)
      throw new Error("Die Quelle konnte nicht getrasht werden.");
    Object.assign(publicPayload, trashResult.publicPayload);
  }
  if (hasTapSourceCostForActivatedAbility(ability)) {
    const source = state.cardInstances[cardId];
    if (!source || source.tapped === true)
      throw new Error("Die Quelle ist bereits getappt.");
    Object.assign(publicPayload, deps.revealHiddenRunnerResource(state, cardId));
    source.faceup = true;
    source.rezzed = true;
    source.tapped = true;
    publicPayload.cardImplementationTapSourceCost = true;
  }
  const randomDiscardCost = randomCorpHqDiscardCostForActivatedAbility(ability);
  if (randomDiscardCost > 0) {
    if (side !== "corp")
      throw new Error("Nur die Korp kann zufaellige HQ-Discard-Kosten zahlen.");
    if (state.corp.hq.length < randomDiscardCost)
      throw new Error("HQ enthaelt nicht genug Karten fuer den Random-Discard.");
    Object.assign(
      publicPayload,
      deps.corpRandomDiscardFromHq(
        state,
        deps.definitionFor(state, cardId).id,
        randomDiscardCost,
      ).publicPayload,
    );
    publicPayload.cardImplementationRandomHqDiscardCost = randomDiscardCost;
  }
  const topCorpRdTrashCost = topCorpRdTrashCostForActivatedAbility(ability);
  if (topCorpRdTrashCost > 0) {
    if (side !== "corp")
      throw new Error("Nur die Korp kann R&D-Trash-Kosten zahlen.");
    if (topCorpRdTrashCost !== 2)
      throw new Error("R&D-Trash-Kosten muessen genau zwei Karten trashen.");
    if (state.corp.rd.length < topCorpRdTrashCost)
      throw new Error("R&D enthaelt nicht genug Karten fuer diese Kosten.");
    Object.assign(
      publicPayload,
      deps.trashTopCorpRdCards(
        state,
        legalAction,
        deps.definitionFor(state, cardId).id,
        topCorpRdTrashCost as 2,
      ).publicPayload,
    );
    publicPayload.cardImplementationTopCorpRdTrashCost = topCorpRdTrashCost;
  }
  return publicPayload;
}

function activatedAbilityPayload(
  cardId: CardInstanceId,
  ability: ActivatedCardAbilityImplementation,
  abilityIndex: number,
  state?: GameState,
): Record<string, string | number | boolean> {
  const advancementCounterCreditPayout =
    gainCreditsPerAdvancementCounterOnSourceEffect(ability);
  return {
    cardId,
    cardImplementationAbility: "activated",
    cardImplementationAbilityIndex: abilityIndex,
    cardImplementationAbilityTiming: ability.timing,
    ...(ability.label ? { cardImplementationAbilityLabel: ability.label } : {}),
    ...(advancementCounterCostForActivatedAbility(ability) > 0
      ? {
          cardImplementationAdvancementCounterCost:
            advancementCounterCostForActivatedAbility(ability),
        }
      : {}),
    ...sourceCounterCostsForActivatedAbility(ability).reduce<
      Record<string, string | number | boolean>
    >((payload, cost) => {
      payload.cardImplementationSourceCounterType = cost.counterType;
      payload.cardImplementationSourceCounterCost = cost.amount;
      return payload;
    }, {}),
    ...(hasTrashSourceCostForActivatedAbility(ability)
      ? { cardImplementationTrashSourceCost: true }
      : {}),
    ...(hasTapSourceCostForActivatedAbility(ability)
      ? { cardImplementationTapSourceCost: true }
      : {}),
    ...(advancementCounterCreditPayout
      ? {
          cardImplementationEconomyKind:
            "gain_credits_per_advancement_counter_on_source",
          cardImplementationAmountPerAdvancementCounter:
            advancementCounterCreditPayout.amountPerCounter,
          cardImplementationTrashesSource:
            hasTrashSourceEffectForActivatedAbility(ability),
        }
      : {}),
    ...(randomCorpHqDiscardCostForActivatedAbility(ability) > 0
      ? {
          cardImplementationRandomHqDiscardCost:
            randomCorpHqDiscardCostForActivatedAbility(ability),
        }
      : {}),
    ...(ability.timing === "runner_cost_penalty_support" &&
    state?.runnerCostPenaltySupportWindow
      ? {
          costPenaltySupportWindowId:
            state.runnerCostPenaltySupportWindow.windowId,
          costPenaltySupportOriginalActionId:
            state.runnerCostPenaltySupportWindow.originalActionId,
          costPenaltySupportAmountDue:
            state.runnerCostPenaltySupportWindow.amountDue,
          costPenaltySupportKind: state.runnerCostPenaltySupportWindow.kind,
        }
      : {}),
  };
}

function gainCreditsPerAdvancementCounterOnSourceEffect(
  ability: ActivatedCardAbilityImplementation,
):
  | Extract<
      CardEffectImplementation,
      { kind: "gain_credits_per_advancement_counter_on_source" }
    >
  | undefined {
  return ability.effects.find(
    (effect) =>
      effect.kind === "gain_credits_per_advancement_counter_on_source" &&
      (effect.recipient === "controller" || effect.recipient === "corp"),
  ) as
    | Extract<
        CardEffectImplementation,
        { kind: "gain_credits_per_advancement_counter_on_source" }
      >
    | undefined;
}

function hasTrashSourceEffectForActivatedAbility(
  ability: ActivatedCardAbilityImplementation,
): boolean {
  return ability.effects.some((effect) => effect.kind === "trash_source");
}

function exposeInstalledCardEffect(
  ability: ActivatedCardAbilityImplementation,
):
  | Extract<
      CardEffectImplementation,
      { kind: "expose_installed_card" }
    >
  | undefined {
  return ability.effects.length === 1 &&
    ability.effects[0]?.kind === "expose_installed_card"
    ? ability.effects[0]
    : undefined;
}

function moveTopTrashToGripEffect(
  ability: ActivatedCardAbilityImplementation,
):
  | Extract<
      CardEffectImplementation,
      { kind: "move_top_trash_to_grip" }
    >
  | undefined {
  return ability.effects.length === 1 &&
    ability.effects[0]?.kind === "move_top_trash_to_grip"
    ? ability.effects[0]
    : undefined;
}

function trashOwnRezzedIceForCreditsEffect(
  ability: ActivatedCardAbilityImplementation,
):
  | Extract<
      CardEffectImplementation,
      { kind: "trash_own_rezzed_ice_for_credits" }
    >
  | undefined {
  return ability.effects.length === 1 &&
    ability.effects[0]?.kind === "trash_own_rezzed_ice_for_credits"
    ? ability.effects[0]
    : undefined;
}

function copySameFortIceSubroutineEffect(
  ability: ActivatedCardAbilityImplementation,
):
  | Extract<
      CardEffectImplementation,
      { kind: "copy_same_fort_ice_subroutine_for_run" }
    >
  | undefined {
  return ability.effects.length === 1 &&
    ability.effects[0]?.kind === "copy_same_fort_ice_subroutine_for_run"
    ? ability.effects[0]
    : undefined;
}

function ownRezzedIceTargetIds(state: GameState): CardInstanceId[] {
  return state.corp.servers
    .flatMap((server) => server.ice)
    .filter((cardId): cardId is CardInstanceId => {
      const instance = state.cardInstances[cardId];
      return Boolean(
        instance &&
          instance.controller === "corp" &&
          instance.zone.side === "corp" &&
          instance.zone.zone === "serverIce" &&
          instance.rezzed === true,
      );
    })
    .sort();
}

type SameFortSubroutineTarget = {
  iceId: CardInstanceId;
  iceDefinition: CardDefinition;
  subroutineIndex: number;
  subroutineId: string;
  subroutineKind: "end_the_run" | "end_the_run_unless_runner_pays";
  amount?: number;
};

function sourceServerId(
  state: GameState,
  sourceCardId: CardInstanceId,
): Exclude<ServerId, "new_remote"> | undefined {
  const source = state.cardInstances[sourceCardId];
  return source?.zone.side === "corp" && source.zone.zone === "serverRoot"
    ? source.zone.serverId
    : undefined;
}

function sameFortSubroutineTargets(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  sourceCardId: CardInstanceId | undefined,
): SameFortSubroutineTarget[] {
  if (!sourceCardId || !state.run) return [];
  const serverId = sourceServerId(state, sourceCardId);
  if (!serverId || state.run.attackedServerId !== serverId) return [];
  const server = state.corp.servers.find((candidate) => candidate.id === serverId);
  if (!server) return [];
  const targets: SameFortSubroutineTarget[] = [];
  for (const iceId of server.ice.slice().sort()) {
    const instance = state.cardInstances[iceId];
    if (!instance || instance.controller !== "corp") continue;
    const definition = deps.definitionFor(state, iceId);
    const subroutines =
      printedSubroutinesForCardImplementation(definition) ??
      definition.subroutines ??
      [];
    subroutines.forEach((subroutine, subroutineIndex) => {
      if (
        subroutine.type !== "end_the_run" &&
        subroutine.type !== "end_the_run_unless_runner_pays"
      )
        return;
      if (
        state.run?.encounterAdditionalSubroutines?.some(
          (record) =>
            record.sourceCardInstanceId === sourceCardId &&
            record.targetIceId === iceId &&
            record.originalSubroutineId === subroutine.id,
        )
      )
        return;
      targets.push({
        iceId,
        iceDefinition: definition,
        subroutineIndex,
        subroutineId: subroutine.id,
        subroutineKind: subroutine.type,
        ...(subroutine.type === "end_the_run_unless_runner_pays"
          ? { amount: subroutine.amount }
          : {}),
      });
    });
  }
  return targets;
}

/**
 * Adds LegalActions for active declarative abilities on an already-valid source.
 *
 * This is action construction only. The same source, timing, condition, cost,
 * and limit rules are checked again by resolveActivatedCardImplementationAbility
 * before any click is spent or effect mutates state.
 */
export function pushActivatedCardImplementationActions(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  actions: LegalAction[],
  side: Side,
  sourceCardId: CardInstanceId,
  definition: CardDefinition,
): void {
  const timing = side === "corp" ? "corp_main" : "runner_main";
  pushActivatedCardImplementationActionsForTiming(
    deps,
    state,
    actions,
    side,
    sourceCardId,
    definition,
    timing,
  );
}

export function pushActivatedCardImplementationActionsForTiming(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  actions: LegalAction[],
  side: Side,
  sourceCardId: CardInstanceId,
  definition: CardDefinition,
  timing: ActivatedCardAbilityImplementation["timing"],
): void {
  if (deps.mustInstance(state.cardInstances, sourceCardId).controller !== side)
    return;
  for (const { ability, index } of activatedCardImplementationAbilitiesForTiming(
    definition,
    timing,
  )) {
    if (
      !canResolveActivatedCardImplementationAbility(
        deps,
        state,
        ability,
        sourceCardId,
      )
    )
      continue;
    if (!canPayActivatedCardImplementationCosts(state, side, sourceCardId, ability))
      continue;
    const exposeEffect = exposeInstalledCardEffect(ability);
    if (exposeEffect) {
      if (deps.exposeInstalledCorpCardTargets(state, exposeEffect.scope).length === 0)
        continue;
      actions.push(
        deps.createAction(
          state,
          side,
          "activated_card_ability",
          ability.label ?? `${definition.title}: installierte Korp-Karte exposen`,
          sourceCardId,
          activatedAbilityLegalActionCosts(ability),
          activatedAbilityPayload(sourceCardId, ability, index),
        ),
      );
      continue;
    }
    const moveTopTrashEffect = moveTopTrashToGripEffect(ability);
    if (moveTopTrashEffect) {
      const targetCardId = deps.topTrashToGripTargetId(state);
      if (!targetCardId) continue;
      const targetDefinition = deps.definitionFor(state, targetCardId);
      actions.push(
        deps.createAction(
          state,
          side,
          "activated_card_ability",
          ability.label ?? `${definition.title}: Fähigkeit nutzen`,
          sourceCardId,
          activatedAbilityLegalActionCosts(ability),
          {
            ...activatedAbilityPayload(sourceCardId, ability, index),
            cardImplementationTopTrashTargetId: targetCardId,
            targetDefinitionId: targetDefinition.id,
          },
        ),
      );
      continue;
    }
    const trashRezzedIceEffect = trashOwnRezzedIceForCreditsEffect(ability);
    if (trashRezzedIceEffect) {
      for (const targetCardId of ownRezzedIceTargetIds(state)) {
        const targetDefinition = deps.definitionFor(state, targetCardId);
        actions.push(
          deps.createAction(
            state,
            side,
            "activated_card_ability",
            `${definition.title}: ${targetDefinition.title} trashen`,
            sourceCardId,
            activatedAbilityLegalActionCosts(ability),
            {
              ...activatedAbilityPayload(sourceCardId, ability, index),
              targetCardId,
              targetDefinitionId: targetDefinition.id,
              gainedCredits: trashRezzedIceEffect.gainCredits,
            },
          ),
        );
      }
      continue;
    }
    const copySubroutineEffect = copySameFortIceSubroutineEffect(ability);
    if (copySubroutineEffect) {
      for (const target of sameFortSubroutineTargets(deps, state, sourceCardId)) {
        actions.push(
          deps.createAction(
            state,
            side,
            "activated_card_ability",
            `${definition.title}: ${target.iceDefinition.title} Subroutine kopieren`,
            sourceCardId,
            activatedAbilityLegalActionCosts(ability),
            {
              ...activatedAbilityPayload(sourceCardId, ability, index),
              targetCardId: target.iceId,
              targetDefinitionId: target.iceDefinition.id,
              subroutineIndex: target.subroutineIndex,
              subroutineId: target.subroutineId,
            },
          ),
        );
      }
      continue;
    }
    actions.push(
      deps.createAction(
        state,
        side,
        "activated_card_ability",
        ability.label ?? `${definition.title}: Fähigkeit nutzen`,
        sourceCardId,
        activatedAbilityLegalActionCosts(ability),
        activatedAbilityPayload(sourceCardId, ability, index, state),
      ),
    );
  }
}

function corpActivatedCardImplementationSourceIsAvailable(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  cardId: CardInstanceId,
  definition: CardDefinition,
): boolean {
  if (definition.type === "agenda") return state.corp.scoreArea.includes(cardId);
  return deps.rezzedCorpRootCardIds(state).includes(cardId);
}

function activatedAbilityForLegalAction(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
): {
  cardId: CardInstanceId;
  definition: CardDefinition;
  ability: ActivatedCardAbilityImplementation;
  abilityIndex: number;
} | undefined {
  if (legalAction.payload?.cardImplementationAbility !== "activated")
    return undefined;
  const cardId = legalAction.payload.cardId;
  if (typeof cardId !== "string" || !state.cardInstances[cardId])
    throw new Error("Die aktivierte Kartenfaehigkeit hat keine gueltige Quelle.");
  const definition = deps.definitionFor(state, cardId);
  const abilityIndex = Number(legalAction.payload.cardImplementationAbilityIndex);
  if (!Number.isInteger(abilityIndex) || abilityIndex < 0)
    throw new Error("Die aktivierte Kartenfaehigkeit hat keinen gueltigen Index.");
  const ability = cardImplementationForDefinitionId(definition.id)?.abilities?.[
    abilityIndex
  ];
  if (!ability || ability.kind !== "activated")
    throw new Error("Die aktivierte Kartenfaehigkeit passt nicht zur Karte.");
  return { cardId, definition, ability, abilityIndex };
}

function validateActivatedCardImplementationAbility(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
  match: {
    cardId: CardInstanceId;
    definition: CardDefinition;
    ability: ActivatedCardAbilityImplementation;
    abilityIndex: number;
  },
): void {
  const { cardId, ability } = match;
  if (deps.mustInstance(state.cardInstances, cardId).controller !== legalAction.side)
    throw new Error("Diese aktivierte Kartenfaehigkeit gehoert der anderen Seite.");
  validateActivatedAbilityCosts(ability, legalAction);
  if (
    !canPayActivatedCardImplementationCosts(
      state,
      legalAction.side,
      cardId,
      ability,
    )
  )
    throw new Error("Die aktivierte Kartenfaehigkeit kann nicht bezahlt werden.");
  if (
    legalAction.payload?.cardImplementationAbilityTiming !== ability.timing ||
    legalAction.payload?.cardImplementationAbilityIndex !== match.abilityIndex
  )
    throw new Error("Die aktivierte Kartenfaehigkeit passt nicht zum Profil.");
  if (ability.timing === "runner_main") {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf diese aktivierte Kartenfaehigkeit nutzen.");
    if (state.phase !== "runner_action_phase" || state.activeSide !== "runner")
      throw new Error(
        "Diese aktivierte Kartenfaehigkeit ist nur in der Runner-Aktionsphase nutzbar.",
      );
    if (!deps.runnerInstalledCardIds(state).includes(cardId))
      throw new Error("Die aktivierte Runner-Kartenfaehigkeit ist nicht installiert.");
    assertActivatedCardImplementationAbilityCanResolve(
      deps,
      state,
      ability,
      cardId,
    );
    const exposeEffect = exposeInstalledCardEffect(ability);
    if (exposeEffect) {
      const targetCardId = String(
        legalAction.payload?.cardImplementationExposeTargetId ?? "",
      );
      if (targetCardId && (
        !deps
          .exposeInstalledCorpCardTargets(state, exposeEffect.scope)
          .includes(targetCardId)
      ))
        throw new Error("Die zu exposende Korp-Karte ist nicht mehr gueltig.");
    }
    return;
  }
  if (ability.timing === "during_run") {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf diese aktivierte Kartenfaehigkeit nutzen.");
    if (!state.run)
      throw new Error("Diese aktivierte Kartenfaehigkeit ist nur waehrend eines Runs nutzbar.");
    if (!deps.runnerInstalledCardIds(state).includes(cardId))
      throw new Error("Die aktivierte Runner-Kartenfaehigkeit ist nicht installiert.");
    assertActivatedCardImplementationAbilityCanResolve(
      deps,
      state,
      ability,
      cardId,
    );
    return;
  }
  if (ability.timing === "runner_cost_penalty_support") {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf Kosten-/Penalty-Support nutzen.");
    if (!state.runnerCostPenaltySupportWindow)
      throw new Error("Es ist kein Kosten-/Penalty-Support-Fenster offen.");
    if (
      legalAction.payload?.costPenaltySupportWindowId !==
        state.runnerCostPenaltySupportWindow.windowId ||
      legalAction.payload?.costPenaltySupportOriginalActionId !==
        state.runnerCostPenaltySupportWindow.originalActionId ||
      legalAction.payload?.costPenaltySupportAmountDue !==
        state.runnerCostPenaltySupportWindow.amountDue ||
      legalAction.payload?.costPenaltySupportKind !==
        state.runnerCostPenaltySupportWindow.kind
    )
      throw new Error("Das Kosten-/Penalty-Support-Fenster passt nicht mehr.");
    if (!deps.runnerInstalledCardIds(state).includes(cardId))
      throw new Error("Die aktivierte Runner-Kartenfaehigkeit ist nicht installiert.");
    assertActivatedCardImplementationAbilityCanResolve(
      deps,
      state,
      ability,
      cardId,
    );
    return;
  }
  if (ability.timing === "access_start") {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf Access-Start-Faehigkeiten nutzen.");
    if (
      !state.run?.hiddenRunnerResourceAccessStartServerId ||
      state.run.breach
    )
      throw new Error("Es ist kein Access-Start-Fenster offen.");
    if (!deps.runnerInstalledCardIds(state).includes(cardId))
      throw new Error("Die aktivierte Runner-Kartenfaehigkeit ist nicht installiert.");
    assertActivatedCardImplementationAbilityCanResolve(
      deps,
      state,
      ability,
      cardId,
    );
    return;
  }
  if (ability.timing === "corp_encounter") {
    if (legalAction.side !== "corp")
      throw new Error("Nur die Korp darf diese Encounter-Kartenfaehigkeit nutzen.");
    if (
      state.timingPoint !== "run.encounter_ice" ||
      state.run?.phase !== "encounter_ice" ||
      state.run.encounteredIceId !== cardId
    )
      throw new Error(
        "Diese Kartenfaehigkeit ist nur beim Encounter mit dieser ICE nutzbar.",
      );
    const instance = deps.mustInstance(state.cardInstances, cardId);
    if (!instance.rezzed || match.definition.type !== "ice")
      throw new Error("Die Encounter-Kartenfaehigkeit braucht gerezzte ICE.");
    assertActivatedCardImplementationAbilityCanResolve(
      deps,
      state,
      ability,
      cardId,
    );
    return;
  }
  if (ability.timing === "corp_during_run") {
    if (legalAction.side !== "corp")
      throw new Error("Nur die Korp darf diese Run-Kartenfaehigkeit nutzen.");
    if (!state.run)
      throw new Error("Diese Kartenfaehigkeit ist nur waehrend eines Runs nutzbar.");
    if (
      !corpActivatedCardImplementationSourceIsAvailable(
        deps,
        state,
        cardId,
        match.definition,
      )
    )
      throw new Error("Die aktivierte Korp-Kartenfaehigkeit ist nicht verfuegbar.");
    assertActivatedCardImplementationAbilityCanResolve(
      deps,
      state,
      ability,
      cardId,
    );
    return;
  }
  if (ability.timing === "corp_trace_window") {
    if (legalAction.side !== "corp")
      throw new Error("Nur die Korp darf diese Trace-Kartenfaehigkeit nutzen.");
    if (!state.trace)
      throw new Error("Diese Kartenfaehigkeit ist nur waehrend eines Trace nutzbar.");
    if (
      !corpActivatedCardImplementationSourceIsAvailable(
        deps,
        state,
        cardId,
        match.definition,
      )
    )
      throw new Error("Die aktivierte Korp-Kartenfaehigkeit ist nicht verfuegbar.");
    assertActivatedCardImplementationAbilityCanResolve(
      deps,
      state,
      ability,
      cardId,
    );
    return;
  }
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf diese aktivierte Kartenfaehigkeit nutzen.");
  if (state.phase !== "corp_action_phase" || state.activeSide !== "corp")
    throw new Error(
      "Diese aktivierte Kartenfaehigkeit ist nur in der Korp-Aktionsphase nutzbar.",
    );
  if (
    !corpActivatedCardImplementationSourceIsAvailable(
      deps,
      state,
      cardId,
      match.definition,
    )
  )
    throw new Error("Die aktivierte Korp-Kartenfaehigkeit ist nicht verfuegbar.");
  assertActivatedCardImplementationAbilityCanResolve(
    deps,
    state,
    ability,
    cardId,
  );
  const trashRezzedIceEffect = trashOwnRezzedIceForCreditsEffect(ability);
  if (trashRezzedIceEffect) {
    const targetCardId = String(legalAction.payload?.targetCardId ?? "");
    if (!ownRezzedIceTargetIds(state).includes(targetCardId as CardInstanceId))
      throw new Error("Das zu trashende ICE ist nicht mehr gueltig.");
  }
  const copySubroutineEffect = copySameFortIceSubroutineEffect(ability);
  if (copySubroutineEffect) {
    const target = sameFortSubroutineTargetForLegalAction(
      deps,
      state,
      cardId,
      legalAction,
    );
    if (!target)
      throw new Error("Die Ziel-Subroutine ist nicht mehr gueltig.");
  }
}

function sameFortSubroutineTargetForLegalAction(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  sourceCardId: CardInstanceId,
  legalAction: LegalAction,
): SameFortSubroutineTarget | undefined {
  const targetCardId = String(legalAction.payload?.targetCardId ?? "");
  const subroutineIndex = Number(legalAction.payload?.subroutineIndex);
  const subroutineId = String(legalAction.payload?.subroutineId ?? "");
  if (!targetCardId || !Number.isInteger(subroutineIndex) || subroutineIndex < 0)
    return undefined;
  return sameFortSubroutineTargets(deps, state, sourceCardId).find(
    (target) =>
      target.iceId === targetCardId &&
      target.subroutineIndex === subroutineIndex &&
      target.subroutineId === subroutineId,
  );
}

/**
 * Revalidates and resolves one activated CardImplementation ability.
 *
 * Costs are paid only after source status, timing, conditions, and ability
 * limits have been checked against the current state, which rejects stale
 * actions without partial effect execution.
 */
export function resolveActivatedCardImplementationAbility(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
): boolean {
  const match = activatedAbilityForLegalAction(deps, state, legalAction);
  if (!match) return false;
  validateActivatedCardImplementationAbility(deps, state, legalAction, match);
  const costPublicPayload = payActivatedCardImplementationCosts(
    deps,
    state,
    legalAction,
    legalAction.side,
    match.cardId,
    match.ability,
  );
  const result = executeCardImplementationEffects(
    state,
    {
      sourceCardId: match.cardId,
      sourceDefinitionId: match.definition.id,
      sourceTitle: match.definition.title,
      ...(typeof legalAction.payload?.targetCardId === "string"
        ? { targetCardId: legalAction.payload.targetCardId as CardInstanceId }
        : {}),
      xValue: Math.floor(Number(legalAction.payload?.xValue ?? 0)),
      targetRezCost: Math.floor(Number(legalAction.payload?.targetRezCost ?? 0)),
      controller: deps.mustInstance(state.cardInstances, match.cardId).controller,
      drawCards: (side, amount) => deps.drawCards(state, side, amount),
      damageRunner: (damageType, amount) =>
        deps.damageRunner(
          state,
          legalAction,
          match.definition.id,
          damageType,
          amount,
        ),
      unpreventableDamageRunner: (damageType, amount) =>
        deps.unpreventableDamageRunner(
          state,
          legalAction,
          match.definition.id,
          damageType,
          amount,
        ),
      startTrace: (sourceCardId, baseTraceStrength, successEffect) => ({
        ...deps.startTrace(
          state,
          legalAction,
          sourceCardId,
          match.definition.id,
          baseTraceStrength,
          successEffect,
        ),
      }),
      startRun: (serverId, options) =>
        deps.startRun(state, legalAction, serverId, options),
      chosenRunServerId: () =>
        String(legalAction.payload?.serverId ?? "") as Exclude<
          ServerId,
          "new_remote"
        >,
      startPrivateLook: (zone, count) =>
        deps.startPrivateLook(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          zone,
          count,
        ),
      exposeInstalledCard: (scope) => {
        const targetId = String(
          legalAction.payload?.cardImplementationExposeTargetId ?? "",
        );
        return targetId
          ? deps.exposeInstalledCorpCard(
              state,
              legalAction,
              match.cardId,
              match.definition.id,
              targetId,
              scope,
            )
          : deps.startExposeInstalledCorpCardsChoice(
              state,
              legalAction,
              match.cardId,
              match.definition.id,
              1,
              1,
              scope,
            );
      },
      startExposeInstalledCards: (min, max, scope) =>
        deps.startExposeInstalledCorpCardsChoice(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          min,
          max,
          scope,
        ),
      exposeOutermostIceEachFort: () =>
        deps.exposeOutermostIceEachDataFort(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
        ),
      startSearchTrashToGrip: (filter) =>
        deps.startSearchTrashToGripChoice(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          filter,
        ),
      startSearchStackToGrip: (filter, revealToCorp, shuffleAfterwards) =>
        deps.startSearchStackToGripChoice(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          filter,
          revealToCorp,
          shuffleAfterwards,
        ),
      moveTopTrashToGrip: () =>
        deps.moveTopTrashToGrip(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
        ),
      startSearchStackInstall: (filter, installCost, shuffleAfterwards) =>
        deps.startSearchStackInstallChoice(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          filter,
          installCost,
          shuffleAfterwards,
        ),
      startChooseStackOrTrashProgramInstall: (
        installCost,
        shuffleStackIfSearched,
        returnInstalledCardToGripAtEndOfTurn,
      ) =>
        deps.startStackOrTrashProgramInstallChoice(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          installCost,
          shuffleStackIfSearched,
          returnInstalledCardToGripAtEndOfTurn,
        ),
      startLookTopStackShowToCorpThenInstallMatching: (
        count,
        allowedTypes,
        installCost,
        trashSourceIfInstalled,
        shuffleAfterwards,
      ) =>
        deps.startLookTopStackShowToCorpThenInstallMatchingChoice(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          count,
          allowedTypes,
          installCost,
          trashSourceIfInstalled,
          shuffleAfterwards,
        ),
      startLookTopStackTakeMatching: (
        count,
        allowedTypes,
        costPerTaken,
        revealTakenToCorp,
        shuffleRemainder,
      ) =>
        deps.startLookTopStackTakeMatchingChoice(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          count,
          allowedTypes,
          costPerTaken,
          revealTakenToCorp,
          shuffleRemainder,
        ),
      startLookTopStackTakeOneArrangeRest: (count) =>
        deps.startLookTopStackTakeOneArrangeRestChoice(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          count,
        ),
      addHostedCredits: (sourceCardId, amount) =>
        deps.addHostedCredits(state, sourceCardId, amount),
      addCountersToSource: (sourceCardId, counterType, amount) =>
        deps.addCountersToSource(state, sourceCardId, counterType, amount),
      removeRunnerTags: (mode, amount) =>
        deps.removeRunnerTags(state, mode, amount),
      avoidNextTag: (amount) => deps.avoidNextTag(state, amount),
      returnSourceToGripIfPaid: (sourceCardId, amount) =>
        deps.returnSourceToGripIfPaid(
          state,
          legalAction,
          sourceCardId,
          amount,
        ),
      takeHostedCredits: (sourceCardId, side, amount) =>
        deps.takeHostedCredits(state, sourceCardId, side, amount),
      trashSourceWhenEmpty: (sourceCardId) =>
        deps.trashSourceWhenEmpty(state, sourceCardId),
      trashSource: (sourceCardId) =>
        deps.trashSource(state, sourceCardId, legalAction),
      startDistributeAdvancementCounters: (amount, distribution) =>
        deps.startDistributeAdvancementCounters(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          amount,
          distribution,
        ),
      startMoveAdvancementCounters: (source, maxAmount) =>
        deps.startMoveAdvancementCounters(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          source,
          maxAmount,
        ),
      addCurrentEncounterAdditionalSubroutine: (input) =>
        deps.addCurrentEncounterAdditionalSubroutine(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          match.definition.title,
          input,
        ),
      copySameFortIceSubroutineForRun: () => {
        const target = sameFortSubroutineTargetForLegalAction(
          deps,
          state,
          match.cardId,
          legalAction,
        );
        if (!target)
          throw new Error("Die Ziel-Subroutine ist nicht mehr gueltig.");
        if (!state.run)
          throw new Error("Subroutine-Copy braucht einen laufenden Run.");
        state.run.encounterAdditionalSubroutines = [
          ...(state.run.encounterAdditionalSubroutines ?? []),
          {
            sourceCardInstanceId: match.cardId,
            sourceDefinitionId: match.definition.id,
            sourceTitle: match.definition.title,
            targetIceId: target.iceId,
            originalSubroutineId: target.subroutineId,
            subroutineKind: target.subroutineKind,
            ...(target.amount !== undefined ? { amount: target.amount } : {}),
          },
        ];
        return {
          publicPayload: {
            copiedSubroutine: true,
            targetCardDefinitionId: target.iceDefinition.id,
            subroutineIndex: target.subroutineIndex,
            subroutineId: target.subroutineId,
          },
        };
      },
      addCurrentRunAccessCount: (server, amount) =>
        deps.addCurrentRunAccessCount(state, server, amount),
      passCurrentEncounteredIce: (subtypeRequired) =>
        deps.passCurrentEncounteredIce(state, legalAction, subtypeRequired),
      rezInstalledIceWithLifecycleCounters: (input) =>
        deps.rezInstalledIceWithLifecycleCounters(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
          input,
        ),
      replaceFortCardsFromHq: () =>
        deps.replaceFortCardsFromHq(
          state,
          legalAction,
          match.cardId,
          match.definition.id,
        ),
    },
    match.ability.effects,
  );
  if (match.ability.limit)
    markCardImplementationAbilityLimitUsed(
      deps.abilityLimits,
      state,
      match.cardId,
      match.ability.limit,
    );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: match.definition.id,
    ...(match.ability.limit
      ? {
          cardImplementationAbilityLimit: match.ability.limit.kind,
          cardImplementationSourceAbilityUsedThisTurn: true,
        }
      : {}),
    ...costPublicPayload,
    ...result.publicPayload,
  };
  deps.appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
  return true;
}

/**
 * Resolves a printed-cost on-play CardImplementation ability after the host has
 * accepted the play action. The runtime executes only declarative effects; play
 * legality, card movement, and printed cost payment stay in the host.
 */
export function executeOnPlayCardImplementationAbility(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
  definition: CardDefinition,
  cardId: CardInstanceId,
): void {
  const ability = printedCostOnPlayImplementation(definition);
  if (!ability)
    throw new Error(`Kein On-Play-Implementation-Resolver fuer ${definition.id}.`);
  assertOnPlayCardImplementationAbilityCanResolve(deps, state, ability);
  const result = executeCardImplementationEffects(
    state,
    {
      sourceCardId: cardId,
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
      controller: deps.mustInstance(state.cardInstances, cardId).controller,
      drawCards: (side, amount) => deps.drawCards(state, side, amount),
      damageRunner: (damageType, amount) =>
        deps.damageRunner(state, legalAction, definition.id, damageType, amount),
      unpreventableDamageRunner: (damageType, amount) =>
        deps.unpreventableDamageRunner(
          state,
          legalAction,
          definition.id,
          damageType,
          amount,
        ),
      startTrace: (sourceCardId, baseTraceStrength, successEffect) => ({
        ...deps.startTrace(
          state,
          legalAction,
          sourceCardId,
          definition.id,
          baseTraceStrength,
          successEffect,
        ),
      }),
      startRun: (serverId, options) =>
        deps.startRun(state, legalAction, serverId, options),
      chosenRunServerId: () =>
        String(legalAction.payload?.serverId ?? "") as Exclude<
          ServerId,
          "new_remote"
        >,
      startPrivateLook: (zone, count) =>
        deps.startPrivateLook(state, legalAction, cardId, definition.id, zone, count),
      exposeInstalledCard: (scope) => {
        const targetId = String(
          legalAction.payload?.cardImplementationExposeTargetId ?? "",
        );
        return targetId
          ? deps.exposeInstalledCorpCard(
              state,
              legalAction,
              cardId,
              definition.id,
              targetId,
              scope,
            )
          : deps.startExposeInstalledCorpCardsChoice(
              state,
              legalAction,
              cardId,
              definition.id,
              1,
              1,
              scope,
            );
      },
      startExposeInstalledCards: (min, max, scope) =>
        deps.startExposeInstalledCorpCardsChoice(
          state,
          legalAction,
          cardId,
          definition.id,
          min,
          max,
          scope,
        ),
      exposeOutermostIceEachFort: () =>
        deps.exposeOutermostIceEachDataFort(
          state,
          legalAction,
          cardId,
          definition.id,
        ),
      startSearchTrashToGrip: (filter) =>
        deps.startSearchTrashToGripChoice(
          state,
          legalAction,
          cardId,
          definition.id,
          filter,
        ),
      startSearchStackToGrip: (filter, revealToCorp, shuffleAfterwards) =>
        deps.startSearchStackToGripChoice(
          state,
          legalAction,
          cardId,
          definition.id,
          filter,
          revealToCorp,
          shuffleAfterwards,
        ),
      moveTopTrashToGrip: () =>
        deps.moveTopTrashToGrip(
          state,
          legalAction,
          cardId,
          definition.id,
        ),
      startSearchStackInstall: (filter, installCost, shuffleAfterwards) =>
        deps.startSearchStackInstallChoice(
          state,
          legalAction,
          cardId,
          definition.id,
          filter,
          installCost,
          shuffleAfterwards,
        ),
      startChooseStackOrTrashProgramInstall: (
        installCost,
        shuffleStackIfSearched,
        returnInstalledCardToGripAtEndOfTurn,
      ) =>
        deps.startStackOrTrashProgramInstallChoice(
          state,
          legalAction,
          cardId,
          definition.id,
          installCost,
          shuffleStackIfSearched,
          returnInstalledCardToGripAtEndOfTurn,
        ),
      startLookTopStackShowToCorpThenInstallMatching: (
        count,
        allowedTypes,
        installCost,
        trashSourceIfInstalled,
        shuffleAfterwards,
      ) =>
        deps.startLookTopStackShowToCorpThenInstallMatchingChoice(
          state,
          legalAction,
          cardId,
          definition.id,
          count,
          allowedTypes,
          installCost,
          trashSourceIfInstalled,
          shuffleAfterwards,
        ),
      startLookTopStackTakeMatching: (
        count,
        allowedTypes,
        costPerTaken,
        revealTakenToCorp,
        shuffleRemainder,
      ) =>
        deps.startLookTopStackTakeMatchingChoice(
          state,
          legalAction,
          cardId,
          definition.id,
          count,
          allowedTypes,
          costPerTaken,
          revealTakenToCorp,
          shuffleRemainder,
        ),
      startLookTopStackTakeOneArrangeRest: (count) =>
        deps.startLookTopStackTakeOneArrangeRestChoice(
          state,
          legalAction,
          cardId,
          definition.id,
          count,
        ),
      startTrashOwnInstalledCardsForCredits: (min, max, gainPerTrashed) =>
        deps.startTrashOwnInstalledCardsForCreditsChoice(
          state,
          legalAction,
          cardId,
          definition.id,
          min,
          max,
          gainPerTrashed,
        ),
      startTrashCardsFromGripForCredits: (max, gainPerTrashed) =>
        deps.startTrashCardsFromGripForCreditsChoice(
          state,
          legalAction,
          cardId,
          definition.id,
          max,
          gainPerTrashed,
        ),
      shuffleGripTrashAndStackThenDraw: (
        drawCount,
        removePlayedCardFromGame,
      ) =>
        deps.shuffleGripTrashAndStackThenDraw(
          state,
          legalAction,
          cardId,
          definition.id,
          drawCount,
          removePlayedCardFromGame,
        ),
      startPayRezCostToTrashRezzedIceChoice: () =>
        deps.startPayRezCostToTrashRezzedIceChoice(
          state,
          legalAction,
          cardId,
        ),
      startTrashUnrezzedIceChoice: () =>
        deps.startTrashUnrezzedIceChoice(state, legalAction, cardId),
      startCorpChoiceRezOrTrashIceChoice: () =>
        deps.startCorpChoiceRezOrTrashIceChoice(state, legalAction, cardId),
      startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice: () =>
        deps.startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice(
          state,
          legalAction,
          cardId,
        ),
      startDerezRezzedBlackIceChoice: () =>
        deps.startDerezRezzedBlackIceChoice(state, legalAction, cardId),
      startCorpDiscardHqWithRetainPayment: (retainCostPerCard) =>
        deps.startCorpDiscardHqWithRetainPayment(
          state,
          legalAction,
          cardId,
          retainCostPerCard,
        ),
      startRunnerProgramInstallActionBundle: (actionCount, temporaryCredit) =>
        deps.startRunnerProgramInstallActionBundle(
          state,
          legalAction,
          actionCount,
          temporaryCredit,
        ),
      addCounterToAllInstalledRunnerIcebreakers: (counterType, amount) =>
        deps.addCounterToAllInstalledRunnerIcebreakers(
          state,
          counterType,
          amount,
        ),
      gainRunnerEventAgendaPoint: (amount) =>
        deps.gainRunnerEventAgendaPoint(
          state,
          legalAction,
          definition.id,
          amount,
        ),
      runnerLiberatedAgendaSubtypeThisTurn: (subtype) =>
        deps.runnerLiberatedAgendaSubtypeThisTurn(state, subtype),
      corpRandomDiscardFromHq: (count) =>
        deps.corpRandomDiscardFromHq(state, definition.id, count),
      addHostedCredits: (sourceCardId, amount) =>
        deps.addHostedCredits(state, sourceCardId, amount),
      removeRunnerTags: (mode, amount) =>
        deps.removeRunnerTags(state, mode, amount),
      avoidNextTag: (amount) => deps.avoidNextTag(state, amount),
      returnSourceToGripIfPaid: (sourceCardId, amount) =>
        deps.returnSourceToGripIfPaid(state, legalAction, sourceCardId, amount),
      takeHostedCredits: (sourceCardId, side, amount) =>
        deps.takeHostedCredits(state, sourceCardId, side, amount),
      trashSourceWhenEmpty: (sourceCardId) =>
        deps.trashSourceWhenEmpty(state, sourceCardId),
      trashSource: (sourceCardId) =>
        deps.trashSource(state, sourceCardId, legalAction),
      startDistributeAdvancementCounters: (amount, distribution) =>
        deps.startDistributeAdvancementCounters(
          state,
          legalAction,
          cardId,
          definition.id,
          amount,
          distribution,
        ),
      startMoveAdvancementCounters: (source, maxAmount) =>
        deps.startMoveAdvancementCounters(
          state,
          legalAction,
          cardId,
          definition.id,
          source,
          maxAmount,
        ),
      rezInstalledIceWithLifecycleCounters: (input) =>
        deps.rezInstalledIceWithLifecycleCounters(
          state,
          legalAction,
          cardId,
          definition.id,
          input,
        ),
      replaceFortCardsFromHq: () =>
        deps.replaceFortCardsFromHq(
          state,
          legalAction,
          cardId,
          definition.id,
        ),
    },
    ability.effects,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...result.publicPayload,
  };
  deps.appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
}
