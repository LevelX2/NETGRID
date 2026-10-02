import { afterEach, expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-485-r4-g19-d57.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  residentPlanPortfolioSnapshot,
  resetResidentPlanPortfolioMemory,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

it("keeps the real cheaper-answer recovery in acquisition instead of installing another current breaker", () => {
  const input = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    structuredClone(checkpoint.runtime) as unknown as AiRuntimeCheckpointV1,
  );
  const decision = chooseAiAction(input);
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const recovery = portfolio.instances.find(
    (entry) => entry.dedupeKey === "coverage:breaker_wall:efficiency:hq",
  )!;
  expect(recovery.moduleId).toBe("runner.rig_and_coverage");
  expect(recovery.moduleState).toMatchObject({
    phase: "search_answer",
    gap: {
      recoveryMode: "search_known_alternative",
      answerInHand: false,
      recoveryEvidenceCodes: expect.arrayContaining([
        "coverage_efficiency_deck_alternative:onr_v1_021_dwarf",
      ]),
      directSearchChoiceBindings: expect.arrayContaining([
        expect.objectContaining({
          sourceDefinitionId: "onr_v1_099_mantis-fixer-at-large",
          targetDefinitionId: "onr_v1_021_dwarf",
        }),
      ]),
    },
  });
  expect(
    (recovery.moduleState as { gap: { installActionIds?: string[] } }).gap
      .installActionIds ?? [],
  ).toEqual([]);
  expect(decision.actionId).not.toBe(
    "runner.install_card.runner_onr_v1_074_worm_2.runner_onr_v1_074_worm_2",
  );
  expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
    true,
  );
  expect(decision.fallbackUsed).toBe(false);
});
