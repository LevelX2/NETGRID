import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { type AiDecisionInput } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  corpExactBasicLiquidCreditCandidate,
  type CorpEconomyLiquidityDevelopmentSignal,
} from "./corp-core-plan-modules";
import type { ResidentPlanPortfolio } from "./resident-plan-portfolio";

export function corpExactCurrentBasicLiquidCreditCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (!corpExactBasicLiquidCreditCandidate(candidate)) return false;
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  if (
    action?.side !== "corp" ||
    action.type !== "gain_credit" ||
    action.source !== "basic_action" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.targetRequirements.length > 0 ||
    (action.choiceRequirements?.length ?? 0) > 0
  ) {
    return false;
  }
  const totalClicks = action.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  const totalCredits = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  return totalClicks === 1 && totalCredits === 0;
}

export function corpTurnLiquidityDevelopmentNeed(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
  currentTurnKey: string,
): CorpEconomyLiquidityDevelopmentSignal | undefined {
  const exactCandidates = candidates.filter((candidate) =>
    corpExactCurrentBasicLiquidCreditCandidate(input, candidate),
  );
  const remainingClicks = input.playerView.own.clicks;
  if (remainingClicks <= 0 || exactCandidates.length !== 1) return undefined;

  const resident = corpResidentTurnLiquidityDevelopment(
    previous,
    currentTurnKey,
  );
  const residentSaturation = corpResidentVisibleLiquiditySaturation(
    previous,
    input,
  );
  const currentCredits = input.playerView.own.credits;
  const visibleDemandTarget = corpVisibleLiquidityDemandTarget(input);
  const targetCredits = Math.max(
    currentCredits,
    visibleDemandTarget,
    resident?.targetCredits ?? 0,
    !residentSaturation ? currentCredits + remainingClicks : currentCredits,
  );
  if (!Number.isSafeInteger(targetCredits) || targetCredits <= currentCredits) {
    return undefined;
  }
  return {
    kind: "develop_liquidity",
    needId: `economy-visible-liquidity-development:${currentTurnKey}`,
    turnKey: currentTurnKey,
    targetCredits,
    currentCreditsAtRevalidation: currentCredits,
    gap: targetCredits - currentCredits,
    projectedCreditGain: 1,
    actionIds: [exactCandidates[0]!.actionId],
    priorityClass: "P6",
    cadence: {
      kind: "remaining_turn_capacity",
      maximumConversions: resident?.maximumConversions ?? remainingClicks,
    },
    completion: {
      kind: "target_credits_or_no_clicks",
    },
    revalidation: {
      stateVersion: input.playerView.stateVersion,
      status: "turn_liquidity_open",
    },
    urgentForScore: false,
    evidenceCode: "corp_engine_certified_basic_liquidity_development",
  };
}

/**
 * Keeps generic liquidity tied to visible, currently useful spending routes.
 * A genuinely expensive score-and-defense route may raise the target. If no
 * stronger route exists, the once-per-turn liquidity root binds all remaining
 * normal clicks so turn completion cannot silently discard useful capacity.
 */
export function corpVisibleLiquidityDemandTarget(
  input: AiDecisionInput,
): number {
  const exactCurrentActionCosts = input.legalActions.flatMap((action) => {
    const credits = action.costs.reduce(
      (sum, cost) => sum + (cost.credits ?? 0),
      0,
    );
    return Number.isSafeInteger(credits) && credits >= 0 ? [credits] : [];
  });
  const postInstallRezCosts = input.legalActions.flatMap((action) => {
    const quoted =
      action.payload?.postInstallRezQuoteComplete === true
        ? action.payload.postInstallRezQuoteFinalCredits
        : undefined;
    return typeof quoted === "number" &&
      Number.isSafeInteger(quoted) &&
      quoted >= 0
      ? [quoted]
      : [];
  });
  const postInstallRouteCosts = input.legalActions.flatMap((action) => {
    const quoted =
      action.payload?.postInstallRezQuoteComplete === true
        ? action.payload.postInstallRezQuoteFinalCredits
        : undefined;
    const installCredits = action.costs.reduce(
      (sum, cost) => sum + (cost.credits ?? 0),
      0,
    );
    return typeof quoted === "number" &&
      Number.isSafeInteger(quoted) &&
      quoted >= 0 &&
      Number.isSafeInteger(installCredits) &&
      installCredits >= 0 &&
      Number.isSafeInteger(installCredits + quoted)
      ? [installCredits + quoted]
      : [];
  });
  const installedRezCosts = input.playerView.servers.flatMap((server) =>
    [...server.ice, ...server.root].flatMap((card) => {
      if (!card.known || card.rezzed === true || !card.definitionId) return [];
      const rezCost = CARD_DEFINITIONS_BY_ID[card.definitionId]?.rezCost;
      return typeof rezCost === "number" &&
        Number.isSafeInteger(rezCost) &&
        rezCost >= 0
        ? [rezCost]
        : [];
    }),
  );
  const visibleAgendaAdvanceCosts = [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.servers.flatMap((server) => server.root),
  ].flatMap((card) => {
    if (!card.known || card.type !== "agenda" || !card.definitionId) {
      return [];
    }
    const advancementRequirement =
      CARD_DEFINITIONS_BY_ID[card.definitionId]?.advancementRequirement;
    if (
      typeof advancementRequirement !== "number" ||
      !Number.isSafeInteger(advancementRequirement) ||
      advancementRequirement < 0
    ) {
      return [];
    }
    const currentCounters =
      typeof card.advancementCounters === "number" &&
      Number.isSafeInteger(card.advancementCounters) &&
      card.advancementCounters >= 0
        ? card.advancementCounters
        : 0;
    return [Math.max(0, advancementRequirement - currentCounters)];
  });
  const defenseReserve = Math.max(
    0,
    ...postInstallRezCosts,
    ...installedRezCosts,
  );
  const maximumVisibleScoreCost =
    visibleAgendaAdvanceCosts.length > 0
      ? Math.max(...visibleAgendaAdvanceCosts)
      : 0;
  const exactVisibleDemand = Math.max(
    0,
    ...exactCurrentActionCosts,
    ...postInstallRouteCosts,
    defenseReserve,
    maximumVisibleScoreCost + defenseReserve,
  );
  return exactVisibleDemand > 0 ? exactVisibleDemand + 1 : 0;
}

function corpResidentTurnLiquidityDevelopment(
  previous: ResidentPlanPortfolio | undefined,
  currentTurnKey: string,
):
  | {
      targetCredits: number;
      maximumConversions: number;
      revalidatedAtStateVersion: number;
    }
  | undefined {
  const instance = previous?.instances.find(
    (candidate) =>
      candidate.moduleId === "corp.economy" &&
      candidate.dedupeKey ===
        `economy-visible-liquidity-development:${currentTurnKey}`,
  );
  const moduleState = instance?.moduleState as
    | {
        kind?: unknown;
        signal?: Partial<CorpEconomyLiquidityDevelopmentSignal>;
      }
    | undefined;
  const signal = moduleState?.signal;
  if (
    moduleState?.kind !== "economy" ||
    signal?.kind !== "develop_liquidity" ||
    signal.turnKey !== currentTurnKey ||
    signal.needId !==
      `economy-visible-liquidity-development:${currentTurnKey}` ||
    signal.priorityClass !== "P6" ||
    signal.projectedCreditGain !== 1 ||
    signal.cadence?.kind !== "remaining_turn_capacity" ||
    !Number.isSafeInteger(signal.targetCredits) ||
    (signal.targetCredits ?? -1) < 0 ||
    !Number.isSafeInteger(signal.cadence.maximumConversions) ||
    (signal.cadence.maximumConversions ?? 0) <= 0 ||
    !Number.isSafeInteger(signal.revalidation?.stateVersion) ||
    (signal.revalidation?.stateVersion ?? -1) < 0
  ) {
    return undefined;
  }
  return {
    targetCredits: signal.targetCredits!,
    maximumConversions: signal.cadence.maximumConversions!,
    revalidatedAtStateVersion: signal.revalidation!.stateVersion!,
  };
}

function corpResidentVisibleLiquiditySaturation(
  previous: ResidentPlanPortfolio | undefined,
  input: AiDecisionInput,
): boolean {
  return (
    previous?.stateVersion === input.playerView.stateVersion &&
    previous.turnPlanCommitment?.turnKey ===
      `corp:turn:${input.playerView.turnSerial ?? "unknown"}` &&
    previous.instances.some(
      (instance) =>
        instance.moduleId === "corp.complete_turn" &&
        instance.evidenceRefs.some(
          (reference) =>
            reference.code ===
            "corp_basic_credit_rejected_visible_liquidity_demand_satisfied",
        ),
    )
  );
}
