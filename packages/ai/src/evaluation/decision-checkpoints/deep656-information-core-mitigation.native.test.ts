import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { currentEncounterMitigationForAction } from "../../runtime/runner-encounter-mitigation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function native() {
  const fixture = JSON.parse(readFileSync(new URL(
    "./fixtures/deep656-d97-information-core-mitigation.json", import.meta.url,
  ), "utf8"));
  const cp = fixture.checkpoint;
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input: AiDecisionInputWithDeckCapabilities = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, cp.runtime);
  const pump = input.legalActions.find((a) => a.type === "pump_breaker")!;
  return { fixture, input, pump };
}

it("retains funded current core mitigation after an information access path becomes unreachable", () => {
  const { input, pump } = native();
  expect(currentEncounterMitigationForAction(input, pump)).toMatchObject({
    supportsCurrentAction: true, pumpCost: 8, breakCost: 4,
    subroutineIndexes: [0, 1],
    before: { coreDamage: 2 }, after: { coreDamage: 0 },
  });
  const before = JSON.stringify(input);
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(pump.actionId);
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toBe("plan:runner.pressure_central:central%3Ahq");
  expect(plan.leafExecutorInstanceId).toBe("plan:runner.convert_run_window:run%3Arun_89");
  expect(plan.route).toMatchObject({ actionId: pump.actionId, stateVersion: 96 });
  expect(JSON.stringify(plan)).toContain("encounter_partial_mitigation:true");
  expect(JSON.stringify(input)).toBe(before);
});

it.each(["unfunded", "prevented"])("keeps the information guard for an explicitly named %s companion", (kind) => {
  const { fixture, input, pump } = native();
  // These are prospective controls derived from the native source, not new
  // historical checkpoint binding claims for the modified inputs.
  if (kind === "unfunded") input.playerView.own.credits = 7;
  else input.playerView.own.freeNetOrCoreDamagePreventionRemaining = 2;
  expect(currentEncounterMitigationForAction(input, pump)).toBeUndefined();
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(fixture.historicalActionId);
  expect(decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId)
    .toBe("plan:runner.convert_run_window:run%3Arun_89");
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});
