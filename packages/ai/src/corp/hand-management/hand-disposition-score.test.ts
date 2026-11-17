import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { corpHandDispositionScore } from "./hand-disposition-score";

describe("Corp hand disposition score", () => {
  it("can return an agenda to R&D when HQ is flooded", () => {
    const agenda = card(
      "agenda-1",
      400,
      "agenda",
      2,
    );
    const input = corpInput([
      agenda,
      { ...agenda, instanceId: "agenda-2" },
      { ...agenda, instanceId: "agenda-3" },
      card("operation", 496, "operation"),
      card("ice", 473, "ice"),
    ]);

    const score = corpHandDispositionScore({
      input,
      card: agenda,
      destination: "rd_shuffle",
      baseKeepScore: { total: 500 },
    });

    expect(score.total).toBeLessThan(100);
    expect(score.evidence).toEqual(
      expect.arrayContaining([
        "corp_hand_destination_agenda_flood_relief",
        "corp_hand_destination_duplicate_agenda_relief",
      ]),
    );
  });

  it("protects a matchpoint agenda despite agenda flood", () => {
    const agenda = card(
      "agenda-1",
      400,
      "agenda",
      2,
    );
    const input = corpInput(
      [
        agenda,
        { ...agenda, instanceId: "agenda-2" },
        { ...agenda, instanceId: "agenda-3" },
      ],
      { ownAgendaPoints: 5 },
    );

    const score = corpHandDispositionScore({
      input,
      card: agenda,
      destination: "rd_shuffle",
      baseKeepScore: { total: 500 },
    });

    expect(score.total).toBeGreaterThan(500);
    expect(score.evidence).toContain(
      "corp_hand_destination_matchpoint_protected",
    );
  });

  it("prices immediate R&D exposure more strongly for shuffle than bottom", () => {
    const agenda = card(
      "agenda-1",
      400,
      "agenda",
      2,
    );
    const input = corpInput([agenda, card("other", syntheticCardDefinitionId("simple_asset"), "asset")], {
      hqIce: 2,
      rdIce: 0,
    });
    const shuffle = corpHandDispositionScore({
      input,
      card: agenda,
      destination: "rd_shuffle",
      baseKeepScore: { total: 500 },
    });
    const bottom = corpHandDispositionScore({
      input,
      card: agenda,
      destination: "rd_bottom",
      baseKeepScore: { total: 500 },
    });

    expect(shuffle.total).toBeGreaterThan(bottom.total);
    expect(shuffle.evidence).toContain(
      "corp_hand_destination_rd_exposure_risk",
    );
  });

  it("preserves a card bound to the current plan", () => {
    const agenda = card(
      "agenda-1",
      400,
      "agenda",
      2,
    );
    const input = corpInput([
      agenda,
      { ...agenda, instanceId: "agenda-2" },
      { ...agenda, instanceId: "agenda-3" },
    ]);
    const unbound = corpHandDispositionScore({
      input,
      card: agenda,
      destination: "rd_shuffle",
      baseKeepScore: { total: 500 },
    });
    const bound = corpHandDispositionScore({
      input,
      card: agenda,
      destination: "rd_shuffle",
      baseKeepScore: { total: 500, planDisposition: "current_plan_route" },
    });

    expect(bound.total - unbound.total).toBe(700);
    expect(bound.evidence).toContain(
      "corp_hand_destination_current_plan_protected",
    );
  });
});

function corpInput(
  hand: VisibleCard[],
  options: {
    ownAgendaPoints?: number;
    hqIce?: number;
    rdIce?: number;
  } = {},
): AiDecisionInput {
  return {
    side: "corp",
    difficulty: "normal",
    seed: "corp-hand-disposition-score-test",
    decisionId: "corp-hand-disposition-score-decision",
    actionNumber: 1,
    profileId: "standard",
    playerView: {
      side: "corp",
      stateVersion: 12,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: card("corp-id", 3, "identity"),
        credits: 5,
        clicks: 1,
        agendaPoints: options.ownAgendaPoints ?? 0,
        gripOrHq: hand,
        rig: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: card("runner-id", 587, "identity"),
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 30,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [
        server("hq", options.hqIce ?? 0),
        server("rd", options.rdIce ?? 0),
        server("archives", 0),
      ],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: [],
  } as AiDecisionInput;
}

function server(id: "hq" | "rd" | "archives", iceCount: number) {
  return {
    id,
    kind: id,
    label: id,
    ice: Array.from({ length: iceCount }, (_, index) =>
      card(`${id}-ice-${index}`, 473, "ice", undefined, {
        rezzed: true,
      }),
    ),
    root: [],
  };
}

function card(
  instanceId: string,
  definitionId: number,
  type: VisibleCard["type"],
  agendaPoints?: number,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    definitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "hq" },
    known: true,
    type,
    ...(agendaPoints !== undefined ? { agendaPoints } : {}),
    ...overrides,
  } as VisibleCard;
}
