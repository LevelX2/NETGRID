import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import {
  corpActionCandidateHasVisibleSignal,
  normalizedCorpReserveScoreValue,
  semanticRuntimeCorpScoreComponents,
  type SemanticRuntimeCorpScoreDependencies,
} from "./semantic-runtime-corp-score";
import type { CorpScoringWindowAssessment } from "./semantic-runtime-corp-scoring-window";

describe("semanticRuntimeCorpScoreComponents", () => {
  it("normalizes reserve score values into the scoring consumer scale", () => {
    expect(normalizedCorpReserveScoreValue(0)).toBe(0);
    expect(normalizedCorpReserveScoreValue(900)).toBe(18);
    expect(normalizedCorpReserveScoreValue(-750)).toBe(-15);
    expect(normalizedCorpReserveScoreValue(-1500)).toBe(-30);
    expect(normalizedCorpReserveScoreValue(7500)).toBe(100);
    expect(normalizedCorpReserveScoreValue(-7500)).toBe(-100);
  });

  it("matches corp action candidate visible signals by bounded terms", () => {
    expect(
      corpActionCandidateHasVisibleSignal(
        candidate({ cardContextSignals: ["access_ambush"] }),
        ["ambush"],
      ),
    ).toBe(true);
    expect(
      corpActionCandidateHasVisibleSignal(
        candidate({ cardContextSignals: ["ambusher_noise"] }),
        ["ambush"],
      ),
    ).toBe(false);
    expect(
      corpActionCandidateHasVisibleSignal(
        candidate({ actionTacticSignals: ["corp.score_closeout"] }),
        ["corp.score_closeout"],
      ),
    ).toBe(true);
  });

  it("scores agenda closeout actions that match Corp tactical goals", () => {
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithGoals([
        {
          goalId: "corp.tactical.score_closeout",
          family: "corp_scoreline",
          priority: 900,
          urgency: "high",
          source: "boardstate",
          evidence: ["test_goal"],
        },
      ]),
      corpAction("score-agenda", "score_agenda"),
      "simple_score_advance",
      testDependencies(),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_goal_fit_tactical_goal",
          value: 900,
          reason: expect.stringContaining("goal:corp.tactical.score_closeout"),
        }),
      ]),
    );
  });

  it("scores economy actions that match Corp economy tactical goals", () => {
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithGoals([
        {
          goalId: "corp.tactical.stabilize_economy",
          family: "economy",
          priority: 640,
          urgency: "medium",
          source: "boardstate",
          evidence: ["test_goal"],
        },
      ]),
      corpAction("gain-credit", "gain_credit"),
      "basic_economy_draw",
      testDependencies(),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_goal_fit_tactical_goal",
          value: 640,
          reason: expect.stringContaining(
            "goal:corp.tactical.stabilize_economy",
          ),
        }),
      ]),
    );
  });

  it("scores playable Corp burst economy operations by net credit gain", () => {
    const accountsReceivable = corpAction(
      "play-accounts-receivable",
      "play_operation",
      {},
      "corp_accounts_receivable",
    );
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(5, [accountsReceivableCard()], [accountsReceivable]),
      accountsReceivable,
      "basic_install",
      testDependencies(),
      semanticCandidate(
        accountsReceivable.actionId,
        "play.corp_operation",
        ["economy.corp_credit_burst"],
        "play_operation",
      ),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_operation_burst_economy",
          value: 2070,
          reason: expect.stringContaining("burst_economy_net_gain:4"),
        }),
      ]),
    );
  });

  it("scores basic credit when it unlocks a visible burst economy operation", () => {
    const basicCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(4, [accountsReceivableCard()], [basicCredit]),
      basicCredit,
      "basic_economy_draw",
      testDependencies(),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_operation_economy_threshold_funding",
          value: 1840,
          reason: expect.stringContaining("credits_after_funding:5"),
        }),
      ]),
    );
  });

  it("scores visible activated scored-agenda economy abilities above basic credit", () => {
    const marineArcology = corpCard("marine-arcology", "agenda", {
      title: "Marine Arcology",
      definitionId: "onr_v1_206_marine-arcology",
      rulesText: "[A], [A]: Gain 3 credits.",
    });
    const marineAbility = corpAction(
      "marine-arcology-economy",
      "activated_card_ability",
      {},
      marineArcology.instanceId,
    );
    marineAbility.costs = [{ clicks: 2 }];
    const basicCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithScoreAreaCards(
      0,
      [marineArcology],
      [marineAbility, basicCredit],
    );

    const abilityComponents = semanticRuntimeCorpScoreComponents(
      input,
      marineAbility,
      "basic_economy_draw",
      testDependencies(),
    );

    expect(abilityComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_activated_burst_economy",
          value: 1890,
          reason: expect.stringContaining("ability_click_cost:2"),
        }),
        expect.objectContaining({
          key: "corp_board_triage_alignment",
        }),
      ]),
    );
    expect(totalScore(abilityComponents)).toBeGreaterThan(
      totalScoreFor(
        input,
        basicCredit,
        "basic_economy_draw",
        testDependencies(),
      ),
    );
  });

  it("suppresses scored-agenda economy when critical triage needs remote protection", () => {
    const agenda = agendaCard("agenda-in-hq", 2);
    const marineArcology = corpCard("marine-arcology", "agenda", {
      title: "Marine Arcology",
      definitionId: "onr_v1_206_marine-arcology",
      rulesText: "[A], [A]: Gain 3 credits.",
    });
    const remoteIce = corpIce("remote-ice-in-hq", {
      definitionId: "simple_barrier_ice",
      rezCost: 2,
    });
    const marineAbility = corpAction(
      "marine-arcology-economy",
      "activated_card_ability",
      {},
      marineArcology.instanceId,
    );
    marineAbility.costs = [{ clicks: 2 }];
    const installAgenda = corpAction(
      "install-agenda-remote-1",
      "install_card",
      {
        placement: "root",
        serverId: "remote_1",
        cardType: "agenda",
      },
      agenda.instanceId,
    );
    const installRemoteIce = corpAction(
      "install-remote-ice",
      "install_card",
      {
        placement: "ice",
        serverId: "remote_1",
      },
      remoteIce.instanceId,
    );
    const input = corpInputWithHqCards(
      6,
      [agenda, remoteIce],
      [marineAbility, installAgenda, installRemoteIce],
    );
    input.playerView.own.scoreArea = [marineArcology];
    input.playerView.opponent = runnerOpponent({
      agendaPoints: 5,
      credits: 9,
    });
    input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [corpIce("remote-wall", { rezCost: 1, rezzed: true })],
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
              agendaStealSeverity: "game_ending",
              runnerAgendaPointsAfterSteal: 7,
              recommendedNextStep: "build_remote_ice",
              evidence: ["test_critical_remote_protection"],
            })
          : undefined,
    };

    const marineComponents = semanticRuntimeCorpScoreComponents(
      input,
      marineAbility,
      "basic_economy_draw",
      dependencies,
    );
    const remoteIceComponents = semanticRuntimeCorpScoreComponents(
      input,
      installRemoteIce,
      "basic_install",
      dependencies,
    );

    expect(marineComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_activated_burst_economy",
          value: 1890,
        }),
        expect.objectContaining({
          key: "corp_board_triage_mismatch",
          value: -3200,
          reason: expect.stringContaining(
            "triage_primary:protect_score_remote",
          ),
        }),
      ]),
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
      totalScore(marineComponents),
    );
  });

  it("uses board triage so score-now beats passive economy", () => {
    const scoreAgenda = corpAction("score-agenda", "score_agenda", {
      serverId: "remote_1",
    });
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithGoals([], [scoreAgenda, gainCredit]);
    const dependencies = testDependencies();

    expect(
      totalScoreFor(input, scoreAgenda, "simple_score_advance", dependencies),
    ).toBeGreaterThan(
      totalScoreFor(input, gainCredit, "basic_economy_draw", dependencies),
    );
  });

  it("treats advance on an already scoreable agenda as a score-now mismatch", () => {
    const agenda = corpCard("project-zurich", "agenda", {
      title: "Project Zurich",
      advancementRequirement: 3,
      advancementCounters: 3,
      agendaPoints: 2,
      rulesText:
        "For every two advancement counters over Project Zurich's difficulty, gain 1 at the start of each of your turns.",
    });
    const advanceAgenda = corpAction(
      "advance-project-zurich",
      "advance_card",
      { cardId: agenda.instanceId, serverId: "remote_1" },
      agenda.instanceId,
    );
    advanceAgenda.costs = [{ clicks: 1, credits: 1 }];
    const scoreAgenda = corpAction(
      "score-project-zurich",
      "score_agenda",
      { cardId: agenda.instanceId, serverId: "remote_1" },
      agenda.instanceId,
    );
    const input = corpInputWithRemoteAgenda(5, 1, agenda, [
      advanceAgenda,
      scoreAgenda,
    ]);

    const advanceComponents = semanticRuntimeCorpScoreComponents(
      input,
      advanceAgenda,
      "simple_score_advance",
      {
        ...testDependencies(),
        corpAdvanceCompletesScore: () => true,
      },
    );

    expect(advanceComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_mismatch",
          value: -3200,
          reason: expect.stringContaining("triage_primary:score_now"),
        }),
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

  it("rewards advance actions that keep a same-turn agenda score closeout reachable", () => {
    const agenda = corpCard("security-purge", "agenda", {
      title: "Security Purge",
      advancementRequirement: 3,
      advancementCounters: 1,
      agendaPoints: 2,
    });
    const advanceAgenda = corpAction(
      "advance-security-purge",
      "advance_card",
      { cardId: agenda.instanceId, serverId: "remote_1" },
      agenda.instanceId,
    );
    advanceAgenda.costs = [{ clicks: 1, credits: 1 }];
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithRemoteAgenda(2, 3, agenda, [
      advanceAgenda,
      gainCredit,
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
          key: "corp_same_turn_score_closeout_advance",
          value: 3400,
          reason: expect.stringContaining("additional_advances_needed:1"),
        }),
      ]),
    );
    expect(totalScore(advanceComponents)).toBeGreaterThan(
      totalScoreFor(
        input,
        gainCredit,
        "basic_economy_draw",
        testDependencies(),
      ),
    );
  });

  it("locks an active protected remote agenda over setup, central ice, and economy", () => {
    const agenda = corpCard("active-agenda", "agenda", {
      title: "Active Agenda",
      advancementRequirement: 3,
      advancementCounters: 1,
      agendaPoints: 2,
    });
    const advanceAgenda = corpAction(
      "advance-active-agenda",
      "advance_card",
      { cardId: agenda.instanceId, serverId: "remote_1" },
      agenda.instanceId,
    );
    advanceAgenda.costs = [{ clicks: 1, credits: 1 }];
    const installRemoteIce = corpAction(
      "install-extra-remote-ice",
      "install_card",
      { placement: "ice", serverId: "remote_1" },
      "extra-remote-ice",
    );
    const installSupportRoot = corpAction(
      "install-support-root",
      "install_card",
      { placement: "root", serverId: "remote_1" },
      "support-root",
    );
    const installRdIce = corpAction(
      "install-rd-ice",
      "install_card",
      { placement: "ice", serverId: "rd" },
      "rd-ice",
    );
    const installNewRemoteAgenda = corpAction(
      "install-new-remote-agenda",
      "install_card",
      { cardType: "agenda", placement: "root", serverId: "new_remote" },
      "second-agenda",
    );
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithRemoteAgenda(6, 3, agenda, [
      advanceAgenda,
      installRemoteIce,
      installSupportRoot,
      installRdIce,
      installNewRemoteAgenda,
      gainCredit,
    ]);
    input.playerView.own.gripOrHq = [
      agendaCard("second-agenda", 2),
      corpIce("extra-remote-ice", {
        definitionId: "simple_barrier_ice",
        rezCost: 2,
      }),
      corpIce("rd-ice", { definitionId: "simple_barrier_ice", rezCost: 2 }),
      corpCard("support-root", "upgrade"),
    ];
    input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [corpIce("remote-wall", { rezCost: 1, rezzed: true })],
        root: [agenda],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId ||
        action.actionId === installNewRemoteAgenda.actionId,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === advanceAgenda.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "temporary_safe",
              runnerCanContestBeforeScore: false,
              runnerCanReachAccessBeforeScore: false,
              affordableDurableRelevantIceCount: 1,
              corpCanRezRelevantIce: true,
              corpCanRezFullPathWithDynamicReserve: true,
              dynamicProtectionWeaknessCount: 0,
              recommendedNextStep: "score",
              evidence: ["test_active_scoreline_clock"],
            })
          : undefined,
    };

    const advanceComponents = semanticRuntimeCorpScoreComponents(
      input,
      advanceAgenda,
      "simple_score_advance",
      dependencies,
    );
    const distractingActions = [
      installRemoteIce,
      installSupportRoot,
      installRdIce,
      installNewRemoteAgenda,
      gainCredit,
    ];

    expect(advanceComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_alignment",
          reason: expect.stringContaining(
            "corp_active_scoreline_clock:true",
          ),
        }),
      ]),
    );
    for (const distractingAction of distractingActions) {
      const components = semanticRuntimeCorpScoreComponents(
        input,
        distractingAction,
        distractingAction.type === "advance_card"
          ? "simple_score_advance"
          : "basic_install",
        dependencies,
      );
      expect(components).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: "corp_board_triage_mismatch",
            reason: expect.stringContaining(
              "corp_active_scoreline_clock:true",
            ),
          }),
        ]),
      );
      expect(totalScore(advanceComponents)).toBeGreaterThan(
        totalScore(components),
      );
    }
  });

  it("uses an existing ready remote for HQ agenda install over opening another remote", () => {
    const agenda = agendaCard("agenda-in-hq", 2);
    const installExistingRemote = corpAction(
      "install-agenda-existing-remote",
      "install_card",
      { cardType: "agenda", placement: "root", serverId: "remote_1" },
      agenda.instanceId,
    );
    const installNewRemote = corpAction(
      "install-agenda-new-remote",
      "install_card",
      { cardType: "agenda", placement: "root", serverId: "new_remote" },
      agenda.instanceId,
    );
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithHqCards(6, [agenda], [
      installExistingRemote,
      installNewRemote,
      gainCredit,
    ]);
    input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [corpIce("remote-wall", { rezCost: 1, rezzed: true })],
        root: [],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === installExistingRemote.actionId ||
        action.actionId === installNewRemote.actionId,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === installExistingRemote.actionId ||
        action.actionId === installNewRemote.actionId
          ? scoringWindow({
              serverId: String(action.payload?.serverId),
              windowKind: "temporary_safe",
              runnerCanContestBeforeScore: false,
              runnerCanReachAccessBeforeScore: false,
              affordableDurableRelevantIceCount: 1,
              corpCanRezRelevantIce: true,
              corpCanRezFullPathWithDynamicReserve: true,
              dynamicProtectionWeaknessCount: 0,
              recommendedNextStep: "score",
              evidence: [`test_ready_remote:${action.payload?.serverId}`],
            })
          : undefined,
    };

    const existingComponents = semanticRuntimeCorpScoreComponents(
      input,
      installExistingRemote,
      "basic_install",
      dependencies,
    );
    const newRemoteComponents = semanticRuntimeCorpScoreComponents(
      input,
      installNewRemote,
      "basic_install",
      dependencies,
    );
    const creditComponents = semanticRuntimeCorpScoreComponents(
      input,
      gainCredit,
      "basic_economy_draw",
      dependencies,
    );

    expect(existingComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_alignment",
          reason: expect.stringContaining(
            "corp_active_scoreline_clock:true",
          ),
        }),
      ]),
    );
    expect(newRemoteComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_mismatch",
          reason: expect.stringContaining(
            "triage_action_server:new_remote",
          ),
        }),
      ]),
    );
    expect(totalScore(existingComponents)).toBeGreaterThan(
      totalScore(newRemoteComponents),
    );
    expect(totalScore(existingComponents)).toBeGreaterThan(
      totalScore(creditComponents),
    );
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

  it("targets the existing unsafe score remote over a hypothetical new remote", () => {
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
          key: "corp_board_triage_alignment",
          value: 24,
          reason: expect.stringContaining("triage_target:remote_1"),
        }),
      ]),
    );
    expect(
      totalScoreFor(input, installRemoteIce, "basic_install", dependencies),
    ).toBeGreaterThan(
      totalScoreFor(input, installRemoteAgenda, "basic_install", dependencies),
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
        action: corpAction("rez-ice", "rez_ice"),
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
      const components = semanticRuntimeCorpScoreComponents(
        corpInputWithGoals([testCase.goal]),
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
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithGoals(
        [
          {
            goalId: "corp.tactical.score_closeout",
            family: "corp_scoreline",
            priority: 860,
            urgency: "high",
            source: "boardstate",
            evidence: ["test_goal"],
          },
        ],
        [closeoutAction, corpAction("advance-scoreline", "advance_card")],
      ),
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

    expect(agendaComponents.map((component) => component.key)).toContain(
      "corp_score_closeout_semantic_candidate",
    );
    expect(noiseComponents.map((component) => component.key)).not.toContain(
      "corp_score_closeout_semantic_candidate",
    );
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
          value: -30,
          reason: expect.stringContaining("inner_rez_floor:6"),
        }),
        expect.objectContaining({
          key: "corp_downstream_rez_floor_preservation",
          reason: expect.stringContaining("reserve_raw_value:-1500"),
        }),
        expect.objectContaining({
          key: "corp_downstream_rez_floor_preservation",
          reason: expect.stringContaining("reserve_normalized_value:-30"),
        }),
      ]),
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

function corpInputWithGoals(
  goals: readonly TacticalGoalLike[],
  legalActions: LegalAction[] = [],
): AiDecisionInput {
  return {
    side: "corp",
    legalActions,
    playerView: {
      own: {
        credits: 5,
        clicks: 3,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
      },
      servers: [],
      legalActions,
    },
    ownCorpTacticalGoals: goals,
  } as unknown as AiDecisionInput;
}

function corpInputWithHqCards(
  credits: number,
  hqCards: VisibleCard[],
  legalActions: LegalAction[] = [],
): AiDecisionInput {
  const base = corpInputWithGoals([], legalActions);
  return {
    ...base,
    playerView: {
      ...base.playerView,
      own: {
        ...base.playerView.own,
        credits,
        gripOrHq: hqCards,
      },
    },
  } as unknown as AiDecisionInput;
}

function corpInputWithDeckoutFlood(
  credits: number,
  hqCards: VisibleCard[],
  stackOrRdCount: number,
  legalActions: LegalAction[] = [],
): AiDecisionInput {
  const base = corpInputWithHqCards(credits, hqCards, legalActions);
  return {
    ...base,
    playerView: {
      ...base.playerView,
      own: {
        ...base.playerView.own,
        stackOrRdCount,
      },
    },
  } as unknown as AiDecisionInput;
}

function corpInputWithScoreAreaCards(
  credits: number,
  scoreAreaCards: VisibleCard[],
  legalActions: LegalAction[] = [],
): AiDecisionInput {
  const base = corpInputWithGoals([], legalActions);
  return {
    ...base,
    playerView: {
      ...base.playerView,
      own: {
        ...base.playerView.own,
        credits,
        scoreArea: scoreAreaCards,
      },
    },
  } as unknown as AiDecisionInput;
}

function corpInputWithRemoteAgenda(
  credits: number,
  clicks: number,
  agenda: VisibleCard,
  legalActions: LegalAction[] = [],
): AiDecisionInput {
  const base = corpInputWithGoals([], legalActions);
  return {
    ...base,
    playerView: {
      ...base.playerView,
      own: {
        ...base.playerView.own,
        credits,
        clicks,
      },
      servers: [
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [],
          root: [agenda],
        },
      ],
      legalActions,
    },
  } as unknown as AiDecisionInput;
}

function runnerOpponent(
  overrides: Partial<AiDecisionInput["playerView"]["opponent"]> = {},
): AiDecisionInput["playerView"]["opponent"] {
  return {
    identity: {
      instanceId: "runner-identity",
      known: true,
      owner: "runner",
      type: "identity",
      counterDisplays: [],
    },
    credits: 4,
    clicks: 4,
    agendaPoints: 0,
    tags: 0,
    handCount: 4,
    maxHandSize: 5,
    deckCount: 20,
    discardCount: 0,
    rig: [],
    scoreArea: [],
    ...overrides,
  };
}

function accountsReceivableCard(): VisibleCard {
  return {
    instanceId: "corp_accounts_receivable",
    known: true,
    title: "Accounts Receivable",
    definitionId: "onr_v1_281_accounts-receivable",
    type: "operation",
    rulesText: "Gain 9 credits.",
    cost: 5,
    owner: "corp",
    controller: "corp",
  };
}

function nightShiftCard(): VisibleCard {
  return {
    instanceId: "corp_night_shift",
    known: true,
    title: "Night Shift",
    definitionId: "onr_v1_295_night-shift",
    type: "operation",
    rulesText: "Gain 2 credits and draw one card.",
    cost: 0,
    owner: "corp",
    controller: "corp",
  };
}

function dayShiftCard(): VisibleCard {
  return economyOperationCard({
    instanceId: "day-shift",
    definitionId: "test_day_shift",
    title: "Day Shift",
    rulesText: "Gain 3 credits and draw one card.",
    cost: 0,
  });
}

function economyOperationCard(
  overrides: Partial<VisibleCard> & { instanceId: string },
): VisibleCard {
  const { instanceId, ...rest } = overrides;
  return {
    instanceId,
    known: true,
    title: "Economy Operation",
    type: "operation",
    cost: 0,
    owner: "corp",
    controller: "corp",
    ...rest,
  };
}

function corpIce(
  instanceId: string,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    title: instanceId,
    definitionId: instanceId,
    type: "ice",
    owner: "corp",
    controller: "corp",
    rezzed: false,
    ...overrides,
  };
}

function fracterBreaker(): VisibleCard {
  return {
    instanceId: "runner-fracter",
    known: true,
    title: "Runner Fracter",
    definitionId: "runner-fracter",
    type: "program",
    owner: "runner",
    controller: "runner",
    subtypes: ["Icebreaker", "Fracter"],
    rulesText: "Break barrier subroutines.",
  };
}

function candidate(
  overrides: Partial<ActionSemanticCandidate> = {},
): ActionSemanticCandidate {
  return {
    actionId: "candidate",
    actionType: "trigger_ability",
    actorSide: "corp",
    visibilityScope: "public",
    legalActionRef: {
      actionId: "candidate",
      actionType: "trigger_ability",
      originalPayloadKeys: [],
    },
    sourceKind: "asset",
    abilityBindingMethod: "bound",
    semanticActionType: "corp.ability",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: { clickCost: 1, creditCost: 0, additionalCosts: [] },
    timingProfile: { timingPoint: "corp_action.main", window: "main_action" },
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      notes: [],
    },
    confidence: "medium",
    primaryProjectionStatus: "complete",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
    ...overrides,
  } as ActionSemanticCandidate;
}

function corpAction(
  actionId: string,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
  source?: string,
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: actionId,
    source,
    costs: [],
    payload,
  } as unknown as LegalAction;
}

function testDependencies(): SemanticRuntimeCorpScoreDependencies<string> {
  return {
    actionCreditCost: () => 0,
    rolesForAction: () => [],
    corpScoreNowSafetyGate: () => ({ allowed: true, evidence: ["test"] }),
    corpAdvanceRemoteScore: () => 0,
    corpRemoteRezFloorAssessment: () => undefined,
    corpCentralRezReserveAssessment: () => undefined,
    corpRemoteScoreContestabilityAssessment: () => undefined,
    corpActionIsScoreLine: () => false,
    corpAdvanceCompletesScore: () => false,
    corpInstallRemoteScore: () => 0,
    corpAdvancementCounterPlacementAssessment: () => undefined,
    corpHasRemoteInstability: () => false,
    corpHasRemoteRezFloorFundingNeed: () => false,
    corpHasCentralRezFloorFundingNeed: () => false,
    corpTaggedRunnerPayoffPressure: () => undefined,
    corpTaggedPayoffWindowPassiveActionPenalty: () => undefined,
    corpPassiveScoreLinePenalty: () => undefined,
  };
}

function totalScoreFor(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  dependencies: ReturnType<typeof testDependencies>,
  actionSemanticCandidate?: ActionSemanticCandidate,
): number {
  return totalScore(
    semanticRuntimeCorpScoreComponents(
      input,
      action,
      scopeId,
      dependencies,
      actionSemanticCandidate,
    ),
  );
}

function totalScore(components: readonly { value: number }[]): number {
  return components.reduce((sum, component) => sum + component.value, 0);
}

function scoringWindow(
  overrides: Partial<CorpScoringWindowAssessment> = {},
): CorpScoringWindowAssessment {
  return {
    serverId: "remote_1",
    windowKind: "unsafe",
    runnerCanContestNow: false,
    runnerCanReachAccessNow: false,
    agendaStealRelevantNow: false,
    runnerCanContestBeforeScore: false,
    runnerCanReachAccessBeforeScore: false,
    agendaStealRelevantBeforeScore: false,
    agendaPointsAtRisk: 2,
    runnerAgendaPointsAfterSteal: 4,
    agendaStealSeverity: "normal",
    missingVisibleBreakerCoverage: false,
    corpCanRezRelevantIce: true,
    affordableDurableRelevantIceCount: 0,
    dynamicProtectionWeaknessCount: 0,
    dynamicProtectionReserve: 0,
    corpCanRezFullPathWithDynamicReserve: true,
    scoreHorizon: "next_turn",
    runnerExposureCreditActions: 3,
    recommendedNextStep: "build_remote_ice",
    evidence: ["test_scoring_window"],
    ...overrides,
  };
}

function agendaCard(
  instanceId = "agenda-in-hq",
  agendaPoints = 2,
): VisibleCard {
  return corpCard(instanceId, "agenda", {
    advancementRequirement: 3,
    agendaPoints,
  });
}

function corpCard(
  instanceId: string,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    owner: "corp",
    side: "corp",
    type,
    ...overrides,
  } as VisibleCard;
}

function componentKeysForInstallRoles(roles: string[]): string[] {
  return semanticRuntimeCorpScoreComponents(
    corpInputWithGoals([]),
    corpAction("install-card", "install_card"),
    "basic_install",
    {
      ...testDependencies(),
      rolesForAction: () => roles,
    },
  ).map((component) => component.key);
}

function semanticCandidate(
  actionId: string,
  semanticActionType: string,
  actionTacticSignals: readonly string[],
  actionType: LegalAction["type"] = "trigger_ability",
): ActionSemanticCandidate {
  return {
    actionId,
    actionType,
    actorSide: "corp",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId,
      actionType,
      originalPayloadKeys: [],
    },
    sourceKind: "card",
    abilityBindingMethod: "explicit_ability_id",
    semanticActionType,
    cardContextSignals: [],
    actionTacticSignals: [...actionTacticSignals],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      costKnownStatus: "not_applicable",
      additionalCosts: [],
    },
    timingProfile: {},
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      notes: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [...actionTacticSignals],
  };
}
