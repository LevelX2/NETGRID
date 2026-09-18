import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-405-prepared-path-hazard-d293.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

it.each([false, true])(
  "SP-296 retains hazard avoidance and starts the contest only with its reserve funded: %s",
  (funded) => {
    const { input, runtime } = structuredClone(checkpoint) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    if (funded) input.playerView.own.credits += 2;
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const remote = evaluateRunnerRunTargets({ input }).find(
      (r) => r.actionId === "runner.start_run.remote_1",
    )!;
    expect(remote.routeQuote?.preRunPreparation).toBeUndefined();
    expect(remote.visibleTraceTagHazardUnavoidable).toBe(false);
    const decision = chooseAiAction(input);
    if (!funded) {
      expect(remote.prerunReserveQuote).toMatchObject({
        status: "blocked",
        creditGap: 2,
      });
      expect(decision.actionId).toBe("runner.gain_credit");
      expect(
        decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
      ).toBe("runner.economy");
      return;
    }
    expect(remote.prerunReserveQuote?.status).toBe("satisfied");
    expect(decision.actionId).toBe("runner.start_run.remote_1");
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      leafExecutorInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      route: {
        actionId: decision.actionId,
        stateVersion: input.playerView.stateVersion,
      },
    });
  },
);
