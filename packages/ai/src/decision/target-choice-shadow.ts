import type { LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  findForbiddenSemanticPath,
  redactSemanticString,
} from "../diagnostics/semantic-redaction";

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

export type TargetChoiceShadowReport = {
  schemaVersion: typeof TARGET_CHOICE_SHADOW_SCHEMA_VERSION;
  scope: "target_choice_shadow_report_only";
  actionId: string;
  actionType: LegalAction["type"];
  side: LegalAction["side"];
  rankedOptions: TargetChoiceShadowOption[];
  blockedRequirements: TargetChoiceShadowBlockedRequirement[];
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
  const report: TargetChoiceShadowReport = {
    schemaVersion: TARGET_CHOICE_SHADOW_SCHEMA_VERSION,
    scope: "target_choice_shadow_report_only",
    actionId: safe(params.action.actionId),
    actionType: params.action.type,
    side: params.action.side,
    rankedOptions,
    blockedRequirements: blockedRequirements(params),
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
  return params.action.targetRequirements.flatMap((requirement) => {
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
      ),
    );
  });
}

function option(
  requirementId: string,
  optionId: string,
  kind: TargetChoiceShadowOptionKind,
  index: number,
  preferred: ReadonlySet<string>,
  avoid: ReadonlySet<string>,
  evidence: readonly string[],
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
      avoidPenalty,
    evidence: [
      ...evidence.map(safe),
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

function targetShapeBonus(optionId: string): number {
  if (optionId === "hq" || optionId === "rd") return 10;
  if (optionId.startsWith("remote_")) return 5;
  return 0;
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
