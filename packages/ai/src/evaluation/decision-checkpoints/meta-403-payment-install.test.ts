import { describe, expect, it } from "vitest";
import sequence from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-payment-install-sequence.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { runnerPaymentInstallSetups } from "../../plans/runner-payment-install-planning";
import { searchFundingRoutes } from "../../plans/funding-route";
import { createRunnerCreditDemand } from "../../plans/credit-demand";
import { runnerFundingRouteCandidateIsMaterializable } from "../../plans/runner-core-plan-modules";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function fixture(index = 0) {
  return structuredClone(sequence[index]) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}
function candidates(input: AiDecisionInputWithDeckCapabilities) {
  return buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
}

describe("SP-286 prospective payment setup for the exact run", () => {
  it.each([
    [0, "gain_credit", "runner.economy"],
    [1, "install_card", "runner.economy"],
    [2, "start_run", "runner.contest_remote"],
  ] as const)(
    "rematerializes Engine state %i as %s under the same contest",
    (index, type, executor) => {
      const { input, runtime } = fixture(index);
      resetResidentPlanPortfolioMemory();
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot!.deckSnapshotId,
        runtime,
      );
      const result = chooseAiAction(input);
      const action = input.legalActions.find(
        (entry) => entry.actionId === result.actionId,
      )!;
      expect(action.type).toBe(type);
      expect(action.expiresAtStateVersion).toBe(input.playerView.stateVersion);
      expect(result.fallbackUsed).toBe(false);
      expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
        "plan:runner.contest_remote:remote%3Aremote_1",
      );
      expect(
        result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
      ).toContain(executor);
      if (index === 1)
        expect(action.source).toBe(
          "runner_onr_proteus_133_chiba-bank-account_1",
        );
      if (index === 2)
        expect(action.actionId).toBe("runner.start_run.remote_1");
    },
  );

  it.each(["hidden", "unquoted", "not_legal", "wrong_source"] as const)(
    "rejects a %s install projection",
    (mode) => {
      const { input } = fixture();
      const actions = candidates(input);
      const setup = runnerPaymentInstallSetups(input, actions)[0]!;
      expect(setup.netPaymentGain).toBe(3);
      const action = actions.find(
        (entry) => entry.actionId === setup.actionId,
      )!;
      if (mode === "hidden")
        input.playerView.own.gripOrHq.find(
          (card) => card.instanceId === setup.sourceCardInstanceId,
        )!.known = false;
      if (mode === "unquoted") action.costProfile.costKnownStatus = "unknown";
      if (mode === "not_legal")
        input.legalActions = input.legalActions.filter(
          (entry) => entry.actionId !== setup.actionId,
        );
      if (mode === "wrong_source")
        action.sourceCardInstanceId = "different-instance";
      expect(runnerPaymentInstallSetups(input, actions)).toEqual([]);
    },
  );

  it("counts the once-only payment for its run, without turning it into setup cash", () => {
    const { input } = fixture();
    const actions = candidates(input);
    const setups = runnerPaymentInstallSetups(input, actions);
    const funding = actions.filter(
      (entry) =>
        runnerFundingRouteCandidateIsMaterializable(entry) ||
        setups.some((setup) => setup.actionId === entry.actionId),
    );
    const route = (
      currentCredits: number,
      targetCredits: number,
      remainingClicks: number,
      purpose: "current_run" | "phase_reserve" = "current_run",
    ) =>
      searchFundingRoutes({
        demand: createRunnerCreditDemand({
          demandId: "bound-run",
          sourcePlanId: "plan:runner.contest_remote:remote%3Aremote_1",
          purpose,
          priority: "acute_hard_plan_blocker",
          hardness: "hard",
          deadline: "end_of_current_turn",
          currentCredits,
          targetCredits,
          acceptedCreditRestrictions: ["general", "restricted"],
        }),
        candidates: funding,
        paymentWindowSetups: [...setups, ...setups],
        remainingClicks,
        maxSteps: 5,
      }).bestRoute;
    expect(route(10, 14, 3)).toMatchObject({
      status: "covered_guaranteed",
      totalClickCost: 2,
      projectedCredits: 14,
      projectedGeneralCredits: 11,
    });
    expect(route(10, 14, 1).status).toBe("uncovered");
    expect(route(0, 3, 1).status).toBe("uncovered");
    expect(route(10, 16, 3).status).toBe("uncovered");
    expect(route(10, 14, 3, "phase_reserve").status).toBe("uncovered");
  });
});
