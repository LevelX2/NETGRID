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

const repoRoot = findRepoRoot(process.cwd());
const labels = readJson<Labels>("docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai165-deterministic-endwindow-lookahead-v2-2026-06-12.md");

const probes = labels.cases.slice(0, 10).map((entry) => {
  const top = entry.labels
    .slice(-30)
    .map((label) => ({
      actionIndex: label.actionIndex,
      side: label.side,
      actionType: label.actionType,
      progressLabel: label.label,
      score: score(label),
    }))
    .sort((left, right) => right.score - left.score || right.actionIndex - left.actionIndex)
    .slice(0, 3);
  return {
    caseId: entry.caseId,
    dominantSubcluster: entry.dominantSubcluster,
    topLegalActionProxy: top,
    lookaheadWin: (top[0]?.score ?? 0) >= 90,
    sameStateLegalActionSnapshot: false,
    result: "no_go_missing_opportunity_legal_action_snapshot",
  };
});

mkdirSync(dirname(mdOut), { recursive: true });
writeFileSync(mdOut, renderMarkdown({ gitHead: git(["rev-parse", "--short", "HEAD"]), probes }), "utf8");
console.log(JSON.stringify({ probes: probes.length, lookaheadWins: probes.filter((entry) => entry.lookaheadWin).length }, null, 2));

function score(label: Labels["cases"][number]["labels"][number]): number {
  const base = labelScore(label.label);
  return base + Math.min(20, label.followUp.within5.length * 6) + Math.min(12, label.followUp.within10.length * 3);
}

function labelScore(label: string): number {
  switch (label) {
    case "progress_score":
    case "progress_steal":
    case "progress_flatline":
      return 120;
    case "progress_access":
    case "progress_trash":
      return 90;
    case "progress_coverage_install":
    case "progress_server_protected":
      return 70;
    case "progress_reachability_improved":
      return 55;
    case "progress_economy_converted":
      return 35;
    case "no_progress_plausible":
      return 10;
    default:
      return 0;
  }
}

function renderMarkdown(input: { gitHead: string; probes: typeof probes }): string {
  return `# AI165 Deterministic Endwindow Lookahead v2

Datum: 2026-06-12

Branch: \`codex/ai159-ai169-endgame-opportunity\`

## Ziel

AI165 verfeinert MCTS-lite zu einem deterministischen Endwindow-Lookahead über Top-3-Aktionssequenzen. Mangels früherer Opportunity-LegalAction-Snapshots bleibt v2 ein statischer LegalAction-Sequencing-Proxy ohne Runtime-Wirkung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Top-Opportunity-Fälle | ${input.probes.length} |
| Lookahead Proxy Wins | ${input.probes.filter((entry) => entry.lookaheadWin).length} |
| echte Opportunity-LegalAction-Snapshots | ${input.probes.filter((entry) => entry.sameStateLegalActionSnapshot).length} |

## Probes

| Case | Subcluster | Top 3 Proxy Actions | Lookahead Win | Ergebnis |
| --- | --- | --- | ---: | --- |
${input.probes
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${entry.topLegalActionProxy.map((action) => `${action.side}/${action.actionType}@${action.actionIndex}/\`${action.progressLabel}\`:${action.score}`).join(", ")} | ${entry.lookaheadWin ? 1 : 0} | \`${entry.result}\` |`,
  )
  .join("\n")}

## Schluss

Der Lookahead-Proxy findet starke positive Sequenzen, bewertet aber keine echten same-state Opportunity-LegalActions. Daher liefert AI165 keinen Top-Kandidaten für AI166. Der notwendige nächste technische Schritt bleibt Instrumentierung von Opportunity-State-LegalAction-Snapshots.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai165-deterministic-endwindow-lookahead-v2.ts\`
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
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}
