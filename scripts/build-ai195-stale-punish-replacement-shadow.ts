import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Ai185 = {
  aggregate: {
    cases: number;
    rootCauseCounts: Record<string, number>;
  };
  cases: Array<{
    caseId: string;
    subcluster: string;
    staleCount: number;
    lastConversionAttempt: string;
    runnerTaggedWindow: boolean;
    payoffVisible: boolean;
    payoffLegal: boolean;
    payoffPayable: boolean;
    scorelineBetter: boolean;
    protectionBetter: boolean;
    rootCause: string;
  }>;
};

type ReplacementGoal =
  | "corp.replace_stale_punish_with_scoreline"
  | "corp.replace_stale_punish_with_protection"
  | "corp.replace_stale_punish_with_economy_conversion"
  | "no_replacement_candidate";

const repoRoot = findRepoRoot(process.cwd());
const ai185 = readJson<Ai185>("docs/reviews/ai/ai185-stale-punish-intent-decomposition.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai195-stale-punish-replacement-shadow.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai195-stale-punish-replacement-shadow.md");

const cases = ai185.cases.map((entry) => {
  const noRealPunishWindow =
    entry.rootCause === "missing_tag_window" || entry.rootCause === "missing_punish_payoff";
  const replacementGoal = chooseReplacementGoal(entry);
  return {
    caseId: entry.caseId,
    subcluster: entry.subcluster,
    staleCount: entry.staleCount,
    rootCause: entry.rootCause,
    noRealPunishWindow,
    runnerTaggedWindow: entry.runnerTaggedWindow,
    payoffVisible: entry.payoffVisible,
    payoffLegal: entry.payoffLegal,
    payoffPayable: entry.payoffPayable,
    scorelineBetter: entry.scorelineBetter,
    protectionBetter: entry.protectionBetter,
    lastConversionAttempt: entry.lastConversionAttempt,
    replacementGoal,
    shadowOnly: true,
    runtimeEffect: false,
    evidence: replacementEvidence(entry, replacementGoal),
  };
});

const replacementGoalCounts = countBy(
  cases.map((entry) => entry.replacementGoal),
  (goal) => goal,
);
const repeatedReplacementGoals = Object.entries(replacementGoalCounts)
  .filter(([goal, count]) => goal !== "no_replacement_candidate" && count >= 2)
  .map(([goal]) => goal);

const output = {
  schemaVersion: "ai195-stale-punish-replacement-shadow",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai185: "docs/reviews/ai/ai185-stale-punish-intent-decomposition.json",
  },
  aggregate: {
    stalePunishCases: cases.length,
    primaryNoRealPunishWindowCases: cases.filter((entry) => entry.noRealPunishWindow).length,
    replacementCandidates: cases.filter((entry) => entry.replacementGoal !== "no_replacement_candidate").length,
    repeatedReplacementGoalTypes: repeatedReplacementGoals.length,
    runtimeEffects: cases.filter((entry) => entry.runtimeEffect).length,
  },
  rootCauseCounts: ai185.aggregate.rootCauseCounts,
  replacementGoalCounts,
  repeatedReplacementGoals,
  cases,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function chooseReplacementGoal(entry: Ai185["cases"][number]): ReplacementGoal {
  if (entry.scorelineBetter) return "corp.replace_stale_punish_with_scoreline";
  if (entry.protectionBetter) return "corp.replace_stale_punish_with_protection";
  if (
    entry.rootCause === "missing_tag_window" ||
    (entry.rootCause === "missing_punish_payoff" &&
      (entry.subcluster.includes("gain_credit") ||
        entry.subcluster.includes("real_reserve") ||
        entry.lastConversionAttempt.includes("gain_credit")))
  ) {
    return "corp.replace_stale_punish_with_economy_conversion";
  }
  return "no_replacement_candidate";
}

function replacementEvidence(
  entry: Ai185["cases"][number],
  replacementGoal: ReplacementGoal,
): string[] {
  return [
    `rootCause:${entry.rootCause}`,
    `runnerTaggedWindow:${entry.runnerTaggedWindow}`,
    `payoffVisible:${entry.payoffVisible}`,
    `payoffLegal:${entry.payoffLegal}`,
    `payoffPayable:${entry.payoffPayable}`,
    `scorelineBetter:${entry.scorelineBetter}`,
    `protectionBetter:${entry.protectionBetter}`,
    `replacementGoal:${replacementGoal}`,
    "shadow_only:true",
    "no_runtime_weight_change:true",
  ];
}

function renderMarkdown(input: typeof output): string {
  const goalRows = Object.entries(input.replacementGoalCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([goal, count]) => `| \`${goal}\` | ${count} |`)
    .join("\n");
  const caseRows = input.cases
    .map(
      (entry) =>
        `| \`${entry.caseId}\` | \`${entry.rootCause}\` | ${entry.runnerTaggedWindow ? 1 : 0} | ${entry.payoffVisible ? 1 : 0} | ${entry.scorelineBetter ? 1 : 0} | ${entry.protectionBetter ? 1 : 0} | \`${entry.replacementGoal}\` |`,
    )
    .join("\n");
  return `# AI195 Stale Punish Replacement Shadow v1

Datum: 2026-06-14

Branch: \`codex/ai191-ai200-binding-replay-proof\`

## Ziel

AI195 leitet aus den AI185-Stale-Punish-FÃ¤llen einen reinen Shadow-Zielwechsel ab. Es wird kein Score, kein Runtime-Pfad und keine generische Corp-Economy-Strafe geÃ¤ndert.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Stale-Punish-FÃ¤lle | ${input.aggregate.stalePunishCases} |
| PrimÃ¤rfÃ¤lle ohne reales Punish-Fenster | ${input.aggregate.primaryNoRealPunishWindowCases} |
| Replacement-Kandidaten | ${input.aggregate.replacementCandidates} |
| wiederholte Replacement-Zieltypen | ${input.aggregate.repeatedReplacementGoalTypes} |
| Runtime-Wirkungen | ${input.aggregate.runtimeEffects} |

## Replacement-Ziele

| Ziel | Count |
| --- | ---: |
${goalRows}

## FÃ¤lle

| Case | Root Cause | Tagfenster | Payoff sichtbar | Scoreline besser | Protection besser | Shadow-Ziel |
| --- | --- | ---: | ---: | ---: | ---: | --- |
${caseRows}

## Schluss

AI195 findet wiederholte Shadow-Zielwechsel, vor allem Economy-Conversion fÃ¼r Stale-Punish ohne reales Payoff-Fenster sowie Scoreline-/Protection-Ersatz, wenn AI185 dafÃ¼r explizite Evidenz liefert. Das bleibt Diagnose; kein Punish-Bonus und kein Economy-Malus werden produktiv geÃ¤ndert.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai195-stale-punish-replacement-shadow.ts\`
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
