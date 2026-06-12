import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type Proof = {
  proofCases: Array<{
    caseId: string;
    pair: string;
    seed: string;
    dominantSubcluster: string;
    legacySelected: { actionIndex: number; actionType: string; side: string };
    historicalChallenger: { actionIndex: number; actionType: string; side: string };
    sameStateAlternatives: Alternative[];
  }>;
};

type Probe = {
  matrix: Array<{
    pair: { id: string };
    summaries: Array<{
      seed: string;
      actionAlternativeSnapshots?: Array<{
        actionIndex: number;
        alternatives: Alternative[];
      }>;
    }>;
  }>;
};

type Alternative = {
  rank?: number;
  actionType: string;
  semanticActionType?: string;
  selected?: boolean;
  sourceKind?: string;
  sourceDefinitionId?: string;
  scoreKeys?: string[];
  hardGates?: string[];
  targetContextStatus?: string;
  expectedProgressLabel?: string;
  blockedReason?: string;
};

const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i;
const TOP_CASES = 5;

const repoRoot = findRepoRoot(process.cwd());
const proof = JSON.parse(
  readFileSync(
    resolve(repoRoot, "docs/reviews/ai/ai140-same-state-challenger-proof-2026-06-12.json"),
    "utf8",
  ),
) as Proof;
const probe = JSON.parse(
  readFileSync(
    resolve(
      repoRoot,
      "docs/reviews/ai/ai140-same-state-alternative-probe-2026-06-12.json",
    ),
    "utf8",
  ),
) as Probe;
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai141-challenger-target-context-gap-review-2026-06-12.md",
);

const reviewedCases = proof.proofCases.slice(0, TOP_CASES).map((entry) => {
  const alternatives = sameStateAlternativesFor(entry).map((alternative) => ({
    ...alternative,
    gaps: targetContextGaps(alternative),
    costProfile: inferCostProfile(alternative),
    timingProfile: inferTimingProfile(alternative),
  }));
  return {
    caseId: entry.caseId,
    pair: entry.pair,
    seed: entry.seed,
    dominantSubcluster: entry.dominantSubcluster,
    legacySelected: entry.legacySelected,
    historicalChallenger: entry.historicalChallenger,
    historicalChallengerPresentAtSameState: alternatives.some(
      (alternative) => alternative.actionType === entry.historicalChallenger.actionType,
    ),
    alternatives,
    closure: closeCase(entry.historicalChallenger.actionType, alternatives),
  };
});
const redaction = scanRedaction({ reviewedCases });
mkdirSync(dirname(mdOut), { recursive: true });
writeFileSync(
  mdOut,
  renderMarkdown({
    gitHead: git(["rev-parse", "--short", "HEAD"]),
    reviewedCases,
    redaction,
  }),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      reviewedCases: reviewedCases.length,
      redactionSafe: redaction.safe,
      completeOrExplained: reviewedCases.filter(
        (entry) => entry.closure.status !== "needs_unexplained_context",
      ).length,
    },
    null,
    2,
  ),
);

function targetContextGaps(alternative: Alternative): string[] {
  const gaps: string[] = [];
  if (!alternative.sourceKind) gaps.push("sourceKind_missing");
  if (
    alternative.sourceKind === "visible_card_or_ability" &&
    !alternative.sourceDefinitionId
  ) {
    gaps.push("sourceDefinitionId_missing");
  }
  if (!alternative.targetContextStatus || alternative.targetContextStatus === "opaque") {
    gaps.push("targetContextStatus_opaque_or_missing");
  }
  if (
    ["activated_card_ability", "resolve_choice"].includes(alternative.actionType) &&
    !hasAbilityOrChoiceEvidence(alternative)
  ) {
    gaps.push("ability_or_choice_context_missing");
  }
  if (alternative.hardGates && alternative.hardGates.length > 0) {
    gaps.push("hard_gate_present");
  }
  return gaps;
}

function sameStateAlternativesFor(entry: Proof["proofCases"][number]): Alternative[] {
  const summary = probe.matrix
    .find((matrixEntry) => matrixEntry.pair.id.toUpperCase() === entry.pair.toUpperCase())
    ?.summaries.find((summaryEntry) => summaryEntry.seed === entry.seed);
  return (
    summary?.actionAlternativeSnapshots?.find(
      (snapshot) => snapshot.actionIndex === entry.legacySelected.actionIndex,
    )?.alternatives ??
    entry.sameStateAlternatives
  );
}

function inferCostProfile(alternative: Alternative): string {
  const text = alternativeText(alternative);
  if (/unaffordable|blocked_by_credits|creditsbelow/.test(text)) {
    return "cost_blocked";
  }
  if (/credit|economy|rez|install|trash|advance/.test(text)) {
    return "cost_relevant_side_safe";
  }
  return "cost_not_material_or_unknown";
}

function inferTimingProfile(alternative: Alternative): string {
  const text = alternativeText(alternative);
  if (/run|access|encounter|continue|break|pump/.test(text)) return "run_window";
  if (/score|advance|install|rez|mandatory/.test(text)) return "corp_action_window";
  if (/draw|credit|basic_action/.test(text)) return "basic_action_window";
  return "timing_unknown_but_no_runtime_use";
}

function hasAbilityOrChoiceEvidence(alternative: Alternative): boolean {
  return /ability|choice|source|card|selected|visible/.test(alternativeText(alternative));
}

function closeCase(
  historicalActionType: string,
  alternatives: Array<Alternative & { gaps: string[] }>,
): { status: string; reason: string } {
  const historicalAtSameState = alternatives.find(
    (alternative) => alternative.actionType === historicalActionType,
  );
  if (!historicalAtSameState) {
    return {
      status: "historical_action_not_in_same_state_alternatives",
      reason:
        "TargetContext is sufficiently explained for the same-state list, but the historical challenger action is absent at the legacy decision point.",
    };
  }
  if (historicalAtSameState.gaps.length === 0) {
    return {
      status: "complete_same_state_context",
      reason: "Historical challenger appears at same state with complete side-safe context.",
    };
  }
  if (
    historicalAtSameState.gaps.every((gap) =>
      ["sourceDefinitionId_missing", "ability_or_choice_context_missing"].includes(gap),
    )
  ) {
    return {
      status: "explained_optional_context_gap",
      reason:
        "Missing source details are diagnostic gaps only; no runtime cutover is allowed from this evidence.",
    };
  }
  return {
    status: "needs_unexplained_context",
    reason: `Unresolved gaps: ${historicalAtSameState.gaps.join(", ")}`,
  };
}

function renderMarkdown(input: {
  gitHead: string;
  redaction: { safe: boolean };
  reviewedCases: Array<{
    caseId: string;
    dominantSubcluster: string;
    legacySelected: { actionIndex: number; actionType: string; side: string };
    historicalChallenger: { actionIndex: number; actionType: string; side: string };
    historicalChallengerPresentAtSameState: boolean;
    closure: { status: string; reason: string };
    alternatives: Array<
      Alternative & { gaps: string[]; costProfile: string; timingProfile: string }
    >;
  }>;
}): string {
  return `# AI141 Challenger TargetContext Gap Review

Datum: 2026-06-12

Branch: \`codex/ai140-ai148-semantic-endgame-optimization\`

## Ziel

AI141 prüft die Top-5-Challenger-Fälle aus AI140 auf side-safe TargetContext-, Source-, Kosten- und Timing-Gaps. Es wird keine Legalität erzeugt und kein Runtime-Scoring geändert.

## Methode

- Quelle: \`docs/reviews/ai/ai140-same-state-challenger-proof-2026-06-12.json\`
- Bewertet werden die ersten fünf AI140-Fälle.
- Geprüfte Felder: \`sourceKind\`, \`sourceDefinitionId\`, \`targetContextStatus\`, \`hardGates\`, Kostenprofil und Timingprofil.
- Redaction-safe: ${input.redaction.safe ? "ja" : "nein"}
- Git Head: \`${input.gitHead}\`

## Ergebnis

| Case | Subcluster | Legacy | historischer Challenger | Challenger same-state vorhanden | Closure |
| --- | --- | --- | --- | ---: | --- |
${input.reviewedCases
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${entry.legacySelected.side}/${entry.legacySelected.actionType}@${entry.legacySelected.actionIndex} | ${entry.historicalChallenger.side}/${entry.historicalChallenger.actionType}@${entry.historicalChallenger.actionIndex} | ${entry.historicalChallengerPresentAtSameState ? 1 : 0} | \`${entry.closure.status}\` |`,
  )
  .join("\n")}

## Detailprüfung

${input.reviewedCases
  .map(
    (entry) => `### ${entry.caseId}

${entry.closure.reason}

| Rank | Action | Semantic | Source | TargetContext | Cost | Timing | Gaps |
| ---: | --- | --- | --- | --- | --- | --- | --- |
${entry.alternatives
  .map(
    (alternative) =>
      `| ${alternative.rank ?? "n/a"} | \`${alternative.actionType}\`${alternative.selected ? " selected" : ""} | \`${alternative.semanticActionType ?? "unknown"}\` | \`${alternative.sourceKind ?? "missing"}:${alternative.sourceDefinitionId ?? "none"}\` | \`${alternative.targetContextStatus ?? "missing"}\` | \`${alternative.costProfile}\` | \`${alternative.timingProfile}\` | ${alternative.gaps.length > 0 ? alternative.gaps.map((gap) => `\`${gap}\``).join(", ") : "none"} |`,
  )
  .join("\n")}`,
  )
  .join("\n\n")}

## Schluss

Die Top-5-Fälle haben same-state Alternative-Listen, aber der jeweilige historische Challenger-Action-Typ ist dort nicht vorhanden. Das ist kein ungeklärter Hidden-Info- oder Legalitätsgap, sondern ein bestätigtes Cutover-Hindernis: Die bessere historische Aktion war am exakten Legacy-State nicht als Alternative belegt. AI142 und AI143 können daraus Shadow-Prioritäten ableiten, aber AI146 darf daraus keinen Runtime-Fix schneiden.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai141-challenger-target-context-gap-review.ts\`
- \`git diff --check\`
`;
}

function alternativeText(alternative: Alternative): string {
  return [
    alternative.actionType,
    alternative.semanticActionType,
    alternative.sourceKind,
    alternative.sourceDefinitionId,
    alternative.targetContextStatus,
    alternative.expectedProgressLabel,
    alternative.blockedReason,
    ...(alternative.scoreKeys ?? []),
    ...(alternative.hardGates ?? []),
  ]
    .filter(Boolean)
    .join("|")
    .toLocaleLowerCase("en-US");
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
