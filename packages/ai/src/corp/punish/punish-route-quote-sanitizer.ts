import { parseCanonicalCapabilityId } from "@netgrid/cards/planning";
import {
  CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
  type CorpPunishRouteIncompleteReason,
  type CorpPunishRouteQuote,
  type CorpPunishRouteQuoteSet,
  type LegalAction,
  type PlayerView,
} from "@netgrid/shared";

export function sanitizeCurrentCorpPunishQuoteSet(
  view: PlayerView,
  sanitizeLegalAction: (action: LegalAction) => LegalAction,
): CorpPunishRouteQuoteSet | undefined {
  const quoteSet = view.corpPunishRouteQuoteSet;
  if (
    view.side !== "corp" ||
    !quoteSet ||
    quoteSet.schemaVersion !== CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION ||
    quoteSet.visibility !== "private_to_actor" ||
    quoteSet.side !== "corp" ||
    !nonNegativeInteger(quoteSet.stateVersion) ||
    quoteSet.stateVersion !== view.stateVersion ||
    quoteSet.timingPoint !== view.timingPoint ||
    !validCompleteState(
      quoteSet.complete,
      quoteSet.incompleteReasons,
      quoteSet.complete && quoteSet.routes.length === 0,
    ) ||
    !nonNegativeInteger(quoteSet.runnerHandCount) ||
    quoteSet.runnerHandCount !== view.opponent.handCount ||
    !nonNegativeInteger(quoteSet.runnerTags) ||
    quoteSet.runnerTags !== view.opponent.tags ||
    !nonNegativeInteger(quoteSet.runnerCreditsVisible) ||
    quoteSet.runnerCreditsVisible !== view.opponent.credits ||
    !uniqueNonblankStrings(quoteSet.routes.map((route) => route.routeId)) ||
    !uniqueNonblankStrings(
      quoteSet.routes.map((route) => route.requestFingerprint),
    ) ||
    quoteSet.routes.some(
      (route) => !validCorpPunishRouteQuote(route, quoteSet, view),
    )
  )
    return undefined;

  return {
    schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    visibility: "private_to_actor",
    side: "corp",
    stateVersion: quoteSet.stateVersion,
    timingPoint: quoteSet.timingPoint,
    complete: quoteSet.complete,
    incompleteReasons: quoteSet.incompleteReasons.slice(),
    runnerHandCount: quoteSet.runnerHandCount,
    runnerTags: quoteSet.runnerTags,
    runnerCreditsVisible: quoteSet.runnerCreditsVisible,
    routes: quoteSet.routes.map((route) => ({
      schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
      visibility: "private_to_actor",
      matchId: route.matchId,
      side: "corp",
      routeId: route.routeId,
      campaignId: route.campaignId,
      campaignIdOrigin: route.campaignIdOrigin,
      stateVersion: route.stateVersion,
      timingPoint: route.timingPoint,
      requestFingerprint: route.requestFingerprint,
      requestEcho: {
        schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
        matchId: route.requestEcho.matchId,
        side: "corp",
        stateVersion: route.requestEcho.stateVersion,
        timingPoint: route.requestEcho.timingPoint,
        campaignId: route.requestEcho.campaignId,
        routeId: route.requestEcho.routeId,
        steps: route.requestEcho.steps.map((step) => ({
          stepId: step.stepId,
          order: step.order,
          kind: step.kind,
          sourceCardInstanceId: step.sourceCardInstanceId,
          sourceCapabilityBindingKind: step.sourceCapabilityBindingKind,
          sourceCapabilityId: step.sourceCapabilityId,
          ...(step.currentLegalActionId !== undefined
            ? { currentLegalActionId: step.currentLegalActionId }
            : {}),
        })),
      },
      complete: route.complete,
      incompleteReasons: route.incompleteReasons.slice(),
      steps: route.steps.map((step, index) => ({
        stepId: step.stepId,
        order: step.order,
        kind: step.kind,
        sourceCardInstanceId: step.sourceCardInstanceId,
        sourceCardDefinitionId: step.sourceCardDefinitionId,
        sourceCapabilityBindingKind: step.sourceCapabilityBindingKind,
        sourceCapabilityId: step.sourceCapabilityId,
        clicks: step.clicks,
        credits: step.credits,
        ...(step.agendaPointCost !== undefined
          ? { agendaPointCost: step.agendaPointCost }
          : {}),
        ...(step.hardwareTrashProjection
          ? {
              hardwareTrashProjection: projectHardwareTrash(
                step.hardwareTrashProjection,
              ),
            }
          : {}),
        ...(index === 0 && step.currentLegalAction
          ? { currentLegalAction: sanitizeLegalAction(step.currentLegalAction) }
          : {}),
      })),
      totalClicks: route.totalClicks,
      totalActionCredits: route.totalActionCredits,
      ...(route.traceBid
        ? {
            traceBid: {
              sourceStepId: route.traceBid.sourceStepId,
              amount: route.traceBid.amount,
            },
          }
        : {}),
      tagTrigger: projectTagTrigger(route.tagTrigger),
      ...(route.tagOutcomeEnvelope
        ? {
            tagOutcomeEnvelope: {
              currentRunnerTags: route.tagOutcomeEnvelope.currentRunnerTags,
              addedTags: projectRange(route.tagOutcomeEnvelope.addedTags),
              projectedRunnerTags: projectRange(
                route.tagOutcomeEnvelope.projectedRunnerTags,
              ),
            },
          }
        : {}),
      responsePaymentEnvelope: {
        responseKind: route.responsePaymentEnvelope.responseKind,
        paymentKnowledge: route.responsePaymentEnvelope.paymentKnowledge,
        corpCreditsAvailable:
          route.responsePaymentEnvelope.corpCreditsAvailable,
        runnerCreditsVisible:
          route.responsePaymentEnvelope.runnerCreditsVisible,
        corpResponseCredits: projectRange(
          route.responsePaymentEnvelope.corpResponseCredits,
        ),
        totalCorpCredits: projectRange(
          route.responsePaymentEnvelope.totalCorpCredits,
        ),
        runnerResponseCredits: projectRange(
          route.responsePaymentEnvelope.runnerResponseCredits,
        ),
      },
      damageEnvelope: {
        runnerHandCount: route.damageEnvelope.runnerHandCount,
        rawDamage: {
          meat: route.damageEnvelope.rawDamage.meat,
          net: route.damageEnvelope.rawDamage.net,
          core: route.damageEnvelope.rawDamage.core,
          total: route.damageEnvelope.rawDamage.total,
        },
        effectiveDamage: projectRange(route.damageEnvelope.effectiveDamage),
        visiblePrevention: {
          knowledge: route.damageEnvelope.visiblePrevention.knowledge,
          maximumPreventableDamage:
            route.damageEnvelope.visiblePrevention.maximumPreventableDamage,
          creditCost: projectRange(
            route.damageEnvelope.visiblePrevention.creditCost,
          ),
        },
        visiblePiercing: {
          knowledge: route.damageEnvelope.visiblePiercing.knowledge,
          maximumBypassedDamage:
            route.damageEnvelope.visiblePiercing.maximumBypassedDamage,
          creditCost: projectRange(
            route.damageEnvelope.visiblePiercing.creditCost,
          ),
        },
      },
      ...(route.nonDamageEnvelope
        ? {
            nonDamageEnvelope: {
              runnerCreditLoss: {
                knowledge: route.nonDamageEnvelope.runnerCreditLoss.knowledge,
                ...projectRange(route.nonDamageEnvelope.runnerCreditLoss),
              },
            },
          }
        : {}),
      guarantee: route.guarantee,
      responseKnowledge: route.responseKnowledge,
    })),
  };
}

function projectRange(range: { minimum: number; maximum: number }) {
  return { minimum: range.minimum, maximum: range.maximum };
}

function projectTagTrigger(
  trigger: CorpPunishRouteQuote["tagTrigger"],
): CorpPunishRouteQuote["tagTrigger"] {
  const base = {
    currentRunnerTags: trigger.currentRunnerTags,
    requiredRunnerTags: trigger.requiredRunnerTags,
  };
  switch (trigger.kind) {
    case "trace_tag_step":
      return {
        ...base,
        kind: trigger.kind,
        status: trigger.status,
        sourceStepId: trigger.sourceStepId,
        traceLimit: trigger.traceLimit,
      };
    case "direct_tag_step":
      return {
        ...base,
        kind: trigger.kind,
        status: trigger.status,
        sourceStepId: trigger.sourceStepId,
      };
    case "none":
      return {
        ...base,
        kind: trigger.kind,
        status: trigger.status,
        requiredRunnerTags: 0,
      };
    case "existing_tag":
      return { ...base, kind: trigger.kind, status: trigger.status };
    case "unknown":
      return { ...base, kind: trigger.kind, status: trigger.status };
  }
}

type HardwareTrashProjection = NonNullable<
  CorpPunishRouteQuote["steps"][number]["hardwareTrashProjection"]
>;

function projectHardwareTrash(
  projection: HardwareTrashProjection,
): HardwareTrashProjection {
  return {
    kind: projection.kind,
    targetKnowledge: projection.targetKnowledge,
    eligibleTargetInstanceIds: projection.eligibleTargetInstanceIds.slice(),
    eligibleTargetCount: projection.eligibleTargetCount,
    excludedSubtype: projection.excludedSubtype,
    costKind: projection.costKind,
    minimumX: projection.minimumX,
    selectedX: projection.selectedX,
    legalMaximumX: projection.legalMaximumX,
    creditsPerX: projection.creditsPerX,
    preventionKnowledge: projection.preventionKnowledge,
  };
}

function validCorpPunishRouteQuote(
  route: CorpPunishRouteQuote,
  quoteSet: CorpPunishRouteQuoteSet,
  view: PlayerView,
): boolean {
  if (
    route.schemaVersion !== CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION ||
    route.visibility !== "private_to_actor" ||
    !nonblank(route.matchId) ||
    route.side !== "corp" ||
    !nonblank(route.routeId) ||
    !nonblank(route.campaignId) ||
    route.campaignIdOrigin !== "request_binding" ||
    route.stateVersion !== quoteSet.stateVersion ||
    route.timingPoint !== quoteSet.timingPoint ||
    !validPunishRequestEcho(route) ||
    route.requestFingerprint !== punishRequestFingerprint(route.requestEcho) ||
    !validCompleteState(
      route.complete,
      route.incompleteReasons,
      route.complete && route.steps.length === 0,
    )
  )
    return false;

  if (!route.complete) return validCanonicalIncompletePunishRoute(route);

  if (
    !nonNegativeInteger(route.totalClicks) ||
    !nonNegativeInteger(route.totalActionCredits) ||
    !validOrderedPunishSteps(route, quoteSet, view) ||
    route.steps.reduce((sum, step) => sum + step.clicks, 0) !==
      route.totalClicks ||
    route.steps.reduce((sum, step) => sum + step.credits, 0) !==
      route.totalActionCredits ||
    !validTagTrigger(route, quoteSet) ||
    !validTagOutcomeEnvelope(route, quoteSet) ||
    !validResponsePaymentEnvelope(route, quoteSet, view) ||
    !validPunishTraceBid(route) ||
    !validDamageEnvelope(route, quoteSet) ||
    !validNonDamageEnvelope(route, quoteSet) ||
    (route.responseKnowledge !== "public_exact" &&
      route.responseKnowledge !== "public_bounded" &&
      route.responseKnowledge !== "unknown")
  )
    return false;

  return (
    route.guarantee === "guaranteed" ||
    route.guarantee === "conditional_on_runner_response" ||
    route.guarantee === "not_guaranteed" ||
    route.guarantee === "unknown"
  );
}

function validPunishTraceBid(route: CorpPunishRouteQuote): boolean {
  const traceHead = route.steps.find((step) => step.kind === "trace_tag");
  if (!traceHead) return route.traceBid === undefined;
  return (
    traceHead === route.steps[0] &&
    route.traceBid != null &&
    route.traceBid.sourceStepId === traceHead.stepId &&
    Number.isSafeInteger(route.traceBid.amount) &&
    route.traceBid.amount >=
      route.responsePaymentEnvelope.corpResponseCredits.maximum
  );
}

function validTagOutcomeEnvelope(
  route: CorpPunishRouteQuote,
  quoteSet: CorpPunishRouteQuoteSet,
): boolean {
  const envelope = route.tagOutcomeEnvelope;
  if (!envelope) return true;
  return (
    nonNegativeInteger(envelope.currentRunnerTags) &&
    envelope.currentRunnerTags === quoteSet.runnerTags &&
    validRange(envelope.addedTags) &&
    validRange(envelope.projectedRunnerTags) &&
    envelope.projectedRunnerTags.minimum ===
      envelope.currentRunnerTags + envelope.addedTags.minimum &&
    envelope.projectedRunnerTags.maximum ===
      envelope.currentRunnerTags + envelope.addedTags.maximum
  );
}

function validNonDamageEnvelope(
  route: CorpPunishRouteQuote,
  quoteSet: CorpPunishRouteQuoteSet,
): boolean {
  const envelope = route.nonDamageEnvelope;
  if (!envelope) return true;
  return (
    envelope.runnerCreditLoss.knowledge === "exact_public" &&
    nonNegativeInteger(envelope.runnerCreditLoss.minimum) &&
    nonNegativeInteger(envelope.runnerCreditLoss.maximum) &&
    envelope.runnerCreditLoss.minimum <= envelope.runnerCreditLoss.maximum &&
    envelope.runnerCreditLoss.maximum <= quoteSet.runnerCreditsVisible
  );
}

function validPunishRequestEcho(route: CorpPunishRouteQuote): boolean {
  const request = route.requestEcho;
  return (
    request.schemaVersion === CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION &&
    request.matchId === route.matchId &&
    request.side === "corp" &&
    request.stateVersion === route.stateVersion &&
    request.timingPoint === route.timingPoint &&
    request.campaignId === route.campaignId &&
    request.routeId === route.routeId &&
    request.steps.length >= 1 &&
    request.steps.length <= 6 &&
    uniqueNonblankStrings(request.steps.map((step) => step.stepId)) &&
    uniqueNonblankStrings(
      request.steps.map(
        (step) =>
          `${step.sourceCardInstanceId}\u0000${step.sourceCapabilityId}`,
      ),
    ) &&
    uniqueNonblankStrings(
      request.steps.map((step) => step.sourceCardInstanceId),
    ) &&
    request.steps.every(
      (step, index) =>
        step.order === index &&
        validPunishStepKind(step.kind) &&
        nonblank(step.sourceCardInstanceId) &&
        step.sourceCapabilityBindingKind === "card_spec_capability_key" &&
        nonblank(step.sourceCapabilityId) &&
        (step.currentLegalActionId === undefined ||
          (index === 0 && nonblank(step.currentLegalActionId))),
    ) &&
    (!route.complete ||
      request.steps.every((requested, index) => {
        const quoted = route.steps[index];
        return (
          quoted !== undefined &&
          requested.stepId === quoted.stepId &&
          requested.order === quoted.order &&
          requested.kind === quoted.kind &&
          requested.sourceCardInstanceId === quoted.sourceCardInstanceId &&
          requested.sourceCapabilityBindingKind ===
            quoted.sourceCapabilityBindingKind &&
          requested.sourceCapabilityId === quoted.sourceCapabilityId
        );
      }))
  );
}

function validCanonicalIncompletePunishRoute(
  route: CorpPunishRouteQuote,
): boolean {
  return (
    route.steps.length === 0 &&
    route.totalClicks === 0 &&
    route.totalActionCredits === 0 &&
    route.traceBid === undefined &&
    route.tagTrigger.kind === "unknown" &&
    route.tagTrigger.status === "unknown" &&
    route.tagTrigger.currentRunnerTags === 0 &&
    route.tagTrigger.requiredRunnerTags === 0 &&
    route.responsePaymentEnvelope.responseKind === "unknown" &&
    route.responsePaymentEnvelope.paymentKnowledge === "unknown" &&
    route.responsePaymentEnvelope.corpCreditsAvailable === 0 &&
    route.responsePaymentEnvelope.runnerCreditsVisible === 0 &&
    zeroRange(route.responsePaymentEnvelope.corpResponseCredits) &&
    zeroRange(route.responsePaymentEnvelope.totalCorpCredits) &&
    zeroRange(route.responsePaymentEnvelope.runnerResponseCredits) &&
    route.damageEnvelope.runnerHandCount === 0 &&
    route.damageEnvelope.rawDamage.meat === 0 &&
    route.damageEnvelope.rawDamage.net === 0 &&
    route.damageEnvelope.rawDamage.core === 0 &&
    route.damageEnvelope.rawDamage.total === 0 &&
    zeroRange(route.damageEnvelope.effectiveDamage) &&
    route.damageEnvelope.visiblePrevention.knowledge === "unknown" &&
    route.damageEnvelope.visiblePrevention.maximumPreventableDamage === 0 &&
    zeroRange(route.damageEnvelope.visiblePrevention.creditCost) &&
    route.damageEnvelope.visiblePiercing.knowledge === "unknown" &&
    route.damageEnvelope.visiblePiercing.maximumBypassedDamage === 0 &&
    zeroRange(route.damageEnvelope.visiblePiercing.creditCost) &&
    route.guarantee === "unknown" &&
    route.responseKnowledge === "unknown"
  );
}

function validCompleteState(
  complete: boolean,
  reasons: CorpPunishRouteIncompleteReason[],
  structurallyIncomplete: boolean,
): boolean {
  return (
    typeof complete === "boolean" &&
    reasons.every(isCorpPunishRouteIncompleteReason) &&
    (complete
      ? reasons.length === 0 && !structurallyIncomplete
      : reasons.length > 0)
  );
}

function validOrderedPunishSteps(
  route: CorpPunishRouteQuote,
  quoteSet: CorpPunishRouteQuoteSet,
  view: PlayerView,
): boolean {
  if (
    !uniqueNonblankStrings(route.steps.map((step) => step.stepId)) ||
    route.steps.some(
      (step, index) =>
        step.order !== index ||
        !nonblank(step.sourceCardInstanceId) ||
        !nonblank(step.sourceCardDefinitionId) ||
        !nonblank(step.sourceCapabilityId) ||
        !validPunishStepKind(step.kind) ||
        !nonNegativeInteger(step.clicks) ||
        !nonNegativeInteger(step.credits) ||
        (step.agendaPointCost !== undefined &&
          (route.steps.length !== 1 ||
            step.kind !== "meat_damage" ||
            !Number.isSafeInteger(step.agendaPointCost) ||
            step.agendaPointCost <= 0 ||
            step.agendaPointCost > view.own.agendaPoints ||
            step.currentLegalAction === undefined ||
            !canonicalCapabilityMatchesDefinition(
              step.sourceCapabilityId,
              step.sourceCardDefinitionId,
            ))) ||
        !validHardwareTrashProjection(step, view) ||
        (index > 0 && step.currentLegalAction !== undefined),
    )
  )
    return false;

  const head = route.steps[0];
  const action = head?.currentLegalAction;
  const requestedHeadActionId =
    route.requestEcho.steps[0]?.currentLegalActionId;
  const visibleCurrentAction = action
    ? view.legalActions.find(
        (candidate) => candidate.actionId === action.actionId,
      )
    : undefined;
  return (
    (requestedHeadActionId === undefined ||
      (action !== undefined && action.actionId === requestedHeadActionId)) &&
    (!action ||
      (visibleCurrentAction !== undefined &&
        action.side === "corp" &&
        action.source === head.sourceCardInstanceId &&
        action.timingPoint === quoteSet.timingPoint &&
        action.expiresAtStateVersion === quoteSet.stateVersion &&
        action.source === visibleCurrentAction.source &&
        action.timingPoint === visibleCurrentAction.timingPoint &&
        action.expiresAtStateVersion ===
          visibleCurrentAction.expiresAtStateVersion &&
        action.costs.reduce((sum, cost) => sum + (cost.clicks ?? 0), 0) ===
          head.clicks &&
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0) ===
          head.credits &&
        validCurrentHardwareTrashAction(action, head) &&
        [action, visibleCurrentAction].every((candidate) =>
          head.agendaPointCost === undefined
            ? candidate.payload?.v1920AssetAbility !== "tagged_meat_damage"
            : candidate.type === "gain_credit" &&
              candidate.payload?.v1920AssetAbility === "tagged_meat_damage" &&
              candidate.payload.damageRecipient === "runner" &&
              candidate.payload.agendaPointCost === head.agendaPointCost,
        )))
  );
}

function validHardwareTrashProjection(
  step: CorpPunishRouteQuote["steps"][number],
  view: PlayerView,
): boolean {
  const projection = step.hardwareTrashProjection;
  if (step.kind !== "hardware_trash") return projection === undefined;
  if (
    !projection ||
    !canonicalCapabilityMatchesDefinition(
      step.sourceCapabilityId,
      step.sourceCardDefinitionId,
    ) ||
    projection.kind !== "installed_runner_hardware" ||
    projection.targetKnowledge !== "public_exact" ||
    projection.excludedSubtype !== "cybernetics" ||
    projection.costKind !== "variable_x" ||
    projection.preventionKnowledge !== "none_visible" ||
    !uniqueNonblankStrings(projection.eligibleTargetInstanceIds) ||
    !nonNegativeInteger(projection.eligibleTargetCount) ||
    projection.eligibleTargetCount !==
      projection.eligibleTargetInstanceIds.length ||
    projection.eligibleTargetCount < 1 ||
    !nonNegativeInteger(projection.minimumX) ||
    projection.minimumX < 0 ||
    !nonNegativeInteger(projection.selectedX) ||
    projection.selectedX < projection.minimumX ||
    !nonNegativeInteger(projection.legalMaximumX) ||
    projection.legalMaximumX < projection.selectedX ||
    projection.legalMaximumX > projection.eligibleTargetCount ||
    !nonNegativeInteger(projection.creditsPerX) ||
    projection.creditsPerX < 1 ||
    step.credits !== projection.selectedX * projection.creditsPerX
  ) {
    return false;
  }
  const visibleEligibleIds = (view.opponent.rig ?? [])
    .filter(
      (card) =>
        card.known === true &&
        card.owner === "runner" &&
        card.controller === "runner" &&
        card.type === "hardware" &&
        card.subtypes?.some(
          (subtype) =>
            normalizePunishSubtype(subtype) ===
            normalizePunishSubtype(projection.excludedSubtype),
        ) !== true,
    )
    .map((card) => card.instanceId)
    .sort();
  const quotedIds = projection.eligibleTargetInstanceIds.slice().sort();
  return (
    visibleEligibleIds.length === quotedIds.length &&
    visibleEligibleIds.every((cardId, index) => cardId === quotedIds[index])
  );
}

function canonicalCapabilityMatchesDefinition(
  sourceCapabilityId: string,
  sourceDefinitionId: number,
): boolean {
  try {
    return (
      parseCanonicalCapabilityId(sourceCapabilityId).cardDefinitionId ===
      sourceDefinitionId
    );
  } catch {
    return false;
  }
}

function validCurrentHardwareTrashAction(
  action: LegalAction,
  step: CorpPunishRouteQuote["steps"][number],
): boolean {
  const projection = step.hardwareTrashProjection;
  if (!projection) return step.kind !== "hardware_trash";
  return (
    action.payload?.hardwareTrashByCounterTrashCount === projection.selectedX &&
    action.payload?.eligibleHardwareCount === projection.eligibleTargetCount &&
    action.payload?.xValue === projection.selectedX &&
    action.payload?.xMinimum === projection.minimumX &&
    action.payload?.xMaximum === projection.legalMaximumX &&
    action.payload?.xUpperBound === projection.legalMaximumX &&
    action.payload?.xCreditsPerUnit === projection.creditsPerX &&
    action.payload?.variableCostKind === "printed_play_cost"
  );
}

function normalizePunishSubtype(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function validTagTrigger(
  route: CorpPunishRouteQuote,
  quoteSet: CorpPunishRouteQuoteSet,
): boolean {
  const trigger = route.tagTrigger;
  if (
    !nonNegativeInteger(trigger.currentRunnerTags) ||
    trigger.currentRunnerTags !== quoteSet.runnerTags ||
    !nonNegativeInteger(trigger.requiredRunnerTags)
  )
    return false;
  switch (trigger.kind) {
    case "existing_tag":
      return trigger.status === "satisfied";
    case "direct_tag_step":
      return (
        trigger.status === "projected" &&
        nonblank(trigger.sourceStepId) &&
        route.steps.some((step) => step.stepId === trigger.sourceStepId)
      );
    case "trace_tag_step":
      return (
        trigger.status === "response_required" &&
        nonblank(trigger.sourceStepId) &&
        route.steps.some((step) => step.stepId === trigger.sourceStepId) &&
        nonNegativeInteger(trigger.traceLimit)
      );
    case "none":
      return (
        trigger.status === "not_required" && trigger.requiredRunnerTags === 0
      );
    case "unknown":
      return trigger.status === "unknown";
    default:
      return false;
  }
}

function validResponsePaymentEnvelope(
  route: CorpPunishRouteQuote,
  quoteSet: CorpPunishRouteQuoteSet,
  view: PlayerView,
): boolean {
  const envelope = route.responsePaymentEnvelope;
  return (
    (envelope.responseKind === "none" ||
      envelope.responseKind === "runner_optional" ||
      envelope.responseKind === "trace_bid" ||
      envelope.responseKind === "mixed" ||
      envelope.responseKind === "unknown") &&
    (envelope.paymentKnowledge === "exact_public" ||
      envelope.paymentKnowledge === "bounded_public" ||
      envelope.paymentKnowledge === "unknown") &&
    nonNegativeInteger(envelope.corpCreditsAvailable) &&
    envelope.corpCreditsAvailable === view.own.credits &&
    nonNegativeInteger(envelope.runnerCreditsVisible) &&
    envelope.runnerCreditsVisible === quoteSet.runnerCreditsVisible &&
    validRange(envelope.corpResponseCredits) &&
    validRange(envelope.totalCorpCredits) &&
    envelope.totalCorpCredits.minimum ===
      route.totalActionCredits + envelope.corpResponseCredits.minimum &&
    envelope.totalCorpCredits.maximum ===
      route.totalActionCredits + envelope.corpResponseCredits.maximum &&
    validRange(envelope.runnerResponseCredits) &&
    envelope.runnerResponseCredits.maximum <= quoteSet.runnerCreditsVisible
  );
}

function validDamageEnvelope(
  route: CorpPunishRouteQuote,
  quoteSet: CorpPunishRouteQuoteSet,
): boolean {
  const envelope = route.damageEnvelope;
  const raw = envelope.rawDamage;
  return (
    (envelope.visiblePrevention.knowledge === "none_visible" ||
      envelope.visiblePrevention.knowledge === "exact_public" ||
      envelope.visiblePrevention.knowledge === "bounded_public" ||
      envelope.visiblePrevention.knowledge === "unknown") &&
    (envelope.visiblePiercing.knowledge === "none_visible" ||
      envelope.visiblePiercing.knowledge === "exact_public" ||
      envelope.visiblePiercing.knowledge === "bounded_public" ||
      envelope.visiblePiercing.knowledge === "unknown") &&
    nonNegativeInteger(envelope.runnerHandCount) &&
    envelope.runnerHandCount === quoteSet.runnerHandCount &&
    nonNegativeInteger(raw.meat) &&
    nonNegativeInteger(raw.net) &&
    nonNegativeInteger(raw.core) &&
    nonNegativeInteger(raw.total) &&
    raw.total === raw.meat + raw.net + raw.core &&
    validRange(envelope.effectiveDamage) &&
    envelope.effectiveDamage.maximum <= raw.total &&
    nonNegativeInteger(envelope.visiblePrevention.maximumPreventableDamage) &&
    envelope.visiblePrevention.maximumPreventableDamage <= raw.total &&
    validRange(envelope.visiblePrevention.creditCost) &&
    nonNegativeInteger(envelope.visiblePiercing.maximumBypassedDamage) &&
    envelope.visiblePiercing.maximumBypassedDamage <= raw.total &&
    validRange(envelope.visiblePiercing.creditCost)
  );
}

function validPunishStepKind(
  value: CorpPunishRouteQuote["steps"][number]["kind"],
): boolean {
  return (
    value === "tag" ||
    value === "trace_tag" ||
    value === "meat_damage" ||
    value === "net_damage" ||
    value === "core_damage" ||
    value === "hardware_trash" ||
    value === "other_punish"
  );
}

function validRange(range: { minimum: number; maximum: number }): boolean {
  return (
    nonNegativeInteger(range.minimum) &&
    nonNegativeInteger(range.maximum) &&
    range.minimum <= range.maximum
  );
}

function zeroRange(range: { minimum: number; maximum: number }): boolean {
  return range.minimum === 0 && range.maximum === 0;
}

function punishRequestFingerprint(
  request: CorpPunishRouteQuote["requestEcho"],
): string {
  return encodePunishFingerprintParts([
    CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    request.matchId,
    request.side,
    String(request.stateVersion),
    request.timingPoint,
    request.campaignId,
    request.routeId,
    String(request.steps.length),
    ...request.steps.flatMap((step) => [
      step.stepId,
      String(step.order),
      step.kind,
      step.sourceCardInstanceId,
      step.sourceCapabilityBindingKind,
      step.sourceCapabilityId,
      ...(step.currentLegalActionId ? [step.currentLegalActionId] : []),
    ]),
  ]);
}

function encodePunishFingerprintParts(parts: readonly string[]): string {
  return `${parts.length};${parts
    .map((part) => `${part.length}:${part}`)
    .join("")}`;
}

function uniqueNonblankStrings(values: readonly string[]): boolean {
  return values.every(nonblank) && new Set(values).size === values.length;
}

function nonblank(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function nonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function isCorpPunishRouteIncompleteReason(
  value: CorpPunishRouteIncompleteReason,
): boolean {
  return (
    value === "malformed_route_request" ||
    value === "source_unavailable" ||
    value === "source_zone_unsupported" ||
    value === "source_identity_unknown" ||
    value === "source_capability_missing" ||
    value === "source_capability_unsupported" ||
    value === "source_effects_unsupported" ||
    value === "source_condition_unsatisfied" ||
    value === "head_legal_action_unavailable" ||
    value === "cost_quote_incomplete" ||
    value === "target_quote_incomplete" ||
    value === "response_window_unknown" ||
    value === "trash_prevention_quote_incomplete" ||
    value === "damage_prevention_quote_incomplete" ||
    value === "future_state_transition_unavailable"
  );
}
