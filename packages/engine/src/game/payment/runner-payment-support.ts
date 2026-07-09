import type { GameState, LegalAction } from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { runnerInstalledCardIds } from "../state/card-server-lookup";

export type RunnerPaymentSupportContext = NonNullable<
  GameState["runnerCostPenaltySupportWindow"]
>["paymentContext"];

type RunnerCostPenaltySupportOpenOptions = {
  amount: number;
  availableWithoutSupport: number;
  kind?: "cost" | "penalty";
  context?: RunnerPaymentSupportContext;
};

function normalizedPaymentAmount(amount: number): number {
  return Math.max(0, Math.floor(amount));
}

function supportAbilityCreditNet(
  state: GameState,
  cardId: string,
  availableCredits: number,
): number {
  const instance = state.cardInstances[cardId];
  if (!instance || instance.controller !== "runner" || instance.tapped === true)
    return 0;
  const implementation = cardImplementationForDefinitionId(
    instance.definitionId,
  );
  const abilities = implementation?.abilities ?? [];
  let bestNet = 0;
  for (const ability of abilities) {
    if (ability.kind !== "activated") continue;
    if (ability.timing !== "runner_cost_penalty_support") continue;
    if (ability.costs.some((cost) => cost.kind === "action")) continue;
    const creditCost = ability.costs
      .filter((cost) => cost.kind === "credit")
      .reduce((sum, cost) => sum + cost.amount, 0);
    if (creditCost > availableCredits) continue;
    const creditGain = ability.effects.reduce((sum, effect) => {
      if (
        effect.kind !== "gain_credits" ||
        (effect.recipient !== "runner" && effect.recipient !== "controller")
      )
        return sum;
      return sum + effect.amount;
    }, 0);
    const net = creditGain - creditCost;
    if (net > bestNet) bestNet = net;
  }
  return bestNet;
}

export function runnerCostPenaltySupportCreditCapacity(
  state: GameState,
): number {
  let availableCredits = state.runner.credits;
  let gainedCredits = 0;
  for (const cardId of runnerInstalledCardIds(state).slice().sort()) {
    const bestNet = supportAbilityCreditNet(state, cardId, availableCredits);
    if (bestNet <= 0) continue;
    availableCredits += bestNet;
    gainedCredits += bestNet;
  }
  return gainedCredits;
}

export function runnerCreditsRequiredAfterPaymentSupport(
  state: GameState,
  amount: number,
  availableWithoutSupport: number,
): number {
  const normalizedAmount = normalizedPaymentAmount(amount);
  const nonRunnerCredits = Math.max(
    0,
    Math.floor(availableWithoutSupport) - state.runner.credits,
  );
  return Math.max(0, normalizedAmount - nonRunnerCredits);
}

export function runnerCanPayWithCostPenaltySupport(
  state: GameState,
  amount: number,
  availableWithoutSupport: number,
): boolean {
  const normalizedAmount = normalizedPaymentAmount(amount);
  if (normalizedAmount <= 0) return true;
  const normalizedAvailable = Math.max(0, Math.floor(availableWithoutSupport));
  return (
    normalizedAvailable >= normalizedAmount ||
    normalizedAvailable + runnerCostPenaltySupportCreditCapacity(state) >=
      normalizedAmount
  );
}

export function runnerPoolCreditsWithCostPenaltySupport(
  state: GameState,
): number {
  return state.runner.credits + runnerCostPenaltySupportCreditCapacity(state);
}

export function openRunnerCostPenaltySupportWindow(
  state: GameState,
  legalAction: LegalAction,
  options: RunnerCostPenaltySupportOpenOptions,
): boolean {
  const amount = normalizedPaymentAmount(options.amount);
  const availableWithoutSupport = Math.max(
    0,
    Math.floor(options.availableWithoutSupport),
  );
  if (
    legalAction.side !== "runner" ||
    amount <= 0 ||
    availableWithoutSupport >= amount ||
    !runnerCanPayWithCostPenaltySupport(state, amount, availableWithoutSupport)
  )
    return false;
  state.runnerCostPenaltySupportWindow = {
    windowId: `runner_cost_penalty_support.${state.stateVersion + 1}`,
    originalActionId: legalAction.actionId,
    amountDue: amount,
    kind: options.kind ?? "cost",
    createdAtStateVersion: state.stateVersion,
    runnerCreditTarget: runnerCreditsRequiredAfterPaymentSupport(
      state,
      amount,
      availableWithoutSupport,
    ),
    ...(options.context ? { paymentContext: options.context } : {}),
  };
  state.activeSide = "runner";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    runnerCostPenaltySupportWindowOpened: true,
    runnerCostPenaltySupportWindowId:
      state.runnerCostPenaltySupportWindow.windowId,
  };
  return true;
}

export function closeRunnerCostPenaltySupportWindowForPayment(
  state: GameState,
  legalAction: LegalAction,
  amount: number,
): void {
  const window = state.runnerCostPenaltySupportWindow;
  if (!window) return;
  const normalizedAmount = normalizedPaymentAmount(amount);
  if (
    window.originalActionId !== legalAction.actionId ||
    window.kind !== "cost" ||
    window.amountDue !== normalizedAmount
  )
    throw new Error("Das Runner-Kostenfenster passt nicht zur Zahlung.");
  delete state.runnerCostPenaltySupportWindow;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    runnerCostPenaltySupportWindowClosed: true,
  };
}

export function runnerCostPenaltySupportOriginalActionReady(
  state: GameState,
): boolean {
  const window = state.runnerCostPenaltySupportWindow;
  if (!window) return false;
  return (
    state.runner.credits >= (window.runnerCreditTarget ?? window.amountDue)
  );
}

export function syncPendingChoiceAfterRunnerCostPenaltySupport(
  state: GameState,
): void {
  if (!state.pendingChoice) return;
  state.pendingChoice = {
    ...state.pendingChoice,
    stateVersion: state.stateVersion + 1,
  };
}
