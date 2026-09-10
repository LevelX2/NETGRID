import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import {
  fundRunnerRunPathPayment,
  normalizeRunnerRunPathCreditBudget,
  runnerRunPathCreditBudgetWithVisiblePools,
  spendGeneralCredits,
} from "../run-analysis/visible-run-credit-budget";

const FORT_PASS_TOLL = "runner_pay_or_end_run_after_passing_ice_on_this_fort";

export function runnerFortPassTollDecision(action: LegalAction) {
  if (
    action.type !== "continue_run" ||
    action.payload?.fortRunWindowAbility !== FORT_PASS_TOLL
  )
    return undefined;
  const decision = action.payload.decision;
  return decision === "pay" || decision === "end_run" ? decision : undefined;
}

export function runnerRunExitAction(action: LegalAction): boolean {
  return (
    action.type === "jack_out" ||
    runnerFortPassTollDecision(action) === "end_run"
  );
}

/** Current Engine offers, not a second action chooser or a reconstructed rule. */
export function runnerFortPassTollWindow(input: AiDecisionInput) {
  const actions = input.legalActions.filter(
    (a) => a.payload?.fortRunWindowAbility === FORT_PASS_TOLL,
  );
  if (actions.length === 0) return undefined;
  const run = input.playerView.run;
  const server = input.playerView.servers.find(
    (s) => s.id === run?.attackedServerId,
  );
  const first = actions[0]!;
  const amount = first.payload?.paymentAmount;
  const passedIndex =
    run?.position?.kind === "ice" ? run.position.iceIndex + 1 : 0;
  const visiblePassedIce = server?.ice[passedIndex];
  const pay = actions.filter((a) => runnerFortPassTollDecision(a) === "pay");
  const end = actions.filter(
    (a) => runnerFortPassTollDecision(a) === "end_run",
  );
  const invalid =
    input.side !== "runner" ||
    !run ||
    run.phase !== "movement" ||
    input.playerView.timingPoint !== "run.jack_out_window" ||
    !server ||
    !run.position ||
    run.position.serverId !== server.id ||
    typeof amount !== "number" ||
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    !visiblePassedIce ||
    pay.length > 1 ||
    end.length !== 1 ||
    pay.length + end.length !== actions.length ||
    actions.some(
      (a) =>
        a.side !== "runner" ||
        a.expiresAtStateVersion !== input.playerView.stateVersion ||
        a.payload?.serverId !== server.id ||
        a.payload?.paymentAmount !== amount ||
        a.costs.reduce((sum, c) => sum + (c.credits ?? 0), 0) !==
          (runnerFortPassTollDecision(a) === "pay" ? amount : 0),
    );
  if (invalid)
    throw new PlanResolutionFailure("step_target_mismatch", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      unresolvedActionIds: actions.map((a) => a.actionId),
      owner: "plan_module",
      removalCondition:
        "Bind the current fort-pass payment and exit to the active visible server, movement position, amount and current Engine action version.",
    });
  // The Engine retains and revalidates the actual passed-ICE instance on
  // application. Its internal ID is not needed in the AI DTO, especially
  // after passing an unrezzed ICE whose view identity remains opaque.
  return { amount: amount as number, pay: pay[0], end: end[0]! };
}

/** The existing run owner evaluates its remaining path after the pending fee.
 * Restricted breaker pools remain restricted. Any quoted one-shot funding
 * still has to execute through the Engine's bound payment-support window.
 */
export function runnerRunWindowCreditBudget(input: AiDecisionInput) {
  const window = runnerFortPassTollWindow(input);
  const temporary =
    Math.max(0, input.playerView.run?.badPublicityCredits ?? 0) +
    (window
      ? Math.max(
          0,
          input.playerView.run?.runnerRunTemporaryCredits?.remaining ?? 0,
        )
      : 0);
  const budget = normalizeRunnerRunPathCreditBudget(
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits + temporary,
      input.playerView.own.rig ?? [],
      { liquidCredits: input.playerView.own.credits },
    ),
  );
  if (window?.pay) {
    fundRunnerRunPathPayment(budget, window.amount);
    const liquidBefore = budget.paymentSupportLiquidCredits;
    spendGeneralCredits(budget, window.amount, false);
    if (liquidBefore !== undefined)
      budget.paymentSupportLiquidCredits = Math.max(
        0,
        liquidBefore - Math.max(0, window.amount - temporary),
      );
  }
  return budget;
}
