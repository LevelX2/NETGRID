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
  const safeDebug = dependencies.sanitizeAiDecisionDebug(
    decision.decisionDebug,
  );
  if (!safeDebug) return {};
  const debugFacts = dependencies.safeSelfplayFacts([
    ...(safeDebug.planKind ? [`planKind:${safeDebug.planKind}`] : []),
    ...(safeDebug.selectedActionType
      ? [`selectedActionType:${safeDebug.selectedActionType}`]
      : []),
    ...(safeDebug.visibleReasons ?? []),
    ...(safeDebug.warnings ?? []),
    ...(safeDebug.whyNot?.map((fact) => `topLevelWhyNot:${fact}`) ?? []),
    ...(safeDebug.evidence ?? []),
    ...(safeDebug.detailSections?.flatMap((section) =>
      section.items.slice(0, 4).map((item) => `${section.id}:${item}`),
    ) ?? []),
    ...strategicDetailFacts(safeDebug.detailSections),
  ]);
  return {
    ...(safeDebug.planKind ? { planKind: safeDebug.planKind } : {}),
    ...(debugFacts.length > 0 ? { debugFacts } : {}),
    ...(safeDebug.actionAlternatives && safeDebug.actionAlternatives.length > 0
      ? {
          actionAlternatives: safeDebug.actionAlternatives.map((alternative) =>
            safeSelfplayActionAlternative(alternative, dependencies),
          ),
        }
      : {}),
  };
}

function safeSelfplayActionAlternative(
  alternative: AiDecisionActionAlternative,
  dependencies: SelfplayTraceFactsDependencies,
): AiDecisionActionAlternative {
  const actionType =
    safeSelfplayText(alternative.actionType, dependencies) ?? "redacted";
  const safeWhyNot = dependencies.safeSelfplayFacts(alternative.whyNot ?? []);
  const result: AiDecisionActionAlternative = {
    rank: alternative.rank,
    actionId: `selfplay_action:${actionType}:${alternative.rank}`,
    actionType,
    selected: alternative.selected,
    whyChosen: dependencies.safeSelfplayFacts(alternative.whyChosen ?? []),
    whyNot:
      !alternative.selected &&
      safeWhyNot.length === 0 &&
      (alternative.whyNot?.length ?? 0) > 0
        ? [
            `runtime_why_not_redacted:alternative:${actionType}:${alternative.rank}:owner_reason_withheld`,
          ]
        : safeWhyNot,
  };
  if (alternative.excluded !== undefined)
    result.excluded = alternative.excluded;
  if (alternative.score !== undefined) result.score = alternative.score;
  if (alternative.priority !== undefined)
    result.priority = alternative.priority;
  const scoreBreakdown = alternative.scoreBreakdown
    ?.map((component) => {
      const key = safeSelfplayText(component.key, dependencies);
      const label = safeSelfplayText(component.label, dependencies);
      if (!key || !label) return undefined;
      const reason = safeSelfplayText(component.reason, dependencies);
      return {
        key,
        label,
        value: component.value,
        ...(component.weight !== undefined ? { weight: component.weight } : {}),
        ...(reason ? { reason } : {}),
      };
    })
    .filter((component): component is NonNullable<typeof component> =>
      Boolean(component),
    );
  if (scoreBreakdown && scoreBreakdown.length > 0) {
    result.scoreBreakdown = scoreBreakdown;
  }
  if (alternative.economy) {
    const economyKind = safeSelfplayText(
      alternative.economy.economyKind,
      dependencies,
    );
    if (economyKind) {
      const ability = safeSelfplayText(
        alternative.economy.ability,
        dependencies,
      );
      const economyNeed = safeSelfplayText(
        alternative.economy.economyNeed,
        dependencies,
      );
      result.economy = {
        economyKind,
        ...(ability ? { ability } : {}),
        ...(economyNeed ? { economyNeed } : {}),
        ...(alternative.economy.immediateGain !== undefined
          ? { immediateGain: alternative.economy.immediateGain }
          : {}),
        ...(alternative.economy.netCredits !== undefined
          ? { netCredits: alternative.economy.netCredits }
          : {}),
        ...(alternative.economy.storedCredits !== undefined
          ? { storedCredits: alternative.economy.storedCredits }
          : {}),
        ...(alternative.economy.futurePoolAfter !== undefined
          ? { futurePoolAfter: alternative.economy.futurePoolAfter }
          : {}),
      };
    }
  }
  return result;
}

function safeSelfplayText(
  value: unknown,
  dependencies: SelfplayTraceFactsDependencies,
): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  return dependencies.safeSelfplayFacts([String(value)])[0];
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

function strategicDetailFacts(
  sections: AiDecisionDebug["detailSections"] | undefined,
): string[] {
  if (!sections) return [];
  return sections
    .flatMap((section) =>
      section.items
        .filter(strategicDetailItemIsRetained)
        .map((item) => `${section.id}:${item}`),
    )
    .slice(0, 32);
}

function strategicDetailItemIsRetained(item: string): boolean {
  return [
    "corp_strategic_intent_used:",
    "deck_strategy_",
    "strategic_action_fit_",
    "strategic_intent_",
    "strategy_portfolio_",
  ].some((prefix) => item.startsWith(prefix));
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
