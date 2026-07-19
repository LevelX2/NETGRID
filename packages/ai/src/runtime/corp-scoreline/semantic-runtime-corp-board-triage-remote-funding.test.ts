import { describe, expect, it } from "vitest";
import {
  semanticRuntimeCorpBoardTriage,
  semanticRuntimeCorpBoardTriageActionComponent,
} from "../semantic-runtime-corp-board-triage";
import {
  agendaCard,
  assetCard,
  centralServer,
  corpAction,
  corpInput,
  iceCard,
  remoteServer,
  scoringWindow,
  testDependencies,
} from "../semantic-runtime-corp-board-triage.test-support";

describe("semantic runtime corp board triage remote funding", () => {
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

  it("aligns same-remote ICE when its projected layer closes the access window", () => {
    const agenda = agendaCard("hq-agenda", 2);
    const remoteAgenda = corpAction(
      "remote-scoreline",
      "install_card",
      { placement: "root", serverId: "remote_1" },
      agenda.instanceId,
    );
    const remoteIceCard = iceCard("remote-second-ice");
    const remoteIce = corpAction(
      "install-second-remote-ice",
      "install_card",
      { placement: "ice", serverId: "remote_1" },
      remoteIceCard.instanceId,
    );
    const gainCredit = corpAction("gain-credit", "gain_credit");
    const input = corpInput({
      corpHq: [agenda, remoteIceCard],
      runnerAgendaPoints: 5,
      legalActions: [remoteAgenda, remoteIce, gainCredit],
      servers: [
        centralServer("hq", [iceCard("hq-ice")]),
        centralServer("rd", [iceCard("rd-ice")]),
        remoteServer("remote_1", [iceCard("remote-first-ice")]),
      ],
    });
    const dependencies = testDependencies({
      scoringWindowByActionId: {
        [remoteAgenda.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "unsafe",
          agendaStealSeverity: "game_ending",
          recommendedNextStep: "build_remote_ice",
        }),
        [remoteIce.actionId]: scoringWindow({
          serverId: "remote_1",
          windowKind: "durable",
          runnerCanContestNow: false,
          runnerCanReachAccessNow: false,
          agendaStealRelevantNow: false,
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "none",
          affordableDurableRelevantIceCount: 2,
          dynamicProtectionWeaknessCount: 0,
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: true,
          recommendedNextStep: "build_remote_ice",
        }),
      },
    });

    expect(semanticRuntimeCorpBoardTriage(input, dependencies)).toMatchObject({
      primary: "protect_score_remote",
      targetServerId: "remote_1",
    });
    expect(
      semanticRuntimeCorpBoardTriageActionComponent(
        input,
        remoteIce,
        dependencies,
      ),
    ).toMatchObject({ key: "corp_board_triage_alignment" });
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
});
