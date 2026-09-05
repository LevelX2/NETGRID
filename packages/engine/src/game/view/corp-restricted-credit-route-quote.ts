import {
  CORP_RESTRICTED_CREDIT_ROUTE_QUOTE_VERSION,
  type CorpRestrictedCreditRouteRequest,
  type CorpRestrictedCreditRouteResult,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { applyAction } from "../apply-action";
import { getLegalActions } from "../legal-actions";
import { corpGeneralCreditAvailability } from "../payment/corp-general-credit-availability";

/** Read-only one-payout funding prefix. No strategic selection and no future action authority. */
export function quoteCorpRestrictedCreditRoute(
  state: GameState,
  request: CorpRestrictedCreditRouteRequest,
): CorpRestrictedCreditRouteResult {
  if (
    request.side !== "corp" ||
    request.matchId !== state.matchId ||
    request.stateVersion !== state.stateVersion ||
    request.timingPoint !== state.timingPoint
  )
    return { status: "unavailable", reason: "stale_request" };
  if (
    request.consumer.actionType !== "install_card" &&
    request.consumer.actionType !== "rez_card" &&
    request.consumer.actionType !== "rez_ice"
  )
    return { status: "unavailable", reason: "consumer_invocation_not_exact" };
  const consumerSource =
    state.cardInstances[request.consumer.sourceCardInstanceId];
  if (
    !consumerSource ||
    consumerSource.owner !== "corp" ||
    consumerSource.controller !== "corp"
  )
    return { status: "unavailable", reason: "consumer_not_owned" };
  const currentActions = getLegalActions(state, "corp");
  const payout = currentActions.find(
    (action) => action.actionId === request.payoutActionId,
  );
  const payload = payout?.payload;
  if (
    !payout ||
    payout.type !== "activated_card_ability" ||
    payout.abilityRef?.sourceCardInstanceId !== payout.source ||
    payout.targetRequirements.length > 0 ||
    (payout.choiceRequirements?.length ?? 0) > 0 ||
    payload?.restrictedCreditGainComplete !== true ||
    payload.cardImplementationEffectKind !== "gain_temporary_corp_credits" ||
    payload.restrictedCreditGainUsableFor !== "corp_install_or_rez" ||
    payload.restrictedCreditGainCleanup !== "end_of_turn" ||
    !positiveInteger(payload.restrictedCreditGainAmount) ||
    !positiveInteger(payload.cardImplementationAdvancementCounterCost)
  )
    return { status: "unavailable", reason: "invalid_current_payout" };
  const funded = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: payout.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `restricted-credit-quote:${state.stateVersion}:${payout.actionId}`,
  });
  if (!funded.ok)
    return { status: "failed", reason: "legal_payout_execution_failed" };
  const projected = funded.state;
  if (
    projected.pendingChoice ||
    projected.winner ||
    projected.timingPoint !== state.timingPoint ||
    projected.activeSide !== state.activeSide ||
    projected.randomCounter !== state.randomCounter
  )
    return { status: "unavailable", reason: "payout_boundary" };
  const matches = getLegalActions(projected, "corp").filter((action) =>
    matchesConsumer(projected, action, request.consumer),
  );
  if (matches.length === 0)
    return {
      status: "unavailable",
      reason: "consumer_not_available_after_payout",
    };
  const consumer = matches[0]!;
  if (
    matches.length !== 1 ||
    consumer.targetRequirements.length > 0 ||
    (consumer.choiceRequirements?.length ?? 0) > 0 ||
    consumer.costs.some((cost) =>
      Object.keys(cost).some((key) => key !== "credits" && key !== "clicks"),
    ) ||
    consumer.payload?.replacesRootAsset === true ||
    consumer.payload?.replacesRegion === true
  )
    return { status: "unavailable", reason: "consumer_invocation_not_exact" };
  const creditCost = totalCost(consumer, "credits");
  const clickCost = totalCost(consumer, "clicks");
  const pool = projected.corpTemporaryInstallRezCredits;
  const restricted = pool?.remaining;
  if (!positiveInteger(creditCost) || !positiveInteger(restricted))
    return {
      status: "unavailable",
      reason: "consumer_has_no_restricted_payment",
    };
  // The normal install/rez execution hosts spend this included pool before general credits.
  const restrictedCreditsApplied = Math.min(creditCost, restricted);
  const priorRestricted = state.corpTemporaryInstallRezCredits?.remaining ?? 0;
  const newlyProvidedCreditsApplied =
    restrictedCreditsApplied - Math.min(creditCost, priorRestricted);
  if (newlyProvidedCreditsApplied <= 0)
    return {
      status: "unavailable",
      reason: "consumer_has_no_restricted_payment",
    };
  const generalCreditsRequired = creditCost - restrictedCreditsApplied;
  if (generalCreditsRequired > corpGeneralCreditAvailability(projected))
    throw new Error(
      "Restricted-credit consumer disagrees with Engine payment availability.",
    );
  return {
    status: "quoted",
    quote: {
      schemaVersion: CORP_RESTRICTED_CREDIT_ROUTE_QUOTE_VERSION,
      request: {
        matchId: request.matchId,
        side: "corp",
        stateVersion: request.stateVersion,
        timingPoint: request.timingPoint,
        payoutActionId: request.payoutActionId,
        consumer: {
          actionType: request.consumer.actionType,
          sourceCardInstanceId: request.consumer.sourceCardInstanceId,
          serverId: request.consumer.serverId,
        },
      },
      payoutSourceCardInstanceId: payout.source,
      payoutSourceAbilityId: payout.abilityRef.sourceAbilityId,
      payoutCredits: payload.restrictedCreditGainAmount,
      payoutClickCost: totalCost(payout, "clicks"),
      payoutGeneralCreditCost: totalCost(payout, "credits"),
      payoutAdvancementCounterCost:
        payload.cardImplementationAdvancementCounterCost,
      consumer: {
        actionType: request.consumer.actionType,
        sourceCardInstanceId: request.consumer.sourceCardInstanceId,
        serverId: request.consumer.serverId,
        availableBeforePayout: currentActions.some((action) =>
          matchesConsumer(state, action, request.consumer),
        ),
        sourceCardDefinitionId: consumerSource.definitionId,
        clickCost,
        creditCost,
        restrictedCreditsApplied,
        newlyProvidedCreditsApplied,
        generalCreditsRequired,
      },
      remainingRestrictedCreditsAfterConsumer:
        restricted - restrictedCreditsApplied,
      cleanup: "end_of_turn",
      guarantee: "exact_current_funding_prefix",
    },
  };
}

function matchesConsumer(
  state: GameState,
  action: LegalAction,
  consumer: CorpRestrictedCreditRouteRequest["consumer"],
): boolean {
  if (
    action.type !== consumer.actionType ||
    action.source !== consumer.sourceCardInstanceId
  )
    return false;
  if (action.type === "install_card")
    return action.payload?.serverId === consumer.serverId;
  // Rez acts on an already installed source. Its authoritative server binding
  // is the Engine zone; rez_ice does not carry an installation target payload.
  const zone = state.cardInstances[action.source]?.zone;
  return (
    zone?.side === "corp" &&
    zone.zone === (action.type === "rez_ice" ? "serverIce" : "serverRoot") &&
    zone.serverId === consumer.serverId
  );
}

function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function totalCost(action: LegalAction, field: "credits" | "clicks"): number {
  const amounts = action.costs.map((cost) => cost[field] ?? 0);
  if (amounts.some((amount) => !Number.isSafeInteger(amount) || amount < 0))
    throw new Error("Restricted-credit route has an invalid Engine cost.");
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  if (!Number.isSafeInteger(total))
    throw new Error("Restricted-credit route cost overflow.");
  return total;
}
