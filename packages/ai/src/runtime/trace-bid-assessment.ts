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

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;

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
  const outcomeValue = traceOutcomeValue(input, traceContext);
  const stakes = classifyStakes(input, outcomeValue, traceContext);
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
  const ranked = utilities
    .slice()
    .sort(
      (left, right) =>
        right.utility - left.utility ||
        left.bid - right.bid ||
        left.optionId.localeCompare(right.optionId),
    );
  const rationalTarget = ranked[0]!.bid;
  const tolerance = stakesTolerance(stakes);
  let rational = utilities.filter(
    (candidate) => ranked[0]!.utility - candidate.utility <= tolerance,
  );
  if (rational.length === 1 && stakes !== "terminal") {
    const neighbor = ranked.find(
      (candidate) => candidate.optionId !== rational[0]!.optionId,
    );
    if (neighbor) rational = [...rational, neighbor];
  }
  if (behavioralBias === "polarized") {
    for (const edge of [utilities[0], utilities.at(-1)]) {
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
    Math.floor(input.input.playerView.opponent.credits),
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
    Math.max(0, Math.floor(input.input.playerView.opponent.credits)),
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
): number {
  const effect = visibleTraceSuccessEffect(input, traceContext);
  if (!effect) return 3;
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
      return 0.2;
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
