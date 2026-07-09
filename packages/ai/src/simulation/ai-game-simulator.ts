import {
  applyAction,
  createGame,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import {
  CURRENT_RULES_BASELINE,
  DEMO_DECKS,
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
import { resetRunnerRunPlanMemory } from "../runtime/runner-run-plan-memory";
import { resetTacticalPlanMemory } from "../tactical-plans";
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
  corpIcePortfolioDiagnosticsForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => ActionSequenceEntryDiagnostics;
  corpScoreTerminalDiagnosticsForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => ActionSequenceEntryDiagnostics;
  corpEconomyBeforeScoreDiagnosticsForSimulationAction: (
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
    corpIcePortfolioDiagnosticsForSimulationAction,
    corpScoreTerminalDiagnosticsForSimulationAction,
    corpEconomyBeforeScoreDiagnosticsForSimulationAction,
    qualityTagsForAction,
  } = dependencies;

  function simulateAiGame(
    config: AiSimulationConfig = {},
  ): AiSimulationSummary {
    resetTacticalPlanMemory();
    resetRunnerRunPlanMemory();
    const deckSupportErrors = validateSimulationDeckSupport(config);
    if (deckSupportErrors.length > 0) {
      return {
        seed: config.seed ?? "ai-vs-ai-smoke",
        winner: "action_limit_reached",
        actions: 0,
        turns: 0,
        finalAgendaPoints: { runner: 0, corp: 0 },
        finalStateHash: "fnv1a:00000000",
        eventLogLength: 0,
        replayOk: false,
        replayErrors: [],
        actionSequence: [],
        errors: deckSupportErrors,
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
      config.runnerDeck ?? DEMO_DECKS[config.runnerDeckId ?? "demo_runner_001"];
    const corpDeckDefinition =
      config.corpDeck ?? DEMO_DECKS[config.corpDeckId ?? "demo_corp_001"];
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
    const maxActions = config.maxActions ?? 120;

    for (let index = 0; index < maxActions && !state.winner; index += 1) {
      const sideSelection = selectAiDecisionSideForState(state);
      if (!sideSelection.side) {
        if (sideSelection.terminal) break;
        errors.push(
          sideSelection.error ??
            `No legal actions for either side at ${state.stateVersion} (activeSide ${state.activeSide}, phase ${state.phase}, timingPoint ${state.timingPoint}, runPhase ${state.run?.phase ?? "none"}, pendingChoice ${state.pendingChoice?.source ?? "none"}).`,
        );
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
        errors.push(
          `Simulation input is not side-safe for ${side} at ${state.stateVersion}.`,
        );
        break;
      }
      const decision = chooseDecisionForSimulation(
        side,
        input,
        config,
        simulationRng,
      );
      const action = input.legalActions.find(
        (candidate) => candidate.actionId === decision.actionId,
      );
      if (!action) {
        errors.push(`No legal action for ${side} at ${state.stateVersion}.`);
        break;
      }
      const stateBeforeAction = state;
      const result = applyAction(state, {
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
        errors.push(
          [
            `${result.error.code} at stateVersion ${state.stateVersion}`,
            `side:${side}`,
            `action:${simulationSafeSelectedActionId(action, actionPlacement(action))}`,
            `timing:${action.timingPoint}`,
            `statePhase:${state.phase}`,
            `stateTiming:${state.timingPoint}`,
            `runPhase:${state.run?.phase ?? "none"}`,
          `pendingChoice:${state.pendingChoice ? "yes" : "no"}`,
            `choiceKeys:${Object.keys(decision.selectedChoices ?? {}).join(",") || "none"}`,
            `message:${result.error.message}`,
          ].join(" "),
        );
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
      const corpIcePortfolio = corpIcePortfolioDiagnosticsForSimulationAction(
        input,
        action,
      );
      const corpScoreTerminal = corpScoreTerminalDiagnosticsForSimulationAction(
        input,
        action,
      );
      const corpEconomyBeforeScore =
        corpEconomyBeforeScoreDiagnosticsForSimulationAction(input, action);
      actionSequence.push({
        side,
        stateVersionBefore: result.event.stateVersionBefore,
        selectedActionId: simulationSafeSelectedActionId(
          action,
          targetServerId,
        ),
        actionType: action.type,
        eventType: result.event.type,
        timingPoint: action.timingPoint,
        turnNumber:
          state.eventLog.filter((event) => event.type === "end_turn").length +
          1,
        ...selfplayTraceFactsForSimulationDecision(decision, config),
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
        ...corpIcePortfolio,
        ...corpScoreTerminal,
        ...corpEconomyBeforeScore,
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
    return {
      seed,
      winner: state.winner ?? "action_limit_reached",
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
