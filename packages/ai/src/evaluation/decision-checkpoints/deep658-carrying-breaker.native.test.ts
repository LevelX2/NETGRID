import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { completeEncounterBreakerPayment } from "../../runner/run-window/run-window-encounter-payment";
import { pureEndRunEncounterEconomics } from "../../runner/run-window/run-window-pure-etr-economics";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function native() {
  const cp = JSON.parse(readFileSync(new URL(
    "./fixtures/deep658-d236-carrying-breaker.json", import.meta.url,
  ), "utf8")).checkpoint;
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input: AiDecisionInputWithDeckCapabilities = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, cp.runtime);
  return input;
}

it("compares the whole known remainder for carrying and ordinary breakers under the native run owner", () => {
  const input = native();
  const before = JSON.stringify({ view: input.playerView, legal: input.legalActions });
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(a => a.actionId === decision.actionId)!;
  expect(action.type).toBe("break_subroutine");
  expect(action.source).toBe("runner_onr_v1_066_snowball_1");
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toBe("plan:runner.pressure_central:central%3Ahq");
  expect(plan.leafExecutorInstanceId).toBe("plan:runner.convert_run_window:run%3Arun_233");
  expect(plan.route).toMatchObject({ actionId: action.actionId, stateVersion: 235, capabilityId: "convert_active_run_window" });
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  // The runtime can refresh planningStateIdentity; Engine facts stay immutable.
  expect(JSON.stringify({ view: input.playerView, legal: input.legalActions }) === before).toBe(true);
});

it("retains exact whole-path prices and run strength without claiming a local-only equivalence", () => {
  const input = native();
  const quote = (source: string) => {
    const action = input.legalActions.find(a => a.type === "break_subroutine" && a.source.includes(source))!;
    const payment = completeEncounterBreakerPayment(input, action)!;
    return { payment, whole: pureEndRunEncounterEconomics(input, payment)! };
  };
  const snow = quote("snowball"), krash = quote("krash");
  expect(snow.payment.cost).toBe(2);
  expect(snow.payment.carriesStrengthAcrossIce).toBe(true);
  expect(snow.whole.totalCost).toBe(5);
  expect(krash.payment.cost).toBe(4);
  expect(krash.whole.totalCost).toBe(11);
  expect(snow.whole.value).toBeGreaterThan(krash.whole.value);
});

it("does not invent a whole-path price for an explicitly unknown inner-ICE companion", () => {
  const input = native();
  // Prospective safety control, not a replacement for the historical binding.
  const server = input.playerView.servers.find(s => s.id === "hq")!;
  server.ice[0] = { instanceId: server.ice[0]!.instanceId, known: false };
  const action = input.legalActions.find(a => a.type === "break_subroutine" && a.source.includes("snowball"))!;
  const payment = completeEncounterBreakerPayment(input, action)!;
  expect(pureEndRunEncounterEconomics(input, payment)).toBeUndefined();
  const decision = chooseAiAction(input);
  expect(decision.actionId).toContain("break_subroutine.runner_onr_v1_039_krash_2");
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});

it("retains the ordinary breaker when the specialist is absent in an explicit companion", () => {
  const input = native();
  // Canonical card costs remain untouched; this companion simply removes the
  // current specialist offering and rig source from the prospective input.
  input.playerView.own.rig = input.playerView.own.rig!.filter(c => !c.instanceId.includes("snowball"));
  input.legalActions = input.legalActions.filter(a => !a.source?.includes("snowball"));
  const decision = chooseAiAction(input);
  expect(decision.actionId).toContain("break_subroutine.runner_onr_v1_039_krash_2");
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});
