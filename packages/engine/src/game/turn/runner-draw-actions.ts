import type { GameState, LegalAction } from "@netgrid/shared";
import { buildLegalAction } from "./action-builders";

export type RunnerDrawActionContext = {
  drawTaxSourceCount: number;
  projectedDrawCount: number;
};

export function buildRunnerDrawCardActions(
  state: GameState,
  _context: RunnerDrawActionContext,
): LegalAction[] {
  return [
    buildLegalAction(
      state,
      "runner",
      "draw_card",
      "Karte ziehen",
      "basic_action",
      [{ clicks: 1 }],
    ),
  ];
}
