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

describe("semantic runtime corp board triage", () => {
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
    const input = corpInput({
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
    });
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
      value: -2400,
    });
    expect(remoteIceComponent).toMatchObject({
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
    expect(triage.evidence).not.toContain(
      "corp_hq_agenda_flood_pressure:true",
    );
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

  it("treats end-turn as a mismatch while critical central protection is unresolved", () => {
    const endTurn = corpAction("end-turn", "end_turn");
    const rdIce = corpAction("install-rd-ice", "install_card", {
      placement: "ice",
      serverId: "rd",
    });
    const input = corpInput({
      runnerAgendaPoints: 5,
      legalActions: [endTurn, rdIce],
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
    const endTurnComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      endTurn,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_rd",
      severity: "critical",
      targetServerId: "rd",
    });
    expect(endTurnComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -3200,
    });
    expect(endTurnComponent?.reason).toContain("triage_action:end_turn");
  });

  it("protects open HQ before forcing remote scoreline when HQ agenda flood has runner exposure", () => {
    const hqIce = corpAction("install-hq-ice", "install_card", {
      placement: "ice",
      serverId: "hq",
    });
    const remoteAgenda = corpAction("remote-scoreline", "install_card", {
      placement: "root",
      serverId: "remote_1",
    });
    const input = corpInput({
      corpHq: [agendaCard("hq-agenda-1", 2), agendaCard("hq-agenda-2", 2)],
      legalActions: [remoteAgenda, hqIce],
      servers: [
        centralServer("hq", []),
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
    const hqComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      hqIce,
      dependencies,
    );
    const remoteComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteAgenda,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_hq",
      severity: "critical",
      targetServerId: "hq",
    });
    expect(triage.evidence).toContain(
      "corp_board_triage_central_override:unprotected_hq_before_runner_exposure",
    );
    expect(hqComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(remoteComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -3200,
    });
  });

  it("protects HQ with visibly covered ICE before forcing remote scoreline", () => {
    const hqIce = corpAction("install-hq-ice", "install_card", {
      placement: "ice",
      serverId: "hq",
    });
    const remoteAgenda = corpAction("remote-scoreline", "install_card", {
      placement: "root",
      serverId: "remote_1",
    });
    const input = corpInput({
      corpHq: [agendaCard("hq-agenda-1", 2), agendaCard("hq-agenda-2", 2)],
      runnerRig: [fracterBreaker()],
      legalActions: [remoteAgenda, hqIce],
      servers: [
        centralServer("hq", [
          iceCard("hq-wall", {
            title: "Wall of Static",
            definitionId: "onr_v1_279_wall-of-static",
            rezzed: true,
            subtypes: ["Wall"],
            rulesText: "End the run.",
          }),
        ]),
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
    const hqComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      hqIce,
      dependencies,
    );
    const remoteComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteAgenda,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_hq",
      severity: "critical",
      targetServerId: "hq",
    });
    expect(triage.evidence).toContain("corp_hq_ice_count:1");
    expect(triage.evidence).toContain("corp_hq_effective_stop_ice:false");
    expect(hqComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(remoteComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -3200,
    });
  });

  it("funds instead of forcing a game-ending accessible emergency remote", () => {
    const remoteAgenda = corpAction("remote-scoreline", "install_card", {
      placement: "root",
      serverId: "remote_1",
    });
    const gainCredit = corpAction("gain-credit", "gain_credit");
    const input = corpInput({
      corpHq: [agendaCard("hq-agenda-1", 4)],
      corpCredits: 2,
      runnerAgendaPoints: 4,
      legalActions: [remoteAgenda, gainCredit],
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
          windowKind: "unsafe",
          runnerCanContestNow: true,
          runnerCanReachAccessNow: true,
          agendaStealRelevantNow: true,
          runnerCanContestBeforeScore: true,
          runnerCanReachAccessBeforeScore: true,
          agendaStealSeverity: "game_ending",
          runnerAgendaPointsAfterSteal: 8,
          corpCanRezRelevantIce: false,
          corpCanRezFullPathWithDynamicReserve: false,
          dynamicProtectionWeaknessCount: 0,
          recommendedNextStep: "gain_credit",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const creditComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      gainCredit,
      dependencies,
    );
    const remoteComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteAgenda,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "fund_score_remote",
      severity: "critical",
      targetServerId: "remote_1",
    });
    expect(triage.evidence).not.toContain(
      "corp_hq_agenda_emergency_remote_conversion:true",
    );
    expect(creditComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(remoteComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -3200,
    });
  });

  it("does not treat scored shuffle-draw agenda actions as remote funding", () => {
    const remoteAgenda = corpAction("remote-scoreline", "install_card", {
      placement: "root",
      serverId: "remote_1",
    });
    const basicCredit = corpAction("gain-credit", "gain_credit");
    const aiCfoShuffleDraw = corpAction("ai-cfo-shuffle-draw", "gain_credit", {
      agendaAbility: "hq_archives_shuffle_draw",
      drawCardsAmount: 5,
    });
    const input = corpInput({
      corpHq: [agendaCard("hq-agenda-1", 3)],
      corpCredits: 0,
      runnerAgendaPoints: 4,
      legalActions: [remoteAgenda, aiCfoShuffleDraw, basicCredit],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [iceCard("rd-ice")]),
        remoteServer("remote_1", [iceCard("remote-ice")]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "unsafe",
          agendaStealSeverity: "game_ending",
          runnerAgendaPointsAfterSteal: 7,
          corpCanRezRelevantIce: false,
          corpCanRezFullPathWithDynamicReserve: false,
          recommendedNextStep: "gain_credit",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const basicCreditComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      basicCredit,
      dependencies,
    );
    const shuffleDrawComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      aiCfoShuffleDraw,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "fund_score_remote",
      severity: "critical",
      targetServerId: "remote_1",
    });
    expect(basicCreditComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(shuffleDrawComponent?.key).not.toBe("corp_board_triage_alignment");
  });

  it("funds an existing score remote before protection when the rez path is unaffordable", () => {
    const remoteAgenda = corpAction("remote-scoreline", "install_card", {
      placement: "root",
      serverId: "remote_1",
    });
    const basicCredit = corpAction("gain-credit", "gain_credit");
    const remoteIce = corpAction("remote-ice", "install_card", {
      placement: "ice",
      serverId: "remote_1",
    });
    const input = corpInput({
      corpHq: [agendaCard("hq-agenda-1", 3)],
      corpCredits: 0,
      runnerAgendaPoints: 4,
      legalActions: [remoteAgenda, remoteIce, basicCredit],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [iceCard("rd-ice")]),
        remoteServer("remote_1", [
          iceCard("outer-ice", { rezCost: 3, rezzed: false }),
          iceCard("inner-ice", { rezCost: 2, rezzed: false }),
        ]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "unsafe",
          scoreHorizon: "slow",
          runnerCanContestNow: false,
          runnerCanReachAccessNow: false,
          agendaStealRelevantNow: false,
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "game_ending",
          runnerAgendaPointsAfterSteal: 7,
          affordableDurableRelevantIceCount: 1,
          dynamicProtectionWeaknessCount: 0,
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: false,
          recommendedNextStep: "install_agenda",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const basicCreditComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      basicCredit,
      dependencies,
    );
    const remoteAgendaComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteAgenda,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "fund_score_remote",
      severity: "critical",
      targetServerId: "remote_1",
    });
    expect(basicCreditComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(remoteAgendaComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
  });

  it("treats build-remote-ice as protection before funding for a new score remote", () => {
    const remoteAgenda = corpAction("new-remote-scoreline", "install_card", {
      placement: "root",
      serverId: "new_remote",
    });
    const remoteIce = corpAction("install-new-remote-ice", "install_card", {
      placement: "ice",
      serverId: "new_remote",
    });
    const hqIce = corpAction("install-extra-hq-ice", "install_card", {
      placement: "ice",
      serverId: "hq",
    });
    const gainCredit = corpAction("gain-credit", "gain_credit");
    const input = corpInput({
      corpHq: [agendaCard("hq-agenda-1", 1), agendaCard("hq-agenda-2", 1)],
      legalActions: [remoteAgenda, remoteIce, hqIce, gainCredit],
      servers: [
        centralServer("hq", [iceCard("hq-stop")]),
        centralServer("rd", [iceCard("rd-stop")]),
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
          agendaStealSeverity: "normal",
          runnerAgendaPointsAfterSteal: 1,
          corpCanRezRelevantIce: false,
          corpCanRezFullPathWithDynamicReserve: false,
          dynamicProtectionWeaknessCount: 0,
          recommendedNextStep: "build_remote_ice",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const remoteIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteIce,
      dependencies,
    );
    const hqComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      hqIce,
      dependencies,
    );
    const creditComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      gainCredit,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_score_remote",
      severity: "high",
      targetServerId: "new_remote",
    });
    expect(remoteIceComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(hqComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
    expect(creditComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
  });

  it("keeps funding triage on an existing score remote instead of a new-remote scoreline", () => {
    const activeAdvance = corpAction("advance-active-scoreline", "advance_card", {
      serverId: "remote_1",
    });
    const newRemoteAgenda = corpAction("new-remote-scoreline", "install_card", {
      placement: "root",
      serverId: "new_remote",
    });
    const newRemoteIce = corpAction("new-remote-ice", "install_card", {
      placement: "ice",
      serverId: "new_remote",
    });
    const gainCredit = corpAction("gain-credit", "gain_credit");
    const input = corpInput({
      corpHq: [agendaCard("hq-agenda-1", 2), agendaCard("hq-agenda-2", 2)],
      legalActions: [activeAdvance, newRemoteAgenda, newRemoteIce, gainCredit],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [iceCard("rd-ice")]),
        remoteServer("remote_1", [iceCard("remote-ice")], [
          agendaCard("active-agenda", 2),
        ]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [activeAdvance.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "unsafe",
          runnerCanContestBeforeScore: true,
          runnerCanReachAccessBeforeScore: true,
          agendaStealSeverity: "normal",
          runnerAgendaPointsAfterSteal: 2,
          corpCanRezRelevantIce: false,
          corpCanRezFullPathWithDynamicReserve: false,
          recommendedNextStep: "gain_credit",
        }),
        [newRemoteAgenda.actionId]: scoringWindow({
          serverId: "new_remote",
          windowKind: "unsafe",
          runnerCanContestBeforeScore: true,
          runnerCanReachAccessBeforeScore: true,
          agendaStealSeverity: "game_ending",
          runnerAgendaPointsAfterSteal: 7,
          corpCanRezRelevantIce: false,
          corpCanRezFullPathWithDynamicReserve: false,
          recommendedNextStep: "gain_credit",
        }),
        [newRemoteIce.actionId]: scoringWindow({
          serverId: "new_remote",
          windowKind: "unsafe",
          runnerCanContestBeforeScore: true,
          runnerCanReachAccessBeforeScore: true,
          agendaStealSeverity: "game_ending",
          runnerAgendaPointsAfterSteal: 7,
          corpCanRezRelevantIce: false,
          corpCanRezFullPathWithDynamicReserve: false,
          recommendedNextStep: "gain_credit",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const creditComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      gainCredit,
      dependencies,
    );
    const newRemoteComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      newRemoteAgenda,
      dependencies,
    );
    const newRemoteIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      newRemoteIce,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "fund_score_remote",
      severity: "high",
      targetServerId: "remote_1",
    });
    expect(triage.evidence).toContain("corp_board_triage_target:remote_1");
    expect(triage.evidence).not.toContain("corp_board_triage_target:new_remote");
    expect(creditComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(newRemoteComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
    expect(newRemoteIceComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
  });

  it("uses a funded missing-coverage score window instead of overprotecting or taking economy", () => {
    const remoteAgenda = corpAction("remote-scoreline", "install_card", {
      placement: "root",
      serverId: "remote_1",
    });
    const remoteIce = corpAction("install-more-remote-ice", "install_card", {
      placement: "ice",
      serverId: "remote_1",
    });
    const gainCredit = corpAction("gain-credit", "gain_credit");
    const input = corpInput({
      corpHq: [agendaCard("hq-agenda-1", 2)],
      corpCredits: 5,
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
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "unsafe",
          scoreHorizon: "next_turn",
          runnerCanContestNow: false,
          runnerCanReachAccessNow: false,
          agendaStealRelevantNow: false,
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          missingVisibleBreakerCoverage: true,
          agendaStealSeverity: "normal",
          runnerAgendaPointsAfterSteal: 2,
          affordableDurableRelevantIceCount: 1,
          dynamicProtectionWeaknessCount: 0,
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: true,
          recommendedNextStep: "build_remote_ice",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const remoteAgendaComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteAgenda,
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
      primary: "force_scoreline_clock",
      severity: "high",
      targetServerId: "remote_1",
    });
    expect(triage.evidence).not.toContain(
      "corp_board_triage_primary:protect_score_remote",
    );
    expect(remoteAgendaComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(remoteIceComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -2400,
    });
    expect(creditComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -2400,
    });
  });

  it("does not let non-scoreline remote support funding override a playable scoreline", () => {
    const remoteAgenda = corpAction("remote-scoreline", "install_card", {
      placement: "root",
      serverId: "remote_1",
    });
    const remoteSupport = corpAction("remote-scoreline-support", "install_card", {
      placement: "root",
      serverId: "remote_1",
      cardDefinitionId: "support_asset",
    });
    const gainCredit = corpAction("gain-credit", "gain_credit");
    const input = corpInput({
      corpHq: [agendaCard("hq-agenda-1", 2), assetCard("support-asset")],
      corpCredits: 5,
      legalActions: [remoteAgenda, remoteSupport, gainCredit],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [iceCard("rd-ice")]),
        remoteServer("remote_1", [
          iceCard("remote-ice", { rezCost: 3, rezzed: false }),
        ]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "temporary_safe",
          scoreHorizon: "slow",
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
          dynamicProtectionReserve: 0,
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: true,
          recommendedNextStep: "score",
        }),
        [remoteSupport.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "unsafe",
          scoreHorizon: "slow",
          runnerCanContestNow: false,
          runnerCanReachAccessNow: false,
          agendaStealRelevantNow: false,
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "none",
          runnerAgendaPointsAfterSteal: 0,
          affordableDurableRelevantIceCount: 1,
          dynamicProtectionWeaknessCount: 0,
          dynamicProtectionReserve: 8,
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: false,
          recommendedNextStep: "gain_credit",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const remoteAgendaComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteAgenda,
      dependencies,
    );
    const supportComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteSupport,
      dependencies,
    );
    const creditComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      gainCredit,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "force_scoreline_clock",
      severity: "high",
      targetServerId: "remote_1",
    });
    expect(triage.evidence).not.toContain(
      "corp_board_triage_primary:fund_score_remote",
    );
    expect(remoteAgendaComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(supportComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -2400,
    });
    expect(creditComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -2400,
    });
  });

  it("does not classify a ready score remote as funding when the rez floor is already met", () => {
    const remoteAgenda = corpAction("remote-scoreline", "install_card", {
      placement: "root",
      serverId: "remote_1",
    });
    const gainCredit = corpAction("gain-credit", "gain_credit");
    const hqIce = corpAction("install-hq-ice", "install_card", {
      placement: "ice",
      serverId: "hq",
    });
    const input = corpInput({
      corpHq: [agendaCard("hq-agenda-1", 2)],
      corpCredits: 5,
      legalActions: [remoteAgenda, gainCredit, hqIce],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [iceCard("rd-ice")]),
        remoteServer("remote_1", [
          iceCard("remote-ice", { rezCost: 3, rezzed: false }),
        ]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "unsafe",
          scoreHorizon: "next_turn",
          runnerCanContestNow: false,
          runnerCanReachAccessNow: false,
          agendaStealRelevantNow: false,
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          missingVisibleBreakerCoverage: true,
          agendaStealSeverity: "normal",
          runnerAgendaPointsAfterSteal: 2,
          affordableDurableRelevantIceCount: 1,
          dynamicProtectionWeaknessCount: 0,
          dynamicProtectionReserve: 3,
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: true,
          recommendedNextStep: "gain_credit",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const remoteAgendaComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteAgenda,
      dependencies,
    );
    const creditComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      gainCredit,
      dependencies,
    );
    const hqIceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      hqIce,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "force_scoreline_clock",
      severity: "high",
      targetServerId: "remote_1",
    });
    expect(triage.evidence).not.toContain(
      "corp_board_triage_primary:fund_score_remote",
    );
    expect(remoteAgendaComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(creditComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -2400,
    });
    expect(hqIceComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -2400,
    });
  });

  it("classifies reachable same-turn advance closeouts as score_now", () => {
    const agenda = agendaCard("remote-agenda", 2);
    const advanceAgenda = {
      ...corpAction("advance-remote-agenda", "advance_card", {
        serverId: "remote_1",
      }),
      source: agenda.instanceId,
      costs: [{ clicks: 1, credits: 1 }],
    } as LegalAction;
    const gainCredit = corpAction("gain-credit", "gain_credit");
    const input = corpInput({
      corpCredits: 4,
      legalActions: [advanceAgenda, gainCredit],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [iceCard("rd-ice")]),
        remoteServer("remote_1", [], [agenda]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [advanceAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "unsafe",
          scoreHorizon: "next_turn",
          recommendedNextStep: "build_remote_ice",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const advanceComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      advanceAgenda,
      dependencies,
    );
    const creditComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      gainCredit,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "score_now",
      severity: "critical",
      targetServerId: "remote_1",
    });
    expect(advanceComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(creditComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
  });

  it("treats non-scoreline abilities as mismatches under forced scoreline clock", () => {
    const remoteAgenda = corpAction("remote-scoreline", "install_card", {
      placement: "root",
      serverId: "remote_1",
    });
    const punishAbility = corpAction(
      "punish-ability",
      "activated_card_ability",
    );
    const input = corpInput({
      corpHq: [
        agendaCard("hq-agenda-1", 1),
        agendaCard("hq-agenda-2", 1),
        agendaCard("hq-agenda-3", 1),
      ],
      corpCredits: 12,
      legalActions: [remoteAgenda, punishAbility],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [iceCard("rd-ice")]),
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
    const punishComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      punishAbility,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "force_scoreline_clock",
      severity: "critical",
      targetServerId: "remote_1",
    });
    expect(remoteComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(punishComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -5200,
    });
  });

  it("defers a low-value same-turn closeout when it would leave critical R&D unfunded", () => {
    const scoreNow = corpAction(
      "low-value-score-now",
      "advance_card",
      { serverId: "remote_1" },
      "low-value-agenda",
    );
    const rdIce = corpAction(
      "install-rd-wall",
      "install_card",
      { placement: "ice", serverId: "rd" },
      "rd-wall",
    );
    const gainCredit = corpAction("gain-credit", "gain_credit");
    const input = corpInput({
      corpCredits: 1,
      runnerAgendaPoints: 3,
      corpHq: [iceCard("rd-wall", { rezCost: 3 })],
      legalActions: [scoreNow, rdIce, gainCredit],
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
        remoteServer("remote_1", [], [
          agendaCard("low-value-agenda", 1, {
            advancementRequirement: 6,
            advancementCounters: 5,
          }),
        ]),
      ],
    });
    const dependencies = testDependencies({
      actionCreditCost: (action) => (action.type === "advance_card" ? 1 : 0),
      corpAdvanceCompletesScore: (_input, action) =>
        action.actionId === scoreNow.actionId,
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const scoreComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      scoreNow,
      dependencies,
    );
    const creditComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      gainCredit,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "recover_economy",
      severity: "critical",
      targetServerId: "rd",
      requiredRezFloor: 3,
    });
    expect(triage.evidence).toContain(
      "corp_board_triage_score_now_deferred:critical_rd_rez_floor",
    );
    expect(scoreComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -12000,
    });
    expect(creditComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
  });

  it("keeps low-value same-turn closeout when R&D pressure is not agenda-critical", () => {
    const scoreNow = corpAction(
      "low-value-score-now",
      "advance_card",
      { serverId: "remote_1" },
      "low-value-agenda",
    );
    const rdIce = corpAction(
      "install-rd-wall",
      "install_card",
      { placement: "ice", serverId: "rd" },
      "rd-wall",
    );
    const gainCredit = corpAction("gain-credit", "gain_credit");
    const input = corpInput({
      corpCredits: 1,
      runnerAgendaPoints: 0,
      corpHq: [iceCard("rd-wall", { rezCost: 3 })],
      legalActions: [scoreNow, rdIce, gainCredit],
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
        remoteServer("remote_1", [], [
          agendaCard("low-value-agenda", 1, {
            advancementRequirement: 6,
            advancementCounters: 5,
          }),
        ]),
      ],
    });
    const dependencies = testDependencies({
      actionCreditCost: (action) => (action.type === "advance_card" ? 1 : 0),
      corpAdvanceCompletesScore: (_input, action) =>
        action.actionId === scoreNow.actionId,
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const scoreComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      scoreNow,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "score_now",
      severity: "critical",
      targetServerId: "remote_1",
    });
    expect(triage.evidence).not.toContain(
      "corp_board_triage_score_now_deferred:critical_rd_rez_floor",
    );
    expect(scoreComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
  });

  it("protects R&D once the deferred low-value closeout protection floor is funded", () => {
    const scoreNow = corpAction(
      "low-value-score-now",
      "advance_card",
      { serverId: "remote_1" },
      "low-value-agenda",
    );
    const rdIce = corpAction(
      "install-rd-wall",
      "install_card",
      { placement: "ice", serverId: "rd" },
      "rd-wall",
    );
    const gainCredit = corpAction("gain-credit", "gain_credit");
    const input = corpInput({
      corpCredits: 3,
      runnerAgendaPoints: 3,
      corpHq: [iceCard("rd-wall", { rezCost: 3 })],
      legalActions: [scoreNow, rdIce, gainCredit],
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
        remoteServer("remote_1", [], [
          agendaCard("low-value-agenda", 1, {
            advancementRequirement: 6,
            advancementCounters: 5,
          }),
        ]),
      ],
    });
    const dependencies = testDependencies({
      actionCreditCost: (action) => (action.type === "advance_card" ? 1 : 0),
      corpAdvanceCompletesScore: (_input, action) =>
        action.actionId === scoreNow.actionId,
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const scoreComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      scoreNow,
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
      "corp_board_triage_score_now_deferred:critical_rd_protection",
    );
    expect(scoreComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
      value: -12000,
    });
    expect(rdIceComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
  });
});

function corpInput(overrides: {
  legalActions: LegalAction[];
  servers: AiDecisionInput["playerView"]["servers"];
  corpHq?: VisibleCard[];
  corpCredits?: number;
  runnerAgendaPoints?: number;
  runnerRig?: VisibleCard[];
  eventTail?: AiDecisionInput["eventTail"];
}): AiDecisionInput {
  return {
    side: "corp",
    legalActions: overrides.legalActions,
    eventTail: overrides.eventTail ?? [],
    playerView: {
      stateVersion: 1,
      own: {
        credits: overrides.corpCredits ?? 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: overrides.corpHq ?? [],
        heapOrArchives: [],
        scoreArea: [],
        stackOrRdCount: 20,
      },
      opponent: {
        credits: 4,
        clicks: 4,
        agendaPoints: overrides.runnerAgendaPoints ?? 0,
        rig: overrides.runnerRig ?? [],
        scoreArea: [],
      },
      publicEvents: [],
      servers: overrides.servers,
      agendaPointsToWin: 7,
    },
  } as unknown as AiDecisionInput;
}

function testDependencies(
  options: {
    scoringWindowByActionId?: Record<string, CorpScoringWindowAssessment>;
    actionCreditCost?: (action: LegalAction) => number;
    corpAdvanceCompletesScore?: (
      input: AiDecisionInput,
      action: LegalAction,
    ) => boolean;
  } = {},
): CorpBoardTriageDependencies<"test"> {
  return {
    actionCreditCost: options.actionCreditCost ?? (() => 0),
    rolesForAction: () => [],
    corpScoreNowSafetyGate: () => ({ allowed: true, evidence: [] }),
    corpActionIsScoreLine: (_input, action) =>
      action.actionId.includes("scoreline") || action.type === "advance_card",
    corpAdvanceCompletesScore: options.corpAdvanceCompletesScore ?? (() => false),
    corpScoringWindowAssessment: (_input, action) =>
      options.scoringWindowByActionId?.[action.actionId],
    corpRemoteRezFloorAssessment: () => undefined,
    corpCentralRezReserveAssessment: () => undefined,
    corpHasRemoteRezFloorFundingNeed: () => false,
    corpHasCentralRezFloorFundingNeed: () => false,
    corpHasRemoteInstability: () => false,
  };
}

function scoringWindow(
  overrides: Partial<CorpScoringWindowAssessment>,
): CorpScoringWindowAssessment {
  return {
    serverId: "remote_1",
    windowKind: "unsafe",
    runnerCanContestNow: true,
    runnerCanReachAccessNow: true,
    agendaStealRelevantNow: true,
    runnerCanContestBeforeScore: true,
    runnerCanReachAccessBeforeScore: true,
    agendaStealRelevantBeforeScore: true,
    agendaPointsAtRisk: 2,
    runnerAgendaPointsAfterSteal: 7,
    agendaStealSeverity: "game_ending",
    missingVisibleBreakerCoverage: false,
    corpCanRezRelevantIce: true,
    affordableDurableRelevantIceCount: 0,
    dynamicProtectionWeaknessCount: 1,
    dynamicProtectionReserve: 0,
    corpCanRezFullPathWithDynamicReserve: false,
    scoreHorizon: "next_turn",
    runnerExposureCreditActions: 3,
    recommendedNextStep: "build_remote_ice",
    evidence: ["test_scoring_window"],
    ...overrides,
  };
}

function corpAction(
  actionId: string,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
  source = "basic_action",
): LegalAction {
  return {
    actionId,
    type,
    side: "corp",
    label: actionId,
    source,
    costs: [],
    payload,
  } as unknown as LegalAction;
}

function corpRezIceAction(
  actionId: string,
  source: string,
  rezCost: number,
): LegalAction {
  return {
    actionId,
    type: "rez_ice",
    side: "corp",
    label: actionId,
    source,
    costs: [{ credits: rezCost }],
    payload: { rezCostPaid: rezCost },
  } as unknown as LegalAction;
}

function centralServer(
  id: "hq" | "rd",
  ice: readonly VisibleCard[],
): AiDecisionInput["playerView"]["servers"][number] {
  return { id, label: id.toUpperCase(), ice: [...ice], root: [] };
}

function remoteServer(
  id: `remote_${number}`,
  ice: readonly VisibleCard[],
  root: readonly VisibleCard[] = [],
): AiDecisionInput["playerView"]["servers"][number] {
  return { id, label: id, ice: [...ice], root: [...root] };
}

function agendaCard(
  instanceId = "remote-agenda",
  agendaPoints = 2,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "agenda",
    owner: "corp",
    advancementRequirement: 3,
    advancementCounters: 1,
    agendaPoints,
    ...overrides,
  } as VisibleCard;
}

function iceCard(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "ice",
    owner: "corp",
    definitionId: "simple_barrier_ice",
    rezCost: 2,
    ...overrides,
  } as VisibleCard;
}

function assetCard(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "asset",
    owner: "corp",
    definitionId: "support_asset",
  } as VisibleCard;
}

function rdVirusCard(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    type: "program",
    owner: "runner",
    title: "Highlighter",
    rulesText:
      "After each successful run on R&D, give the Corp a Highlighter counter. Each counter after the first allows you to access an additional card from R&D.",
  } as VisibleCard;
}

function earlyWormBreaker(): VisibleCard {
  return {
    instanceId: "early-worm",
    known: true,
    type: "program",
    owner: "runner",
    title: "Early Worm",
    definitionId: "onr_classic_027_early-worm",
    subtypes: ["Icebreaker", "Worm"],
  } as VisibleCard;
}

function fracterBreaker(): VisibleCard {
  return {
    instanceId: "runner-fracter",
    known: true,
    type: "program",
    owner: "runner",
    title: "Runner Fracter",
    subtypes: ["Icebreaker", "Fracter"],
    rulesText: "Break wall subroutines.",
  } as VisibleCard;
}

function publicCentralEvent(
  eventId: string,
  actionType: "start_run" | "access_card",
  serverId: "hq" | "rd",
): AiDecisionInput["eventTail"][number] {
  return {
    eventId,
    type: actionType,
    stateVersionBefore: 1,
    stateVersionAfter: 2,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: "runner",
      actionType,
      serverId,
    },
  };
}
