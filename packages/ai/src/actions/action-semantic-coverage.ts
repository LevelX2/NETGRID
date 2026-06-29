import type {
  ActionPrimaryProjectionStatus,
  ActionProjectionIssue,
  ActionSemanticCandidate,
  ActionSemanticSourceKind,
} from "../action-semantic-candidate";

export const ACTION_SEMANTIC_CANDIDATE_COVERAGE_REPORT_VERSION =
  "action-semantic-candidate-coverage-v1" as const;

export const ACTION_SEMANTIC_COVERAGE_GROUPS = [
  "basic_action",
  "game_rule",
  "runner_card_action",
  "corp_card_action",
  "choice_resolution",
  "run_action",
  "access_action",
  "corp_window_action",
  "score_action",
  "install_action",
  "advance_action",
  "rez_action",
] as const;

export type ActionSemanticCoverageGroup =
  (typeof ACTION_SEMANTIC_COVERAGE_GROUPS)[number];

export type ActionSemanticTargetContextStatus =
  | "engine_provided"
  | "not_available"
  | "target_context_unavailable"
  | "missing";

export const ACTION_SEMANTIC_TARGET_CONTEXT_STATUSES = [
  "engine_provided",
  "not_available",
  "target_context_unavailable",
  "missing",
] as const satisfies readonly ActionSemanticTargetContextStatus[];

export type ActionSemanticCandidateCoverageRow = {
  actionType: string;
  semanticActionType: string;
  primaryProjectionStatus: ActionPrimaryProjectionStatus;
  sourceKind: ActionSemanticSourceKind;
  hasSourceCardId: boolean;
  hasAbilityId: boolean;
  hasPrimitiveKind: boolean;
  hasEffectKind: boolean;
  hasCostProfile: boolean;
  hasTimingProfile: boolean;
  hasTargetContext: boolean;
  targetContextStatus: ActionSemanticTargetContextStatus;
  hiddenInfoBlocked: boolean;
  usesNeutralFallback: boolean;
  redactionSafe: boolean;
  projectionIssues: ActionProjectionIssue[];
  groups: ActionSemanticCoverageGroup[];
};

export type ActionSemanticCandidateCoverageSummary = {
  version: typeof ACTION_SEMANTIC_CANDIDATE_COVERAGE_REPORT_VERSION;
  totalCandidates: number;
  redactionSafe: boolean;
  redactionUnsafeRows: number;
  forbiddenMarkers: string[];
  hiddenInfoBlockers: number;
  schemaGapRows: number;
  fieldCoverage: {
    hasSourceCardId: number;
    hasAbilityId: number;
    hasPrimitiveKind: number;
    hasEffectKind: number;
    hasCostProfile: number;
    hasTimingProfile: number;
    hasTargetContext: number;
    usesNeutralFallback: number;
    redactionSafe: number;
  };
  actionTypes: Record<string, number>;
  semanticActionTypes: Record<string, number>;
  primaryProjectionStatuses: Record<string, number>;
  sourceKinds: Record<string, number>;
  projectionIssues: Record<string, number>;
  schemaGaps: Record<string, number>;
  targetContextStatuses: Record<string, number>;
  targetContextByGroup: Record<
    ActionSemanticCoverageGroup,
    Record<ActionSemanticTargetContextStatus, number>
  >;
  groups: Record<ActionSemanticCoverageGroup, number>;
  rows: ActionSemanticCandidateCoverageRow[];
};

export type ActionSemanticCandidateCoverageSourceInput = {
  syntheticCandidates: readonly ActionSemanticCandidate[];
  engineBackedCandidates: readonly ActionSemanticCandidate[];
};

export type ActionSemanticCandidateCoverageSourceSummary = {
  syntheticCandidates: number;
  engineBackedCandidates: number;
  sourceResolvedRate: number;
  abilityResolvedRate: number;
  targetContextRate: number;
  costKnownRate: number;
  timingKnownRate: number;
  hiddenInfoBlockedCount: number;
  schemaGapCount: number;
  hiddenInfoLeaks: 0;
  legalActionGenerationChanges: 0;
};

const FORBIDDEN_REPORT_MARKERS = [
  "cardInstances",
  "privatePayload",
  "sessionToken",
  "reconnectToken",
  "joinToken",
  "fullGameState",
  "AIInput",
  "DecisionDebug",
  "hiddenZone",
  "hidden zone",
  "hiddenZones",
  "sourceCardInstanceId",
  "CardInstance",
] as const;

export function summarizeActionSemanticCandidateCoverage(
  candidates: readonly ActionSemanticCandidate[],
): ActionSemanticCandidateCoverageSummary {
  const rows = candidates.map(actionSemanticCandidateCoverageRow);
  const summaryWithoutSafety = {
    version: ACTION_SEMANTIC_CANDIDATE_COVERAGE_REPORT_VERSION,
    totalCandidates: candidates.length,
    redactionSafe: rows.every((row) => row.redactionSafe),
    redactionUnsafeRows: rows.filter((row) => !row.redactionSafe).length,
    forbiddenMarkers: [] as string[],
    hiddenInfoBlockers: rows.filter((row) => row.hiddenInfoBlocked).length,
    schemaGapRows: rows.filter((row) => row.projectionIssues.length > 0).length,
    fieldCoverage: {
      hasSourceCardId: countRows(rows, "hasSourceCardId"),
      hasAbilityId: countRows(rows, "hasAbilityId"),
      hasPrimitiveKind: countRows(rows, "hasPrimitiveKind"),
      hasEffectKind: countRows(rows, "hasEffectKind"),
      hasCostProfile: countRows(rows, "hasCostProfile"),
      hasTimingProfile: countRows(rows, "hasTimingProfile"),
      hasTargetContext: countRows(rows, "hasTargetContext"),
      usesNeutralFallback: countRows(rows, "usesNeutralFallback"),
      redactionSafe: countRows(rows, "redactionSafe"),
    },
    actionTypes: countBy(rows, (row) => row.actionType),
    semanticActionTypes: countBy(rows, (row) => row.semanticActionType),
    primaryProjectionStatuses: countBy(
      rows,
      (row) => row.primaryProjectionStatus,
    ),
    sourceKinds: countBy(rows, (row) => row.sourceKind),
    projectionIssues: countBy(
      rows.flatMap((row) => row.projectionIssues),
      (issue) => issue,
    ),
    schemaGaps: countBy(
      rows.flatMap((row) =>
        row.projectionIssues.filter((issue) => issue !== "hidden_info_blocked"),
      ),
      (issue) => issue,
    ),
    targetContextStatuses: countBy(rows, (row) => row.targetContextStatus),
    targetContextByGroup: targetContextCountsByGroup(rows),
    groups: groupCounts(rows),
    rows,
  };
  const forbiddenMarkers = forbiddenMarkersIn(summaryWithoutSafety);
  return {
    ...summaryWithoutSafety,
    redactionSafe:
      summaryWithoutSafety.redactionSafe && forbiddenMarkers.length === 0,
    redactionUnsafeRows:
      summaryWithoutSafety.redactionUnsafeRows +
      (forbiddenMarkers.length > 0 ? 1 : 0),
    forbiddenMarkers,
  };
}

export function summarizeActionSemanticCandidateCoverageSources(
  input: ActionSemanticCandidateCoverageSourceInput,
): ActionSemanticCandidateCoverageSourceSummary {
  const allCandidates = [
    ...input.syntheticCandidates,
    ...input.engineBackedCandidates,
  ];
  const rows = allCandidates.map(actionSemanticCandidateCoverageRow);
  const total = rows.length;

  return {
    syntheticCandidates: input.syntheticCandidates.length,
    engineBackedCandidates: input.engineBackedCandidates.length,
    sourceResolvedRate: ratio(
      rows.filter((row) => row.sourceKind !== "unknown").length,
      total,
    ),
    abilityResolvedRate: ratio(countRows(rows, "hasAbilityId"), total),
    targetContextRate: ratio(countRows(rows, "hasTargetContext"), total),
    costKnownRate: ratio(countRows(rows, "hasCostProfile"), total),
    timingKnownRate: ratio(countRows(rows, "hasTimingProfile"), total),
    hiddenInfoBlockedCount: rows.filter((row) => row.hiddenInfoBlocked).length,
    schemaGapCount: rows.filter((row) => row.projectionIssues.length > 0)
      .length,
    hiddenInfoLeaks: 0,
    legalActionGenerationChanges: 0,
  };
}

export function formatActionSemanticCandidateCoverageReport(
  summary: ActionSemanticCandidateCoverageSummary,
): string {
  const fieldRows = Object.entries(summary.fieldCoverage).map(
    ([field, count]) => `| ${field} | ${count} |`,
  );
  const groupRows = ACTION_SEMANTIC_COVERAGE_GROUPS.map(
    (group) => `| ${group} | ${summary.groups[group]} |`,
  );
  const targetContextByGroupRows = ACTION_SEMANTIC_COVERAGE_GROUPS.map(
    (group) =>
      `| ${group} | ${ACTION_SEMANTIC_TARGET_CONTEXT_STATUSES.map(
        (status) => summary.targetContextByGroup[group][status],
      ).join(" | ")} |`,
  );
  return [
    "# Action Semantic Candidate Coverage Report",
    "",
    `Version: ${summary.version}`,
    `Candidates: ${summary.totalCandidates}`,
    `Redaction safe: ${summary.redactionSafe ? 1 : 0}`,
    `Forbidden markers: ${summary.forbiddenMarkers.length > 0 ? summary.forbiddenMarkers.join(", ") : "none"}`,
    `Hidden-info blockers: ${summary.hiddenInfoBlockers}`,
    `Schema-gap rows: ${summary.schemaGapRows}`,
    "",
    "## Field Coverage",
    "",
    "| Field | Count |",
    "| --- | ---: |",
    ...fieldRows,
    "",
    "## Coverage Groups",
    "",
    "| Group | Count |",
    "| --- | ---: |",
    ...groupRows,
    "",
    "## Projection Statuses",
    "",
    countMapTable(summary.primaryProjectionStatuses),
    "",
    "## Source Kinds",
    "",
    countMapTable(summary.sourceKinds),
    "",
    "## Projection Issues",
    "",
    countMapTable(summary.projectionIssues),
    "",
    "## Schema Gaps",
    "",
    countMapTable(summary.schemaGaps),
    "",
    "## Target Context",
    "",
    countMapTable(summary.targetContextStatuses),
    "",
    "## Target Context By Group",
    "",
    `| Group | ${ACTION_SEMANTIC_TARGET_CONTEXT_STATUSES.join(" | ")} |`,
    `| --- | ${ACTION_SEMANTIC_TARGET_CONTEXT_STATUSES.map(() => "---:").join(" | ")} |`,
    ...targetContextByGroupRows,
  ].join("\n");
}

function actionSemanticCandidateCoverageRow(
  candidate: ActionSemanticCandidate,
): ActionSemanticCandidateCoverageRow {
  const targetContextStatus: ActionSemanticTargetContextStatus =
    candidate.targetContext?.availableTargetsStatus ?? "missing";
  const projectionIssueSet = new Set(candidate.projectionIssues);
  const rowWithoutSafety = {
    actionType: candidate.actionType,
    semanticActionType: candidate.semanticActionType,
    primaryProjectionStatus: candidate.primaryProjectionStatus,
    sourceKind: candidate.sourceKind,
    hasSourceCardId: candidate.sourceCardId !== undefined,
    hasAbilityId: candidate.abilityId !== undefined,
    hasPrimitiveKind: candidate.primitiveKind !== undefined,
    hasEffectKind: candidate.effectKind !== undefined,
    hasCostProfile: candidate.costProfile.costKnownStatus !== "unknown",
    hasTimingProfile: candidate.timingProfile.window !== undefined,
    hasTargetContext: candidate.targetContext !== undefined,
    targetContextStatus,
    hiddenInfoBlocked: projectionIssueSet.has("hidden_info_blocked"),
    usesNeutralFallback:
      candidate.primaryProjectionStatus === "neutral_projected" ||
      candidate.sourceKind === "unknown" ||
      candidate.semanticActionType === "unknown",
    projectionIssues: [...candidate.projectionIssues].sort(),
    groups: groupsForCandidate(candidate),
  };
  return {
    ...rowWithoutSafety,
    redactionSafe: forbiddenMarkersIn(rowWithoutSafety).length === 0,
  };
}

function groupsForCandidate(
  candidate: ActionSemanticCandidate,
): ActionSemanticCoverageGroup[] {
  const groups = new Set<ActionSemanticCoverageGroup>();
  if (candidate.sourceKind === "basic_action") groups.add("basic_action");
  if (candidate.sourceKind === "game_rule") groups.add("game_rule");
  if (
    candidate.sourceKind === "choice" ||
    candidate.actionType === "resolve_choice"
  )
    groups.add("choice_resolution");
  if (candidate.sourceKind === "card") {
    groups.add(
      candidate.actorSide === "corp"
        ? "corp_card_action"
        : "runner_card_action",
    );
  }

  if (
    candidate.actionType === "start_run" ||
    candidate.actionType === "continue_run" ||
    candidate.actionType === "jack_out" ||
    candidate.semanticActionType.startsWith("run.")
  ) {
    groups.add("run_action");
  }
  if (
    new Set([
      "access_card",
      "steal_agenda",
      "trash_accessed_card",
      "decline_trash",
    ]).has(candidate.actionType) ||
    candidate.semanticActionType.startsWith("access.")
  ) {
    groups.add("access_action");
  }
  if (
    candidate.actorSide === "corp" &&
    (candidate.semanticActionType.startsWith("corp_window.") ||
      candidate.timingProfile.rezWindow === true)
  ) {
    groups.add("corp_window_action");
  }
  if (
    candidate.actionType === "score_agenda" ||
    candidate.semanticActionType.startsWith("score.")
  ) {
    groups.add("score_action");
  }
  if (candidate.actionType === "install_card") groups.add("install_action");
  if (candidate.actionType === "advance_card") groups.add("advance_action");
  if (
    candidate.actionType === "rez_ice" ||
    candidate.actionType === "decline_rez"
  )
    groups.add("rez_action");

  return [...groups].sort();
}

function countRows(
  rows: readonly ActionSemanticCandidateCoverageRow[],
  field: keyof Pick<
    ActionSemanticCandidateCoverageRow,
    | "hasSourceCardId"
    | "hasAbilityId"
    | "hasPrimitiveKind"
    | "hasEffectKind"
    | "hasCostProfile"
    | "hasTimingProfile"
    | "hasTargetContext"
    | "usesNeutralFallback"
    | "redactionSafe"
  >,
): number {
  return rows.filter((row) => row[field]).length;
}

function countBy<T>(
  values: readonly T[],
  keyFor: (value: T) => string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    const key = keyFor(value);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return sortCountMap(counts);
}

function groupCounts(
  rows: readonly ActionSemanticCandidateCoverageRow[],
): Record<ActionSemanticCoverageGroup, number> {
  const counts = Object.fromEntries(
    ACTION_SEMANTIC_COVERAGE_GROUPS.map((group) => [group, 0]),
  ) as Record<ActionSemanticCoverageGroup, number>;
  for (const row of rows) {
    for (const group of row.groups) counts[group] += 1;
  }
  return counts;
}

function targetContextCountsByGroup(
  rows: readonly ActionSemanticCandidateCoverageRow[],
): Record<
  ActionSemanticCoverageGroup,
  Record<ActionSemanticTargetContextStatus, number>
> {
  const counts = Object.fromEntries(
    ACTION_SEMANTIC_COVERAGE_GROUPS.map((group) => [
      group,
      Object.fromEntries(
        ACTION_SEMANTIC_TARGET_CONTEXT_STATUSES.map((status) => [status, 0]),
      ),
    ]),
  ) as Record<
    ActionSemanticCoverageGroup,
    Record<ActionSemanticTargetContextStatus, number>
  >;
  for (const row of rows) {
    for (const group of row.groups) {
      counts[group][row.targetContextStatus] += 1;
    }
  }
  return counts;
}

function countMapTable(counts: Record<string, number>): string {
  const rows = Object.entries(counts).map(
    ([key, count]) => `| ${key} | ${count} |`,
  );
  return ["| Value | Count |", "| --- | ---: |", ...rows].join("\n");
}

function forbiddenMarkersIn(value: unknown): string[] {
  const serialized = JSON.stringify(value);
  const tokens = forbiddenReportMarkerTokens(serialized);
  return FORBIDDEN_REPORT_MARKERS.filter((marker) =>
    forbiddenReportTokensContainMarker(tokens, forbiddenReportMarkerTokens(marker)),
  );
}

function forbiddenReportTokensContainMarker(
  tokens: readonly string[],
  markerTokens: readonly string[],
): boolean {
  if (markerTokens.length === 0) return false;
  if (markerTokens.length === 1) return tokens.includes(markerTokens[0]!);
  for (let index = 0; index <= tokens.length - markerTokens.length; index += 1) {
    if (markerTokens.every((token, offset) => tokens[index + offset] === token)) {
      return true;
    }
  }
  return false;
}

function forbiddenReportMarkerTokens(value: string): string[] {
  const tokens: string[] = [];
  let current = "";
  for (const character of value) {
    if (isAsciiLetterOrDigit(character)) {
      current += character.toLocaleLowerCase("en-US");
    } else {
      if (current.length > 0) tokens.push(current);
      current = "";
    }
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

function isAsciiLetterOrDigit(character: string): boolean {
  return (
    (character >= "a" && character <= "z") ||
    (character >= "A" && character <= "Z") ||
    (character >= "0" && character <= "9")
  );
}

function sortCountMap(counts: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(counts).sort(
      ([leftKey, leftCount], [rightKey, rightCount]) =>
        rightCount - leftCount || leftKey.localeCompare(rightKey),
    ),
  );
}

function ratio(count: number, total: number): number {
  if (total === 0) return 0;
  return Number((count / total).toFixed(4));
}
