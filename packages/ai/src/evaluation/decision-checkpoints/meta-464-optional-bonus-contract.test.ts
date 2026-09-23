import { expect, it } from "vitest";
import capture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-464-r2-g22-d279.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { AiRuntimeCheckpointV1 } from "./runtime-checkpoint";
it.each([false, true])(
  "consumes the Engine optional bonus contract without inventing payoff (optional=%s)",
  (optional) => {
    const c = structuredClone(capture) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    // The Engine producer regression verifies this corrected action metadata.
    if (optional)
      for (const a of c.input.legalActions)
        if (a.type === "start_run")
          a.payload = { ...a.payload, optionalBonusRun: true };
    resetResidentPlanPortfolioMemory();
    restoreResidentPlanPortfolioMemorySnapshot(
      c.input,
      c.runtime.residentPlanPortfolio,
    );
    const d = chooseAiAction(c.input),
      a = c.input.legalActions.find((a) => a.actionId === d.actionId)!;
    if (optional)
      expect(a.payload?.runnerAbility).toBe("decline_successful_run_extra_run");
    else expect(d.actionId).toContain("start_run.archives");
    expect(
      residentPlanPortfolioSnapshot(c.input)?.instances.find(
        (i) =>
          i.instanceId ===
          residentPlanPortfolioSnapshot(c.input)?.executorInstanceId,
      )?.moduleId,
    ).toBe("runner.convert_run_window");
  },
);
