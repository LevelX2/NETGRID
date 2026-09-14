import { afterEach, expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-r5-g39-d202.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  activeRunRootPlan,
  reassessActiveInformationRunParent,
} from "../../runner/run-window/run-window-origin";
import { runnerRunRiskContractReassessment } from "../../runner/run-window/run-window-assessment";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function fixture() {
  const cp = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  return { cp, input: { ...cp.input, ...buildAiDecisionInputDto(cp.input) } };
}

afterEach(resetResidentPlanPortfolioMemory);

it("uses the current risk reserve after the Corp spends its remaining rez credits", () => {
  const { cp, input } = fixture();
  const root = activeRunRootPlan(cp.runtime.residentPlanPortfolio!, input)!;
  expect(root.runRiskContract?.reserveQuote.requiredCredits).toBe(4);
  expect(input.playerView.opponent.credits).toBe(0);
  expect(
    runnerRunRiskContractReassessment(input, root)?.currentReserveQuote,
  ).toMatchObject({ requiredCredits: 0, status: "not_required" });
  const rebound = reassessActiveInformationRunParent(input, root)!;
  expect(rebound.informationBoundaryReassessment).toMatchObject({
    knownPathCost: 5,
    unknownIceCount: 1,
    encounterBudget: 5,
  });
  expect(rebound.instanceId).toBe(root.instanceId);
  expect(rebound.runRiskContract).toEqual(root.runRiskContract);
});

it("pumps the affordable current Gate under the original R&D root and current legal route", () => {
  const { cp, input } = fixture();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const result = chooseAiAction(input);
  const selected = input.legalActions.find(
    (a) => a.actionId === result.actionId,
  )!;
  expect(selected.type).toBe("pump_breaker");
  expect(selected.expiresAtStateVersion).toBe(input.playerView.stateVersion);
  expect(result.fallbackUsed).toBe(false);
  expect(result.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:runner.pressure_central:central%3Ard",
    route: { actionId: selected.actionId },
  });
  expect(
    result.evidence.some((e) =>
      e.startsWith("plan_first_executor:plan:runner.convert_run_window:"),
    ),
  ).toBe(true);
});

it.each(["credits", "visible_rez_support"])(
  "keeps an actual remaining rez risk: %s",
  (exposure) => {
    const { cp, input } = fixture();
    if (exposure === "credits") input.playerView.opponent.credits = 2;
    else {
      const rd = input.playerView.servers.find((s) => s.id === "rd")!;
      rd.statuses = [
        ...(rd.statuses ?? []),
        { kind: "during_run_ice_rez_support" } as NonNullable<
          typeof rd.statuses
        >[number],
      ];
    }
    const root = activeRunRootPlan(cp.runtime.residentPlanPortfolio!, input)!;
    const quote = runnerRunRiskContractReassessment(
      input,
      root,
    )?.currentReserveQuote;
    expect(quote?.requiredCredits).toBeGreaterThan(1);
    expect(
      reassessActiveInformationRunParent(input, root)
        ?.informationBoundaryReassessment?.encounterBudget,
    ).toBe(2);
  },
);
