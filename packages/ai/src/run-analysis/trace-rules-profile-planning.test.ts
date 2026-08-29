import { describe, expect, it } from "vitest";
import type {
  VisibleEffectiveIceRunQuote,
  VisibleEffectiveSubroutine,
  VisibleRunnerTraceSupportQuote,
} from "@netgrid/shared";

import {
  traceBaseStrengthForVisibleSubroutine,
  visibleCorpTraceBidCapacityForSubroutine,
  visibleRunnerTraceSupport,
  visibleTraceAvoidanceForBaseStrength,
} from "./visible-run-hazards";

describe("trace rules profile planning", () => {
  it("keeps Modern Open generic credit-per-link planning", () => {
    const support = visibleRunnerTraceSupport(
      supportQuote({ baseLink: 3 }),
      5,
      0,
      { traceRulesProfile: "modern_open" },
    );

    expect(support.runnerTraceCapacity).toBe(8);
    expect(
      visibleTraceAvoidanceForBaseStrength(6, support).cheapestAffordableSafe,
    ).toMatchObject({ traceBidCost: 3, creditCost: 3 });
  });

  it("prices Bakdoor by its printed 2 credits for +1 Link in Classic", () => {
    const support = visibleRunnerTraceSupport(
      supportQuote({
        baseLink: 3,
        sourceDefinitionId: "onr_v1_004_bakdoor",
      }),
      5,
      0,
      { traceRulesProfile: "classic_blind" },
    );

    expect(support.runnerTraceCapacity).toBe(5);
    expect(
      visibleTraceAvoidanceForBaseStrength(5, support).cheapestAffordableSafe,
    ).toMatchObject({ traceBidCost: 4, creditCost: 4 });
    expect(
      visibleTraceAvoidanceForBaseStrength(6, support).cheapestAffordableSafe,
    ).toBeUndefined();
  });

  it("does not invent extra Classic Link for Access Through Alpha", () => {
    const support = visibleRunnerTraceSupport(
      supportQuote({
        baseLink: 9,
        activationCost: 1,
        sourceDefinitionId: "onr_v1_148_access-through-alpha",
      }),
      10,
      0,
      { traceRulesProfile: "classic_blind_corp_ties" },
    );

    expect(support.runnerTraceCapacity).toBe(9);
    expect(
      visibleTraceAvoidanceForBaseStrength(9, support).cheapestAffordableSafe,
    ).toBeUndefined();
  });

  it("applies the selected profile tie rule to Runner avoidance", () => {
    const quote = supportQuote({ baseLink: 2 });
    const runnerTies = visibleRunnerTraceSupport(quote, 0, 0, {
      traceRulesProfile: "classic_blind",
    });
    const corpTies = visibleRunnerTraceSupport(quote, 0, 0, {
      traceRulesProfile: "classic_blind_corp_ties",
    });

    expect(
      visibleTraceAvoidanceForBaseStrength(2, runnerTies)
        .cheapestAffordableSafe,
    ).toMatchObject({ traceBidCost: 0, creditCost: 0 });
    expect(
      visibleTraceAvoidanceForBaseStrength(2, corpTies).cheapestAffordableSafe,
    ).toBeUndefined();
  });

  it("uses printed Trace as Modern base but as Classic Corp bid limit", () => {
    const subroutine = {
      id: "trace_5",
      type: "initiate_trace",
      traceLimit: 5,
    } as VisibleEffectiveSubroutine;
    const quote = {
      encounterTemporaryTraceCredits: 0,
    } as VisibleEffectiveIceRunQuote;

    expect(traceBaseStrengthForVisibleSubroutine(subroutine, "modern_open")).toBe(
      5,
    );
    expect(
      visibleCorpTraceBidCapacityForSubroutine(
        quote,
        subroutine,
        8,
        "modern_open",
      ),
    ).toBe(8);
    expect(
      traceBaseStrengthForVisibleSubroutine(subroutine, "classic_blind"),
    ).toBe(0);
    expect(
      visibleCorpTraceBidCapacityForSubroutine(
        quote,
        subroutine,
        8,
        "classic_blind",
      ),
    ).toBe(5);
  });

  it("moves Base Link card modifiers out of the Classic post-reveal window", () => {
    const quote = supportQuote(
      {
        baseLink: 3,
        sourceDefinitionId: "onr_v1_004_bakdoor",
      },
      [
        {
          sourceCardInstanceId: "bakdoor_1",
          sourceDefinitionId: "onr_v1_004_bakdoor",
          sourceTitle: "Bakdoor",
          linkDelta: 1,
          activationCost: 2,
          tapSource: false,
          trashSource: false,
          safeForAccess: true,
          useLimit: { kind: "repeatable_while_legal" },
        },
        {
          sourceCardInstanceId: "signpost_1",
          sourceDefinitionId: "synthetic_signpost",
          sourceTitle: "Signpost-like",
          linkDelta: 2,
          activationCost: 1,
          tapSource: false,
          trashSource: false,
          safeForAccess: true,
          useLimit: { kind: "once_per_trace" },
        },
      ],
    );

    const classic = visibleRunnerTraceSupport(quote, 5, 0, {
      traceRulesProfile: "classic_blind_corp_ties",
    });
    const modern = visibleRunnerTraceSupport(quote, 5, 0, {
      traceRulesProfile: "modern_open",
    });

    expect(classic.postBidLinkOptions.map((option) => option.sourceTitle)).toEqual([
      "Signpost-like",
    ]);
    expect(modern.postBidLinkOptions.map((option) => option.sourceTitle)).toEqual([
      "Bakdoor",
      "Signpost-like",
    ]);
  });
});

function supportQuote(
  base: {
    baseLink: number;
    activationCost?: number;
    sourceDefinitionId?: string;
  },
  postBidLinkOptions: VisibleRunnerTraceSupportQuote["postBidLinkOptions"] = [],
): VisibleRunnerTraceSupportQuote {
  return {
    traceCreditPool: 0,
    traceCreditSources: [],
    baseLinkOptions: [
      {
        baseLink: base.baseLink,
        activationCost: base.activationCost ?? 0,
        safeForAccess: true,
        ...(base.sourceDefinitionId
          ? {
              sourceDefinitionId: base.sourceDefinitionId,
              sourceTitle: base.sourceDefinitionId,
            }
          : {}),
      },
    ],
    postBidLinkOptions,
    traceSuccessCancelOptions: [],
  };
}
