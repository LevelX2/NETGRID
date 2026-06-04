import type {
  ActionGateId,
  ActionGateResult,
  ActionProjectionIssue,
} from "./action-semantic-candidate";
import {
  DIAGNOSTIC_NO_EFFECT_FLAGS,
  type DiagnosticNoEffectFlags,
  type TacticalGoalFamily,
} from "./action-doctrine-goal-diagnostics";

export const SHADOW_SCORING_FIXTURE_DESIGN_SCHEMA_VERSION =
  "shadow-scoring-fixture-design-v1" as const;

export type ShadowFixtureSide = "runner" | "corp";

export type ShadowFixtureHiddenInfoPolicy =
  | "public_or_actor_private_only"
  | "engine_provided_targets_only"
  | "hidden_info_blocked";

export type ShadowFixtureLegalActionRef = {
  actionRef: string;
  actionType: string;
  semanticActionType: string;
  knownGaps: ActionProjectionIssue[];
};

export type ShadowScoringFixtureScenario = {
  scenarioId: string;
  side: ShadowFixtureSide;
  boardSituationSummary: string;
  availableLegalActions: ShadowFixtureLegalActionRef[];
  expectedRelevantGoals: TacticalGoalFamily[];
  knownGaps: ActionProjectionIssue[];
  hiddenInfoPolicy: ShadowFixtureHiddenInfoPolicy;
  legacySelectedAction?: string;
  semanticShadowAllowed: boolean;
};

export type ShadowScoringInputPolicy = {
  allowedScoringInputs: string[];
  forbiddenScoringInputs: string[];
};

export type ShadowHardGateMatrixEntry = {
  gateId: ActionGateId;
  requiredFor:
    | "all_candidates"
    | "target_sensitive_goals"
    | "multi_ability_card_scoring"
    | "cost_sensitive_scoring"
    | "timing_sensitive_scoring";
  passPolicy: "must_pass" | "required_when_applicable";
  unknownPolicy: "score_status_blocked_by_gap" | "report_only_allowed";
  blockPolicy: "score_status_blocked_by_gate";
  evidence: string[];
};

export type ShadowScoreDraftStatus =
  | "not_scored"
  | "blocked_by_gate"
  | "blocked_by_gap"
  | "score_draft_available";

export type ShadowActionScoreDraft = {
  candidateId: string;
  scenarioId: string;
  scoreStatus: ShadowScoreDraftStatus;
  goalMatches: string[];
  hardGateResults: ActionGateResult[];
  positiveEvidence: string[];
  negativeEvidence: string[];
  riskEvidence: string[];
  missingEvidence: string[];
};

export type ShadowScoreDraftSchemaDescriptor = {
  typeName: "ShadowActionScoreDraft";
  fields: Array<keyof ShadowActionScoreDraft>;
  forbiddenFields: string[];
};

export type ShadowScoringFixtureDesignSummary = {
  fixtureCount: number;
  runnerFixtureCount: number;
  corpFixtureCount: number;
  semanticShadowAllowedCount: number;
  knownGapCategories: ActionProjectionIssue[];
};

export type ShadowScoringFixtureDesignReport = {
  schemaVersion: typeof SHADOW_SCORING_FIXTURE_DESIGN_SCHEMA_VERSION;
  scope: "shadow_fixture_design_only";
  fixtureCorpus: ShadowScoringFixtureScenario[];
  inputPolicy: ShadowScoringInputPolicy;
  hardGateMatrix: ShadowHardGateMatrixEntry[];
  scoreDraftSchema: ShadowScoreDraftSchemaDescriptor;
  blockedGapPolicy: {
    scoreStatus: Extract<ShadowScoreDraftStatus, "blocked_by_gap">;
    topGaps: ActionProjectionIssue[];
    rule: string;
  };
  recommendedAI048Scope: string[];
  summary: ShadowScoringFixtureDesignSummary;
  productiveUseAllowed: false;
  noEffectFlags: DiagnosticNoEffectFlags;
};

export const DEFAULT_SHADOW_SCORING_FIXTURE_CORPUS = [
  runnerFixture("ai047-runner-economy-stabilize", "Runner credits are low and basic economy actions are legal.", ["runner_economy_stabilize"], [
    actionRef("gain_credit", "gain_credit", "economy.gain_credit"),
    actionRef("draw_card", "draw_card", "draw.card"),
  ]),
  runnerFixture("ai047-runner-rig-setup-install-program", "Runner can install a visible program but card semantics are partial.", ["runner_rig_setup"], [
    actionRef("install_program", "install_card", "install.card", [
      "card_semantics_unavailable",
    ]),
  ], ["card_semantics_unavailable"]),
  runnerFixture("ai047-runner-central-pressure", "Runner has a central run option with engine-provided server target.", ["runner_central_pressure"], [
    actionRef("run_hq", "start_run", "run.start"),
    actionRef("run_rd", "start_run", "run.start"),
  ]),
  runnerFixture("ai047-runner-remote-contest", "Runner sees a remote threat but target details may be unavailable.", ["runner_remote_contest"], [
    actionRef("run_remote", "start_run", "run.start", [
      "target_context_unavailable",
    ]),
  ], ["target_context_unavailable"]),
  runnerFixture("ai047-runner-survival", "Runner is tagged or under visible damage threat.", ["runner_survival"], [
    actionRef("remove_tag", "remove_tag", "tag.remove"),
    actionRef("draw_card", "draw_card", "draw.card"),
  ]),
  runnerFixture("ai047-runner-access-decision", "Runner is resolving access with steal/trash/decline branches.", ["runner_remote_contest"], [
    actionRef("steal_agenda", "steal_agenda", "access.steal_agenda"),
    actionRef("trash_accessed_card", "trash_accessed_card", "access.trash_accessed_card", [
      "target_context_unavailable",
    ]),
    actionRef("decline_trash", "decline_trash", "access.decline_trash"),
  ], ["target_context_unavailable"]),
  runnerFixture("ai047-runner-run-continuation", "Runner is in a run continuation window with continue, jack out and breaker actions.", ["runner_central_pressure", "runner_survival"], [
    actionRef("continue_run", "continue_run", "run.continue"),
    actionRef("jack_out", "jack_out", "run.jack_out"),
    actionRef("break_subroutine", "break_subroutine", "breaker.break_subroutine", [
      "ability_unresolved",
    ]),
  ], ["ability_unresolved"]),
  corpFixture("ai047-corp-economy-stabilize", "Corp has low credits and basic economy actions are legal.", ["corp_economy_stabilize"], [
    actionRef("gain_credit", "gain_credit", "economy.gain_credit"),
    actionRef("draw_card", "draw_card", "draw.card"),
  ]),
  corpFixture("ai047-corp-remote-score-window", "Corp has a possible remote score line with target context still required.", ["corp_remote_score_window"], [
    actionRef("advance_card", "advance_card", "score.advance_card", [
      "target_context_unavailable",
    ]),
    actionRef("score_agenda", "score_agenda", "score.agenda", [
      "target_context_unavailable",
    ]),
  ], ["target_context_unavailable"]),
  corpFixture("ai047-corp-central-defense", "Corp can install or rez central protection.", ["corp_central_defense"], [
    actionRef("install_ice_hq", "install_card", "install.card", [
      "target_context_unavailable",
    ]),
    actionRef("rez_ice", "rez_ice", "corp_window.rez"),
  ], ["target_context_unavailable"]),
  corpFixture("ai047-corp-ice-tax-rez-window", "Corp is in a rez window and ICE tax diagnostics need target/ability evidence.", ["corp_ice_tax"], [
    actionRef("rez_ice", "rez_ice", "corp_window.rez"),
    actionRef("decline_rez", "decline_rez", "corp_window.decline_rez"),
  ]),
  corpFixture("ai047-corp-tag-trace-punish", "Corp has a visible tag or trace punish line but ability evidence may be unresolved.", ["corp_tag_trace_punish"], [
    actionRef("play_operation", "play_operation", "play.corp_operation", [
      "ability_unresolved",
    ]),
  ], ["ability_unresolved"]),
  corpFixture("ai047-corp-advance-score", "Corp compares advance and score branches without selecting an action.", ["corp_remote_score_window"], [
    actionRef("advance_card", "advance_card", "score.advance_card", [
      "target_context_unavailable",
    ]),
    actionRef("score_agenda", "score_agenda", "score.agenda", [
      "target_context_unavailable",
    ]),
  ], ["target_context_unavailable"]),
  corpFixture("ai047-corp-ambush-access-punish", "Corp ambush/access-punish context is only side-safe when hidden info stays blocked.", ["corp_tag_trace_punish"], [
    actionRef("trigger_ability", "trigger_ability", "card_ability.trigger", [
      "ability_unresolved",
      "hidden_info_blocked",
    ]),
  ], ["ability_unresolved", "hidden_info_blocked"], "hidden_info_blocked", false),
] as const satisfies readonly ShadowScoringFixtureScenario[];

export const DEFAULT_SHADOW_SCORING_INPUT_POLICY = {
  allowedScoringInputs: [
    "action.semanticActionType",
    "action.cardContextSignals",
    "action.actionTacticSignals",
    "action.strategySupport",
    "action.conditions",
    "action.risks",
    "action.constraints",
    "action.costProfile",
    "action.timingProfile",
    "action.targetContext.engine_provided_only",
    "action.boardContext",
    "action.hardGates",
    "TacticalGoal.evidence",
    "DeckDoctrineV2.readiness",
  ],
  forbiddenScoringInputs: [
    "full_game_state",
    "opponent_hidden_cards",
    "non_side_safe_targets",
    "non_engine_provided_target_options",
    "legacy_plan_role_as_truth",
    "freeform_guessed_scores",
  ],
} as const satisfies ShadowScoringInputPolicy;

export const DEFAULT_SHADOW_HARD_GATE_MATRIX = [
  hardGate("engine_legal_action", "all_candidates", "must_pass"),
  hardGate("hidden_info", "all_candidates", "must_pass"),
  hardGate("side_visibility", "all_candidates", "must_pass"),
  hardGate("runtime_no_effect", "all_candidates", "must_pass"),
  hardGate("target_context", "target_sensitive_goals", "required_when_applicable"),
  hardGate(
    "ability_resolution",
    "multi_ability_card_scoring",
    "required_when_applicable",
  ),
  hardGate("cost_known", "cost_sensitive_scoring", "required_when_applicable"),
  hardGate("timing_known", "timing_sensitive_scoring", "required_when_applicable"),
] as const satisfies readonly ShadowHardGateMatrixEntry[];

export const SHADOW_SCORE_DRAFT_SCHEMA_DESCRIPTOR = {
  typeName: "ShadowActionScoreDraft",
  fields: [
    "candidateId",
    "scenarioId",
    "scoreStatus",
    "goalMatches",
    "hardGateResults",
    "positiveEvidence",
    "negativeEvidence",
    "riskEvidence",
    "missingEvidence",
  ],
  forbiddenFields: ["liveScore", "runtimeRank", "selectedAction"],
} as const satisfies ShadowScoreDraftSchemaDescriptor;

export function buildShadowScoringFixtureDesignReport(
  fixtureCorpus: readonly ShadowScoringFixtureScenario[] =
    DEFAULT_SHADOW_SCORING_FIXTURE_CORPUS,
): ShadowScoringFixtureDesignReport {
  const copiedFixtureCorpus = fixtureCorpus.map(copyFixtureScenario);

  return {
    schemaVersion: SHADOW_SCORING_FIXTURE_DESIGN_SCHEMA_VERSION,
    scope: "shadow_fixture_design_only",
    fixtureCorpus: copiedFixtureCorpus,
    inputPolicy: {
      allowedScoringInputs: [
        ...DEFAULT_SHADOW_SCORING_INPUT_POLICY.allowedScoringInputs,
      ],
      forbiddenScoringInputs: [
        ...DEFAULT_SHADOW_SCORING_INPUT_POLICY.forbiddenScoringInputs,
      ],
    },
    hardGateMatrix: DEFAULT_SHADOW_HARD_GATE_MATRIX.map((entry) => ({
      ...entry,
      evidence: [...entry.evidence],
    })),
    scoreDraftSchema: {
      typeName: SHADOW_SCORE_DRAFT_SCHEMA_DESCRIPTOR.typeName,
      fields: [...SHADOW_SCORE_DRAFT_SCHEMA_DESCRIPTOR.fields],
      forbiddenFields: [...SHADOW_SCORE_DRAFT_SCHEMA_DESCRIPTOR.forbiddenFields],
    },
    blockedGapPolicy: {
      scoreStatus: "blocked_by_gap",
      topGaps: [
        "target_context_unavailable",
        "ability_unresolved",
        "card_semantics_unavailable",
      ],
      rule:
        "Required unknown or partial gates may appear in the report, but no draft score is available.",
    },
    recommendedAI048Scope: [
      "report-only shadow ordering",
      "goal alignment explanations",
      "hard gate failures",
      "unresolved gap buckets",
      "legacy action reference when already available",
    ],
    summary: summarizeFixtureDesign(copiedFixtureCorpus),
    productiveUseAllowed: false,
    noEffectFlags: DIAGNOSTIC_NO_EFFECT_FLAGS,
  };
}

function runnerFixture(
  scenarioId: string,
  boardSituationSummary: string,
  expectedRelevantGoals: TacticalGoalFamily[],
  availableLegalActions: ShadowFixtureLegalActionRef[],
  knownGaps: ActionProjectionIssue[] = [],
  hiddenInfoPolicy: ShadowFixtureHiddenInfoPolicy =
    "public_or_actor_private_only",
  semanticShadowAllowed = true,
): ShadowScoringFixtureScenario {
  return {
    scenarioId,
    side: "runner",
    boardSituationSummary,
    availableLegalActions,
    expectedRelevantGoals,
    knownGaps,
    hiddenInfoPolicy,
    semanticShadowAllowed,
  };
}

function corpFixture(
  scenarioId: string,
  boardSituationSummary: string,
  expectedRelevantGoals: TacticalGoalFamily[],
  availableLegalActions: ShadowFixtureLegalActionRef[],
  knownGaps: ActionProjectionIssue[] = [],
  hiddenInfoPolicy: ShadowFixtureHiddenInfoPolicy =
    "public_or_actor_private_only",
  semanticShadowAllowed = true,
): ShadowScoringFixtureScenario {
  return {
    scenarioId,
    side: "corp",
    boardSituationSummary,
    availableLegalActions,
    expectedRelevantGoals,
    knownGaps,
    hiddenInfoPolicy,
    semanticShadowAllowed,
  };
}

function actionRef(
  actionRefId: string,
  actionType: string,
  semanticActionType: string,
  knownGaps: ActionProjectionIssue[] = [],
): ShadowFixtureLegalActionRef {
  return {
    actionRef: actionRefId,
    actionType,
    semanticActionType,
    knownGaps,
  };
}

function hardGate(
  gateId: ActionGateId,
  requiredFor: ShadowHardGateMatrixEntry["requiredFor"],
  passPolicy: ShadowHardGateMatrixEntry["passPolicy"],
): ShadowHardGateMatrixEntry {
  return {
    gateId,
    requiredFor,
    passPolicy,
    unknownPolicy:
      passPolicy === "must_pass"
        ? "score_status_blocked_by_gap"
        : "report_only_allowed",
    blockPolicy: "score_status_blocked_by_gate",
    evidence: [`AI047 hard gate matrix: ${gateId}`],
  };
}

function copyFixtureScenario(
  scenario: ShadowScoringFixtureScenario,
): ShadowScoringFixtureScenario {
  return {
    scenarioId: scenario.scenarioId,
    side: scenario.side,
    boardSituationSummary: scenario.boardSituationSummary,
    availableLegalActions: scenario.availableLegalActions.map((action) => ({
      actionRef: action.actionRef,
      actionType: action.actionType,
      semanticActionType: action.semanticActionType,
      knownGaps: [...action.knownGaps],
    })),
    expectedRelevantGoals: [...scenario.expectedRelevantGoals],
    knownGaps: [...scenario.knownGaps],
    hiddenInfoPolicy: scenario.hiddenInfoPolicy,
    ...(scenario.legacySelectedAction !== undefined
      ? { legacySelectedAction: scenario.legacySelectedAction }
      : {}),
    semanticShadowAllowed: scenario.semanticShadowAllowed,
  };
}

function summarizeFixtureDesign(
  fixtureCorpus: readonly ShadowScoringFixtureScenario[],
): ShadowScoringFixtureDesignSummary {
  return {
    fixtureCount: fixtureCorpus.length,
    runnerFixtureCount: fixtureCorpus.filter(
      (scenario) => scenario.side === "runner",
    ).length,
    corpFixtureCount: fixtureCorpus.filter((scenario) => scenario.side === "corp")
      .length,
    semanticShadowAllowedCount: fixtureCorpus.filter(
      (scenario) => scenario.semanticShadowAllowed,
    ).length,
    knownGapCategories: uniqueProjectionIssues(
      fixtureCorpus.flatMap((scenario) => scenario.knownGaps),
    ),
  };
}

function uniqueProjectionIssues(
  values: readonly ActionProjectionIssue[],
): ActionProjectionIssue[] {
  return [...new Set(values)];
}
