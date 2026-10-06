import { readFileSync } from "node:fs";
import { expect } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";

export type Capture = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  stateVersion: number;
  validation: Record<string, boolean>;
};
export function load(index: number): Capture {
  return JSON.parse(
    readFileSync(
      new URL(`./fixtures/match-28287/d${index}.json`, import.meta.url),
      "utf8",
    ),
  );
}
export function decide(cp: Capture) {
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(action.expiresAtStateVersion).toBe(cp.stateVersion);
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: cp.stateVersion,
    planInstanceId: plan.selectedStep!.planInstanceId,
    stepId: plan.selectedStep!.stepId,
  });
  return { decision, action, plan };
}
export function candidates(input: AiDecisionInputWithDeckCapabilities) {
  return buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      [...input.playerView.own.gripOrHq, ...input.playerView.own.rig!]
        .filter((c) => c.known && c.definitionId)
        .map((c) => [c.instanceId, c.definitionId!]),
    ),
  });
}
