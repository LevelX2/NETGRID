import { expect, it } from "vitest";
import first from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p719-g35-d371-bank-original.json";
import second from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p719-g37-d305-bank-original.json";
import fundedControl from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p719-g35-d372-bank-funded-hold-control.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

// Unmodified side-safe inputs and resident runtime from P719/R1. These are
// funding-prefix proofs; unrevealed ICE never becomes guaranteed access.
it.each([
  ["G35/D371", first],
  ["G37/D305", second],
] as const)(
  "binds the ready bank to the admitted remote reserve need: %s",
  (_label, original) => {
    const cp = structuredClone(original) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    const bank = cp.input.legalActions.find((action) =>
      action.actionId.endsWith(":withdraw_credits"),
    )!;
    expect(bank).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      cp.input,
      cp.input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(cp.input);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.actionId).toBe(bank.actionId);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      selectedPlan: {
        moduleId: "runner.credit_bank",
        parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        parentNeedId: "run-support:remote:remote_1",
      },
      route: {
        actionId: bank.actionId,
        stateVersion: cp.input.playerView.stateVersion,
      },
    });
  },
);

it("preserves the funded run and holds the bank once the concrete need is gone", () => {
  const cp = structuredClone(fundedControl) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  expect(cp.input.playerView.own.clicks).toBe(3);
  expect(
    cp.input.legalActions.some((action) =>
      action.actionId.endsWith(":withdraw_credits"),
    ),
  ).toBe(true);
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(cp.input);
  expect(decision.actionId).toBe("runner.start_run.remote_1");
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.contest_remote");
});
