import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  corpActionCandidateHasVisibleSignal,
  normalizedCorpReserveScoreValue,
  semanticRuntimeCorpScoreComponents,
} from "./semantic-runtime-corp-score";
import {
  accountsReceivableCard,
  agendaCard,
  candidate,
  corpAction,
  corpCard,
  corpIce,
  corpInputWithGoals,
  corpInputWithHqCards,
  corpInputWithHqCardsAndServers,
  corpInputWithScoreAreaCards,
  economySemanticCandidate,
  runnerOpponent,
  scoringWindow,
  semanticCandidate,
  testDependencies,
  totalScore,
  totalScoreFor,
} from "./semantic-runtime-corp-score.test-support";
import { createCorpCreditDemand } from "../plans/credit-demand";

describe("semanticRuntimeCorpScoreComponents economy and trace", () => {
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

  it("penalizes another basic credit above visible reserve when draw is available", () => {
    const gainCredit = corpAction("gain-credit", "gain_credit", {
      gainCreditsAmount: 1,
    });
    const drawThree = corpAction("draw-three", "play_operation", {
      drawCardsAmount: 3,
    });
    const input = corpInputWithGoals([], [gainCredit, drawThree]);
    input.playerView.own.credits = 12;

    const components = semanticRuntimeCorpScoreComponents(
      input,
      gainCredit,
      "basic_economy_draw",
      testDependencies(),
      economySemanticCandidate(gainCredit, 1),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_credit_saturation_penalty",
          value: -900,
        }),
      ]),
    );
  });

  it("keeps basic credit unpenalized while a concrete credit demand is open", () => {
    const gainCredit = corpAction("gain-credit", "gain_credit", {
      gainCreditsAmount: 1,
    });
    const drawThree = corpAction("draw-three", "play_operation", {
      drawCardsAmount: 3,
    });
    const input = corpInputWithGoals([], [gainCredit, drawThree]);
    input.playerView.own.credits = 4;
    const demand = createCorpCreditDemand({
      demandId: "corp:test-rez",
      purpose: "current_rez_window",
      priority: "current_foreground_plan",
      hardness: "hard",
      deadline: "end_of_current_turn",
      currentCredits: 4,
      targetCredits: 7,
    });

    const components = semanticRuntimeCorpScoreComponents(
      input,
      gainCredit,
      "basic_economy_draw",
      testDependencies(),
      economySemanticCandidate(gainCredit, 1),
      [demand],
    );

    expect(components.map((component) => component.key)).not.toContain(
      "corp_credit_saturation_penalty",
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

  it("does not treat advancing a trace agenda as resolving its scored ability", () => {
    const advance = corpAction("advance-trace-agenda", "advance_card");
    const input = corpInputWithGoals([], [advance]);
    input.playerView.own.clicks = 1;

    const components = semanticRuntimeCorpScoreComponents(
      input,
      advance,
      "simple_score_advance",
      testDependencies(),
      semanticCandidate(
        advance.actionId,
        "score.trace_tag_source",
        ["trace.source", "tag.source"],
        "advance_card",
      ),
    );

    expect(components).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_trace_without_conversion_window",
        }),
        expect.objectContaining({
          key: "corp_last_click_trace_without_payoff",
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
      economySemanticCandidate(accountsReceivable, 5, { creditCost: 1 }),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "economy_credit_base",
          value: 240,
          reason: expect.stringContaining("economy_net_liquid_gain:4"),
        }),
        expect.objectContaining({
          key: "economy_net_hand_delta",
          value: -40,
        }),
      ]),
    );
  });

  it("does not invent locked operation value from visible rules text", () => {
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
      economySemanticCandidate(basicCredit, 1),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "economy_credit_base",
          value: 100,
        }),
      ]),
    );
    expect(components.map((component) => component.key)).not.toContain(
      "corp_operation_economy_threshold_funding",
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
      economySemanticCandidate(marineAbility, 3, {
        sourceDefinitionId: "onr_v1_206_marine-arcology",
      }),
    );

    expect(abilityComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "economy_credit_base",
          value: 200,
          reason: expect.stringContaining("economy_net_liquid_gain:3"),
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
      economySemanticCandidate(coupAbility, 3, {
        sourceDefinitionId: "onr_v1_193_corporate-coup",
      }),
    );

    expect(abilityComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "economy_credit_base",
          value: 200,
          reason: expect.stringContaining("economy_net_liquid_gain:3"),
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
        hostedCreditTakeAmount: 2,
        hostedCreditTakeMode: "up_to_amount_if_available",
        gainCreditsAmount: 2,
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
      economySemanticCandidate(coupAbility, 2, {
        sourceDefinitionId: "onr_v1_193_corporate-coup",
      }),
    );

    expect(abilityComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "economy_credit_base",
          value: 150,
          reason: expect.stringContaining("economy_net_liquid_gain:2"),
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
      economySemanticCandidate(marineAbility, 3, {
        sourceDefinitionId: "onr_v1_206_marine-arcology",
      }),
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
          key: "economy_credit_base",
          value: 200,
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
});
