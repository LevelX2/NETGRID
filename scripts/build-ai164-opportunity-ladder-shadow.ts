import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Labels = {
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    labels: Array<{ actionType: string; side: string; label: string; followUp: { within20: string[] } }>;
  }>;
};

const repoRoot = findRepoRoot(process.cwd());
const labels = readJson<Labels>("docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai164-opportunity-ladder-shadow-2026-06-12.md");

const cases = labels.cases.slice(0, 21).map((entry) => {
  const runnerLadder = [
    stage(entry, "runner.fix_coverage", ["progress_coverage_install"], ["install_card", "activated_card_ability"], "coverage or search path"),
    stage(entry, "runner.improve_reachability", ["progress_reachability_improved"], ["start_run", "continue_run", "break_subroutine", "pump_breaker"], "reachability path"),
    stage(entry, "runner.access_trash_steal", ["progress_access", "progress_trash", "progress_steal"], ["access_card", "trash_accessed_card", "steal_agenda"], "payoff action"),
    stage(entry, "runner.choose_payoff_target", ["progress_trash", "progress_steal"], ["trash_accessed_card", "steal_agenda"], "payoff target"),
  ];
  const corpLadder = [
    stage(entry, "corp.protect_or_rez", ["progress_server_protected"], ["rez_ice", "install_card"], "protection action"),
    stage(entry, "corp.advance_or_score", ["progress_score"], ["advance_card", "score_agenda"], "scoreline action"),
    stage(entry, "corp.punish_if_real_window", ["progress_flatline"], ["tag_runner", "trash_resource", "do_damage"], "punish window"),
    stage(entry, "corp.economy_if_conversion_path", ["progress_economy_converted"], ["gain_credit", "activated_card_ability", "resolve_choice"], "economy conversion"),
  ];
  return {
    caseId: entry.caseId,
    dominantSubcluster: entry.dominantSubcluster,
    runnerLadder,
    corpLadder,
    blockedStage: [...runnerLadder, ...corpLadder].find((item) => item.status !== "available") ?? null,
  };
});

mkdirSync(dirname(mdOut), { recursive: true });
writeFileSync(mdOut, renderMarkdown({ gitHead: git(["rev-parse", "--short", "HEAD"]), cases }), "utf8");
console.log(JSON.stringify({ cases: cases.length, blocked: cases.filter((entry) => entry.blockedStage !== null).length }, null, 2));

function stage(
  entry: Labels["cases"][number],
  goal: string,
  progressLabels: string[],
  candidateActions: string[],
  expectedProgress: string,
) {
  const available = entry.labels.filter(
    (label) => progressLabels.includes(label.label) || candidateActions.includes(label.actionType),
  );
  const converted = available.some((label) => progressLabels.includes(label.label));
  return {
    goal,
    legalActionCandidates: Array.from(new Set(available.map((label) => label.actionType))).sort(),
    expectedProgress,
    status: converted ? "available" : available.length > 0 ? "blocked_by_conversion_gap" : "blocked_by_no_visible_candidate",
    blocker: converted ? "none" : available.length > 0 ? "conversion_not_observed" : "no_side_safe_candidate",
  };
}

function renderMarkdown(input: { gitHead: string; cases: typeof cases }): string {
  return `# AI164 Opportunity Ladder Shadow

Datum: 2026-06-12

Branch: \`codex/ai159-ai169-endgame-opportunity\`

## Ziel

AI164 verbindet Intent Memory, Coverage Solver, Corp Tempo Converter und Progress Patterns zu einer Shadow-Ladder. Jede Stufe nennt Goal, verfügbare Kandidaten, Blocker und erwartete Progress-Kategorie. Keine Runtime-Wirkung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fälle | ${input.cases.length} |
| Fälle mit sichtbarem Blocker | ${input.cases.filter((entry) => entry.blockedStage !== null).length} |

## Ladder-Fälle

| Case | Subcluster | Erster Blocker | Runner Ladder | Corp Ladder |
| --- | --- | --- | --- | --- |
${input.cases
  .slice(0, 21)
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${entry.blockedStage ? `\`${entry.blockedStage.goal}:${entry.blockedStage.blocker}\`` : "`none`"} | ${entry.runnerLadder.map((stage) => `\`${stage.goal}:${stage.status}\``).join(", ")} | ${entry.corpLadder.map((stage) => `\`${stage.goal}:${stage.status}\``).join(", ")} |`,
  )
  .join("\n")}

## Schluss

Die Ladder macht Blockaden sichtbar, ersetzt aber keinen Opportunity-LegalAction-Snapshot. Für mindestens zehn Fälle ist erkennbar, welche Stufe blockiert oder konvertiert. AI165 kann daraus Lookahead-Prioritäten ableiten, aber AI166 darf nur bei echtem Opportunity-Proof schneiden.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai164-opportunity-ladder-shadow.ts\`
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
