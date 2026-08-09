import {
  CORP_HARDWARE_TRASH_PUNISH_CAPABILITY_ID,
  CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
  type AiDecisionInput,
  type CorpPunishRouteIncompleteReason,
  type CorpPunishRouteQuote,
  type CorpPunishRouteQuoteRequest,
  type CorpPunishRouteQuoteResult,
  type CorpPunishRouteQuoteSet,
  type CorpPunishRouteStepKind,
  type PlayerView,
  type VisibleCard,
} from "@netgrid/shared";
import { AI_HINTS_BY_CARD } from "../ai-hints";
import { sanitizeCorpPunishRouteQuoteSet } from "../input-dto";

const MAX_PUNISH_ROUTES = 8;
const MAX_PUNISH_ROUTE_STEPS = 6;
const PUNISH_CAMPAIGN_ID = "corp-punish:engine-certified-payoff";
const ON_PLAY_CAPABILITY_ID = "ability:on_play:0";

type PunishComponentAdapter = {
  kind: Extract<
    CorpPunishRouteStepKind,
    "tag" | "trace_tag" | "meat_damage" | "hardware_trash" | "other_punish"
  >;
  definitionId: string;
  routeOrder: number;
  sourceCapabilityId:
    | typeof ON_PLAY_CAPABILITY_ID
    | typeof CORP_HARDWARE_TRASH_PUNISH_CAPABILITY_ID;
};

/**
 * A semantic adapter only states which visible Engine capability may be
 * probed. It never supplies costs, damage totals or condition outcomes; those
 * remain state-bound Engine-quote facts.
 */
type VisiblePunishComponent = {
  card: VisibleCard;
  adapter: PunishComponentAdapter;
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
      continue;
    }
    if (!result.ok || !quoteMatchesRequest(result.quote, request)) continue;
    const sanitized = sanitizeSingleQuote(input.playerView, result.quote);
    if (sanitized) validQuotes.push(sanitized);
  }
  const quoteSet = sanitizedDecisionQuoteSet(input.playerView, validQuotes);
  if (!quoteSet) return input;
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
    typeof input.matchId !== "string" ||
    input.matchId.trim().length === 0
  ) {
    return [];
  }
  const components = input.playerView.own.gripOrHq
    .map(visiblePunishComponent)
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
    (component) => component.adapter.kind === "meat_damage",
  );
  const otherPunish = components.filter(
    (component) =>
      component.adapter.kind === "other_punish" ||
      component.adapter.kind === "hardware_trash",
  );
  if (damage.length === 0 && otherPunish.length === 0) return [];
  const tagHeads =
    input.playerView.opponent.tags > 0
      ? [undefined]
      : tags.length > 0
        ? tags
        : [];
  if (tagHeads.length === 0) return [];

  const damageRouteComponents = tagHeads.flatMap((tag) => {
    const maximumDamageSteps = MAX_PUNISH_ROUTE_STEPS - (tag ? 1 : 0);
    return boundedDamageCombinations(damage, maximumDamageSteps).map(
      (damageSteps) => [...(tag ? [tag] : []), ...damageSteps],
    );
  });
  const otherPunishRouteComponents = tagHeads.flatMap((tag) =>
    otherPunish.map((payoff) => [...(tag ? [tag] : []), payoff]),
  );
  const routeComponents = [
    ...damageRouteComponents,
    ...otherPunishRouteComponents,
  ];
  const selectedRoutes = selectBoundedRoutes(routeComponents);
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
      campaignId: PUNISH_CAMPAIGN_ID,
      routeId,
      steps: route.map((component, order) => {
        const currentLegalActionId =
          order === 0 && component.adapter.kind === "hardware_trash"
            ? currentHardwareTrashActionId(input, component.card.instanceId)
            : undefined;
        return {
          stepId: `${routeId}:step:${order}`,
          order,
          kind: component.adapter.kind,
          sourceCardInstanceId: component.card.instanceId,
          sourceCapabilityBindingKind: "legacy_card_implementation_index",
          sourceCapabilityId: component.adapter.sourceCapabilityId,
          ...(currentLegalActionId ? { currentLegalActionId } : {}),
        };
      }),
    };
  });
}

function currentHardwareTrashActionId(
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

function legalActionCreditCost(
  action: AiDecisionInput["legalActions"][number],
): number {
  return action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0);
}

function visiblePunishComponent(
  card: VisibleCard,
): VisiblePunishComponent | undefined {
  if (
    card.known !== true ||
    card.owner !== "corp" ||
    card.controller !== "corp" ||
    card.type !== "operation" ||
    typeof card.definitionId !== "string"
  ) {
    return undefined;
  }
  const adapter = structuredPunishComponentAdapter(card.definitionId);
  if (!adapter) return undefined;
  return { card, adapter };
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
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  if (
    !hint ||
    hint.side !== "corp" ||
    hint.cardType !== "operation" ||
    hint.conditions?.some(
      (condition) => condition.kind === "requires_trace_success",
    ) !== true ||
    hint.effects?.some(
      (effect) =>
        effect.kind === "trace" &&
        effect.scope === "runner" &&
        effect.timing === "action" &&
        effect.finite === true,
    ) !== true ||
    hint.effects.some(
      (effect) =>
        effect.kind === "tag_source" &&
        effect.scope === "runner" &&
        effect.timing === "trace_success" &&
        effect.finite === true &&
        Number.isSafeInteger(effect.amount) &&
        Number(effect.amount) > 0,
    ) !== true
  ) {
    return undefined;
  }
  return {
    definitionId,
    kind: "trace_tag",
    routeOrder: 1,
    sourceCapabilityId: ON_PLAY_CAPABILITY_ID,
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
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  if (
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
    sourceCapabilityId: CORP_HARDWARE_TRASH_PUNISH_CAPABILITY_ID,
  };
}

function structuredDirectTagAdapter(
  definitionId: string,
): PunishComponentAdapter | undefined {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  if (!hint || hint.side !== "corp" || hint.cardType !== "operation")
    return undefined;
  const matches =
    hint.effects?.some(
      (effect) =>
        effect.kind === "tag_source" &&
        effect.scope === "runner" &&
        effect.timing === "action" &&
        effect.finite === true &&
        Number.isSafeInteger(effect.amount) &&
        Number(effect.amount) > 0,
    ) === true && hint.effects.every((effect) => effect.kind !== "trace");
  return matches
    ? {
        definitionId,
        kind: "tag",
        routeOrder: 0,
        sourceCapabilityId: ON_PLAY_CAPABILITY_ID,
      }
    : undefined;
}

function structuredTaggedCreditDenialAdapter(
  definitionId: string,
): PunishComponentAdapter | undefined {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  const matches =
    hint?.side === "corp" &&
    hint.cardType === "operation" &&
    hint.conditions?.some(
      (condition) => condition.kind === "requires_runner_tagged",
    ) === true &&
    hint.effects?.some(
      (effect) =>
        effect.kind === "tag_punish_payoff" &&
        effect.scope === "runner" &&
        effect.timing === "action" &&
        effect.finite === true &&
        effect.resource === "credits",
    ) === true;
  return matches
    ? {
        definitionId,
        kind: "other_punish",
        routeOrder: 5,
        sourceCapabilityId: ON_PLAY_CAPABILITY_ID,
      }
    : undefined;
}

function structuredTaggedDamageAdapter(
  definitionId: string,
): PunishComponentAdapter | undefined {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  const matches =
    hint?.side === "corp" &&
    hint.cardType === "operation" &&
    hint.tacticSignals?.includes("damage.corp_meat_source") === true &&
    hint.conditions?.some(
      (condition) => condition.kind === "requires_runner_tagged",
    ) === true &&
    hint.effects?.some(
      (effect) =>
        effect.kind === "damage" &&
        effect.scope === "runner" &&
        effect.timing === "action" &&
        effect.finite === true &&
        Number.isSafeInteger(effect.amount) &&
        Number(effect.amount) > 0,
    ) === true &&
    hint.effects.some(
      (effect) =>
        effect.kind === "tag_punish_payoff" &&
        effect.scope === "runner" &&
        effect.timing === "action" &&
        effect.finite === true &&
        effect.resource === "damage",
    );
  return matches
    ? {
        definitionId,
        kind: "meat_damage",
        routeOrder: 10,
        sourceCapabilityId: ON_PLAY_CAPABILITY_ID,
      }
    : undefined;
}

function boundedDamageCombinations(
  damage: readonly VisiblePunishComponent[],
  maximumSteps: number,
): VisiblePunishComponent[][] {
  const boundedDamage = damage.slice(0, MAX_PUNISH_ROUTES - 1);
  const combinations = boundedDamage.map((component) => [component]);
  const longestLength = Math.min(maximumSteps, boundedDamage.length);
  for (let length = 2; length <= longestLength; length += 1) {
    const forward = boundedDamage.slice(0, length);
    combinations.push(forward, forward.slice().reverse());
  }
  return selectBoundedRoutes(combinations);
}

function selectBoundedRoutes(
  routes: readonly VisiblePunishComponent[][],
): VisiblePunishComponent[][] {
  const unique = [
    ...new Map(
      routes.map((route) => [routeComponentKey(route), route]),
    ).values(),
  ];
  if (unique.length <= MAX_PUNISH_ROUTES) return unique;
  const selected = unique.slice(0, MAX_PUNISH_ROUTES - 1);
  const longest = [...unique].sort(
    (left, right) =>
      right.length - left.length ||
      routeComponentKey(left).localeCompare(routeComponentKey(right)),
  )[0]!;
  if (
    !selected.some(
      (route) => routeComponentKey(route) === routeComponentKey(longest),
    )
  ) {
    selected.push(longest);
  }
  return selected;
}

function routeComponentKey(route: readonly VisiblePunishComponent[]): string {
  return route.map((component) => component.card.instanceId).join("\u0000");
}

function quoteMatchesRequest(
  quote: CorpPunishRouteQuote,
  request: CorpPunishRouteQuoteRequest,
): boolean {
  return (
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
