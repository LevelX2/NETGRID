import { expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-search-payment-d321.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  exportAiRuntimeCheckpoint,
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("restores the preempted coverage search before resolving its source and program choices", () => {
  const { input, runtime, nextInputs } = structuredClone(
    checkpointJson,
  ) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    nextInputs: AiDecisionInputWithDeckCapabilities[];
  };
  const pending =
    runtime.residentPlanPortfolio!.pendingRunnerCostPenaltySupportOrigin!;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const payment = chooseAiAction(input);
  expect(payment.actionId).toContain("pay_three_trash_source_gain_six");
  const continuation = chooseAiAction(nextInputs[0]!);
  expect(continuation.actionId).toBe(pending.originalActionId);
  expect(continuation.fallbackUsed).toBe(false);
  const portfolio = residentPlanPortfolioSnapshot(nextInputs[0]!)!;
  expect(portfolio.rootForegroundInstanceId).toBe(pending.rootPlanInstanceId);
  expect(portfolio.executorInstanceId).toBe(pending.executorInstanceId);
  expect(
    portfolio.instances.find(
      (x) => x.instanceId === pending.executorInstanceId,
    ),
  ).toMatchObject({ executionState: "executor", portfolioRole: "foreground" });
  const source = chooseAiAction(nextInputs[1]!);
  expect(source.actionId).toBe(nextInputs[1]!.legalActions[0]!.actionId);
  expect(source.selectedChoices).toMatchObject({
    selectedOptionIds: ["source_heap"],
  });
  const target = chooseAiAction(nextInputs[2]!);
  expect(target.actionId).toBe(nextInputs[2]!.legalActions[0]!.actionId);
  expect(target.selectedChoices).toMatchObject({
    selectedOptionIds: ["card_runner_onr_classic_031_rent-i-con_2"],
  });
  const executor = residentPlanPortfolioSnapshot(
    nextInputs[2]!,
  )!.instances.find((x) => x.instanceId === pending.executorInstanceId)!;
  expect(executor.moduleState).toMatchObject({
    kind: "coverage",
    gap: {
      directSearchChoiceBindings: [
        expect.objectContaining({
          targetCardInstanceId: "runner_onr_classic_031_rent-i-con_2",
          installMemorySacrificeBinding: expect.objectContaining({
            requiredMemoryToFree: 2,
            selectedCards: [
              {
                cardInstanceId: "runner_onr_v1_071_vewy-vewy-quiet_2",
                memoryCost: 1,
              },
              { cardInstanceId: "runner_onr_v1_011_cloak_1", memoryCost: 1 },
            ],
          }),
        }),
      ],
    },
  });
});

it.each(["root", "version"])(
  "rejects a changed search %s at payment completion",
  (mismatch) => {
    const capture = structuredClone(checkpointJson) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
      nextInputs: AiDecisionInputWithDeckCapabilities[];
    };
    const { input, runtime, nextInputs } = capture;
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    chooseAiAction(input);
    const afterPayment = exportAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
    );
    const pending =
      afterPayment.residentPlanPortfolio!
        .pendingRunnerCostPenaltySupportOrigin!;
    afterPayment.residentPlanPortfolio!.pendingRunnerCostPenaltySupportOrigin =
      {
        ...pending,
        ...(mismatch === "root"
          ? {
              rootPlanInstanceId:
                afterPayment.residentPlanPortfolio!.rootForegroundInstanceId!,
            }
          : { selectedAtStateVersion: pending.selectedAtStateVersion - 1 }),
      };
    restoreAiRuntimeCheckpoint(
      nextInputs[0]!,
      input.ownDeckSnapshot!.deckSnapshotId,
      afterPayment,
    );
    expect(() => chooseAiAction(nextInputs[0]!)).toThrow(
      "invalid_support_graph",
    );
  },
);
