import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import {
  type CardCreditGainContinuation,
  type CardDefinitionId,
  type CardInstanceId,
  type ChoiceOption,
  type GameState,
  type LegalAction,
  type PlayerAction,
  type Side,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { selectedChoiceIds } from "../choices/choice-validation";

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

export type CreditGainDestination =
  | { kind: "normal_pool" }
  | {
      kind: "runner_run_temporary";
      sourceDefinitionId: CardDefinitionId;
      returnUnusedAtRunEnd: true;
    };

export type CreditGainRequest = {
  side: Side;
  baseAmount: number;
  source: StandardCreditGainSource | TemporaryCreditGrantSource;
  destination?: CreditGainDestination;
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
  destination: CreditGainDestination;
  countsAsStandardGain: boolean;
  modifierSourceDefinitionIds: CardDefinitionId[];
};

export function applyCreditGain(
  state: GameState,
  request: CreditGainRequest,
): CreditGainResult {
  assertCreditGainRequest(request);
  const destination = request.destination ?? { kind: "normal_pool" };
  const countsAsStandardGain = request.source.kind !== "temporary_grant";
  const creditsBefore = creditsForDestination(state, request.side, destination);
  const modifiers = countsAsStandardGain
    ? activeCreditGainModifiers(state, request)
    : { amount: 0, sourceDefinitionIds: [] };
  const requestedAmount = request.baseAmount + modifiers.amount;
  const investmentFirmSourceIds = activeInvestmentFirmSourceIds(state);
  if (
    shouldOpenInvestmentFirmReplacement(
      state,
      request,
      destination,
      requestedAmount,
      investmentFirmSourceIds,
    )
  ) {
    const nextStateVersion = state.stateVersion + 1;
    state.pendingCorpCreditGainReplacement = {
      requestedAmount,
      baseAmount: request.baseAmount,
      bonusAmount: modifiers.amount,
      creditsBefore,
      modifierSourceDefinitionIds: modifiers.sourceDefinitionIds,
      investmentFirmSourceIds,
      ...(request.source.sourceDefinitionId
        ? { sourceDefinitionId: request.source.sourceDefinitionId }
        : {}),
      ...(request.source.sourceCardId
        ? { sourceCardId: request.source.sourceCardId }
        : {}),
      sourceKind: request.source.kind,
      sourceReason: request.source.reason,
    };
    state.pendingChoice = {
      choiceId: `investment_firm_credit_gain_${nextStateVersion}`,
      side: "corp",
      source: `investment_firm.credit_gain:${nextStateVersion}`,
      prompt: `Wie viele der ${requestedAmount} Credits zu Investment Firm umleiten?`,
      presentationKey: "investment_firm_redirect",
      kind: "select_option",
      options: investmentFirmReplacementOptions(
        state,
        requestedAmount,
        investmentFirmSourceIds,
      ),
      minSelections: 1,
      maxSelections: 1,
      stateVersion: nextStateVersion,
      visibility: "public",
    };
    return {
      side: request.side,
      baseAmount: request.baseAmount,
      bonusAmount: modifiers.amount,
      requestedAmount,
      interceptedAmount: 0,
      creditedAmount: 0,
      creditsBefore,
      creditsAfter: creditsBefore,
      destination,
      countsAsStandardGain,
      modifierSourceDefinitionIds: modifiers.sourceDefinitionIds,
    };
  }
  const interceptedAmount =
    countsAsStandardGain && destination.kind === "normal_pool"
      ? interceptCorpCreditForfeitDebt(state, request.side, requestedAmount)
      : 0;
  const creditedAmount = requestedAmount - interceptedAmount;

  creditDestination(state, request.side, destination, creditedAmount);

  return {
    side: request.side,
    baseAmount: request.baseAmount,
    bonusAmount: modifiers.amount,
    requestedAmount,
    interceptedAmount,
    creditedAmount,
    creditsBefore,
    creditsAfter: creditsForDestination(state, request.side, destination),
    destination,
    countsAsStandardGain,
    modifierSourceDefinitionIds: modifiers.sourceDefinitionIds,
  };
}

function activeInvestmentFirmSourceIds(state: GameState): CardInstanceId[] {
  return (state.corp.servers ?? [])
    .flatMap((server) => server.root)
    .filter((cardId) => {
      const instance = state.cardInstances[cardId];
      return (
        instance?.rezzed === true &&
        cardImplementationForDefinitionId(instance.definitionId)
          ?.remainingReplacementLongtail?.kind ===
          "basic_credit_diversion_to_recurring_credits"
      );
    })
    .sort();
}

function shouldOpenInvestmentFirmReplacement(
  state: GameState,
  request: CreditGainRequest,
  destination: CreditGainDestination,
  requestedAmount: number,
  sourceIds: CardInstanceId[],
): boolean {
  if (
    request.side !== "corp" ||
    request.source.kind === "temporary_grant" ||
    destination.kind !== "normal_pool" ||
    requestedAmount <= 0 ||
    sourceIds.length === 0
  )
    return false;
  if (
    state.activeSide === "corp" &&
    state.phase === "corp_draw_phase" &&
    state.timingPoint === "corp_draw.mandatory_draw"
  )
    return false;
  if (state.pendingChoice || state.pendingCorpCreditGainReplacement)
    throw new Error("Credit-Gain-Replacement ist bereits offen.");
  return !(
    request.source.kind === "turn_effect" &&
    /start_of_(corp_)?turn|start_of_turn|corp_start/i.test(
      request.source.reason,
    )
  );
}

export function resolveInvestmentFirmCreditGainChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): CardCreditGainContinuation | undefined {
  const choice = state.pendingChoice;
  const pending = state.pendingCorpCreditGainReplacement;
  if (!choice?.source.startsWith("investment_firm.credit_gain:") || !pending)
    throw new Error("Es ist kein Investment-Firm-Replacement offen.");
  if (choice.side !== "corp" || legalAction.side !== "corp")
    throw new Error("Nur die Korp darf Investment Firm auflösen.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find((candidate) => candidate.id === selected);
  const redirectedAmount = Number(option?.metadata?.amount ?? option?.value);
  const selectedSourceId =
    redirectedAmount > 0 && typeof option?.value === "string"
      ? (option.value as CardInstanceId)
      : undefined;
  const selectedSourceIndex = selectedSourceId
    ? pending.investmentFirmSourceIds.indexOf(selectedSourceId)
    : -1;
  const expectedOptionId = selectedSourceId
    ? pending.investmentFirmSourceIds.length === 1
      ? `redirect_${redirectedAmount}`
      : `redirect_${redirectedAmount}_source_${selectedSourceIndex + 1}`
    : "redirect_0";
  if (
    !Number.isSafeInteger(redirectedAmount) ||
    redirectedAmount < 0 ||
    redirectedAmount > pending.requestedAmount ||
    (redirectedAmount > 0 && (!selectedSourceId || selectedSourceIndex < 0)) ||
    option?.id !== expectedOptionId ||
    option?.metadata?.amount !== redirectedAmount ||
    (redirectedAmount === 0 && option?.value !== 0)
  )
    throw new Error("Die Investment-Firm-Umleitung ist ungültig.");
  const currentSourceIds = activeInvestmentFirmSourceIds(state);
  if (selectedSourceId && !currentSourceIds.includes(selectedSourceId))
    throw new Error("Die gewählte Investment Firm ist nicht mehr aktiv.");
  const poolAmount = pending.requestedAmount - redirectedAmount;
  const continuation = pending.continuation;
  const interceptedAmount = interceptCorpCreditForfeitDebt(
    state,
    "corp",
    poolAmount,
  );
  const creditedAmount = poolAmount - interceptedAmount;
  creditDestination(state, "corp", { kind: "normal_pool" }, creditedAmount);
  if (selectedSourceId) {
    const source = state.cardInstances[selectedSourceId];
    if (!source) throw new Error("Investment-Firm-Quelle fehlt.");
    source.counters = {
      ...(source.counters ?? {}),
      recurring_credit:
        Math.max(0, Math.floor(source.counters?.recurring_credit ?? 0)) +
        redirectedAmount * 2,
    };
  }
  delete state.pendingChoice;
  delete state.pendingCorpCreditGainReplacement;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    investmentFirmCreditGainReplaced: redirectedAmount > 0,
    investmentFirmRedirectedAmount: redirectedAmount,
    investmentFirmSourceCount: pending.investmentFirmSourceIds.length,
    investmentFirmCreditsAddedPerSource: redirectedAmount * 2,
    investmentFirmCreditsAddedTotal: redirectedAmount * 2,
    ...(selectedSourceId
      ? { investmentFirmSelectedSourceCardId: selectedSourceId }
      : {}),
    creditGainRequestedAmount: pending.requestedAmount,
    creditGainInterceptedAmount: interceptedAmount,
    gainedCredits: creditedAmount,
    corpCreditsAfter: state.corp.credits,
    ...(pending.sourceDefinitionId
      ? { creditGainSourceDefinitionId: pending.sourceDefinitionId }
      : {}),
  };
  return continuation;
}

function investmentFirmReplacementOptions(
  state: GameState,
  requestedAmount: number,
  sourceIds: readonly CardInstanceId[],
): ChoiceOption[] {
  const options: ChoiceOption[] = [
    {
      id: "redirect_0",
      label: "Keine Credits umleiten",
      value: 0,
      metadata: { amount: 0 },
    },
  ];
  for (let amount = 1; amount <= requestedAmount; amount += 1) {
    sourceIds.forEach((sourceId, sourceIndex) => {
      const source = state.cardInstances[sourceId];
      if (!source) throw new Error("Investment-Firm-Quelle fehlt.");
      const sourceTitle = CARD_DEFINITIONS_BY_ID[source.definitionId]?.title;
      if (!sourceTitle) throw new Error("Investment-Firm-Definition fehlt.");
      options.push({
        id:
          sourceIds.length === 1
            ? `redirect_${amount}`
            : `redirect_${amount}_source_${sourceIndex + 1}`,
        label: `${amount} umleiten; ${amount * 2} auf ${sourceTitle} legen`,
        value: sourceId,
        metadata: { amount, sourceTitle },
      });
    });
  }
  return options;
}

export function prepareRunnerRunTemporaryCreditGain(
  state: GameState,
  request: CreditGainRequest & {
    side: "runner";
    destination: Extract<
      CreditGainDestination,
      { kind: "runner_run_temporary" }
    >;
  },
): CreditGainResult {
  assertCreditGainRequest(request);
  if (state.run)
    throw new Error(
      "Temporäre Run-Credits müssen vor Beginn ihres neuen Runs vorbereitet werden.",
    );
  const modifiers = activeCreditGainModifiers(state, request);
  const requestedAmount = request.baseAmount + modifiers.amount;
  return {
    side: "runner",
    baseAmount: request.baseAmount,
    bonusAmount: modifiers.amount,
    requestedAmount,
    interceptedAmount: 0,
    creditedAmount: requestedAmount,
    creditsBefore: 0,
    creditsAfter: requestedAmount,
    destination: request.destination,
    countsAsStandardGain: true,
    modifierSourceDefinitionIds: modifiers.sourceDefinitionIds,
  };
}

export function creditGainPublicPayload(
  result: CreditGainResult,
): Record<string, string | number | boolean> {
  return {
    gainedCredits: result.creditedAmount,
    ...(result.destination.kind === "normal_pool"
      ? {
          [result.side === "corp" ? "corpCreditsAfter" : "runnerCreditsAfter"]:
            result.creditsAfter,
        }
      : { runnerRunTemporaryCreditsAfter: result.creditsAfter }),
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
  if (
    request.destination?.kind === "runner_run_temporary" &&
    request.side !== "runner"
  )
    throw new Error("Temporäre Run-Credits gehören dem Runner.");
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

function creditsForDestination(
  state: GameState,
  side: Side,
  destination: CreditGainDestination,
): number {
  if (destination.kind === "normal_pool") return creditsForSide(state, side);
  return state.run?.runnerRunTemporaryCredits?.remaining ?? 0;
}

function creditDestination(
  state: GameState,
  side: Side,
  destination: CreditGainDestination,
  amount: number,
): void {
  if (amount <= 0) return;
  if (destination.kind === "normal_pool") {
    if (side === "corp") state.corp.credits += amount;
    else state.runner.credits += amount;
    return;
  }
  if (side !== "runner" || !state.run)
    throw new Error("Temporäre Run-Credits benötigen einen aktiven Run.");
  const current = state.run.runnerRunTemporaryCredits;
  if (current && current.sourceDefinitionId !== destination.sourceDefinitionId)
    throw new Error("Temporäre Run-Credits haben eine fremde Quellbindung.");
  state.run.runnerRunTemporaryCredits = {
    sourceDefinitionId: destination.sourceDefinitionId,
    remaining: Math.max(0, Math.floor(current?.remaining ?? 0)) + amount,
    returnUnusedAtRunEnd: destination.returnUnusedAtRunEnd,
  };
}
