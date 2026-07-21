import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { semanticRuntimeCorpScoreComponents } from "./semantic-runtime-corp-score";
import {
  accountsReceivableCard,
  agendaCard,
  corpAction,
  corpCard,
  corpIce,
  corpInputWithGoals,
  corpInputWithHqCards,
  corpInputWithRemoteAgenda,
  runnerOpponent,
  scorelineFundingAssessment,
  scoringWindow,
  semanticCandidate,
  testDependencies,
  totalScore,
  totalScoreFor,
} from "./semantic-runtime-corp-score.test-support";

describe("semanticRuntimeCorpScoreComponents active remote", () => {
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

    expect(creditComponents.map((component) => component.key)).not.toContain(
      "corp_active_score_remote_reserve_funding",
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

  it("defers a slow active scoreline while a rich runner can develop a contest", () => {
    const agenda = corpCard("slow-active-agenda", "agenda", {
      advancementRequirement: 5,
      advancementCounters: 0,
      agendaPoints: 2,
    });
    const advanceAgenda = corpAction(
      "advance-slow-active-agenda",
      "advance_card",
      { serverId: "remote_1" },
      agenda.instanceId,
    );
    advanceAgenda.costs = [{ credits: 1 }];
    const gainCredit = corpAction("gain-credit", "gain_credit", {});
    const input = corpInputWithRemoteAgenda(4, 1, agenda, [
      advanceAgenda,
      gainCredit,
    ]);
    input.playerView.opponent = runnerOpponent({ credits: 30 });
    const dependencies = {
      ...testDependencies(),
      actionCreditCost: (action: LegalAction) =>
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0),
      corpScoringWindowAssessment: (
        _input: AiDecisionInput,
        action: LegalAction,
      ) =>
        action.actionId === advanceAgenda.actionId
          ? scoringWindow({
              scoreHorizon: "slow",
              recommendedNextStep: "build_remote_ice",
              evidence: ["test_slow_scoreline_rich_runner"],
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
          key: "corp_active_remote_agenda_rich_runner_slow_horizon",
          value: -5200,
          reason: expect.stringContaining("visible_runner_credits:30"),
        }),
      ]),
    );
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
});
