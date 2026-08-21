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
import { readKnownCorpCentralAgendaThreat } from "./corp-central-defense-facts-adapter";
import { visibleCorpIceDefenseProfile } from "./semantic-runtime-corp-effective-defense";

export type CorpExactIceRezRouteProjection = Readonly<{
  actionId: string;
  sourceCardInstanceId: string;
  sourceDefinitionId: string;
  targetServerId: string;
  quote: Extract<VisibleCorpRezCostQuote, { complete: true }>;
  before?: KnownCorpScoreProtectionAssessment;
  after?: KnownCorpScoreProtectionAssessment;
  routeKind:
    | "access_reduction"
    | "exact_resource_exchange"
    | "known_access_path_tax"
    | "free_persistent_defense"
    | "qualitative_encounter_defense";
  marginalDefenseThreat?: "visible_agenda_remote" | "terminal_central_access";
  freeCurrentEncounterDefense?: Readonly<{
    effect: "meaningful_tax_or_damage_or_disruption";
    evidenceSource: "visible_corp_ice_defense_profile";
  }>;
  knownAccessPathTax?: number;
  accessBlock?: Readonly<{
    hardEndTheRunSubroutineCount: number;
    reason: "no_visible_eligible_breaker" | "visible_break_route_unaffordable";
  }>;
  resourceExchange?: Readonly<{
    runnerRequiredCredits: number;
    runnerPumpCredits: number;
    runnerBreakCredits: number;
    runnerBreakUses: number;
    runnerNormalCreditsRequired: number;
    runnerNonNormalRunCreditsApplied: number;
    runnerNormalCreditsLostOnAccessPath: number;
    runnerBreakerInstanceId: string;
    runnerBreakerDefinitionId: string;
    runnerConsumedCardInstanceIds: readonly string[];
    layeredCentralPathTax?: true;
    otherRezzedIceCount?: number;
    runnerRandomConsequences?: readonly Readonly<{
      cardId: string;
      definitionId: string;
      kind: "post_encounter_self_trash_check";
      numerator: number;
      denominator: number;
    }>[];
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
  const knownBefore = before.knowledge === "known" ? before : undefined;
  const knownAfter = after.knowledge === "known" ? after : undefined;
  const assessmentsKnown =
    knownBefore !== undefined && knownAfter !== undefined;
  const probabilityComparison = assessmentsKnown
    ? compareExactProbabilities(
        knownAfter.runnerAccessSuccessProbability,
        knownBefore.runnerAccessSuccessProbability,
      )
    : undefined;
  const resourceExchange = readExactCurrentRunResourceExchange({
    input,
    candidate,
    sourceCard,
    targetServerId,
    ...(assessmentsKnown ? { before: knownBefore, after: knownAfter } : {}),
    totalRezCredits,
  });
  const accessBlock = readExactCurrentRunAccessBlock({
    input,
    candidate,
    sourceCard,
    targetServerId,
  });
  const marginalDefenseThreat = currentRunMarginalDefenseThreat(
    input,
    targetServerId,
  );
  const freeQualitativeEncounterDefense =
    !assessmentsKnown &&
    totalRezCredits === 0 &&
    isQualitativeEncounterDefenseOnCurrentRun({
      input,
      sourceCard,
      targetServerId,
    });
  if (
    !assessmentsKnown &&
    !resourceExchange &&
    !accessBlock &&
    !freeQualitativeEncounterDefense &&
    marginalDefenseThreat !== "visible_agenda_remote"
  )
    return undefined;
  if (assessmentsKnown && probabilityComparison === undefined) return undefined;
  const freePersistentDefense =
    probabilityComparison === 0 &&
    !resourceExchange &&
    !accessBlock &&
    isFreePersistentDefenseOnWorthwhileCurrentServer({
      input,
      candidate,
      sourceCard,
      targetServerId,
      totalRezCredits,
    });
  const knownAccessPathTax =
    probabilityComparison === 0 &&
    knownBefore !== undefined &&
    knownAfter !== undefined &&
    !resourceExchange &&
    !accessBlock &&
    !freePersistentDefense
      ? readKnownCurrentRunAccessPathTax({
          input,
          sourceCard,
          targetServerId,
          before: knownBefore,
          after: knownAfter,
          totalRezCredits,
        })
      : undefined;
  const qualitativeEncounterDefense =
    (probabilityComparison === 0 ||
      freeQualitativeEncounterDefense ||
      (!assessmentsKnown &&
        marginalDefenseThreat === "visible_agenda_remote")) &&
    !resourceExchange &&
    !accessBlock &&
    !freePersistentDefense &&
    knownAccessPathTax === undefined &&
    isQualitativeEncounterDefenseOnCurrentRun({
      input,
      sourceCard,
      targetServerId,
    });
  if (
    probabilityComparison !== -1 &&
    !resourceExchange &&
    !accessBlock &&
    !freePersistentDefense &&
    knownAccessPathTax === undefined &&
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
    ...(marginalDefenseThreat ? { marginalDefenseThreat } : {}),
    ...(freeQualitativeEncounterDefense
      ? {
          freeCurrentEncounterDefense: {
            effect: "meaningful_tax_or_damage_or_disruption" as const,
            evidenceSource: "visible_corp_ice_defense_profile" as const,
          },
        }
      : {}),
    ...(assessmentsKnown ? { before: knownBefore, after: knownAfter } : {}),
    routeKind: resourceExchange
      ? "exact_resource_exchange"
      : accessBlock
        ? "access_reduction"
        : freePersistentDefense
          ? "free_persistent_defense"
          : knownAccessPathTax !== undefined
            ? "known_access_path_tax"
            : qualitativeEncounterDefense
              ? "qualitative_encounter_defense"
              : "access_reduction",
    ...(resourceExchange ? { resourceExchange } : {}),
    ...(accessBlock ? { accessBlock } : {}),
    ...(knownAccessPathTax !== undefined ? { knownAccessPathTax } : {}),
    effect:
      accessBlock || (assessmentsKnown && knownAfter.protectsScore)
        ? "satisfied"
        : "progress",
    totalRezCredits,
  };
}

function readKnownCurrentRunAccessPathTax(params: {
  input: AiDecisionInput;
  sourceCard: VisibleCard;
  targetServerId: string;
  before: KnownCorpScoreProtectionAssessment;
  after: KnownCorpScoreProtectionAssessment;
  totalRezCredits: number;
}): number | undefined {
  const { input, sourceCard, targetServerId, before, after, totalRezCredits } =
    params;
  const run = input.playerView.run;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  if (
    !targetServerId.startsWith("remote_") ||
    run?.attackedServerId !== targetServerId ||
    run.phase !== "approach_ice" ||
    run.position?.kind !== "ice" ||
    run.position.serverId !== targetServerId ||
    server?.ice[run.position.iceIndex]?.instanceId !== sourceCard.instanceId ||
    totalRezCredits <= 0
  ) {
    return undefined;
  }
  if (!server.root.some((card) => card.known && card.type === "agenda")) {
    return undefined;
  }
  const tax =
    before.runnerCreditsRemainingOnBestAccessPath -
    after.runnerCreditsRemainingOnBestAccessPath;
  return Number.isSafeInteger(tax) && tax > 0 ? tax : undefined;
}

function isQualitativeEncounterDefenseOnCurrentRun(params: {
  input: AiDecisionInput;
  sourceCard: VisibleCard;
  targetServerId: string;
}): boolean {
  const { input, sourceCard, targetServerId } = params;
  const run = input.playerView.run;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  if (
    run?.attackedServerId !== targetServerId ||
    run.phase !== "approach_ice" ||
    run.position?.kind !== "ice" ||
    run.position.serverId !== targetServerId ||
    server?.ice[run.position.iceIndex]?.instanceId !== sourceCard.instanceId
  ) {
    return false;
  }

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
  const resourceExchangeQuote = exactRezActionResourceExchangeQuote(
    sourceCard,
    candidate.actionId,
  );
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
    !runnerBreak ||
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

function readExactCurrentRunAccessBlock(params: {
  input: AiDecisionInput;
  candidate: ActionSemanticCandidate;
  sourceCard: VisibleCard;
  targetServerId: string;
}): CorpExactIceRezRouteProjection["accessBlock"] | undefined {
  const { input, candidate, sourceCard, targetServerId } = params;
  const quote = exactRezActionResourceExchangeQuote(
    sourceCard,
    candidate.actionId,
  );
  if (
    input.playerView.run?.attackedServerId !== targetServerId ||
    quote?.context !== "installed" ||
    quote.complete !== true ||
    quote.cardId !== sourceCard.instanceId ||
    quote.targetServerId !== targetServerId ||
    quote.projectedServerId !== targetServerId ||
    quote.expiresAtStateVersion !== input.playerView.stateVersion ||
    !nonNegativeSafeInteger(quote.hardEndTheRunSubroutineCount) ||
    quote.hardEndTheRunSubroutineCount <= 0
  ) {
    return undefined;
  }
  if ("runnerBreakUnavailable" in quote) {
    return quote.runnerBreakUnavailable?.reason ===
      "no_visible_eligible_breaker" &&
      quote.runnerBreakUnavailable.evidenceSource ===
        "engine_icebreaker_ability"
      ? {
          hardEndTheRunSubroutineCount: quote.hardEndTheRunSubroutineCount,
          reason: "no_visible_eligible_breaker",
        }
      : undefined;
  }
  return quote.runnerBreak.canPayFromCurrentCredits === false
    ? {
        hardEndTheRunSubroutineCount: quote.hardEndTheRunSubroutineCount,
        reason: "visible_break_route_unaffordable",
      }
    : undefined;
}

function readExactCurrentRunResourceExchange(params: {
  input: AiDecisionInput;
  candidate: ActionSemanticCandidate;
  sourceCard: VisibleCard;
  targetServerId: string;
  before?: KnownCorpScoreProtectionAssessment;
  after?: KnownCorpScoreProtectionAssessment;
  totalRezCredits: number;
}):
  | NonNullable<CorpExactIceRezRouteProjection["resourceExchange"]>
  | undefined {
  const {
    input,
    candidate,
    sourceCard,
    targetServerId,
    before,
    after,
    totalRezCredits,
  } = params;
  const quote = exactRezActionResourceExchangeQuote(
    sourceCard,
    candidate.actionId,
  );
  if (
    quote?.context !== "installed" ||
    quote.complete !== true ||
    quote.cardId !== sourceCard.instanceId ||
    quote.targetServerId !== targetServerId ||
    quote.projectedServerId !== targetServerId ||
    quote.expiresAtStateVersion !== input.playerView.stateVersion ||
    !quote.runnerBreak ||
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
    !nonNegativeSafeInteger(input.playerView.opponent.credits)
  ) {
    return undefined;
  }
  // The Engine quote is exact for the currently approached ICE. The full
  // access path may contain later ICE competing for the same recurring pool,
  // so the current ICE's `normalCreditsRequired` is not necessarily the
  // complete path delta. Compare the two exact path assessments instead of
  // requiring an invalid single-ICE absolute balance.
  const runnerNormalCreditsLostOnAccessPath =
    before && after
      ? before.runnerCreditsRemainingOnBestAccessPath -
        after.runnerCreditsRemainingOnBestAccessPath
      : quote.runnerBreak.normalCreditsRequired;
  if (
    !nonNegativeSafeInteger(runnerNormalCreditsLostOnAccessPath) ||
    runnerNormalCreditsLostOnAccessPath > quote.runnerBreak.requiredCredits
  ) {
    return undefined;
  }
  const marginalDefenseThreat = currentRunMarginalDefenseThreat(
    input,
    targetServerId,
  );
  const ordinaryResourceExchangeIsWorthwhile =
    quote.runnerBreak.consumedCards.length > 0 ||
    (quote.runnerBreak.requiredCredits > 0 &&
      (marginalDefenseThreat !== undefined ||
        quote.runnerBreak.requiredCredits > totalRezCredits ||
        (quote.runnerBreak.requiredCredits === totalRezCredits &&
          quote.runnerBreak.requiredCredits >=
            input.playerView.opponent.credits)));
  const otherRezzedIceCount =
    input.playerView.servers
      .find((server) => server.id === targetServerId)
      ?.ice.filter(
        (ice) =>
          ice.instanceId !== sourceCard.instanceId && ice.rezzed === true,
      ).length ?? 0;
  const currentRezAction = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  const layeredCentralPathTax =
    (targetServerId === "hq" || targetServerId === "rd") &&
    input.playerView.run?.attackedServerId === targetServerId &&
    input.playerView.run.phase === "approach_ice" &&
    input.playerView.run.position?.kind === "ice" &&
    input.playerView.run.position.serverId === targetServerId &&
    input.playerView.servers.find((server) => server.id === targetServerId)
      ?.ice[input.playerView.run.position.iceIndex]?.instanceId ===
      sourceCard.instanceId &&
    currentRezAction?.payload?.temporaryDerezAfterRun !== true &&
    otherRezzedIceCount > 0 &&
    quote.runnerBreak.requiredCredits > 0 &&
    runnerNormalCreditsLostOnAccessPath > 0 &&
    (runnerNormalCreditsLostOnAccessPath >= totalRezCredits ||
      currentRunMarginalDefenseThreat(input, targetServerId) ===
        "terminal_central_access");
  if (!ordinaryResourceExchangeIsWorthwhile && !layeredCentralPathTax) {
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
  const randomConsequences = quote.runnerBreak.randomConsequences ?? [];
  if (
    randomConsequences.some(
      (consequence) =>
        consequence.kind !== "post_encounter_self_trash_check" ||
        consequence.evidenceSource !== "engine_icebreaker_ability" ||
        consequence.cardId !== quote.runnerBreak.breakerCardId ||
        consequence.definitionId !== quote.runnerBreak.breakerDefinitionId ||
        !nonNegativeSafeInteger(consequence.numerator) ||
        consequence.numerator <= 0 ||
        !nonNegativeSafeInteger(consequence.denominator) ||
        consequence.denominator <= 0 ||
        consequence.numerator > consequence.denominator,
    )
  ) {
    return undefined;
  }
  return {
    runnerRequiredCredits: quote.runnerBreak.requiredCredits,
    runnerPumpCredits: quote.runnerBreak.pumpCredits,
    runnerBreakCredits: quote.runnerBreak.breakCredits,
    runnerBreakUses: quote.runnerBreak.breakUses,
    runnerNormalCreditsRequired: quote.runnerBreak.normalCreditsRequired,
    runnerNonNormalRunCreditsApplied:
      quote.runnerBreak.nonNormalRunCreditsApplied,
    runnerNormalCreditsLostOnAccessPath,
    runnerBreakerInstanceId: quote.runnerBreak.breakerCardId,
    runnerBreakerDefinitionId: quote.runnerBreak.breakerDefinitionId,
    runnerConsumedCardInstanceIds: consumedCardInstanceIds,
    ...(layeredCentralPathTax
      ? { layeredCentralPathTax: true as const, otherRezzedIceCount }
      : {}),
    runnerRandomConsequences: randomConsequences.map((consequence) => ({
      cardId: consequence.cardId,
      definitionId: consequence.definitionId,
      kind: consequence.kind,
      numerator: consequence.numerator,
      denominator: consequence.denominator,
    })),
  };
}

/**
 * A marginal but exact current-run defense becomes material when the access
 * itself can immediately convert a visible agenda remote or a central
 * matchpoint exposure. This remains server- and state-bound; it does not
 * promote ordinary equal-cost exchanges elsewhere.
 */
function currentRunMarginalDefenseThreat(
  input: AiDecisionInput,
  targetServerId: string,
): "visible_agenda_remote" | "terminal_central_access" | undefined {
  if (input.playerView.run?.attackedServerId !== targetServerId)
    return undefined;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  if (!server) return undefined;
  if (targetServerId.startsWith("remote_")) {
    return server.root.some((card) => card.known && card.type === "agenda")
      ? "visible_agenda_remote"
      : undefined;
  }
  if (targetServerId !== "hq" && targetServerId !== "rd") return undefined;
  return readKnownCorpCentralAgendaThreat({ input, serverId: targetServerId })
    ?.threat === "terminal"
    ? "terminal_central_access"
    : undefined;
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
      ? ordinaryRezActionQuote(action.payload, quote, actionCredits)
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
  actionCredits: number,
): Extract<VisibleCorpRezCostQuote, { complete: true }> | undefined {
  if (
    payload?.discountedRezSourceDefinitionId !== undefined ||
    payload?.discountedRezCostBase !== undefined ||
    payload?.temporaryDerezAfterRun !== undefined
  ) {
    return undefined;
  }
  if (
    quote.costKind === "variable" &&
    quote.variableParameter.kind === "paid_end_the_run_subroutines"
  ) {
    const value = payload?.variableRezValue;
    const additionalCredits = payload?.variableRezAdditionalCost;
    if (
      payload?.variableRezKind !== "paid_end_the_run_subroutines" ||
      !nonNegativeSafeInteger(value) ||
      value < quote.variableParameter.minSubroutines ||
      !nonNegativeSafeInteger(additionalCredits) ||
      additionalCredits !==
        value * quote.variableParameter.additionalCreditsPerSubroutine ||
      payload.baseRezCost !== quote.finalCredits ||
      payload.rezCostPaid !== actionCredits ||
      payload.effectiveSubroutineCountAfterRez !== value ||
      actionCredits !== quote.finalCredits + additionalCredits
    ) {
      return undefined;
    }
    return { ...quote, finalCredits: actionCredits };
  }
  return quote;
}

function exactRezActionResourceExchangeQuote(
  sourceCard: VisibleCard,
  actionId: string,
) {
  const exact = sourceCard.effectiveRezActionResourceExchangeQuotes?.filter(
    (entry) => entry.actionId === actionId,
  );
  if (exact && exact.length > 0) {
    return exact.length === 1 ? exact[0]?.quote : undefined;
  }
  return sourceCard.effectiveRezResourceExchangeQuote;
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
    left.freeCurrentEncounterDefense?.effect ===
      right.freeCurrentEncounterDefense?.effect &&
    left.freeCurrentEncounterDefense?.evidenceSource ===
      right.freeCurrentEncounterDefense?.evidenceSource &&
    left.knownAccessPathTax === right.knownAccessPathTax &&
    left.effect === right.effect &&
    left.totalRezCredits === right.totalRezCredits &&
    exactAccessBlocksEqual(left.accessBlock, right.accessBlock) &&
    exactOptionalProtectionAssessmentsEqual(left.before, right.before) &&
    exactOptionalProtectionAssessmentsEqual(left.after, right.after) &&
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

function exactAccessBlocksEqual(
  left: CorpExactIceRezRouteProjection["accessBlock"],
  right: CorpExactIceRezRouteProjection["accessBlock"],
): boolean {
  return (
    (left === undefined && right === undefined) ||
    (left !== undefined &&
      right !== undefined &&
      left.hardEndTheRunSubroutineCount ===
        right.hardEndTheRunSubroutineCount &&
      left.reason === right.reason)
  );
}

function exactOptionalProtectionAssessmentsEqual(
  left: KnownCorpScoreProtectionAssessment | undefined,
  right: KnownCorpScoreProtectionAssessment | undefined,
): boolean {
  if (!left || !right) return left === right;
  return (
    compareExactProbabilities(
      left.runnerAccessSuccessProbability,
      right.runnerAccessSuccessProbability,
    ) === 0
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
    left.runnerNormalCreditsRequired === right.runnerNormalCreditsRequired &&
    left.runnerNonNormalRunCreditsApplied ===
      right.runnerNonNormalRunCreditsApplied &&
    left.runnerNormalCreditsLostOnAccessPath ===
      right.runnerNormalCreditsLostOnAccessPath &&
    left.runnerBreakerInstanceId === right.runnerBreakerInstanceId &&
    left.runnerBreakerDefinitionId === right.runnerBreakerDefinitionId &&
    left.layeredCentralPathTax === right.layeredCentralPathTax &&
    left.otherRezzedIceCount === right.otherRezzedIceCount &&
    left.runnerConsumedCardInstanceIds.length ===
      right.runnerConsumedCardInstanceIds.length &&
    left.runnerConsumedCardInstanceIds.every(
      (value, index) => value === right.runnerConsumedCardInstanceIds[index],
    ) &&
    exactRandomConsequencesEqual(
      left.runnerRandomConsequences,
      right.runnerRandomConsequences,
    )
  );
}

type CorpExactRezRandomConsequences = NonNullable<
  NonNullable<
    CorpExactIceRezRouteProjection["resourceExchange"]
  >["runnerRandomConsequences"]
>;

function exactRandomConsequencesEqual(
  left: CorpExactRezRandomConsequences | undefined,
  right: CorpExactRezRandomConsequences | undefined,
): boolean {
  if (left === undefined || right === undefined) return left === right;
  return (
    left.length === right.length &&
    left.every((value, index) => {
      const other = right[index];
      return (
        other !== undefined &&
        value.cardId === other.cardId &&
        value.definitionId === other.definitionId &&
        value.kind === other.kind &&
        value.numerator === other.numerator &&
        value.denominator === other.denominator
      );
    })
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
