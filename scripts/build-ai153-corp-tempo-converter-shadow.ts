import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Labels = {
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    labels: Array<{
      actionIndex: number;
      actionType: string;
      side: string;
      label: string;
      followUp: { within5: string[]; within10: string[]; within20: string[] };
    }>;
  }>;
};

type CorpTempoCategory =
  | "safe_scoreline_action"
  | "advance_to_score"
  | "rez_or_install_protection"
  | "economy_to_rez"
  | "economy_to_score"
  | "action_gain_to_scoreline"
  | "opaque_ability"
  | "reserve_without_visible_conversion";

const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug|deckTop/i;

const repoRoot = findRepoRoot(process.cwd());
const labels = readJson<Labels>("docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json");
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai153-corp-tempo-converter-shadow-2026-06-12.md",
);

const corpCases = labels.cases
  .filter((entry) => /corp_|runner_late_gain_credit|continue_chain/.test(entry.dominantSubcluster))
  .map((entry) => classifyCase(entry));
const assertions = runAssertions();
const redaction = scanRedaction({ corpCases, assertions });

mkdirSync(dirname(mdOut), { recursive: true });
writeFileSync(
  mdOut,
  renderMarkdown({
    gitHead: git(["rev-parse", "--short", "HEAD"]),
    redaction,
    corpCases,
    assertions,
  }),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      cases: corpCases.length,
      categoryCounts: countBy(corpCases, (entry) => entry.category),
      assertionsPassed: assertions.every((entry) => entry.passed),
      redactionSafe: redaction.safe,
    },
    null,
    2,
  ),
);

function classifyCase(entry: Labels["cases"][number]) {
  const score = entry.labels.filter((label) => label.label === "progress_score").length;
  const advance = entry.labels.filter((label) => label.actionType === "advance_card").length;
  const rezOrInstallProtection = entry.labels.filter(
    (label) =>
      ["rez_ice", "install_card"].includes(label.actionType) ||
      label.label === "progress_server_protected",
  ).length;
  const economy = entry.labels.filter((label) => label.label === "progress_economy_converted").length;
  const actionGain = entry.labels.filter(
    (label) =>
      ["activated_card_ability", "resolve_choice"].includes(label.actionType) &&
      label.followUp.within20.some((followUp) =>
        ["progress_score", "progress_server_protected"].includes(followUp),
      ),
  ).length;
  const opaqueAbility = entry.labels.filter(
    (label) =>
      ["activated_card_ability", "resolve_choice"].includes(label.actionType) &&
      !label.followUp.within20.some((followUp) =>
        ["progress_score", "progress_server_protected", "progress_economy_converted"].includes(followUp),
      ),
  ).length;
  const economyToScore = entry.labels.filter(
    (label) =>
      label.label === "progress_economy_converted" &&
      label.followUp.within20.includes("progress_score"),
  ).length;
  const economyToRez = entry.labels.filter(
    (label) =>
      label.label === "progress_economy_converted" &&
      label.followUp.within20.includes("progress_server_protected"),
  ).length;
  const category = chooseCategory({
    score,
    advance,
    rezOrInstallProtection,
    economyToRez,
    economyToScore,
    actionGain,
    opaqueAbility,
    economy,
  });
  return {
    caseId: entry.caseId,
    dominantSubcluster: entry.dominantSubcluster,
    score,
    advance,
    rezOrInstallProtection,
    economy,
    economyToRez,
    economyToScore,
    actionGain,
    opaqueAbility,
    category,
    cutover: "shadow_only_needs_same_state_fixture",
  };
}

function chooseCategory(input: {
  score: number;
  advance: number;
  rezOrInstallProtection: number;
  economyToRez: number;
  economyToScore: number;
  actionGain: number;
  opaqueAbility: number;
  economy: number;
}): CorpTempoCategory {
  if (input.score > 0) return "safe_scoreline_action";
  if (input.advance > 0 && input.economyToScore + input.actionGain > 0) return "advance_to_score";
  if (input.rezOrInstallProtection > 0) return "rez_or_install_protection";
  if (input.economyToScore > 0) return "economy_to_score";
  if (input.economyToRez > 0) return "economy_to_rez";
  if (input.actionGain > 0) return "action_gain_to_scoreline";
  if (input.opaqueAbility > 0) return "opaque_ability";
  return "reserve_without_visible_conversion";
}

function runAssertions() {
  const scenarios = [
    {
      name: "Corporate Boon nur Scoreline-Progress bei sichtbarer Konversion",
      expected: "action_gain_to_scoreline",
      actual: chooseCategory({
        score: 0,
        advance: 0,
        rezOrInstallProtection: 0,
        economyToRez: 0,
        economyToScore: 0,
        actionGain: 1,
        opaqueAbility: 0,
        economy: 0,
      }),
    },
    {
      name: "Project Consultants / Management Shake-Up als Advancement-Tempo",
      expected: "advance_to_score",
      actual: chooseCategory({
        score: 0,
        advance: 1,
        rezOrInstallProtection: 0,
        economyToRez: 0,
        economyToScore: 1,
        actionGain: 0,
        opaqueAbility: 0,
        economy: 1,
      }),
    },
    {
      name: "Pure Economy bleibt Reserve ohne Konversion",
      expected: "reserve_without_visible_conversion",
      actual: chooseCategory({
        score: 0,
        advance: 0,
        rezOrInstallProtection: 0,
        economyToRez: 0,
        economyToScore: 0,
        actionGain: 0,
        opaqueAbility: 0,
        economy: 2,
      }),
    },
  ];
  return scenarios.map((entry) => ({
    ...entry,
    passed: entry.actual === entry.expected,
  }));
}

function renderMarkdown(input: {
  gitHead: string;
  redaction: { safe: boolean };
  corpCases: Array<ReturnType<typeof classifyCase>>;
  assertions: Array<{ name: string; expected: string; actual: string; passed: boolean }>;
}): string {
  return `# AI153 Corp Scoreline/Tempo Converter Shadow

Datum: 2026-06-12

Branch: \`codex/ai149-ai158-same-state-semantic-endgame\`

## Ziel

AI153 bewertet Corp-Economy und Corp-Ability-Actions nur nach sichtbarer Konversion in Scoreline, Advance, Rez oder Protection. Es gibt keine generische Corp-Economy-Strafe und keine Runtime-Wirkung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Corp-/mixed-Fälle | ${input.corpCases.length} |
| Assertions bestanden | ${input.assertions.filter((entry) => entry.passed).length}/${input.assertions.length} |
| Redaction-safe | ${input.redaction.safe ? 1 : 0} |

## Kategorien

${markdownCountTable(countBy(input.corpCases, (entry) => entry.category), "Kategorie")}

## Assertions

| Test | Erwartet | Erhalten | Ergebnis |
| --- | --- | --- | --- |
${input.assertions
  .map(
    (entry) =>
      `| ${entry.name} | \`${entry.expected}\` | \`${entry.actual}\` | ${entry.passed ? "pass" : "fail"} |`,
  )
  .join("\n")}

## Fälle

| Case | Subcluster | Score | Advance | Rez/Protection | Economy | Economy->Rez | Economy->Score | ActionGain | Opaque | Kategorie | Cutover |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
${input.corpCases
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${entry.score} | ${entry.advance} | ${entry.rezOrInstallProtection} | ${entry.economy} | ${entry.economyToRez} | ${entry.economyToScore} | ${entry.actionGain} | ${entry.opaqueAbility} | \`${entry.category}\` | \`${entry.cutover}\` |`,
  )
  .join("\n")}

## Schluss

Der Converter macht sichtbare Corp-Tempo-Konversionen unterscheidbar. Score, Advance und Protection bleiben starke Shadow-Signale; reine Economy bleibt Reserve, solange keine side-safe Konversion sichtbar ist. AI149 liefert weiter keinen same-state Cutover-Beweis.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai153-corp-tempo-converter-shadow.ts\`
- \`git diff --check\`
`;
}

function markdownCountTable(counts: Record<string, number>, label: string): string {
  const rows = Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `| \`${key}\` | ${value} |`);
  return [`| ${label} | Fälle |`, "| --- | ---: |", ...rows].join("\n");
}

function countBy<T>(
  entries: readonly T[],
  keyFor: (entry: T) => string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    const key = keyFor(entry);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function scanRedaction(value: unknown): { safe: boolean; forbiddenMarkers: string[] } {
  const text = JSON.stringify(value);
  const matches = text.match(FORBIDDEN_REDACTION_MARKERS);
  return {
    safe: matches === null,
    forbiddenMarkers: matches ? Array.from(new Set(matches)) : [],
  };
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(repoRoot, relativePath), "utf8")) as T;
}

function findRepoRoot(start: string): string {
  let current = resolve(start);
  for (;;) {
    try {
      const packageJson = JSON.parse(
        readFileSync(join(current, "package.json"), "utf8"),
      ) as { name?: string };
      if (packageJson.name === "netgrid-app") return current;
    } catch {
      // Continue walking up.
    }
    const parent = dirname(current);
    if (parent === current) {
      throw new Error(`Could not find NETGRID repo root from ${start}`);
    }
    current = parent;
  }
}

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}
