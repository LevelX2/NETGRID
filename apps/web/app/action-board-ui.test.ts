import { describe, expect, it, vi } from "vitest";
import type {
  LegalAction,
  PlayerView,
  PublicGameEvent,
  Side,
  VisibleCard,
} from "@netgrid/shared";
import {
  DEFAULT_CUE_POSITION,
  accessRevealStatusLabel,
  actionButtonLabel,
  actionButtonTone,
  actionConsumesClick,
  actionCostChips,
  actionMatchesContext,
  actionSlotCapacityForTurn,
  actionSlotDisplay,
  activeRunIceInstanceId,
  advancementCounterDisplay,
  approachIceExposeViewingIceId,
  aiPacingFallbackDelayMs,
  aiPacingDelayMs,
  armoredFridgeAblativeCounterBadge,
  automaticCorpMandatoryDrawAction,
  automaticEndTurnAction,
  breachHighlighterAccessHint,
  breachProgressLabel,
  cardChoiceIsReadonlyPrivateLook,
  cardChoiceReadonlyConfirmationOptionId,
  cardCreditCounterVisual,
  cardChoiceUsesOrderedSelection,
  cardChoiceUsesReadableCards,
  counterDisplayUsesCreditBadge,
  counterDisplayUsesRefreshingCreditBadge,
  counterDisplayBadgeView,
  counterDisplayTooltipText,
  counterDisplaysForRendering,
  clampCuePosition,
  contextualCardActionLabel,
  corpInstalledCardState,
  corpRootCardsForDisplay,
  fieldCardChoiceInfo,
  fieldCardChoiceOptionForCard,
  fieldCardChoiceOptionsForCard,
  installedCorpExposeReviewCardId,
  isInstalledCorpExposeReviewChoice,
  isSingleInstalledCorpExposeChoice,
  showInstalledCorpState,
  shouldUseFieldCardChoice,
  shouldUseCardChoicePanel,
  splitArchiveCardsForDisplay,
  currentRunTimelineStep,
  groupRunnerRigCards,
  hostedOnDetailLabel,
  iceModifierBadgesForServer,
  identityCounterChipsForDisplays,
  inactiveCardZoneAriaSuffix,
  inactiveCardZoneBadgeLabel,
  inactiveCardZoneClassName,
  latestRetainableAccessRevealEvent,
  isConcealedRunnerResourceCard,
  newBloodReorderTargetLabel,
  newBloodReorderTargetSequenceHint,
  orderedCardContextActions,
  parseCuePositionPreference,
  retainedAccessRevealEvent,
  retainedExposeReviewEvent,
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
  serverCounterChipsForDisplays,
  serverDisplayLabel,
  selectedSubtypeDetailLabel,
  selectedTargetDetailLabel,
  splitLegalActions,
  storedCreditAmount,
  storedCreditSourceLabel,
} from "./action-board-ui";

describe("V1.0.5 action board UI helpers", () => {
  it("formats persisted card state as readable card detail labels", () => {
    expect(selectedSubtypeDetailLabel({ selectedSubtypeLabel: "Sentry" })).toBe(
      "Gewählter Typ: Sentry",
    );
    expect(
      selectedTargetDetailLabel({
        selectedTargetLabel: "ICE auf R&D Position 1",
      }),
    ).toBe("Ziel-ICE: ICE auf R&D Position 1");
    expect(
      hostedOnDetailLabel({ hostedOnLabel: "Eurocorpse (TM) Spin Chip" }),
    ).toBe("Gehostet auf: Eurocorpse (TM) Spin Chip");
  });

  it("keeps global and decision actions in the main panel while card actions move to context", () => {
    const iceA = card("corp_ice_a", "Wall A", "ice");
    const iceB = card("corp_ice_b", "Wall B", "ice");
    const actions = [
      legalAction("corp", "gain_credit", "basic_action", "Credit nehmen"),
      legalAction("corp", "start_run", "basic_action", "Run auf R&D", {
        serverId: "rd",
      }),
      legalAction(
        "corp",
        "install_card",
        iceA.instanceId,
        "ICE vor HQ installieren",
        { cardId: iceA.instanceId, serverId: "hq", placement: "ice" },
      ),
      legalAction(
        "corp",
        "install_card",
        iceB.instanceId,
        "ICE vor HQ installieren",
        { cardId: iceB.instanceId, serverId: "hq", placement: "ice" },
      ),
      legalAction(
        "corp",
        "rez_ice",
        "corp_ice_installed",
        "Wall rezzen",
        { cardId: "corp_ice_installed" },
        "run.approach_ice",
      ),
    ];

    const split = splitLegalActions(actions);

    expect(split.primaryActions.map((action) => action.type)).toEqual([
      "gain_credit",
      "rez_ice",
    ]);
    expect(split.contextualActions.map((action) => action.source)).toEqual([
      "basic_action",
      iceA.instanceId,
      iceB.instanceId,
    ]);
    expect(
      split.contextualActions.filter((action) =>
        actionMatchesContext(action, {
          kind: "card",
          id: iceA.instanceId,
          label: iceA.title!,
        }),
      ),
    ).toHaveLength(1);
    expect(
      split.contextualActions.filter((action) =>
        actionMatchesContext(action, {
          kind: "server",
          id: "rd",
          label: "R&D",
        }),
      ),
    ).toHaveLength(1);
    expect(actionButtonLabel(actions[1]!)).toBe("Run auf R&D");
  });

  it("keeps All-Nighter bonus run choices visible in the main action panel", () => {
    const bonusRun = legalAction(
      "runner",
      "start_run",
      "basic_action",
      "Bonus-Run auf HQ",
      { serverId: "hq", bonusRunNoClick: true },
    );

    const split = splitLegalActions([bonusRun]);

    expect(split.primaryActions).toEqual([bonusRun]);
    expect(split.contextualActions).toEqual([]);
    expect(actionButtonLabel(bonusRun)).toBe("Bonus-Run auf HQ");
  });

  it("keeps Corp Spy-counter removal visible in the main action panel", () => {
    const removeSpyCounter = legalAction(
      "corp",
      "trigger_ability",
      "game_rule",
      "Spy-Counter in Remote 1 entfernen",
      {
        serverId: "remote_1",
        corpAbility: "remove_spy_counter",
        counterType: "spy",
        removedCounterAmount: 1,
      },
    );

    const split = splitLegalActions([removeSpyCounter]);

    expect(split.primaryActions).toEqual([removeSpyCounter]);
    expect(split.contextualActions).toEqual([]);
    expect(actionButtonLabel(removeSpyCounter)).toBe(
      "Spy-Counter in Remote 1 entfernen",
    );
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
        rezCostPaid: 2,
      },
      "run.approach_ice",
    );

    expect(actionButtonLabel(action)).toBe(
      "Olivia Salazar: Crystal Wall für 2 Credits rezzen",
    );
  });

  it("labels inactive heap and archive cards distinctly from installed card state", () => {
    expect(inactiveCardZoneBadgeLabel("heap")).toBe("Heap");
    expect(inactiveCardZoneBadgeLabel("archives")).toBe("Archiv");
    expect(inactiveCardZoneAriaSuffix("heap")).toBe(", im Heap abgelegt");
    expect(inactiveCardZoneAriaSuffix("archives")).toBe(", im Archiv abgelegt");
    expect(inactiveCardZoneClassName("heap")).toBe("inactiveZoneHeap");
    expect(inactiveCardZoneClassName("archives")).toBe("inactiveZoneArchives");
    expect(inactiveCardZoneClassName("heap")).not.toBe("unrezzedInstalled");
  });

  it("only offers automatic end turn when end turn is the sole remaining own action", () => {
    const board = view("corp", {
      activeSide: "corp",
      own: { ...view("corp").own, clicks: 0 },
    });
    const endTurn = legalAction("corp", "end_turn", "game_rule", "Zug beenden");
    const scoreAgenda = legalAction(
      "corp",
      "score_agenda",
      "agenda_1",
      "Agenda scoren",
      { cardId: "agenda_1" },
    );

    expect(automaticEndTurnAction(board, [endTurn], "corp")).toBe(endTurn);
    expect(
      automaticEndTurnAction(board, [endTurn], "corp", {
        accessRevealVisible: true,
      }),
    ).toBeUndefined();
    expect(
      automaticEndTurnAction(board, [endTurn, scoreAgenda], "corp"),
    ).toBeUndefined();
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
            options: [],
          },
        },
        [endTurn],
        "corp",
      ),
    ).toBeUndefined();
    expect(
      automaticEndTurnAction(
        { ...board, activeSide: "runner" },
        [endTurn],
        "corp",
      ),
    ).toBeUndefined();
  });

  it("only offers automatic Corp mandatory draw when no other Corp action is available", () => {
    const board = view("corp", { activeSide: "corp" });
    const mandatoryDraw = legalAction(
      "corp",
      "mandatory_draw",
      "game_rule",
      "Korp Pflichtkarte ziehen",
      {},
      "corp_draw.mandatory_draw",
    );
    const scoreAgenda = legalAction(
      "corp",
      "score_agenda",
      "agenda_1",
      "Agenda scoren",
      { cardId: "agenda_1" },
      "corp_draw.mandatory_draw",
    );
    const rezIce = legalAction(
      "corp",
      "rez_ice",
      "ice_1",
      "ICE rezzen",
      { cardId: "ice_1" },
      "corp_draw.mandatory_draw",
    );

    expect(
      automaticCorpMandatoryDrawAction(board, [mandatoryDraw], "corp"),
    ).toBe(mandatoryDraw);
    expect(
      automaticCorpMandatoryDrawAction(
        board,
        [mandatoryDraw, scoreAgenda],
        "corp",
      ),
    ).toBeUndefined();
    expect(
      automaticCorpMandatoryDrawAction(board, [mandatoryDraw, rezIce], "corp"),
    ).toBeUndefined();
    expect(
      automaticCorpMandatoryDrawAction(board, [mandatoryDraw], "runner"),
    ).toBeUndefined();
    expect(
      automaticCorpMandatoryDrawAction(
        { ...board, pendingChoice: choice("corp") },
        [mandatoryDraw],
        "corp",
      ),
    ).toBeUndefined();
  });

  it("maps RunTimeline state, active target and server labels without raw V1.0.5 labels", () => {
    const ice1 = card("ice_1", "Inner ICE", "ice");
    const ice2 = card("ice_2", "Middle ICE", "ice");
    const ice3 = card("ice_3", "Outer ICE", "ice");
    const running = view("runner", {
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [ice1, ice2, ice3], root: [] },
      ],
      run: {
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "ice", serverId: "rd", iceIndex: 2 },
        successful: false,
      },
    });

    expect(
      currentRunTimelineStep(running, [
        legalAction(
          "runner",
          "jack_out",
          "basic_action",
          "Jack out",
          undefined,
          "run.jack_out_window",
        ),
      ]),
    ).toBe("movement");
    expect(runTargetServerIds(running)).toEqual(["rd"]);
    expect(activeRunIceInstanceId(running)).toBe("ice_3");
    expect(runCurrentIceLabel(running)).toBe("ICE 3");
    expect(runPositionStatusLabel(running)).toBe(
      "Aktuell: vor ICE 3 (1 von 3)",
    );
    expect(runWindowStatusLabel(running)).toBe("ICE 3 (1 von 3)");
    expect(
      runAwareActionButtonLabel(
        running,
        legalAction(
          "runner",
          "jack_out",
          "game_rule",
          "Jack-out",
          undefined,
          "run.jack_out_window",
        ),
      ),
    ).toBe("Jack-out: an ICE 3 abbrechen");
    expect(
      runAwareActionButtonLabel(
        running,
        legalAction(
          "runner",
          "continue_run",
          "game_rule",
          "Run fortsetzen",
          undefined,
          "run.jack_out_window",
        ),
      ),
    ).toBe("Weiterlaufen: zu ICE 3");
    expect(serverDisplayLabel("rd")).toBe("R&D");
    expect(serverDisplayLabel("archives")).toBe("Archive");
    expect(serverDisplayLabel("remote_2")).toBe("Remote 2");
    expect(serverDisplayLabel("Remote 3")).toBe("Remote 3");
    expect(
      actionButtonLabel(
        legalAction(
          "corp",
          "advance_card",
          "basic_action",
          "Agenda in Remote 2 advancen",
        ),
      ),
    ).toBe("Installation ausbauen");
    expect(
      actionButtonLabel(
        legalAction(
          "runner",
          "continue_run",
          "game_rule",
          "Subroutinen auslösen (Run endet)",
          undefined,
          "run.encounter_ice",
        ),
      ),
    ).toBe("Subroutinen auslösen (Run endet)");
  });

  it("marks ICE in a server with rezzed Tesseract Fort Construction", () => {
    const tesseract = {
      ...card("tesseract_1", "Tesseract Fort Construction", "upgrade", true),
      definitionId: "onr_v1_370_tesseract-fort-construction",
    };
    const server = {
      id: "remote_1" as const,
      label: "Remote 1",
      ice: [card("ice_1", "Wall of Static", "ice")],
      root: [tesseract],
    };

    expect(iceModifierBadgesForServer(server)).toEqual([
      {
        key: "tesseract-additional-subroutine",
        shortLabel: "+Sub",
        ariaLabel:
          "Tesseract Fort Construction: zusätzliche Subroutine auf diesem ICE",
        tooltip: "Tesseract Fort Construction: zusätzliche Subroutine",
        testId: "tesseract-ice-subroutine-badge",
      },
    ]);
    expect(
      iceModifierBadgesForServer({
        ...server,
        root: [{ ...tesseract, rezzed: false }],
      }),
    ).toEqual([]);
    expect(
      iceModifierBadgesForServer({
        ...server,
        root: [{ ...tesseract, known: false }],
      }),
    ).toEqual([]);
  });

  it("keeps card-sourced gain-credit actions on their specific labels", () => {
    const basic = legalAction(
      "corp",
      "gain_credit",
      "basic_action",
      "1 Credit nehmen",
    );
    const privatePolice = legalAction(
      "corp",
      "gain_credit",
      "private_police_1",
      "Private Cybernet Police: Trace 5 starten",
      {
        cardId: "private_police_1",
        agendaAbility: "private_cybernet_police",
        traceStrength: 5,
      },
    );
    const seeya = legalAction(
      "runner",
      "gain_credit",
      "seeya_1",
      "SeeYa: Karte in HQ expose",
      {
        cardId: "seeya_1",
        serverId: "hq",
        v1911HiddenZoneAbility: "expose_server_card",
      },
    );

    const split = splitLegalActions([basic, privatePolice, seeya]);

    expect(split.primaryActions).toEqual([basic]);
    expect(split.contextualActions).toEqual([privatePolice, seeya]);
    expect(actionButtonLabel(basic)).toBe("Credit nehmen");
    expect(actionButtonLabel(privatePolice)).toBe(
      "Private Cybernet Police: Trace 5 starten",
    );
    expect(
      actionMatchesContext(seeya, {
        kind: "card",
        id: "seeya_1",
        label: "SeeYa",
      }),
    ).toBe(true);
    expect(contextualCardActionLabel(seeya)).toBe("Karte in HQ expose");
  });

  it("removes redundant installed asset names from card-context action labels", () => {
    const bbs = legalAction(
      "corp",
      "gain_credit",
      "bbs_1",
      "BBS Whispering Campaign: 2 Credits",
      {
        cardId: "bbs_1",
        v1917AssetAbility: "gain_credits",
        gainCreditsAmount: 2,
      },
    );
    const bloodCat = legalAction(
      "corp",
      "gain_credit",
      "blood_cat_1",
      "Blood Cat: Trace 5 starten",
      {
        cardId: "blood_cat_1",
        v1917AssetAbility: "trace_3_tag",
        traceStrength: 5,
      },
    );
    const southAfrican = legalAction(
      "corp",
      "gain_credit",
      "south_african_1",
      "South African Mining Corp: 6 Credits und trashen",
      {
        cardId: "south_african_1",
        v1920AssetAbility: "south_african_mining_corp_gain_6_trash",
        gainCreditsAmount: 6,
      },
    );
    const trashNode = legalAction(
      "runner",
      "trash_accessed_card",
      "node_1",
      "South African Mining Corp trashen",
      {
        accessedCardId: "node_1",
      },
    );

    expect(actionButtonLabel(bbs)).toBe("BBS Whispering Campaign: 2 Credits");
    expect(contextualCardActionLabel(bbs)).toBe("2 Credits");
    expect(contextualCardActionLabel(bloodCat)).toBe("Trace 5 starten");
    expect(actionButtonLabel(southAfrican)).toBe(
      "South African Mining Corp: 6 Credits und trashen",
    );
    expect(contextualCardActionLabel(southAfrican)).toBe("6 Credits nehmen");
    expect(contextualCardActionLabel(trashNode)).toBe("Trashen");
  });

  it("uses compact labels for scored agenda credit actions in card context", () => {
    const corporateCoup = legalAction(
      "corp",
      "gain_credit",
      "coup_1",
      "Corporate Coup: 3 Credits aus Coup-Counter",
      {
        cardId: "coup_1",
        agendaAbility: "corporate_coup",
        gainCreditsAmount: 3,
        removePowerCounterAmount: 3,
      },
    );

    expect(actionButtonLabel(corporateCoup)).toBe(
      "Corporate Coup: 3 Credits aus Coup-Counter",
    );
    expect(contextualCardActionLabel(corporateCoup)).toBe("3 Credits nehmen");
  });

  it("drops the card-name prefix for V1.9.11 hidden-zone card menu actions", () => {
    const aujourdOui = legalAction(
      "runner",
      "gain_credit",
      "aujourdoui_1",
      "Aujourd'Oui: Top 5 nach Programmen prüfen",
      {
        cardId: "aujourdoui_1",
        v1911HiddenZoneAbility: "search_stack_program_to_grip",
      },
    );

    expect(actionButtonLabel(aujourdOui)).toBe(
      "Aujourd'Oui: Top 5 nach Programmen prüfen",
    );
    expect(contextualCardActionLabel(aujourdOui)).toBe(
      "Top 5 nach Programmen prüfen",
    );
  });

  it("labels encounter breaker actions against the current ICE", () => {
    const encounteredIce = card("ice_2", "Data Wall", "ice");
    const running = view("runner", {
      servers: [
        {
          id: "hq",
          label: "HQ",
          ice: [card("ice_1", "Inner ICE", "ice"), encounteredIce],
          root: [],
        },
      ],
      run: {
        attackedServerId: "hq",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "hq", iceIndex: 1 },
        encounteredIce,
        successful: false,
      },
    });
    const pump = legalAction(
      "runner",
      "pump_breaker",
      "breaker_1",
      "Replicator: Stärke +1",
      { breakerId: "breaker_1", iceId: "ice_2" },
      "run.encounter_ice",
    );
    const passIce = legalAction(
      "runner",
      "continue_run",
      "game_rule",
      "ICE passieren",
      { encounterContinue: true, unbrokenSubroutineCount: 0 },
      "run.encounter_ice",
    );

    expect(runPositionStatusLabel(running)).toBe(
      "Aktuell: Begegnung mit ICE 2 (1 von 2)",
    );
    expect(runWindowStatusLabel(running)).toBe("ICE 2 (1 von 2)");
    expect(runAwareActionButtonLabel(running, pump)).toBe(
      "Stärke +1 (Replicator) gegen Data Wall (ICE 2)",
    );
    expect(runAwareActionButtonLabel(running, passIce)).toBe("ICE 2 passieren");
  });

  it("marks voluntary run aborts and unnecessary breaker pumps with action tones", () => {
    const decoder = {
      ...card("breaker_1", "Simple Decoder", "program"),
      subtypes: ["icebreaker"],
      rulesText:
        "1 Credit: Break code gate subroutine.\n1 Credit: +1 strength.",
      strength: 3,
    } satisfies VisibleCard;
    const underStrengthDecoder = {
      ...decoder,
      strength: 2,
    } satisfies VisibleCard;
    const encounteredIce = {
      ...card("ice_1", "Data Wall", "ice"),
      subtypes: ["code_gate"],
      strength: 3,
    } satisfies VisibleCard;
    const running = view("runner", {
      activeSide: "runner",
      phase: "run",
      timingPoint: "run.encounter_ice",
      own: {
        ...view("runner").own,
        rig: [decoder],
      },
      run: {
        attackedServerId: "rd",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "rd", iceIndex: 0 },
        encounteredIce,
        successful: false,
      },
    });
    const underStrengthRunning = {
      ...running,
      own: {
        ...running.own,
        rig: [underStrengthDecoder],
      },
    } satisfies PlayerView;
    const jackOut = legalAction(
      "runner",
      "jack_out",
      "game_rule",
      "Jack-out",
      undefined,
      "run.jack_out_window",
    );
    const continueRun = legalAction(
      "runner",
      "continue_run",
      "game_rule",
      "Subroutinen auslösen (Run endet)",
      undefined,
      "run.encounter_ice",
    );
    const pump = legalAction(
      "runner",
      "pump_breaker",
      "breaker_1",
      "Simple Decoder: Stärke +1",
      { breakerId: "breaker_1", iceId: "ice_1" },
      "run.encounter_ice",
    );

    expect(actionButtonTone(running, jackOut)).toBe("danger");
    expect(actionButtonTone(running, continueRun)).toBe("default");
    expect(actionButtonTone(running, pump)).toBe("warning");
    expect(actionButtonTone(underStrengthRunning, pump)).toBe("default");
  });

  it("keeps breaker actions on the breaker card, not the encountered ICE", () => {
    const pump = legalAction(
      "runner",
      "pump_breaker",
      "breaker_1",
      "Simple Decoder: Stärke +1",
      { breakerId: "breaker_1", iceId: "ice_1" },
      "run.encounter_ice",
    );
    pump.targetRequirements = [
      { id: "encountered_ice", kind: "card", sourceIceRef: "ice_1" },
    ];

    expect(
      actionMatchesContext(pump, {
        kind: "card",
        id: "breaker_1",
        label: "Simple Decoder",
      }),
    ).toBe(true);
    expect(
      actionMatchesContext(pump, {
        kind: "card",
        id: "ice_1",
        label: "Fetch 4.0.1",
      }),
    ).toBe(false);
  });

  it("places main-phase rez actions for installed upgrades on the card context", () => {
    const upgradeRez = legalAction(
      "corp",
      "rez_ice",
      "game_rule",
      "Karte in Remote 1 rezzen",
      { cardId: "upgrade_1", serverId: "remote_1" },
    );
    const runIceRez = legalAction(
      "corp",
      "rez_ice",
      "game_rule",
      "ICE rezzen",
      { cardId: "ice_1", serverId: "remote_1" },
      "run.approach_ice",
    );

    const split = splitLegalActions([upgradeRez, runIceRez]);

    expect(split.contextualActions).toEqual([upgradeRez]);
    expect(split.primaryActions).toEqual([runIceRez]);
    expect(
      actionMatchesContext(upgradeRez, {
        kind: "card",
        id: "upgrade_1",
        label: "Tesseract Fort Construction",
      }),
    ).toBe(true);
    expect(contextualCardActionLabel(upgradeRez)).toBe("Rezzen");
  });

  it("shows access progress only from PlayerView breach data", () => {
    const firstAccess = view("runner", {
      run: {
        attackedServerId: "hq",
        phase: "access",
        successful: true,
        breach: {
          breachId: "breach_1",
          serverId: "hq",
          currentIndex: 0,
          remainingCount: 2,
          completed: false,
        },
      },
    });
    const secondAccess = view("runner", {
      run: {
        attackedServerId: "hq",
        phase: "access",
        successful: true,
        breach: {
          breachId: "breach_1",
          serverId: "hq",
          currentIndex: 1,
          remainingCount: 1,
          completed: false,
        },
      },
    });

    expect(currentRunTimelineStep(secondAccess, [])).toBe("access");
    expect(breachProgressLabel(firstAccess)).toBe("Zugriff 1 von 2");
    expect(breachProgressLabel(secondAccess)).toBe("Zugriff 2 von 2");
  });

  it("explains additional R&D accesses from Highlighter counters", () => {
    const corpIdentity = {
      ...card("corp_identity", "Korp Identity", "identity"),
      counterDisplays: [
        {
          id: "runner_virus_corp_highlighter",
          amount: 3,
          displayKind: "virus",
          label: "Highlighter-Counter",
          ariaLabel: "3 Highlighter-Counter",
          counterType: "highlighter",
          usageHint: "status_marker",
        },
      ],
    } satisfies VisibleCard;
    const secondAccess = view("runner", {
      opponent: {
        ...view("runner").opponent,
        identity: corpIdentity,
      },
      run: {
        attackedServerId: "rd",
        phase: "access",
        successful: true,
        breach: {
          breachId: "breach_1",
          serverId: "rd",
          currentIndex: 1,
          remainingCount: 2,
          completed: false,
        },
      },
    });

    expect(breachHighlighterAccessHint(secondAccess)).toBe(
      "Zusätzlicher R&D-Zugriff 2 von 3: Die Korp hat 3 Highlighter-Counter.",
    );
  });

  it("groups public Runner rig cards without implying hidden cards", () => {
    const groups = groupRunnerRigCards([
      card("program_1", "Program", "program"),
      card("hardware_1", "Hardware", "hardware"),
      card("resource_1", "Resource", "resource"),
    ]);

    expect(groups.map((group) => group.label)).toEqual([
      "Programme",
      "Hardware",
      "Ressourcen",
    ]);
    expect(
      groups.flatMap((group) => group.cards.map((entry) => entry.instanceId)),
    ).toEqual(["program_1", "hardware_1", "resource_1"]);
  });

  it("can keep the Runner program group visible for an empty MU display", () => {
    const defaultGroups = groupRunnerRigCards([]);
    const visibleProgramGroups = groupRunnerRigCards([], {
      includeEmptyProgramGroup: true,
    });

    expect(defaultGroups).toEqual([]);
    expect(visibleProgramGroups).toEqual([
      { key: "program", label: "Programme", cards: [] },
    ]);
  });

  it("summarizes public Runner MU for the Corp rig view", () => {
    const corpView = view("corp", {
      opponent: {
        ...view("corp").opponent,
        rig: [
          card("killer_1", "Simple Killer", "program"),
          card("chip_1", "Memory Chip", "hardware"),
        ],
        memoryUsed: 2,
        memoryLimit: 4,
      },
    });

    expect(runnerRigMemorySummary(corpView, "opponent")).toEqual({
      used: 2,
      limit: 4,
      text: "2/4",
      ariaLabel: "MU 2 von 4",
    });

    const updatedCorpView = view("corp", {
      opponent: {
        ...corpView.opponent,
        rig: [card("killer_1", "Simple Killer", "program")],
        memoryUsed: 1,
      },
    });

    expect(runnerRigMemorySummary(updatedCorpView, "opponent")?.text).toBe(
      "1/4",
    );
  });

  it("keeps Corp installed rez state side-safe", () => {
    expect(
      corpInstalledCardState({
        instanceId: "hidden_ice",
        known: false,
        rezzed: false,
      }),
    ).toBe("hidden");
    expect(corpInstalledCardState(card("corp_ice", "Wall", "ice", false))).toBe(
      "unrezzed",
    );
    expect(
      corpInstalledCardState(card("rezzed_ice", "Wall", "ice", true)),
    ).toBe("rezzed");
  });

  it("identifies concealed Runner hidden-resource cards for board rendering", () => {
    expect(
      isConcealedRunnerResourceCard({
        concealed: true,
        hiddenRunnerResource: true,
        type: "resource",
        subtypes: ["hidden"],
      }),
    ).toBe(true);
    expect(
      isConcealedRunnerResourceCard({
        concealed: true,
        type: "resource",
        subtypes: ["hidden_runner_resource"],
      }),
    ).toBe(true);
    expect(
      isConcealedRunnerResourceCard({
        concealed: false,
        hiddenRunnerResource: true,
        type: "resource",
        subtypes: ["hidden"],
      }),
    ).toBe(false);
    expect(
      isConcealedRunnerResourceCard({
        concealed: true,
        type: "resource",
        subtypes: ["connection"],
      }),
    ).toBe(false);
  });

  it("shows installed state only for installed corp lanes, not Archives root cards", () => {
    expect(showInstalledCorpState("archives", "root")).toBe(false);
    expect(showInstalledCorpState("archives", "ice")).toBe(true);
    expect(showInstalledCorpState("hq", "root")).toBe(true);
    expect(showInstalledCorpState("remote_1", "root")).toBe(true);
  });

  it("renders opponent remote root cards in install order without leaked hidden root types", () => {
    const leakedUpgradeA: VisibleCard = {
      instanceId: "upgrade_a",
      known: false,
      rezzed: false,
      title: "Simple Upgrade",
      definitionId: "simple_upgrade",
      type: "upgrade",
      trashCost: 4,
    };
    const rezzedNode = card("node_1", "Simple Economy Asset", "asset", true);
    const exposedUnrezzedUpgrade = card(
      "exposed_upgrade",
      "Simple Upgrade",
      "upgrade",
      false,
    );
    const leakedUpgradeB: VisibleCard = {
      instanceId: "upgrade_b",
      known: false,
      rezzed: false,
      title: "Simple Upgrade",
      definitionId: "simple_upgrade",
      type: "upgrade",
      trashCost: 4,
    };

    const runnerCards = corpRootCardsForDisplay("runner", "remote_1", [
      leakedUpgradeA,
      rezzedNode,
      exposedUnrezzedUpgrade,
      leakedUpgradeB,
    ]);

    expect(runnerCards.map((entry) => entry.instanceId)).toEqual([
      "upgrade_a",
      "node_1",
      "exposed_upgrade",
      "upgrade_b",
    ]);
    expect(runnerCards[1]).toMatchObject({
      known: true,
      title: "Simple Economy Asset",
      definitionId: "node_1",
      type: "asset",
      rezzed: true,
    });
    expect(runnerCards[2]).toMatchObject({
      known: true,
      title: "Simple Upgrade",
      definitionId: "exposed_upgrade",
      type: "upgrade",
      rezzed: false,
    });
    expect(corpInstalledCardState(runnerCards[2]!)).toBe("unrezzed");
    for (const hiddenCard of [runnerCards[0], runnerCards[3]]) {
      expect(hiddenCard).toMatchObject({ known: false, rezzed: false });
      expect(hiddenCard).not.toHaveProperty("title");
      expect(hiddenCard).not.toHaveProperty("definitionId");
      expect(hiddenCard).not.toHaveProperty("type");
      expect(hiddenCard).not.toHaveProperty("trashCost");
    }

    expect(
      corpRootCardsForDisplay("corp", "remote_1", [leakedUpgradeA]),
    ).toEqual([leakedUpgradeA]);
  });

  it("splits archives into faceup and facedown stacks for runner and corp views", () => {
    const faceupA = card("archive_a", "Faceup A", "asset", true);
    const faceupB = card("archive_b", "Faceup B", "operation", true);
    const facedown = card("archive_c", "Facedown C", "agenda", false);

    const runnerSplit = splitArchiveCardsForDisplay(
      "runner",
      [faceupA, faceupB],
      3,
    );
    expect(runnerSplit.faceupCards.map((entry) => entry.instanceId)).toEqual([
      "archive_a",
      "archive_b",
    ]);
    expect(runnerSplit.facedownCards).toEqual([]);
    expect(runnerSplit.facedownCount).toBe(1);

    const corpSplit = splitArchiveCardsForDisplay(
      "corp",
      [faceupA, facedown, faceupB],
      3,
    );
    expect(corpSplit.faceupCards.map((entry) => entry.instanceId)).toEqual([
      "archive_a",
      "archive_b",
    ]);
    expect(corpSplit.facedownCards.map((entry) => entry.instanceId)).toEqual([
      "archive_c",
    ]);
    expect(corpSplit.facedownCount).toBe(1);
  });
  it("keeps cue position local, resettable and clamped", () => {
    expect(parseCuePositionPreference(null)).toEqual(DEFAULT_CUE_POSITION);
    expect(
      parseCuePositionPreference(
        JSON.stringify({ kind: "preset", preset: "center" }),
      ),
    ).toEqual({ kind: "preset", preset: "center" });
    expect(parseCuePositionPreference("{bad json")).toEqual(
      DEFAULT_CUE_POSITION,
    );
    expect(clampCuePosition(98, 98, 400, 300, 180, 120)).toEqual({
      kind: "custom",
      xPercent: 52,
      yPercent: 56,
    });
  });

  it("orders server rows by viewer side perspective", () => {
    const servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      { id: "archives", label: "Archives", ice: [], root: [] },
      { id: "remote_2", label: "Remote 2", ice: [], root: [] },
      { id: "remote_1", label: "Remote 1", ice: [], root: [] },
    ];

    expect(
      serverBoardRows(servers, "runner").map((row) => [
        row.kind,
        row.servers.map((server) => server.id),
      ]),
    ).toEqual([
      ["centrals", ["hq", "rd", "archives"]],
      ["remotes", ["remote_1", "remote_2"]],
    ]);

    expect(
      serverBoardRows(servers, "corp").map((row) => [
        row.kind,
        row.servers.map((server) => server.id),
      ]),
    ).toEqual([
      ["remotes", ["remote_1", "remote_2"]],
      ["centrals", ["hq", "rd", "archives"]],
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
        { id: "card_b", label: "Karte B", value: "b" },
      ],
      minSelections: 0,
      maxSelections: 2,
      stateVersion: 1,
      visibility: "hidden_info_barrier",
    };
    const exactSingleChoice: NonNullable<PlayerView["pendingChoice"]> = {
      ...organDonorChoice,
      choiceId: "single_card_choice",
      minSelections: 1,
      maxSelections: 1,
    };
    const forgottenBackupChoice: NonNullable<PlayerView["pendingChoice"]> = {
      ...exactSingleChoice,
      choiceId: "v1911_search_stack_7",
      source: "v1911.search_stack:7",
      prompt: "Stack durchsuchen",
    };
    const heapSearchChoice: NonNullable<PlayerView["pendingChoice"]> = {
      ...exactSingleChoice,
      choiceId: "p3_37_search_trash_to_grip_7",
      source:
        "p3_37.search_trash_to_grip:source:onr_v1_087_forgotten-backup-chip:program:7",
      prompt: "Heap durchsuchen",
      cardSearchPresentation: {
        sourceZone: "heap",
        selectableFilter: "program",
        reveal: "hidden",
        destination: "grip",
        shuffleAfter: false,
        showNonMatchingCards: true,
      },
    };
    const offSiteBackupsChoice: NonNullable<PlayerView["pendingChoice"]> = {
      ...exactSingleChoice,
      choiceId: "v1922_corp_archives_to_hq_7",
      side: "corp",
      source: "v1922.corp_archives_to_hq:onr_v1_296_off-site-backups_1:7",
      prompt: "Archives-Karte nach HQ nehmen",
      options: [
        {
          id: "card_archives_1",
          label: "Archived Agenda",
          value: "corp_archives_1",
        },
      ],
    };
    const stackTopFiveChoice: NonNullable<PlayerView["pendingChoice"]> = {
      ...organDonorChoice,
      choiceId: "p3_37_runner_stack_top5_7",
      source: "p3_37.runner_stack_top5_choose_one_arrange_rest:source:7",
      prompt: "Stack-Spitze wählen und anordnen",
      options: [
        {
          id: "card_stack_a",
          label: "Stack A",
          value: "stack_a",
          card: card("stack_a", "Stack A", "program"),
        },
        {
          id: "card_stack_b",
          label: "Stack B",
          value: "stack_b",
          card: card("stack_b", "Stack B", "event"),
        },
      ],
      minSelections: 2,
      maxSelections: 2,
    };
    const technicianPrivateLookChoice: NonNullable<
      PlayerView["pendingChoice"]
    > = {
      ...exactSingleChoice,
      choiceId: "p3_33_private_look_rd_7",
      source: "p3_33.private_look:ability:runner_resource_1:rd:7",
      prompt: "R&D ansehen (1)",
      options: [
        {
          id: "card_corp_rd_1",
          label: "Agenda",
          value: "corp_rd_1",
          selectable: false,
          card: card("corp_rd_1", "Agenda", "agenda", false),
        },
        { id: "done", label: "Fertig", value: "done" },
      ],
    };
    const protocolFilesPrivateLookChoice: NonNullable<
      PlayerView["pendingChoice"]
    > = {
      ...technicianPrivateLookChoice,
      choiceId: "p3_33_private_look_rd_9",
      prompt: "R&D ansehen (2)",
      options: [
        ...technicianPrivateLookChoice.options.slice(0, 1),
        {
          id: "card_corp_rd_2",
          label: "ICE",
          value: "corp_rd_2",
          selectable: false,
          card: card("corp_rd_2", "ICE", "ice", false),
        },
        { id: "done", label: "Fertig", value: "done" },
      ],
    };
    const mysteryBoxCorpReviewChoice: NonNullable<PlayerView["pendingChoice"]> =
      {
        ...technicianPrivateLookChoice,
        choiceId: "p3_38_mystery_box_corp_review_7",
        side: "corp",
        source:
          "p3_38.mystery_box_corp_review:mystery_box:onr_v1_043_mystery-box:stack_a,stack_b:7",
        prompt: "Mystery Box: Stack-Spitze ansehen",
        options: [
          {
            id: "shown_stack_a",
            label: "Stack A",
            value: "stack_a",
            selectable: false,
            card: card("stack_a", "Stack A", "program"),
          },
          {
            id: "shown_stack_b",
            label: "Stack B",
            value: "stack_b",
            selectable: false,
            card: card("stack_b", "Stack B", "event"),
          },
          { id: "done", label: "Gesehen", value: "done" },
        ],
        cardSearchPresentation: {
          sourceZone: "stack",
          selectableFilter: "matching_cards",
          reveal: "public",
          destination: "install_program",
          shuffleAfter: true,
          publicRevealKind: "reveal",
          showNonMatchingCards: true,
        },
      };

    expect(shouldUseCardChoicePanel(organDonorChoice)).toBe(true);
    expect(shouldUseCardChoicePanel(exactSingleChoice)).toBe(false);
    expect(shouldUseCardChoicePanel(forgottenBackupChoice)).toBe(true);
    expect(shouldUseCardChoicePanel(heapSearchChoice)).toBe(true);
    expect(shouldUseCardChoicePanel(offSiteBackupsChoice)).toBe(true);
    expect(shouldUseCardChoicePanel(stackTopFiveChoice)).toBe(true);
    expect(shouldUseCardChoicePanel(technicianPrivateLookChoice)).toBe(true);
    expect(shouldUseCardChoicePanel(protocolFilesPrivateLookChoice)).toBe(true);
    expect(shouldUseCardChoicePanel(mysteryBoxCorpReviewChoice)).toBe(true);
    expect(cardChoiceUsesReadableCards(organDonorChoice)).toBe(false);
    expect(cardChoiceUsesReadableCards(forgottenBackupChoice)).toBe(true);
    expect(cardChoiceUsesReadableCards(heapSearchChoice)).toBe(true);
    expect(cardChoiceUsesReadableCards(stackTopFiveChoice)).toBe(true);
    expect(cardChoiceUsesReadableCards(technicianPrivateLookChoice)).toBe(true);
    expect(cardChoiceUsesReadableCards(mysteryBoxCorpReviewChoice)).toBe(true);
    expect(cardChoiceIsReadonlyPrivateLook(technicianPrivateLookChoice)).toBe(
      true,
    );
    expect(
      cardChoiceIsReadonlyPrivateLook(protocolFilesPrivateLookChoice),
    ).toBe(true);
    expect(cardChoiceIsReadonlyPrivateLook(mysteryBoxCorpReviewChoice)).toBe(
      true,
    );
    expect(
      cardChoiceReadonlyConfirmationOptionId(technicianPrivateLookChoice),
    ).toBe("done");
    expect(
      cardChoiceReadonlyConfirmationOptionId(mysteryBoxCorpReviewChoice),
    ).toBe("done");
    expect(cardChoiceUsesOrderedSelection(stackTopFiveChoice)).toBe(true);
    expect(cardChoiceUsesOrderedSelection(organDonorChoice)).toBe(false);
  });

  it("derives explicit target slots for New Blood ordered ICE choices", () => {
    const newBloodChoice: NonNullable<PlayerView["pendingChoice"]> = {
      choiceId: "p3_58_new_blood_reorder_7",
      side: "corp",
      source: "p3_58.new_blood_reorder:new_blood_1:7",
      prompt: "Installierte ICE neu anordnen.",
      kind: "select_cards",
      options: [
        {
          id: "card_hq_ice",
          label: "Quandary (HQ ICE 1)",
          publicLabel: "HQ ICE 1",
          value: "hq_ice",
        },
        {
          id: "card_rd_ice",
          label: "Data Wall (R&D ICE 1)",
          publicLabel: "R&D ICE 1",
          value: "rd_ice",
        },
        {
          id: "card_remote_ice",
          label: "Iceberg (Remote 1 ICE 1)",
          value: "remote_ice",
        },
      ],
      minSelections: 3,
      maxSelections: 3,
      stateVersion: 7,
      visibility: "hidden_info_barrier",
    };

    expect(shouldUseCardChoicePanel(newBloodChoice)).toBe(true);
    expect(cardChoiceUsesOrderedSelection(newBloodChoice)).toBe(true);
    expect(cardChoiceUsesReadableCards(newBloodChoice)).toBe(false);
    expect(newBloodReorderTargetLabel(newBloodChoice, 0)).toBe("HQ ICE 1");
    expect(newBloodReorderTargetLabel(newBloodChoice, 1)).toBe("R&D ICE 1");
    expect(newBloodReorderTargetLabel(newBloodChoice, 2)).toBe(
      "Remote 1 ICE 1",
    );
    expect(newBloodReorderTargetSequenceHint(newBloodChoice)).toBe(
      "Wähle die ICE in Zielslot-Reihenfolge: HQ ICE 1 -> R&D ICE 1 -> Remote 1 ICE 1.",
    );
  });

  it("detects field-card choices for installed board cards only", () => {
    const bbs = card("corp_bbs_1", "BBS Whispering Campaign", "asset", false);
    const ice = card("corp_ice_1", "Wall", "ice", false);
    const ice2 = card("corp_ice_2", "Barrier", "ice", false);
    const runnerProgram = card("runner_program_1", "Virus Program", "program");
    const board = view("runner", {
      own: {
        ...view("runner").own,
        rig: [runnerProgram],
      },
      servers: [
        { id: "remote_1", label: "Remote 1", ice: [ice, ice2], root: [bbs] },
      ],
    });
    const fieldChoice: NonNullable<PlayerView["pendingChoice"]> = {
      choiceId: "hunt_club_bbs_choice",
      side: "runner",
      source: "v1912.hunt_club_bbs_expose:bbs:1",
      prompt: "Installierte Korp-Karten ansehen",
      kind: "select_cards",
      options: [
        { id: "card_bbs", label: "Remote 1 Root", value: "corp_bbs_1" },
        { id: "card_ice", label: "Remote 1 ICE", value: "corp_ice_1" },
      ],
      minSelections: 0,
      maxSelections: 3,
      stateVersion: 1,
      visibility: "hidden_info_barrier",
    };
    const handChoice: NonNullable<PlayerView["pendingChoice"]> = {
      ...fieldChoice,
      choiceId: "grip_choice",
      source: "v1922.runner_grip_trash_gain_credits:organ_donor:1",
      options: [
        { id: "card_hand", label: "Grip-Karte", value: "runner_hand_1" },
      ],
    };
    const stackChoice: NonNullable<PlayerView["pendingChoice"]> = {
      ...fieldChoice,
      choiceId: "stack_choice",
      source: "v1911.search_stack:1",
      stackSearchResolution: {
        reveal: "hidden",
        destination: "grip",
        shuffleAfter: true,
      },
    };
    const runnerRigChoice: NonNullable<PlayerView["pendingChoice"]> = {
      ...fieldChoice,
      choiceId: "viral_15_choice",
      source: "v1922.viral_15_program_trash:virus:1",
      prompt: "Installiertes Runner-Programm wählen",
      options: [
        {
          id: "card_runner_program",
          label: "Runner-Programm",
          value: "runner_program_1",
        },
      ],
      minSelections: 1,
      maxSelections: 1,
    };
    const singleExposeChoice: NonNullable<PlayerView["pendingChoice"]> = {
      ...fieldChoice,
      choiceId: "seeya_expose_choice",
      source:
        "p3_36.expose_installed_card:seeya_1:onr_v1_058_seeya:any_installed:1",
      prompt: "Installierte Korp-Karte exposen",
      options: [
        { id: "card_corp_bbs_1", label: "Remote 1 Root 1" },
        { id: "card_corp_ice_1", label: "Remote 1 ICE 1" },
      ],
      minSelections: 1,
      maxSelections: 1,
    };
    const hiddenSlot = { ...ice, instanceId: "hidden_ice_slot", known: false };
    const hiddenSlotBoard = view("runner", {
      servers: [
        { id: "remote_1", label: "Remote 1", ice: [hiddenSlot], root: [] },
      ],
    });
    const hiddenSlotSingleExposeChoice: NonNullable<
      PlayerView["pendingChoice"]
    > = {
      ...singleExposeChoice,
      options: [{ id: "card_hidden_ice_slot", label: "Remote 1 ICE 1" }],
    };
    const reviewChoice: NonNullable<PlayerView["pendingChoice"]> = {
      choiceId: "seeya_expose_review",
      side: "runner",
      source:
        "p3_36.expose_installed_card_review:corp_ice_1:seeya_1:onr_v1_058_seeya:any_installed:2",
      prompt: "Karte ansehen",
      kind: "select_option",
      options: [{ id: "done", label: "Ansehen beenden", value: "done" }],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 2,
      visibility: "hidden_info_barrier",
    };
    const offSiteArchiveChoice: NonNullable<PlayerView["pendingChoice"]> = {
      ...fieldChoice,
      choiceId: "v1922_corp_archives_to_hq_7",
      side: "corp",
      source: "v1922.corp_archives_to_hq:onr_v1_296_off-site-backups_1:7",
      prompt: "Archives-Karte nach HQ nehmen",
      options: [
        {
          id: "card_archived_agenda",
          label: "Archived Agenda",
          value: "corp_archive_1",
        },
      ],
      minSelections: 1,
      maxSelections: 1,
    };
    const hermanChoice: NonNullable<PlayerView["pendingChoice"]> = {
      ...fieldChoice,
      choiceId: "fort_ice_reorder_7",
      side: "corp",
      source:
        "corp.start_of_run_redirect.herman_reorder:run_1:herman_1:remote_1",
      prompt: "Wähle die ICE in der neuen Reihenfolge vor diesem Server.",
      options: [
        { id: "card_corp_ice_1", label: "Wall", value: "corp_ice_1" },
        { id: "card_corp_ice_2", label: "Barrier", value: "corp_ice_2" },
      ],
      minSelections: 2,
      maxSelections: 2,
    };
    const corpArchivesBoard = view("corp", {
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        {
          id: "archives",
          label: "Archive",
          ice: [],
          root: [card("corp_archive_1", "Archived Agenda", "agenda", false)],
        },
      ],
    });

    expect(shouldUseFieldCardChoice(fieldChoice, board)).toBe(true);
    expect(shouldUseFieldCardChoice(runnerRigChoice, board)).toBe(true);
    expect(shouldUseFieldCardChoice(singleExposeChoice, board)).toBe(true);
    expect(
      shouldUseFieldCardChoice(hiddenSlotSingleExposeChoice, hiddenSlotBoard),
    ).toBe(true);
    expect(isSingleInstalledCorpExposeChoice(singleExposeChoice)).toBe(true);
    expect(isInstalledCorpExposeReviewChoice(reviewChoice)).toBe(true);
    expect(installedCorpExposeReviewCardId(reviewChoice)).toBe("corp_ice_1");
    expect(shouldUseCardChoicePanel(fieldChoice)).toBe(true);
    expect(shouldUseCardChoicePanel(singleExposeChoice)).toBe(false);
    expect(fieldCardChoiceOptionForCard(fieldChoice, board, bbs)?.id).toBe(
      "card_bbs",
    );
    expect(
      fieldCardChoiceOptionForCard(fieldChoice, board, runnerProgram),
    ).toBeNull();
    expect(
      fieldCardChoiceOptionForCard(runnerRigChoice, board, runnerProgram)?.id,
    ).toBe("card_runner_program");
    const multiCreditRunnerRigChoice: NonNullable<PlayerView["pendingChoice"]> =
      {
        ...runnerRigChoice,
        choiceId: "pile_driver_stealth_loss",
        source: "runner.noisy_breaker_stealth_loss:pile_driver:1",
        prompt: "Wähle 3 Credits von Stealth-Karten.",
        options: [
          {
            id: "stealth_runner_program_1",
            label: "Raven Microcyb Owl: 1 Stealth-Credit verlieren",
            value: "runner_program_1",
          },
          {
            id: "stealth_runner_program_2",
            label: "Raven Microcyb Owl: 1 Stealth-Credit verlieren",
            value: "runner_program_1",
          },
          {
            id: "stealth_runner_program_3",
            label: "Raven Microcyb Owl: 1 Stealth-Credit verlieren",
            value: "runner_program_1",
          },
        ],
        minSelections: 3,
        maxSelections: 3,
      };
    expect(
      fieldCardChoiceOptionsForCard(
        multiCreditRunnerRigChoice,
        board,
        runnerProgram,
      ).map((option) => option.id),
    ).toEqual([
      "stealth_runner_program_1",
      "stealth_runner_program_2",
      "stealth_runner_program_3",
    ]);
    expect(
      fieldCardChoiceOptionForCard(
        multiCreditRunnerRigChoice,
        board,
        runnerProgram,
      )?.id,
    ).toBe("stealth_runner_program_1");
    expect(
      fieldCardChoiceOptionForCard(singleExposeChoice, board, ice)?.id,
    ).toBe("card_corp_ice_1");
    expect(
      fieldCardChoiceOptionForCard(
        hiddenSlotSingleExposeChoice,
        hiddenSlotBoard,
        hiddenSlot,
      )?.id,
    ).toBe("card_hidden_ice_slot");
    expect(fieldCardChoiceInfo(fieldChoice, ["card_bbs"])).toMatchObject({
      title: "Feldkarten auswählen",
      counterLabel: "1/0-3",
      canSubmit: true,
      canClear: true,
      submitLabel: "Auswahl übernehmen",
    });
    expect(fieldCardChoiceInfo(singleExposeChoice, [])).toMatchObject({
      title: "Feldkarte auswählen",
      prompt: "Installierte Korp-Karte exposen",
      counterLabel: "0/1",
      canSubmit: false,
    });
    expect(shouldUseFieldCardChoice(handChoice, board)).toBe(false);
    expect(shouldUseFieldCardChoice(stackChoice, board)).toBe(false);
    expect(
      shouldUseFieldCardChoice(offSiteArchiveChoice, corpArchivesBoard),
    ).toBe(false);
    expect(shouldUseFieldCardChoice(hermanChoice, board)).toBe(false);
    expect(shouldUseCardChoicePanel(offSiteArchiveChoice)).toBe(true);
    expect(shouldUseCardChoicePanel(hermanChoice)).toBe(true);
    expect(cardChoiceUsesReadableCards(stackChoice)).toBe(true);
    expect(cardChoiceUsesReadableCards(hermanChoice)).toBe(true);
    expect(cardChoiceUsesOrderedSelection(hermanChoice)).toBe(true);
  });

  it("labels Runner program install trash choices for optional and required MU cases", () => {
    const sourceProgram = {
      ...card("new_program", "New Program", "program"),
      memoryCost: 2,
    };
    const oldBreaker = {
      ...card("old_breaker", "Old Breaker", "program"),
      memoryCost: 1,
    };
    const oldUtility = {
      ...card("old_utility", "Old Utility", "program"),
      memoryCost: 2,
    };
    const pendingChoice: NonNullable<PlayerView["pendingChoice"]> = {
      choiceId: "runner_program_trash_before_install_7",
      side: "runner",
      source: "runner_program_trash_before_install:new_program:7",
      prompt: "Programme vor Installation trashen",
      kind: "select_cards",
      options: [
        { id: "card_old_breaker", label: "Old Breaker", value: "old_breaker" },
        { id: "card_old_utility", label: "Old Utility", value: "old_utility" },
      ],
      minSelections: 0,
      maxSelections: 2,
      stateVersion: 7,
      visibility: "hidden_info_barrier",
    };
    const optionalView = view("runner", {
      own: {
        ...view("runner").own,
        gripOrHq: [sourceProgram],
        rig: [oldBreaker, oldUtility],
        memoryUsed: 1,
        memoryLimit: 4,
      },
    });
    const requiredView = view("runner", {
      own: {
        ...view("runner").own,
        gripOrHq: [sourceProgram],
        rig: [oldBreaker, oldUtility],
        memoryUsed: 4,
        memoryLimit: 4,
      },
    });

    expect(
      runnerProgramInstallTrashChoiceInfo(pendingChoice, optionalView, []),
    ).toMatchObject({
      title: "Programme vorher trashen?",
      submitLabel: "Ohne Trash installieren",
      canSubmit: true,
      requiredMemoryToFree: 0,
      selectedMemoryFreed: 0,
    });
    expect(
      runnerProgramInstallTrashChoiceInfo(pendingChoice, requiredView, [
        "card_old_breaker",
      ]),
    ).toMatchObject({
      title: "MU freimachen",
      submitLabel: "Auswahl bestätigen",
      canSubmit: false,
      requiredMemoryToFree: 2,
      selectedMemoryFreed: 1,
    });
    expect(
      runnerProgramInstallTrashChoiceInfo(pendingChoice, requiredView, [
        "card_old_utility",
      ]),
    ).toMatchObject({
      title: "MU freimachen",
      question: "2/2 MU gewählt. Auswahl bestätigen?",
      submitLabel: "Auswahl bestätigen",
      canSubmit: true,
      selectedMemoryFreed: 2,
    });
    expect(
      runnerProgramInstallTrashChoiceInfo(pendingChoice, requiredView, []),
    ).toMatchObject({
      submitLabel: "Nicht installieren",
      canSubmit: true,
    });
  });
});

describe("V1.0.6 resource and card-display helpers", () => {
  it("renders action slot states for normal Runner, Corp and spent-action cases", () => {
    const runnerStart = actionSlotDisplay("runner", 4, 4, true);
    expect(runnerStart.label).toBe("4 Aktionen");
    expect(runnerStart.slots).toHaveLength(4);
    expect(runnerStart.slots.every((slot) => slot.state === "available")).toBe(
      true,
    );

    const runnerAfterAction = actionSlotDisplay("runner", 3, 4, true);
    expect(runnerAfterAction.spent).toBe(1);
    expect(runnerAfterAction.slots.map((slot) => slot.state)).toEqual([
      "spent",
      "available",
      "available",
      "available",
    ]);

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
      publicEvent("evt_1", "mandatory_draw", {
        actor: "corp",
        actionType: "mandatory_draw",
      }),
      publicEvent("evt_2", "play_operation", {
        actor: "corp",
        actionType: "play_operation",
        actionCostClicks: 1,
        turnActionOrdinalStart: 1,
        turnActionOrdinalEnd: 1,
        gainedActions: 2,
      }),
    ];

    expect(actionSlotCapacityForTurn("corp", 4, events)).toBe(5);
    expect(
      actionSlotDisplay(
        "corp",
        4,
        actionSlotCapacityForTurn("corp", 4, events),
        true,
      ).slots.map((slot) => `${slot.state}:${slot.bonus}`),
    ).toEqual([
      "spent:false",
      "available:false",
      "available:false",
      "available:true",
      "available:true",
    ]);
  });

  it("formats action and credit costs as user-facing chips", () => {
    expect(actionCostChips({ costs: [{ clicks: 1, credits: 2 }] })).toEqual([
      { kind: "action", amount: 1, label: "1 Aktion" },
      { kind: "credit", amount: 2, label: "2 Credits" },
    ]);
    expect(actionCostChips({ costs: [{ clicks: 3 }, { credits: 1 }] })).toEqual(
      [
        { kind: "action", amount: 3, label: "3 Aktionen" },
        { kind: "credit", amount: 1, label: "1 Credit" },
      ],
    );
    expect(
      JSON.stringify(actionCostChips({ costs: [{ clicks: 1, credits: 2 }] })),
    ).not.toContain("{ clicks");
    expect(actionConsumesClick({ costs: [{ clicks: 1, credits: 2 }] })).toBe(
      true,
    );
    expect(actionConsumesClick({ costs: [{ credits: 2 }] })).toBe(false);
    expect(actionConsumesClick({ costs: [] })).toBe(false);
  });

  it("keeps paid ability costs in chips instead of duplicating them in labels", () => {
    const paidAbility: LegalAction = {
      ...legalAction(
        "runner",
        "trigger_ability",
        "ability_1",
        "Bezahlte Fähigkeit ausführen",
        { cardId: "ability_1" },
      ),
      costs: [{ clicks: 1 }, { credits: 2 }],
    };

    expect(actionButtonLabel(paidAbility)).toBe("Bezahlte Fähigkeit ausführen");
    expect(contextualCardActionLabel(paidAbility)).toBe(
      "Bezahlte Fähigkeit ausführen",
    );
    expect(actionCostChips(paidAbility)).toEqual([
      { kind: "action", amount: 1, label: "1 Aktion" },
      { kind: "credit", amount: 2, label: "2 Credits" },
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
          usageHint: "spendable",
        },
      ],
    };
    const brokerTenPlus: VisibleCard = {
      ...brokerAfterLoad,
      instanceId: "broker_2",
      counterDisplays: [
        {
          ...brokerAfterLoad.counterDisplays![0]!,
          amount: 12,
          ariaLabel: "12 gespeicherte Credits",
        },
      ],
    };
    const shortTerm: VisibleCard = {
      ...card("short_term_1", "Short-Term Contract", "resource"),
      counterDisplays: [
        {
          ...brokerAfterLoad.counterDisplays![0]!,
          amount: 10,
          ariaLabel: "10 gespeicherte Credits",
        },
      ],
    };
    const bbsUnderTen: VisibleCard = {
      ...card("bbs_1", "BBS Whispering Campaign", "asset"),
      counterDisplays: [
        {
          ...brokerAfterLoad.counterDisplays![0]!,
          amount: 8,
          ariaLabel: "8 gespeicherte Credits",
        },
      ],
    };
    const bbsTenPlus: VisibleCard = {
      ...bbsUnderTen,
      instanceId: "bbs_2",
      counterDisplays: [
        {
          ...brokerAfterLoad.counterDisplays![0]!,
          amount: 10,
          ariaLabel: "10 gespeicherte Credits",
        },
      ],
    };
    const braindanceTenPlus: VisibleCard = {
      ...card("braindance_1", "Braindance Campaign", "asset"),
      counterDisplays: [
        {
          ...brokerAfterLoad.counterDisplays![0]!,
          amount: 12,
          ariaLabel: "12 gespeicherte Credits",
        },
      ],
    };
    const departmentAfterLoad: VisibleCard = {
      ...card("department_1", "Department of Truth Enhancement", "asset"),
      counterDisplays: [
        {
          ...brokerAfterLoad.counterDisplays![0]!,
          amount: 3,
          ariaLabel: "3 gespeicherte Credits",
        },
      ],
    };
    const unknownPowerCard: VisibleCard = {
      ...card("unknown_1", "Unknown Power Counter Card", "asset"),
      counters: { power: 8 },
    };

    expect(storedCreditSourceLabel(brokerAfterLoad)).toBe("Credits");
    expect(storedCreditAmount(brokerAfterLoad)).toBe(3);
    expect(
      cardCreditCounterVisual(storedCreditAmount(brokerAfterLoad)),
    ).toMatchObject({
      safeAmount: 3,
      showCount: false,
      iconCount: 3,
    });
    expect(storedCreditAmount(brokerTenPlus)).toBe(12);
    expect(
      cardCreditCounterVisual(storedCreditAmount(brokerTenPlus)),
    ).toMatchObject({
      safeAmount: 12,
      showCount: true,
      iconCount: 1,
    });
    expect(storedCreditSourceLabel(shortTerm)).toBe("Credits");
    expect(storedCreditAmount(shortTerm)).toBe(10);
    expect(storedCreditSourceLabel(bbsUnderTen)).toBe("Credits");
    expect(storedCreditAmount(bbsUnderTen)).toBe(8);
    expect(
      cardCreditCounterVisual(storedCreditAmount(bbsUnderTen)),
    ).toMatchObject({
      safeAmount: 8,
      showCount: false,
      iconCount: 8,
    });
    expect(storedCreditAmount(bbsTenPlus)).toBe(10);
    expect(
      cardCreditCounterVisual(storedCreditAmount(bbsTenPlus)),
    ).toMatchObject({
      safeAmount: 10,
      showCount: true,
      iconCount: 1,
    });
    expect(storedCreditSourceLabel(braindanceTenPlus)).toBe("Credits");
    expect(storedCreditAmount(braindanceTenPlus)).toBe(12);
    expect(
      cardCreditCounterVisual(storedCreditAmount(braindanceTenPlus)),
    ).toMatchObject({
      safeAmount: 12,
      showCount: true,
      iconCount: 1,
    });
    expect(storedCreditSourceLabel(departmentAfterLoad)).toBe("Credits");
    expect(storedCreditAmount(departmentAfterLoad)).toBe(3);
    expect(
      counterDisplaysForRendering(departmentAfterLoad).map(
        (display) => display.id,
      ),
    ).toEqual(["stored_credits"]);
    expect(storedCreditAmount(unknownPowerCard)).toBe(0);
  });

  it("does not use legacy stored-credit card tables when CounterDisplays are missing", () => {
    const brokerRawOnly: VisibleCard = {
      ...card("broker_legacy", "Broker", "resource"),
      definitionId: "onr_v1_154_broker",
      counters: { bit: 3 },
    };
    const unknownRawOnly: VisibleCard = {
      ...card("unknown_1", "Unknown Power Counter Card", "asset"),
      counters: { power: 8 },
    };
    expect(storedCreditSourceLabel(brokerRawOnly)).toBeNull();
    expect(storedCreditAmount(brokerRawOnly)).toBe(0);
    expect(storedCreditAmount(unknownRawOnly)).toBe(0);
  });

  it("does not select raw counters for board rendering when CounterDisplays are missing", () => {
    const rawOnly: VisibleCard = {
      ...card("broker_raw_only", "Broker", "resource"),
      definitionId: "onr_v1_154_broker",
      counters: { bit: 3, recurring_credit: 2, shell: 1 },
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
          usageHint: "spendable",
        },
        {
          id: "advancement",
          amount: 2,
          displayKind: "advancement",
          label: "Entwicklung",
          ariaLabel: "2 Entwicklungen",
        },
      ],
    };
    expect(counterDisplaysForRendering(rawOnly)).toEqual([]);
    expect(
      counterDisplaysForRendering(displayCard).map((display) => display.id),
    ).toEqual(["stored_credits"]);
  });

  it("maps CounterDisplay special counters to compact badge models", () => {
    const rawArmoredFridge: VisibleCard = {
      ...card("fridge_1", "Armored Fridge", "hardware"),
      definitionId: "onr_v1_121_armored-fridge",
      counters: { power: 7 },
    };
    const rawEmptyArmoredFridge: VisibleCard = {
      ...card("fridge_1", "Armored Fridge", "hardware"),
      definitionId: "onr_v1_121_armored-fridge",
      counters: { power: 0 },
    };
    const rawDataRaven: VisibleCard = {
      ...card("data_raven_1", "Data Raven", "ice"),
      definitionId: "onr_v1_236_data-raven",
      counters: { power: 2 },
    };
    const rawUnknownPowerCard: VisibleCard = {
      ...card("unknown_power_1", "Unknown Power Card", "resource"),
      counters: { power: 3 },
    };

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
            usageHint: "status_marker",
          },
        ],
      }),
    ).toEqual({
      amount: 7,
      label: "7 Ablative-Counter",
      ariaLabel: "7 Ablative-Counter",
      shortLabel: "7 Ablative",
      testId: "ablative-counter-badge",
      tooltip: "7 Ablative-Counter",
    });
    expect(
      counterDisplayBadgeView(
        {
          id: "trace_tag_counter",
          amount: 2,
          displayKind: "trace",
          label: "Data-Raven-Counter",
          ariaLabel: "2 Data-Raven-Counter",
          counterType: "trace_tag_counter",
          usageHint: "status_marker",
        },
        "data-raven-counter-badge",
      ),
    ).toMatchObject({
      amount: 2,
      label: "2 Data-Raven-Counter",
      ariaLabel: "2 Data-Raven-Counter",
      shortLabel: "2 Data-Raven",
    });
    expect(
      counterDisplayBadgeView(
        {
          id: "trauma",
          amount: 3,
          displayKind: "damage_prevention",
          label: "Trauma-Counter",
          ariaLabel: "3 Trauma-Counter",
          counterType: "trauma",
          usageHint: "status_marker",
        },
        "counter-display-badge",
      ),
    ).toMatchObject({
      amount: 3,
      label: "3 Trauma-Counter",
      ariaLabel: "3 Trauma-Counter",
      shortLabel: "3 Trauma",
    });
    expect(armoredFridgeAblativeCounterBadge(rawArmoredFridge)).toBeNull();
    expect(armoredFridgeAblativeCounterBadge(rawEmptyArmoredFridge)).toBeNull();
    expect(armoredFridgeAblativeCounterBadge(rawDataRaven)).toBeNull();
    expect(armoredFridgeAblativeCounterBadge(rawUnknownPowerCard)).toBeNull();
  });

  it("explains Proteus counter effects for badge and identity tooltips", () => {
    expect(
      counterDisplayBadgeView(
        {
          id: "cockroach",
          amount: 2,
          displayKind: "virus",
          label: "Cockroach-Counter",
          ariaLabel: "2 Cockroach-Counter",
          counterType: "cockroach",
          usageHint: "status_marker",
        },
        "cockroach-counter-badge",
      ),
    ).toEqual({
      amount: 2,
      label: "2 Cockroach-Counter",
      ariaLabel: "2 Cockroach-Counter",
      shortLabel: "2 Cockroach",
      testId: "cockroach-counter-badge",
      tooltip:
        "Cockroach: 2 Cockroach-Counter machen HQ-Discards zufällig. Diese Cockroach-Counter zählen als Virus-Counter, weil Cockroach ein Programm-Virus ist, und werden durch Virus-Purge entfernt.",
    });
    expect(
      counterDisplayTooltipText({
        id: "runner_virus_corp_highlighter",
        amount: 3,
        displayKind: "virus",
        label: "Highlighter-Counter",
        ariaLabel: "3 Highlighter-Counter",
        counterType: "highlighter",
        usageHint: "status_marker",
      }),
    ).toBe(
      "Highlighter: 3 Highlighter geben dem Runner 2 zusätzliche R&D-Karten beim Zugriff auf R&D. Purgefähig: Die Korp kann alle Runner-Virus-Counter entfernen; danach muss sie ihre nächsten 3 Aktionen aussetzen.",
    );
    expect(
      counterDisplayTooltipText({
        id: "runner_virus_corp_cascade",
        amount: 2,
        displayKind: "virus",
        label: "Cascade-Counter",
        ariaLabel: "2 Cascade-Counter auf der Korp",
        counterType: "cascade",
        usageHint: "status_marker",
      }),
    ).toBe(
      "Cascade: Je 2 Cascade-Counter zwingen die Korp zu Beginn ihres Zugs, 1 offene Karte aus R&D ins Archiv zu legen. Aktuell sind das 1 Karte. Purgefähig: Die Korp kann alle Runner-Virus-Counter entfernen; danach muss sie ihre nächsten 3 Aktionen aussetzen.",
    );
    expect(
      serverCounterChipsForDisplays([
        {
          id: "restrictive_net_zoning_install_cost_rd",
          amount: 2,
          displayKind: "generic_counter",
          label: "Install +",
          ariaLabel:
            "R&D: ICE-Installationskosten +2 durch Restrictive Net Zoning.",
          counterType: "install_cost_modifier",
          usageHint: "status_marker",
        },
      ]),
    ).toEqual([
      {
        key: "restrictive_net_zoning_install_cost_rd",
        amount: 2,
        label: "Install +",
        ariaLabel:
          "R&D: ICE-Installationskosten +2 durch Restrictive Net Zoning.",
        tooltip:
          "Restrictive Net Zoning: Die Korp muss 2 zusätzliche Credits zahlen, um ICE vor diesem Fort zu installieren.",
      },
    ]);
    expect(
      counterDisplayTooltipText({
        id: "runner_virus_corp_vienna",
        amount: 2,
        displayKind: "virus",
        label: "Vienna-Counter",
        ariaLabel: "2 Vienna-Counter",
        counterType: "vienna",
        usageHint: "status_marker",
      }),
    ).toBe(
      "Vienna 22: 2 Vienna geben dem Runner 2 zusätzliche HQ-Karten beim Zugriff auf HQ. Purgefähig: Die Korp kann alle Runner-Virus-Counter entfernen; danach muss sie ihre nächsten 3 Aktionen aussetzen.",
    );
    expect(
      counterDisplayTooltipText({
        id: "breaker_strength_penalty",
        amount: 1,
        displayKind: "generic_counter",
        label: "Pattel-Counter",
        ariaLabel: "1 Pattel-Counter",
        counterType: "breaker_strength_penalty",
        usageHint: "status_marker",
      }),
    ).toBe(
      "Pattel Antibody: Jeder Pattel-Counter auf einem Icebreaker reduziert dessen Stärke um 1.",
    );
    expect(
      counterDisplayTooltipText({
        id: "ice_transmutation",
        amount: 1,
        displayKind: "generic_counter",
        label: "Ice Transmutation",
        ariaLabel: "1 Ice Transmutation",
        counterType: "mark",
        usageHint: "status_marker",
      }),
    ).toBe(
      "Ice Transmutation: Das gewählte ICE hat +1 Stärke. Jede Subroutine wird direkt nach ihrem ursprünglichen Platz einmal zusätzlich ausgeführt.",
    );
  });

  it("keeps advancement counters as separate gems until ten counters", () => {
    expect(
      advancementCounterDisplay({ known: false, advancementCounters: 5 }),
    ).toEqual({
      amount: 5,
      ariaLabel: "5 öffentliche Advancement-Counter",
      visibleGemCount: 5,
      overflowLabel: null,
    });
    expect(
      advancementCounterDisplay({ known: true, advancementCounters: 5 }),
    ).toEqual({
      amount: 5,
      ariaLabel: "5 Entwicklungen",
      visibleGemCount: 5,
      overflowLabel: null,
    });
    expect(
      advancementCounterDisplay({ known: true, advancementCounters: 9 }),
    ).toEqual({
      amount: 9,
      ariaLabel: "9 Entwicklungen",
      visibleGemCount: 9,
      overflowLabel: null,
    });
    expect(
      advancementCounterDisplay({ known: false, advancementCounters: 10 }),
    ).toEqual({
      amount: 10,
      ariaLabel: "10 öffentliche Advancement-Counter",
      visibleGemCount: 1,
      overflowLabel: "10",
    });
    expect(
      advancementCounterDisplay({ known: false, advancementCounters: 0 }),
    ).toBeNull();
  });

  it("maps public identity CounterDisplays to narrow status chips", () => {
    expect(
      identityCounterChipsForDisplays([
        {
          id: "runner_virus_corp_highlighter",
          amount: 2,
          displayKind: "virus",
          label: "Highlighter-Counter",
          ariaLabel: "2 Highlighter-Counter",
          counterType: "highlighter",
          usageHint: "status_marker",
        },
        {
          id: "runner_virus_corp_tax",
          amount: 1,
          displayKind: "virus",
          label: "Tax-Counter",
          ariaLabel: "1 Tax-Counter",
          counterType: "tax",
          usageHint: "status_marker",
        },
        {
          id: "bad_publicity",
          amount: 6,
          displayKind: "bad_publicity",
          label: "Bad Publicity",
          ariaLabel: "6 Bad Publicity",
          counterType: "bad_publicity",
          usageHint: "status_marker",
        },
        {
          id: "advancement",
          amount: 3,
          displayKind: "advancement",
          label: "Entwicklung",
          ariaLabel: "3 öffentliche Advancement-Counter",
          usageHint: "score_modifier",
        },
        {
          id: "runner_virus_corp_empty",
          amount: 0,
          displayKind: "virus",
          label: "Empty-Counter",
          ariaLabel: "0 Empty-Counter",
          counterType: "highlighter",
          usageHint: "status_marker",
        },
      ]),
    ).toEqual([
      {
        key: "runner_virus_corp_highlighter",
        amount: 2,
        label: "Highlighter",
        ariaLabel: "2 Highlighter-Counter",
        tooltip:
          "Highlighter: 2 Highlighter geben dem Runner 1 zusätzliche R&D-Karte beim Zugriff auf R&D. Purgefähig: Die Korp kann alle Runner-Virus-Counter entfernen; danach muss sie ihre nächsten 3 Aktionen aussetzen.",
      },
      {
        key: "runner_virus_corp_tax",
        amount: 1,
        label: "Tax",
        ariaLabel: "1 Tax-Counter",
        tooltip:
          "Taxman: Je 2 Tax-Counter verliert die Korp zu Beginn ihres Zugs 1 Credit. Purgefähig: Die Korp kann alle Runner-Virus-Counter entfernen; danach muss sie ihre nächsten 3 Aktionen aussetzen.",
      },
      {
        key: "bad_publicity",
        amount: 6,
        label: "Bad Publicity",
        ariaLabel: "6 Bad Publicity",
        tooltip:
          "Bad Publicity: Jede Bad Publicity gibt dem Runner zu Beginn eines Runs 1 temporären Credit. Bei 7 Bad Publicity verliert die Korp.",
      },
    ]);
  });

  it("maps server CounterDisplays to fort-level counter chips", () => {
    expect(
      serverCounterChipsForDisplays([
        {
          id: "runner_virus_server_rd_socket_rd",
          amount: 1,
          displayKind: "virus",
          label: "Socket-Counter R&D",
          ariaLabel: "1 Socket-Counter R&D",
          counterType: "socket_rd",
          usageHint: "status_marker",
        },
        {
          id: "pox",
          amount: 2,
          displayKind: "virus",
          label: "Pox-Counter",
          ariaLabel: "2 Pox-Counter auf diesem Server",
          counterType: "virus",
          usageHint: "status_marker",
        },
        {
          id: "spy",
          amount: 1,
          displayKind: "generic_counter",
          label: "Spy-Counter",
          ariaLabel: "1 Spy-Counter auf diesem Server",
          counterType: "spy",
          usageHint: "status_marker",
        },
        {
          id: "advancement",
          amount: 3,
          displayKind: "advancement",
          label: "Entwicklung",
          ariaLabel: "3 öffentliche Advancement-Counter",
          usageHint: "score_modifier",
        },
        {
          id: "empty_socket",
          amount: 0,
          displayKind: "virus",
          label: "Socket-Counter HQ",
          ariaLabel: "0 Socket-Counter HQ",
          counterType: "socket_hq",
          usageHint: "status_marker",
        },
      ]),
    ).toEqual([
      {
        key: "runner_virus_server_rd_socket_rd",
        amount: 1,
        label: "Socket",
        ariaLabel: "1 Socket-Counter R&D",
        tooltip:
          "Viral Pipeline: Socket-Counter auf R&D. Sobald je 1 Socket auf Archives, HQ und R&D liegt, werden diese drei Socket-Counter in 1 Pipe-Counter umgewandelt. Purgefähig: Die Korp kann alle Runner-Virus-Counter entfernen; danach muss sie ihre nächsten 3 Aktionen aussetzen.",
      },
      {
        key: "pox",
        amount: 2,
        label: "Pox",
        ariaLabel: "2 Pox-Counter auf diesem Server",
        tooltip:
          "Pox: Je 2 Pox-Counter in diesem Fort erhöhen die Korp-Installationskosten in oder auf diesem Fort um 1 Credit. Purgefähig: Die Korp kann alle Runner-Virus-Counter entfernen; danach muss sie ihre nächsten 3 Aktionen aussetzen.",
      },
      {
        key: "spy",
        amount: 1,
        label: "Spy",
        ariaLabel: "1 Spy-Counter auf diesem Server",
        tooltip:
          "I Spy: Solange der Spy-Counter auf diesem Fort liegt, bleiben alle installierten Korp-Karten in oder auf diesem Fort für den Runner sichtbar. Die Korp kann 1 Aktion nehmen und 4 Credits zahlen, um 1 Spy-Counter zu entfernen.",
      },
    ]);
  });

  it("renders low credit-counter amounts as separate icons", () => {
    expect(cardCreditCounterVisual(2)).toMatchObject({
      safeAmount: 2,
      showCount: false,
      iconCount: 2,
    });
  });

  it("keeps variable paid subroutine markers visible as non-credit status chips", () => {
    const variableSubroutines: NonNullable<
      VisibleCard["counterDisplays"]
    >[number] = {
      id: "variable_paid_etr_subroutines",
      amount: 2,
      displayKind: "generic_counter",
      label: "End-the-run-Subroutinen",
      ariaLabel:
        "Gatekeeper: 2 End-the-run-Subroutinen; 4 zusätzliche Credits beim Rezzen, 7 Credits insgesamt",
      usageHint: "status_marker",
    };

    expect(
      counterDisplaysForRendering({ counterDisplays: [variableSubroutines] }),
    ).toEqual([variableSubroutines]);
    expect(counterDisplayTooltipText(variableSubroutines)).toBe(
      variableSubroutines.ariaLabel,
    );
    expect(counterDisplayUsesCreditBadge(variableSubroutines)).toBe(false);
    expect(counterDisplayUsesRefreshingCreditBadge(variableSubroutines)).toBe(
      false,
    );
  });

  it("distinguishes stored and refreshing credit pool badges", () => {
    const brokerCredits: NonNullable<VisibleCard["counterDisplays"]>[number] = {
      id: "stored_credits",
      amount: 3,
      displayKind: "stored_credits",
      label: "Credits",
      ariaLabel: "3 gespeicherte Credits",
      counterType: "bit",
      usageHint: "spendable",
      creditPool: { kind: "stored_credit" },
    };
    const zetatechBits: NonNullable<VisibleCard["counterDisplays"]>[number] = {
      id: "restricted_pool",
      amount: 2,
      displayKind: "restricted_pool",
      label: "Installations-Bits",
      ariaLabel: "2 Installations-Bits",
      counterType: "bit",
      usageHint: "spendable",
      creditPool: {
        kind: "restricted_credit",
        capacity: 2,
        uses: ["install_programs"],
        refresh: {
          timing: "start_of_runner_turn",
          behavior: "refill_to_capacity_if_used",
        },
      },
    };
    const militechCounter: NonNullable<VisibleCard["counterDisplays"]>[number] =
      {
        id: "militech",
        amount: 1,
        displayKind: "generic_counter",
        label: "Militech-Counter",
        ariaLabel: "1 Militech-Counter",
        counterType: "militech",
        usageHint: "status_marker",
      };

    expect(counterDisplayUsesCreditBadge(brokerCredits)).toBe(true);
    expect(counterDisplayUsesRefreshingCreditBadge(brokerCredits)).toBe(false);
    expect(counterDisplayUsesCreditBadge(zetatechBits)).toBe(true);
    expect(counterDisplayUsesRefreshingCreditBadge(zetatechBits)).toBe(true);
    expect(counterDisplayUsesCreditBadge(militechCounter)).toBe(false);
    expect(counterDisplayUsesRefreshingCreditBadge(militechCounter)).toBe(
      false,
    );
  });

  it("keeps contextual card action labels distinct for server-targeted events", () => {
    expect(
      contextualCardActionLabel(
        legalAction(
          "runner",
          "play_event",
          "card_1",
          "Simple Run Event auf R&D",
          { cardId: "card_1", serverId: "rd" },
        ),
      ),
    ).toBe("Run auf R&D");
    expect(
      contextualCardActionLabel(
        legalAction(
          "runner",
          "play_event",
          "card_1",
          "Simple Run Event auf Archives",
          { cardId: "card_1", serverId: "archives" },
        ),
      ),
    ).toBe("Run auf Archive");
    expect(
      contextualCardActionLabel(
        legalAction("runner", "play_event", "card_1", "All-Nighter auf HQ", {
          cardId: "card_1",
          serverId: "hq",
          runnerEventRun: true,
        }),
      ),
    ).toBe("Run auf HQ");
    expect(
      contextualCardActionLabel(
        legalAction(
          "runner",
          "play_event",
          "card_1",
          "Simple Draw Event spielen",
          { cardId: "card_1" },
        ),
      ),
    ).toBe("Spielen");
    expect(
      contextualCardActionLabel(
        legalAction(
          "runner",
          "play_event",
          "card_1",
          "Do the 'Drine: 1 Core Damage",
          { cardId: "card_1", xValue: 1 },
        ),
      ),
    ).toBe("1 Core Damage");
    expect(
      contextualCardActionLabel(
        legalAction(
          "runner",
          "play_event",
          "card_1",
          "Do the 'Drine: 2 Core Damage",
          { cardId: "card_1", xValue: 2 },
        ),
      ),
    ).toBe("2 Core Damage");
    expect(
      contextualCardActionLabel(
        legalAction(
          "runner",
          "play_event",
          "card_1",
          "Expose Event auf Remote 2",
          { cardId: "card_1", serverId: "remote_2" },
        ),
      ),
    ).toBe("Spielen auf Remote 2");
    expect(
      contextualCardActionLabel(
        legalAction(
          "corp",
          "score_agenda",
          "agenda_1",
          "Security Net Optimization scoren und R&D wählen",
          { cardId: "agenda_1", selectedServerId: "rd" },
        ),
      ),
    ).toBe("Scoren: R&D wählen");
    expect(
      contextualCardActionLabel(
        legalAction(
          "corp",
          "score_agenda",
          "agenda_1",
          "Security Net Optimization scoren und Remote 2 wählen",
          { cardId: "agenda_1", selectedServerId: "remote_2" },
        ),
      ),
    ).toBe("Scoren: Remote 2 wählen");
    expect(
      contextualCardActionLabel(
        legalAction("corp", "score_agenda", "agenda_1", "Agenda scoren", {
          cardId: "agenda_1",
        }),
      ),
    ).toBe("Scoren");
  });

  it("drops the card-name prefix for card-context run actions", () => {
    const wilsonRun = legalAction(
      "runner",
      "start_run",
      "wilson_1",
      "Wilson, Weeflerunner Apprentice: Run auf R&D",
      {
        cardId: "wilson_1",
        serverId: "rd",
        runOnlyAction: true,
      },
    );

    expect(actionButtonLabel(wilsonRun)).toBe(
      "Wilson, Weeflerunner Apprentice: Run auf R&D",
    );
    expect(
      actionMatchesContext(wilsonRun, {
        kind: "card",
        id: "wilson_1",
        label: "Wilson, Weeflerunner Apprentice",
      }),
    ).toBe(true);
    expect(contextualCardActionLabel(wilsonRun)).toBe("Run auf R&D");
  });

  it("drops generic card-name prefixes from card-context action labels", () => {
    const genericAbility = legalAction(
      "runner",
      "trigger_ability",
      "resource_1",
      "Helpful Resource: Bezahlte Fähigkeit ausführen",
      { cardId: "resource_1" },
    );
    const genericCredit = legalAction(
      "runner",
      "gain_credit",
      "resource_1",
      "Helpful Resource: 2 Credits nehmen",
      { cardId: "resource_1" },
    );

    expect(contextualCardActionLabel(genericAbility)).toBe(
      "Bezahlte Fähigkeit ausführen",
    );
    expect(contextualCardActionLabel(genericCredit)).toBe("2 Credits nehmen");
  });

  it("names Corp install destinations in card context actions", () => {
    expect(
      contextualCardActionLabel(
        legalAction(
          "corp",
          "install_card",
          "ice_1",
          "ICE vor HQ installieren",
          { cardId: "ice_1", serverId: "hq", placement: "ice" },
        ),
      ),
    ).toBe("Vor HQ");
    expect(
      contextualCardActionLabel(
        legalAction(
          "corp",
          "install_card",
          "ice_1",
          "ICE vor R&D installieren",
          { cardId: "ice_1", serverId: "rd", placement: "ice" },
        ),
      ),
    ).toBe("Vor R&D");
    expect(
      contextualCardActionLabel(
        legalAction(
          "corp",
          "install_card",
          "ice_1",
          "ICE vor Archives installieren",
          { cardId: "ice_1", serverId: "archives", placement: "ice" },
        ),
      ),
    ).toBe("Vor Archive");
    expect(
      contextualCardActionLabel(
        legalAction(
          "corp",
          "install_card",
          "ice_1",
          "ICE vor neuem Remote installieren",
          { cardId: "ice_1", serverId: "new_remote", placement: "ice" },
        ),
      ),
    ).toBe("Neues Remote erstellen");
    expect(
      contextualCardActionLabel(
        legalAction(
          "corp",
          "install_card",
          "agenda_1",
          "Karte in neuem Remote installieren",
          { cardId: "agenda_1", serverId: "new_remote", placement: "root" },
        ),
      ),
    ).toBe("Neues Remote erstellen");
    expect(
      contextualCardActionLabel(
        legalAction(
          "corp",
          "install_card",
          "agenda_1",
          "Karte in Remote 1 installieren",
          {
            cardId: "agenda_1",
            serverId: "remote_1",
            placement: "root",
            rootReplacement: "asset_to_agenda",
          },
        ),
      ),
    ).toBe("In Remote 1 (Node ersetzen)");
    expect(
      contextualCardActionLabel(
        legalAction(
          "corp",
          "install_card",
          "upgrade_1",
          "Karte in HQ installieren",
          { cardId: "upgrade_1", serverId: "hq", placement: "root" },
        ),
      ),
    ).toBe("In HQ");
    expect(
      contextualCardActionLabel(
        legalAction(
          "corp",
          "install_card",
          "upgrade_1",
          "Karte in R&D installieren",
          { cardId: "upgrade_1", serverId: "rd", placement: "root" },
        ),
      ),
    ).toBe("In R&D");
    expect(
      contextualCardActionLabel(
        legalAction(
          "runner",
          "install_card",
          "program_1",
          "Programm installieren",
          { cardId: "program_1" },
        ),
      ),
    ).toBe("Installieren");
    expect(
      contextualCardActionLabel(
        legalAction(
          "runner",
          "install_card",
          "program_1",
          "Programm mit Programmtrash installieren",
          {
            cardId: "program_1",
            runnerProgramTrashBeforeInstall: true,
          },
        ),
      ),
    ).toBe("Mit Programmtrash installieren");
    expect(
      contextualCardActionLabel(
        legalAction(
          "runner",
          "install_card",
          "program_1",
          "Programm installieren",
          {
            cardId: "program_1",
            runnerInstallPaymentLabel: "Mit 2 Zeta-Bits",
          },
        ),
      ),
    ).toBe("Mit 2 Zeta-Bits installieren");
    expect(
      contextualCardActionLabel(
        legalAction(
          "runner",
          "install_card",
          "program_1",
          "Programm mit Programmtrash installieren",
          {
            cardId: "program_1",
            runnerProgramTrashBeforeInstall: true,
            runnerInstallPaymentLabel: "Mit 1 Zeta-Bit",
          },
        ),
      ),
    ).toBe("Mit Programmtrash und 1 Zeta-Bit installieren");
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

  it("keeps new-remote installs as the last card-context action", () => {
    const newRemoteIce = legalAction(
      "corp",
      "install_card",
      "ice_1",
      "ICE vor neuem Remote installieren",
      { cardId: "ice_1", serverId: "new_remote", placement: "ice" },
    );
    const hqIce = legalAction(
      "corp",
      "install_card",
      "ice_1",
      "ICE vor HQ installieren",
      { cardId: "ice_1", serverId: "hq", placement: "ice" },
    );
    const rdIce = legalAction(
      "corp",
      "install_card",
      "ice_1",
      "ICE vor R&D installieren",
      { cardId: "ice_1", serverId: "rd", placement: "ice" },
    );
    const newRemoteRoot = legalAction(
      "corp",
      "install_card",
      "agenda_1",
      "Karte in neuem Remote installieren",
      { cardId: "agenda_1", serverId: "new_remote", placement: "root" },
    );
    const remoteRoot = legalAction(
      "corp",
      "install_card",
      "agenda_1",
      "Karte in Remote 1 installieren",
      { cardId: "agenda_1", serverId: "remote_1", placement: "root" },
    );

    expect(orderedCardContextActions([newRemoteIce, hqIce, rdIce])).toEqual([
      hqIce,
      rdIce,
      newRemoteIce,
    ]);
    expect(orderedCardContextActions([newRemoteRoot, remoteRoot])).toEqual([
      remoteRoot,
      newRemoteRoot,
    ]);
  });

  it("moves rig icebreaker actions to their card context", () => {
    const pump = legalAction(
      "runner",
      "pump_breaker",
      "breaker_1",
      "Simple Decoder pumpen",
      { breakerId: "breaker_1", iceId: "ice_1" },
      "run.encounter_ice",
    );
    const breakAction = legalAction(
      "runner",
      "break_subroutine",
      "breaker_1",
      "Simple Decoder: Subroutine 1 brechen",
      { breakerId: "breaker_1", iceId: "ice_1", subroutineIndex: 0 },
      "run.encounter_ice",
    );
    const paidBreakAction: LegalAction = {
      ...breakAction,
      costs: [{ credits: 2 }],
    };
    const paidPump: LegalAction = { ...pump, costs: [{ credits: 1 }] };
    const multiCostBreakAction: LegalAction = {
      ...breakAction,
      costs: [{ clicks: 1 }, { credits: 2 }],
    };
    const continueRun = legalAction(
      "runner",
      "continue_run",
      "game_rule",
      "Run fortsetzen",
      undefined,
      "run.approach_ice",
    );

    const split = splitLegalActions([pump, breakAction, continueRun]);

    expect(split.primaryActions.map((action) => action.type)).toEqual([
      "continue_run",
    ]);
    expect(split.contextualActions).toEqual([pump, breakAction]);
    expect(
      actionMatchesContext(pump, {
        kind: "card",
        id: "breaker_1",
        label: "Simple Decoder",
      }),
    ).toBe(true);
    expect(actionButtonLabel(pump)).toBe("Stärke +1 (Simple Decoder)");
    expect(contextualCardActionLabel(pump)).toBe("Stärke +1");
    expect(actionButtonLabel(breakAction)).toBe(
      "Subroutine 1 brechen (Simple Decoder)",
    );
    expect(contextualCardActionLabel(breakAction)).toBe("Subroutine 1 brechen");
    expect(actionButtonLabel(paidBreakAction)).toBe(
      "Subroutine 1 brechen (Simple Decoder)",
    );
    expect(contextualCardActionLabel(paidBreakAction)).toBe(
      "Subroutine 1 brechen",
    );
    expect(actionButtonLabel(paidPump)).toBe("Stärke +1 (Simple Decoder)");
    expect(actionButtonLabel(multiCostBreakAction)).toBe(
      "Subroutine 1 brechen (Simple Decoder)",
    );
    expect(actionCostChips(multiCostBreakAction)).toEqual([
      { kind: "action", amount: 1, label: "1 Aktion" },
      { kind: "credit", amount: 2, label: "2 Credits" },
    ]);
  });

  it("keeps Broker abilities on the installed resource overlay", () => {
    const load = legalAction(
      "runner",
      "trigger_ability",
      "broker_1",
      "Broker: 3 Credits auf Broker legen",
      {
        cardId: "broker_1",
        resourceAbility: "broker_load_credits",
        counterType: "power",
        addCounterAmount: 3,
      },
    );
    const take = legalAction(
      "runner",
      "trigger_ability",
      "broker_1",
      "Broker: 6 Credits nehmen",
      {
        cardId: "broker_1",
        resourceAbility: "broker_take_credits",
        counterType: "power",
        gainCreditsAmount: 6,
      },
    );

    const split = splitLegalActions([load, take]);

    expect(split.primaryActions).toEqual([]);
    expect(split.contextualActions).toEqual([load, take]);
    expect(
      actionMatchesContext(load, {
        kind: "card",
        id: "broker_1",
        label: "Broker",
      }),
    ).toBe(true);
    expect(contextualCardActionLabel(load)).toBe("3 Credits laden");
    expect(contextualCardActionLabel(take)).toBe("6 Credits nehmen");
  });

  it("labels Data Raven counter removal on the rezzed ice overlay", () => {
    const remove = legalAction(
      "runner",
      "trigger_ability",
      "data_raven_1",
      "Data-Raven-Counter entfernen",
      {
        cardId: "data_raven_1",
        runnerAbility: "remove_data_raven_counter",
        counterType: "power",
        removeCounterAmount: 1,
      },
    );

    const split = splitLegalActions([remove]);

    expect(split.primaryActions).toEqual([]);
    expect(split.contextualActions).toEqual([remove]);
    expect(
      actionMatchesContext(remove, {
        kind: "card",
        id: "data_raven_1",
        label: "Data Raven",
      }),
    ).toBe(true);
    expect(actionButtonLabel(remove)).toBe("Raven-Counter entfernen");
    expect(contextualCardActionLabel(remove)).toBe("Raven-Counter entfernen");
  });

  it("keeps Fang run-lock payment visible with normal Runner actions", () => {
    const removeLock = legalAction(
      "runner",
      "trigger_ability",
      "game_rule",
      "Run-Sperre für 2 Credits entfernen",
      {
        v1920RunnerRunLockAbility: "fang_2_0_pay_to_run",
        fangRunLockCreditCost: 2,
        runnerRunLockCreditCost: 2,
        gainCreditsAmount: 0,
      },
    );

    const split = splitLegalActions([removeLock]);

    expect(split.primaryActions).toEqual([removeLock]);
    expect(split.contextualActions).toEqual([]);
    expect(actionButtonLabel(removeLock)).toBe(
      "Run-Sperre für 2 Credits entfernen",
    );
  });

  it("keeps Runner status counter removal visible with normal Runner actions", () => {
    const removeDoppelgangerCounter = legalAction(
      "runner",
      "trigger_ability",
      "runner_identity",
      "Doppelganger-Counter entfernen",
      {
        cardId: "runner_identity",
        runnerAbility: "remove_runner_trace_counter",
        counterType: "link_reduction_counter",
        removeCounterAmount: 1,
        counterRemoveCreditCost: 4,
      },
      "runner_action.main",
    );
    const removeCryingCounter = legalAction(
      "runner",
      "gain_credit",
      "runner_identity",
      "Crying-Counter entfernen",
      {
        cardId: "runner_identity",
        runnerAbility: "remove_crying_counter",
        counterType: "crying",
        removeCounterAmount: 1,
        counterRemoveCreditCost: 2,
      },
      "runner_action.main",
    );

    const split = splitLegalActions([
      removeDoppelgangerCounter,
      removeCryingCounter,
    ]);

    expect(split.primaryActions).toEqual([
      removeDoppelgangerCounter,
      removeCryingCounter,
    ]);
    expect(split.contextualActions).toEqual([]);
    expect(actionButtonLabel(removeDoppelgangerCounter)).toBe(
      "Doppelganger-Counter entfernen",
    );
    expect(actionButtonLabel(removeCryingCounter)).toBe(
      "Crying-Counter entfernen",
    );
  });

  it("warns and keeps contextless contextual actions visible", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const brokenContextAction = legalAction(
        "corp",
        "advance_card",
        "game_rule",
        "Kontextlose Aktion",
      );

      const split = splitLegalActions([brokenContextAction]);

      expect(split.primaryActions).toEqual([brokenContextAction]);
      expect(split.contextualActions).toEqual([]);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          "classified as contextual without a selectable context",
        ),
        expect.objectContaining({
          actionId: brokenContextAction.actionId,
          type: "advance_card",
          source: "game_rule",
          label: "Kontextlose Aktion",
        }),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("labels The Shell Traders abilities on the installed resource overlay", () => {
    const prepare = legalAction(
      "runner",
      "trigger_ability",
      "shell_traders_1",
      "The Shell Traders: Karte vorbereiten",
      {
        cardId: "shell_traders_1",
        shellTradersAbility: "set_aside_from_grip",
        targetCardId: "simple_fracter_1",
        targetCardDefinitionId: "simple_fracter",
        shellCounterAmount: 2,
      },
    );
    const remove = legalAction(
      "runner",
      "trigger_ability",
      "shell_traders_1",
      "The Shell Traders: 1 Shell-Counter entfernen",
      {
        cardId: "shell_traders_1",
        shellTradersAbility: "remove_shell_counter",
        targetCardId: "simple_fracter_1",
        targetCardDefinitionId: "simple_fracter",
        counterType: "shell",
        removeCounterAmount: 1,
      },
    );

    const split = splitLegalActions([prepare, remove]);

    expect(split.primaryActions).toEqual([]);
    expect(split.contextualActions).toEqual([prepare, remove]);
    expect(
      actionMatchesContext(prepare, {
        kind: "card",
        id: "shell_traders_1",
        label: "The Shell Traders",
      }),
    ).toBe(true);
    expect(actionButtonLabel(prepare)).toBe("Simple Fracter zur Seite legen");
    expect(actionButtonLabel(remove)).toBe(
      "Shell-Counter von Simple Fracter entfernen",
    );
    expect(contextualCardActionLabel(prepare)).toBe(
      "Simple Fracter zur Seite legen",
    );
    expect(contextualCardActionLabel(remove)).toBe(
      "Shell-Counter von Simple Fracter entfernen",
    );
  });

  it("keeps parallel Shell Traders prepare actions distinguishable by target", () => {
    const fracter = legalAction(
      "runner",
      "trigger_ability",
      "shell_traders_1",
      "The Shell Traders: Simple Fracter vorbereiten",
      {
        cardId: "shell_traders_1",
        shellTradersAbility: "set_aside_from_grip",
        targetCardId: "simple_fracter_1",
        targetCardDefinitionId: "simple_fracter",
      },
    );
    const decoder = legalAction(
      "runner",
      "trigger_ability",
      "shell_traders_1",
      "The Shell Traders: Simple Decoder vorbereiten",
      {
        cardId: "shell_traders_1",
        shellTradersAbility: "set_aside_from_grip",
        targetCardId: "simple_decoder_1",
        targetCardDefinitionId: "simple_decoder",
      },
    );

    expect([actionButtonLabel(fracter), actionButtonLabel(decoder)]).toEqual([
      "Simple Fracter zur Seite legen",
      "Simple Decoder zur Seite legen",
    ]);
  });

  it("labels Short-Term Contract take-credit actions on the installed resource overlay", () => {
    const take = legalAction(
      "runner",
      "trigger_ability",
      "short_term_1",
      "Short-Term Contract: 2 Credits nehmen",
      {
        cardId: "short_term_1",
        resourceAbility: "short_term_contract_take_credits",
        counterType: "power",
        removePowerCounterAmount: 2,
        gainCreditsAmount: 2,
      },
    );

    const split = splitLegalActions([take]);

    expect(split.primaryActions).toEqual([]);
    expect(split.contextualActions).toEqual([take]);
    expect(
      actionMatchesContext(take, {
        kind: "card",
        id: "short_term_1",
        label: "Short-Term Contract",
      }),
    ).toBe(true);
    expect(contextualCardActionLabel(take)).toBe("2 Credits nehmen");
  });

  it("labels Junkyard BBS with the concrete heap target", () => {
    const takeTopHeap = legalAction(
      "runner",
      "trigger_ability",
      "junkyard_1",
      "Junkyard BBS: oberste Heap-Karte in die Grip nehmen",
      {
        cardId: "junkyard_1",
        resourceAbility: "junkyard_bbs_return_top_heap",
        targetCardId: "fracter_1",
        targetCardDefinitionId: "simple_fracter",
        sourceZone: "heap",
        destinationZone: "grip",
      },
    );

    const split = splitLegalActions([takeTopHeap]);

    expect(split.primaryActions).toEqual([]);
    expect(split.contextualActions).toEqual([takeTopHeap]);
    expect(
      actionMatchesContext(takeTopHeap, {
        kind: "card",
        id: "junkyard_1",
        label: "Junkyard BBS",
      }),
    ).toBe(true);
    expect(actionButtonLabel(takeTopHeap)).toBe(
      "Simple Fracter aus dem Heap auf die Hand nehmen",
    );
    expect(contextualCardActionLabel(takeTopHeap)).toBe(
      "Simple Fracter aus dem Heap auf die Hand nehmen",
    );
  });

  it("labels Self-Modifying Code activation without credit costs", () => {
    const searchInstall = legalAction(
      "runner",
      "trigger_ability",
      "smc_1",
      "Self-Modifying Code: trashen und Programm aus Stack installieren",
      {
        cardId: "smc_1",
        abilityId: "self_modifying_code_install_program",
        trashOnUse: true,
      },
      "run.encounter_ice",
    );
    const split = splitLegalActions([searchInstall]);

    expect(split.primaryActions).toEqual([]);
    expect(split.contextualActions).toEqual([searchInstall]);
    expect(
      actionMatchesContext(searchInstall, {
        kind: "card",
        id: "smc_1",
        label: "Self-Modifying Code",
      }),
    ).toBe(true);
    expect(actionButtonLabel(searchInstall)).toBe(
      "Trashen: Programm aus Stack installieren",
    );
    expect(contextualCardActionLabel(searchInstall)).toBe("Programm suchen");
    expect(actionCostChips(searchInstall)).toEqual([]);
    expect(
      actionCostChips({ ...searchInstall, costs: [{ credits: 2 }] }),
    ).toEqual([]);
  });

  it("mirrors run-timing actions into the Run window without changing their card context", () => {
    const smc = card("smc_1", "Self-Modifying Code", "program");
    const breaker = card("breaker_1", "Simple Decoder", "program");
    const running = view("runner", {
      own: {
        ...view("runner").own,
        rig: [smc, breaker],
      },
      run: {
        attackedServerId: "rd",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "rd", iceIndex: 0 },
        encounteredIce: card("ice_1", "Data Wall", "ice"),
        successful: false,
      },
    });
    const searchInstall = legalAction(
      "runner",
      "trigger_ability",
      "smc_1",
      "Self-Modifying Code: trashen und Programm aus Stack installieren",
      {
        cardId: "smc_1",
        v1911HiddenZoneAbility: "self_modifying_code_install_program",
        trashOnUse: true,
      },
      "run.encounter_ice",
    );
    const pump: LegalAction = {
      ...legalAction(
        "runner",
        "pump_breaker",
        "breaker_1",
        "Simple Decoder: Stärke +1",
        { breakerId: "breaker_1", iceId: "ice_1" },
        "run.encounter_ice",
      ),
      costs: [{ credits: 1 }],
    };
    const continueRun = legalAction(
      "runner",
      "continue_run",
      "game_rule",
      "ICE passieren",
      { encounterContinue: true, unbrokenSubroutineCount: 0 },
      "run.encounter_ice",
    );
    const runPaidAbility = legalAction(
      "runner",
      "trigger_ability",
      "broker_1",
      "Broker: 3 Credits auf Broker legen",
      { cardId: "broker_1", resourceAbility: "broker_load_credits" },
      "run.encounter_ice",
    );
    const offRunAbility = legalAction(
      "runner",
      "trigger_ability",
      "broker_1",
      "Broker: 3 Credits auf Broker legen",
      { cardId: "broker_1", resourceAbility: "broker_load_credits" },
    );

    const split = splitLegalActions([
      searchInstall,
      pump,
      continueRun,
      runPaidAbility,
      offRunAbility,
    ]);
    const mirrored = runWindowActions(running, [
      searchInstall,
      pump,
      continueRun,
      runPaidAbility,
      offRunAbility,
    ]);

    expect(split.primaryActions).toEqual([continueRun]);
    expect(split.contextualActions).toEqual([
      searchInstall,
      pump,
      runPaidAbility,
      offRunAbility,
    ]);
    expect(mirrored).toEqual([
      searchInstall,
      pump,
      continueRun,
      runPaidAbility,
    ]);
    expect(runWindowActionButtonLabel(running, searchInstall)).toBe(
      "SMC: Programm suchen",
    );
    expect(runWindowActionButtonLabel(running, pump)).toBe(
      "Simple Decoder +1 Stärke",
    );
    expect(runWindowActionButtonLabel(running, runPaidAbility)).toBe(
      "3 Credits laden",
    );
    const breakAction = legalAction(
      "runner",
      "break_subroutine",
      "breaker_1",
      "Simple Decoder: Subroutine 1 brechen",
      { breakerId: "breaker_1", iceId: "ice_1", subroutineIndex: 0 },
      "run.encounter_ice",
    );
    expect(runWindowActionButtonLabel(running, breakAction)).toBe(
      "Simple Decoder: Subroutine 1 brechen",
    );
    const resolveSubroutines = legalAction(
      "runner",
      "continue_run",
      "game_rule",
      "Subroutinen auslösen (Run endet)",
      { encounterContinue: true, unbrokenSubroutineCount: 1 },
      "run.encounter_ice",
    );
    expect(runWindowActionButtonLabel(running, resolveSubroutines)).toBe(
      "Subroutinen auslösen (Run endet)",
    );
    expect(
      actionMatchesContext(searchInstall, {
        kind: "card",
        id: "smc_1",
        label: "Self-Modifying Code",
      }),
    ).toBe(true);
    expect(actionCostChips(searchInstall)).toEqual([]);
  });

  it("mirrors pending run choices into the Run window", () => {
    const pendingChoice: NonNullable<PlayerView["pendingChoice"]> = {
      choiceId: "v120_choice_damage",
      side: "runner",
      source: "v120.event_modification.prevent",
      prompt: "Damage Prevention",
      kind: "select_option",
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 1,
      visibility: "hidden_info_barrier",
      options: [
        {
          id: "pass",
          label: "Nicht verhindern",
          publicLabel: "Event Modification",
        },
        {
          id: "prevent_1",
          label: "Shield: 1 Schaden verhindern",
          publicLabel: "Event Modification",
        },
      ],
    };
    const running = view("runner", {
      pendingChoice,
      run: {
        attackedServerId: "rd",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "rd", iceIndex: 0 },
        encounteredIce: card("ice_1", "Shotgun Wire", "ice"),
        successful: false,
      },
    });
    const choiceAction = legalAction(
      "runner",
      "resolve_choice",
      "game_rule",
      "Damage Prevention",
      {
        choiceId: pendingChoice.choiceId,
        choiceVisibility: "hidden_info_barrier",
        choiceKind: "select_option",
      },
      "run.encounter_ice",
    );

    expect(runWindowActions(running, [choiceAction])).toEqual([choiceAction]);
  });

  it("keeps long run-window breaker examples compact while leaving costs to chips", () => {
    const krash = card("krash_1", "Krash", "program");
    const running = view("runner", {
      own: {
        ...view("runner").own,
        rig: [krash],
      },
      run: {
        attackedServerId: "rd",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "rd", iceIndex: 0 },
        encounteredIce: card("ice_1", "Fire Wall", "ice"),
        successful: false,
      },
    });
    const pump: LegalAction = {
      ...legalAction(
        "runner",
        "pump_breaker",
        "krash_1",
        "Krash: Stärke +1",
        { breakerId: "krash_1", iceId: "ice_1" },
        "run.encounter_ice",
      ),
      costs: [{ credits: 2 }],
    };

    const label = runWindowActionButtonLabel(running, pump);

    expect(label).toBe("Krash +1 Stärke");
    expect(label).not.toContain("gegen Fire Wall");
    expect(label).not.toContain("(ICE 1)");
    expect(actionCostChips(pump)).toEqual([
      { kind: "credit", amount: 2, label: "2 Credits" },
    ]);
  });

  it("does not show a false missing-breaker hint in the corp encounter view", () => {
    const codecracker: VisibleCard = {
      ...card("codecracker_1", "Codecracker", "program"),
      subtypes: ["icebreaker"],
      rulesText:
        "0 Credits: Break code gate subroutine.\n1 Credit: +1 strength.",
      strength: 0,
    };
    const endlessCorridor: VisibleCard = {
      ...card("ice_1", "Endless Corridor", "ice"),
      subtypes: ["code_gate"],
      rulesText: "End the run.\nEnd the run.",
      strength: 2,
    };
    const corpView = view("corp", {
      activeSide: "runner",
      timingPoint: "run.encounter_ice",
      opponent: {
        ...view("corp").opponent,
        rig: [codecracker],
      },
      run: {
        attackedServerId: "rd",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "rd", iceIndex: 0 },
        encounteredIce: endlessCorridor,
        successful: false,
      },
    });

    expect(runBreakerActionHint(corpView, [])).toBe(
      "Runner-Rig zeigt passenden Eisbrecher: Codecracker.",
    );
  });

  it("keeps the no-matching-breaker hint for the runner action view", () => {
    const runnerView = view("runner", {
      activeSide: "runner",
      timingPoint: "run.encounter_ice",
      run: {
        attackedServerId: "rd",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "rd", iceIndex: 0 },
        encounteredIce: {
          ...card("ice_1", "Endless Corridor", "ice"),
          subtypes: ["code_gate"],
        },
        successful: false,
      },
    });

    expect(runBreakerActionHint(runnerView, [])).toBe(
      "Kein passender Eisbrecher für dieses ICE verfügbar.",
    );
  });

  it("keeps approach-ice expose decisions visible in the main and Run panels", () => {
    const smarteye = card("smarteye_1", "Smarteye", "program");
    const running = view("runner", {
      timingPoint: "run.approach_ice",
      activeSide: "runner",
      phase: "run",
      own: {
        ...view("runner").own,
        rig: [smarteye],
      },
      servers: [
        {
          id: "rd",
          label: "R&D",
          ice: [card("ice_1", "Filter", "ice", false)],
          root: [],
        },
      ],
      run: {
        attackedServerId: "rd",
        phase: "approach_ice",
        position: { kind: "ice", serverId: "rd", iceIndex: 0 },
        successful: false,
      },
    });
    const expose = legalAction(
      "runner",
      "trigger_ability",
      "smarteye_1",
      "Smarteye: ICE ansehen",
      {
        cardId: "smarteye_1",
        iceId: "ice_1",
        approachIceExposeDecision: "expose",
      },
      "run.approach_ice",
    );
    const decline = legalAction(
      "runner",
      "trigger_ability",
      "smarteye_1",
      "Smarteye: Ansehen überspringen",
      {
        cardId: "smarteye_1",
        iceId: "ice_1",
        approachIceExposeDecision: "decline",
      },
      "run.approach_ice",
    );
    const finishViewing = legalAction(
      "runner",
      "trigger_ability",
      "smarteye_1",
      "Smarteye: Ansehen beenden",
      {
        cardId: "smarteye_1",
        iceId: "ice_1",
        approachIceExposeViewDecision: "finish",
      },
      "run.approach_ice",
    );

    const split = splitLegalActions([expose, decline]);
    const mirrored = runWindowActions(running, [
      expose,
      decline,
      finishViewing,
    ]);

    expect(split.primaryActions).toEqual([expose, decline]);
    expect(split.contextualActions).toEqual([]);
    expect(mirrored).toEqual([expose, decline, finishViewing]);
    expect(runWindowActionButtonLabel(running, expose)).toBe(
      "Smarteye: ICE ansehen",
    );
    expect(runWindowActionButtonLabel(running, decline)).toBe(
      "Smarteye: Ansehen überspringen",
    );
    expect(runWindowActionButtonLabel(running, finishViewing)).toBe(
      "Smarteye: Ansehen beenden",
    );
  });

  it("mirrors Startup Immolator post-pass trash into the Run window", () => {
    const startup = card("startup_1", "Startup Immolator", "program");
    const running = view("runner", {
      own: {
        ...view("runner").own,
        rig: [startup],
      },
      run: {
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
        successful: false,
      },
    });
    const startupTrash: LegalAction = {
      ...legalAction(
        "runner",
        "trigger_ability",
        "startup_1",
        "Startup Immolator: ICE trashen",
        {
          cardId: "startup_1",
          targetIceId: "ice_1",
          v1922RunnerProgramAbility: "startup_immolator_trash_ice",
          rezCostPaid: 3,
        },
        "run.jack_out_window",
      ),
      costs: [{ credits: 3 }],
    };
    const continueRun = legalAction(
      "runner",
      "continue_run",
      "game_rule",
      "Run fortsetzen",
      undefined,
      "run.jack_out_window",
    );
    const offRunAbility = legalAction(
      "runner",
      "trigger_ability",
      "broker_1",
      "Broker: 3 Credits auf Broker legen",
      { cardId: "broker_1", resourceAbility: "broker_load_credits" },
    );

    const mirrored = runWindowActions(running, [
      startupTrash,
      continueRun,
      offRunAbility,
    ]);

    expect(mirrored).toEqual([startupTrash, continueRun]);
    expect(runWindowActionButtonLabel(running, startupTrash)).toBe(
      "Startup Immolator: ICE trashen",
    );
    expect(actionCostChips(startupTrash)).toEqual([
      { kind: "credit", amount: 3, label: "3 Credits" },
    ]);
    expect(
      actionMatchesContext(startupTrash, {
        kind: "card",
        id: "startup_1",
        label: "Startup Immolator",
      }),
    ).toBe(true);
  });

  it("mirrors access and access-resolution actions into the Run window", () => {
    const running = view("runner", {
      run: {
        attackedServerId: "rd",
        phase: "access",
        position: { kind: "server", serverId: "rd" },
        successful: true,
      },
    });
    const access = legalAction(
      "runner",
      "access_card",
      "game_rule",
      "Karte accessen",
      undefined,
      "access.resolve_card",
    );
    const steal = legalAction(
      "runner",
      "steal_agenda",
      "agenda_1",
      "Priority Requisition stehlen",
      { cardId: "agenda_1" },
      "access.resolve_card",
    );
    const trash = legalAction(
      "runner",
      "trash_accessed_card",
      "asset_1",
      "South African Mining Corp trashen",
      { cardId: "asset_1" },
      "access.resolve_card",
    );
    const decline = legalAction(
      "runner",
      "decline_trash",
      "game_rule",
      "Weiter accessen",
      { cardId: "asset_1" },
      "access.resolve_card",
    );
    const showCard = legalAction(
      "runner",
      "trigger_ability",
      "viewer_1",
      "Karte anzeigen",
      { cardId: "viewer_1" },
      "access.resolve_card",
    );
    const draw = legalAction(
      "runner",
      "draw_card",
      "basic_action",
      "Karte ziehen",
    );

    const mirrored = runWindowActions(running, [
      access,
      steal,
      trash,
      decline,
      showCard,
      draw,
    ]);

    expect(actionButtonLabel(access)).toBe("Zugriff auf Karte");
    expect(mirrored).toEqual([access, steal, trash, decline, showCard]);
    expect(runWindowActionButtonLabel(running, access)).toBe(
      "Zugriff auf Karte",
    );
    expect(runWindowActionButtonLabel(running, decline)).toBe(
      "Zugriff abschließen",
    );
    expect(runWindowActionButtonLabel(running, showCard)).toBe(
      "Karte anzeigen",
    );
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
        citySurveillanceProjectedTagsAdded: 0,
      },
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
        citySurveillanceProjectedTagsAdded: 1,
      },
    );
    const plain = legalAction(
      "runner",
      "draw_card",
      "basic_action",
      "Karte ziehen",
    );

    expect(actionButtonLabel(pay)).toBe(
      "Karte ziehen (City Surveillance: 1 Credit zahlen)",
    );
    expect(actionButtonLabel(tag)).toBe(
      "Karte ziehen (City Surveillance: 1 Tag nehmen)",
    );
    expect(actionButtonLabel(plain)).toBe("Karte ziehen");
  });

  it("describes accessed Archive assets without redundant trash hints", () => {
    const accessedUpgrade = card(
      "upgrade_1",
      "Dedicated Response Team",
      "upgrade",
    );
    accessedUpgrade.trashCost = 2;
    const continueAccess = legalAction(
      "runner",
      "decline_trash",
      "game_rule",
      "Weiter accessen",
      { cardId: accessedUpgrade.instanceId },
      "access.resolve_card",
    );

    expect(
      accessRevealStatusLabel(
        accessedUpgrade,
        [continueAccess],
        "runner",
        "runner",
        "Archive",
      ),
    ).toContain("im Archiv gesehen");
    expect(
      accessRevealStatusLabel(
        accessedUpgrade,
        [continueAccess],
        "runner",
        "runner",
        "Archive",
      ),
    ).not.toContain("nicht genug Credits");
    expect(
      accessRevealStatusLabel(
        accessedUpgrade,
        [continueAccess],
        "runner",
        "runner",
        "Archive",
      ),
    ).not.toContain("erneut getrasht");
  });

  it("keeps the insufficient-credit access hint for installed assets and upgrades", () => {
    const accessedUpgrade = card(
      "upgrade_1",
      "Dedicated Response Team",
      "upgrade",
    );
    accessedUpgrade.trashCost = 2;
    const decline = legalAction(
      "runner",
      "decline_trash",
      "game_rule",
      "Nicht trashen",
      { cardId: accessedUpgrade.instanceId },
      "access.resolve_card",
    );

    expect(
      accessRevealStatusLabel(
        accessedUpgrade,
        [decline],
        "runner",
        "runner",
        "Remote 1",
      ),
    ).toBe(
      "Remote 1-Zugriff: Du hast aktuell nicht genug Credits, um die Trash-Kosten zu bezahlen. Du kannst den Zugriff abschließen.",
    );
  });

  it("does not describe missing local access actions as insufficient credits", () => {
    const accessedAsset = card("asset_1", "Doppelganger Antibody", "asset");
    accessedAsset.trashCost = 0;

    expect(
      accessRevealStatusLabel(accessedAsset, [], "runner", "runner", "R&D"),
    ).toBe("R&D-Zugriff: Angezeigte Karte aus Research and Development.");
  });

  it("explains Proteus free access trash for normally untrashable cards", () => {
    const accessedIce = card("ice_1", "Dog Pile", "ice");
    const trash = legalAction(
      "runner",
      "trash_accessed_card",
      "ice_1",
      "Dog Pile kostenlos trashen",
      {
        cardId: "ice_1",
        freeAccessTrash: true,
        proteusRunnerVirusFreeTrashCounterType: "garbage",
      },
      "access.resolve_card",
    );
    const decline = legalAction(
      "runner",
      "decline_trash",
      "game_rule",
      "Weiter accessen",
      { cardId: "ice_1" },
      "access.resolve_card",
    );

    expect(
      accessRevealStatusLabel(
        accessedIce,
        [trash, decline],
        "runner",
        "runner",
        "R&D",
      ),
    ).toBe(
      "R&D-Zugriff: Garbage In: Du kannst diese Karte kostenlos trashen, auch wenn sie normalerweise keine Trash-Kosten hat.",
    );
  });

  it("retains the latest visible access reveal after later cleanup events until it is dismissed", () => {
    const hqReveal = publicEvent("evt_access", "action", {
      actionType: "access_card",
      actor: "runner",
      serverLabel: "HQ",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation",
    });
    const runCleanup = publicEvent("evt_cleanup", "action", {
      actionType: "continue_run",
      actor: "runner",
    });

    expect(
      retainedAccessRevealEvent([hqReveal, runCleanup], null)?.eventId,
    ).toBe("evt_access");
    expect(
      retainedAccessRevealEvent([hqReveal, runCleanup], "evt_access"),
    ).toBeNull();
    expect(
      latestRetainableAccessRevealEvent([hqReveal, runCleanup])?.eventId,
    ).toBe("evt_access");
  });

  it("retains access reveal after an access ambush payment choice resolves", () => {
    const rdReveal = publicEvent("evt_access", "action", {
      actionType: "access_card",
      actor: "runner",
      serverLabel: "R&D",
      cardDefinitionId: "onr_proteus_057_doppelganger-antibody",
      title: "Doppelganger Antibody",
    });
    const ambushPayment = publicEvent("evt_ambush", "action", {
      actionType: "resolve_choice",
      actor: "corp",
      ambushDefinitionId: "onr_proteus_057_doppelganger-antibody",
      ambushPaidCost: 2,
    });

    expect(
      latestRetainableAccessRevealEvent([rdReveal, ambushPayment])?.eventId,
    ).toBe("evt_access");
  });

  it("retains a visible access reveal across turn end until it is dismissed", () => {
    const rdReveal = publicEvent("evt_access", "action", {
      actionType: "access_card",
      actor: "runner",
      serverLabel: "R&D",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation",
    });
    const runnerEndTurn = {
      ...publicEvent("evt_runner_end", "action", {
        actionType: "end_turn",
        actor: "runner",
      }),
      stateVersionAfter: 2,
    };

    expect(
      retainedAccessRevealEvent([rdReveal, runnerEndTurn], null)?.eventId,
    ).toBe("evt_access");
    expect(
      retainedAccessRevealEvent([rdReveal, runnerEndTurn], "evt_access"),
    ).toBeNull();
  });

  it("retains a visible access reveal across access resolution and automatic turn end until it is dismissed", () => {
    const remoteReveal = publicEvent("evt_access", "action", {
      actionType: "access_card",
      actor: "runner",
      serverLabel: "Remote 1",
      cardDefinitionId: "simple_upgrade",
      title: "Simple Upgrade",
    });
    const declineTrash = {
      ...publicEvent("evt_decline", "action", {
        actionType: "decline_trash",
        actor: "runner",
      }),
      stateVersionAfter: 2,
    };
    const runnerEndTurn = {
      ...publicEvent("evt_runner_end", "action", {
        actionType: "end_turn",
        actor: "runner",
      }),
      stateVersionAfter: 3,
    };

    expect(
      retainedAccessRevealEvent(
        [remoteReveal, declineTrash, runnerEndTurn],
        null,
      )?.eventId,
    ).toBe("evt_access");
    expect(
      retainedAccessRevealEvent(
        [remoteReveal, declineTrash, runnerEndTurn],
        "evt_access",
      ),
    ).toBeNull();
  });

  it("does not retain an old access reveal after later turn and Corp action events", () => {
    const access = publicEvent("evt_access", "action", {
      actionType: "access_card",
      actor: "runner",
      serverLabel: "Remote 1",
      cardDefinitionId: "simple_agenda",
      title: "Simple Agenda",
    });
    const runnerEndTurn = {
      ...publicEvent("evt_runner_end", "action", {
        actionType: "end_turn",
        actor: "runner",
      }),
      stateVersionAfter: 2,
    };
    const corpInstall = {
      ...publicEvent("evt_corp_install", "action", {
        actionType: "install_card",
        actor: "corp",
        serverLabel: "Remote 2",
      }),
      stateVersionAfter: 3,
    };

    expect(
      retainedAccessRevealEvent([access, runnerEndTurn, corpInstall], null),
    ).toBeNull();
  });

  it("does not fall back to an older visible reveal after a newer redacted access", () => {
    const visibleRemoteAccess = publicEvent("evt_remote_access", "action", {
      actionType: "access_card",
      actor: "runner",
      serverLabel: "Remote 1",
      cardDefinitionId: "simple_agenda",
      title: "Simple Agenda",
    });
    const redactedRdAccess = publicEvent("evt_rd_access", "action", {
      actionType: "access_card",
      actor: "runner",
      serverLabel: "R&D",
      redactedKind: "accessed_card",
    });

    expect(
      retainedAccessRevealEvent([visibleRemoteAccess, redactedRdAccess], null),
    ).toBeNull();
  });

  it("retains access reveal across same-action public follow-up events", () => {
    const access = publicEvent("evt_access", "action", {
      actionType: "access_card",
      actor: "runner",
      serverLabel: "Remote 1",
      cardDefinitionId: "simple_ambush",
      title: "Simple Ambush",
    });
    const sameActionEffect = {
      ...publicEvent("evt_effect", "effect", {
        actionType: "net_damage",
        actor: "corp",
      }),
      stateVersionAfter: access.stateVersionAfter,
    };

    expect(
      retainedAccessRevealEvent([access, sameActionEffect], null)?.eventId,
    ).toBe("evt_access");
  });

  it("retains expose review events until local dismissal", () => {
    const expose = publicEvent("evt_expose", "action", {
      actionType: "resolve_choice",
      actor: "runner",
      publicRevealKind: "expose",
      publicRevealDefinitionIds: "simple_decoder,simple_fracter",
      exposedServerLabels: "HQ,R&D",
    });
    const followUp = {
      ...publicEvent("evt_followup", "effect", {
        actionType: "gain_credit",
        actor: "runner",
      }),
      stateVersionAfter: 3,
    };
    const smarteye = publicEvent("evt_smarteye", "action", {
      actionType: "trigger_ability",
      actor: "runner",
      publicRevealKind: "expose",
      hiddenZoneAction: "approach_ice_expose",
      publicRevealDefinitionId: "simple_barrier_ice",
    });
    const smarteyeFinish = publicEvent("evt_smarteye_finish", "action", {
      actionType: "trigger_ability",
      actor: "runner",
      approachIceExposeViewDecision: "finish",
      hiddenZoneAction: "approach_ice_expose_finish",
    });
    const jackOut = publicEvent("evt_jack_out", "action", {
      actionType: "jack_out",
      actor: "runner",
    });

    expect(retainedExposeReviewEvent([expose, followUp], null)?.eventId).toBe(
      "evt_expose",
    );
    expect(
      retainedExposeReviewEvent([expose, followUp], "evt_expose"),
    ).toBeNull();
    expect(retainedExposeReviewEvent([smarteye], null)).toBeNull();
    expect(
      retainedExposeReviewEvent([expose, smarteyeFinish], null),
    ).toBeNull();
    expect(retainedExposeReviewEvent([smarteye, jackOut], null)).toBeNull();
  });

  it("detects the active approach-ice viewing target from legal actions", () => {
    const finishViewing = legalAction(
      "runner",
      "trigger_ability",
      "smarteye_1",
      "Smarteye: Ansehen beenden",
      {
        cardId: "smarteye_1",
        iceId: "ice_1",
        approachIceExposeViewDecision: "finish",
      },
      "run.approach_ice",
    );
    const unrelated = legalAction(
      "runner",
      "gain_credit",
      "basic_action",
      "Credit nehmen",
    );

    expect(approachIceExposeViewingIceId([unrelated])).toBeNull();
    expect(approachIceExposeViewingIceId([unrelated, finishViewing])).toBe(
      "ice_1",
    );
  });

  it("does not retain redacted central-access events without the accessed card identity", () => {
    const redactedRdAccess = publicEvent("evt_access", "action", {
      actionType: "access_card",
      actor: "runner",
      serverLabel: "R&D",
      redactedKind: "accessed_card",
    });

    expect(retainedAccessRevealEvent([redactedRdAccess], null)).toBeNull();
  });

  it("explains Red Herrings steal costs when the agenda can be stolen", () => {
    const steal = {
      ...legalAction(
        "runner",
        "steal_agenda",
        "agenda_1",
        "Priority Requisition stehlen",
        {
          cardId: "agenda_1",
          stealAdditionalCost: 5,
          stealCost: 5,
          stealCostSourceTitles: "Red Herrings",
        },
      ),
      costs: [{ credits: 5 }],
    };

    expect(
      accessRevealStatusLabel(
        { type: "agenda" },
        [steal],
        "runner",
        "runner",
        "Remote 1",
      ),
    ).toBe(
      "Remote 1-Zugriff: Red Herrings: 5 Credits zusätzliche Stehlkosten. Diese Agenda kann jetzt gestohlen werden.",
    );
    expect(actionButtonLabel(steal)).toBe(
      "5 Credits wegen Red Herrings bezahlen und Priority Requisition stehlen",
    );
    expect(contextualCardActionLabel(steal)).toBe(
      "5 Credits wegen Red Herrings bezahlen",
    );
  });

  it("explains Red Herrings when the Runner cannot pay the steal cost", () => {
    const decline = legalAction(
      "runner",
      "decline_trash",
      "game_rule",
      "Priority Requisition nicht stehlen",
      {
        cardId: "agenda_1",
        stealAdditionalCost: 5,
        stealCost: 5,
        stealCostSourceTitles: "Red Herrings",
        stealBlockedByCost: true,
      },
    );

    expect(
      accessRevealStatusLabel(
        { type: "agenda" },
        [decline],
        "runner",
        "runner",
        "Remote 1",
      ),
    ).toBe(
      "Remote 1-Zugriff: Red Herrings: 5 Credits zusätzliche Stehlkosten. Du hast nicht genug Credits, um diese Agenda zu stehlen.",
    );
  });
});

function legalAction(
  side: Side,
  type: LegalAction["type"],
  source: LegalAction["source"],
  label: string,
  payload?: LegalAction["payload"],
  timingPoint: LegalAction["timingPoint"] = "corp_action.main",
): LegalAction {
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
    ...(payload ? { payload } : {}),
  };
}

function card(
  instanceId: string,
  title: string,
  type: NonNullable<VisibleCard["type"]>,
  rezzed = true,
): VisibleCard {
  return {
    instanceId,
    known: true,
    title,
    definitionId: instanceId,
    type,
    rezzed,
  };
}

function publicEvent(
  eventId: string,
  type: string,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type,
    stateVersionBefore: 0,
    stateVersionAfter: 1,
    stateHashAfter: `${eventId}_hash`,
    publicPayload,
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
    options: [],
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
      identity: card(
        `${side}_identity`,
        side === "corp" ? "Korp Identity" : "Runner Identity",
        "identity",
      ),
      gripOrHq: [],
      stackOrRdCount: 5,
      heapOrArchives: [],
      scoreArea: [],
      rig: [],
      maxHandSize: 5,
      tags: 0,
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
      identity: card(
        `${side === "corp" ? "runner" : "corp"}_identity`,
        side === "corp" ? "Runner Identity" : "Korp Identity",
        "identity",
      ),
      scoreArea: [],
      rig: [],
    },
    servers: [{ id: "hq", label: "HQ", ice: [], root: [] }],
    publicEvents: [],
    legalActions: [],
    winner: null,
    agendaPointsToWin: 7,
    ...overrides,
  };
}
