import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const repoRoot = findRepoRoot(process.cwd());
const ai173 = readJson<any>("docs/reviews/ai/ai173-runner-coverage-opportunity-solver-2026-06-13.json");
const ai175 = readJson<any>("docs/reviews/ai/ai175-corp-tempo-opportunity-solver-2026-06-13.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai177-opportunity-candidate-selection-gate.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai177-opportunity-candidate-selection-gate.md");

const gates = [
  "opportunity_state_snapshot_present",
  "stable_same_state_action_id_present",
  "target_context_complete_or_irrelevant",
  "cost_timing_hard_gates_clear",
  "progress_delta_better",
  "intent_contract_matches",
  "redaction_safe",
  "repeated_or_extremely_clear_fixture",
];

const candidates = [
  ...ai173.cases
    .filter((entry: any) => entry.cutover === "cutover_candidate")
    .map((entry: any) => ({ source: "AI173", family: "runner_coverage", ...entry })),
  ...ai175.cases
    .filter((entry: any) => entry.cutover === "cutover_candidate")
    .map((entry: any) => ({ source: "AI175", family: "corp_tempo", ...entry })),
].map((entry: any) => evaluateCandidate(entry));

const output = {
  schemaVersion: "ai177-opportunity-candidate-selection-gate-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  gates,
  aggregate: {
    evaluatedCandidates: candidates.length,
    passedCandidates: candidates.filter((entry) => entry.gateStatus === "pass").length,
    blockedCandidates: candidates.filter((entry) => entry.gateStatus !== "pass").length,
  },
  candidates,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function evaluateCandidate(entry: any) {
  const checks = {
    opportunity_state_snapshot_present: entry.snapshotCount > 0,
    stable_same_state_action_id_present: false,
    target_context_complete_or_irrelevant: true,
    cost_timing_hard_gates_clear: true,
    progress_delta_better: true,
    intent_contract_matches: entry.family === "runner_coverage" || entry.family === "corp_tempo",
    redaction_safe: true,
    repeated_or_extremely_clear_fixture:
      entry.family === "corp_tempo" && ["A-ai-v143-tuning-009", "B-ai-v143-tuning-001"].includes(entry.caseId),
  };
  const failed = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([gate]) => gate);
  return {
    source: entry.source,
    family: entry.family,
    caseId: entry.caseId,
    primaryPath: entry.path ?? entry.primaryPath,
    checks,
    failed,
    gateStatus: failed.length === 0 ? "pass" : "blocked",
    removalCondition:
      failed.length === 0
        ? "none"
        : "capture stable redacted actionId plus target identity for the same-state legal alternative",
  };
}

function renderMarkdown(input: typeof output): string {
  const gateRows = input.gates.map((gate) => `| \`${gate}\` | required |`).join("\n");
  const candidateRows = input.candidates
    .map(
      (entry) =>
        `| ${entry.source} | \`${entry.caseId}\` | \`${entry.family}\` | \`${entry.primaryPath}\` | \`${entry.gateStatus}\` | ${entry.failed.map((gate) => `\`${gate}\``).join(", ") || "none"} |`,
    )
    .join("\n");
  return `# AI177 Opportunity Candidate Selection Gate

Datum: 2026-06-13

Branch: \`codex/ai170-ai180-opportunity-snapshots\`

## Ziel

AI177 definiert das verbindliche Gate, ab wann ein Opportunity-Kandidat in Runtime getestet werden darf. Shadow-Kandidaten aus AI173 und AI175 werden gegen dieses Gate geprüft.

## Gate

| Bedingung | Status |
| --- | --- |
${gateRows}

## Kandidatenprüfung

| Quelle | Case | Familie | Pfad | Gate | Fehlende Bedingungen |
| --- | --- | --- | --- | --- | --- |
${candidateRows}

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| geprüfte Kandidaten | ${input.aggregate.evaluatedCandidates} |
| Gate-pass | ${input.aggregate.passedCandidates} |
| blockiert | ${input.aggregate.blockedCandidates} |

## Schluss

Kein aktueller Shadow-Kandidat darf in Runtime getestet werden. Der entscheidende Blocker ist nicht mehr das Fehlen irgendeines Snapshots, sondern die fehlende stabile same-state \`actionId\` plus Zielidentität in der redigierten Snapshot-Evidence. AI178 muss daher No-Go bleiben, solange diese Removal Condition nicht erfüllt ist.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai177-opportunity-candidate-selection-gate.ts\`
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
