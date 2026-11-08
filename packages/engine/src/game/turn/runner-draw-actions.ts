import { type GameState, type LegalAction } from "@netgrid/shared";
import { buildLegalAction } from "./action-builders";
import { runnerDrawProjectionPayload } from "../../ability-engine/runner-draw-projection";

export type RunnerDrawActionContext = {
  drawTaxSourceCount: number;
  projectedDrawCount: number;
};

export function buildRunnerDrawCardActions(
  state: GameState,
  context: RunnerDrawActionContext,
): LegalAction[] {
  // Projects side-safe draw-sequence consequences for planning only. Draw
  // execution, taxes, and replacement handling remain runtime-authoritative.
  return [
    buildLegalAction(
      state,
      "runner",
      "draw_card",
      "Karte ziehen",
      "basic_action",
      [{ clicks: 1 }],
      runnerDrawProjectionPayload(
        state.runner.stack.length,
        [1],
        context.projectedDrawCount > 1,
        nonNegativeInteger(context.drawTaxSourceCount),
      ),
    ),
  ];
}

function nonNegativeInteger(value: number): number {
  return Number.isSafeInteger(value) ? Math.max(0, value) : 0;
}
