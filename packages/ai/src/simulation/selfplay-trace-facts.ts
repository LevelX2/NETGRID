import {
  type AiDecision,
  type AiDecisionActionAlternative,
  type AiDecisionDebug,
} from "@netgrid/shared";

type SelfplayTraceFacts = {
  planKind?: string;
  debugFacts?: string[];
  actionAlternatives?: AiDecisionActionAlternative[];
};

type SimulationActionSequenceEntry = {
  actionAlternatives?: AiDecisionActionAlternative[];
};

type SimulationSummaryWithActionSequence = {
  seed: string;
  actionSequence: SimulationActionSequenceEntry[];
};

type FindingWindow = {
  summaryIndex: number;
  actionIndex: number;
  detectorIds?: unknown;
};

export type SelfplayTraceFactsDependencies = {
  readonly sanitizeAiDecisionDebug: (
    debug: AiDecisionDebug | undefined,
  ) => AiDecisionDebug | undefined;
  readonly safeSelfplayFacts: (facts: unknown[]) => string[];
};

export function selfplayTraceFactsForDecision(
  decision: AiDecision,
  dependencies: SelfplayTraceFactsDependencies,
): SelfplayTraceFacts {
  const safeDebug = dependencies.sanitizeAiDecisionDebug(decision.decisionDebug);
  if (!safeDebug) return {};
  const debugFacts = dependencies.safeSelfplayFacts([
    ...(safeDebug.planKind ? [`planKind:${safeDebug.planKind}`] : []),
    ...(safeDebug.selectedActionType
      ? [`selectedActionType:${safeDebug.selectedActionType}`]
      : []),
    ...(safeDebug.visibleReasons ?? []),
    ...(safeDebug.warnings ?? []),
    ...(safeDebug.evidence ?? []),
    ...(safeDebug.detailSections?.flatMap((section) =>
      section.items.slice(0, 4).map((item) => `${section.id}:${item}`),
    ) ?? []),
  ]);
  return {
    ...(safeDebug.planKind ? { planKind: safeDebug.planKind } : {}),
    ...(debugFacts.length > 0 ? { debugFacts } : {}),
    ...(safeDebug.actionAlternatives && safeDebug.actionAlternatives.length > 0
      ? { actionAlternatives: safeDebug.actionAlternatives }
      : {}),
  };
}

export function selfplayTraceFactsForSimulationDecision(
  decision: AiDecision,
  includeActionAlternativesForFindings: boolean | undefined,
  dependencies: SelfplayTraceFactsDependencies,
): SelfplayTraceFacts {
  const facts = selfplayTraceFactsForDecision(decision, dependencies);
  if (includeActionAlternativesForFindings === true) return facts;
  const { actionAlternatives: _actionAlternatives, ...withoutAlternatives } =
    facts;
  return withoutAlternatives;
}

export function stripSelfplayActionAlternatives(
  summaries: SimulationSummaryWithActionSequence[],
): void {
  for (const summary of summaries) {
    for (const entry of summary.actionSequence) {
      delete entry.actionAlternatives;
    }
  }
}

const SELFPLAY_ACTION_ALTERNATIVE_FINDING_DETECTORS = new Set([
  "action_limit_reached",
]);

export function retainActionAlternativesForFindingWindows(
  summaries: SimulationSummaryWithActionSequence[],
  findings: FindingWindow[],
  maxAlternativesPerFinding: number,
  opportunitySnapshotRequests: Array<{
    seed: string;
    actionIndices: number[];
  }> = [],
): void {
  const keep = new Set<string>();
  const requestedBySeed = new Map(
    opportunitySnapshotRequests.map((request) => [
      request.seed,
      new Set(
        request.actionIndices.filter(
          (index) => Number.isInteger(index) && index >= 0,
        ),
      ),
    ]),
  );
  let firstAvailable:
    | {
        summaryIndex: number;
        actionIndex: number;
      }
    | undefined;
  let firstAvailableAlternatives: AiDecisionActionAlternative[] | undefined;
  let sawEligibleFinding = false;
  for (const [summaryIndex, summary] of summaries.entries()) {
    const actionIndex = summary.actionSequence.findIndex(
      (entry) => (entry.actionAlternatives?.length ?? 0) > 0,
    );
    if (actionIndex >= 0) {
      firstAvailable = { summaryIndex, actionIndex };
      firstAvailableAlternatives =
        summary.actionSequence[actionIndex]?.actionAlternatives?.slice();
      break;
    }
  }
  for (const finding of findings) {
    if (
      Array.isArray(finding.detectorIds) &&
      !finding.detectorIds.some((detectorId) =>
        SELFPLAY_ACTION_ALTERNATIVE_FINDING_DETECTORS.has(String(detectorId)),
      )
    ) {
      continue;
    }
    sawEligibleFinding = true;
    const summary = summaries[finding.summaryIndex];
    if (!summary) continue;
    const from = Math.max(0, finding.actionIndex - 5);
    const to = Math.min(
      summary.actionSequence.length - 1,
      finding.actionIndex + 1,
    );
    for (let index = from; index <= to; index += 1) {
      keep.add(`${finding.summaryIndex}:${index}`);
    }
  }
  for (const [summaryIndex, summary] of summaries.entries()) {
    const requested = requestedBySeed.get(summary.seed);
    if (!requested) continue;
    for (const actionIndex of requested) {
      keep.add(`${summaryIndex}:${actionIndex}`);
    }
  }
  for (const [summaryIndex, summary] of summaries.entries()) {
    for (const [actionIndex, entry] of summary.actionSequence.entries()) {
      if (!keep.has(`${summaryIndex}:${actionIndex}`)) {
        delete entry.actionAlternatives;
        continue;
      }
      if (entry.actionAlternatives) {
        entry.actionAlternatives = entry.actionAlternatives.slice(
          0,
          Math.max(1, maxAlternativesPerFinding),
        );
      }
    }
  }
  const retained = summaries.some((summary) =>
    summary.actionSequence.some(
      (entry) => (entry.actionAlternatives?.length ?? 0) > 0,
    ),
  );
  if (!retained && sawEligibleFinding && firstAvailable) {
    const entry =
      summaries[firstAvailable.summaryIndex]?.actionSequence[
        firstAvailable.actionIndex
      ];
    if (entry && firstAvailableAlternatives) {
      entry.actionAlternatives = firstAvailableAlternatives.slice(
        0,
        Math.max(1, maxAlternativesPerFinding),
      );
    }
  }
}
