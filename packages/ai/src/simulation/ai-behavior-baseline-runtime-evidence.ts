import type { PlanResolutionFailureOwner } from "../plans/plan-resolution-failure";
import type {
  AiSelfplayActionLimitClusterId,
  AiSelfplayActionLimitSubclusterId,
} from "./selfplay-trace-mining";
import {
  summarizeSelfplayActionLimitClusters,
  summarizeSelfplayActionLimitSubclusters,
} from "./selfplay-trace-mining";
import type { AiSimulationSummary } from "./ai-simulation-summary";

export type AiBehaviorActionLimitDiagnosis = {
  classified: boolean;
  owner: PlanResolutionFailureOwner | "unclassified";
  planInstanceId: string | "unclassified";
  stepId: string | "unclassified";
  noProgressCluster: AiSelfplayActionLimitClusterId;
  noProgressSubcluster: AiSelfplayActionLimitSubclusterId;
};

export function actionLimitDiagnosisForSimulation(
  summary: AiSimulationSummary,
): AiBehaviorActionLimitDiagnosis | undefined {
  if (summary.terminationKind !== "action_limit") {
    return undefined;
  }
  const noProgressCluster = activeRecordKey(
    summarizeSelfplayActionLimitClusters([summary]),
    "action_limit_mixed_or_unknown",
  );
  const noProgressSubcluster = activeRecordKey(
    summarizeSelfplayActionLimitSubclusters([summary]),
    "mixed_unknown",
  );
  const attributed = actionLimitAttributionEntry(summary);
  const owner = attributed ? actionLimitOwner(attributed) : "unclassified";
  const planInstanceId = attributed
    ? (firstEvidenceValue(attributed, [
        "plan_execution:instance:",
        "plan_first_executor:",
      ]) ??
      (attributed.planKind === "engine_window"
        ? "rules.window_resolution"
        : attributed.planKind) ??
      "unclassified")
    : "unclassified";
  const stepId = attributed
    ? (firstEvidenceValue(attributed, [
        "plan_execution:step:",
        "plan_step_id:",
      ]) ??
      (attributed.planKind === "engine_window"
        ? "rules.window_resolution"
        : "unclassified"))
    : "unclassified";
  return {
    classified:
      owner !== "unclassified" &&
      planInstanceId !== "unclassified" &&
      stepId !== "unclassified" &&
      noProgressCluster !== "action_limit_mixed_or_unknown" &&
      noProgressSubcluster !== "mixed_unknown",
    owner,
    planInstanceId,
    stepId,
    noProgressCluster,
    noProgressSubcluster,
  };
}

function actionLimitAttributionEntry(
  summary: AiSimulationSummary,
): AiSimulationSummary["actionSequence"][number] | undefined {
  const last = summary.actionSequence.at(-1);
  const tail = summary.actionSequence.slice(-40);
  const roots = tail.flatMap((entry, index) => {
    if (
      entry.side !== "runner" ||
      entry.actionType !== "start_run" ||
      entry.planKind !== "runner.pressure_central"
    ) {
      return [];
    }
    const planInstanceId =
      firstEvidenceValue(entry, [
        "plan_execution:instance:",
        "plan_first_executor:",
      ]) ?? entry.planKind;
    return planInstanceId ? [{ entry, index, planInstanceId }] : [];
  });
  const groups = new Map<
    string,
    {
      count: number;
      lastIndex: number;
      planInstanceId: string;
      entry: AiSimulationSummary["actionSequence"][number];
    }
  >();
  for (const root of roots) {
    const previous = groups.get(root.planInstanceId);
    groups.set(root.planInstanceId, {
      count: (previous?.count ?? 0) + 1,
      lastIndex: root.index,
      planInstanceId: root.planInstanceId,
      entry: root.entry,
    });
  }
  const dominant = [...groups.values()].sort(
    (left, right) =>
      right.count - left.count || right.lastIndex - left.lastIndex,
  )[0];
  if (!dominant || dominant.count < 3) return last;
  const cycleRoots = roots.filter(
    (root) => root.planInstanceId === dominant.planInstanceId,
  );
  const firstCycleIndex = cycleRoots[0]?.index;
  const lastCycleIndex = cycleRoots.at(-1)?.index;
  if (firstCycleIndex === undefined || lastCycleIndex === undefined)
    return last;
  if (
    tail.slice(firstCycleIndex + 1).some(actionLimitEntryIsValueProgression)
  ) {
    return last;
  }
  if (
    !tail.slice(lastCycleIndex).every(actionLimitEntryBelongsToRunWindowCycle)
  ) {
    return last;
  }
  return dominant.entry;
}

function actionLimitEntryIsValueProgression(
  entry: AiSimulationSummary["actionSequence"][number],
): boolean {
  return (
    entry.actionType === "steal_agenda" ||
    entry.actionType === "trash_accessed_card" ||
    entry.actionType === "score_agenda"
  );
}

function actionLimitEntryBelongsToRunWindowCycle(
  entry: AiSimulationSummary["actionSequence"][number],
): boolean {
  if (
    entry.planKind === "runner.pressure_central" &&
    entry.side === "runner" &&
    entry.actionType === "start_run"
  ) {
    return true;
  }
  if (entry.planKind === "runner.convert_run_window") {
    return (
      entry.side === "runner" &&
      (entry.actionType === "continue_run" ||
        entry.actionType === "access_card" ||
        entry.actionType === "decline_trash" ||
        entry.actionType === "jack_out")
    );
  }
  if (entry.planKind === "corp.defend_servers") {
    return (
      entry.side === "corp" &&
      (entry.actionType === "decline_rez" ||
        entry.actionType === "rez_ice" ||
        entry.actionType === "rez_card")
    );
  }
  return (
    entry.planKind === "engine_window" &&
    (entry.actionType === "continue_run" ||
      entry.actionType === "access_card" ||
      entry.actionType === "decline_rez")
  );
}

function actionLimitOwner(
  entry: AiSimulationSummary["actionSequence"][number],
): PlanResolutionFailureOwner | "unclassified" {
  const explicit = firstEvidenceValue(entry, ["plan_resolution_owner:"]);
  if (isPlanResolutionFailureOwner(explicit)) return explicit;
  if (
    entry.planKind === "engine_window" ||
    entry.evidence.includes("plan_first_lane:engine_window")
  ) {
    return "window_resolution";
  }
  if (
    entry.planKind ||
    entry.evidence.some((value) => value.startsWith("plan_module:"))
  ) {
    return "plan_module";
  }
  return "unclassified";
}

function firstEvidenceValue(
  entry: AiSimulationSummary["actionSequence"][number],
  prefixes: readonly string[],
): string | undefined {
  for (const prefix of prefixes) {
    const match = entry.evidence.find((value) => value.startsWith(prefix));
    if (match) return match.slice(prefix.length);
  }
  return undefined;
}

function activeRecordKey<Key extends string>(
  counts: Record<Key, number>,
  fallback: Key,
): Key {
  return (
    ((Object.entries(counts) as Array<[Key, number]>).find(
      ([, count]) => count > 0,
    )?.[0] as Key | undefined) ?? fallback
  );
}

function isPlanResolutionFailureOwner(
  value: string | undefined,
): value is PlanResolutionFailureOwner {
  return (
    value === "rules_contract" ||
    value === "window_resolution" ||
    value === "plan_registry" ||
    value === "action_semantics" ||
    value === "plan_module" ||
    value === "priority_policy" ||
    value === "resource_ledger" ||
    value === "support_graph" ||
    value === "continuation" ||
    value === "scheduler"
  );
}
