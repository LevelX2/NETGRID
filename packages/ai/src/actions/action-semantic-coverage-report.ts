import {
  ACTION_SEMANTIC_COVERAGE_GROUPS,
  ACTION_SEMANTIC_TARGET_CONTEXT_STATUSES,
  type ActionSemanticCandidateCoverageSummary,
} from "./action-semantic-coverage-contracts";

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

function countMapTable(counts: Record<string, number>): string {
  const rows = Object.entries(counts).map(
    ([key, count]) => `| ${key} | ${count} |`,
  );
  return ["| Value | Count |", "| --- | ---: |", ...rows].join("\n");
}
