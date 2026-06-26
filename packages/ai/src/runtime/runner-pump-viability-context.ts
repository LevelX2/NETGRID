import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import {
  canBreakerDefinitionBreakIce,
  cardDefinitionStrength,
  creditsToBreakEndTheRunSubroutinesWithBreaker,
  endTheRunSubroutineCount,
} from "../visible-run-analysis";
import { currentEncounteredIceCard } from "./current-encounter";
import {
  breakerIdForEncounterAction,
  pumpStrengthAmountForAction,
} from "./encounter-action";
import {
  isImmediateSafetyThreatSubroutine,
  type VisibleEncounterSubroutine,
} from "./encounter-subroutine";
import type { EncounterRunRemainderEffectAssessment } from "./runner-run-remainder-effect-assessment";

type VisibleServer = AiDecisionInput["playerView"]["servers"][number];

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
    creditsAfterPumpAndBreak: number,
  ) => { blocksPump: boolean; creditsAfterPath: number; evidence: string[] };
  encounterRemotePayoffAfterBreakAssessment: (
    input: AiDecisionInput,
    server: VisibleServer,
    targetSubroutines: VisibleEncounterSubroutine[],
    creditsAfterAccessPath: number,
    remainingCurrentEndRunAfterBreak: number,
  ) => { blocksBreak: boolean; evidence: string[] };
  runnerCreditReserveTarget: (input: AiDecisionInput) => number;
};

export function createRunnerPumpViabilityContext(
  dependencies: RunnerPumpViabilityContextDependencies,
): {
  pumpViabilityAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => { canLeadToBreak: boolean; evidence: string[] };
} {
  const pumpViabilityAssessment = (
    input: AiDecisionInput,
    action: LegalAction,
  ): { canLeadToBreak: boolean; evidence: string[] } => {
    const breaker = dependencies.findVisibleCard(input, action.source);
    const encounteredIce = input.playerView.run?.encounteredIce;
    if (!breaker?.definitionId || !encounteredIce?.definitionId)
      return { canLeadToBreak: true, evidence: [] };
    if (
      !canBreakerDefinitionBreakIce(
        breaker.definitionId,
        encounteredIce.definitionId,
      )
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

    const endTheRunCount = endTheRunSubroutineCount(
      encounteredIce.definitionId,
    );
    const runEffect =
      dependencies.encounterRunRemainderEffectAssessment(input);
    const hasUsefulRunRemainderEffect =
      runEffect.hasRunRemainderEffect &&
      (runEffect.mustBreak ||
        runEffect.futurePathBlocked ||
        runEffect.futureCostDelta > 0);
    const hasImmediateThreat =
      dependencies.encounterHasImmediateUnbrokenThreat(input);
    if (
      endTheRunCount === 0 &&
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
    const requiredStrength =
      encounteredIce.effectiveRunQuote?.effectiveStrength ??
      encounteredIce.strength ??
      cardDefinitionStrength(encounteredIce.definitionId);
    const missingStrength = Math.max(
      0,
      requiredStrength - (breaker.strength ?? 0),
    );
    const requiredPumps = Math.max(1, Math.ceil(missingStrength / pumpAmount));
    const totalPumpCost = requiredPumps * pumpCost;
    const remainingCreditsAfterPumps =
      input.playerView.own.credits - totalPumpCost;
    if (remainingCreditsAfterPumps < 0)
      return {
        canLeadToBreak: false,
        evidence: [
          "pump_cannot_reach_break_strength:true",
          `pump_required_count:${requiredPumps}`,
        ],
      };

    const estimatedBreakCost =
      endTheRunCount > 0 &&
      encounterContinue?.payload?.encounterWillEndRun === true
        ? creditsToBreakEndTheRunSubroutinesWithBreaker(
            breaker,
            encounteredIce,
            endTheRunCount,
            (breaker.strength ?? 0) + requiredPumps * pumpAmount,
          )?.cost
        : dependencies.estimatedEncounterBreakCost(input, action);
    if (
      estimatedBreakCost === undefined ||
      estimatedBreakCost > remainingCreditsAfterPumps
    )
      return {
        canLeadToBreak: false,
        evidence: [
          "pump_cannot_lead_to_useful_break:true",
          `pump_required_count:${requiredPumps}`,
        ],
      };

    const creditsAfterPumpAndBreak =
      remainingCreditsAfterPumps - estimatedBreakCost;
    const run = input.playerView.run;
    const server =
      run?.position?.kind === "ice"
        ? input.playerView.servers.find(
            (candidate) => candidate.id === run.position?.serverId,
          )
        : undefined;
    if (server) {
      const currentQuote = currentEncounteredIceCard(input)?.effectiveRunQuote;
      const hasImmediateSafetyThreat =
        currentQuote?.subroutines.some(isImmediateSafetyThreatSubroutine) ??
        false;
      const futurePath = hasImmediateSafetyThreat
        ? {
            blocksPump: false,
            creditsAfterPath: creditsAfterPumpAndBreak,
            evidence: [] as string[],
          }
        : dependencies.encounterFuturePathAfterPumpBreakAssessment(
            input,
            server,
            creditsAfterPumpAndBreak,
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
        };
    }
    const reserveTarget = dependencies.runnerCreditReserveTarget(input);
    if (
      !runEffect.mustBreak &&
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
      };
    }

    return {
      canLeadToBreak: true,
      evidence: [
        "pump_can_reach_useful_break:true",
        `pump_required_count:${requiredPumps}`,
        ...runEffect.evidence,
      ],
    };
  };

  return { pumpViabilityAssessment };
}
