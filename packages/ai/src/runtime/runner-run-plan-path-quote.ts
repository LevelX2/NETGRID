import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
  VisibleEffectiveSubroutine,
} from "@netgrid/shared";

import { createAiHintsByCard } from "../ai-hints";
import {
  assessKnownRezzedIcePath,
  canBreakerDefinitionBreakIce,
  cardDefinitionStrength,
  creditsToBreakEndTheRunSubroutinesWithBreaker,
  endTheRunSubroutineCount,
  minimumCreditsToBreakEndTheRunSubroutines,
  runnerRunPathCreditBudgetWithVisiblePools,
  visibleDeflectorSubroutineCanResolve,
} from "../visible-run-analysis";
import { quoteRunnerRunRoute } from "../run-analysis/runner-run-route-quote";
import {
  traceBaseStrengthForVisibleSubroutine,
  traceSuccessEffectForVisibleSubroutine,
  visibleRunnerTraceSupport,
  visibleTraceAvoidanceForBaseStrength,
} from "../run-analysis/visible-run-hazards";
import { actionCreditCost } from "./action-cost";
import {
  currentEncounteredIceCard,
  currentRunRemainingIce,
} from "./current-encounter";
import {
  isEndRunSubroutine,
  isImmediateSafetyThreatSubroutine,
  isProgramTrashThreatSubroutine,
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
  runnerEncounterCreditBudgetForInput,
  runnerEncounterPaymentForActions,
  spendRunnerEncounterBreakerCost,
} from "./runner-encounter-credit-budget";
import { runnerRunPlanAcceptsConditionalRoute } from "./runner-run-release";
import {
  isVisibleSecretSpendEndRunSubroutine,
  secretSpendAccessPaymentForVisibleCorpCredits,
} from "../run-analysis/visible-subroutine-semantics";

const AI_HINTS_BY_CARD = createAiHintsByCard();

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
  const totalKnownGrossCost = iceQuotes.reduce(
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
  const encounterBudget = runnerEncounterCreditBudgetForInput(input);
  const restrictedCreditPotential = iceQuotes.reduce(
    (sum, quote) =>
      sum + (quote.cheapestAccessPreservingSequence?.restrictedCreditCost ?? 0),
    0,
  );
  const availableRestrictedCredits =
    encounterBudget.runOnlyCredits +
    encounterBudget.icebreakerCredits +
    encounterBudget.nonNoisyIcebreakerCredits +
    encounterBudget.killerCredits +
    Object.values(
      encounterBudget.hostedIcebreakerCreditsByBreakerInstanceId,
    ).reduce((sum, amount) => sum + amount, 0);
  const totalKnownCost = Math.max(
    0,
    totalKnownGrossCost -
      Math.min(restrictedCreditPotential, availableRestrictedCredits),
  );
  const reserveTarget = runnerRunPlanReserveTarget(plan);
  const expectedRemainingCredits =
    input.playerView.own.credits - totalKnownCost;
  const reserveViolation = expectedRemainingCredits < reserveTarget;
  const unknownVisibleIce = serverIce.some(
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
  const sharedPathIce = currentEncounter
    ? [
        currentEncounter,
        ...serverIce.filter(
          (ice) => ice.instanceId !== currentEncounter.instanceId,
        ),
      ]
    : serverIce;
  const unknownIceCount = sharedPathIce.filter(
    (ice) => !ice.known || ice.rezzed === false,
  ).length;
  const sharedPathGeneralCredits =
    input.playerView.own.credits +
    Math.max(0, input.playerView.run?.badPublicityCredits ?? 0);
  const sharedPathAssessment = assessKnownRezzedIcePath(
    sharedPathIce,
    input.playerView.own.rig ?? [],
    runnerRunPathCreditBudgetWithVisiblePools(
      sharedPathGeneralCredits,
      input.playerView.own.rig ?? [],
    ),
    server?.root ?? [],
    input.playerView.opponent.credits,
    visibleDeflectorContextForInput(input),
  );
  const routeQuote = quoteRunnerRunRoute({
    path: sharedPathAssessment,
    availableCredits: sharedPathGeneralCredits,
    unknownIceCount,
    runnerGripCount: input.playerView.own.gripOrHq.length,
  });
  const canReachAccess =
    !blockedQuote &&
    !reserveViolation &&
    routeQuote.reachability !== "no_access";
  return {
    server: serverId,
    quoteStatus: unknownVisibleIce ? "partially_known" : "known_complete",
    iceQuotes,
    totalKnownCost,
    expectedUnknownCost: 0,
    expectedRemainingCredits,
    reserveViolation,
    canReachAccess,
    accessStatus: routeQuote.reachability,
    guaranteedKnownCost: routeQuote.guaranteedKnownCost,
    routeEffects: routeQuote.effects,
    conditionalReasons: routeQuote.conditionalReasons,
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
  if (params.input.playerView.run?.phase !== "encounter_ice") {
    return undefined;
  }
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
  if (params.input.playerView.run?.phase !== "encounter_ice") {
    return undefined;
  }
  return quoteRunnerRunPath(params.input, params.plan).iceQuotes.find(
    (quote) =>
      quote.iceRef.instanceId ===
      currentEncounteredIceCard(params.input)?.instanceId,
  )?.cheapestSafeSequence;
}

export function runnerRunPlanCurrentEncounterRequiresBreak(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
}): boolean {
  if (params.input.playerView.run?.phase !== "encounter_ice") {
    return false;
  }
  const currentEncounter = currentEncounteredIceCard(params.input);
  return currentEncounter
    ? currentRequiredBreakSubroutineIndexes(
        params.input,
        params.plan,
        currentEncounter,
      ).size > 0
    : false;
}

function quoteIceEncounter(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  ice: VisibleCard;
  currentEncounter: boolean;
}): RunnerRunIceEncounterQuote {
  const { input, plan, ice, currentEncounter } = params;
  const subroutineQuotes = subroutineQuotesForIce(
    input,
    plan,
    ice,
    currentEncounter,
  );
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
    plan,
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
      evidence: [
        "encounter_no_etr_break_required:true",
        "encounter_no_access_break_required:true",
      ],
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
  const traceRoute = cheapestTraceAccessSequence({
    input,
    plan,
    ice,
    requiredSubroutineIndexes,
    currentEncounter: true,
  });
  return [directBreak, pumpBreak, traceRoute]
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
    plan,
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
  const requiredSubroutineIndexes = knownRequiredSubroutineIndexes(input, ice);
  if (requiredSubroutineIndexes.size <= 0) {
    const secretSpendSubroutine = ice.effectiveRunQuote?.subroutines.find(
      isVisibleSecretSpendEndRunSubroutine,
    );
    const secretSpendCost = secretSpendSubroutine
      ? secretSpendAccessPaymentForVisibleCorpCredits(
          input.playerView.opponent.credits,
        )
      : undefined;
    return secretSpendCost === undefined
      ? undefined
      : sequenceForActions({
          actions: [],
          totalCost: secretSpendCost,
          usesPump: false,
          usesBreak: false,
          evidence: [
            "known_ice_secret_spend_access_payment:true",
            `secret_spend_access_payment:${secretSpendCost}`,
          ],
          plan,
          input,
        });
  }
  const accessThreatCount = requiredSubroutineIndexes.size;
  const assessment = minimumCreditsToBreakEndTheRunSubroutines(
    iceBreakEstimateInput(ice),
    input.playerView.own.rig ?? [],
    accessThreatCount,
    new Map(),
    ice.effectiveRunQuote?.breakSubroutineAdditionalCostPerSubroutine ?? 0,
  );
  const breakRoute = assessment
    ? sequenceForActions({
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
      })
    : undefined;
  const traceRoute = cheapestTraceAccessSequence({
    input,
    plan,
    ice,
    requiredSubroutineIndexes,
    currentEncounter: false,
  });
  return [breakRoute, traceRoute]
    .filter(
      (sequence): sequence is RunnerRunEncounterActionSequence =>
        sequence !== undefined && sequence.preservesAccessObjective,
    )
    .sort(
      (left, right) =>
        left.totalCost - right.totalCost ||
        (left.usesTrace === right.usesTrace ? 0 : left.usesTrace ? 1 : -1),
    )[0];
}

function cheapestTraceAccessSequence(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  ice: VisibleCard;
  requiredSubroutineIndexes: ReadonlySet<number>;
  currentEncounter: boolean;
}): RunnerRunEncounterActionSequence | undefined {
  const quote = params.ice.effectiveRunQuote;
  if (!quote || params.requiredSubroutineIndexes.size <= 0) return undefined;
  const requiredSubroutines = [...params.requiredSubroutineIndexes]
    .sort((left, right) => left - right)
    .map((index) => ({ index, subroutine: quote.subroutines[index] }))
    .filter(
      (
        entry,
      ): entry is {
        index: number;
        subroutine: VisibleEffectiveSubroutine;
      } => entry.subroutine !== undefined,
    );
  if (
    requiredSubroutines.length !== params.requiredSubroutineIndexes.size ||
    requiredSubroutines.some(
      ({ subroutine }) => subroutine.type !== "initiate_trace",
    )
  ) {
    return undefined;
  }

  const continueAction = params.currentEncounter
    ? encounterContinueAction(params.input)
    : undefined;
  if (params.currentEncounter && !continueAction) return undefined;
  let remainingGeneralCredits =
    params.input.playerView.own.credits +
    Math.max(0, params.input.playerView.run?.badPublicityCredits ?? 0);
  let guaranteedTraceCost = 0;
  const acceptedEffectTypes: string[] = [];
  for (const { index, subroutine } of requiredSubroutines) {
    const effect = traceSuccessEffectForVisibleSubroutine(
      quote,
      subroutine,
      index,
    );
    if (!traceEffectRequiresAccessGuarantee(params.input, effect)) {
      if (effect && effect.type !== "none")
        acceptedEffectTypes.push(effect.type);
      continue;
    }
    const baseStrength = traceBaseStrengthForVisibleSubroutine(
      quote,
      subroutine,
      index,
    );
    if (baseStrength === undefined) return undefined;
    const support = visibleRunnerTraceSupport(
      params.input.playerView.own.rig ?? [],
      remainingGeneralCredits,
    );
    const guarantee = visibleTraceAvoidanceForBaseStrength(
      baseStrength +
        visibleCorpTraceBidCapacity(
          params.ice.effectiveRunQuote,
          subroutine,
          params.input.playerView.opponent.credits,
        ),
      support,
    ).cheapestAffordableSafe;
    if (!guarantee) {
      if (!runnerRunPlanAcceptsConditionalRoute(params.plan)) return undefined;
      if (effect && effect.type !== "none") {
        acceptedEffectTypes.push(effect.type);
      }
      continue;
    }
    guaranteedTraceCost += guarantee.creditCost;
    remainingGeneralCredits = Math.max(
      0,
      remainingGeneralCredits - guarantee.creditCost,
    );
  }
  const actions = continueAction ? [continueAction] : [];
  return sequenceForActions({
    actions,
    totalCost:
      actions.reduce((sum, action) => sum + actionCreditCost(action), 0) +
      guaranteedTraceCost,
    usesPump: false,
    usesBreak: false,
    usesTrace: true,
    riskTags: acceptedEffectTypes.map(
      (effectType) => `accepted_visible_trace_effect:${effectType}`,
    ),
    evidence: [
      params.currentEncounter
        ? "current_encounter_trace_route:true"
        : "known_ice_estimated_trace_route:true",
      `trace_route_guaranteed_cost:${guaranteedTraceCost}`,
      `trace_route_visible_corp_trace_bid_capacity:${visibleCorpTraceBidCapacity(params.ice.effectiveRunQuote, requiredSubroutines[0]?.subroutine, params.input.playerView.opponent.credits)}`,
      ...acceptedEffectTypes.map(
        (effectType) => `trace_route_accepts_effect:${effectType}`,
      ),
    ],
    plan: params.plan,
    input: params.input,
  });
}

function visibleCorpTraceBidCapacity(
  quote: VisibleCard["effectiveRunQuote"] | undefined,
  subroutine: VisibleEffectiveSubroutine | undefined,
  visibleCorpCredits: number,
): number {
  const available =
    Math.max(0, Math.floor(visibleCorpCredits)) +
    Math.max(0, Math.floor(quote?.encounterTemporaryTraceCredits ?? 0));
  const bidLimit = subroutine?.traceBidLimit;
  return bidLimit === undefined
    ? available
    : Math.min(available, Math.max(0, Math.floor(bidLimit)));
}

function traceEffectRequiresAccessGuarantee(
  input: AiDecisionInput,
  effect: ReturnType<typeof traceSuccessEffectForVisibleSubroutine>,
): boolean {
  if (!effect || effect.type === "none") return false;
  switch (effect.type) {
    case "end_run_and_run_lock":
    case "end_run_trash_program_and_run_lock":
    case "end_run_trash_hardware_and_unpreventable_meat_damage":
      return true;
    case "net_damage":
      return effect.amount >= input.playerView.own.gripOrHq.length;
    default:
      return false;
  }
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
  usesTrace?: boolean;
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
          budget:
            payment?.budget ??
            runnerEncounterCreditBudgetForInput(params.input),
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
  const probeCreditLossBeforeSequence =
    params.plan.objective.kind === "probe_unknown_ice"
      ? Math.max(
          0,
          params.plan.budget.availableCredits -
            params.input.playerView.own.credits,
        )
      : 0;
  const projectedProbeCreditLoss = probeCreditLossBeforeSequence + cashCost;
  const probeEncounterHasImmediateSafetyThreat =
    currentEncounteredIceCard(
      params.input,
    )?.effectiveRunQuote?.subroutines.some(
      isImmediateSafetyThreatSubroutine,
    ) === true;
  const probeEncounterSafetyExceedsAcceptedDamage =
    params.plan.objective.kind === "probe_unknown_ice" &&
    probeSafetyThreatExceedsAcceptedDamage(params.input, params.plan);
  const probeCanConvertToFundedFullPath =
    params.plan.objective.kind === "probe_unknown_ice" &&
    !currentRunRemainingIce(params.input).some(
      (ice) => !ice.known || ice.rezzed !== true,
    ) &&
    params.plan.pathQuote.canReachAccess &&
    creditsAfterSequence >= Math.max(2, reserveTarget);
  const violatesProbeRiskBudget =
    params.plan.objective.kind === "probe_unknown_ice" &&
    projectedProbeCreditLoss > params.plan.objective.riskBudget.maxCreditLoss &&
    !probeCanConvertToFundedFullPath &&
    !probeEncounterSafetyExceedsAcceptedDamage;
  const violatesReserve =
    creditsAfterSequence < reserveTarget || violatesProbeRiskBudget;
  return {
    steps: params.actions.map(legalActionRef),
    totalCost: params.totalCost,
    cashCost,
    restrictedCreditCost: restrictedSpent,
    creditsAfterSequence,
    usesPump: params.usesPump,
    usesBreak: params.usesBreak,
    ...(params.usesTrace ? { usesTrace: true } : {}),
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
      ...(violatesProbeRiskBudget ? ["probe_credit_loss_budget_exceeded"] : []),
    ],
    evidence: [
      ...params.evidence,
      `sequence_total_cost:${params.totalCost}`,
      `sequence_cash_cost:${cashCost}`,
      `sequence_restricted_credits_spent:${restrictedSpent}`,
      `sequence_credits_after:${creditsAfterSequence}`,
      `sequence_reserve_target:${reserveTarget}`,
      `sequence_affordable:${affordable}`,
      ...(params.plan.objective.kind === "probe_unknown_ice"
        ? [
            `sequence_probe_credit_loss_before:${probeCreditLossBeforeSequence}`,
            `sequence_probe_credit_loss_projected:${projectedProbeCreditLoss}`,
            `sequence_probe_credit_loss_limit:${params.plan.objective.riskBudget.maxCreditLoss}`,
            `sequence_probe_immediate_safety_threat:${probeEncounterHasImmediateSafetyThreat}`,
            `sequence_probe_safety_exceeds_accepted_damage:${probeEncounterSafetyExceedsAcceptedDamage}`,
            `sequence_probe_full_path_conversion:${probeCanConvertToFundedFullPath}`,
            `sequence_probe_credit_loss_budget_exceeded:${violatesProbeRiskBudget}`,
          ]
        : []),
      ...(estimatedRemainingCost > 0
        ? [`sequence_estimated_remaining_cost:${estimatedRemainingCost}`]
        : []),
    ],
  };
}

function probeSafetyThreatExceedsAcceptedDamage(
  input: AiDecisionInput,
  plan: RunnerRunPlan,
): boolean {
  if (plan.objective.kind !== "probe_unknown_ice") return false;
  const immediateThreats =
    currentEncounteredIceCard(input)?.effectiveRunQuote?.subroutines.filter(
      isImmediateSafetyThreatSubroutine,
    ) ?? [];
  if (immediateThreats.length === 0) return false;
  const damageAmounts = immediateThreats.map(directVisibleDamageAmount);
  if (damageAmounts.some((amount) => amount === undefined)) return true;
  const totalDamage = damageAmounts.reduce<number>(
    (sum, amount) => sum + (amount ?? 0),
    0,
  );
  return (
    totalDamage > plan.objective.riskBudget.maxDamage ||
    totalDamage >= input.playerView.own.gripOrHq.length
  );
}

function directVisibleDamageAmount(
  subroutine: VisibleEffectiveSubroutine,
): number | undefined {
  const type = subroutine.type.toLowerCase();
  const damageTypeValue = (subroutine as { damageType?: unknown }).damageType;
  const damageType =
    typeof damageTypeValue === "string" ? damageTypeValue : undefined;
  const directDamage =
    type === "brain_damage" ||
    type === "core_damage" ||
    type === "do_brain_damage" ||
    type === "do_core_damage" ||
    type === "do_damage" ||
    damageType === "brain" ||
    damageType === "core";
  if (!directDamage) return undefined;
  return Math.max(1, Math.floor(subroutine.amount ?? 1));
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
      const accessThreatCount = accessPreservingThreatCount(input, ice);
      const assessment =
        canBreak && accessThreatCount > 0
          ? creditsToBreakEndTheRunSubroutinesWithBreaker(
              breaker,
              iceBreakEstimateInput(ice),
              accessThreatCount,
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
  plan: RunnerRunPlan,
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
      const baseThreatClass = threatClassForSubroutine(
        input,
        subroutine,
        currentEncounter ? plan : undefined,
      );
      const threatClass = allBroken
        ? "irrelevant_to_current_plan"
        : currentThreatClassForSubroutine(
            input,
            plan,
            subroutine,
            futurePathAssessment,
          );
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
          ...(threatClass === "irrelevant_to_current_plan" &&
          isProgramTrashThreatSubroutine(subroutine)
            ? ["program_run_end_self_trash_expendable:true"]
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
  input: AiDecisionInput,
  plan: RunnerRunPlan,
  subroutine: NonNullable<
    VisibleCard["effectiveRunQuote"]
  >["subroutines"][number],
  futurePathAssessment: EncounterRunRemainderEffectAssessment | undefined,
): RunnerRunSubroutineThreatClass {
  const threatClass = threatClassForSubroutine(input, subroutine, plan);
  if (
    threatClass === "future_path_modifier" &&
    futurePathAssessment?.mustBreak === true
  ) {
    return "must_break_for_access";
  }
  return threatClass;
}

function threatClassForSubroutine(
  input: AiDecisionInput,
  subroutine: NonNullable<
    VisibleCard["effectiveRunQuote"]
  >["subroutines"][number],
  plan?: RunnerRunPlan,
): RunnerRunSubroutineThreatClass {
  if (isEndRunSubroutine(subroutine)) return "must_break_for_access";
  if (
    visibleDeflectorSubroutineCanResolve(
      subroutine,
      visibleDeflectorContextForInput(input),
    )
  )
    return "must_break_for_access";
  if (
    plan &&
    isProgramTrashThreatSubroutine(subroutine) &&
    onlyInstalledProgramIsExpendableAtRunEnd(input, plan)
  ) {
    return "irrelevant_to_current_plan";
  }
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

function onlyInstalledProgramIsExpendableAtRunEnd(
  input: AiDecisionInput,
  plan: RunnerRunPlan,
): boolean {
  const installedPrograms = (input.playerView.own.rig ?? []).filter(
    (card) => card.type === "program",
  );
  if (installedPrograms.length !== 1) return false;
  const program = installedPrograms[0];
  if (!program?.definitionId) return false;
  const hint = AI_HINTS_BY_CARD.get(program.definitionId);
  const runEndSelfTrash =
    hint?.roles.includes("self_trash") === true &&
    hint.effects?.some(
      (effect) =>
        effect.kind === "delayed_penalty" &&
        effect.timing === "on_leave_play" &&
        effect.scope === "installed_program",
    ) === true;
  if (!runEndSelfTrash) {
    return false;
  }

  const futureIce = currentRunRemainingIce(input);
  if (futureIce.some((ice) => !ice.known || ice.rezzed === false)) {
    return false;
  }
  return !futureIce.some((ice) =>
    knownIceAccessSequenceUsesProgram(input, plan, ice, program.instanceId),
  );
}

function knownIceAccessSequenceUsesProgram(
  input: AiDecisionInput,
  plan: RunnerRunPlan,
  ice: VisibleCard,
  programInstanceId: string,
): boolean {
  const sequence = cheapestKnownIceSequence({ input, plan, ice });
  return sequence?.evidence?.includes(`breaker:${programInstanceId}`) === true;
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
  plan: RunnerRunPlan,
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
        if (
          visibleDeflectorSubroutineCanResolve(
            subroutine,
            visibleDeflectorContextForInput(input),
          )
        )
          return [index];
        const threatClass = threatClassForSubroutine(input, subroutine, plan);
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
  plan: RunnerRunPlan,
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
        threatClassForSubroutine(input, subroutine, plan) ===
        "must_break_for_survival"
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

function accessPreservingThreatCount(
  input: AiDecisionInput,
  ice: VisibleCard,
): number {
  const quoted = ice.effectiveRunQuote?.subroutines;
  if (quoted?.length) {
    return quoted.filter((subroutine) =>
      subroutineRequiresBreak(threatClassForSubroutine(input, subroutine)),
    ).length;
  }
  return ice.definitionId ? endTheRunSubroutineCount(ice.definitionId) : 0;
}

function knownRequiredSubroutineIndexes(
  input: AiDecisionInput,
  ice: VisibleCard,
): Set<number> {
  const quoted = ice.effectiveRunQuote?.subroutines;
  if (quoted?.length) {
    return new Set(
      quoted.flatMap((subroutine, index) =>
        subroutineRequiresBreak(threatClassForSubroutine(input, subroutine))
          ? [index]
          : [],
      ),
    );
  }
  return new Set(
    Array.from(
      {
        length: ice.definitionId
          ? endTheRunSubroutineCount(ice.definitionId)
          : 0,
      },
      (_, index) => index,
    ),
  );
}

function visibleDeflectorContextForInput(input: AiDecisionInput) {
  return {
    visibleRemoteServerCount: input.playerView.servers.filter((candidate) =>
      candidate.id.startsWith("remote_"),
    ).length,
    visibleCorpCredits: input.playerView.opponent.credits,
  };
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
