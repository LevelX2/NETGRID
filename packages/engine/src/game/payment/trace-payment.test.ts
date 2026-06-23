import { describe, expect, it } from "vitest";
import type {
  CardDefinitionId,
  CardInstanceId,
  GameState,
  TraceState,
} from "@netgrid/shared";
import {
  corpTracePaymentPublicPayload,
  payCorpTraceBidQuote,
  payRunnerTraceBidQuote,
  quoteCorpTraceBidPayment,
  quoteRunnerTraceBidPayment,
  runnerTracePaymentPublicPayload,
  type CorpTracePaymentDependencies,
  type RunnerTracePaymentDependencies,
} from "./trace-payment";

describe("trace payment pools", () => {
  it("quotes and spends Corp trace pools through shared priority allocation", () => {
    const fortPoolId = "fort_pool_1" as CardInstanceId;
    let fortBits = 2;
    let corpTraceBits = 1;
    let corpTraceCounters = 2;
    const trace = corpBidTrace({
      fortTraceBitPoolSourceCardInstanceId: fortPoolId,
      fortTraceBitPoolServerId: "remote_1",
    });
    const state = stateForTrace(trace, { corpCredits: 2 });
    const deps = corpDeps({
      fortTraceBitPoolTotal: () => fortBits,
      spendFortTraceBitPool: (_state, sourceCardId, serverId, amount) => {
        expect(sourceCardId).toBe(fortPoolId);
        expect(serverId).toBe("remote_1");
        fortBits -= amount;
        return amount;
      },
      corpTraceBitPoolTotal: () => corpTraceBits,
      spendCorpTraceBitPool: (_state, amount) => {
        corpTraceBits -= amount;
        return amount;
      },
      corpTraceCounterPoolTotal: () => corpTraceCounters,
      spendCorpTraceCounterPool: (_state, amount) => {
        corpTraceCounters -= amount;
        return amount;
      },
      cardCounter: () => fortBits,
    });

    const quote = quoteCorpTraceBidPayment(deps, state, trace, 6);

    expect(quote).toMatchObject({
      canPay: true,
      fortTraceBitPoolToPay: 2,
      normalCreditsToPay: 2,
      corpTraceBitsToPay: 1,
      corpTraceCountersToPay: 1,
    });
    expect(quote.breakdown.map((entry) => entry.kind)).toEqual([
      "fort_trace_bit_pool",
      "corp_credits",
      "corp_trace_bit_pool",
      "corp_trace_counter_pool",
    ]);

    const receipt = payCorpTraceBidQuote(deps, state, trace, quote);
    const payload = corpTracePaymentPublicPayload(trace, quote, receipt);

    expect(receipt).toMatchObject({
      fortTraceBitPoolSpent: 2,
      corpCreditsSpent: 2,
      corpTraceBitsSpent: 1,
      corpTraceCountersSpent: 1,
    });
    expect(payload).toMatchObject({
      corpBid: 6,
      corpCreditBid: 2,
      parisCityGridPoolSpent: 2,
      parisCityGridPoolRemaining: 0,
      parisCityGridPoolServerId: "remote_1",
      recurringTraceCreditPoolSpent: 1,
      hackerTrackerCountersSpent: 1,
      traceHostedCreditBoost: 1,
    });
    expect(state.corp.credits).toBe(0);
    expect(fortBits).toBe(0);
    expect(corpTraceBits).toBe(0);
    expect(corpTraceCounters).toBe(1);
  });

  it("rejects stale Corp trace pool quotes when source availability changes", () => {
    const trace = corpBidTrace({
      fortTraceBitPoolSourceCardInstanceId: "fort_pool_1" as CardInstanceId,
      fortTraceBitPoolServerId: "remote_1",
    });
    const state = stateForTrace(trace, { corpCredits: 1 });
    let fortBits = 2;
    const deps = corpDeps({
      fortTraceBitPoolTotal: () => fortBits,
      spendFortTraceBitPool: () => 0,
      cardCounter: () => fortBits,
    });
    const quote = quoteCorpTraceBidPayment(deps, state, trace, 2);

    fortBits = 1;

    expect(() => payCorpTraceBidQuote(deps, state, trace, quote)).toThrow(
      /nicht mehr gueltig/,
    );
  });

  it("quotes and spends Runner trace-link pools without a Hells Run payment kind", () => {
    const pkId = "pk_1" as CardInstanceId;
    const hellsId = "hells_1" as CardInstanceId;
    const pkDefinitionId = "pk_6089a" as CardDefinitionId;
    const hellsDefinitionId = "hells_run" as CardDefinitionId;
    const trace = runnerBidTrace();
    const state = stateForTrace(trace, { runnerCredits: 2 });
    const hostedCredits = new Map<CardInstanceId, number>([
      [pkId, 1],
      [hellsId, 1],
    ]);
    const deps = runnerDeps({
      runnerTraceLinkCreditSources: () => [
        { sourceCardInstanceId: pkId, sourceDefinitionId: pkDefinitionId },
        {
          sourceCardInstanceId: hellsId,
          sourceDefinitionId: hellsDefinitionId,
          publicKind: "runner_trace_link_bonus_credit",
        },
      ],
      hostedPaymentCredits: (_state, cardId) => hostedCredits.get(cardId) ?? 0,
      spendHostedPaymentCredits: (_state, cardId, amount) => {
        hostedCredits.set(cardId, (hostedCredits.get(cardId) ?? 0) - amount);
      },
      definitionIdForCard: (_state, cardId) =>
        cardId === hellsId ? hellsDefinitionId : pkDefinitionId,
    });

    const quote = quoteRunnerTraceBidPayment(deps, state, 4);

    expect(quote).toMatchObject({
      canPay: true,
      traceLinkCreditsToPay: 2,
      bonusTraceLinkCreditsToPay: 1,
      normalCreditsToPay: 2,
    });
    expect(quote.breakdown.map((entry) => entry.kind)).toEqual([
      "runner_trace_link_credit",
      "runner_trace_link_credit",
      "runner_credits",
    ]);
    expect(quote.breakdown[1]).toMatchObject({
      publicKind: "runner_trace_link_bonus_credit",
    });

    const receipt = payRunnerTraceBidQuote(deps, state, quote);
    const payload = runnerTracePaymentPublicPayload(receipt);

    expect(receipt).toMatchObject({
      traceLinkCreditsSpent: 2,
      bonusTraceLinkCreditsSpent: 1,
      runnerCreditsSpent: 2,
      sourceDefinitionIds: [hellsDefinitionId, pkDefinitionId],
    });
    expect(payload).toMatchObject({
      traceLinkCreditsSpent: 2,
      bonusTraceLinkCreditsSpent: 1,
      runnerCreditsSpent: 2,
      traceLinkCreditSourceDefinitionIds: "hells_run,pk_6089a",
    });
    expect(hostedCredits.get(pkId)).toBe(0);
    expect(hostedCredits.get(hellsId)).toBe(0);
    expect(state.runner.credits).toBe(0);
  });
});

function corpDeps(
  overrides: Partial<CorpTracePaymentDependencies> = {},
): CorpTracePaymentDependencies {
  return {
    encounterTemporaryTraceCreditsAvailable: () => 0,
    spendEncounterTemporaryTraceCredits: () => 0,
    fortTraceBitPoolTotal: () => 0,
    spendFortTraceBitPool: () => 0,
    corpCreditsAvailable: (state) => state.corp.credits,
    spendCorpCredits: (state, amount) => {
      state.corp.credits -= amount;
    },
    corpTraceBitPoolTotal: () => 0,
    spendCorpTraceBitPool: () => 0,
    corpTraceCounterPoolTotal: () => 0,
    spendCorpTraceCounterPool: () => 0,
    cardCounter: () => 0,
    ...overrides,
  };
}

function runnerDeps(
  overrides: Partial<RunnerTracePaymentDependencies> = {},
): RunnerTracePaymentDependencies {
  return {
    runnerTraceLinkCreditSources: () => [],
    hostedPaymentCredits: () => 0,
    spendHostedPaymentCredits: () => undefined,
    runnerCreditsAvailable: (state) => state.runner.credits,
    spendRunnerCredits: (state, amount) => {
      state.runner.credits -= amount;
    },
    recordRunnerRunCreditSpend: () => undefined,
    recordRunActionSpendingCapSpend: () => undefined,
    definitionIdForCard: (state, cardId) =>
      state.cardInstances[cardId]!.definitionId,
    ...overrides,
  };
}

function stateForTrace(
  trace: TraceState,
  options: { corpCredits?: number; runnerCredits?: number } = {},
): GameState {
  return {
    stateVersion: 1,
    randomCounter: 0,
    activeSide: "corp",
    phase: "corp_action_phase",
    timingPoint: "corp_action.main",
    corp: {
      credits: options.corpCredits ?? 0,
    },
    runner: {
      credits: options.runnerCredits ?? 0,
    },
    trace,
    cardInstances: {},
  } as unknown as GameState;
}

function corpBidTrace(extras: Partial<TraceState> = {}): TraceState {
  return {
    traceId: "trace_1",
    sourceCardInstanceId: "source_1" as CardInstanceId,
    sourceDefinitionId: "trace_source" as CardDefinitionId,
    baseTraceStrength: 2,
    status: "corp_bid",
    successEffect: { type: "add_tag", amount: 1 },
    ...extras,
  };
}

function runnerBidTrace(extras: Partial<TraceState> = {}): TraceState {
  return {
    ...corpBidTrace(),
    status: "runner_bid",
    ...extras,
  };
}
