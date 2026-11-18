import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { buildRunnerEconomyPosture } from "../../runner-run-target-evaluation";
import { runnerRunWindowActionAssessments } from "../../runner/run-window/run-window-assessment";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { nextEncounterDamageMarkerPayment } from "../../runner/run-window/run-window-encounter-payment";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function native() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "./fixtures/deep666-d109-pump-payment-continuation.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).checkpoint;
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input: AiDecisionInputWithDeckCapabilities = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    cp.runtime.residentPlanPortfolio,
  );
  return input;
}

it("finishes the already bound native pump payment under its original run owner", () => {
  const input = native();
  const continuation = input.legalActions.find(
    (a) => a.payload?.runnerCostPenaltySupportContinuation === true,
  )!;
  const before = JSON.stringify({
    view: input.playerView,
    legal: input.legalActions,
  });
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(continuation.actionId);
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toBe(
    "pa7nez1ioecg7mf06q1uwqq57o",
  );
  expect(plan.leafExecutorInstanceId).toBe(
    "p9o0y4udd66inu4vd7pkvl1s7q",
  );
  expect(plan.lane).toBe("engine_window");
  expect(plan.engineWindowAction).toMatchObject({
    actionId: continuation.actionId,
    reasonCode: "plan_bound_runner_cost_penalty_support_continuation",
  });
  expect(plan.executionOrigin).toMatchObject({
    rootPlanInstanceId: plan.rootPlanInstanceId,
    leafPlanInstanceId: plan.leafExecutorInstanceId,
    windowId: "108",
    stateVersion: 108,
  });
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(
    JSON.stringify({ view: input.playerView, legal: input.legalActions }),
  ).toBe(before);
});

it("does not require an encounter-resolution offer inside the marked payment window", () => {
  const input = native();
  const action = input.legalActions.find((a) => a.type === "pump_breaker")!;
  expect(nextEncounterDamageMarkerPayment(input, action)).toBeUndefined();
});

it("still fails closed when an ordinary encounter action lacks its required scope", () => {
  const input = native();
  const action = input.legalActions.find((a) => a.type === "pump_breaker")!;
  delete action.payload!.runnerCostPenaltySupportContinuation;
  expect(() => nextEncounterDamageMarkerPayment(input, action)).toThrow(
    PlanResolutionFailure,
  );
});

it("prices the retained information plan within the existing pump payment window", () => {
  const input = native();
  const pump = input.legalActions.find(
    (action) => action.payload?.runnerCostPenaltySupportContinuation === true,
  )!;
  expect(
    input.legalActions.some((action) => action.type === "continue_run"),
  ).toBe(false);
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const ice = input.playerView.run!.encounteredIce!;
  const credits = input.playerView.own.credits;
  const assessments = runnerRunWindowActionAssessments(
    input,
    candidates,
    [],
    buildRunnerEconomyPosture({ input }),
    { runnerEncounterActionExclusion: () => undefined },
    {
      purpose: "information",
      encounterCreditSpendLimit: 6,
      informationBoundaryReassessment: {
        startedAsInformation: true,
        previousPurpose: "information",
        nextPurpose: "information",
        decision: "retain_information",
        boundaryKind: "visible_ice_path_changed",
        observedAtStateVersion: input.playerView.stateVersion,
        observedIceInstanceId: ice.instanceId,
        knownPathCost: 0,
        knownPathReachable: true,
        unknownIceCount: 0,
        runnerCreditsBeforeQuote: credits,
        creditsAfterKnownPath: credits,
        reservedCredits: 0,
        fundingGap: 0,
        unavoidableHazardCount: 0,
        remainingClicks: input.playerView.own.clicks,
        encounterBudget: 6,
        evidenceCodes: ["retained_information_parent"],
      },
    },
    undefined,
  );

  expect(assessments[pump.actionId]?.admissible).toBe(true);
});
