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
  semanticRuntimeCorpScoreComponents,
} from "./semantic-runtime-corp-score";

describe("semanticRuntimeCorpScoreComponents", () => {
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

function testDependencies() {
  return {
    actionCreditCost: () => 0,
    rolesForAction: () => [],
    corpScoreNowSafetyGate: () => ({ allowed: true, evidence: ["test"] }),
    corpAdvanceRemoteScore: () => 0,
    corpRemoteRezFloorAssessment: () => undefined,
    corpCentralRezReserveAssessment: () => undefined,
    corpRemoteScoreContestabilityAssessment: () => undefined,
    corpActionIsScoreLine: () => false,
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
