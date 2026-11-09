import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { releaseAiMatchRuntime } from "./match-runtime-memory";

const saved = JSON.parse(
  readFileSync(
    new URL(
      "../../../../data/scenarios/ai-decision-checkpoints/cp-deep699-margin-trace-bid.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: Parameters<typeof restoreAiRuntimeCheckpoint>[2];
  validation: Record<string, boolean>;
};
afterEach(() => releaseAiMatchRuntime(saved.input.matchId!));
it("preserves a losing bid that reduces the exact visible trace margin without changing its rules owner", () => {
  expect(Object.keys(saved.validation)).toHaveLength(9);
  expect(Object.values(saved.validation).every(Boolean)).toBe(true);
  const input = {
    ...structuredClone(saved.input),
    ...buildAiDecisionInputDto(structuredClone(saved.input)),
  };
  if (!input.ownDeckSnapshot) throw new Error("native_deck_missing");
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    structuredClone(saved.runtime),
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    structuredClone(saved.runtime.residentPlanPortfolio),
  );
  expect(input.playerView.trace).toMatchObject({
    corpStrength: 7,
    runnerLink: 0,
    profile: "modern_open",
  });
  expect(input.playerView.own.credits).toBe(6);
  const before = JSON.stringify({
    view: input.playerView,
    actions: input.legalActions,
  });
  const result = chooseAiAction(input);
  expect(result.actionId).toBe("runner.resolve_choice");
  expect(result.selectedChoices).toEqual({
    choiceId: input.playerView.pendingChoice!.choiceId,
    selectedOptionIds: ["bid_6"],
  });
  expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "rules",
  );
  expect(result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId).toBe(
    "rules.window_resolution",
  );
  expect(result.fallbackUsed).toBeFalsy();
  expect(result.timeoutUsed).toBeFalsy();
  expect(input.legalActions[0]!.expiresAtStateVersion).toBe(
    input.playerView.stateVersion,
  );
  expect(
    JSON.stringify({ view: input.playerView, actions: input.legalActions }),
  ).toBe(before);
});
