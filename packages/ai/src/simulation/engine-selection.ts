import {
  applyRandomizedIceInstallSelection,
  applyRandomizedTraceBidSelection,
  applyRandomizedTurnPlanSelection,
  quoteCorpPunishRoute,
  quoteRandomizedIceInstallSelection,
  quoteRandomizedTraceBidSelection,
  quoteRandomizedTurnPlanSelection,
} from "@netgrid/engine";
import type { AiDecision, GameState } from "@netgrid/shared";
import type { AiDecisionRuntimeOptions } from "../runtime/choose-ai-action";

export function simulationEngineRuntimeOptions(
  state: GameState,
): Pick<
  AiDecisionRuntimeOptions,
  | "quoteCorpPunishRoute"
  | "quoteRandomizedIceInstallSelection"
  | "quoteRandomizedTraceBidSelection"
  | "quoteRandomizedTurnPlanSelection"
> {
  return {
    quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
    quoteRandomizedIceInstallSelection: (request) =>
      quoteRandomizedIceInstallSelection(state, request),
    quoteRandomizedTraceBidSelection: (request) =>
      quoteRandomizedTraceBidSelection(state, request),
    quoteRandomizedTurnPlanSelection: (request) =>
      quoteRandomizedTurnPlanSelection(state, request),
  };
}
export function applySimulationEngineSelection(
  state: GameState,
  decision: AiDecision,
  idempotencyKey: string,
) {
  if (decision.selectionKind === "engine_randomized_ice_install_selection")
    return applyRandomizedIceInstallSelection(state, {
      ...decision.engineCommand,
      idempotencyKey,
    });
  if (decision.selectionKind === "engine_randomized_turn_plan_selection")
    return applyRandomizedTurnPlanSelection(state, {
      ...decision.engineCommand,
      idempotencyKey,
    });
  if (decision.selectionKind === "engine_randomized_trace_bid_selection")
    return applyRandomizedTraceBidSelection(state, {
      ...decision.engineCommand,
      idempotencyKey,
    });
  return undefined;
}
