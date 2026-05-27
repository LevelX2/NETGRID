import type { CardImplementationRuntimeDependencies } from "../../ability-engine/card-implementation-runtime";
import { runnerCardImplementationAbilityLimitHost } from "../../ability-engine/card-implementation-ability-limits";

export type CounterLifecycleRuntimeDepsKey =
  | "cardCounter"
  | "runnerRunAttemptsLastTurn"
  | "runnerRunAttemptsThisGame"
  | "runnerTrashedNodeLastTurn"
  | "runnerInstalledResourceLastTurn"
  | "runnerMadeSuccessfulRunOnServerThisTurn"
  | "runnerLiberatedAgendaSubtypeThisTurn"
  | "corpScoredAgendaSubtypeLastTurn"
  | "addCounterToAllInstalledRunnerIcebreakers"
  | "removeRunnerTags"
  | "avoidNextTag"
  | "abilityLimits";

export type CounterLifecycleCardImplementationRuntimeDeps = Pick<
  CardImplementationRuntimeDependencies,
  CounterLifecycleRuntimeDepsKey
>;

type RuntimeState = Parameters<
  CounterLifecycleCardImplementationRuntimeDeps["cardCounter"]
>[0];

export type CounterLifecycleRuntimeDepsHost = {
  counters: {
    cardCounter: CounterLifecycleCardImplementationRuntimeDeps["cardCounter"];
    addCounterToAllInstalledRunnerIcebreakers: CounterLifecycleCardImplementationRuntimeDeps["addCounterToAllInstalledRunnerIcebreakers"];
  };
  lifecycle: {
    hasSuccessfulHqRunThisTurn: (state: RuntimeState) => boolean;
    runnerLiberatedAgendaSubtypeThisTurn: CounterLifecycleCardImplementationRuntimeDeps["runnerLiberatedAgendaSubtypeThisTurn"];
    corpScoredBlackOpsAgendaLastTurn: (state: RuntimeState) => boolean;
  };
};

export function createCounterLifecycleCardImplementationRuntimeDeps(
  host: CounterLifecycleRuntimeDepsHost,
): CounterLifecycleCardImplementationRuntimeDeps {
  return {
    cardCounter: (state, cardId, counterType) =>
      host.counters.cardCounter(state, cardId, counterType),
    runnerRunAttemptsLastTurn,
    runnerRunAttemptsThisGame,
    runnerTrashedNodeLastTurn,
    runnerInstalledResourceLastTurn,
    runnerMadeSuccessfulRunOnServerThisTurn: (state, server) =>
      server === "hq" && host.lifecycle.hasSuccessfulHqRunThisTurn(state),
    runnerLiberatedAgendaSubtypeThisTurn: (state, subtype) =>
      host.lifecycle.runnerLiberatedAgendaSubtypeThisTurn(state, subtype),
    corpScoredAgendaSubtypeLastTurn: (state, subtype) =>
      subtype === "black_ops" &&
      host.lifecycle.corpScoredBlackOpsAgendaLastTurn(state),
    addCounterToAllInstalledRunnerIcebreakers: (state, counterType, amount) =>
      host.counters.addCounterToAllInstalledRunnerIcebreakers(
        state,
        counterType,
        amount,
      ),
    removeRunnerTags,
    avoidNextTag,
    abilityLimits: runnerCardImplementationAbilityLimitHost,
  };
}

function runnerRunAttemptsLastTurn(state: RuntimeState): number {
  return Math.max(
    0,
    Math.floor(state.runnerTurnFlags?.runAttemptsLastTurn ?? 0),
  );
}

function runnerRunAttemptsThisGame(state: RuntimeState): number {
  return Math.max(
    0,
    Math.floor(state.runnerTurnFlags?.runAttemptsThisGame ?? 0),
  );
}

function runnerTrashedNodeLastTurn(state: RuntimeState): boolean {
  return state.runnerTurnFlags?.trashedNodeLastTurn === true;
}

function runnerInstalledResourceLastTurn(state: RuntimeState): boolean {
  return (state.runnerTurnFlags?.installedResourceIdsLastTurn ?? []).some(
    (cardId) => state.runner.rig.resources.includes(cardId),
  );
}

function removeRunnerTags(
  state: RuntimeState,
  mode: Parameters<
    CounterLifecycleCardImplementationRuntimeDeps["removeRunnerTags"]
  >[1],
  amount?: Parameters<
    CounterLifecycleCardImplementationRuntimeDeps["removeRunnerTags"]
  >[2],
): ReturnType<
  CounterLifecycleCardImplementationRuntimeDeps["removeRunnerTags"]
> {
  const maxAmount =
    mode === "all" ? state.runner.tags : Math.max(0, Math.floor(amount ?? 0));
  const removedTags = Math.min(state.runner.tags, maxAmount);
  state.runner.tags = Math.max(0, state.runner.tags - removedTags);
  return {
    removedTags,
    runnerTagsAfter: state.runner.tags,
    publicPayload: {
      removedTags,
      runnerTagsAfter: state.runner.tags,
    },
  };
}

function avoidNextTag(
  state: RuntimeState,
  amount: Parameters<
    CounterLifecycleCardImplementationRuntimeDeps["avoidNextTag"]
  >[1],
): ReturnType<CounterLifecycleCardImplementationRuntimeDeps["avoidNextTag"]> {
  state.runnerTagAvoidanceCredits =
    Math.max(0, Math.floor(state.runnerTagAvoidanceCredits ?? 0)) + amount;
  return {
    amount,
    publicPayload: {
      avoidNextTag: true,
      tagAvoidanceCreditsAfter: state.runnerTagAvoidanceCredits,
    },
  };
}
