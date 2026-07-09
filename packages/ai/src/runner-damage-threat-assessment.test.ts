import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";

import { runnerDamageThreatAssessment } from "./runner-damage-threat-assessment";

describe("runnerDamageThreatAssessment", () => {
  it("treats recent visible damage at empty hand as critical survival pressure", () => {
    const assessment = runnerDamageThreatAssessment(
      input({
        handCount: 0,
        stateVersion: 39,
        events: [
          event("setup-net-damage", 32, {
            actionType: "net_damage",
            damageType: "net",
            damageAmount: 2,
            sourceTitle: "Setup!",
          }),
        ],
        servers: [
          {
            id: "rd",
            ice: [card({ definitionId: "rd-ice", type: "ice", rezzed: false })],
            root: [],
          },
        ],
      }),
    );

    expect(assessment).toMatchObject({
      level: "critical",
      handCount: 0,
      recommendedHandFloor: 3,
      criticalRunSuppression: true,
    });
    expect(assessment.riskyRunServerIds).toEqual(["rd"]);
    expect(assessment.evidence).toEqual(
      expect.arrayContaining([
        "runner_damage_threat_level:critical",
        "runner_damage_risky_servers:rd",
      ]),
    );
  });

  it("decays stale one-off damage evidence below confirmed pressure", () => {
    const assessment = runnerDamageThreatAssessment(
      input({
        handCount: 4,
        stateVersion: 40,
        events: [
          event("old-net-damage", 2, {
            actionType: "net_damage",
            damageType: "net",
            damageAmount: 1,
            sourceTitle: "Old trace",
          }),
        ],
      }),
    );

    expect(assessment.level).toBe("suspected");
    expect(assessment.recommendedHandFloor).toBe(2);
    expect(assessment.criticalRunSuppression).toBe(false);
    expect(assessment.evidence).toEqual(
      expect.arrayContaining([
        "runner_damage_threat_level:suspected",
        "runner_damage_stale:true",
      ]),
    );
  });
});

function input(params: {
  handCount: number;
  stateVersion: number;
  events?: readonly PublicGameEvent[];
  servers?: Array<{
    id: string;
    ice: VisibleCard[];
    root: VisibleCard[];
  }>;
}): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      stateVersion: params.stateVersion,
      own: {
        gripOrHq: Array.from({ length: params.handCount }, (_, index) =>
          card({ definitionId: `hand-${index}`, type: "event" }),
        ),
        heapOrArchives: [],
        rig: [],
        scoreArea: [],
        credits: 0,
      },
      opponent: {
        identity: card({ definitionId: "corp-identity", type: "identity" }),
      },
      servers: (params.servers ?? []).map((server) => ({
        id: server.id,
        label: server.id,
        ice: server.ice,
        root: server.root,
      })),
      publicEvents: [...(params.events ?? [])],
    },
    eventTail: [],
    legalActions: [],
  } as unknown as AiDecisionInput;
}

function card(params: {
  definitionId: string;
  type: NonNullable<VisibleCard["type"]>;
  rezzed?: boolean;
}): VisibleCard {
  return {
    instanceId: `${params.definitionId}-instance`,
    definitionId: params.definitionId,
    title: params.definitionId,
    owner: "corp",
    controller: "corp",
    type: params.type,
    known: true,
    ...(params.rezzed !== undefined ? { rezzed: params.rezzed } : {}),
  } as VisibleCard;
}

function event(
  eventId: string,
  stateVersionAfter: number,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type: String(publicPayload.actionType ?? "corp_action"),
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload,
  } as PublicGameEvent;
}
