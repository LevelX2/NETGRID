import { describe, expect, it } from "vitest";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
  runnerKnownPathAssessmentIsCostNoAccess,
  runnerKnownPathAssessmentIsKnownNoAccess,
  runnerKnownPathAssessmentIsUnbreakableNoAccess,
  serverIdFromEvent,
  type KnownRezzedIcePathAssessment,
} from "./visible-run-analysis";
import type {
  PublicGameEvent,
  VisibleCard,
  VisibleRunnerTraceSupportQuote,
} from "@netgrid/shared";
import { quoteRunnerRunRoute } from "./run-analysis/runner-run-route-quote";
import {
  canBreakerDefinitionBreakIce,
  canVisibleBreakerBreakQuotedSubroutines,
  creditsToBreakVisibleSubroutinesWithBreaker,
  minimumCreditsToBreakVisibleSubroutines,
} from "./run-analysis/visible-run-breaker-path";
import {
  visibleRunnerTraceSupport,
  visibleTraceAvoidanceForBaseStrength,
  visibleTracePostBidSelections,
} from "./run-analysis/visible-run-hazards";

function knownPathAssessment(
  overrides: Partial<KnownRezzedIcePathAssessment> = {},
): KnownRezzedIcePathAssessment {
  return {
    blocked: false,
    canReachAccess: true,
    knownPathBlockedByUnbreakableIce: false,
    knownPathBlockedByMissingCoverage: false,
    knownPathBlockedByEtr: false,
    creditsAfterPath: 0,
    canBreakNextIceButNotFullPath: false,
    hasBypassOrSpecialAccessPlan: false,
    creditsSpentBeforeUnpayableIce: 0,
    assessedKnownIceCount: 0,
    ...overrides,
  };
}

function event(publicPayload: Record<string, unknown>): PublicGameEvent {
  return {
    eventId: `event-${JSON.stringify(publicPayload)}`,
    type: "start_run",
    stateVersionBefore: 1,
    stateVersionAfter: 2,
    stateHashAfter: "test-hash",
    publicPayload,
  };
}

describe("visible run analysis known-path classification", () => {
  it("fails loudly instead of reconstructing a missing quote for known rezzed ICE", () => {
    const ice = classicWallIce("missing-authoritative-quote");
    delete ice.effectiveRunQuote;
    expect(() => assessKnownRezzedIcePath([ice], [], 5)).toThrow(
      "missing its authoritative effective run quote",
    );
  });

  it("classifies cost-blocked known no-access paths", () => {
    expect(
      runnerKnownPathAssessmentIsCostNoAccess(
        knownPathAssessment({ unpayableReason: "ice_unaffordable" }),
      ),
    ).toBe(true);
    expect(
      runnerKnownPathAssessmentIsCostNoAccess(
        knownPathAssessment({
          unpayableReason: "later_ice_unaffordable_after_prior_ice_cost",
        }),
      ),
    ).toBe(true);
    expect(
      runnerKnownPathAssessmentIsCostNoAccess(
        knownPathAssessment({ unpayableReason: "ice_unbreakable" }),
      ),
    ).toBe(false);
  });

  it("classifies unbreakable known no-access paths", () => {
    expect(
      runnerKnownPathAssessmentIsUnbreakableNoAccess(
        knownPathAssessment({ unpayableReason: "ice_unbreakable" }),
      ),
    ).toBe(true);
    expect(
      runnerKnownPathAssessmentIsUnbreakableNoAccess(
        knownPathAssessment({ knownPathBlockedByUnbreakableIce: true }),
      ),
    ).toBe(true);
    expect(
      runnerKnownPathAssessmentIsUnbreakableNoAccess(
        knownPathAssessment({ knownPathBlockedByMissingCoverage: true }),
      ),
    ).toBe(true);
    expect(
      runnerKnownPathAssessmentIsUnbreakableNoAccess(
        knownPathAssessment({ unpayableReason: "ice_unaffordable" }),
      ),
    ).toBe(false);
  });

  it("keeps the aggregate known no-access predicate as the shared union", () => {
    expect(
      runnerKnownPathAssessmentIsKnownNoAccess(
        knownPathAssessment({ unpayableReason: "ice_unaffordable" }),
      ),
    ).toBe(true);
    expect(
      runnerKnownPathAssessmentIsKnownNoAccess(
        knownPathAssessment({ knownPathBlockedByMissingCoverage: true }),
      ),
    ).toBe(true);
    expect(
      runnerKnownPathAssessmentIsKnownNoAccess(knownPathAssessment()),
    ).toBe(false);
  });
});

describe("visible run analysis server ids", () => {
  it("uses structured event server ids and ignores label-only server text", () => {
    expect(
      serverIdFromEvent(event({ serverLabel: "Remote 1" })),
    ).toBeUndefined();
    expect(serverIdFromEvent(event({ serverLabel: "R&D" }))).toBeUndefined();
    expect(serverIdFromEvent(event({ serverId: "remote_1" }))).toBe("remote_1");
    expect(serverIdFromEvent(event({ attackedServerId: "rd" }))).toBe("rd");
  });
});

describe("visible run analysis targeted breaker paths", () => {
  it("keeps definition-level coverage independent of random breaker strength", () => {
    expect(
      canBreakerDefinitionBreakIce("simple_decoder", "simple_code_gate_ice"),
    ).toBe(true);
    expect(
      canBreakerDefinitionBreakIce("simple_decoder", "simple_barrier_ice"),
    ).toBe(false);
    expect(
      canBreakerDefinitionBreakIce("onr_v1_002_ai-boon", "onr_v1_249_hunter"),
    ).toBe(true);
    expect(
      canBreakerDefinitionBreakIce(
        "onr_proteus_087_forwards-legacy",
        "onr_v1_249_hunter",
      ),
    ).toBe(true);
  });

  it("carries Bulldozer's fully-broken-wall free break to the next sentry", () => {
    const wall = classicWallIce("outer-wall");
    const sentry: VisibleCard = {
      instanceId: "inner-sentry",
      definitionId: "onr_v1_249_hunter",
      side: "corp",
      type: "ice",
      known: true,
      rezzed: true,
      strength: 5,
      subtypes: ["sentry"],
      effectiveRunQuote: {
        iceInstanceId: "inner-sentry",
        iceDefinitionId: "onr_v1_249_hunter",
        effectiveStrength: 5,
        subroutines: [{ id: "inner-sentry:etr", type: "end_the_run" }],
      },
    };
    const bulldozer: VisibleCard = {
      instanceId: "bulldozer",
      definitionId: "onr_proteus_082_bulldozer",
      side: "runner",
      type: "program",
      known: true,
      strength: 5,
      subtypes: ["icebreaker", "fracter"],
    };

    const assessment = assessKnownRezzedIcePath([sentry, wall], [bulldozer], 1);

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleBreakCost: 1,
      creditsAfterPath: 0,
    });
  });

  it("does not create Bulldozer's free break after only part of a wall", () => {
    const partiallyBrokenWall: VisibleCard = {
      ...classicWallIce("outer-partial-wall"),
      effectiveRunQuote: {
        iceInstanceId: "outer-partial-wall",
        iceDefinitionId: "onr_v1_232_crystal-wall",
        effectiveStrength: 3,
        subroutines: [
          { id: "outer-partial-wall:etr", type: "end_the_run" },
          {
            id: "outer-partial-wall:future",
            type: "set_run_future_strength_bonus",
            amount: 1,
          },
        ],
      },
    };
    const sentry = sentryEndTheRunIce("inner-partial-sentry");

    const assessment = assessKnownRezzedIcePath(
      [sentry, partiallyBrokenWall],
      [bulldozerBreaker("bulldozer")],
      1,
    );

    expect(assessment).toMatchObject({
      blocked: true,
      canReachAccess: false,
      unpayableReason: "ice_unbreakable",
    });
  });

  it("uses exactly one Bulldozer free break on a multi-subroutine sentry", () => {
    const bulldozer = bulldozerBreaker("bulldozer-free");
    const aiBoon: VisibleCard = {
      instanceId: "ai-boon-free",
      definitionId: "onr_v1_002_ai-boon",
      side: "runner",
      type: "program",
      known: true,
      strength: 5,
      randomRunStrengthState: { status: "unresolved" },
      subtypes: ["icebreaker", "killer"],
    };
    const assessment = minimumCreditsToBreakVisibleSubroutines(
      { definitionId: "onr_v1_249_hunter", subtypes: ["sentry"], strength: 5 },
      [bulldozer, aiBoon],
      [
        { id: "sentry:one", type: "end_the_run" },
        { id: "sentry:two", type: "end_the_run" },
        { id: "sentry:three", type: "end_the_run" },
      ],
      new Map(),
      0,
      [
        {
          sourceBreakerInstanceId: bulldozer.instanceId,
          iceSubtype: "sentry",
          remainingUses: 1,
          mustBeNextEncounteredIce: true,
        },
      ],
    );

    expect(assessment).toMatchObject({
      cost: 2,
      consumedPendingFreeBreak: true,
      consumedPendingFreeBreakSourceBreakerInstanceId: bulldozer.instanceId,
      breakerInstanceId: aiBoon.instanceId,
    });
  });

  it("consumes the Bulldozer grant instead of retaining it on the paid breaker", () => {
    const bulldozer = bulldozerBreaker("bulldozer-source");
    const aiBoon: VisibleCard = {
      instanceId: "ai-boon-paid",
      definitionId: "onr_v1_002_ai-boon",
      side: "runner",
      type: "program",
      known: true,
      strength: 5,
      randomRunStrengthState: { status: "unresolved" },
      subtypes: ["icebreaker", "killer"],
    };
    const mixedSentry: VisibleCard = {
      ...sentryEndTheRunIce("middle-mixed-sentry"),
      effectiveRunQuote: {
        iceInstanceId: "middle-mixed-sentry",
        iceDefinitionId: "onr_v1_249_hunter",
        effectiveStrength: 5,
        subroutines: [
          { id: "middle-mixed-sentry:etr-1", type: "end_the_run" },
          { id: "middle-mixed-sentry:etr-2", type: "end_the_run" },
        ],
      },
    };

    const assessment = assessKnownRezzedIcePath(
      [
        sentryEndTheRunIce("inner-paid-sentry"),
        mixedSentry,
        classicWallIce("outer-wall-source"),
      ],
      [bulldozer, aiBoon],
      3,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleBreakCost: 3,
      creditsAfterPath: 0,
    });
  });

  it("charges Bulldozer's stealth consequence for every broken wall subroutine", () => {
    const assessment = creditsToBreakVisibleSubroutinesWithBreaker(
      bulldozerBreaker("bulldozer-stealth"),
      {
        definitionId: "onr_v1_232_crystal-wall",
        subtypes: ["wall"],
        strength: 3,
      },
      [
        { id: "bulldozer-stealth:one", type: "end_the_run" },
        { id: "bulldozer-stealth:two", type: "end_the_run" },
      ],
    );

    expect(assessment).toMatchObject({
      cost: 2,
      postBreakStealthLosses: [
        expect.objectContaining({ amount: 2, occurrences: 2 }),
      ],
    });
  });

  it("expires Bulldozer's free break when the next encountered ICE is not a sentry", () => {
    const harmlessCodeGate: VisibleCard = {
      instanceId: "middle-code-gate",
      definitionId: "onr_classic_014_trapdoor",
      side: "corp",
      type: "ice",
      known: true,
      rezzed: true,
      strength: 0,
      subtypes: ["code_gate"],
      effectiveRunQuote: {
        iceInstanceId: "middle-code-gate",
        iceDefinitionId: "onr_classic_014_trapdoor",
        effectiveStrength: 0,
        subroutines: [],
      },
    };

    const assessment = assessKnownRezzedIcePath(
      [
        sentryEndTheRunIce("inner-expired-sentry"),
        harmlessCodeGate,
        classicWallIce("outer-wall"),
      ],
      [bulldozerBreaker("bulldozer")],
      1,
    );

    expect(assessment).toMatchObject({
      blocked: true,
      canReachAccess: false,
      unpayableReason: "ice_unbreakable",
    });
  });

  it("carries Snowball strength from every broken subroutine to the next ICE", () => {
    const outerSentry: VisibleCard = {
      ...sentryEndTheRunIce("outer-snowball-sentry"),
      effectiveRunQuote: {
        iceInstanceId: "outer-snowball-sentry",
        iceDefinitionId: "onr_v1_249_hunter",
        effectiveStrength: 2,
        subroutines: [
          { id: "outer-snowball-sentry:etr-1", type: "end_the_run" },
          { id: "outer-snowball-sentry:etr-2", type: "end_the_run" },
        ],
      },
      strength: 2,
    };
    const innerSentry: VisibleCard = {
      ...sentryEndTheRunIce("inner-snowball-sentry"),
      effectiveRunQuote: {
        iceInstanceId: "inner-snowball-sentry",
        iceDefinitionId: "onr_v1_249_hunter",
        effectiveStrength: 4,
        subroutines: [{ id: "inner-snowball-sentry:etr", type: "end_the_run" }],
      },
      strength: 4,
    };
    const snowball: VisibleCard = {
      instanceId: "snowball",
      definitionId: "onr_v1_066_snowball",
      side: "runner",
      type: "program",
      known: true,
      strength: 2,
      subtypes: ["icebreaker", "killer"],
    };

    const assessment = assessKnownRezzedIcePath(
      [innerSentry, outerSentry],
      [snowball],
      3,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleBreakCost: 3,
      creditsAfterPath: 0,
    });
  });

  it("keeps Grubb's paid run-strength for the next wall", () => {
    const outerWall: VisibleCard = {
      ...classicWallIce("outer-grubb-wall"),
      strength: 2,
      effectiveRunQuote: {
        ...classicWallIce("outer-grubb-wall").effectiveRunQuote!,
        effectiveStrength: 2,
      },
    };
    const innerWall: VisibleCard = {
      ...classicWallIce("inner-grubb-wall"),
      strength: 2,
      effectiveRunQuote: {
        ...classicWallIce("inner-grubb-wall").effectiveRunQuote!,
        effectiveStrength: 2,
      },
    };
    const grubb: VisibleCard = {
      instanceId: "grubb",
      definitionId: "onr_v1_030_grubb",
      side: "runner",
      type: "program",
      known: true,
      strength: 0,
      subtypes: ["icebreaker", "worm"],
    };

    const assessment = assessKnownRezzedIcePath(
      [innerWall, outerWall],
      [grubb],
      6,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleBreakCost: 6,
      creditsAfterPath: 0,
    });
  });

  it("chooses Fubar's subtype once for the entire known run", () => {
    const fubar: VisibleCard = {
      instanceId: "fubar",
      definitionId: "onr_proteus_088_fubar",
      side: "runner",
      type: "program",
      known: true,
      strength: 5,
      subtypes: ["icebreaker"],
    };

    const selectable = assessKnownRezzedIcePath(
      [sentryEndTheRunIce("fubar-sentry")],
      [fubar],
      1,
    );
    const fixedWall = assessKnownRezzedIcePath(
      [sentryEndTheRunIce("fubar-fixed-wall")],
      [{ ...fubar, selectedSubtype: "wall" }],
      1,
    );

    expect(selectable).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleBreakCost: 1,
    });
    expect(fixedWall).toMatchObject({
      blocked: true,
      canReachAccess: false,
      unpayableReason: "ice_unbreakable",
    });

    const mixedPath = assessKnownRezzedIcePath(
      [
        sentryEndTheRunIce("fubar-inner-sentry"),
        classicWallIce("fubar-outer-wall"),
      ],
      [fubar],
      2,
    );
    expect(mixedPath).toMatchObject({
      blocked: true,
      canReachAccess: false,
      unpayableReason: "ice_unbreakable",
    });
  });

  it("charges Fubar's structured stealth consequence for every broken subroutine", () => {
    const assessment = creditsToBreakVisibleSubroutinesWithBreaker(
      {
        instanceId: "fubar-stealth",
        definitionId: "onr_proteus_088_fubar",
        side: "runner",
        type: "program",
        known: true,
        strength: 5,
        selectedSubtype: "wall",
        subtypes: ["icebreaker"],
      },
      {
        definitionId: "onr_v1_232_crystal-wall",
        subtypes: ["wall"],
        strength: 3,
      },
      [
        { id: "fubar-stealth:one", type: "end_the_run" },
        { id: "fubar-stealth:two", type: "end_the_run" },
      ],
    );

    expect(assessment).toMatchObject({
      cost: 2,
      postBreakStealthLosses: [
        expect.objectContaining({ amount: 1, occurrences: 2 }),
      ],
    });
  });

  it("uses Morphing Tool's installed subtype without changing it during a run", () => {
    const morphingTool: VisibleCard = {
      instanceId: "morphing-tool",
      definitionId: "onr_proteus_092_morphing-tool",
      side: "runner",
      type: "program",
      known: true,
      strength: 5,
      subtypes: ["icebreaker"],
      selectedSubtype: "wall",
    };

    const wallRoute = assessKnownRezzedIcePath(
      [classicWallIce("morphing-wall")],
      [morphingTool],
      2,
    );
    const sentryRoute = assessKnownRezzedIcePath(
      [sentryEndTheRunIce("morphing-sentry")],
      [morphingTool],
      2,
    );

    expect(wallRoute).toMatchObject({ blocked: false, canReachAccess: true });
    expect(sentryRoute).toMatchObject({
      blocked: true,
      canReachAccess: false,
      unpayableReason: "ice_unbreakable",
    });
  });

  it("plans Morphing Tool's subtype change only as a funded pre-run action", () => {
    const morphingTool: VisibleCard = {
      instanceId: "morphing-tool-prep",
      definitionId: "onr_proteus_092_morphing-tool",
      side: "runner",
      type: "program",
      known: true,
      strength: 5,
      subtypes: ["icebreaker"],
      selectedSubtype: "wall",
    };
    const ice = [sentryEndTheRunIce("morphing-prep-sentry")];

    expect(assessKnownRezzedIcePath(ice, [morphingTool], 3)).toMatchObject({
      blocked: true,
      canReachAccess: false,
    });
    expect(
      assessKnownRezzedIcePath(ice, [morphingTool], 3, [], 0, {
        availableRunnerClicks: 1,
      }),
    ).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleBreakCost: 3,
      preRunPreparation: {
        credits: 1,
        clicks: 1,
        subtypeChanges: [
          {
            sourceCardInstanceId: "morphing-tool-prep",
            sourceDefinitionId: "onr_proteus_092_morphing-tool",
            selectedSubtype: "sentry",
          },
        ],
      },
    });
    expect(
      assessKnownRezzedIcePath(ice, [morphingTool], 3, [], 0, {
        availableRunnerClicks: 0,
      }),
    ).toMatchObject({ blocked: true, canReachAccess: false });
    expect(
      assessKnownRezzedIcePath(ice, [morphingTool], 0, [], 0, {
        availableRunnerClicks: 1,
      }),
    ).toMatchObject({ blocked: true, canReachAccess: false });
  });

  it("does not count Dropp's legal break as an access route", () => {
    const dropp: VisibleCard = {
      instanceId: "dropp",
      definitionId: "onr_v1_019_dropp",
      side: "runner",
      type: "program",
      known: true,
      strength: 5,
      subtypes: ["icebreaker"],
    };

    const assessment = assessKnownRezzedIcePath(
      [sentryEndTheRunIce("dropp-sentry")],
      [dropp],
      0,
    );

    expect(assessment).toMatchObject({
      blocked: true,
      canReachAccess: false,
      unpayableReason: "ice_unbreakable",
    });
  });

  it("does not treat Blink's random break attempt as guaranteed access", () => {
    const blink: VisibleCard = {
      instanceId: "blink",
      definitionId: "onr_v1_007_blink",
      side: "runner",
      type: "program",
      known: true,
      strength: 99,
      subtypes: ["icebreaker"],
    };

    const assessment = assessKnownRezzedIcePath(
      [sentryEndTheRunIce("blink-sentry")],
      [blink],
      0,
    );

    expect(assessment).toMatchObject({
      blocked: true,
      canReachAccess: false,
      unpayableReason: "ice_unbreakable",
    });
  });

  it("consumes Evil Twin's visible prevention pool across multiple damage effects", () => {
    const evilTwin: VisibleCard = {
      instanceId: "evil-twin",
      definitionId: "onr_v1_023_evil-twin",
      side: "runner",
      type: "program",
      known: true,
      strength: 0,
      randomRunStrengthState: { status: "unresolved" },
      subtypes: ["icebreaker"],
    };

    const assessment = assessKnownRezzedIcePath(
      [traceDamageIce("inner-damage", 2), traceDamageIce("outer-damage", 2)],
      [evilTwin],
      0,
      [],
      0,
      { netOrCoreDamagePreventionRemaining: 2 },
    );

    expect(
      assessment.visibleIceRunHazards?.reduce(
        (sum, hazard) => sum + (hazard.expectedDamage ?? 0),
        0,
      ),
    ).toBe(2);
    expect(
      assessment.visibleIceRunHazards?.reduce(
        (sum, hazard) => sum + (hazard.damagePreventionApplied ?? 0),
        0,
      ),
    ).toBe(2);
  });

  it("keeps run-scoped damage prevention separate and consumes it across hazards", () => {
    const assessment = assessKnownRezzedIcePath(
      [
        traceDamageIce("inner-run-pool", 2),
        traceDamageIce("outer-run-pool", 2),
      ],
      [],
      0,
      [],
      0,
      {
        netOrCoreDamagePreventionRemaining: 1,
        runDamagePreventionRemaining: 2,
      },
    );

    expect(
      assessment.visibleIceRunHazards?.reduce(
        (sum, hazard) => sum + (hazard.expectedDamage ?? 0),
        0,
      ),
    ).toBe(1);
    expect(
      assessment.visibleIceRunHazards?.reduce(
        (sum, hazard) => sum + (hazard.freeDamagePreventionApplied ?? 0),
        0,
      ),
    ).toBe(1);
    expect(
      assessment.visibleIceRunHazards?.reduce(
        (sum, hazard) => sum + (hazard.runDamagePreventionApplied ?? 0),
        0,
      ),
    ).toBe(2);
  });

  it("marks a run-start random strength route as conditional instead of unavailable", () => {
    const forwardsLegacy: VisibleCard = {
      instanceId: "forwards-legacy",
      definitionId: "onr_proteus_087_forwards-legacy",
      side: "runner",
      type: "program",
      known: true,
      strength: 0,
      randomRunStrengthState: { status: "unresolved" },
      subtypes: ["icebreaker"],
    };

    const assessment = assessKnownRezzedIcePath(
      [sentryEndTheRunIce("legacy-sentry")],
      [forwardsLegacy],
      0,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      conditionalAccessReasons: ["visible_random_breaker_strength"],
    });
  });

  it("uses the visible random-breaker strength for quoted coverage", () => {
    const resolvedForwardsLegacy: VisibleCard = {
      instanceId: "resolved-forwards-legacy",
      definitionId: "onr_proteus_087_forwards-legacy",
      side: "runner",
      type: "program",
      known: true,
      strength: 3,
      randomRunStrengthState: {
        status: "resolved",
        actualStrength: 3,
        currentStrengthAdjustment: 0,
      },
      subtypes: ["icebreaker", "killer"],
    };
    const sentry = sentryEndTheRunIce("quoted-coverage-sentry");

    expect(
      canVisibleBreakerBreakQuotedSubroutines({
        breaker: resolvedForwardsLegacy,
        ice: sentry,
        subroutines: sentry.effectiveRunQuote!.subroutines,
      }),
    ).toBe(true);
    expect(
      canVisibleBreakerBreakQuotedSubroutines({
        breaker: resolvedForwardsLegacy,
        ice: {
          definitionId: "simple_code_gate_ice",
          subtypes: ["code_gate"],
        },
        subroutines: [{ id: "quoted-coverage-etr", type: "end_the_run" }],
      }),
    ).toBe(false);
    expect(
      canVisibleBreakerBreakQuotedSubroutines({
        breaker: {
          ...resolvedForwardsLegacy,
          strength: 4,
          randomRunStrengthState: { status: "unresolved" },
        },
        ice: sentry,
        subroutines: sentry.effectiveRunQuote!.subroutines,
      }),
    ).toBe(true);
  });

  it("marks Bartmoss use as a post-pass trash risk", () => {
    const bartmoss: VisibleCard = {
      instanceId: "bartmoss",
      definitionId: "onr_v1_005_bartmoss-memorial-icebreaker",
      side: "runner",
      type: "program",
      known: true,
      strength: 5,
      subtypes: ["icebreaker"],
    };

    const assessment = assessKnownRezzedIcePath(
      [sentryEndTheRunIce("bartmoss-sentry")],
      [bartmoss],
      1,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      conditionalRiskReasons: ["visible_breaker_may_trash_after_pass"],
    });

    const secondIceRequiresBartmoss = assessKnownRezzedIcePath(
      [
        sentryEndTheRunIce("bartmoss-inner-sentry"),
        sentryEndTheRunIce("bartmoss-outer-sentry"),
      ],
      [bartmoss],
      2,
    );
    expect(secondIceRequiresBartmoss).toMatchObject({
      blocked: false,
      canReachAccess: true,
      conditionalRiskReasons: ["visible_breaker_may_trash_after_pass"],
      postEncounterBreakerBranches: [
        {
          outcome: "breaker_retained",
          blocked: false,
          canReachAccess: true,
        },
        {
          outcome: "breaker_trashed",
          blocked: true,
          canReachAccess: false,
        },
      ],
    });
  });

  it("does not quote the known Coyote-Mastermind path as free after installing Black Widow", () => {
    const coyote = (instanceId: string): VisibleCard => ({
      instanceId,
      definitionId: "onr_proteus_016_coyote",
      side: "corp",
      type: "ice",
      known: true,
      rezzed: true,
      strength: 3,
      subtypes: ["sentry"],
      effectiveRunQuote: {
        iceInstanceId: instanceId,
        iceDefinitionId: "onr_proteus_016_coyote",
        effectiveStrength: 3,
        subroutines: [
          {
            id: `${instanceId}:tax`,
            type: "set_run_future_strength_bonus",
            amount: 1,
          },
        ],
      },
    });
    const mastermind: VisibleCard = {
      instanceId: "mastermind",
      definitionId: "onr_proteus_030_mastermind",
      side: "corp",
      type: "ice",
      known: true,
      rezzed: true,
      strength: 2,
      subtypes: ["ap", "black_ice", "sentry", "zombie"],
      effectiveRunQuote: {
        iceInstanceId: "mastermind",
        iceDefinitionId: "onr_proteus_030_mastermind",
        effectiveStrength: 2,
        subroutines: [
          { id: "mastermind:damage", type: "do_damage", amount: 2 },
          { id: "mastermind:etr", type: "end_the_run" },
        ],
      },
    };
    const blackWidow: VisibleCard = {
      instanceId: "black-widow",
      definitionId: "onr_proteus_080_black-widow",
      side: "runner",
      type: "program",
      known: true,
      strength: 2,
      subtypes: ["icebreaker", "killer"],
      selectedTargetCardId: "coyote-1",
    };

    const assessment = assessKnownRezzedIcePath(
      [mastermind, coyote("coyote-1"), coyote("coyote-2")],
      [blackWidow],
      0,
    );

    expect(assessment).toMatchObject({
      blocked: true,
      canReachAccess: false,
      knownPathBlockedByEtr: true,
    });
  });

  it("includes Canis Major's unbroken future-strength effect in the full pre-run path quote", () => {
    const innerCodeGate = classicCodeGateIce("inner-code-gate");
    const outerCanis: VisibleCard = {
      instanceId: "outer-canis-major",
      definitionId: "onr_v1_225_canis-major",
      title: "Canis Major",
      side: "corp",
      type: "ice",
      known: true,
      rezzed: true,
      strength: 4,
      subtypes: ["sentry", "watchdog"],
      effectiveRunQuote: {
        iceInstanceId: "outer-canis-major",
        iceDefinitionId: "onr_v1_225_canis-major",
        effectiveStrength: 4,
        subroutines: [
          {
            id: "outer-canis-major:future-strength",
            type: "set_run_future_strength_bonus",
            amount: 2,
            unbrokenRunEffect: { increasesFutureIceStrength: 2 },
          },
        ],
      },
    };

    const withoutFutureStrength = assessKnownRezzedIcePath(
      [innerCodeGate],
      [codecrackerBreaker("runner-codecracker")],
      3,
    );
    const withCanisFutureStrength = assessKnownRezzedIcePath(
      [innerCodeGate, outerCanis],
      [codecrackerBreaker("runner-codecracker")],
      3,
    );

    expect(withoutFutureStrength).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleBreakCost: 2,
      creditsAfterPath: 1,
    });
    expect(withCanisFutureStrength).toMatchObject({
      blocked: true,
      canReachAccess: false,
      unpayableReason: "ice_unaffordable",
    });
  });
});

describe("visible run analysis text-derived breaker costs", () => {
  it("carries Japanese Water Torture's future-click loss into the known path quote", () => {
    const assessment = assessKnownRezzedIcePath(
      [classicWallIce("remote-wall")],
      [japaneseWaterTortureBreaker("torture")],
      2,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      futureClicksLost: 1,
    });
  });

  it("counts a visible wall-breaker text profile against classic wall ICE", () => {
    const assessment = assessKnownRezzedIcePath(
      [classicWallIce("remote-wall")],
      [earlyWormBreaker("runner-worm")],
      3,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      creditsAfterPath: 0,
      visibleBreakCost: 3,
      reachableAccessReason: "known_path_reachable",
    });
  });

  it("keeps classic wall ICE blocking when the text-derived break cost is unaffordable", () => {
    const assessment = assessKnownRezzedIcePath(
      [classicWallIce("remote-wall")],
      [earlyWormBreaker("runner-worm")],
      2,
    );

    expect(assessment).toMatchObject({
      blocked: true,
      canReachAccess: false,
      noAccessReason: "known_path_unpayable",
      unpayableReason: "ice_unaffordable",
    });
  });

  it("does not use plural wall-only breaker text against a code gate", () => {
    const assessment = assessKnownRezzedIcePath(
      [classicCodeGateIce("remote-code-gate")],
      [pileDriverBreaker("runner-pile-driver")],
      4,
    );

    expect(assessment).toMatchObject({
      blocked: true,
      canReachAccess: false,
      knownPathBlockedByMissingCoverage: true,
      missingCoverage: ["code_gate"],
      noAccessReason: "missing_breaker_coverage",
      unpayableReason: "ice_unbreakable",
    });
  });

  it("uses effective variable ICE subtypes instead of the printed definition subtype", () => {
    const assessment = assessKnownRezzedIcePath(
      [caryatidAsCodeGateIce("hq-caryatid")],
      [pileDriverBreaker("runner-pile-driver")],
      4,
    );

    expect(assessment).toMatchObject({
      blocked: true,
      canReachAccess: false,
      knownPathBlockedByMissingCoverage: true,
      missingCoverage: ["code_gate"],
      noAccessReason: "missing_breaker_coverage",
      unpayableReason: "ice_unbreakable",
    });
  });
});

describe("visible run analysis access-preserving effect choices", () => {
  it("breaks a harmful non-ETR setup subroutine with a universal breaker", () => {
    const assessment = assessKnownRezzedIcePath(
      [
        dataWallTwoPointZeroIce("inner-wall"),
        fatalAttractorIce("outer-attractor"),
      ],
      [krashBreaker("runner-krash")],
      20,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleBreakCost: 14,
      creditsAfterPath: 6,
    });
  });

  it("takes damage to preserve credits for a later no-break lock and Wall", () => {
    const blocked = assessKnownRezzedIcePath(
      [dataWallTwoPointZeroIce("inner-wall"), neuralBladeIce("outer-blade")],
      [krashBreaker("runner-krash")],
      12,
    );

    expect(blocked).toMatchObject({
      blocked: true,
      canReachAccess: false,
      visibleBreakCost: 14,
      creditsAfterPath: -2,
      unpayableReason: "later_ice_unaffordable_after_prior_ice_cost",
    });

    const funded = assessKnownRezzedIcePath(
      [dataWallTwoPointZeroIce("inner-wall"), neuralBladeIce("outer-blade")],
      [krashBreaker("runner-krash")],
      14,
    );
    expect(funded).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleBreakCost: 14,
      creditsAfterPath: 0,
    });
  });
});

describe("visible run analysis Deflector paths", () => {
  it("prices a live Deflector as a required access-preserving break", () => {
    const assessment = assessKnownRezzedIcePath(
      [trapdoorDeflectorIce("rd-trapdoor")],
      [krashBreaker("runner-krash")],
      10,
      [],
      0,
      { visibleRemoteServerCount: 1, visibleCorpCredits: 0 },
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleBreakCost: 8,
      creditsAfterPath: 2,
    });
  });

  it("blocks a live Deflector path when the access-preserving break is unaffordable", () => {
    const assessment = assessKnownRezzedIcePath(
      [trapdoorDeflectorIce("rd-trapdoor")],
      [krashBreaker("runner-krash")],
      7,
      [],
      0,
      { visibleRemoteServerCount: 1, visibleCorpCredits: 0 },
    );

    expect(assessment).toMatchObject({
      blocked: true,
      canReachAccess: false,
      visibleBreakCost: 8,
      unpayableReason: "ice_unaffordable",
    });
  });

  it("does not charge for an auto-broken Deflector without a visible target", () => {
    const assessment = assessKnownRezzedIcePath(
      [trapdoorDeflectorIce("rd-trapdoor")],
      [krashBreaker("runner-krash")],
      0,
      [],
      0,
      { visibleRemoteServerCount: 0, visibleCorpCredits: 0 },
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      creditsAfterPath: 0,
    });
    expect(assessment.visibleBreakCost).toBeUndefined();
  });

  it("keeps an any-data-fort Deflector live without a remote", () => {
    const assessment = assessKnownRezzedIcePath(
      [
        {
          ...trapdoorDeflectorIce("rd-entrapment"),
          effectiveRunQuote: {
            ...trapdoorDeflectorIce("rd-entrapment").effectiveRunQuote!,
            subroutines: [
              {
                id: "rd-entrapment_deflect",
                type: "deflect_run",
                deflectorTarget: "any_data_fort",
              },
            ],
          },
        },
      ],
      [krashBreaker("runner-krash")],
      7,
      [],
      0,
      { visibleRemoteServerCount: 0, visibleCorpCredits: 0 },
    );

    expect(assessment).toMatchObject({
      blocked: true,
      canReachAccess: false,
      visibleBreakCost: 8,
    });
  });
});

describe("visible run analysis runner run credit pools", () => {
  it("assigns hosted-only Spin Chip credits only to its hosted breaker", () => {
    const unhostedKrash = krashBreaker("runner-krash");
    const spinChip = hostedOnlyBreakerCreditPool("runner-spin-chip", 2);

    expect(
      runnerRunPathCreditBudgetWithVisiblePools(0, [unhostedKrash, spinChip]),
    ).toMatchObject({ credits: 0 });
    expect(
      runnerRunPathCreditBudgetWithVisiblePools(0, [unhostedKrash, spinChip]),
    ).not.toHaveProperty("icebreakerCredits");

    const hostedKrash = {
      ...unhostedKrash,
      hostedOn: spinChip.instanceId,
    };
    expect(
      runnerRunPathCreditBudgetWithVisiblePools(0, [hostedKrash, spinChip]),
    ).toMatchObject({
      hostedIcebreakerCreditsByBreakerInstanceId: {
        "runner-krash": 2,
      },
    });
  });

  it("uses visible non-noisy breaker credits for a Codecracker known path", () => {
    const rig = [
      codecrackerBreaker("runner-codecracker"),
      nonNoisyBreakerCreditPool("runner-cloak", 2),
    ];
    const assessment = assessKnownRezzedIcePath(
      [classicCodeGateIce("remote-code-gate")],
      rig,
      runnerRunPathCreditBudgetWithVisiblePools(0, rig),
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleBreakCost: 2,
      creditsAfterPath: 0,
    });

    expect(
      quoteRunnerRunRoute({
        path: assessment,
        availableCredits: 0,
      }),
    ).toMatchObject({
      guaranteedKnownCost: 2,
      availableCredits: 0,
      fundingGap: 0,
    });
  });

  it("does not expose restricted breaker credits to a visible Trace bid", () => {
    const rig = [nonNoisyBreakerCreditPool("runner-cloak", 4)];
    const assessment = assessKnownRezzedIcePath(
      [fragmentationStormIce("rd-fragmentation")],
      rig,
      runnerRunPathCreditBudgetWithVisiblePools(0, rig),
      [],
      0,
    );

    expect(
      quoteRunnerRunRoute({
        path: assessment,
        availableCredits: 0,
      }),
    ).toMatchObject({
      reachability: "conditional_access",
      guaranteedKnownCost: 4,
      availableCredits: 0,
      fundingGap: 4,
    });
  });

  it("does not move restricted credits from a paid break to a later Trace and includes visible Corp credit gain", () => {
    const rig = [
      codecrackerBreaker("runner-codecracker"),
      nonNoisyBreakerCreditPool("runner-cloak", 2),
    ];
    const assessment = assessKnownRezzedIcePath(
      [
        fragmentationStormIce("rd-fragmentation"),
        classicCodeGateIce("rd-code-gate"),
      ],
      rig,
      runnerRunPathCreditBudgetWithVisiblePools(0, rig),
      [],
      0,
    );

    expect(assessment).toMatchObject({
      blocked: true,
      creditsAfterPath: 0,
      visibleBreakCost: 2,
    });
    expect(
      quoteRunnerRunRoute({
        path: assessment,
        availableCredits: 0,
      }),
    ).toMatchObject({
      reachability: "conditional_access",
      guaranteedKnownCost: 7,
      fundingGap: 5,
    });
  });

  it("does not spend non-noisy breaker credits through a noisy breaker", () => {
    const rig = [
      pileDriverBreaker("runner-pile-driver"),
      nonNoisyBreakerCreditPool("runner-cloak", 3),
    ];
    const assessment = assessKnownRezzedIcePath(
      [classicWallIce("remote-wall")],
      rig,
      runnerRunPathCreditBudgetWithVisiblePools(0, rig),
    );

    expect(assessment).toMatchObject({
      blocked: true,
      canReachAccess: false,
      noAccessReason: "known_path_unpayable",
      unpayableReason: "ice_unaffordable",
    });
  });

  it.each([4, 5, 6])(
    "spends Pile Driver stealth loss before a later Codecracker quote with %i cash",
    (cash) => {
      const rig = [
        pileDriverBreaker("runner-pile-driver"),
        codecrackerBreaker("runner-codecracker"),
        nonNoisyBreakerCreditPool("runner-cloak", 3),
      ];
      const assessment = assessKnownRezzedIcePath(
        [keeperIce("rd-keeper"), fireWallIce("rd-fire-wall")],
        rig,
        runnerRunPathCreditBudgetWithVisiblePools(cash, rig),
      );

      expect(assessment).toMatchObject({
        blocked: true,
        canReachAccess: false,
        noAccessReason: "known_path_unpayable",
        unpayableReason: "later_ice_unaffordable_after_prior_ice_cost",
      });
    },
  );

  it("reaches the same path with seven cash but no stale Cloak reserve", () => {
    const rig = [
      pileDriverBreaker("runner-pile-driver"),
      codecrackerBreaker("runner-codecracker"),
      nonNoisyBreakerCreditPool("runner-cloak", 3),
    ];
    const assessment = assessKnownRezzedIcePath(
      [keeperIce("rd-keeper"), fireWallIce("rd-fire-wall")],
      rig,
      runnerRunPathCreditBudgetWithVisiblePools(7, rig),
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleBreakCost: 7,
      creditsAfterPath: 0,
    });
  });
});

describe("visible run analysis trace hazards", () => {
  it("projects an unavoidable visible Hunter tag hazard without blocking access", () => {
    const assessment = assessKnownRezzedIcePath(
      [hunterTraceTagIce("rd-hunter")],
      [],
      2,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleTraceTagHazardUnavoidable: true,
      expectedTagsFromVisibleIce: 1,
      unavoidableVisibleIceHazardCount: 1,
    });
    expect(assessment.visibleIceRunHazards?.[0]).toMatchObject({
      kind: "trace_tag",
      sourceTitle: "Hunter",
      traceBaseStrength: 5,
      runnerTraceCapacity: 2,
      baseTraceCovered: false,
      visibleCorpBidCapacity: 0,
      visibleCorpMaxTraceCovered: false,
      traceAvoidanceCost: 5,
      visibleCorpMaxTraceAvoidanceCost: 5,
      unavoidable: true,
    });
  });

  it("does not count Bodyweight Data Creche as recurring trace-link budget", () => {
    const assessment = assessKnownRezzedIcePath(
      [hunterTraceTagIce("rd-hunter")],
      [bodyweightDataCreche("runner-bodyweight")],
      2,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleTraceTagHazardUnavoidable: true,
      unavoidableVisibleIceHazardCount: 1,
    });
    expect(assessment.visibleIceRunHazards?.[0]).toMatchObject({
      kind: "trace_tag",
      runnerTraceCapacity: 2,
      baseTraceCovered: false,
      unavoidable: true,
    });
  });

  it("distinguishes base trace coverage from visible Corp max coverage", () => {
    const assessment = assessKnownRezzedIcePath(
      [hunterTraceTagIce("rd-hunter")],
      [],
      6,
      [],
      5,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleTraceTagHazardUnavoidable: true,
      unavoidableVisibleIceHazardCount: 1,
    });
    expect(assessment.visibleIceRunHazards?.[0]).toMatchObject({
      kind: "trace_tag",
      runnerTraceCapacity: 6,
      baseTraceCovered: true,
      visibleCorpBidCapacity: 5,
      visibleCorpMaxTraceCovered: false,
      traceAvoidanceCost: 5,
      visibleCorpMaxTraceAvoidanceCost: 10,
      unavoidable: true,
    });
  });

  it("keeps a trace hazard avoidable when visible Corp max is covered", () => {
    const assessment = assessKnownRezzedIcePath(
      [hunterTraceTagIce("rd-hunter")],
      [],
      10,
      [],
      5,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleIceHazardAvoidanceCost: 10,
      creditsAfterAvoidingVisibleIceHazards: 0,
    });
    expect(assessment.visibleTraceTagHazardUnavoidable).toBeUndefined();
    expect(assessment.visibleIceRunHazards?.[0]).toMatchObject({
      kind: "trace_tag",
      runnerTraceCapacity: 10,
      baseTraceCovered: true,
      visibleCorpBidCapacity: 5,
      visibleCorpMaxTraceCovered: true,
      minimumAvoidanceCost: 10,
      unavoidable: false,
    });
  });

  it("sequences runner trace credits across multiple trace subroutines", () => {
    const assessment = assessKnownRezzedIcePath(
      [doubleTraceTagIce("rd-double-trace")],
      [],
      9,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleIceHazardAvoidanceCost: 5,
      creditsAfterAvoidingVisibleIceHazards: 4,
      visibleTraceTagHazardUnavoidable: true,
      unavoidableVisibleIceHazardCount: 1,
    });
    expect(assessment.visibleIceRunHazards).toHaveLength(2);
    expect(assessment.visibleIceRunHazards?.[0]).toMatchObject({
      kind: "trace_tag",
      runnerTraceCapacity: 9,
      baseTraceCovered: true,
      visibleCorpMaxTraceCovered: true,
      minimumAvoidanceCost: 5,
      unavoidable: false,
    });
    expect(assessment.visibleIceRunHazards?.[1]).toMatchObject({
      kind: "trace_tag",
      runnerTraceCapacity: 4,
      baseTraceCovered: false,
      visibleCorpMaxTraceCovered: false,
      unavoidable: true,
    });
  });

  it("consumes structured trace-credit sources across trace subroutines", () => {
    const traceSupport: VisibleRunnerTraceSupportQuote = {
      traceCreditPool: 5,
      traceCreditSources: [
        {
          sourceCardInstanceId: "link-bit-source",
          sourceDefinitionId: "link-bit-source-definition",
          amount: 5,
          isStealth: false,
        },
      ],
      baseLinkOptions: [
        { baseLink: 0, activationCost: 0, safeForAccess: true },
      ],
      postBidLinkOptions: [],
      traceSuccessCancelOptions: [],
    };
    const assessment = assessKnownRezzedIcePath(
      [doubleTraceTagIce("rd-double-trace")],
      [],
      0,
      [],
      0,
      { runnerTraceSupportQuote: traceSupport },
    );

    expect(assessment.visibleIceRunHazards?.[0]).toMatchObject({
      unavoidable: false,
      minimumAvoidanceCost: 0,
    });
    expect(assessment.visibleIceRunHazards?.[1]).toMatchObject({
      unavoidable: true,
      runnerTraceCapacity: 0,
    });
  });

  it("uses structured post-bid link and success-cancel trace options", () => {
    const postBidSupport: VisibleRunnerTraceSupportQuote = {
      traceCreditPool: 0,
      traceCreditSources: [],
      baseLinkOptions: [
        { baseLink: 0, activationCost: 0, safeForAccess: true },
      ],
      postBidLinkOptions: [
        {
          sourceCardInstanceId: "wired-switchboard",
          sourceDefinitionId: "onr_proteus_154_wired-switchboard",
          sourceTitle: "Wired Switchboard",
          linkDelta: 3,
          activationCost: 0,
          tapSource: false,
          trashSource: true,
          safeForAccess: true,
          useLimit: { kind: "once_per_trace" },
        },
      ],
      traceSuccessCancelOptions: [],
    };
    const postBidAssessment = assessKnownRezzedIcePath(
      [hunterTraceTagIce("rd-hunter-post-bid")],
      [],
      2,
      [],
      0,
      { runnerTraceSupportQuote: postBidSupport },
    );
    expect(postBidAssessment.visibleIceRunHazards?.[0]).toMatchObject({
      minimumAvoidanceCost: 2,
      unavoidable: false,
    });
    const postBidSequence = assessKnownRezzedIcePath(
      [doubleTraceTagIce("rd-double-post-bid")],
      [],
      4,
      [],
      0,
      { runnerTraceSupportQuote: postBidSupport },
    );
    expect(postBidSequence.visibleIceRunHazards?.[0]).toMatchObject({
      unavoidable: false,
    });
    expect(postBidSequence.visibleIceRunHazards?.[1]).toMatchObject({
      unavoidable: true,
    });

    const cancelSupport: VisibleRunnerTraceSupportQuote = {
      ...postBidSupport,
      postBidLinkOptions: [],
      traceSuccessCancelOptions: [
        {
          sourceCardInstanceId: "back-door-netwatch",
          sourceDefinitionId: "onr_proteus_129_back-door-to-netwatch",
          sourceTitle: "Back Door to Netwatch",
          activationCost: 3,
          tapSource: false,
          trashSource: true,
        },
      ],
    };
    const cancelAssessment = assessKnownRezzedIcePath(
      [hunterTraceTagIce("rd-hunter-cancel")],
      [],
      3,
      [],
      5,
      { runnerTraceSupportQuote: cancelSupport },
    );
    expect(cancelAssessment.visibleIceRunHazards?.[0]).toMatchObject({
      traceSuccessCancelAvoidanceCost: 3,
      minimumAvoidanceCost: 3,
      unavoidable: false,
    });
  });

  it("enumerates repeated post-bid link uses within the shared trace budget", () => {
    const selections = visibleTracePostBidSelections(
      [
        {
          sourceCardInstanceId: "baedekers-net-map",
          sourceDefinitionId: "onr_v1_003_baedekers-net-map",
          sourceTitle: "Baedeker’s Net Map",
          linkDelta: 1,
          activationCost: 1,
          tapSource: false,
          trashSource: false,
          safeForAccess: true,
          useLimit: { kind: "repeatable_while_legal" },
        },
      ],
      3,
    );

    expect(selections).toContainEqual({
      linkDelta: 3,
      activationCost: 3,
      rewardCreditsOnAvoidTrace: 0,
      safeForAccess: true,
      consumedSourceIds: [],
    });
  });

  it("uses restricted trace credits for post-bid activation costs", () => {
    const support = visibleRunnerTraceSupport(
      {
        traceCreditPool: 1,
        traceCreditSources: [
          {
            sourceCardInstanceId: "trace-credit-source",
            sourceDefinitionId: "trace-credit-source-definition",
            amount: 1,
            isStealth: false,
          },
        ],
        baseLinkOptions: [
          { baseLink: 0, activationCost: 0, safeForAccess: true },
        ],
        postBidLinkOptions: [
          {
            sourceCardInstanceId: "signpost",
            sourceDefinitionId: "onr_v1_063_signpost",
            sourceTitle: "Signpost",
            linkDelta: 2,
            activationCost: 1,
            tapSource: false,
            trashSource: false,
            safeForAccess: true,
            useLimit: { kind: "once_per_trace" },
          },
        ],
        traceSuccessCancelOptions: [],
      },
      0,
    );
    const avoidance = visibleTraceAvoidanceForBaseStrength(2, support);

    expect(support.runnerTraceCapacity).toBe(2);
    expect(avoidance.cheapestAffordableSafe).toMatchObject({
      creditCost: 0,
      grossGeneralCreditCost: 0,
      traceCreditPoolSpent: 1,
      runnerTraceCapacity: 2,
    });
  });

  it("accumulates avoid-trace rewards for repeated Runner Sensei uses", () => {
    expect(
      visibleTracePostBidSelections(
        [
          {
            sourceCardInstanceId: "runner-sensei",
            sourceDefinitionId: "onr_proteus_148_runner-sensei",
            sourceTitle: "Runner Sensei",
            linkDelta: 1,
            activationCost: 2,
            tapSource: false,
            trashSource: false,
            safeForAccess: true,
            useLimit: { kind: "repeatable_while_legal" },
            rewardCreditsOnAvoidTrace: 1,
          },
        ],
        4,
      ),
    ).toContainEqual({
      linkDelta: 2,
      activationCost: 4,
      rewardCreditsOnAvoidTrace: 2,
      safeForAccess: true,
      consumedSourceIds: [],
    });
  });

  it("does not reuse Replicator break credits across multiple traces", () => {
    const assessment = assessKnownRezzedIcePath(
      [doubleTraceTagIce("rd-double-trace")],
      [replicator("runner-replicator")],
      3,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleIceHazardAvoidanceCost: 3,
      creditsAfterAvoidingVisibleIceHazards: 0,
      visibleTraceTagHazardUnavoidable: true,
      unavoidableVisibleIceHazardCount: 1,
    });
    expect(assessment.visibleIceRunHazards).toHaveLength(2);
    expect(assessment.visibleIceRunHazards?.[0]).toMatchObject({
      kind: "trace_tag",
      runnerTraceCapacity: 3,
      breakAvoidanceCost: 3,
      minimumAvoidanceCost: 3,
      unavoidable: false,
    });
    expect(assessment.visibleIceRunHazards?.[1]).toMatchObject({
      kind: "trace_tag",
      runnerTraceCapacity: 0,
      breakAvoidanceCost: 3,
      unavoidable: true,
    });
  });

  it("treats visible Access through Alpha as unaffordable at zero credits", () => {
    const assessment = assessKnownRezzedIcePath(
      [hunterTraceTagIce("rd-hunter")],
      [accessThroughAlpha("access-through-alpha")],
      0,
      [],
      0,
      {
        runnerTraceSupportQuote: traceSupportQuote(
          9,
          1,
          true,
          "Access through Alpha",
        ),
      },
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleTraceTagHazardUnavoidable: true,
      unavoidableVisibleIceHazardCount: 1,
      creditsAfterAvoidingVisibleIceHazards: 0,
    });
    expect(assessment.visibleIceRunHazards?.[0]).toMatchObject({
      kind: "trace_tag",
      runnerTraceCapacity: 0,
      traceAvoidanceCost: 1,
      traceBidCost: 0,
      baseLinkValue: 9,
      baseLinkActivationCost: 1,
      baseLinkSourceTitle: "Access through Alpha",
      unavoidable: true,
    });
  });

  it("keeps a visible Hunter tag hazard avoidable when Access through Alpha can be paid", () => {
    const assessment = assessKnownRezzedIcePath(
      [hunterTraceTagIce("rd-hunter")],
      [accessThroughAlpha("access-through-alpha")],
      1,
      [],
      0,
      {
        runnerTraceSupportQuote: traceSupportQuote(
          9,
          1,
          true,
          "Access through Alpha",
        ),
      },
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleIceHazardAvoidanceCost: 1,
      creditsAfterAvoidingVisibleIceHazards: 0,
    });
    expect(assessment.visibleTraceTagHazardUnavoidable).toBeUndefined();
    expect(assessment.visibleIceRunHazards?.[0]).toMatchObject({
      kind: "trace_tag",
      runnerTraceCapacity: 9,
      traceAvoidanceCost: 1,
      traceBidCost: 0,
      baseLinkValue: 9,
      baseLinkActivationCost: 1,
      minimumAvoidanceCost: 1,
      unavoidable: false,
    });
  });

  it("does not count Submarine Uplink as access-preserving trace avoidance", () => {
    const assessment = assessKnownRezzedIcePath(
      [hunterTraceTagIce("rd-hunter")],
      [submarineUplink("runner-submarine")],
      1,
      [],
      0,
      {
        runnerTraceSupportQuote: traceSupportQuote(
          4,
          0,
          false,
          "Submarine Uplink",
          "ends_run_after_encounter",
        ),
      },
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleTraceTagHazardUnavoidable: true,
      unavoidableVisibleIceHazardCount: 1,
    });
    expect(assessment.visibleIceRunHazards?.[0]).toMatchObject({
      kind: "trace_tag",
      runnerTraceCapacity: 1,
      traceAvoidanceCost: 5,
      baseLinkValue: 4,
      baseLinkActivationCost: 0,
      baseLinkSourceTitle: "Submarine Uplink",
      baseLinkSideEffect: "ends_run_after_encounter",
      unavoidable: true,
    });
    expect(assessment.visibleIceRunHazards?.[0]?.evidence).toContain(
      "visible_trace_base_link_side_effect:ends_run_after_encounter",
    );
  });

  it("keeps a visible Hunter tag hazard avoidable through Replicator trace break", () => {
    const assessment = assessKnownRezzedIcePath(
      [hunterTraceTagIce("rd-hunter")],
      [replicator("runner-replicator")],
      3,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleIceHazardAvoidanceCost: 3,
      creditsAfterAvoidingVisibleIceHazards: 0,
    });
    expect(assessment.visibleTraceTagHazardUnavoidable).toBeUndefined();
    expect(assessment.visibleIceRunHazards?.[0]).toMatchObject({
      kind: "trace_tag",
      traceAvoidanceCost: 5,
      breakAvoidanceCost: 3,
      minimumAvoidanceCost: 3,
      unavoidable: false,
    });
  });

  it("projects Data Raven style visible trace tag and counter pressure", () => {
    const assessment = assessKnownRezzedIcePath(
      [dataRavenTraceTagCounterIce("rd-data-raven")],
      [],
      2,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleTraceTagHazardUnavoidable: true,
      expectedTagsFromVisibleIce: 1,
      unavoidableVisibleIceHazardCount: 1,
    });
    expect(assessment.visibleIceRunHazards?.[0]).toMatchObject({
      kind: "trace_tag_counter",
      sourceTitle: "Data Raven",
      traceBaseStrength: 5,
      runnerTraceCapacity: 2,
      expectedTags: 1,
      expectedCounters: 1,
      unavoidable: true,
    });
  });
});

describe("shared runner run route quote", () => {
  it.each([
    {
      label: "Seed 7 state 168",
      runnerCredits: 4,
      corpCredits: 1,
      expectedReachability: "conditional_access",
      expectedGuaranteedCost: 5,
      expectedFundingGap: 1,
    },
    {
      label: "Seed 7 state 210",
      runnerCredits: 6,
      corpCredits: 0,
      expectedReachability: "guaranteed_access",
      expectedGuaranteedCost: 4,
      expectedFundingGap: 0,
    },
    {
      label: "Seed 7 state 225",
      runnerCredits: 6,
      corpCredits: 3,
      expectedReachability: "conditional_access",
      expectedGuaranteedCost: 7,
      expectedFundingGap: 1,
    },
  ] as const)(
    "quotes the visible Fragmentation Storm route for $label",
    ({
      runnerCredits,
      corpCredits,
      expectedReachability,
      expectedGuaranteedCost,
      expectedFundingGap,
    }) => {
      const path = assessKnownRezzedIcePath(
        [fragmentationStormIce("rd-fragmentation")],
        [],
        runnerCredits,
        [],
        corpCredits,
      );
      const route = quoteRunnerRunRoute({
        path,
        availableCredits: runnerCredits,
        runnerGripCount: 5,
      });

      expect(route).toMatchObject({
        reachability: expectedReachability,
        guaranteedKnownCost: expectedGuaranteedCost,
        fundingGap: expectedFundingGap,
      });
      expect(route.effects[0]).toMatchObject({
        kind: "end_run_or_deflect",
        timing: "before_access",
        preventsAccess: true,
      });
    },
  );

  it("keeps an unknown outer ICE explicit around the payable known inner route", () => {
    const path = assessKnownRezzedIcePath(
      [
        {
          instanceId: "unknown-outer",
          known: false,
          rezzed: false,
        } as VisibleCard,
        fragmentationStormIce("known-inner"),
      ],
      [],
      6,
      [],
      0,
    );
    const route = quoteRunnerRunRoute({
      path,
      availableCredits: 6,
      unknownIceCount: 1,
      runnerGripCount: 5,
    });

    expect(route).toMatchObject({
      reachability: "conditional_access",
      guaranteedKnownCost: 4,
      unknownIceCount: 1,
      conditionalReasons: ["unknown_ice_on_route"],
    });
  });

  it("does not turn a pre-access tag into an automatic access block", () => {
    const path = assessKnownRezzedIcePath(
      [hunterTraceTagIce("rd-hunter-route")],
      [],
      2,
    );
    const route = quoteRunnerRunRoute({
      path,
      availableCredits: 2,
      runnerGripCount: 5,
    });

    expect(route.reachability).toBe("guaranteed_access");
    expect(route.effects[0]).toMatchObject({
      kind: "tags",
      timing: "before_access",
      preventsAccess: false,
      canEndGameBeforeAccess: false,
    });
  });

  it("keeps lethal visible trace damage conditional before access", () => {
    const path = assessKnownRezzedIcePath(
      [traceDamageIce("rd-trace-damage", 3)],
      [],
      0,
    );
    const route = quoteRunnerRunRoute({
      path,
      availableCredits: 0,
      runnerGripCount: 3,
    });

    expect(route.reachability).toBe("conditional_access");
    expect(route.effects[0]).toMatchObject({
      kind: "damage",
      timing: "before_access",
      canEndGameBeforeAccess: true,
    });
  });

  it("treats Puzzle's visible hard end-run subroutines as access blockers", () => {
    const path = assessKnownRezzedIcePath(
      [
        quotedSpecialIce("rd-puzzle", "Puzzle", [
          {
            id: "rd-puzzle-first",
            type: "end_the_run_and_trash_source_at_end_of_turn",
          },
          {
            id: "rd-puzzle-second",
            type: "end_the_run_and_trash_source_at_end_of_turn",
          },
        ]),
      ],
      [],
      5,
    );

    expect(path).toMatchObject({
      blocked: true,
      canReachAccess: false,
      knownPathBlockedByUnbreakableIce: true,
    });
  });

  it("pays a visible Too Many Doors bid only when the Corp cannot force a tie", () => {
    const ice = quotedSpecialIce("rd-too-many-doors", "Too Many Doors", [
      {
        id: "rd-too-many-doors-secret-bid",
        type: "secret_spend_compare_end_run_unless_corp_spent_at_least_runner",
      },
    ]);
    const payablePath = assessKnownRezzedIcePath([ice], [], 1, [], 0);
    const conditionalPath = assessKnownRezzedIcePath([ice], [], 2, [], 2);

    expect(payablePath).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleBreakCost: 1,
      creditsAfterPath: 0,
    });
    expect(conditionalPath).toMatchObject({
      blocked: false,
      canReachAccess: true,
      creditsAfterPath: 2,
      conditionalAccessReasons: ["visible_secret_spend_end_run"],
    });
    expect(
      quoteRunnerRunRoute({
        path: conditionalPath,
        availableCredits: 2,
      }),
    ).toMatchObject({
      reachability: "conditional_access",
      conditionalReasons: ["visible_secret_spend_end_run"],
    });
  });

  it("keeps visible Corp encounter ETR and random ICE effects conditional", () => {
    const paidEncounterEtr = quotedSpecialIce("rd-riddler", "Riddler", []);
    paidEncounterEtr.effectiveRunQuote!.conditionalEncounterEffects = [
      {
        kind: "corp_paid_add_end_the_run_subroutine",
        creditCost: 2,
      },
    ];
    const outerCorpCredit = quotedSpecialIce("rd-credit", "Credit ICE", [
      { id: "rd-credit-gain", type: "corp_gain_credit", amount: 1 },
    ]);
    const randomIce = quotedSpecialIce("rd-random", "Random ICE", [
      { id: "rd-random-damage", type: "random_damage", amount: 3 },
      {
        id: "rd-random-rewind",
        type: "rewind_run_to_rezzed_ice_by_die",
      },
    ]);
    randomIce.effectiveRunQuote!.conditionalEncounterEffects = [
      {
        kind: "random_strength_or_derez_auto_pass",
        dieFaces: 6,
        autoPassResult: 6,
        maxStrengthBonus: 5,
      },
    ];

    const paidPath = assessKnownRezzedIcePath(
      [paidEncounterEtr, outerCorpCredit],
      [],
      5,
      [],
      1,
    );
    const randomPath = assessKnownRezzedIcePath([randomIce], [], 5);

    expect(paidPath.conditionalAccessReasons).toEqual([
      "visible_corp_paid_encounter_etr",
    ]);
    expect(randomPath.conditionalAccessReasons).toEqual([
      "visible_random_encounter_strength",
      "visible_random_rewind",
    ]);
    expect(randomPath.conditionalRiskReasons).toEqual([
      "visible_random_damage",
    ]);
    expect(
      quoteRunnerRunRoute({ path: randomPath, availableCredits: 5 }),
    ).toMatchObject({
      reachability: "conditional_access",
      conditionalReasons: [
        "visible_random_encounter_strength",
        "visible_random_rewind",
      ],
      conditionalRiskReasons: ["visible_random_damage"],
    });

    const randomDamageOnlyPath = assessKnownRezzedIcePath(
      [
        quotedSpecialIce("rd-random-damage", "Random Damage", [
          { id: "rd-random-damage", type: "random_damage", amount: 3 },
        ]),
      ],
      [],
      5,
    );
    expect(
      quoteRunnerRunRoute({ path: randomDamageOnlyPath, availableCredits: 5 }),
    ).toMatchObject({
      reachability: "guaranteed_access",
      conditionalReasons: [],
      conditionalRiskReasons: ["visible_random_damage"],
    });
  });

  it("resets Dupré's visible strength counters when the target fort changes", () => {
    const dupre: VisibleCard = {
      instanceId: "runner-dupre",
      definitionId: "onr_v1_020_dupre",
      title: "Dupré",
      side: "runner",
      type: "program",
      known: true,
      strength: 2,
      counters: { power: 2 },
      selectedServerId: "remote_1",
      subtypes: ["icebreaker", "codecracker"],
    };

    const sameFort = assessKnownRezzedIcePath(
      [classicCodeGateIce("remote-code-gate")],
      [dupre],
      1,
      [],
      0,
      { targetServerId: "remote_1" },
    );
    const changedFort = assessKnownRezzedIcePath(
      [classicCodeGateIce("remote-code-gate")],
      [dupre],
      1,
      [],
      0,
      { targetServerId: "remote_2" },
    );

    expect(sameFort).toMatchObject({ blocked: false, canReachAccess: true });
    expect(changedFort).toMatchObject({
      blocked: true,
      canReachAccess: false,
      unpayableReason: "ice_unaffordable",
    });
  });
});

function quotedSpecialIce(
  instanceId: string,
  title: string,
  subroutines: NonNullable<VisibleCard["effectiveRunQuote"]>["subroutines"],
): VisibleCard {
  return {
    instanceId,
    definitionId: `test_${instanceId}`,
    title,
    type: "ice",
    subtypes: ["sentry"],
    known: true,
    rezzed: true,
    strength: 3,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: `test_${instanceId}`,
      effectiveStrength: 3,
      subroutines,
    },
  };
}

function classicWallIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_232_crystal-wall",
    title: "Crystal Wall",
    type: "ice",
    subtypes: ["wall"],
    known: true,
    rezzed: true,
    strength: 3,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_232_crystal-wall",
      effectiveStrength: 3,
      subroutines: [{ id: `${instanceId}:etr`, type: "end_the_run" }],
    },
  };
}

function sentryEndTheRunIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_249_hunter",
    side: "corp",
    type: "ice",
    known: true,
    rezzed: true,
    strength: 5,
    subtypes: ["sentry"],
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_249_hunter",
      effectiveStrength: 5,
      subroutines: [{ id: `${instanceId}:etr`, type: "end_the_run" }],
    },
  };
}

function bulldozerBreaker(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_proteus_082_bulldozer",
    side: "runner",
    type: "program",
    known: true,
    strength: 5,
    subtypes: ["icebreaker", "fracter"],
  };
}

function classicCodeGateIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "simple_code_gate_ice",
    title: "Simple Code Gate ICE",
    type: "ice",
    subtypes: ["code_gate"],
    known: true,
    rezzed: true,
    strength: 2,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "simple_code_gate_ice",
      effectiveStrength: 2,
      subroutines: [
        { id: `${instanceId}:credit`, type: "corp_gain_credit", amount: 1 },
        { id: `${instanceId}:etr`, type: "end_the_run" },
      ],
    },
  };
}

function dataWallTwoPointZeroIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_238_data-wall-2-0",
    title: "Data Wall 2.0",
    type: "ice",
    subtypes: ["wall"],
    known: true,
    rezzed: true,
    strength: 1,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_238_data-wall-2-0",
      effectiveStrength: 1,
      subroutines: [{ id: `${instanceId}:etr`, type: "end_the_run" }],
    },
  };
}

function neuralBladeIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_258_neural-blade",
    title: "Neural Blade",
    type: "ice",
    subtypes: ["sentry", "ap", "sword"],
    known: true,
    rezzed: true,
    strength: 4,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_258_neural-blade",
      effectiveStrength: 4,
      subroutines: [
        {
          id: `${instanceId}:damage`,
          type: "do_damage",
          amount: 1,
          unbrokenRunEffect: { causesDamageOrProgramTrash: true },
        },
        {
          id: `${instanceId}:no-break`,
          type: "set_next_encounter_no_break_subroutines",
          unbrokenRunEffect: { preventsFutureBreaking: true },
        },
      ],
    },
  };
}

function fatalAttractorIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_242_fatal-attractor",
    title: "Fatal Attractor",
    type: "ice",
    subtypes: ["ap", "black_ice", "sentry"],
    known: true,
    rezzed: true,
    strength: 4,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_242_fatal-attractor",
      effectiveStrength: 4,
      subroutines: [
        {
          id: `${instanceId}:next-encounter-damage`,
          type: "set_next_encounter_unless_fully_break_damage",
          amount: 3,
          damageType: "net",
          unbrokenRunEffect: { causesDamageOrProgramTrash: true },
        },
      ],
    },
  };
}

function fireWallIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_245_fire-wall",
    title: "Fire Wall",
    type: "ice",
    subtypes: ["wall"],
    known: true,
    rezzed: true,
    strength: 4,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_245_fire-wall",
      effectiveStrength: 4,
      subroutines: [{ id: `${instanceId}:etr`, type: "end_the_run" }],
    },
  };
}

function keeperIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_252_keeper",
    title: "Keeper",
    type: "ice",
    subtypes: ["code_gate"],
    known: true,
    rezzed: true,
    strength: 4,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_252_keeper",
      effectiveStrength: 4,
      subroutines: [{ id: `${instanceId}:etr`, type: "end_the_run" }],
    },
  };
}

function caryatidAsCodeGateIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_proteus_013_caryatid",
    title: "Caryatid",
    type: "ice",
    subtypes: ["code_gate"],
    known: true,
    rezzed: true,
    strength: 5,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_proteus_013_caryatid",
      effectiveStrength: 5,
      subroutines: [
        {
          id: "onr_proteus_013_caryatid_etr",
          type: "end_the_run",
        },
      ],
    },
  };
}

function trapdoorDeflectorIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_classic_014_trapdoor",
    title: "Trapdoor",
    type: "ice",
    subtypes: ["code_gate", "deflector"],
    known: true,
    rezzed: true,
    strength: 3,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_classic_014_trapdoor",
      effectiveStrength: 3,
      subroutines: [
        {
          id: `${instanceId}_deflect`,
          type: "deflect_run",
          deflectorTarget: "subsidiary_data_fort",
          deflectorAutoBreakIfNoTarget: true,
        },
      ],
    },
  };
}

function krashBreaker(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_039_krash",
    title: "Krash",
    type: "program",
    subtypes: ["icebreaker"],
    known: true,
    strength: 0,
  };
}

function earlyWormBreaker(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_classic_027_early-worm",
    title: "Early Worm",
    type: "program",
    subtypes: ["icebreaker", "worm"],
    known: true,
    strength: 2,
  };
}

function pileDriverBreaker(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_047_pile-driver",
    title: "Pile Driver",
    type: "program",
    subtypes: ["icebreaker", "fracter", "noisy"],
    known: true,
    strength: 7,
  };
}

function japaneseWaterTortureBreaker(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_037_japanese-water-torture",
    title: "Japanese Water Torture",
    type: "program",
    subtypes: ["icebreaker", "fracter"],
    known: true,
    strength: 2,
  };
}

function codecrackerBreaker(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_014_codecracker",
    title: "Codecracker",
    type: "program",
    subtypes: ["icebreaker"],
    known: true,
    strength: 0,
  };
}

function nonNoisyBreakerCreditPool(
  instanceId: string,
  amount: number,
): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_011_cloak",
    title: "Cloak",
    type: "program",
    subtypes: ["stealth"],
    known: true,
    counterDisplays: [
      {
        id: `${instanceId}-recurring`,
        amount,
        displayKind: "recurring_credit",
        label: "Recurring credits",
        ariaLabel: "Recurring credits",
        creditPool: {
          kind: "recurring_credit",
          uses: ["using_icebreaker_during_run_non_noisy"],
        },
      },
    ],
  };
}

function hostedOnlyBreakerCreditPool(
  instanceId: string,
  amount: number,
): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_proteus_139_eurocorpse-tm-spin-chip",
    title: "Eurocorpse (TM) Spin Chip",
    type: "hardware",
    subtypes: ["chip"],
    known: true,
    counterDisplays: [
      {
        id: `${instanceId}-restricted`,
        amount,
        displayKind: "restricted_pool",
        label: "Run-Bits",
        ariaLabel: `${amount} Run-Bits`,
        creditPool: {
          kind: "restricted_credit",
          uses: ["using_icebreaker_during_run"],
          requireHostedBreakerForIcebreakerUse: true,
        },
      },
    ],
  };
}

function hunterTraceTagIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_249_hunter",
    title: "Hunter",
    type: "ice",
    subtypes: ["sentry", "bloodhound"],
    known: true,
    rezzed: true,
    strength: 5,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_249_hunter",
      effectiveStrength: 5,
      subroutines: [
        {
          id: `${instanceId}_trace`,
          type: "initiate_trace",
          sourceDefinitionId: "onr_v1_249_hunter",
          sourceTitle: "Hunter",
          amount: 5,
          traceLimit: 5,
          traceSuccessEffect: { type: "add_tag", amount: 1 },
          breakTags: ["trace"],
        },
      ],
    },
  };
}

function fragmentationStormIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_246_fragmentation-storm",
    title: "Fragmentation Storm",
    type: "ice",
    subtypes: ["sentry", "trace"],
    known: true,
    rezzed: true,
    strength: 4,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_246_fragmentation-storm",
      effectiveStrength: 4,
      subroutines: [
        {
          id: `${instanceId}_trace`,
          type: "initiate_trace",
          sourceDefinitionId: "onr_v1_246_fragmentation-storm",
          sourceTitle: "Fragmentation Storm",
          amount: 4,
          traceLimit: 4,
          traceSuccessEffect: {
            type: "end_run_trash_program_and_run_lock",
            amount: 2,
          },
          unbrokenRunEffect: { createsRunLockOrActionTax: 2 },
        },
      ],
    },
  };
}

function traceDamageIce(instanceId: string, amount: number): VisibleCard {
  return {
    instanceId,
    definitionId: "test_trace_damage_ice",
    title: "Trace Damage ICE",
    type: "ice",
    subtypes: ["sentry", "trace"],
    known: true,
    rezzed: true,
    strength: 0,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "test_trace_damage_ice",
      effectiveStrength: 0,
      subroutines: [
        {
          id: `${instanceId}_trace`,
          type: "initiate_trace",
          amount: 0,
          traceLimit: 0,
          traceSuccessEffect: { type: "net_damage", amount },
        },
      ],
    },
  };
}

function doubleTraceTagIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_249_hunter",
    title: "Double Hunter Trace",
    type: "ice",
    subtypes: ["sentry", "bloodhound"],
    known: true,
    rezzed: true,
    strength: 5,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_249_hunter",
      effectiveStrength: 5,
      subroutines: [1, 2].map((index) => ({
        id: `${instanceId}_trace_${index}`,
        type: "initiate_trace",
        sourceDefinitionId: "onr_v1_249_hunter",
        sourceTitle: "Double Hunter Trace",
        amount: 5,
        traceLimit: 5,
        traceSuccessEffect: { type: "add_tag", amount: 1 },
        breakTags: ["trace"],
      })),
    },
  };
}

function dataRavenTraceTagCounterIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_236_data-raven",
    title: "Data Raven",
    type: "ice",
    subtypes: ["sentry"],
    known: true,
    rezzed: true,
    strength: 5,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_236_data-raven",
      effectiveStrength: 5,
      subroutines: [
        {
          id: `${instanceId}_trace`,
          type: "initiate_trace",
          sourceDefinitionId: "onr_v1_236_data-raven",
          sourceTitle: "Data Raven",
          amount: 5,
          traceLimit: 5,
          traceSuccessEffect: {
            type: "add_tag_and_counter",
            tagAmount: 1,
            counterType: "trace_tag_counter",
            amount: 1,
          },
          breakTags: ["trace"],
        },
      ],
    },
  };
}

function traceSupportQuote(
  baseLink: number,
  activationCost: number,
  safeForAccess: boolean,
  sourceTitle: string,
  sideEffect?: "ends_run_after_encounter",
) {
  return {
    traceCreditPool: 0,
    traceCreditSources: [],
    baseLinkOptions: [
      { baseLink: 0, activationCost: 0, safeForAccess: true },
      {
        baseLink,
        activationCost,
        safeForAccess,
        sourceDefinitionId: "trace-base-link-source",
        sourceTitle,
        ...(sideEffect ? { sideEffect } : {}),
      },
    ],
    postBidLinkOptions: [],
    traceSuccessCancelOptions: [],
  } as const;
}

function accessThroughAlpha(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_148_access-through-alpha",
    title: "Access through Alpha",
    type: "resource",
    subtypes: ["link"],
    known: true,
    baseLink: 9,
  };
}

function bodyweightDataCreche(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_123_bodyweight-data-creche",
    title: "Bodyweight Data Creche",
    type: "hardware",
    subtypes: ["deck"],
    known: true,
  };
}

function submarineUplink(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_182_submarine-uplink",
    title: "Submarine Uplink",
    type: "resource",
    subtypes: ["link"],
    known: true,
    baseLink: 4,
  };
}

function replicator(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_056_replicator",
    title: "Replicator",
    type: "program",
    subtypes: ["icebreaker"],
    known: true,
    strength: 2,
  };
}
