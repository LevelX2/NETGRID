import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  buildSemanticActionSignature,
  type SemanticActionSignature,
} from "../packages/ai/src/semantic-action-signature";

type Ai159Mining = {
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    firstProgressAction?: OpportunityAction | null;
    precedingSameSideDecision?: OpportunityAction | null;
    category: string;
  }>;
};

type OpportunityAction = {
  actionIndex: number;
  side: "runner" | "corp";
  actionType: string;
  progressLabel: string;
};

type SourceTrace = {
  matrix: Array<{
    pair: { id: string };
    summaries: Array<{
      seed: string;
      actionAlternativeSnapshots?: OpportunitySnapshot[];
    }>;
  }>;
};

type OpportunitySnapshot = {
  actionIndex: number;
  side: "runner" | "corp";
  stateVersionBefore: number;
  selectedActionType: string;
  alternatives: Array<{
    rank?: number;
    actionType: string;
    semanticActionType: string;
    selected?: boolean;
    sourceKind?: string;
    sourceDefinitionId?: string;
    abilityId?: string;
    scoreKeys: string[];
    hardGates: string[];
    targetContextStatus: string;
    expectedProgressLabel: string;
    blockedReason?: string;
    whyChosen: string[];
    whyNot: string[];
    economy?: unknown;
    semanticActionSignature?: SemanticActionSignature;
  }>;
};

const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug|deckTop|decklist|deckOrder/i;

const repoRoot = findRepoRoot(process.cwd());
const mining = readJson<Ai159Mining>("docs/reviews/ai/ai159-opportunity-state-mining-2026-06-12.json");
const source = readJson<SourceTrace>("docs/reviews/ai/ai170-source-x10-alternatives-2026-06-13.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai170-opportunity-state-snapshot-instrumentation-2026-06-13.md");

const sourceByCase = new Map<string, SourceTrace["matrix"][number]["summaries"][number]>();
for (const entry of source.matrix) {
  const pairId = entry.pair.id.toUpperCase();
  for (const summary of entry.summaries) {
    sourceByCase.set(`${pairId}-${summary.seed}`, summary);
  }
}

const cases = mining.cases.map((entry) => {
  const summary = sourceByCase.get(entry.caseId);
  const requestedActions = [
    requestedAction("preceding_same_side_decision", entry.precedingSameSideDecision),
    requestedAction("first_progress_action", entry.firstProgressAction),
  ].filter((value): value is ReturnType<typeof requestedAction> & { action: OpportunityAction } =>
    Boolean(value?.action),
  );
  const snapshots = requestedActions.map((request) => {
    const snapshot = summary?.actionAlternativeSnapshots?.find(
      (candidate) => candidate.actionIndex === request.action.actionIndex,
    );
    return {
      requestKind: request.requestKind,
      requestedAction: request.action,
      snapshotAvailable: Boolean(snapshot),
      ...(snapshot
        ? {
            snapshot: compactSnapshot(snapshot),
            proofSummary: proofSummaryForSnapshot(snapshot),
          }
        : {
            blocker: "snapshot_missing_at_requested_index",
          }),
    };
  });
  return {
    caseId: entry.caseId,
    dominantSubcluster: entry.dominantSubcluster,
    ai159Category: entry.category,
    requestedSnapshotCount: requestedActions.length,
    availableSnapshotCount: snapshots.filter((snapshot) => snapshot.snapshotAvailable).length,
    snapshots,
  };
});

const output = {
  schemaVersion: "ai170-opportunity-state-snapshots-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai159: "docs/reviews/ai/ai159-opportunity-state-mining-2026-06-12.json",
    sourceTrace: "docs/reviews/ai/ai170-source-x10-alternatives-2026-06-13.json",
  },
  redaction: scanRedaction({ cases }),
  aggregate: {
    cases: cases.length,
    requestedSnapshots: sum(cases, (entry) => entry.requestedSnapshotCount),
    availableSnapshots: sum(cases, (entry) => entry.availableSnapshotCount),
    alternativesWithSemanticActionSignature: sum(cases, (entry) =>
      entry.snapshots.reduce(
        (count, snapshot) =>
          count +
          (snapshot.snapshotAvailable && "snapshot" in snapshot
            ? snapshot.snapshot.alternatives.filter(
                (alternative) => alternative.semanticActionSignature !== undefined,
              ).length
            : 0),
        0,
      ),
    ),
    ai159TargetContextMissingCasesWithSnapshots: cases.filter(
      (entry) =>
        entry.ai159Category === "opportunity_target_context_missing" &&
        entry.availableSnapshotCount > 0,
    ).length,
    casesWithProgressAlternative: cases.filter((entry) =>
      entry.snapshots.some((snapshot) =>
        "proofSummary" in snapshot ? snapshot.proofSummary.progressAlternatives > 0 : false,
      ),
    ).length,
  },
  cases,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function requestedAction(requestKind: string, action: OpportunityAction | null | undefined) {
  return action ? { requestKind, action } : undefined;
}

function compactSnapshot(snapshot: OpportunitySnapshot): OpportunitySnapshot {
  return {
    actionIndex: snapshot.actionIndex,
    side: snapshot.side,
    stateVersionBefore: snapshot.stateVersionBefore,
    selectedActionType: snapshot.selectedActionType,
    alternatives: snapshot.alternatives.map((alternative) => ({
      ...(alternative.rank !== undefined ? { rank: alternative.rank } : {}),
      actionType: alternative.actionType,
      semanticActionType: alternative.semanticActionType,
      ...(alternative.selected !== undefined ? { selected: alternative.selected } : {}),
      ...(alternative.sourceKind ? { sourceKind: alternative.sourceKind } : {}),
      ...(alternative.sourceDefinitionId ? { sourceDefinitionId: alternative.sourceDefinitionId } : {}),
      ...(alternative.abilityId ? { abilityId: alternative.abilityId } : {}),
      semanticActionSignature: signatureForAlternative(alternative),
      scoreKeys: alternative.scoreKeys,
      hardGates: alternative.hardGates,
      targetContextStatus: alternative.targetContextStatus,
      expectedProgressLabel: alternative.expectedProgressLabel,
      ...(alternative.blockedReason ? { blockedReason: alternative.blockedReason } : {}),
      whyChosen: alternative.whyChosen,
      whyNot: alternative.whyNot,
      ...(alternative.economy !== undefined ? { economy: alternative.economy } : {}),
    })),
  };
}

function signatureForAlternative(
  alternative: OpportunitySnapshot["alternatives"][number],
): SemanticActionSignature {
  return buildSemanticActionSignature({
    actionType: alternative.actionType,
    semanticActionType: alternative.semanticActionType,
    sourceKind: alternative.sourceKind ?? "unknown",
    ...(alternative.sourceDefinitionId ? { sourceDefinitionId: alternative.sourceDefinitionId } : {}),
    ...(alternative.abilityId ? { abilityId: alternative.abilityId } : {}),
    targetIdentity: targetIdentitySeedForAlternative(alternative),
    costClass: costClassForAlternative(alternative),
    timingClass: timingClassForAlternative(alternative),
  });
}

function targetIdentitySeedForAlternative(
  alternative: OpportunitySnapshot["alternatives"][number],
): string {
  if (alternative.targetContextStatus === "opaque") return "unknown_hidden_blocked";
  if (alternative.targetContextStatus === "blocked_by_hard_gate") return "blocked_by_hard_gate";
  if (alternative.actionType === "start_run" || alternative.actionType === "continue_run") {
    return "server:unknown";
  }
  if (alternative.actionType === "resolve_choice") return "choice:unknown";
  if (
    alternative.actionType === "gain_credit" ||
    alternative.actionType === "draw_card" ||
    alternative.actionType === "end_turn"
  ) {
    return "none";
  }
  return "unknown_target";
}

function costClassForAlternative(
  alternative: OpportunitySnapshot["alternatives"][number],
): string {
  const hardGateClass =
    alternative.hardGates.length > 0
      ? `hard_gate:${alternative.hardGates.slice().sort().join("+")}`
      : "hard_gate:none";
  const economyClass =
    alternative.economy === undefined ? "economy:not_projected" : "economy:projected";
  return `${hardGateClass},${economyClass}`;
}

function timingClassForAlternative(
  alternative: OpportunitySnapshot["alternatives"][number],
): string {
  return `snapshot_context:${alternative.targetContextStatus}`;
}

function proofSummaryForSnapshot(snapshot: OpportunitySnapshot) {
  const alternatives = snapshot.alternatives;
  return {
    legalActionCount: alternatives.length,
    progressAlternatives: alternatives.filter((alternative) =>
      alternative.expectedProgressLabel.startsWith("progress_"),
    ).length,
    targetContextComplete: alternatives.some(
      (alternative) =>
        alternative.targetContextStatus !== "opaque" &&
        alternative.targetContextStatus !== "blocked_by_hard_gate",
    ),
    hardGateBlockedAlternatives: alternatives.filter(
      (alternative) => alternative.hardGates.length > 0 || Boolean(alternative.blockedReason),
    ).length,
    topActionTypes: alternatives.slice(0, 5).map((alternative) => alternative.actionType),
  };
}

function renderMarkdown(input: typeof output): string {
  const rows = input.cases
    .map(
      (entry) =>
        `| \`${entry.caseId}\` | \`${entry.ai159Category}\` | ${entry.requestedSnapshotCount} | ${entry.availableSnapshotCount} | ${entry.snapshots
          .map((snapshot) =>
            snapshot.snapshotAvailable && "proofSummary" in snapshot
              ? `${snapshot.requestKind}:${snapshot.proofSummary.legalActionCount} legal/${snapshot.proofSummary.progressAlternatives} progress`
              : `${snapshot.requestKind}:missing`,
          )
          .join(", ")} |`,
    )
    .join("\n");
  return `# AI170 Opportunity-State Snapshot Instrumentation

Datum: 2026-06-13

Branch: \`codex/ai170-ai180-opportunity-snapshots\`

## Ziel

AI170 ergänzt den Trace-Matrix-Flow um optionale Opportunity-Snapshot-Requests. Der Flow hält an explizit angeforderten Action-Indizes die bereits vorhandenen, redigierten Action-Alternativen fest. Es werden keine neuen LegalActions erzeugt und keine Runtime-Entscheidungen verändert.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fälle | ${input.aggregate.cases} |
| angeforderte Snapshots | ${input.aggregate.requestedSnapshots} |
| verfügbare Snapshots | ${input.aggregate.availableSnapshots} |
| Alternativen mit SemanticActionSignature | ${input.aggregate.alternativesWithSemanticActionSignature} |
| AI159 TargetContext-missing-Fälle mit Snapshot | ${input.aggregate.ai159TargetContextMissingCasesWithSnapshots} |
| Fälle mit Progress-Alternative | ${input.aggregate.casesWithProgressAlternative} |
| Redaction safe | ${input.redaction.safe ? 1 : 0} |

## Fälle

| Case | AI159 Kategorie | Requests | Verfügbar | Snapshot Summary |
| --- | --- | ---: | ---: | --- |
${rows}

## Schluss

AI170 entfernt den wichtigsten technischen Blocker aus AI159 für die zwei TargetContext-missing-Fälle: A-ai-v143-tuning-009 und B-ai-v143-tuning-001 haben jetzt echte redigierte Opportunity-Snapshots. Die übrigen Fälle bleiben überwiegend ohne früheren Opportunity-State aus AI159 und damit weiterhin No-Go für Cutover. Folgepakete dürfen nur aus diesen Snapshots argumentieren, nicht aus Full-State- oder Hidden-Info-Daten.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai170-source-x10-alternatives-2026-06-13.json --seeds ai-v143-tuning-001,ai-v143-tuning-002,ai-v143-tuning-003,ai-v143-tuning-004,ai-v143-tuning-005,ai-v143-tuning-006,ai-v143-tuning-007,ai-v143-tuning-008,ai-v143-tuning-009,ai-v143-tuning-010 --max-actions 160 --max-findings 50 --include-action-alternatives --max-alternatives-per-finding 6 --opportunity-snapshot-source docs/reviews/ai/ai159-opportunity-state-mining-2026-06-12.json\`
- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai170-opportunity-state-snapshots.ts\`
- \`corepack pnpm --filter @netgrid/ai test -- selfplay-trace-mining\`
- \`git diff --check\`
`;
}

function scanRedaction(value: unknown): { safe: boolean; forbiddenMarkers: string[] } {
  const text = JSON.stringify(value);
  const matches = text.match(FORBIDDEN_REDACTION_MARKERS);
  return { safe: matches === null, forbiddenMarkers: matches ? Array.from(new Set(matches)) : [] };
}

function sum<T>(entries: readonly T[], valueFor: (entry: T) => number): number {
  return entries.reduce((total, entry) => total + valueFor(entry), 0);
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(repoRoot, relativePath), "utf8")) as T;
}

function findRepoRoot(start: string): string {
  let current = resolve(start);
  for (;;) {
    try {
      const packageJson = JSON.parse(readFileSync(join(current, "package.json"), "utf8")) as { name?: string };
      if (packageJson.name === "netgrid-app") return current;
    } catch {
      // Continue walking up.
    }
    const parent = dirname(current);
    if (parent === current) throw new Error(`Could not find NETGRID repo root from ${start}`);
    current = parent;
  }
}

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}
