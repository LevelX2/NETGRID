import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Labels = {
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    labels: Array<{
      actionType: string;
      side: string;
      label: string;
      followUp: { within20: string[] };
    }>;
  }>;
};

type TempoPath =
  | "scoreline_available"
  | "advance_to_score_available"
  | "rez_or_install_protection_available"
  | "extra_action_to_scoreline"
  | "economy_to_scoreline"
  | "economy_to_protection"
  | "punish_stale"
  | "reserve_without_visible_conversion";

const repoRoot = findRepoRoot(process.cwd());
const labels = readJson<Labels>("docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai162-corp-tempo-conversion-v2-2026-06-12.md");

const cases = labels.cases
  .filter((entry) => /corp_|runner_late_gain_credit|continue_chain/.test(entry.dominantSubcluster))
  .map((entry) => classify(entry));

mkdirSync(dirname(mdOut), { recursive: true });
writeFileSync(mdOut, renderMarkdown({ gitHead: git(["rev-parse", "--short", "HEAD"]), cases }), "utf8");
console.log(JSON.stringify({ cases: cases.length, pathCounts: countBy(cases, (entry) => entry.tempoPath) }, null, 2));

function classify(entry: Labels["cases"][number]) {
  const scoreline = entry.labels.some((label) => label.label === "progress_score" || label.actionType === "score_agenda");
  const advance = entry.labels.some((label) => label.actionType === "advance_card" && label.followUp.within20.includes("progress_score"));
  const protection = entry.labels.some((label) => label.label === "progress_server_protected" || ["rez_ice", "install_card"].includes(label.actionType));
  const actionGain = entry.labels.some(
    (label) => ["activated_card_ability", "resolve_choice"].includes(label.actionType) && label.followUp.within20.some((item) => ["progress_score", "progress_server_protected"].includes(item)),
  );
  const economyToScore = entry.labels.some((label) => label.label === "progress_economy_converted" && label.followUp.within20.includes("progress_score"));
  const economyToProtection = entry.labels.some((label) => label.label === "progress_economy_converted" && label.followUp.within20.includes("progress_server_protected"));
  const punishReal = entry.labels.some((label) => label.label === "progress_flatline");
  const punishIntent = entry.labels.some((label) => ["tag_runner", "trash_resource", "do_damage", "decline_rez"].includes(label.actionType));
  const tempoPath = choosePath({ scoreline, advance, protection, actionGain, economyToScore, economyToProtection, punishReal, punishIntent });
  return {
    caseId: entry.caseId,
    dominantSubcluster: entry.dominantSubcluster,
    scoreline,
    advance,
    protection,
    actionGain,
    economyToScore,
    economyToProtection,
    punishReal,
    punishIntent,
    tempoPath,
    cardEffectClasses: effectClasses(tempoPath),
    cutover: "shadow_only_needs_opportunity_proof",
  };
}

function choosePath(input: {
  scoreline: boolean;
  advance: boolean;
  protection: boolean;
  actionGain: boolean;
  economyToScore: boolean;
  economyToProtection: boolean;
  punishReal: boolean;
  punishIntent: boolean;
}): TempoPath {
  if (input.scoreline) return "scoreline_available";
  if (input.advance) return "advance_to_score_available";
  if (input.protection) return "rez_or_install_protection_available";
  if (input.actionGain) return "extra_action_to_scoreline";
  if (input.economyToScore) return "economy_to_scoreline";
  if (input.economyToProtection) return "economy_to_protection";
  if (input.punishIntent && !input.punishReal) return "punish_stale";
  return "reserve_without_visible_conversion";
}

function effectClasses(path: TempoPath): string {
  switch (path) {
    case "extra_action_to_scoreline":
      return "Corporate Boon";
    case "economy_to_scoreline":
    case "economy_to_protection":
      return "Corporate Coup, Political Coup";
    case "advance_to_score_available":
      return "Project Consultants, Management Shake-Up, Systematic Layoffs, Chicago Branch";
    case "punish_stale":
      return "On-Call Solo Team, Scorched Earth, Urban Renewal only with real tag/damage window";
    case "rez_or_install_protection_available":
      return "Rez or install protection";
    case "scoreline_available":
      return "Score agenda";
    case "reserve_without_visible_conversion":
      return "Reserve only";
  }
}

function renderMarkdown(input: { gitHead: string; cases: Array<ReturnType<typeof classify>> }): string {
  return `# AI162 Corp Tempo Conversion v2

Datum: 2026-06-12

Branch: \`codex/ai159-ai169-endgame-opportunity\`

## Ziel

AI162 übersetzt Corp-Economy und Tempo in konkrete Konversionspfade: Scoreline, Advance, Protection, Extra-Action, Economy-Conversion oder Punish-Stale. Es gibt keine Runtime-Wirkung und keine pauschale Corp-Credit-Strafe.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Corp-/mixed-Fälle | ${input.cases.length} |

## Pfade

${markdownCountTable(countBy(input.cases, (entry) => entry.tempoPath), "Pfad")}

## Fälle

| Case | Subcluster | Scoreline | Advance | Protection | ActionGain | Economy->Score | Economy->Protection | Punish Intent | Pfad | Effektklasse | Cutover |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
${input.cases
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${entry.scoreline ? 1 : 0} | ${entry.advance ? 1 : 0} | ${entry.protection ? 1 : 0} | ${entry.actionGain ? 1 : 0} | ${entry.economyToScore ? 1 : 0} | ${entry.economyToProtection ? 1 : 0} | ${entry.punishIntent ? 1 : 0} | \`${entry.tempoPath}\` | ${entry.cardEffectClasses} | \`${entry.cutover}\` |`,
  )
  .join("\n")}

## Schluss

Corp-Tempo ist weiterhin sichtbar, aber nicht cutoverfähig. Besonders Punish bleibt nur dann Fortschritt, wenn ein reales Tag-/Damage-Fenster vorhanden ist; andernfalls ist es stale und muss in Ladder/Lookahead als Blocker erscheinen.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai162-corp-tempo-conversion-v2.ts\`
- \`git diff --check\`
`;
}

function markdownCountTable(counts: Record<string, number>, label: string): string {
  const rows = Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `| \`${key}\` | ${value} |`);
  return [`| ${label} | Fälle |`, "| --- | ---: |", ...rows].join("\n");
}

function countBy<T>(entries: readonly T[], keyFor: (entry: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) counts[keyFor(entry)] = (counts[keyFor(entry)] ?? 0) + 1;
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
