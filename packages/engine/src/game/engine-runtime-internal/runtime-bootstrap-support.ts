import { scoredAgendaPointValue } from "../state/corp-agenda-point-cost";
import * as runtimePorts from "./runtime-port-bindings";
import { type CardDefinition, type CardDefinitionId, type CardInstanceId, type GameState, type LegalAction, type PlayerController, type ResolvedGameEffect, type ServerId, type Side } from "@netgrid/shared";
import { type CorpTracePaymentDependencies, type RunnerTracePaymentDependencies } from "../payment";
import { definitionFor, mustInstance } from "../state/card-server-lookup";
import { spendCredits } from "../state/economy-mutation";
import { cardCounter, ensureCorpTurnFlags, spendCardCounter } from "../state/turn-flags-counters";
import { removeFromAllZones } from "../state/zone-mutation";
export { getLegalActions, legalActionsFor } from "../legal-actions";
export {
  eventVisibilityForAction,
  isHiddenInfoBarrierEvent,
} from "../events/build-event";
export { checkWinConditions } from "../win-conditions";
import { handleRunEndCleanup } from "../run/run-end-cleanup";
import { recordRunnerRunCreditSpend, recordRunActionSpendingCapSpend, restrictedHostedCreditSourceForDefinition, restrictedHostedCreditSourceIds, runDurationPaymentHost } from "../run/run-duration-payment";
import { fortTraceBitPoolTotal, spendFortTraceBitPool } from "../run/fort-run-side-families";
export { quoteCorpRezCost } from "../payment";
export { createGame, createGameAfterSetup } from "../create-game";
export { applyAction } from "../apply-action";
export { applyGameAction } from "../apply-game-action";
export { getPlayerView, playerViewFor } from "../player-view";
export { replayEvents, replayGameEvents } from "../replay";
import { resolveHiddenRunnerResourceSlot } from "../view/card-view";
export { redactPublicEventForSide } from "../view/public-event-view";
export { hashGameState, hashState } from "../hash";
export { validateGameState, validateGameStateForDebug } from "../validation";
import { rezzedCorpRootCardIds as rezzedCorpRootCardIdsFromState } from "../../ability-engine/card-implementation-modifiers";
import { type EffectiveAgendaDifficultyDependencies } from "../../ability-engine/effective-values";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

export type AutomaticEffectCollector = ResolvedGameEffect[];
// Effective-value helpers are pure/read-only. The server run-counter rule is
// injected through runtime wiring; declared card modifiers are evaluated by
// the shared helper used for score legality and revalidation.
export const effectiveAgendaDifficultyDeps: EffectiveAgendaDifficultyDependencies =
  {
    definitionFor,
    serverDifficultyIncreaseFromRunCounters: (state, agendaId) =>
      runtimePorts.serverDifficultyIncreaseFromRunCounters(state, agendaId),
  };

export const DEFAULT_CONTROLLERS: {
  runner: PlayerController;
  corp: PlayerController;
} = {
  runner: {
    controllerId: "runner-local",
    side: "runner",
    type: "human_local",
    displayName: "Runner",
  },
  corp: {
    controllerId: "corp-ai",
    side: "corp",
    type: "ai",
    displayName: "Korp KI",
  },
};

export type ActiveRun = NonNullable<GameState["run"]>;
export type ActiveBreach = NonNullable<ActiveRun["breach"]>;
export const INITIAL_HAND_SIZE = 5;

export function privateLookCardIds(
  state: GameState,
  zone: Extract<ServerId, "rd" | "hq">,
  count: number | "all",
): CardInstanceId[] {
  const ids = zone === "rd" ? state.corp.rd : state.corp.hq;
  const limit =
    count === "all"
      ? ids.length
      : Math.min(Math.max(0, Math.floor(count)), ids.length);
  return ids.slice(0, limit);
}

export function finishRun(
  state: GameState,
  successful: boolean,
  legalAction?: LegalAction,
): void {
  handleRunEndCleanup(
    runtimePorts.runEndCleanupHost(state),
    successful,
    legalAction,
  );
}

export function handForSide(state: GameState, side: Side): CardInstanceId[] {
  return side === "corp" ? state.corp.hq : state.runner.grip;
}

export function hasCardImplementationMemoryUnitModifier(
  definition: CardDefinition,
): boolean {
  return (
    cardImplementationForDefinitionId(definition.id)?.modifiers?.some(
      (modifier) => modifier.kind === "memory_units",
    ) === true
  );
}

export function cardImplementationAgendaPointInstallCost(
  definition: CardDefinition,
): number {
  return (
    cardImplementationForDefinitionId(definition.id)?.installAdditionalCosts ??
    []
  ).reduce((sum, cost) => {
    if (cost.kind !== "agenda_point") return sum;
    if (!Number.isInteger(cost.amount) || cost.amount <= 0)
      throw new Error("Agenda-Punkt-Installationskosten sind ungueltig.");
    return sum + cost.amount;
  }, 0);
}

export function drawTaxSourceIds(state: GameState): CardInstanceId[] {
  return rezzedCorpRootCardIdsFromState(state).filter(
    (sourceId: CardInstanceId) =>
      runtimePorts.isDrawTaxSourceDefinition(state, sourceId),
  );
}

export function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 80);
}

export function requireRunnerTagged(state: GameState): void {
  if (state.runner.tags <= 0) throw new Error("Der Runner ist nicht getaggt.");
}

export function runnerStoleAgendaLastTurn(state: GameState): boolean {
  return state.runnerTurnFlags?.stoleAgendaLastTurn === true;
}

export function runnerStolenAgendaAdvancementCountersLastTurn(
  state: GameState,
): number {
  return Math.max(
    0,
    Math.floor(
      state.runnerTurnFlags?.stolenAgendaAdvancementCountersLastTurn ?? 0,
    ),
  );
}

export function runnerRunAttemptsLastTurn(state: GameState): number {
  return Math.max(
    0,
    Math.floor(state.runnerTurnFlags?.runAttemptsLastTurn ?? 0),
  );
}

export function runnerRunAttemptsThisGame(state: GameState): number {
  return Math.max(
    0,
    Math.floor(state.runnerTurnFlags?.runAttemptsThisGame ?? 0),
  );
}

export function runnerTrashedNodeLastTurn(state: GameState): boolean {
  return state.runnerTurnFlags?.trashedNodeLastTurn === true;
}

export function runnerLastTurnInstalledResourceIds(
  state: GameState,
): CardInstanceId[] {
  return state.runner.rig.resources.filter((cardId) =>
    state.runnerTurnFlags?.installedResourceIdsLastTurn?.includes(cardId),
  );
}

export function resolveRunnerLastTurnInstalledResourceTargetId(
  state: GameState,
  targetRef: string,
): CardInstanceId | undefined {
  const eligible = runnerLastTurnInstalledResourceIds(state);
  if (eligible.includes(targetRef as CardInstanceId))
    return targetRef as CardInstanceId;
  const hiddenResourceId = resolveHiddenRunnerResourceSlot(state, targetRef);
  return hiddenResourceId && eligible.includes(hiddenResourceId)
    ? hiddenResourceId
    : undefined;
}

export function runnerInstalledResourceLastTurn(state: GameState): boolean {
  return runnerLastTurnInstalledResourceIds(state).length > 0;
}

export function corpScoredBlackOpsAgendaLastTurn(state: GameState): boolean {
  return ensureCorpTurnFlags(state).scoredBlackOpsAgendaLastTurn === true;
}

export function runnerStoleAgendaSubtypeThisTurn(
  state: GameState,
  subtype: "research" | "gray_ops" | "black_ops",
): boolean {
  if (subtype === "research")
    return state.runnerTurnFlags?.stoleResearchAgendaThisTurn === true;
  if (subtype === "gray_ops")
    return state.runnerTurnFlags?.stoleGrayOpsAgendaThisTurn === true;
  return state.runnerTurnFlags?.stoleBlackOpsAgendaThisTurn === true;
}

export function agendaPointsForScoredCard(
  state: GameState,
  cardId: CardInstanceId,
): number {
  return scoredAgendaPointValue(state, cardId);
}

export function spendAgendaPointFromScoredCard(
  state: GameState,
  cardId: CardInstanceId,
): void {
  if (agendaPointsForScoredCard(state, cardId) < 1)
    throw new Error(
      "Die gewaehlte Agenda liefert keinen Agenda-Punkt fuer Kosten.",
    );
  const instance = mustInstance(state.cardInstances, cardId);
  state.cardInstances[cardId] = {
    ...instance,
    agendaPointsSpent:
      Math.max(0, Math.floor(instance.agendaPointsSpent ?? 0)) + 1,
  };
}

export function scoreInstalledRunnerProgramAsAgenda(
  state: GameState,
  legalAction: LegalAction,
  sourceCardId: CardInstanceId,
): { publicPayload: Record<string, string | number | boolean> } {
  const instance = mustInstance(state.cardInstances, sourceCardId);
  const installedProgram = instance.installedAsRunnerProgram;
  const definition = definitionFor(state, sourceCardId);
  if (
    !state.runner.rig.programs.includes(sourceCardId) ||
    !installedProgram?.scoreAsAgendaAction ||
    definition.type !== "agenda"
  )
    throw new Error(
      "Die Quelle ist kein als Runner-Programm installiertes Agenda-Programm.",
    );
  const memoryCost = Math.max(0, Math.floor(installedProgram.memoryCost ?? 0));
  const {
    installedAsRunnerProgram: _installedAsRunnerProgram,
    hostedOn: _hostedOn,
    ...scoredInstance
  } = instance;
  void _installedAsRunnerProgram;
  void _hostedOn;
  removeFromAllZones(state, sourceCardId);
  state.runner.memoryUsed = Math.max(0, state.runner.memoryUsed - memoryCost);
  state.runner.scoreArea.push(sourceCardId);
  state.cardInstances[sourceCardId] = {
    ...scoredInstance,
    controller: "runner",
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "scoreArea" },
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    scoredSourceAsAgenda: true,
    sourceDefinitionId: definition.id,
    scoredAgendaPointValue: agendaPointsForScoredCard(state, sourceCardId),
    runnerMemoryUsedAfter: state.runner.memoryUsed,
  };
  return { publicPayload: legalAction.payload };
}

export function pickRunnerAgendaForAgendaPointCost(
  state: GameState,
): CardInstanceId | undefined {
  return state.runner.scoreArea
    .slice()
    .sort((left, right) => {
      const byPoints =
        agendaPointsForScoredCard(state, left) -
        agendaPointsForScoredCard(state, right);
      return byPoints !== 0 ? byPoints : left.localeCompare(right);
    })
    .find((cardId) => agendaPointsForScoredCard(state, cardId) >= 1);
}

type CorpAgendaPointCostResult = {
  paidPoints: number;
  bonusPointsSpent: number;
  spentAgendaIds: CardInstanceId[];
  spentAgendaDefinitionIds: CardDefinitionId[];
};

export function recurringTraceCreditPoolSourceIds(
  state: GameState,
): CardInstanceId[] {
  return rezzedCorpRootCardIdsFromState(state)
    .filter((cardId: CardInstanceId) => {
      const utility = runtimePorts.corpUtilityImplementationForCard(
        state,
        cardId,
      );
      return (
        utility?.kind === "recurring_trace_credit_pool" &&
        utility.counterType === "bit" &&
        utility.spendWindow === "trace" &&
        cardCounter(state, cardId, utility.counterType) > 0
      );
    })
    .sort();
}

export function recurringTraceCreditPoolTotal(state: GameState): number {
  return recurringTraceCreditPoolSourceIds(state).reduce(
    (sum, cardId) => sum + cardCounter(state, cardId, "bit"),
    0,
  );
}

export function runnerInstalledHardwareTrashTarget(
  state: GameState,
): CardInstanceId | undefined {
  return state.runner.rig.hardware.slice().sort((left, right) => {
    const leftDefinition = definitionFor(state, left);
    const rightDefinition = definitionFor(state, right);
    const byInstallCost =
      (rightDefinition.installCost ?? 0) - (leftDefinition.installCost ?? 0);
    return byInstallCost !== 0 ? byInstallCost : left.localeCompare(right);
  })[0];
}

export const corpTracePaymentDeps: CorpTracePaymentDependencies = {
  encounterTemporaryTraceCreditsAvailable: (state, trace) =>
    runtimePorts.encounterTemporaryTraceCreditsAvailable(state, trace),
  spendEncounterTemporaryTraceCredits: (state, trace, amount) =>
    runtimePorts.spendEncounterTemporaryTraceCredits(state, trace, amount),
  fortTraceBitPoolTotal: (state) =>
    fortTraceBitPoolTotal(runtimePorts.fortRunSideFamiliesHostForState(state)),
  spendFortTraceBitPool: (state, sourceCardId, serverId, amount) =>
    spendFortTraceBitPool(
      runtimePorts.fortRunSideFamiliesHostForState(state),
      sourceCardId,
      serverId,
      amount,
    ),
  corpCreditsAvailable: (state) => state.corp.credits,
  spendCorpCredits: (state, amount) => spendCredits(state, "corp", amount),
  corpTraceBitPoolTotal: recurringTraceCreditPoolTotal,
  spendCorpTraceBitPool: (state, amount) =>
    runtimePorts.spendRecurringTraceCreditPool(state, amount),
  corpTraceCounterPoolTotal: (state) =>
    runtimePorts.corpTraceCounterPoolTotal(state),
  spendCorpTraceCounterPool: (state, amount) =>
    runtimePorts.spendCorpTraceCounterPoolCounters(state, amount),
  corpTraceBitPoolSources: (state) =>
    recurringTraceCreditPoolSourceIds(state).map((cardId) => ({
      kind: "corp_trace_bit_pool" as const,
      sourceCardInstanceId: cardId,
      sourceDefinitionId: definitionFor(state, cardId).id,
      available: cardCounter(state, cardId, "bit"),
    })),
  spendCorpTraceBitPoolSource: (state, cardId, amount) => {
    const available = cardCounter(state, cardId, "bit");
    const spent = Math.min(available, Math.max(0, Math.floor(amount)));
    spendCardCounter(state, cardId, "bit", spent);
    return spent;
  },
  corpTraceCounterPoolSources: (state) =>
    runtimePorts.corpTraceCounterPoolSourceIds(state).map((cardId) => {
      const counterType = runtimePorts.corpTraceCounterPoolCounterType(
        state,
        cardId,
      );
      return {
        kind: "corp_trace_counter_pool" as const,
        sourceCardInstanceId: cardId,
        sourceDefinitionId: definitionFor(state, cardId).id,
        available: cardCounter(state, cardId, counterType),
      };
    }),
  spendCorpTraceCounterPoolSource: (state, cardId, amount) => {
    const counterType = runtimePorts.corpTraceCounterPoolCounterType(
      state,
      cardId,
    );
    const available = cardCounter(state, cardId, counterType);
    const spent = Math.min(available, Math.max(0, Math.floor(amount)));
    spendCardCounter(state, cardId, counterType, spent);
    return spent;
  },
  cardCounter,
};

export const runnerTracePaymentDeps: RunnerTracePaymentDependencies = {
  runnerTraceLinkCreditSources: (state) =>
    restrictedHostedCreditSourceIds(state, "increase_link")
      .sort()
      .map((cardId) => {
        const definition = definitionFor(state, cardId);
        const sourceDefinitionId = definition.id;
        const restricted =
          restrictedHostedCreditSourceForDefinition(definition);
        return {
          sourceCardInstanceId: cardId,
          sourceDefinitionId,
          ...(restricted?.usableFor.includes("increase_link")
            ? { publicKind: "runner_trace_link_bonus_credit" as const }
            : {}),
        };
      }),
  hostedPaymentCredits: (state, cardId) => cardCounter(state, cardId, "bit"),
  spendHostedPaymentCredits: (state, cardId, amount) =>
    spendCardCounter(state, cardId, "bit", amount),
  runnerCreditsAvailable: (state) => state.runner.credits,
  spendRunnerCredits: (state, amount) => spendCredits(state, "runner", amount),
  recordRunnerRunCreditSpend: (state, amount) => {
    if (!state.run) return;
    recordRunnerRunCreditSpend(runDurationPaymentHost(state), amount);
  },
  recordRunActionSpendingCapSpend: (state, amount) => {
    if (!state.run) return;
    recordRunActionSpendingCapSpend(runDurationPaymentHost(state), amount);
  },
  definitionIdForCard: (state, cardId) => definitionFor(state, cardId).id,
};

export { isV097OrLater, isV099OrLater, isVersionAtLeast } from "../rules-version";

export function cloneState<T>(state: T): T {
  return structuredClone(state) as T;
}
