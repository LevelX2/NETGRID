import { describe, expect, it } from "vitest";
import beforeJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-425-coverage-search-d159.json";
import afterJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-425-ice-trash-support-d160.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type Capture = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

function replay(json: unknown) {
  const capture = structuredClone(json) as Capture;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    capture.input,
    capture.input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  const decision = chooseAiAction(capture.input);
  expect(decision.fallbackUsed).toBe(false);
  expect(
    capture.input.legalActions.some(
      (action) => action.actionId === decision.actionId,
    ),
  ).toBe(true);
  expect(
    decision.decisionDebug?.planFirstDecision?.turnPlanning?.coverage,
  ).toMatchObject({
    status: "pass",
    coveragePercent: 100,
    missingActionCount: 0,
    conflictingActionCount: 0,
  });
  return { decision, portfolio: residentPlanPortfolioSnapshot(capture.input) };
}

describe("pairing 425 targeted ICE trash replaces a coverage support need", () => {
  it("keeps the real coverage child before the preparation card is drawn", () => {
    const { portfolio } = replay(beforeJson);
    expect(portfolio).toMatchObject({
      rootForegroundInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      executorInstanceId: "plan:runner.rig_and_coverage:coverage%3Abreaker_sentry",
    });
    const executor = portfolio!.instances.find(
      (instance) => instance.instanceId === portfolio!.executorInstanceId,
    );
    expect(executor).toMatchObject({
      parentInstanceId: portfolio!.rootForegroundInstanceId,
      parentNeedId: "coverage:breaker_sentry",
    });
  });

  it("executes the exact ICE-trash preparation without inheriting the superseded need", () => {
    const { decision, portfolio } = replay(afterJson);
    expect(portfolio).toMatchObject({
      rootForegroundInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      executorInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
    });
    const executor = portfolio!.instances.find(
      (instance) => instance.instanceId === portfolio!.executorInstanceId,
    );
    expect(executor?.moduleState).toMatchObject({
      signal: {
        routePreparation: "targeted_ice_trash",
        preparationActionIds: [decision.actionId],
        targetedIceTrashCommitment: {
          sourceActionId: decision.actionId,
          serverId: "remote_1",
        },
      },
    });
    expect(
      (executor?.moduleState as { signal: { supportNeedId?: string } }).signal
        .supportNeedId,
    ).toBeUndefined();
  });
});
