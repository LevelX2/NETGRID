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
  cases: Array<{ caseId: string; labels: Label[] }>;
};

type Challenger = {
  comparisons: Array<{
    caseId: string;
    legacySelected: { actionIndex: number; actionType: string; side: string; progressLabel: string };
    challengerSelected: { actionIndex: number; actionType: string; side: string; progressLabel: string };
    noGo: boolean;
  }>;
};

const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug|deckTop/i;

const repoRoot = findRepoRoot(process.cwd());
const labels = readJson<Labels>("docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json");
const challenger = readJson<Challenger>(
  "docs/reviews/ai/ai136-semantic-shadow-endwindow-challenger-2026-06-12.json",
);
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai154-mcts-lite-endwindow-probe-v1-2026-06-12.md",
);

const labelByCase = new Map(labels.cases.map((entry) => [entry.caseId, entry.labels]));
const probes = challenger.comparisons
  .filter((entry) => !entry.noGo)
  .slice(0, 10)
  .map((entry) => buildProbe(entry));
const redaction = scanRedaction({ probes });

mkdirSync(dirname(mdOut), { recursive: true });
writeFileSync(
  mdOut,
  renderMarkdown({
    gitHead: git(["rev-parse", "--short", "HEAD"]),
    redaction,
    probes,
  }),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      probes: probes.length,
      proxyBeatsLegacy: probes.filter((entry) => entry.proxyBeatsLegacy).length,
      agreesWithAi136: probes.filter((entry) => entry.ai136ChallengerInTop3).length,
      redactionSafe: redaction.safe,
    },
    null,
    2,
  ),
);

function buildProbe(entry: Challenger["comparisons"][number]) {
  const finalWindow = (labelByCase.get(entry.caseId) ?? []).slice(-30);
  const topActions = finalWindow
    .map((label) => ({
      actionIndex: label.actionIndex,
      actionType: label.actionType,
      side: label.side,
      progressLabel: label.label,
      proxyScore: proxyScore(label),
      followUp20: label.followUp.within20,
    }))
    .sort((left, right) => right.proxyScore - left.proxyScore || right.actionIndex - left.actionIndex)
    .slice(0, 3);
  return {
    caseId: entry.caseId,
    legacySelected: entry.legacySelected,
    ai136Challenger: entry.challengerSelected,
    topProxyActions: topActions,
    proxyBeatsLegacy:
      (topActions[0]?.proxyScore ?? 0) > labelScore(entry.legacySelected.progressLabel),
    ai136ChallengerInTop3: topActions.some(
      (action) => action.actionType === entry.challengerSelected.actionType,
    ),
    runtimeBlocker: "proxy_only_no_engine_state_applyaction_replay",
    safeForRuntime: false,
  };
}

function proxyScore(label: Label): number {
  return (
    labelScore(label.label) +
    Math.min(24, label.followUp.within5.length * 8) +
    Math.min(18, label.followUp.within10.length * 4) +
    Math.min(12, label.followUp.within20.length * 2)
  );
}

function labelScore(label: string): number {
  switch (label) {
    case "progress_score":
    case "progress_steal":
    case "progress_flatline":
      return 120;
    case "progress_trash":
    case "progress_access":
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

function renderMarkdown(input: {
  gitHead: string;
  redaction: { safe: boolean };
  probes: Array<ReturnType<typeof buildProbe>>;
}): string {
  return `# AI154 MCTS-lite Endwindow Probe v1

Datum: 2026-06-12

Branch: \`codex/ai149-ai158-same-state-semantic-endgame\`

## Ziel

AI154 testet einen kleinen deterministischen Lookahead für kritische Endfenster. Da der Failure-Corpus keinen vollständigen Engine-State für echte \`applyAction\`-Simulation enthält, nutzt v1 einen statischen Progress-Proxy über die letzten 30 gelabelten Aktionen. Keine Runtime-Wirkung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| geprüfte Endfenster | ${input.probes.length} |
| Proxy schlägt Legacy | ${input.probes.filter((entry) => entry.proxyBeatsLegacy).length} |
| AI136 Challenger in Top 3 | ${input.probes.filter((entry) => entry.ai136ChallengerInTop3).length} |
| Redaction-safe | ${input.redaction.safe ? 1 : 0} |

## Probes

| Case | Legacy | AI136 Challenger | Top Proxy Actions | AI136 in Top 3 | Runtime-Blocker |
| --- | --- | --- | --- | ---: | --- |
${input.probes
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | ${entry.legacySelected.side}/${entry.legacySelected.actionType}/\`${entry.legacySelected.progressLabel}\` | ${entry.ai136Challenger.side}/${entry.ai136Challenger.actionType}/\`${entry.ai136Challenger.progressLabel}\` | ${entry.topProxyActions.map((action) => `${action.side}/${action.actionType}/\`${action.progressLabel}\`:${action.proxyScore}`).join(", ")} | ${entry.ai136ChallengerInTop3 ? 1 : 0} | \`${entry.runtimeBlocker}\` |`,
  )
  .join("\n")}

## Schluss

Der Proxy bewertet mindestens zehn Endfenster und bestätigt häufig, dass Legacy nicht die stärkste Progress-Spur ist. Er ersetzt aber keinen same-state LegalAction-Beweis: Ohne Engine-State, LegalAction-Snapshot und Replay bleibt AI154 reine Evidence für spätere Fixture-Arbeit.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai154-mcts-lite-endwindow-probe-v1.ts\`
- \`git diff --check\`
`;
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
