import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Ai204 = {
  aggregate: {
    evaluatedCandidates: number;
    passedCandidates: number;
    blockedCandidates: number;
    runtimeEffects: number;
  };
  gateReviews: Array<{
    reviewScope: string;
    source: string;
    family: string;
    caseId: string;
    actionType: string;
    targetRef: string;
    status: "passed" | "blocked";
    blockers: string[];
  }>;
};

type Ai205 = {
  aggregate: {
    candidateProjections: number;
    playerActionsBuilt: number;
    runtimeEffects: number;
  };
  builds: Array<{
    source: string;
    family: string;
    caseId: string;
    targetRef: string;
    result: { status: "built" | "blocked"; blockers: string[] };
  }>;
};

type Ai206 = {
  aggregate: {
    candidates: number;
    buildablePlayerActions: number;
    replayPassed: number;
    illegalActions: number;
    replayFailures: number;
    runtimeEffects: number;
  };
  probes: Array<{
    source: string;
    family: string;
    caseId: string;
    targetRef: string;
    replayPassed: boolean;
    probeStatus: string;
    blockers: string[];
  }>;
};

type WitnessReview = {
  aggregate: {
    cases: number;
    casesWithWitnessProjection: number;
    witnessProjections: number;
    witnessBuildableCases: number;
    runtimeEffects: number;
  };
};

const repoRoot = findRepoRoot(process.cwd());
const ai204 = readJson<Ai204>("docs/reviews/ai/ai204-candidate-gate-v3-witness.json");
const ai205 = readJson<Ai205>("docs/reviews/ai/ai205-playeraction-builder-from-witness.json");
const ai206 = readJson<Ai206>("docs/reviews/ai/ai206-replay-probe-v3.json");
const ai208 = readJson<WitnessReview>("docs/reviews/ai/ai208-coverage-witness-review.json");
const ai209 = readJson<WitnessReview>("docs/reviews/ai/ai209-corp-tempo-witness-review.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai210-one-witness-proven-micro-cutover.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai210-one-witness-proven-micro-cutover.md");

const buildKeys = new Set(
  ai205.builds
    .filter((entry) => entry.result.status === "built")
    .map((entry) => candidateKey(entry.source, entry.family, entry.caseId, entry.targetRef)),
);
const replayKeys = new Set(
  ai206.probes
    .filter((entry) => entry.replayPassed)
    .map((entry) => candidateKey(entry.source, entry.family, entry.caseId, entry.targetRef)),
);

const eligibleCandidates = ai204.gateReviews
  .filter((entry) => entry.status === "passed")
  .filter((entry) => buildKeys.has(candidateKey(entry.source, entry.family, entry.caseId, entry.targetRef)))
  .filter((entry) => replayKeys.has(candidateKey(entry.source, entry.family, entry.caseId, entry.targetRef)));

const output = {
  schemaVersion: "ai210-one-witness-proven-micro-cutover",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai204: "docs/reviews/ai/ai204-candidate-gate-v3-witness.json",
    ai205: "docs/reviews/ai/ai205-playeraction-builder-from-witness.json",
    ai206: "docs/reviews/ai/ai206-replay-probe-v3.json",
    ai208: "docs/reviews/ai/ai208-coverage-witness-review.json",
    ai209: "docs/reviews/ai/ai209-corp-tempo-witness-review.json",
  },
  aggregate: {
    evaluatedCandidates: ai204.aggregate.evaluatedCandidates,
    gatePassedCandidates: ai204.aggregate.passedCandidates,
    playerActionsBuilt: ai205.aggregate.playerActionsBuilt,
    replayPassedCandidates: ai206.aggregate.replayPassed,
    coverageWitnessBuildableCases: ai208.aggregate.witnessBuildableCases,
    corpTempoWitnessBuildableCases: ai209.aggregate.witnessBuildableCases,
    eligibleMicroCutoverCandidates: eligibleCandidates.length,
    runtimeFlaggedCandidateCount: 0,
    runtimeEffects: 0,
  },
  decision: {
    status: eligibleCandidates.length === 0 ? "no_go" : "ready_for_default_off_flag",
    reason:
      eligibleCandidates.length === 0
        ? "witness_targetref_playeraction_replay_chain_incomplete"
        : "one_candidate_has_complete_witness_proof_chain",
    runtimeChanged: false,
    defaultOffRuntimeFlagImplemented: false,
    defaultOffRuntimeFlagRequiredBeforeAnyCutover: true,
  },
  safetyBoundaries: [
    "no LegalAction generation",
    "no hidden-info expansion",
    "no PlayerAction outside LegalActions-derived Witness evidence",
    "no generic Credit/Draw/Run/Corp economy punishment",
    "no runtime cutover without Witness, TargetRef, PlayerAction build and Replay pass",
  ],
  removalConditions: [
    "At least one Candidate Gate v3 entry passes with a real LegalActionWitness.",
    "TargetRef is complete or irrelevant for that same candidate.",
    "buildPlayerActionFromWitness builds the PlayerAction from the Witness.",
    "Replay Probe v3 applies the PlayerAction and passes deterministic StateHash checks.",
    "A tight default-off runtime flag names exactly that candidate family and fixture scope.",
  ],
  eligibleCandidates,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function renderMarkdown(input: typeof output): string {
  const boundaryRows = input.safetyBoundaries.map((boundary) => `| ${boundary} |`).join("\n");
  const removalRows = input.removalConditions.map((condition) => `| ${condition} |`).join("\n");
  const eligibleRows =
    input.eligibleCandidates
      .map(
        (entry) =>
          `| ${entry.source} | \`${entry.caseId}\` | \`${entry.family}\` | \`${entry.actionType}\` | \`${entry.targetRef}\` |`,
      )
      .join("\n") || "| none | none | none | none | none |";
  return `# AI210 One Witness-Proven Micro-Cutover

Datum: 2026-06-14

Branch: \`codex/ai201-ai212-witness-proof\`

## Ziel

AI210 prueft, ob genau ein eng begrenzter Micro-Cutover mit vollstaendiger Witness-Proof-Kette verantwortbar ist. Die notwendige Kette lautet: Candidate Gate v3 passed, PlayerAction aus Witness gebaut, Replay Probe v3 passed.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| evaluierte Kandidaten | ${input.aggregate.evaluatedCandidates} |
| Gate-positive Kandidaten | ${input.aggregate.gatePassedCandidates} |
| PlayerActions gebaut | ${input.aggregate.playerActionsBuilt} |
| Replay-passed Kandidaten | ${input.aggregate.replayPassedCandidates} |
| Coverage witness-buildable Cases | ${input.aggregate.coverageWitnessBuildableCases} |
| Corp-Tempo witness-buildable Cases | ${input.aggregate.corpTempoWitnessBuildableCases} |
| eligible Micro-Cutover Candidates | ${input.aggregate.eligibleMicroCutoverCandidates} |
| runtime-flagged Candidates | ${input.aggregate.runtimeFlaggedCandidateCount} |
| Runtime-Effekte | ${input.aggregate.runtimeEffects} |

## Entscheidung

Status: \`${input.decision.status}\`

Grund: \`${input.decision.reason}\`

Es wurde kein Runtime-Flag implementiert und keine Runtime-Logik geaendert. Ein Runtime-Flag bleibt erst zulaessig, wenn ein konkreter Kandidat die vollstaendige Witness/TargetRef/PlayerAction/Replay-Kette besteht.

## Eligible Candidates

| Quelle | Case | Familie | Action | TargetRef |
| --- | --- | --- | --- | --- |
${eligibleRows}

## Safety Boundaries

| Grenze |
| --- |
${boundaryRows}

## Removal Conditions

| Bedingung |
| --- |
${removalRows}

## Schluss

AI210 ist ein bewusstes No-Go. Die aktuelle Evidence reicht fuer Reviews, Scorecards und Shadow-Entscheidungen, aber nicht fuer einen runtime-wirksamen Cutover.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai210-one-witness-proven-micro-cutover.ts\`
- \`git diff --check\`
`;
}

function candidateKey(source: string, family: string, caseId: string, targetRef: string): string {
  return `${source}|${family}|${caseId}|${targetRef}`;
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
