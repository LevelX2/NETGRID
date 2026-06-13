import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Label = {
  actionIndex: number;
  actionType: string;
  side: string;
  label: string;
  followUp: { within5: string[]; within10: string[]; within20: string[] };
};

type Labels = {
  cases: Array<{ caseId: string; dominantSubcluster: string; labels: Label[] }>;
};

const TARGET_LABELS = [
  "progress_access",
  "progress_trash",
  "progress_steal",
  "progress_score",
  "progress_coverage_install",
  "progress_reachability_improved",
  "progress_server_protected",
  "progress_economy_converted",
];
const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug|deckTop/i;

const repoRoot = findRepoRoot(process.cwd());
const labels = readJson<Labels>("docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json");
const patterns = TARGET_LABELS.map((targetLabel) => {
  const examples = labels.cases.flatMap((entry) =>
    entry.labels
      .filter((label) => label.label === targetLabel)
      .slice(0, 3)
      .map((label) => ({
        caseId: entry.caseId,
        dominantSubcluster: entry.dominantSubcluster,
        actionIndex: label.actionIndex,
        side: label.side,
        actionType: label.actionType,
        boardstateSummary: summarizeBoardstate(entry.dominantSubcluster, label),
        targetContext: inferTargetContext(label),
        costProfile: inferCostProfile(label),
        timingProfile: inferTimingProfile(label),
        followUpOutcome: summarizeFollowUp(label),
      })),
  );
  return {
    progressLabel: targetLabel,
    totalActions: labels.cases.reduce((sum, entry) => sum + entry.labels.filter((label) => label.label === targetLabel).length, 0),
    examples: examples.slice(0, 8),
  };
});
const output = {
  schemaVersion: "ai163-selfplay-progress-pattern-library-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  redaction: scanRedaction({ patterns }),
  patterns,
};
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai163-selfplay-progress-pattern-library-2026-06-12.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai163-selfplay-progress-pattern-library-2026-06-12.md");
mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify({ patterns: patterns.length, redactionSafe: output.redaction.safe }, null, 2));

function summarizeBoardstate(subcluster: string, label: Label): string {
  if (/runner/.test(subcluster)) return `runner endwindow ${subcluster} via ${label.actionType}`;
  if (/corp/.test(subcluster)) return `corp endwindow ${subcluster} via ${label.actionType}`;
  return `mixed endwindow ${subcluster} via ${label.actionType}`;
}

function inferTargetContext(label: Label): string {
  if (/access|trash|steal/.test(label.label)) return "payoff_target_side_safe";
  if (/score|server_protected/.test(label.label)) return "corp_scoreline_or_server_side_safe";
  if (/coverage|reachability/.test(label.label)) return "run_path_or_ice_type_side_safe";
  return "economy_conversion_side_safe";
}

function inferCostProfile(label: Label): string {
  if (/credit|install|rez|trash|advance|score/.test(label.actionType)) return "cost_relevant";
  return "cost_not_primary";
}

function inferTimingProfile(label: Label): string {
  if (/run|access|break|pump/.test(label.actionType)) return "run_window";
  if (/score|advance|rez|install/.test(label.actionType)) return "corp_or_install_window";
  return "basic_action_or_choice_window";
}

function summarizeFollowUp(label: Label): string {
  const unique = Array.from(new Set(label.followUp.within20)).filter((entry) => entry.startsWith("progress_"));
  return unique.length > 0 ? unique.slice(0, 4).join(",") : "no_followup_progress";
}

function renderMarkdown(output: typeof output): string {
  return `# AI163 Selfplay Progress Pattern Library

Datum: 2026-06-12

Branch: \`codex/ai159-ai169-endgame-opportunity\`

## Ziel

AI163 baut aus den positiven Progress-Actions aus AI132 eine kleine deterministische Pattern-Library. Sie ist redaction-safe und dient späterem Shadow-Scoring, ohne Runtime-Wirkung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Pattern-Klassen | ${output.patterns.length} |
| Redaction-safe | ${output.redaction.safe ? 1 : 0} |

## Pattern Summary

| Progress Label | Aktionen | Beispiele |
| --- | ---: | ---: |
${output.patterns.map((pattern) => `| \`${pattern.progressLabel}\` | ${pattern.totalActions} | ${pattern.examples.length} |`).join("\n")}

## Beispiele

${output.patterns
  .map(
    (pattern) => `### ${pattern.progressLabel}

| Case | Action | Boardstate Summary | TargetContext | Cost | Timing | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
${pattern.examples
  .map(
    (example) =>
      `| \`${example.caseId}\` | ${example.side}/${example.actionType}@${example.actionIndex} | ${example.boardstateSummary} | \`${example.targetContext}\` | \`${example.costProfile}\` | \`${example.timingProfile}\` | \`${example.followUpOutcome}\` |`,
  )
  .join("\n")}`,
  )
  .join("\n\n")}

## Schluss

Die Library zeigt positive Muster für Access, Trash, Steal, Score, Coverage, Reachability, Protection und Economy-Konversion. Sie ist kein ML-Modell und kein Runtime-Gewicht, sondern ein wiederverwendbarer Shadow-Katalog.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai163-selfplay-progress-pattern-library.ts\`
- \`git diff --check\`
`;
}

function scanRedaction(value: unknown): { safe: boolean; forbiddenMarkers: string[] } {
  const text = JSON.stringify(value);
  const matches = text.match(FORBIDDEN_REDACTION_MARKERS);
  return { safe: matches === null, forbiddenMarkers: matches ? Array.from(new Set(matches)) : [] };
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
