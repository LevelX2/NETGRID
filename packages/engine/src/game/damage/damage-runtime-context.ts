import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CardType,
  DamageType,
  EventModificationCandidate,
  GameState,
  ImminentEvent,
  LegalAction,
  ReplacementCandidate,
} from "@netgrid/shared";
import {
  hiddenRunnerResourceSlotId,
  isConcealedRunnerResource,
} from "../view/card-view";

export type DamageSummary = {
  damageType: DamageType;
  amount: number;
  cardsTrashed: number;
  flatline: boolean;
  runnerGripBefore?: number;
  runnerGripAfter?: number;
  coreDamageAfter?: number;
  runnerMaxHandSizeAfter?: number;
};

export type CorpAgendaPointCostSpendResult = {
  paidPoints: number;
  bonusPointsSpent: number;
  spentAgendaIds: CardInstanceId[];
  spentAgendaDefinitionIds: CardDefinitionId[];
};

export type DamageCoreHost = {
  cards: {
    definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
    runnerInstalledCardIds: (state: GameState) => CardInstanceId[];
    scoredCorpAgendaIds: (state: GameState) => CardInstanceId[];
    scoredAgendaKindForDefinition: (
      definition: CardDefinition,
    ) => string | undefined;
  };
  zones: {
    removeFromAllZones: (state: GameState, cardId: string) => void;
    trashRunnerInstalledCardToHeap: (
      state: GameState,
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
    returnRunnerInstalledCardToGrip: (
      state: GameState,
      cardId: CardInstanceId,
    ) => void;
  };
  runner: {
    drawRunnerCard: (state: GameState, drawTaxDecision?: "none") => unknown;
    ensureRunnerTurnFlags: (
      state: GameState,
    ) => NonNullable<GameState["runnerTurnFlags"]>;
    addFutureActionDebt: (state: GameState, amount: number) => void;
  };
  corp: {
    agendaPointTotal: (state: GameState) => number;
    chooseAgendasForPointCost: (
      state: GameState,
      requiredPoints: number,
    ) => CardInstanceId[];
    agendaPointsForScoredCard: (
      state: GameState,
      cardId: CardInstanceId,
    ) => number;
    forfeitAgendaForPointCost: (
      state: GameState,
      cardId: CardInstanceId,
    ) => void;
    spendAgendaPointCost: (
      state: GameState,
      requiredPoints: number,
    ) => CorpAgendaPointCostSpendResult;
  };
  counters: {
    cardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: string,
    ) => number;
    spendCardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: string,
      amount: number,
    ) => void;
  };
  credits: {
    gain: (state: GameState, side: "corp" | "runner", amount: number) => void;
    spend: (state: GameState, side: "corp" | "runner", amount: number) => void;
  };
  rng: {
    nextRandom: (state: GameState, purpose: string) => number;
  };
  reactions?: {
    openPostMeatDamageReactionWindow: (
      state: GameState,
      summary: DamageSummary,
    ) => boolean;
  };
};

let configuredDamageCoreHost: DamageCoreHost | undefined;

export function configureDamageCoreHost(host: DamageCoreHost): void {
  configuredDamageCoreHost = host;
}

export function resetDamageCoreHostForTests(): void {
  configuredDamageCoreHost = undefined;
}

export function requireDamageCoreHost(): DamageCoreHost {
  if (!configuredDamageCoreHost)
    throw new Error("DamageCoreHost ist nicht konfiguriert.");
  return configuredDamageCoreHost;
}

export function definitionFor(
  state: GameState,
  cardId: CardInstanceId,
): CardDefinition {
  return requireDamageCoreHost().cards.definitionFor(state, cardId);
}

export function runnerInstalledCardIds(state: GameState): CardInstanceId[] {
  return requireDamageCoreHost().cards.runnerInstalledCardIds(state);
}

export function scoredCorpAgendaIds(state: GameState): CardInstanceId[] {
  return requireDamageCoreHost().cards.scoredCorpAgendaIds(state);
}

export function scoredAgendaKindForDefinition(
  definition: CardDefinition,
): string | undefined {
  return requireDamageCoreHost().cards.scoredAgendaKindForDefinition(
    definition,
  );
}

export function removeFromAllZones(state: GameState, cardId: string): void {
  requireDamageCoreHost().zones.removeFromAllZones(state, cardId);
}

export function trashRunnerInstalledCardToHeap(
  state: GameState,
  cardId: CardInstanceId,
  legalAction?: LegalAction,
): void {
  requireDamageCoreHost().zones.trashRunnerInstalledCardToHeap(
    state,
    cardId,
    legalAction,
  );
}

export function returnRunnerInstalledCardToGrip(
  state: GameState,
  cardId: CardInstanceId,
): void {
  requireDamageCoreHost().zones.returnRunnerInstalledCardToGrip(state, cardId);
}

export function drawRunnerCard(
  state: GameState,
  drawTaxDecision?: "none",
): unknown {
  return requireDamageCoreHost().runner.drawRunnerCard(state, drawTaxDecision);
}

export function ensureRunnerTurnFlags(
  state: GameState,
): NonNullable<GameState["runnerTurnFlags"]> {
  return requireDamageCoreHost().runner.ensureRunnerTurnFlags(state);
}

export function addRunnerFutureActionDebt(
  state: GameState,
  amount: number,
): void {
  requireDamageCoreHost().runner.addFutureActionDebt(state, amount);
}

export function corpAgendaPointTotal(state: GameState): number {
  return requireDamageCoreHost().corp.agendaPointTotal(state);
}

export function agendaPointsForScoredCard(
  state: GameState,
  cardId: CardInstanceId,
): number {
  return requireDamageCoreHost().corp.agendaPointsForScoredCard(state, cardId);
}

export function spendCorpAgendaPointCost(
  state: GameState,
  requiredPoints: number,
): CorpAgendaPointCostSpendResult {
  return requireDamageCoreHost().corp.spendAgendaPointCost(
    state,
    requiredPoints,
  );
}

export function cardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: string,
): number {
  return requireDamageCoreHost().counters.cardCounter(
    state,
    cardId,
    counterType,
  );
}

export function spendCardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: string,
  amount: number,
): void {
  requireDamageCoreHost().counters.spendCardCounter(
    state,
    cardId,
    counterType,
    amount,
  );
}

export function credits(
  state: GameState,
  side: "corp" | "runner",
  amount: number,
): void {
  requireDamageCoreHost().credits.gain(state, side, amount);
}

export function spendCredits(
  state: GameState,
  side: "corp" | "runner",
  amount: number,
): void {
  requireDamageCoreHost().credits.spend(state, side, amount);
}

export function nextRandom(state: GameState, purpose: string): number {
  return requireDamageCoreHost().rng.nextRandom(state, purpose);
}

export function assertPositiveIntegerAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0)
    throw new Error("Damage amount ist ungueltig.");
}

export function mustInstance(
  source: Record<CardInstanceId, CardInstance>,
  id: CardInstanceId,
): CardInstance {
  const instance = source[id];
  if (!instance) throw new Error(`CardInstance fehlt: ${id}`);
  return instance;
}

export function mustArrayValue<T>(
  values: T[],
  index: number,
  message: string,
): T {
  const value = values[index];
  if (value === undefined) throw new Error(message);
  return value;
}

export function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 80);
}

export function cardHasSubtype(
  definition: CardDefinition,
  subtype: string,
): boolean {
  return (
    definition.subtypes?.some(
      (candidate) => candidate.toLowerCase() === subtype.toLowerCase(),
    ) ?? false
  );
}

export function clearEventModificationState(state: GameState): void {
  delete state.pendingChoice;
  delete state.eventModificationWindow;
  delete state.imminentEvent;
}

export function clearReplacementState(state: GameState): void {
  delete state.pendingChoice;
  delete state.replacementWindow;
  delete state.imminentEvent;
}

export function compareEventModificationCandidate(
  left: EventModificationCandidate,
  right: EventModificationCandidate,
): number {
  return (
    left.priority - right.priority ||
    left.controller.localeCompare(right.controller) ||
    left.candidateId.localeCompare(right.candidateId)
  );
}

export function hasEventModificationConflict(
  candidates: EventModificationCandidate[],
): boolean {
  if (candidates.length <= 1) return false;
  const first = candidates[0];
  return candidates.some(
    (candidate) =>
      candidate.priority === first?.priority && candidate.kind !== first.kind,
  );
}

export function compareReplacementCandidate(
  left: ReplacementCandidate,
  right: ReplacementCandidate,
): number {
  return (
    left.priority - right.priority ||
    left.controller.localeCompare(right.controller) ||
    (left.sourceRef.instanceId ?? "").localeCompare(
      right.sourceRef.instanceId ?? "",
    ) ||
    left.candidateId.localeCompare(right.candidateId)
  );
}

export function hasReplacementConflict(
  candidates: ReplacementCandidate[],
): boolean {
  if (candidates.length <= 1) return false;
  const first = candidates[0];
  return candidates.some(
    (candidate) =>
      candidate.priority === first?.priority &&
      (candidate.replacementEventType !== first.replacementEventType ||
        candidate.tagAmount !== first.tagAmount ||
        candidate.controller !== first.controller),
  );
}

export function numberPayload(event: ImminentEvent, key: string): number {
  const value = event.payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function stringPayload(event: ImminentEvent, key: string): string {
  const value = event.payload[key];
  return typeof value === "string" ? value : "";
}

export function damageTypePayload(event: ImminentEvent): DamageType {
  const value = event.payload.damageType;
  return value === "meat" || value === "core" ? value : "net";
}

export function hiddenRunnerResourceRevealPayload(
  state: GameState,
  cardId: CardInstanceId,
): Record<string, string | number | boolean> {
  if (!isConcealedRunnerResource(state, cardId)) return {};
  const definition = definitionFor(state, cardId);
  return {
    hiddenRunnerResource: true,
    hiddenRunnerResourceRevealed: true,
    hiddenResourceSlotId: hiddenRunnerResourceSlotId(cardId),
    publicRevealDefinitionId: definition.id,
  };
}

export function recordRunnerDamageDuringCurrentAction(state: GameState): void {
  const flags = ensureRunnerTurnFlags(state);
  const currentOrdinal = Math.floor(flags.runnerActionsTakenThisTurn ?? 0);
  if (state.activeSide !== "runner" || currentOrdinal <= 0) return;
  flags.lastDamageRunnerActionOrdinal = currentOrdinal;
}
