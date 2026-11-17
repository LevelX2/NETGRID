import {
  cardSpecPlanningCardByDefinitionId,
  cardSpecPlanningCards,
} from "@netgrid/cards/planning";
import { traceRulesDefinition } from "@netgrid/engine";
import type {
  AiDecisionInput,
  VisibleCard,
  VisibleRunnerTraceSupportQuote,
} from "@netgrid/shared";
import { reconstructBeliefState } from "../../belief-state";
import { visibleRunnerTraceSupport } from "../../run-analysis/visible-run-hazards";
import { decisionDerivedValue } from "../../decision-derived-cache";
import {
  fixedTagOperation,
  fixedTaggedDamageOperation,
  publicRunnerTurnObservations,
  type FixedTagOperation as TagSource,
  type FixedTaggedDamageOperation as DamagePayoff,
} from "../../runtime/corp-fixed-tag-damage-operation-facts";
import { canAvoidOneNextCorpTag } from "../../runtime/visible-runner-tag-prevention";

const NEXT_CORP_TURN_PUNISH = Symbol("next-corp-turn-punish");
// Evaluate operations that fit the ordinary Corp turn.
const CORP_ACTIONS = 3;

type NextCorpTurnThreat = {
  tagPreventionNeeded: boolean;
  incomingMeatDamage: number;
  conditionalMeatDamage: number;
  observedPayoffMeatDamage?: number;
  conditionalTagPreventionNeeded: boolean;
  postProtectionMeatDamage: number;
  retagsAfterClear: boolean;
  additionalRunEnablesPunish: boolean;
};

const possibleTagOperations = cardSpecPlanningCards().flatMap(
  ({ definition }) => {
    const source = fixedTagOperation(definition.id);
    return source ? [{ definitionId: definition.id, ...source }] : [];
  },
);

/**
 * A decision-local risk assessment from Runner-visible card observations
 * and own reactions. It is independent of deck-level flatline and run buffers.
 */
export function runnerNextCorpTurnThreat(
  input: AiDecisionInput,
): NextCorpTurnThreat | undefined {
  return decisionDerivedValue(input, NEXT_CORP_TURN_PUNISH, () =>
    assessNextCorpTurn(input),
  );
}

function assessNextCorpTurn(
  input: AiDecisionInput,
): NextCorpTurnThreat | undefined {
  const view = input.playerView;
  if (
    input.side !== "runner" ||
    view.activeSide !== "runner" ||
    view.timingPoint !== "runner_action.main" ||
    view.run ||
    view.pendingChoice ||
    view.opponent.handCount === 0 ||
    view.opponent.deckCount === 0
  ) {
    return undefined;
  }
  const belief = reconstructBeliefState(input).runnerOpponentModel;
  const knownHq = belief?.hqHandMemory.knownDefinitions ?? [];
  const top = belief?.rndTopFreshness;
  const knownNextDraw =
    top?.knownToRunner && top.freshness !== "invalidated"
      ? top.knownTopDefinitionId
      : undefined;
  const knownOperations = knownNextDraw ? [...knownHq, knownNextDraw] : knownHq;
  const tagSources = knownOperations.flatMap((id) => {
    const source = fixedTagOperation(id);
    return source ? [source] : [];
  });
  const payoffs = knownOperations.flatMap((id) => {
    const payoff = fixedTaggedDamageOperation(id);
    return payoff ? [payoff] : [];
  });
  if (tagSources.length === 0 && payoffs.length === 0) return undefined;
  const observedDefinitions = observedOperationDefinitions(input);
  const { runs, stoleAgenda } = publicRunnerTurnObservations(
    input,
    view.turnSerial,
  );
  const triggerMet = (source: TagSource) =>
    source.trigger.kind === "run_attempts"
      ? source.trigger.minimumRuns <= runs
      : stoleAgenda;
  const possibleSources =
    view.own.tags === 0 &&
    tagSources.length === 0 &&
    payoffs.length > 0 &&
    knownHq.length < view.opponent.handCount
      ? possibleTagOperations.filter(
          (source) =>
            triggerMet(source) &&
            (runs >= 2 ||
              stoleAgenda ||
              observedDefinitions.has(source.definitionId)),
        )
      : [];
  const hiddenHqCount = Math.max(0, view.opponent.handCount - knownHq.length);
  const observedTagSources =
    tagSources.some(triggerMet) && hiddenHqCount >= 2
      ? possibleTagOperations.filter(
          (source) =>
            triggerMet(source) &&
            observedDefinitions.has(source.definitionId) &&
            !knownOperations.includes(source.definitionId),
        )
      : [];
  const ownTraceSupport = view.own.runnerTraceSupportQuote;
  const traceDefense =
    ownTraceSupport &&
    [...tagSources, ...possibleSources, ...observedTagSources].some(
      (source) => source.trigger.kind === "run_attempts",
    )
      ? traceDefenseForNextTurn(input, ownTraceSupport)
      : undefined;
  const automaticTag = (view.own.rig ?? []).some(
    (card) =>
      staysInstalledForNextCorpTurn(card) &&
      card.definitionId &&
      cardSpecPlanningCardByDefinitionId(card.definitionId)?.planning.engine
        .runnerUtilityLongtail?.kind === "trace_attempts_auto_success_add_tag",
  );
  const priceTagSource = (source: TagSource) => {
    const price = visibleTagSourceCost(
      view.opponent.credits,
      source,
      automaticTag,
      traceDefense,
    );
    return price ? [{ ...source, ...price }] : [];
  };
  const pricedSources = tagSources.flatMap(priceTagSource);
  const incoming = pricedSources.filter(triggerMet);
  const handCount = view.own.gripOrHq.length;
  const readyPrevention = readyMeatDamagePrevention(input);
  const readyTagProtection = (view.own.rig ?? []).filter((card) =>
    canAvoidOneNextCorpTag(card, view.own.credits),
  );
  const avoidsOneTag = readyTagProtection.length > 0;
  const freeTagProtectionCount = readyTagProtection.filter((card) =>
    canAvoidOneNextCorpTag(card, view.own.credits, true),
  ).length;
  const damageFor = (source: TagSource, remainingTags: number) =>
    maximumDamage(
      payoffs,
      view.opponent.credits - source.credits,
      remainingTags,
      CORP_ACTIONS - 1,
    );
  const repeatTraceDamage = Math.max(
    0,
    ...incoming.flatMap((first, index) =>
      incoming
        .slice(index + 1)
        .map((second) =>
          maximumDamage(
            payoffs,
            view.opponent.credits - first.credits - second.credits,
            second.tags,
            CORP_ACTIONS - 2,
          ),
        ),
    ),
  );
  const canBlockWithOneTagAvoidance =
    view.own.tags === 0 &&
    incoming.length > 0 &&
    repeatTraceDamage <= handCount &&
    incoming.every((source) => source.tags === 1);
  const tagPreventionNeeded =
    canBlockWithOneTagAvoidance &&
    !avoidsOneTag &&
    // An affordable known nonlethal payoff alone does not justify spending
    // a hand card on speculative protection. An open HQ leaves room for
    // an unseen payoff, which can only motivate the low-cost preparation.
    (incoming.some(
      (source) => damageFor(source, source.tags) > handCount + readyPrevention,
    ) ||
      (knownHq.length < view.opponent.handCount &&
        incoming.some((trace) => view.opponent.credits - trace.credits > 0)));
  const damageAfterRetag = Math.max(
    0,
    avoidsOneTag ? repeatTraceDamage : 0,
    ...incoming.map((source) =>
      damageFor(source, source.tags - Number(avoidsOneTag)),
    ),
  );
  const incomingMeatDamage =
    view.own.tags > 0
      ? Math.max(
          maximumDamage(
            payoffs,
            view.opponent.credits,
            view.own.tags,
            CORP_ACTIONS,
          ),
          ...incoming.map((source) =>
            damageFor(
              source,
              view.own.tags + source.tags - Number(avoidsOneTag),
            ),
          ),
        )
      : damageAfterRetag;
  const projectedDamage = (damage: number) =>
    Math.max(0, damage - readyPrevention);
  // Open HQ slots and a live trigger make one concealed tag plausible.
  // Prepare for a single observed payoff without assuming the Corp has a combo.
  const possiblePunishes = possibleSources
    .flatMap(priceTagSource)
    .map((source) => ({
      tags: source.tags,
      damage: projectedDamage(
        maximumDamage(
          payoffs,
          view.opponent.credits - source.credits,
          source.tags - Number(avoidsOneTag),
          1,
        ),
      ),
    }));
  const conditionalMeatDamage = Math.max(
    0,
    ...possiblePunishes.map(({ damage }) => damage),
  );
  const conditionalTagPreventionNeeded =
    !avoidsOneTag &&
    conditionalMeatDamage > handCount &&
    possiblePunishes.every(
      ({ tags, damage }) => tags === 1 || damage <= handCount,
    );
  // An observed payoff shows the likely scale of one follow-up, but does
  // not put that card back in HQ. A second uncertain tag must also have
  // been seen, fit an independent HQ slot and have its public trigger open.
  const observedPayoffMeatDamage =
    payoffs.length === 0 && hiddenHqCount > 0 && incoming.length > 0
      ? assessObservedPayoff({
          incoming,
          additionalTags: observedTagSources.flatMap(priceTagSource),
          payoffs: [...observedDefinitions].flatMap((id) => {
            const payoff = fixedTaggedDamageOperation(id);
            return payoff ? [payoff] : [];
          }),
          corpCredits: view.opponent.credits,
          existingTags: view.own.tags,
          // Independently payable free responses can stack. For credit-paid
          // reactions this horizon only reserves the payment for one.
          tagProtectionCount:
            freeTagProtectionCount +
            Number(readyTagProtection.length > freeTagProtectionCount),
          meatPrevention: readyMeatDamagePrevention(
            input,
            new Set(readyTagProtection.map((card) => card.instanceId)),
          ),
        })
      : 0;
  const additionalRunEnablesPunish =
    view.own.tags === 0 &&
    incomingMeatDamage <= handCount &&
    pricedSources.some(
      (source) =>
        source.trigger.kind === "run_attempts" &&
        source.trigger.minimumRuns === runs + 1 &&
        projectedDamage(damageFor(source, source.tags - Number(avoidsOneTag))) >
          Math.max(view.own.maxHandSize, handCount),
    );
  return {
    tagPreventionNeeded,
    incomingMeatDamage: projectedDamage(incomingMeatDamage),
    conditionalMeatDamage,
    ...(observedPayoffMeatDamage > 0 ? { observedPayoffMeatDamage } : {}),
    conditionalTagPreventionNeeded,
    postProtectionMeatDamage: projectedDamage(repeatTraceDamage),
    retagsAfterClear: projectedDamage(damageAfterRetag) > handCount,
    additionalRunEnablesPunish,
  };
}

function assessObservedPayoff({
  incoming,
  additionalTags,
  payoffs,
  corpCredits,
  existingTags,
  tagProtectionCount,
  meatPrevention,
}: {
  incoming: readonly TagSource[];
  additionalTags: readonly TagSource[];
  payoffs: readonly DamagePayoff[];
  corpCredits: number;
  existingTags: number;
  tagProtectionCount: number;
  meatPrevention: number;
}): number {
  let damage = 0;
  for (const [index, first] of incoming.entries()) {
    const tags = existingTags + Math.max(0, first.tags - tagProtectionCount);
    damage = Math.max(
      damage,
      maximumDamage(payoffs, corpCredits - first.credits, tags, 1),
    );
    for (const second of [...incoming.slice(index + 1), ...additionalTags]) {
      const tags =
        existingTags +
        Math.max(0, first.tags + second.tags - tagProtectionCount);
      damage = Math.max(
        damage,
        maximumDamage(
          payoffs,
          corpCredits - first.credits - second.credits,
          tags,
          1,
        ),
      );
    }
  }
  return Math.max(0, damage - meatPrevention);
}

function observedOperationDefinitions(
  input: AiDecisionInput,
): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const event of [...input.playerView.publicEvents, ...input.eventTail]) {
    if (event.stateVersionAfter > input.playerView.stateVersion) continue;
    const { actor, cardDefinitionId, sourceDefinitionId } = event.publicPayload;
    if (
      (event.type === "play_operation" && actor === "corp") ||
      (event.type === "access_card" && actor === "runner")
    ) {
      if (typeof cardDefinitionId === "number") ids.add(cardDefinitionId);
      if (typeof sourceDefinitionId === "number") ids.add(sourceDefinitionId);
    }
  }
  return ids;
}

/** Count a single currently ready, unavoidable prevention source. Other
 * payment windows and combined sources stay with the reaction owner. */
function readyMeatDamagePrevention(
  input: AiDecisionInput,
  tagResponseSourceIds?: ReadonlySet<string>,
): number {
  return Math.max(
    0,
    ...(input.playerView.own.rig ?? []).flatMap((card) => {
      if (
        !staysInstalledForNextCorpTurn(card) ||
        !card.definitionId ||
        tagResponseSourceIds?.has(card.instanceId)
      )
        return [];
      return (
        cardSpecPlanningCardByDefinitionId(card.definitionId)?.planning.engine
          .damagePreventionSources ?? []
      ).flatMap((source) => {
        if (
          !source.damageTypes.includes("meat") ||
          source.visibility !== "public" ||
          source.corpMayPayToBypass ||
          source.corpMayCancelUntilEndOfTurn
        )
          return [];
        if (source.cost.kind === "source_counter") {
          return (card.counters?.[source.cost.counterType] ?? 0) >=
            source.cost.amount
            ? [1]
            : [];
        }
        if (source.cost.kind !== "none" && source.cost.kind !== "trash_source")
          return [];
        // A single all-damage use may only cover one hit. Avoid treating it
        // as a complete answer to a sequence of operations.
        return [1];
      });
    }),
  );
}

function traceDefenseForNextTurn(
  input: AiDecisionInput,
  quote: VisibleRunnerTraceSupportQuote,
) {
  const { own, traceRulesProfile } = input.playerView;
  const support = visibleRunnerTraceSupport(quote, own.credits, 0, {
    ...(traceRulesProfile ? { traceRulesProfile } : {}),
  });
  return {
    rules: traceRulesDefinition(support.traceRulesProfile),
    maximumRunnerStrength: support.runnerTraceCapacity,
    canCancelTrace: quote.traceSuccessCancelOptions.some(
      (option) => option.activationCost <= own.credits,
    ),
  };
}

function visibleTagSourceCost(
  availableCredits: number,
  source: TagSource,
  automaticTraceSuccess: boolean,
  traceDefense: ReturnType<typeof traceDefenseForNextTurn> | undefined,
): Pick<TagSource, "credits" | "tags"> | undefined {
  const { trigger, credits, tags } = source;
  if (credits > availableCredits) return undefined;
  if (trigger.kind === "agenda_stolen") return { credits, tags };
  if (automaticTraceSuccess) return { credits, tags: tags + 1 };
  if (!traceDefense || traceDefense.canCancelTrace) return undefined;
  const { rules, maximumRunnerStrength } = traceDefense;
  const base =
    rules.corpBaseStrengthMode === "printed_trace" ? trigger.traceLimit : 0;
  const bid = Math.max(
    0,
    maximumRunnerStrength + (rules.tieWinner === "runner" ? 1 : 0) - base,
  );
  if (
    rules.corpBidLimitMode === "effective_trace_limit" &&
    bid > trigger.traceLimit
  )
    return undefined;
  const cost = credits + bid;
  return cost <= availableCredits ? { credits: cost, tags } : undefined;
}

function maximumDamage(
  payoffs: readonly DamagePayoff[],
  credits: number,
  tags: number,
  clicks: number,
  index = 0,
): number {
  if (clicks === 0 || tags === 0) return 0;
  let best = 0;
  for (let i = index; i < payoffs.length; i++) {
    const payoff = payoffs[i]!;
    if (payoff.credits > credits || payoff.minimumTags > tags) continue;
    best = Math.max(
      best,
      payoff.damage +
        maximumDamage(
          payoffs,
          credits - payoff.credits,
          tags,
          clicks - 1,
          i + 1,
        ),
    );
  }
  return best;
}

function staysInstalledForNextCorpTurn(card: VisibleCard): boolean {
  return card.known && (card.lifecycleMarkers?.length ?? 0) === 0;
}
