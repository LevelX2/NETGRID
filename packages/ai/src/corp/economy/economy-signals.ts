import { assessCorpSpendAgainstScoreFundingMilestones } from "../score/corp-score-funding";
import { corpFundedCentralProtectionReserve } from "../defense/corp-server-protection-reserve";
import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { rootRezCreditOutcomeProjectionStatus } from "../../actions/action-economy-projection";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { type CorpCorePlanDomain } from "../../plans/corp-core-plan-contracts";

import { type CorpDefenseSignal } from "../../plans/corp-defense-contracts";
import { corpVisibleLiquidityDemandTarget } from "./economy-domain-signals";
import { type CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { corpScorePriorityClass } from "../score/corp-score-priority";
import { type CorpPlanDomain } from "../../plans/corp-tactical-plan-contracts";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { uniqueBy } from "../../runtime/collection";
import {
  corpHostedCreditBankProfile,
  corpImmediateEconomyGainFromHint,
} from "../../runtime/corp-canonical-card-facts";
import { corpDefenseReserveNeeds } from "../defense/corp-defense-funding-facts";
import { corpCandidatePreservesVoluntaryDrawHorizon } from "../../runtime/corp-draw-action-facts";
import { corpVoluntaryDrawLeavesUnsafeMandatoryHorizon } from "../../runtime/corp-draw-admission";
import { assessCorpEconomyAssetPayback } from "./economy-asset-payback";
import { corpReservedScoreServerIds } from "../../runtime/corp-scoreline/score-hand-support";
import { visibleKnownCardType } from "../../runtime/visible-action-facts";
import { type CorpPunishCampaignSignal } from "../punish/punish-types";
import { corpEconomyPriorityClass } from "./economy-plan-module";
import { corpExactBasicLiquidCreditCandidate } from "./economy-routes";
import {
  type CorpEconomyImmediateOperationSignal,
  type CorpEconomyOperationThresholdSignal,
  type CorpEconomyVisibleCardWithdrawalSignal,
} from "./economy-types";

export function corpOpenEconomyPlanOwnsAction(
  domain: CorpPlanDomain,
  actionId: string,
): boolean {
  return domain.economyNeeds.some(
    (signal) =>
      signal.actionIds.includes(actionId) &&
      (signal.kind === "develop_campaign" ||
        signal.kind === "convert_immediate_operation" ||
        signal.kind === "convert_visible_card_payout" ||
        signal.kind === "prepare_immediate_operation" ||
        signal.kind === "develop_liquidity" ||
        signal.kind === "resolve_start_rez_choice" ||
        signal.kind === "resolve_optional_action_capacity_offer" ||
        signal.gap > 0),
  );
}

export function corpCandidateIsImmediateRootRezEconomySource(
  candidate: ActionSemanticCandidate,
): boolean {
  if (
    candidate.semanticActionType !== "corp_window.rez" ||
    !candidate.sourceDefinitionId
  ) {
    return false;
  }
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  return (
    (hint?.cardType === "asset" || hint?.cardType === "upgrade") &&
    hint?.effects?.some(
      (effect) =>
        effect.kind === "economy" &&
        effect.scope === "corp" &&
        effect.timing === "on_rez",
    ) === true
  );
}

export function corpOptionalActionCapacityConversions(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpCorePlanDomain["economyNeeds"] {
  return candidates.flatMap((candidate) => {
    const projection = candidate.actionCapacityProjection;
    if (
      candidate.actorSide !== "corp" ||
      candidate.sourceKind !== "card" ||
      candidate.actionType !== "trigger_ability" ||
      candidate.semanticActionType !==
        "score_conversion.gain_action_capacity" ||
      typeof candidate.sourceCardInstanceId !== "string" ||
      typeof candidate.sourceDefinitionId !== "string" ||
      projection?.timing !== "immediate" ||
      projection.reliability !== "guaranteed" ||
      projection.followupActionCapacity !== 1 ||
      projection.preExistingActionCost !== 0 ||
      projection.restriction === "unknown" ||
      !candidate.actionId.endsWith(".accept_extra_action_offer")
    ) {
      return [];
    }
    const declineActionId = candidate.actionId.replace(
      /\.accept_extra_action_offer$/,
      ".decline_extra_action_offer",
    );
    const declineCandidate = candidates.find(
      (entry) =>
        entry.actionId === declineActionId &&
        entry.actorSide === "corp" &&
        entry.sourceCardInstanceId === candidate.sourceCardInstanceId &&
        entry.sourceDefinitionId === candidate.sourceDefinitionId &&
        entry.actionType === "trigger_ability" &&
        entry.actionCapacityProjection?.followupActionCapacity === 0,
    );
    if (!declineCandidate) return [];
    const drawCapacityProductive =
      projection.allowedActionTypes.includes("draw_card") &&
      input.playerView.own.gripOrHq.length < input.playerView.own.maxHandSize &&
      !corpVoluntaryDrawLeavesUnsafeMandatoryHorizon({
        remainingDeckCardsBeforeDraw: input.playerView.own.stackOrRdCount,
        netDeckConsumption: 1,
        terminalNeedBeforeMandatoryDraw: false,
      });
    const acceptOffer =
      projection.allowedActionTypes.includes("gain_credit") ||
      drawCapacityProductive;
    const selectedActionId = acceptOffer
      ? candidate.actionId
      : declineCandidate.actionId;
    const rejectedActionId = acceptOffer
      ? declineCandidate.actionId
      : candidate.actionId;
    return [
      {
        kind: "resolve_optional_action_capacity_offer" as const,
        needId: `optional-action-capacity:${candidate.sourceCardInstanceId}:${input.playerView.stateVersion}`,
        sourceInstanceId: candidate.sourceCardInstanceId,
        sourceDefinitionId: candidate.sourceDefinitionId,
        actionIds: [selectedActionId],
        decision: acceptOffer ? ("accept" as const) : ("decline" as const),
        rejectedActionId,
        restriction: projection.restriction,
        allowedActionTypes: [...projection.allowedActionTypes],
        followupActionCapacity: 1 as const,
        observedAtStateVersion: input.playerView.stateVersion,
        completion: { kind: "offer_consumed" as const },
        urgentForScore: false,
        evidenceCode: "corp_optional_action_capacity_offer_accepted",
      },
    ];
  });
}

export function corpEconomyDevelopmentCampaigns(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  scoreProjects: readonly CorpScoreProjectSignal[],
): CorpCorePlanDomain["economyNeeds"] {
  const signals: CorpCorePlanDomain["economyNeeds"] = [];
  const reservedScoreServerIds = corpReservedScoreServerIds(
    input,
    scoreProjects,
  );
  const addCampaign = (
    card: VisibleCard,
    phase: "install" | "rez",
    currentServerId?: string,
  ): void => {
    if (
      !card.known ||
      !card.definitionId ||
      visibleKnownCardType(input, card) !== "asset"
    ) {
      return;
    }
    const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
    const hint = AI_HINTS_BY_CARD.get(card.definitionId);
    const startRezChoice = input.playerView.pendingChoice;
    const startRezOption =
      phase === "rez" &&
      startRezChoice?.side === "corp" &&
      startRezChoice.kind === "select_option" &&
      startRezChoice.source.startsWith("corp_start.rez:") &&
      startRezChoice.stateVersion === input.playerView.stateVersion
        ? startRezChoice.options.find(
            (option) =>
              option.selectable !== false &&
              option.id === `rez_${card.instanceId}` &&
              option.value === card.instanceId &&
              option.card?.instanceId === card.instanceId &&
              option.card.definitionId === card.definitionId &&
              Number.isSafeInteger(option.metadata?.creditCost) &&
              (option.metadata?.creditCost ?? -1) >= 0,
          )
        : undefined;
    const startRezAction = startRezOption
      ? input.legalActions.find(
          (action) =>
            action.type === "resolve_choice" &&
            action.side === "corp" &&
            action.source === "game_rule" &&
            action.expiresAtStateVersion === input.playerView.stateVersion &&
            action.choiceRequirements?.length === 1 &&
            action.choiceRequirements[0]?.choiceId ===
              startRezChoice?.choiceId &&
            action.choiceRequirements[0]?.minSelections === 1 &&
            action.choiceRequirements[0]?.maxSelections === 1 &&
            action.choiceRequirements[0]?.optionIds.includes(startRezOption.id),
        )
      : undefined;
    const startRezChoiceBinding =
      startRezChoice && startRezOption && startRezAction
        ? {
            actionId: startRezAction.actionId,
            choiceId: startRezChoice.choiceId,
            selectedOptionId: startRezOption.id,
            observedAtStateVersion: input.playerView.stateVersion,
          }
        : undefined;
    if (
      phase === "rez" &&
      definition?.side === "corp" &&
      definition.type === "asset"
    ) {
      const candidate = candidates.find(
        (entry) =>
          entry.sourceCardInstanceId === card.instanceId &&
          entry.sourceDefinitionId === card.definitionId &&
          entry.semanticActionType === "corp_window.rez",
      );
      const action = candidate
        ? input.legalActions.find(
            (legalAction) => legalAction.actionId === candidate.actionId,
          )
        : undefined;
      const outcome =
        candidate && action
          ? rootRezCreditOutcomeProjectionStatus(candidate, action)
          : undefined;
      if (candidate && outcome?.status === "guaranteed_positive") {
        signals.push({
          kind: "develop_campaign",
          needId: `economy-campaign:${card.instanceId}`,
          sourceInstanceId: card.instanceId,
          sourceDefinitionId: card.definitionId,
          phase,
          actionIds: [candidate.actionId],
          cadence: {
            kind: "immediate_on_rez",
            maximumSetupExecutions: 1,
          },
          payback: {
            projectedCredits: outcome.grossCreditGain,
            setupCreditCost: outcome.rezCredits,
            projectedNetCredits: outcome.netCreditGain,
            horizonTurns: 0,
          },
          completion: {
            kind: "source_phase_reached",
            expectedState: "installed_rezzed",
          },
          urgentForScore: false,
          evidenceCode:
            "corp_engine_certified_immediate_root_rez_credit_conversion",
        });
        return;
      }
    }
    const counterCashout = corpCounterCashoutProfile(card.definitionId);
    if (phase === "rez" && counterCashout) {
      const currentAdvancementCounters = card.advancementCounters ?? 0;
      const rezCandidate = candidates.find(
        (candidate) =>
          candidate.sourceCardInstanceId === card.instanceId &&
          (candidate.sourceDefinitionId === undefined ||
            candidate.sourceDefinitionId === card.definitionId) &&
          candidate.semanticActionType === "corp_window.rez" &&
          candidate.costProfile.costKnownStatus === "known" &&
          Number.isSafeInteger(candidate.costProfile.creditCost) &&
          (candidate.costProfile.creditCost as number) >= 0 &&
          typeof candidate.costProfile.clickCost === "number" &&
          Number.isSafeInteger(candidate.costProfile.clickCost) &&
          candidate.costProfile.additionalCosts.length === 0,
      );
      const rezCreditCost = rezCandidate?.costProfile.creditCost;
      if (currentAdvancementCounters === 0) {
        const advanceCandidate = candidates.find(
          (candidate) =>
            candidate.sourceCardInstanceId === card.instanceId &&
            candidate.sourceDefinitionId === card.definitionId &&
            candidate.semanticActionType === "score.advance_card" &&
            candidate.costProfile.costKnownStatus === "known" &&
            Number.isSafeInteger(candidate.costProfile.creditCost) &&
            (candidate.costProfile.creditCost as number) >= 0 &&
            typeof candidate.costProfile.clickCost === "number" &&
            Number.isSafeInteger(candidate.costProfile.clickCost) &&
            candidate.costProfile.clickCost > 0 &&
            candidate.costProfile.additionalCosts.length === 0,
        );
        const advanceCreditCost = advanceCandidate?.costProfile.creditCost;
        const advanceClickCost = advanceCandidate?.costProfile.clickCost;
        const setupCreditCost =
          typeof advanceCreditCost === "number" &&
          typeof rezCreditCost === "number"
            ? advanceCreditCost + rezCreditCost
            : undefined;
        const projectedNetCredits =
          setupCreditCost === undefined
            ? undefined
            : counterCashout.creditsPerCounter - setupCreditCost;
        if (
          advanceCandidate &&
          typeof advanceClickCost === "number" &&
          setupCreditCost !== undefined &&
          projectedNetCredits !== undefined &&
          projectedNetCredits >= 2 &&
          input.playerView.own.credits >= setupCreditCost &&
          input.playerView.own.clicks >= advanceClickCost
        ) {
          signals.push({
            kind: "develop_campaign",
            needId: `economy-counter-cashout:${card.instanceId}:advance`,
            sourceInstanceId: card.instanceId,
            sourceDefinitionId: card.definitionId,
            phase: "advance",
            actionIds: [advanceCandidate.actionId],
            cadence: {
              kind: "counter_cashout_development",
              maximumSetupExecutions: 1,
            },
            payback: {
              projectedCredits: counterCashout.creditsPerCounter,
              setupCreditCost,
              projectedNetCredits,
              horizonTurns: 0,
            },
            completion: {
              kind: "source_phase_reached",
              expectedState: "advancement_counter_added",
            },
            counterCashout: {
              currentAdvancementCounters,
              targetAdvancementCounters: 1,
              creditsPerCounter: counterCashout.creditsPerCounter,
              projectedCashoutCredits: counterCashout.creditsPerCounter,
            },
            urgentForScore: false,
            evidenceCode: "corp_reviewed_counter_cashout_development:advance",
          });
          return;
        }
      } else if (rezCandidate && typeof rezCreditCost === "number") {
        const projectedCredits =
          currentAdvancementCounters * counterCashout.creditsPerCounter;
        const projectedNetCredits = projectedCredits - rezCreditCost;
        if (
          Number.isSafeInteger(projectedCredits) &&
          projectedNetCredits > 0 &&
          input.playerView.own.credits >= rezCreditCost
        ) {
          signals.push({
            kind: "develop_campaign",
            needId: `economy-counter-cashout:${card.instanceId}:rez`,
            sourceInstanceId: card.instanceId,
            sourceDefinitionId: card.definitionId,
            phase: "rez",
            actionIds: [rezCandidate.actionId],
            cadence: {
              kind: "counter_cashout_development",
              maximumSetupExecutions: 1,
            },
            payback: {
              projectedCredits,
              setupCreditCost: rezCreditCost,
              projectedNetCredits,
              horizonTurns: 0,
            },
            completion: {
              kind: "source_phase_reached",
              expectedState: "installed_rezzed",
            },
            counterCashout: {
              currentAdvancementCounters,
              targetAdvancementCounters: currentAdvancementCounters,
              creditsPerCounter: counterCashout.creditsPerCounter,
              projectedCashoutCredits: projectedCredits,
            },
            urgentForScore: false,
            evidenceCode: "corp_reviewed_counter_cashout_development:rez",
          });
          return;
        }
      }
    }
    if (
      definition?.side !== "corp" ||
      definition.type !== "asset" ||
      hint?.planRoles?.includes("remote_asset_economy") !== true ||
      hint.quality?.hintReviewed !== true ||
      hint.quality.strategyCovered !== true ||
      hint.quality.needsHumanReview === true
    ) {
      return;
    }
    const hostedCreditProfile = corpHostedCreditBankProfile(card.definitionId);
    const finitePoolCredits = hostedCreditProfile?.poolCredits ?? 0;
    const automaticStartOfTurnCredits = Math.max(
      0,
      hostedCreditProfile?.payoutTiming === "start_of_corp_turn"
        ? hostedCreditProfile.payoutCredits
        : 0,
      ...(hint.effects ?? [])
        .filter(
          (effect) =>
            (effect.kind === "start_of_turn_economy" ||
              effect.kind === "recurring_economy") &&
            effect.timing === "start_of_turn" &&
            typeof effect.amount === "number" &&
            effect.amount > 0,
        )
        .map((effect) => effect.amount!),
    );
    if (finitePoolCredits <= 0 && automaticStartOfTurnCredits <= 0) return;

    const cadence =
      hostedCreditProfile?.payoutTiming === "start_of_corp_turn"
        ? ("automatic_start_of_turn" as const)
        : finitePoolCredits > 0
          ? ("finite_pool" as const)
          : ("automatic_start_of_turn" as const);
    if (
      phase === "rez" &&
      cadence === "finite_pool" &&
      input.playerView.timingPoint !== "corp_action.main" &&
      !startRezChoiceBinding
    ) {
      return;
    }
    const baselineHorizonTurns = 3;
    const expectedSemanticActionType =
      phase === "install"
        ? "install.card"
        : startRezChoiceBinding
          ? "choice.resolve"
          : "corp_window.rez";
    const campaignCandidates = candidates.filter(
      (candidate) =>
        (startRezChoiceBinding
          ? candidate.actionId === startRezChoiceBinding.actionId
          : candidate.sourceCardInstanceId === card.instanceId &&
            candidate.sourceDefinitionId === card.definitionId) &&
        candidate.semanticActionType === expectedSemanticActionType &&
        candidate.costProfile.costKnownStatus === "known" &&
        Number.isSafeInteger(candidate.costProfile.creditCost) &&
        (candidate.costProfile.creditCost as number) >= 0 &&
        Number.isSafeInteger(candidate.costProfile.clickCost) &&
        candidate.costProfile.additionalCosts.length === 0,
    );
    const restrictedQuotes =
      phase === "rez" && currentServerId && !startRezChoiceBinding
        ? (input.corpRestrictedCreditRouteQuotes ?? []).filter(
            (quote) =>
              quote.consumer.actionType === "rez_card" &&
              !quote.consumer.availableBeforePayout &&
              quote.consumer.sourceCardInstanceId === card.instanceId &&
              quote.consumer.serverId === currentServerId &&
              quote.request.stateVersion === input.playerView.stateVersion,
          )
        : [];
    // A projected consumer is a descriptor, not a fabricated current LegalAction.
    const routes = [
      ...campaignCandidates.map((candidate) => ({
        candidate,
        quote: undefined,
      })),
      ...restrictedQuotes.map((quote) => ({ candidate: undefined, quote })),
    ];
    for (const { candidate, quote } of routes) {
      const targetServerId =
        currentServerId ??
        (candidate
          ? corpEconomyCampaignTargetServerId(input, candidate)
          : undefined);
      if (!targetServerId) continue;
      if (phase === "install" && reservedScoreServerIds.has(targetServerId)) {
        continue;
      }
      const setupCreditCost =
        (startRezChoiceBinding
          ? (startRezOption!.metadata!.creditCost as number)
          : quote
            ? quote.consumer.creditCost + quote.payoutGeneralCreditCost
            : (candidate!.costProfile.creditCost as number)) +
        (phase === "install" ? (definition.rezCost ?? 0) : 0);
      // Installation alone is not a funded economy route. Future payouts cannot
      // pay the rez that makes them available.
      if (phase === "install" && input.playerView.own.credits < setupCreditCost)
        continue;
      // Delayed income cannot pay for protection needed before that payout.
      // Guaranteed immediate positive conversions are admitted above.
      const creditsAfterSetup = quote
        ? quote.consumer.generalCreditsRemainingAfterConsumer
        : Math.min(
            input.playerView.own.credits -
              (input.playerView.own.installRezOnlyCredits ?? 0),
            input.playerView.own.credits - setupCreditCost,
          );
      if (creditsAfterSetup < corpFundedCentralProtectionReserve(input))
        continue;
      const payback = assessCorpEconomyAssetPayback({
        input,
        serverId: targetServerId,
        cadence,
        baselineHorizonTurns,
        finitePoolCredits,
        payoutCreditsPerExecution:
          cadence === "finite_pool"
            ? (hostedCreditProfile?.payoutCredits ?? 0)
            : automaticStartOfTurnCredits,
        payoutActionCost:
          cadence === "finite_pool"
            ? (hostedCreditProfile?.payoutActionCost ?? 0)
            : 0,
        setupCreditCost,
        setupActionCost: quote
          ? quote.consumer.clickCost + quote.payoutClickCost
          : (candidate!.costProfile.clickCost as number),
      });
      if (!payback || payback.projectedNetCredits <= 0) continue;
      signals.push({
        kind: "develop_campaign",
        needId: `economy-campaign:${card.instanceId}:${phase}:${targetServerId}`,
        sourceInstanceId: card.instanceId,
        sourceDefinitionId: card.definitionId,
        phase,
        actionIds: candidate ? [candidate.actionId] : [],
        ...(quote
          ? {
              restrictedCreditNeed: {
                needId: `economy-rez-funding:${card.instanceId}:${targetServerId}`,
                gap: quote.consumer.creditCost - input.playerView.own.credits,
                quotes: [quote],
              },
            }
          : {}),
        ...(startRezChoiceBinding ? { startRezChoiceBinding } : {}),
        cadence: {
          kind: cadence,
          maximumSetupExecutions: 1,
        },
        payback: {
          projectedCredits: payback.projectedCredits,
          setupCreditCost: payback.setupCreditCost,
          projectedNetCredits: payback.projectedNetCredits,
          horizonTurns: payback.riskAdjustedHorizonTurns,
          unadjustedProjectedCredits: payback.unadjustedProjectedCredits,
          projectedOpportunityCostCredits:
            payback.projectedOpportunityCostCredits,
        },
        riskAdjustment: {
          serverId: payback.serverId,
          protectionState: payback.protectionState,
          baselineHorizonTurns: payback.baselineHorizonTurns,
          riskAdjustedHorizonTurns: payback.riskAdjustedHorizonTurns,
          projectedPayoutExecutions: payback.projectedPayoutExecutions,
          evidenceCodes: payback.evidenceCodes,
        },
        completion: {
          kind: "source_phase_reached",
          expectedState:
            phase === "install" ? "installed_unrezzed" : "installed_rezzed",
        },
        urgentForScore: false,
        evidenceCode: `corp_visible_economy_campaign:${phase}:${targetServerId}:${payback.protectionState}`,
      });
    }
  };

  for (const card of input.playerView.own.gripOrHq) {
    addCampaign(card, "install");
  }
  for (const server of input.playerView.servers) {
    if (!server.id.startsWith("remote_")) continue;
    for (const card of server.root) {
      if (card.rezzed !== true) addCampaign(card, "rez", server.id);
    }
  }
  const pendingStartRezChoice = input.playerView.pendingChoice;
  const admittedStartRezCampaign = signals.some(
    (signal) =>
      signal.kind === "develop_campaign" &&
      signal.startRezChoiceBinding !== undefined,
  );
  if (
    !admittedStartRezCampaign &&
    pendingStartRezChoice?.side === "corp" &&
    pendingStartRezChoice.kind === "select_option" &&
    pendingStartRezChoice.source.startsWith("corp_start.rez:") &&
    pendingStartRezChoice.stateVersion === input.playerView.stateVersion
  ) {
    const passOption = pendingStartRezChoice.options.find(
      (option) =>
        option.id === "pass" &&
        option.value === "pass" &&
        option.selectable !== false,
    );
    const resolveAction = input.legalActions.find((action) => {
      const [requirement] = action.choiceRequirements ?? [];
      return (
        action.type === "resolve_choice" &&
        action.side === "corp" &&
        action.source === "game_rule" &&
        action.expiresAtStateVersion === input.playerView.stateVersion &&
        action.choiceRequirements?.length === 1 &&
        requirement?.choiceId === pendingStartRezChoice.choiceId &&
        requirement.minSelections === 1 &&
        requirement.maxSelections === 1 &&
        requirement.optionIds.length === pendingStartRezChoice.options.length &&
        pendingStartRezChoice.options.every((option) =>
          requirement.optionIds.includes(option.id),
        )
      );
    });
    if (passOption && resolveAction) {
      signals.push({
        kind: "resolve_start_rez_choice",
        needId: `start-rez-choice:${pendingStartRezChoice.choiceId}`,
        actionIds: [resolveAction.actionId],
        choiceId: pendingStartRezChoice.choiceId,
        selectedOptionId: "pass",
        observedAtStateVersion: input.playerView.stateVersion,
        optionIds: pendingStartRezChoice.options.map((option) => option.id),
        urgentForScore: false,
        evidenceCode: "corp_start_rez_declined_without_admitted_campaign",
      });
    }
  }
  const admitted: CorpCorePlanDomain["economyNeeds"] = [];
  const groupedSignals = new Map<
    string,
    CorpCorePlanDomain["economyNeeds"][number]
  >();
  for (const signal of signals) {
    const existing = groupedSignals.get(signal.needId);
    if (
      existing?.kind === "develop_campaign" &&
      signal.kind === "develop_campaign" &&
      existing.restrictedCreditNeed &&
      signal.restrictedCreditNeed
    ) {
      existing.restrictedCreditNeed.quotes.push(
        ...signal.restrictedCreditNeed.quotes,
      );
    } else if (!existing) groupedSignals.set(signal.needId, signal);
  }
  for (const signal of groupedSignals.values()) {
    if (signal.kind !== "develop_campaign") {
      admitted.push(signal);
      continue;
    }
    const actionPriorityClass = corpEconomyPriorityClass(signal);
    if (signal.restrictedCreditNeed) {
      const quotes = signal.restrictedCreditNeed.quotes.filter(
        (quote) =>
          assessCorpSpendAgainstScoreFundingMilestones({
            currentCredits: input.playerView.own.credits,
            actionCreditCost:
              quote.consumer.generalCreditsRequired +
              quote.payoutGeneralCreditCost,
            actionPriorityClass,
            scoreProjects,
          }).preservesMilestone,
      );
      if (quotes.length > 0 && signal.restrictedCreditNeed.gap > 0) {
        const need = { ...signal.restrictedCreditNeed, quotes };
        admitted.push({ ...signal, restrictedCreditNeed: need });
        admitted.push({
          kind: "parent_funding",
          needId: need.needId,
          gap: need.gap,
          actionIds: quotes.map((quote) => quote.request.payoutActionId),
          parentPlanInstanceId: planInstanceIdForProposal({
            moduleId: "corp.economy",
            dedupeKey: signal.needId,
          }),
          parentNeedId: need.needId,
          parentPriorityClass: actionPriorityClass,
          restrictedCreditFunding: quotes,
          urgentForScore: false,
          evidenceCode: "corp_exact_restricted_credit_economy_rez_funding",
        });
      }
      continue;
    }
    const actionIds = signal.actionIds.filter((actionId) => {
      const candidate = candidates.find((entry) => entry.actionId === actionId);
      if (!candidate) return false;
      return assessCorpSpendAgainstScoreFundingMilestones({
        currentCredits: input.playerView.own.credits,
        actionCreditCost:
          signal.startRezChoiceBinding !== undefined
            ? signal.payback.setupCreditCost
            : candidate.costProfile.creditCost,
        actionPriorityClass,
        scoreProjects,
      }).preservesMilestone;
    });
    if (actionIds.length > 0) admitted.push({ ...signal, actionIds });
  }
  return admitted;
}

function corpEconomyCampaignTargetServerId(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): string | undefined {
  const action = input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  const payloadServerId = action?.payload?.serverId;
  if (typeof payloadServerId === "string" && payloadServerId.length > 0) {
    return payloadServerId;
  }
  return candidate.targetContext?.selectedTargets.find(
    (target) => target.targetKind === "server" && target.targetId.length > 0,
  )?.targetId;
}

function corpCounterCashoutProfile(
  definitionId: string,
): { creditsPerCounter: number } | undefined {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  if (
    hint?.planRoles?.includes("remote_asset_economy") !== true ||
    hint.conditions?.some(
      (condition) => condition.kind === "requires_advancement_counter",
    ) !== true ||
    hint.effects?.some(
      (effect) =>
        effect.kind === "economy" &&
        effect.timing === "action" &&
        effect.scope === "corp" &&
        effect.target === "economy.corp_counter_cashout",
    ) !== true ||
    hint.effects?.some(
      (effect) =>
        effect.kind === "advanceable_economy" &&
        effect.timing === "action" &&
        effect.scope === "remote" &&
        effect.resource === "advancement_counters",
    ) !== true
  ) {
    return undefined;
  }
  const creditEffects = (hint.effects ?? []).filter(
    (effect) =>
      effect.kind === "advanceable_economy" &&
      effect.timing === "action" &&
      effect.scope === "remote" &&
      effect.resource === "credits" &&
      Number.isSafeInteger(effect.amount) &&
      (effect.amount as number) > 0,
  );
  if (creditEffects.length !== 1) return undefined;
  return { creditsPerCounter: creditEffects[0]!.amount as number };
}

export function corpImmediateOperationEconomyConversions(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpEconomyImmediateOperationSignal[] {
  const hqByInstanceId = new Map(
    input.playerView.own.gripOrHq.map((card) => [card.instanceId, card]),
  );
  const legalActionsById = new Map(
    input.legalActions.map((action) => [action.actionId, action]),
  );
  const signals = candidates.flatMap((candidate) => {
    const sourceInstanceId = candidate.sourceCardInstanceId;
    const sourceDefinitionId = candidate.sourceDefinitionId;
    const sourceCard = sourceInstanceId
      ? hqByInstanceId.get(sourceInstanceId)
      : undefined;
    const action = legalActionsById.get(candidate.actionId);
    const projection = candidate.economyProjection;
    const grossLiquidCreditGain = projection?.grossLiquidCreditGain;
    const netLiquidCreditGain = projection?.netLiquidCreditGain;
    if (
      !sourceInstanceId ||
      !sourceDefinitionId ||
      !sourceCard?.known ||
      sourceCard.definitionId !== sourceDefinitionId ||
      visibleKnownCardType(input, sourceCard) !== "operation" ||
      action?.type !== "play_operation" ||
      candidate.sourceKind !== "card" ||
      candidate.semanticActionType !== "economy.gain_credit" ||
      candidate.costProfile.costKnownStatus !== "known" ||
      candidate.costProfile.additionalCosts.length > 0 ||
      candidate.targetContext?.selectedTargets.length ||
      candidate.projectionIssues.length > 0 ||
      candidate.hardGates.some((gate) => gate.status === "block") ||
      projection?.kind !== "immediate_liquid" ||
      projection.timing !== "immediate" ||
      projection.creditRestriction !== "general" ||
      projection.payoutMode !== "fixed" ||
      projection.reliability !== "guaranteed" ||
      projection.source !== "legal_action_payload" ||
      projection.confidence !== "high" ||
      !corpCandidatePreservesVoluntaryDrawHorizon(input, candidate) ||
      projection.cardsConsumed !== 1 ||
      !Number.isSafeInteger(projection.clickCost) ||
      projection.clickCost !== candidate.costProfile.clickCost ||
      projection.clickCost <= 0 ||
      !Number.isSafeInteger(projection.creditCost) ||
      projection.creditCost !== candidate.costProfile.creditCost ||
      projection.creditCost < 0 ||
      typeof grossLiquidCreditGain !== "number" ||
      !Number.isSafeInteger(grossLiquidCreditGain) ||
      typeof netLiquidCreditGain !== "number" ||
      !Number.isSafeInteger(netLiquidCreditGain) ||
      netLiquidCreditGain < 2 ||
      grossLiquidCreditGain - projection.creditCost !== netLiquidCreditGain ||
      !Number.isSafeInteger(projection.cardsDrawn) ||
      projection.cardsDrawn < 0 ||
      projection.cardsDrawn > input.playerView.own.stackOrRdCount ||
      !Number.isSafeInteger(projection.netHandDelta) ||
      projection.netHandDelta !==
        projection.cardsDrawn - projection.cardsConsumed ||
      input.playerView.own.credits < projection.creditCost ||
      input.playerView.own.clicks < projection.clickCost
    ) {
      return [];
    }
    if (
      projection.cardsDrawn === 0 &&
      projection.netHandDelta >= 0 &&
      corpVisibleLiquidityDemandTarget(input) > 0 &&
      input.playerView.own.credits >= corpVisibleLiquidityDemandTarget(input)
    ) {
      return [];
    }
    return [
      {
        kind: "convert_immediate_operation",
        needId: `economy-immediate-operation:${sourceInstanceId}`,
        sourceInstanceId,
        sourceDefinitionId,
        actionIds: [candidate.actionId],
        conversion: {
          clickCost: projection.clickCost,
          creditCost: projection.creditCost,
          grossLiquidCreditGain,
          netLiquidCreditGain,
          cardsDrawn: projection.cardsDrawn,
          cardsConsumed: 1,
          netHandDelta: projection.netHandDelta,
          payoutMode: "fixed",
          reliability: "guaranteed",
          source: "legal_action_payload",
        },
        cadence: {
          kind: "single_action",
          maximumConversions: 1,
        },
        completion: {
          kind: "source_consumed",
        },
        urgentForScore: false,
        evidenceCode: `corp_engine_certified_immediate_operation_conversion:${sourceDefinitionId}`,
      } satisfies CorpEconomyImmediateOperationSignal,
    ];
  });
  return uniqueBy(signals, (signal) => signal.needId);
}

export function corpVisibleCardEconomyWithdrawals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpEconomyVisibleCardWithdrawalSignal[] {
  const visibleSourceCardsById = new Map<
    string,
    {
      card: VisibleCard;
      sourceZone: "installed_root" | "score_area";
    }
  >([
    ...input.playerView.servers.flatMap((server) =>
      server.root.map(
        (card) =>
          [
            card.instanceId,
            { card, sourceZone: "installed_root" as const },
          ] as const,
      ),
    ),
    ...input.playerView.own.scoreArea.map(
      (card) =>
        [card.instanceId, { card, sourceZone: "score_area" as const }] as const,
    ),
  ]);
  const legalActionsById = new Map(
    input.legalActions.map((action) => [action.actionId, action]),
  );
  const signals = candidates.flatMap((candidate) => {
    const sourceInstanceId = candidate.sourceCardInstanceId;
    const visibleSource = sourceInstanceId
      ? visibleSourceCardsById.get(sourceInstanceId)
      : undefined;
    const sourceCard = visibleSource?.card;
    const sourceZone = visibleSource?.sourceZone;
    const sourceDefinitionId =
      candidate.sourceDefinitionId ?? sourceCard?.definitionId;
    const action = legalActionsById.get(candidate.actionId);
    const projection = candidate.economyProjection;
    const hostedCreditTakeMode = action?.payload?.hostedCreditTakeMode;
    const hostedCreditTakeAmount = action?.payload?.hostedCreditTakeAmount;
    const advancementCounterCount = action?.payload?.advancementCounterCount;
    const amountPerAdvancementCounter =
      action?.payload?.cardImplementationAmountPerAdvancementCounter;
    const grossLiquidCreditGain = projection?.grossLiquidCreditGain;
    const netLiquidCreditGain = projection?.netLiquidCreditGain;
    const hint = sourceDefinitionId
      ? AI_HINTS_BY_CARD.get(sourceDefinitionId)
      : undefined;
    const sourceIsAdmitted =
      sourceZone === "score_area"
        ? sourceCard?.known === true &&
          visibleKnownCardType(input, sourceCard) === "agenda"
        : sourceZone === "installed_root" &&
          sourceCard?.known === true &&
          sourceCard.rezzed === true &&
          visibleKnownCardType(input, sourceCard) === "asset" &&
          hint?.planRoles?.includes("remote_asset_economy") === true &&
          hint.quality?.hintReviewed === true &&
          hint.quality.strategyCovered === true &&
          hint.quality.needsHumanReview !== true &&
          sourceDefinitionId !== undefined &&
          (corpHostedCreditBankProfile(sourceDefinitionId) !== undefined ||
            corpCounterCashoutProfile(sourceDefinitionId) !== undefined);
    const hostedCreditPayout =
      action?.payload?.cardImplementationTakesHostedCredits === true &&
      (hostedCreditTakeMode === "up_to_amount_if_available" ||
        hostedCreditTakeMode === "all") &&
      typeof hostedCreditTakeAmount === "number" &&
      Number.isSafeInteger(hostedCreditTakeAmount) &&
      hostedCreditTakeAmount > 0
        ? {
            payoutSource: "hosted_credit_pool" as const,
            expectedGrossCreditGain: hostedCreditTakeAmount,
          }
        : undefined;
    const advancementCounterPayout =
      sourceZone === "installed_root" &&
      sourceCard?.rezzed === true &&
      sourceDefinitionId !== undefined &&
      corpCounterCashoutProfile(sourceDefinitionId) !== undefined &&
      action?.payload?.cardImplementationEconomyKind ===
        "gain_credits_per_advancement_counter_on_source" &&
      typeof advancementCounterCount === "number" &&
      Number.isSafeInteger(advancementCounterCount) &&
      advancementCounterCount >= 0 &&
      advancementCounterCount === (sourceCard.advancementCounters ?? 0) &&
      typeof amountPerAdvancementCounter === "number" &&
      Number.isSafeInteger(amountPerAdvancementCounter) &&
      amountPerAdvancementCounter > 0 &&
      Number.isSafeInteger(
        advancementCounterCount * amountPerAdvancementCounter,
      ) &&
      action.payload?.gainCreditsAmount ===
        advancementCounterCount * amountPerAdvancementCounter
        ? {
            payoutSource: "advancement_counter_cashout" as const,
            expectedGrossCreditGain:
              advancementCounterCount * amountPerAdvancementCounter,
          }
        : undefined;
    const declaredCounterCashoutAction =
      sourceZone === "installed_root" &&
      sourceCard?.rezzed === true &&
      sourceDefinitionId !== undefined &&
      corpCounterCashoutProfile(sourceDefinitionId) !== undefined &&
      action?.type === "activated_card_ability" &&
      action.source === sourceInstanceId &&
      action.payload?.cardId === sourceInstanceId &&
      action.payload?.cardImplementationEconomyKind ===
        "gain_credits_per_advancement_counter_on_source";
    if (
      declaredCounterCashoutAction &&
      advancementCounterPayout === undefined
    ) {
      throw new PlanResolutionFailure("missing_plan_module_coverage", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((entry) => entry.type),
        unresolvedActionIds: [candidate.actionId],
        owner: "rules_contract",
        removalCondition:
          "Project the current advancement-counter count and exact total payout on the Engine LegalAction before the Corp economy plan may assess this cashout.",
      });
    }
    const admittedPayout = hostedCreditPayout ?? advancementCounterPayout;
    if (
      !sourceInstanceId ||
      !sourceDefinitionId ||
      !sourceCard ||
      !sourceZone ||
      !sourceIsAdmitted ||
      sourceCard.definitionId !== sourceDefinitionId ||
      (candidate.sourceDefinitionId !== undefined &&
        candidate.sourceDefinitionId !== sourceDefinitionId) ||
      action?.type !== "activated_card_ability" ||
      action.source !== sourceInstanceId ||
      action.payload?.cardId !== sourceInstanceId ||
      !admittedPayout ||
      candidate.sourceKind !== "card" ||
      candidate.semanticActionType !== "economy.gain_credit" ||
      candidate.costProfile.costKnownStatus !== "known" ||
      candidate.costProfile.additionalCosts.length > 0 ||
      candidate.targetContext?.selectedTargets.length ||
      candidate.projectionIssues.some(
        (issue) => issue !== "ability_unresolved",
      ) ||
      candidate.hardGates.some((gate) => gate.status === "block") ||
      projection?.kind !== "immediate_liquid" ||
      projection.timing !== "immediate" ||
      projection.creditRestriction !== "general" ||
      projection.payoutMode !== "fixed" ||
      projection.reliability !== "guaranteed" ||
      projection.source !== "legal_action_payload" ||
      projection.confidence !== "high" ||
      projection.cardsConsumed !== 0 ||
      projection.cardsDrawn !== 0 ||
      projection.netHandDelta !== 0 ||
      !Number.isSafeInteger(projection.clickCost) ||
      projection.clickCost !== candidate.costProfile.clickCost ||
      projection.clickCost <= 0 ||
      !Number.isSafeInteger(projection.creditCost) ||
      projection.creditCost !== candidate.costProfile.creditCost ||
      projection.creditCost < 0 ||
      typeof grossLiquidCreditGain !== "number" ||
      !Number.isSafeInteger(grossLiquidCreditGain) ||
      grossLiquidCreditGain !== admittedPayout.expectedGrossCreditGain ||
      typeof netLiquidCreditGain !== "number" ||
      !Number.isSafeInteger(netLiquidCreditGain) ||
      netLiquidCreditGain <= projection.clickCost ||
      grossLiquidCreditGain - projection.creditCost !== netLiquidCreditGain ||
      input.playerView.own.credits < projection.creditCost ||
      input.playerView.own.clicks < projection.clickCost
    ) {
      return [];
    }
    const payoutServer = input.playerView.servers.find((server) =>
      server.root.some((card) => card.instanceId === sourceInstanceId),
    );
    const remainingPoolCredits = sourceCard.counters?.bit;
    const withdrawalPayback =
      admittedPayout.payoutSource === "hosted_credit_pool" &&
      payoutServer &&
      Number.isSafeInteger(remainingPoolCredits) &&
      remainingPoolCredits! > 0 &&
      projection.creditCost === 0
        ? assessCorpEconomyAssetPayback({
            input,
            serverId: payoutServer.id,
            cadence: "finite_pool",
            baselineHorizonTurns: 3,
            finitePoolCredits: remainingPoolCredits!,
            payoutCreditsPerExecution: grossLiquidCreditGain,
            payoutActionCost: projection.clickCost,
            setupCreditCost: 0,
            setupActionCost: 0,
          })
        : undefined;
    return [
      {
        kind: "convert_visible_card_payout",
        needId: `economy-visible-card-payout:${sourceInstanceId}`,
        sourceInstanceId,
        sourceDefinitionId,
        sourceZone,
        actionIds: [candidate.actionId],
        ...(withdrawalPayback
          ? {
              withdrawalCampaign: {
                remainingPoolCredits: remainingPoolCredits!,
                projectedPayoutExecutions:
                  withdrawalPayback.projectedPayoutExecutions,
                projectedNetCredits: withdrawalPayback.projectedNetCredits,
                horizonTurns: withdrawalPayback.riskAdjustedHorizonTurns,
                evidenceCodes: withdrawalPayback.evidenceCodes,
              },
            }
          : {}),
        conversion: {
          clickCost: projection.clickCost,
          creditCost: projection.creditCost,
          grossLiquidCreditGain,
          netLiquidCreditGain,
          cardsDrawn: 0,
          cardsConsumed: 0,
          netHandDelta: 0,
          payoutMode: "fixed",
          reliability: "guaranteed",
          source: "legal_action_payload",
          payoutSource: admittedPayout.payoutSource,
          ...(admittedPayout.payoutSource === "hosted_credit_pool"
            ? {
                hostedCreditTakeMode: hostedCreditTakeMode as
                  | "up_to_amount_if_available"
                  | "all",
              }
            : {}),
        },
        cadence: {
          kind: "single_action_revalidate",
          maximumConversions: 1,
        },
        completion: {
          kind: "source_pool_revalidated",
        },
        urgentForScore: false,
        evidenceCode: `corp_engine_certified_visible_card_payout:${sourceDefinitionId}`,
      } satisfies CorpEconomyVisibleCardWithdrawalSignal,
    ];
  });
  return uniqueBy(signals, (signal) => signal.needId);
}

export function corpImmediateOperationThresholdPreparations(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpEconomyOperationThresholdSignal[] {
  const exactBasicCreditCandidates = candidates.filter(
    corpExactBasicLiquidCreditCandidate,
  );
  if (
    exactBasicCreditCandidates.length !== 1 ||
    input.playerView.own.clicks < 2
  ) {
    return [];
  }
  const fundingCandidate = exactBasicCreditCandidates[0]!;
  const currentCredits = input.playerView.own.credits;
  return uniqueBy(
    input.playerView.own.gripOrHq.flatMap((card) => {
      if (
        !card.known ||
        !card.definitionId ||
        visibleKnownCardType(input, card) !== "operation" ||
        candidates.some(
          (candidate) =>
            candidate.sourceCardInstanceId === card.instanceId &&
            candidate.actionType === "play_operation",
        )
      ) {
        return [];
      }
      const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
      const hint = AI_HINTS_BY_CARD.get(card.definitionId);
      const operationCreditCost = definition?.cost;
      if (
        definition?.side !== "corp" ||
        definition.type !== "operation" ||
        !Number.isSafeInteger(operationCreditCost) ||
        operationCreditCost !== currentCredits + 1 ||
        definition.mechanics.includes("play_operation") !== true ||
        definition.mechanics.includes("gain_credits") !== true ||
        hint?.aiSupportStatus !== "ai_supported" ||
        hint.cardType !== "operation" ||
        hint.quality?.hintReviewed !== true ||
        hint.quality.needsHumanReview === true ||
        hint.roles.includes("economy_operation") !== true ||
        hint.planRoles.includes("recover_economy") !== true ||
        corpImmediateEconomyGainFromHint(hint) === undefined ||
        !Number.isSafeInteger(hint.valueHints?.economy) ||
        (hint.valueHints?.economy ?? 0) < 3 ||
        hint.costProfile?.clicks !== 1 ||
        (hint.conditions?.length ?? 0) > 0 ||
        (hint.targetProfiles?.length ?? 0) > 0
      ) {
        return [];
      }
      return [
        {
          kind: "prepare_immediate_operation",
          needId: `economy-immediate-operation:${card.instanceId}`,
          sourceInstanceId: card.instanceId,
          sourceDefinitionId: card.definitionId,
          actionIds: [fundingCandidate.actionId],
          threshold: {
            currentCredits,
            operationCreditCost,
            creditsAfterFunding: currentCredits + 1,
            fundingGap: 1,
          },
          futureConversion: {
            strategicEconomyValue: hint.valueHints!.economy!,
            classification: "reviewed_pure_burst_economy_operation",
            evidenceSource: "reviewed_strategic_hint",
          },
          cadence: {
            kind: "single_threshold_credit",
            maximumConversions: 1,
          },
          completion: {
            kind: "operation_becomes_legal",
          },
          urgentForScore: false,
          evidenceCode: `corp_reviewed_operation_one_credit_threshold:${card.definitionId}`,
        } satisfies CorpEconomyOperationThresholdSignal,
      ];
    }),
    (signal) => signal.needId,
  );
}

export function corpRequiredEconomyNeeds(
  input: AiDecisionInput,
  scoreProjects: readonly CorpScoreProjectSignal[],
  defenseNeeds: readonly CorpDefenseSignal[],
  remoteProjects: CorpCorePlanDomain["remoteProjects"],
  ambushes: readonly CorpPlanDomain["ambushes"][number][],
  punishCampaigns: readonly CorpPunishCampaignSignal[],
  immediateFundingActionIds: string[],
  terminalFundingActionIds: string[],
  candidates: readonly ActionSemanticCandidate[],
): CorpCorePlanDomain["economyNeeds"] {
  const projectsWithCurrentProtectionSupport = new Set(
    defenseNeeds.flatMap((need) =>
      need.kind === "generic" ||
      (need.kind === "score_protection_install" && need.effect === "progress")
        ? []
        : [need.parentProjectId],
    ),
  );
  const exactAmbushSetupCardIds = new Set(
    ambushes
      .filter(
        (ambush) =>
          ambush.phase === "install" &&
          ambush.installRoute !== undefined &&
          ambush.installRoute.fundingGap === 0,
      )
      .map((ambush) => ambush.sourceInstanceId),
  );
  const scoreSupport = scoreProjects.flatMap((project) =>
    project.fundingMilestone !== undefined &&
    project.fundingMilestone.remainingGap > 0 &&
    (project.feasible ||
      project.terminalScore ||
      project.conversion?.residentParent === true ||
      project.conversion?.runnerStealIsMatchpoint === true ||
      (project.conversion?.existingRemoteIceCount ?? 0) > 0 ||
      (project.conversion?.realizedStrategySupportCount ?? 0) > 0) &&
    (project.agendaInstanceId === undefined ||
      !exactAmbushSetupCardIds.has(project.agendaInstanceId)) &&
    !projectsWithCurrentProtectionSupport.has(project.projectId)
      ? [
          {
            kind: "parent_funding" as const,
            needId: `score-support:${project.projectId}`,
            gap: project.fundingMilestone.remainingGap,
            actionIds:
              project.sameTurnFundingActionIds ??
              (project.feasible &&
              (project.sameTurnCloseout || project.terminalScore)
                ? terminalFundingActionIds
                : immediateFundingActionIds),
            parentPlanInstanceId: planInstanceIdForProposal({
              moduleId: "corp.score_agenda",
              dedupeKey: project.projectId,
            }),
            parentNeedId: `score-support:${project.projectId}`,
            scoreFundingMilestone: project.fundingMilestone,
            delegatedPriorityClass: corpScorePriorityClass(project),
            urgentForScore: true,
            evidenceCode: project.evidenceCode,
          },
        ]
      : [],
  );
  const defenseReserve = corpDefenseReserveNeeds(
    input,
    defenseNeeds,
    immediateFundingActionIds,
    candidates,
    scoreProjects,
  );
  const remoteFunding = remoteProjects.flatMap((project) => {
    const need = project.need;
    if (
      !project.cadence.open ||
      need?.capability !== "credits" ||
      need.minimum <= 0
    ) {
      return [];
    }
    return [
      {
        kind: "parent_funding" as const,
        needId: need.needId,
        gap: need.minimum,
        actionIds: immediateFundingActionIds,
        parentPlanInstanceId: planInstanceIdForProposal({
          moduleId: "corp.establish_scoring_remote",
          dedupeKey: project.projectId,
        }),
        parentNeedId: need.needId,
        parentPriorityClass: "P6" as const,
        urgentForScore: false,
        evidenceCode: project.evidenceCode,
      },
    ];
  });
  const ambushFunding = ambushes.flatMap((ambush) => {
    const defenseFunding = (ambush.defenseNeed?.fundingGap ?? 0) > 0;
    const gap = defenseFunding
      ? ambush.defenseNeed!.fundingGap
      : ambush.installRoute?.fundingGap;
    if (
      (ambush.phase !== "install" && !defenseFunding) ||
      (defenseFunding && input.playerView.run !== undefined) ||
      typeof gap !== "number" ||
      !Number.isSafeInteger(gap) ||
      gap <= 0
    ) {
      return [];
    }
    const needId = `${defenseFunding ? "ambush-defense-funding" : "ambush-funding"}:${ambush.sourceInstanceId}`;
    return [
      {
        kind: "parent_funding" as const,
        needId,
        gap,
        actionIds: immediateFundingActionIds,
        parentPlanInstanceId: planInstanceIdForProposal({
          moduleId: "corp.ambush_and_bluff",
          dedupeKey: ambush.ambushId,
        }),
        parentNeedId: needId,
        parentPriorityClass:
          ambush.phase === "install" ? ("P5" as const) : ("P4" as const),
        urgentForScore: false,
        evidenceCode: ambush.evidenceCode,
      },
    ];
  });
  const punishFunding = punishCampaigns.flatMap((campaign) => {
    const route = campaign.routeContract;
    if (
      !route ||
      route.quoteStatus !== "complete" ||
      route.horizon !== "fund" ||
      route.fundingGap <= 0 ||
      route.fundingActionIds.length === 0
    ) {
      return [];
    }
    return [
      {
        kind: "parent_funding" as const,
        needId: route.fundingNeedId,
        gap: route.fundingGap,
        actionIds: route.fundingActionIds,
        parentPlanInstanceId: planInstanceIdForProposal({
          moduleId: "corp.punish_campaign",
          dedupeKey: campaign.campaignId,
        }),
        parentNeedId: route.fundingNeedId,
        parentPriorityClass: corpPunishFundingParentPriority(campaign),
        urgentForScore: false,
        evidenceCode: campaign.evidenceCode,
      },
    ];
  });
  return uniqueBy(
    [
      ...scoreSupport,
      ...defenseReserve,
      ...remoteFunding,
      ...ambushFunding,
      ...punishFunding,
    ],
    (signal) => signal.needId,
  );
}

function corpPunishFundingParentPriority(
  signal: CorpPunishCampaignSignal,
): "P1" | "P4" | "P5" {
  if (
    signal.routeContract &&
    signal.terminalCondition === "runner_flatline" &&
    signal.visibleTerminalProjection &&
    (signal.guarantee === "visible_state_forced" ||
      signal.guarantee === "robust_but_reactive") &&
    signal.routeContract.quoteStatus === "complete" &&
    signal.routeContract.horizon !== "wait"
  ) {
    return "P1";
  }
  return signal.priorityClass ?? "P4";
}
