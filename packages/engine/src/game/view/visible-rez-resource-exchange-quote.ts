import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import {
  type CardInstanceId,
  type GameState,
  type VisibleCard,
  type VisibleCorpIceRezResourceExchangeQuote,
  type VisibleEffectiveIceRunQuote,
} from "@netgrid/shared";
import {
  icebreakerAbilitiesForDefinition,
  type RuntimeIcebreakerAbility,
} from "../../ability-engine/icebreaker-abilities";
import { visibleRunnerRigCardForViewer } from "./card-view";
import { visibleEffectiveIceRunQuote } from "./visible-run-quote";
import {
  availableRunnerRunCredits,
  runDurationPaymentHost,
} from "../run/run-duration-payment";

type CompleteRunnerBreak = Extract<
  Extract<VisibleCorpIceRezResourceExchangeQuote, { complete: true }>,
  { runnerBreak: unknown }
>["runnerBreak"];

type BreakRead =
  | { kind: "exact"; quote: CompleteRunnerBreak }
  | { kind: "not_applicable" }
  | { kind: "unknown" };

/**
 * Projects one deterministic, direct current-run breaker exchange from the
 * Engine's card-implementation descriptors. The projection is intentionally
 * conservative: it is available only for the exact currently approached ICE
 * and it fails closed as soon as an unsupported ability effect or incomplete
 * visible card would affect that encounter. Other layers are deliberately not
 * folded into this quote; after the encounter the Engine projects the then
 * current layer again from the mutated state.
 */
export function visibleCorpIceRezResourceExchangeQuote(
  state: GameState,
  iceId: CardInstanceId,
  visibleIce: VisibleCard,
  options: {
    hardEndTheRunSubroutineCountAfterRez?: number;
  } = {},
): VisibleCorpIceRezResourceExchangeQuote | undefined {
  const server = state.corp.servers.find((candidate) =>
    candidate.ice.includes(iceId),
  );
  if (!server || !visibleIce.known || !visibleIce.definitionId) {
    return undefined;
  }
  const binding = {
    context: "installed" as const,
    cardId: iceId,
    targetServerId: server.id,
    projectedServerId: server.id,
    expiresAtStateVersion: state.stateVersion,
  };
  const source = state.cardInstances[iceId];
  const run = state.run;
  if (
    !source ||
    source.rezzed ||
    !run ||
    run.attackedServerId !== server.id ||
    run.position.kind !== "ice" ||
    run.position.serverId !== server.id ||
    run.approachedIceId !== iceId ||
    server.ice[run.position.iceIndex] !== iceId
  ) {
    return {
      ...binding,
      complete: false,
      reason: "not_current_approached_ice",
    };
  }
  const projectedRunQuote = visibleEffectiveIceRunQuote(state, iceId, {
    ...visibleIce,
    known: true,
    rezzed: true,
  });
  if (!projectedRunQuote)
    return {
      ...binding,
      complete: false,
      reason: "effective_run_projection_unavailable",
    };
  const endTheRunCount =
    options.hardEndTheRunSubroutineCountAfterRez ??
    hardEndTheRunSubroutineCount(projectedRunQuote);
  if (endTheRunCount <= 0) {
    return {
      ...binding,
      complete: false,
      reason: "no_hard_end_the_run_subroutine",
    };
  }
  if (!hasOnlyDirectBreakCosts(projectedRunQuote)) {
    return {
      ...binding,
      complete: false,
      reason: "unsupported_encounter_cost_projection",
    };
  }
  const runnerRig = [
    ...state.runner.rig.programs,
    ...state.runner.rig.hardware,
    ...state.runner.rig.resources,
  ].map((cardId) => visibleRunnerRigCardForViewer(state, cardId, "corp"));
  const activeRunnerRig = runnerRig.filter(
    (card) => !cardIsInactiveConcealedRunnerResource(card),
  );
  if (activeRunnerRig.some((card) => !validVisibleRunnerCard(card))) {
    return {
      ...binding,
      complete: false,
      reason: "visible_runner_break_projection_unknown",
    };
  }
  const reads = activeRunnerRig.map((breaker) =>
    quoteRunnerBreak({
      breaker,
      ice: visibleIce,
      endTheRunCount,
      additionalBreakCost:
        projectedRunQuote.breakSubroutineAdditionalCostPerSubroutine ?? 0,
      runnerCredits: state.runner.credits,
      runnerAvailableCredits: availableRunnerRunCredits(
        runDurationPaymentHost(state),
        breaker.instanceId,
      ),
    }),
  );
  if (reads.some((read) => read.kind === "unknown")) {
    return {
      ...binding,
      complete: false,
      reason: "visible_runner_break_projection_unknown",
    };
  }
  const choices = reads
    .flatMap((read) => (read.kind === "exact" ? [read.quote] : []))
    .sort(compareRunnerBreakQuotes);
  const best = choices[0];
  return best
    ? {
        ...binding,
        complete: true,
        hardEndTheRunSubroutineCount: endTheRunCount,
        runnerBreak: best,
      }
    : {
        ...binding,
        complete: true,
        hardEndTheRunSubroutineCount: endTheRunCount,
        runnerBreakUnavailable: {
          reason: "no_visible_eligible_breaker",
          evidenceSource: "engine_icebreaker_ability",
        },
      };
}

function hardEndTheRunSubroutineCount(
  quote: VisibleEffectiveIceRunQuote,
): number {
  return quote.subroutines.filter(
    (subroutine) =>
      subroutine.type === "end_the_run" ||
      subroutine.type === "end_the_run_and_trash_source_at_end_of_turn" ||
      subroutine.type === "end_the_run_and_runner_forgoes_next_action",
  ).length;
}

function hasOnlyDirectBreakCosts(quote: VisibleEffectiveIceRunQuote): boolean {
  return (
    Number.isSafeInteger(
      quote.breakSubroutineAdditionalCostPerSubroutine ?? 0,
    ) &&
    (quote.breakSubroutineAdditionalCostPerSubroutine ?? 0) >= 0 &&
    quote.conditionalEncounterEffects === undefined &&
    quote.encounterTemporaryTraceCredits === undefined
  );
}

function validVisibleRunnerCard(card: VisibleCard): boolean {
  if (card.known !== true || !card.definitionId) return false;
  return CARD_DEFINITIONS_BY_ID[card.definitionId] !== undefined;
}

function cardIsInactiveConcealedRunnerResource(card: VisibleCard): boolean {
  return (
    card.known === false &&
    card.concealed === true &&
    card.hiddenRunnerResource === true &&
    card.type === "resource" &&
    card.rezzed === false
  );
}

function quoteRunnerBreak(params: {
  breaker: VisibleCard;
  ice: VisibleCard;
  endTheRunCount: number;
  additionalBreakCost: number;
  runnerCredits: number;
  runnerAvailableCredits: number;
}): BreakRead {
  const {
    breaker,
    ice,
    endTheRunCount,
    additionalBreakCost,
    runnerCredits,
    runnerAvailableCredits,
  } = params;
  if (!breaker.definitionId || !ice.definitionId) return { kind: "unknown" };
  const breakerDefinition = CARD_DEFINITIONS_BY_ID[breaker.definitionId];
  const iceDefinition = CARD_DEFINITIONS_BY_ID[ice.definitionId];
  if (!breakerDefinition || !iceDefinition) return { kind: "unknown" };
  if (
    !breakerDefinition.subtypes.some(
      (subtype) => normalizeSubtype(subtype) === "icebreaker",
    )
  ) {
    return { kind: "not_applicable" };
  }
  if (
    !nonNegativeSafeInteger(breaker.strength) ||
    !nonNegativeSafeInteger(ice.strength) ||
    !Array.isArray(ice.subtypes)
  ) {
    return { kind: "unknown" };
  }
  const abilities = icebreakerAbilitiesForDefinition(breakerDefinition);
  const matchingBreakAbilities = abilities.filter(
    (ability) =>
      ability.type === "break_subroutine" &&
      breakAbilityMatchesIce(
        ability,
        ice.subtypes ?? iceDefinition.subtypes,
        iceDefinition.id,
      ),
  );
  if (matchingBreakAbilities.length === 0) return { kind: "not_applicable" };
  const quotes: CompleteRunnerBreak[] = [];
  for (const ability of matchingBreakAbilities) {
    const quote = quoteBreakAbility({
      ability,
      abilities,
      breaker,
      ice,
      endTheRunCount,
      additionalBreakCost,
      runnerCredits,
      runnerAvailableCredits,
    });
    if (quote.kind === "unknown") return quote;
    if (quote.kind === "exact") quotes.push(quote.quote);
  }
  const best = quotes.sort(compareRunnerBreakQuotes)[0];
  return best ? { kind: "exact", quote: best } : { kind: "unknown" };
}

function breakAbilityMatchesIce(
  ability: RuntimeIcebreakerAbility,
  iceSubtypes: readonly string[],
  iceDefinitionId: string,
): boolean {
  if (
    ability.iceDefinitionIds?.length &&
    !ability.iceDefinitionIds.includes(iceDefinitionId)
  )
    return false;
  if (ability.selectedIceSubtypeFromBreaker || ability.subroutineBreakTags) {
    return false;
  }
  if (ability.iceSubtype) {
    return iceSubtypes.some(
      (subtype) =>
        normalizeSubtype(subtype) === normalizeSubtype(ability.iceSubtype!),
    );
  }
  if (ability.iceSubtypes) {
    return ability.iceSubtypes.some((candidate) =>
      iceSubtypes.some(
        (subtype) => normalizeSubtype(subtype) === normalizeSubtype(candidate),
      ),
    );
  }
  return true;
}

function quoteBreakAbility(params: {
  ability: RuntimeIcebreakerAbility;
  abilities: readonly RuntimeIcebreakerAbility[];
  breaker: VisibleCard;
  ice: VisibleCard;
  endTheRunCount: number;
  additionalBreakCost: number;
  runnerCredits: number;
  runnerAvailableCredits: number;
}): BreakRead {
  const {
    ability,
    abilities,
    breaker,
    ice,
    endTheRunCount,
    additionalBreakCost,
    runnerCredits,
    runnerAvailableCredits,
  } = params;
  const breakCount = ability.count;
  if (
    ability.onUseEndRun ||
    ability.postBreakStealthLoss !== undefined ||
    ability.specialEffects?.some(
      (effect) =>
        effect.kind !== "run_end_trash_source_if_used" &&
        effect.kind !== "post_encounter_self_trash_check",
    ) ||
    !validCreditCost(ability.cost.credits) ||
    !nonNegativeSafeInteger(breakCount) ||
    breakCount <= 0 ||
    !breaker.definitionId
  ) {
    return { kind: "unknown" };
  }
  const requiredStrength = ice.strength!;
  const currentStrength = breaker.strength!;
  const pumps =
    requiredStrength > currentStrength
      ? quoteRequiredPumps(abilities, requiredStrength, currentStrength)
      : { kind: "exact" as const, cost: 0 };
  if (pumps.kind === "unknown") return pumps;
  const breakUses = Math.ceil(endTheRunCount / breakCount);
  const breakCredits =
    breakUses * ability.cost.credits + endTheRunCount * additionalBreakCost;
  const requiredCredits = pumps.cost + breakCredits;
  if (!Number.isSafeInteger(requiredCredits) || requiredCredits < 0) {
    return { kind: "unknown" };
  }
  if (
    !nonNegativeSafeInteger(runnerCredits) ||
    !nonNegativeSafeInteger(runnerAvailableCredits) ||
    runnerAvailableCredits < runnerCredits
  ) {
    return { kind: "unknown" };
  }
  const nonNormalRunCreditsAvailable = runnerAvailableCredits - runnerCredits;
  const nonNormalRunCreditsApplied = Math.min(
    requiredCredits,
    nonNormalRunCreditsAvailable,
  );
  const normalCreditsRequired = requiredCredits - nonNormalRunCreditsApplied;
  return {
    kind: "exact",
    quote: {
      breakerCardId: breaker.instanceId,
      breakerDefinitionId: breaker.definitionId,
      requiredCredits,
      pumpCredits: pumps.cost,
      breakCredits,
      breakUses,
      normalCreditsRequired,
      nonNormalRunCreditsApplied,
      canPayFromCurrentCredits: runnerAvailableCredits >= requiredCredits,
      paymentEvidenceSource: "engine_icebreaker_ability",
      consumedCards: ability.specialEffects?.some(
        (effect) => effect.kind === "run_end_trash_source_if_used",
      )
        ? [
            {
              cardId: breaker.instanceId,
              definitionId: breaker.definitionId,
              kind: "trash_at_run_end_after_break",
              evidenceSource: "engine_icebreaker_ability",
            },
          ]
        : [],
      ...(ability.specialEffects?.some(
        (effect) => effect.kind === "post_encounter_self_trash_check",
      )
        ? {
            randomConsequences: ability.specialEffects
              .filter(
                (effect) => effect.kind === "post_encounter_self_trash_check",
              )
              .map((effect) => ({
                cardId: breaker.instanceId,
                definitionId: breaker.definitionId!,
                kind: effect.kind,
                numerator: effect.trashDieResults.length,
                denominator: effect.dieSides,
                evidenceSource: "engine_icebreaker_ability" as const,
              })),
          }
        : {}),
    },
  };
}

function quoteRequiredPumps(
  abilities: readonly RuntimeIcebreakerAbility[],
  requiredStrength: number,
  currentStrength: number,
): { kind: "exact"; cost: number } | { kind: "unknown" } {
  const pumps = abilities.filter((ability) => ability.type === "pump_strength");
  if (pumps.length === 0) return { kind: "unknown" };
  const costs = pumps.flatMap((ability) => {
    const amount = ability.amount;
    if (
      ability.variableStrength ||
      ability.onUseEndRun ||
      !validCreditCost(ability.cost.credits) ||
      !nonNegativeSafeInteger(amount) ||
      amount <= 0
    ) {
      return [];
    }
    const uses = Math.ceil((requiredStrength - currentStrength) / amount);
    const cost = uses * ability.cost.credits;
    return Number.isSafeInteger(cost) && cost >= 0 ? [cost] : [];
  });
  if (costs.length === 0) return { kind: "unknown" };
  return { kind: "exact", cost: Math.min(...costs) };
}

function validCreditCost(value: unknown): value is number {
  return nonNegativeSafeInteger(value);
}

function nonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function compareRunnerBreakQuotes(
  left: CompleteRunnerBreak,
  right: CompleteRunnerBreak,
): number {
  return (
    Number(right.canPayFromCurrentCredits) -
      Number(left.canPayFromCurrentCredits) ||
    left.requiredCredits - right.requiredCredits ||
    left.normalCreditsRequired - right.normalCreditsRequired ||
    left.consumedCards.length - right.consumedCards.length ||
    left.breakerCardId.localeCompare(right.breakerCardId)
  );
}

function normalizeSubtype(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}
