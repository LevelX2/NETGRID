import type {
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  availableRunnerRunCredits,
  payEncounterSubroutineRunCost,
  payEncounterTaxForFutureIce,
  payJackOutAdditionalCost,
  payRunStartTaxCredits,
  recordRunActionSpendingCapSpend,
  runDurationPaymentHost,
  runJackOutAdditionalCost,
  spendRunnerRunCredits,
} from "./run-duration-payment";

function instance(
  id: string,
  definitionId: string,
  zone: CardInstance["zone"],
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId,
    owner: zone.side,
    controller: zone.side,
    zone,
    faceup: options.faceup ?? true,
    rezzed: options.rezzed ?? true,
    counters: options.counters,
    ...options,
  } as CardInstance;
}

function makeState(): GameState {
  const state = {
    stateVersion: 5,
    activeSide: "runner",
    phase: "run",
    timingPoint: "run.encounter_ice",
    runner: {
      credits: 10,
      tags: 0,
      identity: "runner_identity",
      rig: {
        programs: ["breaker", "vewy"],
        hardware: [],
        resources: [],
      },
      scoreArea: [],
    },
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      servers: [
        { id: "rd", kind: "rd", ice: [], root: [] },
        { id: "hq", kind: "hq", ice: [], root: [] },
        { id: "archives", kind: "archives", ice: [], root: [] },
        { id: "remote_1", kind: "remote", ice: [], root: [] },
      ],
    },
    cardInstances: {
      breaker: instance("breaker", "simple_decoder", {
        side: "runner",
        zone: "rig",
      }),
      vewy: instance(
        "vewy",
        "onr_v1_071_vewy-vewy-quiet",
        {
          side: "runner",
          zone: "rig",
        },
        { counters: { bit: 2 } },
      ),
    },
    run: {
      runId: "run_1",
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      badPublicityCredits: 1,
      runnerRunTemporaryCredits: {
        amount: 2,
        remaining: 2,
        returnUnusedAtRunEnd: true,
        sourceDefinitionId: "lucidrine_def",
      },
    },
  } as unknown as GameState;
  return state;
}

describe("run duration payment", () => {
  it("spends run credits in the existing order: bad publicity, run-only, hosted, then pool", () => {
    const state = makeState();
    const host = runDurationPaymentHost(state);

    expect(availableRunnerRunCredits(host, "breaker")).toBe(15);
    const result = spendRunnerRunCredits(host, 6, "breaker");

    expect(result).toMatchObject({
      handled: true,
      paid: true,
      amount: 6,
      badPublicityCreditsSpent: 1,
      temporaryRunCreditsSpent: 2,
      hostedCreditsSpent: 2,
      recurringCreditsSpent: 0,
      normalCreditsSpent: 1,
    });
    expect(state.run?.badPublicityCredits).toBe(0);
    expect(state.run?.runnerRunTemporaryCredits?.remaining).toBe(0);
    expect(state.cardInstances.vewy?.counters?.bit).toBeUndefined();
    expect(state.runner.credits).toBe(9);
  });

  it("counts Wilson run spend and blocks overspend", () => {
    const state = makeState();
    state.run!.runActionSpendingCap = {
      sourceCardInstanceId: "wilson" as CardInstanceId,
      limit: 3,
      spent: 2,
    };
    const host = runDurationPaymentHost(state);

    recordRunActionSpendingCapSpend(host, 1);
    expect(state.run?.runActionSpendingCap?.spent).toBe(3);
    expect(() => recordRunActionSpendingCapSpend(host, 1)).toThrow(
      "Diese Run-Aktion erlaubt maximal 3 Credits fuer Icebreaker oder Link.",
    );
  });

  it("pays jack-out and pay-or-end-run costs through the run payment path", () => {
    const state = makeState();
    const host = runDurationPaymentHost(state);
    const jackOut = {
      costs: [{ credits: 2 }],
      payload: { serverLabel: "R&D" },
    } as unknown as LegalAction;

    const jackOutResult = payJackOutAdditionalCost(host, jackOut, {
      serverLabel: "R&D",
    });
    expect(jackOutResult).toMatchObject({
      handled: true,
      paid: true,
      amount: 2,
    });
    expect(jackOut.payload).toMatchObject({
      serverLabel: "R&D",
      jackOutAdditionalCost: 2,
      runnerCreditsAfter: 10,
    });

    const payOrEnd = {
      costs: [{ credits: 1 }],
      payload: { payOrEndRunSubroutinePayment: 1 },
    } as unknown as LegalAction;
    const payOrEndResult = payEncounterSubroutineRunCost(host, payOrEnd, 1);
    expect(payOrEndResult).toMatchObject({
      handled: true,
      paid: true,
      amount: 1,
    });
    expect(state.run?.runnerRunTemporaryCredits?.remaining).toBe(0);
    expect(state.runner.credits).toBe(10);
  });

  it("pays or ends Ball-and-Chain-style encounter tax without changing payload fields", () => {
    const state = makeState();
    state.run!.encounterTaxForFutureIce = 3;
    const legalAction = { payload: {} } as LegalAction;

    const paid = payEncounterTaxForFutureIce(
      runDurationPaymentHost(state),
      legalAction,
    );

    expect(paid).toMatchObject({ handled: true, paid: true, amount: 3 });
    expect(legalAction.payload).toMatchObject({
      encounterTaxForFutureIce: 3,
      encounterTaxPaid: 3,
      encounterTaxSource: "onr_v1_222_ball-and-chain",
    });

    const cannotPay = makeState();
    cannotPay.runner.credits = 0;
    cannotPay.cardInstances.vewy = {
      ...cannotPay.cardInstances.vewy!,
      counters: {},
    };
    cannotPay.run!.badPublicityCredits = 0;
    cannotPay.run!.runnerRunTemporaryCredits = {
      remaining: 0,
      returnUnusedAtRunEnd: true,
      sourceDefinitionId: "lucidrine_def",
    };
    cannotPay.run!.encounterTaxForFutureIce = 3;
    const unpaidAction = { payload: {} } as LegalAction;

    const unpaid = payEncounterTaxForFutureIce(
      runDurationPaymentHost(cannotPay),
      unpaidAction,
    );

    expect(unpaid).toMatchObject({
      handled: true,
      paid: false,
      amount: 3,
      runShouldEnd: true,
    });
    expect(unpaidAction.payload).toMatchObject({
      encounterTaxForFutureIce: 3,
      encounterTaxPaid: 0,
      encounterTaxSource: "onr_v1_222_ball-and-chain",
    });
  });

  it("handles run-start tax and Viral-15 jack-out cost quotes with stable amounts", () => {
    const state = makeState();
    const host = runDurationPaymentHost(state);
    const runStartAction = {
      costs: [{ credits: 2 }],
      payload: { runStartTaxCredits: 2 },
    } as unknown as LegalAction;

    const startTax = payRunStartTaxCredits(host, runStartAction);

    expect(startTax).toMatchObject({ handled: true, paid: true, amount: 2 });
    expect(runStartAction.payload).toMatchObject({
      runStartTaxCredits: 2,
      runStartTaxPaid: 2,
      runnerCreditsAfter: 10,
    });

    state.run!.jackOutAdditionalCostForRun = 2;
    state.run!.activeIceProgramTrashSourceIceId = "ice_1" as CardInstanceId;
    expect(runJackOutAdditionalCost(state.run!)).toBe(3);
  });
});
