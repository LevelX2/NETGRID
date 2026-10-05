import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import {
  residentPlanPortfolioSnapshot,
  resetResidentPlanPortfolioMemory,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
afterEach(resetResidentPlanPortfolioMemory);
function native(refresh = true) {
  const cp = JSON.parse(
    readFileSync(
      new URL("./fixtures/meta-ten-repairs/506-g39-d306.json", import.meta.url),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  if (refresh) {
    expect(cp.postFixLegalAction.expiresAtStateVersion).toBe(cp.stateVersion);
    cp.input.legalActions = cp.input.legalActions.map(
      (a: { actionId: string }) =>
        a.actionId === cp.postFixLegalAction.actionId
          ? cp.postFixLegalAction
          : a,
    );
  }
  const input = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInputWithDeckCapabilities;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return { input, cp };
}
it("retains the actual current Engine draw fact through the DTO and holds the nonwinning score", () => {
  const { input, cp } = native();
  const score = input.legalActions.find((a) => a.type === "score_agenda")!;
  expect(score.payload).toMatchObject(cp.postFixLegalAction.payload);
  const result = chooseAiAction(input);
  expect(result.actionId).toBe("corp.end_turn");
  expect(result.fallbackUsed).toBe(false);
  expect(result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "corp.complete_turn",
  );
  expect(result.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: result.actionId,
    stateVersion: cp.stateVersion,
  });
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  expect(
    portfolio.instances.some(
      (i) =>
        i.moduleId === "corp.score_agenda" &&
        (i.moduleState as { signal?: { routeAssessment?: string } }).signal
          ?.routeAssessment === "corp_score_mandatory_draw_exceeds_deck" &&
        i.viability !== "ready",
    ),
  ).toBe(true);
});
it.each(["absent", "stale", "contradictory"])(
  "fails closed for the %s mandatory score fact",
  (boundary) => {
    const { input } = native(boundary !== "absent");
    const p = input.legalActions.find(
      (a) => a.type === "score_agenda",
    )!.payload!;
    if (boundary === "stale")
      p.corpScoreMandatoryDrawQuoteStateVersion =
        Number(p.corpScoreMandatoryDrawQuoteStateVersion) + 1;
    if (boundary === "contradictory")
      p.corpScoreMandatoryDrawAfterBaseCount = 2;
    expect(() => chooseAiAction(input)).toThrow(/missing_action_semantics/);
  },
);
