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
  "SP-296 retains hazard avoidance and selects the remote contest only with its reserve funded: %s",
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
      expect(decision.actionId).toBe(
        "runner.play_event.runner_onr_proteus_101_all-hands_1.hq.runner_onr_proteus_101_all-hands_1.onr_proteus_101_all-hands:on_play_hq_run_access_four_prohibit_noisy_icebreakers",
      );
      const central = evaluateRunnerRunTargets({ input }).find(
        (target) => target.actionId === decision.actionId,
      )!;
      expect(central.routeQuote).toMatchObject({
        reachability: "guaranteed_access",
        fundingGap: 0,
        unknownIceCount: 0,
      });
      expect(central.visibleIceHazardPenalty).toBe(0);
      expect(central.creditsAfterRun).toBe(0);
      expect(decision.fallbackUsed).toBe(false);
      expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
        leafExecutorInstanceId: "plan:runner.pressure_central:central%3Ahq",
        selectedPlan: { moduleId: "runner.pressure_central" },
        route: {
          actionId: decision.actionId,
          stateVersion: input.playerView.stateVersion,
        },
      });
      expect(
        input.legalActions.some(
          (action) =>
            action.actionId === decision.actionId &&
            action.expiresAtStateVersion === input.playerView.stateVersion,
        ),
      ).toBe(true);
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
