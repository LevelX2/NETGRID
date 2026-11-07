import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { buildAiDecisionInputDto } from "../input-dto";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { actionEconomyProjectionFor } from "../actions/action-economy-projection";
import { exactImmediateHandDelta } from "../actions/action-candidate-facts";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "./resident-plan-portfolio-memory";
const cp = JSON.parse(
  readFileSync(
    new URL(
      "../../../../data/scenarios/ai-decision-checkpoints/cp-deep634-recycle-hand-count-d132.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
afterEach(resetResidentPlanPortfolioMemory);
// Original actor snapshot plus the new producer contract, independently checked
// in Engine tests and against the original repeated D132 Engine result (hand5).
function source() {
  const raw = structuredClone(cp.input),
    action = raw.legalActions.find((a: { actionId: string }) =>
      a.actionId.includes("shuffle_grip_trash_and_stack_then_draw"),
    );
  Object.assign(action.payload, {
    runnerRecycleDrawProjectionSchemaVersion:
      "runner-recycle-draw-projection-v1",
    runnerRecycleDrawProjectionGripBefore: 4,
    runnerRecycleDrawProjectionHeapBefore: 4,
    runnerRecycleDrawProjectionStackBefore: 30,
    runnerRecycleDrawProjectionSourceConsumption: 1,
    runnerRecycleDrawProjectionGrossDrawCount: 5,
    runnerRecycleDrawProjectionNetHandDelta: 1,
    runnerRecycleDrawProjectionNetStackDelta: 2,
    drawCardsAmount: 5,
  });
  const input = { ...raw, ...buildAiDecisionInputDto(raw) },
    current = input.legalActions.find(
      (a: { actionId: string }) => a.actionId === action.actionId,
    );
  const candidate = buildActionSemanticCandidates({
    legalActions: [current],
    observerSide: "runner",
    stateVersion: 131,
  })[0]!;
  return { input, action: current, candidate };
}
it("keeps the complete Engine quote through the strict DTO and projects net hand1, not a simple draw4", () => {
  const { candidate, action } = source();
  expect(action.payload.runnerRecycleDrawProjectionSchemaVersion).toBe(
    "runner-recycle-draw-projection-v1",
  );
  expect(candidate.economyProjection).toMatchObject({
    cardsDrawn: 5,
    cardsConsumed: 1,
    netHandDelta: 1,
    drawPileCardsConsumed: 5,
    drawPileCardsReplenished: 7,
    netDrawPileDelta: 2,
    reliability: "guaranteed",
    source: "legal_action_payload",
  });
  expect(exactImmediateHandDelta(candidate)).toBe(1);
});
it("projects the native completed recycle to actual hand5 without changing actor information", () => {
  const { input, action } = source();
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(input.playerView),
    result = chooseAiAction(input),
    p = result.decisionDebug!.planFirstDecision!;
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  const line = p.turnPlanning!.consideredLines!.find(
    (l) => l.firstActionId === action.actionId && l.stepCount === 1,
  )!;
  expect(line).toBeDefined();
  expect(line.projectedEndState).toMatchObject({
    handMinimum: 5,
    handMaximum: 5,
  });
  expect(JSON.stringify(input.playerView)).toBe(before);
});
it.each(["source", "state", "side", "relation", "schema"])(
  "rejects a malformed or stale recycle quote: %s",
  (variant) => {
    const { action, candidate } = source();
    if (variant === "source") action.payload.cardId = "different-source";
    if (variant === "state") action.expiresAtStateVersion++;
    if (variant === "side") action.side = "corp";
    if (variant === "relation")
      action.payload.runnerRecycleDrawProjectionNetHandDelta = 4;
    if (variant === "schema")
      action.payload.runnerRecycleDrawProjectionSchemaVersion = "unknown";
    const projection = actionEconomyProjectionFor(candidate, action);
    expect(projection.reliability).toBe("unknown");
    expect(
      exactImmediateHandDelta({ ...candidate, economyProjection: projection }),
    ).toBeUndefined();
  },
);
