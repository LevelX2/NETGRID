import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-540-r1-g38-d98-defense-disposition.json";
import engineActions from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-540-r1-g38-d98-engine-legal-actions.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

it("rejects the captured tag-clear route when its quoted cost exceeds the current credit pool", () => {
  expect(Object.values(checkpoint.validation).every(Boolean)).toBe(true);
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const actions = input.legalActions.map((action) => {
    const captured = engineActions.find((a) => a.actionId === action.actionId)!;
    expect(captured.expiresAtStateVersion).toBe(input.playerView.stateVersion);
    expect(captured.costs).toEqual(action.costs);
    const current = structuredClone(action);
    if (captured.payload === undefined) delete current.payload;
    else
      current.payload = structuredClone(captured.payload) as NonNullable<
        typeof current.payload
      >;
    return current;
  });
  Object.assign(
    input,
    buildAiDecisionInputDto({
      ...input,
      legalActions: actions,
      playerView: { ...input.playerView, legalActions: actions },
    }),
  );
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  expect(input.playerView.own).toMatchObject({
    credits: 1,
    clicks: 4,
    tags: 4,
  });
  const action = input.legalActions.find(
    (a) => a.payload?.cardImplementationEffectKind === "remove_tags",
  )!;
  expect(action.costs).toContainEqual({ credits: 2, clicks: 2 });
  expect(() => chooseAiAction(input)).toThrow(
    expect.objectContaining({
      code: "no_current_route_head",
      context: expect.objectContaining({
        unresolvedActionIds: [expect.stringContaining(action.source)],
        removalCondition: expect.stringContaining("insufficient_credits"),
      }),
    }),
  );
});
