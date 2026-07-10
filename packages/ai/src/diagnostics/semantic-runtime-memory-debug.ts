import {
  CARD_DEFINITIONS_BY_ID,
  type AiDecisionInput,
} from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";
import {
  beliefUncertaintyConsumerFacts,
  reconstructBeliefState,
  type CorpOpponentModel,
  type RunnerOpponentModel,
} from "../belief-state";
import { uniqueDebugStrings } from "./debug-format";

export type SemanticRuntimeMemoryDebug = {
  memoryVersion: string;
  facts: string[];
  hypotheses: string[];
  invalidations: string[];
  beliefUncertainty: string[];
  beliefUncertaintyConsumer: string[];
  opponentModel?: Record<string, unknown>;
  items: string[];
};

export function semanticRuntimeMemoryDebug(
  input: AiDecisionInput,
): SemanticRuntimeMemoryDebug {
  const belief = reconstructBeliefState(input);
  const facts = belief.entries
    .filter(
      (entry) =>
        entry.kind === "public_fact" || entry.kind === "revealed_opponent_fact",
    )
    .map((entry) => semanticRuntimeBeliefEntrySummary(entry.subject));
  const hypotheses = belief.entries
    .filter((entry) => entry.kind === "hypothesis")
    .map(
      (entry) =>
        `${semanticRuntimeBeliefEntrySummary(entry.subject)}:${roundDebug(entry.confidence)}`,
    );
  const opponentModel =
    input.side === "runner"
      ? semanticRuntimeRunnerOpponentMemorySummary(belief.runnerOpponentModel)
      : semanticRuntimeCorpOpponentMemorySummary(belief.corpOpponentModel);
  const beliefUncertaintyConsumer = beliefUncertaintyConsumerFacts(belief);
  const items = [
    `memory_version:${belief.version}`,
    ...semanticRuntimeOwnHandMemoryItems(input),
    ...(input.side === "runner"
      ? semanticRuntimeRunnerMemoryItems(belief.runnerOpponentModel)
      : semanticRuntimeCorpMemoryItems(belief.corpOpponentModel)),
    ...belief.uncertainty.slice(0, 4).map((entry) => `uncertainty:${entry}`),
    ...beliefUncertaintyConsumer,
  ];
  return {
    memoryVersion: belief.version,
    facts: uniqueDebugStrings(facts).slice(0, 6),
    hypotheses: uniqueDebugStrings(hypotheses).slice(0, 6),
    invalidations: belief.invalidationLog.slice(0, 6),
    beliefUncertainty: belief.uncertainty.slice(0, 6),
    beliefUncertaintyConsumer,
    ...(opponentModel ? { opponentModel } : {}),
    items,
  };
}

function semanticRuntimeOwnHandMemoryItems(input: AiDecisionInput): string[] {
  const ownHandInstanceIds = new Set(
    input.playerView.own.gripOrHq.map((card) => card.instanceId),
  );
  const legalOwnHandActions = input.legalActions.filter((action) =>
    ownHandInstanceIds.has(String(action.source)),
  );
  return [
    `own_hand_count:${input.playerView.own.gripOrHq.length}`,
    "own_hand_content_visibility:preview_private_section",
    `own_hand_current_legal_actions:${legalOwnHandActions.length}`,
    "own_hand_future_play_plan_model:not_modelled",
  ];
}

function semanticRuntimeBeliefEntrySummary(subject: string): string {
  if (subject.startsWith("own_private_card:")) return "own_private_card";
  if (subject.startsWith("public_card:")) {
    const parts = subject.split(":");
    return `public_card:${parts[1] ?? "server"}`;
  }
  if (subject.startsWith("revealed_opponent_card:")) {
    const definitionId = subject.slice("revealed_opponent_card:".length);
    return `revealed_opponent_card:${semanticRuntimeCardLabel(definitionId)}`;
  }
  if (subject.startsWith("server_shape:")) return subject;
  if (subject.startsWith("remote_card_hypothesis:")) {
    const parts = subject.split(":");
    return `remote_card_hypothesis:${parts[1] ?? "remote"}:${parts[2] ?? "unknown"}`;
  }
  if (subject.startsWith("unrezzed_ice_risk:")) return subject;
  if (subject.startsWith("opponent_hidden_hand_cards:")) return subject;
  if (subject.startsWith("unknown_remote_root_cards:")) return subject;
  return subject.replace(/:[a-z0-9_./-]+$/i, "");
}

function semanticRuntimeCardLabel(definitionId: string): string {
  return (
    RUNTIME_CARDS[definitionId]?.title ??
    CARD_DEFINITIONS_BY_ID[definitionId]?.title ??
    definitionId
  );
}

function semanticRuntimeKnownCardSummary(definitionId: string): {
  definitionId: string;
  title: string;
  type?: string;
} {
  const runtimeDefinition = RUNTIME_CARDS[definitionId];
  const demoDefinition = CARD_DEFINITIONS_BY_ID[definitionId];
  const type = runtimeDefinition?.type ?? demoDefinition?.type;
  const summary = {
    definitionId,
    title: runtimeDefinition?.title ?? demoDefinition?.title ?? definitionId,
  };
  return type ? { ...summary, type } : summary;
}

function semanticRuntimeKnownDefinitionCounts(definitionIds: string[]): Array<{
  definitionId: string;
  title: string;
  type?: string;
  count: number;
}> {
  const counts = new Map<string, number>();
  for (const definitionId of definitionIds) {
    counts.set(definitionId, (counts.get(definitionId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([left], [right]) =>
      semanticRuntimeCardLabel(left).localeCompare(
        semanticRuntimeCardLabel(right),
      ),
    )
    .map(([definitionId, count]) => ({
      ...semanticRuntimeKnownCardSummary(definitionId),
      count,
    }));
}

function semanticRuntimeRunnerOpponentMemorySummary(
  model: RunnerOpponentModel | undefined,
): Record<string, unknown> | undefined {
  if (!model) return undefined;
  return {
    corpPlanEstimate: model.corpPlanEstimate,
    hqAgendaDensityEstimate: roundDebug(model.hqAgendaDensityEstimate),
    rndValueEstimate: roundDebug(model.rndValueEstimate),
    corpCreditReserveInterpretation: model.corpCreditReserveInterpretation,
    rndTopFreshness: {
      knownToRunner: model.rndTopFreshness.knownToRunner,
      freshness: model.rndTopFreshness.freshness,
      freshenedByRunnerAccess:
        model.rndTopFreshness.freshenedByRunnerAccess === true,
      ...(model.rndTopFreshness.knownTopDefinitionId
        ? {
            knownTopCard: semanticRuntimeKnownCardSummary(
              model.rndTopFreshness.knownTopDefinitionId,
            ),
          }
        : {}),
      ...(model.rndTopFreshness.knownSequenceDefinitionIds &&
      model.rndTopFreshness.knownSequenceDefinitionIds.length > 0
        ? {
            knownSequence: model.rndTopFreshness.knownSequenceDefinitionIds
              .slice(0, 6)
              .map((definitionId, index) => ({
                position: index === 0 ? "top" : `top+${index}`,
                ...semanticRuntimeKnownCardSummary(definitionId),
              })),
          }
        : {}),
      invalidationReasons: model.rndTopFreshness.invalidationReasons.slice(
        0,
        4,
      ),
    },
    hqHandMemory: {
      handCount: model.hqHandMemory.handCount,
      knownCount: model.hqHandMemory.knownCount,
      allCardsKnown: model.hqHandMemory.allCardsKnown,
      knownCards: semanticRuntimeKnownDefinitionCounts(
        model.hqHandMemory.knownDefinitions,
      ),
      summary: semanticRuntimeHqHandMemorySummary(model.hqHandMemory),
      safeKnownCards: model.hqHandMemory.ledger.safeDefinitions.map(
        (definition) => ({
          ...semanticRuntimeKnownCardSummary(definition.definitionId),
          count: definition.count,
        }),
      ),
      candidateGroups: model.hqHandMemory.ledger.candidateGroups
        .slice(0, 6)
        .map((group) => ({
          category: semanticRuntimeHqCandidateGroupCategory(
            group.reason,
            group.installPlacement,
          ),
          reason: group.reason,
          candidateCount: group.candidateCount,
          ambiguousCount: Math.max(
            0,
            group.candidateCount - group.departureCount,
          ),
          unknownCandidateCount: group.unknownCandidateCount,
          departureCount: group.departureCount,
          ...(group.serverId ? { serverId: group.serverId } : {}),
          ...(group.installPlacement
            ? { installPlacement: group.installPlacement }
            : {}),
          basis: group.basis.slice(0, 4),
        })),
      invalidationReasons: model.hqHandMemory.invalidationReasons.slice(0, 4),
    },
    remoteCardBelief: model.remoteCardBelief.slice(0, 6).map((entry) => ({
      serverId: entry.serverId,
      hypothesis: entry.hypothesis,
      confidence: roundDebug(entry.confidence),
    })),
    hiddenRemoteCandidateMemory: model.hiddenRemoteCandidateMemory
      .slice(0, 6)
      .map((entry) => ({
        serverId: entry.serverId,
        candidateCount: entry.candidateCount,
        agendaCandidateCount: entry.agendaCandidateCount,
        relevantTrashCandidateCount: entry.relevantTrashCandidateCount,
        candidateCards: entry.candidateDefinitions
          .slice(0, 8)
          .map((candidate) => ({
            ...semanticRuntimeKnownCardSummary(candidate.definitionId),
            count: candidate.count,
          })),
        exhaustive: entry.exhaustive,
      })),
    knownPositionMemoryCount: model.knownPositionMemory.length,
    knownPositionMemory: model.knownPositionMemory.slice(0, 8).map((entry) => ({
      zone: entry.zone,
      positionKey: entry.positionKey,
      sourceKind: entry.sourceKind,
      ...semanticRuntimeKnownCardSummary(entry.definitionId),
    })),
    unrezzedIceRiskModel: model.unrezzedIceRiskModel
      .slice(0, 6)
      .map((entry) => ({
        serverId: entry.serverId,
        risk: roundDebug(entry.risk),
        basis: entry.basis.slice(0, 3),
      })),
  };
}

function semanticRuntimeCorpOpponentMemorySummary(
  model: CorpOpponentModel | undefined,
): Record<string, unknown> | undefined {
  if (!model) return undefined;
  return {
    runnerThreatModel: model.runnerThreatModel,
    runnerAggressionMemory: model.runnerAggressionMemory,
    breakerAvailabilityEstimate: model.breakerAvailabilityEstimate,
    remoteContestProbability: roundDebug(model.remoteContestProbability),
    hqPressureEstimate: roundDebug(model.hqPressureEstimate),
    rndPressureEstimate: roundDebug(model.rndPressureEstimate),
  };
}

function semanticRuntimeHqHandMemorySummary(
  memory: RunnerOpponentModel["hqHandMemory"],
): {
  safeKnownCount: number;
  ambiguousCount: number;
  unknownCount: number;
  candidateGroupCount: number;
} {
  const ambiguousCount = memory.ledger.candidateGroups.reduce(
    (sum, group) =>
      sum + Math.max(0, group.candidateCount - group.departureCount),
    0,
  );
  return {
    safeKnownCount: memory.ledger.safeDefinitions.reduce(
      (sum, definition) => sum + definition.count,
      0,
    ),
    ambiguousCount,
    unknownCount: memory.ledger.unknownRestCount,
    candidateGroupCount: memory.ledger.candidateGroups.length,
  };
}

function semanticRuntimeHqCandidateGroupCategory(
  reason: string,
  placement: string | undefined,
): string {
  if (reason === "hidden_install_no_matching_known_candidates")
    return "hidden_install_uncertain";
  if (placement === "ice") return "hidden_ice_install";
  if (placement === "root") return "hidden_root_install";
  return "hidden_install";
}

function semanticRuntimeRunnerMemoryItems(
  model: RunnerOpponentModel | undefined,
): string[] {
  if (!model) return [];
  return [
    `rnd_top:${model.rndTopFreshness.freshness}`,
    `hq_known:${model.hqHandMemory.knownCount}/${model.hqHandMemory.handCount}`,
    `hq_all_known:${model.hqHandMemory.allCardsKnown}`,
    `remote_beliefs:${model.remoteCardBelief.length}`,
    `remote_candidate_sets:${model.hiddenRemoteCandidateMemory.length}`,
    `known_positions:${model.knownPositionMemory.length}`,
    `corp_credit_reserve:${model.corpCreditReserveInterpretation}`,
  ];
}

function semanticRuntimeCorpMemoryItems(
  model: CorpOpponentModel | undefined,
): string[] {
  if (!model) return [];
  return [
    `runner_runs:${model.runnerAggressionMemory.runEvents}`,
    `runner_remote_runs:${model.runnerAggressionMemory.remoteRuns}`,
    `runner_central_runs:${model.runnerAggressionMemory.centralRuns}`,
    `runner_remote_pressure:${roundDebug(model.runnerThreatModel.remotePressure)}`,
    `runner_hq_pressure:${roundDebug(model.hqPressureEstimate)}`,
    `runner_rnd_pressure:${roundDebug(model.rndPressureEstimate)}`,
  ];
}

function roundDebug(value: number): number {
  return Math.round(value * 100) / 100;
}
