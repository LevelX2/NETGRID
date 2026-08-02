export const STANDARD_DECK_GUIDE_SCHEMA_VERSION =
  "netgrid-standard-deck-guides-v1" as const;

export type StandardDeckGuideStatus =
  | "available"
  | "missing"
  | "stale"
  | "invalid";

export type StandardDeckGuideKeyCard = {
  cardId: string;
  title: string;
  role: string;
};

export type StandardDeckGuideContent = {
  summary: string;
  deckIdea: string;
  gamePlan: {
    opening: string;
    midgame: string;
    endgame: string;
  };
  keyCards: StandardDeckGuideKeyCard[];
  noDistinctKeyCardsReason?: string;
  pilotingTips: string[];
  weaknesses: string[];
};

export type StandardDeckGuideEntry = {
  standardDeckId: string;
  sourceDeckVersion: string;
  sourceDeckHash: string;
  sourceAnalysisHash: string;
  reviewedAt: string;
  analysis: {
    primaryStrategyIds: string[];
    secondaryStrategyIds: string[];
    reviewStatus: "plausible" | "observe" | "weak_candidate";
  };
  content: StandardDeckGuideContent;
};

export type StandardDeckGuideManifest = {
  schemaVersion: typeof STANDARD_DECK_GUIDE_SCHEMA_VERSION;
  guideSetId: string;
  catalogId: string;
  analyzedAt: string;
  guides: StandardDeckGuideEntry[];
};

export type StandardDeckGuideDeckSource = {
  standardDeckId: string;
  version: string;
  name: string;
  side: "runner" | "corp";
  identityCardId: string;
  cards: Array<{ cardId: string; quantity: number }>;
};

export type StandardDeckGuideResolution = {
  status: StandardDeckGuideStatus;
  guide?: StandardDeckGuideEntry;
  reasons: string[];
};

export function computeStandardDeckGuideSourceHash(
  deck: StandardDeckGuideDeckSource,
): string {
  return `standard-deck:${fnv1a(
    stableStringify({
      standardDeckId: deck.standardDeckId,
      version: deck.version,
      name: deck.name,
      side: deck.side,
      identityCardId: deck.identityCardId,
      cards: normalizeCards(deck.cards),
    }),
  )}`;
}

export function computeStandardDeckGuideAnalysisHash(
  analysis: unknown,
): string {
  return `deck-analysis:${fnv1a(stableStringify(analysis))}`;
}

export function resolveStandardDeckGuide(input: {
  deck: StandardDeckGuideDeckSource;
  manifest: unknown;
  currentAnalysisHash?: string;
}): StandardDeckGuideResolution {
  const manifestIssues = validateManifestContainer(input.manifest);
  if (manifestIssues.length > 0) {
    return { status: "invalid", reasons: manifestIssues };
  }

  const manifest = input.manifest as StandardDeckGuideManifest;
  const matching = manifest.guides.filter(
    (guide) =>
      isRecord(guide) && guide.standardDeckId === input.deck.standardDeckId,
  );
  if (matching.length === 0) {
    return { status: "missing", reasons: ["standard_deck_guide_missing"] };
  }
  if (matching.length > 1) {
    return {
      status: "invalid",
      reasons: ["standard_deck_guide_duplicate"],
    };
  }

  const guide = matching[0]!;
  const contentIssues = validateStandardDeckGuideEntry(guide, input.deck);
  if (contentIssues.length > 0) {
    return { status: "invalid", reasons: contentIssues };
  }

  const staleReasons: string[] = [];
  if (guide.sourceDeckVersion !== input.deck.version) {
    staleReasons.push("standard_deck_guide_version_stale");
  }
  if (
    guide.sourceDeckHash !== computeStandardDeckGuideSourceHash(input.deck)
  ) {
    staleReasons.push("standard_deck_guide_deck_stale");
  }
  if (
    input.currentAnalysisHash !== undefined &&
    guide.sourceAnalysisHash !== input.currentAnalysisHash
  ) {
    staleReasons.push("standard_deck_guide_analysis_stale");
  }
  if (staleReasons.length > 0) {
    return { status: "stale", reasons: staleReasons };
  }

  return { status: "available", guide, reasons: [] };
}

export function validateStandardDeckGuideEntry(
  value: unknown,
  deck?: StandardDeckGuideDeckSource,
): string[] {
  if (!isRecord(value)) return ["standard_deck_guide_not_object"];
  const issues: string[] = [];
  requireString(value, "standardDeckId", issues);
  requireString(value, "sourceDeckVersion", issues);
  requireString(value, "sourceDeckHash", issues);
  requireString(value, "sourceAnalysisHash", issues);
  requireString(value, "reviewedAt", issues);

  if (!isRecord(value.analysis)) {
    issues.push("standard_deck_guide_analysis_invalid");
  } else {
    requireStringArray(value.analysis, "primaryStrategyIds", issues);
    requireStringArray(value.analysis, "secondaryStrategyIds", issues);
    if (
      value.analysis.reviewStatus !== "plausible" &&
      value.analysis.reviewStatus !== "observe" &&
      value.analysis.reviewStatus !== "weak_candidate"
    ) {
      issues.push("standard_deck_guide_review_status_invalid");
    }
  }

  if (!isRecord(value.content)) {
    issues.push("standard_deck_guide_content_invalid");
  } else {
    requireString(value.content, "summary", issues);
    requireString(value.content, "deckIdea", issues);
    if (!isRecord(value.content.gamePlan)) {
      issues.push("standard_deck_guide_game_plan_invalid");
    } else {
      requireString(value.content.gamePlan, "opening", issues);
      requireString(value.content.gamePlan, "midgame", issues);
      requireString(value.content.gamePlan, "endgame", issues);
    }
    if (!Array.isArray(value.content.keyCards)) {
      issues.push("standard_deck_guide_key_cards_invalid");
    } else {
      const deckCardIds = new Set(deck?.cards.map((card) => card.cardId) ?? []);
      const seenCardIds = new Set<string>();
      for (const keyCard of value.content.keyCards) {
        if (!isRecord(keyCard)) {
          issues.push("standard_deck_guide_key_card_invalid");
          continue;
        }
        requireString(keyCard, "cardId", issues);
        requireString(keyCard, "title", issues);
        requireString(keyCard, "role", issues);
        if (typeof keyCard.cardId === "string") {
          if (seenCardIds.has(keyCard.cardId)) {
            issues.push("standard_deck_guide_key_card_duplicate");
          }
          seenCardIds.add(keyCard.cardId);
          if (deck && !deckCardIds.has(keyCard.cardId)) {
            issues.push("standard_deck_guide_key_card_not_in_deck");
          }
        }
      }
      if (
        value.content.keyCards.length === 0 &&
        !nonEmptyString(value.content.noDistinctKeyCardsReason)
      ) {
        issues.push("standard_deck_guide_key_cards_or_reason_required");
      }
      if (value.content.keyCards.length > 6) {
        issues.push("standard_deck_guide_too_many_key_cards");
      }
    }
    requireStringArray(value.content, "pilotingTips", issues, true);
    requireStringArray(value.content, "weaknesses", issues, true);
  }

  if (deck && value.standardDeckId !== deck.standardDeckId) {
    issues.push("standard_deck_guide_wrong_deck");
  }
  return [...new Set(issues)].sort();
}

function validateManifestContainer(value: unknown): string[] {
  if (!isRecord(value)) return ["standard_deck_guide_manifest_not_object"];
  if (value.schemaVersion !== STANDARD_DECK_GUIDE_SCHEMA_VERSION) {
    return ["standard_deck_guide_manifest_schema_invalid"];
  }
  if (!Array.isArray(value.guides)) {
    return ["standard_deck_guide_manifest_guides_invalid"];
  }
  return [];
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  issues: string[],
): void {
  if (!nonEmptyString(record[key])) {
    issues.push(`standard_deck_guide_${key}_invalid`);
  }
}

function requireStringArray(
  record: Record<string, unknown>,
  key: string,
  issues: string[],
  requireEntry = false,
): void {
  const value = record[key];
  if (
    !Array.isArray(value) ||
    (requireEntry && value.length === 0) ||
    value.some((entry) => !nonEmptyString(entry))
  ) {
    issues.push(`standard_deck_guide_${key}_invalid`);
  }
}

function normalizeCards(
  cards: Array<{ cardId: string; quantity: number }>,
): Array<{ cardId: string; quantity: number }> {
  const quantities = new Map<string, number>();
  for (const card of cards) {
    quantities.set(card.cardId, (quantities.get(card.cardId) ?? 0) + card.quantity);
  }
  return [...quantities.entries()]
    .map(([cardId, quantity]) => ({ cardId, quantity }))
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
