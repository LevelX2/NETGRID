import { type CardInstanceId, type GameState, type PurgeableRunnerVirusCounterType } from "@netgrid/shared";
import { mustInstance } from "../state/card-server-lookup";
import { CARD_IMPLEMENTATIONS } from "../../card-implementations/registry";
import type { CardVirusCounterImplementation } from "../../ability-engine/definition-types";
import type { RuntimeDeps } from "./runtime-shared";

export function createCounterTurnRuntimeServices(
  deps: RuntimeDeps,
  runtime: Pick<
    import("./lookup-runtime-port").LookupRuntimePort,
    | "installedVirusCounterTotalForDefinition"
    | "virusCounterImplementationForCard"
  >,
): import("./counter-turn-runtime-port").CounterTurnRuntimePort {
  function installedRunnerVirusSourceIds(
    state: GameState,
    predicate?: (implementation: CardVirusCounterImplementation) => boolean,
  ): CardInstanceId[] {
    return state.runner.rig.programs
      .slice()
      .sort()
      .filter((cardId) => {
        const implementation = runtime.virusCounterImplementationForCard(
          state,
          cardId,
        );
        return (
          implementation !== undefined &&
          (!predicate || predicate(implementation))
        );
      });
  }

  function cockroachCounterTotal(state: GameState): number {
    const owners = CARD_IMPLEMENTATIONS.filter((implementation) => {
      const virusCounter = implementation.virusCounter;
      return (
        virusCounter?.continuousEffect?.kind ===
          "randomize_corp_hq_discards_at_threshold" &&
        virusCounter.addOnSuccessfulRun?.counterScope.kind ===
          "shared_corp_pool"
      );
    });
    if (owners.length !== 1)
      throw new Error(
        `Expected exactly one shared Corp-pool Cockroach effect owner; received ${owners.length}.`,
      );
    const counterKind = owners[0]!.virusCounter!
      .counterKind as PurgeableRunnerVirusCounterType;
    return Math.max(
      0,
      Math.floor(state.purgeableRunnerVirusCounters?.corp?.[counterKind] ?? 0),
    );
  }

  function incubatorCounterTotal(state: GameState): number {
    const owners = CARD_IMPLEMENTATIONS.filter((implementation) => {
      const virusCounter = implementation.virusCounter;
      return (
        virusCounter?.startOfRunnerTurn?.kind ===
          "incubator_duplicate_virus_counter" &&
        virusCounter.addOnSuccessfulRun?.counterScope.kind ===
          "shared_corp_pool"
      );
    });
    if (owners.length !== 1)
      throw new Error(
        `Expected exactly one shared Corp-pool Incubator effect owner; received ${owners.length}.`,
      );
    const counterKind = owners[0]!.virusCounter!
      .counterKind as PurgeableRunnerVirusCounterType;
    return Math.max(
      0,
      Math.floor(state.purgeableRunnerVirusCounters?.corp?.[counterKind] ?? 0),
    );
  }

  function cockroachRandomHqDiscardActive(state: GameState): boolean {
    return cockroachCounterTotal(state) >= 2;
  }

  function isVisibleVirusCounterCardForRunner(
    state: GameState,
    cardId: CardInstanceId,
  ): boolean {
    const instance = mustInstance(state.cardInstances, cardId);
    if (instance.owner === "runner") return true;
    if (instance.rezzed) return true;
    if (state.corp.scoreArea.includes(cardId)) return true;
    if (state.corp.archives.includes(cardId) && instance.faceup) return true;
    if (state.run?.accessedCardId === cardId) return true;
    return false;
  }

  return {
    installedRunnerVirusSourceIds,
    cockroachCounterTotal,
    incubatorCounterTotal,
    cockroachRandomHqDiscardActive,
    isVisibleVirusCounterCardForRunner,
  };
}
