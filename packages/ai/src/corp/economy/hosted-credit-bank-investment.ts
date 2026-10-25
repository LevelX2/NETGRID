import { corpHostedBankLoadMatches } from "./hosted-credit-bank-facts";
import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { currentCorpCreditObligation } from "../../plans/corp-credit-obligation";
import {
  assessCreditBankInvestment,
  bankAlternativeIncomePerAction,
  clickCreditBankProfile,
} from "../../plans/credit-bank-investment";
import { corpFundedCentralProtectionReserve } from "../defense/corp-server-protection-reserve";
import { corpRemoteContestabilityAssessment } from "../../plans/tactical-plan-corp-score-window";
import { corpVisibleLiquidityDemandTarget } from "./economy-domain-signals";
import type {
  CorpEconomyDevelopmentSignal,
  CorpEconomyNeedSignal,
  CorpHostedBankInvestment,
} from "./economy-types";

export function corpHostedBankInvestments(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  requiredNeeds: readonly CorpEconomyNeedSignal[],
) {
  const choices = new Map<
    string,
    {
      shouldCashout: boolean;
      development?: CorpEconomyDevelopmentSignal;
    }
  >();
  if (
    input.side !== "corp" ||
    input.playerView.timingPoint !== "corp_action.main" ||
    input.playerView.run ||
    input.playerView.own.clicks <= 0
  )
    return choices;
  const banks = input.playerView.servers.flatMap((server) =>
    server.root.flatMap((card) => {
      if (
        !card.known ||
        !card.rezzed ||
        !card.definitionId ||
        card.owner !== "corp" ||
        card.controller !== "corp"
      )
        return [];
      const profile = clickCreditBankProfile(card.definitionId);
      const hint = AI_HINTS_BY_CARD.get(card.definitionId);
      return profile?.side === "corp" &&
        hint?.quality?.hintReviewed === true &&
        hint.quality.strategyCovered === true &&
        hint.quality.needsHumanReview !== true &&
        hint.planRoles?.includes("remote_asset_economy")
        ? [{ server, card, profile }]
        : [];
    }),
  );
  if (banks.length === 0) return choices;
  const liquid = input.playerView.own.credits;
  const reserve = Math.max(
    corpFundedCentralProtectionReserve(input),
    currentCorpCreditObligation(input) ?? 0,
  );
  // Exact current costs and complete Engine post-install rez quotes only.
  // Unknown future prices are not replaced with printed card prices.
  const futureSpend = corpVisibleLiquidityDemandTarget(input);
  const targetCredits = Math.max(
    reserve + futureSpend,
    ...requiredNeeds.flatMap((need) =>
      need.kind === "parent_funding" || need.kind === "reserve"
        ? [liquid + need.gap]
        : [],
    ),
  );
  const immediateFunding = requiredNeeds.some(
    (need) =>
      (need.kind === "parent_funding" &&
        need.gap > 0 &&
        (need.immediateDefenseConversion === true ||
          (need.scoreFundingMilestone?.deadline !== "multi_turn" &&
            (need.delegatedPriorityClass === "P1" ||
              need.delegatedPriorityClass === "P2" ||
              need.delegatedPriorityClass === "P3" ||
              need.delegatedPriorityClass === "P4" ||
              need.parentPriorityClass === "P1" ||
              need.parentPriorityClass === "P2" ||
              need.parentPriorityClass === "P3" ||
              need.parentPriorityClass === "P4")))) ||
      (need.kind === "reserve" && need.gap > 0),
  );
  const totalStored = banks.reduce(
    (sum, bank) => sum + (bank.card.counters?.bit ?? 0),
    0,
  );
  for (const { server, card, profile } of banks) {
    const stored = card.counters?.bit ?? 0;
    const contestability =
      server.ice.length > 0
        ? corpRemoteContestabilityAssessment(input, server.id)
        : undefined;
    const canCarry =
      contestability?.contestable === false &&
      input.playerView.own.stackOrRdCount > 1;
    const investment = assessCreditBankInvestment({
      liquidCredits: liquid,
      storedCredits: stored,
      otherStoredCredits: totalStored - stored,
      desiredLiquidity: targetCredits,
      ...profile,
      alternativeCreditsPerAction: bankAlternativeIncomePerAction(candidates),
    });
    const shouldCashout =
      stored > 0 &&
      (immediateFunding ||
        liquid < reserve ||
        input.playerView.own.stackOrRdCount <= 1 ||
        (liquid < targetCredits &&
          (stored >= targetCredits - liquid ||
            (!canCarry && input.playerView.own.clicks === 1))));
    const choice: {
      shouldCashout: boolean;
      development?: CorpEconomyDevelopmentSignal;
    } = { shouldCashout };
    choices.set(card.instanceId, choice);
    if (
      shouldCashout ||
      immediateFunding ||
      liquid < reserve ||
      input.playerView.own.stackOrRdCount <= 1 ||
      investment.additionalLoadExecutions <= 0 ||
      investment.incrementalCreditsOverAlternative <= 0 ||
      (input.playerView.own.clicks === 1 && !canCarry)
    )
      continue;
    const load = candidates.find(
      (c) =>
        c.sourceCardInstanceId === card.instanceId &&
        c.abilityId === profile.loadAbilityId,
    );
    if (!load) continue;
    const binding: CorpHostedBankInvestment = {
      actionId: load.actionId,
      stateVersion: input.playerView.stateVersion,
      sourceInstanceId: card.instanceId,
      sourceDefinitionId: card.definitionId!,
      storedCredits: stored,
      creditsPerLoad: profile.creditsPerLoad,
      targetCredits,
      protectedLiquidReserve: reserve,
      additionalLoadExecutions: investment.additionalLoadExecutions,
      canCarryAcrossTurn: canCarry,
    };
    if (!corpHostedBankLoadMatches(input, load, binding)) continue;
    choice.development = {
      kind: "develop_campaign",
      needId: `economy-hosted-bank-investment:${card.instanceId}`,
      sourceInstanceId: card.instanceId,
      sourceDefinitionId: card.definitionId!,
      phase: "load",
      actionIds: [load.actionId],
      hostedCreditBankInvestment: binding,
      cadence: {
        kind: "hosted_credit_bank_investment",
        maximumSetupExecutions: 1,
      },
      payback: {
        projectedCredits: investment.projectedPayout,
        setupCreditCost: 0,
        projectedNetCredits: investment.incrementalCreditsOverAlternative,
        horizonTurns: canCarry ? 1 : 0,
      },
      completion: {
        kind: "source_phase_reached",
        expectedState: "hosted_credits_added",
      },
      urgentForScore: false,
      evidenceCode:
        "corp_demand_bound_hosted_bank_investment_revalidate_after_load",
    };
  }
  return choices;
}
