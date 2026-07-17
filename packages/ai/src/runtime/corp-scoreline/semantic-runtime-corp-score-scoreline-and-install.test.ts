import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import type { TacticalGoalLike } from "../../decision/semantic-decision-frame";
import type { CorpScorelineWindowAssessment } from "./semantic-runtime-corp-scoreline-assessment";
import {
  corpActionCandidateHasVisibleSignal,
  normalizedCorpReserveScoreValue,
  semanticRuntimeCorpScoreComponents,
  type SemanticRuntimeCorpScoreDependencies,
} from "../semantic-runtime-corp-score";
import type { CorpScoringWindowAssessment } from "../semantic-runtime-corp-scoring-window";
import {
  accountsReceivableCard,
  agendaCard,
  candidate,
  componentKeysForInstallRoles,
  corpAction,
  corpCard,
  corpIce,
  corpInputWithDeckoutFlood,
  corpInputWithGoals,
  corpInputWithHqCards,
  corpInputWithHqCardsAndServers,
  corpInputWithRemoteAgenda,
  corpInputWithScoreAreaCards,
  dayShiftCard,
  economyOperationCard,
  fracterBreaker,
  nightShiftCard,
  runnerOpponent,
  scorelineFundingAssessment,
  scoringWindow,
  semanticCandidate,
  testDependencies,
  totalScore,
  totalScoreFor,
} from "../semantic-runtime-corp-score.test-support";

describe("semanticRuntimeCorpScoreComponents scoreline and installs", () => {
  it("keeps remote protection above relative HQ relief when protection is legal", () => {
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
    const installRemoteIce = corpAction("install-remote-ice", "install_card", {
      placement: "ice",
      serverId: "remote_1",
    });
    const input = corpInputWithHqCards(
      8,
      [agendaCard("agenda-1", 4), agendaCard("agenda-2", 2)],
      [installAgenda, installRemoteIce],
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
              evidence: ["test_relative_hq_relief_needs_protection"],
            })
          : undefined,
    };

    const installComponents = semanticRuntimeCorpScoreComponents(
      input,
      installAgenda,
      "basic_install",
      dependencies,
    );
    const remoteIceComponents = semanticRuntimeCorpScoreComponents(
      input,
      installRemoteIce,
      "basic_install",
      dependencies,
    );

    expect(JSON.stringify(installComponents)).not.toContain(
      "corp_hq_agenda_relief_scoreline",
    );
    expect(remoteIceComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_alignment",
          reason: expect.stringContaining(
            "triage_primary:protect_score_remote",
          ),
        }),
      ]),
    );
    expect(totalScore(remoteIceComponents)).toBeGreaterThan(
      totalScore(installComponents),
    );
  });

  it("penalizes non-agenda roots that block a prepared scoring remote", () => {
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
    const input = corpInputWithHqCards(
      5,
      [agendaCard("agenda-1", 2), corpCard("support-root", "asset")],
      [installAgenda, installSupportRoot],
    );
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
              windowKind: "durable",
              affordableDurableRelevantIceCount: 1,
              corpCanRezRelevantIce: true,
              corpCanRezFullPathWithDynamicReserve: true,
              dynamicProtectionWeaknessCount: 0,
              agendaStealSeverity: "normal",
              recommendedNextStep: "score",
              evidence: ["test_ready_remote_agenda_payload"],
            })
          : undefined,
    };

    const supportComponents = semanticRuntimeCorpScoreComponents(
      input,
      installSupportRoot,
      "basic_install",
      dependencies,
    );

    expect(supportComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_non_agenda_root_blocks_score_remote",
          value: -1800,
          reason: expect.stringContaining(
            "available_scoreline_action:install-agenda-remote-1",
          ),
        }),
      ]),
    );
    expect(
      totalScoreFor(input, installAgenda, "basic_install", dependencies),
    ).toBeGreaterThan(totalScore(supportComponents));
  });

  it("does not force a game-ending contestable HQ-flood scoreline", () => {
    const installAgenda = corpAction(
      "install-game-ending-agenda",
      "install_card",
      {
        placement: "root",
        serverId: "remote_1",
        cardType: "agenda",
      },
      "agenda-1",
    );
    const installRemoteIce = corpAction("install-remote-ice", "install_card", {
      placement: "ice",
      serverId: "remote_1",
    });
    const input = corpInputWithHqCards(
      8,
      [agendaCard("agenda-1", 2), agendaCard("agenda-2", 2)],
      [installAgenda, installRemoteIce],
    );
    input.playerView.opponent = runnerOpponent({
      agendaPoints: 5,
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
              missingVisibleBreakerCoverage: true,
              runnerCanReachAccessNow: true,
              runnerCanContestBeforeScore: true,
              runnerCanReachAccessBeforeScore: true,
              affordableDurableRelevantIceCount: 1,
              corpCanRezRelevantIce: true,
              corpCanRezFullPathWithDynamicReserve: true,
              dynamicProtectionWeaknessCount: 0,
              agendaStealSeverity: "game_ending",
              runnerAgendaPointsAfterSteal: 7,
              recommendedNextStep: "build_remote_ice",
              evidence: ["test_hq_agenda_pressure_contestable_scoreline"],
            })
          : undefined,
    };

    const installComponents = semanticRuntimeCorpScoreComponents(
      input,
      installAgenda,
      "basic_install",
      dependencies,
    );

    expect(JSON.stringify(installComponents)).not.toContain(
      "force_scoreline_clock",
    );
    expect(
      totalScoreFor(input, installRemoteIce, "basic_install", dependencies),
    ).toBeGreaterThan(totalScore(installComponents));
  });

  it("penalizes game-ending next-turn scorelines when runner can access before score", () => {
    const installAgenda = corpAction(
      "install-game-ending-agenda",
      "install_card",
      {
        placement: "root",
        serverId: "remote_1",
        cardType: "agenda",
      },
      "agenda-1",
    );
    const gainCredit = corpAction("gain-credit", "gain_credit", {});
    const input = corpInputWithHqCards(
      4,
      [agendaCard("agenda-1", 2)],
      [installAgenda, gainCredit],
    );
    input.playerView.opponent = runnerOpponent({
      agendaPoints: 5,
      credits: 2,
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
      corpInstallRemoteScore: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === installAgenda.actionId ? -2200 : 0,
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
              agendaStealSeverity: "game_ending",
              agendaPointsAtRisk: 2,
              runnerAgendaPointsAfterSteal: 7,
              recommendedNextStep: "build_remote_ice",
              evidence: ["test_game_ending_exposure_scoreline"],
            })
          : undefined,
    };

    const installComponents = semanticRuntimeCorpScoreComponents(
      input,
      installAgenda,
      "basic_install",
      dependencies,
    );

    expect(installComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_game_ending_scoreline_exposure_penalty",
          value: -4600,
          reason: expect.stringContaining(
            "scoreline_exposes_game_ending_steal:true",
          ),
        }),
      ]),
    );
    expect(
      totalScoreFor(input, gainCredit, "basic_economy_draw", dependencies),
    ).toBeGreaterThan(totalScore(installComponents));
  });

  it("penalizes an ordinary delayed scoreline that the runner can steal before scoring", () => {
    const installAgenda = corpAction(
      "install-contestable-agenda",
      "install_card",
      {
        placement: "root",
        serverId: "remote_1",
        cardType: "agenda",
      },
      "project-babylon",
    );
    const gainCredit = corpAction("gain-credit", "gain_credit", {});
    const input = corpInputWithHqCards(
      8,
      [agendaCard("project-babylon", 1)],
      [installAgenda, gainCredit],
    );
    input.playerView.opponent = runnerOpponent({
      agendaPoints: 2,
      credits: 6,
    });
    const dependencies = {
      ...testDependencies(),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === installAgenda.actionId,
      corpInstallRemoteScore: () => 900,
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
              recommendedNextStep: "build_remote_ice",
              evidence: ["test_ordinary_contestable_scoreline"],
            })
          : undefined,
    };

    const installComponents = semanticRuntimeCorpScoreComponents(
      input,
      installAgenda,
      "basic_install",
      dependencies,
    );

    expect(installComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_unsafe_delayed_scoreline_exposure",
          value: -4200,
        }),
      ]),
    );
    expect(
      totalScoreFor(input, gainCredit, "basic_economy_draw", dependencies),
    ).toBeGreaterThan(totalScore(installComponents));
  });

  it("keeps unsafe delayed scoreline penalties active under a forced scoreline clock", () => {
    const installAgenda = corpAction(
      "install-forced-unsafe-agenda",
      "install_card",
      {
        placement: "root",
        serverId: "remote_1",
        cardType: "agenda",
      },
      "agenda-1",
    );
    const input = corpInputWithDeckoutFlood(
      6,
      [agendaCard("agenda-1"), agendaCard("agenda-2"), agendaCard("agenda-3")],
      3,
      [installAgenda, corpAction("gain-credit", "gain_credit", {})],
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
              windowKind: "unsafe",
              runnerCanContestBeforeScore: true,
              runnerCanReachAccessBeforeScore: true,
              agendaStealRelevantBeforeScore: true,
              recommendedNextStep: "build_remote_ice",
              evidence: ["test_forced_unsafe_scoreline"],
            })
          : undefined,
    };

    const components = semanticRuntimeCorpScoreComponents(
      input,
      installAgenda,
      "basic_install",
      dependencies,
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_alignment",
          reason: expect.stringContaining(
            "triage_primary:force_scoreline_clock",
          ),
        }),
        expect.objectContaining({
          key: "corp_unsafe_delayed_scoreline_exposure",
          value: -4200,
        }),
      ]),
    );
  });

  it("marks draw economy operations as mismatches during deckout agenda flood", () => {
    const dayShift = corpAction(
      "play-day-shift",
      "play_operation",
      {},
      "day-shift",
    );
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
    const input = corpInputWithDeckoutFlood(
      6,
      [agendaCard("agenda-1"), agendaCard("agenda-2"), dayShiftCard()],
      3,
      [dayShift, installAgenda],
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
              recommendedNextStep: "build_remote_ice",
              evidence: ["test_deckout_flood_scoreline"],
            })
          : undefined,
    };

    const drawComponents = semanticRuntimeCorpScoreComponents(
      input,
      dayShift,
      "basic_install",
      dependencies,
      semanticCandidate(
        dayShift.actionId,
        "play.corp_operation",
        ["economy.corp_credit_burst", "draw_operation"],
        "play_operation",
      ),
    );
    const installComponents = semanticRuntimeCorpScoreComponents(
      input,
      installAgenda,
      "basic_install",
      dependencies,
    );

    expect(drawComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "corp_operation_burst_economy" }),
        expect.objectContaining({
          key: "corp_board_triage_mismatch",
          value: -2400,
          reason: expect.stringContaining(
            "triage_primary:force_scoreline_clock",
          ),
        }),
      ]),
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
  });

  it("funds a forced scoreline before blind advancement when the deckout rez floor is unmet", () => {
    const advanceAgenda = corpAction("advance-agenda", "advance_card", {
      serverId: "remote_1",
    });
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithDeckoutFlood(
      2,
      [agendaCard("agenda-1"), agendaCard("agenda-2"), agendaCard("agenda-3")],
      3,
      [advanceAgenda, gainCredit],
    );
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
              dynamicProtectionReserve: 4,
              corpCanRezRelevantIce: false,
              recommendedNextStep: "gain_credit",
              evidence: ["test_deckout_flood_needs_funding"],
            })
          : undefined,
    };

    const creditComponents = semanticRuntimeCorpScoreComponents(
      input,
      gainCredit,
      "basic_economy_draw",
      dependencies,
    );
    const advanceComponents = semanticRuntimeCorpScoreComponents(
      input,
      advanceAgenda,
      "simple_score_advance",
      dependencies,
    );

    expect(creditComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_alignment",
          reason: expect.stringContaining(
            "triage_primary:force_scoreline_clock",
          ),
        }),
      ]),
    );
    expect(advanceComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_mismatch",
          reason: expect.stringContaining("triage_required_rez_floor:4"),
        }),
      ]),
    );
    expect(totalScore(creditComponents)).toBeGreaterThan(
      totalScore(advanceComponents),
    );
  });

  it("funds an emergency HQ-flood scoreline when dynamic reserve is zero but remote rez floor is unmet", () => {
    const remoteAgenda = agendaCard("remote-agenda", 4);
    const advanceAgenda = {
      ...corpAction("advance-agenda", "advance_card", {
        serverId: "remote_1",
      }),
      source: remoteAgenda.instanceId,
    } as LegalAction;
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithHqCardsAndServers(
      1,
      [agendaCard("hq-agenda", 4)],
      [
        {
          id: "hq",
          label: "HQ",
          ice: [],
          root: [],
        },
        {
          id: "rd",
          label: "R&D",
          ice: [],
          root: [],
        },
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [corpIce("remote-ice")],
          root: [remoteAgenda],
        },
      ],
      [advanceAgenda, gainCredit],
    );
    const dependencies = {
      ...testDependencies(),
      actionCreditCost: (action: LegalAction) =>
        action.actionId === advanceAgenda.actionId ? 1 : 0,
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId,
      corpRemoteRezFloorAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === advanceAgenda.actionId
          ? {
              blockedByFloor: true,
              rezFloor: 7,
              requiredCreditsAfterAction: 7,
              creditsAfterAction: 0,
              evidence: [
                "remote_rez_floor:7",
                "remote_rez_floor_required_after_action:7",
                "agenda_development_risk:below_remote_rez_floor",
              ],
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
              agendaStealSeverity: "game_ending",
              runnerAgendaPointsAfterSteal: 9,
              dynamicProtectionReserve: 0,
              corpCanRezRelevantIce: false,
              corpCanRezFullPathWithDynamicReserve: false,
              recommendedNextStep: "gain_credit",
              evidence: ["test_hq_flood_zero_dynamic_reserve_needs_funding"],
            })
          : undefined,
    };

    const creditComponents = semanticRuntimeCorpScoreComponents(
      input,
      gainCredit,
      "basic_economy_draw",
      dependencies,
    );
    const advanceComponents = semanticRuntimeCorpScoreComponents(
      input,
      advanceAgenda,
      "simple_score_advance",
      dependencies,
    );

    expect(creditComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_alignment",
          reason: expect.stringContaining(
            "triage_primary:force_scoreline_clock",
          ),
        }),
      ]),
    );
    expect(advanceComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_mismatch",
          reason: expect.stringContaining("triage_required_rez_floor:8"),
        }),
      ]),
    );
    expect(totalScore(creditComponents)).toBeGreaterThan(
      totalScore(advanceComponents),
    );
  });

  it("does not force unsafe scoreline when low R&D has no visible HQ agenda flood", () => {
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
    const installRemoteIce = corpAction("install-remote-ice", "install_card", {
      placement: "ice",
      serverId: "remote_1",
    });
    const input = corpInputWithDeckoutFlood(6, [agendaCard("agenda-1")], 3, [
      installAgenda,
      installRemoteIce,
    ]);
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
              recommendedNextStep: "build_remote_ice",
              evidence: ["test_no_agenda_flood"],
            })
          : undefined,
    };

    const installComponents = semanticRuntimeCorpScoreComponents(
      input,
      installAgenda,
      "basic_install",
      dependencies,
    );

    expect(JSON.stringify(installComponents)).not.toContain(
      "force_scoreline_clock",
    );
    expect(
      totalScoreFor(input, installRemoteIce, "basic_install", dependencies),
    ).toBeGreaterThan(totalScore(installComponents));
  });

  it("defers low-value central over-ice when no triage needs development", () => {
    const installRdIce = corpAction(
      "install-low-value-rd-ice",
      "install_card",
      { placement: "ice", serverId: "rd" },
      "rd-extra-ice",
    );
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithHqCards(
      6,
      [corpIce("rd-extra-ice")],
      [installRdIce, gainCredit],
    );
    input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      {
        id: "rd",
        label: "R&D",
        ice: [
          corpIce("rd-1", { definitionId: "simple_barrier_ice" }),
          corpIce("rd-2", { definitionId: "simple_barrier_ice" }),
          corpIce("rd-3", { definitionId: "simple_barrier_ice" }),
        ],
        root: [],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      rolesForAction: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === installRdIce.actionId ? ["ice", "protect"] : [],
    };

    const installComponents = semanticRuntimeCorpScoreComponents(
      input,
      installRdIce,
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
          key: "corp_low_value_install_defer",
          reason: expect.stringContaining("triage_primary:low_value"),
        }),
      ]),
    );
    expect(totalScore(creditComponents)).toBeGreaterThan(
      totalScore(installComponents),
    );
  });

  it("penalizes central over-ice while an agenda needs an underbuilt remote", () => {
    const installHqIce = corpAction(
      "install-third-hq-ice",
      "install_card",
      { placement: "ice", serverId: "hq" },
      "hq-extra-ice",
    );
    const input = corpInputWithHqCards(
      8,
      [agendaCard("agenda-in-hq"), corpIce("hq-extra-ice")],
      [installHqIce],
    );
    input.playerView.servers = [
      {
        id: "hq",
        label: "HQ",
        ice: [corpIce("hq-1"), corpIce("hq-2")],
        root: [],
      },
      { id: "rd", label: "R&D", ice: [], root: [] },
      { id: "remote_1", label: "Remote 1", ice: [], root: [] },
    ];

    const components = semanticRuntimeCorpScoreComponents(
      input,
      installHqIce,
      "basic_install",
      {
        ...testDependencies(),
        rolesForAction: () => ["ice", "protect"],
      },
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_central_overice_remote_underbuild",
          value: -2600,
          reason: expect.stringContaining("underbuilt_remote:remote_1"),
        }),
      ]),
    );
  });

  it("uses board triage so HQ protection beats remote setup under agenda exposure", () => {
    const protectHq = corpAction("protect-hq", "install_card", {
      placement: "ice",
      serverId: "hq",
    });
    const buildRemote = corpAction("build-remote", "install_card", {
      placement: "ice",
      serverId: "remote_1",
    });
    const input = corpInputWithHqCards(
      6,
      [agendaCard()],
      [protectHq, buildRemote],
    );
    input.playerView.opponent = {
      identity: {
        instanceId: "runner-identity",
        known: true,
        owner: "runner",
        type: "identity",
        counterDisplays: [],
      },
      credits: 6,
      clicks: 4,
      agendaPoints: 5,
      tags: 0,
      handCount: 4,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      rig: [],
      scoreArea: [],
    };

    expect(
      totalScoreFor(input, protectHq, "basic_install", testDependencies()),
    ).toBeGreaterThan(
      totalScoreFor(input, buildRemote, "basic_install", testDependencies()),
    );
  });

  it("does not treat damage-only central ICE as satisfying critical central triage", () => {
    const brainWash = corpCard("brain-wash", "ice", {
      rulesText: "Do 1 net damage.",
      rezzed: false,
      rezCost: 1,
    });
    const wall = corpCard("wall", "ice", {
      rulesText: "End the run.",
      rezzed: false,
      rezCost: 1,
    });
    const rezBrainWash = corpAction(
      "rez-brain-wash",
      "rez_ice",
      {
        serverId: "hq",
      },
      brainWash.instanceId,
    );
    const rezWall = corpAction(
      "rez-wall",
      "rez_ice",
      {
        serverId: "hq",
      },
      wall.instanceId,
    );
    const input = corpInputWithHqCards(
      6,
      [agendaCard()],
      [rezBrainWash, rezWall],
    );
    input.playerView.opponent = {
      identity: {
        instanceId: "runner-identity",
        known: true,
        owner: "runner",
        type: "identity",
        counterDisplays: [],
      },
      credits: 0,
      clicks: 0,
      agendaPoints: 5,
      tags: 0,
      handCount: 0,
      maxHandSize: 5,
      deckCount: 0,
      discardCount: 0,
      rig: [],
      scoreArea: [],
    };
    input.playerView.servers = [
      {
        id: "hq",
        label: "HQ",
        ice: [brainWash, wall],
        root: [],
      },
      { id: "rd", label: "R&D", ice: [], root: [] },
      { id: "archives", label: "Archives", ice: [], root: [] },
    ];
    const brainWashCandidate = semanticCandidate(
      rezBrainWash.actionId,
      "rez.ice",
      ["damage"],
      "rez_ice",
    );
    const wallCandidate = semanticCandidate(
      rezWall.actionId,
      "rez.ice",
      ["end_the_run"],
      "rez_ice",
    );

    const brainWashComponents = semanticRuntimeCorpScoreComponents(
      input,
      rezBrainWash,
      "simple_rez",
      testDependencies(),
      brainWashCandidate,
    );
    const wallComponents = semanticRuntimeCorpScoreComponents(
      input,
      rezWall,
      "simple_rez",
      testDependencies(),
      wallCandidate,
    );

    expect(brainWashComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "corp_board_triage_mismatch" }),
      ]),
    );
    expect(wallComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "corp_board_triage_alignment" }),
      ]),
    );
    expect(totalScore(wallComponents)).toBeGreaterThan(
      totalScore(brainWashComponents),
    );
  });

  it("prefers HQ access-stop ICE over position-dependent ICE under HQ agenda pressure", () => {
    const agenda = agendaCard("agenda-1");
    const taxOnlyIce = corpCard("ball-and-chain", "ice", {
      title: "Ball and Chain",
      definitionId: "onr_v1_222_ball-and-chain",
      rezCost: 2,
    });
    const etrIce = corpCard("data-wall", "ice", {
      title: "Data Wall",
      definitionId: "onr_v1_237_data-wall",
      rezCost: 1,
    });
    const installTaxOnly = corpAction(
      "install-ball-and-chain-hq",
      "install_card",
      { placement: "ice", serverId: "hq" },
      taxOnlyIce.instanceId,
    );
    const installEtr = corpAction(
      "install-data-wall-hq",
      "install_card",
      { placement: "ice", serverId: "hq" },
      etrIce.instanceId,
    );
    const input = corpInputWithHqCards(
      6,
      [agenda, taxOnlyIce, etrIce],
      [installTaxOnly, installEtr],
    );
    input.playerView.opponent = runnerOpponent({
      agendaPoints: 3,
      credits: 6,
    });
    input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
    ];

    const taxComponents = semanticRuntimeCorpScoreComponents(
      input,
      installTaxOnly,
      "basic_install",
      testDependencies(),
    );
    const etrComponents = semanticRuntimeCorpScoreComponents(
      input,
      installEtr,
      "basic_install",
      testDependencies(),
    );

    expect(taxComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_ice_placement_evaluator",
          reason: expect.stringContaining("position_dependent:true"),
        }),
      ]),
    );
    expect(etrComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_ice_placement_evaluator",
          reason: expect.stringContaining("position_dependent:false"),
        }),
      ]),
    );
    expect(totalScore(etrComponents)).toBeGreaterThan(
      totalScore(taxComponents),
    );
  });

  it("uses board triage and downstream budget so inner relevant ICE beats breakable outer rez", () => {
    const innerSentry = corpIce("inner-sentry", {
      definitionId: "simple_sentry_ice",
      subtypes: ["Sentry"],
      rezCost: 6,
    });
    const outerWall = corpIce("outer-wall", {
      definitionId: "simple_barrier_ice",
      subtypes: ["Barrier"],
      rezCost: 1,
    });
    const rezInner = corpAction(
      "rez-inner-sentry",
      "rez_ice",
      { serverId: "hq" },
      innerSentry.instanceId,
    );
    const rezOuter = corpAction(
      "rez-outer-wall",
      "rez_ice",
      { serverId: "hq" },
      outerWall.instanceId,
    );
    const input = corpInputWithHqCards(6, [agendaCard()], [rezInner, rezOuter]);
    input.playerView.opponent = {
      identity: {
        instanceId: "runner-identity",
        known: true,
        owner: "runner",
        type: "identity",
        counterDisplays: [],
      },
      credits: 4,
      clicks: 4,
      agendaPoints: 5,
      tags: 0,
      handCount: 4,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      rig: [fracterBreaker()],
      scoreArea: [],
    };
    input.playerView.servers = [
      {
        id: "hq",
        label: "HQ",
        root: [],
        ice: [innerSentry, outerWall],
      },
      { id: "rd", label: "R&D", ice: [], root: [] },
      { id: "archives", label: "Archives", ice: [], root: [] },
    ];
    const dependencies = {
      ...testDependencies(),
      actionCreditCost: (action: LegalAction) =>
        action.actionId === rezInner.actionId ? 6 : 1,
    };
    const innerCandidate = {
      ...semanticCandidate(
        rezInner.actionId,
        "corp_window.rez",
        ["role:etr_ice", "corp_ice.end_run"],
        "rez_ice",
      ),
      costProfile: {
        creditCost: 6,
        costKnownStatus: "known" as const,
        additionalCosts: [],
      },
    };
    const outerCandidate = {
      ...semanticCandidate(
        rezOuter.actionId,
        "corp_window.rez",
        ["role:etr_ice", "corp_ice.end_run"],
        "rez_ice",
      ),
      costProfile: {
        creditCost: 1,
        costKnownStatus: "known" as const,
        additionalCosts: [],
      },
    };

    const innerComponents = semanticRuntimeCorpScoreComponents(
      input,
      rezInner,
      "simple_rez",
      dependencies,
      innerCandidate,
    );
    const outerComponents = semanticRuntimeCorpScoreComponents(
      input,
      rezOuter,
      "simple_rez",
      dependencies,
      outerCandidate,
    );

    expect(innerComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "corp_board_triage_alignment" }),
      ]),
    );
    expect(outerComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_downstream_rez_floor_preservation",
        }),
        expect.objectContaining({ key: "corp_board_triage_mismatch" }),
      ]),
    );
    expect(totalScore(innerComponents)).toBeGreaterThan(
      totalScore(outerComponents),
    );
  });

  it("penalizes basic credit loops when reserve is satisfied and development is legal", () => {
    const basicCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const installRemoteIce = corpAction("install-remote-ice", "install_card", {
      placement: "ice",
      serverId: "remote_1",
    });
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithGoals([], [basicCredit, installRemoteIce]),
      basicCredit,
      "basic_economy_draw",
      testDependencies(),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_reserve_satisfied_credit_loop_penalty",
          value: -15,
          reason: expect.stringContaining("reserve_raw_value:-750"),
        }),
        expect.objectContaining({
          key: "corp_reserve_satisfied_credit_loop_penalty",
          reason: expect.stringContaining("reserve_normalized_value:-15"),
        }),
      ]),
    );
  });

  it("keeps basic credit viable when the only development line is currently unstable", () => {
    const basicCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const installRemoteAgenda = corpAction(
      "install-remote-agenda",
      "install_card",
      {
        placement: "root",
        serverId: "new_remote",
      },
    );
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithGoals([], [basicCredit, installRemoteAgenda]),
      basicCredit,
      "basic_economy_draw",
      {
        ...testDependencies(),
        corpHasRemoteInstability: () => true,
      },
    );

    expect(components).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_reserve_satisfied_credit_loop_penalty",
        }),
      ]),
    );
  });

  it("scores mixed credit and draw Corp operations by combined action value", () => {
    const nightShift = corpAction(
      "play-night-shift",
      "play_operation",
      {},
      "corp_night_shift",
    );
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(0, [nightShiftCard()], [nightShift]),
      nightShift,
      "basic_install",
      testDependencies(),
      semanticCandidate(
        nightShift.actionId,
        "play.corp_operation",
        ["economy.corp_credit_burst"],
        "play_operation",
      ),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_operation_burst_economy",
          value: 1890,
          reason: expect.stringContaining("operation_draw:1"),
        }),
      ]),
    );
  });

  it("penalizes an expensive extra-action burst without direct urgent-plan progress", () => {
    const overtime = corpAction(
      "play-overtime",
      "play_operation",
      {},
      "overtime-incentives",
    );
    const installAgenda = corpAction(
      "install-hostile-takeover",
      "install_card",
      { placement: "root", serverId: "remote_1" },
      "hostile-takeover",
    );
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const agenda = {
      instanceId: "hostile-takeover",
      known: true,
      title: "Hostile Takeover",
      type: "agenda",
      owner: "corp",
      controller: "corp",
      advancementRequirement: 3,
      advancementCounters: 0,
      agendaPoints: 1,
    } as VisibleCard;
    const overtimeCard = economyOperationCard({
      instanceId: "overtime-incentives",
      title: "Overtime Incentives",
      rulesText: "Gain two actions.",
      cost: 4,
    });
    const input = corpInputWithHqCardsAndServers(
      8,
      [agenda, overtimeCard],
      [
        { id: "hq", label: "HQ", ice: [corpIce("hq-stop")], root: [] },
        { id: "rd", label: "R&D", ice: [corpIce("rd-stop")], root: [] },
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [corpIce("remote-filter")],
          root: [],
        },
      ],
      [installAgenda, overtime, gainCredit],
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
              agendaStealRelevantBeforeScore: true,
              corpCanRezRelevantIce: true,
              corpCanRezFullPathWithDynamicReserve: true,
              recommendedNextStep: "build_remote_ice",
            })
          : undefined,
    };
    const overtimeCandidate = {
      ...semanticCandidate(
        overtime.actionId,
        "play.corp_operation",
        ["corp_extra_action_burst"],
        "play_operation",
      ),
      costProfile: {
        costKnownStatus: "known" as const,
        creditCost: 4,
        clickCost: 1,
        additionalCosts: [],
      },
    };

    const components = semanticRuntimeCorpScoreComponents(
      input,
      overtime,
      "basic_install",
      dependencies,
      overtimeCandidate,
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_context",
          value: 0,
        }),
        expect.objectContaining({
          key: "corp_unbacked_extra_action_burst",
          value: -2600,
          reason: expect.stringContaining(
            "extra_action_burst_without_direct_plan_progress:true",
          ),
        }),
      ]),
    );
    expect(JSON.stringify(components)).toContain("net_extra_actions:1");
    expect(JSON.stringify(components)).toContain("credit_cost:4");
  });

  it("allows an extra-action burst whose basic return covers its cost", () => {
    const overtime = corpAction(
      "play-free-overtime",
      "play_operation",
      {},
      "free-overtime",
    );
    const input = corpInputWithHqCards(
      0,
      [
        economyOperationCard({
          instanceId: "free-overtime",
          title: "Efficient Overtime",
          rulesText: "Gain two actions.",
          cost: 0,
        }),
      ],
      [overtime],
    );
    const candidate = {
      ...semanticCandidate(
        overtime.actionId,
        "play.corp_operation",
        ["corp_extra_action_burst"],
        "play_operation",
      ),
      costProfile: {
        costKnownStatus: "known" as const,
        creditCost: 0,
        clickCost: 1,
        additionalCosts: [],
      },
    };

    expect(
      semanticRuntimeCorpScoreComponents(
        input,
        overtime,
        "basic_install",
        testDependencies(),
        candidate,
      ).some(
        (component) => component.key === "corp_unbacked_extra_action_burst",
      ),
    ).toBe(false);
  });

  it("scores bracket notation Corp credit operations", () => {
    const creditConsolidation = corpAction(
      "play-credit-consolidation",
      "play_operation",
      {},
      "corp_credit_consolidation",
    );
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(
        10,
        [
          economyOperationCard({
            instanceId: "corp_credit_consolidation",
            definitionId: "onr_proteus_047_credit-consolidation",
            title: "Credit Consolidation",
            rulesText: "Gain [15].",
            cost: 10,
          }),
        ],
        [creditConsolidation],
      ),
      creditConsolidation,
      "basic_install",
      testDependencies(),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_operation_burst_economy",
          value: 2250,
          reason: expect.stringContaining("operation_gain:15"),
        }),
      ]),
    );
    expect(JSON.stringify(components)).toContain("burst_economy_net_gain:5");
    expect(JSON.stringify(components)).toContain("operation_action_value:5");
  });

  it("scores German immediate credit and draw operations", () => {
    const creditSurge = corpAction(
      "play-credit-surge",
      "play_operation",
      {},
      "corp_credit_surge",
    );
    const archivePlanning = corpAction(
      "play-archive-planning",
      "play_operation",
      {},
      "corp_archive_planning",
    );

    const creditComponents = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(
        1,
        [
          economyOperationCard({
            instanceId: "corp_credit_surge",
            definitionId: "v08_credit_surge_operation",
            title: "Credit Surge",
            rulesText: "Erhalte 7 Credits.",
            cost: 1,
          }),
        ],
        [creditSurge],
      ),
      creditSurge,
      "basic_install",
      testDependencies(),
    );
    const drawComponents = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(
        0,
        [
          economyOperationCard({
            instanceId: "corp_archive_planning",
            definitionId: "v08_archive_planning_operation",
            title: "Archive Planning",
            rulesText: "Ziehe 3 Karten.",
            cost: 0,
          }),
        ],
        [archivePlanning],
      ),
      archivePlanning,
      "basic_install",
      testDependencies(),
    );

    expect(creditComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_operation_burst_economy",
          value: 2430,
          reason: expect.stringContaining("burst_economy_net_gain:6"),
        }),
      ]),
    );
    expect(drawComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_operation_burst_economy",
          value: 1890,
          reason: expect.stringContaining("operation_draw:3"),
        }),
      ]),
    );
  });

  it("bounds Corp credit gain rules text to exact credit tokens", () => {
    const creditNoise = corpAction(
      "play-credit-noise",
      "play_operation",
      {},
      "corp_credit_noise",
    );
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(
        0,
        [
          economyOperationCard({
            instanceId: "corp_credit_noise",
            definitionId: "v099_credit_noise_operation",
            title: "Credit Noise",
            rulesText: "Gain 3 creditish markers.",
            cost: 0,
          }),
        ],
        [creditNoise],
      ),
      creditNoise,
      "basic_install",
      testDependencies(),
    );

    expect(
      components.some(
        (component) => component.key === "corp_operation_burst_economy",
      ),
    ).toBe(false);
  });

  it("bounds Corp draw rules text to exact card tokens", () => {
    const drawNoise = corpAction(
      "play-draw-noise",
      "play_operation",
      {},
      "corp_draw_noise",
    );
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(
        0,
        [
          economyOperationCard({
            instanceId: "corp_draw_noise",
            definitionId: "v099_draw_noise_operation",
            title: "Draw Noise",
            rulesText: "Draw one cardish marker.",
            cost: 0,
          }),
        ],
        [drawNoise],
      ),
      drawNoise,
      "basic_install",
      testDependencies(),
    );

    expect(
      components.some(
        (component) => component.key === "corp_operation_burst_economy",
      ),
    ).toBe(false);
  });

  it("scores value-two Corp draw operations above basic draw without burst tier", () => {
    const simpleDraw = corpAction(
      "play-simple-draw",
      "play_operation",
      {},
      "corp_simple_draw",
    );
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(
        0,
        [
          economyOperationCard({
            instanceId: "corp_simple_draw",
            definitionId: "simple_draw_operation",
            title: "Simple Draw Operation",
            rulesText: "Ziehe 2 Karten.",
            cost: 0,
          }),
        ],
        [simpleDraw],
      ),
      simpleDraw,
      "basic_install",
      testDependencies(),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_operation_burst_economy",
          value: 1530,
          reason: expect.stringContaining("operation_action_value:2"),
        }),
      ]),
    );
    expect(JSON.stringify(components)).toContain(
      "operation_economy_tier:efficient",
    );
  });

  it("does not score visible drawback operations as generic immediate economy", () => {
    const badPublicityOperation = corpAction(
      "play-bad-publicity",
      "play_operation",
      {},
      "corp_bad_publicity",
    );
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(
        0,
        [
          economyOperationCard({
            instanceId: "corp_bad_publicity",
            definitionId: "v099_bad_publicity_operation",
            title: "Bad Publicity Operation",
            rulesText: "Gain 3 credits and take 1 bad publicity.",
            cost: 0,
          }),
        ],
        [badPublicityOperation],
      ),
      badPublicityOperation,
      "basic_install",
      testDependencies(),
    );

    expect(
      components.some(
        (component) => component.key === "corp_operation_burst_economy",
      ),
    ).toBe(false);
  });

  it("bounds visible drawback operation rules text to exact bad publicity tokens", () => {
    const noisyOperation = corpAction(
      "play-noisy-publicity",
      "play_operation",
      {},
      "corp_noisy_publicity",
    );
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(
        0,
        [
          economyOperationCard({
            instanceId: "corp_noisy_publicity",
            definitionId: "v099_noisy_publicity_operation",
            title: "Noisy Publicity Operation",
            rulesText: "Gain 3 credits and take 1 bad publicityish marker.",
            cost: 0,
          }),
        ],
        [noisyOperation],
      ),
      noisyOperation,
      "basic_install",
      testDependencies(),
    );

    expect(
      components.some(
        (component) => component.key === "corp_operation_burst_economy",
      ),
    ).toBe(true);
  });

  it("scores advance, rez and install actions that match Corp tactical goals", () => {
    const cases: Array<{
      goal: TacticalGoalLike;
      action: LegalAction;
      scopeId: string;
      expectedValue: number;
    }> = [
      {
        goal: {
          goalId: "corp.tactical.advance_scoreline",
          family: "corp_scoreline",
          priority: 820,
          urgency: "high",
          source: "boardstate",
          evidence: ["test_goal"],
        },
        action: corpAction("advance-card", "advance_card"),
        scopeId: "simple_score_advance",
        expectedValue: 820,
      },
      {
        goal: {
          goalId: "corp.tactical.rez_relevant_ice",
          family: "corp_ice_defense",
          priority: 780,
          urgency: "medium",
          source: "boardstate",
          evidence: ["test_goal"],
        },
        action: corpAction("rez-ice", "rez_ice", {}, "corp-test-ice"),
        scopeId: "simple_rez",
        expectedValue: 780,
      },
      {
        goal: {
          goalId: "corp.tactical.prepare_remote",
          family: "setup",
          priority: 690,
          urgency: "medium",
          targetServerId: "remote_1",
          source: "boardstate",
          evidence: ["test_goal"],
        },
        action: corpAction("install-remote", "install_card"),
        scopeId: "basic_install",
        expectedValue: 690,
      },
      {
        goal: {
          goalId: "corp.tactical.protect_central",
          family: "corp_ice_defense",
          priority: 720,
          urgency: "medium",
          targetServerId: "rd",
          source: "boardstate",
          evidence: ["test_goal"],
        },
        action: corpAction("install-central", "install_card"),
        scopeId: "basic_install",
        expectedValue: 720,
      },
    ];

    for (const testCase of cases) {
      const baseInput = corpInputWithGoals([testCase.goal]);
      const input =
        testCase.action.type === "rez_ice"
          ? ({
              ...baseInput,
              playerView: {
                ...baseInput.playerView,
                servers: [
                  {
                    id: "rd",
                    label: "R&D",
                    ice: [
                      corpIce("corp-test-ice", {
                        definitionId: "onr_v1_237_data-wall",
                        title: "Data Wall",
                      }),
                    ],
                    root: [],
                  },
                ],
              },
            } as unknown as AiDecisionInput)
          : baseInput;
      const components = semanticRuntimeCorpScoreComponents(
        input,
        testCase.action,
        testCase.scopeId,
        testDependencies(),
      );

      expect(components).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: "corp_goal_fit_tactical_goal",
            value: testCase.expectedValue,
            reason: expect.stringContaining(`goal:${testCase.goal.goalId}`),
          }),
        ]),
      );
    }
  });

  it("does not apply the agenda-advance goal to a visible advancement-support asset", () => {
    const vapor = corpCard("vapor", "asset", {
      definitionId: "onr_v1_347_vapor-ops",
      title: "Vapor Ops",
      advancementCounters: 1,
    });
    const advanceVapor = corpAction(
      "advance-vapor",
      "advance_card",
      { serverId: "remote_1" },
      vapor.instanceId,
    );
    const input = corpInputWithGoals(
      [
        {
          goalId: "corp.tactical.advance_scoreline",
          family: "corp_scoreline",
          priority: 820,
          urgency: "high",
          source: "boardstate",
          evidence: ["test_goal"],
        },
      ],
      [advanceVapor],
    );
    input.playerView.servers = [
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [],
        root: [vapor],
      },
    ];

    const components = semanticRuntimeCorpScoreComponents(
      input,
      advanceVapor,
      "simple_score_advance",
      testDependencies(),
    );

    expect(
      components.some(
        (component) =>
          component.key === "corp_goal_fit_tactical_goal" &&
          component.reason?.includes("corp.tactical.advance_scoreline") ===
            true,
      ),
    ).toBe(false);
  });

  it("scores structured Corp install roles and ignores substring-only role noise", () => {
    const structuredKeys = componentKeysForInstallRoles([
      "ice_tax",
      "remote_protect",
      "economy_asset",
    ]);
    expect(structuredKeys).toContain("corp_install_protection");
    expect(structuredKeys).toContain("corp_install_economy");

    const noiseKeys = componentKeysForInstallRoles([
      "nice_noise",
      "protectorate_noise",
      "microeconomy_noise",
    ]);
    expect(noiseKeys).not.toContain("corp_install_protection");
    expect(noiseKeys).not.toContain("corp_install_economy");
  });

  it("hard-penalizes agenda-difficulty upgrades on central servers despite agenda roles", () => {
    const washington = corpCard("washington", "upgrade", {
      title: "Washington, D.C., City Grid",
      definitionId: "onr_v1_374_washington-d-c-city-grid",
    });
    const installHq = corpAction(
      "install-washington-hq",
      "install_card",
      { placement: "root", serverId: "hq", cardType: "upgrade" },
      washington.instanceId,
    );
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(7, [washington], [installHq]),
      installHq,
      "basic_install",
      {
        ...testDependencies(),
        rolesForAction: () => [
          "upgrade",
          "agenda",
          "remote_upgrade_agenda_support",
        ],
        corpActionIsScoreLine: () => true,
      },
      semanticCandidate(
        installHq.actionId,
        "install.card",
        [
          "remote.agenda_difficulty_discount",
          "score.agenda_difficulty_discount",
        ],
        "install_card",
      ),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_install_score_line",
          value: 550,
        }),
        expect.objectContaining({
          key: "corp_upgrade_install_placement_mismatch",
          value: -5200,
          reason: expect.stringContaining(
            "mismatch:agenda_difficulty_requires_remote_scoring_fort",
          ),
        }),
      ]),
    );
    expect(totalScore(components)).toBeLessThan(0);
  });

  it("rewards agenda-difficulty upgrades only on prepared or active scoring remotes", () => {
    const washington = corpCard("washington", "upgrade", {
      title: "Washington, D.C., City Grid",
      definitionId: "onr_v1_374_washington-d-c-city-grid",
    });
    const installRemote = corpAction(
      "install-washington-remote",
      "install_card",
      { placement: "root", serverId: "remote_1", cardType: "upgrade" },
      washington.instanceId,
    );
    const candidateForWashington = semanticCandidate(
      installRemote.actionId,
      "install.card",
      ["remote.agenda_difficulty_discount", "score.agenda_difficulty_discount"],
      "install_card",
    );
    const preparedComponents = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCardsAndServers(
        7,
        [washington],
        [
          {
            id: "remote_1",
            label: "Remote 1",
            ice: [corpCard("remote-ice", "ice")],
            root: [],
          },
        ],
        [installRemote],
      ),
      installRemote,
      "basic_install",
      {
        ...testDependencies(),
        rolesForAction: () => [
          "upgrade",
          "agenda",
          "remote_upgrade_agenda_support",
        ],
        corpActionIsScoreLine: () => true,
      },
      candidateForWashington,
    );
    const activeComponents = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCardsAndServers(
        7,
        [washington],
        [
          {
            id: "remote_1",
            label: "Remote 1",
            ice: [corpCard("remote-ice", "ice")],
            root: [agendaCard("remote-agenda")],
          },
        ],
        [installRemote],
      ),
      installRemote,
      "basic_install",
      {
        ...testDependencies(),
        rolesForAction: () => [
          "upgrade",
          "agenda",
          "remote_upgrade_agenda_support",
        ],
        corpActionIsScoreLine: () => true,
      },
      candidateForWashington,
    );

    expect(preparedComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_upgrade_install_placement_fit",
          value: 850,
          reason: expect.stringContaining(
            "fit:agenda_difficulty_prepared_score_remote",
          ),
        }),
      ]),
    );
    expect(activeComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_upgrade_install_placement_fit",
          value: 1600,
          reason: expect.stringContaining(
            "fit:agenda_difficulty_active_scoreline_remote",
          ),
        }),
      ]),
    );
  });

  it("keeps central-only upgrades on their central servers", () => {
    const panicButton = corpCard("panic-button", "upgrade", {
      title: "Panic Button",
      definitionId: "onr_proteus_067_panic-button",
    });
    const installPanicHq = corpAction(
      "install-panic-hq",
      "install_card",
      { placement: "root", serverId: "hq", cardType: "upgrade" },
      panicButton.instanceId,
    );
    const installPanicRemote = corpAction(
      "install-panic-remote",
      "install_card",
      { placement: "root", serverId: "remote_1", cardType: "upgrade" },
      panicButton.instanceId,
    );
    const panicCandidate = semanticCandidate(
      installPanicHq.actionId,
      "install.card",
      ["draw.corp_draw", "condition.during_hq_run"],
      "install_card",
    );
    const hqComponents = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(5, [panicButton], [installPanicHq]),
      installPanicHq,
      "basic_install",
      {
        ...testDependencies(),
        rolesForAction: () => [
          "upgrade",
          "remote_support",
          "build_scoring_remote",
        ],
      },
      panicCandidate,
    );
    const remoteComponents = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCardsAndServers(
        5,
        [panicButton],
        [
          {
            id: "remote_1",
            label: "Remote 1",
            ice: [corpCard("remote-ice", "ice")],
            root: [],
          },
        ],
        [installPanicRemote],
      ),
      installPanicRemote,
      "basic_install",
      {
        ...testDependencies(),
        rolesForAction: () => [
          "upgrade",
          "remote_support",
          "build_scoring_remote",
        ],
      },
      {
        ...panicCandidate,
        actionId: installPanicRemote.actionId,
      },
    );

    expect(hqComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_upgrade_install_placement_fit",
          reason: expect.stringContaining("fit:hq_run_condition"),
        }),
      ]),
    );
    expect(remoteComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_upgrade_install_placement_mismatch",
          value: -5000,
          reason: expect.stringContaining("mismatch:requires_hq_run"),
        }),
      ]),
    );
  });

  it("keeps central-access reduction upgrades off remotes", () => {
    const simon = corpCard("simon-francisco", "upgrade", {
      title: "Simon Francisco",
      definitionId: "onr_proteus_073_simon-francisco",
    });
    const installRd = corpAction(
      "install-simon-rd",
      "install_card",
      { placement: "root", serverId: "rd", cardType: "upgrade" },
      simon.instanceId,
    );
    const installRemote = corpAction(
      "install-simon-remote",
      "install_card",
      { placement: "root", serverId: "remote_1", cardType: "upgrade" },
      simon.instanceId,
    );
    const simonCandidate = semanticCandidate(
      installRd.actionId,
      "install.card",
      ["access.corp_central_access_reduction"],
      "install_card",
    );
    const rdComponents = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(5, [simon], [installRd]),
      installRd,
      "basic_install",
      {
        ...testDependencies(),
        rolesForAction: () => [
          "upgrade",
          "remote_support",
          "build_scoring_remote",
        ],
      },
      simonCandidate,
    );
    const remoteComponents = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCardsAndServers(
        5,
        [simon],
        [
          {
            id: "remote_1",
            label: "Remote 1",
            ice: [corpCard("remote-ice", "ice")],
            root: [],
          },
        ],
        [installRemote],
      ),
      installRemote,
      "basic_install",
      {
        ...testDependencies(),
        rolesForAction: () => [
          "upgrade",
          "remote_support",
          "build_scoring_remote",
        ],
      },
      {
        ...simonCandidate,
        actionId: installRemote.actionId,
      },
    );

    expect(rdComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_upgrade_install_placement_fit",
          reason: expect.stringContaining("fit:central_access_reduction"),
        }),
      ]),
    );
    expect(remoteComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_upgrade_install_placement_mismatch",
          value: -4800,
          reason: expect.stringContaining("mismatch:requires_hq_or_rd"),
        }),
      ]),
    );
  });

  it("defers support-only upgrades that have no meaningful placement signal", () => {
    const simpleUpgrade = corpCard("simple-upgrade", "upgrade", {
      title: "Simple Upgrade",
      definitionId: "simple_upgrade",
    });
    const installSimple = corpAction(
      "install-simple-upgrade",
      "install_card",
      { placement: "root", serverId: "remote_1", cardType: "upgrade" },
      simpleUpgrade.instanceId,
    );
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCardsAndServers(
        5,
        [simpleUpgrade],
        [
          {
            id: "remote_1",
            label: "Remote 1",
            ice: [corpCard("remote-ice", "ice")],
            root: [],
          },
        ],
        [installSimple],
      ),
      installSimple,
      "basic_install",
      {
        ...testDependencies(),
        rolesForAction: () => ["upgrade", "remote_support", "recover_economy"],
      },
      semanticCandidate(
        installSimple.actionId,
        "install.card",
        ["install.card", "setup.install"],
        "install_card",
      ),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_upgrade_install_placement_defer",
          value: -900,
          reason: expect.stringContaining(
            "defer_reason:no_upgrade_tactic_signal",
          ),
        }),
      ]),
    );
  });

  it("surfaces Corp scoring-window assessment evidence in score components", () => {
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithGoals([]),
      corpAction("install-agenda", "install_card", {
        placement: "root",
        serverId: "remote_1",
      }),
      "basic_install",
      {
        ...testDependencies(),
        corpActionIsScoreLine: () => true,
        corpScoringWindowAssessment: () => ({
          serverId: "remote_1",
          windowKind: "unsafe",
          runnerCanContestNow: true,
          runnerCanReachAccessNow: true,
          agendaStealRelevantNow: true,
          runnerCanContestBeforeScore: true,
          runnerCanReachAccessBeforeScore: true,
          agendaStealRelevantBeforeScore: true,
          missingVisibleBreakerCoverage: false,
          corpCanRezRelevantIce: true,
          scoreHorizon: "next_turn",
          runnerExposureCreditActions: 3,
          recommendedNextStep: "build_remote_ice",
          evidence: [
            "corp_scoring_window:assessed",
            "runner_can_contest_before_score:true",
          ],
        }),
      },
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_scoring_window_assessment",
          value: 0,
          reason: expect.stringContaining("corp_scoring_window:assessed"),
        }),
      ]),
    );
  });

  it("scores visible tag punish actions from side-safe action semantics", () => {
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithGoals([
        {
          goalId: "corp.tactical.visible_tag_punish",
          family: "tag_punish",
          priority: 730,
          urgency: "medium",
          source: "boardstate",
          evidence: ["test_goal"],
        },
      ]),
      corpAction("tag-punish", "trigger_ability"),
      "basic_install",
      testDependencies(),
      semanticCandidate("tag-punish", "tag.apply", ["tag.punish"]),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_goal_fit_tactical_goal",
          value: 730,
          reason: expect.stringContaining(
            "goal:corp.tactical.visible_tag_punish",
          ),
        }),
      ]),
    );
  });

  it("preserves central ICE for post-pass lifecycle payments over returning it to HQ", () => {
    const payComponents = semanticRuntimeCorpScoreComponents(
      corpInputWithGoals([]),
      corpAction("twisty.pay", "continue_run", {
        corpPostPassIceAbility: "return_passed_ice_to_hq",
        sourceDefinitionId: "onr_proteus_043_twisty-passages",
        decision: "pay",
        paymentAmount: 1,
        serverId: "hq",
      }),
      "simple_run_choice",
      testDependencies(),
    );
    const returnComponents = semanticRuntimeCorpScoreComponents(
      corpInputWithGoals([]),
      corpAction("twisty.return_to_hq", "continue_run", {
        corpPostPassIceAbility: "return_passed_ice_to_hq",
        sourceDefinitionId: "onr_proteus_043_twisty-passages",
        decision: "return_to_hq",
        serverId: "hq",
      }),
      "simple_run_choice",
      testDependencies(),
    );

    expect(payComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_post_pass_ice_lifecycle_preserve",
          value: 1200,
          reason: expect.stringContaining("payment_amount:1"),
        }),
      ]),
    );
    expect(returnComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_post_pass_ice_lifecycle_return_to_hq_penalty",
          value: -1900,
          reason: expect.stringContaining("hq_ice_reinstall_extra_cost:2"),
        }),
      ]),
    );
  });

  it("scores visible damage or ambush actions from side-safe action semantics", () => {
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithGoals([
        {
          goalId: "corp.tactical.visible_damage_or_ambush_window",
          family: "damage_pressure",
          priority: 700,
          urgency: "medium",
          source: "boardstate",
          evidence: ["test_goal"],
        },
      ]),
      corpAction("damage-window", "activated_card_ability"),
      "basic_install",
      testDependencies(),
      semanticCandidate("damage-window", "damage.net", ["ambush.window"]),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_goal_fit_tactical_goal",
          value: 700,
          reason: expect.stringContaining(
            "goal:corp.tactical.visible_damage_or_ambush_window",
          ),
        }),
      ]),
    );
  });

  it("scores advancement-burst operations as score closeout candidates", () => {
    const closeoutAction = corpAction("advancement-burst", "play_operation");
    const remoteAgenda = agendaCard("remote-agenda");
    const components = semanticRuntimeCorpScoreComponents(
      {
        ...corpInputWithRemoteAgenda(5, 3, remoteAgenda, [
          closeoutAction,
          corpAction(
            "advance-scoreline",
            "advance_card",
            { cardId: remoteAgenda.instanceId, serverId: "remote_1" },
            remoteAgenda.instanceId,
          ),
        ]),
        ownCorpTacticalGoals: [
          {
            goalId: "corp.tactical.score_closeout",
            family: "corp_scoreline",
            priority: 860,
            urgency: "high",
            source: "boardstate",
            evidence: ["test_goal"],
          },
        ],
      } as unknown as AiDecisionInput,
      closeoutAction,
      "basic_install",
      testDependencies(),
      semanticCandidate(
        "advancement-burst",
        "play.corp_operation",
        ["corp.score_closeout", "advance.counter_cashout"],
        "play_operation",
      ),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_goal_fit_tactical_goal",
          value: 860,
          reason: expect.stringContaining("goal:corp.tactical.score_closeout"),
        }),
        expect.objectContaining({
          key: "corp_score_closeout_semantic_candidate",
          value: 1050,
        }),
      ]),
    );
  });

  it("matches score closeout target evidence by bounded terms", () => {
    const closeoutAction = corpAction("targeted-closeout", "play_operation");
    const input = corpInputWithGoals([], [closeoutAction]);
    const baseCandidate = semanticCandidate(
      "targeted-closeout",
      "play.corp_operation",
      ["corp.score_closeout"],
      "play_operation",
    );
    const agendaTarget = {
      ...baseCandidate,
      targetContext: {
        selectedTargets: [
          {
            targetId: "remote_1_agenda",
            targetKind: "card",
            targetSide: "corp",
            visibilityScope: "actor_private",
            evidence: ["target_role:agenda"],
          },
        ],
        targetKind: "card",
        targetZones: ["remote"],
        targetSide: "corp",
        hiddenInfoPolicy: "side_safe_engine_input_only",
        availableTargetsStatus: "engine_provided",
        targetProfileMatches: [],
        targetConstraintResults: [],
      },
    } satisfies ActionSemanticCandidate;
    const noiseTarget = {
      ...baseCandidate,
      targetContext: {
        selectedTargets: [
          {
            targetId: "remote_1_asset",
            targetKind: "card",
            targetSide: "corp",
            visibilityScope: "actor_private",
            evidence: ["target_role:agendaish_noise"],
          },
        ],
        targetKind: "card",
        targetZones: ["remote"],
        targetSide: "corp",
        hiddenInfoPolicy: "side_safe_engine_input_only",
        availableTargetsStatus: "engine_provided",
        targetProfileMatches: [],
        targetConstraintResults: [],
      },
    } satisfies ActionSemanticCandidate;
    const scorelineOnlyTarget = {
      ...baseCandidate,
      targetContext: {
        selectedTargets: [
          {
            targetId: "remote_1_scoreline_asset",
            targetKind: "card",
            targetSide: "corp",
            visibilityScope: "actor_private",
            evidence: ["target_role:scoreline"],
          },
        ],
        targetKind: "card",
        targetZones: ["remote"],
        targetSide: "corp",
        hiddenInfoPolicy: "side_safe_engine_input_only",
        availableTargetsStatus: "engine_provided",
        targetProfileMatches: [],
        targetConstraintResults: [],
      },
    } satisfies ActionSemanticCandidate;

    const agendaComponents = semanticRuntimeCorpScoreComponents(
      input,
      closeoutAction,
      "basic_install",
      testDependencies(),
      agendaTarget,
    );
    const noiseComponents = semanticRuntimeCorpScoreComponents(
      input,
      closeoutAction,
      "basic_install",
      testDependencies(),
      noiseTarget,
    );
    const scorelineOnlyComponents = semanticRuntimeCorpScoreComponents(
      input,
      closeoutAction,
      "basic_install",
      testDependencies(),
      scorelineOnlyTarget,
    );

    expect(agendaComponents.map((component) => component.key)).toContain(
      "corp_score_closeout_semantic_candidate",
    );
    expect(noiseComponents.map((component) => component.key)).not.toContain(
      "corp_score_closeout_semantic_candidate",
    );
    expect(
      scorelineOnlyComponents.map((component) => component.key),
    ).not.toContain("corp_score_closeout_semantic_candidate");
  });

  it("uses ActionSemanticCandidate cost profile for rez affordability", () => {
    const candidate = {
      ...semanticCandidate("rez-ice", "corp_window.rez", []),
      costProfile: {
        creditCost: 6,
        costKnownStatus: "known" as const,
        additionalCosts: [],
      },
    };
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithGoals([]),
      corpAction("rez-ice", "rez_ice"),
      "simple_rez",
      {
        ...testDependencies(),
        actionCreditCost: () => 0,
      },
      candidate,
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_rez_affordability",
          value: -1200,
          reason: "credits:5;cost:6",
        }),
      ]),
    );
  });

  it("penalizes rez actions with visible zero-effect defense risk", () => {
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithGoals([]),
      corpAction("homing-x0", "rez_ice", {
        variableRezKind: "x_strength",
        variableRezValue: 0,
      }),
      "simple_rez",
      {
        ...testDependencies(),
        actionCreditCost: () => 4,
      },
      {
        ...semanticCandidate("homing-x0", "corp_window.rez", [
          "role:trace_ice",
          "corp_ice.conditional_end_run",
          "trace.source",
        ]),
        actionType: "rez_ice",
        costProfile: {
          creditCost: 4,
          costKnownStatus: "known",
          variableCost: {
            kind: "rez_cost",
            chosen: 0,
            min: 0,
          },
          additionalCosts: [],
        },
      },
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_effective_defense_zero_effect_risk",
          value: -1600,
        }),
      ]),
    );
  });

  it("penalizes breakable outer rez when it drops below an inner central rez floor", () => {
    const action = corpAction(
      "rez-outer-wall",
      "rez_ice",
      { cardId: "outer-wall" },
      "outer-wall",
    );
    const components = semanticRuntimeCorpScoreComponents(
      {
        ...corpInputWithGoals([]),
        playerView: {
          ...corpInputWithGoals([]).playerView,
          own: {
            ...corpInputWithGoals([]).playerView.own,
            credits: 6,
          },
          opponent: {
            rig: [fracterBreaker()],
          },
          servers: [
            {
              id: "hq",
              label: "HQ",
              root: [],
              ice: [
                corpIce("inner-sentry", { rezCost: 6 }),
                corpIce("outer-wall", {
                  definitionId: "simple_barrier_ice",
                  subtypes: ["Barrier"],
                  rezCost: 1,
                }),
              ],
            },
          ],
        },
      } as unknown as AiDecisionInput,
      action,
      "simple_rez",
      {
        ...testDependencies(),
        actionCreditCost: () => 1,
      },
      {
        ...semanticCandidate(
          "rez-outer-wall",
          "corp_window.rez",
          ["role:etr_ice", "corp_ice.end_run"],
          "rez_ice",
        ),
        costProfile: {
          creditCost: 1,
          costKnownStatus: "known",
          additionalCosts: [],
        },
      },
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_downstream_rez_floor_preservation",
          value: -1800,
          reason: expect.stringContaining("inner_rez_floor:6"),
        }),
        expect.objectContaining({
          key: "corp_downstream_rez_floor_preservation",
          reason: expect.stringContaining("downstream_reserve_value:-1800"),
        }),
      ]),
    );
  });

  it("never rezzes an access ambush whose effect resolves while unrezzed", () => {
    const setup = corpCard("setup", "asset", {
      definitionId: "onr_v1_340_setup",
      title: "Setup!",
      rezzed: false,
    });
    const action = corpAction("rez-setup", "rez_ice", {}, setup.instanceId);
    const base = corpInputWithGoals([]);
    const input = {
      ...base,
      playerView: {
        ...base.playerView,
        timingPoint: "run.approach_ice",
        run: {
          attackedServerId: "remote_1",
          phase: "approach_ice",
          position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
          successful: false,
        },
        servers: [
          {
            id: "remote_1",
            label: "Remote 1",
            ice: [corpIce("remote-wall")],
            root: [setup],
          },
        ],
      },
    } as unknown as AiDecisionInput;

    const components = semanticRuntimeCorpScoreComponents(
      input,
      action,
      "simple_rez",
      testDependencies(),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_root_rez_unnecessary_access_ambush",
          value: -5000,
        }),
      ]),
    );
    expect(components.map((component) => component.key)).not.toContain(
      "corp_effective_defense_zero_effect_risk",
    );
  });

  it("rezzes a free persistent fort install discount before paid same-fort ICE", () => {
    const discountUpgrade = corpCard("discount-upgrade", "upgrade", {
      definitionId: "onr_v1_352_chester-mix",
      title: "Chester Mix",
      rezzed: false,
    });
    const iceInHq = corpIce("ice-in-hq");
    const rezDiscount = corpAction(
      "rez-discount",
      "rez_ice",
      {},
      discountUpgrade.instanceId,
    );
    const installIce = corpAction(
      "install-hq-ice",
      "install_card",
      { cardId: iceInHq.instanceId, serverId: "hq", placement: "ice" },
      iceInHq.instanceId,
    );
    const base = corpInputWithGoals([], [rezDiscount, installIce]);
    const input = {
      ...base,
      playerView: {
        ...base.playerView,
        timingPoint: "corp_action.main",
        own: {
          ...base.playerView.own,
          gripOrHq: [iceInHq],
        },
        servers: [
          {
            id: "hq",
            label: "HQ",
            ice: [corpIce("existing-hq-ice")],
            root: [discountUpgrade],
          },
        ],
      },
    } as unknown as AiDecisionInput;

    const components = semanticRuntimeCorpScoreComponents(
      input,
      rezDiscount,
      "simple_rez",
      {
        ...testDependencies(),
        actionCreditCost: (action) =>
          action.actionId === installIce.actionId ? 1 : 0,
      },
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_persistent_install_discount_sequence",
          value: 3200,
          reason: expect.stringContaining("server:hq"),
        }),
      ]),
    );
  });

  it("does not rez a fort install discount without paid same-fort ICE", () => {
    const discountUpgrade = corpCard("discount-upgrade", "upgrade", {
      definitionId: "onr_v1_352_chester-mix",
      title: "Chester Mix",
      rezzed: false,
    });
    const iceInHq = corpIce("ice-in-hq");
    const rezDiscount = corpAction(
      "rez-discount",
      "rez_ice",
      {},
      discountUpgrade.instanceId,
    );
    const installArchivesIce = corpAction(
      "install-archives-ice",
      "install_card",
      {
        cardId: iceInHq.instanceId,
        serverId: "archives",
        placement: "ice",
      },
      iceInHq.instanceId,
    );
    const base = corpInputWithGoals([], [rezDiscount, installArchivesIce]);
    const input = {
      ...base,
      playerView: {
        ...base.playerView,
        timingPoint: "corp_action.main",
        own: {
          ...base.playerView.own,
          gripOrHq: [iceInHq],
        },
        servers: [
          {
            id: "hq",
            label: "HQ",
            ice: [corpIce("existing-hq-ice")],
            root: [discountUpgrade],
          },
          { id: "archives", label: "Archives", ice: [], root: [] },
        ],
      },
    } as unknown as AiDecisionInput;

    const components = semanticRuntimeCorpScoreComponents(
      input,
      rezDiscount,
      "simple_rez",
      {
        ...testDependencies(),
        actionCreditCost: (action) =>
          action.actionId === installArchivesIce.actionId ? 1 : 0,
      },
    );

    expect(components.map((component) => component.key)).not.toContain(
      "corp_persistent_install_discount_sequence",
    );
  });

  it("rezzes a run-relevant root only at the last relevant window", () => {
    const redHerrings = corpCard("red-herrings", "upgrade", {
      definitionId: "onr_v1_366_red-herrings",
      title: "Red Herrings",
      rezzed: false,
    });
    const action = corpAction(
      "rez-red-herrings",
      "rez_ice",
      {},
      redHerrings.instanceId,
    );
    const base = corpInputWithGoals([]);
    const inputAtPosition = (iceIndex: number) =>
      ({
        ...base,
        playerView: {
          ...base.playerView,
          timingPoint: "run.approach_ice",
          run: {
            attackedServerId: "remote_1",
            phase: "approach_ice",
            position: { kind: "ice", serverId: "remote_1", iceIndex },
            successful: false,
          },
          servers: [
            {
              id: "remote_1",
              label: "Remote 1",
              ice: [corpIce("inner-wall"), corpIce("outer-wall")],
              root: [redHerrings],
            },
          ],
        },
      }) as unknown as AiDecisionInput;

    const earlyComponents = semanticRuntimeCorpScoreComponents(
      inputAtPosition(1),
      action,
      "simple_rez",
      testDependencies(),
    );
    const latestComponents = semanticRuntimeCorpScoreComponents(
      inputAtPosition(0),
      action,
      "simple_rez",
      testDependencies(),
    );

    expect(earlyComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_root_rez_defer_until_last_window",
          value: -3600,
        }),
      ]),
    );
    expect(latestComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_root_rez_latest_relevant_window",
          value: 1600,
        }),
      ]),
    );
    expect(totalScore(latestComponents)).toBeGreaterThan(
      totalScore(earlyComponents),
    );
  });

  it("keeps a non-run-relevant root hidden in the observed three-ICE rez window", () => {
    const vaporOps = corpCard("vapor-ops", "asset", {
      definitionId: "onr_v1_347_vapor-ops",
      title: "Vapor Ops",
      rezzed: false,
      advancementCounters: 2,
    });
    const corticalScrub = corpIce("cortical-scrub", {
      definitionId: "onr_v1_231_cortical-scrub",
      title: "Cortical Scrub",
      rezzed: true,
    });
    const keeper = corpIce("keeper", {
      definitionId: "onr_v1_252_keeper",
      title: "Keeper",
    });
    const shotgunWire = corpIce("shotgun-wire", {
      definitionId: "onr_v1_269_shotgun-wire",
      title: "Shotgun Wire",
    });
    const rezVaporOps = corpAction(
      "rez-vapor-ops",
      "rez_ice",
      {},
      vaporOps.instanceId,
    );
    const rezShotgunWire = corpAction(
      "rez-shotgun-wire",
      "rez_ice",
      {},
      shotgunWire.instanceId,
    );
    const declineRez = corpAction("decline-rez", "decline_rez");
    const goal: TacticalGoalLike = {
      goalId: "corp.tactical.rez_relevant_ice",
      family: "corp_ice_defense",
      priority: 760,
      urgency: "medium",
      targetServerId: "remote_1",
      source: "boardstate",
      evidence: ["test_goal"],
    };
    const base = corpInputWithGoals(
      [goal],
      [rezVaporOps, rezShotgunWire, declineRez],
    );
    const input = {
      ...base,
      playerView: {
        ...base.playerView,
        timingPoint: "run.approach_ice",
        own: { ...base.playerView.own, credits: 10 },
        run: {
          attackedServerId: "remote_1",
          phase: "approach_ice",
          position: { kind: "ice", serverId: "remote_1", iceIndex: 2 },
          successful: false,
        },
        servers: [
          {
            id: "remote_1",
            label: "Remote 1",
            ice: [corticalScrub, keeper, shotgunWire],
            root: [vaporOps],
          },
        ],
      },
    } as unknown as AiDecisionInput;

    const vaporComponents = semanticRuntimeCorpScoreComponents(
      input,
      rezVaporOps,
      "simple_rez",
      testDependencies(),
    );
    const iceComponents = semanticRuntimeCorpScoreComponents(
      input,
      rezShotgunWire,
      "simple_rez",
      testDependencies(),
    );
    const declineComponents = semanticRuntimeCorpScoreComponents(
      input,
      declineRez,
      "simple_rez",
      testDependencies(),
    );

    expect(vaporComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_root_rez_defer_irrelevant_during_run",
          value: -4000,
          reason: expect.stringContaining(
            "root_rez_timing:no_current_run_effect",
          ),
        }),
      ]),
    );
    expect(vaporComponents.map((component) => component.key)).not.toContain(
      "corp_goal_fit_tactical_goal",
    );
    expect(iceComponents.map((component) => component.key)).toContain(
      "corp_goal_fit_tactical_goal",
    );
    expect(totalScore(vaporComponents)).toBeLessThan(
      totalScore(declineComponents),
    );
    expect(totalScore(vaporComponents)).toBeLessThan(totalScore(iceComponents));
  });

  it("does not conceal a non-run-relevant root outside a Runner run", () => {
    const vaporOps = corpCard("vapor-ops", "asset", {
      definitionId: "onr_v1_347_vapor-ops",
      title: "Vapor Ops",
      rezzed: false,
      advancementCounters: 2,
    });
    const action = corpAction(
      "rez-vapor-ops",
      "rez_ice",
      {},
      vaporOps.instanceId,
    );
    const base = corpInputWithGoals([]);
    const input = {
      ...base,
      playerView: {
        ...base.playerView,
        timingPoint: "corp_action.main",
        servers: [
          {
            id: "remote_1",
            label: "Remote 1",
            ice: [],
            root: [vaporOps],
          },
        ],
      },
    } as unknown as AiDecisionInput;

    const components = semanticRuntimeCorpScoreComponents(
      input,
      action,
      "simple_rez",
      testDependencies(),
    );

    expect(components.map((component) => component.key)).not.toContain(
      "corp_root_rez_defer_irrelevant_during_run",
    );
  });

  it("penalizes action-id encoded zero-effect X rez actions without extra defense semantics", () => {
    const actionId = "corp.rez_ice.test_ice.test_ice.x_strength.0.0";
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithGoals([]),
      corpAction(actionId, "rez_ice"),
      "simple_rez",
      {
        ...testDependencies(),
        actionCreditCost: () => 4,
      },
      {
        ...semanticCandidate(actionId, "corp_window.rez", [], "rez_ice"),
        costProfile: {
          creditCost: 4,
          costKnownStatus: "known",
          additionalCosts: [],
        },
      },
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_effective_defense_zero_effect_risk",
          value: -1600,
          reason: expect.stringContaining(
            "effective_defense_variable_kind:x_strength",
          ),
        }),
      ]),
    );
  });

  it("rewards rez actions with visible effective defense value", () => {
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithGoals([]),
      corpAction("homing-x1", "rez_ice", {
        variableRezKind: "x_strength",
        variableRezValue: 1,
      }),
      "simple_rez",
      {
        ...testDependencies(),
        actionCreditCost: () => 5,
      },
      {
        ...semanticCandidate("homing-x1", "corp_window.rez", [
          "role:trace_ice",
          "corp_ice.conditional_end_run",
          "trace.source",
        ]),
        actionType: "rez_ice",
        costProfile: {
          creditCost: 5,
          costKnownStatus: "known",
          variableCost: {
            kind: "rez_cost",
            chosen: 1,
            min: 1,
          },
          additionalCosts: [],
        },
      },
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_effective_defense_rez_value",
          value: 900,
        }),
      ]),
    );
  });
});
