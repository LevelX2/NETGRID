import { afterEach, describe, expect, it } from "vitest";

import { chooseCorpAction, chooseRunnerAction } from "./index";
import * as aiPublicApi from "./index";
import { buildActionSemanticCandidates } from "./action-semantic-candidate";
import { buildSemanticDecisionFrame } from "./decision/semantic-decision-frame";
import { buildSemanticShadowDecision } from "./decision/semantic-shadow-decision";
import { buildDeckDoctrineV2Diagnostic } from "./deck-doctrine-strategy";
import { buildRealEngineDecisionCorpusScenarios } from "./evaluation/real-engine-decision-corpus-fixtures";
import { buildRealEngineDecisionCorpus } from "./evaluation/real-engine-decision-corpus";
import {
  AI_PLAY_STRENGTH_PILOT_ENV,
  AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV,
  BASIC_SETUP_PILOT_MODE,
  CORP_SCORE_WINDOW_PILOT_MODE,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
} from "./decision/pilot-scope-registry";
import {
  getTacticalPlanMemorySnapshot,
  resetTacticalPlanMemory,
} from "./tactical-plans";
import {
  chooseSemanticRuntimeAction,
  type SemanticRuntimeDependencies,
} from "./runtime/semantic-runtime";
import type { SemanticRuntimeChoice } from "./runtime/semantic-runtime-types";
import type {
  AiDecision,
  AiDecisionInput,
  AiDifficulty,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  Side,
  VisibleCard,
} from "@netgrid/shared";

describe("Semantic AI runtime cutover", () => {
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
    expect(decision.evidence).toContain("semantic_runtime_scope:basic_economy_draw");
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

  it("surfaces side-safe doctrine goal trace items in DecisionDebug", () => {
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
    input.ownDeckDoctrine = runnerDoctrine({ pressure_rnd: 24 });

    const decision = chooseRunnerAction(input, { persistTacticalPlanMemory: false });

    expect(decision.actionId).toBe("run-rd");
    expect(decision.decisionDebug?.detailSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "doctrine_goal",
          title: "Doctrine Goal",
          items: expect.arrayContaining([
            "doctrine_goal_trace:decision_debug",
            "doctrine_goal_plan:pressure_rnd",
            "doctrine_goal_consumer:runner_pressure_rnd",
            "doctrine_goal_weight:120",
          ]),
        }),
      ]),
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
      legacyDecision("run-hq", "legacy.runner.run"),
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

  it("uses the explicit local basic setup default when the pilot flag is unset", () => {
    delete process.env[AI_PLAY_STRENGTH_PILOT_ENV];
    process.env[AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV] = BASIC_SETUP_PILOT_MODE;
    const rememberedActions: string[] = [];
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
      legacyDecision("run-hq", "legacy.runner.run"),
      {},
      semanticRuntimeDependencies(runtimeChoices, {
        initiallySelectedActionId: run.actionId,
        rememberedActions,
      }),
    );

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.reasonCode).toBe("ai_play_strength.basic_setup_pilot");
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["ai_play_strength_pilot:basic_setup"]),
    );
    expect(rememberedActions).toEqual(["gain-credit"]);
  });

  it("keeps reason aligned with reasonCode when the basic setup pilot overrides the runtime choice", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = BASIC_SETUP_PILOT_MODE;
    const rememberedActions: string[] = [];
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
      legacyDecision("run-hq", "legacy.runner.run"),
      {},
      semanticRuntimeDependencies(runtimeChoices, {
        initiallySelectedActionId: run.actionId,
        rememberedActions,
      }),
    );
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.reasonCode).toBe("ai_play_strength.basic_setup_pilot");
    expect(decision.reason).toBe(decision.reasonCode);
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["ai_play_strength_pilot:basic_setup"]),
    );
    expect(rememberedActions).toEqual(["gain-credit"]);
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState/i,
    );
  });

  it("does not let a forbidden run top action override through the basic setup pilot", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = BASIC_SETUP_PILOT_MODE;
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
      semanticRuntimeChoice(run, 160, "runner.semantic.simple_run_choice"),
      semanticRuntimeChoice(gain, 70, "runner.semantic.basic_economy_draw"),
    ];

    const decision = chooseSemanticRuntimeAction(
      input,
      legacyDecision("run-hq", "legacy.runner.run"),
      {},
      semanticRuntimeDependencies(runtimeChoices, {
        initiallySelectedActionId: gain.actionId,
        goal: {
          goalId: "runner.pressure_good_central_target",
          family: "pressure",
          priority: 980,
          urgency: "high",
          source: "run_target_evaluation",
          evidence: ["test_goal:run_access"],
        },
      }),
    );

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.reasonCode).toBe("runner.semantic.basic_economy_draw");
    expect(decision.reason).toBe(decision.reasonCode);
    expect(decision.evidence).not.toEqual(
      expect.arrayContaining(["ai_play_strength_pilot:basic_setup"]),
    );
  });

  it("allows a safe central run through the local runner safe-access pilot", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = RUNNER_SAFE_ACCESS_PILOT_MODE;
    const rememberedActions: string[] = [];
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
      semanticRuntimeChoice(run, 160, "runner.semantic.simple_run_choice"),
      semanticRuntimeChoice(gain, 70, "runner.semantic.basic_economy_draw"),
    ];

    const decision = chooseSemanticRuntimeAction(
      input,
      legacyDecision("gain-credit", "legacy.runner.economy"),
      {},
      semanticRuntimeDependencies(runtimeChoices, {
        initiallySelectedActionId: gain.actionId,
        rememberedActions,
        runTargets: [safeRuntimeRunTarget(run.actionId, "hq")],
        goal: {
          goalId: "runner.pressure_good_central_target",
          family: "pressure",
          priority: 980,
          urgency: "high",
          source: "run_target_evaluation",
          evidence: ["test_goal:run_access"],
        },
      }),
    );

    expect(decision.actionId).toBe("run-hq");
    expect(decision.reasonCode).toBe(
      "ai_play_strength.runner_safe_access_pilot",
    );
    expect(decision.reason).toBe(decision.reasonCode);
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["ai_play_strength_pilot:runner_safe_access"]),
    );
    expect(rememberedActions).toEqual(["run-hq"]);
  });

  it("falls through blocked local pilot scopes in the runtime env", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] =
      `${BASIC_SETUP_PILOT_MODE},${RUNNER_SAFE_ACCESS_PILOT_MODE}`;
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
      semanticRuntimeChoice(run, 160, "runner.semantic.simple_run_choice"),
      semanticRuntimeChoice(gain, 70, "runner.semantic.basic_economy_draw"),
    ];

    const decision = chooseSemanticRuntimeAction(
      input,
      legacyDecision("gain-credit", "legacy.runner.economy"),
      {},
      semanticRuntimeDependencies(runtimeChoices, {
        initiallySelectedActionId: gain.actionId,
        runTargets: [safeRuntimeRunTarget(run.actionId, "hq")],
        goal: {
          goalId: "runner.pressure_good_central_target",
          family: "pressure",
          priority: 980,
          urgency: "high",
          source: "run_target_evaluation",
          evidence: ["test_goal:run_access"],
        },
      }),
    );

    expect(decision.actionId).toBe("run-hq");
    expect(decision.reasonCode).toBe(
      "ai_play_strength.runner_safe_access_pilot",
    );
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["ai_play_strength_pilot:runner_safe_access"]),
    );
  });

  it("lets the explicit pilot env override a local basic setup default", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = RUNNER_SAFE_ACCESS_PILOT_MODE;
    process.env[AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV] = BASIC_SETUP_PILOT_MODE;
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
      semanticRuntimeChoice(run, 160, "runner.semantic.simple_run_choice"),
      semanticRuntimeChoice(gain, 70, "runner.semantic.basic_economy_draw"),
    ];

    const decision = chooseSemanticRuntimeAction(
      input,
      legacyDecision("gain-credit", "legacy.runner.economy"),
      {},
      semanticRuntimeDependencies(runtimeChoices, {
        initiallySelectedActionId: gain.actionId,
        runTargets: [safeRuntimeRunTarget(run.actionId, "hq")],
        goal: {
          goalId: "runner.pressure_good_central_target",
          family: "pressure",
          priority: 980,
          urgency: "high",
          source: "run_target_evaluation",
          evidence: ["test_goal:run_access"],
        },
      }),
    );

    expect(decision.actionId).toBe("run-hq");
    expect(decision.reasonCode).toBe(
      "ai_play_strength.runner_safe_access_pilot",
    );
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["ai_play_strength_pilot:runner_safe_access"]),
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

  it("allows a legal score_agenda through the local corp score-window pilot", () => {
    process.env[AI_PLAY_STRENGTH_PILOT_ENV] = CORP_SCORE_WINDOW_PILOT_MODE;
    const score = legalAction("score", "corp", "score_agenda", "Score agenda", {
      credits: 0,
    });
    const gain = legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
      credits: 0,
    });
    const input = aiInput("corp", [score, gain]);
    const runtimeChoices = [
      semanticRuntimeChoice(score, 160, "corp.semantic.simple_score_advance"),
      semanticRuntimeChoice(gain, 70, "corp.semantic.basic_economy_draw"),
    ];

    const decision = chooseSemanticRuntimeAction(
      input,
      legacyDecision("gain-credit", "legacy.corp.economy"),
      {},
      semanticRuntimeDependencies(runtimeChoices, {
        initiallySelectedActionId: gain.actionId,
      }),
    );

    expect(decision.actionId).toBe("score");
    expect(decision.reasonCode).toBe(
      "ai_play_strength.corp_score_window_pilot",
    );
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["ai_play_strength_pilot:corp_score_window"]),
    );
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

  it("defers a new naked remote agenda install when safe alternatives are legal", () => {
    const input = aiInput("corp", [
      legalAction(
        "install-new-remote-agenda",
        "corp",
        "install_card",
        "Install agenda in a new remote",
        { credits: 0 },
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

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "corp_remote_risk:unsafe_score_action_available",
        "corp_safe_alternative:economy",
      ]),
    );
  });

  it("does not advance a naked remote score line when safe alternatives are legal", () => {
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

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "corp_remote_risk:naked_score_line_present",
        "corp_safe_alternative:economy",
      ]),
    );
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

  it("funds remote rez floor before advancing a remote agenda behind unrezzed ice", () => {
    const remoteAgenda = visibleCard("remote-agenda-below-rez-floor", "corp", "agenda", {
      advancementCounters: 1,
      advancementRequirement: 3,
    });
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
    input.playerView.own.gripOrHq = [visibleCard("corp-ice-in-hq", "corp", "ice")];
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
    const remoteAgenda = visibleCard("remote-agenda-with-rez-floor", "corp", "agenda", {
      advancementCounters: 1,
      advancementRequirement: 3,
    });
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

  it("uses a breaker coverage plan step before a blocked remote contest", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.rig = [];
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
        [visibleCard("simple_agenda", "corp", "agenda")],
      ),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("draw");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_type:runner.obtain_breaker_coverage",
        "tactical_step:draw_for_answer",
      ]),
    );
    expect(decision.decisionDebug?.planKind).toBe(
      "runner.obtain_breaker_coverage",
    );
    expect(decision.decisionDebug?.detailSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "tactical_plan",
          items: expect.arrayContaining([
            "blocked_plan_count:1",
            "selected_step_kind:draw_for_answer",
            "selected_step_mapping:matched",
          ]),
        }),
      ]),
    );
  });

  it("builds credits when a matching blocked-server breaker is already in hand", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 1;
    input.playerView.own.rig = [];
    input.playerView.own.gripOrHq = [
      visibleCard("expensive-fracter", "runner", "program", {
        installCost: 6,
        subtypes: ["Fracter"],
        rulesText: "1 credit: Break 1 barrier subroutine.",
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
        [visibleCard("simple_agenda", "corp", "agenda")],
      ),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_type:runner.obtain_breaker_coverage",
        "tactical_step:gain_credits",
      ]),
    );
    expect(decision.decisionDebug?.detailSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "tactical_plan",
          items: expect.arrayContaining(["selected_step_kind:gain_credits"]),
        }),
      ]),
    );
  });

  it("does not spend the Runner's last credit on a pump that still cannot break the encountered ICE", () => {
    const dwarf: VisibleCard = {
      instanceId: "runner-dwarf",
      definitionId: "onr_v1_021_dwarf",
      title: "Dwarf",
      owner: "runner",
      controller: "runner",
      type: "program",
      subtypes: ["icebreaker", "fracter"],
      known: true,
      strength: 3,
    };
    const crystalWall: VisibleCard = {
      instanceId: "corp-crystal-wall",
      definitionId: "onr_v1_232_crystal-wall",
      title: "Crystal Wall",
      owner: "corp",
      controller: "corp",
      type: "ice",
      subtypes: ["wall"],
      known: true,
      rezzed: true,
      strength: 4,
      strengthModifier: 1,
    };
    const pump = legalAction(
      "pump-dwarf",
      "runner",
      "pump_breaker",
      "Dwarf: Stärke +1",
      { credits: 1 },
      { source: dwarf.instanceId, visibility: "private_to_actor" },
    );
    const continueIntoEtr = legalAction(
      "continue-etr",
      "runner",
      "continue_run",
      "Subroutinen auslösen (Run endet)",
      { credits: 0 },
      {
        visibility: "private_to_actor",
        payload: {
          encounterContinue: true,
          unbrokenSubroutineCount: 1,
          encounterWillEndRun: true,
          sourceDefinitionId: "onr_v1_232_crystal-wall",
        },
      },
    );
    pump.timingPoint = "run.encounter_ice";
    continueIntoEtr.timingPoint = "run.encounter_ice";
    const input = aiInput("runner", [pump, continueIntoEtr]);
    input.playerView.timingPoint = "run.encounter_ice";
    input.playerView.own.credits = 1;
    input.playerView.own.clicks = 2;
    input.playerView.own.rig = [dwarf];
    input.playerView.servers = [
      server("hq"),
      server("rd", [crystalWall]),
      server("archives"),
    ];
    input.playerView.run = {
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      encounteredIce: crystalWall,
      successful: false,
    };

    const decision = chooseRunnerAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(continueIntoEtr.actionId);
    expect(decision.reasonCode).toBe("runner.semantic.simple_run_choice");
    expect(debugText).toContain(
      "semantic_excluded:pump_cannot_lead_to_useful_break",
    );
    expect(debugText).toContain("pump_required_count:1");
  });

  it("does not spend the Runner's last credit on a break when the remaining ICE path is still unaffordable", () => {
    const dwarf: VisibleCard = {
      instanceId: "runner-dwarf",
      definitionId: "onr_v1_021_dwarf",
      title: "Dwarf",
      owner: "runner",
      controller: "runner",
      type: "program",
      subtypes: ["icebreaker", "fracter"],
      known: true,
      strength: 4,
    };
    const outerCrystalWall: VisibleCard = {
      instanceId: "corp-outer-crystal-wall",
      definitionId: "onr_v1_232_crystal-wall",
      title: "Crystal Wall",
      owner: "corp",
      controller: "corp",
      type: "ice",
      subtypes: ["wall"],
      known: true,
      rezzed: true,
      strength: 4,
    };
    const currentCrystalWall: VisibleCard = {
      instanceId: "corp-current-crystal-wall",
      definitionId: "onr_v1_232_crystal-wall",
      title: "Crystal Wall",
      owner: "corp",
      controller: "corp",
      type: "ice",
      subtypes: ["wall"],
      known: true,
      rezzed: true,
      strength: 4,
      effectiveRunQuote: {
        iceInstanceId: "corp-current-crystal-wall",
        iceDefinitionId: "onr_v1_232_crystal-wall",
        effectiveStrength: 4,
        subroutines: [{ id: "current-etr", type: "end_the_run" }],
      },
    };
    const breakCurrent = legalAction(
      "break-current-wall",
      "runner",
      "break_subroutine",
      "Dwarf: Subroutine brechen",
      { credits: 1 },
      {
        source: dwarf.instanceId,
        visibility: "private_to_actor",
        payload: {
          breakerId: dwarf.instanceId,
          iceId: currentCrystalWall.instanceId,
          subroutineIndex: 0,
        },
      },
    );
    const continueIntoEtr = legalAction(
      "continue-etr",
      "runner",
      "continue_run",
      "Subroutinen auslösen (Run endet)",
      { credits: 0 },
      {
        visibility: "private_to_actor",
        payload: {
          encounterContinue: true,
          unbrokenSubroutineCount: 1,
          encounterWillEndRun: true,
          sourceDefinitionId: "onr_v1_232_crystal-wall",
        },
      },
    );
    breakCurrent.timingPoint = "run.encounter_ice";
    continueIntoEtr.timingPoint = "run.encounter_ice";
    const input = aiInput("runner", [breakCurrent, continueIntoEtr]);
    input.playerView.timingPoint = "run.encounter_ice";
    input.playerView.own.credits = 1;
    input.playerView.own.clicks = 2;
    input.playerView.own.rig = [dwarf];
    input.playerView.servers = [
      server("hq"),
      server("rd", [outerCrystalWall, currentCrystalWall]),
      server("archives"),
    ];
    input.playerView.run = {
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 1 },
      encounteredIce: currentCrystalWall,
      successful: false,
    };

    const decision = chooseRunnerAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(continueIntoEtr.actionId);
    expect(decision.reasonCode).toBe("runner.semantic.simple_run_choice");
    expect(debugText).toContain(
      "semantic_excluded:break_cannot_preserve_access_path",
    );
    expect(debugText).toContain("break_future_path_blocked_after_cost:true");
  });

  it("builds toward an unaffordable economy payout card in hand", () => {
    const input = aiInput("runner", [
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("onr_v1_108_score", "runner", "event"),
      visibleCard("filler-1", "runner", "event"),
      visibleCard("filler-2", "runner", "event"),
      visibleCard("filler-3", "runner", "event"),
      visibleCard("filler-4", "runner", "event"),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.decisionDebug?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_hand_funding_target",
        }),
      ]),
    );
  });

  it("restores an empty runner hand buffer before a generic R&D probe", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.own.credits = 3;
    input.playerView.own.gripOrHq = [];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    input.playerView.publicEvents = [
      publicEvent("corp-damage-card-seen", "net_damage", 12, {
        actor: "corp",
        actionType: "net_damage",
        damageType: "net",
        sourceTitle: "Dedicated Response Team",
        sourceDefinitionId: "onr_v1_076_dedicated-response-team",
      }),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("draw");
    expect(decision.reasonCode).toBe("runner.semantic.basic_economy_draw");
    expect(decision.decisionDebug?.planKind).toBe("runner.restore_hand_buffer");
    expect(decision.decisionDebug?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_hand_buffer_need",
          value: 2500,
          reason: expect.stringContaining("damage_pressure:true"),
        }),
      ]),
    );
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "run-rd",
        whyNot: expect.arrayContaining(["plan_mismatch"]),
      }),
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /privatePayload|cardInstances|fullGameState|decklist/i,
    );
  });

  it("keeps high-payoff remote access above empty-hand draw", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.own.credits = 3;
    input.playerView.own.gripOrHq = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [visibleCard("agenda", "corp", "agenda")]),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("run-remote");
    expect(decision.reasonCode).toBe("runner.semantic.remote_contest");
    expect(decision.decisionDebug?.planKind).not.toBe(
      "runner.restore_hand_buffer",
    );
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "draw",
        scoreBreakdown: expect.arrayContaining([
          expect.objectContaining({
            key: "runner_hand_buffer_need",
            reason: expect.stringContaining("hand:0"),
          }),
        ]),
      }),
    );
  });

  it("keeps preview decisions from advancing tactical plan memory", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.own.rig = [];
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
        [visibleCard("simple_agenda", "corp", "agenda")],
      ),
    ];

    const previewDecision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(previewDecision.actionId).toBe("draw");
    expect(previewDecision.evidence).toContain(
      "tactical_plan_memory_preview_only:true",
    );
    expect(getTacticalPlanMemorySnapshot(input)).toBeUndefined();

    const liveDecision = chooseRunnerAction(input);

    expect(liveDecision.actionId).toBe(previewDecision.actionId);
    expect(getTacticalPlanMemorySnapshot(input)).toMatchObject({
      type: "runner.obtain_breaker_coverage",
    });
  });

  it("keeps an opportunistic central run available while a remote plan is blocked", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "run-hq",
        "runner",
        "start_run",
        "Run HQ",
        { credits: 0 },
        { payload: { serverId: "hq" } },
      ),
    ]);
    input.playerView.own.rig = [];
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
        [visibleCard("simple_agenda", "corp", "agenda")],
      ),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("run-hq");
    expect(decision.decisionDebug?.planKind).toBe(
      "runner.opportunistic_central_run",
    );
  });

  it("uses Broker build and payout as explicit credit-bank plans", () => {
    const stableInput = aiInput("runner", [
      legalAction(
        "broker-load",
        "runner",
        "trigger_ability",
        "Credits auf Broker legen",
        { credits: 0 },
        { source: "broker" },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    stableInput.playerView.own.credits = 6;

    const stableDecision = chooseRunnerAction(stableInput);

    expect(stableDecision.actionId).toBe("broker-load");
    expect(stableDecision.decisionDebug?.planKind).toBe(
      "runner.build_credit_bank",
    );

    const lowCreditInput = aiInput("runner", [
      legalAction(
        "broker-take",
        "runner",
        "trigger_ability",
        "Credits von Broker nehmen",
        { credits: 0 },
        { source: "broker" },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    lowCreditInput.playerView.own.credits = 2;

    const lowCreditDecision = chooseRunnerAction(lowCreditInput);

    expect(lowCreditDecision.actionId).toBe("broker-take");
    expect(lowCreditDecision.decisionDebug?.planKind).toBe(
      "runner.cash_out_credit_bank",
    );
  });

  it("does not cash out Broker immediately after a stable bank-build plan", () => {
    const stableInput = aiInput("runner", [
      legalAction(
        "broker-load",
        "runner",
        "trigger_ability",
        "Credits auf Broker legen",
        { credits: 0 },
        { source: "broker" },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    stableInput.playerView.own.credits = 6;

    const buildDecision = chooseRunnerAction(stableInput);
    expect(buildDecision.actionId).toBe("broker-load");

    const payoutInput = aiInput("runner", [
      legalAction(
        "broker-take",
        "runner",
        "trigger_ability",
        "Credits von Broker nehmen",
        { credits: 0 },
        { source: "broker" },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    payoutInput.playerView.own.credits = 6;

    const payoutDecision = chooseRunnerAction(payoutInput);

    expect(payoutDecision.actionId).toBe("gain-credit");
    expect(payoutDecision.decisionDebug?.detailSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "tactical_plan",
          items: expect.arrayContaining([
            "previous_plan_type:runner.build_credit_bank",
          ]),
        }),
      ]),
    );
  });

  it("prefers the first empty Broker build over low-value runs and generic setup", () => {
    const input = aiInput("runner", [
      legalAction(
        "broker-load",
        "runner",
        "activated_card_ability",
        "3 Credits auf Broker legen",
        { credits: 0 },
        { source: "onr_v1_154_broker" },
      ),
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 6;
    input.playerView.own.rig = [
      visibleCard("onr_v1_154_broker", "runner", "resource"),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("broker-load");
    expect(decision.decisionDebug?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_bank_investment_commitment",
          reason: expect.stringContaining(
            "bankCommitmentStatus:build_first_load",
          ),
        }),
      ]),
    );
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "run-rd",
        scoreBreakdown: expect.arrayContaining([
          expect.objectContaining({
            key: "runner_bank_commitment_build_over_low_run",
            reason: expect.stringContaining(
              "why_bank_build_over_run:low_value_run",
            ),
          }),
        ]),
      }),
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("lets known agenda remotes override an active Broker build commitment", () => {
    const input = aiInput("runner", [
      legalAction(
        "broker-load",
        "runner",
        "activated_card_ability",
        "3 Credits auf Broker legen",
        { credits: 0 },
        { source: "onr_v1_154_broker" },
      ),
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
    ]);
    input.playerView.own.credits = 6;
    input.playerView.own.rig = [
      visibleCard("onr_v1_154_broker", "runner", "resource"),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [visibleCard("simple_agenda", "corp", "agenda")]),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("run-remote");
    expect(decision.decisionDebug?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_bank_commitment_run_override",
          reason: expect.stringContaining(
            "why_run_over_bank_build:known_agenda",
          ),
        }),
      ]),
    );
  });

  it("defers Broker cashout when no funding need or bank threshold is visible", () => {
    const input = aiInput("runner", [
      legalAction(
        "broker-take",
        "runner",
        "activated_card_ability",
        "Credits von Broker nehmen",
        { credits: 0 },
        { source: "onr_v1_154_broker" },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 6;
    input.playerView.own.rig = [
      visibleCard("onr_v1_154_broker", "runner", "resource", {
        counters: { bit: 3 },
        counterDisplays: [
          {
            id: "broker-bank",
            amount: 3,
            displayKind: "stored_credits",
            label: "3",
            ariaLabel: "3 stored credits",
            usageHint: "spendable",
          },
        ],
      }),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "broker-take",
        excluded: true,
        scoreBreakdown: expect.arrayContaining([
          expect.objectContaining({
            key: "runner_bank_cashout_gate",
            reason: expect.stringContaining("why_cashout_now:no_funding_need"),
          }),
        ]),
      }),
    );
  });

  it("stops loading Broker when stored credits and runner pool are comfortable", () => {
    const input = aiInput("runner", [
      legalAction(
        "broker-load",
        "runner",
        "activated_card_ability",
        "Broker: 3 Credits auf Broker legen",
        { credits: 0 },
        { source: "onr_v1_154_broker" },
      ),
      legalAction(
        "broker-take",
        "runner",
        "activated_card_ability",
        "Broker: Credits von Broker nehmen",
        { credits: 0 },
        { source: "onr_v1_154_broker" },
      ),
      legalAction(
        "install-short-circuit",
        "runner",
        "install_card",
        "The Short Circuit installieren",
        { credits: 1 },
        { source: "onr_v1_177_the-short-circuit" },
      ),
    ]);
    input.playerView.own.credits = 13;
    input.playerView.own.rig = [
      visibleCard("onr_v1_154_broker", "runner", "resource", {
        counters: { bit: 21 },
        counterDisplays: [
          {
            id: "broker-bank",
            amount: 21,
            displayKind: "stored_credits",
            label: "21",
            ariaLabel: "21 stored credits",
            usageHint: "spendable",
          },
        ],
      }),
    ];
    input.playerView.own.gripOrHq = [
      visibleCard("onr_v1_177_the-short-circuit", "runner", "resource"),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).not.toBe("broker-load");
    expect(decision.actionId).not.toBe("broker-take");
    const decisionDebug = JSON.stringify(decision.decisionDebug);
    expect(decisionDebug).toContain("bankStoredCredits:21");
    expect(decisionDebug).toContain("bankComfortableCreditPool:true");
    expect(decisionDebug).toContain("bankOverDesiredTarget:true");
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "broker-load",
        scoreBreakdown: expect.arrayContaining([
          expect.objectContaining({
            key: "runner_bank_investment_commitment",
            reason: expect.stringContaining(
              "bankCommitmentStatus:over_target_hold",
            ),
          }),
        ]),
      }),
    );
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "broker-take",
        excluded: true,
        scoreBreakdown: expect.arrayContaining([
          expect.objectContaining({
            key: "runner_bank_cashout_gate",
            reason: expect.stringContaining("why_cashout_now:no_funding_need"),
          }),
        ]),
      }),
    );
  });

  it("uses legal Mantis search for missing wall coverage before basic draw", () => {
    const input = runnerWallCoverageInput([
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "mantis",
        "runner",
        "play_event",
        "Mantis, Fixer-at-Large spielen",
        { credits: 3 },
        { source: "mantis-card" },
      ),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 13;
    input.playerView.own.gripOrHq = [
      visibleCard("mantis-card", "runner", "event", {
        definitionId: "onr_v1_099_mantis-fixer-at-large",
        title: "Mantis, Fixer-at-Large",
        rulesText:
          "Search your stack for a program, reveal it and bring it into your grip. Shuffle your stack afterwards.",
      }),
    ];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe("mantis");
    expect(decision.reasonCode).toBe("runner.semantic.coverage_search");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "semantic_scope:coverage_search",
        "activeRequiredCapability:Wall-Breaker",
        "coverageAnswerFit:direct_card_search",
        "coverageAnswerSource:Mantis, Fixer-at-Large",
        "why_mantis_selected:searches_for_required_breaker_coverage",
      ]),
    );
    expect(decision.evidence).not.toContain("semantic_scope:basic_install");
    expect(decision.decisionDebug?.planKind).toBe(
      "runner.obtain_breaker_coverage",
    );
    const mantisAlternative = decision.decisionDebug?.actionAlternatives?.find(
      (entry) => entry.actionId === "mantis",
    );
    const planSelectionRow = mantisAlternative?.scoreBreakdown?.find(
      (entry) => entry.key === "selected_by_plan_mapping",
    );
    expect(planSelectionRow?.value ?? 0).toBeGreaterThan(0);
    expect(mantisAlternative).toEqual(
      expect.objectContaining({
        sourceTitle: "Mantis, Fixer-at-Large",
        scoreBreakdown: expect.arrayContaining([
          expect.objectContaining({
            key: "runner_coverage_answer_fit",
            label: "Coverage-Suchtreffer: Wall-Breaker",
            reason: expect.stringContaining(
              "coverageAnswerFit:direct_card_search",
            ),
          }),
        ]),
      }),
    );
    const decisionDebug = JSON.stringify(decision.decisionDebug);
    expect(decisionDebug).toContain("coverageAnswerRole:program_search");
    expect(decisionDebug).toContain("activeRequiredCapability:Wall-Breaker");
    expect(decisionDebug).toContain("coverageAnswerFit:direct_card_search");
    expect(decisionDebug).toContain(
      "why_mantis_selected:searches_for_required_breaker_coverage",
    );
    expect(
      tacticalDebugItems(decision).some(
        (item) =>
          item.includes("id=runner.develop_hand_card:mantis-card") &&
          item.includes("card_type=event"),
      ),
    ).toBe(true);
    expect(
      tacticalDebugItems(decision).some(
        (item) =>
          item.includes("id=runner.develop_hand_card:mantis-card") &&
          item.includes("step=install_development_card"),
      ),
    ).toBe(true);
  });

  it("keeps Bodyweight event plan display data as play-not-install fallback", () => {
    const input = runnerWallCoverageInput([
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "bodyweight",
        "runner",
        "play_event",
        "Bodyweight Synthetic Blood spielen",
        { credits: 2 },
        { source: "bodyweight-card" },
      ),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 13;
    input.playerView.own.gripOrHq = [
      visibleCard("bodyweight-card", "runner", "event", {
        definitionId: "onr_v1_079_bodyweight-synthetic-blood",
        title: "Bodyweight Synthetic Blood",
        rulesText: "Draw five cards.",
      }),
    ];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe("bodyweight");
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["semantic_scope:basic_economy_draw"]),
    );
    expect(
      tacticalDebugItems(decision).some(
        (item) =>
          item.includes("id=runner.develop_hand_card:bodyweight-card") &&
          item.includes("card_type=event"),
      ),
    ).toBe(true);
  });

  it("keeps The Short Circuit plan display data as a resource installation", () => {
    const input = runnerWallCoverageInput([
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "install-short-circuit",
        "runner",
        "install_card",
        "The Short Circuit installieren",
        { credits: 1 },
        { source: "short-circuit-card" },
      ),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 13;
    input.playerView.own.gripOrHq = [
      visibleCard("short-circuit-card", "runner", "resource", {
        definitionId: "onr_v1_177_the-short-circuit",
        title: "The Short Circuit",
        rulesText:
          "[A], [1]: Search your stack for a program. Show that program to the Corp, and then bring it into your hand. Reshuffle your stack afterwards.",
      }),
    ];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe("install-short-circuit");
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["semantic_scope:setup_card_search"]),
    );
    expect(
      tacticalDebugItems(decision).some(
        (item) =>
          item.includes("id=runner.develop_hand_card:short-circuit-card") &&
          item.includes("card_type=resource"),
      ),
    ).toBe(true);
  });

  it("sets up The Short Circuit as a search engine before basic draw when no direct search is legal", () => {
    const input = runnerWallCoverageInput([
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "install-short-circuit",
        "runner",
        "install_card",
        "The Short Circuit installieren",
        { credits: 1 },
        { source: "short-circuit-card" },
      ),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 13;
    input.playerView.own.gripOrHq = [
      visibleCard("short-circuit-card", "runner", "resource", {
        definitionId: "onr_v1_177_the-short-circuit",
        title: "The Short Circuit",
        rulesText:
          "[A], [1]: Search your stack for a program. Show that program to the Corp, and then bring it into your hand. Reshuffle your stack afterwards.",
      }),
    ];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe("install-short-circuit");
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "selected_step_kind:setup_search_engine",
    );
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "coverageAnswerRole:search_engine_setup",
    );
  });

  it("uses Bodyweight draw-for-answer before basic draw when search is not legal", () => {
    const input = runnerWallCoverageInput([
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "bodyweight",
        "runner",
        "play_event",
        "Bodyweight Synthetic Blood spielen",
        { credits: 2 },
        { source: "bodyweight-card" },
      ),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 13;
    input.playerView.own.gripOrHq = [
      visibleCard("bodyweight-card", "runner", "event", {
        definitionId: "onr_v1_079_bodyweight-synthetic-blood",
        title: "Bodyweight Synthetic Blood",
        rulesText: "Draw five cards.",
      }),
    ];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe("bodyweight");
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "selected_step_kind:draw_for_answer",
    );
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "coverageAnswerRole:draw_for_answer",
    );
  });

  it("uses basic draw as draw-for-answer when no search or draw card is legal", () => {
    const input = runnerWallCoverageInput([
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 13;

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe("draw");
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "selected_step_kind:draw_for_answer",
    );
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "coverageAnswerRole:basic_draw_fallback",
    );
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "draw",
        whyChosen: expect.arrayContaining(["selected_by_plan_mapping"]),
      }),
    );
  });

  it("keeps Archives pressure below the active wall-coverage plan and explains the mismatch", () => {
    const input = runnerWallCoverageInput([
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "run-archives",
        "runner",
        "start_run",
        "Run Archives",
        { credits: 0 },
        { payload: { serverId: "archives" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 13;
    input.playerView.opponent.discardCount = 1;

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });
    const archivesAlternative =
      decision.decisionDebug?.actionAlternatives?.find(
        (entry) => entry.actionId === "run-archives",
      );
    const selectedAlternative =
      decision.decisionDebug?.actionAlternatives?.find(
        (entry) => entry.actionId === "draw",
      );

    expect(decision.actionId).toBe("draw");
    expect(archivesAlternative?.whyNot).toEqual(
      expect.arrayContaining(["plan_mismatch"]),
    );
    expect(archivesAlternative?.priority ?? 0).toBeLessThan(
      selectedAlternative?.priority ?? 0,
    );
    expect(JSON.stringify(archivesAlternative?.scoreBreakdown)).toContain(
      "rawSemanticScore:",
    );
  });

  it("devalues Broker install when a later bank load is not plausible", () => {
    const input = aiInput("runner", [
      legalAction(
        "install-broker",
        "runner",
        "install_card",
        "Install Broker",
        { credits: 0 },
        { source: "onr_v1_154_broker" },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 1;
    input.playerView.own.gripOrHq = [
      visibleCard("onr_v1_154_broker", "runner", "resource"),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "install-broker",
        scoreBreakdown: expect.arrayContaining([
          expect.objectContaining({
            key: "runner_bank_install_commitment",
            reason: expect.stringContaining(
              "why_broker_install_deferred:no_plausible_followup_load",
            ),
          }),
        ]),
      }),
    );
  });

  it("defers low-value runs while Top Runners' Conference value is unrealized", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 4;
    input.playerView.own.rig = [
      visibleCard("onr_v1_184_top-runners-conference", "runner", "resource"),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "run-rd",
        scoreBreakdown: expect.arrayContaining([
          expect.objectContaining({
            key: "runner_no_run_economy_run_penalty",
            reason: expect.stringContaining(
              "why_run_deferred_for_conference:low_value_run",
            ),
          }),
        ]),
      }),
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("devalues Top Runners' Conference install without a setup window", () => {
    const input = aiInput("runner", [
      legalAction(
        "install-conference",
        "runner",
        "install_card",
        "Install Top Runners' Conference",
        { credits: 0 },
        { source: "onr_v1_184_top-runners-conference" },
      ),
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
    ]);
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("onr_v1_184_top-runners-conference", "runner", "resource"),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("run-rd");
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "install-conference",
        scoreBreakdown: expect.arrayContaining([
          expect.objectContaining({
            key: "runner_no_run_economy_install_commitment",
            reason: expect.stringContaining(
              "why_conference_install_deferred:no_setup_window",
            ),
          }),
        ]),
      }),
    );
  });

  it("allows known agenda runs to break Top Runners' Conference commitment", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 4;
    input.playerView.own.rig = [
      visibleCard("onr_v1_184_top-runners-conference", "runner", "resource"),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [visibleCard("simple_agenda", "corp", "agenda")]),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("run-remote");
    expect(decision.decisionDebug?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_no_run_economy_run_override",
          reason: expect.stringContaining(
            "why_run_allowed_despite_conference:known_agenda",
          ),
        }),
      ]),
    );
  });

  it("reduces Top Runners' Conference run penalty after start-of-turn value is realized", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 6;
    input.playerView.own.rig = [
      visibleCard("onr_v1_184_top-runners-conference", "runner", "resource"),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    input.eventTail = [
      {
        eventId: "conference-start-credit",
        type: "automatic_effects_resolved",
        stateVersionBefore: 1,
        stateVersionAfter: 2,
        stateHashAfter: "fnv1a:conference",
        visibilityClass: "public",
        publicPayload: {
          resolvedEffects: [
            {
              kind: "gain_credits",
              side: "runner",
              amount: 2,
              reason: "start_of_turn",
              sourceDefinitionId: "onr_v1_184_top-runners-conference",
              sourceTitle: "Top Runners' Conference",
              visibility: "public",
            },
          ],
        },
      },
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("run-rd");
    expect(decision.decisionDebug?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_no_run_economy_run_penalty",
          value: -850,
          reason: expect.stringContaining("realizedValueEstimate:2"),
        }),
      ]),
    );
  });

  it("does not treat turn-start economy without run drawback as no-run commitment", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 6;
    input.playerView.own.rig = [
      visibleCard("onr_v1_295_night-shift", "runner", "resource"),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseRunnerAction(input);

    expect(JSON.stringify(decision.decisionDebug)).not.toContain(
      "noRunEconomyCommitmentActive:true",
    );
  });

  it("returns from an opportunistic central run to the blocked remote coverage plan", () => {
    const centralInput = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "run-hq",
        "runner",
        "start_run",
        "Run HQ",
        { credits: 0 },
        { payload: { serverId: "hq" } },
      ),
    ]);
    centralInput.playerView.own.rig = [];
    centralInput.playerView.servers = [
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
        [visibleCard("simple_agenda", "corp", "agenda")],
      ),
    ];

    const centralDecision = chooseRunnerAction(centralInput);
    expect(centralDecision.actionId).toBe("run-hq");

    const followupInput = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "run-hq",
        "runner",
        "start_run",
        "Run HQ",
        { credits: 0 },
        { payload: { serverId: "hq" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    followupInput.playerView.stateVersion = 2;
    followupInput.playerView.own.rig = [];
    followupInput.playerView.servers = centralInput.playerView.servers;

    const followupDecision = chooseRunnerAction(followupInput);

    expect(followupDecision.actionId).toBe("draw");
    expect(followupDecision.decisionDebug?.planKind).toBe(
      "runner.obtain_breaker_coverage",
    );
    expect(followupDecision.decisionDebug?.detailSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "tactical_plan",
          items: expect.arrayContaining([
            "previous_plan_type:runner.opportunistic_central_run",
            "plan_progression_reason:previous_central_probe_ttl_expired",
          ]),
        }),
      ]),
    );
  });

  it("does not continue a satisfied R&D probe into the same known low-value top card", () => {
    const initialInput = aiInput("runner", [
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction(
        "run-hq",
        "runner",
        "start_run",
        "Run HQ",
        { credits: 0 },
        { payload: { serverId: "hq" } },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    initialInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
    ];

    const initialDecision = chooseRunnerAction(initialInput);
    expect(initialDecision.actionId).toBe("run-rd");

    const followupInput = aiInput("runner", [
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction(
        "run-hq",
        "runner",
        "start_run",
        "Run HQ",
        { credits: 0 },
        { payload: { serverId: "hq" } },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    followupInput.playerView.stateVersion = 3;
    followupInput.playerView.servers = initialInput.playerView.servers;
    followupInput.eventTail = [
      rdAccessEvent("semantic-rd-rock-access", 1, "onr_v1_265_rock-is-strong"),
    ];

    const followupDecision = chooseRunnerAction(followupInput);
    const selected = followupInput.legalActions.find(
      (action) => action.actionId === followupDecision.actionId,
    );
    const tacticalDebug =
      followupDecision.decisionDebug?.detailSections
        ?.find((section) => section.id === "tactical_plan")
        ?.items.join("\n") ?? "";

    expect(
      selected?.type === "start_run" && selected.payload?.serverId === "rd",
    ).toBe(false);
    expect(tacticalDebug).toContain("runner.opportunistic_central_run:rd");
    expect(tacticalDebug).toContain("status=abandoned");
    expect(tacticalDebug).toContain("blockers=target_unreachable");
    expect(tacticalDebug).toContain(
      "plan_progression_reason:previous_central_probe_satisfied",
    );
    expect(JSON.stringify(followupDecision.decisionDebug)).toContain(
      "semantic_excluded:known_central_no_current_payoff",
    );
  });

  it("excludes a stale known low-value R&D top card from semantic fallback choices", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.stateVersion = 3;
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    input.eventTail = [
      rdAccessEvent(
        "semantic-rd-rock-fallback-access",
        1,
        "onr_v1_265_rock-is-strong",
      ),
    ];

    const decision = chooseRunnerAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("gain-credit");
    expect(debugText).toContain(
      "semantic_excluded:known_central_no_current_payoff",
    );
    expect(debugText).toContain("payoff:known_low_value");
    expect(debugText).toContain(
      "rd_run_suppressed_by_known_low_value_top:true",
    );
  });

  it("represents a corp rez window as a rez defense plan", () => {
    const input = aiInput("corp", [
      legalAction(
        "rez-outer",
        "corp",
        "rez_ice",
        "Rez outer ICE",
        { credits: 3 },
        { source: "outer-ice", payload: { serverId: "remote_1" } },
      ),
      legalAction("decline-rez", "corp", "decline_rez", "Decline rez", {
        credits: 0,
      }),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [visibleCard("outer-ice", "corp", "ice")]),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("rez-outer");
    expect(decision.decisionDebug?.planKind).toBe("corp.rez_defense");
    expect(decision.evidence).toContain("tactical_step:rez_outer_ice");
  });

  it("keeps legacy available only through the explicit runtime kill switch", () => {
    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "legacy";
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

    expect(decision.reasonCode).not.toContain(".semantic.");
    expect(decision.evidence).toContain("semantic_runtime_force_legacy");
  });

  it("does not expose shadow-only diagnostics through the public AI runtime API", () => {
    const exportedKeys = Object.keys(aiPublicApi);

    expect(exportedKeys).not.toContain("buildSemanticShadowDecision");
    expect(exportedKeys).not.toContain("buildDeckDoctrineV2Diagnostic");
    expect(exportedKeys).not.toContain("buildRealEngineDecisionCorpus");
    expect(exportedKeys).not.toContain("buildSemanticDecisionFrame");
  });

  it("keeps ActionSemanticCandidate as a projection instead of LegalAction generation", () => {
    const action = legalAction(
      "gain-credit",
      "runner",
      "gain_credit",
      "Gain 1",
      {
        credits: 0,
      },
    );
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      observerSide: "runner",
      stateVersion: 1,
    });

    expect(candidate?.actionId).toBe(action.actionId);
    expect(candidate).not.toHaveProperty("legalAction");
    expect(candidate).not.toHaveProperty("legalActions");
    expect(JSON.stringify(candidate)).not.toContain("applyAction");
  });

  it("keeps SemanticShadowDecision and DeckDoctrine v2 as no-effect diagnostics", () => {
    const input = aiInput("runner", [
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
    });
    const trace = buildSemanticShadowDecision(frame);
    const doctrine = buildDeckDoctrineV2Diagnostic({
      deckSnapshotId: "cutover-shadow-only-runner",
      side: "runner",
      cards: [{ cardId: "simple_run_event", quantity: 3 }],
    });
    const corpus = buildRealEngineDecisionCorpus(
      buildRealEngineDecisionCorpusScenarios(),
    );

    expect(trace.noRuntimeEffect).toBe(true);
    expect(trace.selectedActionId).toBeUndefined();
    expect(doctrine.scope).toBe("diagnostic_only");
    expect(doctrine.productiveUseAllowed).toBe(false);
    expect(corpus.every((sample) => sample.trace.noRuntimeEffect)).toBe(true);
    expect(
      corpus.every((sample) => sample.trace.selectedActionId === undefined),
    ).toBe(true);
  });
});

function aiInput(side: Side, legalActions: LegalAction[]): AiDecisionInput {
  return {
    side,
    playerView: playerView(side, legalActions),
    eventTail: [],
    legalActions,
    difficulty: "normal" satisfies AiDifficulty,
    seed: "semantic-runtime-cutover-test",
    decisionId: `semantic-runtime-cutover:${side}`,
    actionNumber: 1,
    profileId: `${side}-semantic-runtime-cutover-test`,
  };
}

function runnerDoctrine(
  planWeights: Record<string, number>,
): NonNullable<AiDecisionInput["ownDeckDoctrine"]> {
  return {
    schemaVersion: "ai-deck-doctrine-v1",
    deckSnapshotId: "semantic-runtime-doctrine-debug",
    deckHash: "test:semantic-runtime-doctrine-debug",
    side: "runner",
    confidence: 0.9,
    archetypeTags: ["rnd_pressure"],
    roleCounts: {},
    roleDensity: {},
    planWeights,
    mulliganWeights: {},
    riskFlags: [],
    evidence: [],
  };
}

function playerView(side: Side, legalActions: LegalAction[]): PlayerView {
  const ownSide = side;
  const opponentSide = side === "runner" ? "corp" : "runner";
  return {
    stateVersion: 1,
    side,
    activeSide: side,
    phase: side === "runner" ? "runner_action_phase" : "corp_action_phase",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    own: {
      identity: identityCard(ownSide),
      credits: 4,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 0,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: identityCard(opponentSide),
      credits: 4,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 0,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [],
    publicEvents: [],
    legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
}

function runnerWallCoverageInput(actions: LegalAction[]): AiDecisionInput {
  const input = aiInput("runner", actions);
  input.playerView.own.rig = [];
  input.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    server(
      "remote_1",
      [
        visibleCard("simple_barrier_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ],
      [visibleCard("simple_agenda", "corp", "agenda")],
    ),
  ];
  return input;
}

function identityCard(side: Side): VisibleCard {
  return {
    instanceId: `${side}-identity`,
    definitionId: `${side}-identity`,
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}

function visibleCard(
  instanceId: string,
  side: Side,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Omit<
    Partial<VisibleCard>,
    "instanceId" | "owner" | "controller" | "type" | "known"
  > = {},
): VisibleCard {
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    owner: side,
    controller: side,
    type,
    known: true,
    ...overrides,
  };
}

function server(
  id: PlayerView["servers"][number]["id"],
  ice: VisibleCard[] = [],
  root: VisibleCard[] = [],
): PlayerView["servers"][number] {
  return {
    id,
    label: id,
    ice,
    root,
  };
}

function legalAction(
  actionId: string,
  side: Side,
  type: LegalAction["type"],
  label: string,
  cost: { credits: number },
  options: {
    source?: LegalAction["source"];
    payload?: LegalAction["payload"];
    visibility?: LegalAction["visibility"];
  } = {},
): LegalAction {
  const action: LegalAction = {
    actionId,
    side,
    type,
    label,
    source: options.source ?? "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [cost],
    targetRequirements: [],
    visibility: options.visibility ?? "public",
    expiresAtStateVersion: 2,
  };
  if (options.payload) action.payload = options.payload;
  return action;
}

function legacyDecision(actionId: string, reasonCode: string): AiDecision {
  return {
    actionId,
    reasonCode,
    explanation: reasonCode,
    consideredActionIds: [],
    fallbackUsed: false,
    evidence: ["legacy_reference"],
  };
}

function semanticRuntimeChoice(
  action: LegalAction,
  score: number,
  reasonCode: string,
): SemanticRuntimeChoice {
  return {
    action,
    scopeId: reasonCode,
    score,
    reasonCode,
    explanation: reasonCode,
    evidence: [`choice:${action.actionId}`],
  };
}

function safeRuntimeRunTarget(actionId: string, targetServerId: string) {
  const targetKind = targetServerId === "rd" ? "rd" : "hq";
  const payoff = {
    immediateAccessValue: 20,
    futureSetupValue: 0,
    purgeTaxValue: 0,
    economyValue: 0,
    riskPenalty: 0,
    scoreBonus: 0,
    multiaccessAvailable: false,
    evidence: ["test_payoff"],
  };
  return {
    schemaVersion: "runner-run-target-evaluation-v1",
    targetServerId,
    targetKind,
    accessServerId: targetServerId,
    accessTargetKind: targetKind,
    actionId,
    accessPayoff: "fresh",
    knownAccessState: "fresh",
    multiaccessAvailable: false,
    pathPassability: "reachable",
    pathCost: 0,
    creditsAfterRun: 4,
    stealOrTrashAffordable: "unknown",
    installedRunPayoff: payoff,
    runActionPayoff: payoff,
    runActionProjection: {
      actionId,
      actionType: "start_run",
      targetServerId,
      targetKind,
      accessServerId: targetServerId,
      structure: "direct_start_run",
      accessPayoffSignals: [],
      constraintSignals: [],
      riskSignals: [],
      noNoisyBreakers: false,
      bypassFirstIce: false,
      projectionStatus: "concrete_target",
      evidence: ["test_projection"],
    },
    riskyUniversalCoverage: false,
    scoreThreat: false,
    recommendation: "run_now",
    score: 100,
    evidence: ["test_safe_access"],
  };
}

function semanticRuntimeDependencies(
  choices: SemanticRuntimeChoice[],
  options: {
    initiallySelectedActionId: string;
    goal?: {
      goalId: string;
      family: string;
      priority: number;
      urgency: string;
      source: string;
      evidence: string[];
    };
    rememberedActions?: string[];
    runTargets?: unknown[];
  },
): SemanticRuntimeDependencies {
  return {
    semanticRuntimeChoices: () => choices,
    semanticRuntimeChoiceIsReactive: () => false,
    buildActionSemanticCandidates,
    getTacticalPlanMemorySnapshot: () => undefined,
    deckCapabilitiesForInput: () => ({}) as any,
    runnerStrategicIntentForInput: () => ({}) as any,
    evaluateRunnerHandDevelopment: () => [],
    buildRunnerEconomyPosture: () =>
      ({
        recommendation: "build_economy",
        fundingNeed: "credits",
        evidence: ["test_economy_posture"],
      }) as any,
    evaluateRunnerRunTargets: () => (options.runTargets ?? []) as any[],
    buildRunnerTacticalGoals: () =>
      [
        options.goal ?? {
          goalId: "runner.build_economy_base",
          family: "economy",
          priority: 940,
          urgency: "high",
          source: "economy_posture",
          evidence: ["test_goal:economy"],
        },
      ] as any,
    evaluateTacticalPlans: () => ({
      planAlternatives: [],
      blockedPlans: [],
    }),
    bestSemanticRuntimeChoice: () =>
      choices.find(
        (choice) =>
          choice.action.actionId === options.initiallySelectedActionId,
      ),
    bestSemanticRuntimeChoiceForTacticalPlanOverride: () => undefined,
    tacticalPlanMappedChoice: () => ({}),
    runnerSelfDamageImmediateWinSemanticChoice: () => undefined,
    semanticRuntimeChoiceWithEvidence: (choice, options) => ({
      ...choice,
      evidence: [...choice.evidence, ...options.evidence],
      ...(options.minimumScore !== undefined
        ? { score: Math.max(choice.score, options.minimumScore) }
        : {}),
      ...(options.reasonCode ? { reasonCode: options.reasonCode } : {}),
      ...(options.explanation ? { explanation: options.explanation } : {}),
    }),
    tacticalPlanMappingOverrideEvidence: () => [],
    tacticalPlanRuntimeAlignedToChoice: () => ({
      planAlternatives: [],
      blockedPlans: [],
    }),
    runnerRunOnlyActionAdjustedSemanticChoice: (
      _input,
      rankedChoices,
      selectedChoice,
    ) => ({
      choice: selectedChoice,
      rankedChoices: [...rankedChoices],
    }),
    semanticRuntimeCoverageSelectionDebug: () => undefined,
    selectedChoicesForDecision: () => undefined,
    rememberTacticalPlanRuntime: (_input, _result, selectedAction) => {
      options.rememberedActions?.push(selectedAction.actionId);
      return undefined;
    },
    scrubEvidence: (evidence) => evidence,
    semanticRuntimeDecisionDebug: () =>
      ({
        schemaVersion: "ai-decision-debug-v1",
        aiLevel: 2,
      }) as any,
  };
}

function tacticalDebugItems(
  decision: ReturnType<typeof chooseRunnerAction>,
): string[] {
  return (
    decision.decisionDebug?.detailSections?.flatMap(
      (section) => section.items,
    ) ?? []
  );
}

function rdAccessEvent(
  eventId: string,
  stateVersionBefore: number,
  cardDefinitionId: string,
): PublicGameEvent {
  return {
    eventId,
    type: "access_card",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId,
    },
  };
}

function publicEvent(
  eventId: string,
  actionType: string,
  stateVersionBefore: number,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type: actionType,
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload,
  };
}
