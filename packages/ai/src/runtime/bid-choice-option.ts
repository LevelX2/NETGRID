import { traceSuccessEffectCardImplementationQuotesForDefinition } from "@netgrid/engine";
import {
  type AiDecisionInput,
  type AiDifficulty,
  type CardDefinitionId,
} from "@netgrid/shared";

import { selectEfficientTraceBidOption } from "../trace-bid-efficiency";
import { classifyTagPunishPayoffFromOntology } from "../tag-punish-ontology-consumer";
import { assessCorpTraceBid } from "./corp-trace-bid-assessment";
import {
  currentEncounteredIceCard,
  currentRunRemainingIce,
} from "./current-encounter";
import { getRunnerRunPlanMemorySnapshot } from "./runner-run-plan-memory";
import { quoteRunnerRunPath } from "./runner-run-plan-path-quote";
import type {
  RunnerRunIceEncounterQuote,
  RunnerRunPlan,
} from "./runner-run-plan-types";
import { type LatestTraceContext } from "./trace-context";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;

export function selectedBidChoiceOptionId(
  input: AiDecisionInput,
  choice: PendingChoice,
  traceContext: LatestTraceContext,
): string | undefined {
  const bidOptions = choice.options
    .map((option) => ({
      id: option.id,
      amount: typeof option.value === "number" ? option.value : Number.NaN,
    }))
    .filter((option) => Number.isInteger(option.amount) && option.amount >= 0)
    .sort((left, right) => left.amount - right.amount);
  const maxBid = bidOptions.at(-1)?.amount ?? 0;
  let desired = 0;
  if (input.side === "corp") {
    desired = corpDesiredBidAmount(input, choice, traceContext, maxBid);
  } else if (
    choice.source.startsWith("card_implementation.secret_spend_compare:")
  ) {
    desired = maxBid;
  } else {
    const runnerNeedsStrictlyMore =
      traceContext.traceRulesProfile === "classic_blind_corp_ties" ||
      traceContext.traceRulesProfile === undefined;
    const winningBid = Math.max(
      0,
      (traceContext.traceValue ?? 0) -
        (traceContext.runnerLink ?? 0) +
        (runnerNeedsStrictlyMore ? 1 : 0),
    );
    desired = input.difficulty === "easy" ? 0 : Math.min(maxBid, winningBid);
  }
  let selected =
    bidOptions.find((option) => option.amount === desired) ?? bidOptions[0];
  if (input.side === "runner" && selected) {
    selected =
      selectEfficientTraceBidOption({
        side: input.side,
        bidOptions,
        desiredAmount: desired,
        ...traceContext,
      }).option ?? selected;
    selected =
      runnerRunBudgetPreservingBidOption(
        input,
        bidOptions,
        selected,
        traceContext,
      ) ?? selected;
  }
  return selected?.id;
}

function runnerRunBudgetPreservingBidOption(
  input: AiDecisionInput,
  bidOptions: readonly { id: string; amount: number }[],
  selected: { id: string; amount: number },
  traceContext: LatestTraceContext,
): { id: string; amount: number } | undefined {
  const traceValue = traceContext.traceValue;
  const runnerLink = traceContext.runnerLink;
  if (
    input.side !== "runner" ||
    !input.playerView.run ||
    !Number.isInteger(traceValue) ||
    !Number.isInteger(runnerLink) ||
    typeof traceValue !== "number" ||
    typeof runnerLink !== "number" ||
    !runnerAvoidsTrace(
      runnerLink,
      selected.amount,
      traceValue,
      traceContext.traceRulesProfile,
    )
  ) {
    return undefined;
  }
  const tagAmount = currentTraceTagAmount(input, traceContext);
  if (
    tagAmount <= 0 ||
    input.playerView.own.tags > 0 ||
    input.playerView.own.clicks < tagAmount ||
    runnerFacesVisibleTagPunish(input)
  ) {
    return undefined;
  }
  const plan = getRunnerRunPlanMemorySnapshot(input);
  if (!plan || !runObjectiveJustifiesTakingTag(plan)) return undefined;
  const remainingCost = knownRemainingRunCashCost(input, plan);
  if (remainingCost === undefined) return undefined;
  const reserve = runnerRunPlanReserveTarget(plan);
  const credits = input.playerView.own.credits;
  const minimumLosingBid = bidOptions.find(
    (option) =>
      !runnerAvoidsTrace(
        runnerLink,
        option.amount,
        traceValue,
        traceContext.traceRulesProfile,
      ),
  );
  if (!minimumLosingBid) return undefined;
  const basicTagCleanupCost = tagAmount * 2;
  if (
    credits - minimumLosingBid.amount <
    remainingCost + reserve + basicTagCleanupCost
  ) {
    return undefined;
  }
  const cleanupClickOpportunityCost = tagAmount;
  const winningBidPremium = selected.amount - minimumLosingBid.amount;
  const cleanupEconomicCost = basicTagCleanupCost + cleanupClickOpportunityCost;
  const selectedPreservesRunBudget =
    credits - selected.amount >= remainingCost + reserve;
  if (selectedPreservesRunBudget && winningBidPremium <= cleanupEconomicCost) {
    return undefined;
  }
  return minimumLosingBid;
}

function currentTraceTagAmount(
  input: AiDecisionInput,
  traceContext: LatestTraceContext,
): number {
  const tagAmounts =
    currentEncounteredIceCard(input)?.effectiveRunQuote?.subroutines.flatMap(
      (subroutine) =>
        subroutine.traceSuccessEffect?.type === "add_tag"
          ? [Math.max(0, subroutine.traceSuccessEffect.amount)]
          : [],
    ) ?? [];
  if (tagAmounts.length === 1) return tagAmounts[0] ?? 0;
  const sourceDefinitionId = traceContext.sourceDefinitionId;
  if (!sourceDefinitionId) return 0;
  const implementationQuotes =
    traceSuccessEffectCardImplementationQuotesForDefinition(
      sourceDefinitionId as CardDefinitionId,
    ).filter(
      (quote) =>
        traceContext.traceLimit === undefined ||
        quote.traceLimit === traceContext.traceLimit,
    );
  const implementationTagAmounts = implementationQuotes.flatMap((quote) =>
    quote.traceSuccessEffect.type === "add_tag"
      ? [Math.max(0, quote.traceSuccessEffect.amount)]
      : [],
  );
  const uniqueTagAmounts = new Set(implementationTagAmounts);
  return uniqueTagAmounts.size === 1 ? (implementationTagAmounts[0] ?? 0) : 0;
}

function runnerFacesVisibleTagPunish(input: AiDecisionInput): boolean {
  const visibleCorpCards = [
    ...input.playerView.opponent.scoreArea,
    ...input.playerView.servers.flatMap((server) =>
      server.id === "archives" ? [] : [...server.ice, ...server.root],
    ),
  ];
  return visibleCorpCards.some(
    (card) =>
      card.known !== false &&
      classifyTagPunishPayoffFromOntology(card.definitionId)?.payoff === true,
  );
}

function runObjectiveJustifiesTakingTag(plan: RunnerRunPlan): boolean {
  switch (plan.objective.kind) {
    case "access_hq_card":
    case "access_rnd_top":
    case "access_rnd_multi":
    case "access_hq_multi":
    case "trash_asset_or_upgrade":
      return plan.objective.expectedValue > 0;
    case "contest_remote_agenda":
      return plan.objective.urgency > 0;
    case "access_archives":
      return (plan.accessIntent?.expectedAccessCount ?? 0) > 0;
    case "run_card_effect":
    case "survival_or_win_pressure":
      return true;
    case "probe_unknown_ice":
    case "force_rez":
      return false;
  }
}

function knownRemainingRunCashCost(
  input: AiDecisionInput,
  plan: RunnerRunPlan,
): number | undefined {
  const remainingIce = currentRunRemainingIce(input);
  if (remainingIce.length === 0) return 0;
  if (remainingIce.some((ice) => !ice.known || ice.rezzed === false)) {
    return undefined;
  }
  const quotesByIceId = new Map(
    quoteRunnerRunPath(input, plan).iceQuotes.map((quote) => [
      quote.iceRef.instanceId,
      quote,
    ]),
  );
  let totalCashCost = 0;
  for (const ice of remainingIce) {
    const quote = quotesByIceId.get(ice.instanceId);
    const cashCost = accessPreservingCashCost(quote);
    if (cashCost === undefined) return undefined;
    totalCashCost += cashCost;
  }
  return totalCashCost;
}

function accessPreservingCashCost(
  quote: RunnerRunIceEncounterQuote | undefined,
): number | undefined {
  if (!quote) return undefined;
  const sequence = quote.cheapestAccessPreservingSequence;
  if (sequence) return Math.max(0, sequence.cashCost);
  const requiresBreak = quote.subroutineQuotes.some((subroutine) =>
    [
      "must_break_for_access",
      "must_break_for_survival",
      "must_break_for_plan_budget",
      "too_expensive_abort_recommended",
    ].includes(subroutine.threatClass),
  );
  return requiresBreak ? undefined : 0;
}

function runnerRunPlanReserveTarget(plan: RunnerRunPlan): number {
  return Math.max(
    0,
    plan.reserve.minimumCreditsAfterRun,
    plan.reserve.preserveStealOrTrashCredits,
    plan.budget.reservedCreditsAfterRun,
    plan.budget.reservedCreditsForSteal,
    plan.budget.reservedCreditsForTrash,
  );
}

function runnerAvoidsTrace(
  runnerLink: number,
  runnerBid: number,
  traceValue: number,
  profile: LatestTraceContext["traceRulesProfile"],
): boolean {
  const runnerStrength = Math.max(0, runnerLink) + runnerBid;
  const corpStrength = Math.max(0, traceValue);
  return profile === "classic_blind_corp_ties" || profile === undefined
    ? runnerStrength > corpStrength
    : runnerStrength >= corpStrength;
}

function corpDesiredBidAmount(
  input: AiDecisionInput,
  choice: PendingChoice,
  traceContext: LatestTraceContext,
  maxBid: number,
): number {
  if (
    choice.source.startsWith(
      "hidden_zone.secret_spend_guess_then_targeted_bypass_run.guess:",
    )
  ) {
    return socialEngineeringCorpGuessAmount(input.difficulty, maxBid);
  }
  if (input.difficulty === "easy") return 0;
  const sourceDefinitionId =
    traceContext.sourceDefinitionId ??
    input.playerView.run?.encounteredIce?.definitionId;
  return assessCorpTraceBid({
    input,
    traceContext,
    maxBid,
    ...(sourceDefinitionId ? { sourceDefinitionId } : {}),
  }).recommendedBid;
}

export function socialEngineeringCorpGuessAmount(
  difficulty: AiDifficulty,
  maximumGuess: number,
): number {
  if (difficulty === "hard") return maximumGuess;
  if (difficulty === "normal") {
    return Math.max(2, Math.ceil(maximumGuess * 0.75));
  }
  return Math.min(2, maximumGuess);
}
