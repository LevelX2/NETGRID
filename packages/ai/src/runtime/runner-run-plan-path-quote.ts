import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import {
  canBreakerDefinitionBreakIce,
  cardDefinitionStrength,
  creditsToBreakEndTheRunSubroutinesWithBreaker,
  endTheRunSubroutineCount,
  minimumCreditsToBreakEndTheRunSubroutines,
} from "../visible-run-analysis";
import { actionCreditCost } from "./action-cost";
import { currentEncounteredIceCard, currentRunRemainingIce } from "./current-encounter";
import {
  breakerIdForEncounterAction,
  pumpStrengthAmountForAction,
} from "./encounter-action";
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
  const remainingCurrentRunIce =
    activeRun && activeRun.position?.kind === "ice"
      ? currentRunRemainingIce(input)
      : [];
  const serverIce =
    activeRun && remainingCurrentRunIce.length > 0
      ? remainingCurrentRunIce
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
        quote.cheapestAccessPreservingSequence?.totalCost ??
          quote.breakerCoverage
            .map((coverage) => coverage.estimatedCost)
            .filter((cost): cost is number => cost !== undefined)
            .sort((left, right) => left - right)[0] ??
          0,
      ),
    0,
  );
  const reserveTarget = runnerRunPlanReserveTarget(plan);
  const expectedRemainingCredits = input.playerView.own.credits - totalKnownCost;
  const reserveViolation = expectedRemainingCredits < reserveTarget;
  const unknownVisibleIce = (server?.ice ?? []).some(
    (ice) => !ice.known || ice.rezzed === false,
  );
  const blockedQuote = iceQuotes.find(
    (quote) =>
      quote.known &&
      quote.rezzed !== false &&
      !quote.cheapestAccessPreservingSequence &&
      quote.subroutineQuotes.some(
        (subroutine) => subroutine.threatClass === "must_break_for_access",
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

function quoteIceEncounter(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  ice: VisibleCard;
  currentEncounter: boolean;
}): RunnerRunIceEncounterQuote {
  const { input, plan, ice, currentEncounter } = params;
  const subroutineQuotes = subroutineQuotesForIce(input, ice, currentEncounter);
  const breakerCoverage = breakerCoverageQuotesForIce(input, ice);
  const cheapestAccessPreservingSequence = currentEncounter
    ? cheapestCurrentEncounterSequence({ input, plan, ice })
    : cheapestKnownIceSequence({ input, plan, ice });
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
          cheapestSafeSequence: cheapestAccessPreservingSequence,
        }
      : {}),
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
  const endRunThreatCount = currentEndTheRunThreatCount(input, ice);
  if (endRunThreatCount <= 0) {
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
    endRunThreatCount,
  });
  const pumpBreak = cheapestPumpBreakSequence({
    input,
    plan,
    ice,
    endRunThreatCount,
  });
  return [directBreak, pumpBreak]
    .filter(
      (sequence): sequence is RunnerRunEncounterActionSequence =>
        sequence !== undefined,
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
  endRunThreatCount: number;
}): RunnerRunEncounterActionSequence | undefined {
  const { input, plan, ice, endRunThreatCount } = params;
  const directBreakActions = breakActionsForIce(input, ice);
  if (directBreakActions.length === 0) return undefined;
  const selectedBreakActions = directBreakActions.slice(0, endRunThreatCount);
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
      "current_encounter_direct_break_sequence:true",
      `break_action_count:${selectedBreakActions.length}`,
    ],
    plan,
    input,
  });
}

function cheapestPumpBreakSequence(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  ice: VisibleCard;
  endRunThreatCount: number;
}): RunnerRunEncounterActionSequence | undefined {
  const { input, plan, ice, endRunThreatCount } = params;
  if (!ice.definitionId) return undefined;
  const candidates = input.legalActions
    .filter((action) => action.type === "pump_breaker")
    .map((pumpAction) =>
      pumpBreakSequenceForAction({
        input,
        plan,
        ice,
        pumpAction,
        endRunThreatCount,
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
  endRunThreatCount: number;
}): RunnerRunEncounterActionSequence | undefined {
  const { input, plan, ice, pumpAction, endRunThreatCount } = params;
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
  const currentStrength = breaker.strength ?? cardDefinitionStrength(breaker.definitionId);
  const requiredPumps = Math.max(
    1,
    Math.ceil(Math.max(0, requiredStrength - currentStrength) / pumpAmount),
  );
  const strengthAfterPumps = currentStrength + requiredPumps * pumpAmount;
  const postPumpBreakCost =
    creditsToBreakEndTheRunSubroutinesWithBreaker(
      breaker,
      iceBreakEstimateInput(ice, requiredStrength),
      endRunThreatCount,
      strengthAfterPumps,
      ice.effectiveRunQuote?.breakSubroutineAdditionalCostPerSubroutine ?? 0,
    )?.cost;
  if (postPumpBreakCost === undefined) return undefined;
  const totalPumpCost = requiredPumps * pumpCost;
  const totalCost = totalPumpCost + postPumpBreakCost;
  const pumpSteps = Array.from({ length: requiredPumps }, () => pumpAction);
  const currentBreakSteps = breakActionsForBreakerAndIce(input, breakerId, ice);
  const selectedBreakSteps =
    currentBreakSteps.length > 0 ? currentBreakSteps.slice(0, endRunThreatCount) : [];
  return sequenceForActions({
    actions: [...pumpSteps, ...selectedBreakSteps],
    totalCost,
    usesPump: true,
    usesBreak: true,
    riskTags:
      selectedBreakSteps.length === 0
        ? ["break_action_expected_after_pump"]
        : [],
    evidence: [
      "current_encounter_pump_break_sequence:true",
      `breaker:${breaker.instanceId}`,
      `pump_required_count:${requiredPumps}`,
      `pump_total_cost:${totalPumpCost}`,
      `break_estimated_cost_after_pump:${postPumpBreakCost}`,
    ],
    plan,
    input,
  });
}

function sequenceForActions(params: {
  actions: readonly LegalAction[];
  totalCost: number;
  usesPump: boolean;
  usesBreak: boolean;
  riskTags?: string[];
  evidence: string[];
  plan: RunnerRunPlan;
  input: AiDecisionInput;
}): RunnerRunEncounterActionSequence {
  const reserveTarget = runnerRunPlanReserveTarget(params.plan);
  const violatesReserve =
    params.input.playerView.own.credits - params.totalCost < reserveTarget;
  return {
    steps: params.actions.map(legalActionRef),
    totalCost: params.totalCost,
    usesPump: params.usesPump,
    usesBreak: params.usesBreak,
    usesBypass: false,
    usesPrevention: false,
    preservesAccessObjective: !violatesReserve,
    violatesReserve,
    riskTags: params.riskTags ?? [],
    evidence: [
      ...params.evidence,
      `sequence_total_cost:${params.totalCost}`,
      `sequence_reserve_target:${reserveTarget}`,
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
              ice.effectiveRunQuote?.breakSubroutineAdditionalCostPerSubroutine ?? 0,
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
  if (quoteSubroutines.length > 0) {
    return quoteSubroutines.map((subroutine, index) => ({
      index,
      threatClass: allBroken
        ? "irrelevant_to_current_plan"
        : threatClassForSubroutine(subroutine),
      broken: allBroken,
      evidence: [`subroutine_type:${subroutine.type}`],
    }));
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

function threatClassForSubroutine(
  subroutine: NonNullable<VisibleCard["effectiveRunQuote"]>["subroutines"][number],
): RunnerRunSubroutineThreatClass {
  if (subroutine.type === "end_the_run") return "must_break_for_access";
  if (subroutine.unbrokenRunEffect?.causesDamageOrProgramTrash === true) {
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

function encounterContinueAction(input: AiDecisionInput): LegalAction | undefined {
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
  return ice.definitionId ? cardDefinitionStrength(ice.definitionId) : undefined;
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
