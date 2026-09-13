import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { RunnerRemoteContestSignal } from "../../plans/runner-tactical-plan-contracts";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const checkpoint = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r22-control-g3-d549.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};
const parentId = "plan:runner.contest_remote:remote%3Aremote_1";
const bankId = "plan:runner.credit_bank:runner_onr_v1_154_broker_2";
const cashoutId =
  "runner.activated_card_ability.runner_onr_v1_154_broker_2.runner_onr_v1_154_broker_2.activated.onr_v1_154_broker:withdraw_credits";
afterEach(resetResidentPlanPortfolioMemory);

it("preserves exact Remote funding through the generic matchpoint focus", () => {
  const { input, runtime } = structuredClone(checkpoint);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision).toMatchObject({ actionId: cashoutId, fallbackUsed: false });
  expect(
    input.legalActions.find((a) => a.actionId === decision.actionId)
      ?.expiresAtStateVersion,
  ).toBe(input.playerView.stateVersion);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: parentId,
    leafExecutorInstanceId: bankId,
    selectedStep: {
      planInstanceId: bankId,
      stepId: `${bankId}:cash_out`,
      parentInstanceId: parentId,
      needId: "run-support:remote:remote_1",
    },
    route: { actionId: cashoutId, stateVersion: input.playerView.stateVersion },
  });
  const parent = residentPlanPortfolioSnapshot(input)!.instances.find(
    (p) => p.instanceId === parentId,
  )!;
  const signal = (parent.moduleState as { signal: RunnerRemoteContestSignal })
    .signal;
  expect(signal).toMatchObject({
    terminalPatternThreat: true,
    reachable: false,
    supportNeedId: "run-support:remote:remote_1",
  });
  expect(signal.runActionAssessments["runner.start_run.remote_1"].verdict).toBe(
    "explicitly_nonproductive",
  );
});

it.each(["insufficient_payout", "no_cashout", "no_conversion_click"] as const)(
  "does not turn general matchpoint focus into a funded route: %s",
  (boundary) => {
    const { input, runtime } = structuredClone(checkpoint);
    if (boundary === "insufficient_payout") input.playerView.own.credits = 12;
    if (boundary === "no_cashout")
      input.legalActions = input.legalActions.filter(
        (a) => a.actionId !== cashoutId,
      );
    if (boundary === "no_conversion_click") input.playerView.own.clicks = 1;
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.actionId).not.toBe("runner.start_run.remote_1");
    const provider = residentPlanPortfolioSnapshot(input)!.instances.find(
      (p) => p.instanceId === bankId,
    );
    expect(provider?.parentNeedId).toBeUndefined();
  },
);
