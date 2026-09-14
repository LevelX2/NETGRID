import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-r9-g28-d442.json";
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

it("keeps the currently funded score instead of scattering the last two clicks across agendas", () => {
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
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  const parent =
    "plan:corp.score_agenda:agenda%3Acorp_onr_v1_203_hostile-takeover_3%3Aremote_1";
  expect(action.type).toBe("advance_card");
  expect(action.source).toBe("corp_onr_v1_203_hostile-takeover_3");
  expect(decision.fallbackUsed).toBe(false);
  expect(
    decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toBe(parent);
  expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: input.playerView.stateVersion,
  });
  expect(decision.decisionDebug?.planFirstDecision?.route?.stepId).toContain(
    parent,
  );
  const score = residentPlanPortfolioSnapshot(input)!.instances.find(
    (p) => p.instanceId === parent,
  )!;
  expect(score.moduleState).toMatchObject({
    signal: {
      sameTurnCloseout: true,
      sameTurnConversionProof: "engine_quoted_path",
      sameTurnConversionResourceCost: {
        stateVersion: 441,
        credits: 2,
        clicks: 2,
      },
    },
  });
});
