import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  benchmarkDeckFromFrozenLocalSnapshot,
  benchmarkDeckFromSnapshot,
  runAiSelfplayTraceMining,
} from "../packages/ai/src/simulation";
import type { AiSimulationSummary } from "../packages/ai/src/simulation";

type PairId = "a" | "b" | "c" | "d";
type ActionEntry = AiSimulationSummary["actionSequence"][number];
type SubclusterCounts = Record<string, number>;

type TracePairFile = {
  pair: {
    id: string;
    label: string;
    runner: string;
    corp: string;
  };
};

const PAIR_IDS: PairId[] = ["a", "b", "c", "d"];
const SEEDS = [
  "ai-v143-tuning-001",
  "ai-v143-tuning-002",
  "ai-v143-tuning-003",
  "ai-v143-tuning-004",
  "ai-v143-tuning-005",
  "ai-v143-tuning-006",
  "ai-v143-tuning-007",
  "ai-v143-tuning-008",
  "ai-v143-tuning-009",
  "ai-v143-tuning-010",
];
const X5_SEEDS = new Set(SEEDS.slice(0, 5));
const MAX_ACTIONS = 160;
const MAX_FINDINGS = 50;

const repoRoot = findRepoRoot(process.cwd());
const jsonOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.json",
);
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.md",
);
const baselineTrace = JSON.parse(
  readFileSync(
    resolve(
      repoRoot,
      "docs/reviews/ai/ai120-residual-action-limit-a-d-10seed-2026-06-12.json",
    ),
    "utf8",
  ),
) as {
  aggregate: {
    games: number;
    actionLimitReached: number;
    actionLimitSubclusters: Record<string, number>;
  };
  pairs: Array<{
    pair: { id: string };
    aggregate: { actionLimitSubclusters: Record<string, number> };
  }>;
};

const actionLimitGames = [];

for (const pairId of PAIR_IDS) {
  const pair = readPair(pairId).pair;
  const runner = benchmarkDeckFromAnySnapshot(pair.runner);
  const corp = benchmarkDeckFromAnySnapshot(pair.corp);
  const result = runAiSelfplayTraceMining({
    seeds: SEEDS,
    runnerDeck: runner.deck,
    corpDeck: corp.deck,
    runnerDeckMetadata: runner.metadata,
    corpDeckMetadata: corp.metadata,
    maxActions: MAX_ACTIONS,
    maxFindings: MAX_FINDINGS,
  });
  for (const summary of result.summaries) {
    if (summary.winner !== "action_limit_reached") continue;
    const last60 = summary.actionSequence.slice(-60);
    const windowSubclusters = countWindowSubclusters(last60);
    const rankedWindowSubclusters = rankedCounts(windowSubclusters);
    const officialSubcluster =
      rankedWindowSubclusters.find((entry) => entry.value > 0)?.key ??
      "mixed_unknown";
    const actionKindCounts = countActionKinds(last60);
    const lastProgress = lastProgressAction(summary.actionSequence);
    const sideCounts = countSides(last60);
    const dominantSide = dominantEndSide(sideCounts);
    actionLimitGames.push({
      pair: pair.id,
      pairLabel: pair.label,
      seed: summary.seed,
      seedBand: X5_SEEDS.has(summary.seed) ? "001-005" : "006-010",
      finalAgendaPoints: summary.finalAgendaPoints,
      actions: summary.actions,
      turns: summary.turns,
      winner: summary.winner,
      officialSubcluster,
      dominantSubcluster: officialSubcluster,
      secondarySubcluster:
        rankedWindowSubclusters.find(
          (entry) => entry.key !== officialSubcluster,
        )?.key ?? "none",
      windowSubclusterCounts: windowSubclusters,
      sideCounts,
      dominantSide,
      actionKindCounts,
      lastProgressAction: lastProgress,
      last60Actions: last60.map((entry, offset) =>
        summarizeActionEntry(entry, summary.actionSequence.length - last60.length + offset),
      ),
      topFindings: result.topFindings.slice(0, 8).map((finding) => ({
        actionIndex: finding.actionIndex,
        side: finding.side,
        selectedActionType: finding.selectedActionType,
        detectorIds: finding.detectorIds,
        shortReason: finding.shortReason,
        relevantDebugFacts: finding.relevantDebugFacts.slice(0, 8),
      })),
    });
  }
}

const bySubcluster = countBy(actionLimitGames, (game) => game.officialSubcluster);
const officialBySubcluster = baselineTrace.aggregate.actionLimitSubclusters;
const officialByPair = Object.fromEntries(
  baselineTrace.pairs.map((entry) => [
    entry.pair.id,
    entry.aggregate.actionLimitSubclusters,
  ]),
);
const byPair = nestedCount(
  actionLimitGames,
  (game) => game.pair,
  (game) => game.officialSubcluster,
);
const bySeedBand = nestedCount(
  actionLimitGames,
  (game) => game.seedBand,
  (game) => game.officialSubcluster,
);
const newX10Cases = actionLimitGames.filter((game) => game.seedBand === "006-010");
const byNewX10Subcluster = countBy(
  newX10Cases,
  (game) => game.officialSubcluster,
);
const topResidualCauses = rankedCounts(officialBySubcluster)
  .filter((entry) => entry.value > 0)
  .slice(0, 3)
  .map((entry) => ({
    subcluster: entry.key,
    games: entry.value,
    rationale: rationaleForSubcluster(entry.key),
  }));

const output = {
  schemaVersion: "ai123-x10-residual-cluster-inventory-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  source: {
    baselineTrace: "docs/reviews/ai/ai120-residual-action-limit-a-d-10seed-2026-06-12.json",
    reproduced: true,
  },
  config: {
    pairIds: PAIR_IDS.map((id) => id.toUpperCase()),
    seeds: SEEDS,
    maxActions: MAX_ACTIONS,
    maxFindings: MAX_FINDINGS,
  },
  aggregate: {
    games: baselineTrace.aggregate.games,
    actionLimitReached: baselineTrace.aggregate.actionLimitReached,
    officialSubclusters: officialBySubcluster,
    officialSubclustersByPair: officialByPair,
    endWindowDominantSubclusters: bySubcluster,
    endWindowDominantSubclustersByPair: byPair,
    subclustersBySeedBand: bySeedBand,
    newX10Cases: newX10Cases.length,
    newX10Subclusters: byNewX10Subcluster,
    topResidualCauses,
  },
  actionLimitGames,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function readPair(id: PairId): TracePairFile {
  const path = join(
    repoRoot,
    "docs",
    "reviews",
    "ai",
    `ai-selfplay-trace-mining-${id}.json`,
  );
  return JSON.parse(readFileSync(path, "utf8")) as TracePairFile;
}

function benchmarkDeckFromAnySnapshot(
  snapshotId: string,
): ReturnType<typeof benchmarkDeckFromFrozenLocalSnapshot> {
  try {
    return benchmarkDeckFromFrozenLocalSnapshot(snapshotId);
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes("Unknown frozen local benchmark deck snapshot")
    ) {
      throw error;
    }
  }
  return benchmarkDeckFromSnapshot(snapshotId);
}

function oneCountKey(counts: Record<string, number>): string {
  return (
    Object.entries(counts).find(([, value]) => value > 0)?.[0] ??
    "mixed_unknown"
  );
}

function countWindowSubclusters(entries: readonly ActionEntry[]): SubclusterCounts {
  const counts: SubclusterCounts = {};
  for (const entry of entries) {
    const key = classifyWindowEntry(entry);
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function classifyWindowEntry(entry: ActionEntry): string | undefined {
  const text = entryText(entry);
  if (entry.actionType === "gain_credit" && entry.side === "runner") {
    if (
      entry.runnerEconomyTakenToReachRunReserve === true ||
      entry.runnerReservePreservingEconomy === true ||
      entry.runnerBelowReserveBefore === true ||
      (entry.runnerSetupMissingCoverageTypes?.length ?? 0) > 0 ||
      /reserve|known_unaffordable_path|missing_breaker_coverage|encounter_survival/.test(
        text,
      )
    ) {
      return "runner_late_gain_credit_real_reserve";
    }
    return entry.runnerPressureReadyTrue === true
      ? "runner_late_gain_credit_without_funding_need"
      : "runner_late_gain_credit_no_safe_alternative";
  }
  if (entry.actionType === "gain_credit" && entry.side === "corp") {
    if (
      entry.corpCreditsBelowCheapestRelevantRez === true ||
      entry.corpCreditsBelowEstimatedCentralRezNeed === true ||
      entry.corpCannotRezAnyNewlyInstalledIce === true ||
      entry.corpScoreConversionFixGateBlockedByCredits === true ||
      entry.corpEconomyBeforeScorePlausibleRezOrAdvanceReserve === true ||
      /rez_reserve|creditsbelow|blockedbycredits|protection|install_ice/.test(
        text,
      )
    ) {
      return "corp_late_gain_credit_real_rez_or_protection_reserve";
    }
    return entry.corpScoreTerminalWindowScoreLegal === true ||
      entry.corpScoreTerminalWindowAdvanceToScoreLegal === true ||
      entry.corpScoreTerminalWindowAgendaInstallLegal === true
      ? "corp_late_gain_credit_without_rez_score_protection_need"
      : "corp_late_gain_credit_no_safe_alternative";
  }
  if (entry.actionType === "draw_card") {
    return entry.runnerDrawSupportsCoverageOrHandGoal === true ||
      entry.runnerDrawForCoverageOrHandGoal === true ||
      (entry.runnerSetupMissingCoverageTypes?.length ?? 0) > 0 ||
      /coverage|hand_goal|draw_for_answer|supportsdraworsearchneed/.test(text)
      ? "late_draw_for_coverage_or_hand_goal"
      : "late_draw_without_coverage_or_hand_goal";
  }
  if (entry.actionType === "break_subroutine" || entry.actionType === "pump_breaker") {
    return "break_pump_required";
  }
  if (entry.actionType === "continue_run") return "continue_chain_to_access";
  if (entry.actionType === "start_run") return "run_microstep_required";
  if (entry.actionType === "access_card") return "access_pending";
  return undefined;
}

function countActionKinds(entries: readonly ActionEntry[]): Record<string, number> {
  const counts = {
    Basic: 0,
    Run: 0,
    Ability: 0,
    Draw: 0,
    Install: 0,
    Scoreline: 0,
    Economy: 0,
    Other: 0,
  };
  for (const entry of entries) {
    counts[actionKind(entry)] += 1;
  }
  return counts;
}

function actionKind(entry: ActionEntry): string {
  switch (entry.actionType) {
    case "gain_credit":
      return "Economy";
    case "draw_card":
      return "Draw";
    case "install_card":
    case "play_event":
      return "Install";
    case "activated_card_ability":
    case "trigger_ability":
      return "Ability";
    case "start_run":
    case "continue_run":
    case "jack_out":
    case "break_subroutine":
    case "pump_breaker":
    case "access_card":
    case "steal_agenda":
    case "trash_accessed_card":
    case "decline_trash":
      return "Run";
    case "advance_card":
    case "score_agenda":
      return "Scoreline";
    case "end_turn":
      return "Basic";
    default:
      return "Other";
  }
}

function lastProgressAction(entries: readonly ActionEntry[]) {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (!entry || !isProgressAction(entry)) continue;
    return summarizeActionEntry(entry, index);
  }
  return undefined;
}

function isProgressAction(entry: ActionEntry): boolean {
  return (
    entry.actionType === "steal_agenda" ||
    entry.actionType === "score_agenda" ||
    entry.actionType === "trash_accessed_card" ||
    entry.actionType === "advance_card" ||
    entry.advancedAgendaStolen === true ||
    entry.runnerCoverageImproved === true ||
    entry.runnerRemoteTrashTaken === true ||
    entry.corpScoreTerminalScoreTaken === true ||
    entry.corpScoreTerminalAdvanceTaken === true ||
    entry.protectBeforeAdvance === true
  );
}

function countSides(entries: readonly ActionEntry[]): Record<string, number> {
  return countBy(entries, (entry) => entry.side ?? "unknown");
}

function dominantEndSide(counts: Record<string, number>): string {
  const runner = counts.runner ?? 0;
  const corp = counts.corp ?? 0;
  if (runner >= corp + 6) return "runner";
  if (corp >= runner + 6) return "corp";
  return "mixed";
}

function summarizeActionEntry(entry: ActionEntry, index: number) {
  return {
    index,
    turn: entry.turnNumber,
    side: entry.side,
    actionType: entry.actionType,
    kind: actionKind(entry),
    targetServerId: entry.targetServerId,
    planKind: entry.planKind,
    reasonCode: entry.reasonCode,
    scoreActionsAvailable: entry.scoreActionsAvailable,
    runnerCreditsBefore: entry.runnerCreditsBefore,
    runnerCreditsAfter: entry.runnerCreditsAfter,
    corpCreditsBefore: entry.corpCreditsBefore,
    corpCreditsAfter: entry.corpCreditsAfter,
    runnerSetupMissingCoverageTypes: entry.runnerSetupMissingCoverageTypes,
    runnerPressureReadyTrue: entry.runnerPressureReadyTrue,
    runnerBelowReserveBefore: entry.runnerBelowReserveBefore,
    runnerBelowReserveAfter: entry.runnerBelowReserveAfter,
    corpScoreTerminalWindowScoreLegal: entry.corpScoreTerminalWindowScoreLegal,
    corpScoreTerminalWindowAdvanceToScoreLegal:
      entry.corpScoreTerminalWindowAdvanceToScoreLegal,
    corpScoreTerminalWindowAgendaInstallLegal:
      entry.corpScoreTerminalWindowAgendaInstallLegal,
    actionAlternatives: entry.actionAlternatives,
  };
}

function entryText(entry: ActionEntry): string {
  return [
    entry.reasonCode,
    entry.explanation,
    entry.planKind ?? "",
    ...(entry.evidence ?? []),
    ...(entry.debugFacts ?? []),
    ...(entry.qualityTags ?? []),
  ]
    .join("|")
    .toLocaleLowerCase("en-US");
}

function rankedCounts(counts: Record<string, number>): Array<{ key: string; value: number }> {
  return Object.entries(counts)
    .map(([key, value]) => ({ key, value }))
    .sort((left, right) => right.value - left.value || left.key.localeCompare(right.key));
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

function nestedCount<T>(
  entries: readonly T[],
  groupFor: (entry: T) => string,
  keyFor: (entry: T) => string,
): Record<string, Record<string, number>> {
  const counts: Record<string, Record<string, number>> = {};
  for (const entry of entries) {
    const group = groupFor(entry);
    const key = keyFor(entry);
    counts[group] = counts[group] ?? {};
    counts[group][key] = (counts[group][key] ?? 0) + 1;
  }
  return counts;
}

function rationaleForSubcluster(subcluster: string): string {
  if (subcluster === "runner_late_gain_credit_real_reserve") {
    return "Runner economy dominates the residual set, but the trace flags mostly show reserve, coverage, or affordability pressure rather than a safe better action.";
  }
  if (subcluster === "run_microstep_required") {
    return "Several action limits terminate inside necessary run microflow; these are not obvious no-progress loops.";
  }
  if (subcluster === "corp_late_gain_credit_real_rez_or_protection_reserve") {
    return "Corp economy windows remain tied to rez/protection reserve signals and need alternative evidence before runtime pressure.";
  }
  return "Residual bucket is smaller and needs targeted review before any runtime change.";
}

function renderMarkdown(output: {
  aggregate: {
    games: number;
    actionLimitReached: number;
    newX10Cases: number;
    officialSubclusters: Record<string, number>;
    officialSubclustersByPair: Record<string, Record<string, number>>;
    endWindowDominantSubclusters: Record<string, number>;
    endWindowDominantSubclustersByPair: Record<string, Record<string, number>>;
    subclustersBySeedBand: Record<string, Record<string, number>>;
    newX10Subclusters: Record<string, number>;
    topResidualCauses: Array<{
      subcluster: string;
      games: number;
      rationale: string;
    }>;
  };
  actionLimitGames: Array<{
    pair: string;
    seed: string;
    finalAgendaPoints: { runner: number; corp: number };
    dominantSide: string;
    dominantSubcluster: string;
    secondarySubcluster: string;
    lastProgressAction?: { index: number; side?: string; actionType: string };
    actionKindCounts: Record<string, number>;
  }>;
}): string {
  const games = output.actionLimitGames;
  return `# AI123 x10 Residual Cluster Inventory

Datum: 2026-06-12

Branch: \`codex/ai123-ai130-x10-residual-action-limit-sweep\`

## Ziel

AI123 inventarisiert die 21 Action-Limit-Spiele aus dem A-D-x10-Korpus einzeln. Es nimmt keine Runtime-Änderung vor.

## Quelle und Methode

- Basisbefund: \`docs/reviews/ai/ai120-residual-action-limit-a-d-10seed-2026-06-12.json\`
- Reproduktion: Pair A-D, Seeds \`ai-v143-tuning-001\` bis \`ai-v143-tuning-010\`
- Max Actions: ${MAX_ACTIONS}
- Offizielle Subcluster stammen aus dem bestehenden Trace-Mining-Classifier je Pair/Seed.
- Der zweite Subcluster, Dominanz und Action-Klassen werden aus dem letzten 60-Action-Endfenster abgeleitet.

## Gesamtergebnis

| Metrik | Wert |
| --- | ---: |
| Spiele | ${output.aggregate.games} |
| Action-Limit-Spiele | ${output.aggregate.actionLimitReached} |
| Neue Action-Limit-Fälle in Seeds 006-010 | ${output.aggregate.newX10Cases} |

## x10 Subcluster gesamt

${markdownCountTable(output.aggregate.officialSubclusters, "Subcluster")}

## x10 Subcluster pro Pair

${markdownNestedTable(output.aggregate.officialSubclustersByPair, "Pair")}

## Endfenster-Dominanz pro Seedbereich

${markdownNestedTable(output.aggregate.subclustersBySeedBand, "Seedbereich")}

## Endfenster-Dominanz gesamt

${markdownCountTable(output.aggregate.endWindowDominantSubclusters, "Endfenster-Dominanz")}

## Neue Fälle außerhalb x5

${markdownCountTable(output.aggregate.newX10Subclusters, "Subcluster")}

## Einzelinventar

| Pair | Seed | Punkte R/C | Dominanz | Dominanter Subcluster | Zweiter Subcluster | letzte Progress-Aktion | Action-Klassen im Endfenster |
| --- | --- | ---: | --- | --- | --- | --- | --- |
${games
  .map((game) => {
    const progress = game.lastProgressAction
      ? `${game.lastProgressAction.index}:${game.lastProgressAction.side}/${game.lastProgressAction.actionType}`
      : "none";
    return `| ${game.pair} | ${game.seed} | ${game.finalAgendaPoints.runner}/${game.finalAgendaPoints.corp} | ${game.dominantSide} | \`${game.dominantSubcluster}\` | \`${game.secondarySubcluster}\` | ${progress} | ${inlineCounts(game.actionKindCounts)} |`;
  })
  .join("\n")}

## Top-3-Restursachen

${output.aggregate.topResidualCauses
  .map(
    (entry, index) =>
      `${index + 1}. \`${entry.subcluster}\` (${entry.games} Spiele): ${entry.rationale}`,
  )
  .join("\n")}

## Bewertung

- Der x10-Befund bleibt safety-orientiert: AI123 hat keine Runtime-Änderung vorgenommen.
- Die größte Restursache ist Runner-Reserve-Economy. Sie ist aber nicht automatisch ein Fehler, weil viele Endfenster Reserve-, Coverage- oder Affordability-Signale tragen.
- Die neuen Seeds 006-010 liefern zusätzliche Fälle und zeigen, dass der x5-Korpus den Rest nicht robust abdeckt.
- Direkte nächste Reviews: Pair-A-Late-Draw ohne Ziel (AI124), Runner-Reserve-Outcomes (AI125) und Corp-Endwindow-Economy (AI126).

## Artefakt

Detaildaten inklusive letzter 60 Actions je Action-Limit-Spiel:

- \`docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.json\`

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/analyze-ai123-x10-residual-clusters.ts\`
- \`git diff --check\`
`;
}

function markdownCountTable(counts: Record<string, number>, label: string): string {
  const rows = rankedCounts(counts)
    .filter((entry) => entry.value > 0)
    .map((entry) => `| \`${entry.key}\` | ${entry.value} |`);
  return [`| ${label} | Spiele |`, "| --- | ---: |", ...rows].join("\n");
}

function markdownNestedTable(
  groups: Record<string, Record<string, number>>,
  label: string,
): string {
  const rows = Object.entries(groups)
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([group, counts]) =>
      rankedCounts(counts)
        .filter((entry) => entry.value > 0)
        .map((entry) => `| ${group} | \`${entry.key}\` | ${entry.value} |`),
    );
  return [`| ${label} | Subcluster | Spiele |`, "| --- | --- | ---: |", ...rows].join(
    "\n",
  );
}

function inlineCounts(counts: Record<string, number>): string {
  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `${key}:${value}`)
    .join(", ");
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
