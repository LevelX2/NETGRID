import {
  labelProgressDeltaAction,
  type ProgressDeltaLabel,
} from "./progress-delta-labeler";

export type ProgressAwareAlternativeInput = {
  rank?: number;
  actionType: string;
  selected?: boolean;
  source?: string;
  sourceTitle?: string;
  semanticActionType?: string;
  scoreBreakdown?: readonly { key: string; value?: number }[];
  whyChosen?: readonly string[];
  whyNot?: readonly string[];
  economy?: unknown;
  excluded?: boolean;
};

export type ProgressAwareAlternativeSnapshot = {
  rank?: number;
  actionType: string;
  semanticActionType: string;
  selected?: boolean;
  sourceKind?: string;
  sourceDefinitionId?: string;
  scoreKeys: string[];
  hardGates: string[];
  targetContextStatus: string;
  expectedProgressLabel: ProgressDeltaLabel;
  blockedReason?: string;
  similarLaterProgress: "unknown_shadow_only";
  whyChosen: string[];
  whyNot: string[];
  economy?: unknown;
};

export function progressAwareAlternativeSnapshot(
  alternative: ProgressAwareAlternativeInput,
): ProgressAwareAlternativeSnapshot {
  const scoreKeys = (alternative.scoreBreakdown ?? []).map(
    (component) => component.key,
  );
  const hardGates = [...scoreKeys, ...(alternative.whyNot ?? [])].filter(
    (entry) => /hard|gate|unsafe|illegal|excluded|blocked|suppressed/i.test(entry),
  );
  const blockedReason =
    alternative.excluded || hardGates.length > 0
      ? alternative.whyNot?.[0] ?? hardGates[0] ?? "blocked_by_gate"
      : undefined;
  const side = sideForAlternative(alternative);
  const sourceKind = alternativeSourceKind(alternative.source);
  const progressAction = {
    actionType: alternative.actionType,
    ...(side ? { side } : {}),
    reasonCode: scoreKeys.join("|"),
    evidence: [...(alternative.whyChosen ?? []), ...(alternative.whyNot ?? [])],
  };
  return {
    ...(alternative.rank !== undefined ? { rank: alternative.rank } : {}),
    actionType: alternative.actionType,
    semanticActionType:
      alternative.semanticActionType ??
      semanticActionTypeForAlternative(alternative.actionType, scoreKeys),
    ...(alternative.selected !== undefined
      ? { selected: alternative.selected }
      : {}),
    ...(sourceKind ? { sourceKind } : {}),
    ...(alternative.sourceTitle
      ? { sourceDefinitionId: alternative.sourceTitle }
      : {}),
    scoreKeys,
    hardGates,
    targetContextStatus: targetContextStatusForAlternative(
      alternative.actionType,
      scoreKeys,
      alternative.whyChosen ?? [],
      alternative.whyNot ?? [],
    ),
    expectedProgressLabel: labelProgressDeltaAction(progressAction).label,
    ...(blockedReason ? { blockedReason } : {}),
    similarLaterProgress: "unknown_shadow_only",
    whyChosen: [...(alternative.whyChosen ?? [])],
    whyNot: [...(alternative.whyNot ?? [])],
    ...(alternative.economy !== undefined ? { economy: alternative.economy } : {}),
  };
}

function semanticActionTypeForAlternative(
  actionType: string,
  scoreKeys: readonly string[],
): string {
  const text = [actionType, ...scoreKeys].join("|").toLocaleLowerCase("en-US");
  if (/score|advance/.test(text)) return "scoreline";
  if (/coverage|install|breaker|icebreaker/.test(text)) return "coverage_setup";
  if (/\brun\b|access|trash|steal|break|pump/.test(text)) return "run_progress";
  if (/protect|rez|ice|remote|central/.test(text)) return "server_protection";
  if (/credit|economy/.test(text)) return "economy";
  if (/draw|search/.test(text)) return "search_or_draw";
  return "opaque_or_basic";
}

function targetContextStatusForAlternative(
  actionType: string,
  scoreKeys: readonly string[],
  whyChosen: readonly string[],
  whyNot: readonly string[],
): string {
  const text = [actionType, ...scoreKeys, ...whyChosen, ...whyNot]
    .join("|")
    .toLocaleLowerCase("en-US");
  if (/unsafe|hard_gate|gate_block|illegal|excluded/.test(text)) {
    return "blocked_by_hard_gate";
  }
  if (/score|advance/.test(text)) return "scoreline_relevant";
  if (/coverage|breaker|icebreaker/.test(text)) return "coverage_relevant";
  if (/protect|rez|ice|remote|central/.test(text)) {
    return "protection_relevant";
  }
  if (/run|access|trash|steal/.test(text)) return "reachability_relevant";
  if (/credit|economy|reserve/.test(text)) return "economy_or_reserve";
  return "opaque";
}

function sideForAlternative(
  alternative: ProgressAwareAlternativeInput,
): "runner" | "corp" | undefined {
  const text = [
    alternative.actionType,
    ...(alternative.scoreBreakdown ?? []).map((entry) => entry.key),
    ...(alternative.whyChosen ?? []),
    ...(alternative.whyNot ?? []),
  ]
    .join("|")
    .toLocaleLowerCase("en-US");
  if (/corp|score|advance|rez|protect/.test(text)) return "corp";
  if (/runner|run|access|trash|steal|breaker|coverage/.test(text)) {
    return "runner";
  }
  return undefined;
}

function alternativeSourceKind(source: string | undefined): string | undefined {
  if (!source) return undefined;
  if (source === "basic_action" || source === "game_rule") return source;
  return "visible_card_or_ability";
}
