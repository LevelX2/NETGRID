import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import {
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import { createAiHintsByCard, RUNTIME_CARDS } from "../ai-hints";
import {
  assessKnownRezzedIcePath,
  endTheRunSubroutineCount,
} from "../visible-run-analysis";
import { semanticRuntimeCorpCentralPressureAssessment } from "./semantic-runtime-corp-central-pressure";
import { semanticRuntimeCorpObservedRemoteReachability } from "./semantic-runtime-corp-remote-reachability";
import { visibleRunnerExposureCreditValue } from "./visible-runner-action-economy";
import { decisionDerivedValue } from "./decision-derived-cache";

const AI_HINTS_BY_CARD = createAiHintsByCard();
import type {
  CorpScoringWindowAssessment,
  CorpServerLike,
  SemanticRuntimeCorpScoringWindowDependencies,
} from "./corp-scoreline/semantic-runtime-corp-scoring-window-contracts";

export type {
  CorpScoringWindowAgendaStealSeverity,
  CorpScoringWindowAssessment,
  CorpScoringWindowHorizon,
  CorpScoringWindowKind,
  CorpScoringWindowNextStep,
  SemanticRuntimeCorpScoringWindowDependencies,
} from "./corp-scoreline/semantic-runtime-corp-scoring-window-contracts";
import {
  projectedRemoteServerForAction,
  scoringWindowAccessAssessment,
  scoringWindowPostRezProtectionAssessment,
  scoringWindowAgendaPointsAtRisk,
  scoringWindowAgendaStealSeverity,
  scoringWindowDelayedScoreExposureRisk,
  scoringWindowHorizon,
  scoringWindowKind,
  scoringWindowPreExposureAdvancementCreditReserve,
  scoringWindowRecommendedNextStep,
  scoringWindowRezBudget,
  scoringWindowRunnerExposureCreditActions,
  semanticRuntimeCorpCentralPressure,
  semanticRuntimeCorpHasAgendaInHq,
  strongestExistingScoringRemote,
} from "./corp-scoreline/semantic-runtime-corp-scoring-window-projection";

const CORP_SCORING_WINDOW_DECISION_CACHE_KEY = Symbol("corp-scoring-window");
type CorpScoringWindowDecisionCache = WeakMap<
  object,
  Map<LegalAction, Map<string, CorpScoringWindowAssessment | undefined>>
>;

export function semanticRuntimeCorpScoringWindowAssessment<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
  roles: string[] = [],
): CorpScoringWindowAssessment | undefined {
  const cache = decisionDerivedValue<CorpScoringWindowDecisionCache>(
    input,
    CORP_SCORING_WINDOW_DECISION_CACHE_KEY,
    () => new WeakMap(),
  );
  let byAction = cache.get(dependencies);
  if (!byAction) {
    byAction = new Map();
    cache.set(dependencies, byAction);
  }
  let byRoles = byAction.get(action);
  if (!byRoles) {
    byRoles = new Map();
    byAction.set(action, byRoles);
  }
  const rolesKey = roles.join("\u0000");
  if (byRoles.has(rolesKey)) return byRoles.get(rolesKey);
  const assessment = buildSemanticRuntimeCorpScoringWindowAssessment(
    input,
    action,
    dependencies,
    roles,
  );
  byRoles.set(rolesKey, assessment);
  return assessment;
}

function buildSemanticRuntimeCorpScoringWindowAssessment<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoringWindowDependencies<TServer>,
  roles: string[],
): CorpScoringWindowAssessment | undefined {
  if (input.side !== "corp" || action.side !== "corp") return undefined;
  const serverId = dependencies.actionServerId(input, action);
  if (!dependencies.isRemoteServerTarget(serverId) || !serverId) {
    return undefined;
  }
  const scoreLineAction =
    action.type === "score_agenda" ||
    ((action.type === "install_card" || action.type === "advance_card") &&
      dependencies.actionIsScoreLine(input, action, roles));
  const remoteIceInstall =
    action.type === "install_card" && action.payload?.placement === "ice";
  if (!scoreLineAction && !remoteIceInstall) return undefined;

  const server = dependencies.server(input, serverId);
  const projectedServer = projectedRemoteServerForAction(
    input,
    action,
    server,
    dependencies,
  );
  const scoreHorizon = scoringWindowHorizon(input, action, dependencies);
  const sourceCard = dependencies.actionSourceCard?.(input, action);
  const creditsAfterAction =
    input.playerView.own.credits - dependencies.actionCreditCost(action);
  const preExposureAdvancementCreditReserve =
    scoringWindowPreExposureAdvancementCreditReserve(
      input,
      action,
      dependencies,
      scoreHorizon,
      scoreLineAction,
    );
  const rezBudget = scoringWindowRezBudget(
    input,
    projectedServer,
    creditsAfterAction,
    preExposureAdvancementCreditReserve,
  );
  const currentAccess = scoringWindowAccessAssessment(input, projectedServer);
  const access = scoringWindowPostRezProtectionAssessment(
    input,
    projectedServer,
    0,
    creditsAfterAction,
    preExposureAdvancementCreditReserve,
  );
  const runnerExposureCreditActions = scoringWindowRunnerExposureCreditActions(
    input,
    scoreHorizon,
    scoreLineAction,
  );
  const runnerExposureCredits = visibleRunnerExposureCreditValue(
    input,
    runnerExposureCreditActions,
  );
  const exposureAccess =
    runnerExposureCreditActions > 0
      ? scoringWindowPostRezProtectionAssessment(
          input,
          projectedServer,
          runnerExposureCredits,
          creditsAfterAction,
          preExposureAdvancementCreditReserve,
        )
      : access;
  const hasScorePressure =
    scoreLineAction ||
    semanticRuntimeCorpHasAgendaInHq(input) ||
    dependencies.remoteHasScoreLine(server);
  const centralPressure = semanticRuntimeCorpCentralPressure(input);
  const existingWindow = strongestExistingScoringRemote(input, dependencies);
  const immediateScore =
    action.type === "score_agenda" ||
    dependencies.advanceCompletesScore(input, action) ||
    scoreHorizon === "immediate";
  const agendaPointsAtRisk = scoringWindowAgendaPointsAtRisk(
    input,
    action,
    projectedServer,
    dependencies,
    scoreLineAction,
  );
  const runnerAgendaPointsAfterSteal =
    input.playerView.opponent.agendaPoints + agendaPointsAtRisk;
  const agendaStealSeverity = scoringWindowAgendaStealSeverity(
    input,
    agendaPointsAtRisk,
  );
  const runnerCanContestNow =
    !immediateScore &&
    access.runnerCanReachAccessNow &&
    access.agendaStealRelevantNow;
  const runnerCanContestBeforeScore =
    !immediateScore &&
    exposureAccess.runnerCanReachAccessNow &&
    exposureAccess.agendaStealRelevantNow;
  const delayedExposureRisk = scoringWindowDelayedScoreExposureRisk({
    agendaInstall:
      action.type === "install_card" &&
      action.payload?.placement !== "ice" &&
      action.payload?.cardType === "agenda" &&
      sourceCard?.type === "agenda",
    access,
    agendaStealSeverity,
    exposureAccess,
    immediateScore,
    projectedServer,
    rezBudget,
    runnerExposureCreditActions,
    scoreHorizon,
    scoreLineAction,
  });

  const windowKind = scoringWindowKind({
    action,
    access,
    centralPressure,
    delayedExposureRisk,
    exposureAccess,
    existingWindow,
    hasScorePressure,
    immediateScore,
    projectedServer,
    rezBudget,
    runnerCanContestBeforeScore,
    runnerExposureCreditActions,
    agendaStealSeverity,
    scoreLineAction,
  });
  const recommendedNextStep = scoringWindowRecommendedNextStep({
    action,
    agendaStealSeverity,
    hasScorePressure,
    projectedServer,
    windowKind,
    rezBudget,
    runnerExposureCreditActions,
    runnerCanContestBeforeScore,
    centralPressure,
    delayedExposureRisk,
  });

  return {
    serverId,
    windowKind,
    runnerCanContestNow,
    runnerCanReachAccessNow: currentAccess.runnerCanReachAccessNow,
    agendaStealRelevantNow: currentAccess.agendaStealRelevantNow,
    runnerCanContestBeforeScore,
    runnerCanReachAccessBeforeScore: exposureAccess.runnerCanReachAccessNow,
    agendaStealRelevantBeforeScore: exposureAccess.agendaStealRelevantNow,
    agendaPointsAtRisk,
    runnerAgendaPointsAfterSteal,
    agendaStealSeverity,
    missingVisibleBreakerCoverage: access.missingVisibleBreakerCoverage,
    corpCanRezRelevantIce: rezBudget.corpCanRezRelevantIce,
    affordableDurableRelevantIceCount:
      rezBudget.affordableDurableRelevantIceCount,
    dynamicProtectionWeaknessCount: rezBudget.dynamicProtectionWeaknessCount,
    dynamicProtectionReserve: rezBudget.dynamicProtectionReserve,
    corpCanRezFullPathWithDynamicReserve:
      rezBudget.corpCanRezFullPathWithDynamicReserve,
    scoreHorizon,
    runnerExposureCreditActions,
    recommendedNextStep,
    evidence: [
      "corp_scoring_window:assessed",
      `server:${serverId}`,
      `window_kind:${windowKind}`,
      `score_horizon:${scoreHorizon}`,
      `runner_can_contest_now:${runnerCanContestNow}`,
      `runner_can_reach_access_now:${currentAccess.runnerCanReachAccessNow}`,
      `agenda_steal_relevant_now:${currentAccess.agendaStealRelevantNow}`,
      `runner_can_contest_before_score:${runnerCanContestBeforeScore}`,
      `runner_can_reach_access_before_score:${exposureAccess.runnerCanReachAccessNow}`,
      `agenda_steal_relevant_before_score:${exposureAccess.agendaStealRelevantNow}`,
      `agenda_points_at_risk:${agendaPointsAtRisk}`,
      `runner_agenda_points_after_steal:${runnerAgendaPointsAfterSteal}`,
      `agenda_steal_severity:${agendaStealSeverity}`,
      `delayed_score_exposure_risk:${delayedExposureRisk}`,
      `runner_exposure_credit_actions:${runnerExposureCreditActions}`,
      `runner_exposure_credits:${runnerExposureCredits}`,
      `pre_exposure_advancement_credit_reserve:${preExposureAdvancementCreditReserve}`,
      `missing_visible_installed_coverage:${access.missingVisibleBreakerCoverage}`,
      `corp_can_rez_relevant_ice:${rezBudget.corpCanRezRelevantIce}`,
      `remote_rez_budget_knowledge:${rezBudget.knowledge}`,
      `corp_can_rez_full_path:${rezBudget.corpCanRezFullPath}`,
      `corp_can_rez_full_path_with_dynamic_reserve:${rezBudget.corpCanRezFullPathWithDynamicReserve}`,
      `remote_effective_ice_count:${access.effectiveIceCount}`,
      `remote_affordable_ice_count:${rezBudget.affordableIceCount}`,
      `remote_relevant_ice_count:${rezBudget.relevantIceCount}`,
      `remote_affordable_relevant_ice_count:${rezBudget.affordableRelevantIceCount}`,
      `remote_durable_relevant_ice_count:${rezBudget.durableRelevantIceCount}`,
      `remote_weak_position_scaling_ice_count:${rezBudget.weakPositionScalingIceCount}`,
      `remote_dynamic_protection_weakness_count:${rezBudget.dynamicProtectionWeaknessCount}`,
      `remote_dynamic_protection_reserve:${rezBudget.dynamicProtectionReserve}`,
      `visible_runner_contest_credits:${access.visibleRunnerContestCredits}`,
      `visible_runner_exposure_contest_credits:${exposureAccess.visibleRunnerContestCredits}`,
      `central_pressure:${centralPressure}`,
      `existing_scoring_remote:${existingWindow}`,
      `recommended_next_step:${recommendedNextStep}`,
      ...currentAccess.evidence,
      ...access.evidence.map((entry) => `post_rez_${entry}`),
      ...(runnerExposureCreditActions > 0
        ? exposureAccess.evidence.map((entry) => `exposure_${entry}`)
        : []),
      ...rezBudget.evidence,
    ],
  };
}
