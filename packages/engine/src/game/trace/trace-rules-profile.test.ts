import type { TraceState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  traceComparisonIsSuccessful,
  traceCorpBaseStrength,
  traceRulesDefinition,
} from "./trace-rules-profile";
import { createGame } from "../create-game";
import { describeTraceResultFromTrace, isTraceSuccessful, traceCorpValue, traceRunnerStrength } from "./trace-result";
import { describeCurrentTraceWindow, requireCurrentTrace, requireTracePhase, traceIsInPhase } from "./trace-state";

describe("trace rules profiles", () => {
  it("models Modern Open with printed strength, generic link payment, and Runner ties", () => {
    expect(traceRulesDefinition("modern_open")).toMatchObject({
      corpBaseStrengthMode: "printed_trace",
      corpBidLimitMode: "payment_capacity",
      corpBidVisibility: "immediate",
      runnerLinkSpendMode: "generic_credit_per_link",
      tieWinner: "runner",
    });
    expect(traceCorpBaseStrength(trace("modern_open", 3))).toBe(3);
    expect(traceComparisonIsSuccessful("modern_open", 3, 3)).toBe(false);
  });

  it("models Classic Blind without free strength and with printed card link modifiers", () => {
    expect(traceRulesDefinition("classic_blind")).toMatchObject({
      resolutionMode: "hidden_commit_reveal",
      corpBaseStrengthMode: "none",
      corpBidLimitMode: "effective_trace_limit",
      runnerLinkSpendMode: "printed_card_modifiers",
      tieWinner: "runner",
    });
    expect(traceCorpBaseStrength(trace("classic_blind", 3))).toBe(0);
    expect(traceComparisonIsSuccessful("classic_blind", 3, 3)).toBe(false);
  });

  it("changes only the tie winner for Classic Blind Corp Ties", () => {
    expect(traceRulesDefinition("classic_blind_corp_ties")).toEqual({
      ...traceRulesDefinition("classic_blind"),
      profile: "classic_blind_corp_ties",
      tieWinner: "corp",
    });
    expect(traceComparisonIsSuccessful("classic_blind_corp_ties", 3, 3)).toBe(
      true,
    );
  });

  it("keeps Classic payment amount separate from the card-derived Runner strength", () => {
    expect(
      describeTraceResultFromTrace({
        ...trace("modern_open", 3),
        corpBid: 4,
        runnerLink: 2,
        runnerBid: 5,
      }),
    ).toMatchObject({ traceValue: 7, runnerStrength: 7, successful: false });
    expect(
      describeTraceResultFromTrace({
        ...trace("classic_blind_corp_ties", 3),
        corpBid: 3,
        runnerLink: 3,
        runnerBid: 4,
        runnerStrength: 3,
      }),
    ).toMatchObject({
      traceValue: 3,
      runnerBid: 4,
      runnerStrength: 3,
      successful: true,
    });
  });
});

function trace(
  traceRulesProfile: NonNullable<TraceState["traceRulesProfile"]>,
  traceLimit: number,
): TraceState {
  return {
    traceId: 1,
    sourceCardInstanceId: "source_1",
    sourceDefinitionId: 466571496,
    traceRulesProfile,
    traceLimit,
    status: "runner_bid",
    successEffect: { type: "add_tag", amount: 1 },
  } as TraceState;
}

describe("trace state and result projection", () => {
  it("guards and describes the current trace window without mutating state", () => {
    const state = createGame({
      seed: "arch-12-trace-state-guards",
      setupMode: "completed",
    });

    expect(() => requireCurrentTrace(state)).toThrow("Kein aktiver Trace.");

    state.trace = {
      traceId: 1,
      sourceCardInstanceId: state.runner.identity,
      sourceDefinitionId: 2958753808,
      traceLimit: 2,
      status: "corp_bid",
      successEffect: { type: "add_tag", amount: 1 },
    };

    expect(requireCurrentTrace(state)).toBe(state.trace);
    expect(requireTracePhase(state, "corp_bid")).toBe(state.trace);
    expect(traceIsInPhase(state, "corp_bid")).toBe(true);
    expect(traceIsInPhase(state, "runner_bid")).toBe(false);
    expect(() => requireTracePhase(state, "runner_bid")).toThrow(
      "Es ist kein Runner-Trace-Bid offen.",
    );
    expect(describeCurrentTraceWindow(state)).toMatchObject({
      traceId: 1,
      phase: "corp_bid",
      traceLimit: 2,
      hasCorpBid: false,
      hasRunnerBid: false,
      postBidLinkSourceIds: [],
    });
  });

  it("describes trace results without mutating state", () => {
    const trace = {
      traceId: 1,
      sourceCardInstanceId: "runner-identity",
      sourceDefinitionId: 2958753808,
      traceRulesProfile: "classic_blind_corp_ties",
      traceLimit: 4,
      status: "post_bid_link",
      successEffect: { type: "add_tag", amount: 1 },
      corpBid: 2,
      traceValue: 6,
      runnerLink: 3,
      baseLinkValue: 1,
      runnerBid: 2,
      runnerStrength: 6,
      postBidLinkBonus: 1,
      postBidLinkSourceIds: ["link-source"],
    } as NonNullable<ReturnType<typeof createGame>["trace"]>;
    const before = structuredClone(trace);

    expect(traceCorpValue(trace)).toBe(6);
    expect(traceRunnerStrength(trace)).toBe(6);
    expect(isTraceSuccessful(trace)).toBe(true);
    expect(describeTraceResultFromTrace(trace)).toEqual({
      traceLimit: 4,
      corpBid: 2,
      traceValue: 6,
      baseLinkValue: 1,
      runnerLink: 3,
      runnerBid: 2,
      postBidLinkValue: 1,
      runnerStrength: 6,
      successful: true,
    });
    expect(trace).toEqual(before);
  });

  it("starts a Classic Corp-ties trace at zero and keeps ties Corp-favorable", () => {
    const trace = {
      traceId: 2,
      sourceCardInstanceId: "runner-identity",
      sourceDefinitionId: 2958753808,
      traceRulesProfile: "classic_blind_corp_ties",
      traceLimit: 5,
      status: "post_bid_link",
      successEffect: { type: "add_tag", amount: 1 },
      corpBid: 1,
      runnerBid: 1,
    } as NonNullable<ReturnType<typeof createGame>["trace"]>;

    expect(
      describeTraceResultFromTrace(trace, { runnerLinkFallback: 0 }),
    ).toEqual({
      traceLimit: 5,
      corpBid: 1,
      traceValue: 1,
      baseLinkValue: 0,
      runnerLink: 0,
      runnerBid: 1,
      postBidLinkValue: 0,
      runnerStrength: 1,
      successful: true,
    });
  });
});
