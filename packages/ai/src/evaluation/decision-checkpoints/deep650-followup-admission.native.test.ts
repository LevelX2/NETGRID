import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function decision(key: string) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `./fixtures/deep650-followup-admission/${key}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  expect(cp.decisionLocalEngineQuotes.availability).toBe("not_applicable");
  resetResidentPlanPortfolioMemory();
  const raw = structuredClone(cp.input);
  const input = { ...raw, ...buildAiDecisionInputDto(raw) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    structuredClone(cp.runtime),
  );
  const before = JSON.stringify(input.playerView),
    result = chooseAiAction(input);
  expect(JSON.stringify(input.playerView)).toBe(before);
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).not.toBe(true);
  expect(
    input.legalActions.some(
      (a: LegalAction) =>
        a.actionId === result.actionId &&
        a.expiresAtStateVersion === cp.stateVersion,
    ),
  ).toBe(true);
  expect(
    result.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
  ).toBeTruthy();
  expect(
    result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toBeTruthy();
  return { cp, input, result };
}

it("does not admit answer development when a bounded event retains no new card", () => {
  const { cp, input, result } = decision("draw-retained-zero");
  expect(cp.stateVersion).toBe(287);
  expect(cp.historical.root).toContain("runner.develop_board_and_hand");
  expect(
    input.legalActions.find(
      (a: LegalAction) => a.actionId === cp.historical.actionId,
    )?.payload,
  ).toMatchObject({
    projectedGrossDrawCount: 1,
    projectedPostDrawDispositionCount: 1,
    projectedNetHandDelta: 0,
  });
  expect(result.actionId).not.toBe(cp.historical.actionId);
});

it("does not spend three future actions purging two Thought counters below their native effect threshold", () => {
  const { cp, input, result } = decision("thought-below-threshold");
  expect(cp.stateVersion).toBe(186);
  expect(cp.historical.root).toContain("corp.respond_to_virus_pressure");
  expect(input.playerView.own.identity.counterDisplays).toContainEqual(
    expect.objectContaining({ counterType: "thought", amount: 2 }),
  );
  expect(result.actionId).not.toBe(cp.historical.actionId);
});
