import { readFileSync } from "node:fs";
import { beforeEach, expect, it } from "vitest";

import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type Capture = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
};
const fixture = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta562-independent-engine-development.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { states: { game: number; decision: number; capture: Capture }[] };

beforeEach(resetResidentPlanPortfolioMemory);

it.each([2, 10])(
  "retains an independent ready engine when native G%s has no memory demand",
  (game) => {
    const capture = structuredClone(
      fixture.states.find((entry) => entry.game === game)!.capture,
    );
    expect(Object.keys(capture.validation)).toHaveLength(9);
    expect(Object.values(capture.validation).every(Boolean)).toBe(true);
    capture.input.planningStateIdentity = buildPlanningStateIdentity(capture.input);
    restoreAiRuntimeCheckpoint(
      capture.input,
      capture.input.ownDeckSnapshot!.deckSnapshotId,
      capture.runtime,
    );
    const before = JSON.stringify(capture.input);
    const decision = chooseAiAction(capture.input);
    expect(JSON.stringify(capture.input)).toBe(before);
    const source = capture.input.playerView.own.gripOrHq.find(
      (card) => card.definitionId === "onr_v1_123_bodyweight-data-creche",
    )!;
    const install = capture.input.legalActions.find(
      (action) => action.type === "install_card" && action.source === source.instanceId,
    )!;
    expect(install).toBeDefined();
    expect(decision).toMatchObject({
      actionId: install.actionId,
      fallbackUsed: false,
      timeoutUsed: false,
    });
    const planId = `plan:runner.develop_board_and_hand:card%3A${source.instanceId}`;
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      selectedPlan: { moduleId: "runner.develop_board_and_hand" },
      rootPlanInstanceId: planId,
      leafExecutorInstanceId: planId,
      selectedStep: { planInstanceId: planId, stepId: `${planId}:execute` },
    });
  },
);

it("preserves the original terminal-run funding cashout instead of spending the last three credits", () => {
  const capture = structuredClone(
    fixture.states.find((entry) => entry.game === 18)!.capture,
  );
  capture.input.planningStateIdentity = buildPlanningStateIdentity(capture.input);
  restoreAiRuntimeCheckpoint(
    capture.input,
    capture.input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  expect(capture.input.playerView.own.credits).toBe(3);
  const decision = chooseAiAction(capture.input);
  expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(decision.actionId).toContain("broker:withdraw_credits");
  expect(decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "runner.credit_bank",
  );
});
