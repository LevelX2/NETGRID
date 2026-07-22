import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import {
  normalizedCorpBoardTriageValue,
  semanticRuntimeCorpBoardTriage,
  semanticRuntimeCorpBoardTriageActionComponent,
  type CorpBoardTriageDependencies,
} from "./semantic-runtime-corp-board-triage";
import type { CorpScoringWindowAssessment } from "./semantic-runtime-corp-scoring-window";
import { withDecisionDerivedCache } from "./decision-derived-cache";
import {
  agendaCard,
  assetCard,
  centralServer,
  corpAction,
  corpInput,
  corpRezIceAction,
  earlyWormBreaker,
  fracterBreaker,
  iceCard,
  publicCentralEvent,
  rdVirusCard,
  remoteServer,
  scoringWindow,
  testDependencies,
} from "./semantic-runtime-corp-board-triage.test-support";

describe("semantic runtime corp board triage", () => {
  it("reuses state triage for all action candidates in one decision", () => {
    const input = corpInput({
      legalActions: [],
      servers: [],
    });
    const dependencies = testDependencies();

    const withinDecision = withDecisionDerivedCache(() => [
      semanticRuntimeCorpBoardTriage(input, dependencies),
      semanticRuntimeCorpBoardTriage(input, dependencies),
    ]);
    const nextDecision = withDecisionDerivedCache(() =>
      semanticRuntimeCorpBoardTriage(input, dependencies),
    );

    expect(withinDecision[1]).toBe(withinDecision[0]);
    expect(nextDecision).not.toBe(withinDecision[0]);
    expect(nextDecision).toEqual(withinDecision[0]);
  });

  it("protects an open central before creating the first empty remote", () => {
    const corticalScrub = iceCard("cortical-scrub", {
      definitionId: "onr_v1_231_cortical-scrub",
      title: "Cortical Scrub",
      subtypes: ["Sentry"],
      rulesText: "Do 1 core damage. End the run.",
    });
    const installRd = corpAction(
      "install-cortical-rd",
      "install_card",
      { placement: "ice", serverId: "rd" },
      corticalScrub.instanceId,
    );
    const installRemote = corpAction(
      "install-cortical-new-remote",
      "install_card",
      { placement: "ice", serverId: "new_remote" },
      corticalScrub.instanceId,
    );
    const input = corpInput({
      actionNumber: 4,
      corpHq: [corticalScrub],
      legalActions: [installRd, installRemote],
      servers: [centralServer("hq", []), centralServer("rd", [])],
    });

    const triage = semanticRuntimeCorpBoardTriage(input, testDependencies());

    expect(triage).toMatchObject({
      primary: "protect_rd",
      severity: "high",
      targetServerId: "rd",
    });
    expect(triage.evidence).toContain(
      "corp_board_triage_opening_central_baseline:true",
    );
  });

  it("normalizes boardstate triage values into the AI-COMPLETE-17 consumer scale", () => {
    expect(normalizedCorpBoardTriageValue(0)).toBe(0);
    expect(normalizedCorpBoardTriageValue(850)).toBe(17);
    expect(normalizedCorpBoardTriageValue(1200)).toBe(24);
    expect(normalizedCorpBoardTriageValue(-2200)).toBe(-44);
    expect(normalizedCorpBoardTriageValue(-4200)).toBe(-84);
    expect(normalizedCorpBoardTriageValue(7000)).toBe(100);
  });

  it("treats purge as a hard mismatch while a critical scoring remote needs protection", () => {
    const purge = corpAction("purge", "purge_runner_virus_counters");
    const scoreline = corpAction("remote-scoreline", "advance_card", {
      serverId: "remote_1",
    });
    const input = corpInput({
      legalActions: [scoreline, purge],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [iceCard("rd-ice")]),
        remoteServer("remote_1", [iceCard("remote-ice")], [agendaCard()]),
      ],
    });

    const component = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      purge,
      testDependencies({
        scoringWindowByActionId: {
          [scoreline.actionId]: scoringWindow({
            serverId: "remote_1",
            windowKind: "unsafe",
            agendaStealSeverity: "game_ending",
            recommendedNextStep: "build_remote_ice",
          }),
        },
      }),
    );

    expect(component).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -3200,
    });
    expect(component?.reason).toContain("triage_primary:protect_score_remote");
    expect(component?.reason).toContain(
      "triage_action:purge_runner_virus_counters",
    );
  });

  it("lets critical repeated R&D pressure override remote-protection triage", () => {
    const purge = corpAction("purge", "purge_runner_virus_counters");
    const remoteScoreline = corpAction("remote-scoreline", "advance_card", {
      serverId: "remote_1",
    });
    const rdIce = corpAction("install-rd-ice", "install_card", {
      placement: "ice",
      serverId: "rd",
    });
    const input = corpInput({
      runnerAgendaPoints: 5,
      runnerRig: [rdVirusCard("highlighter")],
      legalActions: [remoteScoreline, rdIce, purge],
      eventTail: [
        publicCentralEvent("rd-run-1", "start_run", "rd"),
        publicCentralEvent("rd-access-1", "access_card", "rd"),
        publicCentralEvent("rd-run-2", "start_run", "rd"),
        publicCentralEvent("rd-access-2", "access_card", "rd"),
      ],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", []),
        remoteServer("remote_1", [iceCard("remote-ice")], [agendaCard()]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteScoreline.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "unsafe",
          agendaStealSeverity: "game_ending",
          recommendedNextStep: "build_remote_ice",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const purgeComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      purge,
      dependencies,
    );
    const rdIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      rdIce,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_rd",
      severity: "critical",
      targetServerId: "rd",
    });
    expect(triage.evidence).toContain(
      "corp_board_triage_central_override:pre_score_rd_exposure",
    );
    expect(purgeComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -3200,
    });
    expect(rdIceComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
  });

  it("persists critical R&D defense by drawing for protection when no ICE action is legal", () => {
    const draw = corpAction("draw-defense", "draw_card");
    const credit = corpAction("gain-credit", "gain_credit");
    const purge = corpAction("purge", "purge_runner_virus_counters");
    const input = corpInput({
      corpCredits: 5,
      runnerRig: [rdVirusCard("highlighter")],
      legalActions: [draw, credit, purge],
      eventTail: [
        publicCentralEvent("rd-run-1", "start_run", "rd"),
        publicCentralEvent("rd-access-1", "access_card", "rd"),
        publicCentralEvent("rd-run-2", "start_run", "rd"),
        publicCentralEvent("rd-access-2", "access_card", "rd"),
        publicCentralEvent("rd-run-3", "start_run", "rd"),
        publicCentralEvent("rd-access-3", "access_card", "rd"),
      ],
      servers: [centralServer("hq", []), centralServer("rd", [])],
    });
    const dependencies = testDependencies();

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const drawComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      draw,
      dependencies,
    );
    const creditComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      credit,
      dependencies,
    );
    const purgeComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      purge,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_rd",
      severity: "critical",
      targetServerId: "rd",
    });
    expect(triage.evidence).toContain(
      "corp_board_triage_central_defense_acquisition:true",
    );
    expect(triage.evidence).toContain(
      "corp_board_triage_repeated_central_access:true",
    );
    expect(drawComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(creditComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
    expect(purgeComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
  });

  it("does not let repeated non-game-ending R&D pressure override a playable active scoreline", () => {
    const remoteScoreline = corpAction("remote-scoreline", "advance_card", {
      serverId: "remote_1",
    });
    const rdIce = corpAction("install-rd-ice", "install_card", {
      placement: "ice",
      serverId: "rd",
    });
    const punishAbility = corpAction(
      "netwatch-trace",
      "activated_card_ability",
    );
    const input = corpInput({
      runnerAgendaPoints: 0,
      legalActions: [remoteScoreline, rdIce, punishAbility],
      eventTail: [
        publicCentralEvent("rd-run-1", "start_run", "rd"),
        publicCentralEvent("rd-access-1", "access_card", "rd"),
        publicCentralEvent("rd-run-2", "start_run", "rd"),
        publicCentralEvent("rd-access-2", "access_card", "rd"),
        publicCentralEvent("rd-run-3", "start_run", "rd"),
        publicCentralEvent("rd-access-3", "access_card", "rd"),
      ],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", []),
        remoteServer("remote_1", [iceCard("remote-ice")], [agendaCard()]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteScoreline.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "durable",
          runnerCanContestNow: false,
          runnerCanReachAccessNow: false,
          agendaStealRelevantNow: false,
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "normal",
          runnerAgendaPointsAfterSteal: 2,
          affordableDurableRelevantIceCount: 1,
          dynamicProtectionWeaknessCount: 0,
          corpCanRezFullPathWithDynamicReserve: true,
          corpCanRezRelevantIce: true,
          recommendedNextStep: "advance",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const scorelineComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteScoreline,
      dependencies,
    );
    const rdIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      rdIce,
      dependencies,
    );
    const punishComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      punishAbility,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "force_scoreline_clock",
      severity: "high",
      targetServerId: "remote_1",
    });
    expect(triage.evidence).toContain("corp_active_scoreline_clock:true");
    expect(triage.evidence).not.toContain(
      "corp_board_triage_central_override:pre_score_rd_exposure",
    );
    expect(scorelineComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(rdIceComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
    expect(punishComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
  });

  it("protects the open R&D first layer before adding protection for an HQ agenda", () => {
    const hostileTakeover = agendaCard("hostile-takeover", 1);
    const installAgenda = corpAction(
      "install-hostile-remote",
      "install_card",
      { placement: "root", serverId: "remote_1" },
      hostileTakeover.instanceId,
    );
    const installRdIce = corpAction(
      "install-quandary-rd",
      "install_card",
      { placement: "ice", serverId: "rd" },
      "quandary",
    );
    const installRemoteIce = corpAction(
      "install-quandary-remote",
      "install_card",
      { placement: "ice", serverId: "remote_1" },
      "quandary",
    );
    const quandary = iceCard("quandary", {
      definitionId: "onr_v1_261_quandary",
      title: "Quandary",
      rezCost: 2,
      rulesText: "End the run.",
    });
    const input = corpInput({
      runnerAgendaPoints: 3,
      corpHq: [hostileTakeover, quandary],
      legalActions: [installAgenda, installRdIce, installRemoteIce],
      eventTail: [
        publicCentralEvent("rd-run-1", "start_run", "rd"),
        publicCentralEvent("rd-access-1", "access_card", "rd"),
        publicCentralEvent("rd-run-2", "start_run", "rd"),
        publicCentralEvent("rd-access-2", "access_card", "rd"),
      ],
      servers: [
        centralServer("hq", [iceCard("hq-stop")]),
        centralServer("rd", []),
        remoteServer("remote_1", [iceCard("remote-filter")], []),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [installAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          scoreHorizon: "next_turn",
          windowKind: "unsafe",
          runnerCanContestBeforeScore: true,
          runnerCanReachAccessBeforeScore: true,
          agendaStealRelevantBeforeScore: true,
          agendaStealSeverity: "normal",
          runnerAgendaPointsAfterSteal: 4,
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: true,
          recommendedNextStep: "build_remote_ice",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const rdComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      installRdIce,
      dependencies,
    );
    const remoteComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      installRemoteIce,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_rd",
      severity: "high",
      targetServerId: "rd",
    });
    expect(triage.evidence).toEqual(
      expect.arrayContaining([
        "corp_board_triage_central_override:first_layer_before_speculative_remote",
        "corp_board_triage_repeated_central_access:true",
      ]),
    );
    expect(rdComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(remoteComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
  });

  it("keeps an immediate scoreline conversion ahead of repeated R&D pressure", () => {
    const fastAgenda = agendaCard("fast-agenda", 1);
    const installAgenda = corpAction(
      "install-fast-agenda",
      "install_card",
      { placement: "root", serverId: "remote_1" },
      fastAgenda.instanceId,
    );
    const installRdIce = corpAction("install-rd-ice", "install_card", {
      placement: "ice",
      serverId: "rd",
    });
    const input = corpInput({
      corpHq: [fastAgenda],
      legalActions: [installAgenda, installRdIce],
      eventTail: [
        publicCentralEvent("rd-run-1", "start_run", "rd"),
        publicCentralEvent("rd-access-1", "access_card", "rd"),
        publicCentralEvent("rd-run-2", "start_run", "rd"),
        publicCentralEvent("rd-access-2", "access_card", "rd"),
      ],
      servers: [
        centralServer("hq", [iceCard("hq-stop")]),
        centralServer("rd", []),
        remoteServer("remote_1", [iceCard("remote-stop")], []),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [installAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          scoreHorizon: "immediate",
          windowKind: "unsafe",
          runnerCanContestBeforeScore: true,
          runnerCanReachAccessBeforeScore: true,
          agendaStealRelevantBeforeScore: true,
          agendaStealSeverity: "normal",
          runnerAgendaPointsAfterSteal: 1,
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: true,
          recommendedNextStep: "build_remote_ice",
        }),
      },
    });

    expect(
      semanticRuntimeCorpBoardTriage(input, dependencies).primary,
    ).not.toBe("protect_rd");
  });

  it("does not override an active scoreline when R&D already has effective stop ICE", () => {
    const remoteScoreline = corpAction("remote-scoreline", "advance_card", {
      serverId: "remote_1",
    });
    const rdIce = corpAction("install-rd-extra-ice", "install_card", {
      placement: "ice",
      serverId: "rd",
    });
    const remoteIce = corpAction("install-remote-ice", "install_card", {
      placement: "ice",
      serverId: "remote_1",
    });
    const input = {
      ...corpInput({
        runnerAgendaPoints: 5,
        runnerRig: [rdVirusCard("highlighter")],
        legalActions: [remoteScoreline, rdIce, remoteIce],
        eventTail: [
          publicCentralEvent("rd-run-1", "start_run", "rd"),
          publicCentralEvent("rd-access-1", "access_card", "rd"),
          publicCentralEvent("rd-run-2", "start_run", "rd"),
          publicCentralEvent("rd-access-2", "access_card", "rd"),
        ],
        servers: [
          centralServer("hq", [iceCard("hq-ice")]),
          centralServer("rd", [
            iceCard("rd-stop-1", { rezzed: false }),
            iceCard("rd-stop-2", { rezzed: false }),
            iceCard("rd-stop-3", { rezzed: false }),
          ]),
          remoteServer("remote_1", [iceCard("remote-ice")], [agendaCard()]),
        ],
      }),
      ownCorpStrategicIntent: {
        primaryWinIntent: "corp.score_agendas",
        scorePlan: ["corp.remote_scoreline"],
      },
    } as unknown as AiDecisionInput;
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteScoreline.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "temporary_safe",
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "near_win",
          affordableDurableRelevantIceCount: 1,
          dynamicProtectionWeaknessCount: 0,
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: true,
          recommendedNextStep: "score",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const rdIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      rdIce,
      dependencies,
    );
    const remoteIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteIce,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_score_remote",
      severity: "high",
      targetServerId: "remote_1",
    });
    expect(triage.evidence).toContain(
      "corp_board_triage_primary:protect_score_remote",
    );
    expect(rdIceComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -5200,
    });
    expect(remoteIceComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
  });

  it("penalizes off-target HQ ice hard enough while a score remote needs protection", () => {
    const remoteScoreline = corpAction("remote-scoreline", "advance_card", {
      serverId: "remote_1",
    });
    const hqIce = {
      ...corpAction("install-hq-extra-ice", "install_card", {
        placement: "ice",
        serverId: "hq",
      }),
      source: "hq-extra-ice",
    } as LegalAction;
    const remoteWall = {
      ...corpAction("install-remote-wall", "install_card", {
        placement: "ice",
        serverId: "remote_1",
      }),
      source: "remote-wall",
    } as LegalAction;
    const input = {
      ...corpInput({
        corpCredits: 13,
        corpHq: [
          agendaCard("hq-agenda", 3),
          iceCard("hq-extra-ice", {
            title: "HQ Extra ICE",
            rulesText: "End the run.",
            rezCost: 3,
          }),
          iceCard("remote-wall", {
            title: "Remote Wall",
            rulesText: "End the run.",
            rezCost: 2,
          }),
        ],
        legalActions: [remoteScoreline, hqIce, remoteWall],
        servers: [
          centralServer("hq", [
            iceCard("hq-ice-1"),
            iceCard("hq-ice-2"),
            iceCard("hq-ice-3"),
          ]),
          centralServer("rd", [iceCard("rd-ice")]),
          remoteServer(
            "remote_1",
            [iceCard("remote-ice-1"), iceCard("remote-ice-2")],
            [agendaCard("remote-agenda", 3)],
          ),
        ],
      }),
      ownCorpStrategicIntent: {
        primaryWinIntent: "corp.score_agendas",
        scorePlan: ["corp.remote_scoreline"],
      },
    } as unknown as AiDecisionInput;
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteScoreline.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "temporary_safe",
          runnerCanContestBeforeScore: true,
          runnerCanReachAccessBeforeScore: true,
          agendaStealRelevantBeforeScore: true,
          agendaStealSeverity: "near_win",
          runnerAgendaPointsAfterSteal: 6,
          affordableDurableRelevantIceCount: 1,
          dynamicProtectionWeaknessCount: 0,
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: true,
          recommendedNextStep: "build_remote_ice",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const hqComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      hqIce,
      dependencies,
    );
    const remoteComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteWall,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_score_remote",
      severity: "high",
      targetServerId: "remote_1",
    });
    expect(hqComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -5200,
    });
    expect(hqComponent?.reason).toContain("triage_action_server:hq");
    expect(hqComponent?.reason).toContain("triage_target:remote_1");
    expect(remoteComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
  });

  it("does not align non-stopping tag ICE as score-remote protection", () => {
    const remoteScoreline = corpAction("remote-scoreline", "advance_card", {
      serverId: "remote_1",
    });
    const remoteHunter = {
      ...corpAction("install-remote-hunter", "install_card", {
        placement: "ice",
        serverId: "remote_1",
      }),
      source: "remote-hunter",
    } as LegalAction;
    const remoteWall = {
      ...corpAction("install-remote-wall", "install_card", {
        placement: "ice",
        serverId: "remote_1",
      }),
      source: "remote-wall",
    } as LegalAction;
    const input = corpInput({
      corpHq: [
        iceCard("remote-hunter", {
          title: "Hunter",
          definitionId: "onr_v1_249_hunter",
          subtypes: ["Sentry"],
          rulesText: "Trace 3 - Give the Runner one tag.",
          rezCost: 1,
        }),
        iceCard("remote-wall", {
          title: "Remote Wall",
          definitionId: "onr_v1_279_wall-of-static",
          subtypes: ["Wall"],
          rulesText: "End the run.",
          rezCost: 2,
        }),
      ],
      legalActions: [remoteScoreline, remoteHunter, remoteWall],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [iceCard("rd-ice")]),
        remoteServer("remote_1", [iceCard("remote-ice")], [agendaCard()]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteScoreline.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "unsafe",
          agendaStealSeverity: "game_ending",
          recommendedNextStep: "build_remote_ice",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const hunterComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteHunter,
      dependencies,
    );
    const wallComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteWall,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_score_remote",
      targetServerId: "remote_1",
    });
    expect(hunterComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
    expect(hunterComponent?.reason).toContain(
      "triage_primary:protect_score_remote",
    );
    expect(wallComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
  });

  it("lets a remote-scoring deck build a score remote instead of overlayering an already stopped central", () => {
    const rdIce = corpAction("install-rd-extra-ice", "install_card", {
      placement: "ice",
      serverId: "rd",
    });
    const remoteIce = corpAction("install-remote-ice", "install_card", {
      placement: "ice",
      serverId: "remote_1",
    });
    const input = {
      ...corpInput({
        runnerAgendaPoints: 3,
        runnerRig: [rdVirusCard("highlighter")],
        legalActions: [rdIce, remoteIce],
        eventTail: [
          publicCentralEvent("rd-run-1", "start_run", "rd"),
          publicCentralEvent("rd-access-1", "access_card", "rd"),
        ],
        servers: [
          centralServer("hq", [iceCard("hq-ice")]),
          centralServer("rd", [iceCard("rd-stop", { rezzed: false })]),
          remoteServer("remote_1", []),
        ],
      }),
      ownCorpStrategicIntent: {
        primaryWinIntent: "corp.score_agendas",
        scorePlan: ["corp.remote_scoreline"],
      },
    } as unknown as AiDecisionInput;
    const dependencies = testDependencies();

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const rdIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      rdIce,
      dependencies,
    );
    const remoteIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteIce,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "setup_score_remote",
      severity: "medium",
      targetServerId: "remote_1",
    });
    expect(triage.evidence).toContain(
      "corp_board_triage_deck_strategy:remote_score_development",
    );
    expect(rdIceComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -1600,
    });
    expect(remoteIceComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
  });

  it("does not let critical R&D history overlayer an already stopped central before remote setup", () => {
    const rdIce = corpAction("install-rd-extra-ice", "install_card", {
      placement: "ice",
      serverId: "rd",
    });
    const remoteIce = corpAction("install-remote-ice", "install_card", {
      placement: "ice",
      serverId: "remote_1",
    });
    const input = {
      ...corpInput({
        runnerAgendaPoints: 5,
        runnerRig: [rdVirusCard("highlighter")],
        legalActions: [rdIce, remoteIce],
        eventTail: [
          publicCentralEvent("rd-run-1", "start_run", "rd"),
          publicCentralEvent("rd-access-1", "access_card", "rd"),
          publicCentralEvent("rd-run-2", "start_run", "rd"),
          publicCentralEvent("rd-access-2", "access_card", "rd"),
        ],
        servers: [
          centralServer("hq", [iceCard("hq-ice")]),
          centralServer("rd", [iceCard("rd-stop", { rezzed: false })]),
          remoteServer("remote_1", []),
        ],
      }),
      ownCorpStrategicIntent: {
        primaryWinIntent: "corp.score_agendas",
        scorePlan: ["corp.remote_scoreline"],
      },
    } as unknown as AiDecisionInput;
    const dependencies = testDependencies();

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const rdIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      rdIce,
      dependencies,
    );
    const remoteIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteIce,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "setup_score_remote",
      severity: "medium",
      targetServerId: "remote_1",
    });
    expect(triage.evidence).toContain(
      "corp_board_triage_deck_strategy:remote_score_development",
    );
    expect(triage.evidence).not.toContain(
      "corp_board_triage_primary:protect_rd",
    );
    expect(rdIceComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -1600,
    });
    expect(remoteIceComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
  });

  it("does not let secondary remote score support make a punish deck build a speculative score remote", () => {
    const rdIce = corpAction("install-rd-extra-ice", "install_card", {
      placement: "ice",
      serverId: "rd",
    });
    const remoteIce = corpAction("install-remote-ice", "install_card", {
      placement: "ice",
      serverId: "remote_1",
    });
    const input = {
      ...corpInput({
        runnerAgendaPoints: 3,
        legalActions: [rdIce, remoteIce],
        servers: [
          centralServer("hq", [iceCard("hq-ice")]),
          centralServer("rd", [iceCard("rd-stop", { rezzed: false })]),
          remoteServer("remote_1", []),
        ],
      }),
      ownCorpStrategicIntent: {
        primaryWinIntent: "corp.punish_runner",
        scorePlan: ["corp.remote_scoreline"],
        punishPlan: ["corp.damage_kill", "corp.tag_trace_punish"],
      },
    } as unknown as AiDecisionInput;
    const dependencies = testDependencies();

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const remoteIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteIce,
      dependencies,
    );

    expect(triage.primary).not.toBe("setup_score_remote");
    expect(triage.evidence).not.toContain(
      "corp_board_triage_deck_strategy:remote_score_development",
    );
    expect(remoteIceComponent?.key).not.toBe("corp_board_triage_alignment");
  });

  it("does not force noncritical HQ-flood scoreline conversion for a punish-primary deck", () => {
    const remoteAgenda = corpAction("remote-scoreline", "install_card", {
      placement: "root",
      serverId: "remote_1",
    });
    const punishAbility = corpAction(
      "punish-ability",
      "activated_card_ability",
    );
    const input = {
      ...corpInput({
        corpHq: [agendaCard("hq-agenda-1", 2), agendaCard("hq-agenda-2", 2)],
        corpCredits: 8,
        runnerAgendaPoints: 3,
        legalActions: [remoteAgenda, punishAbility],
        servers: [
          centralServer("hq", [iceCard("hq-ice")]),
          centralServer("rd", [iceCard("rd-ice")]),
          remoteServer("remote_1", [iceCard("remote-ice")]),
        ],
      }),
      ownCorpStrategicIntent: {
        primaryWinIntent: "corp.punish_runner",
        scorePlan: ["corp.remote_scoreline"],
        punishPlan: ["corp.damage_kill", "corp.tag_trace_punish"],
      },
    } as unknown as AiDecisionInput;
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "durable",
          runnerCanContestNow: false,
          runnerCanReachAccessNow: false,
          agendaStealRelevantNow: false,
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "normal",
          runnerAgendaPointsAfterSteal: 5,
          affordableDurableRelevantIceCount: 1,
          dynamicProtectionWeaknessCount: 0,
          corpCanRezFullPathWithDynamicReserve: true,
          corpCanRezRelevantIce: true,
          recommendedNextStep: "score",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const punishComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      punishAbility,
      dependencies,
    );

    expect(triage.primary).not.toBe("force_scoreline_clock");
    expect(triage.evidence).not.toContain("corp_hq_agenda_flood_pressure:true");
    expect(punishComponent?.key).not.toBe("corp_board_triage_mismatch");
  });

  it("does not treat a none score window as remote funding over remote setup", () => {
    const remoteAgenda = corpAction("remote-scoreline", "install_card", {
      placement: "root",
      serverId: "remote_1",
    });
    const hqIce = corpAction("install-hq-ice", "install_card", {
      placement: "ice",
      serverId: "hq",
    });
    const remoteIce = corpAction("install-remote-ice", "install_card", {
      placement: "ice",
      serverId: "remote_1",
    });
    const gainCredit = corpAction("gain-credit", "gain_credit");
    const input = corpInput({
      corpHq: [agendaCard("hq-agenda-1", 2)],
      corpCredits: 5,
      legalActions: [remoteAgenda, hqIce, remoteIce, gainCredit],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [iceCard("rd-ice")]),
        remoteServer("remote_1", []),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "none",
          scoreHorizon: "unknown",
          runnerCanContestNow: false,
          runnerCanReachAccessNow: false,
          agendaStealRelevantNow: false,
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "none",
          runnerAgendaPointsAfterSteal: 0,
          affordableDurableRelevantIceCount: 0,
          dynamicProtectionWeaknessCount: 0,
          dynamicProtectionReserve: 0,
          corpCanRezRelevantIce: false,
          corpCanRezFullPathWithDynamicReserve: false,
          recommendedNextStep: "gain_credit",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const hqIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      hqIce,
      dependencies,
    );
    const remoteIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteIce,
      dependencies,
    );
    const creditComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      gainCredit,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "setup_score_remote",
      severity: "medium",
      targetServerId: "remote_1",
    });
    expect(triage.evidence).not.toContain(
      "corp_board_triage_primary:fund_score_remote",
    );
    expect(hqIceComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -1200,
    });
    expect(remoteIceComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(creditComponent).toMatchObject({
      key: "corp_board_triage_context",
    });
  });

  it("funds a remote scoreline when scoring-window evidence has a zero dynamic reserve but relevant ICE is unaffordable", () => {
    const remoteAgenda = {
      ...corpAction("remote-scoreline", "install_card", {
        placement: "root",
        serverId: "new_remote",
      }),
      source: "hq-agenda",
    } as LegalAction;
    const remoteIce = {
      ...corpAction("install-new-remote-ice", "install_card", {
        placement: "ice",
        serverId: "new_remote",
      }),
      source: "expensive-ice",
    } as LegalAction;
    const gainCredit = corpAction("gain-credit", "gain_credit");
    const input = corpInput({
      corpCredits: 3,
      runnerAgendaPoints: 3,
      corpHq: [
        agendaCard("hq-agenda", 3),
        iceCard("expensive-ice", { rezCost: 7 }),
      ],
      legalActions: [remoteAgenda, remoteIce, gainCredit],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [iceCard("rd-ice")]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "new_remote",
          windowKind: "unsafe",
          runnerCanContestNow: true,
          runnerCanReachAccessNow: true,
          agendaStealRelevantNow: true,
          runnerCanContestBeforeScore: true,
          runnerCanReachAccessBeforeScore: true,
          agendaStealRelevantBeforeScore: true,
          agendaStealSeverity: "near_win",
          runnerAgendaPointsAfterSteal: 6,
          dynamicProtectionReserve: 0,
          corpCanRezRelevantIce: false,
          corpCanRezFullPathWithDynamicReserve: false,
          recommendedNextStep: "gain_credit",
          evidence: [
            "remote_rez_budget:credits_after_action:3",
            "remote_rez_budget:pre_exposure_advancement_credit_reserve:0",
            "remote_rez_budget:min_relevant_rez_cost:7",
            "remote_rez_budget:full_relevant_path_rez_cost:7",
            "remote_rez_budget:full_relevant_path_with_dynamic_reserve:7",
          ],
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const creditComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      gainCredit,
      dependencies,
    );
    const iceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteIce,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "fund_score_remote",
      severity: "high",
      targetServerId: "new_remote",
      requiredRezFloor: 7,
      currentCredits: 3,
    });
    expect(creditComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(iceComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
  });

  it("uses same-target ICE install candidates as funding floor when a new remote scoreline has no ICE evidence yet", () => {
    const remoteAgenda = {
      ...corpAction("remote-scoreline", "install_card", {
        placement: "root",
        serverId: "new_remote",
      }),
      source: "hq-agenda",
    } as LegalAction;
    const remoteIce = {
      ...corpAction("install-new-remote-ice", "install_card", {
        placement: "ice",
        serverId: "new_remote",
      }),
      source: "expensive-ice",
    } as LegalAction;
    const gainCredit = corpAction("gain-credit", "gain_credit");
    const input = corpInput({
      corpCredits: 3,
      runnerAgendaPoints: 3,
      corpHq: [
        agendaCard("hq-agenda", 3),
        iceCard("expensive-ice", { rezCost: 7 }),
      ],
      legalActions: [remoteAgenda, remoteIce, gainCredit],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [iceCard("rd-ice")]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "new_remote",
          windowKind: "unsafe",
          runnerCanContestNow: true,
          runnerCanReachAccessNow: true,
          agendaStealRelevantNow: true,
          runnerCanContestBeforeScore: true,
          runnerCanReachAccessBeforeScore: true,
          agendaStealRelevantBeforeScore: true,
          agendaStealSeverity: "near_win",
          runnerAgendaPointsAfterSteal: 6,
          dynamicProtectionReserve: 0,
          corpCanRezRelevantIce: false,
          corpCanRezFullPathWithDynamicReserve: false,
          recommendedNextStep: "gain_credit",
          evidence: ["remote_rez_budget:no_ice"],
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const creditComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      gainCredit,
      dependencies,
    );
    const iceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteIce,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "fund_score_remote",
      targetServerId: "new_remote",
      requiredRezFloor: 7,
      currentCredits: 3,
    });
    expect(creditComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(iceComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
  });

  it("funds an existing score remote before protection when the full path floor is unmet", () => {
    const remoteAgenda = {
      ...corpAction("remote-scoreline", "install_card", {
        placement: "root",
        serverId: "remote_1",
      }),
      source: "hq-agenda",
    } as LegalAction;
    const remoteIce = {
      ...corpAction("install-more-remote-ice", "install_card", {
        placement: "ice",
        serverId: "remote_1",
      }),
      source: "expensive-ice",
    } as LegalAction;
    const gainCredit = corpAction("gain-credit", "gain_credit");
    const input = corpInput({
      corpCredits: 5,
      runnerAgendaPoints: 6,
      corpHq: [
        agendaCard("hq-agenda", 4),
        iceCard("expensive-ice", { rezCost: 5 }),
      ],
      legalActions: [remoteAgenda, remoteIce, gainCredit],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [iceCard("rd-ice")]),
        remoteServer("remote_1", [
          iceCard("remote-ice", { rezCost: 3, rezzed: false }),
        ]),
      ],
    });
    const dependencies = testDependencies({
      actionCreditCost: (action) =>
        action.actionId === remoteIce.actionId ? 3 : 0,
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "unsafe",
          runnerCanContestNow: false,
          runnerCanReachAccessNow: false,
          agendaStealRelevantNow: false,
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "game_ending",
          runnerAgendaPointsAfterSteal: 10,
          missingVisibleBreakerCoverage: true,
          affordableDurableRelevantIceCount: 1,
          dynamicProtectionWeaknessCount: 0,
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: false,
          recommendedNextStep: "build_remote_ice",
          evidence: [
            "remote_rez_budget:credits_after_action:5",
            "remote_rez_budget:pre_exposure_advancement_credit_reserve:0",
            "remote_rez_budget:min_relevant_rez_cost:0",
            "remote_rez_budget:full_relevant_path_rez_cost:6",
            "remote_rez_budget:full_relevant_path_with_dynamic_reserve:6",
          ],
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const creditComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      gainCredit,
      dependencies,
    );
    const iceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteIce,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "fund_score_remote",
      severity: "critical",
      targetServerId: "remote_1",
      requiredRezFloor: 8,
      currentCredits: 5,
    });
    expect(creditComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(iceComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
  });

  it("aligns same-target R&D rez under critical protect-rd triage", () => {
    const rdRez = corpRezIceAction("rez-rd-quandary", "rd-ice", 2);
    const declineRez = corpAction("decline-rez", "decline_rez");
    const input = corpInput({
      runnerAgendaPoints: 5,
      legalActions: [rdRez, declineRez],
      eventTail: [
        publicCentralEvent("rd-run-1", "start_run", "rd"),
        publicCentralEvent("rd-access-1", "access_card", "rd"),
        publicCentralEvent("rd-run-2", "start_run", "rd"),
        publicCentralEvent("rd-access-2", "access_card", "rd"),
      ],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [
          iceCard("rd-ice", {
            definitionId: "onr_v1_261_quandary",
            title: "Quandary",
          }),
        ]),
      ],
    });
    const dependencies = testDependencies();

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const rezComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      rdRez,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_rd",
      severity: "critical",
      targetServerId: "rd",
    });
    expect(rezComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(rezComponent?.reason).toContain("triage_action:rez_ice");
    expect(rezComponent?.reason).toContain("triage_action_server:rd");
  });

  it("aligns same-target R&D tax rez when visible breaker coverage still pays through ETR", () => {
    const rdRez = corpRezIceAction("rez-rd-wall", "rd-wall", 3);
    const declineRez = corpAction("decline-rez", "decline_rez");
    const input = corpInput({
      runnerAgendaPoints: 5,
      runnerRig: [earlyWormBreaker()],
      legalActions: [rdRez, declineRez],
      eventTail: [
        publicCentralEvent("rd-run-1", "start_run", "rd"),
        publicCentralEvent("rd-access-1", "access_card", "rd"),
        publicCentralEvent("rd-run-2", "start_run", "rd"),
        publicCentralEvent("rd-access-2", "access_card", "rd"),
      ],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [
          iceCard("rd-wall", {
            definitionId: "onr_v1_279_wall-of-static",
            title: "Wall of Static",
            subtypes: ["wall"],
          }),
        ]),
      ],
    });
    const dependencies = testDependencies();

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const rezComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      rdRez,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_rd",
      severity: "critical",
      targetServerId: "rd",
    });
    expect(rezComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(rezComponent?.reason).toContain("triage_action:rez_ice");
    expect(rezComponent?.reason).toContain("triage_action_server:rd");
  });

  it("does not let non-stopping R&D ICE trigger critical central override over a playable scoreline", () => {
    const remoteAgenda = {
      ...corpAction("remote-scoreline", "install_card", {
        placement: "root",
        serverId: "remote_1",
      }),
      source: "hq-agenda",
    } as LegalAction;
    const rdHunter = {
      ...corpAction("install-rd-hunter", "install_card", {
        placement: "ice",
        serverId: "rd",
      }),
      source: "rd-hunter",
    } as LegalAction;
    const input = corpInput({
      corpHq: [
        agendaCard("hq-agenda", 2),
        iceCard("rd-hunter", {
          title: "Hunter",
          definitionId: "onr_v1_249_hunter",
          subtypes: ["Sentry"],
          rulesText: "Trace 3 - Give the Runner one tag.",
        }),
      ],
      legalActions: [remoteAgenda, rdHunter],
      eventTail: [
        publicCentralEvent("rd-run-1", "start_run", "rd"),
        publicCentralEvent("rd-access-1", "access_card", "rd"),
        publicCentralEvent("rd-run-2", "start_run", "rd"),
        publicCentralEvent("rd-access-2", "access_card", "rd"),
        publicCentralEvent("rd-run-3", "start_run", "rd"),
        publicCentralEvent("rd-access-3", "access_card", "rd"),
      ],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", []),
        remoteServer("remote_1", [iceCard("remote-ice")]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "durable",
          runnerCanContestNow: false,
          runnerCanReachAccessNow: false,
          agendaStealRelevantNow: false,
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "normal",
          affordableDurableRelevantIceCount: 1,
          dynamicProtectionWeaknessCount: 0,
          corpCanRezFullPathWithDynamicReserve: true,
          corpCanRezRelevantIce: true,
          recommendedNextStep: "score",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const remoteComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteAgenda,
      dependencies,
    );
    const hunterComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      rdHunter,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "force_scoreline_clock",
      targetServerId: "remote_1",
    });
    expect(triage.evidence).not.toContain(
      "corp_board_triage_central_override:pre_score_rd_exposure",
    );
    expect(remoteComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(hunterComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
  });

  it("does not let zero-effect R&D ETR ICE trigger critical central override over a playable scoreline", () => {
    const remoteAgenda = {
      ...corpAction("remote-scoreline", "install_card", {
        placement: "root",
        serverId: "remote_1",
      }),
      source: "hq-agenda",
    } as LegalAction;
    const rdWall = {
      ...corpAction("install-rd-wall", "install_card", {
        placement: "ice",
        serverId: "rd",
      }),
      source: "rd-wall",
    } as LegalAction;
    const input = corpInput({
      runnerAgendaPoints: 5,
      runnerRig: [fracterBreaker()],
      corpHq: [
        agendaCard("hq-agenda", 2),
        iceCard("rd-wall", {
          title: "R&D Wall",
          definitionId: "onr_v1_279_wall-of-static",
          subtypes: ["Wall"],
          rulesText: "*End the run.",
          rezCost: 0,
        }),
      ],
      legalActions: [remoteAgenda, rdWall],
      eventTail: [
        publicCentralEvent("rd-run-1", "start_run", "rd"),
        publicCentralEvent("rd-access-1", "access_card", "rd"),
        publicCentralEvent("rd-run-2", "start_run", "rd"),
        publicCentralEvent("rd-access-2", "access_card", "rd"),
        publicCentralEvent("rd-run-3", "start_run", "rd"),
        publicCentralEvent("rd-access-3", "access_card", "rd"),
      ],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", []),
        remoteServer("remote_1", [iceCard("remote-ice")]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "durable",
          runnerCanContestNow: false,
          runnerCanReachAccessNow: false,
          agendaStealRelevantNow: false,
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "normal",
          affordableDurableRelevantIceCount: 1,
          dynamicProtectionWeaknessCount: 0,
          corpCanRezFullPathWithDynamicReserve: true,
          corpCanRezRelevantIce: true,
          recommendedNextStep: "score",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const remoteComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteAgenda,
      dependencies,
    );
    const rdWallComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      rdWall,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "force_scoreline_clock",
      targetServerId: "remote_1",
    });
    expect(triage.evidence).not.toContain(
      "corp_board_triage_central_override:pre_score_rd_exposure",
    );
    expect(remoteComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(rdWallComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
  });

  it("mismatches same-target non-stopping central ICE while real R&D protection exists", () => {
    const rdWall = {
      ...corpAction("install-rd-wall", "install_card", {
        placement: "ice",
        serverId: "rd",
      }),
      source: "rd-wall",
    } as LegalAction;
    const rdHunter = {
      ...corpAction("install-rd-hunter", "install_card", {
        placement: "ice",
        serverId: "rd",
      }),
      source: "rd-hunter",
    } as LegalAction;
    const input = corpInput({
      runnerAgendaPoints: 5,
      corpHq: [
        iceCard("rd-wall", {
          title: "Wall of Static",
          definitionId: "onr_v1_279_wall-of-static",
          subtypes: ["Wall"],
          rulesText: "End the run.",
        }),
        iceCard("rd-hunter", {
          title: "Hunter",
          definitionId: "onr_v1_249_hunter",
          subtypes: ["Sentry"],
          rulesText: "Trace 3 - Give the Runner one tag.",
        }),
      ],
      legalActions: [rdWall, rdHunter],
      eventTail: [
        publicCentralEvent("rd-run-1", "start_run", "rd"),
        publicCentralEvent("rd-access-1", "access_card", "rd"),
        publicCentralEvent("rd-run-2", "start_run", "rd"),
        publicCentralEvent("rd-access-2", "access_card", "rd"),
      ],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", []),
      ],
    });
    const dependencies = testDependencies();

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const wallComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      rdWall,
      dependencies,
    );
    const hunterComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      rdHunter,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_rd",
      severity: "critical",
      targetServerId: "rd",
    });
    expect(wallComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(hunterComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -3200,
    });
  });

  it("lets punish-primary HQ tax or damage ICE count as non-game-ending central protection", () => {
    const hqShock = {
      ...corpAction("install-hq-shock", "install_card", {
        placement: "ice",
        serverId: "hq",
      }),
      source: "hq-shock",
    } as LegalAction;
    const remoteAgenda = {
      ...corpAction("remote-scoreline", "install_card", {
        placement: "root",
        serverId: "remote_1",
      }),
      source: "hq-agenda",
    } as LegalAction;
    const input = {
      ...corpInput({
        corpHq: [
          agendaCard("hq-agenda", 2),
          agendaCard("hq-agenda-2", 2),
          iceCard("hq-shock", {
            title: "Damage Sentry",
            definitionId: "damage_sentry",
            subtypes: ["Sentry"],
            rulesText: "Do 1 net damage.",
          }),
        ],
        legalActions: [remoteAgenda, hqShock],
        servers: [
          centralServer("hq", []),
          centralServer("rd", []),
          remoteServer("remote_1", [iceCard("remote-ice")]),
        ],
      }),
      ownCorpStrategicIntent: {
        primaryWinIntent: "corp.punish_runner",
        scorePlan: ["corp.remote_scoreline"],
        punishPlan: ["corp.damage_kill", "corp.tag_trace_punish"],
      },
    } as unknown as AiDecisionInput;
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "durable",
          runnerCanContestNow: false,
          runnerCanReachAccessNow: false,
          agendaStealRelevantNow: false,
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "normal",
          affordableDurableRelevantIceCount: 1,
          dynamicProtectionWeaknessCount: 0,
          corpCanRezFullPathWithDynamicReserve: true,
          corpCanRezRelevantIce: true,
          recommendedNextStep: "score",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const hqComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      hqShock,
      dependencies,
    );
    const remoteComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteAgenda,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_hq",
      targetServerId: "hq",
    });
    expect(hqComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(remoteComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
  });

  it("does not let position-dependent punish ICE count as concrete HQ protection", () => {
    const hqTrap = {
      ...corpAction("install-hq-position-trap", "install_card", {
        placement: "ice",
        serverId: "hq",
      }),
      source: "hq-position-trap",
    } as LegalAction;
    const hqWall = {
      ...corpAction("install-hq-wall", "install_card", {
        placement: "ice",
        serverId: "hq",
      }),
      source: "hq-wall",
    } as LegalAction;
    const remoteAgenda = {
      ...corpAction("remote-scoreline", "install_card", {
        placement: "root",
        serverId: "remote_1",
      }),
      source: "hq-agenda",
    } as LegalAction;
    const input = {
      ...corpInput({
        corpHq: [
          agendaCard("hq-agenda", 2),
          agendaCard("hq-agenda-2", 2),
          iceCard("hq-position-trap", {
            title: "Position Trap",
            definitionId: "position_trap",
            subtypes: ["Sentry"],
            rulesText:
              "Trash 1 installed program if there is another rezzed ice outside this server.",
          }),
          iceCard("hq-wall", {
            title: "HQ Wall",
            definitionId: "hq_wall",
            subtypes: ["Wall"],
            rulesText: "End the run.",
          }),
        ],
        legalActions: [remoteAgenda, hqTrap, hqWall],
        servers: [
          centralServer("hq", []),
          centralServer("rd", []),
          remoteServer("remote_1", [iceCard("remote-ice")]),
        ],
      }),
      ownCorpStrategicIntent: {
        primaryWinIntent: "corp.punish_runner",
        scorePlan: ["corp.remote_scoreline"],
        punishPlan: ["corp.tag_trace_punish"],
      },
    } as unknown as AiDecisionInput;
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "durable",
          runnerCanContestNow: false,
          runnerCanReachAccessNow: false,
          agendaStealRelevantNow: false,
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "normal",
          affordableDurableRelevantIceCount: 1,
          dynamicProtectionWeaknessCount: 0,
          corpCanRezFullPathWithDynamicReserve: true,
          corpCanRezRelevantIce: true,
          recommendedNextStep: "score",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const trapComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      hqTrap,
      dependencies,
    );
    const wallComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      hqWall,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_hq",
      targetServerId: "hq",
    });
    expect(trapComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
    expect(wallComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
  });
});
