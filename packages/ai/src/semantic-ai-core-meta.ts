import { CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS } from "./controlled-shadow-mode";
import type { ShadowModeNoEffectFlags } from "./controlled-shadow-mode";

export const META1_DECK_DOCTRINE_TACTICAL_GOAL_ENGINE_SCHEMA_VERSION =
  "meta1-deck-doctrine-tactical-goal-engine-v0" as const;

export type SemanticAiSide = "runner" | "corp";

export type SemanticAiConfidence = "low" | "medium" | "high";

export type StrategyHypothesis = {
  strategyId: string;
  role: "primary" | "secondary" | "support" | "candidate" | "deferred";
  confidence: SemanticAiConfidence;
  anchorCards: string[];
  payoffCards: string[];
  enablerCards: string[];
  supportCards: string[];
  evidenceSignals: string[];
  missingRequirements: string[];
};

export type SupportPackage = {
  packageId:
    | "economy"
    | "draw"
    | "search"
    | "breaker_coverage"
    | "tag_defense"
    | "damage_defense"
    | "remote_contest"
    | "central_pressure"
    | "ice_tax"
    | "rez_economy"
    | "score_support"
    | "tag_punish"
    | "damage_kill";
  cards: string[];
  signals: string[];
  strength: "weak" | "medium" | "strong";
};

export type CardAnchorEvidence = {
  cardId: string;
  anchorKind: "strategy_anchor" | "payoff" | "enabler" | "support";
  signals: string[];
};

export type MissingPieceEvidence = {
  pieceId: string;
  reason: string;
  severity: "low" | "medium" | "high";
};

export type DeckRiskProfile = {
  riskId: string;
  severity: "low" | "medium" | "high";
  evidence: string[];
};

export type DeckConstraintProfile = {
  constraintId: string;
  status: "satisfied" | "unsatisfied" | "unknown";
  evidence: string[];
};

export type DeckStrategicProfile = {
  profileId: string;
  side: SemanticAiSide;
  sourceDeckId?: string;
  primaryStrategies: StrategyHypothesis[];
  secondaryStrategies: StrategyHypothesis[];
  supportPackages: SupportPackage[];
  keyAnchors: CardAnchorEvidence[];
  missingPieces: MissingPieceEvidence[];
  riskProfile: DeckRiskProfile[];
  constraintProfile: DeckConstraintProfile[];
  neutralDoctrine: boolean;
  confidence: SemanticAiConfidence;
  evidence: string[];
  warnings: string[];
};

export type TacticalPriority = {
  priorityId: SemanticTacticalGoalFamily;
  priority: TacticalGoalPriority;
  rationale: string;
};

export type TacticalAvoidance = {
  avoidanceId: string;
  targetGoalFamily: SemanticTacticalGoalFamily;
  rationale: string;
};

export type StrategyPlan = {
  strategyId: string;
  goalFamilies: SemanticTacticalGoalFamily[];
  evidence: string[];
};

export type DoctrinePivotRule = {
  pivotId: string;
  trigger:
    | "runner_near_flatline"
    | "runner_tagged"
    | "corp_near_score_win"
    | "remote_threat_high"
    | "central_pressure_high"
    | "economy_critical"
    | "breaker_coverage_missing"
    | "scoring_window_open"
    | "punish_window_open";
  effect:
    | "raise_goal_priority"
    | "lower_goal_priority"
    | "block_goal"
    | "force_survival_goal";
  targetGoalFamily: SemanticTacticalGoalFamily;
  rationale: string;
};

export type DeckDoctrine = {
  doctrineId: string;
  side: SemanticAiSide;
  strategicProfileId: string;
  primaryPlan?: StrategyPlan;
  secondaryPlans: StrategyPlan[];
  supportPriorities: TacticalPriority[];
  avoidances: TacticalAvoidance[];
  pivotRules: DoctrinePivotRule[];
  earlyGamePriorities: TacticalPriority[];
  midGamePriorities: TacticalPriority[];
  lateGamePriorities: TacticalPriority[];
  confidence: SemanticAiConfidence;
  neutralDoctrine: boolean;
  evidence: string[];
};

export type TacticalGoalPriority = "low" | "medium" | "high" | "critical";

export type SemanticTacticalGoalFamily =
  | "runner_survive"
  | "runner_remove_tags"
  | "runner_prevent_damage"
  | "runner_economy_stabilize"
  | "runner_draw_find_tools"
  | "runner_rig_setup"
  | "runner_breaker_coverage_code_gate"
  | "runner_breaker_coverage_sentry"
  | "runner_breaker_coverage_wall"
  | "runner_pressure_hq"
  | "runner_pressure_rnd"
  | "runner_contest_remote"
  | "runner_access_payoff"
  | "corp_economy_stabilize"
  | "corp_build_remote"
  | "corp_create_score_window"
  | "corp_score_agenda"
  | "corp_defend_hq"
  | "corp_defend_rnd"
  | "corp_rez_ice_tax"
  | "corp_tag_runner"
  | "corp_punish_tagged_runner"
  | "corp_damage_kill_window"
  | "corp_bait_remote";

export type TacticalGoalState = {
  goalInstanceId: string;
  goalFamily: SemanticTacticalGoalFamily;
  ownerSide: SemanticAiSide;
  lifecycle:
    | "proposed"
    | "active"
    | "progressing"
    | "blocked"
    | "satisfied"
    | "failed"
    | "expired";
  priority: TacticalGoalPriority;
  urgency: TacticalGoalPriority;
  createdOnTurn: number;
  lastUpdatedOnTurn: number;
  ttlTurns?: number;
  doctrineSource: string[];
  boardStateEvidence: string[];
  requiredConditions: string[];
  progressMarkers: string[];
  blockers: string[];
  supportedActionTypes: string[];
  supportedCandidateIds: string[];
  successCriteria: string[];
  failureCriteria: string[];
  whyActive: string[];
  whyBlocked: string[];
};

export type BoardstateOverrideExample = {
  exampleId: string;
  side: SemanticAiSide;
  doctrinePreference: SemanticTacticalGoalFamily;
  boardstateOverride: SemanticTacticalGoalFamily;
  pivotRuleId: string;
  rationale: string;
};

export type Meta1DeckDoctrineTacticalGoalEngineReport = {
  schemaVersion: typeof META1_DECK_DOCTRINE_TACTICAL_GOAL_ENGINE_SCHEMA_VERSION;
  step: "META1";
  scope: "deck_doctrine_tactical_goal_engine_v0";
  inputBaseline: {
    previousReadiness: "broad_shadow_ready";
    sourceProcess: "AI061-SR-AI068-SR";
    cutoverAllowed: false;
  };
  schemaCoverage: {
    deckStrategicProfileSchema: true;
    deckDoctrineSchema: true;
    tacticalGoalStateSchema: true;
    neutralDoctrineRule: true;
    boardstatePivotRules: number;
    runnerGoalFamilies: number;
    corpGoalFamilies: number;
  };
  sampleProfiles: DeckStrategicProfile[];
  sampleDoctrines: DeckDoctrine[];
  tacticalGoalStates: TacticalGoalState[];
  boardstateOverrideExamples: BoardstateOverrideExample[];
  gates: {
    noProductiveActionSelection: true;
    noPlannerWeights: true;
    noRuntimeConsumer: true;
    noHiddenInfoProjection: true;
    neutralDoctrineDoesNotInventStrategy: true;
    boardstateMayOverrideDoctrine: true;
  };
  hardGates: {
    illegalSemanticDecisionCount: 0;
    hiddenInfoViolationCount: 0;
    runtimeConsumerCount: 0;
    actionSelectionCount: 0;
    plannerWeightChangeCount: 0;
  };
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export const META1_RUNNER_GOAL_FAMILIES = [
  "runner_survive",
  "runner_remove_tags",
  "runner_prevent_damage",
  "runner_economy_stabilize",
  "runner_draw_find_tools",
  "runner_rig_setup",
  "runner_breaker_coverage_code_gate",
  "runner_breaker_coverage_sentry",
  "runner_breaker_coverage_wall",
  "runner_pressure_hq",
  "runner_pressure_rnd",
  "runner_contest_remote",
  "runner_access_payoff",
] as const satisfies readonly SemanticTacticalGoalFamily[];

export const META1_CORP_GOAL_FAMILIES = [
  "corp_economy_stabilize",
  "corp_build_remote",
  "corp_create_score_window",
  "corp_score_agenda",
  "corp_defend_hq",
  "corp_defend_rnd",
  "corp_rez_ice_tax",
  "corp_tag_runner",
  "corp_punish_tagged_runner",
  "corp_damage_kill_window",
  "corp_bait_remote",
] as const satisfies readonly SemanticTacticalGoalFamily[];

export const META1_PIVOT_RULES = [
  pivotRule(
    "meta1-runner-kill-risk-survival",
    "runner_near_flatline",
    "force_survival_goal",
    "runner_survive",
    "Visible kill risk overrides value runs and setup plans.",
  ),
  pivotRule(
    "meta1-runner-tag-removal",
    "runner_tagged",
    "raise_goal_priority",
    "runner_remove_tags",
    "Tags raise survival and tag-removal goals before value pressure.",
  ),
  pivotRule(
    "meta1-runner-remote-threat",
    "remote_threat_high",
    "raise_goal_priority",
    "runner_contest_remote",
    "Remote score threat can override central-pressure doctrine.",
  ),
  pivotRule(
    "meta1-runner-coverage-missing",
    "breaker_coverage_missing",
    "raise_goal_priority",
    "runner_rig_setup",
    "Missing breaker coverage redirects pressure plans into setup.",
  ),
  pivotRule(
    "meta1-corp-economy-critical",
    "economy_critical",
    "raise_goal_priority",
    "corp_economy_stabilize",
    "Credit shortage blocks score and rez plans until economy recovers.",
  ),
  pivotRule(
    "meta1-corp-central-pressure",
    "central_pressure_high",
    "raise_goal_priority",
    "corp_defend_rnd",
    "Open central pressure can override remote-building doctrine.",
  ),
  pivotRule(
    "meta1-corp-punish-window",
    "punish_window_open",
    "raise_goal_priority",
    "corp_punish_tagged_runner",
    "Tag-punish goals require a visible punish window and Runner tagged state.",
  ),
  pivotRule(
    "meta1-corp-no-punish-without-tag",
    "runner_tagged",
    "block_goal",
    "corp_punish_tagged_runner",
    "Without a tagged Runner, tag-punish doctrine stays blocked.",
  ),
] as const satisfies readonly DoctrinePivotRule[];

export const META1_BOARDSTATE_OVERRIDE_EXAMPLES = [
  boardstateOverride(
    "runner-rnd-pressure-contests-remote",
    "runner",
    "runner_pressure_rnd",
    "runner_contest_remote",
    "meta1-runner-remote-threat",
    "R&D pressure is downgraded when a visible remote threat can win first.",
  ),
  boardstateOverride(
    "corp-tag-punish-without-tag-blocked",
    "corp",
    "corp_punish_tagged_runner",
    "corp_tag_runner",
    "meta1-corp-no-punish-without-tag",
    "Punish is blocked until the Runner is actually tagged.",
  ),
  boardstateOverride(
    "runner-kill-threat-removes-tag",
    "runner",
    "runner_access_payoff",
    "runner_remove_tags",
    "meta1-runner-tag-removal",
    "Visible kill threat and tags override value access.",
  ),
  boardstateOverride(
    "corp-score-window-needs-economy",
    "corp",
    "corp_score_agenda",
    "corp_economy_stabilize",
    "meta1-corp-economy-critical",
    "A score window is not actionable when credits cannot pay required costs.",
  ),
] as const satisfies readonly BoardstateOverrideExample[];

export function buildMeta1DeckDoctrineTacticalGoalEngineReport(): Meta1DeckDoctrineTacticalGoalEngineReport {
  const sampleProfiles = [
    buildDeckStrategicProfile({
      profileId: "meta1-neutral-runner-profile",
      side: "runner",
      sourceDeckId: "neutral_runner_fixture",
      supportPackages: [
        supportPackage("economy", ["gain_credit"], ["economy.basic"], "medium"),
        supportPackage("draw", ["draw_card"], ["draw.basic"], "weak"),
      ],
      evidence: ["No primary or secondary strategy anchors are present."],
    }),
    buildDeckStrategicProfile({
      profileId: "meta1-rnd-pressure-runner-profile",
      side: "runner",
      sourceDeckId: "rnd_pressure_runner_fixture",
      primaryStrategies: [
        strategyHypothesis("runner_rnd_pressure", "primary", "high", {
          anchorCards: ["rd-interface-anchor"],
          payoffCards: ["multiaccess-payoff"],
          enablerCards: ["breaker-suite"],
          supportCards: ["economy-package"],
          evidenceSignals: ["central_pressure.rnd", "access_payoff.multiaccess"],
        }),
      ],
      supportPackages: [
        supportPackage(
          "central_pressure",
          ["rd-interface-anchor"],
          ["central_pressure.rnd"],
          "strong",
        ),
        supportPackage("breaker_coverage", ["breaker-suite"], ["coverage.mixed"], "medium"),
      ],
      evidence: ["Primary StrategySupportPairs and anchor evidence are present."],
    }),
    buildDeckStrategicProfile({
      profileId: "meta1-tag-punish-corp-profile",
      side: "corp",
      sourceDeckId: "tag_punish_corp_fixture",
      primaryStrategies: [
        strategyHypothesis("corp_tag_punish", "primary", "high", {
          anchorCards: ["tag-source-anchor"],
          payoffCards: ["tag-punish-payoff"],
          enablerCards: ["trace-window"],
          supportCards: ["rez-economy-package"],
          evidenceSignals: ["tag.source", "tag.payoff", "punish.window"],
        }),
      ],
      supportPackages: [
        supportPackage("tag_punish", ["tag-source-anchor"], ["tag.source"], "strong"),
        supportPackage("rez_economy", ["operation-economy"], ["economy.rez"], "medium"),
      ],
      evidence: ["Tag source and payoff anchors are both present."],
    }),
  ];
  const sampleDoctrines = sampleProfiles.map(buildDeckDoctrineFromProfile);
  const tacticalGoalStates = buildMeta1TacticalGoalStates(sampleDoctrines);

  return {
    schemaVersion: META1_DECK_DOCTRINE_TACTICAL_GOAL_ENGINE_SCHEMA_VERSION,
    step: "META1",
    scope: "deck_doctrine_tactical_goal_engine_v0",
    inputBaseline: {
      previousReadiness: "broad_shadow_ready",
      sourceProcess: "AI061-SR-AI068-SR",
      cutoverAllowed: false,
    },
    schemaCoverage: {
      deckStrategicProfileSchema: true,
      deckDoctrineSchema: true,
      tacticalGoalStateSchema: true,
      neutralDoctrineRule: true,
      boardstatePivotRules: META1_PIVOT_RULES.length,
      runnerGoalFamilies: META1_RUNNER_GOAL_FAMILIES.length,
      corpGoalFamilies: META1_CORP_GOAL_FAMILIES.length,
    },
    sampleProfiles,
    sampleDoctrines,
    tacticalGoalStates,
    boardstateOverrideExamples: [...META1_BOARDSTATE_OVERRIDE_EXAMPLES],
    gates: {
      noProductiveActionSelection: true,
      noPlannerWeights: true,
      noRuntimeConsumer: true,
      noHiddenInfoProjection: true,
      neutralDoctrineDoesNotInventStrategy: true,
      boardstateMayOverrideDoctrine: true,
    },
    hardGates: {
      illegalSemanticDecisionCount: 0,
      hiddenInfoViolationCount: 0,
      runtimeConsumerCount: 0,
      actionSelectionCount: 0,
      plannerWeightChangeCount: 0,
    },
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}

export function buildDeckStrategicProfile(params: {
  profileId: string;
  side: SemanticAiSide;
  sourceDeckId?: string;
  primaryStrategies?: readonly StrategyHypothesis[];
  secondaryStrategies?: readonly StrategyHypothesis[];
  supportPackages?: readonly SupportPackage[];
  keyAnchors?: readonly CardAnchorEvidence[];
  missingPieces?: readonly MissingPieceEvidence[];
  riskProfile?: readonly DeckRiskProfile[];
  constraintProfile?: readonly DeckConstraintProfile[];
  evidence?: readonly string[];
  warnings?: readonly string[];
}): DeckStrategicProfile {
  const primaryStrategies = [...(params.primaryStrategies ?? [])];
  const secondaryStrategies = [...(params.secondaryStrategies ?? [])];
  const keyAnchors =
    params.keyAnchors !== undefined
      ? [...params.keyAnchors]
      : anchorsFromStrategies(primaryStrategies, secondaryStrategies);
  const neutralDoctrine =
    primaryStrategies.length === 0 &&
    secondaryStrategies.length === 0 &&
    keyAnchors.filter((anchor) => anchor.anchorKind === "strategy_anchor").length ===
      0;

  return {
    profileId: params.profileId,
    side: params.side,
    ...(params.sourceDeckId !== undefined
      ? { sourceDeckId: params.sourceDeckId }
      : {}),
    primaryStrategies,
    secondaryStrategies,
    supportPackages: [...(params.supportPackages ?? [])],
    keyAnchors,
    missingPieces: [...(params.missingPieces ?? [])],
    riskProfile: [...(params.riskProfile ?? [])],
    constraintProfile: [...(params.constraintProfile ?? [])],
    neutralDoctrine,
    confidence: neutralDoctrine
      ? "low"
      : primaryStrategies.some((strategy) => strategy.confidence === "high")
        ? "high"
        : "medium",
    evidence: [...(params.evidence ?? [])],
    warnings: [
      ...(params.warnings ?? []),
      ...(neutralDoctrine
        ? ["NeutralDoctrine: support packages were not promoted to strategy."]
        : []),
    ],
  };
}

export function buildDeckDoctrineFromProfile(
  profile: DeckStrategicProfile,
): DeckDoctrine {
  const primaryStrategy = profile.primaryStrategies[0];
  const sidePivots = META1_PIVOT_RULES.filter((rule) =>
    rule.targetGoalFamily.startsWith(`${profile.side}_`),
  );

  return {
    doctrineId: `${profile.profileId}.doctrine`,
    side: profile.side,
    strategicProfileId: profile.profileId,
    ...(primaryStrategy !== undefined && !profile.neutralDoctrine
      ? { primaryPlan: strategyPlanForHypothesis(profile.side, primaryStrategy) }
      : {}),
    secondaryPlans: profile.neutralDoctrine
      ? []
      : profile.secondaryStrategies.map((strategy) =>
          strategyPlanForHypothesis(profile.side, strategy),
        ),
    supportPriorities: profile.supportPackages.map((entry) =>
      priorityFromSupportPackage(profile.side, entry),
    ),
    avoidances: avoidancesForSide(profile.side),
    pivotRules: sidePivots,
    earlyGamePriorities: earlyPrioritiesForSide(profile.side, profile.neutralDoctrine),
    midGamePriorities: midPrioritiesForSide(profile.side, profile.neutralDoctrine),
    lateGamePriorities: latePrioritiesForSide(profile.side, profile.neutralDoctrine),
    confidence: profile.confidence,
    neutralDoctrine: profile.neutralDoctrine,
    evidence: [
      `Built from ${profile.profileId}.`,
      ...(profile.neutralDoctrine
        ? ["NeutralDoctrine carries support priorities only."]
        : ["Primary/secondary StrategyPlans derive from StrategyHypothesis evidence."]),
    ],
  };
}

function buildMeta1TacticalGoalStates(
  doctrines: readonly DeckDoctrine[],
): TacticalGoalState[] {
  return doctrines.flatMap((doctrine) => {
    if (doctrine.neutralDoctrine) {
      return doctrine.supportPriorities.map((priority, index) =>
        tacticalGoalState({
          goalInstanceId: `${doctrine.doctrineId}.support.${index + 1}`,
          goalFamily: priority.priorityId,
          ownerSide: doctrine.side,
          priority: priority.priority,
          urgency: "medium",
          doctrineSource: [doctrine.doctrineId, priority.rationale],
          whyActive: ["NeutralDoctrine support priority is side-safe and non-strategic."],
        }),
      );
    }

    const primaryGoals = doctrine.primaryPlan?.goalFamilies ?? [];
    return [
      ...primaryGoals.map((goalFamily, index) =>
        tacticalGoalState({
          goalInstanceId: `${doctrine.doctrineId}.primary.${index + 1}`,
          goalFamily,
          ownerSide: doctrine.side,
          priority: index === 0 ? "high" : "medium",
          urgency: "medium",
          doctrineSource: [doctrine.doctrineId, doctrine.primaryPlan?.strategyId ?? ""],
          progressMarkers: ["doctrine_goal_proposed"],
          whyActive: ["Primary plan proposes this multi-turn TacticalGoalState."],
        }),
      ),
      ...doctrine.pivotRules.map((rule, index) =>
        tacticalGoalState({
          goalInstanceId: `${doctrine.doctrineId}.pivot.${index + 1}`,
          goalFamily: rule.targetGoalFamily,
          ownerSide: doctrine.side,
          priority:
            rule.effect === "force_survival_goal" || rule.effect === "raise_goal_priority"
              ? "critical"
              : "medium",
          urgency: "high",
          doctrineSource: [doctrine.doctrineId, rule.pivotId],
          boardStateEvidence: [rule.trigger],
          blockers:
            rule.effect === "block_goal" ? ["boardstate_blocks_goal"] : [],
          whyActive: [rule.rationale],
          whyBlocked:
            rule.effect === "block_goal"
              ? ["Pivot rule blocks this goal until trigger condition is satisfied."]
              : [],
        }),
      ),
    ];
  });
}

function strategyHypothesis(
  strategyId: string,
  role: StrategyHypothesis["role"],
  confidence: SemanticAiConfidence,
  values: {
    anchorCards?: readonly string[];
    payoffCards?: readonly string[];
    enablerCards?: readonly string[];
    supportCards?: readonly string[];
    evidenceSignals?: readonly string[];
    missingRequirements?: readonly string[];
  },
): StrategyHypothesis {
  return {
    strategyId,
    role,
    confidence,
    anchorCards: [...(values.anchorCards ?? [])],
    payoffCards: [...(values.payoffCards ?? [])],
    enablerCards: [...(values.enablerCards ?? [])],
    supportCards: [...(values.supportCards ?? [])],
    evidenceSignals: [...(values.evidenceSignals ?? [])],
    missingRequirements: [...(values.missingRequirements ?? [])],
  };
}

function supportPackage(
  packageId: SupportPackage["packageId"],
  cards: readonly string[],
  signals: readonly string[],
  strength: SupportPackage["strength"],
): SupportPackage {
  return {
    packageId,
    cards: [...cards],
    signals: [...signals],
    strength,
  };
}

function pivotRule(
  pivotId: string,
  trigger: DoctrinePivotRule["trigger"],
  effect: DoctrinePivotRule["effect"],
  targetGoalFamily: SemanticTacticalGoalFamily,
  rationale: string,
): DoctrinePivotRule {
  return {
    pivotId,
    trigger,
    effect,
    targetGoalFamily,
    rationale,
  };
}

function boardstateOverride(
  exampleId: string,
  side: SemanticAiSide,
  doctrinePreference: SemanticTacticalGoalFamily,
  boardstateOverrideValue: SemanticTacticalGoalFamily,
  pivotRuleId: string,
  rationale: string,
): BoardstateOverrideExample {
  return {
    exampleId,
    side,
    doctrinePreference,
    boardstateOverride: boardstateOverrideValue,
    pivotRuleId,
    rationale,
  };
}

function anchorsFromStrategies(
  primaryStrategies: readonly StrategyHypothesis[],
  secondaryStrategies: readonly StrategyHypothesis[],
): CardAnchorEvidence[] {
  return [...primaryStrategies, ...secondaryStrategies].flatMap((strategy) =>
    strategy.anchorCards.map((cardId) => ({
      cardId,
      anchorKind: "strategy_anchor" as const,
      signals: [...strategy.evidenceSignals],
    })),
  );
}

function strategyPlanForHypothesis(
  side: SemanticAiSide,
  strategy: StrategyHypothesis,
): StrategyPlan {
  return {
    strategyId: strategy.strategyId,
    goalFamilies: goalFamiliesForStrategy(side, strategy.strategyId),
    evidence: [...strategy.evidenceSignals],
  };
}

function goalFamiliesForStrategy(
  side: SemanticAiSide,
  strategyId: string,
): SemanticTacticalGoalFamily[] {
  if (side === "runner" && strategyId.includes("rnd")) {
    return ["runner_pressure_rnd", "runner_access_payoff"];
  }
  if (side === "runner" && strategyId.includes("hq")) {
    return ["runner_pressure_hq", "runner_access_payoff"];
  }
  if (side === "runner") return ["runner_rig_setup", "runner_economy_stabilize"];
  if (strategyId.includes("tag")) {
    return ["corp_tag_runner", "corp_punish_tagged_runner"];
  }
  if (strategyId.includes("remote")) {
    return ["corp_build_remote", "corp_create_score_window", "corp_score_agenda"];
  }
  return ["corp_economy_stabilize", "corp_defend_rnd"];
}

function priorityFromSupportPackage(
  side: SemanticAiSide,
  entry: SupportPackage,
): TacticalPriority {
  return {
    priorityId: supportPackageGoalFamily(side, entry.packageId),
    priority: entry.strength === "strong" ? "high" : "medium",
    rationale: `Support package ${entry.packageId} remains a priority, not a primary strategy.`,
  };
}

function supportPackageGoalFamily(
  side: SemanticAiSide,
  packageId: SupportPackage["packageId"],
): SemanticTacticalGoalFamily {
  if (side === "runner") {
    if (packageId === "draw" || packageId === "search") {
      return "runner_draw_find_tools";
    }
    if (packageId === "breaker_coverage") return "runner_rig_setup";
    if (packageId === "remote_contest") return "runner_contest_remote";
    if (packageId === "central_pressure") return "runner_pressure_rnd";
    if (packageId === "tag_defense") return "runner_remove_tags";
    if (packageId === "damage_defense") return "runner_prevent_damage";
    return "runner_economy_stabilize";
  }
  if (packageId === "ice_tax") return "corp_rez_ice_tax";
  if (packageId === "rez_economy") return "corp_economy_stabilize";
  if (packageId === "score_support") return "corp_score_agenda";
  if (packageId === "tag_punish") return "corp_punish_tagged_runner";
  if (packageId === "damage_kill") return "corp_damage_kill_window";
  if (packageId === "remote_contest") return "corp_defend_rnd";
  return "corp_economy_stabilize";
}

function avoidancesForSide(side: SemanticAiSide): TacticalAvoidance[] {
  if (side === "runner") {
    return [
      {
        avoidanceId: "runner-avoid-low-value-run-under-kill-risk",
        targetGoalFamily: "runner_access_payoff",
        rationale: "Survival and tag removal override low-value access.",
      },
    ];
  }
  return [
    {
      avoidanceId: "corp-avoid-punish-without-tag",
      targetGoalFamily: "corp_punish_tagged_runner",
      rationale: "Tag punish is blocked unless the Runner is tagged.",
    },
  ];
}

function earlyPrioritiesForSide(
  side: SemanticAiSide,
  neutralDoctrine: boolean,
): TacticalPriority[] {
  if (side === "runner") {
    return [
      priority("runner_economy_stabilize", neutralDoctrine ? "medium" : "high"),
      priority("runner_draw_find_tools", "medium"),
    ];
  }
  return [
    priority("corp_economy_stabilize", neutralDoctrine ? "medium" : "high"),
    priority("corp_defend_rnd", "medium"),
  ];
}

function midPrioritiesForSide(
  side: SemanticAiSide,
  neutralDoctrine: boolean,
): TacticalPriority[] {
  if (side === "runner") {
    return [
      priority(neutralDoctrine ? "runner_rig_setup" : "runner_pressure_rnd", "medium"),
      priority("runner_contest_remote", "medium"),
    ];
  }
  return [
    priority(neutralDoctrine ? "corp_defend_hq" : "corp_build_remote", "medium"),
    priority("corp_rez_ice_tax", "medium"),
  ];
}

function latePrioritiesForSide(
  side: SemanticAiSide,
  neutralDoctrine: boolean,
): TacticalPriority[] {
  if (side === "runner") {
    return [
      priority(neutralDoctrine ? "runner_access_payoff" : "runner_pressure_rnd", "high"),
    ];
  }
  return [
    priority(neutralDoctrine ? "corp_defend_rnd" : "corp_score_agenda", "high"),
  ];
}

function priority(
  priorityId: SemanticTacticalGoalFamily,
  priorityValue: TacticalGoalPriority,
): TacticalPriority {
  return {
    priorityId,
    priority: priorityValue,
    rationale: "META1 doctrine priority descriptor.",
  };
}

function tacticalGoalState(params: {
  goalInstanceId: string;
  goalFamily: SemanticTacticalGoalFamily;
  ownerSide: SemanticAiSide;
  priority: TacticalGoalPriority;
  urgency: TacticalGoalPriority;
  doctrineSource: readonly string[];
  boardStateEvidence?: readonly string[];
  progressMarkers?: readonly string[];
  blockers?: readonly string[];
  whyActive: readonly string[];
  whyBlocked?: readonly string[];
}): TacticalGoalState {
  return {
    goalInstanceId: params.goalInstanceId,
    goalFamily: params.goalFamily,
    ownerSide: params.ownerSide,
    lifecycle: params.blockers && params.blockers.length > 0 ? "blocked" : "active",
    priority: params.priority,
    urgency: params.urgency,
    createdOnTurn: 1,
    lastUpdatedOnTurn: 1,
    ttlTurns: 3,
    doctrineSource: [...params.doctrineSource].filter(Boolean),
    boardStateEvidence: [...(params.boardStateEvidence ?? [])],
    requiredConditions: ["engine_legal_action_membership", "side_safe_board_summary"],
    progressMarkers: [...(params.progressMarkers ?? [])],
    blockers: [...(params.blockers ?? [])],
    supportedActionTypes: supportedActionTypesForGoal(params.goalFamily),
    supportedCandidateIds: [],
    successCriteria: successCriteriaForGoal(params.goalFamily),
    failureCriteria: ["expired", "blocked_by_hard_gate", "boardstate_no_longer_supports_goal"],
    whyActive: [...params.whyActive],
    whyBlocked: [...(params.whyBlocked ?? [])],
  };
}

function supportedActionTypesForGoal(
  goalFamily: SemanticTacticalGoalFamily,
): string[] {
  if (goalFamily.includes("economy")) return ["gain_credit", "play_event", "play_operation"];
  if (goalFamily.includes("draw")) return ["draw_card", "mandatory_draw"];
  if (goalFamily.includes("pressure") || goalFamily.includes("contest")) {
    return ["start_run", "continue_run"];
  }
  if (goalFamily.includes("score")) return ["advance_card", "score_agenda"];
  if (goalFamily.includes("defend") || goalFamily.includes("ice")) {
    return ["install_card", "rez_ice"];
  }
  if (goalFamily.includes("tag")) return ["remove_tag", "play_operation"];
  return ["install_card", "activated_card_ability"];
}

function successCriteriaForGoal(goalFamily: SemanticTacticalGoalFamily): string[] {
  if (goalFamily === "runner_remove_tags") return ["runner_tags_reduced_to_zero"];
  if (goalFamily === "corp_score_agenda") return ["agenda_scored_by_engine_action"];
  if (goalFamily.includes("economy")) return ["credit_floor_reached"];
  if (goalFamily.includes("contest")) return ["remote_threat_resolved_or_downgraded"];
  return ["goal_progress_marker_satisfied"];
}
