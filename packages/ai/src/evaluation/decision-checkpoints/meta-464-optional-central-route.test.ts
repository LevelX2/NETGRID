import capture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-464-control-g22-d248.json";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { AiRuntimeCheckpointV1 } from "./runtime-checkpoint";
it("preserves a Central-owner admitted optional Archives run with qualified hidden matchpoint payoff", () => {
  const c = structuredClone(capture) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreResidentPlanPortfolioMemorySnapshot(
    c.input,
    c.runtime.residentPlanPortfolio,
  );
  const d = chooseAiAction(c.input);
  expect(d.actionId).toBe(
    "runner.start_run.archives.bonus_run.onr_v1_123_bodyweight-data-creche",
  );
  const p = residentPlanPortfolioSnapshot(c.input)!;
  expect(
    p.instances.find((i) => i.instanceId === p.executorInstanceId)?.moduleId,
  ).toBe("runner.pressure_central");
});
it("still declines after every Archives card is known and no agenda remains", () => {
  const c = structuredClone(capture) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const archives = c.input.playerView.servers.find((s) => s.id === "archives")!;
  expect(archives.root.every((c) => c.known && c.type !== "agenda")).toBe(true);
  c.input.playerView.opponent.discardCount = archives.root.length;
  resetResidentPlanPortfolioMemory();
  restoreResidentPlanPortfolioMemorySnapshot(
    c.input,
    c.runtime.residentPlanPortfolio,
  );
  const d = chooseAiAction(c.input);
  expect(
    c.input.legalActions.find((a) => a.actionId === d.actionId)?.payload
      ?.runnerAbility,
  ).toBe("decline_successful_run_extra_run");
});
