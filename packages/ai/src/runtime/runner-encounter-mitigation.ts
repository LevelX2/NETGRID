import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { pumpStrengthAmountForAction } from "./encounter-action";
import { actionCreditCost } from "./action-cost";
import {
  runnerEncounterCreditBudgetForInput,
  spendRunnerEncounterActionCost,
} from "./runner-encounter-credit-budget";
import { breakSubroutineIndexesForAction } from "./subroutine-indexes";
import { creditsToBreakVisibleSubroutinesWithBreaker } from "../visible-run-analysis";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { projectVisibleDamagePrevention } from "../run-analysis/visible-damage-prevention";
import {
  currentEncounteredIceCard,
  currentEncounterRequiresFullBreak,
  currentEncounterUnbrokenSubroutineIndexes,
} from "./current-encounter";
import { currentEncounterRequiresDamagePreservingBreak } from "./current-encounter-damage";
import { isUnacceptableImmediateSafetyThreatSubroutine } from "./encounter-subroutine";

export type RunnerEncounterLoss = {
  flatline: boolean;
  coreDamage: number;
  damage: number;
  programsTrashed: number;
};

export type RunnerEncounterMitigation = {
  stateVersion: number;
  iceInstanceId: string;
  breakerInstanceId: string;
  subroutineIndexes: number[];
  breakCost: number;
  before: RunnerEncounterLoss;
  after: RunnerEncounterLoss;
};

export function currentEncounterMitigationForAction(
  input: AiDecisionInput,
  action: LegalAction,
):
  | (RunnerEncounterMitigation & {
      actionId: string;
      pumpCost: number;
      supportsCurrentAction: boolean;
    })
  | undefined {
  if (
    (action.type !== "pump_breaker" && action.type !== "break_subroutine") ||
    action.payload?.runnerCostPenaltySupportContinuation === true
  )
    return undefined;
  const breaker = input.playerView.own.rig?.find(
    (card) => card.instanceId === action.source,
  );
  const ice = currentEncounteredIceCard(input);
  if (
    !breaker?.definitionId ||
    typeof breaker.strength !== "number" ||
    !ice?.effectiveRunQuote
  )
    return undefined;
  let strength = breaker.strength;
  let pumpCost = 0;
  if (action.type === "pump_breaker") {
    const gain = pumpStrengthAmountForAction(action, breaker.definitionId);
    if (!gain || gain <= 0) return undefined;
    const pumps = Math.ceil(
      Math.max(0, ice.effectiveRunQuote.effectiveStrength - strength) / gain,
    );
    if (pumps === 0) return undefined;
    strength += pumps * gain;
    pumpCost = pumps * actionCreditCost(action);
  }
  const payment = spendRunnerEncounterActionCost({
    input,
    action,
    budget: runnerEncounterCreditBudgetForInput(input),
    cost: pumpCost,
  });
  if (!payment.affordable) return undefined;
  const mitigation = currentEncounterMitigationForBreaker(
    input,
    breaker,
    strength,
    (cost) =>
      spendRunnerEncounterActionCost({
        input,
        action,
        budget: payment.budget,
        cost,
      }).affordable,
  );
  if (!mitigation) return undefined;
  const supportsCurrentAction =
    action.type === "pump_breaker" ||
    [...breakSubroutineIndexesForAction(action)].some((i) =>
      mitigation.subroutineIndexes.includes(i),
    );
  return {
    ...mitigation,
    actionId: action.actionId,
    pumpCost,
    supportsCurrentAction,
  };
}

/** A bounded current-encounter alternative, consumed by the existing run owner. */
export function currentEncounterMitigationForBreaker(
  input: AiDecisionInput,
  breaker: VisibleCard,
  strength: number,
  canPay: (cost: number) => boolean,
): RunnerEncounterMitigation | undefined {
  const ice = currentEncounteredIceCard(input);
  const quote = ice?.effectiveRunQuote;
  if (
    !ice ||
    !quote ||
    input.playerView.run?.phase !== "encounter_ice" ||
    input.playerView.run.noBreakSubroutinesActive ||
    currentEncounterRequiresFullBreak(input)
  )
    return undefined;
  const unbroken = currentEncounterUnbrokenSubroutineIndexes(input);
  const preserveHand = currentEncounterRequiresDamagePreservingBreak(input);
  const targets = [...unbroken].filter((index) => {
    const s = quote.subroutines[index]!;
    return (
      (s.type === "trash_installed_program" || s.type === "do_damage") &&
      (isUnacceptableImmediateSafetyThreatSubroutine(input, s) || preserveHand)
    );
  });
  if (targets.length === 0) return undefined;
  const before = lossAfterBreak(new Set());
  let best: RunnerEncounterMitigation | undefined;
  // Symmetric subroutines need only their cheapest prefix. Distinct effect
  // families remain separate so prevention and actual surviving programs are
  // compared, rather than counting requested breaks as successful mitigation.
  const families: number[][] = [];
  let previousKey: string | undefined;
  for (const index of targets) {
    const subroutine = quote.subroutines[index]!;
    const key = JSON.stringify([
      subroutine.type,
      subroutine.damageType,
      subroutine.amount,
      subroutine.breakTags,
    ]);
    const previous = families.at(-1);
    if (key === previousKey && previous?.at(-1) === index - 1)
      previous.push(index);
    else families.push([index]);
    previousKey = key;
  }
  let subsets: number[][] = [[]];
  for (const family of families) {
    const next: number[][] = [];
    for (const prior of subsets) {
      for (let count = 0; count <= family.length; count++) {
        const indexes = [...prior, ...family.slice(0, count)].sort(
          (a, b) => a - b,
        );
        if (indexes.length === 0) {
          next.push(indexes);
          continue;
        }
        const assessment = creditsToBreakVisibleSubroutinesWithBreaker(
          breaker,
          ice,
          indexes.map((i) => quote.subroutines[i]!),
          strength,
          quote.breakSubroutineAdditionalCostPerSubroutine ?? 0,
        );
        if (!assessment || !canPay(assessment.cost)) continue;
        // This deterministic line cannot promise preservation through random
        // self-trash, stealth-payment side effects or future-click sacrifice.
        // Those actions retain their existing dedicated risk/payment owner.
        if (
          assessment.conditionalRiskReason ||
          assessment.conditionalAccessReason ||
          assessment.postBreakStealthLosses?.length ||
          assessment.futureClicksLost
        )
          continue;
        next.push(indexes);
        const after = lossAfterBreak(new Set(indexes));
        if (after.flatline) continue;
        if (compareLoss(after, before) >= 0) continue;
        if (
          !best ||
          compareLoss(after, best.after) < 0 ||
          (compareLoss(after, best.after) === 0 &&
            assessment.cost < best.breakCost)
        ) {
          best = {
            stateVersion: input.playerView.stateVersion,
            iceInstanceId: ice.instanceId,
            breakerInstanceId: breaker.instanceId,
            subroutineIndexes: indexes,
            breakCost: assessment.cost,
            before,
            after,
          };
        }
      }
    }
    subsets = next;
  }
  return best;

  function lossAfterBreak(broken: ReadonlySet<number>): RunnerEncounterLoss {
    let pools = {
      netOrCore:
        input.playerView.own.freeNetOrCoreDamagePreventionRemaining ?? 0,
      run: input.playerView.run?.damagePreventionPool?.remaining ?? 0,
    };
    let damage = 0;
    let coreDamage = 0;
    let programsTrashed = 0;
    const programCount = (input.playerView.own.rig ?? []).filter(
      (c) => c.type === "program" || c.installedAsRunnerProgram,
    ).length;
    for (const index of unbroken) {
      if (broken.has(index)) continue;
      const subroutine = quote!.subroutines[index]!;
      if (subroutine.type === "end_the_run") break;
      if (subroutine.type === "trash_installed_program")
        programsTrashed = Math.min(programCount, programsTrashed + 1);
      if (subroutine.type !== "do_damage") continue;
      const amount = subroutine.amount;
      if (!Number.isSafeInteger(amount) || Number(amount) < 0)
        throw new PlanResolutionFailure("missing_action_semantics", {
          side: input.side,
          stateVersion: input.playerView.stateVersion,
          timingPoint: input.playerView.timingPoint,
          legalActionTypes: input.legalActions.map((a) => a.type),
          unresolvedActionIds: [],
          owner: "rules_contract",
          removalCondition:
            "Current encounter mitigation requires the Engine's exact nonnegative direct-damage amount.",
        });
      const result = projectVisibleDamagePrevention(
        Number(amount),
        subroutine.damageType,
        pools,
      );
      pools = { netOrCore: result.netOrCore, run: result.run };
      damage += result.damage;
      if (subroutine.damageType === "core") coreDamage += result.damage;
    }
    return {
      damage,
      coreDamage,
      programsTrashed,
      flatline:
        damage > input.playerView.own.gripOrHq.length ||
        coreDamage > input.playerView.own.maxHandSize,
    };
  }
}

function compareLoss(
  left: RunnerEncounterLoss,
  right: RunnerEncounterLoss,
): number {
  return (
    Number(left.flatline) - Number(right.flatline) ||
    left.coreDamage - right.coreDamage ||
    left.programsTrashed - right.programsTrashed ||
    left.damage - right.damage
  );
}

export function encounterMitigationEvidence(
  mitigation: RunnerEncounterMitigation,
  pumpCost = 0,
): string[] {
  return [
    "encounter_partial_mitigation:true",
    `mitigation_total_cost:${pumpCost + mitigation.breakCost}`,
    `mitigation_break_cost:${mitigation.breakCost}`,
    `mitigation_target_indexes:${mitigation.subroutineIndexes.join(",")}`,
    `mitigation_core_damage_prevented:${mitigation.before.coreDamage - mitigation.after.coreDamage}`,
    `mitigation_programs_preserved:${mitigation.before.programsTrashed - mitigation.after.programsTrashed}`,
    `mitigation_remaining_damage:${mitigation.after.damage}`,
    `mitigation_remaining_program_trashes:${mitigation.after.programsTrashed}`,
  ];
}
