import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  resolveTargetIdentity,
  type TargetIdentityResolution,
} from "../packages/ai/src/target-identity-resolver";

type Ai170SnapshotFile = {
  cases: Array<{
    caseId: string;
    snapshots: Array<{
      snapshotAvailable: boolean;
      snapshot?: {
        alternatives: SnapshotAlternative[];
      };
    }>;
  }>;
};

type SnapshotAlternative = {
  actionType: string;
  semanticActionType: string;
  targetContextStatus: string;
  expectedProgressLabel: string;
  sourceDefinitionId?: string;
  semanticActionSignature?: {
    targetIdentity: string;
    signatureKey: string;
  };
};

type Ai177Gate = {
  candidates: Array<{
    source: string;
    family: string;
    caseId: string;
    primaryPath: string;
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const ai170 = readJson<Ai170SnapshotFile>(
  "docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json",
);
const ai177 = readJson<Ai177Gate>("docs/reviews/ai/ai177-opportunity-candidate-selection-gate.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai182-target-identity-resolver-v1.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai182-target-identity-resolver-v1.md");

const alternatives = ai170.cases.flatMap((entry) =>
  entry.snapshots.flatMap((snapshot) =>
    snapshot.snapshotAvailable && snapshot.snapshot
      ? snapshot.snapshot.alternatives.map((alternative) => ({
          caseId: entry.caseId,
          ...alternative,
          targetIdentityResolution: resolveAlternativeTargetIdentity(alternative),
        }))
      : [],
  ),
);

const candidateReviews = ai177.candidates.map((candidate) => {
  const caseAlternatives = alternatives.filter((alternative) => alternative.caseId === candidate.caseId);
  const relevantAlternatives = caseAlternatives.filter((alternative) =>
    candidate.family === "runner_coverage"
      ? alternative.semanticActionType === "coverage_setup" ||
        alternative.expectedProgressLabel.startsWith("progress_")
      : ["scoreline", "server_protection", "install_protection"].includes(
          alternative.semanticActionType,
        ),
  );
  const complete = relevantAlternatives.filter(
    (alternative) =>
      alternative.targetIdentityResolution.status === "complete" ||
      alternative.targetIdentityResolution.status === "irrelevant",
  );
  const blockers = [
    ...new Set(
      relevantAlternatives
        .map((alternative) => alternative.targetIdentityResolution.blocker)
        .filter((value): value is string => value !== undefined),
    ),
  ].sort();
  return {
    ...candidate,
    reviewedAlternatives: relevantAlternatives.length,
    completeOrIrrelevantTargetIdentities: complete.length,
    targetIdentityStatus:
      relevantAlternatives.length === 0
        ? "blocked_no_relevant_alternative"
        : complete.length > 0
          ? "has_complete_or_irrelevant"
          : "blocked",
    blockers:
      relevantAlternatives.length === 0 ? ["no_relevant_snapshot_alternative"] : blockers,
  };
});

const output = {
  schemaVersion: "ai182-target-identity-resolver-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai170: "docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json",
    ai177: "docs/reviews/ai/ai177-opportunity-candidate-selection-gate.json",
  },
  aggregate: {
    alternatives: alternatives.length,
    complete: alternatives.filter((entry) => entry.targetIdentityResolution.status === "complete").length,
    irrelevant: alternatives.filter((entry) => entry.targetIdentityResolution.status === "irrelevant").length,
    hiddenBlocked: alternatives.filter(
      (entry) => entry.targetIdentityResolution.status === "blocked_hidden_info",
    ).length,
    unresolvedBlocked: alternatives.filter(
      (entry) => entry.targetIdentityResolution.status === "blocked_unresolved",
    ).length,
    reviewedCandidates: candidateReviews.length,
    candidatesWithCompleteOrIrrelevantTargetIdentity: candidateReviews.filter(
      (entry) => entry.targetIdentityStatus === "has_complete_or_irrelevant",
    ).length,
  },
  candidateReviews,
  alternatives: alternatives.map((entry) => ({
    caseId: entry.caseId,
    actionType: entry.actionType,
    semanticActionType: entry.semanticActionType,
    targetContextStatus: entry.targetContextStatus,
    expectedProgressLabel: entry.expectedProgressLabel,
    signatureKey: entry.semanticActionSignature?.signatureKey,
    targetIdentity: entry.semanticActionSignature?.targetIdentity,
    targetIdentityResolution: entry.targetIdentityResolution,
  })),
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function resolveAlternativeTargetIdentity(
  alternative: SnapshotAlternative,
): TargetIdentityResolution {
  return resolveTargetIdentity({
    actionType: alternative.actionType,
    targetIdentity: alternative.semanticActionSignature?.targetIdentity,
    targetContextStatus: alternative.targetContextStatus,
    ...(alternative.sourceDefinitionId ? { sourceDefinitionId: alternative.sourceDefinitionId } : {}),
  });
}

function renderMarkdown(input: typeof output): string {
  const candidateRows = input.candidateReviews
    .map(
      (entry) =>
        `| ${entry.source} | \`${entry.caseId}\` | \`${entry.family}\` | \`${entry.primaryPath}\` | ${entry.reviewedAlternatives} | ${entry.completeOrIrrelevantTargetIdentities} | \`${entry.targetIdentityStatus}\` | ${entry.blockers.map((blocker) => `\`${blocker}\``).join(", ") || "none"} |`,
    )
    .join("\n");
  return `# AI182 Target Identity Resolver v1

Datum: 2026-06-13

Branch: \`codex/ai181-ai190-signature-proof\`

## Ziel

AI182 löst TargetIdentity nur aus side-safe Signatur- und Snapshot-Evidence auf. Unsichere oder fehlende Ziele werden als Blocker dokumentiert.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| geprüfte Snapshot-Alternativen | ${input.aggregate.alternatives} |
| vollständige TargetIdentities | ${input.aggregate.complete} |
| zielirrelevante Alternativen | ${input.aggregate.irrelevant} |
| hidden-info-blockiert | ${input.aggregate.hiddenBlocked} |
| unresolved-blockiert | ${input.aggregate.unresolvedBlocked} |
| geprüfte AI177-Kandidaten | ${input.aggregate.reviewedCandidates} |
| Kandidaten mit vollständiger/irrelevanter TargetIdentity | ${input.aggregate.candidatesWithCompleteOrIrrelevantTargetIdentity} |

## AI177-Kandidaten

| Quelle | Case | Familie | Pfad | Alternativen | complete/irrelevant | Status | Blocker |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
${candidateRows}

## Schluss

Der Resolver verhindert Scheinstabilität: Die vorhandenen AI177-Kandidaten erhalten präzise TargetIdentity-Blocker, solange Snapshot-Evidence nur \`unknown_target\`, \`server:unknown\` oder \`choice:unknown\` enthält. Zielirrelevante Economy-/Draw-/Credit-Aktionen sind zwar klassifizierbar, reichen aber nicht für einen Runtime-Cutover-Kandidaten.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai182-target-identity-resolver-v1.ts\`
- \`corepack pnpm --filter @netgrid/ai exec vitest run src/target-identity-resolver.test.ts\`
- \`corepack pnpm --filter @netgrid/ai run typecheck\`
- \`git diff --check\`
`;
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
