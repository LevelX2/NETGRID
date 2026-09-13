import {
  CORP_FORT_RUN_TEMPORARY_ENCOUNTER_REZ_SUPPORT_KIND,
  type AiDecisionInput,
  type VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { actionHasConditionalDefenseFollowupQuotePayload } from "../../actions/conditional-defense-followup-quote";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { type CorpDefenseSignal } from "../../plans/corp-defense-contracts";
import { type CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { type CorpCentralDefenseAllocation } from "./corp-central-defense-allocation";
import {
  actionIceRezSupportLiability,
  definitionHasActionIceRezSupport,
} from "./corp-defense-rez-support-facts";
import { assessCorpPaidEncounterDefense } from "./corp-paid-encounter-defense";
import { corpPassTaxRezAssessment } from "../../runtime/corp-pass-tax-rez-assessment";
import { corpRootRezTimingComponent } from "../../runtime/corp-scoreline/semantic-runtime-corp-score-ice-components";
import { isFiniteNonNegativeInteger } from "../../runtime/exact-action-cost-facts";
import { legalActionCreditCost } from "../../runtime/legal-action-credit-cost";
import {
  isServerId,
  serverForInstalledCard,
  visibleKnownCardType,
} from "../../runtime/visible-action-facts";
import { visibleKnownAgendaOnServer } from "../../runtime/visible-server-agenda-facts";
import { visibleRunnerRunPathCreditBudgetForRig } from "../../visible-run-analysis";
import { corpCardRoutePreservesScoreReserve } from "./defense-discovery-support";
import {
  CorpExactCardRezSupportAssessment,
  CorpRunDefenseAbilityAssessment,
} from "./defense-runtime-types";

export function corpVisibleHandHasActionIceRezSupport(
  input: AiDecisionInput,
): boolean {
  return input.playerView.own.gripOrHq.some(
    (card) =>
      card.known &&
      typeof card.definitionId === "string" &&
      definitionHasActionIceRezSupport(card.definitionId),
  );
}

export function corpIceRezSupportOperationSignal(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  centralAllocation: CorpCentralDefenseAllocation | undefined,
  scoreProjects: readonly CorpScoreProjectSignal[],
): CorpDefenseSignal | undefined {
  if (
    candidate.actionType !== "play_operation" ||
    !candidate.sourceDefinitionId ||
    !definitionHasActionIceRezSupport(candidate.sourceDefinitionId)
  ) {
    return undefined;
  }
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  const targetIceInstanceId = action?.payload?.targetCardId;
  if (
    !action ||
    action.type !== "play_operation" ||
    typeof targetIceInstanceId !== "string"
  ) {
    return undefined;
  }
  const matches = input.playerView.servers.flatMap((server) =>
    server.ice
      .filter(
        (ice) =>
          ice.instanceId === targetIceInstanceId &&
          ice.known &&
          ice.type === "ice" &&
          !ice.rezzed,
      )
      .map((ice) => ({ ice, serverId: server.id })),
  );
  if (matches.length !== 1) return undefined;
  const { ice, serverId } = matches[0]!;
  const centralEvidence =
    (serverId === "hq" || serverId === "rd") &&
    centralAllocation?.status === "known"
      ? centralAllocation.evidence[serverId]
      : undefined;
  const urgentCentralDefense =
    centralEvidence !== undefined &&
    (centralEvidence.threat === "acute" ||
      centralEvidence.threat === "terminal" ||
      centralEvidence.recentSuccessfulAccessRunnerTurns > 0);
  if (!urgentCentralDefense) return undefined;
  const quote = ice.effectiveRezCostQuote;
  if (
    quote?.complete !== true ||
    typeof quote.finalCredits !== "number" ||
    !Number.isSafeInteger(quote.finalCredits) ||
    quote.finalCredits <= input.playerView.own.credits
  ) {
    return undefined;
  }
  const creditCost = candidate.costProfile.creditCost;
  const clickCost = candidate.costProfile.clickCost;
  if (
    candidate.costProfile.costKnownStatus !== "known" ||
    candidate.costProfile.additionalCosts.length > 0 ||
    typeof creditCost !== "number" ||
    !Number.isSafeInteger(creditCost) ||
    creditCost < 0 ||
    creditCost >= quote.finalCredits ||
    creditCost > input.playerView.own.credits ||
    typeof clickCost !== "number" ||
    !Number.isSafeInteger(clickCost) ||
    clickCost <= 0 ||
    clickCost > input.playerView.own.clicks
  ) {
    return undefined;
  }
  if (
    !corpCardRoutePreservesScoreReserve(
      input,
      candidate,
      serverId,
      scoreProjects,
      "P3",
    ).preservesReserve
  ) {
    return undefined;
  }
  const liability = actionIceRezSupportLiability(candidate.sourceDefinitionId);
  if (!liability) return undefined;
  const relief = quote.finalCredits - creditCost;
  const liabilityKind = liability;
  let duration = 0;
  let value = 130 + relief * 3;
  if (liability === "temporary") {
    const xValue = action.payload?.xValue;
    if (
      typeof xValue !== "number" ||
      !Number.isSafeInteger(xValue) ||
      xValue < 1
    ) {
      return undefined;
    }
    duration = xValue;
    value = 125 + relief * 3 - Math.abs(xValue - 3) * 8;
  } else if (liability === "installment") {
    duration = quote.finalCredits;
    value = 120 + relief * 2 - Math.min(8, quote.finalCredits);
  }
  return {
    kind: "generic",
    defenseId: `rez-support:${serverId}:${targetIceInstanceId}:${candidate.actionId}`,
    serverId,
    phase: "activate_run_defense",
    sourceDefinitionIds: [candidate.sourceDefinitionId],
    actionIds: [candidate.actionId],
    targetIceInstanceId,
    urgent: true,
    value,
    evidenceCode: `corp_revalidated_ice_rez_support:${serverId}:${liabilityKind}:duration_${duration}:direct_gap_${quote.finalCredits - input.playerView.own.credits}:action_cost_${creditCost}`,
  };
}

export function corpPostPassIceLifecycleDefenseSignal(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): CorpDefenseSignal | undefined {
  if (
    candidate.actionType !== "continue_run" ||
    candidate.semanticActionType !== "run.continue"
  ) {
    return undefined;
  }
  const action = input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  const sourceDefinitionId = action?.payload?.sourceDefinitionId;
  const serverId = action?.payload?.serverId;
  const decision = action?.payload?.decision;
  const paymentAmount = action?.payload?.paymentAmount;
  const creditCost = action ? legalActionCreditCost(action) : undefined;
  if (
    action?.type !== "continue_run" ||
    action.side !== "corp" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.payload?.corpPostPassIceAbility !== "return_passed_ice_to_hq" ||
    typeof action.payload.postPassIceTrashedUnlessReturned !== "boolean" ||
    typeof action.source !== "string" ||
    action.source.length === 0 ||
    typeof sourceDefinitionId !== "string" ||
    sourceDefinitionId.length === 0 ||
    typeof serverId !== "string" ||
    !isServerId(serverId) ||
    !(
      (decision === "pay" &&
        typeof paymentAmount === "number" &&
        Number.isSafeInteger(paymentAmount) &&
        paymentAmount > 0 &&
        creditCost === paymentAmount) ||
      (decision === "return_to_hq" &&
        paymentAmount === undefined &&
        creditCost === 0) ||
      (decision === "decline" &&
        paymentAmount === undefined &&
        creditCost === 0)
    )
  ) {
    return undefined;
  }
  return {
    kind: "generic",
    defenseId: `post-pass-ice-lifecycle:${action.source}:${serverId}`,
    serverId,
    phase: "resolve_post_pass_ice_lifecycle",
    sourceDefinitionIds: [sourceDefinitionId],
    actionIds: [action.actionId],
    targetIceInstanceId: action.source,
    urgent: true,
    value: 1,
    evidenceCode: `corp_post_pass_ice_lifecycle:${sourceDefinitionId}:${serverId}:temporary:${action.payload.postPassIceTrashedUnlessReturned}:${decision}`,
  };
}

export function corpRezEstablishesPersistentDefenseSupport(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  serverId: string,
): boolean {
  if (!candidate.sourceDefinitionId) return false;
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  const isExplicitDefenseSupport =
    hint?.roles?.includes("run_defense") === true &&
    hint?.planRoles?.includes("remote_upgrade_rez_support") === true;
  if (!isExplicitDefenseSupport) return false;
  const server = input.playerView.servers.find(
    (candidateServer) => candidateServer.id === serverId,
  );
  return corpSupportRetainsFundedIce(
    input,
    candidate,
    server ? [server] : [],
    1,
  );
}

function corpSupportRetainsFundedIce(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  servers: AiDecisionInput["playerView"]["servers"],
  minimumTargetCount: number,
  matchingIceIds?: ReadonlySet<string>,
): boolean {
  const cost = candidate.costProfile;
  if (
    cost.costKnownStatus !== "known" ||
    cost.additionalCosts.length > 0 ||
    !isFiniteNonNegativeInteger(cost.creditCost)
  )
    return false;
  const remaining = input.playerView.own.credits - cost.creditCost;
  if (remaining < 0) return false;
  const targetCosts = servers
    .flatMap((server) =>
      server.ice.flatMap((ice) => {
        if (matchingIceIds && !matchingIceIds.has(ice.instanceId)) return [];
        if (ice.rezzed) return [0];
        const quote = ice.effectiveRezCostQuote;
        if (
          quote?.complete !== true ||
          quote.context !== "installed" ||
          quote.cardId !== ice.instanceId ||
          quote.targetServerId !== server.id ||
          quote.projectedServerId !== server.id ||
          quote.expiresAtStateVersion !== input.playerView.stateVersion ||
          quote.mandatoryAdditionalCosts.agendaPoints !== 0 ||
          !isFiniteNonNegativeInteger(quote.finalCredits)
        )
          return [];
        return [quote.finalCredits];
      }),
    )
    .sort((a, b) => a - b);
  return (
    targetCosts.length >= minimumTargetCount &&
    targetCosts
      .slice(0, minimumTargetCount)
      .reduce((sum, value) => sum + value, 0) <= remaining
  );
}

export function corpRunDefenseAbilityAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): CorpRunDefenseAbilityAssessment | undefined {
  const legalAction = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  if (!legalAction)
    throw new PlanResolutionFailure("stale_or_future_action_reference", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [candidate.actionId],
      owner: "action_semantics",
      removalCondition:
        "Bind the run-defense assessment to the current exact LegalAction.",
    });
  const paidEncounterDefense = assessCorpPaidEncounterDefense(
    input,
    legalAction,
  );
  if (paidEncounterDefense) return paidEncounterDefense;
  if (
    candidate.semanticActionType === "run.end_by_corp" &&
    legalAction.side === "corp" &&
    legalAction.type === "activated_card_ability" &&
    legalAction.expiresAtStateVersion === input.playerView.stateVersion &&
    legalAction.payload?.cardImplementationEffectKind === "end_run" &&
    legalAction.targetRequirements.length === 0 &&
    (legalAction.choiceRequirements?.length ?? 0) === 0 &&
    input.playerView.run
  ) {
    return {
      productive: true,
      serverId: input.playerView.run.attackedServerId,
      value: 1_000,
      evidenceCode: `engine_certified_activated_end_run:${input.playerView.run.attackedServerId}:${candidate.actionId}`,
    };
  }
  const isRunCreditReserve =
    legalAction.side === "corp" &&
    legalAction.type === "activated_card_ability" &&
    legalAction.expiresAtStateVersion === input.playerView.stateVersion &&
    legalAction.payload?.cardImplementationAbilityKey ===
      "during_run_discard_for_two_run_credits";
  if (isRunCreditReserve) {
    const serverId = input.playerView.run?.attackedServerId ?? "unknown";
    const currentCredits = input.playerView.own.credits;
    const currentRezCosts = input.legalActions
      .filter(
        (action) =>
          action.side === "corp" &&
          action.type === "rez_ice" &&
          action.expiresAtStateVersion === input.playerView.stateVersion,
      )
      .map((action) => legalActionCreditCost(action))
      .filter(
        (credits): credits is number =>
          typeof credits === "number" &&
          Number.isSafeInteger(credits) &&
          credits >= 0,
      );
    const exactFundingGap = currentRezCosts
      .map((rezCost) => rezCost - currentCredits)
      .filter((gap) => gap > 0 && gap <= 2)
      .sort((left, right) => left - right)[0];
    if (exactFundingGap !== undefined) {
      return {
        productive: true,
        serverId,
        value: 200 + exactFundingGap,
        evidenceCode: `corp_temporary_run_credits_close_current_rez_gap:${serverId}:${exactFundingGap}:${candidate.actionId}`,
      };
    }
    return {
      productive: false,
      serverId,
      value: 0,
      evidenceCode:
        currentRezCosts.length > 0 &&
        currentRezCosts.every((rezCost) => rezCost <= currentCredits)
          ? `corp_temporary_run_credits_have_no_current_defense_funding_gap:${serverId}:${candidate.actionId}`
          : `corp_temporary_run_credits_have_no_engine_bound_current_rez_gap:${serverId}:${candidate.actionId}`,
    };
  }
  if (!candidate.sourceDefinitionId) return undefined;
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  const isFortIceSwap =
    hint?.effects?.some(
      (effect) =>
        effect.kind === "zone_shuffle" &&
        effect.scope === "hq" &&
        effect.target === "ice.corp_hq_runpath_insert" &&
        effect.timing === "during_run",
    ) === true && hint?.functionSignals?.includes("ice.corp_ice_swap") === true;
  if (!isFortIceSwap) return undefined;
  if (legalAction.payload?.abilityId !== "hq_ice_swap") return undefined;
  const sourceCardId = candidate.sourceCardInstanceId;
  const serverId = sourceCardId
    ? serverForInstalledCard(input, sourceCardId)
    : undefined;
  if (!serverId) {
    return {
      productive: false,
      serverId: "unknown",
      value: 0,
      evidenceCode:
        "corp_run_defense_ice_swap_source_not_bound_to_visible_fort",
    };
  }
  const run = input.playerView.run;
  if (
    !run ||
    run.attackedServerId !== serverId ||
    run.position?.kind !== "ice"
  ) {
    return {
      productive: false,
      serverId,
      value: 0,
      evidenceCode:
        "corp_run_defense_ice_swap_has_no_exact_current_fort_encounter",
    };
  }
  const server = input.playerView.servers.find(
    (candidateServer) => candidateServer.id === serverId,
  );
  const currentIce = server?.ice[run.position.iceIndex];
  if (!currentIce || currentIce.rezzed === true) {
    return {
      productive: false,
      serverId,
      value: 0,
      evidenceCode:
        "corp_run_defense_ice_swap_has_no_unrezzed_exact_encounter_ice",
    };
  }
  return {
    productive: false,
    serverId,
    value: 0,
    evidenceCode: "corp_run_defense_ice_swap_has_no_engine_certified_rez_quote",
  };
}

function visibleIceDefenseValue(card: VisibleCard): number {
  const strength =
    typeof card.strength === "number" && Number.isFinite(card.strength)
      ? Math.max(0, card.strength)
      : 0;
  const rulesText = card.rulesText?.toLowerCase() ?? "";
  return (
    strength +
    (rulesText.includes("end the run") ? 4 : 0) +
    (rulesText.includes("damage") ? 2 : 0) +
    (rulesText.includes("trash a program") ? 2 : 0)
  );
}

export function corpFutureEncounterRezSupportAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  sourceCard: VisibleCard,
  serverId: string,
):
  | {
      productive: boolean;
      evidenceCode: string;
    }
  | undefined {
  const legalAction = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  if (!legalAction)
    throw new PlanResolutionFailure("stale_or_future_action_reference", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [candidate.actionId],
      owner: "action_semantics",
      removalCondition:
        "Bind the future-encounter rez assessment to the current exact LegalAction.",
    });
  if (
    candidate.conditionalDefenseFollowupQuote ||
    actionHasConditionalDefenseFollowupQuotePayload(candidate)
  ) {
    return corpFortRunRezSupportAssessment(input, candidate, serverId);
  }
  if (!candidate.sourceDefinitionId) return undefined;
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  const usesVisibleHqIceForFutureEncounter =
    hint?.effects?.some(
      (effect) =>
        effect.kind === "future_encounter_effect" &&
        effect.target === "ice.corp_hq_runpath_insert",
    ) === true;
  if (!usesVisibleHqIceForFutureEncounter) return undefined;
  if (
    candidate.sourceCardInstanceId === undefined ||
    serverForInstalledCard(input, candidate.sourceCardInstanceId) !== serverId
  )
    return {
      productive: false,
      evidenceCode:
        "corp_rez_future_encounter_support_source_not_bound_to_fort",
    };
  const timing = corpRootRezTimingComponent(input, legalAction, sourceCard);
  if (!timing || timing.value <= 0)
    return {
      productive: false,
      evidenceCode: timing
        ? `corp_rez_future_encounter_support_deferred:${timing.key}`
        : "corp_rez_future_encounter_support_has_no_relevant_run_window",
    };
  const hqIce = input.playerView.own.gripOrHq.filter(
    (card) => visibleKnownCardType(input, card) === "ice",
  );
  if (hqIce.length === 0)
    return {
      productive: false,
      evidenceCode: "corp_rez_future_encounter_support_has_no_visible_hq_ice",
    };
  return {
    productive: false,
    evidenceCode:
      "corp_rez_future_encounter_support_has_no_engine_certified_rez_quote",
  };
}

function corpFortRunRezSupportAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  serverId: string,
): { productive: boolean; evidenceCode: string } {
  if (
    !candidate.sourceCardInstanceId ||
    serverForInstalledCard(input, candidate.sourceCardInstanceId) !== serverId
  ) {
    return {
      productive: false,
      evidenceCode:
        "corp_rez_fort_run_support_source_not_bound_to_successful_run_fort",
    };
  }
  const legalAction = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  if (!legalAction)
    throw new PlanResolutionFailure("stale_or_future_action_reference", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [candidate.actionId],
      owner: "action_semantics",
      removalCondition:
        "Bind the fort-run rez-support assessment to the current exact LegalAction.",
    });
  const quote = candidate.conditionalDefenseFollowupQuote;
  const currentCredits = input.playerView.own.credits;
  const listedRezCredits = legalAction.costs.reduce(
    (sum, cost) => (cost.credits === undefined ? sum : sum + cost.credits),
    0,
  );
  if (
    candidate.legalActionRef.actionId !== candidate.actionId ||
    candidate.legalActionRef.actionType !== legalAction.type ||
    candidate.stateVersion !== input.playerView.stateVersion ||
    legalAction.source !== candidate.sourceCardInstanceId ||
    quote === undefined ||
    quote.sourceCardInstanceId !== candidate.sourceCardInstanceId ||
    quote.targetServerId !== serverId ||
    quote.stateVersion !== input.playerView.stateVersion ||
    quote.actionId !== candidate.actionId ||
    !isFiniteNonNegativeInteger(currentCredits) ||
    legalAction.costs.some(
      (cost) =>
        cost.credits !== undefined && !isFiniteNonNegativeInteger(cost.credits),
    ) ||
    !Number.isSafeInteger(listedRezCredits) ||
    quote.rezCredits !== listedRezCredits ||
    quote.totalCreditsPayable !== currentCredits >= quote.totalCredits
  ) {
    return {
      productive: false,
      evidenceCode:
        "corp_rez_fort_run_support_has_no_complete_consistent_engine_quote",
    };
  }
  if (!quote.hasOwnHqIce) {
    return {
      productive: false,
      evidenceCode: "corp_rez_fort_run_support_engine_quote_has_no_hq_ice",
    };
  }
  if (!quote.totalCreditsPayable) {
    return {
      productive: false,
      evidenceCode:
        "corp_rez_fort_run_support_engine_quote_total_credits_unpayable",
    };
  }
  return {
    productive: true,
    evidenceCode:
      quote.kind === CORP_FORT_RUN_TEMPORARY_ENCOUNTER_REZ_SUPPORT_KIND
        ? "corp_rez_fort_run_support_same_fort_run_with_affordable_temporary_hq_ice_encounter"
        : "corp_rez_fort_run_support_same_fort_run_with_affordable_hq_ice_install",
  };
}

export function corpExactCardRezSupportAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  sourceCard: VisibleCard,
  serverId: string,
): CorpExactCardRezSupportAssessment | undefined {
  if (
    candidate.sourceCardInstanceId !== sourceCard.instanceId ||
    serverForInstalledCard(input, sourceCard.instanceId) !== serverId
  ) {
    return undefined;
  }
  const passTaxAssessment = corpPassTaxRezAssessment(
    input,
    candidate,
    sourceCard,
    serverId,
  );
  if (passTaxAssessment) return passTaxAssessment;
  const hint = candidate.sourceDefinitionId
    ? AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId)
    : sourceCard.definitionId
      ? AI_HINTS_BY_CARD.get(sourceCard.definitionId)
      : undefined;
  const exactAgendaStealTax =
    hint?.effects?.some(
      (effect) =>
        effect.kind === "run_tax" &&
        effect.scope === "accessed_card" &&
        effect.timing === "on_access" &&
        effect.target === "agenda_steal_cost" &&
        typeof effect.amount === "number" &&
        effect.amount > 0,
    ) === true &&
    (hint?.effects.some(
      (effect) =>
        effect.kind === "remote_protection" &&
        effect.scope === "fort" &&
        effect.timing === "persistent" &&
        effect.target === "remote.agenda_steal_tax",
    ) === true ||
      hint?.functionSignals?.includes("access.agenda_steal_tax") === true);
  if (exactAgendaStealTax) {
    const canContainAgenda =
      serverId === "rd"
        ? input.playerView.own.stackOrRdCount > 0
        : serverId === "hq"
          ? input.playerView.own.gripOrHq.some((card) => card.type === "agenda")
          : visibleKnownAgendaOnServer(input, serverId);
    if (!canContainAgenda) {
      return {
        productive: false,
        serverId,
        value: 0,
        evidenceCode:
          "corp_rez_agenda_steal_tax_has_no_accessible_agenda_on_exact_fort",
      };
    }
    const action = input.legalActions.find(
      (legalAction) => legalAction.actionId === candidate.actionId,
    );
    const timing = action
      ? corpRootRezTimingComponent(input, action, sourceCard)
      : undefined;
    if (!timing || timing.value <= 0) {
      return {
        productive: false,
        serverId,
        value: 0,
        evidenceCode: `corp_rez_agenda_steal_tax_not_at_latest_relevant_window:${timing?.key ?? "missing_timing_quote"}`,
      };
    }
    return {
      productive: true,
      serverId,
      value: 180,
      evidenceCode:
        "corp_rez_agenda_steal_tax_protects_accessible_agenda_at_latest_relevant_window",
    };
  }
  const disablesVisibleStealthCreditsOnExactFort =
    hint?.quality?.hintReviewed === true &&
    hint.side === "corp" &&
    hint.effects?.some(
      (effect) =>
        effect.kind === "run_tax" &&
        effect.scope === "fort" &&
        effect.target === "run.corp_stealth_credit_lockout" &&
        effect.timing === "during_run",
    ) === true &&
    hint.functionSignals?.includes("run.corp_stealth_credit_lockout") === true;
  if (disablesVisibleStealthCreditsOnExactFort) {
    const run = input.playerView.run;
    if (!run || run.attackedServerId !== serverId) {
      return {
        productive: false,
        serverId,
        value: 0,
        evidenceCode: run
          ? "corp_rez_fort_stealth_credit_lockout_current_run_is_on_another_fort"
          : "corp_rez_fort_stealth_credit_lockout_has_no_current_run",
      };
    }
    const visibleCreditBudget = visibleRunnerRunPathCreditBudgetForRig(
      input.playerView.opponent.rig ?? [],
    );
    const blockedCredits = visibleCreditBudget.stealthNonNoisyIcebreakerCredits;
    if (blockedCredits <= 0) {
      return {
        productive: false,
        serverId,
        value: 0,
        evidenceCode:
          "corp_rez_fort_stealth_credit_lockout_has_no_visible_usable_stealth_credits",
      };
    }
    return {
      productive: true,
      serverId,
      value: 160,
      evidenceCode: `corp_rez_fort_stealth_credit_lockout_blocks_visible_credits:${blockedCredits}`,
    };
  }
  const structuredIceSupport = corpStructuredIceSupportAssessment(
    input,
    candidate,
    serverId,
    hint,
  );
  if (structuredIceSupport) return structuredIceSupport;
  const establishesFortWideIceStrengthSupport =
    hint?.effects?.some(
      (effect) =>
        effect.kind === "remote_protection" &&
        effect.scope === "ice" &&
        effect.target === "ice.corp_strength_support" &&
        effect.timing === "persistent",
    ) === true;
  if (establishesFortWideIceStrengthSupport) {
    const server = input.playerView.servers.find(
      (candidateServer) => candidateServer.id === serverId,
    );
    if (!server || server.ice.length === 0) {
      return {
        productive: false,
        serverId,
        value: 0,
        evidenceCode:
          "corp_rez_fort_ice_strength_support_has_no_ice_on_exact_fort",
      };
    }
    if (!corpSupportRetainsFundedIce(input, candidate, [server], 1)) {
      return {
        productive: false,
        serverId,
        value: 0,
        evidenceCode:
          "corp_rez_ice_strength_support_has_no_funded_target_after_payment",
      };
    }
    const run = input.playerView.run;
    if (!run) {
      return {
        productive: true,
        serverId,
        value: 120,
        evidenceCode:
          "corp_rez_establishes_persistent_exact_fort_ice_strength_support",
      };
    }
    const exactUpcomingEncounter =
      run.attackedServerId === serverId && run.position?.kind === "ice";
    return exactUpcomingEncounter
      ? {
          productive: true,
          serverId,
          value: 160,
          evidenceCode: "corp_rez_supports_current_exact_fort_ice_strength",
        }
      : {
          productive: false,
          serverId,
          value: 0,
          evidenceCode:
            run.attackedServerId === serverId
              ? "corp_rez_fort_ice_strength_support_has_no_upcoming_ice_encounter"
              : "corp_rez_fort_ice_strength_support_current_run_is_on_another_fort",
        };
  }
  return undefined;
}

function corpStructuredIceSupportAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  sourceServerId: string,
  hint: ReturnType<(typeof AI_HINTS_BY_CARD)["get"]>,
):
  | {
      productive: boolean;
      serverId: string;
      value: number;
      evidenceCode: string;
    }
  | undefined {
  const profile = hint?.targetProfiles?.find(
    (candidateProfile) =>
      "schemaVersion" in candidateProfile &&
      candidateProfile.schemaVersion === "target-profile-v1" &&
      candidateProfile.targetType === "installed_ice" &&
      (candidateProfile.requiredSubtypes !== undefined ||
        candidateProfile.serverScope !== undefined ||
        candidateProfile.activeRunConstraint !== undefined),
  );
  if (!profile || !("schemaVersion" in profile)) return undefined;

  const sourceServer = input.playerView.servers.find(
    (server) => server.id === sourceServerId,
  );
  const servers =
    profile.serverScope === "source_fort"
      ? sourceServer
        ? [sourceServer]
        : []
      : input.playerView.servers;
  const requiredSubtypes = profile.requiredSubtypes ?? [];
  const matchingIceIds = servers.flatMap((server) =>
    server.ice.flatMap((ice) => {
      const definition = ice.definitionId
        ? CARD_DEFINITIONS_BY_ID[ice.definitionId]
        : undefined;
      const matchesSubtypes = requiredSubtypes.every((subtype) =>
        definition?.subtypes.some(
          (visibleSubtype) =>
            visibleSubtype.trim().toLowerCase().replaceAll(" ", "_") ===
            subtype,
        ),
      );
      return matchesSubtypes ? [ice.instanceId] : [];
    }),
  );
  const minimumTargetCount = Math.max(1, profile.minimumTargetCount ?? 1);
  if (matchingIceIds.length < minimumTargetCount) {
    return {
      productive: false,
      serverId: sourceServerId,
      value: 0,
      evidenceCode: `corp_rez_structured_ice_support_missing_targets:${requiredSubtypes.join("+") || "ice"}:${profile.serverScope ?? "any_visible_server"}`,
    };
  }

  if (
    !corpSupportRetainsFundedIce(
      input,
      candidate,
      servers,
      minimumTargetCount,
      new Set(matchingIceIds),
    )
  ) {
    return {
      productive: false,
      serverId: sourceServerId,
      value: 0,
      evidenceCode:
        "corp_rez_structured_ice_support_has_no_funded_targets_after_payment",
    };
  }

  if (
    profile.activeRunConstraint === "same_fort_upcoming_ice_when_active" &&
    input.playerView.run
  ) {
    const run = input.playerView.run;
    const exactUpcomingEncounter =
      run.attackedServerId === sourceServerId && run.position?.kind === "ice";
    return exactUpcomingEncounter
      ? {
          productive: true,
          serverId: sourceServerId,
          value: 160,
          evidenceCode:
            "corp_rez_structured_ice_support_current_same_fort_encounter",
        }
      : {
          productive: false,
          serverId: sourceServerId,
          value: 0,
          evidenceCode:
            run.attackedServerId === sourceServerId
              ? "corp_rez_structured_ice_support_no_upcoming_same_fort_encounter"
              : "corp_rez_structured_ice_support_current_run_on_other_fort",
        };
  }

  return {
    productive: true,
    serverId: sourceServerId,
    value: 120,
    evidenceCode: `corp_rez_structured_ice_support_matches:${matchingIceIds.join(",")}`,
  };
}

export function corpConditionalRezSupportWithoutCurrentRouteEvidence(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  sourceCard: VisibleCard,
  scoreProjects: readonly CorpScoreProjectSignal[],
): string | undefined {
  if (!candidate.sourceDefinitionId) return undefined;
  const serverId = candidate.sourceCardInstanceId
    ? serverForInstalledCard(input, candidate.sourceCardInstanceId)
    : undefined;
  if (serverId) {
    const exactAssessment = corpExactCardRezSupportAssessment(
      input,
      candidate,
      sourceCard,
      serverId,
    );
    if (exactAssessment && !exactAssessment.productive) {
      return exactAssessment.evidenceCode;
    }
    if (
      exactAssessment?.productive === true &&
      !corpCardRoutePreservesScoreReserve(
        input,
        candidate,
        serverId,
        scoreProjects,
      ).preservesReserve
    ) {
      return "corp_rez_exact_card_support_breaks_score_reserve";
    }
  }
  const definition = CARD_DEFINITIONS_BY_ID[candidate.sourceDefinitionId];
  if (definition?.mechanics.includes("ice_install_cost_mod_server"))
    return "corp_rez_fort_ice_discount_has_no_same_fort_install_route";
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  if (
    hint?.effects?.some(
      (effect) =>
        effect.kind === "install_discount" &&
        effect.scope === "ice" &&
        effect.timing === "persistent",
    ) === true
  )
    return "corp_rez_ice_install_discount_has_no_engine_certified_post_rez_install_quote";
  if (
    hint?.effects?.some(
      (effect) =>
        effect.kind === "future_encounter_effect" &&
        effect.target === "ice.corp_hq_runpath_insert",
    ) === true
  ) {
    const futureEncounterServerId = candidate.sourceCardInstanceId
      ? serverForInstalledCard(input, candidate.sourceCardInstanceId)
      : undefined;
    if (!futureEncounterServerId)
      return "corp_rez_future_encounter_support_source_not_bound_to_fort";
    const assessment = corpFutureEncounterRezSupportAssessment(
      input,
      candidate,
      sourceCard,
      futureEncounterServerId,
    );
    return assessment?.productive ? undefined : assessment?.evidenceCode;
  }
  return undefined;
}
