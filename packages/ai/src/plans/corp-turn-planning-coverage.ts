import type { AiDecisionInput } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { PlanModuleId } from "./plan-kernel-types";
import type { PlanActionDisposition } from "./plan-scheduler";
import {
  assertTurnPlanningHeadCandidate,
  buildSemanticActionSetFingerprint,
  type PlanModuleHorizonCapability,
  type PlanningStateIdentity,
  type TurnPlanningHeadCandidate,
} from "./turn-planning-contracts";

export const CORP_TURN_PLANNING_COVERAGE_SCHEMA_VERSION =
  "corp-turn-planning-coverage-v1" as const;

export type CorpTurnPlanningModuleCoverage = {
  moduleId: PlanModuleId;
  horizonCapability: PlanModuleHorizonCapability;
  semanticActionPatterns: string[];
  ownerKind:
    | "agenda"
    | "remote"
    | "defense"
    | "economy"
    | "virus"
    | "punish"
    | "ambush"
    | "hand"
    | "turn_completion";
};

export type TurnPlanningCoverageConfiguration = {
  side: "corp" | "runner";
  modules: readonly Pick<
    CorpTurnPlanningModuleCoverage,
    "moduleId" | "horizonCapability" | "semanticActionPatterns"
  >[];
  engineWindowSemanticPatterns: readonly string[];
  completeTurnModuleId: PlanModuleId;
};

export const CORP_TURN_PLANNING_MODULE_COVERAGE: readonly CorpTurnPlanningModuleCoverage[] =
  [
    {
      moduleId: "corp.score_agenda",
      horizonCapability: "campaign_capable",
      ownerKind: "agenda",
      semanticActionPatterns: [
        "install.card",
        "score.advance_card",
        "score.agenda",
        "score_conversion.*",
        "card_ability.*",
        "corp_window.rez",
        "play.corp_operation",
        "economy.gain_credit",
        "turn_flow.stop_restricted_action_sequence",
      ],
    },
    {
      moduleId: "corp.establish_scoring_remote",
      horizonCapability: "campaign_capable",
      ownerKind: "remote",
      semanticActionPatterns: ["install.card", "card_ability.*"],
    },
    {
      moduleId: "corp.defend_servers",
      horizonCapability: "context_dependent",
      ownerKind: "defense",
      semanticActionPatterns: [
        "install.card",
        "corp_window.rez",
        "corp_window.decline_rez",
        "draw.card",
        "card_ability.*",
        "play.corp_operation",
        "economy.gain_credit",
        "choice.resolve",
        "run.continue",
        "run.end_by_corp",
        "turn_flow.stop_restricted_action_sequence",
      ],
    },
    {
      moduleId: "corp.economy",
      horizonCapability: "context_dependent",
      ownerKind: "economy",
      semanticActionPatterns: [
        "economy.*",
        "draw.card",
        "install.card",
        "play.corp_operation",
        "corp_window.rez",
        "card_ability.*",
        "score.advance_card",
        "score_conversion.gain_action_capacity",
        "turn_flow.stop_restricted_action_sequence",
      ],
    },
    {
      moduleId: "corp.respond_to_virus_pressure",
      horizonCapability: "context_dependent",
      ownerKind: "virus",
      semanticActionPatterns: [
        "counter.purge_virus",
        "counter.purge_runner_virus",
      ],
    },
    {
      moduleId: "corp.punish_campaign",
      horizonCapability: "campaign_capable",
      ownerKind: "punish",
      semanticActionPatterns: [
        "trace.*",
        "corp.trace",
        "tag.*",
        "corp_tag_punish.*",
        "damage.*",
        "trash.resources",
        "install.card",
        "corp_window.rez",
        "play.corp_operation",
        "card_ability.*",
        "choice.resolve",
      ],
    },
    {
      moduleId: "corp.execute_punish_sequence",
      horizonCapability: "context_dependent",
      ownerKind: "punish",
      semanticActionPatterns: [
        "trace.*",
        "corp.trace",
        "tag.*",
        "corp_tag_punish.*",
        "damage.*",
        "trash.resources",
        "install.card",
        "corp_window.rez",
        "play.corp_operation",
        "card_ability.*",
        "choice.resolve",
      ],
    },
    {
      moduleId: "corp.ambush_and_bluff",
      horizonCapability: "campaign_capable",
      ownerKind: "ambush",
      semanticActionPatterns: [
        "install.card",
        "score.advance_card",
        "corp_window.rez",
        "card_ability.*",
        "choice.resolve",
        "damage.*",
      ],
    },
    {
      moduleId: "corp.hand_and_agenda_management",
      horizonCapability: "context_dependent",
      ownerKind: "hand",
      semanticActionPatterns: [
        "draw.*",
        "choice.resolve",
        "special_zone.*",
        "discard.*",
        "trash.resources",
        "install.card",
        "play.corp_operation",
        "economy.gain_credit",
        "card_ability.*",
        "score.advance_card",
        "score_conversion.*",
        "turn_flow.stop_restricted_action_sequence",
      ],
    },
    {
      moduleId: "corp.complete_turn",
      horizonCapability: "current_turn_only",
      ownerKind: "turn_completion",
      semanticActionPatterns: ["turn_flow.end_turn"],
    },
  ] as const;

export const CORP_ENGINE_WINDOW_SEMANTIC_PATTERNS = [
  "choice.resolve",
  "draw.mandatory",
  "run.continue",
  "corp_window.decline_rez",
  "turn_flow.forgo_action",
] as const;

export type CorpTurnPlanningCoverageClassification =
  | "productive_head"
  | "explicitly_nonproductive"
  | "assessment_unknown"
  | "engine_window"
  | "missing"
  | "conflicting";

export type CorpTurnPlanningActionCoverage = {
  actionId: string;
  actionType: string;
  semanticActionType: string;
  classification: CorpTurnPlanningCoverageClassification;
  ownerModuleId?: PlanModuleId;
  horizonCapability?: PlanModuleHorizonCapability;
  instanceHorizon?: "current_turn" | "multi_turn";
  campaignQuoteStatus?: "not_required" | "present" | "missing";
  evidenceCodes: string[];
};

export type CorpTurnPlanningCoverageIssueCode =
  | "input_side_not_corp"
  | "legal_action_candidate_coverage_mismatch"
  | "duplicate_candidate_action"
  | "stale_candidate"
  | "unknown_engine_window_action"
  | "engine_window_semantic_mismatch"
  | "invalid_productive_head"
  | "current_head_legal_binding_mismatch"
  | "route_defining_binding_incomplete"
  | "unregistered_module_owner"
  | "module_horizon_mismatch"
  | "module_semantic_family_mismatch"
  | "multi_turn_campaign_quote_missing"
  | "duplicate_disposition"
  | "invalid_disposition_owner"
  | "conflicting_action_ownership"
  | "productive_action_without_owner";

export type CorpTurnPlanningCoverageReport = {
  schemaVersion: typeof CORP_TURN_PLANNING_COVERAGE_SCHEMA_VERSION;
  stateVersion: number;
  legalActionCount: number;
  candidateCount: number;
  classifiedActionCount: number;
  productiveActionCount: number;
  explicitlyNonproductiveActionCount: number;
  assessmentUnknownActionCount: number;
  engineWindowActionCount: number;
  missingActionCount: number;
  conflictingActionCount: number;
  coveragePercent: number;
  status: "pass" | "fail";
  actions: CorpTurnPlanningActionCoverage[];
  modules: Array<{
    moduleId: PlanModuleId;
    horizonCapability: PlanModuleHorizonCapability;
    productiveActionCount: number;
    explicitlyNonproductiveActionCount: number;
    assessmentUnknownActionCount: number;
  }>;
  issues: Array<{
    code: CorpTurnPlanningCoverageIssueCode;
    actionId?: string;
    moduleId?: PlanModuleId;
    detail: string;
  }>;
};

export class CorpTurnPlanningCoverageError extends Error {
  constructor(readonly report: CorpTurnPlanningCoverageReport) {
    super(
      `corp_turn_planning_coverage_failed:${report.issues
        .map((issue) => issue.code)
        .sort()
        .join(",")}`,
    );
    this.name = "CorpTurnPlanningCoverageError";
  }
}

export function buildCorpTurnPlanningCoverageReport(params: {
  input: Pick<AiDecisionInput, "side" | "playerView" | "legalActions">;
  stateIdentity: PlanningStateIdentity;
  candidates: readonly ActionSemanticCandidate[];
  heads: readonly TurnPlanningHeadCandidate[];
  dispositions: readonly PlanActionDisposition[];
  engineWindowActionIds: readonly string[];
  configuration?: TurnPlanningCoverageConfiguration;
}): CorpTurnPlanningCoverageReport {
  const configuration: TurnPlanningCoverageConfiguration =
    params.configuration ?? {
      side: "corp",
      modules: CORP_TURN_PLANNING_MODULE_COVERAGE,
      engineWindowSemanticPatterns: CORP_ENGINE_WINDOW_SEMANTIC_PATTERNS,
      completeTurnModuleId: "corp.complete_turn",
    };
  const issues: CorpTurnPlanningCoverageReport["issues"] = [];
  const stateVersion = params.input.playerView.stateVersion;
  if (params.input.side !== configuration.side) {
    issues.push({
      code: "input_side_not_corp",
      detail: `expected=${configuration.side} actual=${params.input.side}`,
    });
  }
  const legalActionIds = sortedUnique(
    params.input.legalActions.map((action) => action.actionId),
  );
  const candidateActionIds = params.candidates.map(
    (candidate) => candidate.actionId,
  );
  if (new Set(candidateActionIds).size !== candidateActionIds.length) {
    issues.push({
      code: "duplicate_candidate_action",
      detail: "Each LegalAction must have exactly one semantic candidate.",
    });
  }
  if (!sameStringSet(legalActionIds, candidateActionIds)) {
    issues.push({
      code: "legal_action_candidate_coverage_mismatch",
      detail: `legal=${legalActionIds.join(",")} candidates=${sortedUnique(candidateActionIds).join(",")}`,
    });
  }
  for (const candidate of params.candidates) {
    if (
      candidate.actorSide !== configuration.side ||
      candidate.stateVersion !== stateVersion
    ) {
      issues.push({
        code: "stale_candidate",
        actionId: candidate.actionId,
        detail: `actor=${candidate.actorSide} stateVersion=${candidate.stateVersion ?? "missing"}`,
      });
    }
  }

  const engineWindowActionIds = new Set(params.engineWindowActionIds);
  for (const actionId of engineWindowActionIds) {
    const candidate = params.candidates.find(
      (entry) => entry.actionId === actionId,
    );
    if (!candidate) {
      issues.push({
        code: "unknown_engine_window_action",
        actionId,
        detail: "Engine-window coverage must reference a current candidate.",
      });
    } else if (
      !semanticMatchesAny(
        candidate.semanticActionType,
        configuration.engineWindowSemanticPatterns,
      )
    ) {
      issues.push({
        code: "engine_window_semantic_mismatch",
        actionId,
        detail: candidate.semanticActionType,
      });
    }
  }

  const validHeadsByActionId = new Map<string, TurnPlanningHeadCandidate[]>();
  const semanticActionSetFingerprint = buildSemanticActionSetFingerprint(
    params.input.legalActions,
  );
  for (const head of params.heads) {
    const candidate = params.candidates.find(
      (entry) => entry.actionId === head.currentBinding.actionId,
    );
    const legalAction = params.input.legalActions.find(
      (entry) => entry.actionId === head.currentBinding.actionId,
    );
    let valid = true;
    try {
      assertTurnPlanningHeadCandidate(head, params.stateIdentity);
    } catch (error) {
      valid = false;
      issues.push({
        code: "invalid_productive_head",
        actionId: head.currentBinding.actionId,
        moduleId: head.moduleId,
        detail: error instanceof Error ? error.message : "unknown_error",
      });
    }
    if (
      !legalAction ||
      legalAction.side !== configuration.side ||
      legalAction.expiresAtStateVersion !== stateVersion ||
      head.currentBinding.semanticActionSetFingerprint !==
        semanticActionSetFingerprint ||
      head.executableWitness.semanticActionSetFingerprint !==
        semanticActionSetFingerprint
    ) {
      valid = false;
      issues.push({
        code: "current_head_legal_binding_mismatch",
        actionId: head.currentBinding.actionId,
        moduleId: head.moduleId,
        detail: `Head must bind the current ${configuration.side} LegalAction and exact semantic action set (legalSide=${legalAction?.side ?? "missing"} legalExpiry=${legalAction?.expiresAtStateVersion ?? "missing"} state=${stateVersion} bindingSet=${head.currentBinding.semanticActionSetFingerprint} witnessSet=${head.executableWitness.semanticActionSetFingerprint} expectedSet=${semanticActionSetFingerprint}).`,
      });
    }
    if (legalAction) {
      const boundTargetSlotIds = new Set(
        head.invocation.boundTargets.map((slot) => slot.slotId),
      );
      const boundChoiceIds = new Set(
        head.invocation.boundChoices.map((choice) => choice.choiceId),
      );
      const missingTargetIds = legalAction.targetRequirements
        .map((requirement) => requirement.id)
        .filter((id) => !boundTargetSlotIds.has(id));
      const missingChoiceIds = (legalAction.choiceRequirements ?? [])
        .map((requirement) => requirement.choiceId)
        .filter((id) => !boundChoiceIds.has(id));
      if (missingTargetIds.length > 0 || missingChoiceIds.length > 0) {
        valid = false;
        issues.push({
          code: "route_defining_binding_incomplete",
          actionId: head.currentBinding.actionId,
          moduleId: head.moduleId,
          detail: `targets=${missingTargetIds.sort().join(",") || "none"} choices=${missingChoiceIds.sort().join(",") || "none"}`,
        });
      }
    }
    const moduleCoverage = moduleCoverageFor(
      head.moduleId,
      configuration.modules,
    );
    if (!moduleCoverage) {
      valid = false;
      issues.push({
        code: "unregistered_module_owner",
        actionId: head.currentBinding.actionId,
        moduleId: head.moduleId,
        detail: "Productive head owner has no Corp planning contract.",
      });
    } else {
      if (head.horizonCapability !== moduleCoverage.horizonCapability) {
        valid = false;
        issues.push({
          code: "module_horizon_mismatch",
          actionId: head.currentBinding.actionId,
          moduleId: head.moduleId,
          detail: `expected=${moduleCoverage.horizonCapability} actual=${head.horizonCapability}`,
        });
      }
      if (
        !semanticMatchesAny(
          head.invocation.semanticActionType,
          moduleCoverage.semanticActionPatterns,
        )
      ) {
        valid = false;
        issues.push({
          code: "module_semantic_family_mismatch",
          actionId: head.currentBinding.actionId,
          moduleId: head.moduleId,
          detail: head.invocation.semanticActionType,
        });
      }
      if (
        candidate &&
        head.invocation.semanticActionType !== candidate.semanticActionType
      ) {
        valid = false;
        issues.push({
          code: "invalid_productive_head",
          actionId: head.currentBinding.actionId,
          moduleId: head.moduleId,
          detail: `head_semantic=${head.invocation.semanticActionType} candidate_semantic=${candidate.semanticActionType}`,
        });
      }
      if (
        candidate &&
        !semanticMatchesAny(
          candidate.semanticActionType,
          moduleCoverage.semanticActionPatterns,
        )
      ) {
        valid = false;
        issues.push({
          code: "module_semantic_family_mismatch",
          actionId: head.currentBinding.actionId,
          moduleId: head.moduleId,
          detail: candidate.semanticActionType,
        });
      }
    }
    if (
      head.instanceHorizon === "multi_turn" &&
      head.campaignQuote === undefined
    ) {
      valid = false;
      issues.push({
        code: "multi_turn_campaign_quote_missing",
        actionId: head.currentBinding.actionId,
        moduleId: head.moduleId,
        detail: "Every concrete multi-turn head must carry a current quote.",
      });
    }
    if (!candidate) {
      valid = false;
      issues.push({
        code: "invalid_productive_head",
        actionId: head.currentBinding.actionId,
        moduleId: head.moduleId,
        detail: "Productive head does not bind a current candidate.",
      });
    }
    if (!valid) continue;
    const current =
      validHeadsByActionId.get(head.currentBinding.actionId) ?? [];
    current.push(head);
    validHeadsByActionId.set(head.currentBinding.actionId, current);
  }

  const dispositionsByActionId = new Map<string, PlanActionDisposition>();
  for (const disposition of params.dispositions) {
    if (dispositionsByActionId.has(disposition.actionId)) {
      issues.push({
        code: "duplicate_disposition",
        actionId: disposition.actionId,
        moduleId: disposition.ownerModuleId,
        detail: "An action may have only one disposition owner.",
      });
      continue;
    }
    dispositionsByActionId.set(disposition.actionId, disposition);
    const candidate = params.candidates.find(
      (entry) => entry.actionId === disposition.actionId,
    );
    const moduleCoverage = moduleCoverageFor(
      disposition.ownerModuleId,
      configuration.modules,
    );
    if (
      !candidate ||
      !moduleCoverage ||
      !semanticMatchesAny(
        candidate.semanticActionType,
        moduleCoverage.semanticActionPatterns,
      ) ||
      disposition.evidenceCode.trim().length === 0
    ) {
      issues.push({
        code: "invalid_disposition_owner",
        actionId: disposition.actionId,
        moduleId: disposition.ownerModuleId,
        detail:
          candidate?.semanticActionType ??
          "Disposition does not reference a current candidate.",
      });
    }
  }

  const actions = [...params.candidates]
    .sort((left, right) => left.actionId.localeCompare(right.actionId))
    .map((candidate): CorpTurnPlanningActionCoverage => {
      const heads = [
        ...(validHeadsByActionId.get(candidate.actionId) ?? []),
      ].sort((left, right) =>
        left.candidateId.localeCompare(right.candidateId),
      );
      const headOwners = sortedUnique(heads.map((head) => head.moduleId));
      const disposition = dispositionsByActionId.get(candidate.actionId);
      const engineOwned = engineWindowActionIds.has(candidate.actionId);
      const ownershipKinds =
        Number(engineOwned) +
        Number(heads.length > 0) +
        Number(Boolean(disposition));
      if (ownershipKinds > 1 || headOwners.length > 1) {
        issues.push({
          code: "conflicting_action_ownership",
          actionId: candidate.actionId,
          detail: `engine=${engineOwned} heads=${headOwners.join(",")} disposition=${disposition?.ownerModuleId ?? "none"}`,
        });
        return {
          actionId: candidate.actionId,
          actionType: candidate.actionType,
          semanticActionType: candidate.semanticActionType,
          classification: "conflicting",
          evidenceCodes: ["multiple_coverage_authorities"],
        };
      }
      if (engineOwned) {
        return {
          actionId: candidate.actionId,
          actionType: candidate.actionType,
          semanticActionType: candidate.semanticActionType,
          classification: "engine_window",
          instanceHorizon: "current_turn",
          campaignQuoteStatus: "not_required",
          evidenceCodes: ["engine_window_current_legal_action"],
        };
      }
      const head = heads[0];
      if (head) {
        return {
          actionId: candidate.actionId,
          actionType: candidate.actionType,
          semanticActionType: candidate.semanticActionType,
          classification: "productive_head",
          ownerModuleId: head.moduleId,
          horizonCapability: head.horizonCapability,
          instanceHorizon: head.instanceHorizon,
          campaignQuoteStatus:
            head.instanceHorizon === "multi_turn"
              ? head.campaignQuote
                ? "present"
                : "missing"
              : "not_required",
          evidenceCodes: sortedUnique([
            ...head.evidenceCodes,
            "current_productive_planning_head",
          ]),
        };
      }
      if (disposition) {
        const moduleCoverage = moduleCoverageFor(
          disposition.ownerModuleId,
          configuration.modules,
        );
        return {
          actionId: candidate.actionId,
          actionType: candidate.actionType,
          semanticActionType: candidate.semanticActionType,
          classification: disposition.disposition,
          ownerModuleId: disposition.ownerModuleId,
          ...(moduleCoverage
            ? { horizonCapability: moduleCoverage.horizonCapability }
            : {}),
          campaignQuoteStatus: "not_required",
          evidenceCodes: [disposition.evidenceCode],
        };
      }
      if (
        candidate.actionType === "end_turn" &&
        candidate.semanticActionType === "turn_flow.end_turn" &&
        candidate.sourceKind === "game_rule" &&
        (params.input.playerView.own.clicks > 0 ||
          [...validHeadsByActionId.entries()].some(
            ([actionId, currentHeads]) =>
              actionId !== candidate.actionId && currentHeads.length > 0,
          ))
      ) {
        const usableCapacity = params.input.playerView.own.clicks > 0;
        return {
          actionId: candidate.actionId,
          actionType: candidate.actionType,
          semanticActionType: candidate.semanticActionType,
          classification: "explicitly_nonproductive",
          ownerModuleId: configuration.completeTurnModuleId,
          horizonCapability: "current_turn_only",
          campaignQuoteStatus: "not_required",
          evidenceCodes: [
            usableCapacity
              ? "turn_completion_deferred_usable_capacity"
              : "turn_completion_deferred_productive_route",
          ],
        };
      }
      issues.push({
        code: "productive_action_without_owner",
        actionId: candidate.actionId,
        detail: candidate.semanticActionType,
      });
      return {
        actionId: candidate.actionId,
        actionType: candidate.actionType,
        semanticActionType: candidate.semanticActionType,
        classification: "missing",
        evidenceCodes: ["no_head_disposition_or_engine_window_owner"],
      };
    });

  const modules = configuration.modules.map((module) => ({
    moduleId: module.moduleId,
    horizonCapability: module.horizonCapability,
    productiveActionCount: actions.filter(
      (action) =>
        action.ownerModuleId === module.moduleId &&
        action.classification === "productive_head",
    ).length,
    explicitlyNonproductiveActionCount: actions.filter(
      (action) =>
        action.ownerModuleId === module.moduleId &&
        action.classification === "explicitly_nonproductive",
    ).length,
    assessmentUnknownActionCount: actions.filter(
      (action) =>
        action.ownerModuleId === module.moduleId &&
        action.classification === "assessment_unknown",
    ).length,
  }));
  const classifiedActionCount = actions.filter(
    (action) =>
      action.classification !== "missing" &&
      action.classification !== "conflicting",
  ).length;
  const missingActionCount = actions.filter(
    (action) => action.classification === "missing",
  ).length;
  const conflictingActionCount = actions.filter(
    (action) => action.classification === "conflicting",
  ).length;
  const coveragePercent =
    actions.length === 0
      ? 100
      : Number(((classifiedActionCount / actions.length) * 100).toFixed(2));
  const report: CorpTurnPlanningCoverageReport = {
    schemaVersion: CORP_TURN_PLANNING_COVERAGE_SCHEMA_VERSION,
    stateVersion,
    legalActionCount: params.input.legalActions.length,
    candidateCount: params.candidates.length,
    classifiedActionCount,
    productiveActionCount: actions.filter(
      (action) => action.classification === "productive_head",
    ).length,
    explicitlyNonproductiveActionCount: actions.filter(
      (action) => action.classification === "explicitly_nonproductive",
    ).length,
    assessmentUnknownActionCount: actions.filter(
      (action) => action.classification === "assessment_unknown",
    ).length,
    engineWindowActionCount: actions.filter(
      (action) => action.classification === "engine_window",
    ).length,
    missingActionCount,
    conflictingActionCount,
    coveragePercent,
    status:
      issues.length === 0 &&
      missingActionCount === 0 &&
      conflictingActionCount === 0
        ? "pass"
        : "fail",
    actions,
    modules,
    issues: [...issues].sort(compareIssues),
  };
  return report;
}

export function assertCompleteCorpTurnPlanningCoverage(
  report: CorpTurnPlanningCoverageReport,
): void {
  if (
    report.schemaVersion !== CORP_TURN_PLANNING_COVERAGE_SCHEMA_VERSION ||
    report.status !== "pass" ||
    report.coveragePercent !== 100 ||
    report.missingActionCount !== 0 ||
    report.conflictingActionCount !== 0 ||
    report.issues.length !== 0
  ) {
    throw new CorpTurnPlanningCoverageError(report);
  }
}

export function assertCorpTurnPlanningModuleRegistry(
  registeredModuleIds: readonly PlanModuleId[],
): void {
  const declaredIds = CORP_TURN_PLANNING_MODULE_COVERAGE.map(
    (entry) => entry.moduleId,
  );
  const issues: string[] = [];
  if (!sameStringSet(registeredModuleIds, declaredIds)) {
    issues.push(
      `module_set_mismatch:registered=${sortedUnique(registeredModuleIds).join(",")}:declared=${sortedUnique(declaredIds).join(",")}`,
    );
  }
  if (
    CORP_TURN_PLANNING_MODULE_COVERAGE.some(
      (entry) =>
        entry.semanticActionPatterns.length === 0 ||
        entry.semanticActionPatterns.includes("*") ||
        entry.semanticActionPatterns.some((pattern) => pattern.trim() === ""),
    )
  ) {
    issues.push("generic_or_empty_semantic_fallback_forbidden");
  }
  if (
    new Set(declaredIds).size !== declaredIds.length ||
    CORP_TURN_PLANNING_MODULE_COVERAGE.some(
      (entry) => !entry.moduleId.startsWith("corp."),
    )
  ) {
    issues.push("invalid_module_declaration");
  }
  if (issues.length > 0) {
    throw new Error(
      `invalid_corp_turn_planning_module_registry:${issues.join(";")}`,
    );
  }
}

export function corpTurnPlanningModuleCoverage(
  moduleId: PlanModuleId,
): CorpTurnPlanningModuleCoverage | undefined {
  const coverage = moduleCoverageFor(moduleId);
  return coverage ? structuredClone(coverage) : undefined;
}

function moduleCoverageFor(
  moduleId: PlanModuleId,
  modules: readonly Pick<
    CorpTurnPlanningModuleCoverage,
    "moduleId" | "horizonCapability" | "semanticActionPatterns"
  >[] = CORP_TURN_PLANNING_MODULE_COVERAGE,
): CorpTurnPlanningModuleCoverage | undefined {
  return modules.find((entry) => entry.moduleId === moduleId) as
    | CorpTurnPlanningModuleCoverage
    | undefined;
}

function semanticMatchesAny(
  semanticActionType: string,
  patterns: readonly string[],
): boolean {
  return patterns.some((pattern) => {
    if (!pattern.endsWith(".*")) return semanticActionType === pattern;
    return semanticActionType.startsWith(pattern.slice(0, -1));
  });
}

function compareIssues(
  left: CorpTurnPlanningCoverageReport["issues"][number],
  right: CorpTurnPlanningCoverageReport["issues"][number],
): number {
  return (
    (left.actionId ?? "").localeCompare(right.actionId ?? "") ||
    left.code.localeCompare(right.code) ||
    (left.moduleId ?? "").localeCompare(right.moduleId ?? "") ||
    left.detail.localeCompare(right.detail)
  );
}

function sortedUnique<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort();
}

function sameStringSet(
  left: readonly string[],
  right: readonly string[],
): boolean {
  const sortedLeft = sortedUnique(left);
  const sortedRight = sortedUnique(right);
  return (
    sortedLeft.length === sortedRight.length &&
    sortedLeft.every((value, index) => value === sortedRight[index])
  );
}
