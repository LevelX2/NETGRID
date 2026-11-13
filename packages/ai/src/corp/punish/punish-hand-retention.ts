import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import {
  cardImplementationForDefinitionId,
  traceRulesDefinition,
} from "@netgrid/engine";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { knownCorpRdDefinitionCounts } from "../defense/corp-central-defense-facts-adapter";
import {
  fixedTagOperation,
  fixedTaggedDamageOperation,
  publicRunnerTurnObservations,
  type FixedTaggedDamageOperation,
  type FixedTagOperation,
} from "../../runtime/corp-fixed-tag-damage-operation-facts";
import { visibleRunnerTraceEstimateAtCorpBid } from "../../runtime/trace-context";
import { canAvoidOneNextCorpTag } from "../../runtime/visible-runner-tag-prevention";

type Retention = Readonly<{
  value: number;
  damage: number;
  drawOptions: number;
}>;
type Operations = {
  tags: FixedTagOperation[];
  damage: FixedTaggedDamageOperation[];
};

const ordinaryCorpClicks = 3;
const noRetention: Retention = { value: 0, damage: 0, drawOptions: 0 };

/**
 * Continuation value for the Hand owner. A fixed-cost scenario with the
 * currently visible budget, grip and reactions, never a Punish route quote.
 * The intervening Runner turn can change every condition assessed here.
 */
export function prepareCorpPunishHandRetention(input: AiDecisionInput) {
  const { own, opponent, turnSerial, traceRulesProfile } = input.playerView;
  const liquidCredits =
    own.credits -
    (own.installRezOnlyCredits ?? 0) -
    (own.corpEndTurnCreditObligation?.creditsDue ?? 0);
  if (
    input.side !== "corp" ||
    !Number.isSafeInteger(liquidCredits) ||
    liquidCredits < 0 ||
    !Number.isSafeInteger(opponent.handCount) ||
    opponent.handCount < 0 ||
    !Number.isSafeInteger(opponent.maxHandSize) ||
    !Number.isSafeInteger(opponent.tags) ||
    opponent.tags < 0 ||
    !Number.isSafeInteger(opponent.credits) ||
    !opponent.identity?.known ||
    !opponent.rig?.every((card) => card.known && card.definitionId)
  ) {
    return () => noRetention;
  }

  const rig = opponent.rig;
  const avoidedTags = rig.filter((card) =>
    canAvoidOneNextCorpTag(card, opponent.credits),
  ).length;
  const visibleMeatPrevention = [opponent.identity, ...rig].some((card) =>
    cardSpecPlanningCardByDefinitionId(
      card.definitionId!,
    )?.planning.engine.damagePreventionSources?.some(
      (source) =>
        source.visibility === "public" && source.damageTypes.includes("meat"),
    ),
  );
  // Reuse the visible trace estimate, but don't promote a scenario based on
  // an extra response outside that estimate (cancel/conditional post-bid link).
  const unmodeledTraceResponse = [opponent.identity, ...rig].some((card) =>
    cardImplementationForDefinitionId(card.definitionId!)?.abilities?.some(
      (ability) =>
        ability.kind === "activated" &&
        (ability.timing === "trace_success_cancel_window" ||
          ability.timing === "trace_post_bid_link_window"),
    ),
  );
  const trace = traceRulesDefinition(traceRulesProfile);
  const { maximumPreRevealStrength } =
    visibleRunnerTraceEstimateAtCorpBid(input);
  const observation = publicRunnerTurnObservations(
    input,
    turnSerial === undefined ? undefined : turnSerial - 1,
  );
  const operationCache = new Map<string, Operations>();
  function operations(definitionId: string): Operations {
    const cached = operationCache.get(definitionId);
    if (cached) return cached;
    const tag = fixedTagOperation(definitionId);
    const payoff = fixedTaggedDamageOperation(definitionId);
    let tagCost = tag?.credits ?? 0;
    let canPayForTag = true;
    if (tag?.trigger.kind === "run_attempts") {
      const base =
        trace.corpBaseStrengthMode === "printed_trace"
          ? tag.trigger.traceLimit
          : 0;
      const bid = Math.max(
        0,
        maximumPreRevealStrength +
          (trace.tieWinner === "runner" ? 1 : 0) -
          base,
      );
      canPayForTag =
        !unmodeledTraceResponse &&
        (trace.corpBidLimitMode !== "effective_trace_limit" ||
          bid <= tag.trigger.traceLimit);
      tagCost += bid;
    }
    const result = {
      tags:
        tag && canPayForTag && tagCost <= liquidCredits
          ? [{ ...tag, credits: tagCost }]
          : [],
      damage: payoff && payoff.credits <= liquidCredits ? [payoff] : [],
    };
    operationCache.set(definitionId, result);
    return result;
  }

  const inDeck = knownCorpRdDefinitionCounts(input);
  const drawOptions = [...(inDeck ?? [])].flatMap(([definitionId, copies]) => {
    if (copies === 0) return [];
    const option = operations(definitionId);
    return option.tags.length > 0 || option.damage.length > 0
      ? [{ ...option, copies }]
      : [];
  });

  function damageValue(damage: number) {
    if (damage <= 0) return 0;
    return (
      180 +
      Math.min(5, damage) * 42 +
      (!visibleMeatPrevention && damage > opponent.handCount
        ? damage > opponent.maxHandSize
          ? 155
          : 95
        : 0)
    );
  }

  function assess({ tags, damage }: Operations) {
    let bestDamage = 0;
    let bestValue = 0;
    const productiveTriggers = new Set<FixedTagOperation["trigger"]["kind"]>();
    function record(
      currentTags: number,
      credits: number,
      clicks: number,
      sources: readonly FixedTagOperation[],
    ) {
      if (credits < 0 || clicks <= 0 || currentTags <= 0) return;
      const amount = maximumDamage(damage, currentTags, credits, clicks);
      if (amount === 0) return;
      bestDamage = Math.max(bestDamage, amount);
      const observed = sources.every(({ trigger }) =>
        trigger.kind === "agenda_stolen"
          ? observation.stoleAgenda
          : observation.runs >= trigger.minimumRuns,
      );
      if (sources.length === 1)
        productiveTriggers.add(sources[0]!.trigger.kind);
      bestValue = Math.max(
        bestValue,
        Math.floor(
          damageValue(amount) *
            (sources.length === 0 ? 0.8 : observed ? 1 : 0.86),
        ),
      );
    }
    record(opponent.tags, liquidCredits, ordinaryCorpClicks, []);
    for (let index = 0; index < tags.length; index += 1) {
      const first = tags[index]!;
      // Assess retagging after a clear separately from retaining current tags.
      record(
        first.tags - avoidedTags,
        liquidCredits - first.credits,
        ordinaryCorpClicks - 1,
        [first],
      );
      for (const second of tags.slice(index + 1)) {
        record(
          first.tags + second.tags - avoidedTags,
          liquidCredits - first.credits - second.credits,
          ordinaryCorpClicks - 2,
          [first, second],
        );
      }
    }
    return {
      value: bestValue + (productiveTriggers.size > 1 ? 110 : 0),
      damage: bestDamage,
    };
  }

  return (remainingHq: readonly VisibleCard[]): Retention => {
    const held: Operations = { tags: [], damage: [] };
    for (const card of remainingHq) {
      if (!card.known || !card.definitionId) continue;
      const profile = operations(card.definitionId);
      held.tags.push(...profile.tags);
      held.damage.push(...profile.damage);
    }
    if (held.tags.length === 0 && held.damage.length === 0) return noRetention;
    const current = assess(held);
    let bestExtension = 0;
    let usefulCopies = 0;
    for (const option of drawOptions) {
      const projected = assess({
        tags: [...held.tags, ...option.tags],
        damage: [...held.damage, ...option.damage],
      });
      if (projected.value <= current.value) continue;
      bestExtension = Math.max(bestExtension, projected.value - current.value);
      usefulCopies += option.copies;
    }
    // One compatible draw has limited option value. Do not add speculative
    // routes or count copies just for belonging to the deck archetype.
    const development = Math.min(
      120,
      Math.floor(bestExtension / 2),
      65 + usefulCopies * 8,
      Math.floor(
        75 +
          (225 * usefulCopies) /
            Math.max(1, input.playerView.own.stackOrRdCount),
      ),
    );
    return {
      value: current.value + development,
      damage: current.damage,
      drawOptions: usefulCopies,
    };
  };
}

function maximumDamage(
  payoffs: readonly FixedTaggedDamageOperation[],
  tags: number,
  credits: number,
  clicks: number,
  start = 0,
): number {
  if (clicks <= 0) return 0;
  let best = 0;
  for (let index = start; index < payoffs.length; index += 1) {
    const payoff = payoffs[index]!;
    if (payoff.credits > credits || payoff.minimumTags > tags) continue;
    best = Math.max(
      best,
      payoff.damage +
        maximumDamage(
          payoffs,
          tags,
          credits - payoff.credits,
          clicks - 1,
          index + 1,
        ),
    );
  }
  return best;
}
