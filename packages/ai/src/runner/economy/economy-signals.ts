import { uniqueBy } from "../../runtime/collection";
import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { RunnerHandDevelopmentEvaluation } from "../hand-development/hand-development-evaluation";
import type { RunnerEconomyPosture } from "../../runner-run-target-evaluation";
import { runnerInstalledDebtFinancingLiability } from "../../runtime/runner-canonical-card-facts";
import { runnerTurnLiquidityCandidateIsMaterializable } from "../../plans/runner-funding-candidates";
import { type CreateSideCreditDemandParams } from "../../plans/credit-demand";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { runnerStrategicExchangeRequiresBoundParent } from "../../runtime/runner-strategic-exchange";
import { runnerGenericDevelopmentMayOwnAction } from "../../runtime/runner-targeted-bypass-plan";
import type {
  RunnerFundingNeedSignal,
  RunnerFundingRouteContract,
} from "../../plans/runner-funding-contracts";
export type RunnerEconomyFundingSearch = (
  request: Pick<
    CreateSideCreditDemandParams,
    | "demandId"
    | "sourcePlanId"
    | "purpose"
    | "priority"
    | "hardness"
    | "deadline"
    | "targetCredits"
    | "evidence"
  > & { remainingClicks: number; allowIncrementalProgress: boolean },
) => RunnerFundingRouteContract;
export function runnerEconomyReserveFacts(
  input: AiDecisionInput,
  economy: RunnerEconomyPosture,
) {
  const debtLiability = runnerInstalledDebtFinancingLiability(
    (input.playerView.own.rig ?? []).map((card) => card.definitionId),
  );
  const portfolioReserveTargetCredits =
    economy.desiredCreditReserve + debtLiability.nextTurnCreditLoss;
  return { debtLiability, portfolioReserveTargetCredits };
}
export function buildRunnerEconomySignals(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  economy: RunnerEconomyPosture;
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[];
  previous: ResidentPlanPortfolio | undefined;
  currentTurnKey: string;
  reserve: ReturnType<typeof runnerEconomyReserveFacts>;
  findFundingRoute: RunnerEconomyFundingSearch;
}) {
  const {
    input,
    candidates,
    economy,
    handDevelopment,
    previous,
    currentTurnKey,
    findFundingRoute,
  } = params;
  const { debtLiability, portfolioReserveTargetCredits } = params.reserve;
  const currentCredits = input.playerView.own.credits,
    remainingClicks = input.playerView.own.clicks;
  const handDevelopmentOwnedImmediateEconomyActionIds = new Set(
    handDevelopment.flatMap((evaluation) =>
      evaluation.legalActionId !== undefined &&
      candidates.some(
        (candidate) =>
          candidate.actionId === evaluation.legalActionId &&
          runnerGenericDevelopmentMayOwnAction(candidate),
      ) &&
      evaluation.availability === "legal_now" &&
      evaluation.deferReason === "none" &&
      evaluation.liquidityTiming === "immediate" &&
      (evaluation.currentNeed === "acute" ||
        evaluation.currentNeed === "useful_now" ||
        evaluation.currentNeed === "setup")
        ? [evaluation.legalActionId]
        : [],
    ),
  );
  const turnLiquidityActionIds = uniqueBy(
    candidates
      .filter(
        (candidate) =>
          !handDevelopmentOwnedImmediateEconomyActionIds.has(
            candidate.actionId,
          ) &&
          runnerTurnLiquidityCandidateIsMaterializable(candidate) &&
          !runnerStrategicExchangeRequiresBoundParent(candidate),
      )
      .map((candidate) => candidate.actionId),
    (actionId) => actionId,
  );
  const forgoTerminalDeckPressureCapacity =
    input.playerView.own.clicks > 0 &&
    input.playerView.own.agendaPoints >=
      input.playerView.agendaPointsToWin - 1 &&
    input.playerView.opponent.deckCount > 0 &&
    input.playerView.opponent.deckCount <= input.playerView.own.stackOrRdCount;
  const reserveDevelopmentOpen =
    currentCredits < Math.max(10, economy.desiredCreditReserve + 3);
  const boundedTurnLiquidityActionIds = forgoTerminalDeckPressureCapacity
    ? []
    : reserveDevelopmentOpen
      ? turnLiquidityActionIds
      : turnLiquidityActionIds.filter((actionId) => {
          const candidate = candidates.find(
            (entry) => entry.actionId === actionId,
          );
          // The remaining-click contract may use any exact cost-free liquid
          // route without spending a hand card or another resource. Requiring
          // the basic-action identity would discard stronger installed tools.
          return (
            candidate?.economyProjection?.cardsConsumed === 0 &&
            candidate.economyProjection.netHandDelta === 0
          );
        });
  const residentTurnLiquidityTarget = runnerResidentTurnLiquidityTarget(
    previous,
    currentTurnKey,
    currentCredits,
  );
  const turnLiquidityTargetCredits =
    residentTurnLiquidityTarget ??
    (boundedTurnLiquidityActionIds.length > 0
      ? currentCredits + remainingClicks
      : currentCredits);
  const turnLiquidityGap = Math.max(
    0,
    turnLiquidityTargetCredits - currentCredits,
  );
  const turnLiquidityFundingNeeds: RunnerFundingNeedSignal[] =
    remainingClicks > 0 &&
    boundedTurnLiquidityActionIds.length > 0 &&
    turnLiquidityGap > 0
      ? [
          {
            kind: "develop_liquidity",
            needId: `economy-liquidity-development:${currentTurnKey}`,
            actionIds: boundedTurnLiquidityActionIds,
            currentCreditsAtRevalidation: currentCredits,
            targetCredits: turnLiquidityTargetCredits,
            gap: turnLiquidityGap,
            priorityClass: "P6",
            cadence: {
              kind: "remaining_turn_capacity",
              maximumConversions: turnLiquidityGap,
            },
            completion: {
              kind: "target_credits_or_no_clicks",
            },
            revalidation: {
              stateVersion: input.playerView.stateVersion,
              status: "turn_liquidity_open",
            },
            evidenceCode: reserveDevelopmentOpen
              ? "runner_engine_certified_immediate_liquidity_development"
              : "runner_engine_certified_remaining_capacity_liquidity",
          },
        ]
      : [];
  const portfolioReserveRoute = findFundingRoute({
    demandId: "runner-portfolio-credit-reserve",
    sourcePlanId: "runner.economy:runner-portfolio-credit-reserve",
    purpose: "phase_reserve",
    priority: "phase_reserve",
    hardness: "soft",
    deadline: "end_of_current_turn",
    targetCredits: portfolioReserveTargetCredits,
    remainingClicks: input.playerView.own.clicks,
    allowIncrementalProgress: true,
    evidence: [
      "runner_finite_portfolio_credit_reserve",
      `runner_debt_next_turn_credit_loss:${debtLiability.nextTurnCreditLoss}`,
      `runner_debt_total_leave_play_cost:${debtLiability.totalLeavePlayPayCost}`,
    ],
  });
  const portfolioReserveFundingNeeds: RunnerFundingNeedSignal[] =
    input.playerView.own.clicks > 0 &&
    currentCredits < portfolioReserveTargetCredits
      ? [
          {
            kind: "portfolio_reserve",
            needId: "runner-portfolio-credit-reserve",
            targetCredits: portfolioReserveTargetCredits,
            currentCreditsAtRevalidation: currentCredits,
            gap: portfolioReserveTargetCredits - currentCredits,
            priorityClass: "P6",
            revalidation: {
              stateVersion: input.playerView.stateVersion,
              status: "portfolio_reserve_open",
            },
            ...portfolioReserveRoute,
            evidenceCode: "runner_finite_portfolio_credit_reserve",
          },
        ]
      : [];
  return {
    turnLiquidityFundingNeeds,
    portfolioReserveFundingNeeds,
    forgoTerminalDeckPressureCapacity,
  };
}
function runnerResidentTurnLiquidityTarget(
  previous: ResidentPlanPortfolio | undefined,
  currentTurnKey: string,
  currentCredits: number,
): number | undefined {
  const needId = `economy-liquidity-development:${currentTurnKey}`;
  const instance = previous?.instances.find(
    (candidate) =>
      candidate.moduleId === "runner.economy" && candidate.dedupeKey === needId,
  );
  const moduleState = instance?.moduleState as
    | {
        kind?: unknown;
        need?: Partial<
          Extract<RunnerFundingNeedSignal, { kind: "develop_liquidity" }>
        >;
      }
    | undefined;
  const need = moduleState?.need;
  if (
    moduleState?.kind !== "economy" ||
    need?.kind !== "develop_liquidity" ||
    need.needId !== needId ||
    need.priorityClass !== "P6" ||
    need.cadence?.kind !== "remaining_turn_capacity" ||
    need.completion?.kind !== "target_credits_or_no_clicks" ||
    !Number.isSafeInteger(need.targetCredits) ||
    (need.targetCredits ?? -1) < 0
  ) {
    return undefined;
  }
  const targetCredits = need.targetCredits;
  return targetCredits !== undefined && targetCredits > currentCredits
    ? targetCredits
    : undefined;
}
