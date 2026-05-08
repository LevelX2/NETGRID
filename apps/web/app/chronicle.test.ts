import { describe, expect, it } from "vitest";
import type { PublicGameEvent, Side } from "@netgrid/shared";
import { formatChronicleEvent } from "./chronicle";

const ACTION_TYPES = [
  "mandatory_draw",
  "gain_credit",
  "draw_card",
  "install_card",
  "play_event",
  "play_operation",
  "advance_card",
  "score_agenda",
  "start_run",
  "rez_ice",
  "decline_rez",
  "pump_breaker",
  "break_subroutine",
  "continue_run",
  "access_card",
  "steal_agenda",
  "trash_accessed_card",
  "decline_trash",
  "remove_tag",
  "move_to_set_aside",
  "move_to_removed_from_game",
  "return_from_set_aside",
  "change_card_control",
  "end_turn",
  "game_created"
] as const;

describe("formatChronicleEvent", () => {
  it("formats all current action types without technical metadata", () => {
    for (const actionType of ACTION_TYPES) {
      const item = formatChronicleEvent(makeEvent(actionType), "runner");
      const serialized = JSON.stringify(item);

      expect(item.title.length).toBeGreaterThan(8);
      expect(serialized).not.toContain("fnv1a");
      expect(serialized).not.toContain("stateHashAfter");
      expect(serialized).not.toContain("stateVersionAfter");
      expect(serialized).not.toContain("corp.play_operation");
      expect(serialized).not.toContain("idempotencyKey");
    }
  });

  it("redacts hidden Corp installs from the Runner perspective", () => {
    const item = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "corp",
        label: "Korp installiert eine Karte.",
        redactedKind: "installed_card"
      }),
      "runner",
      {
        cardTitle: "Simple Agenda",
        cardText: "2 Agenda-Punkte.",
        cardDetailLines: ["Korp · agenda"]
      }
    );

    expect(item.title).toBe("Die Korp hat eine verdeckte Karte installiert.");
    expect(item.category).toBe("hidden");
    expect(item.visibility).toBe("redacted");
    expect(JSON.stringify(item)).not.toContain("Simple Agenda");
    expect(item.cardTitle).toBeUndefined();
    expect(item.cardText).toBeUndefined();
    expect(item.cardDetailLines).toEqual([]);
  });

  it("uses Du-perspective for own Runner runs", () => {
    const item = formatChronicleEvent(
      makeEvent("start_run", {
        actor: "runner",
        label: "Run auf R&D",
        serverLabel: "R&D"
      }),
      "runner"
    );

    expect(item.title).toBe("Du hast einen Run auf R&D gestartet.");
    expect(item.chips).toContain("Run");
    expect(item.chips).toContain("R&D");
  });

  it("keeps Encounter continuation chronicle text consistent when subroutines end the run", () => {
    const item = formatChronicleEvent(
      makeEvent("continue_run", {
        actor: "runner",
        result: "ended",
        encounterContinue: true,
        encounterWillEndRun: true,
        unbrokenSubroutineCount: 1
      }),
      "runner"
    );

    expect(item.title).toBe("Du hast ungebrochene Subroutinen ausgelöst und der Run endete.");
    expect(item.chips).toContain("Subroutinen");
  });

  it("names visible Runner installs from the public label and Rig zone", () => {
    const item = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "runner",
        label: "Simple Killer installieren",
        zoneLabel: "Rig"
      }),
      "runner"
    );

    expect(item.title).toBe("Du hast Simple Killer im Rig installiert.");
    expect(item.cardTitle).toBe("Simple Killer");
    expect(item.chips).toContain("Rig");
  });

  it("marks AI actions without showing explanation text as a chronicle reason line", () => {
    const item = formatChronicleEvent(
      makeEvent("play_operation", {
        actor: "corp",
        title: "Simple Economy Operation",
        aiReasonCode: "corp.economy.operation",
        aiExplanation: "Credits verbessern Rez- und Score-Fenster."
      }),
      "runner",
      {
        cardTitle: "Simple Economy Operation",
        cardText: "Erhalte 4 Credits."
      }
    );

    expect(item.title).toBe("Die Korp-KI hat Simple Economy Operation gespielt und Credits erhalten.");
    expect(item.description).toBeUndefined();
    expect(item.chips).toContain("KI");
    expect(JSON.stringify(item)).not.toContain("Credits verbessern Rez- und Score-Fenster.");
    expect(JSON.stringify(item)).not.toContain("corp.economy.operation");
  });

  it("highlights stolen agendas with visible agenda points", () => {
    const item = formatChronicleEvent(
      makeEvent("steal_agenda", {
        actor: "runner",
        title: "Project Agenda",
        agendaPoints: 2
      }),
      "runner",
      {
        cardTitle: "Project Agenda"
      }
    );

    expect(item.title).toBe("Du hast Project Agenda gestohlen und 2 Agenda-Punkte erhalten.");
    expect(item.category).toBe("agenda");
    expect(item.importance).toBe("critical");
    expect(item.chips).toContain("+2 Agenda");
  });

  it("names accessed cards when the access event reveals one", () => {
    const item = formatChronicleEvent(
      makeEvent("access_card", {
        actor: "runner",
        title: "Simple Economy Operation",
        serverLabel: "HQ"
      }),
      "runner",
      {
        cardTitle: "Simple Economy Operation"
      }
    );

    expect(item.title).toBe("Du hast auf Simple Economy Operation zugegriffen.");
    expect(item.cardTitle).toBe("Simple Economy Operation");
    expect(item.chips).toContain("HQ");
  });

  it("describes Corp advances as installations and developments without leaking hidden titles", () => {
    const hidden = formatChronicleEvent(
      makeEvent("advance_card", {
        actor: "corp",
        serverLabel: "Remote 2",
        redactedKind: "installed_card",
        title: "Simple Agenda"
      }),
      "runner",
      {
        cardTitle: "Simple Agenda",
        cardType: "agenda"
      }
    );
    const visibleAgenda = formatChronicleEvent(
      makeEvent("advance_card", {
        actor: "corp",
        serverLabel: "Remote 2"
      }),
      "runner",
      {
        cardTitle: "Hostile Takeover",
        cardType: "agenda"
      }
    );

    expect(hidden.title).toBe("Die Korp hat eine Installation in Außenserver 2 ausgebaut.");
    expect(hidden.visibility).toBe("redacted");
    expect(hidden.chips).toEqual(["Korp", "+1 Entwicklung", "Außenserver 2", "Verdeckt"]);
    expect(JSON.stringify(hidden)).not.toContain("Simple Agenda");
    expect(visibleAgenda.title).toBe("Die Korp hat das Projekt Hostile Takeover weiterentwickelt.");
    expect(visibleAgenda.chips).toContain("+1 Entwicklung");
  });

  it("exposes action ordinal metadata only for entries that spent actions", () => {
    const paid = formatChronicleEvent(
      makeEvent("install_card", {
        actor: "corp",
        actionCostClicks: 1,
        turnActionOrdinalStart: 2,
        turnActionOrdinalEnd: 2,
        redactedKind: "installed_card"
      }),
      "runner"
    );
    const free = formatChronicleEvent(makeEvent("rez_ice", { actor: "corp" }), "runner");
    const multi = formatChronicleEvent(
      makeEvent("purge_virus_counters", {
        actor: "corp",
        actionCostClicks: 3,
        turnActionOrdinalStart: 1,
        turnActionOrdinalEnd: 3
      }),
      "runner"
    );

    expect(paid.actionUse).toMatchObject({ label: "2", title: "2. Aktion in diesem Zug", clicks: 1 });
    expect(free.actionUse).toBeUndefined();
    expect(multi.actionUse).toMatchObject({ label: "1-3", title: "Aktionen 1 bis 3 in diesem Zug", clicks: 3 });
  });
});

function makeEvent(actionType: string, payload: Record<string, unknown> = {}): PublicGameEvent {
  const actor = sideValue(payload.actor) ?? (actionType === "mandatory_draw" || actionType === "play_operation" ? "corp" : "runner");
  return {
    eventId: `evt_${actionType}`,
    type: actionType,
    stateVersionBefore: 4,
    stateVersionAfter: 5,
    stateHashAfter: "fnv1a:73fe4ee3",
    publicPayload: {
      actor,
      actionType,
      label: `${actor}.${actionType}`,
      ...payload
    }
  };
}

function sideValue(value: unknown): Side | undefined {
  return value === "corp" || value === "runner" ? value : undefined;
}
