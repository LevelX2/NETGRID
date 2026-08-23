import type { DeckCapabilityProfile } from "./deck-capabilities";
import type {
  AiDeckStrategyProfile,
  DeckStrategyScore,
} from "./deck-doctrine-strategy";
import { assertSemanticObjectSideSafe } from "./diagnostics/semantic-redaction";
import type { StrategicIntentState } from "./strategic-intent-state";

export const REMOTE_DOCTRINE_PROFILE_SCHEMA_VERSION =
  "remote-doctrine-profile-v2" as const;

export type RemoteDependency =
  | "none"
  | "opportunistic"
  | "supporting"
  | "primary";

export type RemotePurpose =
  | "none"
  | "scoreline"
  | "asset_economy"
  | "ambush_bluff"
  | "mixed";

export type RemoteProtectionTarget =
  | "none"
  | "light"
  | "score_window"
  | "taxing"
  | "glacier";

export type RemoteBuildTiming = "on_demand" | "payload_first" | "prebuild";

export type RemoteDoctrineProfile = {
  schemaVersion: typeof REMOTE_DOCTRINE_PROFILE_SCHEMA_VERSION;
  source: {
    deckStrategyProfile: "ai_internal_strategy_profile" | "missing";
    deckCapabilities: "ai_internal" | "missing";
    strategicIntentState: "strategic_intent_state_v1" | "missing";
    plannerEffect: "diagnostic_only" | "plan_portfolio";
  };
  dependency: RemoteDependency;
  purposes: RemotePurpose[];
  protectionTarget: RemoteProtectionTarget;
  buildTiming: RemoteBuildTiming;
  investmentBudget: {
    maxTargetRemotes: number;
    /** @deprecated Remote maturity and funding horizon replace ICE-count caps. */
    maxIceBeforePayload: number;
    backgroundActionsPerTurn: number;
    targetRecoveryTurns: number;
  };
  confidence: "low" | "medium" | "high";
  evidence: string[];
};

export type BuildRemoteDoctrineProfileParams = {
  strategyProfile?: AiDeckStrategyProfile;
  deckCapabilities?: DeckCapabilityProfile;
  strategicIntentState?: StrategicIntentState;
  plannerEffect?: RemoteDoctrineProfile["source"]["plannerEffect"];
};

type RemoteLine =
  | "fast_advance"
  | "rush"
  | "remote_scoring"
  | "glacier"
  | "asset_economy"
  | "ambush";

const STRATEGY_ID_BY_LINE: Record<RemoteLine, string> = {
  fast_advance: "corp.fast_advance",
  rush: "corp.rush_score",
  remote_scoring: "corp.remote_scoring",
  glacier: "corp.ice_tax_glacier",
  asset_economy: "corp.asset_economy",
  ambush: "corp.ambush_bluff",
};

export function buildRemoteDoctrineProfile(
  params: BuildRemoteDoctrineProfileParams,
): RemoteDoctrineProfile {
  const strategyProfile =
    params.strategyProfile?.side === "corp"
      ? params.strategyProfile
      : undefined;
  const deckCapabilities =
    params.deckCapabilities?.side === "corp"
      ? params.deckCapabilities
      : undefined;
  const strategicIntentState =
    params.strategicIntentState?.side === "corp"
      ? params.strategicIntentState
      : undefined;
  const activeStrategyId =
    strategicIntentState?.primaryStrategy.strategyId ??
    strategyProfile?.primaryStrategies[0];
  const primaryLines = remoteLines(strategyProfile, activeStrategyId, true);
  const supportedLines = remoteLines(strategyProfile, activeStrategyId, false);
  const capabilityLines = capabilityRemoteLines(deckCapabilities);
  const lines = uniqueRemoteLines([
    ...primaryLines,
    ...supportedLines,
    ...capabilityLines,
  ]);
  const profile = profileForLines({
    lines,
    primaryLines,
    activeStrategyId,
    strategyProfile,
    deckCapabilities,
    strategicIntentState,
  });
  const confidence = confidenceFor({
    profile,
    activeStrategyId,
    strategyProfile,
    deckCapabilities,
    strategicIntentState,
  });
  const clamped =
    confidence === "low" ? clampLowConfidenceProfile(profile) : profile;
  const result: RemoteDoctrineProfile = {
    schemaVersion: REMOTE_DOCTRINE_PROFILE_SCHEMA_VERSION,
    source: {
      deckStrategyProfile: strategyProfile
        ? "ai_internal_strategy_profile"
        : "missing",
      deckCapabilities: deckCapabilities ? "ai_internal" : "missing",
      strategicIntentState: strategicIntentState
        ? "strategic_intent_state_v1"
        : "missing",
      plannerEffect: params.plannerEffect ?? "diagnostic_only",
    },
    ...clamped,
    confidence,
    evidence: uniqueStrings([
      "remote_doctrine_source:side_safe_own_deck_only",
      `remote_doctrine_active_strategy:${activeStrategyId ?? "none"}`,
      `remote_doctrine_primary_lines:${primaryLines.join("|") || "none"}`,
      `remote_doctrine_supported_lines:${supportedLines.join("|") || "none"}`,
      `remote_doctrine_capability_lines:${capabilityLines.join("|") || "none"}`,
      `remote_doctrine_dependency:${clamped.dependency}`,
      `remote_doctrine_purposes:${clamped.purposes.join("|")}`,
      `remote_doctrine_protection:${clamped.protectionTarget}`,
      `remote_doctrine_timing:${clamped.buildTiming}`,
      `remote_doctrine_confidence:${confidence}`,
      ...strategyEvidence(strategyProfile, lines),
      ...capabilityEvidence(deckCapabilities),
      ...strategicStateEvidence(strategicIntentState),
      ...(confidence === "low" && profile.dependency !== clamped.dependency
        ? ["remote_doctrine_low_confidence_clamp:true"]
        : []),
    ]),
  };
  assertSemanticObjectSideSafe(result, "RemoteDoctrineProfile");
  return result;
}

export function redactedRemoteDoctrineFacts(
  profile: RemoteDoctrineProfile,
): string[] {
  return [
    `remote_doctrine_dependency:${profile.dependency}`,
    `remote_doctrine_purposes:${profile.purposes.join("|")}`,
    `remote_doctrine_protection:${profile.protectionTarget}`,
    `remote_doctrine_timing:${profile.buildTiming}`,
    `remote_doctrine_max_targets:${profile.investmentBudget.maxTargetRemotes}`,
    `remote_doctrine_max_pre_payload_ice:${profile.investmentBudget.maxIceBeforePayload}`,
    `remote_doctrine_background_actions:${profile.investmentBudget.backgroundActionsPerTurn}`,
    `remote_doctrine_target_recovery_turns:${profile.investmentBudget.targetRecoveryTurns}`,
    `remote_doctrine_confidence:${profile.confidence}`,
  ];
}

function profileForLines(params: {
  lines: RemoteLine[];
  primaryLines: RemoteLine[];
  activeStrategyId: string | undefined;
  strategyProfile: AiDeckStrategyProfile | undefined;
  deckCapabilities: DeckCapabilityProfile | undefined;
  strategicIntentState: StrategicIntentState | undefined;
}): Omit<
  RemoteDoctrineProfile,
  "schemaVersion" | "source" | "confidence" | "evidence"
> {
  const lines = new Set(params.lines);
  const primary = new Set(params.primaryLines);
  const hasScoreline =
    lines.has("fast_advance") ||
    lines.has("rush") ||
    lines.has("remote_scoring") ||
    lines.has("glacier");
  const hasAsset = lines.has("asset_economy");
  const hasAmbush = lines.has("ambush");
  const purposes = remotePurposes(
    hasScoreline,
    hasAsset,
    hasAmbush,
    lines.size > 1,
  );
  const pureFastAdvance =
    lines.has("fast_advance") &&
    !lines.has("rush") &&
    !lines.has("remote_scoring") &&
    !lines.has("glacier") &&
    !hasAsset &&
    !hasAmbush;
  if (params.activeStrategyId === STRATEGY_ID_BY_LINE.glacier) {
    return remoteProfile(
      "primary",
      purposes,
      "glacier",
      "prebuild",
      1,
      4,
      1,
      3,
    );
  }
  if (params.activeStrategyId === STRATEGY_ID_BY_LINE.remote_scoring) {
    return remoteProfile("primary", purposes, "taxing", "prebuild", 1, 3, 1, 2);
  }
  if (
    params.activeStrategyId === STRATEGY_ID_BY_LINE.ambush &&
    !lines.has("remote_scoring") &&
    !lines.has("glacier")
  ) {
    return remoteProfile(
      primary.has("ambush") ? "primary" : "supporting",
      purposes,
      "light",
      "payload_first",
      2,
      1,
      1,
      0,
    );
  }
  if (
    params.activeStrategyId === STRATEGY_ID_BY_LINE.asset_economy &&
    !lines.has("remote_scoring") &&
    !lines.has("glacier")
  ) {
    return remoteProfile(
      "supporting",
      purposes,
      "light",
      "payload_first",
      2,
      1,
      1,
      0,
    );
  }
  if (pureFastAdvance) {
    return remoteProfile(
      "opportunistic",
      purposes,
      "none",
      "on_demand",
      1,
      0,
      0,
      0,
    );
  }
  if (params.activeStrategyId === STRATEGY_ID_BY_LINE.rush) {
    return remoteProfile(
      "supporting",
      purposes,
      "score_window",
      "payload_first",
      1,
      2,
      1,
      1,
    );
  }
  if (lines.has("glacier") || lines.has("remote_scoring")) {
    return remoteProfile(
      primary.has("glacier") || primary.has("remote_scoring")
        ? "primary"
        : "supporting",
      purposes,
      lines.has("glacier") ? "taxing" : "score_window",
      "prebuild",
      1,
      lines.has("glacier") ? 3 : 2,
      1,
      lines.has("glacier") ? 2 : 1,
    );
  }
  if (hasScoreline || hasAsset || hasAmbush) {
    return remoteProfile(
      "supporting",
      purposes,
      hasScoreline ? "score_window" : "light",
      hasScoreline ? "on_demand" : "payload_first",
      hasAmbush || hasAsset ? 2 : 1,
      hasScoreline ? 2 : 1,
      1,
      hasScoreline ? 1 : 0,
    );
  }
  return remoteProfile("none", ["none"], "none", "on_demand", 0, 0, 0, 0);
}

function remoteProfile(
  dependency: RemoteDependency,
  purposes: RemotePurpose[],
  protectionTarget: RemoteProtectionTarget,
  buildTiming: RemoteBuildTiming,
  maxTargetRemotes: number,
  maxIceBeforePayload: number,
  backgroundActionsPerTurn: number,
  targetRecoveryTurns: number,
): Omit<
  RemoteDoctrineProfile,
  "schemaVersion" | "source" | "confidence" | "evidence"
> {
  return {
    dependency,
    purposes,
    protectionTarget,
    buildTiming,
    investmentBudget: {
      maxTargetRemotes,
      maxIceBeforePayload,
      backgroundActionsPerTurn,
      targetRecoveryTurns,
    },
  };
}

function clampLowConfidenceProfile(
  profile: Omit<
    RemoteDoctrineProfile,
    "schemaVersion" | "source" | "confidence" | "evidence"
  >,
): Omit<
  RemoteDoctrineProfile,
  "schemaVersion" | "source" | "confidence" | "evidence"
> {
  const dependency =
    profile.dependency === "primary" ? "supporting" : profile.dependency;
  const protectionTarget =
    profile.protectionTarget === "glacier" ||
    profile.protectionTarget === "taxing"
      ? "score_window"
      : profile.protectionTarget;
  return {
    ...profile,
    dependency,
    protectionTarget,
    investmentBudget: {
      maxTargetRemotes: Math.min(1, profile.investmentBudget.maxTargetRemotes),
      maxIceBeforePayload: Math.min(
        2,
        profile.investmentBudget.maxIceBeforePayload,
      ),
      backgroundActionsPerTurn: Math.min(
        1,
        profile.investmentBudget.backgroundActionsPerTurn,
      ),
      targetRecoveryTurns: Math.min(
        1,
        profile.investmentBudget.targetRecoveryTurns,
      ),
    },
  };
}

function remoteLines(
  profile: AiDeckStrategyProfile | undefined,
  activeStrategyId: string | undefined,
  primaryOnly: boolean,
): RemoteLine[] {
  if (!profile) return [];
  return (Object.entries(STRATEGY_ID_BY_LINE) as Array<[RemoteLine, string]>)
    .filter(([, strategyId]) => {
      if (activeStrategyId === strategyId) return true;
      if (primaryOnly) return profile.primaryStrategies.includes(strategyId);
      return strategyIsUsable(profile.strategyScores[strategyId]);
    })
    .map(([line]) => line);
}

function capabilityRemoteLines(
  profile: DeckCapabilityProfile | undefined,
): RemoteLine[] {
  const corp = profile?.corp;
  if (!corp) return [];
  return uniqueRemoteLines([
    ...(corp.remotePlanProfile.remoteProtectionToolsKnown > 0 &&
    corp.scorePlanProfile.scoreSupportToolsKnown > 0
      ? (["remote_scoring"] as const)
      : []),
    ...(corp.remotePlanProfile.remoteEconomyToolsKnown > 0
      ? (["asset_economy"] as const)
      : []),
    ...(corp.remotePlanProfile.ambushToolsKnown > 0
      ? (["ambush"] as const)
      : []),
  ]);
}

function strategyIsUsable(score: DeckStrategyScore | undefined): boolean {
  return Boolean(
    score &&
    score.runtimeStatus !== "blocked" &&
    score.runtimeStatus !== "diagnostic_only" &&
    score.anchorScore > 0 &&
    score.finalScore >= 30,
  );
}

function remotePurposes(
  hasScoreline: boolean,
  hasAsset: boolean,
  hasAmbush: boolean,
  multipleStrategyLines: boolean,
): RemotePurpose[] {
  const concrete: RemotePurpose[] = [
    ...(hasScoreline ? (["scoreline"] as const) : []),
    ...(hasAsset ? (["asset_economy"] as const) : []),
    ...(hasAmbush ? (["ambush_bluff"] as const) : []),
  ];
  if (concrete.length === 0) return ["none"];
  if (concrete.length > 1 || multipleStrategyLines) {
    return ["mixed", ...concrete];
  }
  return concrete;
}

function confidenceFor(params: {
  profile: Omit<
    RemoteDoctrineProfile,
    "schemaVersion" | "source" | "confidence" | "evidence"
  >;
  activeStrategyId: string | undefined;
  strategyProfile: AiDeckStrategyProfile | undefined;
  deckCapabilities: DeckCapabilityProfile | undefined;
  strategicIntentState: StrategicIntentState | undefined;
}): RemoteDoctrineProfile["confidence"] {
  if (!params.strategyProfile || params.strategyProfile.warnings.length > 0) {
    return "low";
  }
  if (params.profile.dependency === "none") {
    return params.strategyProfile.cardCount > 0 ? "medium" : "low";
  }
  const activeScore = params.activeStrategyId
    ? params.strategyProfile.strategyScores[params.activeStrategyId]
    : undefined;
  const noHardBlocker = !params.strategicIntentState?.blockers.some(
    (blocker) => blocker.severity === "hard",
  );
  if (
    params.deckCapabilities?.confidence !== "low" &&
    activeScore?.confidence === "high" &&
    params.strategicIntentState?.primaryStrategy.completeness === "complete" &&
    noHardBlocker
  ) {
    return "high";
  }
  return "medium";
}

function strategyEvidence(
  profile: AiDeckStrategyProfile | undefined,
  lines: readonly RemoteLine[],
): string[] {
  if (!profile) return ["remote_doctrine_strategy_profile:missing"];
  return lines.map((line) => {
    const strategyId = STRATEGY_ID_BY_LINE[line];
    const score = profile.strategyScores[strategyId];
    return [
      "remote_doctrine_strategy",
      strategyId,
      `anchor=${score?.anchorScore ?? 0}`,
      `final=${score?.finalScore ?? 0}`,
      `runtime=${score?.runtimeStatus ?? "missing"}`,
    ].join(":");
  });
}

function capabilityEvidence(
  profile: DeckCapabilityProfile | undefined,
): string[] {
  const corp = profile?.corp;
  if (!corp) return ["remote_doctrine_capabilities:missing"];
  return [
    `remote_doctrine_remote_protection_tools:${corp.remotePlanProfile.remoteProtectionToolsKnown}`,
    `remote_doctrine_remote_economy_tools:${corp.remotePlanProfile.remoteEconomyToolsKnown}`,
    `remote_doctrine_ambush_tools:${corp.remotePlanProfile.ambushToolsKnown}`,
    `remote_doctrine_score_support_tools:${corp.scorePlanProfile.scoreSupportToolsKnown}`,
    `remote_doctrine_taxing_ice:${corp.iceTaxProfile.taxingIceKnown}`,
  ];
}

function strategicStateEvidence(
  state: StrategicIntentState | undefined,
): string[] {
  if (!state) return ["remote_doctrine_strategic_state:missing"];
  return [
    `remote_doctrine_strategic_phase:${state.phase}`,
    `remote_doctrine_strategic_transition:${state.transition.status}`,
    `remote_doctrine_strategic_blockers:${state.blockers.length}`,
  ];
}

function uniqueRemoteLines(values: readonly RemoteLine[]): RemoteLine[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
