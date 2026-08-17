import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

import {
  canVisibleBreakerBreakQuotedSubroutines,
  creditsToBreakEndTheRunSubroutinesWithBreaker,
  creditsToBreakVisibleSubroutinesWithBreaker,
  requireEffectiveRunQuoteForKnownRezzedIce,
  type RunnerRunPathCreditBudget,
  visibleDeflectorSubroutineCanResolve,
  visibleRunnerRunPathCreditBudgetForRig,
} from "../visible-run-analysis";
import { currentEncounteredIceCard } from "./current-encounter";
import {
  breakerIdForEncounterAction,
  pumpStrengthAmountForAction,
} from "./encounter-action";
import {
  isEndRunSubroutine,
  isUnacceptableImmediateSafetyThreatSubroutine,
  type VisibleEncounterSubroutine,
} from "./encounter-subroutine";
import type { EncounterRunRemainderEffectAssessment } from "./runner-run-remainder-effect-assessment";
import type {
  RunnerEncounterActionConstraint,
  RunnerEncounterViabilityAssessment,
} from "./runner-encounter-action-exclusion";

type VisibleServer = AiDecisionInput["playerView"]["servers"][number];
type MutableEncounterCreditBudget = Omit<
  Required<RunnerRunPathCreditBudget>,
  "hostedIcebreakerCreditsByBreakerInstanceId"
> & {
  hostedIcebreakerCreditsByBreakerInstanceId: Record<string, number>;
};

export type RunnerPumpViabilityContextDependencies = {
  findVisibleCard: (
    input: AiDecisionInput,
    instanceId: string,
  ) => VisibleCard | undefined;
  encounterRunRemainderEffectAssessment: (
    input: AiDecisionInput,
    action?: LegalAction,
  ) => EncounterRunRemainderEffectAssessment;
  encounterHasImmediateUnbrokenThreat: (input: AiDecisionInput) => boolean;
  actionCreditCost: (action: LegalAction) => number;
  estimatedEncounterBreakCost: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number | undefined;
  encounterFuturePathAfterPumpBreakAssessment: (
    input: AiDecisionInput,
    server: VisibleServer,
    creditBudgetAfterPumpAndBreak: number | RunnerRunPathCreditBudget,
  ) => { blocksPump: boolean; creditsAfterPath: number; evidence: string[] };
  encounterRemotePayoffAfterBreakAssessment: (
    input: AiDecisionInput,
    server: VisibleServer,
    targetSubroutines: VisibleEncounterSubroutine[],
    creditsAfterAccessPath: number,
    remainingCurrentEndRunAfterBreak: number,
  ) => {
    blocksBreak: boolean;
    evidence: string[];
    constraint?: RunnerEncounterActionConstraint;
  };
  runnerCreditReserveTarget: (input: AiDecisionInput) => number;
};

export function createRunnerPumpViabilityContext(
  dependencies: RunnerPumpViabilityContextDependencies,
): {
  pumpViabilityAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerEncounterViabilityAssessment;
} {
  const pumpViabilityAssessment = (
    input: AiDecisionInput,
    action: LegalAction,
  ): RunnerEncounterViabilityAssessment => {
    const breaker = dependencies.findVisibleCard(input, action.source);
    const encounteredIce = input.playerView.run?.encounteredIce;
    if (!breaker?.definitionId || !encounteredIce?.definitionId)
      return { canLeadToBreak: true, evidence: [] };
    const currentQuote = requireEffectiveRunQuoteForKnownRezzedIce(
      currentEncounteredIceCard(input) ?? encounteredIce,
    );
    if (
      !currentQuote ||
      !canVisibleBreakerBreakQuotedSubroutines({
        breaker,
        ice: encounteredIce,
        subroutines: currentQuote.subroutines,
      })
    )
      return {
        canLeadToBreak: false,
        evidence: ["pump_cannot_break_encountered_ice:true"],
      };

    const breakerId = breakerIdForEncounterAction(action);
    const targetIceId =
      typeof action.payload?.iceId === "string"
        ? action.payload.iceId
        : undefined;
    const directBreakIsLegal = input.legalActions.some(
      (candidate) =>
        candidate.type === "break_subroutine" &&
        breakerIdForEncounterAction(candidate) === breakerId &&
        (!targetIceId || candidate.payload?.iceId === targetIceId),
    );
    if (directBreakIsLegal)
      return {
        canLeadToBreak: false,
        evidence: ["pump_direct_break_already_legal:true"],
      };

    const encounterContinue = input.legalActions.find(
      (candidate) =>
        candidate.type === "continue_run" &&
        candidate.payload?.encounterContinue === true,
    );
    if (encounterContinue?.payload?.unbrokenSubroutineCount === 0)
      return {
        canLeadToBreak: false,
        evidence: ["pump_no_unbroken_subroutines:true"],
      };
    if (
      typeof breaker.strength === "number" &&
      typeof encounteredIce.strength === "number" &&
      breaker.strength >= encounteredIce.strength
    )
      return {
        canLeadToBreak: false,
        evidence: ["pump_strength_already_sufficient:true"],
      };

    const endTheRunCount = currentQuote.subroutines.filter(
      (subroutine) => subroutine.type === "end_the_run",
    ).length;
    const deflectorContext = {
      visibleRemoteServerCount: input.playerView.servers.filter((candidate) =>
        candidate.id.startsWith("remote_"),
      ).length,
      visibleCorpCredits: input.playerView.opponent.credits,
    };
    const accessRedirectCount = currentQuote.subroutines.filter((subroutine) =>
      visibleDeflectorSubroutineCanResolve(subroutine, deflectorContext),
    ).length;
    const runEffect = dependencies.encounterRunRemainderEffectAssessment(input);
    const hasUsefulRunRemainderEffect =
      runEffect.hasRunRemainderEffect &&
      (runEffect.mustBreak ||
        runEffect.futurePathBlocked ||
        runEffect.futureCostDelta > 0);
    const hasImmediateThreat =
      dependencies.encounterHasImmediateUnbrokenThreat(input);
    if (
      endTheRunCount === 0 &&
      accessRedirectCount === 0 &&
      !hasUsefulRunRemainderEffect &&
      !hasImmediateThreat
    ) {
      return {
        canLeadToBreak: false,
        evidence: [
          "pump_cannot_lead_to_useful_break:true",
          ...runEffect.evidence,
        ],
      };
    }

    const pumpCost = dependencies.actionCreditCost(action);
    const pumpAmount = pumpStrengthAmountForAction(
      action,
      breaker.definitionId,
    );
    if (pumpCost < 0 || pumpAmount <= 0)
      return {
        canLeadToBreak: false,
        evidence: ["pump_cannot_reach_break_strength:true"],
      };
    const requiredStrength = currentQuote.effectiveStrength;
    const missingStrength = Math.max(
      0,
      requiredStrength - (breaker.strength ?? 0),
    );
    const requiredPumps = Math.max(1, Math.ceil(missingStrength / pumpAmount));
    const totalPumpCost = requiredPumps * pumpCost;
    const pumpPayment = spendIcebreakerCredits(
      encounterCreditBudget(input),
      breaker,
      totalPumpCost,
    );
    if (!pumpPayment.affordable)
      return {
        canLeadToBreak: false,
        evidence: [
          "pump_cannot_reach_break_strength:true",
          `pump_required_count:${requiredPumps}`,
        ],
      };

    const requiredBreakCount =
      currentQuote?.subroutines.filter(
        (subroutine) =>
          isUnacceptableImmediateSafetyThreatSubroutine(input, subroutine) ||
          visibleDeflectorSubroutineCanResolve(subroutine, deflectorContext) ||
          (encounterContinue?.payload?.encounterWillEndRun === true &&
            isEndRunSubroutine(subroutine)),
      ).length ??
      (encounterContinue?.payload?.encounterWillEndRun === true
        ? endTheRunCount
        : 0);
    const requiredBreakSubroutines = currentQuote?.subroutines.filter(
      (subroutine) =>
        isUnacceptableImmediateSafetyThreatSubroutine(input, subroutine) ||
        visibleDeflectorSubroutineCanResolve(subroutine, deflectorContext) ||
        (encounterContinue?.payload?.encounterWillEndRun === true &&
          isEndRunSubroutine(subroutine)),
    );
    const estimatedBreakCost = requiredBreakSubroutines?.length
      ? creditsToBreakVisibleSubroutinesWithBreaker(
          breaker,
          encounteredIce,
          requiredBreakSubroutines,
          (breaker.strength ?? 0) + requiredPumps * pumpAmount,
        )?.cost
      : requiredBreakCount > 0
        ? creditsToBreakEndTheRunSubroutinesWithBreaker(
            breaker,
            encounteredIce,
            requiredBreakCount,
            (breaker.strength ?? 0) + requiredPumps * pumpAmount,
          )?.cost
        : dependencies.estimatedEncounterBreakCost(input, action);
    if (
      estimatedBreakCost === undefined ||
      !spendIcebreakerCredits(pumpPayment.budget, breaker, estimatedBreakCost)
        .affordable
    )
      return {
        canLeadToBreak: false,
        evidence: [
          "pump_cannot_lead_to_useful_break:true",
          `pump_required_count:${requiredPumps}`,
        ],
      };

    const breakPayment = spendIcebreakerCredits(
      pumpPayment.budget,
      breaker,
      estimatedBreakCost,
    );
    const creditsAfterPumpAndBreak = breakPayment.budget.credits;
    const pumpAndBreakCost = totalPumpCost + estimatedBreakCost;
    if (
      runEffect.hasRunRemainderEffect &&
      !runEffect.mustBreak &&
      !runEffect.futurePathBlocked &&
      endTheRunCount === 0 &&
      accessRedirectCount === 0 &&
      !hasImmediateThreat &&
      runEffect.futureCostDelta <= pumpAndBreakCost
    ) {
      return {
        canLeadToBreak: false,
        evidence: [
          "pump_break_cost_not_better_than_unbroken_effect:true",
          `pump_and_break_cost:${pumpAndBreakCost}`,
          `unbroken_effect_future_cost:${runEffect.futureCostDelta}`,
          `pump_required_count:${requiredPumps}`,
          ...runEffect.evidence,
        ],
      };
    }
    const run = input.playerView.run;
    const server =
      run?.position?.kind === "ice"
        ? input.playerView.servers.find(
            (candidate) => candidate.id === run.position?.serverId,
          )
        : undefined;
    if (server) {
      const hasImmediateSafetyThreat =
        currentQuote?.subroutines.some((subroutine) =>
          isUnacceptableImmediateSafetyThreatSubroutine(input, subroutine),
        ) ?? false;
      const futurePath = hasImmediateSafetyThreat
        ? {
            blocksPump: false,
            creditsAfterPath: creditsAfterPumpAndBreak,
            evidence: [] as string[],
          }
        : dependencies.encounterFuturePathAfterPumpBreakAssessment(
            input,
            server,
            breakPayment.budget,
          );
      if (futurePath.blocksPump)
        return {
          canLeadToBreak: false,
          evidence: [
            ...futurePath.evidence,
            `pump_credits_after_break:${creditsAfterPumpAndBreak}`,
            `pump_required_count:${requiredPumps}`,
          ],
        };
      const remotePayoff =
        dependencies.encounterRemotePayoffAfterBreakAssessment(
          input,
          server,
          currentQuote?.subroutines ?? [],
          futurePath.creditsAfterPath,
          0,
        );
      if (remotePayoff.blocksBreak)
        return {
          canLeadToBreak: false,
          evidence: [
            ...remotePayoff.evidence,
            `pump_credits_after_break:${creditsAfterPumpAndBreak}`,
            `pump_required_count:${requiredPumps}`,
          ],
          ...(remotePayoff.constraint
            ? { constraint: remotePayoff.constraint }
            : {}),
        };
    }
    const reserveTarget = dependencies.runnerCreditReserveTarget(input);
    if (
      !runEffect.mustBreak &&
      accessRedirectCount === 0 &&
      !hasImmediateThreat &&
      creditsAfterPumpAndBreak < Math.max(2, reserveTarget - 1)
    ) {
      return {
        canLeadToBreak: false,
        evidence: [
          "pump_would_destroy_access_reserve:true",
          `pump_credits_after_break:${creditsAfterPumpAndBreak}`,
          `pump_reserve_target:${reserveTarget}`,
        ],
        constraint: "turn_reserve",
      };
    }

    return {
      canLeadToBreak: true,
      evidence: [
        "pump_can_reach_useful_break:true",
        `pump_required_count:${requiredPumps}`,
        `pump_restricted_credits_spent:${pumpPayment.restrictedSpent}`,
        `break_restricted_credits_spent:${breakPayment.restrictedSpent}`,
        ...runEffect.evidence,
      ],
    };
  };

  return { pumpViabilityAssessment };
}

function encounterCreditBudget(
  input: AiDecisionInput,
): MutableEncounterCreditBudget {
  const visiblePools = visibleRunnerRunPathCreditBudgetForRig(
    input.playerView.own.rig ?? [],
  );
  return {
    credits: normalizeCreditAmount(input.playerView.own.credits),
    icebreakerCredits: visiblePools.icebreakerCredits,
    nonNoisyIcebreakerCredits: visiblePools.nonNoisyIcebreakerCredits,
    nonStealthNonNoisyIcebreakerCredits:
      visiblePools.nonStealthNonNoisyIcebreakerCredits,
    killerCredits: visiblePools.killerCredits,
    stealthNonNoisyIcebreakerCredits:
      visiblePools.stealthNonNoisyIcebreakerCredits,
    stealthCreditsBySourceId: { ...visiblePools.stealthCreditsBySourceId },
    hostedIcebreakerCreditsByBreakerInstanceId: {
      ...visiblePools.hostedIcebreakerCreditsByBreakerInstanceId,
    },
  };
}

function spendIcebreakerCredits(
  budget: MutableEncounterCreditBudget,
  breaker: VisibleCard,
  cost: number,
): {
  affordable: boolean;
  budget: MutableEncounterCreditBudget;
  restrictedSpent: number;
} {
  const next = {
    ...budget,
    hostedIcebreakerCreditsByBreakerInstanceId: {
      ...budget.hostedIcebreakerCreditsByBreakerInstanceId,
    },
    stealthCreditsBySourceId: { ...budget.stealthCreditsBySourceId },
  };
  let remaining = normalizeCreditAmount(cost);
  let restrictedSpent = 0;
  const hostedCredits = Math.min(
    next.hostedIcebreakerCreditsByBreakerInstanceId[breaker.instanceId] ?? 0,
    remaining,
  );
  next.hostedIcebreakerCreditsByBreakerInstanceId[breaker.instanceId] =
    Math.max(
      0,
      (next.hostedIcebreakerCreditsByBreakerInstanceId[breaker.instanceId] ??
        0) - hostedCredits,
    );
  remaining -= hostedCredits;
  restrictedSpent += hostedCredits;
  const spendRestricted = (key: "icebreakerCredits" | "killerCredits") => {
    const spent = Math.min(next[key], remaining);
    next[key] -= spent;
    remaining -= spent;
    restrictedSpent += spent;
  };
  if (breakerHasSubtype(breaker, "killer")) spendRestricted("killerCredits");
  if (!breakerHasSubtype(breaker, "noisy")) {
    const ordinarySpent = Math.min(
      next.nonStealthNonNoisyIcebreakerCredits,
      remaining,
    );
    next.nonStealthNonNoisyIcebreakerCredits -= ordinarySpent;
    next.nonNoisyIcebreakerCredits -= ordinarySpent;
    remaining -= ordinarySpent;
    restrictedSpent += ordinarySpent;
    for (const sourceId of Object.keys(next.stealthCreditsBySourceId).sort()) {
      const spent = Math.min(
        next.stealthCreditsBySourceId[sourceId] ?? 0,
        remaining,
      );
      next.stealthCreditsBySourceId[sourceId] =
        (next.stealthCreditsBySourceId[sourceId] ?? 0) - spent;
      next.stealthNonNoisyIcebreakerCredits -= spent;
      next.nonNoisyIcebreakerCredits -= spent;
      remaining -= spent;
      restrictedSpent += spent;
      if (remaining === 0) break;
    }
  }
  spendRestricted("icebreakerCredits");
  const cashSpent = Math.min(next.credits, remaining);
  next.credits -= cashSpent;
  remaining -= cashSpent;
  return {
    affordable: remaining === 0,
    budget: next,
    restrictedSpent,
  };
}

function breakerHasSubtype(breaker: VisibleCard, subtype: string): boolean {
  return (breaker.subtypes ?? []).some(
    (candidate) => subtypeKey(candidate) === subtype,
  );
}

function subtypeKey(subtype: string): string {
  return subtype
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeCreditAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
