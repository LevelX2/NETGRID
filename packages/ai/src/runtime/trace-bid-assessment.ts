import { traceSuccessEffectCardImplementationQuotesForDefinition } from "@netgrid/engine";
import type {
  AiDecisionInput,
  EngineRandomizedTraceBidAssessment,
  EngineRandomizedTraceBidCandidate,
  TraceBidBehavioralBias,
  TraceBidStakes,
  TraceRulesProfile,
  TraceSuccessEffect,
} from "@netgrid/shared";

import type { LatestTraceContext } from "./trace-context";
import { reconstructBeliefState } from "../belief-state";
import { createAiHintsByCard, type AiCardHint } from "../ai-hints";
import { classifyTagPunishPayoffFromOntology } from "../tag-punish-ontology-consumer";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;

const AI_HINTS_BY_CARD = createAiHintsByCard();

type KnownTagPunishFollowup = {
  payoffKnown: boolean;
  lethalDamage: number;
  dangerousCorpBidCapacity?: number;
};

export type TraceBidCandidateAssessment = {
  assessment: EngineRandomizedTraceBidAssessment;
  candidates: EngineRandomizedTraceBidCandidate[];
  selectedOptionId: string;
};

export function assessTraceBidCandidates(
  input: AiDecisionInput,
  choice: PendingChoice,
  traceContext: LatestTraceContext,
): TraceBidCandidateAssessment | undefined {
  const trace = input.playerView.trace;
  const profile = trace?.profile ?? input.playerView.traceRulesProfile;
  if (
    !trace ||
    !isBlindProfile(profile) ||
    choice.kind !== "bid_amount" ||
    choice.source !== `trace:${trace.traceId}`
  ) {
    return undefined;
  }
  const options = choice.options
    .flatMap((option) =>
      Number.isSafeInteger(option.value) && Number(option.value) >= 0
        ? [{ optionId: option.id, bid: Number(option.value) }]
        : [],
    )
    .sort(
      (left, right) =>
        left.bid - right.bid || left.optionId.localeCompare(right.optionId),
    );
  if (options.length === 0) return undefined;

  const currentLink = Math.max(
    0,
    Math.floor(trace.runnerLink ?? traceContext.runnerLink ?? 0),
  );
  const effect = visibleTraceSuccessEffect(input, traceContext);
  const tagPunishFollowup = effectCreatesTag(effect)
    ? knownTagPunishFollowup(input)
    : { payoffKnown: false, lethalDamage: 0 };
  const outcomeValue = traceOutcomeValue(
    input,
    traceContext,
    tagPunishFollowup.payoffKnown,
  );
  const stakes = classifyStakes(
    input,
    outcomeValue,
    traceContext,
    tagPunishFollowup,
  );
  const behavioralBias = behavioralBiasFor(stakes, outcomeValue);
  const reserveTarget = reserveTargetFor(input, stakes);
  const maxBid = options.at(-1)!.bid;
  const specializedCapacity = Math.max(
    0,
    maxBid - Math.max(0, input.playerView.own.credits),
  );
  const utilities = options.map((option) => ({
    ...option,
    utility: roundedUtility(
      bidUtility({
        input,
        profile,
        bid: option.bid,
        maxBid,
        currentLink,
        outcomeValue,
        reserveTarget,
        specializedCapacity,
        effectiveTraceLimit: trace.effectiveTraceLimit,
      }),
    ),
  }));
  const minimumSafeBid = runnerMinimumSafeBid({
    input,
    profile,
    currentLink,
    effect,
    tagPunishFollowup,
  });
  const safeUtilities =
    minimumSafeBid === undefined
      ? utilities
      : utilities.filter((candidate) => candidate.bid >= minimumSafeBid);
  const eligibleUtilities =
    safeUtilities.length > 0 ? safeUtilities : utilities;
  const ranked = eligibleUtilities
    .slice()
    .sort(
      (left, right) =>
        right.utility - left.utility ||
        left.bid - right.bid ||
        left.optionId.localeCompare(right.optionId),
    );
  const rationalTarget = ranked[0]!.bid;
  const tolerance = stakesTolerance(stakes);
  let rational = eligibleUtilities.filter(
    (candidate) => ranked[0]!.utility - candidate.utility <= tolerance,
  );
  if (rational.length === 1 && stakes !== "terminal") {
    const neighbor = ranked.find(
      (candidate) => candidate.optionId !== rational[0]!.optionId,
    );
    if (neighbor) rational = [...rational, neighbor];
  }
  if (behavioralBias === "polarized") {
    for (const edge of [eligibleUtilities[0], eligibleUtilities.at(-1)]) {
      if (
        edge &&
        ranked[0]!.utility - edge.utility <= tolerance * 1.8 &&
        !rational.some((candidate) => candidate.optionId === edge.optionId)
      ) {
        rational.push(edge);
      }
    }
  }
  rational.sort((left, right) => left.bid - right.bid);
  const candidates = rational.map((candidate) => ({
    optionId: candidate.optionId,
    bid: candidate.bid,
    utility: candidate.utility,
    weight: candidateWeight({
      candidate,
      bestUtility: ranked[0]!.utility,
      rationalTarget,
      maxBid,
      stakes,
      behavioralBias,
    }),
  }));
  const rationalRange: [number, number] = [
    candidates[0]?.bid ?? rationalTarget,
    candidates.at(-1)?.bid ?? rationalTarget,
  ];
  return {
    assessment: {
      traceId: trace.traceId,
      traceRulesProfile: profile,
      printedTrace: trace.printedTrace,
      effectiveTraceLimit: trace.effectiveTraceLimit,
      currentLink,
      visibleOpponentBidCapacity: trace.visibleOpponentBidCapacity,
      rationalTarget,
      rationalRange,
      stakes,
      behavioralBias,
      reserveTarget,
      outcomeValue,
    },
    candidates,
    selectedOptionId: ranked[0]!.optionId,
  };
}

function bidUtility(input: {
  input: AiDecisionInput;
  profile: TraceRulesProfile;
  bid: number;
  maxBid: number;
  currentLink: number;
  outcomeValue: number;
  reserveTarget: number;
  specializedCapacity: number;
  effectiveTraceLimit: number;
}): number {
  const cashCost = Math.max(0, input.bid - input.specializedCapacity);
  const creditsAfter = Math.max(
    0,
    input.input.playerView.own.credits - cashCost,
  );
  const reserveDeficit = Math.max(0, input.reserveTarget - creditsAfter);
  const opportunityCost = cashCost + reserveDeficit * 2.75;
  const probability =
    input.input.side === "corp"
      ? corpSuccessProbability(input)
      : runnerPreventionProbability(input);
  return probability * input.outcomeValue - opportunityCost;
}

function corpSuccessProbability(input: {
  input: AiDecisionInput;
  profile: TraceRulesProfile;
  bid: number;
  currentLink: number;
}): number {
  const visibleRunnerBidCapacity = Math.max(
    0,
    Math.floor(input.input.playerView.trace!.visibleOpponentBidCapacity),
  );
  const tieAdjustment = input.profile === "classic_blind_corp_ties" ? 0 : -1;
  const maximumDefeatedRunnerBid =
    input.bid - input.currentLink + tieAdjustment;
  return clamp01(
    (maximumDefeatedRunnerBid + 1) / (visibleRunnerBidCapacity + 1),
  );
}

function runnerPreventionProbability(input: {
  input: AiDecisionInput;
  profile: TraceRulesProfile;
  bid: number;
  currentLink: number;
  effectiveTraceLimit: number;
}): number {
  const visibleCorpCapacity = Math.min(
    Math.max(0, Math.floor(input.effectiveTraceLimit)),
    Math.max(
      0,
      Math.floor(input.input.playerView.trace!.visibleOpponentBidCapacity),
    ),
  );
  const runnerStrength = input.currentLink + input.bid;
  const maximumPreventedCorpBid =
    input.profile === "classic_blind_corp_ties"
      ? runnerStrength - 1
      : runnerStrength;
  return clamp01((maximumPreventedCorpBid + 1) / (visibleCorpCapacity + 1));
}

function traceOutcomeValue(
  input: AiDecisionInput,
  traceContext: LatestTraceContext,
  tagPunishFollowupKnown: boolean,
): number {
  const effect = visibleTraceSuccessEffect(input, traceContext);
  if (!effect) return 3;
  const baseValue = (() => {
    switch (effect.type) {
      case "none":
        return 1;
      case "add_tag":
        return 4 + Math.max(0, effect.amount - 1) * 2;
      case "net_damage":
        return 4 + Math.max(0, effect.amount) * 2;
      case "add_tags_by_trace_margin_over_runner_link":
        return 6;
      case "add_counter":
        return 4 + Math.max(0, effect.amount);
      case "add_tag_and_counter":
        return 6 + Math.max(0, effect.tagAmount + effect.amount);
      case "end_run_and_run_lock":
        return 8;
      case "end_run_trash_program_and_run_lock":
        return 11;
      case "end_run_trash_hardware_and_unpreventable_meat_damage":
        return 13 + Math.max(0, effect.amount);
      case "trash_runner_resource_and_add_tag":
        return 9;
    }
  })();
  return effectCreatesTag(effect) && tagPunishFollowupKnown
    ? baseValue + 4
    : baseValue;
}

function effectCreatesTag(
  effect: TraceSuccessEffect | undefined,
): effect is TraceSuccessEffect {
  if (!effect) return false;
  return (
    effect.type === "add_tag" ||
    effect.type === "add_tags_by_trace_margin_over_runner_link" ||
    effect.type === "add_tag_and_counter" ||
    effect.type === "trash_runner_resource_and_add_tag"
  );
}

function knownTagPunishFollowup(
  input: AiDecisionInput,
): KnownTagPunishFollowup {
  const visibleCorpCards =
    input.side === "corp"
      ? [
          ...input.playerView.own.gripOrHq,
          ...input.playerView.own.scoreArea,
          ...input.playerView.servers.flatMap((server) => [
            ...server.ice,
            ...server.root,
          ]),
        ]
      : [
          ...input.playerView.opponent.scoreArea,
          ...input.playerView.servers.flatMap((server) => [
            ...server.ice,
            ...server.root,
          ]),
        ];
  const knownDefinitionIds = new Set(
    visibleCorpCards.flatMap((card) =>
      card.known !== false && card.definitionId ? [card.definitionId] : [],
    ),
  );
  if (input.side === "runner") {
    const safeHqDefinitions =
      reconstructBeliefState(input).runnerOpponentModel?.hqHandMemory.ledger
        .safeDefinitions ?? [];
    for (const known of safeHqDefinitions) {
      if (known.count > 0) knownDefinitionIds.add(known.definitionId);
    }
  }

  const payoffDefinitions = [...knownDefinitionIds].filter(
    (definitionId) =>
      classifyTagPunishPayoffFromOntology(definitionId)?.payoff === true,
  );
  if (payoffDefinitions.length === 0) {
    return { payoffKnown: false, lethalDamage: 0 };
  }

  const runnerGrip =
    input.side === "runner"
      ? input.playerView.own.gripOrHq.length
      : input.playerView.opponent.handCount;
  const corpCredits =
    input.side === "runner"
      ? input.playerView.opponent.credits
      : input.playerView.own.credits;
  const corpClicks =
    input.side === "runner"
      ? input.playerView.opponent.clicks
      : input.playerView.own.clicks;
  const visibleCorpBidCapacity = Math.max(
    0,
    Math.floor(input.playerView.trace?.visibleOpponentBidCapacity ?? 0),
  );
  const runnerHasMeatDamagePrevention =
    visibleRunnerMeatDamagePrevention(input);
  const lethalProfiles = payoffDefinitions
    .map((definitionId) =>
      knownLethalTagPunishProfile(definitionId, runnerGrip),
    )
    .filter(
      (
        profile,
      ): profile is {
        damage: number;
        creditCost: number;
        clickCost: number;
      } => profile !== undefined,
    )
    .filter(() => !runnerHasMeatDamagePrevention)
    .map((profile) => {
      const spareCreditClicks = Math.max(0, corpClicks - profile.clickCost);
      return {
        ...profile,
        dangerousCorpBidCapacity: Math.min(
          visibleCorpBidCapacity,
          Math.floor(corpCredits + spareCreditClicks - profile.creditCost),
        ),
      };
    })
    .filter((profile) => profile.dangerousCorpBidCapacity >= 0)
    .sort(
      (left, right) =>
        right.dangerousCorpBidCapacity - left.dangerousCorpBidCapacity ||
        right.damage - left.damage,
    );
  const lethal = lethalProfiles[0];
  return {
    payoffKnown: true,
    lethalDamage: lethal?.damage ?? 0,
    ...(lethal
      ? { dangerousCorpBidCapacity: lethal.dangerousCorpBidCapacity }
      : {}),
  };
}

function knownLethalTagPunishProfile(
  definitionId: string,
  runnerGrip: number,
): { damage: number; creditCost: number; clickCost: number } | undefined {
  if (runnerGrip <= 0) return undefined;
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  if (!hint) return undefined;
  const damage = Math.max(
    0,
    ...(hint.effects ?? []).map((effect) =>
      effect.kind === "damage" &&
      effect.scope === "runner" &&
      effect.timing === "action" &&
      (effect.resource === "meat_damage" || effect.resource === "damage")
        ? Math.max(0, Math.floor(effect.amount ?? 0))
        : 0,
    ),
  );
  const creditCost = exactNonNegativeInteger(hint.costProfile?.credits);
  const clickCost = exactNonNegativeInteger(hint.costProfile?.clicks);
  if (
    damage < runnerGrip ||
    creditCost === undefined ||
    clickCost === undefined ||
    clickCost <= 0
  ) {
    return undefined;
  }
  return { damage, creditCost, clickCost };
}

function visibleRunnerMeatDamagePrevention(input: AiDecisionInput): boolean {
  const runnerCards =
    input.side === "runner"
      ? [...(input.playerView.own.rig ?? []), ...input.playerView.own.scoreArea]
      : [
          ...(input.playerView.opponent.rig ?? []),
          ...input.playerView.opponent.scoreArea,
        ];
  return runnerCards.some((card) => {
    if (card.known === false || !card.definitionId) return false;
    const hint = AI_HINTS_BY_CARD.get(card.definitionId);
    return hintHasMeatDamagePrevention(hint);
  });
}

function hintHasMeatDamagePrevention(hint: AiCardHint | undefined): boolean {
  return (
    hint?.functionSignals?.includes("defense.meat_damage_prevention") ===
      true ||
    hint?.effects?.some(
      (effect) =>
        effect.kind === "meat_damage_prevention" ||
        (effect.kind === "prevention_replacement" &&
          effect.target === "meat_damage"),
    ) === true
  );
}

function exactNonNegativeInteger(
  value: number | undefined,
): number | undefined {
  return Number.isInteger(value) && (value ?? -1) >= 0 ? value : undefined;
}

function visibleTraceSuccessEffect(
  input: AiDecisionInput,
  traceContext: LatestTraceContext,
): TraceSuccessEffect | undefined {
  const encountered = input.playerView.run?.encounteredIce;
  const effects =
    encountered?.effectiveRunQuote?.subroutines.flatMap((subroutine) =>
      subroutine.traceSuccessEffect ? [subroutine.traceSuccessEffect] : [],
    ) ?? [];
  if (effects.length === 1) return effects[0];
  const sourceDefinitionId = traceContext.sourceDefinitionId;
  if (!sourceDefinitionId) return undefined;
  const quotes = traceSuccessEffectCardImplementationQuotesForDefinition(
    sourceDefinitionId,
  ).filter(
    (quote) =>
      traceContext.traceLimit === undefined ||
      quote.traceLimit === traceContext.traceLimit,
  );
  return quotes.length === 1 ? quotes[0]?.traceSuccessEffect : undefined;
}

function classifyStakes(
  input: AiDecisionInput,
  outcomeValue: number,
  traceContext: LatestTraceContext,
  tagPunishFollowup: KnownTagPunishFollowup,
): TraceBidStakes {
  const effect = visibleTraceSuccessEffect(input, traceContext);
  const runnerGrip =
    input.side === "runner"
      ? input.playerView.own.gripOrHq.length
      : input.playerView.opponent.handCount;
  if (
    effect?.type === "net_damage" &&
    effect.amount >= runnerGrip &&
    runnerGrip > 0
  ) {
    return "terminal";
  }
  if (
    effectCreatesTag(effect) &&
    tagPunishFollowup.lethalDamage >= runnerGrip &&
    tagPunishFollowup.dangerousCorpBidCapacity !== undefined
  ) {
    return "terminal";
  }
  if (
    effect?.type === "end_run_trash_hardware_and_unpreventable_meat_damage" &&
    effect.amount >= runnerGrip &&
    runnerGrip > 0
  ) {
    return "terminal";
  }
  if (outcomeValue >= 11 || input.playerView.own.tags > 0) return "high";
  if (outcomeValue >= 5) return "normal";
  return "low";
}

function runnerMinimumSafeBid(input: {
  input: AiDecisionInput;
  profile: TraceRulesProfile;
  currentLink: number;
  effect: TraceSuccessEffect | undefined;
  tagPunishFollowup: KnownTagPunishFollowup;
}): number | undefined {
  if (input.input.side !== "runner") return undefined;
  const runnerGrip = input.input.playerView.own.gripOrHq.length;
  const visibleCorpCapacity = Math.min(
    Math.max(0, Math.floor(input.input.playerView.trace!.effectiveTraceLimit)),
    Math.max(
      0,
      Math.floor(input.input.playerView.trace!.visibleOpponentBidCapacity),
    ),
  );
  const directLethal =
    (input.effect?.type === "net_damage" ||
      input.effect?.type ===
        "end_run_trash_hardware_and_unpreventable_meat_damage") &&
    input.effect.amount >= runnerGrip &&
    runnerGrip > 0;
  const dangerousCorpBidCapacity = directLethal
    ? visibleCorpCapacity
    : input.tagPunishFollowup.dangerousCorpBidCapacity;
  if (dangerousCorpBidCapacity === undefined) return undefined;
  const strengthNeeded =
    dangerousCorpBidCapacity +
    (input.profile === "classic_blind_corp_ties" ? 1 : 0);
  return Math.max(0, strengthNeeded - input.currentLink);
}

function reserveTargetFor(
  input: AiDecisionInput,
  stakes: TraceBidStakes,
): number {
  if (stakes === "terminal") return 0;
  if (input.side === "runner") {
    return input.playerView.run ? 2 : 1;
  }
  return input.playerView.own.clicks > 0 ? 2 : 1;
}

function behavioralBiasFor(
  stakes: TraceBidStakes,
  outcomeValue: number,
): TraceBidBehavioralBias {
  if (stakes === "terminal") return "normal";
  if (stakes === "high") return "conservative";
  if (stakes === "low" && outcomeValue <= 3) return "polarized";
  if (stakes === "normal" && outcomeValue >= 8) return "aggressive";
  return "normal";
}

function stakesTolerance(stakes: TraceBidStakes): number {
  switch (stakes) {
    case "low":
      return 3.5;
    case "normal":
      return 2;
    case "high":
      return 0.85;
    case "terminal":
      return 2;
  }
}

function candidateWeight(input: {
  candidate: { bid: number; utility: number };
  bestUtility: number;
  rationalTarget: number;
  maxBid: number;
  stakes: TraceBidStakes;
  behavioralBias: TraceBidBehavioralBias;
}): number {
  const gap = Math.max(0, input.bestUtility - input.candidate.utility);
  const stakesScale =
    input.stakes === "low"
      ? 0.8
      : input.stakes === "normal"
        ? 1.3
        : input.stakes === "high"
          ? 2.4
          : 5;
  let weight = 100 / (1 + gap * stakesScale);
  if (
    input.behavioralBias === "conservative" &&
    input.candidate.bid < input.rationalTarget
  )
    weight *= 1.35;
  if (
    input.behavioralBias === "aggressive" &&
    input.candidate.bid > input.rationalTarget
  )
    weight *= 1.35;
  if (
    input.behavioralBias === "polarized" &&
    (input.candidate.bid === 0 || input.candidate.bid === input.maxBid)
  )
    weight *= 1.5;
  return Math.max(1, Math.round(weight));
}

function isBlindProfile(
  profile: TraceRulesProfile | undefined,
): profile is "classic_blind" | "classic_blind_corp_ties" {
  return profile === "classic_blind" || profile === "classic_blind_corp_ties";
}

function roundedUtility(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
