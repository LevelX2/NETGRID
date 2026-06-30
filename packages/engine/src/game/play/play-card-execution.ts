import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import {
  onPlayCardImplementationClickCost,
  printedCostOnPlayImplementation,
} from "../../ability-engine/card-implementation-runtime-shared";
import {
  corpUtilityImplementationForDefinition,
  corpUtilityPlayClickCost,
} from "./corp-operation-resolution";
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
  const cardId = String(legalAction.payload?.cardId) as CardInstanceId;
  const definition = definitionFor(host.state, cardId);
  if (host.cardImplementation.canPlayPrintedCostOnPlay(definition)) {
    const ability = printedCostOnPlayImplementation(definition);
    const expectedClicks = ability
      ? onPlayCardImplementationClickCost(ability)
      : 1;
    if ((legalAction.costs[0]?.clicks ?? 1) !== expectedClicks)
      throw new Error("Die Event-Klickkosten sind nicht mehr gueltig.");
  }
  spendPlayClicks(host, "runner", legalAction.costs[0]?.clicks ?? 1);
  host.payment.spendCredits("runner", legalAction.costs[0]?.credits ?? 0);
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
    const utility = corpUtilityImplementationForDefinition(definition.id);
    const expectedUtilityClicks = corpUtilityPlayClickCost(utility);
    if (
      expectedUtilityClicks > 1 &&
      (legalAction.costs[0]?.clicks ?? 1) !== expectedUtilityClicks
    )
      throw new Error("Die Operation-Klickkosten sind nicht mehr gueltig.");
    if (host.cardImplementation.hasPrintedCostOnPlay(definition)) {
      const expectedCost =
        (definition.cost ?? 0) +
        host.cardImplementation.additionalOperationCost(definition);
      if ((legalAction.costs[0]?.credits ?? 0) !== expectedCost)
        throw new Error("Die Operation-Kosten sind nicht mehr gueltig.");
      const ability = printedCostOnPlayImplementation(definition);
      const expectedClicks = ability
        ? onPlayCardImplementationClickCost(ability)
        : 1;
      if ((legalAction.costs[0]?.clicks ?? 1) !== expectedClicks)
        throw new Error("Die Operation-Klickkosten sind nicht mehr gueltig.");
      if (
        host.cardImplementation.needsLastTurnResourceTarget(definition) &&
        !host.operations.resolveRunnerLastTurnInstalledResourceTargetId(
          String(legalAction.payload.traceSuccessTargetCardId ?? ""),
        )
      )
        throw new Error("Das Operation-Ziel ist nicht mehr gueltig.");
    }
  }
  spendPlayClicks(host, "corp", legalAction.costs[0]?.clicks ?? 1);
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

function spendPlayClicks(
  host: PlayCardExecutionHost,
  side: "corp" | "runner",
  amount: number,
): void {
  const clicks = Math.max(1, Math.floor(amount));
  for (let index = 0; index < clicks; index += 1) {
    host.payment.spendClick(side);
  }
}
