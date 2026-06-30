import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { semanticRuntimeCorpCentralPressureAssessment } from "./semantic-runtime-corp-central-pressure";

describe("semanticRuntimeCorpCentralPressureAssessment", () => {
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
});

function corpInput(overrides: {
  runnerRig?: VisibleCard[];
  eventTail?: AiDecisionInput["eventTail"];
} = {}): AiDecisionInput {
  return {
    side: "corp",
    eventTail: overrides.eventTail ?? [],
    playerView: {
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
): AiDecisionInput["eventTail"][number] {
  return {
    eventId,
    type: actionType,
    stateVersionBefore: 1,
    stateVersionAfter: 2,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: "runner",
      actionType,
      serverId,
    },
  };
}
