import { type GameState, type Side } from "@netgrid/shared";
import {
  applyCreditGain,
  type CreditGainRequest,
  type CreditGainResult,
} from "../economy/credit-gain";
import { recordRunnerActionSpent } from "./turn-flags-counters";

export function credits(
  state: GameState,
  side: Side,
  amount: number,
  source: CreditGainRequest["source"] = {
    kind: "rule_effect",
    reason: "economy_mutation_credit_gain",
  },
): CreditGainResult {
  return applyCreditGain(state, { side, baseAmount: amount, source });
}

export function spendCredits(
  state: GameState,
  side: Side,
  amount: number,
): void {
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new Error("Credit amount ist ungueltig.");
  if (amount === 0) return;
  if (side === "corp") {
    if (state.corp.credits < amount)
      throw new Error("Die Korp kann die Kosten nicht bezahlen.");
    const traceCredits = state.trace?.corpTemporaryTraceCredits;
    if (traceCredits) {
      if (
        traceCredits.includedInCorpCreditPool !== true ||
        traceCredits.usableFor !== "unrestricted_during_current_trace"
      )
        throw new Error("Der temporäre Trace-Credit-Pool ist ungültig.");
      traceCredits.remaining = Math.max(
        0,
        traceCredits.remaining - Math.min(amount, traceCredits.remaining),
      );
    }
    state.corp.credits -= amount;
    return;
  }
  if (state.runner.credits < amount)
    throw new Error("Der Runner kann die Kosten nicht bezahlen.");
  state.runner.credits -= amount;
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
