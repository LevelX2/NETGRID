import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  CorpServer,
  CounterType,
  GameState,
  LegalAction,
  ServerId,
  Side,
} from "@netgrid/shared";
import type { ActiveNewDataFortCreationLock } from "../turn/corp-data-fort-lock";
import type { CardRunnerUtilityLongtailImplementation } from "../../ability-engine/definition-types";

export type CounterUtilityTriggerExecutionHost = {
  state: GameState;
  actions: {
    spendClick: (state: GameState, side: Side) => void;
    spendClicks: (state: GameState, side: Side, amount: number) => void;
  };
  cards: {
    definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
    runnerUtilityLongtailKindForCard: (
      state: GameState,
      cardId: CardInstanceId,
    ) => string | undefined;
    runnerUtilityLongtailImplementationForCard: (
      state: GameState,
      cardId: CardInstanceId,
    ) => CardRunnerUtilityLongtailImplementation | undefined;
  };
  credits: {
    spend: (state: GameState, side: Side, amount: number) => void;
  };
  counters: {
    cardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: CounterType,
    ) => number;
    spendCardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
    spyCountersForServer: (
      state: GameState,
      serverId: Exclude<ServerId, "new_remote">,
    ) => number;
    traceCounterEffectDefinitionFor: (
      counterType: unknown,
    ) =>
      | {
          counterType: CounterType;
          removeCost: number;
          sourceDefinitionId: CardDefinitionId;
        }
      | undefined;
  };
  runner: {
    ensureTurnFlags: (
      state: GameState,
    ) => NonNullable<GameState["runnerTurnFlags"]>;
    trashInstalledCardToHeap: (
      state: GameState,
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
  };
  servers: {
    mustServer: (state: GameState, serverId: string) => CorpServer;
    publicServerLabel: (
      state: GameState,
      serverId: Exclude<ServerId, "new_remote">,
    ) => string | undefined;
  };
  dataFort: {
    newDataFortCreationLockForSource: (
      state: GameState,
      cardId: CardInstanceId,
    ) => ActiveNewDataFortCreationLock | undefined;
  };
};

export type CounterUtilityTriggerExecutionResult = {
  handled: boolean;
  actionType?: LegalAction["type"];
};

export function handleCounterUtilityTriggerExecution(
  host: CounterUtilityTriggerExecutionHost,
  legalAction: LegalAction,
): CounterUtilityTriggerExecutionResult {
  if (legalAction.type !== "trigger_ability") return { handled: false };

  if (
    legalAction.payload?.corpAbility ===
    "trash_new_data_fort_creation_lock_source"
  ) {
    resolveCorpTrashNewDataFortCreationLockSource(host, legalAction);
    return handled(legalAction);
  }
  if (
    legalAction.payload?.runnerUtilityAbility ===
    "optional_extra_action_with_delayed_damage"
  ) {
    resolveOptionalExtraActionWithDelayedDamage(host, legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.corpAbility === "remove_spy_counter") {
    resolveCorpRemoveSpyCounter(host, legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.runnerAbility === "remove_runner_trace_counter") {
    resolveRemoveRunnerTraceCounter(host, legalAction);
    return handled(legalAction);
  }

  return { handled: false };
}

function resolveOptionalExtraActionWithDelayedDamage(
  host: CounterUtilityTriggerExecutionHost,
  legalAction: LegalAction,
): void {
  const { state } = host;
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf diese Zusatzaktion nutzen.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  if (!state.runner.rig.resources.includes(sourceCardId))
    throw new Error("Die Quelle der Zusatzaktion ist nicht installiert.");
  const implementation =
    host.cards.runnerUtilityLongtailImplementationForCard(state, sourceCardId);
  if (implementation?.kind !== "optional_extra_action_with_delayed_damage")
    throw new Error("Die Zusatzaktion passt nicht zur Quelle.");
  if (
    implementation.extraActions <= 0 ||
    implementation.damageAmount <= 0 ||
    implementation.damageTiming !== "end_of_turn" ||
    implementation.limit !== "once_per_turn_per_source"
  )
    throw new Error("Die Zusatzaktions-Parameter sind ungueltig.");
  const flags = host.runner.ensureTurnFlags(state);
  const limitKey = implementation.kind;
  const used = flags.abilityUsedSourceIdsByLimitKey?.[limitKey] ?? [];
  if (used.includes(sourceCardId))
    throw new Error("Diese Zusatzaktion wurde in diesem Zug bereits genutzt.");
  state.runner.clicks += implementation.extraActions;
  flags.abilityUsedSourceIdsByLimitKey = {
    ...(flags.abilityUsedSourceIdsByLimitKey ?? {}),
    [limitKey]: [...used, sourceCardId].sort(),
  };
  flags.delayedEndTurnEffects = [
    ...(flags.delayedEndTurnEffects ?? []),
    {
      sourceCardInstanceId: sourceCardId,
      sourceDefinitionId: host.cards.definitionFor(state, sourceCardId).id,
      abilityKey: implementation.kind,
      kind: "damage" as const,
      damageType: implementation.damageType,
      amount: implementation.damageAmount,
      preventable: implementation.preventable,
    },
  ].sort((a, b) =>
    `${a.abilityKey}:${a.sourceCardInstanceId}`.localeCompare(
      `${b.abilityKey}:${b.sourceCardInstanceId}`,
    ),
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: host.cards.definitionFor(state, sourceCardId).id,
    gainedActions: implementation.extraActions,
    runnerClicksAfter: state.runner.clicks,
    delayedDamageDueAtEndOfTurn: true,
    damageCannotBePrevented: implementation.preventable === false,
    damageType: implementation.damageType,
    damageAmount: implementation.damageAmount,
    abilityLimitKey: limitKey,
  };
}

function resolveCorpRemoveSpyCounter(
  host: CounterUtilityTriggerExecutionHost,
  legalAction: LegalAction,
): void {
  const { state } = host;
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf Spy-Counter entfernen.");
  const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
    ServerId,
    "new_remote"
  >;
  const server = host.servers.mustServer(state, serverId);
  if (host.counters.spyCountersForServer(state, server.id) <= 0)
    throw new Error("In diesem Fort liegt kein Spy-Counter.");
  if (clickCostForAction(legalAction) !== 1 || creditCostForAction(legalAction) !== 4)
    throw new Error("Spy-Counter entfernen kostet genau 1 Aktion und 4 Credits.");
  host.actions.spendClick(state, "corp");
  host.credits.spend(state, "corp", 4);
  state.spyCountersByServer = {
    ...(state.spyCountersByServer ?? {}),
    [server.id]: Math.max(
      0,
      host.counters.spyCountersForServer(state, server.id) - 1,
    ),
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    serverId: server.id,
    serverLabel: host.servers.publicServerLabel(state, server.id) ?? server.id,
    counterType: "spy",
    removedCounterAmount: 1,
    remainingCounters: host.counters.spyCountersForServer(state, server.id),
    removedSpyCounter: true,
    corpCreditsAfter: state.corp.credits,
  };
}

function resolveCorpTrashNewDataFortCreationLockSource(
  host: CounterUtilityTriggerExecutionHost,
  legalAction: LegalAction,
): void {
  const { state } = host;
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf diese Lock-Quelle trashen.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  if (!state.runner.rig.resources.includes(sourceCardId))
    throw new Error("Die Lock-Quelle ist nicht als Runner-Resource installiert.");
  const lock = host.dataFort.newDataFortCreationLockForSource(state, sourceCardId);
  if (!lock)
    throw new Error("Diese Resource erzeugt aktuell keinen Data-Fort-Creation-Lock.");
  const cost = lock.modifier.corpTrashSourceCost;
  if (
    clickCostForAction(legalAction) !== cost.clicks ||
    creditCostForAction(legalAction) !== cost.credits
  )
    throw new Error("Die Lock-Quelle hat nicht die erwarteten Trash-Kosten.");
  if (state.corp.clicks < cost.clicks || state.corp.credits < cost.credits)
    throw new Error("Die Korp kann die Trash-Kosten nicht bezahlen.");
  host.actions.spendClicks(state, "corp", cost.clicks);
  host.credits.spend(state, "corp", cost.credits);
  host.runner.trashInstalledCardToHeap(state, sourceCardId, legalAction);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: lock.sourceDefinitionId,
    trashedCardDefinitionId: lock.sourceDefinitionId,
    trashCostPaid: cost.credits,
    newDataFortCreationLockRemoved: true,
    corpCreditsAfter: state.corp.credits,
  };
}

function resolveRemoveRunnerTraceCounter(
  host: CounterUtilityTriggerExecutionHost,
  legalAction: LegalAction,
): void {
  const { state } = host;
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Runner-Trace-Counter entfernen.");
  if (legalAction.payload?.cardId !== state.runner.identity)
    throw new Error("Trace-Counter liegen auf der Runner-Identitaet.");
  const counterType = legalAction.payload?.counterType;
  const counterEffect =
    host.counters.traceCounterEffectDefinitionFor(counterType);
  if (!counterEffect)
    throw new Error("Dieser Runner-Trace-Counter ist nicht entfernbar.");
  const removeAmount = Number(legalAction.payload?.removeCounterAmount ?? 0);
  if (!Number.isInteger(removeAmount) || removeAmount !== 1)
    throw new Error("Es kann genau ein Runner-Trace-Counter entfernt werden.");
  const cost = Number(legalAction.payload?.counterRemoveCreditCost ?? 0);
  if (!Number.isInteger(cost) || cost !== counterEffect.removeCost)
    throw new Error("Der Counter verlangt den aktuellen Entfernen-Betrag.");
  if (host.counters.cardCounter(state, state.runner.identity, counterEffect.counterType) < 1)
    throw new Error("Es ist kein passender Counter vorhanden.");
  host.actions.spendClick(state, "runner");
  host.credits.spend(state, "runner", counterEffect.removeCost);
  host.counters.spendCardCounter(
    state,
    state.runner.identity,
    counterEffect.counterType,
    1,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: counterEffect.sourceDefinitionId,
    counterType: counterEffect.counterType,
    removedCounterAmount: 1,
    remainingCounters: host.counters.cardCounter(
      state,
      state.runner.identity,
      counterEffect.counterType,
    ),
    runnerCreditsAfter: state.runner.credits,
  };
}

function clickCostForAction(legalAction: LegalAction): number {
  return legalAction.costs.reduce(
    (sum, cost) =>
      sum + (Number.isInteger(cost.clicks) && cost.clicks ? cost.clicks : 0),
    0,
  );
}

function creditCostForAction(legalAction: LegalAction): number {
  return legalAction.costs.reduce(
    (sum, cost) =>
      sum + (Number.isInteger(cost.credits) && cost.credits ? cost.credits : 0),
    0,
  );
}

function handled(
  legalAction: LegalAction,
): CounterUtilityTriggerExecutionResult {
  return { handled: true, actionType: legalAction.type };
}
