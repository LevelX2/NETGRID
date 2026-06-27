import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { assessKnownRezzedIcePath } from "../visible-run-analysis";
import type { CorpRemoteContestabilityAssessment } from "./corp-scoring-assessment-types";

type VisibleCorpServer = AiDecisionInput["playerView"]["servers"][number];

export type SemanticRuntimeCorpRemoteContestabilityContextDependencies = {
  actionServerId: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  server: (
    input: AiDecisionInput,
    serverId: string | undefined,
  ) => VisibleCorpServer | undefined;
  actionIsScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  advanceCompletesScore: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  remoteIsProtected: (server: VisibleCorpServer | undefined) => boolean;
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
};

export function createSemanticRuntimeCorpRemoteContestabilityContext(
  dependencies: SemanticRuntimeCorpRemoteContestabilityContextDependencies,
): {
  semanticRuntimeCorpRemoteScoreContestabilityAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpRemoteContestabilityAssessment | undefined;
  semanticRuntimeCorpRemoteContestabilityAssessment: (
    input: AiDecisionInput,
    serverId: string,
  ) => CorpRemoteContestabilityAssessment | undefined;
} {
  const semanticRuntimeCorpRemoteContestabilityAssessment = (
    input: AiDecisionInput,
    serverId: string,
  ): CorpRemoteContestabilityAssessment | undefined => {
    if (input.side !== "corp" || !dependencies.isRemoteServerTarget(serverId))
      return undefined;
    const server = dependencies.server(input, serverId);
    if (!server || server.ice.length === 0) return undefined;
    const runnerRig = input.playerView.opponent.rig ?? [];
    const assessment = assessKnownRezzedIcePath(
      server.ice,
      runnerRig,
      input.playerView.opponent.credits,
      server.root,
    );
    if (assessment.assessedKnownIceCount <= 0) return undefined;
    const contestable =
      assessment.canReachAccess === true && assessment.creditsAfterPath >= 0;
    return {
      serverId,
      contestable,
      evidence: [
        `server:${serverId}`,
        `remote_contestable_by_runner:${contestable}`,
        `runner_credits:${input.playerView.opponent.credits}`,
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
      ],
    };
  };

  const semanticRuntimeCorpRemoteScoreContestabilityAssessment = (
    input: AiDecisionInput,
    action: LegalAction,
  ): CorpRemoteContestabilityAssessment | undefined => {
    if (input.side !== "corp" || action.side !== "corp") return undefined;
    if (action.type !== "advance_card" && action.type !== "install_card")
      return undefined;
    if (
      action.type === "install_card" &&
      (action.payload?.placement === "ice" ||
        !dependencies.actionIsScoreLine(input, action))
    )
      return undefined;
    if (dependencies.advanceCompletesScore(input, action)) return undefined;
    const serverId = dependencies.actionServerId(input, action);
    if (!serverId || !dependencies.isRemoteServerTarget(serverId))
      return undefined;
    const server = dependencies.server(input, serverId);
    if (!dependencies.remoteIsProtected(server)) {
      return {
        serverId,
        contestable: true,
        evidence: [
          "corp_remote_score_line:contestable_by_runner",
          `action_type:${action.type}`,
          `server:${serverId}`,
          "remote_unprotected:true",
          `runner_credits:${input.playerView.opponent.credits}`,
        ],
      };
    }
    const assessment = semanticRuntimeCorpRemoteContestabilityAssessment(
      input,
      serverId,
    );
    if (!assessment?.contestable) return undefined;
    return {
      ...assessment,
      evidence: [
        "corp_remote_score_line:contestable_by_runner",
        `action_type:${action.type}`,
        ...assessment.evidence,
      ],
    };
  };

  return {
    semanticRuntimeCorpRemoteScoreContestabilityAssessment,
    semanticRuntimeCorpRemoteContestabilityAssessment,
  };
}
