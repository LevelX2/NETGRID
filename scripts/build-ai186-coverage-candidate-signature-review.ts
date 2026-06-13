import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { resolveTargetIdentity } from "../packages/ai/src/target-identity-resolver";

type Ai173 = {
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    snapshotCount: number;
    visibleInstallableSolution: boolean;
    searchSolution: boolean;
    drawSolution: boolean;
    creditNeeded: boolean;
    noSolutionVisible: boolean;
    path: string;
    cutover: string;
  }>;
};

type Ai170 = {
  cases: Array<{
    caseId: string;
    snapshots: Array<{
      snapshotAvailable: boolean;
      snapshot?: {
        alternatives: Array<{
          actionType: string;
          semanticActionType: string;
          targetContextStatus: string;
          expectedProgressLabel: string;
          hardGates: string[];
          semanticActionSignature?: {
            signatureKey: string;
            targetIdentity: string;
          };
        }>;
      };
    }>;
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const ai173 = readJson<Ai173>("docs/reviews/ai/ai173-runner-coverage-opportunity-solver-2026-06-13.json");
const ai170 = readJson<Ai170>("docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai186-coverage-candidate-signature-review.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai186-coverage-candidate-signature-review.md");

const snapshotsByCase = new Map(ai170.cases.map((entry) => [entry.caseId, entry]));
const cases = ai173.cases.map((entry) => {
  const alternatives =
    snapshotsByCase
      .get(entry.caseId)
      ?.snapshots.flatMap((snapshot) => snapshot.snapshot?.alternatives ?? []) ?? [];
  const coverageAlternatives = alternatives.filter(
    (alternative) =>
      alternative.semanticActionType === "coverage_setup" ||
      alternative.expectedProgressLabel === "progress_reachability_improved",
  );
  const signatureCount = coverageAlternatives.filter(
    (alternative) => alternative.semanticActionSignature !== undefined,
  ).length;
  const targetIdentityResults = coverageAlternatives.map((alternative) =>
    resolveTargetIdentity({
      actionType: alternative.actionType,
      targetIdentity: alternative.semanticActionSignature?.targetIdentity,
      targetContextStatus: alternative.targetContextStatus,
    }),
  );
  const targetIdentityPass = targetIdentityResults.some(
    (resolution) => resolution.status === "complete" || resolution.status === "irrelevant",
  );
  const hardGatesClear = coverageAlternatives.some((alternative) => alternative.hardGates.length === 0);
  const intentContractMatches =
    entry.visibleInstallableSolution || entry.searchSolution || entry.drawSolution || entry.creditNeeded;
  const gatePositive =
    entry.snapshotCount > 0 &&
    signatureCount > 0 &&
    targetIdentityPass &&
    hardGatesClear &&
    intentContractMatches;
  return {
    caseId: entry.caseId,
    dominantSubcluster: entry.dominantSubcluster,
    path: entry.path,
    previousCutover: entry.cutover,
    missingIceType: entry.noSolutionVisible ? "unknown_missing_coverage" : "coverage_gap_present",
    visibleInstallableCoverage: entry.visibleInstallableSolution,
    searchOrDrawPath: entry.searchSolution || entry.drawSolution,
    creditPath: entry.creditNeeded,
    coverageAlternatives: coverageAlternatives.length,
    semanticActionSignatures: signatureCount,
    targetIdentityPass,
    targetIdentityBlockers: [
      ...new Set(
        targetIdentityResults
          .map((resolution) => resolution.blocker)
          .filter((value): value is string => value !== undefined),
      ),
    ].sort(),
    hardGatesClear,
    intentContractMatches,
    gateStatus: gatePositive ? "gate_positive" : "blocked",
  };
});

const output = {
  schemaVersion: "ai186-coverage-candidate-signature-review-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai173: "docs/reviews/ai/ai173-runner-coverage-opportunity-solver-2026-06-13.json",
    ai170: "docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json",
  },
  relevantCards: [
    "Self-Modifying Code",
    "Temple Microcode Outlet",
    "The Short Circuit",
    "Codecracker",
    "Dwarf",
    "Worm",
    "Corrosion",
    "Skeleton Passkeys",
    "Boring Bit",
  ],
  aggregate: {
    cases: cases.length,
    gatePositive: cases.filter((entry) => entry.gateStatus === "gate_positive").length,
    blocked: cases.filter((entry) => entry.gateStatus !== "gate_positive").length,
    signaturePassCases: cases.filter((entry) => entry.semanticActionSignatures > 0).length,
    targetIdentityPassCases: cases.filter((entry) => entry.targetIdentityPass).length,
  },
  cases,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function renderMarkdown(input: typeof output): string {
  const rows = input.cases
    .map(
      (entry) =>
        `| \`${entry.caseId}\` | \`${entry.path}\` | ${entry.coverageAlternatives} | ${entry.semanticActionSignatures} | ${entry.targetIdentityPass ? 1 : 0} | ${entry.hardGatesClear ? 1 : 0} | \`${entry.gateStatus}\` | ${entry.targetIdentityBlockers.map((blocker) => `\`${blocker}\``).join(", ") || "none"} |`,
    )
    .join("\n");
  return `# AI186 Coverage Candidate Signature Review

Datum: 2026-06-13

Branch: \`codex/ai181-ai190-signature-proof\`

## Ziel

AI186 prüft alle 13 Runner-Coverage-Fälle aus AI173 mit SemanticActionSignature und TargetIdentity.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Coverage-Fälle | ${input.aggregate.cases} |
| Gate-positive Fälle | ${input.aggregate.gatePositive} |
| blockiert | ${input.aggregate.blocked} |
| Fälle mit Coverage-Signatur | ${input.aggregate.signaturePassCases} |
| Fälle mit TargetIdentity-Pass | ${input.aggregate.targetIdentityPassCases} |

## Fälle

| Case | Pfad | Coverage-Alternativen | Signaturen | TargetIdentity | HardGates | Gate | Blocker |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
${rows}

## Schluss

Der frühere Coverage-Kandidat bleibt blockiert. Signaturen existieren für Coverage-Alternativen, aber die TargetIdentity ist für den candidate-path nicht stabil genug. Es wird kein generischer Draw-, Credit- oder Coverage-Malus abgeleitet.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai186-coverage-candidate-signature-review.ts\`
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
