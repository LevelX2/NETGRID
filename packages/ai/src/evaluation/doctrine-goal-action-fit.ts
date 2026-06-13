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
      } else {
        goalsNoCandidate += 1;
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
    productiveUseAllowed: false,
    noRuntimeEffect: true,
    evidence: [
      "doctrine_goal_action_fit:report_only",
      `scenario_count:${cases.length}`,
      `doctrine_goals_produced:${doctrineGoalsProduced}`,
      `goals_with_at_least_one_fit:${goalsWithAtLeastOneFit}`,
      `goals_only_blocked:${goalsOnlyBlocked}`,
      `goals_no_candidate:${goalsNoCandidate}`,
    ],
  };
  assertSemanticObjectSideSafe(report, "DoctrineGoalActionFitReport");
  return report;
}
