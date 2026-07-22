import {
  runAiSelfplayTraceMining,
  summarizeActionCapacityBaselineMetrics,
  summarizeMatchProgressionMetrics,
  type AiBenchmarkDeckSlotDefinition,
  type AiSelfplayTraceMiningResult,
} from "../packages/ai/src/simulation";
import {
  createAiBehaviorBaselineSlotResult,
  type AiBehaviorBaselineSlotDescriptor,
  type AiBehaviorBaselineSlotResult,
} from "../packages/ai/src/simulation/ai-behavior-baseline";
import { resolveBenchmarkDeckSlot } from "../packages/ai/src/simulation/benchmark-deck-slot-resolver";
import { validateSimulationDeckSupport } from "../packages/ai/src/simulation/deck-support";

export type AiBehaviorBaselineSlotRun = {
  descriptor: AiBehaviorBaselineSlotDescriptor;
  trace: AiSelfplayTraceMiningResult;
  result: AiBehaviorBaselineSlotResult;
};

export function runAiBehaviorBaselineSlot(params: {
  slot: AiBenchmarkDeckSlotDefinition;
  seeds: string[];
  maxActions: number;
  maxFindings: number;
}): AiBehaviorBaselineSlotRun {
  const resolved = resolveBenchmarkDeckSlot(params.slot);
  if (!resolved.ok) {
    throw new Error(`Cannot resolve ${params.slot.slotId}: ${resolved.reason}`);
  }
  const supportErrors = validateSimulationDeckSupport(resolved.config);
  if (supportErrors.length > 0) {
    throw new Error(`${params.slot.slotId}: ${supportErrors.join(" | ")}`);
  }
  const descriptor = createDescriptor(params.slot, resolved.config);
  const trace = runAiSelfplayTraceMining({
    seeds: params.seeds,
    maxActions: params.maxActions,
    runnerControllerMode: "current_candidate",
    corpControllerMode: "current_candidate",
    ...resolved.config,
    maxFindings: params.maxFindings,
  });
  const progression = summarizeMatchProgressionMetrics(trace.summaries);
  return {
    descriptor,
    trace,
    result: createAiBehaviorBaselineSlotResult({
      descriptor,
      progression,
      decisions: trace.aggregate.decisions,
      findings: trace.aggregate.findings,
      findingsByDetector: trace.aggregate.findingsByDetector,
      illegalActions: trace.aggregate.illegalActions,
      replayFailures: trace.aggregate.replayFailures,
      actionLimitGames: trace.aggregate.actionLimitReached,
      fallbackActions: trace.summaries.reduce(
        (count, summary) =>
          count +
          summary.actionSequence.filter((entry) => entry.fallbackUsed === true)
            .length,
        0,
      ),
      timeoutActions: trace.summaries.reduce(
        (count, summary) =>
          count +
          summary.actionSequence.filter((entry) => entry.timeoutUsed === true)
            .length,
        0,
      ),
      runtimeErrors: trace.summaries.reduce(
        (count, summary) => count + summary.errors.length,
        0,
      ),
      redactionSafe: trace.aggregate.redactionSafe,
      actionCapacity: summarizeActionCapacityBaselineMetrics(trace.summaries),
      games: trace.summaries.map((summary) => ({
        seed: summary.seed,
        winner: summary.winner,
        ...(summary.gameEndReason
          ? { gameEndReason: summary.gameEndReason }
          : {}),
        actions: summary.actions,
        turns: summary.turns,
        runnerAgendaPoints: summary.finalAgendaPoints.runner,
        corpAgendaPoints: summary.finalAgendaPoints.corp,
        finalStateHash: summary.finalStateHash,
        replayOk: summary.replayOk,
        errorCount: summary.errors.length,
      })),
    }),
  };
}

function createDescriptor(
  slot: AiBenchmarkDeckSlotDefinition,
  config: {
    runnerDeckId?: string;
    corpDeckId?: string;
    runnerDeck?: { id: string };
    corpDeck?: { id: string };
    runnerDeckMetadata?: { deckHash?: string; name?: string };
    corpDeckMetadata?: { deckHash?: string; name?: string };
  },
): AiBehaviorBaselineSlotDescriptor {
  return {
    slotId: slot.slotId,
    label: slot.label,
    slotType: slot.slotType,
    runnerArchetype: slot.runnerArchetype,
    corpArchetype: slot.corpArchetype,
    runnerDeckFingerprint:
      config.runnerDeckMetadata?.deckHash ??
      config.runnerDeck?.id ??
      config.runnerDeckId ??
      "unknown-runner-deck",
    corpDeckFingerprint:
      config.corpDeckMetadata?.deckHash ??
      config.corpDeck?.id ??
      config.corpDeckId ??
      "unknown-corp-deck",
  };
}
