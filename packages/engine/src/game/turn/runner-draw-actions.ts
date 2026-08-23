import {
  RUNNER_DRAW_PROJECTION_SCHEMA_VERSION,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { buildLegalAction } from "./action-builders";

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
  const projectedGrossDrawCount = Math.min(
    state.runner.stack.length,
    nonNegativeInteger(context.projectedDrawCount),
  );
  const projectedPostDrawDispositionCount =
    context.projectedDrawCount > 1 && projectedGrossDrawCount > 0 ? 1 : 0;
  return [
    buildLegalAction(
      state,
      "runner",
      "draw_card",
      "Karte ziehen",
      "basic_action",
      [{ clicks: 1 }],
      {
        runnerDrawProjectionSchemaVersion:
          RUNNER_DRAW_PROJECTION_SCHEMA_VERSION,
        projectedGrossDrawCount,
        projectedPostDrawDispositionCount,
        projectedNetHandDelta:
          projectedGrossDrawCount - projectedPostDrawDispositionCount,
        visibleDrawTaxSourceCount: nonNegativeInteger(
          context.drawTaxSourceCount,
        ),
      },
    ),
  ];
}

function nonNegativeInteger(value: number): number {
  return Number.isSafeInteger(value) ? Math.max(0, value) : 0;
}
