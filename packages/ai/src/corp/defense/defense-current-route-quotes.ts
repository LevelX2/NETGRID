import type { AiDecisionInput } from "@netgrid/shared";
import { validOptionalRezModifierDefinitionIds } from "../../card-definition-id-input";
import { actionMatchesCurrentDecision } from "../../actions/current-legal-action";
import type { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";
import type { PlanSchedulerContext } from "../../plans/plan-scheduler";
import {
  exactCorpIceRezRoutesEqual,
  projectExactCorpIceRezRoute,
  type CorpExactIceRezRouteProjection,
} from "../../runtime/corp-exact-ice-rez-route";
import type { KnownCorpFundedIceInstallRouteProjection } from "../../runtime/corp-funded-score-protection";
import {
  canonicalSubtypeArray,
  canonicalSubtypeCsv,
  definitionIdListsAreDisjoint,
  knownNonNegativeInteger,
  selectedInstalledRezCreditsFromCurrentQuote,
  selectedPostInstallRezCreditsFromCurrentQuote,
  selectedRezCostsAreUnique,
  selectedRezCostSetsEqual,
  selectedRezAgendaPointCost,
  validMandatoryInstalledRezCosts,
  validPostInstallProjectedServerBinding,
  validPostInstallRezQuoteModifiers,
} from "./defense-validation";

export function exactIceRezRouteIsCurrent(
  context: PlanSchedulerContext,
  signal: CorpGenericDefenseSignal,
  route: CorpExactIceRezRouteProjection,
): boolean {
  if (
    route.targetServerId !== signal.serverId ||
    route.actionId !== signal.actionIds?.[0] ||
    signal.actionIds?.length !== 1 ||
    route.sourceCardInstanceId !== signal.targetIceInstanceId
  ) {
    return false;
  }
  const candidate = context.actionCandidates.find(
    (candidate) => candidate.actionId === route.actionId,
  );
  const sourceCard = context.input.playerView.servers
    .flatMap((server) => server.ice)
    .find((card) => card.instanceId === route.sourceCardInstanceId);
  if (!candidate || !sourceCard) return false;
  const expected = projectExactCorpIceRezRoute({
    input: context.input,
    candidate,
    sourceCard,
    targetServerId: signal.serverId,
    bluffDefenseNeed: route.bluffDefenseNeed,
  });
  return expected !== undefined && exactCorpIceRezRoutesEqual(route, expected);
}

export function exactInstallProjectionMatchesSignal(
  context: PlanSchedulerContext,
  signal: CorpGenericDefenseSignal,
  projection: KnownCorpFundedIceInstallRouteProjection,
): boolean {
  if (
    projection.knowledge !== "known" ||
    projection.actionId !== signal.actionIds?.[0] ||
    signal.actionIds.length !== 1 ||
    projection.targetServerId !== signal.serverId ||
    signal.sourceDefinitionIds.length !== 1 ||
    signal.sourceDefinitionIds[0] !== projection.sourceDefinitionId ||
    !exactInstallProjectionIsCurrent(
      context,
      projection,
      signal.installRoute?.progressKind === "staged_central_defense",
      signal.installRoute?.progressKind ===
        "scoreline_central_tax_allocation" ||
        signal.installRoute?.progressKind ===
          "score_material_capacity_release" ||
        signal.installRoute?.progressKind ===
          "agenda_capacity_defense_conversion" ||
        signal.installRoute?.progressKind ===
          "funded_structured_central_defense",
    )
  ) {
    return false;
  }
  return true;
}

export function exactInstallProjectionIsCurrent(
  context: PlanSchedulerContext,
  projection: KnownCorpFundedIceInstallRouteProjection,
  useMinimumSatisfyingRoute = false,
  useExactPostInstallSourceQuote = false,
): boolean {
  if (
    projection.knowledge !== "known" ||
    projection.before.knowledge !== "known" ||
    projection.after.knowledge !== "known" ||
    !knownNonNegativeInteger(context.input.playerView.own.credits) ||
    !knownNonNegativeInteger(context.input.playerView.own.clicks) ||
    !knownNonNegativeInteger(context.input.playerView.own.agendaPoints) ||
    projection.before.availableCorpCredits !==
      context.input.playerView.own.credits ||
    projection.before.availableCorpClicks !==
      context.input.playerView.own.clicks ||
    projection.before.availableCorpAgendaPoints !==
      context.input.playerView.own.agendaPoints ||
    projection.after.availableCorpAgendaPoints !==
      context.input.playerView.own.agendaPoints
  ) {
    return false;
  }
  const action = context.input.legalActions.find(
    (candidate) => candidate.actionId === projection.actionId,
  );
  const routeRezCosts =
    useMinimumSatisfyingRoute && projection.selectedRezCosts.length === 0
      ? (projection.after.minimumSatisfyingRezCosts ?? [])
      : projection.selectedRezCosts;
  const afterRouteRezCosts =
    useMinimumSatisfyingRoute && projection.selectedRezCosts.length === 0
      ? (projection.after.minimumSatisfyingRezCosts ?? [])
      : projection.after.selectedRezCosts;
  const projectedRezCost = routeRezCosts.find(
    (selected) =>
      selected.iceInstanceId === projection.sourceCardInstanceId &&
      selected.iceDefinitionId === projection.sourceDefinitionId &&
      selected.source === "engine_rez_cost_quote",
  );
  const projectedServerId =
    action?.payload?.postInstallRezQuoteProjectedServerId;
  const selectedPostInstallRezChoiceIsCurrent =
    action?.payload && projectedRezCost
      ? postInstallRezSelectionMatchesCurrentQuote(
          action.payload,
          projectedRezCost,
        )
      : useExactPostInstallSourceQuote &&
        action?.payload?.postInstallRezQuoteComplete === true;
  const routeAgendaPoints = selectedRezAgendaPointCost(routeRezCosts);
  const selectedAgendaPoints = selectedRezAgendaPointCost(
    projection.after.selectedRezCosts,
  );
  const pointBank = context.input.playerView.own.agendaPoints;
  const selectedAgendaPointsAreCurrent =
    routeAgendaPoints !== undefined &&
    routeAgendaPoints <= pointBank &&
    selectedAgendaPoints !== undefined &&
    selectedAgendaPoints <= pointBank &&
    selectedRezAgendaPointCost(projection.selectedRezCosts) ===
      selectedAgendaPoints &&
    projection.after.totalSelectedAgendaPointCost === selectedAgendaPoints &&
    projection.after.agendaPointsAfterDefense ===
      pointBank - selectedAgendaPoints;
  const selectedRezCostsAreCurrent =
    useExactPostInstallSourceQuote ||
    (selectedRezCostSetsEqual(routeRezCosts, afterRouteRezCosts) &&
      selectedRezCostsAreUnique(routeRezCosts) &&
      routeRezCosts.every((selected) =>
        selected.iceInstanceId === projection.sourceCardInstanceId
          ? selected === projectedRezCost
          : currentInstalledRezQuoteMatchesSelection(
              context,
              selected,
              projectedServerId,
            ),
      ));
  return (
    actionMatchesCurrentDecision(context.input, action) &&
    action.side === "corp" &&
    action.type === "install_card" &&
    action.source === projection.sourceCardInstanceId &&
    action.payload?.placement === "ice" &&
    action.payload.cardId === projection.sourceCardInstanceId &&
    action.payload.serverId === projection.targetServerId &&
    action.payload.postInstallRezQuoteComplete === true &&
    action.payload.postInstallRezQuoteCardId ===
      projection.sourceCardInstanceId &&
    action.payload.postInstallRezQuoteTargetServerId ===
      projection.targetServerId &&
    action.payload.postInstallRezQuoteExpiresAtStateVersion ===
      context.input.playerView.stateVersion &&
    validPostInstallProjectedServerBinding(
      projection.targetServerId,
      action.payload.postInstallRezQuoteProjectedServerId,
    ) &&
    knownNonNegativeInteger(action.payload.postInstallRezQuoteBaseCredits) &&
    knownNonNegativeInteger(action.payload.postInstallRezQuoteFinalCredits) &&
    knownNonNegativeInteger(
      action.payload.postInstallRezQuoteMandatoryAgendaPointCost,
    ) &&
    action.payload.postInstallRezQuoteMandatoryAgendaPointCost <= pointBank &&
    action.payload.postInstallRezQuoteMandatoryAdditionalCostKind ===
      (action.payload.postInstallRezQuoteMandatoryAgendaPointCost > 0
        ? "agenda_point"
        : undefined) &&
    validPostInstallRezQuoteModifiers(action.payload) &&
    selectedPostInstallRezChoiceIsCurrent &&
    selectedAgendaPointsAreCurrent &&
    selectedRezCostsAreCurrent &&
    legalActionResourceCost(action, "credits") === projection.installCredits &&
    legalActionResourceCost(action, "clicks") === projection.installClicks
  );
}

function currentInstalledRezQuoteMatchesSelection(
  context: PlanSchedulerContext,
  selected: KnownCorpFundedIceInstallRouteProjection["selectedRezCosts"][number],
  projectedServerId: unknown,
): boolean {
  if (
    typeof projectedServerId !== "string" ||
    selected.source !== "engine_rez_cost_quote"
  ) {
    return false;
  }
  const matches = context.input.playerView.servers.flatMap((server) =>
    server.ice
      .filter((ice) => ice.instanceId === selected.iceInstanceId)
      .map((ice) => ({ ice, serverId: server.id })),
  );
  if (matches.length !== 1) return false;
  const match = matches[0]!;
  const quote = match.ice.effectiveRezCostQuote;
  const selectedInstalledRezCredits =
    quote?.complete === true
      ? selectedInstalledRezCreditsFromCurrentQuote(quote)
      : undefined;
  if (
    match.serverId !== projectedServerId ||
    match.ice.known !== true ||
    match.ice.type !== "ice" ||
    match.ice.definitionId !== selected.iceDefinitionId ||
    match.ice.rezzed !== false ||
    quote?.context !== "installed" ||
    quote.complete !== true ||
    quote.cardId !== selected.iceInstanceId ||
    quote.targetServerId !== projectedServerId ||
    quote.projectedServerId !== projectedServerId ||
    quote.expiresAtStateVersion !== context.input.playerView.stateVersion ||
    !knownNonNegativeInteger(quote.baseCredits) ||
    !knownNonNegativeInteger(quote.finalCredits) ||
    selectedInstalledRezCredits === undefined ||
    selectedInstalledRezCredits !== selected.credits ||
    !validMandatoryInstalledRezCosts(quote.mandatoryAdditionalCosts) ||
    (selected.agendaPoints ?? 0) !==
      quote.mandatoryAdditionalCosts.agendaPoints ||
    !validOptionalRezModifierDefinitionIds(quote.reductionSourceDefinitionIds) ||
    !validOptionalRezModifierDefinitionIds(quote.increaseSourceDefinitionIds)
  ) {
    return false;
  }
  const reductions = quote.reductionSourceDefinitionIds ?? [];
  const increases = quote.increaseSourceDefinitionIds ?? [];
  return (
    definitionIdListsAreDisjoint(reductions, increases) &&
    (quote.baseCredits === quote.finalCredits ||
      reductions.length + increases.length > 0)
  );
}

function postInstallRezSelectionMatchesCurrentQuote(
  payload: NonNullable<AiDecisionInput["legalActions"][number]["payload"]>,
  selection: KnownCorpFundedIceInstallRouteProjection["selectedRezCosts"][number],
): boolean {
  if (
    (selection.agendaPoints ?? 0) !==
    payload.postInstallRezQuoteMandatoryAgendaPointCost
  ) {
    return false;
  }
  if (payload.postInstallRezQuoteCostKind === "fixed") {
    return (
      selection.variableRezChoice === undefined &&
      selection.credits ===
        selectedPostInstallRezCreditsFromCurrentQuote(payload)
    );
  }
  if (payload.postInstallRezQuoteCostKind !== "variable") return false;
  const choice = selection.variableRezChoice;
  if (!choice) {
    return (
      selection.credits ===
      selectedPostInstallRezCreditsFromCurrentQuote(payload)
    );
  }
  if (choice.kind === "x_strength") {
    return (
      payload.postInstallRezQuoteVariableRezKind === "x_strength" &&
      choice.value === payload.postInstallRezQuoteVariableMinValue &&
      selection.credits ===
        selectedPostInstallRezCreditsFromCurrentQuote(payload)
    );
  }
  if (choice.kind === "paid_end_the_run_subroutines") {
    return (
      choice.subroutineCount ===
        payload.postInstallRezQuoteVariableFirstEndTheRunSubroutineCount &&
      selection.credits ===
        selectedPostInstallRezCreditsFromCurrentQuote(payload)
    );
  }
  if (
    choice.kind !== "alternate_subtype" ||
    payload.postInstallRezQuoteVariableRezKind !== "alternate_subtype"
  ) {
    return false;
  }
  const selectedSubtypes = canonicalSubtypeArray(choice.selectedSubtypes);
  const baseSubtypes = canonicalSubtypeCsv(
    payload.postInstallRezQuoteVariableBaseSubtypes,
  );
  const alternateSubtypes = canonicalSubtypeCsv(
    payload.postInstallRezQuoteVariableAlternateSubtypes,
  );
  if (!selectedSubtypes || !baseSubtypes || !alternateSubtypes) return false;
  const selectedKey = selectedSubtypes.join(",");
  if (selectedKey === baseSubtypes.join(",")) {
    return (
      selection.credits ===
      payload.postInstallRezQuoteVariableBaseSubtypesFinalCredits
    );
  }
  return (
    selectedKey === alternateSubtypes.join(",") &&
    selection.credits ===
      payload.postInstallRezQuoteVariableAlternateSubtypesFinalCredits
  );
}

export function legalActionResourceCost(
  action: AiDecisionInput["legalActions"][number],
  resource: "credits" | "clicks",
): number | undefined {
  let total = 0;
  for (const cost of action.costs) {
    const amount = cost[resource] ?? 0;
    if (!knownNonNegativeInteger(amount)) return undefined;
    total += amount;
    if (!Number.isSafeInteger(total)) return undefined;
  }
  return total;
}
