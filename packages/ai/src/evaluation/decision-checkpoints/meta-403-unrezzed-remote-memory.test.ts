import { describe, expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-unrezzed-remote-memory-d63.json";
import { deriveObservedRemoteNoProgressAccessMemory } from "../../access/access-outcome-memory";
import { reconstructBeliefState } from "../../belief-state";
import { CARD_DEFINITIONS } from "../../card-definition-compatibility";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreStrategicIntentMemorySnapshot } from "../../strategic-intent-memory";
import type { AiRuntimeCheckpointV1 } from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

function input() {
  return structuredClone(
    checkpointJson.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
}

describe("meta 403 remembered unrezzed remote access", () => {
  it("keeps the two observed declined roots known when the PlayerView hides them again", () => {
    const current = input();
    const remote = current.playerView.servers.find((s) => s.id === "remote_1")!;
    expect(remote.root).toHaveLength(2);
    expect(remote.root.every((card) => !card.known)).toBe(true);
    expect(
      reconstructBeliefState(current)
        .runnerOpponentModel?.knownPositionMemory.filter(
          (entry) => entry.zone === "remote_1",
        )
        .map((entry) => entry.positionKey),
    ).toEqual(["root:0", "root:1"]);
    expect(
      deriveObservedRemoteNoProgressAccessMemory(current, "remote_1"),
    ).toMatchObject({
      applies: true,
      suppressesPlanBonus: true,
      suppressUntilInvalidated: true,
    });
  });

  it("does not suppress a remote with an additional unanswered root position", () => {
    const current = input();
    const remote = current.playerView.servers.find((s) => s.id === "remote_1")!;
    remote.root.push({
      ...remote.root[0]!,
      instanceId: "unobserved-third-root",
    });
    expect(
      deriveObservedRemoteNoProgressAccessMemory(current, "remote_1"),
    ).toBeUndefined();
  });

  it("does not treat a remembered agenda as a declined asset", () => {
    const current = input();
    const agenda = CARD_DEFINITIONS.find((card) => card.type === "agenda")!;
    const known = reconstructBeliefState(
      current,
    ).runnerOpponentModel!.knownPositionMemory.find(
      (entry) => entry.zone === "remote_1",
    )!;
    for (const event of [
      ...current.eventTail,
      ...current.playerView.publicEvents,
    ]) {
      if (event.eventId === known.sourceEventId)
        event.publicPayload.cardDefinitionId = agenda.id;
    }
    expect(
      reconstructBeliefState(current).runnerOpponentModel!.knownPositionMemory,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ definitionId: agenda.id }),
      ]),
    );
    expect(
      deriveObservedRemoteNoProgressAccessMemory(current, "remote_1"),
    ).toBeUndefined();
  });

  it("lets the real coverage owner draw instead of repeating the unchanged declined remote", () => {
    const capture = structuredClone(checkpointJson) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    const { input: current, runtime } = capture;
    resetResidentPlanPortfolioMemory();
    restoreStrategicIntentMemorySnapshot(
      current,
      runtime.strategicIntent,
      current.ownDeckSnapshot!.deckSnapshotId,
    );
    restoreResidentPlanPortfolioMemorySnapshot(
      current,
      runtime.residentPlanPortfolio,
    );
    const result = chooseAiAction(current, {
      runnerTurnPlannerMode: "cutover",
    });
    expect(result.actionId).toBe("runner.draw_card");
    expect(
      current.legalActions.some(
        (action) => action.actionId === result.actionId,
      ),
    ).toBe(true);
    expect(result.fallbackUsed).toBe(false);
    const plan = result.decisionDebug?.planFirstDecision;
    expect(plan?.selectedPlan).toMatchObject({
      moduleId: "runner.rig_and_coverage",
      phase: "draw_for_answer",
    });
    expect(plan?.selectedStep).toMatchObject({
      planInstanceId: plan?.selectedPlan?.instanceId,
    });
    expect(plan?.selectedStep?.stepId).toContain(":find:breaker_code_gate");
  });
});
