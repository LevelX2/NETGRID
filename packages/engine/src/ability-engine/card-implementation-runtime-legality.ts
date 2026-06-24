import type {
  CardDefinition,
  CardInstanceId,
  GameState,
} from "@netgrid/shared";
import {
  canUseCardImplementationAbilityLimit,
  cardImplementationAbilityLimitFailureMessage,
} from "./card-implementation-ability-limits";
import type { CardImplementationRuntimeDependencies } from "./card-implementation-runtime-dependency-types";
import {
  cardImplementationConditionMet,
  printedCostOnPlayImplementation,
} from "./card-implementation-runtime-shared";
import {
  ownRezzedIceTargetIds,
  sameFortSubroutineTargets,
} from "./card-implementation-runtime-activated-targets";
import type {
  ActivatedCardAbilityImplementation,
  OnPlayCardAbilityImplementation,
} from "./definition-types";

export function canResolveOnPlayCardImplementationAbility(
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
      return (
        deps.exposeInstalledCorpCardTargets(state, "any_installed").length > 0
      );
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
        deps.stackOrTrashProgramInstallTargetCount(state, effect.installCost) >
        0
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

export function canResolveActivatedCardImplementationAbility(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  ability: ActivatedCardAbilityImplementation,
  sourceCardId?: CardInstanceId,
): boolean {
  if (
    ability.condition &&
    !cardImplementationConditionMet(
      deps,
      state,
      ability.condition,
      sourceCardId,
    )
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
        deps.stackOrTrashProgramInstallTargetCount(state, effect.installCost) >
        0
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

export function assertOnPlayCardImplementationAbilityCanResolve(
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
    throw new Error(
      "Der Runner hat in diesem Spiel nicht genug Runs versucht.",
    );
  if (ability.condition?.kind === "runner_trashed_node_last_turn")
    throw new Error("Der Runner hat im letzten Zug keine Node getrasht.");
  if (ability.condition?.kind === "runner_trashed_advertisement_this_turn")
    throw new Error(
      "Der Runner hat in diesem Zug keine Advertisement-Karte getrasht.",
    );
  if (ability.condition?.kind === "runner_trashed_transactions_this_turn")
    throw new Error(
      "Der Runner hat in diesem Zug keine Transactions-Karte getrasht.",
    );
  if (ability.condition?.kind === "runner_installed_resource_last_turn")
    throw new Error(
      "Der Runner hat im letzten Zug keine Resource installiert.",
    );
  if (ability.condition?.kind === "runner_damaged_during_last_three_actions")
    throw new Error(
      "Der Runner wurde in den letzten drei Aktionen nicht verletzt.",
    );
  if (
    ability.condition?.kind === "runner_made_successful_run_on_server_this_turn"
  )
    throw new Error(
      "Der Runner hat in diesem Zug keinen passenden erfolgreichen Run gemacht.",
    );
  if (
    ability.condition?.kind ===
    "runner_made_successful_hq_and_rd_runs_this_turn"
  )
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

export function assertActivatedCardImplementationAbilityCanResolve(
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
    throw new Error(
      "Der Runner hat in diesem Spiel nicht genug Runs versucht.",
    );
  if (ability.condition?.kind === "runner_trashed_node_last_turn")
    throw new Error("Der Runner hat im letzten Zug keine Node getrasht.");
  if (ability.condition?.kind === "runner_trashed_advertisement_this_turn")
    throw new Error(
      "Der Runner hat in diesem Zug keine Advertisement-Karte getrasht.",
    );
  if (ability.condition?.kind === "runner_trashed_transactions_this_turn")
    throw new Error(
      "Der Runner hat in diesem Zug keine Transactions-Karte getrasht.",
    );
  if (ability.condition?.kind === "runner_installed_resource_last_turn")
    throw new Error(
      "Der Runner hat im letzten Zug keine Resource installiert.",
    );
  if (ability.condition?.kind === "runner_damaged_during_last_three_actions")
    throw new Error(
      "Der Runner wurde in den letzten drei Aktionen nicht verletzt.",
    );
  const limitFailureMessage = cardImplementationAbilityLimitFailureMessage(
    ability.limit,
  );
  if (limitFailureMessage) throw new Error(limitFailureMessage);
  throw new Error("Die aktivierte Kartenbedingung ist nicht erfuellt.");
}
