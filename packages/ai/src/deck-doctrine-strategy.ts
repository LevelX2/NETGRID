import type { Side } from "@netgrid/shared";
import activeAiHintsData from "../../../data/ai/ai-card-hints-active.json";
import strategyGoalsData from "../../../data/ai/strategy-goals-v1.json";
import { RUNTIME_CARDS } from "./ai-hints";
import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";
import {
  buildRunnerDeckEngineDoctrine,
  type RunnerDeckEngineDoctrine,
} from "./runner-deck-engine-doctrine";

export type DeckStrategyConfidence = "low" | "medium" | "high";

export type DeckStrategyEvidence = {
  cardId: string;
  quantity: number;
  source:
    | "cardHint"
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
  runtimeStatus?: DeckStrategyRuntimeStatus;
  runtimeBlockers?: string[];
};

export type DeckStrategyRuntimeStatus =
  | "productive"
  | "supporting"
  | "blocked"
  | "diagnostic_only";

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

export type DeckStrategyMetadataConsumerMode =
  | "productive_and_diagnostic"
  | "diagnostic_only";

export const DECK_STRATEGY_METADATA_CONSUMER_CONTRACT = {
  strategyScores: {
    mode: "productive_and_diagnostic",
    consumers: ["StrategicIntentState", "AI007 strategy viewer"],
  },
  primaryStrategies: {
    mode: "productive_and_diagnostic",
    consumers: ["StrategicRuntimeContext", "AI007 strategy viewer"],
  },
  secondaryStrategies: {
    mode: "productive_and_diagnostic",
    consumers: ["StrategicRuntimeContext", "AI007 strategy viewer"],
  },
  functionSignalCounts: {
    mode: "productive_and_diagnostic",
    consumers: ["RunnerStrategicIntent", "AI007 strategy viewer"],
  },
  legacySignalCounts: {
    mode: "diagnostic_only",
    consumers: ["AI007 legacy signal groups", "AI006 invariant check"],
  },
  "runnerProfile.coverageProfile": {
    mode: "diagnostic_only",
    consumers: ["AI007 Runner profile viewer"],
  },
  "runnerProfile.economyProfile": {
    mode: "diagnostic_only",
    consumers: ["AI007 Runner profile viewer"],
  },
  "runnerProfile.setupProfile": {
    mode: "diagnostic_only",
    consumers: ["AI007 Runner profile viewer"],
  },
  "runnerProfile.pressureProfile": {
    mode: "diagnostic_only",
    consumers: ["AI007 Runner profile viewer"],
  },
  "runnerProfile.defenseProfile": {
    mode: "diagnostic_only",
    consumers: ["AI007 Runner profile viewer"],
  },
  runnerEngineDoctrine: {
    mode: "productive_and_diagnostic",
    consumers: [
      "RunnerStrategicIntent",
      "RunnerPlanModules",
      "AI007 strategy viewer",
    ],
  },
  "corpProfile.iceProfile": {
    mode: "diagnostic_only",
    consumers: ["AI007 Corp profile viewer"],
  },
  "corpProfile.scoreProfile": {
    mode: "diagnostic_only",
    consumers: ["AI007 Corp profile viewer"],
  },
  "corpProfile.economyProfile": {
    mode: "productive_and_diagnostic",
    consumers: ["CorpStrategicIntent", "AI007 Corp profile viewer"],
  },
  "corpProfile.punishProfile": {
    mode: "productive_and_diagnostic",
    consumers: ["CorpStrategicIntent", "StrategicRuntimeContext"],
  },
  "corpProfile.remoteProfile": {
    mode: "diagnostic_only",
    consumers: ["AI007 Corp profile viewer"],
  },
  warnings: {
    mode: "diagnostic_only",
    consumers: ["AI007 warning viewer", "DeckDoctrine v2 diagnostic"],
  },
} as const satisfies Record<
  string,
  {
    mode: DeckStrategyMetadataConsumerMode;
    consumers: readonly string[];
  }
>;

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
  runnerEngineDoctrine?: RunnerDeckEngineDoctrine;
  corpProfile?: CorpDeckStrategyProfiles;
  source: {
    mode: "ai_internal_strategy_profile";
    strategyGoals: "data/ai/strategy-goals-v1.json";
    activeHints: "data/ai/ai-card-hints-active.json";
    plannerEffect: "strategic_intent_input";
  };
};

export type DeckDoctrineV2DiagnosticStatus =
  | "anchorless"
  | "partial"
  | "complete"
  | "unknown_snapshot";

export type DeckDoctrineV2CardRoleDiagnosticStatus =
  | "anchorless"
  | "partial"
  | "complete";

export type DeckDoctrineV2CardRoleDiagnostic = {
  cardId: string;
  quantity: number;
  status: DeckDoctrineV2CardRoleDiagnosticStatus;
  roles: string[];
  functionSignals: string[];
  strategyAnchors: string[];
  warnings: string[];
};

export type DeckDoctrineV2RoleDiagnosticSummary = {
  status: DeckDoctrineV2DiagnosticStatus;
  cardCount: number;
  cardRows: number;
  completeCards: number;
  partialCards: number;
  anchorlessCards: number;
  cardsWithoutRoles: string[];
  roleSignalCount: number;
  functionSignalCount: number;
  strategyAnchorCount: number;
};

export type DeckDoctrineV2StrategyDiagnostic = {
  strategyId: string;
  status: Exclude<DeckDoctrineV2DiagnosticStatus, "unknown_snapshot">;
  anchorScore: number;
  supportScore: number;
  finalScore: number;
  confidence: DeckStrategyConfidence;
  anchorEvidenceCount: number;
  supportEvidenceCount: number;
  supportGaps: string[];
};

export type DeckDoctrineV2Diagnostic = {
  schemaVersion: "deck-doctrine-v2-diagnostic-v1";
  scope: "diagnostic_only";
  productiveUseAllowed: false;
  deckSnapshotId: string;
  side: Side | "unknown";
  status: DeckDoctrineV2DiagnosticStatus;
  neutralDoctrine: boolean;
  strategyDiagnostics: DeckDoctrineV2StrategyDiagnostic[];
  rolesStatus: DeckDoctrineV2RoleDiagnosticSummary;
  cardRoles: DeckDoctrineV2CardRoleDiagnostic[];
  warnings: string[];
  source: {
    strategyProfile: "buildDeckStrategyProfile";
    mode: "report_only";
    plannerEffect: "none";
  };
  noEffectFlags: {
    actionSelection: false;
    plannerWeights: false;
    scoring: false;
    legalActionGeneration: false;
    engineMutation: false;
    hiddenInfoProjection: false;
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

type AiCardHint = {
  cardId: string;
  side: Side;
  cardType?: string;
  roles?: string[];
  planRoles?: string[];
  lineSupport?: string[];
  strategicRole?: string[];
  functionSignals?: string[];
  tacticSignals?: string[];
  strategyAnchors?: string[];
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

type RuntimeCardForStrategy = {
  side?: Side;
  type?: string;
  numeric?: {
    cost?: number | null;
    rezCost?: number | null;
    advancementRequirement?: number | null;
    agendaPoints?: number | null;
  };
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

const STRATEGY_GOALS = (
  strategyGoalsData.strategyGoals as StrategyGoal[]
).slice();
const STRATEGY_GOALS_BY_ID = new Map(
  STRATEGY_GOALS.map((goal) => [goal.strategyId, goal]),
);
const AI_HINTS_BY_CARD = new Map(
  (activeAiHintsData.cards as AiCardHint[]).map((hint) => [hint.cardId, hint]),
);
const ANCHOR_STRATEGIC_ROLES = new Set([
  "engine_anchor",
  "payoff_anchor",
  "punish_payoff",
  "scoring_tool",
  "tax_tool",
  "win_condition",
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
const CONDITIONAL_GENERAL_ACCESS_SIGNAL_IDS = new Set([
  "run.bypass_chosen_ice",
  "run.bypass_first_ice",
]);
const SUPPORT_ONLY_STRATEGY_IDS = new Set([
  "runner.economy_first",
  "runner.survival_defense",
  "corp.economy_rez_reserve",
  "corp.central_stabilize",
]);
const HARD_PRODUCTIVE_GAPS = new Set([
  "missing_wall_coverage",
  "missing_code_gate_coverage",
  "weak_sentry_coverage",
  "weak_breaker_coverage",
  "low_economy_support",
  "low_rez_economy",
  "insufficient_etr_ice",
  "weak_remote_protection",
  "low_tag_sources",
  "payoff_without_enablers",
  "low_punish_payoff_density",
  "missing_tempo_source",
  "missing_advancement_window",
  "missing_draw_source",
  "missing_recycle_source",
  "missing_draw_or_shuffle",
]);

export function isHardProductiveSupportGap(gap: string): boolean {
  return HARD_PRODUCTIVE_GAPS.has(gap);
}

export function buildDeckStrategyProfile(
  snapshot: AiDeckStrategyDeckSnapshot,
): AiDeckStrategyProfile {
  const stats = deckStrategyStats(snapshot);
  const anchorEvidenceByStrategy = collectAnchorEvidence(stats);
  const strategyScores: Record<string, DeckStrategyScore> = {};
  for (const goal of STRATEGY_GOALS.filter(
    (entry) => entry.side === snapshot.side,
  ).sort((left, right) => left.strategyId.localeCompare(right.strategyId))) {
    const anchorEvidence = sortedEvidence(
      anchorEvidenceByStrategy.get(goal.strategyId) ?? [],
    );
    const anchorScore = scoreAnchors(anchorEvidence);
    const support = scoreSupport(goal, stats, anchorEvidence);
    const finalScore = adjustCorpWinConditionScore(
      goal,
      stats,
      scoreFinal(goal, anchorScore, support.score),
    );
    const runtimeReadiness = strategyRuntimeReadiness(
      goal,
      stats,
      anchorScore,
      support.score,
      finalScore,
      support.gaps,
      anchorEvidence,
    );
    strategyScores[goal.strategyId] = {
      anchorScore,
      supportScore: support.score,
      finalScore,
      anchorEvidence,
      supportEvidence: support.evidence,
      supportGaps: support.gaps,
      confidence: confidenceFor(anchorScore, support.score, finalScore),
      runtimeStatus: runtimeReadiness.status,
      runtimeBlockers: runtimeReadiness.blockers,
    };
  }

  const rankedStrategies = Object.entries(strategyScores).sort(
    compareDeckStrategyRanking,
  );
  const primaryStrategies = selectRankedStrategyIdsWithCutoffTies(
    rankedStrategies.filter(
      ([, score]) =>
        score.finalScore >= 45 && score.runtimeStatus === "productive",
    ),
    3,
  );
  const primaryStrategySet = new Set(primaryStrategies);
  const secondaryStrategies = selectRankedStrategyIdsWithCutoffTies(
    rankedStrategies.filter(
      ([strategyId, score]) =>
        score.finalScore >= 30 &&
        score.runtimeStatus === "productive" &&
        !primaryStrategySet.has(strategyId),
    ),
    5,
  );

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
      ? {
          runnerProfile: buildRunnerProfiles(stats, strategyScores),
          runnerEngineDoctrine: buildRunnerDeckEngineDoctrine(snapshot)!,
        }
      : { corpProfile: buildCorpProfiles(stats, strategyScores) }),
    source: {
      mode: "ai_internal_strategy_profile",
      strategyGoals: "data/ai/strategy-goals-v1.json",
      activeHints: "data/ai/ai-card-hints-active.json",
      plannerEffect: "strategic_intent_input",
    },
  });
}

export function buildNeutralDeckStrategyProfile(
  side: Side,
  deckId = `${side}:missing-deck-snapshot`,
  warnings: readonly string[] = [
    "deck_context:missing_explicit_neutral",
    "strategy_profile:neutral_missing_snapshot",
  ],
): AiDeckStrategyProfile {
  return {
    schemaVersion: "ai-deck-strategy-profile-v1",
    taskId: "AI006",
    deckId,
    side,
    cardCount: 0,
    strategyScores: {},
    primaryStrategies: [],
    secondaryStrategies: [],
    functionSignalCounts: {},
    legacySignalCounts: {},
    warnings: [...warnings],
    source: {
      mode: "ai_internal_strategy_profile",
      strategyGoals: "data/ai/strategy-goals-v1.json",
      activeHints: "data/ai/ai-card-hints-active.json",
      plannerEffect: "strategic_intent_input",
    },
  };
}

export function buildDeckDoctrineV2Diagnostic(
  snapshot?: AiDeckStrategyDeckSnapshot,
): DeckDoctrineV2Diagnostic {
  if (snapshot === undefined || snapshot.cards.length === 0) {
    return {
      schemaVersion: "deck-doctrine-v2-diagnostic-v1",
      scope: "diagnostic_only",
      productiveUseAllowed: false,
      deckSnapshotId: snapshot?.deckSnapshotId ?? "unknown_snapshot",
      side: snapshot?.side ?? "unknown",
      status: "unknown_snapshot",
      neutralDoctrine: true,
      strategyDiagnostics: [],
      rolesStatus: emptyRoleDiagnosticSummary("unknown_snapshot"),
      cardRoles: [],
      warnings: ["unknown_snapshot"],
      source: {
        strategyProfile: "buildDeckStrategyProfile",
        mode: "report_only",
        plannerEffect: "none",
      },
      noEffectFlags: deckDoctrineV2NoEffectFlags(),
    };
  }

  const strategyProfile = buildDeckStrategyProfile(snapshot);
  const cardRoles = deckDoctrineV2CardRoles(snapshot);
  const rolesStatus = summarizeDeckDoctrineV2Roles(
    strategyProfile.cardCount,
    cardRoles,
  );
  const strategyDiagnostics = Object.entries(strategyProfile.strategyScores)
    .map(([strategyId, score]) => ({
      strategyId,
      status: deckDoctrineV2StrategyStatus(score),
      anchorScore: score.anchorScore,
      supportScore: score.supportScore,
      finalScore: score.finalScore,
      confidence: score.confidence,
      anchorEvidenceCount: score.anchorEvidence.length,
      supportEvidenceCount: score.supportEvidence.length,
      supportGaps: [...score.supportGaps],
    }))
    .sort(
      (left, right) =>
        right.finalScore - left.finalScore ||
        left.strategyId.localeCompare(right.strategyId),
    );
  const status = deckDoctrineV2Status(strategyDiagnostics, rolesStatus);

  return {
    schemaVersion: "deck-doctrine-v2-diagnostic-v1",
    scope: "diagnostic_only",
    productiveUseAllowed: false,
    deckSnapshotId: snapshot.deckSnapshotId,
    side: snapshot.side,
    status,
    neutralDoctrine: status === "anchorless",
    strategyDiagnostics,
    rolesStatus,
    cardRoles,
    warnings: sortedUnique([
      ...strategyProfile.warnings,
      ...(status === "anchorless"
        ? ["NeutralDoctrine: no strategy anchor"]
        : []),
    ]),
    source: {
      strategyProfile: "buildDeckStrategyProfile",
      mode: "report_only",
      plannerEffect: "none",
    },
    noEffectFlags: deckDoctrineV2NoEffectFlags(),
  };
}

function deckStrategyStats(
  snapshot: AiDeckStrategyDeckSnapshot,
): DeckStrategyStats {
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
    const hint = AI_HINTS_BY_CARD.get(entry.cardId);
    const runtimeCard = RUNTIME_CARDS[entry.cardId] as
      | RuntimeCardForStrategy
      | undefined;
    const cardType = hint?.cardType ?? runtimeCard?.type;
    const functionSignals = sortedUnique(hint?.functionSignals ?? []);
    const derivedStrategyAnchors = sortedUnique(
      (hint?.strategyAnchors ?? []).filter((strategyId) =>
        strategyMatchesSide(strategyId, snapshot.side),
      ),
    );
    const roles = sortedUnique(hint?.roles ?? []);
    const planRoles = sortedUnique(hint?.planRoles ?? []);
    const lineSupport = sortedUnique(hint?.lineSupport ?? []);
    const strategicRoles = sortedUnique(hint?.strategicRole ?? []);
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
    for (const role of roles)
      increment(legacySignalCounts, `role:${role}`, quantity);
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
        side: hint?.side ?? snapshot.side,
        ...(cardType ? { cardType } : {}),
        functionSignals,
        derivedStrategyAnchors,
        roles,
        planRoles,
        lineSupport,
        strategicRoles,
        requiredMechanics: sortedUnique(hint?.requiredMechanics ?? []),
        riskTags: sortedUnique(hint?.riskTags ?? []),
        accessBreakerCoverageBlocked,
        effects: hint?.effects ?? [],
        ...(hint?.remoteRole?.kind
          ? { remoteRoleKind: hint.remoteRole.kind }
          : {}),
        ...(hint?.costProfile?.reserveRisk
          ? { costProfileReserveRisk: hint.costProfile.reserveRisk }
          : {}),
        runtimeSubtypes: sortedUnique(runtimeCard?.subtypes ?? []),
        ...(typeof runtimeCard?.numeric?.rezCost === "number"
          ? { runtimeCost: runtimeCard.numeric.rezCost }
          : typeof runtimeCard?.numeric?.cost === "number"
            ? { runtimeCost: runtimeCard.numeric.cost }
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

function deckDoctrineV2CardRoles(
  snapshot: AiDeckStrategyDeckSnapshot,
): DeckDoctrineV2CardRoleDiagnostic[] {
  return snapshot.cards
    .slice()
    .sort((left, right) => left.cardId.localeCompare(right.cardId))
    .filter((entry) => Math.max(0, entry.quantity) > 0)
    .map((entry) => {
      const hint = AI_HINTS_BY_CARD.get(entry.cardId);
      const roles = sortedUnique([
        ...(hint?.roles ?? []),
        ...(hint?.planRoles ?? []),
        ...(hint?.lineSupport ?? []),
        ...(hint?.strategicRole ?? []),
      ]);
      const functionSignals = sortedUnique(hint?.functionSignals ?? []);
      const strategyAnchors = sortedUnique([
        ...(hint?.strategyAnchors ?? []).filter((strategyId) =>
          strategyMatchesSide(strategyId, snapshot.side),
        ),
        ...(hint?.lineSupport ?? []).filter((strategyId) =>
          strategyMatchesSide(strategyId, snapshot.side),
        ),
      ]);
      const status =
        roles.length > 0 &&
        functionSignals.length > 0 &&
        strategyAnchors.length > 0
          ? "complete"
          : roles.length > 0 ||
              functionSignals.length > 0 ||
              strategyAnchors.length > 0
            ? "partial"
            : "anchorless";

      return {
        cardId: entry.cardId,
        quantity: Math.max(0, entry.quantity),
        status,
        roles,
        functionSignals,
        strategyAnchors,
        warnings: sortedUnique([
          ...(hint === undefined ? ["missing_card_hint"] : []),
        ]),
      };
    });
}

function summarizeDeckDoctrineV2Roles(
  cardCount: number,
  cardRoles: readonly DeckDoctrineV2CardRoleDiagnostic[],
): DeckDoctrineV2RoleDiagnosticSummary {
  if (cardRoles.length === 0)
    return emptyRoleDiagnosticSummary("unknown_snapshot");

  const completeCards = cardRoles.filter(
    (entry) => entry.status === "complete",
  ).length;
  const partialCards = cardRoles.filter(
    (entry) => entry.status === "partial",
  ).length;
  const anchorlessCards = cardRoles.filter(
    (entry) => entry.status === "anchorless",
  ).length;
  const cardsWithoutRoles = cardRoles
    .filter((entry) => entry.roles.length === 0)
    .map((entry) => entry.cardId);
  const strategyAnchorCount = cardRoles.reduce(
    (sum, entry) => sum + entry.strategyAnchors.length * entry.quantity,
    0,
  );
  const status =
    strategyAnchorCount === 0
      ? "anchorless"
      : anchorlessCards === 0 && partialCards === 0
        ? "complete"
        : "partial";

  return {
    status,
    cardCount,
    cardRows: cardRoles.length,
    completeCards,
    partialCards,
    anchorlessCards,
    cardsWithoutRoles,
    roleSignalCount: cardRoles.reduce(
      (sum, entry) => sum + entry.roles.length * entry.quantity,
      0,
    ),
    functionSignalCount: cardRoles.reduce(
      (sum, entry) => sum + entry.functionSignals.length * entry.quantity,
      0,
    ),
    strategyAnchorCount,
  };
}

function emptyRoleDiagnosticSummary(
  status: DeckDoctrineV2DiagnosticStatus,
): DeckDoctrineV2RoleDiagnosticSummary {
  return {
    status,
    cardCount: 0,
    cardRows: 0,
    completeCards: 0,
    partialCards: 0,
    anchorlessCards: 0,
    cardsWithoutRoles: [],
    roleSignalCount: 0,
    functionSignalCount: 0,
    strategyAnchorCount: 0,
  };
}

function deckDoctrineV2StrategyStatus(
  score: DeckStrategyScore,
): DeckDoctrineV2StrategyDiagnostic["status"] {
  if (score.anchorEvidence.length === 0 && score.anchorScore === 0) {
    return "anchorless";
  }
  if (
    score.supportGaps.length === 0 &&
    score.anchorEvidence.length > 0 &&
    score.finalScore >= 45
  ) {
    return "complete";
  }
  return "partial";
}

function deckDoctrineV2Status(
  strategyDiagnostics: readonly DeckDoctrineV2StrategyDiagnostic[],
  rolesStatus: DeckDoctrineV2RoleDiagnosticSummary,
): DeckDoctrineV2DiagnosticStatus {
  if (rolesStatus.status === "unknown_snapshot") return "unknown_snapshot";
  if (
    strategyDiagnostics.every((entry) => entry.status === "anchorless") ||
    rolesStatus.strategyAnchorCount === 0
  ) {
    return "anchorless";
  }
  if (
    rolesStatus.status === "complete" &&
    strategyDiagnostics.some((entry) => entry.status === "complete")
  ) {
    return "complete";
  }
  return "partial";
}

function deckDoctrineV2NoEffectFlags(): DeckDoctrineV2Diagnostic["noEffectFlags"] {
  return {
    actionSelection: false,
    plannerWeights: false,
    scoring: false,
    legalActionGeneration: false,
    engineMutation: false,
    hiddenInfoProjection: false,
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
      (card.derivedStrategyAnchors.length > 0 ||
        lineSupportStrategies.length > 0)
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
  const anchors: Array<{ strategyId: string; value: string; reason: string }> =
    [];
  for (const value of card.lineSupport) {
    if (!strategyMatchesSide(value, side)) continue;
    if (!lineSupportAnchorAllowed(card, value)) continue;
    anchors.push({
      strategyId: value,
      value,
      reason: "card_hint_lineSupport_strategy_goal",
    });
  }
  return sortedUniqueObjects(
    anchors,
    (entry) => `${entry.strategyId}:${entry.value}`,
  );
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
  const evidenceByCard = new Map<string, DeckStrategyEvidence[]>();
  for (const entry of evidence) {
    const entries = evidenceByCard.get(entry.cardId) ?? [];
    entries.push(entry);
    evidenceByCard.set(entry.cardId, entries);
  }
  const points = [...evidenceByCard.values()].reduce((sum, entries) => {
    const strongestBase = Math.max(
      ...entries.map((entry) => anchorEvidenceBase(entry.source)),
    );
    const quantity = Math.max(...entries.map((entry) => entry.quantity));
    const distinctSources = new Set(entries.map((entry) => entry.source)).size;
    const provenanceReinforcement = Math.min(12, (distinctSources - 1) * 6);
    return (
      sum +
      (strongestBase + provenanceReinforcement) *
        diminishingCopyWeight(quantity)
    );
  }, 0);
  if (points <= 0) return 0;
  return clampRound((points / (points + 55)) * 100, 0, 100);
}

function anchorEvidenceBase(source: DeckStrategyEvidence["source"]): number {
  switch (source) {
    case "derivedStrategyAnchor":
      return 32;
    case "lineSupport":
      return 28;
    case "strategicRole":
      return 12;
    default:
      return 0;
  }
}

function diminishingCopyWeight(quantity: number): number {
  let weight = 0;
  for (let copy = 0; copy < Math.max(0, quantity); copy += 1) {
    weight += Math.pow(0.55, copy);
  }
  return weight;
}

function strategyEvidenceDiversity(score: DeckStrategyScore): number {
  const anchorCards = new Set(
    score.anchorEvidence.map((evidence) => evidence.cardId),
  ).size;
  const anchorSources = new Set(
    score.anchorEvidence.map((evidence) => evidence.source),
  ).size;
  const supportCards = new Set(
    score.supportEvidence.map((evidence) => evidence.cardId),
  ).size;
  return anchorCards * 4 + anchorSources * 2 + supportCards;
}

export function compareDeckStrategyRanking(
  left: readonly [string, DeckStrategyScore],
  right: readonly [string, DeckStrategyScore],
): number {
  return (
    right[1].finalScore - left[1].finalScore ||
    right[1].anchorScore - left[1].anchorScore ||
    strategyEvidenceDiversity(right[1]) - strategyEvidenceDiversity(left[1]) ||
    left[0].localeCompare(right[0])
  );
}

export function selectRankedStrategyIdsWithCutoffTies(
  rankedStrategies: ReadonlyArray<readonly [string, DeckStrategyScore]>,
  nominalLimit: number,
): string[] {
  if (nominalLimit <= 0 || rankedStrategies.length === 0) return [];
  if (rankedStrategies.length <= nominalLimit) {
    return rankedStrategies.map(([strategyId]) => strategyId);
  }
  const cutoff = rankedStrategies[nominalLimit - 1]?.[1];
  if (!cutoff) return [];
  const cutoffDiversity = strategyEvidenceDiversity(cutoff);
  return rankedStrategies
    .filter(([, score], index) => {
      if (index < nominalLimit) return true;
      return (
        score.finalScore === cutoff.finalScore &&
        score.anchorScore === cutoff.anchorScore &&
        strategyEvidenceDiversity(score) === cutoffDiversity
      );
    })
    .map(([strategyId]) => strategyId);
}

function adjustCorpWinConditionScore(
  goal: StrategyGoal,
  stats: DeckStrategyStats,
  score: number,
): number {
  if (stats.side !== "corp" || goal.strategyId !== "corp.fast_advance") {
    return score;
  }
  const agendaCount = stats.cardTypeCounts.agenda ?? 0;
  const agendaDensity = agendaCount / Math.max(1, stats.cardCount);
  const tagSources = stats.functionSignalCounts["tag.source"] ?? 0;
  const damagePayoffs = stats.functionSignalCounts["damage.payoff"] ?? 0;
  const completeKillLineDepth = Math.min(tagSources, damagePayoffs);
  if (
    agendaDensity > 0.12 ||
    tagSources < 2 ||
    damagePayoffs < 2 ||
    completeKillLineDepth <= agendaCount
  ) {
    return score;
  }
  const densityPressure = Math.round((0.12 - agendaDensity) * 100);
  const lineDepthPressure = Math.min(
    12,
    (completeKillLineDepth - agendaCount) * 2,
  );
  return clampRound(
    score - Math.min(24, 8 + densityPressure + lineDepthPressure),
    0,
    100,
  );
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
    const component = supportComponentScore(
      dimension,
      goal,
      stats,
      anchorEvidence,
    );
    weightedScore += component.score * weight;
    weightTotal += weight;
    evidence.push(...component.evidence);
    gaps.push(
      ...supportGapsForDimension(dimension, component.score, goal, stats),
    );
  }
  return {
    score: clampRound(weightedScore / Math.max(0.001, weightTotal), 0, 100),
    evidence: sortedEvidence(evidence).slice(0, 48),
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
      return evidenceFromSignals(
        stats,
        dimension,
        ["remote.ambush", "access.punish"],
        2,
      );
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
        [
          "access.rnd_multiaccess",
          "access.hq_multiaccess",
          "info.rnd_topdeck",
          "info.hq",
        ],
        2,
      );
    case "centralDefense":
      return centralDefenseSupport(stats, dimension);
    case "damageOrTagPayoff":
      return evidenceFromSignals(
        stats,
        dimension,
        ["damage.payoff", "tag.payoff"],
        2,
      );
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
      return evidenceFromSignals(
        stats,
        dimension,
        ["tag.payoff", "damage.payoff"],
        2,
      );
    case "remoteAccess":
      return evidenceFromSignals(
        stats,
        dimension,
        [
          "economy.trash_credit",
          "access.rnd_multiaccess",
          "access.hq_multiaccess",
        ],
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
        [
          "remote.asset_economy",
          "remote.scoring_protection",
          "remote.bait",
          "remote.ambush",
        ],
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
      return evidenceFromSignals(
        stats,
        dimension,
        ["tag.source", "trace.source"],
        2,
      );
    case "tagSource":
      return evidenceFromSignals(stats, dimension, ["tag.source"], 2);
    case "tempoSource":
      return evidenceFromSignals(
        stats,
        dimension,
        [
          "action.corp_counter_to_extra_action",
          "action.corp_extra_action",
          "action.corp_extra_action_burst",
          "action.corp_extra_action_support",
          "action.corp_future_extra_action",
          "action.corp_random_recurring_extra_action",
          "action.corp_recurring_extra_action",
          "action.corp_recurring_extra_action_limited",
          "action.corp_repeatable_extra_action",
          "tempo.corp_action_burst",
          "tempo.corp_install_burst",
          "tempo.corp_recurring_action",
        ],
        2,
      );
    case "boardSafety":
      return centralDefenseSupport(stats, dimension);
    case "advancementWindow":
      return evidenceFromSignals(
        stats,
        dimension,
        [
          "advance.overadvance_payoff",
          "score.overadvance_bonus",
          "score.overadvance_scaling",
          "score.advance_burst",
          "score.agenda_action",
        ],
        2,
      );
    case "remoteSafety":
      return evidenceFromSignals(
        stats,
        dimension,
        [
          "remote.scoring_protection",
          "remote.agenda_steal_tax",
          "tax.remote",
          "ice.etr",
        ],
        3,
      );
    case "drawSource":
      return evidenceFromSignals(
        stats,
        dimension,
        [
          "draw.corp_action_draw",
          "draw.corp_draw",
          "draw.corp_draw_action",
          "draw.corp_recurring",
          "draw.corp_recurring_optional",
          "score.recurring_draw",
        ],
        2,
      );
    case "safety":
      return centralDefenseSupport(stats, dimension);
    case "recycleSource":
      return evidenceFromSignals(
        stats,
        dimension,
        [
          "archives.corp_recovery",
          "archives.corp_recycle_to_rnd",
          "hq.corp_card_recovery",
          "hq.corp_hand_to_rnd_shuffle",
          "rnd.corp_shuffle_hq_into_rnd",
          "rnd.corp_shuffle_recycle",
        ],
        2,
      );
    case "drawOrShuffle":
      return evidenceFromSignals(
        stats,
        dimension,
        [
          "draw.corp_action_draw",
          "draw.corp_draw",
          "draw.corp_draw_action",
          "draw.corp_recurring",
          "draw.corp_recurring_optional",
          "hq.corp_hand_to_rnd_shuffle",
          "rnd.corp_agenda_shuffle_from_hq",
          "rnd.corp_self_shuffle_access",
          "rnd.corp_shuffle_hq_into_rnd",
          "rnd.corp_shuffle_recycle",
        ],
        2,
      );
    case "threatAssessment":
      return evidenceFromSignals(
        stats,
        dimension,
        ["info.expose", "info.hq", "info.rnd_topdeck"],
        1,
      );
    case "traceSupport":
      return evidenceFromSignals(
        stats,
        dimension,
        ["trace.source", "economy.trace_credit"],
        2,
      );
    default:
      throw new Error(
        `Unsupported deck strategy support dimension ${dimension} for ${goal.strategyId}`,
      );
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
    .filter((card) =>
      card.functionSignals.some((signal) => signalSet.has(signal)),
    )
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
      source: "cardHint" as const,
      signal: `cardType:${cardType}`,
      reason: `support:${dimension}`,
    }));
  return {
    score: supportCountScore(
      stats.cardTypeCounts[cardType] ?? 0,
      fullSupportCount,
    ),
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
  const signalSupport = evidenceFromSignals(
    stats,
    dimension,
    signalIds,
    fullSupportCount,
  );
  const typeSupport = evidenceFromCardType(
    stats,
    cardType,
    dimension,
    fullSupportCount,
  );
  return {
    score: Math.max(signalSupport.score, typeSupport.score),
    evidence: sortedEvidence([
      ...signalSupport.evidence,
      ...typeSupport.evidence,
    ]),
  };
}

function accessCapableSignalCount(
  stats: DeckStrategyStats,
  signalId: string,
): number {
  return stats.cards
    .filter((card) => !card.accessBreakerCoverageBlocked)
    .filter((card) => new Set(card.functionSignals).has(signalId))
    .reduce((sum, card) => sum + card.quantity, 0);
}

function breakerProfileBlocksAccessCoverage(
  profile: { sideEffects?: string[]; restrictions?: string[] } | undefined,
): boolean {
  if (!profile) return false;
  const sideEffects = new Set(profile.sideEffects ?? []);
  if (sideEffects.has("ends_run_after_use")) return true;
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
  const conditionalAccessCount = generalConditionalAccessCount(stats);
  const score =
    covered === 3
      ? 100
      : covered === 2 && conditionalAccessCount >= 2
        ? 82
        : covered === 2
          ? 72
          : covered === 1
            ? 38
            : 0;
  return {
    score,
    evidence: sortedEvidence(
      stats.cards.flatMap((card) => [
        ...(!card.accessBreakerCoverageBlocked
          ? card.functionSignals
              .filter((signal) => BREAKER_COVERAGE_SIGNAL_IDS.has(signal))
              .map((signal) => ({
                cardId: card.cardId,
                quantity: card.quantity,
                source: "functionSignal" as const,
                signal,
                reason: `support:${dimension}`,
              }))
          : []),
        ...card.functionSignals
          .filter((signal) => CONDITIONAL_GENERAL_ACCESS_SIGNAL_IDS.has(signal))
          .map((signal) => ({
            cardId: card.cardId,
            quantity: card.quantity,
            source: "functionSignal" as const,
            signal,
            reason: `support:${dimension}:conditional_access`,
          })),
      ]),
    ),
  };
}

function generalConditionalAccessCount(stats: DeckStrategyStats): number {
  return stats.cards.reduce(
    (sum, card) =>
      sum +
      (card.functionSignals.some((signal) =>
        CONDITIONAL_GENERAL_ACCESS_SIGNAL_IDS.has(signal),
      )
        ? card.quantity
        : 0),
    0,
  );
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
        source: "cardHint" as const,
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
    [
      "ice.etr",
      "ice.future_pressure",
      "tax.ice",
      "trace.source",
      "tag.source",
      "damage.payoff",
    ],
    4,
  );
  return {
    score: Math.max(typeSupport.score, signalSupport.score),
    evidence: sortedEvidence([
      ...typeSupport.evidence,
      ...signalSupport.evidence,
    ]),
  };
}

function memorySupport(
  stats: DeckStrategyStats,
  dimension: string,
): { score: number; evidence: DeckStrategyEvidence[] } {
  const cards = stats.cards.filter((card) => {
    const roles = new Set(card.roles);
    const requiredMechanics = new Set(card.requiredMechanics);
    return (
      roles.has("memory") ||
      requiredMechanics.has("memory") ||
      card.effects.some(
        (effect) => effect.kind === "memory" || effect.kind === "hand_size",
      )
    );
  });
  const count = cards.reduce((sum, card) => sum + card.quantity, 0);
  return {
    score: supportCountScore(count, 2),
    evidence: sortedEvidence(
      cards.map((card) => ({
        cardId: card.cardId,
        quantity: card.quantity,
        source: "cardHint" as const,
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
    [
      "access.rnd_multiaccess",
      "access.hq_multiaccess",
      "info.rnd_topdeck",
      "info.hq",
    ],
    2,
  );
  const score = Math.max(
    signalSupport.score,
    supportCountScore(
      anchorEvidence.reduce((sum, evidence) => sum + evidence.quantity, 0),
      2,
    ),
  );
  return {
    score,
    evidence: sortedEvidence([...signalSupport.evidence, ...anchorEvidence]),
  };
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
    evidence: sortedEvidence([
      ...signalSupport.evidence,
      ...remoteAnchorEvidence,
    ]),
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
  if (
    stats.side === "runner" &&
    dimension === "breakerCoverage" &&
    score < 100
  ) {
    return runnerGapsForDimension(dimension, stats);
  }
  const required = goal.requiredSupport?.[dimension] ?? "recommended";
  const threshold =
    required === "required" ? 45 : required === "recommended" ? 30 : 25;
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
      const missingCoverage = [
        {
          kind: "wall",
          missing:
            accessCapableSignalCount(stats, "breaker.wall") + universal === 0,
          hardGap: "missing_wall_coverage",
        },
        {
          kind: "code_gate",
          missing:
            accessCapableSignalCount(stats, "breaker.code_gate") + universal ===
            0,
          hardGap: "missing_code_gate_coverage",
        },
        {
          kind: "sentry",
          missing:
            accessCapableSignalCount(stats, "breaker.sentry") + universal === 0,
          hardGap: "weak_sentry_coverage",
        },
      ].filter((entry) => entry.missing);
      const conditionalBridgeAvailable =
        missingCoverage.length === 1 &&
        generalConditionalAccessCount(stats) >= 2;
      for (const missing of missingCoverage) {
        gaps.push(
          conditionalBridgeAvailable
            ? `conditional_${missing.kind}_access_path`
            : missing.hardGap,
        );
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
    case "tempoSource":
      return ["missing_tempo_source"];
    case "boardSafety":
      return ["low_board_safety_support"];
    case "advancementWindow":
      return ["missing_advancement_window"];
    case "remoteSafety":
      return ["low_remote_safety_support"];
    case "drawSource":
      return ["missing_draw_source"];
    case "safety":
      return ["low_engine_safety_support"];
    case "recycleSource":
      return ["missing_recycle_source"];
    case "drawOrShuffle":
      return ["missing_draw_or_shuffle"];
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
  return clampRound(
    anchorScore * weights.anchor + supportScore * weights.support,
    0,
    100,
  );
}

function strategyRuntimeReadiness(
  goal: StrategyGoal,
  stats: DeckStrategyStats,
  anchorScore: number,
  supportScore: number,
  finalScore: number,
  supportGaps: readonly string[],
  anchorEvidence: readonly DeckStrategyEvidence[],
): { status: DeckStrategyRuntimeStatus; blockers: string[] } {
  const blockers = strategyRuntimeBlockers(
    goal,
    stats,
    anchorScore,
    supportScore,
    finalScore,
    supportGaps,
    anchorEvidence,
  );
  if (blockers.some((blocker) => blocker.startsWith("supporting_only"))) {
    return { status: "supporting", blockers };
  }
  if (blockers.length > 0) {
    return {
      status:
        anchorScore > 0 || finalScore >= 30 ? "blocked" : "diagnostic_only",
      blockers,
    };
  }
  return { status: "productive", blockers: [] };
}

function strategyRuntimeBlockers(
  goal: StrategyGoal,
  stats: DeckStrategyStats,
  anchorScore: number,
  supportScore: number,
  finalScore: number,
  supportGaps: readonly string[],
  anchorEvidence: readonly DeckStrategyEvidence[],
): string[] {
  const blockers: string[] = [];
  const anchorCardIds = new Set(anchorEvidence.map((entry) => entry.cardId));
  const anchorCards = stats.cards.filter((card) =>
    anchorCardIds.has(card.cardId),
  );
  const anchorCopyCount = anchorCards.reduce(
    (sum, card) => sum + card.quantity,
    0,
  );
  if (
    anchorCards.length > 0 &&
    anchorCards.every((card) => card.cardType === "agenda") &&
    anchorCopyCount === 1 &&
    goal.strategyId !== "corp.remote_scoring" &&
    goal.strategyId !== "corp.rush_score"
  ) {
    blockers.push(
      "supporting_only:singleton_post_score_anchor_requires_score_conversion",
    );
  }
  if (finalScore < 45) blockers.push("below_productive_score_threshold");
  if (
    (goal.detectionMode === "engine_anchor" ||
      goal.detectionMode === "payoff_anchor") &&
    anchorEvidence.length === 0
  ) {
    blockers.push("missing_strategy_anchor");
  }
  if (
    SUPPORT_ONLY_STRATEGY_IDS.has(goal.strategyId) &&
    anchorEvidence.length === 0
  ) {
    blockers.push(`supporting_only:${goal.strategyId}`);
  }
  for (const gap of supportGaps) {
    if (isHardProductiveSupportGap(gap)) {
      blockers.push(`hard_support_gap:${gap}`);
    }
  }
  const supportGapSet = new Set(supportGaps);
  if (
    goal.strategyId === "corp.tag_trace_punish" &&
    (supportGapSet.has("low_tag_sources") ||
      supportGapSet.has("payoff_without_enablers") ||
      supportGapSet.has("low_punish_payoff_density"))
  ) {
    blockers.push("tag_punish_source_payoff_pair_incomplete");
  }
  if (
    goal.strategyId === "corp.damage_kill" &&
    supportGapSet.has("payoff_without_enablers")
  ) {
    blockers.push("damage_payoff_enabler_incomplete");
  }
  if (
    goal.detectionMode === "structural_density" &&
    anchorEvidence.length === 0 &&
    supportScore < 65
  ) {
    blockers.push("structural_density_too_weak_for_productive_line");
  }
  return sortedUnique(blockers);
}

function confidenceFor(
  anchorScore: number,
  supportScore: number,
  finalScore: number,
): DeckStrategyConfidence {
  if (finalScore >= 65 && (anchorScore >= 35 || supportScore >= 70))
    return "high";
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
        Math.round(
          (strategyScores["runner.rnd_pressure"]?.anchorScore ?? 0) / 30,
        ),
      hq:
        (stats.functionSignalCounts["access.hq_multiaccess"] ?? 0) +
        (stats.functionSignalCounts["info.hq"] ?? 0) +
        Math.round(
          (strategyScores["runner.hq_pressure"]?.anchorScore ?? 0) / 30,
        ),
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

function buildCorpProfiles(
  stats: DeckStrategyStats,
  strategyScores: Record<string, DeckStrategyScore>,
): CorpDeckStrategyProfiles {
  const programTrashCount = legacyValueCount(stats, "program_trash");
  const regionSupport = stats.cards
    .filter(
      (card) =>
        card.cardType === "upgrade" &&
        (card.runtimeSubtypes.some((subtype) =>
          ["city grid", "region", "upgrade"].includes(subtype),
        ) ||
          cardIdHasTokenPhrase(card.cardId, ["city", "grid"]) ||
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
        Math.round(
          (strategyScores["corp.fast_advance"]?.anchorScore ?? 0) / 30,
        ),
      remoteScoringProtection:
        (stats.functionSignalCounts["remote.scoring_protection"] ?? 0) +
        Math.round(
          (strategyScores["corp.remote_scoring"]?.anchorScore ?? 0) / 30,
        ),
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
      scoringProtection:
        stats.functionSignalCounts["remote.scoring_protection"] ?? 0,
      ambush: stats.functionSignalCounts["remote.ambush"] ?? 0,
      assetEconomy,
      regionCityGridUpgradeSupport:
        regionSupport > 0 ? regionSupport : "unknown",
    },
  };
}

function cardIdHasTokenPhrase(
  cardId: string,
  phrase: readonly string[],
): boolean {
  const tokens = cardId
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return tokens.some(
    (token, index) =>
      token === phrase[0] &&
      phrase.every(
        (phraseToken, offset) => tokens[index + offset] === phraseToken,
      ),
  );
}

function deckWarnings(stats: DeckStrategyStats): string[] {
  const warnings = new Set<string>();
  for (const card of stats.cards) {
    const hint = AI_HINTS_BY_CARD.get(card.cardId);
    if (!hint) warnings.add(`missing_card_hint:${card.cardId}`);
    if (hint?.side && hint.side !== stats.side) {
      warnings.add(`side_mismatch:${card.cardId}:${hint.side}`);
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
    .filter((card) => {
      const riskTags = new Set(card.riskTags);
      return (
        card.functionSignals.some((signal) => signal.startsWith("economy.")) &&
        (riskTags.has("tag_self") ||
          card.costProfileReserveRisk === "high" ||
          card.effects.some((effect) => effect.kind === "forgo_actions"))
      );
    })
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

function sortedEvidence(
  evidence: DeckStrategyEvidence[],
): DeckStrategyEvidence[] {
  return sortedUniqueObjects(
    evidence,
    (entry) =>
      `${entry.cardId}:${entry.quantity}:${entry.source}:${entry.signal ?? ""}:${entry.strategyId ?? ""}:${entry.role ?? ""}:${entry.reason}`,
  ).sort(
    (left, right) =>
      left.cardId.localeCompare(right.cardId) ||
      left.source.localeCompare(right.source) ||
      (left.signal ?? "").localeCompare(right.signal ?? "") ||
      (left.strategyId ?? "").localeCompare(right.strategyId ?? "") ||
      left.reason.localeCompare(right.reason),
  );
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function sortedUniqueObjects<T>(
  values: T[],
  keyFor: (value: T) => string,
): T[] {
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
