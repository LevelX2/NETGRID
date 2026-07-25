import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type {
  RunnerPressureSignal,
  RunnerRemoteContestSignal,
  RunnerRunWindowActionAssessment,
} from "../plans/runner-tactical-plan-modules";

type RunnerRunOriginPurpose =
  | RunnerPressureSignal["purpose"]
  | RunnerRemoteContestSignal["purpose"];

export function runnerCandidateHasVisibleAdditionalAccessEffect(
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    candidate.sourceKind === "card" &&
    (candidate.actionType === "activated_card_ability" ||
      candidate.actionType === "trigger_ability") &&
    candidate.runAccessDecisionModel?.coverageStatus === "covered" &&
    candidate.runAccessDecisionModel.payoffs.includes("additional_access")
  );
}

export function assessRunnerAdditionalAccessRunWindowAction(params: {
  candidate: ActionSemanticCandidate;
  activeServerId: string | undefined;
  runOriginPurpose: RunnerRunOriginPurpose | undefined;
}): RunnerRunWindowActionAssessment | undefined {
  if (!runnerCandidateHasVisibleAdditionalAccessEffect(params.candidate)) {
    return undefined;
  }
  if (!params.activeServerId) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_additional_access_requires_visible_active_run",
      ],
    };
  }
  const scopedServers = runnerAdditionalAccessEffectServerScopes(
    params.candidate,
  );
  if (scopedServers.length === 0) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_additional_access_effect_server_scope_unknown",
      ],
    };
  }
  if (!scopedServers.includes(params.activeServerId)) {
    return {
      admissible: false,
      evidenceCodes: [
        `runner_additional_access_effect_server_mismatch:${params.activeServerId}`,
        `runner_additional_access_effect_scopes:${scopedServers.join(",")}`,
      ],
    };
  }
  if (params.runOriginPurpose !== "multiaccess") {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_additional_access_requires_bound_multiaccess_parent",
        `runner_additional_access_parent_purpose:${params.runOriginPurpose ?? "unknown"}`,
      ],
    };
  }
  return {
    admissible: true,
    evidenceCodes: [
      "runner_visible_additional_access_effect_plan_admissible",
      `runner_additional_access_effect_server:${params.activeServerId}`,
      "runner_additional_access_parent_purpose:multiaccess",
    ],
  };
}

function runnerAdditionalAccessEffectServerScopes(
  candidate: ActionSemanticCandidate,
): string[] {
  const scopes = new Set<string>();
  const modelServerId = candidate.runAccessDecisionModel?.serverId;
  if (modelServerId) scopes.add(modelServerId);
  for (const target of candidate.effectTargets ?? []) {
    const match = /^access\.(hq|rnd|archives)(?:[._]|$)/u.exec(target);
    if (!match?.[1]) continue;
    scopes.add(match[1] === "rnd" ? "rd" : match[1]);
  }
  return [...scopes].sort();
}
