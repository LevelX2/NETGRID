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
import { countAvoidableRunnerTags } from "../../runtime/visible-runner-tag-prevention";

type Retention = Readonly<{
  value: number;
  damage: number;
  drawOptions: number;
}>;
type DevelopmentLine = {
  damage: number;
  credits: number;
  cardInstanceIds: readonly string[];
};
type DevelopmentOption = {
  definitionId: number;
  copies: number;
  missingRole: "tag" | "damage";
  line: DevelopmentLine;
};
type Operations = {
  tags: FixedTagOperation[];
  damage: FixedTaggedDamageOperation[];
};

const ordinaryCorpClicks = 3;
const noRetention: Retention = { value: 0, damage: 0, drawOptions: 0 };

/**
 * Retention and single-card development facts. A fixed-cost scenario with the
 * currently visible budget, grip and reactions, never a Punish route quote.
 * The intervening Runner turn can change every condition assessed here.
 */
export function prepareCorpPunishHandAssessment(input: AiDecisionInput) {
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
    return {
      assess: () => noRetention,
      developmentOptions: (): DevelopmentOption[] => [],
    };
  }

  const rig = opponent.rig;
  const unavoidableNewTags = new Map<number, number>();
  function tagsAfterPrevention(tags: number): number {
    const known = unavoidableNewTags.get(tags);
    if (known !== undefined) return known;
    const remaining =
      tags -
      countAvoidableRunnerTags(rig, tags, opponent.credits, "next_corp_turn");
    unavoidableNewTags.set(tags, remaining);
    return remaining;
  }
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
  function operations(definitionId: number): Operations {
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
      ? [{ ...option, definitionId, copies }]
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
        tagsAfterPrevention(first.tags),
        liquidCredits - first.credits,
        ordinaryCorpClicks - 1,
        [first],
      );
      for (const second of tags.slice(index + 1)) {
        record(
          tagsAfterPrevention(first.tags + second.tags),
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

  function knownHandOperations(hq: readonly VisibleCard[]) {
    return hq.flatMap((card) =>
      card.known && card.definitionId
        ? [{ instanceId: card.instanceId, ...operations(card.definitionId) }]
        : [],
    );
  }

  function assessRetention(remainingHq: readonly VisibleCard[]): Retention {
    const instances = knownHandOperations(remainingHq);
    const held = {
      tags: instances.flatMap((card) => card.tags),
      damage: instances.flatMap((card) => card.damage),
    };
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
  }

  function developmentOptions(): DevelopmentOption[] {
    if (visibleMeatPrevention || !inDeck) return [];
    const instances = knownHandOperations(own.gripOrHq);
    const tags = instances.flatMap((card) =>
      card.tags.map((operation) => ({
        operation,
        instanceId: card.instanceId,
      })),
    );
    const payoffs = instances.flatMap((card) =>
      card.damage.map((operation) => ({
        operation,
        instanceId: card.instanceId,
      })),
    );
    const grip = Math.max(opponent.handCount, opponent.maxHandSize);
    const retainedDamage = assess({
      tags: tags.map((entry) => entry.operation),
      damage: payoffs.map((entry) => entry.operation),
    }).damage;
    if (retainedDamage > grip) return [];
    const result: DevelopmentOption[] = [];
    for (const {
      definitionId,
      copies,
      tags: drawableTags,
      damage: drawableDamage,
    } of drawOptions) {
      let best: Omit<DevelopmentOption, "definitionId" | "copies"> | undefined;
      const consider = (
        tag: FixedTagOperation,
        damage: readonly FixedTaggedDamageOperation[],
        cardInstanceIds: readonly string[],
        missingRole: DevelopmentOption["missingRole"],
      ) => {
        const tagsAfterResponse = tagsAfterPrevention(tag.tags);
        const credits =
          tag.credits + damage.reduce((sum, card) => sum + card.credits, 0);
        const amount = damage.reduce((sum, card) => sum + card.damage, 0);
        if (
          tagsAfterResponse <= 0 ||
          credits > liquidCredits ||
          amount <= grip ||
          damage.some((card) => card.minimumTags > tagsAfterResponse)
        )
          return;
        if (
          !best ||
          credits < best.line.credits ||
          (credits === best.line.credits &&
            cardInstanceIds.length < best.line.cardInstanceIds.length) ||
          (credits === best.line.credits &&
            cardInstanceIds.length === best.line.cardInstanceIds.length &&
            amount > best.line.damage)
        ) {
          best = {
            missingRole,
            line: {
              damage: amount,
              credits,
              cardInstanceIds,
            },
          };
        }
      };
      for (const payoff of drawableDamage) {
        for (const tag of tags) {
          consider(tag.operation, [payoff], [tag.instanceId], "damage");
          for (const held of payoffs) {
            if (held.instanceId === tag.instanceId) continue;
            consider(
              tag.operation,
              [payoff, held.operation],
              [tag.instanceId, held.instanceId],
              "damage",
            );
          }
        }
      }
      for (const tag of drawableTags) {
        for (const [index, first] of payoffs.entries()) {
          consider(tag, [first.operation], [first.instanceId], "tag");
          for (const second of payoffs.slice(index + 1))
            consider(
              tag,
              [first.operation, second.operation],
              [first.instanceId, second.instanceId],
              "tag",
            );
        }
      }
      if (best) result.push({ definitionId, copies, ...best });
    }
    return result;
  }

  return { assess: assessRetention, developmentOptions };
}

export function prepareCorpPunishHandRetention(input: AiDecisionInput) {
  return prepareCorpPunishHandAssessment(input).assess;
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
