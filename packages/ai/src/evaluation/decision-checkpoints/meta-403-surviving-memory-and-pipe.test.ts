import { describe, expect, it } from "vitest";
import memoryJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-surviving-remote-memory.json";
import purgeJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-pipe-purge.json";
import funding18Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-central-funding-g18.json";
import funding36Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-central-funding-g36.json";
import { buildAiDecisionInputDto } from "../../input-dto";
import { reconstructBeliefState } from "../../belief-state";
import { deriveObservedRemoteNoProgressAccessMemory } from "../../access/access-outcome-memory";
import {
  corpPurgeHasVisibleStrategicPressure,
  corpPurgeImpactScoreComponent,
} from "../../runtime/corp-purge-impact";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreStrategicIntentMemorySnapshot } from "../../strategic-intent-memory";
import type { AiRuntimeCheckpointV1 } from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

function capture(json: unknown) {
  return structuredClone(json) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}
function choose(json: unknown) {
  const { input, runtime } = capture(json);
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
  expect(result.fallbackUsed).toBe(false);
  expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(
    true,
  );
  return result;
}
describe("meta 403 surviving observations and persistent action denial", () => {
  it.each([funding18Json, funding36Json])(
    "funds the installed exact blocker instead of searching for missing ICE",
    (json) => {
      const result = choose(json);
      expect(result.actionId).toBe("corp.gain_credit");
      const plan = result.decisionDebug?.planFirstDecision;
      expect(plan?.selectedStep?.planInstanceId).toBe(
        plan?.selectedPlan?.instanceId,
      );
    },
  );
  it("keeps the bounded defense search when basic funding cannot reach the blocker", () => {
    const current = capture(funding18Json);
    current.input.playerView.own.credits = 4;
    expect(choose(current).actionId).toBe("corp.draw_card");
  });
  it("does not treat an expired rez quote as a proved funding alternative", () => {
    const current = capture(funding18Json);
    for (const ice of current.input.playerView.servers.find(
      (s) => s.id === "hq",
    )!.ice)
      if (ice.effectiveRezCostQuote)
        ice.effectiveRezCostQuote.expiresAtStateVersion--;
    expect(choose(current).actionId).toBe("corp.draw_card");
  });
  it("preserves public opaque identity through the DTO and removes only the stolen root", () => {
    const input = buildAiDecisionInputDto(capture(memoryJson).input);
    const history = input.eventTail;
    expect(
      history.find((e) => e.eventId === "evt_378")?.publicPayload
        .installedPositionKey,
    ).toBe("installed-position-v1:c9dbfb7b");
    expect(
      reconstructBeliefState(
        input,
      ).runnerOpponentModel?.knownPositionMemory.filter(
        (e) => e.zone === "remote_1" && e.positionKey.startsWith("root:"),
      ),
    ).toEqual([
      expect.objectContaining({
        positionKey: "root:0",
        definitionId: "onr_v1_353_chimera",
        sourceEventId: "evt_375",
      }),
    ]);
    expect(
      deriveObservedRemoteNoProgressAccessMemory(input, "remote_1"),
    ).toMatchObject({
      applies: true,
      suppressesPlanBonus: true,
      suppressUntilInvalidated: true,
    });
  });
  it("shifts the surviving observation when a lower root position is removed", () => {
    const { input } = capture(memoryJson);
    for (const e of [...input.eventTail, ...input.playerView.publicEvents]) {
      if (e.eventId === "evt_375")
        e.publicPayload.accessedCardPositionKey = "root:1";
      if (e.eventId === "evt_377")
        e.publicPayload.accessedCardPositionKey = "root:0";
    }
    expect(
      reconstructBeliefState(
        input,
      ).runnerOpponentModel?.knownPositionMemory.filter(
        (e) => e.zone === "remote_1" && e.positionKey.startsWith("root:"),
      ),
    ).toEqual([
      expect.objectContaining({
        positionKey: "root:0",
        definitionId: "onr_v1_353_chimera",
      }),
    ]);
  });
  it("does not let a remembered sibling answer a new unknown root", () => {
    const { input } = capture(memoryJson);
    const root = input.playerView.servers.find(
      (s) => s.id === "remote_1",
    )!.root;
    root.push({ ...root[0]!, instanceId: "new-unobserved-root" });
    expect(
      deriveObservedRemoteNoProgressAccessMemory(input, "remote_1"),
    ).toBeUndefined();
  });
  it("does not repeat the known declined remote after stealing its sibling", () => {
    const result = choose(memoryJson);
    expect(result.actionId).not.toBe("runner.start_run.remote_1");
    const plan = result.decisionDebug?.planFirstDecision;
    expect(plan?.selectedStep?.planInstanceId).toBe(
      plan?.selectedPlan?.instanceId,
    );
  });
  it("admits persistent action denial at the virus owner despite only one counter", () => {
    const { input } = capture(purgeJson),
      action = input.legalActions.find(
        (a) => a.type === "purge_runner_virus_counters",
      )!;
    expect(corpPurgeHasVisibleStrategicPressure(input, action)).toBe(true);
    const result = choose(purgeJson);
    expect(result.actionId).toBe(action.actionId);
    expect(
      result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("corp.respond_to_virus_pressure");
  });
  it("does not buy delayed recovery beyond the remaining deck horizon", () => {
    const { input } = capture(purgeJson),
      action = input.legalActions.find(
        (a) => a.type === "purge_runner_virus_counters",
      )!;
    input.playerView.own.stackOrRdCount = 1;
    expect(corpPurgeHasVisibleStrategicPressure(input, action)).toBe(false);
  });
  it("keeps urgent scoring ahead of the one-counter recovery value", () => {
    const { input } = capture(purgeJson),
      action = input.legalActions.find(
        (a) => a.type === "purge_runner_virus_counters",
      )!;
    expect(
      corpPurgeImpactScoreComponent(input, action, {
        primary: "score_now",
        severity: "critical",
      })?.value,
    ).toBeLessThan(0);
    input.playerView.own.identity.counterDisplays = [];
    expect(corpPurgeHasVisibleStrategicPressure(input, action)).toBe(false);
  });
});
