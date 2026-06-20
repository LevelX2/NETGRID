import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Ai205 = {
  builds: Array<{
    reviewScope: string;
    source: string;
    family: string;
    caseId: string;
    targetRef: string;
    result: {
      status: "built" | "blocked";
      blockers: string[];
      playerAction?: unknown;
    };
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const ai205 = readJson<Ai205>("docs/reviews/ai/ai205-playeraction-builder-from-witness.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai206-replay-probe-v3.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai206-replay-probe-v3.md");

const probes = ai205.builds.map((entry) => {
  const buildable = entry.result.status === "built" && entry.result.playerAction !== undefined;
  return {
    reviewScope: entry.reviewScope,
    source: entry.source,
    family: entry.family,
    caseId: entry.caseId,
    targetRef: entry.targetRef,
    buildable,
    probeStatus: buildable ? "not_run_no_snapshot_harness" : "not_probeable",
    replayPassed: false,
    illegalAction: false,
    replayFailure: false,
    blockers: buildable
      ? ["same_state_snapshot_harness_missing"]
      : ["playeraction_not_built", ...entry.result.blockers],
  };
});

const output = {
  schemaVersion: "ai206-replay-probe-v3",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai205: "docs/reviews/ai/ai205-playeraction-builder-from-witness.json",
  },
  aggregate: {
    candidates: probes.length,
    buildablePlayerActions: probes.filter((entry) => entry.buildable).length,
    replayProbed: probes.filter((entry) => entry.replayPassed).length,
    replayPassed: probes.filter((entry) => entry.replayPassed).length,
    notProbeable: probes.filter((entry) => entry.probeStatus === "not_probeable").length,
    illegalActions: probes.filter((entry) => entry.illegalAction).length,
    replayFailures: probes.filter((entry) => entry.replayFailure).length,
    runtimeEffects: 0,
  },
  blockerCounts: countBy(probes.flatMap((entry) => entry.blockers), (blocker) => blocker),
  probes,
  noGo: {
    reason: "no_witness_built_playeraction_candidates",
    removalConditions: [
      "LegalActionWitness present in opportunity snapshot",
      "buildPlayerActionFromWitness returns built",
      "same-state snapshot harness available",
      "applyAction accepts the PlayerAction",
      "Replay and StateHash remain deterministic",
    ],
  },
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
        `| ${entry.source} | \`${entry.caseId}\` | \`${entry.family}\` | \`${entry.targetRef}\` | \`${entry.probeStatus}\` | ${entry.blockers.map((blocker) => `\`${blocker}\``).join(", ")} |`,
    )
    .join("\n");
  const removalRows = input.noGo.removalConditions.map((item) => `| ${item} |`).join("\n");
  return `# AI206 Replay Probe v3

Datum: 2026-06-14

Branch: \`codex/ai201-ai212-witness-proof\`

## Ziel

AI206 replay-probt nur PlayerActions, die aus echten LegalActionWitnesses gebaut wurden. Es gibt keine synthetische Replay-Probe fuer redigierte Candidate-Pfade.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Kandidaten | ${input.aggregate.candidates} |
| buildbare PlayerActions | ${input.aggregate.buildablePlayerActions} |
| replay-probed | ${input.aggregate.replayProbed} |
| replay passed | ${input.aggregate.replayPassed} |
| not probeable | ${input.aggregate.notProbeable} |
| IllegalActions | ${input.aggregate.illegalActions} |
| ReplayFailures | ${input.aggregate.replayFailures} |
| Runtime-Effekte | ${input.aggregate.runtimeEffects} |

## AI177/AI183-nahe Kandidaten

| Quelle | Case | Familie | TargetRef | Probe | Blocker |
| --- | --- | --- | --- | --- | --- |
${ai177Rows}

## Blocker

| Blocker | Count |
| --- | ---: |
${blockerRows}

## Removal Conditions

| Bedingung |
| --- |
${removalRows}

## Schluss

AI206 ist ein korrektes No-Go: \`playeraction_replay_probe_pass_rate\` bleibt 0, weil AI205 keine PlayerAction aus echten Witnesses bauen kann. Es gab keine IllegalActions und keine ReplayFailures, weil kein unsicherer Apply-Pfad ausgefuehrt wurde.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai206-replay-probe-v3.ts\`
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
