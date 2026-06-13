import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Ai174 = {
  cases: Array<{
    caseId: string;
    subcluster: string;
    staleCount: number;
    lastConversionAttempt: string;
    snapshotAlternatives: number;
    taggedWindowEvidence: boolean;
    punishPayoffEvidence: boolean;
    scorelineReplacementEvidence: boolean;
    classification: string;
  }>;
};

type PunishRootCause =
  | "missing_tag_window"
  | "missing_punish_payoff"
  | "payoff_not_legal"
  | "payoff_unpayable"
  | "punish_low_expected_value"
  | "scoreline_should_replace"
  | "protection_should_replace";

const PUNISH_PAYOFF_CARDS = [
  "On-Call Solo Team",
  "Strike Force Kali",
  "Scorched Earth",
  "Urban Renewal",
  "Solo Squad",
];

const repoRoot = findRepoRoot(process.cwd());
const ai174 = readJson<Ai174>("docs/reviews/ai/ai174-corp-tag-punish-stale-intent-review-2026-06-13.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai185-stale-punish-intent-decomposition.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai185-stale-punish-intent-decomposition.md");

const cases = ai174.cases.map((entry) => {
  const rootCause = rootCauseFor(entry);
  return {
    caseId: entry.caseId,
    subcluster: entry.subcluster,
    staleCount: entry.staleCount,
    lastConversionAttempt: entry.lastConversionAttempt,
    runnerTaggedWindow: entry.taggedWindowEvidence,
    tagSourcePresent: entry.taggedWindowEvidence,
    payoffVisible: entry.punishPayoffEvidence,
    payoffLegal: entry.punishPayoffEvidence && entry.classification !== "payoff_not_legal",
    payoffPayable: entry.punishPayoffEvidence && entry.classification !== "unpayable_payoff",
    killRealistic: false,
    scorelineBetter: entry.scorelineReplacementEvidence,
    protectionBetter: !entry.scorelineReplacementEvidence && /protection|rez/i.test(entry.subcluster),
    rootCause,
  };
});

const output = {
  schemaVersion: "ai185-stale-punish-intent-decomposition-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai174: "docs/reviews/ai/ai174-corp-tag-punish-stale-intent-review-2026-06-13.json",
  },
  payoffCardSemantics: {
    taggedRunnerRequired: true,
    cards: PUNISH_PAYOFF_CARDS,
  },
  aggregate: {
    cases: cases.length,
    rootCauseCounts: countBy(cases, (entry) => entry.rootCause),
    taggedWindowCases: cases.filter((entry) => entry.runnerTaggedWindow).length,
    payoffVisibleCases: cases.filter((entry) => entry.payoffVisible).length,
    scorelineReplacementCases: cases.filter((entry) => entry.scorelineBetter).length,
    protectionReplacementCases: cases.filter((entry) => entry.protectionBetter).length,
  },
  cases,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function rootCauseFor(entry: Ai174["cases"][number]): PunishRootCause {
  if (!entry.taggedWindowEvidence) return "missing_tag_window";
  if (entry.scorelineReplacementEvidence) return "scoreline_should_replace";
  if (/protection|rez/i.test(entry.subcluster)) return "protection_should_replace";
  if (!entry.punishPayoffEvidence) return "missing_punish_payoff";
  if (entry.classification === "payoff_not_legal") return "payoff_not_legal";
  if (entry.classification === "unpayable_payoff") return "payoff_unpayable";
  return "punish_low_expected_value";
}

function renderMarkdown(input: typeof output): string {
  const rootRows = Object.entries(input.aggregate.rootCauseCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([rootCause, count]) => `| \`${rootCause}\` | ${count} |`)
    .join("\n");
  const caseRows = input.cases
    .map(
      (entry) =>
        `| \`${entry.caseId}\` | ${entry.staleCount} | ${entry.runnerTaggedWindow ? 1 : 0} | ${entry.payoffVisible ? 1 : 0} | ${entry.scorelineBetter ? 1 : 0} | ${entry.protectionBetter ? 1 : 0} | \`${entry.rootCause}\` |`,
    )
    .join("\n");
  return `# AI185 Stale Punish Intent Decomposition

Datum: 2026-06-13

Branch: \`codex/ai181-ai190-signature-proof\`

## Ziel

AI185 zerlegt den größten stale Intent-Cluster \`corp.convert_tag_to_punish\` in konkrete Ursachen.

## Punish-Semantik

On-Call Solo Team, Strike Force Kali, Scorched Earth, Urban Renewal und Solo Squad sind nur bei tatsächlich getaggtem Runner echte Punish-Payoffs. Ohne Tagfenster oder sichtbaren/legalen Payoff darf daraus kein generischer Punish-Bonus und kein Economy-Malus abgeleitet werden.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fälle | ${input.aggregate.cases} |
| Fälle mit Tagfenster-Evidence | ${input.aggregate.taggedWindowCases} |
| Fälle mit sichtbarem Punish-Payoff | ${input.aggregate.payoffVisibleCases} |
| Scoreline-Ersatzfälle | ${input.aggregate.scorelineReplacementCases} |
| Protection-Ersatzfälle | ${input.aggregate.protectionReplacementCases} |

| Root Cause | Fälle |
| --- | ---: |
${rootRows}

## Fälle

| Case | Stale Count | Tagfenster | Payoff sichtbar | Scoreline besser | Protection besser | Root Cause |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
${caseRows}

## Schluss

Der Cluster ist kein Runtime-Punish-Kandidat. Die dominierenden Ursachen sind fehlende Payoffs, fehlende Tagfenster und bessere Scoreline-/Protection-Ersatzpfade. Das stützt weiter ein No-Go für generische Punish-Gewichte.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai185-stale-punish-intent-decomposition.ts\`
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
