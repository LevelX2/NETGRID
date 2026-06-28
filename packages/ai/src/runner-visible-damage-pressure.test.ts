import { describe, expect, it } from "vitest";
import type { AiDecisionInput, PublicGameEvent, VisibleCard } from "@netgrid/shared";

import { runnerVisibleDamagePressure } from "./runner-visible-damage-pressure";

describe("runnerVisibleDamagePressure", () => {
  it("treats runner tags as visible damage pressure", () => {
    expect(runnerVisibleDamagePressure(input({ tags: 1 }))).toBe(true);
  });

  it("uses bounded visible-card tokens for damage pressure", () => {
    expect(
      runnerVisibleDamagePressure(
        input({ visibleCards: [card({ rulesText: "Do 1 net damage." })] }),
      ),
    ).toBe(true);
    expect(
      runnerVisibleDamagePressure(
        input({ visibleCards: [card({ rulesText: "Damageful tagger text." })] }),
      ),
    ).toBe(false);
  });

  it("uses bounded public-event tokens for damage pressure", () => {
    expect(
      runnerVisibleDamagePressure(
        input({
          events: [
            event({
              type: "corp_action",
              publicPayload: { actionType: "deal_damage" },
            }),
          ],
        }),
      ),
    ).toBe(true);
    expect(
      runnerVisibleDamagePressure(
        input({
          events: [
            event({
              type: "corp_action",
              publicPayload: {
                actionType: "traceroute_noise",
                sourceTitle: "Tagger damageful shell",
              },
            }),
          ],
        }),
      ),
    ).toBe(false);
  });
});

function input(params: {
  tags?: number;
  visibleCards?: readonly VisibleCard[];
  events?: readonly PublicGameEvent[];
}): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      own: {
        tags: params.tags ?? 0,
        gripOrHq: [],
        heapOrArchives: [...(params.visibleCards ?? [])],
        rig: [],
        scoreArea: [],
        credits: 0,
      },
      opponent: {
        identity: card({ definitionId: "corp-identity" }),
      },
      servers: [],
      publicEvents: [...(params.events ?? [])],
    },
    eventTail: [],
    legalActions: [],
  } as unknown as AiDecisionInput;
}

function card(params: {
  definitionId?: string;
  title?: string;
  rulesText?: string;
}): VisibleCard {
  const definitionId = params.definitionId ?? "visible-card";
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    title: params.title ?? definitionId,
    rulesText: params.rulesText,
    known: true,
  } as VisibleCard;
}

function event(params: {
  type: string;
  publicPayload: Record<string, unknown>;
}): PublicGameEvent {
  return {
    eventId: "event-1",
    type: params.type,
    stateVersionBefore: 1,
    stateVersionAfter: 2,
    stateHashAfter: "hash-after",
    publicPayload: params.publicPayload,
  } as PublicGameEvent;
}
