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
  options: Readonly<{ admitResidualCapacity?: boolean }> = {},
): CorpEconomyLiquidityDevelopmentSignal | undefined {
  const exactCandidates = candidates.filter((candidate) =>
    corpExactCurrentBasicLiquidCreditCandidate(input, candidate),
  );
  const remainingClicks = input.playerView.own.clicks;
  if (remainingClicks <= 0 || exactCandidates.length !== 1) return undefined;
  const currentCredits = input.playerView.own.credits;
  const visibleDemandTarget = corpVisibleLiquidityDemandTarget(input);
  if (visibleDemandTarget <= currentCredits) {
    return options.admitResidualCapacity
      ? corpResidualCapacityUse(
          input,
          exactCandidates[0]!,
          previous,
          currentTurnKey,
        )
      : undefined;
  }
  const resident = corpResidentLiquidityDevelopment(
    previous,
    visibleDemandTarget,
  );
  const targetCredits = Math.max(
    visibleDemandTarget,
    resident?.targetCredits ?? 0,
  );
  if (!Number.isSafeInteger(targetCredits)) {
    return undefined;
  }
  return {
    kind: "develop_liquidity",
    needId: `economy-visible-liquidity-development:${targetCredits}`,
    turnKey: currentTurnKey,
    targetCredits,
    currentCreditsAtRevalidation: currentCredits,
    gap: targetCredits - currentCredits,
    projectedCreditGain: 1,
    actionIds: [exactCandidates[0]!.actionId],
    priorityClass: "P6",
    cadence: {
      kind: "remaining_turn_capacity",
      maximumConversions: remainingClicks,
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

function corpResidualCapacityUse(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  previous: ResidentPlanPortfolio | undefined,
  currentTurnKey: string,
): CorpEconomyLiquidityDevelopmentSignal | undefined {
  const needId = `economy-residual-capacity:${currentTurnKey}`;
  const previousSignal = previous?.instances
    .filter(
      (instance) =>
        instance.moduleId === "corp.economy" && instance.dedupeKey === needId,
    )
    .map(
      (instance) =>
        instance.moduleState as {
          kind?: unknown;
          signal?: Partial<CorpEconomyLiquidityDevelopmentSignal>;
        },
    )
    .find(
      (state) =>
        state.kind === "economy" &&
        state.signal?.kind === "develop_liquidity" &&
        state.signal.residualCapacityOnly === true,
    )?.signal;
  const currentCredits = input.playerView.own.credits;
  const previousTarget =
    previousSignal && Number.isSafeInteger(previousSignal.targetCredits)
      ? previousSignal.targetCredits
      : undefined;
  if (previousTarget !== undefined && previousTarget <= currentCredits) {
    return undefined;
  }
  const targetCredits =
    previousTarget ?? currentCredits + input.playerView.own.clicks;
  return {
    kind: "develop_liquidity",
    needId,
    turnKey: currentTurnKey,
    targetCredits,
    currentCreditsAtRevalidation: currentCredits,
    gap: targetCredits - currentCredits,
    projectedCreditGain: 1,
    actionIds: [candidate.actionId],
    priorityClass: "P6",
    cadence: {
      kind: "remaining_turn_capacity",
      maximumConversions: input.playerView.own.clicks,
    },
    completion: { kind: "target_credits_or_no_clicks" },
    revalidation: {
      stateVersion: input.playerView.stateVersion,
      status: "turn_liquidity_open",
    },
    residualCapacityOnly: true,
    urgentForScore: false,
    evidenceCode: "corp_non_strategic_residual_capacity_use",
  };
}

/**
 * Keeps generic liquidity tied to an exact visible current spending route.
 * Parent-owned score, remote and defense demands are published separately and
 * must not be reconstructed here. The target is an absolute credit threshold,
 * never a function of current Credits or remaining clicks.
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
  const defenseReserve = Math.max(0, ...postInstallRezCosts);
  const exactVisibleDemand = Math.max(
    0,
    ...exactCurrentActionCosts,
    ...postInstallRouteCosts,
    defenseReserve,
  );
  return exactVisibleDemand;
}

function corpResidentLiquidityDevelopment(
  previous: ResidentPlanPortfolio | undefined,
  targetCredits: number,
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
        `economy-visible-liquidity-development:${targetCredits}`,
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
    signal.needId !==
      `economy-visible-liquidity-development:${targetCredits}` ||
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
