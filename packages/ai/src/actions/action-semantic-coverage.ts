import type {
  ActionProjectionIssue,
  ActionSemanticCandidate,
} from "../action-semantic-candidate";
import {
  ACTION_SEMANTIC_CANDIDATE_COVERAGE_REPORT_VERSION,
  ACTION_SEMANTIC_COVERAGE_GROUPS,
  ACTION_SEMANTIC_TARGET_CONTEXT_STATUSES,
  type ActionSemanticCandidateCoverageRow,
  type ActionSemanticCandidateCoverageSourceInput,
  type ActionSemanticCandidateCoverageSourceSummary,
  type ActionSemanticCandidateCoverageSummary,
  type ActionSemanticCoverageGroup,
  type ActionSemanticTargetContextStatus,
} from "./action-semantic-coverage-contracts";

export * from "./action-semantic-coverage-contracts";
export { formatActionSemanticCandidateCoverageReport } from "./action-semantic-coverage-report";

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
    schemaGapRows: rows.filter((row) => row.projectionIssues.some(isSchemaGap))
      .length,
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
      rows.flatMap((row) => row.projectionIssues.filter(isSchemaGap)),
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
    schemaGapCount: rows.filter((row) => row.projectionIssues.some(isSchemaGap))
      .length,
    redactionUnsafeRows: rows.filter((row) => !row.redactionSafe).length,
  };
}

function isSchemaGap(issue: ActionProjectionIssue): boolean {
  return issue !== "hidden_info_blocked";
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
    candidate.actionType === "rez_card" ||
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

const forbiddenMarkerTokens = FORBIDDEN_REPORT_MARKERS.map((marker) => ({
  marker,
  tokens: forbiddenReportMarkerTokens(marker),
}));

function forbiddenMarkersIn(value: unknown): string[] {
  const tokens = forbiddenReportMarkerTokens(JSON.stringify(value));
  const tokenSet = new Set(tokens);
  return forbiddenMarkerTokens
    .filter(({ tokens: markerTokens }) =>
      markerTokens.length === 1
        ? tokenSet.has(markerTokens[0]!)
        : forbiddenReportTokensContainMarker(tokens, markerTokens),
    )
    .map(({ marker }) => marker);
}

function forbiddenReportTokensContainMarker(
  tokens: readonly string[],
  markerTokens: readonly string[],
): boolean {
  for (
    let index = 0;
    index <= tokens.length - markerTokens.length;
    index += 1
  ) {
    if (
      markerTokens.every((token, offset) => tokens[index + offset] === token)
    ) {
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
