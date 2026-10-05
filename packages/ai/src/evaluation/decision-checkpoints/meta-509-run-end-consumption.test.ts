import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
} from "@netgrid/engine";
import type { AiDecisionInput, GameState } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import {
  pureEndRunEncounterPayment,
  pureEndRunEncounterEconomics,
} from "../../runner/run-window/run-window-pure-etr-economics";

function load(key: string) {
  return JSON.parse(
    readFileSync(
      new URL(`./fixtures/meta-ten-repairs/509-${key}.json`, import.meta.url),
      "utf8",
    ),
  );
}
function engineInput(key: string, state = load(key + "-engine") as GameState) {
  const cp = load(key);
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = {
    ...cp.input,
    playerView: getPlayerView(state, "runner"),
    legalActions: getLegalActions(state, "runner"),
  };
  return { cp, state, input: { ...input, ...buildAiDecisionInputDto(input) } };
}
function decide(key: string) {
  const { cp, state, input } = engineInput(key);
  expect(hashGameState(state)).toBe(cp.stateHash);
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const result = chooseAiAction(input);
  assert.ok(result.actionId, "native decision must select an action");
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  const pf = result.decisionDebug!.planFirstDecision!;
  const original = load(key + "-before").decision.decisionDebug
    .planFirstDecision;
  expect(pf.selectedPlan?.moduleId).toBe("runner.convert_run_window");
  expect(pf.rootPlanInstanceId).toBe(original.rootPlanInstanceId);
  expect(pf.leafExecutorInstanceId).toBe(original.leafExecutorInstanceId);
  expect(pf.selectedStep).toEqual(original.selectedStep);
  expect(pf.route).toMatchObject({
    actionId: result.actionId,
    stateVersion: cp.stateVersion,
    stepId: pf.selectedStep!.stepId,
    planInstanceId: pf.leafExecutorInstanceId,
  });
  expect(
    input.legalActions.find(
      (a: { actionId: string }) => a.actionId === result.actionId,
    )?.expiresAtStateVersion,
  ).toBe(cp.stateVersion);
  return { ...result, actionId: result.actionId, input, state };
}
function economics(input: AiDecisionInput, id: string) {
  const action = input.legalActions.find((a) => a.actionId === id)!;
  expect(action).toBeDefined();
  const payment = pureEndRunEncounterPayment(input, action);
  expect(payment).toBeDefined();
  const value = pureEndRunEncounterEconomics(input, payment!);
  expect(value).toBeDefined();
  return value!;
}
afterEach(resetResidentPlanPortfolioMemory);

it("retains the native unused universal source at equal complete current path cost", () => {
  const d = decide("g8d112");
  expect(d.actionId).toBe(
    "runner.pump_breaker.runner_onr_classic_027_early-worm_2.runner_onr_classic_027_early-worm_2.runner_onr_classic_027_early-worm_2.corp_onr_v1_245_fire-wall_2.onr_classic_027_early-worm:pump_strength_three",
  );
  const selected = economics(d.input, d.actionId);
  const rent = economics(d.input, load("g8d112-before").decision.actionId);
  expect(selected).toMatchObject({
    totalCost: 4,
    liquidCreditsAfterPath: 9,
    newRunEndTrashSourceCount: 0,
  });
  expect(rent).toMatchObject({
    totalCost: 4,
    liquidCreditsAfterPath: 9,
    newRunEndTrashSourceCount: 1,
  });
  expect(selected.value).toBeGreaterThan(rent.value);
});
it("uses exact offered Pay-or-ETR payment instead of a same-cost newly consumed source", () => {
  const d = decide("g13d22");
  expect(d.actionId).toBe(
    "runner.continue_run.subroutine_end_run_unless_runner_pays_one.0.1",
  );
  expect(economics(d.input, d.actionId)).toMatchObject({
    totalCost: 1,
    liquidCreditsAfterPath: 3,
    newRunEndTrashSourceCount: 0,
  });
});
it.each(["g8d113", "g8d114", "g12d199"])(
  "keeps the actually cheaper native source after sunk payments or necessary gate coverage at %s",
  (key) => {
    const d = decide(key);
    expect(d.actionId).toBe(load(key + "-before").decision.actionId);
  },
);
it("counts an already bound source once, leaves it usable in the same run, and projects no private hand", () => {
  const selected = decide("g8d119");
  expect(
    economics(selected.input, selected.actionId).newRunEndTrashSourceCount,
  ).toBe(0);
  const { input, state, cp } = engineInput("g8d119");
  const rent = input.playerView.own.rig.find(
    (c: { definitionId: string }) =>
      c.definitionId === "onr_classic_031_rent-i-con",
  )!;
  for (const side of ["runner", "corp"] as const) {
    const view = getPlayerView(state, side);
    expect(view.opponent).not.toHaveProperty("gripOrHq");
    expect(view.run?.runEndTrashUsedBreakerIdsThisRun).toEqual([
      rent.instanceId,
    ]);
    expect(
      buildAiDecisionInputDto({
        ...cp.input,
        side,
        playerView: view,
        legalActions: getLegalActions(state, side),
      }).playerView.run?.runEndTrashUsedBreakerIdsThisRun,
    ).toEqual([rent.instanceId]);
  }
  const payment = input.legalActions.find(
    (a: { type: string; source: string }) =>
      a.type === "break_subroutine" && a.source === rent.instanceId,
  )!;
  expect(economics(input, payment.actionId).newRunEndTrashSourceCount).toBe(0);
  expect(
    input.playerView.own.rig.some(
      (c: { instanceId: string }) => c.instanceId === rent.instanceId,
    ),
  ).toBe(true);
});
it("does not count preservation when actual visible inner Gate coverage still consumes the same source", () => {
  const state = load("g8d112-engine") as GameState;
  const hq = state.corp.servers.find((s) => s.id === "hq")!;
  const rd = state.corp.servers.find((s) => s.id === "rd")!;
  const gate = "corp_onr_proteus_039_sphinx-2006_2",
    snow = "corp_onr_proteus_038_snowbank_3";
  expect(hq.ice[1]).toBe(gate);
  expect(rd.ice[0]).toBe(snow);
  hq.ice[1] = snow;
  rd.ice[0] = gate;
  state.cardInstances[snow]!.zone = {
    side: "corp",
    zone: "serverIce",
    serverId: "hq",
  };
  state.cardInstances[gate]!.zone = {
    side: "corp",
    zone: "serverIce",
    serverId: "rd",
  };
  state.cardInstances[gate]!.faceup = true;
  state.cardInstances[gate]!.rezzed = true;
  const { input } = engineInput("g8d112", state);
  const early = input.legalActions.find(
    (a: { type: string; source: string }) =>
      a.type === "pump_breaker" &&
      a.source === "runner_onr_classic_027_early-worm_2",
  )!;
  const rent = input.legalActions.find(
    (a: { type: string; source: string }) =>
      a.type === "pump_breaker" &&
      a.source === "runner_onr_classic_031_rent-i-con_2",
  )!;
  expect(economics(input, early.actionId).newRunEndTrashSourceCount).toBe(1);
  expect(economics(input, rent.actionId).newRunEndTrashSourceCount).toBe(1);
});
it.each([
  ["g8d112", "retained-rent-current-encounter-control", 9],
  ["g13d22", "pay-or-etr-retained-rent-control", 2],
] as const)(
  "keeps the actual current run/access/bank control at %s",
  (key, control, credits) => {
    let state = load(key + "-engine") as GameState;
    expect(hashGameState(state)).toBe(load(key).stateHash);
    for (const row of load(control).rows) {
      const id = row.actionId ?? row.id;
      expect(
        getLegalActions(state, state.activeSide).some(
          (a) =>
            a.actionId === id && a.expiresAtStateVersion === state.stateVersion,
        ),
      ).toBe(true);
      const result = applyAction(state, {
        matchId: state.matchId,
        side: state.activeSide,
        actionId: id,
        clientKnownStateVersion: state.stateVersion,
        ...(row.choices ? { selectedChoices: row.choices } : {}),
      });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("exact Engine control rejected");
      state = result.state;
      expect(hashGameState(state)).toBe(row.hash);
    }
    expect(state.run).toBeUndefined();
    expect(state.runner.credits).toBe(credits);
    expect(
      getPlayerView(state, "runner").own.rig?.some(
        (c) => c.definitionId === "onr_classic_031_rent-i-con",
      ),
    ).toBe(true);
  },
);
it("rejects malformed public used-source bindings and never binds pump-only use", () => {
  const { input } = engineInput("g8d113");
  expect(
    input.playerView.run?.runEndTrashUsedBreakerIdsThisRun,
  ).toBeUndefined();
  for (const ids of [["x", "x"], [""], [3], "x"]) {
    const bad = structuredClone(input);
    bad.playerView.run.runEndTrashUsedBreakerIdsThisRun = ids;
    expect(() => buildAiDecisionInputDto(bad)).toThrow(
      "Invalid Engine public run-end breaker usage.",
    );
  }
});
it("requires exact offered open continuation payment and rejects an unknown inner path", () => {
  const { input } = engineInput("g13d22");
  const action = input.legalActions.find(
    (a: { actionId: string }) =>
      a.actionId ===
      "runner.continue_run.subroutine_end_run_unless_runner_pays_one.0.1",
  )!;
  for (const payload of [
    { ...action.payload, encounterWillEndRun: true },
    { ...action.payload, payOrEndRunSubroutinePayment: 2 },
    { ...action.payload, payOrEndRunSubroutineIndexes: "1" },
    { ...action.payload, payOrEndRunSubroutineIndexes: "0,x" },
  ]) {
    expect(
      pureEndRunEncounterPayment(input, { ...action, payload }),
    ).toBeUndefined();
  }
  const state = load("g8d112-engine") as GameState;
  state.cardInstances["corp_onr_proteus_038_snowbank_3"]!.rezzed = false;
  state.cardInstances["corp_onr_proteus_038_snowbank_3"]!.faceup = false;
  const unknown = engineInput("g8d112", state).input;
  const early = unknown.legalActions.find(
    (a: { type: string; source: string }) =>
      a.type === "pump_breaker" &&
      a.source === "runner_onr_classic_027_early-worm_2",
  )!;
  const payment = pureEndRunEncounterPayment(unknown, early);
  expect(payment).toBeDefined();
  expect(pureEndRunEncounterEconomics(unknown, payment!)).toBeUndefined();
});
