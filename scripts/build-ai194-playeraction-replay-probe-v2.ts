import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Ai193 = {
  builds: Array<{
    reviewScope: string;
    source: string;
    family: string;
    caseId: string;
    primaryPath: string;
    actionType: string;
    targetIdentity: string;
    result: {
      status: "built" | "blocked";
      blockers: string[];
      playerAction?: unknown;
    };
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const ai193 = readJson<Ai193>("docs/reviews/ai/ai193-playeraction-dry-run-builder.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai194-playeraction-replay-probe-v2.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai194-playeraction-replay-probe-v2.md");

const probes = ai193.builds.map((entry) => {
  const dryRunBuilt = entry.result.status === "built";
  return {
    reviewScope: entry.reviewScope,
    source: entry.source,
    family: entry.family,
    caseId: entry.caseId,
    primaryPath: entry.primaryPath,
    actionType: entry.actionType,
    targetIdentity: entry.targetIdentity,
    dryRunStatus: entry.result.status,
    replayProbeStatus: dryRunBuilt
      ? "blocked_apply_harness_not_invoked_without_snapshot_state"
      : "not_probeable",
    illegalAction: false,
    deterministicReplayFailure: false,
    stateHashChecked: false,
    progressDeltaLabeled: false,
    blockers: dryRunBuilt
      ? [
          "same_state_snapshot_reconstruction_missing",
          "apply_harness_requires_full_replay_fixture",
        ]
      : [
          ...entry.result.blockers,
          "provide real actionId plus same-state replayable action proof",
        ],
  };
});

const output = {
  schemaVersion: "ai194-playeraction-replay-probe-v2",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai193: "docs/reviews/ai/ai193-playeraction-dry-run-builder.json",
  },
  aggregate: {
    candidates: probes.length,
    dryRunBuilt: probes.filter((entry) => entry.dryRunStatus === "built").length,
    replayProbed: probes.filter((entry) => entry.replayProbeStatus === "passed").length,
    notProbeable: probes.filter((entry) => entry.replayProbeStatus === "not_probeable").length,
    applyHarnessBlocked: probes.filter(
      (entry) => entry.replayProbeStatus === "blocked_apply_harness_not_invoked_without_snapshot_state",
    ).length,
    illegalActions: probes.filter((entry) => entry.illegalAction).length,
    deterministicReplayFailures: probes.filter((entry) => entry.deterministicReplayFailure).length,
  },
  blockerCounts: countBy(
    probes.flatMap((entry) => entry.blockers),
    (blocker) => blocker,
  ),
  probes,
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
  const ai177Rows = input.probes
    .filter((entry) => entry.reviewScope === "ai177_candidate")
    .map(
      (entry) =>
        `| ${entry.source} | \`${entry.caseId}\` | \`${entry.family}\` | \`${entry.actionType}\` | \`${entry.dryRunStatus}\` | \`${entry.replayProbeStatus}\` | ${entry.blockers.map((blocker) => `\`${blocker}\``).join(", ")} |`,
    )
    .join("\n");
  return `# AI194 PlayerAction Replay Probe v2

Datum: 2026-06-14

Branch: \`codex/ai191-ai200-binding-replay-proof\`

## Ziel

AI194 prÃ¼ft, ob aus AI193 Dry-Run-fÃ¤hige Kandidaten sicher in eine echte Apply-/Replay-Probe Ã¼berfÃ¼hrt werden kÃ¶nnen.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Kandidaten | ${input.aggregate.candidates} |
| Dry-Run gebaut | ${input.aggregate.dryRunBuilt} |
| Replay-probed | ${input.aggregate.replayProbed} |
| nicht probbar | ${input.aggregate.notProbeable} |
| Apply-Harness-blockiert | ${input.aggregate.applyHarnessBlocked} |
| IllegalActions | ${input.aggregate.illegalActions} |
| deterministische Replay-Failures | ${input.aggregate.deterministicReplayFailures} |

## AI177-Kandidaten

| Quelle | Case | Familie | Action | Dry-Run | Replay-Probe | Blocker |
| --- | --- | --- | --- | --- | --- | --- |
${ai177Rows}

## Blocker

| Blocker | Count |
| --- | ---: |
${blockerRows}

## Schluss

AI194 startet keine Apply-Probe, weil AI193 keinen Kandidaten mit echter \`actionId\` bauen konnte. Es gibt dadurch keine IllegalAction und keinen Replay-Failure, aber auch keinen positiven Replay-Proof. Removal Condition bleibt: echte \`actionId\`, vollstÃ¤ndige TargetIdentity und same-state rekonstruierbarer Apply-/Replay-Harness.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai194-playeraction-replay-probe-v2.ts\`
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
