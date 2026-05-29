import {
  type CardInstance,
  type CardInstanceId,
  type CounterType,
  type GameState,
} from "@netgrid/shared";
import { mustInstance } from "./card-server-lookup";

export function cardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
): number {
  return mustInstance(state.cardInstances, cardId).counters?.[counterType] ?? 0;
}

export function setCardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
  amount: number,
): void {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Counter amount ist ungueltig.");
  const instance = mustInstance(state.cardInstances, cardId);
  const counters = { ...(instance.counters ?? {}) };
  if (amount === 0) delete counters[counterType];
  else counters[counterType] = amount;
  const { counters: _counters, ...withoutCounters } = instance;
  void _counters;
  state.cardInstances[cardId] =
    Object.keys(counters).length > 0
      ? { ...withoutCounters, counters }
      : withoutCounters;
}

export function cardInstanceWithoutCounters(
  instance: CardInstance,
): CardInstance {
  const { counters: _counters, ...withoutCounters } = instance;
  void _counters;
  return withoutCounters;
}

export function clearCardCounters(
  state: GameState,
  cardId: CardInstanceId,
): void {
  const instance = mustInstance(state.cardInstances, cardId);
  state.cardInstances[cardId] = cardInstanceWithoutCounters(instance);
}

export function addCardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
  amount: number,
): void {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Counter amount ist ungueltig.");
  setCardCounter(
    state,
    cardId,
    counterType,
    cardCounter(state, cardId, counterType) + amount,
  );
}

export function spendCardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
  amount: number,
): void {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Counter amount ist ungueltig.");
  const current = cardCounter(state, cardId, counterType);
  if (current < amount) throw new Error("Nicht genug Counter vorhanden.");
  setCardCounter(state, cardId, counterType, current - amount);
}

export function ensureRunnerTurnFlags(
  state: GameState,
): NonNullable<GameState["runnerTurnFlags"]> {
  const flags = (state.runnerTurnFlags ??= {
    stoleAgendaThisTurn: false,
    stoleAgendaLastTurn: false,
    stolenAgendaAdvancementCountersThisTurn: 0,
    stolenAgendaAdvancementCountersLastTurn: 0,
    runnerReceivedTagThisTurn: false,
    stoleResearchAgendaThisTurn: false,
    stoleGrayOpsAgendaThisTurn: false,
    stoleBlackOpsAgendaThisTurn: false,
    runAttemptsThisTurn: 0,
    runAttemptsLastTurn: 0,
    runAttemptsThisGame: 0,
    trashedNodeThisTurn: false,
    trashedNodeLastTurn: false,
    trashedAdvertisementThisTurn: false,
    trashedTransactionsThisTurn: false,
    prearrangedDropPending: false,
    installedResourceIdsThisTurn: [],
    installedResourceIdsLastTurn: [],
    successfulHqRunThisTurn: false,
    successfulRunThisTurn: false,
    damagePreventionUsage: {},
    runnerActionsTakenThisTurn: 0,
    brokerActionCardIdsThisTurn: [],
    startOfTurnFloatingCreditsApplied: false,
    allNighterBonusRunPending: false,
    forgoNextActionPending: false,
    forgoNextActionsPending: 0,
    runLockActionsPending: 0,
    fangRunLockCreditCost: 0,
    valuPakProgramInstallActionsRemaining: 0,
    valuPakTemporaryProgramInstallCredits: 0,
    shellTradersStartTurnResolvedSourceIds: [],
    bodyweightDataCrecheExtraRunPending: false,
    bodyweightDataCrecheExtraRunUsedThisTurn: false,
    startupImmolatorUsedSourceIdsThisTurn: [],
  });
  flags.stolenAgendaAdvancementCountersThisTurn ??= 0;
  flags.stolenAgendaAdvancementCountersLastTurn ??= 0;
  flags.runnerReceivedTagThisTurn ??= false;
  flags.stoleResearchAgendaThisTurn ??= false;
  flags.stoleGrayOpsAgendaThisTurn ??= false;
  flags.stoleBlackOpsAgendaThisTurn ??= false;
  flags.runAttemptsThisTurn ??= 0;
  flags.runAttemptsLastTurn ??= 0;
  flags.runAttemptsThisGame ??= 0;
  flags.trashedNodeThisTurn ??= false;
  flags.trashedNodeLastTurn ??= false;
  flags.trashedAdvertisementThisTurn ??= false;
  flags.trashedTransactionsThisTurn ??= false;
  flags.prearrangedDropPending ??= false;
  flags.installedResourceIdsThisTurn ??= [];
  flags.installedResourceIdsLastTurn ??= [];
  flags.successfulHqRunThisTurn ??= false;
  flags.successfulRunThisTurn ??= false;
  flags.damagePreventionUsage ??= {};
  flags.runnerActionsTakenThisTurn ??= 0;
  flags.brokerActionCardIdsThisTurn ??= [];
  flags.startOfTurnFloatingCreditsApplied ??= false;
  flags.allNighterBonusRunPending ??= false;
  flags.forgoNextActionPending ??= false;
  flags.forgoNextActionsPending ??= 0;
  flags.runLockActionsPending ??= 0;
  flags.fangRunLockCreditCost ??= 0;
  flags.valuPakProgramInstallActionsRemaining ??= 0;
  flags.valuPakTemporaryProgramInstallCredits ??= 0;
  flags.shellTradersStartTurnResolvedSourceIds ??= [];
  flags.bodyweightDataCrecheExtraRunPending ??= false;
  flags.bodyweightDataCrecheExtraRunUsedThisTurn ??= false;
  flags.startupImmolatorUsedSourceIdsThisTurn ??= [];
  flags.preyingMantisUsedSourceIdsThisTurn ??= [];
  flags.preyingMantisDamageDueSourceIdsThisTurn ??= [];
  flags.corpRezzedIceThisTurn ??= 0;
  return flags;
}

export function recordRunnerActionSpent(
  state: GameState,
  amount: number,
): void {
  if (!Number.isInteger(amount) || amount <= 0) return;
  const flags = ensureRunnerTurnFlags(state);
  flags.runnerActionsTakenThisTurn =
    Math.max(0, Math.floor(flags.runnerActionsTakenThisTurn ?? 0)) + amount;
}

export function hasSuccessfulHqRunThisTurn(state: GameState): boolean {
  return state.runnerTurnFlags?.successfulHqRunThisTurn === true;
}

export function hasSuccessfulRunThisTurn(state: GameState): boolean {
  return state.runnerTurnFlags?.successfulRunThisTurn === true;
}

export function ensureCorpTurnFlags(
  state: GameState,
): NonNullable<GameState["corpTurnFlags"]> {
  const flags = (state.corpTurnFlags ??= {
    scoredBlackOpsAgendaThisTurn: false,
    scoredBlackOpsAgendaLastTurn: false,
  });
  flags.scoredBlackOpsAgendaThisTurn ??= false;
  flags.scoredBlackOpsAgendaLastTurn ??= false;
  flags.edgerunnerTempsInstallActionsRemaining ??= 0;
  flags.disinfectantUsedSourceIdsThisTurn ??= [];
  flags.employeeEmpowermentStartTurnResolvedSourceIds ??= [];
  return flags;
}
