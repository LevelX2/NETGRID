import { type CardDefinitionId } from "@netgrid/shared";
import type {
  LegalAction,
  PlayerView,
  PublicGameEvent,
  Side,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  accessRevealFromLatestEvent,
  gypsyScheduleAnalyzerRevealFromPendingChoice,
  hqAgendaRevealFromLatestEvent,
  retainedHqAgendaRevealEvent,
  retainedSecurityPurgeRevealEvent,
  securityPurgeRevealFromLatestEvent,
} from "../features/actions/access-review-derivation";

describe("Access outcome presentation", () => {
  it("explains a lethal Fetal AI access before any steal choice", () => {
    const access = event(100, {
      actionType: "access_card",
      actor: "runner",
      cardDefinitionId: 9145,
      title: "Fetal AI",
      serverLabel: "R&D",
      damageResolved: true,
      damageType: "net",
      damageAmount: 2,
      runnerGripBefore: 1,
      runnerGripAfter: 0,
      flatline: true,
    });

    expect(
      accessRevealFromLatestEvent(
        access,
        { 9145: catalogCard(9145, "Fetal AI", "agenda") },
        [],
        "runner",
        [access],
      ),
    ).toMatchObject({
      eventId: 100,
      trashStatus:
        "2 Net Damage wurden beim Zugriff sofort aufgelöst. Du wurdest dadurch flatlined; davor hattest du 1 Handkarte. Die Agenda konnte deshalb nicht mehr gestohlen werden.",
      actions: [],
    });
  });

  it("adds the public trash outcome to the retained Setup access", () => {
    const access = event(101, {
      actionType: "access_card",
      actor: "runner",
      cardDefinitionId: 552,
      title: "Setup!",
      serverLabel: "R&D",
    });
    const trash = event(102, {
      actionType: "trash_accessed_card",
      actor: "runner",
      cardDefinitionId: 552,
      title: "Setup!",
      serverLabel: "R&D",
    });

    expect(
      accessRevealFromLatestEvent(
        access,
        {
          552: catalogCard(552, "Setup!", "asset"),
        },
        [],
        "corp",
        [access, trash],
      ),
    ).toMatchObject({
      eventId: 101,
      outcomeStatus: "Der Runner hat Setup! getrasht.",
    });
  });

  it.each([
    ["R&D", "rd"],
    ["HQ", "hq"],
    ["Archive", "archives"],
    ["Remote 1", "remote_root"],
  ])(
    "presents a stolen agenda from %s as a read-only confirmation",
    (serverLabel, accessOrigin) => {
      const access = event(2, {
        actionType: "access_card",
        actor: "runner",
        cardDefinitionId: 9148,
        title: "Public Agenda",
        serverLabel,
        accessOrigin,
      });
      const steal = event(3, {
        actionType: "steal_agenda",
        actor: "runner",
        cardDefinitionId: 9148,
      });

      expect(
        accessRevealFromLatestEvent(
          access,
          {
            9148: catalogCard(
              9148,
              "Public Agenda",
              "agenda",
            ),
          },
          [],
          "corp",
          [access, steal],
        ),
      ).toMatchObject({
        eventId: access.eventId,
        outcomeKind: "stolen",
        outcomeStatus: "Der Runner hat die Agenda Public Agenda erbeutet.",
        dismissLabel: "Agenda bestätigen",
        actions: [],
        card: {
          definitionId: 9148,
          title: "Public Agenda",
          type: "agenda",
        },
      });
    },
  );

  it("separates central root upgrades from HQ, R&D and Archives cards", () => {
    const details = {
      9151: catalogCard(9151, "Root Upgrade", "upgrade"),
      9152: catalogCard(9152, "Central Card", "operation"),
    };
    const hqRoot = accessRevealFromLatestEvent(
      event(103, {
        actionType: "access_card",
        actor: "runner",
        cardDefinitionId: 9151,
        title: "Root Upgrade",
        serverLabel: "HQ",
        accessOrigin: "central_root",
        accessIndex: 0,
        effectiveAccessCount: 4,
      }),
      details,
      [],
      "runner",
    );
    const hqCard = accessRevealFromLatestEvent(
      event(104, {
        actionType: "access_card",
        actor: "runner",
        cardDefinitionId: 9152,
        title: "Central Card",
        serverLabel: "HQ",
        accessOrigin: "hq",
        accessIndex: 3,
        effectiveAccessCount: 4,
      }),
      details,
      [],
      "runner",
    );
    const rdRoot = accessRevealFromLatestEvent(
      event(105, {
        actionType: "access_card",
        actor: "runner",
        cardDefinitionId: 9151,
        title: "Root Upgrade",
        serverLabel: "R&D",
        accessOrigin: "central_root",
      }),
      details,
      [],
      "runner",
    );
    const archivesCard = accessRevealFromLatestEvent(
      event(106, {
        actionType: "access_card",
        actor: "runner",
        cardDefinitionId: 9152,
        title: "Central Card",
        serverLabel: "Archive",
        accessOrigin: "archives",
      }),
      details,
      [],
      "runner",
    );

    expect(hqRoot).toMatchObject({
      serverTitleLabel: "HQ-Root",
      accessSourceLabel: "Installiertes HQ-Upgrade",
      hasMoreAccesses: true,
      description: "Du hast auf ein Root-Upgrade im HQ-Root zugegriffen.",
    });
    expect(hqCard).toMatchObject({
      serverTitleLabel: "HQ",
      accessSourceLabel: "Zufällige HQ-Handkarte",
      hasMoreAccesses: false,
      description: "Du hast auf eine Karte in HQ zugegriffen.",
    });
    expect(rdRoot?.serverTitleLabel).toBe("R&D-Root");
    expect(archivesCard).toMatchObject({
      serverTitleLabel: "Archive",
      description: "Du hast auf eine Karte im Archiv zugegriffen.",
    });
  });

  it("shows generic Rush Hour progress for repeated R&D card definitions", () => {
    const firstAccess = event(12, {
      actionType: "access_card",
      actor: "runner",
      cardDefinitionId: 449,
      title: "Data Wall",
      serverLabel: "R&D",
      accessIndex: 0,
      baseAccessCount: 4,
      effectiveAccessCount: 4,
    });
    const secondAccess = event(13, {
      actionType: "access_card",
      actor: "runner",
      cardDefinitionId: 519,
      title: "Urban Renewal",
      serverLabel: "R&D",
      accessIndex: 1,
      baseAccessCount: 4,
      effectiveAccessCount: 4,
    });
    const thirdAccess = event(14, {
      actionType: "access_card",
      actor: "runner",
      cardDefinitionId: 449,
      title: "Data Wall",
      serverLabel: "R&D",
      accessIndex: 2,
      baseAccessCount: 4,
      effectiveAccessCount: 4,
    });
    const fourthAccess = event(15, {
      actionType: "access_card",
      actor: "runner",
      cardDefinitionId: 519,
      title: "Urban Renewal",
      serverLabel: "R&D",
      accessIndex: 3,
      baseAccessCount: 4,
      effectiveAccessCount: 4,
    });

    const accesses = [firstAccess, secondAccess, thirdAccess, fourthAccess];
    expect(
      accesses.map(
        (access) =>
          accessRevealFromLatestEvent(access, {}, [], "runner", accesses)
            ?.progressStatus,
      ),
    ).toEqual([
      "Zugriff 1 von 4",
      "Zugriff 2 von 4",
      "Zugriff 3 von 4",
      "Zugriff 4 von 4",
    ]);
  });
});

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
        596: catalogCard(
          596,
          "Simple Economy Operation",
          "operation",
        ),
        588: catalogCard(588, "Simple Agenda", "agenda"),
      },
      [action],
      "runner",
      [
        event(107, {
          actionType: "resolve_choice",
          hiddenZoneAction: "gypsy_schedule_analyzer_reveal_next",
          publicRevealDefinitionIds: "11005",
          publicRevealTitles: "Old Card",
        }),
        {
          ...event(108, {
            actionType: "resolve_choice",
            hiddenZoneAction: "gypsy_schedule_analyzer_reveal_next",
            publicRevealDefinitionIds: "596,588",
            publicRevealTitles: "Simple Economy Operation||Simple Agenda",
            revealedAgendaDefinitionIds: "588",
            revealedCount: 2,
          }),
          stateVersionAfter: 10,
        },
      ],
    );

    expect(review).toMatchObject({
      eventId: 108,
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
      event(109, {
        actionType: "score_agenda",
        actor: "corp",
        title: "Security Purge",
        agendaAbility: "agenda_purge",
        hiddenZoneAction: "agenda_purge_rd_top3",
        publicRevealDefinitionIds:
          "594,596,588",
        publicRevealTitles:
          "Simple Economy Asset||Simple Economy Operation||Simple Agenda",
        revealedCount: 3,
        revealedIceCount: 0,
        trashedCount: 3,
        agendaPurgeTargetChoiceOpened: false,
      }),
      {
        594: catalogCard(
          594,
          "Simple Economy Asset",
          "asset",
        ),
        596: catalogCard(
          596,
          "Simple Economy Operation",
          "operation",
        ),
        588: catalogCard(588, "Simple Agenda"),
      },
      "corp",
    );

    expect(review).toMatchObject({
      eventId: 109,
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
    const reveal = event(109, {
      actionType: "score_agenda",
      actor: "corp",
      agendaAbility: "agenda_purge",
      hiddenZoneAction: "agenda_purge_rd_top3",
      publicRevealDefinitionIds: "594",
      revealedCount: 1,
      revealedIceCount: 0,
      trashedCount: 1,
      agendaPurgeTargetChoiceOpened: false,
    });
    const laterAction = {
      ...event(110, {
        actionType: "mandatory_draw",
        actor: "corp",
      }),
      stateVersionAfter: 8,
    };

    expect(
      retainedSecurityPurgeRevealEvent([reveal, laterAction], [])?.eventId,
    ).toBe(109);
    expect(
      retainedSecurityPurgeRevealEvent(
        [reveal, laterAction],
        [109],
      ),
    ).toBeNull();
  });

  it("does not cover the active corp target-choice panel", () => {
    const reveal = event(111, {
      actionType: "score_agenda",
      actor: "corp",
      agendaAbility: "agenda_purge",
      hiddenZoneAction: "agenda_purge_rd_top3_target_choice",
      publicRevealDefinitionIds: "589,594",
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
    ).toBe(111);
  });

  it("stops retaining the initial reveal after Security Purge target choice resolves", () => {
    const reveal = event(111, {
      actionType: "score_agenda",
      actor: "corp",
      agendaAbility: "agenda_purge",
      hiddenZoneAction: "agenda_purge_rd_top3_target_choice",
      publicRevealDefinitionIds: "589,594",
      revealedCount: 2,
      revealedIceCount: 1,
      pendingTrashCount: 1,
      agendaPurgeTargetChoiceOpened: true,
    });
    const resolved = event(112, {
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
      event(113, {
        actionType: "resolve_choice",
        actor: "corp",
        hiddenZoneAction: "corp_hq_agenda_reveal",
        sourceTitle: "Corporate Negotiating Center",
        publicRevealKind: "reveal",
        publicRevealDefinitionIds: "588,415",
        publicRevealTitles: "Simple Agenda||Hostile Takeover",
        revealedCount: 2,
        gainedCredits: 2,
      }),
      {
        588: catalogCard(588, "Simple Agenda"),
        415: catalogCard(
          415,
          "Hostile Takeover",
        ),
      },
      "runner",
    );

    expect(review).toMatchObject({
      eventId: 113,
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
    const reveal = event(113, {
      actionType: "resolve_choice",
      actor: "corp",
      hiddenZoneAction: "corp_hq_agenda_reveal",
      publicRevealKind: "reveal",
      publicRevealDefinitionIds: "588",
      publicRevealTitles: "Simple Agenda",
    });
    const laterAction = {
      ...event(110, {
        actionType: "mandatory_draw",
        actor: "corp",
      }),
      stateVersionAfter: 8,
    };

    expect(
      retainedHqAgendaRevealEvent([reveal, laterAction], [])?.eventId,
    ).toBe(113);
    expect(
      retainedHqAgendaRevealEvent([reveal, laterAction], [113]),
    ).toBeNull();
  });

  it("does not open a card review when Corporate Negotiating Center reveals no agendas", () => {
    const previousReveal = event(114, {
      actionType: "resolve_choice",
      actor: "corp",
      hiddenZoneAction: "corp_hq_agenda_reveal",
      publicRevealKind: "reveal",
      publicRevealDefinitionIds: "588",
      publicRevealTitles: "Simple Agenda",
    });
    const noReveal = event(115, {
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
  eventId: number,
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

function catalogCard(catalogCardId: CardDefinitionId, title: string, type = "agenda") {
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
