import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function checkpoint() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r17-debt-last-ice.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}

it("binds the available bank payout to the complete urgent path before spending its conversion clicks", () => {
  const { input, runtime } = checkpoint();
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const result = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === result.actionId,
  )!;
  expect(action.actionId).toBe(
    "runner.activated_card_ability.runner_onr_v1_154_broker_1.runner_onr_v1_154_broker_1.activated.onr_v1_154_broker:withdraw_credits",
  );
  expect(result.fallbackUsed).toBe(false);
  expect(result.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_2",
    leafExecutorInstanceId:
      "plan:runner.credit_bank:runner_onr_v1_154_broker_1",
    route: {
      actionId: action.actionId,
      stateVersion: input.playerView.stateVersion,
    },
  });
  expect(
    result.decisionDebug?.planFirstDecision?.assessmentEvidenceCodes,
  ).toContain("runner_credit_bank_bound_run_action:runner.start_run.remote_2");
});

it.each([
  "insufficient_budget",
  "no_conversion_click",
  "cashout_not_offered",
] as const)(
  "does not bind bank support without its complete proof: %s",
  (boundary) => {
    const { input, runtime } = checkpoint();
    if (boundary === "insufficient_budget") input.playerView.own.credits = 23;
    if (boundary === "no_conversion_click") input.playerView.own.clicks = 1;
    if (boundary === "cashout_not_offered")
      input.legalActions = input.legalActions.filter(
        (a) => !a.actionId.includes("withdraw_credits"),
      );
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const result = chooseAiAction(input);
    expect(result.fallbackUsed).toBe(false);
    const bank = residentPlanPortfolioSnapshot(input)?.instances.find(
      (p) =>
        p.instanceId === "plan:runner.credit_bank:runner_onr_v1_154_broker_1",
    );
    expect(bank?.parentNeedId).toBeUndefined();
  },
);

it("keeps one provider when two banks can fund the same exact run", () => {
  const { input, runtime } = checkpoint();
  const first = input.playerView.own.rig!.find(
    (c) => c.instanceId === "runner_onr_v1_154_broker_1",
  )!;
  const second = input.playerView.own.rig!.find(
    (c) => c.instanceId === "runner_onr_v1_154_broker_2",
  )!;
  if (!first.counters || !first.counterDisplays)
    throw Error("Fixture bank must carry its quoted payout");
  second.counters = structuredClone(first.counters);
  second.counterDisplays = structuredClone(first.counterDisplays);
  const firstAction = input.legalActions.find((a) =>
    a.actionId.includes("withdraw_credits"),
  )!;
  const secondAction = JSON.parse(
    JSON.stringify(firstAction).replaceAll(
      "runner_onr_v1_154_broker_1",
      "runner_onr_v1_154_broker_2",
    ),
  );
  input.legalActions.push(secondAction);
  const bankTool = input.ownDeckCapabilities!.runner!.economyBankTools.find(
    (t) => t.sourceCardInstanceId === second.instanceId,
  )!;
  Object.assign(bankTool, {
    currentBankAmount: 6,
    currentBankAmounts: [6],
    portfolioStoredAmount: 6,
    estimatedPayout: 6,
    cashOutActionLegal: true,
    cashOutActionIds: [secondAction.actionId],
  });
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const result = chooseAiAction(input);
  expect(result.actionId).toBe(firstAction.actionId);
  const providers = residentPlanPortfolioSnapshot(input)!.instances.filter(
    (p) => p.parentNeedId === "run-support:remote:remote_2",
  );
  expect(providers.map((p) => p.instanceId)).toEqual([
    "plan:runner.credit_bank:runner_onr_v1_154_broker_1",
  ]);
});
