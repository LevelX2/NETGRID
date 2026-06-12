import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Ai123Inventory = {
  actionLimitGames: Ai123Game[];
  aggregate: {
    topResidualCauses: Array<{
      subcluster: string;
      games: number;
      rationale: string;
    }>;
  };
};

type Ai123Game = {
  pair: string;
  pairLabel: string;
  seed: string;
  seedBand: string;
  finalAgendaPoints: { runner: number; corp: number };
  actions: number;
  turns: number;
  winner: string;
  dominantSubcluster: string;
  secondarySubcluster: string;
  dominantSide: string;
  actionKindCounts: Record<string, number>;
  lastProgressAction?: CorpusAction;
  last60Actions: CorpusAction[];
};

type CorpusAction = {
  index: number;
  turn?: number;
  side?: string;
  actionType: string;
  kind?: string;
  targetServerId?: string;
  planKind?: string;
  reasonCode?: string;
  runnerCreditsBefore?: number;
  runnerCreditsAfter?: number;
  corpCreditsBefore?: number;
  corpCreditsAfter?: number;
  runnerSetupMissingCoverageTypes?: string[];
  runnerPressureReadyTrue?: boolean;
  runnerBelowReserveBefore?: boolean;
  runnerBelowReserveAfter?: boolean;
  corpScoreTerminalWindowScoreLegal?: boolean;
  corpScoreTerminalWindowAdvanceToScoreLegal?: boolean;
  corpScoreTerminalWindowAgendaInstallLegal?: boolean;
  actionAlternatives?: unknown[];
};

type CorpusCase = {
  caseId: string;
  pair: string;
  pairLabel: string;
  seed: string;
  seedBand: string;
  finalPublicSummary: {
    finalAgendaPoints: { runner: number; corp: number };
    actions: number;
    turns: number;
    winner: string;
    dominantSide: string;
    dominantSubcluster: string;
    secondarySubcluster: string;
    actionKindCounts: Record<string, number>;
    terminalActionType: string;
    terminalSide: string;
    lastProgressIndex?: number;
    actionsSinceLastProgress?: number;
    endwindowActionCount: number;
  };
  endwindow: CorpusAction[];
};

const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i;
const TOP_CAUSE_LIMIT = 5;

const repoRoot = findRepoRoot(process.cwd());
const sourcePath = resolve(
  repoRoot,
  "docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.json",
);
const jsonOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai131-x10-action-limit-failure-corpus-2026-06-12.json",
);
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai131-x10-action-limit-failure-corpus-review-2026-06-12.md",
);

const inventory = JSON.parse(readFileSync(sourcePath, "utf8")) as Ai123Inventory;
const cases = inventory.actionLimitGames.map(toCorpusCase);
const causeCounts = countBy(cases, (entry) => entry.finalPublicSummary.dominantSubcluster);
const sideCounts = countBy(cases, (entry) => entry.finalPublicSummary.dominantSide);
const pairCounts = countBy(cases, (entry) => entry.pair);
const topCauses = rankedCounts(causeCounts)
  .slice(0, TOP_CAUSE_LIMIT)
  .map(({ key, value }) => ({
    subcluster: key,
    games: value,
    rationale:
      inventory.aggregate.topResidualCauses.find(
        (entry) => entry.subcluster === key,
      )?.rationale ?? rationaleForCause(key),
  }));
const corpus = {
  schemaVersion: "ai131-x10-action-limit-failure-corpus-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  source: {
    inventory: "docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.json",
    caseCount: inventory.actionLimitGames.length,
    endwindowActionsPerCase: 60,
  },
  redaction: scanRedaction({ cases, topCauses }),
  aggregate: {
    actionLimitCases: cases.length,
    actionLimitEndwindowActions: cases.reduce(
      (sum, entry) => sum + entry.endwindow.length,
      0,
    ),
    dominantSubclusters: causeCounts,
    dominantSides: sideCounts,
    casesByPair: pairCounts,
    topCauses,
  },
  cases,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(corpus, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(corpus), "utf8");
console.log(
  JSON.stringify(
    {
      cases: corpus.aggregate.actionLimitCases,
      redactionSafe: corpus.redaction.safe,
      topCauses: corpus.aggregate.topCauses,
    },
    null,
    2,
  ),
);

function toCorpusCase(game: Ai123Game): CorpusCase {
  const terminalAction = game.last60Actions[game.last60Actions.length - 1];
  const lastProgressIndex = game.lastProgressAction?.index;
  return {
    caseId: `${game.pair.toUpperCase()}-${game.seed}`,
    pair: game.pair,
    pairLabel: game.pairLabel,
    seed: game.seed,
    seedBand: game.seedBand,
    finalPublicSummary: {
      finalAgendaPoints: game.finalAgendaPoints,
      actions: game.actions,
      turns: game.turns,
      winner: game.winner,
      dominantSide: game.dominantSide,
      dominantSubcluster: game.dominantSubcluster,
      secondarySubcluster: game.secondarySubcluster,
      actionKindCounts: game.actionKindCounts,
      terminalActionType: terminalAction?.actionType ?? "unknown",
      terminalSide: terminalAction?.side ?? "unknown",
      lastProgressIndex,
      actionsSinceLastProgress:
        typeof lastProgressIndex === "number"
          ? game.actions - lastProgressIndex - 1
          : undefined,
      endwindowActionCount: game.last60Actions.length,
    },
    endwindow: game.last60Actions.map(redactAction),
  };
}

function redactAction(action: CorpusAction): CorpusAction {
  return {
    index: action.index,
    turn: action.turn,
    side: action.side,
    actionType: action.actionType,
    kind: action.kind,
    targetServerId: action.targetServerId,
    planKind: action.planKind,
    reasonCode: action.reasonCode,
    runnerCreditsBefore: action.runnerCreditsBefore,
    runnerCreditsAfter: action.runnerCreditsAfter,
    corpCreditsBefore: action.corpCreditsBefore,
    corpCreditsAfter: action.corpCreditsAfter,
    runnerSetupMissingCoverageTypes: action.runnerSetupMissingCoverageTypes,
    runnerPressureReadyTrue: action.runnerPressureReadyTrue,
    runnerBelowReserveBefore: action.runnerBelowReserveBefore,
    runnerBelowReserveAfter: action.runnerBelowReserveAfter,
    corpScoreTerminalWindowScoreLegal: action.corpScoreTerminalWindowScoreLegal,
    corpScoreTerminalWindowAdvanceToScoreLegal:
      action.corpScoreTerminalWindowAdvanceToScoreLegal,
    corpScoreTerminalWindowAgendaInstallLegal:
      action.corpScoreTerminalWindowAgendaInstallLegal,
    actionAlternatives: action.actionAlternatives,
  };
}

function scanRedaction(value: unknown): { safe: boolean; forbiddenMarkers: string[] } {
  const text = JSON.stringify(value);
  const matches = text.match(FORBIDDEN_REDACTION_MARKERS);
  return {
    safe: matches === null,
    forbiddenMarkers: matches ? Array.from(new Set(matches)) : [],
  };
}

function renderMarkdown(corpus: {
  schemaVersion: string;
  gitHead: string;
  redaction: { safe: boolean; forbiddenMarkers: string[] };
  aggregate: {
    actionLimitCases: number;
    actionLimitEndwindowActions: number;
    dominantSubclusters: Record<string, number>;
    dominantSides: Record<string, number>;
    casesByPair: Record<string, number>;
    topCauses: Array<{ subcluster: string; games: number; rationale: string }>;
  };
  cases: CorpusCase[];
}): string {
  return `# AI131 x10 Action-Limit Failure Corpus Review

Datum: 2026-06-12

Branch: \`codex/ai131-ai139-semantic-endwindow-optimization\`

## Ziel

AI131 baut aus dem bestehenden AI123-x10-Inventar einen reproduzierbaren, redaction-safe Failure-Corpus. Das Paket nimmt keine Runtime-Änderung vor.

## Quelle und Methode

- Quelle: \`docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.json\`
- Corpus-Schema: \`${corpus.schemaVersion}\`
- Git Head: \`${corpus.gitHead}\`
- Umfang: alle Action-Limit-Spiele aus dem A-D-x10-Korpus
- Endfenster: letzte 60 Actions je Fall
- Redaction-Scan: ${corpus.redaction.safe ? "gruen" : "rot"}

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Action-Limit-Fälle | ${corpus.aggregate.actionLimitCases} |
| Endfenster-Actions | ${corpus.aggregate.actionLimitEndwindowActions} |
| Redaction-safe | ${corpus.redaction.safe ? 1 : 0} |

## Fälle pro Pair

${markdownCountTable(corpus.aggregate.casesByPair, "Pair")}

## Dominante Seiten im Endfenster

${markdownCountTable(corpus.aggregate.dominantSides, "Seite")}

## Top-5-Ursachen

| Rang | Subcluster | Spiele | Bewertung |
| ---: | --- | ---: | --- |
${corpus.aggregate.topCauses
  .map(
    (entry, index) =>
      `| ${index + 1} | \`${entry.subcluster}\` | ${entry.games} | ${entry.rationale} |`,
  )
  .join("\n")}

## Einzelkorpus

| Case | Pair | Seed | Punkte R/C | Dominanz | Hauptursache | Terminal | letzte Progress-Action | Actions seit Progress |
| --- | --- | --- | ---: | --- | --- | --- | ---: | ---: |
${corpus.cases
  .map((entry) => {
    const summary = entry.finalPublicSummary;
    return `| \`${entry.caseId}\` | ${entry.pair} | ${entry.seed} | ${summary.finalAgendaPoints.runner}/${summary.finalAgendaPoints.corp} | ${summary.dominantSide} | \`${summary.dominantSubcluster}\` | ${summary.terminalSide}/${summary.terminalActionType} | ${summary.lastProgressIndex ?? "none"} | ${summary.actionsSinceLastProgress ?? "n/a"} |`;
  })
  .join("\n")}

## Schlüsse

- Der weitere Optimierungsblock muss outcome- und zielbezogen arbeiten; die Top-Ursachen sind heterogen genug, dass ein pauschaler Malus wieder zu Seiteneffekten führen würde.
- Runner-Reserve- und Coverage-Fälle müssen über konkrete Progress-Fenster getrennt werden, nicht über den ausgewählten Action-Typ allein.
- Corp-Economy-Endfenster bleiben ohne side-safe Score-/Protection-Evidence keine robuste Runtime-Fix-Basis.

## Artefakt

- \`docs/reviews/ai/ai131-x10-action-limit-failure-corpus-2026-06-12.json\`

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai131-x10-action-limit-failure-corpus.ts\`
- \`git diff --check\`
`;
}

function rationaleForCause(subcluster: string): string {
  if (subcluster.includes("reserve")) {
    return "Reserve-Signale koennen plausibel sein und brauchen Progress-Follow-up statt pauschalem Credit-Malus.";
  }
  if (subcluster.includes("draw")) {
    return "Draw-Faelle muessen Coverage-/Handziele belegen; ein generischer Draw-Malus bleibt ausgeschlossen.";
  }
  if (subcluster.includes("run") || subcluster.includes("access")) {
    return "Run-Mikroschritte koennen notwendige Progress-Schritte sein und duerfen nicht als Stall fehlklassifiziert werden.";
  }
  return "Restursache bleibt nur mit side-safe Alternative und Outcome-Nachweis cutover-faehig.";
}

function markdownCountTable(counts: Record<string, number>, label: string): string {
  const rows = rankedCounts(counts).map(
    (entry) => `| \`${entry.key}\` | ${entry.value} |`,
  );
  return [`| ${label} | Fälle |`, "| --- | ---: |", ...rows].join("\n");
}

function rankedCounts(
  counts: Record<string, number>,
): Array<{ key: string; value: number }> {
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
