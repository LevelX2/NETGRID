import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { semanticRuntimeCorpScoreComponents } from "./semantic-runtime-corp-score";
import { corpScoringWindowSuppressesContestableRemotePenalty } from "./corp-scoreline/semantic-runtime-corp-score-scoreline-components";
import {
  agendaCard,
  corpAction,
  corpCard,
  corpIce,
  corpInputWithDeckoutFlood,
  corpInputWithGoals,
  corpInputWithHqCards,
  corpInputWithRemoteAgenda,
  economySemanticCandidate,
  nightShiftCard,
  runnerOpponent,
  scoringWindow,
  semanticCandidate,
  testDependencies,
  totalScore,
  totalScoreFor,
} from "./semantic-runtime-corp-score.test-support";

describe("semanticRuntimeCorpScoreComponents score pressure", () => {
  it("accepts only a fully funded pre-score protection route behind an unsafe window label", () => {
    const protectedWindow = scoringWindow({
      windowKind: "unsafe",
      runnerCanContestBeforeScore: false,
      runnerCanReachAccessBeforeScore: false,
      agendaStealRelevantBeforeScore: false,
      corpCanRezRelevantIce: true,
      corpCanRezFullPathWithDynamicReserve: true,
    });

    expect(
      corpScoringWindowSuppressesContestableRemotePenalty(protectedWindow),
    ).toBe(true);
    expect(
      corpScoringWindowSuppressesContestableRemotePenalty({
        ...protectedWindow,
        corpCanRezFullPathWithDynamicReserve: false,
      }),
    ).toBe(false);
  });

  it("prefers scoring a scoreable non-overadvance agenda over adding extra counters", () => {
    const agenda = corpCard("marine-arcology", "agenda", {
      title: "Marine Arcology",
      definitionId: "onr_v1_206_marine-arcology",
      advancementRequirement: 3,
      advancementCounters: 3,
      agendaPoints: 2,
      rulesText: "[A], [A]: Gain 3 credits.",
    });
    const advanceAgenda = corpAction(
      "advance-marine-arcology",
      "advance_card",
      { cardId: agenda.instanceId, serverId: "remote_1" },
      agenda.instanceId,
    );
    advanceAgenda.costs = [{ clicks: 1, credits: 1 }];
    const scoreAgenda = corpAction(
      "score-marine-arcology",
      "score_agenda",
      { cardId: agenda.instanceId, serverId: "remote_1" },
      agenda.instanceId,
    );
    const input = corpInputWithRemoteAgenda(5, 3, agenda, [
      advanceAgenda,
      scoreAgenda,
    ]);

    const advanceComponents = semanticRuntimeCorpScoreComponents(
      input,
      advanceAgenda,
      "simple_score_advance",
      testDependencies(),
    );

    expect(advanceComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_scoreable_agenda_overadvance_penalty",
          value: -4200,
          reason: expect.stringContaining(
            "overadvance_next_threshold_reached:false",
          ),
        }),
      ]),
    );
    expect(
      totalScoreFor(
        input,
        scoreAgenda,
        "simple_score_advance",
        testDependencies(),
      ),
    ).toBeGreaterThan(totalScore(advanceComponents));
  });

  it("penalizes visible overadvance agendas until the next threshold is reached", () => {
    const agenda = corpCard("overadvance-agenda", "agenda", {
      title: "Overadvance Agenda",
      advancementRequirement: 3,
      advancementCounters: 3,
      agendaPoints: 2,
      rulesText:
        "For every two advancement counters over the difficulty, gain 3 credits.",
    });
    const advanceAgenda = corpAction(
      "advance-overadvance-agenda",
      "advance_card",
      { cardId: agenda.instanceId, serverId: "remote_1" },
      agenda.instanceId,
    );
    advanceAgenda.costs = [{ clicks: 1, credits: 1 }];
    const scoreAgenda = corpAction(
      "score-overadvance-agenda",
      "score_agenda",
      { cardId: agenda.instanceId, serverId: "remote_1" },
      agenda.instanceId,
    );
    const input = corpInputWithRemoteAgenda(5, 3, agenda, [
      advanceAgenda,
      scoreAgenda,
    ]);

    const keys = semanticRuntimeCorpScoreComponents(
      input,
      advanceAgenda,
      "simple_score_advance",
      testDependencies(),
    );

    expect(keys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_scoreable_agenda_overadvance_penalty",
          reason: expect.stringContaining(
            "overadvance_next_threshold_reached:false",
          ),
        }),
      ]),
    );
  });

  it("allows extra advancement when it reaches a visible overadvance threshold", () => {
    const agenda = corpCard("overadvance-agenda", "agenda", {
      title: "Overadvance Agenda",
      advancementRequirement: 3,
      advancementCounters: 4,
      agendaPoints: 2,
      rulesText:
        "For every two advancement counters over the difficulty, gain 3 credits.",
    });
    const advanceAgenda = corpAction(
      "advance-overadvance-agenda",
      "advance_card",
      { cardId: agenda.instanceId, serverId: "remote_1" },
      agenda.instanceId,
    );
    advanceAgenda.costs = [{ clicks: 1, credits: 1 }];
    const scoreAgenda = corpAction(
      "score-overadvance-agenda",
      "score_agenda",
      { cardId: agenda.instanceId, serverId: "remote_1" },
      agenda.instanceId,
    );
    const input = corpInputWithRemoteAgenda(5, 3, agenda, [
      advanceAgenda,
      scoreAgenda,
    ]);

    const componentKeys = semanticRuntimeCorpScoreComponents(
      input,
      advanceAgenda,
      "simple_score_advance",
      testDependencies(),
    ).map((component) => component.key);

    expect(componentKeys).not.toContain(
      "corp_scoreable_agenda_overadvance_penalty",
    );
  });

  it("uses board triage so remote protection beats unsafe scoreline advancement", () => {
    const advanceAgenda = corpAction("advance-agenda", "advance_card", {
      serverId: "remote_1",
    });
    const installRemoteIce = corpAction("install-remote-ice", "install_card", {
      placement: "ice",
      serverId: "remote_1",
    });
    const input = corpInputWithGoals([], [advanceAgenda, installRemoteIce]);
    const dependencies = {
      ...testDependencies(),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === advanceAgenda.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "unsafe",
              runnerCanContestBeforeScore: true,
              runnerCanReachAccessBeforeScore: true,
              agendaStealSeverity: "near_win",
              recommendedNextStep: "build_remote_ice",
              evidence: ["test_remote_window:unsafe"],
            })
          : undefined,
    };

    expect(
      totalScoreFor(input, installRemoteIce, "basic_install", dependencies),
    ).toBeGreaterThan(
      totalScoreFor(input, advanceAgenda, "simple_score_advance", dependencies),
    );
  });

  it("does not treat an unbound ICE action as exact score-remote protection", () => {
    const installRemoteAgenda = corpAction(
      "install-agenda-remote-1",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "remote_1",
      },
      "agenda-in-hq",
    );
    const installNewRemoteAgenda = corpAction(
      "install-agenda-new-remote",
      "install_card",
      {
        cardType: "agenda",
        placement: "root",
        serverId: "new_remote",
      },
      "agenda-in-hq",
    );
    const installRemoteIce = corpAction(
      "install-remote-1-ice",
      "install_card",
      {
        placement: "ice",
        serverId: "remote_1",
      },
    );
    const input = corpInputWithGoals(
      [],
      [installNewRemoteAgenda, installRemoteAgenda, installRemoteIce],
    );
    const dependencies = {
      ...testDependencies(),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === installRemoteAgenda.actionId ||
        action.actionId === installNewRemoteAgenda.actionId,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.type === "install_card" && action.payload?.placement !== "ice"
          ? scoringWindow({
              serverId: String(action.payload?.serverId),
              windowKind: "unsafe",
              runnerCanContestBeforeScore: true,
              runnerCanReachAccessBeforeScore: true,
              agendaStealSeverity: "game_ending",
              runnerAgendaPointsAfterSteal: 7,
              recommendedNextStep: "build_remote_ice",
              evidence: [`test_remote_window:${action.payload?.serverId}`],
            })
          : undefined,
    };

    const iceComponents = semanticRuntimeCorpScoreComponents(
      input,
      installRemoteIce,
      "basic_install",
      dependencies,
    );

    expect(iceComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_mismatch",
          value: -3200,
          reason: expect.stringContaining("triage_target:remote_1"),
        }),
      ]),
    );
  });

  it("uses board triage so funding beats blind scoreline advancement below rez floor", () => {
    const advanceAgenda = corpAction("advance-agenda", "advance_card", {
      serverId: "remote_1",
    });
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithGoals([], [advanceAgenda, gainCredit]);
    const dependencies = {
      ...testDependencies(),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId,
      corpRemoteRezFloorAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === advanceAgenda.actionId
          ? {
              blockedByFloor: true,
              evidence: ["remote_rez_floor:blocked"],
            }
          : undefined,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === advanceAgenda.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "unsafe",
              runnerCanContestBeforeScore: true,
              runnerCanReachAccessBeforeScore: true,
              corpCanRezRelevantIce: false,
              recommendedNextStep: "gain_credit",
              evidence: ["test_remote_window:needs_funding"],
            })
          : undefined,
    };

    expect(
      totalScoreFor(input, gainCredit, "basic_economy_draw", dependencies),
    ).toBeGreaterThan(
      totalScoreFor(input, advanceAgenda, "simple_score_advance", dependencies),
    );
  });

  it("funds an active score remote before adding ICE that misses the rez floor", () => {
    const installRemoteIce = corpAction("install-remote-ice", "install_card", {
      placement: "ice",
      serverId: "remote_1",
    });
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithRemoteAgenda(
      2,
      3,
      agendaCard("active-remote-agenda"),
      [installRemoteIce, gainCredit],
    );
    const dependencies = {
      ...testDependencies(),
      corpHasRemoteRezFloorFundingNeed: () => true,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === installRemoteIce.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "unsafe",
              runnerCanContestBeforeScore: true,
              runnerCanReachAccessBeforeScore: true,
              corpCanRezRelevantIce: false,
              corpCanRezFullPathWithDynamicReserve: false,
              dynamicProtectionReserve: 4,
              recommendedNextStep: "gain_credit",
              evidence: ["test_remote_window:ice_needs_funding"],
            })
          : undefined,
    };

    const installComponents = semanticRuntimeCorpScoreComponents(
      input,
      installRemoteIce,
      "basic_install",
      dependencies,
    );
    const creditComponents = semanticRuntimeCorpScoreComponents(
      input,
      gainCredit,
      "basic_economy_draw",
      dependencies,
    );

    expect(installComponents.map((component) => component.key)).not.toContain(
      "corp_remote_scoreline_unfunded_ice_install_penalty",
    );
    expect(creditComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_alignment",
          reason: expect.stringContaining("triage_primary:fund_score_remote"),
        }),
      ]),
    );
  });

  it("funds a prepared score remote before adding unaffordable ICE", () => {
    const expensiveIce = corpIce("expensive-remote-ice", { rezCost: 13 });
    const installRemoteIce = corpAction(
      "install-expensive-remote-ice",
      "install_card",
      {
        placement: "ice",
        serverId: "remote_1",
      },
      expensiveIce.instanceId,
    );
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithHqCards(
      3,
      [agendaCard("agenda-in-hq"), expensiveIce],
      [installRemoteIce, gainCredit],
    );
    input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [corpIce("remote-wall", { rezCost: 2, rezzed: true })],
        root: [],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      rolesForAction: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === installRemoteIce.actionId ? ["ice", "protect"] : [],
      corpHasRemoteRezFloorFundingNeed: () => true,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === installRemoteIce.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "unsafe",
              runnerCanContestBeforeScore: true,
              runnerCanReachAccessBeforeScore: true,
              corpCanRezRelevantIce: false,
              corpCanRezFullPathWithDynamicReserve: false,
              recommendedNextStep: "gain_credit",
              evidence: ["test_prepared_remote:ice_needs_funding"],
            })
          : undefined,
    };

    const installComponents = semanticRuntimeCorpScoreComponents(
      input,
      installRemoteIce,
      "basic_install",
      dependencies,
    );
    const creditComponents = semanticRuntimeCorpScoreComponents(
      input,
      gainCredit,
      "basic_economy_draw",
      dependencies,
    );

    expect(installComponents.map((component) => component.key)).not.toContain(
      "corp_remote_scoreline_unfunded_ice_install_penalty",
    );
  });

  it("takes basic funding over ending the turn at zero credits with rez-floor pressure", () => {
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const endTurn = corpAction("end-turn", "end_turn");
    const input = corpInputWithGoals([], [gainCredit, endTurn]);
    input.playerView.own.credits = 0;
    input.playerView.own.clicks = 2;
    const dependencies = {
      ...testDependencies(),
      corpHasCentralRezFloorFundingNeed: () => true,
    };

    const endTurnComponents = semanticRuntimeCorpScoreComponents(
      input,
      endTurn,
      "end_turn",
      dependencies,
    );

    expect(endTurnComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_end_turn_leaves_critical_funding_gap",
          value: -900,
        }),
      ]),
    );
    expect(
      totalScoreFor(input, gainCredit, "basic_economy_draw", dependencies),
    ).toBeGreaterThan(totalScore(endTurnComponents));
  });

  it("uses board triage so deckout agenda flood forces scoreline over passive economy", () => {
    const installAgenda = corpAction(
      "install-agenda-remote-1",
      "install_card",
      {
        placement: "root",
        serverId: "remote_1",
        cardType: "agenda",
      },
      "agenda-1",
    );
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithDeckoutFlood(
      6,
      [agendaCard("agenda-1"), agendaCard("agenda-2")],
      3,
      [installAgenda, gainCredit],
    );
    const dependencies = {
      ...testDependencies(),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === installAgenda.actionId,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === installAgenda.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "unsafe",
              runnerCanContestBeforeScore: true,
              runnerCanReachAccessBeforeScore: true,
              agendaStealSeverity: "normal",
              recommendedNextStep: "build_remote_ice",
              evidence: ["test_deckout_flood_scoreline"],
            })
          : undefined,
    };

    const installComponents = semanticRuntimeCorpScoreComponents(
      input,
      installAgenda,
      "basic_install",
      dependencies,
    );
    const creditComponents = semanticRuntimeCorpScoreComponents(
      input,
      gainCredit,
      "basic_economy_draw",
      dependencies,
    );

    expect(installComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_alignment",
          reason: expect.stringContaining(
            "triage_primary:force_scoreline_clock",
          ),
        }),
      ]),
    );
    expect(creditComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_mismatch",
          reason: expect.stringContaining(
            "triage_primary:force_scoreline_clock",
          ),
        }),
      ]),
    );
    expect(totalScore(installComponents)).toBeGreaterThan(
      totalScore(creditComponents),
    );
  });

  it("commits the visible matchpoint agenda in the last deckout window even when the remote is unsafe", () => {
    const installAgenda = corpAction(
      "install-matchpoint-agenda",
      "install_card",
      {
        placement: "root",
        serverId: "remote_1",
        cardType: "agenda",
      },
      "matchpoint-agenda",
    );
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithDeckoutFlood(
      2,
      [agendaCard("matchpoint-agenda", 3)],
      1,
      [installAgenda, gainCredit],
    );
    input.playerView.own.agendaPoints = 6;
    input.playerView.agendaPointsToWin = 7;
    input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [corpIce("remote-ice", { rezCost: 2, rezzed: false })],
        root: [],
      },
    ];
    (
      input as AiDecisionInput & {
        ownCorpStrategicIntent?: { primaryWinIntent: string };
      }
    ).ownCorpStrategicIntent = {
      primaryWinIntent: "corp.punish_runner",
    };
    const dependencies = {
      ...testDependencies(),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === installAgenda.actionId,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === installAgenda.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "unsafe",
              scoreHorizon: "next_turn",
              runnerCanContestBeforeScore: true,
              runnerCanReachAccessBeforeScore: true,
              agendaStealRelevantBeforeScore: true,
              agendaStealSeverity: "normal",
              runnerAgendaPointsAfterSteal: 3,
              dynamicProtectionReserve: 3,
              corpCanRezRelevantIce: true,
              corpCanRezFullPathWithDynamicReserve: false,
              recommendedNextStep: "gain_credit",
              evidence: ["test_last_viable_deckout_matchpoint"],
            })
          : undefined,
    };

    const installComponents = semanticRuntimeCorpScoreComponents(
      input,
      installAgenda,
      "basic_install",
      dependencies,
    );
    const creditComponents = semanticRuntimeCorpScoreComponents(
      input,
      gainCredit,
      "basic_economy_draw",
      dependencies,
    );

    expect(installComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_alignment",
          reason: expect.stringContaining(
            "corp_deckout_last_viable_window:true",
          ),
        }),
      ]),
    );
    expect(installComponents.map((component) => component.key)).not.toContain(
      "corp_unsafe_delayed_scoreline_exposure",
    );
    expect(installComponents.map((component) => component.key)).not.toContain(
      "corp_punish_primary_speculative_scoreline_dampen",
    );
    expect(creditComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_mismatch",
          value: -5200,
        }),
      ]),
    );
    expect(totalScore(installComponents)).toBeGreaterThan(
      totalScore(creditComponents),
    );
  });

  it("forces a playable existing remote agenda install under HQ agenda pressure", () => {
    const installAgenda = corpAction(
      "install-agenda-remote-1",
      "install_card",
      {
        placement: "root",
        serverId: "remote_1",
        cardType: "agenda",
      },
      "agenda-1",
    );
    const installSupportRoot = corpAction(
      "install-support-remote-1",
      "install_card",
      {
        placement: "root",
        serverId: "remote_1",
      },
      "support-root",
    );
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithHqCards(
      8,
      [agendaCard("agenda-1"), corpCard("support-root", "asset")],
      [installAgenda, installSupportRoot, gainCredit],
    );
    input.playerView.opponent = runnerOpponent({
      agendaPoints: 3,
      credits: 4,
    });
    input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [corpIce("remote-data-wall", { rezCost: 1, rezzed: true })],
        root: [],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === installAgenda.actionId,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === installAgenda.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "unsafe",
              missingVisibleBreakerCoverage: true,
              runnerCanReachAccessNow: false,
              runnerCanContestBeforeScore: false,
              runnerCanReachAccessBeforeScore: false,
              affordableDurableRelevantIceCount: 1,
              corpCanRezRelevantIce: true,
              corpCanRezFullPathWithDynamicReserve: true,
              dynamicProtectionWeaknessCount: 0,
              agendaStealSeverity: "normal",
              recommendedNextStep: "none",
              evidence: ["test_hq_agenda_pressure_playable_scoreline"],
            })
          : undefined,
    };

    const installComponents = semanticRuntimeCorpScoreComponents(
      input,
      installAgenda,
      "basic_install",
      dependencies,
    );
    const supportComponents = semanticRuntimeCorpScoreComponents(
      input,
      installSupportRoot,
      "basic_install",
      dependencies,
    );
    const creditComponents = semanticRuntimeCorpScoreComponents(
      input,
      gainCredit,
      "basic_economy_draw",
      dependencies,
    );

    expect(installComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_alignment",
          reason: expect.stringContaining(
            "triage_primary:force_scoreline_clock",
          ),
        }),
      ]),
    );
    expect(supportComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_mismatch",
          reason: expect.stringContaining(
            "triage_primary:force_scoreline_clock",
          ),
        }),
      ]),
    );
    expect(creditComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_mismatch",
          reason: expect.stringContaining(
            "triage_primary:force_scoreline_clock",
          ),
        }),
      ]),
    );
    expect(totalScore(installComponents)).toBeGreaterThan(
      totalScore(supportComponents),
    );
    expect(totalScore(installComponents)).toBeGreaterThan(
      totalScore(creditComponents),
    );
  });

  it("funds before converting game-ending HQ pressure into an accessible remote", () => {
    const installAgenda = corpAction(
      "install-agenda-remote-1",
      "install_card",
      {
        placement: "root",
        serverId: "remote_1",
        cardType: "agenda",
      },
      "agenda-1",
    );
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithHqCards(
      5,
      [agendaCard("agenda-1", 4)],
      [installAgenda, gainCredit],
    );
    input.playerView.agendaPointsToWin = 7;
    input.playerView.opponent = runnerOpponent({
      agendaPoints: 4,
      credits: 8,
    });
    input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [corpIce("remote-data-wall", { rezCost: 1, rezzed: true })],
        root: [],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === installAgenda.actionId,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === installAgenda.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "unsafe",
              missingVisibleBreakerCoverage: false,
              runnerCanContestNow: true,
              runnerCanReachAccessNow: true,
              agendaStealRelevantNow: true,
              runnerCanContestBeforeScore: true,
              runnerCanReachAccessBeforeScore: true,
              agendaStealSeverity: "game_ending",
              agendaPointsAtRisk: 4,
              runnerAgendaPointsAfterSteal: 8,
              dynamicProtectionReserve: 7,
              corpCanRezRelevantIce: false,
              corpCanRezFullPathWithDynamicReserve: false,
              recommendedNextStep: "gain_credit",
              evidence: ["test_critical_hq_agenda_emergency_conversion"],
            })
          : undefined,
    };

    const installComponents = semanticRuntimeCorpScoreComponents(
      input,
      installAgenda,
      "basic_install",
      dependencies,
    );
    const creditComponents = semanticRuntimeCorpScoreComponents(
      input,
      gainCredit,
      "basic_economy_draw",
      dependencies,
    );

    expect(installComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_mismatch",
          reason: expect.stringContaining("triage_primary:fund_score_remote"),
        }),
      ]),
    );
    expect(creditComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_alignment",
          reason: expect.stringContaining("triage_primary:fund_score_remote"),
        }),
      ]),
    );
    expect(totalScore(creditComponents)).toBeGreaterThan(
      totalScore(installComponents),
    );
  });

  it("softens contestable remote penalties for relative HQ agenda relief", () => {
    const installAgenda = corpAction(
      "install-agenda-remote-1",
      "install_card",
      {
        placement: "root",
        serverId: "remote_1",
        cardType: "agenda",
      },
      "agenda-1",
    );
    const nightShift = corpAction(
      "play-night-shift",
      "play_operation",
      {},
      "corp_night_shift",
    );
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithHqCards(
      8,
      [agendaCard("agenda-1", 4), agendaCard("agenda-2", 2), nightShiftCard()],
      [installAgenda, nightShift, gainCredit],
    );
    input.playerView.opponent = runnerOpponent({
      agendaPoints: 2,
      credits: 5,
    });
    input.playerView.servers = [
      {
        id: "hq",
        label: "HQ",
        ice: [corpIce("hq-filter", { rezzed: true })],
        root: [],
      },
      { id: "rd", label: "R&D", ice: [], root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [corpIce("remote-data-wall", { rezCost: 1, rezzed: true })],
        root: [],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === installAgenda.actionId,
      corpInstallRemoteScore: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === installAgenda.actionId ? -2200 : 0,
      corpRemoteScoreContestabilityAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === installAgenda.actionId
          ? { contestable: true, evidence: ["test_contestable_remote"] }
          : undefined,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === installAgenda.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "unsafe",
              missingVisibleBreakerCoverage: false,
              runnerCanReachAccessNow: true,
              runnerCanContestBeforeScore: true,
              runnerCanReachAccessBeforeScore: true,
              affordableDurableRelevantIceCount: 1,
              corpCanRezRelevantIce: true,
              corpCanRezFullPathWithDynamicReserve: true,
              dynamicProtectionWeaknessCount: 0,
              agendaStealSeverity: "near_win",
              runnerAgendaPointsAfterSteal: 6,
              recommendedNextStep: "build_remote_ice",
              evidence: ["test_relative_hq_relief_scoreline"],
            })
          : undefined,
    };

    const installComponents = semanticRuntimeCorpScoreComponents(
      input,
      installAgenda,
      "basic_install",
      dependencies,
    );
    const nightShiftComponents = semanticRuntimeCorpScoreComponents(
      input,
      nightShift,
      "basic_install",
      dependencies,
      economySemanticCandidate(nightShift, 2, { cardsDrawn: 1 }),
    );

    expect(installComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_hq_agenda_relief_scoreline",
          value: 3200,
        }),
        expect.objectContaining({
          key: "corp_install_remote_context",
          value: -350,
          reason: expect.stringContaining("remote_context_floor:-350"),
        }),
        expect.objectContaining({
          key: "corp_contestable_remote_score_penalty",
          value: -900,
          reason: expect.stringContaining(
            "contestable_penalty_softened_for_hq_relief:true",
          ),
        }),
      ]),
    );
    expect(nightShiftComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_hq_agenda_flood_draw_risk",
          value: -1800,
        }),
      ]),
    );
    expect(totalScore(installComponents)).toBeGreaterThan(
      totalScore(nightShiftComponents),
    );
    expect(totalScore(installComponents)).toBeGreaterThan(
      totalScoreFor(input, gainCredit, "basic_economy_draw", dependencies),
    );
  });

  it("suppresses stale contestable penalties when the scoring window is durable before runner exposure", () => {
    const advanceAgenda = corpAction(
      "advance-agenda-remote-1",
      "advance_card",
      {
        serverId: "remote_1",
        cardType: "agenda",
      },
      "agenda-1",
    );
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithHqCards(6, [], [advanceAgenda, gainCredit]);
    input.playerView.opponent = runnerOpponent({
      agendaPoints: 2,
      credits: 5,
    });
    input.playerView.servers = [
      {
        id: "hq",
        label: "HQ",
        ice: [],
        root: [],
      },
      { id: "rd", label: "R&D", ice: [], root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [corpIce("remote-data-wall", { rezCost: 1, rezzed: true })],
        root: [agendaCard("agenda-1", 2)],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId,
      corpAdvanceRemoteScore: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId ? 1450 : 0,
      corpRemoteScoreContestabilityAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === advanceAgenda.actionId
          ? { contestable: true, evidence: ["test_stale_contestable_remote"] }
          : undefined,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === advanceAgenda.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "durable",
              runnerCanContestNow: false,
              runnerCanReachAccessNow: true,
              agendaStealRelevantNow: false,
              runnerCanContestBeforeScore: false,
              runnerCanReachAccessBeforeScore: true,
              agendaStealRelevantBeforeScore: false,
              affordableDurableRelevantIceCount: 1,
              corpCanRezRelevantIce: true,
              corpCanRezFullPathWithDynamicReserve: true,
              recommendedNextStep: "advance",
              evidence: ["test_durable_scoring_window_no_steal"],
            })
          : undefined,
    };

    const advanceComponents = semanticRuntimeCorpScoreComponents(
      input,
      advanceAgenda,
      "simple_score_advance",
      dependencies,
    );

    expect(advanceComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_contestable_remote_score_penalty_suppressed",
          reason: expect.stringContaining(
            "contestable_penalty_suppressed_by_scoring_window:true",
          ),
        }),
      ]),
    );
    expect(advanceComponents).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_contestable_remote_score_penalty",
        }),
      ]),
    );
    expect(totalScore(advanceComponents)).toBeGreaterThan(
      totalScoreFor(input, gainCredit, "basic_economy_draw", dependencies),
    );
  });
});
