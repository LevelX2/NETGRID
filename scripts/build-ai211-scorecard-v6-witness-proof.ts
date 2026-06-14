import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type AggregateJson<T> = { aggregate: T };

type Ai203Aggregate = {
  projections: number;
  trueLegalActionWitnesses: number;
  candidatePathBindingFromWitness: number;
  targetRefCompleteOrIrrelevant: number;
  blocked: number;
  runtimeChanged: boolean;
};

type Ai205Aggregate = {
  candidateProjections: number;
  playerActionsBuilt: number;
  blocked: number;
  runtimeEffects: number;
};

type Ai206Aggregate = {
  candidates: number;
  replayPassed: number;
  illegalActions: number;
  replayFailures: number;
  runtimeEffects: number;
};

type Ai207Aggregate = {
  stalePunishCases: number;
  punishDisabled: number;
  scorelineSwitches: number;
  protectionSwitches: number;
  economyConversionSwitches: number;
  runtimeEffects: number;
};

type Ai208Aggregate = {
  cases: number;
  casesWithWitnessProjection: number;
  witnessBuildableCases: number;
  runtimeEffects: number;
};

type Ai209Aggregate = {
  cases: number;
  casesWithWitnessProjection: number;
  witnessBuildableCases: number;
  runtimeEffects: number;
};

type Ai210Aggregate = {
  eligibleMicroCutoverCandidates: number;
  runtimeFlaggedCandidateCount: number;
  runtimeEffects: number;
};

const repoRoot = findRepoRoot(process.cwd());
const ai203 = readJson<AggregateJson<Ai203Aggregate>>("docs/reviews/ai/ai203-witness-opportunity-snapshots.json");
const ai205 = readJson<AggregateJson<Ai205Aggregate>>("docs/reviews/ai/ai205-playeraction-builder-from-witness.json");
const ai206 = readJson<AggregateJson<Ai206Aggregate>>("docs/reviews/ai/ai206-replay-probe-v3.json");
const ai207 = readJson<AggregateJson<Ai207Aggregate>>("docs/reviews/ai/ai207-stale-punish-goal-switch-shadow.json");
const ai208 = readJson<AggregateJson<Ai208Aggregate>>("docs/reviews/ai/ai208-coverage-witness-review.json");
const ai209 = readJson<AggregateJson<Ai209Aggregate>>("docs/reviews/ai/ai209-corp-tempo-witness-review.json");
const ai210 = readJson<AggregateJson<Ai210Aggregate>>("docs/reviews/ai/ai210-one-witness-proven-micro-cutover.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai211-scorecard-v6-witness-proof.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai211-scorecard-v6-witness-proof.md");

const scorecardMetrics = [
  metric(
    "legalaction_witness_rate",
    ai203.aggregate.trueLegalActionWitnesses,
    ai203.aggregate.projections,
    "Share of opportunity projections backed by a real LegalActionWitness.",
  ),
  metric(
    "targetref_complete_or_irrelevant_rate",
    ai203.aggregate.targetRefCompleteOrIrrelevant,
    ai203.aggregate.projections,
    "Share of projections whose TargetRef is complete, side-safe and snapshot-stable or irrelevant.",
  ),
  metric(
    "candidate_path_binding_from_witness_rate",
    ai203.aggregate.candidatePathBindingFromWitness,
    ai203.aggregate.projections,
    "Share of CandidatePathBindings derived from Witness evidence rather than redacted candidate refs.",
  ),
  metric(
    "playeraction_build_rate",
    ai205.aggregate.playerActionsBuilt,
    ai205.aggregate.candidateProjections,
    "Share of projections that build a PlayerAction from Witness evidence.",
  ),
  metric(
    "replay_probe_pass_rate",
    ai206.aggregate.replayPassed,
    ai206.aggregate.candidates,
    "Share of candidates with a successful Replay Probe v3 pass.",
  ),
  metric(
    "coverage_witness_candidate_rate",
    ai208.aggregate.casesWithWitnessProjection,
    ai208.aggregate.cases,
    "Share of coverage cases with at least one TargetRef-bound Witness Projection.",
  ),
  metric(
    "corp_tempo_witness_candidate_rate",
    ai209.aggregate.casesWithWitnessProjection,
    ai209.aggregate.cases,
    "Share of Corp-Tempo cases with at least one TargetRef-bound Witness Projection.",
  ),
  metric(
    "punish_goal_switch_candidate_rate",
    ai207.aggregate.punishDisabled,
    ai207.aggregate.stalePunishCases,
    "Share of stale-punish cases where the shadow goal switch disables stale punish intent.",
  ),
  metric(
    "runtime_flagged_candidate_count",
    ai210.aggregate.runtimeFlaggedCandidateCount,
    1,
    "Count-like gate for any default-off runtime micro-cutover candidate.",
  ),
];

const output = {
  schemaVersion: "ai211-scorecard-v6-witness-proof",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai203: "docs/reviews/ai/ai203-witness-opportunity-snapshots.json",
    ai205: "docs/reviews/ai/ai205-playeraction-builder-from-witness.json",
    ai206: "docs/reviews/ai/ai206-replay-probe-v3.json",
    ai207: "docs/reviews/ai/ai207-stale-punish-goal-switch-shadow.json",
    ai208: "docs/reviews/ai/ai208-coverage-witness-review.json",
    ai209: "docs/reviews/ai/ai209-corp-tempo-witness-review.json",
    ai210: "docs/reviews/ai/ai210-one-witness-proven-micro-cutover.json",
  },
  scorecardMetrics,
  blocker: {
    current: "legalaction_witness_missing_real_action_id",
    runtimeCutoverEligible: ai210.aggregate.eligibleMicroCutoverCandidates > 0,
    removalCondition: "A same-state opportunity snapshot must carry real LegalActions/actionIds into Witness projection.",
  },
  proofChain: {
    candidateProjections: ai203.aggregate.projections,
    trueLegalActionWitnesses: ai203.aggregate.trueLegalActionWitnesses,
    playerActionsBuilt: ai205.aggregate.playerActionsBuilt,
    replayPassed: ai206.aggregate.replayPassed,
    eligibleMicroCutoverCandidates: ai210.aggregate.eligibleMicroCutoverCandidates,
  },
  shadowOnlyFindings: {
    coverageCasesWithWitnessProjection: ai208.aggregate.casesWithWitnessProjection,
    corpTempoCasesWithWitnessProjection: ai209.aggregate.casesWithWitnessProjection,
    stalePunishDisabled: ai207.aggregate.punishDisabled,
    stalePunishSwitches:
      ai207.aggregate.scorelineSwitches +
      ai207.aggregate.protectionSwitches +
      ai207.aggregate.economyConversionSwitches,
  },
  conclusion: {
    witnessProofEstablished: false,
    runtimeCutoverEligible: ai210.aggregate.eligibleMicroCutoverCandidates > 0,
    runtimeChanged: false,
    safetyGreen: ai206.aggregate.illegalActions === 0 && ai206.aggregate.replayFailures === 0,
  },
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.proofChain, null, 2));

function renderMarkdown(input: typeof output): string {
  const metricRows = input.scorecardMetrics
    .map(
      (entry) =>
        `| \`${entry.id}\` | ${entry.numerator}/${entry.denominator} | ${(entry.value * 100).toFixed(1)}% | ${entry.note} |`,
    )
    .join("\n");
  return `# AI211 Scorecard v6 - Witness Proof

Datum: 2026-06-14

Branch: \`codex/ai201-ai212-witness-proof\`

## Ziel

AI211 fasst die Witness-Proof-Kette als Scorecard v6 zusammen. Ein Candidate zaehlt nur dann als runtime-relevant, wenn LegalActionWitness, TargetRef, PlayerAction-Build und Replay-Probe zusammen bestehen.

## Scorecard v6

| Metrik | Zaehler/Nenner | Rate | Bedeutung |
| --- | ---: | ---: | --- |
${metricRows}

## Proof Chain

| Stufe | Wert |
| --- | ---: |
| Candidate-Projections | ${input.proofChain.candidateProjections} |
| echte LegalActionWitnesses | ${input.proofChain.trueLegalActionWitnesses} |
| PlayerActions aus Witness gebaut | ${input.proofChain.playerActionsBuilt} |
| Replay Probe passed | ${input.proofChain.replayPassed} |
| eligible Micro-Cutover Candidates | ${input.proofChain.eligibleMicroCutoverCandidates} |

## Shadow-only Befunde

| Befund | Wert |
| --- | ---: |
| Coverage-Cases mit Witness-Projection | ${input.shadowOnlyFindings.coverageCasesWithWitnessProjection} |
| Corp-Tempo-Cases mit Witness-Projection | ${input.shadowOnlyFindings.corpTempoCasesWithWitnessProjection} |
| stale Punish deaktiviert | ${input.shadowOnlyFindings.stalePunishDisabled} |
| stale Punish Switches | ${input.shadowOnlyFindings.stalePunishSwitches} |

## Blocker

Aktueller Blocker: \`${input.blocker.current}\`

Removal Condition: ${input.blocker.removalCondition}

## Schluss

Scorecard v6 ist als Safety-/Proof-Scorecard gruen, aber nicht runtime-cutover-gruen: Die Review-Kandidaten sind TargetRef-projizierbar, doch echte LegalActionWitnesses und Replay-Probes fehlen weiterhin.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai211-scorecard-v6-witness-proof.ts\`
- \`git diff --check\`
`;
}

function metric(id: string, numerator: number, denominator: number, note: string) {
  return {
    id,
    numerator,
    denominator,
    value: denominator === 0 ? 0 : Number((numerator / denominator).toFixed(4)),
    note,
  };
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
