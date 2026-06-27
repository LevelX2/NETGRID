import type {
  ActionRunProjectionSummary,
  ActionSemanticCandidate,
} from "../action-semantic-candidate";
import type { RunnerRunTargetKind } from "../runner-run-target-evaluation";

export type RunTargetActionAlignment = {
  actionId: string;
  serverId?: string;
  targetKind?: RunnerRunTargetKind;
  runTargetId?: string;
  source?: ActionRunProjectionSummary["source"] | "evidence";
  aligned: boolean;
  evidence: string[];
};

export type RunTargetActionAlignmentTarget = {
  targetServerId?: string;
  targetId?: string;
  targetKind?: RunnerRunTargetKind;
};

export function alignRunTargetAction(
  candidate: ActionSemanticCandidate,
  target: RunTargetActionAlignmentTarget,
): RunTargetActionAlignment {
  const runTargetId = normalizeServerId(target.targetServerId ?? target.targetId);
  const candidateServers = candidateRunServers(candidate);
  const candidateServerIds = candidateServers.serverIds;
  const aligned =
    candidate.semanticActionType === "run.start" &&
    runTargetId !== undefined &&
    candidateServerIds.includes(runTargetId);
  const serverId = candidateServerIds[0];
  return {
    actionId: candidate.actionId,
    ...(serverId ? { serverId } : {}),
    ...(target.targetKind ? { targetKind: target.targetKind } : {}),
    ...(runTargetId ? { runTargetId } : {}),
    ...(candidateServers.source ? { source: candidateServers.source } : {}),
    aligned,
    evidence: [
      `candidate_semantic:${candidate.semanticActionType}`,
      ...(serverId ? [`candidate_server:${serverId}`] : ["candidate_server:none"]),
      ...(candidateServers.source
        ? [`candidate_server_source:${candidateServers.source}`]
        : ["candidate_server_source:none"]),
      ...(runTargetId ? [`run_target:${runTargetId}`] : ["run_target:none"]),
      `aligned:${aligned}`,
    ],
  };
}

function candidateRunServers(candidate: ActionSemanticCandidate): {
  serverIds: string[];
  source?: ActionRunProjectionSummary["source"] | "evidence";
} {
  const fromSummary = normalizeServerId(candidate.runProjectionSummary?.serverId);
  if (fromSummary) {
    return {
      serverIds: [fromSummary],
      source: candidate.runProjectionSummary?.source ?? "run_action_projection",
    };
  }
  const fromTargets = [
    ...(candidate.targetContext?.selectedTargets ?? []),
    ...(candidate.targetContext?.availableTargets ?? []),
  ]
    .filter((target) => target.targetKind === "server")
    .map((target) => normalizeServerId(target.targetId))
    .filter((targetId): targetId is string => targetId !== undefined);
  if (fromTargets.length > 0) {
    return {
      serverIds: uniqueStrings(fromTargets),
      source: "target_context",
    };
  }
  const fromEvidence = candidate.evidence
    .flatMap((entry) => [
      parseEvidenceServer(entry, "run_action_projection_target:"),
      parseEvidenceServer(entry, "target:"),
      parseEvidenceServer(entry, "server:"),
    ])
    .filter((targetId): targetId is string => targetId !== undefined);
  return {
    serverIds: uniqueStrings(fromEvidence),
    ...(fromEvidence.length > 0 ? { source: "evidence" as const } : {}),
  };
}

function parseEvidenceServer(
  entry: string,
  prefix: string,
): string | undefined {
  if (!entry.toLowerCase().startsWith(prefix)) return undefined;
  return normalizeServerId(entry.slice(prefix.length));
}

function normalizeServerId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase().replace(/^server[:.]/, "");
  if (normalized === "hq") return "hq";
  if (
    normalized === "rd" ||
    normalized === "rnd" ||
    normalized === "r&d" ||
    normalized === "r_d"
  ) {
    return "rd";
  }
  if (normalized === "archives") {
    return "archives";
  }
  const remoteMatch = normalized.match(/^remote[_-](\d+)$/);
  if (remoteMatch?.[1]) return `remote_${remoteMatch[1]}`;
  return undefined;
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
