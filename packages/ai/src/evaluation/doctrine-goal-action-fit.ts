import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { DeckDoctrineV2Diagnostic } from "../deck-doctrine-strategy";
import { scoreActionGoalFit, type ActionGoalFit } from "../decision/action-goal-fit";
import { synthesizeDoctrineTacticalGoals } from "../decision/doctrine-goal-synthesis";
import { buildTacticalGoalUtilities } from "../decision/tactical-goal-utility";
import { assertSemanticObjectSideSafe } from "../diagnostics/semantic-redaction";

export type DoctrineGoalActionFitCase = {
  scenarioId: string;
  diagnostic?: DeckDoctrineV2Diagnostic;
  actionCandidates: readonly ActionSemanticCandidate[];
};

export type DoctrineGoalActionFitWorklistReason =
  | "blocked_action_fit"
  | "missing_action_candidate";

export type DoctrineGoalActionFitWorklistCandidate = {
  candidateId: string;
  scenarioId: string;
  goalId: string;
  family: string;
  reason: DoctrineGoalActionFitWorklistReason;
  topBlockedActionId?: string;
  blockers: string[];
  requiredActionSignals: string[];
  evidence: string[];
};

export type DoctrineGoalActionFitReport = {
  version: "doctrine-goal-action-fit-v1";
  scope: "doctrine_goal_action_fit_report";
  diagnosticOnly: true;
  scenarioCount: number;
  doctrineGoalsProduced: number;
  goalsWithAtLeastOneFit: number;
  goalsOnlyBlocked: number;
  goalsNoCandidate: number;
  topFitByFamily: Record<
    string,
    {
      goalId: string;
      actionId: string;
      fitStatus: ActionGoalFit["fitStatus"];
      score: number;
    }
  >;
  worklistCandidates: DoctrineGoalActionFitWorklistCandidate[];
  productiveUseAllowed: false;
  noRuntimeEffect: true;
  evidence: string[];
};

export function buildDoctrineGoalActionFitReport(
  cases: readonly DoctrineGoalActionFitCase[],
): DoctrineGoalActionFitReport {
  let doctrineGoalsProduced = 0;
  let goalsWithAtLeastOneFit = 0;
  let goalsOnlyBlocked = 0;
  let goalsNoCandidate = 0;
  const topFitByFamily: DoctrineGoalActionFitReport["topFitByFamily"] = {};
  const worklistCandidates: DoctrineGoalActionFitWorklistCandidate[] = [];

  for (const fitCase of cases) {
    const goals = synthesizeDoctrineTacticalGoals(fitCase.diagnostic);
    const utilities = buildTacticalGoalUtilities(goals);
    doctrineGoalsProduced += utilities.length;
    for (const utility of utilities) {
      const fits = fitCase.actionCandidates
        .map((candidate) =>
          scoreActionGoalFit({
            candidate,
            utility,
            legalActionIds: fitCase.actionCandidates.map(
              (entry) => entry.actionId,
            ),
          }),
        )
        .sort((left, right) => right.score - left.score);
      const relevantFits = fits.filter(
        (fit) => fit.fitStatus === "fit" || fit.fitStatus === "partial",
      );
      if (relevantFits.length > 0) {
        goalsWithAtLeastOneFit += 1;
      } else if (fits.some((fit) => fit.fitStatus === "blocked")) {
        goalsOnlyBlocked += 1;
        const topBlockedFit = fits.find((fit) => fit.fitStatus === "blocked");
        worklistCandidates.push(
          worklistCandidateForGoal({
            fitCase,
            utility,
            reason: "blocked_action_fit",
            ...(topBlockedFit ? { topBlockedFit } : {}),
          }),
        );
      } else {
        goalsNoCandidate += 1;
        worklistCandidates.push(
          worklistCandidateForGoal({
            fitCase,
            utility,
            reason: "missing_action_candidate",
          }),
        );
      }
      const top = relevantFits[0] ?? fits[0];
      if (!top) continue;
      const existing = topFitByFamily[utility.family];
      if (!existing || top.score > existing.score) {
        topFitByFamily[utility.family] = {
          goalId: utility.goalId,
          actionId: top.actionId,
          fitStatus: top.fitStatus,
          score: top.score,
        };
      }
    }
  }

  const report: DoctrineGoalActionFitReport = {
    version: "doctrine-goal-action-fit-v1",
    scope: "doctrine_goal_action_fit_report",
    diagnosticOnly: true,
    scenarioCount: cases.length,
    doctrineGoalsProduced,
    goalsWithAtLeastOneFit,
    goalsOnlyBlocked,
    goalsNoCandidate,
    topFitByFamily,
    worklistCandidates: worklistCandidates.sort(
      (left, right) =>
        left.scenarioId.localeCompare(right.scenarioId) ||
        left.family.localeCompare(right.family) ||
        left.goalId.localeCompare(right.goalId) ||
        left.reason.localeCompare(right.reason),
    ),
    productiveUseAllowed: false,
    noRuntimeEffect: true,
    evidence: [
      "doctrine_goal_action_fit:report_only",
      `scenario_count:${cases.length}`,
      `doctrine_goals_produced:${doctrineGoalsProduced}`,
      `goals_with_at_least_one_fit:${goalsWithAtLeastOneFit}`,
      `goals_only_blocked:${goalsOnlyBlocked}`,
      `goals_no_candidate:${goalsNoCandidate}`,
      `worklist_candidate_count:${worklistCandidates.length}`,
    ],
  };
  assertSemanticObjectSideSafe(report, "DoctrineGoalActionFitReport");
  return report;
}

function worklistCandidateForGoal(params: {
  fitCase: DoctrineGoalActionFitCase;
  utility: ReturnType<typeof buildTacticalGoalUtilities>[number];
  reason: DoctrineGoalActionFitWorklistReason;
  topBlockedFit?: ActionGoalFit;
}): DoctrineGoalActionFitWorklistCandidate {
  const blockers = [...(params.topBlockedFit?.blockers ?? [])].sort();
  return {
    candidateId: `${params.fitCase.scenarioId}:${params.utility.goalId}:${params.reason}`,
    scenarioId: params.fitCase.scenarioId,
    goalId: params.utility.goalId,
    family: params.utility.family,
    reason: params.reason,
    ...(params.topBlockedFit
      ? { topBlockedActionId: params.topBlockedFit.actionId }
      : {}),
    blockers,
    requiredActionSignals: [...params.utility.requiredActionSignals].sort(),
    evidence: [
      "doctrine_goal_action_fit_worklist:report_only",
      `worklist_reason:${params.reason}`,
      `scenario:${params.fitCase.scenarioId}`,
      `goal:${params.utility.goalId}`,
      `family:${params.utility.family}`,
      `required_action_signal_count:${params.utility.requiredActionSignals.length}`,
      ...(params.topBlockedFit
        ? [`top_blocked_action:${params.topBlockedFit.actionId}`]
        : []),
      ...blockers.map((blocker) => `blocker:${blocker}`),
      "productive_use_allowed:false",
    ],
  };
}
