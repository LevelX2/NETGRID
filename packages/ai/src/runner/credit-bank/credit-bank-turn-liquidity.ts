import { planningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { PlanInstance } from "../../plans/plan-kernel-types";
import {
  RUNNER_TURN_LIQUIDITY_WITHIN_CLASS_VALUE,
  validRunnerFundingNeedContract,
  type RunnerFundingNeedSignal,
} from "../../plans/runner-funding-contracts";
import type { EconomyState } from "../economy/economy-types";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { RunnerCreditBankSignal } from "./credit-bank-types";

/** A prefilled, otherwise inert source may fund the existing P6 need.
 * Reloadable banks and mixed installed functions retain their own horizon. */
export function finiteBankTurnLiquiditySupport(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  needs: readonly RunnerFundingNeedSignal[];
  definitionId: string;
  bankId: string;
  cashOutActionIds: readonly string[];
  estimatedPayout: number;
}):
  | {
      actionId: string;
      funding: NonNullable<RunnerCreditBankSignal["liquidityFunding"]>;
    }
  | undefined {
  const { input, candidates } = params;
  if (
    input.side !== "runner" ||
    input.playerView.timingPoint !== "runner_action.main" ||
    input.playerView.own.clicks < 1
  )
    return undefined;
  const card = planningCardByDefinitionId(params.definitionId);
  const abilities = card?.engine.abilities;
  const ability = abilities?.[0];
  const take = ability?.effects.find((e) => e.kind === "take_hosted_credits");
  if (
    card?.side !== "runner" ||
    abilities?.length !== 1 ||
    ability?.kind !== "activated" ||
    ability.timing !== "runner_main" ||
    ability.condition?.kind !== "source_has_hosted_credits" ||
    ability.costs?.length !== 1 ||
    ability.costs[0]?.kind !== "action" ||
    ability.costs[0].amount !== 1 ||
    take?.kind !== "take_hosted_credits" ||
    take.source !== "source" ||
    take.recipient !== "controller" ||
    ability.effects.some(
      (e) =>
        e.kind !== "take_hosted_credits" &&
        e.kind !== "trash_source_when_empty",
    ) ||
    Object.keys(card.engine.lifecycle ?? {}).some((k) => k !== "on_install") ||
    !card.engine.lifecycle?.on_install?.length ||
    card.engine.lifecycle.on_install.some(
      (e) => e.kind !== "add_hosted_credits" || e.target !== "source",
    )
  )
    return undefined;
  const need = params.needs.find(
    (n): n is Extract<RunnerFundingNeedSignal, { kind: "develop_liquidity" }> =>
      n.kind === "develop_liquidity" &&
      validRunnerFundingNeedContract(n, input.playerView.stateVersion) &&
      n.currentCreditsAtRevalidation === input.playerView.own.credits,
  );
  if (!need) return undefined;
  const ordinary = candidates.filter((c) =>
    need.actionIds.includes(c.actionId),
  );
  // The parent admits only certified immediate income. Missing projection is
  // not a zero-yield alternative and must never make a bank look stronger.
  const ordinaryGains = ordinary
    .map((c) => c.economyProjection?.netLiquidCreditGain)
    .filter(
      (gain): gain is number =>
        typeof gain === "number" && Number.isFinite(gain),
    );
  if (
    ordinary.length !== need.actionIds.length ||
    ordinaryGains.length !== ordinary.length
  )
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      owner: "plan_module",
      removalCondition:
        "Revalidate every current liquidity need action against its certified income candidate before comparing finite bank payout.",
    });
  const strongestOrdinaryGain = Math.max(...ordinaryGains);
  const payout = candidates.find((c) => {
    const p = c.economyProjection;
    return (
      params.cashOutActionIds.includes(c.actionId) &&
      c.sourceCardInstanceId === params.bankId &&
      c.planOwnerBinding?.owner === "runner.credit_bank" &&
      c.planOwnerBinding.route === "cash_out" &&
      c.costProfile.clickCost === 1 &&
      c.costProfile.creditCost === 0 &&
      c.costProfile.additionalCosts.length === 0 &&
      p?.kind === "immediate_liquid" &&
      p.timing === "immediate" &&
      p.creditRestriction === "general" &&
      p.reliability === "guaranteed" &&
      p.sourcePool === "finite" &&
      p.cardsDrawn === 0 &&
      p.netHandDelta === 0 &&
      p.netLiquidCreditGain === params.estimatedPayout &&
      params.estimatedPayout > strongestOrdinaryGain &&
      input.legalActions.some(
        (a) =>
          a.actionId === c.actionId &&
          a.source === params.bankId &&
          a.expiresAtStateVersion === input.playerView.stateVersion,
      )
    );
  });
  return payout
    ? {
        actionId: payout.actionId,
        funding: {
          parentPlanInstanceId: `plan:runner.economy:${encodeURIComponent(need.needId)}`,
          needId: need.needId,
          stateVersion: input.playerView.stateVersion,
          need,
        },
      }
    : undefined;
}

/** Revalidate the real resident liquidity parent, never create an income goal. */
export function runnerCreditBankLiquidityParentValue(
  parent: PlanInstance,
  funding: NonNullable<RunnerCreditBankSignal["liquidityFunding"]>,
  stateVersion: number,
): number | undefined {
  const state = parent.moduleState as EconomyState;
  if (
    parent.instanceId !== funding.parentPlanInstanceId ||
    parent.moduleId !== "runner.economy" ||
    (parent.viability !== "ready" && parent.viability !== "blocked") ||
    parent.blockers.length > 0 ||
    funding.stateVersion !== stateVersion ||
    state.kind !== "economy" ||
    state.need.kind !== "develop_liquidity" ||
    !validRunnerFundingNeedContract(state.need, stateVersion) ||
    !validRunnerFundingNeedContract(funding.need, stateVersion) ||
    state.need.needId !== funding.needId ||
    state.need.gap !== funding.need.gap ||
    state.need.actionIds.length !== funding.need.actionIds.length ||
    !state.need.actionIds.every((id) => funding.need.actionIds.includes(id)) ||
    state.need.targetCredits !== funding.need.targetCredits ||
    state.need.currentCreditsAtRevalidation !==
      funding.need.currentCreditsAtRevalidation
  )
    return undefined;
  return RUNNER_TURN_LIQUIDITY_WITHIN_CLASS_VALUE;
}
