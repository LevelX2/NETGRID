import type {
  AiDecisionInput,
  VisibleCard,
  VisibleCorpRezCostQuote,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  assessCorpScoreProtection,
  compareExactProbabilities,
  type KnownCorpScoreProtectionAssessment,
} from "./corp-score-protection-assessment";

export type CorpExactIceRezRouteProjection = Readonly<{
  actionId: string;
  sourceCardInstanceId: string;
  sourceDefinitionId: string;
  targetServerId: string;
  quote: Extract<VisibleCorpRezCostQuote, { complete: true }>;
  before: KnownCorpScoreProtectionAssessment;
  after: KnownCorpScoreProtectionAssessment;
  effect: "progress" | "satisfied";
  totalRezCredits: number;
}>;

export type CorpExactInstalledIceRezQuoteRead = Readonly<{
  quote: Extract<VisibleCorpRezCostQuote, { complete: true }>;
  totalRezCredits: number;
}>;

export function readExactCurrentInstalledCorpIceRezQuote(params: {
  input: AiDecisionInput;
  sourceCard: VisibleCard;
  targetServerId: string;
}): CorpExactInstalledIceRezQuoteRead | undefined {
  const { input, sourceCard, targetServerId } = params;
  if (
    sourceCard.known !== true ||
    sourceCard.type !== "ice" ||
    !sourceCard.definitionId ||
    sourceCard.rezzed !== false
  ) {
    return undefined;
  }
  const server = input.playerView.servers.find(
    (candidateServer) => candidateServer.id === targetServerId,
  );
  if (
    !server ||
    !server.ice.some((ice) => ice.instanceId === sourceCard.instanceId)
  ) {
    return undefined;
  }
  const quote = sourceCard.effectiveRezCostQuote;
  if (
    quote?.context !== "installed" ||
    quote.complete !== true ||
    quote.cardId !== sourceCard.instanceId ||
    quote.targetServerId !== targetServerId ||
    quote.projectedServerId !== targetServerId ||
    quote.expiresAtStateVersion !== input.playerView.stateVersion ||
    !nonNegativeSafeInteger(quote.baseCredits) ||
    !nonNegativeSafeInteger(quote.finalCredits) ||
    !nonNegativeSafeInteger(quote.mandatoryAdditionalCosts?.agendaPoints) ||
    !validDefinitionIdList(quote.reductionSourceDefinitionIds) ||
    !validDefinitionIdList(quote.increaseSourceDefinitionIds) ||
    !definitionIdListsDisjoint(
      quote.reductionSourceDefinitionIds,
      quote.increaseSourceDefinitionIds,
    ) ||
    (quote.reductionSourceDefinitionIds === undefined &&
      quote.increaseSourceDefinitionIds === undefined &&
      quote.finalCredits !== quote.baseCredits)
  ) {
    return undefined;
  }
  return {
    quote,
    totalRezCredits: quote.finalCredits,
  };
}

export function projectExactCorpIceRezRoute(params: {
  input: AiDecisionInput;
  candidate: ActionSemanticCandidate;
  sourceCard: VisibleCard;
  targetServerId: string;
}): CorpExactIceRezRouteProjection | undefined {
  const { input, candidate, sourceCard, targetServerId } = params;
  const quoteRead = readExactInstalledCorpIceRezQuote(params);
  if (!quoteRead) return undefined;
  const { quote, totalRezCredits } = quoteRead;
  const server = input.playerView.servers.find(
    (candidateServer) => candidateServer.id === targetServerId,
  )!;
  const serverIce = server.ice.map((ice) => ({
    instanceId: ice.instanceId,
    known: ice.known,
    ...(ice.definitionId ? { definitionId: ice.definitionId } : {}),
    ...(ice.rezzed !== undefined ? { rezzed: ice.rezzed } : {}),
    ...(ice.strength !== undefined ? { strength: ice.strength } : {}),
    ...(ice.subtypes ? { subtypes: ice.subtypes } : {}),
    ...(ice.effectiveRunQuote
      ? { effectiveRunQuote: ice.effectiveRunQuote }
      : {}),
  }));
  const assessmentInput = {
    runnerRig: input.playerView.opponent.rig ?? [],
    runnerCredits: input.playerView.opponent.credits,
    maximumRunnerAccessSuccessProbability: {
      numerator: 1,
      denominator: 2,
    },
  };
  const before = assessCorpScoreProtection({
    ...assessmentInput,
    serverIce,
  });
  const after = assessCorpScoreProtection({
    ...assessmentInput,
    serverIce: serverIce.map((ice) =>
      ice.instanceId === sourceCard.instanceId
        ? { ...ice, rezzed: true }
        : ice,
    ),
  });
  if (before.knowledge !== "known" || after.knowledge !== "known") {
    return undefined;
  }
  if (
    compareExactProbabilities(
      after.runnerAccessSuccessProbability,
      before.runnerAccessSuccessProbability,
    ) !== -1
  ) {
    return undefined;
  }
  return {
    actionId: candidate.actionId,
    sourceCardInstanceId: sourceCard.instanceId,
    sourceDefinitionId: sourceCard.definitionId!,
    targetServerId,
    quote,
    before,
    after,
    effect: after.protectsScore ? "satisfied" : "progress",
    totalRezCredits,
  };
}

export function readExactInstalledCorpIceRezQuote(params: {
  input: AiDecisionInput;
  candidate: ActionSemanticCandidate;
  sourceCard: VisibleCard;
  targetServerId: string;
}): CorpExactInstalledIceRezQuoteRead | undefined {
  const { input, candidate, sourceCard, targetServerId } = params;
  if (
    sourceCard.known !== true ||
    sourceCard.type !== "ice" ||
    !sourceCard.definitionId ||
    sourceCard.rezzed !== false ||
    candidate.semanticActionType !== "corp_window.rez" ||
    candidate.sourceCardInstanceId !== sourceCard.instanceId ||
    candidate.sourceDefinitionId !== sourceCard.definitionId
  ) {
    return undefined;
  }
  const quoteRead = readExactCurrentInstalledCorpIceRezQuote({
    input,
    sourceCard,
    targetServerId,
  });
  if (!quoteRead) return undefined;
  const action = input.legalActions.find(
    (candidateAction) => candidateAction.actionId === candidate.actionId,
  );
  if (
    !action ||
    action.side !== "corp" ||
    action.type !== "rez_ice" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.source !== sourceCard.instanceId ||
    action.payload?.cardId !== sourceCard.instanceId ||
    (action.payload.serverId !== undefined &&
      action.payload.serverId !== targetServerId) ||
    action.targetRequirements.length !== 0 ||
    (action.choiceRequirements?.length ?? 0) !== 0
  ) {
    return undefined;
  }
  const { quote } = quoteRead;
  const mandatoryAgendaPoints =
    quote.mandatoryAdditionalCosts.agendaPoints;
  const actionAgendaPoints = action.payload?.agendaPointCost ?? 0;
  if (
    !nonNegativeSafeInteger(actionAgendaPoints) ||
    actionAgendaPoints !== mandatoryAgendaPoints ||
    (mandatoryAgendaPoints > 0
      ? action.payload?.selfRezAdditionalCostKind !== "agenda_point"
      : action.payload?.selfRezAdditionalCostKind !== undefined) ||
    input.playerView.own.agendaPoints < mandatoryAgendaPoints
  ) {
    return undefined;
  }
  let actionCredits = 0;
  for (const cost of action.costs) {
    const credits = cost.credits ?? 0;
    const clicks = cost.clicks ?? 0;
    if (
      !nonNegativeSafeInteger(credits) ||
      !nonNegativeSafeInteger(clicks) ||
      clicks !== 0
    ) {
      return undefined;
    }
    actionCredits += credits;
    if (!Number.isSafeInteger(actionCredits)) return undefined;
  }
  if (
    actionCredits !== quote.finalCredits ||
    actionCredits > input.playerView.own.credits
  ) {
    return undefined;
  }
  return {
    quote,
    totalRezCredits: quote.finalCredits,
  };
}

export function exactCorpIceRezRoutesEqual(
  left: CorpExactIceRezRouteProjection,
  right: CorpExactIceRezRouteProjection,
): boolean {
  return (
    left.actionId === right.actionId &&
    left.sourceCardInstanceId === right.sourceCardInstanceId &&
    left.sourceDefinitionId === right.sourceDefinitionId &&
    left.targetServerId === right.targetServerId &&
    left.effect === right.effect &&
    left.totalRezCredits === right.totalRezCredits &&
    compareExactProbabilities(
      left.before.runnerAccessSuccessProbability,
      right.before.runnerAccessSuccessProbability,
    ) === 0 &&
    compareExactProbabilities(
      left.after.runnerAccessSuccessProbability,
      right.after.runnerAccessSuccessProbability,
    ) === 0 &&
    left.quote.context === right.quote.context &&
    left.quote.complete === right.quote.complete &&
    left.quote.cardId === right.quote.cardId &&
    left.quote.targetServerId === right.quote.targetServerId &&
    left.quote.projectedServerId === right.quote.projectedServerId &&
    left.quote.expiresAtStateVersion === right.quote.expiresAtStateVersion &&
    left.quote.baseCredits === right.quote.baseCredits &&
    left.quote.finalCredits === right.quote.finalCredits &&
    left.quote.mandatoryAdditionalCosts.agendaPoints ===
      right.quote.mandatoryAdditionalCosts.agendaPoints &&
    definitionIdListsEqual(
      left.quote.reductionSourceDefinitionIds,
      right.quote.reductionSourceDefinitionIds,
    ) &&
    definitionIdListsEqual(
      left.quote.increaseSourceDefinitionIds,
      right.quote.increaseSourceDefinitionIds,
    )
  );
}

function nonNegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function validDefinitionIdList(
  values: readonly string[] | undefined,
): boolean {
  return (
    values === undefined ||
    (Array.isArray(values) &&
      values.every(
        (value, index) =>
          typeof value === "string" &&
          value.length > 0 &&
          (index === 0 || values[index - 1]! < value),
      ))
  );
}

function definitionIdListsDisjoint(
  reductionIds: readonly string[] | undefined,
  increaseIds: readonly string[] | undefined,
): boolean {
  if (!reductionIds || !increaseIds) return true;
  const reductions = new Set(reductionIds);
  return increaseIds.every((id) => !reductions.has(id));
}

function definitionIdListsEqual(
  left: readonly string[] | undefined,
  right: readonly string[] | undefined,
): boolean {
  return (
    (left === undefined && right === undefined) ||
    (left !== undefined &&
      right !== undefined &&
      left.length === right.length &&
      left.every((value, index) => value === right[index]))
  );
}
