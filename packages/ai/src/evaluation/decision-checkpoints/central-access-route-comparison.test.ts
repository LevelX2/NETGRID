import { describe, expect, it } from "vitest";

import directRdReplay from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5a983612-d60-central-access-route-replay.json";
import cheaperHqReplay from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5a983612-d77-central-access-route-replay.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { compareRunnerCentralAccessRoutes } from "../../run-analysis/runner-central-access-comparison";
import { buildRunnerEconomyPosture } from "../../runner-economy-posture";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function restoreCapturedRunnerInput(fixture: unknown) {
  const { input, runtime, stateVersion } = structuredClone(fixture) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    stateVersion: number;
  };
  const deckSnapshotId = input.ownDeckSnapshot?.deckSnapshotId;
  if (!deckSnapshotId) throw new Error("Expected the captured Runner deck.");
  expect(input.playerView.stateVersion).toBe(stateVersion);
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(input, deckSnapshotId, runtime);
  const projected = buildAiDecisionInputDto(input);
  input.playerView.publicEvents = projected.playerView.publicEvents;
  input.eventTail = projected.eventTail;
  return input;
}

function replayCentralRoute(
  input: AiDecisionInputWithDeckCapabilities,
  expectedActionId: string,
  accessServerId: "hq" | "rd",
) {
  const decision = chooseAiAction(input);
  const trace = decision.decisionDebug?.planFirstDecision;
  const planId = "plan:runner.pressure_central:central%3A" + accessServerId;
  const alternatives = evaluateRunnerRunTargets({
    input,
    ...(input.ownDeckCapabilities
      ? { deckCapabilities: input.ownDeckCapabilities }
      : {}),
  }).filter((target) => target.accessServerId === accessServerId);

  expect(
    decision.actionId,
    JSON.stringify(
      alternatives.map((target) => ({
        id: target.actionId,
        entryServer: target.targetServerId,
        reach: target.routeQuote?.reachability,
        credits: target.creditsAfterRun,
        funding: target.fundingNeed?.reason,
        recommendation: target.recommendation,
      })),
    ),
  ).toBe(expectedActionId);
  expect(
    input.legalActions.find((action) => action.actionId === expectedActionId),
  ).toMatchObject({ expiresAtStateVersion: input.playerView.stateVersion });
  expect(decision.fallbackUsed).toBe(false);
  expect(trace).toMatchObject({
    rootPlanInstanceId: planId,
    leafExecutorInstanceId: planId,
    route: { actionId: expectedActionId },
  });
  const excluded =
    trace?.dispositions.filter(
      ({ evidenceCode }) =>
        evidenceCode ===
        "runner_central_same_access_preferred:" + expectedActionId,
    ) ?? [];
  return { alternatives, excluded };
}

describe("Runner central routes with the same access destination", () => {
  it("takes the fully quoted R&D run at decision 60", () => {
    const input = restoreCapturedRunnerInput(directRdReplay);
    const direct = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    if (!direct) throw new Error("Expected the captured R&D action.");
    const { alternatives, excluded } = replayCentralRoute(
      input,
      direct.actionId,
      "rd",
    );
    expect(
      alternatives.find((route) => route.actionId === direct.actionId),
    ).toMatchObject({
      pathCost: 2,
      creditsAfterRun: 9,
      routeQuote: { reachability: "guaranteed_access", fundingGap: 0 },
      fundingNeed: { reason: "none" },
    });
    const redirect = alternatives.find(
      (route) => route.targetServerId === "hq",
    );
    expect(redirect).toMatchObject({
      accessServerId: "rd",
      routeQuote: { reachability: "conditional_access" },
    });
    expect(excluded.map((entry) => entry.actionId)).toEqual([
      redirect?.actionId,
    ]);
  });

  it("takes the lower-cost HQ bypass at decision 77", () => {
    const input = restoreCapturedRunnerInput(cheaperHqReplay);
    const bypass = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        action.payload?.bypassFirstIce === true &&
        action.payload?.serverId === "hq",
    );
    if (!bypass) throw new Error("Expected the captured HQ bypass.");
    const { alternatives, excluded } = replayCentralRoute(
      input,
      bypass.actionId,
      "hq",
    );
    expect(
      alternatives.find((route) => route.actionId === bypass.actionId),
    ).toMatchObject({
      pathCost: 1,
      creditsAfterRun: 10,
      routeQuote: { reachability: "guaranteed_access", fundingGap: 0 },
    });
    const expensiveRuns = alternatives.filter(
      (route) =>
        route.creditsAfterRun === 1 &&
        route.routeQuote?.reachability === "guaranteed_access",
    );
    expect(expensiveRuns).toHaveLength(2);
    expect(excluded.map((entry) => entry.actionId).sort()).toEqual(
      expensiveRuns.map((route) => route.actionId).sort(),
    );
  });

  it("retains the ordinary reserve when the redirect to the same access is absent", () => {
    const input = restoreCapturedRunnerInput(directRdReplay);
    const targets = evaluateRunnerRunTargets({ input });
    const redirect = targets.find(
      (target) =>
        target.targetServerId === "hq" && target.accessServerId === "rd",
    );
    if (!redirect) throw new Error("Expected the captured redirect.");
    input.legalActions = input.legalActions.filter(
      (action) => action.actionId !== redirect.actionId,
    );
    const rd = evaluateRunnerRunTargets({ input }).find(
      (target) => target.actionId === "runner.start_run.rd",
    );
    expect(rd).toMatchObject({
      routeQuote: { reachability: "guaranteed_access", fundingGap: 0 },
      fundingNeed: { reason: "post_run_floor_gap" },
      recommendation: "gain_credits_first",
    });
  });

  it("keeps a genuine extra access outside a single-access comparison", () => {
    const input = restoreCapturedRunnerInput(cheaperHqReplay);
    const alternatives = evaluateRunnerRunTargets({ input });
    const expanded = alternatives.find(
      (target) =>
        target.accessServerId === "hq" && target.creditsAfterRun === 1,
    );
    if (!expanded) throw new Error("Expected the captured paid HQ route.");
    const economy = buildRunnerEconomyPosture({ input });
    const comparisons = compareRunnerCentralAccessRoutes(
      input,
      economy,
      alternatives.map((target) =>
        target === expanded
          ? { ...target, multiaccessAvailable: true }
          : target,
      ),
    );
    expect(
      comparisons.map(({ alternative }) => alternative.actionId),
    ).not.toContain(expanded.actionId);
  });
});
