import type { LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  findForbiddenSemanticPath,
  redactSemanticString,
} from "../diagnostics/semantic-redaction";
import type { AiOpportunityProjection } from "./opportunity-projection";
import type { TacticalGoalUtilityFamily } from "./tactical-goal-utility";
import type { AiThreatProjection } from "./threat-projection";

export const TARGET_CHOICE_SHADOW_SCHEMA_VERSION =
  "target-choice-shadow-v1" as const;

export type TargetChoiceShadowOptionKind = "choice_option" | "target_option";

export type TargetChoiceShadowOption = {
  requirementId: string;
  optionId: string;
  kind: TargetChoiceShadowOptionKind;
  rank: number;
  score: number;
  evidence: string[];
};

export type TargetChoiceShadowBlockedRequirement = {
  requirementId: string;
  kind: "choice" | LegalAction["targetRequirements"][number]["kind"];
  reason: "engine_only_target" | "no_side_safe_options";
  evidence: string[];
};

export type TargetChoiceShadowScorecardV2 = {
  version: "target-choice-shadow-scorecard-v2";
  coverageStatus: "covered" | "partial" | "blocked" | "empty";
  optionCount: number;
  choiceOptionCount: number;
  targetOptionCount: number;
  blockedRequirementCount: number;
  engineOnlyBlockedCount: number;
  noSideSafeOptionsBlockedCount: number;
  topOption:
    | {
        requirementId: string;
        optionId: string;
        kind: TargetChoiceShadowOptionKind;
        score: number;
      }
    | undefined;
  contextSignalCounts: {
    contextScoredOptions: number;
    preferredOptions: number;
    avoidedOptions: number;
    utilityLinkedOptions: number;
    opportunityLinkedOptions: number;
    threatLinkedOptions: number;
  };
  productiveUseAllowed: false;
  noRuntimeEffect: true;
  evidence: string[];
};

export type TargetChoiceShadowReport = {
  schemaVersion: typeof TARGET_CHOICE_SHADOW_SCHEMA_VERSION;
  scope: "target_choice_shadow_report_only";
  actionId: string;
  actionType: LegalAction["type"];
  side: LegalAction["side"];
  rankedOptions: TargetChoiceShadowOption[];
  blockedRequirements: TargetChoiceShadowBlockedRequirement[];
  scorecard: TargetChoiceShadowScorecardV2;
  selectionOutput: {
    selectedChoicesCreated: false;
    selectedTargetsCreated: false;
  };
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  evidence: string[];
};

export type BuildTargetChoiceShadowReportParams = {
  action: LegalAction;
  candidate?: ActionSemanticCandidate;
  preferredOptionIds?: readonly string[];
  avoidOptionIds?: readonly string[];
  sideSafeTargetIdsByRequirementId?: Readonly<Record<string, readonly string[]>>;
  utilityFamilies?: readonly TacticalGoalUtilityFamily[];
  threats?: readonly AiThreatProjection[];
  opportunities?: readonly AiOpportunityProjection[];
};

export function buildTargetChoiceShadowReport(
  params: BuildTargetChoiceShadowReportParams,
): TargetChoiceShadowReport {
  const preferred = new Set((params.preferredOptionIds ?? []).map(safe));
  const avoid = new Set((params.avoidOptionIds ?? []).map(safe));
  const rankedOptions = rankOptions([
    ...choiceOptions(params.action, preferred, avoid),
    ...targetOptions(params, preferred, avoid),
  ]);
  const blocked = blockedRequirements(params);
  const scorecard = buildTargetChoiceShadowScorecardV2(rankedOptions, blocked);
  const report: TargetChoiceShadowReport = {
    schemaVersion: TARGET_CHOICE_SHADOW_SCHEMA_VERSION,
    scope: "target_choice_shadow_report_only",
    actionId: safe(params.action.actionId),
    actionType: params.action.type,
    side: params.action.side,
    rankedOptions,
    blockedRequirements: blocked,
    scorecard,
    selectionOutput: {
      selectedChoicesCreated: false,
      selectedTargetsCreated: false,
    },
    productiveUseAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    evidence: [
      "target_choice_shadow:report_only",
      `ranked_option_count:${rankedOptions.length}`,
      `scorecard_version:${scorecard.version}`,
      `scorecard_coverage_status:${scorecard.coverageStatus}`,
      "selected_choices_created:false",
      "selected_targets_created:false",
    ],
  };
  assertTargetChoiceShadowReportSideSafe(report);
  return report;
}

function choiceOptions(
  action: LegalAction,
  preferred: ReadonlySet<string>,
  avoid: ReadonlySet<string>,
): TargetChoiceShadowOption[] {
  return (action.choiceRequirements ?? []).flatMap((requirement) =>
    requirement.optionIds.map((optionId, index) =>
      option(
        requirement.choiceId,
        optionId,
        "choice_option",
        index,
        preferred,
        avoid,
        [
          `choice_id:${safe(requirement.choiceId)}`,
          `min_selections:${requirement.minSelections}`,
          `max_selections:${requirement.maxSelections}`,
        ],
      ),
    ),
  );
}

function targetOptions(
  params: BuildTargetChoiceShadowReportParams,
  preferred: ReadonlySet<string>,
  avoid: ReadonlySet<string>,
): TargetChoiceShadowOption[] {
  return [
    ...params.action.targetRequirements.flatMap((requirement) => {
      if (requirement.visibility === "engine_only") return [];
      const targetOptions = targetOptionIdsForRequirement(params, requirement);
      return targetOptions.optionIds.map((optionId, index) =>
        option(
          requirement.id,
          optionId,
          "target_option",
          index,
          preferred,
          avoid,
          [
            `target_requirement_kind:${requirement.kind}`,
            `target_requirement_side:${requirement.side ?? "unknown"}`,
            ...targetOptions.evidence,
          ],
          targetContextScore(params, optionId),
        ),
      );
    }),
    ...payloadTargetOptions(params, preferred, avoid),
  ];
}

function option(
  requirementId: string,
  optionId: string,
  kind: TargetChoiceShadowOptionKind,
  index: number,
  preferred: ReadonlySet<string>,
  avoid: ReadonlySet<string>,
  evidence: readonly string[],
  contextScore: TargetChoiceShadowContextScore = { scoreDelta: 0, evidence: [] },
): TargetChoiceShadowOption {
  const safeOptionId = safe(optionId);
  const preferenceBonus = preferred.has(safeOptionId) ? 25 : 0;
  const avoidPenalty = avoid.has(safeOptionId) ? 25 : 0;
  const orderPenalty = kind === "choice_option" ? index : 0;
  return {
    requirementId: safe(requirementId),
    optionId: safeOptionId,
    kind,
    rank: 0,
    score:
      100 -
      orderPenalty +
      targetShapeBonus(safeOptionId) +
      preferenceBonus -
      avoidPenalty +
      contextScore.scoreDelta,
    evidence: [
      ...evidence.map(safe),
      ...contextScore.evidence.map(safe),
      `context_score_delta:${contextScore.scoreDelta}`,
      `preferred:${preferenceBonus > 0}`,
      `avoid:${avoidPenalty > 0}`,
    ],
  };
}

function rankOptions(
  options: readonly TargetChoiceShadowOption[],
): TargetChoiceShadowOption[] {
  return [...options]
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.requirementId.localeCompare(right.requirementId) ||
        left.optionId.localeCompare(right.optionId),
    )
    .map((option, index) => ({ ...option, rank: index + 1 }));
}

function blockedRequirements(
  params: BuildTargetChoiceShadowReportParams,
): TargetChoiceShadowBlockedRequirement[] {
  const blocked: TargetChoiceShadowBlockedRequirement[] = [];
  for (const requirement of params.action.targetRequirements) {
    if (requirement.visibility === "engine_only") {
      blocked.push({
        requirementId: safe(requirement.id),
        kind: requirement.kind,
        reason: "engine_only_target",
        evidence: ["target_requirement_visibility:engine_only"],
      });
      continue;
    }
    const targetOptions = targetOptionIdsForRequirement(params, requirement);
    if (targetOptions.optionIds.length === 0) {
      blocked.push({
        requirementId: safe(requirement.id),
        kind: requirement.kind,
        reason: "no_side_safe_options",
        evidence: ["target_requirement_options:none", ...targetOptions.evidence],
      });
    }
  }
  for (const requirement of params.action.choiceRequirements ?? []) {
    if (requirement.optionIds.length > 0) continue;
    blocked.push({
      requirementId: safe(requirement.choiceId),
      kind: "choice",
      reason: "no_side_safe_options",
      evidence: ["choice_requirement_options:none"],
    });
  }
  return blocked.sort(
    (left, right) =>
      left.requirementId.localeCompare(right.requirementId) ||
      left.reason.localeCompare(right.reason),
  );
}

function buildTargetChoiceShadowScorecardV2(
  rankedOptions: readonly TargetChoiceShadowOption[],
  blocked: readonly TargetChoiceShadowBlockedRequirement[],
): TargetChoiceShadowScorecardV2 {
  const topOption = rankedOptions[0];
  const scorecard: TargetChoiceShadowScorecardV2 = {
    version: "target-choice-shadow-scorecard-v2",
    coverageStatus: targetChoiceCoverageStatus(rankedOptions, blocked),
    optionCount: rankedOptions.length,
    choiceOptionCount: rankedOptions.filter(
      (option) => option.kind === "choice_option",
    ).length,
    targetOptionCount: rankedOptions.filter(
      (option) => option.kind === "target_option",
    ).length,
    blockedRequirementCount: blocked.length,
    engineOnlyBlockedCount: blocked.filter(
      (requirement) => requirement.reason === "engine_only_target",
    ).length,
    noSideSafeOptionsBlockedCount: blocked.filter(
      (requirement) => requirement.reason === "no_side_safe_options",
    ).length,
    topOption: topOption
      ? {
          requirementId: topOption.requirementId,
          optionId: topOption.optionId,
          kind: topOption.kind,
          score: topOption.score,
        }
      : undefined,
    contextSignalCounts: {
      contextScoredOptions: rankedOptions.filter((option) =>
        hasNonZeroContextScore(option),
      ).length,
      preferredOptions: optionsWithEvidence(rankedOptions, "preferred:true"),
      avoidedOptions: optionsWithEvidence(rankedOptions, "avoid:true"),
      utilityLinkedOptions: optionsWithEvidencePrefix(
        rankedOptions,
        "utility_family:",
      ),
      opportunityLinkedOptions: optionsWithEvidencePrefix(
        rankedOptions,
        "opportunity:",
      ),
      threatLinkedOptions: optionsWithEvidencePrefix(rankedOptions, "threat:"),
    },
    productiveUseAllowed: false,
    noRuntimeEffect: true,
    evidence: [
      "target_choice_shadow_scorecard:report_only",
      `coverage_status:${targetChoiceCoverageStatus(rankedOptions, blocked)}`,
      `option_count:${rankedOptions.length}`,
      `blocked_requirement_count:${blocked.length}`,
    ],
  };
  return scorecard;
}

function targetChoiceCoverageStatus(
  rankedOptions: readonly TargetChoiceShadowOption[],
  blocked: readonly TargetChoiceShadowBlockedRequirement[],
): TargetChoiceShadowScorecardV2["coverageStatus"] {
  if (rankedOptions.length > 0 && blocked.length === 0) return "covered";
  if (rankedOptions.length > 0) return "partial";
  if (blocked.length > 0) return "blocked";
  return "empty";
}

function hasNonZeroContextScore(option: TargetChoiceShadowOption): boolean {
  return option.evidence.some(
    (entry) =>
      entry.startsWith("context_score_delta:") &&
      entry !== "context_score_delta:0",
  );
}

function optionsWithEvidence(
  options: readonly TargetChoiceShadowOption[],
  evidence: string,
): number {
  return options.filter((option) => option.evidence.includes(evidence)).length;
}

function optionsWithEvidencePrefix(
  options: readonly TargetChoiceShadowOption[],
  prefix: string,
): number {
  return options.filter((option) =>
    option.evidence.some((entry) => entry.startsWith(prefix)),
  ).length;
}

function targetShapeBonus(optionId: string): number {
  if (optionId === "hq" || optionId === "rd") return 10;
  if (optionId.startsWith("remote_")) return 5;
  return 0;
}

type TargetChoiceShadowContextScore = {
  scoreDelta: number;
  evidence: string[];
};

function targetContextScore(
  params: BuildTargetChoiceShadowReportParams,
  optionId: string,
): TargetChoiceShadowContextScore {
  const safeOptionId = safe(optionId);
  let scoreDelta = 0;
  const evidence: string[] = [];
  const utilityFamilies = new Set(params.utilityFamilies ?? []);
  const matchingOpportunities = (params.opportunities ?? []).filter(
    (opportunity) => safe(opportunity.targetId ?? "") === safeOptionId,
  );
  const matchingThreats = (params.threats ?? []).filter(
    (threat) => safe(threat.targetId ?? "") === safeOptionId,
  );

  for (const opportunity of matchingOpportunities) {
    const delta = opportunityPriorityBonus(opportunity.priority);
    scoreDelta += delta;
    evidence.push(
      `opportunity:${opportunity.opportunity}`,
      `opportunity_priority:${opportunity.priority}`,
      `opportunity_score_delta:${delta}`,
    );
  }

  for (const threat of matchingThreats) {
    const penalty = threatSeverityPenalty(threat.severity);
    scoreDelta -= penalty;
    evidence.push(
      `threat:${threat.threat}`,
      `threat_severity:${threat.severity}`,
      `threat_score_delta:-${penalty}`,
    );
  }

  if (utilityFamilies.has("remote_contest") && isRemoteTarget(safeOptionId)) {
    scoreDelta += 24;
    evidence.push("utility_family:remote_contest", "utility_score_delta:24");
  }

  if (
    utilityFamilies.has("run_access") &&
    matchingOpportunities.some((opportunity) =>
      opportunity.opportunity === "known_agenda_payoff" ||
      opportunity.opportunity === "safe_central_access",
    )
  ) {
    const delta = isCentralTarget(safeOptionId) ? 18 : 10;
    scoreDelta += delta;
    evidence.push("utility_family:run_access", `utility_score_delta:${delta}`);
  }

  if (
    utilityFamilies.has("survival") &&
    isRemoteTarget(safeOptionId) &&
    matchingOpportunities.length === 0
  ) {
    scoreDelta -= 18;
    evidence.push("utility_family:survival", "utility_score_delta:-18");
  }

  if (
    utilityFamilies.has("corp_scoreline") &&
    (isScorelineTarget(params.action, safeOptionId) ||
      hasTargetlessScoreWindow(params.opportunities ?? []))
  ) {
    scoreDelta += 22;
    evidence.push("utility_family:corp_scoreline", "utility_score_delta:22");
  }

  return { scoreDelta, evidence };
}

function opportunityPriorityBonus(
  priority: AiOpportunityProjection["priority"],
): number {
  switch (priority) {
    case "critical":
      return 28;
    case "high":
      return 20;
    case "medium":
      return 12;
    case "low":
      return 6;
  }
}

function threatSeverityPenalty(severity: AiThreatProjection["severity"]): number {
  switch (severity) {
    case "critical":
      return 32;
    case "high":
      return 24;
    case "medium":
      return 12;
    case "low":
      return 6;
  }
}

function isCentralTarget(optionId: string): boolean {
  return optionId === "hq" || optionId === "rd" || optionId === "archives";
}

function isRemoteTarget(optionId: string): boolean {
  return optionId.startsWith("remote_");
}

function isScorelineTarget(action: LegalAction, optionId: string): boolean {
  return (
    action.type === "advance_card" ||
    action.type === "score_agenda" ||
    optionId.includes("agenda") ||
    optionId.includes("score")
  );
}

function hasTargetlessScoreWindow(
  opportunities: readonly AiOpportunityProjection[],
): boolean {
  return opportunities.some(
    (opportunity) =>
      opportunity.opportunity === "score_window" && opportunity.targetId === undefined,
  );
}

function targetOptionIdsForRequirement(
  params: BuildTargetChoiceShadowReportParams,
  requirement: LegalAction["targetRequirements"][number],
): { optionIds: string[]; evidence: string[] } {
  if (requirement.allowedServers !== undefined) {
    return {
      optionIds: uniqueStrings(requirement.allowedServers),
      evidence: ["target_option_source:legal_action_allowed_servers"],
    };
  }
  const explicitOptions = params.sideSafeTargetIdsByRequirementId?.[requirement.id];
  if (explicitOptions !== undefined) {
    return {
      optionIds: uniqueStrings(explicitOptions),
      evidence: ["target_option_source:explicit_side_safe_map"],
    };
  }
  const candidateOptions = candidateTargetIdsForRequirement(
    params.candidate,
    requirement.kind,
  );
  if (candidateOptions.length > 0) {
    return {
      optionIds: candidateOptions,
      evidence: [
        "target_option_source:semantic_candidate_target_context",
        ...(params.candidate
          ? [`candidate_action_id:${safe(params.candidate.actionId)}`]
          : []),
      ],
    };
  }
  return {
    optionIds: [],
    evidence: ["target_option_source:none"],
  };
}

function payloadTargetOptions(
  params: BuildTargetChoiceShadowReportParams,
  preferred: ReadonlySet<string>,
  avoid: ReadonlySet<string>,
): TargetChoiceShadowOption[] {
  if (params.action.targetRequirements.length > 0) return [];
  const payloadTargets = sideSafePayloadTargets(params.action);
  return payloadTargets.map((target, index) =>
    option(
      target.requirementId,
      target.optionId,
      "target_option",
      index,
      preferred,
      avoid,
      [
        `target_requirement_kind:${target.kind}`,
        "target_option_source:legal_action_payload",
        `target_payload_key:${target.payloadKey}`,
      ],
      targetContextScore(params, target.optionId),
    ),
  );
}

function sideSafePayloadTargets(
  action: LegalAction,
): {
  requirementId: string;
  optionId: string;
  kind: LegalAction["targetRequirements"][number]["kind"];
  payloadKey: string;
}[] {
  const targets: {
    requirementId: string;
    optionId: string;
    kind: LegalAction["targetRequirements"][number]["kind"];
    payloadKey: string;
  }[] = [];
  const serverId = action.payload?.serverId;
  if (typeof serverId === "string") {
    targets.push({
      requirementId: "payload.serverId",
      optionId: serverId,
      kind: "server",
      payloadKey: "serverId",
    });
  }
  const cardId = action.payload?.cardId;
  if (typeof cardId === "string" && isPayloadCardTargetAction(action)) {
    targets.push({
      requirementId: "payload.cardId",
      optionId: cardId,
      kind: "card",
      payloadKey: "cardId",
    });
  }
  return targets;
}

function isPayloadCardTargetAction(action: LegalAction): boolean {
  return (
    action.type === "advance_card" ||
    action.type === "score_agenda" ||
    action.type === "trash_accessed_card" ||
    action.type === "trash_resource"
  );
}

function candidateTargetIdsForRequirement(
  candidate: ActionSemanticCandidate | undefined,
  requirementKind: LegalAction["targetRequirements"][number]["kind"],
): string[] {
  const context = candidate?.targetContext;
  if (!context || context.hiddenInfoPolicy === "hidden_info_blocked") return [];
  const targetKind = targetKindFromRequirement(requirementKind);
  if (targetKind === "unknown") return [];
  return uniqueStrings(
    [
      ...context.selectedTargets,
      ...(context.availableTargets ?? []),
    ]
      .filter((target) => target.targetKind === targetKind)
      .map((target) => target.targetId),
  );
}

function targetKindFromRequirement(
  kind: LegalAction["targetRequirements"][number]["kind"],
): "card" | "server" | "subroutine" | "unknown" {
  if (kind === "card") return "card";
  if (kind === "server") return "server";
  if (kind === "subroutine") return "subroutine";
  return "unknown";
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.map(safe))];
}

function safe(value: string): string {
  return redactSemanticString(value);
}

function assertTargetChoiceShadowReportSideSafe(
  report: TargetChoiceShadowReport,
): void {
  const forbiddenPath = findForbiddenSemanticPath(report, "TargetChoiceShadowReport");
  if (!forbiddenPath) return;
  throw new Error(
    `TargetChoiceShadowReport contains forbidden hidden-info marker: ${forbiddenPath}`,
  );
}
