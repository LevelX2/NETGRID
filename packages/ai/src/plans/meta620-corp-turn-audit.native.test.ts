import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "./resident-plan-portfolio-memory";

afterEach(resetResidentPlanPortfolioMemory);

it("records the real Corp candidate and end-state audit without changing its selected route", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../data/scenarios/ai-decision-checkpoints/cp-meta620-corp-turn-audit.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(input.playerView);
  const result = chooseAiAction(input);
  expect(result.actionId).toBe(cp.originalSelection.actionId);
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  const plan = result.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toBe(cp.originalSelection.root);
  expect(plan.leafExecutorInstanceId).toBe(cp.originalSelection.executor);
  expect(plan.route).toMatchObject({
    actionId: result.actionId,
    stateVersion: 3,
  });
  const audit = plan.turnPlanning!;
  expect(audit.candidateAudit).toEqual({
    schemaVersion: "ai-turn-planning-candidate-audit-v1",
    provenance: "persisted_at_decision",
  });
  expect(audit.heads.length).toBeGreaterThan(1);
  expect(audit.heads.every((head) => head.assessment !== undefined)).toBe(true);
  expect(
    audit.heads.find((head) => head.actionId === result.actionId),
  ).toMatchObject({
    selectedInLine: true,
    assessment: {
      readiness: "executable_now",
      resourceGaps: expect.any(Array),
      blockers: expect.any(Array),
    },
  });
  expect(audit.consideredLines!.length).toBeGreaterThan(1);
  for (const line of audit.consideredLines!) {
    expect(line.projectedEndState).toMatchObject({
      creditMinimum: expect.any(Number),
      creditMaximum: expect.any(Number),
      unrestrictedActionMinimum: expect.any(Number),
      unrestrictedActionMaximum: expect.any(Number),
      handMinimum: expect.any(Number),
      handMaximum: expect.any(Number),
    });
    expect(line.priorityClass).toMatch(/^P[1-6]$/);
    expect(line.partitionKey).toEqual(expect.any(String));
  }
  expect(JSON.stringify(input.playerView)).toBe(before);
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
});
