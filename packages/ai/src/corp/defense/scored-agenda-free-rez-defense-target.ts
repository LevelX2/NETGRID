import { visibleBreakerEncounterQuote } from "@netgrid/engine";
import {
  type AiDecisionInput,
  type ServerId,
  type VisibleCard,
} from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { isFiniteNonNegativeInteger } from "../../runtime/exact-action-cost-facts";
import { assessCorpScoreProtection } from "../../runtime/corp-score-protection-assessment";
import { allocateCorpCentralDefenseFromAiFacts } from "./corp-central-defense-facts-adapter";

/** Defense owns the server allocation for a source-bound scored free-rez
 * effect. Score keeps the action and passes the exact target to its existing
 * continuation. Current agenda exposure precedes credits saved by the effect. */
export function corpScoredAgendaFreeRezDefenseTarget(
  input: AiDecisionInput,
  sourceAgendaId: string,
):
  | Readonly<{
      card: VisibleCard;
      selectedVariantId: string;
      rezCredits: number;
    }>
  | undefined {
  const targets = input.playerView.servers
    .flatMap((server) =>
      server.ice.map((card) => ({ card, serverId: server.id })),
    )
    .filter(
      ({ card, serverId }) =>
        card.known === true &&
        card.type === "ice" &&
        card.rezzed === false &&
        typeof card.definitionId === "string" &&
        card.definitionId.length > 0 &&
        card.effectiveRezCostQuote?.context === "installed" &&
        card.effectiveRezCostQuote.cardId === card.instanceId &&
        card.effectiveRezCostQuote.targetServerId === serverId &&
        card.effectiveRezCostQuote.projectedServerId === serverId &&
        card.effectiveRezCostQuote.expiresAtStateVersion ===
          input.playerView.stateVersion &&
        card.effectiveRezCostQuote.complete === true &&
        isFiniteNonNegativeInteger(card.effectiveRezCostQuote.finalCredits),
    )
    .map(({ card, serverId }) => {
      const quote = card.effectiveRezCostQuote;
      if (quote?.complete !== true) return undefined;
      const selectedVariantId = corpScoredAgendaFreeRezVariantId(input, card);
      return selectedVariantId
        ? { card, selectedVariantId, rezCredits: quote.finalCredits, serverId }
        : undefined;
    })
    .filter(
      (
        target,
      ): target is Readonly<{
        card: VisibleCard;
        selectedVariantId: string;
        rezCredits: number;
        serverId: Exclude<ServerId, "new_remote">;
      }> => target !== undefined,
    );
  // Equal-server candidates share one allocation need. Comparing only their
  // savings does not require an invented HQ/R&D exposure projection.
  const serverIds = [...new Set(targets.map((target) => target.serverId))];
  const needs =
    serverIds.length > 1
      ? currentFreeRezServerNeeds(input, sourceAgendaId, serverIds)
      : undefined;
  return targets.sort(
    (left, right) =>
      (needs
        ? compareDefenseNeed(
            needs.get(right.serverId)!,
            needs.get(left.serverId)!,
          )
        : 0) ||
      right.rezCredits - left.rezCredits ||
      left.card.instanceId.localeCompare(right.card.instanceId),
  )[0];
}

function corpScoredAgendaFreeRezVariantId(
  input: AiDecisionInput,
  ice: VisibleCard,
): string | undefined {
  const quote = ice.effectiveRezCostQuote;
  if (quote?.complete !== true) return undefined;
  if (quote.costKind === "fixed") return "fixed";
  const parameter = quote.variableParameter;
  if (parameter.kind === "alternate_subtype") {
    const baseBreakable = corpScoredAgendaIceSubtypeIsBreakable(
      input,
      ice,
      parameter.baseSubtypes,
    );
    const alternateBreakable = corpScoredAgendaIceSubtypeIsBreakable(
      input,
      ice,
      parameter.alternateSubtypes,
    );
    const alternateAdditionalCost =
      parameter.alternateSubtypesFinalCredits -
      parameter.baseSubtypesFinalCredits;
    return baseBreakable &&
      !alternateBreakable &&
      isFiniteNonNegativeInteger(alternateAdditionalCost) &&
      alternateAdditionalCost <= input.playerView.own.credits
      ? "alternate_subtype:alternate"
      : "alternate_subtype:base";
  }
  if (parameter.kind === "paid_end_the_run_subroutines") {
    const minimumAdditionalCost =
      parameter.minSubroutinesFinalCredits - quote.finalCredits;
    const firstEndTheRunAdditionalCost =
      parameter.firstEndTheRunFinalCredits - quote.finalCredits;
    if (
      !isFiniteNonNegativeInteger(minimumAdditionalCost) ||
      minimumAdditionalCost > input.playerView.own.credits
    ) {
      return undefined;
    }
    const selectedSubroutineCount =
      isFiniteNonNegativeInteger(firstEndTheRunAdditionalCost) &&
      firstEndTheRunAdditionalCost <= input.playerView.own.credits
        ? parameter.firstEndTheRunSubroutineCount
        : parameter.minSubroutines;
    return isFiniteNonNegativeInteger(selectedSubroutineCount)
      ? `paid_end_the_run_subroutines:${selectedSubroutineCount}`
      : undefined;
  }
  if (
    !isFiniteNonNegativeInteger(parameter.additionalCreditsPerValue) ||
    parameter.additionalCreditsPerValue <= 0 ||
    !isFiniteNonNegativeInteger(parameter.minValue) ||
    !isFiniteNonNegativeInteger(parameter.maxValue) ||
    parameter.minValue > parameter.maxValue
  ) {
    return undefined;
  }
  const affordableValue = Math.floor(
    input.playerView.own.credits / parameter.additionalCreditsPerValue,
  );
  if (affordableValue < parameter.minValue) return undefined;
  return `x_strength:${Math.max(
    parameter.minValue,
    Math.min(parameter.maxValue, affordableValue),
  )}`;
}

function corpScoredAgendaIceSubtypeIsBreakable(
  input: AiDecisionInput,
  ice: VisibleCard,
  subtypes: readonly string[],
): boolean {
  if (!ice.definitionId) return false;
  const definition = CARD_DEFINITIONS_BY_ID[ice.definitionId];
  const subroutines = (definition?.subroutines ?? []).map((subroutine) => ({
    id: subroutine.id,
    type: subroutine.type,
    ...(subroutine.breakTags
      ? { breakTags: subroutine.breakTags.slice() }
      : {}),
  }));
  return (input.playerView.opponent.rig ?? []).some((breaker) => {
    if (!breaker.definitionId || breaker.known === false) return false;
    const quote = visibleBreakerEncounterQuote({
      breakerDefinitionId: breaker.definitionId,
      breakerInstanceId: breaker.instanceId,
      breakerStrength: breaker.strength ?? 0,
      ...(breaker.selectedTargetCardId
        ? { selectedTargetCardId: breaker.selectedTargetCardId }
        : {}),
      ...(breaker.selectedSubtype
        ? { selectedSubtype: breaker.selectedSubtype }
        : {}),
      ...(breaker.randomRunStrengthState
        ? { randomRunStrengthState: breaker.randomRunStrengthState }
        : {}),
      iceDefinitionId: ice.definitionId!,
      iceInstanceId: ice.instanceId,
      iceSubtypes: subtypes,
      subroutines,
    });
    return quote?.coverageStatus === "full";
  });
}

type DefenseNeed = Readonly<{ numerator: number; denominator: number }>;

function compareDefenseNeed(left: DefenseNeed, right: DefenseNeed): number {
  const delta =
    BigInt(left.numerator) * BigInt(right.denominator) -
    BigInt(right.numerator) * BigInt(left.denominator);
  return delta < 0n ? -1 : delta > 0n ? 1 : 0;
}

function currentFreeRezServerNeeds(
  input: AiDecisionInput,
  sourceAgendaId: string,
  serverIds: readonly string[],
): ReadonlyMap<string, DefenseNeed> {
  const needs = new Map<string, DefenseNeed>();
  const hasCentral = serverIds.some((id) => id === "hq" || id === "rd");
  const central = hasCentral
    ? allocateCorpCentralDefenseFromAiFacts({ input })
    : undefined;
  if (central && central.status !== "known") {
    missingDefenseNeed(
      input,
      "current central access, inventory or visible run-path facts",
    );
  }
  for (const id of serverIds) {
    if ((id === "hq" || id === "rd") && central?.status === "known") {
      needs.set(id, central.evidence[id].expectedAgendaLoss);
      continue;
    }
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === id,
    );
    if (!server) missingDefenseNeed(input, "current target server identity");
    const cards =
      id === "archives" ? input.playerView.own.heapOrArchives : server.root;
    let agendaPoints = 0;
    for (const card of cards) {
      if (card.instanceId === sourceAgendaId || card.type !== "agenda")
        continue;
      const points = card.agendaPoints;
      if (
        !card.known ||
        !Number.isSafeInteger(points) ||
        (points ?? -1) < 0 ||
        !Number.isSafeInteger(agendaPoints + points!)
      ) {
        missingDefenseNeed(input, "exact remaining own agenda-point exposure");
      }
      agendaPoints += points!;
    }
    if (agendaPoints === 0) {
      needs.set(id, { numerator: 0, denominator: 1 });
      continue;
    }
    if (!input.playerView.opponent.rig)
      missingDefenseNeed(input, "the current public Runner rig");
    const assessment = assessCorpScoreProtection({
      serverIce: server.ice,
      serverRoot:
        id === "archives"
          ? []
          : server.root.filter((card) => card.instanceId !== sourceAgendaId),
      runnerRig: input.playerView.opponent.rig!,
      runnerCredits: input.playerView.opponent.credits,
      ...(input.playerView.opponent.memoryUsed !== undefined
        ? { runnerMemoryUsed: input.playerView.opponent.memoryUsed }
        : {}),
      ...(input.playerView.opponent.memoryLimit !== undefined
        ? { runnerMemoryLimit: input.playerView.opponent.memoryLimit }
        : {}),
      maximumRunnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
    });
    if (assessment.knowledge !== "known") {
      missingDefenseNeed(
        input,
        "current visible remote access assessment: " + assessment.unknownReason,
      );
    }
    const probability = assessment.runnerAccessSuccessProbability;
    const numerator = agendaPoints * probability.numerator;
    if (!Number.isSafeInteger(numerator))
      missingDefenseNeed(input, "safely representable expected agenda loss");
    needs.set(id, { numerator, denominator: probability.denominator });
  }
  return needs;
}

function missingDefenseNeed(input: AiDecisionInput, cause: string): never {
  throw new PlanResolutionFailure("missing_plan_module_coverage", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((action) => action.type),
    owner: "plan_module",
    removalCondition:
      "The Defense-owned scored free-rez allocation requires " + cause + ".",
  });
}
