import {
  CORP_RESTRICTED_CREDIT_ROUTE_QUOTE_VERSION,
  type AiDecisionInput,
  type CorpRestrictedCreditRouteQuote,
  type CorpRestrictedCreditRouteRequest,
  type CorpRestrictedCreditRouteResult,
} from "@netgrid/shared";

type QuoteContext = Pick<
  AiDecisionInput,
  "matchId" | "side" | "playerView" | "legalActions"
>;

/** Enumerates visible root consumers only. The Economy owner still admits or rejects each project. */
export function collectCorpRestrictedCreditRootQuotes(
  input: QuoteContext,
  quote: (
    request: CorpRestrictedCreditRouteRequest,
  ) => CorpRestrictedCreditRouteResult,
): CorpRestrictedCreditRouteQuote[] {
  if (
    input.side !== "corp" ||
    input.playerView.side !== "corp" ||
    !input.matchId
  )
    return [];
  const payouts = input.legalActions.filter(
    (action) => action.payload?.restrictedCreditGainComplete === true,
  );
  const results: CorpRestrictedCreditRouteQuote[] = [];
  for (const payout of payouts) {
    for (const server of input.playerView.servers) {
      for (const card of server.root) {
        if (!card.known || !card.definitionId || card.rezzed === true) continue;
        const result = quote({
          matchId: input.matchId,
          side: "corp",
          stateVersion: input.playerView.stateVersion,
          timingPoint: input.playerView.timingPoint,
          payoutActionId: payout.actionId,
          consumer: {
            actionType: "rez_card",
            sourceCardInstanceId: card.instanceId,
            serverId: server.id,
          },
        });
        if (result.status === "failed")
          throw new Error(
            `corp_restricted_credit_quote_failed:${result.reason}`,
          );
        if (result.status === "quoted") results.push(result.quote);
      }
    }
  }
  return sanitizeCorpRestrictedCreditRouteQuotes(input, results);
}

/** Explicit allowlist and source/current-action validation. Unknown siblings do not erase valid quotes. */
export function sanitizeCorpRestrictedCreditRouteQuotes(
  input: QuoteContext,
  quotes: readonly CorpRestrictedCreditRouteQuote[],
): CorpRestrictedCreditRouteQuote[] {
  if (input.side !== "corp" || input.playerView.side !== "corp") return [];
  return quotes.flatMap((q) => {
    const request = q?.request;
    const consumer = q?.consumer;
    if (!request || !consumer) return [];
    const action = input.legalActions.find(
      (entry) => entry.actionId === request.payoutActionId,
    );
    const card = input.playerView.servers
      .find((server) => server.id === consumer.serverId)
      ?.root.find(
        (entry) => entry.instanceId === consumer.sourceCardInstanceId,
      );
    const numbers = [
      q.payoutCredits,
      q.payoutClickCost,
      q.payoutGeneralCreditCost,
      q.payoutAdvancementCounterCost,
      consumer.creditCost,
      consumer.clickCost,
      consumer.restrictedCreditsApplied,
      consumer.newlyProvidedCreditsApplied,
      consumer.generalCreditsRequired,
      q.remainingRestrictedCreditsAfterConsumer,
    ];
    if (
      q.schemaVersion !== CORP_RESTRICTED_CREDIT_ROUTE_QUOTE_VERSION ||
      request.side !== "corp" ||
      request.matchId !== input.matchId ||
      request.stateVersion !== input.playerView.stateVersion ||
      request.timingPoint !== input.playerView.timingPoint ||
      consumer.actionType !== "rez_card" ||
      request.consumer?.actionType !== consumer.actionType ||
      request.consumer.sourceCardInstanceId !== consumer.sourceCardInstanceId ||
      request.consumer.serverId !== consumer.serverId ||
      !card?.known ||
      card.definitionId !== consumer.sourceCardDefinitionId ||
      card.rezzed === true ||
      !action ||
      action.side !== "corp" ||
      action.type !== "activated_card_ability" ||
      action.expiresAtStateVersion !== request.stateVersion ||
      action.source !== q.payoutSourceCardInstanceId ||
      action.abilityRef?.sourceCardInstanceId !== action.source ||
      action.abilityRef.sourceAbilityId !== q.payoutSourceAbilityId ||
      action.targetRequirements.length > 0 ||
      (action.choiceRequirements?.length ?? 0) > 0 ||
      action.payload?.restrictedCreditGainComplete !== true ||
      action.payload.restrictedCreditGainAmount !== q.payoutCredits ||
      action.payload.restrictedCreditGainUsableFor !== "corp_install_or_rez" ||
      action.payload.restrictedCreditGainCleanup !== "end_of_turn" ||
      action.payload.cardImplementationAdvancementCounterCost !==
        q.payoutAdvancementCounterCost ||
      numbers.some((n) => !Number.isSafeInteger(n) || n < 0) ||
      q.payoutCredits <= 0 ||
      q.payoutAdvancementCounterCost <= 0 ||
      consumer.newlyProvidedCreditsApplied <= 0 ||
      consumer.newlyProvidedCreditsApplied > q.payoutCredits ||
      consumer.newlyProvidedCreditsApplied >
        consumer.restrictedCreditsApplied ||
      consumer.restrictedCreditsApplied + consumer.generalCreditsRequired !==
        consumer.creditCost ||
      typeof consumer.availableBeforePayout !== "boolean" ||
      q.payoutClickCost !==
        action.costs.reduce((sum, cost) => sum + (cost.clicks ?? 0), 0) ||
      q.payoutGeneralCreditCost !==
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0) ||
      q.cleanup !== "end_of_turn" ||
      q.guarantee !== "exact_current_funding_prefix"
    )
      return [];
    const boundConsumer = {
      actionType: consumer.actionType,
      sourceCardInstanceId: consumer.sourceCardInstanceId,
      serverId: consumer.serverId,
    };
    return [
      {
        schemaVersion: CORP_RESTRICTED_CREDIT_ROUTE_QUOTE_VERSION,
        request: {
          matchId: request.matchId,
          side: "corp" as const,
          stateVersion: request.stateVersion,
          timingPoint: request.timingPoint,
          payoutActionId: request.payoutActionId,
          consumer: boundConsumer,
        },
        payoutSourceCardInstanceId: q.payoutSourceCardInstanceId,
        payoutSourceAbilityId: q.payoutSourceAbilityId,
        payoutCredits: q.payoutCredits,
        payoutClickCost: q.payoutClickCost,
        payoutGeneralCreditCost: q.payoutGeneralCreditCost,
        payoutAdvancementCounterCost: q.payoutAdvancementCounterCost,
        consumer: {
          ...boundConsumer,
          sourceCardDefinitionId: consumer.sourceCardDefinitionId,
          availableBeforePayout: consumer.availableBeforePayout,
          clickCost: consumer.clickCost,
          creditCost: consumer.creditCost,
          restrictedCreditsApplied: consumer.restrictedCreditsApplied,
          newlyProvidedCreditsApplied: consumer.newlyProvidedCreditsApplied,
          generalCreditsRequired: consumer.generalCreditsRequired,
        },
        remainingRestrictedCreditsAfterConsumer:
          q.remainingRestrictedCreditsAfterConsumer,
        cleanup: "end_of_turn" as const,
        guarantee: "exact_current_funding_prefix" as const,
      },
    ];
  });
}
