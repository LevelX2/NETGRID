import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

type CorpScoreTerminalWindowLike = {
  terminalWindow: boolean;
  scoreActionIds: readonly string[];
  advanceToScoreActionIds: readonly string[];
  agendaInstallActionIds: readonly string[];
  blockedByCheapContest?: boolean;
  blockedByCredits?: boolean;
  blockedByRunnerContest?: boolean;
  blockedByHqThreat?: boolean;
};

export type SemanticRuntimeCorpPassiveScoreLineDependencies = {
  scoreTerminalWindow: (
    input: AiDecisionInput,
  ) => CorpScoreTerminalWindowLike;
  actionIsScoreLine: (input: AiDecisionInput, action: LegalAction) => boolean;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
};

export function semanticRuntimeCorpPassiveScoreLinePenalty(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpPassiveScoreLineDependencies,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "corp") return undefined;
  const terminal = dependencies.scoreTerminalWindow(input);
  const terminalActionIds = new Set([
    ...terminal.scoreActionIds,
    ...terminal.advanceToScoreActionIds,
    ...terminal.agendaInstallActionIds,
  ]);
  if (!terminal.terminalWindow || terminalActionIds.size === 0) {
    return undefined;
  }
  if (terminalActionIds.has(action.actionId)) return undefined;
  if (
    terminal.blockedByCheapContest ||
    terminal.blockedByCredits ||
    terminal.blockedByRunnerContest ||
    terminal.blockedByHqThreat
  ) {
    return undefined;
  }
  const passiveKind = semanticRuntimeCorpPassiveScoreLineActionKind(
    input,
    action,
    dependencies,
  );
  if (!passiveKind) return undefined;
  return {
    key: "corp_passive_scoreline_available",
    label: "Passive Aktion trotz Scoreline",
    value: semanticRuntimeCorpPassiveScoreLinePenaltyValue(passiveKind),
    reason: passiveKind,
  };
}

function semanticRuntimeCorpPassiveScoreLineActionKind(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpPassiveScoreLineDependencies,
): string | undefined {
  if (action.type === "score_agenda" || action.type === "advance_card") {
    return undefined;
  }
  if (action.type === "gain_credit") return "economy";
  if (action.type === "draw_card") return "draw";
  if (action.type === "end_turn") return "end_turn";
  if (action.type === "decline_rez") return "decline_rez";
  if (action.type === "rez_ice") return "rez";
  if (action.type === "install_card") {
    if (dependencies.actionIsScoreLine(input, action)) return undefined;
    return action.payload?.placement === "ice" ? "install_ice" : "install";
  }
  if (
    action.type === "play_operation" ||
    action.type === "trigger_ability" ||
    action.type === "activated_card_ability"
  ) {
    const roles = dependencies.rolesForAction(input, action);
    return roles.some((role) => role.includes("economy"))
      ? "economy"
      : "non_score_action";
  }
  return undefined;
}

function semanticRuntimeCorpPassiveScoreLinePenaltyValue(
  passiveKind: string,
): number {
  switch (passiveKind) {
    case "economy":
    case "draw":
    case "end_turn":
      return -2400;
    case "install":
    case "install_ice":
      return -1500;
    case "decline_rez":
    case "rez":
      return -900;
    default:
      return -700;
  }
}
