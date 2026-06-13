import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Ai183 = {
  candidates: Array<{
    source: string;
    family: string;
    caseId: string;
    primaryPath: string;
    gateStatus: "pass" | "blocked";
    failed: string[];
    targetIdentityBlockers: string[];
    removalCondition: string;
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const ai183 = readJson<Ai183>("docs/reviews/ai/ai183-candidate-gate-v2.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai184-playeraction-replay-probe.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai184-playeraction-replay-probe.md");

const probes = ai183.candidates.map((candidate) => {
  const probeable = candidate.gateStatus === "pass";
  return {
    source: candidate.source,
    family: candidate.family,
    caseId: candidate.caseId,
    primaryPath: candidate.primaryPath,
    probeMode: probeable ? "playeraction_replay" : "blocked_dry_run",
    replayProbeStatus: probeable ? "not_executed_runtime_cutover_still_disabled" : "not_probeable",
    playerActionBuildStatus: probeable ? "candidate_requires_harness" : "blocked_before_playeraction_build",
    illegalAction: false,
    deterministicReplayFailure: false,
    progressDeltaEvaluated: false,
    blockers: probeable
      ? ["runtime replay harness intentionally not invoked without explicit micro-candidate package"]
      : [
          ...candidate.failed,
          ...candidate.targetIdentityBlockers,
          candidate.removalCondition,
        ],
  };
});

const output = {
  schemaVersion: "ai184-playeraction-replay-probe-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai183: "docs/reviews/ai/ai183-candidate-gate-v2.json",
  },
  aggregate: {
    candidates: probes.length,
    replayProbed: probes.filter((entry) => entry.replayProbeStatus === "passed").length,
    notProbeable: probes.filter((entry) => entry.replayProbeStatus === "not_probeable").length,
    illegalActions: probes.filter((entry) => entry.illegalAction).length,
    deterministicReplayFailures: probes.filter((entry) => entry.deterministicReplayFailure).length,
  },
  probes,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function renderMarkdown(input: typeof output): string {
  const rows = input.probes
    .map(
      (entry) =>
        `| ${entry.source} | \`${entry.caseId}\` | \`${entry.family}\` | \`${entry.primaryPath}\` | \`${entry.probeMode}\` | \`${entry.replayProbeStatus}\` | ${entry.blockers.map((blocker) => `\`${blocker}\``).join(", ")} |`,
    )
    .join("\n");
  return `# AI184 PlayerAction Replay Probe

Datum: 2026-06-13

Branch: \`codex/ai181-ai190-signature-proof\`

## Ziel

AI184 prüft, ob Gate-nahe Kandidaten sicher in eine konkrete PlayerAction-Replay-Probe überführt werden dürfen.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Kandidaten | ${input.aggregate.candidates} |
| replay-probed | ${input.aggregate.replayProbed} |
| nicht probbar | ${input.aggregate.notProbeable} |
| IllegalActions | ${input.aggregate.illegalActions} |
| deterministische Replay-Failures | ${input.aggregate.deterministicReplayFailures} |

## Kandidaten

| Quelle | Case | Familie | Pfad | Probe | Status | Blocker |
| --- | --- | --- | --- | --- | --- | --- |
${rows}

## Schluss

Kein Kandidat darf in eine konkrete PlayerAction übersetzt werden, solange AI183 keine candidate-path TargetIdentity liefert. AI184 erzeugt deshalb einen negativen Replay-Proof: keine IllegalAction, kein Replay-Failure, aber auch kein Runtime- oder Dry-Run-Apply, weil die PlayerAction-Basis nicht sicher bestimmbar ist.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai184-playeraction-replay-probe.ts\`
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
