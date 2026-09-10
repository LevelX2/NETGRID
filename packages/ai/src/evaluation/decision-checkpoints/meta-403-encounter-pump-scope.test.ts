import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-encounter-pump-scope-d291.json";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { visibleIceRunHazardsForQuote } from "../../run-analysis/visible-run-hazards";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreStrategicIntentMemorySnapshot } from "../../strategic-intent-memory";
import type { AiRuntimeCheckpointV1 } from "./runtime-checkpoint";

function captureInput() {
  const capture = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
  };
  return { ...capture.input, ...buildAiDecisionInputDto(capture.input) };
}

describe("meta 403 pump strength lasts through all subroutines in one encounter", () => {
  it("quotes the live mixed ETR/run-lock route once per encounter", () => {
    const input = captureInput();
    const route = evaluateRunnerRunTargets({ input }).find(
      (q) => q.actionId === "runner.start_run.remote_1",
    )!;
    expect(route.routeQuote!.guaranteedKnownCost).toBe(9);
    expect(route.routeQuote!.reachability).toBe("guaranteed_access");
  });

  it("charges encounter-only strength again on the next ICE", () => {
    const input = captureInput();
    const ice = input.playerView.servers.find((s) => s.id === "remote_1")!
      .ice[0]!;
    const copy = structuredClone(ice);
    copy.instanceId = "scope_second_haunting";
    copy.effectiveRunQuote!.iceInstanceId = copy.instanceId;
    const path = assessKnownRezzedIcePath(
      [ice, copy],
      input.playerView.own.rig!,
      20,
    );
    expect(path.visibleBreakCost).toBe(14);
    expect(path.canReachAccess).toBe(true);
  });

  it("keeps the live contest under its owning plan and rejects an unfunded route", () => {
    // Preserve the captured state identity used by its resident commitment.
    // DTO projection is tested separately above.
    const input = structuredClone(
      checkpointJson.input,
    ) as unknown as AiDecisionInputWithDeckCapabilities;
    const runtime = checkpointJson.runtime as unknown as AiRuntimeCheckpointV1;
    resetResidentPlanPortfolioMemory();
    restoreStrategicIntentMemorySnapshot(
      input,
      runtime.strategicIntent,
      input.ownDeckSnapshot!.deckSnapshotId,
    );
    restoreResidentPlanPortfolioMemorySnapshot(
      input,
      runtime.residentPlanPortfolio,
    );
    const result = chooseAiAction(input, { runnerTurnPlannerMode: "cutover" });
    expect(result.actionId).toBe("runner.start_run.remote_1");
    expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(
      true,
    );
    expect(result.fallbackUsed).toBe(false);
    expect(result.decisionDebug?.planFirstDecision?.selectedPlan).toMatchObject(
      {
        moduleId: "runner.contest_remote",
        phase: "execute",
        target: { kind: "server", id: "remote_1" },
      },
    );
    const server = input.playerView.servers.find((s) => s.id === "remote_1")!;
    expect(
      assessKnownRezzedIcePath(server.ice, input.playerView.own.rig!, 8)
        .canReachAccess,
    ).toBe(false);
  });

  it("shares a selected pump across sequential trace breaks in one encounter", () => {
    const input = captureInput();
    const ice = structuredClone(
      input.playerView.servers.find((s) => s.id === "remote_1")!.ice[0]!,
    );
    ice.effectiveRunQuote!.subroutines = [1, 2].map((n) => ({
      id: `trace_${n}`,
      type: "initiate_trace" as const,
      traceLimit: 20,
      traceSuccessEffect: { type: "add_tag" as const, amount: 1 },
    }));
    const initialStrengths = new Map<string, number>();
    const hazards = visibleIceRunHazardsForQuote({
      quote: ice.effectiveRunQuote,
      ice,
      iceIndex: 0,
      rigCards: input.playerView.own.rig!,
      availableCredits: 10,
      visibleCorpBidCapacity: 0,
      breakerStrengths: initialStrengths,
      additionalBreakCostPerSubroutine: 0,
      traceRulesProfile: "modern_open",
    });
    expect(hazards.map((p) => p.avoidancePayment?.kind)).toEqual([
      "breaker",
      "breaker",
    ]);
    expect(hazards.map((p) => p.hazard.minimumAvoidanceCost)).toEqual([7, 0]);
    expect(initialStrengths.size).toBe(0);
  });
});
