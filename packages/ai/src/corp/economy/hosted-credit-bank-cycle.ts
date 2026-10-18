import type {
  AiDecisionInput,
  CorpHostedCreditBankCycleQuote,
} from "@netgrid/shared";
import { parseCanonicalCapabilityId } from "@netgrid/cards/planning";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import type {
  CorpEconomyDevelopmentSignal,
  CorpEconomyParentFundingSignal,
} from "./economy-types";

export function currentCorpHostedBankCycleQuotes(
  input: AiDecisionInput,
): CorpHostedCreditBankCycleQuote[] {
  return input.legalActions.flatMap((action) => {
    const encoded = action.payload?.hostedCreditBankCycleQuoteJson;
    if (encoded === undefined) return [];
    const fail = (): never => {
      throw new PlanResolutionFailure("missing_plan_module_coverage", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((a) => a.type),
        unresolvedActionIds: [action.actionId],
        owner: "plan_module",
        removalCondition:
          "Provide a complete current Engine bank-cycle quote bound to the owning Corp source, exact head and remaining normal action capacity.",
      });
    };
    if (typeof encoded !== "string") return fail();
    let q: CorpHostedCreditBankCycleQuote;
    try {
      q = JSON.parse(encoded);
    } catch {
      return fail();
    }
    const server = input.playerView.servers.find(
      (s) => s.id === q?.sourceServerId,
    );
    const card = server?.root.find(
      (c) => c.instanceId === q?.sourceCardInstanceId,
    );
    const numbers = q && [
      q.stateVersion,
      q.currentCredits,
      q.currentClicks,
      q.currentHostedCredits,
      q.setupCreditCost,
      q.loadCredits,
      q.loadExecutions,
      q.totalClickCost,
      q.cashoutCredits,
      q.netLiquidCreditGain,
      q.baselineLiquidCreditGain,
      q.extraLiquidCredits,
    ];
    if (
      !q ||
      q.schemaVersion !== "corp-hosted-credit-bank-cycle-quote-v1" ||
      input.side !== "corp" ||
      action.side !== "corp" ||
      action.timingPoint !== "corp_action.main" ||
      input.playerView.timingPoint !== "corp_action.main" ||
      input.playerView.run ||
      !numbers?.every((n) => Number.isSafeInteger(n) && n >= 0) ||
      q.actionId !== action.actionId ||
      q.sourceCardInstanceId !== action.source ||
      q.stateVersion !== input.playerView.stateVersion ||
      action.expiresAtStateVersion !== q.stateVersion ||
      q.currentCredits !== input.playerView.own.credits ||
      q.currentClicks !== input.playerView.own.clicks ||
      q.currentClicks < 2 ||
      q.currentClicks > 3 ||
      q.totalClickCost !== q.currentClicks ||
      q.loadExecutions !== q.currentClicks - 1 ||
      q.loadCredits <= 1 ||
      q.cashoutCredits !==
        q.currentHostedCredits + q.loadExecutions * q.loadCredits ||
      q.netLiquidCreditGain !== q.cashoutCredits - q.setupCreditCost ||
      q.baselineLiquidCreditGain !==
        (q.currentHostedCredits > 0
          ? q.currentHostedCredits + q.currentClicks - 1
          : q.currentClicks) ||
      q.extraLiquidCredits !==
        q.netLiquidCreditGain - q.baselineLiquidCreditGain ||
      q.extraLiquidCredits <= 0 ||
      !card ||
      card.owner !== "corp" ||
      card.controller !== "corp" ||
      card.definitionId !== q.sourceDefinitionId ||
      !server?.id.startsWith("remote_") ||
      q.currentHostedCredits !== (card.counters?.bit ?? 0) ||
      typeof q.loadAbilityId !== "string" ||
      typeof q.cashoutAbilityId !== "string" ||
      q.loadAbilityId === q.cashoutAbilityId ||
      (q.headKind === "rez"
        ? card.rezzed ||
          action.type !== "rez_card" ||
          action.payload?.rootRez !== true
        : q.headKind !== "load" ||
          !card.rezzed ||
          action.type !== "activated_card_ability" ||
          action.abilityRef?.sourceAbilityId !== q.loadAbilityId ||
          action.abilityRef.sourceCardInstanceId !== q.sourceCardInstanceId)
    )
      return fail();
    try {
      if (
        parseCanonicalCapabilityId(q.loadAbilityId).cardDefinitionId !==
          q.sourceDefinitionId ||
        parseCanonicalCapabilityId(q.cashoutAbilityId).cardDefinitionId !==
          q.sourceDefinitionId
      )
        return fail();
    } catch {
      return fail();
    }
    if (
      action.costs.some((cost) =>
        Object.entries(cost).some(
          ([key, value]) =>
            (key !== "credits" && key !== "clicks") ||
            !Number.isSafeInteger(value) ||
            Number(value) < 0,
        ),
      ) ||
      q.setupCreditCost !==
        action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0) ||
      action.costs.reduce((sum, cost) => sum + (cost.clicks ?? 0), 0) !==
        (q.headKind === "rez" ? 0 : 1) ||
      q.currentCredits < q.setupCreditCost ||
      (q.headKind === "load" && q.setupCreditCost !== 0)
    )
      return fail();
    return [q];
  });
}

/** A multi-turn Score or exact current installed-ICE reserve funding child
 * can improve its rest-turn credit route.
 * An earlier available conversion or another income source retains its route.
 */
export function corpHostedBankCycleForParentFunding(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  signal: CorpEconomyParentFundingSignal,
): CorpHostedCreditBankCycleQuote | undefined {
  const scoreFunding =
    signal.parentPlanInstanceId?.startsWith("plan:corp.score_agenda:") ===
      true &&
    signal.scoreFundingMilestone?.deadline === "multi_turn" &&
    signal.gap >= input.playerView.own.clicks;
  const installedDefenseFunding =
    signal.parentPlanInstanceId ===
      "plan:corp.defend_servers:server-defense-portfolio" &&
    signal.incrementalDefenseReserve !== undefined &&
    signal.incrementalDefenseReserve.targetCredits ===
      input.playerView.own.credits + signal.gap &&
    input.playerView.servers
      .find(
        (server) => server.id === signal.incrementalDefenseReserve!.serverId,
      )
      ?.ice.some(
        (ice) =>
          ice.instanceId === signal.incrementalDefenseReserve!.iceInstanceId &&
          !ice.rezzed &&
          ice.effectiveRezCostQuote?.context === "installed" &&
          ice.effectiveRezCostQuote.complete === true &&
          ice.effectiveRezCostQuote.expiresAtStateVersion ===
            input.playerView.stateVersion,
      ) === true;
  if (
    (!scoreFunding && !installedDefenseFunding) ||
    signal.restrictedCreditFunding ||
    signal.restrictedCreditPreparations?.length
  )
    return undefined;
  return currentCorpHostedBankCycleQuotes(input)
    .filter(
      (q) =>
        candidates.some((c) => c.actionId === q.actionId) &&
        candidates
          .filter(
            (c) =>
              c.economyProjection?.kind === "immediate_liquid" &&
              (c.economyProjection.netLiquidCreditGain ?? 0) > 0,
          )
          .every(
            (c) =>
              c.actionType === "gain_credit" ||
              (c.sourceCardInstanceId === q.sourceCardInstanceId &&
                c.abilityId === q.cashoutAbilityId),
          ) &&
        (installedDefenseFunding
          ? q.currentCredits + q.netLiquidCreditGain >=
              signal.incrementalDefenseReserve!.targetCredits &&
            !input.legalActions.some((a) => a.type === "score_agenda")
          : q.currentHostedCredits < signal.gap &&
            q.totalClickCost <= signal.gap),
    )
    .sort(
      (a, b) =>
        b.netLiquidCreditGain - a.netLiquidCreditGain ||
        a.actionId.localeCompare(b.actionId),
    )[0];
}

export function corpHostedBankCycleDevelopment(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpEconomyDevelopmentSignal[] {
  return currentCorpHostedBankCycleQuotes(input).flatMap((q) => {
    const hint = AI_HINTS_BY_CARD.get(q.sourceDefinitionId);
    if (
      hint?.quality?.hintReviewed !== true ||
      hint.quality.strategyCovered !== true ||
      hint.quality.needsHumanReview === true ||
      !hint.planRoles?.includes("remote_asset_economy") ||
      !candidates.some((c) => c.actionId === q.actionId)
    )
      return [];
    return [
      {
        kind: "develop_campaign",
        needId: `economy-hosted-bank-cycle:${q.sourceCardInstanceId}:${q.headKind}`,
        sourceInstanceId: q.sourceCardInstanceId,
        sourceDefinitionId: q.sourceDefinitionId,
        phase: q.headKind,
        actionIds: [q.actionId],
        hostedCreditBankCycle: q,
        cadence: {
          kind: "hosted_credit_bank_cycle",
          maximumSetupExecutions: 1,
        },
        payback: {
          projectedCredits: q.cashoutCredits,
          setupCreditCost: q.setupCreditCost,
          projectedNetCredits: q.netLiquidCreditGain - q.totalClickCost,
          horizonTurns: 0,
          projectedOpportunityCostCredits: q.totalClickCost,
        },
        completion: {
          kind: "source_phase_reached",
          expectedState:
            q.headKind === "rez" ? "installed_rezzed" : "hosted_credits_added",
        },
        urgentForScore: false,
        evidenceCode: "corp_engine_quoted_same_turn_hosted_bank_cycle",
      },
    ];
  });
}
