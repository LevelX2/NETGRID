import { expect, it } from "vitest";
import heapJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-buried-heap-answer-d375.json";
import handJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-prerun-hand-buffer-d222.json";
import temporaryHandJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-temporary-hand-buffer-d288.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { runnerCoverageHeapPreparation } from "../../runner/rig-coverage/coverage-heap-preparation";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { runnerDefenseHandBufferFacts } from "../../runner/defense-recovery/defense-signals";

function replay(json: unknown) {
  const capture = structuredClone(json) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    capture.input,
    capture.input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  const decision = chooseAiAction(capture.input);
  const portfolio = residentPlanPortfolioSnapshot(capture.input)!;
  return {
    capture,
    decision,
    portfolio,
    action: capture.input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    ),
  };
}

it("prepares the exposed heap top for an affordable same-turn buried coverage answer", () => {
  const { capture, decision, portfolio, action } = replay(heapJson);
  expect(action?.payload?.targetCardId).toBe(
    "runner_onr_classic_042_panzer-run_1",
  );
  expect(action?.payload?.cardImplementationEffectKind).toBe(
    "move_top_trash_to_grip",
  );
  expect(decision.fallbackUsed).toBe(false);
  const executor = portfolio.instances.find(
    (p) => p.instanceId === portfolio.executorInstanceId,
  )!;
  expect(executor.moduleId).toBe("runner.rig_and_coverage");
  expect(executor.parentInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_1",
  );
  expect(capture.input.playerView.own.clicks).toBe(4);
});

it("builds the quoted missing hand buffer instead of credits that cannot close it", () => {
  const { decision, portfolio } = replay(handJson);
  expect(decision.actionId).toBe("runner.draw_card");
  expect(decision.fallbackUsed).toBe(false);
  expect(
    portfolio.instances.find(
      (p) => p.instanceId === portfolio.executorInstanceId,
    )?.moduleId,
  ).toBe("runner.defense_and_recovery");
});

it("temporarily exceeds the cleanup limit to finish a funded contest buffer", () => {
  const { capture, decision, portfolio } = replay(temporaryHandJson);
  expect(capture.input.playerView.own.maxHandSize).toBe(2);
  expect(capture.input.playerView.own.gripOrHq).toHaveLength(3);
  expect(decision.actionId).toBe("runner.draw_card");
  expect(
    portfolio.instances.find(
      (p) => p.instanceId === portfolio.executorInstanceId,
    )?.moduleId,
  ).toBe("runner.defense_and_recovery");
});

it.each([
  "current",
  "few_clicks",
  "no_cash",
  "no_mu",
  "stale_target",
  "stale_action",
  "unknown_ice",
] as const)("binds only a complete heap preparation: %s", (variant) => {
  const input = structuredClone(
    heapJson.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const evaluation = evaluateRunnerRunTargets({ input }).find(
    (t) => t.targetServerId === "remote_1",
  )!;
  const recovery = input.legalActions.find(
    (a) => a.payload?.cardImplementationEffectKind === "move_top_trash_to_grip",
  )!;
  if (variant === "few_clicks") input.playerView.own.clicks = 3;
  if (variant === "no_cash") input.playerView.own.credits = 4;
  if (variant === "no_mu")
    input.playerView.own.memoryUsed = input.playerView.own.memoryLimit!;
  if (variant === "stale_target") recovery.payload!.targetCardId = "old_top";
  if (variant === "stale_action") recovery.expiresAtStateVersion--;
  if (variant === "unknown_ice")
    input.playerView.servers.find((s) => s.id === "remote_1")!.ice[0]!.known =
      false;
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
  });
  const quote = runnerCoverageHeapPreparation(
    input,
    candidates,
    evaluation,
    "breaker_wall",
  );
  if (variant !== "current") expect(quote).toBeUndefined();
  else
    expect(quote).toMatchObject({
      actionId: recovery.actionId,
      currentTopCardInstanceId: "runner_onr_classic_042_panzer-run_1",
      targetCardInstanceId: "runner_onr_classic_031_rent-i-con_1",
      recoveryCount: 2,
      requiredClicks: 4,
      upfrontCredits: 5,
      projectedKnownPathCost: 4,
    });
});

it.each([
  "current",
  "no_followup_click",
  "empty_stack",
  "credit_gap",
  "no_payoff",
  "low_max_hand",
] as const)(
  "binds a temporary hand reserve only to a reachable same-turn payoff: %s",
  (variant) => {
    const input = structuredClone(
      handJson.input,
    ) as unknown as AiDecisionInputWithDeckCapabilities;
    const evaluation = evaluateRunnerRunTargets({ input }).find(
      (t) => t.targetServerId === "remote_1",
    )!;
    evaluation.prerunReserveQuote = {
      ...evaluation.prerunReserveQuote!,
      status: "blocked",
      requiredHandBuffer: 4,
      handBufferGap: 1,
      creditGap: 0,
    };
    if (variant === "no_followup_click") input.playerView.own.clicks = 1;
    if (variant === "empty_stack") input.playerView.own.stackOrRdCount = 0;
    if (variant === "credit_gap") evaluation.prerunReserveQuote.creditGap = 1;
    if (variant === "no_payoff") evaluation.accessPayoff = "known_low_value";
    if (variant === "low_max_hand") input.playerView.own.maxHandSize = 2;
    const facts = runnerDefenseHandBufferFacts(input, [evaluation]);
    expect(facts.riskAdjustedHandBuffer.sameTurnRunPreparation).toBe(
      variant === "current" || variant === "low_max_hand",
    );
    expect(facts.riskAdjustedHandBuffer.minimumHandBuffer).toBe(
      variant === "current" || variant === "low_max_hand" ? 4 : 3,
    );
  },
);
