import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { actionProvidesCredits } from "../../actions/action-effect-classification";
import type { CorpRemoteContestabilityAssessment } from "../corp-scoring-assessment-types";
import {
  semanticRuntimeCorpScoringWindowAssessment,
  type CorpScoringWindowAssessment,
  type SemanticRuntimeCorpScoringWindowDependencies,
} from "../semantic-runtime-corp-scoring-window";

type VisibleCorpServer = AiDecisionInput["playerView"]["servers"][number];

export type CorpScorelineWindowKind =
  | "none"
  | "score_now"
  | "advance_to_score"
  | "scoreline_setup"
  | "blocked";

export type CorpScorelineRecommendedNextStep =
  | "score_now"
  | "advance_agenda"
  | "install_agenda"
  | "fund_scoreline"
  | "protect_remote"
  | "protect_central"
  | "defer";

export type CorpScorelineActionRole =
  | "score_now"
  | "advance_to_score"
  | "advance_agenda"
  | "agenda_install"
  | "fund_scoreline"
  | "remote_protection"
  | "central_protection";

export type CorpScorelineBlockerKind =
  | "credits"
  | "cheap_contest"
  | "runner_contest"
  | "central_threat"
  | "unsafe_remote"
  | "no_score_path";

export type CorpScorelinePathAssessment = {
  actionId: string;
  actionType: LegalAction["type"];
  serverId?: string;
  actionRoles: CorpScorelineActionRole[];
  windowKind: CorpScorelineWindowKind;
  recommendedNextStep: CorpScorelineRecommendedNextStep;
  safe: boolean;
  blocked: boolean;
  blockers: CorpScorelineBlockerKind[];
  creditsBeforeAction: number;
  creditsAfterAction: number;
  scoreHorizon?: CorpScoringWindowAssessment["scoreHorizon"];
  scoringWindow?: CorpScoringWindowAssessment;
  evidence: string[];
};

export type CorpScorelineWindowAssessment = {
  windowKind: CorpScorelineWindowKind;
  terminalWindow: boolean;
  recommendedNextStep: CorpScorelineRecommendedNextStep;
  bestPath?: CorpScorelinePathAssessment;
  paths: CorpScorelinePathAssessment[];
  scoreActionIds: string[];
  advanceToScoreActionIds: string[];
  agendaInstallActionIds: string[];
  protectedRemoteIds: string[];
  blockedByCredits: boolean;
  blockedByCheapContest: boolean;
  blockedByRunnerContest: boolean;
  blockedByHqThreat: boolean;
  runnerAccessThreatHigh: boolean;
  evidence: string[];
};

export type CorpScoreTerminalWindowLike = {
  terminalWindow: boolean;
  scoreActionIds: string[];
  advanceToScoreActionIds: string[];
  agendaInstallActionIds: string[];
  protectedRemoteIds: string[];
  remoteContestLow: boolean;
  creditsSufficient: boolean;
  runnerAccessThreatHigh: boolean;
  blockedByCheapContest: boolean;
  blockedByCredits: boolean;
  blockedByRunnerContest: boolean;
  blockedByHqThreat: boolean;
  evidence: string[];
};

export type SemanticRuntimeCorpScorelineAssessmentDependencies<
  TServer extends VisibleCorpServer = VisibleCorpServer,
> = SemanticRuntimeCorpScoringWindowDependencies<TServer> & {
  rolesForAction?: (input: AiDecisionInput, action: LegalAction) => string[];
  projectedCreditsAfterAction?: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number | undefined;
  remoteIsProtected?: (server: TServer | undefined) => boolean;
  remoteContestabilityAssessment?: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpRemoteContestabilityAssessment | undefined;
  centralThreatHigh?: (input: AiDecisionInput) => boolean;
  actionIsEconomy?: (input: AiDecisionInput, action: LegalAction) => boolean;
};

export function assessCorpScorelineWindow<
  TServer extends VisibleCorpServer = VisibleCorpServer,
>(
  input: AiDecisionInput,
  dependencies: SemanticRuntimeCorpScorelineAssessmentDependencies<TServer>,
): CorpScorelineWindowAssessment {
  if (input.side !== "corp") {
    return emptyScorelineWindow(input, "not_corp_side");
  }
  const centralThreatHigh = dependencies.centralThreatHigh?.(input) ?? false;
  const basePaths = input.legalActions
    .map((action) =>
      scorelinePathForAction(input, action, dependencies, centralThreatHigh),
    )
    .filter((path): path is CorpScorelinePathAssessment => Boolean(path));
  const scorelineNeedsFunding = basePaths.some((path) =>
    path.blockers.includes("credits"),
  );
  const economyPaths = input.legalActions
    .filter((action) => dependencies.actionIsEconomy?.(input, action) === true)
    .map((action) =>
      scorelineFundingPathForAction(
        input,
        action,
        dependencies,
        scorelineNeedsFunding,
      ),
    )
    .filter((path): path is CorpScorelinePathAssessment => Boolean(path));
  const paths = mergePathsByActionId([...basePaths, ...economyPaths]);
  const bestPath = bestScorelinePath(paths);
  const terminalWindow =
    paths.some((path) => path.actionRoles.includes("score_now")) ||
    paths.some((path) => path.actionRoles.includes("advance_to_score")) ||
    paths.some((path) => path.actionRoles.includes("agenda_install")) ||
    paths.some((path) => path.actionRoles.includes("fund_scoreline")) ||
    paths.some((path) => path.actionRoles.includes("remote_protection")) ||
    paths.some((path) => path.actionRoles.includes("central_protection"));
  const windowKind = bestPath
    ? windowKindForBestPath(bestPath)
    : paths.some((path) => path.blocked)
      ? "blocked"
      : "none";
  const protectedRemoteIds = input.playerView.servers
    .filter((server): server is TServer => dependencies.isRemoteServerTarget(server.id))
    .filter((server) =>
      dependencies.remoteIsProtected
        ? dependencies.remoteIsProtected(server)
        : (server.ice.length ?? 0) > 0,
    )
    .map((server) => server.id)
    .sort();

  const blockedByCredits = paths.some((path) =>
    path.blockers.includes("credits"),
  );
  const blockedByCheapContest = paths.some((path) =>
    path.blockers.includes("cheap_contest"),
  );
  const blockedByRunnerContest = paths.some((path) =>
    path.blockers.includes("runner_contest"),
  );
  const blockedByHqThreat = paths.some((path) =>
    path.blockers.includes("central_threat"),
  );

  return {
    windowKind,
    terminalWindow,
    recommendedNextStep: bestPath?.recommendedNextStep ?? "defer",
    ...(bestPath ? { bestPath } : {}),
    paths,
    scoreActionIds: actionIdsForRole(paths, "score_now"),
    advanceToScoreActionIds: actionIdsForRole(paths, "advance_to_score"),
    agendaInstallActionIds: actionIdsForRole(paths, "agenda_install"),
    protectedRemoteIds,
    blockedByCredits,
    blockedByCheapContest,
    blockedByRunnerContest,
    blockedByHqThreat,
    runnerAccessThreatHigh: centralThreatHigh,
    evidence: [
      `corp_scoreline_terminal_window:${terminalWindow}`,
      `corp_scoreline_window_kind:${windowKind}`,
      `corp_scoreline_recommended_next_step:${bestPath?.recommendedNextStep ?? "defer"}`,
      `corp_scoreline_path_count:${paths.length}`,
      `corp_scoreline_blocked_by_credits:${blockedByCredits}`,
      `corp_scoreline_blocked_by_cheap_contest:${blockedByCheapContest}`,
      `corp_scoreline_blocked_by_runner_contest:${blockedByRunnerContest}`,
      `corp_scoreline_blocked_by_central_threat:${blockedByHqThreat}`,
      `corp_scoreline_runner_access_threat_high:${centralThreatHigh}`,
      ...(bestPath
        ? [`corp_scoreline_best_action:${scorelinePathSafeSignature(bestPath)}`]
        : []),
    ],
  };
}

export function scorelineAssessmentToTerminalWindowLike(
  assessment: CorpScorelineWindowAssessment,
): CorpScoreTerminalWindowLike {
  const scoreRemotePaths = assessment.paths.filter(
    (path) =>
      path.serverId?.startsWith("remote_") &&
      (path.actionRoles.includes("score_now") ||
        path.actionRoles.includes("advance_to_score") ||
        path.actionRoles.includes("agenda_install")),
  );
  const remoteContestLow =
    scoreRemotePaths.length > 0 &&
    scoreRemotePaths.some(
      (path) =>
        !path.blockers.includes("cheap_contest") &&
        !path.blockers.includes("runner_contest") &&
        !path.blockers.includes("unsafe_remote"),
    );
  return {
    terminalWindow: assessment.terminalWindow,
    scoreActionIds: assessment.scoreActionIds,
    advanceToScoreActionIds: assessment.advanceToScoreActionIds,
    agendaInstallActionIds: assessment.agendaInstallActionIds,
    protectedRemoteIds: assessment.protectedRemoteIds,
    remoteContestLow,
    creditsSufficient: !assessment.blockedByCredits,
    runnerAccessThreatHigh: assessment.runnerAccessThreatHigh,
    blockedByCheapContest: assessment.blockedByCheapContest,
    blockedByCredits: assessment.blockedByCredits,
    blockedByRunnerContest: assessment.blockedByRunnerContest,
    blockedByHqThreat: assessment.blockedByHqThreat,
    evidence: assessment.evidence,
  };
}

function scorelinePathForAction<TServer extends VisibleCorpServer>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScorelineAssessmentDependencies<TServer>,
  centralThreatHigh: boolean,
): CorpScorelinePathAssessment | undefined {
  if (action.side !== "corp") return undefined;
  const roles = dependencies.rolesForAction?.(input, action) ?? [];
  const serverId = dependencies.actionServerId(input, action);
  const server = dependencies.server(input, serverId);
  const actionRoles = scorelineActionRoles(
    input,
    action,
    dependencies,
    roles,
    server,
    centralThreatHigh,
  );
  if (actionRoles.length === 0) return undefined;
  const scoringWindow = semanticRuntimeCorpScoringWindowAssessment(
    input,
    action,
    dependencies,
    roles,
  );
  const creditsBeforeAction = input.playerView.own.credits;
  const creditsAfterAction =
    dependencies.projectedCreditsAfterAction?.(input, action) ??
    creditsBeforeAction - dependencies.actionCreditCost(action);
  const blockers = scorelineBlockersForPath({
    action,
    actionRoles,
    centralThreatHigh,
    creditsAfterAction,
    input,
    dependencies,
    scoringWindow,
  });
  const blocked = blockers.length > 0;
  const recommendedNextStep = scorelineRecommendedNextStep(
    actionRoles,
    blockers,
  );
  return {
    actionId: action.actionId,
    actionType: action.type,
    ...(serverId ? { serverId } : {}),
    actionRoles,
    windowKind: pathWindowKind(actionRoles, blocked),
    recommendedNextStep,
    safe: !blocked,
    blocked,
    blockers,
    creditsBeforeAction,
    creditsAfterAction,
    ...(scoringWindow?.scoreHorizon ? { scoreHorizon: scoringWindow.scoreHorizon } : {}),
    ...(scoringWindow ? { scoringWindow } : {}),
    evidence: [
      `corp_scoreline_action:${scorelineActionSafeSignature(action, actionRoles, serverId)}`,
      `corp_scoreline_action_type:${action.type}`,
      ...(serverId ? [`corp_scoreline_server:${serverId}`] : []),
      `corp_scoreline_roles:${actionRoles.join(",")}`,
      `corp_scoreline_path_blocked:${blocked}`,
      `corp_scoreline_path_recommended_next_step:${recommendedNextStep}`,
      `corp_scoreline_credits_before_action:${creditsBeforeAction}`,
      `corp_scoreline_credits_after_action:${creditsAfterAction}`,
      ...blockers.map((blocker) => `corp_scoreline_blocker:${blocker}`),
      ...(scoringWindow ? scoringWindow.evidence : []),
    ],
  };
}

function scorelineFundingPathForAction<TServer extends VisibleCorpServer>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScorelineAssessmentDependencies<TServer>,
  scorelineNeedsFunding: boolean,
): CorpScorelinePathAssessment | undefined {
  if (!scorelineNeedsFunding) return undefined;
  if (action.type === "gain_credit" && !actionProvidesCredits(action)) {
    return undefined;
  }
  const creditsBeforeAction = input.playerView.own.credits;
  const creditsAfterAction =
    dependencies.projectedCreditsAfterAction?.(input, action) ??
    projectedCreditsAfterEconomyAction(input, action, dependencies);
  if (creditsAfterAction <= creditsBeforeAction) return undefined;
  return {
    actionId: action.actionId,
    actionType: action.type,
    actionRoles: ["fund_scoreline"],
    windowKind: "scoreline_setup",
    recommendedNextStep: "fund_scoreline",
    safe: true,
    blocked: false,
    blockers: [],
    creditsBeforeAction,
    creditsAfterAction,
    evidence: [
      `corp_scoreline_action:${scorelineActionSafeSignature(action, ["fund_scoreline"])}`,
      `corp_scoreline_action_type:${action.type}`,
      "corp_scoreline_roles:fund_scoreline",
      "corp_scoreline_path_blocked:false",
      "corp_scoreline_path_recommended_next_step:fund_scoreline",
      `corp_scoreline_credits_before_action:${creditsBeforeAction}`,
      `corp_scoreline_credits_after_action:${creditsAfterAction}`,
    ],
  };
}

function scorelineActionRoles<TServer extends VisibleCorpServer>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScorelineAssessmentDependencies<TServer>,
  roles: readonly string[],
  server: TServer | undefined,
  centralThreatHigh: boolean,
): CorpScorelineActionRole[] {
  if (action.type === "score_agenda") return ["score_now"];
  if (action.type === "advance_card") {
    if (dependencies.advanceCompletesScore(input, action)) {
      return ["advance_to_score"];
    }
    return dependencies.actionIsScoreLine(input, action, [...roles])
      ? ["advance_agenda"]
      : [];
  }
  if (action.type === "install_card") {
    if (action.payload?.placement === "ice") {
      if (server?.id === "hq" || server?.id === "rd") {
        return centralThreatHigh ? ["central_protection"] : [];
      }
      return dependencies.isRemoteServerTarget(server?.id)
        ? ["remote_protection"]
        : [];
    }
    const protectedRemote = dependencies.remoteIsProtected
      ? dependencies.remoteIsProtected(server)
      : (server?.ice.length ?? 0) > 0;
    return dependencies.isRemoteServerTarget(server?.id) &&
      protectedRemote &&
      dependencies.actionIsScoreLine(input, action, [...roles])
      ? ["agenda_install"]
      : [];
  }
  return [];
}

function scorelineBlockersForPath<TServer extends VisibleCorpServer>(params: {
  action: LegalAction;
  actionRoles: readonly CorpScorelineActionRole[];
  centralThreatHigh: boolean;
  creditsAfterAction: number;
  input: AiDecisionInput;
  dependencies: SemanticRuntimeCorpScorelineAssessmentDependencies<TServer>;
  scoringWindow: CorpScoringWindowAssessment | undefined;
}): CorpScorelineBlockerKind[] {
  const blockers = new Set<CorpScorelineBlockerKind>();
  if (params.creditsAfterAction < 0) blockers.add("credits");
  const immediateScore = params.actionRoles.includes("score_now");
  const preparatoryScoreline =
    params.actionRoles.includes("advance_to_score") ||
    params.actionRoles.includes("advance_agenda") ||
    params.actionRoles.includes("agenda_install");
  if (preparatoryScoreline && params.scoringWindow?.windowKind === "unsafe") {
    blockers.add("unsafe_remote");
  }
  if (
    preparatoryScoreline &&
    params.scoringWindow?.runnerCanContestBeforeScore === true
  ) {
    blockers.add("runner_contest");
  }
  const contestability = params.dependencies.remoteContestabilityAssessment?.(
    params.input,
    params.action,
  );
  if (preparatoryScoreline && contestability?.contestable === true) {
    blockers.add("cheap_contest");
  }
  if (
    params.centralThreatHigh &&
    params.actionRoles.includes("agenda_install")
  ) {
    blockers.add("central_threat");
  }
  if (
    !immediateScore &&
    preparatoryScoreline &&
    !params.scoringWindow &&
    params.action.type !== "install_card"
  ) {
    blockers.add("no_score_path");
  }
  if (
    preparatoryScoreline &&
    params.scoringWindow?.recommendedNextStep === "gain_credit"
  ) {
    blockers.add("credits");
  }
  return [...blockers].sort();
}

function scorelineRecommendedNextStep(
  actionRoles: readonly CorpScorelineActionRole[],
  blockers: readonly CorpScorelineBlockerKind[],
): CorpScorelineRecommendedNextStep {
  if (blockers.includes("credits")) return "fund_scoreline";
  if (blockers.includes("central_threat")) return "protect_central";
  if (
    blockers.includes("cheap_contest") ||
    blockers.includes("runner_contest") ||
    blockers.includes("unsafe_remote")
  ) {
    return "protect_remote";
  }
  if (actionRoles.includes("score_now")) return "score_now";
  if (
    actionRoles.includes("advance_to_score") ||
    actionRoles.includes("advance_agenda")
  ) {
    return "advance_agenda";
  }
  if (actionRoles.includes("agenda_install")) return "install_agenda";
  if (actionRoles.includes("fund_scoreline")) return "fund_scoreline";
  if (actionRoles.includes("central_protection")) return "protect_central";
  if (actionRoles.includes("remote_protection")) return "protect_remote";
  return "defer";
}

function scorelinePathSafeSignature(path: CorpScorelinePathAssessment): string {
  return [
    path.actionType,
    path.actionRoles.join("+") || "unclassified",
    path.serverId ?? "none",
  ].join(":");
}

function scorelineActionSafeSignature(
  action: LegalAction,
  actionRoles: readonly CorpScorelineActionRole[],
  serverId?: string,
): string {
  return [
    action.type,
    actionRoles.join("+") || "unclassified",
    serverId ?? action.payload?.serverId ?? "none",
  ].join(":");
}

function pathWindowKind(
  actionRoles: readonly CorpScorelineActionRole[],
  blocked: boolean,
): CorpScorelineWindowKind {
  if (blocked) return "blocked";
  if (actionRoles.includes("score_now")) return "score_now";
  if (actionRoles.includes("advance_to_score")) return "advance_to_score";
  if (
    actionRoles.includes("advance_agenda") ||
    actionRoles.includes("agenda_install") ||
    actionRoles.includes("fund_scoreline") ||
    actionRoles.includes("remote_protection") ||
    actionRoles.includes("central_protection")
  ) {
    return "scoreline_setup";
  }
  return "none";
}

function windowKindForBestPath(
  path: CorpScorelinePathAssessment,
): CorpScorelineWindowKind {
  if (path.blocked) return "blocked";
  return path.windowKind;
}

function bestScorelinePath(
  paths: readonly CorpScorelinePathAssessment[],
): CorpScorelinePathAssessment | undefined {
  return [...paths].sort(
    (left, right) =>
      scorelinePathPriority(left) - scorelinePathPriority(right) ||
      left.actionId.localeCompare(right.actionId),
  )[0];
}

function scorelinePathPriority(path: CorpScorelinePathAssessment): number {
  if (!path.blocked && path.recommendedNextStep === "score_now") return 0;
  if (!path.blocked && path.recommendedNextStep === "advance_agenda") return 1;
  if (!path.blocked && path.recommendedNextStep === "fund_scoreline") return 2;
  if (!path.blocked && path.recommendedNextStep === "protect_central") return 3;
  if (!path.blocked && path.recommendedNextStep === "protect_remote") return 4;
  if (!path.blocked && path.recommendedNextStep === "install_agenda") return 5;
  if (path.recommendedNextStep === "fund_scoreline") return 6;
  if (path.recommendedNextStep === "protect_central") return 7;
  if (path.recommendedNextStep === "protect_remote") return 8;
  return 20;
}

function mergePathsByActionId(
  paths: CorpScorelinePathAssessment[],
): CorpScorelinePathAssessment[] {
  const byActionId = new Map<string, CorpScorelinePathAssessment>();
  for (const path of paths) {
    const existing = byActionId.get(path.actionId);
    if (!existing) {
      byActionId.set(path.actionId, path);
      continue;
    }
    byActionId.set(path.actionId, {
      ...existing,
      actionRoles: [...new Set([...existing.actionRoles, ...path.actionRoles])],
      blockers: [...new Set([...existing.blockers, ...path.blockers])].sort(),
      blocked: existing.blocked || path.blocked,
      safe: existing.safe && path.safe,
      evidence: [...existing.evidence, ...path.evidence],
    });
  }
  return [...byActionId.values()];
}

function actionIdsForRole(
  paths: readonly CorpScorelinePathAssessment[],
  role: CorpScorelineActionRole,
): string[] {
  return paths
    .filter((path) => path.actionRoles.includes(role))
    .map((path) => path.actionId)
    .sort();
}

function projectedCreditsAfterEconomyAction<TServer extends VisibleCorpServer>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScorelineAssessmentDependencies<TServer>,
): number {
  const creditsAfterCosts =
    input.playerView.own.credits - dependencies.actionCreditCost(action);
  if (action.type === "gain_credit" && !actionProvidesCredits(action)) {
    return creditsAfterCosts;
  }
  const payloadGain = Math.max(
    0,
    numberPayload(action, "gainCreditsAmount"),
    numberPayload(action, "gainedCredits"),
    numberPayload(action, "amount"),
    numberPayload(action, "credits"),
  );
  if (action.type === "gain_credit") return creditsAfterCosts + Math.max(1, payloadGain);
  return creditsAfterCosts + payloadGain;
}

function numberPayload(action: LegalAction, key: string): number {
  const value = action.payload?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function emptyScorelineWindow(
  input: AiDecisionInput,
  reason: string,
): CorpScorelineWindowAssessment {
  return {
    windowKind: "none",
    terminalWindow: false,
    recommendedNextStep: "defer",
    paths: [],
    scoreActionIds: [],
    advanceToScoreActionIds: [],
    agendaInstallActionIds: [],
    protectedRemoteIds: [],
    blockedByCredits: false,
    blockedByCheapContest: false,
    blockedByRunnerContest: false,
    blockedByHqThreat: false,
    runnerAccessThreatHigh: false,
    evidence: [
      "corp_scoreline_terminal_window:false",
      "corp_scoreline_window_kind:none",
      `corp_scoreline_empty_reason:${reason}`,
      `corp_scoreline_side:${input.side}`,
    ],
  };
}
