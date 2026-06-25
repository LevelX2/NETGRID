import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

type EvidenceAssessment = {
  evidence: string[];
};

type PassiveScoreLinePenaltyLike = {
  reason?: string;
};

type CorpServerLike = {
  root: readonly unknown[];
};

export type SemanticRuntimeCorpEvidenceDependencies<
  TServer extends CorpServerLike = CorpServerLike,
> = {
  emptyRemoteCount: (input: AiDecisionInput) => number;
  hasRemoteInstability: (input: AiDecisionInput) => boolean;
  hasNakedScoreLine: (input: AiDecisionInput) => boolean;
  hasUnsafeRemoteScoreAction: (input: AiDecisionInput) => boolean;
  hasContestableRemoteScoreAction: (input: AiDecisionInput) => boolean;
  hasRemoteRezFloorFundingNeed: (input: AiDecisionInput) => boolean;
  hasCentralRezFloorFundingNeed: (input: AiDecisionInput) => boolean;
  advancementCounterPlacementAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => EvidenceAssessment | undefined;
  passiveScoreLinePenalty: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => PassiveScoreLinePenaltyLike | undefined;
  actionServerId: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  server: (
    input: AiDecisionInput,
    serverId: string | undefined,
  ) => TServer | undefined;
  remoteIsProtected: (server: TServer | undefined) => boolean;
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  shouldBuildProtectedScoreRemote: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  actionWouldCreateUnsafeRemoteScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  advanceCompletesScore: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  remoteRezFloorAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => EvidenceAssessment | undefined;
};

export function semanticRuntimeCorpEvidence<TServer extends CorpServerLike>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpEvidenceDependencies<TServer>,
): string[] {
  if (input.side !== "corp") return [];
  const evidence = [
    `corp_empty_remote_count:${dependencies.emptyRemoteCount(input)}`,
  ];
  if (dependencies.hasRemoteInstability(input)) {
    evidence.push("corp_remote_risk:present");
  }
  if (dependencies.hasNakedScoreLine(input)) {
    evidence.push("corp_remote_risk:naked_score_line_present");
  }
  if (
    dependencies.hasUnsafeRemoteScoreAction(input) ||
    dependencies.hasContestableRemoteScoreAction(input)
  ) {
    evidence.push("corp_remote_risk:unsafe_score_action_available");
  }
  if (dependencies.hasRemoteRezFloorFundingNeed(input)) {
    evidence.push("remote_rez_floor_funding_need:true");
  }
  if (dependencies.hasCentralRezFloorFundingNeed(input)) {
    evidence.push("central_rez_floor_funding_need:true");
  }
  if (action.type === "gain_credit") {
    evidence.push("corp_safe_alternative:economy");
  }
  if (action.type === "draw_card") {
    evidence.push("corp_safe_alternative:draw");
  }
  const advancementPlacement =
    dependencies.advancementCounterPlacementAssessment(input, action);
  if (advancementPlacement) {
    evidence.push(...advancementPlacement.evidence);
  }
  const passiveScoreLinePenalty = dependencies.passiveScoreLinePenalty(
    input,
    action,
  );
  if (passiveScoreLinePenalty) {
    evidence.push("corp_passive_scoreline_available:true");
    evidence.push(
      `corp_passive_scoreline_kind:${passiveScoreLinePenalty.reason}`,
    );
  }

  const serverId = dependencies.actionServerId(input, action);
  const server = dependencies.server(input, serverId);
  if (
    action.type === "install_card" &&
    action.payload?.placement === "ice" &&
    (serverId === "hq" || serverId === "rd")
  ) {
    evidence.push("corp_protection:central_ice");
  }
  if (!dependencies.isRemoteServerTarget(serverId)) return evidence;

  evidence.push(
    serverId === "new_remote"
      ? "corp_remote_target:new_remote"
      : "corp_remote_target:existing_remote",
  );
  evidence.push(
    dependencies.remoteIsProtected(server)
      ? "corp_remote_protection:protected"
      : "corp_remote_protection:unprotected",
  );
  if (
    action.type === "install_card" &&
    action.payload?.placement === "ice" &&
    (server?.root.length ?? 0) === 0
  ) {
    evidence.push("corp_remote_risk:new_empty_remote");
  }
  if (dependencies.shouldBuildProtectedScoreRemote(input, action)) {
    evidence.push("corp_scoreline_remote_seed:agenda_in_hq");
    evidence.push("corp_scoreline_remote_seed:build_protected_remote");
  }
  if (dependencies.actionWouldCreateUnsafeRemoteScoreLine(input, action)) {
    evidence.push("corp_remote_risk:naked_score_line");
  }
  if (
    action.type === "advance_card" &&
    !dependencies.remoteIsProtected(server) &&
    !dependencies.advanceCompletesScore(input, action)
  ) {
    evidence.push("corp_remote_risk:naked_advance_line");
  }
  if (dependencies.advanceCompletesScore(input, action)) {
    evidence.push("corp_remote_score_line:scoreable_after_action");
  }
  const rezFloorAssessment = dependencies.remoteRezFloorAssessment(
    input,
    action,
  );
  if (rezFloorAssessment) {
    evidence.push(...rezFloorAssessment.evidence);
  }
  return evidence;
}
