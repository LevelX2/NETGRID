import type { PublicGameEvent, Side } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  hqAgendaRevealFromLatestEvent,
  retainedHqAgendaRevealEvent,
} from "../features/actions/access-review-derivation";

describe("Corporate Negotiating Center reveal review", () => {
  it("builds a persistent HQ agenda reveal review with visible agenda cards", () => {
    const review = hqAgendaRevealFromLatestEvent(
      event("evt_cnc", {
        actionType: "resolve_choice",
        actor: "corp",
        hiddenZoneAction: "corp_hq_agenda_reveal",
        sourceTitle: "Corporate Negotiating Center",
        publicRevealKind: "reveal",
        publicRevealDefinitionIds: "simple_agenda,onr_v1_203_hostile-takeover",
        publicRevealTitles: "Simple Agenda||Hostile Takeover",
        revealedCount: 2,
        gainedCredits: 2,
      }),
      {
        simple_agenda: catalogCard("simple_agenda", "Simple Agenda"),
        "onr_v1_203_hostile-takeover": catalogCard(
          "onr_v1_203_hostile-takeover",
          "Hostile Takeover",
        ),
      },
      "runner",
    );

    expect(review).toMatchObject({
      eventId: "evt_cnc",
      kind: "hq_agenda_reveal",
      serverLabel: "HQ",
      description:
        "Die Korp hat 2 Agenden aus HQ durch Corporate Negotiating Center vorgezeigt.",
      trashStatus:
        "Diese Agenden wurden öffentlich vorgezeigt und bleiben hier sichtbar, bis du das Ansehen beendest.",
      revealedCardStatus: "Aus HQ vorgezeigt",
      dismissLabel: "Ansehen beenden",
    });
    expect(review?.revealedCards?.map((card) => card.title)).toEqual([
      "Simple Agenda",
      "Hostile Takeover",
    ]);
    expect(JSON.stringify(review)).not.toContain("cardInstances");
  });

  it("retains the latest HQ agenda reveal until it is explicitly dismissed", () => {
    const reveal = event("evt_cnc", {
      actionType: "resolve_choice",
      actor: "corp",
      hiddenZoneAction: "corp_hq_agenda_reveal",
      publicRevealKind: "reveal",
      publicRevealDefinitionIds: "simple_agenda",
      publicRevealTitles: "Simple Agenda",
    });
    const laterAction = {
      ...event("evt_later", {
        actionType: "mandatory_draw",
        actor: "corp",
      }),
      stateVersionAfter: 8,
    };

    expect(
      retainedHqAgendaRevealEvent([reveal, laterAction], [])?.eventId,
    ).toBe("evt_cnc");
    expect(
      retainedHqAgendaRevealEvent([reveal, laterAction], ["evt_cnc"]),
    ).toBeNull();
  });

  it("does not open a card review when Corporate Negotiating Center reveals no agendas", () => {
    const previousReveal = event("evt_cnc_previous", {
      actionType: "resolve_choice",
      actor: "corp",
      hiddenZoneAction: "corp_hq_agenda_reveal",
      publicRevealKind: "reveal",
      publicRevealDefinitionIds: "simple_agenda",
      publicRevealTitles: "Simple Agenda",
    });
    const noReveal = event("evt_cnc_none", {
      actionType: "resolve_choice",
      actor: "corp",
      hiddenZoneAction: "corp_hq_agenda_reveal",
      publicRevealKind: "reveal",
      publicRevealDefinitionIds: "",
      publicRevealTitles: "",
      revealedCount: 0,
      gainedCredits: 0,
    });

    expect(hqAgendaRevealFromLatestEvent(noReveal, {}, "runner")).toBeNull();
    expect(retainedHqAgendaRevealEvent([noReveal], [])).toBeNull();
    expect(retainedHqAgendaRevealEvent([previousReveal, noReveal], [])).toBeNull();
  });
});

function event(
  eventId: string,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type: String(publicPayload.actionType ?? "action"),
    stateVersionBefore: 1,
    stateVersionAfter: 2,
    stateHashAfter: `${eventId}_hash`,
    publicPayload,
  };
}

function catalogCard(catalogCardId: string, title: string) {
  return {
    catalogCardId,
    title,
    side: "corp" as Side,
    type: "agenda",
    subtypes: [],
    setId: "test",
    setName: "Test",
    collectorNumber: "1",
    text: "Agenda.",
    numeric: {
      agendaPoints: 2,
    },
  };
}
