import type {
  CardDefinition,
  CardInstanceId,
  GameState,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import type { CardImplementationRuntimeDependencies } from "./card-implementation-runtime-dependency-types";
import type {
  CardConditionImplementation,
  OnPlayCardAbilityImplementation,
} from "./definition-types";

export function printedCostOnPlayImplementation(
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
export function cardImplementationConditionMet(
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

export function normalizeSubtypeLabel(subtype: string): string {
  return subtype
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function hasNormalizedSubtype(
  subtypes: readonly string[] | undefined,
  subtype: string,
): boolean {
  const target = normalizeSubtypeLabel(subtype);
  return (
    subtypes?.some(
      (candidate) => normalizeSubtypeLabel(candidate) === target,
    ) ?? false
  );
}
