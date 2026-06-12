import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type IntentStatus =
  | "intent_converted"
  | "intent_stale"
  | "intent_blocked_by_no_legal_alternative";

type IntentType =
  | "runner_coverage"
  | "runner_reachability"
  | "runner_reserve"
  | "corp_tempo"
  | "corp_economy";

type Labels = {
  cases: Array<{
    caseId: string;
    dominantSubcluster: string;
    labels: Array<{
      actionIndex: number;
      side: string;
      actionType: string;
      label: string;
    }>;
  }>;
};

const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i;
const STALE_AFTER_N = 4;

const repoRoot = findRepoRoot(process.cwd());
const labels = JSON.parse(
  readFileSync(
    resolve(repoRoot, "docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json"),
    "utf8",
  ),
) as Labels;
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai144-endgame-intent-memory-shadow-2026-06-12.md",
);

const intentCases = labels.cases.map((entry) => {
  const intents = buildIntents(entry.labels);
  return {
    caseId: entry.caseId,
    dominantSubcluster: entry.dominantSubcluster,
    intents,
  };
});
const allIntents = intentCases.flatMap((entry) => entry.intents);
const statusCounts = countBy(allIntents, (entry) => entry.status);
const typeCounts = countBy(allIntents, (entry) => entry.intentType);
const redaction = scanRedaction({ intentCases });
mkdirSync(dirname(mdOut), { recursive: true });
writeFileSync(
  mdOut,
  renderMarkdown({
    gitHead: git(["rev-parse", "--short", "HEAD"]),
    intentCases,
    statusCounts,
    typeCounts,
    redaction,
  }),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      cases: intentCases.length,
      intents: allIntents.length,
      statusCounts,
      redactionSafe: redaction.safe,
    },
    null,
    2,
  ),
);

function buildIntents(
  labels: Labels["cases"][number]["labels"],
): Array<{
  intentType: IntentType;
  startedAtAction: number;
  supportingActions: number;
  expectedConversion: string;
  conversionObserved: boolean;
  staleAfterN: number;
  status: IntentStatus;
}> {
  const buckets = new Map<IntentType, typeof labels>();
  for (const label of labels) {
    const intentType = intentTypeForLabel(label);
    if (!intentType) continue;
    buckets.set(intentType, [...(buckets.get(intentType) ?? []), label]);
  }
  return [...buckets.entries()].map(([intentType, entries]) => {
    const conversionObserved = entries.some((entry) => isConversionLabel(entry.label));
    const staleActions = entries.filter((entry) => entry.label === "no_progress_stale").length;
    const status: IntentStatus = conversionObserved
      ? "intent_converted"
      : staleActions >= STALE_AFTER_N
        ? "intent_stale"
        : "intent_blocked_by_no_legal_alternative";
    return {
      intentType,
      startedAtAction: entries[0]?.actionIndex ?? 0,
      supportingActions: entries.length,
      expectedConversion: expectedConversionForIntent(intentType),
      conversionObserved,
      staleAfterN: STALE_AFTER_N,
      status,
    };
  });
}

function intentTypeForLabel(
  label: Labels["cases"][number]["labels"][number],
): IntentType | undefined {
  if (label.side === "runner" && label.label === "progress_coverage_install") {
    return "runner_coverage";
  }
  if (
    label.side === "runner" &&
    ["progress_reachability_improved", "progress_access", "progress_trash", "progress_steal"].includes(label.label)
  ) {
    return "runner_reachability";
  }
  if (label.side === "runner" && ["gain_credit", "draw_card"].includes(label.actionType)) {
    return "runner_reserve";
  }
  if (
    label.side === "corp" &&
    ["progress_score", "progress_server_protected"].includes(label.label)
  ) {
    return "corp_tempo";
  }
  if (label.side === "corp" && ["gain_credit", "activated_card_ability"].includes(label.actionType)) {
    return "corp_economy";
  }
  return undefined;
}

function isConversionLabel(label: string): boolean {
  return label.startsWith("progress_") && label !== "progress_economy_converted";
}

function expectedConversionForIntent(intentType: IntentType): string {
  switch (intentType) {
    case "runner_coverage":
      return "coverage_install";
    case "runner_reachability":
      return "access_trash_or_steal";
    case "runner_reserve":
      return "run_or_coverage_after_reserve";
    case "corp_tempo":
      return "score_protect_or_rez";
    case "corp_economy":
      return "score_or_protection_after_economy";
  }
}

function renderMarkdown(input: {
  gitHead: string;
  redaction: { safe: boolean };
  statusCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  intentCases: Array<{
    caseId: string;
    dominantSubcluster: string;
    intents: Array<{
      intentType: IntentType;
      startedAtAction: number;
      supportingActions: number;
      expectedConversion: string;
      conversionObserved: boolean;
      status: IntentStatus;
    }>;
  }>;
}): string {
  return `# AI144 Endgame Intent Memory Shadow

Datum: 2026-06-12

Branch: \`codex/ai140-ai148-semantic-endgame-optimization\`

## Ziel

AI144 diagnostiziert Endfenster-Schleifen über Absichten statt über pauschale Einzelaktions-Mali. Es trackt, ob ein Zielversuch konvertiert, stale wird oder mangels belegter LegalAction-Alternative blockiert bleibt.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fälle | ${input.intentCases.length} |
| Intents | ${input.intentCases.flatMap((entry) => entry.intents).length} |
| Redaction-safe | ${input.redaction.safe ? 1 : 0} |

## Status

${markdownCountTable(input.statusCounts, "Status")}

## Intent-Typen

${markdownCountTable(input.typeCounts, "Intent")}

## Fälle

| Case | Subcluster | Intents |
| --- | --- | --- |
${input.intentCases
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${entry.intents.map((intent) => `\`${intent.intentType}:${intent.status}:${intent.supportingActions}\``).join(", ")} |`,
  )
  .join("\n")}

## Schluss

Intent Memory ist als Shadow-Signal brauchbar: Es macht stale Zielversuche sichtbar, ohne Credit, Draw, Run oder Corp-Economy pauschal zu bestrafen. Ein späterer Runtime-Einsatz müsste auf Zielwechseln mit same-state LegalAction-Proof beruhen.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai144-endgame-intent-memory-shadow.ts\`
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
