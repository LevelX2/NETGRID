import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type TempoCategory =
  | "safe_score"
  | "advance_to_score"
  | "protect_central"
  | "protect_remote"
  | "rez_meaningful_ice"
  | "convert_economy_into_score_or_protection"
  | "economy_only"
  | "no_corp_tempo_solution_visible";

type Corpus = {
  cases: Array<{
    caseId: string;
    finalPublicSummary: {
      dominantSide: string;
      dominantSubcluster: string;
    };
    endwindow: Array<{
      side?: string;
      actionType: string;
      targetServerId?: string;
      corpScoreTerminalWindowScoreLegal?: boolean;
      corpScoreTerminalWindowAdvanceToScoreLegal?: boolean;
      corpScoreTerminalWindowAgendaInstallLegal?: boolean;
    }>;
  }>;
};

type Labels = {
  cases: Array<{
    caseId: string;
    labels: Array<{ side: string; actionType: string; label: string }>;
  }>;
};

const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i;

const repoRoot = findRepoRoot(process.cwd());
const corpus = JSON.parse(
  readFileSync(
    resolve(repoRoot, "docs/reviews/ai/ai131-x10-action-limit-failure-corpus-2026-06-12.json"),
    "utf8",
  ),
) as Corpus;
const labels = JSON.parse(
  readFileSync(
    resolve(repoRoot, "docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json"),
    "utf8",
  ),
) as Labels;
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai143-corp-tempo-conversion-shadow-2026-06-12.md",
);

const labelByCase = new Map(labels.cases.map((entry) => [entry.caseId, entry]));
const corpCases = corpus.cases
  .filter(
    (entry) =>
      entry.finalPublicSummary.dominantSide === "mixed" ||
      entry.finalPublicSummary.dominantSide === "corp" ||
      entry.finalPublicSummary.dominantSubcluster.includes("corp"),
  )
  .map((entry) => {
    const caseLabels = labelByCase.get(entry.caseId)?.labels ?? [];
    const corpActions = entry.endwindow.filter((action) => action.side === "corp");
    const corpLabels = caseLabels.filter((label) => label.side === "corp");
    const scoreActions = corpActions.filter((action) => action.actionType === "score_agenda").length;
    const advanceActions = corpActions.filter((action) => action.actionType === "advance_card").length;
    const rezActions = corpActions.filter((action) => action.actionType === "rez_ice").length;
    const installProtection = corpActions.filter(
      (action) =>
        action.actionType === "install_card" &&
        /remote|hq|rd|archives|central/i.test(action.targetServerId ?? ""),
    ).length;
    const economyActions = corpActions.filter(
      (action) => action.actionType === "gain_credit" || action.actionType === "activated_card_ability",
    ).length;
    const progressProtection = corpLabels.filter(
      (label) => label.label === "progress_server_protected",
    ).length;
    const progressScore = corpLabels.filter((label) => label.label === "progress_score").length;
    const convertedEconomy = corpLabels.filter(
      (label) => label.label === "progress_economy_converted",
    ).length;
    const category = classify({
      scoreActions,
      advanceActions,
      rezActions,
      installProtection,
      economyActions,
      progressProtection,
      progressScore,
      convertedEconomy,
    });
    return {
      caseId: entry.caseId,
      dominantSubcluster: entry.finalPublicSummary.dominantSubcluster,
      scoreActions,
      advanceActions,
      rezActions,
      installProtection,
      economyActions,
      progressProtection,
      progressScore,
      convertedEconomy,
      category,
      ai146Candidate:
        category === "safe_score" || category === "advance_to_score"
          ? "needs_same_state_proof_before_cutover"
          : "no_go",
    };
  });
const categoryCounts = countBy(corpCases, (entry) => entry.category);
const redaction = scanRedaction({ corpCases });
mkdirSync(dirname(mdOut), { recursive: true });
writeFileSync(
  mdOut,
  renderMarkdown({
    gitHead: git(["rev-parse", "--short", "HEAD"]),
    corpCases,
    categoryCounts,
    redaction,
  }),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      cases: corpCases.length,
      categoryCounts,
      redactionSafe: redaction.safe,
    },
    null,
    2,
  ),
);

function classify(input: {
  scoreActions: number;
  advanceActions: number;
  rezActions: number;
  installProtection: number;
  economyActions: number;
  progressProtection: number;
  progressScore: number;
  convertedEconomy: number;
}): TempoCategory {
  if (input.scoreActions > 0 || input.progressScore > 0) return "safe_score";
  if (input.advanceActions > 0) return "advance_to_score";
  if (input.progressProtection > 0 && input.rezActions > 0) return "rez_meaningful_ice";
  if (input.progressProtection > 0 || input.installProtection > 0) return "protect_remote";
  if (input.convertedEconomy > 0) return "convert_economy_into_score_or_protection";
  if (input.economyActions > 0) return "economy_only";
  return "no_corp_tempo_solution_visible";
}

function renderMarkdown(input: {
  gitHead: string;
  redaction: { safe: boolean };
  categoryCounts: Record<string, number>;
  corpCases: Array<{
    caseId: string;
    dominantSubcluster: string;
    scoreActions: number;
    advanceActions: number;
    rezActions: number;
    installProtection: number;
    economyActions: number;
    progressProtection: number;
    progressScore: number;
    convertedEconomy: number;
    category: TempoCategory;
    ai146Candidate: string;
  }>;
}): string {
  return `# AI143 Corp Tempo Conversion Shadow

Datum: 2026-06-12

Branch: \`codex/ai140-ai148-semantic-endgame-optimization\`

## Ziel

AI143 bewertet Corp- und mixed-x10-Endfenster danach, ob Corp-Economy in Score, Advance, Rez oder Protection konvertiert. Das Paket bleibt shadow-only und führt keine Corp-Economy-Strafe ein.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| geprüfte Corp-/mixed-Fälle | ${input.corpCases.length} |
| Redaction-safe | ${input.redaction.safe ? 1 : 0} |

## Kategorien

${markdownCountTable(input.categoryCounts, "Kategorie")}

## Fälle

| Case | Subcluster | Score | Advance | Rez | Protection | Economy | Converted Economy | Kategorie | AI146 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
${input.corpCases
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${entry.scoreActions + entry.progressScore} | ${entry.advanceActions} | ${entry.rezActions} | ${entry.installProtection + entry.progressProtection} | ${entry.economyActions} | ${entry.convertedEconomy} | \`${entry.category}\` | \`${entry.ai146Candidate}\` |`,
  )
  .join("\n")}

## Schluss

Corp-Tempo-Conversion ist sichtbar, aber nicht als same-state Cutover belegt. Score-/Advance-Fälle werden als spätere Fixture-Priorität markiert. Reine Economy bleibt nicht automatisch falsch; ohne same-state Score-/Protection-Alternative bleibt sie ein No-Go für AI146.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai143-corp-tempo-conversion-shadow.ts\`
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
