import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
  type Side,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

export type CardEffectCreditGainSource = {
  kind: "card_effect";
  sourceDefinitionId: CardDefinitionId;
  sourceCardId?: CardInstanceId;
  gainOrdinal: number;
  reason: string;
};

export type StandardCreditGainSource =
  | CardEffectCreditGainSource
  | {
      kind:
        | "basic_action"
        | "access_effect"
        | "damage_replacement"
        | "hosted_credit_take"
        | "rule_effect"
        | "run_effect"
        | "subroutine"
        | "trace_effect"
        | "turn_effect";
      sourceDefinitionId?: CardDefinitionId;
      sourceDefinitionIds?: readonly CardDefinitionId[];
      sourceCardId?: CardInstanceId;
      reason: string;
    };

export type TemporaryCreditGrantSource = {
  kind: "temporary_grant";
  sourceDefinitionId: CardDefinitionId;
  sourceCardId?: CardInstanceId;
  reason: string;
};

export type CreditGainRequest = {
  side: Side;
  baseAmount: number;
  source: StandardCreditGainSource | TemporaryCreditGrantSource;
};

export type CreditGainResult = {
  side: Side;
  baseAmount: number;
  bonusAmount: number;
  requestedAmount: number;
  interceptedAmount: number;
  creditedAmount: number;
  creditsBefore: number;
  creditsAfter: number;
  countsAsStandardGain: boolean;
  modifierSourceDefinitionIds: CardDefinitionId[];
};

export function applyCreditGain(
  state: GameState,
  request: CreditGainRequest,
): CreditGainResult {
  assertCreditGainRequest(request);
  const countsAsStandardGain = request.source.kind !== "temporary_grant";
  const creditsBefore = creditsForSide(state, request.side);
  const modifiers = countsAsStandardGain
    ? activeCreditGainModifiers(state, request)
    : { amount: 0, sourceDefinitionIds: [] };
  const requestedAmount = request.baseAmount + modifiers.amount;
  const interceptedAmount = countsAsStandardGain
    ? interceptCorpCreditForfeitDebt(state, request.side, requestedAmount)
    : 0;
  const creditedAmount = requestedAmount - interceptedAmount;

  if (creditedAmount > 0) {
    if (request.side === "corp") state.corp.credits += creditedAmount;
    else state.runner.credits += creditedAmount;
  }

  return {
    side: request.side,
    baseAmount: request.baseAmount,
    bonusAmount: modifiers.amount,
    requestedAmount,
    interceptedAmount,
    creditedAmount,
    creditsBefore,
    creditsAfter: creditsForSide(state, request.side),
    countsAsStandardGain,
    modifierSourceDefinitionIds: modifiers.sourceDefinitionIds,
  };
}

export function creditGainPublicPayload(
  result: CreditGainResult,
): Record<string, string | number | boolean> {
  return {
    gainedCredits: result.creditedAmount,
    [result.side === "corp" ? "corpCreditsAfter" : "runnerCreditsAfter"]:
      result.creditsAfter,
    ...(result.bonusAmount > 0
      ? {
          creditGainBaseAmount: result.baseAmount,
          creditGainBonusAmount: result.bonusAmount,
          creditGainModifierSourceDefinitionIds:
            result.modifierSourceDefinitionIds.join(","),
          firstPrepCreditGainBonus: result.bonusAmount,
          firstPrepCreditGainBonusSourceDefinitionIds:
            result.modifierSourceDefinitionIds.join(","),
        }
      : {}),
    ...(result.interceptedAmount > 0
      ? {
          creditGainRequestedAmount: result.requestedAmount,
          creditGainInterceptedAmount: result.interceptedAmount,
        }
      : {}),
  };
}

function assertCreditGainRequest(request: CreditGainRequest): void {
  if (!Number.isInteger(request.baseAmount) || request.baseAmount < 0)
    throw new Error("Credit-Gain-Betrag ist ungueltig.");
  if (request.source.reason.trim().length === 0)
    throw new Error("Credit-Gain-Grund fehlt.");
  if (
    request.source.kind === "card_effect" &&
    (!Number.isInteger(request.source.gainOrdinal) ||
      request.source.gainOrdinal <= 0)
  )
    throw new Error("Credit-Gain-Ordinal ist ungueltig.");
}

function activeCreditGainModifiers(
  state: GameState,
  request: CreditGainRequest,
): { amount: number; sourceDefinitionIds: CardDefinitionId[] } {
  if (
    request.side !== "runner" ||
    request.baseAmount <= 0 ||
    request.source.kind !== "card_effect" ||
    request.source.gainOrdinal !== 1
  )
    return { amount: 0, sourceDefinitionIds: [] };

  const sourceDefinition =
    CARD_DEFINITIONS_BY_ID[request.source.sourceDefinitionId];
  if (
    !sourceDefinition ||
    sourceDefinition.side !== "runner" ||
    sourceDefinition.type !== "event"
  )
    return { amount: 0, sourceDefinitionIds: [] };

  let amount = 0;
  const sourceDefinitionIds: CardDefinitionId[] = [];
  for (const sourceCardId of state.runner.rig.resources.slice().sort()) {
    const sourceDefinitionId = state.cardInstances[sourceCardId]?.definitionId;
    if (!sourceDefinitionId) continue;
    const implementation =
      cardImplementationForDefinitionId(
        sourceDefinitionId,
      )?.runnerUtilityLongtail;
    if (
      implementation?.kind !== "first_prep_credit_gain_bonus" ||
      implementation.limit !== "once_per_prep"
    )
      continue;
    amount += Math.max(0, Math.floor(implementation.amount));
    sourceDefinitionIds.push(sourceDefinitionId);
  }

  return { amount, sourceDefinitionIds: sourceDefinitionIds.sort() };
}

function interceptCorpCreditForfeitDebt(
  state: GameState,
  side: Side,
  amount: number,
): number {
  if (side !== "corp" || amount <= 0) return 0;
  const debt = state.actionEconomy?.corpCreditForfeitDebt;
  if (!debt) return 0;
  const intercepted = Math.min(
    amount,
    Math.max(0, Math.floor(debt.remaining ?? 0)),
  );
  debt.remaining = Math.max(0, Math.floor(debt.remaining) - intercepted);
  if (debt.remaining <= 0 && state.actionEconomy)
    delete state.actionEconomy.corpCreditForfeitDebt;
  return intercepted;
}

function creditsForSide(state: GameState, side: Side): number {
  return side === "corp" ? state.corp.credits : state.runner.credits;
}
