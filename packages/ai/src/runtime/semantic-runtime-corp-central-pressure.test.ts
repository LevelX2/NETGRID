import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { semanticRuntimeCorpCentralPressureAssessment } from "./semantic-runtime-corp-central-pressure";
import { withDecisionDerivedCache } from "./decision-derived-cache";

describe("semanticRuntimeCorpCentralPressureAssessment", () => {
  it("reuses the immutable assessment within one decision only", () => {
    const input = corpInput({
      eventTail: [publicCentralEvent("rd-run-cache", "start_run", "rd")],
    });

    const withinDecision = withDecisionDerivedCache(() => [
      semanticRuntimeCorpCentralPressureAssessment(input, "rd"),
      semanticRuntimeCorpCentralPressureAssessment(input, "rd"),
    ]);
    const nextDecision = withDecisionDerivedCache(() =>
      semanticRuntimeCorpCentralPressureAssessment(input, "rd"),
    );

    expect(withinDecision[1]).toBe(withinDecision[0]);
    expect(nextDecision).not.toBe(withinDecision[0]);
    expect(nextDecision).toEqual(withinDecision[0]);
  });

  it("treats visible R&D virus payoff as central pressure after R&D probing", () => {
    const input = corpInput({
      runnerRig: [rdVirusCard("garbage-in")],
      eventTail: [publicCentralEvent("rd-run-1", "start_run", "rd")],
    });

    const pressure = semanticRuntimeCorpCentralPressureAssessment(input, "rd");

    expect(pressure).toMatchObject({
      serverId: "rd",
      active: true,
      visibleVirusPressure: true,
      runOrAccessEvents: 1,
    });
    expect(pressure.evidence).toContain(
      "corp_central_visible_virus_pressure:true",
    );
  });

  it("bounds R&D virus pressure text to real R&D counter payoff", () => {
    const input = corpInput({
      runnerRig: [
        runnerCard("noise", {
          title: "Counterfeit Research",
          rulesText: "This card mentions archives and countersignatures.",
        }),
      ],
      eventTail: [publicCentralEvent("rd-run-1", "start_run", "rd")],
    });

    const pressure = semanticRuntimeCorpCentralPressureAssessment(input, "rd");

    expect(pressure.visibleVirusPressure).toBe(false);
    expect(pressure.active).toBe(false);
  });

  it("keeps historical access evidence but expires it from recent R&D urgency", () => {
    const input = corpInput({
      stateVersion: 100,
      eventTail: [
        publicCentralEvent("rd-access-old", "access_card", "rd", 40),
        publicCentralEvent("rd-access-recent", "access_card", "rd", 90),
      ],
    });

    const pressure = semanticRuntimeCorpCentralPressureAssessment(input, "rd");

    expect(pressure).toMatchObject({
      runOrAccessEvents: 2,
      successfulAccessEvents: 2,
      recentRunOrAccessEvents: 1,
      recentSuccessfulAccessEvents: 1,
    });
  });
});

function corpInput(
  overrides: {
    runnerRig?: VisibleCard[];
    eventTail?: AiDecisionInput["eventTail"];
    stateVersion?: number;
  } = {},
): AiDecisionInput {
  return {
    side: "corp",
    eventTail: overrides.eventTail ?? [],
    playerView: {
      stateVersion: overrides.stateVersion ?? 2,
      own: {
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
      },
      opponent: {
        credits: 1,
        clicks: 4,
        agendaPoints: 0,
        rig: overrides.runnerRig ?? [],
      },
      publicEvents: [],
      servers: [],
    },
  } as unknown as AiDecisionInput;
}

function rdVirusCard(instanceId: string): VisibleCard {
  return runnerCard(instanceId, {
    title: "Garbage In",
    rulesText:
      "After each successful run on R&D, give the Corp a Virus counter. You may trash accessed cards from R&D.",
  });
}

function runnerCard(
  instanceId: string,
  overrides: Partial<VisibleCard>,
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "program",
    owner: "runner",
    ...overrides,
  } as VisibleCard;
}

function publicCentralEvent(
  eventId: string,
  actionType: "start_run" | "access_card",
  serverId: "hq" | "rd",
  stateVersionAfter = 2,
): AiDecisionInput["eventTail"][number] {
  return {
    eventId,
    type: actionType,
    stateVersionBefore: Math.max(0, stateVersionAfter - 1),
    stateVersionAfter,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: "runner",
      actionType,
      serverId,
    },
  };
}
