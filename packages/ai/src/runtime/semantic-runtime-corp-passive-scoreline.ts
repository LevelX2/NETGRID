import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type {
  CorpScorelineWindowAssessment,
} from "./corp-scoreline/semantic-runtime-corp-scoreline-assessment";

import { rolesMatch } from "./role-match";

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
  scorelineWindowAssessment?: (
    input: AiDecisionInput,
  ) => CorpScorelineWindowAssessment;
  actionIsScoreLine: (input: AiDecisionInput, action: LegalAction) => boolean;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  scoreLineActionIsRisky?: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
};

export function semanticRuntimeCorpPassiveScoreLinePenalty(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpPassiveScoreLineDependencies,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "corp") return undefined;
  const scoreline = dependencies.scorelineWindowAssessment?.(input);
  if (scoreline) {
    return passiveScorelinePenaltyFromAssessment(input, action, dependencies, scoreline);
  }
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
  if (!hasSafeTerminalScoreLineAction(input, terminalActionIds, dependencies)) {
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

function passiveScorelinePenaltyFromAssessment(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpPassiveScoreLineDependencies,
  scoreline: CorpScorelineWindowAssessment,
): AiDecisionScoreComponent | undefined {
  const safeScorelineActionIds = new Set(
    scoreline.paths
      .filter(
        (path) =>
          !path.blocked &&
          (path.recommendedNextStep === "score_now" ||
            path.recommendedNextStep === "advance_agenda"),
      )
      .map((path) => path.actionId),
  );
  if (safeScorelineActionIds.size === 0) return undefined;
  if (safeScorelineActionIds.has(action.actionId)) return undefined;
  const actionPath = scoreline.paths.find(
    (path) => path.actionId === action.actionId,
  );
  if (actionPath?.recommendedNextStep === "fund_scoreline") return undefined;
  const bestPath = scoreline.bestPath;
  if (
    !bestPath ||
    bestPath.blocked ||
    (bestPath.recommendedNextStep !== "score_now" &&
      bestPath.recommendedNextStep !== "advance_agenda")
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

function hasSafeTerminalScoreLineAction(
  input: AiDecisionInput,
  terminalActionIds: ReadonlySet<string>,
  dependencies: SemanticRuntimeCorpPassiveScoreLineDependencies,
): boolean {
  if (!dependencies.scoreLineActionIsRisky) return true;
  const terminalActions = input.legalActions.filter((candidate) =>
    terminalActionIds.has(candidate.actionId),
  );
  if (terminalActions.length === 0) return true;
  return terminalActions.some(
    (candidate) =>
      candidate.type === "score_agenda" ||
      !dependencies.scoreLineActionIsRisky?.(input, candidate),
  );
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
    return rolesMatch(roles, ["economy"])
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
