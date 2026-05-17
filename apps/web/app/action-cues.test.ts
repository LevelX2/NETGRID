import { describe, expect, it } from "vitest";
import type { PlayerView, PublicGameEvent, Side } from "@netgrid/shared";
import { actionSoundCountForAction, actionSoundForActionType, cueHasHiddenLeak, deriveOpponentActionCues, turnStartAudioCue } from "./action-cues";

describe("deriveOpponentActionCues", () => {
  it("maps opponent AI events to stable cues without exposing raw reason codes", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event("evt_1", "mandatory_draw", {
          actor: "corp",
          aiReasonCode: "corp.mandatory_draw",
          aiExplanation: "Die Korp braucht ihre Pflichtkarte."
        })
      ]
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.cueId).toBe("runner:evt_1");
    expect(cues[0]?.source).toBe("ai");
    expect(cues[0]?.title).toBe("Die Korp-KI hat ihre Pflichtkarte gezogen.");
    expect(cues[0]?.description).toBeUndefined();
    expect(cues[0]?.aiExplanation).toBe("Die Korp braucht ihre Pflichtkarte.");
    expect(JSON.stringify(cues[0])).not.toContain("corp.mandatory_draw");
  });

  it("redacts hidden Corp installs and keeps the highlight abstract", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event("evt_2", "install_card", {
          actor: "corp",
          label: "Korp installiert eine Karte.",
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
    expect(cues[0]?.title).toBe("Die Korp hat eine verdeckte Karte in Fort 1 installiert.");
    expect(cues[0]?.highlight).toEqual({ kind: "server", serverId: "remote_1", serverLabel: "Fort 1", lane: "root" });
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

  it("adds related cards only when the card is visible to the viewer", () => {
    const visibleIce = { instanceId: "ice_1", known: true, title: "Gate ICE", definitionId: "gate_ice", type: "ice" as const };
    const playerView = view("runner", {
      servers: [{ id: "remote_1", label: "Remote 1", ice: [visibleIce], root: [] }]
    });

    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView,
      events: [event("evt_rez", "rez_ice", { actor: "corp", cardDefinitionId: "gate_ice", title: "Gate ICE" })]
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.relatedCard).toEqual(visibleIce);
    expect(cueHasHiddenLeak(cues[0]!)).toBe(false);
  });

  it("does not create a duplicate cue for visible access reveals", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [event("evt_access", "access_card", { actor: "runner", cardDefinitionId: "agenda_1", title: "Public Agenda" })]
    });

    expect(cues).toHaveLength(0);
  });

  it("keeps automatic system cues behind the local option", () => {
    const systemEvent = event("evt_auto_credit", "gain_credit", { amount: 2 });

    expect(
      deriveOpponentActionCues({
        viewerSide: "runner",
        playerView: view("runner"),
        events: [systemEvent]
      })
    ).toHaveLength(0);

    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [systemEvent],
      includeAutomaticEffectCues: true
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.source).toBe("system");
    expect(cues[0]?.actorLabel).toBe("Spiel");
    expect(cues[0]?.opponent).toBe(false);
    expect(cueHasHiddenLeak(cues[0]!)).toBe(false);
  });

  it("skips old reconnect events and does not show a pure turn-handoff cue", () => {
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

    expect(cues).toHaveLength(0);
    expect(actionSoundForActionType("end_turn", "public")).toBeUndefined();
  });

  it("derives one side-specific turn-start cue only for live side changes", () => {
    const previous = {
      matchId: "match_1",
      stateVersion: 8,
      activeSide: "corp" as const,
      phase: "corp_action_phase" as const
    };

    expect(
      turnStartAudioCue({
        matchId: "match_1",
        stateVersion: 9,
        activeSide: "runner",
        phase: "runner_action_phase"
      }, previous)
    ).toEqual({ key: "match_1:9:runner", side: "runner", sound: "runner_turn" });

    expect(
      turnStartAudioCue({
        matchId: "match_1",
        stateVersion: 10,
        activeSide: "runner",
        phase: "runner_action_phase"
      }, { ...previous, activeSide: "runner", phase: "runner_action_phase" })
    ).toBeNull();

    expect(
      turnStartAudioCue({
        matchId: "match_2",
        stateVersion: 1,
        activeSide: "corp",
        phase: "corp_action_phase"
      }, previous)
    ).toBeNull();
  });

  it("does not cue non-action setup transitions as turn starts", () => {
    expect(
      turnStartAudioCue({
        matchId: "match_1",
        stateVersion: 3,
        activeSide: "runner",
        phase: "setup"
      }, {
        matchId: "match_1",
        stateVersion: 2,
        activeSide: "corp",
        phase: "setup"
      })
    ).toBeNull();
  });

  it("marks substantive opponent actions when local play can continue", () => {
    const playerView = view("runner", { activeSide: "runner", legalActions: [legalAction("runner", "start_run")] });
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView,
      events: [event("evt_credit", "gain_credit", { actor: "corp", amount: 1 })]
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.eventId).toBe("evt_credit");
    expect(cues[0]?.requiresLocalAttention).toBe(true);
  });

  it("keeps card draw audio generic and repeats only for visible draw amount", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [event("evt_draw", "draw_card", { actor: "runner", amount: 3 })]
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.sound).toBe("draw");
    expect(cues[0]?.soundCount).toBe(3);
    expect(actionSoundCountForAction("draw_card", { amount: 12 })).toBe(5);
    expect(actionSoundCountForAction("mandatory_draw", {})).toBe(1);
    expect(actionSoundCountForAction("gain_credit", { amount: 3 })).toBe(1);
  });

  it("covers non-card system sounds without leaking hidden details", () => {
    expect(actionSoundForActionType("resolve_choice", "public")).toBe("choice");
    expect(actionSoundForActionType("purge_virus_counters", "public")).toBe("trash");
    expect(actionSoundForActionType("game_end", "public")).toBe("game_end");
    expect(actionSoundForActionType("install_card", "redacted")).toBe("install_hidden");
  });

  it("numbers opponent paid actions from the public turn sequence, including extra actions", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event("evt_1", "gain_credit", { actor: "corp", actionCostClicks: 1, turnActionOrdinalStart: 1, turnActionOrdinalEnd: 1 }),
        event("evt_2", "play_operation", { actor: "corp", actionCostClicks: 1, turnActionOrdinalStart: 2, turnActionOrdinalEnd: 2 }),
        event("evt_3", "install_card", { actor: "corp", actionCostClicks: 1, turnActionOrdinalStart: 3, turnActionOrdinalEnd: 3, serverId: "remote_1", serverLabel: "Remote 1", zoneLabel: "Root" }),
        event("evt_4", "gain_credit", { actor: "corp", actionCostClicks: 1, turnActionOrdinalStart: 1, turnActionOrdinalEnd: 1 }),
        event("evt_5", "gain_credit", { actor: "corp", actionCostClicks: 1, turnActionOrdinalStart: 1, turnActionOrdinalEnd: 1 })
      ]
    });

    expect(cues.map((cue) => cue.actionUse?.label)).toEqual(["1", "2", "3", "4", "5"]);
    expect(cues[4]?.actionUse?.title).toBe("5. Aktion in diesem Zug");
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
      identity: { instanceId: `${side}_identity`, known: true, title: side === "corp" ? "Korp Identity" : "Runner Identity", definitionId: `${side}_identity`, type: "identity" },
      gripOrHq: [],
      stackOrRdCount: 5,
      heapOrArchives: [],
      scoreArea: [],
      rig: [],
      maxHandSize: 5,
      tags: 0
    },
    opponent: {
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 4,
      maxHandSize: 5,
      deckCount: 5,
      discardCount: 0,
      identity: {
        instanceId: `${side === "corp" ? "runner" : "corp"}_identity`,
        known: true,
        title: side === "corp" ? "Runner Identity" : "Korp Identity",
        definitionId: `${side === "corp" ? "runner" : "corp"}_identity`,
        type: "identity"
      },
      scoreArea: [],
      rig: []
    },
    servers: [],
    publicEvents: [],
    legalActions: [],
    winner: null,
    agendaPointsToWin: 7,
    ...overrides
  };
}
