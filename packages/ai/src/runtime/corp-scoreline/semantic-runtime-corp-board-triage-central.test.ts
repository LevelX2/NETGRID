import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  semanticRuntimeCorpBoardTriage,
  semanticRuntimeCorpBoardTriageActionComponent,
} from "../semantic-runtime-corp-board-triage";
import { existingReadyRemoteCanReceiveScoreline } from "./semantic-runtime-corp-board-triage-actions";
import { existingScoreRemoteOutletExists } from "./semantic-runtime-corp-board-triage-policies";
import {
  agendaCard,
  assetCard,
  centralServer,
  corpAction,
  corpInput,
  fracterBreaker,
  iceCard,
  publicCentralEvent,
  remoteServer,
  scoringWindow,
  testDependencies,
} from "../semantic-runtime-corp-board-triage.test-support";

describe("semantic runtime corp board triage central protection", () => {
  it("keeps a legal agenda outlet ready when its root already has support", () => {
    const agenda = agendaCard("hq-agenda", 2);
    const installAgenda = corpAction(
      "install-agenda-remote-1",
      "install_card",
      { placement: "root", serverId: "remote_1" },
      agenda.instanceId,
    );
    const input = corpInput({
      corpHq: [agenda],
      legalActions: [installAgenda],
      servers: [
        centralServer("hq", []),
        centralServer("rd", []),
        remoteServer(
          "remote_1",
          [iceCard("remote-ice")],
          [assetCard("visible-root-support")],
        ),
      ],
    });

    expect(existingReadyRemoteCanReceiveScoreline(input, "remote_1")).toBe(
      true,
    );
    expect(existingScoreRemoteOutletExists(input)).toBe(true);
  });

  it("does not infer R&D protection from an unbound ICE action", () => {
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
    expect(triage).toMatchObject({
      primary: "low_value",
      severity: "low",
    });
  });

  it("keeps the R&D protection goal and recognizes exact liquidity progress", () => {
    const rdWall = {
      ...corpAction(
        "install-rd-wall",
        "install_card",
        { placement: "ice", serverId: "rd" },
        "rd-wall",
      ),
      costs: [{ clicks: 1, credits: 1 }],
    } as LegalAction;
    const gainCredit = corpAction("gain-credit", "gain_credit", {
      gainCreditsAmount: 1,
    });
    const input = corpInput({
      corpCredits: 5,
      corpHq: [
        iceCard("rd-wall", {
          title: "Wall of Ice",
          definitionId: "onr_v1_278_wall-of-ice",
          subtypes: ["Wall"],
          rulesText: "End the run.",
          rezCost: 6,
        }),
      ],
      runnerAgendaPoints: 5,
      legalActions: [rdWall, gainCredit],
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
    const dependencies = testDependencies({
      actionCreditCost: (action) =>
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0),
    });

    const triage = semanticRuntimeCorpBoardTriage(input, dependencies);
    const creditComponent = semanticRuntimeCorpBoardTriageActionComponent(
      input,
      gainCredit,
      dependencies,
    );

    expect(triage).toMatchObject({
      primary: "protect_rd",
      targetServerId: "rd",
    });
    expect(creditComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
  });

  it("does not certify unbound HQ ICE ahead of a prepared scoreline", () => {
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
      primary: "force_scoreline_clock",
      severity: "high",
      targetServerId: "remote_1",
    });
    expect(hqComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
    expect(remoteComponent).toMatchObject({
      key: "corp_board_triage_alignment",
    });
  });

  it("does not turn an unbound extra HQ ICE action into exact protection", () => {
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
      primary: "force_scoreline_clock",
      severity: "high",
      targetServerId: "remote_1",
    });
    expect(hqComponent).toMatchObject({
      key: "corp_board_triage_mismatch",
    });
    expect(remoteComponent).toMatchObject({
      key: "corp_board_triage_alignment",
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
});
