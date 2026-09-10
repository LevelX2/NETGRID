import type { AiDecisionInput } from "@netgrid/shared";
import { AI_HINTS_BY_CARD } from "../ai-hints";
import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../runner-run-target-evaluation";

/** Domain quote for the existing hand-development owner, never spendable future income. */
export function assessRunnerSuccessfulRunCreditInvestment(
  input: AiDecisionInput,
  evaluation: RunnerHandDevelopmentEvaluation,
  targets: readonly RunnerRunTargetEvaluation[],
  economy: RunnerEconomyPosture,
) {
  if (!evaluation.definitionId) return undefined;
  const effect = AI_HINTS_BY_CARD.get(evaluation.definitionId)?.effects?.find(
    (e) =>
      e.kind === "economy" &&
      e.timing === "after_successful_run" &&
      e.target === "run.successful_run_credit_gain" &&
      e.resource === "credits" &&
      e.repeatable === true,
  );
  if (!effect || !Number.isSafeInteger(effect.amount) || effect.amount! <= 0)
    return undefined;
  const install = evaluation.persistentInstallEvaluation;
  const action = input.legalActions.find(
    (a) => a.actionId === evaluation.legalActionId && a.type === "install_card",
  );
  const installClicks = action?.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  if (!action || !install || installClicks === undefined || installClicks <= 0)
    return undefined;
  const remainingClicks = Math.max(
    0,
    input.playerView.own.clicks - installClicks,
  );
  const threshold = input.playerView.agendaPointsToWin;
  const urgent =
    input.playerView.own.agendaPoints >= threshold - 2 ||
    input.playerView.opponent.agendaPoints >= threshold - 2 ||
    targets.some(
      (t) =>
        t.scoreThreat ||
        t.accessPayoff === "agenda" ||
        t.accessPayoff === "score_threat",
    );
  const routes = targets.filter((t) => {
    const run = input.legalActions.find(
      (a) => a.actionId === t.actionId && a.type === "start_run",
    );
    return (
      run &&
      t.pathPassability === "reachable" &&
      t.knownAccessState !== "known_no_current_payoff" &&
      (t.accessTargetKind === "hq" || t.accessTargetKind === "rd") &&
      t.score > 0 &&
      (t.recommendation === "run_now" || t.recommendation === "run_if_free") &&
      t.prerunReserveQuote !== undefined &&
      install.creditsAfterInstall >= t.prerunReserveQuote.requiredCredits &&
      t.unrezzedIceRiskUnderfunded !== true &&
      (t.unavoidableVisibleIceHazardCount ?? 0) === 0 &&
      Number.isFinite(t.pathCost) &&
      t.pathCost >= 0 &&
      install.creditsAfterInstall >= economy.minimumCreditFloor + t.pathCost
    );
  });
  const cheapest = [...routes].sort(
    (a, b) => a.pathCost - b.pathCost || a.actionId.localeCompare(b.actionId),
  )[0];
  // At most the remaining current turn plus one successful run per later turn.
  // The two later runs are conditional campaign value, not certified actions or credits.
  const horizonTurns = Math.min(
    3,
    input.playerView.own.stackOrRdCount,
    input.playerView.opponent.deckCount,
  );
  const affordableRuns = cheapest
    ? cheapest.pathCost === 0
      ? remainingClicks
      : Math.min(
          remainingClicks,
          Math.floor(
            (install.creditsAfterInstall - economy.minimumCreditFloor) /
              cheapest.pathCost,
          ),
        )
    : 0;
  const projectedSuccessfulRuns =
    affordableRuns > 0 ? affordableRuns + Math.max(0, horizonTurns - 1) : 0;
  const projectedCredits = projectedSuccessfulRuns * effect.amount!;
  const projectedNetCredits =
    projectedCredits - install.installCost - installClicks;
  const admitted =
    !urgent &&
    input.playerView.own.tags === 0 &&
    horizonTurns >= 2 &&
    affordableRuns >= 2 &&
    projectedNetCredits > 0 &&
    install.finalInstallFit > 0 &&
    install.duplicateRole !== "redundant_duplicate" &&
    input.playerView.own.credits <
      economy.desiredCreditReserve + projectedCredits;
  return {
    admitted,
    value: admitted ? Math.min(300, projectedNetCredits * 100) : 0,
    projectedSuccessfulRuns,
    projectedCredits,
    projectedNetCredits,
    horizonTurns,
    evidenceCodes: [
      `runner_run_credit_investment:${admitted ? "admitted" : "deferred"}`,
      `runner_run_credit_payout:${effect.amount}`,
      `runner_run_credit_install_cost:${install.installCost}`,
      `runner_run_credit_install_clicks:${installClicks}`,
      `runner_run_credit_minimum_floor:${economy.minimumCreditFloor}`,
      `runner_run_credit_reserve_target:${economy.desiredCreditReserve}`,
      `runner_run_credit_horizon_turns:${horizonTurns}`,
      `runner_run_credit_current_affordable_runs:${affordableRuns}`,
      `runner_run_credit_conditional_successes:${projectedSuccessfulRuns}`,
      `runner_run_credit_conditional_net:${projectedNetCredits}`,
      `runner_run_credit_urgent_run:${urgent}`,
      ...(cheapest
        ? [`runner_run_credit_visible_route:${cheapest.actionId}`]
        : []),
      ...(cheapest
        ? [
            `runner_run_credit_unknown_ice:${cheapest.unknownUnrezzedIceCount ?? "unknown"}`,
          ]
        : []),
      "runner_run_credit_future_income_not_spendable",
    ],
  };
}
