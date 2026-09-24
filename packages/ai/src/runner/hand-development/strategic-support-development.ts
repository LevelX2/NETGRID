import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import {
  breakerCardBlocksAccessReachability,
  getStructuredBreakerProfileForCard,
} from "../../breaker-ontology-consumer";
import type { RunnerStrategicIntentProfile } from "../../runner-strategic-intent";
import type { RunnerRigRoleDemandInput } from "../rig-demand/runner-rig-demand-projection";
import { runnerRestrictedRunCreditProfile } from "../../runtime/runner-canonical-card-facts";
import { planInstanceIdForProposal } from "../../plans/plan-instance";

export function successfulRunStrengthCounter(definitionId: string | undefined) {
  const mechanic = definitionId
    ? cardSpecPlanningCardByDefinitionId(definitionId)?.planning.engine
        .virusCounter
    : undefined;
  return mechanic?.addOnSuccessfulRun?.server === "any" &&
    mechanic.addOnSuccessfulRun.counterScope.kind ===
      "chosen_fully_broken_ice" &&
    mechanic.continuousEffect?.kind === "ice_strength_reduce_per_counter"
    ? mechanic
    : undefined;
}

function supportKind(card: VisibleCard) {
  if (successfulRunStrengthCounter(card.definitionId))
    return "successful_run_strength_counter";
  if (
    card.definitionId &&
    AI_HINTS_BY_CARD.get(card.definitionId)?.effects?.some(
      (e) =>
        e.kind === "global_modifier" &&
        e.timing === "persistent" &&
        e.target === "ice.strength_modifier",
    )
  )
    return "passive_strength";
  if (runnerRestrictedRunCreditProfile(card.definitionId))
    return "recurring_breaker_credits";
  return undefined;
}

export function strategicSupportWindow(input: AiDecisionInput) {
  const own = input.playerView.own;
  return (
    input.playerView.timingPoint === "runner_action.main" &&
    own.tags === 0 &&
    own.stackOrRdCount >= 3 &&
    input.playerView.opponent.deckCount >= 3 &&
    own.agendaPoints < input.playerView.agendaPointsToWin - 2 &&
    input.playerView.opponent.agendaPoints <
      input.playerView.agendaPointsToWin - 2 &&
    !input.playerView.servers.some(
      (s) =>
        !["hq", "rd", "archives"].includes(s.id) &&
        s.root.some(
          (c) => c.type === "agenda" || (c.advancementCounters ?? 0) > 0,
        ),
    )
  );
}

/** Development-owner inventory value, not a quote of guaranteed future savings.
 * Only visible, affordable programs with a real installed consumer qualify.
 * No missing breaker or hypothetical draw is invented to justify more MU.
 */
export function strategicSupportPrograms(
  input: AiDecisionInput,
  minimumCreditFloor: number,
  strategicIntent?: RunnerStrategicIntentProfile,
) {
  if (!strategicSupportWindow(input)) return [];
  const own = input.playerView.own;
  const rig = own.rig ?? [];
  const consumers = rig.filter((c) => {
    const p = getStructuredBreakerProfileForCard(c.definitionId);
    return (
      c.known &&
      c.type === "program" &&
      !breakerCardBlocksAccessReachability(c.definitionId) &&
      (p?.coverage?.length ?? 0) > 0 &&
      (p?.pumpCost ?? 0) > 0
    );
  });
  if (!consumers.length) return [];
  const ice = input.playerView.servers.flatMap((s) => s.ice);
  // Fully known zero-strength boards provide no prospective pumping benefit.
  // Unrevealed ICE gives bounded option value, not a fabricated strength quote.
  if (
    !ice.some(
      (c) =>
        !c.known ||
        !c.rezzed ||
        (c.effectiveRunQuote?.encounterStrength ?? c.strength ?? 0) > 0,
    )
  )
    return [];
  const strategyBonus = strategicIntent?.setupEngine.some(
    (s) =>
      s === "runner.rig_first" || s === "runner.economy_setup_before_pressure",
  )
    ? 15
    : 0;
  return own.gripOrHq
    .flatMap((card) => {
      const kind = supportKind(card);
      if (
        !kind ||
        !card.known ||
        card.type !== "program" ||
        !Number.isSafeInteger(card.memoryCost) ||
        card.memoryCost! <= 0 ||
        !Number.isSafeInteger(card.installCost) ||
        card.installCost! < 0 ||
        own.credits - card.installCost! < minimumCreditFloor
      )
        return [];
      const copies = rig.filter(
        (c) => c.definitionId === card.definitionId,
      ).length;
      // One conditional virus investment at a time; passive copies have a bounded
      // diminishing value. Recurring credits require a compatible non-noisy user.
      if (
        (kind === "successful_run_strength_counter" && copies > 0) ||
        (kind === "passive_strength" && copies >= 3)
      )
        return [];
      if (kind === "recurring_breaker_credits") {
        const profile = runnerRestrictedRunCreditProfile(card.definitionId)!;
        if (
          !profile.uses.includes("using_icebreaker_during_run_non_noisy") ||
          !consumers.some((c) => !c.subtypes?.includes("noisy"))
        )
          return [];
        const installedCapacity = rig.reduce(
          (sum, c) =>
            sum +
            (runnerRestrictedRunCreditProfile(c.definitionId)?.capacity ?? 0),
          0,
        );
        if (installedCapacity >= 6) return [];
      }
      const value = Math.round(
        (90 + strategyBonus - card.installCost! * 10) / (copies + 1) - 10,
      );
      if (value <= 0) return [];
      return [
        {
          card,
          kind,
          value,
          strategyBonus,
          installCost: card.installCost!,
          memoryUnits: card.memoryCost!,
          consumerId: consumers[0]!.instanceId,
        },
      ];
    })
    .sort(
      (a, b) =>
        b.value - a.value || a.card.instanceId.localeCompare(b.card.instanceId),
    );
}

/** The existing development owner supplies the shared projection with its
 * next affordable milestone. At most one copy per kind is prepared at once.
 * Reserve the actual memory-install cost as well as the program costs.
 */
export function strategicSupportDemands(
  input: AiDecisionInput,
  minimumCreditFloor: number,
  strategicIntent: RunnerStrategicIntentProfile,
  binding: RunnerRigRoleDemandInput["binding"],
): RunnerRigRoleDemandInput[] {
  const own = input.playerView.own;
  const memoryActions = input.legalActions.filter(
    (a) =>
      a.type === "install_card" &&
      a.side === "runner" &&
      a.expiresAtStateVersion === input.playerView.stateVersion &&
      !a.targetRequirements.length &&
      !a.choiceRequirements?.length &&
      own.gripOrHq.some(
        (c) => c.instanceId === a.source && (c.memoryLimitBonus ?? 0) > 0,
      ),
  );
  const memoryInstallCost = memoryActions.length
    ? Math.min(
        ...memoryActions.map((a) =>
          a.costs.reduce((sum, c) => sum + (c.credits ?? 0), 0),
        ),
      )
    : 0;
  let budget = own.credits - minimumCreditFloor - memoryInstallCost;
  const kinds = new Set<string>();
  const demands: RunnerRigRoleDemandInput[] = [];
  for (const support of strategicSupportPrograms(
    input,
    minimumCreditFloor,
    strategicIntent,
  )) {
    if (
      kinds.has(support.kind) ||
      support.installCost > budget ||
      demands.length >= 2
    )
      continue;
    kinds.add(support.kind);
    budget -= support.installCost;
    const card = support.card;
    const demandId = `strategic-support:${card.instanceId}`;
    demands.push({
      demandId,
      ownerModuleId: "runner.develop_board_and_hand",
      sourceKind: "admission_checked_development",
      sourcePlanInstanceId: planInstanceIdForProposal({
        moduleId: "runner.develop_board_and_hand",
        dedupeKey: `card:${card.instanceId}`,
      }),
      sourceNeedId: demandId,
      capabilityId: `strategic_support:${support.kind}`,
      horizon: "next_rig_milestone",
      guarantee: "forecast",
      requirement: "preferred_simultaneously",
      simultaneousSetId: "development:visible-support-milestone",
      binding,
      providers: [
        {
          providerId: `card:${card.instanceId}`,
          cardInstanceId: card.instanceId,
          definitionId: card.definitionId!,
          memoryMode: "general",
          memoryUnits: support.memoryUnits,
          evidenceCodes: [],
        },
      ],
      evidenceCodes: [
        `runner_support_consumer:${support.consumerId}`,
        `runner_support_strategy_bonus:${support.strategyBonus}`,
        "runner_support_future_value_not_spendable",
        "runner_support_milestone_visible_and_funded",
      ],
    });
  }
  return demands;
}
