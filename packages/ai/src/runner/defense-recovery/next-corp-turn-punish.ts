import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import { traceRulesDefinition } from "@netgrid/engine";
import type {
  AiDecisionInput,
  VisibleCard,
  VisibleRunnerTraceSupportQuote,
} from "@netgrid/shared";
import { reconstructBeliefState } from "../../belief-state";
import { visibleRunnerTraceSupport } from "../../run-analysis/visible-run-hazards";
import { corpFixedOperationPlayCredits } from "../../runtime/corp-canonical-card-facts";
import { decisionDerivedValue } from "../../runtime/decision-derived-cache";

const NEXT_CORP_TURN_PUNISH = Symbol("next-corp-turn-punish");
// Evaluate operations that fit the ordinary Corp turn. Additional actions
// and unobserved cards never establish a current defense requirement.
const CORP_ACTIONS = 3;

type TagSource = {
  trigger:
    | { kind: "run_attempts"; minimumRuns: number; traceLimit: number }
    | { kind: "agenda_stolen" };
  tags: number;
  credits: number;
};

type DamagePayoff = { credits: number; damage: number; minimumTags: number };

type NextCorpTurnThreat = {
  tagPreventionNeeded: boolean;
  incomingMeatDamage: number;
  postProtectionMeatDamage: number;
  retagsAfterClear: boolean;
  additionalRunEnablesPunish: boolean;
};

/**
 * A decision-local risk assessment from Runner-visible HQ memory and own
 * reactions. It is independent of the deck-level flatline and run buffers.
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
  const knownHq =
    reconstructBeliefState(input).runnerOpponentModel?.hqHandMemory
      .knownDefinitions ?? [];
  if (knownHq.length === 0) return undefined;
  const tagSources = knownHq.flatMap((id) => {
    const source = observedOperationTagSource(id);
    return source ? [source] : [];
  });
  const payoffs = knownHq.flatMap((id) => {
    const payoff = observedOperationDamage(id);
    return payoff ? [payoff] : [];
  });
  if (tagSources.length === 0 && (payoffs.length === 0 || view.own.tags === 0))
    return undefined;
  const { runs, stoleAgenda } = runnerTurnObservations(input);
  const ownTraceSupport = view.own.runnerTraceSupportQuote;
  const traceDefense =
    ownTraceSupport &&
    tagSources.some((source) => source.trigger.kind === "run_attempts")
      ? traceDefenseForNextTurn(input, ownTraceSupport)
      : undefined;
  const automaticTag = (view.own.rig ?? []).some(
    (card) =>
      staysInstalledForNextCorpTurn(card) &&
      card.definitionId &&
      cardSpecPlanningCardByDefinitionId(card.definitionId)?.planning.engine
        .runnerUtilityLongtail?.kind === "trace_attempts_auto_success_add_tag",
  );
  const pricedSources = tagSources.flatMap((source) => {
    const price = visibleTagSourceCost(
      view.opponent.credits,
      source,
      automaticTag,
      traceDefense,
    );
    return price ? [{ ...source, ...price }] : [];
  });
  const triggerMet = (trace: TagSource) =>
    trace.trigger.kind === "run_attempts"
      ? trace.trigger.minimumRuns <= runs
      : stoleAgenda;
  const incoming = pricedSources.filter(triggerMet);
  const handCount = view.own.gripOrHq.length;
  const readyPrevention = readyMeatDamagePrevention(input);
  const avoidsOneTag = (view.own.rig ?? []).some((card) =>
    canAvoidOneNextCorpTag(card, view.own.credits),
  );
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
    postProtectionMeatDamage: projectedDamage(repeatTraceDamage),
    retagsAfterClear: projectedDamage(damageAfterRetag) > handCount,
    additionalRunEnablesPunish,
  };
}

/** Count a single currently ready, unavoidable prevention source. Other
 * payment windows and combined sources stay with the reaction owner. */
function readyMeatDamagePrevention(input: AiDecisionInput): number {
  return Math.max(
    0,
    ...(input.playerView.own.rig ?? []).flatMap((card) => {
      if (!staysInstalledForNextCorpTurn(card) || !card.definitionId) return [];
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

function runnerTurnObservations(input: AiDecisionInput) {
  const turn = input.playerView.turnSerial;
  const starts = new Set<string>();
  let stoleAgenda = false;
  for (const event of [...input.playerView.publicEvents, ...input.eventTail]) {
    if (
      turn === undefined ||
      event.turnSerial !== turn ||
      event.stateVersionAfter > input.playerView.stateVersion ||
      event.publicPayload.actor !== "runner"
    )
      continue;
    if (event.type === "steal_agenda") stoleAgenda = true;
    if (
      event.type === "start_run" ||
      event.publicPayload.resolvedEffects?.some(
        (effect) => effect.kind === "start_run" && effect.side === "runner",
      )
    ) {
      starts.add(event.eventId);
    }
  }
  return { runs: starts.size, stoleAgenda };
}

function observedOperationTagSource(
  definitionId: string,
): TagSource | undefined {
  const credits = corpFixedOperationPlayCredits(definitionId);
  if (credits === undefined) return undefined;
  const card = cardSpecPlanningCardByDefinitionId(definitionId)?.planning;
  if (card?.engine.corpUtility?.kind === "encounter_tag")
    return { trigger: { kind: "agenda_stolen" }, tags: 1, credits };
  for (const ability of card?.engine.abilities ?? []) {
    if (
      ability.kind !== "on_play" ||
      ability.costs !== "printed" ||
      ability.condition?.kind !== "runner_attempted_run_last_turn" ||
      ability.effects.length !== 1
    )
      continue;
    const [effect] = ability.effects;
    if (effect?.kind !== "trace" || effect.onSuccess.length !== 1) continue;
    const [tag] = effect.onSuccess;
    if (
      tag?.kind === "add_tags" &&
      tag.recipient === "runner" &&
      tag.visibility === "public" &&
      tag.amount > 0
    ) {
      return {
        trigger: {
          kind: "run_attempts",
          minimumRuns: ability.condition.minimumRuns,
          traceLimit: effect.traceLimit,
        },
        tags: tag.amount,
        credits,
      };
    }
  }
  return undefined;
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

function observedOperationDamage(
  definitionId: string,
): DamagePayoff | undefined {
  const credits = corpFixedOperationPlayCredits(definitionId);
  if (credits === undefined) return undefined;
  const card = cardSpecPlanningCardByDefinitionId(definitionId)?.planning;
  for (const ability of card?.engine.abilities ?? []) {
    if (
      ability.kind !== "on_play" ||
      ability.costs !== "printed" ||
      ability.effects.length !== 1
    )
      continue;
    const condition = ability.condition;
    const [effect] = ability.effects;
    if (
      (condition?.kind === "runner_is_tagged" ||
        condition?.kind === "runner_tags_at_least") &&
      effect?.kind === "damage" &&
      effect.recipient === "runner" &&
      effect.damageType === "meat" &&
      effect.visibility === "public" &&
      effect.amount > 0
    ) {
      return {
        credits,
        damage: effect.amount,
        minimumTags:
          condition.kind === "runner_is_tagged" ? 1 : condition.amount,
      };
    }
  }
  return undefined;
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

/** A finite reaction from the card contract. Future optional payments need
 * to remain affordable after the preparation action. */
export function canAvoidOneNextCorpTag(
  card: VisibleCard,
  credits: number,
  requireFreeReaction = false,
): boolean {
  if (!staysInstalledForNextCorpTurn(card) || !card.definitionId) return false;
  return (
    cardSpecPlanningCardByDefinitionId(card.definitionId)?.planning.engine
      .tagPreventionSources ?? []
  ).some((source) => {
    if (
      source.kind !== "avoid_tag" ||
      source.amount !== 1 ||
      source.visibility !== "public"
    )
      return false;
    const cost = source.cost;
    if (cost.kind === "credit_and_tap_source" && card.tapped) return false;
    return (
      cost.kind === "trash_source" ||
      cost.amount <= (requireFreeReaction ? 0 : credits)
    );
  });
}

function staysInstalledForNextCorpTurn(card: VisibleCard): boolean {
  return card.known && (card.lifecycleMarkers?.length ?? 0) === 0;
}
