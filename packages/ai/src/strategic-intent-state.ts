import type { Side } from "@netgrid/shared";
import type {
  AiDeckStrategyProfile,
  DeckStrategyConfidence,
  DeckStrategyRuntimeStatus,
  DeckStrategyScore,
} from "./deck-doctrine-strategy";
import type { DeckCapabilityProfile } from "./deck-capabilities";
import { assertSemanticObjectSideSafe } from "./diagnostics/semantic-redaction";

export const STRATEGIC_INTENT_STATE_SCHEMA_VERSION =
  "strategic-intent-state-v1" as const;

export type StrategicIntentPhase =
  | "assemble"
  | "fund"
  | "enable"
  | "pressure"
  | "convert"
  | "closeout"
  | "recover";

export type StrategicRoleStatus =
  | "absent"
  | "in_deck_unseen"
  | "visible"
  | "installable"
  | "active"
  | "temporarily_unavailable"
  | "unknown";

export type StrategicIntentCompleteness =
  | "none"
  | "partial"
  | "complete";

export type StrategicIntentFamily =
  | "neutral"
  | "runner_setup"
  | "runner_central_pressure"
  | "runner_remote_contest"
  | "runner_remote_trash"
  | "runner_survival"
  | "runner_tempo"
  | "corp_scoreline"
  | "corp_fast_advance"
  | "corp_ice_tax"
  | "corp_central_defense"
  | "corp_asset_economy"
  | "corp_tag_trace_punish"
  | "corp_damage_kill"
  | "corp_ambush"
  | "corp_economy_reserve"
  | "unknown";

export type StrategicTargetVector = {
  kind:
    | "central"
    | "remote"
    | "scoreline"
    | "tag"
    | "damage"
    | "economy"
    | "coverage"
    | "survival"
    | "none";
  targetId?: string;
  evidence: string[];
};

export type StrategicLineState = {
  strategyId: string;
  family: StrategicIntentFamily;
  confidence: DeckStrategyConfidence;
  completeness: StrategicIntentCompleteness;
  score: {
    anchor: number;
    support: number;
    final: number;
  };
  supportGaps: string[];
  evidence: string[];
};

export type StrategicRoleStatusSnapshot = {
  roleId: string;
  status: StrategicRoleStatus;
  source: "deck" | "player_view" | "capability" | "memory" | "inferred";
  evidence: string[];
};

export type StrategicReserveRequirement = {
  kind: "credits" | "clicks" | "none";
  required: number;
  available?: number;
  satisfied: boolean;
  evidence: string[];
};

export type StrategicIntentBlocker = {
  blockerId: string;
  severity: "soft" | "hard";
  reason:
    | "no_strategy_anchor"
    | "support_gap"
    | "missing_role"
    | "reserve_shortfall"
    | "temporarily_unavailable"
    | "unknown_state";
  removalCondition: string;
  evidence: string[];
};

export type StrategicIntentTransition = {
  status: "selected" | "continued" | "paused" | "switched" | "abandoned";
  reason: string;
  previousStrategyId?: string;
  evidence: string[];
};

export type StrategicCommitmentState = {
  strategyId: string;
  decisionsCommitted: number;
  switchMargin: number;
  minCommitmentDecisions: number;
  evidence: string[];
};

export type StrategicStrategyPortfolioCandidate = {
  strategyId: string;
  family: StrategicIntentFamily;
  candidateRole: "primary" | "secondary" | "blocked";
  runtimeStatus: DeckStrategyRuntimeStatus | "legacy_unspecified" | "missing";
  runtimeBlockers: string[];
  confidence: DeckStrategyConfidence;
  score: {
    anchor: number;
    support: number;
    final: number;
  };
  selectionScore: number;
  roleStatuses: StrategicRoleStatusSnapshot[];
  targetVector: StrategicTargetVector;
  reserve: StrategicReserveRequirement;
  evidence: string[];
};

export type StrategicStrategyPortfolio = {
  activeStrategyId?: string;
  activeSelectionReason: string;
  productiveCandidates: StrategicStrategyPortfolioCandidate[];
  blockedCandidates: StrategicStrategyPortfolioCandidate[];
  evidence: string[];
};

export type StrategicIntentState = {
  schemaVersion: typeof STRATEGIC_INTENT_STATE_SCHEMA_VERSION;
  side: Side;
  stateVersion: number;
  source: {
    deckStrategyProfile: "ai_internal_strategy_profile" | "missing";
    deckCapabilities: "ai_internal" | "missing";
    plannerEffect: "goal_and_plan_input";
    actionGeneration: "none";
    hiddenInfoPolicy: "player_view_only";
  };
  primaryStrategy: StrategicLineState;
  secondaryStrategies: StrategicLineState[];
  phase: StrategicIntentPhase;
  roleStatuses: StrategicRoleStatusSnapshot[];
  targetVector: StrategicTargetVector;
  reserve: StrategicReserveRequirement;
  blockers: StrategicIntentBlocker[];
  transition: StrategicIntentTransition;
  commitment: StrategicCommitmentState;
  strategyPortfolio?: StrategicStrategyPortfolio;
  evidence: string[];
};

export type BuildStrategicIntentStateParams = {
  side: Side;
  stateVersion: number;
  strategyProfile?: AiDeckStrategyProfile;
  deckCapabilities?: DeckCapabilityProfile;
  previousState?: StrategicIntentState;
  availableCredits?: number;
  roleStatuses?: readonly StrategicRoleStatusSnapshot[];
  targetVector?: StrategicTargetVector;
  reserveRequirement?: StrategicReserveRequirement;
  preferredStrategyId?: string;
  strategyPortfolio?: StrategicStrategyPortfolio;
};

const DEFAULT_SWITCH_MARGIN = 12;
const DEFAULT_MIN_COMMITMENT_DECISIONS = 2;

const FAMILY_BY_STRATEGY_ID: Record<string, StrategicIntentFamily> = {
  "runner.rig_first": "runner_setup",
  "runner.economy_first": "runner_setup",
  "runner.search.breaker": "runner_setup",
  "runner.rnd_pressure": "runner_central_pressure",
  "runner.hq_pressure": "runner_central_pressure",
  "runner.interface_closeout": "runner_central_pressure",
  "runner.remote_contest": "runner_remote_contest",
  "runner.remote_trash": "runner_remote_trash",
  "runner.survival_defense": "runner_survival",
  "runner.run_event_tempo": "runner_tempo",
  "corp.remote_scoring": "corp_scoreline",
  "corp.rush_score": "corp_scoreline",
  "corp.fast_advance": "corp_fast_advance",
  "corp.ice_tax_glacier": "corp_ice_tax",
  "corp.central_stabilize": "corp_central_defense",
  "corp.asset_economy": "corp_asset_economy",
  "corp.tag_trace_punish": "corp_tag_trace_punish",
  "corp.damage_kill": "corp_damage_kill",
  "corp.ambush_bluff": "corp_ambush",
  "corp.economy_rez_reserve": "corp_economy_reserve",
};

// This contract is the strategic runtime layer between deck analysis and
// tactical goal/plan synthesis. It consumes side-safe deck profiles,
// capability facts and optional player-view role status; it produces no
// LegalActions and must be overruled by hard gates, terminal windows and
// concrete boardstate evaluation downstream.
export function buildStrategicIntentState(
  params: BuildStrategicIntentStateParams,
): StrategicIntentState {
  const candidatePrimaryStrategy = selectPrimaryStrategy(params);
  const commitmentSelection = committedPrimaryStrategy(
    params,
    candidatePrimaryStrategy,
  );
  const primaryStrategy = commitmentSelection.primaryStrategy;
  const secondaryStrategies = selectSecondaryStrategies(params, primaryStrategy);
  const portfolioCandidate = params.strategyPortfolio?.productiveCandidates.find(
    (candidate) => candidate.strategyId === primaryStrategy.strategyId,
  );
  const roleStatuses = sortedRoleStatuses(
    portfolioCandidate?.roleStatuses ?? params.roleStatuses ?? [],
  );
  const reserve =
    portfolioCandidate?.reserve ??
    params.reserveRequirement ??
    defaultReserveRequirement(
      primaryStrategy.family,
      params.availableCredits,
    );
  const blockers = buildBlockers(primaryStrategy, roleStatuses, reserve);
  const targetVector =
    portfolioCandidate?.targetVector ??
    params.targetVector ??
    defaultTargetVector(primaryStrategy, blockers);
  const transition = transitionFor(
    params.previousState,
    primaryStrategy,
    blockers,
    candidatePrimaryStrategy,
    commitmentSelection.holdReason,
  );
  const commitment = commitmentFor(
    params.previousState,
    primaryStrategy,
    transition,
  );
  const strategyPortfolio = stateStrategyPortfolio(
    params,
    primaryStrategy,
    secondaryStrategies,
    transition,
  );
  const phase = phaseFor({
    primaryStrategy,
    roleStatuses,
    reserve,
    blockers,
    targetVector,
  });

  const state: StrategicIntentState = {
    schemaVersion: STRATEGIC_INTENT_STATE_SCHEMA_VERSION,
    side: params.side,
    stateVersion: params.stateVersion,
    source: {
      deckStrategyProfile: params.strategyProfile
        ? "ai_internal_strategy_profile"
        : "missing",
      deckCapabilities: params.deckCapabilities ? "ai_internal" : "missing",
      plannerEffect: "goal_and_plan_input",
      actionGeneration: "none",
      hiddenInfoPolicy: "player_view_only",
    },
    primaryStrategy,
    secondaryStrategies,
    phase,
    roleStatuses,
    targetVector,
    reserve,
    blockers,
    transition,
    commitment,
    strategyPortfolio,
    evidence: [
      "strategic_intent_state:player_view_only",
      `side:${params.side}`,
      `primary_strategy:${primaryStrategy.strategyId}`,
      `phase:${phase}`,
      `blocker_count:${blockers.length}`,
      `secondary_strategy_count:${secondaryStrategies.length}`,
      `strategy_portfolio_candidate_count:${strategyPortfolio.productiveCandidates.length}`,
    ],
  };
  assertSemanticObjectSideSafe(state, "StrategicIntentState");
  return state;
}

function selectPrimaryStrategy(
  params: BuildStrategicIntentStateParams,
): StrategicLineState {
  const profile = params.strategyProfile;
  if (!profile || profile.side !== params.side) {
    return neutralLine(params.side);
  }
  const eligibleStrategies = eligibleStrategyIds(profile);
  if (eligibleStrategies.length === 0) return neutralLine(params.side);
  const preferredStrategyId =
    params.preferredStrategyId &&
    eligibleStrategies.includes(params.preferredStrategyId)
      ? params.preferredStrategyId
      : undefined;
  const strategyId = preferredStrategyId ?? eligibleStrategies[0];
  if (!strategyId) return neutralLine(params.side);
  return lineFromScore(strategyId, profile.strategyScores[strategyId]);
}

function selectSecondaryStrategies(
  params: BuildStrategicIntentStateParams,
  primary: StrategicLineState,
): StrategicLineState[] {
  const profile = params.strategyProfile;
  if (!profile || profile.side !== params.side) return [];
  return eligibleStrategyIds(profile)
    .filter((strategyId) => strategyId !== primary.strategyId)
    .map((strategyId) => lineFromScore(strategyId, profile.strategyScores[strategyId]))
    .filter((line) => line.completeness !== "none")
    .sort(
      (left, right) =>
        right.score.final - left.score.final ||
        left.strategyId.localeCompare(right.strategyId),
    );
}

function eligibleStrategyIds(profile: AiDeckStrategyProfile): string[] {
  return uniqueStrings([...profile.primaryStrategies, ...profile.secondaryStrategies])
    .filter((strategyId) => strategyEligibleForActiveLine(profile.strategyScores[strategyId]))
    .sort((left, right) => {
      const leftScore = profile.strategyScores[left];
      const rightScore = profile.strategyScores[right];
      return (
        (rightScore?.finalScore ?? 0) - (leftScore?.finalScore ?? 0) ||
        (rightScore?.anchorScore ?? 0) - (leftScore?.anchorScore ?? 0) ||
        left.localeCompare(right)
      );
    });
}

function strategyEligibleForActiveLine(
  score: DeckStrategyScore | undefined,
): boolean {
  if (!score) return false;
  if (
    score.runtimeStatus === "blocked" ||
    score.runtimeStatus === "supporting" ||
    score.runtimeStatus === "diagnostic_only"
  ) {
    return false;
  }
  return score.anchorScore > 0 && score.anchorEvidence.length > 0;
}

function committedPrimaryStrategy(
  params: BuildStrategicIntentStateParams,
  candidate: StrategicLineState,
): {
  primaryStrategy: StrategicLineState;
  holdReason?: "min_commitment_not_met" | "switch_margin_not_met";
} {
  const previous = params.previousState;
  if (!previous) return { primaryStrategy: candidate };
  if (previous.primaryStrategy.strategyId === candidate.strategyId) {
    return { primaryStrategy: candidate };
  }
  if (candidate.family === "neutral" || previous.primaryStrategy.family === "neutral") {
    return { primaryStrategy: candidate };
  }
  if (previous.blockers.some((blocker) => blocker.severity === "hard")) {
    return { primaryStrategy: candidate };
  }
  const previousCurrent = currentLineForPreviousStrategy(params, previous);
  if (!previousCurrent || previousCurrent.completeness === "none") {
    return { primaryStrategy: candidate };
  }
  const candidateLead = candidate.score.final - previousCurrent.score.final;
  if (
    previous.commitment.decisionsCommitted <
    previous.commitment.minCommitmentDecisions
  ) {
    return {
      primaryStrategy: previousCurrent,
      holdReason: "min_commitment_not_met",
    };
  }
  if (candidateLead < previous.commitment.switchMargin) {
    return {
      primaryStrategy: previousCurrent,
      holdReason: "switch_margin_not_met",
    };
  }
  return { primaryStrategy: candidate };
}

function currentLineForPreviousStrategy(
  params: BuildStrategicIntentStateParams,
  previous: StrategicIntentState,
): StrategicLineState | undefined {
  const previousStrategyId = previous.primaryStrategy.strategyId;
  const currentScore = params.strategyProfile?.strategyScores[previousStrategyId];
  if (!currentScore) return undefined;
  return lineFromScore(previousStrategyId, currentScore);
}

function lineFromScore(
  strategyId: string,
  score: DeckStrategyScore | undefined,
): StrategicLineState {
  if (!score) {
    return {
      strategyId,
      family: familyForStrategy(strategyId),
      confidence: "low",
      completeness: "none",
      score: { anchor: 0, support: 0, final: 0 },
      supportGaps: [],
      evidence: [`strategy_score_missing:${strategyId}`],
    };
  }
  return {
    strategyId,
    family: familyForStrategy(strategyId),
    confidence: score.confidence,
    completeness: completenessForScore(score),
    score: {
      anchor: score.anchorScore,
      support: score.supportScore,
      final: score.finalScore,
    },
    supportGaps: [...score.supportGaps].sort(),
    evidence: [
      `strategy:${strategyId}`,
      `confidence:${score.confidence}`,
      `anchor:${score.anchorScore}`,
      `support:${score.supportScore}`,
      `final:${score.finalScore}`,
      `anchor_evidence:${score.anchorEvidence.length}`,
      `support_evidence:${score.supportEvidence.length}`,
    ],
  };
}

function neutralLine(side: Side): StrategicLineState {
  return {
    strategyId: `${side}.neutral`,
    family: "neutral",
    confidence: "low",
    completeness: "none",
    score: { anchor: 0, support: 0, final: 0 },
    supportGaps: ["no_strategy_anchor"],
    evidence: ["neutral_doctrine:no_strategy_anchor"],
  };
}

function completenessForScore(
  score: DeckStrategyScore,
): StrategicIntentCompleteness {
  if (score.anchorScore <= 0 && score.finalScore < 30) return "none";
  if (
    score.finalScore >= 65 &&
    score.confidence === "high" &&
    score.supportGaps.length === 0
  ) {
    return "complete";
  }
  return "partial";
}

function familyForStrategy(strategyId: string): StrategicIntentFamily {
  return FAMILY_BY_STRATEGY_ID[strategyId] ?? "unknown";
}

function defaultReserveRequirement(
  family: StrategicIntentFamily,
  availableCredits: number | undefined,
): StrategicReserveRequirement {
  const required = reserveCreditsForFamily(family);
  if (required <= 0) {
    return {
      kind: "none",
      required: 0,
      satisfied: true,
      evidence: ["reserve:none"],
    };
  }
  const available = availableCredits;
  return {
    kind: "credits",
    required,
    ...(available !== undefined ? { available } : {}),
    satisfied: available === undefined ? false : available >= required,
    evidence: [
      `reserve_required:${required}`,
      ...(available !== undefined
        ? [`reserve_available:${available}`]
        : ["reserve_available:unknown"]),
    ],
  };
}

function reserveCreditsForFamily(family: StrategicIntentFamily): number {
  switch (family) {
    case "runner_central_pressure":
    case "runner_remote_contest":
    case "runner_remote_trash":
      return 4;
    case "corp_scoreline":
    case "corp_fast_advance":
    case "corp_ice_tax":
      return 5;
    case "corp_tag_trace_punish":
    case "corp_damage_kill":
      return 6;
    default:
      return 0;
  }
}

function buildBlockers(
  primary: StrategicLineState,
  roleStatuses: readonly StrategicRoleStatusSnapshot[],
  reserve: StrategicReserveRequirement,
): StrategicIntentBlocker[] {
  const blockers: StrategicIntentBlocker[] = [];
  if (primary.completeness === "none") {
    blockers.push({
      blockerId: `${primary.strategyId}:no_anchor`,
      severity: "hard",
      reason: "no_strategy_anchor",
      removalCondition: "provide a strategy profile with concrete anchor evidence",
      evidence: primary.evidence,
    });
  }
  for (const gap of primary.supportGaps) {
    blockers.push({
      blockerId: `${primary.strategyId}:support_gap:${gap}`,
      severity: primary.completeness === "complete" ? "soft" : "hard",
      reason: "support_gap",
      removalCondition: `resolve support gap ${gap}`,
      evidence: [`support_gap:${gap}`],
    });
  }
  if (!reserve.satisfied) {
    blockers.push({
      blockerId: `${primary.strategyId}:reserve_shortfall`,
      severity: "soft",
      reason: "reserve_shortfall",
      removalCondition: `reach ${reserve.required} ${reserve.kind}`,
      evidence: reserve.evidence,
    });
  }
  for (const role of roleStatuses) {
    if (role.status === "absent") {
      blockers.push({
        blockerId: `${primary.strategyId}:role_absent:${role.roleId}`,
        severity: "hard",
        reason: "missing_role",
        removalCondition: `replace or abandon role ${role.roleId}`,
        evidence: role.evidence,
      });
    }
    if (role.status === "temporarily_unavailable") {
      blockers.push({
        blockerId: `${primary.strategyId}:role_unavailable:${role.roleId}`,
        severity: "soft",
        reason: "temporarily_unavailable",
        removalCondition: `make role ${role.roleId} available again`,
        evidence: role.evidence,
      });
    }
  }
  return blockers.sort((left, right) =>
    left.blockerId.localeCompare(right.blockerId),
  );
}

function defaultTargetVector(
  primary: StrategicLineState,
  blockers: readonly StrategicIntentBlocker[],
): StrategicTargetVector {
  if (blockers.some((blocker) => blocker.reason === "no_strategy_anchor")) {
    return { kind: "none", evidence: ["target:none_neutral"] };
  }
  switch (primary.family) {
    case "runner_central_pressure":
      return {
        kind: "central",
        targetId: primary.strategyId === "runner.hq_pressure" ? "hq" : "rd",
        evidence: [`target_from_strategy:${primary.strategyId}`],
      };
    case "runner_remote_contest":
    case "runner_remote_trash":
      return {
        kind: "remote",
        targetId: "best_visible_remote",
        evidence: [`target_from_strategy:${primary.strategyId}`],
      };
    case "corp_scoreline":
    case "corp_fast_advance":
      return {
        kind: "scoreline",
        evidence: [`target_from_strategy:${primary.strategyId}`],
      };
    case "corp_tag_trace_punish":
      return { kind: "tag", evidence: [`target_from_strategy:${primary.strategyId}`] };
    case "corp_damage_kill":
    case "corp_ambush":
      return {
        kind: "damage",
        evidence: [`target_from_strategy:${primary.strategyId}`],
      };
    case "runner_setup":
    case "corp_economy_reserve":
    case "corp_asset_economy":
      return {
        kind: "economy",
        evidence: [`target_from_strategy:${primary.strategyId}`],
      };
    case "runner_survival":
      return {
        kind: "survival",
        evidence: [`target_from_strategy:${primary.strategyId}`],
      };
    default:
      return {
        kind: "none",
        evidence: [`target_unknown_for_strategy:${primary.strategyId}`],
      };
  }
}

function transitionFor(
  previous: StrategicIntentState | undefined,
  primary: StrategicLineState,
  blockers: readonly StrategicIntentBlocker[],
  candidate: StrategicLineState,
  holdReason: "min_commitment_not_met" | "switch_margin_not_met" | undefined,
): StrategicIntentTransition {
  if (!previous) {
    return {
      status: "selected",
      reason: "initial_strategy_selection",
      evidence: [`selected:${primary.strategyId}`],
    };
  }
  if (
    previous.primaryStrategy.family !== "neutral" &&
    primary.family === "neutral"
  ) {
    return {
      status: "abandoned",
      reason: "no_current_strategy_anchor",
      previousStrategyId: previous.primaryStrategy.strategyId,
      evidence: [
        `previous:${previous.primaryStrategy.strategyId}`,
        `selected:${primary.strategyId}`,
        "abandon_reason:no_current_strategy_anchor",
      ],
    };
  }
  if (blockers.some((blocker) => blocker.severity === "hard")) {
    return {
      status: "paused",
      reason: "hard_blocker_present",
      previousStrategyId: previous.primaryStrategy.strategyId,
      evidence: blockers.map((blocker) => `blocker:${blocker.blockerId}`),
    };
  }
  if (previous.primaryStrategy.strategyId === primary.strategyId) {
    return {
      status: "continued",
      reason: holdReason ?? "same_primary_strategy",
      previousStrategyId: previous.primaryStrategy.strategyId,
      evidence: [
        `continued:${primary.strategyId}`,
        ...(holdReason
          ? [
              `held_candidate:${candidate.strategyId}`,
              `hold_reason:${holdReason}`,
            ]
          : []),
      ],
    };
  }
  return {
    status: "switched",
    reason: "primary_strategy_changed",
    previousStrategyId: previous.primaryStrategy.strategyId,
    evidence: [
      `previous:${previous.primaryStrategy.strategyId}`,
      `selected:${primary.strategyId}`,
    ],
  };
}

function commitmentFor(
  previous: StrategicIntentState | undefined,
  primary: StrategicLineState,
  transition: StrategicIntentTransition,
): StrategicCommitmentState {
  const previousCommitment =
    previous?.primaryStrategy.strategyId === primary.strategyId
      ? previous.commitment.decisionsCommitted
      : 0;
  const decisionsCommitted =
    transition.status === "continued" ? previousCommitment + 1 : 1;
  return {
    strategyId: primary.strategyId,
    decisionsCommitted,
    switchMargin: previous?.commitment.switchMargin ?? DEFAULT_SWITCH_MARGIN,
    minCommitmentDecisions:
      previous?.commitment.minCommitmentDecisions ??
      DEFAULT_MIN_COMMITMENT_DECISIONS,
    evidence: [
      `commitment_status:${transition.status}`,
      `decisions_committed:${decisionsCommitted}`,
      `switch_margin:${previous?.commitment.switchMargin ?? DEFAULT_SWITCH_MARGIN}`,
    ],
  };
}

function stateStrategyPortfolio(
  params: BuildStrategicIntentStateParams,
  primary: StrategicLineState,
  secondaryStrategies: readonly StrategicLineState[],
  transition: StrategicIntentTransition,
): StrategicStrategyPortfolio {
  const provided = params.strategyPortfolio;
  if (provided) {
    return {
      ...provided,
      activeStrategyId: primary.strategyId,
      activeSelectionReason: transition.reason,
      productiveCandidates: provided.productiveCandidates.map((candidate) => ({
        ...candidate,
        evidence: [
          ...candidate.evidence,
          candidate.strategyId === primary.strategyId
            ? "portfolio_candidate:intent_active"
            : "portfolio_candidate:intent_alternate",
        ],
      })),
      evidence: [
        ...provided.evidence,
        `portfolio_active:${primary.strategyId}`,
        `portfolio_transition:${transition.reason}`,
      ],
    };
  }

  const synthesizedCandidates = [primary, ...secondaryStrategies].map(
    (line, index): StrategicStrategyPortfolioCandidate => ({
      strategyId: line.strategyId,
      family: line.family,
      candidateRole: index === 0 ? "primary" : "secondary",
      runtimeStatus: "legacy_unspecified",
      runtimeBlockers: [],
      confidence: line.confidence,
      score: { ...line.score },
      selectionScore: line.score.final,
      roleStatuses: [],
      targetVector: defaultTargetVector(line, []),
      reserve: defaultReserveRequirement(line.family, params.availableCredits),
      evidence: [
        "portfolio_source:strategic_intent_state",
        index === 0
          ? "portfolio_candidate:intent_active"
          : "portfolio_candidate:intent_alternate",
      ],
    }),
  );

  return {
    activeStrategyId: primary.strategyId,
    activeSelectionReason: transition.reason,
    productiveCandidates: synthesizedCandidates,
    blockedCandidates: [],
    evidence: [
      "portfolio_source:strategic_intent_state_synthesized",
      `portfolio_active:${primary.strategyId}`,
      `portfolio_transition:${transition.reason}`,
    ],
  };
}

function phaseFor(params: {
  primaryStrategy: StrategicLineState;
  roleStatuses: readonly StrategicRoleStatusSnapshot[];
  reserve: StrategicReserveRequirement;
  blockers: readonly StrategicIntentBlocker[];
  targetVector: StrategicTargetVector;
}): StrategicIntentPhase {
  const hardBlocked = params.blockers.some(
    (blocker) => blocker.severity === "hard",
  );
  if (params.primaryStrategy.family === "neutral" || hardBlocked) return "recover";
  if (!params.reserve.satisfied) return "fund";
  if (hasLegalCloseoutWindow(params)) return "closeout";
  if (
    params.roleStatuses.some(
      (role) => role.status === "active" || role.status === "visible",
    )
  ) {
    if (
      params.targetVector.kind === "scoreline" ||
      params.targetVector.kind === "tag" ||
      params.targetVector.kind === "damage"
    ) {
      return "convert";
    }
    return "pressure";
  }
  if (
    params.roleStatuses.some((role) => role.status === "installable") ||
    params.primaryStrategy.completeness === "complete"
  ) {
    return "enable";
  }
  return "assemble";
}

function hasLegalCloseoutWindow(params: {
  roleStatuses: readonly StrategicRoleStatusSnapshot[];
  targetVector: StrategicTargetVector;
}): boolean {
  if (
    params.targetVector.kind === "scoreline" &&
    roleEvidenceIncludes(params.roleStatuses, "legal_score:true")
  ) {
    return true;
  }
  if (
    params.targetVector.kind === "damage" &&
    roleEvidenceIncludes(params.roleStatuses, "legal_punish_payoff:true")
  ) {
    return true;
  }
  return roleEvidenceIncludes(params.roleStatuses, "legal_closeout_action:true");
}

function roleEvidenceIncludes(
  roles: readonly StrategicRoleStatusSnapshot[],
  evidence: string,
): boolean {
  return roles.some((role) => {
    const roleEvidenceSet = new Set(role.evidence);
    return roleEvidenceSet.has(evidence);
  });
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function sortedRoleStatuses(
  roles: readonly StrategicRoleStatusSnapshot[],
): StrategicRoleStatusSnapshot[] {
  return [...roles].sort((left, right) =>
    left.roleId.localeCompare(right.roleId),
  );
}
