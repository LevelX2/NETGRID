import { describe, expect, it } from "vitest";
import type { LegalAction, PlayerView, Side, VisibleCard } from "@netgrid/shared";
import {
  DEFAULT_CUE_POSITION,
  actionButtonLabel,
  actionCostChips,
  actionMatchesContext,
  actionSlotDisplay,
  aiPacingDelayMs,
  breachProgressLabel,
  clampCuePosition,
  contextualCardActionLabel,
  corpInstalledCardState,
  showInstalledCorpState,
  splitArchiveCardsForDisplay,
  currentRunTimelineStep,
  groupRunnerRigCards,
  parseCuePositionPreference,
  runTargetServerIds,
  serverBoardRows,
  serverDisplayLabel,
  splitLegalActions
} from "./action-board-ui";

describe("V1.0.5 action board UI helpers", () => {
  it("keeps global and decision actions in the main panel while card actions move to context", () => {
    const iceA = card("corp_ice_a", "Wall A", "ice");
    const iceB = card("corp_ice_b", "Wall B", "ice");
    const actions = [
      legalAction("corp", "gain_credit", "basic_action", "Credit nehmen"),
      legalAction("corp", "start_run", "basic_action", "Run auf R&D", { serverId: "rd" }),
      legalAction("corp", "install_card", iceA.instanceId, "ICE vor HQ installieren", { cardId: iceA.instanceId, serverId: "hq", placement: "ice" }),
      legalAction("corp", "install_card", iceB.instanceId, "ICE vor HQ installieren", { cardId: iceB.instanceId, serverId: "hq", placement: "ice" }),
      legalAction("corp", "rez_ice", "corp_ice_installed", "Wall rezzen", { cardId: "corp_ice_installed" }, "run.approach_ice")
    ];

    const split = splitLegalActions(actions);

    expect(split.primaryActions.map((action) => action.type)).toEqual(["gain_credit", "rez_ice"]);
    expect(split.contextualActions.map((action) => action.source)).toEqual(["basic_action", iceA.instanceId, iceB.instanceId]);
    expect(split.contextualActions.filter((action) => actionMatchesContext(action, { kind: "card", id: iceA.instanceId, label: iceA.title! }))).toHaveLength(1);
    expect(split.contextualActions.filter((action) => actionMatchesContext(action, { kind: "server", id: "rd", label: "F&E (R&D)" }))).toHaveLength(1);
    expect(actionButtonLabel(actions[1]!)).toBe("Run auf F&E (R&D)");
  });

  it("maps RunTimeline state, active target and server labels without raw V1.0.5 labels", () => {
    const running = view("runner", {
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] }
      ],
      run: { attackedServerId: "rd", phase: "movement", successful: false }
    });

    expect(currentRunTimelineStep(running, [legalAction("runner", "jack_out", "basic_action", "Jack out", undefined, "run.jack_out_window")])).toBe("movement");
    expect(runTargetServerIds(running)).toEqual(["rd"]);
    expect(serverDisplayLabel("rd")).toBe("F&E (R&D)");
    expect(serverDisplayLabel("archives")).toBe("Archive");
    expect(serverDisplayLabel("remote_2")).toBe("Außenserver 2");
    expect(serverDisplayLabel("Remote 3")).toBe("Außenserver 3");
    expect(actionButtonLabel(legalAction("corp", "advance_card", "basic_action", "Agenda in Remote 2 advancen"))).toBe("Installation ausbauen");
    expect(actionButtonLabel(legalAction("runner", "continue_run", "game_rule", "Subroutinen auslösen (Run endet)", undefined, "run.encounter_ice"))).toBe(
      "Subroutinen auslösen (Run endet)"
    );
  });

  it("shows access progress only from PlayerView breach data", () => {
    const running = view("runner", {
      run: {
        attackedServerId: "hq",
        phase: "access",
        successful: true,
        breach: { breachId: "breach_1", serverId: "hq", currentIndex: 1, remainingCount: 1, completed: false }
      }
    });

    expect(currentRunTimelineStep(running, [])).toBe("access");
    expect(breachProgressLabel(running)).toBe("Zugriff 2 von 3");
  });

  it("groups public Runner rig cards without implying hidden cards", () => {
    const groups = groupRunnerRigCards([card("program_1", "Program", "program"), card("hardware_1", "Hardware", "hardware"), card("resource_1", "Resource", "resource")]);

    expect(groups.map((group) => group.label)).toEqual(["Programme", "Hardware", "Ressourcen"]);
    expect(groups.flatMap((group) => group.cards.map((entry) => entry.instanceId))).toEqual(["program_1", "hardware_1", "resource_1"]);
  });

  it("keeps Corp installed rez state side-safe", () => {
    expect(corpInstalledCardState({ instanceId: "hidden_ice", known: false, rezzed: false })).toBe("hidden");
    expect(corpInstalledCardState(card("corp_ice", "Wall", "ice", false))).toBe("unrezzed");
    expect(corpInstalledCardState(card("rezzed_ice", "Wall", "ice", true))).toBe("rezzed");
  });

  it("shows installed state only for installed corp lanes, not Archives root cards", () => {
    expect(showInstalledCorpState("archives", "root")).toBe(false);
    expect(showInstalledCorpState("archives", "ice")).toBe(true);
    expect(showInstalledCorpState("hq", "root")).toBe(true);
    expect(showInstalledCorpState("remote_1", "root")).toBe(true);
  });

  it("splits archives into faceup and facedown stacks for runner and corp views", () => {
    const faceupA = card("archive_a", "Faceup A", "asset", true);
    const faceupB = card("archive_b", "Faceup B", "operation", true);
    const facedown = card("archive_c", "Facedown C", "agenda", false);

    const runnerSplit = splitArchiveCardsForDisplay("runner", [faceupA, faceupB], 3);
    expect(runnerSplit.faceupCards.map((entry) => entry.instanceId)).toEqual(["archive_a", "archive_b"]);
    expect(runnerSplit.facedownCount).toBe(1);

    const corpSplit = splitArchiveCardsForDisplay("corp", [faceupA, facedown, faceupB], 3);
    expect(corpSplit.faceupCards.map((entry) => entry.instanceId)).toEqual(["archive_a", "archive_b"]);
    expect(corpSplit.facedownCount).toBe(1);
  });
  it("keeps cue position local, resettable and clamped", () => {
    expect(parseCuePositionPreference(null)).toEqual(DEFAULT_CUE_POSITION);
    expect(parseCuePositionPreference(JSON.stringify({ kind: "preset", preset: "center" }))).toEqual({ kind: "preset", preset: "center" });
    expect(parseCuePositionPreference("{bad json")).toEqual(DEFAULT_CUE_POSITION);
    expect(clampCuePosition(98, 98, 400, 300, 180, 120)).toEqual({ kind: "custom", xPercent: 52, yPercent: 56 });
  });

  it("orders server rows by viewer side perspective", () => {
    const servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      { id: "archives", label: "Archives", ice: [], root: [] },
      { id: "remote_2", label: "Remote 2", ice: [], root: [] },
      { id: "remote_1", label: "Remote 1", ice: [], root: [] }
    ];

    expect(serverBoardRows(servers, "runner").map((row) => [row.kind, row.servers.map((server) => server.id)])).toEqual([
      ["centrals", ["hq", "rd", "archives"]],
      ["remotes", ["remote_1", "remote_2"]]
    ]);

    expect(serverBoardRows(servers, "corp").map((row) => [row.kind, row.servers.map((server) => server.id)])).toEqual([
      ["remotes", ["remote_1", "remote_2"]],
      ["centrals", ["hq", "rd", "archives"]]
    ]);
  });

  it("keeps paced AI moving even when an action cue remains visible", () => {
    expect(aiPacingDelayMs("manual", true, 0)).toBeNull();
    expect(aiPacingDelayMs("paced", false, 2500)).toBe(650);
    expect(aiPacingDelayMs("paced", true, 0)).toBe(900);
    expect(aiPacingDelayMs("fast", true, 6000)).toBe(6000);
  });
});

describe("V1.0.6 resource and card-display helpers", () => {
  it("renders action slot states for normal Runner, Corp and spent-action cases", () => {
    const runnerStart = actionSlotDisplay("runner", 4, 4, true);
    expect(runnerStart.label).toBe("4 Aktionen");
    expect(runnerStart.slots).toHaveLength(4);
    expect(runnerStart.slots.every((slot) => slot.state === "available")).toBe(true);

    const runnerAfterAction = actionSlotDisplay("runner", 3, 4, true);
    expect(runnerAfterAction.spent).toBe(1);
    expect(runnerAfterAction.slots.map((slot) => slot.state)).toEqual(["spent", "available", "available", "available"]);

    const corpStart = actionSlotDisplay("corp", 3, 3, true);
    expect(corpStart.slots).toHaveLength(3);
    expect(corpStart.spent).toBe(0);
  });

  it("keeps off-turn and bonus-action displays conservative and local", () => {
    const offTurn = actionSlotDisplay("runner", 0, 4, false);
    expect(offTurn.label).toBe("0 Aktionen");
    expect(offTurn.slots).toEqual([]);

    const bonus = actionSlotDisplay("runner", 5, 4, true);
    expect(bonus.capacity).toBe(5);
    expect(bonus.slots.filter((slot) => slot.bonus)).toHaveLength(1);
    expect(bonus.slots.every((slot) => slot.state === "available")).toBe(true);
  });

  it("formats action and credit costs as user-facing chips", () => {
    expect(actionCostChips({ costs: [{ clicks: 1, credits: 2 }] })).toEqual([
      { kind: "action", amount: 1, label: "1 Aktion" },
      { kind: "credit", amount: 2, label: "2 Credits" }
    ]);
    expect(actionCostChips({ costs: [{ clicks: 3 }, { credits: 1 }] })).toEqual([
      { kind: "action", amount: 3, label: "3 Aktionen" },
      { kind: "credit", amount: 1, label: "1 Credit" }
    ]);
    expect(JSON.stringify(actionCostChips({ costs: [{ clicks: 1, credits: 2 }] }))).not.toContain("{ clicks");
  });

  it("keeps contextual card action labels distinct for server-targeted events", () => {
    expect(contextualCardActionLabel(legalAction("runner", "play_event", "card_1", "Simple Run Event auf R&D", { cardId: "card_1", serverId: "rd" }))).toBe("Run auf F&E (R&D)");
    expect(contextualCardActionLabel(legalAction("runner", "play_event", "card_1", "Simple Run Event auf Archives", { cardId: "card_1", serverId: "archives" }))).toBe("Run auf Archive");
    expect(contextualCardActionLabel(legalAction("runner", "play_event", "card_1", "Simple Draw Event spielen", { cardId: "card_1" }))).toBe("Spielen");
    expect(contextualCardActionLabel(legalAction("runner", "play_event", "card_1", "Expose Event auf Remote 2", { cardId: "card_1", serverId: "remote_2" }))).toBe("Spielen auf Außenserver 2");
  });

  it("names Corp install destinations in card context actions", () => {
    expect(contextualCardActionLabel(legalAction("corp", "install_card", "ice_1", "ICE vor HQ installieren", { cardId: "ice_1", serverId: "hq", placement: "ice" }))).toBe("Vor HQ");
    expect(contextualCardActionLabel(legalAction("corp", "install_card", "ice_1", "ICE vor R&D installieren", { cardId: "ice_1", serverId: "rd", placement: "ice" }))).toBe("Vor F&E (R&D)");
    expect(contextualCardActionLabel(legalAction("corp", "install_card", "ice_1", "ICE vor Archives installieren", { cardId: "ice_1", serverId: "archives", placement: "ice" }))).toBe("Vor Archive");
    expect(contextualCardActionLabel(legalAction("corp", "install_card", "ice_1", "ICE vor neuem Remote installieren", { cardId: "ice_1", serverId: "new_remote", placement: "ice" }))).toBe("Vor neuem Außenserver");
    expect(contextualCardActionLabel(legalAction("corp", "install_card", "agenda_1", "Karte in neuem Remote installieren", { cardId: "agenda_1", serverId: "new_remote", placement: "root" }))).toBe("In neuem Außenserver");
    expect(contextualCardActionLabel(legalAction("runner", "install_card", "program_1", "Programm installieren", { cardId: "program_1" }))).toBe("Installieren");
  });

  it("moves rig icebreaker actions to their card context", () => {
    const pump = legalAction("runner", "pump_breaker", "breaker_1", "Simple Decoder pumpen", { breakerId: "breaker_1", iceId: "ice_1" }, "run.encounter_ice");
    const continueRun = legalAction("runner", "continue_run", "game_rule", "Run fortsetzen", undefined, "run.approach_ice");

    const split = splitLegalActions([pump, continueRun]);

    expect(split.primaryActions.map((action) => action.type)).toEqual(["continue_run"]);
    expect(split.contextualActions).toEqual([pump]);
    expect(actionMatchesContext(pump, { kind: "card", id: "breaker_1", label: "Simple Decoder" })).toBe(true);
  });
});

function legalAction(side: Side, type: LegalAction["type"], source: LegalAction["source"], label: string, payload?: LegalAction["payload"], timingPoint: LegalAction["timingPoint"] = "corp_action.main"): LegalAction {
  return {
    actionId: `${side}.${type}.${source}.${payload?.serverId ?? ""}.${payload?.cardId ?? ""}`,
    side,
    type,
    label,
    source,
    timingPoint,
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...(payload ? { payload } : {})
  };
}

function card(instanceId: string, title: string, type: NonNullable<VisibleCard["type"]>, rezzed = true): VisibleCard {
  return {
    instanceId,
    known: true,
    title,
    definitionId: instanceId,
    type,
    rezzed
  };
}

function view(side: Side, overrides: Partial<PlayerView> = {}): PlayerView {
  return {
    side,
    stateVersion: 1,
    timingPoint: "runner_action.main",
    activeSide: side,
    phase: "runner_action_phase",
    own: {
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      identity: card(`${side}_identity`, side === "corp" ? "Korp Identity" : "Runner Identity", "identity"),
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
      identity: card(`${side === "corp" ? "runner" : "corp"}_identity`, side === "corp" ? "Runner Identity" : "Korp Identity", "identity"),
      scoreArea: [],
      rig: []
    },
    servers: [{ id: "hq", label: "HQ", ice: [], root: [] }],
    publicEvents: [],
    legalActions: [],
    winner: null,
    agendaPointsToWin: 7,
    ...overrides
  };
}
