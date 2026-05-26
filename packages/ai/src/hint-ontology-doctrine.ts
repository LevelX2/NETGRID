import activeAiHintsData from "../../../data/ai/ai-card-hints-active.json";
import type { Side } from "@netgrid/shared";
import {
  type AiHintBreakerProfile,
  type AiHintCondition,
  type AiHintCostProfile,
  type AiHintOntologyExtension,
  type AiHintQuality,
  type AiHintRemoteRole,
  type AiHintStructuredEffect,
  type KnownHintBreakerCoverage,
  type KnownHintConditionKind,
  type KnownHintEffectKind,
  type KnownHintEffectResource,
  type KnownHintEffectScope,
  type KnownHintEffectTiming,
  type KnownHintLineSupport,
  type KnownHintRemoteRoleKind,
  validateAiHintOntologyFields,
} from "./hint-ontology";

export type AiDeckOntologyDeckSnapshot = {
  deckSnapshotId: string;
  side: Side;
  cards: Array<{ cardId: string; quantity: number }>;
};

export type AiDeckOntologyCountMap<T extends string = string> = Partial<
  Record<T, number>
>;

export type AiDeckOntologyEffectCounts = {
  byKind: AiDeckOntologyCountMap<KnownHintEffectKind>;
  byTiming: AiDeckOntologyCountMap<KnownHintEffectTiming>;
  byScope: AiDeckOntologyCountMap<KnownHintEffectScope>;
  byResource: AiDeckOntologyCountMap<KnownHintEffectResource>;
  cardIdsByKind: Partial<Record<KnownHintEffectKind, string[]>>;
};

export type AiDeckOntologyConditionCounts = {
  byKind: AiDeckOntologyCountMap<KnownHintConditionKind>;
};

export type AiDeckOntologyLineSupportCounts = {
  byKind: AiDeckOntologyCountMap<KnownHintLineSupport>;
  cardIdsByKind: Partial<Record<KnownHintLineSupport, string[]>>;
};

export type AiDeckOntologyBreakerCoverageSummary = {
  coverageCounts: AiDeckOntologyCountMap<KnownHintBreakerCoverage>;
  breakerCards: Array<{
    cardId: string;
    quantity: number;
    coverage: KnownHintBreakerCoverage[];
    baseStrength?: number;
    pumpCost?: number;
    breakCost?: number;
    sideEffects?: string[];
    restrictions?: string[];
  }>;
};

export type AiDeckOntologyRemoteRoleSummary = {
  roleCounts: AiDeckOntologyCountMap<KnownHintRemoteRoleKind>;
  remoteRoleCards: Array<{
    cardId: string;
    quantity: number;
    kind: KnownHintRemoteRoleKind;
    threatLevel?: string;
    serverScope?: string;
  }>;
};

export type AiDeckOntologyQualitySummary = {
  hintReviewedCardCount: number;
  benchmarkCoveredCardCount: number;
  strategyCoveredCardCount: number;
  needsHumanReviewCardCount: number;
  lowConfidenceCardCount: number;
  needsHumanReviewCardIds: string[];
  lowConfidenceCardIds: string[];
};

export type AiDeckOntologyScoredAgendaActionSummary = {
  cardIds: string[];
  effectKindCounts: AiDeckOntologyCountMap<KnownHintEffectKind>;
};

export type AiDeckOntologyTagPunishSummary = {
  tagSourceCardIds: string[];
  tagPunishPayoffCardIds: string[];
  hasTagSourceAndPayoff: boolean;
};

export type AiDeckOntologyValidationSummary = {
  errorCount: number;
  warningCount: number;
  cardIdsWithErrors: string[];
  cardIdsWithWarnings: string[];
};

export type AiDeckOntologySummary = {
  schemaVersion: "ai-deck-ontology-summary-v1";
  deckSnapshotId: string;
  side: Side;
  totalCardQuantity: number;
  uniqueCardCount: number;
  structuredCardCount: number;
  structuredCardQuantity: number;
  effectCounts: AiDeckOntologyEffectCounts;
  conditionCounts: AiDeckOntologyConditionCounts;
  lineSupportCounts: AiDeckOntologyLineSupportCounts;
  breakerCoverage: AiDeckOntologyBreakerCoverageSummary;
  remoteRoles: AiDeckOntologyRemoteRoleSummary;
  scoredAgendaActions: AiDeckOntologyScoredAgendaActionSummary;
  tagPunish: AiDeckOntologyTagPunishSummary;
  quality: AiDeckOntologyQualitySummary;
  validation: AiDeckOntologyValidationSummary;
};

type AiHintWithOntology = AiHintOntologyExtension & {
  cardId: string;
  side: Side;
};

const ACTIVE_HINT_ONTOLOGY_BY_CARD = new Map(
  (activeAiHintsData.cards as AiHintWithOntology[]).map((hint) => [
    hint.cardId,
    hint,
  ]),
);

export function buildAiDeckOntologySummary(
  snapshot: AiDeckOntologyDeckSnapshot,
): AiDeckOntologySummary {
  const sortedCards = snapshot.cards
    .slice()
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
  const effectCounts: AiDeckOntologyEffectCounts = {
    byKind: {},
    byTiming: {},
    byScope: {},
    byResource: {},
    cardIdsByKind: {},
  };
  const conditionCounts: AiDeckOntologyConditionCounts = { byKind: {} };
  const lineSupportCounts: AiDeckOntologyLineSupportCounts = {
    byKind: {},
    cardIdsByKind: {},
  };
  const breakerCoverage: AiDeckOntologyBreakerCoverageSummary = {
    coverageCounts: {},
    breakerCards: [],
  };
  const remoteRoles: AiDeckOntologyRemoteRoleSummary = {
    roleCounts: {},
    remoteRoleCards: [],
  };
  const scoredAgendaActions: AiDeckOntologyScoredAgendaActionSummary = {
    cardIds: [],
    effectKindCounts: {},
  };
  const tagPunish: AiDeckOntologyTagPunishSummary = {
    tagSourceCardIds: [],
    tagPunishPayoffCardIds: [],
    hasTagSourceAndPayoff: false,
  };
  const quality: AiDeckOntologyQualitySummary = {
    hintReviewedCardCount: 0,
    benchmarkCoveredCardCount: 0,
    strategyCoveredCardCount: 0,
    needsHumanReviewCardCount: 0,
    lowConfidenceCardCount: 0,
    needsHumanReviewCardIds: [],
    lowConfidenceCardIds: [],
  };
  const validation: AiDeckOntologyValidationSummary = {
    errorCount: 0,
    warningCount: 0,
    cardIdsWithErrors: [],
    cardIdsWithWarnings: [],
  };

  let totalCardQuantity = 0;
  let structuredCardCount = 0;
  let structuredCardQuantity = 0;

  for (const entry of sortedCards) {
    const quantity = Math.max(0, entry.quantity);
    totalCardQuantity += quantity;
    const hint = ACTIVE_HINT_ONTOLOGY_BY_CARD.get(entry.cardId);
    if (!hint) continue;

    const result = validateAiHintOntologyFields(hint);
    validation.errorCount += result.errors.length;
    validation.warningCount += result.warnings.length;
    if (result.errors.length > 0)
      validation.cardIdsWithErrors.push(entry.cardId);
    if (result.warnings.length > 0)
      validation.cardIdsWithWarnings.push(entry.cardId);

    const structured = hasStructuredOntologyFields(hint);
    if (structured) {
      structuredCardCount += 1;
      structuredCardQuantity += quantity;
    }

    aggregateEffects(
      hint.effects ?? [],
      entry.cardId,
      quantity,
      effectCounts,
      scoredAgendaActions,
      tagPunish,
    );
    aggregateConditions(hint.conditions ?? [], quantity, conditionCounts);
    aggregateLineSupport(
      hint.lineSupport ?? [],
      entry.cardId,
      quantity,
      lineSupportCounts,
    );
    aggregateBreakerProfile(
      hint.breakerProfile,
      entry.cardId,
      quantity,
      breakerCoverage,
    );
    aggregateRemoteRole(hint.remoteRole, entry.cardId, quantity, remoteRoles);
    aggregateQuality(hint.quality, entry.cardId, quality);
  }

  scoredAgendaActions.cardIds = sortedUnique(scoredAgendaActions.cardIds);
  tagPunish.tagSourceCardIds = sortedUnique(tagPunish.tagSourceCardIds);
  tagPunish.tagPunishPayoffCardIds = sortedUnique(
    tagPunish.tagPunishPayoffCardIds,
  );
  tagPunish.hasTagSourceAndPayoff =
    tagPunish.tagSourceCardIds.length > 0 &&
    tagPunish.tagPunishPayoffCardIds.length > 0;

  return {
    schemaVersion: "ai-deck-ontology-summary-v1",
    deckSnapshotId: snapshot.deckSnapshotId,
    side: snapshot.side,
    totalCardQuantity,
    uniqueCardCount: sortedCards.length,
    structuredCardCount,
    structuredCardQuantity,
    effectCounts: sortEffectCounts(effectCounts),
    conditionCounts: {
      byKind: sortCountMap(conditionCounts.byKind),
    },
    lineSupportCounts: sortLineSupportCounts(lineSupportCounts),
    breakerCoverage: {
      coverageCounts: sortCountMap(breakerCoverage.coverageCounts),
      breakerCards: breakerCoverage.breakerCards,
    },
    remoteRoles: {
      roleCounts: sortCountMap(remoteRoles.roleCounts),
      remoteRoleCards: remoteRoles.remoteRoleCards,
    },
    scoredAgendaActions: {
      cardIds: scoredAgendaActions.cardIds,
      effectKindCounts: sortCountMap(scoredAgendaActions.effectKindCounts),
    },
    tagPunish,
    quality: {
      ...quality,
      needsHumanReviewCardIds: sortedUnique(quality.needsHumanReviewCardIds),
      lowConfidenceCardIds: sortedUnique(quality.lowConfidenceCardIds),
    },
    validation: {
      ...validation,
      cardIdsWithErrors: sortedUnique(validation.cardIdsWithErrors),
      cardIdsWithWarnings: sortedUnique(validation.cardIdsWithWarnings),
    },
  };
}

function aggregateEffects(
  effects: AiHintStructuredEffect[],
  cardId: string,
  quantity: number,
  counts: AiDeckOntologyEffectCounts,
  scoredAgendaActions: AiDeckOntologyScoredAgendaActionSummary,
  tagPunish: AiDeckOntologyTagPunishSummary,
): void {
  const hasScoredAgendaAction = effects.some(
    (effect) => effect.kind === "scored_agenda_action",
  );
  for (const effect of effects) {
    increment(counts.byKind, effect.kind, quantity);
    increment(counts.byTiming, effect.timing, quantity);
    increment(counts.byScope, effect.scope, quantity);
    if (effect.resource)
      increment(counts.byResource, effect.resource, quantity);
    pushCardId(counts.cardIdsByKind, effect.kind, cardId);
    if (hasScoredAgendaAction) {
      scoredAgendaActions.cardIds.push(cardId);
      increment(scoredAgendaActions.effectKindCounts, effect.kind, quantity);
    }
    if (effect.kind === "tag_source") tagPunish.tagSourceCardIds.push(cardId);
    if (effect.kind === "tag_punish_payoff")
      tagPunish.tagPunishPayoffCardIds.push(cardId);
  }
}

function aggregateConditions(
  conditions: AiHintCondition[],
  quantity: number,
  counts: AiDeckOntologyConditionCounts,
): void {
  for (const condition of conditions) {
    increment(counts.byKind, condition.kind, quantity);
  }
}

function aggregateLineSupport(
  lineSupport: KnownHintLineSupport[],
  cardId: string,
  quantity: number,
  counts: AiDeckOntologyLineSupportCounts,
): void {
  for (const support of lineSupport) {
    increment(counts.byKind, support, quantity);
    pushCardId(counts.cardIdsByKind, support, cardId);
  }
}

function aggregateBreakerProfile(
  breakerProfile: AiHintBreakerProfile | undefined,
  cardId: string,
  quantity: number,
  summary: AiDeckOntologyBreakerCoverageSummary,
): void {
  if (!breakerProfile) return;
  for (const coverage of breakerProfile.coverage) {
    increment(summary.coverageCounts, coverage, quantity);
  }
  summary.breakerCards.push({
    cardId,
    quantity,
    coverage: breakerProfile.coverage.slice(),
    ...(breakerProfile.baseStrength !== undefined
      ? { baseStrength: breakerProfile.baseStrength }
      : {}),
    ...(breakerProfile.pumpCost !== undefined
      ? { pumpCost: breakerProfile.pumpCost }
      : {}),
    ...(breakerProfile.breakCost !== undefined
      ? { breakCost: breakerProfile.breakCost }
      : {}),
    ...(breakerProfile.sideEffects
      ? { sideEffects: breakerProfile.sideEffects.slice() }
      : {}),
    ...(breakerProfile.restrictions
      ? { restrictions: breakerProfile.restrictions.slice() }
      : {}),
  });
}

function aggregateRemoteRole(
  remoteRole: AiHintRemoteRole | undefined,
  cardId: string,
  quantity: number,
  summary: AiDeckOntologyRemoteRoleSummary,
): void {
  if (!remoteRole) return;
  increment(summary.roleCounts, remoteRole.kind, quantity);
  summary.remoteRoleCards.push({
    cardId,
    quantity,
    kind: remoteRole.kind,
    ...(remoteRole.threatLevel ? { threatLevel: remoteRole.threatLevel } : {}),
    ...(remoteRole.serverScope ? { serverScope: remoteRole.serverScope } : {}),
  });
}

function aggregateQuality(
  quality: AiHintQuality | undefined,
  cardId: string,
  summary: AiDeckOntologyQualitySummary,
): void {
  if (!quality) return;
  if (quality.hintReviewed === true) summary.hintReviewedCardCount += 1;
  if (quality.benchmarkCovered === true) summary.benchmarkCoveredCardCount += 1;
  if (quality.strategyCovered === true) summary.strategyCoveredCardCount += 1;
  if (quality.needsHumanReview === true) {
    summary.needsHumanReviewCardCount += 1;
    summary.needsHumanReviewCardIds.push(cardId);
  }
  if (quality.confidence === "low") {
    summary.lowConfidenceCardCount += 1;
    summary.lowConfidenceCardIds.push(cardId);
  }
}

function hasStructuredOntologyFields(hint: AiHintWithOntology): boolean {
  return (
    (hint.effects?.length ?? 0) > 0 ||
    (hint.conditions?.length ?? 0) > 0 ||
    hint.costProfile !== undefined ||
    hint.breakerProfile !== undefined ||
    hint.remoteRole !== undefined ||
    (hint.lineSupport?.length ?? 0) > 0 ||
    (hint.opponentSignals?.length ?? 0) > 0
  );
}

function sortEffectCounts(
  counts: AiDeckOntologyEffectCounts,
): AiDeckOntologyEffectCounts {
  return {
    byKind: sortCountMap(counts.byKind),
    byTiming: sortCountMap(counts.byTiming),
    byScope: sortCountMap(counts.byScope),
    byResource: sortCountMap(counts.byResource),
    cardIdsByKind: sortCardIdMap(counts.cardIdsByKind),
  };
}

function sortLineSupportCounts(
  counts: AiDeckOntologyLineSupportCounts,
): AiDeckOntologyLineSupportCounts {
  return {
    byKind: sortCountMap(counts.byKind),
    cardIdsByKind: sortCardIdMap(counts.cardIdsByKind),
  };
}

function increment<T extends string>(
  counts: Partial<Record<T, number>>,
  key: T,
  amount: number,
): void {
  counts[key] = (counts[key] ?? 0) + amount;
}

function pushCardId<T extends string>(
  values: Partial<Record<T, string[]>>,
  key: T,
  cardId: string,
): void {
  const entries = values[key] ?? [];
  entries.push(cardId);
  values[key] = entries;
}

function sortCountMap<T extends string>(
  counts: Partial<Record<T, number>>,
): Partial<Record<T, number>> {
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)),
  ) as Partial<Record<T, number>>;
}

function sortCardIdMap<T extends string>(
  values: Partial<Record<T, string[]>>,
): Partial<Record<T, string[]>> {
  return Object.fromEntries(
    (Object.entries(values) as Array<[T, string[]]>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, cardIds]) => [key, sortedUnique(cardIds)]),
  ) as Partial<Record<T, string[]>>;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}
