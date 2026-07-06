import type {
  LegalAction,
  PlayerView,
  PublicGameEvent,
  Side,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  gypsyScheduleAnalyzerRevealFromPendingChoice,
  hqAgendaRevealFromLatestEvent,
  retainedHqAgendaRevealEvent,
  retainedSecurityPurgeRevealEvent,
  securityPurgeRevealFromLatestEvent,
} from "../features/actions/access-review-derivation";

describe("Gypsy Schedule Analyzer reveal review", () => {
  it("opens an empty stepwise R&D reveal review from the pending choice", () => {
    const view = gypsyView({
      stateVersion: 7,
      choiceId: "gypsy_rd_reveal_run_1_7",
      choiceStateVersion: 7,
      optionId: "reveal_next",
      optionLabel: "Erste R&D-Karte zeigen",
    });
    const action = choiceAction("gypsy_rd_reveal_run_1_7");

    const review = gypsyScheduleAnalyzerRevealFromPendingChoice(
      view,
      {},
      [action],
      "runner",
      [],
    );

    expect(review).toMatchObject({
      eventId: "gypsy-rd-reveal:7:gypsy_rd_reveal_run_1_7",
      kind: "gypsy_rd_reveal",
      serverLabel: "R&D",
      description:
        "Du deckst R&D mit Gypsy Schedule Analyzer Karte für Karte auf.",
      trashStatus: "Bereit: Decke die erste R&D-Karte auf.",
      choiceAction: action,
    });
    expect(review?.choice?.options.map((option) => option.id)).toEqual([
      "reveal_next",
    ]);
    expect(review?.revealedCards).toEqual([]);
  });

  it("keeps the cumulative revealed R&D list while the finish choice is pending", () => {
    const view = gypsyView({
      stateVersion: 10,
      choiceId: "gypsy_rd_reveal_run_1_10",
      choiceStateVersion: 10,
      optionId: "finish",
      optionLabel: "Agenda nach HQ legen und R&D mischen",
    });
    const action = choiceAction("gypsy_rd_reveal_run_1_10");
    const review = gypsyScheduleAnalyzerRevealFromPendingChoice(
      view,
      {
        simple_economy_operation: catalogCard(
          "simple_economy_operation",
          "Simple Economy Operation",
          "operation",
        ),
        simple_agenda: catalogCard("simple_agenda", "Simple Agenda", "agenda"),
      },
      [action],
      "runner",
      [
        event("evt_old", {
          actionType: "resolve_choice",
          hiddenZoneAction: "gypsy_schedule_analyzer_reveal_next",
          publicRevealDefinitionIds: "old_card",
          publicRevealTitles: "Old Card",
        }),
        {
          ...event("evt_gypsy", {
            actionType: "resolve_choice",
            hiddenZoneAction: "gypsy_schedule_analyzer_reveal_next",
            publicRevealDefinitionIds: "simple_economy_operation,simple_agenda",
            publicRevealTitles: "Simple Economy Operation||Simple Agenda",
            revealedAgendaDefinitionIds: "simple_agenda",
            revealedCount: 2,
          }),
          stateVersionAfter: 10,
        },
      ],
    );

    expect(review).toMatchObject({
      eventId: "evt_gypsy",
      kind: "gypsy_rd_reveal",
      trashStatus:
        "Agenda gefunden. Bestätige, um die Agenda nach HQ zu legen und die übrigen Karten in R&D zu mischen.",
      choiceAction: action,
    });
    expect(review?.revealedCards?.map((card) => card.title)).toEqual([
      "Simple Economy Operation",
      "Simple Agenda",
    ]);
    expect(review?.choice?.options.map((option) => option.id)).toEqual([
      "finish",
    ]);
    expect(JSON.stringify(review)).not.toContain("cardInstances");
  });
});

describe("Security Purge reveal review", () => {
  it("shows the revealed R&D cards when Security Purge finds no ICE", () => {
    const review = securityPurgeRevealFromLatestEvent(
      event("evt_security_purge", {
        actionType: "score_agenda",
        actor: "corp",
        title: "Security Purge",
        agendaAbility: "agenda_purge",
        hiddenZoneAction: "agenda_purge_rd_top3",
        publicRevealDefinitionIds:
          "simple_economy_asset,simple_economy_operation,simple_agenda",
        publicRevealTitles:
          "Simple Economy Asset||Simple Economy Operation||Simple Agenda",
        revealedCount: 3,
        revealedIceCount: 0,
        trashedCount: 3,
        agendaPurgeTargetChoiceOpened: false,
      }),
      {
        simple_economy_asset: catalogCard(
          "simple_economy_asset",
          "Simple Economy Asset",
          "asset",
        ),
        simple_economy_operation: catalogCard(
          "simple_economy_operation",
          "Simple Economy Operation",
          "operation",
        ),
        simple_agenda: catalogCard("simple_agenda", "Simple Agenda"),
      },
      "corp",
    );

    expect(review).toMatchObject({
      eventId: "evt_security_purge",
      kind: "security_purge_reveal",
      serverLabel: "R&D",
      description:
        "Du hast die obersten 3 R&D-Karten durch Security Purge aufgedeckt.",
      trashStatus: "Kein ICE gefunden. Diese Karten wurden getrasht.",
      revealedCardStatus: "Durch Security Purge getrasht",
      dismissLabel: "Gesehen",
    });
    expect(review?.revealedCards?.map((card) => card.title)).toEqual([
      "Simple Economy Asset",
      "Simple Economy Operation",
      "Simple Agenda",
    ]);
    expect(JSON.stringify(review)).not.toContain("cardInstances");
  });

  it("retains a no-ICE reveal until it is explicitly dismissed", () => {
    const reveal = event("evt_security_purge", {
      actionType: "score_agenda",
      actor: "corp",
      agendaAbility: "agenda_purge",
      hiddenZoneAction: "agenda_purge_rd_top3",
      publicRevealDefinitionIds: "simple_economy_asset",
      revealedCount: 1,
      revealedIceCount: 0,
      trashedCount: 1,
      agendaPurgeTargetChoiceOpened: false,
    });
    const laterAction = {
      ...event("evt_later", {
        actionType: "mandatory_draw",
        actor: "corp",
      }),
      stateVersionAfter: 8,
    };

    expect(
      retainedSecurityPurgeRevealEvent([reveal, laterAction], [])?.eventId,
    ).toBe("evt_security_purge");
    expect(
      retainedSecurityPurgeRevealEvent([reveal, laterAction], [
        "evt_security_purge",
      ]),
    ).toBeNull();
  });

  it("does not cover the active corp target-choice panel", () => {
    const reveal = event("evt_security_purge_choice", {
      actionType: "score_agenda",
      actor: "corp",
      agendaAbility: "agenda_purge",
      hiddenZoneAction: "agenda_purge_rd_top3_target_choice",
      publicRevealDefinitionIds: "simple_barrier_ice,simple_economy_asset",
      revealedCount: 2,
      revealedIceCount: 1,
      pendingTrashCount: 1,
      agendaPurgeTargetChoiceOpened: true,
    });

    expect(
      retainedSecurityPurgeRevealEvent([reveal], [], {
        suppressTargetChoiceOpened: true,
      }),
    ).toBeNull();
    expect(
      retainedSecurityPurgeRevealEvent([reveal], [], {
        suppressTargetChoiceOpened: false,
      })?.eventId,
    ).toBe("evt_security_purge_choice");
  });

  it("stops retaining the initial reveal after Security Purge target choice resolves", () => {
    const reveal = event("evt_security_purge_choice", {
      actionType: "score_agenda",
      actor: "corp",
      agendaAbility: "agenda_purge",
      hiddenZoneAction: "agenda_purge_rd_top3_target_choice",
      publicRevealDefinitionIds: "simple_barrier_ice,simple_economy_asset",
      revealedCount: 2,
      revealedIceCount: 1,
      pendingTrashCount: 1,
      agendaPurgeTargetChoiceOpened: true,
    });
    const resolved = event("evt_security_purge_resolved", {
      actionType: "resolve_choice",
      actor: "corp",
      agendaAbility: "agenda_purge",
      hiddenZoneAction: "agenda_purge_install_targets",
      agendaPurgeTargetChoiceResolved: true,
    });

    expect(retainedSecurityPurgeRevealEvent([reveal, resolved], [])).toBeNull();
  });
});

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
    expect(
      retainedHqAgendaRevealEvent([previousReveal, noReveal], []),
    ).toBeNull();
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

function catalogCard(catalogCardId: string, title: string, type = "agenda") {
  return {
    catalogCardId,
    title,
    side: "corp" as Side,
    type,
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

function gypsyView(input: {
  stateVersion: number;
  choiceId: string;
  choiceStateVersion: number;
  optionId: string;
  optionLabel: string;
}): PlayerView {
  return {
    side: "runner",
    stateVersion: input.stateVersion,
    pendingChoice: {
      choiceId: input.choiceId,
      side: "runner",
      source: `successful_run.gypsy_rd_reveal:run_1::${input.choiceStateVersion}`,
      prompt: "Gypsy Schedule Analyzer: R&D aufdecken",
      kind: "select_option",
      options: [
        {
          id: input.optionId,
          label: input.optionLabel,
          value: input.optionId,
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: input.choiceStateVersion,
      visibility: "hidden_info_barrier",
    },
  } as PlayerView;
}

function choiceAction(choiceId: string): LegalAction {
  return {
    actionId: `runner.resolve_choice.${choiceId}`,
    side: "runner",
    type: "resolve_choice",
    source: "runner",
    label: "Auswahl treffen",
    costs: [],
    timingPoint: "access.resolve_card",
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    payload: { choiceId },
  };
}
