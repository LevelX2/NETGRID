import type { Side } from "@netgrid/shared";
import type { AiSimulationSummary } from "./ai-simulation-summary";

export type AiSelfplayActionTypeDominanceStatus =
  | "complete"
  | "insufficient_sample"
  | "dominance_review_required";

export type AiSelfplayActionTypeDominanceBucket = {
  side: Side | "all";
  decisions: number;
  topActionType?: string;
  topShare: number;
  status: AiSelfplayActionTypeDominanceStatus;
};

export type AiSelfplayActionTypeDominanceRow = {
  side: Side | "all";
  actionType: string;
  count: number;
  share: number;
};

export type AiSelfplayActionTypeDominanceReport = {
  schemaVersion: "ai-selfplay-action-type-dominance-v1";
  threshold: number;
  minDecisions: number;
  status: AiSelfplayActionTypeDominanceStatus;
  decisions: number;
  topShare: number;
  findings: string[];
  bySide: Record<Side | "all", AiSelfplayActionTypeDominanceBucket>;
  topRows: AiSelfplayActionTypeDominanceRow[];
};

export function buildSelfplayActionTypeDominanceReport(
  summaries: readonly AiSimulationSummary[],
  options: { threshold?: number; minDecisions?: number; maxRows?: number } = {},
): AiSelfplayActionTypeDominanceReport {
  const threshold = options.threshold ?? 0.7;
  const minDecisions = options.minDecisions ?? 10;
  const maxRows = options.maxRows ?? 12;
  const rows = ["all", "runner", "corp"].flatMap((side) =>
    actionTypeRowsForSide(summaries, side as Side | "all"),
  );
  const bySide = {
    all: bucketForSide(rows, "all", threshold, minDecisions),
    runner: bucketForSide(rows, "runner", threshold, minDecisions),
    corp: bucketForSide(rows, "corp", threshold, minDecisions),
  };
  const findings = Object.values(bySide)
    .filter((bucket) => bucket.status === "dominance_review_required")
    .map(
      (bucket) =>
        `${bucket.side}:${bucket.topActionType ?? "none"}_share:${roundShare(bucket.topShare)}`,
    );
  const status =
    findings.length > 0
      ? "dominance_review_required"
      : bySide.all.status === "insufficient_sample"
        ? "insufficient_sample"
        : "complete";

  return {
    schemaVersion: "ai-selfplay-action-type-dominance-v1",
    threshold,
    minDecisions,
    status,
    decisions: bySide.all.decisions,
    topShare: bySide.all.topShare,
    findings,
    bySide,
    topRows: rows
      .sort(
        (left, right) =>
          right.share - left.share ||
          right.count - left.count ||
          left.side.localeCompare(right.side) ||
          left.actionType.localeCompare(right.actionType),
      )
      .slice(0, maxRows),
  };
}

function actionTypeRowsForSide(
  summaries: readonly AiSimulationSummary[],
  side: Side | "all",
): AiSelfplayActionTypeDominanceRow[] {
  const counts = new Map<string, number>();
  let decisions = 0;
  for (const summary of summaries) {
    for (const entry of summary.actionSequence) {
      if (side !== "all" && entry.side !== side) continue;
      decisions += 1;
      counts.set(entry.actionType, (counts.get(entry.actionType) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([actionType, count]) => ({
      side,
      actionType,
      count,
      share: decisions > 0 ? roundShare(count / decisions) : 0,
    }))
    .sort(
      (left, right) =>
        right.count - left.count || left.actionType.localeCompare(right.actionType),
    );
}

function bucketForSide(
  rows: readonly AiSelfplayActionTypeDominanceRow[],
  side: Side | "all",
  threshold: number,
  minDecisions: number,
): AiSelfplayActionTypeDominanceBucket {
  const sideRows = rows.filter((row) => row.side === side);
  const decisions = sideRows.reduce((total, row) => total + row.count, 0);
  const top = sideRows[0];
  const topShare = top?.share ?? 0;
  return {
    side,
    decisions,
    ...(top ? { topActionType: top.actionType } : {}),
    topShare,
    status:
      decisions < minDecisions
        ? "insufficient_sample"
        : topShare > threshold
          ? "dominance_review_required"
          : "complete",
  };
}

function roundShare(value: number): number {
  return Math.round(value * 1000) / 1000;
}
