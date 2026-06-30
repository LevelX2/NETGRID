import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import {
  closeRunnerCostPenaltySupportWindowForPayment,
  openRunnerCostPenaltySupportWindow,
} from "../payment/runner-payment-support";
import { definitionFor, mustInstance } from "../state/card-server-lookup";

type PlayCardResolver = {
  resolve: (state: GameState, legalAction: LegalAction) => void;
};

export type PlayCardExecutionHost = {
  state: GameState;
  zones: {
    removeFromAllZones: (cardId: CardInstanceId) => void;
  };
  payment: {
    spendClick: (side: "corp" | "runner") => void;
    spendCredits: (side: "corp" | "runner", amount: number) => void;
  };
  events: {
    runnerEventResolver: (definition: CardDefinition) => PlayCardResolver | undefined;
  };
  operations: {
    canPlayCorpOperation: (definition: CardDefinition) => boolean;
    resolveCorpOperation: (
      definition: CardDefinition,
      legalAction: LegalAction,
    ) => void;
    resolveRunnerLastTurnInstalledResourceTargetId: (
      targetCardId: string,
    ) => CardInstanceId | undefined;
  };
  cardImplementation: {
    canPlayPrintedCostOnPlay: (definition: CardDefinition) => boolean;
    executeOnPlayAbility: (
      legalAction: LegalAction,
      definition: CardDefinition,
      cardId: CardInstanceId,
    ) => void;
    resolveRunnerTargetedEventImplementation: (
      definition: CardDefinition,
      legalAction: LegalAction,
    ) => boolean;
    resolvePostOnPlayGenericFollowups: (
      definition: CardDefinition,
      legalAction: LegalAction,
    ) => void;
    hasPrintedCostOnPlay: (definition: CardDefinition) => boolean;
    additionalOperationCost: (definition: CardDefinition) => number;
    needsLastTurnResourceTarget: (definition: CardDefinition) => boolean;
  };
};

export type PlayCardExecutionResult = {
  handled: boolean;
};

export function handlePlayCardExecution(
  host: PlayCardExecutionHost,
  legalAction: LegalAction,
): PlayCardExecutionResult {
  switch (legalAction.type) {
    case "play_event":
      executePlayEventAction(host, legalAction);
      return { handled: true };
    case "play_operation":
      executePlayOperationAction(host, legalAction);
      return { handled: true };
    default:
      return { handled: false };
  }
}

function executePlayEventAction(
  host: PlayCardExecutionHost,
  legalAction: LegalAction,
): void {
  const creditCost = legalAction.costs[0]?.credits ?? 0;
  if (creditCost > 0) {
    if (
      host.state.runner.credits < creditCost &&
      openRunnerCostPenaltySupportWindow(host.state, legalAction, {
        amount: creditCost,
        availableWithoutSupport: host.state.runner.credits,
        context: "runner_pool",
      })
    )
      return;
    closeRunnerCostPenaltySupportWindowForPayment(
      host.state,
      legalAction,
      creditCost,
    );
  }
  host.payment.spendClick("runner");
  host.payment.spendCredits("runner", creditCost);
  const cardId = String(legalAction.payload?.cardId) as CardInstanceId;
  const definition = definitionFor(host.state, cardId);
  host.zones.removeFromAllZones(cardId);
  host.state.runner.heap.push(cardId);
  host.state.cardInstances[cardId] = {
    ...mustInstance(host.state.cardInstances, cardId),
    faceup: true,
    zone: { side: "runner", zone: "heap" },
  };
  const resolver = host.events.runnerEventResolver(definition);
  if (
    host.cardImplementation.resolveRunnerTargetedEventImplementation(
      definition,
      legalAction,
    )
  )
    return;
  if (host.cardImplementation.canPlayPrintedCostOnPlay(definition)) {
    host.cardImplementation.executeOnPlayAbility(legalAction, definition, cardId);
    host.cardImplementation.resolvePostOnPlayGenericFollowups(
      definition,
      legalAction,
    );
    return;
  }
  if (resolver) {
    resolver.resolve(host.state, legalAction);
    return;
  }
  throw new Error(`Kein Runner-Event-Resolver fuer ${definition.id}.`);
}

function executePlayOperationAction(
  host: PlayCardExecutionHost,
  legalAction: LegalAction,
): void {
  if (!legalAction.payload?.cardId)
    throw new Error("Die Operation hat keine gueltige Karte.");
  {
    const cardId = String(legalAction.payload.cardId) as CardInstanceId;
    const definition = definitionFor(host.state, cardId);
    if (!host.operations.canPlayCorpOperation(definition))
      throw new Error("Diese Operation ist im aktuellen Zustand nicht spielbar.");
    if (host.cardImplementation.hasPrintedCostOnPlay(definition)) {
      const expectedCost =
        (definition.cost ?? 0) +
        host.cardImplementation.additionalOperationCost(definition);
      if ((legalAction.costs[0]?.credits ?? 0) !== expectedCost)
        throw new Error("Die Operation-Kosten sind nicht mehr gueltig.");
      if (
        host.cardImplementation.needsLastTurnResourceTarget(definition) &&
        !host.operations.resolveRunnerLastTurnInstalledResourceTargetId(
          String(legalAction.payload.traceSuccessTargetCardId ?? ""),
        )
      )
        throw new Error("Das Operation-Ziel ist nicht mehr gueltig.");
    }
  }
  host.payment.spendClick("corp");
  host.payment.spendCredits("corp", legalAction.costs[0]?.credits ?? 0);
  if (legalAction.payload?.cardId) {
    const cardId = String(legalAction.payload.cardId) as CardInstanceId;
    const definition = definitionFor(host.state, cardId);
    host.zones.removeFromAllZones(cardId);
    host.state.corp.archives.push(cardId);
    host.state.cardInstances[cardId] = {
      ...mustInstance(host.state.cardInstances, cardId),
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "archives" },
    };
    host.operations.resolveCorpOperation(definition, legalAction);
    if (definition.id === "v098_hq_rd_swap_operation") {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "swap_hq_rd",
      };
    }
    if (definition.id === "v099_bad_publicity_operation") {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        badPublicityAfter: host.state.corp.badPublicity,
      };
    }
  }
}
