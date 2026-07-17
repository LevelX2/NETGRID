import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import type { CorpScorelineWindowAssessment } from "./corp-scoreline/semantic-runtime-corp-scoreline-assessment";
import {
  corpActionCandidateHasVisibleSignal,
  normalizedCorpReserveScoreValue,
  semanticRuntimeCorpScoreComponents,
  type SemanticRuntimeCorpScoreDependencies,
} from "./semantic-runtime-corp-score";
import type { CorpScoringWindowAssessment } from "./semantic-runtime-corp-scoring-window";
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
} from "./semantic-runtime-corp-score.test-support";

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

  it("penalizes a last-click trace without an immediate punish payoff", () => {
    const trace = corpAction("trace", "trigger_ability");
    const input = corpInputWithGoals([], [trace]);
    input.playerView.own.clicks = 1;
    input.playerView.own.credits = 6;
    input.playerView.opponent.credits = 0;

    const components = semanticRuntimeCorpScoreComponents(
      input,
      trace,
      "card_ability",
      testDependencies(),
      semanticCandidate(
        trace.actionId,
        "corp.trace",
        ["trace.source", "tag.source"],
        "trigger_ability",
      ),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_last_click_trace_without_payoff",
          value: -2400,
        }),
      ]),
    );
  });

  it("includes visible purge impact in the actual Corp score breakdown", () => {
    const purge = {
      ...corpAction("purge", "purge_virus_counters"),
      costs: [{ clicks: 3 }],
    } as LegalAction;
    const input = corpInputWithGoals([], [purge]);
    input.playerView.servers = [
      {
        id: "rd",
        label: "R&D",
        root: [],
        ice: [
          corpCard("onr_proteus_012_bug-zapper", "ice", {
            definitionId: "onr_proteus_012_bug-zapper",
            rezzed: true,
            rulesText: "Do 2 net damage. End the run.",
            counters: { virus: 1 },
          }),
        ],
      },
    ];

    expect(
      semanticRuntimeCorpScoreComponents(
        input,
        purge,
        "board_safety",
        testDependencies(),
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_purge_tactical_impact",
          value: expect.any(Number),
          reason: expect.stringContaining("purge_visible_counter_total:1"),
        }),
      ]),
    );
  });

  it("does not treat scored shuffle-draw agenda actions as low-credit funding", () => {
    const aiCfoShuffleDraw = corpAction("ai-cfo-shuffle-draw", "gain_credit", {
      agendaAbility: "hq_archives_shuffle_draw",
      drawCardsAmount: 5,
    });

    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(0, [], [aiCfoShuffleDraw]),
      aiCfoShuffleDraw,
      "basic_economy_draw",
      testDependencies(),
      semanticCandidate(
        aiCfoShuffleDraw.actionId,
        "draw.card",
        ["draw.card", "zone.shuffle_draw"],
        "gain_credit",
      ),
    );

    expect(components.map((component) => component.key)).not.toContain(
      "corp_low_credits",
    );
    expect(components.map((component) => component.key)).not.toContain(
      "corp_remote_instability_credit_reserve",
    );
  });

  it("does not treat scored hidden-zone reveal agenda actions as low-credit funding", () => {
    const revealRdTop = corpAction(
      "security-directors-reveal-rd",
      "gain_credit",
      {
        cardId: "security-directors",
        abilityFamily: "hidden-zone",
        effectKind: "hidden_zone",
        agendaAbility: "v1919_scored_agenda_reveal_rd_top",
      },
    );

    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(0, [], [revealRdTop]),
      revealRdTop,
      "basic_economy_draw",
      testDependencies(),
      semanticCandidate(
        revealRdTop.actionId,
        "card_ability.trigger",
        ["card_ability.trigger", "zone.reveal"],
        "gain_credit",
      ),
    );

    expect(components.map((component) => component.key)).not.toContain(
      "corp_low_credits",
    );
    expect(components.map((component) => component.key)).not.toContain(
      "corp_remote_instability_credit_reserve",
    );
  });

  it("penalizes non-credit gain wrappers when real credit actions are legal", () => {
    const revealRdTop = corpAction(
      "security-directors-reveal-rd",
      "gain_credit",
      {
        cardId: "security-directors",
        abilityFamily: "hidden-zone",
        effectKind: "hidden_zone",
        agendaAbility: "v1919_scored_agenda_reveal_rd_top",
      },
    );
    const basicCredit = corpAction(revealRdTop.actionId, "gain_credit");

    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithHqCards(6, [], [revealRdTop, basicCredit]),
      revealRdTop,
      "corp_legal_action",
      testDependencies(),
      semanticCandidate(
        revealRdTop.actionId,
        "card_ability.trigger",
        ["card_ability.trigger", "zone.reveal"],
        "gain_credit",
      ),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_noncredit_gain_wrapper_penalty",
          value: -1200,
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

  it("dampens speculative scoreline installs for punish-primary corp decks", () => {
    const remoteAgenda = corpAction("install-remote-agenda", "install_card", {
      placement: "root",
      serverId: "remote_1",
    });
    const input = {
      ...corpInputWithHqCards(5, [agendaCard("hq-agenda")], [remoteAgenda]),
      ownCorpStrategicIntent: {
        primaryWinIntent: "corp.punish_runner",
        scorePlan: ["corp.remote_scoreline"],
        punishPlan: ["corp.damage_kill", "corp.tag_trace_punish"],
      },
    } as unknown as AiDecisionInput;
    const dependencies = {
      ...testDependencies(),
      corpActionIsScoreLine: () => true,
      corpScoringWindowAssessment: () =>
        scoringWindow({
          serverId: "remote_1",
          windowKind: "temporary_safe",
          scoreHorizon: "next_turn",
          agendaStealSeverity: "normal",
          runnerAgendaPointsAfterSteal: 2,
        }),
    };

    const components = semanticRuntimeCorpScoreComponents(
      input,
      remoteAgenda,
      "basic_install",
      dependencies,
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_punish_primary_speculative_scoreline_dampen",
          value: -1800,
          reason: expect.stringContaining(
            "corp_primary_win_intent:punish_runner",
          ),
        }),
      ]),
    );
  });

  it("strongly dampens a delayed punish-primary agenda that becomes reachable before scoring", () => {
    const remoteAgenda = corpAction(
      "install-unsafe-delayed-agenda",
      "install_card",
      {
        placement: "root",
        serverId: "remote_1",
      },
    );
    const input = {
      ...corpInputWithHqCards(5, [agendaCard("hq-agenda")], [remoteAgenda]),
      ownCorpStrategicIntent: {
        primaryWinIntent: "corp.punish_runner",
        scorePlan: ["corp.remote_scoreline"],
        punishPlan: ["corp.damage_kill", "corp.tag_trace_punish"],
      },
    } as unknown as AiDecisionInput;
    const dependencies = {
      ...testDependencies(),
      corpActionIsScoreLine: () => true,
      corpScoringWindowAssessment: () =>
        scoringWindow({
          serverId: "remote_1",
          windowKind: "unsafe",
          scoreHorizon: "next_turn",
          runnerCanContestBeforeScore: true,
          runnerCanReachAccessBeforeScore: true,
          agendaStealRelevantBeforeScore: true,
          agendaStealSeverity: "near_win",
          runnerAgendaPointsAfterSteal: 4,
          recommendedNextStep: "build_remote_ice",
        }),
    };

    const components = semanticRuntimeCorpScoreComponents(
      input,
      remoteAgenda,
      "basic_install",
      dependencies,
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_punish_primary_speculative_scoreline_dampen",
          value: -5600,
          reason: expect.stringContaining("unsafe_before_score:true"),
        }),
      ]),
    );
  });

  it("does not dampen a punish-primary scoreline install into a prepared safe remote", () => {
    const agenda = agendaCard("hq-agenda");
    const remoteAgenda = corpAction(
      "install-prepared-remote-agenda",
      "install_card",
      { placement: "root", serverId: "remote_1" },
      agenda.instanceId,
    );
    const input = {
      ...corpInputWithHqCards(9, [agenda], [remoteAgenda]),
      ownCorpStrategicIntent: {
        primaryWinIntent: "corp.punish_runner",
        scorePlan: ["corp.remote_scoreline"],
        punishPlan: ["corp.damage_kill", "corp.tag_trace_punish"],
      },
    } as unknown as AiDecisionInput;
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
      corpActionIsScoreLine: () => true,
      corpScoringWindowAssessment: () =>
        scoringWindow({
          serverId: "remote_1",
          windowKind: "temporary_safe",
          scoreHorizon: "next_turn",
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "normal",
          runnerAgendaPointsAfterSteal: 2,
          affordableDurableRelevantIceCount: 1,
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: true,
          dynamicProtectionWeaknessCount: 0,
          recommendedNextStep: "score",
        }),
    };

    const components = semanticRuntimeCorpScoreComponents(
      input,
      remoteAgenda,
      "basic_install",
      dependencies,
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_existing_score_remote_pipeline",
          reason: expect.stringContaining("payload:scoreline_root"),
        }),
      ]),
    );
    expect(components).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_punish_primary_speculative_scoreline_dampen",
        }),
      ]),
    );
  });

  it("does not dampen punish-primary HQ agenda relief into a safe prepared remote under high HQ triage", () => {
    const agenda = agendaCard("hq-agenda", 3);
    const remoteAgenda = corpAction(
      "install-hq-agenda-into-prepared-remote",
      "install_card",
      { placement: "root", serverId: "remote_1" },
      agenda.instanceId,
    );
    const hqIceAction = corpAction(
      "install-hq-wall",
      "install_card",
      { placement: "ice", serverId: "hq" },
      "hq-wall",
    );
    const input = {
      ...corpInputWithHqCardsAndServers(
        9,
        [
          agenda,
          corpIce("hq-wall", {
            title: "HQ Wall",
            definitionId: "onr_v1_279_wall-of-static",
            subtypes: ["Wall"],
            rulesText: "End the run.",
            rezCost: 2,
          }),
        ],
        [
          { id: "hq", label: "HQ", ice: [], root: [] },
          { id: "rd", label: "R&D", ice: [corpIce("rd-ice")], root: [] },
          {
            id: "remote_1",
            label: "Remote 1",
            ice: [
              corpIce("remote-wall", { rezCost: 2, rezzed: true }),
              corpIce("remote-codegate", { rezCost: 3, rezzed: true }),
            ],
            root: [],
          },
        ],
        [remoteAgenda, hqIceAction],
      ),
      ownCorpStrategicIntent: {
        primaryWinIntent: "corp.punish_runner",
        scorePlan: ["corp.remote_scoreline"],
        punishPlan: ["corp.damage_kill", "corp.tag_trace_punish"],
      },
    } as unknown as AiDecisionInput;
    const dependencies = {
      ...testDependencies(),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === remoteAgenda.actionId,
      corpInstallRemoteScore: () => -2200,
      corpScoringWindowAssessment: () =>
        scoringWindow({
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
          runnerAgendaPointsAfterSteal: 3,
          affordableDurableRelevantIceCount: 1,
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: true,
          dynamicProtectionWeaknessCount: 0,
          recommendedNextStep: "none",
        }),
    };

    const components = semanticRuntimeCorpScoreComponents(
      input,
      remoteAgenda,
      "basic_install",
      dependencies,
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_alignment",
          reason: expect.stringContaining("triage_primary:protect_hq"),
        }),
        expect.objectContaining({
          key: "corp_hq_agenda_relief_scoreline",
          value: 3200,
          reason: expect.stringContaining(
            "hq_pressure_safe_remote_relief:true",
          ),
        }),
        expect.objectContaining({
          key: "corp_install_remote_context",
          value: -350,
        }),
      ]),
    );
    expect(components).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_punish_primary_speculative_scoreline_dampen",
        }),
      ]),
    );
  });

  it("keeps the punish-primary scoreline dampen when a prepared remote is underfunded", () => {
    const agenda = agendaCard("hq-agenda");
    const remoteAgenda = corpAction(
      "install-underfunded-prepared-remote-agenda",
      "install_card",
      { placement: "root", serverId: "remote_1" },
      agenda.instanceId,
    );
    const input = {
      ...corpInputWithHqCards(5, [agenda], [remoteAgenda]),
      ownCorpStrategicIntent: {
        primaryWinIntent: "corp.punish_runner",
        scorePlan: ["corp.remote_scoreline"],
        punishPlan: ["corp.damage_kill", "corp.tag_trace_punish"],
      },
    } as unknown as AiDecisionInput;
    input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [corpIce("expensive-unrezzed-wall", { rezCost: 7 })],
        root: [],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      corpActionIsScoreLine: () => true,
      corpScoringWindowAssessment: () =>
        scoringWindow({
          serverId: "remote_1",
          windowKind: "temporary_safe",
          scoreHorizon: "next_turn",
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "normal",
          runnerAgendaPointsAfterSteal: 2,
          affordableDurableRelevantIceCount: 1,
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: true,
          dynamicProtectionWeaknessCount: 0,
          recommendedNextStep: "score",
        }),
    };

    const components = semanticRuntimeCorpScoreComponents(
      input,
      remoteAgenda,
      "basic_install",
      dependencies,
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_punish_primary_speculative_scoreline_dampen",
          value: -1800,
        }),
      ]),
    );
  });

  it("keeps the punish-primary scoreline dampen for near-win prepared remote steals", () => {
    const agenda = agendaCard("hq-agenda");
    const remoteAgenda = corpAction(
      "install-near-win-prepared-remote-agenda",
      "install_card",
      { placement: "root", serverId: "remote_1" },
      agenda.instanceId,
    );
    const input = {
      ...corpInputWithHqCards(9, [agenda], [remoteAgenda]),
      ownCorpStrategicIntent: {
        primaryWinIntent: "corp.punish_runner",
        scorePlan: ["corp.remote_scoreline"],
        punishPlan: ["corp.damage_kill", "corp.tag_trace_punish"],
      },
    } as unknown as AiDecisionInput;
    input.playerView.agendaPointsToWin = 7;
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
      corpActionIsScoreLine: () => true,
      corpScoringWindowAssessment: () =>
        scoringWindow({
          serverId: "remote_1",
          windowKind: "temporary_safe",
          scoreHorizon: "next_turn",
          runnerCanContestBeforeScore: false,
          runnerCanReachAccessBeforeScore: false,
          agendaStealRelevantBeforeScore: false,
          agendaStealSeverity: "near_win",
          runnerAgendaPointsAfterSteal: 5,
          affordableDurableRelevantIceCount: 1,
          corpCanRezRelevantIce: true,
          corpCanRezFullPathWithDynamicReserve: true,
          dynamicProtectionWeaknessCount: 0,
          recommendedNextStep: "score",
        }),
    };

    const components = semanticRuntimeCorpScoreComponents(
      input,
      remoteAgenda,
      "basic_install",
      dependencies,
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_punish_primary_speculative_scoreline_dampen",
          value: -1800,
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

  it("scores hosted-credit agenda abilities from structured legal action payloads", () => {
    const corporateCoup = corpCard("corporate-coup", "agenda", {
      title: "Corporate Coup",
      definitionId: "onr_v1_193_corporate-coup",
      rulesText:
        "Put 15 from the bank on Corporate Coup when you score it.\n[A]: Take 3 from Corporate Coup, if it has any bits.",
      counters: { bit: 15 },
    });
    const coupAbility = corpAction(
      "corporate-coup-economy",
      "activated_card_ability",
      {
        cardId: corporateCoup.instanceId,
        cardImplementationTakesHostedCredits: true,
        hostedCreditTakeAmount: 3,
        hostedCreditTakeMode: "up_to_amount_if_available",
        gainCreditsAmount: 3,
      },
      corporateCoup.instanceId,
    );
    coupAbility.costs = [{ clicks: 1 }];
    const basicCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithScoreAreaCards(
      0,
      [corporateCoup],
      [coupAbility, basicCredit],
    );

    const abilityComponents = semanticRuntimeCorpScoreComponents(
      input,
      coupAbility,
      "basic_economy_draw",
      testDependencies(),
    );

    expect(abilityComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_activated_burst_economy",
          value: 1890,
          reason: expect.stringContaining("ability_payload_gain_credits:3"),
        }),
      ]),
    );
    expect(abilityComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_activated_burst_economy",
          reason: expect.stringContaining("ability_visible_hosted_credits:15"),
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

  it("caps hosted-credit agenda ability value to visible remaining counters", () => {
    const corporateCoup = corpCard("corporate-coup", "agenda", {
      title: "Corporate Coup",
      definitionId: "onr_v1_193_corporate-coup",
      rulesText:
        "Put 15 from the bank on Corporate Coup when you score it.\n[A]: Take 3 from Corporate Coup, if it has any bits.",
      counters: { bit: 2 },
    });
    const coupAbility = corpAction(
      "corporate-coup-economy",
      "activated_card_ability",
      {
        cardId: corporateCoup.instanceId,
        cardImplementationTakesHostedCredits: true,
        hostedCreditTakeAmount: 3,
        hostedCreditTakeMode: "up_to_amount_if_available",
        gainCreditsAmount: 3,
      },
      corporateCoup.instanceId,
    );
    coupAbility.costs = [{ clicks: 1 }];
    const input = corpInputWithScoreAreaCards(
      0,
      [corporateCoup],
      [coupAbility],
    );

    const abilityComponents = semanticRuntimeCorpScoreComponents(
      input,
      coupAbility,
      "basic_economy_draw",
      testDependencies(),
    );

    expect(abilityComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_activated_burst_economy",
          value: 1530,
          reason: expect.stringContaining(
            "ability_payload_effective_gain_credits:2",
          ),
        }),
      ]),
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

  it("does not treat advanceable assets as same-turn agenda closeouts", () => {
    const vaporOps = corpCard("vapor-ops", "asset", {
      title: "Vapor Ops",
      definitionId: "onr_v1_347_vapor-ops",
      advancementRequirement: 3,
      advancementCounters: 1,
    });
    const advanceVapor = corpAction(
      "advance-vapor-ops",
      "advance_card",
      { cardId: vaporOps.instanceId, serverId: "remote_1" },
      vaporOps.instanceId,
    );
    advanceVapor.costs = [{ clicks: 1, credits: 1 }];
    const input = corpInputWithRemoteAgenda(2, 3, vaporOps, [advanceVapor]);

    const componentKeys = semanticRuntimeCorpScoreComponents(
      input,
      advanceVapor,
      "simple_score_advance",
      testDependencies(),
    ).map((component) => component.key);

    expect(componentKeys).not.toContain(
      "corp_same_turn_score_closeout_advance",
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
            "corp_board_triage_primary:score_now",
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
              "corp_board_triage_primary:score_now",
            ),
          }),
        ]),
      );
      expect(totalScore(advanceComponents)).toBeGreaterThan(
        totalScore(components),
      );
    }
  });

  it("keeps advancing an active remote agenda above off-path asset and R&D ice", () => {
    const tycho = corpCard("active-tycho", "agenda", {
      title: "Tycho Extension",
      advancementRequirement: 4,
      advancementCounters: 0,
      agendaPoints: 4,
    });
    const advanceTycho = corpAction(
      "advance-active-tycho",
      "advance_card",
      { cardId: tycho.instanceId, serverId: "remote_1" },
      tycho.instanceId,
    );
    advanceTycho.costs = [{ clicks: 1, credits: 1 }];
    const installAcmeRemote2 = corpAction(
      "install-acme-remote-2",
      "install_card",
      { placement: "root", serverId: "remote_2" },
      "acme",
    );
    const installRdIce = corpAction(
      "install-rd-fifth-ice",
      "install_card",
      { placement: "ice", serverId: "rd" },
      "rd-fifth-ice",
    );
    installRdIce.costs = [{ credits: 4 }];
    const input = corpInputWithRemoteAgenda(6, 3, tycho, [
      advanceTycho,
      installAcmeRemote2,
      installRdIce,
    ]);
    input.playerView.own.gripOrHq = [
      corpCard("acme", "asset", { title: "ACME Savings and Loan" }),
      corpIce("rd-fifth-ice", {
        definitionId: "simple_barrier_ice",
        rezCost: 4,
      }),
    ];
    input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      {
        id: "rd",
        label: "R&D",
        ice: [
          corpIce("rd-1", { definitionId: "simple_barrier_ice", rezCost: 1 }),
          corpIce("rd-2", { definitionId: "simple_barrier_ice", rezCost: 1 }),
          corpIce("rd-3", { definitionId: "simple_barrier_ice", rezCost: 1 }),
          corpIce("rd-4", { definitionId: "simple_barrier_ice", rezCost: 1 }),
        ],
        root: [],
      },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [
          corpIce("remote-wall-1", { rezCost: 3, rezzed: false }),
          corpIce("remote-wall-2", { rezCost: 3, rezzed: false }),
        ],
        root: [tycho],
      },
      {
        id: "remote_2",
        label: "Remote 2",
        ice: [corpIce("remote-2-ice", { rezCost: 2, rezzed: true })],
        root: [],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      actionCreditCost: (action: LegalAction) =>
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0),
      rolesForAction: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === installAcmeRemote2.actionId ? ["economy"] : [],
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceTycho.actionId,
      corpAdvanceRemoteScore: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceTycho.actionId ? -2200 : 0,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === advanceTycho.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "unsafe",
              agendaPointsAtRisk: 4,
              runnerAgendaPointsAfterSteal: 4,
              agendaStealSeverity: "near_win",
              runnerCanContestBeforeScore: true,
              runnerCanReachAccessBeforeScore: true,
              affordableDurableRelevantIceCount: 1,
              corpCanRezRelevantIce: true,
              corpCanRezFullPathWithDynamicReserve: true,
              dynamicProtectionReserve: 6,
              recommendedNextStep: "build_remote_ice",
              evidence: ["test_active_tycho_needs_clock"],
            })
          : undefined,
    };

    const advanceComponents = semanticRuntimeCorpScoreComponents(
      input,
      advanceTycho,
      "simple_score_advance",
      dependencies,
    );
    const acmeComponents = semanticRuntimeCorpScoreComponents(
      input,
      installAcmeRemote2,
      "basic_install",
      dependencies,
    );
    const rdIceComponents = semanticRuntimeCorpScoreComponents(
      input,
      installRdIce,
      "basic_install",
      dependencies,
    );

    expect(advanceComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_active_remote_agenda_advance_clock",
          reason: expect.stringContaining("active_remote_agenda:true"),
        }),
      ]),
    );
    expect(acmeComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_active_scoreline_off_path_spend",
          reason: expect.stringContaining("action_server:remote_2"),
        }),
      ]),
    );
    expect(rdIceComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_active_scoreline_off_path_spend",
          reason: expect.stringContaining("action_server:rd"),
        }),
      ]),
    );
    expect(totalScore(advanceComponents)).toBeGreaterThan(
      totalScore(acmeComponents),
    );
    expect(totalScore(advanceComponents)).toBeGreaterThan(
      totalScore(rdIceComponents),
    );
  });

  it("reserves active score remote credits before rezzing off-path ice", () => {
    const agenda = corpCard("active-score-agenda", "agenda", {
      advancementRequirement: 4,
      advancementCounters: 0,
      agendaPoints: 4,
    });
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const rezRemote2Ice = corpAction(
      "rez-remote-2-ice",
      "rez_ice",
      { serverId: "remote_2" },
      "remote-2-ice",
    );
    rezRemote2Ice.costs = [{ credits: 2 }];
    const input = corpInputWithRemoteAgenda(2, 3, agenda, [
      gainCredit,
      rezRemote2Ice,
    ]);
    input.playerView.opponent = runnerOpponent({
      agendaPoints: 0,
      credits: 4,
    });
    input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [corpIce("remote-wall", { rezCost: 3, rezzed: false })],
        root: [agenda],
      },
      {
        id: "remote_2",
        label: "Remote 2",
        ice: [corpIce("remote-2-ice", { rezCost: 2, rezzed: false })],
        root: [],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      actionCreditCost: (action: LegalAction) =>
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0),
    };

    const creditComponents = semanticRuntimeCorpScoreComponents(
      input,
      gainCredit,
      "basic_economy_draw",
      dependencies,
    );
    const rezComponents = semanticRuntimeCorpScoreComponents(
      input,
      rezRemote2Ice,
      "simple_rez",
      dependencies,
    );

    expect(creditComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_active_score_remote_reserve_funding",
          reason: expect.stringContaining("reserve_floor:7"),
        }),
      ]),
    );
    expect(creditComponents.map((component) => component.key)).not.toContain(
      "corp_board_triage_mismatch",
    );
    expect(rezComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_active_scoreline_off_path_spend",
          reason: expect.stringContaining("breaks_reserve:true"),
        }),
      ]),
    );
    expect(totalScore(creditComponents)).toBeGreaterThan(
      totalScore(rezComponents),
    );
  });

  it("does not treat ice-id rez on the active score remote as off-path spend", () => {
    const agenda = corpCard("active-score-agenda", "agenda", {
      advancementRequirement: 4,
      advancementCounters: 2,
      agendaPoints: 3,
    });
    const rezScoreRemoteIce = corpAction(
      "rez-score-remote-ice",
      "rez_ice",
      { iceId: "score-remote-ice" },
      "score-remote-ice",
    );
    rezScoreRemoteIce.costs = [{ credits: 1 }];
    const rezOtherRemoteIce = corpAction(
      "rez-other-remote-ice",
      "rez_ice",
      { iceId: "other-remote-ice" },
      "other-remote-ice",
    );
    rezOtherRemoteIce.costs = [{ credits: 1 }];
    const input = corpInputWithRemoteAgenda(3, 3, agenda, [
      rezScoreRemoteIce,
      rezOtherRemoteIce,
    ]);
    input.playerView.opponent = runnerOpponent({
      agendaPoints: 4,
      credits: 5,
    });
    input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [corpIce("score-remote-ice", { rezCost: 1, rezzed: false })],
        root: [agenda],
      },
      {
        id: "remote_2",
        label: "Remote 2",
        ice: [corpIce("other-remote-ice", { rezCost: 1, rezzed: false })],
        root: [],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      actionCreditCost: (action: LegalAction) =>
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0),
    };

    const scoreRemoteRezComponents = semanticRuntimeCorpScoreComponents(
      input,
      rezScoreRemoteIce,
      "simple_rez",
      dependencies,
    );
    const otherRemoteRezComponents = semanticRuntimeCorpScoreComponents(
      input,
      rezOtherRemoteIce,
      "simple_rez",
      dependencies,
    );

    expect(scoreRemoteRezComponents).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_active_scoreline_off_path_spend",
        }),
      ]),
    );
    expect(otherRemoteRezComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_active_scoreline_off_path_spend",
          reason: expect.stringContaining("action_server:remote_2"),
        }),
      ]),
    );
    expect(totalScore(scoreRemoteRezComponents)).toBeGreaterThan(
      totalScore(otherRemoteRezComponents),
    );
  });

  it("funds an active score remote before non-closing advances break reserve", () => {
    const agenda = corpCard("active-score-agenda", "agenda", {
      advancementRequirement: 4,
      advancementCounters: 0,
      agendaPoints: 3,
    });
    const advanceAgenda = corpAction(
      "advance-active-score-agenda",
      "advance_card",
      { serverId: "remote_1" },
      agenda.instanceId,
    );
    advanceAgenda.costs = [{ credits: 1 }];
    const gainCredit = corpAction("gain-credit", "gain_credit", {});
    const input = corpInputWithRemoteAgenda(4, 2, agenda, [
      advanceAgenda,
      gainCredit,
    ]);
    input.playerView.opponent = runnerOpponent({
      agendaPoints: 4,
      credits: 4,
    });
    input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [corpIce("remote-wall", { rezCost: 3, rezzed: false })],
        root: [agenda],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      actionCreditCost: (action: LegalAction) =>
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId,
      corpAdvanceRemoteScore: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId ? -2200 : 0,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === advanceAgenda.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "unsafe",
              scoreHorizon: "next_turn",
              agendaPointsAtRisk: 3,
              runnerAgendaPointsAfterSteal: 7,
              agendaStealSeverity: "game_ending",
              corpCanRezRelevantIce: false,
              corpCanRezFullPathWithDynamicReserve: false,
              recommendedNextStep: "gain_credit",
              evidence: ["test_active_remote_needs_funding_before_advance"],
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
          key: "corp_active_remote_agenda_underfunded_advance",
          value: -9000,
          reason: expect.stringContaining(
            "advance_breaks_score_remote_reserve:true",
          ),
        }),
      ]),
    );
    expect(
      totalScoreFor(input, gainCredit, "basic_economy_draw", dependencies),
    ).toBeGreaterThan(totalScore(advanceComponents));
  });

  it("aligns scoreline funding and suppresses the blocked scoreline action", () => {
    const agenda = corpCard("remote-score-agenda", "agenda", {
      advancementRequirement: 5,
      advancementCounters: 1,
      agendaPoints: 3,
    });
    const advanceAgenda = corpAction(
      "advance-remote-score-agenda",
      "advance_card",
      { serverId: "remote_1" },
      agenda.instanceId,
    );
    advanceAgenda.costs = [{ credits: 1 }];
    const gainCredit = corpAction("gain-credit", "gain_credit", {});
    const input = corpInputWithRemoteAgenda(4, 3, agenda, [
      advanceAgenda,
      gainCredit,
    ]);
    const dependencies = {
      ...testDependencies(),
      actionCreditCost: (action: LegalAction) =>
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId,
      corpScorelineWindowAssessment: () =>
        scorelineFundingAssessment({
          advanceAction: advanceAgenda,
          fundingAction: gainCredit,
        }),
    };

    const advanceComponents = semanticRuntimeCorpScoreComponents(
      input,
      advanceAgenda,
      "simple_score_advance",
      dependencies,
    );
    const creditComponents = semanticRuntimeCorpScoreComponents(
      input,
      gainCredit,
      "basic_economy_draw",
      dependencies,
    );

    expect(advanceComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_scoreline_funding_mismatch",
          value: -5200,
        }),
      ]),
    );
    expect(creditComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_scoreline_funding_alignment",
          value: 2600,
        }),
      ]),
    );
    expect(totalScore(creditComponents)).toBeGreaterThan(
      totalScore(advanceComponents),
    );
  });

  it("does not suppress a funded active scoreline advance that can close this turn", () => {
    const agenda = corpCard("same-turn-score-agenda", "agenda", {
      advancementRequirement: 3,
      advancementCounters: 1,
      agendaPoints: 2,
    });
    const advanceAgenda = corpAction(
      "advance-same-turn-score-agenda",
      "advance_card",
      { serverId: "remote_1" },
      agenda.instanceId,
    );
    advanceAgenda.costs = [{ credits: 1 }];
    const input = corpInputWithRemoteAgenda(8, 3, agenda, [advanceAgenda]);
    const dependencies = {
      ...testDependencies(),
      actionCreditCost: (action: LegalAction) =>
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId,
      corpScorelineWindowAssessment: () =>
        scorelineFundingAssessment({
          advanceAction: advanceAgenda,
          blockedByCredits: true,
        }),
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
          key: "corp_same_turn_score_closeout_advance",
        }),
      ]),
    );
    expect(advanceComponents).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_scoreline_funding_mismatch",
        }),
      ]),
    );
  });

  it("continues an uncontested active remote agenda over quiet central over-ice", () => {
    const agenda = corpCard("active-score-agenda", "agenda", {
      advancementRequirement: 4,
      advancementCounters: 0,
      agendaPoints: 4,
    });
    const hqAgenda = agendaCard("agenda-in-hq", 2);
    const hqIce = corpIce("hq-data-wall", {
      title: "Data Wall",
      rulesText: "End the run.",
      rezCost: 1,
    });
    const advanceAgenda = corpAction(
      "advance-active-score-agenda",
      "advance_card",
      { serverId: "remote_1" },
      agenda.instanceId,
    );
    advanceAgenda.costs = [{ credits: 1 }];
    const installHqIce = corpAction(
      "install-hq-ice",
      "install_card",
      { placement: "ice", serverId: "hq" },
      hqIce.instanceId,
    );
    installHqIce.costs = [{ credits: 3 }];
    const gainCredit = corpAction("gain-credit", "gain_credit", {});
    const input = corpInputWithRemoteAgenda(4, 3, agenda, [
      advanceAgenda,
      installHqIce,
      gainCredit,
    ]);
    input.playerView.own.gripOrHq = [hqAgenda, hqIce];
    input.playerView.opponent = runnerOpponent({
      agendaPoints: 6,
      credits: 4,
      rig: [],
    });
    input.playerView.servers = [
      {
        id: "hq",
        label: "HQ",
        ice: [
          corpIce("hq-existing-1", {
            rezzed: true,
            rezCost: 1,
            rulesText: "End the run.",
          }),
          corpIce("hq-existing-2", {
            rezzed: true,
            rezCost: 1,
            rulesText: "End the run.",
          }),
          corpIce("hq-existing-3", {
            rezzed: false,
            rezCost: 1,
            rulesText: "End the run.",
          }),
        ],
        root: [],
      },
      { id: "rd", label: "R&D", ice: [], root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [
          corpIce("remote-wall-1", { rezCost: 5, rezzed: false }),
          corpIce("remote-wall-2", { rezCost: 5, rezzed: false }),
          corpIce("remote-wall-3", { rezCost: 5, rezzed: false }),
          corpIce("remote-wall-4", { rezCost: 6, rezzed: false }),
        ],
        root: [agenda],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      actionCreditCost: (action: LegalAction) =>
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0),
      rolesForAction: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === installHqIce.actionId ? ["ice", "protect"] : [],
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId,
      corpAdvanceRemoteScore: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId ? 1250 : 0,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === advanceAgenda.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "temporary_safe",
              scoreHorizon: "next_turn",
              agendaPointsAtRisk: 4,
              runnerAgendaPointsAfterSteal: 10,
              agendaStealSeverity: "game_ending",
              missingVisibleBreakerCoverage: true,
              corpCanRezRelevantIce: true,
              corpCanRezFullPathWithDynamicReserve: false,
              affordableDurableRelevantIceCount: 1,
              recommendedNextStep: "advance",
              evidence: ["test_uncontested_active_remote_advance"],
            })
          : undefined,
    };

    const advanceComponents = semanticRuntimeCorpScoreComponents(
      input,
      advanceAgenda,
      "simple_score_advance",
      dependencies,
    );

    expect(advanceComponents).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_active_remote_agenda_underfunded_advance",
        }),
      ]),
    );
    expect(advanceComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_active_remote_agenda_advance_clock",
          reason: expect.stringContaining("recommended_next_step:advance"),
        }),
      ]),
    );
    expect(totalScore(advanceComponents)).toBeGreaterThan(
      totalScoreFor(input, installHqIce, "basic_install", dependencies),
    );
  });

  it("keeps punish-primary active remote advances behind the rez reserve", () => {
    const agenda = corpCard("active-score-agenda", "agenda", {
      advancementRequirement: 4,
      advancementCounters: 0,
      agendaPoints: 4,
    });
    const advanceAgenda = corpAction(
      "advance-active-score-agenda",
      "advance_card",
      { serverId: "remote_1" },
      agenda.instanceId,
    );
    advanceAgenda.costs = [{ credits: 1 }];
    const gainCredit = corpAction("gain-credit", "gain_credit", {});
    const input = {
      ...corpInputWithRemoteAgenda(4, 3, agenda, [advanceAgenda, gainCredit]),
      ownCorpStrategicIntent: {
        primaryWinIntent: "corp.punish_runner",
        scorePlan: ["corp.remote_scoreline"],
        punishPlan: ["corp.damage_kill", "corp.tag_trace_punish"],
      },
    } as unknown as AiDecisionInput;
    input.playerView.opponent = runnerOpponent({
      agendaPoints: 1,
      credits: 4,
      rig: [],
    });
    input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [
          corpIce("remote-wall-1", { rezCost: 5, rezzed: false }),
          corpIce("remote-wall-2", { rezCost: 5, rezzed: false }),
        ],
        root: [agenda],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      actionCreditCost: (action: LegalAction) =>
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId,
      corpAdvanceRemoteScore: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId ? 1250 : 0,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === advanceAgenda.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "temporary_safe",
              scoreHorizon: "next_turn",
              agendaPointsAtRisk: 4,
              runnerAgendaPointsAfterSteal: 5,
              agendaStealSeverity: "normal",
              missingVisibleBreakerCoverage: true,
              corpCanRezRelevantIce: true,
              corpCanRezFullPathWithDynamicReserve: false,
              affordableDurableRelevantIceCount: 1,
              recommendedNextStep: "advance",
              evidence: ["test_punish_primary_requires_rez_reserve"],
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
          key: "corp_active_remote_agenda_underfunded_advance",
          reason: expect.stringContaining(
            "punish_primary_uncontested_advance_requires_reserve:true",
          ),
        }),
      ]),
    );
    expect(
      totalScoreFor(input, gainCredit, "basic_economy_draw", dependencies),
    ).toBeGreaterThan(totalScore(advanceComponents));
  });

  it("keeps score-now advances ahead of reserve funding without a strong same-remote ICE alternative", () => {
    const agenda = corpCard("active-score-agenda", "agenda", {
      advancementRequirement: 5,
      advancementCounters: 3,
      agendaPoints: 2,
    });
    const advanceAgenda = corpAction(
      "advance-active-score-agenda",
      "advance_card",
      { serverId: "remote_1" },
      agenda.instanceId,
    );
    advanceAgenda.costs = [{ credits: 1 }];
    const gainCredit = corpAction("gain-credit", "gain_credit", {});
    const input = corpInputWithRemoteAgenda(4, 3, agenda, [
      advanceAgenda,
      gainCredit,
    ]);
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
        ice: [corpIce("remote-wall", { rezCost: 3, rezzed: false })],
        root: [agenda],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      actionCreditCost: (action: LegalAction) =>
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId,
      corpAdvanceRemoteScore: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId ? -2200 : 0,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === advanceAgenda.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "unsafe",
              scoreHorizon: "next_turn",
              agendaPointsAtRisk: 2,
              runnerAgendaPointsAfterSteal: 5,
              corpCanRezRelevantIce: true,
              corpCanRezFullPathWithDynamicReserve: false,
              recommendedNextStep: "build_remote_ice",
              evidence: ["test_score_now_tempo_advance"],
            })
          : undefined,
    };

    const advanceComponents = semanticRuntimeCorpScoreComponents(
      input,
      advanceAgenda,
      "simple_score_advance",
      dependencies,
    );

    expect(advanceComponents).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_active_remote_agenda_underfunded_advance",
        }),
      ]),
    );
    expect(advanceComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_active_remote_agenda_advance_clock",
          reason: expect.stringContaining(
            "tempo_advance_under_scoreline_clock:true",
          ),
        }),
      ]),
    );
    expect(totalScore(advanceComponents)).toBeGreaterThan(
      totalScoreFor(input, gainCredit, "basic_economy_draw", dependencies),
    );
  });

  it("does not bypass active remote reserve when a strong same-remote ICE install is legal", () => {
    const agenda = corpCard("active-score-agenda", "agenda", {
      advancementRequirement: 5,
      advancementCounters: 3,
      agendaPoints: 2,
    });
    const blockingIce = corpIce("blocking-remote-ice", {
      title: "Remote Barrier",
      rulesText: "End the run.",
      rezCost: 1,
    });
    const advanceAgenda = corpAction(
      "advance-active-score-agenda",
      "advance_card",
      { serverId: "remote_1" },
      agenda.instanceId,
    );
    advanceAgenda.costs = [{ credits: 1 }];
    const installRemoteIce = corpAction(
      "install-blocking-remote-ice",
      "install_card",
      { placement: "ice", serverId: "remote_1" },
      blockingIce.instanceId,
    );
    installRemoteIce.costs = [{ credits: 1 }];
    const gainCredit = corpAction("gain-credit", "gain_credit", {});
    const input = corpInputWithRemoteAgenda(5, 3, agenda, [
      advanceAgenda,
      installRemoteIce,
      gainCredit,
    ]);
    input.playerView.own.gripOrHq = [blockingIce];
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
        ice: [corpIce("remote-wall", { rezCost: 3, rezzed: false })],
        root: [agenda],
      },
    ];
    const dependencies = {
      ...testDependencies(),
      actionCreditCost: (action: LegalAction) =>
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0),
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId,
      corpAdvanceRemoteScore: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === advanceAgenda.actionId ? -2200 : 0,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === advanceAgenda.actionId ||
        action.actionId === installRemoteIce.actionId
          ? scoringWindow({
              serverId: "remote_1",
              windowKind: "unsafe",
              scoreHorizon: "next_turn",
              agendaPointsAtRisk: 2,
              runnerAgendaPointsAfterSteal: 5,
              corpCanRezRelevantIce: true,
              corpCanRezFullPathWithDynamicReserve: false,
              recommendedNextStep: "build_remote_ice",
              evidence: ["test_score_now_remote_ice_before_tempo_advance"],
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
          key: "corp_active_remote_agenda_underfunded_advance",
          reason: expect.stringContaining(
            "tempo_score_now_blocked_by_remote_ice:true",
          ),
        }),
      ]),
    );
    expect(
      totalScoreFor(input, installRemoteIce, "basic_install", dependencies),
    ).toBeGreaterThan(totalScore(advanceComponents));
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
    const input = corpInputWithHqCards(
      6,
      [agenda],
      [installExistingRemote, installNewRemote, gainCredit],
    );
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
          reason: expect.stringContaining("corp_active_scoreline_clock:true"),
        }),
        expect.objectContaining({
          key: "corp_existing_score_remote_pipeline",
          reason: expect.stringContaining("payload:scoreline_root"),
        }),
      ]),
    );
    expect(newRemoteComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_board_triage_mismatch",
          reason: expect.stringContaining("triage_action_server:new_remote"),
        }),
        expect.objectContaining({
          key: "corp_remote_sprawl_penalty",
          reason: expect.stringContaining("action_server:new_remote"),
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

  it("penalizes opening a second empty remote when a score remote is prepared", () => {
    const agenda = agendaCard("agenda-in-hq", 4);
    const installExistingAgenda = corpAction(
      "install-agenda-existing-remote",
      "install_card",
      { cardType: "agenda", placement: "root", serverId: "remote_1" },
      agenda.instanceId,
    );
    const installNewRemoteIce = corpAction(
      "install-new-remote-ice",
      "install_card",
      { placement: "ice", serverId: "new_remote" },
      "new-remote-ice",
    );
    const input = corpInputWithHqCards(
      6,
      [agenda],
      [installExistingAgenda, installNewRemoteIce],
    );
    input.playerView.own.gripOrHq.push(
      corpIce("new-remote-ice", {
        definitionId: "simple_barrier_ice",
        rezCost: 2,
      }),
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
        action.actionId === installNewRemoteIce.actionId
          ? ["ice", "protect"]
          : [],
      corpActionIsScoreLine: (_input: AiDecisionInput, action: LegalAction) =>
        action.actionId === installExistingAgenda.actionId,
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === installExistingAgenda.actionId
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
              evidence: ["test_existing_score_remote_pipeline"],
            })
          : undefined,
    };

    const existingComponents = semanticRuntimeCorpScoreComponents(
      input,
      installExistingAgenda,
      "basic_install",
      dependencies,
    );
    const newRemoteComponents = semanticRuntimeCorpScoreComponents(
      input,
      installNewRemoteIce,
      "basic_install",
      dependencies,
    );

    expect(existingComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_existing_score_remote_pipeline",
          reason: expect.stringContaining("server:remote_1"),
        }),
      ]),
    );
    expect(newRemoteComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_remote_sprawl_penalty",
          value: -3600,
        }),
      ]),
    );
    expect(totalScore(existingComponents)).toBeGreaterThan(
      totalScore(newRemoteComponents),
    );
  });

  it("searches for an agenda instead of taking more credits when a score remote is prepared", () => {
    const drawCard = corpAction("draw-card", "draw_card", {}, "basic_action");
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const accountsReceivable = corpAction(
      "accounts-receivable",
      "play_operation",
      {},
      "corp_accounts_receivable",
    );
    const input = corpInputWithHqCards(
      6,
      [accountsReceivableCard()],
      [drawCard, gainCredit, accountsReceivable],
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
        action.actionId === accountsReceivable.actionId ? ["economy"] : [],
    };

    const drawComponents = semanticRuntimeCorpScoreComponents(
      input,
      drawCard,
      "basic_economy_draw",
      dependencies,
    );
    const creditComponents = semanticRuntimeCorpScoreComponents(
      input,
      gainCredit,
      "basic_economy_draw",
      dependencies,
    );
    const operationComponents = semanticRuntimeCorpScoreComponents(
      input,
      accountsReceivable,
      "basic_install",
      dependencies,
      semanticCandidate(
        accountsReceivable.actionId,
        "play.corp_operation",
        ["economy.corp_credit_burst"],
        "play_operation",
      ),
    );

    expect(drawComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_prepared_score_remote_agenda_search",
          reason: expect.stringContaining("server:remote_1"),
        }),
      ]),
    );
    expect(creditComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_prepared_score_remote_credit_loop_penalty",
        }),
      ]),
    );
    expect(operationComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_prepared_score_remote_credit_loop_penalty",
        }),
      ]),
    );
    expect(totalScore(drawComponents)).toBeGreaterThan(
      totalScore(creditComponents),
    );
    expect(totalScore(drawComponents)).toBeGreaterThan(
      totalScore(operationComponents),
    );
  });

  it("does not push agenda search ahead of funding when a prepared remote rez floor is unmet", () => {
    const drawCard = corpAction("draw-card", "draw_card", {}, "basic_action");
    const gainCredit = corpAction(
      "gain-credit",
      "gain_credit",
      {},
      "basic_action",
    );
    const input = corpInputWithHqCards(2, [], [drawCard, gainCredit]);
    input.playerView.servers = [
      { id: "hq", label: "HQ", ice: [], root: [] },
      { id: "rd", label: "R&D", ice: [], root: [] },
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [corpIce("remote-wall", { rezCost: 4, rezzed: false })],
        root: [],
      },
    ];

    const drawComponents = semanticRuntimeCorpScoreComponents(
      input,
      drawCard,
      "basic_economy_draw",
      testDependencies(),
    );
    const creditComponents = semanticRuntimeCorpScoreComponents(
      input,
      gainCredit,
      "basic_economy_draw",
      testDependencies(),
    );

    expect(drawComponents).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_prepared_score_remote_agenda_search",
        }),
      ]),
    );
    expect(creditComponents).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_prepared_score_remote_credit_loop_penalty",
        }),
      ]),
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

    expect(installComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_remote_scoreline_unfunded_ice_install_penalty",
          value: -1900,
          reason: expect.stringContaining("window_needs_funding:true"),
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

    expect(installComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_remote_scoreline_unfunded_ice_install_penalty",
          value: -1900,
          reason: expect.stringContaining("prepared_score_remote:true"),
        }),
      ]),
    );
    expect(totalScore(creditComponents)).toBeGreaterThan(
      totalScore(installComponents),
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
      semanticCandidate(
        nightShift.actionId,
        "play.corp_operation",
        ["economy.corp_credit_burst", "draw_operation"],
        "play_operation",
      ),
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
