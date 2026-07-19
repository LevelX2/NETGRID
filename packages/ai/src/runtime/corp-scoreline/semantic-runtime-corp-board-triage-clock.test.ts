import { describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import {
  semanticRuntimeCorpBoardTriage,
  semanticRuntimeCorpBoardTriageActionComponent,
} from "../semantic-runtime-corp-board-triage";
import {
  agendaCard,
  centralServer,
  corpAction,
  corpInput,
  iceCard,
  publicCentralEvent,
  remoteServer,
  scoringWindow,
  testDependencies,
} from "../semantic-runtime-corp-board-triage.test-support";

describe("semantic runtime corp board triage scoreline clock", () => {
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
