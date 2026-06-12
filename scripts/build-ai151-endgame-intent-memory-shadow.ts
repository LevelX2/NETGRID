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
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    labels: Label[];
  }>;
};

type IntentType =
  | "runner.fix_coverage"
  | "runner.convert_reachability_to_access"
  | "runner.find_payoff"
  | "corp.convert_economy_to_scoreline"
  | "corp.protect_scoreline"
  | "corp.convert_tag_to_punish";

type IntentStatus =
  | "conversion_observed"
  | "stale_without_conversion"
  | "blocked_by_no_same_state_legal_alternative";

const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i;

const repoRoot = findRepoRoot(process.cwd());
const labels = readJson<Labels>("docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json");
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai151-endgame-intent-memory-shadow-2026-06-12.md",
);

const cases = labels.cases.map((entry) => {
  const intents = buildIntents(entry.labels).map((intent) => ({
    ...intent,
    blocker:
      intent.status === "blocked_by_no_same_state_legal_alternative"
        ? "ai149_no_same_state_legal_match"
        : intent.status === "stale_without_conversion"
          ? "intent_repeated_without_expected_conversion"
          : "none",
  }));
  return {
    caseId: entry.caseId,
    dominantSubcluster: entry.dominantSubcluster,
    intents,
  };
});
const allIntents = cases.flatMap((entry) =>
  entry.intents.map((intent) => ({
    caseId: entry.caseId,
    dominantSubcluster: entry.dominantSubcluster,
    ...intent,
  })),
);
const topStale = allIntents
  .filter((intent) => intent.status !== "conversion_observed")
  .sort((left, right) => right.staleCount - left.staleCount || left.caseId.localeCompare(right.caseId))
  .slice(0, 10);
const redaction = scanRedaction({ cases, topStale });

mkdirSync(dirname(mdOut), { recursive: true });
writeFileSync(
  mdOut,
  renderMarkdown({
    gitHead: git(["rev-parse", "--short", "HEAD"]),
    redaction,
    cases,
    allIntents,
    topStale,
  }),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      cases: cases.length,
      intents: allIntents.length,
      statusCounts: countBy(allIntents, (entry) => entry.status),
      typeCounts: countBy(allIntents, (entry) => entry.intent),
      topStale: topStale.length,
      redactionSafe: redaction.safe,
    },
    null,
    2,
  ),
);

function buildIntents(labelsForCase: Label[]) {
  const intents: Array<{
    intent: IntentType;
    startAction: string;
    supportingActions: string[];
    expectedConversion: string;
    conversionObserved: boolean;
    staleCount: number;
    status: IntentStatus;
  }> = [];
  addIntent(intents, labelsForCase, "runner.fix_coverage", {
    supportLabels: ["progress_coverage_install"],
    supportingActions: ["install_card", "activated_card_ability", "draw_card", "gain_credit"],
    conversionLabels: ["progress_coverage_install", "progress_reachability_improved", "progress_access"],
    expectedConversion: "coverage installed or reachability converted",
  });
  addIntent(intents, labelsForCase, "runner.convert_reachability_to_access", {
    supportLabels: ["progress_reachability_improved"],
    supportingActions: ["continue_run", "break_subroutine", "pump_breaker"],
    conversionLabels: ["progress_access", "progress_trash", "progress_steal"],
    expectedConversion: "successful access, trash or steal",
  });
  addIntent(intents, labelsForCase, "runner.find_payoff", {
    supportLabels: ["progress_access", "progress_trash", "progress_steal"],
    supportingActions: ["access_card", "trash_accessed_card", "steal_agenda"],
    conversionLabels: ["progress_trash", "progress_steal"],
    expectedConversion: "access payoff converted",
  });
  addIntent(intents, labelsForCase, "corp.convert_economy_to_scoreline", {
    supportLabels: ["progress_economy_converted"],
    supportingActions: ["gain_credit", "activated_card_ability", "resolve_choice"],
    conversionLabels: ["progress_score", "progress_server_protected"],
    expectedConversion: "scoreline or protection conversion",
  });
  addIntent(intents, labelsForCase, "corp.protect_scoreline", {
    supportLabels: ["progress_server_protected"],
    supportingActions: ["rez_ice", "install_card", "advance_card"],
    conversionLabels: ["progress_server_protected", "progress_score"],
    expectedConversion: "protected scoreline or score",
  });
  addIntent(intents, labelsForCase, "corp.convert_tag_to_punish", {
    supportLabels: ["no_progress_plausible", "progress_flatline"],
    supportingActions: ["tag_runner", "trash_resource", "do_damage"],
    conversionLabels: ["progress_flatline"],
    expectedConversion: "flatline or resource punishment",
  });
  return intents;
}

function addIntent(
  intents: ReturnType<typeof buildIntents>,
  labelsForCase: Label[],
  intent: IntentType,
  config: {
    supportLabels: string[];
    supportingActions: string[];
    conversionLabels: string[];
    expectedConversion: string;
  },
) {
  const support = labelsForCase.filter(
    (label) =>
      config.supportLabels.includes(label.label) ||
      config.supportingActions.includes(label.actionType),
  );
  if (support.length === 0) return;
  const first = support[0];
  const conversionObserved = labelsForCase.some((label) =>
    config.conversionLabels.includes(label.label),
  );
  const staleCount = support.filter(
    (label) =>
      label.label === "no_progress_stale" ||
      label.followUp.within20.every((followUp) => !config.conversionLabels.includes(followUp)),
  ).length;
  const status: IntentStatus = conversionObserved
    ? "conversion_observed"
    : staleCount > 0
      ? "stale_without_conversion"
      : "blocked_by_no_same_state_legal_alternative";
  intents.push({
    intent,
    startAction: `${first.side}/${first.actionType}@${first.actionIndex}`,
    supportingActions: Array.from(new Set(support.map((label) => label.actionType))).sort(),
    expectedConversion: config.expectedConversion,
    conversionObserved,
    staleCount,
    status,
  });
}

function renderMarkdown(input: {
  gitHead: string;
  redaction: { safe: boolean };
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    intents: Array<{
      intent: IntentType;
      status: IntentStatus;
      startAction: string;
      supportingActions: string[];
      expectedConversion: string;
      conversionObserved: boolean;
      staleCount: number;
      blocker: string;
    }>;
  }>;
  allIntents: Array<{
    caseId: string;
    dominantSubcluster: string;
    intent: IntentType;
    status: IntentStatus;
    staleCount: number;
    blocker: string;
  }>;
  topStale: Array<{
    caseId: string;
    dominantSubcluster: string;
    intent: IntentType;
    status: IntentStatus;
    staleCount: number;
    blocker: string;
  }>;
}): string {
  return `# AI151 Endgame Intent Memory Shadow

Datum: 2026-06-12

Branch: \`codex/ai149-ai158-same-state-semantic-endgame\`

## Ziel

AI151 verfolgt Endgame-Absichten über mehrere Aktionen als Shadow-Modell. Es bewertet nicht einzelne Credit-, Draw-, Run- oder Corp-Economy-Aktionen pauschal, sondern ob eine Absicht erwartbar konvertiert, stale wird oder mangels Same-State-Proof blockiert bleibt.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fälle | ${input.cases.length} |
| Intents | ${input.allIntents.length} |
| Top-Stale/Blocked sichtbar | ${input.topStale.length} |
| Redaction-safe | ${input.redaction.safe ? 1 : 0} |

## Status

${markdownCountTable(countBy(input.allIntents, (entry) => entry.status), "Status")}

## Intent-Typen

${markdownCountTable(countBy(input.allIntents, (entry) => entry.intent), "Intent")}

## Top Stale / Blocked Intents

| Case | Subcluster | Intent | Status | Stale Count | Blocker |
| --- | --- | --- | --- | ---: | --- |
${input.topStale
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | \`${entry.intent}\` | \`${entry.status}\` | ${entry.staleCount} | \`${entry.blocker}\` |`,
  )
  .join("\n")}

## Fälle

| Case | Subcluster | Intents |
| --- | --- | --- |
${input.cases
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${entry.intents
        .map(
          (intent) =>
            `\`${intent.intent}:${intent.status}:stale=${intent.staleCount}:start=${intent.startAction}\``,
        )
        .join(", ")} |`,
  )
  .join("\n")}

## Schluss

Intent Memory ist weiterhin nur Evidence. Es zeigt, welche Zielversuche stale werden, ohne daraus Runtime-Gewichte abzuleiten. AI149 bleibt das harte Gate: Solange kein same-state LegalAction-Match existiert, darf kein Intent automatisch in einen Cutover übersetzt werden.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai151-endgame-intent-memory-shadow.ts\`
- \`git diff --check\`
`;
}

function markdownCountTable(counts: Record<string, number>, label: string): string {
  const rows = Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `| \`${key}\` | ${value} |`);
  return [`| ${label} | Anzahl |`, "| --- | ---: |", ...rows].join("\n");
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
