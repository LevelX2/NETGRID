import type { Side } from "@netgrid/shared";
import type { PlanBlocker, PlanTargetRef } from "./plan-kernel-types";
import { PlanResolutionFailure } from "./plan-resolution-failure";
import {
  hasExplicitTacticalTransientEvidence,
  requireCurrentTransientPlanSignals,
  transientPlanSignalEvidenceCodes,
  type TransientPlanSignal,
} from "./transient-plan-signals";

export type PriorityClass = "P1" | "P2" | "P3" | "P4" | "P5" | "P6";

export type PriorityReason =
  | "terminal_win"
  | "prevent_terminal_loss"
  | "survival_threat"
  | "score_threat"
  | "irreversible_threat"
  | "expiring_conversion"
  | "strategic_campaign"
  | "required_parent_support"
  | "development_need"
  | "neutral_progress"
  | "turn_completion";

export type PlanHorizon =
  | "current_window"
  | "current_turn"
  | "next_own_turn"
  | "multi_turn";

export type GuaranteeLevel =
  | "rules_proven"
  | "visible_state_forced"
  | "robust_but_reactive"
  | "belief_supported"
  | "speculative";

export type TerminalOrThreatWitness = {
  kind:
    | "terminal_path"
    | "terminal_prevention"
    | "survival_threat"
    | "score_threat"
    | "irreversible_threat";
  evidenceCode: string;
  guarantee: GuaranteeLevel;
  target?: PlanTargetRef;
};

export type PriorityClaim = {
  requestedClass: PriorityClass;
  reasonCode: PriorityReason;
  horizon: PlanHorizon;
  witness?: TerminalOrThreatWitness;
};

export type PlanReadiness =
  | "executable_now"
  | "executable_with_support"
  | "waiting_for_condition"
  | "blocked"
  | "nonviable";

export type PlanIntentFit = "aligned" | "tactical_override" | "none";

export type ResourceGap = {
  needId: string;
  capability: string;
  minimum: number;
  available: number;
  deadline: PlanHorizon;
};

export type FeasibilityEnvelope = {
  currentRouteHeadPossible: boolean;
  projectedActionCount: number;
  opponentCanReact: boolean;
  confidence: GuaranteeLevel;
};

export type OutcomeEnvelope = {
  outcomeKind: string;
  minimumValue: number;
  expectedValue: number;
  maximumValue: number;
  terminal: boolean;
  guarantee: GuaranteeLevel;
};

export type ContinuityAssessment = {
  isCurrentForeground: boolean;
  sameObjectiveAsForeground: boolean;
  switchingCost: number;
  progressAtRisk: number;
};

export type PlanStepPreview = {
  stepId: string;
  capability: string;
  target?: PlanTargetRef;
  purpose: string;
};

export type PlanAssessment = {
  instanceId: string;
  side: Side;
  priorityClaim: PriorityClaim;
  intentFit: PlanIntentFit;
  transientSignals?: TransientPlanSignal[];
  readiness: PlanReadiness;
  nextStepPreview?: PlanStepPreview;
  feasibility: FeasibilityEnvelope;
  resourceGaps: ResourceGap[];
  expectedOutcome: OutcomeEnvelope;
  continuity: ContinuityAssessment;
  blockers: PlanBlocker[];
  withinClassValue: number;
  evidenceCodes: string[];
};

export type PlanPriorityPolicy = {
  side: Side;
  allowedP1Reasons: PriorityReason[];
  allowedP2Reasons: PriorityReason[];
};

export type PriorityClaimValidation = {
  status: "accepted" | "rejected";
  requestedClass: PriorityClass;
  effectiveClass?: PriorityClass;
  delegatedFromPlanInstanceId?: string;
  needId?: string;
  reasonCodes: string[];
};

export type ValidatedPlanAssessment = PlanAssessment & {
  priorityValidation: PriorityClaimValidation & {
    status: "accepted";
    effectiveClass: PriorityClass;
  };
};

const PRIORITY_RANK: Record<PriorityClass, number> = {
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
  P5: 5,
  P6: 6,
};

const STRONG_GUARANTEES = new Set<GuaranteeLevel>([
  "rules_proven",
  "visible_state_forced",
  "robust_but_reactive",
]);

export const RUNNER_PLAN_PRIORITY_POLICY: PlanPriorityPolicy = {
  side: "runner",
  allowedP1Reasons: ["terminal_win", "prevent_terminal_loss"],
  allowedP2Reasons: [
    "survival_threat",
    "score_threat",
    "irreversible_threat",
  ],
};

export const CORP_PLAN_PRIORITY_POLICY: PlanPriorityPolicy = {
  side: "corp",
  allowedP1Reasons: ["terminal_win", "prevent_terminal_loss"],
  allowedP2Reasons: [
    "survival_threat",
    "score_threat",
    "irreversible_threat",
  ],
};

export function validatePriorityClaim(
  assessment: PlanAssessment,
  policy: PlanPriorityPolicy,
): PriorityClaimValidation {
  const claim = assessment.priorityClaim;
  const reasons = validateResourceGaps(assessment.resourceGaps);
  if (assessment.side !== policy.side) reasons.push("policy_side_mismatch");
  if (!claimReasonMatchesClass(claim)) reasons.push("reason_class_mismatch");
  if (
    (claim.requestedClass === "P1" || claim.requestedClass === "P2") &&
    !claim.witness
  ) {
    reasons.push("missing_threat_witness");
  }
  if (
    claim.requestedClass === "P1" &&
    !policy.allowedP1Reasons.includes(claim.reasonCode)
  ) {
    reasons.push("p1_reason_not_allowed");
  }
  if (
    claim.requestedClass === "P2" &&
    !policy.allowedP2Reasons.includes(claim.reasonCode)
  ) {
    reasons.push("p2_reason_not_allowed");
  }
  if (
    claim.requestedClass === "P1" &&
    claim.witness &&
    !STRONG_GUARANTEES.has(claim.witness.guarantee)
  ) {
    reasons.push("p1_guarantee_too_weak");
  }
  if (
    claim.requestedClass === "P2" &&
    claim.witness?.guarantee === "speculative"
  ) {
    reasons.push("p2_speculative_witness");
  }
  if (
    (claim.requestedClass === "P4" || claim.requestedClass === "P5") &&
    assessment.intentFit === "none"
  ) {
    reasons.push("missing_intent_or_tactical_evidence");
  }
  if (
    (claim.requestedClass === "P4" || claim.requestedClass === "P5") &&
    assessment.intentFit === "tactical_override" &&
    !hasExplicitTacticalTransientEvidence(assessment.transientSignals)
  ) {
    reasons.push("missing_explicit_tactical_evidence");
  }
  if (
    (claim.requestedClass === "P1" ||
      claim.requestedClass === "P2" ||
      claim.requestedClass === "P3") &&
    assessment.intentFit !== "aligned" &&
    (claim.requestedClass === "P3" || claim.witness !== undefined) &&
    !hasReliablePriorityIntentOverrideEvidence(assessment)
  ) {
    reasons.push("priority_intent_override_without_reliable_evidence");
  }
  if (
    claim.requestedClass === "P3" &&
    claim.horizon !== "current_window" &&
    claim.horizon !== "current_turn"
  ) {
    reasons.push("p3_not_expiring");
  }
  if (assessment.readiness === "executable_now") {
    if (!assessment.feasibility.currentRouteHeadPossible) {
      reasons.push("executable_now_without_route");
    }
    if (assessment.blockers.length > 0) {
      reasons.push("executable_now_with_blocker");
    }
    if (assessment.resourceGaps.length > 0) {
      reasons.push("executable_now_with_resource_gap");
    }
  }
  if (assessment.readiness === "blocked") {
    if (assessment.blockers.length === 0) {
      reasons.push("blocked_without_blocker");
    }
    if (assessment.resourceGaps.length > 0) {
      reasons.push("blocked_with_resource_gap");
    }
  }
  if (assessment.readiness === "executable_with_support") {
    if (assessment.resourceGaps.length === 0) {
      reasons.push("support_readiness_without_gap");
    }
    if (assessment.feasibility.currentRouteHeadPossible) {
      reasons.push("support_readiness_with_route_head");
    }
  }
  if (!Number.isFinite(assessment.withinClassValue)) {
    reasons.push("non_finite_within_class_value");
  }
  if (reasons.length > 0) {
    return {
      status: "rejected",
      requestedClass: claim.requestedClass,
      reasonCodes: [...new Set(reasons)].sort(),
    };
  }
  return {
    status: "accepted",
    requestedClass: claim.requestedClass,
    effectiveClass: claim.requestedClass,
    reasonCodes: ["priority_claim_validated"],
  };
}

function validateResourceGaps(resourceGaps: readonly ResourceGap[]): string[] {
  const reasons: string[] = [];
  const seenNeedIds = new Set<string>();
  for (const resourceGap of resourceGaps) {
    if (resourceGap.needId.trim().length === 0) {
      reasons.push("invalid_resource_gap_need_id");
    } else if (seenNeedIds.has(resourceGap.needId)) {
      reasons.push("duplicate_resource_gap_need_id");
    } else {
      seenNeedIds.add(resourceGap.needId);
    }

    const minimumIsValid =
      Number.isFinite(resourceGap.minimum) && resourceGap.minimum > 0;
    const availableIsValid =
      Number.isFinite(resourceGap.available) && resourceGap.available >= 0;
    if (!minimumIsValid) {
      reasons.push("invalid_resource_gap_minimum");
    }
    if (!availableIsValid) {
      reasons.push("invalid_resource_gap_available");
    }
    if (
      minimumIsValid &&
      availableIsValid &&
      resourceGap.available >= resourceGap.minimum
    ) {
      reasons.push("resource_gap_not_open");
    }
  }
  return reasons;
}

export function requireValidatedPlanAssessment(
  assessment: PlanAssessment,
  policy: PlanPriorityPolicy,
  stateVersion: number,
): ValidatedPlanAssessment {
  const transientSignals = requireCurrentTransientPlanSignals(
    assessment.transientSignals,
    {
      side: assessment.side,
      stateVersion,
      timingPoint: "plan_assessment",
    },
  );
  const currentAssessment: PlanAssessment =
    transientSignals.length > 0
      ? {
          ...assessment,
          transientSignals,
          evidenceCodes: [
            ...new Set([
              ...assessment.evidenceCodes,
              ...transientPlanSignalEvidenceCodes(transientSignals),
            ]),
          ],
        }
      : assessment;
  const validation = validatePriorityClaim(currentAssessment, policy);
  if (validation.status === "rejected" || !validation.effectiveClass) {
    throw new PlanResolutionFailure("priority_claim_rejected", {
      side: assessment.side,
      stateVersion,
      timingPoint: "plan_assessment",
      legalActionTypes: [],
      owner: "priority_policy",
      removalCondition: `Repair priority claim: ${validation.reasonCodes.join(",")}`,
      planInstanceId: assessment.instanceId,
      assessmentCount: 1,
    });
  }
  return {
    ...currentAssessment,
    priorityValidation: {
      ...validation,
      status: "accepted",
      effectiveClass: validation.effectiveClass,
    },
  };
}

function hasReliablePriorityIntentOverrideEvidence(
  assessment: PlanAssessment,
): boolean {
  const priorityClass = assessment.priorityClaim.requestedClass;
  if (priorityClass === "P1" || priorityClass === "P2") {
    return Boolean(
      assessment.priorityClaim.witness &&
        STRONG_GUARANTEES.has(assessment.priorityClaim.witness.guarantee) &&
        assessment.priorityClaim.witness.evidenceCode.trim().length > 0,
    );
  }
  if (priorityClass === "P3") {
    return (
      STRONG_GUARANTEES.has(assessment.feasibility.confidence) &&
      assessment.evidenceCodes.some((code) => code.trim().length > 0)
    );
  }
  return false;
}

export function compareValidatedPlanAssessments(
  left: ValidatedPlanAssessment,
  right: ValidatedPlanAssessment,
): number {
  return (
    PRIORITY_RANK[left.priorityValidation.effectiveClass] -
      PRIORITY_RANK[right.priorityValidation.effectiveClass] ||
    right.withinClassValue - left.withinClassValue ||
    continuityValue(right.continuity) - continuityValue(left.continuity) ||
    left.instanceId.localeCompare(right.instanceId)
  );
}

function claimReasonMatchesClass(claim: PriorityClaim): boolean {
  switch (claim.requestedClass) {
    case "P1":
      return (
        claim.reasonCode === "terminal_win" ||
        claim.reasonCode === "prevent_terminal_loss"
      );
    case "P2":
      return (
        claim.reasonCode === "survival_threat" ||
        claim.reasonCode === "score_threat" ||
        claim.reasonCode === "irreversible_threat"
      );
    case "P3":
      return claim.reasonCode === "expiring_conversion";
    case "P4":
      return claim.reasonCode === "strategic_campaign";
    case "P5":
      return (
        claim.reasonCode === "required_parent_support" ||
        claim.reasonCode === "development_need"
      );
    case "P6":
      return (
        claim.reasonCode === "neutral_progress" ||
        claim.reasonCode === "turn_completion"
      );
  }
}

function continuityValue(continuity: ContinuityAssessment): number {
  return (
    (continuity.isCurrentForeground ? 100 : 0) +
    (continuity.sameObjectiveAsForeground ? 40 : 0) +
    continuity.progressAtRisk -
    continuity.switchingCost
  );
}
