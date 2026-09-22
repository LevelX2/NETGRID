import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-r12-g34-d15.json";
import setupCheckpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-r12-control-d8.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("leaves competing draw events with their development owner before search setup", () => {
  const input = structuredClone(
    setupCheckpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const runtime = structuredClone(
    setupCheckpoint.runtime,
  ) as unknown as AiRuntimeCheckpointV1;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    runtime.residentPlanPortfolio!,
  );
  const result = chooseAiAction(input);
  expect(
    input.legalActions.some((action) => action.actionId === result.actionId),
  ).toBe(true);
  expect(result.fallbackUsed).toBe(false);
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const drawId = "runner_onr_proteus_103_cruising-for-netwatch_1";
  expect(
    portfolio.instances.some(
      (entry) =>
        entry.moduleId === "runner.develop_board_and_hand" &&
        entry.dedupeKey === `card:${drawId}`,
    ),
  ).toBe(true);
});

it("keeps the admitted search phase on its exact search route when draw events compete", () => {
  const input = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const runtime = structuredClone(
    checkpoint.runtime,
  ) as unknown as AiRuntimeCheckpointV1;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    runtime.residentPlanPortfolio!,
  );
  const search = input.legalActions.find(
    (action) =>
      action.payload?.cardImplementationEffectKind === "search_stack_to_grip",
  )!;
  const result = chooseAiAction(input);
  expect(result.actionId).toBe(search.actionId);
  expect(result.fallbackUsed).toBe(false);
  const plan = result.decisionDebug?.planFirstDecision;
  expect(plan?.route).toMatchObject({
    actionId: search.actionId,
    capabilityId: "search_answer_breaker_sentry",
    stateVersion: input.playerView.stateVersion,
  });
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const executor = portfolio.instances.find(
    (entry) => entry.instanceId === portfolio.executorInstanceId,
  )!;
  expect(executor.moduleId).toBe("runner.rig_and_coverage");
  expect(executor.moduleState).toMatchObject({
    phase: "search_answer",
    selectedSearchActionId: search.actionId,
    selectedSearchStateVersion: input.playerView.stateVersion,
    gap: {
      requiredRole: "breaker_sentry",
      directSearchChoiceBindings: expect.arrayContaining([
        expect.objectContaining({
          actionId: search.actionId,
          targetDefinitionId: expect.any(String),
        }),
      ]),
    },
  });
});
