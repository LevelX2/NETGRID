import type { GameState } from "@netgrid/shared";

export type RunnerRunStartLockReason =
  | "required_actions_pending"
  | "credit_payment_pending";

export function runnerRunStartLockReason(
  state: GameState,
): RunnerRunStartLockReason | undefined {
  if (normalizedLockAmount(state.runnerTurnFlags?.runLockActionsPending) > 0)
    return "required_actions_pending";
  if (normalizedLockAmount(state.runnerTurnFlags?.runnerRunLockCreditCost) > 0)
    return "credit_payment_pending";
  return undefined;
}

export function runnerCanStartRun(state: GameState): boolean {
  return runnerRunStartLockReason(state) === undefined;
}

export function assertRunnerCanStartRun(state: GameState): void {
  const reason = runnerRunStartLockReason(state);
  if (reason === "required_actions_pending")
    throw new Error(
      "Die Run-Sperre verlangt zuerst die ausstehenden Pflichtaktionen.",
    );
  if (reason === "credit_payment_pending")
    throw new Error(
      "Die Run-Sperre muss zuerst durch ihre Credit-Zahlung entfernt werden.",
    );
}

function normalizedLockAmount(value: number | undefined): number {
  return Math.max(0, Math.floor(value ?? 0));
}
