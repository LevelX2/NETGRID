import type { Side } from "@netgrid/shared";
import compiledAiHintsData from "../../../data/ai/ai-card-hints-compiled.json";
import inspectorIndexData from "../../../data/ai/ai-hint-inspector-index.json";
import strategyGoalsData from "../../../data/ai/strategy-goals-v1.json";
import { RUNTIME_CARDS } from "./ai-hints";
import type { AiDeckDoctrineDeckSnapshot } from "./deck-doctrine";

export type DeckStrategyConfidence = "low" | "medium" | "high";

export type DeckStrategyEvidence = {
  cardId: string;
  quantity: number;
  source:
    | "compiledHint"
    | "derivedStrategyAnchor"
    | "functionSignal"
    | "lineSupport"
    | "strategicRole";
  signal?: string;
  strategyId?: string;
  role?: string;
  reason: string;
};

export type DeckStrategyScore = {
  anchorScore: number;
  supportScore: number;
  finalScore: number;
  anchorEvidence: DeckStrategyEvidence[];
  supportEvidence: DeckStrategyEvidence[];
  supportGaps: string[];
  confidence: DeckStrategyConfidence;
};

export type RunnerDeckStrategyProfiles = {
  coverageProfile: {
    wall: CoverageBucket;
    code_gate: CoverageBucket;
    sentry: CoverageBucket;
    universal: CoverageBucket;
    special: CoverageBucket;
  };
  economyProfile: {
    generic: number;
    burst: number;
    recurring: number;
    finite: number;
    risky: number | "unknown";
    actionBased: number;
  };
  setupProfile: {
    search: number;
    draw: number;
    recovery: number;
    installSupport: number;
    memoryHandSize: number | "unknown";
  };
  pressureProfile: {
    rnd: number;
    hq: number;
    remote: number;
    archives: number | "unknown";
  };
  defenseProfile: {
    tag: number;
    trace: number;
    damage: number;
    programTrash: number | "unknown";
  };
};

export type CorpDeckStrategyProfiles = {
  iceProfile: {
    etr: number;
    trace: number;
    tag: number;
    damage: number;
    programTrash: number | "unknown";
    futureEncounter: number;
    taxRunCost: number;
  };
  scoreProfile: {
    scoreAcceleration: number;
    agendaInstallAdvanceScoreSupport: number;
    remoteScoringProtection: number;
    stealTax: number;
  };
  economyProfile: {
    operationEconomy: number;
    assetEconomy: number;
    rezSupport: number;
    recurring: number;
    finite: number;
  };
  punishProfile: {
    tagSources: number;
    tagPayoff: number;
    damagePayoff: number;
    traceDensity: number;
  };
  remoteProfile: {
    scoringProtection: number;
    ambush: number;
    assetEconomy: number;
    regionCityGridUpgradeSupport: number | "unknown";
  };
};

export type AiDeckStrategyProfile = {
  schemaVersion: "ai-deck-strategy-profile-v1";
  taskId: "AI006";
  deckId: string;
  side: Side;
  cardCount: number;
  strategyScores: Record<string, DeckStrategyScore>;
  primaryStrategies: string[];
  secondaryStrategies: string[];
  functionSignalCounts: Record<string, number>;
  legacySignalCounts: Record<string, number>;
  warnings: string[];
  runnerProfile?: RunnerDeckStrategyProfiles;
  corpProfile?: CorpDeckStrategyProfiles;
  source: {
    mode: "diagnostic_only";
    strategyGoals: "data/ai/strategy-goals-v1.json";
    compiledHints: "data/ai/ai-card-hints-compiled.json";
    inspectorIndex: "data/ai/ai-hint-inspector-index.json";
    plannerEffect: "none";
  };
};

type CoverageBucket = {
  count: number;
  searchable: boolean | "unknown";
};

type StrategyGoal = {
  strategyId: string;
  side: Side;
  detectionMode:
    | "engine_anchor"
    | "payoff_anchor"
    | "structural_density"
    | "support_requirement";
  anchorSignals?: string[];
  requiredSupport?: Record<string, string>;
  supportWeights?: Record<string, number>;
};

type CompiledAiHint = {
  cardId: string;
  side: Side;
  cardType?: string;
  roles?: string[];
  planRoles?: string[];
  lineSupport?: string[];
  strategicRole?: string[];
  requiredMechanics?: string[];
  riskTags?: string[];
  effects?: Array<{ kind?: string; scope?: string; timing?: string }>;
  remoteRole?: { kind?: string; serverScope?: string; threatLevel?: string };
  costProfile?: { reserveRisk?: string; opportunityCost?: string };
  breakerProfile?: {
    sideEffects?: string[];
    restrictions?: string[];
  };
};

type InspectorClassification = {
  value: string;
  category?: string;
  triageCategory?: string;
  mapsTo?: string[];
};

type InspectorCard = {
  cardId: string;
  side: Side;
  cardType?: string;
  derivedFunctionSignals?: string[];
  derivedStrategyAnchors?: string[];
  lineSupportClassification?: InspectorClassification[];
  warningCategories?: string[];
  strategicRoleStatus?: {
    validValues?: string[];
  };
};

type RuntimeCardForStrategy = {
  side?: Side;
  type?: string;
  cost?: number;
  rezCost?: number;
  advancementRequirement?: number;
  agendaPoints?: number;
  subtypes?: string[];
  subroutines?: Array<{ type?: string }>;
};

type DeckCardStrategyFacts = {
  cardId: string;
  quantity: number;
  side: Side;
  cardType?: string;
  functionSignals: string[];
  derivedStrategyAnchors: string[];
  roles: string[];
  planRoles: string[];
  lineSupport: string[];
  strategicRoles: string[];
  warningCategories: string[];
  requiredMechanics: string[];
  riskTags: string[];
  accessBreakerCoverageBlocked: boolean;
  effects: Array<{ kind?: string; scope?: string; timing?: string }>;
  remoteRoleKind?: string;
  costProfileReserveRisk?: string;
  runtimeSubtypes: string[];
  runtimeCost?: number;
};

type DeckStrategyStats = {
  side: Side;
  cardCount: number;
  cards: DeckCardStrategyFacts[];
  functionSignalCounts: Record<string, number>;
  legacySignalCounts: Record<string, number>;
  cardTypeCounts: Record<string, number>;
};

const STRATEGY_GOALS = (strategyGoalsData.strategyGoals as StrategyGoal[]).slice();
const STRATEGY_GOALS_BY_ID = new Map(
  STRATEGY_GOALS.map((goal) => [goal.strategyId, goal]),
);
const COMPILED_HINTS_BY_CARD = new Map(
  (compiledAiHintsData.cards as CompiledAiHint[]).map((hint) => [
    hint.cardId,
    hint,
  ]),
);
const INSPECTOR_BY_CARD = new Map(
  (inspectorIndexData.cards as InspectorCard[]).map((card) => [
    card.cardId,
    card,
  ]),
);
const ANCHOR_STRATEGIC_ROLES = new Set([
  "engine_anchor",
  "payoff_anchor",
  "punish_payoff",
  "scoring_tool",
  "tax_tool",
  "win_condition",
]);
const ALLOWED_LINE_SUPPORT_TRIAGE = new Set([
  "normalized_strategy_id",
  "safe_strategy_anchor_alias",
]);
const ACCESS_BLOCKING_BREAKER_RESTRICTIONS = new Set([
  "not_access_enabling_breaker",
  "not_reachability_coverage",
  "constraint.not_access_enabling_breaker",
  "constraint.not_reachability_coverage",
]);
const BREAKER_COVERAGE_SIGNAL_IDS = new Set([
  "breaker.ap",
  "breaker.black_ice",
  "breaker.code_gate",
  "breaker.sentry",
  "breaker.trace",
  "breaker.universal",
  "breaker.unknown_special",
  "breaker.wall",
  "breaker.watchdog",
]);

export function buildDeckStrategyProfile(
  snapshot: AiDeckDoctrineDeckSnapshot,
): AiDeckStrategyProfile {
  const stats = deckStrategyStats(snapshot);
  const anchorEvidenceByStrategy = collectAnchorEvidence(stats);
  const strategyScores: Record<string, DeckStrategyScore> = {};
  for (const goal of STRATEGY_GOALS.filter((entry) => entry.side === snapshot.side).sort(
    (left, right) => left.strategyId.localeCompare(right.strategyId),
  )) {
    const anchorEvidence = sortedEvidence(
      anchorEvidenceByStrategy.get(goal.strategyId) ?? [],
    );
    const anchorScore = scoreAnchors(anchorEvidence);
    const support = scoreSupport(goal, stats, anchorEvidence);
    const finalScore = scoreFinal(goal, anchorScore, support.score);
    strategyScores[goal.strategyId] = {
      anchorScore,
      supportScore: support.score,
      finalScore,
      anchorEvidence,
      supportEvidence: support.evidence,
      supportGaps: support.gaps,
      confidence: confidenceFor(anchorScore, support.score, finalScore),
    };
  }

  const rankedStrategies = Object.entries(strategyScores).sort(
    (left, right) =>
      right[1].finalScore - left[1].finalScore ||
      right[1].anchorScore - left[1].anchorScore ||
      left[0].localeCompare(right[0]),
  );
  const primaryStrategies = rankedStrategies
    .filter(([, score]) => score.finalScore >= 45)
    .slice(0, 3)
    .map(([strategyId]) => strategyId);
  const secondaryStrategies = rankedStrategies
    .filter(
      ([strategyId, score]) =>
        score.finalScore >= 30 && !primaryStrategies.includes(strategyId),
    )
    .slice(0, 5)
    .map(([strategyId]) => strategyId);

  return removeUndefined({
    schemaVersion: "ai-deck-strategy-profile-v1",
    taskId: "AI006",
    deckId: snapshot.deckSnapshotId,
    side: snapshot.side,
    cardCount: stats.cardCount,
    strategyScores: sortRecord(strategyScores),
    primaryStrategies,
    secondaryStrategies,
    functionSignalCounts: sortRecord(stats.functionSignalCounts),
    legacySignalCounts: sortRecord(stats.legacySignalCounts),
    warnings: deckWarnings(stats),
    ...(snapshot.side === "runner"
      ? { runnerProfile: buildRunnerProfiles(stats, strategyScores) }
      : { corpProfile: buildCorpProfiles(stats, strategyScores) }),
    source: {
      mode: "diagnostic_only",
      strategyGoals: "data/ai/strategy-goals-v1.json",
      compiledHints: "data/ai/ai-card-hints-compiled.json",
      inspectorIndex: "data/ai/ai-hint-inspector-index.json",
      plannerEffect: "none",
    },
  });
}

function deckStrategyStats(snapshot: AiDeckDoctrineDeckSnapshot): DeckStrategyStats {
  const functionSignalCounts: Record<string, number> = {};
  const legacySignalCounts: Record<string, number> = {};
  const cardTypeCounts: Record<string, number> = {};
  const cards: DeckCardStrategyFacts[] = [];
  const sortedCards = snapshot.cards
    .slice()
    .sort((left, right) => left.cardId.localeCompare(right.cardId));

  for (const entry of sortedCards) {
    const quantity = Math.max(0, entry.quantity);
    if (quantity === 0) continue;
    const hint = COMPILED_HINTS_BY_CARD.get(entry.cardId);
    const inspector = INSPECTOR_BY_CARD.get(entry.cardId);
    const runtimeCard = RUNTIME_CARDS[
      entry.cardId
    ] as RuntimeCardForStrategy | undefined;
    const cardType = hint?.cardType ?? inspector?.cardType ?? runtimeCard?.type;
    const functionSignals = sortedUnique(inspector?.derivedFunctionSignals ?? []);
    const derivedStrategyAnchors = sortedUnique(
      (inspector?.derivedStrategyAnchors ?? []).filter((strategyId) =>
        strategyMatchesSide(strategyId, snapshot.side),
      ),
    );
    const roles = sortedUnique(hint?.roles ?? []);
    const planRoles = sortedUnique(hint?.planRoles ?? []);
    const lineSupport = sortedUnique(hint?.lineSupport ?? []);
    const strategicRoles = sortedUnique([
      ...(hint?.strategicRole ?? []),
      ...(inspector?.strategicRoleStatus?.validValues ?? []),
    ]);
    const accessBreakerCoverageBlocked = breakerProfileBlocksAccessCoverage(
      hint?.breakerProfile,
    );

    for (const signal of functionSignals.filter(
      (signal) =>
        !accessBreakerCoverageBlocked ||
        !BREAKER_COVERAGE_SIGNAL_IDS.has(signal),
    )) {
      increment(functionSignalCounts, signal, quantity);
    }
    for (const role of roles) increment(legacySignalCounts, `role:${role}`, quantity);
    for (const role of planRoles) {
      increment(legacySignalCounts, `planRole:${role}`, quantity);
    }
    for (const value of lineSupport) {
      increment(legacySignalCounts, `lineSupport:${value}`, quantity);
    }
    if (cardType) increment(cardTypeCounts, cardType, quantity);

    cards.push(
      removeUndefined({
        cardId: entry.cardId,
        quantity,
        side: hint?.side ?? inspector?.side ?? snapshot.side,
        ...(cardType ? { cardType } : {}),
        functionSignals,
        derivedStrategyAnchors,
        roles,
        planRoles,
        lineSupport,
        strategicRoles,
        warningCategories: sortedUnique(inspector?.warningCategories ?? []),
        requiredMechanics: sortedUnique(hint?.requiredMechanics ?? []),
        riskTags: sortedUnique(hint?.riskTags ?? []),
        accessBreakerCoverageBlocked,
        effects: hint?.effects ?? [],
        ...(hint?.remoteRole?.kind ? { remoteRoleKind: hint.remoteRole.kind } : {}),
        ...(hint?.costProfile?.reserveRisk
          ? { costProfileReserveRisk: hint.costProfile.reserveRisk }
          : {}),
        runtimeSubtypes: sortedUnique(runtimeCard?.subtypes ?? []),
        ...(typeof runtimeCard?.rezCost === "number"
          ? { runtimeCost: runtimeCard.rezCost }
          : typeof runtimeCard?.cost === "number"
            ? { runtimeCost: runtimeCard.cost }
            : {}),
      }),
    );
  }

  return {
    side: snapshot.side,
    cardCount: sortedCards.reduce(
      (sum, entry) => sum + Math.max(0, entry.quantity),
      0,
    ),
    cards,
    functionSignalCounts,
    legacySignalCounts,
    cardTypeCounts,
  };
}

function collectAnchorEvidence(
  stats: DeckStrategyStats,
): Map<string, DeckStrategyEvidence[]> {
  const byStrategy = new Map<string, DeckStrategyEvidence[]>();
  for (const card of stats.cards) {
    for (const strategyId of card.derivedStrategyAnchors) {
      if (!strategyMatchesSide(strategyId, stats.side)) continue;
      pushEvidence(byStrategy, strategyId, {
        cardId: card.cardId,
        quantity: card.quantity,
        source: "derivedStrategyAnchor",
        strategyId,
        reason: "derived_strategy_anchor_from_inspector_index",
      });
    }

    const lineSupportStrategies = lineSupportAnchorsForCard(card, stats.side);
    for (const { strategyId, value, reason } of lineSupportStrategies) {
      pushEvidence(byStrategy, strategyId, {
        cardId: card.cardId,
        quantity: card.quantity,
        source: "lineSupport",
        signal: value,
        strategyId,
        reason,
      });
    }

    if (
      card.strategicRoles.some((role) => ANCHOR_STRATEGIC_ROLES.has(role)) &&
      (card.derivedStrategyAnchors.length > 0 || lineSupportStrategies.length > 0)
    ) {
      for (const strategyId of sortedUnique([
        ...card.derivedStrategyAnchors,
        ...lineSupportStrategies.map((entry) => entry.strategyId),
      ])) {
        if (!strategyMatchesSide(strategyId, stats.side)) continue;
        pushEvidence(byStrategy, strategyId, {
          cardId: card.cardId,
          quantity: card.quantity,
          source: "strategicRole",
          role: card.strategicRoles.join(","),
          strategyId,
          reason: "valid_strategicRole_reinforces_existing_anchor",
        });
      }
    }
  }
  return byStrategy;
}

function lineSupportAnchorsForCard(
  card: DeckCardStrategyFacts,
  side: Side,
): Array<{ strategyId: string; value: string; reason: string }> {
  const inspector = INSPECTOR_BY_CARD.get(card.cardId);
  const anchors: Array<{ strategyId: string; value: string; reason: string }> = [];
  for (const classification of inspector?.lineSupportClassification ?? []) {
    const triage = classification.triageCategory;
    const exactStrategy = strategyMatchesSide(classification.value, side)
      ? classification.value
      : undefined;
    const mappedStrategies = sortedUnique([
      ...(exactStrategy ? [exactStrategy] : []),
      ...(classification.mapsTo ?? []),
    ]).filter((strategyId) => strategyMatchesSide(strategyId, side));
    if (mappedStrategies.length === 0) continue;
    if (
      exactStrategy ||
      (triage !== undefined && ALLOWED_LINE_SUPPORT_TRIAGE.has(triage))
    ) {
      for (const strategyId of mappedStrategies) {
        if (!lineSupportAnchorAllowed(card, strategyId)) continue;
        anchors.push({
          strategyId,
          value: classification.value,
          reason:
            exactStrategy === classification.value
              ? "normalized_lineSupport_strategy_goal"
              : "safe_lineSupport_strategy_alias_from_inspector_index",
        });
      }
    }
  }
  for (const value of card.lineSupport) {
    if (!strategyMatchesSide(value, side)) continue;
    if (!lineSupportAnchorAllowed(card, value)) continue;
    anchors.push({
      strategyId: value,
      value,
      reason: "compiled_lineSupport_strategy_goal",
    });
  }
  return sortedUniqueObjects(anchors, (entry) => `${entry.strategyId}:${entry.value}`);
}

function lineSupportAnchorAllowed(
  card: DeckCardStrategyFacts,
  strategyId: string,
): boolean {
  if (strategyId === "corp.remote_scoring" && card.cardType === "ice") {
    return false;
  }
  return true;
}

function scoreAnchors(evidence: DeckStrategyEvidence[]): number {
  const points = evidence.reduce((sum, entry) => {
    const base =
      entry.source === "derivedStrategyAnchor"
        ? 32
        : entry.source === "lineSupport"
          ? 28
          : 12;
    return sum + base * entry.quantity;
  }, 0);
  return clampRound(points, 0, 100);
}

function scoreSupport(
  goal: StrategyGoal,
  stats: DeckStrategyStats,
  anchorEvidence: DeckStrategyEvidence[],
): { score: number; evidence: DeckStrategyEvidence[]; gaps: string[] } {
  const weights = goal.supportWeights ?? {};
  const dimensions = Object.keys(goal.requiredSupport ?? weights).sort();
  if (dimensions.length === 0) {
    return { score: 0, evidence: [], gaps: [] };
  }

  let weightedScore = 0;
  let weightTotal = 0;
  const evidence: DeckStrategyEvidence[] = [];
  const gaps: string[] = [];
  for (const dimension of dimensions) {
    const weight = weights[dimension] ?? 1 / dimensions.length;
    const component = supportComponentScore(dimension, goal, stats, anchorEvidence);
    weightedScore += component.score * weight;
    weightTotal += weight;
    evidence.push(...component.evidence);
    gaps.push(...supportGapsForDimension(dimension, component.score, goal, stats));
  }
  return {
    score: clampRound(weightedScore / Math.max(0.001, weightTotal), 0, 100),
    evidence: sortedEvidence(evidence).slice(0, 24),
    gaps: sortedUnique(gaps),
  };
}

function supportComponentScore(
  dimension: string,
  goal: StrategyGoal,
  stats: DeckStrategyStats,
  anchorEvidence: DeckStrategyEvidence[],
): { score: number; evidence: DeckStrategyEvidence[] } {
  switch (dimension) {
    case "agendaDensity":
      return evidenceFromCardType(stats, "agenda", dimension, 3);
    case "ambush":
      return evidenceFromSignals(stats, dimension, ["remote.ambush", "access.punish"], 2);
    case "assetDensity":
      return evidenceFromSignalsAndType(
        stats,
        dimension,
        ["remote.asset_economy"],
        "asset",
        3,
      );
    case "bait":
      return evidenceFromSignals(stats, dimension, ["remote.bait"], 1);
    case "breakerCoverage":
      return breakerCoverageSupport(stats, dimension);
    case "centralAccess":
      return evidenceFromSignals(
        stats,
        dimension,
        ["access.rnd_multiaccess", "access.hq_multiaccess", "info.rnd_topdeck", "info.hq"],
        2,
      );
    case "centralDefense":
      return centralDefenseSupport(stats, dimension);
    case "damageOrTagPayoff":
      return evidenceFromSignals(stats, dimension, ["damage.payoff", "tag.payoff"], 2);
    case "damagePayoff":
      return evidenceFromSignals(stats, dimension, ["damage.payoff"], 2);
    case "defense":
      return evidenceFromSignals(
        stats,
        dimension,
        [
          "defense.damage_prevention",
          "defense.tag_prevention",
          "defense.trace_defense",
        ],
        2,
      );
    case "earlyIce":
      return earlyIceSupport(stats, dimension);
    case "economy":
      return evidenceFromSignals(
        stats,
        dimension,
        [
          "economy.action",
          "economy.advanceable",
          "economy.burst",
          "economy.counter",
          "economy.finite_pool",
          "economy.generic",
          "economy.recurring",
          "economy.rez_discount",
          "economy.start_of_turn",
          "economy.trace_credit",
          "economy.trash_credit",
        ],
        stats.side === "runner" ? 3 : 4,
      );
    case "eventDensity":
      return evidenceFromCardType(stats, "event", dimension, 3);
    case "ice":
      return iceSupport(stats, dimension);
    case "memory":
      return memorySupport(stats, dimension);
    case "pressurePayoff":
      return pressurePayoffSupport(stats, dimension, anchorEvidence);
    case "punishPayoff":
      return evidenceFromSignals(stats, dimension, ["tag.payoff", "damage.payoff"], 2);
    case "remoteAccess":
      return evidenceFromSignals(
        stats,
        dimension,
        ["economy.trash_credit", "access.rnd_multiaccess", "access.hq_multiaccess"],
        2,
      );
    case "remoteProtection":
      return evidenceFromSignals(
        stats,
        dimension,
        ["remote.scoring_protection", "remote.agenda_steal_tax", "tax.remote"],
        2,
      );
    case "remoteScoring":
      return remoteScoringSupport(stats, dimension, anchorEvidence);
    case "remoteSlots":
      return evidenceFromSignalsAndType(
        stats,
        dimension,
        ["remote.asset_economy", "remote.scoring_protection", "remote.bait", "remote.ambush"],
        "upgrade",
        3,
      );
    case "rezReserve":
      return evidenceFromSignals(
        stats,
        dimension,
        ["economy.rez_discount", "economy.recurring", "economy.generic"],
        3,
      );
    case "scoreAcceleration":
      return evidenceFromSignals(
        stats,
        dimension,
        ["score.advance_burst", "score.agenda_action"],
        2,
      );
    case "scorePlan":
      return scorePlanSupport(stats, dimension, anchorEvidence);
    case "searchOrDraw":
      return evidenceFromSignals(
        stats,
        dimension,
        ["setup.search", "setup.recovery", "setup.draw"],
        3,
      );
    case "tagOrTrace":
      return evidenceFromSignals(stats, dimension, ["tag.source", "trace.source"], 2);
    case "tagSource":
      return evidenceFromSignals(stats, dimension, ["tag.source"], 2);
    case "threatAssessment":
      return evidenceFromSignals(stats, dimension, ["info.expose", "info.hq", "info.rnd_topdeck"], 1);
    case "traceSupport":
      return evidenceFromSignals(
        stats,
        dimension,
        ["trace.source", "economy.trace_credit"],
        2,
      );
    default:
      return evidenceFromSignals(stats, dimension, goal.anchorSignals ?? [], 2);
  }
}

function evidenceFromSignals(
  stats: DeckStrategyStats,
  dimension: string,
  signalIds: string[],
  fullSupportCount: number,
): { score: number; evidence: DeckStrategyEvidence[] } {
  const signalSet = new Set(signalIds);
  const evidence = stats.cards
    .filter((card) => card.functionSignals.some((signal) => signalSet.has(signal)))
    .flatMap((card) =>
      card.functionSignals
        .filter((signal) => signalSet.has(signal))
        .map((signal) => ({
          cardId: card.cardId,
          quantity: card.quantity,
          source: "functionSignal" as const,
          signal,
          reason: `support:${dimension}`,
        })),
    );
  const count = signalIds.reduce(
    (sum, signal) => sum + (stats.functionSignalCounts[signal] ?? 0),
    0,
  );
  return {
    score: supportCountScore(count, fullSupportCount),
    evidence: sortedEvidence(evidence),
  };
}

function evidenceFromCardType(
  stats: DeckStrategyStats,
  cardType: string,
  dimension: string,
  fullSupportCount: number,
): { score: number; evidence: DeckStrategyEvidence[] } {
  const evidence = stats.cards
    .filter((card) => card.cardType === cardType)
    .map((card) => ({
      cardId: card.cardId,
      quantity: card.quantity,
      source: "compiledHint" as const,
      signal: `cardType:${cardType}`,
      reason: `support:${dimension}`,
    }));
  return {
    score: supportCountScore(stats.cardTypeCounts[cardType] ?? 0, fullSupportCount),
    evidence: sortedEvidence(evidence),
  };
}

function evidenceFromSignalsAndType(
  stats: DeckStrategyStats,
  dimension: string,
  signalIds: string[],
  cardType: string,
  fullSupportCount: number,
): { score: number; evidence: DeckStrategyEvidence[] } {
  const signalSupport = evidenceFromSignals(stats, dimension, signalIds, fullSupportCount);
  const typeSupport = evidenceFromCardType(stats, cardType, dimension, fullSupportCount);
  return {
    score: Math.max(signalSupport.score, typeSupport.score),
    evidence: sortedEvidence([...signalSupport.evidence, ...typeSupport.evidence]),
  };
}

function accessCapableSignalCount(
  stats: DeckStrategyStats,
  signalId: string,
): number {
  return stats.cards
    .filter((card) => !card.accessBreakerCoverageBlocked)
    .filter((card) => card.functionSignals.includes(signalId))
    .reduce((sum, card) => sum + card.quantity, 0);
}

function breakerProfileBlocksAccessCoverage(
  profile:
    | { sideEffects?: string[]; restrictions?: string[] }
    | undefined,
): boolean {
  if (!profile) return false;
  if (profile.sideEffects?.includes("ends_run_after_use")) return true;
  return (profile.restrictions ?? []).some((restriction) =>
    ACCESS_BLOCKING_BREAKER_RESTRICTIONS.has(restriction),
  );
}

function breakerCoverageSupport(
  stats: DeckStrategyStats,
  dimension: string,
): { score: number; evidence: DeckStrategyEvidence[] } {
  const universal = accessCapableSignalCount(stats, "breaker.universal");
  const wall = universal + accessCapableSignalCount(stats, "breaker.wall");
  const codeGate =
    universal + accessCapableSignalCount(stats, "breaker.code_gate");
  const sentry = universal + accessCapableSignalCount(stats, "breaker.sentry");
  const covered = [wall, codeGate, sentry].filter((count) => count > 0).length;
  const score = covered === 3 ? 100 : covered === 2 ? 72 : covered === 1 ? 38 : 0;
  return {
    score,
    evidence: sortedEvidence(
      stats.cards
        .filter((card) =>
          !card.accessBreakerCoverageBlocked &&
          card.functionSignals.some((signal) =>
            BREAKER_COVERAGE_SIGNAL_IDS.has(signal),
          ),
        )
        .flatMap((card) =>
          card.functionSignals
            .filter((signal) => BREAKER_COVERAGE_SIGNAL_IDS.has(signal))
            .map((signal) => ({
              cardId: card.cardId,
              quantity: card.quantity,
              source: "functionSignal" as const,
              signal,
              reason: `support:${dimension}`,
            })),
        ),
    ),
  };
}

function centralDefenseSupport(
  stats: DeckStrategyStats,
  dimension: string,
): { score: number; evidence: DeckStrategyEvidence[] } {
  const iceSupportResult = iceSupport(stats, dimension);
  const etr = stats.functionSignalCounts["ice.etr"] ?? 0;
  const score = Math.max(iceSupportResult.score, supportCountScore(etr, 3));
  return { score, evidence: iceSupportResult.evidence };
}

function earlyIceSupport(
  stats: DeckStrategyStats,
  dimension: string,
): { score: number; evidence: DeckStrategyEvidence[] } {
  const earlyIce = stats.cards.filter(
    (card) =>
      card.cardType === "ice" &&
      typeof card.runtimeCost === "number" &&
      card.runtimeCost <= 3,
  );
  return {
    score: supportCountScore(
      earlyIce.reduce((sum, card) => sum + card.quantity, 0),
      3,
    ),
    evidence: sortedEvidence(
      earlyIce.map((card) => ({
        cardId: card.cardId,
        quantity: card.quantity,
        source: "compiledHint" as const,
        signal: "cheap_ice",
        reason: `support:${dimension}`,
      })),
    ),
  };
}

function iceSupport(
  stats: DeckStrategyStats,
  dimension: string,
): { score: number; evidence: DeckStrategyEvidence[] } {
  const typeSupport = evidenceFromCardType(stats, "ice", dimension, 5);
  const signalSupport = evidenceFromSignals(
    stats,
    dimension,
    ["ice.etr", "ice.future_pressure", "tax.ice", "trace.source", "tag.source", "damage.payoff"],
    4,
  );
  return {
    score: Math.max(typeSupport.score, signalSupport.score),
    evidence: sortedEvidence([...typeSupport.evidence, ...signalSupport.evidence]),
  };
}

function memorySupport(
  stats: DeckStrategyStats,
  dimension: string,
): { score: number; evidence: DeckStrategyEvidence[] } {
  const cards = stats.cards.filter(
    (card) =>
      card.roles.includes("memory") ||
      card.requiredMechanics.includes("memory") ||
      card.effects.some((effect) => effect.kind === "memory" || effect.kind === "hand_size"),
  );
  const count = cards.reduce((sum, card) => sum + card.quantity, 0);
  return {
    score: supportCountScore(count, 2),
    evidence: sortedEvidence(
      cards.map((card) => ({
        cardId: card.cardId,
        quantity: card.quantity,
        source: "compiledHint" as const,
        signal: "memory_or_hand_size",
        reason: `support:${dimension}`,
      })),
    ),
  };
}

function pressurePayoffSupport(
  stats: DeckStrategyStats,
  dimension: string,
  anchorEvidence: DeckStrategyEvidence[],
): { score: number; evidence: DeckStrategyEvidence[] } {
  const signalSupport = evidenceFromSignals(
    stats,
    dimension,
    ["access.rnd_multiaccess", "access.hq_multiaccess", "info.rnd_topdeck", "info.hq"],
    2,
  );
  const score = Math.max(
    signalSupport.score,
    supportCountScore(
      anchorEvidence.reduce((sum, evidence) => sum + evidence.quantity, 0),
      2,
    ),
  );
  return { score, evidence: sortedEvidence([...signalSupport.evidence, ...anchorEvidence]) };
}

function remoteScoringSupport(
  stats: DeckStrategyStats,
  dimension: string,
  anchorEvidence: DeckStrategyEvidence[],
): { score: number; evidence: DeckStrategyEvidence[] } {
  const signalSupport = evidenceFromSignals(
    stats,
    dimension,
    ["remote.scoring_protection", "remote.agenda_steal_tax"],
    2,
  );
  const remoteAnchorEvidence = anchorEvidence.filter(
    (entry) => entry.strategyId === "corp.remote_scoring",
  );
  return {
    score: Math.max(
      signalSupport.score,
      supportCountScore(
        remoteAnchorEvidence.reduce((sum, entry) => sum + entry.quantity, 0),
        2,
      ),
    ),
    evidence: sortedEvidence([...signalSupport.evidence, ...remoteAnchorEvidence]),
  };
}

function scorePlanSupport(
  stats: DeckStrategyStats,
  dimension: string,
  anchorEvidence: DeckStrategyEvidence[],
): { score: number; evidence: DeckStrategyEvidence[] } {
  const remote = remoteScoringSupport(stats, dimension, anchorEvidence);
  const acceleration = evidenceFromSignals(
    stats,
    dimension,
    ["score.advance_burst", "score.agenda_action"],
    2,
  );
  return {
    score: Math.max(remote.score, acceleration.score),
    evidence: sortedEvidence([...remote.evidence, ...acceleration.evidence]),
  };
}

function supportGapsForDimension(
  dimension: string,
  score: number,
  goal: StrategyGoal,
  stats: DeckStrategyStats,
): string[] {
  if (stats.side === "runner" && dimension === "breakerCoverage" && score < 100) {
    return runnerGapsForDimension(dimension, stats);
  }
  const required = goal.requiredSupport?.[dimension] ?? "recommended";
  const threshold = required === "required" ? 45 : required === "recommended" ? 30 : 25;
  if (score >= threshold) return [];
  if (stats.side === "runner") return runnerGapsForDimension(dimension, stats);
  return corpGapsForDimension(dimension, stats);
}

function runnerGapsForDimension(
  dimension: string,
  stats: DeckStrategyStats,
): string[] {
  switch (dimension) {
    case "breakerCoverage": {
      const gaps: string[] = [];
      const universal = accessCapableSignalCount(stats, "breaker.universal");
      if (accessCapableSignalCount(stats, "breaker.wall") + universal === 0) {
        gaps.push("missing_wall_coverage");
      }
      if (
        accessCapableSignalCount(stats, "breaker.code_gate") + universal ===
        0
      ) {
        gaps.push("missing_code_gate_coverage");
      }
      if (accessCapableSignalCount(stats, "breaker.sentry") + universal === 0) {
        gaps.push("weak_sentry_coverage");
      }
      return gaps.length > 0 ? gaps : ["weak_breaker_coverage"];
    }
    case "economy":
      return ["low_economy_support"];
    case "searchOrDraw":
      return (stats.functionSignalCounts["setup.search"] ?? 0) === 0
        ? ["no_search_support"]
        : ["low_search_or_draw_support"];
    case "defense":
      return ["weak_tag_damage_defense"];
    case "remoteAccess":
      return ["weak_remote_access_support"];
    case "threatAssessment":
      return ["low_threat_assessment_support"];
    default:
      return [`low_${dimension}_support`];
  }
}

function corpGapsForDimension(
  dimension: string,
  stats: DeckStrategyStats,
): string[] {
  switch (dimension) {
    case "economy":
    case "rezReserve":
      return ["low_rez_economy"];
    case "ice":
    case "earlyIce":
      return ["insufficient_etr_ice"];
    case "remoteProtection":
    case "remoteScoring":
      return ["weak_remote_protection"];
    case "tagSource":
      return ["low_tag_sources"];
    case "punishPayoff":
    case "damagePayoff":
      return (stats.functionSignalCounts["tag.source"] ?? 0) === 0 ||
        (stats.functionSignalCounts["trace.source"] ?? 0) === 0
        ? ["payoff_without_enablers"]
        : ["low_punish_payoff_density"];
    case "agendaDensity":
      return ["low_agenda_density"];
    default:
      return [`low_${dimension}_support`];
  }
}

function scoreFinal(
  goal: StrategyGoal,
  anchorScore: number,
  supportScore: number,
): number {
  const weights =
    goal.detectionMode === "structural_density"
      ? { anchor: 0.35, support: 0.65 }
      : goal.detectionMode === "support_requirement"
        ? { anchor: 0.45, support: 0.55 }
        : { anchor: 0.6, support: 0.4 };
  return clampRound(anchorScore * weights.anchor + supportScore * weights.support, 0, 100);
}

function confidenceFor(
  anchorScore: number,
  supportScore: number,
  finalScore: number,
): DeckStrategyConfidence {
  if (finalScore >= 65 && (anchorScore >= 35 || supportScore >= 70)) return "high";
  if (finalScore >= 35 || anchorScore > 0) return "medium";
  return "low";
}

function buildRunnerProfiles(
  stats: DeckStrategyStats,
  strategyScores: Record<string, DeckStrategyScore>,
): RunnerDeckStrategyProfiles {
  const search = stats.functionSignalCounts["setup.search"] ?? 0;
  const universal = accessCapableSignalCount(stats, "breaker.universal");
  const special =
    accessCapableSignalCount(stats, "breaker.ap") +
    accessCapableSignalCount(stats, "breaker.trace") +
    accessCapableSignalCount(stats, "breaker.watchdog") +
    accessCapableSignalCount(stats, "breaker.black_ice") +
    accessCapableSignalCount(stats, "breaker.unknown_special");
  const memoryCount = memorySupport(stats, "memory").evidence.reduce(
    (sum, entry) => sum + entry.quantity,
    0,
  );
  const programTrashCount = legacyValueCount(stats, "program_trash");
  return {
    coverageProfile: {
      wall: coverageBucket(
        accessCapableSignalCount(stats, "breaker.wall") + universal,
        search,
      ),
      code_gate: coverageBucket(
        accessCapableSignalCount(stats, "breaker.code_gate") + universal,
        search,
      ),
      sentry: coverageBucket(
        accessCapableSignalCount(stats, "breaker.sentry") + universal,
        search,
      ),
      universal: coverageBucket(universal, search),
      special: coverageBucket(special, search),
    },
    economyProfile: {
      generic: stats.functionSignalCounts["economy.generic"] ?? 0,
      burst: stats.functionSignalCounts["economy.burst"] ?? 0,
      recurring: stats.functionSignalCounts["economy.recurring"] ?? 0,
      finite: stats.functionSignalCounts["economy.finite_pool"] ?? 0,
      risky: riskyEconomyCount(stats),
      actionBased: stats.functionSignalCounts["economy.action"] ?? 0,
    },
    setupProfile: {
      search,
      draw: stats.functionSignalCounts["setup.draw"] ?? 0,
      recovery: stats.functionSignalCounts["setup.recovery"] ?? 0,
      installSupport: stats.functionSignalCounts["setup.install_discount"] ?? 0,
      memoryHandSize: memoryCount > 0 ? memoryCount : "unknown",
    },
    pressureProfile: {
      rnd:
        (stats.functionSignalCounts["access.rnd_multiaccess"] ?? 0) +
        (stats.functionSignalCounts["info.rnd_topdeck"] ?? 0) +
        Math.round((strategyScores["runner.rnd_pressure"]?.anchorScore ?? 0) / 30),
      hq:
        (stats.functionSignalCounts["access.hq_multiaccess"] ?? 0) +
        (stats.functionSignalCounts["info.hq"] ?? 0) +
        Math.round((strategyScores["runner.hq_pressure"]?.anchorScore ?? 0) / 30),
      remote: Math.round(
        ((strategyScores["runner.remote_contest"]?.anchorScore ?? 0) +
          (strategyScores["runner.remote_trash"]?.anchorScore ?? 0)) /
          30,
      ),
      archives: "unknown",
    },
    defenseProfile: {
      tag: stats.functionSignalCounts["defense.tag_prevention"] ?? 0,
      trace: stats.functionSignalCounts["defense.trace_defense"] ?? 0,
      damage: stats.functionSignalCounts["defense.damage_prevention"] ?? 0,
      programTrash: programTrashCount > 0 ? programTrashCount : "unknown",
    },
  };
}

function buildCorpProfiles(stats: DeckStrategyStats, strategyScores: Record<string, DeckStrategyScore>): CorpDeckStrategyProfiles {
  const programTrashCount = legacyValueCount(stats, "program_trash");
  const regionSupport = stats.cards
    .filter(
      (card) =>
        card.cardType === "upgrade" &&
        (card.runtimeSubtypes.some((subtype) =>
          ["city grid", "region", "upgrade"].includes(subtype),
        ) ||
          card.cardId.includes("city-grid") ||
          card.remoteRoleKind !== undefined),
    )
    .reduce((sum, card) => sum + card.quantity, 0);
  const operationEconomy = cardsWithSignalsAndType(stats, "operation", [
    "economy.action",
    "economy.advanceable",
    "economy.burst",
    "economy.counter",
    "economy.finite_pool",
    "economy.generic",
    "economy.recurring",
    "economy.start_of_turn",
    "economy.trace_credit",
  ]);
  const assetEconomy = Math.max(
    stats.functionSignalCounts["remote.asset_economy"] ?? 0,
    cardsWithSignalsAndType(stats, "asset", [
      "economy.generic",
      "economy.recurring",
      "economy.start_of_turn",
      "economy.counter",
    ]),
  );
  return {
    iceProfile: {
      etr: stats.functionSignalCounts["ice.etr"] ?? 0,
      trace: cardsWithSignalsAndType(stats, "ice", ["trace.source"]),
      tag: cardsWithSignalsAndType(stats, "ice", ["tag.source"]),
      damage: cardsWithSignalsAndType(stats, "ice", ["damage.payoff"]),
      programTrash: programTrashCount > 0 ? programTrashCount : "unknown",
      futureEncounter: stats.functionSignalCounts["ice.future_pressure"] ?? 0,
      taxRunCost:
        (stats.functionSignalCounts["tax.ice"] ?? 0) +
        (stats.functionSignalCounts["tax.remote"] ?? 0) +
        (stats.functionSignalCounts["ice.etr"] ?? 0),
    },
    scoreProfile: {
      scoreAcceleration:
        (stats.functionSignalCounts["score.advance_burst"] ?? 0) +
        (stats.functionSignalCounts["score.agenda_action"] ?? 0),
      agendaInstallAdvanceScoreSupport:
        (stats.cardTypeCounts.agenda ?? 0) +
        Math.round((strategyScores["corp.fast_advance"]?.anchorScore ?? 0) / 30),
      remoteScoringProtection:
        (stats.functionSignalCounts["remote.scoring_protection"] ?? 0) +
        Math.round((strategyScores["corp.remote_scoring"]?.anchorScore ?? 0) / 30),
      stealTax: stats.functionSignalCounts["remote.agenda_steal_tax"] ?? 0,
    },
    economyProfile: {
      operationEconomy,
      assetEconomy,
      rezSupport: stats.functionSignalCounts["economy.rez_discount"] ?? 0,
      recurring: stats.functionSignalCounts["economy.recurring"] ?? 0,
      finite: stats.functionSignalCounts["economy.finite_pool"] ?? 0,
    },
    punishProfile: {
      tagSources: stats.functionSignalCounts["tag.source"] ?? 0,
      tagPayoff: stats.functionSignalCounts["tag.payoff"] ?? 0,
      damagePayoff: stats.functionSignalCounts["damage.payoff"] ?? 0,
      traceDensity: stats.functionSignalCounts["trace.source"] ?? 0,
    },
    remoteProfile: {
      scoringProtection: stats.functionSignalCounts["remote.scoring_protection"] ?? 0,
      ambush: stats.functionSignalCounts["remote.ambush"] ?? 0,
      assetEconomy,
      regionCityGridUpgradeSupport: regionSupport > 0 ? regionSupport : "unknown",
    },
  };
}

function deckWarnings(stats: DeckStrategyStats): string[] {
  const warnings = new Set<string>();
  for (const card of stats.cards) {
    const hint = COMPILED_HINTS_BY_CARD.get(card.cardId);
    const inspector = INSPECTOR_BY_CARD.get(card.cardId);
    if (!hint) warnings.add(`missing_compiled_hint:${card.cardId}`);
    if (!inspector) warnings.add(`missing_inspector_index:${card.cardId}`);
    if (hint?.side && hint.side !== stats.side) {
      warnings.add(`side_mismatch:${card.cardId}:${hint.side}`);
    }
    for (const category of card.warningCategories) {
      warnings.add(`inspector:${category}`);
    }
  }
  return [...warnings].sort();
}

function supportCountScore(count: number, fullSupportCount: number): number {
  if (count <= 0) return 0;
  return clampRound((count / Math.max(1, fullSupportCount)) * 100, 0, 100);
}

function strategyMatchesSide(strategyId: string, side: Side): boolean {
  const goal = STRATEGY_GOALS_BY_ID.get(strategyId);
  return goal?.side === side;
}

function pushEvidence(
  byStrategy: Map<string, DeckStrategyEvidence[]>,
  strategyId: string,
  evidence: DeckStrategyEvidence,
): void {
  const current = byStrategy.get(strategyId) ?? [];
  current.push(evidence);
  byStrategy.set(strategyId, current);
}

function coverageBucket(count: number, searchCount: number): CoverageBucket {
  return {
    count,
    searchable: count > 0 ? searchCount > 0 : "unknown",
  };
}

function riskyEconomyCount(stats: DeckStrategyStats): number | "unknown" {
  const risky = stats.cards
    .filter(
      (card) =>
        card.functionSignals.some((signal) => signal.startsWith("economy.")) &&
        (card.riskTags.includes("tag_self") ||
          card.costProfileReserveRisk === "high" ||
          card.effects.some((effect) => effect.kind === "forgo_actions")),
    )
    .reduce((sum, card) => sum + card.quantity, 0);
  return risky > 0 ? risky : "unknown";
}

function cardsWithSignalsAndType(
  stats: DeckStrategyStats,
  cardType: string,
  signals: string[],
): number {
  const signalSet = new Set(signals);
  return stats.cards
    .filter(
      (card) =>
        card.cardType === cardType &&
        card.functionSignals.some((signal) => signalSet.has(signal)),
    )
    .reduce((sum, card) => sum + card.quantity, 0);
}

function legacyValueCount(stats: DeckStrategyStats, value: string): number {
  return Object.entries(stats.legacySignalCounts).reduce(
    (sum, [key, count]) => (key.endsWith(`:${value}`) ? sum + count : sum),
    0,
  );
}

function increment(
  record: Record<string, number>,
  key: string,
  amount: number,
): void {
  record[key] = (record[key] ?? 0) + amount;
}

function sortedEvidence(evidence: DeckStrategyEvidence[]): DeckStrategyEvidence[] {
  return sortedUniqueObjects(
    evidence,
    (entry) =>
      `${entry.cardId}:${entry.quantity}:${entry.source}:${entry.signal ?? ""}:${entry.strategyId ?? ""}:${entry.role ?? ""}`,
  ).sort(
    (left, right) =>
      left.cardId.localeCompare(right.cardId) ||
      left.source.localeCompare(right.source) ||
      (left.signal ?? "").localeCompare(right.signal ?? "") ||
      (left.strategyId ?? "").localeCompare(right.strategyId ?? ""),
  );
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function sortedUniqueObjects<T>(values: T[], keyFor: (value: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const value of values) {
    const key = keyFor(value);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function sortRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function clampRound(value: number, min: number, max: number): number {
  return Math.round(Math.max(min, Math.min(max, value)));
}

function removeUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}
