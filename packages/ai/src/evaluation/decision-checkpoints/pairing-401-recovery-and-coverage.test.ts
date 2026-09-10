import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { CARD_DEFINITIONS_BY_ID } from "../../../../engine/src/card-definitions";
import { deterministicOnPlayResourcePayload } from "../../../../engine/src/ability-engine/card-implementation-runtime-shared";
import recoveryJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-401-heap-recovery-d70.json";
import recoveryPaymentJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-401-recovery-payment-d195.json";
import recoveryBeforePaymentJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-401-recovery-before-payment-d194.json";
import recoveryChoiceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-401-recovery-choice-d196.json";
import installJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-401-coverage-install-d308.json";
import paymentJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-401-coverage-payment-d309.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  exportAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type Capture = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};
function restore(json: unknown) {
  const capture = structuredClone(json) as Capture;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    capture.input,
    capture.input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    capture.input,
    capture.runtime.residentPlanPortfolio,
  );
  return capture.input;
}

describe("pairing 401 source-bound recovery and coverage", () => {
  it("rejects a search choice whose origin skipped the intervening payment version", () => {
    const input = restore(recoveryChoiceJson);
    expect(() => chooseAiAction(input as AiDecisionInput)).toThrow(
      "window_origin_missing",
    );
  });
  it("preserves the selected recovery target across payment and binds its exact choice version", () => {
    // This checkpoint has six cards before playing Pawnshop. Give the
    // continuation scenario room to retain its target: the recorded five-card
    // limit now correctly rejects this recovery before any payment is opened.
    const withRetentionCapacity = (json: unknown) => {
      const capture = structuredClone(json) as Capture;
      capture.input.playerView.own.maxHandSize = 6;
      return capture;
    };
    const before = restore(withRetentionCapacity(recoveryBeforePaymentJson));
    const beforeDecision = chooseAiAction(before as AiDecisionInput);
    const beforeRuntime = exportAiRuntimeCheckpoint(
      before as AiDecisionInput,
      before.ownDeckSnapshot!.deckSnapshotId,
    );
    const input = restore({
      ...withRetentionCapacity(recoveryPaymentJson),
      runtime: beforeRuntime,
    });
    const decision = chooseAiAction(input as AiDecisionInput);
    expect(decision.actionId).toBe(beforeDecision.actionId);
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    const executor = portfolio.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    )!;
    expect(decision).toMatchObject({
      actionId:
        "runner.play_event.runner_onr_v1_089_gideons-pawnshop_1.runner_onr_v1_089_gideons-pawnshop_1.onr_v1_089_gideons-pawnshop:abilities_on_play_search_trash_to_grip",
      fallbackUsed: false,
    });
    expect(executor.moduleState).toMatchObject({
      signal: {
        recoverySearchCommitment: {
          plannedAtStateVersion: 193,
          selectedAtStateVersion: 193,
          selectedActionId: decision.actionId,
          engineContinuationAtStateVersion: 194,
          targetCardInstanceId: "runner_onr_classic_037_finders-keepers_1",
        },
      },
    });
    const runtime = exportAiRuntimeCheckpoint(
      input as AiDecisionInput,
      input.ownDeckSnapshot!.deckSnapshotId,
    );
    const choiceInput = restore({
      ...withRetentionCapacity(recoveryChoiceJson),
      runtime,
    });
    const choice = chooseAiAction(choiceInput as AiDecisionInput);
    expect(choice).toMatchObject({
      actionId: "runner.resolve_choice",
      fallbackUsed: false,
      selectedChoices: {
        choiceId: "p3_37_search_trash_to_grip_195",
        selectedOptionIds: ["card_runner_onr_classic_037_finders-keepers_1"],
      },
    });
    expect(residentPlanPortfolioSnapshot(choiceInput)?.executorInstanceId).toBe(
      executor.instanceId,
    );
  });
  it("does not open the recorded recovery payment when its target would be discarded", () => {
    const input = restore(recoveryBeforePaymentJson);
    expect(input.playerView.own.gripOrHq).toHaveLength(6);
    expect(input.playerView.own.maxHandSize).toBe(5);
    expect(chooseAiAction(input as AiDecisionInput)).toMatchObject({
      actionId: "runner.gain_credit",
      fallbackUsed: false,
    });
  });
  it("binds a useful heap target before the recovery event enters the heap", () => {
    const input = restore(recoveryJson);
    // Reproject only the canonical Engine facts missing from this recorded action.
    for (const action of input.legalActions) {
      if (action.source !== "runner_onr_v1_089_gideons-pawnshop_1") continue;
      Object.assign(
        action.payload!,
        deterministicOnPlayResourcePayload(
          CARD_DEFINITIONS_BY_ID["onr_v1_089_gideons-pawnshop"]!,
          "runner",
        ),
      );
    }
    const decision = chooseAiAction(input as AiDecisionInput);
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    const executor = portfolio.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    )!;
    expect(decision).toMatchObject({
      actionId:
        "runner.play_event.runner_onr_v1_089_gideons-pawnshop_1.runner_onr_v1_089_gideons-pawnshop_1.onr_v1_089_gideons-pawnshop:abilities_on_play_search_trash_to_grip",
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
    });
    expect(executor.moduleState).toMatchObject({
      signal: {
        recoverySearchCommitment: {
          selectedActionId: decision.actionId,
          selectedAtStateVersion: 69,
          sourceCardInstanceId: "runner_onr_v1_089_gideons-pawnshop_1",
          targetCardInstanceId: "runner_onr_v1_110_sneak-preview_2",
          targetPurpose: "generic_heap_recovery",
        },
      },
    });
  });

  it("carries the exact setup-coverage installation through its payment window", () => {
    const input = restore(installJson);
    chooseAiAction(input as AiDecisionInput);
    const installActionId =
      "runner.install_card.runner_onr_classic_031_rent-i-con_3.runner_onr_classic_031_rent-i-con_3";
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    const executorId =
      "plan:runner.rig_and_coverage:coverage%3Abreaker_code_gate";
    const executor = portfolio.instances.find(
      (instance) => instance.instanceId === executorId,
    )!;
    expect(executor.moduleState).toMatchObject({
      kind: "coverage",
      phase: "install_answer",
      gap: { installActionIds: expect.arrayContaining([installActionId]) },
    });
    const paymentCapture = structuredClone(paymentJson) as Capture;
    // Keep the observed selected origin, supplying its gap from the production
    // producer above; restarting D308 can instead select the Shell Traders plan.
    paymentCapture.runtime.residentPlanPortfolio!.instances.find(
      (instance) => instance.instanceId === executorId,
    )!.moduleState = structuredClone(executor.moduleState);
    const payment = restore(paymentCapture);
    const continuation = chooseAiAction(payment as AiDecisionInput);
    expect(continuation.fallbackUsed).toBe(false);
    const selected = payment.legalActions.find(
      (action) => action.actionId === continuation.actionId,
    )!;
    expect(selected.source).toBe("runner_onr_proteus_133_chiba-bank-account_1");
    expect(selected.payload).toMatchObject({
      costPenaltySupportWindowId: "runner_cost_penalty_support.308",
      costPenaltySupportOriginalActionId: installActionId,
    });
    const continued = residentPlanPortfolioSnapshot(payment)!;
    expect(
      continued.instances.find(
        (instance) => instance.instanceId === executor.instanceId,
      )?.moduleState,
    ).toMatchObject({
      kind: "coverage",
      gap: { installActionIds: expect.arrayContaining([installActionId]) },
    });
  });

  it("fails closed when the persisted coverage origin has no install binding", () => {
    const payment = restore(paymentJson);
    expect(() => chooseAiAction(payment as AiDecisionInput)).toThrow(
      "invalid_support_graph",
    );
  });
});
