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
import type { PublicGameEvent, VisibleCard } from "@netgrid/shared";
import { quoteRunnerRunRoute } from "./run-analysis/runner-run-route-quote";

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
});

describe("visible run analysis text-derived breaker costs", () => {
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
      baseLinkSideEffect: "forces_jack_out_after_encounter",
      unavoidable: true,
    });
    expect(assessment.visibleIceRunHazards?.[0]?.evidence).toContain(
      "visible_trace_base_link_side_effect:forces_jack_out_after_encounter",
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
          baseTraceStrength: 4,
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
          baseTraceStrength: 0,
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
        baseTraceStrength: 5,
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
        },
      ],
    },
  };
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
