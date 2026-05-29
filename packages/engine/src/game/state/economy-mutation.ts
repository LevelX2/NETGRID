import { type GameState, type Side } from "@netgrid/shared";
import {
  ensureRunnerTurnFlags,
  recordRunnerActionSpent,
} from "./turn-flags-counters";

export function credits(state: GameState, side: Side, amount: number): void {
  if (side === "corp") state.corp.credits += amount;
  else state.runner.credits += amount;
}

export function spendCredits(
  state: GameState,
  side: Side,
  amount: number,
): void {
  if (amount <= 0) return;
  if (side === "corp") {
    if (state.corp.credits < amount)
      throw new Error("Die Korp kann die Kosten nicht bezahlen.");
    state.corp.credits -= amount;
    return;
  }
  if (state.runner.credits < amount)
    throw new Error("Der Runner kann die Kosten nicht bezahlen.");
  state.runner.credits -= amount;
}

export function consumeRunnerRunLockAction(state: GameState): void {
  const flags = ensureRunnerTurnFlags(state);
  const pending = Math.max(0, Math.floor(flags.runLockActionsPending ?? 0));
  flags.runLockActionsPending = pending > 0 ? pending - 1 : 0;
}

export function spendClick(state: GameState, side: Side): void {
  if (side === "corp") {
    if (state.corp.clicks <= 0)
      throw new Error("Die Korp hat keine Clicks mehr.");
    state.corp.clicks -= 1;
    return;
  }
  if (state.runner.clicks <= 0)
    throw new Error("Der Runner hat keine Clicks mehr.");
  state.runner.clicks -= 1;
  recordRunnerActionSpent(state, 1);
  consumeRunnerRunLockAction(state);
}

export function spendClicks(
  state: GameState,
  side: Side,
  amount: number,
): void {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Click amount ist ungueltig.");
  if (side === "corp") {
    if (state.corp.clicks < amount)
      throw new Error("Die Korp hat nicht genug Clicks.");
    state.corp.clicks -= amount;
    return;
  }
  if (state.runner.clicks < amount)
    throw new Error("Der Runner hat nicht genug Clicks.");
  state.runner.clicks -= amount;
  recordRunnerActionSpent(state, amount);
}
