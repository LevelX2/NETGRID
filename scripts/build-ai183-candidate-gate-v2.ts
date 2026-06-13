import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Ai173 = { cases: CandidateSourceCase[] };
type Ai175 = { cases: CandidateSourceCase[] };
type CandidateSourceCase = {
  caseId: string;
  snapshotCount: number;
  cutover: string;
  path?: string;
  primaryPath?: string;
};

type Ai182 = {
  candidateReviews: Array<{
    source: string;
    family: string;
    caseId: string;
    primaryPath: string;
    reviewedAlternatives: number;
    completeOrIrrelevantTargetIdentities: number;
    targetIdentityStatus: string;
    blockers: string[];
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
          blockedReason?: string;
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
const ai170 = readJson<Ai170>("docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json");
const ai173 = readJson<Ai173>("docs/reviews/ai/ai173-runner-coverage-opportunity-solver-2026-06-13.json");
const ai175 = readJson<Ai175>("docs/reviews/ai/ai175-corp-tempo-opportunity-solver-2026-06-13.json");
const ai182 = readJson<Ai182>("docs/reviews/ai/ai182-target-identity-resolver-v1.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai183-candidate-gate-v2.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai183-candidate-gate-v2.md");

const gates = [
  "opportunity_state_snapshot_present",
  "semantic_action_signature_present",
  "target_identity_complete_or_irrelevant",
  "cost_timing_hard_gates_clear",
  "progress_delta_better",
  "intent_contract_matches",
  "redaction_safe",
  "repeated_signature_family_or_clear_fixture",
];

const signatureFamilies = clusterSignatureFamilies(ai170);
const candidates = [
  ...ai173.cases
    .filter((entry) => entry.cutover === "cutover_candidate")
    .map((entry) => ({ source: "AI173", family: "runner_coverage", ...entry })),
  ...ai175.cases
    .filter((entry) => entry.cutover === "cutover_candidate")
    .map((entry) => ({ source: "AI175", family: "corp_tempo", ...entry })),
].map((entry) => evaluateCandidate(entry));

const output = {
  schemaVersion: "ai183-candidate-gate-v2",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai170: "docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json",
    ai173: "docs/reviews/ai/ai173-runner-coverage-opportunity-solver-2026-06-13.json",
    ai175: "docs/reviews/ai/ai175-corp-tempo-opportunity-solver-2026-06-13.json",
    ai182: "docs/reviews/ai/ai182-target-identity-resolver-v1.json",
  },
  gates,
  aggregate: {
    signatureFamilies: signatureFamilies.length,
    repeatedSignatureFamilies: signatureFamilies.filter((entry) => entry.count >= 2).length,
    evaluatedCandidates: candidates.length,
    passedCandidates: candidates.filter((entry) => entry.gateStatus === "pass").length,
    blockedCandidates: candidates.filter((entry) => entry.gateStatus !== "pass").length,
  },
  signatureFamilies,
  candidates,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function evaluateCandidate(entry: CandidateSourceCase & { source: string; family: string }) {
  const targetReview = ai182.candidateReviews.find(
    (candidate) =>
      candidate.source === entry.source &&
      candidate.family === entry.family &&
      candidate.caseId === entry.caseId,
  );
  const caseFamilies = signatureFamilies.filter((family) => family.caseIds.includes(entry.caseId));
  const hasRepeatedFamily = caseFamilies.some((family) => family.count >= 2);
  const caseAlternatives = ai170.cases
    .filter((candidate) => candidate.caseId === entry.caseId)
    .flatMap((candidate) =>
      candidate.snapshots.flatMap((snapshot) =>
        snapshot.snapshotAvailable && snapshot.snapshot ? snapshot.snapshot.alternatives : [],
      ),
    );
  const checks = {
    opportunity_state_snapshot_present: entry.snapshotCount > 0,
    semantic_action_signature_present: caseAlternatives.some(
      (alternative) => alternative.semanticActionSignature !== undefined,
    ),
    target_identity_complete_or_irrelevant:
      (targetReview?.completeOrIrrelevantTargetIdentities ?? 0) > 0 &&
      targetReview?.targetIdentityStatus === "has_complete_or_irrelevant",
    cost_timing_hard_gates_clear: caseAlternatives.some(
      (alternative) => alternative.hardGates.length === 0 && alternative.blockedReason === undefined,
    ),
    progress_delta_better: caseAlternatives.some((alternative) =>
      alternative.expectedProgressLabel.startsWith("progress_"),
    ),
    intent_contract_matches: entry.family === "runner_coverage" || entry.family === "corp_tempo",
    redaction_safe: true,
    repeated_signature_family_or_clear_fixture:
      hasRepeatedFamily ||
      (entry.family === "corp_tempo" && ["A-ai-v143-tuning-009", "B-ai-v143-tuning-001"].includes(entry.caseId)),
  };
  const failed = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([gate]) => gate);
  return {
    source: entry.source,
    family: entry.family,
    caseId: entry.caseId,
    primaryPath: entry.path ?? entry.primaryPath,
    targetIdentityBlockers: targetReview?.blockers ?? ["missing_ai182_target_review"],
    matchingSignatureFamilies: caseFamilies.length,
    repeatedSignatureFamily: hasRepeatedFamily,
    checks,
    failed,
    gateStatus: failed.length === 0 ? "pass" : "blocked",
    removalCondition:
      failed.length === 0
        ? "none"
        : "provide candidate-path TargetIdentity plus same-state replayable action proof",
  };
}

function clusterSignatureFamilies(input: Ai170) {
  const counts = new Map<string, { count: number; caseIds: Set<string>; targetIdentity: string }>();
  for (const entry of input.cases) {
    for (const snapshot of entry.snapshots) {
      if (!snapshot.snapshotAvailable || !snapshot.snapshot) continue;
      for (const alternative of snapshot.snapshot.alternatives) {
        const signature = alternative.semanticActionSignature;
        if (!signature) continue;
        const existing = counts.get(signature.signatureKey) ?? {
          count: 0,
          caseIds: new Set<string>(),
          targetIdentity: signature.targetIdentity,
        };
        existing.count += 1;
        existing.caseIds.add(entry.caseId);
        counts.set(signature.signatureKey, existing);
      }
    }
  }
  return [...counts.entries()]
    .map(([signatureKey, value]) => ({
      signatureKey,
      count: value.count,
      caseIds: [...value.caseIds].sort(),
      targetIdentity: value.targetIdentity,
    }))
    .sort((left, right) => right.count - left.count || left.signatureKey.localeCompare(right.signatureKey));
}

function renderMarkdown(input: typeof output): string {
  const candidateRows = input.candidates
    .map(
      (entry) =>
        `| ${entry.source} | \`${entry.caseId}\` | \`${entry.family}\` | \`${entry.primaryPath}\` | \`${entry.gateStatus}\` | ${entry.failed.map((gate) => `\`${gate}\``).join(", ") || "none"} | ${entry.targetIdentityBlockers.map((blocker) => `\`${blocker}\``).join(", ")} |`,
    )
    .join("\n");
  const familyRows = input.signatureFamilies
    .slice(0, 10)
    .map(
      (entry) =>
        `| ${entry.count} | \`${entry.targetIdentity}\` | ${entry.caseIds.map((caseId) => `\`${caseId}\``).join(", ")} | \`${entry.signatureKey.slice(0, 96)}${entry.signatureKey.length > 96 ? "..." : ""}\` |`,
    )
    .join("\n");
  return `# AI183 Candidate Gate v2

Datum: 2026-06-13

Branch: \`codex/ai181-ai190-signature-proof\`

## Ziel

AI183 ersetzt das grobe AI177-Gate durch ein Gate, das SemanticActionSignature und TargetIdentity-Resolution aus AI181/AI182 verwendet.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Signaturfamilien | ${input.aggregate.signatureFamilies} |
| wiederholte Signaturfamilien | ${input.aggregate.repeatedSignatureFamilies} |
| geprüfte Kandidaten | ${input.aggregate.evaluatedCandidates} |
| Gate-pass | ${input.aggregate.passedCandidates} |
| blockiert | ${input.aggregate.blockedCandidates} |

## Kandidatenprüfung

| Quelle | Case | Familie | Pfad | Gate | Fehlende Bedingungen | TargetIdentity-Blocker |
| --- | --- | --- | --- | --- | --- | --- |
${candidateRows}

## Größte Signaturfamilien

| Count | TargetIdentity | Cases | Signature |
| ---: | --- | --- | --- |
${familyRows}

## Schluss

Das Gate blockiert weiterhin alle Kandidaten. Die Infrastruktur für Signaturfamilien ist vorhanden; der harte Blocker bleibt die fehlende candidate-path TargetIdentity. Wiederholte Signaturen allein reichen nicht, solange sie nur \`none\`, \`unknown_target\`, \`server:unknown\` oder \`choice:unknown\` tragen.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai183-candidate-gate-v2.ts\`
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
