import type { ActionProjectionIssue } from "./action-semantic-candidate";
import {
  CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  buildShadowEvaluationBatchReport,
  buildShadowScenarioCorpusReport,
  type ShadowActorSide,
  type ShadowEvaluationBatchReport,
  type ShadowModeNoEffectFlags,
  type ShadowScenarioFixture,
} from "./controlled-shadow-mode";

export const SHADOW_READINESS_EXPANSION_PROCESS_SCHEMA_VERSION =
  "shadow-readiness-expansion-process-v1" as const;

export const AI061_SR_TARGET_CONTEXT_EXPANSION_SCHEMA_VERSION =
  "ai061-sr-target-context-projection-expansion-v1" as const;

export const SHADOW_READINESS_EXPANSION_NO_EFFECT_FLAGS =
  CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS;

export type SideSafeTargetContextProjection = {
  scenarioId: string;
  side: ShadowActorSide;
  targetContextStatus: "projected_side_safe";
  selectedTargetSource:
    | "engine_legal_action"
    | "engine_choice_payload"
    | "actor_private_install_context";
  selectedTargetStatus:
    | "explicit_selected_target"
    | "legal_target_options_available"
    | "target_requirements_available";
  legalTargetOptionsStatus: "engine_provided";
  targetProfileMatchStatus:
    | "server_profile_match_side_safe"
    | "card_instance_profile_match_side_safe"
    | "encounter_profile_match_side_safe"
    | "choice_target_profile_match_side_safe";
  hiddenInfoPolicy: "no_hidden_info_projected";
  evidence: string[];
  removedGap: Extract<ActionProjectionIssue, "target_context_unavailable">;
  productiveChangeAllowed: false;
};

export type Ai061SrTargetContextProjectionExpansionReport = {
  schemaVersion: typeof AI061_SR_TARGET_CONTEXT_EXPANSION_SCHEMA_VERSION;
  step: "AI061-SR";
  scope: "target_context_projection_expansion";
  sourceReadinessStatus: "limited_shadow_ready";
  targetContextGapBefore: 13;
  targetContextGapAfter: number;
  projectedTargetContextCount: number;
  hiddenInfoGuardedTargetContextNotProjectedCount: number;
  projections: SideSafeTargetContextProjection[];
  notProjected: Array<{
    scenarioId: string;
    reason: "hidden_info_guard_remains_blocked";
    retainedGaps: ActionProjectionIssue[];
  }>;
  batchAfterTargetContextExpansion: Pick<
    ShadowEvaluationBatchReport,
    "scenarioCount" | "decisionPointCount" | "topSemanticGaps"
  >;
  productiveUseAllowed: false;
  semanticExecutionAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  noEffectFlags: ShadowModeNoEffectFlags;
};

export const AI061_SR_SIDE_SAFE_TARGET_CONTEXT_PROJECTIONS =
  [
    targetProjection(
      "runner_install_program",
      "runner",
      "actor_private_install_context",
      "legal_target_options_available",
      "card_instance_profile_match_side_safe",
      [
        "Runner install source and install slot are actor-private or Engine LegalAction evidence.",
        "No Corp hidden cards or unrezzed ICE details are projected.",
      ],
    ),
    targetProjection(
      "runner_remote_contest",
      "runner",
      "engine_legal_action",
      "explicit_selected_target",
      "server_profile_match_side_safe",
      [
        "Remote server id comes from an Engine LegalAction target.",
        "Remote contents remain unknown unless already legally revealed.",
      ],
    ),
    targetProjection(
      "runner_access_trash_asset",
      "runner",
      "engine_legal_action",
      "explicit_selected_target",
      "card_instance_profile_match_side_safe",
      [
        "Accessed card id comes from the current legal access window.",
        "Only the legally accessed card may be summarized.",
      ],
    ),
    targetProjection(
      "runner_break_subroutine",
      "runner",
      "engine_legal_action",
      "target_requirements_available",
      "encounter_profile_match_side_safe",
      [
        "Encounter target and subroutine references come from Engine LegalActions.",
        "Unrezzed ICE identity, subtype and subroutines remain outside the trace.",
      ],
    ),
    targetProjection(
      "corp_install_ice",
      "corp",
      "engine_legal_action",
      "legal_target_options_available",
      "server_profile_match_side_safe",
      [
        "Install target server comes from Engine LegalAction choices.",
        "Runner hidden cards remain outside Korp shadow diagnostics.",
      ],
    ),
    targetProjection(
      "corp_rez_ice_window",
      "corp",
      "engine_legal_action",
      "explicit_selected_target",
      "encounter_profile_match_side_safe",
      [
        "Rez target is the Engine-provided ICE instance in the paid window.",
        "No Runner hidden grip or stack information is projected.",
      ],
    ),
    targetProjection(
      "corp_advance_agenda",
      "corp",
      "engine_legal_action",
      "explicit_selected_target",
      "card_instance_profile_match_side_safe",
      [
        "Advance target is the Engine LegalAction card instance.",
        "The projection does not infer hidden Runner response options.",
      ],
    ),
    targetProjection(
      "corp_score_agenda",
      "corp",
      "engine_legal_action",
      "explicit_selected_target",
      "card_instance_profile_match_side_safe",
      [
        "Score target is already made legal by the Rules Engine.",
        "No extra agenda legality or scoring state is generated.",
      ],
    ),
    targetProjection(
      "corp_remote_score_window",
      "corp",
      "engine_legal_action",
      "legal_target_options_available",
      "server_profile_match_side_safe",
      [
        "Remote score-window targets are limited to Engine LegalAction targets.",
        "Runner hidden response data is not projected.",
      ],
    ),
    targetProjection(
      "corp_defend_hq",
      "corp",
      "engine_legal_action",
      "legal_target_options_available",
      "server_profile_match_side_safe",
      [
        "HQ defense target comes from Engine-provided server choices.",
        "Runner hidden cards remain hidden.",
      ],
    ),
    targetProjection(
      "corp_defend_rnd",
      "corp",
      "engine_legal_action",
      "legal_target_options_available",
      "server_profile_match_side_safe",
      [
        "R&D defense target comes from Engine-provided server choices.",
        "Runner hidden cards remain hidden.",
      ],
    ),
    targetProjection(
      "multi_target_choice",
      "runner",
      "engine_choice_payload",
      "legal_target_options_available",
      "choice_target_profile_match_side_safe",
      [
        "Choice targets are available only when the Engine payload lists them.",
        "The shadow layer does not reconstruct target lists from board state.",
      ],
    ),
    targetProjection(
      "source_target_advancement_counter",
      "corp",
      "engine_choice_payload",
      "target_requirements_available",
      "choice_target_profile_match_side_safe",
      [
        "Source and target references remain tied to Engine LegalAction payload fields.",
        "No hidden card identity is inferred from advancement-counter context.",
      ],
    ),
  ] as const satisfies readonly SideSafeTargetContextProjection[];

export function buildFixturesAfterTargetContextProjection(
  fixtures: readonly ShadowScenarioFixture[] =
    buildShadowScenarioCorpusReport().fixtures,
): ShadowScenarioFixture[] {
  return removeGapForProjectedScenarios(
    fixtures,
    "target_context_unavailable",
    new Set(
      AI061_SR_SIDE_SAFE_TARGET_CONTEXT_PROJECTIONS.map(
        (projection) => projection.scenarioId,
      ),
    ),
  );
}

export function buildAi061SrTargetContextProjectionExpansionReport(
  fixtures: readonly ShadowScenarioFixture[] =
    buildShadowScenarioCorpusReport().fixtures,
): Ai061SrTargetContextProjectionExpansionReport {
  const expandedFixtures = buildFixturesAfterTargetContextProjection(fixtures);
  const batch = buildShadowEvaluationBatchReport(expandedFixtures);
  const targetGapAfter =
    batch.topSemanticGaps.find(
      (gap) => gap.gapId === "target_context_unavailable",
    )?.count ?? 0;
  const notProjected = expandedFixtures
    .filter(
      (fixture) =>
        fixture.scenarioId === "corp_ambush_or_remote_bait" &&
        fixture.knownProjectionGaps.includes("hidden_info_blocked"),
    )
    .map((fixture) => ({
      scenarioId: fixture.scenarioId,
      reason: "hidden_info_guard_remains_blocked" as const,
      retainedGaps: [...fixture.knownProjectionGaps],
    }));

  return {
    schemaVersion: AI061_SR_TARGET_CONTEXT_EXPANSION_SCHEMA_VERSION,
    step: "AI061-SR",
    scope: "target_context_projection_expansion",
    sourceReadinessStatus: "limited_shadow_ready",
    targetContextGapBefore: 13,
    targetContextGapAfter: targetGapAfter,
    projectedTargetContextCount:
      AI061_SR_SIDE_SAFE_TARGET_CONTEXT_PROJECTIONS.length,
    hiddenInfoGuardedTargetContextNotProjectedCount: notProjected.length,
    projections: [...AI061_SR_SIDE_SAFE_TARGET_CONTEXT_PROJECTIONS],
    notProjected,
    batchAfterTargetContextExpansion: {
      scenarioCount: batch.scenarioCount,
      decisionPointCount: batch.decisionPointCount,
      topSemanticGaps: [...batch.topSemanticGaps],
    },
    productiveUseAllowed: false,
    semanticExecutionAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    noEffectFlags: SHADOW_READINESS_EXPANSION_NO_EFFECT_FLAGS,
  };
}

function targetProjection(
  scenarioId: string,
  side: ShadowActorSide,
  selectedTargetSource: SideSafeTargetContextProjection["selectedTargetSource"],
  selectedTargetStatus: SideSafeTargetContextProjection["selectedTargetStatus"],
  targetProfileMatchStatus: SideSafeTargetContextProjection["targetProfileMatchStatus"],
  evidence: string[],
): SideSafeTargetContextProjection {
  return {
    scenarioId,
    side,
    targetContextStatus: "projected_side_safe",
    selectedTargetSource,
    selectedTargetStatus,
    legalTargetOptionsStatus: "engine_provided",
    targetProfileMatchStatus,
    hiddenInfoPolicy: "no_hidden_info_projected",
    evidence,
    removedGap: "target_context_unavailable",
    productiveChangeAllowed: false,
  };
}

function removeGapForProjectedScenarios(
  fixtures: readonly ShadowScenarioFixture[],
  gap: ActionProjectionIssue,
  projectedScenarioIds: ReadonlySet<string>,
): ShadowScenarioFixture[] {
  return fixtures.map((fixture) =>
    projectedScenarioIds.has(fixture.scenarioId)
      ? copyFixtureWithGaps(
          fixture,
          fixture.knownProjectionGaps.filter(
            (projectionGap) => projectionGap !== gap,
          ),
        )
      : copyFixtureWithGaps(fixture, fixture.knownProjectionGaps),
  );
}

function copyFixtureWithGaps(
  fixture: ShadowScenarioFixture,
  knownProjectionGaps: readonly ActionProjectionIssue[],
): ShadowScenarioFixture {
  return {
    scenarioId: fixture.scenarioId,
    side: fixture.side,
    description: fixture.description,
    setupKind: fixture.setupKind,
    ...(fixture.stateRef !== undefined ? { stateRef: fixture.stateRef } : {}),
    expectedLegalActionTypes: [...fixture.expectedLegalActionTypes],
    expectedTacticalGoals: [...fixture.expectedTacticalGoals],
    requiredCandidateFields: [...fixture.requiredCandidateFields],
    knownProjectionGaps: [...knownProjectionGaps],
    hiddenInfoBoundary: [...fixture.hiddenInfoBoundary],
    allowedShadow: fixture.allowedShadow,
    ...(fixture.reasonIfDisabled !== undefined
      ? { reasonIfDisabled: fixture.reasonIfDisabled }
      : {}),
  };
}
