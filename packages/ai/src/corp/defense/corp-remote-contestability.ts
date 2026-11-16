import { visibleIcePathTraceContext } from "../../run-analysis/trace-rules-profile-planning";
import { visibleRunnerRunCreditPool } from "../../runtime/visible-run-credit-facts";
import type { AiDecisionInput } from "@netgrid/shared";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { semanticRuntimeCorpObservedRemoteReachability } from "../../runtime/semantic-runtime-corp-remote-reachability";
import { visibleRunnerExposureCreditValue } from "../../runtime/visible-runner-action-economy";

export function corpRemoteContestabilityAssessment(
  input: AiDecisionInput,
  serverId: string,
):
  | {
      contestable: boolean;
      visibleRunnerContestCredits: number;
      visibleRunnerExposureContestCredits: number;
      assessedKnownIceCount: number;
      canReachAccess: boolean;
      creditsAfterPath: number;
      visibleBreakCost?: number;
      noAccessReason?: string;
      evidence: string[];
    }
  | undefined {
  const playerView = input.playerView;
  const server = playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server || server.ice.length === 0) return undefined;
  const runnerRig = playerView.opponent.rig ?? [];
  const visibleRunnerContestCredits =
    playerView.opponent.credits + visibleRunnerRunCreditPool(runnerRig);
  const runnerExposureCreditActions = Math.max(
    3,
    Math.floor((playerView.opponent.clicks ?? 4) - 1),
  );
  const additionalExposureCredits = visibleRunnerExposureCreditValue(
    input,
    runnerExposureCreditActions,
  );
  const visibleRunnerExposureContestCredits =
    visibleRunnerContestCredits + additionalExposureCredits;
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    runnerRig,
    visibleRunnerExposureContestCredits,
    server.root,
    input.playerView.own.credits,
    visibleIcePathTraceContext(input),
  );
  if (assessment.assessedKnownIceCount <= 0) return undefined;
  const observedReachability = semanticRuntimeCorpObservedRemoteReachability(
    input,
    serverId,
    server,
  );
  const missingCoverageAffordable =
    assessment.knownPathBlockedByMissingCoverage === true &&
    (assessment.visibleBreakCost ?? 0) > 0 &&
    visibleRunnerExposureContestCredits >= (assessment.visibleBreakCost ?? 0);
  const contestable =
    observedReachability.applies ||
    missingCoverageAffordable ||
    (assessment.canReachAccess === true && assessment.creditsAfterPath >= 0);
  return {
    contestable,
    visibleRunnerContestCredits,
    visibleRunnerExposureContestCredits,
    assessedKnownIceCount: assessment.assessedKnownIceCount,
    canReachAccess: assessment.canReachAccess,
    creditsAfterPath: assessment.creditsAfterPath,
    ...(assessment.visibleBreakCost !== undefined
      ? { visibleBreakCost: assessment.visibleBreakCost }
      : {}),
    ...(assessment.noAccessReason
      ? { noAccessReason: assessment.noAccessReason }
      : {}),
    evidence: [
      `remote_contestable_by_runner:${contestable}`,
      `runner_credits:${playerView.opponent.credits}`,
      `runner_visible_contest_credits:${visibleRunnerContestCredits}`,
      `runner_exposure_credit_actions:${runnerExposureCreditActions}`,
      `runner_exposure_credit_value:${additionalExposureCredits}`,
      `runner_visible_exposure_contest_credits:${visibleRunnerExposureContestCredits}`,
      `runner_visible_rig_count:${runnerRig.length}`,
      `assessed_known_ice_count:${assessment.assessedKnownIceCount}`,
      `can_reach_access:${assessment.canReachAccess}`,
      `credits_after_path:${assessment.creditsAfterPath}`,
      ...(assessment.visibleBreakCost !== undefined
        ? [`visible_break_cost:${assessment.visibleBreakCost}`]
        : []),
      ...(assessment.noAccessReason
        ? [`no_access_reason:${assessment.noAccessReason}`]
        : []),
      `missing_coverage_affordable:${missingCoverageAffordable}`,
      ...observedReachability.evidence,
    ],
  };
}
