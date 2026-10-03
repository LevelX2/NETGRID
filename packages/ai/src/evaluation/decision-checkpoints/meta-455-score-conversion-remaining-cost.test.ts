import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-r10-g6-d190.json";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { corpSameTurnScoreConversionPaths } from "../../plans/tactical-plan-corp-score-conversion";

it("finishes the cheaper installed agenda before the prospective equal-point sibling", () => {
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
  const paths = corpSameTurnScoreConversionPaths(input);
  expect(
    paths.map((p) => [
      p.agendaCardId,
      p.creditsRequired,
      p.clicksRequired,
      p.clicksGenerated,
    ]),
  ).toEqual([
    ["corp_onr_v1_203_hostile-takeover_1", 3, 3, 0],
    // Rezzed pure support now supplies the prospective HQ route without
    // artificial extra action capacity. The installed score is still cheaper.
    ["corp_onr_v1_203_hostile-takeover_2", 4, 3, 0],
  ]);
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(action.type).toBe("advance_card");
  expect(action.source).toBe("corp_onr_v1_203_hostile-takeover_1");
  const parent =
    "plan:corp.score_agenda:agenda%3Acorp_onr_v1_203_hostile-takeover_1%3Aremote_1";
  const plan = decision.decisionDebug?.planFirstDecision;
  expect(plan?.rootPlanInstanceId).toBe(parent);
  expect(plan?.leafExecutorInstanceId).toBe(parent);
  expect(plan?.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: 189,
  });
  expect(plan?.route?.stepId).toContain(parent);
  expect(decision.fallbackUsed).toBe(false);
  const other = residentPlanPortfolioSnapshot(input)!.instances.find(
    (p) =>
      p.dedupeKey === "agenda:corp_onr_v1_203_hostile-takeover_2:new_remote",
  )!;
  expect(other.moduleState).toMatchObject({
    signal: {
      sameTurnCloseout: true,
      conversion: { remainingAdvancementClicks: 1, remainingScoreCredits: 4 },
    },
  });
});
