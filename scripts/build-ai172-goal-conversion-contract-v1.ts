import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  ENDGAME_GOAL_CONVERSION_CONTRACTS,
  classifyEndgameGoalConversion,
  type EndgameGoalConversionContractId,
} from "../packages/ai/src/endgame-goal-conversion-contracts";

type StaleIntentRow = {
  caseId: string;
  subcluster: string;
  intent: EndgameGoalConversionContractId;
  staleCount: number;
  lastConversionAttempt: string;
  family: string;
};

const repoRoot = findRepoRoot(process.cwd());
const mdSource = "docs/reviews/ai/ai160-stale-intent-root-cause-review-2026-06-12.md";
const source = readFileSync(resolve(repoRoot, mdSource), "utf8");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai172-goal-conversion-contract-v1-2026-06-13.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai172-goal-conversion-contract-v1-2026-06-13.md");

const rows = parseStaleIntentRows(source);
const classified = rows.map((row) => {
  const observation = observationForRow(row);
  return {
    ...row,
    classification: classifyEndgameGoalConversion(observation),
  };
});
const output = {
  schemaVersion: "ai172-goal-conversion-contract-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  source: mdSource,
  contracts: ENDGAME_GOAL_CONVERSION_CONTRACTS,
  aggregate: {
    contracts: ENDGAME_GOAL_CONVERSION_CONTRACTS.length,
    staleIntents: classified.length,
    byContract: countBy(classified, (entry) => entry.intent),
    byBlocker: countBy(classified, (entry) => entry.classification.blockerCategory),
  },
  staleIntents: classified,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function parseStaleIntentRows(markdown: string): StaleIntentRow[] {
  return markdown
    .split(/\r?\n/)
    .filter((line) => line.startsWith("| `") && line.includes(" | `"))
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((columns) => columns.length >= 8)
    .map((columns) => ({
      caseId: stripCode(columns[1]),
      subcluster: stripCode(columns[2]),
      intent: stripCode(columns[3]) as EndgameGoalConversionContractId,
      staleCount: Number(columns[4]),
      lastConversionAttempt: stripCode(columns[5]),
      family: stripCode(columns[6]),
    }))
    .filter((row) =>
      ENDGAME_GOAL_CONVERSION_CONTRACTS.some((contract) => contract.id === row.intent),
    );
}

function observationForRow(row: StaleIntentRow) {
  const familyText = row.family.toLocaleLowerCase("en-US");
  return {
    contractId: row.intent,
    staleCount: row.staleCount,
    lastConversionAttempt: row.lastConversionAttempt,
    hasLegalAlternative: !familyText.includes("target_context"),
    targetContextComplete: !familyText.includes("target_context"),
    payoffVisible:
      !familyText.includes("punish_stale") &&
      !familyText.includes("payoff_selection") &&
      !familyText.includes("tempo_conversion_gap"),
    payable: !familyText.includes("unpayable"),
    hardGateClear: !familyText.includes("blocked"),
  };
}

function renderMarkdown(input: typeof output): string {
  const contractRows = input.contracts
    .map(
      (contract) =>
        `| \`${contract.id}\` | ${contract.side} | ${contract.staleThreshold} | ${contract.expectedConversions.join(", ")} |`,
    )
    .join("\n");
  const blockerRows = Object.entries(input.aggregate.byBlocker)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([blocker, count]) => `| \`${blocker}\` | ${count} |`)
    .join("\n");
  const intentRows = input.staleIntents
    .slice(0, 12)
    .map(
      (entry) =>
        `| \`${entry.caseId}\` | \`${entry.intent}\` | ${entry.staleCount} | \`${entry.family}\` | \`${entry.classification.blockerCategory}\` |`,
    )
    .join("\n");
  return `# AI172 Goal Conversion Contract v1

Datum: 2026-06-13

Branch: \`codex/ai170-ai180-opportunity-snapshots\`

## Ziel

AI172 definiert read-only Endgame-Goal-Conversion-Contracts und wendet sie auf die 27 stale Intents aus AI160 an. Die Contracts beschreiben erwartete Konversionen, Blocker und LegalAction-Anforderungen, ohne Scoring oder Runtime-Auswahl zu ändern.

## Contracts

| Contract | Side | Stale Threshold | Expected Conversions |
| --- | --- | ---: | --- |
${contractRows}

## Klassifikation

| Metrik | Wert |
| --- | ---: |
| Contracts | ${input.aggregate.contracts} |
| Stale Intents | ${input.aggregate.staleIntents} |

| Blocker | Fälle |
| --- | ---: |
${blockerRows}

## Top-Stale-Intents

| Case | Contract | Stale Count | Family | Blocker |
| --- | --- | ---: | --- | --- |
${intentRows}

## Schluss

Die stale Intents sind jetzt nicht nur gezählt, sondern an Zielverträge gebunden. Besonders \`corp.convert_tag_to_punish\` bleibt ohne sichtbaren Payoff oder Ersatzentscheidung der größte Contract-Blocker. Folgepakete dürfen daraus Solver-Fragen ableiten, aber noch keine produktive Gewichtung.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai172-goal-conversion-contract-v1.ts\`
- \`corepack pnpm --filter @netgrid/ai test -- endgame-goal-conversion-contracts\`
- \`git diff --check\`
`;
}

function stripCode(value: string): string {
  return value.replace(/^`|`$/g, "");
}

function countBy<T>(entries: readonly T[], keyFor: (entry: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    const key = keyFor(entry);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
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
