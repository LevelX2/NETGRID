import { describe, expect, it } from "vitest";
import type { LegalAction, PlayerView, PublicGameEvent, Side, VisibleCard } from "@netgrid/shared";
import {
  DEFAULT_CUE_POSITION,
  accessRevealStatusLabel,
  actionButtonLabel,
  actionConsumesClick,
  actionCostChips,
  actionMatchesContext,
  actionSlotCapacityForTurn,
  actionSlotDisplay,
  activeRunIceInstanceId,
  advancementCounterDisplay,
  aiPacingFallbackDelayMs,
  aiPacingDelayMs,
  armoredFridgeAblativeCounterBadge,
  automaticCorpMandatoryDrawAction,
  automaticEndTurnAction,
  breachProgressLabel,
  cardCreditCounterVisual,
  counterDisplayBadgeView,
  counterDisplaysForRendering,
  clampCuePosition,
  contextualCardActionLabel,
  corpInstalledCardState,
  fieldCardChoiceInfo,
  fieldCardChoiceOptionForCard,
  showInstalledCorpState,
  shouldUseFieldCardChoice,
  shouldUseCardChoicePanel,
  splitArchiveCardsForDisplay,
  currentRunTimelineStep,
  groupRunnerRigCards,
  iceModifierBadgesForServer,
  orderedCardContextActions,
  parseCuePositionPreference,
  retainedAccessRevealEvent,
  runBreakerActionHint,
  runAwareActionButtonLabel,
  runCurrentIceLabel,
  runnerProgramInstallTrashChoiceInfo,
  runPositionStatusLabel,
  runTargetServerIds,
  runWindowActionButtonLabel,
  runWindowActions,
  runWindowStatusLabel,
  runnerRigMemorySummary,
  serverBoardRows,
  serverDisplayLabel,
  splitLegalActions,
  storedCreditAmount,
  storedCreditSourceLabel
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
    expect(split.contextualActions.filter((action) => actionMatchesContext(action, { kind: "server", id: "rd", label: "R&D" }))).toHaveLength(1);
    expect(actionButtonLabel(actions[1]!)).toBe("Run auf R&D");
  });

  it("keeps Olivia Salazar reduced rez source and paid cost visible in the button label", () => {
    const action = legalAction(
      "corp",
      "rez_ice",
      "ice_1",
      "Olivia Salazar: Crystal Wall für 2 Credits rezzen",
      {
        cardId: "ice_1",
        oliviaSalazarRezSourceCardId: "olivia_1",
        oliviaSalazarRezSourceDefinitionId: "onr_v1_363_olivia-salazar",
        oliviaSalazarRezCostBase: 4,
        oliviaSalazarTemporaryDerez: true,
        rezCostPaid: 2
      },
      "run.approach_ice"
    );

    expect(actionButtonLabel(action)).toBe("Olivia Salazar: Crystal Wall für 2 Credits rezzen");
  });

  it("only offers automatic end turn when end turn is the sole remaining own action", () => {
    const board = view("corp", { activeSide: "corp", own: { ...view("corp").own, clicks: 0 } });
    const endTurn = legalAction("corp", "end_turn", "game_rule", "Zug beenden");
    const scoreAgenda = legalAction("corp", "score_agenda", "agenda_1", "Agenda scoren", { cardId: "agenda_1" });

    expect(automaticEndTurnAction(board, [endTurn], "corp")).toBe(endTurn);
    expect(automaticEndTurnAction(board, [endTurn], "corp", { accessRevealVisible: true })).toBeUndefined();
    expect(automaticEndTurnAction(board, [endTurn, scoreAgenda], "corp")).toBeUndefined();
    expect(
      automaticEndTurnAction(
        {
          ...board,
          pendingChoice: {
            choiceId: "choice_1",
            side: "corp",
            source: "test",
            prompt: "Wählen",
            kind: "confirm",
            minSelections: 1,
            maxSelections: 1,
            stateVersion: 1,
            visibility: "public",
            options: []
          }
        },
        [endTurn],
        "corp"
      )
    ).toBeUndefined();
    expect(automaticEndTurnAction({ ...board, activeSide: "runner" }, [endTurn], "corp")).toBeUndefined();
  });

  it("only offers automatic Corp mandatory draw when no other Corp action is available", () => {
    const board = view("corp", { activeSide: "corp" });
    const mandatoryDraw = legalAction("corp", "mandatory_draw", "game_rule", "Korp Pflichtkarte ziehen", {}, "corp_draw.mandatory_draw");
    const scoreAgenda = legalAction("corp", "score_agenda", "agenda_1", "Agenda scoren", { cardId: "agenda_1" }, "corp_draw.mandatory_draw");
    const rezIce = legalAction("corp", "rez_ice", "ice_1", "ICE rezzen", { cardId: "ice_1" }, "corp_draw.mandatory_draw");

    expect(automaticCorpMandatoryDrawAction(board, [mandatoryDraw], "corp")).toBe(mandatoryDraw);
    expect(automaticCorpMandatoryDrawAction(board, [mandatoryDraw, scoreAgenda], "corp")).toBeUndefined();
    expect(automaticCorpMandatoryDrawAction(board, [mandatoryDraw, rezIce], "corp")).toBeUndefined();
    expect(automaticCorpMandatoryDrawAction(board, [mandatoryDraw], "runner")).toBeUndefined();
    expect(automaticCorpMandatoryDrawAction({ ...board, pendingChoice: choice("corp") }, [mandatoryDraw], "corp")).toBeUndefined();
  });

  it("maps RunTimeline state, active target and server labels without raw V1.0.5 labels", () => {
    const ice1 = card("ice_1", "Inner ICE", "ice");
    const ice2 = card("ice_2", "Middle ICE", "ice");
    const ice3 = card("ice_3", "Outer ICE", "ice");
    const running = view("runner", {
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [ice1, ice2, ice3], root: [] }
      ],
      run: { attackedServerId: "rd", phase: "movement", position: { kind: "ice", serverId: "rd", iceIndex: 2 }, successful: false }
    });

    expect(currentRunTimelineStep(running, [legalAction("runner", "jack_out", "basic_action", "Jack out", undefined, "run.jack_out_window")])).toBe("movement");
    expect(runTargetServerIds(running)).toEqual(["rd"]);
    expect(activeRunIceInstanceId(running)).toBe("ice_3");
    expect(runCurrentIceLabel(running)).toBe("ICE 3");
    expect(runPositionStatusLabel(running)).toBe("Aktuell: vor ICE 3 (1 von 3)");
    expect(runWindowStatusLabel(running)).toBe("ICE 3 (1 von 3)");
    expect(runAwareActionButtonLabel(running, legalAction("runner", "jack_out", "game_rule", "Jack-out", undefined, "run.jack_out_window"))).toBe("Run abbrechen an ICE 3");
    expect(runAwareActionButtonLabel(running, legalAction("runner", "continue_run", "game_rule", "Run fortsetzen", undefined, "run.jack_out_window"))).toBe("Run fortsetzen zu ICE 3");
    expect(serverDisplayLabel("rd")).toBe("R&D");
    expect(serverDisplayLabel("archives")).toBe("Archive");
    expect(serverDisplayLabel("remote_2")).toBe("Remote 2");
    expect(serverDisplayLabel("Remote 3")).toBe("Remote 3");
    expect(actionButtonLabel(legalAction("corp", "advance_card", "basic_action", "Agenda in Remote 2 advancen"))).toBe("Installation ausbauen");
    expect(actionButtonLabel(legalAction("runner", "continue_run", "game_rule", "Subroutinen auslösen (Run endet)", undefined, "run.encounter_ice"))).toBe(
      "Subroutinen auslösen (Run endet)"
    );
  });

  it("marks ICE in a server with rezzed Tesseract Fort Construction", () => {
    const tesseract = {
      ...card("tesseract_1", "Tesseract Fort Construction", "upgrade", true),
      definitionId: "onr_v1_370_tesseract-fort-construction"
    };
    const server = {
      id: "remote_1" as const,
      label: "Remote 1",
      ice: [card("ice_1", "Wall of Static", "ice")],
      root: [tesseract]
    };

    expect(iceModifierBadgesForServer(server)).toEqual([
      {
        key: "tesseract-additional-subroutine",
        shortLabel: "+Sub",
        ariaLabel: "Tesseract Fort Construction: zusätzliche Subroutine auf diesem ICE",
        tooltip: "Tesseract Fort Construction: zusätzliche Subroutine",
        testId: "tesseract-ice-subroutine-badge"
      }
    ]);
    expect(iceModifierBadgesForServer({ ...server, root: [{ ...tesseract, rezzed: false }] })).toEqual([]);
    expect(iceModifierBadgesForServer({ ...server, root: [{ ...tesseract, known: false }] })).toEqual([]);
  });

  it("keeps card-sourced gain-credit actions on their specific labels", () => {
    const basic = legalAction("corp", "gain_credit", "basic_action", "1 Credit nehmen");
    const privatePolice = legalAction("corp", "gain_credit", "private_police_1", "Private Cybernet Police: Trace 5 starten", {
      cardId: "private_police_1",
      agendaAbility: "private_cybernet_police",
      traceStrength: 5
    });
    const seeya = legalAction("runner", "gain_credit", "seeya_1", "SeeYa: Karte in HQ expose", {
      cardId: "seeya_1",
      serverId: "hq",
      v1911HiddenZoneAbility: "expose_server_card"
    });

    const split = splitLegalActions([basic, privatePolice, seeya]);

    expect(split.primaryActions).toEqual([basic]);
    expect(split.contextualActions).toEqual([privatePolice, seeya]);
    expect(actionButtonLabel(basic)).toBe("Credit nehmen");
    expect(actionButtonLabel(privatePolice)).toBe("Private Cybernet Police: Trace 5 starten");
    expect(actionMatchesContext(seeya, { kind: "card", id: "seeya_1", label: "SeeYa" })).toBe(true);
    expect(contextualCardActionLabel(seeya)).toBe("Karte in HQ expose");
  });

  it("removes redundant installed asset names from card-context action labels", () => {
    const bbs = legalAction("corp", "gain_credit", "bbs_1", "BBS Whispering Campaign: 2 Credits", {
      cardId: "bbs_1",
      v1917AssetAbility: "gain_credits",
      gainCreditsAmount: 2
    });
    const bloodCat = legalAction("corp", "gain_credit", "blood_cat_1", "Blood Cat: Trace 5 starten", {
      cardId: "blood_cat_1",
      v1917AssetAbility: "trace_3_tag",
      traceStrength: 5
    });
    const southAfrican = legalAction("corp", "gain_credit", "south_african_1", "South African Mining Corp: 6 Credits und trashen", {
      cardId: "south_african_1",
      v1920AssetAbility: "south_african_mining_corp_gain_6_trash",
      gainCreditsAmount: 6
    });
    const trashNode = legalAction("runner", "trash_accessed_card", "node_1", "South African Mining Corp trashen", {
      accessedCardId: "node_1",
    });

    expect(actionButtonLabel(bbs)).toBe("BBS Whispering Campaign: 2 Credits");
    expect(contextualCardActionLabel(bbs)).toBe("2 Credits");
    expect(contextualCardActionLabel(bloodCat)).toBe("Trace 5 starten");
    expect(actionButtonLabel(southAfrican)).toBe("South African Mining Corp: 6 Credits und trashen");
    expect(contextualCardActionLabel(southAfrican)).toBe("6 Credits nehmen");
    expect(contextualCardActionLabel(trashNode)).toBe("Trashen");
  });

  it("uses compact labels for scored agenda credit actions in card context", () => {
    const corporateCoup = legalAction("corp", "gain_credit", "coup_1", "Corporate Coup: 3 Credits aus Coup-Counter", {
      cardId: "coup_1",
      agendaAbility: "corporate_coup",
      gainCreditsAmount: 3,
      removePowerCounterAmount: 3
    });

    expect(actionButtonLabel(corporateCoup)).toBe("Corporate Coup: 3 Credits aus Coup-Counter");
    expect(contextualCardActionLabel(corporateCoup)).toBe("3 Credits nehmen");
  });

  it("drops the card-name prefix for V1.9.11 hidden-zone card menu actions", () => {
    const aujourdOui = legalAction("runner", "gain_credit", "aujourdoui_1", "Aujourd'Oui: Top 5 nach Programmen prüfen", {
      cardId: "aujourdoui_1",
      v1911HiddenZoneAbility: "search_stack_program_to_grip"
    });

    expect(actionButtonLabel(aujourdOui)).toBe("Aujourd'Oui: Top 5 nach Programmen prüfen");
    expect(contextualCardActionLabel(aujourdOui)).toBe("Top 5 nach Programmen prüfen");
  });

  it("labels encounter breaker actions against the current ICE", () => {
    const encounteredIce = card("ice_2", "Data Wall", "ice");
    const running = view("runner", {
      servers: [{ id: "hq", label: "HQ", ice: [card("ice_1", "Inner ICE", "ice"), encounteredIce], root: [] }],
      run: {
        attackedServerId: "hq",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "hq", iceIndex: 1 },
        encounteredIce,
        successful: false
      }
    });
    const pump = legalAction("runner", "pump_breaker", "breaker_1", "Replicator: Stärke +1", { breakerId: "breaker_1", iceId: "ice_2" }, "run.encounter_ice");
    const passIce = legalAction("runner", "continue_run", "game_rule", "ICE passieren", { encounterContinue: true, unbrokenSubroutineCount: 0 }, "run.encounter_ice");

    expect(runPositionStatusLabel(running)).toBe("Aktuell: Begegnung mit ICE 2 (1 von 2)");
    expect(runWindowStatusLabel(running)).toBe("ICE 2 (1 von 2)");
    expect(runAwareActionButtonLabel(running, pump)).toBe(
      "Stärke +1 (Replicator) gegen Data Wall (ICE 2)",
    );
    expect(runAwareActionButtonLabel(running, passIce)).toBe("ICE 2 passieren");
  });

  it("keeps breaker actions on the breaker card, not the encountered ICE", () => {
    const pump = legalAction("runner", "pump_breaker", "breaker_1", "Simple Decoder: Stärke +1", { breakerId: "breaker_1", iceId: "ice_1" }, "run.encounter_ice");
    pump.targetRequirements = [{ id: "encountered_ice", kind: "card", sourceIceRef: "ice_1" }];

    expect(actionMatchesContext(pump, { kind: "card", id: "breaker_1", label: "Simple Decoder" })).toBe(true);
    expect(actionMatchesContext(pump, { kind: "card", id: "ice_1", label: "Fetch 4.0.1" })).toBe(false);
  });

  it("places main-phase rez actions for installed upgrades on the card context", () => {
    const upgradeRez = legalAction("corp", "rez_ice", "game_rule", "Karte in Remote 1 rezzen", { cardId: "upgrade_1", serverId: "remote_1" });
    const runIceRez = legalAction("corp", "rez_ice", "game_rule", "ICE rezzen", { cardId: "ice_1", serverId: "remote_1" }, "run.approach_ice");

    const split = splitLegalActions([upgradeRez, runIceRez]);

    expect(split.contextualActions).toEqual([upgradeRez]);
    expect(split.primaryActions).toEqual([runIceRez]);
    expect(actionMatchesContext(upgradeRez, { kind: "card", id: "upgrade_1", label: "Tesseract Fort Construction" })).toBe(true);
    expect(contextualCardActionLabel(upgradeRez)).toBe("Rezzen");
  });

  it("shows access progress only from PlayerView breach data", () => {
    const firstAccess = view("runner", {
      run: {
        attackedServerId: "hq",
        phase: "access",
        successful: true,
        breach: { breachId: "breach_1", serverId: "hq", currentIndex: 0, remainingCount: 2, completed: false }
      }
    });
    const secondAccess = view("runner", {
      run: {
        attackedServerId: "hq",
        phase: "access",
        successful: true,
        breach: { breachId: "breach_1", serverId: "hq", currentIndex: 1, remainingCount: 1, completed: false }
      }
    });

    expect(currentRunTimelineStep(secondAccess, [])).toBe("access");
    expect(breachProgressLabel(firstAccess)).toBe("Zugriff 1 von 2");
    expect(breachProgressLabel(secondAccess)).toBe("Zugriff 2 von 2");
  });

  it("groups public Runner rig cards without implying hidden cards", () => {
    const groups = groupRunnerRigCards([card("program_1", "Program", "program"), card("hardware_1", "Hardware", "hardware"), card("resource_1", "Resource", "resource")]);

    expect(groups.map((group) => group.label)).toEqual(["Programme", "Hardware", "Ressourcen"]);
    expect(groups.flatMap((group) => group.cards.map((entry) => entry.instanceId))).toEqual(["program_1", "hardware_1", "resource_1"]);
  });

  it("summarizes public Runner MU for the Corp rig view", () => {
    const corpView = view("corp", {
      opponent: {
        ...view("corp").opponent,
        rig: [card("killer_1", "Simple Killer", "program"), card("chip_1", "Memory Chip", "hardware")],
        memoryUsed: 2,
        memoryLimit: 4
      }
    });

    expect(runnerRigMemorySummary(corpView, "opponent")).toEqual({
      used: 2,
      limit: 4,
      text: "2/4",
      ariaLabel: "MU 2 von 4"
    });

    const updatedCorpView = view("corp", {
      opponent: {
        ...corpView.opponent,
        rig: [card("killer_1", "Simple Killer", "program")],
        memoryUsed: 1
      }
    });

    expect(runnerRigMemorySummary(updatedCorpView, "opponent")?.text).toBe("1/4");
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

  it("debounces the AI fallback controls during automatic pacing", () => {
    expect(aiPacingFallbackDelayMs("manual", false)).toBe(0);
    expect(aiPacingFallbackDelayMs("paced", false)).toBe(4000);
    expect(aiPacingFallbackDelayMs("fast", false)).toBe(4000);
    expect(aiPacingFallbackDelayMs("paced", true)).toBeNull();
  });

  it("routes hidden multi-card choices through the explicit selection panel", () => {
    const organDonorChoice: NonNullable<PlayerView["pendingChoice"]> = {
      choiceId: "v1922_runner_grip_trash_1",
      side: "runner",
      source: "v1922.runner_grip_trash_gain_credits:organ_donor:1",
      prompt: "Grip-Karten trashen",
      kind: "select_cards",
      options: [
        { id: "card_a", label: "Karte A", value: "a" },
        { id: "card_b", label: "Karte B", value: "b" }
      ],
      minSelections: 0,
      maxSelections: 2,
      stateVersion: 1,
      visibility: "hidden_info_barrier"
    };
    const exactSingleChoice: NonNullable<PlayerView["pendingChoice"]> = {
      ...organDonorChoice,
      choiceId: "single_card_choice",
      minSelections: 1,
      maxSelections: 1
    };
    const forgottenBackupChoice: NonNullable<PlayerView["pendingChoice"]> = {
      ...exactSingleChoice,
      choiceId: "v1911_search_stack_7",
      source: "v1911.search_stack:7",
      prompt: "Stack durchsuchen"
    };

    expect(shouldUseCardChoicePanel(organDonorChoice)).toBe(true);
    expect(shouldUseCardChoicePanel(exactSingleChoice)).toBe(false);
    expect(shouldUseCardChoicePanel(forgottenBackupChoice)).toBe(true);
  });

  it("detects field-card choices for installed board cards only", () => {
    const bbs = card("corp_bbs_1", "BBS Whispering Campaign", "asset", false);
    const ice = card("corp_ice_1", "Wall", "ice", false);
    const runnerProgram = card("runner_program_1", "Virus Program", "program");
    const board = view("runner", {
      own: {
        ...view("runner").own,
        rig: [runnerProgram]
      },
      servers: [{ id: "remote_1", label: "Remote 1", ice: [ice], root: [bbs] }]
    });
    const fieldChoice: NonNullable<PlayerView["pendingChoice"]> = {
      choiceId: "hunt_club_bbs_choice",
      side: "runner",
      source: "v1912.hunt_club_bbs_expose:bbs:1",
      prompt: "Installierte Korp-Karten ansehen",
      kind: "select_cards",
      options: [
        { id: "card_bbs", label: "Remote 1 Root", value: "corp_bbs_1" },
        { id: "card_ice", label: "Remote 1 ICE", value: "corp_ice_1" }
      ],
      minSelections: 0,
      maxSelections: 3,
      stateVersion: 1,
      visibility: "hidden_info_barrier"
    };
    const handChoice: NonNullable<PlayerView["pendingChoice"]> = {
      ...fieldChoice,
      choiceId: "grip_choice",
      source: "v1922.runner_grip_trash_gain_credits:organ_donor:1",
      options: [{ id: "card_hand", label: "Grip-Karte", value: "runner_hand_1" }]
    };
    const stackChoice: NonNullable<PlayerView["pendingChoice"]> = {
      ...fieldChoice,
      choiceId: "stack_choice",
      source: "v1911.search_stack:1",
      stackSearchResolution: {
        reveal: "hidden",
        destination: "grip",
        shuffleAfter: true
      }
    };
    const runnerRigChoice: NonNullable<PlayerView["pendingChoice"]> = {
      ...fieldChoice,
      choiceId: "viral_15_choice",
      source: "v1922.viral_15_program_trash:virus:1",
      prompt: "Installiertes Runner-Programm wählen",
      options: [{ id: "card_runner_program", label: "Runner-Programm", value: "runner_program_1" }],
      minSelections: 1,
      maxSelections: 1
    };

    expect(shouldUseFieldCardChoice(fieldChoice, board)).toBe(true);
    expect(shouldUseFieldCardChoice(runnerRigChoice, board)).toBe(true);
    expect(shouldUseCardChoicePanel(fieldChoice)).toBe(true);
    expect(fieldCardChoiceOptionForCard(fieldChoice, board, bbs)?.id).toBe("card_bbs");
    expect(fieldCardChoiceOptionForCard(fieldChoice, board, runnerProgram)).toBeNull();
    expect(fieldCardChoiceOptionForCard(runnerRigChoice, board, runnerProgram)?.id).toBe("card_runner_program");
    expect(fieldCardChoiceInfo(fieldChoice, ["card_bbs"])).toMatchObject({
      title: "Feldkarten auswählen",
      counterLabel: "1/0-3",
      canSubmit: true,
      canClear: true,
      submitLabel: "Auswahl übernehmen"
    });
    expect(shouldUseFieldCardChoice(handChoice, board)).toBe(false);
    expect(shouldUseFieldCardChoice(stackChoice, board)).toBe(false);
  });

  it("labels Runner program install trash choices for optional and required MU cases", () => {
    const sourceProgram = {
      ...card("new_program", "New Program", "program"),
      memoryCost: 2
    };
    const oldBreaker = {
      ...card("old_breaker", "Old Breaker", "program"),
      memoryCost: 1
    };
    const oldUtility = {
      ...card("old_utility", "Old Utility", "program"),
      memoryCost: 2
    };
    const pendingChoice: NonNullable<PlayerView["pendingChoice"]> = {
      choiceId: "runner_program_trash_before_install_7",
      side: "runner",
      source: "runner_program_trash_before_install:new_program:7",
      prompt: "Programme vor Installation trashen",
      kind: "select_cards",
      options: [
        { id: "card_old_breaker", label: "Old Breaker", value: "old_breaker" },
        { id: "card_old_utility", label: "Old Utility", value: "old_utility" }
      ],
      minSelections: 0,
      maxSelections: 2,
      stateVersion: 7,
      visibility: "hidden_info_barrier"
    };
    const optionalView = view("runner", {
      own: {
        ...view("runner").own,
        gripOrHq: [sourceProgram],
        rig: [oldBreaker, oldUtility],
        memoryUsed: 1,
        memoryLimit: 4
      }
    });
    const requiredView = view("runner", {
      own: {
        ...view("runner").own,
        gripOrHq: [sourceProgram],
        rig: [oldBreaker, oldUtility],
        memoryUsed: 4,
        memoryLimit: 4
      }
    });

    expect(runnerProgramInstallTrashChoiceInfo(pendingChoice, optionalView, [])).toMatchObject({
      title: "Programme vorher trashen?",
      submitLabel: "Ohne Trash installieren",
      canSubmit: true,
      requiredMemoryToFree: 0,
      selectedMemoryFreed: 0
    });
    expect(
      runnerProgramInstallTrashChoiceInfo(pendingChoice, requiredView, [
        "card_old_breaker"
      ])
    ).toMatchObject({
      title: "MU freimachen",
      submitLabel: "Auswahl bestätigen",
      canSubmit: false,
      requiredMemoryToFree: 2,
      selectedMemoryFreed: 1
    });
    expect(
      runnerProgramInstallTrashChoiceInfo(pendingChoice, requiredView, [
        "card_old_utility"
      ])
    ).toMatchObject({
      title: "MU freimachen",
      question: "2/2 MU gewählt. Auswahl bestätigen?",
      submitLabel: "Auswahl bestätigen",
      canSubmit: true,
      selectedMemoryFreed: 2
    });
    expect(runnerProgramInstallTrashChoiceInfo(pendingChoice, requiredView, [])).toMatchObject({
      submitLabel: "Nicht installieren",
      canSubmit: true
    });
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

  it("derives bonus-action slot capacity from current turn action history", () => {
    const events = [
      publicEvent("evt_1", "mandatory_draw", { actor: "corp", actionType: "mandatory_draw" }),
      publicEvent("evt_2", "play_operation", {
        actor: "corp",
        actionType: "play_operation",
        actionCostClicks: 1,
        turnActionOrdinalStart: 1,
        turnActionOrdinalEnd: 1,
        gainedActions: 2
      })
    ];

    expect(actionSlotCapacityForTurn("corp", 4, events)).toBe(5);
    expect(actionSlotDisplay("corp", 4, actionSlotCapacityForTurn("corp", 4, events), true).slots.map((slot) => `${slot.state}:${slot.bonus}`)).toEqual([
      "spent:false",
      "available:false",
      "available:false",
      "available:true",
      "available:true"
    ]);
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
    expect(actionConsumesClick({ costs: [{ clicks: 1, credits: 2 }] })).toBe(true);
    expect(actionConsumesClick({ costs: [{ credits: 2 }] })).toBe(false);
    expect(actionConsumesClick({ costs: [] })).toBe(false);
  });

  it("keeps paid ability costs in chips instead of duplicating them in labels", () => {
    const paidAbility: LegalAction = {
      ...legalAction("runner", "trigger_ability", "ability_1", "Bezahlte Fähigkeit ausführen", { cardId: "ability_1" }),
      costs: [{ clicks: 1 }, { credits: 2 }]
    };

    expect(actionButtonLabel(paidAbility)).toBe("Bezahlte Fähigkeit ausführen");
    expect(contextualCardActionLabel(paidAbility)).toBe("Bezahlte Fähigkeit ausführen");
    expect(actionCostChips(paidAbility)).toEqual([
      { kind: "action", amount: 1, label: "1 Aktion" },
      { kind: "credit", amount: 2, label: "2 Credits" }
    ]);
  });

  it("maps CounterDisplay stored credits to the existing card credit badge pattern", () => {
    const brokerAfterLoad: VisibleCard = {
      ...card("broker_1", "Broker", "resource"),
      counterDisplays: [
        {
          id: "stored_credits",
          amount: 3,
          displayKind: "stored_credits",
          label: "Credits",
          ariaLabel: "3 gespeicherte Credits",
          counterType: "bit",
          usageHint: "spendable"
        }
      ]
    };
    const brokerTenPlus: VisibleCard = {
      ...brokerAfterLoad,
      instanceId: "broker_2",
      counterDisplays: [{ ...brokerAfterLoad.counterDisplays![0]!, amount: 12, ariaLabel: "12 gespeicherte Credits" }]
    };
    const shortTerm: VisibleCard = {
      ...card("short_term_1", "Short-Term Contract", "resource"),
      counterDisplays: [{ ...brokerAfterLoad.counterDisplays![0]!, amount: 10, ariaLabel: "10 gespeicherte Credits" }]
    };
    const bbsUnderTen: VisibleCard = {
      ...card("bbs_1", "BBS Whispering Campaign", "asset"),
      counterDisplays: [{ ...brokerAfterLoad.counterDisplays![0]!, amount: 8, ariaLabel: "8 gespeicherte Credits" }]
    };
    const bbsTenPlus: VisibleCard = {
      ...bbsUnderTen,
      instanceId: "bbs_2",
      counterDisplays: [{ ...brokerAfterLoad.counterDisplays![0]!, amount: 10, ariaLabel: "10 gespeicherte Credits" }]
    };
    const braindanceTenPlus: VisibleCard = {
      ...card("braindance_1", "Braindance Campaign", "asset"),
      counterDisplays: [{ ...brokerAfterLoad.counterDisplays![0]!, amount: 12, ariaLabel: "12 gespeicherte Credits" }]
    };
    const unknownPowerCard: VisibleCard = {
      ...card("unknown_1", "Unknown Power Counter Card", "asset"),
      counters: { power: 8 }
    };

    expect(storedCreditSourceLabel(brokerAfterLoad)).toBe("Credits");
    expect(storedCreditAmount(brokerAfterLoad)).toBe(3);
    expect(cardCreditCounterVisual(storedCreditAmount(brokerAfterLoad))).toMatchObject({
      safeAmount: 3,
      showCount: false,
      iconCount: 3
    });
    expect(storedCreditAmount(brokerTenPlus)).toBe(12);
    expect(cardCreditCounterVisual(storedCreditAmount(brokerTenPlus))).toMatchObject({
      safeAmount: 12,
      showCount: true,
      iconCount: 1
    });
    expect(storedCreditSourceLabel(shortTerm)).toBe("Credits");
    expect(storedCreditAmount(shortTerm)).toBe(10);
    expect(storedCreditSourceLabel(bbsUnderTen)).toBe("Credits");
    expect(storedCreditAmount(bbsUnderTen)).toBe(8);
    expect(cardCreditCounterVisual(storedCreditAmount(bbsUnderTen))).toMatchObject({
      safeAmount: 8,
      showCount: false,
      iconCount: 8
    });
    expect(storedCreditAmount(bbsTenPlus)).toBe(10);
    expect(cardCreditCounterVisual(storedCreditAmount(bbsTenPlus))).toMatchObject({
      safeAmount: 10,
      showCount: true,
      iconCount: 1
    });
    expect(storedCreditSourceLabel(braindanceTenPlus)).toBe("Credits");
    expect(storedCreditAmount(braindanceTenPlus)).toBe(12);
    expect(cardCreditCounterVisual(storedCreditAmount(braindanceTenPlus))).toMatchObject({
      safeAmount: 12,
      showCount: true,
      iconCount: 1
    });
    expect(storedCreditAmount(unknownPowerCard)).toBe(0);
  });

  it("keeps legacy stored-credit fallback bounded while CounterDisplay remains primary", () => {
    expect(
      storedCreditAmount({
        ...card("broker_legacy", "Broker", "resource"),
        definitionId: "onr_v1_154_broker",
        counters: { bit: 3 }
      })
    ).toBe(3);
    expect(
      storedCreditAmount({
        ...card("unknown_1", "Unknown Power Counter Card", "asset"),
        counters: { power: 8 }
      })
    ).toBe(0);
  });

  it("does not select raw counters for board rendering when CounterDisplays are missing", () => {
    const rawOnly: VisibleCard = {
      ...card("broker_raw_only", "Broker", "resource"),
      definitionId: "onr_v1_154_broker",
      counters: { bit: 3, recurring_credit: 2, shell: 1 }
    };
    const displayCard: VisibleCard = {
      ...card("broker_display", "Broker", "resource"),
      counters: { bit: 99 },
      counterDisplays: [
        {
          id: "stored_credits",
          amount: 3,
          displayKind: "stored_credits",
          label: "Credits",
          ariaLabel: "3 gespeicherte Credits",
          counterType: "bit",
          usageHint: "spendable"
        },
        {
          id: "advancement",
          amount: 2,
          displayKind: "advancement",
          label: "Entwicklung",
          ariaLabel: "2 Entwicklungen"
        }
      ]
    };
    expect(counterDisplaysForRendering(rawOnly)).toEqual([]);
    expect(counterDisplaysForRendering(displayCard).map((display) => display.id)).toEqual(["stored_credits"]);
  });

  it("maps CounterDisplay special counters to compact badge models", () => {
    expect(
      armoredFridgeAblativeCounterBadge({
        ...card("fridge_1", "Armored Fridge", "hardware"),
        counterDisplays: [
          {
            id: "ablative",
            amount: 7,
            displayKind: "damage_prevention",
            label: "Ablative-Counter",
            ariaLabel: "7 Ablative-Counter",
            counterType: "ablative",
            usageHint: "status_marker"
          }
        ]
      })
    ).toEqual({
      amount: 7,
      label: "7 Ablative-Counter",
      ariaLabel: "7 Ablative-Counter",
      shortLabel: "7 Ablative",
      testId: "ablative-counter-badge"
    });
    expect(
      counterDisplayBadgeView(
        {
          id: "data_raven",
          amount: 2,
          displayKind: "trace",
          label: "Data-Raven-Counter",
          ariaLabel: "2 Data-Raven-Counter",
          counterType: "data_raven",
          usageHint: "status_marker"
        },
        "data-raven-counter-badge"
      )
    ).toMatchObject({
      amount: 2,
      label: "2 Data-Raven-Counter",
      ariaLabel: "2 Data-Raven-Counter",
      shortLabel: "2 Data-Raven"
    });
    expect(
      armoredFridgeAblativeCounterBadge({
        ...card("fridge_1", "Armored Fridge", "hardware"),
        definitionId: "onr_v1_121_armored-fridge",
        counters: { power: 0 }
      })
    ).toBeNull();
    expect(
      armoredFridgeAblativeCounterBadge({
        ...card("data_raven_1", "Data Raven", "ice"),
        definitionId: "onr_v1_236_data-raven",
        counters: { power: 2 }
      })
    ).toBeNull();
    expect(
      armoredFridgeAblativeCounterBadge({
        ...card("unknown_power_1", "Unknown Power Card", "resource"),
        counters: { power: 3 }
      })
    ).toBeNull();
  });

  it("keeps advancement counters as separate gems until ten counters", () => {
    expect(advancementCounterDisplay({ known: false, advancementCounters: 5 })).toEqual({
      amount: 5,
      ariaLabel: "5 öffentliche Advancement-Counter",
      visibleGemCount: 5,
      overflowLabel: null
    });
    expect(advancementCounterDisplay({ known: true, advancementCounters: 5 })).toEqual({
      amount: 5,
      ariaLabel: "5 Entwicklungen",
      visibleGemCount: 5,
      overflowLabel: null
    });
    expect(advancementCounterDisplay({ known: true, advancementCounters: 9 })).toEqual({
      amount: 9,
      ariaLabel: "9 Entwicklungen",
      visibleGemCount: 9,
      overflowLabel: null
    });
    expect(advancementCounterDisplay({ known: false, advancementCounters: 10 })).toEqual({
      amount: 10,
      ariaLabel: "10 öffentliche Advancement-Counter",
      visibleGemCount: 1,
      overflowLabel: "10"
    });
    expect(advancementCounterDisplay({ known: false, advancementCounters: 0 })).toBeNull();
  });

  it("renders low credit-counter amounts as separate icons", () => {
    expect(cardCreditCounterVisual(2)).toMatchObject({
      safeAmount: 2,
      showCount: false,
      iconCount: 2
    });
  });

  it("keeps contextual card action labels distinct for server-targeted events", () => {
    expect(contextualCardActionLabel(legalAction("runner", "play_event", "card_1", "Simple Run Event auf R&D", { cardId: "card_1", serverId: "rd" }))).toBe("Run auf R&D");
    expect(contextualCardActionLabel(legalAction("runner", "play_event", "card_1", "Simple Run Event auf Archives", { cardId: "card_1", serverId: "archives" }))).toBe("Run auf Archive");
    expect(contextualCardActionLabel(legalAction("runner", "play_event", "card_1", "Simple Draw Event spielen", { cardId: "card_1" }))).toBe("Spielen");
    expect(contextualCardActionLabel(legalAction("runner", "play_event", "card_1", "Expose Event auf Remote 2", { cardId: "card_1", serverId: "remote_2" }))).toBe("Spielen auf Remote 2");
  });

  it("names Corp install destinations in card context actions", () => {
    expect(contextualCardActionLabel(legalAction("corp", "install_card", "ice_1", "ICE vor HQ installieren", { cardId: "ice_1", serverId: "hq", placement: "ice" }))).toBe("Vor HQ");
    expect(contextualCardActionLabel(legalAction("corp", "install_card", "ice_1", "ICE vor R&D installieren", { cardId: "ice_1", serverId: "rd", placement: "ice" }))).toBe("Vor R&D");
    expect(contextualCardActionLabel(legalAction("corp", "install_card", "ice_1", "ICE vor Archives installieren", { cardId: "ice_1", serverId: "archives", placement: "ice" }))).toBe("Vor Archive");
    expect(contextualCardActionLabel(legalAction("corp", "install_card", "ice_1", "ICE vor neuem Remote installieren", { cardId: "ice_1", serverId: "new_remote", placement: "ice" }))).toBe("Neues Remote erstellen");
    expect(contextualCardActionLabel(legalAction("corp", "install_card", "agenda_1", "Karte in neuem Remote installieren", { cardId: "agenda_1", serverId: "new_remote", placement: "root" }))).toBe("In neuem Remote");
    expect(
      contextualCardActionLabel(
        legalAction("corp", "install_card", "agenda_1", "Karte in Remote 1 installieren", {
          cardId: "agenda_1",
          serverId: "remote_1",
          placement: "root",
          rootReplacement: "asset_to_agenda",
        }),
      ),
    ).toBe("In Remote 1 (Node ersetzen)");
    expect(contextualCardActionLabel(legalAction("corp", "install_card", "upgrade_1", "Karte in HQ installieren", { cardId: "upgrade_1", serverId: "hq", placement: "root" }))).toBe(
      "In HQ",
    );
    expect(contextualCardActionLabel(legalAction("corp", "install_card", "upgrade_1", "Karte in R&D installieren", { cardId: "upgrade_1", serverId: "rd", placement: "root" }))).toBe(
      "In R&D",
    );
    expect(contextualCardActionLabel(legalAction("runner", "install_card", "program_1", "Programm installieren", { cardId: "program_1" }))).toBe("Installieren");
    expect(
      contextualCardActionLabel(
        legalAction(
          "runner",
          "install_card",
          "restrictive_1",
          "Restrictive Net Zoning auf R&D ausrichten",
          { cardId: "restrictive_1", selectedServerId: "rd" },
        ),
      ),
    ).toBe("Auf R&D ausrichten");
    expect(
      contextualCardActionLabel(
        legalAction(
          "runner",
          "install_card",
          "restrictive_1",
          "Restrictive Net Zoning auf Remote 1 ausrichten",
          { cardId: "restrictive_1", selectedServerId: "remote_1" },
        ),
      ),
    ).toBe("Auf Remote 1 ausrichten");
  });

  it("keeps new-remote ICE installs as the last card-context action", () => {
    const newRemoteIce = legalAction("corp", "install_card", "ice_1", "ICE vor neuem Remote installieren", { cardId: "ice_1", serverId: "new_remote", placement: "ice" });
    const hqIce = legalAction("corp", "install_card", "ice_1", "ICE vor HQ installieren", { cardId: "ice_1", serverId: "hq", placement: "ice" });
    const rdIce = legalAction("corp", "install_card", "ice_1", "ICE vor R&D installieren", { cardId: "ice_1", serverId: "rd", placement: "ice" });

    expect(orderedCardContextActions([newRemoteIce, hqIce, rdIce])).toEqual([hqIce, rdIce, newRemoteIce]);
  });

  it("moves rig icebreaker actions to their card context", () => {
    const pump = legalAction("runner", "pump_breaker", "breaker_1", "Simple Decoder pumpen", { breakerId: "breaker_1", iceId: "ice_1" }, "run.encounter_ice");
    const breakAction = legalAction("runner", "break_subroutine", "breaker_1", "Simple Decoder: Subroutine 1 brechen", { breakerId: "breaker_1", iceId: "ice_1", subroutineIndex: 0 }, "run.encounter_ice");
    const paidBreakAction: LegalAction = { ...breakAction, costs: [{ credits: 2 }] };
    const paidPump: LegalAction = { ...pump, costs: [{ credits: 1 }] };
    const multiCostBreakAction: LegalAction = { ...breakAction, costs: [{ clicks: 1 }, { credits: 2 }] };
    const continueRun = legalAction("runner", "continue_run", "game_rule", "Run fortsetzen", undefined, "run.approach_ice");

    const split = splitLegalActions([pump, breakAction, continueRun]);

    expect(split.primaryActions.map((action) => action.type)).toEqual(["continue_run"]);
    expect(split.contextualActions).toEqual([pump, breakAction]);
    expect(actionMatchesContext(pump, { kind: "card", id: "breaker_1", label: "Simple Decoder" })).toBe(true);
    expect(actionButtonLabel(pump)).toBe("Stärke +1 (Simple Decoder)");
    expect(contextualCardActionLabel(pump)).toBe("Stärke +1 (Simple Decoder)");
    expect(actionButtonLabel(breakAction)).toBe("Subroutine 1 brechen (Simple Decoder)");
    expect(contextualCardActionLabel(breakAction)).toBe("Subroutine 1 brechen (Simple Decoder)");
    expect(actionButtonLabel(paidBreakAction)).toBe("Subroutine 1 brechen (Simple Decoder)");
    expect(contextualCardActionLabel(paidBreakAction)).toBe("Subroutine 1 brechen (Simple Decoder)");
    expect(actionButtonLabel(paidPump)).toBe("Stärke +1 (Simple Decoder)");
    expect(actionButtonLabel(multiCostBreakAction)).toBe("Subroutine 1 brechen (Simple Decoder)");
    expect(actionCostChips(multiCostBreakAction)).toEqual([
      { kind: "action", amount: 1, label: "1 Aktion" },
      { kind: "credit", amount: 2, label: "2 Credits" }
    ]);
  });

  it("keeps Broker abilities on the installed resource overlay", () => {
    const load = legalAction("runner", "trigger_ability", "broker_1", "Broker: 3 Credits auf Broker legen", {
      cardId: "broker_1",
      resourceAbility: "broker_load_credits",
      counterType: "power",
      addCounterAmount: 3
    });
    const take = legalAction("runner", "trigger_ability", "broker_1", "Broker: 6 Credits nehmen", {
      cardId: "broker_1",
      resourceAbility: "broker_take_credits",
      counterType: "power",
      gainCreditsAmount: 6
    });

    const split = splitLegalActions([load, take]);

    expect(split.primaryActions).toEqual([]);
    expect(split.contextualActions).toEqual([load, take]);
    expect(actionMatchesContext(load, { kind: "card", id: "broker_1", label: "Broker" })).toBe(true);
    expect(contextualCardActionLabel(load)).toBe("3 Credits laden");
    expect(contextualCardActionLabel(take)).toBe("6 Credits nehmen");
  });

  it("labels Data Raven counter removal on the rezzed ice overlay", () => {
    const remove = legalAction("runner", "trigger_ability", "data_raven_1", "Data-Raven-Counter entfernen", {
      cardId: "data_raven_1",
      runnerAbility: "remove_data_raven_counter",
      counterType: "power",
      removeCounterAmount: 1
    });

    const split = splitLegalActions([remove]);

    expect(split.primaryActions).toEqual([]);
    expect(split.contextualActions).toEqual([remove]);
    expect(actionMatchesContext(remove, { kind: "card", id: "data_raven_1", label: "Data Raven" })).toBe(true);
    expect(actionButtonLabel(remove)).toBe("Raven-Counter entfernen");
    expect(contextualCardActionLabel(remove)).toBe("Raven-Counter entfernen");
  });

  it("labels The Shell Traders abilities on the installed resource overlay", () => {
    const prepare = legalAction("runner", "trigger_ability", "shell_traders_1", "The Shell Traders: Karte vorbereiten", {
      cardId: "shell_traders_1",
      shellTradersAbility: "set_aside_from_grip",
      targetCardId: "simple_fracter_1",
      targetCardDefinitionId: "simple_fracter",
      shellCounterAmount: 2
    });
    const remove = legalAction("runner", "trigger_ability", "shell_traders_1", "The Shell Traders: 1 Shell-Counter entfernen", {
      cardId: "shell_traders_1",
      shellTradersAbility: "remove_shell_counter",
      targetCardId: "simple_fracter_1",
      targetCardDefinitionId: "simple_fracter",
      counterType: "shell",
      removeCounterAmount: 1
    });

    const split = splitLegalActions([prepare, remove]);

    expect(split.primaryActions).toEqual([]);
    expect(split.contextualActions).toEqual([prepare, remove]);
    expect(actionMatchesContext(prepare, { kind: "card", id: "shell_traders_1", label: "The Shell Traders" })).toBe(true);
    expect(actionButtonLabel(prepare)).toBe("Simple Fracter zur Seite legen");
    expect(actionButtonLabel(remove)).toBe("Shell-Counter von Simple Fracter entfernen");
    expect(contextualCardActionLabel(prepare)).toBe("Simple Fracter zur Seite legen");
    expect(contextualCardActionLabel(remove)).toBe("Shell-Counter von Simple Fracter entfernen");
  });

  it("keeps parallel Shell Traders prepare actions distinguishable by target", () => {
    const fracter = legalAction("runner", "trigger_ability", "shell_traders_1", "The Shell Traders: Simple Fracter vorbereiten", {
      cardId: "shell_traders_1",
      shellTradersAbility: "set_aside_from_grip",
      targetCardId: "simple_fracter_1",
      targetCardDefinitionId: "simple_fracter"
    });
    const decoder = legalAction("runner", "trigger_ability", "shell_traders_1", "The Shell Traders: Simple Decoder vorbereiten", {
      cardId: "shell_traders_1",
      shellTradersAbility: "set_aside_from_grip",
      targetCardId: "simple_decoder_1",
      targetCardDefinitionId: "simple_decoder"
    });

    expect([actionButtonLabel(fracter), actionButtonLabel(decoder)]).toEqual([
      "Simple Fracter zur Seite legen",
      "Simple Decoder zur Seite legen"
    ]);
  });

  it("labels Short-Term Contract take-credit actions on the installed resource overlay", () => {
    const take = legalAction("runner", "trigger_ability", "short_term_1", "Short-Term Contract: 2 Credits nehmen", {
      cardId: "short_term_1",
      resourceAbility: "short_term_contract_take_credits",
      counterType: "power",
      removePowerCounterAmount: 2,
      gainCreditsAmount: 2
    });

    const split = splitLegalActions([take]);

    expect(split.primaryActions).toEqual([]);
    expect(split.contextualActions).toEqual([take]);
    expect(actionMatchesContext(take, { kind: "card", id: "short_term_1", label: "Short-Term Contract" })).toBe(true);
    expect(contextualCardActionLabel(take)).toBe("2 Credits nehmen");
  });

  it("labels Junkyard BBS with the concrete heap target", () => {
    const takeTopHeap = legalAction("runner", "trigger_ability", "junkyard_1", "Junkyard BBS: oberste Heap-Karte in die Grip nehmen", {
      cardId: "junkyard_1",
      resourceAbility: "junkyard_bbs_return_top_heap",
      targetCardId: "fracter_1",
      targetCardDefinitionId: "simple_fracter",
      sourceZone: "heap",
      destinationZone: "grip"
    });

    const split = splitLegalActions([takeTopHeap]);

    expect(split.primaryActions).toEqual([]);
    expect(split.contextualActions).toEqual([takeTopHeap]);
    expect(actionMatchesContext(takeTopHeap, { kind: "card", id: "junkyard_1", label: "Junkyard BBS" })).toBe(true);
    expect(actionButtonLabel(takeTopHeap)).toBe("Simple Fracter aus dem Heap auf die Hand nehmen");
    expect(contextualCardActionLabel(takeTopHeap)).toBe("Simple Fracter aus dem Heap auf die Hand nehmen");
  });

  it("labels Self-Modifying Code activation without credit costs", () => {
    const searchInstall = legalAction("runner", "trigger_ability", "smc_1", "Self-Modifying Code: trashen und Programm aus Stack installieren", {
      cardId: "smc_1",
      abilityId: "self_modifying_code_install_program",
      trashOnUse: true
    }, "run.encounter_ice");
    const split = splitLegalActions([searchInstall]);

    expect(split.primaryActions).toEqual([]);
    expect(split.contextualActions).toEqual([searchInstall]);
    expect(actionMatchesContext(searchInstall, { kind: "card", id: "smc_1", label: "Self-Modifying Code" })).toBe(true);
    expect(actionButtonLabel(searchInstall)).toBe("Trashen: Programm aus Stack installieren");
    expect(contextualCardActionLabel(searchInstall)).toBe("Programm suchen");
    expect(actionCostChips(searchInstall)).toEqual([]);
    expect(actionCostChips({ ...searchInstall, costs: [{ credits: 2 }] })).toEqual([]);
  });

  it("mirrors Self-Modifying Code and immediate encounter actions into the Run window without changing their card context", () => {
    const smc = card("smc_1", "Self-Modifying Code", "program");
    const breaker = card("breaker_1", "Simple Decoder", "program");
    const running = view("runner", {
      own: {
        ...view("runner").own,
        rig: [smc, breaker]
      },
      run: {
        attackedServerId: "rd",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "rd", iceIndex: 0 },
        encounteredIce: card("ice_1", "Data Wall", "ice"),
        successful: false
      }
    });
    const searchInstall = legalAction("runner", "trigger_ability", "smc_1", "Self-Modifying Code: trashen und Programm aus Stack installieren", {
      cardId: "smc_1",
      v1911HiddenZoneAbility: "self_modifying_code_install_program",
      trashOnUse: true
    }, "run.encounter_ice");
    const pump: LegalAction = { ...legalAction("runner", "pump_breaker", "breaker_1", "Simple Decoder: Stärke +1", { breakerId: "breaker_1", iceId: "ice_1" }, "run.encounter_ice"), costs: [{ credits: 1 }] };
    const continueRun = legalAction("runner", "continue_run", "game_rule", "ICE passieren", { encounterContinue: true, unbrokenSubroutineCount: 0 }, "run.encounter_ice");
    const offRunAbility = legalAction("runner", "trigger_ability", "broker_1", "Broker: 3 Credits auf Broker legen", { cardId: "broker_1", resourceAbility: "broker_load_credits" });

    const split = splitLegalActions([searchInstall, pump, continueRun, offRunAbility]);
    const mirrored = runWindowActions(running, [searchInstall, pump, continueRun, offRunAbility]);

    expect(split.primaryActions).toEqual([continueRun]);
    expect(split.contextualActions).toEqual([searchInstall, pump, offRunAbility]);
    expect(mirrored).toEqual([searchInstall, pump, continueRun]);
    expect(runWindowActionButtonLabel(running, searchInstall)).toBe("SMC: Programm suchen");
    expect(runWindowActionButtonLabel(running, pump)).toBe("Simple Decoder +1 Stärke");
    const breakAction = legalAction(
      "runner",
      "break_subroutine",
      "breaker_1",
      "Simple Decoder: Subroutine 1 brechen",
      { breakerId: "breaker_1", iceId: "ice_1", subroutineIndex: 0 },
      "run.encounter_ice"
    );
    expect(runWindowActionButtonLabel(running, breakAction)).toBe("Simple Decoder: Subroutine 1 brechen");
    const resolveSubroutines = legalAction(
      "runner",
      "continue_run",
      "game_rule",
      "Subroutinen auslösen (Run endet)",
      { encounterContinue: true, unbrokenSubroutineCount: 1 },
      "run.encounter_ice"
    );
    expect(runWindowActionButtonLabel(running, resolveSubroutines)).toBe("Subroutinen auslösen (Run endet)");
    expect(actionMatchesContext(searchInstall, { kind: "card", id: "smc_1", label: "Self-Modifying Code" })).toBe(true);
    expect(actionCostChips(searchInstall)).toEqual([]);
  });

  it("keeps long run-window breaker examples compact while leaving costs to chips", () => {
    const krash = card("krash_1", "Krash", "program");
    const running = view("runner", {
      own: {
        ...view("runner").own,
        rig: [krash]
      },
      run: {
        attackedServerId: "rd",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "rd", iceIndex: 0 },
        encounteredIce: card("ice_1", "Fire Wall", "ice"),
        successful: false
      }
    });
    const pump: LegalAction = {
      ...legalAction("runner", "pump_breaker", "krash_1", "Krash: Stärke +1", { breakerId: "krash_1", iceId: "ice_1" }, "run.encounter_ice"),
      costs: [{ credits: 2 }]
    };

    const label = runWindowActionButtonLabel(running, pump);

    expect(label).toBe("Krash +1 Stärke");
    expect(label).not.toContain("gegen Fire Wall");
    expect(label).not.toContain("(ICE 1)");
    expect(actionCostChips(pump)).toEqual([{ kind: "credit", amount: 2, label: "2 Credits" }]);
  });

  it("does not show a false missing-breaker hint in the corp encounter view", () => {
    const codecracker: VisibleCard = {
      ...card("codecracker_1", "Codecracker", "program"),
      subtypes: ["icebreaker"],
      rulesText: "0 Credits: Break code gate subroutine.\n1 Credit: +1 strength.",
      strength: 0
    };
    const endlessCorridor: VisibleCard = {
      ...card("ice_1", "Endless Corridor", "ice"),
      subtypes: ["code_gate"],
      rulesText: "End the run.\nEnd the run.",
      strength: 2
    };
    const corpView = view("corp", {
      activeSide: "runner",
      timingPoint: "run.encounter_ice",
      opponent: {
        ...view("corp").opponent,
        rig: [codecracker]
      },
      run: {
        attackedServerId: "rd",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "rd", iceIndex: 0 },
        encounteredIce: endlessCorridor,
        successful: false
      }
    });

    expect(runBreakerActionHint(corpView, [])).toBe("Runner-Rig zeigt passenden Eisbrecher: Codecracker.");
  });

  it("keeps the no-matching-breaker hint for the runner action view", () => {
    const runnerView = view("runner", {
      activeSide: "runner",
      timingPoint: "run.encounter_ice",
      run: {
        attackedServerId: "rd",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "rd", iceIndex: 0 },
        encounteredIce: { ...card("ice_1", "Endless Corridor", "ice"), subtypes: ["code_gate"] },
        successful: false
      }
    });

    expect(runBreakerActionHint(runnerView, [])).toBe("Kein passender Eisbrecher für dieses ICE verfügbar.");
  });

  it("keeps approach-ice expose decisions visible in the main and Run panels", () => {
    const smarteye = card("smarteye_1", "Smarteye", "program");
    const running = view("runner", {
      timingPoint: "run.approach_ice",
      activeSide: "runner",
      phase: "run",
      own: {
        ...view("runner").own,
        rig: [smarteye]
      },
      servers: [
        { id: "rd", label: "R&D", ice: [card("ice_1", "Filter", "ice", false)], root: [] }
      ],
      run: {
        attackedServerId: "rd",
        phase: "approach_ice",
        position: { kind: "ice", serverId: "rd", iceIndex: 0 },
        successful: false
      }
    });
    const expose = legalAction(
      "runner",
      "trigger_ability",
      "smarteye_1",
      "Smarteye: ICE ansehen",
      { cardId: "smarteye_1", iceId: "ice_1", approachIceExposeDecision: "expose" },
      "run.approach_ice"
    );
    const decline = legalAction(
      "runner",
      "trigger_ability",
      "smarteye_1",
      "Smarteye: Ansehen überspringen",
      { cardId: "smarteye_1", iceId: "ice_1", approachIceExposeDecision: "decline" },
      "run.approach_ice"
    );
    const finishViewing = legalAction(
      "runner",
      "trigger_ability",
      "smarteye_1",
      "Smarteye: Ansehen beenden",
      { cardId: "smarteye_1", iceId: "ice_1", approachIceExposeViewDecision: "finish" },
      "run.approach_ice"
    );

    const split = splitLegalActions([expose, decline]);
    const mirrored = runWindowActions(running, [expose, decline, finishViewing]);

    expect(split.primaryActions).toEqual([expose, decline]);
    expect(split.contextualActions).toEqual([]);
    expect(mirrored).toEqual([expose, decline, finishViewing]);
    expect(runWindowActionButtonLabel(running, expose)).toBe("Smarteye: ICE ansehen");
    expect(runWindowActionButtonLabel(running, decline)).toBe("Smarteye: Ansehen überspringen");
    expect(runWindowActionButtonLabel(running, finishViewing)).toBe("Smarteye: Ansehen beenden");
  });

  it("mirrors Startup Immolator post-pass trash into the Run window", () => {
    const startup = card("startup_1", "Startup Immolator", "program");
    const running = view("runner", {
      own: {
        ...view("runner").own,
        rig: [startup]
      },
      run: {
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
        successful: false
      }
    });
    const startupTrash: LegalAction = {
      ...legalAction("runner", "trigger_ability", "startup_1", "Startup Immolator: ICE trashen", {
        cardId: "startup_1",
        targetIceId: "ice_1",
        v1922RunnerProgramAbility: "startup_immolator_trash_ice",
        rezCostPaid: 3
      }, "run.jack_out_window"),
      costs: [{ credits: 3 }]
    };
    const continueRun = legalAction("runner", "continue_run", "game_rule", "Run fortsetzen", undefined, "run.jack_out_window");
    const offRunAbility = legalAction("runner", "trigger_ability", "broker_1", "Broker: 3 Credits auf Broker legen", { cardId: "broker_1", resourceAbility: "broker_load_credits" });

    const mirrored = runWindowActions(running, [startupTrash, continueRun, offRunAbility]);

    expect(mirrored).toEqual([startupTrash, continueRun]);
    expect(runWindowActionButtonLabel(running, startupTrash)).toBe("Startup Immolator: ICE trashen");
    expect(actionCostChips(startupTrash)).toEqual([{ kind: "credit", amount: 3, label: "3 Credits" }]);
    expect(actionMatchesContext(startupTrash, { kind: "card", id: "startup_1", label: "Startup Immolator" })).toBe(true);
  });

  it("mirrors the card access action into the Run window with a German label", () => {
    const running = view("runner", {
      run: {
        attackedServerId: "rd",
        phase: "access",
        position: { kind: "server", serverId: "rd" },
        successful: true
      }
    });
    const access = legalAction("runner", "access_card", "game_rule", "Karte accessen", undefined, "access.resolve_card");
    const draw = legalAction("runner", "draw_card", "basic_action", "Karte ziehen");

    const mirrored = runWindowActions(running, [access, draw]);

    expect(actionButtonLabel(access)).toBe("Zugriff auf Karte");
    expect(mirrored).toEqual([access]);
    expect(runWindowActionButtonLabel(running, access)).toBe("Zugriff auf Karte");
  });

  it("keeps City Surveillance draw choices visible in draw action labels", () => {
    const pay = legalAction(
      "runner",
      "draw_card",
      "basic_action",
      "Karte ziehen (City Surveillance: 1 Credit zahlen)",
      {
        citySurveillanceSourceCount: 1,
        citySurveillanceDrawDecision: "pay",
        citySurveillanceProjectedCreditsPaid: 1,
        citySurveillanceProjectedTagsAdded: 0
      }
    );
    const tag = legalAction(
      "runner",
      "draw_card",
      "basic_action",
      "Karte ziehen (City Surveillance: 1 Tag nehmen)",
      {
        citySurveillanceSourceCount: 1,
        citySurveillanceDrawDecision: "tag",
        citySurveillanceProjectedCreditsPaid: 0,
        citySurveillanceProjectedTagsAdded: 1
      }
    );
    const plain = legalAction("runner", "draw_card", "basic_action", "Karte ziehen");

    expect(actionButtonLabel(pay)).toBe("Karte ziehen (City Surveillance: 1 Credit zahlen)");
    expect(actionButtonLabel(tag)).toBe("Karte ziehen (City Surveillance: 1 Tag nehmen)");
    expect(actionButtonLabel(plain)).toBe("Karte ziehen");
  });

  it("describes accessed Archive assets as already trashed instead of blocked by credits", () => {
    const accessedUpgrade = card("upgrade_1", "Dedicated Response Team", "upgrade");
    accessedUpgrade.trashCost = 2;
    const continueAccess = legalAction("runner", "decline_trash", "game_rule", "Weiter accessen", { cardId: accessedUpgrade.instanceId }, "access.resolve_card");

    expect(accessRevealStatusLabel(accessedUpgrade, [continueAccess], "runner", "runner", "Archive")).toContain("bereits im Archiv");
    expect(accessRevealStatusLabel(accessedUpgrade, [continueAccess], "runner", "runner", "Archive")).not.toContain("nicht genug Credits");
  });

  it("keeps the insufficient-credit access hint for installed assets and upgrades", () => {
    const accessedUpgrade = card("upgrade_1", "Dedicated Response Team", "upgrade");
    accessedUpgrade.trashCost = 2;
    const decline = legalAction("runner", "decline_trash", "game_rule", "Nicht trashen", { cardId: accessedUpgrade.instanceId }, "access.resolve_card");

    expect(accessRevealStatusLabel(accessedUpgrade, [decline], "runner", "runner", "Remote 1")).toBe("Du hast aktuell nicht genug Credits, um die Trash-Kosten zu bezahlen. Du kannst den Zugriff abschließen.");
  });

  it("retains the latest visible access reveal after later cleanup events until it is dismissed", () => {
    const hqReveal = publicEvent("evt_access", "action", {
      actionType: "access_card",
      actor: "runner",
      serverLabel: "HQ",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation"
    });
    const runCleanup = publicEvent("evt_cleanup", "action", {
      actionType: "continue_run",
      actor: "runner"
    });

    expect(retainedAccessRevealEvent([hqReveal, runCleanup], null)?.eventId).toBe("evt_access");
    expect(retainedAccessRevealEvent([hqReveal, runCleanup], "evt_access")).toBeNull();
  });

  it("retains a visible access reveal across turn end until it is dismissed", () => {
    const rdReveal = publicEvent("evt_access", "action", {
      actionType: "access_card",
      actor: "runner",
      serverLabel: "R&D",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation"
    });
    const runnerEndTurn = {
      ...publicEvent("evt_runner_end", "action", {
        actionType: "end_turn",
        actor: "runner"
      }),
      stateVersionAfter: 2
    };

    expect(retainedAccessRevealEvent([rdReveal, runnerEndTurn], null)?.eventId).toBe("evt_access");
    expect(retainedAccessRevealEvent([rdReveal, runnerEndTurn], "evt_access")).toBeNull();
  });

  it("does not retain an old access reveal after later turn and Corp action events", () => {
    const access = publicEvent("evt_access", "action", {
      actionType: "access_card",
      actor: "runner",
      serverLabel: "Remote 1",
      cardDefinitionId: "simple_agenda",
      title: "Simple Agenda"
    });
    const runnerEndTurn = {
      ...publicEvent("evt_runner_end", "action", {
        actionType: "end_turn",
        actor: "runner"
      }),
      stateVersionAfter: 2
    };
    const corpInstall = {
      ...publicEvent("evt_corp_install", "action", {
        actionType: "install_card",
        actor: "corp",
        serverLabel: "Remote 2"
      }),
      stateVersionAfter: 3
    };

    expect(retainedAccessRevealEvent([access, runnerEndTurn, corpInstall], null)).toBeNull();
  });

  it("does not fall back to an older visible reveal after a newer redacted access", () => {
    const visibleRemoteAccess = publicEvent("evt_remote_access", "action", {
      actionType: "access_card",
      actor: "runner",
      serverLabel: "Remote 1",
      cardDefinitionId: "simple_agenda",
      title: "Simple Agenda"
    });
    const redactedRdAccess = publicEvent("evt_rd_access", "action", {
      actionType: "access_card",
      actor: "runner",
      serverLabel: "R&D",
      redactedKind: "accessed_card"
    });

    expect(retainedAccessRevealEvent([visibleRemoteAccess, redactedRdAccess], null)).toBeNull();
  });

  it("retains access reveal across same-action public follow-up events", () => {
    const access = publicEvent("evt_access", "action", {
      actionType: "access_card",
      actor: "runner",
      serverLabel: "Remote 1",
      cardDefinitionId: "simple_ambush",
      title: "Simple Ambush"
    });
    const sameActionEffect = {
      ...publicEvent("evt_effect", "effect", {
        actionType: "net_damage",
        actor: "corp"
      }),
      stateVersionAfter: access.stateVersionAfter
    };

    expect(retainedAccessRevealEvent([access, sameActionEffect], null)?.eventId).toBe("evt_access");
  });

  it("does not retain redacted central-access events without the accessed card identity", () => {
    const redactedRdAccess = publicEvent("evt_access", "action", {
      actionType: "access_card",
      actor: "runner",
      serverLabel: "R&D",
      redactedKind: "accessed_card"
    });

    expect(retainedAccessRevealEvent([redactedRdAccess], null)).toBeNull();
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

function publicEvent(eventId: string, type: string, publicPayload: Record<string, unknown>): PublicGameEvent {
  return {
    eventId,
    type,
    stateVersionBefore: 0,
    stateVersionAfter: 1,
    stateHashAfter: `${eventId}_hash`,
    publicPayload
  };
}

function choice(side: Side): NonNullable<PlayerView["pendingChoice"]> {
  return {
    choiceId: "choice_1",
    side,
    source: "test",
    prompt: "Wählen",
    kind: "confirm",
    minSelections: 1,
    maxSelections: 1,
    stateVersion: 1,
    visibility: "public",
    options: []
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
