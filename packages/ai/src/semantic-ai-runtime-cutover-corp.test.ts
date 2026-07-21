import { afterEach, describe, expect, it } from "vitest";
import { chooseCorpAction, chooseRunnerAction } from "./index";
import { buildDeckDoctrineV2Diagnostic } from "./deck-doctrine-strategy";
import { buildStrategicIntentState } from "./strategic-intent-state";
import {
  AI_PLAY_STRENGTH_PILOT_ENV,
  AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV,
} from "./decision/pilot-scope-registry";
import { resetTacticalPlanMemory } from "./tactical-plans";
import { getStrategicIntentMemorySnapshot } from "./strategic-intent-memory";
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

  it("uses semantic runtime as the live runner decision by default", () => {
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
    expect(decision.reasonCode).toBe("runner.semantic.tag_removal");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "semantic_runtime_default:true",
        "semantic_runtime_scope:tag_removal",
      ]),
    );
    expect(decision.fallbackUsed).toBe(false);
  });

  it("marks an alternative-free Corp end turn as forced without hiding its raw decision", () => {
    const input = aiInput("corp", [
      legalAction("end-turn", "corp", "end_turn", "End turn", {
        credits: 0,
      }),
    ]);
    input.playerView.own.clicks = 0;

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("end-turn");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "decision_opportunity:forced_terminal",
        "decision_legal_action_count:1",
        "decision_actionable_alternative_count:0",
      ]),
    );
    expect(decision.decisionDebug?.scoreBreakdown).toBeDefined();
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
      }),
      visibleCard("scorched-earth", "corp", "operation", {
        definitionId: "onr_v1_302_scorched-earth",
        title: "Scorched Earth",
        cost: 3,
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
    expect(decision.evidence).toContain("decision_opportunity:competitive");
  });

  it("routes activated tag cleanup cards through tag_removal", () => {
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
    expect(decision.reasonCode).toBe("runner.semantic.tag_removal");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "semantic_runtime_scope:tag_removal",
        "action_semantic_candidate:tag.remove",
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
    expect(decision.evidence).toContain(
      "semantic_runtime_scope:basic_economy_draw",
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
        "semantic_runtime_default:true",
        "action_type:start_run",
      ]),
    );
    const runAlternative = decision.decisionDebug?.rankedAlternatives?.find(
      (entry) => entry.selectedActionType === "start_run",
    );
    const drawAlternative = decision.decisionDebug?.rankedAlternatives?.find(
      (entry) => entry.selectedActionType === "draw_card",
    );
    expect(runAlternative?.score ?? 0).toBeGreaterThan(
      drawAlternative?.score ?? 0,
    );
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

  it("adds bounded StrategicIntent action fit to semantic runtime scoring", () => {
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
        "semantic_strategic_action_fit:true",
        "strategic_action_fit_family:runner_central_pressure",
      ]),
    );
    expect(decision.decisionDebug?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "semantic_strategic_action_fit",
          reason: expect.stringContaining(
            "strategic_action_fit_family:runner_central_pressure",
          ),
        }),
      ]),
    );
    expect(decision.decisionDebug?.detailSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "strategic_runtime",
          items: expect.arrayContaining([
            "strategic_intent_state:runner.rnd_pressure",
            "strategic_intent_target_id:rd",
            "strategic_action_fit_target_match:exact",
          ]),
        }),
        expect.objectContaining({
          id: "selection_score",
          items: expect.arrayContaining([
            expect.stringMatching(/^runtime_raw_score:/),
            "display_score_only:true",
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
    const input = aiInput("corp", [
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("score", "corp", "score_agenda", "Score agenda", {
        credits: 0,
      }),
    ]);

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("score");
    expect(decision.reasonCode).toBe("corp.semantic.simple_score_advance");
    expect(decision.evidence).toContain("semantic_runtime_default:true");
    expect(decision.fallbackUsed).toBe(false);
  });

  it("excludes an ICE-dependent upgrade until its target fort has ICE", () => {
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
    ]);
    input.playerView.own.gripOrHq = [rasmin];
    input.playerView.servers = [server("hq")];

    const decision = chooseCorpAction(input);
    const alternative = decision.decisionDebug?.actionAlternatives?.find(
      (entry) => entry.actionId === install.actionId,
    );

    expect(decision.actionId).toBe("gain-credit");
    expect(JSON.stringify(alternative)).toContain(
      "corp_upgrade_ice_support_without_ice",
    );

    const protectedInput = aiInput("corp", [
      install,
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
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
    const inactiveInput = aiInput("corp", [install, gainCredit]);
    inactiveInput.playerView.own.gripOrHq = [researchBunker];
    inactiveInput.playerView.servers = [
      server("remote_1", [], [networkedCenter]),
    ];

    const inactiveDecision = chooseCorpAction(inactiveInput);
    expect(inactiveDecision.actionId).toBe(gainCredit.actionId);
    expect(
      JSON.stringify(
        inactiveDecision.decisionDebug?.actionAlternatives?.find(
          (entry) => entry.actionId === install.actionId,
        ),
      ),
    ).toContain("region_replacement_without_marginal_value");

    const activeInput = aiInput("corp", [install, gainCredit]);
    activeInput.playerView.own.gripOrHq = [researchBunker];
    activeInput.playerView.servers = [
      server(
        "remote_1",
        [],
        [
          networkedCenter,
          visibleCard("research-agenda", "corp", "agenda", {
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

  it("prefers central ICE protection over another empty remote shell", () => {
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
      legalAction("draw", "corp", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.own.gripOrHq = [
      visibleCard("ice-for-new-remote", "corp", "ice"),
      visibleCard("ice-for-rd", "corp", "ice"),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [visibleCard("remote-ice-1", "corp", "ice")]),
      server("remote_2", [visibleCard("remote-ice-2", "corp", "ice")]),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("protect-rd");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "corp_empty_remote_count:2",
        "corp_remote_risk:present",
        "corp_protection:central_ice",
      ]),
    );
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
        advancementRequirement: 3,
      }),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(["gain-credit", "draw"]).toContain(decision.actionId);
    expect(decision.actionId).not.toBe("install-new-remote-agenda");
    expect(debugText).toContain("corp_unsafe_delayed_scoreline_exposure");
    expect(debugText).toContain("corp_contestable_remote_score_penalty");
  });

  it("advances a naked remote score line when same-turn closeout is reachable", () => {
    const remoteAgenda = visibleCard("remote-agenda", "corp", "agenda", {
      advancementCounters: 1,
      advancementRequirement: 3,
    });
    const input = aiInput("corp", [
      legalAction(
        "advance-naked-agenda",
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
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [remoteAgenda]),
    ];

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("advance-naked-agenda");
    expect(debugText).toContain("corp_same_turn_score_closeout_advance");
    expect(debugText).toContain("corp_board_triage_primary:score_now");
  });

  it("keeps a protected remote score line selectable", () => {
    const remoteAgenda = visibleCard(
      "protected-remote-agenda",
      "corp",
      "agenda",
      {
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
        { credits: 1 },
        { source: remoteAgenda.instanceId, payload: { serverId: "remote_1" } },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [visibleCard("remote-protection-ice", "corp", "ice")],
        [remoteAgenda],
      ),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("advance-protected-agenda");
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["corp_remote_protection:protected"]),
    );
  });

  it("defers a protected but contestable remote agenda install", () => {
    const agenda = visibleCard("agenda-in-hq", "corp", "agenda", {
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
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "corp_remote_risk:unsafe_score_action_available",
        "corp_safe_alternative:economy",
      ]),
    );
    expect(debugText).toContain("corp_contestable_remote_score_penalty");
    expect(debugText).toContain("corp_remote_score_line:contestable_by_runner");
    expect(debugText).toContain("remote_contestable_by_runner:true");
  });

  it("advances a protected but contestable remote score line when same-turn closeout is reachable", () => {
    const remoteAgenda = visibleCard(
      "contestable-remote-agenda",
      "corp",
      "agenda",
      {
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
    expect(debugText).toContain("corp_same_turn_score_closeout_advance");
    expect(debugText).toContain("corp_board_triage_primary:score_now");
    expect(debugText).toContain("remote_contestable_by_runner:true");
  });

  it("funds remote rez floor before advancing a remote agenda behind unrezzed ice", () => {
    const remoteAgenda = visibleCard(
      "remote-agenda-below-rez-floor",
      "corp",
      "agenda",
      {
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
      visibleCard("corp-ice-in-hq", "corp", "ice"),
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
            rezzed: false,
            rezCost: 3,
          }),
        ],
        [remoteAgenda],
      ),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "remote_rez_floor_funding_need:true",
        "corp_safe_alternative:economy",
      ]),
    );
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "corp_remote_rez_floor_penalty",
    );
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "agenda_development_risk:below_remote_rez_floor",
    );
  });

  it("allows remote agenda advance when credits still cover the unrezzed ice rez floor", () => {
    const remoteAgenda = visibleCard(
      "remote-agenda-with-rez-floor",
      "corp",
      "agenda",
      {
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
        { credits: 1 },
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
        "remote_rez_floor:3",
        "credits_after_action:4",
        "low_rez_reserve:false",
      ]),
    );
  });

  it("funds HQ rez reserve before installing unrezzable HQ ICE over agenda exposure", () => {
    const agenda = visibleCard("agenda-in-hq", "corp", "agenda", {
      advancementRequirement: 3,
    });
    const expensiveIce = visibleCard("expensive-hq-ice", "corp", "ice", {
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
    ]);
    input.playerView.own.credits = 2;
    input.playerView.own.gripOrHq = [agenda, expensiveIce];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "central_rez_floor_funding_need:true",
        "corp_safe_alternative:economy",
      ]),
    );
    expect(debugText).toContain("corp_central_rez_floor_penalty");
    expect(debugText).toContain("corp_hq_agenda_exposure:true");
    expect(debugText).toContain("central_rez_reserve_below_floor:true");
  });

  it("funds R&D rez reserve when visible R&D pressure meets unrezzed ICE", () => {
    const rdIce = visibleCard("rd-unrezzed-ice", "corp", "ice", {
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
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "central_rez_floor_funding_need:true",
        "corp_safe_alternative:economy",
      ]),
    );
    expect(debugText).toContain("economy_credit_demand");
    expect(debugText).toContain("corp.rez_defense:rd:fund");
    expect(debugText).toContain("status=covered_guaranteed");
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
          payload: { cardImplementationCreditAmount: 2 },
        },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
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
    expect(debugText).toContain("corp_tagged_runner_payoff_pressure");
    expect(debugText).toContain("tagged_payoff_kind:economic");
    expect(debugText).toContain("corp_tagged_payoff_followup_plan:active");
    expect(
      bbsAlternative?.scoreBreakdown?.some(
        (component) =>
          component.key === "corp_tagged_payoff_window_passive_penalty",
      ),
    ).toBe(true);
  });

  it("funds a visible tagged payoff when the payoff is one credit short", () => {
    const closedAccounts = visibleCard("closed-accounts", "corp", "operation", {
      definitionId: "onr_v1_285_closed-accounts",
      title: "Closed Accounts",
      cost: 1,
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
    expect(debugText).toContain("corp_tag_punish_payoff_funding");
    expect(debugText).toContain("corp_tagged_payoff_targeted_funding:true");
    expect(debugText).toContain("target_definition:onr_v1_285_closed-accounts");
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
    expect(debugText).toContain("corp_tagged_runner_payoff_pressure");
    expect(debugText).toContain("tagged_payoff_kind:hardware_trash");
    expect(debugText).toContain("runner_hardware_payoff:multiaccess");
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
    expect(debugText).toContain("corp_tagged_runner_payoff_pressure");
    expect(debugText).toContain("tagged_payoff_kind:resource_trash");
    expect(debugText).toContain("runner_resource_credit_bank_visible:true");
  });
});
