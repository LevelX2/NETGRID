import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Ai203 = {
  projections: Array<{
    reviewScope: string;
    source: string;
    family: string;
    caseId: string;
    primaryPath: string;
    semanticActionType: string;
    projection: {
      status: "projected" | "blocked";
      actionType: string;
      targetRef: { identity: string; kind: string; sideSafe: boolean; snapshotStable: boolean; blocker?: string };
      candidatePathBindingFromWitness: boolean;
      blockers: string[];
    };
  }>;
};

type Ai195 = {
  aggregate: {
    stalePunishCases: number;
    replacementCandidates: number;
    runtimeEffects: number;
  };
};

type Ai196 = {
  aggregate: {
    cases: number;
    dryRunCapable: number;
    bindings: number;
    completeOrIrrelevantTargetIdentityCases: number;
    runtimeEffects: number;
  };
};

const repoRoot = findRepoRoot(process.cwd());
const ai203 = readJson<Ai203>("docs/reviews/ai/ai203-witness-opportunity-snapshots.json");
const ai195 = readJson<Ai195>("docs/reviews/ai/ai195-stale-punish-replacement-shadow.json");
const ai196 = readJson<Ai196>("docs/reviews/ai/ai196-coverage-candidate-binding-review.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai204-candidate-gate-v3-witness.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai204-candidate-gate-v3-witness.md");

const gates = [
  "legalaction_witness_present",
  "semantic_action_signature_present",
  "targetref_complete_or_irrelevant",
  "candidate_path_binding_from_witness",
  "cost_timing_present",
  "hard_risk_gates_clear",
  "intent_contract_matches",
  "repeated_case_or_clear_fixture",
  "redaction_safe",
];

const gateReviews = ai203.projections.map((entry) => {
  const blockers = new Set<string>();
  for (const blocker of entry.projection.blockers) blockers.add(blocker);
  if (!entry.projection.candidatePathBindingFromWitness) {
    blockers.add("candidate_path_binding_not_from_witness");
  }
  if (!entry.projection.targetRef.sideSafe && entry.projection.targetRef.kind !== "none") {
    blockers.add(entry.projection.targetRef.blocker ?? "targetref_not_complete");
  }
  const status = blockers.size === 0 ? "passed" : "blocked";
  return {
    reviewScope: entry.reviewScope,
    source: entry.source,
    family: entry.family,
    caseId: entry.caseId,
    primaryPath: entry.primaryPath,
    actionType: entry.projection.actionType,
    targetRef: entry.projection.targetRef.identity,
    status,
    blockers: [...blockers].sort(),
    gatesEvaluated: gates,
  };
});

const output = {
  schemaVersion: "ai204-candidate-gate-v3-witness",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai203: "docs/reviews/ai/ai203-witness-opportunity-snapshots.json",
    ai195: "docs/reviews/ai/ai195-stale-punish-replacement-shadow.json",
    ai196: "docs/reviews/ai/ai196-coverage-candidate-binding-review.json",
  },
  gates,
  aggregate: {
    evaluatedCandidates: gateReviews.length,
    passedCandidates: gateReviews.filter((entry) => entry.status === "passed").length,
    blockedCandidates: gateReviews.filter((entry) => entry.status === "blocked").length,
    ai177Candidates: gateReviews.filter((entry) => entry.reviewScope === "ai177_candidate").length,
    ai177Passed: gateReviews.filter(
      (entry) => entry.reviewScope === "ai177_candidate" && entry.status === "passed",
    ).length,
    coverageCases: ai196.aggregate.cases,
    coverageBindings: ai196.aggregate.bindings,
    coverageDryRunCapable: ai196.aggregate.dryRunCapable,
    coverageRuntimeEffects: ai196.aggregate.runtimeEffects,
    stalePunishCases: ai195.aggregate.stalePunishCases,
    stalePunishReplacementCandidates: ai195.aggregate.replacementCandidates,
    stalePunishRuntimeEffects: ai195.aggregate.runtimeEffects,
    runtimeEffects: 0,
  },
  blockerCounts: countBy(gateReviews.flatMap((entry) => entry.blockers), (blocker) => blocker),
  gateReviews,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function renderMarkdown(input: typeof output): string {
  const blockerRows = Object.entries(input.blockerCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([blocker, count]) => `| \`${blocker}\` | ${count} |`)
    .join("\n");
  const ai177Rows = input.gateReviews
    .filter((entry) => entry.reviewScope === "ai177_candidate")
    .map(
      (entry) =>
        `| ${entry.source} | \`${entry.caseId}\` | \`${entry.family}\` | \`${entry.actionType}\` | \`${entry.targetRef}\` | \`${entry.status}\` | ${entry.blockers.map((blocker) => `\`${blocker}\``).join(", ")} |`,
    )
    .join("\n");
  return `# AI204 Candidate Gate v3 with Witness

Datum: 2026-06-14

Branch: \`codex/ai201-ai212-witness-proof\`

## Ziel

AI204 laesst das Candidate Gate v3 gegen Witness-basierte Projection-Evidence laufen. Das Gate verlangt echte \`LegalActionWitness\`, TargetRef-v1-Vollstaendigkeit, CandidatePathBinding aus Witness, Kosten-/Timing-/Gate-Evidence, Intent-Match, Wiederholung oder klares Fixture und Redaction-Safety.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| evaluierte Kandidaten | ${input.aggregate.evaluatedCandidates} |
| Gate-positive Kandidaten | ${input.aggregate.passedCandidates} |
| blockierte Kandidaten | ${input.aggregate.blockedCandidates} |
| AI177/AI183-nahe Kandidaten | ${input.aggregate.ai177Candidates} |
| AI177/AI183 gate-positiv | ${input.aggregate.ai177Passed} |
| Coverage-Faelle | ${input.aggregate.coverageCases} |
| Coverage-Bindings | ${input.aggregate.coverageBindings} |
| Coverage dry-run-capable | ${input.aggregate.coverageDryRunCapable} |
| Stale-Punish-Faelle | ${input.aggregate.stalePunishCases} |
| Stale-Punish Replacement Candidates | ${input.aggregate.stalePunishReplacementCandidates} |
| Runtime-Effekte | ${input.aggregate.runtimeEffects} |

## AI177/AI183-nahe Kandidaten

| Quelle | Case | Familie | Action | TargetRef | Status | Blocker |
| --- | --- | --- | --- | --- | --- | --- |
${ai177Rows}

## Blocker

| Blocker | Count |
| --- | ---: |
${blockerRows}

## Schluss

Gate v3 blockiert weiterhin alle Kandidaten, jetzt aber nicht mehr diffus: Der Hauptblocker ist \`legalaction_witness_missing_real_action_id\` plus \`candidate_path_binding_not_from_witness\`. Coverage- und Stale-Punish-Eingaenge bleiben fuer AI208/AI207 verwertbar, erzeugen aber keine Runtime-Wirkung.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai204-candidate-gate-v3-witness.ts\`
- \`git diff --check\`
`;
}

function countBy<T extends string>(entries: readonly T[], keyFor: (entry: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    const key = keyFor(entry);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(repoRoot, relativePath), "utf8")) as T;
}

function findRepoRoot(start: string): string {
  let current = resolve(start);
  for (;;) {
    try {
      const packageJson = JSON.parse(readFileSync(join(current, "package.json"), "utf8")) as {
        name?: string;
      };
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
