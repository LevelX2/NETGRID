import type {
  ObservedAccessOutcome,
  ProjectedAccessOutcome,
} from "../access/access-outcome-projection";

export type AccessOutcomeFeedbackMismatch =
  | "predicted_trash_actual_decline"
  | "predicted_decline_actual_trash"
  | "predicted_payoff_no_payoff"
  | "predicted_no_payoff_agenda"
  | "target_changed_before_access";

export type AccessOutcomeFeedbackReport = {
  kind: "access_outcome_feedback";
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
  projected: ProjectedAccessOutcome;
  observed: ObservedAccessOutcome;
  mismatchClasses: AccessOutcomeFeedbackMismatch[];
  evidence: string[];
};

export function compareProjectedAndObservedAccessOutcome(params: {
  projected: ProjectedAccessOutcome;
  observed: ObservedAccessOutcome;
}): AccessOutcomeFeedbackReport {
  const mismatchClasses = accessOutcomeMismatchClasses(params);
  return {
    kind: "access_outcome_feedback",
    productiveUseAllowed: false,
    runtimeConsumerStatus: "none",
    projected: params.projected,
    observed: params.observed,
    mismatchClasses,
    evidence: [
      "access_outcome_feedback_kind:projected_vs_observed",
      "access_outcome_feedback_productive_use_allowed:false",
      "access_outcome_feedback_runtime_consumer_status:none",
      `access_outcome_feedback_projected_intent:${params.projected.projectedIntent}`,
      `access_outcome_feedback_observed_intent:${params.observed.observedIntent}`,
      ...mismatchClasses.map(
        (mismatchClass) => `access_outcome_feedback_mismatch:${mismatchClass}`,
      ),
      ...params.projected.evidence,
      ...params.observed.evidence,
    ],
  };
}

function accessOutcomeMismatchClasses(params: {
  projected: ProjectedAccessOutcome;
  observed: ObservedAccessOutcome;
}): AccessOutcomeFeedbackMismatch[] {
  const mismatches = new Set<AccessOutcomeFeedbackMismatch>();
  if (
    params.projected.serverId !== params.observed.serverId ||
    params.projected.knownRootDefinitionId !==
      params.observed.knownRootDefinitionId
  ) {
    mismatches.add("target_changed_before_access");
  }
  if (
    params.projected.projectedIntent === "trash" &&
    params.observed.observedIntent === "decline"
  ) {
    mismatches.add("predicted_trash_actual_decline");
  }
  if (
    params.projected.projectedIntent === "decline" &&
    params.observed.observedIntent === "trash"
  ) {
    mismatches.add("predicted_decline_actual_trash");
  }
  if (
    params.projected.projectedIntent === "steal" &&
    params.observed.observedIntent !== "steal"
  ) {
    mismatches.add("predicted_payoff_no_payoff");
  }
  if (
    params.projected.projectedIntent !== "steal" &&
    params.observed.observedIntent === "steal"
  ) {
    mismatches.add("predicted_no_payoff_agenda");
  }
  return [...mismatches];
}
