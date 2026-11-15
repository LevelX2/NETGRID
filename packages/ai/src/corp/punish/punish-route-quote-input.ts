import {
  CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
  type AiDecisionInput,
  type CorpPunishRouteIncompleteReason,
  type CorpPunishRouteQuote,
  type CorpPunishRouteQuoteRequest,
  type CorpPunishRouteQuoteResult,
  type CorpPunishRouteQuoteSet,
  type CorpPunishRouteStepKind,
  type LegalAction,
  type PlayerView,
  type VisibleCard,
} from "@netgrid/shared";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { sanitizeCorpPunishRouteQuoteSet } from "../../input-dto";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  corpDirectTagOperationProfile,
  corpPunishFixedCapabilityCost,
  corpInstalledHardwareTrashOperationProfile,
  corpTaggedCreditDenialOperationProfile,
  corpTraceTagSourceProfile,
  corpScoredTraceTagSourceProfile,
  corpTaggedMeatDamageOperationProfile,
  corpScoredTaggedMeatDamageProfile,
  corpInstalledTaggedMeatDamageProfile,
} from "../../runtime/corp-canonical-card-facts";
import { currentLegalActionResourceCost } from "../../runtime/visible-action-facts";
import { PUNISH_PAYOFF_CAMPAIGN_ID } from "./punish-types";

const MAX_PUNISH_ROUTES = 8;
const MAX_PUNISH_ROUTE_STEPS = 6;

type PunishComponentAdapter = {
  kind: Extract<
    CorpPunishRouteStepKind,
    "tag" | "trace_tag" | "meat_damage" | "hardware_trash" | "other_punish"
  >;
  definitionId: string;
  routeOrder: number;
  sourceCapabilityBindingKind: "card_spec_capability_key";
  sourceCapabilityId: string;
  agendaPointCost?: number;
  damageAmount?: number;
};

/**
 * A semantic adapter only states which visible Engine capability may be
 * probed. Printed costs and damage guide the request shortlist. Only the
 * Engine quote can certify the route's actual costs and outcomes.
 */
type VisiblePunishComponent = {
  card: VisibleCard;
  adapter: PunishComponentAdapter;
  fixedCost?: { clicks: number; credits: number };
  headAction?: LegalAction;
};

export type QuoteCorpPunishRoute = (
  request: CorpPunishRouteQuoteRequest,
) => CorpPunishRouteQuoteResult;

export function withDecisionLocalCorpPunishRouteQuotes(
  input: AiDecisionInput,
  quoteCorpPunishRoute: QuoteCorpPunishRoute | undefined,
): AiDecisionInput {
  if (
    input.side !== "corp" ||
    input.playerView.side !== "corp" ||
    input.playerView.corpPunishRouteQuoteSet !== undefined ||
    !quoteCorpPunishRoute
  ) {
    return input;
  }
  const requests = buildBoundedCorpPunishRouteRequests(input);
  if (requests.length === 0) return input;

  const validQuotes: CorpPunishRouteQuote[] = [];
  for (const request of requests) {
    let result: CorpPunishRouteQuoteResult;
    try {
      result = quoteCorpPunishRoute(structuredClone(request));
    } catch {
      throw punishQuoteFailure(input, request, "provider_threw");
    }
    if (result?.ok !== true) {
      throw punishQuoteFailure(
        input,
        request,
        result?.ok === false ? "request_rejected" : "invalid_response_schema",
      );
    }
    if (!quoteMatchesRequest(result.quote, request)) {
      throw punishQuoteFailure(input, request, "response_binding_mismatch");
    }
    const sanitized = sanitizeSingleQuote(input.playerView, result.quote);
    if (!sanitized) {
      throw punishQuoteFailure(input, request, "invalid_response_schema");
    }
    validQuotes.push(sanitized);
  }
  const quoteSet = sanitizedDecisionQuoteSet(input.playerView, validQuotes);
  if (!quoteSet) {
    throw punishQuoteFailure(input, requests[0]!, "invalid_response_schema");
  }
  return {
    ...input,
    playerView: {
      ...input.playerView,
      corpPunishRouteQuoteSet: quoteSet,
    },
  };
}

export function buildBoundedCorpPunishRouteRequests(
  input: AiDecisionInput,
): CorpPunishRouteQuoteRequest[] {
  if (
    input.side !== "corp" ||
    input.playerView.side !== "corp" ||
    input.playerView.activeSide !== "corp" ||
    input.playerView.timingPoint !== "corp_action.main" ||
    typeof input.matchId !== "string" ||
    input.matchId.trim().length === 0
  ) {
    return [];
  }
  const components = [
    ...input.playerView.own.gripOrHq.map((card) =>
      visiblePunishComponent(input, card, "hq"),
    ),
    ...input.playerView.own.scoreArea.map((card) =>
      visiblePunishComponent(input, card, "scoreArea"),
    ),
    ...input.playerView.servers
      .filter((server) => server.id !== "archives")
      .flatMap((server) => server.root)
      .map((card) => visiblePunishComponent(input, card, "installed")),
  ]
    .filter(
      (component): component is VisiblePunishComponent =>
        component !== undefined,
    )
    .sort(
      (left, right) =>
        left.adapter.routeOrder - right.adapter.routeOrder ||
        left.card.instanceId.localeCompare(right.card.instanceId),
    );
  const tags = components.filter(
    (component) =>
      component.adapter.kind === "tag" ||
      component.adapter.kind === "trace_tag",
  );
  const damage = components.filter(
    (component) =>
      component.adapter.kind === "meat_damage" &&
      component.adapter.agendaPointCost === undefined,
  );
  const agendaFundedHeads = new Map<string, string>();
  const agendaFundedDamageRoutes = components.flatMap((component) => {
    const agendaPointCost = component.adapter.agendaPointCost;
    if (agendaPointCost === undefined) return [];
    const action = input.legalActions.find(
      (candidate) =>
        candidate.side === "corp" &&
        candidate.type === "gain_credit" &&
        candidate.source === component.card.instanceId &&
        candidate.payload?.cardId === component.card.instanceId &&
        candidate.payload?.v1920AssetAbility === "tagged_meat_damage" &&
        candidate.payload.agendaPointCost === agendaPointCost &&
        candidate.timingPoint === input.playerView.timingPoint &&
        candidate.expiresAtStateVersion === input.playerView.stateVersion,
    );
    if (!action) return [];
    agendaFundedHeads.set(component.card.instanceId, action.actionId);
    return [[{ ...component, headAction: action }]];
  });
  const otherPunish = components.filter(
    (component) =>
      component.adapter.kind === "other_punish" ||
      component.adapter.kind === "hardware_trash",
  );
  const standaloneTagRoutes = tags.map((component) => [component]);
  const tagHeads =
    input.playerView.opponent.tags > 0
      ? [undefined]
      : tags.length > 0
        ? tags
        : [];
  if (tagHeads.length === 0) return [];

  const damageRouteComponents = tagHeads.flatMap((tag) => {
    const maximumDamageSteps = MAX_PUNISH_ROUTE_STEPS - (tag ? 1 : 0);
    return boundedDamageCombinations(
      input.playerView,
      damage,
      maximumDamageSteps,
      tag,
    );
  });
  const otherPunishRouteComponents = tagHeads.flatMap((tag) =>
    otherPunish.map((payoff) => [...(tag ? [tag] : []), payoff]),
  );
  const routeComponents = [
    ...agendaFundedDamageRoutes,
    ...standaloneTagRoutes,
    ...damageRouteComponents,
    ...otherPunishRouteComponents,
  ];
  const selectedRoutes = selectBoundedRoutes(
    input.playerView,
    routeComponents,
    [
      agendaFundedDamageRoutes,
      standaloneTagRoutes.filter(([tag]) => tag?.headAction !== undefined),
      otherPunishRouteComponents.filter(
        (route) => route.at(-1)?.adapter.kind === "other_punish",
      ),
      otherPunishRouteComponents.filter(
        (route) => route.at(-1)?.adapter.kind === "hardware_trash",
      ),
    ],
  );
  return selectedRoutes.map((route, routeIndex) => {
    const routeId = `engine-certified-payoff:${routeIndex}:${route
      .map((component) => component.card.instanceId)
      .join("+")}`;
    return {
      schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
      matchId: input.matchId!,
      side: "corp",
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      campaignId: PUNISH_PAYOFF_CAMPAIGN_ID,
      routeId,
      steps: route.map((component, order) => {
        const currentLegalActionId =
          order === 0 && component.adapter.kind === "hardware_trash"
            ? currentHardwareTrashActionId(input, component.card.instanceId)
            : order === 0 && component.adapter.kind === "tag"
              ? currentDirectTagActionId(input, component.card.instanceId)
              : agendaFundedHeads.get(component.card.instanceId);
        return {
          stepId: `${routeId}:step:${order}`,
          order,
          kind: component.adapter.kind,
          sourceCardInstanceId: component.card.instanceId,
          sourceCapabilityBindingKind:
            component.adapter.sourceCapabilityBindingKind,
          sourceCapabilityId: component.adapter.sourceCapabilityId,
          ...(currentLegalActionId ? { currentLegalActionId } : {}),
        };
      }),
    };
  });
}

function currentDirectTagActionId(
  input: AiDecisionInput,
  sourceCardInstanceId: string,
): string | undefined {
  return input.legalActions
    .filter(
      (action) =>
        action.side === "corp" &&
        action.type === "play_operation" &&
        action.source === sourceCardInstanceId &&
        action.payload?.cardId === sourceCardInstanceId &&
        action.timingPoint === input.playerView.timingPoint &&
        action.expiresAtStateVersion === input.playerView.stateVersion &&
        action.targetRequirements.length === 0 &&
        (action.choiceRequirements?.length ?? 0) === 0,
    )
    .sort(
      (left, right) =>
        legalActionCreditCost(left) - legalActionCreditCost(right) ||
        left.actionId.localeCompare(right.actionId),
    )[0]?.actionId;
}

function currentHardwareTrashActionId(
  input: AiDecisionInput,
  sourceCardInstanceId: string,
): string | undefined {
  return input.legalActions
    .filter((action) => {
      const trashCount = action.payload?.hardwareTrashByCounterTrashCount;
      return (
        action.side === "corp" &&
        action.type === "play_operation" &&
        action.source === sourceCardInstanceId &&
        action.payload?.cardId === sourceCardInstanceId &&
        action.timingPoint === input.playerView.timingPoint &&
        action.expiresAtStateVersion === input.playerView.stateVersion &&
        action.targetRequirements.length === 0 &&
        (action.choiceRequirements?.length ?? 0) === 0 &&
        typeof trashCount === "number" &&
        Number.isSafeInteger(trashCount) &&
        trashCount > 0
      );
    })
    .sort(
      (left, right) =>
        legalActionCreditCost(left) - legalActionCreditCost(right) ||
        left.actionId.localeCompare(right.actionId),
    )[0]?.actionId;
}

function legalActionCreditCost(
  action: AiDecisionInput["legalActions"][number],
): number {
  return currentLegalActionResourceCost(action, "credits");
}

function visiblePunishComponent(
  input: AiDecisionInput,
  card: VisibleCard,
  sourceZone: "hq" | "scoreArea" | "installed",
): VisiblePunishComponent | undefined {
  if (
    card.known !== true ||
    card.owner !== "corp" ||
    card.controller !== "corp" ||
    (sourceZone === "installed"
      ? card.rezzed !== true ||
        (card.type !== "asset" && card.type !== "upgrade")
      : card.type !== (sourceZone === "scoreArea" ? "agenda" : "operation")) ||
    typeof card.definitionId !== "string"
  ) {
    return undefined;
  }
  const adapter = structuredPunishComponentAdapter(card.definitionId);
  if (!adapter) return undefined;
  const headAction = input.legalActions.find(
    (action) =>
      action.side === "corp" &&
      action.source === card.instanceId &&
      action.payload?.cardId === card.instanceId &&
      action.timingPoint === input.playerView.timingPoint &&
      action.expiresAtStateVersion === input.playerView.stateVersion &&
      action.targetRequirements.length === 0 &&
      (action.choiceRequirements?.length ?? 0) === 0 &&
      (sourceZone === "hq"
        ? action.type === "play_operation"
        : action.type === "activated_card_ability" &&
          action.payload.cardImplementationAbilityId ===
            adapter.sourceCapabilityId),
  );
  const fixedCost =
    adapter.agendaPointCost === undefined
      ? corpPunishFixedCapabilityCost(
          card.definitionId,
          adapter.sourceCapabilityId,
        )
      : undefined;
  return {
    card,
    adapter,
    ...(headAction ? { headAction } : {}),
    ...(fixedCost ? { fixedCost } : {}),
  };
}

function structuredPunishComponentAdapter(
  definitionId: string,
): PunishComponentAdapter | undefined {
  return (
    structuredTraceTagAdapter(definitionId) ??
    structuredHardwareTrashAdapter(definitionId) ??
    structuredDirectTagAdapter(definitionId) ??
    structuredTaggedCreditDenialAdapter(definitionId) ??
    structuredTaggedDamageAdapter(definitionId)
  );
}

/**
 * Discovers reviewed finite Trace -> tag heads without assigning any trace
 * strength, bid or cost in the AI layer. The Engine remains responsible for
 * certifying the exact current action and the complete response window.
 */
function structuredTraceTagAdapter(
  definitionId: string,
): PunishComponentAdapter | undefined {
  const profile =
    corpTraceTagSourceProfile(definitionId) ??
    corpScoredTraceTagSourceProfile(definitionId);
  if (!profile) return undefined;
  return {
    definitionId,
    kind: "trace_tag",
    routeOrder: 1,
    sourceCapabilityBindingKind: "card_spec_capability_key",
    sourceCapabilityId: profile.sourceCapabilityId,
  };
}

/**
 * Discovers the Power-Grid family from reviewed semantic hints. The visible
 * definition id only joins the visible card to its hint record; no concrete
 * card id, title, rules text or visible printed cost determines the role.
 * The Engine subsequently proves the exact corpUtility capability.
 */
function structuredHardwareTrashAdapter(
  definitionId: string,
): PunishComponentAdapter | undefined {
  const profile = corpInstalledHardwareTrashOperationProfile(definitionId);
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  if (
    !profile ||
    !hint ||
    hint.side !== "corp" ||
    hint.cardType !== "operation" ||
    hint.planRoles?.includes("tag_punish") !== true ||
    hint.conditions?.some(
      (condition) => condition.kind === "requires_runner_tagged",
    ) !== true ||
    hint.conditions.some(
      (condition) => condition.kind === "requires_installed_hardware",
    ) !== true ||
    hint.effects?.some(
      (effect) =>
        effect.kind === "hardware_trash" &&
        effect.scope === "runner" &&
        effect.timing === "action" &&
        effect.finite === true,
    ) !== true ||
    hint.effects.some(
      (effect) =>
        effect.kind === "tag_punish_payoff" &&
        effect.scope === "runner" &&
        effect.timing === "action" &&
        effect.finite === true,
    ) !== true
  ) {
    return undefined;
  }
  return {
    definitionId,
    kind: "hardware_trash",
    routeOrder: 6,
    sourceCapabilityBindingKind: "card_spec_capability_key",
    sourceCapabilityId: profile.sourceCapabilityId,
  };
}

function structuredDirectTagAdapter(
  definitionId: string,
): PunishComponentAdapter | undefined {
  const profile = corpDirectTagOperationProfile(definitionId);
  return profile
    ? {
        definitionId,
        kind: "tag",
        routeOrder: 0,
        sourceCapabilityBindingKind: "card_spec_capability_key",
        sourceCapabilityId: profile.sourceCapabilityId,
      }
    : undefined;
}

function structuredTaggedCreditDenialAdapter(
  definitionId: string,
): PunishComponentAdapter | undefined {
  const profile = corpTaggedCreditDenialOperationProfile(definitionId);
  return profile
    ? {
        definitionId,
        kind: "other_punish",
        routeOrder: 5,
        sourceCapabilityBindingKind: "card_spec_capability_key",
        sourceCapabilityId: profile.sourceCapabilityId,
      }
    : undefined;
}

function structuredTaggedDamageAdapter(
  definitionId: string,
): PunishComponentAdapter | undefined {
  const profile =
    corpTaggedMeatDamageOperationProfile(definitionId) ??
    corpScoredTaggedMeatDamageProfile(definitionId) ??
    corpInstalledTaggedMeatDamageProfile(definitionId);
  return profile
    ? {
        definitionId,
        kind: "meat_damage",
        routeOrder: 10,
        sourceCapabilityBindingKind: "card_spec_capability_key",
        sourceCapabilityId: profile.sourceCapabilityId,
        damageAmount: profile.damageAmount,
        ...(profile.agendaPointCost !== undefined
          ? { agendaPointCost: profile.agendaPointCost }
          : {}),
      }
    : undefined;
}

function boundedDamageCombinations(
  view: PlayerView,
  damage: readonly VisiblePunishComponent[],
  maximumSteps: number,
  tag: VisiblePunishComponent | undefined,
): VisiblePunishComponent[][] {
  const prefix = tag ? [tag] : [];
  const byLength: VisiblePunishComponent[][][] = [[prefix]];
  const orderedDamage = damage
    .slice()
    .sort(
      (left, right) =>
        Number(right.headAction !== undefined) -
          Number(left.headAction !== undefined) ||
        (right.adapter.damageAmount ?? 0) - (left.adapter.damageAmount ?? 0) ||
        left.card.instanceId.localeCompare(right.card.instanceId),
    );
  // Retain a bounded shortlist at each length. Visiting each card once
  // preserves the number of available copies without enumerating permutations.
  for (const component of orderedDamage) {
    for (let length = maximumSteps; length > 0; length -= 1) {
      const shorter = byLength[length - 1];
      if (!shorter) continue;
      byLength[length] = bestRouteProbes(view, [
        ...(byLength[length] ?? []),
        ...shorter.map((route) => [...route, component]),
      ]).slice(0, MAX_PUNISH_ROUTES);
    }
  }
  return byLength.slice(1).flat();
}

function selectBoundedRoutes(
  view: PlayerView,
  routes: readonly VisiblePunishComponent[][],
  protectedGroups: readonly VisiblePunishComponent[][][],
): VisiblePunishComponent[][] {
  const unique = uniqueRouteProbes(routes);
  if (unique.length <= MAX_PUNISH_ROUTES) return unique;
  const protectedRoutes = protectedGroups.flatMap((group) =>
    bestRouteProbes(view, group).slice(0, 1),
  );
  return uniqueRouteProbes([
    ...protectedRoutes,
    ...bestRouteProbes(view, unique),
  ]).slice(0, MAX_PUNISH_ROUTES);
}

function bestRouteProbes(
  view: PlayerView,
  routes: readonly VisiblePunishComponent[][],
): VisiblePunishComponent[][] {
  return uniqueRouteProbes(routes)
    .map((route) => ({ route, ...routeProbeOrder(view, route) }))
    .sort(
      (left, right) =>
        left.horizon - right.horizon ||
        Number(right.lethal) - Number(left.lethal) ||
        (left.lethal && right.lethal
          ? left.clicks - right.clicks || left.credits - right.credits
          : right.damage - left.damage) ||
        left.clicks - right.clicks ||
        left.credits - right.credits ||
        routeComponentKey(left.route).localeCompare(
          routeComponentKey(right.route),
        ),
    )
    .map(({ route }) => route);
}

function routeProbeOrder(view: PlayerView, route: VisiblePunishComponent[]) {
  const head = route[0]!;
  const damage = route.reduce(
    (sum, component) => sum + (component.adapter.damageAmount ?? 0),
    0,
  );
  let clicks = 0;
  let credits = 0;
  let costUnknown = false;
  for (const [index, component] of route.entries()) {
    const action = index === 0 ? component.headAction : undefined;
    if (action) {
      clicks += currentLegalActionResourceCost(action, "clicks");
      credits += currentLegalActionResourceCost(action, "credits");
    } else if (component.fixedCost) {
      clicks += component.fixedCost.clicks;
      credits += component.fixedCost.credits;
    } else {
      costUnknown = true;
    }
  }
  const current = head.headAction !== undefined;
  const headNeedsFunding =
    head.fixedCost !== undefined && head.fixedCost.credits > view.own.credits;
  let horizon = 3;
  if (
    clicks <= view.own.clicks &&
    (current || headNeedsFunding || !head.fixedCost)
  ) {
    horizon = costUnknown
      ? 2
      : current && credits <= view.own.credits
        ? 0
        : clicks < view.own.clicks
          ? 1
          : 3;
  }
  return {
    horizon,
    lethal: damage > view.opponent.handCount,
    damage,
    clicks,
    credits,
  };
}

function uniqueRouteProbes(
  routes: readonly VisiblePunishComponent[][],
): VisiblePunishComponent[][] {
  const byKey = new Map<string, VisiblePunishComponent[]>();
  for (const route of routes) {
    const key = route
      .map((component, index) =>
        component.card.type === "operation" && component.fixedCost
          ? JSON.stringify([
              component.adapter.sourceCapabilityId,
              index === 0 && component.headAction
                ? component.headAction.costs
                : undefined,
            ])
          : component.card.instanceId,
      )
      .join("\u0000");
    if (!byKey.has(key)) byKey.set(key, route);
  }
  return [...byKey.values()];
}

function routeComponentKey(route: readonly VisiblePunishComponent[]): string {
  return route.map((component) => component.card.instanceId).join("\u0000");
}

const PUNISH_QUOTE_FAILURE_REMEDIATIONS = {
  provider_threw: "Return a structured result for the bound Corp Punish Engine quote request.",
  request_rejected: "Bind the Corp Punish Engine quote request to the current match, state and action window.",
  response_binding_mismatch: "Echo the exact Corp Punish Engine quote request and step bindings.",
  invalid_response_schema: "Return a side-safe Corp Punish Engine quote conforming to the quote schema.",
} as const;

function punishQuoteFailure(
  input: AiDecisionInput,
  request: CorpPunishRouteQuoteRequest,
  reason: keyof typeof PUNISH_QUOTE_FAILURE_REMEDIATIONS,
): PlanResolutionFailure {
  const stepId = request.steps[0]?.stepId;
  return new PlanResolutionFailure("engine_quote_contract_failed", {
    side: input.side,
    stateVersion: request.stateVersion,
    timingPoint: request.timingPoint,
    legalActionTypes: input.legalActions.map((action) => action.type),
    unresolvedActionIds: request.steps.flatMap((step) =>
      step.currentLegalActionId ? [step.currentLegalActionId] : [],
    ),
    owner: "rules_contract",
    removalCondition: `corp_punish_quote:${reason}. ${PUNISH_QUOTE_FAILURE_REMEDIATIONS[reason]}`,
    ...(stepId ? { stepId } : {}),
  });
}

function quoteMatchesRequest(
  quote: CorpPunishRouteQuote,
  request: CorpPunishRouteQuoteRequest,
): boolean {
  return (
    quote != null &&
    quote.requestEcho != null &&
    Array.isArray(quote.requestEcho.steps) &&
    quote.matchId === request.matchId &&
    quote.side === request.side &&
    quote.stateVersion === request.stateVersion &&
    quote.timingPoint === request.timingPoint &&
    quote.campaignId === request.campaignId &&
    quote.routeId === request.routeId &&
    quote.requestEcho.matchId === request.matchId &&
    quote.requestEcho.side === request.side &&
    quote.requestEcho.stateVersion === request.stateVersion &&
    quote.requestEcho.timingPoint === request.timingPoint &&
    quote.requestEcho.campaignId === request.campaignId &&
    quote.requestEcho.routeId === request.routeId &&
    quote.requestEcho.steps.length === request.steps.length &&
    quote.requestEcho.steps.every((echoed, index) => {
      const requested = request.steps[index];
      return (
        requested !== undefined &&
        echoed != null &&
        echoed.stepId === requested.stepId &&
        echoed.order === requested.order &&
        echoed.kind === requested.kind &&
        echoed.sourceCardInstanceId === requested.sourceCardInstanceId &&
        echoed.sourceCapabilityBindingKind ===
          requested.sourceCapabilityBindingKind &&
        echoed.sourceCapabilityId === requested.sourceCapabilityId &&
        echoed.currentLegalActionId === requested.currentLegalActionId
      );
    })
  );
}

function sanitizeSingleQuote(
  view: PlayerView,
  quote: CorpPunishRouteQuote,
): CorpPunishRouteQuote | undefined {
  const quoteSet = quoteSetForRoutes(view, true, [], [quote]);
  return sanitizeQuoteSet(view, quoteSet)?.routes[0];
}

function sanitizedDecisionQuoteSet(
  view: PlayerView,
  quotes: readonly CorpPunishRouteQuote[],
): CorpPunishRouteQuoteSet | undefined {
  const completeRoutes = quotes.filter((quote) => quote.complete);
  if (completeRoutes.length > 0) {
    return sanitizeQuoteSet(
      view,
      quoteSetForRoutes(view, true, [], quotes.slice()),
    );
  }
  const incompleteReasons = uniqueIncompleteReasons(
    quotes.flatMap((quote) => quote.incompleteReasons),
  );
  if (incompleteReasons.length === 0) return undefined;
  return sanitizeQuoteSet(
    view,
    quoteSetForRoutes(view, false, incompleteReasons, []),
  );
}

function quoteSetForRoutes(
  view: PlayerView,
  complete: boolean,
  incompleteReasons: CorpPunishRouteIncompleteReason[],
  routes: CorpPunishRouteQuote[],
): CorpPunishRouteQuoteSet {
  return {
    schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    visibility: "private_to_actor",
    side: "corp",
    stateVersion: view.stateVersion,
    timingPoint: view.timingPoint,
    complete,
    incompleteReasons,
    runnerHandCount: view.opponent.handCount,
    runnerTags: view.opponent.tags,
    runnerCreditsVisible: view.opponent.credits,
    routes,
  };
}

function sanitizeQuoteSet(
  view: PlayerView,
  quoteSet: CorpPunishRouteQuoteSet,
): CorpPunishRouteQuoteSet | undefined {
  return sanitizeCorpPunishRouteQuoteSet({
    ...view,
    corpPunishRouteQuoteSet: quoteSet,
  });
}

function uniqueIncompleteReasons(
  reasons: readonly CorpPunishRouteIncompleteReason[],
): CorpPunishRouteIncompleteReason[] {
  return [...new Set(reasons)].sort();
}
