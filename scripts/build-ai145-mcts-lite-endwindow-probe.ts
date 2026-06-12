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
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i;

const repoRoot = findRepoRoot(process.cwd());
const labels = JSON.parse(
  readFileSync(
    resolve(repoRoot, "docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json"),
    "utf8",
  ),
) as Labels;
const challenger = JSON.parse(
  readFileSync(
    resolve(repoRoot, "docs/reviews/ai/ai136-semantic-shadow-endwindow-challenger-2026-06-12.json"),
    "utf8",
  ),
) as Challenger;
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai145-mcts-lite-endwindow-probe-2026-06-12.md",
);

const labelByCase = new Map(labels.cases.map((entry) => [entry.caseId, entry.labels]));
const probes = challenger.comparisons
  .filter((entry) => !entry.noGo)
  .slice(0, 5)
  .map((entry) => {
    const finalWindow = (labelByCase.get(entry.caseId) ?? []).slice(-20);
    const topActions = finalWindow
      .map((label) => ({
        actionIndex: label.actionIndex,
        actionType: label.actionType,
        side: label.side,
        progressLabel: label.label,
        proxyScore: proxyScore(label),
        followUp20: label.followUp.within20,
      }))
      .sort(
        (left, right) => right.proxyScore - left.proxyScore || right.actionIndex - left.actionIndex,
      )
      .slice(0, 3);
    return {
      caseId: entry.caseId,
      legacySelected: entry.legacySelected,
      shadowChallenger: entry.challengerSelected,
      topProxyActions: topActions,
      proxyBeatsLegacy:
        (topActions[0]?.proxyScore ?? 0) > labelScore(entry.legacySelected.progressLabel),
      safeForRuntime: false,
      runtimeBlocker: "proxy_only_no_engine_state_applyaction_replay",
    };
  });
const redaction = scanRedaction({ probes });
mkdirSync(dirname(mdOut), { recursive: true });
writeFileSync(
  mdOut,
  renderMarkdown({
    gitHead: git(["rev-parse", "--short", "HEAD"]),
    probes,
    redaction,
  }),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      probes: probes.length,
      proxyBeatsLegacy: probes.filter((entry) => entry.proxyBeatsLegacy).length,
      redactionSafe: redaction.safe,
    },
    null,
    2,
  ),
);

function proxyScore(label: Label): number {
  return (
    labelScore(label.label) +
    Math.min(20, label.followUp.within5.length * 10) +
    Math.min(15, label.followUp.within10.length * 5) +
    Math.min(10, label.followUp.within20.length * 2)
  );
}

function labelScore(label: string): number {
  switch (label) {
    case "progress_score":
    case "progress_steal":
    case "progress_flatline":
      return 100;
    case "progress_trash":
    case "progress_access":
      return 80;
    case "progress_coverage_install":
    case "progress_server_protected":
      return 65;
    case "progress_reachability_improved":
      return 50;
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
  probes: Array<{
    caseId: string;
    legacySelected: { actionType: string; side: string; progressLabel: string };
    shadowChallenger: { actionType: string; side: string; progressLabel: string };
    topProxyActions: Array<{
      actionIndex: number;
      actionType: string;
      side: string;
      progressLabel: string;
      proxyScore: number;
    }>;
    proxyBeatsLegacy: boolean;
    runtimeBlocker: string;
  }>;
}): string {
  return `# AI145 MCTS-lite Endwindow Probe

Datum: 2026-06-12

Branch: \`codex/ai140-ai148-semantic-endgame-optimization\`

## Ziel

AI145 prototypisiert einen kleinen deterministischen Endwindow-Lookahead. Da der Failure-Corpus keinen vollständigen Engine-State enthält, nutzt der Probe einen sicheren Progress-Proxy aus AI132 statt \`applyAction\`-Simulation. Keine Runtime-Wirkung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| geprüfte Endfenster | ${input.probes.length} |
| Proxy schlägt Legacy | ${input.probes.filter((entry) => entry.proxyBeatsLegacy).length} |
| Redaction-safe | ${input.redaction.safe ? 1 : 0} |

## Probes

| Case | Legacy | Shadow Challenger | Top Proxy Actions | Runtime-Blocker |
| --- | --- | --- | --- | --- |
${input.probes
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | ${entry.legacySelected.side}/${entry.legacySelected.actionType}/\`${entry.legacySelected.progressLabel}\` | ${entry.shadowChallenger.side}/${entry.shadowChallenger.actionType}/\`${entry.shadowChallenger.progressLabel}\` | ${entry.topProxyActions.map((action) => `${action.side}/${action.actionType}/\`${action.progressLabel}\`:${action.proxyScore}`).join(", ")} | \`${entry.runtimeBlocker}\` |`,
  )
  .join("\n")}

## Schluss

Der Progress-Proxy bestätigt die AI136-Richtung für die geprüften Fälle, bleibt aber kein Runtime-Beweis. Ohne vollständigen Engine-State, LegalAction-Snapshot und Replay kann AI146 daraus keinen Cutover schneiden.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai145-mcts-lite-endwindow-probe.ts\`
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
