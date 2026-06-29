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
    alternativeEntryShowsHardGate,
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
  const tokens = alternativeTokens([actionType, ...scoreKeys]);
  if (tokensIncludeAny(tokens, ["score", "scoreline", "advance"])) {
    return "scoreline";
  }
  if (
    tokensIncludeAny(tokens, ["coverage", "install", "breaker", "icebreaker"])
  ) {
    return "coverage_setup";
  }
  if (tokensIncludeAny(tokens, ["run", "access", "trash", "steal", "break", "pump"])) {
    return "run_progress";
  }
  if (tokensIncludeAny(tokens, ["protect", "rez", "ice", "remote", "central"])) {
    return "server_protection";
  }
  if (tokensIncludeAny(tokens, ["credit", "economy"])) return "economy";
  if (tokensIncludeAny(tokens, ["draw", "search"])) return "search_or_draw";
  return "opaque_or_basic";
}

function targetContextStatusForAlternative(
  actionType: string,
  scoreKeys: readonly string[],
  whyChosen: readonly string[],
  whyNot: readonly string[],
): string {
  const tokens = alternativeTokens([actionType, ...scoreKeys, ...whyChosen, ...whyNot]);
  if (
    tokensIncludeAny(tokens, ["unsafe", "illegal", "excluded"]) ||
    tokensIncludePhrase(tokens, ["hard", "gate"]) ||
    tokensIncludePhrase(tokens, ["gate", "block"])
  ) {
    return "blocked_by_hard_gate";
  }
  if (tokensIncludeAny(tokens, ["score", "scoreline", "advance"])) {
    return "scoreline_relevant";
  }
  if (tokensIncludeAny(tokens, ["coverage", "breaker", "icebreaker"])) {
    return "coverage_relevant";
  }
  if (tokensIncludeAny(tokens, ["protect", "rez", "ice", "remote", "central"])) {
    return "protection_relevant";
  }
  if (tokensIncludeAny(tokens, ["run", "access", "trash", "steal"])) {
    return "reachability_relevant";
  }
  if (tokensIncludeAny(tokens, ["credit", "economy", "reserve"])) {
    return "economy_or_reserve";
  }
  return "opaque";
}

function sideForAlternative(
  alternative: ProgressAwareAlternativeInput,
): "runner" | "corp" | undefined {
  const tokens = alternativeTokens([
    alternative.actionType,
    ...(alternative.scoreBreakdown ?? []).map((entry) => entry.key),
    ...(alternative.whyChosen ?? []),
    ...(alternative.whyNot ?? []),
  ]);
  if (tokensIncludeAny(tokens, ["corp", "score", "scoreline", "advance", "rez", "protect"])) {
    return "corp";
  }
  if (tokensIncludeAny(tokens, ["runner", "run", "access", "trash", "steal", "breaker", "coverage"])) {
    return "runner";
  }
  return undefined;
}

function alternativeSourceKind(source: string | undefined): string | undefined {
  if (!source) return undefined;
  if (source === "basic_action" || source === "game_rule") return source;
  return "visible_card_or_ability";
}

function alternativeEntryShowsHardGate(entry: string): boolean {
  const tokens = alternativeTokens([entry]);
  return (
    tokensIncludeAny(tokens, [
      "unsafe",
      "illegal",
      "excluded",
      "blocked",
      "suppressed",
    ]) ||
    tokensIncludePhrase(tokens, ["hard", "gate"]) ||
    tokensInclude(tokens, "gate")
  );
}

function alternativeTokens(values: readonly string[]): string[] {
  return values.flatMap((value) =>
    value
      .toLocaleLowerCase("en-US")
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
}

function tokensIncludeAny(
  tokens: readonly string[],
  accepted: readonly string[],
): boolean {
  const acceptedSet = new Set(accepted);
  return tokens.some((token) => acceptedSet.has(token));
}

function tokensInclude(tokens: readonly string[], accepted: string): boolean {
  return new Set(tokens).has(accepted);
}

function tokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some((token, index) =>
    phrase.every((phraseToken, offset) => tokens[index + offset] === phraseToken),
  );
}
