import { expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-information-damage-d89.json";
import paymentJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-damage-payment-d278.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { runnerCurrentEncounterRequiresDamagePreservingBreak } from "../../runner/run-window/run-window-assessment";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("continues the selected pump in its payment window without reassessing encounter damage", () => {
  const { input, runtime } = structuredClone(paymentJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const pending =
    runtime.residentPlanPortfolio!.pendingRunnerCostPenaltySupportOrigin!;
  expect(input.legalActions.map((a) => a.type)).toEqual([
    "activated_card_ability",
    "pump_breaker",
  ]);
  const pump = input.legalActions.find((a) => a.type === "pump_breaker")!;
  expect(pump.payload?.runnerCostPenaltySupportContinuation).toBe(true);
  expect(pump.actionId).toBe(pending.originalActionId);
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(pump.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: pending.rootPlanInstanceId,
    leafExecutorInstanceId: pending.executorInstanceId,
  });
});

it("still fails closed when a real encounter omits its remaining-subroutine quote", () => {
  const input = structuredClone(
    checkpointJson.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const continuation = input.legalActions.find(
    (a) => a.type === "continue_run",
  )!;
  delete continuation.payload!.encounterSubroutineIds;
  expect(() =>
    runnerCurrentEncounterRequiresDamagePreservingBreak(input, undefined),
  ).toThrow("missing_action_semantics");
});

it("preserves a payable damage response after an information boundary rejects full access", () => {
  const { input, runtime } = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  expect(input.playerView.own.credits).toBe(7);
  expect(input.playerView.own.gripOrHq).toHaveLength(3);
  expect(
    input.playerView.run?.encounteredIce?.effectiveRunQuote?.subroutines
      .filter((s) => s.type === "do_damage")
      .map((s) => s.amount),
  ).toEqual([2, 2]);
  const pump = input.legalActions.find(
    (action) => action.type === "pump_breaker",
  )!;
  expect(pump.costs).toEqual([{ credits: 1 }]);
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(pump.actionId);
  expect(decision.fallbackUsed).toBe(false);
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const root = portfolio.instances.find(
    (p) => p.instanceId === portfolio.rootForegroundInstanceId,
  )!;
  expect(root.moduleId).toBe("runner.pressure_central");
  const selected = decision.decisionDebug!.planFirstDecision!;
  expect(selected.selectedPlan).toMatchObject({
    moduleId: "runner.convert_run_window",
    parentInstanceId: root.instanceId,
  });
  expect(selected.selectedStep).toMatchObject({
    planInstanceId: selected.selectedPlan!.instanceId,
  });
});

it.each([2, 3])(
  "buys the remaining path only when the post-break budget pays both ETRs and the inner Filter: %s",
  (credits) => {
    const { input, runtime } = structuredClone(checkpointJson) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    // A post-payment companion must advance strength, remaining subroutines,
    // spendable pools and offered break actions together.
    input.playerView.own.credits = credits;
    const breaker = input.playerView.own.rig!.find(
      (card) => card.definitionId === "onr_classic_031_rent-i-con",
    )!;
    breaker.strength = 6;
    const pool = input.playerView.own.rig!.find(
      (card) => card.definitionId === "onr_v1_035_invisibility",
    )!;
    pool.counters!.bit = 0;
    pool.counterDisplays!.forEach((display) => {
      display.amount = 0;
    });
    const pump = input.legalActions.find(
      (action) => action.type === "pump_breaker",
    )!;
    for (const subroutineIndex of [2, 3]) {
      input.legalActions.push({
        ...structuredClone(pump),
        type: "break_subroutine",
        actionId: `post-payment-break-${subroutineIndex}`,
        abilityRef: {
          sourceCardInstanceId: breaker.instanceId,
          sourceAbilityId:
            "onr_classic_031_rent-i-con:break_any_subroutine_and_trash_after_run",
        },
        effectRef:
          "effect.onr_classic_031_rent-i-con:break_any_subroutine_and_trash_after_run",
        payload: {
          breakerId: breaker.instanceId,
          iceId: input.playerView.run!.encounteredIce!.instanceId,
          subroutineIndex,
          cardId: breaker.instanceId,
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityId:
            "onr_classic_031_rent-i-con:break_any_subroutine_and_trash_after_run",
          cardImplementationAbilityKey:
            "break_any_subroutine_and_trash_after_run",
        },
      });
    }
    const continuation = input.legalActions.find(
      (a) => a.type === "continue_run",
    )!;
    Object.assign(continuation.payload!, {
      encounterSubroutineIds:
        "printed_subroutines_end_the_run,printed_subroutines_end_the_run_a",
      unbrokenSubroutineCount: 2,
    });
    continuation.actionId = `runner.continue_run.${continuation.payload!.encounterSubroutineIds}`;
    input.playerView.legalActions = structuredClone(input.legalActions);
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    if (credits === 2) expect(decision.actionId).toBe(continuation.actionId);
    else
      expect(
        input.legalActions.find(
          (action) => action.actionId === decision.actionId,
        )?.type,
      ).toBe("break_subroutine");
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.evidence).toContain(
      "plan_action_assessment_evidence:runner_information_boundary_known_path_cost:3",
    );
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      selectedPlan: { moduleId: "runner.convert_run_window" },
      route: {
        actionId: decision.actionId,
        stateVersion: input.playerView.stateVersion,
      },
    });
  },
);
