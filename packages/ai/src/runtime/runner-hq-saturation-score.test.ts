import { describe, expect, it } from "vitest";
import type { AiDecisionInput, PublicGameEvent } from "@netgrid/shared";

import { runnerHqSaturationAssessment } from "./runner-hq-saturation-score";

describe("runnerHqSaturationAssessment", () => {
  it("treats repeated agenda-free HQ accesses plus defense neglect as negative evidence", () => {
    const input = runnerInput({
      hqIce: 0,
      rdIce: 1,
      remoteIce: 3,
      accessedDefinitions: [
        "onr_v1_297_overtime-incentives",
        "onr_v1_296_off-site-backups",
        "onr_v1_297_overtime-incentives",
        "onr_v1_290_efficiency-experts",
      ],
    });

    const assessment = runnerHqSaturationAssessment(input);

    expect(assessment.applies).toBe(true);
    expect(assessment.agendaFreeAccesses).toBe(4);
    expect(assessment.repeatedDefinitionAccesses).toBe(1);
    expect(assessment.penalty).toBe(1000);
  });

  it("does not suppress a newly defended HQ information run", () => {
    const assessment = runnerHqSaturationAssessment(
      runnerInput({
        hqIce: 1,
        rdIce: 1,
        remoteIce: 3,
        accessedDefinitions: [
          "onr_v1_297_overtime-incentives",
          "onr_v1_296_off-site-backups",
          "onr_v1_290_efficiency-experts",
        ],
      }),
    );

    expect(assessment.applies).toBe(false);
    expect(assessment.penalty).toBe(0);
  });

  it("does not suppress a two-point closeout chance", () => {
    const input = runnerInput({
      hqIce: 0,
      rdIce: 1,
      remoteIce: 3,
      accessedDefinitions: [
        "onr_v1_297_overtime-incentives",
        "onr_v1_296_off-site-backups",
        "onr_v1_290_efficiency-experts",
      ],
    });
    input.playerView.own.agendaPoints = 5;

    const assessment = runnerHqSaturationAssessment(input);

    expect(assessment.applies).toBe(false);
    expect(assessment.penalty).toBe(0);
  });
});

function runnerInput(params: {
  hqIce: number;
  rdIce: number;
  remoteIce: number;
  accessedDefinitions: string[];
}): AiDecisionInput {
  const events = params.accessedDefinitions.map((definitionId, index) =>
    accessEvent(definitionId, index),
  );
  return {
    side: "runner",
    legalActions: [],
    eventTail: events,
    playerView: {
      stateVersion: 20,
      agendaPointsToWin: 7,
      publicEvents: events,
      own: { credits: 5, clicks: 4, agendaPoints: 0 },
      opponent: { handCount: 5 },
      servers: [
        server("hq", params.hqIce),
        server("rd", params.rdIce),
        server("archives", 0),
        server("remote_1", params.remoteIce),
      ],
    },
  } as unknown as AiDecisionInput;
}

function accessEvent(cardDefinitionId: string, index: number): PublicGameEvent {
  return {
    eventId: `event-${index}`,
    type: "access_card",
    stateVersionBefore: index,
    stateVersionAfter: index + 1,
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverLabel: "HQ",
      cardDefinitionId,
    },
  } as unknown as PublicGameEvent;
}

function server(id: string, iceCount: number) {
  return {
    id,
    label: id,
    root: [],
    ice: Array.from({ length: iceCount }, (_, index) => ({
      instanceId: `${id}-ice-${index}`,
      known: false,
      rezzed: false,
    })),
  };
}
