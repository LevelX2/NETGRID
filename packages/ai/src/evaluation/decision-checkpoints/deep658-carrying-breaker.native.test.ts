import { readFileSync } from "node:fs";
import type { CardDefinitionId } from "@netgrid/shared";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
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

function breakerAction(input: AiDecisionInputWithDeckCapabilities, definitionId: CardDefinitionId) {
  const definitions = visibleSourceDefinitionsByInstanceId(input.playerView);
  const action = input.legalActions.find((a) => a.type === "break_subroutine" && definitions[a.source] === definitionId);
  expect(action).toBeDefined();
  return action!;
}

it("compares the whole known remainder for carrying and ordinary breakers under the native run owner", () => {
  const input = native();
  const before = JSON.stringify({ view: input.playerView, legal: input.legalActions });
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(a => a.actionId === decision.actionId)!;
  expect(action.type).toBe("break_subroutine");
  expect(action.source).toBe("c1pt");
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toBe("plan:runner.pressure_central:central%3Ahq");
  expect(plan.leafExecutorInstanceId).toBe("plan:runner.convert_run_window:run%3A233");
  expect(plan.route).toMatchObject({ actionId: action.actionId, stateVersion: 235, capabilityId: "convert_active_run_window" });
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  // The runtime can refresh planningStateIdentity; Engine facts stay immutable.
  expect(JSON.stringify({ view: input.playerView, legal: input.legalActions }) === before).toBe(true);
});

it("retains exact whole-path prices and run strength without claiming a local-only equivalence", () => {
  const input = native();
  const quote = (definitionId: CardDefinitionId) => {
    const action = breakerAction(input, definitionId);
    const payment = completeEncounterBreakerPayment(input, action)!;
    return { payment, whole: pureEndRunEncounterEconomics(input, payment)! };
  };
  const snow = quote(278), krash = quote(251);
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
  const action = breakerAction(input, 278);
  const payment = completeEncounterBreakerPayment(input, action)!;
  expect(pureEndRunEncounterEconomics(input, payment)).toBeUndefined();
  const decision = chooseAiAction(input);
  expect(input.legalActions.find((a) => a.actionId === decision.actionId)).toMatchObject({
    type: "break_subroutine",
    source: breakerAction(input, 251).source,
  });
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});

it("retains the ordinary breaker when the specialist is absent in an explicit companion", () => {
  const input = native();
  // Canonical card costs remain untouched; this companion simply removes the
  // current specialist offering and rig source from the prospective input.
  const specialist = breakerAction(input, 278).source;
  input.playerView.own.rig = input.playerView.own.rig!.filter((c) => c.instanceId !== specialist);
  input.legalActions = input.legalActions.filter((a) => a.source !== specialist);
  const decision = chooseAiAction(input);
  expect(input.legalActions.find((a) => a.actionId === decision.actionId)).toMatchObject({
    type: "break_subroutine",
    source: breakerAction(input, 251).source,
  });
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});
