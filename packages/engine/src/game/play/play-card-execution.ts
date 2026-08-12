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
  closeRunnerCostPenaltySupportWindowForPayment,
  openRunnerCostPenaltySupportWindow,
} from "../payment/runner-payment-support";
import { fixedPlayCostCredits } from "../payment/play-cost";
import { restrictedHostedCredits } from "../run/run-duration-payment";
import { definitionFor, mustInstance } from "../state/card-server-lookup";
import {
  corpUtilityImplementationForDefinition,
  corpUtilityPlayClickCost,
  onPlayCardImplementationVariableOperationCreditCostForAction,
} from "./corp-operation-resolution";

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
    spendRunnerEventCredits?: (
      amount: number,
      legalAction?: LegalAction,
    ) => void;
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
  const ability = printedCostOnPlayImplementation(definition);
  const sourceDisposition = ability?.sourceDisposition;
  const returnToGripRequested =
    legalAction.payload?.onPlaySourceDisposition ===
    "return_to_grip_instead_of_trash";
  if (
    legalAction.payload?.onPlaySourceDisposition !== undefined &&
    (!returnToGripRequested ||
      sourceDisposition?.kind !== "return_to_grip_instead_of_trash" ||
      sourceDisposition.decisionTiming !== "when_played")
  )
    throw new Error("Die Event-Ablageentscheidung ist nicht mehr gueltig.");
  const additionalSourceDispositionCost = returnToGripRequested
    ? (sourceDisposition?.additionalCreditCost ?? 0)
    : 0;
  if (
    returnToGripRequested &&
    legalAction.payload?.additionalSourceDispositionCreditCost !==
      additionalSourceDispositionCost
  )
    throw new Error("Die Event-Ablagekosten sind nicht mehr gueltig.");
  const expectedCreditCost =
    fixedPlayCostCredits(definition) + additionalSourceDispositionCost;
  if (legalAction.costs[0]?.credits !== expectedCreditCost)
    throw new Error("Die Event-Kosten sind nicht mehr gueltig.");
  if (host.cardImplementation.canPlayPrintedCostOnPlay(definition)) {
    const expectedClicks = ability
      ? onPlayCardImplementationClickCost(ability)
      : 1;
    if ((legalAction.costs[0]?.clicks ?? 1) !== expectedClicks)
      throw new Error("Die Event-Klickkosten sind nicht mehr gueltig.");
  }
  const creditCost = expectedCreditCost;
  if (creditCost > 0) {
    const availableWithoutSupport =
      host.state.runner.credits +
      (host.payment.spendRunnerEventCredits
        ? restrictedHostedCredits(host.state, "play_events")
        : 0);
    if (
      openRunnerCostPenaltySupportWindow(host.state, legalAction, {
        amount: creditCost,
        availableWithoutSupport,
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
  spendPlayClicks(host, "runner", legalAction.costs[0]?.clicks ?? 1);
  if (host.payment.spendRunnerEventCredits)
    host.payment.spendRunnerEventCredits(creditCost, legalAction);
  else host.payment.spendCredits("runner", creditCost);
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
    if (returnToGripRequested) {
      if (!host.state.runner.heap.includes(cardId))
        throw new Error(
          "Das Event kann nach seiner Aufloesung nicht zurueckgenommen werden.",
        );
      host.zones.removeFromAllZones(cardId);
      host.state.runner.grip.push(cardId);
      host.state.cardInstances[cardId] = {
        ...mustInstance(host.state.cardInstances, cardId),
        faceup: false,
        zone: { side: "runner", zone: "grip" },
      };
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        sourceReturnedToGrip: true,
      };
    }
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
  const operationCreditCost = requiredCreditCost(
    legalAction,
    "Die Operation hat keine gueltigen Credit-Kosten.",
  );
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
        onPlayCardImplementationVariableOperationCreditCostForAction(
          definition,
          legalAction,
        ) ??
        fixedPlayCostCredits(definition) +
          host.cardImplementation.additionalOperationCost(definition);
      if (operationCreditCost !== expectedCost)
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
  host.payment.spendCredits("corp", operationCreditCost);
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
  }
}

function requiredCreditCost(
  legalAction: LegalAction,
  message: string,
): number {
  const creditCost = legalAction.costs[0]?.credits;
  if (
    typeof creditCost !== "number" ||
    !Number.isInteger(creditCost) ||
    creditCost < 0
  )
    throw new Error(message);
  return creditCost;
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
