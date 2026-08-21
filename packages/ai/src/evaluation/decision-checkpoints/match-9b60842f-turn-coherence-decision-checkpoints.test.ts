import { describe, expect, it } from "vitest";

import continueDefenseD4Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9b60842f-01-continue-central-defense-d4.json";
import noOvercapacityDrawD5Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9b60842f-02-no-overcapacity-draw-d5.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("match 9b60842f Corp turn-coherence checkpoints", () => {
  it("continues the financed central-defense parent with a rez-ready install", () => {
    const result = runAiDecisionCheckpoint(fixture(continueDefenseD4Json));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.selectedAction?.type).toBe("install_card");
    expect(result.decision?.decisionDebug?.planKind).toBe(
      "corp.defend_servers",
    );
    expectCutoverTurnPlanner(result, 1);
  });

  it("already avoids the historical full-HQ score-material draw on current code", () => {
    const result = runAiDecisionCheckpoint(fixture(noOvercapacityDrawD5Json));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.selectedAction?.type).toBe("install_card");
    expect(result.decision?.decisionDebug?.planKind).toBe(
      "corp.defend_servers",
    );
    expectCutoverTurnPlanner(result, 1);
  });

  it("repeats the same committed turn trace and live decision deterministically", () => {
    const first = runAiDecisionCheckpoint(fixture(continueDefenseD4Json));
    const repeated = runAiDecisionCheckpoint(fixture(continueDefenseD4Json));

    expect(first.ok, `${first.code}: ${first.message}`).toBe(true);
    expect(repeated.ok, `${repeated.code}: ${repeated.message}`).toBe(true);
    expect(repeated.selectedAction).toEqual(first.selectedAction);
    expect(repeated.decision?.selectedChoices).toEqual(
      first.decision?.selectedChoices,
    );
    expect(
      repeated.decision?.decisionDebug?.planFirstDecision?.turnPlanning,
    ).toEqual(first.decision?.decisionDebug?.planFirstDecision?.turnPlanning);
    expect(
      first.decision?.decisionDebug?.planFirstDecision?.turnPlanning
        ?.evidenceCodes,
    ).toEqual(
      expect.arrayContaining([
        "corp_turn_planner_cutover_authority",
        "legacy_single_action_selection_comparison_only",
        "bounded_single_step_baseline_compared",
      ]),
    );
  });
});

function expectCutoverTurnPlanner(
  result: ReturnType<typeof runAiDecisionCheckpoint>,
  minimumSteps: number,
): void {
  const planning =
    result.decision?.decisionDebug?.planFirstDecision?.turnPlanning;
  expect(planning?.mode).toBe("cutover");
  expect(
    result.decision?.decisionDebug?.planFirstDecision?.selectionAuthority,
  ).toBe("turn_plan_commitment");
  expect(planning?.shadowComparison?.shadowActionId).toBe(
    result.selectedAction?.actionId,
  );
  expect(planning?.commitment).toMatchObject({
    status: "active",
    rematerialization: {
      status: "executable",
      actionId: result.selectedAction?.actionId,
    },
  });
  expect(
    planning?.coverage,
    JSON.stringify(planning, undefined, 2),
  ).toMatchObject({
    status: "pass",
    coveragePercent: 100,
    missingActionCount: 0,
    conflictingActionCount: 0,
  });
  expect(planning?.search?.headCount).toBeGreaterThan(0);
  expect(planning?.search?.protectedPartitionCount).toBeGreaterThan(0);
  expect(
    planning?.search?.selectedLineStepCount,
    JSON.stringify(planning, undefined, 2),
  ).toBeGreaterThanOrEqual(minimumSteps);
  expect(
    planning?.selectedLine.phases.flatMap((phase) => phase.nodes),
  ).toHaveLength(planning?.search?.selectedLineStepCount ?? 0);
  expect(planning?.consideredLines?.length).toBeGreaterThan(0);
  for (const line of planning?.consideredLines ?? []) {
    expect(line.steps).toHaveLength(line.stepCount);
    expect(line.steps[0]?.currentActionId).toBe(line.firstActionId);
    expect(
      line.steps.slice(1).every((step) => step.currentActionId === undefined),
    ).toBe(true);
    expect(Object.values(line.evaluationValues).every(Number.isFinite)).toBe(
      true,
    );
  }
  expect(planning?.campaigns).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: "defense",
        status: "continuable",
        requoteStatus: "current",
      }),
    ]),
  );
}

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
