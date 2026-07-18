/** Declarative typed port for the stateCorpRuntimeResolvers composition group. */
import type { CardInstanceId, GameState } from "@netgrid/shared";

export type StateCorpRuntimePort = {
  serverDifficultyIncreaseFromRunCounters: (
    state: GameState,
    agendaId: CardInstanceId,
  ) => number;
  serverDifficultyReductionFromUpgrades: (
    state: GameState,
    agendaId: CardInstanceId,
  ) => number;
  swapCorpHqAndRdTop: (state: GameState) => void;
  spendRecurringTraceCreditPool: (state: GameState, amount: number) => number;
};
