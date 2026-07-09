import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import aiDeckPoolData from "../../../data/ai/ai-deck-pool-1.0.1.json";
import snapshotsData08 from "../../../data/decks/deck-snapshots-0.8.json";
import {
  createRuntimeCardsById,
  activeAiApprovedCardIds,
  ACTIVE_CARD_SUPPORT_AI_GROUPS,
  type CatalogCard,
} from "@netgrid/catalog";
import {
  applyAction,
  applyEffectCommands,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import {
  emptyRunnerGripForTest,
  MECHANIC_SMOKE_DECKS,
  v105kCardReleaseGame,
  v181CardReleaseGame,
} from "../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import {
  AI_DECISION_INPUT_TOP_LEVEL_FIELDS,
  beliefStateInvariantSignature,
  buildAiDecisionInputDto,
  buildObservedFacts,
  buildAiDecisionInput as buildAiDecisionInputRuntime,
  type AiDecisionInputWithDeckCapabilities,
  type AiDeckStrategyDeckSnapshot,
  assessCorpIcePlacementForDiagnostics,
  chooseAiAction as chooseSemanticAiAction,
  chooseCorpAction as chooseSemanticCorpAction,
  classifyTagPunishLegalActionFromOntology,
  estimateBreakerCostProfileFromOntology,
  estimateStructuredBreakerCostForIce,
  getStructuredRemoteRoleForCard,
  structuredRemoteRoleSafetyAssessmentForCard,
  evaluateCorpOpeningHand,
  evaluateRunnerOpeningHand,
  evaluateRunnerRunTargets,
  reconstructBeliefState,
  chooseRunnerAction as chooseSemanticRunnerAction,
  selectAiDecisionSideForState,
} from "./index";
import {
  analyzeDoctrineQualityCases,
  assertAiInputIsSideSafe,
  benchmarkDeckFromFrozenLocalSnapshot,
  benchmarkDeckFromLocalEditableDeck,
  benchmarkDeckFromSnapshot,
  chooseCorpBaselineAction,
  chooseRunnerBaselineAction,
  createBeliefSimulationWorld,
  evaluateV143TuningGate,
  formatDoctrineQualityCaseAnalysisReport,
  listV143BenchmarkProfiles,
  listV143ExploitFixtures,
  runDoctrineQualityBenchmark,
  runMatchProgressionBenchmark,
  runV143ExploitRegressionFixtures,
  runV143SimulationLeague,
  simulateAiGame,
  simulateAiSoak,
  summarizeMatchProgressionMetrics,
  type AiSimulationSummary,
} from "./simulation";
import {
  assessCorpIcePortfolioAction,
  assessCorpScoreTerminalWindow,
  chooseCorpPlanAction,
  chooseCorpPlanDecision,
  chooseRunnerPlanAction,
  chooseRunnerPlanDecision,
  classifyScoredAgendaActionFromOntology,
  corpPlanUsesOnlyAiSupportedCards,
  estimateRunCost,
  evaluateAgendaRisk,
  evaluateCorpPlan,
  evaluateCorpScoringProgress,
  evaluateCorpScoringThreat,
  evaluateEconomyReserve,
  evaluateIceRez,
  evaluateRemoteIntentMemory,
  evaluateRemoteRezReserve,
  evaluateRemoteScoreHorizon,
  evaluateRemoteThreat,
  evaluateRunnerContestCapacity,
  evaluateRunnerEarlyTurnStrategy,
  evaluateRunnerPlan,
  evaluateRunnerRig,
  evaluateScoringWindow,
  evaluateServerAccessValue,
  evaluateServerThreat,
  generateCorpPlanCandidates,
  generateRunnerPlanCandidates,
  hasCorpPlanAction,
  hasRunnerPlanAction,
  runnerPlanUsesOnlyAiSupportedCards,
} from "./legacy/legacy-public-contract";
import { createRunnerBaselinePlanGuardContext } from "./runtime/runner-baseline-plan-guard-context";
import {
  isCorpReactiveBaselineDecision,
  isRunnerReactiveBaselineDecision,
} from "./runtime/reactive-action";
import { runnerHasInstalledPrograms } from "./runtime/runner-installed-program";
import { shellTradersAbility } from "./runtime/shell-traders-action";
import {
  assessKnownRezzedIcePath,
  canBreakerDefinitionBreakIce,
  cardDefinitionStrength,
  endTheRunSubroutineCount,
  minimumCreditsToBreakEndTheRunSubroutines,
} from "./visible-run-analysis";
import { resetTacticalPlanMemory } from "./plans/plan-memory";
import {
  getRunnerRunPlanMemorySnapshot,
  rememberRunnerRunPlanMemorySnapshot,
} from "./runtime/runner-run-plan-memory";
import { quoteRunnerRunPath } from "./runtime/runner-run-plan-path-quote";
import type {
  RunnerRunPlan,
  RunnerRunPlanServerId,
} from "./runtime/runner-run-plan-types";
import type {
  AiDecisionDebug,
  AiDecisionInput,
  CardDefinition,
  CardInstanceId,
  ChoiceRequest,
  CreateGameConfig,
  DeckDefinition,
  GameState,
  LegalAction,
  PublicGameEvent,
  Side,
  VisibleCard,
  VisibleEffectiveIceRunQuote,
} from "@netgrid/shared";
import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  CURRENT_RULES_BASELINE,
  DEMO_CARDS_BY_ID,
  sanitizeAiDecisionDebug,
} from "@netgrid/shared";

const {
  runnerHasConditionalPaymentContinueDecision,
  baselineShellTradersPlanIsVisible,
} = createRunnerBaselinePlanGuardContext({
  delayedInstallAbilityForAction: shellTradersAbility,
  runnerHasInstalledPrograms,
});

function chooseAiAction(
  input: AiDecisionInput,
  options?: Parameters<typeof chooseSemanticAiAction>[1],
) {
  if (process.env.NETGRID_SEMANTIC_AI_RUNTIME === "legacy") {
    return input.side === "corp"
      ? chooseCorpAction(input, options)
      : chooseRunnerAction(input, options);
  }
  return chooseSemanticAiAction(input, options);
}

function chooseCorpAction(
  input: AiDecisionInput,
  options?: Parameters<typeof chooseSemanticCorpAction>[1],
) {
  if (process.env.NETGRID_SEMANTIC_AI_RUNTIME === "legacy") {
    return forcedLegacyDecision(corpLegacyDecision(input));
  }
  return chooseSemanticCorpAction(input, options);
}

function chooseRunnerAction(
  input: AiDecisionInput,
  options?: Parameters<typeof chooseSemanticRunnerAction>[1],
) {
  if (process.env.NETGRID_SEMANTIC_AI_RUNTIME === "legacy") {
    return forcedLegacyDecision(runnerLegacyDecision(input));
  }
  ensureRunnerRunPlanForActiveRunTestInput(input);
  return chooseSemanticRunnerAction(input, options);
}

function corpLegacyDecision(input: AiDecisionInput) {
  const baselineDecision = chooseCorpBaselineAction(input);
  return hasCorpPlanAction(input) &&
    !isCorpReactiveBaselineDecision(baselineDecision)
    ? chooseCorpPlanAction(input, baselineDecision)
    : baselineDecision;
}

function runnerLegacyDecision(input: AiDecisionInput) {
  const baselineDecision = chooseRunnerBaselineAction(input);
  const baselineAction = input.legalActions.find(
    (candidate) => candidate.actionId === baselineDecision.actionId,
  );
  const shouldUsePlanAction =
    hasRunnerPlanAction(input) &&
    (!isRunnerReactiveBaselineDecision(baselineDecision) ||
      baselineShellTradersPlanIsVisible(input, baselineDecision)) &&
    !runnerHasConditionalPaymentContinueDecision(input, baselineAction);
  return shouldUsePlanAction
    ? chooseRunnerPlanAction(input, baselineDecision)
    : baselineDecision;
}

function forcedLegacyDecision(
  decision: ReturnType<typeof chooseSemanticAiAction>,
) {
  return {
    ...decision,
    evidence: [...(decision.evidence ?? []), "semantic_runtime_force_legacy"],
  };
}

function ensureRunnerRunPlanForActiveRunTestInput(
  input: AiDecisionInput,
): void {
  if (input.side !== "runner" || !input.playerView.run) return;
  if (getRunnerRunPlanMemorySnapshot(input)) return;
  rememberRunnerRunPlanMemorySnapshot(
    input,
    runnerRunPlanForActiveRunTestInput(input),
  );
}

function runnerRunPlanForActiveRunTestInput(
  input: AiDecisionInput,
): RunnerRunPlan {
  const run = input.playerView.run;
  if (!run) throw new Error("runner_run_plan_test_input_requires_active_run");
  const targetServerId = isRunnerRunPlanServerId(run.attackedServerId)
    ? run.attackedServerId
    : "rd";
  const now = input.playerView.stateVersion;
  const plan: RunnerRunPlan = {
    id: `test_runner_run_plan:${input.decisionId}:${now}`,
    side: "runner",
    lifecycle: "active",
    origin: "forced_run",
    objective: runnerRunPlanTestObjective(targetServerId),
    targetServer: { id: targetServerId },
    accessIntent: {
      server: targetServerId,
      expectedAccessCount: 1,
      stealAgendaPolicy: "steal_if_affordable",
      trashPolicy: "trash_if_value_positive",
      reserveForStealOrTrash: 0,
    },
    runStartActionId: "test_harness_existing_run",
    sourceTacticalGoalIds: ["test_harness_existing_run"],
    sourceStrategyEvidence: ["test_harness_existing_run:true"],
    budget: {
      availableCredits: input.playerView.own.credits,
      runOnlyCredits: run.badPublicityCredits ?? 0,
      recurringBreakerCredits: 0,
      recurringKillerCredits: 0,
      recurringLinkCredits: 0,
      stealthCredits: 0,
      nonNoisyBreakerCredits: 0,
      reservedCreditsAfterRun: 0,
      reservedCreditsForSteal: 0,
      reservedCreditsForTrash: 0,
      damageSafetyReserve: {
        minimumGripAfterRun: 0,
        preventionCreditsReserved: 0,
        evidence: [],
      },
      tagSafetyReserve: {
        minimumCreditsAfterTags: 0,
        expectedTagCount: 0,
        evidence: [],
      },
    },
    reserve: {
      minimumCreditsAfterRun: 0,
      minimumGripAfterRun: 0,
      preserveStealOrTrashCredits: 0,
      evidence: [],
    },
    pathQuote: {
      server: targetServerId,
      quoteStatus: "unknown",
      iceQuotes: [],
      totalKnownCost: 0,
      expectedUnknownCost: 0,
      expectedRemainingCredits: input.playerView.own.credits,
      reserveViolation: false,
      canReachAccess: true,
      requiredSequences: [],
    },
    ...runnerRunPlanCurrentEncounterForTestInput(input, targetServerId),
    revalidation: {
      status: "valid",
      reasons: ["test_harness_existing_run"],
      checkedAtStateVersion: now,
    },
    abortPolicy: {
      allowJackOutWhenLegal: true,
      abortBelowCredits: 0,
      abortReasons: [],
    },
    visibilityEvidence: [{ kind: "player_view", ref: "run" }],
    debug: {
      summary: `Test RunPlan auf ${targetServerId}`,
      items: ["test_harness_existing_run:true"],
    },
    createdAtStateVersion: now,
    updatedAtStateVersion: now,
  };
  return {
    ...plan,
    pathQuote: quoteRunnerRunPath(input, plan),
  };
}

function runnerRunPlanTestObjective(
  serverId: RunnerRunPlanServerId,
): RunnerRunPlan["objective"] {
  if (serverId === "rd") return { kind: "access_rnd_top", expectedValue: 0 };
  if (serverId === "hq") return { kind: "access_hq_card", expectedValue: 0 };
  if (serverId === "archives") {
    return { kind: "access_archives", expectedValue: 0 };
  }
  return { kind: "contest_remote_agenda", urgency: 0 };
}

function runnerRunPlanCurrentEncounterForTestInput(
  input: AiDecisionInput,
  serverId: RunnerRunPlanServerId,
): Pick<RunnerRunPlan, "currentEncounter"> {
  const run = input.playerView.run;
  if (!run) return {};
  const phase =
    run.phase === "approach_ice" ||
    run.phase === "encounter_ice" ||
    run.phase === "access"
      ? run.phase
      : "movement";
  const iceInstanceId =
    run.encounteredIce?.instanceId ?? run.approachedIce?.instanceId;
  return {
    currentEncounter: {
      server: serverId,
      phase,
      ...(iceInstanceId ? { iceInstanceId } : {}),
      ...(run.position?.kind === "ice"
        ? { iceIndex: run.position.iceIndex }
        : {}),
    },
  };
}

function isRunnerRunPlanServerId(
  value: string,
): value is RunnerRunPlanServerId {
  return (
    value === "hq" ||
    value === "rd" ||
    value === "archives" ||
    /^remote_\d+$/.test(value)
  );
}

const originalSemanticAiRuntimeMode = process.env.NETGRID_SEMANTIC_AI_RUNTIME;

beforeEach(() => {
  process.env.NETGRID_SEMANTIC_AI_RUNTIME = "legacy";
  resetTacticalPlanMemory();
});

afterEach(() => {
  resetTacticalPlanMemory();
  if (originalSemanticAiRuntimeMode === undefined) {
    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
  } else {
    process.env.NETGRID_SEMANTIC_AI_RUNTIME = originalSemanticAiRuntimeMode;
  }
});

type TestAiDecisionInputOptions = Omit<
  Parameters<typeof buildAiDecisionInputRuntime>[2],
  "ownDeckSnapshot"
> & {
  ownDeckSnapshot?: AiDeckStrategyDeckSnapshot;
};

function buildAiDecisionInput(
  state: GameState,
  side: Side,
  options: TestAiDecisionInputOptions = {},
): ReturnType<typeof buildAiDecisionInputRuntime> {
  return buildAiDecisionInputRuntime(state, side, {
    ...options,
    ownDeckSnapshot:
      options.ownDeckSnapshot ??
      snapshotById(defaultTestSnapshotIdForSide(side)),
  });
}

describe("MVP 0.3 AI controller contract", () => {
  afterEach(() => {
    delete DEMO_CARDS_BY_ID.test_hidden_runner_resource_harness;
    delete DEMO_CARDS_BY_ID.test_planless_corp_operation;
    delete DEMO_CARDS_BY_ID.test_planless_runner_resource;
    delete DEMO_CARDS_BY_ID.test_alpha_planless_runner_resource;
    delete DEMO_CARDS_BY_ID.test_zeta_planless_runner_resource;
    delete DEMO_CARDS_BY_ID.test_zeta_planless_corp_operation;
    delete DEMO_CARDS_BY_ID.test_expensive_fracter;
    delete DEMO_CARDS_BY_ID.test_low_value_program;
  });

  it("builds side-safe AI inputs with required deck snapshots and without forbidden transport fields", () => {
    const state = createGameAfterSetup({ seed: "ai-contract" });
    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });

    expect(corpInput.side).toBe("corp");
    expect(runnerInput.side).toBe("runner");
    for (const field of AI_DECISION_INPUT_TOP_LEVEL_FIELDS) {
      expect(corpInput).toHaveProperty(field);
      expect(runnerInput).toHaveProperty(field);
    }
    expect(corpInput).not.toHaveProperty("ownDeckDoctrine");
    expect(runnerInput).not.toHaveProperty("ownDeckDoctrine");
    expect(
      (corpInput as AiDecisionInputWithDeckCapabilities).ownDeckStrategyProfile
        ?.deckId,
    ).toBe("demo_corp_008_snapshot_v0_8");
    expect(
      (runnerInput as AiDecisionInputWithDeckCapabilities)
        .ownDeckStrategyProfile?.deckId,
    ).toBe("demo_runner_008_snapshot_v0_8");
    expect(
      (corpInput as AiDecisionInputWithDeckCapabilities).ownDeckStrategyProfile
        ?.warnings,
    ).not.toContain("strategy_profile:neutral_missing_snapshot");
    expect(
      (runnerInput as AiDecisionInputWithDeckCapabilities)
        .ownDeckStrategyProfile?.warnings,
    ).not.toContain("strategy_profile:neutral_missing_snapshot");
    expect(
      (corpInput as AiDecisionInputWithDeckCapabilities)
        .ownStrategicIntentState,
    ).toBeDefined();
    expect(
      (runnerInput as AiDecisionInputWithDeckCapabilities)
        .ownStrategicIntentState,
    ).toBeDefined();
    expect(corpInput.legalActions).toEqual(getLegalActions(state, "corp"));
    expect(runnerInput.playerView).toEqual(getPlayerView(state, "runner"));
    expect(JSON.stringify(corpInput)).not.toContain("cardInstances");
    expect(JSON.stringify(corpInput)).not.toContain("sessionToken");
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
  });

  it("rejects normal AI decision input without ownDeckSnapshot", () => {
    const state = createGameAfterSetup({
      seed: "ai-contract-missing-snapshot",
    });

    expect(() =>
      buildAiDecisionInputRuntime(state, "corp", {
        difficulty: "normal",
      } as never),
    ).toThrow(/ai_deck_snapshot_missing/);
  });

  it("projects side-safe deck strategy runtime fields for both sides when snapshots are present", () => {
    const state = createGameAfterSetup({ seed: "ai-strategic-runtime-input" });
    const corpInput = buildAiDecisionInput(state, "corp", {
      ownDeckSnapshot: snapshotById("demo_corp_008_snapshot_v0_8"),
    }) as AiDecisionInputWithDeckCapabilities;
    const runnerInput = buildAiDecisionInput(state, "runner", {
      ownDeckSnapshot: snapshotById("demo_runner_008_snapshot_v0_8"),
    }) as AiDecisionInputWithDeckCapabilities;

    expect(corpInput.ownStrategicIntentState).toMatchObject({
      side: "corp",
      source: {
        plannerEffect: "goal_and_plan_input",
        actionGeneration: "none",
        hiddenInfoPolicy: "player_view_only",
      },
    });
    expect(corpInput.ownStrategicIntentState?.targetVector.evidence).toContain(
      "target_source:runtime_context",
    );
    expect(corpInput.ownStrategicIntentState?.reserve.evidence).toContain(
      "reserve_source:runtime_context",
    );
    expect(corpInput.ownDeckStrategyProfile).toMatchObject({
      side: "corp",
      source: {
        mode: "ai_internal_strategy_profile",
        plannerEffect: "strategic_intent_input",
      },
    });
    expect(corpInput.ownDeckDoctrineV2Diagnostic).toMatchObject({
      side: "corp",
      scope: "diagnostic_only",
      productiveUseAllowed: false,
      source: {
        mode: "report_only",
        plannerEffect: "none",
      },
    });
    expect(corpInput.ownCorpStrategicIntent).toMatchObject({
      side: "corp",
      source: {
        strategicIntentState: "strategic_intent_state_v1",
        plannerEffect: "runtime_projection",
      },
    });
    expect(corpInput.ownRunnerStrategicIntent).toBeUndefined();
    expect(runnerInput.ownDeckDoctrineV2Diagnostic).toMatchObject({
      side: "runner",
      scope: "diagnostic_only",
      productiveUseAllowed: false,
      source: {
        mode: "report_only",
        plannerEffect: "none",
      },
    });
    expect(runnerInput.ownDeckStrategyProfile).toMatchObject({
      side: "runner",
      source: {
        mode: "ai_internal_strategy_profile",
        plannerEffect: "strategic_intent_input",
      },
    });
    expect(runnerInput.ownStrategicIntentState?.side).toBe("runner");
    expect(
      runnerInput.ownStrategicIntentState?.targetVector.evidence,
    ).toContain("target_source:runtime_context");
    expect(runnerInput.ownStrategicIntentState?.reserve.evidence).toContain(
      "reserve_source:runtime_context",
    );
    expect(runnerInput.ownRunnerStrategicIntent?.side).toBe("runner");
    expect(runnerInput.ownCorpStrategicIntent).toBeUndefined();
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
  });

  it("chooses productive actions from engine-built deck strategy runtime inputs", () => {
    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const assertProductiveRuntimeDecision = (
      input: AiDecisionInputWithDeckCapabilities,
      decision: ReturnType<typeof chooseCorpAction>,
    ) => {
      expect(input.ownDeckStrategyProfile?.source.plannerEffect).toBe(
        "strategic_intent_input",
      );
      expect(input.ownDeckDoctrineV2Diagnostic).toMatchObject({
        scope: "diagnostic_only",
        productiveUseAllowed: false,
        source: { mode: "report_only", plannerEffect: "none" },
      });
      expect(input.ownStrategicIntentState?.source.plannerEffect).toBe(
        "goal_and_plan_input",
      );
      expect(input.ownStrategicIntentState?.targetVector.evidence).toContain(
        "target_source:runtime_context",
      );
      expect(input.ownStrategicIntentState?.reserve.evidence).toContain(
        "reserve_source:runtime_context",
      );
      expect(input.legalActions.map((action) => action.actionId)).toContain(
        decision.actionId,
      );
      expect(decision.fallbackUsed).toBe(false);
      expect(decision.evidence).toEqual(
        expect.arrayContaining([
          "semantic_runtime_default:true",
          "strategic_intent_memory_preview_only:true",
        ]),
      );
      expect(
        decision.decisionDebug?.detailSections?.map((section) => section.id),
      ).toEqual(
        expect.arrayContaining(["strategic_runtime", "selection_score"]),
      );
      expect(
        JSON.stringify({
          input,
          decisionDebug: decision.decisionDebug,
        }),
      ).not.toMatch(
        /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState|secretGripIds/i,
      );
      expect(assertAiInputIsSideSafe(input)).toBe(true);
    };

    const corpInput = buildAiDecisionInput(
      createGameAfterSetup({ seed: "ai-productive-runtime-corp" }),
      "corp",
      {
        ownDeckSnapshot: snapshotById("demo_corp_008_snapshot_v0_8"),
      },
    ) as AiDecisionInputWithDeckCapabilities;
    const corpDecision = chooseCorpAction(corpInput, {
      persistTacticalPlanMemory: false,
    });
    assertProductiveRuntimeDecision(corpInput, corpDecision);

    const runnerInput = buildAiDecisionInput(
      toRunnerTurn(
        createGameAfterSetup({ seed: "ai-productive-runtime-runner" }),
      ),
      "runner",
      {
        ownDeckSnapshot: snapshotById("demo_runner_008_snapshot_v0_8"),
      },
    ) as AiDecisionInputWithDeckCapabilities;
    const runnerDecision = chooseRunnerAction(runnerInput, {
      persistTacticalPlanMemory: false,
    });
    assertProductiveRuntimeDecision(runnerInput, runnerDecision);
  });

  it("keeps release-default profile policy stable", () => {
    const state = createGameAfterSetup({ seed: "ai-release-default-policy" });
    const corpInput = buildAiDecisionInput(state, "corp");
    const runnerInput = buildAiDecisionInput(state, "runner");
    const benchmarkProfiles = listV143BenchmarkProfiles().map(
      (profile) => profile.benchmarkProfileId,
    );
    const benchmark = runMatchProgressionBenchmark({
      includeHoldout: false,
      maxActions: 1,
      comparisonProfiles: ["random_legal_bot", "current_candidate"],
    });

    expect(corpInput.profileId).toBe("corp-ai-v0.9-normal");
    expect(runnerInput.profileId).toBe("runner-ai-v0.9-normal");
    expect(benchmarkProfiles).toContain("random_legal_bot");
    expect(benchmarkProfiles).toContain("current_candidate");
    expect(benchmark.baselineProfile).toBe("random_legal_bot");
    expect(benchmark.candidateProfile).toBe("current_candidate");
    expect(benchmark.profileComparisons.map((entry) => entry.profile)).toEqual([
      "current_candidate",
      "random_legal_bot",
    ]);
  });

  it("redacts hidden Runner Resources in Corp AIInput before reveal", () => {
    const hiddenResourceDefinitionId = "test_hidden_runner_resource_harness";
    const hiddenResourceTitle = "Hidden Resource Harness";
    DEMO_CARDS_BY_ID[hiddenResourceDefinitionId] ??= {
      id: hiddenResourceDefinitionId,
      title: hiddenResourceTitle,
      side: "runner",
      type: "resource",
      subtypes: ["hidden"],
      implementationStatus: "playable_mvp",
      installCost: 1,
      rulesText:
        "Harness-only hidden Runner resource for side-safe install and trash tests.",
      mechanics: [
        "install_resource",
        "resource",
        "hidden_runner_resource_foundation",
        "test_fixture",
      ],
    } satisfies CardDefinition;
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-hidden-runner-resource" }),
    );
    state.runner.credits = 6;
    const hiddenResourceId = "runner_test_hidden_resource_harness_0";
    state.cardInstances[hiddenResourceId] = {
      instanceId: hiddenResourceId,
      definitionId: hiddenResourceDefinitionId,
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "grip" },
      faceup: true,
      rezzed: true,
      advancementCounters: 0,
      strengthModifier: 0,
    };
    state.runner.grip.unshift(hiddenResourceId);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === hiddenResourceId,
    );
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.corp.credits = 5;
    state.runner.tags = 1;

    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const hiddenSlot = corpInput.playerView.opponent.rig?.find(
      (card) => card.known === false,
    );
    const inputJson = JSON.stringify(corpInput);

    expect(hiddenSlot).toMatchObject({
      known: false,
      type: "resource",
      subtypes: ["hidden_runner_resource"],
      owner: "runner",
      controller: "runner",
    });
    expect(hiddenSlot?.instanceId).toMatch(/^hidden_runner_resource_/);
    expect(hiddenSlot?.instanceId).not.toBe(hiddenResourceId);
    expect(corpInput.legalActions).toContainEqual(
      expect.objectContaining({
        type: "trash_resource",
        label: "Verdeckte Runner-Resource trashen",
        payload: expect.objectContaining({
          hiddenResourceSlotId: hiddenSlot?.instanceId,
          redactedKind: "hidden_runner_resource",
        }),
      }),
    );
    expect(inputJson).toContain("hidden_runner_resource");
    expect(inputJson).not.toContain(hiddenResourceDefinitionId);
    expect(inputJson).not.toContain(hiddenResourceTitle);
    expect(inputJson).not.toContain(hiddenResourceId);
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
  });

  it("constructs AI inputs from positive DTO fields for both perspectives", () => {
    const state = createGameAfterSetup({ seed: "ai-positive-dto" });
    const runnerPlayerView = structuredClone(
      getPlayerView(state, "runner"),
    ) as ReturnType<typeof getPlayerView> & { secretRunnerHandIds?: string[] };
    runnerPlayerView.secretRunnerHandIds = ["hidden-runner-card-id"];
    (
      runnerPlayerView.own as typeof runnerPlayerView.own & {
        secretGripIds?: string[];
      }
    ).secretGripIds = ["hidden-grip-id"];
    (
      runnerPlayerView.own.identity as VisibleCard & {
        secretIdentityToken?: string;
      }
    ).secretIdentityToken = "hidden-identity-token";
    const runnerEvents = runnerPlayerView.publicEvents.map((event) => ({
      ...event,
      secretEventIds: ["hidden-event-id"],
      privatePayload: {
        runner: { secretRunnerHandIds: ["hidden-event-card-id"] },
      },
    }));
    const runnerLegalActions = getLegalActions(state, "runner").map(
      (action) => ({
        ...action,
        secretPaymentToken: "hidden-action-token",
      }),
    );

    const runnerInput = buildAiDecisionInputDto({
      side: "runner",
      playerView: runnerPlayerView,
      eventTail: runnerEvents,
      legalActions: runnerLegalActions,
      difficulty: "normal",
      seed: state.seed,
      decisionId: "ai-positive-dto:runner",
      actionNumber: state.stateVersion,
      profileId: "runner-ai-v0.9-normal",
    });
    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const serializedRunner = JSON.stringify(runnerInput);

    expect(serializedRunner).not.toContain("secretRunnerHandIds");
    expect(serializedRunner).not.toContain("hidden-grip-id");
    expect(serializedRunner).not.toContain("hidden-identity-token");
    expect(serializedRunner).not.toContain("hidden-event-id");
    expect(serializedRunner).not.toContain("hidden-action-token");
    expect(
      runnerInput.eventTail.some((event) => "privatePayload" in event),
    ).toBe(false);
    expect(
      runnerInput.legalActions.some((action) => "secretPaymentToken" in action),
    ).toBe(false);
    for (const field of AI_DECISION_INPUT_TOP_LEVEL_FIELDS) {
      expect(corpInput).toHaveProperty(field);
    }
    expect(corpInput).not.toHaveProperty("ownDeckDoctrine");
    expect(
      (corpInput as AiDecisionInputWithDeckCapabilities).ownDeckStrategyProfile
        ?.warnings,
    ).not.toContain("strategy_profile:neutral_missing_snapshot");
    expect(
      (corpInput as AiDecisionInputWithDeckCapabilities).ownDeckStrategyProfile
        ?.deckId,
    ).toBe("demo_corp_008_snapshot_v0_8");
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
  });

  it("redacts nested forbidden DTO payload fields through allowlisted shapes for both perspectives", () => {
    for (const side of ["runner", "corp"] as const) {
      const state =
        side === "runner"
          ? toRunnerTurn(
              createGameAfterSetup({ seed: `ai-nested-dto-${side}` }),
            )
          : createGameAfterSetup({ seed: `ai-nested-dto-${side}` });
      const playerView = structuredClone(getPlayerView(state, side));
      const baseAction = getLegalActions(state, side)[0];
      if (!baseAction) throw new Error(`Missing ${side} LegalAction`);
      playerView.pendingChoice = {
        choiceId: `ai_nested_choice_${side}`,
        side,
        source: "ai_nested_payload_allowlist",
        prompt: "Side-safe test choice",
        kind: "select_option",
        options: [
          {
            id: "safe_option",
            label: "Safe option",
            publicLabel: "Safe option",
            value: {
              privatePayload: { [side]: { gripOrHq: ["hidden-card"] } },
            } as unknown as string,
            selectable: true,
            card: {
              instanceId: "visible-test-card",
              known: true,
              title: "Visible Test Card",
              definitionId: "simple_run_event",
              type: "event",
              privateTitle: "Hidden Priority Agenda",
            } as VisibleCard & { privateTitle: string },
            privatePayload: { sessionToken: "hidden-session-token" },
          } as NonNullable<
            typeof playerView.pendingChoice
          >["options"][number] & {
            privatePayload: Record<string, unknown>;
          },
        ],
        minSelections: 1,
        maxSelections: 1,
        stateVersion: playerView.stateVersion,
        visibility: "private_to_side",
        stackSearchResolution: {
          reveal: "public",
          destination: "grip",
          shuffleAfter: true,
          publicRevealKind: "safe_reveal",
          privatePayload: { decklist: ["hidden-deck-card"] },
        } as NonNullable<
          typeof playerView.pendingChoice
        >["stackSearchResolution"] & {
          privatePayload: Record<string, unknown>;
        },
      };
      const eventTail: PublicGameEvent[] = [
        {
          eventId: `ai-nested-event-${side}`,
          type: "start_run",
          stateVersionBefore: state.stateVersion,
          stateVersionAfter: state.stateVersion + 1,
          stateHashAfter: "fnv1a:aiNestedDto",
          visibilityClass: "public",
          publicPayload: {
            actor: side,
            actionType: "start_run",
            serverId: "rd",
            abilityFamily: "run-access",
            abilityId: "ai_nested_safe_run",
            effectKind: "run",
            amounts: {
              randomRoll: 4,
              privatePayload: "hidden-roll-source",
            },
            targets: {
              serverLabel: "R&D",
              decklist: ["hidden-deck-card"],
            },
            visibility: {
              class: "public",
              hiddenZoneBarrier: true,
              privatePayload: "hidden-visibility",
            },
            privatePayload: { [side]: { gripOrHq: ["hidden-card"] } },
            cardInstances: { hidden: { definitionId: "simple_agenda" } },
            fullGameState: { stateVersion: 999 },
            decisionDebug: { hidden: "debug-hidden-card" },
            sessionToken: "hidden-session-token",
          },
        },
      ];
      const legalActions = [
        {
          ...baseAction,
          payload: {
            ...(baseAction.payload ?? {}),
            serverId: "rd",
            placement: "ice",
            encounterContinue: true,
            delayedInstallAbility: "set_aside_from_grip",
            privatePayload: { [side]: { gripOrHq: ["hidden-card"] } },
            cardInstances: { hidden: { definitionId: "simple_agenda" } },
            fullGameState: { stateVersion: 999 },
            reconnectToken: "hidden-reconnect-token",
          },
        } as unknown as LegalAction,
      ];

      const input = buildAiDecisionInputDto({
        side,
        playerView,
        eventTail,
        legalActions,
        difficulty: "normal",
        seed: state.seed,
        decisionId: `ai-nested-dto:${side}`,
        actionNumber: state.stateVersion,
        profileId: `${side}-ai-v1.4.2-normal`,
      });
      const serialized = JSON.stringify(input);

      expect(input.legalActions[0]?.payload).toMatchObject({
        serverId: "rd",
        placement: "ice",
        encounterContinue: true,
        delayedInstallAbility: "set_aside_from_grip",
      });
      expect(input.eventTail[0]?.publicPayload).toMatchObject({
        actor: side,
        actionType: "start_run",
        serverId: "rd",
        abilityFamily: "run-access",
        abilityId: "ai_nested_safe_run",
        effectKind: "run",
        amounts: { randomRoll: 4 },
        targets: { serverLabel: "R&D" },
        visibility: { class: "public", hiddenZoneBarrier: true },
      });
      expect(input.playerView.pendingChoice?.options[0]).toMatchObject({
        id: "safe_option",
        publicLabel: "Safe option",
        selectable: true,
        card: {
          instanceId: "visible-test-card",
          definitionId: "simple_run_event",
        },
      });
      expect(input.playerView.pendingChoice?.options[0]).not.toHaveProperty(
        "value",
      );
      expect(input.playerView.pendingChoice?.stackSearchResolution).toEqual({
        reveal: "public",
        destination: "grip",
        shuffleAfter: true,
        publicRevealKind: "safe_reveal",
      });
      expect(serialized).not.toMatch(
        /privatePayload|cardInstances|fullGameState|decisionDebug|decklist|sessionToken|reconnectToken|Hidden Priority Agenda|hidden-card|hidden-deck-card/i,
      );
      expect(assertAiInputIsSideSafe(input)).toBe(true);
    }
  });

  it("keeps AI choices stable when nested forbidden payload fields are injected", () => {
    for (const side of ["runner", "corp"] as const) {
      const state =
        side === "runner"
          ? toRunnerTurn(
              createGameAfterSetup({ seed: `ai-nested-choice-${side}` }),
            )
          : createGameAfterSetup({ seed: `ai-nested-choice-${side}` });
      const cleanInput = buildAiDecisionInput(state, side, {
        difficulty: "normal",
        profileId: `${side}-ai-v1.4.2-normal`,
      });
      const taintedPlayerView = {
        ...cleanInput.playerView,
        publicEvents: cleanInput.playerView.publicEvents.map((event) => ({
          ...event,
          publicPayload: {
            ...event.publicPayload,
            privatePayload: { [side]: { gripOrHq: ["hidden-card"] } },
            cardInstances: { hidden: { definitionId: "simple_agenda" } },
            fullGameState: { stateVersion: 999 },
          },
        })),
      };
      const taintedLegalActions = cleanInput.legalActions.map(
        (action) =>
          ({
            ...action,
            payload: {
              ...(action.payload ?? {}),
              privatePayload: { [side]: { gripOrHq: ["hidden-card"] } },
              cardInstances: { hidden: { definitionId: "simple_agenda" } },
              fullGameState: { stateVersion: 999 },
            },
          }) as unknown as LegalAction,
      );
      const taintedInput = buildAiDecisionInputDto({
        side,
        playerView: taintedPlayerView,
        eventTail: taintedPlayerView.publicEvents,
        legalActions: taintedLegalActions,
        difficulty: cleanInput.difficulty,
        seed: cleanInput.seed,
        decisionId: `${cleanInput.decisionId}:tainted`,
        actionNumber: cleanInput.actionNumber,
        profileId: cleanInput.profileId,
      });
      const cleanDecision = chooseAiAction(cleanInput);
      const taintedDecision = chooseAiAction(taintedInput);

      expect(taintedDecision.actionId).toBe(cleanDecision.actionId);
      expect(taintedDecision.reasonCode).toBe(cleanDecision.reasonCode);
      expect(JSON.stringify(taintedInput)).not.toMatch(
        /privatePayload|cardInstances|fullGameState|hidden-card/i,
      );
      expect(assertAiInputIsSideSafe(taintedInput)).toBe(true);
    }
  });

  it("marks longtail completion cards AI-supported after every promotion gate", () => {
    const cardsById = createRuntimeCardsById();
    const longtailCardIds = [
      "onr_v1_026_false-echo",
      "onr_v1_075_zetatech-software-installer",
      "onr_v1_298_planning-consultants",
    ];

    expect(activeAiApprovedCardIds).toEqual(
      expect.arrayContaining(longtailCardIds),
    );
    for (const cardId of longtailCardIds) {
      const runtimeCard = cardsById[cardId];
      expect(runtimeCard?.statuses.ai_supported ?? false, cardId).toBe(true);
      expect(runtimeCard?.statuses.human_playable ?? false, cardId).toBe(true);
      expect(runtimeCard?.statuses.deck_legal ?? false, cardId).toBe(true);
    }
  });

  it("resolves active AI-supported visible ICE and breakers for run analysis", () => {
    const cardsById = createRuntimeCardsById();
    const activeVisibleRunCards = Object.values(cardsById).filter(
      (card) =>
        card.statuses.ai_supported &&
        (card.type === "ice" || isRuntimeBreakerCard(card)),
    );
    const coverageRows = activeVisibleRunCards
      .map((card) => ({
        cardId: card.catalogCardId,
        engineCardId: card.engineCardId ?? card.catalogCardId,
        role: card.type === "ice" ? "ice" : "breaker",
        resolved: Boolean(
          DEMO_CARDS_BY_ID[card.engineCardId ?? card.catalogCardId],
        ),
        etrSubroutines:
          card.type === "ice"
            ? endTheRunSubroutineCount(card.catalogCardId)
            : 0,
        strength: cardDefinitionStrength(card.catalogCardId),
      }))
      .sort(
        (left, right) =>
          left.role.localeCompare(right.role) ||
          left.cardId.localeCompare(right.cardId),
      );
    const iceRows = coverageRows.filter((row) => row.role === "ice");
    const breakerRows = coverageRows.filter((row) => row.role === "breaker");

    expect(iceRows.length).toBeGreaterThan(0);
    expect(breakerRows.length).toBeGreaterThan(0);
    expect(iceRows.some((row) => row.etrSubroutines > 0)).toBe(true);
    expect(coverageRows.filter((row) => !row.resolved)).toEqual([]);
    expect(
      representativeVisibleRunPairs.map((pair) => ({
        role: pair.role,
        breakerId: pair.breakerId,
        iceId: pair.iceId,
        canBreak: canBreakerDefinitionBreakIce(pair.breakerId, pair.iceId),
      })),
    ).toEqual([
      {
        role: "barrier-wall with fracter",
        breakerId: "onr_v1_021_dwarf",
        iceId: "onr_v1_279_wall-of-static",
        canBreak: true,
      },
      {
        role: "code gate with decoder",
        breakerId: "onr_v1_014_codecracker",
        iceId: "onr_v1_261_quandary",
        canBreak: true,
      },
      {
        role: "sentry with killer",
        breakerId: "onr_v1_023_evil-twin",
        iceId: "onr_v1_259_in-the-face",
        canBreak: true,
      },
    ]);
  });

  it("assesses representative O:NR visible ICE and breakers from runtime card shapes", () => {
    const cardsById = createRuntimeCardsById();

    for (const pair of representativeVisibleRunPairs) {
      const ice = runtimeVisibleIce(cardsById[pair.iceId]);
      const breaker = runtimeVisibleBreaker(cardsById[pair.breakerId]);
      const endTheRunCount = endTheRunSubroutineCount(pair.iceId);
      const breakAssessment = minimumCreditsToBreakEndTheRunSubroutines(
        ice,
        [breaker],
        endTheRunCount,
        new Map(),
      );
      const affordable = assessKnownRezzedIcePath(
        [ice],
        [breaker],
        pair.expectedCost,
      );
      const unaffordable = assessKnownRezzedIcePath(
        [ice],
        [breaker],
        pair.expectedCost - 1,
      );

      expect(endTheRunCount, pair.role).toBeGreaterThan(0);
      expect(breakAssessment, pair.role).toMatchObject({
        cost: pair.expectedCost,
        breakerInstanceId: breaker.instanceId,
        endingStrength: pair.expectedEndingStrength,
      });
      expect(affordable, pair.role).toMatchObject({
        blocked: false,
        visibleBreakCost: pair.expectedCost,
      });
      expect(unaffordable.blocked, pair.role).toBe(true);
      expect(unaffordable.visibleBreakCost, pair.role).toBe(pair.expectedCost);
    }
  });

  it("counts effective break and pay-or-end costs from an engine run quote", () => {
    const cardsById = createRuntimeCardsById();
    const effectiveRunQuote = {
      iceInstanceId: "ai_visible_crystal_wall",
      iceDefinitionId: "onr_v1_232_crystal-wall",
      effectiveStrength: 3,
      subroutines: [
        { id: "catalog_onr_v1_232_crystal_wall_etr", type: "end_the_run" },
        {
          id: "card_implementation.onr_v1_370_tesseract-fort-construction.additional_subroutine.1.end_the_run_unless_runner_pays",
          type: "end_the_run_unless_runner_pays",
          amount: 1,
          sourceDefinitionId: "onr_v1_370_tesseract-fort-construction",
          sourceTitle: "Tesseract Fort Construction",
          dynamicSourceKind: "additional_subroutine",
        },
      ],
      breakSubroutineAdditionalCostPerSubroutine: 1,
      breakSubroutineCostSourceDefinitionIds: [
        "onr_v1_355_crystal-palace-station-grid",
      ],
      breakSubroutineCostSourceTitles: ["Crystal Palace Station Grid"],
    } satisfies VisibleEffectiveIceRunQuote;
    const ice = {
      ...runtimeVisibleIce(cardsById["onr_v1_232_crystal-wall"]),
      effectiveRunQuote,
    };
    const breaker = runtimeVisibleBreaker(cardsById["onr_v1_021_dwarf"]);

    expect(assessKnownRezzedIcePath([ice], [breaker], 2)).toMatchObject({
      blocked: true,
      visibleBreakCost: 3,
    });
    expect(assessKnownRezzedIcePath([ice], [breaker], 3)).toMatchObject({
      blocked: false,
      visibleBreakCost: 3,
    });
  });

  it("projects known rezzed ICE paths sequentially through later ICE", () => {
    const cardsById = createRuntimeCardsById();
    const outerSentry = runtimeVisibleIce(cardsById["onr_v1_259_in-the-face"]);
    const innerCodeGate = runtimeVisibleIce(cardsById["onr_v1_261_quandary"]);
    const killer = runtimeVisibleBreaker(cardsById["onr_v1_023_evil-twin"]);
    const decoder = runtimeVisibleBreaker(cardsById["onr_v1_014_codecracker"]);

    expect(assessKnownRezzedIcePath([outerSentry], [killer], 4)).toEqual({
      blocked: false,
      visibleBreakCost: 3,
      canReachAccess: true,
      knownPathBlockedByUnbreakableIce: false,
      knownPathBlockedByMissingCoverage: false,
      knownPathBlockedByEtr: false,
      creditsAfterPath: 1,
      canBreakNextIceButNotFullPath: false,
      hasBypassOrSpecialAccessPlan: false,
      reachableAccessReason: "known_path_reachable",
      creditsSpentBeforeUnpayableIce: 0,
      assessedKnownIceCount: 1,
    });
    expect(assessKnownRezzedIcePath([innerCodeGate], [decoder], 4)).toEqual({
      blocked: false,
      visibleBreakCost: 2,
      canReachAccess: true,
      knownPathBlockedByUnbreakableIce: false,
      knownPathBlockedByMissingCoverage: false,
      knownPathBlockedByEtr: false,
      creditsAfterPath: 2,
      canBreakNextIceButNotFullPath: false,
      hasBypassOrSpecialAccessPlan: false,
      reachableAccessReason: "known_path_reachable",
      creditsSpentBeforeUnpayableIce: 0,
      assessedKnownIceCount: 1,
    });
    expect(
      assessKnownRezzedIcePath(
        [innerCodeGate, outerSentry],
        [killer, decoder],
        4,
      ),
    ).toEqual({
      blocked: true,
      visibleBreakCost: 5,
      canReachAccess: false,
      knownPathBlockedByUnbreakableIce: false,
      knownPathBlockedByMissingCoverage: false,
      knownPathBlockedByEtr: true,
      creditsAfterPath: -1,
      canBreakNextIceButNotFullPath: true,
      unpayableIceIndex: 0,
      hasBypassOrSpecialAccessPlan: false,
      noAccessReason: "known_path_unpayable",
      creditsSpentBeforeUnpayableIce: 3,
      assessedKnownIceCount: 2,
      unpayableReason: "later_ice_unaffordable_after_prior_ice_cost",
    });
  });

  it("projects Tutor's unbroken run-duration ETR onto later ICE before choosing access reachability", () => {
    const cardsById = createRuntimeCardsById();
    const innerTooManyDoors = runtimeVisibleIce(
      cardsById["onr_v1_272_too-many-doors"],
    );
    const outerTutor = {
      ...runtimeVisibleIce(cardsById["onr_v1_274_tutor"]),
      effectiveRunQuote: {
        iceInstanceId: "ai_visible_outer_tutor",
        iceDefinitionId: "onr_v1_274_tutor",
        effectiveStrength: 5,
        subroutines: [
          {
            id: "catalog_onr_v1_274_tutor_future_end_the_run",
            type: "set_run_future_end_the_run_subroutine",
            unbrokenRunEffect: { addsFutureEndTheRunSubroutines: 1 },
          },
        ],
      } satisfies VisibleEffectiveIceRunQuote,
    };
    const codecracker = runtimeVisibleBreaker(
      cardsById["onr_v1_014_codecracker"],
    );
    const evilTwin = runtimeVisibleBreaker(cardsById["onr_v1_023_evil-twin"]);

    expect(
      assessKnownRezzedIcePath([innerTooManyDoors, outerTutor], [], 9),
    ).toMatchObject({
      blocked: true,
      canReachAccess: false,
      knownPathBlockedByMissingCoverage: true,
      missingCoverage: ["sentry"],
      unbreakableIceTitle: "Too Many Doors",
    });
    expect(
      assessKnownRezzedIcePath(
        [innerTooManyDoors, outerTutor],
        [codecracker],
        5,
      ),
    ).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleBreakCost: 5,
      creditsAfterPath: 0,
    });
    expect(
      assessKnownRezzedIcePath([innerTooManyDoors, outerTutor], [evilTwin], 3),
    ).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleBreakCost: 3,
      creditsAfterPath: 0,
    });
  });

  it("blocks the visible Viral 15 R&D path before counting Haunting Inquisition as safe access", () => {
    const cardsById = createRuntimeCardsById();
    const innerVirizz = runtimeVisibleIce(cardsById["onr_v1_277_virizz"]);
    const middleHaunting = runtimeVisibleIce(
      cardsById["onr_v1_247_haunting-inquisition"],
    );
    const outerViral15 = runtimeVisibleIce(cardsById["onr_v1_276_viral-15"]);
    const cyfermaster = runtimeVisibleBreaker(
      cardsById["onr_v1_016_cyfermaster"],
    );
    const rig = [
      { ...cyfermaster, instanceId: "cyfermaster_visible_1" },
      { ...cyfermaster, instanceId: "cyfermaster_visible_2" },
      {
        instanceId: "force_shield_visible",
        definitionId: "onr_v1_028_force-shield",
        known: true,
        type: "program",
        subtypes: [],
      },
    ] satisfies VisibleCard[];

    const assessment = assessKnownRezzedIcePath(
      [innerVirizz, middleHaunting, outerViral15],
      rig,
      5,
    );

    expect(assessment).toMatchObject({
      blocked: true,
      canReachAccess: false,
      knownPathBlockedByHardUnbrokenEffect: true,
      hardUnbrokenRunEffects: ["damage_or_program_trash"],
      noAccessReason: "harmful_unbroken_run_effect",
      hardUnbrokenEffectIceIndex: 2,
      hardUnbrokenEffectIceTitle: "Viral 15",
      missingCoverage: ["sentry"],
    });
    expect(assessment.visibleBreakCost).not.toBe(3);
  });

  it("treats a non-ETR harmful visible subroutine as unsafe when it cannot be broken", () => {
    const harmfulCodeGate = {
      definitionId: "onr_v1_261_quandary",
      known: true,
      rezzed: true,
      subtypes: ["code_gate"],
      strength: 2,
      effectiveRunQuote: {
        iceInstanceId: "synthetic_harmful_code_gate",
        iceDefinitionId: "onr_v1_261_quandary",
        effectiveStrength: 2,
        subroutines: [
          {
            id: "synthetic_run_lock",
            type: "set_runner_run_lock_actions",
            amount: 2,
            unbrokenRunEffect: { createsRunLockOrActionTax: 2 },
          },
        ],
      } satisfies VisibleEffectiveIceRunQuote,
    };

    expect(assessKnownRezzedIcePath([harmfulCodeGate], [], 6)).toMatchObject({
      blocked: true,
      canReachAccess: false,
      knownPathBlockedByHardUnbrokenEffect: true,
      hardUnbrokenRunEffects: ["run_lock_or_action_tax"],
      noAccessReason: "harmful_unbroken_run_effect",
      missingCoverage: ["code_gate"],
    });
  });

  it("classifies known rezzed ETR ICE without breaker coverage as unbreakable no-access", () => {
    const cardsById = createRuntimeCardsById();
    const dataWall = runtimeVisibleIce(cardsById["onr_v1_237_data-wall"]);

    expect(assessKnownRezzedIcePath([dataWall], [], 6)).toMatchObject({
      blocked: true,
      canReachAccess: false,
      knownPathBlockedByUnbreakableIce: true,
      knownPathBlockedByMissingCoverage: true,
      knownPathBlockedByEtr: true,
      unpayableReason: "ice_unbreakable",
      noAccessReason: "missing_breaker_coverage",
      unbreakableIceIndex: 0,
      unbreakableIceTitle: "Data Wall",
      missingCoverage: ["wall"],
    });
  });

  it("does not count Dropp as access-reachable ETR breaker coverage", () => {
    const cardsById = createRuntimeCardsById();
    const dataWall = runtimeVisibleIce(cardsById["onr_v1_237_data-wall"]);
    const dropp = runtimeVisibleBreaker(cardsById["onr_v1_019_dropp"]);

    expect(
      canBreakerDefinitionBreakIce("onr_v1_019_dropp", "onr_v1_237_data-wall"),
    ).toBe(false);
    expect(
      minimumCreditsToBreakEndTheRunSubroutines(
        dataWall,
        [dropp],
        endTheRunSubroutineCount("onr_v1_237_data-wall"),
        new Map(),
      ),
    ).toBeUndefined();
    expect(assessKnownRezzedIcePath([dataWall], [dropp], 6)).toMatchObject({
      blocked: true,
      canReachAccess: false,
      knownPathBlockedByUnbreakableIce: true,
      knownPathBlockedByMissingCoverage: true,
      knownPathBlockedByEtr: true,
      noAccessReason: "missing_breaker_coverage",
    });
  });

  it("ignores visible root identities unless the engine exposes an effective quote", () => {
    const cardsById = createRuntimeCardsById();
    const ice = runtimeVisibleIce(cardsById["onr_v1_232_crystal-wall"]);
    const breaker = runtimeVisibleBreaker(cardsById["onr_v1_021_dwarf"]);
    const root = [
      {
        instanceId: "ai_unrezzed_tesseract",
        known: false,
        type: "upgrade",
        rezzed: false,
      },
    ] satisfies VisibleCard[];

    expect(assessKnownRezzedIcePath([ice], [breaker], 1, root)).toMatchObject({
      blocked: false,
      visibleBreakCost: 1,
    });
  });

  it("passes generic effective ICE quotes through AI input without hidden root leaks", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-effective-run-quote-encoder",
        runnerDeck: batchARunnerDeck(),
        corpDeck: {
          id: "ai_effective_run_quote_encoder_corp",
          name: "AI Effective Run Quote Encoder Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_261_quandary", quantity: 1 },
            { id: "onr_v1_320_encoder-inc", quantity: 1 },
            { id: "simple_agenda", quantity: 6 },
            { id: "simple_economy_operation", quantity: 6 },
          ],
        },
      }),
    );
    ensureRemoteServer(state, "remote_1");
    const quandaryId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_261_quandary",
    );
    const encoderId = putCorpRootInRemote(state, "onr_v1_320_encoder-inc", 0);
    state.cardInstances[quandaryId] = {
      ...state.cardInstances[quandaryId]!,
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[encoderId] = {
      ...state.cardInstances[encoderId]!,
      faceup: true,
      rezzed: true,
    };

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const quote = input.playerView.servers.find(
      (server) => server.id === "remote_1",
    )?.ice[0]?.effectiveRunQuote;
    expect(quote?.subroutines.map((subroutine) => subroutine.type)).toEqual([
      "end_the_run",
      "end_the_run",
    ]);
    expect(quote?.subroutines[1]).toMatchObject({
      sourceDefinitionId: "onr_v1_320_encoder-inc",
      sourceTitle: "Encoder, Inc.",
      dynamicSourceKind: "additional_subroutine",
    });

    state = structuredClone(state);
    state.cardInstances[encoderId] = {
      ...state.cardInstances[encoderId]!,
      faceup: false,
      rezzed: false,
    };
    const hiddenInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const hiddenQuote = hiddenInput.playerView.servers.find(
      (server) => server.id === "remote_1",
    )?.ice[0]?.effectiveRunQuote;
    const hiddenJson = JSON.stringify(hiddenInput);
    expect(
      hiddenQuote?.subroutines.some(
        (subroutine) =>
          subroutine.sourceDefinitionId === "onr_v1_320_encoder-inc",
      ),
    ).toBe(false);
    expect(hiddenJson).not.toContain("Encoder, Inc.");
    expect(hiddenJson).not.toContain("onr_v1_320_encoder-inc");
    expect(assertAiInputIsSideSafe(hiddenInput)).toBe(true);
  });

  it("counts Tutor's active run-duration subroutine in runner visible path costs", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-visible-run-quote-tutor",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "ai_visible_run_quote_tutor_runner",
          name: "AI Visible Run Quote Tutor Runner",
          cards: [
            { id: "onr_v1_031_hammer", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "ai_visible_run_quote_tutor_corp",
          name: "AI Visible Run Quote Tutor Corp",
          cards: [
            { id: "onr_v1_274_tutor", quantity: 1 },
            { id: "onr_v1_279_wall-of-static", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 10;
    moveRunnerProgramToRig(state, "onr_v1_031_hammer");
    const innerWallId = putCorpIceOnServer(
      state,
      "rd",
      "onr_v1_279_wall-of-static",
    );
    const tutorId = putCorpIceOnServer(state, "rd", "onr_v1_274_tutor");
    for (const id of [innerWallId, tutorId]) {
      state.cardInstances[id] = {
        ...state.cardInstances[id]!,
        faceup: true,
        rezzed: true,
      };
    }

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const rdServer = input.playerView.servers.find(
      (server) => server.id === "rd",
    );
    const innerWallQuote = rdServer?.ice.find(
      (ice) => ice.instanceId === innerWallId,
    )?.effectiveRunQuote;

    expect(
      innerWallQuote?.subroutines.map((subroutine) => subroutine.type),
    ).toEqual(["end_the_run", "end_the_run"]);
    expect(innerWallQuote?.subroutines[1]).toMatchObject({
      sourceDefinitionId: "onr_v1_274_tutor",
      sourceTitle: "Tutor",
      dynamicSourceKind: "run_duration_additional_subroutine",
    });
    expect(
      assessKnownRezzedIcePath(
        rdServer?.ice ?? [],
        input.playerView.own.rig ?? [],
        1,
        rdServer?.root ?? [],
      ),
    ).toMatchObject({ blocked: true, visibleBreakCost: 2 });
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("counts Virizz's active run-duration break tax in runner visible path costs", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-visible-run-quote-virizz",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "ai_visible_run_quote_virizz_runner",
          name: "AI Visible Run Quote Virizz Runner",
          cards: [
            { id: "onr_v1_031_hammer", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "ai_visible_run_quote_virizz_corp",
          name: "AI Visible Run Quote Virizz Corp",
          cards: [
            { id: "onr_v1_277_virizz", quantity: 1 },
            { id: "onr_v1_279_wall-of-static", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 10;
    moveRunnerProgramToRig(state, "onr_v1_031_hammer");
    const innerWallId = putCorpIceOnServer(
      state,
      "rd",
      "onr_v1_279_wall-of-static",
    );
    const virizzId = putCorpIceOnServer(state, "rd", "onr_v1_277_virizz");
    for (const id of [innerWallId, virizzId]) {
      state.cardInstances[id] = {
        ...state.cardInstances[id]!,
        faceup: true,
        rezzed: true,
      };
    }

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const rdServer = input.playerView.servers.find(
      (server) => server.id === "rd",
    );
    const innerWallQuote = rdServer?.ice.find(
      (ice) => ice.instanceId === innerWallId,
    )?.effectiveRunQuote;

    expect(innerWallQuote).toMatchObject({
      breakSubroutineAdditionalCostPerSubroutine: 1,
    });
    expect(
      assessKnownRezzedIcePath(
        rdServer?.ice ?? [],
        input.playerView.own.rig ?? [],
        1,
        rdServer?.root ?? [],
      ),
    ).toMatchObject({ blocked: true, visibleBreakCost: 2 });
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("keeps active Tutor run-duration effects in later effective ICE quotes", () => {
    let state = runDurationIceEncounterState(
      "ai-effective-quote-active-tutor",
      ["onr_v1_052_raffles", "onr_v1_031_hammer"],
      ["onr_v1_274_tutor", "onr_v1_279_wall-of-static"],
    );
    moveRunnerCardToGrip(state, "onr_v1_052_raffles");
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    state = installRunnerCard(state, "onr_v1_052_raffles");
    state = installRunnerCard(state, "onr_v1_031_hammer");
    state.runner.credits = 8;
    const wallId = putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    const tutorId = putCorpIceOnServer(state, "rd", "onr_v1_274_tutor");

    state = startAndRezOuterIce(state, "rd", tutorId);
    state = continueRunAction(state);
    expect(state.run?.futureEncounterEndTheRunSourceIceId).toBe(tutorId);

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const quote = input.playerView.servers
      .find((server) => server.id === "rd")
      ?.ice.find((ice) => ice.instanceId === wallId)?.effectiveRunQuote;

    expect(quote?.subroutines.map((subroutine) => subroutine.type)).toEqual([
      "end_the_run",
      "end_the_run",
    ]);
    expect(quote?.subroutines[1]).toMatchObject({
      sourceDefinitionId: "onr_v1_274_tutor",
      dynamicSourceKind: "run_duration_additional_subroutine",
    });
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("breaks a visible Tutor run-duration subroutine when it would add an unaffordable future ETR", () => {
    let state = runDurationIceEncounterState(
      "ai-tutor-run-duration-must-break",
      ["onr_v1_052_raffles", "onr_v1_031_hammer"],
      ["onr_v1_274_tutor", "onr_v1_279_wall-of-static"],
    );
    moveRunnerCardToGrip(state, "onr_v1_052_raffles");
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    state = installRunnerCard(state, "onr_v1_052_raffles");
    state = installRunnerCard(state, "onr_v1_031_hammer");
    const wallId = putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    const tutorId = putCorpIceOnServer(state, "rd", "onr_v1_274_tutor");
    state.runner.credits = 1;
    const rafflesId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_052_raffles",
    );
    if (!rafflesId) throw new Error("Missing Raffles");
    state.cardInstances[rafflesId] = {
      ...state.cardInstances[rafflesId]!,
      strengthModifier: 1,
    };

    state = startAndRezOuterIce(state, "rd", tutorId);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(selected?.type).toBe("break_subroutine");
    expect(decision.reasonCode).toBe(
      "runner.encounter.break_run_remainder_effect",
    );
    expect(decision.evidence).toContain(
      "adds_future_end_the_run_subroutines:true",
    );
    expect(decision.evidence).toContain("run_remainder_effect_must_break:true");
  });

  it("lets a Tutor future-effect subroutine fire when Tutor is the last ICE", () => {
    let state = runDurationIceEncounterState(
      "ai-tutor-last-ice-no-future-effect",
      ["onr_v1_039_krash"],
      ["onr_v1_274_tutor", "simple_upgrade"],
    );
    moveRunnerCardToGrip(state, "onr_v1_039_krash");
    state = installRunnerCard(state, "onr_v1_039_krash");
    ensureRemoteServer(state, "remote_1");
    const tutorId = putCorpIceOnServer(state, "remote_1", "onr_v1_274_tutor");
    state.runner.credits = 12;

    state = startAndRezOuterIce(state, "remote_1", tutorId);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const pump = input.legalActions.find(
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_039_krash",
    );
    const continueRun = input.legalActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(pump).toBeDefined();
    expect(continueRun).toBeDefined();
    expect(selected?.type).toBe("continue_run");
    expect([
      "runner.encounter.continue",
      "runner.plan.safe_probe_run",
    ]).toContain(decision.reasonCode);
    if (!pump || !continueRun)
      throw new Error("Missing Tutor last-ICE fixture actions");
    const baselineDecision = chooseRunnerBaselineAction({
      ...input,
      legalActions: [pump, continueRun],
    });
    expect(baselineDecision.actionId).toBe(continueRun.actionId);
    expect(baselineDecision.evidence).toContain(
      "unbroken_run_effect_ignored_because_no_remaining_ice:true",
    );
    expect(baselineDecision.evidence).toContain(
      "future_effect_remaining_ice:0",
    );
    expect(baselineDecision.evidence).not.toContain(
      "run_remainder_effect_must_break:true",
    );
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("does not partially pump for a Tutor future-effect break that cannot be completed", () => {
    let state = runDurationIceEncounterState(
      "ai-tutor-future-effect-no-partial-pump",
      ["onr_v1_052_raffles", "onr_v1_031_hammer"],
      ["onr_v1_274_tutor", "onr_v1_279_wall-of-static"],
    );
    moveRunnerCardToGrip(state, "onr_v1_052_raffles");
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    state = installRunnerCard(state, "onr_v1_052_raffles");
    state = installRunnerCard(state, "onr_v1_031_hammer");
    const wallId = putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    const tutorId = putCorpIceOnServer(state, "rd", "onr_v1_274_tutor");
    state.runner.credits = 2;

    state = startAndRezOuterIce(state, "rd", tutorId);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const pump = input.legalActions.find(
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_052_raffles",
    );
    const continueRun = input.legalActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );
    expect(pump).toBeDefined();
    expect(continueRun).toBeDefined();
    if (!pump || !continueRun)
      throw new Error("Missing Tutor partial-pump fixture actions");

    const decision = chooseRunnerBaselineAction({
      ...input,
      legalActions: [pump, continueRun],
    });
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(selected?.type).toBe("continue_run");
    expect(decision.reasonCode).toMatch(/^runner\.encounter\.continue/);
  });

  it("breaks a visible Virizz run-duration subroutine when future break taxes block the path", () => {
    let state = runDurationIceEncounterState(
      "ai-virizz-run-duration-must-break",
      ["onr_v1_015_codeslinger", "onr_v1_031_hammer"],
      ["onr_v1_277_virizz", "onr_v1_278_wall-of-ice"],
    );
    moveRunnerCardToGrip(state, "onr_v1_015_codeslinger");
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    state = installRunnerCard(state, "onr_v1_015_codeslinger");
    state = installRunnerCard(state, "onr_v1_031_hammer");
    const wallId = putCorpIceOnServer(state, "rd", "onr_v1_278_wall-of-ice");
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    const virizzId = putCorpIceOnServer(state, "rd", "onr_v1_277_virizz");
    state.runner.credits = 3;
    for (const breakerId of state.runner.rig.programs) {
      const definitionId = state.cardInstances[breakerId]?.definitionId;
      if (definitionId === "onr_v1_015_codeslinger")
        state.cardInstances[breakerId] = {
          ...state.cardInstances[breakerId]!,
          strengthModifier: 1,
        };
      if (definitionId === "onr_v1_031_hammer")
        state.cardInstances[breakerId] = {
          ...state.cardInstances[breakerId]!,
          strengthModifier: 4,
        };
    }

    state = startAndRezOuterIce(state, "rd", virizzId);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(selected?.type).toBe("break_subroutine");
    expect(decision.reasonCode).toBe(
      "runner.encounter.break_run_remainder_effect",
    );
    expect(decision.evidence).toContain("increases_future_break_cost:true");
    expect(decision.evidence).toContain("run_remainder_effect_must_break:true");
  });

  it("may continue through a visible run-duration subroutine when the future path stays affordable", () => {
    let state = runDurationIceEncounterState(
      "ai-run-duration-affordable-probe",
      ["onr_v1_031_hammer"],
      ["onr_v1_277_virizz", "onr_v1_279_wall-of-static"],
    );
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    state = installRunnerCard(state, "onr_v1_031_hammer");
    const wallId = putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    const virizzId = putCorpIceOnServer(state, "rd", "onr_v1_277_virizz");
    state.runner.credits = 8;

    state = startAndRezOuterIce(state, "rd", virizzId);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const continueRun = input.legalActions.find(
      (action) => action.type === "continue_run",
    );
    expect(continueRun).toBeDefined();
    if (!continueRun) throw new Error("Missing continue action");
    const decision = chooseRunnerBaselineAction({
      ...input,
      legalActions: [continueRun],
    });

    expect(decision.actionId).toBe(continueRun.actionId);
    expect(decision.evidence).toContain("run_remainder_subroutine_effect:true");
    expect(decision.evidence).toContain(
      "future_path_blocked_if_unbroken:false",
    );
    expect(decision.evidence).not.toContain(
      "run_remainder_effect_must_break:true",
    );
  });

  it("does not try to pay Washed-Up Solo Construct with 0 credits", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-washed-up-vs-trash-program-no-credit",
        runnerDeck: {
          id: "ai-washed-up-vs-trash-program-runner-no-credit",
          name: "AI Washed-Up Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "simple_decoder", quantity: 1 },
            { id: "simple_economy_event", quantity: 6 },
          ],
        },
        corpDeck: {
          id: "ai-washed-up-vs-trash-program-corp-no-credit",
          name: "AI Washed-Up Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "simple_agenda", quantity: 2 },
            { id: "onr_proteus_045_washed-up-solo-construct", quantity: 1 },
            { id: "simple_barrier_ice", quantity: 1 },
            { id: "simple_economy_operation", quantity: 4 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    const decoderId = moveRunnerCardToGrip(state, "simple_decoder");
    state = installRunnerCard(state, "simple_decoder");
    state.runner.credits = 0;
    ensureRemoteServer(state, "remote_1");
    const secondIceId = putCorpIceOnServer(
      state,
      "remote_1",
      "simple_barrier_ice",
    );
    const washedUpId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_proteus_045_washed-up-solo-construct",
    );

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === washedUpId,
    );
    expect(state.run?.encounteredIceId).toBe(washedUpId);
    expect(state.runner.rig.programs).toContain(decoderId);

    const legalRunnerActions = getLegalActions(state, "runner");
    const payForWashedUpActionFromEngine = legalRunnerActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true &&
        action.costs.some((cost) => cost.credits === 1),
    );
    expect(payForWashedUpActionFromEngine).toBeUndefined();

    const encounterInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const decision = chooseRunnerAction(encounterInput);
    const selectedDecision = encounterInput.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    expect(selectedDecision).toBeDefined();
    if (!selectedDecision) throw new Error("Missing selected action");
    expect(selectedDecision.costs.some((cost) => cost.credits === 1)).toBe(
      false,
    );
    expect(decision.reasonCode).toMatch(/^runner\./);

    state = apply(
      state,
      "runner",
      (action) => action.actionId === selectedDecision.actionId,
    );
    expect(selectedDecision.costs.some((cost) => cost.credits === 1)).toBe(
      false,
    );
    if (state.run?.phase === "encounter_ice") {
      expect(state.run.encounteredIceId === washedUpId).toBe(true);
      expect(
        state.run.encounteredIceId === secondIceId ||
          state.run?.approachedIceId === secondIceId,
      ).toBe(true);
    }
  });

  it("does not pay Washed-Up Solo Construct when no program is installed", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-washed-up-vs-trash-program-no-installed",
        runnerDeck: {
          id: "ai-washed-up-vs-trash-program-runner-no-installed",
          name: "AI Washed-Up Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "simple_decoder", quantity: 1 },
            { id: "simple_economy_event", quantity: 6 },
          ],
        },
        corpDeck: {
          id: "ai-washed-up-vs-trash-program-corp-no-installed",
          name: "AI Washed-Up Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "simple_agenda", quantity: 2 },
            { id: "onr_proteus_045_washed-up-solo-construct", quantity: 1 },
            { id: "simple_barrier_ice", quantity: 1 },
            { id: "simple_economy_operation", quantity: 4 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 5;
    ensureRemoteServer(state, "remote_1");
    const secondIceId = putCorpIceOnServer(
      state,
      "remote_1",
      "simple_barrier_ice",
    );
    const washedUpId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_proteus_045_washed-up-solo-construct",
    );

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === washedUpId,
    );
    expect(state.run?.encounteredIceId).toBe(washedUpId);
    expect(state.runner.rig.programs).toHaveLength(0);

    const legalRunnerActions = getLegalActions(state, "runner");
    const payForWashedUpActionFromEngine = legalRunnerActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true &&
        action.payload?.encounterWillEndRun === false &&
        action.costs.some((cost) => cost.credits === 1),
    );
    expect(payForWashedUpActionFromEngine).toBeDefined();
    expect(
      typeof payForWashedUpActionFromEngine?.payload
        ?.payOrTrashProgramSubroutinePayment,
    ).toBe("number");
    expect(
      payForWashedUpActionFromEngine?.payload
        ?.payOrTrashProgramSubroutineIndexes,
    ).toBe("0");

    const encounterInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const decision = chooseRunnerAction(encounterInput);
    const paidOrUnpaidDecision = encounterInput.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    expect(paidOrUnpaidDecision).toBeDefined();
    expect(paidOrUnpaidDecision?.costs.some((cost) => cost.credits === 1)).toBe(
      false,
    );
    expect(decision.reasonCode).toMatch(/^runner\./);

    const creditsBefore = state.runner.credits;
    const heapBefore = state.runner.heap.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === decision.actionId,
    );
    expect(state.runner.credits).toBe(creditsBefore);
    expect(state.runner.rig.programs).toHaveLength(0);
    expect(state.runner.heap).toHaveLength(heapBefore);
    if (state.run?.phase === "encounter_ice" && state.run.encounteredIceId) {
      expect(
        state.run.encounteredIceId === secondIceId ||
          state.run.encounteredIceId === washedUpId,
      ).toBe(true);
    }
  });

  it("pays 1 credit on Washed-Up Solo Construct instead of trashing an installed program", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-washed-up-vs-trash-program",
        runnerDeck: {
          id: "ai-washed-up-vs-trash-program-runner",
          name: "AI Washed-Up Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "simple_decoder", quantity: 2 },
            { id: "simple_economy_event", quantity: 6 },
          ],
        },
        corpDeck: {
          id: "ai-washed-up-vs-trash-program-corp",
          name: "AI Washed-Up Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "simple_agenda", quantity: 3 },
            {
              id: "onr_proteus_045_washed-up-solo-construct",
              quantity: 1,
            },
            { id: "simple_barrier_ice", quantity: 1 },
            { id: "simple_economy_operation", quantity: 4 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    const decoderId = moveRunnerCardToGrip(state, "simple_decoder");
    state = installRunnerCard(state, "simple_decoder");
    state.runner.credits = 5;
    state.corp.credits = 12;
    ensureRemoteServer(state, "remote_1");
    const secondIceId = putCorpIceOnServer(
      state,
      "remote_1",
      "simple_barrier_ice",
    );
    const washedUpId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_proteus_045_washed-up-solo-construct",
    );

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === washedUpId,
    );
    expect(state.run?.encounteredIceId).toBe(washedUpId);
    expect(state.runner.rig.programs).toContain(decoderId);
    const legalRunnerActions = getLegalActions(state, "runner");
    const payForWashedUpActionFromEngine = legalRunnerActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true &&
        action.costs.some((cost) => cost.credits === 1),
    );
    if (!payForWashedUpActionFromEngine) {
      throw new Error(
        `Engine missing Washed-Up pay action. continue actions: ${JSON.stringify(
          legalRunnerActions
            .filter((action) => action.type === "continue_run")
            .map((action) => ({
              costs: action.costs,
              payload: action.payload,
            })),
        )} timingPoint:${state.timingPoint} run:${JSON.stringify(
          state.run?.phase,
        )}`,
      );
    }

    const encounterInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const payForWashedUpAction = encounterInput.legalActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true &&
        action.payload?.encounterWillEndRun === false &&
        action.costs.some((cost) => cost.credits === 1),
    );
    if (!payForWashedUpAction)
      throw new Error(
        `Missing Washed-Up pay action in AI input. actions: ${JSON.stringify(
          encounterInput.legalActions
            .filter((action) => action.type === "continue_run")
            .map((action) => ({
              costs: action.costs,
              payload: action.payload,
            })),
        )}`,
      );

    expect(
      typeof payForWashedUpAction.payload?.payOrTrashProgramSubroutineIndexes,
    ).toBe("string");
    expect(
      payForWashedUpAction.payload?.payOrTrashProgramSubroutinePayment,
    ).toBe(1);

    const noPayForWashedUpAction = encounterInput.legalActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true &&
        action.payload?.encounterWillEndRun === false &&
        action.costs.length === 0,
    );
    expect(noPayForWashedUpAction).toBeDefined();

    const decision = chooseRunnerAction(encounterInput);
    const paidDecision = encounterInput.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    if (!paidDecision)
      throw new Error(
        `Missing paid action from AI decision: ${decision.actionId}`,
      );

    expect(paidDecision.type).toBe("continue_run");
    expect(paidDecision.payload?.encounterWillEndRun).toBe(false);
    expect(decision.actionId).toBe(payForWashedUpAction.actionId);
    expect(paidDecision.costs.some((cost) => cost.credits === 1)).toBe(
      payForWashedUpAction.costs.some((cost) => cost.credits === 1),
    );
    expect(decision.actionId).toBe(paidDecision.actionId);

    const creditsBefore = state.runner.credits;
    const heapBefore = state.runner.heap.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === paidDecision.actionId,
    );

    expect(state.runner.credits).toBe(creditsBefore - 1);
    expect(state.runner.rig.programs).toContain(decoderId);
    expect(state.runner.heap).toHaveLength(heapBefore);
    expect(state.runner.heap).not.toContain(decoderId);

    expect(decision.evidence).not.toContain(
      "run_remainder_effect_must_break:true",
    );

    for (let index = 0; index < 4; index += 1) {
      if (
        !state.run ||
        state.run.phase !== "encounter_ice" ||
        state.run.encounteredIceId !== washedUpId
      )
        break;
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
    }
    expect(state.run?.approachedIceId === secondIceId).toBe(true);
    expect(
      state.run?.encounteredIceId === secondIceId ||
        state.run?.approachedIceId === secondIceId,
    ).toBe(true);
  });

  it("continues toward a remote payoff after paying Washed-Up before unrezzed ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-washed-up-continues-to-remote-payoff",
        runnerDeck: {
          id: "ai-washed-up-payoff-runner",
          name: "AI Washed-Up Payoff Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "simple_decoder", quantity: 2 },
            { id: "simple_economy_event", quantity: 6 },
          ],
        },
        corpDeck: {
          id: "ai-washed-up-payoff-corp",
          name: "AI Washed-Up Payoff Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "simple_agenda", quantity: 4 },
            {
              id: "onr_proteus_045_washed-up-solo-construct",
              quantity: 1,
            },
            { id: "simple_barrier_ice", quantity: 1 },
            { id: "simple_economy_operation", quantity: 4 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    const decoderId = moveRunnerCardToGrip(state, "simple_decoder");
    state = installRunnerCard(state, "simple_decoder");
    state.runner.credits = 5;
    state.corp.credits = 12;
    putCorpRootInServer(state, "remote_1", "simple_agenda", 2);
    const secondIceId = putCorpIceOnServer(
      state,
      "remote_1",
      "simple_barrier_ice",
    );
    const washedUpId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_proteus_045_washed-up-solo-construct",
    );

    const preRunInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const startDecision = chooseRunnerAction(preRunInput);
    const startAction = preRunInput.legalActions.find(
      (action) => action.actionId === startDecision.actionId,
    );
    expect(startAction?.type).toBe("start_run");
    expect(startAction?.payload?.serverId).toBe("remote_1");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === startDecision.actionId,
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === washedUpId,
    );

    const encounterInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const encounterDecision = chooseRunnerAction(encounterInput);
    const paidWashedUpAction = encounterInput.legalActions.find(
      (action) => action.actionId === encounterDecision.actionId,
    );
    expect(paidWashedUpAction?.type).toBe("continue_run");
    expect(paidWashedUpAction?.costs.some((cost) => cost.credits === 1)).toBe(
      true,
    );

    const creditsBeforePayment = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === encounterDecision.actionId,
    );
    expect(state.runner.credits).toBe(creditsBeforePayment - 1);
    expect(state.runner.rig.programs).toContain(decoderId);
    expect(state.runner.heap).not.toContain(decoderId);

    for (let index = 0; index < 4; index += 1) {
      if (
        !state.run ||
        state.run.phase !== "encounter_ice" ||
        state.run.encounteredIceId !== washedUpId
      )
        break;
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
    }
    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(state.run?.approachedIceId).toBe(secondIceId);

    const continuationInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const continuationDecision = chooseRunnerAction(continuationInput);
    const continuationAction = continuationInput.legalActions.find(
      (action) => action.actionId === continuationDecision.actionId,
    );

    expect(continuationAction?.type).toBe("continue_run");
    expect(continuationDecision.reasonCode).toBe("runner.plan.safe_probe_run");
    expect(continuationDecision.evidence).toContain(
      "remote_score_threat_visible:true",
    );
  });

  it("keeps visible run analysis invariant across hidden-info variants", () => {
    const cardsById = createRuntimeCardsById();
    const ice = runtimeVisibleIce(cardsById["onr_v1_261_quandary"]);
    const breaker = runtimeVisibleBreaker(cardsById["onr_v1_014_codecracker"]);
    const hiddenIceVariant = {
      ...ice,
      hiddenDefinitionId: "simple_agenda",
      privatePayload: { corp: ["hidden-hq-card"] },
    } as typeof ice;
    const hiddenBreakerVariant = {
      ...breaker,
      privatePayload: { runner: ["hidden-stack-card"] },
    } as VisibleCard;

    expect(
      assessKnownRezzedIcePath([hiddenIceVariant], [hiddenBreakerVariant], 2),
    ).toEqual(assessKnownRezzedIcePath([ice], [breaker], 2));
  });

  it("keeps decisions deterministic and always chooses legal action ids", () => {
    const state = createGameAfterSetup({ seed: "ai-deterministic" });
    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });

    const first = chooseAiAction(input);
    const second = chooseAiAction(input);

    expect(first).toEqual(second);
    expect(
      input.legalActions.some((action) => action.actionId === first.actionId),
    ).toBe(true);
    expect(first.reasonCode).toBe("corp.mandatory_draw");
    expect(first.explanation).not.toContain("Simple Fracter");
  });

  it("uses deterministic fallback when no heuristic matches", () => {
    const state = createGameAfterSetup({ seed: "ai-fallback" });
    const input = buildAiDecisionInput(state, "corp");
    const fallbackOnly = {
      ...input,
      legalActions: [
        {
          ...input.legalActions[0]!,
          type: "play_event" as const,
          actionId: "z.event",
        },
      ],
    };

    const decision = chooseCorpAction(fallbackOnly);

    expect(decision.actionId).toBe("z.event");
    expect(decision.fallbackUsed).toBe(true);
    expect(decision.reasonCode).toBe("fallback.first_legal_action");
  });

  it("keeps V0.93 pending choices inside the side-safe LegalActions contract", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v093-choice" }),
    );
    state.pendingChoice = choiceRequest(state, "runner");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const decision = chooseRunnerAction(input);

    expect(input.playerView.pendingChoice?.choiceId).toBe("choice_v093_runner");
    expect(input.legalActions.map((action) => action.type)).toEqual([
      "resolve_choice",
    ]);
    expect(decision.actionId).toBe(input.legalActions[0]?.actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.reasonCode).toBe("runner.choice.resolve");
    expect(decision.selectedChoices).toEqual({
      choiceId: "choice_v093_runner",
      selectedOptionIds: ["keep"],
    });
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(JSON.stringify(input)).not.toContain("cardInstances");
  });

  it("chooses search-card programs by visible value and ignores display-only options", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-search-choice-program-selection" }),
    );
    state.pendingChoice = {
      choiceId: "choice_search_program",
      side: "runner",
      source: "v1911.self_modifying_code_install_program:smc",
      prompt: "Programm aus dem Stack installieren",
      kind: "select_cards",
      options: [
        {
          id: "display_event",
          label: "Simple Economy Event",
          value: "event_1",
          selectable: false,
        },
        {
          id: "expensive_program",
          label: "Expensive Program",
          value: "expensive_1",
        },
        { id: "simple_decoder", label: "Simple Decoder", value: "decoder_1" },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion,
      visibility: "private_to_side",
      stackSearchResolution: {
        reveal: "public",
        destination: "install_program",
        shuffleAfter: true,
      },
    };
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const searchInput = {
      ...input,
      playerView: {
        ...input.playerView,
        own: {
          ...input.playerView.own,
          credits: 3,
          memoryUsed: 0,
          memoryLimit: 4,
        },
        pendingChoice: {
          ...input.playerView.pendingChoice!,
          options: [
            {
              id: "display_event",
              label: "Simple Economy Event",
              value: "event_1",
              selectable: false,
              card: {
                instanceId: "event_1",
                known: true,
                title: "Simple Economy Event",
                definitionId: "simple_economy_event",
                type: "event" as const,
                cost: 0,
              },
            },
            {
              id: "expensive_program",
              label: "Expensive Program",
              value: "expensive_1",
              card: {
                instanceId: "expensive_1",
                known: true,
                title: "Expensive Program",
                definitionId: "expensive_program",
                type: "program" as const,
                installCost: 8,
                memoryCost: 6,
              },
            },
            {
              id: "simple_decoder",
              label: "Simple Decoder",
              value: "decoder_1",
              card: {
                instanceId: "decoder_1",
                known: true,
                title: "Simple Decoder",
                definitionId: "simple_decoder",
                type: "program" as const,
                subtypes: ["Icebreaker", "Decoder"],
                installCost: 2,
                memoryCost: 1,
              },
            },
          ],
        },
      },
    };

    const decision = chooseRunnerAction(searchInput);

    expect(decision.reasonCode).toBe("runner.choice.resolve");
    expect(decision.selectedChoices).toEqual({
      choiceId: "choice_search_program",
      selectedOptionIds: ["simple_decoder"],
    });
    expect(JSON.stringify(decision)).not.toContain("display_event");
  });

  it("chooses a redundant low-value program for runner program install MU trash", () => {
    const fixture = runnerProgramTrashChoiceInput(
      "ai-program-install-trash-redundant",
      {
        sourceDefinitionId: "simple_decoder",
        installedDefinitionIds: ["simple_fracter", "v099_virus_program"],
        memoryUsed: 2,
        memoryLimit: 2,
      },
    );

    const decision = chooseRunnerAction(fixture.input);

    expect(decision.reasonCode).toBe("runner.choice.resolve");
    expect(decision.selectedChoices).toEqual({
      choiceId: fixture.input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: [fixture.optionIdsByDefinition.v099_virus_program!],
    });
    expect(decision.evidence).toContain(
      "choice_source:runner_program_trash_before_install",
    );
    expect(decision.evidence).toContain("program_sacrifice_best_category:low");
    expect(decision.evidence).toContain(
      "program_sacrifice_can_free_required:true",
    );
    expect(decision.evidence).toContain(
      "program_sacrifice_selected_category:low",
    );
    expect(JSON.stringify(decision)).not.toMatch(
      /cardInstances|privatePayload/,
    );
  });

  it("keeps countered or stored-value programs behind a low-value duplicate sacrifice", () => {
    DEMO_CARDS_BY_ID.test_low_value_program = {
      id: "test_low_value_program",
      title: "Test Low Value Program",
      side: "runner",
      type: "program",
      subtypes: [],
      implementationStatus: "playable_mvp",
      installCost: 0,
      memoryCost: 1,
      rulesText: "Test-only low-value program.",
      mechanics: [],
    } satisfies CardDefinition;
    const fixture = runnerProgramTrashChoiceInput(
      "ai-program-install-trash-countered-duplicate",
      {
        sourceDefinitionId: "simple_decoder",
        installedDefinitionIds: [
          "v099_virus_program",
          "test_low_value_program",
        ],
        memoryUsed: 2,
        memoryLimit: 2,
        mutateInstalledCard: (state, cardId, _definitionId, index) => {
          if (index !== 0) return;
          state.cardInstances[cardId] = {
            ...state.cardInstances[cardId]!,
            counters: {
              ...(state.cardInstances[cardId]?.counters ?? {}),
              virus: 4,
            },
          };
        },
      },
    );
    const lowValueProgramId = fixture.installedCardIds[1]!;

    const decision = chooseRunnerAction(fixture.input);

    expect(decision.selectedChoices).toEqual({
      choiceId: fixture.input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: [fixture.optionIdsByCardId[lowValueProgramId]!],
    });
    expect(decision.evidence).toContain(
      "program_sacrifice_counter_value_candidates:1",
    );
    expect(decision.evidence).toContain(
      "program_sacrifice_selected_candidates:1",
    );
    expect(decision.evidence).toContain(
      "program_sacrifice_selected_category:low",
    );
    expect(JSON.stringify(decision)).not.toMatch(
      /cardInstances|privatePayload/,
    );
  });

  it("protects the only visible installed breaker during runner program install MU trash", () => {
    const fixture = runnerProgramTrashChoiceInput(
      "ai-program-install-trash-protect-breaker",
      {
        sourceDefinitionId: "simple_decoder",
        installedDefinitionIds: ["simple_fracter"],
        memoryUsed: 1,
        memoryLimit: 1,
      },
    );

    const decision = chooseRunnerAction(fixture.input);

    expect(decision.selectedChoices).toEqual({
      choiceId: fixture.input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: [],
    });
    expect(decision.evidence).toContain("protected_icebreakers:1");
    expect(decision.evidence).toContain(
      "program_sacrifice_best_category:critical",
    );
    expect(decision.evidence).toContain(
      "program_sacrifice_can_free_required:false",
    );
  });

  it("does not choose an initial program install when only a critical sacrifice can free MU", () => {
    const state = toRunnerTurn(
      v105kCardReleaseGame("ai-program-install-critical-sacrifice-initial"),
    );
    moveRunnerProgramToRig(state, "onr_v1_015_codeslinger");
    moveRunnerCardToGrip(state, "onr_v1_052_raffles");
    state.runner.credits = 40;
    state.runner.clicks = 4;
    state.runner.memoryUsed = 1;
    state.runner.memoryLimit = 1;

    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const sourceCard = baseInput.playerView.own.gripOrHq.find(
      (card) => card.definitionId === "onr_v1_052_raffles",
    );
    expect(sourceCard).toBeDefined();
    if (!sourceCard) throw new Error("Missing source card");
    const installAction: LegalAction = {
      actionId: "test.runner.install_raffles_with_program_trash",
      side: "runner",
      type: "install_card",
      label: "Raffles mit Programmtrash installieren",
      source: sourceCard.instanceId,
      timingPoint: baseInput.playerView.timingPoint,
      costs: [{ clicks: 1, credits: sourceCard.installCost ?? 0 }],
      targetRequirements: [],
      visibility: "private_to_actor",
      expiresAtStateVersion: baseInput.playerView.stateVersion,
      payload: {
        cardId: sourceCard.instanceId,
        runnerProgramTrashBeforeInstall: true,
      },
    };
    const legalActions = [
      installAction,
      ...baseInput.legalActions.filter(
        (action) => action.actionId !== installAction.actionId,
      ),
    ];
    const input: AiDecisionInput = {
      ...baseInput,
      legalActions,
      playerView: {
        ...baseInput.playerView,
        legalActions,
      },
    };

    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const decision = chooseRunnerAction(input);

    expect(decision.actionId).not.toBe(installAction.actionId);
    const alternative = decision.decisionDebug?.actionAlternatives?.find(
      (entry) => entry.actionId === installAction.actionId,
    );
    expect(alternative?.excluded).toBe(true);
    expect(JSON.stringify(alternative)).toContain(
      "program_sacrifice_no_acceptable_candidate",
    );
    expect(JSON.stringify(alternative)).toContain(
      "program_sacrifice_best_category:critical",
    );
    expect(JSON.stringify(decision)).not.toMatch(
      /cardInstances|privatePayload/,
    );
  });

  it("does not voluntarily trash installed programs when runner program install has enough MU", () => {
    const fixture = runnerProgramTrashChoiceInput(
      "ai-program-install-trash-enough-mu",
      {
        sourceDefinitionId: "simple_decoder",
        installedDefinitionIds: ["v099_virus_program"],
        memoryUsed: 1,
        memoryLimit: 4,
      },
    );

    const decision = chooseRunnerAction(fixture.input);

    expect(decision.selectedChoices).toEqual({
      choiceId: fixture.input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: [],
    });
    expect(decision.evidence).toContain("memory_required:0");
  });

  it("avoids insufficient runner program install trash selections", () => {
    const fixture = runnerProgramTrashChoiceInput(
      "ai-program-install-trash-insufficient",
      {
        sourceDefinitionId: "simple_decoder",
        installedDefinitionIds: ["simple_fracter", "v099_virus_program"],
        memoryUsed: 2,
        memoryLimit: 1,
      },
    );

    const decision = chooseRunnerAction(fixture.input);

    expect(decision.selectedChoices).toEqual({
      choiceId: fixture.input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: [],
    });
    expect(decision.evidence).toContain("memory_required:2");
    expect(decision.evidence).toContain("protected_icebreakers:1");
  });

  it("uses The Shell Traders LegalActions and mandatory Shell-counter choices", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-shell-traders" }),
    );
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const prepare: LegalAction = {
      actionId: "runner.trigger_ability.shell_traders.prepare.simple_fracter",
      side: "runner",
      type: "trigger_ability",
      label: "The Shell Traders: Simple Fracter vorbereiten",
      source: "shell_traders_1",
      timingPoint: "runner_action.main",
      costs: [{ clicks: 1 }],
      targetRequirements: [],
      visibility: "private_to_actor",
      expiresAtStateVersion: state.stateVersion,
      payload: {
        cardId: "shell_traders_1",
        delayedInstallAbility: "set_aside_from_grip",
        targetCardId: "simple_fracter_1",
        shellCounterAmount: 2,
      },
    };
    const gain: LegalAction = {
      actionId: "runner.gain_credit.basic",
      side: "runner",
      type: "gain_credit",
      label: "1 Credit nehmen",
      source: "basic_action",
      timingPoint: "runner_action.main",
      costs: [{ clicks: 1 }],
      targetRequirements: [],
      visibility: "public",
      expiresAtStateVersion: state.stateVersion,
    };

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [gain, prepare],
    });

    expect(decision.actionId).toBe(prepare.actionId);
    expect(decision.reasonCode).toBe("runner.shell_traders.prepare_install");

    state.pendingChoice = {
      choiceId: "choice_shell_traders",
      side: "runner",
      source: "v1912.shell_traders_start_turn:shell_traders_1:1",
      prompt: "The Shell Traders: 1 Shell-Counter entfernen",
      kind: "select_cards",
      options: [
        {
          id: "card_decoder",
          label: "Simple Decoder (3)",
          value: "decoder_1",
          metadata: { shellTradersRemainingCounters: 3 },
        },
        {
          id: "card_fracter",
          label: "Simple Fracter (1)",
          value: "fracter_1",
          metadata: { shellTradersRemainingCounters: 1 },
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion,
      visibility: "public",
    };
    const choiceDecision = chooseRunnerAction(
      buildAiDecisionInput(state, "runner", { difficulty: "normal" }),
    );
    expect(choiceDecision.selectedChoices).toEqual({
      choiceId: "choice_shell_traders",
      selectedOptionIds: ["card_fracter"],
    });
  });

  it("plans installed The Shell Traders as build-rig progress before basic economy", () => {
    const input = runnerShellTradersInput(
      "ai-shell-traders-build-rig",
      (state) => {
        moveRunnerResourceCopyToRig(state, "onr_v1_176_the-shell-traders", 0);
        moveRunnerResourceCopyToRig(state, "onr_v1_176_the-shell-traders", 1);
        moveRunnerCardToGrip(state, "simple_fracter");
        moveRunnerCardToGrip(state, "simple_setup_hardware");
        state.runner.credits = 0;
        state.runner.clicks = 3;
      },
    );
    const prepare = input.legalActions.find(
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(prepare).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!prepare || !gainCredit)
      throw new Error("Missing Shell Traders fixture actions");

    const buildCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "build_rig",
    );
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [gainCredit, prepare],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(buildCandidate?.legalActionIds).toContain(prepare.actionId);
    expect(decision.actionId).toBe(prepare.actionId);
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
    expect(debugText).toContain("shell_traders:true");
    expect(debugText).toContain("shell_traders_kind:prepare");
    expect(debugText).not.toMatch(/cardInstances|privatePayload/i);
  });

  it("uses The Shell Traders remove-counter actions to finish delayed installs", () => {
    let state = runnerShellTradersState("ai-shell-traders-finish-install");
    moveRunnerResourceCopyToRig(state, "onr_v1_176_the-shell-traders", 0);
    const fracterId = moveRunnerCardToGrip(state, "simple_fracter");
    state.runner.credits = 2;
    state.runner.clicks = 3;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === fracterId,
    );
    setShellCountersForTest(state, fracterId, 1);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const remove = input.legalActions.find(
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "remove_shell_counter",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(remove).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!remove || !gainCredit)
      throw new Error("Missing Shell-counter removal actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [gainCredit, remove],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(remove.actionId);
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
    expect(debugText).toContain("shell_traders_kind:remove_counter");
    expect(debugText).toContain("shell_traders_immediate_install:true");
    expect(debugText).not.toMatch(/cardInstances|privatePayload/i);
  });

  it("finishes Shell Traders backlog before preparing more cards", () => {
    let state = runnerShellTradersState("ai-shell-traders-backlog-limit");
    moveRunnerResourceCopyToRig(state, "onr_v1_176_the-shell-traders", 0);
    moveRunnerResourceCopyToRig(state, "onr_v1_176_the-shell-traders", 1);
    const firstTargetId = moveRunnerCardToGrip(state, "simple_fracter");
    const secondTargetId = moveRunnerCardCopyToGrip(state, "simple_fracter", [
      firstTargetId,
    ]);
    state.runner.credits = 4;
    state.runner.clicks = 3;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === firstTargetId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === secondTargetId,
    );
    setShellCountersForTest(state, firstTargetId, 1);
    setShellCountersForTest(state, secondTargetId, 2);
    moveRunnerCardToGrip(state, "simple_setup_hardware");
    state.runner.credits = 1;
    state.runner.clicks = 3;
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const remove = input.legalActions.find(
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "remove_shell_counter",
    );
    const prepare = input.legalActions.find(
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(remove).toBeDefined();
    expect(prepare).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!remove || !prepare || !gainCredit)
      throw new Error("Missing Shell Traders backlog fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [prepare, remove, gainCredit],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(remove.actionId);
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
    expect(debugText).toContain("shell_traders_kind:remove_counter");
    expect(debugText).toContain("shell_traders_backlog:2");
    expect(debugText).toContain("shell_traders_prepare_backlog_penalty:");
    expect(debugText).toContain("shell_traders_immediate_install:true");
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("installs urgent Shell Traders targets directly when affordable", () => {
    const input = runnerShellTradersInput(
      "ai-shell-traders-direct-urgent",
      (state) => {
        moveRunnerResourceCopyToRig(state, "onr_v1_176_the-shell-traders", 0);
        moveRunnerCardToGrip(state, "simple_fracter");
        state.runner.credits = 5;
        state.runner.clicks = 3;
      },
    );
    const prepare = input.legalActions.find(
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
        action.payload?.targetCardDefinitionId === "simple_fracter",
    );
    const directInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinitionFromInput(input, action) === "simple_fracter",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(prepare).toBeDefined();
    expect(directInstall).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!prepare || !directInstall || !gainCredit)
      throw new Error("Missing Shell Traders direct-install fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [prepare, directInstall, gainCredit],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(directInstall.actionId);
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
    expect(debugText).toContain("shell_traders_direct_install_available:true");
    expect(debugText).toContain("shell_traders_direct_install_urgency:");
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("resolves V1.9.9 Aardvark and Chimera choices through side-safe LegalActions", () => {
    const corpState = createGameAfterSetup({ seed: "ai-v199-aardvark-choice" });
    corpState.pendingChoice = {
      choiceId: `v199_aardvark_${corpState.stateVersion}`,
      side: "corp",
      source: "v199.aardvark:aardvark:worm:ice:pump_breaker:none:3",
      prompt: "Aardvark rezzen und Worm trashen?",
      kind: "select_option",
      options: [
        {
          id: "rez_trash_worm",
          label: "Aardvark rezzen",
          publicLabel: "Aardvark wird gerezzt",
          value: "rez_trash_worm",
        },
        {
          id: "decline",
          label: "Nicht rezzen",
          publicLabel: "Aardvark wird nicht gerezzt",
          value: "decline",
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: corpState.stateVersion,
      visibility: "private_to_side",
    };
    const corpInput = buildAiDecisionInput(corpState, "corp", {
      difficulty: "normal",
    });
    const corpDecision = chooseCorpAction(corpInput);
    expect(corpDecision.reasonCode).toBe("corp.choice.resolve");
    expect(corpDecision.selectedChoices).toEqual({
      choiceId: corpState.pendingChoice?.choiceId,
      selectedOptionIds: ["rez_trash_worm"],
    });
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);

    const runnerState = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v199-chimera-choice" }),
    );
    runnerState.pendingChoice = {
      choiceId: `v199_chimera_${runnerState.stateVersion}`,
      side: "runner",
      source: "v199.chimera_daemon_trash:chimera:1",
      prompt: "Daemon für Chimera trashen",
      kind: "select_cards",
      options: [
        {
          id: "card_afreet",
          label: "Afreet",
          publicLabel: "Daemon",
          value: "afreet_id",
        },
        {
          id: "card_succubus",
          label: "Succubus",
          publicLabel: "Daemon",
          value: "succubus_id",
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: runnerState.stateVersion,
      visibility: "public",
    };
    const runnerInput = buildAiDecisionInput(runnerState, "runner", {
      difficulty: "normal",
    });
    const runnerDecision = chooseRunnerAction(runnerInput);
    expect(runnerDecision.reasonCode).toBe("runner.choice.resolve");
    expect(runnerDecision.selectedChoices).toEqual({
      choiceId: runnerState.pendingChoice?.choiceId,
      selectedOptionIds: ["card_afreet"],
    });
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
  });

  it("chooses the conservative gain-all Playful AI split through LegalActions", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v1921-playful-ai-choice" }),
    );
    state.pendingChoice = {
      choiceId: `v1921_playful_ai_${state.stateVersion}`,
      side: "runner",
      source: `v1921.playful_ai:playful:3:0:1:${state.stateVersion}`,
      prompt: "Playful AI: 3 Credits nehmen und/oder 3 Würfel beiseitelegen.",
      kind: "select_option",
      options: [
        {
          id: "gain_0_set_aside_3",
          label: "0 Credits nehmen, 3 Würfel beiseitelegen",
          publicLabel: "Playful-AI-Aufteilung",
          value: 0,
        },
        {
          id: "gain_1_set_aside_2",
          label: "1 Credit nehmen, 2 Würfel beiseitelegen",
          publicLabel: "Playful-AI-Aufteilung",
          value: 1,
        },
        {
          id: "gain_2_set_aside_1",
          label: "2 Credits nehmen, 1 Würfel beiseitelegen",
          publicLabel: "Playful-AI-Aufteilung",
          value: 2,
        },
        {
          id: "gain_3_set_aside_0",
          label: "3 Credits nehmen, 0 Würfel beiseitelegen",
          publicLabel: "Playful-AI-Aufteilung",
          value: 3,
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion,
      visibility: "public",
    };
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const decision = chooseRunnerAction(input);
    expect(decision.reasonCode).toBe("runner.choice.resolve");
    expect(decision.selectedChoices).toEqual({
      choiceId: state.pendingChoice.choiceId,
      selectedOptionIds: ["gain_3_set_aside_0"],
    });
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("keeps V0.94 Damage board states side-safe for AI input", () => {
    const state = applyEffectCommands(v094DamageGame("ai-v094-damage"), [
      {
        type: "do_damage",
        damageType: "meat",
        amount: 2,
        source: "ai_v094_smoke",
      },
    ]);
    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const serialized = JSON.stringify(input);

    expect(input.playerView.opponent.discardCount).toBe(2);
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(serialized).not.toContain("cardInstances");
    expect(serialized).not.toContain("Simple Fracter");
    expect(serialized).not.toContain("Simple Decoder");
    expect(serialized).not.toContain("Simple Killer");
  });

  it("resolves V1.1.1 Discard choices deterministically from PlayerView and LegalActions", () => {
    let state = createGameAfterSetup({ seed: "ai-v111-discard" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");

    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const decision = chooseCorpAction(input);
    const selectableOptionIds =
      input.playerView.pendingChoice?.options.map((option) => option.id) ?? [];
    const serializedRunner = JSON.stringify(
      buildAiDecisionInput(state, "runner", { difficulty: "normal" }),
    );

    expect(input.playerView.pendingChoice?.source).toBe("discard_phase");
    expect(input.legalActions.map((action) => action.type)).toEqual([
      "resolve_choice",
    ]);
    expect(decision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: [expect.any(String)],
    });
    const selectedDiscardChoices = decision.selectedChoices as
      | { selectedOptionIds: string[] }
      | undefined;
    const selectedDiscardOptionId =
      selectedDiscardChoices?.selectedOptionIds[0];
    expect(typeof selectedDiscardOptionId).toBe("string");
    expect(selectableOptionIds).toContain(selectedDiscardOptionId);
    expect(decision.evidence).toContain("discard_selection:keep_value");
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(serializedRunner).not.toContain(
      input.playerView.pendingChoice?.options[0]?.label ?? "not-present",
    );
    expect(serializedRunner).not.toContain("cardInstances");
  });

  it("uses discard keep values for Runner breaker and economy preservation", () => {
    const breakerInput = discardDecisionInputForTest("runner", {
      credits: 5,
      cards: ["simple_fracter", "simple_run_event", "simple_run_event"],
    });
    const breakerDecision = chooseRunnerAction(breakerInput);
    const breakerSelectedChoices = breakerDecision.selectedChoices as
      | { selectedOptionIds: string[] }
      | undefined;

    expect(breakerSelectedChoices?.selectedOptionIds).toHaveLength(1);
    expect(breakerSelectedChoices?.selectedOptionIds[0]).not.toBe(
      "card_discard_simple_fracter_0",
    );
    expect(breakerDecision.evidence).toContain("discard_selection:keep_value");

    const lowCreditInput = discardDecisionInputForTest("runner", {
      credits: 1,
      cards: ["simple_economy_event", "simple_run_event"],
    });
    const lowCreditDecision = chooseRunnerAction(lowCreditInput);

    expect(lowCreditDecision.selectedChoices).toEqual({
      choiceId: lowCreditInput.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_simple_run_event_1"],
    });
  });

  it("keeps plan-relevant expensive breakers and Bad-Publicity trace tech on discard", () => {
    DEMO_CARDS_BY_ID.test_expensive_fracter = {
      id: "test_expensive_fracter",
      title: "Expensive Fracter",
      side: "runner",
      type: "program",
      subtypes: ["Fracter"],
      implementationStatus: "playable_mvp",
      installCost: 6,
      memoryCost: 1,
      rulesText: "1 credit: Break 1 barrier subroutine.",
      mechanics: ["install_program", "icebreaker"],
    } satisfies CardDefinition;
    const input = discardDecisionInputForTest("runner", {
      credits: 1,
      cards: [
        "test_expensive_fracter",
        "onr_proteus_129_back-door-to-netwatch",
        "simple_run_event",
      ],
    });
    input.playerView.servers = [
      {
        id: "hq",
        label: "HQ",
        ice: [],
        root: [],
      },
      {
        id: "rd",
        label: "R&D",
        ice: [
          {
            instanceId: "discard_test_wall",
            definitionId: "simple_barrier_ice",
            title: "Test Wall",
            owner: "corp",
            controller: "corp",
            type: "ice",
            known: true,
            rezzed: true,
            subtypes: ["Wall"],
          },
        ],
        root: [],
      },
      {
        id: "archives",
        label: "Archives",
        ice: [],
        root: [],
      },
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_simple_run_event_2"],
    });
    expect(decision.evidence).toContain("discard_selection:keep_value");
  });

  it("uses discard keep values for Corp agenda, ICE and economy preservation", () => {
    DEMO_CARDS_BY_ID.test_planless_corp_operation = {
      id: "test_planless_corp_operation",
      title: "Planless Corp Operation",
      side: "corp",
      type: "operation",
      subtypes: [],
      implementationStatus: "playable_mvp",
      cost: 1,
      rulesText: "Discard baseline fixture with no AI roles.",
      mechanics: ["test_fixture"],
    } satisfies CardDefinition;
    const input = discardDecisionInputForTest("corp", {
      credits: 2,
      cards: [
        "simple_agenda",
        "simple_barrier_ice",
        "simple_economy_operation",
        "test_planless_corp_operation",
      ],
    });
    const decision = chooseCorpAction(input);

    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_test_planless_corp_operation_3"],
    });
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
    delete DEMO_CARDS_BY_ID.test_planless_corp_operation;
  });

  it("falls back to stable discard order when choice options do not map to own hand", () => {
    const input = discardDecisionInputForTest("runner", {
      credits: 5,
      cards: ["simple_fracter", "simple_economy_event"],
    });
    const choice = input.playerView.pendingChoice;
    if (!choice) throw new Error("Missing discard choice fixture");
    const fallbackInput = {
      ...input,
      playerView: {
        ...input.playerView,
        pendingChoice: {
          ...choice,
          options: [
            { id: "z_option", label: "Zeta", value: "missing_z" },
            { id: "a_option", label: "Alpha", value: "missing_a" },
          ],
        },
      },
    };

    expect(chooseRunnerAction(fallbackInput).selectedChoices).toEqual({
      choiceId: choice.choiceId,
      selectedOptionIds: ["a_option"],
    });
  });

  it("adds Runner rig strategy and planfit to discard keep values", () => {
    const input = discardDecisionInputForTest("runner", {
      credits: 5,
      cards: ["simple_fracter", "simple_run_event"],
      strategyIds: ["runner.rig_first"],
    });
    const decision = chooseRunnerAction(input);

    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_simple_run_event_1"],
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "discard_score:base",
        "discard_score:planfit",
        "discard_score:strategic_intent_fit",
        "discard_keep:build_rig",
        "discard_keep:strategy_runner.rig_first",
      ]),
    );
  });

  it("keeps Runner central-pressure cards above off-plan economy when strategy supports pressure", () => {
    const input = discardDecisionInputForTest("runner", {
      credits: 5,
      cards: ["simple_run_event", "simple_economy_event"],
      rig: ["simple_fracter"],
      strategyIds: ["runner.hq_pressure"],
    });
    const decision = chooseRunnerAction(input);

    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_simple_economy_event_1"],
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "discard_keep:pressure_hq",
        "discard_keep:strategy_runner.hq_pressure",
      ]),
    );
  });

  it("keeps discard safety above strategy pressure bias under Runner credit stress", () => {
    const input = discardDecisionInputForTest("runner", {
      credits: 1,
      cards: ["simple_economy_event", "simple_run_event"],
      rig: ["simple_fracter"],
      strategyIds: ["runner.hq_pressure"],
    });
    const decision = chooseRunnerAction(input);

    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_simple_run_event_1"],
    });
  });

  it("adds Corp scoreline strategy and score-next-turn planfit to discard keep values", () => {
    DEMO_CARDS_BY_ID.test_planless_corp_operation = {
      id: "test_planless_corp_operation",
      title: "Planless Corp Operation",
      side: "corp",
      type: "operation",
      subtypes: [],
      implementationStatus: "playable_mvp",
      cost: 1,
      rulesText: "Discard doctrine fixture with no AI roles.",
      mechanics: ["test_fixture"],
    } satisfies CardDefinition;
    const input = discardDecisionInputForTest("corp", {
      credits: 4,
      cards: [
        "simple_agenda",
        "simple_barrier_ice",
        "simple_upgrade",
        "test_planless_corp_operation",
      ],
      strategyIds: ["corp.remote_scoring"],
    });
    const decision = chooseCorpAction(input);

    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_test_planless_corp_operation_3"],
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "discard_score:base",
        "discard_score:planfit",
        "discard_score:strategic_intent_fit",
        "discard_keep:score_next_turn",
        "discard_keep:strategy_corp.remote_scoring",
      ]),
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("keeps discard choices deterministic for repeated Runner strategy inputs", () => {
    const input = discardDecisionInputForTest("runner", {
      credits: 5,
      cards: ["simple_fracter", "simple_run_event"],
      strategyIds: ["runner.rig_first"],
    });

    const first = chooseRunnerAction(input);
    const second = chooseRunnerAction(input);

    expect(second.selectedChoices).toEqual(first.selectedChoices);
    expect(second.evidence).toEqual(first.evidence);
  });

  it("keeps discard tie-break stable when mapped cards have equal keep values", () => {
    DEMO_CARDS_BY_ID.test_alpha_planless_runner_resource = {
      id: "test_alpha_planless_runner_resource",
      title: "Alpha Planless Runner Resource",
      side: "runner",
      type: "resource",
      subtypes: [],
      implementationStatus: "playable_mvp",
      installCost: 1,
      rulesText: "Discard tie fixture with no AI roles.",
      mechanics: ["test_fixture"],
    } satisfies CardDefinition;
    DEMO_CARDS_BY_ID.test_zeta_planless_runner_resource = {
      id: "test_zeta_planless_runner_resource",
      title: "Zeta Planless Runner Resource",
      side: "runner",
      type: "resource",
      subtypes: [],
      implementationStatus: "playable_mvp",
      installCost: 1,
      rulesText: "Discard tie fixture with no AI roles.",
      mechanics: ["test_fixture"],
    } satisfies CardDefinition;
    const input = discardDecisionInputForTest("runner", {
      credits: 5,
      cards: [
        "test_zeta_planless_runner_resource",
        "test_alpha_planless_runner_resource",
      ],
    });
    const decision = chooseRunnerAction(input);

    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_test_alpha_planless_runner_resource_1"],
    });
  });

  it("keeps discard evidence and debug output abstract and side-safe", () => {
    const input = discardDecisionInputForTest("runner", {
      credits: 5,
      cards: ["simple_run_event", "simple_economy_event"],
      rig: ["simple_fracter"],
      strategyIds: ["runner.hq_pressure"],
    });
    const decision = chooseRunnerAction(input);

    expect(JSON.stringify(decision.evidence)).not.toMatch(
      /simple_|cardInstances|privatePayload|fullGameState/i,
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "discard_score:base",
        "discard_score:planfit",
        "discard_score:strategic_intent_fit",
      ]),
    );
  });

  it("shows Runner discard quality improves over stable first-option selection", () => {
    const input = discardDecisionInputForTest("runner", {
      credits: 5,
      cards: ["simple_fracter", "simple_run_event"],
    });
    const stableFirst = input.playerView.pendingChoice?.options
      .slice()
      .sort(
        (left, right) =>
          left.label.localeCompare(right.label, "de") ||
          left.id.localeCompare(right.id),
      )[0]?.id;
    const decision = chooseRunnerAction(input);

    expect(stableFirst).toBe("card_discard_simple_fracter_0");
    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_simple_run_event_1"],
    });
  });

  it("shows Corp discard quality improves over stable first-option selection", () => {
    DEMO_CARDS_BY_ID.test_zeta_planless_corp_operation = {
      id: "test_zeta_planless_corp_operation",
      title: "Zeta Planless Corp Operation",
      side: "corp",
      type: "operation",
      subtypes: [],
      implementationStatus: "playable_mvp",
      cost: 1,
      rulesText: "Discard regression fixture with no AI roles.",
      mechanics: ["test_fixture"],
    } satisfies CardDefinition;
    const input = discardDecisionInputForTest("corp", {
      credits: 4,
      cards: ["simple_agenda", "test_zeta_planless_corp_operation"],
    });
    const stableFirst = input.playerView.pendingChoice?.options
      .slice()
      .sort(
        (left, right) =>
          left.label.localeCompare(right.label, "de") ||
          left.id.localeCompare(right.id),
      )[0]?.id;
    const decision = chooseCorpAction(input);

    expect(stableFirst).toBe("card_discard_simple_agenda_0");
    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_test_zeta_planless_corp_operation_1"],
    });
  });

  it("keeps V0.95 Resource trash decisions LegalActions-only and side-safe", () => {
    const state = installedResourceCorpTurn("ai-v095-resource");
    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const decision = chooseCorpAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    const serialized = JSON.stringify(input);

    expect(
      input.legalActions.some((action) => action.type === "trash_resource"),
    ).toBe(true);
    expect(selected?.type).toBe("trash_resource");
    expect(decision.reasonCode).toBe("corp.tag.trash_visible_resource");
    expect(
      input.playerView.opponent.rig?.some(
        (card) => card.definitionId === "v095_safehouse_resource",
      ),
    ).toBe(true);
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(serialized).not.toContain("cardInstances");
    expect(serialized).not.toContain("Simple Fracter");
    expect(serialized).not.toContain("Simple Decoder");
    expect(serialized).not.toContain("Simple Killer");
  });

  it("prioritizes trashing Diplomatic Immunity over low-credit economy in a tagged meat-damage plan", () => {
    if (
      !createRuntimeCardsById()[DIPLOMATIC_IMMUNITY_CARD_ID_FOR_TEST] ||
      !createRuntimeCardsById()["onr_v1_302_scorched-earth"]
    ) {
      return;
    }
    let state = createGameAfterSetup({
      seed: "ai-corp-trash-diplomatic-immunity",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: {
        ...V095_RUNNER_DECK,
        id: "demo_runner_095_diplomatic_immunity",
        cards: [
          ...V095_RUNNER_DECK.cards,
          { id: DIPLOMATIC_IMMUNITY_CARD_ID_FOR_TEST, quantity: 1 },
        ],
      },
      corpDeck: {
        ...V095_CORP_DECK,
        id: "demo_corp_095_scorched_earth",
        cards: [
          ...V095_CORP_DECK.cards,
          { id: "onr_v1_302_scorched-earth", quantity: 1 },
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveRunnerResourceToRig(state, DIPLOMATIC_IMMUNITY_CARD_ID_FOR_TEST);
    moveCorpCardToHq(state, "onr_v1_302_scorched-earth");
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.corp.credits = 2;
    state.runner.tags = 1;

    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const diplomaticTrash = input.legalActions.find(
      (action) =>
        action.type === "trash_resource" &&
        action.payload?.cardId ===
          input.playerView.opponent.rig?.find(
            (card) =>
              card.definitionId === DIPLOMATIC_IMMUNITY_CARD_ID_FOR_TEST,
          )?.instanceId,
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(diplomaticTrash).toBeDefined();
    expect(gain).toBeDefined();
    if (!diplomaticTrash || !gain)
      throw new Error("Missing Diplomatic Immunity trash fixture actions");

    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const decision = chooseCorpAction({
      ...input,
      legalActions: [gain, diplomaticTrash],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(diplomaticTrash.actionId);
    expect(debugText).toContain("corp_tagged_damage_prevention_resource_trash");
    expect(debugText).toContain(
      "runner_resource_damage_prevention_visible:true",
    );
    expect(debugText).toContain("cancel_blocked:true");
    expect(debugText).toContain("corp_visible_meat_damage_payoff:true");
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("prioritizes Schlaghund tagged meat damage over economy and generic ICE setup", () => {
    const runtimeCards = createRuntimeCardsById();
    if (
      !runtimeCards[SCHLAGHUND_CARD_ID_FOR_TEST] ||
      !runtimeCards[FULL_BODY_CONVERSION_CARD_ID_FOR_TEST] ||
      !runtimeCards[DERMATECH_BODYPLATING_CARD_ID_FOR_TEST] ||
      !runtimeCards["onr_v1_243_fetch-4-0-1"]
    ) {
      return;
    }
    let state = createGameAfterSetup({
      seed: "ai-corp-schlaghund-tagged-meat-payoff",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: V095_RUNNER_DECK,
      corpDeck: {
        ...V095_CORP_DECK,
        id: "demo_corp_095_schlaghund",
        cards: [
          ...V095_CORP_DECK.cards,
          { id: SCHLAGHUND_CARD_ID_FOR_TEST, quantity: 2 },
          { id: "onr_v1_243_fetch-4-0-1", quantity: 1 },
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    putCorpRootInServer(state, "remote_1", SCHLAGHUND_CARD_ID_FOR_TEST, 0, {
      faceup: true,
      rezzed: true,
    });
    moveCorpCardToHq(state, "onr_v1_243_fetch-4-0-1");
    addRunnerHardwareToRigForTest(state, FULL_BODY_CONVERSION_CARD_ID_FOR_TEST);
    addRunnerHardwareToRigForTest(
      state,
      DERMATECH_BODYPLATING_CARD_ID_FOR_TEST,
    );
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.corp.credits = 1;
    state.runner.tags = 7;

    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const schlaghund = input.legalActions.find(
      (action) =>
        action.type === "gain_credit" &&
        sourceDefinitionFromInput(input, action) ===
          SCHLAGHUND_CARD_ID_FOR_TEST,
    );
    const gain = input.legalActions.find(
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );
    const fetchInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_243_fetch-4-0-1",
    );
    expect(schlaghund).toBeDefined();
    expect(gain).toBeDefined();
    expect(fetchInstall).toBeDefined();
    if (!schlaghund || !gain || !fetchInstall)
      throw new Error("Missing Schlaghund tagged meat damage fixture actions");

    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const decision = chooseCorpAction({
      ...input,
      legalActions: [fetchInstall, gain, schlaghund],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(schlaghund.actionId);
    expect(decision.reasonCode).toBe("corp.semantic.corp_tag_punish");
    expect(debugText).toContain("corp_tagged_meat_damage_payoff_pressure");
    expect(debugText).toContain("corp_tagged_meat_damage_payoff:true");
    expect(debugText).toContain("source_definition:onr_v1_339_schlaghund");
    expect(debugText).toContain("runner_tags:7");
    expect(debugText).toContain("runner_damage_prevention_visible:true");
    expect(debugText).toContain("runner_meat_damage_prevention_visible:true");
    expect(debugText).toContain("prevention_pressure:true");
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("prioritizes endgame tag-punish resource trash over economy and slow ICE setup", () => {
    const runtimeCards = createRuntimeCardsById();
    if (
      !runtimeCards["onr_v1_182_submarine-uplink"] ||
      !runtimeCards["onr_v1_243_fetch-4-0-1"]
    ) {
      return;
    }
    let state = createGameAfterSetup({
      seed: "ai-corp-tag-punish-endgame-resource-trash",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: {
        ...V095_RUNNER_DECK,
        id: "demo_runner_095_submarine_uplink",
        cards: [
          ...V095_RUNNER_DECK.cards,
          { id: "onr_v1_182_submarine-uplink", quantity: 1 },
        ],
      },
      corpDeck: {
        ...V095_CORP_DECK,
        id: "demo_corp_095_tag_punish_setup",
        cards: [
          ...V095_CORP_DECK.cards,
          { id: "onr_v1_243_fetch-4-0-1", quantity: 1 },
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const resourceId = moveRunnerResourceToRig(
      state,
      "onr_v1_182_submarine-uplink",
    );
    scoreRunnerAgendaForTest(state, "simple_agenda", 0);
    moveCorpCardToHq(state, "onr_v1_243_fetch-4-0-1");
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.corp.credits = 4;
    state.runner.tags = 7;

    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const resourceTrash = input.legalActions.find(
      (action) =>
        action.type === "trash_resource" &&
        action.payload?.cardId === resourceId,
    );
    const gain = input.legalActions.find(
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );
    const fetchInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_243_fetch-4-0-1",
    );
    expect(resourceTrash).toBeDefined();
    expect(gain).toBeDefined();
    expect(fetchInstall).toBeDefined();
    if (!resourceTrash || !gain || !fetchInstall)
      throw new Error("Missing tag-punish resource trash fixture actions");

    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const decision = chooseCorpAction({
      ...input,
      legalActions: [fetchInstall, gain, resourceTrash],
    });
    const debugText = JSON.stringify(decision.decisionDebug);
    const installAlternative = decision.decisionDebug?.actionAlternatives?.find(
      (alternative) => alternative.actionId === fetchInstall.actionId,
    );

    expect(decision.actionId).toBe(resourceTrash.actionId);
    expect(debugText).toContain("corp_tag_punish_endgame_resource_trash");
    expect(debugText).toContain("runner_resource_trace_defense_visible:true");
    expect(debugText).toContain("tag_punish_endgame_active:true");
    expect(
      installAlternative?.scoreBreakdown?.some(
        (component) =>
          component.key === "corp_tag_punish_endgame_slow_setup_penalty",
      ),
    ).toBe(true);
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("funds visible tag-punish payoffs instead of continuing slow ICE setup", () => {
    const runtimeCards = createRuntimeCardsById();
    if (
      !runtimeCards["onr_v1_302_scorched-earth"] ||
      !runtimeCards["simple_barrier_ice"]
    ) {
      return;
    }
    let state = createGameAfterSetup({
      seed: "ai-corp-tag-punish-payoff-funding",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: V095_RUNNER_DECK,
      corpDeck: {
        ...V095_CORP_DECK,
        id: "demo_corp_095_scorched_funding",
        cards: [
          ...V095_CORP_DECK.cards,
          { id: "onr_v1_302_scorched-earth", quantity: 1 },
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    scoreRunnerAgendaForTest(state, "simple_agenda", 0);
    moveCorpCardToHq(state, "onr_v1_302_scorched-earth");
    moveCorpCardToHq(state, "simple_barrier_ice");
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.corp.credits = 2;
    state.runner.tags = 7;

    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const gain = input.legalActions.find(
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );
    const iceInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        sourceDefinitionFromInput(input, action) === "simple_barrier_ice",
    );
    expect(gain).toBeDefined();
    expect(iceInstall).toBeDefined();
    if (!gain || !iceInstall)
      throw new Error("Missing tag-punish funding fixture actions");

    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const decision = chooseCorpAction({
      ...input,
      legalActions: [iceInstall, gain],
    });
    const debugText = JSON.stringify(decision.decisionDebug);
    const installAlternative = decision.decisionDebug?.actionAlternatives?.find(
      (alternative) => alternative.actionId === iceInstall.actionId,
    );

    expect(decision.actionId).toBe(gain.actionId);
    expect(debugText).toContain("corp_tag_punish_payoff_funding");
    expect(debugText).toContain("corp_tagged_payoff_targeted_funding:true");
    expect(debugText).not.toContain("corp_visible_meat_damage_payoff:true");
    expect(
      installAlternative?.scoreBreakdown?.some(
        (component) =>
          component.key === "corp_tag_punish_endgame_slow_setup_penalty",
      ),
    ).toBe(false);
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("uses immediate trace tag source before more economy or unprotected tag-asset setup", () => {
    const runtimeCards = createRuntimeCardsById();
    if (
      !runtimeCards["onr_v1_284_chance-observation"] ||
      !runtimeCards["onr_v1_307_urban-renewal"] ||
      !runtimeCards["onr_v1_313_city-surveillance"] ||
      !runtimeCards["onr_v1_309_bbs-whispering-campaign"]
    ) {
      return;
    }
    const input = corpReplayTagPunishWindowInput(
      "ai-corp-replay-chance-before-setup",
      { installedBbs: true, cityInHq: true },
    );
    const chanceObservation = input.legalActions.find(
      (action) =>
        action.type === "play_operation" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_284_chance-observation",
    );
    const bbsTake = input.legalActions.find(
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_309_bbs-whispering-campaign",
    );
    const cityInstall =
      input.legalActions.find(
        (action) =>
          action.type === "install_card" &&
          sourceDefinitionFromInput(input, action) ===
            "onr_v1_313_city-surveillance" &&
          action.payload?.serverId === "new_remote",
      ) ??
      input.legalActions.find(
        (action) =>
          action.type === "install_card" &&
          sourceDefinitionFromInput(input, action) ===
            "onr_v1_313_city-surveillance",
      );

    expect(chanceObservation).toBeDefined();
    expect(bbsTake).toBeDefined();
    expect(cityInstall).toBeDefined();
    if (!chanceObservation || !bbsTake || !cityInstall)
      throw new Error("Missing Chance/BBS/City replay fixture actions");

    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const decision = chooseCorpAction({
      ...input,
      legalActions: [cityInstall, bbsTake, chanceObservation],
    });
    const cityAlternative = decision.decisionDebug?.actionAlternatives?.find(
      (alternative) => alternative.actionId === cityInstall.actionId,
    );
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(chanceObservation.actionId);
    expect(debugText).toContain("corp_tag_source_visible_payoff_pressure");
    expect(debugText).toContain("corp_visible_tag_punish_payoff_kind:damage");
    expect(
      cityAlternative?.scoreBreakdown?.some(
        (component) =>
          component.key === "corp_unprotected_tag_asset_setup_penalty",
      ),
    ).toBe(true);
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("does not add visible-payoff tag-source pressure without a visible payoff", () => {
    const runtimeCards = createRuntimeCardsById();
    if (!runtimeCards["onr_v1_284_chance-observation"]) return;
    const input = corpReplayTagPunishWindowInput(
      "ai-corp-replay-chance-no-payoff",
      { cityInHq: true },
    );
    const chanceObservation = input.legalActions.find(
      (action) =>
        action.type === "play_operation" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_284_chance-observation",
    );
    const basicCredit = input.legalActions.find(
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );
    expect(chanceObservation).toBeDefined();
    expect(basicCredit).toBeDefined();
    if (!chanceObservation || !basicCredit)
      throw new Error("Missing Chance no-payoff fixture actions");

    const payoffIds = new Set([
      "onr_v1_285_closed-accounts",
      "onr_v1_301_punitive-counterstrike",
      "onr_v1_302_scorched-earth",
      "onr_v1_307_urban-renewal",
    ]);
    const stripPayoffs = (cards: VisibleCard[]) =>
      cards.filter((card) => !payoffIds.has(card.definitionId ?? ""));
    const noPayoffInput: AiDecisionInput = {
      ...input,
      legalActions: [basicCredit, chanceObservation],
      playerView: {
        ...input.playerView,
        own: {
          ...input.playerView.own,
          gripOrHq: stripPayoffs(input.playerView.own.gripOrHq),
          scoreArea: stripPayoffs(input.playerView.own.scoreArea),
        },
        servers: input.playerView.servers.map((server) => ({
          ...server,
          ice: stripPayoffs(server.ice),
          root: stripPayoffs(server.root),
        })),
      },
    };

    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const decision = chooseCorpAction(noPayoffInput);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(debugText).not.toContain("corp_tag_source_visible_payoff_pressure");
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("keeps unprotected persistent tag-asset rez below immediate tag source", () => {
    const runtimeCards = createRuntimeCardsById();
    if (
      !runtimeCards["onr_v1_284_chance-observation"] ||
      !runtimeCards["onr_v1_307_urban-renewal"] ||
      !runtimeCards["onr_v1_313_city-surveillance"]
    ) {
      return;
    }
    const input = corpReplayTagPunishWindowInput(
      "ai-corp-replay-city-rez-risk",
      { cityInstalled: true },
    );
    const chanceObservation = input.legalActions.find(
      (action) =>
        action.type === "play_operation" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_284_chance-observation",
    );
    const cityRez = input.legalActions.find(
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_313_city-surveillance",
    );

    expect(chanceObservation).toBeDefined();
    expect(cityRez).toBeDefined();
    if (!chanceObservation || !cityRez)
      throw new Error("Missing Chance/City rez replay fixture actions");

    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const decision = chooseCorpAction({
      ...input,
      legalActions: [cityRez, chanceObservation],
    });
    const cityAlternative = decision.decisionDebug?.actionAlternatives?.find(
      (alternative) => alternative.actionId === cityRez.actionId,
    );
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(chanceObservation.actionId);
    expect(
      cityAlternative?.scoreBreakdown?.some(
        (component) =>
          component.key === "corp_unprotected_tag_asset_setup_penalty",
      ),
    ).toBe(true);
    expect(debugText).toContain(
      "immediate_operation_tag_source_available:true",
    );
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("does not promote Schlaghund tagged meat damage when Runner has no tags", () => {
    const runtimeCards = createRuntimeCardsById();
    if (!runtimeCards[SCHLAGHUND_CARD_ID_FOR_TEST]) return;
    let state = createGameAfterSetup({
      seed: "ai-corp-schlaghund-untagged",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: V095_RUNNER_DECK,
      corpDeck: {
        ...V095_CORP_DECK,
        id: "demo_corp_095_schlaghund_untagged",
        cards: [
          ...V095_CORP_DECK.cards,
          { id: SCHLAGHUND_CARD_ID_FOR_TEST, quantity: 1 },
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    putCorpRootInServer(state, "remote_1", SCHLAGHUND_CARD_ID_FOR_TEST, 0, {
      faceup: true,
      rezzed: true,
    });
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.corp.credits = 1;
    state.runner.tags = 0;

    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const schlaghund = input.legalActions.find(
      (action) =>
        action.type === "gain_credit" &&
        sourceDefinitionFromInput(input, action) ===
          SCHLAGHUND_CARD_ID_FOR_TEST,
    );
    const gain = input.legalActions.find(
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );
    expect(gain).toBeDefined();
    if (!gain) throw new Error("Missing basic gain-credit action");
    if (!schlaghund) return;

    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const decision = chooseCorpAction({
      ...input,
      legalActions: [gain, schlaghund],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(gain.actionId);
    expect(debugText).not.toContain("corp_tagged_meat_damage_payoff_pressure");
  });

  it("chooses V0.96 Trace bids from side-safe PlayerView choices", () => {
    let state = traceCorpBidState("ai-v096-trace");
    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const corpDecision = chooseCorpAction(corpInput);

    expect(corpDecision.actionId).toBe(corpInput.legalActions[0]?.actionId);
    expect(corpDecision.reasonCode).toBe("corp.trace.bid_visible_amount");
    expect(corpDecision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: ["bid_1"],
    });
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);

    const corpResult = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: corpDecision.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(corpDecision.selectedChoices
        ? { selectedChoices: corpDecision.selectedChoices }
        : {}),
    });
    expect(corpResult.ok).toBe(true);
    if (!corpResult.ok) throw new Error(corpResult.error.message);
    state = corpResult.state;

    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
    });
    const runnerDecision = chooseRunnerAction(runnerInput);
    expect(runnerDecision.reasonCode).toBe("runner.trace.bid_visible_amount");
    expect(runnerDecision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: ["bid_3"],
    });
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(JSON.stringify(runnerInput)).not.toContain("cardInstances");
    expect(JSON.stringify(runnerInput)).not.toContain("Simple Agenda");
  });

  it("avoids wasteful Runner Trace bids when the max bid cannot change the outcome", () => {
    let state = traceCorpBidState("ai-trace-wasteful-runner-bid");
    state.runner.credits = 2;

    expect(state.pendingChoice?.options.map((option) => option.id)).toContain(
      "bid_3",
    );
    state = applyChoice(state, "corp", ["bid_3"]);

    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
    });
    expect(
      runnerInput.eventTail.some(
        (event) =>
          event.publicPayload.traceStep === "corp_bid" &&
          event.publicPayload.traceStrength === 5 &&
          event.publicPayload.runnerLink === 0,
      ),
    ).toBe(true);

    expect(
      runnerInput.playerView.pendingChoice?.options.map((option) => option.id),
    ).toEqual(["bid_0", "bid_1", "bid_2"]);

    const runnerDecision = chooseRunnerAction(runnerInput);

    expect(runnerDecision.reasonCode).toBe("runner.trace.bid_visible_amount");
    expect(runnerDecision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: ["bid_0"],
    });
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(JSON.stringify(runnerInput)).not.toContain("cardInstances");
    expect(JSON.stringify(runnerInput)).not.toContain("Simple Agenda");
  });

  it("chooses post-bid Trace Link sources after both bids are visible", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-post-bid-trace-link",
        runnerDeck: {
          id: "ai_post_bid_trace_runner",
          name: "AI Post-Bid Trace Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_063_signpost", quantity: 1 },
            { id: "onr_v1_181_the-springboard", quantity: 1 },
            { id: "simple_economy_event", quantity: 10 },
          ],
        },
        corpDeck: {
          id: "ai_post_bid_trace_corp",
          name: "AI Post-Bid Trace Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_243_fetch-4-0-1", quantity: 1 },
            { id: "simple_agenda", quantity: 6 },
            { id: "simple_economy_operation", quantity: 6 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 5;
    state.corp.credits = 5;
    const signpostId = moveRunnerProgramToRig(state, "onr_v1_063_signpost");
    const springboardId = moveRunnerResourceToRig(
      state,
      "onr_v1_181_the-springboard",
    );
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_243_fetch-4-0-1");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", ["bid_0"]);
    state = applyChoice(state, "runner", ["bid_0"]);

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
    });
    const decision = chooseRunnerAction(input);

    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual(
      expect.arrayContaining([
        "pass",
        `trace_link_${signpostId}`,
        `trace_link_${springboardId}`,
      ]),
    );
    expect(
      input.playerView.pendingChoice?.options.find(
        (option) => option.id === `trace_link_${signpostId}`,
      )?.metadata,
    ).toEqual({ postBidTraceLinkDelta: 2 });
    expect(decision.reasonCode).toBe("runner.trace.post_bid_link");
    expect(decision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: [`trace_link_${signpostId}`],
    });
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(JSON.stringify(input)).not.toContain("cardInstances");
  });

  it("passes post-bid Trace Link choices when the Runner already avoided the trace", () => {
    const { state, input } = postBidTraceLinkChoiceFixture(
      "ai-post-bid-trace-link-already-avoided",
    );
    const contextualInput = withSyntheticPostBidTraceContext(input, {
      traceStrength: 5,
      runnerLink: 1,
      runnerBid: 4,
      runnerStrength: 5,
    });

    const decision = chooseRunnerAction(contextualInput);

    expect(decision.reasonCode).toBe("runner.trace.post_bid_link");
    expect(decision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: ["pass"],
    });
    expect(assertAiInputIsSideSafe(contextualInput)).toBe(true);
    expect(JSON.stringify(contextualInput)).not.toContain("cardInstances");
  });

  it("chooses the cheapest post-bid Trace Link source that changes the outcome", () => {
    const { state, input, springboardId } = postBidTraceLinkChoiceFixture(
      "ai-post-bid-trace-link-minimal-needed",
    );
    const contextualInput = withSyntheticPostBidTraceContext(input, {
      traceStrength: 1,
      runnerLink: 0,
      runnerBid: 0,
      runnerStrength: 0,
    });

    const decision = chooseRunnerAction(contextualInput);

    expect(decision.reasonCode).toBe("runner.trace.post_bid_link");
    expect(decision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: [`trace_link_${springboardId}`],
    });
    expect(assertAiInputIsSideSafe(contextualInput)).toBe(true);
    expect(JSON.stringify(contextualInput)).not.toContain("cardInstances");
  });

  it("does not spend Submarine Uplink post-bid link when the trace is already avoided", () => {
    const { state, input } = postBidTraceLinkChoiceFixture(
      "ai-post-bid-submarine-already-avoided",
    );
    const submarineInput = withPostBidChoiceOptions(input, [
      { id: "pass", label: "Keine Link-Faehigkeit nutzen" },
      {
        id: "trace_link_runner_onr_v1_182_submarine-uplink_1",
        label: "Submarine Uplink: +1 Link",
        publicLabel: "Trace Link",
        value: "runner_onr_v1_182_submarine-uplink_1",
        metadata: { postBidTraceLinkDelta: 1 },
      },
    ]);
    const contextualInput = withSyntheticPostBidTraceContext(submarineInput, {
      traceStrength: 5,
      runnerLink: 1,
      runnerBid: 4,
      runnerStrength: 5,
    });

    const decision = chooseRunnerAction(contextualInput);

    expect(decision.reasonCode).toBe("runner.trace.post_bid_link");
    expect(decision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: ["pass"],
    });
    expect(assertAiInputIsSideSafe(contextualInput)).toBe(true);
    expect(JSON.stringify(contextualInput)).not.toContain("cardInstances");
  });

  it("passes a reopened post-bid Trace Link choice after a prior link boost already fixed the outcome", () => {
    const { state, input } = postBidTraceLinkChoiceFixture(
      "ai-post-bid-trace-link-reopened-after-fixed",
    );
    const contextualInput = withSyntheticPostBidTraceContext(input, {
      traceStrength: 5,
      runnerLink: 2,
      runnerBid: 3,
      runnerStrength: 5,
      postBidTraceLinkBonus: 1,
    });

    const decision = chooseRunnerAction(contextualInput);

    expect(decision.reasonCode).toBe("runner.trace.post_bid_link");
    expect(decision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: ["pass"],
    });
    expect(assertAiInputIsSideSafe(contextualInput)).toBe(true);
    expect(JSON.stringify(contextualInput)).not.toContain("cardInstances");
  });

  it("keeps V0.97 breach queues hidden and chooses access from LegalActions", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v097-breach",
        runnerDeckId: "demo_runner_097",
        corpDeckId: "demo_corp_097",
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 5;
    moveRunnerCardToGrip(state, "v097_deep_dive_event");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "v097_deep_dive_event" &&
        action.payload?.serverId === "rd",
    );

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const decision = chooseRunnerAction(input);
    const serialized = JSON.stringify(input);

    expect(input.playerView.run?.breach?.remainingCount).toBe(2);
    expect(
      input.legalActions.find((action) => action.actionId === decision.actionId)
        ?.type,
    ).toBe("access_card");
    expect(decision.reasonCode).toBe("runner.access.open_card");
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(serialized).not.toContain("cardInstances");
    expect(serialized).not.toContain("Simple Agenda");
    expect(serialized).not.toContain("Simple Economy Operation");
  });

  it("keeps V0.98 hidden-zone choices side-safe for AI inputs", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v098-hidden-zone",
        runnerDeckId: "demo_runner_098",
        corpDeckId: "demo_corp_098",
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerCardToGrip(state, "v098_stack_search_event");
    putRunnerCardOnTopOfStack(state, "simple_decoder");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "v098_stack_search_event",
    );

    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const runnerDecision = chooseRunnerAction(runnerInput);
    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const corpSerialized = JSON.stringify(corpInput);

    expect(
      runnerInput.playerView.pendingChoice?.options.some(
        (option) => option.label === "Simple Decoder",
      ),
    ).toBe(true);
    expect(
      runnerInput.legalActions.find(
        (action) => action.actionId === runnerDecision.actionId,
      )?.type,
    ).toBe("resolve_choice");
    expect(runnerDecision.reasonCode).toBe("runner.choice.resolve");
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(corpInput.playerView.pendingChoice).toBeUndefined();
    expect(corpInput.legalActions).toEqual([]);
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(corpSerialized).not.toContain("Simple Decoder");
    expect(corpSerialized).not.toContain("cardInstances");
  });

  it("answers Too Many Doors secret-spend choices side-safely", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v1911-too-many-doors",
        runnerDeck: V1911_RUNNER_DECK,
        corpDeck: V1911_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    putCorpIceOnServer(state, "rd", "onr_v1_272_too-many-doors");
    const secondCardId = putCorpCardOnTopOfRd(
      state,
      "simple_economy_operation",
    );
    const firstCardId = putCorpCardOnTopOfRd(
      state,
      "onr_v1_203_hostile-takeover",
    );

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_272_too-many-doors",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );

    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const corpDecision = chooseCorpAction(corpInput);
    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    void firstCardId;
    void secondCardId;
    const corpSpendOneOption = corpInput.playerView.pendingChoice?.options.find(
      (option) => option.value === 1,
    );

    expect(corpInput.playerView.pendingChoice?.source).toContain(
      "card_implementation.secret_spend_compare",
    );
    expect(corpInput.playerView.pendingChoice?.kind).toBe("bid_amount");
    expect(corpInput.legalActions.map((action) => action.type)).toEqual([
      "resolve_choice",
    ]);
    expect(corpDecision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: corpSpendOneOption ? [corpSpendOneOption.id] : [],
    });
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(runnerInput.playerView.pendingChoice).toBeUndefined();
    expect(JSON.stringify(runnerInput)).not.toContain("Hostile Takeover");
    expect(JSON.stringify(runnerInput)).not.toContain(
      "Simple Economy Operation",
    );

    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: corpDecision.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(corpDecision.selectedChoices
        ? { selectedChoices: corpDecision.selectedChoices }
        : {}),
      idempotencyKey: `corp-${state.stateVersion}-${corpDecision.actionId}`,
    });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
  });

  it("keeps V0.99 hosting choices side-safe and lets Corp AI choose legal Purge", () => {
    let hostingState = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v099-hosting",
        runnerDeckId: "demo_runner_099",
        corpDeckId: "demo_corp_099",
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerCardToGrip(hostingState, "v099_host_resource");
    moveRunnerCardToGrip(hostingState, "simple_decoder");
    hostingState = apply(
      hostingState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(hostingState, action) === "v099_host_resource",
    );

    const runnerInput = buildAiDecisionInput(hostingState, "runner", {
      difficulty: "normal",
    });
    const runnerDecision = chooseRunnerAction(runnerInput);
    const corpInput = buildAiDecisionInput(hostingState, "corp", {
      difficulty: "normal",
    });

    expect(
      runnerInput.playerView.pendingChoice?.options.some(
        (option) => option.label === "Simple Decoder",
      ),
    ).toBe(true);
    expect(
      runnerInput.legalActions.find(
        (action) => action.actionId === runnerDecision.actionId,
      )?.type,
    ).toBe("resolve_choice");
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(corpInput.playerView.pendingChoice).toBeUndefined();
    expect(corpInput.legalActions).toEqual([]);
    expect(JSON.stringify(corpInput)).not.toContain("Simple Decoder");

    let purgeState = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v099-purge",
        runnerDeckId: "demo_runner_099",
        corpDeckId: "demo_corp_099",
        agendaPointsToWin: 7,
      }),
    );
    purgeState.runner.credits = 3;
    moveRunnerCardToGrip(purgeState, "v099_virus_program");
    purgeState = apply(
      purgeState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(purgeState, action) === "v099_virus_program",
    );
    purgeState.activeSide = "corp";
    purgeState.phase = "corp_action_phase";
    purgeState.timingPoint = "corp_action.main";
    purgeState.corp.clicks = 3;

    const purgeInput = buildAiDecisionInput(purgeState, "corp", {
      difficulty: "normal",
    });
    const purgeDecision = chooseCorpAction(purgeInput);
    expect(
      purgeInput.legalActions.find(
        (action) => action.actionId === purgeDecision.actionId,
      )?.type,
    ).toBe("purge_virus_counters");
    expect(purgeDecision.reasonCode).toBe("corp.purge.visible_virus_counters");
    expect(assertAiInputIsSideSafe(purgeInput)).toBe(true);
  });
});

describe("MVP 0.3 Runner AI", () => {
  it("prioritizes accessing and stealing a visible agenda", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "ai-runner-steal" }));
    putCorpCardOnTopOfRd(state, "simple_agenda");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const decision = chooseRunnerAction(input);

    expect(
      input.legalActions.find((action) => action.actionId === decision.actionId)
        ?.type,
    ).toBe("steal_agenda");
    expect(decision.explanation).not.toContain("corp_simple_agenda");
  });

  it("distinguishes easy and normal pressure choices", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-runner-difficulty" }),
    );
    const input = buildAiDecisionInput(state, "runner", { difficulty: "easy" });
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    const run = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(gain).toBeDefined();
    expect(run).toBeDefined();
    if (!gain || !run) throw new Error("Missing fixture actions");

    const easy = chooseRunnerAction({
      ...input,
      difficulty: "easy",
      legalActions: [gain, run],
    });
    const normal = chooseRunnerAction({
      ...input,
      difficulty: "normal",
      legalActions: [gain, run],
    });

    expect(easy.actionId).toBe(gain.actionId);
    expect(normal.actionId).toBe(run.actionId);
  });

  it("uses public remote root and ICE counts before choosing run targets", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-runner-empty-remote" }),
    );
    ensureRemoteServer(state, "remote_1");
    putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const emptyRemoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(emptyRemoteRun).toBeDefined();
    expect(rdRun).toBeDefined();
    if (!emptyRemoteRun || !rdRun)
      throw new Error("Missing run fixture actions");

    const emptyOnly = chooseRunnerAction({
      ...input,
      legalActions: [emptyRemoteRun],
    });
    const betterTarget = chooseRunnerAction({
      ...input,
      legalActions: [emptyRemoteRun, rdRun],
    });

    expect(emptyOnly.reasonCode).toBe("runner.plan.safe_probe_run");
    expect(emptyOnly.evidence).toContain("target:remote_1");
    expect((emptyOnly.evidence ?? []).join("|")).toContain(
      "known_path_target:remote_1",
    );
    expect(betterTarget.actionId).toBe(rdRun.actionId);
  });

  it("treats multiple remote root cards as public pressure without learning identities", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-runner-remote-counts" }),
    );
    putCorpRootInRemote(state, "simple_agenda", 0);
    putCorpRootInRemote(state, "simple_economy_asset", 0);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(remoteRun).toBeDefined();
    if (!remoteRun) throw new Error("Missing remote run fixture action");

    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun],
    });
    const serializedDecision = JSON.stringify(decision);

    expect(decision.reasonCode).toBe("runner.semantic.remote_contest");
    expect(decision.decisionDebug).toMatchObject({
      aiLevel: 2,
      planKind: "runner.contest_remote",
    });
    expect((decision.evidence ?? []).join("|")).toContain(
      "tactical_plan_type:runner.contest_remote",
    );
    expect(serializedDecision).not.toContain("Simple Agenda");
    expect(serializedDecision).not.toContain("Simple Economy Asset");
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("backs off from a visibly blocked rezzed ICE run when setup alternatives exist", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-runner-rezzed-ice-loop" }),
    );
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    state.corp.credits = 5;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const blockedRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(blockedRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!blockedRun || !gain) throw new Error("Missing fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [blockedRun, gain],
    });
    const strategyDecision = chooseRunnerAction(
      withDeckStrategyProfileForTest(
        { ...input, legalActions: [blockedRun, gain] },
        "runner",
        ["runner.rnd_pressure"],
      ),
    );

    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(strategyDecision.actionId).toBe(gain.actionId);
    expect(strategyDecision.reasonCode).toBe("runner.plan.recover_economy");
    expect(JSON.stringify(strategyDecision.decisionDebug)).not.toContain(
      "ownDeckDoctrine",
    );
    expect(JSON.stringify(strategyDecision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|simple_run_event/,
    );
  });

  it("backs off from HQ when the visible sentry breaker cannot pay the rezzed ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-hq-pi-face-credit-block",
        corpDeck: ONR_V1_1_2K_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerCardToGrip(state, "simple_killer");
    state.runner.credits = 3;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_killer",
    );
    const iceId = putCorpIceOnServer(state, "hq", "onr_v1_259_in-the-face");
    state.cardInstances[iceId] = {
      ...state.cardInstances[iceId]!,
      faceup: true,
      rezzed: true,
    };
    state.runner.credits = 0;

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(hqRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!hqRun || !gain) throw new Error("Missing HQ blocker fixture actions");

    const pressureCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "pressure_hq",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate) throw new Error("Missing pressure_hq candidate");
    const runCost = estimateRunCost(input, pressureCandidate);
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [hqRun, gain],
    });

    expect(runCost.reasons).toContain("visible_ice_unaffordable_to_break");
    expect(runCost.evidence).toContain("visible_etr_break_cost:3");
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("backs off when the visible multi-ICE path costs more than the Runner can pay", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-hq-multi-ice-credit-block",
        corpDeck: {
          ...ONR_V1_1_2K_CORP_DECK,
          cards: [
            ...ONR_V1_1_2K_CORP_DECK.cards,
            { id: "simple_sentry_ice", quantity: 1 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerCardToGrip(state, "simple_killer");
    state.runner.credits = 3;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_killer",
    );
    const innerIceId = putCorpIceOnServer(
      state,
      "hq",
      "onr_v1_259_in-the-face",
    );
    const outerIceId = putCorpIceOnServer(state, "hq", "simple_sentry_ice");
    state.cardInstances[innerIceId] = {
      ...state.cardInstances[innerIceId]!,
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[outerIceId] = {
      ...state.cardInstances[outerIceId]!,
      faceup: true,
      rezzed: true,
    };
    state.runner.credits = 3;

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(hqRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!hqRun || !gain)
      throw new Error("Missing multi-ICE HQ fixture actions");

    const pressureCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "pressure_hq",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate) throw new Error("Missing pressure_hq candidate");
    const runCost = estimateRunCost(input, pressureCandidate);
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [hqRun, gain],
    });

    expect(runCost.reasons).toContain("visible_ice_unaffordable_to_break");
    expect(runCost.evidence).toContain("visible_etr_break_cost:6");
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("backs off from a Crystal Wall remote when Tesseract and Crystal Palace make the visible path unaffordable", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-tesseract-crystal-palace-remote-cost",
        runnerDeck: batchARunnerDeck(),
        corpDeck: {
          id: "ai_tesseract_crystal_palace_corp",
          name: "AI Tesseract Crystal Palace Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_232_crystal-wall", quantity: 1 },
            { id: "onr_v1_355_crystal-palace-station-grid", quantity: 1 },
            { id: "onr_v1_370_tesseract-fort-construction", quantity: 1 },
            { id: "simple_agenda", quantity: 6 },
            { id: "simple_economy_operation", quantity: 6 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    moveRunnerCardToGrip(state, "onr_v1_021_dwarf");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    ensureRemoteServer(state, "remote_1");
    const crystalWallId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_232_crystal-wall",
    );
    state.cardInstances[crystalWallId] = {
      ...state.cardInstances[crystalWallId]!,
      faceup: true,
      rezzed: true,
    };
    for (const rootId of [
      putCorpRootInRemote(state, "onr_v1_355_crystal-palace-station-grid", 0),
      putCorpRootInRemote(state, "onr_v1_370_tesseract-fort-construction", 0),
    ]) {
      state.cardInstances[rootId] = {
        ...state.cardInstances[rootId]!,
        faceup: true,
        rezzed: true,
      };
    }
    state.runner.credits = 2;

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(remoteRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!remoteRun || !gain)
      throw new Error("Missing Tesseract/Crystal Palace fixture actions");

    const contestCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "contest_remote",
    );
    expect(contestCandidate).toBeDefined();
    if (!contestCandidate) throw new Error("Missing contest_remote candidate");
    const scopedInput = {
      ...input,
      ownDeckStrategyProfile: runnerStrategyProfileForTest(
        "runner-effective-outcome",
        ["remote_contest"],
        { contest_remote: 18 },
      ),
      eventTail: [
        syntheticPlanActionEvent(
          "runner-effective-jack-out",
          input.playerView.stateVersion + 1,
          "runner",
          "jack_out",
          "remote_1",
        ),
      ],
      legalActions: [remoteRun, gain],
    };
    const runCost = estimateRunCost(scopedInput, contestCandidate);
    const outcomeScore = evaluateRunnerPlan(scopedInput, contestCandidate);
    const decision = chooseRunnerAction(scopedInput);

    expect(runCost.reasons).toContain("visible_ice_unaffordable_to_break");
    expect(runCost.evidence).toContain("visible_etr_break_cost:3");
    expect(outcomeScore.evidence).toContain(
      "runner_jack_out_repeated_same_server_without_new_info:true",
    );
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("counts normal Codecracker pump costs once per visible ICE", () => {
    const input = codecrackerDoubleEndlessCorridorInput(
      "ai-codecracker-double-endless-low-credits",
      3,
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdRun || !gain)
      throw new Error("Missing Codecracker/Endless fixture actions");

    const pressureCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "pressure_rnd",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate) throw new Error("Missing pressure_rnd candidate");
    const runCost = estimateRunCost(input, pressureCandidate);
    const decision = chooseRunnerAction({
      ...input,
      profileId: "corp-ai-v1.4.2-normal",
      legalActions: [rdRun, gain],
    });

    expect(runCost.reasons).toContain("visible_ice_unaffordable_to_break");
    expect(runCost.evidence).toContain("visible_etr_break_cost:4");
    expect(runCost.evidence).toContain("blocked:true");
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("counts Krash pump costs once per visible ICE", () => {
    const input = krashDoubleDataWall2Input(
      "ai-krash-double-data-wall-2-low-credits",
      6,
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdRun || !gain)
      throw new Error("Missing Krash/Data Wall 2.0 fixture actions");

    const pressureCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "pressure_rnd",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate) throw new Error("Missing pressure_rnd candidate");
    const runCost = estimateRunCost(input, pressureCandidate);
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [rdRun, gain],
    });

    expect(runCost.reasons).toContain("visible_ice_unaffordable_to_break");
    expect(runCost.evidence).toContain("visible_etr_break_cost:8");
    expect(runCost.evidence).toContain("blocked:true");
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("does not mark the double Endless Corridor path blocked once Codecracker can pay both pumps", () => {
    const input = codecrackerDoubleEndlessCorridorInput(
      "ai-codecracker-double-endless-affordable",
      4,
    );
    const pressureCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "pressure_rnd",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate) throw new Error("Missing pressure_rnd candidate");

    const runCost = estimateRunCost(input, pressureCandidate);

    expect(runCost.reasons).not.toContain("visible_ice_unaffordable_to_break");
    expect(runCost.evidence).toContain("visible_etr_break_cost:4");
    expect(runCost.evidence).toContain("blocked:false");
  });

  it("uses a short Runner two-turn economy intent before an unprofitable visible HQ run", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-two-turn-hq-economy-setup",
        corpDeck: ONR_V1_1_2K_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerCardToGrip(state, "simple_killer");
    state.runner.credits = 3;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_killer",
    );
    const iceId = putCorpIceOnServer(state, "hq", "onr_v1_259_in-the-face");
    state.cardInstances[iceId] = {
      ...state.cardInstances[iceId]!,
      faceup: true,
      rezzed: true,
    };
    state.runner.credits = 2;

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(hqRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!hqRun || !gain)
      throw new Error("Missing two-turn economy fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [hqRun, gain],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(debugText).toContain("two_turn_run_intent_target:hq");
    expect(debugText).toContain("two_turn_run_intent_ready:false");
    expect(debugText).toContain("two_turn_run_intent_credits_needed:1");
    expect(debugText).toContain(
      "two_turn_run_intent_invalidates_on:target_credits_visible_ice_breakers",
    );
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("switches from the Runner two-turn economy intent to the target run after the visible threshold is met", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-two-turn-hq-economy-ready",
        corpDeck: ONR_V1_1_2K_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerCardToGrip(state, "simple_killer");
    state.runner.credits = 3;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_killer",
    );
    const iceId = putCorpIceOnServer(state, "hq", "onr_v1_259_in-the-face");
    state.cardInstances[iceId] = {
      ...state.cardInstances[iceId]!,
      faceup: true,
      rezzed: true,
    };
    state.runner.credits = 3;

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(hqRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!hqRun || !gain)
      throw new Error("Missing two-turn ready fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [hqRun, gain],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(hqRun.actionId);
    expect(decision.reasonCode).toBe("runner.plan.pressure_hq");
    expect(debugText).toContain("two_turn_run_intent_target:hq");
    expect(debugText).toContain("two_turn_run_intent_ready:true");
    expect(debugText).toContain("two_turn_run_intent_credits_needed:0");
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("hard Runner backs off from visibly unreachable protected remote roots", () => {
    const requiredCorpCards = [
      "onr_v1_279_wall-of-static",
      "onr_v1_371_tokyo-chiba-infighting",
      "onr_v1_208_on-call-solo-team",
    ];
    const corpDeckCards = [
      ...ONR_V1_1_2K_CORP_DECK.cards,
      ...requiredCorpCards
        .filter(
          (id) => !ONR_V1_1_2K_CORP_DECK.cards.some((card) => card.id === id),
        )
        .map((id) => ({ id, quantity: 1 })),
    ];
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-hard-remote-visible-block",
        corpDeck: {
          ...ONR_V1_1_2K_CORP_DECK,
          cards: corpDeckCards,
        },
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerCardToGrip(state, "simple_killer");
    state.runner.credits = 3;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_killer",
    );
    ensureRemoteServer(state, "remote_1");
    const wallId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_279_wall-of-static",
    );
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    const tokyoId = putCorpRootInRemote(
      state,
      "onr_v1_371_tokyo-chiba-infighting",
      0,
    );
    state.cardInstances[tokyoId] = {
      ...state.cardInstances[tokyoId]!,
      faceup: true,
      rezzed: true,
    };
    putCorpRootInRemote(state, "onr_v1_208_on-call-solo-team", 0);
    state.runner.credits = 0;
    state.corp.credits = 12;

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      profileId: "runner-ai-v0.9-hard",
    });
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(remoteRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!remoteRun || !gain)
      throw new Error("Missing blocked remote fixture actions");

    const contestCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "contest_remote",
    );
    const recoverCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "recover_economy",
    );
    expect(contestCandidate).toBeDefined();
    expect(recoverCandidate).toBeDefined();
    if (!contestCandidate || !recoverCandidate)
      throw new Error("Missing blocked remote fixture candidates");
    const runCost = estimateRunCost(input, contestCandidate);
    const access = evaluateServerAccessValue(input, contestCandidate);
    const remoteThreat = evaluateRemoteThreat(input, contestCandidate);
    const contestScore = evaluateRunnerPlan(input, contestCandidate);
    const recoverScore = evaluateRunnerPlan(input, recoverCandidate);
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun, gain],
    });

    expect(runCost.reasons).toContain(
      "visible_ice_unbreakable_missing_coverage",
    );
    expect(runCost.evidence).toContain("visible_etr_break_cost:unavailable");
    expect(access.reasons).toContain("visible_run_path_blocked");
    expect(remoteThreat.reasons).toContain(
      "remote_threat_unreachable_by_visible_ice",
    );
    expect(contestScore.score).toBeLessThan(recoverScore.score);
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("does not take a current-baseline Archives run when visible Archives cards are low value", () => {
    const requiredCorpCards = [
      "onr_v1_281_accounts-receivable",
      "onr_v1_282_annual-reviews",
    ];
    const corpDeckCards = [
      ...ONR_V1_1_2K_CORP_DECK.cards,
      ...requiredCorpCards
        .filter(
          (id) => !ONR_V1_1_2K_CORP_DECK.cards.some((card) => card.id === id),
        )
        .map((id) => ({ id, quantity: 1 })),
    ];
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-stale-legacy-archives",
        corpDeck: { ...ONR_V1_1_2K_CORP_DECK, cards: corpDeckCards },
        agendaPointsToWin: 7,
        baseline: CURRENT_RULES_BASELINE,
      }),
    );
    expect(state.baseline).toStrictEqual(CURRENT_RULES_BASELINE);
    expect(state.baseline.engineSchemaVersion).toBe(
      CURRENT_RULES_BASELINE.engineSchemaVersion,
    );
    const accountsId = moveCorpCardToArchives(
      state,
      "onr_v1_281_accounts-receivable",
      true,
    );
    const hiddenId = moveCorpCardToArchives(
      state,
      "onr_v1_282_annual-reviews",
      true,
    );
    keepOnlyCorpArchivesCards(state, [accountsId, hiddenId]);

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      profileId: "runner-ai-v0.9-hard",
    });
    const archivesRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(archivesRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!archivesRun || !gain)
      throw new Error("Missing current Archives fixture actions");

    const safeProbeCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "safe_probe_run",
    );
    expect(safeProbeCandidate).toBeDefined();
    if (!safeProbeCandidate)
      throw new Error("Missing safe_probe_run candidate");
    const safeProbeScore = evaluateServerAccessValue(input, safeProbeCandidate);
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [archivesRun, gain],
    });

    expect(safeProbeScore.reasons).toContain("known_archives_access_not_fresh");
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("does not value an open Archives asset as trashable access value", () => {
    const requiredCorpCards = ["simple_economy_asset"];
    const corpDeckCards = [
      ...ONR_V1_1_2K_CORP_DECK.cards,
      ...requiredCorpCards
        .filter(
          (id) => !ONR_V1_1_2K_CORP_DECK.cards.some((card) => card.id === id),
        )
        .map((id) => ({ id, quantity: 1 })),
    ];
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-open-archives-asset-no-trash-value",
        corpDeck: { ...ONR_V1_1_2K_CORP_DECK, cards: corpDeckCards },
        agendaPointsToWin: 7,
        baseline: CURRENT_RULES_BASELINE,
      }),
    );
    state.runner.credits = 5;
    const assetId = moveCorpCardToArchives(state, "simple_economy_asset", true);
    keepOnlyCorpArchivesCards(state, [assetId]);

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      profileId: "runner-ai-v0.9-hard",
    });
    const archivesRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(archivesRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!archivesRun || !gain)
      throw new Error("Missing open Archives asset fixture actions");

    const safeProbeCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "safe_probe_run",
    );
    expect(safeProbeCandidate).toBeDefined();
    if (!safeProbeCandidate)
      throw new Error("Missing open Archives safe_probe_run candidate");
    const safeProbeScore = evaluateServerAccessValue(input, safeProbeCandidate);
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [archivesRun, gain],
    });

    expect(safeProbeScore.reasons).toContain("known_archives_access_not_fresh");
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("does not pump or repeat a remote run when the visible breaker cannot break the rezzed ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-crystal-wall-loop",
        runnerDeckId: "demo_runner_004",
        corpDeck: {
          ...ONR_V1_1_2K_CORP_DECK,
          cards: [
            ...ONR_V1_1_2K_CORP_DECK.cards,
            { id: "onr_v1_232_crystal-wall", quantity: 1 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 8;
    state.corp.credits = 8;
    moveRunnerCardToGrip(state, "efficient_fracter");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "efficient_fracter",
    );
    ensureRemoteServer(state, "remote_1");
    putCorpIceOnServer(state, "remote_1", "onr_v1_232_crystal-wall");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_232_crystal-wall",
    );

    const encounterInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const pump = encounterInput.legalActions.find(
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinitionFromInput(encounterInput, action) ===
          "efficient_fracter",
    );
    const breakAction = encounterInput.legalActions.find(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinitionFromInput(encounterInput, action) ===
          "efficient_fracter",
    );
    const encounterDecision = chooseRunnerAction(encounterInput);
    const encounterSelected = encounterInput.legalActions.find(
      (action) => action.actionId === encounterDecision.actionId,
    );

    expect(pump).toBeUndefined();
    expect(breakAction).toBeUndefined();
    expect(encounterSelected?.type).toBe("continue_run");
    expect(encounterDecision.reasonCode).toBe("runner.plan.safe_probe_run");

    state = apply(state, "runner", (action) => action.type === "continue_run");
    const afterRunInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const repeatRemoteRun = afterRunInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const gain = afterRunInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(repeatRemoteRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!repeatRemoteRun || !gain)
      throw new Error("Missing post-run fixture actions");

    const afterRunDecision = chooseRunnerAction({
      ...afterRunInput,
      legalActions: [repeatRemoteRun, gain],
    });

    expect(afterRunDecision.actionId).toBe(gain.actionId);
    expect(afterRunDecision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("breaks Filter directly with Krash and does not pump after the only subroutine is broken", () => {
    let state = krashFilterEncounterState("ai-krash-filter-direct-break");
    const encounterInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const pump = encounterInput.legalActions.find(
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinitionFromInput(encounterInput, action) ===
          "onr_v1_039_krash",
    );
    const breakAction = encounterInput.legalActions.find(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinitionFromInput(encounterInput, action) ===
          "onr_v1_039_krash",
    );
    const encounterDecision = chooseRunnerAction(encounterInput);
    const encounterSelected = encounterInput.legalActions.find(
      (action) => action.actionId === encounterDecision.actionId,
    );

    expect(pump).toBeDefined();
    expect(breakAction).toBeDefined();
    expect(encounterSelected?.type).toBe("break_subroutine");
    expect(encounterDecision.reasonCode).toBe("runner.encounter.break_etr");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_039_krash",
    );
    expect(state.run?.brokenSubroutineIndexes).toEqual([0]);

    const afterBreakInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const afterBreakPump = afterBreakInput.legalActions.find(
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinitionFromInput(afterBreakInput, action) ===
          "onr_v1_039_krash",
    );
    const afterBreakContinue = afterBreakInput.legalActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );
    const afterBreakDecision = chooseRunnerAction(afterBreakInput);
    const afterBreakSelected = afterBreakInput.legalActions.find(
      (action) => action.actionId === afterBreakDecision.actionId,
    );

    expect(afterBreakPump).toBeUndefined();
    expect(afterBreakContinue?.payload?.unbrokenSubroutineCount).toBe(0);
    expect(afterBreakSelected?.type).toBe("continue_run");
    expect([
      "runner.encounter.continue",
      "runner.plan.safe_probe_run",
    ]).toContain(afterBreakDecision.reasonCode);

    state = apply(
      state,
      "runner",
      (action) => action.actionId === afterBreakContinue?.actionId,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      encounterContinue: true,
      unbrokenSubroutineCount: 0,
      encounterWillEndRun: false,
    });
  });

  it("does not pump Krash when Keeper remains unbreakable afterward", () => {
    const state = krashKeeperHqEncounterState("ai-krash-keeper-useless-pump");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const pump = input.legalActions.find(
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_039_krash",
    );
    const breakAction = input.legalActions.find(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_039_krash",
    );
    const continueRun = input.legalActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(pump).toBeDefined();
    expect(breakAction).toBeUndefined();
    expect(selected?.type).not.toBe("pump_breaker");
    expect(continueRun).toBeDefined();
    if (!pump || !continueRun)
      throw new Error("Missing Krash/Keeper fixture actions");

    const baselineDecision = chooseRunnerBaselineAction({
      ...input,
      legalActions: [pump, continueRun],
    });
    const baselineSelected = input.legalActions.find(
      (action) => action.actionId === baselineDecision.actionId,
    );
    expect(baselineSelected?.type).toBe("continue_run");
    expect(baselineDecision.reasonCode).toBe("runner.encounter.continue");
  });

  it("does not pump Dwarf through Rock when the known remote trash becomes unaffordable", () => {
    const state = dwarfRemoteEncounterState("ai-dwarf-rock-bbs-unaffordable", {
      runnerCredits: 6,
      iceDefinitionId: "onr_v1_265_rock-is-strong",
      rootDefinitionId: "onr_v1_309_bbs-whispering-campaign",
      scoredSuperiorNetBarriers: true,
    });
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const pump = input.legalActions.find(
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_021_dwarf",
    );
    const continueRun = input.legalActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(pump).toBeDefined();
    expect(continueRun).toBeDefined();
    if (!pump || !continueRun)
      throw new Error("Missing Dwarf/Rock encounter actions");
    expect(input.playerView.run?.encounteredIce?.strength).toBe(6);
    expect(continueRun?.payload?.encounterWillEndRun).toBe(true);
    expect(selected?.type).toBe("continue_run");
    expect([
      "runner.encounter.continue",
      "runner.plan.safe_probe_run",
    ]).toContain(decision.reasonCode);
    const encounterDecision = chooseRunnerBaselineAction({
      ...input,
      legalActions: [pump, continueRun],
    });
    const encounterSelected = input.legalActions.find(
      (action) => action.actionId === encounterDecision.actionId,
    );
    expect(encounterSelected?.type).toBe("continue_run");
    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const semanticDecision = chooseRunnerAction({
      ...input,
      legalActions: [pump, continueRun],
    });
    const semanticSelected = input.legalActions.find(
      (action) => action.actionId === semanticDecision.actionId,
    );
    expect(semanticSelected?.type).toBe("continue_run");
    expect(JSON.stringify(semanticDecision.decisionDebug)).toContain(
      "encounter_remote_payoff:trash_unaffordable",
    );
    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "legacy";
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|corp\.hq|corp\.rd/i,
    );
  });

  it("does not pump Dwarf through central Fire Wall when the remaining known HQ path is unaffordable", () => {
    const state = dwarfDoubleFireWallHqEncounterState(
      "ai-dwarf-hq-double-firewall-unaffordable",
      {
        runnerCredits: 5,
        scoredSuperiorNetBarriers: 2,
      },
    );
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const pump = input.legalActions.find(
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_021_dwarf",
    );
    const continueRun = input.legalActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );
    const hq = input.playerView.servers.find((server) => server.id === "hq");
    const knownRezzedFireWalls =
      hq?.ice.filter(
        (ice) =>
          ice.definitionId === "onr_v1_245_fire-wall" &&
          ice.known &&
          ice.rezzed,
      ) ?? [];
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(pump).toBeDefined();
    expect(continueRun).toBeDefined();
    if (!pump || !continueRun)
      throw new Error("Missing Dwarf/Fire Wall encounter actions");
    expect(input.playerView.run?.encounteredIce?.strength).toBe(6);
    expect(knownRezzedFireWalls).toHaveLength(2);
    expect(continueRun?.payload?.encounterWillEndRun).toBe(true);
    expect(selected?.type).toBe("continue_run");
    expect([
      "runner.encounter.continue",
      "runner.plan.safe_probe_run",
    ]).toContain(decision.reasonCode);

    const baselineDecision = chooseRunnerBaselineAction({
      ...input,
      legalActions: [pump, continueRun],
    });
    const baselineSelected = input.legalActions.find(
      (action) => action.actionId === baselineDecision.actionId,
    );
    expect(baselineSelected?.type).toBe("continue_run");

    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const semanticDecision = chooseRunnerAction({
      ...input,
      legalActions: [pump, continueRun],
    });
    const semanticSelected = input.legalActions.find(
      (action) => action.actionId === semanticDecision.actionId,
    );
    expect(semanticSelected?.type).toBe("continue_run");
    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "legacy";
  });

  it("still pumps Dwarf through Rock when enough credits remain to trash the known remote", () => {
    const state = dwarfRemoteEncounterState("ai-dwarf-rock-bbs-affordable", {
      runnerCredits: 8,
      iceDefinitionId: "onr_v1_265_rock-is-strong",
      rootDefinitionId: "onr_v1_309_bbs-whispering-campaign",
      scoredSuperiorNetBarriers: true,
    });
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(selected?.type).toBe("pump_breaker");
    expect(sourceDefinitionFromInput(input, selected!)).toBe(
      "onr_v1_021_dwarf",
    );
    expect(decision.reasonCode).toBe("runner.encounter.pump_breaker");
  });

  it("still pumps Dwarf through Rock when a known remote agenda is the payoff", () => {
    const state = dwarfRemoteEncounterState("ai-dwarf-rock-known-agenda", {
      runnerCredits: 6,
      iceDefinitionId: "onr_v1_265_rock-is-strong",
      rootDefinitionId: "onr_v1_220_tycho-extension",
      scoredSuperiorNetBarriers: true,
    });
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(selected?.type).toBe("pump_breaker");
    expect(sourceDefinitionFromInput(input, selected!)).toBe(
      "onr_v1_021_dwarf",
    );
    expect(decision.reasonCode).toBe("runner.encounter.pump_breaker");
  });

  it("still breaks a harmful Wall subroutine even when remote trash would be unaffordable", () => {
    const state = dwarfRemoteEncounterState("ai-dwarf-razor-harmful-break", {
      runnerCredits: 4,
      iceDefinitionId: "onr_v1_262_razor-wire",
      rootDefinitionId: "onr_v1_309_bbs-whispering-campaign",
      scoredSuperiorNetBarriers: false,
    });
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(selected?.type).toBe("break_subroutine");
    expect(sourceDefinitionFromInput(input, selected!)).toBe(
      "onr_v1_021_dwarf",
    );
    expect(decision.reasonCode).toMatch(/^runner\.encounter\.break/);
    expect(JSON.stringify(decision.decisionDebug)).not.toContain(
      "encounter_remote_payoff_blocked:true",
    );
  });

  it("continues into R&D access after passing the last ICE instead of jacking out", () => {
    let state = krashFilterEncounterState("ai-krash-filter-access-after-pass");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_039_krash",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );
    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(state.run?.phase).toBe("movement");
    expect(state.run?.position.kind).toBe("server");

    const movementInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const jackOut = movementInput.legalActions.find(
      (action) => action.type === "jack_out",
    );
    const continueRun = movementInput.legalActions.find(
      (action) => action.type === "continue_run",
    );
    const movementDecision = chooseRunnerAction(movementInput);
    const movementSelected = movementInput.legalActions.find(
      (action) => action.actionId === movementDecision.actionId,
    );

    expect(jackOut).toBeDefined();
    expect(continueRun).toBeDefined();
    expect(movementSelected?.type).toBe("continue_run");
    expect(movementDecision.reasonCode).toBe("runner.plan.safe_probe_run");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === continueRun?.actionId,
    );
    expect(state.timingPoint).toBe("access.resolve_card");

    const accessInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const accessDecision = chooseRunnerAction(accessInput);
    const accessSelected = accessInput.legalActions.find(
      (action) => action.actionId === accessDecision.actionId,
    );

    expect(
      accessInput.legalActions.some((action) => action.type === "jack_out"),
    ).toBe(false);
    expect(accessSelected?.type).toBe("access_card");
    expect(accessDecision.reasonCode).toBe("runner.access.open_card");
  });

  it("runs the Krash/Filter R&D path through sequential Runner AI decisions without hidden access assumptions", () => {
    let state = krashFilterEncounterState(
      "ai-krash-filter-sequenced-rd-access",
    );
    const actionTypes: string[] = [];
    const reasonCodes: string[] = [];

    for (let step = 0; step < 4; step += 1) {
      const input = buildAiDecisionInput(state, "runner", {
        difficulty: "normal",
        profileId: "runner-ai-v1.4.1-normal",
        decisionId: `krash-filter-rd-access:${step}`,
        actionNumber: step,
      });
      const decision = chooseRunnerAction(input);
      const selected = input.legalActions.find(
        (action) => action.actionId === decision.actionId,
      );
      expect(selected, `Missing selected action at step ${step}`).toBeDefined();
      if (!selected) throw new Error(`Missing selected action at step ${step}`);

      const serializedDecision = JSON.stringify({
        evidence: decision.evidence,
        decisionDebug: decision.decisionDebug,
        explanation: decision.explanation,
        reasonCode: decision.reasonCode,
      });
      expect(selected.type).not.toBe("jack_out");
      expect(serializedDecision).not.toMatch(
        /ambush|simple_economy_operation/i,
      );

      actionTypes.push(selected.type);
      reasonCodes.push(decision.reasonCode);
      state = apply(
        state,
        "runner",
        (action) => action.actionId === selected.actionId,
      );
      if (selected.type === "access_card") break;
    }

    expect(actionTypes).toEqual([
      "break_subroutine",
      "continue_run",
      "continue_run",
      "access_card",
    ]);
    expect(reasonCodes[0]).toBe("runner.encounter.break_etr");
    expect(reasonCodes).toContain("runner.plan.safe_probe_run");
    expect(reasonCodes.at(-1)).toBe("runner.access.open_card");
    expect(
      state.eventLog.map((event) => event.publicPayload.actionType),
    ).not.toContain("jack_out");
  });

  it("still pumps when strength is the missing requirement for a useful break", () => {
    const state = weakFracterBarrierEncounterState("ai-useful-pump");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const pump = input.legalActions.find(
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinitionFromInput(input, action) === "efficient_fracter",
    );
    const breakAction = input.legalActions.find(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinitionFromInput(input, action) === "efficient_fracter",
    );
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(pump).toBeDefined();
    expect(breakAction).toBeUndefined();
    expect(selected?.type).toBe("pump_breaker");
    expect(decision.reasonCode).toBe("runner.encounter.pump_breaker");
  });

  it("prioritizes removing public tags when legal", () => {
    const state = toRunnerTurn(createGameAfterSetup({ seed: "ai-remove-tag" }));
    state.runner.tags = 1;
    state.runner.credits = 2;
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });

    const decision = chooseRunnerAction(input);

    expect(
      input.legalActions.find((action) => action.actionId === decision.actionId)
        ?.type,
    ).toBe("remove_tag");
    expect(decision.explanation).not.toContain(
      "Simple Tag Punishment Operation",
    );
  });
});

describe("MVP 0.3 Corp AI v2", () => {
  it("prioritizes scoring an advanced remote agenda", () => {
    let state = createGameAfterSetup({ seed: "ai-corp-score" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 3;
    putCorpRootInRemote(state, "simple_agenda", 3);

    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const decision = chooseCorpAction(input);

    expect(
      input.legalActions.find((action) => action.actionId === decision.actionId)
        ?.type,
    ).toBe("score_agenda");
    expect(decision.reasonCode).toBe("corp.plan.score_now");
    expect(decision.decisionDebug).toMatchObject({
      aiLevel: 2,
      planKind: "score_now",
      fallbackUsed: false,
    });
  });
});

describe("V1.4.2 belief state and opponent model", () => {
  it("reconstructs deterministic side-safe belief knowledge kinds with hypotheses", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "ai-v142-kinds" }));
    putCorpRootInRemote(state, "simple_agenda", 1);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const belief = reconstructBeliefState(input);
    const kinds = new Set(belief.entries.map((entry) => entry.kind));

    expect(kinds.has("own_private_fact")).toBe(true);
    expect(kinds.has("public_fact")).toBe(true);
    expect(kinds.has("revealed_opponent_fact")).toBe(true);
    expect(kinds.has("hypothesis")).toBe(true);
    expect(kinds.has("unknown")).toBe(true);
    expect(belief.assumptions).toContain(
      "belief_state_reconstructed_from_side_safe_history",
    );
    expect(JSON.stringify(belief)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  });

  it("keeps Runner and Corp reconnect belief signatures stable for equal side-safe projections", () => {
    const stateA = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-invariance" }),
    );
    const stateB = structuredClone(stateA);
    const hiddenCorpRdId = stateA.corp.rd[0];
    const hiddenRunnerStackId = stateA.runner.stack[0];
    expect(hiddenCorpRdId).toBeDefined();
    expect(hiddenRunnerStackId).toBeDefined();
    if (!hiddenCorpRdId) throw new Error("Missing hidden R&D card");
    if (!hiddenRunnerStackId) throw new Error("Missing hidden Stack card");
    stateA.cardInstances[hiddenCorpRdId] = {
      ...stateA.cardInstances[hiddenCorpRdId]!,
      definitionId: "simple_agenda",
      faceup: false,
      rezzed: false,
    };
    stateB.cardInstances[hiddenCorpRdId] = {
      ...stateB.cardInstances[hiddenCorpRdId]!,
      definitionId: "simple_economy_asset",
      faceup: false,
      rezzed: false,
    };
    stateA.cardInstances[hiddenRunnerStackId] = {
      ...stateA.cardInstances[hiddenRunnerStackId]!,
      definitionId: "simple_fracter",
      faceup: false,
      rezzed: false,
    };
    stateB.cardInstances[hiddenRunnerStackId] = {
      ...stateB.cardInstances[hiddenRunnerStackId]!,
      definitionId: "simple_decoder",
      faceup: false,
      rezzed: false,
    };

    const runnerInputA = buildAiDecisionInput(stateA, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const runnerInputB = buildAiDecisionInput(stateB, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const corpInputA = buildAiDecisionInput(stateA, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.2-normal",
    });
    const corpInputB = buildAiDecisionInput(stateB, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.2-normal",
    });
    const runnerBeliefA = reconstructBeliefState({
      ...runnerInputA,
      eventTail: runnerInputA.playerView.publicEvents,
    });
    const runnerBeliefB = reconstructBeliefState({
      ...runnerInputB,
      eventTail: runnerInputB.playerView.publicEvents,
    });
    const corpBeliefA = reconstructBeliefState({
      ...corpInputA,
      eventTail: corpInputA.playerView.publicEvents,
    });
    const corpBeliefB = reconstructBeliefState({
      ...corpInputB,
      eventTail: corpInputB.playerView.publicEvents,
    });

    expect(JSON.stringify(getPlayerView(stateA, "runner"))).toBe(
      JSON.stringify(getPlayerView(stateB, "runner")),
    );
    expect(JSON.stringify(getPlayerView(stateA, "corp"))).toBe(
      JSON.stringify(getPlayerView(stateB, "corp")),
    );
    expect(beliefStateInvariantSignature(runnerBeliefA)).toBe(
      beliefStateInvariantSignature(runnerBeliefB),
    );
    expect(beliefStateInvariantSignature(corpBeliefA)).toBe(
      beliefStateInvariantSignature(corpBeliefB),
    );
    expect(JSON.stringify(runnerBeliefA)).not.toMatch(
      /simple_agenda|simple_economy_asset|cardInstances|privatePayload/,
    );
    expect(JSON.stringify(corpBeliefA)).not.toMatch(
      /simple_fracter|simple_decoder|cardInstances|privatePayload/,
    );
  });

  it("preserves central access memory through reconnect history and removes rolled-back HQ facts", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-reconnect-central-memory" }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const rdAccess = syntheticCentralAccessEvent(
      "ai-v142-reconnect-rd-access",
      100,
      "rd",
      "simple_agenda",
    );
    const hqAccess = syntheticCentralAccessEvent(
      "ai-v142-reconnect-hq-access",
      101,
      "hq",
      "simple_economy_operation",
    );
    const archivesAccess = syntheticCentralAccessEvent(
      "ai-v142-reconnect-archives-access",
      102,
      "archives",
      "simple_economy_asset",
    );
    const liveInput = {
      ...baseInput,
      eventTail: [...baseInput.eventTail, rdAccess, hqAccess, archivesAccess],
    };
    const reconnectInput = {
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        publicEvents: [
          ...baseInput.playerView.publicEvents,
          rdAccess,
          hqAccess,
          archivesAccess,
        ],
      },
      eventTail: [archivesAccess, hqAccess, rdAccess],
    };

    const liveBelief = reconstructBeliefState(liveInput);
    const reconnectBelief = reconstructBeliefState(reconnectInput);
    const memoryByZone = new Map(
      (reconnectBelief.knownPositionMemory ?? []).map((entry) => [
        entry.zone,
        entry,
      ]),
    );
    const rolledBackBelief = reconstructBeliefState({
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        publicEvents: baseInput.playerView.publicEvents,
      },
      eventTail: baseInput.eventTail,
    });

    expect(beliefStateInvariantSignature(reconnectBelief)).toBe(
      beliefStateInvariantSignature(liveBelief),
    );
    expect(memoryByZone.get("rd")).toMatchObject({
      positionKey: "top",
      definitionId: "simple_agenda",
    });
    expect(memoryByZone.get("hq")).toMatchObject({
      positionKey: "accessed",
      definitionId: "simple_economy_operation",
    });
    expect(memoryByZone.get("archives")).toMatchObject({
      positionKey: "accessed",
      definitionId: "simple_economy_asset",
    });
    expect(
      reconnectBelief.runnerOpponentModel?.hqHandMemory.knownDefinitions,
    ).toContain("simple_economy_operation");
    expect(
      rolledBackBelief.runnerOpponentModel?.hqHandMemory.knownDefinitions ?? [],
    ).not.toContain("simple_economy_operation");
    expect(
      rolledBackBelief.knownPositionMemory?.some(
        (entry) =>
          entry.zone === "hq" &&
          entry.definitionId === "simple_economy_operation",
      ) ?? false,
    ).toBe(false);
    expect(JSON.stringify(rolledBackBelief)).not.toContain(
      "revealed_opponent_card:simple_economy_operation",
    );
  });

  it("ignores replay private payload decoys while reconstructing access belief", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-private-payload-decoy" }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const accessEvent = syntheticCentralAccessEvent(
      "ai-v142-private-payload-rd-access",
      100,
      "rd",
      "simple_agenda",
    );
    const taintedEvent = {
      ...accessEvent,
      privatePayload: {
        cardDefinitionId: "simple_priority_agenda",
        title: "Hidden Priority Agenda",
      },
      cardInstances: {
        hidden: { definitionId: "simple_priority_agenda" },
      },
    } as PublicGameEvent & {
      privatePayload: Record<string, unknown>;
      cardInstances: Record<string, unknown>;
    };
    const sanitizedInput = buildAiDecisionInputDto({
      side: "runner",
      playerView: {
        ...baseInput.playerView,
        publicEvents: [...baseInput.playerView.publicEvents, taintedEvent],
      },
      eventTail: [...baseInput.eventTail, taintedEvent],
      legalActions: baseInput.legalActions,
      difficulty: "normal",
      seed: baseInput.seed,
      decisionId: "ai-v142-private-payload-decoy:runner",
      actionNumber: baseInput.actionNumber,
      profileId: "runner-ai-v1.4.2-normal",
    });
    const belief = reconstructBeliefState(sanitizedInput);
    const serializedInput = JSON.stringify(sanitizedInput);
    const serializedBelief = JSON.stringify(belief);

    expect(assertAiInputIsSideSafe(sanitizedInput)).toBe(true);
    expect(serializedInput).not.toMatch(
      /privatePayload|cardInstances|simple_priority_agenda/,
    );
    expect(serializedBelief).not.toMatch(
      /privatePayload|cardInstances|simple_priority_agenda/,
    );
    expect(belief.knownPositionMemory?.[0]).toMatchObject({
      zone: "rd",
      positionKey: "top",
      definitionId: "simple_agenda",
    });
  });

  it("keeps HQ hand ledger derived only from side-safe public AIInput fields", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-hq-ledger-side-safe" }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const hqAccessEvent = syntheticHqMemoryEvent(
      "ai-v142-hq-ledger-public-access",
      100,
      "runner",
      "access_card",
      "simple_economy_operation",
    );
    const taintedEvent = {
      ...hqAccessEvent,
      privatePayload: {
        cardDefinitionId: "simple_priority_agenda",
        decklist: ["simple_priority_agenda"],
        hiddenHq: ["hidden-card"],
      },
      cardInstances: {
        hidden: { definitionId: "simple_priority_agenda" },
      },
    } as PublicGameEvent & {
      privatePayload: Record<string, unknown>;
      cardInstances: Record<string, unknown>;
    };
    const sanitizedInput = buildAiDecisionInputDto({
      side: "runner",
      playerView: {
        ...baseInput.playerView,
        publicEvents: [...baseInput.playerView.publicEvents, taintedEvent],
      },
      eventTail: [...baseInput.eventTail, taintedEvent],
      legalActions: baseInput.legalActions,
      difficulty: "normal",
      seed: baseInput.seed,
      decisionId: "ai-v142-hq-ledger-side-safe:runner",
      actionNumber: baseInput.actionNumber,
      profileId: "runner-ai-v1.4.2-normal",
    });
    const belief = reconstructBeliefState(sanitizedInput);
    const ledger = belief.runnerOpponentModel?.hqHandMemory.ledger;

    expect(assertAiInputIsSideSafe(sanitizedInput)).toBe(true);
    expect(ledger).toMatchObject({
      safeDefinitions: [
        {
          definitionId: "simple_economy_operation",
          count: 1,
          sourceEventIds: ["ai-v142-hq-ledger-public-access"],
        },
      ],
      candidateGroups: [],
    });
    expect(JSON.stringify(ledger)).not.toMatch(
      /privatePayload|cardInstances|simple_priority_agenda|decklist|hidden-card/i,
    );
  });

  it("tracks R&D access freshness and invalidates after Corp draw, then reconstructs after undo-like rollback", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-rnd-freshness" }),
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    if (
      getLegalActions(state, "runner").some(
        (action) => action.type === "trash_accessed_card",
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) => action.type === "decline_trash",
      );
    }
    if (
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "continue_run" || action.type === "jack_out",
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "continue_run" || action.type === "jack_out",
      );
    }
    const staleState = structuredClone(state);
    const staleBelief = reconstructBeliefState(
      buildAiDecisionInput(staleState, "runner", {
        difficulty: "normal",
        profileId: "runner-ai-v1.4.2-normal",
      }),
    );
    expect(staleBelief.runnerOpponentModel?.rndTopFreshness.freshness).toBe(
      "stale_known_same_top",
    );

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const invalidatedBelief = reconstructBeliefState(
      buildAiDecisionInput(state, "runner", {
        difficulty: "normal",
        profileId: "runner-ai-v1.4.2-normal",
      }),
    );
    expect(
      invalidatedBelief.runnerOpponentModel?.rndTopFreshness.freshness,
    ).toBe("invalidated");
    expect(
      invalidatedBelief.runnerOpponentModel?.rndTopFreshness.invalidationReasons.join(
        "|",
      ),
    ).toContain("corp_draw_from_rd");

    const reconstructedAfterUndo = reconstructBeliefState(
      buildAiDecisionInput(staleState, "runner", {
        difficulty: "normal",
        profileId: "runner-ai-v1.4.2-normal",
      }),
    );
    expect(
      reconstructedAfterUndo.runnerOpponentModel?.rndTopFreshness.freshness,
    ).toBe("stale_known_same_top");
  });

  it("tracks side-safe known position memory and invalidates R&D top after Corp draw", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v198-known-position-memory" }),
    );
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const accessEvent: PublicGameEvent = {
      eventId: "v198-known-rd-top",
      type: "access_card",
      stateVersionBefore: input.playerView.stateVersion,
      stateVersionAfter: input.playerView.stateVersion + 1,
      stateHashAfter: "fnv1a:v198access",
      visibilityClass: "hidden_info_barrier",
      publicPayload: {
        actor: "runner",
        actionType: "access_card",
        serverId: "rd",
        cardDefinitionId: "simple_agenda",
        label: "Runner accesses R&D",
      },
    };
    const accessedBelief = reconstructBeliefState({
      ...input,
      eventTail: [...input.eventTail, accessEvent],
    });
    expect(accessedBelief.knownPositionMemory?.[0]).toMatchObject({
      zone: "rd",
      positionKey: "top",
      definitionId: "simple_agenda",
      certainty: "observed",
    });
    expect(
      accessedBelief.runnerOpponentModel?.knownPositionMemory[0],
    ).toMatchObject({
      zone: "rd",
      positionKey: "top",
      definitionId: "simple_agenda",
    });

    const drawEvent: PublicGameEvent = {
      eventId: "v198-corp-draw-invalidates-rd-top",
      type: "mandatory_draw",
      stateVersionBefore: input.playerView.stateVersion + 1,
      stateVersionAfter: input.playerView.stateVersion + 2,
      stateHashAfter: "fnv1a:v198draw",
      visibilityClass: "private_to_side",
      publicPayload: {
        actor: "corp",
        actionType: "mandatory_draw",
        label: "Korp Pflichtkarte ziehen",
      },
    };
    const invalidatedBelief = reconstructBeliefState({
      ...input,
      eventTail: [...input.eventTail, accessEvent, drawEvent],
    });
    expect(invalidatedBelief.knownPositionMemory ?? []).toEqual([]);
    expect(
      invalidatedBelief.runnerOpponentModel?.knownPositionMemory ?? [],
    ).toEqual([]);
    expect(JSON.stringify(invalidatedBelief)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  });

  it("transfers known R&D top agenda into HQ memory after Corp draw and boosts HQ pressure", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-rnd-top-agenda-to-hq",
        ...hqMemoryDeckConfig("rnd-top-agenda-to-hq"),
      }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const input = {
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticCentralAccessEvent(
          "ai-rnd-known-agenda",
          100,
          "rd",
          "simple_agenda",
        ),
        syntheticPlanActionEvent(
          "ai-rnd-known-agenda-drawn",
          101,
          "corp",
          "mandatory_draw",
        ),
      ],
    };
    const belief = reconstructBeliefState(input);
    const candidate = generateRunnerPlanCandidates(input).find(
      (plan) => plan.kind === "pressure_hq",
    );
    if (!candidate) throw new Error("Missing pressure_hq candidate");
    const score = evaluateServerAccessValue(input, candidate, belief);

    expect(belief.runnerOpponentModel?.hqHandMemory.knownDefinitions).toContain(
      "simple_agenda",
    );
    expect(
      belief.runnerOpponentModel?.hqHandMemory.invalidationReasons.join("|"),
    ).toContain("known_rnd_top_moved_to_hq");
    expect(
      JSON.stringify(chooseRunnerAction(input).decisionDebug?.hypotheses ?? []),
    ).not.toContain("opponent_hidden_hand_cards");
    expect(score.reasons).toContain("known_hq_agenda_pressure");
    expect(score.evidence).toContain(
      "hq_run_boosted_because_known_agenda:true",
    );
  });

  it("does not transfer R&D top knowledge through shuffle/reorder before draw and keeps multi-draw unknown remainder", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-rnd-top-shuffle-before-draw",
        ...hqMemoryDeckConfig("rnd-top-shuffle"),
      }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const shuffled = reconstructBeliefState({
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticCentralAccessEvent(
          "ai-rnd-known-before-shuffle",
          100,
          "rd",
          "simple_agenda",
        ),
        syntheticPlanActionEvent(
          "ai-rnd-shuffle",
          101,
          "corp",
          "resolve_choice",
          undefined,
          {
            hiddenZoneAction: "corp_rd_shuffle",
          },
        ),
        syntheticPlanActionEvent(
          "ai-rnd-draw-after-shuffle",
          102,
          "corp",
          "mandatory_draw",
        ),
      ],
    });
    const multiDrawInput = {
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        opponent: { ...baseInput.playerView.opponent, handCount: 4 },
      },
      eventTail: [
        ...baseInput.eventTail,
        syntheticCentralAccessEvent(
          "ai-rnd-known-nonagenda",
          100,
          "rd",
          "simple_barrier_ice",
        ),
        syntheticPlanActionEvent(
          "ai-rnd-multi-draw",
          101,
          "corp",
          "draw_card",
          undefined,
          {
            drawnCount: 3,
          },
        ),
      ],
    };
    const multiDraw = reconstructBeliefState(multiDrawInput);
    const candidate = generateRunnerPlanCandidates(multiDrawInput).find(
      (plan) => plan.kind === "pressure_hq",
    );
    if (!candidate) throw new Error("Missing pressure_hq candidate");
    const score = evaluateServerAccessValue(
      multiDrawInput,
      candidate,
      multiDraw,
    );

    expect(
      shuffled.runnerOpponentModel?.hqHandMemory.knownDefinitions ?? [],
    ).not.toContain("simple_agenda");
    expect(multiDraw.runnerOpponentModel?.hqHandMemory).toMatchObject({
      knownDefinitions: ["simple_barrier_ice"],
      knownCount: 1,
      handCount: 4,
      allCardsKnown: false,
    });
    expect(score.reasons).not.toContain("known_hq_agenda_pressure");
    expect(score.evidence).toContain(
      "hq_run_boosted_because_unknown_cards_remain:true",
    );
  });

  it("retains known remote access memory for agendas and trashable cards, then invalidates on new install", () => {
    const input = runnerActionPhaseInput(
      "ai-known-remote-memory",
      (state) => {
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 0);
        state.runner.credits = 9;
      },
      hqMemoryDeckConfig("known-remote-memory"),
    );
    const agendaMemoryInput = {
      ...input,
      eventTail: [
        ...input.eventTail,
        syntheticRemoteAccessEvent(
          "ai-known-remote-agenda",
          100,
          "remote_1",
          "simple_agenda",
          "root:0",
        ),
      ],
    };
    const trashMemoryInput = {
      ...input,
      eventTail: [
        ...input.eventTail,
        syntheticRemoteAccessEvent(
          "ai-known-remote-upgrade",
          100,
          "remote_1",
          "simple_upgrade",
          "root:0",
        ),
      ],
    };
    const invalidated = reconstructBeliefState({
      ...agendaMemoryInput,
      eventTail: [
        ...agendaMemoryInput.eventTail,
        syntheticPlanActionEvent(
          "ai-known-remote-new-install",
          101,
          "corp",
          "install_card",
          "remote_1",
        ),
      ],
    });
    const agendaCandidate = generateRunnerPlanCandidates(
      agendaMemoryInput,
    ).find((candidate) => candidate.kind === "contest_remote");
    const trashCandidate = generateRunnerPlanCandidates(trashMemoryInput).find(
      (candidate) => candidate.kind === "contest_remote",
    );
    if (!agendaCandidate || !trashCandidate)
      throw new Error("Missing remote contest candidates");
    const agendaThreat = evaluateRemoteThreat(
      agendaMemoryInput,
      agendaCandidate,
      reconstructBeliefState(agendaMemoryInput),
    );
    const trashThreat = evaluateRemoteThreat(
      trashMemoryInput,
      trashCandidate,
      reconstructBeliefState(trashMemoryInput),
    );

    expect(
      reconstructBeliefState(agendaMemoryInput).knownPositionMemory?.[0],
    ).toMatchObject({
      zone: "remote_1",
      positionKey: "root:0",
      definitionId: "simple_agenda",
    });
    expect(agendaThreat.reasons).toContain("known_remote_agenda_pressure");
    expect(trashThreat.reasons).toContain("known_remote_trash_target");
    expect(invalidated.knownPositionMemory ?? []).toEqual([]);
  });

  it("uses exposed unrezzed ICE memory for later run-cost assessment and invalidates on conceal/reorder", () => {
    const input = runnerActionPhaseInput(
      "ai-known-unrezzed-ice-memory",
      (state) => {
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        putCorpRootInRemote(state, "simple_agenda", 1);
        state.runner.credits = 0;
      },
      hqMemoryDeckConfig("known-unrezzed-ice"),
    );
    const exposedInput = {
      ...input,
      eventTail: [
        ...input.eventTail,
        syntheticExposeInstalledEvent(
          "ai-exposed-unrezzed-ice",
          100,
          "remote_1",
          "ice:0",
          "simple_barrier_ice",
        ),
      ],
    };
    const candidate = generateRunnerPlanCandidates(exposedInput).find(
      (plan) => plan.kind === "contest_remote",
    );
    if (!candidate) throw new Error("Missing exposed ICE run candidate");
    const cost = estimateRunCost(exposedInput, candidate);
    const invalidated = reconstructBeliefState({
      ...exposedInput,
      eventTail: [
        ...exposedInput.eventTail,
        syntheticPlanActionEvent(
          "ai-new-blood-reorder",
          101,
          "corp",
          "play_operation",
          undefined,
          {
            hiddenZoneAction: "new_blood_conceal_reorder_installed_ice",
          },
        ),
      ],
    });

    expect(
      reconstructBeliefState(exposedInput).knownPositionMemory?.[0],
    ).toMatchObject({
      zone: "remote_1",
      positionKey: "ice:0",
      definitionId: "simple_barrier_ice",
    });
    expect(cost.evidence).toContain("known_unrezzed_ice_from_expose:1");
    expect(cost.evidence).toContain("known_unrezzed_ice_blocks_path:true");
    expect(invalidated.knownPositionMemory ?? []).toEqual([]);
  });

  it("applies R&D repeat-access penalty only while top-card freshness is stale", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-rnd-penalty" }),
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    if (
      getLegalActions(state, "runner").some(
        (action) => action.type === "trash_accessed_card",
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) => action.type === "decline_trash",
      );
    }
    if (
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "continue_run" || action.type === "jack_out",
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "continue_run" || action.type === "jack_out",
      );
    }

    const staleInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const staleBelief = reconstructBeliefState(staleInput);
    const pressureCandidate = generateRunnerPlanCandidates(staleInput).find(
      (candidate) => candidate.kind === "pressure_rnd",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate) throw new Error("Missing pressure_rnd candidate");
    const staleScore = evaluateServerAccessValue(
      staleInput,
      pressureCandidate,
      staleBelief,
    );

    const syntheticInvalidation: PublicGameEvent = {
      eventId: "v142-corp-draw-synthetic",
      type: "mandatory_draw",
      stateVersionBefore: staleInput.playerView.stateVersion,
      stateVersionAfter: staleInput.playerView.stateVersion + 1,
      stateHashAfter: "fnv1a:v142invalidated",
      visibilityClass: "private_to_side",
      publicPayload: {
        actor: "corp",
        actionType: "mandatory_draw",
        label: "Korp Pflichtkarte ziehen",
      },
    };
    const invalidatedInput = {
      ...staleInput,
      eventTail: [...staleInput.eventTail, syntheticInvalidation],
    };
    const invalidatedBelief = reconstructBeliefState(invalidatedInput);
    const invalidatedScore = evaluateServerAccessValue(
      invalidatedInput,
      pressureCandidate,
      invalidatedBelief,
    );

    expect(staleBelief.runnerOpponentModel?.rndTopFreshness.freshness).toBe(
      "stale_known_same_top",
    );
    expect(
      invalidatedBelief.runnerOpponentModel?.rndTopFreshness.freshness,
    ).toBe("invalidated");
    expect(staleScore.reasons).toContain("known_rnd_top_not_fresh");
    expect(invalidatedScore.score).toBeGreaterThan(staleScore.score);
  });

  it("prefers economy over immediate repeat R&D runs when top-card freshness is stale", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-rnd-repeat-choice" }),
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    if (
      getLegalActions(state, "runner").some(
        (action) => action.type === "trash_accessed_card",
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) => action.type === "decline_trash",
      );
    }
    if (
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "continue_run" || action.type === "jack_out",
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "continue_run" || action.type === "jack_out",
      );
    }

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!rdRun || !gainCredit)
      throw new Error("Missing stale R&D or gain_credit action");

    const staleDecisionInput = {
      ...input,
      legalActions: [rdRun, gainCredit],
    };
    const decision = chooseRunnerAction(staleDecisionInput);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    const baselineDecision = chooseRunnerBaselineAction(staleDecisionInput);
    const baselineSelected = input.legalActions.find(
      (action) => action.actionId === baselineDecision.actionId,
    );
    expect(selected?.type).toBe("gain_credit");
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(baselineSelected?.type).toBe("gain_credit");
    expect(baselineDecision.reasonCode).toBe("runner.economy.basic_credit");
  });

  it("prefers economy over repeat HQ runs when the full HQ hand is known low-value", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-hq-known-low-value-repeat",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: ONR_V1_2_3_RUNNER_DECK,
        corpDeck: ONR_V1_2_3_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    const overtimeId = moveCorpCardToHq(
      state,
      "onr_v1_297_overtime-incentives",
    );
    keepOnlyCorpHqCard(state, overtimeId);
    state.runner.credits = 2;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const belief = reconstructBeliefState(input);
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(hqRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!hqRun || !gainCredit)
      throw new Error("Missing known HQ or gain_credit action");

    const pressureCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "pressure_hq",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate) throw new Error("Missing pressure_hq candidate");
    const score = evaluateServerAccessValue(input, pressureCandidate, belief);
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [hqRun, gainCredit],
    });
    const baselineDecision = chooseRunnerBaselineAction({
      ...input,
      legalActions: [hqRun, gainCredit],
    });
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(belief.runnerOpponentModel?.hqHandMemory).toMatchObject({
      handCount: 1,
      knownDefinitions: ["onr_v1_297_overtime-incentives"],
      knownCount: 1,
      allCardsKnown: true,
    });
    expect(score.reasons).toContain("known_hq_hand_low_value");
    expect(selected?.type).toBe("gain_credit");
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(baselineDecision.actionId).toBe(gainCredit.actionId);
    expect(baselineDecision.reasonCode).toBe("runner.economy.basic_credit");
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("tracks known HQ hand completeness conservatively across arrivals and known departures", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-hq-known-hand-memory",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: ONR_V1_2_3_RUNNER_DECK,
        corpDeck: ONR_V1_2_3_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    const overtimeId = moveCorpCardToHq(
      state,
      "onr_v1_297_overtime-incentives",
    );
    const economyId = moveCorpCardToHq(state, "simple_economy_operation");
    for (const cardId of state.corp.hq.filter(
      (candidate) => candidate !== overtimeId && candidate !== economyId,
    )) {
      state.corp.rd.push(cardId);
      state.cardInstances[cardId] = {
        ...state.cardInstances[cardId]!,
        zone: { side: "corp", zone: "rd" },
        faceup: false,
        rezzed: false,
      };
    }
    state.corp.hq = [overtimeId, economyId];
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });

    const fullyKnownInput = {
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticHqMemoryEvent(
          "ai-hq-known-overtime",
          100,
          "runner",
          "access_card",
          "onr_v1_297_overtime-incentives",
        ),
        syntheticHqMemoryEvent(
          "ai-hq-known-economy",
          101,
          "runner",
          "access_card",
          "simple_economy_operation",
        ),
      ],
    };
    const fullyKnownBelief = reconstructBeliefState(fullyKnownInput);
    expect(fullyKnownBelief.runnerOpponentModel?.hqHandMemory).toMatchObject({
      handCount: 2,
      knownDefinitions: [
        "simple_economy_operation",
        "onr_v1_297_overtime-incentives",
      ],
      knownCount: 2,
      allCardsKnown: true,
    });
    expect(
      fullyKnownBelief.runnerOpponentModel?.hqHandMemory.ledger,
    ).toMatchObject({
      unknownRestCount: 0,
      candidateGroups: [],
      safeDefinitions: expect.arrayContaining([
        {
          definitionId: "onr_v1_297_overtime-incentives",
          count: 1,
          sourceEventIds: ["ai-hq-known-overtime"],
        },
        {
          definitionId: "simple_economy_operation",
          count: 1,
          sourceEventIds: ["ai-hq-known-economy"],
        },
      ]),
    });

    const afterDraw = structuredClone(state);
    moveCorpCardToHq(afterDraw, "onr_v1_237_data-wall");
    const afterDrawBaseInput = buildAiDecisionInput(afterDraw, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const afterDrawBelief = reconstructBeliefState({
      ...afterDrawBaseInput,
      eventTail: [
        ...fullyKnownInput.eventTail,
        syntheticHqMemoryEvent(
          "ai-hq-unknown-draw",
          102,
          "corp",
          "mandatory_draw",
        ),
      ],
    });
    expect(afterDrawBelief.runnerOpponentModel?.hqHandMemory).toMatchObject({
      handCount: 3,
      knownCount: 2,
      allCardsKnown: false,
    });
    expect(
      afterDrawBelief.runnerOpponentModel?.hqHandMemory.ledger,
    ).toMatchObject({
      unknownRestCount: 1,
      candidateGroups: [],
      safeDefinitions: expect.arrayContaining([
        expect.objectContaining({
          definitionId: "onr_v1_297_overtime-incentives",
          count: 1,
        }),
        expect.objectContaining({
          definitionId: "simple_economy_operation",
          count: 1,
        }),
      ]),
    });

    const afterPlay = structuredClone(state);
    afterPlay.corp.hq = [economyId];
    afterPlay.cardInstances[overtimeId] = {
      ...afterPlay.cardInstances[overtimeId]!,
      zone: { side: "corp", zone: "archives" },
      faceup: true,
      rezzed: true,
    };
    afterPlay.corp.archives.push(overtimeId);
    const afterPlayBaseInput = buildAiDecisionInput(afterPlay, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const afterPlayBelief = reconstructBeliefState({
      ...afterPlayBaseInput,
      eventTail: [
        ...fullyKnownInput.eventTail,
        syntheticHqMemoryEvent(
          "ai-hq-overtime-played",
          102,
          "corp",
          "play_operation",
          "onr_v1_297_overtime-incentives",
        ),
      ],
    });
    expect(afterPlayBelief.runnerOpponentModel?.hqHandMemory).toMatchObject({
      handCount: 1,
      knownDefinitions: ["simple_economy_operation"],
      knownCount: 1,
      allCardsKnown: true,
    });
    expect(
      afterPlayBelief.runnerOpponentModel?.hqHandMemory.ledger,
    ).toMatchObject({
      unknownRestCount: 0,
      candidateGroups: [],
      safeDefinitions: [
        {
          definitionId: "simple_economy_operation",
          count: 1,
          sourceEventIds: ["ai-hq-known-economy"],
        },
      ],
    });
  });

  it("keeps safe HQ leftovers and remote candidates after hidden ICE installs", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-hq-hidden-ice-install-candidates" }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const hqLook = syntheticHqPrivateLookEvent("ai-hq-hidden-ice-look", 100, [
      "simple_barrier_ice",
      "simple_code_gate_ice",
      "simple_economy_operation",
      "simple_economy_asset",
    ]);
    const hiddenIceInstall = syntheticPlanActionEvent(
      "ai-hq-hidden-ice-install",
      101,
      "corp",
      "install_card",
      "remote_1",
      { installPlacement: "ice" },
    );
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: {
        ...baseInput.playerView,
        opponent: { ...baseInput.playerView.opponent, handCount: 3 },
        publicEvents: [
          ...baseInput.playerView.publicEvents,
          hqLook,
          hiddenIceInstall,
        ],
      },
      eventTail: [...baseInput.eventTail, hqLook, hiddenIceInstall],
      legalActions: baseInput.legalActions,
      difficulty: "normal",
      seed: baseInput.seed,
      decisionId: "ai-hq-hidden-ice-install-candidates:runner",
      actionNumber: baseInput.actionNumber,
      profileId: "runner-ai-v1.4.2-normal",
    });
    const belief = reconstructBeliefState(input);
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;
    const candidateGroup = hqMemory?.ledger.candidateGroups[0];

    expect(input.eventTail.at(-1)?.publicPayload.installPlacement).toBe("ice");
    expect(hqMemory).toMatchObject({
      handCount: 3,
      knownCount: 2,
      allCardsKnown: false,
    });
    expect(hqMemory?.knownDefinitions).toEqual([
      "simple_economy_operation",
      "simple_economy_asset",
    ]);
    expect(hqMemory?.ledger).toMatchObject({
      unknownRestCount: 0,
      safeDefinitions: expect.arrayContaining([
        expect.objectContaining({
          definitionId: "simple_economy_operation",
          count: 1,
        }),
        expect.objectContaining({
          definitionId: "simple_economy_asset",
          count: 1,
        }),
      ]),
    });
    expect(candidateGroup).toMatchObject({
      reason: "hidden_ice_install_candidates",
      serverId: "remote_1",
      installPlacement: "ice",
      departureCount: 1,
      unknownCandidateCount: 0,
      candidateDefinitions: expect.arrayContaining([
        { definitionId: "simple_barrier_ice", count: 1 },
        { definitionId: "simple_code_gate_ice", count: 1 },
      ]),
    });
    expect(
      belief.runnerOpponentModel?.hiddenRemoteCandidateMemory[0],
    ).toMatchObject({
      serverId: "remote_1",
      installPlacement: "ice",
      candidateCount: 2,
      exhaustive: true,
      candidateDefinitions: expect.arrayContaining([
        { definitionId: "simple_barrier_ice", count: 1 },
        { definitionId: "simple_code_gate_ice", count: 1 },
      ]),
    });
    expect(JSON.stringify(belief)).not.toMatch(
      /privatePayload|cardInstances|decklist|hidden-card/i,
    );
  });

  it("keeps non-root HQ cards safe after hidden root installs", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-hq-hidden-root-install-candidates" }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const hqLook = syntheticHqPrivateLookEvent("ai-hq-hidden-root-look", 100, [
      "simple_barrier_ice",
      "simple_economy_operation",
      "simple_agenda",
      "simple_economy_asset",
    ]);
    const hiddenRootInstall = syntheticPlanActionEvent(
      "ai-hq-hidden-root-install",
      101,
      "corp",
      "install_card",
      "remote_1",
      { installPlacement: "root" },
    );
    const belief = reconstructBeliefState({
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        opponent: { ...baseInput.playerView.opponent, handCount: 3 },
      },
      eventTail: [...baseInput.eventTail, hqLook, hiddenRootInstall],
    });
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory?.knownDefinitions).toEqual([
      "simple_barrier_ice",
      "simple_economy_operation",
    ]);
    expect(hqMemory?.ledger).toMatchObject({
      unknownRestCount: 0,
      candidateGroups: [
        expect.objectContaining({
          reason: "hidden_root_install_candidates",
          installPlacement: "root",
          candidateDefinitions: expect.arrayContaining([
            { definitionId: "simple_agenda", count: 1 },
            { definitionId: "simple_economy_asset", count: 1 },
          ]),
        }),
      ],
    });
    expect(
      belief.runnerOpponentModel?.hiddenRemoteCandidateMemory[0],
    ).toMatchObject({
      agendaCandidateCount: 1,
      candidateDefinitions: expect.arrayContaining([
        { definitionId: "simple_agenda", count: 1 },
        { definitionId: "simple_economy_asset", count: 1 },
      ]),
    });
  });

  it("keeps hidden install with no matching known candidate conservative", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-hq-hidden-install-no-match" }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const hqLook = syntheticHqPrivateLookEvent("ai-hq-no-match-look", 100, [
      "onr_v1_304_systematic-layoffs",
      "onr_v1_297_overtime-incentives",
    ]);
    const hiddenIceInstall = syntheticPlanActionEvent(
      "ai-hq-no-match-hidden-ice",
      101,
      "corp",
      "install_card",
      "remote_1",
      { installPlacement: "ice" },
    );
    const belief = reconstructBeliefState({
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        opponent: { ...baseInput.playerView.opponent, handCount: 1 },
      },
      eventTail: [...baseInput.eventTail, hqLook, hiddenIceInstall],
    });
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory?.knownDefinitions).toEqual([]);
    expect(hqMemory?.ledger).toMatchObject({
      unknownRestCount: 0,
      candidateGroups: [
        expect.objectContaining({
          reason: "hidden_install_no_matching_known_candidates",
          installPlacement: "ice",
          candidateDefinitions: expect.arrayContaining([
            { definitionId: "onr_v1_297_overtime-incentives", count: 1 },
            { definitionId: "onr_v1_304_systematic-layoffs", count: 1 },
          ]),
        }),
      ],
    });
  });

  it("keeps partial safe HQ knowledge through hidden install and later draw", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-hq-hidden-install-partial-draw" }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const knownIce = syntheticHqMemoryEvent(
      "ai-hq-partial-known-ice",
      100,
      "runner",
      "access_card",
      "simple_barrier_ice",
    );
    const knownOperation = syntheticHqMemoryEvent(
      "ai-hq-partial-known-operation",
      101,
      "runner",
      "access_card",
      "simple_economy_operation",
    );
    const hiddenIceInstall = syntheticPlanActionEvent(
      "ai-hq-partial-hidden-ice-install",
      102,
      "corp",
      "install_card",
      "remote_1",
      { installPlacement: "ice" },
    );
    const corpDraw = syntheticPlanActionEvent(
      "ai-hq-partial-draw-after-install",
      103,
      "corp",
      "mandatory_draw",
    );
    const belief = reconstructBeliefState({
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        opponent: { ...baseInput.playerView.opponent, handCount: 4 },
      },
      eventTail: [
        ...baseInput.eventTail,
        knownIce,
        knownOperation,
        hiddenIceInstall,
        corpDraw,
      ],
    });
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory?.knownDefinitions).toEqual(["simple_economy_operation"]);
    expect(hqMemory?.ledger).toMatchObject({
      unknownRestCount: 3,
      candidateGroups: [
        expect.objectContaining({
          installPlacement: "ice",
          unknownCandidateCount: expect.any(Number),
          candidateDefinitions: [
            { definitionId: "simple_barrier_ice", count: 1 },
          ],
        }),
      ],
    });
    expect(hqMemory?.invalidationReasons.join("|")).toContain(
      "corp_draw_added_unknown_hq_card",
    );
  });

  it("reconciles hidden ICE install candidates after the installed card is rezzed", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-hq-candidate-rez-reconcile" }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const hqLook = syntheticHqPrivateLookEvent("ai-hq-reconcile-look", 100, [
      "simple_barrier_ice",
      "simple_code_gate_ice",
      "simple_economy_operation",
    ]);
    const hiddenIceInstall = syntheticPlanActionEvent(
      "ai-hq-reconcile-hidden-ice",
      101,
      "corp",
      "install_card",
      "remote_1",
      { installPlacement: "ice" },
    );
    const rezInstalledIce = syntheticPlanActionEvent(
      "ai-hq-reconcile-rez",
      102,
      "corp",
      "rez_ice",
      "remote_1",
      { cardDefinitionId: "simple_barrier_ice" },
    );
    const belief = reconstructBeliefState({
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        opponent: { ...baseInput.playerView.opponent, handCount: 2 },
      },
      eventTail: [
        ...baseInput.eventTail,
        hqLook,
        hiddenIceInstall,
        rezInstalledIce,
      ],
    });
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory?.knownDefinitions).toEqual(
      expect.arrayContaining([
        "simple_code_gate_ice",
        "simple_economy_operation",
      ]),
    );
    expect(hqMemory).toMatchObject({
      handCount: 2,
      knownCount: 2,
      allCardsKnown: true,
    });
    expect(hqMemory?.ledger.candidateGroups).toEqual([]);
    expect(hqMemory?.invalidationReasons.join("|")).toContain(
      "hq_candidate_reconciled:ai-hq-reconcile-hidden-ice->ai-hq-reconcile-rez:simple_barrier_ice",
    );
    expect(belief.runnerOpponentModel?.hiddenRemoteCandidateMemory).toEqual([]);
  });

  it("reconciles duplicate hidden ICE candidates count-safely", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-hq-candidate-duplicate-reconcile" }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const hqLook = syntheticHqPrivateLookEvent("ai-hq-duplicate-look", 100, [
      "simple_barrier_ice",
      "simple_barrier_ice",
      "simple_code_gate_ice",
    ]);
    const hiddenIceInstall = syntheticPlanActionEvent(
      "ai-hq-duplicate-hidden-ice",
      101,
      "corp",
      "install_card",
      "remote_1",
      { installPlacement: "ice" },
    );
    const rezInstalledIce = syntheticPlanActionEvent(
      "ai-hq-duplicate-rez",
      102,
      "corp",
      "rez_ice",
      "remote_1",
      { cardDefinitionId: "simple_barrier_ice" },
    );
    const belief = reconstructBeliefState({
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        opponent: { ...baseInput.playerView.opponent, handCount: 2 },
      },
      eventTail: [
        ...baseInput.eventTail,
        hqLook,
        hiddenIceInstall,
        rezInstalledIce,
      ],
    });
    const knownDefinitions =
      belief.runnerOpponentModel?.hqHandMemory.knownDefinitions ?? [];

    expect(
      knownDefinitions.filter(
        (definitionId) => definitionId === "simple_barrier_ice",
      ),
    ).toHaveLength(1);
    expect(knownDefinitions).toContain("simple_code_gate_ice");
    expect(belief.runnerOpponentModel?.hqHandMemory.ledger).toMatchObject({
      unknownRestCount: 0,
      candidateGroups: [],
      safeDefinitions: expect.arrayContaining([
        expect.objectContaining({
          definitionId: "simple_barrier_ice",
          count: 1,
        }),
        expect.objectContaining({
          definitionId: "simple_code_gate_ice",
          count: 1,
        }),
      ]),
    });
  });

  it("keeps candidate groups conservative on reveal mismatch", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-hq-candidate-mismatch" }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const hqLook = syntheticHqPrivateLookEvent("ai-hq-mismatch-look", 100, [
      "simple_barrier_ice",
      "simple_code_gate_ice",
      "simple_economy_operation",
    ]);
    const hiddenIceInstall = syntheticPlanActionEvent(
      "ai-hq-mismatch-hidden-ice",
      101,
      "corp",
      "install_card",
      "remote_1",
      { installPlacement: "ice" },
    );
    const revealMismatch = syntheticPlanActionEvent(
      "ai-hq-mismatch-reveal",
      102,
      "corp",
      "rez_ice",
      "remote_1",
      { cardDefinitionId: "simple_agenda" },
    );
    const belief = reconstructBeliefState({
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        opponent: { ...baseInput.playerView.opponent, handCount: 2 },
      },
      eventTail: [
        ...baseInput.eventTail,
        hqLook,
        hiddenIceInstall,
        revealMismatch,
      ],
    });
    const hqMemory = belief.runnerOpponentModel?.hqHandMemory;

    expect(hqMemory?.knownDefinitions).toEqual(["simple_economy_operation"]);
    expect(hqMemory?.ledger.candidateGroups).toHaveLength(1);
    expect(hqMemory?.invalidationReasons.join("|")).toContain(
      "hq_candidate_reveal_mismatch:ai-hq-mismatch-hidden-ice->ai-hq-mismatch-reveal:simple_agenda",
    );
  });

  it("uses reconciled root candidate agenda memory for HQ pressure", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-hq-candidate-agenda-pressure" }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const hqLook = syntheticHqPrivateLookEvent(
      "ai-hq-agenda-pressure-look",
      100,
      ["simple_agenda", "simple_economy_asset", "simple_economy_operation"],
    );
    const hiddenRootInstall = syntheticPlanActionEvent(
      "ai-hq-agenda-pressure-hidden-root",
      101,
      "corp",
      "install_card",
      "remote_1",
      { installPlacement: "root" },
    );
    const revealAsset = syntheticPlanActionEvent(
      "ai-hq-agenda-pressure-reveal",
      102,
      "runner",
      "access_card",
      "remote_1",
      { cardDefinitionId: "simple_economy_asset" },
    );
    const input = {
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        opponent: { ...baseInput.playerView.opponent, handCount: 2 },
      },
      eventTail: [
        ...baseInput.eventTail,
        hqLook,
        hiddenRootInstall,
        revealAsset,
      ],
    };
    const belief = reconstructBeliefState(input);
    const pressureCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "pressure_hq",
    );
    if (!pressureCandidate) throw new Error("Missing pressure_hq candidate");
    const accessValue = evaluateServerAccessValue(
      input,
      pressureCandidate,
      belief,
    );

    expect(belief.runnerOpponentModel?.hqHandMemory.knownDefinitions).toContain(
      "simple_agenda",
    );
    expect(
      belief.runnerOpponentModel?.hqHandMemory.ledger.candidateGroups,
    ).toEqual([]);
    expect(accessValue.reasons).toContain("known_hq_agenda_pressure");
    expect(accessValue.evidence).toContain(
      "hq_run_boosted_because_known_agenda:true",
    );
    expect(JSON.stringify(belief)).not.toMatch(
      /privatePayload|cardInstances|decklist|hidden-card/i,
    );
  });

  it("uses full known HQ agenda memory to prefer a payable HQ run", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-hq-known-agenda-run-value",
        baseline: CURRENT_RULES_BASELINE,
        ...hqMemoryDeckConfig("known-agenda"),
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 6;
    setCorpHqCardsForTest(state, ["simple_agenda", "simple_economy_operation"]);
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const input = {
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticHqPrivateLookEvent("ai-hq-full-look-agenda", 100, [
          "simple_agenda",
          "simple_economy_operation",
        ]),
      ],
    };
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(hqRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!hqRun || !gainCredit)
      throw new Error("Missing HQ agenda fixture actions");

    const belief = reconstructBeliefState(input);
    const pressureCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "pressure_hq",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate) throw new Error("Missing pressure_hq candidate");
    const accessValue = evaluateServerAccessValue(
      input,
      pressureCandidate,
      belief,
    );
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [hqRun, gainCredit],
    });

    expect(belief.runnerOpponentModel?.hqHandMemory).toMatchObject({
      handCount: 2,
      knownCount: 2,
      allCardsKnown: true,
      knownDefinitions: ["simple_agenda", "simple_economy_operation"],
    });
    expect(accessValue.reasons).toContain("known_hq_agenda_pressure");
    expect(accessValue.evidence).toContain(
      "hq_run_boosted_because_known_agenda:true",
    );
    expect(decision.actionId).toBe(hqRun.actionId);
    expect(decision.reasonCode).toBe("runner.plan.pressure_hq");
  });

  it("keeps partial known HQ without agenda positive but below known agenda pressure", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-hq-partial-memory-run-value",
        baseline: CURRENT_RULES_BASELINE,
        ...hqMemoryDeckConfig("partial-memory"),
        agendaPointsToWin: 7,
      }),
    );
    setCorpHqCardsForTest(state, [
      "simple_economy_operation",
      "simple_barrier_ice",
      "simple_code_gate_ice",
      "simple_agenda",
    ]);
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const partialNoAgendaInput = {
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticHqMemoryEvent(
          "ai-hq-partial-economy",
          100,
          "runner",
          "access_card",
          "simple_economy_operation",
        ),
        syntheticHqMemoryEvent(
          "ai-hq-partial-wall",
          101,
          "runner",
          "access_card",
          "simple_barrier_ice",
        ),
        syntheticHqMemoryEvent(
          "ai-hq-partial-code-gate",
          102,
          "runner",
          "access_card",
          "simple_code_gate_ice",
        ),
      ],
    };
    const partialAgendaInput = {
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticHqMemoryEvent(
          "ai-hq-partial-agenda-economy",
          100,
          "runner",
          "access_card",
          "simple_economy_operation",
        ),
        syntheticHqMemoryEvent(
          "ai-hq-partial-agenda-wall",
          101,
          "runner",
          "access_card",
          "simple_barrier_ice",
        ),
        syntheticHqMemoryEvent(
          "ai-hq-partial-agenda",
          102,
          "runner",
          "access_card",
          "simple_agenda",
        ),
      ],
    };
    const noAgendaCandidate = generateRunnerPlanCandidates(
      partialNoAgendaInput,
    ).find((candidate) => candidate.kind === "pressure_hq");
    const agendaCandidate = generateRunnerPlanCandidates(
      partialAgendaInput,
    ).find((candidate) => candidate.kind === "pressure_hq");
    if (!noAgendaCandidate || !agendaCandidate)
      throw new Error("Missing partial HQ candidates");

    const noAgendaValue = evaluateServerAccessValue(
      partialNoAgendaInput,
      noAgendaCandidate,
      reconstructBeliefState(partialNoAgendaInput),
    );
    const agendaValue = evaluateServerAccessValue(
      partialAgendaInput,
      agendaCandidate,
      reconstructBeliefState(partialAgendaInput),
    );

    expect(
      reconstructBeliefState(partialNoAgendaInput).runnerOpponentModel
        ?.hqHandMemory,
    ).toMatchObject({ handCount: 4, knownCount: 3, allCardsKnown: false });
    expect(noAgendaValue.reasons).toContain("unknown_hq_cards_remain");
    expect(noAgendaValue.evidence).toContain(
      "hq_run_boosted_because_unknown_cards_remain:true",
    );
    expect(agendaValue.reasons).toContain("known_hq_agenda_pressure");
    expect(agendaValue.score).toBeGreaterThan(noAgendaValue.score);
  });

  it("reopens HQ value after draw and removes known HQ cards after install/play/reorder", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-hq-memory-invalidations",
        baseline: CURRENT_RULES_BASELINE,
        ...hqMemoryDeckConfig("invalidations"),
        agendaPointsToWin: 7,
      }),
    );
    setCorpHqCardsForTest(state, [
      "simple_economy_operation",
      "simple_barrier_ice",
    ]);
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const fullKnownEvents = [
      syntheticHqPrivateLookEvent("ai-hq-full-look-no-agenda", 100, [
        "simple_economy_operation",
        "simple_barrier_ice",
      ]),
    ];
    const afterDraw = reconstructBeliefState({
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        opponent: { ...baseInput.playerView.opponent, handCount: 3 },
      },
      eventTail: [
        ...baseInput.eventTail,
        ...fullKnownEvents,
        syntheticHqMemoryEvent(
          "ai-hq-draw-invalidates",
          101,
          "corp",
          "mandatory_draw",
        ),
      ],
    });
    const afterInstall = reconstructBeliefState({
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        opponent: { ...baseInput.playerView.opponent, handCount: 1 },
      },
      eventTail: [
        ...baseInput.eventTail,
        ...fullKnownEvents,
        syntheticHqMemoryEvent(
          "ai-hq-known-install",
          101,
          "corp",
          "install_card",
          "simple_economy_operation",
        ),
      ],
    });
    const afterReorder = reconstructBeliefState({
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        ...fullKnownEvents,
        syntheticPlanActionEvent(
          "ai-hq-reorder-invalidates",
          101,
          "corp",
          "resolve_choice",
          undefined,
          { hiddenZoneAction: "hq_shuffle" },
        ),
      ],
    });

    expect(afterDraw.runnerOpponentModel?.hqHandMemory).toMatchObject({
      handCount: 3,
      knownCount: 2,
      allCardsKnown: false,
    });
    expect(
      afterDraw.runnerOpponentModel?.hqHandMemory.invalidationReasons.join("|"),
    ).toContain("corp_draw_added_unknown_hq_card");
    expect(afterInstall.runnerOpponentModel?.hqHandMemory).toMatchObject({
      handCount: 1,
      knownDefinitions: ["simple_barrier_ice"],
      knownCount: 1,
      allCardsKnown: true,
    });
    expect(afterReorder.runnerOpponentModel?.hqHandMemory).toMatchObject({
      knownCount: 0,
      allCardsKnown: false,
    });
    expect(afterReorder.runnerOpponentModel?.hqHandMemory.ledger).toMatchObject(
      {
        safeDefinitions: [],
        unknownRestCount: 2,
        candidateGroups: [],
      },
    );
  });

  it("projects Expert Schedule Analyzer HQ look only to Runner AIInput", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-hq-expert-schedule-memory",
        baseline: CURRENT_RULES_BASELINE,
        ...hqMemoryDeckConfig("expert-schedule", true),
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerProgramToRig(state, "onr_v1_024_expert-schedule-analyzer");
    setCorpHqCardsForTest(state, ["simple_agenda", "simple_economy_operation"]);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    if (
      getLegalActions(state, "runner").some(
        (action) => action.type === "steal_agenda",
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) => action.type === "steal_agenda",
      );
    }
    if (
      getLegalActions(state, "runner").some(
        (action) => action.type === "continue_run",
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
    }
    if (state.pendingChoice?.source.startsWith("p3_33.private_look")) {
      state = applyChoice(state, "runner", ["done"]);
    }
    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const corpView = getPlayerView(state, "corp");
    const belief = reconstructBeliefState(runnerInput);

    expect(
      runnerInput.playerView.publicEvents.some((event) =>
        Array.isArray(event.publicPayload.knownHqDefinitionIds),
      ),
    ).toBe(true);
    expect(JSON.stringify(corpView.publicEvents)).not.toContain(
      "knownHqDefinitionIds",
    );
    expect(belief.runnerOpponentModel?.hqHandMemory.allCardsKnown).toBe(true);
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(JSON.stringify(runnerInput)).not.toMatch(
      /privatePayload|cardInstances|fullGameState/i,
    );
  });

  it("keeps HQ-memory decisions invariant across different hidden HQ contents with equal revealed memory", () => {
    const stateA = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-hq-memory-hidden-invariance",
        baseline: CURRENT_RULES_BASELINE,
        ...hqMemoryDeckConfig("hidden-invariance"),
        agendaPointsToWin: 7,
      }),
    );
    const stateB = structuredClone(stateA);
    setCorpHqCardsForTest(stateA, [
      "simple_agenda",
      "simple_economy_operation",
    ]);
    setCorpHqCardsForTest(stateB, [
      "simple_barrier_ice",
      "simple_code_gate_ice",
    ]);
    const baseA = buildAiDecisionInput(stateA, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const baseB = buildAiDecisionInput(stateB, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const eventTail = [
      syntheticHqPrivateLookEvent("ai-hq-invariant-known-memory", 100, [
        "simple_agenda",
        "simple_economy_operation",
      ]),
    ];
    const inputA = { ...baseA, eventTail: [...baseA.eventTail, ...eventTail] };
    const inputB = { ...baseB, eventTail: [...baseB.eventTail, ...eventTail] };
    const selectedA = chooseRunnerAction(inputA);
    const selectedB = chooseRunnerAction(inputB);

    expect(JSON.stringify(inputA.playerView.opponent)).toBe(
      JSON.stringify(inputB.playerView.opponent),
    );
    expect(selectedA.reasonCode).toBe(selectedB.reasonCode);
    expect(
      inputA.legalActions.find(
        (action) => action.actionId === selectedA.actionId,
      )?.type,
    ).toBe(
      inputB.legalActions.find(
        (action) => action.actionId === selectedB.actionId,
      )?.type,
    );
  });

  it("summarizes HQ-memory benchmark metrics from side-safe action entries", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary([
        progressionAction("runner", 1, "start_run", "hq", 4, {
          hqKnownCards: 2,
          hqUnknownCards: 0,
          hqKnownFraction: 1,
          hqFullyKnown: true,
          hqKnownAgendaCount: 1,
          hqKnownNonAgendaCount: 1,
          hqKnownAgendaPoints: 2,
          hqRunValueFromKnownCards: 680,
          hqRunBoostedBecauseKnownAgenda: true,
        }),
        progressionAction("runner", 2, "start_run", "hq", 4, {
          hqKnownCards: 2,
          hqUnknownCards: 1,
          hqKnownFraction: 0.667,
          hqMemoryInvalidatedByDraw: true,
          hqRunValueFromUnknownCards: 55,
          hqRunBoostedBecauseUnknownCardsRemain: true,
        }),
      ]),
    ]);

    expect(metrics.hqKnownCards).toBe(2);
    expect(metrics.hqUnknownCards).toBe(1);
    expect(metrics.hqKnownAgendaCount).toBe(1);
    expect(metrics.hqKnownAgendaPoints).toBe(2);
    expect(metrics.hqMemoryInvalidatedByDraw).toBe(1);
    expect(metrics.hqRunBoostedBecauseKnownAgenda).toBe(1);
    expect(metrics.hqRunBoostedBecauseUnknownCardsRemain).toBe(1);
  });

  it("summarizes runner breaker-search coverage diagnostics from side-safe action entries", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary([
        progressionAction("runner", 1, "play_event", undefined, 5, {
          runnerMissingBreakerCoverageByType: 1,
          runnerVisibleIceBlockingByType: 1,
          runnerPathBlockedByMissingCoverage: true,
          runnerSearchCardAvailableForMissingBreaker: true,
          runnerSearchCardUsedForMissingBreaker: true,
          runnerProbeRevealedIceThenSearchedBreaker: true,
        }),
        progressionAction("runner", 2, "install_card", undefined, 5, {
          runnerInstallableBreakerForBlockedPath: true,
          runnerCoverageImproved: true,
          runnerTutorConvertedToBreakerInstall: true,
          runnerPressureReadyWindow: true,
          runnerPressureReadyTrue: true,
          runnerPressureReadyByTargetRnd: true,
          runnerSetupContinuedAfterPressureReady: true,
          runnerPressureSkippedAfterCoverageReady: true,
          runnerPressureSkippedReason: "better_immediate_action",
          runnerSetupLoopAfterPressureReady: true,
        }),
        progressionAction("runner", 3, "start_run", "rd", 5, {
          runnerPhaseExitToPressure: true,
          runnerPressureReadyWindow: true,
          runnerPressureReadyTrue: true,
          runnerPressureReadyByTargetRnd: true,
          runnerPressureTakenAfterCoverageReady: true,
        }),
        progressionAction("runner", 4, "gain_credit", undefined, 6, {
          runnerSearchCardAvailableForMissingBreaker: true,
          runnerSearchCardAvailableButUnused: true,
          runnerSetupEconomyStalled: true,
          runnerSetupBreakerSearchStalled: true,
          runnerPressureReadyWindow: true,
          runnerPressureReadyFalsePositive: true,
          runnerPhaseExitBlockedByTargetValue: true,
        }),
      ]),
    ]);

    expect(metrics.runnerMissingBreakerCoverageByType).toBe(1);
    expect(metrics.runnerVisibleIceBlockingByType).toBe(1);
    expect(metrics.runnerPathBlockedByMissingCoverage).toBe(1);
    expect(metrics.runnerSearchCardAvailableForMissingBreaker).toBe(2);
    expect(metrics.runnerSearchCardUsedForMissingBreaker).toBe(1);
    expect(metrics.runnerSearchCardAvailableButUnused).toBe(1);
    expect(metrics.runnerTutorConvertedToBreakerInstall).toBe(1);
    expect(metrics.runnerCoverageImproved).toBe(1);
    expect(metrics.runnerSetupEconomyStalled).toBe(1);
    expect(metrics.runnerSetupBreakerSearchStalled).toBe(1);
    expect(metrics.runnerPhaseExitToPressure).toBe(1);
    expect(metrics.runnerPressureReadyWindows).toBe(3);
    expect(metrics.runnerPressureReadyTrue).toBe(2);
    expect(metrics.runnerPressureReadyFalsePositive).toBe(1);
    expect(metrics.runnerPressureReadyByTargetRnd).toBe(2);
    expect(metrics.runnerSetupContinuedAfterPressureReady).toBe(1);
    expect(metrics.runnerPressureTakenAfterCoverageReady).toBe(1);
    expect(metrics.runnerPressureSkippedAfterCoverageReady).toBe(1);
    expect(metrics.runnerPressureSkippedBetterImmediateAction).toBe(1);
    expect(metrics.runnerCoverageImprovedThenPressureWithin3).toBe(1);
    expect(metrics.runnerSetupLoopAfterPressureReady).toBe(1);
    expect(metrics.runnerPhaseExitBlockedByTargetValue).toBe(1);
  });

  it("provides Corp and Runner opponent models and keeps DecisionDebug side-safe", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-opponent-models" }),
    );
    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.2-normal",
    });
    const runnerBelief = reconstructBeliefState(runnerInput);
    const corpBelief = reconstructBeliefState(corpInput);
    const runnerDecision = chooseRunnerAction(runnerInput);
    const corpDecision = chooseCorpAction(corpInput);
    const serializedDebug = JSON.stringify({
      runner: runnerDecision.decisionDebug,
      corp: corpDecision.decisionDebug,
    });

    expect(runnerBelief.runnerOpponentModel).toBeDefined();
    expect(corpBelief.corpOpponentModel).toBeDefined();
    expect(runnerBelief.runnerOpponentModel?.corpPlanEstimate).toBeDefined();
    expect(corpBelief.corpOpponentModel?.runnerThreatModel).toBeDefined();
    expect(serializedDebug).toContain("memoryVersion");
    expect(serializedDebug).toContain("facts");
    expect(serializedDebug).toContain("hypotheses");
    expect(serializedDebug).toContain("beliefUncertainty");
    expect(serializedDebug).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  });

  it("snapshots the versioned DecisionDebug contract for Runner and Korp outputs", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-decision-debug-contract" }),
    );
    const runnerDecision = chooseRunnerAction(
      buildAiDecisionInput(state, "runner", {
        difficulty: "normal",
        profileId: "runner-ai-v1.4.2-normal",
      }),
    );
    const corpDecision = chooseCorpAction(
      buildAiDecisionInput(state, "corp", {
        difficulty: "normal",
        profileId: "corp-ai-v1.4.2-normal",
      }),
    );

    const snapshot = {
      runner: {
        schemaVersion: runnerDecision.decisionDebug?.schemaVersion,
        keys: Object.keys(runnerDecision.decisionDebug ?? {}).sort(),
      },
      corp: {
        schemaVersion: corpDecision.decisionDebug?.schemaVersion,
        keys: Object.keys(corpDecision.decisionDebug ?? {}).sort(),
      },
    };

    expect(snapshot).toMatchInlineSnapshot(`
      {
        "corp": {
          "keys": [
            "aiLevel",
            "facts",
            "hypotheses",
            "invalidations",
            "memoryVersion",
            "opponentModel",
            "schemaVersion",
            "uncertainty",
          ],
          "schemaVersion": "ai-decision-debug-v1",
        },
        "runner": {
          "keys": [
            "actionAlternatives",
            "aiLevel",
            "beliefUncertainty",
            "confidence",
            "detailSections",
            "evidence",
            "facts",
            "fallbackUsed",
            "hypotheses",
            "invalidations",
            "longTermPlan",
            "memoryVersion",
            "opponentModel",
            "planId",
            "planKind",
            "profileId",
            "rankedAlternatives",
            "schemaVersion",
            "score",
            "scoreBreakdown",
            "seed",
            "selectedActionType",
            "summary",
            "timeBudgetMs",
            "timeoutUsed",
            "uncertainty",
            "visibleReasons",
            "warnings",
            "whyNot",
          ],
          "schemaVersion": "ai-decision-debug-v1",
        },
      }
    `);
    expect(snapshot.runner.schemaVersion).toBe(
      AI_DECISION_DEBUG_SCHEMA_VERSION,
    );
    expect(snapshot.corp.schemaVersion).toBe(AI_DECISION_DEBUG_SCHEMA_VERSION);
    expect(JSON.stringify(snapshot)).not.toMatch(
      /privatePayload|cardInstances|fullGameState|sessionToken|reconnectToken|joinToken|decklist/i,
    );
  });

  it("adds side-safe ranked alternatives and score components to Runner DecisionDebug", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-decision-debug-alternatives" }),
    );
    const decision = chooseRunnerAction(
      buildAiDecisionInput(state, "runner", {
        difficulty: "normal",
        profileId: "runner-ai-v1.4.2-normal",
      }),
    );
    const debug = decision.decisionDebug;

    expect(debug).toMatchObject({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      summary: expect.any(String),
      planKind: expect.any(String),
    });
    expect(debug?.rankedAlternatives?.[0]).toMatchObject({
      rank: 1,
      planKind: debug?.planKind,
      scoreBreakdown: expect.any(Array),
      whyNot: ["selected_plan"],
    });
    expect(debug?.rankedAlternatives?.length).toBeGreaterThan(1);
    expect(debug?.actionAlternatives?.[0]).toMatchObject({
      rank: 1,
      actionId: expect.any(String),
      actionType: expect.any(String),
      selected: true,
      priority: expect.any(Number),
    });
    expect(
      debug?.scoreBreakdown?.some((component) => component.key === "base"),
    ).toBe(true);
    expect(
      debug?.detailSections?.some(
        (section) => section.id === "visible_reasons",
      ),
    ).toBe(true);
    expect(JSON.stringify(debug)).not.toMatch(
      /privatePayload|cardInstances|fullGameState|sessionToken|reconnectToken|joinToken|decklist|Hidden Priority Agenda|hidden-card/i,
    );
  });

  it("names fair known cards and remote candidates in Runner DecisionDebug memory", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-decision-debug-known-card-names" }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });

    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    const knownDebug = chooseRunnerAction({
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticHqPrivateLookEvent("ai-debug-known-hq", 100, [
          "simple_agenda",
          "simple_economy_operation",
        ]),
        syntheticCentralAccessEvent(
          "ai-debug-known-rd",
          101,
          "rd",
          "simple_agenda",
        ),
      ],
    }).decisionDebug;
    const knownModel = knownDebug?.opponentModel as
      | Record<string, any>
      | undefined;

    expect(knownModel?.hqHandMemory?.knownCards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          definitionId: "simple_agenda",
          title: "Simple Agenda",
          type: "agenda",
          count: 1,
        }),
        expect.objectContaining({
          definitionId: "simple_economy_operation",
          title: "Simple Economy Operation",
          type: "operation",
          count: 1,
        }),
      ]),
    );
    expect(knownModel?.hqHandMemory?.summary).toMatchObject({
      safeKnownCount: 2,
      ambiguousCount: 0,
      unknownCount: expect.any(Number),
      candidateGroupCount: 0,
    });
    expect(knownModel?.hqHandMemory?.safeKnownCards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          definitionId: "simple_agenda",
          title: "Simple Agenda",
          type: "agenda",
          count: 1,
        }),
      ]),
    );
    expect(knownModel?.hqHandMemory?.ledger).toBeUndefined();
    expect(JSON.stringify(knownModel?.hqHandMemory)).not.toMatch(
      /safeDefinitions|unknownRestCount/,
    );
    expect(knownModel?.rndTopFreshness?.knownTopCard).toMatchObject({
      definitionId: "simple_agenda",
      title: "Simple Agenda",
      type: "agenda",
    });
    expect(knownDebug?.facts).toContain("revealed_opponent_card:Simple Agenda");
    expect(JSON.stringify(knownDebug?.hypotheses ?? [])).not.toContain(
      "opponent_hidden_hand_cards",
    );

    const remoteDebug = chooseRunnerAction({
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        opponent: {
          ...baseInput.playerView.opponent,
          handCount: 1,
        },
      },
      eventTail: [
        ...baseInput.eventTail,
        syntheticHqPrivateLookEvent("ai-debug-remote-known-hq", 100, [
          "simple_agenda",
          "simple_economy_operation",
        ]),
        syntheticPlanActionEvent(
          "ai-debug-remote-install",
          101,
          "corp",
          "install_card",
          "remote_1",
        ),
      ],
    }).decisionDebug;
    const remoteModel = remoteDebug?.opponentModel as
      | Record<string, any>
      | undefined;

    expect(remoteModel?.hqHandMemory?.summary).toMatchObject({
      safeKnownCount: 0,
      ambiguousCount: 1,
      unknownCount: 0,
      candidateGroupCount: 1,
    });
    expect(remoteModel?.hqHandMemory?.candidateGroups?.[0]).toMatchObject({
      category: "hidden_install",
      reason: "hidden_unknown_install_candidates",
      serverId: "remote_1",
      candidateCount: 2,
      ambiguousCount: 1,
      unknownCandidateCount: 0,
      departureCount: 1,
    });
    expect(
      JSON.stringify(remoteModel?.hqHandMemory?.candidateGroups),
    ).not.toMatch(
      /simple_agenda|simple_economy_operation|cardInstances|privatePayload|decklist|hidden-card/i,
    );
    expect(remoteModel?.hiddenRemoteCandidateMemory?.[0]).toMatchObject({
      serverId: "remote_1",
      candidateCount: 2,
      agendaCandidateCount: 1,
      exhaustive: true,
      candidateCards: expect.arrayContaining([
        expect.objectContaining({
          definitionId: "simple_agenda",
          title: "Simple Agenda",
          count: 1,
        }),
        expect.objectContaining({
          definitionId: "simple_economy_operation",
          title: "Simple Economy Operation",
          count: 1,
        }),
      ]),
    });
    expect(JSON.stringify(remoteDebug)).not.toMatch(
      /privatePayload|cardInstances|fullGameState|sessionToken|reconnectToken|joinToken|decklist|hidden-card/i,
    );
  });

  it("deduplicates generic and precise remote position memory in Runner DecisionDebug", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-decision-debug-known-position-dedupe" }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const debug = chooseRunnerAction({
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticPlanActionEvent(
          "ai-debug-remote-generic-position",
          100,
          "corp",
          "rez_ice",
          "remote_1",
          { cardDefinitionId: "simple_economy_asset" },
        ),
        syntheticRemoteAccessEvent(
          "ai-debug-remote-precise-position",
          101,
          "remote_1",
          "simple_economy_asset",
          "root:0",
        ),
      ],
    }).decisionDebug;
    const knownPositions =
      ((debug?.opponentModel as Record<string, any> | undefined)
        ?.knownPositionMemory as Array<Record<string, unknown>> | undefined) ??
      [];
    const simpleAssetRemotePositions = knownPositions.filter(
      (entry) =>
        entry.zone === "remote_1" &&
        entry.definitionId === "simple_economy_asset",
    );

    expect(simpleAssetRemotePositions).toEqual([
      expect.objectContaining({
        zone: "remote_1",
        positionKey: "root:0",
        definitionId: "simple_economy_asset",
      }),
    ]);
  });

  it("uses Semantic Runtime actual actions in DecisionDebug instead of legacy plan winners", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "semantic-runtime-debug-actual-action" }),
    );
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    const decision = chooseRunnerAction(input);
    const actualAction = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(actualAction).toBeDefined();
    expect(decision.reasonCode).toContain(".semantic.");
    expect(decision.decisionDebug).toMatchObject({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      selectedActionType: actualAction?.type,
      score: expect.any(Number),
      fallbackUsed: false,
    });
    const selectedAlternative = decision.decisionDebug?.actionAlternatives?.[0];
    expect(selectedAlternative).toMatchObject({
      actionId: decision.actionId,
      actionType: actualAction?.type,
      selected: true,
      scoreBreakdown: expect.any(Array),
    });
    expect(selectedAlternative?.whyChosen).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^(semantic_runtime_actual|selected_by_plan_mapping)$/,
        ),
      ]),
    );
    expect(decision.decisionDebug?.actionAlternatives?.length).toBe(
      Math.min(input.legalActions.length, 32),
    );
    expect(
      new Set(
        decision.decisionDebug?.actionAlternatives?.map(
          (entry) => entry.actionId,
        ),
      ),
    ).toEqual(
      new Set(input.legalActions.slice(0, 32).map((action) => action.actionId)),
    );
    const actionAlternativeById = new Map(
      decision.decisionDebug?.actionAlternatives?.map((entry) => [
        entry.actionId,
        entry,
      ]) ?? [],
    );
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    if (hqRun && rdRun) {
      const hqAlternative = actionAlternativeById.get(hqRun.actionId);
      const rdAlternative = actionAlternativeById.get(rdRun.actionId);
      expect(rdAlternative?.priority).toBeGreaterThan(
        hqAlternative?.priority ?? 0,
      );
      expect(
        rdAlternative?.scoreBreakdown?.some(
          (component) => component.key === "runner_rnd_unknown_top",
        ),
      ).toBe(true);
    }
    const selectedRankedAlternative =
      decision.decisionDebug?.rankedAlternatives?.find((entry) =>
        entry.whyNot?.includes("selected_action"),
      );
    expect(selectedRankedAlternative).toMatchObject({
      selectedActionType: actualAction?.type,
      whyNot: expect.arrayContaining([
        "selected_action",
        "semantic_runtime_actual",
        "selected_by_plan_mapping:false",
        "scope:simple_hq_or_rnd_pressure",
        "reasonCode:runner.semantic.simple_hq_or_rnd_pressure",
      ]),
    });
    expect(decision.decisionDebug?.warnings ?? []).not.toContain(
      "semantic_runtime_actual_differs_from_legacy_debug",
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toContain(
      "legacy_reference",
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /privatePayload|cardInstances|fullGameState|sessionToken|reconnectToken|joinToken|decklist|Hidden Priority Agenda|hidden-card/i,
    );
  });

  it("excludes semantic HQ runs when the full known HQ hand has no current payoff", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "semantic-runtime-known-hq-no-payoff" }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const hqRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const rdRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gainCredit = baseInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(hqRun).toBeDefined();
    expect(rdRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!hqRun || !rdRun || !gainCredit)
      throw new Error("Missing known HQ no-payoff fixture actions");

    const scopedActions = [hqRun, rdRun, gainCredit];
    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    const decision = chooseRunnerAction(
      {
        ...baseInput,
        playerView: {
          ...baseInput.playerView,
          opponent: {
            ...baseInput.playerView.opponent,
            handCount: 2,
          },
          legalActions: scopedActions,
        },
        eventTail: [
          ...baseInput.eventTail,
          syntheticHqPrivateLookEvent("semantic-known-hq-ice-only", 100, [
            "onr_v1_230_cortical-scanner",
            "onr_v1_237_data-wall",
          ]),
        ],
        legalActions: scopedActions,
      },
      { persistTacticalPlanMemory: false },
    );
    const alternatives = new Map(
      decision.decisionDebug?.actionAlternatives?.map((entry) => [
        entry.actionId,
        entry,
      ]) ?? [],
    );
    const hqAlternative = alternatives.get(hqRun.actionId);
    const rdAlternative = alternatives.get(rdRun.actionId);

    expect(decision.actionId).toBe(rdRun.actionId);
    expect(hqAlternative?.excluded).toBe(true);
    expect(hqAlternative?.priority).toBeUndefined();
    expect(hqAlternative?.whyNot).toContain(
      "semantic_excluded:known_central_no_current_payoff",
    );
    expect(
      hqAlternative?.scoreBreakdown?.some(
        (component) =>
          component.key === "semantic_action_excluded" &&
          component.reason?.includes("server:hq") &&
          component.reason?.includes(
            "hq_run_suppressed_by_fully_known_low_value_hand:true",
          ),
      ),
    ).toBe(true);
    expect(rdAlternative?.excluded).toBeUndefined();
    expect(decision.evidence).not.toContain(
      "tactical_plan:runner.opportunistic_central_run:hq",
    );
  });

  it("penalizes repeated semantic HQ runs and explains the run target score factors", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "semantic-runtime-run-target-memory" }),
    );
    const eventTail: PublicGameEvent[] = [1, 2, 3].map((index) => ({
      eventId: `semantic_hq_repeat_${index}`,
      type: "action",
      stateVersionBefore: state.stateVersion + index,
      stateVersionAfter: state.stateVersion + index + 1,
      stateHashAfter: `fnv1a:semantic_hq_repeat_${index}`,
      publicPayload: {
        actor: "runner",
        actionType: "start_run",
        targetServerId: "hq",
      },
    }));
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
      eventTail,
    });

    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    const decision = chooseRunnerAction(input);
    const alternatives = new Map(
      decision.decisionDebug?.actionAlternatives?.map((entry) => [
        entry.actionId,
        entry,
      ]) ?? [],
    );
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(hqRun).toBeDefined();
    expect(rdRun).toBeDefined();
    if (!hqRun || !rdRun) throw new Error("Expected HQ and R&D run actions");
    const hqAlternative = alternatives.get(hqRun.actionId);
    const rdAlternative = alternatives.get(rdRun.actionId);
    expect(
      hqAlternative?.scoreBreakdown?.some(
        (component) =>
          component.key === "runner_recent_same_server_runs" &&
          component.value < 0,
      ),
    ).toBe(true);
    expect(rdAlternative?.priority).toBeGreaterThan(
      hqAlternative?.priority ?? 0,
    );
  });

  it("drops empty Archives far below meaningful semantic run targets", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "semantic-runtime-empty-archives-low-value",
      }),
    );
    state.corp.archives = [];
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const archivesRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(archivesRun).toBeDefined();
    expect(hqRun).toBeDefined();
    expect(rdRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!archivesRun || !hqRun || !rdRun || !gainCredit)
      throw new Error("Missing empty Archives fixture actions");

    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [archivesRun, hqRun, rdRun, gainCredit],
    });
    const alternatives = new Map(
      decision.decisionDebug?.actionAlternatives?.map((entry) => [
        entry.actionId,
        entry,
      ]) ?? [],
    );
    const archivesAlternative = alternatives.get(archivesRun.actionId);
    const hqAlternative = alternatives.get(hqRun.actionId);
    const rdAlternative = alternatives.get(rdRun.actionId);
    const gainAlternative = alternatives.get(gainCredit.actionId);

    expect(archivesAlternative?.excluded).toBe(true);
    expect(archivesAlternative?.priority).toBeUndefined();
    expect(archivesAlternative?.whyNot).toContain(
      "semantic_excluded:archives_empty",
    );
    expect(
      archivesAlternative?.scoreBreakdown?.some(
        (component) =>
          component.key === "semantic_action_excluded" &&
          component.reason === "no_archives_cards",
      ),
    ).toBe(true);
    expect(archivesAlternative?.rank ?? 0).toBeGreaterThan(
      gainAlternative?.rank ?? 0,
    );
    expect(archivesAlternative?.rank ?? 0).toBeGreaterThan(
      hqAlternative?.rank ?? 0,
    );
    expect(archivesAlternative?.rank ?? 0).toBeGreaterThan(
      rdAlternative?.rank ?? 0,
    );
  });

  it("excludes Inside Job on empty Archives while keeping real run targets available", () => {
    let state = toRunnerTurn(
      v181CardReleaseGame("semantic-runtime-inside-job-empty-archives"),
    );
    state.runner.credits = 5;
    state.corp.archives = [];
    moveRunnerCardToGrip(state, "onr_v1_094_inside-job");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const insideJobArchives = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        action.payload?.serverId === "archives" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_094_inside-job",
    );
    const insideJobHq = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        action.payload?.serverId === "hq" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_094_inside-job",
    );
    const insideJobRd = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        action.payload?.serverId === "rd" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_094_inside-job",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(insideJobArchives).toBeDefined();
    expect(insideJobHq).toBeDefined();
    expect(insideJobRd).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!insideJobArchives || !insideJobHq || !insideJobRd || !gainCredit) {
      throw new Error("Missing Inside Job empty Archives fixture actions");
    }

    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    const decision = chooseRunnerAction(
      {
        ...input,
        legalActions: [insideJobArchives, insideJobHq, insideJobRd, gainCredit],
      },
      { persistTacticalPlanMemory: false },
    );
    const alternatives = new Map(
      decision.decisionDebug?.actionAlternatives?.map((entry) => [
        entry.actionId,
        entry,
      ]) ?? [],
    );
    const archivesAlternative = alternatives.get(insideJobArchives.actionId);
    const hqAlternative = alternatives.get(insideJobHq.actionId);
    const rdAlternative = alternatives.get(insideJobRd.actionId);

    expect(decision.actionId).not.toBe(insideJobArchives.actionId);
    expect(archivesAlternative?.excluded).toBe(true);
    expect(archivesAlternative?.priority).toBeUndefined();
    expect(archivesAlternative?.whyNot).toContain(
      "semantic_excluded:archives_empty",
    );
    expect(
      archivesAlternative?.scoreBreakdown?.some(
        (component) =>
          component.key === "semantic_action_excluded" &&
          component.reason === "no_archives_cards",
      ),
    ).toBe(true);
    expect(hqAlternative?.excluded).not.toBe(true);
    expect(rdAlternative?.excluded).not.toBe(true);

    const hqOnlyDecision = chooseRunnerAction(
      {
        ...input,
        legalActions: [insideJobArchives, insideJobHq],
      },
      { persistTacticalPlanMemory: false },
    );
    expect(hqOnlyDecision.actionId).toBe(insideJobHq.actionId);
  });

  it("applies empty Archives exclusion to generic run events", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "semantic-runtime-run-event-empty-archives",
        runnerDeck: {
          id: "semantic_run_event_archives_runner",
          name: "Semantic Run Event Archives Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "simple_run_event", quantity: 4 },
            { id: "simple_economy_event", quantity: 8 },
          ],
        },
        corpDeck: {
          id: "semantic_run_event_archives_corp",
          name: "Semantic Run Event Archives Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "simple_agenda", quantity: 3 },
            { id: "simple_barrier_ice", quantity: 3 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      }),
    );
    state.runner.credits = 5;
    state.corp.archives = [];
    moveRunnerCardToGrip(state, "simple_run_event");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const eventArchives = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        action.payload?.serverId === "archives" &&
        sourceDefinitionFromInput(input, action) === "simple_run_event",
    );
    const eventHq = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        action.payload?.serverId === "hq" &&
        sourceDefinitionFromInput(input, action) === "simple_run_event",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(eventArchives).toBeDefined();
    expect(eventHq).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!eventArchives || !eventHq || !gainCredit) {
      throw new Error(
        "Missing generic run-event empty Archives fixture actions",
      );
    }

    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    const decision = chooseRunnerAction(
      {
        ...input,
        legalActions: [eventArchives, eventHq, gainCredit],
      },
      { persistTacticalPlanMemory: false },
    );
    const alternatives = new Map(
      decision.decisionDebug?.actionAlternatives?.map((entry) => [
        entry.actionId,
        entry,
      ]) ?? [],
    );
    const archivesAlternative = alternatives.get(eventArchives.actionId);
    const hqAlternative = alternatives.get(eventHq.actionId);

    expect(decision.actionId).not.toBe(eventArchives.actionId);
    expect(archivesAlternative?.excluded).toBe(true);
    expect(archivesAlternative?.whyNot).toContain(
      "semantic_excluded:archives_empty",
    );
    expect(hqAlternative?.excluded).not.toBe(true);

    const hqOnlyDecision = chooseRunnerAction(
      {
        ...input,
        legalActions: [eventArchives, eventHq],
      },
      { persistTacticalPlanMemory: false },
    );
    expect(hqOnlyDecision.actionId).toBe(eventHq.actionId);
  });

  it("uses Shredder's Archives path and HQ access target before repeating a blocked run", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "semantic-runtime-shredder-archives-path-hq-access",
        runnerDeck: {
          id: "semantic_shredder_runner",
          name: "Semantic Shredder Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_062_shredder-uplink-protocol", quantity: 1 },
            { id: "onr_v1_039_krash", quantity: 1 },
            { id: "simple_economy_event", quantity: 8 },
            { id: "simple_run_event", quantity: 4 },
          ],
        },
        corpDeck: {
          id: "semantic_shredder_corp",
          name: "Semantic Shredder Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_279_wall-of-static", quantity: 1 },
            { id: "simple_agenda", quantity: 3 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      }),
    );
    state.runner.credits = 4;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 6;
    state.corp.credits = 5;
    state.corp.archives = [];
    moveRunnerProgramToRig(state, "onr_v1_062_shredder-uplink-protocol");
    moveRunnerProgramToRig(state, "onr_v1_039_krash");
    const wallId = putCorpIceOnServer(
      state,
      "archives",
      "onr_v1_279_wall-of-static",
    );
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const shredderRun = input.legalActions.find(
      (action) =>
        sourceDefinitionFromInput(input, action) ===
        "onr_v1_062_shredder-uplink-protocol",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(shredderRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!shredderRun || !gainCredit) {
      throw new Error("Missing Shredder blocked Archives fixture actions");
    }

    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    const decision = chooseRunnerAction(
      {
        ...input,
        legalActions: [shredderRun, gainCredit],
      },
      { persistTacticalPlanMemory: false },
    );
    const alternatives = new Map(
      decision.decisionDebug?.actionAlternatives?.map((entry) => [
        entry.actionId,
        entry,
      ]) ?? [],
    );
    const shredderAlternative = alternatives.get(shredderRun.actionId);
    const guidance = shredderAlternative?.scoreBreakdown?.find(
      (component) => component.key === "runner_run_target_semantic_guidance",
    );

    expect(decision.actionId).toBe(gainCredit.actionId);
    expect(shredderAlternative?.excluded).not.toBe(true);
    expect(
      shredderAlternative?.scoreBreakdown?.some(
        (component) =>
          component.key === "semantic_action_excluded" &&
          component.reason === "no_archives_cards",
      ),
    ).not.toBe(true);
    expect(guidance).toMatchObject({
      value: -42,
    });
    expect(guidance?.reason).toContain("target:archives");
    expect(guidance?.reason).toContain("access:hq");
    expect(guidance?.reason).toContain("recommendation:gain_credits_first");
    expect(guidance?.reason).toContain("raw_guidance:-2100");
    expect(guidance?.reason).toContain("normalized_guidance:-42");
    expect(guidance?.reason).toContain("path:blocked_unpayable");
  });

  it("drops fully known non-agenda Archives below basic semantic actions", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "semantic-runtime-known-archives-low-value",
      }),
    );
    const assetId = moveCorpCardToArchives(state, "simple_economy_asset", true);
    keepOnlyCorpArchivesCards(state, [assetId]);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const archivesRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    const drawCard = input.legalActions.find(
      (action) => action.type === "draw_card",
    );
    expect(archivesRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    expect(drawCard).toBeDefined();
    if (!archivesRun || !gainCredit || !drawCard)
      throw new Error("Missing known Archives fixture actions");

    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [archivesRun, gainCredit, drawCard],
    });
    const alternatives = new Map(
      decision.decisionDebug?.actionAlternatives?.map((entry) => [
        entry.actionId,
        entry,
      ]) ?? [],
    );
    const archivesAlternative = alternatives.get(archivesRun.actionId);
    const gainAlternative = alternatives.get(gainCredit.actionId);
    const drawAlternative = alternatives.get(drawCard.actionId);

    expect(archivesAlternative?.excluded).toBe(true);
    expect(archivesAlternative?.priority).toBeUndefined();
    expect(archivesAlternative?.whyNot).toContain(
      "semantic_excluded:archives_known_no_agenda",
    );
    expect(
      archivesAlternative?.scoreBreakdown?.some(
        (component) =>
          component.key === "semantic_action_excluded" &&
          component.reason === "known_non_agenda:1",
      ),
    ).toBe(true);
    expect(archivesAlternative?.rank ?? 0).toBeGreaterThan(
      gainAlternative?.rank ?? 0,
    );
    expect(archivesAlternative?.rank ?? 0).toBeGreaterThan(
      drawAlternative?.rank ?? 0,
    );
    expect(decision.actionId).not.toBe(archivesRun.actionId);
  });

  it("excludes empty remote shells without root access value from semantic run choices", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "semantic-runtime-empty-remote-shell" }),
    );
    state.runner.credits = 1;
    ensureRemoteServer(state, "remote_2");
    addCorpIceToServerForTest(state, "remote_2", "onr_v1_279_wall-of-static");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const emptyRemoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_2",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    const drawCard = input.legalActions.find(
      (action) => action.type === "draw_card",
    );
    expect(emptyRemoteRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    expect(drawCard).toBeDefined();
    if (!emptyRemoteRun || !gainCredit || !drawCard) {
      throw new Error("Missing empty remote semantic fixture actions");
    }

    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    const decision = chooseRunnerAction(
      {
        ...input,
        legalActions: [emptyRemoteRun, gainCredit, drawCard],
      },
      { persistTacticalPlanMemory: false },
    );
    const alternatives = new Map(
      decision.decisionDebug?.actionAlternatives?.map((entry) => [
        entry.actionId,
        entry,
      ]) ?? [],
    );
    const emptyRemoteAlternative = alternatives.get(emptyRemoteRun.actionId);
    const gainAlternative = alternatives.get(gainCredit.actionId);
    const drawAlternative = alternatives.get(drawCard.actionId);

    expect(decision.actionId).not.toBe(emptyRemoteRun.actionId);
    expect(emptyRemoteAlternative?.excluded).toBe(true);
    expect(emptyRemoteAlternative?.priority).toBeUndefined();
    expect(emptyRemoteAlternative?.whyNot).toContain(
      "semantic_excluded:remote_empty_no_root",
    );
    expect(
      emptyRemoteAlternative?.scoreBreakdown?.some(
        (component) =>
          component.key === "semantic_action_excluded" &&
          component.reason === "empty_remote_root:remote_2",
      ),
    ).toBe(true);
    expect(emptyRemoteAlternative?.rank ?? 0).toBeGreaterThan(
      gainAlternative?.rank ?? 0,
    );
    expect(emptyRemoteAlternative?.rank ?? 0).toBeGreaterThan(
      drawAlternative?.rank ?? 0,
    );
  });

  it("drops remote runs behind known rezzed end-the-run ICE when no installed breaker can reach access", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "semantic-runtime-blocked-remote-wall-no-breaker",
        runnerDeck: {
          id: "semantic_blocked_remote_runner",
          name: "Semantic Blocked Remote Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "simple_fracter", quantity: 1 },
            { id: "simple_economy_event", quantity: 8 },
            { id: "simple_run_event", quantity: 4 },
          ],
        },
        corpDeck: {
          id: "semantic_blocked_remote_corp",
          name: "Semantic Blocked Remote Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_279_wall-of-static", quantity: 1 },
            { id: "simple_agenda", quantity: 3 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      }),
    );
    state.runner.credits = 5;
    state.corp.credits = 5;
    moveRunnerCardToGrip(state, "simple_fracter");
    ensureRemoteServer(state, "remote_1");
    const wallId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_279_wall-of-static",
    );
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    putCorpRootInRemote(state, "simple_agenda", 0);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const breakerInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_fracter",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    const drawCard = input.legalActions.find(
      (action) => action.type === "draw_card",
    );
    expect(remoteRun).toBeDefined();
    expect(breakerInstall).toBeDefined();
    expect(gainCredit).toBeDefined();
    expect(drawCard).toBeDefined();
    if (!remoteRun || !breakerInstall || !gainCredit || !drawCard) {
      throw new Error("Missing blocked remote semantic fixture actions");
    }

    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun, breakerInstall, gainCredit, drawCard],
    });
    const alternatives = new Map(
      decision.decisionDebug?.actionAlternatives?.map((entry) => [
        entry.actionId,
        entry,
      ]) ?? [],
    );
    const remoteAlternative = alternatives.get(remoteRun.actionId);
    const installAlternative = alternatives.get(breakerInstall.actionId);
    const gainAlternative = alternatives.get(gainCredit.actionId);
    const drawAlternative = alternatives.get(drawCard.actionId);

    expect(remoteAlternative?.excluded).toBe(true);
    expect(remoteAlternative?.priority).toBeUndefined();
    expect(remoteAlternative?.whyNot).toContain(
      "semantic_excluded:known_ice_path_no_access",
    );
    expect(
      remoteAlternative?.scoreBreakdown?.some(
        (component) =>
          component.key === "semantic_action_excluded" &&
          component.reason?.includes("can_reach_access:false"),
      ),
    ).toBe(true);
    expect(remoteAlternative?.rank ?? 0).toBeGreaterThan(
      installAlternative?.rank ?? 0,
    );
    expect(remoteAlternative?.rank ?? 0).toBeGreaterThan(
      gainAlternative?.rank ?? 0,
    );
    expect(remoteAlternative?.rank ?? 0).toBeGreaterThan(
      drawAlternative?.rank ?? 0,
    );
    expect(decision.actionId).toBe(breakerInstall.actionId);
  });

  it("drops a Tutor plus Viral 15 remote run when the unbroken Tutor subroutine makes access unreachable", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "semantic-runtime-tutor-viral15-remote-no-breaker",
        runnerDeck: {
          id: "semantic_tutor_viral15_runner",
          name: "Semantic Tutor Viral 15 Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "simple_economy_event", quantity: 8 },
            { id: "simple_run_event", quantity: 4 },
          ],
        },
        corpDeck: {
          id: "semantic_tutor_viral15_corp",
          name: "Semantic Tutor Viral 15 Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_274_tutor", quantity: 1 },
            { id: "onr_v1_276_viral-15", quantity: 1 },
            { id: "simple_agenda", quantity: 3 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      }),
    );
    state.runner.credits = 9;
    state.corp.credits = 9;
    ensureRemoteServer(state, "remote_1");
    const viral15Id = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_276_viral-15",
    );
    const tutorId = putCorpIceOnServer(state, "remote_1", "onr_v1_274_tutor");
    for (const iceId of [viral15Id, tutorId]) {
      state.cardInstances[iceId] = {
        ...state.cardInstances[iceId]!,
        faceup: true,
        rezzed: true,
      };
    }
    putCorpRootInRemote(state, "simple_agenda", 0);

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    const drawCard = input.legalActions.find(
      (action) => action.type === "draw_card",
    );
    expect(remoteRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    expect(drawCard).toBeDefined();
    if (!remoteRun || !gainCredit || !drawCard) {
      throw new Error("Missing Tutor/Viral 15 semantic fixture actions");
    }

    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun, gainCredit, drawCard],
    });
    const alternatives = new Map(
      decision.decisionDebug?.actionAlternatives?.map((entry) => [
        entry.actionId,
        entry,
      ]) ?? [],
    );
    const remoteAlternative = alternatives.get(remoteRun.actionId);

    expect(decision.actionId).not.toBe(remoteRun.actionId);
    expect(remoteAlternative?.excluded).toBe(true);
    expect(remoteAlternative?.whyNot).toContain(
      "semantic_excluded:known_ice_path_no_access",
    );
    expect(
      remoteAlternative?.scoreBreakdown?.some(
        (component) =>
          component.key === "semantic_action_excluded" &&
          component.reason?.includes("ice:Viral 15") &&
          component.reason.includes("missing:sentry") &&
          component.reason.includes("can_reach_access:false"),
      ),
    ).toBe(true);
    expect(JSON.stringify(remoteAlternative)).not.toMatch(
      /cardInstances|privatePayload|decklist|simple_agenda_1/,
    );
  });

  it("excludes the visible Viral 15 R&D path before opportunistic central pressure can choose it", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "semantic-runtime-rd-viral15-haunting-virizz-no-killer",
        runnerDeck: {
          id: "semantic_rd_viral15_path_runner",
          name: "Semantic R&D Viral 15 Path Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_016_cyfermaster", quantity: 2 },
            { id: "onr_v1_028_force-shield", quantity: 1 },
            { id: "simple_economy_event", quantity: 8 },
          ],
        },
        corpDeck: {
          id: "semantic_rd_viral15_path_corp",
          name: "Semantic R&D Viral 15 Path Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_247_haunting-inquisition", quantity: 1 },
            { id: "onr_v1_276_viral-15", quantity: 1 },
            { id: "onr_v1_277_virizz", quantity: 1 },
            { id: "simple_agenda", quantity: 3 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      }),
    );
    state.runner.credits = 5;
    state.runner.clicks = 4;
    state.corp.credits = 20;
    const firstCyfermasterId = moveRunnerProgramToRig(
      state,
      "onr_v1_016_cyfermaster",
    );
    moveRunnerProgramCopyToRig(state, "onr_v1_016_cyfermaster", [
      firstCyfermasterId,
    ]);
    moveRunnerProgramToRig(state, "onr_v1_028_force-shield");
    const virizzId = putCorpIceOnServer(state, "rd", "onr_v1_277_virizz");
    const hauntingId = putCorpIceOnServer(
      state,
      "rd",
      "onr_v1_247_haunting-inquisition",
    );
    const viral15Id = putCorpIceOnServer(state, "rd", "onr_v1_276_viral-15");
    for (const iceId of [virizzId, hauntingId, viral15Id]) {
      state.cardInstances[iceId] = {
        ...state.cardInstances[iceId]!,
        faceup: true,
        rezzed: true,
      };
    }
    putCorpCardOnTopOfRd(state, "simple_agenda");

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const rdServer = input.playerView.servers.find(
      (server) => server.id === "rd",
    );
    expect(
      assessKnownRezzedIcePath(
        rdServer?.ice ?? [],
        input.playerView.own.rig ?? [],
        input.playerView.own.credits,
        rdServer?.root ?? [],
      ),
    ).toMatchObject({
      canReachAccess: false,
      noAccessReason: "harmful_unbroken_run_effect",
      hardUnbrokenEffectIceTitle: "Viral 15",
    });
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    const drawCard = input.legalActions.find(
      (action) => action.type === "draw_card",
    );
    expect(rdRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    expect(drawCard).toBeDefined();
    if (!rdRun || !gainCredit || !drawCard) {
      throw new Error("Missing Viral 15 R&D path fixture actions");
    }

    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [rdRun, gainCredit, drawCard],
    });
    const alternatives = new Map(
      decision.decisionDebug?.actionAlternatives?.map((entry) => [
        entry.actionId,
        entry,
      ]) ?? [],
    );
    const rdAlternative = alternatives.get(rdRun.actionId);

    expect(decision.actionId).not.toBe(rdRun.actionId);
    expect(rdAlternative?.excluded).toBe(true);
    expect(rdAlternative?.whyNot).toContain(
      "semantic_excluded:known_ice_path_no_access",
    );
    expect(
      rdAlternative?.scoreBreakdown?.some(
        (component) =>
          component.key === "semantic_action_excluded" &&
          component.reason?.includes("reason:harmful_unbroken_run_effect") &&
          component.reason.includes("hard_effect_ice:Viral 15") &&
          component.reason.includes("hard_effect:damage_or_program_trash"),
      ),
    ).toBe(true);
    expect(JSON.stringify(rdAlternative)).not.toMatch(
      /cardInstances|privatePayload|decklist|simple_agenda_1/,
    );
  });

  it("jacks out for Viral 15 on R&D instead of sacrificing Krash and Cyfermaster", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "semantic-runtime-viral15-rd-jack-out-protect-rig",
        runnerDeck: {
          id: "semantic_viral15_rd_runner",
          name: "Semantic Viral 15 R&D Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_039_krash", quantity: 1 },
            { id: "onr_v1_016_cyfermaster", quantity: 1 },
            { id: "simple_economy_event", quantity: 8 },
          ],
        },
        corpDeck: {
          id: "semantic_viral15_rd_corp",
          name: "Semantic Viral 15 R&D Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_274_tutor", quantity: 1 },
            { id: "onr_v1_276_viral-15", quantity: 1 },
            { id: "simple_agenda", quantity: 3 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      }),
    );
    state.runner.credits = 7;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    const krashId = moveRunnerProgramToRig(state, "onr_v1_039_krash");
    const cyfermasterId = moveRunnerProgramToRig(
      state,
      "onr_v1_016_cyfermaster",
    );
    const viral15Id = putCorpIceOnServer(state, "rd", "onr_v1_276_viral-15");
    const tutorId = putCorpIceOnServer(state, "rd", "onr_v1_274_tutor");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === tutorId,
    );
    state = enterEncounterFromMovementWindow(state);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_016_cyfermaster",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = continueRunAction(state);
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === viral15Id,
    );
    state = enterEncounterFromMovementWindow(state);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.runner.credits).toBe(5);

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const jackOut = input.legalActions.find(
      (action) =>
        action.type === "jack_out" &&
        action.payload?.v1922CorpIceAbility ===
          "jack_out_tax_after_passed_rezzed_ice",
    );
    const continueRun = input.legalActions.find(
      (action) => action.type === "continue_run",
    );
    expect(jackOut).toBeDefined();
    expect(continueRun).toBeDefined();
    if (!jackOut || !continueRun) {
      throw new Error("Missing Viral 15 jack-out fixture actions");
    }

    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [continueRun, jackOut],
    });
    const alternatives = new Map(
      decision.decisionDebug?.actionAlternatives?.map((entry) => [
        entry.actionId,
        entry,
      ]) ?? [],
    );
    const jackAlternative = alternatives.get(jackOut.actionId);

    expect(decision.actionId).toBe(jackOut.actionId);
    expect(decision.reasonCode).toBe("runner.run_plan.simple_run_choice");
    expect(jackAlternative?.scoreBreakdown).toContainEqual(
      expect.objectContaining({
        key: "runner_viral15_jack_out_prevents_program_trash",
      }),
    );

    const result = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: decision.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "ai-viral15-rd-jack-out",
    });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.state.runner.rig.programs).toEqual(
      expect.arrayContaining([krashId, cyfermasterId]),
    );
    expect(result.state.runner.heap).not.toContain(krashId);
    expect(result.state.runner.heap).not.toContain(cyfermasterId);
    expect(JSON.stringify(decision)).not.toMatch(
      /cardInstances|privatePayload|decklist/,
    );
  });

  it("redacts forbidden DecisionDebug key and value patterns deterministically", () => {
    const sanitized = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      planKind: "fallback",
      facts: ["public_fact:ok", "privatePayload runner-sessionToken"],
      rankedAlternatives: [
        {
          rank: 1,
          planKind: "fallback",
          summary: "privatePayload hidden-card",
          score: 10,
          confidence: 0.5,
          visibleReasons: ["safe_reason"],
          scoreBreakdown: [
            {
              key: "decklist",
              label: "Decklist",
              value: 12,
              reason: "hidden-card",
            },
          ],
          whyNot: ["privatePayload"],
        },
      ],
      actionAlternatives: [
        {
          rank: 1,
          actionId: "privatePayload-action",
          actionType: "activated_card_ability",
          label: "Broker hidden-card",
          source: "visible_card",
          sourceTitle: "privatePayload",
          selected: false,
          priority: 42,
          scoreBreakdown: [
            {
              key: "decklist",
              label: "Decklist",
              value: 9,
              reason: "hidden-card",
            },
          ],
          whyNot: ["decklist"],
          economy: {
            economyKind: "pool_build",
            ability: "broker_load_credits",
            immediateGain: 0,
            netCredits: -1,
            storedCredits: 0,
            futurePoolAfter: 3,
            economyNeed: "hidden-card",
          },
        },
      ],
      scoreBreakdown: [
        { key: "economy", label: "Economy", value: 4, reason: "public" },
      ],
      detailSections: [
        { id: "details", title: "Details", items: ["safe", "hidden-card"] },
      ],
      opponentHqContents: ["Hidden Priority Agenda"],
      privatePayload: { FullState: true },
      opponentModel: {
        visibleSignal: "safe",
        rdContents: ["hidden-deck-card"],
        sessionToken: "runner-session-secret",
      },
    });

    expect(sanitized).toMatchInlineSnapshot(`
      {
        "actionAlternatives": [
          {
            "actionId": "[redacted-debug-value]",
            "actionType": "activated_card_ability",
            "economy": {
              "ability": "broker_load_credits",
              "economyKind": "pool_build",
              "economyNeed": "[redacted-debug-value]",
              "futurePoolAfter": 3,
              "immediateGain": 0,
              "netCredits": -1,
              "storedCredits": 0,
            },
            "label": "[redacted-debug-value]",
            "priority": 42,
            "rank": 1,
            "scoreBreakdown": [
              {
                "key": "[redacted-debug-value]",
                "label": "[redacted-debug-value]",
                "reason": "[redacted-debug-value]",
                "value": 9,
              },
            ],
            "selected": false,
            "source": "visible_card",
            "sourceTitle": "[redacted-debug-value]",
            "whyNot": [
              "[redacted-debug-value]",
            ],
          },
        ],
        "aiLevel": 2,
        "detailSections": [
          {
            "id": "details",
            "items": [
              "safe",
              "[redacted-debug-value]",
            ],
            "title": "Details",
          },
        ],
        "facts": [
          "public_fact:ok",
          "[redacted-debug-value]",
        ],
        "opponentModel": {
          "rdContents": "[redacted-debug-field]",
          "sessionToken": "[redacted-debug-field]",
          "visibleSignal": "safe",
        },
        "planKind": "fallback",
        "rankedAlternatives": [
          {
            "confidence": 0.5,
            "planKind": "fallback",
            "rank": 1,
            "score": 10,
            "scoreBreakdown": [
              {
                "key": "[redacted-debug-value]",
                "label": "[redacted-debug-value]",
                "reason": "[redacted-debug-value]",
                "value": 12,
              },
            ],
            "summary": "[redacted-debug-value]",
            "visibleReasons": [
              "safe_reason",
            ],
            "whyNot": [
              "[redacted-debug-value]",
            ],
          },
        ],
        "schemaVersion": "ai-decision-debug-v1",
        "scoreBreakdown": [
          {
            "key": "economy",
            "label": "Economy",
            "reason": "public",
            "value": 4,
          },
        ],
      }
    `);
    expect(JSON.stringify(sanitized)).not.toMatch(
      /runner-session-secret|privatePayload|FullState|hidden-deck-card|decklist/i,
    );
  });

  it("keeps extended DecisionDebug detail section items for plan diagnostics", () => {
    const items = Array.from(
      { length: 30 },
      (_, index) => `plan_rank|rank=${index + 1}|id=plan_${index + 1}`,
    );
    const sanitized = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      detailSections: [{ id: "tactical_plan", title: "Tactical Plan", items }],
    });

    expect(sanitized?.detailSections?.[0]?.items).toHaveLength(30);
    expect(sanitized?.detailSections?.[0]?.items.at(-1)).toBe(
      "plan_rank|rank=30|id=plan_30",
    );
  });

  it("does not mutate real game state hash while building belief state and choosing actions", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-statehash-isolation" }),
    );
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const beforeHash = hashState(state);

    const belief = reconstructBeliefState(input);
    const decision = chooseRunnerAction(input);
    const afterHash = hashState(state);

    expect(belief.version).toMatch(/^belief-v1\.4\.3:/);
    expect(
      input.legalActions.some(
        (action) => action.actionId === decision.actionId,
      ),
    ).toBe(true);
    expect(beforeHash).toBe(afterHash);
  });
});

describe("V1.4.3 simulation, selfplay and exploit regression", () => {
  it("builds a redaction-safe belief simulation world", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v143-belief-world" }),
    );
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const world = createBeliefSimulationWorld(input, "v143-world-seed");

    expect(world.sourceBeliefVersion).toMatch(/^belief-v1\.4\.3:/);
    expect(world.worldId).toContain("simworld:runner");
    expect(world.seed).toBe("v143-world-seed");
    expect(world.redactionSafe).toBe(true);
    expect(JSON.stringify(world)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  });

  it("keeps simulation deterministic by simulation RNG and isolated from real match state", () => {
    const state = createGameAfterSetup({ seed: "ai-v143-isolation-source" });
    const beforeHash = hashState(state);
    const beforeEvents = state.eventLog.length;

    const first = simulateAiGame({
      seed: "ai-v143-rng-deterministic",
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 70,
      runnerControllerMode: "random_legal_bot",
      corpControllerMode: "random_legal_bot",
      simulationRngSeed: "v143-rng-a",
    });
    const second = simulateAiGame({
      seed: "ai-v143-rng-deterministic",
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 70,
      runnerControllerMode: "random_legal_bot",
      corpControllerMode: "random_legal_bot",
      simulationRngSeed: "v143-rng-a",
    });
    const otherRng = simulateAiGame({
      seed: "ai-v143-rng-deterministic",
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 70,
      runnerControllerMode: "random_legal_bot",
      corpControllerMode: "random_legal_bot",
      simulationRngSeed: "v143-rng-b",
    });

    expect(first.errors).toEqual([]);
    expect(first.replayOk).toBe(true);
    expect(first.actionSequence).toEqual(second.actionSequence);
    expect(first.finalStateHash).toBe(second.finalStateHash);
    expect(
      first.actionSequence.map((entry) => entry.stateHashAfter),
    ).not.toEqual(otherRng.actionSequence.map((entry) => entry.stateHashAfter));
    expect(hashState(state)).toBe(beforeHash);
    expect(state.eventLog.length).toBe(beforeEvents);
  });

  it("runs a local V1.4.3 league with holdout separation and metrics", () => {
    const league = runV143SimulationLeague({
      includeHoldout: false,
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 50,
    });

    expect(league.version).toBe("1.4.3");
    expect(league.tuningSeeds.length).toBeGreaterThan(0);
    expect(league.holdoutSeeds.length).toBeGreaterThan(0);
    expect(league.profiles.length).toBe(7);
    expect(
      league.profiles.every(
        (profile) => profile.games === league.tuningSeeds.length,
      ),
    ).toBe(true);
    expect(
      league.profiles.every((profile) => profile.illegalActions === 0),
    ).toBe(true);
    expect(
      league.profiles.every((profile) => profile.replayFailures === 0),
    ).toBe(true);
    expect(JSON.stringify(league)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  }, 120_000);

  it("compares doctrine quality metrics between baseline and current candidate", () => {
    const benchmark = runDoctrineQualityBenchmark({
      includeHoldout: false,
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 30,
      baselineProfile: "random_legal_bot",
      candidateProfile: "current_candidate",
    });

    expect(benchmark.version).toBe("ai-deck-doctrine-quality-v1");
    expect(benchmark.baselineProfile).toBe("random_legal_bot");
    expect(benchmark.candidateProfile).toBe("current_candidate");
    expect(benchmark.seeds.length).toBeGreaterThan(0);
    expect(benchmark.baselineRun.games).toBe(benchmark.seeds.length);
    expect(benchmark.candidateRun.games).toBe(benchmark.seeds.length);
    expect(benchmark.delta.nakedAgendaInstalls).toBe(
      benchmark.candidate.nakedAgendaInstalls -
        benchmark.baseline.nakedAgendaInstalls,
    );
    expect(benchmark.safety.illegalActionDelta).toBe(
      benchmark.candidateRun.illegalActions -
        benchmark.baselineRun.illegalActions,
    );
    expect(JSON.stringify(benchmark)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  }, 30_000);

  it("loads benchmark snapshot decks through the adapter without using demo deck ids", () => {
    const runner = benchmarkDeckFromSnapshot(
      "onr_origin_runner_ai_snapshot_v1",
    );
    const corp = benchmarkDeckFromSnapshot("onr_origin_corp_ai_snapshot_v1");

    expect(runner.deck.id).toBe("onr_origin_runner_ai_snapshot_v1");
    expect(runner.deck.side).toBe("runner");
    expect(runner.metadata.deckName).toBe("Runner Origins AI - Probe Pressure");
    expect(corp.deck.id).toBe("onr_origin_corp_ai_snapshot_v1");
    expect(corp.deck.side).toBe("corp");
    expect(corp.metadata.deckName).toBe("Corp Origins AI - Tax & Punish");
    expect(runner.deck.id).not.toBe("demo_runner_008");
    expect(corp.deck.id).not.toBe("demo_corp_008");
  });

  it("loads frozen local realistic holdout snapshots without reading Deck-Editor storage", () => {
    const runner = benchmarkDeckFromFrozenLocalSnapshot(
      "local_realistic_runner_blink_pressure_rig_snapshot_v1",
    );
    const corp = benchmarkDeckFromFrozenLocalSnapshot(
      "local_realistic_corp_ivory_bastion_snapshot_v1",
    );

    expect(runner.deck.id).toBe(
      "local_realistic_runner_blink_pressure_rig_snapshot_v1",
    );
    expect(runner.sourceDeckId).toBe("local_runner_blink_pressure_rig");
    expect(runner.deck.name).toBe("Blink Pressure Rig");
    expect(runner.deck.side).toBe("runner");
    expect(runner.metadata.deckHash).toBe("fnv1a:39d02d0b");
    expect(corp.deck.id).toBe("local_realistic_corp_ivory_bastion_snapshot_v1");
    expect(corp.sourceDeckId).toBe("local_corp_ivory_bastion");
    expect(corp.deck.name).toBe("Ivory Bastion");
    expect(corp.deck.side).toBe("corp");
    expect(corp.metadata.deckHash).toBe("fnv1a:c5c32339");
    expect(runner.deck.id).not.toBe("demo_runner_008");
    expect(corp.deck.id).not.toBe("demo_corp_008");
    expect(runner.metadata).not.toHaveProperty("cards");
    expect(corp.metadata).not.toHaveProperty("cards");
  });

  it("loads local Deck-Editor decks through the benchmark adapter without demo fallback", () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), "netgrid-local-deck-"));
    try {
      writeFileSync(
        path.join(tempDir, "local_runner_adapter_fixture.json"),
        `${JSON.stringify(
          {
            schemaVersion: "netgrid-editable-deck-v1",
            deck: {
              deckId: "local_runner_adapter_fixture",
              deckVersion: "1.3.0-test",
              name: "Local Runner Adapter Fixture",
              side: "runner",
              identityCardId: "runner_identity_001",
              cardPoolSnapshotId: "card-snapshot-0.8",
              cardPoolVersion: "private-local-onr-v1",
              formatProfileId: "netgrid_private_local_v1",
              formatProfileVersion: "1.3.0",
              validationStatus: "valid",
              cards: [
                { cardId: "onr_v1_021_dwarf", quantity: 1 },
                { cardId: "onr_v1_039_krash", quantity: 1 },
                { cardId: "onr_v1_066_snowball", quantity: 1 },
                { cardId: "onr_v1_074_worm", quantity: 1 },
                { cardId: "onr_v1_081_custodial-position", quantity: 1 },
                { cardId: "onr_v1_085_executive-wiretaps", quantity: 1 },
                { cardId: "onr_v1_095_jack-n-joe", quantity: 1 },
                { cardId: "onr_v1_097_livewires-contacts", quantity: 1 },
                { cardId: "onr_v1_101_mit-west-tier", quantity: 1 },
                { cardId: "onr_v1_108_score", quantity: 1 },
                { cardId: "onr_v1_144_tycho-mem-chip", quantity: 1 },
                { cardId: "onr_v1_146_zetatech-mem-chip", quantity: 1 },
              ],
              createdAt: "2026-05-23T12:00:00.000Z",
              updatedAt: "2026-05-23T12:00:00.000Z",
            },
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      const loaded = benchmarkDeckFromLocalEditableDeck({
        kind: "local_editable_deck",
        localDeckId: "local_runner_adapter_fixture",
        expectedName: "Local Runner Adapter Fixture",
        fileName: "local_runner_adapter_fixture.json",
        baseDir: tempDir,
      });

      expect(loaded.ok).toBe(true);
      if (loaded.ok !== true) throw new Error(loaded.reason);
      expect(loaded.classification).toBe("runnable_ai_benchmark");
      expect(loaded.deck.id).toBe(
        "local_runner_adapter_fixture_local_benchmark_snapshot_v1",
      );
      expect(loaded.deck.id).not.toBe("demo_runner_008");
      expect(loaded.metadata.deckName).toBe("Local Runner Adapter Fixture");
      expect(loaded.metadata).not.toHaveProperty("cards");
      expect(loaded.missingCards).toEqual([]);
      expect(loaded.unsupportedCards).toEqual([]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("blocks local Deck-Editor benchmark decks with unsupported cards explicitly", () => {
    const tempDir = mkdtempSync(
      path.join(tmpdir(), "netgrid-local-deck-blocked-"),
    );
    try {
      writeFileSync(
        path.join(tempDir, "local_runner_blocked_fixture.json"),
        `${JSON.stringify(
          {
            schemaVersion: "netgrid-editable-deck-v1",
            deck: {
              deckId: "local_runner_blocked_fixture",
              deckVersion: "1.3.0-test",
              name: "Local Runner Blocked Fixture",
              side: "runner",
              identityCardId: "runner_identity_001",
              cardPoolSnapshotId: "card-snapshot-0.8",
              cardPoolVersion: "private-local-onr-v1",
              formatProfileId: "netgrid_private_local_v1",
              formatProfileVersion: "1.3.0",
              validationStatus: "invalid",
              cards: [{ cardId: "catalog_preview_resource_001", quantity: 1 }],
              createdAt: "2026-05-23T12:00:00.000Z",
              updatedAt: "2026-05-23T12:00:00.000Z",
            },
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      const blocked = benchmarkDeckFromLocalEditableDeck({
        kind: "local_editable_deck",
        localDeckId: "local_runner_blocked_fixture",
        expectedName: "Local Runner Blocked Fixture",
        fileName: "local_runner_blocked_fixture.json",
        baseDir: tempDir,
      });

      expect(blocked.ok).toBe(false);
      if (blocked.ok !== false)
        throw new Error("blocked fixture unexpectedly loaded");
      expect(blocked.classification).toBe("blocked_by_unsupported_cards");
      expect(blocked.unsupportedCards).toContain(
        "catalog_preview_resource_001",
      );
      expect(blocked.reason).toContain("unsupported_cards");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("runs a snapshot match progression smoke without falling back to demo decks", () => {
    const runner = benchmarkDeckFromSnapshot(
      "onr_origin_runner_ai_snapshot_v1",
    );
    const corp = benchmarkDeckFromSnapshot("onr_origin_corp_ai_snapshot_v1");
    const benchmark = runMatchProgressionBenchmark({
      includeHoldout: false,
      runnerDeck: runner.deck,
      corpDeck: corp.deck,
      runnerDeckMetadata: runner.metadata,
      corpDeckMetadata: corp.metadata,
      maxActions: 12,
      baselineProfile: "random_legal_bot",
      candidateProfile: "current_candidate",
      comparisonProfiles: ["random_legal_bot", "current_candidate"],
    });

    expect(benchmark.runnerDeckId).toBe("onr_origin_runner_ai_snapshot_v1");
    expect(benchmark.corpDeckId).toBe("onr_origin_corp_ai_snapshot_v1");
    expect(benchmark.runnerDeckId).not.toBe("demo_runner_008");
    expect(benchmark.corpDeckId).not.toBe("demo_corp_008");
    expect(benchmark.candidate.games).toBeGreaterThan(0);
    expect(benchmark.candidate.illegalActions).toBe(0);
    expect(benchmark.candidate.replayFailures).toBe(0);
  }, 30_000);

  it("summarizes expanded match progression metrics from redaction-safe action traces", () => {
    const metrics = summarizeMatchProgressionMetrics([
      {
        seed: "progression-metric-fixture",
        winner: "corp",
        actions: 14,
        turns: 4,
        finalAgendaPoints: { runner: 2, corp: 3 },
        finalStateHash: "fnv1a:progression",
        eventLogLength: 11,
        replayOk: true,
        replayErrors: [],
        actionSequence: [
          progressionAction("runner", 1, "start_run", "rd", 1, {
            runnerRemoteRunOpportunityAgainstAdvancedRemote: true,
            runnerSkippedAdvancedRemoteContest: true,
            runnerCentralRunWhileRemoteScoreThreatVisible: true,
            runnerCreditsBefore: 3,
            runnerCreditsAfter: 3,
            runnerCreditDelta: 0,
            runnerReserveTarget: 5,
            runnerBelowReserveBefore: true,
            runnerRunStartedBelowReserve: true,
            runnerCentralRunStartedBelowReserve: true,
            runnerContestBlockedByCredits: true,
            runnerAdvancedRemoteThreatServerIds: ["remote_1"],
            runnerContestableAdvancedRemoteThreatServerIds: ["remote_1"],
            runnerCentralRunInsteadOfContestableAdvancedRemote: true,
            runnerCentralRunBurnedRemoteContestReserve: true,
            runnerRemoteContestBlockedByCredits: true,
            runKnownPathCostAtStart: 4,
            runCreditsAfterKnownPathEstimate: -1,
            runCreditsMissingForKnownPath: 1,
            runStartedAgainstKnownUnaffordablePath: true,
            centralRunStartedAgainstKnownUnaffordablePath: true,
            runnerRunStartedAgainstKnownUnpayableFullPath: true,
            runnerRunStartedAgainstKnownUnpayableCentralPath: true,
            runnerKnownPathCanReachAccessFalse: true,
            runnerKnownPathCanBreakNextIceButNotFullPath: true,
            runnerRunSpentCreditsBeforeKnownUnbreakableLaterIce: true,
            runnerRunCostQuoteUnderestimatedFullPath: true,
            runnerRepeatRunOnKnownUnpayablePath: true,
            runnerRunPenalizedAsKnownNoAccess: true,
            lowValueUnaffordableRun: true,
          }),
          progressionAction("runner", 2, "draw_card", undefined, 1, {
            runnerDrawAction: true,
            runnerClickDrawAction: true,
            runnerDrawWhileHoldingPlayableEconomy: true,
            runnerHandUseOpportunity: true,
            runnerAdvancedRemoteThreatServerIds: ["remote_1"],
            runnerContestableAdvancedRemoteThreatServerIds: ["remote_1"],
          }),
          progressionAction("runner", 3, "resolve_choice", undefined, 1, {
            runnerDiscardChoice: true,
            runnerDiscardedPlayableEconomy: true,
          }),
          progressionAction("runner", 4, "install_card", undefined, 1, {
            runnerInstallAction: true,
            runnerDuplicateInstallAction: true,
            runnerLowValueDuplicateInstallAction: true,
            runnerJunkyardBbsDuplicateInstall: true,
            runnerRigInstallAction: true,
            runnerHandUseOpportunity: true,
            runnerHandUseActionTaken: true,
            runnerCreditsBefore: 5,
            runnerCreditsAfter: 1,
            runnerCreditDelta: -4,
            runnerReserveTarget: 5,
            runnerBelowReserveAfter: true,
            runnerSpendBelowReserve: true,
            runnerLowValueSpendBelowReserve: true,
            runnerExpensiveInstallBelowReserve: true,
          }),
          progressionAction("runner", 5, "access_card", undefined, 1),
          progressionAction("corp", 3, "install_card", "remote_1", 2, {
            installPlacement: "root",
            targetCardType: "agenda",
          }),
          progressionAction("corp", 4, "install_card", "remote_1", 2, {
            installPlacement: "ice",
            protectBeforeAdvance: true,
          }),
          progressionAction("corp", 5, "advance_card", "remote_1", 2, {
            targetCardType: "agenda",
            advancementTargetTypes: ["agenda"],
            finalAdvance: true,
            unsafeFinalAdvance: true,
            remoteProtectionScore: 40,
            runnerContestRisk: "high",
            advancesRemainingAfterAction: 1,
          }),
          progressionAction("runner", 6, "start_run", "remote_1", 3, {
            runnerRemoteRunOpportunityAgainstAdvancedRemote: true,
            runnerRemoteRunAgainstAdvancedRemote: true,
            runnerRemoteContestCreditReserveAfterRun: 4,
            runnerAdvancedRemoteThreatServerIds: ["remote_1"],
            runnerContestableAdvancedRemoteThreatServerIds: ["remote_1"],
            runnerContestedAdvancedRemoteServerId: "remote_1",
            runnerRemoteRunStartedWithSufficientPostRunReserve: true,
          }),
          progressionAction("corp", 7, "rez_ice", "remote_1", 3, {
            timingPoint: "run.approach_ice",
          }),
          progressionAction("runner", 8, "trash_accessed_card", undefined, 3, {
            runnerRemoteTrashOpportunity: true,
            runnerRemoteTrashTaken: true,
            runnerRemoteAccessWithTrashableCard: true,
            runnerRemoteAccessWithRelevantTrashableCard: true,
            runnerAffordableRelevantRemoteTrashOpportunity: true,
            runnerRelevantRemoteTrashTaken: true,
            runnerRemoteTrashTargetType: "asset_node",
            runnerRemoteTrashRole: "economy",
            runnerRemoteTrashCost: 4,
            runnerExpensiveRemoteTrashOpportunity: true,
            runnerExpensiveRemoteTrashTaken: true,
            runnerHighImpactRemoteTrashTaken: true,
            runnerCreditsAfterRemoteTrash: 5,
            runnerRemoteTrashPreservedReserve: true,
            runnerRemoteTrashProtectedScoreThreat: true,
            runnerRemoteTrashCostBucket: "4_5",
            dedicatedTrashCreditsUsed: 1,
            generalCreditsSpentOnTrash: 3,
            runnerHandUseOpportunity: true,
            runnerHandUseActionTaken: true,
          }),
          progressionAction("runner", 9, "steal_agenda", undefined, 3, {
            advancedAgendaStolen: true,
            advancedAgendaStealSource: "remote",
          }),
          progressionAction("corp", 10, "resolve_choice", "remote_1", 4, {
            advancementCountersAdded: 2,
            advancementTargetTypes: ["agenda"],
            scoreActionsAvailable: 1,
          }),
          progressionAction("corp", 11, "score_agenda", "remote_1", 4, {
            scoreActionsAvailable: 1,
            targetCardType: "agenda",
          }),
        ],
        errors: [],
        cardPoolVersion: CURRENT_RULES_BASELINE.engineSchemaVersion,
        metrics: {
          illegalActions: 0,
          fallbackRate: 0,
          timeoutRate: 0,
          reasonCodeCoverage: [],
          actionTypeCoverage: [],
          roleCoverage: [],
          progressScore: 20,
          holdout: false,
          doctrine: {
            nakedAgendaInstalls: 0,
            agendaFloodExposure: 0,
            scoreWindowMissed: 0,
            remoteOverbuild: 0,
            economyStall: 0,
            repeatedLowValueCentralRun: 0,
            rigStall: 0,
            assetTrashNeglect: 0,
          },
        },
      },
    ]);

    expect(metrics).toMatchObject({
      games: 1,
      actionLimitRate: 0,
      averageActions: 14,
      averageTurns: 4,
      runnerSteals: 1,
      corpScores: 1,
      scoreActionsAvailable: 2,
      scoreActionsTaken: 1,
      missedScoreWindows: 1,
      scoreActionTakeRate: 0.5,
      scoreOrStealActions: 2,
      scoreOrStealActionsPerMatch: 2,
      advancedAgendaSteals: 1,
      advancedAgendaStealsFromRemote: 1,
      advancedAgendaStealsFromCentral: 0,
      finalAdvanceActions: 1,
      unsafeFinalAdvanceActions: 1,
      protectedFinalAdvanceActions: 0,
      protectBeforeAdvanceActions: 1,
      advanceThenScoreSameTurn: 0,
      advanceThenRunnerStealBeforeNextCorpScore: 1,
      remoteProtectionScoreAtFinalAdvance: 40,
      runnerContestRiskAtFinalAdvance: 1,
      centralPressureRuns: 1,
      remotePressureRuns: 1,
      successfulCentralRuns: 1,
      successfulRemoteRuns: 2,
      successfulRemoteAccesses: 2,
      remoteTrashActions: 1,
      remoteAccessesWithTrashableCards: 1,
      remoteAccessesWithRelevantTrashableCards: 1,
      affordableRelevantRemoteTrashOpportunities: 1,
      relevantRemoteTrashTaken: 1,
      relevantRemoteTrashTakeRate: 1,
      skippedAffordableRelevantRemoteTrash: 0,
      remoteTrashTargetsAssetNode: 1,
      remoteTrashTargetsUpgrade: 0,
      remoteTrashTargetsIce: 0,
      remoteTrashTargetsUnknown: 0,
      remoteTrashRoleEconomy: 1,
      remoteTrashRoleScoringProtection: 0,
      remoteTrashRoleRunTax: 0,
      remoteTrashRoleRemoteCapacity: 0,
      remoteTrashRoleTagPunish: 0,
      remoteTrashRoleAmbush: 0,
      remoteTrashRoleLowValue: 0,
      remoteTrashCostTotal: 4,
      expensiveRemoteTrashOpportunities: 1,
      expensiveRemoteTrashTaken: 1,
      highImpactRemoteTrashTaken: 1,
      runnerCreditsAfterRemoteTrash: 5,
      remoteTrashPreservedReserve: 1,
      remoteTrashProtectedScoreThreat: 1,
      remoteTrashCostBucket4To5: 1,
      dedicatedTrashCreditsUsed: 1,
      generalCreditsSpentOnTrash: 3,
      remoteRunOpportunitiesAgainstAdvancedRemote: 2,
      remoteRunsAgainstAdvancedRemote: 1,
      skippedAdvancedRemoteContest: 1,
      centralRunWhileRemoteScoreThreatVisible: 1,
      remoteContestCreditReserveAfterRun: 4,
      remoteContestActions: 2,
      remoteInstalls: 2,
      remoteRootInstalls: 1,
      remoteIceInstalls: 1,
      remoteAdvances: 2,
      advancedAgendaInstalledInRemote: 2,
      advancementActionsOnAgendas: 2,
      advancementActionsOnAssets: 0,
      advancementActionsOnUpgrades: 0,
      advancementActionsOnUnknown: 0,
      remoteBuildActions: 3,
      remoteAdvanceActions: 2,
      scoreWindowActions: 1,
      scoringRemoteDevelopmentActions: 5,
      rezIceDuringRun: 1,
      turnsToFirstCorpScore: 4,
      turnsToFirstAgendaSteal: 3,
      turnsFromFirstAdvanceToScore: 2,
      turnsFromFinalAdvanceToScoreOrSteal: 1,
      runnerDrawActions: 1,
      runnerDrawActionShare: 0.125,
      clickDrawActions: 1,
      cardEffectDrawActions: 0,
      drawWhileHoldingPlayableEconomy: 1,
      drawWhileHoldingInstallableBreaker: 0,
      drawWhileHoldingRunnablePressureCard: 0,
      drawWhileRemoteTrashAvailable: 0,
      drawThenDiscardSameTurn: 1,
      discardedPlayableEconomy: 1,
      discardedInstallableBreaker: 0,
      discardedRunPressureCard: 0,
      runnerInstallActions: 1,
      runnerDuplicateInstallActions: 1,
      runnerLowValueDuplicateInstallActions: 1,
      runnerJunkyardBbsDuplicateInstalls: 1,
      runnerEconomyActionsTaken: 0,
      runnerRigInstallActions: 1,
      runnerRemoteTrashOpportunities: 1,
      runnerRemoteTrashTaken: 1,
      handUseRate: 0.667,
      runnerAverageCredits: 4,
      runnerMedianCredits: 4,
      runnerEndTurnAverageCredits: 0,
      runnerEndTurnCreditsBelowReserve: 0,
      runnerCreditReserveTargetAverage: 5,
      runnerTurnsBelowContestReserve: 1,
      runnerEconomyCreditsGained: 0,
      runnerEconomyCreditsSpent: 0,
      runnerNetCreditDeltaPerTurn: -1,
      runnerRunsStartedBelowReserve: 1,
      runnerRemoteRunsStartedBelowReserve: 0,
      runnerCentralRunsStartedBelowReserve: 1,
      runnerContestBlockedByCredits: 1,
      runnerTrashBlockedByCredits: 0,
      runnerStealBlockedByCredits: 0,
      runnerSpendBelowReserveActions: 1,
      runnerLowValueSpendBelowReserve: 1,
      runnerExpensiveInstallBelowReserve: 1,
      runnerReservePreservingEconomyActions: 0,
      runsStartedAgainstKnownUnaffordablePath: 1,
      remoteRunsStartedAgainstKnownUnaffordablePath: 0,
      centralRunsStartedAgainstKnownUnaffordablePath: 1,
      runnerRunStartedAgainstKnownUnpayableFullPath: 1,
      runnerRunStartedAgainstKnownUnpayableRemotePath: 0,
      runnerRunStartedAgainstKnownUnpayableCentralPath: 1,
      runnerKnownPathCanReachAccessFalse: 1,
      runnerKnownPathCanBreakNextIceButNotFullPath: 1,
      runnerRunSpentCreditsBeforeKnownUnbreakableLaterIce: 1,
      runnerRunCostQuoteUnderestimatedFullPath: 1,
      runnerRepeatRunOnKnownUnpayablePath: 1,
      runnerRunPenalizedAsKnownNoAccess: 1,
      runsEndedAfterFirstIceDueToCredits: 0,
      creditsMissingForKnownPath: 1,
      knownPathCostAtRunStart: 4,
      creditsAfterKnownPathEstimate: -1,
      runStartedWithInsufficientStealOrTrashReserve: 0,
      probeRunsWithPositiveInfoValue: 0,
      lowValueUnaffordableRuns: 1,
      uniqueAdvancedRemoteThreats: 2,
      contestableAdvancedRemoteThreats: 2,
      advancedRemoteThreatsContested: 1,
      advancedRemoteThreatContestRate: 0.5,
      skippedContestableAdvancedRemoteThreats: 1,
      centralRunInsteadOfContestableAdvancedRemote: 1,
      centralRunInsteadWasJustified: 0,
      centralRunBurnedRemoteContestReserve: 1,
      remoteContestBlockedByCredits: 1,
      remoteContestBlockedByPostRunReserve: 0,
      remoteContestBlockedByBreakerCoverage: 0,
      remoteContestBlockedByKnownIceCost: 0,
      remoteContestDeclinedAsBaitOrLowValue: 0,
      repeatedCentralRunsWhileSameRemoteThreat: 0,
      remoteRunStartedWithInsufficientPostRunReserve: 0,
      remoteRunStartedWithSufficientPostRunReserve: 1,
      turnsFromRemoteThreatCreatedToContest: 2,
      turnsFromRemoteThreatCreatedToScoreOrSteal: 2.5,
    });
  });

  it("summarizes BBS remote-trash and repeat-run diagnostics from side-safe traces", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("runner", 1, "decline_trash", "remote_2", 1, {
            runnerRemoteAccessWithTrashableCard: true,
            runnerRemoteAccessWithRelevantTrashableCard: true,
            runnerAffordableRelevantRemoteTrashOpportunity: true,
            runnerSkippedAffordableRelevantRemoteTrash: true,
            runnerRemoteTrashDeclined: true,
            runnerRemoteTrashTargetType: "asset_node",
            runnerRemoteTrashRole: "economy",
            runnerRemoteTrashCost: 4,
            runnerRemoteTrashLegalActionCount: 1,
            runnerRemoteTrashAssetEconomy: true,
            runnerRemoteTrashFinitePoolEconomy: true,
            runnerRemoteTrashCorpValueRemaining: 12,
            runnerBbsWhisperingCampaignAccessed: true,
            runnerBbsWhisperingCampaignTrashLegal: true,
            runnerBbsWhisperingCampaignTrashSkipped: true,
            runnerBbsWhisperingCampaignTrashSkippedAffordable: true,
            runnerFinitePoolAssetAccessed: true,
            runnerFinitePoolAssetTrashLegal: true,
            runnerFinitePoolAssetTrashSkippedAffordable: true,
            runnerRemoteTrashFixGateEligible: true,
            runnerRemoteTrashFixGateSuspicious: true,
          }),
          progressionAction("runner", 2, "start_run", "remote_2", 1),
        ],
        "runner-remote-trash-repeat-fixture",
      ),
    ]);

    expect(metrics).toMatchObject({
      runnerRemoteTrashDecisionWindows: 1,
      runnerRemoteTrashLegalActions: 1,
      runnerRemoteTrashSkipped: 1,
      runnerRemoteTrashSkippedAffordableRelevant: 1,
      runnerRemoteTrashSkippedAssetEconomy: 1,
      runnerRemoteTrashSkippedFinitePoolEconomy: 1,
      runnerRemoteTrashSkippedWithCorpValueRemaining: 1,
      runnerBbsWhisperingCampaignAccessed: 1,
      runnerBbsWhisperingCampaignTrashLegal: 1,
      runnerBbsWhisperingCampaignTrashSkipped: 1,
      runnerBbsWhisperingCampaignTrashSkippedAffordable: 1,
      runnerBbsWhisperingCampaignTrashSkippedWithCreditsRemaining: 1,
      runnerFinitePoolAssetAccessed: 1,
      runnerFinitePoolAssetTrashLegal: 1,
      runnerFinitePoolAssetTrashSkippedAffordable: 1,
      runnerRepeatAccessKnownRemote: 1,
      runnerRepeatAccessKnownTrashableRemote: 1,
      runnerRepeatAccessKnownTrashableRemoteWithoutTrash: 1,
      runnerRepeatRunOnSameRemoteAfterDecliningTrash: 1,
      runnerRepeatRunOnSameRemoteNoNewInfo: 1,
      runnerRepeatRemoteAccessNoProgress: 1,
      runnerRemoteTrashFixGateEligible: 1,
      runnerRemoteTrashFixGateSuspicious: 1,
      runnerRepeatRemoteNoTrashFixGateSuspicious: 1,
    });
  });

  it("summarizes Runner economy decision windows, skips, and fix gates", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("runner", 1, "play_event", undefined, 1, {
            runnerEconomyDecisionWindow: true,
            runnerLegalEconomyActions: 1,
            runnerLegalBurstEconomyActions: 1,
            runnerEconomyTaken: true,
            runnerEconomyActionTaken: true,
            runnerLowCreditDecisionWindow: true,
            runnerCreditStarvedWithLegalEconomy: true,
            runnerCreditStarvedEconomyTaken: true,
            runnerEconomyTakenToReachRunReserve: true,
            runnerEconomyChosenAsReserveSetup: true,
            runnerEconomyChoicePlausible: true,
          }),
          progressionAction("runner", 2, "start_run", "rd", 1, {
            runnerEconomyDecisionWindow: true,
            runnerLegalEconomyActions: 1,
            runnerEconomySkipped: true,
            runnerEconomySkippedWhileLowCredits: true,
            runnerEconomySkippedWhileKnownUnaffordablePath: true,
            runnerEconomySkippedForRun: true,
            runnerLowCreditDecisionWindow: true,
            runnerCreditStarvedWithLegalEconomy: true,
            runnerCreditStarvedEconomySkipped: true,
            runnerKnownUnaffordablePathWithLegalEconomy: true,
            runnerEconomySkippedThenUnaffordableRun: true,
            runnerRunStartedBelowKnownPathCost: true,
            runnerRunStartedAfterSkippingEconomy: true,
            runnerEconomyFixGateEligibleStarvedSkip: true,
          }),
          progressionAction("runner", 3, "gain_credit", undefined, 1, {
            runnerEconomyDecisionWindow: true,
            runnerLegalEconomyActions: 1,
            runnerLegalActionEconomyActions: 1,
            runnerEconomyTaken: true,
            runnerEconomyActionTaken: true,
            runnerEconomyChosenWhileRich: true,
            runnerEconomyChosenOverFreshCentralPressure: true,
            runnerEconomyChosenWhilePressureReady: true,
            runnerEconomyChoiceSuspicious: true,
            runnerEconomyFixGateSuspiciousRichEconomy: true,
            runnerEconomyFixGateSuspiciousEconomyOverPressure: true,
          }),
        ],
        "runner-economy-window-fixture",
      ),
    ]);

    expect(metrics).toMatchObject({
      runnerEconomyDecisionWindows: 3,
      runnerLegalEconomyActions: 3,
      runnerLegalBurstEconomyActions: 1,
      runnerLegalActionEconomyActions: 1,
      runnerEconomyTaken: 2,
      runnerEconomySkipped: 1,
      runnerEconomySkippedWhileLowCredits: 1,
      runnerEconomySkippedWhileKnownUnaffordablePath: 1,
      runnerCreditStarvedWithLegalEconomy: 2,
      runnerCreditStarvedEconomyTaken: 1,
      runnerCreditStarvedEconomySkipped: 1,
      runnerKnownUnaffordablePathWithLegalEconomy: 1,
      runnerEconomyTakenToReachRunReserve: 1,
      runnerEconomySkippedThenUnaffordableRun: 1,
      runnerRunStartedBelowKnownPathCost: 1,
      runnerRunStartedAfterSkippingEconomy: 1,
      runnerEconomyChosenOverFreshCentralPressure: 1,
      runnerEconomyChosenWhileRich: 1,
      runnerEconomyChoicePlausible: 1,
      runnerEconomyChoiceSuspicious: 1,
      runnerEconomyFixGateEligibleStarvedSkip: 1,
      runnerEconomyFixGateSuspiciousRichEconomy: 1,
      runnerEconomyFixGateSuspiciousEconomyOverPressure: 1,
    });
  });

  it("keeps finite, debt, hand-size, memory, and search recovery diagnostics separated", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction(
            "runner",
            1,
            "activated_card_ability",
            undefined,
            1,
            {
              runnerEconomyDecisionWindow: true,
              runnerLegalEconomyActions: 1,
              runnerLegalFinitePoolEconomyActions: 1,
              runnerEconomyTaken: true,
              runnerFinitePoolEconomySeen: true,
              runnerFinitePoolEconomyTaken: true,
            },
          ),
          progressionAction("runner", 2, "install_card", undefined, 1, {
            runnerEconomyDecisionWindow: true,
            runnerLegalEconomyActions: 1,
            runnerLegalLoanDebtEconomyActions: 1,
            runnerLegalResourceEconomyActions: 1,
            runnerEconomyTaken: true,
            runnerDebtEconomySeen: true,
            runnerDebtEconomyTaken: true,
            runnerDebtEconomyTakenWithoutNeed: true,
            runnerEconomyWithDownsideSeen: true,
            runnerEconomyWithDownsideTaken: true,
            runnerDelayedPenaltyEconomyTaken: true,
            runnerEconomyFixGateSuspiciousDebtEconomyWithoutNeed: true,
          }),
          progressionAction("runner", 3, "install_card", undefined, 1, {
            runnerHandSizeBottleneckDecisionWindow: true,
            runnerLegalHandSizeActions: 1,
            runnerHandSizeSupportTaken: true,
            runnerHandSizeFactUsedForDiagnosis: true,
            runnerEconomySetupEvidence: [
              "mram_militech_classified_as_hand_size:true",
            ],
          }),
          progressionAction("runner", 4, "end_turn", undefined, 1, {
            runnerMemoryBottleneckDecisionWindow: true,
            runnerLegalMemoryHardwareActions: 1,
            runnerMemorySupportSkippedWhileGripHasPrograms: true,
            runnerSetupFixGateEligibleMemorySkip: true,
          }),
          progressionAction("runner", 5, "play_event", undefined, 2, {
            runnerLegalSearchActions: 1,
            runnerSearchSkippedWhileMissingBreakerCoverage: true,
            runnerSetupFixGateEligibleSearchRecoverySkip: true,
          }),
          progressionAction("runner", 6, "play_event", undefined, 2, {
            runnerLegalRecoveryActions: 1,
            runnerRecoveryTaken: true,
            runnerRecoveryTakenForBreakerCoverage: true,
          }),
          progressionAction("runner", 7, "draw_card", undefined, 2),
          progressionAction("runner", 8, "end_turn", undefined, 2),
        ],
        "runner-setup-classification-fixture",
      ),
    ]);

    expect(metrics).toMatchObject({
      runnerLegalFinitePoolEconomyActions: 1,
      runnerFinitePoolEconomySeen: 1,
      runnerFinitePoolEconomyTaken: 1,
      runnerFinitePoolEconomyTakenWhilePoolLikelyDepleted: 0,
      runnerLegalLoanDebtEconomyActions: 1,
      runnerDebtEconomySeen: 1,
      runnerDebtEconomyTaken: 1,
      runnerDebtEconomyTakenWithoutNeed: 1,
      runnerEconomyWithDownsideSeen: 1,
      runnerDelayedPenaltyEconomyTaken: 1,
      runnerMemoryBottleneckDecisionWindows: 1,
      runnerHandSizeBottleneckDecisionWindows: 1,
      runnerLegalMemoryHardwareActions: 1,
      runnerLegalHandSizeActions: 1,
      runnerMemoryAttributionWindows: 1,
      runnerHandSizeAttributionWindows: 1,
      runnerMemoryAttributionLegalSupport: 1,
      runnerHandSizeAttributionLegalSupport: 1,
      runnerMemoryAttributionSupportTaken: 0,
      runnerHandSizeAttributionSupportTaken: 1,
      runnerMemoryHardwareTaken: 0,
      runnerHandSizeSupportTaken: 1,
      runnerHandSizeFactUsedForDiagnosis: 1,
      runnerMemorySupportSkippedWhileGripHasPrograms: 1,
      runnerLegalSearchActions: 1,
      runnerLegalRecoveryActions: 1,
      runnerSearchSkippedWhileMissingBreakerCoverage: 1,
      runnerRecoveryTaken: 1,
      runnerRecoveryTakenForBreakerCoverage: 1,
      runnerSearchOrRecoveryWindowWithNoInstallFollowup: 1,
      runnerSetupFixGateEligibleMemorySkip: 1,
      runnerSetupFixGateEligibleSearchRecoverySkip: 1,
    });
  });

  it("keeps Runner economy setup diagnostic evidence side-safe and hidden-state invariant", () => {
    const visibleActions = [
      progressionAction("runner", 1, "play_event", undefined, 1, {
        runnerEconomyDecisionWindow: true,
        runnerLegalEconomyActions: 1,
        runnerEconomyTaken: true,
        runnerEconomySetupClassifications: ["runner_economy_taken"],
        runnerEconomySetupEvidence: [
          "runner_credits:2",
          "runner_reserve_target:5",
          "legal_economy_actions:1",
          "known_unaffordable_path:false",
        ],
      }),
    ];
    const first = summarizeMatchProgressionMetrics([
      progressionSummary(visibleActions, "runner-economy-visible-a"),
    ]);
    const second = summarizeMatchProgressionMetrics([
      {
        ...progressionSummary(visibleActions, "runner-economy-visible-b"),
        finalStateHash: "fnv1a:different-hidden-state",
      },
    ]);

    expect(first.runnerEconomyDecisionWindows).toBe(
      second.runnerEconomyDecisionWindows,
    );
    expect(first.runnerEconomyTaken).toBe(second.runnerEconomyTaken);
    expect(JSON.stringify({ visibleActions })).not.toMatch(
      /cardInstances|privatePayload|fullGameState|corp_hq|corp_rd|runner_stack|runner_grip/i,
    );
  });

  it("attributes Runner setup fix gates across starved economy, search recovery, and memory", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("runner", 1, "start_run", "rd", 1, {
            runnerEconomyFixGateEligibleStarvedSkip: true,
            runnerEconomySkippedForRun: true,
            runStartedAgainstKnownUnaffordablePath: true,
            lowValueUnaffordableRun: true,
          }),
          progressionAction("runner", 2, "draw_card", undefined, 1, {
            runnerDrawAction: true,
          }),
          progressionAction("runner", 3, "start_run", "remote_1", 2, {
            runnerEconomyFixGateEligibleStarvedSkip: true,
            runnerEconomySkippedForRemoteContest: true,
            runnerRemoteRunAgainstAdvancedRemote: true,
          }),
          progressionAction("runner", 4, "draw_card", undefined, 2, {
            runnerEconomyFixGateEligibleStarvedSkip: true,
            runnerEconomySkippedForDraw: true,
            runnerDrawAction: true,
          }),
          progressionAction("runner", 5, "gain_credit", undefined, 2, {
            runnerEconomyTaken: true,
            runnerCreditsAfter: 5,
            runnerReserveTarget: 5,
          }),
          progressionAction("runner", 6, "draw_card", undefined, 3, {
            runnerSetupFixGateEligibleSearchRecoverySkip: true,
            runnerLegalSearchActions: 1,
            runnerSearchSkippedWhileMissingBreakerCoverage: true,
            runnerSetupMissingCoverageTypes: ["wall"],
            runnerDrawAction: true,
          }),
          progressionAction("runner", 7, "end_turn", undefined, 3),
          progressionAction("runner", 8, "install_card", undefined, 4, {
            runnerSetupFixGateEligibleSearchRecoverySkip: true,
            runnerLegalRecoveryActions: 1,
            runnerRecoverySkippedWhileMissingBreakerCoverage: true,
            runnerSetupMissingCoverageTypes: ["code_gate", "sentry"],
            runnerRigInstallAction: true,
            runnerCoverageImproved: true,
          }),
          progressionAction("runner", 9, "install_card", undefined, 4, {
            runnerSetupFixGateEligibleMemorySkip: true,
            runnerLegalMemoryHardwareActions: 1,
            runnerMemorySupportSkippedWhileGripHasPrograms: true,
            runnerRigInstallAction: true,
          }),
          progressionAction("runner", 10, "start_run", "hq", 5, {
            runnerSetupFixGateEligibleSearchRecoverySkip: true,
          }),
          progressionAction("runner", 11, "draw_card", undefined, 5, {
            runnerHandSizeSupportSkippedWhileDamageRiskVisible: true,
            runnerDiscardChoice: true,
          }),
        ],
        "runner-setup-attribution-fixture",
      ),
    ]);

    expect(metrics).toMatchObject({
      runnerStarvedEconomySkipWindows: 3,
      runnerStarvedEconomySkipChosenRun: 2,
      runnerStarvedEconomySkipChosenDraw: 1,
      runnerStarvedEconomySkipThenUnaffordableRun: 1,
      runnerStarvedEconomySkipThenFailedRun: 1,
      runnerStarvedEconomySkipThenEconomyNextDecision: 1,
      runnerStarvedEconomySkipThenReserveRecovered: 3,
      runnerStarvedEconomySkipPlausibleRemoteContest: 1,
      runnerStarvedEconomySkipSuspiciousLowValueRun: 1,
      runnerStarvedEconomySkipSuspiciousDraw: 0,
      runnerEconomyFixGateAttributionEligible: 3,
      runnerEconomyFixGateAttributionBlocked: 1,
      runnerEconomyFixGateAttributionSuspicious: 1,
      runnerSearchRecoveryFixGateWindows: 3,
      runnerSearchRecoveryFixGateLegalSearch: 1,
      runnerSearchRecoveryFixGateLegalRecovery: 1,
      runnerSearchRecoveryFixGateMissingWall: 1,
      runnerSearchRecoveryFixGateMissingCodeGate: 1,
      runnerSearchRecoveryFixGateMissingSentry: 1,
      runnerSearchRecoveryAttributionWindows: 3,
      runnerSearchRecoveryAttributionLegalSearch: 1,
      runnerSearchRecoveryAttributionLegalRecovery: 1,
      runnerSearchRecoveryAttributionMissingWall: 1,
      runnerSearchRecoveryAttributionMissingCodeGate: 1,
      runnerSearchRecoveryAttributionMissingSentry: 1,
      runnerSearchRecoveryAttributionSkipped: 3,
      runnerSearchRecoverySkipChosenDraw: 1,
      runnerSearchRecoverySkipChosenInstall: 1,
      runnerSearchRecoverySkipChosenRun: 1,
      runnerSearchRecoverySkipThenCoverageResolved: 1,
      runnerSearchRecoverySkipThenCoverageStillMissing: 2,
      runnerSearchRecoverySkipThenActionLimit: 1,
      runnerSearchRecoverySkipSuspiciousCoverageStillMissing: 1,
      runnerSearchRecoveryFixGateAttributionEligible: 3,
      runnerSearchRecoveryFixGateAttributionSuspicious: 1,
      runnerMemoryFixGateWindows: 1,
      runnerMemoryFixGateLegalSupport: 1,
      runnerMemoryFixGateSkipped: 1,
      runnerMemoryAttributionSkipped: 1,
      runnerMemorySkipChosenInstallNonMemory: 1,
      runnerMemorySkipThenProgramInstallBlocked: 1,
      runnerMemorySkipThenCoverageStillMissing: 1,
      runnerMemorySkipSuspiciousRigBlocked: 1,
      runnerMemorySkipSuspiciousCoverageStillMissing: 1,
      runnerMemoryFixGateAttributionEligible: 1,
      runnerMemoryFixGateAttributionSuspicious: 1,
      runnerHandSizeFixGateWindows: 1,
      runnerHandSizeFixGateLegalSupport: 1,
      runnerHandSizeFixGateSkipped: 1,
      runnerHandSizeAttributionSkipped: 1,
      runnerHandSizeSkipThenDamageRiskWindow: 1,
      runnerSetupAttributionByKindStarvedEconomy: 3,
      runnerSetupAttributionByKindSearchRecovery: 3,
      runnerSetupAttributionByKindMemory: 1,
      runnerSetupAttributionByKindHandSize: 1,
      runnerSetupAttributionSuspicious: 3,
      runnerSetupRecommendedFixKindMixedNeedsMoreDiagnosis: 1,
    });
  });

  it("normalizes Runner setup diagnostics into disjoint blocked, suspicious, and artifact buckets", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("runner", 1, "start_run", "remote_1", 1, {
            runnerSetupFixGateEligibleSearchRecoverySkip: true,
            runnerLegalSearchActions: 1,
            runnerSearchSkippedWhileMissingBreakerCoverage: true,
            runnerSetupMissingCoverageTypes: ["code_gate"],
            runnerRemoteRunAgainstAdvancedRemote: true,
          }),
          progressionAction("runner", 2, "gain_credit", undefined, 1, {
            runnerSetupFixGateEligibleSearchRecoverySkip: true,
            runnerLegalSearchActions: 1,
            runnerSearchSkippedWhileMissingBreakerCoverage: true,
            runnerSetupMissingCoverageTypes: ["sentry"],
            runnerEconomyTaken: true,
          }),
          progressionAction("runner", 3, "draw_card", undefined, 2, {
            runnerSetupFixGateEligibleSearchRecoverySkip: true,
            runnerLegalSearchActions: 1,
            runnerSearchSkippedWhileMissingBreakerCoverage: true,
            runnerSetupMissingCoverageTypes: ["wall"],
            runnerDrawAction: true,
          }),
          progressionAction("runner", 4, "draw_card", undefined, 2, {
            runnerSetupFixGateEligibleSearchRecoverySkip: true,
            runnerLegalSearchActions: 1,
            runnerSearchSkippedWhileMissingBreakerCoverage: true,
            runnerSetupMissingCoverageTypes: ["code_gate"],
            runnerPressureReadyTrue: true,
            runnerDrawAction: true,
          }),
          progressionAction("runner", 5, "draw_card", undefined, 3, {
            runnerSetupFixGateEligibleMemorySkip: true,
            runnerLegalMemoryHardwareActions: 1,
            runnerDrawAction: true,
          }),
          progressionAction("runner", 6, "draw_card", undefined, 3, {
            runnerSetupFixGateEligibleMemorySkip: true,
            runnerLegalMemoryHardwareActions: 1,
            runnerMemorySupportSkippedWhileGripHasPrograms: true,
            runnerDrawAction: true,
          }),
          progressionAction("runner", 7, "draw_card", undefined, 4, {
            runnerHandSizeSupportSkippedWhileDamageRiskVisible: true,
            runnerLegalHandSizeActions: 1,
            runnerDrawAction: true,
          }),
          progressionAction("runner", 8, "draw_card", undefined, 4, {
            runnerDiscardChoice: true,
          }),
          progressionAction("runner", 9, "install_card", undefined, 5, {
            runnerHandSizeBottleneckDecisionWindow: true,
            runnerLegalHandSizeActions: 1,
            runnerHandSizeSupportTaken: true,
            runnerHandSizeFactUsedForDiagnosis: true,
            runnerRigInstallAction: true,
          }),
        ],
        "runner-setup-normalized-fixture",
      ),
    ]);

    expect(metrics).toMatchObject({
      runnerSearchRecoveryNormalizedWindows: 4,
      runnerSearchRecoveryNormalizedSkipped: 4,
      runnerSearchRecoveryNormalizedBlocked: 2,
      runnerSearchRecoveryNormalizedBlockedByPressureOrRemoteContest: 1,
      runnerSearchRecoveryNormalizedBlockedByEconomyOrReserve: 1,
      runnerSearchRecoveryNormalizedMetricArtifact: 1,
      runnerSearchRecoveryNormalizedBlockedByCurrentRigEnough: 1,
      runnerSearchRecoveryNormalizedSuspicious: 1,
      runnerSearchRecoveryNormalizedTrueMissedCoverage: 1,
      runnerSearchRecoveryNormalizedFixGateEligible: 1,
      runnerMemoryNormalizedWindows: 2,
      runnerMemoryNormalizedSkipped: 2,
      runnerMemoryNormalizedBlocked: 1,
      runnerMemoryNormalizedBlockedByNoProgramPressure: 1,
      runnerMemoryNormalizedSuspicious: 1,
      runnerMemoryNormalizedTrueRigBottleneck: 1,
      runnerMemoryNormalizedFixGateEligible: 1,
      runnerHandSizeNormalizedWindows: 2,
      runnerHandSizeNormalizedTaken: 1,
      runnerHandSizeNormalizedSkipped: 1,
      runnerHandSizeNormalizedSuspicious: 1,
      runnerSetupNormalizedWindows: 8,
      runnerSetupNormalizedSuspicious: 3,
      runnerSetupNormalizedBlocked: 3,
      runnerSetupNormalizedMetricArtifact: 1,
      runnerSetupNormalizedFixGateEligible: 3,
      runnerSetupNormalizedRecommendedFixKindMixedNeedsMoreDiagnosis: 1,
    });
    expect(metrics.runnerSearchRecoveryNormalizedWindows).toBe(
      metrics.runnerSearchRecoveryNormalizedBlocked +
        metrics.runnerSearchRecoveryNormalizedMetricArtifact +
        metrics.runnerSearchRecoveryNormalizedUnclassified +
        metrics.runnerSearchRecoveryNormalizedSuspicious,
    );
    expect(metrics.runnerMemoryNormalizedWindows).toBe(
      metrics.runnerMemoryNormalizedBlocked +
        metrics.runnerMemoryNormalizedMetricArtifact +
        metrics.runnerMemoryNormalizedUnclassified +
        metrics.runnerMemoryNormalizedSuspicious,
    );
    expect(metrics.runnerHandSizeNormalizedSkipped).toBe(
      metrics.runnerHandSizeNormalizedBlocked +
        metrics.runnerHandSizeNormalizedMetricArtifact +
        metrics.runnerHandSizeNormalizedSuspicious,
    );
    expect(metrics.runnerMemoryNormalizedSuspicious).toBe(1);
  });

  it("keeps Runner setup attribution diagnostics hidden-state invariant and redaction-safe", () => {
    const visibleActions = [
      progressionAction("runner", 1, "draw_card", undefined, 1, {
        runnerSetupFixGateEligibleSearchRecoverySkip: true,
        runnerLegalSearchActions: 1,
        runnerSearchSkippedWhileMissingBreakerCoverage: true,
        runnerSetupMissingCoverageTypes: ["universal", "special"],
        runnerSetupAttributionEvidence: [
          "chosen_action_type:draw_card",
          "chosen_reason_family:draw",
          "missing_coverage_types:universal,special",
        ],
      }),
    ];
    const first = summarizeMatchProgressionMetrics([
      progressionSummary(visibleActions, "runner-setup-visible-a"),
    ]);
    const second = summarizeMatchProgressionMetrics([
      {
        ...progressionSummary(visibleActions, "runner-setup-visible-b"),
        finalStateHash: "fnv1a:different-hidden-state",
      },
    ]);

    expect(first.runnerSearchRecoveryFixGateMissingUniversal).toBe(
      second.runnerSearchRecoveryFixGateMissingUniversal,
    );
    expect(first.runnerSearchRecoveryFixGateMissingSpecial).toBe(
      second.runnerSearchRecoveryFixGateMissingSpecial,
    );
    expect(first.runnerSearchRecoveryAttributionMissingUniversal).toBe(
      second.runnerSearchRecoveryAttributionMissingUniversal,
    );
    expect(first.runnerSearchRecoveryAttributionMissingSpecial).toBe(
      second.runnerSearchRecoveryAttributionMissingSpecial,
    );
    expect(JSON.stringify({ visibleActions })).not.toMatch(
      /cardInstances|privatePayload|fullGameState|corp_hq|corp_rd|runner_stack|runner_grip/i,
    );
  });

  it("summarizes first-class breaker ontology metrics from action evidence", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary([
        progressionAction("runner", 1, "install_card", undefined, 1, {
          runnerPathBlockedByMissingCoverage: true,
          evidence: [
            "visible_breaker_pressure:true",
            "matching_grip_breakers:0",
            "structured_matching_grip_breakers:1",
            "structured_heap_matching_breakers:0",
            "coverage_search_actions:0",
            "structured_breaker_cost_profile:true",
            "structured_breaker_install_credits:2",
            "structured_breaker_memory:1",
            "structured_breaker_coverage:wall",
            "structured_breaker_coverage:wall",
            "structured_breaker_side_effect_penalty:12",
            "runner_missing_coverage_resolved_by_ontology:true",
          ],
        }),
        progressionAction("runner", 2, "play_event", undefined, 1, {
          evidence: [
            "visible_breaker_pressure:true",
            "matching_grip_breakers:0",
            "structured_matching_grip_breakers:0",
            "structured_heap_matching_breakers:1",
            "coverage_search_actions:1",
            "runner_search_target_ranked_by_ontology:true",
          ],
        }),
        progressionAction("runner", 3, "draw_card", undefined, 1, {
          evidence: [
            "runner_breaker_ontology_profile_seen:true",
            "runner_breaker_ontology_conflict:true",
            "runner_breaker_ontology_setup_suppressed_pressure_ready:true",
          ],
        }),
        progressionAction("corp", 4, "install_card", "remote_1", 2, {
          evidence: [
            "runner_contest_capacity:high",
            "visible_runner_breaker_ontology_profiles:1",
            "structured_breaker_visible_coverage:wall",
            "structured_breaker_profile_contest_fallback:true",
            "structured_breaker_coverage:wall",
            "structured_breaker_cost:0",
            "structured_breaker_effective_quote_override:true",
            "corp_agenda_install_blocked_by_ontology_cheap_contest:true",
          ],
        }),
        progressionAction("corp", 5, "advance_card", "remote_1", 2, {
          evidence: [
            "runner_contest_capacity:medium",
            "visible_runner_breaker_ontology_profiles:1",
            "structured_breaker_profile_contest_fallback:true",
            "structured_breaker_coverage:sentry",
            "structured_breaker_side_effect_penalty:5",
            "corp_remote_safety_ontology_conflict_with_effective_quote:true",
            "corp_advance_blocked_by_ontology_cheap_contest:true",
          ],
        }),
      ]),
    ]);

    expect(metrics).toMatchObject({
      runnerBreakerOntologyProfilesSeen: 3,
      runnerBreakerOntologyCoverageUsed: 2,
      runnerBreakerOntologyFallbackUsed: 1,
      runnerBreakerOntologyConflict: 1,
      runnerInstallableBreakerRankedByOntology: 1,
      runnerSearchTargetRankedByOntology: 1,
      runnerMissingCoverageResolvedByOntology: 1,
      runnerBreakerOntologySetupSuppressedBecausePressureReady: 1,
      corpVisibleRunnerBreakerOntologyProfilesSeen: 2,
      corpRemoteSafetyUsedRunnerBreakerOntology: 2,
      corpCheapContestDetectedByBreakerOntology: 1,
      corpRemoteSafetyOntologyConflictWithEffectiveQuote: 2,
      corpAgendaInstallBlockedByOntologyCheapContest: 1,
      corpAdvanceBlockedByOntologyCheapContest: 1,
      breakerOntologyCoverageByType: 3,
      breakerOntologyCoverageWall: 2,
      breakerOntologyCoverageSentry: 1,
      breakerOntologySideEffectsSeen: 2,
      breakerOntologyCostProfileSeen: 2,
      breakerOntologyFallbackEvidenceCount: 2,
      breakerOntologyEffectiveQuoteOverrideCount: 1,
    });
  });

  it("does not report breaker ontology metrics for legacy-only evidence", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary([
        progressionAction("runner", 1, "install_card", undefined, 1, {
          evidence: [
            "visible_breaker_pressure:true",
            "matching_grip_breakers:1",
            "structured_matching_grip_breakers:0",
          ],
        }),
        progressionAction("corp", 2, "install_card", "remote_1", 1, {
          evidence: [
            "runner_contest_capacity:medium",
            "visible_runner_breaker_ontology_profiles:0",
            "structured_breaker_profile_contest_fallback:false",
          ],
        }),
      ]),
    ]);

    expect(metrics.runnerBreakerOntologyProfilesSeen).toBe(0);
    expect(metrics.runnerBreakerOntologyCoverageUsed).toBe(0);
    expect(metrics.corpVisibleRunnerBreakerOntologyProfilesSeen).toBe(0);
    expect(metrics.corpRemoteSafetyUsedRunnerBreakerOntology).toBe(0);
    expect(metrics.breakerOntologyFallbackEvidenceCount).toBe(0);
  });

  it("keeps breaker ontology metric aggregation hidden-state invariant", () => {
    const visibleActions = [
      progressionAction("corp", 1, "advance_card", "remote_1", 1, {
        evidence: [
          "runner_contest_capacity:high",
          "visible_runner_breaker_ontology_profiles:1",
          "structured_breaker_profile_contest_fallback:true",
          "structured_breaker_coverage:wall",
        ],
      }),
    ];

    const first = summarizeMatchProgressionMetrics([
      progressionSummary(visibleActions, "breaker-visible-a"),
    ]);
    const second = summarizeMatchProgressionMetrics([
      {
        ...progressionSummary(visibleActions, "breaker-visible-b"),
        finalStateHash: "fnv1a:different-hidden-state",
      },
    ]);

    expect({
      corpVisibleRunnerBreakerOntologyProfilesSeen:
        first.corpVisibleRunnerBreakerOntologyProfilesSeen,
      corpRemoteSafetyUsedRunnerBreakerOntology:
        first.corpRemoteSafetyUsedRunnerBreakerOntology,
      corpCheapContestDetectedByBreakerOntology:
        first.corpCheapContestDetectedByBreakerOntology,
      breakerOntologyCoverageWall: first.breakerOntologyCoverageWall,
    }).toEqual({
      corpVisibleRunnerBreakerOntologyProfilesSeen:
        second.corpVisibleRunnerBreakerOntologyProfilesSeen,
      corpRemoteSafetyUsedRunnerBreakerOntology:
        second.corpRemoteSafetyUsedRunnerBreakerOntology,
      corpCheapContestDetectedByBreakerOntology:
        second.corpCheapContestDetectedByBreakerOntology,
      breakerOntologyCoverageWall: second.breakerOntologyCoverageWall,
    });
  });

  it("summarizes short-horizon plan conversion metrics from action traces", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary([
        progressionAction("runner", 1, "draw_card", undefined, 1, {
          runnerDrawAction: true,
          reasonCode: "runner.plan.setup_for_run",
        }),
        progressionAction("runner", 2, "start_run", "rd", 1),
        progressionAction("runner", 3, "access_card", undefined, 1),
        progressionAction("runner", 4, "play_event", undefined, 2, {
          runnerEconomyActionTaken: true,
          runnerCreditsBefore: 2,
          runnerCreditsAfter: 5,
          runnerReserveTarget: 4,
          runnerCreditDelta: 3,
          reasonCode: "runner.plan.economy_reserve",
        }),
        progressionAction("runner", 5, "start_run", "remote_1", 2, {
          runnerRemoteRunAgainstAdvancedRemote: true,
        }),
        progressionAction("runner", 6, "trash_accessed_card", undefined, 2, {
          runnerRelevantRemoteTrashTaken: true,
        }),
        progressionAction("runner", 7, "install_card", undefined, 3, {
          runnerRigInstallAction: true,
          runnerInstallAction: true,
          reasonCode: "runner.plan.rig_unlock",
        }),
        progressionAction("runner", 8, "start_run", "hq", 3, {
          runnerCentralRunWithInterfaceInstalled: true,
        }),
        progressionAction("runner", 9, "steal_agenda", undefined, 3),
        progressionAction("corp", 10, "install_card", "remote_2", 4, {
          installPlacement: "root",
          targetCardType: "agenda",
          reasonCode: "corp.plan.remote_build",
        }),
        progressionAction("corp", 11, "advance_card", "remote_2", 4, {
          targetCardType: "agenda",
          advancementTargetTypes: ["agenda"],
          reasonCode: "corp.plan.advance",
        }),
        progressionAction("corp", 12, "score_agenda", "remote_2", 4, {
          targetCardType: "agenda",
        }),
      ]),
    ]);

    expect(metrics.setupActionConvertedToRun).toBe(1);
    expect(metrics.economyActionConvertedToRun).toBe(1);
    expect(metrics.rigActionConvertedToRun).toBe(1);
    expect(metrics.remoteBuildConvertedToAdvanceOrScore).toBe(1);
    expect(metrics.advanceConvertedToScore).toBe(1);
    expect(metrics.remoteContestConvertedToStealOrTrash).toBe(1);
    expect(metrics.centralPressureConvertedToSteal).toBe(1);
    expect(metrics.planIntentConverted).toBeGreaterThanOrEqual(5);
    expect(metrics.actionLedToProgressWithin3).toBeGreaterThan(
      metrics.actionLedToProgressWithin1,
    );
  });

  it("does not convert economy spam or value-free central runs into progress", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("runner", 1, "play_event", undefined, 1, {
            runnerEconomyActionTaken: true,
            runnerCreditsBefore: 1,
            runnerCreditsAfter: 2,
            runnerReserveTarget: 5,
            runnerCreditDelta: 1,
            reasonCode: "runner.plan.economy_reserve",
          }),
          progressionAction("runner", 2, "play_event", undefined, 1, {
            runnerEconomyActionTaken: true,
            runnerCreditsBefore: 2,
            runnerCreditsAfter: 3,
            runnerReserveTarget: 5,
            runnerCreditDelta: 1,
            reasonCode: "runner.plan.economy_reserve",
          }),
          progressionAction("runner", 3, "start_run", "rd", 2, {
            reasonCode: "runner.plan.central_pressure",
          }),
          progressionAction("runner", 4, "end_turn", undefined, 2),
        ],
        "plan-conversion-stall-fixture",
      ),
    ]);

    expect(metrics.economyActionConvertedToRun).toBe(0);
    expect(metrics.centralPressureConvertedToSteal).toBe(0);
    expect(metrics.actionLedToProgressWithin3).toBe(0);
    expect(metrics.planIntentAbandoned).toBeGreaterThanOrEqual(2);
    expect(metrics.samePlanRepeatedWithoutProgress).toBeGreaterThanOrEqual(1);
    expect(metrics.longestNoProgressChain).toBe(4);
    expect(metrics.turnsWithNoProgress).toBe(2);
  });

  it("keeps run and forced micro-actions out of strategic no-progress chains", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("runner", 1, "start_run", "rd", 1, {
            reasonCode: "runner.plan.pressure_rnd",
          }),
          progressionAction("runner", 2, "continue_run", undefined, 1),
          progressionAction("runner", 3, "access_card", undefined, 1),
          progressionAction("corp", 4, "mandatory_draw", undefined, 2),
          progressionAction("runner", 5, "end_turn", undefined, 2),
        ],
        "strategic-micro-chain-fixture",
      ),
    ]);

    expect(metrics.longestNoProgressChain).toBe(5);
    expect(metrics.strategicLongestNoProgressChain).toBe(2);
    expect(metrics.microActionNoProgressContribution).toBe(3);
    expect(metrics.planIntentAbandonedWithoutReason).toBeGreaterThan(0);
  });

  it("classifies action-limit endgames from the final strategic window without micro-action inflation", () => {
    const metrics = summarizeMatchProgressionMetrics([
      {
        ...progressionSummary(
          [
            progressionAction("runner", 1, "continue_run", undefined, 7),
            progressionAction("runner", 2, "access_card", undefined, 7),
            progressionAction("corp", 3, "mandatory_draw", undefined, 8),
            progressionAction("runner", 4, "draw_card", undefined, 8, {
              runnerDrawAction: true,
              reasonCode: "runner.plan.setup_without_conversion",
              hqKnownAgendaCount: 1,
            }),
            progressionAction("runner", 5, "gain_credit", undefined, 8, {
              runnerEconomyActionTaken: true,
              runnerCreditsBefore: 7,
              runnerCreditsAfter: 8,
              runnerCreditDelta: 1,
              runnerReserveTarget: 5,
              hqKnownAgendaCount: 1,
              runnerSkippedAdvancedRemoteContest: true,
              reasonCode: "runner.plan.recover_economy",
            }),
            progressionAction("runner", 6, "install_card", undefined, 9, {
              runnerInstallAction: true,
              runnerRigInstallAction: true,
              runnerLowValueDuplicateInstallAction: true,
              hqKnownAgendaCount: 1,
              reasonCode: "runner.plan.build_rig",
            }),
            progressionAction("corp", 7, "install_card", "remote_1", 9, {
              installPlacement: "ice",
              reasonCode: "corp.plan.protect_remote",
            }),
            progressionAction("runner", 8, "end_turn", undefined, 9),
            progressionAction("corp", 9, "end_turn", undefined, 10),
          ],
          "action-limit-endgame-runner-stall",
        ),
        finalAgendaPoints: { runner: 5, corp: 4 },
      },
    ]);

    expect(metrics.actionLimitRootCauseByMatch).toBe(1);
    expect(metrics.actionLimitDominantSideRunner).toBe(1);
    expect(metrics.finalStrategicWindowNoProgressActions).toBe(5);
    expect(metrics.finalStrategicWindowRunnerNoProgressActions).toBe(4);
    expect(metrics.finalWindowKnownInfoExploitationOpportunities).toBe(3);
    expect(metrics.finalWindowKnownInfoExploitationTaken).toBe(0);
    expect(metrics.endgameCloseoutOpportunitiesRunnerRaw).toBe(3);
    expect(metrics.endgameCloseoutOpportunitiesRunnerDeduped).toBe(1);
    expect(metrics.endgameCloseoutOpportunitiesRunnerTrue).toBe(1);
    expect(metrics.endgameCloseoutOpportunitiesRunner).toBe(1);
    expect(metrics.runnerCloseoutByKnownHqAgenda).toBe(1);
    expect(metrics.runnerCloseoutByPointsToWin).toBe(1);
    expect(metrics.endgameCloseoutAttemptsRunner).toBe(0);
    expect(metrics.endgameSetupOrEconomyActions).toBe(2);
    expect(metrics.endgameProtectionActions).toBe(1);
    expect(metrics.actionLimitLikelyStrategyIssue).toBe(1);
    expect(metrics.microActionNoProgressContribution).toBe(3);
  });

  it("classifies corp score-path endgame stalls separately from runner stalls", () => {
    const metrics = summarizeMatchProgressionMetrics([
      {
        ...progressionSummary(
          [
            progressionAction("corp", 1, "install_card", "remote_1", 8, {
              installPlacement: "root",
              targetCardType: "agenda",
              reasonCode: "corp.plan.remote_build",
            }),
            progressionAction("corp", 2, "install_card", "remote_1", 8, {
              installPlacement: "ice",
              protectBeforeAdvance: true,
              reasonCode: "corp.plan.protect_remote",
            }),
            progressionAction("corp", 3, "gain_credit", undefined, 9, {
              reasonCode: "corp.plan.recover_economy",
            }),
            progressionAction("corp", 4, "end_turn", undefined, 9, {
              scoreActionsAvailable: 1,
            }),
            progressionAction("runner", 5, "end_turn", undefined, 9),
          ],
          "action-limit-endgame-corp-score-stall",
        ),
        finalAgendaPoints: { runner: 3, corp: 5 },
      },
    ]);

    expect(metrics.actionLimitRootCauseByMatch).toBe(1);
    expect(metrics.actionLimitDominantSideCorp).toBe(1);
    expect(metrics.finalWindowCorpScorePathOpportunities).toBe(3);
    expect(metrics.finalWindowCorpScorePathTaken).toBe(1);
    expect(metrics.endgameCloseoutOpportunitiesCorp).toBe(3);
    expect(metrics.endgameCloseoutAttemptsCorp).toBe(1);
    expect(metrics.endgameProtectionActions).toBe(1);
    expect(metrics.endgameSetupOrEconomyActions).toBe(1);
  });

  it("dedupes protection-to-score metrics around actual prior protection", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("corp", 1, "install_card", "remote_1", 1, {
            installPlacement: "ice",
            evidence: [
              "corp_unsafe_remote_converted_to_protection:true",
              "corp_protection_chosen_before_unsafe_agenda_install:true",
            ],
          }),
          progressionAction("corp", 2, "install_card", "remote_1", 1, {
            installPlacement: "root",
            targetCardType: "agenda",
            evidence: [
              "corp_protection_opened_score_path:true",
              "corp_score_path_chosen_after_protection:true",
            ],
          }),
          progressionAction("corp", 3, "advance_card", "remote_1", 1, {
            targetCardType: "agenda",
            evidence: [
              "corp_protection_opened_score_path:true",
              "corp_score_path_chosen_after_protection:true",
            ],
          }),
        ],
        "protection-to-score-metric-fixture",
      ),
      progressionSummary(
        [
          progressionAction("corp", 1, "install_card", "remote_2", 1, {
            installPlacement: "root",
            targetCardType: "agenda",
            evidence: [
              "corp_protection_opened_score_path:true",
              "corp_score_path_chosen_after_protection:true",
            ],
          }),
        ],
        "protection-to-score-no-prior-protection-fixture",
      ),
    ]);

    expect(metrics.corpProtectionConvertedToScoreWithin3).toBe(1);
    expect(metrics.corpProtectionRepeatedWithoutScoreConversion).toBe(0);
    expect(metrics.corpProtectionOpenedScorePath).toBe(2);
    expect(metrics.corpScorePathChosenAfterProtection).toBe(2);
  });

  it("summarizes corp score-window compression and delayed steal metrics", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("corp", 1, "advance_card", "remote_1", 1, {
            targetCardType: "agenda",
            evidence: [
              "corp_score_window_compression_opportunity:true",
              "corp_score_window_compression_taken:true",
              "corp_agenda_advanced_in_protected_remote:true",
              "corp_agenda_near_score_window:true",
            ],
          }),
          progressionAction("corp", 2, "gain_credit", undefined, 1, {
            evidence: [
              "corp_score_window_compression_opportunity:true",
              "corp_score_window_compression_skipped:true",
              "corp_economy_before_score_window:true",
              "corp_non_essential_action_before_score_window:true",
            ],
          }),
          progressionAction("runner", 3, "steal_agenda", "remote_1", 2),
        ],
        "score-window-compression-metric-fixture",
      ),
      progressionSummary(
        [
          progressionAction("corp", 1, "gain_credit", undefined, 1, {
            evidence: [
              "corp_score_window_compression_opportunity:true",
              "corp_economy_before_score_window:true",
              "corp_economy_before_score_window_necessary:true",
            ],
          }),
        ],
        "score-window-compression-necessary-economy-fixture",
      ),
    ]);

    expect(metrics.corpScoreWindowCompressionOpportunity).toBe(3);
    expect(metrics.corpScoreWindowCompressionTaken).toBe(1);
    expect(metrics.corpScoreWindowCompressionRate).toBeCloseTo(1 / 3, 3);
    expect(metrics.corpScoreWindowCompressionSkipped).toBe(1);
    expect(metrics.corpNonEssentialActionBeforeScoreWindow).toBe(1);
    expect(metrics.corpEconomyBeforeScoreWindow).toBe(2);
    expect(metrics.corpEconomyBeforeScoreWindowNecessary).toBe(1);
    expect(metrics.corpRunnerStealAfterDelayedScoreWindow).toBe(1);
    expect(metrics.corpAdvanceToScoreLineCompressedWithin2).toBe(1);
    expect(metrics.corpAdvanceToScoreLineCompressedWithin3).toBe(1);
  });

  it("summarizes corp score-terminal conversion skips and followups", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("corp", 1, "install_card", "remote_1", 1, {
            installPlacement: "ice",
            corpScoreTerminalWindow: true,
            corpScoreTerminalWindowScoreLegal: true,
            corpScoreTerminalWindowProtectedRemoteReady: true,
            corpScoreTerminalSkipped: true,
            corpScoreTerminalSkippedForProtection: true,
            corpScoreConversionFixGateEligible: true,
            corpScoreConversionFixGateSuspiciousProtectionLoop: true,
          }),
          progressionAction("corp", 2, "gain_credit", undefined, 1, {
            corpScoreTerminalWindow: true,
            corpScoreTerminalWindowScoreLegal: true,
            corpScoreTerminalSkipped: true,
            corpScoreTerminalSkippedForEconomy: true,
            evidence: ["corp_protection_loop_after_remote_safe:true"],
            corpScoreConversionFixGateEligible: true,
            corpScoreConversionFixGateSuspiciousEconomyLoop: true,
          }),
          progressionAction("runner", 3, "steal_agenda", "remote_1", 1),
        ],
        "score-terminal-protection-loop-fixture",
      ),
      progressionSummary(
        [
          progressionAction("corp", 1, "draw_card", undefined, 2, {
            corpScoreTerminalWindow: true,
            corpScoreTerminalWindowAdvanceToScoreLegal: true,
            corpScoreTerminalSkipped: true,
            corpScoreTerminalSkippedForDraw: true,
            corpScoreConversionFixGateEligible: true,
            corpScoreConversionFixGateSuspiciousDraw: true,
          }),
          progressionAction("corp", 2, "advance_card", "remote_1", 2, {
            corpScoreTerminalWindow: true,
            corpScoreTerminalWindowAdvanceToScoreLegal: true,
            corpScoreTerminalAdvanceTaken: true,
          }),
        ],
        "score-terminal-score-next-fixture",
      ),
      progressionSummary(
        [
          progressionAction("corp", 1, "install_card", "new_remote", 3, {
            installPlacement: "root",
            corpScoreTerminalWindow: true,
            corpScoreTerminalWindowAgendaInstallLegal: true,
            corpScoreTerminalSkipped: true,
            corpScoreTerminalSkippedForRemotePortfolio: true,
            corpScoreConversionFixGateBlockedByCheapContest: true,
          }),
        ],
        "score-terminal-cheap-contest-blocked-fixture",
      ),
    ]);

    expect(metrics.corpScoreTerminalWindow).toBe(5);
    expect(metrics.corpScoreTerminalAdvanceTaken).toBe(1);
    expect(metrics.corpScoreTerminalSkipped).toBe(4);
    expect(metrics.corpScoreTerminalSkippedForProtection).toBe(1);
    expect(metrics.corpScoreTerminalSkippedForEconomy).toBe(1);
    expect(metrics.corpScoreTerminalSkippedForDraw).toBe(1);
    expect(metrics.corpScoreTerminalSkippedForRemotePortfolio).toBe(1);
    expect(metrics.corpScoreConversionFixGateEligible).toBe(3);
    expect(metrics.corpScoreConversionFixGateBlockedByCheapContest).toBe(1);
    expect(metrics.corpScoreConversionFixGateSuspiciousProtectionLoop).toBe(1);
    expect(metrics.corpScoreConversionFixGateSuspiciousEconomyLoop).toBe(1);
    expect(metrics.corpScoreConversionFixGateSuspiciousDraw).toBe(1);
    expect(metrics.corpScoreTerminalSkippedThenAgendaStolen).toBe(2);
    expect(metrics.corpScoreTerminalSkippedThenProtectionLoop).toBe(1);
    expect(metrics.corpScoreTerminalSkippedThenEconomyLoop).toBe(1);
    expect(metrics.corpScoreTerminalSkippedThenRemoteStillSafe).toBe(1);
    expect(metrics.corpScoreTerminalSkippedThenScoreNextDecision).toBe(1);
  });

  it("summarizes corp economy-before-score loop attribution", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("corp", 1, "gain_credit", undefined, 1, {
            corpEconomyBeforeScoreDiagnosticWindow: true,
            corpEconomyBeforeScoreWindowWithInstalledAgenda: true,
            corpEconomyBeforeScoreWindowWithAdvancedAgenda: true,
            corpEconomyBeforeScoreWindowWithReadyRemote: true,
            corpEconomyBeforeScoreWindowRemoteSafe: true,
            corpEconomyBeforeScoreWindowCreditsShort: true,
            corpEconomyBeforeScoreTaken: true,
            corpEconomyBeforeScoreTakenAsNecessaryCredits: true,
            corpEconomyBeforeScorePlausibleCreditsNeeded: true,
            corpEconomyBeforeScoreFixGateBlockedByCredits: true,
          }),
          progressionAction("corp", 2, "advance_card", "remote_1", 1, {
            corpScoreTerminalWindow: true,
            corpScoreTerminalAdvanceTaken: true,
          }),
        ],
        "economy-before-score-necessary-fixture",
      ),
      progressionSummary(
        [
          progressionAction("corp", 1, "gain_credit", undefined, 2, {
            corpEconomyBeforeScoreDiagnosticWindow: true,
            corpEconomyBeforeScoreWindowWithScoreLegalNext: true,
            corpEconomyBeforeScoreWindowCreditsAlreadyEnough: true,
            corpEconomyBeforeScoreTaken: true,
            corpEconomyBeforeScoreTakenDespiteCreditsEnough: true,
            corpEconomyBeforeScoreTakenOverScoreLegal: true,
            corpEconomyBeforeScoreSuspiciousCreditsAlreadyEnough: true,
            corpEconomyBeforeScoreFixGateEligible: true,
            corpEconomyBeforeScoreFixGateSuspicious: true,
          }),
          progressionAction("corp", 2, "gain_credit", undefined, 2, {
            corpEconomyBeforeScoreDiagnosticWindow: true,
            corpEconomyBeforeScoreWindowWithScoreLegalNext: true,
            corpEconomyBeforeScoreWindowCreditsAlreadyEnough: true,
            corpEconomyBeforeScoreTaken: true,
            corpEconomyBeforeScoreTakenDespiteCreditsEnough: true,
            corpEconomyBeforeScoreFixGateEligible: true,
            corpEconomyBeforeScoreFixGateSuspicious: true,
          }),
          progressionAction("runner", 3, "steal_agenda", "remote_1", 2),
        ],
        "economy-before-score-repeat-fixture",
      ),
      progressionSummary(
        [
          progressionAction("corp", 1, "install_card", "remote_1", 3, {
            installPlacement: "root",
            targetCardType: "agenda",
            corpEconomyBeforeScoreDiagnosticWindow: true,
            corpEconomyBeforeScoreWindowWithAgendaInHqAndReadyRemote: true,
            corpEconomyBeforeScoreWindowWithReadyRemote: true,
            corpEconomyBeforeScoreTaken: true,
            corpEconomyBeforeScoreTakenOverAgendaInstallReadyRemote: true,
            corpEconomyBeforeScoreTakenOverHqAgendaExit: true,
            corpEconomyBeforeScoreFixGateBlockedByCheapContest: true,
          }),
        ],
        "economy-before-score-cheap-contest-fixture",
      ),
    ]);

    expect(metrics.corpEconomyBeforeScoreWindow).toBe(4);
    expect(metrics.corpEconomyBeforeScoreWindowNecessary).toBe(1);
    expect(metrics.corpEconomyBeforeScoreTaken).toBe(4);
    expect(metrics.corpEconomyBeforeScoreTakenAsNecessaryCredits).toBe(1);
    expect(metrics.corpEconomyBeforeScoreTakenDespiteCreditsEnough).toBe(2);
    expect(metrics.corpEconomyBeforeScoreTakenOverScoreLegal).toBe(1);
    expect(
      metrics.corpEconomyBeforeScoreTakenOverAgendaInstallReadyRemote,
    ).toBe(1);
    expect(metrics.corpEconomyBeforeScoreConvertedToAdvanceNextDecision).toBe(
      1,
    );
    expect(metrics.corpEconomyBeforeScoreConvertedWithin3CorpActions).toBe(1);
    expect(metrics.corpEconomyBeforeScoreRepeatedEconomyNextDecision).toBe(1);
    expect(metrics.corpEconomyBeforeScoreRepeatedEconomyWithin3).toBe(1);
    expect(metrics.corpEconomyBeforeScoreThenRunnerSteal).toBe(2);
    expect(metrics.corpEconomyBeforeScoreSuspiciousRepeatedEconomy).toBe(1);
    expect(metrics.corpEconomyBeforeScoreSuspiciousRunnerStealFollowup).toBe(2);
    expect(metrics.corpEconomyBeforeScoreFixGateBlockedByCredits).toBe(1);
    expect(metrics.corpEconomyBeforeScoreFixGateBlockedByCheapContest).toBe(1);
    expect(metrics.corpEconomyBeforeScoreFixGateSuspicious).toBe(2);
    expect(metrics.corpEconomyBeforeScoreFixGateSuspiciousRepeatedEconomy).toBe(
      1,
    );
    expect(metrics.corpRepeatedEconomyBeforeScoreWindows).toBe(1);
    expect(metrics.corpRepeatedEconomyBeforeScoreCreditsAlreadyEnough).toBe(1);
    expect(metrics.corpRepeatedEconomyBeforeScoreScoreLegal).toBe(1);
    expect(metrics.corpRepeatedEconomyBeforeScoreThenRunnerSteal).toBe(1);
    expect(metrics.corpRepeatedEconomyBeforeScoreSuspicious).toBe(1);
    expect(metrics.corpEconomyBeforeScoreNoConversionRepeatedEconomy).toBe(1);
    expect(metrics.corpEconomyBeforeScoreNoConversionRunnerSteal).toBe(2);
    expect(metrics.corpEconomyBeforeScoreNoConversionSuspicious).toBe(2);
    expect(metrics.corpEconomyBeforeScoreNoConversionPlausible).toBe(1);
    expect(metrics.corpEconomyBeforeScoreCreditsEnoughWindows).toBe(2);
    expect(metrics.corpEconomyBeforeScoreCreditsEnoughTaken).toBe(2);
    expect(metrics.corpEconomyBeforeScoreCreditsEnoughScoreLegal).toBe(2);
    expect(metrics.corpEconomyBeforeScoreCreditsEnoughSuspicious).toBe(2);
  });

  it("separates corp economy-before-score attribution blockers", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("corp", 1, "gain_credit", undefined, 1, {
            corpEconomyBeforeScoreDiagnosticWindow: true,
            corpEconomyBeforeScoreWindowWithReadyRemote: true,
            corpEconomyBeforeScoreWindowCreditsShort: true,
            corpEconomyBeforeScoreTaken: true,
            corpEconomyBeforeScoreTakenAsNecessaryCredits: true,
            corpEconomyBeforeScoreFixGateBlockedByCredits: true,
          }),
          progressionAction("corp", 2, "gain_credit", undefined, 1, {
            corpEconomyBeforeScoreDiagnosticWindow: true,
            corpEconomyBeforeScoreWindowWithReadyRemote: true,
            corpEconomyBeforeScoreWindowCreditsShort: true,
            corpEconomyBeforeScoreTaken: true,
            corpEconomyBeforeScoreTakenAsNecessaryCredits: true,
            corpEconomyBeforeScoreFixGateBlockedByCredits: true,
          }),
        ],
        "economy-before-score-still-short-repeat-fixture",
      ),
      progressionSummary(
        [
          progressionAction("corp", 1, "gain_credit", undefined, 1, {
            corpEconomyBeforeScoreDiagnosticWindow: true,
            corpEconomyBeforeScoreWindowWithReadyRemote: true,
            corpEconomyBeforeScoreWindowCreditsAlreadyEnough: true,
            corpEconomyBeforeScoreWindowRemoteContestHigh: true,
            corpEconomyBeforeScoreTaken: true,
            corpEconomyBeforeScoreTakenDespiteCreditsEnough: true,
            corpEconomyBeforeScoreFixGateBlockedByRunnerContest: true,
          }),
        ],
        "economy-before-score-runner-contest-blocked-fixture",
      ),
      progressionSummary(
        [
          progressionAction("corp", 1, "gain_credit", undefined, 1, {
            corpEconomyBeforeScoreDiagnosticWindow: true,
            corpEconomyBeforeScoreWindowCreditsAlreadyEnough: true,
            corpEconomyBeforeScoreTaken: true,
            corpEconomyBeforeScoreTakenDespiteCreditsEnough: true,
            corpEconomyBeforeScoreFixGateBlockedBySafety: true,
          }),
        ],
        "economy-before-score-safety-blocked-fixture",
      ),
      progressionSummary(
        [
          progressionAction("corp", 1, "gain_credit", undefined, 1, {
            corpEconomyBeforeScoreDiagnosticWindow: true,
            corpEconomyBeforeScoreWindowWithReadyRemote: true,
            corpEconomyBeforeScoreWindowWithScoreLegalNext: true,
            corpEconomyBeforeScoreWindowCreditsAlreadyEnough: true,
            corpEconomyBeforeScoreTaken: true,
            corpEconomyBeforeScoreTakenDespiteCreditsEnough: true,
            corpEconomyBeforeScoreFixGateEligible: true,
            corpEconomyBeforeScoreFixGateSuspicious: true,
          }),
          progressionAction("corp", 2, "draw_card", undefined, 1),
        ],
        "economy-before-score-plan-drift-fixture",
      ),
    ]);

    expect(metrics.corpRepeatedEconomyBeforeScoreWindows).toBe(1);
    expect(metrics.corpRepeatedEconomyBeforeScoreCreditsStillShort).toBe(1);
    expect(metrics.corpRepeatedEconomyBeforeScorePlausible).toBe(1);
    expect(metrics.corpRepeatedEconomyBeforeScoreSuspicious).toBe(0);
    expect(metrics.corpEconomyBeforeScoreNoConversionCreditsStillShort).toBe(2);
    expect(metrics.corpEconomyBeforeScoreNoConversionRunnerContestHigh).toBe(1);
    expect(metrics.corpEconomyBeforeScoreNoConversionRemoteUnsafe).toBe(1);
    expect(metrics.corpEconomyBeforeScoreNoConversionSafetyBlocked).toBe(1);
    expect(metrics.corpEconomyBeforeScoreNoConversionPlanDrift).toBe(1);
    expect(metrics.corpEconomyBeforeScoreNoConversionRepeatedEconomy).toBe(1);
    expect(metrics.corpEconomyBeforeScoreNoConversionDrawLoop).toBe(1);
    expect(metrics.corpEconomyBeforeScoreNoConversionSuspicious).toBe(1);
    expect(metrics.corpEconomyBeforeScoreNoConversionPlausible).toBe(4);
  });

  it("summarizes scored-agenda action metrics", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("corp", 1, "activated_card_ability", undefined, 1, {
            evidence: [
              "scored_agenda_action_opportunity:true",
              "scored_agenda_action_taken:true",
              "scored_agenda_economy_opportunity:true",
              "scored_agenda_economy_taken:true",
              "political_overthrow_opportunity:true",
              "political_overthrow_taken:true",
              "scored_agenda_action_value_over_basic:2",
            ],
          }),
          progressionAction("corp", 2, "gain_credit", undefined, 1, {
            evidence: [
              "basic_credit_taken_while_better_agenda_economy_available:true",
              "scored_agenda_economy_skipped_for_basic_credit:true",
              "political_overthrow_skipped_for_basic_credit:true",
            ],
          }),
          progressionAction("corp", 3, "activated_card_ability", undefined, 1, {
            evidence: [
              "scored_agenda_action_opportunity:true",
              "scored_agenda_action_taken:true",
              "scored_agenda_draw_opportunity:true",
              "scored_agenda_draw_taken:true",
              "scored_agenda_extra_action_opportunity:true",
              "scored_agenda_extra_action_taken:true",
              "scored_agenda_trace_tag_opportunity:true",
              "scored_agenda_trace_tag_taken:true",
              "scored_agenda_damage_punish_opportunity:true",
              "scored_agenda_damage_punish_taken:true",
              "scored_agenda_counter_economy_opportunity:true",
              "scored_agenda_counter_economy_taken:true",
            ],
          }),
          progressionAction("corp", 4, "draw_card", undefined, 1, {
            evidence: [
              "basic_draw_taken_while_better_agenda_draw_available:true",
            ],
          }),
        ],
        "scored-agenda-action-metric-fixture",
      ),
    ]);

    expect(metrics.scoredAgendaActionOpportunities).toBe(2);
    expect(metrics.scoredAgendaActionTaken).toBe(2);
    expect(metrics.scoredAgendaActionTakeRate).toBe(1);
    expect(metrics.scoredAgendaEconomyOpportunities).toBe(1);
    expect(metrics.scoredAgendaEconomyTaken).toBe(1);
    expect(metrics.scoredAgendaEconomySkippedForBasicCredit).toBe(1);
    expect(metrics.politicalOverthrowOpportunities).toBe(1);
    expect(metrics.politicalOverthrowTaken).toBe(1);
    expect(metrics.politicalOverthrowSkippedForBasicCredit).toBe(1);
    expect(metrics.scoredAgendaCounterEconomyTaken).toBe(1);
    expect(metrics.scoredAgendaDrawTaken).toBe(1);
    expect(metrics.scoredAgendaExtraActionTaken).toBe(1);
    expect(metrics.scoredAgendaTraceTagTaken).toBe(1);
    expect(metrics.scoredAgendaDamagePunishTaken).toBe(1);
    expect(metrics.scoredAgendaActionValueOverBasic).toBe(2);
    expect(metrics.basicCreditTakenWhileBetterAgendaEconomyAvailable).toBe(1);
    expect(metrics.basicDrawTakenWhileBetterAgendaDrawAvailable).toBe(1);
  });

  it("summarizes tag/punish terminal-window diagnostics", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("corp", 1, "play_operation", undefined, 1, {
            corpTagSourceOpportunity: true,
            corpTagSourceTaken: true,
            corpTraceTagOpportunity: true,
            corpTraceTagTaken: true,
            corpTraceTagExpectedSuccess: 1,
            corpTagPunishOntologyProfilesSeen: true,
            corpTagSourceOntologyProfilesSeen: true,
            corpTagSourceOntologyUsed: true,
            corpTagSourceLegalActionClassifiedByOntology: true,
            corpTagSourceTakenWithOntologyPayoffAvailable: true,
            corpTagCreatedByOperation: true,
            corpFunnelSourcePayoffPairSeenInDeck: true,
            corpFunnelSourceActionTakenWithPayoffInDeck: true,
            corpFunnelSourceActionTakenWithVisiblePayoff: true,
            runnerTraceDefenseVisibleAtTagSource: true,
            runnerLinkDefenseVisibleAtTrace: true,
            corpTagPunishOntologyKinds: ["tag_source", "trace"],
            corpTagPunishConditionKinds: ["requires_trace_success"],
          }),
          progressionAction("runner", 2, "resolve_choice", undefined, 1, {
            runnerTagsBeforeAction: 0,
            runnerTagsAfterAction: 1,
            runnerTagAddedByAction: true,
            runnerTaggedAfterTraceDuringRun: true,
            corpTagCreatedDuringRunnerTurn: true,
            corpTagCreatedDuringEncounter: true,
            corpTagCreatedByTraceSuccess: true,
          }),
          progressionAction("runner", 3, "end_turn", undefined, 1, {
            runnerTagsBeforeAction: 1,
            runnerTagsAfterAction: 1,
            runnerTaggedAtEndOfRunnerTurn: true,
          }),
          progressionAction("corp", 4, "mandatory_draw", undefined, 2, {
            runnerTagsBeforeAction: 1,
            runnerTagsAfterAction: 1,
            runnerTaggedAtCorpDecision: true,
            runnerTaggedAtCorpDecisionWithFunnelPayoffKnown: true,
            runnerTaggedAtStartOfCorpTurn: true,
            corpPunishOpportunity: true,
            corpPunishTaken: true,
            corpPunishKind: "scorched_earth_like",
            corpVisibleTagPunishLegalActions: 1,
            corpVisibleTagPayoffLegalActionKinds: ["damage"],
            corpVisibleTagPayoffLegalActionCards: ["onr_v1_302_scorched-earth"],
            corpVisibleTagDamagePunishLegalActions: true,
            corpVisibleTagPunishTaken: true,
            runnerDamagePreventionVisibleAtPayoffWindow: true,
            corpTagPunishOntologyProfilesSeen: true,
            corpTagPunishPayoffOntologyProfilesSeen: true,
            corpTagPunishPayoffOntologyUsed: true,
            corpPunishLegalActionClassifiedByOntology: true,
            corpPunishOpportunityConfirmedByOntology: true,
            corpOntologyPunishOpportunityConverted: true,
            corpTagPunishOntologyKinds: ["tag_punish_payoff", "damage"],
            corpTagPunishConditionKinds: ["requires_runner_tagged"],
          }),
          progressionAction("runner", 5, "resolve_choice", undefined, 2, {
            runnerTagsBeforeAction: 0,
            runnerTagsAfterAction: 1,
            runnerTagAddedByAction: true,
            runnerTaggedAfterTraceDuringRun: true,
            corpTagCreatedDuringRunnerTurn: true,
            corpTagCreatedByAccessOrSteal: true,
          }),
          progressionAction("runner", 6, "remove_tag", undefined, 2, {
            runnerTagsBeforeAction: 1,
            runnerTagsAfterAction: 0,
            runnerTagClearedByAction: true,
          }),
          progressionAction("corp", 7, "mandatory_draw", undefined, 3, {
            runnerTagsBeforeAction: 0,
            runnerTagsAfterAction: 0,
          }),
          progressionAction("corp", 8, "gain_credit", undefined, 4, {
            runnerTagsBeforeAction: 1,
            runnerTaggedAtCorpDecision: true,
            runnerTaggedAtCorpDecisionWithFunnelPayoffKnown: true,
            corpPunishOpportunity: true,
            corpPunishKind: "urban_renewal_like",
            corpPunishSkippedReason: "economy",
            corpVisibleTagPunishLegalActions: 1,
            corpVisibleTagPayoffLegalActionKinds: ["damage"],
            corpVisibleTagPayoffLegalActionCards: ["onr_v1_307_urban-renewal"],
            corpVisibleTagDamagePunishLegalActions: true,
            corpVisibleTagPunishSkipped: true,
            corpVisibleTagPunishSkippedReason: "economy",
            corpPunishOpportunityConfirmedByOntology: true,
            corpPunishSkippedDespiteOntologyOpportunity: true,
            corpTagPunishOntologyProfilesSeen: true,
            corpTagPunishPayoffOntologyProfilesSeen: true,
            corpTagPunishOntologyKinds: ["tag_punish_payoff"],
          }),
          progressionAction("corp", 9, "install_card", "hq", 4, {
            runnerTagsBeforeAction: 1,
            runnerTaggedAtCorpDecision: true,
            runnerTaggedAtCorpDecisionWithFunnelPayoffKnown: true,
            corpPunishOpportunity: true,
            corpPunishKind: "punitive_counterstrike_like",
            corpPunishSkippedReason: "protection",
            corpVisibleTagPunishLegalActions: 1,
            corpVisibleTagPayoffLegalActionKinds: ["damage"],
            corpVisibleTagPayoffLegalActionCards: [
              "onr_v1_301_punitive-counterstrike",
            ],
            corpVisibleTagDamagePunishLegalActions: true,
            corpVisibleTagPunishSkipped: true,
            corpVisibleTagPunishSkippedReason: "remote_protection",
            corpTraceTagOpportunity: true,
            corpTraceTagSkippedReason: "protection",
          }),
          progressionAction(
            "corp",
            10,
            "activated_card_ability",
            undefined,
            4,
            {
              runnerTagsBeforeAction: 1,
              runnerTaggedAtCorpDecision: true,
              runnerTaggedAtCorpDecisionWithoutPayoffKnown: true,
              corpPunishOpportunity: true,
              corpPunishTaken: true,
              corpPunishKind: "scored_agenda_damage_like",
              corpVisibleTagPunishTaken: true,
            },
          ),
        ],
        "tag-punish-window-metric-fixture",
      ),
    ]);

    expect(metrics.runnerTaggedAtCorpDecision).toBe(4);
    expect(metrics.runnerTaggedAtCorpDecisionTurns).toBe(2);
    expect(metrics.runnerTaggedAtCorpDecisionActions).toBe(4);
    expect(metrics.runnerTaggedAtStartOfCorpTurn).toBe(1);
    expect(metrics.runnerTaggedAtEndOfRunnerTurn).toBe(1);
    expect(metrics.runnerTaggedAfterTraceDuringRun).toBe(2);
    expect(metrics.corpTagCreatedDuringRunnerTurn).toBe(2);
    expect(metrics.corpTagCreatedDuringEncounter).toBe(1);
    expect(metrics.corpTagCreatedByTraceSuccess).toBe(1);
    expect(metrics.corpTagCreatedByAccessOrSteal).toBe(1);
    expect(metrics.corpTagCreatedByOperation).toBe(1);
    expect(metrics.runnerTaggedAtCorpDecisionWithFunnelPayoffKnown).toBe(3);
    expect(metrics.runnerTaggedAtCorpDecisionWithoutPayoffKnown).toBe(1);
    expect(
      metrics.runnerTagFromPreviousRunnerTurnStillVisibleAtCorpDecision,
    ).toBe(4);
    expect(metrics.runnerTagFromEncounterStillVisibleAtCorpDecision).toBe(4);
    expect(metrics.runnerTagClearedSameRunnerTurn).toBe(1);
    expect(metrics.runnerTagClearedBeforeCorpDecision).toBe(1);
    expect(metrics.runnerTagClearedBeforeCorpDecisionAfterFunnelSource).toBe(1);
    expect(metrics.runnerTagClearedSameRunnerTurnAfterSource).toBe(1);
    expect(metrics.runnerTagWindowExpiredBeforeCorpDecision).toBe(1);
    expect(metrics.runnerTagWindowExpiredBeforeCorpTurn).toBe(1);
    expect(metrics.corpVisibleTagPunishLegalActions).toBe(3);
    expect(metrics.corpVisibleTagDamagePunishLegalActions).toBe(3);
    expect(metrics.corpVisibleTagPayoffLegalActionsByKind).toBe(3);
    expect(metrics.corpVisibleTagPayoffLegalActionsByCard).toBe(3);
    expect(metrics.corpVisibleTagPunishTaken).toBe(2);
    expect(metrics.corpVisibleTagPunishSkipped).toBe(2);
    expect(metrics.corpVisibleTagPunishSkippedForEconomy).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedForRemoteProtection).toBe(1);
    expect(metrics.corpFunnelSourcePayoffPairSeenInDeck).toBe(1);
    expect(metrics.corpFunnelSourceActionTakenWithPayoffInDeck).toBe(1);
    expect(metrics.corpFunnelSourceActionTakenWithVisiblePayoff).toBe(1);
    expect(metrics.corpFunnelPairConvertedToTaggedDecisionWindow).toBe(1);
    expect(metrics.corpFunnelPairConvertedToLegalPayoffWindow).toBe(1);
    expect(metrics.corpFunnelPairConvertedToPayoffTaken).toBe(1);
    expect(metrics.corpFunnelPairExpiredBeforePayoffWindow).toBe(1);
    expect(metrics.runnerTraceDefenseVisibleAtTagSource).toBe(1);
    expect(metrics.runnerDamagePreventionVisibleAtPayoffWindow).toBe(1);
    expect(metrics.runnerLinkDefenseVisibleAtTrace).toBe(1);
    expect(metrics.corpPunishOpportunities).toBe(4);
    expect(metrics.corpPunishTaken).toBe(2);
    expect(metrics.corpPunishSkipped).toBe(2);
    expect(metrics.corpPunishTakeRate).toBe(0.5);
    expect(metrics.corpPunishOpportunityScorchedEarthLike).toBe(1);
    expect(metrics.corpPunishOpportunityUrbanRenewalLike).toBe(1);
    expect(metrics.corpPunishOpportunityPunitiveCounterstrikeLike).toBe(1);
    expect(metrics.corpPunishOpportunityScoredAgendaDamageLike).toBe(1);
    expect(metrics.corpPunishSkippedForEconomy).toBe(1);
    expect(metrics.corpPunishSkippedForProtection).toBe(1);
    expect(metrics.corpPunishWindowExpiredBeforeCorpTurn).toBe(1);
    expect(metrics.corpTagSourceOpportunities).toBe(1);
    expect(metrics.corpTagSourceTaken).toBe(1);
    expect(metrics.corpTraceTagOpportunities).toBe(2);
    expect(metrics.corpTraceTagTaken).toBe(1);
    expect(metrics.corpTraceTagSkipped).toBe(1);
    expect(metrics.corpTraceTagExpectedSuccess).toBe(1);
    expect(metrics.corpTraceTagSkippedForProtection).toBe(1);
    expect(metrics.corpTagSourceConvertedToRunnerTagged).toBe(1);
    expect(metrics.corpTagSourceConvertedToPunishOpportunity).toBe(1);
    expect(metrics.corpTagSourceConvertedToPunishTaken).toBe(1);
    expect(metrics.corpTagPunishFunnelTagSourceOpportunity).toBe(1);
    expect(metrics.corpTagPunishFunnelTagSourceTaken).toBe(1);
    expect(metrics.corpTagPunishFunnelRunnerTagged).toBe(1);
    expect(metrics.corpTagPunishFunnelRunnerTaggedAtCorpDecision).toBe(4);
    expect(metrics.corpTagPunishFunnelPunishOpportunity).toBe(4);
    expect(metrics.corpTagPunishFunnelPunishTaken).toBe(2);
    expect(metrics.corpTagPunishFunnelTerminalDamageOrEconomicHit).toBe(2);
    expect(metrics.corpTagPunishOntologyProfilesSeen).toBe(3);
    expect(metrics.corpTagSourceOntologyUsed).toBe(1);
    expect(metrics.corpTagPunishPayoffOntologyUsed).toBe(1);
    expect(metrics.corpPunishOpportunityConfirmedByOntology).toBe(2);
    expect(metrics.corpPunishSkippedDespiteOntologyOpportunity).toBe(1);
    expect(metrics.corpTagSourceTakenWithOntologyPayoffAvailable).toBe(1);
    expect(metrics.corpTagSourceConvertedToOntologyPunishOpportunity).toBe(1);
    expect(metrics.corpOntologyPunishOpportunityConverted).toBe(1);
    expect(metrics.corpTagPunishOntologyKindTagSource).toBe(1);
    expect(metrics.corpTagPunishOntologyKindTagPunishPayoff).toBe(2);
    expect(metrics.corpTagPunishOntologyKindTrace).toBe(1);
    expect(metrics.corpTagPunishConditionRequiresRunnerTagged).toBe(1);
    expect(metrics.corpTagPunishConditionRequiresTraceSuccess).toBe(1);
  });

  it("keeps tag/punish diagnostics invariant to hidden runner zones", () => {
    const visibleActions = [
      progressionAction("corp", 1, "gain_credit", undefined, 1, {
        runnerTagsBeforeAction: 1,
        runnerTaggedAtCorpDecision: true,
        corpPunishOpportunity: true,
        corpPunishKind: "closed_accounts_like",
        corpPunishSkippedReason: "economy",
      }),
    ];
    const first = summarizeMatchProgressionMetrics([
      progressionSummary(visibleActions, "tag-punish-hidden-a"),
    ]);
    const second = summarizeMatchProgressionMetrics([
      progressionSummary(
        visibleActions.map((entry) => ({
          ...entry,
          evidence: ["hidden_runner_hand_variant_not_used"],
        })),
        "tag-punish-hidden-b",
      ),
    ]);

    expect(second.corpPunishOpportunities).toBe(first.corpPunishOpportunities);
    expect(second.corpPunishSkippedForEconomy).toBe(
      first.corpPunishSkippedForEconomy,
    );
    expect(second.runnerTaggedAtCorpDecision).toBe(
      first.runnerTaggedAtCorpDecision,
    );
  });

  it("separates visible-tag payoff windows from strategy-neutral skip reasons", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("corp", 1, "trigger_ability", undefined, 1, {
            corpTagSourceOpportunity: true,
            corpTagSourceTaken: true,
            corpTagCreatedByPersistentEffect: true,
            corpFunnelSourcePayoffPairSeenInDeck: true,
            corpFunnelSourceActionTakenWithPayoffInDeck: true,
          }),
          progressionAction("corp", 2, "score_agenda", undefined, 2, {
            runnerTagsBeforeAction: 1,
            runnerTaggedAtCorpDecision: true,
            runnerTaggedAtCorpDecisionWithFunnelPayoffKnown: true,
            corpPunishOpportunity: true,
            corpPunishKind: "scorched_earth_like",
            corpPunishSkippedReason: "score",
            corpVisibleTagPunishLegalActions: 1,
            corpVisibleTagPayoffLegalActionKinds: ["damage"],
            corpVisibleTagPayoffLegalActionCards: ["onr_v1_302_scorched-earth"],
            corpVisibleTagDamagePunishLegalActions: true,
            corpVisibleTagPunishSkipped: true,
            corpVisibleTagPunishSkippedReason: "score",
          }),
          progressionAction("corp", 3, "advance_card", undefined, 2, {
            runnerTagsBeforeAction: 1,
            runnerTaggedAtCorpDecision: true,
            runnerTaggedAtCorpDecisionWithFunnelPayoffKnown: true,
            corpPunishOpportunity: true,
            corpPunishKind: "closed_accounts_like",
            corpPunishSkippedReason: "advance",
            corpVisibleTagPunishLegalActions: 1,
            corpVisibleTagPayoffLegalActionKinds: ["economic"],
            corpVisibleTagPayoffLegalActionCards: [
              "onr_v1_285_closed-accounts",
            ],
            corpVisibleTagEconomicPunishLegalActions: true,
            corpVisibleTagPunishSkipped: true,
            corpVisibleTagPunishSkippedReason: "advance",
            runnerSurvivalCounterContextAvailable: true,
            runnerFlatlinePreventionVisibleAtPayoffWindow: true,
            runnerSurvivalCounterContextSuppressedPunishValue: true,
          }),
          progressionAction("corp", 4, "install_card", "hq", 2, {
            runnerTagsBeforeAction: 1,
            runnerTaggedAtCorpDecision: true,
            runnerTaggedAtCorpDecisionWithFunnelPayoffKnown: true,
            corpPunishOpportunity: true,
            corpPunishKind: "power_grid_overload_like",
            corpPunishSkippedReason: "install",
            corpVisibleTagPunishLegalActions: 1,
            corpVisibleTagPayoffLegalActionKinds: ["trash"],
            corpVisibleTagPayoffLegalActionCards: [
              "onr_v1_299_power-grid-overload",
            ],
            corpVisibleTagTrashPunishLegalActions: true,
            corpVisibleTagPunishSkipped: true,
            corpVisibleTagPunishSkippedReason: "install",
          }),
          progressionAction("corp", 5, "gain_credit", undefined, 2, {
            runnerTagsBeforeAction: 1,
            runnerTaggedAtCorpDecision: true,
            runnerTaggedAtCorpDecisionWithFunnelPayoffKnown: true,
            corpPunishOpportunity: true,
            corpPunishKind: "unknown",
            corpPunishSkippedReason: "unknown_higher_priority",
            corpVisibleTagPunishLegalActions: 1,
            corpVisibleTagPayoffLegalActionKinds: ["run_lock", "ambush"],
            corpVisibleTagRunLockPunishLegalActions: true,
            corpVisibleTagAmbushPunishLegalActions: true,
            corpVisibleTagPunishSkipped: true,
            corpVisibleTagPunishSkippedReason: "unknown_higher_priority",
          }),
        ],
        "tag-punish-terminal-skip-reason-fixture",
      ),
    ]);

    expect(metrics.corpTagCreatedByPersistentEffect).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedForScore).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedForAdvance).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedForInstall).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedForUnknownHigherPriority).toBe(1);
    expect(metrics.corpVisibleTagEconomicPunishLegalActions).toBe(1);
    expect(metrics.corpVisibleTagTrashPunishLegalActions).toBe(1);
    expect(metrics.corpVisibleTagRunLockPunishLegalActions).toBe(1);
    expect(metrics.corpVisibleTagAmbushPunishLegalActions).toBe(1);
    expect(metrics.runnerSurvivalCounterContextAvailable).toBe(1);
    expect(metrics.runnerFlatlinePreventionVisibleAtPayoffWindow).toBe(1);
    expect(metrics.runnerSurvivalCounterContextSuppressedPunishValue).toBe(1);
  });

  it("summarizes tag/punish unknown-skip attribution and fix-gate buckets", () => {
    const unknownSkip = (
      actionType: LegalAction["type"],
      attribution: NonNullable<
        AiSimulationSummary["actionSequence"][number]["corpVisibleTagPunishUnknownSkipAttribution"]
      >,
      plausibility: NonNullable<
        AiSimulationSummary["actionSequence"][number]["corpVisibleTagPunishUnknownSkipPlausibility"]
      >,
      family: NonNullable<
        AiSimulationSummary["actionSequence"][number]["corpVisibleTagPunishUnknownSkipChosenFamily"]
      >,
      extra: Partial<AiSimulationSummary["actionSequence"][number]> = {},
    ) =>
      progressionAction("corp", 10, actionType, undefined, 3, {
        runnerTagsBeforeAction: 1,
        runnerTaggedAtCorpDecision: true,
        runnerTaggedAtCorpDecisionWithFunnelPayoffKnown: true,
        corpPunishOpportunity: true,
        corpPunishKind: "scorched_earth_like",
        corpPunishSkippedReason: "unknown_higher_priority",
        corpVisibleTagPunishLegalActions: 1,
        corpVisibleTagPayoffLegalActionKinds: ["damage"],
        corpVisibleTagPayoffLegalActionCards: ["onr_v1_302_scorched-earth"],
        corpVisibleTagDamagePunishLegalActions: true,
        corpVisibleTagPunishSkipped: true,
        corpVisibleTagPunishSkippedReason: "unknown_higher_priority",
        corpVisibleTagPunishUnknownSkipAttribution: attribution,
        corpVisibleTagPunishUnknownSkipPlausibility: plausibility,
        corpVisibleTagPunishUnknownSkipChosenFamily: family,
        corpVisibleTagPunishUnknownSkipChosenActionType: actionType,
        ...extra,
      });

    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          unknownSkip(
            "gain_credit",
            "unknown_skip_suspicious_basic_credit",
            "suspicious",
            "basic_credit",
            {
              corpVisibleTagPunishUnknownSkipFixGateEligible: true,
              corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal: true,
            },
          ),
          unknownSkip(
            "end_turn",
            "unknown_skip_suspicious_end_turn",
            "suspicious",
            "end_turn",
            { corpVisibleTagPunishUnknownSkipFixGateEligible: true },
          ),
          unknownSkip(
            "score_agenda",
            "unknown_skip_plausible_score_window",
            "plausible",
            "score",
            { corpVisibleTagPunishUnknownSkipFixGateBlockedBy: "score" },
          ),
          unknownSkip(
            "advance_card",
            "unknown_skip_plausible_advance_to_score",
            "plausible",
            "advance",
            {
              corpVisibleTagPunishUnknownSkipFixGateBlockedBy: "advance_score",
            },
          ),
          unknownSkip(
            "rez_ice",
            "unknown_skip_plausible_hq_or_rnd_safety",
            "plausible",
            "rez",
            { corpVisibleTagPunishUnknownSkipFixGateBlockedBy: "safety" },
          ),
          unknownSkip(
            "play_operation",
            "unknown_skip_plausible_payoff_unaffordable",
            "plausible",
            "operation",
            {
              corpVisibleTagPunishUnknownSkipFixGateBlockedBy: "affordability",
            },
          ),
          unknownSkip(
            "activated_card_ability",
            "unknown_skip_plausible_payoff_low_impact",
            "plausible",
            "ability",
            {
              corpVisibleTagPayoffLegalActionKinds: ["run_lock"],
              corpVisibleTagRunLockPunishLegalActions: true,
              corpVisibleTagDamagePunishLegalActions: false,
              corpVisibleTagPunishUnknownSkipFixGateBlockedBy: "low_impact",
            },
          ),
          unknownSkip(
            "install_card",
            "unknown_skip_suspicious_low_value_install",
            "suspicious",
            "install_asset_or_upgrade",
            { corpVisibleTagPunishUnknownSkipFixGateEligible: true },
          ),
          unknownSkip(
            "draw_card",
            "unknown_skip_plausible_survival_countercontext",
            "plausible",
            "draw",
            {
              corpVisibleTagPunishUnknownSkipFixGateBlockedBy: "safety",
              runnerDamagePreventionVisibleAtPayoffWindow: true,
            },
          ),
          unknownSkip(
            "trigger_ability",
            "unknown_skip_unclassified_missing_evidence",
            "unclassified",
            "unknown",
          ),
        ],
        "tag-punish-unknown-skip-attribution-fixture",
      ),
    ]);

    expect(metrics.corpVisibleTagPunishSkippedForUnknownHigherPriority).toBe(
      10,
    );
    expect(metrics.corpVisibleTagPunishUnknownSkipPlausible).toBe(6);
    expect(metrics.corpVisibleTagPunishUnknownSkipSuspicious).toBe(3);
    expect(metrics.corpVisibleTagPunishUnknownSkipUnclassified).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenBasicCredit).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenEndTurn).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenScore).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenAdvance).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenRez).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenOperation).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenAbility).toBe(1);
    expect(
      metrics.corpVisibleTagPunishSkippedUnknownChosenInstallAssetOrUpgrade,
    ).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenDraw).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenUnknown).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownByReasonCode).toBe(10);
    expect(metrics.corpVisibleTagPunishSkippedUnknownByChosenActionType).toBe(
      10,
    );
    expect(metrics.corpVisibleTagPunishSkippedUnknownByPayoffCard).toBe(10);
    expect(metrics.corpVisibleTagPunishSkippedUnknownByPayoffKind).toBe(10);
    expect(metrics.corpVisibleTagPunishUnknownSkipPayoffDamage).toBe(9);
    expect(metrics.corpVisibleTagPunishUnknownSkipPayoffRunLock).toBe(1);
    expect(
      metrics.corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal,
    ).toBe(1);
    expect(metrics.corpVisibleTagPunishUnknownSkipPayoffNonLethal).toBe(9);
    expect(metrics.corpVisibleTagPunishFixGateEligibleWindow).toBe(3);
    expect(metrics.corpVisibleTagPunishFixGateSuspiciousSkip).toBe(3);
    expect(metrics.corpVisibleTagPunishFixGateBlockedByScore).toBe(1);
    expect(metrics.corpVisibleTagPunishFixGateBlockedByAdvanceScore).toBe(1);
    expect(metrics.corpVisibleTagPunishFixGateBlockedBySafety).toBe(2);
    expect(metrics.corpVisibleTagPunishFixGateBlockedByAffordability).toBe(1);
    expect(metrics.corpVisibleTagPunishFixGateBlockedByLowImpact).toBe(1);
  });

  it("normalizes visible tag/punish payoff windows by corp decision", () => {
    const payoffWindow = (
      actionType: LegalAction["type"],
      extra: Partial<AiSimulationSummary["actionSequence"][number]>,
    ) =>
      progressionAction("corp", 20, actionType, undefined, 5, {
        runnerTagsBeforeAction: 1,
        runnerTaggedAtCorpDecision: true,
        corpVisibleTagPunishLegalActions: 2,
        corpVisibleTagPayoffLegalActionKinds: ["damage", "economic"],
        corpVisibleTagPayoffLegalActionCards: [
          "onr_v1_285_closed-accounts",
          "onr_v1_302_scorched-earth",
        ],
        corpVisibleTagDamagePunishLegalActions: true,
        corpVisibleTagEconomicPunishLegalActions: true,
        corpVisibleTagPunishDecisionWindow: true,
        corpVisibleTagPunishDecisionWindowWithMultiplePayoffs: true,
        ...extra,
      });

    const visibleTaken = payoffWindow("play_operation", {
      corpVisibleTagPunishTaken: true,
      corpVisibleTagPunishDecisionWindowTaken: true,
      corpVisibleTagPunishAlternativePayoffsNotChosen: 1,
      corpVisibleTagPunishChosenPayoffAmongAlternatives: true,
      corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff: true,
      corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken: true,
      corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization: true,
      corpVisibleTagPunishOperationChoiceAmongPayoffs: true,
      corpVisibleTagPunishChosenDamageOverEconomic: true,
    });
    const lethalMissed = payoffWindow("play_operation", {
      corpVisibleTagPunishTaken: true,
      corpVisibleTagPunishDecisionWindowTaken: true,
      corpVisibleTagPunishAlternativePayoffsNotChosen: 1,
      corpVisibleTagPunishChosenPayoffAmongAlternatives: true,
      corpVisibleTagPunishOperationChoiceAmongPayoffs: true,
      corpVisibleTagPunishChosenEconomicOverDamage: true,
      corpVisibleTagPunishChosenNonLethalOverLethal: true,
      corpVisibleTagPunishChosenLowerImpactOverHigherImpact: true,
      corpVisibleTagPunishPotentialPayoffOrderingIssue: true,
      corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed: true,
      corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage: true,
    });
    const basicCreditSkip = payoffWindow("gain_credit", {
      corpVisibleTagPunishLegalActions: 1,
      corpVisibleTagPayoffLegalActionKinds: ["damage"],
      corpVisibleTagPunishDecisionWindowWithMultiplePayoffs: false,
      corpVisibleTagPunishSkipped: true,
      corpVisibleTagPunishSkippedReason: "unknown_higher_priority",
      corpVisibleTagPunishDecisionWindowSkipped: true,
      corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen: true,
      corpVisibleTagPunishUnknownSkipAttribution:
        "unknown_skip_suspicious_basic_credit",
      corpVisibleTagPunishUnknownSkipPlausibility: "suspicious",
      corpVisibleTagPunishUnknownSkipChosenFamily: "basic_credit",
      corpVisibleTagPunishUnknownSkipFixGateEligible: true,
      corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization: true,
      corpVisibleTagPunishFixGateEligibleWindowNormalized: true,
      corpVisibleTagPunishFixGateSuspiciousSkipNormalized: true,
    });
    const endTurnSkip = payoffWindow("end_turn", {
      corpVisibleTagPunishLegalActions: 1,
      corpVisibleTagPayoffLegalActionKinds: ["damage"],
      corpVisibleTagPunishDecisionWindowWithMultiplePayoffs: false,
      corpVisibleTagPunishSkipped: true,
      corpVisibleTagPunishSkippedReason: "unknown_higher_priority",
      corpVisibleTagPunishDecisionWindowSkipped: true,
      corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen: true,
      corpVisibleTagPunishUnknownSkipAttribution:
        "unknown_skip_suspicious_end_turn",
      corpVisibleTagPunishUnknownSkipPlausibility: "suspicious",
      corpVisibleTagPunishUnknownSkipChosenFamily: "end_turn",
      corpVisibleTagPunishUnknownSkipFixGateEligible: true,
      corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization: true,
      corpVisibleTagPunishFixGateEligibleWindowNormalized: true,
      corpVisibleTagPunishFixGateSuspiciousSkipNormalized: true,
    });
    const scoreSkip = payoffWindow("score_agenda", {
      corpVisibleTagPunishLegalActions: 1,
      corpVisibleTagPayoffLegalActionKinds: ["damage"],
      corpVisibleTagPunishDecisionWindowWithMultiplePayoffs: false,
      corpVisibleTagPunishSkipped: true,
      corpVisibleTagPunishSkippedReason: "unknown_higher_priority",
      corpVisibleTagPunishDecisionWindowSkipped: true,
      corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen: true,
      corpVisibleTagPunishUnknownSkipAttribution:
        "unknown_skip_plausible_score_window",
      corpVisibleTagPunishUnknownSkipPlausibility: "plausible",
      corpVisibleTagPunishUnknownSkipChosenFamily: "score",
      corpVisibleTagPunishUnknownSkipFixGateBlockedBy: "score",
      corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization: true,
    });
    const unaffordableSkip = payoffWindow("play_operation", {
      corpVisibleTagPunishLegalActions: 1,
      corpVisibleTagPayoffLegalActionKinds: ["damage"],
      corpVisibleTagPunishDecisionWindowWithMultiplePayoffs: false,
      corpVisibleTagPunishSkipped: true,
      corpVisibleTagPunishSkippedReason: "unknown_higher_priority",
      corpVisibleTagPunishDecisionWindowSkipped: true,
      corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen: true,
      corpVisibleTagPunishUnknownSkipAttribution:
        "unknown_skip_plausible_payoff_unaffordable",
      corpVisibleTagPunishUnknownSkipPlausibility: "plausible",
      corpVisibleTagPunishUnknownSkipChosenFamily: "operation",
      corpVisibleTagPunishUnknownSkipFixGateBlockedBy: "affordability",
      corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization: true,
    });

    const first = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          visibleTaken,
          lethalMissed,
          basicCreditSkip,
          endTurnSkip,
          scoreSkip,
          unaffordableSkip,
        ],
        "tag-punish-window-normalization-a",
      ),
    ]);
    const second = summarizeMatchProgressionMetrics([
      progressionSummary(
        [visibleTaken, lethalMissed].map((entry) => ({
          ...entry,
          evidence: ["hidden_runner_zone_variant_not_used"],
        })),
        "tag-punish-window-normalization-b",
      ),
    ]);

    expect(first.corpVisibleTagPunishDecisionWindows).toBe(6);
    expect(first.corpVisibleTagPunishDecisionWindowsTaken).toBe(2);
    expect(first.corpVisibleTagPunishDecisionWindowsSkipped).toBe(4);
    expect(first.corpVisibleTagPunishDecisionWindowsWithMultiplePayoffs).toBe(
      2,
    );
    expect(first.corpVisibleTagPunishAlternativePayoffsNotChosen).toBe(2);
    expect(first.corpVisibleTagPunishChosenPayoffAmongAlternatives).toBe(2);
    expect(first.corpVisibleTagPunishSkippedForUnknownHigherPriority).toBe(4);
    expect(
      first.corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff,
    ).toBe(1);
    expect(
      first.corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization,
    ).toBe(4);
    expect(first.corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen).toBe(4);
    expect(
      first.corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization,
    ).toBe(1);
    expect(first.corpVisibleTagPunishOperationChoiceAmongPayoffs).toBe(2);
    expect(first.corpVisibleTagPunishChosenDamageOverEconomic).toBe(1);
    expect(first.corpVisibleTagPunishChosenEconomicOverDamage).toBe(1);
    expect(first.corpVisibleTagPunishChosenNonLethalOverLethal).toBe(1);
    expect(first.corpVisibleTagPunishChosenLowerImpactOverHigherImpact).toBe(1);
    expect(first.corpVisibleTagPunishFixGateEligibleWindowNormalized).toBe(2);
    expect(first.corpVisibleTagPunishFixGateSuspiciousSkipNormalized).toBe(2);
    expect(
      first.corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken,
    ).toBe(1);
    expect(first.corpVisibleTagPunishPotentialPayoffOrderingIssue).toBe(1);
    expect(
      first.corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed,
    ).toBe(1);
    expect(
      first.corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage,
    ).toBe(1);
    expect(second.corpVisibleTagPunishDecisionWindows).toBe(2);
    expect(second.corpVisibleTagPunishDecisionWindowsTaken).toBe(2);
    expect(JSON.stringify(visibleTaken)).not.toMatch(
      /runnerHand|runnerStack|hidden|grip|heap/i,
    );
  });

  it("does not count generic central endgame runs as true runner closeout", () => {
    const metrics = summarizeMatchProgressionMetrics([
      {
        ...progressionSummary(
          [
            progressionAction("runner", 1, "start_run", "hq", 8, {
              reasonCode: "runner.plan.safe_probe_run",
            }),
            progressionAction("runner", 2, "start_run", "rd", 8, {
              reasonCode: "runner.plan.pressure_rnd",
            }),
            progressionAction("runner", 3, "gain_credit", undefined, 8, {
              runnerEconomyActionTaken: true,
              reasonCode: "runner.plan.recover_economy",
            }),
          ],
          "action-limit-endgame-generic-central-closeout-fixture",
        ),
        finalAgendaPoints: { runner: 5, corp: 4 },
      },
    ]);

    expect(metrics.endgameCloseoutOpportunitiesRunnerRaw).toBe(0);
    expect(metrics.endgameCloseoutOpportunitiesRunnerDeduped).toBe(0);
    expect(metrics.endgameCloseoutOpportunitiesRunnerTrue).toBe(0);
    expect(metrics.endgameCloseoutOpportunitiesRunner).toBe(0);
    expect(metrics.endgameCloseoutOpportunitiesRunnerFalsePositive).toBe(0);
  });

  it("marks blocked known-agenda closeout windows as false positives", () => {
    const metrics = summarizeMatchProgressionMetrics([
      {
        ...progressionSummary(
          [
            progressionAction("runner", 1, "draw_card", undefined, 8, {
              hqKnownAgendaCount: 1,
              runnerContestBlockedByCredits: true,
              runCreditsMissingForKnownPath: 3,
              reasonCode: "runner.plan.setup_without_conversion",
            }),
            progressionAction("runner", 2, "start_run", "remote_1", 8, {
              knownRemoteAgendas: 1,
              remoteRunBoostedByKnownRemoteAgenda: true,
              runnerRemoteContestBlockedByPostRunReserve: true,
              reasonCode: "runner.plan.contest_remote",
            }),
          ],
          "action-limit-endgame-blocked-closeout-fixture",
        ),
        finalAgendaPoints: { runner: 5, corp: 4 },
      },
    ]);

    expect(metrics.endgameCloseoutOpportunitiesRunnerRaw).toBe(2);
    expect(metrics.endgameCloseoutOpportunitiesRunnerDeduped).toBe(2);
    expect(metrics.endgameCloseoutOpportunitiesRunnerTrue).toBe(0);
    expect(metrics.endgameCloseoutOpportunitiesRunnerFalsePositive).toBe(2);
    expect(metrics.runnerCloseoutBlockedByCredits).toBe(1);
    expect(metrics.runnerCloseoutBlockedByPostRunReserve).toBe(1);
    expect(metrics.runnerCloseoutSkippedWithReason).toBe(2);
    expect(metrics.runnerCloseoutAttempted).toBe(0);
  });

  it("summarizes outcome follow-up opportunities and conversions", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("runner", 1, "gain_credit", undefined, 1, {
            evidence: [
              "outcome_followup_opportunity:true",
              "outcome_followup_taken:true",
              "outcome_followup_applied:true",
              "good_outcome_converted:true",
              "runner_economy_converted_after_outcome:true",
            ],
          }),
          progressionAction("runner", 2, "start_run", "rd", 1, {
            evidence: [
              "outcome_followup_opportunity:true",
              "bad_outcome_repeated_without_new_info:true",
              "runner_access_no_value_repeated:true",
              "runner_central_success_followed_by_repeat_no_value:true",
              "outcome_followup_suppressed_by_progression_cost:true",
              "outcome_ignored:true",
            ],
          }),
          progressionAction("runner", 3, "gain_credit", undefined, 2, {
            evidence: [
              "outcome_followup_opportunity:true",
              "outcome_followup_taken:true",
              "outcome_followup_applied:true",
              "outcome_pivot_with_reason:true",
              "runner_access_no_value_pivoted:true",
            ],
          }),
          progressionAction("corp", 4, "advance_card", "remote_1", 2, {
            evidence: [
              "outcome_followup_opportunity:true",
              "outcome_followup_taken:true",
              "outcome_followup_applied:true",
              "good_outcome_converted:true",
              "outcome_followup_preserved_score_window:true",
              "score_now_protected_from_followup:true",
              "corp_remote_build_followup_advance_protect_score:true",
            ],
          }),
        ],
        "outcome-followup-metric-fixture",
      ),
    ]);

    expect(metrics.outcomeFollowupOpportunities).toBe(4);
    expect(metrics.outcomeFollowupTaken).toBe(3);
    expect(metrics.outcomeFollowupRate).toBe(0.75);
    expect(metrics.outcomeFollowupApplied).toBe(3);
    expect(metrics.outcomeFollowupSuppressedByProgressionCost).toBe(1);
    expect(metrics.outcomeFollowupLedToProgressWithin3).toBe(3);
    expect(metrics.outcomeFollowupLedToNoProgressChain).toBe(0);
    expect(metrics.outcomeFollowupPreservedScoreWindow).toBe(1);
    expect(metrics.scoreNowProtectedFromFollowup).toBe(1);
    expect(metrics.badOutcomeRepeatedWithoutNewInfo).toBe(1);
    expect(metrics.goodOutcomeConverted).toBe(2);
    expect(metrics.runnerAccessNoValuePivoted).toBe(1);
    expect(metrics.runnerAccessNoValueRepeated).toBe(1);
    expect(metrics.corpRemoteBuildFollowupAdvanceProtectScore).toBe(1);
  });

  it("summarizes future-effect encounter and pump viability metrics", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("runner", 1, "continue_run", "remote_1", 1, {
            evidence: [
              "run_remainder_subroutine_effect:true",
              "unbroken_run_effect_ignored_because_no_remaining_ice:true",
            ],
          }),
          progressionAction("runner", 2, "break_subroutine", "rd", 1, {
            evidence: [
              "run_remainder_subroutine_effect:true",
              "unbroken_run_effect_applied_to_remaining_path:true",
            ],
          }),
          progressionAction("runner", 3, "pump_breaker", "rd", 1, {
            evidence: [
              "run_remainder_subroutine_effect:true",
              "pump_cannot_lead_to_useful_break:true",
              "pump_would_destroy_access_reserve:true",
            ],
          }),
        ],
        "future-effect-encounter-metric-fixture",
      ),
    ]);

    expect(metrics.futureEffectSubroutinesEncountered).toBe(3);
    expect(metrics.futureEffectSubroutinesWithRemainingIce).toBe(1);
    expect(metrics.futureEffectSubroutinesWithoutRemainingIce).toBe(1);
    expect(metrics.futureEffectBreaksTaken).toBe(1);
    expect(metrics.futureEffectBreaksSkippedNoRemainingIce).toBe(1);
    expect(metrics.pumpActionsBeforeFutureEffectBreak).toBe(1);
    expect(metrics.pumpActionsThatCouldNotLeadToBreak).toBe(1);
    expect(metrics.pumpActionsThatDestroyedAccessReserve).toBe(1);
    expect(metrics.unbrokenRunEffectIgnoredBecauseNoRemainingIce).toBe(1);
    expect(metrics.unbrokenRunEffectAppliedToRemainingPath).toBe(1);
  });

  it("keeps remote builds unconverted without advance score or protection progress", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("corp", 1, "install_card", "remote_1", 1, {
            installPlacement: "root",
            reasonCode: "corp.plan.remote_build",
          }),
          progressionAction("corp", 2, "play_event", undefined, 1, {
            reasonCode: "corp.plan.economy",
          }),
          progressionAction("corp", 3, "end_turn", undefined, 1),
        ],
        "plan-conversion-remote-stall-fixture",
      ),
    ]);

    expect(metrics.remoteBuildConvertedToAdvanceOrScore).toBe(0);
    expect(metrics.planIntentConverted).toBe(0);
    expect(metrics.planIntentAbandoned).toBeGreaterThanOrEqual(1);
    expect(metrics.longestNoProgressChain).toBe(3);
  });

  it("keeps plan-conversion metrics invariant to hidden-state-like trace noise", () => {
    const visibleActions = [
      progressionAction("runner", 1, "draw_card", undefined, 1, {
        runnerDrawAction: true,
        reasonCode: "runner.plan.setup_for_run",
        evidence: ["public:draw"],
      }),
      progressionAction("runner", 2, "start_run", "remote_1", 1),
      progressionAction("runner", 3, "steal_agenda", undefined, 1),
    ];
    const first = summarizeMatchProgressionMetrics([
      progressionSummary(visibleActions, "hidden-invariance-a"),
    ]);
    const second = summarizeMatchProgressionMetrics([
      progressionSummary(
        visibleActions.map((entry) => ({
          ...entry,
          evidence: ["hidden:hq_has_agenda", "hidden:rd_top_card"],
          stateHashAfter: `${entry.stateHashAfter}-other-hidden-state`,
        })),
        "hidden-invariance-b",
      ),
    ]);

    expect(second).toMatchObject({
      actionLedToProgressWithin1: first.actionLedToProgressWithin1,
      actionLedToProgressWithin2: first.actionLedToProgressWithin2,
      actionLedToProgressWithin3: first.actionLedToProgressWithin3,
      planIntentConverted: first.planIntentConverted,
      planIntentAbandoned: first.planIntentAbandoned,
      setupActionConvertedToRun: first.setupActionConvertedToRun,
      remoteContestConvertedToStealOrTrash:
        first.remoteContestConvertedToStealOrTrash,
      actionsUntilNextScoreOrSteal: first.actionsUntilNextScoreOrSteal,
      actionsUntilNextMeaningfulBoardProgress:
        first.actionsUntilNextMeaningfulBoardProgress,
      actionLimitRootCauseByMatch: first.actionLimitRootCauseByMatch,
      actionLimitDominantSide: first.actionLimitDominantSide,
      finalStrategicWindowNoProgressActions:
        first.finalStrategicWindowNoProgressActions,
      finalWindowKnownInfoExploitationOpportunities:
        first.finalWindowKnownInfoExploitationOpportunities,
      endgameCloseoutOpportunitiesRunner:
        first.endgameCloseoutOpportunitiesRunner,
    });
  });

  it("deduplicates true closeout and repeated-central windows", () => {
    const metrics = summarizeMatchProgressionMetrics([
      {
        seed: "ai-central-dedupe-fixture",
        winner: "action_limit_reached",
        actions: 8,
        turns: 2,
        finalAgendaPoints: { runner: 4, corp: 0 },
        finalStateHash: "fnv1a:central-dedupe",
        eventLogLength: 8,
        replayOk: true,
        replayErrors: [],
        actionSequence: [
          progressionAction("runner", 1, "start_run", "rd", 1, {
            runnerCentralCloseoutOpportunityRaw: true,
            runnerTrueCentralCloseoutOpportunity: true,
            runnerCentralCloseoutOpportunity: true,
            runnerCentralCloseoutRunTaken: true,
            runnerCentralCloseoutReason: "interface",
            runnerCentralRunRepeatWindow: true,
            runnerRepeatedCentralRunWithFreshValue: true,
            runnerCentralRunInsteadOfContestableAdvancedRemote: true,
            runnerCentralRunInsteadWasJustified: true,
            runnerCentralRunJustificationReason: "interface",
            runnerContestableAdvancedRemoteThreatServerIds: ["remote_1"],
          }),
          progressionAction("runner", 2, "start_run", "rd", 1, {
            runnerCentralCloseoutOpportunityRaw: true,
            runnerTrueCentralCloseoutOpportunity: true,
            runnerCentralCloseoutOpportunity: true,
            runnerCentralCloseoutRunTaken: true,
            runnerCentralCloseoutReason: "interface",
            runnerCentralRunRepeatWindow: true,
            runnerRepeatedCentralRunWithFreshValue: true,
            runnerCentralRunInsteadOfContestableAdvancedRemote: true,
            runnerCentralRunInsteadWasJustified: true,
            runnerCentralRunJustificationReason: "interface",
            runnerContestableAdvancedRemoteThreatServerIds: ["remote_1"],
          }),
          progressionAction("runner", 3, "start_run", "hq", 2, {
            runnerCentralCloseoutOpportunityRaw: true,
            runnerCentralCloseoutSkippedWithGoodReason: true,
            runnerCentralRunRepeatWindow: true,
            runnerRepeatedCentralRunWithoutFreshValue: true,
            runnerRepeatedLowValueCentralRun: true,
            runnerCentralRunStalePenaltyApplied: true,
            runnerNoFreshCentralServerIds: ["hq"],
            runnerNoFreshCentralRunTaken: true,
            runnerNoFreshCentralBetterAlternativeTypes: [
              "economy",
              "remote_contest",
            ],
            runnerStaleCentralAllowedReason: "central_open",
            runnerCentralRunInsteadOfContestableAdvancedRemote: true,
            runnerContestableAdvancedRemoteThreatServerIds: ["remote_2"],
          }),
          progressionAction("runner", 4, "play_event", undefined, 3, {
            runnerNoFreshCentralServerIds: ["rd"],
            runnerNoFreshCentralBetterAlternativeTypes: ["economy"],
            runnerNoFreshCentralSubstitutionType: "economy",
          }),
        ],
        errors: [],
        cardPoolVersion: CURRENT_RULES_BASELINE.engineSchemaVersion,
        metrics: {
          illegalActions: 0,
          fallbackRate: 0,
          timeoutRate: 0,
          reasonCodeCoverage: [],
          actionTypeCoverage: [],
          roleCoverage: [],
          progressScore: 0,
          holdout: false,
          doctrine: {
            nakedAgendaInstalls: 0,
            agendaFloodExposure: 0,
            scoreWindowMissed: 0,
            remoteOverbuild: 0,
            economyStall: 0,
            repeatedLowValueCentralRun: 0,
            rigStall: 0,
            assetTrashNeglect: 0,
          },
        },
      },
    ]);

    expect(metrics.centralCloseoutOpportunitiesRaw).toBe(2);
    expect(metrics.trueCentralCloseoutOpportunities).toBe(1);
    expect(metrics.centralCloseoutOpportunitiesDeduped).toBe(1);
    expect(metrics.centralCloseoutRunsTaken).toBe(1);
    expect(metrics.centralCloseoutFalsePositiveRate).toBe(0.5);
    expect(metrics.centralRunRepeatWindowsRaw).toBe(3);
    expect(metrics.centralRunRepeatWindowsDeduped).toBe(2);
    expect(metrics.repeatedCentralRunsWithFreshValue).toBe(1);
    expect(metrics.repeatedCentralRunsWithoutFreshValue).toBe(1);
    expect(metrics.centralRunInsteadUnjustified).toBe(1);
    expect(metrics.centralRunJustifiedByInterface).toBe(1);
    expect(metrics.centralRunStalePenaltyApplied).toBe(1);
    expect(metrics.noFreshCentralWindows).toBe(2);
    expect(metrics.noFreshCentralRunsTaken).toBe(1);
    expect(metrics.noFreshCentralSubstitutions).toBe(1);
    expect(metrics.noFreshCentralSubstitutionRate).toBe(0.5);
    expect(metrics.noFreshCentralSubstitutionEconomy).toBe(1);
    expect(metrics.noFreshCentralWithBetterAlternative).toBe(2);
    expect(metrics.staleCentralChosenDespiteEconomy).toBe(1);
    expect(metrics.staleCentralChosenDespiteRemoteContest).toBe(1);
    expect(metrics.staleCentralAllowedWithReason).toBe(1);
    expect(metrics.staleCentralAllowedCentralOpen).toBe(1);
    expect(metrics.alternativeChosenAfterStaleCentralPenalty).toBe(1);
  });

  it("analyzes doctrine quality case examples without private state", () => {
    const benchmark = runDoctrineQualityBenchmark({
      includeHoldout: true,
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 24,
      baselineProfile: "random_legal_bot",
      candidateProfile: "current_candidate",
    });
    const analysis = analyzeDoctrineQualityCases(
      benchmark.candidateRun.summaries,
      { maxExamplesPerMetric: 2 },
    );
    const report = formatDoctrineQualityCaseAnalysisReport(analysis);

    expect(analysis.version).toBe("ai-deck-doctrine-case-analysis-v1");
    expect(analysis.maxExamplesPerMetric).toBe(2);
    expect(analysis.redactionSafe).toBe(true);
    expect(analysis.totals).toEqual(benchmark.candidate);
    expect(analysis.examples.economyStall.length).toBeLessThanOrEqual(2);
    expect(
      analysis.examples.economyStall.every(
        (example) => example.actionType !== "decline_rez",
      ),
    ).toBe(true);
    expect(
      analysis.examples.economyStall.every(
        (example) =>
          example.reasonCode !== "corp.plan.recover_economy" &&
          example.reasonCode !== "runner.plan.recover_economy",
      ),
    ).toBe(true);
    expect(
      analysis.examples.economyStall.every(
        (example) =>
          ![
            "access_card",
            "break_subroutine",
            "continue_run",
            "pump_breaker",
            "steal_agenda",
          ].includes(example.actionType),
      ),
    ).toBe(true);
    expect(
      analysis.examples.agendaFloodExposure.every(
        (example) =>
          ![
            "decline_rez",
            "end_turn",
            "mandatory_draw",
            "resolve_choice",
            "rez_ice",
          ].includes(example.actionType),
      ),
    ).toBe(true);
    expect(
      analysis.examples.agendaFloodExposure.every(
        (example) =>
          example.reasonCode !== "corp.plan.protect_hq" &&
          example.reasonCode !== "corp.plan.protect_rnd",
      ),
    ).toBe(true);
    expect(
      analysis.examples.rigStall.every(
        (example) => !(example.targetServerId ?? "").startsWith("remote_"),
      ),
    ).toBe(true);
    expect(report).toContain("## Examples");
    expect(report).toContain("### economyStall");
    expect(JSON.stringify({ analysis, report })).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  }, 30_000);

  it("evaluates holdout tuning gate for regression and improvement", () => {
    const baseline: Parameters<typeof evaluateV143TuningGate>[0] = {
      simulationId: "baseline",
      benchmarkProfile: "current_candidate",
      games: 20,
      illegalActions: 0,
      timeouts: 0,
      fallbackRate: 0.2,
      winRates: {
        runner: 0.45,
        corp: 0.45,
        draw: 0.1,
        action_limit_reached: 0,
      },
      agendaPoints: { runner: 35, corp: 38 },
      averageActions: 55,
      replayFailures: 0,
      notableExploitRefs: [],
      summaries: [],
    };
    const regressed = {
      ...baseline,
      simulationId: "regressed",
      illegalActions: 1,
    };
    const improved = {
      ...baseline,
      simulationId: "improved",
      fallbackRate: 0.15,
      winRates: { ...baseline.winRates, runner: 0.5 },
    };

    const gateRegression = evaluateV143TuningGate(regressed, baseline);
    const gateImproved = evaluateV143TuningGate(improved, baseline);

    expect(gateRegression.accepted).toBe(false);
    expect(gateRegression.reason).toBe(
      "holdout_regression_on_safety_or_replay",
    );
    expect(gateImproved.accepted).toBe(true);
    expect(gateImproved.reason).toBe("holdout_improved_or_stable");
  });

  it("runs persistent exploit fixtures as deterministic regression checks", () => {
    const fixtures = listV143ExploitFixtures();
    const results = runV143ExploitRegressionFixtures({
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 80,
    });

    expect(results.map((result) => result.fixtureId).sort()).toEqual(
      fixtures.map((fixture) => fixture.fixtureId).sort(),
    );
    expect(results.every((result) => result.passed)).toBe(true);
    expect(
      results.find(
        (result) => result.fixtureId === "v143-rnd-repeat-access-freshness",
      )?.message,
    ).toBe("ok:selected_gain_credit_on_stale_rnd_top");
    expect(JSON.stringify(results)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  });

  it("boosts a repeat R&D run after the top card was stolen and therefore freshened", () => {
    const baseInput = runnerActionPhaseInput(
      "ai-rnd-fresh-after-agenda-steal",
      (state) => {
        state.runner.credits = 8;
        state.corp.credits = 0;
      },
    );
    const rdRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = baseInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdRun || !gain)
      throw new Error("Missing R&D fresh repeat fixture actions");

    const input = {
      ...baseInput,
      profileId: "current_candidate",
      eventTail: [
        ...baseInput.eventTail,
        syntheticCentralAccessEvent(
          "ai-rnd-fresh-steal-access",
          100,
          "rd",
          "simple_agenda",
        ),
        syntheticPlanActionEvent(
          "ai-rnd-fresh-steal",
          101,
          "runner",
          "steal_agenda",
          "rd",
          { cardDefinitionId: "simple_agenda" },
        ),
      ],
      legalActions: [rdRun, gain],
    } satisfies AiDecisionInput;

    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const belief = reconstructBeliefState(input);
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(belief.runnerOpponentModel?.rndTopFreshness?.freshness).toBe(
      "fresh_after_top_removed",
    );
    expect(
      belief.runnerOpponentModel?.rndTopFreshness?.freshenedByRunnerAccess,
    ).toBe(true);
    expect(selected?.type).toBe("start_run");
    expect(selected?.payload?.serverId).toBe("rd");
    expect(JSON.stringify(decision)).not.toMatch(
      /cardInstances|privatePayload|FullState/,
    );
  });

  it("suppresses an immediate normal R&D repeat when a known non-agenda top card stayed in place", () => {
    const baseInput = runnerActionPhaseInput(
      "ai-rnd-stale-known-nonagenda",
      (state) => {
        state.runner.credits = 8;
        state.corp.credits = 0;
      },
    );
    const rdRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = baseInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdRun || !gain)
      throw new Error("Missing R&D stale repeat fixture actions");

    const input = {
      ...baseInput,
      profileId: "current_candidate",
      eventTail: [
        ...baseInput.eventTail,
        syntheticCentralAccessEvent(
          "ai-rnd-stale-operation-access",
          100,
          "rd",
          "simple_economy_operation",
        ),
      ],
      legalActions: [rdRun, gain],
    } satisfies AiDecisionInput;

    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const belief = reconstructBeliefState(input);
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(belief.runnerOpponentModel?.rndTopFreshness).toMatchObject({
      freshness: "stale_known_same_top",
      knownTopDefinitionId: "simple_economy_operation",
      knownTopIsAgenda: false,
    });
    expect(selected?.type).toBe("gain_credit");
    expect(decision.reasonCode).not.toBe("runner.plan.pressure_rnd");
  });

  it("suppresses a label-only R&D repeat after declining a known trashable top card", () => {
    const baseInput = runnerActionPhaseInput(
      "ai-rnd-label-only-declined-trash-repeat",
      (state) => {
        state.runner.credits = 8;
        state.corp.credits = 0;
      },
    );
    const rdRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(rdRun).toBeDefined();
    if (!rdRun) throw new Error("Missing label-only R&D repeat fixture action");

    const input = {
      ...baseInput,
      profileId: "current_candidate",
      eventTail: [
        ...baseInput.eventTail,
        syntheticCentralAccessEventByLabelOnly(
          "ai-rnd-bbs-label-only-access",
          100,
          "R&D",
          "onr_v1_309_bbs-whispering-campaign",
        ),
        syntheticDeclineTrashEvent("ai-rnd-bbs-decline-trash", 101),
      ],
    } satisfies AiDecisionInput;

    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "semantic";
    const belief = reconstructBeliefState(input);
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(belief.runnerOpponentModel?.rndTopFreshness).toMatchObject({
      freshness: "stale_known_same_top",
      knownTopDefinitionId: "onr_v1_309_bbs-whispering-campaign",
      knownTopIsAgenda: false,
    });
    expect(
      selected?.type === "start_run" && selected.payload?.serverId === "rd",
    ).toBe(false);
    expect(debugText).toContain(
      "runner_run_target:rd|kind:rd|payoff:known_low_value|known:known_no_current_payoff",
    );
  });

  it("keeps R&D pressure high when a known top agenda remains accessible", () => {
    const baseInput = runnerActionPhaseInput(
      "ai-rnd-stale-known-agenda",
      (state) => {
        state.runner.credits = 8;
        state.corp.credits = 0;
      },
    );
    const rdRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = baseInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdRun || !gain)
      throw new Error("Missing R&D agenda top fixture actions");

    const input = {
      ...baseInput,
      profileId: "current_candidate",
      eventTail: [
        ...baseInput.eventTail,
        syntheticCentralAccessEvent(
          "ai-rnd-agenda-top-access",
          100,
          "rd",
          "simple_agenda",
        ),
      ],
      legalActions: [rdRun, gain],
    } satisfies AiDecisionInput;

    const belief = reconstructBeliefState(input);
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(belief.runnerOpponentModel?.rndTopFreshness).toMatchObject({
      freshness: "stale_known_same_top",
      knownTopDefinitionId: "simple_agenda",
      knownTopIsAgenda: true,
    });
    expect(selected?.type).toBe("start_run");
    expect(selected?.payload?.serverId).toBe("rd");
  });

  it("advances a legally known R&D top sequence after the first card is removed", () => {
    const baseInput = runnerActionPhaseInput(
      "ai-rnd-known-sequence-advances",
      (state) => {
        state.runner.credits = 8;
        state.corp.credits = 0;
      },
    );
    const rdRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = baseInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdRun || !gain)
      throw new Error("Missing R&D sequence fixture actions");

    const input = {
      ...baseInput,
      profileId: "current_candidate",
      eventTail: [
        ...baseInput.eventTail,
        syntheticRndPrivateLookEvent("ai-rnd-sequence-look", 100, [
          "simple_economy_operation",
          "simple_agenda",
        ]),
        syntheticPlanActionEvent(
          "ai-rnd-sequence-trash-top",
          101,
          "runner",
          "trash_accessed_card",
          "rd",
          { cardDefinitionId: "simple_economy_operation" },
        ),
      ],
      legalActions: [rdRun, gain],
    } satisfies AiDecisionInput;

    const belief = reconstructBeliefState(input);
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    const rdTop = belief.knownPositionMemory?.find(
      (entry) => entry.zone === "rd" && entry.positionKey === "top",
    );

    expect(belief.runnerOpponentModel?.rndTopFreshness).toMatchObject({
      freshness: "fresh_after_top_removed",
      knownTopDefinitionId: "simple_agenda",
      knownTopIsAgenda: true,
    });
    expect(
      belief.runnerOpponentModel?.rndTopFreshness?.knownSequenceDefinitionIds,
    ).toEqual(["simple_agenda"]);
    expect(rdTop).toMatchObject({
      definitionId: "simple_agenda",
      positionKey: "top",
    });
    expect(selected?.type).toBe("start_run");
    expect(selected?.payload?.serverId).toBe("rd");
  });

  it("summarizes R&D freshness and repeat-pressure metrics", () => {
    const actionSequence = [
      {
        side: "runner",
        actionType: "access_card",
        targetServerId: "rd",
        evidence: [],
        rndAccesses: true,
        rndAccessLeftTopCardUnchanged: true,
        rndAccessNoValueRepeatStale: true,
      },
      {
        side: "runner",
        actionType: "steal_agenda",
        targetServerId: "rd",
        evidence: [],
        rndAccessRemovedTopCard: true,
        rndAccessStoleAgenda: true,
        rndTopFreshenedByRunnerAccess: true,
        rndKnownTopAdvancedAfterAccess: true,
        rndKnownTopSequenceAdvanced: true,
      },
      {
        side: "runner",
        actionType: "start_run",
        targetServerId: "rd",
        evidence: [],
        rndRepeatRunAfterTopRemoved: true,
        rndRepeatRunBoostedByFreshTop: true,
        rndFreshTopPressureOpportunity: true,
        rndFreshTopPressureTaken: true,
        rndCloseoutOpportunityAfterTopRemoved: true,
      },
      {
        side: "runner",
        actionType: "start_run",
        targetServerId: "rd",
        evidence: [],
        rndRepeatRunAfterTopUnchanged: true,
        rndRepeatRunSuppressedBecauseKnownStaleTop: true,
        rndRepeatRunSuppressedBecauseKnownNonAgendaTop: true,
        rndStaleTopRepeatMistake: true,
      },
    ] as unknown as AiSimulationSummary["actionSequence"];
    const metrics = summarizeMatchProgressionMetrics([
      {
        seed: "ai-rnd-freshness-metrics",
        winner: undefined,
        actions: actionSequence.length,
        turns: 1,
        finalAgendaPoints: { runner: 0, corp: 0 },
        replayOk: true,
        metrics: { illegalActions: 0 },
        actionSequence,
      } as unknown as AiSimulationSummary,
    ]);

    expect(metrics.rndAccesses).toBe(1);
    expect(metrics.rndAccessRemovedTopCard).toBe(1);
    expect(metrics.rndAccessLeftTopCardUnchanged).toBe(1);
    expect(metrics.rndTopFreshenedByRunnerAccess).toBe(1);
    expect(metrics.rndKnownTopSequenceAdvanced).toBe(1);
    expect(metrics.rndRepeatRunAfterTopRemoved).toBe(1);
    expect(metrics.rndRepeatRunAfterTopUnchanged).toBe(1);
    expect(metrics.rndRepeatRunBoostedByFreshTop).toBe(1);
    expect(metrics.rndRepeatRunSuppressedBecauseKnownStaleTop).toBe(1);
    expect(metrics.rndFreshTopPressureTaken).toBe(1);
    expect(metrics.rndStaleTopRepeatMistake).toBe(1);
  });
});

describe("MVP 0.3 AI simulation harness", () => {
  it("selects Corp LegalActions in a root-rez window even when activeSide is runner", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-sim-root-rez-active-runner" }),
    );
    state.corp.credits = 5;
    putCorpRootInRemote(state, "simple_economy_asset", 0);
    putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "decline_rez" &&
        action.payload?.runRootRezPass !== true,
    );

    expect(state.activeSide).toBe("runner");
    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(getLegalActions(state, "runner")).toEqual([]);
    expect(
      getLegalActions(state, "corp")
        .map((action) => action.type)
        .sort(),
    ).toEqual(["decline_rez", "rez_ice"]);

    const selection = selectAiDecisionSideForState(state);
    expect(selection.side).toBe("corp");
    expect(selection.legalActions.map((action) => action.type).sort()).toEqual([
      "decline_rez",
      "rez_ice",
    ]);
    const input = buildAiDecisionInput(state, selection.side!, {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.0-normal",
    });
    const decision = chooseAiAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    expect(selected).toBeDefined();
    if (!selected) throw new Error("Missing selected root-rez legal action");

    const result = applyAction(state, {
      matchId: state.matchId,
      side: selection.side!,
      actionId: selected.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices
        ? { selectedChoices: decision.selectedChoices }
        : {}),
      idempotencyKey: "ai-sim-root-rez-active-runner",
    });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
  });

  it("keeps a replayable long smoke run through public AI actions", () => {
    let state = createGameAfterSetup({ seed: "ai-long-smoke" });
    const initial = structuredClone(state);
    for (let step = 0; step < 60 && !state.winner; step += 1) {
      const side = state.activeSide;
      const input = buildAiDecisionInput(state, side, { actionNumber: step });
      const decision = chooseAiAction(input);
      const action = input.legalActions.find(
        (candidate) => candidate.actionId === decision.actionId,
      );
      expect(action).toBeDefined();
      if (!action) break;
      const result = applyAction(state, {
        matchId: state.matchId,
        side,
        actionId: action.actionId,
        clientKnownStateVersion: state.stateVersion,
        ...(decision.selectedChoices
          ? { selectedChoices: decision.selectedChoices }
          : {}),
        idempotencyKey: `ai-smoke-${step}`,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) break;
      state = result.state;
    }
    expect(replayEvents(initial, state.eventLog).ok).toBe(true);
  });

  it("keeps V1.1.2K local O:NR release cards inside side-safe AI LegalAction smokes", () => {
    let state = createGameAfterSetup({
      seed: "ai-v112k-card-release",
      runnerDeck: ONR_V1_1_2K_RUNNER_DECK,
      corpDeck: ONR_V1_1_2K_CORP_DECK,
      agendaPointsToWin: 7,
    });
    const initial = structuredClone(state);

    for (let step = 0; step < 50 && !state.winner; step += 1) {
      const side = state.activeSide;
      const input = buildAiDecisionInput(state, side, { actionNumber: step });
      expect(assertAiInputIsSideSafe(input)).toBe(true);
      expect(JSON.stringify(input)).not.toContain("cardInstances");
      const decision = chooseAiAction(input);
      const action = input.legalActions.find(
        (candidate) => candidate.actionId === decision.actionId,
      );
      expect(action).toBeDefined();
      if (!action) break;
      const result = applyAction(state, {
        matchId: state.matchId,
        side,
        actionId: action.actionId,
        clientKnownStateVersion: state.stateVersion,
        ...(decision.selectedChoices
          ? { selectedChoices: decision.selectedChoices }
          : {}),
        idempotencyKey: `ai-v112k-${step}`,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) break;
      state = result.state;
    }

    expect(replayEvents(initial, state.eventLog).ok).toBe(true);
  });

  it("passes V1.2.0 Event Modification windows through side-safe LegalActions fallback", () => {
    let state = createGameAfterSetup({
      seed: "ai-v120-event-modification",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damagePrevention: { side: "runner", preventAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );

    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const runnerDecision = chooseRunnerAction(runnerInput);
    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const serializedDecision = JSON.stringify(runnerDecision);

    expect(runnerInput.playerView.pendingChoice?.source).toBe(
      "v120.event_modification.prevent",
    );
    expect(runnerInput.legalActions.map((action) => action.type)).toEqual([
      "resolve_choice",
    ]);
    expect(runnerDecision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: ["pass"],
    });
    expect(runnerDecision.reasonCode).toBe("runner.choice.resolve");
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(corpInput.playerView.pendingChoice).toBeUndefined();
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(serializedDecision).not.toContain("Test-only Damage Prevention");
    expect(JSON.stringify(corpInput)).not.toContain("v120_damage_prevent");
  });

  it("passes V1.2.1 Replacement windows through side-safe LegalActions fallback", () => {
    let state = createGameAfterSetup({
      seed: "ai-v121-replacement",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damageReplacement: { side: "runner", tagAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );

    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const runnerDecision = chooseRunnerAction(runnerInput);
    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const serializedDecision = JSON.stringify(runnerDecision);

    expect(runnerInput.playerView.pendingChoice?.source).toBe(
      "v121.replacement.damage",
    );
    expect(runnerInput.legalActions.map((action) => action.type)).toEqual([
      "resolve_choice",
    ]);
    expect(runnerDecision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: ["pass"],
    });
    expect(runnerDecision.reasonCode).toBe("runner.choice.resolve");
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(corpInput.playerView.pendingChoice).toBeUndefined();
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(serializedDecision).not.toContain("Test-only Damage Replacement");
    expect(JSON.stringify(corpInput)).not.toContain("v121_damage_replace");
  });

  it("keeps V1.2.2 hidden Special Zones out of AI input", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v122-special-zone" }),
    );
    const cardId = moveRunnerCardToGrip(state, "simple_economy_event");
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: cardId,
      setAside: { visibility: "hidden", reason: "ai_v122_hidden_set_aside" },
    };
    state = apply(
      state,
      "runner",
      (action) => action.type === "move_to_set_aside",
    );

    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const corpSerialized = JSON.stringify(corpInput);

    expect(corpInput.playerView.specialZones?.setAside[0]).toMatchObject({
      known: false,
    });
    expect(corpSerialized).not.toContain("Simple Economy Event");
    expect(corpSerialized).not.toContain("simple_economy_event");
    expect(corpSerialized).not.toContain(cardId);
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
  });

  it("uses LegalActions-only fallback for V1.2.2 control-change windows", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v122-control-fallback" }),
    );
    const cardId = moveRunnerCardToGrip(state, "simple_economy_event");
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: cardId,
      controlChange: {
        newController: "corp",
        visibility: "private_to_side",
        reason: "ai_v122_control_change",
      },
    };
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const specialOnly = {
      ...input,
      legalActions: input.legalActions.filter(
        (action) => action.type === "change_card_control",
      ),
    };
    const decision = chooseRunnerAction(specialOnly);

    expect(specialOnly.legalActions).toHaveLength(1);
    expect(decision.actionId).toBe(specialOnly.legalActions[0]?.actionId);
    expect(decision.fallbackUsed).toBe(true);
    expect(decision.reasonCode).toBe("fallback.first_legal_action");
    expect(JSON.stringify(decision)).not.toContain("Simple Economy Event");
    expect(assertAiInputIsSideSafe(specialOnly)).toBe(true);
  });

  it("keeps V1.2.3 cards out of the seeded AI deck pool while allowing AI approval for custom deckbuilding", () => {
    const serializedPool = JSON.stringify(aiDeckPoolData);
    const snapshots = snapshotsData08.snapshots as Array<{
      deckSnapshotId: string;
      cards: Array<{ cardId: string }>;
    }>;
    const runtimeCardsById = createRuntimeCardsById();

    expect(serializedPool).not.toContain("demo_runner_123_snapshot_v1_2_3");
    expect(serializedPool).not.toContain("demo_corp_123_snapshot_v1_2_3");
    for (const cardId of ONR_V1_2_3_CARD_IDS) {
      expect(serializedPool).not.toContain(cardId);
      expect(runtimeCardsById[cardId]?.statuses.ai_supported).toBe(true);
    }
    for (const entry of aiDeckPoolData.entries) {
      const snapshot = snapshots.find(
        (candidate) => candidate.deckSnapshotId === entry.snapshotId,
      );
      expect(snapshot, entry.snapshotId).toBeDefined();
      for (const card of snapshot?.cards ?? []) {
        expect(
          runtimeCardsById[card.cardId]?.statuses.ai_supported,
          card.cardId,
        ).toBe(true);
      }
    }
  });

  it("includes Classic AI snapshots in the seeded AI deck pool", () => {
    const snapshots = snapshotsData08.snapshots as Array<{
      deckSnapshotId: string;
      side: "runner" | "corp";
      cards: Array<{ cardId: string; quantity: number }>;
    }>;
    const runtimeCardsById = createRuntimeCardsById();
    const classicEntries = aiDeckPoolData.entries.filter((entry) =>
      entry.tags.includes("classic"),
    );

    expect(classicEntries.map((entry) => entry.snapshotId).sort()).toEqual([
      "classic_corp_ai_snapshot_v1",
      "classic_runner_ai_snapshot_v1",
    ]);
    for (const entry of classicEntries) {
      const snapshot = snapshots.find(
        (candidate) => candidate.deckSnapshotId === entry.snapshotId,
      );
      expect(snapshot, entry.snapshotId).toBeDefined();
      expect(snapshot?.side, entry.snapshotId).toBe(entry.side);
      expect(
        snapshot?.cards.reduce((sum, card) => sum + card.quantity, 0),
        entry.snapshotId,
      ).toBe(45);
      expect(
        snapshot?.cards.some((card) => card.cardId.startsWith("onr_classic_")),
        entry.snapshotId,
      ).toBe(true);
      for (const card of snapshot?.cards ?? []) {
        expect(
          runtimeCardsById[card.cardId]?.statuses.ai_supported,
          card.cardId,
        ).toBe(true);
      }
    }
  });

  it("marks every active support AI group as AI-supported for custom AI deckbuilding", () => {
    const runtimeCardsById = createRuntimeCardsById();
    const groupCardIds = ACTIVE_CARD_SUPPORT_AI_GROUPS.flatMap(
      (group) => group.cardIds,
    );

    expect([...new Set(groupCardIds)].sort()).toEqual(
      [...activeAiApprovedCardIds].sort(),
    );
    for (const group of ACTIVE_CARD_SUPPORT_AI_GROUPS) {
      expect(group.cardIds.length, group.approvalId).toBeGreaterThan(0);
      for (const cardId of group.cardIds) {
        const card = runtimeCardsById[cardId];
        expect(card, cardId).toBeDefined();
        expect(card?.statuses.human_playable, cardId).toBe(true);
        expect(card?.statuses.deck_legal, cardId).toBe(true);
        expect(card?.statuses.format_legal, cardId).toBe(true);
        expect(card?.statuses.ai_supported, cardId).toBe(true);
      }
    }
  });

  it("keeps V1.2.3 card actions legal and side-safe after AI approval", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v123-human-only-mit",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: ONR_V1_2_3_RUNNER_DECK,
        corpDeck: ONR_V1_2_3_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerCardToGrip(state, "onr_v1_101_mit-west-tier");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const mitOnly = {
      ...input,
      legalActions: input.legalActions
        .filter(
          (action) =>
            action.type === "play_event" &&
            sourceDefinition(state, action) === "onr_v1_101_mit-west-tier",
        )
        .slice(0, 1),
    };
    const decision = chooseRunnerAction(mitOnly);

    expect(mitOnly.legalActions).toHaveLength(1);
    expect(decision.actionId).toBe(mitOnly.legalActions[0]?.actionId);
    expect(decision.reasonCode.length).toBeGreaterThan(0);
    expect(assertAiInputIsSideSafe(mitOnly)).toBe(true);
    expect(JSON.stringify(decision)).not.toContain("Dwarf");
    expect(JSON.stringify(decision)).not.toContain("MIT West Tier");
    expect(JSON.stringify(mitOnly)).not.toContain("cardInstances");
  });

  it("runs V0.4 expanded decks through the simulation harness", () => {
    const summary = simulateAiGame({
      seed: "ai-v04-expanded",
      runnerDeckId: "demo_runner_004",
      corpDeckId: "demo_corp_004",
      agendaPointsToWin: 7,
      maxActions: 140,
    });

    expect(summary.cardPoolVersion).toBe("0.99.0");
    expect(summary.errors).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(summary.finalStateHash).toMatch(/^fnv1a:/);
  }, 60_000);

  it("runs V0.8 starter decks through side-safe AI smokes", () => {
    const summaries = [
      "ai-v08-starter-a",
      "ai-v08-starter-b",
      "ai-v08-starter-c",
    ].map((seed) =>
      simulateAiGame({
        seed,
        runnerDeckId: "demo_runner_008",
        corpDeckId: "demo_corp_008",
        agendaPointsToWin: 7,
        maxActions: 180,
      }),
    );

    for (const summary of summaries) {
      expect(summary.cardPoolVersion).toBe("0.99.0");
      expect(summary.errors).toEqual([]);
      expect(summary.replayOk).toBe(true);
      expect(summary.finalStateHash).toMatch(/^fnv1a:/);
      expect(
        summary.actionSequence.every((entry) => entry.reasonCode.length > 0),
      ).toBe(true);
      expect(JSON.stringify(summary)).not.toContain("cardInstances");
      expect(JSON.stringify(summary)).not.toContain("v08_project_agenda_1");
    }
  }, 60_000);

  it("rejects V0.97 Run/Breach legacy demo decks without current runtime card snapshots", () => {
    expect(() =>
      simulateAiGame({
        seed: "ai-v097-run-breach",
        runnerDeckId: "demo_runner_097",
        corpDeckId: "demo_corp_097",
        agendaPointsToWin: 7,
        maxActions: 180,
      }),
    ).toThrow(/ai_deck_snapshot_unknown_card/);
  });

  it("rejects V0.98 Identity legacy demo decks without current runtime card snapshots", () => {
    expect(() =>
      simulateAiGame({
        seed: "ai-v098-identity",
        runnerDeckId: "demo_runner_098",
        corpDeckId: "demo_corp_098",
        agendaPointsToWin: 7,
        maxActions: 180,
      }),
    ).toThrow(/ai_deck_snapshot_unknown_card/);
  });

  it("rejects V0.99 Counter/Hosting legacy demo decks without current runtime card snapshots", () => {
    expect(() =>
      simulateAiGame({
        seed: "ai-v099-counter-hosting",
        runnerDeckId: "demo_runner_099",
        corpDeckId: "demo_corp_099",
        agendaPointsToWin: 7,
        maxActions: 200,
      }),
    ).toThrow(/ai_deck_snapshot_unknown_card/);
  });
});

describe("MVP 0.9 stronger AI", () => {
  it("adds side-safe evidence and quality metrics to V0.8 simulations", () => {
    const summary = simulateAiGame({
      seed: "ai-v09-metrics",
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      agendaPointsToWin: 7,
      runnerDifficulty: "hard",
      corpDifficulty: "hard",
      maxActions: 160,
    });

    expect(summary.cardPoolVersion).toBe("0.99.0");
    expect(summary.errors).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(summary.metrics.illegalActions).toBe(0);
    expect(summary.metrics.timeoutRate).toBe(0);
    expect(summary.metrics.reasonCodeCoverage.length).toBeGreaterThanOrEqual(2);
    expect(summary.metrics.actionTypeCoverage.length).toBeGreaterThanOrEqual(4);
    expect(
      summary.actionSequence.every(
        (entry) => entry.confidence >= 0 && entry.evidence.length > 0,
      ),
    ).toBe(true);
    expect(JSON.stringify(summary)).not.toContain("cardInstances");
    expect(JSON.stringify(summary)).not.toContain("v08_project_agenda_1");
  }, 60_000);

  it("keeps hidden-state variants from changing visible decisions", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v09-hidden",
        runnerDeckId: "demo_runner_008",
        corpDeckId: "demo_corp_008",
        agendaPointsToWin: 7,
      }),
    );
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      profileId: "runner-ai-v0.9-hard",
    });
    const variant = {
      ...input,
      eventTail: input.eventTail.map((event) => ({
        ...event,
        stateHashAfter: "fnv1a:hiddenvariant",
      })),
    };

    expect(chooseRunnerAction(variant)).toEqual(chooseRunnerAction(input));
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("reconstructs observed facts without private decklists", () => {
    const state = createGameAfterSetup({
      seed: "ai-v09-observed",
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      agendaPointsToWin: 7,
    });
    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v0.9-normal",
    });
    const facts = buildObservedFacts(input);

    expect(facts.publicServers).toContain("rd");
    expect(facts.agendaPoints.own).toBe(0);
    expect(JSON.stringify(facts)).not.toContain("cardInstances");
    expect(JSON.stringify(facts)).not.toContain("v08_burst_credit_event");
  });

  it("runs the V0.9 soak matrix with holdout accounting", () => {
    const soak = simulateAiSoak({ maxActions: 60 });

    expect(soak.aggregate.seeds).toBe(27);
    expect(soak.aggregate.illegalActions).toBe(0);
    expect(soak.aggregate.replayFailures).toBe(0);
    expect(soak.aggregate.timeoutRate).toBe(0);
    expect(soak.aggregate.reasonCodeCoverage.length).toBeGreaterThanOrEqual(2);
    expect(soak.aggregate.holdoutSeeds).toEqual([
      "ai-v09-holdout-001",
      "ai-v09-holdout-002",
      "ai-v09-holdout-003",
    ]);
    expect(JSON.stringify(soak)).not.toContain("cardInstances");
  }, 120_000);
});

const V094_RUNNER_DECK: DeckDefinition = {
  id: "demo_runner_094",
  name: "Runner Demo Deck 0.94 - AI Damage Harness",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_economy_event", quantity: 3 },
    { id: "simple_run_event", quantity: 3 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_killer", quantity: 2 },
  ],
};

const V094_CORP_DECK: DeckDefinition = {
  id: "demo_corp_094",
  name: "Corp Demo Deck 0.94 - AI Damage Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_priority_agenda", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "v094_neural_sentry_ice", quantity: 3 },
    { id: "simple_barrier_ice", quantity: 2 },
  ],
};

const DIPLOMATIC_IMMUNITY_CARD_ID_FOR_TEST = "onr_v1_160_diplomatic-immunity";
const SCHLAGHUND_CARD_ID_FOR_TEST = "onr_v1_339_schlaghund";
const FULL_BODY_CONVERSION_CARD_ID_FOR_TEST = "onr_v1_127_full-body-conversion";
const DERMATECH_BODYPLATING_CARD_ID_FOR_TEST =
  "onr_v1_125_dermatech-bodyplating";
const ACCOUNTS_RECEIVABLE_CARD_ID_FOR_TEST = "onr_v1_281_accounts-receivable";
const EFFICIENCY_EXPERTS_CARD_ID_FOR_TEST = "onr_v1_290_efficiency-experts";
const NIGHT_SHIFT_CARD_ID_FOR_TEST = "onr_v1_295_night-shift";
const CREDIT_CONSOLIDATION_CARD_ID_FOR_TEST =
  "onr_proteus_047_credit-consolidation";
const CREDIT_SURGE_CARD_ID_FOR_TEST = "v08_credit_surge_operation";
const SIMPLE_DRAW_OPERATION_CARD_ID_FOR_TEST = "simple_draw_operation";
const ACCOUNTS_RECEIVABLE_HQ_ICE_CARD_ID_FOR_TEST = "onr_v1_243_fetch-4-0-1";

const V111_CORP_DECK: DeckDefinition = {
  ...V094_CORP_DECK,
  id: "demo_corp_111",
  name: "Corp Demo Deck 1.1.1 - AI Core Damage Harness",
  cards: [
    ...V094_CORP_DECK.cards,
    { id: "v111_core_damage_operation", quantity: 2 },
  ],
};

const V095_RUNNER_DECK: DeckDefinition = {
  id: "demo_runner_095",
  name: "Runner Demo Deck 0.95 - AI Resource Harness",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_economy_event", quantity: 3 },
    { id: "simple_run_event", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_killer", quantity: 2 },
    { id: "v095_safehouse_resource", quantity: 2 },
  ],
};

const V095_CORP_DECK: DeckDefinition = {
  id: "demo_corp_095",
  name: "Corp Demo Deck 0.95 - AI Resource Trash Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_priority_agenda", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "simple_economy_asset", quantity: 2 },
    { id: "simple_tag_ice", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 },
  ],
};

const CORP_TAG_SLICE_RUNNER_DECK: DeckDefinition = {
  id: "ai_corp_tag_slice_runner",
  name: "AI Corp Tag Slice Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_economy_event", quantity: 3 },
    { id: "simple_run_event", quantity: 3 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_killer", quantity: 2 },
  ],
};

const CORP_TAG_SLICE_CORP_DECK: DeckDefinition = {
  id: "ai_corp_tag_slice_corp",
  name: "AI Corp Tag Slice Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_priority_agenda", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "simple_tag_ice", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "onr_v1_287_datapool-by-zetatech", quantity: 2 },
    { id: "onr_v1_293_netwatch-credit-voucher", quantity: 2 },
    { id: "onr_v1_243_fetch-4-0-1", quantity: 2 },
    { id: "onr_v1_249_hunter", quantity: 2 },
    { id: "onr_v1_306_trojan-horse", quantity: 1 },
  ],
};

const ONR_V1_1_2K_RUNNER_DECK: DeckDefinition = {
  id: "ai_onr_v112k_runner",
  name: "AI O:NR V1.1.2K Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_006_black-dahlia", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_016_cyfermaster", quantity: 2 },
    { id: "onr_v1_040_loony-goon", quantity: 2 },
    { id: "onr_v1_060_shaka", quantity: 2 },
    { id: "onr_v1_073_wizards-book", quantity: 2 },
    { id: "onr_v1_145_wutech-mem-chip", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_1_2K_CORP_DECK: DeckDefinition = {
  id: "ai_onr_v112k_corp",
  name: "AI O:NR V1.1.2K Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_293_netwatch-credit-voucher", quantity: 1 },
    { id: "onr_v1_295_night-shift", quantity: 1 },
    { id: "onr_v1_253_laser-wire", quantity: 1 },
    { id: "onr_v1_257_nerve-labyrinth", quantity: 1 },
    { id: "onr_v1_259_in-the-face", quantity: 1 },
    { id: "onr_v1_261_quandary", quantity: 1 },
    { id: "onr_v1_262_razor-wire", quantity: 1 },
    { id: "onr_v1_263_reinforced-wall", quantity: 1 },
    { id: "onr_v1_265_rock-is-strong", quantity: 1 },
    { id: "onr_v1_266_scramble", quantity: 1 },
    { id: "onr_v1_269_shotgun-wire", quantity: 1 },
    { id: "onr_v1_270_sleeper", quantity: 1 },
    { id: "onr_v1_278_wall-of-ice", quantity: 1 },
    { id: "onr_v1_279_wall-of-static", quantity: 1 },
    { id: "simple_economy_operation", quantity: 2 },
  ],
};

const ONR_V1_2_3_CARD_IDS = [
  "onr_v1_021_dwarf",
  "onr_v1_039_krash",
  "onr_v1_066_snowball",
  "onr_v1_074_worm",
  "onr_v1_081_custodial-position",
  "onr_v1_085_executive-wiretaps",
  "onr_v1_101_mit-west-tier",
  "onr_v1_297_overtime-incentives",
] as const;

const ONR_V1_2_3_RUNNER_DECK: DeckDefinition = {
  id: "ai_onr_v123_runner",
  name: "AI O:NR V1.2.3 Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "onr_v1_039_krash", quantity: 2 },
    { id: "onr_v1_066_snowball", quantity: 2 },
    { id: "onr_v1_074_worm", quantity: 2 },
    { id: "onr_v1_081_custodial-position", quantity: 1 },
    { id: "onr_v1_085_executive-wiretaps", quantity: 1 },
    { id: "onr_v1_101_mit-west-tier", quantity: 2 },
  ],
};

const ONR_V1_2_3_CORP_DECK: DeckDefinition = {
  id: "ai_onr_v123_corp",
  name: "AI O:NR V1.2.3 Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_297_overtime-incentives", quantity: 3 },
    { id: "onr_v1_237_data-wall", quantity: 2 },
    { id: "onr_v1_261_quandary", quantity: 2 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "onr_v1_259_in-the-face", quantity: 2 },
    { id: "onr_v1_295_night-shift", quantity: 2 },
    { id: "simple_economy_operation", quantity: 1 },
  ],
};

const V1911_RUNNER_DECK: DeckDefinition = {
  id: "ai_onr_v1911_runner",
  name: "AI O:NR V1.9.11 Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_economy_event", quantity: 8 },
  ],
};

const V1911_CORP_DECK: DeckDefinition = {
  id: "ai_onr_v1911_corp",
  name: "AI O:NR V1.9.11 Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_272_too-many-doors", quantity: 1 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_economy_operation", quantity: 4 },
    { id: "simple_barrier_ice", quantity: 2 },
  ],
};

function v094DamageGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: V094_RUNNER_DECK,
    corpDeck: V094_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v095ResourceGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: V095_RUNNER_DECK,
    corpDeck: V095_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function installedResourceCorpTurn(seed: string): GameState {
  let state = toRunnerTurn(v095ResourceGame(seed));
  state.runner.credits = 6;
  moveRunnerCardToGrip(state, "v095_safehouse_resource");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === "v095_safehouse_resource",
  );
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 3;
  state.corp.credits = 5;
  state.runner.tags = 1;
  return state;
}

function traceCorpBidState(seed: string): GameState {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeckId: "demo_runner_096",
      corpDeckId: "demo_corp_096",
      agendaPointsToWin: 7,
    }),
  );
  putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
  state.corp.credits = 8;
  state.runner.credits = 5;
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "rd",
  );
  state = apply(
    state,
    "corp",
    (action) =>
      action.type === "rez_ice" &&
      sourceDefinition(state, action) === "v096_trace_probe_ice",
  );
  return apply(state, "runner", (action) => action.type === "continue_run");
}

function postBidTraceLinkChoiceFixture(seed: string): {
  state: GameState;
  input: AiDecisionInput;
  signpostId: CardInstanceId;
  springboardId: CardInstanceId;
} {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: {
        id: `${seed}_runner`,
        name: "AI Post-Bid Trace Runner",
        side: "runner",
        identity: "runner_identity_001",
        cards: [
          { id: "onr_v1_063_signpost", quantity: 1 },
          { id: "onr_v1_181_the-springboard", quantity: 1 },
          { id: "simple_economy_event", quantity: 10 },
        ],
      },
      corpDeck: {
        id: `${seed}_corp`,
        name: "AI Post-Bid Trace Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "onr_v1_243_fetch-4-0-1", quantity: 1 },
          { id: "simple_agenda", quantity: 6 },
          { id: "simple_economy_operation", quantity: 6 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 5;
  state.corp.credits = 5;
  const signpostId = moveRunnerProgramToRig(state, "onr_v1_063_signpost");
  const springboardId = moveRunnerResourceToRig(
    state,
    "onr_v1_181_the-springboard",
  );
  const iceId = putCorpIceOnServer(state, "rd", "onr_v1_243_fetch-4-0-1");

  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "rd",
  );
  state = apply(
    state,
    "corp",
    (action) => action.type === "rez_ice" && action.source === iceId,
  );
  state = apply(state, "runner", (action) => action.type === "continue_run");
  state = applyChoice(state, "corp", ["bid_0"]);
  state = applyChoice(state, "runner", ["bid_0"]);

  return {
    state,
    input: buildAiDecisionInput(state, "runner", { difficulty: "hard" }),
    signpostId,
    springboardId,
  };
}

function withSyntheticPostBidTraceContext(
  input: AiDecisionInput,
  context: {
    traceStrength: number;
    runnerLink: number;
    runnerBid: number;
    runnerStrength: number;
    postBidTraceLinkBonus?: number;
  },
): AiDecisionInput {
  const event: PublicGameEvent = {
    eventId: `synthetic_post_bid_trace_${input.eventTail.length}`,
    type: "resolve_choice",
    stateVersionBefore: 9000,
    stateVersionAfter: 9001,
    stateHashAfter: "fnv1a:synthetic",
    visibilityClass: "public",
    publicPayload: {
      actor: "runner",
      actionType: "resolve_choice",
      traceStep: "runner_bid",
      traceStrength: context.traceStrength,
      runnerLink: context.runnerLink,
      runnerBid: context.runnerBid,
      runnerStrength: context.runnerStrength,
      ...(context.postBidTraceLinkBonus !== undefined
        ? { postBidTraceLinkBonus: context.postBidTraceLinkBonus }
        : {}),
    },
  };
  return { ...input, eventTail: [...input.eventTail, event] };
}

function withPostBidChoiceOptions(
  input: AiDecisionInput,
  options: NonNullable<
    AiDecisionInput["playerView"]["pendingChoice"]
  >["options"],
): AiDecisionInput {
  if (!input.playerView.pendingChoice)
    throw new Error("Expected pending post-bid choice");
  return {
    ...input,
    playerView: {
      ...input.playerView,
      pendingChoice: {
        ...input.playerView.pendingChoice,
        options,
      },
    },
  };
}

function corpActionPhaseInput(
  seed: string,
  mutate: (state: GameState) => void,
) {
  let state = createGameAfterSetup({ seed });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  mutate(state);
  return buildAiDecisionInput(state, "corp", {
    difficulty: "normal",
    profileId: "corp-ai-v1.4.0-normal",
  });
}

function corpAdvancementDominanceInput(
  seed: string,
  mutate: (state: GameState) => void,
) {
  return corpActionPhaseInput(seed, (state) => {
    state.corp.credits = 6;
    addCorpCardToHqForTest(state, "onr_v1_305_team-restructuring");
    mutate(state);
  });
}

function teamRestructuringAction(
  input: AiDecisionInput,
): LegalAction | undefined {
  return input.legalActions.find(
    (action) =>
      action.type === "play_operation" &&
      sourceDefinitionFromInput(input, action) ===
        "onr_v1_305_team-restructuring",
  );
}

function advanceActionForDefinition(
  input: AiDecisionInput,
  definitionId: string,
): LegalAction | undefined {
  return advanceActionsForDefinition(input, definitionId)[0];
}

function advanceActionsForDefinition(
  input: AiDecisionInput,
  definitionId: string,
): LegalAction[] {
  return input.legalActions.filter(
    (action) =>
      action.type === "advance_card" &&
      sourceDefinitionFromInput(input, action) === definitionId,
  );
}

function corpFutureIceOrderingInput(
  seed: string,
  hqDefinitionIds: string[],
  mutate?: (state: GameState) => void,
): AiDecisionInput {
  let state = createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: {
      id: `ai_corp_future_ice_runner_${seed}`,
      name: "AI Corp Future ICE Ordering Runner Fixture",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "simple_fracter", quantity: 3 },
        { id: "simple_economy_event", quantity: 8 },
      ],
    },
    corpDeck: {
      id: `ai_corp_future_ice_corp_${seed}`,
      name: "AI Corp Future ICE Ordering Corp Fixture",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "simple_agenda", quantity: 6 },
        { id: "simple_economy_operation", quantity: 6 },
        { id: "simple_barrier_ice", quantity: 4 },
        { id: "simple_code_gate_ice", quantity: 4 },
        { id: "onr_v1_222_ball-and-chain", quantity: 2 },
        { id: "onr_v1_224_bolter-cluster", quantity: 1 },
        { id: "onr_v1_225_canis-major", quantity: 1 },
        { id: "onr_v1_226_canis-minor", quantity: 1 },
        { id: "onr_v1_234_data-darts", quantity: 1 },
        { id: "onr_v1_242_fatal-attractor", quantity: 1 },
        { id: "onr_v1_274_tutor", quantity: 1 },
        { id: "onr_v1_276_viral-15", quantity: 1 },
        { id: "onr_v1_277_virizz", quantity: 1 },
      ],
    },
    agendaPointsToWin: 7,
  });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  ensureRemoteServer(state, "remote_1");
  state.corp.credits = 12;
  state.corp.clicks = 3;
  for (const definitionId of hqDefinitionIds) {
    moveCorpCardToHq(state, definitionId);
  }
  mutate?.(state);
  return buildAiDecisionInput(state, "corp", {
    difficulty: "normal",
    profileId: "corp-ai-v1.4.0-normal",
  });
}

function corpScoredAgendaAbilityInput(
  seed: string,
  definitionId: string,
  options: {
    credits?: number;
    clicks?: number;
    runnerTagged?: boolean;
    counters?: Partial<
      NonNullable<GameState["cardInstances"][string]["counters"]>
    >;
    mutate?: (state: GameState) => void;
  } = {},
) {
  let state = createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
    corpDeck: {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: `ai_scored_agenda_corp_${seed}`,
      name: "AI Scored Agenda Corp Fixture",
      cards: [
        { id: definitionId, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
          (entry) => entry.id !== definitionId,
        ),
      ],
    },
    agendaPointsToWin: 7,
  });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  const agendaId = putCorpCardInScoreArea(state, definitionId);
  state.cardInstances[agendaId] = {
    ...state.cardInstances[agendaId]!,
    counters: {
      ...(state.cardInstances[agendaId]?.counters ?? {}),
      ...(options.counters ?? {}),
    },
  };
  state.corp.credits = options.credits ?? 2;
  state.corp.clicks = options.clicks ?? 3;
  state.runner.tags = options.runnerTagged ? 1 : 0;
  options.mutate?.(state);
  return {
    state,
    agendaId,
    input: buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.2-normal",
    }),
  };
}

function installedCorpBbsEconomyInput(seed: string, bbsBits: number[] = [16]) {
  let state = createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: {
      id: `installed_corp_bbs_runner_${seed}`,
      name: "Installed Corp BBS Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "simple_fracter", quantity: 2 },
        { id: "simple_economy_event", quantity: 8 },
      ],
    },
    corpDeck: {
      id: `installed_corp_bbs_corp_${seed}`,
      name: "Installed Corp BBS Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        {
          id: "onr_v1_309_bbs-whispering-campaign",
          quantity: bbsBits.length,
        },
        { id: "simple_agenda", quantity: 4 },
        { id: "simple_economy_operation", quantity: 6 },
        { id: "simple_barrier_ice", quantity: 2 },
      ],
    },
    agendaPointsToWin: 7,
  });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  bbsBits.forEach((bitCount, index) => {
    putInstalledCorpBbsInRemote(state, `remote_${index + 1}`, bitCount);
  });
  state.corp.credits = 2;
  state.corp.clicks = 3;
  return buildAiDecisionInput(state, "corp", {
    difficulty: "normal",
    profileId: "corp-ai-v1.4.0-normal",
  });
}

function accountsReceivableCorpEconomyInput(
  seed: string,
  credits: number,
): AiDecisionInput {
  return corpEconomyOperationInput(
    seed,
    credits,
    ACCOUNTS_RECEIVABLE_CARD_ID_FOR_TEST,
  );
}

function efficiencyExpertsCorpEconomyInput(
  seed: string,
  credits: number,
): AiDecisionInput {
  return corpEconomyOperationInput(
    seed,
    credits,
    EFFICIENCY_EXPERTS_CARD_ID_FOR_TEST,
  );
}

function nightShiftCorpEconomyInput(
  seed: string,
  credits: number,
): AiDecisionInput {
  return corpEconomyOperationInput(seed, credits, NIGHT_SHIFT_CARD_ID_FOR_TEST);
}

function corpEconomyOperationInput(
  seed: string,
  credits: number,
  operationDefinitionId: string,
): AiDecisionInput {
  let state = createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: ONR_V1_1_2K_RUNNER_DECK,
    corpDeck: {
      ...ONR_V1_1_2K_CORP_DECK,
      id: `accounts_receivable_corp_${seed}`,
      name: "Accounts Receivable Corp Economy Fixture",
      cards: deckCardsWithAddedQuantities(ONR_V1_1_2K_CORP_DECK.cards, [
        { id: operationDefinitionId, quantity: 2 },
        { id: ACCOUNTS_RECEIVABLE_HQ_ICE_CARD_ID_FOR_TEST, quantity: 1 },
      ]),
    },
    agendaPointsToWin: 7,
  });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  moveCorpCardToHq(state, operationDefinitionId);
  moveCorpCardToHq(state, ACCOUNTS_RECEIVABLE_HQ_ICE_CARD_ID_FOR_TEST);
  state.corp.credits = credits;
  state.corp.clicks = 3;
  return buildAiDecisionInput(state, "corp", {
    difficulty: "normal",
    profileId: "corp-ai-v1.4.0-normal",
  });
}

function deckCardsWithAddedQuantities(
  cards: DeckDefinition["cards"],
  additions: DeckDefinition["cards"],
): DeckDefinition["cards"] {
  const merged = cards.map((entry) => ({ ...entry }));
  for (const addition of additions) {
    const existing = merged.find((entry) => entry.id === addition.id);
    if (existing) {
      existing.quantity += addition.quantity;
    } else {
      merged.push({ ...addition });
    }
  }
  return merged;
}

function accountsReceivableAction(
  input: AiDecisionInput,
): LegalAction | undefined {
  return economyOperationAction(input, ACCOUNTS_RECEIVABLE_CARD_ID_FOR_TEST);
}

function efficiencyExpertsAction(
  input: AiDecisionInput,
): LegalAction | undefined {
  return economyOperationAction(input, EFFICIENCY_EXPERTS_CARD_ID_FOR_TEST);
}

function nightShiftAction(input: AiDecisionInput): LegalAction | undefined {
  return economyOperationAction(input, NIGHT_SHIFT_CARD_ID_FOR_TEST);
}

function economyOperationAction(
  input: AiDecisionInput,
  definitionId: string,
): LegalAction | undefined {
  return input.legalActions.find(
    (action) =>
      action.type === "play_operation" &&
      sourceDefinitionFromInput(input, action) === definitionId,
  );
}

function hqIceInstallAction(
  input: AiDecisionInput,
  definitionId: string,
): LegalAction | undefined {
  return input.legalActions.find(
    (action) =>
      action.type === "install_card" &&
      action.payload?.placement === "ice" &&
      action.payload?.serverId === "hq" &&
      sourceDefinitionFromInput(input, action) === definitionId,
  );
}

function basicCorpCreditAction(
  input: AiDecisionInput,
): LegalAction | undefined {
  return input.legalActions.find(
    (action) =>
      action.type === "gain_credit" && action.source === "basic_action",
  );
}

function basicCorpDrawAction(input: AiDecisionInput): LegalAction | undefined {
  return input.legalActions.find(
    (action) => action.type === "draw_card" && action.source === "basic_action",
  );
}

function corpReplayTagPunishWindowInput(
  seed: string,
  options: {
    installedBbs?: boolean;
    cityInHq?: boolean;
    cityInstalled?: boolean;
  } = {},
) {
  let state = createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: V095_RUNNER_DECK,
    corpDeck: {
      ...V095_CORP_DECK,
      id: `corp_replay_tag_punish_${seed}`,
      cards: [
        ...V095_CORP_DECK.cards,
        { id: "onr_v1_284_chance-observation", quantity: 1 },
        { id: "onr_v1_307_urban-renewal", quantity: 1 },
        { id: "onr_v1_313_city-surveillance", quantity: 1 },
        { id: "onr_v1_309_bbs-whispering-campaign", quantity: 1 },
      ],
    },
    agendaPointsToWin: 7,
  });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  moveCorpCardToHq(state, "onr_v1_284_chance-observation");
  moveCorpCardToHq(state, "onr_v1_307_urban-renewal");
  if (options.cityInHq) {
    moveCorpCardToHq(state, "onr_v1_313_city-surveillance");
  }
  if (options.cityInstalled) {
    putCorpRootInServer(state, "remote_2", "onr_v1_313_city-surveillance", 0, {
      faceup: false,
      rezzed: false,
    });
  }
  if (options.installedBbs) {
    putInstalledCorpBbsInRemote(state, "remote_1", 16);
  }
  state.runnerTurnFlags = {
    ...(state.runnerTurnFlags ?? {
      stoleAgendaThisTurn: false,
      stoleAgendaLastTurn: false,
    }),
    runAttemptsLastTurn: 1,
  };
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.credits = 10;
  state.corp.clicks = 3;
  state.runner.credits = 8;
  state.runner.tags = 0;
  return buildAiDecisionInput(state, "corp", {
    difficulty: "normal",
    profileId: "corp-ai-v0.9-hard",
  });
}

function installedCorpAdvancementCounterPayoutInput(
  seed: string,
  advancementCounters: number,
  options: { credits?: number } = {},
) {
  let state = createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: {
      id: `installed_corp_advancement_counter_payout_runner_${seed}`,
      name: "Installed Corp Advancement Counter Payout Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "simple_fracter", quantity: 2 },
        { id: "simple_economy_event", quantity: 8 },
      ],
    },
    corpDeck: {
      id: `installed_corp_advancement_counter_payout_corp_${seed}`,
      name: "Installed Corp Advancement Counter Payout Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "onr_v1_328_information-laundering", quantity: 1 },
        { id: "simple_agenda", quantity: 4 },
        { id: "simple_economy_operation", quantity: 6 },
        { id: "simple_barrier_ice", quantity: 2 },
      ],
    },
    agendaPointsToWin: 7,
  });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  const launderingId = putCorpRootInRemote(
    state,
    "onr_v1_328_information-laundering",
    advancementCounters,
  );
  state.cardInstances[launderingId] = {
    ...state.cardInstances[launderingId]!,
    faceup: true,
    rezzed: true,
    advancementCounters,
  };
  state.corp.credits = options.credits ?? 2;
  state.corp.clicks = 3;
  return buildAiDecisionInput(state, "corp", {
    difficulty: "normal",
    profileId: "corp-ai-v1.4.0-normal",
  });
}

function putInstalledCorpBbsInRemote(
  state: GameState,
  serverId: `remote_${number}`,
  bitCount: number,
): CardInstanceId {
  ensureRemoteServer(state, serverId);
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) throw new Error(`Missing ${serverId}`);
  const bbsEntry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === "onr_v1_309_bbs-whispering-campaign" &&
      !state.corp.servers.some((candidate) =>
        candidate.root.includes(id as CardInstanceId),
      ),
  );
  if (!bbsEntry) throw new Error("Missing BBS Whispering Campaign copy");
  const bbsId = bbsEntry[0] as CardInstanceId;
  removeEverywhere(state, bbsId);
  server.root.push(bbsId);
  state.cardInstances[bbsId] = {
    ...state.cardInstances[bbsId]!,
    zone: { side: "corp", zone: "serverRoot", serverId },
    faceup: true,
    rezzed: true,
    counters: { bit: bitCount },
    advancementCounters: 0,
  };
  return bbsId;
}

function putInstalledCorpHolovidInRemote(
  state: GameState,
  serverId: `remote_${number}`,
  bitCount: number,
): CardInstanceId {
  ensureRemoteServer(state, serverId);
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) throw new Error(`Missing ${serverId}`);
  const holovidEntry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === "onr_v1_326_holovid-campaign" &&
      !state.corp.servers.some((candidate) =>
        candidate.root.includes(id as CardInstanceId),
      ),
  );
  if (!holovidEntry) throw new Error("Missing Holovid Campaign copy");
  const holovidId = holovidEntry[0] as CardInstanceId;
  removeEverywhere(state, holovidId);
  server.root.push(holovidId);
  state.cardInstances[holovidId] = {
    ...state.cardInstances[holovidId]!,
    zone: { side: "corp", zone: "serverRoot", serverId },
    faceup: true,
    rezzed: true,
    counters: { bit: bitCount },
    advancementCounters: 0,
  };
  return holovidId;
}

function runnerActionPhaseInput(
  seed: string,
  mutate: (state: GameState) => void,
  config: CreateGameConfig = {},
) {
  const state = toRunnerTurn(createGameAfterSetup({ seed, ...config }));
  mutate(state);
  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.1-normal",
  });
}

function allNighterAiDeckConfig(idSuffix: string): CreateGameConfig {
  return {
    runnerDeck: {
      id: `ai_all_nighter_runner_${idSuffix}`,
      name: "AI All-Nighter Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_076_all-nighter", quantity: 3 },
        { id: "simple_fracter", quantity: 2 },
        { id: "simple_economy_event", quantity: 8 },
      ],
    },
    corpDeck: {
      id: `ai_all_nighter_corp_${idSuffix}`,
      name: "AI All-Nighter Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "simple_agenda", quantity: 6 },
        { id: "simple_barrier_ice", quantity: 4 },
        { id: "simple_economy_operation", quantity: 8 },
      ],
    },
  };
}

function allNighterPlayAction(
  input: ReturnType<typeof buildAiDecisionInput>,
  serverId: string,
): LegalAction | undefined {
  return input.legalActions.find(
    (action) =>
      action.type === "play_event" &&
      action.payload?.serverId === serverId &&
      sourceDefinitionFromInput(input, action) === "onr_v1_076_all-nighter",
  );
}

function runnerCentralPressureDeckConfig(idSuffix: string): CreateGameConfig {
  return {
    runnerDeck: {
      id: `ai_central_pressure_runner_${idSuffix}`,
      name: "AI Central Pressure Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_139_r-and-d-interface", quantity: 3 },
        { id: "onr_v1_129_hq-interface", quantity: 3 },
        { id: "onr_v1_081_custodial-position", quantity: 3 },
        { id: "onr_v1_085_executive-wiretaps", quantity: 3 },
        { id: "simple_economy_event", quantity: 8 },
      ],
    },
    corpDeck: {
      id: `ai_central_pressure_corp_${idSuffix}`,
      name: "AI Central Pressure Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "simple_agenda", quantity: 6 },
        { id: "simple_barrier_ice", quantity: 4 },
        { id: "simple_economy_operation", quantity: 8 },
      ],
    },
  };
}

function runnerLoanFromChibaDeckConfig(idSuffix: string): CreateGameConfig {
  return {
    runnerDeck: {
      id: `ai_loan_from_chiba_runner_${idSuffix}`,
      name: "AI Loan from Chiba Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_168_loan-from-chiba", quantity: 3 },
        { id: "onr_v1_144_tycho-mem-chip", quantity: 3 },
        { id: "onr_v1_045_newsgroup-filter", quantity: 3 },
        { id: "onr_v1_139_r-and-d-interface", quantity: 3 },
        { id: "onr_v1_129_hq-interface", quantity: 2 },
        { id: "simple_fracter", quantity: 3 },
        { id: "simple_economy_event", quantity: 8 },
      ],
    },
    corpDeck: {
      id: `ai_loan_from_chiba_corp_${idSuffix}`,
      name: "AI Loan from Chiba Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "simple_agenda", quantity: 8 },
        { id: "simple_barrier_ice", quantity: 6 },
        { id: "simple_economy_operation", quantity: 8 },
      ],
    },
  };
}

function loanFromChibaInstallAction(
  input: ReturnType<typeof buildAiDecisionInput>,
): LegalAction | undefined {
  return input.legalActions.find(
    (action) =>
      action.type === "install_card" &&
      sourceDefinitionFromInput(input, action) === "onr_v1_168_loan-from-chiba",
  );
}

function runnerCoverageSearchDeckConfig(idSuffix: string): CreateGameConfig {
  return {
    runnerDeck: {
      id: `ai_coverage_search_runner_${idSuffix}`,
      name: "AI Coverage Search Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "v098_stack_search_event", quantity: 3 },
        { id: "simple_fracter", quantity: 3 },
        { id: "simple_economy_event", quantity: 8 },
      ],
    },
    corpDeck: {
      id: `ai_coverage_search_corp_${idSuffix}`,
      name: "AI Coverage Search Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "simple_agenda", quantity: 6 },
        { id: "simple_barrier_ice", quantity: 4 },
        { id: "simple_economy_operation", quantity: 8 },
      ],
    },
  };
}

function hqMemoryDeckConfig(
  idSuffix: string,
  includeExpertScheduleAnalyzer = false,
): CreateGameConfig {
  const runnerCards = [
    ...(includeExpertScheduleAnalyzer
      ? [{ id: "onr_v1_024_expert-schedule-analyzer", quantity: 1 }]
      : []),
    { id: "onr_v1_139_r-and-d-interface", quantity: 2 },
    { id: "onr_v1_129_hq-interface", quantity: 2 },
    { id: "simple_fracter", quantity: 3 },
    { id: "simple_decoder", quantity: 3 },
    { id: "simple_economy_event", quantity: 8 },
  ];
  return {
    runnerDeck: {
      id: `ai_hq_memory_runner_${idSuffix}`,
      name: "AI HQ Memory Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: runnerCards,
    },
    corpDeck: {
      id: `ai_hq_memory_corp_${idSuffix}`,
      name: "AI HQ Memory Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "simple_agenda", quantity: 6 },
        { id: "simple_barrier_ice", quantity: 4 },
        { id: "simple_code_gate_ice", quantity: 4 },
        { id: "simple_economy_operation", quantity: 8 },
      ],
    },
  };
}

function runnerProgramTrashChoiceInput(
  seed: string,
  options: {
    sourceDefinitionId: string;
    installedDefinitionIds: string[];
    memoryUsed: number;
    memoryLimit: number;
    mutateInstalledCard?: (
      state: GameState,
      cardId: CardInstanceId,
      definitionId: string,
      index: number,
    ) => void;
  },
): {
  input: AiDecisionInput;
  installedCardIds: CardInstanceId[];
  optionIdsByDefinition: Record<string, string>;
  optionIdsByCardId: Record<string, string>;
} {
  const runnerCardCounts = new Map<string, number>([
    ["simple_decoder", 3],
    ["simple_fracter", 3],
    ["simple_killer", 2],
    ["v099_virus_program", 3],
    ["simple_economy_event", 4],
  ]);
  const requiredCards = [
    options.sourceDefinitionId,
    ...options.installedDefinitionIds,
  ];
  for (const definitionId of requiredCards) {
    const requiredCount = requiredCards.filter(
      (id) => id === definitionId,
    ).length;
    runnerCardCounts.set(
      definitionId,
      Math.max(runnerCardCounts.get(definitionId) ?? 0, requiredCount),
    );
  }
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: {
        id: `runner_program_trash_choice_${seed}`,
        name: "Runner Program Trash Choice Fixture",
        side: "runner",
        identity: "runner_identity_001",
        cards: [...runnerCardCounts.entries()].map(([id, quantity]) => ({
          id,
          quantity,
        })),
      },
      corpDeck: {
        id: `runner_program_trash_choice_corp_${seed}`,
        name: "Runner Program Trash Choice Corp Fixture",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "simple_agenda", quantity: 3 },
          { id: "simple_barrier_ice", quantity: 2 },
          { id: "simple_economy_operation", quantity: 4 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  const sourceCardId = moveRunnerCardToGrip(state, options.sourceDefinitionId);
  const installedCardIds = options.installedDefinitionIds.map((definitionId) =>
    moveRunnerProgramToRig(state, definitionId),
  );
  installedCardIds.forEach((cardId, index) => {
    options.mutateInstalledCard?.(
      state,
      cardId,
      state.cardInstances[cardId]!.definitionId,
      index,
    );
  });
  state.runner.memoryUsed = options.memoryUsed;
  state.runner.memoryLimit = options.memoryLimit;
  state.pendingChoice = {
    choiceId: `runner_program_trash_before_install_${state.stateVersion}`,
    side: "runner",
    source: `runner_program_trash_before_install:${sourceCardId}:${state.stateVersion}`,
    prompt: "Programme vor Installation trashen",
    kind: "select_cards",
    options: installedCardIds.map((cardId) => {
      const definition =
        DEMO_CARDS_BY_ID[state.cardInstances[cardId]!.definitionId]!;
      return {
        id: `card_${cardId}`,
        label: definition.title,
        value: cardId,
      };
    }),
    minSelections: 0,
    maxSelections: installedCardIds.length,
    stateVersion: state.stateVersion,
    visibility: "hidden_info_barrier",
  };
  return {
    input: buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    }),
    installedCardIds,
    optionIdsByDefinition: Object.fromEntries(
      installedCardIds.map((cardId) => [
        state.cardInstances[cardId]!.definitionId,
        `card_${cardId}`,
      ]),
    ),
    optionIdsByCardId: Object.fromEntries(
      installedCardIds.map((cardId) => [cardId, `card_${cardId}`]),
    ),
  };
}

function runnerShellTradersState(seed: string): GameState {
  return toRunnerTurn(
    createGameAfterSetup({
      seed,
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: {
        id: `ai_shell_traders_runner_${seed}`,
        name: "AI Shell Traders Runner",
        side: "runner",
        identity: "runner_identity_001",
        cards: [
          { id: "onr_v1_176_the-shell-traders", quantity: 2 },
          { id: "simple_fracter", quantity: 2 },
          { id: "simple_setup_hardware", quantity: 1 },
          { id: "simple_economy_event", quantity: 8 },
        ],
      },
      corpDeck: {
        id: `ai_shell_traders_corp_${seed}`,
        name: "AI Shell Traders Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "simple_agenda", quantity: 4 },
          { id: "simple_economy_operation", quantity: 6 },
          { id: "simple_barrier_ice", quantity: 2 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
}

function runnerShellTradersInput(
  seed: string,
  mutate: (state: GameState) => void,
) {
  const state = runnerShellTradersState(seed);
  mutate(state);
  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.1-normal",
  });
}

function installedRunnerEconomyInput(
  seed: string,
  options: {
    brokerCounters?: number;
    newsgroupFilter?: boolean;
    siliconSaloon?: boolean;
    shortTermCounters?: number;
    credits: number;
  },
) {
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: {
        id: `installed_runner_economy_${seed}`,
        name: "Installed Runner Economy Fixture",
        side: "runner",
        identity: "runner_identity_001",
        cards: [
          { id: "onr_v1_154_broker", quantity: 1 },
          ...(options.newsgroupFilter
            ? [{ id: "onr_v1_045_newsgroup-filter", quantity: 1 }]
            : []),
          ...(options.siliconSaloon
            ? [{ id: "onr_v1_179_silicon-saloon-franchise", quantity: 1 }]
            : []),
          { id: "onr_v1_178_short-term-contract", quantity: 1 },
          { id: "simple_economy_event", quantity: 6 },
          { id: "simple_fracter", quantity: 2 },
        ],
      },
      corpDeck: {
        id: `installed_runner_economy_corp_${seed}`,
        name: "Installed Runner Economy Corp Fixture",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "simple_agenda", quantity: 3 },
          { id: "simple_economy_operation", quantity: 4 },
          { id: "simple_barrier_ice", quantity: 2 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  if (options.brokerCounters !== undefined) {
    const brokerId = moveRunnerResourceToRig(state, "onr_v1_154_broker");
    setHostedBitsForTest(state, brokerId, options.brokerCounters);
  }
  if (options.shortTermCounters !== undefined) {
    const shortTermId = moveRunnerResourceToRig(
      state,
      "onr_v1_178_short-term-contract",
    );
    setHostedBitsForTest(state, shortTermId, options.shortTermCounters);
  }
  if (options.newsgroupFilter === true)
    moveRunnerProgramToRig(state, "onr_v1_045_newsgroup-filter");
  if (options.siliconSaloon === true)
    moveRunnerResourceToRig(state, "onr_v1_179_silicon-saloon-franchise");
  state.runner.credits = options.credits;
  state.runner.clicks = 3;
  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.1-normal",
  });
}

function runnerJackOutInput(seed: string) {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeckId: "demo_runner_096",
      corpDeckId: "demo_corp_096",
      agendaPointsToWin: 7,
    }),
  );
  putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
  state.corp.credits = 8;
  state.runner.credits = 5;
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "rd",
  );
  state = apply(
    state,
    "corp",
    (action) =>
      action.type === "rez_ice" &&
      sourceDefinition(state, action) === "v096_trace_probe_ice",
  );
  state = apply(state, "runner", (action) => action.type === "continue_run");
  state = applyChoice(state, "corp", ["bid_0"]);
  state = applyChoice(state, "runner", ["bid_2"]);
  state = apply(state, "runner", (action) => action.type === "continue_run");
  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.1-normal",
  });
}

function withPublicServerEventTail(
  input: ReturnType<typeof buildAiDecisionInput>,
  servers: string[],
) {
  const eventTail: PublicGameEvent[] = servers.map((serverId, index) => ({
    eventId: `v140-visible-event-${index}`,
    type: serverId.startsWith("remote_")
      ? "install_remote_card"
      : "run_started",
    stateVersionBefore: index,
    stateVersionAfter: index + 1,
    stateHashAfter: `fnv1a:v140${index}`,
    visibilityClass: "public",
    publicPayload: { serverId },
  }));
  return { ...input, eventTail };
}

function progressionAction(
  side: Side,
  stateVersionBefore: number,
  actionType: LegalAction["type"],
  targetServerId: string | undefined,
  turnNumber: number,
  extra: Partial<AiSimulationSummary["actionSequence"][number]> = {},
): AiSimulationSummary["actionSequence"][number] {
  return {
    side,
    stateVersionBefore,
    actionType,
    eventType: actionType,
    timingPoint: "main",
    turnNumber,
    reasonCode: `${side}.fixture.${actionType}`,
    explanation: "progression metric fixture",
    confidence: 0.8,
    evidence: [],
    fallbackUsed: false,
    timeoutUsed: false,
    ...(targetServerId ? { targetServerId } : {}),
    qualityTags: [],
    stateHashAfter: `fnv1a:progression${stateVersionBefore}`,
    ...extra,
  };
}

function progressionSummary(
  actionSequence: AiSimulationSummary["actionSequence"],
  seed = "plan-conversion-fixture",
): AiSimulationSummary {
  return {
    seed,
    winner: "action_limit_reached",
    actions: actionSequence.length,
    turns: Math.max(1, ...actionSequence.map((entry) => entry.turnNumber ?? 1)),
    finalAgendaPoints: { runner: 0, corp: 0 },
    finalStateHash: `fnv1a:${seed}`,
    eventLogLength: actionSequence.length,
    replayOk: true,
    replayErrors: [],
    actionSequence,
    errors: [],
    cardPoolVersion: CURRENT_RULES_BASELINE.engineSchemaVersion,
    metrics: {
      illegalActions: 0,
      fallbackRate: 0,
      timeoutRate: 0,
      reasonCodeCoverage: [],
      actionTypeCoverage: [],
      roleCoverage: [],
      progressScore: 0,
      holdout: false,
      doctrine: {
        nakedAgendaInstalls: 0,
        agendaFloodExposure: 0,
        scoreWindowMissed: 0,
        remoteOverbuild: 0,
        economyStall: 0,
        repeatedLowValueCentralRun: 0,
        rigStall: 0,
        assetTrashNeglect: 0,
      },
    },
  };
}

function syntheticCentralAccessEvent(
  eventId: string,
  stateVersionBefore: number,
  serverId: "rd" | "hq" | "archives",
  cardDefinitionId: string,
): PublicGameEvent {
  const serverLabel =
    serverId === "rd" ? "R&D" : serverId === "hq" ? "HQ" : "Archives";
  return {
    eventId,
    type: "access_card",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverId,
      serverLabel,
      cardDefinitionId,
    },
  };
}

function syntheticCentralAccessEventByLabelOnly(
  eventId: string,
  stateVersionBefore: number,
  serverLabel: "R&D" | "HQ" | "Archives",
  cardDefinitionId: string,
): PublicGameEvent {
  return {
    eventId,
    type: "access_card",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverLabel,
      targets: { serverLabel },
      cardDefinitionId,
    },
  };
}

function syntheticDeclineTrashEvent(
  eventId: string,
  stateVersionBefore: number,
): PublicGameEvent {
  return {
    eventId,
    type: "decline_trash",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: "runner",
      actionType: "decline_trash",
    },
  };
}

function syntheticRemoteAccessEvent(
  eventId: string,
  stateVersionBefore: number,
  serverId: `remote_${number}`,
  cardDefinitionId: string,
  positionKey = "root:0",
): PublicGameEvent {
  return {
    eventId,
    type: "access_card",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverId,
      serverLabel: serverId,
      cardDefinitionId,
      accessedCardPositionKey: positionKey,
    },
  };
}

function syntheticExposeInstalledEvent(
  eventId: string,
  stateVersionBefore: number,
  serverId: `remote_${number}` | "hq" | "rd",
  positionKey: string,
  cardDefinitionId: string,
): PublicGameEvent {
  const [area, index] = positionKey.split(":");
  return {
    eventId,
    type: "trigger_ability",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "trigger_ability",
      hiddenZoneAction: "approach_ice_expose",
      publicRevealKind: "expose",
      revealKind: "expose",
      exposedServerId: serverId,
      exposedPositionKey: positionKey,
      ...(area ? { exposedArea: area } : {}),
      ...(index !== undefined ? { exposedIndex: Number(index) } : {}),
      exposedCardDefinitionId: cardDefinitionId,
      cardDefinitionId,
    },
  };
}

function syntheticRunStartedEvent(
  eventId: string,
  stateVersionBefore: number,
  serverId: "rd" | "hq" | "archives" | "remote_1",
): PublicGameEvent {
  return {
    eventId,
    type: "run_started",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: "runner",
      actionType: "start_run",
      serverId,
    },
  };
}

function syntheticPlanActionEvent(
  eventId: string,
  stateVersionBefore: number,
  side: Side,
  actionType: LegalAction["type"],
  serverId?: string,
  extra: Record<string, unknown> = {},
): PublicGameEvent {
  return {
    eventId,
    type: actionType,
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: side,
      actionType,
      ...(serverId ? { serverId } : {}),
      ...extra,
    },
  };
}

function syntheticHqMemoryEvent(
  eventId: string,
  stateVersionBefore: number,
  actor: Side,
  actionType: string,
  cardDefinitionId?: string,
): PublicGameEvent {
  return {
    eventId,
    type: actionType,
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor,
      actionType,
      serverId: "hq",
      serverLabel: "HQ",
      ...(cardDefinitionId ? { cardDefinitionId } : {}),
    },
  };
}

function syntheticHqPrivateLookEvent(
  eventId: string,
  stateVersionBefore: number,
  knownHqDefinitionIds: string[],
): PublicGameEvent {
  return {
    eventId,
    type: "resolve_choice",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "resolve_choice",
      hiddenZoneAction: "p3_33_private_look",
      privateLookZone: "hq",
      privateLookCount: knownHqDefinitionIds.length,
      knownHqDefinitionIds,
    },
  };
}

function syntheticRndPrivateLookEvent(
  eventId: string,
  stateVersionBefore: number,
  knownRndDefinitionIds: string[],
): PublicGameEvent {
  return {
    eventId,
    type: "resolve_choice",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "resolve_choice",
      hiddenZoneAction: "p3_33_private_look",
      privateLookZone: "rd",
      privateLookCount: knownRndDefinitionIds.length,
      knownRndDefinitionIds,
      knownRndTopDefinitionId: knownRndDefinitionIds[0],
      knownRndCardCount: knownRndDefinitionIds.length,
    },
  };
}

function strategicLineKindFromDebug(
  debug: AiDecisionDebug | undefined,
): string | undefined {
  return debug?.evidence
    ?.find((entry) => entry.startsWith("strategic_line_kind:"))
    ?.slice("strategic_line_kind:".length);
}

function strategicRunnerInput(
  seed: string,
  options: { knownHqAgenda?: boolean; runnerAgendaPoints?: number } = {},
): AiDecisionInput {
  const state = toRunnerTurn(createGameAfterSetup({ seed }));
  state.runner.credits = 5;
  const input = withDeckStrategyProfileForTest(
    buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
      decisionId: `${seed}:strategic-runner:0`,
      actionNumber: 4,
    }),
    "runner",
    ["runner.rnd_pressure", "runner.hq_pressure"],
  );
  return {
    ...input,
    playerView: {
      ...input.playerView,
      own: {
        ...input.playerView.own,
        agendaPoints:
          options.runnerAgendaPoints ?? input.playerView.own.agendaPoints,
      },
    },
    eventTail: options.knownHqAgenda
      ? [
          ...input.eventTail,
          syntheticHqPrivateLookEvent(`${seed}:known-hq-agenda`, 100, [
            "simple_agenda",
          ]),
        ]
      : input.eventTail,
  };
}

function strategicCorpInput(
  seed: string,
  mutate: (state: GameState) => void,
): AiDecisionInput {
  let state = createGameAfterSetup({ seed });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  mutate(state);
  return withDeckStrategyProfileForTest(
    buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.2-normal",
      decisionId: `${seed}:strategic-corp:0`,
      actionNumber: 4,
    }),
    "corp",
    ["corp.remote_scoring", "corp.central_stabilize"],
  );
}

function corpEffectiveRemoteSafetyInput(
  seed: string,
  options: {
    runnerCredits: number;
    includeTaxUpgrade?: boolean;
    includeAgendaStealTaxUpgrade?: boolean;
    installedAgendaCounters?: number;
    agendaInHq?: boolean;
    assetInHq?: boolean;
    hiddenRunnerCard?: string;
    safeSecondRemote?: boolean;
    protectionIceInHq?: boolean;
  },
): AiDecisionInput {
  let state = createGameAfterSetup({
    seed,
    runnerDeck: {
      id: `corp_effective_remote_safety_runner_${seed}`,
      name: "Corp Effective Remote Safety Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_037_japanese-water-torture", quantity: 1 },
        { id: "simple_fracter", quantity: 2 },
        { id: "simple_economy_event", quantity: 6 },
      ],
    },
    corpDeck: {
      id: `corp_effective_remote_safety_corp_${seed}`,
      name: "Corp Effective Remote Safety Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "simple_agenda", quantity: 4 },
        { id: "simple_economy_asset", quantity: 2 },
        { id: "simple_economy_operation", quantity: 4 },
        { id: "onr_v1_237_data-wall", quantity: 2 },
        { id: "simple_code_gate_ice", quantity: 2 },
        { id: "simple_barrier_ice", quantity: 2 },
        { id: "onr_v1_355_crystal-palace-station-grid", quantity: 1 },
        { id: "onr_v1_366_red-herrings", quantity: 1 },
      ],
    },
    agendaPointsToWin: 7,
  });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  ensureRemoteServer(state, "remote_1");
  const dataWallId = putCorpIceOnServer(
    state,
    "remote_1",
    "onr_v1_237_data-wall",
  );
  state.cardInstances[dataWallId] = {
    ...state.cardInstances[dataWallId]!,
    faceup: true,
    rezzed: true,
  };
  if (options.includeTaxUpgrade) {
    const taxId = putCorpRootInRemote(
      state,
      "onr_v1_355_crystal-palace-station-grid",
      0,
    );
    state.cardInstances[taxId] = {
      ...state.cardInstances[taxId]!,
      faceup: true,
      rezzed: true,
    };
  }
  if (options.includeAgendaStealTaxUpgrade) {
    const taxId = putCorpRootInRemote(state, "onr_v1_366_red-herrings", 0);
    state.cardInstances[taxId] = {
      ...state.cardInstances[taxId]!,
      faceup: true,
      rezzed: true,
    };
  }
  if (options.safeSecondRemote) {
    ensureRemoteServer(state, "remote_2");
    const secondRemoteIceId = putCorpIceOnServer(
      state,
      "remote_2",
      "simple_code_gate_ice",
    );
    state.cardInstances[secondRemoteIceId] = {
      ...state.cardInstances[secondRemoteIceId]!,
      faceup: true,
      rezzed: true,
    };
  }
  if (options.installedAgendaCounters !== undefined) {
    const agendaId = putCorpRootInRemote(
      state,
      "simple_agenda",
      options.installedAgendaCounters,
    );
    state.cardInstances[agendaId] = {
      ...state.cardInstances[agendaId]!,
      faceup: false,
      rezzed: false,
    };
  } else if (options.agendaInHq !== false) {
    moveCorpCardToHq(state, "simple_agenda");
  }
  if (options.assetInHq) moveCorpCardToHq(state, "simple_economy_asset");
  if (options.protectionIceInHq)
    moveCorpCardToHq(state, "simple_code_gate_ice");
  moveRunnerProgramToRig(state, "onr_v1_037_japanese-water-torture");
  if (options.hiddenRunnerCard) {
    moveRunnerCardToGrip(state, options.hiddenRunnerCard);
  }
  state.runner.credits = options.runnerCredits;
  state.corp.credits = 10;
  state.corp.clicks = 3;
  return withDeckStrategyProfileForTest(
    buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.2-normal",
      decisionId: `${seed}:corp-effective-remote-safety`,
      actionNumber: 6,
    }),
    "corp",
    ["corp.remote_scoring", "corp.ice_tax_glacier"],
  );
}

function runCorpAiOnlySmoke(
  seed: string,
  maxActions: number,
): { actions: number; errors: string[] } {
  let state = createGameAfterSetup({ seed });
  const errors: string[] = [];
  for (let step = 0; step < maxActions && !state.winner; step += 1) {
    const side = state.activeSide;
    const input = buildAiDecisionInput(state, side, {
      difficulty: "normal",
      actionNumber: step,
      decisionId: `${seed}:${step}:${side}`,
      profileId:
        side === "corp" ? "corp-ai-v1.4.0-normal" : "runner-ai-v0.9-normal",
    });
    const decision =
      side === "corp" ? chooseCorpAction(input) : chooseRunnerAction(input);
    const action = input.legalActions.find(
      (candidate) => candidate.actionId === decision.actionId,
    );
    if (!action) {
      errors.push(`missing legal action ${side} ${step}`);
      break;
    }
    const result = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices
        ? { selectedChoices: decision.selectedChoices }
        : {}),
      idempotencyKey: `${seed}-${step}-${action.actionId}`,
    });
    if (!result.ok) {
      errors.push(`${result.error.code}:${result.error.message}`);
      break;
    }
    state = result.state;
  }
  return { actions: state.stateVersion, errors };
}

function runRunnerAiSmoke(
  seed: string,
  maxActions: number,
  corpMode: "baseline" | "planned",
): { actions: number; errors: string[]; runnerPlanDecisions: number } {
  let state = createGameAfterSetup({ seed });
  const errors: string[] = [];
  let runnerPlanDecisions = 0;
  for (let step = 0; step < maxActions && !state.winner; step += 1) {
    const side = state.activeSide;
    const input = buildAiDecisionInput(state, side, {
      difficulty: "normal",
      actionNumber: step,
      decisionId: `${seed}:${step}:${side}`,
      profileId:
        side === "runner" ? "runner-ai-v1.4.1-normal" : "corp-ai-v1.4.0-normal",
    });
    const decision =
      side === "runner"
        ? chooseRunnerAction(input)
        : corpMode === "baseline"
          ? chooseCorpBaselineAction(input)
          : chooseCorpAction(input);
    if (decision.reasonCode.startsWith("runner.plan."))
      runnerPlanDecisions += 1;
    const action = input.legalActions.find(
      (candidate) => candidate.actionId === decision.actionId,
    );
    if (!action) {
      errors.push(`missing legal action ${side} ${step}`);
      break;
    }
    const result = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices
        ? { selectedChoices: decision.selectedChoices }
        : {}),
      idempotencyKey: `${seed}-${step}-${action.actionId}`,
    });
    if (!result.ok) {
      errors.push(`${result.error.code}:${result.error.message}`);
      break;
    }
    state = result.state;
  }
  return { actions: state.stateVersion, errors, runnerPlanDecisions };
}

function krashFilterEncounterState(seed: string): GameState {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: batchARunnerDeck(),
      corpDeck: {
        id: "ai_krash_filter_corp",
        name: "AI Krash Filter Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "onr_v1_244_filter", quantity: 1 },
          { id: "simple_economy_operation", quantity: 4 },
          { id: "simple_agenda", quantity: 3 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 5;
  state.corp.credits = 5;
  moveRunnerCardToGrip(state, "onr_v1_039_krash");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === "onr_v1_039_krash",
  );
  putCorpIceOnServer(state, "rd", "onr_v1_244_filter");
  putCorpCardOnTopOfRd(state, "simple_economy_operation");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "rd",
  );
  return apply(
    state,
    "corp",
    (action) =>
      action.type === "rez_ice" &&
      sourceDefinition(state, action) === "onr_v1_244_filter",
  );
}

function krashKeeperHqEncounterState(seed: string): GameState {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: batchARunnerDeck(),
      corpDeck: {
        id: "ai_krash_keeper_corp",
        name: "AI Krash Keeper Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "onr_v1_252_keeper", quantity: 1 },
          { id: "simple_economy_operation", quantity: 4 },
          { id: "simple_agenda", quantity: 3 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 2;
  state.corp.credits = 5;
  moveRunnerCardToGrip(state, "onr_v1_039_krash");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === "onr_v1_039_krash",
  );
  putCorpIceOnServer(state, "hq", "onr_v1_252_keeper");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "hq",
  );
  return apply(
    state,
    "corp",
    (action) =>
      action.type === "rez_ice" &&
      sourceDefinition(state, action) === "onr_v1_252_keeper",
  );
}

function codecrackerDoubleEndlessCorridorInput(
  seed: string,
  runnerCredits: number,
): ReturnType<typeof buildAiDecisionInput> {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: ONR_V1_1_2K_RUNNER_DECK,
      corpDeck: {
        id: "ai_codecracker_double_endless_corp",
        name: "AI Codecracker Double Endless Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "onr_v1_239_endless-corridor", quantity: 2 },
          { id: "simple_economy_operation", quantity: 4 },
          { id: "simple_agenda", quantity: 3 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 10;
  state.corp.credits = 10;
  moveRunnerCardToGrip(state, "onr_v1_014_codecracker");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === "onr_v1_014_codecracker",
  );
  const innerIceId = putCorpIceOnServer(
    state,
    "rd",
    "onr_v1_239_endless-corridor",
  );
  const outerIceId = putUnusedCorpIceOnServer(
    state,
    "rd",
    "onr_v1_239_endless-corridor",
    new Set([innerIceId]),
  );
  for (const iceId of [innerIceId, outerIceId]) {
    state.cardInstances[iceId] = {
      ...state.cardInstances[iceId]!,
      faceup: true,
      rezzed: true,
    };
  }
  state.runner.credits = runnerCredits;
  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.1-normal",
  });
}

function krashDoubleDataWall2Input(
  seed: string,
  runnerCredits: number,
): ReturnType<typeof buildAiDecisionInput> {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: ONR_V1_2_3_RUNNER_DECK,
      corpDeck: {
        id: "ai_krash_double_data_wall_2_corp",
        name: "AI Krash Double Data Wall 2.0 Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "onr_v1_238_data-wall-2-0", quantity: 2 },
          { id: "simple_economy_operation", quantity: 4 },
          { id: "simple_agenda", quantity: 3 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 10;
  state.corp.credits = 10;
  moveRunnerCardToGrip(state, "onr_v1_039_krash");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === "onr_v1_039_krash",
  );
  const innerIceId = putCorpIceOnServer(
    state,
    "rd",
    "onr_v1_238_data-wall-2-0",
  );
  const outerIceId = putUnusedCorpIceOnServer(
    state,
    "rd",
    "onr_v1_238_data-wall-2-0",
    new Set([innerIceId]),
  );
  for (const iceId of [innerIceId, outerIceId]) {
    state.cardInstances[iceId] = {
      ...state.cardInstances[iceId]!,
      faceup: true,
      rezzed: true,
    };
  }
  state.runner.credits = runnerCredits;
  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.1-normal",
  });
}

function krashDataWallBbsRemoteInput(
  seed: string,
  runnerCredits: number,
  bbsKnown: boolean,
): ReturnType<typeof buildAiDecisionInput> {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: ONR_V1_2_3_RUNNER_DECK,
      corpDeck: {
        ...ONR_V1_2_3_CORP_DECK,
        cards: [
          ...ONR_V1_2_3_CORP_DECK.cards,
          { id: "onr_v1_309_bbs-whispering-campaign", quantity: 1 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 10;
  state.corp.credits = 10;
  moveRunnerCardToGrip(state, "onr_v1_039_krash");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === "onr_v1_039_krash",
  );
  ensureRemoteServer(state, "remote_1");
  const dataWallId = putCorpIceOnServer(
    state,
    "remote_1",
    "onr_v1_237_data-wall",
  );
  state.cardInstances[dataWallId] = {
    ...state.cardInstances[dataWallId]!,
    faceup: true,
    rezzed: true,
  };
  const bbsId = putCorpRootInRemote(
    state,
    "onr_v1_309_bbs-whispering-campaign",
    0,
  );
  state.cardInstances[bbsId] = {
    ...state.cardInstances[bbsId]!,
    faceup: bbsKnown,
    rezzed: bbsKnown,
  };
  state.runner.credits = runnerCredits;
  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.1-normal",
  });
}

function dwarfRemoteEncounterState(
  seed: string,
  options: {
    runnerCredits: number;
    iceDefinitionId: string;
    rootDefinitionId: string;
    scoredSuperiorNetBarriers: boolean;
  },
): GameState {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: ONR_V1_2_3_RUNNER_DECK,
      corpDeck: {
        id: "ai_dwarf_remote_encounter_corp",
        name: "AI Dwarf Remote Encounter Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "onr_v1_219_superior-net-barriers", quantity: 1 },
          { id: "onr_v1_220_tycho-extension", quantity: 2 },
          { id: "onr_v1_203_hostile-takeover", quantity: 3 },
          { id: "onr_v1_262_razor-wire", quantity: 1 },
          { id: "onr_v1_265_rock-is-strong", quantity: 1 },
          { id: "onr_v1_309_bbs-whispering-campaign", quantity: 1 },
          { id: "simple_economy_operation", quantity: 6 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 20;
  state.corp.credits = 20;
  moveRunnerProgramToRig(state, "onr_v1_021_dwarf");
  if (options.scoredSuperiorNetBarriers)
    putCorpCardInScoreArea(state, "onr_v1_219_superior-net-barriers");
  ensureRemoteServer(state, "remote_1");
  putCorpIceOnServer(state, "remote_1", options.iceDefinitionId);
  const rootId = putCorpRootInServer(
    state,
    "remote_1",
    options.rootDefinitionId,
    0,
  );
  const rootType = DEMO_CARDS_BY_ID[options.rootDefinitionId]?.type;
  state.cardInstances[rootId] = {
    ...state.cardInstances[rootId]!,
    faceup: true,
    rezzed: rootType !== "agenda",
  };
  state.runner.credits = options.runnerCredits;

  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "remote_1",
  );
  state = apply(
    state,
    "corp",
    (action) =>
      action.type === "rez_ice" &&
      sourceDefinition(state, action) === options.iceDefinitionId,
  );
  return state;
}

function dwarfDoubleFireWallHqEncounterState(
  seed: string,
  options: {
    runnerCredits: number;
    scoredSuperiorNetBarriers: number;
  },
): GameState {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: ONR_V1_2_3_RUNNER_DECK,
      corpDeck: {
        id: "ai_dwarf_hq_firewall_corp",
        name: "AI Dwarf HQ Fire Wall Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "onr_v1_219_superior-net-barriers", quantity: 2 },
          { id: "onr_v1_245_fire-wall", quantity: 2 },
          { id: "onr_v1_203_hostile-takeover", quantity: 3 },
          { id: "simple_economy_operation", quantity: 6 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 20;
  state.runner.clicks = 1;
  state.corp.credits = 20;
  moveRunnerProgramToRig(state, "onr_v1_021_dwarf");
  for (let index = 0; index < options.scoredSuperiorNetBarriers; index += 1) {
    const agendaId = Object.entries(state.cardInstances)
      .filter(
        ([, card]) => card.definitionId === "onr_v1_219_superior-net-barriers",
      )
      .map(([id]) => id as CardInstanceId)
      .filter((id) => !state.corp.scoreArea.includes(id))
      .sort()[0];
    expect(agendaId).toBeDefined();
    if (!agendaId) throw new Error("Missing Superior Net Barriers copy");
    removeEverywhere(state, agendaId);
    state.corp.scoreArea.push(agendaId);
    state.cardInstances[agendaId] = {
      ...state.cardInstances[agendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
  }
  const innerFireWallId = putCorpIceOnServer(
    state,
    "hq",
    "onr_v1_245_fire-wall",
  );
  state.cardInstances[innerFireWallId] = {
    ...state.cardInstances[innerFireWallId]!,
    faceup: true,
    rezzed: true,
  };
  const outerFireWallId = putUnusedCorpIceOnServer(
    state,
    "hq",
    "onr_v1_245_fire-wall",
    new Set([innerFireWallId]),
  );
  state.runner.credits = options.runnerCredits;
  return startAndRezOuterIce(state, "hq", outerFireWallId);
}

function knownRemoteDataWallBbsInput(
  seed: string,
  options: {
    runnerCredits: number;
    installWallBreaker: boolean;
    rezzedIce: boolean;
    knownRoot: boolean;
    wallBreakerInGrip?: boolean;
  },
): ReturnType<typeof buildAiDecisionInput> {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: {
        id: "ai_runner_known_remote_data_wall_bbs",
        name: "AI Runner Known Remote Data Wall BBS",
        side: "runner",
        identity: "runner_identity_001",
        cards: [
          { id: "onr_v1_037_japanese-water-torture", quantity: 3 },
          { id: "simple_economy_event", quantity: 8 },
        ],
      },
      corpDeck: {
        id: "ai_corp_known_remote_data_wall_bbs",
        name: "AI Corp Known Remote Data Wall BBS",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "onr_v1_237_data-wall", quantity: 2 },
          { id: "onr_v1_309_bbs-whispering-campaign", quantity: 1 },
          { id: "simple_agenda", quantity: 4 },
          { id: "simple_economy_operation", quantity: 8 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = options.runnerCredits;
  state.corp.credits = 10;
  if (options.installWallBreaker) {
    moveRunnerProgramToRig(state, "onr_v1_037_japanese-water-torture");
  } else if (options.wallBreakerInGrip) {
    moveRunnerCardToGrip(state, "onr_v1_037_japanese-water-torture");
  }
  moveRunnerCardToGrip(state, "simple_economy_event");
  ensureRemoteServer(state, "remote_1");
  const dataWallId = putCorpIceOnServer(
    state,
    "remote_1",
    "onr_v1_237_data-wall",
  );
  state.cardInstances[dataWallId] = {
    ...state.cardInstances[dataWallId]!,
    faceup: true,
    rezzed: options.rezzedIce,
  };
  const bbsId = putCorpRootInRemote(
    state,
    "onr_v1_309_bbs-whispering-campaign",
    0,
  );
  state.cardInstances[bbsId] = {
    ...state.cardInstances[bbsId]!,
    faceup: options.knownRoot,
    rezzed: options.knownRoot,
  };
  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.1-normal",
  });
}

function knownRemoteRootMemoryInput(
  seed: string,
  remoteRootDefinitionId: string,
  runnerCredits: number,
): ReturnType<typeof buildAiDecisionInput> {
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: ONR_V1_2_3_RUNNER_DECK,
      corpDeck: {
        ...ONR_V1_2_3_CORP_DECK,
        cards: [
          ...ONR_V1_2_3_CORP_DECK.cards,
          { id: remoteRootDefinitionId, quantity: 1 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = runnerCredits;
  state.corp.credits = 10;
  ensureRemoteServer(state, "remote_1");
  const rootId = putCorpRootInRemote(state, remoteRootDefinitionId, 0);
  state.cardInstances[rootId] = {
    ...state.cardInstances[rootId]!,
    faceup: false,
    rezzed: false,
  };
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.1-normal",
  });
  const memoryEventStart = input.playerView.stateVersion + 1;
  return {
    ...input,
    eventTail: [
      ...input.eventTail,
      syntheticPlanActionEvent(
        `${seed}-known-remote-start`,
        memoryEventStart,
        "runner",
        "start_run",
        "remote_1",
      ),
      syntheticPlanActionEvent(
        `${seed}-known-remote-access`,
        memoryEventStart + 1,
        "runner",
        "access_card",
        "remote_1",
        {
          cardDefinitionId: remoteRootDefinitionId,
          accessedCardPositionKey: "root:0",
        },
      ),
    ],
  };
}

function fakedHitSelfDamageInput(
  seed: string,
  options: {
    badPublicityBefore: number;
    extraHandCards: 0 | 1 | 2;
  },
): ReturnType<typeof buildAiDecisionInput> {
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: {
        id: `${seed}_runner`,
        name: "AI Faked Hit Guard Runner",
        side: "runner",
        identity: "runner_identity_001",
        cards: [
          { id: "onr_proteus_108_faked-hit", quantity: 1 },
          { id: "simple_economy_event", quantity: 4 },
          { id: "simple_run_event", quantity: 4 },
          { id: "simple_fracter", quantity: 2 },
        ],
      },
      corpDeck: {
        id: `${seed}_corp`,
        name: "AI Faked Hit Guard Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "simple_agenda", quantity: 6 },
          { id: "simple_barrier_ice", quantity: 4 },
          { id: "simple_economy_operation", quantity: 8 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  emptyRunnerGripForTest(state);
  moveRunnerCardToGrip(state, "onr_proteus_108_faked-hit");
  if (options.extraHandCards >= 1) {
    moveRunnerCardToGrip(state, "simple_economy_event");
  }
  if (options.extraHandCards >= 2) {
    moveRunnerCardToGrip(state, "simple_run_event");
  }
  state.runner.credits = 10;
  state.runner.clicks = 4;
  state.corp.badPublicity = options.badPublicityBefore;

  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.2-normal",
    decisionId: `${seed}:faked-hit-guard`,
    actionNumber: 1,
  });
}

function blinkRiskRunInput(
  seed: string,
  options: {
    handCards: number;
    knownLowValueRdTop?: boolean;
    stableBreaker?: boolean;
  },
): ReturnType<typeof buildAiDecisionInput> {
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      ...blinkRiskDeckConfig(seed),
      agendaPointsToWin: 7,
    }),
  );
  emptyRunnerGripForTest(state);
  moveRunnerProgramToRig(state, "onr_v1_007_blink");
  if (options.stableBreaker) moveRunnerProgramToRig(state, "efficient_fracter");
  addRunnerGripCardsForBlinkRisk(state, options.handCards);
  state.runner.credits = 8;
  state.runner.clicks = 4;
  state.corp.credits = 8;
  const iceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
  state.cardInstances[iceId] = {
    ...state.cardInstances[iceId]!,
    faceup: true,
    rezzed: true,
  };
  if (options.knownLowValueRdTop) {
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
  }

  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.2-normal",
    decisionId: `${seed}:blink-risk-run`,
    actionNumber: 1,
    eventTail: options.knownLowValueRdTop
      ? [
          syntheticRndPrivateLookEvent(
            `${seed}:known-low-rd-top`,
            state.stateVersion + 1,
            ["simple_economy_operation"],
          ),
        ]
      : [],
  });
}

function blinkRiskRemoteScoreThreatInput(
  seed: string,
  options: {
    handCards: number;
    recentBlinkFailure?: boolean;
  },
): ReturnType<typeof buildAiDecisionInput> {
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      ...blinkRiskDeckConfig(seed),
      agendaPointsToWin: 7,
    }),
  );
  emptyRunnerGripForTest(state);
  moveRunnerProgramToRig(state, "onr_v1_007_blink");
  addRunnerGripCardsForBlinkRisk(state, options.handCards);
  state.runner.credits = 8;
  state.runner.clicks = 4;
  state.corp.credits = 8;
  putCorpRootInRemote(state, "simple_agenda", 2);
  const iceId = putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
  state.cardInstances[iceId] = {
    ...state.cardInstances[iceId]!,
    faceup: true,
    rezzed: true,
  };
  const eventTail: PublicGameEvent[] = options.recentBlinkFailure
    ? [
        syntheticBlinkPublicEvent(`${seed}:run-start`, 1, "run_started", {
          actionType: "start_run",
          actor: "runner",
          serverId: "remote_1",
        }),
        syntheticBlinkPublicEvent(`${seed}:blink-fail`, 2, "break_subroutine", {
          actionType: "break_subroutine",
          actor: "runner",
          blinkBreakSuccess: false,
          blinkDamageAmount: 3,
        }),
      ]
    : [];

  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.2-normal",
    decisionId: `${seed}:blink-risk-remote-score-threat`,
    actionNumber: 1,
    eventTail,
  });
}

function blinkRiskEncounterInput(
  seed: string,
  options: {
    handCards: number;
    stableBreaker?: boolean;
  },
): ReturnType<typeof buildAiDecisionInput> {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      ...blinkRiskDeckConfig(seed),
      agendaPointsToWin: 7,
    }),
  );
  emptyRunnerGripForTest(state);
  moveRunnerProgramToRig(state, "onr_v1_007_blink");
  if (options.stableBreaker) moveRunnerProgramToRig(state, "efficient_fracter");
  addRunnerGripCardsForBlinkRisk(state, options.handCards);
  state.runner.credits = 8;
  state.runner.clicks = 4;
  state.corp.credits = 8;
  putCorpIceOnServer(state, "rd", "simple_barrier_ice");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "rd",
  );
  state = apply(
    state,
    "corp",
    (action) =>
      action.type === "rez_ice" &&
      sourceDefinition(state, action) === "simple_barrier_ice",
  );

  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.2-normal",
    decisionId: `${seed}:blink-risk-encounter`,
    actionNumber: 2,
  });
}

function syntheticBlinkPublicEvent(
  eventId: string,
  stateVersionAfter: number,
  type: string,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type,
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload,
  };
}

function blinkRiskDeckConfig(seed: string): CreateGameConfig {
  return {
    runnerDeck: {
      id: `${seed}_blink_runner`,
      name: "AI Blink Risk Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_007_blink", quantity: 1 },
        { id: "efficient_fracter", quantity: 1 },
        { id: "simple_economy_event", quantity: 8 },
        { id: "simple_run_event", quantity: 8 },
      ],
    },
    corpDeck: {
      id: `${seed}_blink_corp`,
      name: "AI Blink Risk Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "simple_agenda", quantity: 6 },
        { id: "simple_barrier_ice", quantity: 4 },
        { id: "simple_economy_operation", quantity: 8 },
      ],
    },
  };
}

function addRunnerGripCardsForBlinkRisk(state: GameState, count: number): void {
  const moved: CardInstanceId[] = [];
  const sequence = ["simple_economy_event", "simple_run_event"] as const;
  for (let index = 0; index < count; index += 1) {
    const definitionId = sequence[index % sequence.length] ?? sequence[0];
    moved.push(moveRunnerCardCopyToGrip(state, definitionId, moved));
  }
}

function blinkRunAction(
  input: ReturnType<typeof buildAiDecisionInput>,
  serverId: string,
): LegalAction | undefined {
  return input.legalActions.find(
    (action) =>
      action.type === "start_run" && action.payload?.serverId === serverId,
  );
}

function blinkBreakAction(
  input: ReturnType<typeof buildAiDecisionInput>,
): LegalAction | undefined {
  return input.legalActions.find(
    (action) =>
      action.type === "break_subroutine" &&
      sourceDefinitionFromInput(input, action) === "onr_v1_007_blink",
  );
}

function fakedHitAction(
  input: ReturnType<typeof buildAiDecisionInput>,
): LegalAction | undefined {
  return input.legalActions.find(
    (action) =>
      action.type === "play_event" &&
      sourceDefinitionFromInput(input, action) === "onr_proteus_108_faked-hit",
  );
}

function scopedLegalActions(
  input: ReturnType<typeof buildAiDecisionInput>,
  legalActions: LegalAction[],
): ReturnType<typeof buildAiDecisionInput> {
  return {
    ...input,
    legalActions,
    playerView: {
      ...input.playerView,
      legalActions,
    },
  };
}

function weakFracterBarrierEncounterState(seed: string): GameState {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: {
        id: "ai_weak_fracter_runner",
        name: "AI Weak Fracter Runner",
        side: "runner",
        identity: "runner_identity_001",
        cards: [
          { id: "efficient_fracter", quantity: 1 },
          { id: "simple_economy_event", quantity: 8 },
        ],
      },
      corpDeck: {
        id: "ai_taxing_barrier_corp",
        name: "AI Taxing Barrier Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "simple_taxing_barrier_ice", quantity: 1 },
          { id: "simple_economy_operation", quantity: 4 },
          { id: "simple_agenda", quantity: 3 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 10;
  state.corp.credits = 10;
  moveRunnerCardToGrip(state, "efficient_fracter");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === "efficient_fracter",
  );
  putCorpIceOnServer(state, "rd", "simple_taxing_barrier_ice");
  putCorpCardOnTopOfRd(state, "simple_economy_operation");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "rd",
  );
  return apply(
    state,
    "corp",
    (action) =>
      action.type === "rez_ice" &&
      sourceDefinition(state, action) === "simple_taxing_barrier_ice",
  );
}

function kingOfTheRoadRunnerTurn(seed: string): GameState {
  return toRunnerTurn(
    createGameAfterSetup({
      seed,
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: kingOfTheRoadRunnerDeck(),
      corpDeck: deckDefinitionFromSnapshot("demo_corp_008_snapshot_v0_8"),
      agendaPointsToWin: 7,
    }),
  );
}

function kingOfTheRoadRunnerDeck(): DeckDefinition {
  return deckDefinitionFromSnapshot("king_of_the_road_runner_ai_snapshot_v1");
}

function batchARunnerTurn(seed: string): GameState {
  return toRunnerTurn(
    createGameAfterSetup({
      seed,
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: batchARunnerDeck(),
      corpDeck: deckDefinitionFromSnapshot("demo_corp_008_snapshot_v0_8"),
      agendaPointsToWin: 7,
    }),
  );
}

function batchARunnerDeck(): DeckDefinition {
  return {
    id: "ai_batch_a_runner_rig_low_risk",
    name: "AI Batch A Runner Rig Low Risk",
    side: "runner",
    identity: "runner_identity_001",
    cards: [
      { id: "onr_v1_014_codecracker", quantity: 2 },
      { id: "onr_v1_015_codeslinger", quantity: 2 },
      { id: "onr_v1_021_dwarf", quantity: 2 },
      { id: "onr_v1_039_krash", quantity: 2 },
      { id: "onr_v1_066_snowball", quantity: 2 },
      { id: "onr_v1_074_worm", quantity: 2 },
      { id: "onr_v1_144_tycho-mem-chip", quantity: 1 },
      { id: "onr_v1_146_zetatech-mem-chip", quantity: 1 },
      { id: "simple_economy_event", quantity: 4 },
    ],
  };
}

function deckDefinitionFromSnapshot(snapshotId: string): DeckDefinition {
  const snapshot = snapshotById(snapshotId);
  return {
    id: snapshot.deckSnapshotId,
    name: snapshot.name,
    side: snapshot.side,
    identity: snapshot.identityCardId,
    cards: snapshot.cards.map((entry) => ({
      id: entry.cardId,
      quantity: entry.quantity,
    })),
  };
}

function kingOfTheRoadSnapshot() {
  return snapshotById("king_of_the_road_runner_ai_snapshot_v1");
}

function defaultTestSnapshotIdForSide(side: Side): string {
  return side === "runner"
    ? "demo_runner_008_snapshot_v0_8"
    : "demo_corp_008_snapshot_v0_8";
}

function snapshotById(snapshotId: string) {
  const snapshots = snapshotsData08.snapshots as Array<{
    deckSnapshotId: string;
    name: string;
    side: Side;
    identityCardId: string;
    cards: Array<{ cardId: string; quantity: number }>;
    publicMetadata: {
      side: Side;
      identityCardId: string;
      deckName: string;
      cardPoolSnapshotId: string;
      formatProfileId: string;
      deckHash: string;
    };
  }>;
  const snapshot = snapshots.find(
    (candidate) => candidate.deckSnapshotId === snapshotId,
  );
  expect(snapshot, snapshotId).toBeDefined();
  if (!snapshot) throw new Error(`Missing snapshot ${snapshotId}`);
  return snapshot;
}

function apply(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): GameState {
  const selected = mustAction(state, side, predicate);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}`,
  });
  expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function continueRunAction(state: GameState): GameState {
  return apply(state, "runner", (action) => action.type === "continue_run");
}

function enterEncounterFromMovementWindow(state: GameState): GameState {
  let next = state;
  for (let i = 0; i < 3; i += 1) {
    if (
      next.timingPoint !== "run.jack_out_window" ||
      next.run?.phase !== "movement"
    ) {
      return next;
    }
    const continueAction = getLegalActions(next, "runner").find(
      (action) => action.type === "continue_run",
    );
    if (!continueAction) return next;
    next = apply(
      next,
      "runner",
      (action) => action.actionId === continueAction.actionId,
    );
  }
  return next;
}

function installRunnerCard(state: GameState, definitionId: string): GameState {
  return apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === definitionId,
  );
}

function startAndRezOuterIce(
  state: GameState,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  iceId: CardInstanceId,
): GameState {
  let next = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === serverId,
  );
  next = apply(
    next,
    "corp",
    (action) => action.type === "rez_ice" && action.source === iceId,
  );
  return next.run?.phase === "encounter_ice"
    ? next
    : enterEncounterFromMovementWindow(next);
}

function rezIceAndEnterIfNeeded(
  state: GameState,
  iceId: CardInstanceId,
): GameState {
  const next = apply(
    state,
    "corp",
    (action) => action.type === "rez_ice" && action.source === iceId,
  );
  return next.run?.phase === "encounter_ice"
    ? next
    : enterEncounterFromMovementWindow(next);
}

function runDurationIceEncounterState(
  seed: string,
  runnerCards: string[],
  corpCards: string[],
): GameState {
  const extraRunnerCards = runnerCards.map((id) => ({ id, quantity: 1 }));
  const extraCorpCards = corpCards.map((id) => ({ id, quantity: 1 }));
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        id: `${seed}_runner`,
        name: `${seed} Runner`,
        cards: [
          ...extraRunnerCards,
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
        ],
      },
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        id: `${seed}_corp`,
        name: `${seed} Corp`,
        cards: [
          ...extraCorpCards,
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 20;
  state.runner.clicks = 4;
  state.runner.memoryLimit = 6;
  state.corp.credits = 20;
  return state;
}

function mustAction(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): LegalAction {
  const legalActions = getLegalActions(state, side);
  const selected = legalActions.find(predicate);
  expect(
    selected,
    `Legal: ${legalActions.map((action) => `${action.type}:${action.label}`).join(", ")}`,
  ).toBeDefined();
  if (!selected) throw new Error("Missing legal action");
  return selected;
}

function toRunnerTurn(state: GameState): GameState {
  let next = apply(state, "corp", (action) => action.type === "mandatory_draw");
  next = apply(next, "corp", (action) => action.type === "end_turn");
  if (
    next.pendingChoice?.source === "discard_phase" &&
    next.pendingChoice.side === "corp"
  ) {
    next = applyChoice(next, "corp", [
      String(next.pendingChoice.options[0]?.id),
    ]);
  }
  return next;
}

function applyChoice(
  state: GameState,
  side: Side,
  selectedOptionIds: string[],
): GameState {
  const selected = mustAction(
    state,
    side,
    (action) => action.type === "resolve_choice",
  );
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: {
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds,
    },
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}-${selectedOptionIds.join(".")}`,
  });
  expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function ensureRemoteServer(
  state: GameState,
  serverId: `remote_${number}`,
): void {
  if (state.corp.servers.some((server) => server.id === serverId)) return;
  const number = serverId.replace("remote_", "");
  state.corp.servers.push({
    id: serverId,
    kind: "remote",
    label: `Remote ${number}`,
    ice: [],
    root: [],
  });
}

function putCorpCardOnTopOfRd(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.rd.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "rd" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function putCorpIceOnServer(
  state: GameState,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  expect(server).toBeDefined();
  if (!server) throw new Error("Missing server");
  removeEverywhere(state, id);
  server.ice.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function addCorpIceToServerForTest(
  state: GameState,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  definitionId: string,
): CardInstanceId {
  const id =
    `test_corp_ice_${serverId}_${definitionId}_${Object.keys(state.cardInstances).length}` as CardInstanceId;
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  expect(server).toBeDefined();
  if (!server) throw new Error("Missing server");
  server.ice.push(id);
  state.cardInstances[id] = {
    instanceId: id,
    definitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return id;
}

function putUnusedCorpIceOnServer(
  state: GameState,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  definitionId: string,
  excludedIds: Set<CardInstanceId> = new Set(),
): CardInstanceId {
  const usedServerCards = new Set(
    state.corp.servers.flatMap((server) => [...server.ice, ...server.root]),
  );
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId &&
      !usedServerCards.has(id) &&
      !excludedIds.has(id),
  );
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing unused ${definitionId}`);
  const id = entry[0];
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  expect(server).toBeDefined();
  if (!server) throw new Error("Missing server");
  removeEverywhere(state, id);
  server.ice.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function moveRunnerCardToGrip(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.grip.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function moveRunnerCardCopyToGrip(
  state: GameState,
  definitionId: string,
  excludeIds: CardInstanceId[],
): CardInstanceId {
  const excluded = new Set(excludeIds);
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) => card.definitionId === definitionId && !excluded.has(id),
  );
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing ${definitionId} copy`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.runner.grip.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function moveRunnerProgramToRig(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.rig.programs.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function moveRunnerProgramCopyToRig(
  state: GameState,
  definitionId: string,
  excludeIds: CardInstanceId[],
): CardInstanceId {
  const excluded = new Set(excludeIds);
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) => card.definitionId === definitionId && !excluded.has(id),
  );
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing ${definitionId} copy`);
  const id = entry[0] as CardInstanceId;
  removeEverywhere(state, id);
  state.runner.rig.programs.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function moveRunnerHardwareToRig(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.rig.hardware.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function addRunnerHardwareToRigForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id =
    `test_runner_hardware_${definitionId}_${Object.keys(state.cardInstances).length}` as CardInstanceId;
  state.runner.rig.hardware.unshift(id);
  state.cardInstances[id] = {
    instanceId: id,
    definitionId,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return id;
}

function moveRunnerResourceToRig(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.rig.resources.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function scoreRunnerAgendaForTest(
  state: GameState,
  definitionId: string,
  copyIndex: number,
): CardInstanceId {
  const ids = Object.entries(state.cardInstances)
    .filter(([, card]) => card.definitionId === definitionId)
    .map(([id]) => id as CardInstanceId)
    .filter((id) => !state.runner.scoreArea.includes(id))
    .sort();
  const id = ids[copyIndex] ?? ids[0];
  expect(id).toBeDefined();
  if (!id) throw new Error(`Missing agenda ${definitionId}`);
  removeEverywhere(state, id);
  state.runner.scoreArea.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "scoreArea" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function moveRunnerResourceCopyToRig(
  state: GameState,
  definitionId: string,
  copyIndex: number,
): CardInstanceId {
  const ids = Object.entries(state.cardInstances)
    .filter(([, card]) => card.definitionId === definitionId)
    .map(([id]) => id)
    .filter((id) => !state.runner.rig.resources.includes(id))
    .sort();
  const id = ids[copyIndex] ?? ids[0];
  expect(id).toBeDefined();
  if (!id) throw new Error(`Missing ${definitionId} copy ${copyIndex}`);
  removeEverywhere(state, id);
  state.runner.rig.resources.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function setHostedBitsForTest(
  state: GameState,
  id: CardInstanceId,
  amount: number,
): void {
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    counters: {
      ...(state.cardInstances[id]?.counters ?? {}),
      bit: amount,
    },
  };
}

function setShellCountersForTest(
  state: GameState,
  id: CardInstanceId,
  amount: number,
): void {
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    counters: {
      ...(state.cardInstances[id]?.counters ?? {}),
      shell: amount,
    },
  };
}

function moveCorpCardToHq(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.hq.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function addCorpCardToHqForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id =
    `test_corp_hq_${definitionId}_${Object.keys(state.cardInstances).length}` as CardInstanceId;
  state.corp.hq.unshift(id);
  state.cardInstances[id] = {
    instanceId: id,
    definitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return id;
}

function moveUnusedCorpCardToHq(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const serverCardIds = new Set(
    state.corp.servers.flatMap((server) => [...server.ice, ...server.root]),
  );
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId && !serverCardIds.has(id),
  );
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing unused ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.corp.hq.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function putCorpCardInScoreArea(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.scoreArea.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "scoreArea" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function putAgendaFloodInCorpHq(state: GameState): void {
  moveCorpCardToHq(state, "simple_agenda");
}

function withSyntheticCorpAgendaPressure(
  input: ReturnType<typeof buildAiDecisionInput>,
): ReturnType<typeof buildAiDecisionInput> {
  const existingSynthetic = input.playerView.own.gripOrHq.some(
    (card) => card.instanceId === "synthetic_corp_agenda_pressure_a",
  );
  if (existingSynthetic) return input;
  return {
    ...input,
    playerView: {
      ...input.playerView,
      own: {
        ...input.playerView.own,
        gripOrHq: [
          ...input.playerView.own.gripOrHq,
          visibleCard("simple_agenda", "synthetic_corp_agenda_pressure_a"),
          visibleCard("simple_agenda", "synthetic_corp_agenda_pressure_b"),
        ],
      },
    },
  };
}

function moveCorpHqAgendasToRd(state: GameState): void {
  const cardsById = createRuntimeCardsById();
  for (const id of state.corp.hq.slice()) {
    const card = state.cardInstances[id];
    if (!card || cardsById[card.definitionId]?.type !== "agenda") continue;
    state.corp.hq = state.corp.hq.filter((candidate) => candidate !== id);
    state.corp.rd.push(id);
    state.cardInstances[id] = {
      ...card,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
}

const representativeVisibleRunPairs = [
  {
    role: "barrier-wall with fracter",
    breakerId: "onr_v1_021_dwarf",
    iceId: "onr_v1_279_wall-of-static",
    expectedCost: 1,
    expectedEndingStrength: 3,
  },
  {
    role: "code gate with decoder",
    breakerId: "onr_v1_014_codecracker",
    iceId: "onr_v1_261_quandary",
    expectedCost: 2,
    expectedEndingStrength: 2,
  },
  {
    role: "sentry with killer",
    breakerId: "onr_v1_023_evil-twin",
    iceId: "onr_v1_259_in-the-face",
    expectedCost: 3,
    expectedEndingStrength: 3,
  },
] as const;

function isRuntimeBreakerCard(card: CatalogCard): boolean {
  return (
    card.side === "runner" &&
    card.type === "program" &&
    card.subtypes.some((subtype) => subtypeKeyForTest(subtype) === "icebreaker")
  );
}

function runtimeVisibleIce(card: CatalogCard | undefined): {
  definitionId: string;
  known: true;
  rezzed: true;
  subtypes: string[];
  strength?: number;
} {
  expect(card).toBeDefined();
  if (!card) throw new Error("Missing runtime ICE card");
  return {
    definitionId: card.catalogCardId,
    known: true,
    rezzed: true,
    subtypes: card.subtypes,
    ...(card.numeric.strength !== null
      ? { strength: card.numeric.strength }
      : {}),
  };
}

function runtimeVisibleBreaker(card: CatalogCard | undefined): VisibleCard {
  expect(card).toBeDefined();
  if (!card) throw new Error("Missing runtime breaker card");
  return {
    instanceId: `${card.catalogCardId}:visible`,
    definitionId: card.catalogCardId,
    known: true,
    type: "program",
    subtypes: card.subtypes,
    strength:
      card.numeric.strength ?? cardDefinitionStrength(card.catalogCardId),
  };
}

function subtypeKeyForTest(subtype: string): string {
  return subtype
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function visibleCard(definitionId: string, instanceId: string): VisibleCard {
  return { instanceId, definitionId, known: true, title: definitionId };
}

function discardDecisionInputForTest(
  side: Side,
  config: {
    credits: number;
    cards: string[];
    discardCount?: number;
    strategyIds?: string[];
    rig?: string[];
  },
): AiDecisionInput {
  const state =
    side === "runner"
      ? toRunnerTurn(createGameAfterSetup({ seed: `ai-discard-${side}` }))
      : createGameAfterSetup({ seed: `ai-discard-${side}` });
  const base = buildAiDecisionInput(state, side, {
    difficulty: "normal",
    profileId: `${side}-ai-v1.4.2-normal`,
  });
  const hand = config.cards.map((definitionId, index) =>
    discardVisibleCardForTest(definitionId, `discard_${definitionId}_${index}`),
  );
  const rig = config.rig?.map((definitionId, index) =>
    discardVisibleCardForTest(definitionId, `rig_${definitionId}_${index}`),
  );
  const discardCount = config.discardCount ?? 1;
  const choice: ChoiceRequest = {
    choiceId: `discard_${side}_test`,
    side,
    source: "discard_phase",
    prompt: side === "corp" ? "Korp-Discard wählen" : "Runner-Discard wählen",
    kind: "select_cards",
    options: hand.map((card) => ({
      id: `card_${card.instanceId}`,
      label: card.title ?? card.definitionId ?? card.instanceId,
      publicLabel: "Handkarte",
      value: card.instanceId,
    })),
    minSelections: discardCount,
    maxSelections: discardCount,
    stateVersion: base.playerView.stateVersion,
    visibility: "hidden_info_barrier",
  };
  const resolveChoice: LegalAction = {
    actionId: `${side}.resolve_choice.discard_test`,
    side,
    type: "resolve_choice",
    label: "Discard wählen",
    source: "game_rule",
    timingPoint: base.playerView.timingPoint,
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: base.playerView.stateVersion + 1,
  };
  const semanticBase = base as AiDecisionInputWithDeckCapabilities;
  const strategyId = config.strategyIds?.[0];
  const semanticStrategyExtras =
    strategyId && semanticBase.ownStrategicIntentState
      ? {
          ownDeckStrategyProfile: {
            ...semanticBase.ownDeckStrategyProfile!,
            primaryStrategies: config.strategyIds ?? [strategyId],
            secondaryStrategies: [],
            warnings: [],
          },
          ownStrategicIntentState: {
            ...semanticBase.ownStrategicIntentState,
            primaryStrategy: {
              ...semanticBase.ownStrategicIntentState.primaryStrategy,
              strategyId,
              family: strategyFamilyForDiscardTest(strategyId),
              confidence: "high" as const,
              completeness: "partial" as const,
              score: { anchor: 70, support: 55, final: 70 },
              evidence: [`test_strategy:${strategyId}`],
            },
            phase: "enable" as const,
            targetVector: {
              kind: strategyTargetKindForDiscardTest(strategyId),
              ...(strategyId === "runner.hq_pressure"
                ? { targetId: "hq" }
                : {}),
              ...(strategyId === "runner.rnd_pressure"
                ? { targetId: "rd" }
                : {}),
              evidence: [`test_strategy_target:${strategyId}`],
            },
          },
        }
      : {};
  return {
    ...base,
    ...semanticStrategyExtras,
    playerView: {
      ...base.playerView,
      phase: side === "corp" ? "corp_discard_phase" : "runner_discard_phase",
      own: {
        ...base.playerView.own,
        credits: config.credits,
        gripOrHq: hand,
        ...(rig ? { rig } : {}),
      },
      pendingChoice: choice,
    },
    legalActions: [resolveChoice],
  };
}

function strategyFamilyForDiscardTest(
  strategyId: string,
): NonNullable<
  AiDecisionInputWithDeckCapabilities["ownStrategicIntentState"]
>["primaryStrategy"]["family"] {
  if (
    strategyId.startsWith("runner.rig") ||
    strategyId.includes("search.breaker")
  ) {
    return "runner_setup";
  }
  if (
    strategyId === "runner.hq_pressure" ||
    strategyId === "runner.rnd_pressure"
  ) {
    return "runner_central_pressure";
  }
  if (strategyId === "runner.remote_contest") return "runner_remote_contest";
  if (strategyId === "corp.ice_tax_glacier") return "corp_ice_tax";
  if (
    strategyId === "corp.remote_scoring" ||
    strategyId === "corp.rush_score" ||
    strategyId === "corp.fast_advance"
  ) {
    return "corp_scoreline";
  }
  if (strategyId === "corp.asset_economy") return "corp_asset_economy";
  return "neutral";
}

function strategyTargetKindForDiscardTest(
  strategyId: string,
): NonNullable<
  AiDecisionInputWithDeckCapabilities["ownStrategicIntentState"]
>["targetVector"]["kind"] {
  if (
    strategyId === "runner.hq_pressure" ||
    strategyId === "runner.rnd_pressure"
  ) {
    return "central";
  }
  if (strategyId === "runner.remote_contest") return "remote";
  if (
    strategyId === "corp.remote_scoring" ||
    strategyId === "corp.rush_score" ||
    strategyId === "corp.fast_advance"
  ) {
    return "scoreline";
  }
  if (strategyId === "corp.asset_economy") return "economy";
  return "coverage";
}

function discardVisibleCardForTest(
  definitionId: string,
  instanceId: string,
): VisibleCard {
  const definition = DEMO_CARDS_BY_ID[definitionId];
  expect(definition, definitionId).toBeDefined();
  if (!definition) throw new Error(`Missing ${definitionId}`);
  return {
    instanceId,
    definitionId,
    known: true,
    title: definition.title,
    type: definition.type,
    subtypes: definition.subtypes,
    ...(definition.cost !== undefined ? { cost: definition.cost } : {}),
    ...(definition.installCost !== undefined
      ? { installCost: definition.installCost }
      : {}),
    ...(definition.rezCost !== undefined
      ? { rezCost: definition.rezCost }
      : {}),
    ...(definition.memoryCost !== undefined
      ? { memoryCost: definition.memoryCost }
      : {}),
  };
}

function keepOnlyCorpHqCard(state: GameState, id: CardInstanceId): void {
  for (const cardId of state.corp.hq.filter((candidate) => candidate !== id)) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
  state.corp.hq = [id];
}

function setCorpHqCardsForTest(
  state: GameState,
  definitionIds: string[],
): CardInstanceId[] {
  const ids = definitionIds.map((definitionId) =>
    moveCorpCardToHq(state, definitionId),
  );
  for (const cardId of state.corp.hq.filter(
    (candidate) => !ids.includes(candidate),
  )) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
  state.corp.hq = ids;
  return ids;
}

function putRunnerCardOnTopOfStack(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.stack.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "stack" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function sourceDefinition(
  state: GameState,
  action: LegalAction,
): string | undefined {
  if (
    typeof action.source !== "string" ||
    action.source === "basic_action" ||
    action.source === "game_rule"
  )
    return undefined;
  return state.cardInstances[action.source]?.definitionId;
}

function sourceDefinitionFromInput(
  input: ReturnType<typeof buildAiDecisionInput>,
  action: LegalAction,
): string | undefined {
  if (
    typeof action.source !== "string" ||
    action.source === "basic_action" ||
    action.source === "game_rule"
  )
    return undefined;
  const visible = [
    input.playerView.own.gripOrHq,
    input.playerView.own.heapOrArchives,
    input.playerView.own.scoreArea,
    input.playerView.own.rig ?? [],
    ...input.playerView.servers.flatMap((server) => [server.ice, server.root]),
  ]
    .flat()
    .find((card) => card.instanceId === action.source && card.known);
  return visible?.definitionId;
}

function withDeckStrategyProfileForTest<T extends AiDecisionInput>(
  input: T,
  side: Side,
  strategyIds: readonly string[],
): T & AiDecisionInputWithDeckCapabilities {
  return {
    ...input,
    ownDeckStrategyProfile: deckStrategyProfileForTest(
      side,
      `${input.decisionId}:deck-strategy`,
      strategyIds,
    ),
  };
}

function runnerStrategyProfileForTest(
  deckSnapshotId: string,
  strategyHints: string[],
  planWeights: Record<string, number>,
): NonNullable<AiDecisionInputWithDeckCapabilities["ownDeckStrategyProfile"]> {
  return deckStrategyProfileForTest(
    "runner",
    deckSnapshotId,
    strategyIdsForRunnerTest(strategyHints, planWeights),
  );
}

function corpStrategyProfileForTest(
  deckSnapshotId: string,
  strategyHints: string[],
  planWeights: Record<string, number>,
): NonNullable<AiDecisionInputWithDeckCapabilities["ownDeckStrategyProfile"]> {
  return deckStrategyProfileForTest(
    "corp",
    deckSnapshotId,
    strategyIdsForCorpTest(strategyHints, planWeights),
  );
}

function deckStrategyProfileForTest(
  side: Side,
  deckId: string,
  strategyIds: readonly string[],
): NonNullable<AiDecisionInputWithDeckCapabilities["ownDeckStrategyProfile"]> {
  const primaryStrategies = [...new Set(strategyIds)].filter((strategyId) =>
    strategyId.startsWith(`${side}.`),
  );
  const strategyScores = Object.fromEntries(
    primaryStrategies.map((strategyId) => [
      strategyId,
      {
        anchorScore: 100,
        supportScore: 100,
        finalScore: 100,
        anchorEvidence: [
          {
            source: "derivedStrategyAnchor" as const,
            cardId: `${strategyId}:test-card`,
            quantity: 1,
            strategyId,
            reason: "test_strategy_profile",
          },
        ],
        supportEvidence: [],
        supportGaps: [],
        confidence: "high" as const,
        runtimeStatus: "productive" as const,
      },
    ]),
  );
  const functionSignalCounts =
    side === "corp"
      ? {
          "remote.scoring_protection": 4,
          "remote.agenda_steal_tax": 2,
          "score.advance_burst": 3,
          "score.agenda_action": 3,
          "tax.ice": 3,
          "tax.remote": 2,
          "ice.etr": 4,
          "ice.future_pressure": 2,
          "tag.source": 2,
          "trace.source": 2,
          "tag.payoff": 2,
        }
      : {
          "access.rnd_multiaccess": 3,
          "access.hq_multiaccess": 2,
          "pressure.remote": 3,
          "setup.search": 2,
          "economy.generic": 4,
        };
  return {
    schemaVersion: "ai-deck-strategy-profile-v1",
    taskId: "AI006",
    deckId,
    side,
    cardCount: Math.max(1, primaryStrategies.length),
    strategyScores,
    primaryStrategies,
    secondaryStrategies: [],
    functionSignalCounts,
    legacySignalCounts: {},
    warnings: [],
    source: {
      mode: "ai_internal_strategy_profile",
      strategyGoals: "data/ai/strategy-goals-v1.json",
      compiledHints: "data/ai/ai-card-hints-compiled.json",
      inspectorIndex: "data/ai/ai-hint-inspector-index.json",
      plannerEffect: "strategic_intent_input",
    },
  };
}

function strategyIdsForRunnerTest(
  strategyHints: readonly string[],
  planWeights: Record<string, number>,
): string[] {
  const ids = new Set<string>();
  for (const key of Object.keys(planWeights)) {
    for (const strategyId of runnerStrategyIdsForLegacyPlanTest(key)) {
      ids.add(strategyId);
    }
  }
  for (const hint of strategyHints) {
    for (const strategyId of runnerStrategyIdsForLegacyHintTest(hint)) {
      ids.add(strategyId);
    }
  }
  if (ids.size === 0) ids.add("runner.rig_first");
  return [...ids];
}

function runnerStrategyIdsForLegacyPlanTest(key: string): string[] {
  switch (key) {
    case "pressure_rnd":
      return ["runner.rnd_pressure", "runner.interface_closeout"];
    case "pressure_hq":
      return ["runner.hq_pressure"];
    case "contest_remote":
      return ["runner.remote_contest"];
    case "trash_asset":
      return ["runner.remote_trash"];
    case "build_rig":
      return ["runner.rig_first", "runner.search.breaker"];
    case "draw_for_answers":
      return ["runner.search.breaker"];
    case "recover_economy":
      return ["runner.economy_first"];
    case "safe_probe_run":
      return ["runner.run_event_tempo"];
    default:
      return [];
  }
}

function runnerStrategyIdsForLegacyHintTest(hint: string): string[] {
  switch (hint) {
    case "rnd_pressure":
      return ["runner.rnd_pressure"];
    case "remote_contest":
      return ["runner.remote_contest"];
    case "central_pressure":
      return ["runner.rnd_pressure", "runner.hq_pressure"];
    case "rig_builder":
      return ["runner.rig_first", "runner.search.breaker"];
    case "balanced":
      return ["runner.rig_first", "runner.economy_first"];
    default:
      return hint.startsWith("runner.") ? [hint] : [];
  }
}

function strategyIdsForCorpTest(
  strategyHints: readonly string[],
  planWeights: Record<string, number>,
): string[] {
  const ids = new Set<string>();
  for (const key of Object.keys(planWeights)) {
    for (const strategyId of corpStrategyIdsForLegacyPlanTest(key)) {
      ids.add(strategyId);
    }
  }
  for (const hint of strategyHints) {
    for (const strategyId of corpStrategyIdsForLegacyHintTest(hint)) {
      ids.add(strategyId);
    }
  }
  if (ids.size === 0) ids.add("corp.remote_scoring");
  return [...ids];
}

function corpStrategyIdsForLegacyPlanTest(key: string): string[] {
  switch (key) {
    case "score_now":
    case "score_next_turn":
      return ["corp.remote_scoring", "corp.rush_score", "corp.fast_advance"];
    case "build_scoring_remote":
      return ["corp.remote_scoring"];
    case "protect_hq":
    case "protect_rnd":
      return ["corp.central_stabilize", "corp.ice_tax_glacier"];
    case "create_tag_window":
      return ["corp.tag_trace_punish"];
    case "recover_economy":
      return ["corp.asset_economy", "corp.economy_rez_reserve"];
    case "bait_runner":
      return ["corp.ambush_bluff"];
    default:
      return [];
  }
}

function corpStrategyIdsForLegacyHintTest(hint: string): string[] {
  switch (hint) {
    case "rush":
      return ["corp.rush_score", "corp.fast_advance"];
    case "glacier":
      return ["corp.remote_scoring", "corp.ice_tax_glacier"];
    case "score_remote":
      return ["corp.remote_scoring"];
    case "tag_pressure":
      return ["corp.tag_trace_punish"];
    case "balanced":
      return ["corp.remote_scoring", "corp.central_stabilize"];
    default:
      return hint.startsWith("corp.") ? [hint] : [];
  }
}

function choiceRequest(state: GameState, side: Side): ChoiceRequest {
  return {
    choiceId: `choice_v093_${side}`,
    side,
    source: "ai_v093_choice",
    prompt: "AI private choice",
    kind: "select_option",
    options: [{ id: "keep", label: "Keep option" }],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion,
    visibility: "private_to_side",
  };
}

function putCorpRootInRemote(
  state: GameState,
  definitionId: string,
  advancementCounters: number,
): CardInstanceId {
  const id = findCard(state, definitionId);
  let server = state.corp.servers.find(
    (candidate) => candidate.id === "remote_1",
  );
  if (!server) {
    server = {
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    };
    state.corp.servers.push(server);
  }
  removeEverywhere(state, id);
  server.root.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    faceup: false,
    rezzed: false,
    advancementCounters,
  };
  return id;
}

function putCorpRootInServer(
  state: GameState,
  serverId: `remote_${number}`,
  definitionId: string,
  advancementCounters: number,
  options: { faceup?: boolean; rezzed?: boolean } = {},
): CardInstanceId {
  ensureRemoteServer(state, serverId);
  const id = findCard(state, definitionId);
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  expect(server).toBeDefined();
  if (!server) throw new Error("Missing server");
  removeEverywhere(state, id);
  server.root.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverRoot", serverId },
    faceup: options.faceup ?? false,
    rezzed: options.rezzed ?? false,
    advancementCounters,
  };
  return id;
}

function addCorpRootToServerForTest(
  state: GameState,
  serverId: `remote_${number}`,
  definitionId: string,
  advancementCounters: number,
): CardInstanceId {
  ensureRemoteServer(state, serverId);
  const id =
    `test_corp_root_${definitionId}_${Object.keys(state.cardInstances).length}` as CardInstanceId;
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  expect(server).toBeDefined();
  if (!server) throw new Error(`Missing ${serverId}`);
  server.root.push(id);
  state.cardInstances[id] = {
    instanceId: id,
    definitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverRoot", serverId },
    faceup: false,
    rezzed: false,
    advancementCounters,
    strengthModifier: 0,
  };
  return id;
}

function moveCorpCardToArchives(
  state: GameState,
  definitionId: string,
  faceup: boolean,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.archives.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "archives" },
    faceup,
    rezzed: faceup,
  };
  return id;
}

function keepOnlyCorpArchivesCards(
  state: GameState,
  ids: CardInstanceId[],
): void {
  const keep = new Set(ids);
  const movedToRd = state.corp.archives.filter((cardId) => !keep.has(cardId));
  state.corp.archives = ids.slice();
  for (const cardId of movedToRd) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
}

function findCard(state: GameState, definitionId: string): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([, card]) => card.definitionId === definitionId,
  );
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing ${definitionId}`);
  return entry[0];
}

function removeEverywhere(state: GameState, id: string): void {
  state.corp.hq = state.corp.hq.filter((cardId) => cardId !== id);
  state.corp.rd = state.corp.rd.filter((cardId) => cardId !== id);
  state.corp.archives = state.corp.archives.filter((cardId) => cardId !== id);
  state.corp.scoreArea = state.corp.scoreArea.filter((cardId) => cardId !== id);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((cardId) => cardId !== id);
    server.root = server.root.filter((cardId) => cardId !== id);
  }
  state.runner.grip = state.runner.grip.filter((cardId) => cardId !== id);
  state.runner.stack = state.runner.stack.filter((cardId) => cardId !== id);
  state.runner.heap = state.runner.heap.filter((cardId) => cardId !== id);
  state.runner.scoreArea = state.runner.scoreArea.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.programs = state.runner.rig.programs.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.hardware = state.runner.rig.hardware.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.resources = state.runner.rig.resources.filter(
    (cardId) => cardId !== id,
  );
  if (state.specialZones) {
    state.specialZones.setAside = state.specialZones.setAside.filter(
      (cardId) => cardId !== id,
    );
    state.specialZones.removedFromGame =
      state.specialZones.removedFromGame.filter((cardId) => cardId !== id);
  }
}
