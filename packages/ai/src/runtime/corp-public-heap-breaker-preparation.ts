import {
  cardImplementationForDefinitionId,
  visibleProgramHostInstallVariants,
  visibleRunnerNextTurnPreparationCreditGain,
} from "@netgrid/engine";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

export type PublicHeapBreakerPreparation = Readonly<{
  card: VisibleCard;
  remainingGeneralCredits: number;
  preparationCreditCost: number;
  preparationClicks: number;
  recoveryCount: number;
  evidence: readonly string[];
}>;

/** Public next-turn facts, not future LegalActions. Only an installed, unlimited
 * single-effect top-Heap recovery and a fixed-cost program install are quoted.
 * The Engine's preparation-click quote has already reserved the run action. */
export function visibleRunnerHeapBreakerPreparations(
  input: AiDecisionInput,
): readonly PublicHeapBreakerPreparation[] {
  if (input.side !== "corp" || input.playerView.activeSide !== "corp")
    return [];
  const runner = input.playerView.opponent;
  const rig = runner.rig ?? [];
  const sources = rig.flatMap((source) => {
    if (
      !source.known ||
      !source.rezzed ||
      source.controller !== "runner" ||
      !source.definitionId
    )
      return [];
    const abilities = cardImplementationForDefinitionId(
      source.definitionId,
    )?.abilities;
    if (abilities?.length !== 1) return [];
    const ability = abilities[0]!;
    if (
      ability.kind !== "activated" ||
      ability.timing !== "runner_main" ||
      ability.condition ||
      ability.limit ||
      ability.effects.length !== 1 ||
      ability.effects[0]?.kind !== "move_top_trash_to_grip" ||
      ability.effects[0].recipient !== "runner"
    )
      return [];
    let clicks = 0;
    let credits = 0;
    for (const cost of ability.costs) {
      if (cost.kind === "action")
        clicks += requireAmount(cost.amount, "recovery_action_cost");
      else if (cost.kind === "credit")
        credits += requireAmount(cost.amount, "recovery_credit_cost");
      else return [];
    }
    return clicks > 0 ? [{ source, clicks, credits }] : [];
  });
  if (sources.length === 0) return [];
  const preparationClicks = requireAmount(
    input.playerView.runnerNextTurnCreditClicks,
    "preparation_click_quote",
  );
  if (preparationClicks < 2) return [];
  const heap = runner.discardCards;
  if (
    !heap ||
    heap.length !== runner.discardCount ||
    heap.some((card) => !card.known || card.owner !== "runner")
  ) {
    throw new Error("corp_public_heap_preparation:incomplete_public_heap");
  }
  const candidates: PublicHeapBreakerPreparation[] = [];
  for (const { source, clicks, credits } of sources) {
    for (let depth = 1; depth <= heap.length; depth += 1) {
      const consumedClicks = depth * clicks + 1;
      if (consumedClicks > preparationClicks) break;
      const card = heap[heap.length - depth]!;
      if (card.type !== "program" || !card.subtypes?.includes("icebreaker"))
        continue;
      const installCredits = requireAmount(
        card.installCost,
        "program_install_cost",
      );
      const memoryCost = requireAmount(card.memoryCost, "program_memory_cost");
      const memoryUsed = requireAmount(runner.memoryUsed, "runner_memory_used");
      const memoryLimit = requireAmount(
        runner.memoryLimit,
        "runner_memory_limit",
      );
      if (memoryUsed > memoryLimit)
        throw new Error("corp_public_heap_preparation:invalid_runner_memory");
      const hosted = visibleProgramHostInstallVariants(card, rig);
      if (!hosted.complete)
        throw new Error("corp_public_heap_preparation:" + hosted.reason);
      const variants = [
        ...(memoryUsed + memoryCost <= memoryLimit ? [card] : []),
        ...hosted.cards,
      ];
      const creditCost = depth * credits + installCredits;
      const remainingCredits =
        requireAmount(runner.credits, "runner_credits") +
        visibleRunnerNextTurnPreparationCreditGain(
          rig,
          preparationClicks - consumedClicks,
        ) -
        creditCost;
      if (!Number.isSafeInteger(remainingCredits))
        throw new Error("corp_public_heap_preparation:unsafe_credit_quote");
      if (remainingCredits < 0) continue;
      for (const variant of variants)
        candidates.push({
          // The recovered card was not installed at turn start. Its old Heap
          // counter displays cannot create a refreshed or carried-over pool.
          card: { ...variant, counterDisplays: [] },
          remainingGeneralCredits: remainingCredits,
          preparationCreditCost: creditCost,
          preparationClicks: consumedClicks,
          recoveryCount: depth,
          evidence: [
            `public_heap_breaker_source:${source.instanceId}`,
            `public_heap_breaker_target:${card.instanceId}`,
            `public_heap_recovery_count:${depth}`,
            `public_heap_preparation_clicks:${consumedClicks}`,
            `public_heap_preparation_credit_cost:${creditCost}`,
            `public_heap_preparation_remaining_credit_clicks:${preparationClicks - consumedClicks}`,
          ],
        });
    }
  }
  return candidates;
}

function requireAmount(value: number | undefined, name: string): number {
  if (!Number.isSafeInteger(value) || value === undefined || value < 0) {
    throw new Error("corp_public_heap_preparation:invalid_" + name);
  }
  return value;
}
