import { describe, expect, it } from "vitest";
import type { PlayerView, PublicGameEvent, Side } from "@netrunner/shared";
import { cueHasHiddenLeak, deriveOpponentActionCues } from "./action-cues";

describe("deriveOpponentActionCues", () => {
  it("maps opponent AI events to stable cues without exposing raw reason codes", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event("evt_1", "mandatory_draw", {
          actor: "corp",
          aiReasonCode: "corp.mandatory_draw",
          aiExplanation: "Die Corp braucht ihre Pflichtkarte."
        })
      ]
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.cueId).toBe("runner:evt_1");
    expect(cues[0]?.source).toBe("ai");
    expect(cues[0]?.title).toBe("Die Corp-KI hat ihre Pflichtkarte gezogen.");
    expect(cues[0]?.description).toBe("Grund: Die Corp braucht ihre Pflichtkarte.");
    expect(JSON.stringify(cues[0])).not.toContain("corp.mandatory_draw");
  });

  it("redacts hidden Corp installs and keeps the highlight abstract", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event("evt_2", "install_card", {
          actor: "corp",
          label: "Corp installiert eine Karte.",
          redactedKind: "installed_card",
          cardDefinitionId: "simple_agenda",
          title: "Simple Agenda",
          serverId: "remote_1",
          serverLabel: "Remote 1",
          zoneLabel: "Root"
        })
      ]
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.visibility).toBe("redacted");
    expect(cues[0]?.title).toBe("Die Corp hat eine verdeckte Karte in Remote 1 installiert.");
    expect(cues[0]?.highlight).toEqual({ kind: "server", serverId: "remote_1", serverLabel: "Remote 1", lane: "root" });
    expect(cueHasHiddenLeak(cues[0]!)).toBe(false);
    expect(JSON.stringify(cues[0])).not.toContain("Simple Agenda");
    expect(JSON.stringify(cues[0])).not.toContain("simple_agenda");
  });

  it("filters own actions and derives visible card highlights only from PlayerView-visible cards", () => {
    const playerView = view("runner", {
      own: {
        ...view("runner").own,
        rig: [{ instanceId: "card_simple_killer", known: true, title: "Simple Killer", definitionId: "simple_killer", type: "program" }]
      }
    });
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView,
      events: [
        event("evt_own", "install_card", { actor: "runner", cardDefinitionId: "simple_killer", title: "Simple Killer" }),
        event("evt_opp", "trash_resource", { actor: "corp", cardDefinitionId: "simple_killer", title: "Simple Killer" })
      ]
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.eventId).toBe("evt_opp");
    expect(cues[0]?.highlight).toEqual({ kind: "zone", side: "runner", zone: "rig" });
  });

  it("skips old reconnect events by lastPresentedEventId and marks local attention", () => {
    const playerView = view("runner", { activeSide: "runner", legalActions: [legalAction("runner", "start_run")] });
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView,
      lastPresentedEventId: "evt_old",
      events: [
        event("evt_old", "gain_credit", { actor: "corp", amount: 1 }),
        event("evt_new", "end_turn", { actor: "corp" })
      ]
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.eventId).toBe("evt_new");
    expect(cues[0]?.requiresLocalAttention).toBe(true);
  });
});

function event(eventId: string, actionType: string, payload: Record<string, unknown>): PublicGameEvent {
  return {
    eventId,
    type: actionType,
    stateVersionBefore: 1,
    stateVersionAfter: 2,
    stateHashAfter: "fnv1a:test",
    publicPayload: {
      actionType,
      label: actionType,
      ...payload
    }
  };
}

function legalAction(side: Side, type: string): PlayerView["legalActions"][number] {
  return {
    actionId: `${side}.${type}`,
    side,
    type: type as PlayerView["legalActions"][number]["type"],
    label: type,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1
  };
}

function view(side: Side, overrides: Partial<PlayerView> = {}): PlayerView {
  return {
    side,
    stateVersion: 1,
    timingPoint: "runner_action.main",
    activeSide: "corp",
    phase: "corp_action_phase",
    own: {
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 5,
      heapOrArchives: [],
      scoreArea: [],
      rig: [],
      tags: 0
    },
    opponent: {
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 4,
      deckCount: 5,
      discardCount: 0,
      scoreArea: [],
      rig: []
    },
    servers: [],
    publicEvents: [],
    legalActions: [],
    winner: null,
    ...overrides
  };
}
