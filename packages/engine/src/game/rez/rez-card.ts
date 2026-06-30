import {
  type CardDefinition,
  type CardDefinitionId,
  type CardInstance,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type Side,
} from "@netgrid/shared";
import { costQuotePublicPayload, type CostQuote } from "../payment";
import type {
  CardSelfRezAdditionalCostImplementation,
  CardVariableRezImplementation,
} from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

type CorpAgendaPointCostResult = {
  paidPoints: number;
  bonusPointsSpent: number;
  forfeitedAgendaIds: CardInstanceId[];
  forfeitedAgendaDefinitionIds: CardDefinitionId[];
};

export type RezCardHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    mustInstance: (cardId: CardInstanceId) => CardInstance;
    hasCardImplementationForDefinition: (
      definitionId: CardDefinitionId,
    ) => boolean;
    variableRezForDefinition: (
      definition: CardDefinition,
    ) => CardVariableRezImplementation | undefined;
    stableSubtypeList: (subtypes: readonly string[]) => string[];
  };
  run: {
    mustRun: () => NonNullable<GameState["run"]>;
    handleRunRootRezPostRez: (
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
    handlePostIceRezContinuation?: (
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => boolean;
    beginEncounter: (
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
  };
  payment: {
    rezCostForCard: (cardId: CardInstanceId) => number;
    assertCorpRezCostQuoteValid: (
      cardId: CardInstanceId,
      legalAction: LegalAction,
    ) => CostQuote;
    creditCostForAction: (legalAction: LegalAction) => number;
    spendCredits: (side: Side, amount: number) => void;
  };
  corp: {
    isObligationDebtDefinition: (definitionId: CardDefinitionId) => boolean;
    spendCorpAgendaPointCost: (
      requiredPoints: number,
    ) => CorpAgendaPointCostResult;
    activeObligationCount: () => number;
  };
  runner: {
    ensureTurnFlags: () => NonNullable<GameState["runnerTurnFlags"]>;
  };
  counters: {
    setCardCounter: (
      cardId: CardInstanceId,
      counterType: string,
      amount: number,
    ) => void;
  };
  lifecycle: {
    executeOnRez: (
      legalAction: LegalAction,
      definition: CardDefinition,
      cardId: CardInstanceId,
    ) => void;
  };
  fort: {
    isFortTraceBitPoolSource: (cardId: CardInstanceId) => boolean;
    fortTraceBitPoolCapacityForCard: (cardId: CardInstanceId) => number;
  };
};

export function rezCard(
  host: RezCardHost,
  cardId: CardInstanceId,
  rootRez: boolean,
  legalAction?: LegalAction,
): void {
  const { state } = host;
  const definition = host.cards.definitionFor(cardId);
  let creditCost = host.payment.rezCostForCard(cardId);
  const variableIceState = variableIceStateForRezAction(
    host,
    cardId,
    definition,
    creditCost,
    legalAction,
  );
  if (variableIceState) {
    creditCost += variableIceState.additionalCostPaid;
  }
  const shouldUseCorpRezCostQuote =
    legalAction?.type === "rez_ice" &&
    !rootRez &&
    definition.type === "ice" &&
    !legalAction.payload?.variableRezKind;
  if (shouldUseCorpRezCostQuote && legalAction) {
    const iceId = cardId;
    const quote = host.payment.assertCorpRezCostQuoteValid(iceId, legalAction);
    creditCost = quote.finalCredits;
    const quotePayload = costQuotePublicPayload(quote);
    const sourceId =
      typeof quotePayload.discountedRezSourceCardId === "string"
        ? (quotePayload.discountedRezSourceCardId as CardInstanceId)
        : undefined;
    if (sourceId) {
      const run = host.run.mustRun();
      run.discountedRezUsedSourceIdsThisRun = [
        ...(run.discountedRezUsedSourceIdsThisRun ?? []),
        sourceId,
      ].sort();
      run.temporaryDiscountedRezzedIceIds = [
        ...new Set([...(run.temporaryDiscountedRezzedIceIds ?? []), iceId]),
      ].sort();
      quotePayload.serverId = run.attackedServerId;
    }
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ...quotePayload,
    };
  }
  if (host.corp.isObligationDebtDefinition(definition.id)) {
    if (!legalAction)
      throw new Error("ACME Savings and Loan braucht eine LegalAction.");
    const agendaCost = Number(legalAction?.payload?.agendaPointCost ?? 0);
    if (!Number.isInteger(agendaCost) || agendaCost !== 1)
      throw new Error("ACME Savings and Loan kostet genau 1 Agenda-Punkt.");
    const costResult = host.corp.spendCorpAgendaPointCost(agendaCost);
    legalAction.payload = {
      ...(legalAction?.payload ?? {}),
      agendaPointCost: agendaCost,
      agendaPointCostPaid: costResult.paidPoints,
      obligationDebtAbility: "rez_with_agenda_point_cost",
      obligationDebtCountBefore:
        host.corp.activeObligationCount(),
      ...(costResult.bonusPointsSpent > 0
        ? { corpBonusAgendaPointsSpent: costResult.bonusPointsSpent }
        : {}),
      ...(costResult.forfeitedAgendaDefinitionIds.length > 0
        ? {
            forfeitedAgendaDefinitionIds:
              costResult.forfeitedAgendaDefinitionIds.join(","),
            specialZone: "removed_from_game",
            specialZoneVisibility: "public",
            specialZoneReason: "obligation_debt_rez_cost",
          }
        : {}),
    };
  }
  const selfAgendaPointCost = selfRezAgendaPointCostForDefinition(definition);
  if (selfAgendaPointCost > 0) {
    if (!legalAction)
      throw new Error("Self-Rez-Agenda-Punkt-Kosten brauchen eine LegalAction.");
    const agendaCost = Number(legalAction.payload?.agendaPointCost ?? 0);
    if (!Number.isInteger(agendaCost) || agendaCost !== selfAgendaPointCost)
      throw new Error("Self-Rez-Agenda-Punkt-Kosten sind nicht mehr gueltig.");
    const costResult = host.corp.spendCorpAgendaPointCost(agendaCost);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      agendaPointCost: agendaCost,
      agendaPointCostPaid: costResult.paidPoints,
      selfRezAdditionalCostKind: "agenda_point",
      ...(costResult.bonusPointsSpent > 0
        ? { corpBonusAgendaPointsSpent: costResult.bonusPointsSpent }
        : {}),
      ...(costResult.forfeitedAgendaDefinitionIds.length > 0
        ? {
            forfeitedAgendaDefinitionIds:
              costResult.forfeitedAgendaDefinitionIds.join(","),
            specialZone: "removed_from_game",
            specialZoneVisibility: "public",
            specialZoneReason: "self_rez_agenda_point_cost",
          }
        : {}),
    };
  }
  host.payment.spendCredits("corp", creditCost);
  state.cardInstances[cardId] = {
    ...host.cards.mustInstance(cardId),
    rezzed: true,
    faceup: true,
    ...(variableIceState ? { variableIceState } : {}),
  };
  if (definition.type === "ice") {
    const flags = host.runner.ensureTurnFlags();
    flags.corpRezzedIceThisTurn =
      Math.max(0, Math.floor(flags.corpRezzedIceThisTurn ?? 0)) + 1;
    if (hasSubtype(definition, "black_ice")) {
      const instance = host.cards.mustInstance(cardId);
      if (instance.zone.side === "corp" && instance.zone.zone === "serverIce") {
        flags.lastRezzedBlackIceThisTurn = {
          cardId,
          definitionId: definition.id,
          serverId: instance.zone.serverId,
        };
      }
    }
  }
  if (
    state.run &&
    hasSubtype(definition, "black_ops")
  ) {
    state.run.rezzedBlackOpsCount =
      Math.max(0, Math.floor(state.run.rezzedBlackOpsCount ?? 0)) + 1;
  }
  const runRezReward = Math.max(
    0,
    Math.floor(state.run?.runnerCreditGainOnCorpRez ?? 0),
  );
  if (runRezReward > 0) {
    state.runner.credits += runRezReward;
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        runnerCreditGainOnCorpRez: runRezReward,
        gainedCredits: runRezReward,
        runnerCreditsAfter: state.runner.credits,
      };
    }
  }
  if (host.fort.isFortTraceBitPoolSource(cardId)) {
    const capacity = host.fort.fortTraceBitPoolCapacityForCard(cardId);
    host.counters.setCardCounter(cardId, "bit", capacity);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        sourceDefinitionId: definition.id,
        counterType: "bit",
        addedCounterAmount: capacity,
        remainingCounters: capacity,
      };
    }
  }
  if (legalAction) host.lifecycle.executeOnRez(legalAction, definition, cardId);
  if (rootRez) {
    host.run.handleRunRootRezPostRez(cardId, legalAction);
    return;
  }
  if (host.run.handlePostIceRezContinuation?.(cardId, legalAction))
    return;
  host.run.beginEncounter(cardId, legalAction);
}

function selfRezAdditionalCostsForDefinition(
  definition: CardDefinition,
): readonly CardSelfRezAdditionalCostImplementation[] {
  if (definition.type !== "ice") return [];
  return cardImplementationForDefinitionId(definition.id)
    ?.selfRezAdditionalCosts ?? [];
}

function selfRezAgendaPointCostForDefinition(definition: CardDefinition): number {
  return selfRezAdditionalCostsForDefinition(definition)
    .filter((cost) => cost.kind === "agenda_point" && cost.visibility === "public")
    .reduce((sum, cost) => sum + Math.max(0, Math.floor(cost.amount)), 0);
}

function normalizeSubtypeLabel(subtype: string): string {
  return subtype
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function hasSubtype(
  definition: { subtypes?: readonly string[] },
  subtype: string,
): boolean {
  const target = normalizeSubtypeLabel(subtype);
  return definition.subtypes?.some(
    (candidate) => normalizeSubtypeLabel(candidate) === target,
  ) ?? false;
}

function variableIceStateForRezAction(
  host: RezCardHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
  baseRezCost: number,
  legalAction?: LegalAction,
): CardInstance["variableIceState"] | undefined {
  const variableRez = host.cards.variableRezForDefinition(definition);
  if (!variableRez) return undefined;
  if (!legalAction)
    throw new Error("Variable ICE brauchen eine LegalAction.");
  if (legalAction.payload?.cardId !== cardId)
    throw new Error("Variable Rez-Zielkarte ist ungueltig.");
  const additionalCost = Number(legalAction.payload.variableRezAdditionalCost);
  const value = Number(legalAction.payload.variableRezValue);
  const rezCostPaid = Number(legalAction.payload.rezCostPaid);
  const actionCreditCost = host.payment.creditCostForAction(legalAction);
  if (
    !Number.isInteger(additionalCost) ||
    additionalCost < 0 ||
    !Number.isInteger(value) ||
    value < 0 ||
    rezCostPaid !== baseRezCost + additionalCost ||
    actionCreditCost !== rezCostPaid ||
    host.state.corp.credits < rezCostPaid
  )
    throw new Error("Variable Rez-Kosten sind nicht mehr gueltig.");
  if (variableRez.kind === "x_strength") {
    if (
      legalAction.payload.variableRezKind !== variableRez.kind ||
      additionalCost !== value * variableRez.additionalCostPerValue ||
      value < variableRez.minValue ||
      value > variableRez.maxValue ||
      legalAction.payload.variableRezCap !== variableRez.maxValue ||
      legalAction.payload.effectiveStrengthAfterRez !== value ||
      (variableRez.traceBaseFromValue &&
        legalAction.payload.effectiveTraceBaseAfterRez !== value) ||
      (variableRez.traceBidLimitFromValue &&
        legalAction.payload.effectiveTraceBidLimitAfterRez !== value)
    )
      throw new Error("Variable X-Staerke ist nicht legal.");
    return {
      family: "x_strength",
      additionalCostPaid: additionalCost,
      value,
      cap: variableRez.maxValue,
      strength: value,
      ...(variableRez.traceBidLimitFromValue ? { traceBidLimit: value } : {}),
    };
  }
  if (variableRez.kind === "alternate_subtype") {
    const selectedSubtypesRaw = String(
      legalAction.payload.selectedSubtypesAfterRez ?? "",
    );
    const expectedBaseSubtypes = host.cards.stableSubtypeList(
      variableRez.baseSubtypes,
    );
    const expectedAlternateSubtypes = host.cards.stableSubtypeList(
      variableRez.alternateSubtypes,
    );
    const selectedSubtypes = host.cards.stableSubtypeList(
      selectedSubtypesRaw ? selectedSubtypesRaw.split(",") : [],
    );
    const isBaseChoice =
      value === 0 &&
      additionalCost === 0 &&
      selectedSubtypes.join(",") === expectedBaseSubtypes.join(",");
    const isAlternateChoice =
      value === 1 &&
      additionalCost === variableRez.additionalCost &&
      selectedSubtypes.join(",") === expectedAlternateSubtypes.join(",");
    if (
      legalAction.payload.variableRezKind !== variableRez.kind ||
      (!isBaseChoice && !isAlternateChoice)
    )
      throw new Error("Variable Subtyp-Auswahl ist nicht legal.");
    return {
      family: "alternate_subtype",
      additionalCostPaid: additionalCost,
      value,
      selectedSubtypes,
    };
  }
  if (
    legalAction.payload.variableRezKind !== variableRez.kind ||
    additionalCost % variableRez.additionalCostPerSubroutine !== 0 ||
    value !== additionalCost / variableRez.additionalCostPerSubroutine ||
    value < variableRez.minSubroutines ||
    legalAction.payload.effectiveSubroutineCountAfterRez !== value
  )
    throw new Error("Variable ETR-Zusatzkosten sind nicht legal.");
  return {
    family: "paid_end_the_run_subroutines",
    additionalCostPaid: additionalCost,
    value,
    subroutineCount: value,
  };
}
