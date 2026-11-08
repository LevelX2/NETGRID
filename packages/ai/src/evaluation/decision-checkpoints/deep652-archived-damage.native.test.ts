import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { runnerDamageThreatAssessment } from "../../runner-damage-threat-assessment";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

function nativeInput() {
  const cp = JSON.parse(
    readFileSync(
      new URL("./fixtures/deep652-d375-archived-damage.json", import.meta.url),
      "utf8",
    ),
  );
  expect(cp.stateHash).toBe("fnv1a:4a6ad836");
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = {
    ...structuredClone(cp.input),
    ...buildAiDecisionInputDto(structuredClone(cp.input)),
  };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    structuredClone(cp.runtime),
  );
  return input;
}

afterEach(resetResidentPlanPortfolioMemory);

it("separates the original D375 discarded damage evidence from current active threats", () => {
  const input = nativeInput();
  expect(input.playerView.own).toMatchObject({
    credits: 12,
    clicks: 4,
    stackOrRdCount: 0,
  });
  expect(input.playerView.own.gripOrHq).toHaveLength(3);
  expect(
    input.playerView.servers
      .find((s: { id: string }) => s.id === "archives")
      .root.some(
        (c: { definitionId: string }) =>
          c.definitionId === "onr_v1_228_cinderella",
      ),
  ).toBe(true);
  expect(runnerDamageThreatAssessment(input)).toMatchObject({
    deckBelief: { level: "confirmed", visibleDamageSourceCount: 3 },
    flatlineRisk: {
      level: "suspected",
      activeDamageSourceCount: 0,
      recommendedHandFloor: 2,
    },
  });
});

it("removes the false active-damage barrier through the existing central plan and legal route", () => {
  const input = nativeInput(),
    before = JSON.stringify(input.playerView);
  const decision = chooseAiAction(input),
    plan = decision.decisionDebug!.planFirstDecision!;
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).not.toBe(true);
  const rd = plan.portfolio.find(
    (p) => p.instanceId === "plan:runner.pressure_central:central%3Ard",
  )!;
  expect(rd.evidenceCodes).not.toContain(
    "runner_confirmed_damage_central_pressure_requires_hand_buffer:rd",
  );
  expect(input.legalActions).toContainEqual(
    expect.objectContaining({
      actionId: decision.actionId,
      expiresAtStateVersion: 374,
    }),
  );
  expect(plan.route).toMatchObject({
    actionId: decision.actionId,
    stateVersion: 374,
  });
  expect(plan.selectedStep?.planInstanceId).toBe(plan.leafExecutorInstanceId);
  expect(JSON.stringify(input.playerView)).toBe(before);
});
