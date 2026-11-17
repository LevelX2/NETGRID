import { readFileSync } from "node:fs";
import { withCurrentPrintedLockCompanion } from "./current-printed-lock.test-support";
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
  const historical = JSON.parse(
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
  return {
    ...historical,
    input: withCurrentPrintedLockCompanion(historical.input),
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
    "runner.activated_card_ability.c29d.c29d.activated.441",
  );
  expect(result.fallbackUsed).toBe(false);
  expect(result.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:runner.contest_remote:remote%3Ar2",
    leafExecutorInstanceId:
      "plan:runner.credit_bank:c29d",
    route: {
      actionId: action.actionId,
      stateVersion: input.playerView.stateVersion,
    },
  });
  expect(
    result.decisionDebug?.planFirstDecision?.assessmentEvidenceCodes,
  ).toContain("runner_credit_bank_bound_run_action:runner.start_run.r2");
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
        (a) => a.payload?.cardImplementationAbilityId !== 441,
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
        p.instanceId === "plan:runner.credit_bank:c29d",
    );
    expect(bank?.parentNeedId).toBeUndefined();
  },
);

it("keeps one provider when two banks can fund the same exact run", () => {
  const { input, runtime } = checkpoint();
  const first = input.playerView.own.rig!.find(
    (c) => c.instanceId === "c29d",
  )!;
  const second = input.playerView.own.rig!.find(
    (c) => c.instanceId === "c29e",
  )!;
  if (!first.counters || !first.counterDisplays)
    throw Error("Fixture bank must carry its quoted payout");
  second.counters = structuredClone(first.counters);
  second.counterDisplays = structuredClone(first.counterDisplays);
  const firstAction = input.legalActions.find((a) =>
    a.payload?.cardImplementationAbilityId === 441,
  )!;
  const secondAction = JSON.parse(
    JSON.stringify(firstAction).replaceAll(
      "c29d",
      "c29e",
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
    (p) => p.parentNeedId === "run-support:remote:r2",
  );
  expect(providers.map((p) => p.instanceId)).toEqual([
    "plan:runner.credit_bank:c29d",
  ]);
});
