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

type IntentType =
  | "runner.fix_coverage"
  | "runner.convert_reachability_to_access"
  | "runner.find_payoff"
  | "corp.convert_economy_to_scoreline"
  | "corp.protect_scoreline"
  | "corp.convert_tag_to_punish";

const repoRoot = findRepoRoot(process.cwd());
const labels = readJson<Labels>("docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json");
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai160-stale-intent-root-cause-review-2026-06-12.md",
);

const staleIntents = labels.cases.flatMap((entry) =>
  buildIntents(entry.labels)
    .filter((intent) => intent.status === "stale_without_conversion")
    .map((intent) => ({
      caseId: entry.caseId,
      dominantSubcluster: entry.dominantSubcluster,
      ...intent,
      family: rootCauseFamily(intent.intent, entry.dominantSubcluster),
    })),
);
const grouped = groupFamilies(staleIntents).slice(0, 8);
const topFive = grouped.slice(0, 5);

mkdirSync(dirname(mdOut), { recursive: true });
writeFileSync(
  mdOut,
  renderMarkdown({ gitHead: git(["rev-parse", "--short", "HEAD"]), staleIntents, topFive }),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      staleIntents: staleIntents.length,
      topFamilies: topFive.length,
      familyCounts: Object.fromEntries(topFive.map((entry) => [entry.family, entry.count])),
    },
    null,
    2,
  ),
);

function buildIntents(labelsForCase: Label[]) {
  const configs: Array<{
    intent: IntentType;
    supportLabels: string[];
    supportingActions: string[];
    conversionLabels: string[];
  }> = [
    {
      intent: "runner.fix_coverage",
      supportLabels: ["progress_coverage_install"],
      supportingActions: ["install_card", "activated_card_ability", "draw_card", "gain_credit"],
      conversionLabels: ["progress_coverage_install", "progress_reachability_improved", "progress_access"],
    },
    {
      intent: "runner.convert_reachability_to_access",
      supportLabels: ["progress_reachability_improved"],
      supportingActions: ["continue_run", "break_subroutine", "pump_breaker"],
      conversionLabels: ["progress_access", "progress_trash", "progress_steal"],
    },
    {
      intent: "runner.find_payoff",
      supportLabels: ["progress_access", "progress_trash", "progress_steal"],
      supportingActions: ["access_card", "trash_accessed_card", "steal_agenda"],
      conversionLabels: ["progress_trash", "progress_steal"],
    },
    {
      intent: "corp.convert_economy_to_scoreline",
      supportLabels: ["progress_economy_converted"],
      supportingActions: ["gain_credit", "activated_card_ability", "resolve_choice"],
      conversionLabels: ["progress_score", "progress_server_protected"],
    },
    {
      intent: "corp.protect_scoreline",
      supportLabels: ["progress_server_protected"],
      supportingActions: ["rez_ice", "install_card", "advance_card"],
      conversionLabels: ["progress_server_protected", "progress_score"],
    },
    {
      intent: "corp.convert_tag_to_punish",
      supportLabels: ["no_progress_plausible", "progress_flatline"],
      supportingActions: ["tag_runner", "trash_resource", "do_damage"],
      conversionLabels: ["progress_flatline"],
    },
  ];
  return configs.flatMap((config) => {
    const support = labelsForCase.filter(
      (label) =>
        config.supportLabels.includes(label.label) ||
        config.supportingActions.includes(label.actionType),
    );
    if (support.length === 0) return [];
    const conversionObserved = labelsForCase.some((label) => config.conversionLabels.includes(label.label));
    const staleCount = support.filter(
      (label) =>
        label.label === "no_progress_stale" ||
        label.followUp.within20.every((followUp) => !config.conversionLabels.includes(followUp)),
    ).length;
    return [
      {
        intent: config.intent,
        side: support[0]?.side ?? "unknown",
        lastConversionAttempt: support.at(-1)
          ? `${support.at(-1)?.side}/${support.at(-1)?.actionType}@${support.at(-1)?.actionIndex}`
          : "none",
        staleCount,
        status: conversionObserved ? "conversion_observed" : staleCount > 0 ? "stale_without_conversion" : "blocked",
      },
    ];
  });
}

function rootCauseFamily(intent: IntentType, subcluster: string): string {
  if (intent === "corp.convert_tag_to_punish") return "punish_stale_or_no_real_tag_window";
  if (intent === "runner.convert_reachability_to_access") return "reachability_not_converted_to_access";
  if (intent === "corp.convert_economy_to_scoreline") return "tempo_conversion_gap";
  if (intent === "corp.protect_scoreline") return "protection_conversion_gap";
  if (intent === "runner.fix_coverage") return "coverage_path_gap";
  if (/continue_chain|run_microstep/.test(subcluster)) return "target_context_or_run_step_gap";
  return "payoff_selection_gap";
}

function groupFamilies(
  entries: Array<{
    caseId: string;
    dominantSubcluster: string;
    intent: IntentType;
    staleCount: number;
    side: string;
    lastConversionAttempt: string;
    family: string;
  }>,
) {
  const byFamily = new Map<
    string,
    {
      family: string;
      count: number;
      staleTotal: number;
      intents: Set<string>;
      cases: Set<string>;
      subclusters: Set<string>;
      lastAttempts: string[];
      problemClass: string;
    }
  >();
  for (const entry of entries) {
    const existing =
      byFamily.get(entry.family) ??
      {
        family: entry.family,
        count: 0,
        staleTotal: 0,
        intents: new Set<string>(),
        cases: new Set<string>(),
        subclusters: new Set<string>(),
        lastAttempts: [],
        problemClass: classifyProblem(entry.family),
      };
    existing.count += 1;
    existing.staleTotal += entry.staleCount;
    existing.intents.add(entry.intent);
    existing.cases.add(entry.caseId);
    existing.subclusters.add(entry.dominantSubcluster);
    existing.lastAttempts.push(`${entry.caseId}:${entry.lastConversionAttempt}`);
    byFamily.set(entry.family, existing);
  }
  return Array.from(byFamily.values())
    .sort((left, right) => right.staleTotal - left.staleTotal || right.count - left.count)
    .map((entry) => ({
      family: entry.family,
      count: entry.count,
      staleTotal: entry.staleTotal,
      intents: Array.from(entry.intents).sort(),
      cases: Array.from(entry.cases).sort(),
      subclusters: Array.from(entry.subclusters).sort(),
      lastAttempts: entry.lastAttempts.slice(0, 5),
      problemClass: entry.problemClass,
    }));
}

function classifyProblem(family: string): string {
  if (family.includes("coverage")) return "coverage";
  if (family.includes("tempo") || family.includes("protection")) return "tempo";
  if (family.includes("target_context") || family.includes("run_step")) return "targetContext";
  if (family.includes("punish")) return "fix";
  return "fix";
}

function renderMarkdown(input: {
  gitHead: string;
  staleIntents: Array<{ caseId: string; dominantSubcluster: string; intent: IntentType; staleCount: number; lastConversionAttempt: string; family: string }>;
  topFive: Array<{
    family: string;
    count: number;
    staleTotal: number;
    intents: string[];
    cases: string[];
    subclusters: string[];
    lastAttempts: string[];
    problemClass: string;
  }>;
}): string {
  return `# AI160 Stale Intent Root-Cause Review

Datum: 2026-06-12

Branch: \`codex/ai159-ai169-endgame-opportunity\`

## Ziel

AI160 priorisiert die 27 \`stale_without_conversion\`-Intents aus AI151 nach Intent-Typ, Pair/Seed, Subcluster, letzter Conversion-Spur und Problemklasse. Es werden keine Action-Type-Mali eingeführt.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| stale Intents | ${input.staleIntents.length} |
| Top-Familien | ${input.topFive.length} |

## Top-5 Stale Intent Families

| Family | Problemklasse | Fälle | Stale Total | Intents | Subcluster |
| --- | --- | ---: | ---: | --- | --- |
${input.topFive
  .map(
    (entry) =>
      `| \`${entry.family}\` | \`${entry.problemClass}\` | ${entry.count} | ${entry.staleTotal} | ${entry.intents.map((intent) => `\`${intent}\``).join(", ")} | ${entry.subclusters.map((cluster) => `\`${cluster}\``).join(", ")} |`,
  )
  .join("\n")}

## Letzte Conversion-Versuche

| Family | Beispiele |
| --- | --- |
${input.topFive
  .map((entry) => `| \`${entry.family}\` | ${entry.lastAttempts.map((attempt) => `\`${attempt}\``).join(", ")} |`)
  .join("\n")}

## Stale Intents

| Case | Subcluster | Intent | Stale Count | Last Conversion Attempt | Family |
| --- | --- | --- | ---: | --- | --- |
${input.staleIntents
  .sort((left, right) => right.staleCount - left.staleCount || left.caseId.localeCompare(right.caseId))
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | \`${entry.intent}\` | ${entry.staleCount} | \`${entry.lastConversionAttempt}\` | \`${entry.family}\` |`,
  )
  .join("\n")}

## Schluss

Die wichtigste Root-Cause-Familie ist stale oder nicht reales Punish-/Tag-Fenster. Danach folgen Reachability, die nicht in Access konvertiert, und Schutz-/Tempo-Konversionen. Das sind konkrete Kandidaten für AI164/AI165, aber weiterhin keine Begründung für pauschale Credit-, Draw-, Run- oder Corp-Economy-Strafen.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai160-stale-intent-root-cause-review.ts\`
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
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}
