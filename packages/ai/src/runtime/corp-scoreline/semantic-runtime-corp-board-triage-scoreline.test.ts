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
} from "../semantic-runtime-corp-board-triage";
import type { CorpScoringWindowAssessment } from "../semantic-runtime-corp-scoring-window";
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
} from "../semantic-runtime-corp-board-triage.test-support";

describe("semantic runtime corp board triage scoreline", () => {
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

  it("treats safe prepared remote agenda install as high HQ-pressure relief", () => {
    const remoteAgenda = {
      ...corpAction("remote-scoreline", "install_card", {
        placement: "root",
        serverId: "remote_1",
      }),
      source: "hq-agenda",
    } as LegalAction;
    const hqIce = {
      ...corpAction("install-hq-ice", "install_card", {
        placement: "ice",
        serverId: "hq",
      }),
      source: "hq-wall",
    } as LegalAction;
    const input = {
      ...corpInput({
        corpHq: [
          agendaCard("hq-agenda", 2),
          iceCard("hq-wall", {
            title: "HQ Wall",
            definitionId: "onr_v1_279_wall-of-static",
            subtypes: ["Wall"],
            rulesText: "End the run.",
          }),
        ],
        legalActions: [remoteAgenda, hqIce],
        servers: [
          centralServer("hq", []),
          centralServer("rd", [iceCard("rd-ice")]),
          remoteServer("remote_1", [
            iceCard("remote-ice-1"),
            iceCard("remote-ice-2"),
          ]),
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
          windowKind: "unsafe",
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
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: true,
          recommendedNextStep: "none",
        }),
      },
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const remoteComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      remoteAgenda,
      dependencies,
    );
    const hqComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      hqIce,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_hq",
      severity: "high",
      targetServerId: "hq",
    });
    expect(remoteComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
    expect(remoteComponent?.reason).toContain("triage_action_server:remote_1");
    expect(hqComponent).toMatchObject({
      key: "corp_board_triage_alignment",
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

  it("does not treat scored hidden-zone reveal agenda actions as remote funding", () => {
    const remoteAgenda = corpAction("remote-scoreline", "install_card", {
      placement: "root",
      serverId: "remote_1",
    });
    const basicCredit = corpAction("gain-credit", "gain_credit");
    const revealRdTop = corpAction(
      "security-directors-reveal-rd",
      "gain_credit",
      {
        cardId: "security-directors",
        abilityFamily: "hidden-zone",
        effectKind: "hidden_zone",
        agendaAbility: "v1919_scored_agenda_reveal_rd_top",
      },
      "security-directors",
    );
    const input = corpInput({
      corpHq: [agendaCard("hq-agenda-1", 3)],
      corpCredits: 0,
      runnerAgendaPoints: 4,
      legalActions: [remoteAgenda, revealRdTop, basicCredit],
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
    const revealComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      revealRdTop,
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
    expect(revealComponent?.key).not.toBe("corp_board_triage_alignment");
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
    const activeAdvance = corpAction(
      "advance-active-scoreline",
      "advance_card",
      {
        serverId: "remote_1",
      },
    );
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
        remoteServer(
          "remote_1",
          [iceCard("remote-ice")],
          [agendaCard("active-agenda", 2)],
        ),
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
    expect(triage.evidence).not.toContain(
      "corp_board_triage_target:new_remote",
    );
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
    const remoteSupport = corpAction(
      "remote-scoreline-support",
      "install_card",
      {
        placement: "root",
        serverId: "remote_1",
        cardDefinitionId: "support_asset",
      },
    );
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
        remoteServer(
          "remote_1",
          [],
          [
            agendaCard("low-value-agenda", 1, {
              advancementRequirement: 6,
              advancementCounters: 5,
            }),
          ],
        ),
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
        remoteServer(
          "remote_1",
          [],
          [
            agendaCard("low-value-agenda", 1, {
              advancementRequirement: 6,
              advancementCounters: 5,
            }),
          ],
        ),
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
        remoteServer(
          "remote_1",
          [],
          [
            agendaCard("low-value-agenda", 1, {
              advancementRequirement: 6,
              advancementCounters: 5,
            }),
          ],
        ),
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
