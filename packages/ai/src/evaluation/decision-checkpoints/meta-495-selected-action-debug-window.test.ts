import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
const actionId =
  "corp.advance_card.corp_onr_classic_001_data-fort-remapping_2.corp_onr_classic_001_data-fort-remapping_2";

function checkpoint() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-495-r1-g33-d141.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  return cp;
}

it.each([false, true])(
  "retains the exact selected action and plan evidence in a bounded debug window (selected first: %s)",
  (selectedFirst) => {
    const cp = checkpoint();
    const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
    expect(input.legalActions.length).toBeGreaterThan(32);
    expect(
      input.legalActions.findIndex(
        (action: { actionId: string }) => action.actionId === actionId,
      ),
    ).toBeGreaterThanOrEqual(32);
    if (selectedFirst) {
      input.legalActions = [
        input.legalActions.find(
          (action: { actionId: string }) => action.actionId === actionId,
        ),
        ...input.legalActions.filter(
          (action: { actionId: string }) => action.actionId !== actionId,
        ),
      ];
    }
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    restoreResidentPlanPortfolioMemorySnapshot(
      input,
      structuredClone(cp.runtime.residentPlanPortfolio),
    );
    const before = JSON.stringify([input.playerView, input.legalActions]);
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planKind).toBe("corp.score_agenda");
    const alternatives = decision.decisionDebug?.actionAlternatives ?? [];
    expect(alternatives).toHaveLength(32);
    expect(alternatives.filter((alternative) => alternative.selected)).toEqual([
      expect.objectContaining({
        actionId,
        selected: true,
        actionType: "advance_card",
        whyChosen: expect.arrayContaining([
          expect.stringContaining("selected_by_plan:plan:corp.score_agenda:"),
          "selected_for_step:advance_score_agenda",
        ]),
      }),
    ]);
    expect(new Set(alternatives.map((alternative) => alternative.actionId)).size)
      .toBe(32);
    expect(JSON.stringify([input.playerView, input.legalActions])).toBe(before);
  },
);
