import { describe, expect, it } from "vitest";
import fixture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-411-deferred-full-break-d388.json";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { runnerVisibleLethalIceDamageAssessment } from "../../runner-damage-threat-assessment";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

function capture() {
  return structuredClone(fixture) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}
describe("meta 411 conditional next-encounter full break", () => {
  it("prices the complete known alternative at its target rather than forcing the source break", () => {
    const { input } = capture(),
      ice = input.playerView.servers.find((s) => s.id === "remote_1")!.ice;
    const path = assessKnownRezzedIcePath(ice, input.playerView.own.rig!, 8);
    expect(path).toMatchObject({
      canReachAccess: true,
      visibleBreakCost: 2,
      creditsAfterPath: 6,
      fullyBrokenIceInstanceIds: [ice[0]!.instanceId],
    });
  });
  it("does not charge or project damage again after a fully paid target break", () => {
    const { input } = capture(),
      ice = input.playerView.servers.find((s) => s.id === "remote_1")!.ice;
    const path = assessKnownRezzedIcePath(ice, input.playerView.own.rig!, 2);
    expect(path).toMatchObject({ canReachAccess: true, creditsAfterPath: 0 });
    expect(
      runnerVisibleLethalIceDamageAssessment(input, ice, {
        generalCredits: 0,
        requiredHandFloor: 4,
        fullyBrokenIceInstanceIds: path.fullyBrokenIceInstanceIds!,
      }),
    ).toBeUndefined();
    expect(
      runnerVisibleLethalIceDamageAssessment(input, ice, {
        generalCredits: 0,
        requiredHandFloor: 4,
      }),
    ).toBeDefined();
  });
  it.each(["unknown", "unrezzed", "missing_quote", "unaffordable"])(
    "does not invent a full break across %s",
    (kind) => {
      const { input } = capture(),
        ice = input.playerView.servers.find((s) => s.id === "remote_1")!.ice;
      if (kind === "unknown") {
        ice[0]!.known = false;
        delete ice[0]!.definitionId;
        delete ice[0]!.effectiveRunQuote;
      }
      if (kind === "unrezzed") ice[0]!.rezzed = false;
      if (kind === "missing_quote") delete ice[0]!.effectiveRunQuote;
      const path = assessKnownRezzedIcePath(
        ice,
        input.playerView.own.rig!,
        kind === "unaffordable" ? 1 : 8,
      );
      expect(path.canReachAccess).toBe(false);
    },
  );
  it("retains the cheaper source-break alternative when full target break is more expensive", () => {
    const { input } = capture(),
      ice = input.playerView.servers.find((s) => s.id === "remote_1")!.ice;
    ice[0]!.effectiveRunQuote!.subroutines = [
      ice[0]!.effectiveRunQuote!.subroutines[1]!,
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `credit-${i}`,
        type: "corp_gain_credit" as const,
        amount: 1,
      })),
    ];
    const path = assessKnownRezzedIcePath(ice, input.playerView.own.rig!, 50);
    expect(path.fullyBrokenIceInstanceIds).toBeUndefined();
  });
  it("lets the existing contest owner bind the current legal run", () => {
    const { input, runtime } = capture();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const result = chooseAiAction(input, { runnerTurnPlannerMode: "cutover" });
    expect(result.actionId).toBe("runner.start_run.remote_1");
    expect(result.fallbackUsed).toBe(false);
    expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(
      true,
    );
    const debug = result.decisionDebug!.planFirstDecision!;
    expect(debug.selectedPlan!.moduleId).toBe("runner.contest_remote");
    expect(debug.selectedStep!.planInstanceId).toBe(
      debug.selectedPlan!.instanceId,
    );
  });
  it("keeps the best deferred continuation inside each breaker survival branch", () => {
    const { input } = capture();
    const ice = input.playerView.servers.find((s) => s.id === "remote_1")!.ice;
    const breaker = {
      instanceId: "branch-breaker",
      definitionId: "onr_v1_005_bartmoss-memorial-icebreaker",
      type: "program" as const,
      known: true,
      strength: 5,
      subtypes: ["icebreaker"],
    };
    const path = assessKnownRezzedIcePath(ice, [breaker], 3);
    expect(path.canReachAccess).toBe(true);
    expect(path.postEncounterBreakerBranches).toEqual([
      { outcome: "breaker_retained", blocked: false, canReachAccess: true },
      { outcome: "breaker_trashed", blocked: false, canReachAccess: true },
    ]);
  });
});
