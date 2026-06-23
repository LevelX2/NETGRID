import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";

export type SemanticRuntimeRunnerSourceCardAnswerRole = (
  input: AiDecisionInput,
  action: LegalAction,
) => "search" | "draw" | undefined;

export type SemanticRuntimeScopeDependencies = {
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  runnerSourceCardAnswerRole: SemanticRuntimeRunnerSourceCardAnswerRole;
};

export function semanticRuntimeServerId(
  action: LegalAction,
): string | undefined {
  const serverId = action.payload?.serverId;
  return typeof serverId === "string" ? serverId : undefined;
}

export function semanticRuntimeScopeForAction(
  input: AiDecisionInput,
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  dependencies: SemanticRuntimeScopeDependencies,
): string {
  const candidateScope = semanticRuntimeScopeFromActionSemanticCandidate(
    action,
    actionSemanticCandidate,
    dependencies,
  );
  if (candidateScope) return candidateScope;
  if (action.type === "mandatory_draw") return "mandatory_draw";
  if (action.type === "resolve_choice") return "choice_resolution";
  if (action.type === "score_agenda") return "simple_score_advance";
  if (action.type === "advance_card") return "simple_score_advance";
  if (action.type === "remove_tag") return "tag_removal";
  if (action.type === "rez_ice" || action.type === "decline_rez") {
    return "simple_rez";
  }
  if (action.type === "start_run") {
    const serverId = semanticRuntimeServerId(action);
    if (serverId === "hq" || serverId === "rd")
      return "simple_hq_or_rnd_pressure";
    if (dependencies.isRemoteServerTarget(serverId)) return "remote_contest";
    return "simple_run_choice";
  }
  if (
    action.type === "access_card" ||
    action.type === "steal_agenda" ||
    action.type === "trash_accessed_card" ||
    action.type === "decline_trash"
  ) {
    return "access_trash_steal";
  }
  if (
    action.type === "install_card" ||
    action.type === "play_event" ||
    action.type === "play_operation" ||
    action.type === "trigger_ability" ||
    action.type === "activated_card_ability"
  ) {
    const runnerCardScope = semanticRuntimeRunnerCardActionDisplayScope(
      input,
      action,
      dependencies,
    );
    if (runnerCardScope) return runnerCardScope;
    return "basic_install";
  }
  if (action.type === "gain_credit" || action.type === "draw_card") {
    return "basic_economy_draw";
  }
  if (action.type === "break_subroutine" || action.type === "pump_breaker") {
    return "encounter_survival";
  }
  if (action.type === "continue_run" || action.type === "jack_out") {
    return "simple_run_choice";
  }
  if (
    action.type === "trash_resource" ||
    action.type === "purge_virus_counters" ||
    action.type === "purge_runner_virus_counters"
  ) {
    return "board_safety";
  }
  if (action.type === "end_turn") return "end_turn";
  return `${input.side}_legal_action`;
}

function semanticRuntimeScopeFromActionSemanticCandidate(
  action: LegalAction,
  candidate: ActionSemanticCandidate | undefined,
  dependencies: SemanticRuntimeScopeDependencies,
): string | undefined {
  switch (candidate?.semanticActionType) {
    case "draw.mandatory":
      return "mandatory_draw";
    case "choice.resolve":
      return "choice_resolution";
    case "score.agenda":
    case "score.advance_card":
      return "simple_score_advance";
    case "corp_window.rez":
    case "corp_window.decline_rez":
      return "simple_rez";
    case "economy.gain_credit":
    case "draw.card":
      return "basic_economy_draw";
    case "tag.remove":
      return "tag_removal";
    case "run.start": {
      const serverId = semanticRuntimeServerId(action);
      if (serverId === "hq" || serverId === "rd")
        return "simple_hq_or_rnd_pressure";
      if (dependencies.isRemoteServerTarget(serverId)) return "remote_contest";
      return "simple_run_choice";
    }
    case "run.continue":
    case "run.jack_out":
      return "simple_run_choice";
    case "access.resolve_card":
    case "access.steal_agenda":
    case "access.trash_accessed_card":
    case "access.decline_trash":
      return "access_trash_steal";
    case "turn_flow.end_turn":
      return "end_turn";
    default:
      return undefined;
  }
}

function semanticRuntimeRunnerCardActionDisplayScope(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeScopeDependencies,
): string | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  if (
    action.type !== "install_card" &&
    action.type !== "play_event" &&
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  ) {
    return undefined;
  }
  const sourceRole = dependencies.runnerSourceCardAnswerRole(input, action);
  if (sourceRole === "search") {
    return action.type === "install_card"
      ? "setup_card_search"
      : "coverage_search";
  }
  if (sourceRole === "draw" && action.type !== "install_card") {
    return "basic_economy_draw";
  }
  return undefined;
}
