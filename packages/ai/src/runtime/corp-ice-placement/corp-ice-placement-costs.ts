import { parseOptionalCardDefinitionIdCsv } from "../../card-definition-id-input";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { actionMatchesCurrentDecision } from "../../actions/current-legal-action";
import { visibleSourceCardForCorpIcePlacement } from "./corp-ice-placement";

export type CorpIceCostFact =
  | {
      status: "known";
      amount: number;
      source:
        | "legal_action"
        | "candidate_projection"
        | "engine_post_install_rez_quote";
    }
  | {
      status: "unknown";
      reason:
        | "missing"
        | "incomplete"
        | "variable"
        | "non_finite"
        | "negative"
        | "non_integer"
        | "projection_drift"
        | "binding_drift"
        | "malformed"
        | "unsupported_mandatory_cost";
      source:
        | "legal_action"
        | "candidate_projection"
        | "engine_post_install_rez_quote";
    };

function corpIcePlacementServerId(action: LegalAction): string | undefined {
  const value =
    action.payload?.serverId ??
    action.payload?.targetServerId ??
    action.payload?.attackedServerId;
  return typeof value === "string" ? value : undefined;
}

export function corpIcePlacementActionCreditCostFact(
  action: LegalAction,
): CorpIceCostFact {
  if (
    action.payload?.variableCostKind !== undefined ||
    action.payload?.variableInstallCost === true ||
    action.payload?.xValue !== undefined
  ) {
    return {
      status: "unknown",
      reason: "variable",
      source: "legal_action",
    };
  }
  if (!Array.isArray(action.costs)) {
    return {
      status: "unknown",
      reason: "missing",
      source: "legal_action",
    };
  }
  let amount = 0;
  for (const cost of action.costs) {
    if (cost.credits === undefined) continue;
    const fact = finiteNonNegativeIntegerCostFact(cost.credits, "legal_action");
    if (fact.status === "unknown") return fact;
    amount += fact.amount;
    if (!Number.isSafeInteger(amount)) {
      return {
        status: "unknown",
        reason: Number.isFinite(amount) ? "non_integer" : "non_finite",
        source: "legal_action",
      };
    }
  }
  return { status: "known", amount, source: "legal_action" };
}

export function corpIcePlacementActionCostAgreementFact(
  action: LegalAction,
  projectedActionCreditCost?: number | undefined,
): CorpIceCostFact {
  const legalActionFact = corpIcePlacementActionCreditCostFact(action);
  if (
    legalActionFact.status === "unknown" ||
    projectedActionCreditCost === undefined
  ) {
    return legalActionFact;
  }
  const projectedFact = finiteNonNegativeIntegerCostFact(
    projectedActionCreditCost,
    "candidate_projection",
  );
  if (projectedFact.status === "unknown") return projectedFact;
  if (projectedFact.amount !== legalActionFact.amount) {
    return {
      status: "unknown",
      reason: "projection_drift",
      source: "candidate_projection",
    };
  }
  return projectedFact;
}

export function corpIcePlacementPostInstallRezCostFact(
  input: AiDecisionInput,
  action: LegalAction,
): CorpIceCostFact {
  const source = "engine_post_install_rez_quote" as const;
  const canonicalActions = input.legalActions.filter(
    (candidate) => candidate.actionId === action.actionId,
  );
  if (canonicalActions.length !== 1 || canonicalActions[0] !== action) {
    return { status: "unknown", reason: "binding_drift", source };
  }
  const canonicalAction = canonicalActions[0]!;
  if (
    input.side !== "corp" ||
    canonicalAction.side !== "corp" ||
    canonicalAction.type !== "install_card" ||
    canonicalAction.payload?.placement !== "ice"
  ) {
    return { status: "unknown", reason: "binding_drift", source };
  }
  const sourceCard = visibleSourceCardForCorpIcePlacement(
    input,
    canonicalAction,
  );
  const targetServerId = corpIcePlacementServerId(canonicalAction);
  const payload = canonicalAction.payload;
  if (
    !sourceCard ||
    sourceCard.known !== true ||
    sourceCard.type !== "ice" ||
    sourceCard.owner !== "corp" ||
    sourceCard.controller !== "corp" ||
    canonicalAction.source !== sourceCard.instanceId ||
    payload.cardId !== sourceCard.instanceId ||
    (payload.sourceDefinitionId !== undefined &&
      payload.sourceDefinitionId !== sourceCard.definitionId) ||
    !targetServerId ||
    !actionMatchesCurrentDecision(input, canonicalAction) ||
    payload.postInstallRezQuoteCardId !== sourceCard.instanceId ||
    payload.postInstallRezQuoteTargetServerId !== targetServerId ||
    payload.postInstallRezQuoteExpiresAtStateVersion !==
      input.playerView.stateVersion
  ) {
    return { status: "unknown", reason: "binding_drift", source };
  }
  if (payload.postInstallRezQuoteComplete !== true) {
    return {
      status: "unknown",
      reason:
        payload.postInstallRezQuoteComplete === false
          ? "incomplete"
          : "missing",
      source,
    };
  }
  const projectedServerId = payload.postInstallRezQuoteProjectedServerId;
  if (
    targetServerId === "new_remote" &&
    input.playerView.servers.some(({ id }) => id === projectedServerId)
  ) {
    return { status: "unknown", reason: "binding_drift", source };
  }
  const baseCredits = payload.postInstallRezQuoteBaseCredits;
  const finalCredits = payload.postInstallRezQuoteFinalCredits;
  const mandatoryAgendaPointCost =
    payload.postInstallRezQuoteMandatoryAgendaPointCost;
  const mandatoryKind = payload.postInstallRezQuoteMandatoryAdditionalCostKind;
  const reductionIds = parseOptionalCardDefinitionIdCsv(
    payload.postInstallRezQuoteReductionSourceDefinitionIds,
  );
  const increaseIds = parseOptionalCardDefinitionIdCsv(
    payload.postInstallRezQuoteIncreaseSourceDefinitionIds,
  );
  if (
    !validTargetProjectedServerBinding(targetServerId, projectedServerId) ||
    !nonNegativeSafeInteger(baseCredits) ||
    !nonNegativeSafeInteger(finalCredits) ||
    !nonNegativeSafeInteger(mandatoryAgendaPointCost) ||
    reductionIds === undefined ||
    increaseIds === undefined ||
    !definitionIdListsDisjoint(reductionIds, increaseIds) ||
    (reductionIds.length === 0 &&
      increaseIds.length === 0 &&
      finalCredits !== baseCredits) ||
    (mandatoryAgendaPointCost > 0
      ? mandatoryKind !== "agenda_point"
      : mandatoryKind !== undefined)
  ) {
    return { status: "unknown", reason: "malformed", source };
  }
  if (mandatoryAgendaPointCost > 0) {
    return {
      status: "unknown",
      reason: "unsupported_mandatory_cost",
      source,
    };
  }
  return { status: "known", amount: finalCredits, source };
}

function finiteNonNegativeIntegerCostFact(
  value: number | undefined,
  source: CorpIceCostFact["source"],
): CorpIceCostFact {
  if (value === undefined) {
    return { status: "unknown", reason: "missing", source };
  }
  if (!Number.isFinite(value)) {
    return { status: "unknown", reason: "non_finite", source };
  }
  if (value < 0) {
    return { status: "unknown", reason: "negative", source };
  }
  if (!Number.isSafeInteger(value)) {
    return { status: "unknown", reason: "non_integer", source };
  }
  return { status: "known", amount: value, source };
}

function nonNegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function validTargetProjectedServerBinding(
  targetServerId: string,
  projectedServerId: unknown,
): projectedServerId is string {
  if (targetServerId === "new_remote") {
    return (
      typeof projectedServerId === "string" &&
      /^r[1-9]\d*$/.test(projectedServerId)
    );
  }
  return projectedServerId === targetServerId;
}

function definitionIdListsDisjoint(
  reductionIds: readonly number[],
  increaseIds: readonly number[],
): boolean {
  if (reductionIds.length === 0 || increaseIds.length === 0) return true;
  const reductions = new Set(reductionIds);
  return increaseIds.every((id) => !reductions.has(id));
}
