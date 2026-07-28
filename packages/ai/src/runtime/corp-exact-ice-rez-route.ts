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
import { visibleCorpIceDefenseProfile } from "./semantic-runtime-corp-effective-defense";

export type CorpExactIceRezRouteProjection = Readonly<{
  actionId: string;
  sourceCardInstanceId: string;
  sourceDefinitionId: string;
  targetServerId: string;
  quote: Extract<VisibleCorpRezCostQuote, { complete: true }>;
  before: KnownCorpScoreProtectionAssessment;
  after: KnownCorpScoreProtectionAssessment;
  routeKind:
    | "access_reduction"
    | "exact_resource_exchange"
    | "free_persistent_defense"
    | "qualitative_encounter_defense";
  resourceExchange?: Readonly<{
    runnerRequiredCredits: number;
    runnerPumpCredits: number;
    runnerBreakCredits: number;
    runnerBreakUses: number;
    runnerNormalCreditsRequired: number;
    runnerNonNormalRunCreditsApplied: number;
    runnerBreakerInstanceId: string;
    runnerBreakerDefinitionId: string;
    runnerConsumedCardInstanceIds: readonly string[];
  }>;
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
      ice.instanceId === sourceCard.instanceId ? { ...ice, rezzed: true } : ice,
    ),
  });
  if (before.knowledge !== "known" || after.knowledge !== "known") {
    return undefined;
  }
  const probabilityComparison = compareExactProbabilities(
    after.runnerAccessSuccessProbability,
    before.runnerAccessSuccessProbability,
  );
  if (probabilityComparison === undefined) return undefined;
  const resourceExchange =
    probabilityComparison === 0
      ? readExactCurrentRunResourceExchange({
          input,
          sourceCard,
          targetServerId,
          after,
          totalRezCredits,
        })
      : undefined;
  const freePersistentDefense =
    probabilityComparison === 0 &&
    !resourceExchange &&
    isFreePersistentDefenseOnWorthwhileCurrentServer({
      input,
      candidate,
      sourceCard,
      targetServerId,
      totalRezCredits,
    });
  const qualitativeEncounterDefense =
    probabilityComparison === 0 &&
    !resourceExchange &&
    !freePersistentDefense &&
    isQualitativeEncounterDefenseOnCurrentRun({
      input,
      sourceCard,
      targetServerId,
    });
  if (
    probabilityComparison !== -1 &&
    !resourceExchange &&
    !freePersistentDefense &&
    !qualitativeEncounterDefense
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
    routeKind: resourceExchange
      ? "exact_resource_exchange"
      : freePersistentDefense
        ? "free_persistent_defense"
        : qualitativeEncounterDefense
          ? "qualitative_encounter_defense"
          : "access_reduction",
    ...(resourceExchange ? { resourceExchange } : {}),
    effect: after.protectsScore ? "satisfied" : "progress",
    totalRezCredits,
  };
}

function isQualitativeEncounterDefenseOnCurrentRun(params: {
  input: AiDecisionInput;
  sourceCard: VisibleCard;
  targetServerId: string;
}): boolean {
  const { input, sourceCard, targetServerId } = params;
  if (input.playerView.run?.attackedServerId !== targetServerId) return false;

  const profile = visibleCorpIceDefenseProfile(sourceCard);
  return profile.hasMeaningfulTaxOrDamage || profile.hasEncounterDisruption;
}

function isFreePersistentDefenseOnWorthwhileCurrentServer(params: {
  input: AiDecisionInput;
  candidate: ActionSemanticCandidate;
  sourceCard: VisibleCard;
  targetServerId: string;
  totalRezCredits: number;
}): boolean {
  const { input, candidate, sourceCard, targetServerId, totalRezCredits } =
    params;
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  const resourceExchangeQuote = sourceCard.effectiveRezResourceExchangeQuote;
  if (
    totalRezCredits !== 0 ||
    action?.payload?.temporaryDerezAfterRun === true ||
    input.playerView.run?.attackedServerId !== targetServerId ||
    // A complete Engine exchange quote is issued only for a direct current
    // end-the-run path; do not reconstruct that fact from card text here.
    resourceExchangeQuote?.complete !== true
  ) {
    return false;
  }
  const runnerBreak = resourceExchangeQuote.runnerBreak;
  if (
    runnerBreak.requiredCredits !== 0 ||
    runnerBreak.canPayFromCurrentCredits !== true
  ) {
    return false;
  }
  if (targetServerId === "hq" || targetServerId === "rd") return true;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  return (
    server?.root.some((card) => card.known && card.type === "agenda") === true
  );
}

function readExactCurrentRunResourceExchange(params: {
  input: AiDecisionInput;
  sourceCard: VisibleCard;
  targetServerId: string;
  after: KnownCorpScoreProtectionAssessment;
  totalRezCredits: number;
}):
  | NonNullable<CorpExactIceRezRouteProjection["resourceExchange"]>
  | undefined {
  const { input, sourceCard, targetServerId, after, totalRezCredits } = params;
  const quote = sourceCard.effectiveRezResourceExchangeQuote;
  if (
    quote?.context !== "installed" ||
    quote.complete !== true ||
    quote.cardId !== sourceCard.instanceId ||
    quote.targetServerId !== targetServerId ||
    quote.projectedServerId !== targetServerId ||
    quote.expiresAtStateVersion !== input.playerView.stateVersion ||
    !nonNegativeSafeInteger(quote.runnerBreak.requiredCredits) ||
    !nonNegativeSafeInteger(quote.runnerBreak.pumpCredits) ||
    !nonNegativeSafeInteger(quote.runnerBreak.breakCredits) ||
    quote.runnerBreak.requiredCredits !==
      quote.runnerBreak.pumpCredits + quote.runnerBreak.breakCredits ||
    !nonNegativeSafeInteger(quote.runnerBreak.breakUses) ||
    quote.runnerBreak.breakUses <= 0 ||
    !nonNegativeSafeInteger(quote.runnerBreak.normalCreditsRequired) ||
    !nonNegativeSafeInteger(quote.runnerBreak.nonNormalRunCreditsApplied) ||
    quote.runnerBreak.requiredCredits !==
      quote.runnerBreak.normalCreditsRequired +
        quote.runnerBreak.nonNormalRunCreditsApplied ||
    quote.runnerBreak.canPayFromCurrentCredits !== true ||
    quote.runnerBreak.paymentEvidenceSource !== "engine_icebreaker_ability" ||
    !nonNegativeSafeInteger(input.playerView.opponent.credits) ||
    after.runnerCreditsRemainingOnBestAccessPath !==
      input.playerView.opponent.credits -
        quote.runnerBreak.normalCreditsRequired ||
    (quote.runnerBreak.requiredCredits <= totalRezCredits &&
      quote.runnerBreak.consumedCards.length === 0)
  ) {
    return undefined;
  }
  const consumedCardInstanceIds: string[] = [];
  for (const consumed of quote.runnerBreak.consumedCards) {
    if (
      consumed.kind !== "trash_at_run_end_after_break" ||
      consumed.evidenceSource !== "engine_icebreaker_ability" ||
      consumed.cardId !== quote.runnerBreak.breakerCardId ||
      consumed.definitionId !== quote.runnerBreak.breakerDefinitionId ||
      !nonBlankString(consumed.cardId) ||
      !nonBlankString(consumed.definitionId)
    ) {
      return undefined;
    }
    consumedCardInstanceIds.push(consumed.cardId);
  }
  return {
    runnerRequiredCredits: quote.runnerBreak.requiredCredits,
    runnerPumpCredits: quote.runnerBreak.pumpCredits,
    runnerBreakCredits: quote.runnerBreak.breakCredits,
    runnerBreakUses: quote.runnerBreak.breakUses,
    runnerNormalCreditsRequired: quote.runnerBreak.normalCreditsRequired,
    runnerNonNormalRunCreditsApplied:
      quote.runnerBreak.nonNormalRunCreditsApplied,
    runnerBreakerInstanceId: quote.runnerBreak.breakerCardId,
    runnerBreakerDefinitionId: quote.runnerBreak.breakerDefinitionId,
    runnerConsumedCardInstanceIds: consumedCardInstanceIds,
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
  const mandatoryAgendaPoints = quote.mandatoryAdditionalCosts.agendaPoints;
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
  const actionCertifiedQuote =
    action.payload?.discountedRezSourceCardId === undefined
      ? ordinaryRezActionQuote(action.payload, quote)
      : discountedRezActionQuote(action.payload, quote, actionCredits);
  if (
    !actionCertifiedQuote ||
    actionCredits !== actionCertifiedQuote.finalCredits ||
    actionCredits > input.playerView.own.credits
  ) {
    return undefined;
  }
  return {
    quote: actionCertifiedQuote,
    totalRezCredits: actionCertifiedQuote.finalCredits,
  };
}

function ordinaryRezActionQuote(
  payload: AiDecisionInput["legalActions"][number]["payload"],
  quote: Extract<VisibleCorpRezCostQuote, { complete: true }>,
): Extract<VisibleCorpRezCostQuote, { complete: true }> | undefined {
  if (
    payload?.discountedRezSourceDefinitionId !== undefined ||
    payload?.discountedRezCostBase !== undefined ||
    payload?.temporaryDerezAfterRun !== undefined
  ) {
    return undefined;
  }
  return quote;
}

/**
 * Olivia-style rez actions are already exact, Engine-generated LegalActions.
 * Validate their public quote receipt against the ordinary installed quote and
 * project that receipt; never reconstruct the discount from printed rezCost.
 */
function discountedRezActionQuote(
  payload: AiDecisionInput["legalActions"][number]["payload"],
  ordinaryQuote: Extract<VisibleCorpRezCostQuote, { complete: true }>,
  actionCredits: number,
): Extract<VisibleCorpRezCostQuote, { complete: true }> | undefined {
  if (
    ordinaryQuote.costKind !== "fixed" ||
    !payload ||
    !nonBlankString(payload.discountedRezSourceCardId) ||
    !nonBlankString(payload.discountedRezSourceDefinitionId) ||
    payload.temporaryDerezAfterRun !== true ||
    payload.serverId !== ordinaryQuote.targetServerId ||
    !nonNegativeSafeInteger(payload.discountedRezCostBase) ||
    !nonNegativeSafeInteger(payload.rezCostPaid) ||
    payload.rezCostPaid !== actionCredits ||
    !nonNegativeSafeInteger(payload.rezCostReductionAmount) ||
    payload.rezCostReductionAmount > ordinaryQuote.baseCredits
  ) {
    return undefined;
  }
  const surchargeAmount = payload.corpRezCostSurchargeAmount ?? 0;
  if (
    !nonNegativeSafeInteger(surchargeAmount) ||
    ordinaryQuote.finalCredits < surchargeAmount ||
    payload.discountedRezCostBase !==
      ordinaryQuote.finalCredits - surchargeAmount ||
    ordinaryQuote.baseCredits -
      payload.rezCostReductionAmount +
      surchargeAmount !==
      actionCredits
  ) {
    return undefined;
  }
  const reductionSourceDefinitionIds = commaSeparatedDefinitionIds(
    payload.rezCostReductionSourceDefinitionIds,
  );
  if (
    !reductionSourceDefinitionIds ||
    !reductionSourceDefinitionIds.includes(
      payload.discountedRezSourceDefinitionId,
    ) ||
    !(ordinaryQuote.reductionSourceDefinitionIds ?? []).every((definitionId) =>
      reductionSourceDefinitionIds.includes(definitionId),
    )
  ) {
    return undefined;
  }
  const increaseSourceDefinitionIds = ordinaryQuote.increaseSourceDefinitionIds;
  if (surchargeAmount > 0) {
    if (
      !nonBlankString(payload.corpRezCostSurchargeSourceDefinitionId) ||
      !increaseSourceDefinitionIds?.includes(
        payload.corpRezCostSurchargeSourceDefinitionId,
      )
    ) {
      return undefined;
    }
  } else if (payload.corpRezCostSurchargeSourceDefinitionId !== undefined) {
    return undefined;
  }
  const sortedReductionSourceDefinitionIds = [
    ...reductionSourceDefinitionIds,
  ].sort();
  if (
    !definitionIdListsDisjoint(
      sortedReductionSourceDefinitionIds,
      increaseSourceDefinitionIds,
    )
  ) {
    return undefined;
  }
  return {
    ...ordinaryQuote,
    finalCredits: actionCredits,
    reductionSourceDefinitionIds: sortedReductionSourceDefinitionIds,
  };
}

function commaSeparatedDefinitionIds(value: unknown): string[] | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  const values = value.split(",");
  return values.every(nonBlankString) && new Set(values).size === values.length
    ? values
    : undefined;
}

function nonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
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
    left.routeKind === right.routeKind &&
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
    exactResourceExchangesEqual(
      left.resourceExchange,
      right.resourceExchange,
    ) &&
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

function exactResourceExchangesEqual(
  left: CorpExactIceRezRouteProjection["resourceExchange"],
  right: CorpExactIceRezRouteProjection["resourceExchange"],
): boolean {
  if (left === undefined || right === undefined) return left === right;
  return (
    left.runnerRequiredCredits === right.runnerRequiredCredits &&
    left.runnerPumpCredits === right.runnerPumpCredits &&
    left.runnerBreakCredits === right.runnerBreakCredits &&
    left.runnerBreakUses === right.runnerBreakUses &&
    left.runnerBreakerInstanceId === right.runnerBreakerInstanceId &&
    left.runnerBreakerDefinitionId === right.runnerBreakerDefinitionId &&
    left.runnerConsumedCardInstanceIds.length ===
      right.runnerConsumedCardInstanceIds.length &&
    left.runnerConsumedCardInstanceIds.every(
      (value, index) => value === right.runnerConsumedCardInstanceIds[index],
    )
  );
}

function nonNegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function validDefinitionIdList(values: readonly string[] | undefined): boolean {
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
