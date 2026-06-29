import type { Side } from "@netgrid/shared";
import type { DeckCapabilityProfile } from "./deck-capabilities";
import type {
  AiDeckStrategyProfile,
  DeckStrategyRuntimeStatus,
  DeckStrategyScore,
} from "./deck-doctrine-strategy";

export const RUNNER_STRATEGIC_INTENT_SCHEMA_VERSION =
  "runner-strategic-intent-profile-v1" as const;

export type RunnerPrimaryWinIntent =
  | "runner.steal_agendas_default"
  | "runner.unknown";

export type RunnerExecutionStyle =
  | "runner.run_event_tempo"
  | "runner.opportunistic_pressure"
  | "runner.setup_first";

export type RunnerSetupEngine =
  | "runner.search_breaker_setup"
  | "runner.rig_first"
  | "runner.economy_setup_before_pressure"
  | "runner.draw_or_search_setup";

export type RunnerPressureVector =
  | "runner.central_probe_pressure"
  | "runner.conditional_remote_contest";

export type RunnerRiskProfile =
  | "runner.risky_universal_breaker_pressure"
  | "runner.low_confidence_strategy_projection";

export type RunnerRejectedIntent =
  | "runner.hq_depletion"
  | "runner.bad_publicity_pressure"
  | "runner.dedicated_rnd_multiaccess"
  | "runner.dedicated_hq_multiaccess";

export type RunnerStrategicIntentConfidence = "low" | "medium" | "high";

export type RunnerStrategicIntentProfile = {
  schemaVersion: typeof RUNNER_STRATEGIC_INTENT_SCHEMA_VERSION;
  side: Extract<Side, "runner">;
  source: {
    deckStrategyProfile: "ai_internal_strategy_profile" | "missing";
    deckCapabilities: "ai_internal" | "missing";
    plannerEffect: "runtime_projection";
  };
  primaryWinIntent: RunnerPrimaryWinIntent;
  executionStyle?: RunnerExecutionStyle;
  setupEngine: RunnerSetupEngine[];
  pressureVectors: RunnerPressureVector[];
  riskProfile: RunnerRiskProfile[];
  rejectedIntents: RunnerRejectedIntent[];
  confidence: RunnerStrategicIntentConfidence;
  evidence: string[];
};

export type BuildRunnerStrategicIntentProfileParams = {
  strategyProfile?: AiDeckStrategyProfile;
  deckCapabilities?: DeckCapabilityProfile;
};

const STRATEGY_SCORE_THRESHOLD = 30;
const SUPPORT_ONLY_THRESHOLD = 50;

export function buildRunnerStrategicIntentProfile(
  params: BuildRunnerStrategicIntentProfileParams,
): RunnerStrategicIntentProfile {
  const strategyProfile = params.strategyProfile;
  const deckCapabilities = params.deckCapabilities;
  const side = strategyProfile?.side ?? deckCapabilities?.side;
  if (side !== "runner") {
    return {
      schemaVersion: RUNNER_STRATEGIC_INTENT_SCHEMA_VERSION,
      side: "runner",
      source: sourceFor(params),
      primaryWinIntent: "runner.unknown",
      setupEngine: [],
      pressureVectors: [],
      riskProfile: ["runner.low_confidence_strategy_projection"],
      rejectedIntents: [
        "runner.hq_depletion",
        "runner.bad_publicity_pressure",
        "runner.dedicated_rnd_multiaccess",
        "runner.dedicated_hq_multiaccess",
      ],
      confidence: "low",
      evidence: ["projection_input_side:not_runner"],
    };
  }
  if (!hasProductiveStrategyAnchor(strategyProfile)) {
    const riskProfile = ["runner.low_confidence_strategy_projection" as const];
    const rejectedIntents = sortedIntentValues<RunnerRejectedIntent>([
      ...(!scoreHasSpecificAnchor(strategyProfile, "runner.rnd_pressure")
        ? ["runner.dedicated_rnd_multiaccess" as const]
        : []),
      ...(!scoreHasSpecificAnchor(strategyProfile, "runner.hq_pressure")
        ? ["runner.dedicated_hq_multiaccess" as const]
        : []),
      "runner.hq_depletion",
      "runner.bad_publicity_pressure",
    ]);
    return {
      schemaVersion: RUNNER_STRATEGIC_INTENT_SCHEMA_VERSION,
      side: "runner",
      source: sourceFor(params),
      primaryWinIntent: "runner.unknown",
      setupEngine: [],
      pressureVectors: [],
      riskProfile,
      rejectedIntents,
      confidence: "low",
      evidence: [
        "productive_strategy_anchor:false",
        ...strategicIntentEvidence({
          strategyProfile,
          deckCapabilities,
          setupEngine: [],
          pressureVectors: [],
          riskProfile,
          rejectedIntents,
          executionStyle: undefined,
        }),
      ],
    };
  }

  const setupEngine = sortedIntentValues<RunnerSetupEngine>([
    ...(hasBreakerSearchSetup(strategyProfile, deckCapabilities)
      ? ["runner.search_breaker_setup" as const]
      : []),
    ...(hasRigSetup(strategyProfile, deckCapabilities)
      ? ["runner.rig_first" as const]
      : []),
    ...(hasEconomySetup(strategyProfile, deckCapabilities)
      ? ["runner.economy_setup_before_pressure" as const]
      : []),
    ...(hasDrawOrSearchSetup(strategyProfile)
      ? ["runner.draw_or_search_setup" as const]
      : []),
  ]);
  const executionStyle = executionStyleFor(strategyProfile, setupEngine);
  const pressureVectors = sortedIntentValues<RunnerPressureVector>([
    ...(hasCentralProbePressure(strategyProfile, executionStyle)
      ? ["runner.central_probe_pressure" as const]
      : []),
    ...(hasConditionalRemoteContest(strategyProfile, deckCapabilities, executionStyle)
      ? ["runner.conditional_remote_contest" as const]
      : []),
  ]);
  const riskProfile = sortedIntentValues<RunnerRiskProfile>([
    ...(hasRiskyUniversalCoverage(strategyProfile, deckCapabilities)
      ? ["runner.risky_universal_breaker_pressure" as const]
      : []),
    ...(!strategyProfile && !deckCapabilities
      ? ["runner.low_confidence_strategy_projection" as const]
      : []),
  ]);
  const rejectedIntents = sortedIntentValues<RunnerRejectedIntent>([
    ...(shouldRejectDedicatedRndPressure(strategyProfile)
      ? ["runner.dedicated_rnd_multiaccess" as const]
      : []),
    ...(shouldRejectDedicatedHqPressure(strategyProfile)
      ? ["runner.dedicated_hq_multiaccess" as const]
      : []),
    ...(shouldRejectHqDepletion(strategyProfile)
      ? ["runner.hq_depletion" as const]
      : []),
    ...(shouldRejectBadPublicityPressure(strategyProfile)
      ? ["runner.bad_publicity_pressure" as const]
      : []),
  ]);

  return {
    schemaVersion: RUNNER_STRATEGIC_INTENT_SCHEMA_VERSION,
    side: "runner",
    source: sourceFor(params),
    primaryWinIntent: "runner.steal_agendas_default",
    ...(executionStyle ? { executionStyle } : {}),
    setupEngine,
    pressureVectors,
    riskProfile,
    rejectedIntents,
    confidence: confidenceFor(strategyProfile, deckCapabilities, setupEngine, pressureVectors),
    evidence: strategicIntentEvidence({
      strategyProfile,
      deckCapabilities,
      setupEngine,
      pressureVectors,
      riskProfile,
      rejectedIntents,
      executionStyle,
    }),
  };
}

function executionStyleFor(
  strategyProfile: AiDeckStrategyProfile | undefined,
  setupEngine: readonly RunnerSetupEngine[],
): RunnerExecutionStyle | undefined {
  if (scoreIsMeaningful(strategyProfile, "runner.run_event_tempo")) {
    return "runner.run_event_tempo";
  }
  if (setupEngine.length > 0) return "runner.setup_first";
  return undefined;
}

function hasBreakerSearchSetup(
  strategyProfile: AiDeckStrategyProfile | undefined,
  deckCapabilities: DeckCapabilityProfile | undefined,
): boolean {
  const searchAccess = deckCapabilities?.runner?.searchAccess;
  return (
    scoreIsMeaningful(strategyProfile, "runner.search.breaker") ||
    searchAccess?.canSearchBreakersNow === true ||
    searchAccess?.canSearchProgramsNow === true ||
    (searchAccess?.tools.length ?? 0) > 0
  );
}

function hasRigSetup(
  strategyProfile: AiDeckStrategyProfile | undefined,
  deckCapabilities: DeckCapabilityProfile | undefined,
): boolean {
  return (
    scoreIsMeaningful(strategyProfile, "runner.rig_first") ||
    (deckCapabilities?.runner?.breakerInventory.length ?? 0) > 0 ||
    deckCapabilities?.runner?.memoryProfile.missingMemoryPressure === true
  );
}

function hasEconomySetup(
  strategyProfile: AiDeckStrategyProfile | undefined,
  deckCapabilities: DeckCapabilityProfile | undefined,
): boolean {
  const functionCounts = strategyProfile?.functionSignalCounts ?? {};
  return (
    scoreIsMeaningful(strategyProfile, "runner.economy_first") ||
    (functionCounts["economy.generic"] ?? 0) > 0 ||
    (functionCounts["economy.burst"] ?? 0) > 0 ||
    (functionCounts["economy.burst_credit"] ?? 0) > 0 ||
    (functionCounts["economy.action"] ?? 0) > 0 ||
    (deckCapabilities?.runner?.economyBankTools.length ?? 0) > 0
  );
}

function hasDrawOrSearchSetup(
  strategyProfile: AiDeckStrategyProfile | undefined,
): boolean {
  const functionCounts = strategyProfile?.functionSignalCounts ?? {};
  return (
    (functionCounts["setup.draw"] ?? 0) > 0 ||
    (functionCounts["setup.search"] ?? 0) > 0
  );
}

function hasCentralProbePressure(
  strategyProfile: AiDeckStrategyProfile | undefined,
  executionStyle: RunnerExecutionStyle | undefined,
): boolean {
  return (
    executionStyle === "runner.run_event_tempo" ||
    scoreHasSpecificAnchor(strategyProfile, "runner.rnd_pressure") ||
    scoreHasSpecificAnchor(strategyProfile, "runner.hq_pressure")
  );
}

function hasConditionalRemoteContest(
  strategyProfile: AiDeckStrategyProfile | undefined,
  deckCapabilities: DeckCapabilityProfile | undefined,
  executionStyle: RunnerExecutionStyle | undefined,
): boolean {
  return (
    scoreHasSpecificAnchor(strategyProfile, "runner.remote_contest") ||
    scoreHasSpecificAnchor(strategyProfile, "runner.remote_trash") ||
    (executionStyle === "runner.run_event_tempo" &&
      ((deckCapabilities?.runner?.attackPlanProfile.remoteContestToolsKnown ?? 0) > 0 ||
        hasRunnerUniversalCoverage(deckCapabilities)))
  );
}

function hasRunnerUniversalCoverage(
  deckCapabilities: DeckCapabilityProfile | undefined,
): boolean {
  const universalCoverage = deckCapabilities?.runner?.breakerCoverageMatrix.universal;
  return Boolean(
    universalCoverage?.installed ||
      universalCoverage?.inHand ||
      universalCoverage?.inDeckKnown ||
      universalCoverage?.searchableNow,
  );
}

function hasRiskyUniversalCoverage(
  strategyProfile: AiDeckStrategyProfile | undefined,
  deckCapabilities: DeckCapabilityProfile | undefined,
): boolean {
  const functionCounts = strategyProfile?.functionSignalCounts ?? {};
  const universalCoverage = deckCapabilities?.runner?.breakerCoverageMatrix.universal;
  const universalBreakers =
    deckCapabilities?.runner?.breakerInventory.filter((breaker) => {
      const coverage = new Set(breaker.coverage);
      return coverage.has("universal");
    }) ?? [];
  return (
    (functionCounts["breaker.risky"] ?? 0) > 0 ||
    (functionCounts["risk.opponent_guessing_game"] ?? 0) > 0 ||
    universalBreakers.some((breaker) => breaker.risks.length > 0) ||
    (universalCoverage?.inDeckKnown === true &&
      universalCoverage.bestKnownCards.length > 0 &&
      universalBreakers.length === 0)
  );
}

function shouldRejectDedicatedRndPressure(
  strategyProfile: AiDeckStrategyProfile | undefined,
): boolean {
  const score = strategyScore(strategyProfile, "runner.rnd_pressure");
  return !scoreHasSpecificAnchor(strategyProfile, "runner.rnd_pressure") &&
    (score === undefined || score.supportScore > 0 || score.finalScore > 0);
}

function shouldRejectDedicatedHqPressure(
  strategyProfile: AiDeckStrategyProfile | undefined,
): boolean {
  const score = strategyScore(strategyProfile, "runner.hq_pressure");
  return !scoreHasSpecificAnchor(strategyProfile, "runner.hq_pressure") &&
    (score === undefined || score.supportScore > 0 || score.finalScore > 0);
}

function shouldRejectHqDepletion(
  strategyProfile: AiDeckStrategyProfile | undefined,
): boolean {
  const score = strategyScore(strategyProfile, "runner.hq_pressure");
  return !scoreHasSpecificAnchor(strategyProfile, "runner.hq_pressure") &&
    (score === undefined || score.supportScore >= SUPPORT_ONLY_THRESHOLD);
}

function shouldRejectBadPublicityPressure(
  strategyProfile: AiDeckStrategyProfile | undefined,
): boolean {
  const runnerBadPublicity = strategyScore(strategyProfile, "runner.bad_publicity_pressure");
  const corpBadPublicitySupport =
    strategyProfile?.functionSignalCounts["corp.bad_publicity_pressure"] ?? 0;
  return (
    runnerBadPublicity === undefined ||
    runnerBadPublicity.anchorScore === 0 ||
    corpBadPublicitySupport === 0
  );
}

function scoreIsMeaningful(
  strategyProfile: AiDeckStrategyProfile | undefined,
  strategyId: string,
): boolean {
  const score = strategyScore(strategyProfile, strategyId);
  return Boolean(
    score &&
      (score.anchorScore > 0 ||
        score.finalScore >= STRATEGY_SCORE_THRESHOLD ||
        score.supportScore >= SUPPORT_ONLY_THRESHOLD),
  );
}

function scoreHasSpecificAnchor(
  strategyProfile: AiDeckStrategyProfile | undefined,
  strategyId: string,
): boolean {
  const score = strategyScore(strategyProfile, strategyId);
  return Boolean(score && score.anchorScore > 0 && score.anchorEvidence.length > 0);
}

function hasProductiveStrategyAnchor(
  strategyProfile: AiDeckStrategyProfile | undefined,
): boolean {
  if (!strategyProfile) return false;
  return Object.values(strategyProfile.strategyScores).some(
    (score) =>
      score.runtimeStatus === "productive" &&
      score.anchorScore > 0 &&
      score.anchorEvidence.length > 0,
  );
}

function strategyScore(
  strategyProfile: AiDeckStrategyProfile | undefined,
  strategyId: string,
): DeckStrategyScore | undefined {
  return strategyProfile?.strategyScores[strategyId];
}

function confidenceFor(
  strategyProfile: AiDeckStrategyProfile | undefined,
  deckCapabilities: DeckCapabilityProfile | undefined,
  setupEngine: readonly RunnerSetupEngine[],
  pressureVectors: readonly RunnerPressureVector[],
): RunnerStrategicIntentConfidence {
  if (!strategyProfile && !deckCapabilities) return "low";
  if (
    strategyProfile?.source.plannerEffect === "strategic_intent_input" &&
    deckCapabilities?.confidence === "high" &&
    setupEngine.length >= 2 &&
    pressureVectors.length > 0
  ) {
    return "high";
  }
  if (strategyProfile || deckCapabilities) return "medium";
  return "low";
}

function strategicIntentEvidence(params: {
  strategyProfile: AiDeckStrategyProfile | undefined;
  deckCapabilities: DeckCapabilityProfile | undefined;
  setupEngine: readonly RunnerSetupEngine[];
  pressureVectors: readonly RunnerPressureVector[];
  riskProfile: readonly RunnerRiskProfile[];
  rejectedIntents: readonly RunnerRejectedIntent[];
  executionStyle: RunnerExecutionStyle | undefined;
}): string[] {
  const strategyProfile = params.strategyProfile;
  const deckCapabilities = params.deckCapabilities;
  return [
    `deck_strategy_profile:${strategyProfile ? "present" : "missing"}`,
    ...(strategyProfile
      ? [
          `deck_strategy_planner_effect:${strategyProfile.source.plannerEffect}`,
          `deck_strategy_primary_count:${strategyProfile.primaryStrategies.length}`,
          redactedStrategyScoreEvidence("runner.run_event_tempo", strategyProfile),
          redactedStrategyScoreEvidence("runner.search.breaker", strategyProfile),
          redactedStrategyScoreEvidence("runner.rig_first", strategyProfile),
          redactedStrategyScoreEvidence("runner.hq_pressure", strategyProfile),
          redactedStrategyScoreEvidence("runner.rnd_pressure", strategyProfile),
        ]
      : []),
    `deck_capabilities:${deckCapabilities ? "present" : "missing"}`,
    ...(deckCapabilities
      ? [
          `deck_capability_confidence:${deckCapabilities.confidence}`,
          `deck_capability_runner_breakers:${deckCapabilities.runner?.breakerInventory.length ?? 0}`,
          `deck_capability_runner_search_tools:${deckCapabilities.runner?.searchAccess.tools.length ?? 0}`,
          `deck_capability_runner_bank_tools:${deckCapabilities.runner?.economyBankTools.length ?? 0}`,
        ]
      : []),
    ...(params.executionStyle ? [`execution_style:${params.executionStyle}`] : []),
    `setup_engine:${params.setupEngine.join("|") || "none"}`,
    `pressure_vectors:${params.pressureVectors.join("|") || "none"}`,
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

function sourceFor(
  params: BuildRunnerStrategicIntentProfileParams,
): RunnerStrategicIntentProfile["source"] {
  return {
    deckStrategyProfile: params.strategyProfile
      ? "ai_internal_strategy_profile"
      : "missing",
    deckCapabilities: params.deckCapabilities ? "ai_internal" : "missing",
    plannerEffect: "runtime_projection",
  };
}

function runtimeStatusForEvidence(
  status: DeckStrategyRuntimeStatus | undefined,
): DeckStrategyRuntimeStatus | "unknown" {
  return status ?? "unknown";
}

function sortedIntentValues<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
