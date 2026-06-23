import { describe, expect, it } from "vitest";
import {
  assessKnownRezzedIcePath,
  runnerKnownPathAssessmentIsCostNoAccess,
  runnerKnownPathAssessmentIsKnownNoAccess,
  runnerKnownPathAssessmentIsUnbreakableNoAccess,
  type KnownRezzedIcePathAssessment,
} from "./visible-run-analysis";
import type { VisibleCard } from "@netgrid/shared";

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
      traceAvoidanceCost: 5,
      unavoidable: true,
    });
  });

  it("keeps a visible Hunter tag hazard avoidable with enough visible base link", () => {
    const assessment = assessKnownRezzedIcePath(
      [hunterTraceTagIce("rd-hunter")],
      [baseLinkCard("access-through-alpha", 9)],
      0,
    );

    expect(assessment).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleIceHazardAvoidanceCost: 0,
      creditsAfterAvoidingVisibleIceHazards: 0,
    });
    expect(assessment.visibleTraceTagHazardUnavoidable).toBeUndefined();
    expect(assessment.visibleIceRunHazards?.[0]).toMatchObject({
      kind: "trace_tag",
      runnerTraceCapacity: 9,
      minimumAvoidanceCost: 0,
      unavoidable: false,
    });
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

function baseLinkCard(instanceId: string, baseLink: number): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_148_access-through-alpha",
    title: "Access through Alpha",
    type: "resource",
    subtypes: ["link"],
    known: true,
    baseLink,
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
