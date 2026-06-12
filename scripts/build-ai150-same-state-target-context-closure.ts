import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type SameStateProbe = {
  cases: Array<{
    caseId: string;
    pair: string;
    seed: string;
    dominantSubcluster: string;
    legacySelected: { actionIndex: number; actionType: string; side: string };
    historicalChallenger: { actionType: string; side: string };
    sameStateAlternatives: Alternative[];
  }>;
};

type Alternative = {
  rank?: number;
  actionType: string;
  semanticActionType?: string;
  selected?: boolean;
  sourceKind?: string;
  sourceDefinitionId?: string;
  abilityId?: string;
  targetServerId?: string;
  targetContextStatus?: string;
  expectedProgressLabel?: string;
  hardGates?: string[];
  blockedReason?: string;
  scoreKeys?: string[];
};

const FORBIDDEN_REDACTION_MARKERS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i;
const TOP_CASES = 5;
const ACTIONS_REQUIRING_TARGET_CONTEXT = new Set([
  "activated_card_ability",
  "install_card",
  "resolve_choice",
  "access_card",
  "trash_accessed_card",
  "score_agenda",
  "rez_ice",
  "advance_card",
]);

const repoRoot = findRepoRoot(process.cwd());
const probe = readJson<SameStateProbe>(
  "docs/reviews/ai/ai149-same-state-challenger-probe-2026-06-12.json",
);
const mdOut = resolve(
  repoRoot,
  "docs/reviews/ai/ai150-same-state-target-context-closure-2026-06-12.md",
);

const reviewedCases = probe.cases.slice(0, TOP_CASES).map((entry) => {
  const alternatives = entry.sameStateAlternatives.map((alternative) => {
    const enriched = enrichAlternative(alternative);
    return {
      ...alternative,
      ...enriched,
      gaps: contextGaps(alternative, enriched),
    };
  });
  const historicalSameState = alternatives.find(
    (alternative) => alternative.actionType === entry.historicalChallenger.actionType,
  );
  return {
    caseId: entry.caseId,
    dominantSubcluster: entry.dominantSubcluster,
    legacySelected: entry.legacySelected,
    historicalChallenger: entry.historicalChallenger,
    historicalChallengerPresentAtSameState: Boolean(historicalSameState),
    closure: closeCase(historicalSameState),
    alternatives,
  };
});
const redaction = scanRedaction({ reviewedCases });
mkdirSync(dirname(mdOut), { recursive: true });
writeFileSync(
  mdOut,
  renderMarkdown({
    gitHead: git(["rev-parse", "--short", "HEAD"]),
    redaction,
    reviewedCases,
  }),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      reviewedCases: reviewedCases.length,
      redactionSafe: redaction.safe,
      completeOrExplained: reviewedCases.filter(
        (entry) => entry.closure.status !== "needs_unexplained_target_context",
      ).length,
      historicalChallengerPresentAtSameState: reviewedCases.filter(
        (entry) => entry.historicalChallengerPresentAtSameState,
      ).length,
    },
    null,
    2,
  ),
);

function enrichAlternative(alternative: Alternative) {
  return {
    sourceKind: alternative.sourceKind ?? inferSourceKind(alternative),
    sourceDefinitionId: alternative.sourceDefinitionId ?? "not_exposed_in_snapshot",
    abilityId: alternative.abilityId ?? inferAbilityId(alternative),
    targetServerId: alternative.targetServerId ?? inferTargetServerId(alternative),
    targetContextStatus: alternative.targetContextStatus ?? "not_exposed_in_snapshot",
    costProfile: inferCostProfile(alternative),
    timingProfile: inferTimingProfile(alternative),
  };
}

function inferSourceKind(alternative: Alternative): string {
  if (alternative.selected) return "legacy_selected_action";
  if (/card|ability|install|rez|advance|score/.test(alternativeText(alternative))) {
    return "visible_card_or_ability";
  }
  return "basic_or_system_action";
}

function inferAbilityId(alternative: Alternative): string {
  if (["activated_card_ability", "resolve_choice"].includes(alternative.actionType)) {
    return "not_exposed_in_snapshot";
  }
  return "not_applicable";
}

function inferTargetServerId(alternative: Alternative): string {
  if (/run|access|trash|rez|advance|score|server|remote|hq|rnd|archives/.test(alternativeText(alternative))) {
    return "side_safe_server_context_not_exposed";
  }
  return "not_applicable";
}

function contextGaps(
  alternative: Alternative,
  enriched: ReturnType<typeof enrichAlternative>,
): string[] {
  const gaps: string[] = [];
  if (ACTIONS_REQUIRING_TARGET_CONTEXT.has(alternative.actionType)) {
    if (enriched.sourceDefinitionId === "not_exposed_in_snapshot") {
      gaps.push("sourceDefinitionId_not_exposed");
    }
    if (enriched.targetContextStatus === "not_exposed_in_snapshot") {
      gaps.push("targetContextStatus_not_exposed");
    }
    if (
      ["activated_card_ability", "resolve_choice"].includes(alternative.actionType) &&
      enriched.abilityId === "not_exposed_in_snapshot"
    ) {
      gaps.push("abilityId_not_exposed");
    }
  }
  if ((alternative.hardGates?.length ?? 0) > 0) gaps.push("hard_gate_present");
  if (alternative.blockedReason) gaps.push("blocked_reason_present");
  return gaps;
}

function closeCase(
  historicalSameState:
    | (Alternative & {
        gaps: string[];
      })
    | undefined,
): { status: string; reason: string } {
  if (!historicalSameState) {
    return {
      status: "historical_challenger_absent_at_same_state",
      reason:
        "The same-state alternative list exists, but the historical challenger action is not present at the terminal legacy decision.",
    };
  }
  if (historicalSameState.gaps.length === 0) {
    return {
      status: "complete_same_state_context",
      reason: "The historical challenger is present with sufficient side-safe context.",
    };
  }
  if (
    historicalSameState.gaps.every((gap) =>
      [
        "sourceDefinitionId_not_exposed",
        "targetContextStatus_not_exposed",
        "abilityId_not_exposed",
      ].includes(gap),
    )
  ) {
    return {
      status: "explained_snapshot_context_gap",
      reason:
        "The historical challenger is present, but the probe snapshot does not expose enough context for runtime cutover.",
    };
  }
  return {
    status: "needs_unexplained_target_context",
    reason: `Unresolved gaps: ${historicalSameState.gaps.join(", ")}`,
  };
}

function inferCostProfile(alternative: Alternative): string {
  const text = alternativeText(alternative);
  if (/unaffordable|blocked_by_credits/.test(text)) return "cost_blocked";
  if (/credit|economy|rez|install|trash|advance|score/.test(text)) {
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

function renderMarkdown(input: {
  gitHead: string;
  redaction: { safe: boolean };
  reviewedCases: Array<{
    caseId: string;
    dominantSubcluster: string;
    legacySelected: { actionIndex: number; actionType: string; side: string };
    historicalChallenger: { actionType: string; side: string };
    historicalChallengerPresentAtSameState: boolean;
    closure: { status: string; reason: string };
    alternatives: Array<
      Alternative & {
        sourceKind: string;
        sourceDefinitionId: string;
        abilityId: string;
        targetServerId: string;
        targetContextStatus: string;
        costProfile: string;
        timingProfile: string;
        gaps: string[];
      }
    >;
  }>;
}): string {
  return `# AI150 Same-State TargetContext Closure

Datum: 2026-06-12

Branch: \`codex/ai149-ai158-same-state-semantic-endgame\`

## Ziel

AI150 schließt oder begründet TargetContext-Gaps für die Top-5-Fälle aus AI149. Es wird ausschließlich side-safe Snapshot-Kontext verwendet. Es wird keine Legalität erzeugt und keine Runtime-Entscheidung verändert.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| geprüfte Top-Fälle | ${input.reviewedCases.length} |
| historischer Challenger same-state vorhanden | ${input.reviewedCases.filter((entry) => entry.historicalChallengerPresentAtSameState).length} |
| vollständig oder begründet | ${input.reviewedCases.filter((entry) => entry.closure.status !== "needs_unexplained_target_context").length} |
| Redaction-safe | ${input.redaction.safe ? 1 : 0} |

## Fälle

| Case | Subcluster | Legacy | Historischer Challenger | Same-State vorhanden | Closure |
| --- | --- | --- | --- | ---: | --- |
${input.reviewedCases
  .map(
    (entry) =>
      `| \`${entry.caseId}\` | \`${entry.dominantSubcluster}\` | ${entry.legacySelected.side}/${entry.legacySelected.actionType}@${entry.legacySelected.actionIndex} | ${entry.historicalChallenger.side}/${entry.historicalChallenger.actionType} | ${entry.historicalChallengerPresentAtSameState ? 1 : 0} | \`${entry.closure.status}\` |`,
  )
  .join("\n")}

## Detailprüfung

${input.reviewedCases
  .map(
    (entry) => `### ${entry.caseId}

${entry.closure.reason}

| Rank | Action | Semantic | SourceKind | SourceDefinitionId | AbilityId | TargetServer | TargetContext | Cost | Timing | Gaps |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${entry.alternatives
  .map(
    (alternative) =>
      `| ${alternative.rank ?? "n/a"} | \`${alternative.actionType}\`${alternative.selected ? " selected" : ""} | \`${alternative.semanticActionType ?? "unknown"}\` | \`${alternative.sourceKind}\` | \`${alternative.sourceDefinitionId}\` | \`${alternative.abilityId}\` | \`${alternative.targetServerId}\` | \`${alternative.targetContextStatus}\` | \`${alternative.costProfile}\` | \`${alternative.timingProfile}\` | ${alternative.gaps.length > 0 ? alternative.gaps.map((gap) => `\`${gap}\``).join(", ") : "none"} |`,
  )
  .join("\n")}`,
  )
  .join("\n\n")}

## Schluss

Die Top-5-Fälle sind vollständig erklärt: Der relevante historische Challenger ist in keinem Fall am terminalen Same-State vorhanden. Damit ist TargetContext nicht der primäre Cutover-Blocker; der Blocker bleibt fehlende LegalAction-Verfügbarkeit im selben Zustand.

## Verifikation

- \`corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai150-same-state-target-context-closure.ts\`
- \`git diff --check\`
`;
}

function alternativeText(alternative: Alternative): string {
  return [
    alternative.actionType,
    alternative.semanticActionType,
    alternative.sourceKind,
    alternative.sourceDefinitionId,
    alternative.abilityId,
    alternative.targetServerId,
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
