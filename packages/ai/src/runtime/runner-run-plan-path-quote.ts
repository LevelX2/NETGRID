import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

import {
  canBreakerDefinitionBreakIce,
  cardDefinitionStrength,
  creditsToBreakEndTheRunSubroutinesWithBreaker,
  endTheRunSubroutineCount,
  minimumCreditsToBreakEndTheRunSubroutines,
} from "../visible-run-analysis";
import { actionCreditCost } from "./action-cost";
import {
  currentEncounteredIceCard,
  currentRunRemainingIce,
} from "./current-encounter";
import {
  isEndRunSubroutine,
  isImmediateSafetyThreatSubroutine,
} from "./encounter-subroutine";
import {
  breakerIdForEncounterAction,
  pumpStrengthAmountForAction,
} from "./encounter-action";
import {
  encounterRunRemainderEffectAssessment,
  type EncounterRunRemainderEffectAssessment,
} from "./runner-run-remainder-effect-assessment";
import { breakSubroutineIndexesForAction } from "./subroutine-indexes";
import { findVisibleCard } from "./visible-card-lookup";
import type {
  RunnerRunBreakerCoverageQuote,
  RunnerRunEncounterActionSequence,
  RunnerRunIceEncounterQuote,
  RunnerRunModifierQuote,
  RunnerRunPathQuote,
  RunnerRunPlan,
  RunnerRunPlanServerId,
  RunnerRunSubroutineQuote,
  RunnerRunSubroutineThreatClass,
} from "./runner-run-plan-types";
import {
  runnerEncounterPaymentForActions,
  spendRunnerEncounterBreakerCost,
} from "./runner-encounter-credit-budget";

export function quoteRunnerRunPath(
  input: AiDecisionInput,
  plan: RunnerRunPlan,
): RunnerRunPathQuote {
  const serverId = plan.targetServer.id;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server && !input.playerView.run) {
    return {
      ...plan.pathQuote,
      server: plan.targetServer.id,
      quoteStatus:
        plan.pathQuote.quoteStatus === "known_complete"
          ? "partially_known"
          : plan.pathQuote.quoteStatus,
      cannotReachReason:
        plan.pathQuote.cannotReachReason ?? "target_server_not_visible",
    };
  }

  const activeRun = input.playerView.run;
  const activeRunTargetsPlan =
    activeRun?.attackedServerId === plan.targetServer.id;
  const currentEncounter =
    activeRun?.phase === "encounter_ice"
      ? currentEncounteredIceCard(input)
      : undefined;
  const currentQuote = currentEncounter
    ? quoteIceEncounter({
        input,
        plan,
        ice: currentEncounter,
        currentEncounter: true,
      })
    : undefined;
  const currentIceInstanceId = currentEncounter?.instanceId;
  const remainingActiveRunIce =
    activeRunTargetsPlan && activeRun.position?.kind === "ice"
      ? activeRunRemainingPathIce(input, server?.ice ?? [])
      : undefined;
  const serverIce =
    activeRunTargetsPlan && activeRun.position?.kind === "server"
      ? []
      : activeRunTargetsPlan && activeRun.phase === "access"
        ? []
        : remainingActiveRunIce !== undefined
          ? remainingActiveRunIce
          : (server?.ice ?? []);
  const otherIceQuotes = serverIce
    .filter((ice) => ice.instanceId !== currentIceInstanceId)
    .map((ice) =>
      quoteIceEncounter({ input, plan, ice, currentEncounter: false }),
    );
  const iceQuotes = [currentQuote, ...otherIceQuotes].filter(
    (quote): quote is RunnerRunIceEncounterQuote => quote !== undefined,
  );
  const totalKnownCost = iceQuotes.reduce(
    (sum, quote) =>
      sum +
      Math.max(
        0,
        quote.cheapestAccessPreservingSequence?.cashCost ??
          quote.breakerCoverage
            .map((coverage) => coverage.estimatedCost)
            .filter((cost): cost is number => cost !== undefined)
            .sort((left, right) => left - right)[0] ??
          0,
      ),
    0,
  );
  const reserveTarget = runnerRunPlanReserveTarget(plan);
  const expectedRemainingCredits =
    input.playerView.own.credits - totalKnownCost;
  const reserveViolation = expectedRemainingCredits < reserveTarget;
  const unknownVisibleIce = (server?.ice ?? []).some(
    (ice) => !ice.known || ice.rezzed === false,
  );
  const blockedQuote = iceQuotes.find(
    (quote) =>
      quote.known &&
      quote.rezzed !== false &&
      !quote.cheapestAccessPreservingSequence &&
      quote.subroutineQuotes.some((subroutine) =>
        subroutineRequiresBreak(subroutine.threatClass),
      ),
  );
  const canReachAccess = !blockedQuote && !reserveViolation;
  return {
    server: serverId,
    quoteStatus: unknownVisibleIce ? "partially_known" : "known_complete",
    iceQuotes,
    totalKnownCost,
    expectedUnknownCost: 0,
    expectedRemainingCredits,
    reserveViolation,
    canReachAccess,
    ...(!canReachAccess
      ? {
          cannotReachReason: blockedQuote
            ? "known_ice_unbreakable"
            : "insufficient_credits_after_reserve",
        }
      : {}),
    requiredSequences: iceQuotes
      .map((quote) => quote.cheapestAccessPreservingSequence)
      .filter(
        (sequence): sequence is RunnerRunEncounterActionSequence =>
          sequence !== undefined,
      ),
  };
}

function activeRunRemainingPathIce(
  input: AiDecisionInput,
  serverIce: readonly VisibleCard[],
): VisibleCard[] {
  const run = input.playerView.run;
  if (!run || run.position?.kind !== "ice") return [];
  if (run.phase === "encounter_ice") {
    return currentRunRemainingIce(input);
  }
  const currentOrApproachedIceIndex = Math.max(0, run.position.iceIndex);
  return serverIce.slice(0, currentOrApproachedIceIndex + 1);
}

export function runnerRunPlanCurrentEncounterSequence(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
}): RunnerRunEncounterActionSequence | undefined {
  return quoteRunnerRunPath(params.input, params.plan).iceQuotes.find(
    (quote) =>
      quote.iceRef.instanceId ===
      currentEncounteredIceCard(params.input)?.instanceId,
  )?.cheapestAccessPreservingSequence;
}

export function runnerRunPlanCurrentEncounterSafeSequence(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
}): RunnerRunEncounterActionSequence | undefined {
  return quoteRunnerRunPath(params.input, params.plan).iceQuotes.find(
    (quote) =>
      quote.iceRef.instanceId ===
      currentEncounteredIceCard(params.input)?.instanceId,
  )?.cheapestSafeSequence;
}

export function runnerRunPlanCurrentEncounterRequiresBreak(params: {
  input: AiDecisionInput;
}): boolean {
  const currentEncounter = currentEncounteredIceCard(params.input);
  return currentEncounter
    ? currentRequiredBreakSubroutineIndexes(params.input, currentEncounter)
        .size > 0
    : false;
}

function quoteIceEncounter(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  ice: VisibleCard;
  currentEncounter: boolean;
}): RunnerRunIceEncounterQuote {
  const { input, plan, ice, currentEncounter } = params;
  const subroutineQuotes = subroutineQuotesForIce(input, ice, currentEncounter);
  const breakerCoverage = breakerCoverageQuotesForIce(input, ice);
  const quotedSequence = currentEncounter
    ? cheapestCurrentEncounterSequence({ input, plan, ice })
    : cheapestKnownIceSequence({ input, plan, ice });
  const cheapestAccessPreservingSequence =
    quotedSequence?.preservesAccessObjective === true
      ? quotedSequence
      : undefined;
  const cheapestSafeSequence = currentEncounter
    ? cheapestCurrentSafetySequence({ input, plan, ice })
    : undefined;
  const effectiveStrength = effectiveIceStrength(ice);
  return {
    iceRef: {
      instanceId: ice.instanceId,
      ...(ice.definitionId ? { definitionId: ice.definitionId } : {}),
    },
    known: ice.known,
    rezzed: ice.rezzed === true,
    ...(ice.title ? { visibleName: ice.title } : {}),
    visibleSubtypes: ice.subtypes ?? [],
    ...(effectiveStrength !== undefined ? { effectiveStrength } : {}),
    subroutineQuotes,
    breakerCoverage,
    ...(cheapestAccessPreservingSequence
      ? {
          cheapestAccessPreservingSequence,
        }
      : {}),
    ...(cheapestSafeSequence ? { cheapestSafeSequence } : {}),
    bypassOptions: [],
    postEncounterModifiers: modifierQuotesForIce(ice),
  };
}

function cheapestCurrentEncounterSequence(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  ice: VisibleCard;
}): RunnerRunEncounterActionSequence | undefined {
  const { input, plan, ice } = params;
  if (!ice.known || !ice.definitionId) return undefined;
  const futurePathAssessment = encounterRunRemainderEffectAssessment(input);
  const requiredSubroutineIndexes = currentRequiredBreakSubroutineIndexes(
    input,
    ice,
    futurePathAssessment,
  );
  const futurePathEvidence =
    futurePathModifierRequiredEvidence(futurePathAssessment);
  if (requiredSubroutineIndexes.size <= 0) {
    const continueAction = encounterContinueAction(input);
    if (!continueAction) return undefined;
    return sequenceForActions({
      actions: [continueAction],
      totalCost: actionCreditCost(continueAction),
      usesPump: false,
      usesBreak: false,
      evidence: ["encounter_no_etr_break_required:true"],
      plan,
      input,
    });
  }

  const directBreak = cheapestDirectBreakSequence({
    input,
    plan,
    ice,
    requiredSubroutineIndexes,
    evidence: futurePathEvidence,
  });
  const pumpBreak = cheapestPumpBreakSequence({
    input,
    plan,
    ice,
    requiredSubroutineIndexes,
    evidence: futurePathEvidence,
  });
  return [directBreak, pumpBreak]
    .filter(
      (sequence): sequence is RunnerRunEncounterActionSequence =>
        sequence !== undefined && sequence.preservesAccessObjective,
    )
    .sort(
      (left, right) =>
        left.totalCost - right.totalCost ||
        (left.usesPump === right.usesPump ? 0 : left.usesPump ? 1 : -1),
    )[0];
}

function cheapestCurrentSafetySequence(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  ice: VisibleCard;
}): RunnerRunEncounterActionSequence | undefined {
  const { input, plan, ice } = params;
  if (!ice.known || !ice.definitionId) return undefined;
  const requiredSubroutineIndexes = currentSafetyBreakSubroutineIndexes(
    input,
    ice,
  );
  if (requiredSubroutineIndexes.size <= 0) return undefined;
  const directBreak = cheapestDirectBreakSequence({
    input,
    plan,
    ice,
    requiredSubroutineIndexes,
    preservesAccessObjective: false,
    evidence: ["current_encounter_safety_break_sequence:true"],
  });
  const pumpBreak = cheapestPumpBreakSequence({
    input,
    plan,
    ice,
    requiredSubroutineIndexes,
    preservesAccessObjective: false,
    evidence: ["current_encounter_safety_break_sequence:true"],
  });
  return [directBreak, pumpBreak]
    .filter(
      (sequence): sequence is RunnerRunEncounterActionSequence =>
        sequence !== undefined && !sequence.violatesReserve,
    )
    .sort(
      (left, right) =>
        left.totalCost - right.totalCost ||
        (left.usesPump === right.usesPump ? 0 : left.usesPump ? 1 : -1),
    )[0];
}

function cheapestKnownIceSequence(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  ice: VisibleCard;
}): RunnerRunEncounterActionSequence | undefined {
  const { input, plan, ice } = params;
  if (!ice.known || ice.rezzed === false || !ice.definitionId) return undefined;
  const endRunThreatCount = endTheRunSubroutineCount(ice.definitionId);
  if (endRunThreatCount <= 0) return undefined;
  const assessment = minimumCreditsToBreakEndTheRunSubroutines(
    iceBreakEstimateInput(ice),
    input.playerView.own.rig ?? [],
    endRunThreatCount,
    new Map(),
    ice.effectiveRunQuote?.breakSubroutineAdditionalCostPerSubroutine ?? 0,
  );
  if (!assessment) return undefined;
  return sequenceForActions({
    actions: [],
    totalCost: assessment.cost,
    estimatedBreakCost: assessment.cost,
    estimatedBreakBreakerId: assessment.breakerInstanceId,
    usesPump: false,
    usesBreak: true,
    evidence: [
      "known_ice_estimated_break_sequence:true",
      `breaker:${assessment.breakerInstanceId}`,
    ],
    plan,
    input,
  });
}

function cheapestDirectBreakSequence(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  ice: VisibleCard;
  requiredSubroutineIndexes: ReadonlySet<number>;
  preservesAccessObjective?: boolean;
  evidence?: string[];
}): RunnerRunEncounterActionSequence | undefined {
  const { input, plan, ice, requiredSubroutineIndexes } = params;
  const selectedBreakActions = selectBreakActionsForRequiredSubroutines(
    breakActionsForIce(input, ice),
    requiredSubroutineIndexes,
  );
  if (!selectedBreakActions) return undefined;
  const totalCost = selectedBreakActions.reduce(
    (sum, action) => sum + actionCreditCost(action),
    0,
  );
  return sequenceForActions({
    actions: selectedBreakActions,
    totalCost,
    usesPump: false,
    usesBreak: true,
    evidence: [
      ...(params.evidence ?? []),
      "current_encounter_direct_break_sequence:true",
      `break_action_count:${selectedBreakActions.length}`,
      `required_subroutine_indexes:${formatSubroutineIndexes(requiredSubroutineIndexes)}`,
    ],
    ...(params.preservesAccessObjective !== undefined
      ? { preservesAccessObjective: params.preservesAccessObjective }
      : {}),
    plan,
    input,
  });
}

function cheapestPumpBreakSequence(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  ice: VisibleCard;
  requiredSubroutineIndexes: ReadonlySet<number>;
  preservesAccessObjective?: boolean;
  evidence?: string[];
}): RunnerRunEncounterActionSequence | undefined {
  const { input, plan, ice, requiredSubroutineIndexes } = params;
  if (!ice.definitionId) return undefined;
  const candidates = input.legalActions
    .filter((action) => action.type === "pump_breaker")
    .map((pumpAction) =>
      pumpBreakSequenceForAction({
        input,
        plan,
        ice,
        pumpAction,
        requiredSubroutineIndexes,
        ...(params.preservesAccessObjective !== undefined
          ? { preservesAccessObjective: params.preservesAccessObjective }
          : {}),
        ...(params.evidence !== undefined ? { evidence: params.evidence } : {}),
      }),
    )
    .filter(
      (sequence): sequence is RunnerRunEncounterActionSequence =>
        sequence !== undefined,
    )
    .sort(
      (left, right) =>
        left.totalCost - right.totalCost ||
        left.steps[0]?.actionId.localeCompare(right.steps[0]?.actionId ?? "") ||
        0,
    );
  return candidates[0];
}

function pumpBreakSequenceForAction(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  ice: VisibleCard;
  pumpAction: LegalAction;
  requiredSubroutineIndexes: ReadonlySet<number>;
  preservesAccessObjective?: boolean;
  evidence?: string[];
}): RunnerRunEncounterActionSequence | undefined {
  const { input, plan, ice, pumpAction, requiredSubroutineIndexes } = params;
  const breakerId = breakerIdForEncounterAction(pumpAction);
  if (!breakerId || !ice.definitionId) return undefined;
  if (
    typeof pumpAction.payload?.iceId === "string" &&
    pumpAction.payload.iceId !== ice.instanceId
  ) {
    return undefined;
  }
  const breaker = findVisibleCard(input, breakerId);
  if (!breaker?.definitionId) return undefined;
  if (!canBreakerDefinitionBreakIce(breaker.definitionId, ice.definitionId)) {
    return undefined;
  }
  const pumpAmount = pumpStrengthAmountForAction(
    pumpAction,
    breaker.definitionId,
  );
  const pumpCost = actionCreditCost(pumpAction);
  if (pumpAmount <= 0 || pumpCost < 0) return undefined;
  const requiredStrength = effectiveIceStrength(ice) ?? 0;
  const currentStrength =
    breaker.strength ?? cardDefinitionStrength(breaker.definitionId);
  const requiredPumps = Math.max(
    1,
    Math.ceil(Math.max(0, requiredStrength - currentStrength) / pumpAmount),
  );
  const strengthAfterPumps = currentStrength + requiredPumps * pumpAmount;
  const postPumpBreakCost = creditsToBreakEndTheRunSubroutinesWithBreaker(
    breaker,
    iceBreakEstimateInput(ice, requiredStrength),
    requiredSubroutineIndexes.size,
    strengthAfterPumps,
    ice.effectiveRunQuote?.breakSubroutineAdditionalCostPerSubroutine ?? 0,
  )?.cost;
  if (postPumpBreakCost === undefined) return undefined;
  const totalPumpCost = requiredPumps * pumpCost;
  const totalCost = totalPumpCost + postPumpBreakCost;
  const pumpSteps = Array.from({ length: requiredPumps }, () => pumpAction);
  const selectedBreakSteps =
    selectBreakActionsForRequiredSubroutines(
      breakActionsForBreakerAndIce(input, breakerId, ice),
      requiredSubroutineIndexes,
    ) ?? [];
  return sequenceForActions({
    actions: [...pumpSteps, ...selectedBreakSteps],
    totalCost,
    estimatedBreakCost: postPumpBreakCost,
    estimatedBreakBreakerId: breakerId,
    usesPump: true,
    usesBreak: true,
    riskTags:
      selectedBreakSteps.length === 0
        ? ["break_action_expected_after_pump"]
        : [],
    evidence: [
      ...(params.evidence ?? []),
      "current_encounter_pump_break_sequence:true",
      `breaker:${breaker.instanceId}`,
      `pump_required_count:${requiredPumps}`,
      `pump_total_cost:${totalPumpCost}`,
      `break_estimated_cost_after_pump:${postPumpBreakCost}`,
      `required_subroutine_indexes:${formatSubroutineIndexes(requiredSubroutineIndexes)}`,
    ],
    ...(params.preservesAccessObjective !== undefined
      ? { preservesAccessObjective: params.preservesAccessObjective }
      : {}),
    plan,
    input,
  });
}

function sequenceForActions(params: {
  actions: readonly LegalAction[];
  totalCost: number;
  estimatedBreakCost?: number;
  estimatedBreakBreakerId?: string;
  preservesAccessObjective?: boolean;
  usesPump: boolean;
  usesBreak: boolean;
  riskTags?: string[];
  evidence: string[];
  plan: RunnerRunPlan;
  input: AiDecisionInput;
}): RunnerRunEncounterActionSequence {
  const reserveTarget = runnerRunPlanReserveTarget(params.plan);
  const payment =
    params.actions.length > 0
      ? runnerEncounterPaymentForActions(params.input, params.actions)
      : undefined;
  const concreteActionCost = params.actions.reduce(
    (sum, action) => sum + actionCreditCost(action),
    0,
  );
  const estimatedRemainingCost = Math.max(
    0,
    Math.max(0, params.totalCost) - concreteActionCost,
  );
  const estimatedPayment =
    estimatedRemainingCost > 0
      ? spendRunnerEncounterBreakerCost({
          input: params.input,
          breakerId: params.estimatedBreakBreakerId,
          budget: payment?.budget ?? {
            credits: params.input.playerView.own.credits,
            icebreakerCredits: 0,
            nonNoisyIcebreakerCredits: 0,
            killerCredits: 0,
          },
          cost: estimatedRemainingCost,
        })
      : undefined;
  const cashCost = (payment?.cashCost ?? 0) + (estimatedPayment?.cashCost ?? 0);
  const restrictedSpent =
    (payment?.restrictedSpent ?? 0) + (estimatedPayment?.restrictedSpent ?? 0);
  const affordable =
    (payment?.affordable ?? true) && (estimatedPayment?.affordable ?? true);
  const creditsAfterSequence =
    estimatedPayment?.creditsAfterPayment ??
    payment?.creditsAfterPayment ??
    params.input.playerView.own.credits - cashCost;
  const violatesReserve = creditsAfterSequence < reserveTarget;
  return {
    steps: params.actions.map(legalActionRef),
    totalCost: params.totalCost,
    cashCost,
    restrictedCreditCost: restrictedSpent,
    creditsAfterSequence,
    usesPump: params.usesPump,
    usesBreak: params.usesBreak,
    usesBypass: false,
    usesPrevention: false,
    preservesAccessObjective:
      (params.preservesAccessObjective ?? true) &&
      affordable &&
      !violatesReserve,
    violatesReserve: !affordable || violatesReserve,
    riskTags: [
      ...(params.riskTags ?? []),
      ...(!affordable ? ["sequence_unaffordable"] : []),
    ],
    evidence: [
      ...params.evidence,
      `sequence_total_cost:${params.totalCost}`,
      `sequence_cash_cost:${cashCost}`,
      `sequence_restricted_credits_spent:${restrictedSpent}`,
      `sequence_credits_after:${creditsAfterSequence}`,
      `sequence_reserve_target:${reserveTarget}`,
      `sequence_affordable:${affordable}`,
      ...(estimatedRemainingCost > 0
        ? [`sequence_estimated_remaining_cost:${estimatedRemainingCost}`]
        : []),
    ],
  };
}

function legalActionRef(action: LegalAction) {
  return {
    actionId: action.actionId,
    actionType: action.type,
    source: action.source,
    cost: actionCreditCost(action),
  };
}

function breakerCoverageQuotesForIce(
  input: AiDecisionInput,
  ice: VisibleCard,
): RunnerRunBreakerCoverageQuote[] {
  if (!ice.definitionId) return [];
  return (input.playerView.own.rig ?? [])
    .filter((card) => card.known && card.definitionId)
    .map((breaker): RunnerRunBreakerCoverageQuote => {
      const canBreak = Boolean(
        breaker.definitionId &&
        canBreakerDefinitionBreakIce(breaker.definitionId, ice.definitionId!),
      );
      const endRunThreatCount = ice.definitionId
        ? endTheRunSubroutineCount(ice.definitionId)
        : 0;
      const assessment =
        canBreak && endRunThreatCount > 0
          ? creditsToBreakEndTheRunSubroutinesWithBreaker(
              breaker,
              iceBreakEstimateInput(ice),
              endRunThreatCount,
              breaker.strength ?? cardDefinitionStrength(breaker.definitionId),
              ice.effectiveRunQuote
                ?.breakSubroutineAdditionalCostPerSubroutine ?? 0,
            )
          : undefined;
      const currentStrength =
        breaker.strength ?? cardDefinitionStrength(breaker.definitionId);
      const requiredStrength = effectiveIceStrength(ice) ?? 0;
      return {
        breakerInstanceId: breaker.instanceId,
        ...(breaker.definitionId
          ? { breakerDefinitionId: breaker.definitionId }
          : {}),
        canBreak,
        requiresPump: canBreak && currentStrength < requiredStrength,
        ...(assessment ? { estimatedCost: assessment.cost } : {}),
        evidence: [
          `breaker_can_break:${canBreak}`,
          `breaker_current_strength:${currentStrength}`,
          `ice_required_strength:${requiredStrength}`,
        ],
      };
    });
}

function subroutineQuotesForIce(
  input: AiDecisionInput,
  ice: VisibleCard,
  currentEncounter: boolean,
): RunnerRunSubroutineQuote[] {
  const quoteSubroutines = ice.effectiveRunQuote?.subroutines ?? [];
  const allBroken =
    currentEncounter &&
    encounterContinueAction(input)?.payload?.unbrokenSubroutineCount === 0;
  const futurePathAssessment = currentEncounter
    ? encounterRunRemainderEffectAssessment(input)
    : undefined;
  if (quoteSubroutines.length > 0) {
    return quoteSubroutines.map((subroutine, index) => {
      const baseThreatClass = threatClassForSubroutine(subroutine);
      const threatClass = allBroken
        ? "irrelevant_to_current_plan"
        : currentThreatClassForSubroutine(subroutine, futurePathAssessment);
      return {
        index,
        threatClass,
        broken: allBroken,
        evidence: [
          `subroutine_type:${subroutine.type}`,
          ...(baseThreatClass === "future_path_modifier" &&
          threatClass === "must_break_for_access"
            ? ["subroutine_future_path_modifier_required:true"]
            : []),
        ],
      };
    });
  }
  if (!ice.definitionId) return [];
  return Array.from(
    { length: endTheRunSubroutineCount(ice.definitionId) },
    (_, index) => ({
      index,
      threatClass: allBroken
        ? "irrelevant_to_current_plan"
        : ("must_break_for_access" as const),
      broken: allBroken,
      evidence: ["subroutine_type:end_the_run"],
    }),
  );
}

function currentThreatClassForSubroutine(
  subroutine: NonNullable<
    VisibleCard["effectiveRunQuote"]
  >["subroutines"][number],
  futurePathAssessment: EncounterRunRemainderEffectAssessment | undefined,
): RunnerRunSubroutineThreatClass {
  const threatClass = threatClassForSubroutine(subroutine);
  if (
    threatClass === "future_path_modifier" &&
    futurePathAssessment?.mustBreak === true
  ) {
    return "must_break_for_access";
  }
  return threatClass;
}

function threatClassForSubroutine(
  subroutine: NonNullable<
    VisibleCard["effectiveRunQuote"]
  >["subroutines"][number],
): RunnerRunSubroutineThreatClass {
  if (isEndRunSubroutine(subroutine)) return "must_break_for_access";
  if (isImmediateSafetyThreatSubroutine(subroutine)) {
    return "must_break_for_survival";
  }
  if (
    subroutine.unbrokenRunEffect?.addsFutureEndTheRunSubroutines ||
    subroutine.unbrokenRunEffect?.increasesFutureBreakCostPerSubroutine ||
    subroutine.unbrokenRunEffect?.increasesFutureIceStrength ||
    subroutine.unbrokenRunEffect?.preventsFutureBreaking ||
    subroutine.unbrokenRunEffect?.addsFutureEncounterCost
  ) {
    return "future_path_modifier";
  }
  return "may_allow";
}

function subroutineRequiresBreak(
  threatClass: RunnerRunSubroutineThreatClass,
): boolean {
  return (
    threatClass === "must_break_for_access" ||
    threatClass === "must_break_for_survival"
  );
}

function modifierQuotesForIce(ice: VisibleCard): RunnerRunModifierQuote[] {
  return (ice.effectiveRunQuote?.subroutines ?? []).flatMap((subroutine) => {
    const effect = subroutine.unbrokenRunEffect;
    if (!effect) return [];
    const modifiers: RunnerRunModifierQuote[] = [];
    if (effect.increasesFutureIceStrength) {
      modifiers.push({
        kind: "future_ice_strength",
        value: effect.increasesFutureIceStrength,
        evidence: [`subroutine:${subroutine.id}`],
      });
    }
    if (effect.increasesFutureBreakCostPerSubroutine) {
      modifiers.push({
        kind: "future_break_cost",
        value: effect.increasesFutureBreakCostPerSubroutine,
        evidence: [`subroutine:${subroutine.id}`],
      });
    }
    if (effect.preventsJackOut) {
      modifiers.push({
        kind: "jack_out_limit",
        evidence: [`subroutine:${subroutine.id}`],
      });
    }
    if (effect.causesDamageOrProgramTrash) {
      modifiers.push({
        kind: "damage_or_trash",
        evidence: [`subroutine:${subroutine.id}`],
      });
    }
    return modifiers;
  });
}

function breakActionsForIce(
  input: AiDecisionInput,
  ice: VisibleCard,
): LegalAction[] {
  return input.legalActions
    .filter((action) => action.type === "break_subroutine")
    .filter((action) => actionTargetsIce(action, ice))
    .sort(
      (left, right) =>
        actionCreditCost(left) - actionCreditCost(right) ||
        left.actionId.localeCompare(right.actionId),
    );
}

function breakActionsForBreakerAndIce(
  input: AiDecisionInput,
  breakerId: string,
  ice: VisibleCard,
): LegalAction[] {
  return breakActionsForIce(input, ice).filter(
    (action) => breakerIdForEncounterAction(action) === breakerId,
  );
}

function selectBreakActionsForRequiredSubroutines(
  actions: readonly LegalAction[],
  requiredSubroutineIndexes: ReadonlySet<number>,
): LegalAction[] | undefined {
  const remaining = new Set(requiredSubroutineIndexes);
  const selected: LegalAction[] = [];
  while (remaining.size > 0) {
    const candidate = actions
      .map((action) => ({
        action,
        coveredIndexes: breakActionCoveredRequiredIndexes(action, remaining),
      }))
      .filter((candidate) => candidate.coveredIndexes.size > 0)
      .sort(
        (left, right) =>
          right.coveredIndexes.size - left.coveredIndexes.size ||
          actionCreditCost(left.action) - actionCreditCost(right.action) ||
          breakSubroutineIndexesForAction(right.action).size -
            breakSubroutineIndexesForAction(left.action).size ||
          left.action.actionId.localeCompare(right.action.actionId),
      )[0];
    if (!candidate) return undefined;
    selected.push(candidate.action);
    for (const index of candidate.coveredIndexes) remaining.delete(index);
  }
  return selected;
}

function breakActionCoveredRequiredIndexes(
  action: LegalAction,
  remainingRequiredIndexes: ReadonlySet<number>,
): Set<number> {
  const indexes = breakSubroutineIndexesForAction(action);
  if (indexes.size === 0) {
    return remainingRequiredIndexes.size === 1
      ? new Set(remainingRequiredIndexes)
      : new Set();
  }
  return new Set(
    [...indexes].filter((index) => remainingRequiredIndexes.has(index)),
  );
}

function actionTargetsIce(action: LegalAction, ice: VisibleCard): boolean {
  return (
    typeof action.payload?.iceId !== "string" ||
    action.payload.iceId === ice.instanceId
  );
}

function currentEndTheRunThreatCount(
  input: AiDecisionInput,
  ice: VisibleCard,
): number {
  const continueAction = encounterContinueAction(input);
  const printedEndRunCount = ice.definitionId
    ? endTheRunSubroutineCount(ice.definitionId)
    : 0;
  const quotedEndRunCount =
    ice.effectiveRunQuote?.subroutines.filter(
      (subroutine) => subroutine.type === "end_the_run",
    ).length ?? printedEndRunCount;
  const unbrokenCount =
    typeof continueAction?.payload?.unbrokenSubroutineCount === "number"
      ? continueAction.payload.unbrokenSubroutineCount
      : undefined;
  if (unbrokenCount === 0) return 0;
  if (continueAction?.payload?.encounterWillEndRun === true) {
    if (unbrokenCount !== undefined && quotedEndRunCount > 0) {
      return Math.min(unbrokenCount, quotedEndRunCount);
    }
    return quotedEndRunCount || unbrokenCount || 1;
  }
  return quotedEndRunCount;
}

function currentRequiredBreakSubroutineIndexes(
  input: AiDecisionInput,
  ice: VisibleCard,
  futurePathAssessment:
    | EncounterRunRemainderEffectAssessment
    | undefined = encounterRunRemainderEffectAssessment(input),
): Set<number> {
  const continueAction = encounterContinueAction(input);
  const unbrokenCount =
    typeof continueAction?.payload?.unbrokenSubroutineCount === "number"
      ? continueAction.payload.unbrokenSubroutineCount
      : undefined;
  if (unbrokenCount === 0) return new Set();

  const quoteSubroutines = ice.effectiveRunQuote?.subroutines ?? [];
  if (quoteSubroutines.length > 0) {
    const continueWillEndRun =
      continueAction?.payload?.encounterWillEndRun === true;
    return new Set(
      quoteSubroutines.flatMap((subroutine, index) => {
        const threatClass = threatClassForSubroutine(subroutine);
        if (threatClass === "must_break_for_access") {
          return continueWillEndRun ? [index] : [];
        }
        if (threatClass === "must_break_for_survival") return [index];
        return threatClass === "future_path_modifier" &&
          futurePathAssessment?.mustBreak === true
          ? [index]
          : [];
      }),
    );
  }

  return new Set(
    Array.from(
      { length: currentEndTheRunThreatCount(input, ice) },
      (_, index) => index,
    ),
  );
}

function currentSafetyBreakSubroutineIndexes(
  input: AiDecisionInput,
  ice: VisibleCard,
): Set<number> {
  const continueAction = encounterContinueAction(input);
  const unbrokenCount =
    typeof continueAction?.payload?.unbrokenSubroutineCount === "number"
      ? continueAction.payload.unbrokenSubroutineCount
      : undefined;
  if (unbrokenCount === 0) return new Set();

  const quoteSubroutines = ice.effectiveRunQuote?.subroutines ?? [];
  if (quoteSubroutines.length > 0) {
    return new Set(
      quoteSubroutines.flatMap((subroutine, index) =>
        threatClassForSubroutine(subroutine) === "must_break_for_survival"
          ? [index]
          : [],
      ),
    );
  }
  return new Set();
}

function futurePathModifierRequiredEvidence(
  assessment: EncounterRunRemainderEffectAssessment,
): string[] {
  if (!assessment.mustBreak) return [];
  return [
    "current_encounter_future_path_modifier_required:true",
    ...assessment.evidence,
  ];
}

function formatSubroutineIndexes(indexes: ReadonlySet<number>): string {
  return [...indexes].sort((left, right) => left - right).join(",");
}

function encounterContinueAction(
  input: AiDecisionInput,
): LegalAction | undefined {
  return input.legalActions.find(
    (action) =>
      action.type === "continue_run" &&
      action.payload?.encounterContinue === true,
  );
}

function effectiveIceStrength(ice: VisibleCard): number | undefined {
  if (typeof ice.effectiveRunQuote?.effectiveStrength === "number") {
    return ice.effectiveRunQuote.effectiveStrength;
  }
  if (typeof ice.strength === "number") return ice.strength;
  return ice.definitionId
    ? cardDefinitionStrength(ice.definitionId)
    : undefined;
}

function iceBreakEstimateInput(
  ice: VisibleCard,
  strength = effectiveIceStrength(ice),
): { definitionId?: string; subtypes?: string[]; strength?: number } {
  return {
    ...(ice.definitionId ? { definitionId: ice.definitionId } : {}),
    ...(ice.subtypes ? { subtypes: ice.subtypes } : {}),
    ...(strength !== undefined ? { strength } : {}),
  };
}

function runnerRunPlanReserveTarget(plan: RunnerRunPlan): number {
  return Math.max(
    0,
    plan.reserve.minimumCreditsAfterRun,
    plan.reserve.preserveStealOrTrashCredits,
    plan.budget.reservedCreditsAfterRun,
    plan.budget.reservedCreditsForSteal,
    plan.budget.reservedCreditsForTrash,
  );
}

function unknownPathQuote(
  input: AiDecisionInput,
  plan: RunnerRunPlan,
  reason: string,
): RunnerRunPathQuote {
  return {
    server: plan.targetServer.id as RunnerRunPlanServerId,
    quoteStatus: "unknown",
    iceQuotes: [],
    totalKnownCost: 0,
    expectedUnknownCost: 0,
    expectedRemainingCredits: input.playerView.own.credits,
    reserveViolation: false,
    canReachAccess: false,
    cannotReachReason: reason,
    requiredSequences: [],
  };
}
