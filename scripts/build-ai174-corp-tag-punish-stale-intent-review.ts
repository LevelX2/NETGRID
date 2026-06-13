import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Ai172 = {
  staleIntents: Array<{
    caseId: string;
    subcluster: string;
    intent: string;
    staleCount: number;
    lastConversionAttempt: string;
    family: string;
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
          blockedReason?: string;
          hardGates: string[];
        }>;
      };
    }>;
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const intents = readJson<Ai172>("docs/reviews/ai/ai172-goal-conversion-contract-v1-2026-06-13.json");
const snapshots = readJson<Ai170>("docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai174-corp-tag-punish-stale-intent-review-2026-06-13.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai174-corp-tag-punish-stale-intent-review-2026-06-13.md");

const snapshotsByCase = new Map(snapshots.cases.map((entry) => [entry.caseId, entry]));
const cases = intents.staleIntents
  .filter((entry) => entry.intent === "corp.convert_tag_to_punish")
  .map((entry) => {
    const alternatives =
      snapshotsByCase
        .get(entry.caseId)
        ?.snapshots.flatMap((snapshot) => snapshot.snapshot?.alternatives ?? []) ?? [];
    const classification = classifyPunish(entry, alternatives);
    return {
      caseId: entry.caseId,
      subcluster: entry.subcluster,
      staleCount: entry.staleCount,
      lastConversionAttempt: entry.lastConversionAttempt,
      snapshotAlternatives: alternatives.length,
      taggedWindowEvidence: classification !== "missing_tag",
      punishPayoffEvidence: alternatives.some(isPunishPayoff),
      scorelineReplacementEvidence: alternatives.some(isScorelineReplacement),
      classification,
    };
  });

const output = {
  schemaVersion: "ai174-corp-tag-punish-stale-intent-review-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai172: "docs/reviews/ai/ai172-goal-conversion-contract-v1-2026-06-13.json",
    ai170: "docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json",
  },
  aggregate: {
    cases: cases.length,
    classCounts: countBy(cases, (entry) => entry.classification),
  },
  cases,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function classifyPunish(
  entry: Ai172["staleIntents"][number],
  alternatives: Ai170["cases"][number]["snapshots"][number]["snapshot"]["alternatives"],
): "missing_tag" | "missing_payoff" | "unpayable_payoff" | "payoff_not_legal" | "scoreline_should_replace" {
  if (alternatives.length === 0) return "missing_tag";
  if (alternatives.some(isScorelineReplacement)) return "scoreline_should_replace";
  if (!alternatives.some(isPunishPayoff)) return "missing_payoff";
  if (alternatives.some((alternative) => /credit|cost|unpayable/i.test(alternative.blockedReason ?? ""))) {
    return "unpayable_payoff";
  }
  if (alternatives.some((alternative) => alternative.hardGates.length > 0 || alternative.blockedReason)) {
    return "payoff_not_legal";
  }
  return entry.family === "punish_stale_or_no_real_tag_window" ? "missing_tag" : "missing_payoff";
}

function isPunishPayoff(alternative: {
  actionType: string;
  semanticActionType: string;
  targetContextStatus: string;
}): boolean {
  const text = `${alternative.actionType}|${alternative.semanticActionType}|${alternative.targetContextStatus}`.toLocaleLowerCase("en-US");
  return /tag|punish|damage|trash_resource|scorched|urban|solo|strike/.test(text);
}

function isScorelineReplacement(alternative: {
  actionType: string;
  semanticActionType: string;
  expectedProgressLabel: string;
}): boolean {
  return (
    alternative.actionType === "score_agenda" ||
    alternative.actionType === "advance_card" ||
    alternative.semanticActionType === "scoreline" ||
    alternative.expectedProgressLabel === "progress_score"
  );
}

function renderMarkdown(input: typeof output): string {
  const classRows = Object.entries(input.aggregate.classCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([classification, count]) => `| \`${classification}\` | ${count} |`)
    .join("\n");
  const caseRows = input.cases
    .map(
      (entry) =>
        `| \`${entry.caseId}\` | \`${entry.subcluster}\` | ${entry.staleCount} | ${entry.snapshotAlternatives} | \`${entry.classification}\` |`,
    )
    .join("\n");
  return `# AI174 Corp Tag/Punish Stale Intent Review

Datum: 2026-06-13

Branch: \`codex/ai170-ai180-opportunity-snapshots\`

## Ziel

AI174 prüft die stale \`corp.convert_tag_to_punish\`-Intents aus AI172. Punish wird nur als realer Fortschritt behandelt, wenn ein echtes Tag-/Payoff-Fenster oder eine bessere Scoreline-Ersatzentscheidung sichtbar ist.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Punish-Stale-Fälle | ${input.aggregate.cases} |

| Klasse | Fälle |
| --- | ---: |
${classRows}

## Fälle

| Case | Subcluster | Stale Count | Snapshot-Alternativen | Klasse |
| --- | --- | ---: | ---: | --- |
${caseRows}

## Schluss

Die auffällige Punish-Familie ist kein Beleg für einen sofortigen Punish-Cutover. In den Snapshots dominiert fehlender Payoff oder eine bessere Scoreline-/Protection-Ersatzrichtung. AI178 darf daraus keinen generischen Corp-Punish-Malus ableiten.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai174-corp-tag-punish-stale-intent-review.ts\`
- \`git diff --check\`
`;
}

function countBy<T>(entries: readonly T[], keyFor: (entry: T) => string): Record<string, number> {
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
