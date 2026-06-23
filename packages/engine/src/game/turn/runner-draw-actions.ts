import type { GameState, LegalAction } from "@netgrid/shared";
import { buildLegalAction } from "./action-builders";

export type RunnerDrawActionContext = {
  drawTaxSourceCount: number;
  projectedDrawCount: number;
};

export function buildRunnerDrawCardActions(
  state: GameState,
  context: RunnerDrawActionContext,
): LegalAction[] {
  const { drawTaxSourceCount, projectedDrawCount } = context;
  if (drawTaxSourceCount <= 0) {
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

  const actions: LegalAction[] = [];
  const projectedDrawTaxCost = drawTaxSourceCount * projectedDrawCount;
  if (state.runner.credits >= projectedDrawTaxCost) {
    actions.push(
      buildLegalAction(
        state,
        "runner",
        "draw_card",
        projectedDrawTaxCost === 1
          ? "Karte ziehen (City Surveillance: 1 Credit zahlen)"
          : `Karte ziehen (City Surveillance: ${projectedDrawTaxCost} Credits zahlen)`,
        "basic_action",
        [{ clicks: 1, credits: projectedDrawTaxCost }],
        {
          drawTaxSourceCount: drawTaxSourceCount,
          drawTaxProjectedDrawCount: projectedDrawCount,
          drawTaxDecision: "pay",
          drawTaxProjectedCreditsPaid: projectedDrawTaxCost,
          drawTaxProjectedTagsAdded: 0,
        },
      ),
    );
  }

  actions.push(
    buildLegalAction(
      state,
      "runner",
      "draw_card",
      drawTaxSourceCount === 1
        ? "Karte ziehen (City Surveillance: 1 Tag nehmen)"
        : `Karte ziehen (City Surveillance: ${drawTaxSourceCount} Tags nehmen)`,
      "basic_action",
      [{ clicks: 1 }],
      {
        drawTaxSourceCount: drawTaxSourceCount,
        drawTaxProjectedDrawCount: projectedDrawCount,
        drawTaxDecision: "tag",
        drawTaxProjectedCreditsPaid: 0,
        drawTaxProjectedTagsAdded:
          drawTaxSourceCount * projectedDrawCount,
      },
    ),
  );
  return actions;
}
