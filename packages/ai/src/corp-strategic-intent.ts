import type { Side } from "@netgrid/shared";
import type { DeckCapabilityProfile } from "./deck-capabilities";
import type {
  AiDeckStrategyProfile,
  DeckStrategyRuntimeStatus,
  DeckStrategyScore,
} from "./deck-doctrine-strategy";
import type { StrategicIntentState } from "./strategic-intent-state";

export const CORP_STRATEGIC_INTENT_SCHEMA_VERSION =
  "corp-strategic-intent-profile-v1" as const;

export type CorpPrimaryWinIntent =
  | "corp.score_agendas"
  | "corp.score_fast_advance"
  | "corp.tax_and_score"
  | "corp.punish_runner"
  | "corp.unknown";

export type CorpScorePlan =
  | "corp.remote_scoreline"
  | "corp.rush_scoreline"
  | "corp.fast_advance_scoreline";

export type CorpDefensePlan =
  | "corp.ice_tax_glacier"
  | "corp.central_stabilize"
  | "corp.remote_protect";

export type CorpEconomyPlan =
  | "corp.asset_economy"
  | "corp.rez_reserve"
  | "corp.economy_before_pressure";

export type CorpPunishPlan =
  | "corp.tag_trace_punish"
  | "corp.damage_kill"
  | "corp.ambush_bluff";

export type CorpStrategicIntentRisk =
  | "corp.low_confidence_strategy_projection"
  | "corp.no_productive_anchor"
  | "corp.reserve_shortfall";

export type CorpRejectedIntent =
  | "corp.remote_scoring_blocked"
  | "corp.fast_advance_blocked"
  | "corp.ice_tax_glacier_blocked"
  | "corp.tag_trace_punish_blocked"
  | "corp.damage_kill_blocked"
  | "corp.ambush_bluff_blocked"
  | "corp.economy_rez_reserve_support_only"
  | "corp.central_stabilize_support_only"
  | "corp.asset_economy_support_only";

export type CorpStrategicIntentConfidence = "low" | "medium" | "high";

export type CorpStrategicIntentProfile = {
  schemaVersion: typeof CORP_STRATEGIC_INTENT_SCHEMA_VERSION;
  side: Extract<Side, "corp">;
  source: {
    deckStrategyProfile: "ai_internal_strategy_profile" | "missing";
    deckCapabilities: "ai_internal" | "missing";
    strategicIntentState: "strategic_intent_state_v1" | "missing";
    plannerEffect: "runtime_projection";
  };
  primaryWinIntent: CorpPrimaryWinIntent;
  scorePlan: CorpScorePlan[];
  defensePlan: CorpDefensePlan[];
  economyPlan: CorpEconomyPlan[];
  punishPlan: CorpPunishPlan[];
  riskProfile: CorpStrategicIntentRisk[];
  rejectedIntents: CorpRejectedIntent[];
  confidence: CorpStrategicIntentConfidence;
  evidence: string[];
};

export type BuildCorpStrategicIntentProfileParams = {
  strategyProfile?: AiDeckStrategyProfile;
  deckCapabilities?: DeckCapabilityProfile;
  strategicIntentState?: StrategicIntentState;
};

const SCORE_THRESHOLD = 30;

export function buildCorpStrategicIntentProfile(
  params: BuildCorpStrategicIntentProfileParams,
): CorpStrategicIntentProfile {
  const strategyProfile = params.strategyProfile;
  const deckCapabilities = params.deckCapabilities;
  const strategicIntentState = params.strategicIntentState;
  const side =
    strategicIntentState?.side ?? strategyProfile?.side ?? deckCapabilities?.side;
  if (side !== "corp") {
    return {
      schemaVersion: CORP_STRATEGIC_INTENT_SCHEMA_VERSION,
      side: "corp",
      source: sourceFor(params),
      primaryWinIntent: "corp.unknown",
      scorePlan: [],
      defensePlan: [],
      economyPlan: [],
      punishPlan: [],
      riskProfile: [
        "corp.low_confidence_strategy_projection",
        "corp.no_productive_anchor",
      ],
      rejectedIntents: [
        "corp.remote_scoring_blocked",
        "corp.fast_advance_blocked",
        "corp.tag_trace_punish_blocked",
        "corp.damage_kill_blocked",
      ],
      confidence: "low",
      evidence: ["projection_input_side:not_corp"],
    };
  }
  if (!hasProductiveStrategyAnchor(strategyProfile, strategicIntentState)) {
    const rejectedIntents = sortedIntentValues<CorpRejectedIntent>(
      rejectedCorpIntents(strategyProfile),
    );
    const riskProfile = sortedIntentValues<CorpStrategicIntentRisk>([
      ...(!strategyProfile && !deckCapabilities && !strategicIntentState
        ? ["corp.low_confidence_strategy_projection" as const]
        : []),
      "corp.no_productive_anchor",
      ...(strategicIntentState?.reserve.satisfied === false
        ? ["corp.reserve_shortfall" as const]
        : []),
    ]);
    return {
      schemaVersion: CORP_STRATEGIC_INTENT_SCHEMA_VERSION,
      side: "corp",
      source: sourceFor(params),
      primaryWinIntent: "corp.unknown",
      scorePlan: [],
      defensePlan: [],
      economyPlan: [],
      punishPlan: [],
      riskProfile,
      rejectedIntents,
      confidence: "low",
      evidence: [
        "productive_strategy_anchor:false",
        ...strategicIntentEvidence({
          strategyProfile,
          deckCapabilities,
          strategicIntentState,
          scorePlan: [],
          defensePlan: [],
          economyPlan: [],
          punishPlan: [],
          riskProfile,
          rejectedIntents,
        }),
      ],
    };
  }

  const scorePlan = sortedIntentValues<CorpScorePlan>([
    ...(productiveOrAnchored(strategyProfile, "corp.remote_scoring") ||
    hasRemoteScoreSupport(deckCapabilities)
      ? ["corp.remote_scoreline" as const]
      : []),
    ...(productiveOrAnchored(strategyProfile, "corp.rush_score")
      ? ["corp.rush_scoreline" as const]
      : []),
    ...(productiveOrAnchored(strategyProfile, "corp.fast_advance") ||
    hasFastAdvanceSupport(deckCapabilities)
      ? ["corp.fast_advance_scoreline" as const]
      : []),
  ]);
  const defensePlan = sortedIntentValues<CorpDefensePlan>([
    ...(productiveOrAnchored(strategyProfile, "corp.ice_tax_glacier") ||
    hasIceTaxSupport(deckCapabilities)
      ? ["corp.ice_tax_glacier" as const]
      : []),
    ...(productiveOrAnchored(strategyProfile, "corp.central_stabilize")
      ? ["corp.central_stabilize" as const]
      : []),
    ...(hasRemoteProtectionSupport(deckCapabilities)
      ? ["corp.remote_protect" as const]
      : []),
  ]);
  const economyPlan = sortedIntentValues<CorpEconomyPlan>([
    ...(productiveOrAnchored(strategyProfile, "corp.asset_economy") ||
    hasAssetEconomySupport(deckCapabilities, strategyProfile)
      ? ["corp.asset_economy" as const]
      : []),
    ...(hasRezReserveSupport(deckCapabilities, strategyProfile)
      ? ["corp.rez_reserve" as const]
      : []),
    ...(scorePlan.length === 0 &&
    defensePlan.length === 0 &&
    hasAnyEconomySupport(deckCapabilities, strategyProfile)
      ? ["corp.economy_before_pressure" as const]
      : []),
  ]);
  const punishPlan = sortedIntentValues<CorpPunishPlan>([
    ...(productiveOrAnchored(strategyProfile, "corp.tag_trace_punish") &&
    hasTagPayoffPair(strategyProfile)
      ? ["corp.tag_trace_punish" as const]
      : []),
    ...(productiveOrAnchored(strategyProfile, "corp.damage_kill")
      ? ["corp.damage_kill" as const]
      : []),
    ...(productiveOrAnchored(strategyProfile, "corp.ambush_bluff") ||
    hasAmbushSupport(deckCapabilities)
      ? ["corp.ambush_bluff" as const]
      : []),
  ]);
  const rejectedIntents = sortedIntentValues<CorpRejectedIntent>(
    rejectedCorpIntents(strategyProfile),
  );
  const riskProfile = sortedIntentValues<CorpStrategicIntentRisk>([
    ...(!strategyProfile && !deckCapabilities && !strategicIntentState
      ? ["corp.low_confidence_strategy_projection" as const]
      : []),
    ...(scorePlan.length === 0 &&
    defensePlan.length === 0 &&
    punishPlan.length === 0
      ? ["corp.no_productive_anchor" as const]
      : []),
    ...(strategicIntentState?.reserve.satisfied === false
      ? ["corp.reserve_shortfall" as const]
      : []),
  ]);

  return {
    schemaVersion: CORP_STRATEGIC_INTENT_SCHEMA_VERSION,
    side: "corp",
    source: sourceFor(params),
    primaryWinIntent: primaryWinIntentFor({
      strategicIntentState,
      scorePlan,
      defensePlan,
      punishPlan,
    }),
    scorePlan,
    defensePlan,
    economyPlan,
    punishPlan,
    riskProfile,
    rejectedIntents,
    confidence: confidenceFor({
      strategyProfile,
      deckCapabilities,
      strategicIntentState,
      scorePlan,
      defensePlan,
      punishPlan,
      riskProfile,
    }),
    evidence: strategicIntentEvidence({
      strategyProfile,
      deckCapabilities,
      strategicIntentState,
      scorePlan,
      defensePlan,
      economyPlan,
      punishPlan,
      riskProfile,
      rejectedIntents,
    }),
  };
}

function sourceFor(params: BuildCorpStrategicIntentProfileParams): CorpStrategicIntentProfile["source"] {
  return {
    deckStrategyProfile: params.strategyProfile
      ? "ai_internal_strategy_profile"
      : "missing",
    deckCapabilities: params.deckCapabilities ? "ai_internal" : "missing",
    strategicIntentState: params.strategicIntentState
      ? "strategic_intent_state_v1"
      : "missing",
    plannerEffect: "runtime_projection",
  };
}

function primaryWinIntentFor(params: {
  strategicIntentState: StrategicIntentState | undefined;
  scorePlan: readonly CorpScorePlan[];
  defensePlan: readonly CorpDefensePlan[];
  punishPlan: readonly CorpPunishPlan[];
}): CorpPrimaryWinIntent {
  switch (params.strategicIntentState?.primaryStrategy.strategyId) {
    case "corp.fast_advance":
      return "corp.score_fast_advance";
    case "corp.ice_tax_glacier":
      return "corp.tax_and_score";
    case "corp.tag_trace_punish":
    case "corp.damage_kill":
    case "corp.ambush_bluff":
      return "corp.punish_runner";
    case "corp.remote_scoring":
    case "corp.rush_score":
      return "corp.score_agendas";
    default:
      break;
  }
  if (params.punishPlan.length > 0) return "corp.punish_runner";
  if (params.scorePlan.includes("corp.fast_advance_scoreline")) {
    return "corp.score_fast_advance";
  }
  if (params.defensePlan.includes("corp.ice_tax_glacier")) {
    return "corp.tax_and_score";
  }
  if (params.scorePlan.length > 0) return "corp.score_agendas";
  return "corp.unknown";
}

function productiveOrAnchored(
  strategyProfile: AiDeckStrategyProfile | undefined,
  strategyId: string,
): boolean {
  const score = strategyScore(strategyProfile, strategyId);
  return Boolean(
    score &&
      (score.runtimeStatus === "productive" ||
        (score.anchorScore > 0 && score.finalScore >= SCORE_THRESHOLD)),
  );
}

function hasProductiveStrategyAnchor(
  strategyProfile: AiDeckStrategyProfile | undefined,
  strategicIntentState: StrategicIntentState | undefined,
): boolean {
  if (
    strategicIntentState &&
    strategicIntentState.primaryStrategy.family !== "neutral" &&
    strategicIntentState.primaryStrategy.score.anchor > 0 &&
    !strategicIntentState.blockers.some(
      (blocker) => blocker.reason === "no_strategy_anchor",
    )
  ) {
    return true;
  }
  if (!strategyProfile) return false;
  return Object.values(strategyProfile.strategyScores).some(
    (score) =>
      score.runtimeStatus === "productive" &&
      score.anchorScore > 0 &&
      score.anchorEvidence.length > 0,
  );
}

function hasRemoteScoreSupport(
  deckCapabilities: DeckCapabilityProfile | undefined,
): boolean {
  return (
    (deckCapabilities?.corp?.scorePlanProfile.scoreSupportToolsKnown ?? 0) > 0 ||
    (deckCapabilities?.corp?.remotePlanProfile.remoteProtectionToolsKnown ?? 0) > 0
  );
}

function hasFastAdvanceSupport(
  deckCapabilities: DeckCapabilityProfile | undefined,
): boolean {
  return (
    (deckCapabilities?.corp?.scorePlanProfile.advanceToolsKnown ?? 0) > 0 ||
    (deckCapabilities?.corp?.scorePlanProfile.agendaToolsKnown ?? 0) > 0
  );
}

function hasIceTaxSupport(
  deckCapabilities: DeckCapabilityProfile | undefined,
): boolean {
  const iceTax = deckCapabilities?.corp?.iceTaxProfile;
  return Boolean(
    iceTax &&
      (iceTax.barrierIceKnown > 0 ||
        iceTax.codeGateIceKnown > 0 ||
        iceTax.sentryIceKnown > 0 ||
        iceTax.taxingIceKnown > 0),
  );
}

function hasRemoteProtectionSupport(
  deckCapabilities: DeckCapabilityProfile | undefined,
): boolean {
  return (
    (deckCapabilities?.corp?.remotePlanProfile.remoteProtectionToolsKnown ?? 0) >
    0
  );
}

function hasAssetEconomySupport(
  deckCapabilities: DeckCapabilityProfile | undefined,
  strategyProfile: AiDeckStrategyProfile | undefined,
): boolean {
  return (
    (deckCapabilities?.corp?.remotePlanProfile.remoteEconomyToolsKnown ?? 0) > 0 ||
    (strategyProfile?.corpProfile?.economyProfile.assetEconomy ?? 0) > 0
  );
}

function hasRezReserveSupport(
  deckCapabilities: DeckCapabilityProfile | undefined,
  strategyProfile: AiDeckStrategyProfile | undefined,
): boolean {
  return (
    (deckCapabilities?.corp?.rezReserveProfile.rezEconomyToolsKnown ?? 0) > 0 ||
    (deckCapabilities?.corp?.economyBankTools.length ?? 0) > 0 ||
    (strategyProfile?.corpProfile?.economyProfile.rezSupport ?? 0) > 0
  );
}

function hasAnyEconomySupport(
  deckCapabilities: DeckCapabilityProfile | undefined,
  strategyProfile: AiDeckStrategyProfile | undefined,
): boolean {
  const economy = strategyProfile?.corpProfile?.economyProfile;
  return Boolean(
    hasAssetEconomySupport(deckCapabilities, strategyProfile) ||
      hasRezReserveSupport(deckCapabilities, strategyProfile) ||
      (economy &&
        (economy.operationEconomy > 0 ||
          economy.recurring > 0 ||
          economy.finite > 0)),
  );
}

function hasTagPayoffPair(
  strategyProfile: AiDeckStrategyProfile | undefined,
): boolean {
  const punish = strategyProfile?.corpProfile?.punishProfile;
  return Boolean(
    punish &&
      (punish.tagSources > 0 || punish.traceDensity > 0) &&
      punish.tagPayoff > 0,
  );
}

function hasAmbushSupport(
  deckCapabilities: DeckCapabilityProfile | undefined,
): boolean {
  return (
    (deckCapabilities?.corp?.remotePlanProfile.ambushToolsKnown ?? 0) > 0
  );
}

function rejectedCorpIntents(
  strategyProfile: AiDeckStrategyProfile | undefined,
): CorpRejectedIntent[] {
  return [
    ...rejectedIntentFor(
      strategyProfile,
      "corp.remote_scoring",
      "corp.remote_scoring_blocked",
    ),
    ...rejectedIntentFor(
      strategyProfile,
      "corp.fast_advance",
      "corp.fast_advance_blocked",
    ),
    ...rejectedIntentFor(
      strategyProfile,
      "corp.ice_tax_glacier",
      "corp.ice_tax_glacier_blocked",
    ),
    ...rejectedIntentFor(
      strategyProfile,
      "corp.tag_trace_punish",
      "corp.tag_trace_punish_blocked",
    ),
    ...rejectedIntentFor(
      strategyProfile,
      "corp.damage_kill",
      "corp.damage_kill_blocked",
    ),
    ...rejectedIntentFor(
      strategyProfile,
      "corp.ambush_bluff",
      "corp.ambush_bluff_blocked",
    ),
    ...supportOnlyIntentFor(
      strategyProfile,
      "corp.economy_rez_reserve",
      "corp.economy_rez_reserve_support_only",
    ),
    ...supportOnlyIntentFor(
      strategyProfile,
      "corp.central_stabilize",
      "corp.central_stabilize_support_only",
    ),
    ...supportOnlyIntentFor(
      strategyProfile,
      "corp.asset_economy",
      "corp.asset_economy_support_only",
    ),
  ];
}

function rejectedIntentFor(
  strategyProfile: AiDeckStrategyProfile | undefined,
  strategyId: string,
  rejectedIntent: CorpRejectedIntent,
): CorpRejectedIntent[] {
  const score = strategyScore(strategyProfile, strategyId);
  return score && score.runtimeStatus === "blocked" ? [rejectedIntent] : [];
}

function supportOnlyIntentFor(
  strategyProfile: AiDeckStrategyProfile | undefined,
  strategyId: string,
  rejectedIntent: CorpRejectedIntent,
): CorpRejectedIntent[] {
  const score = strategyScore(strategyProfile, strategyId);
  return score && score.runtimeStatus === "supporting" ? [rejectedIntent] : [];
}

function strategyScore(
  strategyProfile: AiDeckStrategyProfile | undefined,
  strategyId: string,
): DeckStrategyScore | undefined {
  return strategyProfile?.strategyScores[strategyId];
}

function confidenceFor(params: {
  strategyProfile: AiDeckStrategyProfile | undefined;
  deckCapabilities: DeckCapabilityProfile | undefined;
  strategicIntentState: StrategicIntentState | undefined;
  scorePlan: readonly CorpScorePlan[];
  defensePlan: readonly CorpDefensePlan[];
  punishPlan: readonly CorpPunishPlan[];
  riskProfile: readonly CorpStrategicIntentRisk[];
}): CorpStrategicIntentConfidence {
  if (!params.strategyProfile && !params.deckCapabilities && !params.strategicIntentState) {
    return "low";
  }
  if (
    params.strategicIntentState?.primaryStrategy.completeness === "complete" &&
    params.strategicIntentState.blockers.length === 0 &&
    params.riskProfile.length === 0 &&
    (params.scorePlan.length > 0 ||
      params.defensePlan.length > 0 ||
      params.punishPlan.length > 0)
  ) {
    return "high";
  }
  if (params.scorePlan.length > 0 || params.defensePlan.length > 0 || params.punishPlan.length > 0) {
    return "medium";
  }
  return "low";
}

function strategicIntentEvidence(params: {
  strategyProfile: AiDeckStrategyProfile | undefined;
  deckCapabilities: DeckCapabilityProfile | undefined;
  strategicIntentState: StrategicIntentState | undefined;
  scorePlan: readonly CorpScorePlan[];
  defensePlan: readonly CorpDefensePlan[];
  economyPlan: readonly CorpEconomyPlan[];
  punishPlan: readonly CorpPunishPlan[];
  riskProfile: readonly CorpStrategicIntentRisk[];
  rejectedIntents: readonly CorpRejectedIntent[];
}): string[] {
  const profile = params.strategyProfile;
  const capabilities = params.deckCapabilities;
  const state = params.strategicIntentState;
  return [
    `deck_strategy_profile:${profile ? "present" : "missing"}`,
    ...(profile
      ? [
          `deck_strategy_planner_effect:${profile.source.plannerEffect}`,
          `deck_strategy_primary_count:${profile.primaryStrategies.length}`,
          redactedStrategyScoreEvidence("corp.remote_scoring", profile),
          redactedStrategyScoreEvidence("corp.fast_advance", profile),
          redactedStrategyScoreEvidence("corp.ice_tax_glacier", profile),
          redactedStrategyScoreEvidence("corp.tag_trace_punish", profile),
          redactedStrategyScoreEvidence("corp.damage_kill", profile),
        ]
      : []),
    `deck_capabilities:${capabilities ? "present" : "missing"}`,
    ...(capabilities?.corp
      ? [
          `deck_capability_confidence:${capabilities.confidence}`,
          `corp_score_support_tools:${capabilities.corp.scorePlanProfile.scoreSupportToolsKnown}`,
          `corp_advance_tools:${capabilities.corp.scorePlanProfile.advanceToolsKnown}`,
          `corp_ice_known:${capabilities.corp.rezReserveProfile.iceKnownInDeck}`,
          `corp_remote_protection_tools:${capabilities.corp.remotePlanProfile.remoteProtectionToolsKnown}`,
          `corp_bank_tools:${capabilities.corp.economyBankTools.length}`,
        ]
      : []),
    `strategic_intent_state:${state ? "present" : "missing"}`,
    ...(state
      ? [
          `strategic_state_primary:${state.primaryStrategy.strategyId}`,
          `strategic_state_phase:${state.phase}`,
          `strategic_state_blocker_count:${state.blockers.length}`,
          `strategic_state_target:${state.targetVector.kind}`,
        ]
      : []),
    `score_plan:${params.scorePlan.join("|") || "none"}`,
    `defense_plan:${params.defensePlan.join("|") || "none"}`,
    `economy_plan:${params.economyPlan.join("|") || "none"}`,
    `punish_plan:${params.punishPlan.join("|") || "none"}`,
    `risk_profile:${params.riskProfile.join("|") || "none"}`,
    `rejected_intents:${params.rejectedIntents.join("|") || "none"}`,
  ];
}

function redactedStrategyScoreEvidence(
  strategyId: string,
  profile: AiDeckStrategyProfile,
): string {
  const score = profile.strategyScores[strategyId];
  if (!score) return `strategy_score:${strategyId}:missing`;
  return [
    `strategy_score:${strategyId}`,
    `anchor=${score.anchorScore}`,
    `support=${score.supportScore}`,
    `final=${score.finalScore}`,
    `runtime=${runtimeStatusForEvidence(score.runtimeStatus)}`,
  ].join(":");
}

function runtimeStatusForEvidence(
  status: DeckStrategyRuntimeStatus | undefined,
): DeckStrategyRuntimeStatus | "unknown" {
  return status ?? "unknown";
}

function sortedIntentValues<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
