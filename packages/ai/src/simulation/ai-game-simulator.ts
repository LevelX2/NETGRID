import {
  applyAction,
  applyRandomizedIceInstallSelection,
  createGame,
  getPlayerView,
  hashState,
  quoteCorpPunishRoute,
  quoteRandomizedIceInstallSelection,
  replayEvents,
} from "@netgrid/engine";
import {
  CURRENT_RULES_BASELINE,
  DEMO_DECKS,
  ORIGINALSET_DEFAULT_DECKS,
  type AiDecision,
  type AiDecisionInput,
  type GameState,
  type LegalAction,
  type Side,
} from "@netgrid/shared";

import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import {
  buildAiDecisionInput,
  selectAiDecisionSideForState,
} from "../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { assessDecisionOpportunity } from "../runtime/decision-opportunity";
import { resetRunnerRunPlanMemory } from "../runtime/runner-run-plan-memory";
import { fnv1a } from "../runtime/stable-hash";
import { resetStrategicIntentMemory } from "../strategic-intent-memory";
import { sortedUniqueProgressionCardTargetTypes } from "../runtime/progression-card-target";
import { advancementCountersAddedForSimulationAction } from "../runtime/simulation-action-event";
import {
  advancedAgendaStealSourceForAction,
  cardTargetTypeForInstance,
} from "../runtime/simulation-card-target";
import {
  targetCardIdsForSimulationAction,
  targetServerIdForSimulationAction,
} from "../runtime/simulation-action-target";
import type { AiSimulationConfig } from "./ai-simulation-config";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { actionCapacityDiagnosticsForSimulationDecision } from "./action-capacity-simulation-diagnostics";
import { validateSimulationDeckSupport } from "./deck-support";
import {
  finalAdvanceAssessmentForSimulationAction,
  isProtectBeforeAdvanceSimulationAction,
} from "./final-advance-assessment";
import { isHoldoutSeed } from "./holdout-seed";
import {
  safeEvidenceForSimulationDecision,
  selfplayTraceFactsForSimulationDecision,
} from "./selfplay-trace-facts-adapter";
import { simulationSafeSelectedActionId } from "./selected-action-id";
import { assertAiInputIsSideSafe } from "./side-safe-input";
import { deckSnapshotForSimulation } from "./simulation-config-helpers";
import { createSimulationRng, type SimulationRng } from "./simulation-rng";
import {
  classifiedSimulationRuntimeFailure,
  classifySimulationRuntimeFailure,
  simulationRuntimeFailureToken,
  type AiSimulationRuntimeFailure,
} from "./ai-simulation-runtime-failure";
import { metricsFor } from "./simulation-quality-adapters";
import { SOAK_SEEDS } from "./soak-seed-data";

type ActionSequenceEntryDiagnostics = Partial<
  AiSimulationSummary["actionSequence"][number]
>;

export type AiGameSimulatorDependencies = {
  chooseDecisionForSimulation: (
    side: Side,
    input: AiDecisionInput,
    config: AiSimulationConfig,
    simulationRng: SimulationRng,
  ) => AiDecision;
  simulationSideUsesSemanticRuntime: (
    side: Side,
    config: AiSimulationConfig,
  ) => boolean;
  runnerHandUseDiagnosticsForSimulationAction: (
    input: AiDecisionInput,
    decision: AiDecision,
    action: LegalAction,
    targetServerId: string | undefined,
  ) => ActionSequenceEntryDiagnostics;
  runnerReserveDiagnosticsForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string | undefined,
    stateAfterAction: GameState,
  ) => ActionSequenceEntryDiagnostics;
  runnerCentralPressureDiagnosticsForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string | undefined,
  ) => ActionSequenceEntryDiagnostics;
  runnerBreakerCoverageDiagnosticsForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string | undefined,
  ) => ActionSequenceEntryDiagnostics;
  runnerEconomySetupDiagnosticsForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string | undefined,
    stateAfterAction: GameState,
  ) => ActionSequenceEntryDiagnostics;
  tagPunishWindowDiagnosticsForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
    decision: AiDecision,
    stateBeforeAction: GameState,
    stateAfterAction: GameState,
  ) => ActionSequenceEntryDiagnostics;
  corpFutureRunIceDiagnosticsForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => ActionSequenceEntryDiagnostics;
  qualityTagsForAction: (
    input: AiDecisionInput,
    action: LegalAction,
    decision: AiDecision,
  ) => string[];
};

export function createAiGameSimulator(
  dependencies: AiGameSimulatorDependencies,
): {
  simulateAiGame: (config?: AiSimulationConfig) => AiSimulationSummary;
} {
  const {
    chooseDecisionForSimulation,
    simulationSideUsesSemanticRuntime,
    runnerHandUseDiagnosticsForSimulationAction,
    runnerReserveDiagnosticsForSimulationAction,
    runnerCentralPressureDiagnosticsForSimulationAction,
    runnerBreakerCoverageDiagnosticsForSimulationAction,
    runnerEconomySetupDiagnosticsForSimulationAction,
    tagPunishWindowDiagnosticsForSimulationAction,
    corpFutureRunIceDiagnosticsForSimulationAction,
    qualityTagsForAction,
  } = dependencies;

  function simulateAiGame(
    config: AiSimulationConfig = {},
  ): AiSimulationSummary {
    resetResidentPlanPortfolioMemory();
    resetRunnerRunPlanMemory();
    resetStrategicIntentMemory();
    const deckSupportErrors = validateSimulationDeckSupport(config);
    if (deckSupportErrors.length > 0) {
      const runtimeFailures = deckSupportErrors.map(() =>
        classifiedSimulationRuntimeFailure({
          code: "simulation_deck_support_invalid",
          owner: "rules_contract",
          side: "runner",
          stateVersion: 0,
          timingPoint: "game.setup",
        }),
      );
      return {
        seed: config.seed ?? "ai-vs-ai-smoke",
        terminationKind: "runtime_failure",
        winner: "runtime_failure",
        actions: 0,
        turns: 0,
        finalAgendaPoints: { runner: 0, corp: 0 },
        finalStateHash: "fnv1a:00000000",
        eventLogLength: 0,
        replayOk: false,
        replayErrors: [],
        actionSequence: [],
        errors: runtimeFailures.map(simulationRuntimeFailureToken),
        runtimeFailures,
        cardPoolVersion: CURRENT_RULES_BASELINE.engineSchemaVersion,
        metrics: metricsFor(
          [],
          deckSupportErrors,
          false,
          isHoldoutSeed(
            config.seed ?? "ai-vs-ai-smoke",
            SOAK_SEEDS.holdoutSeeds,
          ),
        ),
      };
    }

    const seed = config.seed ?? "ai-vs-ai-smoke";
    const simulationRng = createSimulationRng(
      config.simulationRngSeed ?? `${seed}:sim-rng`,
    );
    const runnerDeckDefinition =
      config.runnerDeck ??
      (config.runnerDeckId
        ? DEMO_DECKS[config.runnerDeckId]
        : ORIGINALSET_DEFAULT_DECKS.runner);
    const corpDeckDefinition =
      config.corpDeck ??
      (config.corpDeckId
        ? DEMO_DECKS[config.corpDeckId]
        : ORIGINALSET_DEFAULT_DECKS.corp);
    const simulationScopeId = simulationDecisionScopeId({
      seed,
      ...(config.matchId ? { matchId: config.matchId } : {}),
      runnerDeckId: runnerDeckDefinition.id,
      corpDeckId: corpDeckDefinition.id,
    });
    let state = createGame({
      matchId: config.matchId ?? simulationScopeId,
      seed,
      agendaPointsToWin: config.agendaPointsToWin ?? 7,
      ...(config.runnerDeckId ? { runnerDeckId: config.runnerDeckId } : {}),
      ...(config.corpDeckId ? { corpDeckId: config.corpDeckId } : {}),
      ...(config.runnerDeck ? { runnerDeck: config.runnerDeck } : {}),
      ...(config.corpDeck ? { corpDeck: config.corpDeck } : {}),
      ...(config.runnerDeckMetadata
        ? { runnerDeckMetadata: config.runnerDeckMetadata }
        : {}),
      ...(config.corpDeckMetadata
        ? { corpDeckMetadata: config.corpDeckMetadata }
        : {}),
      controllers: {
        runner: {
          controllerId: "runner-ai",
          side: "runner",
          type: "ai",
          displayName: "Runner KI",
          difficulty: config.runnerDifficulty ?? "normal",
          profileId:
            config.runnerProfileId ??
            `runner-ai-v0.9-${config.runnerDifficulty ?? "normal"}`,
        },
        corp: {
          controllerId: "corp-ai",
          side: "corp",
          type: "ai",
          displayName: "Corp KI",
          difficulty: config.corpDifficulty ?? "normal",
          profileId:
            config.corpProfileId ??
            `corp-ai-v0.9-${config.corpDifficulty ?? "normal"}`,
        },
      },
    });
    const initial = structuredClone(state);
    const deckSnapshots: Record<Side, AiDeckStrategyDeckSnapshot> = {
      runner: deckSnapshotForSimulation(
        runnerDeckDefinition,
        state.deckMetadata?.runner ?? config.runnerDeckMetadata,
      ),
      corp: deckSnapshotForSimulation(
        corpDeckDefinition,
        state.deckMetadata?.corp ?? config.corpDeckMetadata,
      ),
    };
    const actionSequence: AiSimulationSummary["actionSequence"] = [];
    const errors: string[] = [];
    const runtimeFailures: AiSimulationRuntimeFailure[] = [];
    const maxActions = config.maxActions ?? 120;

    for (let index = 0; index < maxActions && !state.winner; index += 1) {
      const sideSelection = selectAiDecisionSideForState(state);
      if (!sideSelection.side) {
        if (sideSelection.terminal) break;
        const failure = classifiedSimulationRuntimeFailure({
          code: "simulation_no_decision_side",
          owner: "rules_contract",
          side: state.activeSide,
          stateVersion: state.stateVersion,
          timingPoint: state.timingPoint,
        });
        runtimeFailures.push(failure);
        errors.push(simulationRuntimeFailureToken(failure));
        break;
      }
      const side = sideSelection.side;
      const input = buildAiDecisionInput(state, side, {
        difficulty:
          side === "runner"
            ? (config.runnerDifficulty ?? "normal")
            : (config.corpDifficulty ?? "normal"),
        actionNumber: index,
        decisionId: `${simulationScopeId}:${index}:${side}`,
        profileId:
          side === "runner"
            ? (config.runnerProfileId ??
              `runner-ai-v0.9-${config.runnerDifficulty ?? "normal"}`)
            : (config.corpProfileId ??
              `corp-ai-v0.9-${config.corpDifficulty ?? "normal"}`),
        ownDeckSnapshot: deckSnapshots[side],
      });
      if (!assertAiInputIsSideSafe(input)) {
        const failure = classifiedSimulationRuntimeFailure({
          code: "simulation_input_not_side_safe",
          owner: "rules_contract",
          side,
          stateVersion: state.stateVersion,
          timingPoint: state.timingPoint,
        });
        runtimeFailures.push(failure);
        errors.push(simulationRuntimeFailureToken(failure));
        break;
      }
      if (
        config.testOnlyDecisionCheckpointCapture?.actionIndices.includes(index)
      ) {
        config.testOnlyDecisionCheckpointCapture.capture({
          seed,
          actionIndex: index,
          side,
          state: structuredClone(state),
          input: structuredClone(input),
          deckSnapshot: structuredClone(deckSnapshots[side]),
        });
      }
      let decision: AiDecision;
      try {
        decision = chooseDecisionForSimulation(
          side,
          input,
          {
            ...config,
            aiDecisionRuntimeOptions: {
              ...config.aiDecisionRuntimeOptions,
              quoteCorpPunishRoute: (request) =>
                quoteCorpPunishRoute(state, request),
              quoteRandomizedIceInstallSelection: (request) =>
                quoteRandomizedIceInstallSelection(state, request),
            },
          },
          simulationRng,
        );
      } catch (error) {
        const failure = classifySimulationRuntimeFailure(error, {
          side,
          stateVersion: state.stateVersion,
          timingPoint: state.timingPoint,
        });
        runtimeFailures.push(failure);
        errors.push(simulationRuntimeFailureToken(failure));
        break;
      }
      const randomizedResult =
        decision.selectionKind === "engine_randomized_ice_install_selection"
          ? applyRandomizedIceInstallSelection(state, {
              ...decision.engineCommand,
              idempotencyKey: `ai-sim-${index}`,
            })
          : undefined;
      const action =
        decision.selectionKind === "engine_randomized_ice_install_selection"
          ? randomizedResult?.ok
            ? randomizedResult.receipt.selectedLegalAction
            : undefined
          : input.legalActions.find(
              (candidate) => candidate.actionId === decision.actionId,
            );
      if (!action) {
        const failure = classifiedSimulationRuntimeFailure({
          code:
            randomizedResult && !randomizedResult.ok
              ? `engine_apply_randomized_ice_install_selection_rejected:${randomizedResult.error.code}`
              : "simulation_selected_action_not_legal",
          owner: randomizedResult ? "rules_contract" : "scheduler",
          side,
          stateVersion: state.stateVersion,
          timingPoint: state.timingPoint,
        });
        runtimeFailures.push(failure);
        errors.push(simulationRuntimeFailureToken(failure));
        break;
      }
      const stateBeforeAction = state;
      const result =
        randomizedResult ??
        applyAction(state, {
          matchId: state.matchId,
          side,
          actionId: action.actionId,
          clientKnownStateVersion: state.stateVersion,
          ...(decision.selectedChoices
            ? { selectedChoices: decision.selectedChoices }
            : {}),
          idempotencyKey: `ai-sim-${index}`,
        });
      if (!result.ok) {
        const failure = classifiedSimulationRuntimeFailure({
          code: `engine_apply_action_rejected:${result.error.code}`,
          owner: "rules_contract",
          side,
          stateVersion: state.stateVersion,
          timingPoint: action.timingPoint,
        });
        runtimeFailures.push(failure);
        errors.push(simulationRuntimeFailureToken(failure));
        break;
      }
      const targetServerId = targetServerIdForSimulationAction(
        action,
        result.event,
        stateBeforeAction,
      );
      const targetCardIds = targetCardIdsForSimulationAction(
        input,
        decision,
        action,
        result.event,
        stateBeforeAction,
      );
      const targetCardType = targetCardIds[0]
        ? cardTargetTypeForInstance(stateBeforeAction, targetCardIds[0])
        : undefined;
      const advancementCountersAdded =
        advancementCountersAddedForSimulationAction(action, result.event);
      const advancementTargetTypes =
        action.type === "advance_card" || advancementCountersAdded > 0
          ? sortedUniqueProgressionCardTargetTypes(
              targetCardIds.map((cardId) =>
                cardTargetTypeForInstance(stateBeforeAction, cardId),
              ),
            )
          : [];
      const scoreActionsAvailable =
        side === "corp"
          ? input.legalActions.filter(
              (candidate) => candidate.type === "score_agenda",
            ).length
          : 0;
      const advancedAgendaStealSource = advancedAgendaStealSourceForAction(
        stateBeforeAction,
        action,
        targetCardIds,
      );
      const finalAdvance = finalAdvanceAssessmentForSimulationAction(
        stateBeforeAction,
        input,
        action,
        targetServerId,
        targetCardIds,
        advancementCountersAdded,
      );
      const protectBeforeAdvance = isProtectBeforeAdvanceSimulationAction(
        stateBeforeAction,
        input,
        action,
        targetServerId,
      );
      const runnerHandUse = runnerHandUseDiagnosticsForSimulationAction(
        input,
        decision,
        action,
        targetServerId,
      );
      const runnerReserve = runnerReserveDiagnosticsForSimulationAction(
        input,
        action,
        targetServerId,
        result.state,
      );
      const runnerCentralPressure =
        runnerCentralPressureDiagnosticsForSimulationAction(
          input,
          action,
          targetServerId,
        );
      const runnerCoverage =
        runnerBreakerCoverageDiagnosticsForSimulationAction(
          input,
          action,
          targetServerId,
        );
      const runnerEconomySetup =
        runnerEconomySetupDiagnosticsForSimulationAction(
          input,
          action,
          targetServerId,
          result.state,
        );
      const tagPunishDiagnostics =
        tagPunishWindowDiagnosticsForSimulationAction(
          input,
          action,
          decision,
          stateBeforeAction,
          result.state,
        );
      const corpFutureRunIce = corpFutureRunIceDiagnosticsForSimulationAction(
        input,
        action,
      );
      const runnerArchivesVisibility =
        runnerArchivesVisibilityDiagnosticsForSimulationAction(
          input,
          action,
          targetServerId,
        );
      const decisionOpportunity = assessDecisionOpportunity(input, action);
      const actionCapacityDiagnostics =
        actionCapacityDiagnosticsForSimulationDecision(decision);
      actionSequence.push({
        side,
        stateVersionBefore: result.event.stateVersionBefore,
        decisionOpportunity: decisionOpportunity.kind,
        legalActionCount: decisionOpportunity.legalActionCount,
        actionableAlternativeCount:
          decisionOpportunity.actionableAlternativeCount,
        selectedActionId: simulationSafeSelectedActionId(
          action,
          targetServerId,
        ),
        actionType: action.type,
        eventType: result.event.type,
        timingPoint: action.timingPoint,
        actionsRemainingBefore: input.playerView.own.clicks,
        turnNumber:
          state.eventLog.filter((event) => event.type === "end_turn").length +
          1,
        ...selfplayTraceFactsForSimulationDecision(decision, config),
        ...actionCapacityDiagnostics,
        reasonCode: decision.reasonCode,
        explanation: decision.explanation,
        confidence: decision.confidence ?? 0,
        evidence: safeEvidenceForSimulationDecision(decision),
        fallbackUsed: decision.fallbackUsed,
        timeoutUsed: decision.timeoutUsed ?? false,
        ...(targetServerId ? { targetServerId } : {}),
        ...(advancementCountersAdded > 0 ? { advancementCountersAdded } : {}),
        ...(scoreActionsAvailable > 0 ? { scoreActionsAvailable } : {}),
        ...(targetCardType ? { targetCardType } : {}),
        ...(advancementTargetTypes.length > 0
          ? { advancementTargetTypes }
          : {}),
        ...(advancedAgendaStealSource
          ? {
              advancedAgendaStolen: true,
              advancedAgendaStealSource,
            }
          : {}),
        ...(finalAdvance.finalAdvance
          ? {
              finalAdvance: true,
              ...(finalAdvance.unsafeFinalAdvance
                ? { unsafeFinalAdvance: true }
                : {}),
              ...(finalAdvance.protectedFinalAdvance
                ? { protectedFinalAdvance: true }
                : {}),
              remoteProtectionScore: finalAdvance.remoteProtectionScore,
              runnerContestRisk: finalAdvance.runnerContestRisk,
              advancesRemainingAfterAction:
                finalAdvance.advancesRemainingAfterAction,
            }
          : {}),
        ...(protectBeforeAdvance ? { protectBeforeAdvance: true } : {}),
        ...runnerHandUse,
        ...runnerReserve,
        ...runnerCentralPressure,
        ...runnerCoverage,
        ...runnerEconomySetup,
        ...tagPunishDiagnostics,
        ...corpFutureRunIce,
        ...runnerArchivesVisibility,
        ...(typeof action.payload?.placement === "string"
          ? { installPlacement: action.payload.placement }
          : {}),
        qualityTags: qualityTagsForAction(input, action, decision),
        stateHashAfter: result.stateHash,
      });
      state = result.state;
    }

    const replay = replayEvents(initial, state.eventLog);
    const runnerView = getPlayerView(state, "runner");
    const corpView = getPlayerView(state, "corp");
    const terminationKind: AiSimulationSummary["terminationKind"] = state.winner
      ? "game_result"
      : errors.length > 0
        ? "runtime_failure"
        : "action_limit";
    return {
      seed,
      terminationKind,
      winner:
        state.winner ??
        (terminationKind === "runtime_failure"
          ? "runtime_failure"
          : "action_limit_reached"),
      ...(state.gameEndReason ? { gameEndReason: state.gameEndReason } : {}),
      actions: actionSequence.length,
      turns: state.eventLog.filter((event) => event.type === "end_turn").length,
      finalAgendaPoints: {
        runner: runnerView.own.agendaPoints,
        corp: corpView.own.agendaPoints,
      },
      finalStateHash: hashState(state),
      eventLogLength: state.eventLog.length,
      replayOk: replay.ok,
      replayErrors: replay.errors,
      actionSequence,
      errors,
      runtimeFailures,
      cardPoolVersion: CURRENT_RULES_BASELINE.engineSchemaVersion,
      metrics: metricsFor(
        actionSequence,
        errors,
        replay.ok,
        isHoldoutSeed(seed, SOAK_SEEDS.holdoutSeeds),
      ),
    };
  }

  return { simulateAiGame };
}

function actionPlacement(action: LegalAction): string | undefined {
  return typeof action.payload?.placement === "string"
    ? action.payload.placement
    : undefined;
}

function runnerArchivesVisibilityDiagnosticsForSimulationAction(
  input: AiDecisionInput,
  action: LegalAction,
  targetServerId: string | undefined,
): ActionSequenceEntryDiagnostics {
  if (
    input.side !== "runner" ||
    action.type !== "start_run" ||
    targetServerId !== "archives"
  ) {
    return {};
  }
  const visibleArchives =
    input.playerView.servers.find((server) => server.id === "archives")?.root ??
    [];
  const knownCards = visibleArchives.filter(
    (card) => card.known && typeof card.definitionId === "string",
  );
  const unknownCardCount = Math.max(
    0,
    input.playerView.opponent.discardCount - knownCards.length,
  );
  const visibleFingerprint = fnv1a(
    knownCards
      .map(
        (card) =>
          `${card.instanceId}:${card.definitionId ?? "unknown"}:${card.type ?? "unknown"}`,
      )
      .sort()
      .join("|"),
  );
  return {
    runnerArchivesKnownCardCount: knownCards.length,
    runnerArchivesUnknownCardCount: unknownCardCount,
    runnerArchivesKnownAgenda: knownCards.some(
      (card) => card.type === "agenda",
    ),
    runnerArchivesVisibleFingerprint: `fnv1a:${visibleFingerprint}`,
  };
}

function simulationDecisionScopeId(params: {
  seed: string;
  matchId?: string | undefined;
  runnerDeckId: string;
  corpDeckId: string;
}): string {
  return [
    "ai-sim",
    params.matchId ?? params.seed,
    params.runnerDeckId,
    params.corpDeckId,
  ]
    .map((part) => part.replace(/[^A-Za-z0-9_.-]+/g, "_"))
    .filter((part) => part.length > 0)
    .join("_")
    .slice(0, 180);
}
