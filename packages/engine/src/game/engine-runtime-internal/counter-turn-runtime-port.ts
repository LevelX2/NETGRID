/** Declarative typed port implemented by counter-turn-runtime-services. */
import type { CardInstanceId, GameState } from "@netgrid/shared";
import type { CardVirusCounterImplementation } from "../../ability-engine/definition-types";

export type CounterTurnRuntimePort = {
  installedRunnerVirusSourceIds: (
    state: GameState,
    predicate?: (implementation: CardVirusCounterImplementation) => boolean,
  ) => CardInstanceId[];
  cockroachCounterTotal: (state: GameState) => number;
  incubatorCounterTotal: (state: GameState) => number;
  cockroachRandomHqDiscardActive: (state: GameState) => boolean;
  isVisibleVirusCounterCardForRunner: (
    state: GameState,
    cardId: CardInstanceId,
  ) => boolean;
};
