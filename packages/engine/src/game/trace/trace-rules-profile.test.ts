import type { TraceState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  traceComparisonIsSuccessful,
  traceCorpBaseStrength,
  traceRulesDefinition,
} from "./trace-rules-profile";
import { describeTraceResultFromTrace } from "./trace-result";

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
    traceId: "trace_1",
    sourceCardInstanceId: "source_1",
    sourceDefinitionId: "source",
    traceRulesProfile,
    traceLimit,
    status: "runner_bid",
    successEffect: { type: "add_tag", amount: 1 },
  } as TraceState;
}
