import { describe, expect, it } from "vitest";
import {
  assessKnownRezzedIcePath,
  runnerKnownPathAssessmentIsCostNoAccess,
  runnerKnownPathAssessmentIsKnownNoAccess,
  runnerKnownPathAssessmentIsUnbreakableNoAccess,
  serverIdFromEvent,
  type KnownRezzedIcePathAssessment,
} from "./visible-run-analysis";
import type { PublicGameEvent, VisibleCard } from "@netgrid/shared";

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
    expect(serverIdFromEvent(event({ serverLabel: "Remote 1" }))).toBeUndefined();
    expect(serverIdFromEvent(event({ serverLabel: "R&D" }))).toBeUndefined();
    expect(serverIdFromEvent(event({ serverId: "remote_1" }))).toBe("remote_1");
    expect(serverIdFromEvent(event({ attackedServerId: "rd" }))).toBe("rd");
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
