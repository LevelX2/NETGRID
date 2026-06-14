import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  buildCandidatePathBinding,
  candidatePathBindingIsRedactionSafe,
  type CandidatePathBinding,
} from "../packages/ai/src/candidate-path-binding";
import type { SemanticActionSignature } from "../packages/ai/src/semantic-action-signature";

type SourceCandidate = {
  source: string;
  family: "runner_coverage" | "corp_tempo";
  caseId: string;
  primaryPath: string;
};

type Ai170 = {
  cases: Array<{
    caseId: string;
    snapshots: Array<{
      requestKind: string;
      snapshotAvailable: boolean;
      snapshot?: {
        actionIndex: number;
        side: "runner" | "corp";
        stateVersionBefore: number;
        alternatives: OpportunityAlternative[];
      };
    }>;
  }>;
};

type OpportunityAlternative = {
  rank?: number;
  selected?: boolean;
  actionType: string;
  semanticActionType: string;
  sourceKind?: string;
  sourceDefinitionId?: string;
  abilityId?: string;
  targetContextStatus: string;
  expectedProgressLabel: string;
  hardGates: string[];
  blockedReason?: string;
  semanticActionSignature?: SemanticActionSignature;
};

type Ai173 = {
  cases: Array<{
    caseId: string;
    path: string;
    cutover: string;
  }>;
};

type Ai175 = {
  cases: Array<{
    caseId: string;
    primaryPath: string;
    cutover: string;
  }>;
};

type Ai177 = {
  candidates: SourceCandidate[];
};

const repoRoot = findRepoRoot(process.cwd());
const ai170 = readJson<Ai170>("docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json");
const ai173 = readJson<Ai173>("docs/reviews/ai/ai173-runner-coverage-opportunity-solver-2026-06-13.json");
const ai175 = readJson<Ai175>("docs/reviews/ai/ai175-corp-tempo-opportunity-solver-2026-06-13.json");
const ai177 = readJson<Ai177>("docs/reviews/ai/ai177-opportunity-candidate-selection-gate.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai191-candidate-path-bindings-v1.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai191-candidate-path-binding-v1.md");

const sourceCandidates = [
  ...ai177.candidates.map((candidate) => ({ ...candidate, reviewScope: "ai177_candidate" })),
  ...ai173.cases.map((entry) => ({
    source: "AI173",
    family: "runner_coverage" as const,
    caseId: entry.caseId,
    primaryPath: entry.path,
    reviewScope: "coverage_candidate",
  })),
  ...ai175.cases.map((entry) => ({
    source: "AI175",
    family: "corp_tempo" as const,
    caseId: entry.caseId,
    primaryPath: entry.primaryPath,
    reviewScope: "corp_tempo_candidate",
  })),
];

const bindings = sourceCandidates.flatMap((candidate) => bindingsForCandidate(candidate));
const uniqueBindings = uniqueBy(bindings, (entry) => entry.binding.bindingKey);
const redactedActionRefMapping = uniqueBindings.map((entry) => ({
  redactedActionRef: entry.binding.redactedActionRef,
  caseId: entry.caseId,
  reviewScope: entry.reviewScope,
  requestKind: entry.requestKind,
  actionIndex: entry.actionIndex,
  stateVersion: entry.binding.stateVersion,
  rank: entry.rank,
  actionType: entry.binding.actionType,
  semanticActionType: entry.semanticActionType,
}));

const output = {
  schemaVersion: "ai191-candidate-path-bindings-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai170: "docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json",
    ai173: "docs/reviews/ai/ai173-runner-coverage-opportunity-solver-2026-06-13.json",
    ai175: "docs/reviews/ai/ai175-corp-tempo-opportunity-solver-2026-06-13.json",
    ai177: "docs/reviews/ai/ai177-opportunity-candidate-selection-gate.json",
  },
  redaction: scanRedaction({ bindings: uniqueBindings, redactedActionRefMapping }),
  aggregate: {
    requestedSourceCandidates: sourceCandidates.length,
    bindings: uniqueBindings.length,
    boundBindings: uniqueBindings.filter((entry) => entry.binding.proofStatus === "bound").length,
    blockedBindings: uniqueBindings.filter((entry) => entry.binding.proofStatus === "blocked").length,
    ai177CandidateBindings: uniqueBindings.filter((entry) => entry.reviewScope === "ai177_candidate").length,
    coverageBindings: uniqueBindings.filter((entry) => entry.reviewScope === "coverage_candidate").length,
    corpTempoBindings: uniqueBindings.filter((entry) => entry.reviewScope === "corp_tempo_candidate").length,
  },
  blockerCounts: countBy(
    uniqueBindings.flatMap((entry) => entry.binding.blockers),
    (blocker) => blocker,
  ),
  redactedActionRefMapping,
  bindings: uniqueBindings,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function bindingsForCandidate(candidate: SourceCandidate & { reviewScope: string }) {
  const entry = ai170.cases.find((item) => item.caseId === candidate.caseId);
  if (!entry) return [];
  return entry.snapshots.flatMap((snapshot) => {
    if (!snapshot.snapshotAvailable || !snapshot.snapshot) return [];
    return snapshot.snapshot.alternatives
      .filter((alternative) => alternativeMatchesCandidate(candidate, alternative))
      .map((alternative) => {
        const signature = alternative.semanticActionSignature;
        if (!signature) return undefined;
        const rank = alternative.rank ?? 0;
        const redactedActionRef = `redacted:${stableHash(
          [
            candidate.reviewScope,
            candidate.source,
            candidate.family,
            candidate.caseId,
            snapshot.requestKind,
            snapshot.snapshot?.actionIndex,
            snapshot.snapshot?.stateVersionBefore,
            rank,
            signature.signatureKey,
          ].join("|"),
        )}`;
        const binding = buildCandidatePathBinding({
          signature,
          redactedActionRef,
          stateVersion: snapshot.snapshot.stateVersionBefore,
          side: snapshot.snapshot.side,
          hardGates: alternative.hardGates,
          blockedReason: alternative.blockedReason,
          intentContractId: `${candidate.source}.${candidate.family}.${candidate.primaryPath}`,
          evidence: [
            `case:${candidate.caseId}`,
            `review_scope:${candidate.reviewScope}`,
            `request:${snapshot.requestKind}`,
            `expected_progress:${alternative.expectedProgressLabel}`,
            `target_context:${alternative.targetContextStatus}`,
            alternative.selected ? "selected:true" : "selected:false",
          ],
        });
        return {
          reviewScope: candidate.reviewScope,
          source: candidate.source,
          family: candidate.family,
          caseId: candidate.caseId,
          primaryPath: candidate.primaryPath,
          requestKind: snapshot.requestKind,
          actionIndex: snapshot.snapshot.actionIndex,
          rank,
          selected: alternative.selected === true,
          semanticActionType: alternative.semanticActionType,
          expectedProgressLabel: alternative.expectedProgressLabel,
          targetContextStatus: alternative.targetContextStatus,
          binding,
        };
      })
      .filter((value): value is NonNullable<typeof value> => value !== undefined);
  });
}

function alternativeMatchesCandidate(
  candidate: SourceCandidate & { reviewScope: string },
  alternative: OpportunityAlternative,
): boolean {
  if (candidate.reviewScope === "ai177_candidate") {
    if (candidate.family === "runner_coverage") {
      return (
        alternative.semanticActionType === "coverage_setup" ||
        alternative.expectedProgressLabel === "progress_reachability_improved"
      );
    }
    return (
      alternative.semanticActionType === "scoreline" ||
      alternative.semanticActionType === "server_protection" ||
      alternative.targetContextStatus === "scoreline_relevant"
    );
  }
  if (candidate.family === "runner_coverage") {
    return (
      alternative.semanticActionType === "coverage_setup" ||
      alternative.expectedProgressLabel === "progress_reachability_improved"
    );
  }
  return (
    alternative.semanticActionType === "scoreline" ||
    alternative.semanticActionType === "server_protection" ||
    alternative.semanticActionType === "economy" ||
    alternative.targetContextStatus === "scoreline_relevant" ||
    alternative.targetContextStatus === "protection_relevant"
  );
}

function renderMarkdown(input: typeof output): string {
  const blockerRows = Object.entries(input.blockerCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([blocker, count]) => `| \`${blocker}\` | ${count} |`)
    .join("\n");
  const ai177Rows = input.bindings
    .filter((entry) => entry.reviewScope === "ai177_candidate")
    .map(
      (entry) =>
        `| ${entry.source} | \`${entry.caseId}\` | \`${entry.family}\` | \`${entry.primaryPath}\` | \`${entry.binding.actionType}\` | \`${entry.binding.targetIdentity}\` | \`${entry.binding.proofStatus}\` | ${entry.binding.blockers.map((blocker) => `\`${blocker}\``).join(", ") || "none"} |`,
    )
    .join("\n");
  return `# AI191 Candidate Path Binding v1

Datum: 2026-06-14

Branch: \`codex/ai191-ai200-binding-replay-proof\`

## Ziel

AI191 erzeugt ein read-only \`CandidatePathBinding\`, das \`SemanticActionSignature\`, stabile redigierte Action-Referenz, \`stateVersion\`, Side, TargetIdentity, Kosten-/Timingklasse und Gate-Summaries zusammenfÃ¼hrt. Die Bindings sind Diagnose-Evidence und Ã¤ndern keine Runtime-Entscheidung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Quellkandidaten | ${input.aggregate.requestedSourceCandidates} |
| CandidatePathBindings | ${input.aggregate.bindings} |
| vollstÃ¤ndig gebunden | ${input.aggregate.boundBindings} |
| blockiert | ${input.aggregate.blockedBindings} |
| AI177-Bindings | ${input.aggregate.ai177CandidateBindings} |
| Coverage-Bindings | ${input.aggregate.coverageBindings} |
| Corp-Tempo-Bindings | ${input.aggregate.corpTempoBindings} |
| Redaction safe | ${input.redaction.safe ? 1 : 0} |

## AI177-Kandidaten

| Quelle | Case | Familie | Pfad | Action | TargetIdentity | Binding | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- |
${ai177Rows}

## Blocker

| Blocker | Count |
| --- | ---: |
${blockerRows}

## Schluss

AI191 schlieÃŸt die Signatur an einen stabilen candidate-path Referenzpunkt an. Echte \`actionId\`-Werte liegen in den AI170-Snapshots weiterhin nicht vor; deshalb nutzt das Artefakt redigierte Action-Referenzen mit lokaler Mapping-Tabelle. Das ist ausreichend fÃ¼r TargetIdentity-/Gate-Reviews, aber noch nicht fÃ¼r eine echte PlayerAction.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai191-candidate-path-binding-v1.ts\`
- \`corepack pnpm --filter @netgrid/ai exec vitest run src/candidate-path-binding.test.ts\`
- \`corepack pnpm --filter @netgrid/ai run typecheck\`
- \`git diff --check\`
`;
}

function uniqueBy<T>(entries: readonly T[], keyFor: (entry: T) => string): T[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = keyFor(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function countBy<T extends string>(entries: readonly T[], keyFor: (entry: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    const key = keyFor(entry);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function scanRedaction(value: unknown): { safe: boolean; forbiddenMarkers: string[] } {
  const text = JSON.stringify(value);
  const forbidden =
    /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug|deckTop|decklist|deckOrder/i;
  const matches = text.match(forbidden);
  const bindingUnsafe = "bindings" in (value as { bindings?: unknown[] })
    ? ((value as { bindings: Array<{ binding: CandidatePathBinding }> }).bindings ?? []).some(
        (entry) => !candidatePathBindingIsRedactionSafe(entry.binding),
      )
    : false;
  return {
    safe: matches === null && !bindingUnsafe,
    forbiddenMarkers: matches ? Array.from(new Set(matches)) : [],
  };
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
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
