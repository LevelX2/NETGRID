import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Ai170Snapshots = {
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    ai159Category: string;
    snapshots: Array<{
      requestKind: string;
      requestedAction: {
        actionIndex: number;
        side: "runner" | "corp";
        actionType: string;
        progressLabel: string;
      };
      snapshotAvailable: boolean;
      snapshot?: {
        actionIndex: number;
        side: "runner" | "corp";
        stateVersionBefore: number;
        selectedActionType: string;
        alternatives: Array<{
          rank?: number;
          actionType: string;
          semanticActionType: string;
          selected?: boolean;
          sourceKind?: string;
          sourceDefinitionId?: string;
          scoreKeys: string[];
          hardGates: string[];
          targetContextStatus: string;
          expectedProgressLabel: string;
          blockedReason?: string;
          whyChosen: string[];
          whyNot: string[];
        }>;
      };
      proofSummary?: {
        legalActionCount: number;
        progressAlternatives: number;
        targetContextComplete: boolean;
        hardGateBlockedAlternatives: number;
      };
    }>;
  }>;
};

const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug|deckTop|decklist|deckOrder/i;

const repoRoot = findRepoRoot(process.cwd());
const input = readJson<Ai170Snapshots>("docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json");
const jsonOut = resolve(repoRoot, "docs/reviews/ai/ai171-opportunity-replay-fixtures-2026-06-13.json");
const mdOut = resolve(repoRoot, "docs/reviews/ai/ai171-opportunity-replay-fixtures-2026-06-13.md");

const selected = selectFixtures(input.cases).map((entry) => {
  const snapshot = entry.snapshot.snapshot;
  if (!snapshot) throw new Error(`Missing snapshot for ${entry.caseId}`);
  const progressAlternatives = snapshot.alternatives.filter((alternative) =>
    alternative.expectedProgressLabel.startsWith("progress_"),
  );
  return {
    fixtureId: `${entry.caseId}:${entry.snapshot.requestKind}:${snapshot.actionIndex}`,
    caseId: entry.caseId,
    dominantSubcluster: entry.dominantSubcluster,
    source: {
      ai170: "docs/reviews/ai/ai170-opportunity-state-snapshots-2026-06-13.json",
      snapshotRequestKind: entry.snapshot.requestKind,
    },
    replaySafeReference: {
      seed: seedForCase(entry.caseId),
      stateVersion: snapshot.stateVersionBefore,
      actionIndex: snapshot.actionIndex,
      side: snapshot.side,
    },
    playerViewRef: {
      side: snapshot.side,
      stateVersion: snapshot.stateVersionBefore,
      surface: "redacted_player_view_reference",
    },
    legalActionCandidates: snapshot.alternatives.map((alternative) => ({
      rank: alternative.rank,
      actionType: alternative.actionType,
      semanticActionType: alternative.semanticActionType,
      selected: alternative.selected === true,
      sourceKind: alternative.sourceKind ?? "unknown",
      targetContextStatus: alternative.targetContextStatus,
      expectedProgressLabel: alternative.expectedProgressLabel,
      costTimingProfile: costTimingProfile(alternative.scoreKeys),
      hardGateSummary:
        alternative.hardGates.length > 0 || alternative.blockedReason
          ? "blocked_or_guarded"
          : "clear",
      blocker: alternative.blockedReason ?? null,
    })),
    decisionFacts: {
      selectedActionType: snapshot.selectedActionType,
      requestedActionType: entry.snapshot.requestedAction.actionType,
      requestedProgressLabel: entry.snapshot.requestedAction.progressLabel,
      progressAlternatives: progressAlternatives.length,
      targetContextComplete: entry.snapshot.proofSummary?.targetContextComplete === true,
    },
    expectedShadowClassification:
      progressAlternatives.length > 0
        ? "opportunity_fixture_with_progress_alternative"
        : "opportunity_fixture_no_progress_alternative",
  };
});

const output = {
  schemaVersion: "ai171-opportunity-replay-fixtures-v1",
  generatedAt: new Date().toISOString(),
  gitHead: git(["rev-parse", "--short", "HEAD"]),
  redaction: scanRedaction({ fixtures: selected }),
  aggregate: {
    fixtures: selected.length,
    targetContextMissingFixtures: selected.filter((fixture) =>
      fixture.caseId === "A-ai-v143-tuning-009" || fixture.caseId === "B-ai-v143-tuning-001",
    ).length,
    fixturesWithProgressAlternative: selected.filter(
      (fixture) => fixture.decisionFacts.progressAlternatives > 0,
    ).length,
  },
  fixtures: selected,
};

mkdirSync(dirname(jsonOut), { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeFileSync(mdOut, renderMarkdown(output), "utf8");
console.log(JSON.stringify(output.aggregate, null, 2));

function selectFixtures(cases: Ai170Snapshots["cases"]) {
  const candidates = cases.flatMap((entry) =>
    entry.snapshots
      .filter((snapshot) => snapshot.snapshotAvailable && snapshot.snapshot)
      .map((snapshot) => ({ ...entry, snapshot })),
  );
  const required = ["A-ai-v143-tuning-009", "B-ai-v143-tuning-001"]
    .map((caseId) => candidates.find((entry) => entry.caseId === caseId && entry.snapshot.requestKind === "preceding_same_side_decision"))
    .filter((entry): entry is (typeof candidates)[number] => Boolean(entry));
  const third = candidates
    .filter((entry) => !required.some((selected) => selected.caseId === entry.caseId))
    .sort((left, right) => {
      const leftProgress = left.snapshot.proofSummary?.progressAlternatives ?? 0;
      const rightProgress = right.snapshot.proofSummary?.progressAlternatives ?? 0;
      return rightProgress - leftProgress || left.caseId.localeCompare(right.caseId);
    })[0];
  return [...required, ...(third ? [third] : [])].slice(0, 3);
}

function costTimingProfile(scoreKeys: readonly string[]): string {
  const text = scoreKeys.join("|").toLocaleLowerCase("en-US");
  const parts = [
    /credit|cost|economy/.test(text) ? "cost_visible" : "cost_not_explicit",
    /timing|phase|click|run|score|advance|rez/.test(text) ? "timing_relevant" : "timing_not_explicit",
  ];
  return parts.join("+");
}

function seedForCase(caseId: string): string {
  return caseId.replace(/^[A-D]-/, "");
}

function renderMarkdown(input: typeof output): string {
  const rows = input.fixtures
    .map(
      (fixture) =>
        `| \`${fixture.fixtureId}\` | ${fixture.replaySafeReference.stateVersion} | ${fixture.legalActionCandidates.length} | ${fixture.decisionFacts.progressAlternatives} | \`${fixture.expectedShadowClassification}\` |`,
    )
    .join("\n");
  return `# AI171 Opportunity Replay Fixtures

Datum: 2026-06-13

Branch: \`codex/ai170-ai180-opportunity-snapshots\`

## Ziel

AI171 baut aus AI170 drei reproduzierbare, redigierte Opportunity-Fixtures. Die Fixtures enthalten keine Full-State- oder Hidden-Zone-Daten, sondern nur side-safe Referenzen, LegalAction-Kandidaten, semantische Kandidatenfelder und erwartete Shadow-Klassifikation.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fixtures | ${input.aggregate.fixtures} |
| TargetContext-missing-Fälle abgedeckt | ${input.aggregate.targetContextMissingFixtures} |
| Fixtures mit Progress-Alternative | ${input.aggregate.fixturesWithProgressAlternative} |
| Redaction safe | ${input.redaction.safe ? 1 : 0} |

## Fixtures

| Fixture | StateVersion | LegalAction-Kandidaten | Progress-Alternativen | Erwartung |
| --- | ---: | ---: | ---: | --- |
${rows}

## Schluss

Die Fixtures machen die AI170-Snapshots für spätere Solver und Candidate-Gates reproduzierbar. Sie sind bewusst read-only und shadow-only: Es gibt keinen Runtime-Eingriff und keine Erweiterung der Legalität.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai171-opportunity-replay-fixtures.ts\`
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
