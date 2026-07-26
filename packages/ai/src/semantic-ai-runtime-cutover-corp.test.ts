import { afterEach, describe, expect, it } from "vitest";
import { chooseCorpAction, chooseRunnerAction } from "./index";
import { AI_HINTS_BY_CARD } from "./ai-hints";
import { buildDeckDoctrineV2Diagnostic } from "./deck-doctrine-strategy";
import { buildStrategicIntentState } from "./strategic-intent-state";
import {
  AI_PLAY_STRENGTH_PILOT_ENV,
  AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV,
} from "./decision/pilot-scope-registry";
import { resetTacticalPlanMemory } from "./tactical-plans";
import { getStrategicIntentMemorySnapshot } from "./strategic-intent-memory";
import { resetResidentPlanPortfolioMemory } from "./plans/resident-plan-portfolio-memory";
import { PlanResolutionFailure } from "./plans/plan-resolution-failure";
import {
  chooseSemanticRuntimeAction,
  type SemanticRuntimeDependencies,
} from "./runtime/semantic-runtime";
import type { AiDecisionInput } from "@netgrid/shared";
import {
  aiInput,
  legalAction,
  publicEvent,
  runtimeRunnerStrategyProfile,
  semanticRuntimeChoice,
  semanticRuntimeDependenciesWithoutRunTargetEvaluation,
  server,
  visibleCard,
} from "./semantic-ai-runtime-cutover.test-support";

function semanticRuntimeDependencies(
  ...args: Parameters<
    typeof semanticRuntimeDependenciesWithoutRunTargetEvaluation
  >
): SemanticRuntimeDependencies {
  return {
    ...semanticRuntimeDependenciesWithoutRunTargetEvaluation(...args),
    evaluateRunnerRunTargets: () => [],
  } as SemanticRuntimeDependencies;
}

describe("Semantic AI runtime cutover — live and Corp contracts", () => {
  const originalRuntimeMode = process.env.NETGRID_SEMANTIC_AI_RUNTIME;

  const originalPilotMode = process.env[AI_PLAY_STRENGTH_PILOT_ENV];

  const originalLocalDefaultMode =
    process.env[AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV];

  afterEach(() => {
    resetTacticalPlanMemory();
    resetResidentPlanPortfolioMemory();
    if (originalRuntimeMode === undefined) {
      delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    } else {
      process.env.NETGRID_SEMANTIC_AI_RUNTIME = originalRuntimeMode;
    }
    if (originalPilotMode === undefined) {
      delete process.env[AI_PLAY_STRENGTH_PILOT_ENV];
    } else {
      process.env[AI_PLAY_STRENGTH_PILOT_ENV] = originalPilotMode;
    }
    if (originalLocalDefaultMode === undefined) {
      delete process.env[AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV];
    } else {
      process.env[AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV] =
        originalLocalDefaultMode;
    }
  });

  it("uses the Runner defense plan as the live tag-removal decision by default", () => {
    const input = aiInput("runner", [
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("remove-tag", "runner", "remove_tag", "Remove tag", {
        credits: 2,
      }),
    ]);
    input.playerView.own.tags = 1;

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("remove-tag");
    expect(decision.reasonCode).toBe("plan_first.runner.defense_and_recovery");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_first_runtime:true",
        "plan_module:runner.defense_and_recovery",
        "plan_step_capability:remove_active_tags",
      ]),
    );
    expect(decision.fallbackUsed).toBe(false);
  });

  it("rejects a purposeless scored-agenda ability before developing exact basic liquidity", () => {
    const scoredAgenda = visibleCard(
      "scored-artificial-security-directors",
      "corp",
      "agenda",
      {
        definitionId: "onr_v1_189_artificial-security-directors",
        title: "Artificial Security Directors",
        agendaPoints: 1,
      },
    );
    const revealAction = legalAction(
      "corp.gain_credit.scored-directors.reveal-rd-top",
      "corp",
      "gain_credit",
      "Reveal the top card of R&D",
      { clicks: 1, credits: 0 },
      {
        source: scoredAgenda.instanceId,
        payload: {
          agendaAbility: "v1919_scored_agenda_reveal_rd_top",
        },
      },
    );
    const basicCredit = legalAction(
      "corp.gain_credit",
      "corp",
      "gain_credit",
      "Gain 1 credit",
      { clicks: 1, credits: 0 },
      { source: "basic_action" },
    );
    const input = aiInput("corp", [
      revealAction,
      basicCredit,
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.scoreArea = [scoredAgenda];

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expectCorpLiquidityDevelopment(decision, basicCredit.actionId);
    expectRejectedByPlan(decision, revealAction.actionId);
    expect(debugText).not.toContain(
      "corp.hand_and_agenda_management:develop%3Ascored-artificial-security-directors",
    );
  });

  it("marks an alternative-free Corp end turn as forced without hiding its raw decision", () => {
    const input = aiInput("corp", [
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        {
          credits: 0,
        },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.clicks = 0;

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("end-turn");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_first_lane:plan",
        "plan_module:corp.complete_turn",
        "plan_step_capability:complete_turn_after_productive_routes_exhausted",
        "plan_assessment_evidence:productive_legal_routes_exhausted",
      ]),
    );
    expect(decision.decisionDebug?.planId).toContain("corp.complete_turn");
  });

  it("selects the guaranteed affordable Corp trace bid through the live choice contract", () => {
    const resolveChoice = legalAction(
      "resolve-trace-bid",
      "corp",
      "resolve_choice",
      "Trace-Gebot festlegen",
      { credits: 0 },
    );
    const input = aiInput("corp", [resolveChoice]);
    input.difficulty = "hard";
    input.playerView.own.credits = 18;
    input.playerView.own.clicks = 1;
    input.playerView.opponent.credits = 11;
    input.playerView.own.gripOrHq = [
      visibleCard("closed-accounts", "corp", "operation", {
        definitionId: "onr_v1_285_closed-accounts",
        title: "Closed Accounts",
        cost: 1,
        playCost: { kind: "fixed", credits: 1 },
      }),
      visibleCard("scorched-earth", "corp", "operation", {
        definitionId: "onr_v1_302_scorched-earth",
        title: "Scorched Earth",
        cost: 3,
        playCost: { kind: "fixed", credits: 3 },
      }),
    ];
    input.playerView.pendingChoice = {
      choiceId: "trace-corp-choice",
      side: "corp",
      source: "trace:corp",
      prompt: "Trace-Gebot",
      kind: "bid_amount",
      options: Array.from({ length: 12 }, (_, amount) => ({
        id: `bid_${amount}`,
        label: String(amount),
        value: amount,
      })),
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 1,
      visibility: "hidden_info_barrier",
    };
    input.eventTail = [
      publicEvent("trace-started", "trace_started", 0, {
        traceStrength: 5,
        runnerLink: 0,
      }),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe(resolveChoice.actionId);
    expect(decision.selectedChoices).toEqual({
      choiceId: "trace-corp-choice",
      selectedOptionIds: ["bid_7"],
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_first_runtime:true",
        "plan_first_lane:engine_window",
        "plan_first_executor:rules.window_resolution",
      ]),
    );
  });

  it("routes activated tag cleanup cards through the Runner defense plan", () => {
    const input = aiInput("runner", [
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "use-danshi",
        "runner",
        "activated_card_ability",
        "Danshi's Second ID: bis zu 3 Tags entfernen",
        { credits: 0 },
        {
          source: "danshi-instance",
          payload: {
            cardImplementationAbility: "activated",
            cardImplementationAbilityIndex: 0,
            cardImplementationTrashSourceCost: true,
          },
        },
      ),
    ]);
    input.playerView.own.tags = 4;
    input.playerView.own.credits = 1;
    input.playerView.own.rig = [
      visibleCard("danshi-instance", "runner", "resource", {
        definitionId: "onr_v1_158_danshis-second-id",
        title: "Danshi's Second ID",
      }),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("use-danshi");
    expect(decision.reasonCode).toBe("plan_first.runner.defense_and_recovery");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:runner.defense_and_recovery",
        "plan_step_capability:remove_active_tags",
        "plan_assessment_evidence:runner_base_hand_buffer:3",
      ]),
    );
  });

  it("does not blindly prioritize activated tag cleanup when the runner has no tags", () => {
    const input = aiInput("runner", [
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "use-danshi",
        "runner",
        "activated_card_ability",
        "Danshi's Second ID: bis zu 3 Tags entfernen",
        { credits: 0 },
        {
          source: "danshi-instance",
          payload: {
            cardImplementationAbility: "activated",
            cardImplementationAbilityIndex: 0,
            cardImplementationTrashSourceCost: true,
          },
        },
      ),
    ]);
    input.playerView.own.tags = 0;
    input.playerView.own.credits = 1;
    input.playerView.own.rig = [
      visibleCard("danshi-instance", "runner", "resource", {
        definitionId: "onr_v1_158_danshis-second-id",
        title: "Danshi's Second ID",
      }),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:runner.economy",
        "plan_step_capability:gain_general_liquid_credits",
      ]),
    );
  });

  it("keeps the replay cluster shape on the visible run path", () => {
    const run = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0 },
      { payload: { serverId: "rd" } },
    );
    const draw = legalAction("draw", "runner", "draw_card", "Draw", {
      credits: 0,
    });
    const input = aiInput("runner", [draw, run]);
    input.playerView.own.credits = 3;
    input.playerView.own.clicks = 2;
    input.playerView.own.gripOrHq = [
      visibleCard("held-1", "runner", "event"),
      visibleCard("held-2", "runner", "program"),
      visibleCard("held-3", "runner", "resource"),
      visibleCard("held-4", "runner", "hardware"),
    ];
    input.playerView.opponent.deckCount = 20;
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe("run-rd");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:runner.pressure_central",
        "plan_step_capability:pressure_rd_information",
      ]),
    );
    const runAlternative = decision.decisionDebug?.actionAlternatives?.find(
      (entry) => entry.actionId === "run-rd",
    );
    const drawAlternative = decision.decisionDebug?.actionAlternatives?.find(
      (entry) => entry.actionId === "draw",
    );
    expect(runAlternative?.selected).toBe(true);
    expect(
      drawAlternative?.whyNot?.some((entry) =>
        entry.startsWith("not_selected_by_plan:"),
      ),
    ).toBe(true);
  });

  it("does not surface Doctrine v1 plan-weight trace items in DecisionDebug", () => {
    const rdRun = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0 },
      { payload: { serverId: "rd" } },
    );
    const input = aiInput("runner", [rdRun]);
    input.playerView.own.credits = 8;
    input.playerView.own.clicks = 2;
    input.playerView.own.gripOrHq = [
      visibleCard("held-1", "runner", "event"),
      visibleCard("held-2", "runner", "program"),
      visibleCard("held-3", "runner", "resource"),
      visibleCard("held-4", "runner", "hardware"),
    ];
    input.playerView.opponent.deckCount = 20;
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe("run-rd");
    expect(
      decision.decisionDebug?.detailSections?.some(
        (section) => section.id === "doctrine_goal",
      ),
    ).toBe(false);
    expect(JSON.stringify(decision.decisionDebug)).not.toContain(
      "doctrine_goal_weight",
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState/i,
    );
  });

  it("keeps the runtime choice unchanged when the basic setup pilot flag is unset", () => {
    delete process.env[AI_PLAY_STRENGTH_PILOT_ENV];
    const run = legalAction(
      "run-hq",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0 },
      { payload: { serverId: "hq" } },
    );
    const gain = legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
      credits: 0,
    });
    const input = aiInput("runner", [run, gain]);
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    const runtimeChoices = [
      semanticRuntimeChoice(run, 70, "runner.semantic.simple_run_choice"),
      semanticRuntimeChoice(gain, 120, "runner.semantic.basic_economy_draw"),
    ];

    const decision = chooseSemanticRuntimeAction(
      input,
      {},
      semanticRuntimeDependencies(runtimeChoices, {
        initiallySelectedActionId: run.actionId,
      }),
    );

    expect(decision.actionId).toBe("run-hq");
    expect(decision.reasonCode).toBe("runner.semantic.simple_run_choice");
    expect(decision.reason).toBe(decision.reasonCode);
    expect(decision.evidence).not.toEqual(
      expect.arrayContaining(["ai_play_strength_pilot:basic_setup"]),
    );
  });

  it("passes productive merged tactical goals into the default TacticalPlan context", () => {
    delete process.env[AI_PLAY_STRENGTH_PILOT_ENV];
    const observedGoals: string[] = [];
    const gain = legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
      credits: 0,
    });
    const draw = legalAction("draw", "runner", "draw_card", "Draw", {
      credits: 0,
    });
    const input = aiInput("runner", [gain, draw]) as AiDecisionInput & {
      ownDeckDoctrineV2Diagnostic?: ReturnType<
        typeof buildDeckDoctrineV2Diagnostic
      >;
      ownStrategicIntentState?: ReturnType<typeof buildStrategicIntentState>;
    };
    input.ownDeckDoctrineV2Diagnostic = buildDeckDoctrineV2Diagnostic({
      deckSnapshotId: "runtime-goal-merge-runner",
      side: "runner",
      cards: [
        { cardId: "onr_v1_081_custodial-position", quantity: 2 },
        { cardId: "onr_v1_085_executive-wiretaps", quantity: 2 },
      ],
    });
    input.ownStrategicIntentState = buildStrategicIntentState({
      side: "runner",
      stateVersion: input.playerView.stateVersion,
      targetVector: {
        kind: "central",
        targetId: "rd",
        evidence: ["test:runtime_goal_merge"],
      },
      availableCredits: input.playerView.own.credits,
      strategyProfile: {
        schemaVersion: "ai-deck-strategy-profile-v1",
        taskId: "AI006",
        deckId: "runtime-goal-merge-runner",
        side: "runner",
        cardCount: 4,
        primaryStrategies: ["runner.rnd_pressure"],
        secondaryStrategies: [],
        strategyScores: {
          "runner.rnd_pressure": {
            anchorScore: 80,
            supportScore: 80,
            finalScore: 80,
            confidence: "high",
            supportGaps: [],
            runtimeStatus: "productive",
            runtimeBlockers: [],
            anchorEvidence: [
              {
                cardId: "onr_v1_081_custodial-position",
                quantity: 2,
                source: "derivedStrategyAnchor",
                strategyId: "runner.rnd_pressure",
                reason: "test",
              },
            ],
            supportEvidence: [],
          },
        },
        functionSignalCounts: {},
        legacySignalCounts: {},
        warnings: [],
        source: {
          mode: "ai_internal_strategy_profile",
          strategyGoals: "data/ai/strategy-goals-v1.json",
          activeHints: "data/ai/ai-card-hints-active.json",
          plannerEffect: "strategic_intent_input",
        },
      },
    });
    const runtimeChoices = [
      semanticRuntimeChoice(gain, 120, "runner.semantic.basic_economy_draw"),
      semanticRuntimeChoice(draw, 80, "runner.semantic.basic_economy_draw"),
    ];

    chooseSemanticRuntimeAction(
      input,
      {},
      semanticRuntimeDependencies(runtimeChoices, {
        initiallySelectedActionId: gain.actionId,
        observedTacticalGoals: observedGoals,
      }),
    );

    expect(observedGoals).toEqual(
      expect.arrayContaining([
        "runner.build_economy_base",
        "runner.strategic.central_pressure",
        "runner.neutral.economy",
      ]),
    );
    expect(observedGoals.some((goalId) => goalId.includes(".doctrine."))).toBe(
      false,
    );
  });

  it("routes a bounded StrategicIntent target through the matching plan", () => {
    delete process.env[AI_PLAY_STRENGTH_PILOT_ENV];
    const rdRun = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0 },
      { payload: { serverId: "rd" } },
    );
    const draw = legalAction("draw", "runner", "draw_card", "Draw", {
      credits: 0,
    });
    const input = aiInput("runner", [rdRun, draw]) as AiDecisionInput & {
      ownStrategicIntentState?: ReturnType<typeof buildStrategicIntentState>;
    };
    input.playerView.own.credits = 6;
    input.playerView.own.gripOrHq = [
      visibleCard("strategic-grip-1", "runner", "event"),
      visibleCard("strategic-grip-2", "runner", "resource"),
      visibleCard("strategic-grip-3", "runner", "program"),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    input.ownStrategicIntentState = buildStrategicIntentState({
      side: "runner",
      stateVersion: input.playerView.stateVersion,
      targetVector: {
        kind: "central",
        targetId: "rd",
        evidence: ["test:strategic_action_fit"],
      },
      availableCredits: input.playerView.own.credits,
      strategyProfile: runtimeRunnerStrategyProfile(),
    });

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe("run-rd");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:runner.pressure_central",
        "plan_step_capability:pressure_rd_information",
      ]),
    );
    expect(decision.decisionDebug?.planId).toContain(
      "plan:runner.pressure_central:central%3Ard",
    );
    expect(decision.decisionDebug?.detailSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "plan_execution",
          items: expect.arrayContaining([
            "module:runner.pressure_central",
            "capability:pressure_rd_information",
            "assessment_evidence:target:rd",
          ]),
        }),
      ]),
    );
  });

  it("persists StrategicIntent memory by default and respects preview mode", () => {
    delete process.env[AI_PLAY_STRENGTH_PILOT_ENV];
    const gain = legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
      credits: 0,
    });
    const input = aiInput("runner", [gain]) as AiDecisionInput & {
      ownStrategicIntentState?: ReturnType<typeof buildStrategicIntentState>;
    };
    input.ownStrategicIntentState = buildStrategicIntentState({
      side: "runner",
      stateVersion: input.playerView.stateVersion,
      availableCredits: input.playerView.own.credits,
      strategyProfile: runtimeRunnerStrategyProfile(),
    });
    const runtimeChoices = [
      semanticRuntimeChoice(gain, 120, "runner.semantic.basic_economy_draw"),
    ];

    const preview = chooseSemanticRuntimeAction(
      input,
      { persistTacticalPlanMemory: false },
      semanticRuntimeDependencies(runtimeChoices, {
        initiallySelectedActionId: gain.actionId,
      }),
    );

    expect(getStrategicIntentMemorySnapshot(input)).toBeUndefined();
    expect(preview.evidence).toContain(
      "strategic_intent_memory_preview_only:true",
    );

    const persisted = chooseSemanticRuntimeAction(
      input,
      {},
      semanticRuntimeDependencies(runtimeChoices, {
        initiallySelectedActionId: gain.actionId,
      }),
    );

    expect(getStrategicIntentMemorySnapshot(input)).toMatchObject({
      side: "runner",
      primaryStrategyId: "runner.rnd_pressure",
    });
    expect(persisted.evidence).toEqual(
      expect.arrayContaining([
        "strategic_intent_memory:runner.rnd_pressure",
        "strategic_intent_memory_phase:enable",
      ]),
    );
  });

  it("uses semantic runtime as the live corp decision by default", () => {
    const agenda = visibleCard("score-target", "corp", "agenda", {
      definitionId: "onr_v1_194_corporate-downsizing",
      advancementCounters: 3,
    });
    const input = aiInput("corp", [
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
      legalAction(
        "score",
        "corp",
        "score_agenda",
        "Score agenda",
        {
          credits: 0,
        },
        {
          source: agenda.instanceId,
          payload: {
            serverId: "remote_1",
            cardId: agenda.instanceId,
          },
        },
      ),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [agenda]),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("score");
    expect(decision.reasonCode).toBe("plan_first.corp.score_agenda");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_first_runtime:true",
        "plan_module:corp.score_agenda",
        "plan_assessment_evidence:corp_same_turn_score_conversion:score_ready",
      ]),
    );
    expect(decision.fallbackUsed).toBe(false);
  });

  it("executes only the first step of a same-turn score conversion", () => {
    const agenda = visibleCard("executive-extraction", "corp", "agenda", {
      definitionId: "onr_v1_201_executive-extraction",
      advancementRequirement: 3,
    });
    const consultants = visibleCard(
      "project-consultants",
      "corp",
      "operation",
      {
        definitionId: "onr_v1_300_project-consultants",
        cost: 0,
      },
    );
    const laundering = visibleCard("information-laundering", "corp", "asset", {
      definitionId: "onr_v1_328_information-laundering",
      advancementCounters: 0,
    });
    const installAgenda = legalAction(
      "install-agenda",
      "corp",
      "install_card",
      "Agenda installieren",
      { credits: 0 },
      {
        source: agenda.instanceId,
        payload: {
          cardId: agenda.instanceId,
          placement: "root",
          serverId: "new_remote",
        },
      },
    );
    const playConsultants = legalAction(
      "play-project-consultants",
      "corp",
      "play_operation",
      "Project Consultants spielen",
      { credits: 0 },
      {
        source: consultants.instanceId,
        payload: {
          cardId: consultants.instanceId,
          scoreConversionCapability: "place_advancement",
          scoreConversionAdvancementAmount: 3,
          scoreConversionAdvancementMode: "any_combination",
        },
      },
    );
    const gainCredit = legalAction(
      "gain-credit",
      "corp",
      "gain_credit",
      "Gain 1",
      { credits: 0 },
    );
    const input = aiInput("corp", [playConsultants, installAgenda, gainCredit]);
    input.playerView.own.gripOrHq = [agenda, consultants];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [laundering]),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe(installAgenda.actionId);
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:corp.score_agenda",
        "plan_assessment_evidence:corp_same_turn_score_conversion:install_score_target",
      ]),
    );
    expect(decision.evidence).not.toContain(
      "plan_assessment_evidence:corp_same_turn_score_conversion:place_advancement",
    );
    expect(decision.fallbackUsed).toBe(false);
  });

  it("excludes an ICE-dependent upgrade until its target fort has ICE and develops liquidity instead", () => {
    const rasmin = visibleCard("rasmin-hand", "corp", "upgrade", {
      definitionId: "onr_proteus_070_rasmin-bridger",
      title: "Rasmin Bridger",
    });
    const install = legalAction(
      "install-rasmin-hq",
      "corp",
      "install_card",
      "Rasmin Bridger in HQ installieren",
      { credits: 0 },
      {
        source: rasmin.instanceId,
        payload: { placement: "root", serverId: "hq" },
      },
    );
    const input = aiInput("corp", [
      install,
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.gripOrHq = [rasmin];
    input.playerView.servers = [server("hq")];

    const decision = chooseCorpAction(input);

    expectCorpLiquidityDevelopment(decision);
    expectRejectedByPlan(decision, install.actionId);

    const protectedInput = aiInput("corp", [
      install,
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    protectedInput.playerView.own.gripOrHq = [rasmin];
    protectedInput.playerView.servers = [
      server("hq", [
        visibleCard("hq-ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["wall"],
        }),
      ]),
    ];

    expect(chooseCorpAction(protectedInput).actionId).toBe(install.actionId);
  });

  it("allows only a region replacement with active marginal utility", () => {
    const researchBunker = visibleCard(
      "research-bunker-hand",
      "corp",
      "upgrade",
      {
        definitionId: "onr_proteus_072_research-bunker",
        title: "Research Bunker",
        subtypes: ["region"],
      },
    );
    const install = legalAction(
      "install-research-bunker",
      "corp",
      "install_card",
      "Research Bunker in Remote 1 installieren",
      { credits: 0 },
      {
        source: researchBunker.instanceId,
        payload: {
          placement: "root",
          serverId: "remote_1",
          regionReplacementWarning: true,
        },
      },
    );
    const gainCredit = legalAction(
      "gain-credit",
      "corp",
      "gain_credit",
      "Gain 1",
      { credits: 0 },
    );
    const networkedCenter = visibleCard(
      "networked-center-installed",
      "corp",
      "upgrade",
      {
        definitionId: "onr_proteus_065_networked-center",
        title: "Networked Center",
        subtypes: ["region"],
        rezzed: true,
      },
    );
    const endTurn = legalAction(
      "end-turn",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0 },
      { source: "game_rule" },
    );
    const inactiveInput = aiInput("corp", [install, gainCredit, endTurn]);
    inactiveInput.playerView.own.gripOrHq = [researchBunker];
    inactiveInput.playerView.servers = [
      server("remote_1", [], [networkedCenter]),
    ];

    const inactiveDecision = chooseCorpAction(inactiveInput);
    expectCorpLiquidityDevelopment(inactiveDecision);
    expectRejectedByPlan(inactiveDecision, install.actionId);

    const activeInput = aiInput("corp", [install, gainCredit, endTurn]);
    activeInput.playerView.own.gripOrHq = [researchBunker];
    activeInput.playerView.servers = [
      server(
        "remote_1",
        [],
        [
          networkedCenter,
          visibleCard("research-agenda", "corp", "agenda", {
            definitionId: "onr_v1_189_artificial-security-directors",
            title: "Artificial Security Directors",
            subtypes: ["research"],
            advancementRequirement: 3,
          }),
        ],
      ),
    ];

    const activeDecision = chooseCorpAction(activeInput);
    expect(activeDecision.actionId).toBe(install.actionId);
    expect(JSON.stringify(activeDecision)).toContain(
      "region_replacement_adds_active_utility",
    );
  });

  it("maps structured Schlaghund tag-damage actions to the corp tag punish reason", () => {
    const schlaghund = legalAction(
      "corp.gain_credit.asset_damage",
      "corp",
      "gain_credit",
      "Schlaghund: Wuerfel gegen Tags werfen",
      { credits: 0 },
      {
        source: "schlaghund_1",
        payload: {
          cardId: "schlaghund_1",
          v1921AssetAbility: "schlaghund_tag_damage",
        },
      },
    );
    const input = aiInput("corp", [schlaghund]);
    input.playerView.servers = [
      server(
        "remote_1",
        [],
        [
          visibleCard("schlaghund_1", "corp", "asset", {
            definitionId: "onr_v1_339_schlaghund",
            title: "Schlaghund",
            rezzed: true,
          }),
        ],
      ),
    ];

    const decision = chooseSemanticRuntimeAction(
      input,
      {},
      semanticRuntimeDependencies(
        [
          semanticRuntimeChoice(
            schlaghund,
            160,
            "corp.semantic.generic_damage",
          ),
        ],
        { initiallySelectedActionId: schlaghund.actionId },
      ),
    );

    expect(decision.reasonCode).toBe("corp.semantic.corp_tag_punish");
  });

  it("does not map Schlaghund-like action ids without structured source evidence", () => {
    const labelOnly = legalAction(
      "corp.schlaghund_tag_damage.synthetic",
      "corp",
      "gain_credit",
      "Synthetic Schlaghund text",
      { credits: 0 },
    );
    const input = aiInput("corp", [labelOnly]);

    const decision = chooseSemanticRuntimeAction(
      input,
      {},
      semanticRuntimeDependencies(
        [semanticRuntimeChoice(labelOnly, 160, "corp.semantic.generic_damage")],
        { initiallySelectedActionId: labelOnly.actionId },
      ),
    );

    expect(decision.reasonCode).toBe("corp.semantic.generic_damage");
  });

  it("rejects unsupported central and empty-remote ICE routes before developing liquidity", () => {
    const input = aiInput("corp", [
      legalAction(
        "build-empty-new-remote",
        "corp",
        "install_card",
        "Install ICE protecting a new remote",
        { credits: 0 },
        {
          source: "ice-for-new-remote",
          payload: { placement: "ice", serverId: "new_remote" },
        },
      ),
      legalAction(
        "protect-rd",
        "corp",
        "install_card",
        "Install ICE protecting R&D",
        { credits: 0 },
        { source: "ice-for-rd", payload: { placement: "ice", serverId: "rd" } },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.gripOrHq = [
      visibleCard("ice-for-new-remote", "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        title: "Data Wall",
        rezCost: 1,
      }),
      visibleCard("ice-for-rd", "corp", "ice", {
        definitionId: "onr_v1_238_data-wall-2-0",
        title: "Data Wall 2.0",
        rezCost: 2,
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("remote-ice-1", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          title: "Data Wall",
        }),
      ]),
      server("remote_2", [
        visibleCard("remote-ice-2", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          title: "Data Wall",
        }),
      ]),
    ];

    const decision = chooseCorpAction(input);

    expectCorpLiquidityDevelopment(decision);
    expectRejectedByPlan(decision, "build-empty-new-remote");
    expectRejectedByPlan(decision, "protect-rd");
  });

  it("defers a new naked remote agenda install for a safe draw or economy action", () => {
    const input = aiInput("corp", [
      legalAction(
        "install-new-remote-agenda",
        "corp",
        "install_card",
        "Install agenda in a new remote",
        { clicks: 1, credits: 0 },
        {
          source: "agenda-in-hq",
          payload: { placement: "root", serverId: "new_remote" },
        },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "corp", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.own.gripOrHq = [
      visibleCard("agenda-in-hq", "corp", "agenda", {
        definitionId: "onr_v1_194_corporate-downsizing",
        title: "Corporate Downsizing",
        advancementRequirement: 3,
      }),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(["gain-credit", "draw"]).toContain(decision.actionId);
    expect(decision.actionId).not.toBe("install-new-remote-agenda");
    expect(debugText).toContain("plan:corp.score_agenda");
    expect(debugText).toContain("corp_score_protection_required:new_remote");
    expect(debugText).toContain("viability:blocked");
  });

  it("advances a naked remote score line when same-turn closeout is reachable", () => {
    const remoteAgenda = visibleCard("remote-agenda", "corp", "agenda", {
      definitionId: "onr_v1_194_corporate-downsizing",
      title: "Corporate Downsizing",
      advancementCounters: 1,
      advancementRequirement: 3,
    });
    const input = aiInput("corp", [
      legalAction(
        "advance-naked-agenda",
        "corp",
        "advance_card",
        "Advance installed agenda",
        { clicks: 1, credits: 1 },
        { source: remoteAgenda.instanceId, payload: { serverId: "remote_1" } },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
      legalAction("draw", "corp", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [remoteAgenda]),
    ];

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("advance-naked-agenda");
    expect(debugText).toContain("plan_module:corp.score_agenda");
    expect(debugText).toContain("plan_step_capability:advance_score_agenda");
    expect(debugText).toContain("plan_priority_class:P3");
  });

  it("keeps a protected remote score line selectable", () => {
    const remoteAgenda = visibleCard(
      "protected-remote-agenda",
      "corp",
      "agenda",
      {
        definitionId: "onr_v1_194_corporate-downsizing",
        title: "Corporate Downsizing",
        advancementCounters: 1,
        advancementRequirement: 3,
      },
    );
    const input = aiInput("corp", [
      legalAction(
        "advance-protected-agenda",
        "corp",
        "advance_card",
        "Advance installed agenda",
        { clicks: 1, credits: 1 },
        { source: remoteAgenda.instanceId, payload: { serverId: "remote_1" } },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("remote-protection-ice", "corp", "ice", {
            definitionId: "onr_v1_237_data-wall",
          }),
        ],
        [remoteAgenda],
      ),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("advance-protected-agenda");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:corp.score_agenda",
        "plan_step_capability:advance_score_agenda",
        "plan_assessment_evidence:corp_funded_protected_score_advance:remote_1",
      ]),
    );
  });

  it("fails closed when a conditional score-credit threshold is incompletely defined", () => {
    const corporateWarId = "onr_v1_196_corporate-war";
    const originalHint = AI_HINTS_BY_CARD.get(corporateWarId);
    if (!originalHint) throw new Error("Missing Corporate War AI definition");
    const agenda = visibleCard("conditional-score-agenda", "corp", "agenda", {
      definitionId: corporateWarId,
      title: "Corporate War",
      advancementRequirement: 3,
    });
    const input = aiInput("corp", [
      legalAction(
        "install-conditional-score-agenda",
        "corp",
        "install_card",
        "Install Corporate War",
        { clicks: 1, credits: 0 },
        {
          source: agenda.instanceId,
          payload: { placement: "root", serverId: "remote_1" },
        },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 20;
    input.playerView.own.gripOrHq = [agenda];
    input.playerView.opponent.credits = 0;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("conditional-score-wall-1", "corp", "ice", {
          definitionId: "onr_v1_279_wall-of-static",
          rezzed: true,
        }),
        visibleCard("conditional-score-wall-2", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          rezzed: true,
        }),
      ]),
    ];
    AI_HINTS_BY_CARD.set(corporateWarId, {
      ...structuredClone(originalHint),
      effects: [],
    });

    try {
      expect(() => chooseCorpAction(input)).toThrowError(
        expect.objectContaining<Partial<PlanResolutionFailure>>({
          code: "missing_card_definition",
        }),
      );
    } finally {
      AI_HINTS_BY_CARD.set(corporateWarId, originalHint);
    }
  });

  it("defers a protected but contestable remote agenda install", () => {
    const agenda = visibleCard("agenda-in-hq", "corp", "agenda", {
      definitionId: "onr_v1_194_corporate-downsizing",
      title: "Corporate Downsizing",
      advancementRequirement: 3,
    });
    const input = aiInput("corp", [
      legalAction(
        "install-contestable-agenda",
        "corp",
        "install_card",
        "Install agenda in protected remote",
        { clicks: 1, credits: 0 },
        {
          source: agenda.instanceId,
          payload: { placement: "root", serverId: "remote_1" },
        },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.gripOrHq = [agenda];
    input.playerView.opponent.credits = 8;
    input.playerView.opponent.rig = [
      visibleCard("onr_v1_021_dwarf", "runner", "program", {
        subtypes: ["Icebreaker", "Worm"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("onr_v1_279_wall-of-static", "corp", "ice", {
          rezzed: true,
        }),
      ]),
    ];

    const decision = chooseCorpAction(input);
    expectCorpLiquidityDevelopment(decision);
    expectRejectedByPlan(decision, "install-contestable-agenda");
    expect(
      decision.evidence?.some(
        (entry) =>
          entry.startsWith("plan_portfolio_blocked_evidence:") &&
          entry.endsWith(
            ":corp_score_protection_assessment_unknown:remote_1:subset_assessment_unknown",
          ),
      ) ?? false,
    ).toBe(true);
    expect(
      decision.evidence?.some(
        (entry) =>
          entry.startsWith("plan_portfolio_blocker:") &&
          entry.endsWith(":corp_score_route_unavailable"),
      ) ?? false,
    ).toBe(true);
  });

  it("keeps a persistently blocked agenda-flood plan fail-closed while developing exact liquidity", () => {
    const minimumAgenda = visibleCard(
      "stalled-flood-minimum-agenda",
      "corp",
      "agenda",
      {
        definitionId: "onr_v1_214_project-babylon",
        title: "Project Babylon",
        agendaPoints: 1,
        advancementRequirement: 3,
      },
    );
    const largerAgendaA = visibleCard(
      "stalled-flood-larger-agenda-a",
      "corp",
      "agenda",
      {
        definitionId: "onr_v1_199_employee-empowerment",
        title: "Employee Empowerment",
        agendaPoints: 3,
        advancementRequirement: 5,
      },
    );
    const largerAgendaB = visibleCard(
      "stalled-flood-larger-agenda-b",
      "corp",
      "agenda",
      {
        definitionId: "onr_v1_190_bioweapons-engineering",
        title: "Bioweapons Engineering",
        agendaPoints: 3,
        advancementRequirement: 5,
      },
    );
    const installAction = legalAction(
      "install-stalled-flood-minimum",
      "corp",
      "install_card",
      "Install the minimum-exposure agenda",
      { clicks: 1, credits: 0 },
      {
        source: minimumAgenda.instanceId,
        payload: { placement: "root", serverId: "remote_1" },
      },
    );
    const gainCredit = legalAction(
      "gain-credit",
      "corp",
      "gain_credit",
      "Gain 1",
      { credits: 0 },
    );
    const input = aiInput("corp", [
      installAction,
      gainCredit,
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.credits = 12;
    input.playerView.own.stackOrRdCount = 20;
    input.playerView.own.gripOrHq = [
      minimumAgenda,
      largerAgendaA,
      largerAgendaB,
    ];
    input.playerView.opponent.credits = 30;
    input.playerView.opponent.rig = [
      visibleCard("onr_v1_021_dwarf", "runner", "program", {
        subtypes: ["Icebreaker", "Worm"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("stalled-flood-wall-1", "corp", "ice", {
          definitionId: "onr_v1_279_wall-of-static",
          rezzed: true,
        }),
        visibleCard("stalled-flood-wall-2", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          rezzed: true,
        }),
      ]),
    ];

    input.playerView.stateVersion = 13;
    const decision = chooseCorpAction(input);
    expectCorpLiquidityDevelopment(decision);
    expectRejectedByPlan(decision, installAction.actionId);
    expect(decision.fallbackUsed).toBe(false);
  });

  it("keeps an unproven contestability buffer rejected while developing exact liquidity", () => {
    const agenda = visibleCard("agenda-in-hq", "corp", "agenda", {
      definitionId: "onr_v1_194_corporate-downsizing",
      title: "Corporate Downsizing",
      advancementRequirement: 3,
    });
    const ice = visibleCard("second-score-ice", "corp", "ice", {
      definitionId: "onr_v1_237_data-wall",
      title: "Data Wall",
      rezCost: 1,
    });
    const input = aiInput("corp", [
      legalAction(
        "install-contestable-agenda",
        "corp",
        "install_card",
        "Install agenda in protected remote",
        { clicks: 1, credits: 0 },
        {
          source: agenda.instanceId,
          payload: { placement: "root", serverId: "remote_1" },
        },
      ),
      legalAction(
        "install-contestability-buffer",
        "corp",
        "install_card",
        "Install another ICE protecting the score remote",
        { clicks: 1, credits: 0 },
        {
          source: ice.instanceId,
          payload: { placement: "ice", serverId: "remote_1" },
        },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.gripOrHq = [agenda, ice];
    input.playerView.opponent.credits = 8;
    input.playerView.opponent.rig = [
      visibleCard("onr_v1_021_dwarf", "runner", "program", {
        subtypes: ["Icebreaker", "Worm"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("remote-wall-1", "corp", "ice", {
          definitionId: "onr_v1_279_wall-of-static",
          rezzed: true,
        }),
      ]),
    ];

    const decision = chooseCorpAction(input);

    expectCorpLiquidityDevelopment(decision);
    expectRejectedByPlan(decision, "install-contestable-agenda");
    expectRejectedByPlan(decision, "install-contestability-buffer");
  });

  it("does not treat finite ICE depth as a safe terminal score window", () => {
    const agenda = visibleCard("terminal-agenda-in-hq", "corp", "agenda", {
      definitionId: "onr_v1_194_corporate-downsizing",
      title: "Corporate Downsizing",
      advancementRequirement: 3,
    });
    const ice = visibleCard("terminal-score-buffer", "corp", "ice", {
      definitionId: "onr_v1_223_banpei",
      title: "Banpei",
      rezCost: 4,
    });
    const input = aiInput("corp", [
      legalAction(
        "install-terminal-agenda",
        "corp",
        "install_card",
        "Install the terminal agenda in the score remote",
        { clicks: 1, credits: 0 },
        {
          source: agenda.instanceId,
          payload: { placement: "root", serverId: "remote_1" },
        },
      ),
      legalAction(
        "install-terminal-score-buffer",
        "corp",
        "install_card",
        "Install another ICE protecting the terminal score remote",
        { clicks: 1, credits: 0 },
        {
          source: ice.instanceId,
          payload: { placement: "ice", serverId: "remote_1" },
        },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.agendaPoints = 5;
    input.playerView.own.credits = 26;
    input.playerView.own.gripOrHq = [agenda, ice];
    input.playerView.opponent.credits = 20;
    input.playerView.opponent.rig = [
      visibleCard("onr_v1_021_dwarf", "runner", "program", {
        subtypes: ["Icebreaker", "Worm"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("terminal-wall-1", "corp", "ice", {
          definitionId: "onr_v1_279_wall-of-static",
          rezzed: true,
        }),
        visibleCard("terminal-wall-2", "corp", "ice", {
          definitionId: "onr_v1_279_wall-of-static",
          rezzed: true,
        }),
        visibleCard("terminal-wall-3", "corp", "ice", {
          definitionId: "onr_v1_279_wall-of-static",
          rezzed: true,
        }),
      ]),
    ];

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expectCorpLiquidityDevelopment(decision);
    expectRejectedByPlan(decision, "install-terminal-agenda");
    expectRejectedByPlan(decision, "install-terminal-score-buffer");
    expect(debugText).toContain(
      "corp_score_protection_assessment_unknown:remote_1:subset_assessment_unknown",
    );
    expect(debugText).toContain("viability:blocked");
  });

  it("does not expose one of two agendas merely because the remote has two ICE", () => {
    const agenda = visibleCard("agenda-in-hq", "corp", "agenda", {
      definitionId: "onr_v1_194_corporate-downsizing",
      title: "Corporate Downsizing",
      advancementRequirement: 3,
    });
    const secondAgenda = visibleCard("second-agenda-in-hq", "corp", "agenda", {
      definitionId: "onr_v1_203_hostile-takeover",
      title: "Hostile Takeover",
      advancementRequirement: 2,
    });
    const input = aiInput("corp", [
      legalAction(
        "install-portfolio-agenda",
        "corp",
        "install_card",
        "Install agenda in protected remote",
        { clicks: 1, credits: 0 },
        {
          source: agenda.instanceId,
          payload: { placement: "root", serverId: "remote_1" },
        },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.gripOrHq = [agenda, secondAgenda];
    input.playerView.own.credits = 8;
    input.playerView.opponent.credits = 8;
    input.playerView.opponent.rig = [
      visibleCard("onr_v1_021_dwarf", "runner", "program", {
        subtypes: ["Icebreaker", "Worm"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("remote-wall-1", "corp", "ice", {
          definitionId: "onr_v1_279_wall-of-static",
          rezzed: true,
        }),
        visibleCard("remote-wall-2", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          rezzed: true,
        }),
      ]),
    ];

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expectCorpLiquidityDevelopment(decision);
    expectRejectedByPlan(decision, "install-portfolio-agenda");
    expect(debugText).toContain(
      "corp_score_protection_assessment_unknown:remote_1:subset_assessment_unknown",
    );
    expect(debugText).toContain("viability:blocked");
  });

  it("does not expose a single agenda merely because the remote has two ICE", () => {
    const agenda = visibleCard("single-agenda-in-hq", "corp", "agenda", {
      definitionId: "onr_v1_194_corporate-downsizing",
      title: "Corporate Downsizing",
      advancementRequirement: 3,
    });
    const input = aiInput("corp", [
      legalAction(
        "install-single-protected-agenda",
        "corp",
        "install_card",
        "Install agenda in protected remote",
        { clicks: 1, credits: 0 },
        {
          source: agenda.instanceId,
          payload: { placement: "root", serverId: "remote_1" },
        },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.gripOrHq = [agenda];
    input.playerView.own.credits = 8;
    input.playerView.opponent.credits = 8;
    input.playerView.opponent.rig = [
      visibleCard("onr_v1_021_dwarf", "runner", "program", {
        subtypes: ["Icebreaker", "Worm"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("remote-wall-1", "corp", "ice", {
          definitionId: "onr_v1_279_wall-of-static",
          rezzed: true,
        }),
        visibleCard("remote-wall-2", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          rezzed: true,
        }),
      ]),
    ];

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expectCorpLiquidityDevelopment(decision);
    expectRejectedByPlan(decision, "install-single-protected-agenda");
    expect(debugText).toContain(
      "corp_score_protection_assessment_unknown:remote_1:subset_assessment_unknown",
    );
    expect(debugText).toContain("viability:blocked");
  });

  it("funds a concrete safe score project before exposing its agenda", () => {
    const agenda = visibleCard("funding-open-agenda", "corp", "agenda", {
      definitionId: "onr_v1_194_corporate-downsizing",
      title: "Corporate Downsizing",
      advancementRequirement: 3,
    });
    const input = aiInput("corp", [
      legalAction(
        "install-funding-open-agenda",
        "corp",
        "install_card",
        "Install agenda before later advancement funding",
        { clicks: 1, credits: 0 },
        {
          source: agenda.instanceId,
          payload: { placement: "root", serverId: "remote_1" },
        },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.gripOrHq = [agenda];
    input.playerView.own.credits = 2;
    input.playerView.opponent.credits = 0;
    input.playerView.opponent.rig = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("remote-wall-1", "corp", "ice", {
          definitionId: "onr_v1_279_wall-of-static",
          rezzed: true,
        }),
        visibleCard("remote-wall-2", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          rezzed: true,
        }),
      ]),
    ];

    const decision = chooseCorpAction(input);

    expectCorpLiquidityDevelopment(decision);
    expectRejectedByPlan(decision, "install-funding-open-agenda");
  });

  it("does not continue an installed score commitment while access remains contestable", () => {
    const remoteAgenda = visibleCard(
      "committed-remote-agenda",
      "corp",
      "agenda",
      {
        definitionId: "onr_v1_195_corporate-retreat",
        title: "Corporate Retreat",
        advancementCounters: 0,
        advancementRequirement: 4,
      },
    );
    const input = aiInput("corp", [
      legalAction(
        "advance-committed-agenda",
        "corp",
        "advance_card",
        "Advance installed agenda",
        { credits: 1 },
        {
          source: remoteAgenda.instanceId,
          payload: { serverId: "remote_1" },
        },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.credits = 8;
    input.playerView.opponent.credits = 8;
    input.playerView.opponent.rig = [
      visibleCard("onr_v1_021_dwarf", "runner", "program", {
        subtypes: ["Icebreaker", "Worm"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("remote-wall-1", "corp", "ice", {
            definitionId: "onr_v1_279_wall-of-static",
            rezzed: true,
          }),
          visibleCard("remote-wall-2", "corp", "ice", {
            definitionId: "onr_v1_237_data-wall",
            rezzed: true,
          }),
        ],
        [remoteAgenda],
      ),
    ];

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expectCorpLiquidityDevelopment(decision);
    expectRejectedByPlan(decision, "advance-committed-agenda");
    expect(debugText).toContain(
      "corp_score_protection_assessment_unknown:remote_1",
    );
    expect(debugText).toContain("plan_module:corp.economy");
  });

  it("does not expose a matchpoint agenda while the remote remains contestable", () => {
    const agenda = visibleCard("matchpoint-agenda", "corp", "agenda", {
      definitionId: "onr_v1_194_corporate-downsizing",
      title: "Corporate Downsizing",
      advancementRequirement: 3,
      agendaPoints: 2,
    });
    const input = aiInput("corp", [
      legalAction(
        "install-matchpoint-agenda",
        "corp",
        "install_card",
        "Install matchpoint agenda in protected remote",
        { clicks: 1, credits: 0 },
        {
          source: agenda.instanceId,
          payload: { placement: "root", serverId: "remote_1" },
        },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.agendaPoints = 6;
    input.playerView.own.credits = 8;
    input.playerView.own.gripOrHq = [agenda];
    input.playerView.opponent.credits = 8;
    input.playerView.opponent.rig = [
      visibleCard("onr_v1_021_dwarf", "runner", "program", {
        subtypes: ["Icebreaker", "Worm"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("remote-wall-1", "corp", "ice", {
          definitionId: "onr_v1_279_wall-of-static",
          rezzed: true,
        }),
        visibleCard("remote-wall-2", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          rezzed: true,
        }),
      ]),
    ];

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expectCorpLiquidityDevelopment(decision);
    expectRejectedByPlan(decision, "install-matchpoint-agenda");
    expect(debugText).toContain(
      "corp_score_protection_assessment_unknown:remote_1",
    );
    expect(debugText).toContain("plan_module:corp.economy");
  });

  it("advances a protected but contestable remote score line when same-turn closeout is reachable", () => {
    const remoteAgenda = visibleCard(
      "contestable-remote-agenda",
      "corp",
      "agenda",
      {
        definitionId: "onr_v1_194_corporate-downsizing",
        title: "Corporate Downsizing",
        advancementCounters: 1,
        advancementRequirement: 3,
      },
    );
    const input = aiInput("corp", [
      legalAction(
        "advance-contestable-agenda",
        "corp",
        "advance_card",
        "Advance installed agenda",
        { credits: 1 },
        { source: remoteAgenda.instanceId, payload: { serverId: "remote_1" } },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.opponent.credits = 8;
    input.playerView.opponent.rig = [
      visibleCard("onr_v1_021_dwarf", "runner", "program", {
        subtypes: ["Icebreaker", "Worm"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("onr_v1_279_wall-of-static", "corp", "ice", {
            rezzed: true,
          }),
        ],
        [remoteAgenda],
      ),
    ];

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("advance-contestable-agenda");
    expect(debugText).toContain("plan_module:corp.score_agenda");
    expect(debugText).toContain("plan_step_capability:advance_score_agenda");
    expect(debugText).toContain("plan_priority_class:P3");
  });

  it("does not create remote rez funding from an unquoted ICE cost", () => {
    const remoteAgenda = visibleCard(
      "remote-agenda-below-rez-floor",
      "corp",
      "agenda",
      {
        definitionId: "onr_v1_194_corporate-downsizing",
        title: "Corporate Downsizing",
        advancementCounters: 1,
        advancementRequirement: 3,
      },
    );
    const input = aiInput("corp", [
      legalAction(
        "advance-below-rez-floor",
        "corp",
        "advance_card",
        "Advance installed agenda",
        { credits: 1 },
        { source: remoteAgenda.instanceId, payload: { serverId: "remote_1" } },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "corp", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.own.credits = 1;
    input.playerView.own.gripOrHq = [
      visibleCard("corp-ice-in-hq", "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        title: "Data Wall",
        rezCost: 1,
      }),
    ];
    input.playerView.opponent.rig = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("remote-unrezzed-ice", "corp", "ice", {
            definitionId: "onr_v1_279_wall-of-static",
            title: "Wall of Static",
            rezzed: false,
            rezCost: 3,
          }),
        ],
        [remoteAgenda],
      ),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("draw");
    expect(JSON.stringify(decision.decisionDebug)).not.toContain(
      "corp_score_combined_rez_and_advancement_funding_required:remote_1",
    );
  });

  it("allows remote agenda advance when credits still cover the unrezzed ice rez floor", () => {
    const remoteAgenda = visibleCard(
      "remote-agenda-with-rez-floor",
      "corp",
      "agenda",
      {
        definitionId: "onr_v1_194_corporate-downsizing",
        title: "Corporate Downsizing",
        advancementCounters: 1,
        advancementRequirement: 3,
      },
    );
    const input = aiInput("corp", [
      legalAction(
        "advance-with-rez-floor",
        "corp",
        "advance_card",
        "Advance installed agenda",
        { clicks: 1, credits: 1 },
        { source: remoteAgenda.instanceId, payload: { serverId: "remote_1" } },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 5;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("remote-unrezzed-ice", "corp", "ice", {
            definitionId: "onr_v1_279_wall-of-static",
            title: "Wall of Static",
            rezzed: false,
            rezCost: 3,
          }),
        ],
        [remoteAgenda],
      ),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("advance-with-rez-floor");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:corp.score_agenda",
        "plan_step_capability:advance_score_agenda",
        "plan_assessment_evidence:corp_funded_protected_score_advance:remote_1",
      ]),
    );
  });

  it("does not invent an HQ rez reserve from an unquoted ICE cost", () => {
    const agenda = visibleCard("agenda-in-hq", "corp", "agenda", {
      definitionId: "onr_v1_194_corporate-downsizing",
      title: "Corporate Downsizing",
      advancementRequirement: 3,
    });
    const expensiveIce = visibleCard("expensive-hq-ice", "corp", "ice", {
      definitionId: "onr_v1_279_wall-of-static",
      title: "Wall of Static",
      rezCost: 4,
    });
    const input = aiInput("corp", [
      legalAction(
        "install-hq-ice-below-rez-floor",
        "corp",
        "install_card",
        "Install ICE protecting HQ",
        { credits: 0 },
        {
          source: expensiveIce.instanceId,
          payload: { placement: "ice", serverId: "hq" },
        },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.credits = 2;
    input.playerView.own.gripOrHq = [agenda, expensiveIce];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseCorpAction(input);
    expectCorpLiquidityDevelopment(decision);
    expectRejectedByPlan(decision, "install-hq-ice-below-rez-floor");
    expect(JSON.stringify(decision.decisionDebug)).not.toContain(
      "central_rez_floor_funding_required:hq",
    );
  });

  it("does not invent an R&D rez reserve from an unquoted ICE cost", () => {
    const rdIce = visibleCard("rd-unrezzed-ice", "corp", "ice", {
      definitionId: "onr_v1_279_wall-of-static",
      title: "Wall of Static",
      rezzed: false,
      rezCost: 3,
    });
    const input = aiInput("corp", [
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "corp", "draw_card", "Draw 1", {
        credits: 0,
      }),
    ]);
    const rdPressureEvents = [
      publicEvent("rd-run-pressure", "start_run", 10, {
        actor: "runner",
        actionType: "start_run",
        serverId: "rd",
      }),
      publicEvent("rd-access-pressure", "access_card", 11, {
        actor: "runner",
        actionType: "access_card",
        serverId: "rd",
      }),
    ];
    input.eventTail = rdPressureEvents;
    input.playerView.publicEvents = rdPressureEvents;
    input.playerView.own.credits = 2;
    input.playerView.own.stackOrRdCount = 20;
    input.playerView.servers = [
      server("hq"),
      server("rd", [rdIce]),
      server("archives"),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("draw");
    expect(JSON.stringify(decision.decisionDebug)).not.toContain(
      "central_rez_floor_funding_required:rd",
    );
  });

  it("draws terminal score material before non-urgent central rez funding", () => {
    const hqIce = visibleCard("hq-ice-in-hand", "corp", "ice", {
      definitionId: "onr_v1_227_cerberus",
      title: "Cerberus",
      rezCost: 11,
    });
    const input = aiInput("corp", [
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "corp", "draw_card", "Draw 1", {
        credits: 0,
      }),
      legalAction(
        "install-hq-ice",
        "corp",
        "install_card",
        "Install ICE on HQ",
        { credits: 0 },
        {
          source: hqIce.instanceId,
          payload: { placement: "ice", serverId: "hq" },
        },
      ),
    ]);
    const hqPressureEvents = [
      publicEvent("hq-run-pressure", "start_run", 10, {
        actor: "runner",
        actionType: "start_run",
        serverId: "hq",
      }),
      publicEvent("hq-access-pressure", "access_card", 11, {
        actor: "runner",
        actionType: "access_card",
        serverId: "hq",
      }),
    ];
    input.eventTail = hqPressureEvents;
    input.playerView.publicEvents = hqPressureEvents;
    input.playerView.own.credits = 3;
    input.playerView.own.agendaPoints = 4;
    input.playerView.own.stackOrRdCount = 2;
    input.playerView.own.gripOrHq = [hqIce];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("draw");
    expect(decision.reasonCode).toBe(
      "plan_first.corp.hand_and_agenda_management",
    );
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P3",
        "plan_assessment_evidence:corp_terminal_score_campaign_missing_agenda_material",
      ]),
    );
  });

  it("uses Closed Accounts before BBS economy in an open tag-payoff window", () => {
    const closedAccounts = visibleCard("closed-accounts", "corp", "operation", {
      definitionId: "onr_v1_285_closed-accounts",
      title: "Closed Accounts",
    });
    const bbs = visibleCard("bbs-root", "corp", "asset", {
      definitionId: "onr_v1_309_bbs-whispering-campaign",
      title: "BBS Whispering Campaign",
      counters: { bit: 4 },
    });
    const input = aiInput("corp", [
      legalAction(
        "closed-accounts",
        "corp",
        "play_operation",
        "Closed Accounts spielen",
        { credits: 1 },
        { source: closedAccounts.instanceId },
      ),
      legalAction(
        "bbs-take",
        "corp",
        "activated_card_ability",
        "BBS Whispering Campaign: 2 Credits nehmen",
        { credits: 0 },
        {
          source: bbs.instanceId,
          payload: {
            gainCreditsAmount: 2,
            cardImplementationTakesHostedCredits: true,
            hostedCreditTakeAmount: 2,
            hostedCreditTakeMode: "up_to_amount_if_available",
          },
        },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.gripOrHq = [closedAccounts];
    input.playerView.opponent.tags = 1;
    input.playerView.opponent.credits = 1;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [bbs]),
    ];

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);
    const bbsAlternative = decision.decisionDebug?.actionAlternatives?.find(
      (alternative) => alternative.actionId === "bbs-take",
    );

    expect(decision.actionId).toBe("closed-accounts");
    expect(debugText).toContain("plan_module:corp.execute_punish_sequence");
    expect(debugText).toContain("plan_step_capability:punish_damage");
    expect(debugText).toContain(
      "plan_assessment_evidence:tag_punish_ontology_damage:onr_v1_285_closed-accounts",
    );
    expect(
      bbsAlternative?.whyNot?.some((entry) =>
        entry.startsWith("not_selected_by_plan:"),
      ),
    ).toBe(true);
  });

  it("funds a visible tagged payoff when the payoff is one credit short", () => {
    const closedAccounts = visibleCard("closed-accounts", "corp", "operation", {
      definitionId: "onr_v1_285_closed-accounts",
      title: "Closed Accounts",
      cost: 1,
      playCost: { kind: "fixed", credits: 1 },
    });
    const input = aiInput("corp", [
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "corp", "draw_card", "Draw 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 0;
    input.playerView.own.gripOrHq = [closedAccounts];
    input.playerView.opponent.tags = 1;

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("gain-credit");
    expect(debugText).toContain(
      "plan_assessment_evidence:corp_tag_punish_payoff_funding:onr_v1_285_closed-accounts",
    );
    expect(debugText).toContain(
      "plan:corp.economy:tag-payoff%3Aonr_v1_285_closed-accounts",
    );
  });

  it("funds the explicit minimum of a visible variable-X tagged payoff", () => {
    const powerGrid = visibleCard("power-grid", "corp", "operation", {
      definitionId: "onr_v1_299_power-grid-overload",
      title: "Power Grid Overload",
      playCost: {
        kind: "variable_x",
        minimumX: 1,
        creditsPerX: 1,
        maximumX: { kind: "context" },
      },
    });
    const input = aiInput("corp", [
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "corp", "draw_card", "Draw 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 0;
    input.playerView.own.gripOrHq = [powerGrid];
    input.playerView.opponent.tags = 1;

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("gain-credit");
    expect(debugText).toContain(
      "plan_assessment_evidence:corp_tag_punish_payoff_funding:onr_v1_299_power-grid-overload",
    );
    expect(debugText).toContain(
      "plan:corp.economy:tag-payoff%3Aonr_v1_299_power-grid-overload",
    );
  });

  it("uses hardware trash payoff over basic credit while the Runner is tagged", () => {
    const powerGrid = visibleCard("power-grid", "corp", "operation", {
      definitionId: "onr_v1_299_power-grid-overload",
      title: "Power Grid Overload",
    });
    const rdInterface = visibleCard("rd-interface", "runner", "hardware", {
      definitionId: "onr_v1_139_r-and-d-interface",
      title: "R&D Interface",
      rulesText: "Access 1 additional card whenever you access R&D.",
    });
    const input = aiInput("corp", [
      legalAction(
        "power-grid",
        "corp",
        "play_operation",
        "Power Grid Overload: 1 Hardware trashen",
        { credits: 1 },
        { source: powerGrid.instanceId },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.gripOrHq = [powerGrid];
    input.playerView.opponent.tags = 1;
    input.playerView.opponent.rig = [rdInterface];

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("power-grid");
    expect(debugText).toContain("plan_module:corp.execute_punish_sequence");
    expect(debugText).toContain("plan_step_capability:punish_damage");
    expect(debugText).toContain(
      "plan_assessment_evidence:tag_punish_ontology_damage:onr_v1_299_power-grid-overload",
    );
  });

  it("does not plan a tag-source conversion when variable-X payoff minimum is unfunded", () => {
    const chanceObservation = visibleCard(
      "chance-observation",
      "corp",
      "operation",
      {
        definitionId: "onr_v1_284_chance-observation",
        title: "Chance Observation",
        playCost: { kind: "fixed", credits: 1 },
      },
    );
    const powerGrid = visibleCard("power-grid", "corp", "operation", {
      definitionId: "onr_v1_299_power-grid-overload",
      title: "Power Grid Overload",
      playCost: {
        kind: "variable_x",
        minimumX: 1,
        creditsPerX: 1,
        maximumX: { kind: "context" },
      },
    });
    const input = aiInput("corp", [
      legalAction(
        "chance-observation",
        "corp",
        "play_operation",
        "Chance Observation spielen",
        { clicks: 1, credits: 1 },
        { source: chanceObservation.instanceId },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "corp",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.credits = 1;
    input.playerView.own.gripOrHq = [chanceObservation, powerGrid];

    const decision = chooseCorpAction(input);

    expectCorpLiquidityDevelopment(decision);
    expectRejectedByPlan(decision, "chance-observation");
    expect(JSON.stringify(decision.decisionDebug)).not.toContain(
      "plan_module:corp.execute_punish_sequence",
    );
  });

  it("trashes a visible Runner credit-bank resource before basic credit while tagged", () => {
    const broker = visibleCard("broker", "runner", "resource", {
      definitionId: "onr_v1_154_broker",
      title: "Broker",
      counters: { bit: 6 },
      rulesText: "Take all the bits from Broker.",
    });
    const input = aiInput("corp", [
      legalAction(
        "trash-broker",
        "corp",
        "trash_resource",
        "Broker trashen",
        { credits: 2 },
        { payload: { targetCardId: broker.instanceId } },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.opponent.tags = 1;
    input.playerView.opponent.rig = [broker];

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("trash-broker");
    expect(debugText).toContain("plan_module:corp.execute_punish_sequence");
    expect(debugText).toContain(
      "plan_assessment_evidence:corp_tagged_runner_visible_credit_bank_trash",
    );
  });
});

function expectCorpLiquidityDevelopment(
  decision: ReturnType<typeof chooseCorpAction>,
  actionId = "gain-credit",
): void {
  expect(decision.actionId).toBe(actionId);
  expect(decision.reasonCode).toBe("plan_first.corp.economy");
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.evidence).toEqual(
    expect.arrayContaining([
      "plan_priority_class:P6",
      "plan_module:corp.economy",
      "plan_step_capability:develop_or_convert_corp_economy",
      "plan_assessment_evidence:corp_engine_certified_basic_liquidity_development",
    ]),
  );
}

function expectRejectedByPlan(
  decision: ReturnType<typeof chooseCorpAction>,
  actionId: string,
): void {
  const alternative = decision.decisionDebug?.actionAlternatives?.find(
    (entry) => entry.actionId === actionId,
  );
  expect(alternative?.selected).toBe(false);
  expect(
    alternative?.whyNot?.some((entry) =>
      entry.startsWith("not_selected_by_plan:"),
    ),
  ).toBe(true);
}
