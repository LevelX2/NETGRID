export type RunnerCoverageType = "barrier" | "code_gate" | "sentry" | "unknown";

export type RunnerCoverageGoalContext = {
  missingCoverageTypes: readonly RunnerCoverageType[];
  visibleInstallableCoverageCards?: readonly RunnerCoverageCard[];
  sideSafeSearchAvailable?: boolean;
  runnerCredits?: number;
  activeCoverageGoalIds?: readonly string[];
};

export type RunnerCoverageCard = {
  title: string;
  coverageTypes: readonly RunnerCoverageType[];
  installCost?: number;
};

export type RunnerCoverageGoalAction = {
  actionId?: string;
  type: string;
  label?: string;
  sourceTitle?: string;
  cost?: number;
  targetCoverageTypes?: readonly RunnerCoverageType[];
  supportedGoalIds?: readonly string[];
  actionTacticSignals?: readonly string[];
};

export type RunnerCoverageGoalFit =
  | "install_fixes_coverage"
  | "draw_may_find"
  | "search_likely_finds"
  | "credit_preserves_future_coverage"
  | "run_ignores_unresolved_coverage"
  | "unrelated";

export type RunnerCoverageGoalResolution = {
  fit: RunnerCoverageGoalFit;
  missingCoverageTypes: RunnerCoverageType[];
  resolvedCoverageTypes: RunnerCoverageType[];
  matchedGoalIds: string[];
  sideSafe: boolean;
  rationale: string;
};

export function resolveRunnerCoverageGoalForAction(
  context: RunnerCoverageGoalContext,
  action: RunnerCoverageGoalAction,
): RunnerCoverageGoalResolution {
  const missing = uniqueCoverage(context.missingCoverageTypes);
  if (missing.length === 0) {
    return resolution(
      "unrelated",
      missing,
      [],
      [],
      true,
      "No visible coverage gap.",
    );
  }

  const visibleCoverage = visibleCoverageForAction(context, action);
  const affordable =
    action.cost === undefined ||
    context.runnerCredits === undefined ||
    action.cost <= context.runnerCredits;
  if (action.type === "install_card" && visibleCoverage.length > 0) {
    if (affordable) {
      return resolution(
        "install_fixes_coverage",
        missing,
        visibleCoverage,
        [],
        true,
        "Visible installable coverage card resolves at least one missing ICE type.",
      );
    }
    return resolution(
      "credit_preserves_future_coverage",
      missing,
      visibleCoverage,
      [],
      true,
      "Coverage install is visible but not currently affordable; preserving credits remains sensible.",
    );
  }

  if (isSearchAction(action)) {
    const matchedGoalIds = matchedCoverageGoalIds(context, action);
    return resolution(
      context.sideSafeSearchAvailable || matchedGoalIds.length > 0
        ? "search_likely_finds"
        : "draw_may_find",
      missing,
      [],
      matchedGoalIds,
      true,
      context.sideSafeSearchAvailable || matchedGoalIds.length > 0
        ? "Side-safe search action can plausibly find missing coverage goal."
        : "Search-like action exists but lacks a side-safe target guarantee.",
    );
  }

  if (action.type === "draw_card") {
    return resolution(
      "draw_may_find",
      missing,
      [],
      [],
      true,
      "Draw may find coverage when no visible installable coverage action is available.",
    );
  }

  if (action.type === "gain_credit") {
    return resolution(
      "credit_preserves_future_coverage",
      missing,
      [],
      [],
      true,
      "Credit action preserves future coverage or install affordability.",
    );
  }

  if (isRunAction(action)) {
    return resolution(
      "run_ignores_unresolved_coverage",
      missing,
      [],
      [],
      true,
      "Run action does not address visible unresolved coverage gap.",
    );
  }

  return resolution(
    "unrelated",
    missing,
    [],
    [],
    true,
    "Action has no side-safe relationship to visible coverage goal.",
  );
}

function visibleCoverageForAction(
  context: RunnerCoverageGoalContext,
  action: RunnerCoverageGoalAction,
): RunnerCoverageType[] {
  const actionCoverage = uniqueCoverage(action.targetCoverageTypes ?? []);
  const cardCoverage =
    context.visibleInstallableCoverageCards?.find(
      (card) => card.title === action.sourceTitle,
    )?.coverageTypes ?? [];
  const combined = uniqueCoverage([...actionCoverage, ...cardCoverage]);
  return combined.filter((coverage) =>
    context.missingCoverageTypes.includes(coverage),
    );
}

function matchedCoverageGoalIds(
  context: RunnerCoverageGoalContext,
  action: RunnerCoverageGoalAction,
): string[] {
  const activeGoalIds = new Set(context.activeCoverageGoalIds ?? []);
  const supportedGoalIds = uniqueStrings(action.supportedGoalIds ?? []);
  const explicitMatches = supportedGoalIds.filter((goalId) =>
    activeGoalIds.has(goalId),
  );
  if (explicitMatches.length > 0) return explicitMatches;
  if (
    action.actionTacticSignals?.some((signal) =>
      /breaker_search|program_search|search\.stack|coverage/i.test(signal),
    ) &&
    [...activeGoalIds].some((goalId) => goalId.includes("breaker_search"))
  ) {
    return [...activeGoalIds].filter((goalId) =>
      goalId.includes("breaker_search"),
    );
  }
  return [];
}

function isSearchAction(action: RunnerCoverageGoalAction): boolean {
  return (
    action.type === "search_stack" ||
    action.actionTacticSignals?.some((signal) =>
      /breaker_search|program_search|search\.stack|coverage_search|setup\.search/i.test(
        signal,
      ),
    ) === true
  );
}

function isRunAction(action: RunnerCoverageGoalAction): boolean {
  return [
    "start_run",
    "continue_run",
    "break_subroutine",
    "pump_breaker",
    "access_card",
  ].includes(action.type);
}

function resolution(
  fit: RunnerCoverageGoalFit,
  missingCoverageTypes: RunnerCoverageType[],
  resolvedCoverageTypes: RunnerCoverageType[],
  matchedGoalIds: string[],
  sideSafe: boolean,
  rationale: string,
): RunnerCoverageGoalResolution {
  return {
    fit,
    missingCoverageTypes,
    resolvedCoverageTypes,
    matchedGoalIds,
    sideSafe,
    rationale,
  };
}

function uniqueCoverage(
  coverageTypes: readonly RunnerCoverageType[],
): RunnerCoverageType[] {
  return [...new Set(coverageTypes)].sort();
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}
