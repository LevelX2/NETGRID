import type { AiDecisionInput } from "@netgrid/shared";
import type { CorpEconomyNeedSignal } from "./economy-types";
import { currentCorpHostedBankCycleQuotes } from "./hosted-credit-bank-cycle";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  turnPlanningFingerprint,
  type CampaignMilestoneQuote,
  type CampaignValueClaim,
  type PlanningStateIdentity,
} from "../../plans/turn-planning-contracts";

/** A quoted cycle includes its future payout and action costs. Its pool cannot
 * also fund an independently valued withdrawal. Only the current native head
 * is executable; changed counters require a new Engine quote. */
export function corpHostedBankTurnPlanningQuote(params: {
  input: AiDecisionInput;
  stateIdentity: PlanningStateIdentity;
  signal: CorpEconomyNeedSignal;
  actionId: string;
  planInstanceId: string;
}):
  | {
      campaignQuote: CampaignMilestoneQuote;
      valueClaims: CampaignValueClaim[];
      evidenceCodes: string[];
    }
  | undefined {
  const { signal, input } = params;
  const cycle =
    signal.kind === "develop_campaign" || signal.kind === "parent_funding"
      ? signal.hostedCreditBankCycle
      : undefined;
  const payout =
    signal.kind === "convert_visible_card_payout" &&
    signal.conversion.hostedCreditTakeMode === "all"
      ? signal
      : undefined;
  if (!cycle && !payout) return undefined;
  const source = cycle?.sourceCardInstanceId ?? payout!.sourceInstanceId;
  const fail = (): never => {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [params.actionId],
      owner: "plan_module",
      removalCondition:
        "Bind the admitted bank milestone to the exact current Engine quote, source, native head, payout and planning state identity.",
    });
  };
  const quote = currentCorpHostedBankCycleQuotes(input).find(
    (q) => q.sourceCardInstanceId === source,
  );
  // A single final payout has no competing complete cycle in this window.
  if (!quote) return cycle ? fail() : undefined;
  if (
    params.stateIdentity.stateVersion !== input.playerView.stateVersion ||
    !signal.actionIds.includes(params.actionId)
  )
    return fail();
  const action = input.legalActions.find((a) => a.actionId === params.actionId);
  if (
    !action ||
    action.source !== source ||
    action.expiresAtStateVersion !== params.stateIdentity.stateVersion
  )
    return fail();
  if (
    cycle &&
    (JSON.stringify(cycle) !== JSON.stringify(quote) ||
      quote.actionId !== action.actionId)
  )
    return fail();
  if (
    payout &&
    (action.abilityRef?.sourceAbilityId !== quote.cashoutAbilityId ||
      payout.conversion.netLiquidCreditGain !== quote.currentHostedCredits ||
      payout.conversion.clickCost !== 1 ||
      payout.conversion.creditCost !== 0)
  )
    return fail();
  const campaignId = params.planInstanceId;
  const quoteId = turnPlanningFingerprint("corp-bank-milestone", {
    quote,
    actionId: action.actionId,
    campaignId,
  });
  const value = cycle
    ? cycle.netLiquidCreditGain - cycle.totalClickCost
    : payout!.conversion.netLiquidCreditGain - payout!.conversion.clickCost;
  const nextMilestoneId = cycle
    ? "quoted_bank_cycle_paid"
    : "current_bank_pool_paid";
  const conflictKey = `corp-bank-pool:${source}:${input.playerView.stateVersion}`;
  return {
    campaignQuote: {
      quoteId,
      campaignId,
      quoteVersion: "corp-hosted-bank-turn-quote-v1",
      basis: {
        kind: "actual_state",
        stateVersion: params.stateIdentity.stateVersion,
        sideSafePlanningFingerprint:
          params.stateIdentity.sideSafePlanningFingerprint,
      },
      currentMilestoneId: "current_bank_pool",
      nextMilestoneId,
      commitment: "soft",
      remainingValue: value,
      expiresAt: "current_turn_end",
      revalidationCodes: [
        "bank_counter_changed",
        "current_native_head_only",
        "higher_priority_obligation",
      ],
    },
    valueClaims: [
      {
        claimId: turnPlanningFingerprint("corp-bank-pool-claim", { quoteId }),
        campaignId,
        ownerModuleId: "corp.economy",
        objectiveKey: conflictKey,
        componentKey: "bank_pool_conversion",
        evaluationDimensionId: "economy",
        aggregationMode: "exclusive",
        contributionKind: "objective_payoff",
        beforeQuoteId: turnPlanningFingerprint("corp-bank-pool-before", {
          source,
          stateVersion: input.playerView.stateVersion,
          stored: quote.currentHostedCredits,
        }),
        afterQuoteId: quoteId,
        amount: value,
        dependencyKeys: [],
        conflictKeys: [conflictKey],
        status: "quoted",
      },
    ],
    evidenceCodes: [
      "corp_engine_quoted_bank_milestone",
      "corp_bank_pool_exclusive_conversion",
      "corp_bank_counter_change_requires_current_quote",
      `corp_bank_quoted_liquid_gain:${cycle?.netLiquidCreditGain ?? payout!.conversion.netLiquidCreditGain}`,
      `corp_bank_quoted_total_clicks:${cycle?.totalClickCost ?? payout!.conversion.clickCost}`,
    ],
  };
}
