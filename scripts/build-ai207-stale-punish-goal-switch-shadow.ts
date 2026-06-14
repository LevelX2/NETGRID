import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { evaluateStalePunishGoalSwitchShadow } from "../packages/ai/src/stale-punish-goal-switch-shadow";

type Ai195 = {
  cases: Array<{
    caseId: string;
    subcluster: string;
    rootCause: string;
    runnerTaggedWindow: boolean;
    payoffVisible: boolean;
    payoffLegal: boolean;
    payoffPayable: boolean;
    scorelineBetter: boolean;
    protectionBetter: boolean;
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const ai195 = readJson<Ai195>("docs/reviews/ai/ai195-stale-punish-replacement-shadow.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai207-stale-punish-goal-switch-shadow.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai207-stale-punish-goal-switch-shadow.md");

const cases = ai195.cases.map((entry) => ({
  ...entry,
  shadow: evaluateStalePunishGoalSwitchShadow(entry),
}));

const output = {
  schemaVersion: "ai207-stale-punish-goal-switch-shadow",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  sources: {
    ai195: "docs/reviews/ai/ai195-stale-punish-replacement-shadow.json",
  },
  aggregate: {
    stalePunishCases: cases.length,
    punishRemainsPossible: cases.filter((entry) => entry.shadow.replacementGoal === "punish_remains_possible").length,
    punishDisabled: cases.filter((entry) => !entry.shadow.punishIntentEnabled).length,
    scorelineSwitches: cases.filter((entry) => entry.shadow.replacementGoal === "corp.shadow_switch_to_scoreline").length,
    protectionSwitches: cases.filter((entry) => entry.shadow.replacementGoal === "corp.shadow_switch_to_protection").length,
    economyConversionSwitches: cases.filter(
      (entry) => entry.shadow.replacementGoal === "corp.shadow_switch_to_economy_conversion",
    ).length,
    runtimeEffects: cases.filter((entry) => entry.shadow.runtimeEffect).length,
  },
  replacementGoalCounts: countBy(cases.map((entry) => entry.shadow.replacementGoal), (goal) => goal),
  cases,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function renderMarkdown(input: typeof output): string {
  const goalRows = Object.entries(input.replacementGoalCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([goal, count]) => `| \`${goal}\` | ${count} |`)
    .join("\n");
  const caseRows = input.cases
    .slice(0, 20)
    .map(
      (entry) =>
        `| \`${entry.caseId}\` | \`${entry.rootCause}\` | ${entry.runnerTaggedWindow ? "yes" : "no"} | ${entry.payoffLegal && entry.payoffPayable ? "yes" : "no"} | \`${entry.shadow.replacementGoal}\` | ${entry.shadow.punishIntentEnabled ? "yes" : "no"} |`,
    )
    .join("\n");
  return `# AI207 Stale Punish Goal Switch Shadow

Datum: 2026-06-14

Branch: \`codex/ai201-ai212-witness-proof\`

## Ziel

AI207 uebersetzt den groessten stale-Punish-Cluster in eine Shadow-Zielwechselentscheidung. Es gibt keinen Corp-Economy-Malus, keine Runtime-Gewichte und keine produktive Wirkung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Stale-Punish-Faelle | ${input.aggregate.stalePunishCases} |
| Punish bleibt moeglich | ${input.aggregate.punishRemainsPossible} |
| Punish deaktiviert | ${input.aggregate.punishDisabled} |
| Scoreline-Switches | ${input.aggregate.scorelineSwitches} |
| Protection-Switches | ${input.aggregate.protectionSwitches} |
| Economy-Conversion-Switches | ${input.aggregate.economyConversionSwitches} |
| Runtime-Effekte | ${input.aggregate.runtimeEffects} |

## Replacement Goals

| Goal | Count |
| --- | ---: |
${goalRows}

## Cases

| Case | Root Cause | Tagged Window | Payoff legal/payable | Shadow Goal | Punish enabled |
| --- | --- | --- | --- | --- | --- |
${caseRows}

## Schluss

AI207 erzeugt eine konkrete Shadow-Entscheidung fuer stale Punish-Intents: Ohne reales Tag-/Payoff-Fenster wird Punish deaktiviert und auf Scoreline, Protection oder Economy-Conversion umgeschaltet. Der Stand bleibt shadow-only.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai207-stale-punish-goal-switch-shadow.ts\`
- \`corepack pnpm --filter @netgrid/ai exec vitest run src/stale-punish-goal-switch-shadow.test.ts\`
- \`corepack pnpm --filter @netgrid/ai run typecheck\`
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
