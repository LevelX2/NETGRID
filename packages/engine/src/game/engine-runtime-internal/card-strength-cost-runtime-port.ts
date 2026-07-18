/** Declarative typed port implemented by card-strength-cost-runtime-services. */
import type { CardInstanceId, GameState } from "@netgrid/shared";
import type { BreakSubroutineCostBreakdown } from "./runtime-shared";

export type CardStrengthCostRuntimePort = {
  iceStrengthBonusFor: (state: GameState, iceId: CardInstanceId) => number;
  iceStrengthFor: (state: GameState, iceId: CardInstanceId) => number;
  runRemainderStrengthBonusForBreaker: (
    run: GameState["run"],
    breakerId: CardInstanceId,
  ) => number;
  runBreakSubroutineAdditionalCost: (run: GameState["run"]) => number;
  runnerHardwareBreakSubroutineAdditionalCost: (state: GameState) => number;
  breakSubroutineCostBreakdown: (
    state: GameState,
    baseCost: number,
    subroutineCount?: number,
    breakerId?: CardInstanceId,
  ) => BreakSubroutineCostBreakdown;
};
