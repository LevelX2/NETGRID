import { describe, expect, it } from "vitest";
import type { PlayerView, PublicGameEvent, Side } from "@netgrid/shared";
import { actionSoundCountForAction, actionSoundForActionType, cueHasHiddenLeak, deriveDamageImpactCues, deriveOpponentActionCues, eventsAfter, turnStartAudioCue } from "./action-cues";

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
    expect(cues[0]?.title).toBe("Die Korp hat eine verdeckte Karte in Remote 1 installiert.");
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

  it("keeps Rio de Janeiro City Grid roll cues visible for both players", () => {
    const rioEvent = event("evt_rio", "continue_run", {
      actor: "runner",
      v1921UpgradeAbility: "rio_de_janeiro_passed_ice",
      sourceDefinitionId: "onr_v1_367_rio-de-janeiro-city-grid",
      passedIceDefinitionId: "simple_barrier_ice",
      serverLabel: "Remote 1",
      v1921DieRoll: 1,
      rioRunEnded: true
    });

    const runnerCues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [rioEvent]
    });
    const corpCues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [rioEvent]
    });

    expect(runnerCues).toHaveLength(1);
    expect(corpCues).toHaveLength(1);
    expect(runnerCues[0]?.source).toBe("system");
    expect(runnerCues[0]?.actorLabel).toBe("Spiel");
    expect(runnerCues[0]?.title).toBe("Du hast Simple Barrier ICE passiert und Rio de Janeiro City Grid würfelt eine 1.");
    expect(corpCues[0]?.title).toBe("Der Runner hat Simple Barrier ICE passiert und Rio de Janeiro City Grid würfelt eine 1.");
    expect(runnerCues[0]?.cardDefinitionId).toBe("simple_barrier_ice");
    expect(runnerCues[0]?.cardTitle).toBe("Simple Barrier ICE");
    expect(runnerCues[0]?.description).toBe("Der Run endet durch Rio de Janeiro City Grid.");
    expect(runnerCues[0]?.highlight).toEqual({ kind: "run", serverLabel: "Remote 1" });
    expect(runnerCues[0]?.sound).toBe("run");
    expect(cueHasHiddenLeak(runnerCues[0]!)).toBe(false);
    expect(cueHasHiddenLeak(corpCues[0]!)).toBe(false);
  });

  it("keeps Vacuum Link die roll cues visible for both players", () => {
    const vacuumEvent = event("evt_vacuum", "continue_run", {
      actor: "runner",
      serverLabel: "HQ",
      vacuumLinkDieRoll: 3,
      vacuumLinkRewindApplied: true,
      vacuumLinkRewindRezzedIceBack: 3,
      vacuumLinkTargetIceIndex: 1
    });

    const runnerCues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [vacuumEvent]
    });
    const corpCues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [vacuumEvent]
    });

    expect(runnerCues).toHaveLength(1);
    expect(corpCues).toHaveLength(1);
    expect(runnerCues[0]?.source).toBe("system");
    expect(runnerCues[0]?.actorLabel).toBe("Spiel");
    expect(runnerCues[0]?.title).toBe("Du hast Vacuum Link ausgelöst und eine 3 gewürfelt: 3 gerezzte ICE zurück, sonst zum ersten ICE; Runner darf ausstöpseln.");
    expect(runnerCues[0]?.description).toBe(
      "Wurf 3: Runner wird um 3 gerezzte ICE zurückgesetzt oder darf ausstöpseln; wenn nicht so viele ICE vorhanden sind, geht es zum ersten ICE. Ziel ist ICE 2."
    );
    expect(runnerCues[0]?.cardDefinitionId).toBe("onr_v1_275_vacuum-link");
    expect(runnerCues[0]?.cardTitle).toBe("Vacuum Link");
    expect(runnerCues[0]?.highlight).toEqual({ kind: "run", serverLabel: "HQ" });
    expect(runnerCues[0]?.sound).toBe("run");
    expect(corpCues[0]?.title).toBe("Der Runner hat Vacuum Link ausgelöst und eine 3 gewürfelt: 3 gerezzte ICE zurück, sonst zum ersten ICE; Runner darf ausstöpseln.");
    expect(cueHasHiddenLeak(runnerCues[0]!)).toBe(false);
    expect(cueHasHiddenLeak(corpCues[0]!)).toBe(false);
  });

  it("shows access-effect damage cues for both players", () => {
    const accessDamageEvent = event("evt_access_damage", "resolve_choice", {
      actor: "corp",
      resolvedEffects: [
        {
          effectId: "bel_digmo.access.damage",
          kind: "damage",
          visibility: "hidden_info_barrier",
          side: "runner",
          amount: 1,
          damageType: "net",
          cardsTrashed: 1,
          reason: "access_effect",
          sourceDefinitionId: "onr_proteus_071_bel-digmo-antibody",
          sourceTitle: "Bel-Digmo Antibody"
        }
      ]
    });

    const runnerCues = deriveOpponentActionCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [accessDamageEvent]
    });
    const corpCues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [accessDamageEvent]
    });

    expect(runnerCues.some((cue) => cue.title === "Du hast 1 Net Damage durch Bel-Digmo Antibody erlitten.")).toBe(true);
    expect(corpCues.some((cue) => cue.title === "Der Runner hat 1 Net Damage durch Bel-Digmo Antibody erlitten.")).toBe(true);
    expect(runnerCues.at(-1)?.source).toBe("system");
    expect(runnerCues.at(-1)?.sound).toBe("tag_or_damage");
  });

  it("derives damage impact cues from public counts without leaking hidden source ids", () => {
    const cues = deriveDamageImpactCues({
      viewerSide: "runner",
      playerView: view("runner"),
      events: [
        event("evt_damage", "resolve_choice", {
          damageResolved: true,
          damageType: "net",
          damageAmount: 2,
          cardsTrashed: 2,
          runnerGripBefore: 4,
          runnerGripAfter: 2,
          flatline: false,
          sourceDefinitionId: "hidden_asset_1",
          sourceTitle: "Hidden Trap"
        })
      ]
    });

    expect(cues).toEqual([
      {
        cueId: "runner:evt_damage:damage-impact",
        eventId: "evt_damage",
        viewerSide: "runner",
        damageType: "net",
        amount: 2,
        cardsTrashed: 2,
        runnerGripBefore: 4,
        runnerGripAfter: 2,
        flatline: false,
        runnerMaxHandSizeAfter: 5,
        sourceLabel: "Korp-Effekt"
      }
    ]);
    expect(JSON.stringify(cues)).not.toContain("hidden_asset_1");
    expect(JSON.stringify(cues)).not.toContain("Hidden Trap");
  });

  it("marks flatline damage impact from side-safe public counts", () => {
    const cues = deriveDamageImpactCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [
        event("evt_flatline", "play_operation", {
          actor: "corp",
          damageResolved: true,
          damageType: "meat",
          damageAmount: 4,
          cardsTrashed: 0,
          runnerGripBefore: 3,
          runnerGripAfter: 0,
          flatline: true
        })
      ]
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]).toMatchObject({
      damageType: "meat",
      amount: 4,
      runnerGripBefore: 3,
      runnerGripAfter: 0,
      flatline: true,
      runnerMaxHandSizeAfter: 5,
      sourceLabel: "Korp-Effekt"
    });
  });

  it("falls back to public PlayerView max hand size for damage impact grip labels", () => {
    const cues = deriveDamageImpactCues({
      viewerSide: "corp",
      playerView: view("corp", {
        opponent: {
          ...view("corp").opponent,
          maxHandSize: 5
        }
      }),
      events: [
        event("evt_flatline", "play_operation", {
          damageResolved: true,
          damageType: "meat",
          damageAmount: 4,
          cardsTrashed: 0,
          runnerGripBefore: 2,
          runnerGripAfter: 0,
          flatline: true
        })
      ]
    });

    expect(cues[0]).toMatchObject({
      runnerGripBefore: 2,
      runnerGripAfter: 0,
      runnerMaxHandSizeAfter: 5
    });
  });

  it("keeps reconnect damage impact cues behind the last presented event id", () => {
    const cues = deriveDamageImpactCues({
      viewerSide: "runner",
      playerView: view("runner"),
      lastPresentedEventId: "evt_old",
      events: [
        event("evt_old", "resolve_choice", { damageResolved: true, damageType: "net", damageAmount: 1, flatline: false }),
        event("evt_new", "resolve_choice", { damageResolved: true, damageType: "core", damageAmount: 1, runnerGripBefore: 5, runnerGripAfter: 4, coreDamageAfter: 1, runnerMaxHandSizeAfter: 4, flatline: false })
      ]
    });

    expect(cues.map((cue) => cue.eventId)).toEqual(["evt_new"]);
    expect(cues[0]).toMatchObject({ damageType: "core", coreDamageAfter: 1, runnerMaxHandSizeAfter: 4 });
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

  it("shows The Short Circuit program reveal in opponent action cues", () => {
    const cues = deriveOpponentActionCues({
      viewerSide: "corp",
      playerView: view("corp"),
      events: [
        event("evt_short_circuit", "resolve_choice", {
          actor: "runner",
          hiddenZoneAction: "v1911_short_circuit_search",
          sourceDefinitionId: "onr_v1_177_the-short-circuit",
          publicRevealDefinitionId: "simple_decoder",
          cardDefinitionId: "simple_decoder",
          searchDestination: "runner_grip",
          shuffled: true
        })
      ]
    });

    expect(cues).toHaveLength(1);
    expect(cues[0]?.title).toBe("Der Runner hat The Short Circuit genutzt, Simple Decoder der Korp gezeigt und in die Hand genommen.");
    expect(cues[0]?.description).toBe("Der Stack wurde danach gemischt.");
    expect(cueHasHiddenLeak(cues[0]!)).toBe(false);
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
        stateVersion: 9,
        activeSide: "corp",
        phase: "corp_draw_phase"
      }, { ...previous, phase: "setup" })
    ).toEqual({ key: "match_1:9:corp", side: "corp", sound: "corp_turn" });

    expect(
      turnStartAudioCue({
        matchId: "match_1",
        stateVersion: 10,
        activeSide: "corp",
        phase: "corp_action_phase"
      }, {
        matchId: "match_1",
        stateVersion: 9,
        activeSide: "corp",
        phase: "corp_draw_phase"
      })
    ).toBeNull();

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

  it("does not replay an older event tail when undo removes the last presented event", () => {
    const events = [
      event("evt_37", "start_run", { actor: "runner", aiExplanation: "Alter Runner-Run." }),
      event("evt_38", "access_card", { actor: "runner", aiExplanation: "Alter Zugriff." }),
      event("evt_41", "install_card", { actor: "corp", label: "Korp installiert eine Karte." })
    ];

    expect(eventsAfter(events, "evt_42")).toEqual([]);
    expect(
      deriveOpponentActionCues({
        viewerSide: "corp",
        playerView: view("corp"),
        events,
        lastPresentedEventId: "evt_42"
      })
    ).toEqual([]);
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
